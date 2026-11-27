import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  AI_SUBSCRIPTION_PLANS,
  createEntitlementAccount,
  toPublicQuotaSummary,
  type EntitlementAccount,
  type PublicQuotaSummary,
  type QuotaTransaction,
  type SubscriptionPlanId,
} from '../app/ai/quota';
import type { CommercialPlanId } from '../app/commercial/commercial-config';

export type PaidTierPlanId = 'free_explorer' | 'student_plus' | 'educator_plus';
export type SubscriptionLifecycleStatus =
  | 'free'
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'paused'
  | 'canceled'
  | 'refunded';

export type RefundReversalStatus = 'none' | 'refunded' | 'charged_back';

export interface AccountBillingRecord {
  accountId: string;
  firebaseUid: string | null;
  customerEmail: string | null;
  providerCustomerId: string | null;
  activePlanId: PaidTierPlanId;
  billingInterval: 'none' | 'monthly' | 'annual';
  subscriptionStatus: SubscriptionLifecycleStatus;
  providerSubscriptionId: string | null;
  providerTransactionId: string | null;
  productId: string | null;
  priceId: string | null;
  currentPeriodStart: number | null;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: number | null;
  refundStatus: RefundReversalStatus;
  aiPlanId: SubscriptionPlanId;
  requireSubscription: boolean;
  creditsPurchased: number;
  creditsUsed: number;
  queriesUsed: number;
  aiSubscriptionExpiresAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface BillingTransactionRecord {
  id: string;
  accountId: string;
  provider: string;
  providerEventId: string;
  providerTransactionId: string | null;
  providerSubscriptionId: string | null;
  productId: string | null;
  priceId: string | null;
  planId: string;
  billingKind: 'subscription' | 'ai_credit_pack';
  status: 'paid' | 'failed' | 'refunded' | 'charged_back';
  amountCents: number;
  currency: string;
  creditsGranted: number;
  provisionedAt: number;
  expiresAt: number | null;
  refundedAt: number | null;
}

export interface ProcessedWebhookLog {
  eventId: string;
  eventType: string;
  provider: string;
  occurredAt: number | null;
  accountId: string | null;
  outcome: string;
  summary: string;
  processedAt: number;
}

export interface AffiliateCommissionEntry {
  entryId: string;
  affiliateId: string;
  qualifyingTransactionId: string;
  internalCustomerId: string;
  commissionBasisCents: number;
  commissionRateBps: number;
  commissionEarnedCents: number;
  refundAdjustmentCents: number;
  chargebackAdjustmentCents: number;
  amountPayableCents: number;
  amountPaidCents: number;
  settlementStatus: 'pending_payout' | 'settled' | 'reversed';
  paymentDate: number | null;
  settlementReference: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface PublicBillingEntitlementSummary {
  accountId: string;
  firebaseLinked: boolean;
  activePlanId: PaidTierPlanId;
  billingInterval: 'none' | 'monthly' | 'annual';
  subscriptionStatus: SubscriptionLifecycleStatus;
  hasActivePaidSubscription: boolean;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  productId: string | null;
  priceId: string | null;
  currentPeriodStart: number | null;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: number | null;
  refundStatus: RefundReversalStatus;
  entitlements: {
    core3dAnatomy: boolean;
    studentPlusFeatures: boolean;
    educatorPlusFeatures: boolean;
    educatorExports: boolean;
    educatorClassroomManager: boolean;
  };
  aiQuota: PublicQuotaSummary;
  transactions: BillingTransactionRecord[];
}

function normalizePaidTier(planId: string | null | undefined): PaidTierPlanId {
  if (planId === 'student_plus' || planId === 'educator_plus') return planId;
  return 'free_explorer';
}

function rowToBillingRecord(row: Record<string, unknown>): AccountBillingRecord {
  return {
    accountId: String(row.account_id),
    firebaseUid: row.firebase_uid ? String(row.firebase_uid) : null,
    customerEmail: row.customer_email ? String(row.customer_email) : null,
    providerCustomerId: row.provider_customer_id ? String(row.provider_customer_id) : null,
    activePlanId: normalizePaidTier(row.active_plan_id ? String(row.active_plan_id) : 'free_explorer'),
    billingInterval:
      row.billing_interval === 'monthly' || row.billing_interval === 'annual'
        ? row.billing_interval
        : 'none',
    subscriptionStatus: (row.subscription_status as SubscriptionLifecycleStatus) || 'free',
    providerSubscriptionId: row.provider_subscription_id
      ? String(row.provider_subscription_id)
      : null,
    providerTransactionId: row.provider_transaction_id
      ? String(row.provider_transaction_id)
      : null,
    productId: row.product_id ? String(row.product_id) : null,
    priceId: row.price_id ? String(row.price_id) : null,
    currentPeriodStart: typeof row.current_period_start === 'number' ? row.current_period_start : null,
    currentPeriodEnd: typeof row.current_period_end === 'number' ? row.current_period_end : null,
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
    canceledAt: typeof row.canceled_at === 'number' ? row.canceled_at : null,
    refundStatus: (row.refund_status as RefundReversalStatus) || 'none',
    aiPlanId:
      row.ai_plan_id === 'student_monthly' || row.ai_plan_id === 'exam_prep_pack'
        ? row.ai_plan_id
        : 'free_preview',
    requireSubscription: Boolean(row.require_subscription),
    creditsPurchased: Number(row.credits_purchased ?? 0),
    creditsUsed: Number(row.credits_used ?? 0),
    queriesUsed: Number(row.queries_used ?? 0),
    aiSubscriptionExpiresAt:
      typeof row.ai_subscription_expires_at === 'number' ? row.ai_subscription_expires_at : null,
    createdAt: Number(row.created_at ?? Date.now()),
    updatedAt: Number(row.updated_at ?? Date.now()),
  };
}

function rowToTransaction(row: Record<string, unknown>): BillingTransactionRecord {
  return {
    id: String(row.id),
    accountId: String(row.account_id),
    provider: String(row.provider),
    providerEventId: String(row.provider_event_id),
    providerTransactionId: row.provider_transaction_id
      ? String(row.provider_transaction_id)
      : null,
    providerSubscriptionId: row.provider_subscription_id
      ? String(row.provider_subscription_id)
      : null,
    productId: row.product_id ? String(row.product_id) : null,
    priceId: row.price_id ? String(row.price_id) : null,
    planId: String(row.plan_id),
    billingKind: row.billing_kind === 'ai_credit_pack' ? 'ai_credit_pack' : 'subscription',
    status: (row.status as BillingTransactionRecord['status']) || 'paid',
    amountCents: Number(row.amount_cents ?? 0),
    currency: String(row.currency ?? 'USD'),
    creditsGranted: Number(row.credits_granted ?? 0),
    provisionedAt: Number(row.provisioned_at ?? 0),
    expiresAt: typeof row.expires_at === 'number' ? row.expires_at : null,
    refundedAt: typeof row.refunded_at === 'number' ? row.refunded_at : null,
  };
}

export class DurableBillingStore {
  private readonly db: DatabaseSync;

  constructor(dbPath?: string) {
    const resolvedPath =
      dbPath ??
      (process.env.BILLING_DB_PATH?.trim() ||
        path.join(process.cwd(), 'data', 'anatomy360-billing.sqlite'));

    if (resolvedPath !== ':memory:') {
      fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    }

    this.db = new DatabaseSync(resolvedPath);
    if (resolvedPath !== ':memory:') {
      this.db.exec('PRAGMA journal_mode = WAL;');
    }
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS accounts (
        account_id TEXT PRIMARY KEY,
        firebase_uid TEXT UNIQUE,
        customer_email TEXT,
        provider_customer_id TEXT UNIQUE,
        active_plan_id TEXT NOT NULL DEFAULT 'free_explorer',
        billing_interval TEXT NOT NULL DEFAULT 'none',
        subscription_status TEXT NOT NULL DEFAULT 'free',
        provider_subscription_id TEXT,
        provider_transaction_id TEXT,
        product_id TEXT,
        price_id TEXT,
        current_period_start INTEGER,
        current_period_end INTEGER,
        cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
        canceled_at INTEGER,
        refund_status TEXT NOT NULL DEFAULT 'none',
        ai_plan_id TEXT NOT NULL DEFAULT 'free_preview',
        require_subscription INTEGER NOT NULL DEFAULT 0,
        credits_purchased INTEGER NOT NULL DEFAULT 0,
        credits_used INTEGER NOT NULL DEFAULT 0,
        queries_used INTEGER NOT NULL DEFAULT 0,
        ai_subscription_expires_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS billing_transactions (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL REFERENCES accounts(account_id),
        provider TEXT NOT NULL,
        provider_event_id TEXT NOT NULL UNIQUE,
        provider_transaction_id TEXT,
        provider_subscription_id TEXT,
        product_id TEXT,
        price_id TEXT,
        plan_id TEXT NOT NULL,
        billing_kind TEXT NOT NULL,
        status TEXT NOT NULL,
        amount_cents INTEGER NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        credits_granted INTEGER NOT NULL DEFAULT 0,
        provisioned_at INTEGER NOT NULL,
        expires_at INTEGER,
        refunded_at INTEGER
      );
    `);

    const acctCols = new Set(
      (this.db.prepare('PRAGMA table_info(accounts)').all() as Array<{ name: string }>).map(
        (c) => c.name,
      ),
    );
    if (acctCols.has('paddle_customer_id') && !acctCols.has('provider_customer_id')) {
      this.db.exec('ALTER TABLE accounts RENAME COLUMN paddle_customer_id TO provider_customer_id;');
    }
    if (acctCols.has('paddle_subscription_id') && !acctCols.has('provider_subscription_id')) {
      this.db.exec(
        'ALTER TABLE accounts RENAME COLUMN paddle_subscription_id TO provider_subscription_id;',
      );
    }
    if (acctCols.has('paddle_transaction_id') && !acctCols.has('provider_transaction_id')) {
      this.db.exec(
        'ALTER TABLE accounts RENAME COLUMN paddle_transaction_id TO provider_transaction_id;',
      );
    }

    const txCols = new Set(
      (
        this.db.prepare('PRAGMA table_info(billing_transactions)').all() as Array<{ name: string }>
      ).map((c) => c.name),
    );
    if (txCols.has('paddle_transaction_id') && !txCols.has('provider_transaction_id')) {
      this.db.exec(
        'ALTER TABLE billing_transactions RENAME COLUMN paddle_transaction_id TO provider_transaction_id;',
      );
    }
    if (txCols.has('paddle_subscription_id') && !txCols.has('provider_subscription_id')) {
      this.db.exec(
        'ALTER TABLE billing_transactions RENAME COLUMN paddle_subscription_id TO provider_subscription_id;',
      );
    }

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_accounts_provider_sub ON accounts(provider_subscription_id);
      CREATE INDEX IF NOT EXISTS idx_accounts_firebase_uid ON accounts(firebase_uid);
      CREATE INDEX IF NOT EXISTS idx_accounts_provider_cust ON accounts(provider_customer_id);
      CREATE INDEX IF NOT EXISTS idx_billing_tx_account ON billing_transactions(account_id, provisioned_at DESC);
      CREATE INDEX IF NOT EXISTS idx_billing_tx_provider_tx ON billing_transactions(provider_transaction_id);

      CREATE TABLE IF NOT EXISTS processed_webhook_events (
        event_id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        provider TEXT NOT NULL,
        occurred_at INTEGER,
        account_id TEXT,
        outcome TEXT NOT NULL,
        summary TEXT NOT NULL,
        processed_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS affiliate_commission_ledger (
        entry_id TEXT PRIMARY KEY,
        affiliate_id TEXT NOT NULL,
        qualifying_transaction_id TEXT NOT NULL UNIQUE,
        internal_customer_id TEXT NOT NULL,
        commission_basis_cents INTEGER NOT NULL,
        commission_rate_bps INTEGER NOT NULL,
        commission_earned_cents INTEGER NOT NULL,
        refund_adjustment_cents INTEGER NOT NULL DEFAULT 0,
        chargeback_adjustment_cents INTEGER NOT NULL DEFAULT 0,
        amount_payable_cents INTEGER NOT NULL,
        amount_paid_cents INTEGER NOT NULL DEFAULT 0,
        settlement_status TEXT NOT NULL DEFAULT 'pending_payout',
        payment_date INTEGER,
        settlement_reference TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
  }

  close(): void {
    this.db.close();
  }

  getAccount(accountId: string): AccountBillingRecord | null {
    const stmt = this.db.prepare('SELECT * FROM accounts WHERE account_id = ?');
    const row = stmt.get(accountId) as Record<string, unknown> | undefined;
    return row ? rowToBillingRecord(row) : null;
  }

  getAccountByFirebaseUid(firebaseUid: string): AccountBillingRecord | null {
    const stmt = this.db.prepare('SELECT * FROM accounts WHERE firebase_uid = ?');
    const row = stmt.get(firebaseUid) as Record<string, unknown> | undefined;
    return row ? rowToBillingRecord(row) : null;
  }

  getAccountByProviderCustomerId(providerCustomerId: string): AccountBillingRecord | null {
    const stmt = this.db.prepare('SELECT * FROM accounts WHERE provider_customer_id = ?');
    const row = stmt.get(providerCustomerId) as Record<string, unknown> | undefined;
    return row ? rowToBillingRecord(row) : null;
  }

  getAccountByProviderSubscriptionId(providerSubscriptionId: string): AccountBillingRecord | null {
    const stmt = this.db.prepare('SELECT * FROM accounts WHERE provider_subscription_id = ?');
    const row = stmt.get(providerSubscriptionId) as Record<string, unknown> | undefined;
    return row ? rowToBillingRecord(row) : null;
  }

  getOrCreateAccount(
    accountId?: string,
    options?: {
      requireSubscriptionByDefault?: boolean;
      firebaseUid?: string | null;
      customerEmail?: string | null;
    },
  ): { account: AccountBillingRecord; isNew: boolean } {
    if (options?.firebaseUid) {
      const byUid = this.getAccountByFirebaseUid(options.firebaseUid);
      if (byUid) {
        return { account: byUid, isNew: false };
      }
    }

    if (accountId && /^acct_[a-zA-Z0-9_-]{8,64}$/.test(accountId)) {
      const existing = this.getAccount(accountId);
      if (existing) {
        if (options?.firebaseUid && !existing.firebaseUid) {
          this.linkFirebaseIdentity(existing.accountId, options.firebaseUid, options.customerEmail);
          return { account: this.getAccount(existing.accountId)!, isNew: false };
        }
        return { account: existing, isNew: false };
      }
    }

    const cleanId =
      accountId && /^acct_[a-zA-Z0-9_-]{8,64}$/.test(accountId)
        ? accountId
        : `acct_${crypto.randomBytes(12).toString('hex')}`;
    const now = Date.now();
    const requireSub = Boolean(options?.requireSubscriptionByDefault);
    const starterCredits = requireSub ? 0 : AI_SUBSCRIPTION_PLANS[0].creditsIncluded;

    this.db
      .prepare(
        `INSERT INTO accounts (
          account_id, firebase_uid, customer_email, active_plan_id, billing_interval,
          subscription_status, require_subscription, ai_plan_id, credits_purchased,
          credits_used, queries_used, created_at, updated_at
        ) VALUES (?, ?, ?, 'free_explorer', 'none', 'free', ?, 'free_preview', ?, 0, 0, ?, ?)`,
      )
      .run(
        cleanId,
        options?.firebaseUid ?? null,
        options?.customerEmail ?? null,
        requireSub ? 1 : 0,
        starterCredits,
        now,
        now,
      );

    return { account: this.getAccount(cleanId)!, isNew: true };
  }

  linkFirebaseIdentity(accountId: string, firebaseUid: string, email?: string | null): void {
    const existingForUid = this.getAccountByFirebaseUid(firebaseUid);
    if (existingForUid && existingForUid.accountId !== accountId) {
      return;
    }
    this.db
      .prepare(
        `UPDATE accounts SET firebase_uid = ?, customer_email = COALESCE(?, customer_email), updated_at = ?
         WHERE account_id = ?`,
      )
      .run(firebaseUid, email ?? null, Date.now(), accountId);
  }

  hasProcessedWebhookEvent(eventId: string): ProcessedWebhookLog | null {
    const row = this.db
      .prepare('SELECT * FROM processed_webhook_events WHERE event_id = ?')
      .get(eventId) as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      eventId: String(row.event_id),
      eventType: String(row.event_type),
      provider: String(row.provider),
      occurredAt: typeof row.occurred_at === 'number' ? row.occurred_at : null,
      accountId: row.account_id ? String(row.account_id) : null,
      outcome: String(row.outcome),
      summary: String(row.summary),
      processedAt: Number(row.processed_at),
    };
  }

  recordProcessedWebhookEvent(log: Omit<ProcessedWebhookLog, 'processedAt'>): boolean {
    const res = this.db
      .prepare(
        `INSERT OR IGNORE INTO processed_webhook_events (
          event_id, event_type, provider, occurred_at, account_id, outcome, summary, processed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        log.eventId,
        log.eventType,
        log.provider,
        log.occurredAt,
        log.accountId,
        log.outcome,
        log.summary.slice(0, 400),
        Date.now(),
      );
    return Number(res.changes ?? 0) > 0;
  }

  getTransactionsForAccount(accountId: string, limit = 16): BillingTransactionRecord[] {
    const rows = this.db
      .prepare(
        'SELECT * FROM billing_transactions WHERE account_id = ? ORDER BY provisioned_at DESC LIMIT ?',
      )
      .all(accountId, limit) as Record<string, unknown>[];
    return rows.map(rowToTransaction);
  }

  getTransactionByProviderTxId(providerTxId: string): BillingTransactionRecord | null {
    const row = this.db
      .prepare('SELECT * FROM billing_transactions WHERE provider_transaction_id = ?')
      .get(providerTxId) as Record<string, unknown> | undefined;
    return row ? rowToTransaction(row) : null;
  }

  saveAiUsageSettlement(accountId: string, creditsUsed: number, queriesUsed: number): void {
    this.db
      .prepare(
        'UPDATE accounts SET credits_used = ?, queries_used = ?, updated_at = ? WHERE account_id = ?',
      )
      .run(creditsUsed, queriesUsed, Date.now(), accountId);
  }

  applyAiQuotaPurchase(params: {
    accountId: string;
    provider: string;
    providerEventId: string;
    providerTransactionId?: string | null;
    providerCustomerId?: string | null;
    productId?: string | null;
    priceId?: string | null;
    aiPlanId: SubscriptionPlanId;
    amountCents: number;
    currency?: string;
    creditsGranted: number;
    validityDays: number | null;
    paidAt: number;
  }): { alreadyProcessed: boolean; transaction: BillingTransactionRecord } {
    const existingTx = this.db
      .prepare('SELECT * FROM billing_transactions WHERE provider_event_id = ?')
      .get(params.providerEventId) as Record<string, unknown> | undefined;
    if (existingTx) {
      return { alreadyProcessed: true, transaction: rowToTransaction(existingTx) };
    }

    const acct = this.getAccount(params.accountId);
    if (!acct) {
      throw new Error(`Account "${params.accountId}" not found.`);
    }

    const priorRemaining = Math.max(0, acct.creditsPurchased - acct.creditsUsed);
    const nextPurchased = acct.creditsUsed + priorRemaining + params.creditsGranted;
    const expiresAt =
      params.validityDays !== null
        ? params.paidAt + params.validityDays * 24 * 60 * 60 * 1000
        : acct.aiSubscriptionExpiresAt;
    const txId = `btx_${crypto.randomBytes(10).toString('hex')}`;

    this.db.exec('BEGIN IMMEDIATE;');
    try {
      this.db
        .prepare(
          `INSERT INTO billing_transactions (
            id, account_id, provider, provider_event_id, provider_transaction_id, provider_subscription_id,
            product_id, price_id, plan_id, billing_kind, status, amount_cents, currency,
            credits_granted, provisioned_at, expires_at
          ) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, 'ai_credit_pack', 'paid', ?, ?, ?, ?, ?)`,
        )
        .run(
          txId,
          params.accountId,
          params.provider,
          params.providerEventId,
          params.providerTransactionId ?? null,
          params.productId ?? null,
          params.priceId ?? null,
          params.aiPlanId,
          params.amountCents,
          params.currency ?? 'USD',
          params.creditsGranted,
          params.paidAt,
          expiresAt,
        );

      this.db
        .prepare(
          `UPDATE accounts SET
            provider_customer_id = COALESCE(?, provider_customer_id),
            provider_transaction_id = COALESCE(?, provider_transaction_id),
            ai_plan_id = ?,
            credits_purchased = ?,
            ai_subscription_expires_at = ?,
            refund_status = 'none',
            updated_at = ?
           WHERE account_id = ?`,
        )
        .run(
          params.providerCustomerId ?? null,
          params.providerTransactionId ?? null,
          params.aiPlanId,
          nextPurchased,
          expiresAt,
          Date.now(),
          params.accountId,
        );

      this.db.exec('COMMIT;');
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }

    return {
      alreadyProcessed: false,
      transaction: rowToTransaction(
        this.db.prepare('SELECT * FROM billing_transactions WHERE id = ?').get(txId) as Record<
          string,
          unknown
        >,
      ),
    };
  }

  applySubscriptionUpdate(params: {
    accountId: string;
    provider: string;
    providerEventId: string;
    providerCustomerId?: string | null;
    providerSubscriptionId?: string | null;
    providerTransactionId?: string | null;
    customerEmail?: string | null;
    productId?: string | null;
    priceId?: string | null;
    activePlanId: PaidTierPlanId;
    billingInterval: 'none' | 'monthly' | 'annual';
    subscriptionStatus: SubscriptionLifecycleStatus;
    currentPeriodStart?: number | null;
    currentPeriodEnd?: number | null;
    cancelAtPeriodEnd?: boolean;
    canceledAt?: number | null;
    refundStatus?: RefundReversalStatus;
    amountCents?: number;
    currency?: string;
    creditsBonus?: number;
    recordTransaction?: boolean;
    occurredAt: number;
  }): { account: AccountBillingRecord; transaction: BillingTransactionRecord | null } {
    const acct = this.getAccount(params.accountId);
    if (!acct) {
      throw new Error(`Account "${params.accountId}" not found.`);
    }

    this.db.exec('BEGIN IMMEDIATE;');
    let insertedTx: BillingTransactionRecord | null = null;
    try {
      const creditsBonus = Math.max(0, Math.round(params.creditsBonus ?? 0));
      const nextPurchased =
        creditsBonus > 0
          ? acct.creditsUsed + Math.max(0, acct.creditsPurchased - acct.creditsUsed) + creditsBonus
          : acct.creditsPurchased;

      this.db
        .prepare(
          `UPDATE accounts SET
            provider_customer_id = COALESCE(?, provider_customer_id),
            provider_subscription_id = COALESCE(?, provider_subscription_id),
            provider_transaction_id = COALESCE(?, provider_transaction_id),
            customer_email = COALESCE(?, customer_email),
            product_id = COALESCE(?, product_id),
            price_id = COALESCE(?, price_id),
            active_plan_id = ?,
            billing_interval = ?,
            subscription_status = ?,
            current_period_start = COALESCE(?, current_period_start),
            current_period_end = COALESCE(?, current_period_end),
            cancel_at_period_end = ?,
            canceled_at = COALESCE(?, canceled_at),
            refund_status = COALESCE(?, refund_status),
            credits_purchased = ?,
            updated_at = ?
           WHERE account_id = ?`,
        )
        .run(
          params.providerCustomerId ?? null,
          params.providerSubscriptionId ?? null,
          params.providerTransactionId ?? null,
          params.customerEmail ?? null,
          params.productId ?? null,
          params.priceId ?? null,
          params.activePlanId,
          params.billingInterval,
          params.subscriptionStatus,
          params.currentPeriodStart ?? null,
          params.currentPeriodEnd ?? null,
          params.cancelAtPeriodEnd ? 1 : 0,
          params.canceledAt ?? null,
          params.refundStatus ?? null,
          nextPurchased,
          Date.now(),
          params.accountId,
        );

      if (params.recordTransaction) {
        const existingTx = this.db
          .prepare('SELECT * FROM billing_transactions WHERE provider_event_id = ?')
          .get(params.providerEventId) as Record<string, unknown> | undefined;
        if (existingTx) {
          insertedTx = rowToTransaction(existingTx);
        } else {
          const txId = `btx_${crypto.randomBytes(10).toString('hex')}`;
          const txStatus =
            params.subscriptionStatus === 'past_due'
              ? 'failed'
              : params.subscriptionStatus === 'refunded'
                ? 'refunded'
                : 'paid';
          this.db
            .prepare(
              `INSERT INTO billing_transactions (
                id, account_id, provider, provider_event_id, provider_transaction_id, provider_subscription_id,
                product_id, price_id, plan_id, billing_kind, status, amount_cents, currency,
                credits_granted, provisioned_at, expires_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'subscription', ?, ?, ?, ?, ?, ?)`,
            )
            .run(
              txId,
              params.accountId,
              params.provider,
              params.providerEventId,
              params.providerTransactionId ?? null,
              params.providerSubscriptionId ?? null,
              params.productId ?? null,
              params.priceId ?? null,
              params.activePlanId,
              txStatus,
              params.amountCents ?? 0,
              params.currency ?? 'USD',
              creditsBonus,
              params.occurredAt,
              params.currentPeriodEnd ?? null,
            );
          insertedTx = rowToTransaction(
            this.db.prepare('SELECT * FROM billing_transactions WHERE id = ?').get(txId) as Record<
              string,
              unknown
            >,
          );
        }
      }

      this.db.exec('COMMIT;');
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }

    return {
      account: this.getAccount(params.accountId)!,
      transaction: insertedTx,
    };
  }

  applyRefundOrChargeback(params: {
    accountId: string;
    providerEventId: string;
    providerTransactionId?: string | null;
    kind: 'refunded' | 'charged_back';
    occurredAt: number;
  }): { account: AccountBillingRecord; revokedCredits: number } {
    const acct = this.getAccount(params.accountId);
    if (!acct) {
      throw new Error(`Account "${params.accountId}" not found.`);
    }

    const matchingTx = params.providerTransactionId
      ? this.getTransactionByProviderTxId(params.providerTransactionId)
      : null;
    const creditsToRevoke = matchingTx?.creditsGranted ?? 0;
    const nextPurchased = Math.max(acct.creditsUsed, acct.creditsPurchased - creditsToRevoke);

    this.db.exec('BEGIN IMMEDIATE;');
    try {
      this.db
        .prepare(
          `UPDATE accounts SET
            active_plan_id = 'free_explorer',
            billing_interval = 'none',
            subscription_status = 'refunded',
            refund_status = ?,
            cancel_at_period_end = 0,
            canceled_at = COALESCE(canceled_at, ?),
            credits_purchased = ?,
            ai_plan_id = CASE WHEN ? > 0 THEN 'free_preview' ELSE ai_plan_id END,
            updated_at = ?
           WHERE account_id = ?`,
        )
        .run(
          params.kind,
          params.occurredAt,
          nextPurchased,
          creditsToRevoke,
          Date.now(),
          params.accountId,
        );

      if (matchingTx) {
        this.db
          .prepare('UPDATE billing_transactions SET status = ?, refunded_at = ? WHERE id = ?')
          .run(params.kind, params.occurredAt, matchingTx.id);
      }

      if (params.providerTransactionId) {
        this.applyAffiliateAdjustmentForTransaction(
          params.providerTransactionId,
          params.kind === 'charged_back' ? 'chargeback' : 'refund',
        );
      }

      this.db.exec('COMMIT;');
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }

    return {
      account: this.getAccount(params.accountId)!,
      revokedCredits: creditsToRevoke,
    };
  }

  /**
   * Internal affiliate commission ledger (disabled for public launch until chosen provider approves in writing).
   * Stores NO customer study history or email PII — only opaque customer ID & transaction financials.
   */
  recordAffiliateCommissionEntry(params: {
    affiliateId: string;
    qualifyingTransactionId: string;
    internalCustomerId: string;
    commissionBasisCents: number;
    commissionRateBps: number;
  }): AffiliateCommissionEntry {
    const existing = this.db
      .prepare('SELECT * FROM affiliate_commission_ledger WHERE qualifying_transaction_id = ?')
      .get(params.qualifyingTransactionId) as Record<string, unknown> | undefined;
    if (existing) {
      return this.mapAffiliateRow(existing);
    }

    const earned = Math.round((params.commissionBasisCents * params.commissionRateBps) / 10_000);
    const entryId = `aff_${crypto.randomBytes(10).toString('hex')}`;
    const now = Date.now();
    this.db
      .prepare(
        `INSERT INTO affiliate_commission_ledger (
          entry_id, affiliate_id, qualifying_transaction_id, internal_customer_id,
          commission_basis_cents, commission_rate_bps, commission_earned_cents,
          refund_adjustment_cents, chargeback_adjustment_cents, amount_payable_cents,
          amount_paid_cents, settlement_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, 0, 'pending_payout', ?, ?)`,
      )
      .run(
        entryId,
        params.affiliateId,
        params.qualifyingTransactionId,
        params.internalCustomerId,
        params.commissionBasisCents,
        params.commissionRateBps,
        earned,
        earned,
        now,
        now,
      );

    const row = this.db
      .prepare('SELECT * FROM affiliate_commission_ledger WHERE entry_id = ?')
      .get(entryId) as Record<string, unknown>;
    return this.mapAffiliateRow(row);
  }

  applyAffiliateAdjustmentForTransaction(
    qualifyingTransactionId: string,
    kind: 'refund' | 'chargeback',
  ): void {
    const existing = this.db
      .prepare('SELECT * FROM affiliate_commission_ledger WHERE qualifying_transaction_id = ?')
      .get(qualifyingTransactionId) as Record<string, unknown> | undefined;
    if (!existing) return;

    const earned = Number(existing.commission_earned_cents ?? 0);
    const refundAdj = kind === 'refund' ? earned : Number(existing.refund_adjustment_cents ?? 0);
    const chargebackAdj =
      kind === 'chargeback' ? earned : Number(existing.chargeback_adjustment_cents ?? 0);
    const payable = Math.max(0, earned - refundAdj - chargebackAdj);
    this.db
      .prepare(
        `UPDATE affiliate_commission_ledger SET
          refund_adjustment_cents = ?,
          chargeback_adjustment_cents = ?,
          amount_payable_cents = ?,
          settlement_status = CASE WHEN ? = 0 THEN 'reversed' ELSE settlement_status END,
          updated_at = ?
         WHERE entry_id = ?`,
      )
      .run(refundAdj, chargebackAdj, payable, payable, Date.now(), String(existing.entry_id));
  }

  getAffiliateLedgerEntry(qualifyingTransactionId: string): AffiliateCommissionEntry | null {
    const row = this.db
      .prepare('SELECT * FROM affiliate_commission_ledger WHERE qualifying_transaction_id = ?')
      .get(qualifyingTransactionId) as Record<string, unknown> | undefined;
    return row ? this.mapAffiliateRow(row) : null;
  }

  private mapAffiliateRow(row: Record<string, unknown>): AffiliateCommissionEntry {
    return {
      entryId: String(row.entry_id),
      affiliateId: String(row.affiliate_id),
      qualifyingTransactionId: String(row.qualifying_transaction_id),
      internalCustomerId: String(row.internal_customer_id),
      commissionBasisCents: Number(row.commission_basis_cents),
      commissionRateBps: Number(row.commission_rate_bps),
      commissionEarnedCents: Number(row.commission_earned_cents),
      refundAdjustmentCents: Number(row.refund_adjustment_cents),
      chargebackAdjustmentCents: Number(row.chargeback_adjustment_cents),
      amountPayableCents: Number(row.amount_payable_cents),
      amountPaidCents: Number(row.amount_paid_cents),
      settlementStatus: row.settlement_status as AffiliateCommissionEntry['settlementStatus'],
      paymentDate: typeof row.payment_date === 'number' ? row.payment_date : null,
      settlementReference: row.settlement_reference ? String(row.settlement_reference) : null,
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at),
    };
  }

  toLegacyAiEntitlementAccount(record: AccountBillingRecord): EntitlementAccount {
    const txs = this.getTransactionsForAccount(record.accountId, 20);
    const processedRows = this.db
      .prepare(
        'SELECT event_id FROM processed_webhook_events WHERE account_id = ? ORDER BY processed_at DESC LIMIT 50',
      )
      .all(record.accountId) as { event_id: string }[];

    const legacyTxs: QuotaTransaction[] = txs
      .filter((t) => t.creditsGranted > 0)
      .map((t) => ({
        id: t.id,
        provider: t.provider,
        providerEventId: t.providerEventId,
        planId:
          t.planId === 'student_monthly' || t.planId === 'exam_prep_pack'
            ? t.planId
            : 'student_monthly',
        amountUsdCents: t.amountCents,
        creditsGranted: t.creditsGranted,
        provisionedAt: t.provisionedAt,
        expiresAt: t.expiresAt,
      }));

    return {
      ...createEntitlementAccount(record.accountId, record.requireSubscription, record.createdAt),
      accountId: record.accountId,
      planId: record.aiPlanId,
      requireSubscription: record.requireSubscription,
      creditsPurchased: record.creditsPurchased,
      creditsUsed: record.creditsUsed,
      queriesUsed: record.queriesUsed,
      subscriptionExpiresAt: record.aiSubscriptionExpiresAt,
      processedPaymentIds: [
        ...processedRows.map((r) => r.event_id),
        ...txs.map((t) => t.providerEventId),
      ].slice(0, 50),
      transactions: legacyTxs,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  toPublicEntitlementSummary(
    record: AccountBillingRecord,
    nowMs = Date.now(),
  ): PublicBillingEntitlementSummary {
    const legacyAi = this.toLegacyAiEntitlementAccount(record);
    const aiQuota = toPublicQuotaSummary(legacyAi, nowMs);
    const txs = this.getTransactionsForAccount(record.accountId, 12);

    const periodValid =
      record.currentPeriodEnd === null || nowMs <= record.currentPeriodEnd;
    const paidActive =
      record.activePlanId !== 'free_explorer' &&
      (record.subscriptionStatus === 'active' ||
        record.subscriptionStatus === 'trialing' ||
        (record.subscriptionStatus === 'canceled' &&
          record.cancelAtPeriodEnd &&
          periodValid)) &&
      record.refundStatus === 'none';

    const effectiveTier: CommercialPlanId = paidActive ? record.activePlanId : 'free_explorer';

    return {
      accountId: record.accountId,
      firebaseLinked: Boolean(record.firebaseUid),
      activePlanId: normalizePaidTier(effectiveTier),
      billingInterval: paidActive ? record.billingInterval : 'none',
      subscriptionStatus: record.subscriptionStatus,
      hasActivePaidSubscription: paidActive,
      providerCustomerId: record.providerCustomerId,
      providerSubscriptionId: record.providerSubscriptionId,
      productId: record.productId,
      priceId: record.priceId,
      currentPeriodStart: record.currentPeriodStart,
      currentPeriodEnd: record.currentPeriodEnd,
      cancelAtPeriodEnd: record.cancelAtPeriodEnd,
      canceledAt: record.canceledAt,
      refundStatus: record.refundStatus,
      entitlements: {
        core3dAnatomy: true,
        studentPlusFeatures:
          paidActive && (effectiveTier === 'student_plus' || effectiveTier === 'educator_plus'),
        educatorPlusFeatures: paidActive && effectiveTier === 'educator_plus',
        educatorExports: paidActive && effectiveTier === 'educator_plus',
        educatorClassroomManager: paidActive && effectiveTier === 'educator_plus',
      },
      aiQuota,
      transactions: txs,
    };
  }
}

let sharedStore: DurableBillingStore | null = null;

export function getBillingStore(): DurableBillingStore {
  if (!sharedStore) {
    sharedStore = new DurableBillingStore();
  }
  return sharedStore;
}
