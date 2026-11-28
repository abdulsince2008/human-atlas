import { HelpCircle, Mail, Phone, ShieldAlert } from 'lucide-react';
import PageOrientationBar from '../components/PageOrientationBar';
import SiteFooter from '../components/SiteFooter';
import { useBilling } from '../components/BillingContext';
import type { AppRoute } from '../navigation-registry';

interface Props {
  onNavigate: (route: AppRoute) => void;
}

export default function ContactPage({ onNavigate }: Props) {
  const { config } = useBilling();
  const seller = config.seller;

  return (
    <div className="a360-page a360-narrow" data-testid="contact-page">
      <header className="a360-page-header">
        <p className="a360-kicker">Help, Support &amp; Inquiries</p>
        <h1>Contact &amp; Support</h1>
        <p className="a360-lead">
          Reach Alphatomy for 3D viewer assistance, curriculum feedback, privacy deletion requests,
          institutional inquiries, or billing support.
        </p>
      </header>

      <PageOrientationBar
        whatThisIs="Public support channels for product troubleshooting, billing/order guidance, institutional questions, and data privacy requests."
        primaryHint="For billing receipts, invoice downloads, or refunds on live orders, have your transaction ID and account ID ready."
        spokenSummary="Alphatomy Contact and Support page."
      />

      {(!seller.supportEmail || !seller.supportPhone) && (
        <section
          className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 text-xs leading-relaxed text-amber-950"
          role="status"
          data-testid="contact-pending-notice"
        >
          <div className="flex items-start gap-2.5">
            <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-700" aria-hidden="true" />
            <div>
              <strong>Owner Contact Details Required Before Live Launch:</strong> Public support
              email and support telephone fields have intentionally not been fabricated. Supply real
              owner-monitored details via <code>COMMERCIAL_SUPPORT_EMAIL</code> and{' '}
              <code>COMMERCIAL_SUPPORT_PHONE</code> prior to enabling live checkout.
            </div>
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2" aria-label="Support channels">
        <article className="rounded-xl border border-slate-200 bg-white p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-teal-800">
            <Mail size={18} aria-hidden="true" />
            <h2 className="text-base font-bold text-slate-900">Product &amp; Account Support</h2>
          </div>
          <p className="text-xs leading-relaxed text-slate-600">
            Assistance with WebGL 3D rendering, study backups, Google Sign-In/Cloud Classroom sync,
            cross-device entitlement restoration, privacy deletion requests, and institutional
            department inquiries.
          </p>
          <div className="rounded-lg bg-slate-50 p-3 text-xs space-y-1.5">
            <p>
              <strong>Support Email:</strong>{' '}
              {seller.supportEmail ? (
                <a
                  href={`mailto:${seller.supportEmail}`}
                  className="font-mono font-semibold text-teal-800 underline"
                >
                  {seller.supportEmail}
                </a>
              ) : (
                <span className="font-mono text-amber-900">
                  [Pending Owner Support Email]
                </span>
              )}
            </p>
            <p className="flex items-center gap-1.5">
              <Phone size={12} aria-hidden="true" />
              <strong>Support Phone:</strong>{' '}
              {seller.supportPhone ? (
                <span className="font-mono font-semibold text-slate-900">
                  {seller.supportPhone}
                </span>
              ) : (
                <span className="font-mono text-amber-900">
                  [Pending Owner Support Phone]
                </span>
              )}
            </p>
            <p>
              <strong>Seller Identity:</strong>{' '}
              {seller.legalSellerName ?? '[Pending Owner Legal Seller Identity]'}
            </p>
          </div>
          <p className="text-[11px] text-slate-500">
            Response times are intentionally omitted until an owner-committed SLA is established.
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-teal-800">
            <HelpCircle size={18} aria-hidden="true" />
            <h2 className="text-base font-bold text-slate-900">
              Order, Invoice &amp; Refund Guidance
            </h2>
          </div>
          <p className="text-xs leading-relaxed text-slate-600">
            Once live checkout is enabled with a finalized payment provider / Merchant of Record,
            invoices, card updates, cancellations, and refund workflows will be linked directly from
            your email receipts and the Billing Portal.
          </p>
          <div className="space-y-2 pt-1 text-xs">
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={() => onNavigate('refunds')}
                className="font-semibold text-teal-800 hover:underline"
              >
                Read Refund Policy
              </button>
              <button
                type="button"
                onClick={() => onNavigate('pricing')}
                className="font-semibold text-teal-800 hover:underline"
              >
                Check Active Plan &amp; Portal
              </button>
              <button
                type="button"
                onClick={() => onNavigate('privacy')}
                className="font-semibold text-teal-800 hover:underline"
              >
                Privacy &amp; Data Rights
              </button>
            </div>
          </div>
        </article>
      </section>

      <SiteFooter onNavigate={onNavigate} />
    </div>
  );
}
