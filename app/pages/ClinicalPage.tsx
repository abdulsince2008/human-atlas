import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, Stethoscope, XCircle } from 'lucide-react';
import type { CanonicalSystemId } from '../anatomy-systems';
import {
  CLINICAL_CASE_DISCLAIMER,
  CLINICAL_CASES,
  type ClinicalCategory,
} from '../data/clinical-data';

interface Props {
  onInspectConcept: (conceptId: string) => void;
  onOpenLearnSystem: (systemId: CanonicalSystemId) => void;
}

const CATEGORIES: { id: ClinicalCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Correlations' },
  { id: 'nerve-injury', label: 'Nerve Relationships' },
  { id: 'joint-ligament', label: 'Joints & Tendons' },
  { id: 'vascular-supply', label: 'Blood Supply' },
  { id: 'respiratory', label: 'Respiratory' },
  { id: 'regional-anatomy', label: 'Regional Cranial' },
];

export default function ClinicalPage({ onInspectConcept, onOpenLearnSystem }: Props) {
  const [cat, setCat] = useState<ClinicalCategory | 'all'>('all');
  const [selectedCaseId, setSelectedCaseId] = useState(CLINICAL_CASES[0].id);
  const [answersByCase, setAnswersByCase] = useState<Record<string, number>>({});

  const visibleCases = useMemo(
    () => (cat === 'all' ? CLINICAL_CASES : CLINICAL_CASES.filter((c) => c.category === cat)),
    [cat],
  );

  const active = useMemo(
    () => visibleCases.find((c) => c.id === selectedCaseId) ?? visibleCases[0] ?? CLINICAL_CASES[0],
    [visibleCases, selectedCaseId],
  );

  const chosenAnswer = answersByCase[active.id];

  return (
    <div className="a360-page">
      <header className="a360-page-header">
        <p className="a360-kicker">Applied Regional Anatomy</p>
        <h1>Clinical Correlations & Educational Scenarios</h1>
        <p className="a360-lead">
          Connect 3D anatomical proximity, nerve courses, joint leverage, and vascular pathways to
          classic curriculum scenarios.
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
          {visibleCases.map((cs) => (
            <button
              key={cs.id}
              type="button"
              className={`a360-system-nav-item ${active.id === cs.id ? 'active' : ''}`}
              onClick={() => setSelectedCaseId(cs.id)}
            >
              <Stethoscope size={15} />
              <span className="a360-system-nav-label">{cs.title}</span>
            </button>
          ))}
        </aside>

        <section className="a360-system-detail" aria-live="polite">
          <p className="a360-kicker">
            {active.categoryLabel} · {active.level} · Curriculum Principle
          </p>
          <h2>{active.title}</h2>

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
            <button
              type="button"
              className="a360-btn-primary"
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
          </div>

          <p className="a360-provenance-line">Source Reference: {active.sourceReference}</p>
        </section>
      </div>
    </div>
  );
}
