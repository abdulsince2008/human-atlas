import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getCommercialPlanById,
  getDefaultCommercialRuntimeSnapshot,
  type CommercialRuntimeSnapshot,
} from '../commercial/commercial-config';
import type { PublicBillingEntitlementSummary } from '../../server/billing-store';
import { useFirebase } from './FirebaseContext';
import WhopCheckoutModal, { type ActiveWhopCheckout } from './WhopCheckoutModal';

export type SandboxScenario =
  | 'purchase_student_monthly'
  | 'purchase_student_annual'
  | 'purchase_educator_monthly'
  | 'purchase_educator_annual'
  | 'purchase_ai_burst'
  | 'cancel_subscription'
  | 'payment_failed'
  | 'refund'
  | 'chargeback';

interface BillingContextValue {
  config: CommercialRuntimeSnapshot;
  clientToken: string | null;
  devSandboxAllowed: boolean;
  entitlement: PublicBillingEntitlementSummary | null;
  loading: boolean;
  busy: boolean;
  statusMessage: string | null;
  refreshEntitlements: () => Promise<void>;
  openCheckout: (
    planId: 'student_plus' | 'educator_plus' | 'student_monthly' | 'exam_prep_pack',
    interval: 'monthly' | 'annual' | 'none',
  ) => Promise<void>;
  openPortal: () => Promise<void>;
  simulateSandboxEvent: (scenario: SandboxScenario) => Promise<void>;
  clearStatusMessage: () => void;
}

const BillingContext = createContext<BillingContextValue | null>(null);

export function BillingProvider({ children }: { children: ReactNode }) {
  const { user, isVerifiedUser } = useFirebase();
  const [config, setConfig] = useState<CommercialRuntimeSnapshot>(() =>
    getDefaultCommercialRuntimeSnapshot(),
  );
  const [clientToken, setClientToken] = useState<string | null>(null);
  const [devSandboxAllowed, setDevSandboxAllowed] = useState(false);
  const [entitlement, setEntitlement] = useState<PublicBillingEntitlementSummary | null>(null);
  const [bearerToken, setBearerToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeCheckout, setActiveCheckout] = useState<ActiveWhopCheckout | null>(null);

  const buildHeaders = useCallback(
    async (withJson = false): Promise<Record<string, string>> => {
      const headers: Record<string, string> = {};
      if (withJson) {
        headers['Content-Type'] = 'application/json';
        headers['X-Requested-With'] = 'Anatomy360';
      }
      if (bearerToken) {
        headers.Authorization = `Bearer ${bearerToken}`;
      }
      if (user && isVerifiedUser) {
        try {
          const idTok = await user.getIdToken();
          if (idTok) headers['X-Firebase-Id-Token'] = idTok;
        } catch {
          // Proceed cleanly with session cookie/token
        }
      }
      return headers;
    },
    [bearerToken, user, isVerifiedUser],
  );

  const refreshEntitlements = useCallback(async () => {
    setLoading(true);
    try {
      const [cfgRes, entRes] = await Promise.all([
        fetch('/api/billing/config'),
        fetch('/api/billing/entitlements', { headers: await buildHeaders(false) }),
      ]);
      if (cfgRes.ok) {
        const cfgData = (await cfgRes.json()) as {
          ok?: boolean;
          snapshot?: CommercialRuntimeSnapshot;
          clientToken?: string | null;
          devSandboxAllowed?: boolean;
        };
        if (cfgData.snapshot) setConfig(cfgData.snapshot);
        setClientToken(cfgData.clientToken ?? null);
        setDevSandboxAllowed(Boolean(cfgData.devSandboxAllowed));
      }
      if (entRes.ok) {
        const entData = (await entRes.json()) as {
          ok?: boolean;
          bearerToken?: string;
          entitlement?: PublicBillingEntitlementSummary;
        };
        if (entData.bearerToken) setBearerToken(entData.bearerToken);
        if (entData.entitlement) setEntitlement(entData.entitlement);
      }
    } catch {
      // Non-fatal in offline/static mode; default unconfigured state applies cleanly
    } finally {
      setLoading(false);
    }
  }, [buildHeaders]);

  useEffect(() => {
    void refreshEntitlements();
  }, [user?.uid, isVerifiedUser]);

  const openCheckout = useCallback(
    async (
      planId: 'student_plus' | 'educator_plus' | 'student_monthly' | 'exam_prep_pack',
      interval: 'monthly' | 'annual' | 'none',
    ) => {
      setBusy(true);
      setStatusMessage(null);
      try {
        const res = await fetch('/api/billing/checkout-intent', {
          method: 'POST',
          headers: await buildHeaders(true),
          body: JSON.stringify({ planId, interval }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          mode?: 'whop_embedded' | 'hosted_redirect';
          provider?: string;
          environment?: 'sandbox' | 'production';
          bearerToken?: string;
          error?: string;
          priceId?: string | null;
          sessionId?: string | null;
          checkoutUrl?: string | null;
          returnUrl?: string | null;
        };
        if (data.bearerToken) setBearerToken(data.bearerToken);
        if (!res.ok || !data.ok) {
          setStatusMessage(
            data.error ??
              'Checkout is disabled until Whop plan credentials and owner details are configured.',
          );
          return;
        }
        if (data.mode === 'whop_embedded' && (data.sessionId || data.priceId)) {
          const planTitle =
            getCommercialPlanById(planId)?.name ??
            (planId === 'exam_prep_pack' ? 'Exam Prep Burst Pack' : 'Student Monthly AI Pass');
          setActiveCheckout({
            planId,
            planTitle,
            interval,
            whopPlanId: data.priceId ?? null,
            sessionId: data.sessionId ?? null,
            checkoutUrl: data.checkoutUrl ?? null,
            returnUrl: data.returnUrl ?? null,
            environment: data.environment ?? config.seller.billingEnvironment,
            buyerEmail: user?.email ?? null,
          });
          return;
        }
        if (data.checkoutUrl) {
          window.location.assign(data.checkoutUrl);
          return;
        }
        setStatusMessage(
          'Checkout session prepared on server. Configure Whop Plan IDs (plan_...) to open on-site checkout.',
        );
      } catch {
        setStatusMessage('Unable to start checkout right now. Please try again.');
      } finally {
        setBusy(false);
      }
    },
    [buildHeaders, config.seller.billingEnvironment, user?.email],
  );

  const openPortal = useCallback(async () => {
    setBusy(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: await buildHeaders(true),
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        overviewUrl?: string;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.overviewUrl) {
        setStatusMessage(
          data.error ??
            'Customer billing portal unavailable until a live payment provider is finalized. See Contact & Support.',
        );
        return;
      }
      window.location.assign(data.overviewUrl);
    } catch {
      setStatusMessage('Unable to reach Customer Billing Portal right now.');
    } finally {
      setBusy(false);
    }
  }, [buildHeaders]);

  const simulateSandboxEvent = useCallback(
    async (scenario: SandboxScenario) => {
      setBusy(true);
      setStatusMessage(null);
      try {
        const res = await fetch('/api/billing/sandbox/simulate', {
          method: 'POST',
          headers: await buildHeaders(true),
          body: JSON.stringify({ scenario }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          bearerToken?: string;
          entitlement?: PublicBillingEntitlementSummary;
          webhookResult?: { code?: string; eventType?: string; error?: string };
          error?: string;
        };
        if (data.bearerToken) setBearerToken(data.bearerToken);
        if (data.entitlement) setEntitlement(data.entitlement);
        if (!res.ok || !data.ok) {
          setStatusMessage(data.error ?? data.webhookResult?.error ?? 'Sandbox webhook simulation failed.');
          return;
        }
        setStatusMessage(
          `Verified signed sandbox webhook processed (${data.webhookResult?.eventType ?? scenario} → ${data.webhookResult?.code ?? 'OK'}). Durable SQLite state updated.`,
        );
      } catch {
        setStatusMessage('Network error while running sandbox webhook simulation.');
      } finally {
        setBusy(false);
      }
    },
    [buildHeaders],
  );

  const clearStatusMessage = useCallback(() => setStatusMessage(null), []);

  const value = useMemo<BillingContextValue>(
    () => ({
      config,
      clientToken,
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
    }),
    [
      config,
      clientToken,
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
    ],
  );

  const handleWhopCheckoutComplete = useCallback(() => {
    setActiveCheckout(null);
    setStatusMessage(
      'Payment submitted cleanly. Verifying signed Whop webhook confirmation with server...',
    );
    void refreshEntitlements();
    setTimeout(() => {
      void refreshEntitlements();
    }, 2500);
  }, [refreshEntitlements]);

  return (
    <BillingContext.Provider value={value}>
      {children}
      {activeCheckout && (
        <WhopCheckoutModal
          checkout={activeCheckout}
          onClose={() => setActiveCheckout(null)}
          onCheckoutComplete={handleWhopCheckoutComplete}
        />
      )}
    </BillingContext.Provider>
  );
}

export function useBilling(): BillingContextValue {
  const ctx = useContext(BillingContext);
  if (!ctx) {
    throw new Error('useBilling() must be called inside <BillingProvider>');
  }
  return ctx;
}
