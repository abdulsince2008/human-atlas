import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  RotateCcw,
  SlidersHorizontal,
  Target,
  XCircle,
} from 'lucide-react';
import { CANONICAL_SYSTEMS, type CanonicalSystemId } from '../anatomy-systems';
import type {
  ExamAttemptSummary,
  PracticalQuestion,
  QuestionSubmission,
} from '../practical-lab/types';
import { useStudy } from './StudyContext';
import type { StudyContextInput } from '../study-context-engine';

interface Props {
  summary: ExamAttemptSummary;
  questions: PracticalQuestion[];
  submissions: Record<string, QuestionSubmission>;
  onRetake: () => void;
  onPracticeWeak: (conceptIds: string[]) => void;
  onNewSetup: () => void;
  onInspectConcept: (conceptId: string) => void;
  onOpenLearnSystem: (systemId: CanonicalSystemId) => void;
  onOpenStudyContext?: (input: StudyContextInput) => void;
}

export default function PracticalLabResults({
  summary,
  questions,
  submissions,
  onRetake,
  onPracticeWeak,
  onNewSetup,
  onInspectConcept,
  onOpenLearnSystem,
  onOpenStudyContext,
}: Props) {
  const { isBookmarked, toggleBookmark } = useStudy();
  const missedQuestions = useMemo(
    () => questions.filter((q) => !submissions[q.id]?.isCorrect),
    [questions, submissions],
  );
  const [reviewFilter, setReviewFilter] = useState<'missed' | 'all'>(
    missedQuestions.length > 0 ? 'missed' : 'all',
  );

  const visibleReview = reviewFilter === 'missed' ? missedQuestions : questions;

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const scopeLabel = summary.isWeakPractice
    ? 'Targeted Weak Structures Drill'
    : summary.scope === 'all'
      ? 'All 12 Anatomical Systems'
      : CANONICAL_SYSTEMS.find((s) => s.id === summary.scope)?.name.en ?? summary.scope;

  return (
    <div className="a360-plab-results">
      {/* Performance Summary Banner */}
      <section className="a360-plab-card a360-plab-score-hero">
        <div className="a360-plab-score-head">
          <div>
            <p className="a360-kicker">
              {summary.timedOut ? 'Timer Expired · Exam Auto-Submitted' : 'Examination Complete'} ·{' '}
              {summary.preset === 'strict' ? 'Strict Exam' : 'Guided Practice'}
            </p>
            <h2>{scopeLabel}</h2>
          </div>

          <div className="a360-plab-result-actions">
            {missedQuestions.length > 0 && (
              <button
                type="button"
                className="a360-btn-primary"
                onClick={() =>
                  onPracticeWeak(
                    Array.from(new Set(missedQuestions.map((q) => q.targetConceptId))),
                  )
                }
              >
                <Target size={15} />
                Practice {new Set(missedQuestions.map((q) => q.targetConceptId)).size}{' '}
                Missed Structures
              </button>
            )}
            <button type="button" className="a360-btn-secondary" onClick={onRetake}>
              <RotateCcw size={15} />
              Retake Exam
            </button>
            <button type="button" className="a360-btn-secondary" onClick={onNewSetup}>
              <SlidersHorizontal size={15} />
              New Configuration
            </button>
          </div>
        </div>

        <div className="a360-metrics-strip" aria-label="Examination performance metrics">
          <div className="a360-metric">
            <strong>
              {summary.score} / {summary.totalQuestions}
            </strong>
            <span>Correct Answers</span>
          </div>
          <div className="a360-metric">
            <strong>{summary.accuracyPct}%</strong>
            <span>Accuracy ({summary.attempted} attempted)</span>
          </div>
          <div className="a360-metric">
            <strong>{missedQuestions.length}</strong>
            <span>Incorrect / Unanswered</span>
          </div>
          <div className="a360-metric">
            <strong>
              <Clock size={18} style={{ display: 'inline', marginRight: 6 }} />
              {formatDuration(summary.durationSec)}
            </strong>
            <span>Elapsed Time</span>
          </div>
        </div>
      </section>

      {/* Per-System Breakdown */}
      {summary.perSystem.length > 0 && (
        <section className="a360-plab-card">
          <div className="a360-plab-card-head">
            <h2>Performance by Anatomical System</h2>
            <span className="a360-muted">Breakdown across stations in this examination</span>
          </div>

          <div className="a360-plab-breakdown-grid">
            {summary.perSystem.map((sys) => (
              <div key={sys.systemId} className="a360-plab-sys-bar-card">
                <div className="a360-plab-sys-bar-top">
                  <strong>{sys.systemName}</strong>
                  <span className="a360-tabular-count">
                    {sys.correct}/{sys.total} ({sys.accuracyPct}%)
                  </span>
                </div>
                <div className="a360-plab-bar-track" aria-hidden="true">
                  <div
                    className="a360-plab-bar-fill"
                    style={{ width: `${sys.accuracyPct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Incorrect Answers & Question-by-Question Review */}
      <section className="a360-plab-card">
        <div className="a360-plab-review-head">
          <div>
            <h2>
              {reviewFilter === 'missed'
                ? `Review Missed Structures (${missedQuestions.length})`
                : `Complete Question Review (${questions.length})`}
            </h2>
            <p className="a360-muted">
              Inspect any missed structure directly in the full 3D Explorer or jump to its system
              lesson.
            </p>
          </div>

          <div className="a360-filter-row" role="tablist" aria-label="Review filter">
            <button
              type="button"
              role="tab"
              aria-selected={reviewFilter === 'missed'}
              className={`a360-filter-btn ${reviewFilter === 'missed' ? 'active' : ''}`}
              onClick={() => setReviewFilter('missed')}
            >
              Missed Only ({missedQuestions.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={reviewFilter === 'all'}
              className={`a360-filter-btn ${reviewFilter === 'all' ? 'active' : ''}`}
              onClick={() => setReviewFilter('all')}
            >
              All Questions ({questions.length})
            </button>
          </div>
        </div>

        {visibleReview.length === 0 ? (
          <div className="a360-empty-box">
            <p>
              Perfect score — you answered every structure in this examination correctly. Switch to{' '}
              <strong>All Questions</strong> to review explanations.
            </p>
          </div>
        ) : (
          <div className="a360-plab-review-list">
            {visibleReview.map((q) => {
              const sub = submissions[q.id];
              const ok = Boolean(sub?.isCorrect);
              const modeLabel =
                q.mode === 'identify'
                  ? 'Identify the Structure'
                  : q.mode === 'locate'
                    ? 'Locate in 3D'
                    : 'Anatomical Knowledge';

              let studentResponseText = 'Not answered';
              if (sub && sub.status === 'submitted') {
                if (q.mode === 'locate') {
                  studentResponseText = sub.clickedName ?? 'No mesh selected';
                } else if (
                  typeof sub.selectedOptionIndex === 'number' &&
                  q.options?.[sub.selectedOptionIndex]
                ) {
                  studentResponseText = q.options[sub.selectedOptionIndex];
                }
              }

              const verifiedAnswerText =
                q.mode === 'knowledge' && q.options && typeof q.correctIndex === 'number'
                  ? q.options[q.correctIndex]
                  : q.targetName;

              return (
                <article
                  key={q.id}
                  className={`a360-plab-review-item ${ok ? 'is-correct' : 'is-missed'}`}
                >
                  <div className="a360-plab-review-top">
                    <span className="a360-plab-review-status">
                      {ok ? (
                        <CheckCircle2 size={16} className="a360-icon-ok" />
                      ) : (
                        <XCircle size={16} className="a360-icon-err" />
                      )}
                      <strong>
                        Q{q.index + 1} · {modeLabel}
                      </strong>
                      <span className="a360-muted">· {q.explanation.systemName}</span>
                    </span>
                    <span className="a360-level-tag">{q.difficulty}</span>
                  </div>

                  <h3>{q.prompt}</h3>

                  <div className="a360-plab-review-answers">
                    <div>
                      <span className="a360-stat-label">Your Response</span>
                      <p className={ok ? 'a360-text-ok' : 'a360-text-err'}>
                        {studentResponseText}
                      </p>
                    </div>
                    <div>
                      <span className="a360-stat-label">Verified Answer</span>
                      <p>
                        <strong>{verifiedAnswerText}</strong>
                        {q.mode === 'knowledge' && ` (${q.targetName})`}
                      </p>
                    </div>
                  </div>

                  {sub?.missReason && !ok && (
                    <p className="a360-plab-miss-reason">{sub.missReason}</p>
                  )}

                  <div className="a360-plab-review-exp">
                    <p>
                      <strong>Location:</strong> {q.explanation.location}
                    </p>
                    <p>
                      <strong>Function:</strong> {q.explanation.mainFunction}
                    </p>
                  </div>

                  <div className="a360-plab-review-links">
                    <button
                      type="button"
                      className="a360-inspect-link"
                      onClick={() => onInspectConcept(q.targetConceptId)}
                    >
                      <ExternalLink size={13} />
                      Inspect {q.targetName} in 3D Explorer
                    </button>
                    <button
                      type="button"
                      className="a360-mini-btn"
                      onClick={() => onOpenLearnSystem(q.canonicalSystem)}
                    >
                      <BookOpen size={13} />
                      Study {q.explanation.systemName}
                      <ArrowRight size={12} />
                    </button>
                    <button
                      type="button"
                      className={`a360-mini-btn ${isBookmarked('structure', q.targetConceptId) ? 'is-saved' : ''}`}
                      onClick={() =>
                        toggleBookmark({
                          kind: 'structure',
                          targetId: q.targetConceptId,
                          title: q.targetName,
                          subtitle: q.explanation.systemName,
                          canonicalSystem: q.canonicalSystem,
                        })
                      }
                    >
                      <Bookmark size={13} />
                      {isBookmarked('structure', q.targetConceptId)
                        ? 'Bookmarked'
                        : 'Save to Bookmarks'}
                    </button>
                    {onOpenStudyContext && (
                      <button
                        type="button"
                        className="a360-mini-btn"
                        onClick={() =>
                          onOpenStudyContext({
                            conceptId: q.targetConceptId,
                            systemId: q.canonicalSystem,
                            sourceModule: 'practical_lab',
                          })
                        }
                      >
                        Study Workspace
                        <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
