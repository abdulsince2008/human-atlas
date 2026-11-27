import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BILLING_PROVIDER_DISCLOSURE,
  COMMERCIAL_COMPARISON_ROWS,
  COMMERCIAL_PLANS,
  getCommercialPlanById,
  getDefaultCommercialRuntimeSnapshot,
} from './commercial-config';
import {
  AI_CREDIT_DISCLOSURES,
  createEntitlementAccount,
  getRemainingCredits,
  provisionQuotaFromPayment,
  revokeCreditsFromRefund,
} from '../ai/quota';

test('commercial pricing defaults stay safely in draft/disabled mode without unconfirmed seller PII', () => {
  const snap = getDefaultCommercialRuntimeSnapshot();
  assert.equal(snap.liveCheckoutAllowed, false);
  assert.equal(snap.sandboxReady, false);
  assert.equal(snap.seller.billingProvider, 'unselected');
  assert.equal(snap.seller.legalSellerName, null);
  assert.equal(snap.seller.supportEmail, null);
  assert.equal(snap.seller.supportPhone, null);
  assert.equal(snap.seller.pricingConfirmed, false);
  assert.equal(
    snap.providerReadinessState.providerSelection,
    'BLOCKED_OWNER_PROVIDER_CHOICE',
  );
  assert.equal(
    snap.providerReadinessState.productCategory,
    'BLOCKED_PROVIDER_CONFIRMATION',
  );
  assert.equal(
    snap.providerReadinessState.educatorAffiliateProgramme,
    'DISABLED_PENDING_PROVIDER_WRITTEN_APPROVAL',
  );

  // Zero fake lifetime pricing and zero fabricated provider IDs
  for (const plan of COMMERCIAL_PLANS) {
    assert.notEqual(plan.id.toLowerCase().includes('lifetime'), true);
    assert.equal(
      plan.includedFeatures.some((f) => f.toLowerCase().includes('unlimited ai')),
      false,
    );
  }
  assert.equal(getCommercialPlanById('student_plus')?.monthlyPriceUsdCents, 499);
  assert.equal(getCommercialPlanById('student_plus')?.annualPriceUsdCents, 3999);
  assert.equal(getCommercialPlanById('educator_plus')?.monthlyPriceUsdCents, 999);
  assert.equal(getCommercialPlanById('educator_plus')?.annualPriceUsdCents, 7999);
  assert.ok(COMMERCIAL_COMPARISON_ROWS.length >= 8);
  assert.ok(BILLING_PROVIDER_DISCLOSURE.includes('authorized payment provider'));
  assert.ok(AI_CREDIT_DISCLOSURES.separationNotice.includes('AI credit packs'));
});

test('AI credit refund revocation helper deducts refunded pack credits cleanly and preserves usage floor', () => {
  let acct = createEntitlementAccount('acct_credits_rev_1', true, 1_000);
  const prov = provisionQuotaFromPayment(
    acct,
    {
      provider: 'billing_provider',
      providerEventId: 'evt_ai_grant_1',
      accountId: acct.accountId,
      planId: 'exam_prep_pack',
      status: 'paid',
      amountUsdCents: 999,
      paidAt: 2_000,
    },
    2_000,
  );
  assert.equal(prov.provisioned, true);
  acct = prov.account;
  assert.equal(getRemainingCredits(acct, 2_000), 650_000);

  const revoked = revokeCreditsFromRefund(
    acct,
    { refundEventId: 'evt_ai_ref_1', creditsToRevoke: 650_000 },
    3_000,
  );
  assert.equal(revoked.revoked, true);
  assert.equal(getRemainingCredits(revoked.account, 3_000), 0);

  // Idempotent duplicate refund reversal does nothing extra
  const revokedDup = revokeCreditsFromRefund(
    revoked.account,
    { refundEventId: 'evt_ai_ref_1', creditsToRevoke: 650_000 },
    3_500,
  );
  assert.equal(revokedDup.revoked, false);
  assert.equal(revokedDup.alreadyProcessed, true);
});
