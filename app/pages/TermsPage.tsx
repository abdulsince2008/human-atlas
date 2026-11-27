import PageOrientationBar from '../components/PageOrientationBar';
import SiteFooter from '../components/SiteFooter';
import { useBilling } from '../components/BillingContext';
import { BILLING_PROVIDER_DISCLOSURE } from '../commercial/commercial-config';
import type { AppRoute } from '../navigation-registry';

interface Props {
  onNavigate: (route: AppRoute) => void;
}

export default function TermsPage({ onNavigate }: Props) {
  const { config } = useBilling();
  const seller = config.seller;

  return (
    <div className="a360-page a360-narrow" data-testid="terms-page">
      <header className="a360-page-header">
        <p className="a360-kicker">Legal &amp; Buyer Terms</p>
        <h1>Terms and Conditions</h1>
        <p className="a360-lead">
          Transparent buyer terms governing access to Anatomy 360 educational software, datasets,
          optional paid plans, and payment processing disclosures.
        </p>
      </header>

      <PageOrientationBar
        whatThisIs="The Terms and Conditions explaining who operates Anatomy 360, how software subscriptions and datasets are licensed, and how future checkout and renewals work."
        primaryHint="Questions before purchasing? Visit Contact & Support or review the Refund Policy."
        spokenSummary="Anatomy 360 Terms and Conditions page."
      />

      {(!seller.legalSellerName || !config.liveCheckoutAllowed) && (
        <div
          className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 text-xs leading-relaxed text-amber-950"
          role="status"
        >
          <strong>Pre-Submission Notice:</strong> Commercial Seller identity fields and final
          payment provider selection (e.g., Whop, Creem, Paddle, or another processor) are still
          pending owner confirmation and provider approval. Live paid checkout remains disabled
          until legal seller details, confirmed pricing, and provider onboarding are completed.
        </div>
      )}

      <section className="a360-prose-block space-y-3">
        <h2>1. Seller Identity &amp; Product Scope</h2>
        <p>
          <strong>Trading Name:</strong> {seller.tradingName}
        </p>
        <p>
          <strong>Legal Seller Name:</strong>{' '}
          {seller.legalSellerName ?? '[Owner Legal Seller Name Required Prior to Live Sales]'}
        </p>
        <p>
          <strong>Seller Type &amp; Country:</strong>{' '}
          {seller.sellerType && seller.sellerCountry
            ? `${seller.sellerType} · ${seller.sellerCountry}`
            : '[Pending Confirmed Legal Entity / Sole Proprietor & Country]'}
        </p>
        <p>
          <strong>Product Scope:</strong> Anatomy 360 is an interactive browser-based 3D human
          anatomy and biomedical educational software platform offering 3D exploration, structured
          subjects, curriculum matching, practice quizzes, flashcards, physiology sliders, histology
          and radiology guides, and educator preparation tools.
        </p>
      </section>

      <section className="a360-prose-block space-y-3">
        <h2>2. Payment Processing &amp; Merchant of Record Disclosure</h2>
        <p>{BILLING_PROVIDER_DISCLOSURE}</p>
        <p>
          Selected Provider Status:{' '}
          <strong>
            {seller.billingProvider === 'unselected'
              ? 'Not yet finalized (evaluating options)'
              : seller.billingProvider.toUpperCase()}
          </strong>
          . This page does not claim that any external payment provider has approved this site or
          merchant account prior to formal written approval.
        </p>
      </section>

      <section className="a360-prose-block space-y-3">
        <h2>3. Account Requirements &amp; Software Access</h2>
        <p>
          Core Free Explorer tools run locally in your web browser without creating an account. Paid
          memberships and cross-device cloud sync may require signing in via Google Sign-In or
          maintaining a verified session token so entitlements restored from server webhooks remain
          available across browser refreshes and devices.
        </p>
        <p>
          Access to paid subscription features is granted strictly on the basis of verified
          server-side entitlement records received from signed billing webhooks — never solely from
          local browser state.
        </p>
      </section>

      <section className="a360-prose-block space-y-3">
        <h2>4. Subscriptions, Automatic Renewal, Cancellation &amp; Refunds</h2>
        <p>
          <strong>Billing &amp; Renewal:</strong> Paid subscriptions (such as Student Plus or
          Educator Plus when active) are billed on a recurring monthly or annual schedule in USD
          unless canceled before the next billing date. Exact prices are displayed on the Pricing
          page and inside the provider checkout prior to confirmation.
        </p>
        <p>
          <strong>Cancellation:</strong> You may cancel future renewals anytime using the Customer
          Billing Portal link (when live) or your purchase receipt management link. Stopping renewal
          prevents subsequent charges; your paid access continues until the end of your already-paid
          billing period and then returns to Free Explorer without erasing local browser study
          records.
        </p>
        <p>
          <strong>Refunds &amp; Reversals:</strong> Refund requests and returns for paid orders are
          handled in accordance with our{' '}
          <button
            type="button"
            onClick={() => onNavigate('refunds')}
            className="font-semibold text-teal-800 underline"
          >
            Refund Policy
          </button>{' '}
          and the authorized payment provider&apos;s buyer terms. If a payment is refunded, reversed,
          or charged back, the associated paid tier access and unused transaction-granted AI credits
          are revoked on the server.
        </p>
      </section>

      <section className="a360-prose-block space-y-3">
        <h2>5. AI Navigator Credits</h2>
        <p>
          Optional AI Navigator study credits are metered strictly by verified AI token consumption
          and apply only to the AI assistant feature. AI credits expire according to their plan
          terms (monthly subscription cycle or 90-day burst pack window), are not marketed as
          unlimited, and do not grant medical advice.
        </p>
      </section>

      <section className="a360-prose-block space-y-3">
        <h2>6. Acceptable Use, Intellectual Property &amp; Third-Party Datasets</h2>
        <p>
          You agree not to reverse-engineer server billing verification, bypass AI quota
          enforcement, share paid multi-user credentials improperly, or misrepresent educational study
          exports as institutional accreditation.
        </p>
        <p>
          Anatomy 360 software UI, curriculum integration logic, and documentation remain the
          intellectual property of their respective authors, while underlying anatomical datasets retain
          their original open licenses: BodyParts3D 4.0 © DBCLS (CC BY 4.0), HuBMAP Human Reference
          Atlas meshes (CC BY 4.0), and Human Atlas WebGL architecture (MIT). Full attribution and
          limitations appear on{' '}
          <button
            type="button"
            onClick={() => onNavigate('about')}
            className="font-semibold text-teal-800 underline"
          >
            About &amp; Licenses
          </button>
          .
        </p>
      </section>

      <section className="a360-prose-block space-y-3">
        <h2>7. Educational Medical Disclaimer &amp; Product Limitations</h2>
        <p>
          <strong>Not Medical Advice:</strong> Anatomy 360 is educational software only. It does not
          provide clinical diagnosis, medical advice, treatment recommendations, or surgical
          planning. Additionally, as documented on About &amp; Licenses, certain microanatomical or
          specialized 3D structures remain outside current mesh coverage and curriculum materials
          have not completed formal external faculty certification.
        </p>
      </section>

      <section className="a360-prose-block space-y-3">
        <h2>8. Suspension, Customer Support &amp; Applicable Law</h2>
        <p>
          We may suspend accounts involved in automated abuse, fraudulent chargebacks, or security
          tampering. For support inquiries, contact{' '}
          {seller.supportEmail ? (
            <a href={`mailto:${seller.supportEmail}`} className="font-semibold text-teal-800 underline">
              {seller.supportEmail}
            </a>
          ) : (
            '[Pending Owner Support Email — see Contact & Support]'
          )}{' '}
          or visit{' '}
          <button
            type="button"
            onClick={() => onNavigate('contact')}
            className="font-semibold text-teal-800 underline"
          >
            Contact &amp; Support
          </button>
          .
        </p>
        <p>
          <strong>Governing Law &amp; Legal Review:</strong>{' '}
          {seller.sellerCountry
            ? `Subject to applicable consumer laws and final legal review for seller jurisdiction (${seller.sellerCountry}) and the finalized payment processor buyer terms.`
            : '[Owner Governing Law / Jurisdiction Pending Legal Review Prior to Live Sales]'}
        </p>
      </section>

      <SiteFooter onNavigate={onNavigate} />
    </div>
  );
}
