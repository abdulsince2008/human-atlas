import crypto from 'node:crypto';
import { desc, eq } from 'drizzle-orm';
import { AI_SUBSCRIPTION_PLANS, type EntitlementAccount, type SubscriptionPlanId } from '../app/ai/quota';
import { getDb } from '../src/db/index.ts';
import {
  affiliateCommissionLedger,
  billingAccounts,
  billingTransactions,
  processedWebhookEvents,
} from '../src/db/schema.ts';
import {
  buildLegacyAiEntitlementAccount,
  buildPublicEntitlementSummary,
  normalizePaidTier,
  type AccountBillingRecord,
  type AffiliateCommissionEntry,
  type AsyncBillingStore,
  type BillingTransactionRecord,
  type PaidTierPlanId,
  type ProcessedWebhookLog,
  type PublicBillingEntitlementSummary,
  type RefundReversalStatus,
  type SubscriptionLifecycleStatus,
} from './billing-store';

function rowToBillingRecord(
  row: typeof billingAccounts.$inferSelect,
): AccountBillingRecord {
  return {
    accountId: row.accountId,
    firebaseUid: row.firebaseUid ?? null,
    customerEmail: row.customerEmail ?? null,
    providerCustomerId: row.providerCustomerId ?? null,
    activePlanId: normalizePaidTier(row.activePlanId),
    billingInterval:
      row.billingInterval === 'monthly' || row.billingInterval === 'annual'
        ? row.billingInterval
        : 'none',
    subscriptionStatus: (row.subscriptionStatus as SubscriptionLifecycleStatus) || 'free',
    providerSubscriptionId: row.providerSubscriptionId ?? null,
    providerTransactionId: row.providerTransactionId ?? null,
    productId: row.productId ?? null,
    priceId: row.priceId ?? null,
    currentPeriodStart: row.currentPeriodStart ?? null,
    currentPeriodEnd: row.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: Boolean(row.cancelAtPeriodEnd),
    canceledAt: row.canceledAt ?? null,
    refundStatus: (row.refundStatus as RefundReversalStatus) || 'none',
    aiPlanId:
      row.aiPlanId === 'student_monthly' || row.aiPlanId === 'exam_prep_pack'
        ? row.aiPlanId
        : 'free_preview',
    requireSubscription: Boolean(row.requireSubscription),
    creditsPurchased: row.creditsPurchased ?? 0,
    creditsUsed: row.creditsUsed ?? 0,
    queriesUsed: row.queriesUsed ?? 0,
    aiSubscriptionExpiresAt: row.aiSubscriptionExpiresAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowToTransaction(
  row: typeof billingTransactions.$inferSelect,
): BillingTransactionRecord {
  return {
    id: row.id,
    accountId: row.accountId,
    provider: row.provider,
    providerEventId: row.providerEventId,
    providerTransactionId: row.providerTransactionId ?? null,
    providerSubscriptionId: row.providerSubscriptionId ?? null,
    productId: row.productId ?? null,
    priceId: row.priceId ?? null,
    planId: row.planId,
    billingKind: row.billingKind === 'ai_credit_pack' ? 'ai_credit_pack' : 'subscription',
    status: (row.status as BillingTransactionRecord['status']) || 'paid',
    amountCents: row.amountCents,
    currency: row.currency || 'USD',
    creditsGranted: row.creditsGranted,
    provisionedAt: row.provisionedAt,
    expiresAt: row.expiresAt ?? null,
    refundedAt: row.refundedAt ?? null,
  };
}

function mapAffiliateRow(
  row: typeof affiliateCommissionLedger.$inferSelect,
): AffiliateCommissionEntry {
  return {
    entryId: row.entryId,
    affiliateId: row.affiliateId,
    qualifyingTransactionId: row.qualifyingTransactionId,
    internalCustomerId: row.internalCustomerId,
    commissionBasisCents: row.commissionBasisCents,
    commissionRateBps: row.commissionRateBps,
    commissionEarnedCents: row.commissionEarnedCents,
    refundAdjustmentCents: row.refundAdjustmentCents,
    chargebackAdjustmentCents: row.chargebackAdjustmentCents,
    amountPayableCents: row.amountPayableCents,
    amountPaidCents: row.amountPaidCents,
    settlementStatus: row.settlementStatus as AffiliateCommissionEntry['settlementStatus'],
    paymentDate: row.paymentDate ?? null,
    settlementReference: row.settlementReference ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PostgresBillingStore implements AsyncBillingStore {
  private wrapError(action: string, error: unknown): never {
    console.error(`Cloud SQL ${action} failed:`, error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }

  async getAccount(accountId: string): Promise<AccountBillingRecord | null> {
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(billingAccounts)
        .where(eq(billingAccounts.accountId, accountId))
        .limit(1);
      return rows[0] ? rowToBillingRecord(rows[0]) : null;
    } catch (error) {
      this.wrapError('getAccount', error);
    }
  }

  async getAccountByFirebaseUid(firebaseUid: string): Promise<AccountBillingRecord | null> {
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(billingAccounts)
        .where(eq(billingAccounts.firebaseUid, firebaseUid))
        .limit(1);
      return rows[0] ? rowToBillingRecord(rows[0]) : null;
    } catch (error) {
      this.wrapError('getAccountByFirebaseUid', error);
    }
  }

  async getAccountByProviderCustomerId(
    providerCustomerId: string,
  ): Promise<AccountBillingRecord | null> {
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(billingAccounts)
        .where(eq(billingAccounts.providerCustomerId, providerCustomerId))
        .limit(1);
      return rows[0] ? rowToBillingRecord(rows[0]) : null;
    } catch (error) {
      this.wrapError('getAccountByProviderCustomerId', error);
    }
  }

  async getAccountByProviderSubscriptionId(
    providerSubscriptionId: string,
  ): Promise<AccountBillingRecord | null> {
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(billingAccounts)
        .where(eq(billingAccounts.providerSubscriptionId, providerSubscriptionId))
        .limit(1);
      return rows[0] ? rowToBillingRecord(rows[0]) : null;
    } catch (error) {
      this.wrapError('getAccountByProviderSubscriptionId', error);
    }
  }

  async getOrCreateAccount(
    accountId?: string,
    options?: {
      requireSubscriptionByDefault?: boolean;
      firebaseUid?: string | null;
      customerEmail?: string | null;
    },
  ): Promise<{ account: AccountBillingRecord; isNew: boolean }> {
    try {
      if (options?.firebaseUid) {
        const byUid = await this.getAccountByFirebaseUid(options.firebaseUid);
        if (byUid) {
          return { account: byUid, isNew: false };
        }
      }

      if (accountId && /^acct_[a-zA-Z0-9_-]{8,64}$/.test(accountId)) {
        const existing = await this.getAccount(accountId);
        if (existing) {
          if (options?.firebaseUid && !existing.firebaseUid) {
            await this.linkFirebaseIdentity(
              existing.accountId,
              options.firebaseUid,
              options.customerEmail,
            );
            const refreshed = await this.getAccount(existing.accountId);
            return { account: refreshed ?? existing, isNew: false };
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

      const db = getDb();
      const inserted = await db
        .insert(billingAccounts)
        .values({
          accountId: cleanId,
          firebaseUid: options?.firebaseUid ?? null,
          customerEmail: options?.customerEmail ?? null,
          activePlanId: 'free_explorer',
          billingInterval: 'none',
          subscriptionStatus: 'free',
          requireSubscription: requireSub,
          aiPlanId: 'free_preview',
          creditsPurchased: starterCredits,
          creditsUsed: 0,
          queriesUsed: 0,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing()
        .returning();

      if (inserted[0]) {
        return { account: rowToBillingRecord(inserted[0]), isNew: true };
      }

      const reloaded = await this.getAccount(cleanId);
      if (reloaded) {
        return { account: reloaded, isNew: false };
      }
      if (options?.firebaseUid) {
        const reloadedByUid = await this.getAccountByFirebaseUid(options.firebaseUid);
        if (reloadedByUid) {
          return { account: reloadedByUid, isNew: false };
        }
      }
      throw new Error('Unable to create or reload billing account.');
    } catch (error) {
      this.wrapError('getOrCreateAccount', error);
    }
  }

  async linkFirebaseIdentity(
    accountId: string,
    firebaseUid: string,
    email?: string | null,
  ): Promise<void> {
    try {
      const existingForUid = await this.getAccountByFirebaseUid(firebaseUid);
      if (existingForUid && existingForUid.accountId !== accountId) {
        return;
      }
      const existing = await this.getAccount(accountId);
      if (!existing) return;

      const db = getDb();
      await db
        .update(billingAccounts)
        .set({
          firebaseUid,
          customerEmail: email ?? existing.customerEmail,
          updatedAt: Date.now(),
        })
        .where(eq(billingAccounts.accountId, accountId));
    } catch (error) {
      this.wrapError('linkFirebaseIdentity', error);
    }
  }

  async hasProcessedWebhookEvent(eventId: string): Promise<ProcessedWebhookLog | null> {
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(processedWebhookEvents)
        .where(eq(processedWebhookEvents.eventId, eventId))
        .limit(1);
      const row = rows[0];
      if (!row) return null;
      return {
        eventId: row.eventId,
        eventType: row.eventType,
        provider: row.provider,
        occurredAt: row.occurredAt ?? null,
        accountId: row.accountId ?? null,
        outcome: row.outcome,
        summary: row.summary,
        processedAt: row.processedAt,
      };
    } catch (error) {
      this.wrapError('hasProcessedWebhookEvent', error);
    }
  }

  async recordProcessedWebhookEvent(
    log: Omit<ProcessedWebhookLog, 'processedAt'>,
  ): Promise<boolean> {
    try {
      const db = getDb();
      const res = await db
        .insert(processedWebhookEvents)
        .values({
          eventId: log.eventId,
          eventType: log.eventType,
          provider: log.provider,
          occurredAt: log.occurredAt ?? null,
          accountId: log.accountId ?? null,
          outcome: log.outcome,
          summary: log.summary.slice(0, 400),
          processedAt: Date.now(),
        })
        .onConflictDoNothing()
        .returning({ eventId: processedWebhookEvents.eventId });
      return res.length > 0;
    } catch (error) {
      this.wrapError('recordProcessedWebhookEvent', error);
    }
  }

  async getTransactionsForAccount(
    accountId: string,
    limit = 16,
  ): Promise<BillingTransactionRecord[]> {
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(billingTransactions)
        .where(eq(billingTransactions.accountId, accountId))
        .orderBy(desc(billingTransactions.provisionedAt))
        .limit(limit);
      return rows.map(rowToTransaction);
    } catch (error) {
      this.wrapError('getTransactionsForAccount', error);
    }
  }

  async getTransactionByProviderTxId(
    providerTxId: string,
  ): Promise<BillingTransactionRecord | null> {
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(billingTransactions)
        .where(eq(billingTransactions.providerTransactionId, providerTxId))
        .limit(1);
      return rows[0] ? rowToTransaction(rows[0]) : null;
    } catch (error) {
      this.wrapError('getTransactionByProviderTxId', error);
    }
  }

  async saveAiUsageSettlement(
    accountId: string,
    creditsUsed: number,
    queriesUsed: number,
  ): Promise<void> {
    try {
      const db = getDb();
      await db
        .update(billingAccounts)
        .set({
          creditsUsed,
          queriesUsed,
          updatedAt: Date.now(),
        })
        .where(eq(billingAccounts.accountId, accountId));
    } catch (error) {
      this.wrapError('saveAiUsageSettlement', error);
    }
  }

  async applyAiQuotaPurchase(params: {
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
  }): Promise<{ alreadyProcessed: boolean; transaction: BillingTransactionRecord }> {
    try {
      const db = getDb();
      const existing = await db
        .select()
        .from(billingTransactions)
        .where(eq(billingTransactions.providerEventId, params.providerEventId))
        .limit(1);
      if (existing[0]) {
        return { alreadyProcessed: true, transaction: rowToTransaction(existing[0]) };
      }

      const acct = await this.getAccount(params.accountId);
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

      const createdRow = await db.transaction(async (tx) => {
        const inserted = await tx
          .insert(billingTransactions)
          .values({
            id: txId,
            accountId: params.accountId,
            provider: params.provider,
            providerEventId: params.providerEventId,
            providerTransactionId: params.providerTransactionId ?? null,
            providerSubscriptionId: null,
            productId: params.productId ?? null,
            priceId: params.priceId ?? null,
            planId: params.aiPlanId,
            billingKind: 'ai_credit_pack',
            status: 'paid',
            amountCents: params.amountCents,
            currency: params.currency ?? 'USD',
            creditsGranted: params.creditsGranted,
            provisionedAt: params.paidAt,
            expiresAt: expiresAt ?? null,
          })
          .returning();

        await tx
          .update(billingAccounts)
          .set({
            providerCustomerId: params.providerCustomerId ?? acct.providerCustomerId,
            providerTransactionId: params.providerTransactionId ?? acct.providerTransactionId,
            aiPlanId: params.aiPlanId,
            creditsPurchased: nextPurchased,
            aiSubscriptionExpiresAt: expiresAt ?? null,
            refundStatus: 'none',
            updatedAt: Date.now(),
          })
          .where(eq(billingAccounts.accountId, params.accountId));

        return inserted[0];
      });

      return {
        alreadyProcessed: false,
        transaction: rowToTransaction(createdRow),
      };
    } catch (error) {
      this.wrapError('applyAiQuotaPurchase', error);
    }
  }

  async applySubscriptionUpdate(params: {
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
  }): Promise<{ account: AccountBillingRecord; transaction: BillingTransactionRecord | null }> {
    try {
      const acct = await this.getAccount(params.accountId);
      if (!acct) {
        throw new Error(`Account "${params.accountId}" not found.`);
      }

      const db = getDb();
      const creditsBonus = Math.max(0, Math.round(params.creditsBonus ?? 0));
      const nextPurchased =
        creditsBonus > 0
          ? acct.creditsUsed + Math.max(0, acct.creditsPurchased - acct.creditsUsed) + creditsBonus
          : acct.creditsPurchased;

      const { updatedAcct, insertedTx } = await db.transaction(async (tx) => {
        const updatedRows = await tx
          .update(billingAccounts)
          .set({
            providerCustomerId: params.providerCustomerId ?? acct.providerCustomerId,
            providerSubscriptionId: params.providerSubscriptionId ?? acct.providerSubscriptionId,
            providerTransactionId: params.providerTransactionId ?? acct.providerTransactionId,
            customerEmail: params.customerEmail ?? acct.customerEmail,
            productId: params.productId ?? acct.productId,
            priceId: params.priceId ?? acct.priceId,
            activePlanId: params.activePlanId,
            billingInterval: params.billingInterval,
            subscriptionStatus: params.subscriptionStatus,
            currentPeriodStart: params.currentPeriodStart ?? acct.currentPeriodStart,
            currentPeriodEnd: params.currentPeriodEnd ?? acct.currentPeriodEnd,
            cancelAtPeriodEnd: Boolean(params.cancelAtPeriodEnd),
            canceledAt: params.canceledAt ?? acct.canceledAt,
            refundStatus: params.refundStatus ?? acct.refundStatus,
            creditsPurchased: nextPurchased,
            updatedAt: Date.now(),
          })
          .where(eq(billingAccounts.accountId, params.accountId))
          .returning();

        let txRecord: BillingTransactionRecord | null = null;
        if (params.recordTransaction) {
          const existingTx = await tx
            .select()
            .from(billingTransactions)
            .where(eq(billingTransactions.providerEventId, params.providerEventId))
            .limit(1);
          if (existingTx[0]) {
            txRecord = rowToTransaction(existingTx[0]);
          } else {
            const txId = `btx_${crypto.randomBytes(10).toString('hex')}`;
            const txStatus =
              params.subscriptionStatus === 'past_due'
                ? 'failed'
                : params.subscriptionStatus === 'refunded'
                  ? 'refunded'
                  : 'paid';
            const inserted = await tx
              .insert(billingTransactions)
              .values({
                id: txId,
                accountId: params.accountId,
                provider: params.provider,
                providerEventId: params.providerEventId,
                providerTransactionId: params.providerTransactionId ?? null,
                providerSubscriptionId: params.providerSubscriptionId ?? null,
                productId: params.productId ?? null,
                priceId: params.priceId ?? null,
                planId: params.activePlanId,
                billingKind: 'subscription',
                status: txStatus,
                amountCents: params.amountCents ?? 0,
                currency: params.currency ?? 'USD',
                creditsGranted: creditsBonus,
                provisionedAt: params.occurredAt,
                expiresAt: params.currentPeriodEnd ?? null,
              })
              .returning();
            txRecord = inserted[0] ? rowToTransaction(inserted[0]) : null;
          }
        }

        return {
          updatedAcct: updatedRows[0] ? rowToBillingRecord(updatedRows[0]) : acct,
          insertedTx: txRecord,
        };
      });

      return { account: updatedAcct, transaction: insertedTx };
    } catch (error) {
      this.wrapError('applySubscriptionUpdate', error);
    }
  }

  async applyRefundOrChargeback(params: {
    accountId: string;
    providerEventId: string;
    providerTransactionId?: string | null;
    kind: 'refunded' | 'charged_back';
    occurredAt: number;
  }): Promise<{ account: AccountBillingRecord; revokedCredits: number }> {
    try {
      const acct = await this.getAccount(params.accountId);
      if (!acct) {
        throw new Error(`Account "${params.accountId}" not found.`);
      }

      const matchingTx = params.providerTransactionId
        ? await this.getTransactionByProviderTxId(params.providerTransactionId)
        : null;
      const creditsToRevoke = matchingTx?.creditsGranted ?? 0;
      const nextPurchased = Math.max(acct.creditsUsed, acct.creditsPurchased - creditsToRevoke);

      const db = getDb();
      const updated = await db.transaction(async (tx) => {
        const acctRows = await tx
          .update(billingAccounts)
          .set({
            activePlanId: 'free_explorer',
            billingInterval: 'none',
            subscriptionStatus: 'refunded',
            refundStatus: params.kind,
            cancelAtPeriodEnd: false,
            canceledAt: acct.canceledAt ?? params.occurredAt,
            creditsPurchased: nextPurchased,
            aiPlanId: creditsToRevoke > 0 ? 'free_preview' : acct.aiPlanId,
            updatedAt: Date.now(),
          })
          .where(eq(billingAccounts.accountId, params.accountId))
          .returning();

        if (matchingTx) {
          await tx
            .update(billingTransactions)
            .set({
              status: params.kind,
              refundedAt: params.occurredAt,
            })
            .where(eq(billingTransactions.id, matchingTx.id));
        }

        if (params.providerTransactionId) {
          const affRows = await tx
            .select()
            .from(affiliateCommissionLedger)
            .where(
              eq(affiliateCommissionLedger.qualifyingTransactionId, params.providerTransactionId),
            )
            .limit(1);
          const existingAff = affRows[0];
          if (existingAff) {
            const earned = existingAff.commissionEarnedCents;
            const refundAdj =
              params.kind === 'refunded' ? earned : existingAff.refundAdjustmentCents;
            const chargebackAdj =
              params.kind === 'charged_back' ? earned : existingAff.chargebackAdjustmentCents;
            const payable = Math.max(0, earned - refundAdj - chargebackAdj);
            await tx
              .update(affiliateCommissionLedger)
              .set({
                refundAdjustmentCents: refundAdj,
                chargebackAdjustmentCents: chargebackAdj,
                amountPayableCents: payable,
                settlementStatus: payable === 0 ? 'reversed' : existingAff.settlementStatus,
                updatedAt: Date.now(),
              })
              .where(eq(affiliateCommissionLedger.entryId, existingAff.entryId));
          }
        }

        return acctRows[0] ? rowToBillingRecord(acctRows[0]) : acct;
      });

      return { account: updated, revokedCredits: creditsToRevoke };
    } catch (error) {
      this.wrapError('applyRefundOrChargeback', error);
    }
  }

  async recordAffiliateCommissionEntry(params: {
    affiliateId: string;
    qualifyingTransactionId: string;
    internalCustomerId: string;
    commissionBasisCents: number;
    commissionRateBps: number;
  }): Promise<AffiliateCommissionEntry> {
    try {
      const db = getDb();
      const existing = await db
        .select()
        .from(affiliateCommissionLedger)
        .where(
          eq(affiliateCommissionLedger.qualifyingTransactionId, params.qualifyingTransactionId),
        )
        .limit(1);
      if (existing[0]) {
        return mapAffiliateRow(existing[0]);
      }

      const earned = Math.round((params.commissionBasisCents * params.commissionRateBps) / 10_000);
      const entryId = `aff_${crypto.randomBytes(10).toString('hex')}`;
      const now = Date.now();
      const inserted = await db
        .insert(affiliateCommissionLedger)
        .values({
          entryId,
          affiliateId: params.affiliateId,
          qualifyingTransactionId: params.qualifyingTransactionId,
          internalCustomerId: params.internalCustomerId,
          commissionBasisCents: params.commissionBasisCents,
          commissionRateBps: params.commissionRateBps,
          commissionEarnedCents: earned,
          refundAdjustmentCents: 0,
          chargebackAdjustmentCents: 0,
          amountPayableCents: earned,
          amountPaidCents: 0,
          settlementStatus: 'pending_payout',
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return mapAffiliateRow(inserted[0]);
    } catch (error) {
      this.wrapError('recordAffiliateCommissionEntry', error);
    }
  }

  async applyAffiliateAdjustmentForTransaction(
    qualifyingTransactionId: string,
    kind: 'refund' | 'chargeback',
  ): Promise<void> {
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(affiliateCommissionLedger)
        .where(eq(affiliateCommissionLedger.qualifyingTransactionId, qualifyingTransactionId))
        .limit(1);
      const existing = rows[0];
      if (!existing) return;

      const earned = existing.commissionEarnedCents;
      const refundAdj = kind === 'refund' ? earned : existing.refundAdjustmentCents;
      const chargebackAdj = kind === 'chargeback' ? earned : existing.chargebackAdjustmentCents;
      const payable = Math.max(0, earned - refundAdj - chargebackAdj);
      await db
        .update(affiliateCommissionLedger)
        .set({
          refundAdjustmentCents: refundAdj,
          chargebackAdjustmentCents: chargebackAdj,
          amountPayableCents: payable,
          settlementStatus: payable === 0 ? 'reversed' : existing.settlementStatus,
          updatedAt: Date.now(),
        })
        .where(eq(affiliateCommissionLedger.entryId, existing.entryId));
    } catch (error) {
      this.wrapError('applyAffiliateAdjustmentForTransaction', error);
    }
  }

  async getAffiliateLedgerEntry(
    qualifyingTransactionId: string,
  ): Promise<AffiliateCommissionEntry | null> {
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(affiliateCommissionLedger)
        .where(eq(affiliateCommissionLedger.qualifyingTransactionId, qualifyingTransactionId))
        .limit(1);
      return rows[0] ? mapAffiliateRow(rows[0]) : null;
    } catch (error) {
      this.wrapError('getAffiliateLedgerEntry', error);
    }
  }

  async toLegacyAiEntitlementAccount(record: AccountBillingRecord): Promise<EntitlementAccount> {
    try {
      const db = getDb();
      const [txs, processedRows] = await Promise.all([
        this.getTransactionsForAccount(record.accountId, 20),
        db
          .select({ eventId: processedWebhookEvents.eventId })
          .from(processedWebhookEvents)
          .where(eq(processedWebhookEvents.accountId, record.accountId))
          .orderBy(desc(processedWebhookEvents.processedAt))
          .limit(50),
      ]);
      return buildLegacyAiEntitlementAccount(
        record,
        txs,
        processedRows.map((r) => r.eventId),
      );
    } catch (error) {
      this.wrapError('toLegacyAiEntitlementAccount', error);
    }
  }

  async toPublicEntitlementSummary(
    record: AccountBillingRecord,
    nowMs = Date.now(),
  ): Promise<PublicBillingEntitlementSummary> {
    const [legacyAi, txs] = await Promise.all([
      this.toLegacyAiEntitlementAccount(record),
      this.getTransactionsForAccount(record.accountId, 12),
    ]);
    return buildPublicEntitlementSummary(record, legacyAi, txs, nowMs);
  }
}

export function createPostgresBillingStore(): AsyncBillingStore {
  return new PostgresBillingStore();
}
