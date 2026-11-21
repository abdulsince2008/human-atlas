import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bookmark, CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { CANONICAL_SYSTEMS } from '../anatomy-systems';
import { useStudy } from '../components/StudyContext';
import { QUIZ_DIFFICULTY_LEVELS, QUIZ_QUESTIONS } from '../quiz-data';

interface Props {
  onInspectConcept: (conceptId: string) => void;
}

interface SavedProgress {
  answeredIds: string[];
  correctIds: string[];
}

const STORAGE_KEY = 'anatomy360_quiz_progress_v1';

function loadProgress(): SavedProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { answeredIds: [], correctIds: [] };
    const parsed = JSON.parse(raw) as Partial<SavedProgress>;
    return {
      answeredIds: Array.isArray(parsed.answeredIds) ? parsed.answeredIds : [],
      correctIds: Array.isArray(parsed.correctIds) ? parsed.correctIds : [],
    };
  } catch {
    return { answeredIds: [], correctIds: [] };
  }
}

export default function QuizPage({ onInspectConcept }: Props) {
  const { isBookmarked, recordQuizResult, toggleBookmark } = useStudy();
  const [systemFilter, setSystemFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [unsolvedOnly, setUnsolvedOnly] = useState(false);
  const [index, setIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [progress, setProgress] = useState<SavedProgress>(() => loadProgress());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignore storage quota / private mode restrictions cleanly.
    }
  }, [progress]);

  const pool = useMemo(
    () =>
      QUIZ_QUESTIONS.filter(
        (q) =>
          (systemFilter === 'all' || q.systemId === systemFilter) &&
          (difficultyFilter === 'all' || q.difficulty === difficultyFilter) &&
          (!unsolvedOnly || !progress.correctIds.includes(q.id)),
      ),
    [systemFilter, difficultyFilter, unsolvedOnly, progress.correctIds],
  );

  const safeIndex = pool.length > 0 ? Math.min(index, pool.length - 1) : 0;
  const current = pool[safeIndex];
  const systemInfo = current ? CANONICAL_SYSTEMS.find((s) => s.id === current.systemId) : undefined;

  const submitAnswer = (optIndex: number) => {
    if (!current || selectedOption !== null) return;
    setSelectedOption(optIndex);
    const isCorrect = optIndex === current.correctIndex;
    recordQuizResult(current.id, isCorrect, current.relatedStructureName);
    setProgress((prev) => {
      const answeredIds = prev.answeredIds.includes(current.id)
        ? prev.answeredIds
        : [...prev.answeredIds, current.id];
      const correctIds = isCorrect
        ? prev.correctIds.includes(current.id)
          ? prev.correctIds
          : [...prev.correctIds, current.id]
        : prev.correctIds.filter((id) => id !== current.id);
      return { answeredIds, correctIds };
    });
  };

  const resetProgress = () => {
    const empty = { answeredIds: [], correctIds: [] };
    setProgress(empty);
    setSelectedOption(null);
    setIndex(0);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const systemCoverageSummary = useMemo(
    () =>
      CANONICAL_SYSTEMS.map((sys) => {
        const qs = QUIZ_QUESTIONS.filter((q) => q.systemId === sys.id);
        const solved = qs.filter((q) => progress.correctIds.includes(q.id)).length;
        return { sys, total: qs.length, solved };
      }),
    [progress.correctIds],
  );

  return (
    <div className="a360-page a360-narrow">
      <header className="a360-page-header">
        <p className="a360-kicker">Active Recall &amp; Leveled Exam Revision</p>
        <h1>Anatomy Quizzes (All 12 Systems)</h1>
        <p className="a360-lead">
          Curriculum-referenced multiple-choice questions spanning Grades 9–10, FSc / MDCAT,
          MBBS / Nursing, and BS / MPhil / PhD research reasoning. Every explanation links straight
          to the tested 3D structure.
        </p>
      </header>

      <div className="a360-quiz-stats">
        <div>
          <span className="a360-stat-label">Browser Revision Progress</span>
          <strong className="a360-tabular-count">
            {progress.correctIds.length} / {QUIZ_QUESTIONS.length} answered correctly ·{' '}
            {progress.answeredIds.length} attempted
          </strong>
          <span className="a360-stat-note">
            Saved locally in this browser only · Content is educational reference (not faculty-certified).
          </span>
        </div>
        <button type="button" className="a360-btn-secondary" onClick={resetProgress}>
          <RotateCcw size={14} />
          Reset Progress
        </button>
      </div>

      {/* 12-System Quick Coverage & Mastery Strip */}
      <div className="mb-4 flex flex-wrap gap-1.5" aria-label="System quiz coverage summary">
        <button
          type="button"
          className={`a360-filter-btn ${systemFilter === 'all' ? 'active' : ''}`}
          onClick={() => {
            setSystemFilter('all');
            setIndex(0);
            setSelectedOption(null);
          }}
        >
          All 12 Systems ({progress.correctIds.length}/{QUIZ_QUESTIONS.length})
        </button>
        {systemCoverageSummary.map(({ sys, total, solved }) => (
          <button
            key={sys.id}
            type="button"
            className={`a360-filter-btn ${systemFilter === sys.id ? 'active' : ''}`}
            onClick={() => {
              setSystemFilter(sys.id);
              setIndex(0);
              setSelectedOption(null);
            }}
          >
            {sys.name.en.replace(' System', '')} ({solved}/{total})
          </button>
        ))}
      </div>

      <div className="a360-quiz-filters">
        <label className="a360-select-field">
          <span>System</span>
          <select
            value={systemFilter}
            onChange={(e) => {
              setSystemFilter(e.target.value);
              setIndex(0);
              setSelectedOption(null);
            }}
          >
            <option value="all">All 12 Systems ({QUIZ_QUESTIONS.length})</option>
            {CANONICAL_SYSTEMS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name.en}
              </option>
            ))}
          </select>
        </label>

        <label className="a360-select-field">
          <span>Academic Level</span>
          <select
            value={difficultyFilter}
            onChange={(e) => {
              setDifficultyFilter(e.target.value);
              setIndex(0);
              setSelectedOption(null);
            }}
          >
            <option value="all">All 4 Academic Tiers ({QUIZ_QUESTIONS.length})</option>
            {QUIZ_DIFFICULTY_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </label>

        <div className="a360-filter-toggle-wrap">
          <button
            type="button"
            className={`a360-filter-btn ${unsolvedOnly ? 'active' : ''}`}
            onClick={() => {
              setUnsolvedOnly((v) => !v);
              setIndex(0);
              setSelectedOption(null);
            }}
          >
            Unsolved Only
          </button>
        </div>
      </div>

      {!current ? (
        <div className="a360-empty-box">
          <p>
            {unsolvedOnly
              ? 'All questions matching your selected system and academic tier have been answered correctly.'
              : 'No questions match the selected system and academic level filter.'}
          </p>
          {unsolvedOnly && (
            <button
              type="button"
              className="a360-btn-secondary mt-2"
              onClick={() => setUnsolvedOnly(false)}
            >
              Show All Matching Questions
            </button>
          )}
        </div>
      ) : (
        <article className="a360-quiz-card">
          <div className="a360-quiz-meta">
            <span>
              Question {safeIndex + 1} of {pool.length}
            </span>
            <span className="a360-ref-actions">
              <span>
                {systemInfo?.name.en} · {current.difficulty}
              </span>
              <button
                type="button"
                className={`a360-btn-secondary ${isBookmarked('quiz', current.id) ? 'is-saved' : ''}`}
                onClick={() =>
                  toggleBookmark({
                    kind: 'quiz',
                    targetId: current.id,
                    title: current.relatedStructureName,
                    subtitle: `${systemInfo?.name.en ?? current.systemId} · ${current.difficulty}`,
                    canonicalSystem: current.systemId,
                  })
                }
              >
                <Bookmark size={13} />
                {isBookmarked('quiz', current.id) ? 'Saved' : 'Save'}
              </button>
            </span>
          </div>

          <h2 className="a360-quiz-prompt">{current.prompt}</h2>

          <div className="a360-options-list">
            {current.options.map((opt, i) => {
              const revealed = selectedOption !== null;
              const isChosen = selectedOption === i;
              const isCorrect = i === current.correctIndex;
              let stateClass = '';
              if (revealed) {
                if (isCorrect) stateClass = 'correct';
                else if (isChosen) stateClass = 'incorrect';
              }
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={revealed}
                  className={`a360-option-btn ${stateClass}`}
                  onClick={() => submitAnswer(i)}
                >
                  <span className="a360-option-letter">{String.fromCharCode(65 + i)}</span>
                  <span className="a360-option-text">{opt}</span>
                  {revealed && isCorrect && <CheckCircle2 size={18} className="a360-icon-ok" />}
                  {revealed && isChosen && !isCorrect && (
                    <XCircle size={18} className="a360-icon-err" />
                  )}
                </button>
              );
            })}
          </div>

          {selectedOption !== null && (
            <div className="a360-quiz-feedback">
              <p className="a360-feedback-heading">
                {selectedOption === current.correctIndex ? 'Correct' : 'Review Explanation'}
              </p>
              <p>{current.explanation}</p>
              <div className="a360-feedback-actions">
                <button
                  type="button"
                  className="a360-inspect-link"
                  onClick={() => onInspectConcept(current.relatedConceptId)}
                >
                  Inspect {current.relatedStructureName} in 3D
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          <div className="a360-quiz-nav">
            <button
              type="button"
              className="a360-btn-secondary"
              disabled={safeIndex === 0}
              onClick={() => {
                setIndex((i) => Math.max(0, i - 1));
                setSelectedOption(null);
              }}
            >
              Previous
            </button>
            <button
              type="button"
              className="a360-btn-primary"
              disabled={safeIndex >= pool.length - 1}
              onClick={() => {
                setIndex((i) => Math.min(pool.length - 1, i + 1));
                setSelectedOption(null);
              }}
            >
              Next Question
            </button>
          </div>
        </article>
      )}
    </div>
  );
}
