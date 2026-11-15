import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { CANONICAL_SYSTEMS } from '../anatomy-systems';
import { QUIZ_QUESTIONS } from '../quiz-data';

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
  const [systemFilter, setSystemFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
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
          (difficultyFilter === 'all' || q.difficulty === difficultyFilter),
      ),
    [systemFilter, difficultyFilter],
  );

  const safeIndex = pool.length > 0 ? Math.min(index, pool.length - 1) : 0;
  const current = pool[safeIndex];
  const systemInfo = current ? CANONICAL_SYSTEMS.find((s) => s.id === current.systemId) : undefined;

  const submitAnswer = (optIndex: number) => {
    if (!current || selectedOption !== null) return;
    setSelectedOption(optIndex);
    setProgress((prev) => {
      const answeredIds = prev.answeredIds.includes(current.id)
        ? prev.answeredIds
        : [...prev.answeredIds, current.id];
      const isCorrect = optIndex === current.correctIndex;
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

  const availableSystems = useMemo(() => {
    const ids = new Set(QUIZ_QUESTIONS.map((q) => q.systemId));
    return CANONICAL_SYSTEMS.filter((s) => ids.has(s.id));
  }, []);

  return (
    <div className="a360-page a360-narrow">
      <header className="a360-page-header">
        <p className="a360-kicker">Active Recall & Exam Revision</p>
        <h1>Anatomy Quizzes</h1>
        <p className="a360-lead">
          Verified multiple-choice questions for FSc, MDCAT, MBBS, and nursing study. Every
          explanation links straight to the tested 3D structure.
        </p>
      </header>

      <div className="a360-quiz-stats">
        <div>
          <span className="a360-stat-label">Browser Revision Progress</span>
          <strong className="a360-tabular-count">
            {progress.correctIds.length} / {QUIZ_QUESTIONS.length} verified correct ·{' '}
            {progress.answeredIds.length} attempted
          </strong>
          <span className="a360-stat-note">Saved locally in this browser only.</span>
        </div>
        <button type="button" className="a360-btn-secondary" onClick={resetProgress}>
          <RotateCcw size={14} />
          Reset Progress
        </button>
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
            <option value="all">All Systems ({QUIZ_QUESTIONS.length})</option>
            {availableSystems.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name.en}
              </option>
            ))}
          </select>
        </label>

        <label className="a360-select-field">
          <span>Level</span>
          <select
            value={difficultyFilter}
            onChange={(e) => {
              setDifficultyFilter(e.target.value);
              setIndex(0);
              setSelectedOption(null);
            }}
          >
            <option value="all">All Levels</option>
            <option value="FSc / MDCAT">FSc / MDCAT</option>
            <option value="MBBS / Nursing">MBBS / Nursing</option>
          </select>
        </label>
      </div>

      {!current ? (
        <div className="a360-empty-box">
          <p>No questions match the selected system and difficulty filter.</p>
        </div>
      ) : (
        <article className="a360-quiz-card">
          <div className="a360-quiz-meta">
            <span>
              Question {safeIndex + 1} of {pool.length}
            </span>
            <span>
              {systemInfo?.name.en} · {current.difficulty}
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
