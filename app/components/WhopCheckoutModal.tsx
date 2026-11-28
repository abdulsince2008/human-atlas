import { useEffect } from 'react';
import { WhopCheckoutEmbed } from '@whop/checkout/react';
import { Lock, ExternalLink, X } from 'lucide-react';

export interface ActiveWhopCheckout {
  planId: 'student_plus' | 'educator_plus' | 'student_monthly' | 'exam_prep_pack';
  planTitle: string;
  interval: 'monthly' | 'annual' | 'none';
  whopPlanId: string | null;
  sessionId: string | null;
  checkoutUrl: string | null;
  returnUrl: string | null;
  environment: 'sandbox' | 'production';
  buyerEmail?: string | null;
}

interface Props {
  checkout: ActiveWhopCheckout;
  onClose: () => void;
  onCheckoutComplete: () => void;
}

export default function WhopCheckoutModal({
  checkout,
  onClose,
  onCheckoutComplete,
}: Props) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const intervalLabel =
    checkout.interval === 'annual'
      ? 'Annual Billing'
      : checkout.interval === 'monthly'
        ? 'Monthly Billing'
        : 'One-Time Add-On';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="whop-checkout-modal-title"
      data-testid="whop-checkout-modal"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div>
            <p className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-teal-800">
              <Lock size={12} aria-hidden="true" /> Alphatomy · On-Site Checkout (Whop)
            </p>
            <h2 id="whop-checkout-modal-title" className="mt-0.5 text-lg font-bold text-slate-900">
              {checkout.planTitle} ({intervalLabel})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkout dialog"
            data-testid="whop-checkout-close-btn"
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-4 space-y-4">
          {checkout.sessionId ? (
            <WhopCheckoutEmbed
              sessionId={checkout.sessionId}
              environment={checkout.environment}
              theme="light"
              themeOptions={{ accentColor: 'teal', borderRadius: 10 }}
              skipRedirect={true}
              returnUrl={checkout.returnUrl ?? undefined}
              prefill={checkout.buyerEmail ? { email: checkout.buyerEmail } : undefined}
              onComplete={() => onCheckoutComplete()}
              fallback={
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
                  Loading secure Whop checkout inside Alphatomy…
                </div>
              }
            />
          ) : checkout.whopPlanId ? (
            <WhopCheckoutEmbed
              planId={checkout.whopPlanId}
              environment={checkout.environment}
              theme="light"
              themeOptions={{ accentColor: 'teal', borderRadius: 10 }}
              skipRedirect={true}
              returnUrl={checkout.returnUrl ?? undefined}
              prefill={checkout.buyerEmail ? { email: checkout.buyerEmail } : undefined}
              onComplete={() => onCheckoutComplete()}
              fallback={
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
                  Loading secure Whop checkout inside Alphatomy…
                </div>
              }
            />
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950">
              No Whop plan ID is configured for this tier yet.
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
            <span>
              Access unlocks automatically on Alphatomy once Whop confirms payment via signed webhook.
            </span>
            {checkout.checkoutUrl && (
              <a
                href={checkout.checkoutUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-teal-800 hover:underline"
              >
                Open Hosted Fallback <ExternalLink size={11} aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
