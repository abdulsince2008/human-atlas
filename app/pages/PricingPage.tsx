import { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CreditCard,
  ExternalLink,
  HelpCircle,
  RefreshCw,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import {
  AI_CREDIT_DISCLOSURES,
  AI_SUBSCRIPTION_PLANS,
} from '../ai/quota';
import {
  BILLING_PROVIDER_DISCLOSURE,
  COMMERCIAL_COMPARISON_ROWS,
  COMMERCIAL_PLANS,
  formatUsdCents,
  type CommercialPlanDefinition,
} from '../commercial/commercial-config';
import { useBilling } from '../components/BillingContext';
import SiteFooter from '../components/SiteFooter';
import type { AppRoute } from '../navigation-registry';

interface Props {
  onNavigate: (route: AppRoute) => void;
}

export default function PricingPage({ onNavigate }: Props) {
  const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly');
  const {
    config,
    devSandboxAllowed,
    entitlement,
    loading,
    busy,
    statusMessage,
    refreshEntitlements,
    openCheckout,
    openPortal,
    simulateSandboxEvent,
    clearStatusMessage,
  } = useBilling();

  const seller = config.seller;
  const paidAddons = AI_SUBSCRIPTION_PLANS.filter((p) => p.id !== 'free_preview');

  const getCheckoutTargetForPlan = (plan: CommercialPlanDefinition): string | null => {
    const map = config.billingCatalog[plan.id];
    return interval === 'annual'
      ? map.annualCheckoutUrl ?? map.annualPriceId
      : map.monthlyCheckoutUrl ?? map.monthlyPriceId;
  };

  return (
    <div className="a360-page" data-testid="pricing-page">
      <header className="a360-page-header">
        <p className="a360-kicker">Plans &amp; Transparent Pricing</p>
        <h1>Simple, Student-Fair Alphatomy Plans</h1>
        <p className="a360-lead">
          Explore core 3D human anatomy, body systems, practice quizzes, and local study tools for
          free — no credit card required. Upgrade cleanly for cross-device entitlements, expanded AI
          learning allowances, or complete Educator classroom &amp; handout exports.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div
            className="inline-flex rounded-lg border border-slate-300 bg-white p-1"
            role="tablist"
            aria-label="Billing interval"
          >
            <button
              type="button"
              role="tab"
              aria-selected={interval === 'monthly'}
              data-testid="billing-toggle-monthly"
              onClick={() => setInterval('monthly')}
              className={`rounded-md px-3.5 py-1.5 text-sm font-semibold transition ${
                interval === 'monthly'
                  ? 'bg-teal-800 text-white'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={interval === 'annual'}
              data-testid="billing-toggle-annual"
              onClick={() => setInterval('annual')}
              className={`rounded-md px-3.5 py-1.5 text-sm font-semibold transition ${
                interval === 'annual'
                  ? 'bg-teal-800 text-white'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              Annual Billing (12 months upfront)
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="font-semibold text-teal-800 hover:underline"
            >
              Contact Billing Support
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => onNavigate('refunds')}
              className="font-semibold text-teal-800 hover:underline"
            >
              Refund Policy
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => onNavigate('terms')}
              className="font-semibold text-teal-800 hover:underline"
            >
              Terms of Sale
            </button>
          </div>
        </div>
      </header>

      {/* Pre-submission / Owner confirmation status banner */}
      {!config.liveCheckoutAllowed && (
        <section
          className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 text-sm text-amber-950"
          role="status"
          data-testid="commercial-draft-banner"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" aria-hidden="true" />
            <div className="space-y-1.5">
              <strong className="block font-semibold">
                {seller.pricingConfirmed
                  ? 'Live Checkout Disabled Pending Whop Approval & Plan Credentials'
                  : 'Draft Launch Pricing Proposal — Live On-Site Whop Checkout Pending Credentials'}
              </strong>
              <p className="text-xs leading-relaxed text-amber-900">
                The Student Plus ($4.99/mo or $39.99/yr) and Educator Plus ($9.99/mo or $79.99/yr)
                rates shown below are configurable launch recommendations processed on-site via Whop.
                Live checkout remains disabled until seller identity, Whop KYC verification, and
                Whop Plan IDs (<code>plan_...</code>) + Webhook Secret (<code>ws_...</code>) are
                configured. No live charges can occur in this state.
              </p>
              {config.missingRequirements.length > 0 && (
                <ul className="list-disc pl-4 text-xs text-amber-900/90">
                  {config.missingRequirements.map((req) => (
                    <li key={req}>{req}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {statusMessage && (
        <div
          className="flex items-center justify-between gap-3 rounded-xl border border-teal-300 bg-teal-50 px-4 py-3 text-sm text-teal-950"
          role="status"
          data-testid="billing-status-banner"
        >
          <span>{statusMessage}</span>
          <button
            type="button"
            onClick={clearStatusMessage}
            className="text-xs font-semibold text-teal-800 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Plan Cards */}
      <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-4" aria-label="Subscription plans">
        {COMMERCIAL_PLANS.map((plan) => {
          const isAnnual = interval === 'annual';
          const priceCents =
            plan.billingKind === 'free'
              ? 0
              : plan.billingKind === 'custom'
                ? null
                : isAnnual
                  ? plan.annualPriceUsdCents
                  : plan.monthlyPriceUsdCents;
          const configuredTarget = getCheckoutTargetForPlan(plan);
          const canTriggerCheckout =
            plan.billingKind === 'recurring' &&
            seller.billingProvider !== 'unselected' &&
            Boolean(configuredTarget) &&
            (config.liveCheckoutAllowed || config.sandboxReady);
          const isCurrentPlan = entitlement?.activePlanId === plan.id && entitlement.hasActivePaidSubscription;
          const isFreeCurrent = plan.id === 'free_explorer' && !entitlement?.hasActivePaidSubscription;

          return (
            <article
              key={plan.id}
              data-testid={`pricing-card-${plan.id}`}
              className={`flex flex-col justify-between rounded-xl border bg-white p-5 ${
                plan.id === 'student_plus'
                  ? 'border-teal-700 ring-1 ring-teal-700/15'
                  : 'border-slate-200'
              }`}
            >
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-bold text-slate-900">{plan.name}</h2>
                    {plan.pricingStatus === 'draft_recommendation' && !seller.pricingConfirmed && (
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-700">
                        Draft Rate
                      </span>
                    )}
                    {isCurrentPlan && (
                      <span className="rounded bg-teal-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-teal-900">
                        Active
                      </span>
                    )}
                    {isFreeCurrent && (
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{plan.tagline}</p>
                </div>

                <div className="border-y border-slate-100 py-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-2xl font-bold text-slate-900">
                      {formatUsdCents(priceCents)}
                    </span>
                    {plan.billingKind === 'recurring' && (
                      <span className="text-xs text-slate-600">
                        USD / {isAnnual ? 'year' : 'month'}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{plan.renewalBehavior}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Included
                  </p>
                  <ul className="mt-2 space-y-1.5 text-xs text-slate-700">
                    {plan.includedFeatures.map((feat) => (
                      <li key={feat} className="flex items-start gap-2">
                        <Check size={14} className="mt-0.5 shrink-0 text-teal-700" aria-hidden="true" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600">
                  <p>
                    <strong>AI Allowance:</strong> {plan.aiCreditAllowance.summary}
                  </p>
                  <p className="mt-1">
                    <strong>Cancellation:</strong> {plan.accessAfterCancellation}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                {plan.id === 'free_explorer' && (
                  <button
                    type="button"
                    className="a360-btn-secondary w-full justify-center"
                    onClick={() => onNavigate('explorer')}
                  >
                    Explore 3D Anatomy Free
                  </button>
                )}

                {plan.billingKind === 'recurring' && (
                  <>
                    <button
                      type="button"
                      disabled={busy || !canTriggerCheckout}
                      data-testid={`checkout-btn-${plan.id}`}
                      onClick={() =>
                        void openCheckout(
                          plan.id === 'educator_plus' ? 'educator_plus' : 'student_plus',
                          interval,
                        )
                      }
                      className="a360-btn-primary w-full justify-center"
                    >
                      <CreditCard size={15} aria-hidden="true" />
                      {canTriggerCheckout
                        ? config.liveCheckoutAllowed
                          ? `Subscribe On-Site (${formatUsdCents(priceCents)})`
                          : `Open Sandbox Whop Checkout (${formatUsdCents(priceCents)})`
                        : 'Checkout Disabled (Whop Keys Pending)'}
                    </button>
                    {!canTriggerCheckout && (
                      <p className="text-center text-[11px] text-slate-500">
                        Awaiting Whop plan ID key ({isAnnual ? plan.billingCatalogEnvKeys.annualPriceIdEnv : plan.billingCatalogEnvKeys.monthlyPriceIdEnv}).
                      </p>
                    )}
                  </>
                )}

                {plan.id === 'institution_custom' && (
                  <button
                    type="button"
                    className="a360-btn-secondary w-full justify-center"
                    onClick={() => onNavigate('contact')}
                  >
                    <HelpCircle size={15} aria-hidden="true" />
                    Contact Institutional Inquiries
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {/* AI Credits Separate Transparency Section */}
      <section className="a360-section" aria-labelledby="pricing-ai-credits">
        <div className="a360-section-head">
          <div>
            <p className="a360-kicker">Metered AI Study Credits</p>
            <h2 id="pricing-ai-credits">Separate AI Credits &amp; Top-Up Packs</h2>
            <p>{AI_CREDIT_DISCLOSURES.separationNotice}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {paidAddons.map((addon) => {
            const addonCatalog =
              config.aiAddonsCatalog[addon.id === 'exam_prep_pack' ? 'exam_prep_pack' : 'student_monthly'];
            const canCheckoutAddon =
              seller.billingProvider !== 'unselected' &&
              Boolean(addonCatalog.checkoutUrl ?? addonCatalog.priceId) &&
              (config.liveCheckoutAllowed || config.sandboxReady);
            return (
              <div
                key={addon.id}
                className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900">{addon.name}</h3>
                    <span className="font-mono text-sm font-semibold text-teal-800">
                      {addon.priceLabel}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{addon.summary}</p>
                  <p className="mt-2 font-mono text-xs text-slate-700">
                    {addon.creditsIncluded.toLocaleString()} metered credits (~{addon.estimatedQueries} avg queries · {addon.validityDays}d validity)
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <span className="text-[11px] text-slate-500">
                    Does not auto-grant Student/Educator platform tier.
                  </span>
                  <button
                    type="button"
                    disabled={busy || !canCheckoutAddon}
                    onClick={() =>
                      void openCheckout(
                        addon.id === 'exam_prep_pack' ? 'exam_prep_pack' : 'student_monthly',
                        addon.billingKind === 'monthly_subscription' ? 'monthly' : 'none',
                      )
                    }
                    className="a360-btn-secondary"
                  >
                    {canCheckoutAddon ? 'Checkout Add-On' : 'Awaiting Provider Catalog'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
          <p>
            <strong>Metering:</strong> {AI_CREDIT_DISCLOSURES.meteringFormula}
          </p>
          <p className="mt-1">
            <strong>Expiry &amp; Unused Credits:</strong> {AI_CREDIT_DISCLOSURES.expiryPolicy}
          </p>
          <p className="mt-1">
            <strong>Refund Reversal:</strong> {AI_CREDIT_DISCLOSURES.refundPolicy}
          </p>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="a360-section" aria-labelledby="pricing-comparison-heading">
        <div className="a360-section-head">
          <div>
            <p className="a360-kicker">Plan Comparison</p>
            <h2 id="pricing-comparison-heading">What Each Tier Includes</h2>
          </div>
        </div>
        <div className="a360-license-table-wrap rounded-xl border border-slate-200 bg-white">
          <table className="a360-license-table">
            <thead>
              <tr>
                <th>Capability</th>
                <th>Free Explorer</th>
                <th>Student Plus</th>
                <th>Educator Plus</th>
                <th>Institution</th>
              </tr>
            </thead>
            <tbody>
              {COMMERCIAL_COMPARISON_ROWS.map((row) => (
                <tr key={row.feature}>
                  <td>
                    <strong className="font-medium text-slate-900">{row.feature}</strong>
                    <span className="ml-2 font-mono text-[11px] text-slate-500">{row.category}</span>
                  </td>
                  <td>{row.free}</td>
                  <td>{row.student}</td>
                  <td>{row.educator}</td>
                  <td>{row.institution}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Current Entitlement Status & Customer Portal */}
      <section
        className="grid gap-5 lg:grid-cols-2"
        aria-labelledby="pricing-entitlement-heading"
        data-testid="pricing-entitlement-card"
      >
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="a360-kicker">Server-Verified Account Entitlement</p>
              <h2 id="pricing-entitlement-heading" className="text-lg font-bold text-slate-900">
                Your Current Plan &amp; Subscription State
              </h2>
            </div>
            <button
              type="button"
              onClick={() => void refreshEntitlements()}
              disabled={loading || busy}
              className="a360-mini-btn inline-flex items-center gap-1"
            >
              <RefreshCw size={13} aria-hidden="true" />
              Refresh
            </button>
          </div>

          <dl className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3.5 text-xs">
            <div>
              <dt className="text-slate-500">Account ID</dt>
              <dd className="font-mono font-semibold text-slate-900" data-testid="entitlement-account-id">
                {entitlement?.accountId ?? 'Initializing…'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Active Plan</dt>
              <dd className="font-semibold text-slate-900" data-testid="entitlement-active-plan">
                {entitlement?.activePlanId ?? 'free_explorer'} ({entitlement?.subscriptionStatus ?? 'free'})
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">AI Credits Remaining</dt>
              <dd className="font-mono font-semibold text-slate-900" data-testid="entitlement-ai-credits">
                {entitlement ? entitlement.aiQuota.creditsRemaining.toLocaleString() : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Refund / Reversal</dt>
              <dd className="font-semibold text-slate-900" data-testid="entitlement-refund-status">
                {entitlement?.refundStatus ?? 'none'}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => void openPortal()}
              data-testid="manage-subscription-btn"
              className="a360-btn-secondary"
            >
              <ExternalLink size={14} aria-hidden="true" />
              Manage Subscription (Billing Portal)
            </button>
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="a360-btn-secondary"
            >
              View Progress Dashboard
            </button>
          </div>

          <p className="text-xs leading-relaxed text-slate-600">
            <ShieldCheck size={13} className="mr-1 inline text-teal-700" aria-hidden="true" />
            {BILLING_PROVIDER_DISCLOSURE} Access is granted strictly from HMAC-verified server
            webhooks persisted durably in Cloud SQL PostgreSQL (or local SQLite in offline dev) —
            never from client-side callbacks alone.
          </p>
        </div>

        {/* Sandbox Webhook Verification Console (non-production only) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="a360-kicker">
                {devSandboxAllowed ? 'Development / Preview Verification' : 'Order & Billing Terms'}
              </p>
              <h2 className="text-lg font-bold text-slate-900">
                {devSandboxAllowed
                  ? 'Whop-Compatible Signed Webhook Simulator'
                  : 'Renewal, Cancellation & Buyer Support'}
              </h2>
            </div>
            <Sliders size={18} className="text-teal-700" aria-hidden="true" />
          </div>

          {devSandboxAllowed ? (
            <>
              <p className="text-xs leading-relaxed text-slate-600">
                Test full subscription provisioning, cancellation, payment failure, refund, and
                chargeback reversals through our signed webhook verifier (
                <code>/api/billing/webhook/whop</code>) and durable Cloud SQL billing store.
                Disabled automatically in production builds.
              </p>
              <div className="flex flex-wrap gap-2" data-testid="sandbox-controls">
                <button
                  type="button"
                  disabled={busy}
                  data-testid="sim-student-monthly"
                  onClick={() => void simulateSandboxEvent('purchase_student_monthly')}
                  className="a360-mini-btn"
                >
                  Simulate Student Plus ($4.99)
                </button>
                <button
                  type="button"
                  disabled={busy}
                  data-testid="sim-educator-annual"
                  onClick={() => void simulateSandboxEvent('purchase_educator_annual')}
                  className="a360-mini-btn"
                >
                  Simulate Educator Annual ($79.99)
                </button>
                <button
                  type="button"
                  disabled={busy}
                  data-testid="sim-ai-burst"
                  onClick={() => void simulateSandboxEvent('purchase_ai_burst')}
                  className="a360-mini-btn"
                >
                  Simulate AI Burst (+650k cr)
                </button>
                <button
                  type="button"
                  disabled={busy}
                  data-testid="sim-cancel"
                  onClick={() => void simulateSandboxEvent('cancel_subscription')}
                  className="a360-mini-btn"
                >
                  Simulate Cancellation
                </button>
                <button
                  type="button"
                  disabled={busy}
                  data-testid="sim-payment-failed"
                  onClick={() => void simulateSandboxEvent('payment_failed')}
                  className="a360-mini-btn"
                >
                  Simulate Payment Failed
                </button>
                <button
                  type="button"
                  disabled={busy}
                  data-testid="sim-refund"
                  onClick={() => void simulateSandboxEvent('refund')}
                  className="a360-mini-btn"
                >
                  Simulate Refund Reversal
                </button>
                <button
                  type="button"
                  disabled={busy}
                  data-testid="sim-chargeback"
                  onClick={() => void simulateSandboxEvent('chargeback')}
                  className="a360-mini-btn"
                >
                  Simulate Chargeback
                </button>
              </div>
              {entitlement && entitlement.transactions.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="font-mono text-[11px] font-semibold text-slate-600">
                    Durable Ledger (Recent {entitlement.transactions.length})
                  </p>
                  <ul className="mt-1.5 space-y-1 text-xs text-slate-700">
                    {entitlement.transactions.slice(0, 4).map((tx) => (
                      <li key={tx.id} className="flex items-center justify-between gap-2">
                        <span>
                          <code>{tx.planId}</code> · {tx.status}
                        </span>
                        <span className="font-mono">
                          {formatUsdCents(tx.amountCents)}
                          {tx.creditsGranted > 0 ? ` · +${tx.creditsGranted.toLocaleString()} cr` : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2 text-xs leading-relaxed text-slate-600">
              <p>
                <strong>Auto-Renewal:</strong> Paid plans renew automatically at your chosen monthly
                or annual interval until canceled before the renewal date.
              </p>
              <p>
                <strong>After Cancellation:</strong> Access continues until the end of the current
                paid period, then returns to Free Explorer without erasing your local study history.
              </p>
              <p>
                <strong>Refunds &amp; Help:</strong> Review our Refund Policy or contact Support if
                you run into billing or technical access issues.
              </p>
            </div>
          )}
        </div>
      </section>

      <SiteFooter onNavigate={onNavigate} />
    </div>
  );
}
