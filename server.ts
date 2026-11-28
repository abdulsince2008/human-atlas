import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
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
import { getAsyncBillingStore } from './server/billing-store';
import { verifyFirebaseIdToken } from './server/firebase-token';
import { isCloudSqlConfigured } from './src/db/index.ts';
import { getOrCreateUser } from './src/db/users.ts';
import {
  createHostedPortalSession,
  createWhopCheckoutConfiguration,
  getCommercialRuntimeSnapshot,
  signBillingWebhook,
  verifyAndProcessBillingWebhook,
  type PriceCatalogTarget,
} from './server/billing-service';

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 3000) || 3000;
const SESSION_COOKIE_NAME = 'a360_ai_sid';
const SANDBOX_FALLBACK_WEBHOOK_SECRET =
  process.env.BILLING_WEBHOOK_SECRET?.trim() || crypto.randomBytes(32).toString('hex');

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

async function resolveAuthenticatedAccountWithFirebase(req: Request): Promise<{
  accountId: string;
  bearerToken: string;
  shouldSetCookie: boolean;
  firebaseUid: string | null;
}> {
  const fbToken =
    typeof req.headers['x-firebase-id-token'] === 'string'
      ? req.headers['x-firebase-id-token']
      : undefined;
  const verifiedFb = fbToken ? await verifyFirebaseIdToken(fbToken) : null;
  const fbUid = verifiedFb?.uid ?? null;
  const fbEmail = verifiedFb?.email ?? null;

  if (fbUid && fbEmail && isCloudSqlConfigured()) {
    try {
      await getOrCreateUser(fbUid, fbEmail);
    } catch (err) {
      console.error('Failed to upsert Firebase user into Cloud SQL:', err);
    }
  }

  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
    const verified = verifyAccountToken(authHeader.slice(7).trim());
    if (verified) {
      const { account, bearerToken } = await getOrCreateAccount(verified.accountId, {
        firebaseUid: fbUid,
        customerEmail: fbEmail,
      });
      return {
        accountId: account.accountId,
        bearerToken,
        shouldSetCookie: false,
        firebaseUid: fbUid,
      };
    }
  }

  const cookies = parseCookies(req.headers.cookie);
  const verifiedCookie = verifyAccountToken(cookies[SESSION_COOKIE_NAME]);
  if (verifiedCookie) {
    const { account, bearerToken } = await getOrCreateAccount(verifiedCookie.accountId, {
      firebaseUid: fbUid,
      customerEmail: fbEmail,
    });
    return {
      accountId: account.accountId,
      bearerToken,
      shouldSetCookie: false,
      firebaseUid: fbUid,
    };
  }

  const { account, bearerToken } = await getOrCreateAccount(undefined, {
    firebaseUid: fbUid,
    customerEmail: fbEmail,
  });
  return {
    accountId: account.accountId,
    bearerToken,
    shouldSetCookie: true,
    firebaseUid: fbUid,
  };
}

async function resolveAuthenticatedAccount(req: Request): Promise<{
  accountId: string;
  bearerToken: string;
  shouldSetCookie: boolean;
}> {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
    const verified = verifyAccountToken(authHeader.slice(7).trim());
    if (verified) {
      const { account, bearerToken } = await getOrCreateAccount(verified.accountId);
      return { accountId: account.accountId, bearerToken, shouldSetCookie: false };
    }
  }

  const cookies = parseCookies(req.headers.cookie);
  const verifiedCookie = verifyAccountToken(cookies[SESSION_COOKIE_NAME]);
  if (verifiedCookie) {
    const { account, bearerToken } = await getOrCreateAccount(verifiedCookie.accountId);
    return { accountId: account.accountId, bearerToken, shouldSetCookie: false };
  }

  const { account, bearerToken } = await getOrCreateAccount();
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
      youtubeKeyConfigured: Boolean(process.env.YOUTUBE_API_KEY?.trim()),
      requireSubscription: isSubscriptionRequiredByDefault(),
      devPreviewEligible: !isProductionMode(),
    });
  });

  // Optional server-side YouTube Educational Search Proxy (cached & quota-guarded)
  const ytSearchCache = new Map<string, { at: number; items: unknown[] }>();
  let ytWindowResetAt = Date.now() + 3_600_000;
  let ytRequestsInWindow = 0;

  app.get('/api/youtube/search', async (req, res) => {
    const rawQuery = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (rawQuery.length < 2 || rawQuery.length > 120) {
      res.status(400).json({
        ok: false,
        configured: Boolean(process.env.YOUTUBE_API_KEY?.trim()),
        code: 'INVALID_QUERY',
        error: 'Search query must be between 2 and 120 characters.',
        items: [],
      });
      return;
    }

    const apiKey = process.env.YOUTUBE_API_KEY?.trim();
    if (!apiKey) {
      res.json({
        ok: true,
        configured: false,
        items: [],
        notice:
          'Server-side YOUTUBE_API_KEY is not configured. Showing curated verified lectures and direct YouTube search fallback.',
      });
      return;
    }

    const normalizedKey = rawQuery.toLowerCase();
    const cached = ytSearchCache.get(normalizedKey);
    if (cached && Date.now() - cached.at < 15 * 60_000) {
      res.json({ ok: true, configured: true, cached: true, items: cached.items });
      return;
    }

    if (Date.now() > ytWindowResetAt) {
      ytWindowResetAt = Date.now() + 3_600_000;
      ytRequestsInWindow = 0;
    }
    if (ytRequestsInWindow >= 45) {
      res.status(429).json({
        ok: false,
        configured: true,
        code: 'QUOTA_GUARD',
        error: 'Hourly YouTube API proxy quota safeguard reached. Use curated lectures or direct YouTube search.',
        items: [],
      });
      return;
    }
    ytRequestsInWindow += 1;

    try {
      const eduQuery = `${rawQuery} anatomy physiology medical education`;
      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('type', 'video');
      url.searchParams.set('videoEmbeddable', 'true');
      url.searchParams.set('safeSearch', 'strict');
      url.searchParams.set('relevanceLanguage', 'en');
      url.searchParams.set('maxResults', '4');
      url.searchParams.set('q', eduQuery);
      url.searchParams.set('key', apiKey);

      const ytRes = await fetch(url.toString());
      if (!ytRes.ok) {
        res.status(502).json({
          ok: false,
          configured: true,
          code: 'UPSTREAM_ERROR',
          error: `YouTube Data API returned status ${ytRes.status}.`,
          items: [],
        });
        return;
      }

      const data = (await ytRes.json()) as {
        items?: {
          id?: { videoId?: string };
          snippet?: { title?: string; channelTitle?: string; description?: string; publishedAt?: string };
        }[];
      };

      const items = (data.items ?? [])
        .map((it) => {
          const vid = it.id?.videoId ?? '';
          if (!/^[A-Za-z0-9_-]{11}$/.test(vid)) return null;
          return {
            youtubeId: vid,
            title: String(it.snippet?.title ?? 'Educational Lecture'),
            channelTitle: String(it.snippet?.channelTitle ?? 'YouTube'),
            description: String(it.snippet?.description ?? '').slice(0, 220),
            watchUrl: `https://www.youtube.com/watch?v=${vid}`,
            embedUrl: `https://www.youtube-nocookie.com/embed/${vid}?rel=0`,
          };
        })
        .filter(Boolean);

      if (ytSearchCache.size > 100) ytSearchCache.clear();
      ytSearchCache.set(normalizedKey, { at: Date.now(), items });

      res.json({ ok: true, configured: true, cached: false, items });
    } catch {
      res.status(502).json({
        ok: false,
        configured: true,
        code: 'NETWORK_ERROR',
        error: 'Unable to reach YouTube Data API.',
        items: [],
      });
    }
  });

  // Retrieve or initialize user's server-metered AI entitlement & plan catalog
  app.get('/api/ai/entitlement', async (req, res) => {
    try {
      const resolved = await resolveAuthenticatedAccount(req);
      if (resolved.shouldSetCookie) {
        setSessionCookie(res, resolved.bearerToken);
      }
      const { account } = await getOrCreateAccount(resolved.accountId);
      res.json({
        ok: true,
        bearerToken: resolved.bearerToken,
        keyConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
        devPreviewEligible: !isProductionMode(),
        account: toPublicQuotaSummary(account),
        plans: getPublicPlansCatalog(),
      });
    } catch (error) {
      console.error('Failed to retrieve AI entitlement:', error);
      res.status(500).json({ ok: false, code: 'AI_STORE_ERROR', error: 'Unable to load AI quota status.' });
    }
  });

  // Execute AI Study & 3D Navigation turn
  app.post('/api/ai/navigate', verifySameOriginOrHeader, async (req, res) => {
    try {
      const resolved = await resolveAuthenticatedAccount(req);
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
    } catch (error) {
      console.error('Failed to execute AI navigation turn:', error);
      res.status(500).json({ ok: false, code: 'AI_STORE_ERROR', error: 'Unable to process AI navigation request.' });
    }
  });

  // Pluggable checkout intent for on-the-spot quota purchase after payment
  app.post('/api/ai/checkout-intent', verifySameOriginOrHeader, async (req, res) => {
    try {
      const resolved = await resolveAuthenticatedAccount(req);
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
    } catch (error) {
      console.error('Failed to create AI checkout intent:', error);
      res.status(500).json({ ok: false, code: 'AI_STORE_ERROR', error: 'Unable to create checkout intent.' });
    }
  });

  // Signed Billing Webhook: ONLY verified payment confirmations mint user quota
  app.post('/api/ai/billing/webhook', async (req: RawBodyRequest, res) => {
    try {
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

      const result = await applyVerifiedPaymentToLedger(payment);
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
    } catch (error) {
      console.error('Failed to process AI billing webhook:', error);
      res.status(500).json({ ok: false, code: 'BILLING_STORE_ERROR', error: 'Unable to record AI billing webhook.' });
    }
  });

  // Local dev-preview only: exercises the exact HMAC-signed webhook provisioning pipeline
  app.post('/api/ai/dev/activate-preview-pack', verifySameOriginOrHeader, async (req, res) => {
    try {
      if (isProductionMode()) {
        res.status(403).json({
          ok: false,
          code: 'FORBIDDEN_IN_PRODUCTION',
          error: 'Preview webhook activation is disabled in production; use verified external payment webhooks.',
        });
        return;
      }

      const resolved = await resolveAuthenticatedAccount(req);
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

      const result = await applyVerifiedPaymentToLedger(eventPayload);
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
    } catch (error) {
      console.error('Failed to activate preview AI pack:', error);
      res.status(500).json({ ok: false, code: 'BILLING_STORE_ERROR', error: 'Unable to activate preview pack.' });
    }
  });

  // ---------------------------------------------------------------------------
  // Provider-Agnostic Commercial Billing & Durable Entitlements API
  // ---------------------------------------------------------------------------

  app.get('/api/billing/config', (_req, res) => {
    const snapshot = getCommercialRuntimeSnapshot();
    const publicClientToken = process.env.BILLING_CLIENT_TOKEN?.trim() || null;
    res.json({
      ok: true,
      snapshot,
      clientToken: publicClientToken,
      devSandboxAllowed: !isProductionMode(),
    });
  });

  app.get('/api/billing/entitlements', async (req, res) => {
    try {
      const resolved = await resolveAuthenticatedAccountWithFirebase(req);
      if (resolved.shouldSetCookie) {
        setSessionCookie(res, resolved.bearerToken);
      }
      const store = await getAsyncBillingStore();
      const record = (await store.getAccount(resolved.accountId))!;
      res.json({
        ok: true,
        bearerToken: resolved.bearerToken,
        entitlement: await store.toPublicEntitlementSummary(record),
      });
    } catch (error) {
      console.error('Failed to load billing entitlements:', error);
      res.status(500).json({ ok: false, code: 'BILLING_STORE_ERROR', error: 'Unable to load billing entitlements.' });
    }
  });

  app.post('/api/billing/checkout-intent', verifySameOriginOrHeader, async (req, res) => {
    try {
      const resolved = await resolveAuthenticatedAccountWithFirebase(req);
      if (resolved.shouldSetCookie) {
        setSessionCookie(res, resolved.bearerToken);
      }

      const body = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};
      const planId = typeof body.planId === 'string' ? body.planId : '';
      const interval = body.interval === 'annual' ? 'annual' : body.interval === 'none' ? 'none' : 'monthly';
      const snapshot = getCommercialRuntimeSnapshot();

      if (
        planId !== 'student_plus' &&
        planId !== 'educator_plus' &&
        planId !== 'student_monthly' &&
        planId !== 'exam_prep_pack'
      ) {
        res.status(400).json({
          ok: false,
          code: 'INVALID_PLAN',
          error: 'Select a valid paid plan (student_plus, educator_plus, student_monthly, or exam_prep_pack).',
        });
        return;
      }

      if (snapshot.seller.billingProvider === 'unselected') {
        res.status(409).json({
          ok: false,
          code: 'BILLING_PROVIDER_UNSELECTED',
          error:
            'Checkout is disabled because the owner has not finalized the payment provider (e.g., Whop, Creem, Paddle, or another processor).',
          missingRequirements: snapshot.missingRequirements,
        });
        return;
      }

      if (snapshot.seller.billingEnvironment === 'production' && !snapshot.liveCheckoutAllowed) {
        res.status(409).json({
          ok: false,
          code: 'LIVE_CHECKOUT_DISABLED',
          error:
            'Live production checkout is disabled until owner pricing confirmation, legal seller identity, provider approval, and catalog IDs are complete.',
          missingRequirements: snapshot.missingRequirements,
        });
        return;
      }

      if (snapshot.seller.billingEnvironment === 'sandbox' && !snapshot.sandboxReady) {
        res.status(409).json({
          ok: false,
          code: 'BILLING_CATALOG_UNCONFIGURED',
          error:
            'Provider catalog IDs or hosted checkout URLs are not configured yet. Use Sandbox Webhook Simulation below or configure BILLING_* environment variables.',
          missingRequirements: snapshot.missingRequirements,
        });
        return;
      }

      let productId: string | null = null;
      let priceId: string | null = null;
      let checkoutUrl: string | null = null;
      if (planId === 'student_plus' || planId === 'educator_plus') {
        const mapping = snapshot.billingCatalog[planId];
        productId = mapping.productId;
        priceId = interval === 'annual' ? mapping.annualPriceId : mapping.monthlyPriceId;
        checkoutUrl = interval === 'annual' ? mapping.annualCheckoutUrl : mapping.monthlyCheckoutUrl;
      } else {
        const addon = snapshot.aiAddonsCatalog[planId];
        productId = addon.productId;
        priceId = addon.priceId;
        checkoutUrl = addon.checkoutUrl;
      }

      if (!priceId && !checkoutUrl) {
        res.status(409).json({
          ok: false,
          code: 'PRICE_ID_NOT_CONFIGURED',
          error: `No provider price ID or checkout URL is configured for "${planId}" (${interval}).`,
        });
        return;
      }

      const store = await getAsyncBillingStore();
      const acct = await store.getAccount(resolved.accountId);
      const reqOrigin =
        typeof req.headers.origin === 'string' && /^https?:\/\//i.test(req.headers.origin)
          ? req.headers.origin
          : snapshot.seller.approvedDomain
            ? `https://${snapshot.seller.approvedDomain.replace(/^https?:\/\//i, '')}`
            : null;
      const returnUrl = reqOrigin ? `${reqOrigin}/#/pricing?checkout=complete` : null;

      let sessionId: string | null = null;
      let resolvedCheckoutUrl = checkoutUrl;
      if (snapshot.seller.billingProvider === 'whop' && priceId) {
        const whopCfg = await createWhopCheckoutConfiguration({
          whopPlanId: priceId,
          accountId: resolved.accountId,
          firebaseUid: acct?.firebaseUid ?? null,
          returnUrl,
        });
        sessionId = whopCfg.sessionId;
        if (whopCfg.purchaseUrl && !resolvedCheckoutUrl) {
          resolvedCheckoutUrl = whopCfg.purchaseUrl;
        }
      }

      const mode =
        snapshot.seller.billingProvider === 'whop' && (sessionId || priceId)
          ? 'whop_embedded'
          : 'hosted_redirect';

      res.json({
        ok: true,
        mode,
        bearerToken: resolved.bearerToken,
        provider: snapshot.seller.billingProvider,
        environment: snapshot.seller.billingEnvironment,
        productId,
        priceId,
        sessionId,
        checkoutUrl: resolvedCheckoutUrl,
        returnUrl,
        planId,
        interval,
        customData: {
          accountId: resolved.accountId,
          ...(acct?.firebaseUid ? { firebaseUid: acct.firebaseUid } : {}),
        },
      });
    } catch (error) {
      console.error('Failed to create billing checkout intent:', error);
      res.status(500).json({ ok: false, code: 'BILLING_STORE_ERROR', error: 'Unable to prepare checkout session.' });
    }
  });

  const handleBillingWebhook = async (req: RawBodyRequest, res: Response, providerParam?: string) => {
    try {
      const rawBody = req.rawBody ?? JSON.stringify(req.body ?? {});
      const signatureHeader =
        (req.headers['webhook-signature'] as string | undefined) ||
        (req.headers['x-billing-signature'] as string | undefined) ||
        (req.headers['x-whop-signature'] as string | undefined) ||
        (req.headers['creem-signature'] as string | undefined) ||
        (req.headers['paddle-signature'] as string | undefined);
      const timestampHeader =
        (req.headers['webhook-timestamp'] as string | undefined) ||
        (req.headers['x-billing-timestamp'] as string | undefined);
      const webhookIdHeader = req.headers['webhook-id'] as string | undefined;
      const webhookSecret = process.env.BILLING_WEBHOOK_SECRET?.trim() || null;

      const store = await getAsyncBillingStore();
      const result = await verifyAndProcessBillingWebhook({
        rawBody,
        signatureHeader,
        timestampHeader,
        webhookIdHeader,
        webhookSecret,
        provider: providerParam || process.env.BILLING_PROVIDER?.trim() || 'whop',
        store,
      });

      res.status(result.httpStatus).json({
        ok: result.ok,
        code: result.code,
        eventId: result.eventId,
        eventType: result.eventType,
        alreadyProcessed: result.alreadyProcessed,
        accountId: result.accountId,
        error: result.error,
      });
    } catch (error) {
      console.error('Failed to process billing webhook:', error);
      res.status(500).json({ ok: false, code: 'BILLING_STORE_ERROR', error: 'Unable to process billing webhook.' });
    }
  };

  app.post('/api/billing/webhook', (req: RawBodyRequest, res) => {
    void handleBillingWebhook(req, res);
  });
  app.post('/api/billing/webhook/:provider', (req: RawBodyRequest, res) => {
    void handleBillingWebhook(req, res, String(req.params.provider || 'billing_provider'));
  });

  app.post('/api/billing/portal', verifySameOriginOrHeader, async (req, res) => {
    try {
      const resolved = await resolveAuthenticatedAccountWithFirebase(req);
      if (resolved.shouldSetCookie) {
        setSessionCookie(res, resolved.bearerToken);
      }
      const store = await getAsyncBillingStore();
      const record = await store.getAccount(resolved.accountId);
      if (!record?.providerCustomerId) {
        res.status(404).json({
          ok: false,
          code: 'NO_PROVIDER_CUSTOMER',
          error:
            'No provider customer record is linked to this account yet. Complete checkout once a live provider is active, or check your purchase confirmation receipt.',
        });
        return;
      }

      const portal = await createHostedPortalSession(record.providerCustomerId);
      if (!portal.ok) {
        res.status(503).json({
          ok: false,
          code: 'PORTAL_UNAVAILABLE',
          error: portal.error,
        });
        return;
      }
      res.json({
        ok: true,
        overviewUrl: portal.overviewUrl,
      });
    } catch (error) {
      console.error('Failed to open billing portal:', error);
      res.status(500).json({ ok: false, code: 'BILLING_STORE_ERROR', error: 'Unable to open customer portal.' });
    }
  });

  app.post('/api/billing/sandbox/simulate', verifySameOriginOrHeader, async (req, res) => {
    try {
      if (isProductionMode()) {
        res.status(403).json({
          ok: false,
          code: 'FORBIDDEN_IN_PRODUCTION',
          error: 'Sandbox webhook simulation is strictly disabled in production mode.',
        });
        return;
      }

      const resolved = await resolveAuthenticatedAccountWithFirebase(req);
      if (resolved.shouldSetCookie) {
        setSessionCookie(res, resolved.bearerToken);
      }

      const body = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};
      const scenario = typeof body.scenario === 'string' ? body.scenario : 'purchase_student_monthly';
      const store = await getAsyncBillingStore();
      const current = (await store.getAccount(resolved.accountId))!;
    const nowIso = new Date().toISOString();
    const plus30DaysIso = new Date(Date.now() + 30 * 86_400_000).toISOString();
    const plus365DaysIso = new Date(Date.now() + 365 * 86_400_000).toISOString();
    const randSuffix = `${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    const sandboxPriceOverrides: Record<string, PriceCatalogTarget> = {
      pri_sandbox_student_mo: {
        kind: 'subscription',
        planId: 'student_plus',
        interval: 'monthly',
        productId: 'pro_sandbox_student',
        creditsBonus: 250_000,
        validityDays: 30,
      },
      pri_sandbox_student_yr: {
        kind: 'subscription',
        planId: 'student_plus',
        interval: 'annual',
        productId: 'pro_sandbox_student',
        creditsBonus: 250_000,
        validityDays: 365,
      },
      pri_sandbox_educator_mo: {
        kind: 'subscription',
        planId: 'educator_plus',
        interval: 'monthly',
        productId: 'pro_sandbox_educator',
        creditsBonus: 500_000,
        validityDays: 30,
      },
      pri_sandbox_educator_yr: {
        kind: 'subscription',
        planId: 'educator_plus',
        interval: 'annual',
        productId: 'pro_sandbox_educator',
        creditsBonus: 500_000,
        validityDays: 365,
      },
      pri_sandbox_ai_burst: {
        kind: 'ai_credit_pack',
        planId: 'exam_prep_pack',
        interval: 'none',
        productId: 'pro_sandbox_ai_burst',
        creditsBonus: 650_000,
        validityDays: 90,
      },
    };

    const customerId = current.providerCustomerId ?? `ctm_sbx_${resolved.accountId.slice(5, 17)}`;
    const subId = current.providerSubscriptionId ?? `sub_sbx_${randSuffix}`;
    const lastPaidTxId = current.providerTransactionId ?? `txn_sbx_${randSuffix}`;

    let eventPayload: Record<string, unknown>;
    if (scenario === 'purchase_student_monthly' || scenario === 'purchase_student_annual') {
      const annual = scenario === 'purchase_student_annual';
      eventPayload = {
        event_id: `evt_sbx_${randSuffix}`,
        event_type: 'transaction.completed',
        occurred_at: nowIso,
        data: {
          id: `txn_sbx_${randSuffix}`,
          status: 'completed',
          customer_id: customerId,
          subscription_id: subId,
          currency_code: 'USD',
          custom_data: { accountId: resolved.accountId },
          billing_period: { starts_at: nowIso, ends_at: annual ? plus365DaysIso : plus30DaysIso },
          details: { totals: { total: annual ? '3999' : '499' } },
          items: [
            {
              price_id: annual ? 'pri_sandbox_student_yr' : 'pri_sandbox_student_mo',
              quantity: 1,
            },
          ],
        },
      };
    } else if (scenario === 'purchase_educator_monthly' || scenario === 'purchase_educator_annual') {
      const annual = scenario === 'purchase_educator_annual';
      eventPayload = {
        event_id: `evt_sbx_${randSuffix}`,
        event_type: 'transaction.completed',
        occurred_at: nowIso,
        data: {
          id: `txn_sbx_${randSuffix}`,
          status: 'completed',
          customer_id: customerId,
          subscription_id: subId,
          currency_code: 'USD',
          custom_data: { accountId: resolved.accountId },
          billing_period: { starts_at: nowIso, ends_at: annual ? plus365DaysIso : plus30DaysIso },
          details: { totals: { total: annual ? '7999' : '999' } },
          items: [
            {
              price_id: annual ? 'pri_sandbox_educator_yr' : 'pri_sandbox_educator_mo',
              quantity: 1,
            },
          ],
        },
      };
    } else if (scenario === 'purchase_ai_burst') {
      eventPayload = {
        event_id: `evt_sbx_${randSuffix}`,
        event_type: 'transaction.completed',
        occurred_at: nowIso,
        data: {
          id: `txn_sbx_${randSuffix}`,
          status: 'completed',
          customer_id: customerId,
          currency_code: 'USD',
          custom_data: { accountId: resolved.accountId },
          details: { totals: { total: '999' } },
          items: [{ price_id: 'pri_sandbox_ai_burst', quantity: 1 }],
        },
      };
    } else if (scenario === 'cancel_subscription') {
      eventPayload = {
        event_id: `evt_sbx_${randSuffix}`,
        event_type: 'subscription.canceled',
        occurred_at: nowIso,
        data: {
          id: subId,
          status: 'canceled',
          customer_id: customerId,
          canceled_at: nowIso,
          current_billing_period: { starts_at: nowIso, ends_at: plus30DaysIso },
          custom_data: { accountId: resolved.accountId },
        },
      };
    } else if (scenario === 'payment_failed') {
      eventPayload = {
        event_id: `evt_sbx_${randSuffix}`,
        event_type: 'transaction.payment_failed',
        occurred_at: nowIso,
        data: {
          id: `txn_fail_${randSuffix}`,
          status: 'past_due',
          customer_id: customerId,
          subscription_id: subId,
          custom_data: { accountId: resolved.accountId },
        },
      };
    } else if (scenario === 'refund' || scenario === 'chargeback') {
      eventPayload = {
        event_id: `evt_sbx_${randSuffix}`,
        event_type: scenario === 'chargeback' ? 'chargeback.created' : 'refund.created',
        occurred_at: nowIso,
        data: {
          id: `adj_sbx_${randSuffix}`,
          transaction_id: lastPaidTxId,
          subscription_id: subId,
          customer_id: customerId,
          action: scenario === 'chargeback' ? 'chargeback' : 'refund',
          status: 'approved',
          custom_data: { accountId: resolved.accountId },
        },
      };
    } else {
      res.status(400).json({ ok: false, error: `Unsupported sandbox scenario "${scenario}".` });
      return;
    }

    const rawBody = JSON.stringify(eventPayload);
    const sigHeader = signBillingWebhook(rawBody, SANDBOX_FALLBACK_WEBHOOK_SECRET);
    const result = await verifyAndProcessBillingWebhook({
      rawBody,
      signatureHeader: sigHeader,
      webhookSecret: SANDBOX_FALLBACK_WEBHOOK_SECRET,
      provider: 'sandbox_simulator',
      store,
      priceMapOverrides: sandboxPriceOverrides,
    });

      const refreshed = (await store.getAccount(resolved.accountId))!;
      res.status(result.httpStatus).json({
        ok: result.ok,
        sandboxSimulated: true,
        bearerToken: resolved.bearerToken,
        scenario,
        webhookResult: result,
        entitlement: await store.toPublicEntitlementSummary(refreshed),
      });
    } catch (error) {
      console.error('Failed to run sandbox billing simulation:', error);
      res.status(500).json({ ok: false, code: 'BILLING_STORE_ERROR', error: 'Unable to run sandbox simulation.' });
    }
  });

  // Transparent .bin -> .bin.gz fallback so stripped deployment bundles serve legacy .bin URLs cleanly
  app.get('/models/{*modelPath}', (req, res, next) => {
    const reqPath = req.path;
    if (!reqPath.endsWith('.bin')) {
      next();
      return;
    }
    const relPath = reqPath.replace(/^\/+/, '');
    const allowedBases = [
      path.resolve(ROOT_DIR, 'public', 'models'),
      path.resolve(ROOT_DIR, 'dist', 'models'),
    ];
    for (const baseDir of allowedBases) {
      const subRel = relPath.replace(/^models\//, '');
      const rawFile = path.resolve(baseDir, subRel);
      if (!rawFile.startsWith(baseDir + path.sep)) {
        res.status(400).end();
        return;
      }
      if (fs.existsSync(rawFile)) {
        next();
        return;
      }
      const gzFile = `${rawFile}.gz`;
      if (fs.existsSync(gzFile)) {
        fs.readFile(gzFile, (err, compressed) => {
          if (err) {
            next(err);
            return;
          }
          zlib.gunzip(compressed, (gunzipErr, raw) => {
            if (gunzipErr) {
              next(gunzipErr);
              return;
            }
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            res.send(raw);
          });
        });
        return;
      }
    }
    next();
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
    console.log(`Alphatomy server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
