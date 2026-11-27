import test from 'node:test';
import assert from 'node:assert/strict';
import { DurableBillingStore } from './billing-store';
import {
  signBillingWebhook,
  verifyAndProcessBillingWebhook,
  type PriceCatalogTarget,
} from './billing-service';

const TEST_SECRET = 'whsec_test_secret_1234567890abcdef';
const TEST_PRICES: Record<string, PriceCatalogTarget> = {
  pri_test_student_mo: {
    kind: 'subscription',
    planId: 'student_plus',
    interval: 'monthly',
    productId: 'pro_test_student',
    creditsBonus: 250_000,
    validityDays: 30,
  },
  pri_test_ai_burst: {
    kind: 'ai_credit_pack',
    planId: 'exam_prep_pack',
    interval: 'none',
    productId: 'pro_test_ai',
    creditsBonus: 650_000,
    validityDays: 90,
  },
};

test('verifyAndProcessBillingWebhook enforces HMAC signature verification and replay window', async () => {
  const store = new DurableBillingStore(':memory:');
  try {
    store.getOrCreateAccount('acct_sigtest01', { requireSubscriptionByDefault: true });

    const eventJson = JSON.stringify({
      event_id: 'evt_sig_invalid_1',
      event_type: 'transaction.completed',
      occurred_at: new Date().toISOString(),
      data: {
        id: 'txn_sig_1',
        status: 'completed',
        custom_data: { accountId: 'acct_sigtest01' },
        items: [{ price_id: 'pri_test_student_mo', quantity: 1 }],
      },
    });

    // Missing header -> 401
    const missing = await verifyAndProcessBillingWebhook({
      rawBody: eventJson,
      signatureHeader: undefined,
      webhookSecret: TEST_SECRET,
      store,
      priceMapOverrides: TEST_PRICES,
    });
    assert.equal(missing.ok, false);
    assert.equal(missing.httpStatus, 401);
    assert.equal(missing.code, 'MISSING_BILLING_SIGNATURE');

    // Tampered / invalid signature -> 401
    const badSig = await verifyAndProcessBillingWebhook({
      rawBody: eventJson,
      signatureHeader: `ts=${Math.floor(Date.now() / 1000)};v1=${'0'.repeat(64)}`,
      webhookSecret: TEST_SECRET,
      store,
      priceMapOverrides: TEST_PRICES,
    });
    assert.equal(badSig.ok, false);
    assert.equal(badSig.httpStatus, 401);
    assert.equal(badSig.code, 'INVALID_BILLING_SIGNATURE');

    // Expired timestamp replay -> 401
    const staleTs = Math.floor(Date.now() / 1000) - 900;
    const staleSig = signBillingWebhook(eventJson, TEST_SECRET, staleTs);
    const staleRes = await verifyAndProcessBillingWebhook({
      rawBody: eventJson,
      signatureHeader: staleSig,
      webhookSecret: TEST_SECRET,
      store,
      priceMapOverrides: TEST_PRICES,
    });
    assert.equal(staleRes.ok, false);
    assert.equal(staleRes.httpStatus, 401);
    assert.equal(staleRes.code, 'WEBHOOK_TIMESTAMP_OUT_OF_RANGE');
  } finally {
    store.close();
  }
});

test('verifyAndProcessBillingWebhook rejects unknown price ID and unmapped accounts cleanly', async () => {
  const store = new DurableBillingStore(':memory:');
  try {
    store.getOrCreateAccount('acct_mapcheck01');

    const unmappedBody = JSON.stringify({
      event_id: 'evt_unmapped_1',
      event_type: 'transaction.completed',
      occurred_at: new Date().toISOString(),
      data: {
        id: 'txn_unmap_1',
        status: 'completed',
        custom_data: { accountId: 'acct_nonexistent999' },
        items: [{ price_id: 'pri_test_student_mo', quantity: 1 }],
      },
    });
    const unmappedRes = await verifyAndProcessBillingWebhook({
      rawBody: unmappedBody,
      signatureHeader: signBillingWebhook(unmappedBody, TEST_SECRET),
      webhookSecret: TEST_SECRET,
      store,
      priceMapOverrides: TEST_PRICES,
    });
    assert.equal(unmappedRes.ok, false);
    assert.equal(unmappedRes.httpStatus, 422);
    assert.equal(unmappedRes.code, 'MISSING_ACCOUNT_MAPPING');

    const unknownPriceBody = JSON.stringify({
      event_id: 'evt_badprice_1',
      event_type: 'transaction.completed',
      occurred_at: new Date().toISOString(),
      data: {
        id: 'txn_badprice_1',
        status: 'completed',
        custom_data: { accountId: 'acct_mapcheck01' },
        items: [{ price_id: 'pri_totally_unknown', quantity: 1 }],
      },
    });
    const unknownPriceRes = await verifyAndProcessBillingWebhook({
      rawBody: unknownPriceBody,
      signatureHeader: signBillingWebhook(unknownPriceBody, TEST_SECRET),
      webhookSecret: TEST_SECRET,
      store,
      priceMapOverrides: TEST_PRICES,
    });
    assert.equal(unknownPriceRes.ok, false);
    assert.equal(unknownPriceRes.httpStatus, 422);
    assert.equal(unknownPriceRes.code, 'UNKNOWN_PRICE_ID');
  } finally {
    store.close();
  }
});

test('verifyAndProcessBillingWebhook handles full lifecycle across provider event shapes, idempotency, AI add-on, cancellation, payment fail, and refund', async () => {
  const store = new DurableBillingStore(':memory:');
  try {
    store.getOrCreateAccount('acct_lifecycle01', { requireSubscriptionByDefault: true });
    const nowIso = new Date().toISOString();
    const endIso = new Date(Date.now() + 30 * 86_400_000).toISOString();

    // 1. Purchase Student Plus (e.g., checkout.completed or transaction.completed)
    const txBody = JSON.stringify({
      event_id: 'evt_life_tx_1',
      event_type: 'checkout.completed',
      occurred_at: nowIso,
      data: {
        id: 'txn_life_1',
        status: 'completed',
        customer_id: 'ctm_life_1',
        subscription_id: 'sub_life_1',
        currency_code: 'USD',
        custom_data: { accountId: 'acct_lifecycle01' },
        billing_period: { starts_at: nowIso, ends_at: endIso },
        details: { totals: { total: '499' } },
        items: [{ price_id: 'pri_test_student_mo', quantity: 1 }],
      },
    });
    const res1 = await verifyAndProcessBillingWebhook({
      rawBody: txBody,
      signatureHeader: signBillingWebhook(txBody, TEST_SECRET),
      webhookSecret: TEST_SECRET,
      provider: 'whop_or_creem',
      store,
      priceMapOverrides: TEST_PRICES,
    });
    assert.equal(res1.ok, true);
    assert.equal(res1.code, 'PROVISIONED');

    // 2. Duplicate delivery must be idempotent (zero double-credit)
    const dup = await verifyAndProcessBillingWebhook({
      rawBody: txBody,
      signatureHeader: signBillingWebhook(txBody, TEST_SECRET),
      webhookSecret: TEST_SECRET,
      store,
      priceMapOverrides: TEST_PRICES,
    });
    assert.equal(dup.ok, true);
    assert.equal(dup.alreadyProcessed, true);
    assert.equal(store.getAccount('acct_lifecycle01')!.creditsPurchased, 250_000);

    // 3. Separate AI burst pack adds +650,000 credits cleanly
    const burstBody = JSON.stringify({
      event_id: 'evt_life_burst_2',
      event_type: 'payment.succeeded',
      occurred_at: nowIso,
      data: {
        id: 'txn_life_burst_2',
        status: 'completed',
        customer_id: 'ctm_life_1',
        currency_code: 'USD',
        custom_data: { accountId: 'acct_lifecycle01' },
        details: { totals: { total: '999' } },
        items: [{ price_id: 'pri_test_ai_burst', quantity: 1 }],
      },
    });
    const resBurst = await verifyAndProcessBillingWebhook({
      rawBody: burstBody,
      signatureHeader: signBillingWebhook(burstBody, TEST_SECRET),
      webhookSecret: TEST_SECRET,
      store,
      priceMapOverrides: TEST_PRICES,
    });
    assert.equal(resBurst.ok, true);
    assert.equal(store.getAccount('acct_lifecycle01')!.creditsPurchased, 900_000);

    // 4. Subscription canceled at period end preserves access during current paid period
    const cancelBody = JSON.stringify({
      event_id: 'evt_life_cancel_3',
      event_type: 'subscription.canceled',
      occurred_at: nowIso,
      data: {
        id: 'sub_life_1',
        status: 'canceled',
        customer_id: 'ctm_life_1',
        canceled_at: nowIso,
        current_billing_period: { starts_at: nowIso, ends_at: endIso },
      },
    });
    const resCancel = await verifyAndProcessBillingWebhook({
      rawBody: cancelBody,
      signatureHeader: signBillingWebhook(cancelBody, TEST_SECRET),
      webhookSecret: TEST_SECRET,
      store,
      priceMapOverrides: TEST_PRICES,
    });
    assert.equal(resCancel.ok, true);
    const canceledSummary = store.toPublicEntitlementSummary(
      store.getAccount('acct_lifecycle01')!,
    );
    assert.equal(canceledSummary.subscriptionStatus, 'canceled');
    assert.equal(canceledSummary.cancelAtPeriodEnd, true);
    assert.equal(canceledSummary.hasActivePaidSubscription, true);

    // 5. Refund on txn_life_1 immediately revokes Student Plus + its 250k credits
    const refundBody = JSON.stringify({
      event_id: 'evt_life_refund_4',
      event_type: 'refund.created',
      occurred_at: nowIso,
      data: {
        id: 'adj_life_4',
        transaction_id: 'txn_life_1',
        customer_id: 'ctm_life_1',
        action: 'refund',
        status: 'approved',
      },
    });
    const resRefund = await verifyAndProcessBillingWebhook({
      rawBody: refundBody,
      signatureHeader: signBillingWebhook(refundBody, TEST_SECRET),
      webhookSecret: TEST_SECRET,
      store,
      priceMapOverrides: TEST_PRICES,
    });
    assert.equal(resRefund.ok, true);
    assert.equal(resRefund.code, 'REVERSAL_APPLIED');
    const postRefundSummary = store.toPublicEntitlementSummary(
      store.getAccount('acct_lifecycle01')!,
    );
    assert.equal(postRefundSummary.activePlanId, 'free_explorer');
    assert.equal(postRefundSummary.hasActivePaidSubscription, false);
    assert.equal(postRefundSummary.refundStatus, 'refunded');
    assert.equal(postRefundSummary.aiQuota.creditsRemaining, 650_000);

    // 6. Payment failed event pauses subscription access cleanly
    const failBody = JSON.stringify({
      event_id: 'evt_life_fail_5',
      event_type: 'payment.failed',
      occurred_at: nowIso,
      data: {
        id: 'txn_life_fail_5',
        status: 'past_due',
        customer_id: 'ctm_life_1',
        subscription_id: 'sub_life_1',
      },
    });
    const resFail = await verifyAndProcessBillingWebhook({
      rawBody: failBody,
      signatureHeader: signBillingWebhook(failBody, TEST_SECRET),
      webhookSecret: TEST_SECRET,
      store,
      priceMapOverrides: TEST_PRICES,
    });
    assert.equal(resFail.ok, true);
    assert.equal(store.getAccount('acct_lifecycle01')!.subscriptionStatus, 'past_due');
  } finally {
    store.close();
  }
});
