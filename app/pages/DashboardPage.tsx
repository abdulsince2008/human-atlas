import { useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  Download,
  RotateCcw,
  Upload,
  UserCheck,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CANONICAL_SYSTEMS, type CanonicalSystemId } from '../anatomy-systems';
import PageOrientationBar from '../components/PageOrientationBar';
import { useStudy } from '../components/StudyContext';
import { ANATOMY_LESSONS } from '../learning-data';
import { QUIZ_QUESTIONS } from '../quiz-data';
import { ANATOMY_FLASHCARDS, isCardDue } from '../spaced-repetition';
import type { StudyTrack } from '../study-store';
import type { AppRoute } from '../components/SiteHeader';
import StudentCloudPanel from '../components/StudentCloudPanel';
import type { Atlas } from '../anatomy';
import { generateAdaptiveRecommendations } from '../adaptive-study';
import type { StudyContextInput } from '../study-context-engine';

interface Props {
  atlas?: Atlas | null;
  onNavigate: (route: AppRoute) => void;
  onInspectConcept: (conceptId: string) => void;
  onOpenLearnSystem: (systemId: CanonicalSystemId) => void;
  onOpenStudyContext?: (input: StudyContextInput) => void;
}

const STUDY_TRACKS: StudyTrack[] = [
  'FSc Pre-Medical',
  'MDCAT',
  'MBBS / Medical',
  'Nursing / Allied Health',
  'General Biology',
];

export default function DashboardPage({
  atlas,
  onNavigate,
  onInspectConcept,
  onOpenLearnSystem,
  onOpenStudyContext,
}: Props) {
  const {
    backendName,
    state,
    revisionQueue,
    updateProfile,
    dismissOnboarding,
    reopenOnboarding,
    setExperienceDepth,
    exportStudyJson,
    importStudyJson,
    resetAllStudyProgress,
  } = useStudy();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const totalTopics = useMemo(
    () => ANATOMY_LESSONS.reduce((sum, l) => sum + l.topics.length, 0),
    [],
  );

  const completedLessonsCount = useMemo(() => {
    const done = new Set(state.completedTopicIds);
    return ANATOMY_LESSONS.filter(
      (l) => l.topics.length > 0 && l.topics.every((t) => done.has(t.id)),
    ).length;
  }, [state.completedTopicIds]);

  const practicalAvgAccuracy = useMemo(() => {
    if (state.practicalAttempts.length === 0) return null;
    const sum = state.practicalAttempts.reduce((acc, a) => acc + a.accuracyPct, 0);
    return Math.round(sum / state.practicalAttempts.length);
  }, [state.practicalAttempts]);

  const reviewedCardsCount = Object.keys(state.flashcardReviews).length;
  const dueCardsCount = useMemo(() => {
    const now = Date.now();
    return ANATOMY_FLASHCARDS.filter((c) => isCardDue(state.flashcardReviews[c.id], now)).length;
  }, [state.flashcardReviews]);

  const weakAreas = useMemo(
    () => Object.values(state.weakConcepts).sort((a, b) => b.missCount - a.missCount),
    [state.weakConcepts],
  );

  const adaptiveRecs = useMemo(
    () => generateAdaptiveRecommendations(state, atlas, { limit: 5 }),
    [state, atlas],
  );

  // Per-system real telemetry (Learn topic completion % + Practical Lab real accuracy %)
  const systemChartData = useMemo(() => {
    const doneSet = new Set(state.completedTopicIds);
    const labTotals = new Map<CanonicalSystemId, { correct: number; total: number }>();
    for (const attempt of state.practicalAttempts) {
      for (const ps of attempt.perSystem) {
        const cur = labTotals.get(ps.systemId) ?? { correct: 0, total: 0 };
        cur.correct += ps.correct;
        cur.total += ps.total;
        labTotals.set(ps.systemId, cur);
      }
    }

    return CANONICAL_SYSTEMS.map((sys) => {
      const lessons = ANATOMY_LESSONS.filter((l) => l.systemId === sys.id);
      const topics = lessons.flatMap((l) => l.topics);
      const topicsDone = topics.filter((t) => doneSet.has(t.id)).length;
      const learnPct = topics.length > 0 ? Math.round((topicsDone / topics.length) * 100) : 0;

      const lab = labTotals.get(sys.id);
      const practicalPct = lab && lab.total > 0 ? Math.round((lab.correct / lab.total) * 100) : 0;

      return {
        id: sys.id,
        name: sys.name.en.replace(' System', '').replace(' Organs', ''),
        learnPct,
        practicalPct,
      };
    });
  }, [state.completedTopicIds, state.practicalAttempts]);

  const handleExport = () => {
    const json = exportStudyJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anatomy360-study-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setImportStatus({ ok: true, msg: 'Study backup exported as JSON.' });
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const res = await importStudyJson(text);
    setImportStatus({
      ok: res.ok,
      msg: res.ok ? 'Study history imported and restored cleanly.' : res.error ?? 'Import failed.',
    });
    e.target.value = '';
  };

  return (
    <div className="a360-page">
      <header className="a360-page-header">
        <p className="a360-kicker">
          Personal Progress · Stored Locally ({backendName === 'indexeddb' ? 'IndexedDB' : 'Browser Storage'})
        </p>
        <h1>Your Progress &amp; Study Plan</h1>
        <p className="a360-lead">
          Track completed topics, Practical Lab spotter accuracy, spaced-repetition flashcards,
          weak anatomical areas, and saved structures—saved locally with optional cloud sync and JSON backup.
        </p>
      </header>

      <PageOrientationBar
        whatThisIs="See everything you have studied so far, what to review next, and manage your learning level or backup."
        primaryHint={
          state.trackSelected
            ? `Active track: ${state.profile.track} · Mode: ${state.experienceDepth === 'guided' ? 'Guided' : 'Full / Advanced'}`
            : 'No study track chosen yet (currently Open Exploration). Pick a track below or keep browsing freely.'
        }
        spokenSummary="This is your Study Dashboard. You can check completed topics, quiz and practical exam scores, suggested next study steps, and export or restore your progress anytime."
        howToSteps={[
          'Check Top Recommendations below to pick up right where you will improve fastest.',
          'Adjust your name, course track, or explanation mode (Guided vs Full) anytime.',
          'Download a JSON backup before clearing browser storage or moving devices.',
        ]}
        rightSlot={
          <div className="a360-embedded-toolgroup" role="group" aria-label="Explanation mode">
            <button
              type="button"
              className={`a360-mini-btn ${state.experienceDepth === 'guided' ? 'active' : ''}`}
              onClick={() => setExperienceDepth('guided')}
            >
              Guided Mode
            </button>
            <button
              type="button"
              className={`a360-mini-btn ${state.experienceDepth === 'full' ? 'active' : ''}`}
              onClick={() => setExperienceDepth('full')}
            >
              Full Mode
            </button>
          </div>
        }
      />

      {!state.onboardingDismissed && (
        <section className="a360-onboarding-banner" aria-label="Quick start guide">
          <div>
            <p className="a360-kicker">Quick-Start Guide</p>
            <h2>How to get the most from Anatomy 360</h2>
            <p className="a360-muted">
              1. Inspect organs in the 3D Explorer or Study Workspace. 2. Follow structured 12-system or 16-subject lessons. 3. Test yourself in Practice Quizzes or Practical Lab—any missed organ automatically enters your Revision Queue.
            </p>
          </div>
          <button
            type="button"
            className="a360-btn-secondary"
            aria-label="Dismiss quick-start guide"
            onClick={() => dismissOnboarding(true)}
          >
            <X size={15} /> Dismiss
          </button>
        </section>
      )}

      {/* Local Student Profile (No Auth Required) */}
      <section className="a360-profile-bar" aria-label="Local student profile">
        <div className="a360-profile-head">
          <UserCheck size={18} />
          <div className="flex flex-col gap-0.5">
            <strong>
              Local Profile ·{' '}
              {state.trackSelected
                ? state.profile.track
                : 'Open Exploration (No track chosen yet)'}
            </strong>
            <span>Stored privately in your browser · No account required</span>
          </div>
          <button
            type="button"
            className="a360-mini-btn ml-auto"
            onClick={() => {
              reopenOnboarding();
              onNavigate('home');
            }}
          >
            Change Role / Pathway
          </button>
        </div>
        <div className="a360-profile-fields">
          <label className="a360-select-field">
            <span>Student Name</span>
            <input
              type="text"
              value={state.profile.displayName}
              maxLength={60}
              onChange={(e) => updateProfile({ displayName: e.target.value })}
            />
          </label>
          <label className="a360-select-field">
            <span>Course Track</span>
            <select
              value={state.profile.track}
              onChange={(e) => updateProfile({ track: e.target.value as StudyTrack })}
            >
              {STUDY_TRACKS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="a360-select-field">
            <span>Daily Flashcard Goal</span>
            <input
              type="number"
              min={5}
              max={100}
              value={state.profile.dailyFlashcardGoal}
              onChange={(e) =>
                updateProfile({ dailyFlashcardGoal: Math.max(5, Math.min(100, Number(e.target.value) || 15)) })
              }
            />
          </label>
        </div>
      </section>

      <StudentCloudPanel onNavigate={onNavigate} />

      {/* Verified KPI Strip */}
      <section className="a360-metrics-strip" aria-label="Recorded student metrics">
        <div className="a360-metric">
          <strong>
            {state.completedTopicIds.length} / {totalTopics}
          </strong>
          <span>
            Topics Completed ({completedLessonsCount}/{ANATOMY_LESSONS.length} lessons)
          </span>
        </div>
        <div className="a360-metric">
          <strong>
            {practicalAvgAccuracy !== null ? `${practicalAvgAccuracy}%` : '—'}
          </strong>
          <span>
            Practical Lab Avg ({state.practicalAttempts.length}{' '}
            {state.practicalAttempts.length === 1 ? 'exam' : 'exams'})
          </span>
        </div>
        <div className="a360-metric">
          <strong>
            {reviewedCardsCount} / {ANATOMY_FLASHCARDS.length}
          </strong>
          <span>Flashcards Reviewed ({dueCardsCount} due now)</span>
        </div>
        <div className="a360-metric">
          <strong>{Object.keys(state.bookmarks).length}</strong>
          <span>
            Saved Bookmarks ({state.quizProgress.correctIds.length}/{QUIZ_QUESTIONS.length} quiz solved)
          </span>
        </div>
      </section>

      {/* Adaptive Next Study Recommendations */}
      <section className="a360-chart-panel" aria-label="Adaptive next study recommendations" style={{ marginBottom: '18px' }}>
        <div className="a360-list-header">
          <div>
            <h2>Adaptive Next Study Recommendations</h2>
            <p className="a360-muted">
              Generated directly from your incorrect quiz items, missed Practical Lab structures, SM-2 due flashcards, and bookmarks.
            </p>
          </div>
          {onOpenStudyContext && adaptiveRecs[0] && (
            <button
              type="button"
              className="a360-btn-primary"
              onClick={() => onOpenStudyContext(adaptiveRecs[0].studyInput)}
            >
              Start Top Recommendation <ArrowRight size={14} />
            </button>
          )}
        </div>
        <div className="a360-dash-list">
          {adaptiveRecs.map((rec) => (
            <div key={rec.id} className="a360-dash-row">
              <div>
                <strong>{rec.targetTitle}</strong>
                <span>
                  {rec.reasonLabel} · {rec.explanation}
                </span>
              </div>
              <div className="a360-card-actions">
                {onOpenStudyContext && (
                  <button
                    type="button"
                    className="a360-card-btn"
                    onClick={() => onOpenStudyContext(rec.studyInput)}
                  >
                    Open Study Context <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Per-System Visualization */}
      <section className="a360-dashboard-grid">
        <div className="a360-chart-panel">
          <div className="a360-list-header">
            <div>
              <h2>Performance & Completion by System</h2>
              <p className="a360-muted">
                Real Lesson Topic Completion (%) alongside Practical Lab Spotter Accuracy (%) per canonical system.
              </p>
            </div>
          </div>
          <div className="a360-chart-canvas">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={systemChartData} margin={{ top: 10, right: 12, left: -12, bottom: 28 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  interval={0}
                  angle={-28}
                  textAnchor="end"
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#475569' }} unit="%" />
                <Tooltip />
                <Bar dataKey="learnPct" name="Lesson Topics %" fill="#0f5c6e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="practicalPct" name="Practical Lab Accuracy %" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weak Areas & Revision Queue Preview */}
        <div className="a360-chart-panel">
          <div className="a360-list-header">
            <div>
              <h2>Weak Anatomical Areas & Due Revision</h2>
              <p className="a360-muted">
                Structures missed in Practical Lab or queued for active spaced recall.
              </p>
            </div>
            <button
              type="button"
              className="a360-text-link"
              onClick={() => onNavigate('revision')}
            >
              Open Revision Hub <ArrowRight size={14} />
            </button>
          </div>

          {weakAreas.length === 0 && revisionQueue.length === 0 ? (
            <div className="a360-empty-box">
              <p>
                No weak areas recorded yet. Complete a Practical Lab spotter exam or review flashcards to populate targeted recommendations.
              </p>
            </div>
          ) : (
            <div className="a360-dash-list">
              {weakAreas.slice(0, 5).map((w) => (
                <div key={w.conceptId} className="a360-dash-row">
                  <div>
                    <strong>{w.name}</strong>
                    <span>
                      Missed {w.missCount}× · {w.canonicalSystem}
                    </span>
                  </div>
                  <div className="a360-card-actions">
                    <button
                      type="button"
                      className="a360-card-btn"
                      onClick={() => onInspectConcept(w.conceptId)}
                    >
                      3D Inspect
                    </button>
                    <button
                      type="button"
                      className="a360-btn-secondary"
                      onClick={() => onOpenLearnSystem(w.canonicalSystem)}
                    >
                      Lesson
                    </button>
                  </div>
                </div>
              ))}
              {weakAreas.length === 0 &&
                revisionQueue.slice(0, 4).map((q) => (
                  <div key={q.id} className="a360-dash-row">
                    <div>
                      <strong>{q.title}</strong>
                      <span>{q.subtitle}</span>
                    </div>
                    <button
                      type="button"
                      className="a360-card-btn"
                      onClick={() => onNavigate('revision')}
                    >
                      Revise
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </section>

      {/* Activity & Data Management */}
      <section className="a360-dashboard-grid">
        <div className="a360-chart-panel">
          <h2>Recent Study Activity</h2>
          {state.activityLog.length === 0 ? (
            <p className="a360-muted">
              No study activity recorded yet in this profile. Your completed topics, exams, flashcards, and bookmarks will appear here.
            </p>
          ) : (
            <ul className="a360-activity-list">
              {state.activityLog.slice(0, 8).map((item) => (
                <li key={item.id}>
                  <strong>{item.label}</strong>
                  <span>
                    {item.detail ? `${item.detail} · ` : ''}
                    {new Date(item.at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="a360-chart-panel">
          <h2>Study Backup, Export & Reset</h2>
          <p className="a360-muted">
            Your progress lives cleanly inside browser IndexedDB so you can export a portable JSON
            backup, restore on another device, or reset cleanly.
          </p>

          <div className="a360-backup-actions">
            <button type="button" className="a360-btn-primary" onClick={handleExport}>
              <Download size={15} /> Export Study Data (JSON)
            </button>
            <button
              type="button"
              className="a360-btn-secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={15} /> Import Backup (JSON)
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={handleImportFile}
            />
            <button
              type="button"
              className="a360-btn-secondary"
              onClick={() => onNavigate('bookmarks')}
            >
              <Bookmark size={15} /> View Bookmarks ({Object.keys(state.bookmarks).length})
            </button>
          </div>

          {importStatus && (
            <p className={`a360-status-note ${importStatus.ok ? 'is-ok' : 'is-err'}`} role="status">
              {importStatus.msg}
            </p>
          )}

          <div className="a360-reset-zone">
            {!confirmReset ? (
              <button
                type="button"
                className="a360-btn-danger-ghost"
                onClick={() => setConfirmReset(true)}
              >
                <RotateCcw size={14} /> Reset All Local Study Progress…
              </button>
            ) : (
              <div className="a360-confirm-box" role="alert">
                <p>
                  Resetting clears completed lessons, Practical Lab attempts, flashcard intervals,
                  and bookmarks on this device. Export a backup first if needed.
                </p>
                <div className="a360-card-actions">
                  <button
                    type="button"
                    className="a360-btn-danger"
                    onClick={async () => {
                      await resetAllStudyProgress();
                      setConfirmReset(false);
                      setImportStatus({ ok: true, msg: 'All local study progress was reset.' });
                    }}
                  >
                    Confirm Reset
                  </button>
                  <button
                    type="button"
                    className="a360-btn-secondary"
                    onClick={() => setConfirmReset(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
