import { BILLING_PROVIDER_DISCLOSURE } from '../commercial/commercial-config';
import { useBilling } from './BillingContext';
import type { AppRoute } from '../navigation-registry';

interface Props {
  onNavigate: (route: AppRoute) => void;
}

export default function SiteFooter({ onNavigate }: Props) {
  const { config } = useBilling();
  const seller = config.seller;

  return (
    <footer className="a360-footer" data-testid="site-footer">
      <div className="space-y-2">
        <p>
          <strong>{seller.tradingName}</strong> · Interactive 3D Human Anatomy &amp; Biomedical
          Education Software · BodyParts3D 4.0 © DBCLS (CC BY 4.0) &amp; HuBMAP HRA 3D Reference
          Library (CC BY 4.0).
        </p>
        <p className="text-xs text-slate-600">
          Educational software only — not intended for medical diagnosis, clinical treatment, or
          surgical planning.{' '}
          {seller.legalSellerName
            ? `Seller: ${seller.legalSellerName}${seller.sellerCountry ? ` (${seller.sellerCountry})` : ''}.`
            : 'Seller legal identity & payment provider selection (e.g., Whop, Creem, or another Merchant of Record) pending owner confirmation.'}{' '}
          {config.liveCheckoutAllowed ? BILLING_PROVIDER_DISCLOSURE : ''}
        </p>
      </div>

      <nav className="a360-footer-links" aria-label="Footer navigation">
        <button type="button" onClick={() => onNavigate('features')}>
          Features
        </button>
        <button type="button" onClick={() => onNavigate('pricing')}>
          Pricing
        </button>
        <button type="button" onClick={() => onNavigate('terms')}>
          Terms
        </button>
        <button type="button" onClick={() => onNavigate('privacy')}>
          Privacy
        </button>
        <button type="button" onClick={() => onNavigate('refunds')}>
          Refund Policy
        </button>
        <button type="button" onClick={() => onNavigate('contact')}>
          Contact &amp; Support
        </button>
        <button type="button" onClick={() => onNavigate('about')}>
          About &amp; Licenses
        </button>
        <button type="button" onClick={() => onNavigate('tools')}>
          All Tools
        </button>
        <button type="button" onClick={() => onNavigate('explorer')}>
          3D Explorer
        </button>
      </nav>
    </footer>
  );
}
