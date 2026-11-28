import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AI_SUBSCRIPTION_PLANS,
  canSpendCredits,
  createEntitlementAccount,
  getRemainingCredits,
  provisionQuotaFromPayment,
  settleUsageCredits,
} from './quota';
import {
  applyVerifiedPaymentToLedger,
  signAccountToken,
  signWebhookPayload,
  verifyAccountToken,
  verifyWebhookSignature,
} from '../../server/ai-store';

test('strict subscription mode starts with zero credits until verified payment', () => {
  const acct = createEntitlementAccount('acct_testzero1234', true, 1_000_000);
  assert.equal(getRemainingCredits(acct, 1_000_000), 0);
  const check = canSpendCredits(acct, 1_200, 1_000_000);
  assert.equal(check.allowed, false);
  assert.equal(check.reason, 'SUBSCRIPTION_REQUIRED');
});

test('usage settlement meters tokens accurately and enforces exhaustion cap', () => {
  let acct = createEntitlementAccount('acct_testtrial1234', false, 1_000_000);
  const initialRemaining = getRemainingCredits(acct);
  assert.equal(initialRemaining, AI_SUBSCRIPTION_PLANS[0].creditsIncluded);

  const settled = settleUsageCredits(
    acct,
    { promptTokens: 400, candidatesTokens: 250, totalTokens: 650 },
    1_001_000,
  );
  acct = settled.account;
  assert.equal(settled.creditsCharged, 400 + 250 * 4);
  assert.equal(acct.queriesUsed, 1);
  assert.equal(getRemainingCredits(acct), initialRemaining - 1400);

  // Exhaust remaining credits completely
  const drain = settleUsageCredits(
    acct,
    { promptTokens: 20_000, candidatesTokens: 5_000, totalTokens: 25_000 },
    1_002_000,
  );
  acct = drain.account;
  assert.equal(getRemainingCredits(acct), 0);
  const exhausted = canSpendCredits(acct);
  assert.equal(exhausted.allowed, false);
  assert.equal(exhausted.reason, 'QUOTA_EXHAUSTED');
});

test('on-the-spot payment provisioning unlocks quota only after paid webhook and is idempotent', () => {
  const acct = createEntitlementAccount('acct_paiduser1234', true, 1_000_000);

  // Failed payment must NOT provision quota
  const failedRes = provisionQuotaFromPayment(
    acct,
    {
      provider: 'stripe',
      providerEventId: 'evt_fail_1',
      accountId: acct.accountId,
      planId: 'student_monthly',
      status: 'failed',
      amountUsdCents: 499,
    },
    1_001_000,
  );
  assert.equal(failedRes.provisioned, false);
  assert.equal(getRemainingCredits(failedRes.account, 1_001_000), 0);

  // Underpaid payment must NOT provision quota
  const underpaidRes = provisionQuotaFromPayment(
    acct,
    {
      provider: 'stripe',
      providerEventId: 'evt_under_1',
      accountId: acct.accountId,
      planId: 'student_monthly',
      status: 'paid',
      amountUsdCents: 100,
    },
    1_001_000,
  );
  assert.equal(underpaidRes.provisioned, false);

  // Valid paid event provisions exact Student Monthly Pass credits on the spot
  const paidRes = provisionQuotaFromPayment(
    acct,
    {
      provider: 'stripe',
      providerEventId: 'evt_paid_1001',
      accountId: acct.accountId,
      planId: 'student_monthly',
      status: 'paid',
      amountUsdCents: 499,
      paidAt: 1_002_000,
    },
    1_002_000,
  );
  assert.equal(paidRes.provisioned, true);
  assert.equal(paidRes.alreadyProcessed, false);
  assert.equal(getRemainingCredits(paidRes.account, 1_002_000), 250_000);
  assert.equal(canSpendCredits(paidRes.account, 1_200, 1_002_000).allowed, true);

  // Duplicate webhook replay must NOT double-credit
  const replayRes = provisionQuotaFromPayment(
    paidRes.account,
    {
      provider: 'stripe',
      providerEventId: 'evt_paid_1001',
      accountId: acct.accountId,
      planId: 'student_monthly',
      status: 'paid',
      amountUsdCents: 499,
      paidAt: 1_002_000,
    },
    1_003_000,
  );
  assert.equal(replayRes.provisioned, false);
  assert.equal(replayRes.alreadyProcessed, true);
  assert.equal(getRemainingCredits(replayRes.account, 1_003_000), 250_000);

  // Additive top-up pack adds on top of remaining balance
  const topUpRes = provisionQuotaFromPayment(
    replayRes.account,
    {
      provider: 'stripe',
      providerEventId: 'evt_topup_2001',
      accountId: acct.accountId,
      planId: 'exam_prep_pack',
      status: 'paid',
      amountUsdCents: 999,
      paidAt: 1_004_000,
    },
    1_004_000,
  );
  assert.equal(topUpRes.provisioned, true);
  assert.equal(getRemainingCredits(topUpRes.account, 1_004_000), 250_000 + 650_000);
});

test('HMAC token and webhook signature verification block tampering and apply ledger updates', async () => {
  const token = signAccountToken('acct_secure9988');
  assert.deepEqual(verifyAccountToken(token), { accountId: 'acct_secure9988' });
  assert.equal(verifyAccountToken(`${token}tamper`), null);

  const secret = 'test_webhook_secret_key';
  const payload = JSON.stringify({
    provider: 'stripe',
    providerEventId: 'evt_hmac_9001',
    accountId: 'acct_secure9988',
    planId: 'student_monthly',
    status: 'paid',
    amountUsdCents: 499,
  });
  const sig = signWebhookPayload(payload, secret);
  assert.equal(verifyWebhookSignature(payload, sig, secret), true);
  assert.equal(verifyWebhookSignature(payload, 'deadbeef', secret), false);

  const ledgerRes = await applyVerifiedPaymentToLedger(JSON.parse(payload));
  assert.equal(ledgerRes.ok, true);
  assert.ok((ledgerRes.summary?.creditsRemaining ?? 0) >= 250_000);
});
