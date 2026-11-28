import {
  CheckCircle2,
  CreditCard,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Undo2,
  X,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Atlas, Concept, SystemId } from '../anatomy';
import { CURATED_KNOWLEDGE } from '../anatomy-knowledge';
import {
  resolveConceptForAiQuery,
  type AiAction,
  type AiNavigatorResponsePayload,
} from '../ai/navigator-contract';
import type {
  AiSubscriptionPlan,
  PublicQuotaSummary,
  SubscriptionPlanId,
} from '../ai/quota';
import type { AnatomySex } from '../female-atlas';
import { Button } from '@/components/ui/button';

interface ChatTurn {
  id: string;
  role: 'user' | 'assistant' | 'error';
  text: string;
  studyTip?: string;
  appliedActions?: string[];
  followUps?: string[];
  creditsCharged?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  anatomySex: AnatomySex;
  activeAtlas: Atlas | null;
  selectedConcept: Concept | null;
  visibleSystems: SystemId[];
  studyTrack: string;
  canUndoAiView: boolean;
  onUndoAiView: () => void;
  onExecuteActions: (actions: AiAction[]) => Promise<string[]>;
}

export default function AiNavigatorPanel({
  open,
  onClose,
  anatomySex,
  activeAtlas,
  selectedConcept,
  visibleSystems,
  studyTrack,
  canUndoAiView,
  onUndoAiView,
  onExecuteActions,
}: Props) {
  const [tab, setTab] = useState<'chat' | 'quota'>('chat');
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [sending, setSending] = useState(false);

  // Kept strictly in React memory (never persisted to localStorage/sessionStorage)
  const [bearerToken, setBearerToken] = useState<string>('');
  const [quota, setQuota] = useState<PublicQuotaSummary | null>(null);
  const [plans, setPlans] = useState<AiSubscriptionPlan[]>([]);
  const [keyConfigured, setKeyConfigured] = useState<boolean>(true);
  const [devPreviewEligible, setDevPreviewEligible] = useState<boolean>(false);
  const [loadingEntitlement, setLoadingEntitlement] = useState<boolean>(false);
  const [billingMessage, setBillingMessage] = useState<string>('');
  const [activatingPlanId, setActivatingPlanId] = useState<SubscriptionPlanId | null>(null);

  const scrollEndRef = useRef<HTMLDivElement>(null);

  const fetchEntitlement = useCallback(async (tokenOverride?: string) => {
    setLoadingEntitlement(true);
    try {
      const headers: Record<string, string> = {};
      const activeTok = tokenOverride ?? bearerToken;
      if (activeTok) headers.Authorization = `Bearer ${activeTok}`;
      const res = await fetch('/api/ai/entitlement', { headers });
      if (!res.ok) return;
      const data = (await res.json()) as {
        ok?: boolean;
        bearerToken?: string;
        keyConfigured?: boolean;
        devPreviewEligible?: boolean;
        account?: PublicQuotaSummary;
        plans?: AiSubscriptionPlan[];
      };
      if (data.bearerToken) setBearerToken(data.bearerToken);
      if (typeof data.keyConfigured === 'boolean') setKeyConfigured(data.keyConfigured);
      if (typeof data.devPreviewEligible === 'boolean') {
        setDevPreviewEligible(data.devPreviewEligible);
      }
      if (data.account) setQuota(data.account);
      if (Array.isArray(data.plans)) setPlans(data.plans);
    } catch {
      // Network status surfaced cleanly on interaction
    } finally {
      setLoadingEntitlement(false);
    }
  }, [bearerToken]);

  useEffect(() => {
    if (open && !quota) {
      void fetchEntitlement();
    }
  }, [open, quota, fetchEntitlement]);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns.length, sending]);

  const starterPrompts = useMemo(() => {
    if (selectedConcept) {
      return [
        `Isolate ${selectedConcept.name} & explain its clinical anatomy`,
        `Show ${selectedConcept.name} in sagittal cross-section`,
        `Open related structures & study quiz`,
      ];
    }
    if (anatomySex === 'female') {
      return [
        'Show female reproductive organs & isolate uterus',
        'Focus mammary gland and lymphatic context',
        'Switch to front view with skeletal + urinary layers',
      ];
    }
    return [
      'Show only heart and arteries',
      'Switch to female model and show uterus',
      'Explain portal circulation & open 3D presentation',
    ];
  }, [anatomySex, selectedConcept]);

  const buildCandidateConcepts = useCallback(
    (promptText: string) => {
      if (!activeAtlas) return [];
      const hits: Array<{ id: string; name: string }> = [];
      const seen = new Set<string>();
      const pushConcept = (c: Concept | undefined | null) => {
        if (!c || seen.has(c.id)) return;
        seen.add(c.id);
        hits.push({ id: c.id, name: c.name });
      };

      const direct = resolveConceptForAiQuery(promptText, activeAtlas);
      if (direct) pushConcept(direct.concept);

      const words = promptText
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 4);

      for (const word of words) {
        for (const c of activeAtlas.concepts) {
          if (c.name.toLowerCase().includes(word)) {
            pushConcept(c);
            if (hits.length >= 14) break;
          }
        }
        for (const k of CURATED_KNOWLEDGE) {
          if (
            k.commonName.toLowerCase().includes(word) ||
            k.synonyms.some((s) => s.toLowerCase().includes(word))
          ) {
            pushConcept(activeAtlas.concepts.find((c) => c.id === k.conceptId));
          }
        }
        if (hits.length >= 14) break;
      }

      return hits.slice(0, 14);
    },
    [activeAtlas],
  );

  const sendPrompt = async (promptOverride?: string) => {
    const prompt = (promptOverride ?? input).trim();
    if (!prompt || sending) return;

    if (!promptOverride) setInput('');
    setTab('chat');
    setSending(true);

    const userTurnId = `u_${Date.now()}`;
    setTurns((prev) => [...prev, { id: userTurnId, role: 'user', text: prompt }]);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'Anatomy360',
      };
      if (bearerToken) headers.Authorization = `Bearer ${bearerToken}`;

      const history = turns
        .filter((t) => t.role === 'user' || t.role === 'assistant')
        .slice(-4)
        .map((t) => ({ role: t.role as 'user' | 'assistant', text: t.text }));

      const res = await fetch('/api/ai/navigate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt,
          history,
          context: {
            anatomySex,
            selectedConceptId: selectedConcept?.id ?? null,
            selectedConceptName: selectedConcept?.name ?? null,
            visibleSystems,
            studyTrack,
            candidateConcepts: buildCandidateConcepts(prompt),
          },
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        bearerToken?: string;
        code?: string;
        error?: string;
        payload?: AiNavigatorResponsePayload;
        usage?: { creditsCharged?: number };
        account?: PublicQuotaSummary;
      };

      if (data.bearerToken) setBearerToken(data.bearerToken);
      if (data.account) setQuota(data.account);

      if (!res.ok || !data.ok || !data.payload) {
        if (res.status === 402) {
          setBillingMessage(data.error ?? 'AI quota reached. Activate a plan below.');
        }
        setTurns((prev) => [
          ...prev,
          {
            id: `e_${Date.now()}`,
            role: 'error',
            text:
              data.error ??
              `Could not complete AI request (HTTP ${res.status}).`,
          },
        ]);
        return;
      }

      const appliedActions =
        data.payload.actions.length > 0
          ? await onExecuteActions(data.payload.actions)
          : [];

      setTurns((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          text: data.payload!.reply,
          studyTip: data.payload!.studyTip,
          appliedActions,
          followUps: data.payload!.followUpSuggestions,
          creditsCharged: data.usage?.creditsCharged,
        },
      ]);
    } catch {
      setTurns((prev) => [
        ...prev,
        {
          id: `e_${Date.now()}`,
          role: 'error',
          text: 'Network error reaching Alphatomy AI server. Please check connection and try again.',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleCheckoutOrPreviewActivate = async (planId: SubscriptionPlanId) => {
    if (planId === 'free_preview' || activatingPlanId) return;
    setActivatingPlanId(planId);
    setBillingMessage('');
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'Anatomy360',
      };
      if (bearerToken) headers.Authorization = `Bearer ${bearerToken}`;

      const checkoutRes = await fetch('/api/ai/checkout-intent', {
        method: 'POST',
        headers,
        body: JSON.stringify({ planId }),
      });
      const checkoutData = (await checkoutRes.json()) as {
        ok?: boolean;
        bearerToken?: string;
        session?: {
          checkoutSessionId: string;
          checkoutUrl: string | null;
          devPreviewEligible: boolean;
          integrationNote: string;
          creditsToProvision: number;
        };
        error?: string;
      };

      if (checkoutData.bearerToken) setBearerToken(checkoutData.bearerToken);

      if (!checkoutRes.ok || !checkoutData.ok || !checkoutData.session) {
        setBillingMessage(checkoutData.error ?? 'Could not initiate checkout session.');
        return;
      }

      if (checkoutData.session.devPreviewEligible) {
        const simRes = await fetch('/api/ai/dev/activate-preview-pack', {
          method: 'POST',
          headers: {
            ...headers,
            ...(checkoutData.bearerToken
              ? { Authorization: `Bearer ${checkoutData.bearerToken}` }
              : {}),
          },
          body: JSON.stringify({ planId }),
        });
        const simData = (await simRes.json()) as {
          ok?: boolean;
          bearerToken?: string;
          transactionId?: string;
          account?: PublicQuotaSummary;
          error?: string;
        };
        if (simData.bearerToken) setBearerToken(simData.bearerToken);
        if (simData.account) setQuota(simData.account);
        if (simRes.ok && simData.ok) {
          setBillingMessage(
            `Preview webhook verified (${simData.transactionId ?? 'provisioned'}). ${checkoutData.session.creditsToProvision.toLocaleString()} AI credits unlocked on the spot.`,
          );
          return;
        }
        setBillingMessage(simData.error ?? 'Preview webhook activation failed.');
        return;
      }

      setBillingMessage(checkoutData.session.integrationNote);
    } catch {
      setBillingMessage('Could not reach billing provisioning endpoint.');
    } finally {
      setActivatingPlanId(null);
    }
  };

  if (!open) return null;

  const pctRemaining =
    quota && quota.creditsPurchased > 0
      ? Math.max(0, Math.min(100, Math.round((quota.creditsRemaining / quota.creditsPurchased) * 100)))
      : 0;

  return (
    <aside
      className="ai-navigator-panel glass"
      aria-label="AI Anatomy Navigator"
      data-testid="ai-navigator-panel"
    >
      <div className="ai-nav-head">
        <div className="ai-nav-title-wrap">
          <span className="ai-nav-icon">
            <Sparkles size={15} />
          </span>
          <div>
            <strong>AI Study Navigator</strong>
            <span className="ai-nav-subtitle">
              {anatomySex === 'female' ? 'Female Model' : 'Male Model'}
              {selectedConcept ? ` · ${selectedConcept.name}` : ''}
            </span>
          </div>
        </div>
        <div className="ai-nav-head-actions">
          {canUndoAiView && (
            <Button
              variant="ghost"
              className="ai-mini-btn"
              onClick={onUndoAiView}
              title="Undo last AI 3D change"
              aria-label="Undo last AI 3D change"
            >
              <Undo2 size={14} />
            </Button>
          )}
          <Button
            variant="ghost"
            className="ai-mini-btn"
            onClick={onClose}
            aria-label="Close AI Navigator"
            data-testid="close-ai-navigator-btn"
          >
            <X size={16} />
          </Button>
        </div>
      </div>

      <div className="ai-nav-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'chat'}
          className={tab === 'chat' ? 'active' : ''}
          onClick={() => setTab('chat')}
          data-testid="ai-tab-chat"
        >
          AI Guide
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'quota'}
          className={tab === 'quota' ? 'active' : ''}
          onClick={() => setTab('quota')}
          data-testid="ai-tab-quota"
        >
          <span>Quota &amp; Plans</span>
          {quota && (
            <span className="ai-quota-badge" data-testid="ai-quota-badge">
              {quota.estimatedQueriesRemaining} left
            </span>
          )}
        </button>
      </div>

      {quota && (
        <div className="ai-quota-strip">
          <div className="ai-quota-strip-row">
            <span>{quota.planName}</span>
            <strong>{quota.creditsRemaining.toLocaleString()} credits</strong>
          </div>
          <div className="ai-quota-bar" aria-hidden="true">
            <i style={{ width: `${pctRemaining}%` }} />
          </div>
        </div>
      )}

      {tab === 'chat' ? (
        <div className="ai-chat-body">
          {!keyConfigured && (
            <div className="ai-notice-banner" role="status" data-testid="ai-key-notice">
              <ShieldCheck size={15} />
              <span>
                Server <code>GEMINI_API_KEY</code> is not set yet. Configure it in{' '}
                <strong>Settings &gt; Secrets</strong> to run live Gemini responses; quota metering
                and on-the-spot billing controls below are active.
              </span>
            </div>
          )}

          <div className="ai-messages-scroll">
            {turns.length === 0 ? (
              <div className="ai-empty-state">
                <p>
                  Ask anything or command the 3D scene directly: isolate organs, switch Male/Female
                  anatomy, slice cross-sections, or jump to quizzes and clinical walkthroughs.
                </p>
                <div className="ai-starter-list">
                  {starterPrompts.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className="ai-starter-btn"
                      onClick={() => void sendPrompt(p)}
                      disabled={sending}
                    >
                      <Zap size={13} />
                      <span>{p}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              turns.map((turn) => (
                <div key={turn.id} className={`ai-msg ai-msg-${turn.role}`}>
                  <p className="ai-msg-text">{turn.text}</p>
                  {turn.appliedActions && turn.appliedActions.length > 0 && (
                    <div className="ai-action-traces">
                      {turn.appliedActions.map((act, idx) => (
                        <span key={`${turn.id}-act-${idx}`} className="ai-action-chip">
                          <CheckCircle2 size={12} />
                          {act}
                        </span>
                      ))}
                    </div>
                  )}
                  {turn.studyTip && (
                    <p className="ai-study-tip">
                      <strong>Study pearl:</strong> {turn.studyTip}
                    </p>
                  )}
                  {turn.role === 'error' && quota?.status !== 'active_subscription' && (
                    <button
                      type="button"
                      className="ai-inline-upgrade-btn"
                      onClick={() => setTab('quota')}
                    >
                      Open Quota & On-The-Spot Plan
                    </button>
                  )}
                  {turn.followUps && turn.followUps.length > 0 && (
                    <div className="ai-followups">
                      {turn.followUps.map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => void sendPrompt(f)}
                          disabled={sending}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  )}
                  {typeof turn.creditsCharged === 'number' && (
                    <span className="ai-msg-meter">
                      Metered usage: {turn.creditsCharged.toLocaleString()} credits
                    </span>
                  )}
                </div>
              ))
            )}
            {sending && (
              <div className="ai-msg ai-msg-loading" role="status">
                Thinking & preparing 3D actions…
              </div>
            )}
            <div ref={scrollEndRef} />
          </div>

          <form
            className="ai-input-row"
            onSubmit={(e) => {
              e.preventDefault();
              void sendPrompt();
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask or command (e.g. Isolate uterus, Cut sagittal…)"
              aria-label="Ask AI Anatomy Navigator"
              data-testid="ai-navigator-input"
              maxLength={600}
              disabled={sending}
            />
            <Button
              type="submit"
              data-testid="ai-navigator-send"
              disabled={sending || !input.trim()}
              aria-label="Send prompt"
            >
              <Send size={15} />
            </Button>
          </form>
        </div>
      ) : (
        <div className="ai-quota-body" data-testid="ai-quota-panel">
          <div className="ai-arch-note">
            <CreditCard size={15} />
            <div>
              <strong>Metered AI Credit Add-Ons (Separate from Platform Subscriptions)</strong>
              <p>
                AI credits fund metered Gemini 3D assistant queries only and are provisioned solely
                after verified server webhook confirmation (<code>/api/billing/webhook</code>{' '}
                or dev preview webhook). Refunded transactions revoke granted credits. See{' '}
                <a href="#/pricing" className="underline">
                  Plans &amp; Pricing
                </a>
                .
              </p>
            </div>
          </div>

          {billingMessage && (
            <div className="ai-billing-feedback" role="status" data-testid="ai-billing-feedback">
              {billingMessage}
            </div>
          )}

          {loadingEntitlement && !quota ? (
            <p className="ai-loading-note">Loading server entitlement status…</p>
          ) : (
            <div className="ai-plan-list">
              {plans.map((plan) => {
                const isCurrent = quota?.planId === plan.id;
                const isPaid = plan.id !== 'free_preview';
                return (
                  <div
                    key={plan.id}
                    className={`ai-plan-card ${isCurrent ? 'is-current' : ''}`}
                    data-testid={`ai-plan-${plan.id}`}
                  >
                    <div className="ai-plan-head">
                      <strong>{plan.name}</strong>
                      <span className="ai-plan-price">{plan.priceLabel}</span>
                    </div>
                    <p className="ai-plan-desc">{plan.summary}</p>
                    <div className="ai-plan-meta">
                      <span>{plan.creditsIncluded.toLocaleString()} credits</span>
                      <span>~{plan.estimatedQueries} queries</span>
                    </div>
                    {isPaid ? (
                      <Button
                        type="button"
                        className="ai-plan-action-btn"
                        disabled={activatingPlanId === plan.id}
                        data-testid={`activate-plan-${plan.id}`}
                        onClick={() => void handleCheckoutOrPreviewActivate(plan.id)}
                      >
                        {activatingPlanId === plan.id
                          ? 'Provisioning quota…'
                          : devPreviewEligible
                            ? 'Test Webhook Purchase & Unlock'
                            : 'Continue to Checkout'}
                      </Button>
                    ) : (
                      <span className="ai-plan-status-tag">
                        {quota?.requireSubscription ? 'Disabled (Strict Paid Mode)' : 'Active Starter Cap'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {quota && quota.transactions.length > 0 && (
            <div className="ai-tx-history" data-testid="ai-tx-history">
              <h4>Provisioned Quota Ledger</h4>
              {quota.transactions.map((tx) => (
                <div key={tx.id} className="ai-tx-row">
                  <span>
                    {tx.planId} · <code>{tx.id}</code>
                  </span>
                  <strong>+{tx.creditsGranted.toLocaleString()} cr</strong>
                </div>
              ))}
            </div>
          )}

          <div className="ai-quota-foot">
            <button
              type="button"
              className="ai-refresh-btn"
              onClick={() => void fetchEntitlement()}
              disabled={loadingEntitlement}
            >
              <RotateCcw size={13} />
              Refresh server quota
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
