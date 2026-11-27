import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DurableBillingStore } from './billing-store';

function makeTempDbPath(name: string): { dir: string; file: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `a360-bill-${name}-`));
  return { dir, file: path.join(dir, 'billing.sqlite') };
}

test('DurableBillingStore persists entitlements, AI credits, and idempotency across database restart', () => {
  const { dir, file } = makeTempDbPath('restart');
  try {
    let store = new DurableBillingStore(file);
    const { account, isNew } = store.getOrCreateAccount('acct_durable001', {
      requireSubscriptionByDefault: false,
      firebaseUid: 'fb_uid_101',
      customerEmail: 'student@example.edu',
    });
    assert.equal(isNew, true);
    assert.equal(account.activePlanId, 'free_explorer');

    store.applySubscriptionUpdate({
      accountId: account.accountId,
      provider: 'billing_provider',
      providerEventId: 'evt_sub_paid_1',
      providerCustomerId: 'ctm_prov_101',
      providerSubscriptionId: 'sub_prov_101',
      providerTransactionId: 'txn_prov_101',
      productId: 'pro_student_1',
      priceId: 'pri_student_mo_1',
      activePlanId: 'student_plus',
      billingInterval: 'monthly',
      subscriptionStatus: 'active',
      currentPeriodStart: 1_000_000,
      currentPeriodEnd: Date.now() + 86_400_000,
      cancelAtPeriodEnd: false,
      amountCents: 499,
      creditsBonus: 250_000,
      recordTransaction: true,
      occurredAt: 1_000_000,
    });
    store.recordProcessedWebhookEvent({
      eventId: 'evt_sub_paid_1',
      eventType: 'transaction.completed',
      provider: 'billing_provider',
      occurredAt: 1_000_000,
      accountId: account.accountId,
      outcome: 'provisioned',
      summary: 'Provisioned Student Plus',
    });
    store.close();

    // Reopen fresh DB connection simulating full Node.js process restart
    store = new DurableBillingStore(file);
    const reloadedByUid = store.getAccountByFirebaseUid('fb_uid_101');
    assert.ok(reloadedByUid);
    assert.equal(reloadedByUid.accountId, 'acct_durable001');
    assert.equal(reloadedByUid.activePlanId, 'student_plus');
    assert.equal(reloadedByUid.providerCustomerId, 'ctm_prov_101');

    const summary = store.toPublicEntitlementSummary(reloadedByUid);
    assert.equal(summary.hasActivePaidSubscription, true);
    assert.equal(summary.entitlements.studentPlusFeatures, true);
    assert.equal(summary.entitlements.educatorPlusFeatures, false);
    assert.ok(summary.aiQuota.creditsRemaining >= 250_000);
    assert.ok(store.hasProcessedWebhookEvent('evt_sub_paid_1'));

    store.close();
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('DurableBillingStore revokes paid tier and granted AI credits on refund and chargeback + settles affiliate clawbacks', () => {
  const store = new DurableBillingStore(':memory:');
  try {
    const { account } = store.getOrCreateAccount('acct_refund002', {
      requireSubscriptionByDefault: true,
    });

    store.applySubscriptionUpdate({
      accountId: account.accountId,
      provider: 'billing_provider',
      providerEventId: 'evt_ed_paid_2',
      providerCustomerId: 'ctm_ed_2',
      providerSubscriptionId: 'sub_ed_2',
      providerTransactionId: 'txn_ed_2',
      productId: 'pro_ed_1',
      priceId: 'pri_ed_yr_1',
      activePlanId: 'educator_plus',
      billingInterval: 'annual',
      subscriptionStatus: 'active',
      currentPeriodStart: Date.now(),
      currentPeriodEnd: Date.now() + 365 * 86_400_000,
      cancelAtPeriodEnd: false,
      amountCents: 7999,
      creditsBonus: 500_000,
      recordTransaction: true,
      occurredAt: Date.now(),
    });

    const affEntry = store.recordAffiliateCommissionEntry({
      affiliateId: 'aff_prof_ali',
      qualifyingTransactionId: 'txn_ed_2',
      internalCustomerId: account.accountId,
      commissionBasisCents: 7999,
      commissionRateBps: 1500,
    });
    assert.equal(affEntry.settlementStatus, 'pending_payout');
    assert.ok(affEntry.amountPayableCents > 0);
    assert.equal('studyProgress' in (affEntry as unknown as Record<string, unknown>), false);

    // Apply chargeback reversal
    const reversal = store.applyRefundOrChargeback({
      accountId: account.accountId,
      providerEventId: 'evt_adj_cb_2',
      providerTransactionId: 'txn_ed_2',
      kind: 'charged_back',
      occurredAt: Date.now(),
    });
    assert.equal(reversal.revokedCredits, 500_000);

    const afterSummary = store.toPublicEntitlementSummary(reversal.account);
    assert.equal(afterSummary.activePlanId, 'free_explorer');
    assert.equal(afterSummary.hasActivePaidSubscription, false);
    assert.equal(afterSummary.entitlements.educatorPlusFeatures, false);
    assert.equal(afterSummary.refundStatus, 'charged_back');
    assert.equal(afterSummary.aiQuota.creditsRemaining, 0);

    // Affiliate ledger entry must be reversed automatically
    const updatedAff = store.getAffiliateLedgerEntry('txn_ed_2');
    assert.ok(updatedAff);
    assert.equal(updatedAff.amountPayableCents, 0);
    assert.equal(updatedAff.settlementStatus, 'reversed');
  } finally {
    store.close();
  }
});
