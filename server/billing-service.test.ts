import test from 'node:test';
import assert from 'node:assert/strict';
import { DurableBillingStore } from './billing-store';
import {
  signBillingWebhook,
  signWhopStandardWebhook,
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

test('verifyAndProcessBillingWebhook supports Whop Standard Webhooks (ws_ secret, webhook-id/timestamp/v1 base64) and Whop v1/v2 event shapes', async () => {
  const store = new DurableBillingStore(':memory:');
  const WHOP_SECRET = 'ws_test_whop_secret_abcdef0123456789';
  const WHOP_PRICES: Record<string, PriceCatalogTarget> = {
    plan_test_student_mo: {
      kind: 'subscription',
      planId: 'student_plus',
      interval: 'monthly',
      productId: 'prod_test_student',
      creditsBonus: 250_000,
      validityDays: 30,
    },
  };

  try {
    store.getOrCreateAccount('acct_whoptest01', { requireSubscriptionByDefault: true });
    const nowSec = Math.floor(Date.now() / 1000);
    const webhookId = 'msg_whop_test_1';

    const whopPaymentBody = JSON.stringify({
      id: 'evt_whop_pay_1',
      type: 'payment.succeeded',
      timestamp: new Date(nowSec * 1000).toISOString(),
      data: {
        id: 'pay_whop_1',
        status: 'paid',
        final_amount: 4.99,
        currency: 'USD',
        user: { id: 'user_whop_1' },
        plan: { id: 'plan_test_student_mo' },
        product: { id: 'prod_test_student' },
        membership: {
          id: 'mem_whop_1',
          renewal_period_start: new Date(nowSec * 1000).toISOString(),
          renewal_period_end: new Date((nowSec + 30 * 86_400) * 1000).toISOString(),
        },
        metadata: { accountId: 'acct_whoptest01' },
      },
    });

    // Wrong signature rejected
    const badWhop = await verifyAndProcessBillingWebhook({
      rawBody: whopPaymentBody,
      signatureHeader: 'v1,aW52YWxpZHNpZ25hdHVyZQ==',
      timestampHeader: String(nowSec),
      webhookIdHeader: webhookId,
      webhookSecret: WHOP_SECRET,
      provider: 'whop',
      store,
      priceMapOverrides: WHOP_PRICES,
    });
    assert.equal(badWhop.ok, false);
    assert.equal(badWhop.httpStatus, 401);

    // Valid Whop Standard Webhook signature provisions Student Plus
    const validSig = signWhopStandardWebhook({
      webhookId,
      timestampSec: nowSec,
      rawBody: whopPaymentBody,
      secret: WHOP_SECRET,
    });
    const okWhop = await verifyAndProcessBillingWebhook({
      rawBody: whopPaymentBody,
      signatureHeader: validSig,
      timestampHeader: String(nowSec),
      webhookIdHeader: webhookId,
      webhookSecret: WHOP_SECRET,
      provider: 'whop',
      store,
      priceMapOverrides: WHOP_PRICES,
    });
    assert.equal(okWhop.ok, true);
    assert.equal(okWhop.code, 'PROVISIONED');

    const acct = store.getAccount('acct_whoptest01')!;
    assert.equal(acct.activePlanId, 'student_plus');
    assert.equal(acct.providerCustomerId, 'user_whop_1');
    assert.equal(acct.providerSubscriptionId, 'mem_whop_1');
    assert.equal(acct.creditsPurchased, 250_000);

    // Refund reverses Whop entitlement
    const whopRefundId = 'msg_whop_refund_2';
    const whopRefundBody = JSON.stringify({
      id: 'evt_whop_refund_2',
      type: 'payment.refunded',
      timestamp: new Date(nowSec * 1000).toISOString(),
      data: {
        id: 'pay_whop_refund_2',
        payment_id: 'pay_whop_1',
        user: { id: 'user_whop_1' },
        membership: { id: 'mem_whop_1' },
        metadata: { accountId: 'acct_whoptest01' },
      },
    });
    const refundRes = await verifyAndProcessBillingWebhook({
      rawBody: whopRefundBody,
      signatureHeader: signWhopStandardWebhook({
        webhookId: whopRefundId,
        timestampSec: nowSec,
        rawBody: whopRefundBody,
        secret: WHOP_SECRET,
      }),
      timestampHeader: String(nowSec),
      webhookIdHeader: whopRefundId,
      webhookSecret: WHOP_SECRET,
      provider: 'whop',
      store,
      priceMapOverrides: WHOP_PRICES,
    });
    assert.equal(refundRes.ok, true);
    assert.equal(refundRes.code, 'REVERSAL_APPLIED');
    assert.equal(store.getAccount('acct_whoptest01')!.activePlanId, 'free_explorer');
    assert.equal(store.getAccount('acct_whoptest01')!.creditsPurchased, 0);
  } finally {
    store.close();
  }
});

