import { relations } from 'drizzle-orm';
import {
  bigint,
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const billingAccounts = pgTable(
  'billing_accounts',
  {
    accountId: text('account_id').primaryKey(),
    firebaseUid: text('firebase_uid').unique(),
    customerEmail: text('customer_email'),
    providerCustomerId: text('provider_customer_id').unique(),
    activePlanId: text('active_plan_id').notNull().default('free_explorer'),
    billingInterval: text('billing_interval').notNull().default('none'),
    subscriptionStatus: text('subscription_status').notNull().default('free'),
    providerSubscriptionId: text('provider_subscription_id'),
    providerTransactionId: text('provider_transaction_id'),
    productId: text('product_id'),
    priceId: text('price_id'),
    currentPeriodStart: bigint('current_period_start', { mode: 'number' }),
    currentPeriodEnd: bigint('current_period_end', { mode: 'number' }),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    canceledAt: bigint('canceled_at', { mode: 'number' }),
    refundStatus: text('refund_status').notNull().default('none'),
    aiPlanId: text('ai_plan_id').notNull().default('free_preview'),
    requireSubscription: boolean('require_subscription').notNull().default(false),
    creditsPurchased: integer('credits_purchased').notNull().default(0),
    creditsUsed: integer('credits_used').notNull().default(0),
    queriesUsed: integer('queries_used').notNull().default(0),
    aiSubscriptionExpiresAt: bigint('ai_subscription_expires_at', { mode: 'number' }),
    createdAt: bigint('created_at', { mode: 'number' }).notNull(),
    updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
  },
  (table) => [index('idx_pg_accounts_provider_sub').on(table.providerSubscriptionId)],
);

export const billingTransactions = pgTable(
  'billing_transactions',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id')
      .notNull()
      .references(() => billingAccounts.accountId),
    provider: text('provider').notNull(),
    providerEventId: text('provider_event_id').notNull().unique(),
    providerTransactionId: text('provider_transaction_id'),
    providerSubscriptionId: text('provider_subscription_id'),
    productId: text('product_id'),
    priceId: text('price_id'),
    planId: text('plan_id').notNull(),
    billingKind: text('billing_kind').notNull(),
    status: text('status').notNull(),
    amountCents: integer('amount_cents').notNull(),
    currency: text('currency').notNull().default('USD'),
    creditsGranted: integer('credits_granted').notNull().default(0),
    provisionedAt: bigint('provisioned_at', { mode: 'number' }).notNull(),
    expiresAt: bigint('expires_at', { mode: 'number' }),
    refundedAt: bigint('refunded_at', { mode: 'number' }),
  },
  (table) => [
    index('idx_pg_billing_tx_account').on(table.accountId, table.provisionedAt),
    index('idx_pg_billing_tx_provider_tx').on(table.providerTransactionId),
  ],
);

export const processedWebhookEvents = pgTable(
  'processed_webhook_events',
  {
    eventId: text('event_id').primaryKey(),
    eventType: text('event_type').notNull(),
    provider: text('provider').notNull(),
    occurredAt: bigint('occurred_at', { mode: 'number' }),
    accountId: text('account_id'),
    outcome: text('outcome').notNull(),
    summary: text('summary').notNull(),
    processedAt: bigint('processed_at', { mode: 'number' }).notNull(),
  },
  (table) => [index('idx_pg_webhook_account').on(table.accountId, table.processedAt)],
);

export const affiliateCommissionLedger = pgTable('affiliate_commission_ledger', {
  entryId: text('entry_id').primaryKey(),
  affiliateId: text('affiliate_id').notNull(),
  qualifyingTransactionId: text('qualifying_transaction_id').notNull().unique(),
  internalCustomerId: text('internal_customer_id').notNull(),
  commissionBasisCents: integer('commission_basis_cents').notNull(),
  commissionRateBps: integer('commission_rate_bps').notNull(),
  commissionEarnedCents: integer('commission_earned_cents').notNull(),
  refundAdjustmentCents: integer('refund_adjustment_cents').notNull().default(0),
  chargebackAdjustmentCents: integer('chargeback_adjustment_cents').notNull().default(0),
  amountPayableCents: integer('amount_payable_cents').notNull(),
  amountPaidCents: integer('amount_paid_cents').notNull().default(0),
  settlementStatus: text('settlement_status').notNull().default('pending_payout'),
  paymentDate: bigint('payment_date', { mode: 'number' }),
  settlementReference: text('settlement_reference'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
});

export const billingAccountsRelations = relations(billingAccounts, ({ many }) => ({
  transactions: many(billingTransactions),
}));

export const billingTransactionsRelations = relations(billingTransactions, ({ one }) => ({
  account: one(billingAccounts, {
    fields: [billingTransactions.accountId],
    references: [billingAccounts.accountId],
  }),
}));
