import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type NextFunction, type Request, type Response } from 'express';
import { toPublicQuotaSummary, type SubscriptionPlanId, type VerifiedPaymentEvent } from './app/ai/quota';
import type { AiExplorerContext } from './app/ai/navigator-contract';
import {
  AI_MODEL_NAME,
  applyVerifiedPaymentToLedger,
  defaultBillingAdapter,
  executeAiNavigationTurn,
  getOrCreateAccount,
  getPublicPlansCatalog,
  getWebhookSecret,
  isProductionMode,
  isSubscriptionRequiredByDefault,
  signWebhookPayload,
  verifyAccountToken,
  verifyWebhookSignature,
} from './server/ai-store';

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 3000) || 3000;
const SESSION_COOKIE_NAME = 'a360_ai_sid';

interface RawBodyRequest extends Request {
  rawBody?: string;
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) {
      try {
        out[key] = decodeURIComponent(val);
      } catch {
        out[key] = val;
      }
    }
  }
  return out;
}

function setSessionCookie(res: Response, signedToken: string): void {
  const cookieAttrs = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(signedToken)}`,
    'Path=/',
    'Max-Age=2592000',
    'HttpOnly',
    'Secure',
    'SameSite=None',
    'Partitioned',
  ];
  res.setHeader('Set-Cookie', cookieAttrs.join('; '));
}

function resolveAuthenticatedAccount(req: Request): {
  accountId: string;
  bearerToken: string;
  shouldSetCookie: boolean;
} {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
    const verified = verifyAccountToken(authHeader.slice(7).trim());
    if (verified) {
      const { account, bearerToken } = getOrCreateAccount(verified.accountId);
      return { accountId: account.accountId, bearerToken, shouldSetCookie: false };
    }
  }

  const cookies = parseCookies(req.headers.cookie);
  const verifiedCookie = verifyAccountToken(cookies[SESSION_COOKIE_NAME]);
  if (verifiedCookie) {
    const { account, bearerToken } = getOrCreateAccount(verifiedCookie.accountId);
    return { accountId: account.accountId, bearerToken, shouldSetCookie: false };
  }

  const { account, bearerToken } = getOrCreateAccount();
  return { accountId: account.accountId, bearerToken, shouldSetCookie: true };
}

function verifySameOriginOrHeader(req: Request, res: Response, next: NextFunction): void {
  const customHeader = req.headers['x-requested-with'];
  if (customHeader === 'Anatomy360') {
    next();
    return;
  }
  const origin = req.headers.origin;
  const host = (req.headers['x-forwarded-host'] as string | undefined) || req.headers.host;
  if (origin && host) {
    try {
      const parsedOrigin = new URL(origin);
      if (parsedOrigin.host === host) {
        next();
        return;
      }
    } catch {
      // Fall through to reject
    }
  }
  res.status(403).json({
    ok: false,
    code: 'FORBIDDEN_ORIGIN',
    error: 'Origin validation failed for state-changing AI request.',
  });
}

async function startServer() {
  const app = express();
  app.set('trust proxy', true);

  app.use(
    express.json({
      limit: '256kb',
      verify: (req, _res, buf) => {
        (req as RawBodyRequest).rawBody = buf.toString('utf8');
      },
    }),
  );

  // Health & config status (never returns API keys or secrets)
  app.get('/api/ai/health', (_req, res) => {
    res.json({
      ok: true,
      model: AI_MODEL_NAME,
      keyConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
      requireSubscription: isSubscriptionRequiredByDefault(),
      devPreviewEligible: !isProductionMode(),
    });
  });

  // Retrieve or initialize user's server-metered AI entitlement & plan catalog
  app.get('/api/ai/entitlement', (req, res) => {
    const resolved = resolveAuthenticatedAccount(req);
    if (resolved.shouldSetCookie) {
      setSessionCookie(res, resolved.bearerToken);
    }
    const { account } = getOrCreateAccount(resolved.accountId);
    res.json({
      ok: true,
      bearerToken: resolved.bearerToken,
      keyConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
      devPreviewEligible: !isProductionMode(),
      account: toPublicQuotaSummary(account),
      plans: getPublicPlansCatalog(),
    });
  });

  // Execute AI Study & 3D Navigation turn
  app.post('/api/ai/navigate', verifySameOriginOrHeader, async (req, res) => {
    const resolved = resolveAuthenticatedAccount(req);
    if (resolved.shouldSetCookie) {
      setSessionCookie(res, resolved.bearerToken);
    }

    const body = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    if (!prompt || prompt.length > 600) {
      res.status(400).json({
        ok: false,
        code: 'INVALID_PROMPT',
        error: 'Prompt must be between 1 and 600 characters.',
      });
      return;
    }

    const rawCtx = body.context && typeof body.context === 'object' ? (body.context as Record<string, unknown>) : {};
    const context: AiExplorerContext = {
      anatomySex: rawCtx.anatomySex === 'female' ? 'female' : 'male',
      selectedConceptId: typeof rawCtx.selectedConceptId === 'string' ? rawCtx.selectedConceptId.slice(0, 40) : null,
      selectedConceptName: typeof rawCtx.selectedConceptName === 'string' ? rawCtx.selectedConceptName.slice(0, 120) : null,
      visibleSystems: Array.isArray(rawCtx.visibleSystems)
        ? rawCtx.visibleSystems.filter((s): s is AiExplorerContext['visibleSystems'][number] => typeof s === 'string').slice(0, 15)
        : [],
      studyTrack: typeof rawCtx.studyTrack === 'string' ? rawCtx.studyTrack.slice(0, 60) : undefined,
      candidateConcepts: Array.isArray(rawCtx.candidateConcepts)
        ? rawCtx.candidateConcepts
            .filter(
              (c): c is { id: string; name: string } =>
                Boolean(c && typeof c === 'object' && typeof (c as { id?: unknown }).id === 'string' && typeof (c as { name?: unknown }).name === 'string'),
            )
            .slice(0, 20)
        : [],
    };

    const history = Array.isArray(body.history)
      ? body.history
          .filter(
            (h): h is { role: 'user' | 'assistant'; text: string } =>
              Boolean(
                h &&
                  typeof h === 'object' &&
                  ((h as { role?: unknown }).role === 'user' || (h as { role?: unknown }).role === 'assistant') &&
                  typeof (h as { text?: unknown }).text === 'string',
              ),
          )
          .slice(-4)
      : [];

    const result = await executeAiNavigationTurn({
      accountId: resolved.accountId,
      prompt,
      history,
      context,
    });

    res.status(result.status).json({
      ok: result.ok,
      bearerToken: resolved.bearerToken,
      code: result.code,
      error: result.error,
      payload: result.payload,
      usage: result.usage,
      account: result.quota,
    });
  });

  // Pluggable checkout intent for on-the-spot quota purchase after payment
  app.post('/api/ai/checkout-intent', verifySameOriginOrHeader, (req, res) => {
    const resolved = resolveAuthenticatedAccount(req);
    if (resolved.shouldSetCookie) {
      setSessionCookie(res, resolved.bearerToken);
    }

    const body = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};
    const planId = typeof body.planId === 'string' ? (body.planId as SubscriptionPlanId) : null;
    if (!planId || (planId !== 'student_monthly' && planId !== 'exam_prep_pack')) {
      res.status(400).json({
        ok: false,
        code: 'INVALID_PLAN',
        error: 'Select a valid purchasable plan (student_monthly or exam_prep_pack).',
      });
      return;
    }

    const host = (req.headers['x-forwarded-host'] as string | undefined) || req.headers.host || 'localhost:3000';
    const proto = (req.headers['x-forwarded-proto'] as string | undefined) || 'http';
    const session = defaultBillingAdapter.createCheckoutSession({
      accountId: resolved.accountId,
      planId,
      originUrl: `${proto}://${host}`,
    });

    res.json({
      ok: true,
      bearerToken: resolved.bearerToken,
      session,
    });
  });

  // Signed Billing Webhook: ONLY verified payment confirmations mint user quota
  app.post('/api/ai/billing/webhook', (req: RawBodyRequest, res) => {
    const { secret, configuredViaEnv } = getWebhookSecret();
    if (isProductionMode() && !configuredViaEnv) {
      res.status(503).json({
        ok: false,
        code: 'WEBHOOK_SECRET_MISSING',
        error: 'AI_BILLING_WEBHOOK_SECRET must be configured in production.',
      });
      return;
    }

    const rawBody = req.rawBody ?? JSON.stringify(req.body ?? {});
    const signatureHeader = req.headers['x-a360-webhook-signature'] as string | undefined;
    if (!verifyWebhookSignature(rawBody, signatureHeader, secret)) {
      res.status(401).json({
        ok: false,
        code: 'INVALID_WEBHOOK_SIGNATURE',
        error: 'Webhook HMAC signature verification failed.',
      });
      return;
    }

    const body = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};
    const payment: VerifiedPaymentEvent = {
      provider: typeof body.provider === 'string' ? body.provider : 'billing_webhook',
      providerEventId: typeof body.providerEventId === 'string' ? body.providerEventId : '',
      accountId: typeof body.accountId === 'string' ? body.accountId : '',
      planId: typeof body.planId === 'string' ? (body.planId as SubscriptionPlanId) : 'student_monthly',
      status: body.status === 'paid' ? 'paid' : body.status === 'refunded' ? 'refunded' : 'failed',
      amountUsdCents: typeof body.amountUsdCents === 'number' ? body.amountUsdCents : 0,
      paidAt: typeof body.paidAt === 'number' ? body.paidAt : Date.now(),
    };

    const result = applyVerifiedPaymentToLedger(payment);
    if (!result.ok) {
      res.status(400).json({ ok: false, code: 'PROVISION_REJECTED', error: result.error });
      return;
    }

    res.json({
      ok: true,
      provisioned: !result.alreadyProcessed,
      alreadyProcessed: result.alreadyProcessed,
      transactionId: result.transactionId,
      account: result.summary,
    });
  });

  // Local dev-preview only: exercises the exact HMAC-signed webhook provisioning pipeline
  app.post('/api/ai/dev/activate-preview-pack', verifySameOriginOrHeader, (req, res) => {
    if (isProductionMode()) {
      res.status(403).json({
        ok: false,
        code: 'FORBIDDEN_IN_PRODUCTION',
        error: 'Preview webhook activation is disabled in production; use verified external payment webhooks.',
      });
      return;
    }

    const resolved = resolveAuthenticatedAccount(req);
    if (resolved.shouldSetCookie) {
      setSessionCookie(res, resolved.bearerToken);
    }

    const body = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};
    const planId = typeof body.planId === 'string' ? (body.planId as SubscriptionPlanId) : 'student_monthly';
    if (planId !== 'student_monthly' && planId !== 'exam_prep_pack') {
      res.status(400).json({ ok: false, error: 'Invalid planId.' });
      return;
    }

    const plan = getPublicPlansCatalog().find((p) => p.id === planId)!;
    const eventPayload: VerifiedPaymentEvent = {
      provider: 'dev_preview_webhook',
      providerEventId: `evt_dev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      accountId: resolved.accountId,
      planId: plan.id,
      status: 'paid',
      amountUsdCents: plan.priceUsdCents,
      paidAt: Date.now(),
    };

    const raw = JSON.stringify(eventPayload);
    const { secret } = getWebhookSecret();
    const signature = signWebhookPayload(raw, secret);
    if (!verifyWebhookSignature(raw, signature, secret)) {
      res.status(500).json({ ok: false, error: 'Internal HMAC verification mismatch.' });
      return;
    }

    const result = applyVerifiedPaymentToLedger(eventPayload);
    if (!result.ok) {
      res.status(400).json({ ok: false, error: result.error });
      return;
    }

    res.json({
      ok: true,
      bearerToken: resolved.bearerToken,
      previewMode: true,
      transactionId: result.transactionId,
      account: result.summary,
    });
  });

  // Serve Vite in development or static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(ROOT_DIR, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Anatomy 360 server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
