import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Film,
  Info,
  Stethoscope,
  XCircle,
} from 'lucide-react';
import type { CanonicalSystemId } from '../anatomy-systems';
import {
  CLINICAL_CASE_DISCLAIMER,
  CLINICAL_CASES,
  type ClinicalCategory,
} from '../data/clinical-data';
import { getClinicalCaseExplainerLink } from '../presentation/builtin-presentations';
import { resolveClinicalCaseTarget } from '../utils/deep-link-resolver';
import type { StudyContextInput } from '../study-context-engine';

interface Props {
  initialCaseId?: string | null;
  initialSystemId?: CanonicalSystemId | null;
  onInspectConcept: (conceptId: string) => void;
  onOpenLearnSystem: (systemId: CanonicalSystemId) => void;
  onOpenPresentation: (presentationId: string) => void;
  onOpenStudyContext?: (input: StudyContextInput) => void;
}

const CATEGORIES: { id: ClinicalCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Correlations' },
  { id: 'cardiovascular', label: 'Cardiovascular' },
  { id: 'nerve-injury', label: 'Nerve Relationships' },
  { id: 'vascular-supply', label: 'Blood Supply' },
  { id: 'regional-anatomy', label: 'Regional & Cranial' },
  { id: 'respiratory', label: 'Respiratory' },
  { id: 'joint-ligament', label: 'Joints & Tendons' },
];

export default function ClinicalPage({
  initialCaseId,
  initialSystemId,
  onInspectConcept,
  onOpenLearnSystem,
  onOpenPresentation,
  onOpenStudyContext,
}: Props) {
  const initialCase = resolveClinicalCaseTarget(initialCaseId, initialSystemId);
  const [cat, setCat] = useState<ClinicalCategory | 'all'>('all');
  const [selectedCaseId, setSelectedCaseId] = useState(initialCase.id);
  const [answersByCase, setAnswersByCase] = useState<Record<string, number>>({});

  useEffect(() => {
    if (initialCaseId || initialSystemId) {
      const target = resolveClinicalCaseTarget(initialCaseId, initialSystemId);
      setCat('all');
      setSelectedCaseId(target.id);
    }
  }, [initialCaseId, initialSystemId]);

  const visibleCases = useMemo(
    () => (cat === 'all' ? CLINICAL_CASES : CLINICAL_CASES.filter((c) => c.category === cat)),
    [cat],
  );

  const active = useMemo(
    () => visibleCases.find((c) => c.id === selectedCaseId) ?? visibleCases[0] ?? CLINICAL_CASES[0],
    [visibleCases, selectedCaseId],
  );

  const activeExplainer = useMemo(
    () => getClinicalCaseExplainerLink(active.id),
    [active.id],
  );

  const chosenAnswer = answersByCase[active.id];

  return (
    <div className="a360-page">
      <header className="a360-page-header">
        <p className="a360-kicker">Applied Regional Anatomy &amp; Clinical Mechanisms</p>
        <h1>Clinical Correlations &amp; Guided 3D Explanations</h1>
        <p className="a360-lead">
          Connect 3D anatomical proximity, vascular pathways, and neuroanatomy to classic curriculum
          mechanisms. Launch synchronized 3D presentations where full anatomical coverage is verified.
        </p>
      </header>

      <div className="a360-coverage-box" role="note">
        <strong>Educational Notice:</strong> {CLINICAL_CASE_DISCLAIMER}
      </div>

      <div className="a360-filter-row" aria-label="Filter clinical categories">
        {CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`a360-filter-btn ${cat === item.id ? 'active' : ''}`}
            onClick={() => setCat(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="a360-split-layout">
        <aside className="a360-system-nav" aria-label="Case study scenarios">
          {visibleCases.map((cs) => {
            const link = getClinicalCaseExplainerLink(cs.id);
            const has3D = link.status === 'guided_3d_available';
            return (
              <button
                key={cs.id}
                type="button"
                className={`a360-system-nav-item ${active.id === cs.id ? 'active' : ''}`}
                onClick={() => setSelectedCaseId(cs.id)}
              >
                <Stethoscope size={15} className="shrink-0" />
                <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
                  <span className="a360-system-nav-label whitespace-normal leading-snug">{cs.title}</span>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide ${
                      has3D
                        ? 'text-teal-700'
                        : link.status === 'requires_more_coverage'
                          ? 'text-amber-700'
                          : 'text-slate-500'
                    }`}
                  >
                    {has3D
                      ? '● Guided 3D Explanation'
                      : link.status === 'requires_more_coverage'
                        ? '○ Partial 3D Coverage'
                        : '○ Case Study Only'}
                  </span>
                </span>
              </button>
            );
          })}
        </aside>

        <section className="a360-system-detail" aria-live="polite">
          <p className="a360-kicker">
            {active.categoryLabel} · {active.level} · Curriculum Principle
          </p>
          <h2>{active.title}</h2>

          {/* Guided 3D Explanation Callout Banner */}
          {activeExplainer.status === 'guided_3d_available' &&
          activeExplainer.presentationId ? (
            <div className="my-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-200 bg-teal-50/80 p-4">
              <div className="max-w-xl">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-teal-800">
                  <Film size={14} />
                  <span>{activeExplainer.label}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-teal-950">
                  {activeExplainer.detail}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onOpenPresentation(activeExplainer.presentationId!)
                }
                className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-teal-800"
              >
                <Film size={15} />
                Watch Guided 3D Explanation
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="my-4 flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700">
              <Info size={15} className="mt-0.5 shrink-0 text-slate-500" />
              <div>
                <strong className="font-semibold text-slate-900">
                  {activeExplainer.label}
                </strong>
                <p className="mt-0.5 leading-relaxed text-slate-600">
                  {activeExplainer.detail}
                </p>
              </div>
            </div>
          )}

          <div className="a360-subblock">
            <h3>Learning Objectives</h3>
            <ul className="a360-fact-list">
              {active.learningObjectives.map((obj) => (
                <li key={obj}>{obj}</li>
              ))}
            </ul>
          </div>

          <div className="a360-subblock">
            <h3>Educational Scenario</h3>
            <p className="a360-body-copy">{active.educationalScenario}</p>
          </div>

          <div className="a360-subblock">
            <h3>Relevant 3D Structures</h3>
            <div className="a360-chip-grid">
              {active.relevantConcepts.map((rc) => (
                <button
                  key={rc.conceptId}
                  type="button"
                  className="a360-structure-btn"
                  onClick={() => onInspectConcept(rc.conceptId)}
                >
                  <span>{rc.label}</span>
                  <span className="a360-tabular-count">Inspect 3D</span>
                </button>
              ))}
            </div>
          </div>

          <div className="a360-subblock">
            <h3>Anatomical Explanation</h3>
            <p className="a360-body-copy">{active.anatomicalExplanation}</p>
          </div>

          <div className="a360-quiz-card">
            <p className="a360-kicker">Anatomical Concept Check</p>
            <h3 className="a360-quiz-prompt">{active.checkQuestion.prompt}</h3>
            <div className="a360-options-list">
              {active.checkQuestion.options.map((opt, idx) => {
                const revealed = chosenAnswer !== undefined;
                const isRight = idx === active.checkQuestion.correctIndex;
                const isChosen = chosenAnswer === idx;
                const cls = revealed ? (isRight ? 'correct' : isChosen ? 'incorrect' : '') : '';
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={revealed}
                    className={`a360-option-btn ${cls}`}
                    onClick={() => setAnswersByCase((prev) => ({ ...prev, [active.id]: idx }))}
                  >
                    <span className="a360-option-letter">{String.fromCharCode(65 + idx)}</span>
                    <span className="a360-option-text">{opt}</span>
                    {revealed && isRight && <CheckCircle2 size={16} className="a360-icon-ok" />}
                    {revealed && isChosen && !isRight && (
                      <XCircle size={16} className="a360-icon-err" />
                    )}
                  </button>
                );
              })}
            </div>
            {chosenAnswer !== undefined && (
              <div className="a360-quiz-feedback">
                <p>{active.checkQuestion.rationale}</p>
              </div>
            )}
          </div>

          <div className="a360-ref-footer-links">
            {activeExplainer.status === 'guided_3d_available' &&
              activeExplainer.presentationId && (
                <button
                  type="button"
                  className="a360-btn-primary"
                  onClick={() =>
                    onOpenPresentation(activeExplainer.presentationId!)
                  }
                >
                  <Film size={15} /> Watch Guided 3D Explanation
                </button>
              )}
            <button
              type="button"
              className={
                activeExplainer.status === 'guided_3d_available'
                  ? 'a360-btn-secondary'
                  : 'a360-btn-primary'
              }
              onClick={() => onInspectConcept(active.relevantConcepts[0].conceptId)}
            >
              Inspect Primary Structure in 3D <ArrowRight size={15} />
            </button>
            <button
              type="button"
              className="a360-btn-secondary"
              onClick={() => onOpenLearnSystem(active.systemId)}
            >
              <BookOpen size={14} /> Open System Lesson
            </button>
            {onOpenStudyContext && (
              <button
                type="button"
                className="a360-btn-secondary"
                onClick={() =>
                  onOpenStudyContext({
                    clinicalCaseId: active.id,
                    conceptId: active.relevantConcepts[0]?.conceptId,
                    systemId: active.systemId,
                    presentationId: activeExplainer.presentationId ?? undefined,
                    sourceModule: 'clinical',
                  })
                }
              >
                Open in Connected Study Workspace <ArrowRight size={14} />
              </button>
            )}
          </div>

          <p className="a360-provenance-line">Source Reference: {active.sourceReference}</p>
        </section>
      </div>
    </div>
  );
}
