import crypto from 'node:crypto';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  AI_SUBSCRIPTION_PLANS,
  canSpendCredits,
  createEntitlementAccount,
  estimateReserveCredits,
  getPlanById,
  provisionQuotaFromPayment,
  settleUsageCredits,
  toPublicQuotaSummary,
  type EntitlementAccount,
  type PublicQuotaSummary,
  type SubscriptionPlanId,
  type TokenUsageMetrics,
  type VerifiedPaymentEvent,
} from '../app/ai/quota';
import {
  buildAiSystemPrompt,
  validateAndNormalizeAiResponse,
  type AiExplorerContext,
  type AiNavigatorResponsePayload,
} from '../app/ai/navigator-contract';

export const AI_MODEL_NAME = 'gemini-4-hydrogen';

const SIGNING_SECRET =
  process.env.AI_QUOTA_SIGNING_SECRET?.trim() || crypto.randomBytes(32).toString('hex');

const INTERNAL_DEV_WEBHOOK_SECRET =
  process.env.AI_BILLING_WEBHOOK_SECRET?.trim() || crypto.randomBytes(32).toString('hex');

export function getWebhookSecret(): { secret: string; configuredViaEnv: boolean } {
  const envSecret = process.env.AI_BILLING_WEBHOOK_SECRET?.trim();
  if (envSecret) {
    return { secret: envSecret, configuredViaEnv: true };
  }
  return { secret: INTERNAL_DEV_WEBHOOK_SECRET, configuredViaEnv: false };
}

export function isSubscriptionRequiredByDefault(): boolean {
  return process.env.AI_REQUIRE_SUBSCRIPTION?.trim().toLowerCase() === 'true';
}

export function isProductionMode(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.AI_BILLING_LIVE?.trim().toLowerCase() === 'true';
}

function hmacSign(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

export function safeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function signAccountToken(accountId: string, issuedAt = Date.now()): string {
  const body = Buffer.from(JSON.stringify({ accountId, issuedAt }), 'utf8').toString('base64url');
  const sig = hmacSign(body, SIGNING_SECRET);
  return `${body}.${sig}`;
}

export function verifyAccountToken(token: string | undefined | null): { accountId: string } | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.trim().split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!body || !sig) return null;
  const expectedSig = hmacSign(body, SIGNING_SECRET);
  if (!safeEqualStrings(sig, expectedSig)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as {
      accountId?: unknown;
    };
    if (typeof parsed.accountId === 'string' && /^acct_[a-zA-Z0-9_-]{8,64}$/.test(parsed.accountId)) {
      return { accountId: parsed.accountId };
    }
    return null;
  } catch {
    return null;
  }
}

export function signWebhookPayload(rawPayload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(rawPayload).digest('hex');
}

export function verifyWebhookSignature(
  rawPayload: string,
  providedSignatureHeader: string | undefined,
  secret: string,
): boolean {
  if (!providedSignatureHeader || !secret) return false;
  const normalized = providedSignatureHeader.replace(/^sha256=/i, '').trim();
  const expected = signWebhookPayload(rawPayload, secret);
  return safeEqualStrings(normalized, expected);
}

export interface BillingProviderAdapter {
  readonly providerId: string;
  readonly displayName: string;
  createCheckoutSession(params: {
    accountId: string;
    planId: SubscriptionPlanId;
    originUrl: string;
  }): {
    checkoutSessionId: string;
    provider: string;
    planId: SubscriptionPlanId;
    amountUsdCents: number;
    creditsToProvision: number;
    checkoutUrl: string | null;
    webhookEndpoint: string;
    devPreviewEligible: boolean;
    integrationNote: string;
  };
}

export const defaultBillingAdapter: BillingProviderAdapter = {
  providerId: 'webhook_on_demand',
  displayName: 'On-Demand Webhook Billing',
  createCheckoutSession({ accountId, planId }) {
    const plan = getPlanById(planId);
    if (!plan || plan.id === 'free_preview') {
      throw new Error(`Cannot create checkout session for non-paid plan "${planId}".`);
    }
    const checkoutSessionId = `cs_${crypto.randomBytes(12).toString('hex')}`;
    const devPreviewEligible = !isProductionMode();
    return {
      checkoutSessionId,
      provider: this.providerId,
      planId: plan.id,
      amountUsdCents: plan.priceUsdCents,
      creditsToProvision: plan.creditsIncluded,
      checkoutUrl: null,
      webhookEndpoint: '/api/ai/billing/webhook',
      devPreviewEligible,
      integrationNote: devPreviewEligible
        ? `Ready for payment webhook confirmation. Attach Stripe/LemonSqueezy checkoutUrl here in production; in local preview, verified webhook provisioning can be triggered for ${accountId}.`
        : 'Configure external payment gateway checkoutUrl and AI_BILLING_WEBHOOK_SECRET in server environment.',
    };
  },
};

// Server-side in-memory quota ledger & burst rate-limit tracker
const accountLedger = new Map<string, EntitlementAccount>();
const rateLimitWindow = new Map<string, number[]>();

export function getOrCreateAccount(accountId?: string): {
  account: EntitlementAccount;
  bearerToken: string;
  isNew: boolean;
} {
  if (accountId && accountLedger.has(accountId)) {
    const account = accountLedger.get(accountId)!;
    return { account, bearerToken: signAccountToken(account.accountId), isNew: false };
  }
  const cleanId =
    accountId && /^acct_[a-zA-Z0-9_-]{8,64}$/.test(accountId)
      ? accountId
      : `acct_${crypto.randomBytes(12).toString('hex')}`;
  const created = createEntitlementAccount(cleanId, isSubscriptionRequiredByDefault());
  accountLedger.set(cleanId, created);
  return { account: created, bearerToken: signAccountToken(cleanId), isNew: true };
}

export function getQuotaSummaryForAccount(accountId: string): PublicQuotaSummary {
  const { account } = getOrCreateAccount(accountId);
  return toPublicQuotaSummary(account);
}

export function checkAndRecordRateLimit(accountId: string, nowMs = Date.now()): boolean {
  const windowMs = 60_000;
  const maxPerMinute = 15;
  const recent = (rateLimitWindow.get(accountId) ?? []).filter((ts) => nowMs - ts < windowMs);
  if (recent.length >= maxPerMinute) {
    rateLimitWindow.set(accountId, recent);
    return false;
  }
  recent.push(nowMs);
  rateLimitWindow.set(accountId, recent);
  return true;
}

export function applyVerifiedPaymentToLedger(payment: VerifiedPaymentEvent): {
  ok: boolean;
  alreadyProcessed: boolean;
  summary?: PublicQuotaSummary;
  transactionId?: string;
  error?: string;
} {
  const { account } = getOrCreateAccount(payment.accountId);
  const result = provisionQuotaFromPayment(account, payment);
  if (result.error) {
    return { ok: false, alreadyProcessed: false, error: result.error };
  }
  accountLedger.set(account.accountId, result.account);
  return {
    ok: true,
    alreadyProcessed: result.alreadyProcessed,
    summary: toPublicQuotaSummary(result.account),
    transactionId: result.transaction?.id,
  };
}

let cachedGenAiClient: GoogleGenAI | null = null;
let cachedApiKey = '';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim() ?? '';
  if (!apiKey) return null;
  if (!cachedGenAiClient || cachedApiKey !== apiKey) {
    cachedApiKey = apiKey;
    cachedGenAiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedGenAiClient;
}

const AI_NAVIGATOR_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    reply: {
      type: Type.STRING,
      description: 'Concise, scientifically accurate student-facing explanation (2-5 sentences).',
    },
    studyTip: {
      type: Type.STRING,
      description: 'Optional crisp exam or dissection pearl relevant to the question.',
    },
    followUpSuggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Up to 3 short follow-up prompts the student can tap next.',
    },
    actions: {
      type: Type.ARRAY,
      description: 'Typed 3D Explorer actions to execute immediately.',
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            description:
              'One of: switch_sex, focus_structure, set_systems, set_camera_view, set_render_mode, reset_view, open_activity',
          },
          sex: { type: Type.STRING, description: 'male or female when type is switch_sex' },
          query: { type: Type.STRING, description: 'Structure name or FMA ID when type is focus_structure' },
          isolate: { type: Type.BOOLEAN, description: 'Isolate selected structure in 3D' },
          ghost: { type: Type.BOOLEAN, description: 'Make surrounding structures translucent' },
          mode: {
            type: Type.STRING,
            description: 'only, show, hide, all, organs, or skeleton when type is set_systems',
          },
          systems: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'SystemIds for set_systems',
          },
          view: {
            type: Type.STRING,
            description: 'three-quarter, front, back, left, or right when type is set_camera_view',
          },
          ghostSurroundings: { type: Type.BOOLEAN },
          xrayOpacity: { type: Type.NUMBER, description: '0.05 to 1.0' },
          explode: { type: Type.NUMBER, description: '0.0 to 1.0' },
          clipAxis: { type: Type.STRING, description: 'x, y, z, or none' },
          clipOffset: { type: Type.NUMBER, description: '0.0 to 1.0' },
          visualizationMode: {
            type: Type.STRING,
            description: 'natural, system_highlight, tissue_classification, or regional_brain',
          },
          route: {
            type: Type.STRING,
            description:
              'learn, quiz, practical-lab, relationships, physiology, histology, clinical, present, syllabus, or systems',
          },
          targetId: { type: Type.STRING },
          label: { type: Type.STRING },
        },
        required: ['type'],
      },
    },
  },
  required: ['reply', 'actions', 'followUpSuggestions'],
};

export interface NavigateAiResult {
  status: number;
  ok: boolean;
  code?: string;
  error?: string;
  payload?: AiNavigatorResponsePayload;
  usage?: TokenUsageMetrics & { creditsCharged: number };
  quota: PublicQuotaSummary;
}

export async function executeAiNavigationTurn(params: {
  accountId: string;
  prompt: string;
  history?: Array<{ role: 'user' | 'assistant'; text: string }>;
  context: AiExplorerContext;
}): Promise<NavigateAiResult> {
  const { account } = getOrCreateAccount(params.accountId);
  const reserveCost = estimateReserveCredits(params.prompt);
  const gate = canSpendCredits(account, reserveCost);

  if (!gate.allowed) {
    return {
      status: 402,
      ok: false,
      code: gate.reason ?? 'QUOTA_EXHAUSTED',
      error:
        gate.reason === 'SUBSCRIPTION_REQUIRED'
          ? 'An active AI subscription pack is required. Activate a plan below to purchase your quota on the spot.'
          : 'Your AI study quota is exhausted. Top up or renew a student pack to continue.',
      quota: toPublicQuotaSummary(account),
    };
  }

  if (!checkAndRecordRateLimit(account.accountId)) {
    return {
      status: 429,
      ok: false,
      code: 'RATE_LIMITED',
      error: 'Too many requests in a short window. Please wait a few seconds before asking again.',
      quota: toPublicQuotaSummary(account),
    };
  }

  const ai = getGeminiClient();
  if (!ai) {
    return {
      status: 503,
      ok: false,
      code: 'AI_KEY_NOT_CONFIGURED',
      error:
        'GEMINI_API_KEY is not configured in the server environment yet. Set GEMINI_API_KEY in Settings > Secrets to enable live Gemini 3D guidance.',
      quota: toPublicQuotaSummary(account),
    };
  }

  const systemInstruction = buildAiSystemPrompt(params.context);
  const historyLines = (params.history ?? [])
    .slice(-4)
    .map((h) => `${h.role === 'user' ? 'Student' : 'Assistant'}: ${h.text.slice(0, 350)}`)
    .join('\n');

  const userContents = historyLines
    ? `Recent conversation:\n${historyLines}\n\nStudent request: ${params.prompt}`
    : params.prompt;

  try {
    const response = await ai.models.generateContent({
      model: AI_MODEL_NAME,
      contents: userContents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: AI_NAVIGATOR_RESPONSE_SCHEMA,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    const rawText = (response.text ?? '').trim();
    if (!rawText) {
      return {
        status: 502,
        ok: false,
        code: 'AI_EMPTY_RESPONSE',
        error: 'Gemini returned an empty response. Quota was not charged.',
        quota: toPublicQuotaSummary(account),
      };
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawText);
    } catch {
      parsedJson = { reply: rawText, actions: [], followUpSuggestions: [] };
    }

    const normalizedPayload = validateAndNormalizeAiResponse(parsedJson);
    const meta = response.usageMetadata;
    const usageMetrics: TokenUsageMetrics = {
      promptTokens: meta?.promptTokenCount ?? Math.ceil((systemInstruction.length + userContents.length) / 4),
      candidatesTokens: meta?.candidatesTokenCount ?? Math.ceil(rawText.length / 4),
      totalTokens:
        meta?.totalTokenCount ??
        Math.ceil((systemInstruction.length + userContents.length + rawText.length) / 4),
    };

    const settled = settleUsageCredits(account, usageMetrics);
    accountLedger.set(account.accountId, settled.account);

    return {
      status: 200,
      ok: true,
      payload: normalizedPayload,
      usage: {
        ...usageMetrics,
        creditsCharged: settled.creditsCharged,
      },
      quota: toPublicQuotaSummary(settled.account),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upstream Gemini request failed.';
    const lower = message.toLowerCase();
    if (lower.includes('permission_denied') || lower.includes('403') || lower.includes('api_key_invalid')) {
      return {
        status: 502,
        ok: false,
        code: 'AI_KEY_INVALID',
        error:
          'The server Gemini API key was rejected (403/invalid). Please check GEMINI_API_KEY in Settings > Secrets. Your quota was not charged.',
        quota: toPublicQuotaSummary(account),
      };
    }
    if (lower.includes('resource_exhausted') || lower.includes('429')) {
      return {
        status: 429,
        ok: false,
        code: 'UPSTREAM_RATE_LIMIT',
        error: 'Gemini rate/quota limit reached upstream. Please try again shortly. Your quota was not charged.',
        quota: toPublicQuotaSummary(account),
      };
    }
    return {
      status: 502,
      ok: false,
      code: 'AI_UPSTREAM_ERROR',
      error: `AI request could not be completed (${message}). Your quota was not charged.`,
      quota: toPublicQuotaSummary(account),
    };
  }
}

export function getPublicPlansCatalog() {
  return AI_SUBSCRIPTION_PLANS;
}
