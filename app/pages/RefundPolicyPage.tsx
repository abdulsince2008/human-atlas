import PageOrientationBar from '../components/PageOrientationBar';
import SiteFooter from '../components/SiteFooter';
import { BILLING_PROVIDER_DISCLOSURE } from '../commercial/commercial-config';
import type { AppRoute } from '../navigation-registry';

interface Props {
  onNavigate: (route: AppRoute) => void;
}

export default function RefundPolicyPage({ onNavigate }: Props) {
  return (
    <div className="a360-page a360-narrow" data-testid="refund-page">
      <header className="a360-page-header">
        <p className="a360-kicker">Billing, Cancellations &amp; Refunds</p>
        <h1>Refund Policy</h1>
        <p className="a360-lead">
          Clear explanation of how refunds, cancellations, technical troubleshooting, and statutory
          consumer rights work for paid Alphatomy orders once live billing is enabled.
        </p>
      </header>

      <PageOrientationBar
        whatThisIs="Details on the payment provider refund process, how to cancel subscriptions, and what happens to access and AI credits after a refund."
        primaryHint="Need help accessing an existing purchase? Visit Contact & Support before requesting a cancellation or refund."
        spokenSummary="Alphatomy Refund Policy. When live sales are enabled through our finalized payment provider, refund requests and returns are handled in line with applicable consumer law and the provider's buyer terms."
      />

      <section className="a360-prose-block space-y-3">
        <h2>1. Payment Provider &amp; Merchant Processing</h2>
        <p>{BILLING_PROVIDER_DISCLOSURE}</p>
        <p>
          Where an authorized Merchant of Record or hosted checkout provider processes customer
          payments, refund processing, tax/VAT invoices, and card returns are handled through that
          provider&apos;s order system in accordance with its buyer terms and applicable statutory
          consumer protection rules.
        </p>
      </section>

      <section className="a360-prose-block space-y-3">
        <h2>2. How to Request a Refund</h2>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
          <li>
            Locate your order confirmation email or invoice receipt from the payment provider and
            use the included order-lookup or buyer-support link to request a refund or cancellation.
          </li>
          <li>
            Alternatively, contact Alphatomy{' '}
            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="font-semibold text-teal-800 underline"
            >
              Contact &amp; Support
            </button>{' '}
            with your transaction ID and account reference so we can inspect technical entitlement
            issues or help direct your refund request to the active payment provider.
          </li>
        </ol>
      </section>

      <section className="a360-prose-block space-y-3">
        <h2>3. Technical Support for Defective or Missing Access</h2>
        <p>
          If you completed a payment once live checkout is enabled but your Student Plus tier,
          Educator Plus tier, or AI credit pack has not unlocked (for example due to a browser
          refresh, device switch, or missing sign-in link), please check the{' '}
          <button
            type="button"
            onClick={() => onNavigate('pricing')}
            className="font-semibold text-teal-800 underline"
          >
            Pricing &amp; Entitlement status panel
          </button>{' '}
          and contact us right away. Where software access is faulty or materially defective and
          cannot be resolved promptly, refunds are honored consistent with applicable consumer law.
        </p>
      </section>

      <section className="a360-prose-block space-y-3">
        <h2>4. Subscription Cancellation vs. Refunds</h2>
        <p>
          <strong>Canceling a Subscription:</strong> You can cancel auto-renewal anytime via your
          Billing Portal link or purchase confirmation email. Canceling stops future recurring
          charges while keeping your paid access active until the end of your current paid billing
          period.
        </p>
        <p>
          <strong>Access After a Refund or Chargeback:</strong> Once a refund, payment reversal, or
          chargeback is approved and received via signed billing webhook:
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>
            Your paid subscription entitlement reverts immediately on the server to{' '}
            <strong>Free Explorer</strong>.
          </li>
          <li>
            Any AI study credits granted specifically by the refunded transaction are revoked from
            your account balance.
          </li>
          <li>
            Your free local study notes, bookmarks, and flashcard history remain intact in your
            browser.
          </li>
        </ul>
      </section>

      <section className="a360-prose-block space-y-3">
        <h2>5. Applicable Consumer Rights</h2>
        <p>
          Nothing in this Refund Policy limits mandatory statutory consumer cancellation or refund
          rights that apply in your jurisdiction.
        </p>
      </section>

      <SiteFooter onNavigate={onNavigate} />
    </div>
  );
}
