import crypto from 'node:crypto';
import { AI_SUBSCRIPTION_PLANS, type SubscriptionPlanId } from '../app/ai/quota';
import {
  getDefaultCommercialRuntimeSnapshot,
  type BillingInterval,
  type BillingProviderChoice,
  type CommercialPlanId,
  type CommercialRuntimeSnapshot,
} from '../app/commercial/commercial-config';
import type { DurableBillingStore, PaidTierPlanId, SubscriptionLifecycleStatus } from './billing-store';

function envBool(key: string): boolean {
  return process.env[key]?.trim().toLowerCase() === 'true';
}

function envStr(key: string): string | null {
  const v = process.env[key]?.trim();
  return v ? v : null;
}

function resolveProviderChoice(raw: string | null): BillingProviderChoice {
  const lower = raw?.toLowerCase();
  if (
    lower === 'whop' ||
    lower === 'creem' ||
    lower === 'paddle' ||
    lower === 'custom' ||
    lower === 'unselected'
  ) {
    return lower;
  }
  return 'whop';
}

export function getCommercialRuntimeSnapshot(): CommercialRuntimeSnapshot {
  const base = getDefaultCommercialRuntimeSnapshot();
  const billingProvider = resolveProviderChoice(envStr('BILLING_PROVIDER'));
  const billingEnv =
    envStr('BILLING_ENVIRONMENT')?.toLowerCase() === 'production' ? 'production' : 'sandbox';
  const clientToken = envStr('BILLING_CLIENT_TOKEN');
  const apiKey = envStr('BILLING_API_KEY');
  const webhookSecret = envStr('BILLING_WEBHOOK_SECRET');
  const portalUrl = envStr('BILLING_PORTAL_URL');

  const seller = {
    tradingName: envStr('COMMERCIAL_TRADING_NAME') ?? 'Alphatomy',
    legalSellerName: envStr('COMMERCIAL_SELLER_NAME'),
    sellerType: envStr('COMMERCIAL_SELLER_TYPE'),
    sellerCountry: envStr('COMMERCIAL_SELLER_COUNTRY'),
    supportEmail: envStr('COMMERCIAL_SUPPORT_EMAIL'),
    supportPhone: envStr('COMMERCIAL_SUPPORT_PHONE'),
    approvedDomain: envStr('BILLING_APPROVED_DOMAIN'),
    pricingConfirmed: envBool('COMMERCIAL_PRICING_CONFIRMED'),
    sellerApprovedByProvider: envBool('COMMERCIAL_SELLER_APPROVED'),
    domainApprovedByProvider: envBool('COMMERCIAL_DOMAIN_APPROVED'),
    policiesPublished: process.env.COMMERCIAL_POLICIES_PUBLISHED
      ? envBool('COMMERCIAL_POLICIES_PUBLISHED')
      : true,
    billingProvider,
    billingEnvironment: billingEnv as 'sandbox' | 'production',
    billingClientConfigured: Boolean(clientToken),
    portalUrl,
    liveCheckoutEnabled: false,
  };

  const billingCatalog: CommercialRuntimeSnapshot['billingCatalog'] = {
    free_explorer: {
      productId: null,
      monthlyPriceId: null,
      annualPriceId: null,
      monthlyCheckoutUrl: null,
      annualCheckoutUrl: null,
    },
    student_plus: {
      productId: envStr('BILLING_PRODUCT_STUDENT_PLUS'),
      monthlyPriceId: envStr('BILLING_PRICE_STUDENT_PLUS_MONTHLY'),
      annualPriceId: envStr('BILLING_PRICE_STUDENT_PLUS_ANNUAL'),
      monthlyCheckoutUrl: envStr('BILLING_CHECKOUT_URL_STUDENT_PLUS_MONTHLY'),
      annualCheckoutUrl: envStr('BILLING_CHECKOUT_URL_STUDENT_PLUS_ANNUAL'),
    },
    educator_plus: {
      productId: envStr('BILLING_PRODUCT_EDUCATOR_PLUS'),
      monthlyPriceId: envStr('BILLING_PRICE_EDUCATOR_PLUS_MONTHLY'),
      annualPriceId: envStr('BILLING_PRICE_EDUCATOR_PLUS_ANNUAL'),
      monthlyCheckoutUrl: envStr('BILLING_CHECKOUT_URL_EDUCATOR_PLUS_MONTHLY'),
      annualCheckoutUrl: envStr('BILLING_CHECKOUT_URL_EDUCATOR_PLUS_ANNUAL'),
    },
    institution_custom: {
      productId: null,
      monthlyPriceId: null,
      annualPriceId: null,
      monthlyCheckoutUrl: null,
      annualCheckoutUrl: null,
    },
  };

  const aiAddonsCatalog: CommercialRuntimeSnapshot['aiAddonsCatalog'] = {
    student_monthly: {
      productId: envStr('BILLING_PRODUCT_AI_MONTHLY'),
      priceId: envStr('BILLING_PRICE_AI_MONTHLY'),
      checkoutUrl: envStr('BILLING_CHECKOUT_URL_AI_MONTHLY'),
    },
    exam_prep_pack: {
      productId: envStr('BILLING_PRODUCT_AI_BURST'),
      priceId: envStr('BILLING_PRICE_AI_BURST'),
      checkoutUrl: envStr('BILLING_CHECKOUT_URL_AI_BURST'),
    },
  };

  const missingRequirements: string[] = [];
  if (billingProvider === 'unselected') {
    missingRequirements.push(
      'Payment provider / Merchant of Record (e.g., Whop, Creem, Paddle, or another processor) has not yet been finalized by the owner.',
    );
  }
  if (!seller.legalSellerName || !seller.sellerType || !seller.sellerCountry) {
    missingRequirements.push('Seller legal name, seller type, and country must be supplied.');
  }
  if (!seller.supportEmail || !seller.supportPhone) {
    missingRequirements.push('Owner-confirmed support email and support phone number are missing.');
  }
  if (!seller.pricingConfirmed) {
    missingRequirements.push('Draft subscription prices must be confirmed by the owner.');
  }
  if (!seller.sellerApprovedByProvider) {
    missingRequirements.push('Payment provider seller onboarding & KYC verification are not yet approved.');
  }
  if (!seller.domainApprovedByProvider || !seller.approvedDomain) {
    missingRequirements.push('Production domain approval and BILLING_APPROVED_DOMAIN are not yet configured.');
  }
  if (
    (!billingCatalog.student_plus.monthlyPriceId && !billingCatalog.student_plus.monthlyCheckoutUrl) ||
    (!billingCatalog.educator_plus.monthlyPriceId && !billingCatalog.educator_plus.monthlyCheckoutUrl)
  ) {
    missingRequirements.push('Provider catalog product/price IDs or hosted checkout URLs are not configured yet.');
  }
  if (!webhookSecret || (!apiKey && !clientToken && !billingCatalog.student_plus.monthlyCheckoutUrl)) {
    missingRequirements.push('Provider webhook secret and API/checkout credentials are not configured.');
  }

  const hasAnySandboxProduct = Boolean(
    billingCatalog.student_plus.monthlyPriceId ||
      billingCatalog.student_plus.monthlyCheckoutUrl ||
      billingCatalog.educator_plus.monthlyPriceId ||
      billingCatalog.educator_plus.monthlyCheckoutUrl ||
      aiAddonsCatalog.student_monthly.priceId,
  );
  const sandboxReady = Boolean(
    billingProvider !== 'unselected' && billingEnv === 'sandbox' && hasAnySandboxProduct,
  );

  const liveCheckoutAllowed = Boolean(
    envBool('COMMERCIAL_LIVE_CHECKOUT_ENABLED') &&
      billingProvider !== 'unselected' &&
      billingEnv === 'production' &&
      missingRequirements.length === 0,
  );
  seller.liveCheckoutEnabled = liveCheckoutAllowed;

  return {
    ...base,
    seller,
    billingCatalog,
    aiAddonsCatalog,
    missingRequirements,
    sandboxReady,
    liveCheckoutAllowed,
    providerReadinessState: {
      providerSelection: billingProvider === 'unselected' ? 'BLOCKED_OWNER_PROVIDER_CHOICE' : 'READY',
      sellerAccount: seller.sellerApprovedByProvider ? 'READY' : 'BLOCKED_HUMAN_INPUT',
      productCategory: envBool('COMMERCIAL_PRODUCT_CATEGORY_APPROVED')
        ? 'READY'
        : 'BLOCKED_PROVIDER_CONFIRMATION',
      educatorAffiliateProgramme: 'DISABLED_PENDING_PROVIDER_WRITTEN_APPROVAL',
    },
  };
}

export interface PriceCatalogTarget {
  kind: 'subscription' | 'ai_credit_pack';
  planId: CommercialPlanId | SubscriptionPlanId;
  interval: BillingInterval;
  productId: string | null;
  creditsBonus: number;
  validityDays: number | null;
}

export function resolveCatalogPriceTarget(
  priceOrProductId: string | null | undefined,
  snapshot = getCommercialRuntimeSnapshot(),
  extraOverrides?: Record<string, PriceCatalogTarget>,
): PriceCatalogTarget | null {
  if (!priceOrProductId) return null;
  if (extraOverrides && extraOverrides[priceOrProductId]) {
    return extraOverrides[priceOrProductId];
  }

  const sp = snapshot.billingCatalog.student_plus;
  if (sp.monthlyPriceId && priceOrProductId === sp.monthlyPriceId) {
    return {
      kind: 'subscription',
      planId: 'student_plus',
      interval: 'monthly',
      productId: sp.productId,
      creditsBonus: 250_000,
      validityDays: 30,
    };
  }
  if (sp.annualPriceId && priceOrProductId === sp.annualPriceId) {
    return {
      kind: 'subscription',
      planId: 'student_plus',
      interval: 'annual',
      productId: sp.productId,
      creditsBonus: 250_000,
      validityDays: 365,
    };
  }

  const ep = snapshot.billingCatalog.educator_plus;
  if (ep.monthlyPriceId && priceOrProductId === ep.monthlyPriceId) {
    return {
      kind: 'subscription',
      planId: 'educator_plus',
      interval: 'monthly',
      productId: ep.productId,
      creditsBonus: 500_000,
      validityDays: 30,
    };
  }
  if (ep.annualPriceId && priceOrProductId === ep.annualPriceId) {
    return {
      kind: 'subscription',
      planId: 'educator_plus',
      interval: 'annual',
      productId: ep.productId,
      creditsBonus: 500_000,
      validityDays: 365,
    };
  }

  const aiM = snapshot.aiAddonsCatalog.student_monthly;
  if (aiM.priceId && priceOrProductId === aiM.priceId) {
    const plan = AI_SUBSCRIPTION_PLANS.find((p) => p.id === 'student_monthly')!;
    return {
      kind: 'ai_credit_pack',
      planId: 'student_monthly',
      interval: 'monthly',
      productId: aiM.productId,
      creditsBonus: plan.creditsIncluded,
      validityDays: plan.validityDays,
    };
  }

  const aiB = snapshot.aiAddonsCatalog.exam_prep_pack;
  if (aiB.priceId && priceOrProductId === aiB.priceId) {
    const plan = AI_SUBSCRIPTION_PLANS.find((p) => p.id === 'exam_prep_pack')!;
    return {
      kind: 'ai_credit_pack',
      planId: 'exam_prep_pack',
      interval: 'none',
      productId: aiB.productId,
      creditsBonus: plan.creditsIncluded,
      validityDays: plan.validityDays,
    };
  }

  return null;
}

export function signBillingWebhook(
  rawBody: string,
  secret: string,
  timestampSec = Math.floor(Date.now() / 1000),
): string {
  const signedPayload = `${timestampSec}:${rawBody}`;
  const digest = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
  return `ts=${timestampSec};v1=${digest}`;
}

export function signWhopStandardWebhook(params: {
  webhookId: string;
  timestampSec?: number;
  rawBody: string;
  secret: string;
}): string {
  const ts = params.timestampSec ?? Math.floor(Date.now() / 1000);
  const keyBytes = params.secret.startsWith('whsec_')
    ? Buffer.from(params.secret.slice(6), 'base64')
    : Buffer.from(params.secret, 'utf8');
  const signedContent = `${params.webhookId}.${ts}.${params.rawBody}`;
  const sigBase64 = crypto.createHmac('sha256', keyBytes).update(signedContent).digest('base64');
  return `v1,${sigBase64}`;
}

export function verifySignedWebhookHeader(params: {
  rawBody: string;
  signatureHeader: string | undefined;
  timestampHeader?: string | undefined;
  webhookIdHeader?: string | undefined;
  secret: string;
  maxReplayAgeSeconds?: number;
}): { ok: true } | { ok: false; code: string; error: string } {
  if (!params.signatureHeader) {
    return {
      ok: false,
      code: 'MISSING_BILLING_SIGNATURE',
      error: 'Missing webhook signature header.',
    };
  }

  const maxAge = params.maxReplayAgeSeconds ?? 300;
  const header = params.signatureHeader.trim();

  // Support Whop / Standard Webhooks (`webhook-id` + `webhook-timestamp` + `webhook-signature: v1,<base64>`)
  if (params.webhookIdHeader && header.includes(',')) {
    const msgId = params.webhookIdHeader.trim();
    const rawTs = params.timestampHeader?.trim() ?? '';
    if (!/^\d+$/.test(rawTs)) {
      return {
        ok: false,
        code: 'WEBHOOK_TIMESTAMP_OUT_OF_RANGE',
        error: 'Whop Standard Webhook timestamp header is missing or invalid.',
      };
    }
    const tsNum = Number(rawTs);
    if (Math.abs(Math.floor(Date.now() / 1000) - tsNum) > maxAge) {
      return {
        ok: false,
        code: 'WEBHOOK_TIMESTAMP_OUT_OF_RANGE',
        error: 'Webhook signature timestamp is outside allowed replay window.',
      };
    }
    const signedContent = `${msgId}.${rawTs}.${params.rawBody}`;
    const keyBytes = params.secret.startsWith('whsec_')
      ? Buffer.from(params.secret.slice(6), 'base64')
      : Buffer.from(params.secret, 'utf8');
    const expectedDigest = crypto.createHmac('sha256', keyBytes).update(signedContent).digest();

    const entries = header.split(/\s+/).filter(Boolean);
    let verified = false;
    for (const entry of entries) {
      const commaIdx = entry.indexOf(',');
      if (commaIdx === -1) continue;
      const version = entry.slice(0, commaIdx).trim();
      const b64Sig = entry.slice(commaIdx + 1).trim();
      if (version === 'v1' && b64Sig) {
        const providedDigest = Buffer.from(b64Sig, 'base64');
        if (
          providedDigest.length === expectedDigest.length &&
          crypto.timingSafeEqual(providedDigest, expectedDigest)
        ) {
          verified = true;
          break;
        }
      }
    }
    if (!verified) {
      return {
        ok: false,
        code: 'INVALID_BILLING_SIGNATURE',
        error: 'Whop Standard Webhook signature verification failed.',
      };
    }
    return { ok: true };
  }

  // Support `ts=<unix>;v1=<hex>` / `ts=<unix>;h1=<hex>` / `t=<unix>,v1=<hex>` formats
  let tsSec: number | null = null;
  let providedHex: string | null = null;

  if (header.includes(';') || header.includes(',')) {
    const tokens = header.split(/[;,]/).map((s) => s.trim());
    for (const tok of tokens) {
      const eq = tok.indexOf('=');
      if (eq === -1) continue;
      const k = tok.slice(0, eq).trim().toLowerCase();
      const v = tok.slice(eq + 1).trim();
      if ((k === 'ts' || k === 't') && /^\d+$/.test(v)) {
        tsSec = Number(v);
      } else if ((k === 'v1' || k === 'h1' || k === 'sig') && /^[a-fA-F0-9]{64}$/.test(v)) {
        providedHex = v.toLowerCase();
      }
    }
  } else {
    const cleaned = header.replace(/^sha256=/i, '').trim().toLowerCase();
    if (/^[a-f0-9]{64}$/.test(cleaned)) {
      providedHex = cleaned;
    }
    if (params.timestampHeader && /^\d+$/.test(params.timestampHeader.trim())) {
      tsSec = Number(params.timestampHeader.trim());
    }
  }

  if (!tsSec || Math.abs(Math.floor(Date.now() / 1000) - tsSec) > maxAge) {
    return {
      ok: false,
      code: 'WEBHOOK_TIMESTAMP_OUT_OF_RANGE',
      error: 'Webhook signature timestamp is missing or outside allowed replay window.',
    };
  }

  if (!providedHex) {
    return {
      ok: false,
      code: 'INVALID_BILLING_SIGNATURE',
      error: 'Webhook signature format is invalid.',
    };
  }

  const signedPayload = `${tsSec}:${params.rawBody}`;
  const expectedHex = crypto
    .createHmac('sha256', params.secret)
    .update(signedPayload)
    .digest('hex')
    .toLowerCase();

  const bufA = Buffer.from(providedHex, 'hex');
  const bufB = Buffer.from(expectedHex, 'hex');
  if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
    return {
      ok: false,
      code: 'INVALID_BILLING_SIGNATURE',
      error: 'Webhook HMAC signature verification failed.',
    };
  }

  return { ok: true };
}

export interface ProcessBillingWebhookResult {
  ok: boolean;
  httpStatus: number;
  code: string;
  eventId?: string;
  eventType?: string;
  alreadyProcessed?: boolean;
  accountId?: string;
  error?: string;
}

function parseIsoMs(value: unknown, fallback = Date.now()): number {
  if (typeof value === 'string') {
    const ms = Date.parse(value);
    if (Number.isFinite(ms)) return ms;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return fallback;
}

/**
 * Canonical normalized billing webhook handler.
 * Supports Whop Standard Webhooks (`webhook-id` / `webhook-timestamp` / `webhook-signature`)
 * and provider-agnostic HMAC payloads cleanly.
 */
export async function verifyAndProcessBillingWebhook(params: {
  rawBody: string;
  signatureHeader: string | undefined;
  timestampHeader?: string | undefined;
  webhookIdHeader?: string | undefined;
  webhookSecret: string | null;
  provider?: string;
  store: DurableBillingStore;
  priceMapOverrides?: Record<string, PriceCatalogTarget>;
  maxReplayAgeSeconds?: number;
}): Promise<ProcessBillingWebhookResult> {
  if (!params.webhookSecret) {
    return {
      ok: false,
      httpStatus: 503,
      code: 'WEBHOOK_SECRET_MISSING',
      error: 'BILLING_WEBHOOK_SECRET is not configured.',
    };
  }

  const sigCheck = verifySignedWebhookHeader({
    rawBody: params.rawBody,
    signatureHeader: params.signatureHeader,
    timestampHeader: params.timestampHeader,
    webhookIdHeader: params.webhookIdHeader,
    secret: params.webhookSecret,
    maxReplayAgeSeconds: params.maxReplayAgeSeconds,
  });
  if (!sigCheck.ok) {
    return {
      ok: false,
      httpStatus: 401,
      code: sigCheck.code,
      error: sigCheck.error,
    };
  }

  let parsed: Record<string, unknown>;
  try {
    const obj = JSON.parse(params.rawBody);
    if (!obj || typeof obj !== 'object') throw new Error('Invalid JSON object');
    parsed = obj as Record<string, unknown>;
  } catch {
    return {
      ok: false,
      httpStatus: 400,
      code: 'INVALID_WEBHOOK_PAYLOAD',
      error: 'Webhook request body must be valid JSON.',
    };
  }

  const eventId =
    typeof parsed.eventId === 'string'
      ? parsed.eventId
      : typeof parsed.event_id === 'string'
        ? parsed.event_id
        : typeof parsed.id === 'string'
          ? parsed.id
          : params.webhookIdHeader?.trim() || '';
  const eventType = String(
    parsed.eventType ?? parsed.event_type ?? parsed.type ?? parsed.action ?? '',
  );
  if (!eventId || !eventType) {
    return {
      ok: false,
      httpStatus: 400,
      code: 'MISSING_EVENT_METADATA',
      error: 'Webhook payload must include eventId/event_id and eventType/event_type.',
    };
  }

  const occurredAt = parseIsoMs(
    parsed.occurredAt ?? parsed.occurred_at ?? parsed.created_at ?? parsed.timestamp,
  );
  const providerName =
    params.provider ??
    (typeof parsed.provider === 'string' && parsed.provider.trim()
      ? parsed.provider.trim()
      : 'whop');

  const prior = params.store.hasProcessedWebhookEvent(eventId);
  if (prior) {
    return {
      ok: true,
      httpStatus: 200,
      code: 'ALREADY_PROCESSED',
      eventId,
      eventType,
      alreadyProcessed: true,
      accountId: prior.accountId ?? undefined,
    };
  }

  const data = (parsed.data ?? parsed.object ?? {}) as Record<string, unknown>;
  const customData = (data.customData ??
    data.custom_data ??
    data.metadata ??
    {}) as Record<string, unknown>;

  const whopUserObj = (data.user && typeof data.user === 'object' ? data.user : {}) as Record<
    string,
    unknown
  >;
  const whopMembershipObj = (
    data.membership && typeof data.membership === 'object' ? data.membership : {}
  ) as Record<string, unknown>;
  const whopPlanObj = (data.plan && typeof data.plan === 'object' ? data.plan : {}) as Record<
    string,
    unknown
  >;
  const whopProductObj = (
    data.product && typeof data.product === 'object' ? data.product : {}
  ) as Record<string, unknown>;

  const providerCustomerId =
    typeof data.customerId === 'string'
      ? data.customerId
      : typeof data.customer_id === 'string'
        ? data.customer_id
        : typeof whopUserObj.id === 'string'
          ? whopUserObj.id
          : typeof data.user_id === 'string'
            ? data.user_id
            : null;
  const providerSubscriptionId =
    eventType.startsWith('subscription.') || eventType.startsWith('membership.')
      ? typeof data.id === 'string'
        ? data.id
        : null
      : typeof data.subscriptionId === 'string'
        ? data.subscriptionId
        : typeof data.subscription_id === 'string'
          ? data.subscription_id
          : typeof whopMembershipObj.id === 'string'
            ? whopMembershipObj.id
            : typeof data.membership_id === 'string'
              ? data.membership_id
              : null;
  const providerTransactionId =
    eventType.startsWith('transaction.') ||
    eventType.startsWith('payment.') ||
    eventType.startsWith('checkout.')
      ? typeof data.id === 'string'
        ? data.id
        : null
      : typeof data.transactionId === 'string'
        ? data.transactionId
        : typeof data.transaction_id === 'string'
          ? data.transaction_id
          : typeof data.payment_id === 'string'
            ? data.payment_id
            : null;

  let account =
    typeof customData.accountId === 'string'
      ? params.store.getAccount(customData.accountId)
      : null;
  if (!account && typeof customData.firebaseUid === 'string') {
    account = params.store.getAccountByFirebaseUid(customData.firebaseUid);
  }
  if (!account && providerSubscriptionId) {
    account = params.store.getAccountByProviderSubscriptionId(providerSubscriptionId);
  }
  if (!account && providerCustomerId) {
    account = params.store.getAccountByProviderCustomerId(providerCustomerId);
  }

  if (!account) {
    params.store.recordProcessedWebhookEvent({
      eventId,
      eventType,
      provider: providerName,
      occurredAt,
      accountId: null,
      outcome: 'missing_account_mapping',
      summary: 'Rejected entitlement grant because event could not be mapped to an Alphatomy account.',
    });
    return {
      ok: false,
      httpStatus: 422,
      code: 'MISSING_ACCOUNT_MAPPING',
      eventId,
      eventType,
      error: 'Webhook verified, but account mapping (metadata.accountId / customerId / subscriptionId) was not found.',
    };
  }

  const snapshot = getCommercialRuntimeSnapshot();
  const items = Array.isArray(data.items) ? (data.items as Array<Record<string, unknown>>) : [];
  const firstItem = items[0] ?? {};
  const firstPriceObj = (firstItem.price ?? {}) as Record<string, unknown>;
  const priceOrProductId =
    typeof firstItem.priceId === 'string'
      ? firstItem.priceId
      : typeof firstItem.price_id === 'string'
        ? firstItem.price_id
        : typeof firstPriceObj.id === 'string'
          ? firstPriceObj.id
          : typeof whopPlanObj.id === 'string'
            ? whopPlanObj.id
            : typeof data.plan_id === 'string'
              ? data.plan_id
              : typeof data.planId === 'string'
                ? data.planId
                : typeof data.priceId === 'string'
                  ? data.priceId
                  : typeof data.price_id === 'string'
                    ? data.price_id
                    : typeof whopProductObj.id === 'string'
                      ? whopProductObj.id
                      : typeof data.productId === 'string'
                        ? data.productId
                        : typeof data.product_id === 'string'
                          ? data.product_id
                          : null;

  // 1. Paid completion events
  if (
    eventType === 'transaction.completed' ||
    eventType === 'transaction.paid' ||
    eventType === 'payment.completed' ||
    eventType === 'payment.succeeded' ||
    eventType === 'checkout.completed'
  ) {
    const target = resolveCatalogPriceTarget(priceOrProductId, snapshot, params.priceMapOverrides);
    if (!target) {
      params.store.recordProcessedWebhookEvent({
        eventId,
        eventType,
        provider: providerName,
        occurredAt,
        accountId: account.accountId,
        outcome: 'unknown_price_id',
        summary: `Rejected transaction because plan/price/product ID "${priceOrProductId ?? 'none'}" is not mapped in catalog.`,
      });
      return {
        ok: false,
        httpStatus: 422,
        code: 'UNKNOWN_PRICE_ID',
        eventId,
        eventType,
        accountId: account.accountId,
        error: `Unknown provider plan/price/product ID "${priceOrProductId ?? 'none'}".`,
      };
    }

    const details = (data.details ?? {}) as Record<string, unknown>;
    const totals = (details.totals ?? {}) as Record<string, unknown>;
    let totalMinor = Number(totals.total ?? totals.grandTotal ?? data.amountCents ?? 0) || 0;
    if (!totalMinor) {
      const whopRawAmt = Number(data.final_amount ?? data.subtotal ?? data.total ?? data.amount ?? 0) || 0;
      // Whop API frequently reports amounts in decimal dollars (e.g., 4.99); convert non-integers to cents
      totalMinor = Number.isInteger(whopRawAmt) && whopRawAmt >= 100 ? whopRawAmt : Math.round(whopRawAmt * 100);
    }
    const currencyCode =
      typeof data.currencyCode === 'string'
        ? data.currencyCode
        : typeof data.currency_code === 'string'
          ? data.currency_code
          : typeof data.currency === 'string'
            ? data.currency
            : 'USD';
    const billingPeriod = (data.billingPeriod ?? data.billing_period ?? {}) as Record<string, unknown>;
    const periodStart = billingPeriod.startsAt ?? billingPeriod.starts_at
      ? parseIsoMs(billingPeriod.startsAt ?? billingPeriod.starts_at, occurredAt)
      : occurredAt;
    const periodEnd = billingPeriod.endsAt ?? billingPeriod.ends_at
      ? parseIsoMs(
          billingPeriod.endsAt ?? billingPeriod.ends_at,
          occurredAt + (target.validityDays ?? 30) * 86_400_000,
        )
      : occurredAt + (target.validityDays ?? 30) * 86_400_000;

    if (target.kind === 'ai_credit_pack') {
      params.store.applyAiQuotaPurchase({
        accountId: account.accountId,
        provider: providerName,
        providerEventId: eventId,
        providerTransactionId,
        providerCustomerId,
        productId: target.productId,
        priceId: priceOrProductId,
        aiPlanId: target.planId as SubscriptionPlanId,
        amountCents: totalMinor,
        currency: currencyCode,
        creditsGranted: target.creditsBonus,
        validityDays: target.validityDays,
        paidAt: occurredAt,
      });
    } else {
      params.store.applySubscriptionUpdate({
        accountId: account.accountId,
        provider: providerName,
        providerEventId: eventId,
        providerCustomerId,
        providerSubscriptionId,
        providerTransactionId,
        productId: target.productId,
        priceId: priceOrProductId,
        activePlanId: target.planId as PaidTierPlanId,
        billingInterval:
          target.interval === 'monthly' || target.interval === 'annual' ? target.interval : 'monthly',
        subscriptionStatus: 'active',
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        refundStatus: 'none',
        amountCents: totalMinor,
        currency: currencyCode,
        creditsBonus: target.creditsBonus,
        recordTransaction: true,
        occurredAt,
      });
    }

    params.store.recordProcessedWebhookEvent({
      eventId,
      eventType,
      provider: providerName,
      occurredAt,
      accountId: account.accountId,
      outcome: 'provisioned',
      summary: `Provisioned ${target.planId} via ${eventType}`,
    });

    return {
      ok: true,
      httpStatus: 200,
      code: 'PROVISIONED',
      eventId,
      eventType,
      accountId: account.accountId,
    };
  }

  // 2. Subscription sync / activation / renewal events
  if (
    eventType === 'subscription.created' ||
    eventType === 'subscription.activated' ||
    eventType === 'subscription.active' ||
    eventType === 'subscription.updated' ||
    eventType === 'subscription.resumed' ||
    eventType === 'membership.activated' ||
    eventType === 'membership.went_valid'
  ) {
    const target = resolveCatalogPriceTarget(priceOrProductId, snapshot, params.priceMapOverrides);
    const activePlan: PaidTierPlanId =
      target && target.kind === 'subscription'
        ? (target.planId as PaidTierPlanId)
        : account.activePlanId;
    if (!target && priceOrProductId) {
      params.store.recordProcessedWebhookEvent({
        eventId,
        eventType,
        provider: providerName,
        occurredAt,
        accountId: account.accountId,
        outcome: 'unknown_price_id',
        summary: `Rejected subscription update for unknown price/product ID "${priceOrProductId}".`,
      });
      return {
        ok: false,
        httpStatus: 422,
        code: 'UNKNOWN_PRICE_ID',
        eventId,
        eventType,
        accountId: account.accountId,
        error: `Unknown provider price/product ID "${priceOrProductId}".`,
      };
    }

    const rawStatus = String(data.status ?? 'active').toLowerCase();
    const subStatus: SubscriptionLifecycleStatus =
      rawStatus === 'trialing'
        ? 'trialing'
        : rawStatus === 'past_due'
          ? 'past_due'
          : rawStatus === 'paused'
            ? 'paused'
            : rawStatus === 'canceled' || rawStatus === 'cancelled'
              ? 'canceled'
              : 'active';

    const curPeriod = (data.currentBillingPeriod ?? data.current_billing_period ?? {}) as Record<
      string,
      unknown
    >;
    const schedChange = (data.scheduledChange ?? data.scheduled_change ?? null) as Record<
      string,
      unknown
    > | null;
    const cancelScheduled = schedChange?.action === 'cancel' || Boolean(data.cancel_at_period_end);
    const canceledAtVal = data.canceledAt ?? data.canceled_at;

    params.store.applySubscriptionUpdate({
      accountId: account.accountId,
      provider: providerName,
      providerEventId: eventId,
      providerCustomerId,
      providerSubscriptionId,
      productId: target?.productId ?? account.productId,
      priceId: priceOrProductId ?? account.priceId,
      activePlanId: subStatus === 'canceled' ? 'free_explorer' : activePlan,
      billingInterval:
        target?.interval === 'monthly' || target?.interval === 'annual'
          ? target.interval
          : account.billingInterval,
      subscriptionStatus: subStatus,
      currentPeriodStart: curPeriod.startsAt ?? curPeriod.starts_at
        ? parseIsoMs(curPeriod.startsAt ?? curPeriod.starts_at)
        : account.currentPeriodStart,
      currentPeriodEnd: curPeriod.endsAt ?? curPeriod.ends_at
        ? parseIsoMs(curPeriod.endsAt ?? curPeriod.ends_at)
        : data.renewal_period_end
          ? parseIsoMs(data.renewal_period_end)
          : account.currentPeriodEnd,
      cancelAtPeriodEnd: cancelScheduled || Boolean(canceledAtVal),
      canceledAt: canceledAtVal ? parseIsoMs(canceledAtVal) : null,
      refundStatus: 'none',
      recordTransaction: false,
      occurredAt,
    });

    params.store.recordProcessedWebhookEvent({
      eventId,
      eventType,
      provider: providerName,
      occurredAt,
      accountId: account.accountId,
      outcome: 'subscription_synced',
      summary: `Synced subscription status=${subStatus} for ${activePlan}`,
    });

    return {
      ok: true,
      httpStatus: 200,
      code: 'SUBSCRIPTION_SYNCED',
      eventId,
      eventType,
      accountId: account.accountId,
    };
  }

  // 3. Cancellation, pause, past-due lifecycle events
  if (
    eventType === 'subscription.canceled' ||
    eventType === 'subscription.cancelled' ||
    eventType === 'subscription.past_due' ||
    eventType === 'subscription.paused' ||
    eventType === 'membership.deactivated' ||
    eventType === 'membership.went_invalid'
  ) {
    const nextStatus: SubscriptionLifecycleStatus =
      eventType === 'subscription.past_due'
        ? 'past_due'
        : eventType === 'subscription.paused'
          ? 'paused'
          : 'canceled';

    const curPeriod = (data.currentBillingPeriod ?? data.current_billing_period ?? {}) as Record<
      string,
      unknown
    >;
    const periodEnd = curPeriod.endsAt ?? curPeriod.ends_at
      ? parseIsoMs(curPeriod.endsAt ?? curPeriod.ends_at)
      : data.renewal_period_end
        ? parseIsoMs(data.renewal_period_end)
        : account.currentPeriodEnd;
    const effectiveStillInPeriod =
      nextStatus === 'canceled' && periodEnd !== null && Date.now() < periodEnd;

    params.store.applySubscriptionUpdate({
      accountId: account.accountId,
      provider: providerName,
      providerEventId: eventId,
      providerCustomerId,
      providerSubscriptionId,
      activePlanId: effectiveStillInPeriod ? account.activePlanId : 'free_explorer',
      billingInterval: effectiveStillInPeriod ? account.billingInterval : 'none',
      subscriptionStatus: nextStatus,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: nextStatus === 'canceled',
      canceledAt:
        nextStatus === 'canceled'
          ? parseIsoMs(data.canceledAt ?? data.canceled_at, occurredAt)
          : null,
      recordTransaction: false,
      occurredAt,
    });

    params.store.recordProcessedWebhookEvent({
      eventId,
      eventType,
      provider: providerName,
      occurredAt,
      accountId: account.accountId,
      outcome: `status_${nextStatus}`,
      summary: `Subscription updated to ${nextStatus}`,
    });

    return {
      ok: true,
      httpStatus: 200,
      code: 'SUBSCRIPTION_LIFECYCLE_UPDATED',
      eventId,
      eventType,
      accountId: account.accountId,
    };
  }

  // 4. Failed payment events
  if (
    eventType === 'transaction.payment_failed' ||
    eventType === 'transaction.canceled' ||
    eventType === 'payment.failed'
  ) {
    params.store.applySubscriptionUpdate({
      accountId: account.accountId,
      provider: providerName,
      providerEventId: eventId,
      providerCustomerId,
      providerSubscriptionId,
      providerTransactionId,
      activePlanId: 'free_explorer',
      billingInterval: 'none',
      subscriptionStatus: 'past_due',
      recordTransaction: true,
      occurredAt,
    });

    params.store.recordProcessedWebhookEvent({
      eventId,
      eventType,
      provider: providerName,
      occurredAt,
      accountId: account.accountId,
      outcome: 'payment_failed',
      summary: `Handled ${eventType}; access paused until valid payment.`,
    });

    return {
      ok: true,
      httpStatus: 200,
      code: 'PAYMENT_FAILED_HANDLED',
      eventId,
      eventType,
      accountId: account.accountId,
    };
  }

  // 5. Refund / Chargeback reversals
  if (
    eventType === 'payment.refunded' ||
    eventType === 'refund.created' ||
    eventType === 'chargeback.created' ||
    eventType === 'dispute.created' ||
    eventType === 'adjustment.created' ||
    eventType === 'adjustment.updated'
  ) {
    const defaultAction = eventType.includes('chargeback') || eventType.includes('dispute')
      ? 'chargeback'
      : 'refund';
    const action = String(data.action ?? defaultAction).toLowerCase();
    const status = String(data.status ?? 'approved').toLowerCase();
    if (
      (action === 'refund' || action === 'chargeback' || action === 'chargeback_warning') &&
      status !== 'rejected'
    ) {
      const reversalKind = action.includes('chargeback') ? 'charged_back' : 'refunded';
      const targetTxId =
        typeof data.transactionId === 'string'
          ? data.transactionId
          : typeof data.transaction_id === 'string'
            ? data.transaction_id
            : typeof data.payment_id === 'string'
              ? data.payment_id
              : eventType === 'payment.refunded' && typeof data.id === 'string'
                ? data.id
                : null;
      params.store.applyRefundOrChargeback({
        accountId: account.accountId,
        providerEventId: eventId,
        providerTransactionId: targetTxId,
        kind: reversalKind,
        occurredAt,
      });

      params.store.recordProcessedWebhookEvent({
        eventId,
        eventType,
        provider: providerName,
        occurredAt,
        accountId: account.accountId,
        outcome: reversalKind,
        summary: `Applied ${reversalKind} reversal and revoked paid access / granted credits.`,
      });

      return {
        ok: true,
        httpStatus: 200,
        code: 'REVERSAL_APPLIED',
        eventId,
        eventType,
        accountId: account.accountId,
      };
    }
  }

  params.store.recordProcessedWebhookEvent({
    eventId,
    eventType,
    provider: providerName,
    occurredAt,
    accountId: account.accountId,
    outcome: 'ignored_event_type',
    summary: `Acknowledged ${eventType} with no state change.`,
  });

  return {
    ok: true,
    httpStatus: 200,
    code: 'IGNORED_EVENT',
    eventId,
    eventType,
    accountId: account.accountId,
  };
}

/**
 * Creates a server-side Whop Checkout Configuration (`ch_...`) attaching accountId & firebaseUid
 * in `metadata` when BILLING_API_KEY is configured, so embedded checkout propagates user identity
 * into Whop's `payment.succeeded` and `membership.*` webhooks.
 */
export async function createWhopCheckoutConfiguration(params: {
  whopPlanId: string;
  accountId: string;
  firebaseUid?: string | null;
  returnUrl?: string | null;
}): Promise<{ sessionId: string | null; purchaseUrl: string | null }> {
  const apiKey = envStr('BILLING_API_KEY');
  if (!apiKey || !params.whopPlanId) {
    return { sessionId: null, purchaseUrl: null };
  }

  const metadata: Record<string, string> = {
    accountId: params.accountId,
    source: 'alphatomy_embedded_checkout',
  };
  if (params.firebaseUid) {
    metadata.firebaseUid = params.firebaseUid;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch('https://api.whop.com/api/v1/checkout_configurations', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: params.whopPlanId,
        metadata,
        ...(params.returnUrl ? { redirect_url: params.returnUrl } : {}),
      }),
    });
    clearTimeout(timer);
    if (!res.ok) {
      return { sessionId: null, purchaseUrl: null };
    }
    const json = (await res.json()) as { id?: unknown; purchase_url?: unknown };
    return {
      sessionId: typeof json.id === 'string' && json.id.trim() ? json.id.trim() : null,
      purchaseUrl:
        typeof json.purchase_url === 'string' && json.purchase_url.trim()
          ? json.purchase_url.trim()
          : null,
    };
  } catch {
    return { sessionId: null, purchaseUrl: null };
  }
}

export async function createHostedPortalSession(
  providerCustomerId: string,
): Promise<{ ok: boolean; overviewUrl?: string; error?: string }> {
  const configuredPortalUrl = envStr('BILLING_PORTAL_URL') ?? 'https://whop.com/orders';
  const snapshot = getCommercialRuntimeSnapshot();
  if (snapshot.seller.billingProvider === 'unselected') {
    return {
      ok: false,
      error:
        'Billing customer portal is unavailable until a payment provider is selected. Use Contact & Support.',
    };
  }
  const url = new URL(configuredPortalUrl);
  url.searchParams.set('customer', providerCustomerId);
  return {
    ok: true,
    overviewUrl: url.toString(),
  };
}
