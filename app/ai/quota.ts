export type SubscriptionPlanId = 'free_preview' | 'student_monthly' | 'exam_prep_pack';

export type QuotaAccessStatus =
  | 'active_trial'
  | 'active_subscription'
  | 'subscription_required'
  | 'quota_exhausted';

export interface AiSubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  billingKind: 'trial' | 'monthly_subscription' | 'on_demand_topup';
  priceUsdCents: number;
  priceLabel: string;
  creditsIncluded: number;
  estimatedQueries: number;
  validityDays: number | null;
  summary: string;
  onTheSpotRule: string;
}

export const AI_SUBSCRIPTION_PLANS: readonly AiSubscriptionPlan[] = [
  {
    id: 'free_preview',
    name: 'Starter Free Preview',
    billingKind: 'trial',
    priceUsdCents: 0,
    priceLabel: '$0',
    creditsIncluded: 12_000,
    estimatedQueries: 8,
    validityDays: null,
    summary: 'Bounded preview allowance to test 3D AI navigation before subscribing.',
    onTheSpotRule: 'Can be disabled anytime via AI_REQUIRE_SUBSCRIPTION=true for $0 upfront exposure.',
  },
  {
    id: 'student_monthly',
    name: 'Student Monthly Pass',
    billingKind: 'monthly_subscription',
    priceUsdCents: 499,
    priceLabel: '$4.99 / mo',
    creditsIncluded: 250_000,
    estimatedQueries: 180,
    validityDays: 30,
    summary: 'Auto-provisions 250,000 metered AI credits on payment confirmation for 30 days.',
    onTheSpotRule: 'Purchased on the spot from the user payment webhook — zero developer pre-funding.',
  },
  {
    id: 'exam_prep_pack',
    name: 'Exam Prep Burst Pack',
    billingKind: 'on_demand_topup',
    priceUsdCents: 999,
    priceLabel: '$9.99 top-up',
    creditsIncluded: 650_000,
    estimatedQueries: 480,
    validityDays: 90,
    summary: 'Additive 650,000 AI credits unlocked immediately upon verified payment.',
    onTheSpotRule: 'Top-up credits stack on top of existing balance and settle per actual Gemini usage.',
  },
];

export interface QuotaTransaction {
  id: string;
  provider: string;
  providerEventId: string;
  planId: SubscriptionPlanId;
  amountUsdCents: number;
  creditsGranted: number;
  provisionedAt: number;
  expiresAt: number | null;
}

export interface EntitlementAccount {
  accountId: string;
  planId: SubscriptionPlanId;
  requireSubscription: boolean;
  creditsPurchased: number;
  creditsUsed: number;
  queriesUsed: number;
  subscriptionExpiresAt: number | null;
  processedPaymentIds: string[];
  transactions: QuotaTransaction[];
  createdAt: number;
  updatedAt: number;
}

export interface PublicQuotaSummary {
  accountId: string;
  planId: SubscriptionPlanId;
  planName: string;
  status: QuotaAccessStatus;
  requireSubscription: boolean;
  creditsPurchased: number;
  creditsUsed: number;
  creditsRemaining: number;
  estimatedQueriesRemaining: number;
  queriesUsed: number;
  subscriptionExpiresAt: number | null;
  transactions: QuotaTransaction[];
}

export interface TokenUsageMetrics {
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
}

export interface VerifiedPaymentEvent {
  provider: string;
  providerEventId: string;
  accountId: string;
  planId: SubscriptionPlanId;
  status: 'paid' | 'failed' | 'refunded';
  amountUsdCents: number;
  paidAt?: number;
}

export const MIN_PREFLIGHT_RESERVE_CREDITS = 1_200;
export const CREDITS_PER_AVERAGE_QUERY = 1_400;

export function getPlanById(planId: string): AiSubscriptionPlan | undefined {
  return AI_SUBSCRIPTION_PLANS.find((p) => p.id === planId);
}

export function estimateReserveCredits(promptText: string): number {
  const promptChars = Math.max(1, promptText.trim().length);
  return Math.min(4_000, Math.max(MIN_PREFLIGHT_RESERVE_CREDITS, Math.round(promptChars * 1.5) + 1_000));
}

export function calculateCreditsFromUsage(usage: TokenUsageMetrics): number {
  const prompt = Math.max(0, Math.round(usage.promptTokens || 0));
  const candidates = Math.max(0, Math.round(usage.candidatesTokens || 0));
  const weighted = prompt + candidates * 4;
  return Math.max(250, weighted);
}

export function createEntitlementAccount(
  accountId: string,
  requireSubscription: boolean,
  nowMs = Date.now(),
): EntitlementAccount {
  const trialCredits = requireSubscription ? 0 : AI_SUBSCRIPTION_PLANS[0].creditsIncluded;
  return {
    accountId,
    planId: 'free_preview',
    requireSubscription,
    creditsPurchased: trialCredits,
    creditsUsed: 0,
    queriesUsed: 0,
    subscriptionExpiresAt: null,
    processedPaymentIds: [],
    transactions: [],
    createdAt: nowMs,
    updatedAt: nowMs,
  };
}

export function getRemainingCredits(account: EntitlementAccount, nowMs = Date.now()): number {
  if (
    account.planId === 'student_monthly' &&
    account.subscriptionExpiresAt !== null &&
    nowMs > account.subscriptionExpiresAt
  ) {
    return 0;
  }
  return Math.max(0, account.creditsPurchased - account.creditsUsed);
}

export function getQuotaStatus(account: EntitlementAccount, nowMs = Date.now()): QuotaAccessStatus {
  const remaining = getRemainingCredits(account, nowMs);
  if (account.requireSubscription && account.transactions.length === 0) {
    return 'subscription_required';
  }
  if (remaining < MIN_PREFLIGHT_RESERVE_CREDITS) {
    return account.transactions.length === 0 && account.requireSubscription
      ? 'subscription_required'
      : 'quota_exhausted';
  }
  return account.transactions.length > 0 ? 'active_subscription' : 'active_trial';
}

export function canSpendCredits(
  account: EntitlementAccount,
  requiredCredits = MIN_PREFLIGHT_RESERVE_CREDITS,
  nowMs = Date.now(),
): {
  allowed: boolean;
  reason?: 'SUBSCRIPTION_REQUIRED' | 'QUOTA_EXHAUSTED';
  remainingCredits: number;
} {
  const remainingCredits = getRemainingCredits(account, nowMs);
  if (account.requireSubscription && account.transactions.length === 0) {
    return { allowed: false, reason: 'SUBSCRIPTION_REQUIRED', remainingCredits: 0 };
  }
  if (remainingCredits < requiredCredits) {
    return { allowed: false, reason: 'QUOTA_EXHAUSTED', remainingCredits };
  }
  return { allowed: true, remainingCredits };
}

export function settleUsageCredits(
  account: EntitlementAccount,
  usage: TokenUsageMetrics,
  nowMs = Date.now(),
): {
  account: EntitlementAccount;
  creditsCharged: number;
} {
  const creditsCharged = calculateCreditsFromUsage(usage);
  const nextUsed = Math.min(account.creditsPurchased, account.creditsUsed + creditsCharged);
  return {
    creditsCharged,
    account: {
      ...account,
      creditsUsed: nextUsed,
      queriesUsed: account.queriesUsed + 1,
      updatedAt: nowMs,
    },
  };
}

export function provisionQuotaFromPayment(
  account: EntitlementAccount,
  payment: VerifiedPaymentEvent,
  nowMs = Date.now(),
): {
  account: EntitlementAccount;
  provisioned: boolean;
  alreadyProcessed: boolean;
  transaction?: QuotaTransaction;
  error?: string;
} {
  if (payment.status !== 'paid') {
    return {
      account,
      provisioned: false,
      alreadyProcessed: false,
      error: `Payment status is "${payment.status}"; quota is only provisioned after "paid" confirmation.`,
    };
  }

  const cleanEventId = payment.providerEventId.trim();
  if (!cleanEventId) {
    return {
      account,
      provisioned: false,
      alreadyProcessed: false,
      error: 'Missing providerEventId for idempotent provisioning.',
    };
  }

  if (account.processedPaymentIds.includes(cleanEventId)) {
    const existingTx = account.transactions.find((t) => t.providerEventId === cleanEventId);
    return {
      account,
      provisioned: false,
      alreadyProcessed: true,
      transaction: existingTx,
    };
  }

  const plan = getPlanById(payment.planId);
  if (!plan || plan.id === 'free_preview') {
    return {
      account,
      provisioned: false,
      alreadyProcessed: false,
      error: `Unknown purchasable plan "${payment.planId}".`,
    };
  }

  if (payment.amountUsdCents < plan.priceUsdCents) {
    return {
      account,
      provisioned: false,
      alreadyProcessed: false,
      error: `Paid amount (${payment.amountUsdCents}c) is below plan minimum (${plan.priceUsdCents}c).`,
    };
  }

  const paidAt = payment.paidAt ?? nowMs;
  const expiresAt =
    plan.validityDays !== null ? paidAt + plan.validityDays * 24 * 60 * 60 * 1000 : account.subscriptionExpiresAt;

  // Carry forward remaining unexpired paid credits cleanly when upgrading/topping up
  const priorRemaining = Math.max(0, account.creditsPurchased - account.creditsUsed);
  const nextPurchased = account.creditsUsed + priorRemaining + plan.creditsIncluded;

  const transaction: QuotaTransaction = {
    id: `qtx_${cleanEventId.slice(0, 24)}`,
    provider: payment.provider || 'billing_webhook',
    providerEventId: cleanEventId,
    planId: plan.id,
    amountUsdCents: payment.amountUsdCents,
    creditsGranted: plan.creditsIncluded,
    provisionedAt: paidAt,
    expiresAt,
  };

  return {
    provisioned: true,
    alreadyProcessed: false,
    transaction,
    account: {
      ...account,
      planId: plan.id,
      creditsPurchased: nextPurchased,
      subscriptionExpiresAt: expiresAt,
      processedPaymentIds: [cleanEventId, ...account.processedPaymentIds].slice(0, 50),
      transactions: [transaction, ...account.transactions].slice(0, 20),
      updatedAt: nowMs,
    },
  };
}

export function toPublicQuotaSummary(
  account: EntitlementAccount,
  nowMs = Date.now(),
): PublicQuotaSummary {
  const plan = getPlanById(account.planId) ?? AI_SUBSCRIPTION_PLANS[0];
  const creditsRemaining = getRemainingCredits(account, nowMs);
  return {
    accountId: account.accountId,
    planId: account.planId,
    planName: plan.name,
    status: getQuotaStatus(account, nowMs),
    requireSubscription: account.requireSubscription,
    creditsPurchased: account.creditsPurchased,
    creditsUsed: account.creditsUsed,
    creditsRemaining,
    estimatedQueriesRemaining: Math.floor(creditsRemaining / CREDITS_PER_AVERAGE_QUERY),
    queriesUsed: account.queriesUsed,
    subscriptionExpiresAt: account.subscriptionExpiresAt,
    transactions: account.transactions.slice(0, 8),
  };
}
