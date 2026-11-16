import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Compass,
  Crosshair,
  HelpCircle,
  History,
  Layers,
  Play,
  RotateCcw,
  ShieldCheck,
  Target,
} from 'lucide-react';
import type { Atlas } from '../anatomy';
import { CANONICAL_SYSTEMS } from '../anatomy-systems';
import { calculatePoolAvailability } from '../practical-lab/generator';
import type {
  ExamConfig,
  ExamDifficulty,
  ExamMode,
  ExamPreset,
  ExamQuestionCount,
  ExamSystemScope,
  ExamTimerMode,
  PracticalLabStorageState,
} from '../practical-lab/types';

interface Props {
  atlas: Atlas | null;
  atlasError?: string;
  storage: PracticalLabStorageState;
  initialConfig: ExamConfig;
  onStartExam: (config: ExamConfig) => void;
  onResetProgress: () => void;
}

const MODE_OPTIONS: {
  id: ExamMode;
  title: string;
  badge: string;
  description: string;
  icon: typeof Crosshair;
}[] = [
  {
    id: 'identify',
    title: 'Identify the Structure',
    badge: 'Mode A · Blind Spotter',
    description:
      'A real 3D structure is isolated and highlighted without labels. Identify its anatomical name.',
    icon: Crosshair,
  },
  {
    id: 'locate',
    title: 'Locate the Structure',
    badge: 'Mode B · 3D Pinpoint',
    description:
      'Given an anatomical target name, orbit the 3D body and click the exact organ, bone, or muscle.',
    icon: Target,
  },
  {
    id: 'knowledge',
    title: 'Anatomical Knowledge',
    badge: 'Mode C · Function & Relations',
    description:
      'Answer verified questions on location, primary function, classification, relationships, and terminology.',
    icon: HelpCircle,
  },
  {
    id: 'mixed',
    title: 'Mixed Examination',
    badge: 'Comprehensive Practical',
    description:
      'Rotates between 3D blind identification, direct 3D mesh location, and verified anatomical theory.',
    icon: Layers,
  },
];

const DIFFICULTY_OPTIONS: { id: ExamDifficulty; label: string; hint: string }[] = [
  { id: 'all', label: 'All Levels', hint: 'Balanced landmark & detailed structures' },
  { id: 'foundational', label: 'Foundational', hint: 'Major landmark organs, bones & muscles' },
  { id: 'intermediate', label: 'Intermediate', hint: 'Regional organs, vessels & divisions' },
  { id: 'advanced', label: 'Advanced', hint: 'Fine branches, sub-parts & terminology' },
];

export default function PracticalLabSetup({
  atlas,
  atlasError,
  storage,
  initialConfig,
  onStartExam,
  onResetProgress,
}: Props) {
  const [scope, setScope] = useState<ExamSystemScope>(initialConfig.scope);
  const [mode, setMode] = useState<ExamMode>(initialConfig.mode);
  const [difficulty, setDifficulty] = useState<ExamDifficulty>(initialConfig.difficulty);
  const [questionCount, setQuestionCount] = useState<number>(initialConfig.questionCount);
  const [timerMode, setTimerMode] = useState<ExamTimerMode>(initialConfig.timerMode);
  const [secondsPerQuestion, setSecondsPerQuestion] = useState<number>(
    initialConfig.secondsPerQuestion || 60,
  );
  const [preset, setPreset] = useState<ExamPreset>(initialConfig.preset);
  const [confirmClear, setConfirmClear] = useState(false);

  const availability = useMemo(() => {
    if (!atlas) {
      return {
        totalAvailable: 0,
        supports10: false,
        supports20: false,
        supports30: false,
      };
    }
    return calculatePoolAvailability(atlas, scope, mode, difficulty);
  }, [atlas, scope, mode, difficulty]);

  // Effective validated question count that never exceeds available pool
  const effectiveCount = useMemo(() => {
    if (availability.totalAvailable <= 0) return 0;
    if (questionCount <= availability.totalAvailable) return questionCount;
    if (availability.supports20 && questionCount === 30) return 20;
    if (availability.supports10) return 10;
    return availability.totalAvailable;
  }, [availability, questionCount]);

  const weakList = useMemo(
    () =>
      Object.values(storage.weakStructures).sort(
        (a, b) => b.missCount - a.missCount || b.lastMissedAt - a.lastMissedAt,
      ),
    [storage.weakStructures],
  );

  const lifetimeStats = useMemo(() => {
    const count = storage.attempts.length;
    if (count === 0) return { exams: 0, avgAccuracy: 0, bestAccuracy: 0 };
    const avg = Math.round(
      storage.attempts.reduce((sum, a) => sum + a.accuracyPct, 0) / count,
    );
    const best = Math.max(...storage.attempts.map((a) => a.accuracyPct));
    return { exams: count, avgAccuracy: avg, bestAccuracy: best };
  }, [storage.attempts]);

  const selectedSystemInfo = useMemo(
    () => (scope === 'all' ? null : CANONICAL_SYSTEMS.find((s) => s.id === scope) ?? null),
    [scope],
  );

  const canStart = Boolean(atlas && !atlasError && effectiveCount >= 1);

  const handleStart = () => {
    if (!canStart) return;
    onStartExam({
      scope,
      mode,
      difficulty,
      questionCount: effectiveCount,
      timerMode,
      secondsPerQuestion,
      preset,
    });
  };

  const handleStartWeakPractice = () => {
    if (!atlas || weakList.length === 0) return;
    const targetIds = weakList.slice(0, 20).map((w) => w.conceptId);
    onStartExam({
      scope: 'all',
      mode: 'mixed',
      difficulty: 'all',
      questionCount: targetIds.length,
      timerMode: 'untimed',
      secondsPerQuestion: 60,
      preset: 'guided',
      weakPracticeConceptIds: targetIds,
      label: `Weak Structures Drill (${targetIds.length})`,
    });
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="a360-plab-setup">
      {/* Lifetime Performance & Weak Queue Summary */}
      <section className="a360-plab-stats-row" aria-label="Practical lab summary">
        <div className="a360-plab-stat-card">
          <span className="a360-stat-label">Completed Practicals</span>
          <strong className="a360-tabular-count">{lifetimeStats.exams}</strong>
          <span className="a360-stat-note">Saved locally in this browser</span>
        </div>

        <div className="a360-plab-stat-card">
          <span className="a360-stat-label">Average Accuracy</span>
          <strong className="a360-tabular-count">
            {lifetimeStats.exams > 0 ? `${lifetimeStats.avgAccuracy}%` : '—'}
          </strong>
          <span className="a360-stat-note">
            {lifetimeStats.exams > 0 ? `Best score: ${lifetimeStats.bestAccuracy}%` : 'Take an exam to track progress'}
          </span>
        </div>

        <div className="a360-plab-stat-card">
          <span className="a360-stat-label">Weak Structures Queue</span>
          <strong className="a360-tabular-count">{weakList.length}</strong>
          <span className="a360-stat-note">
            {weakList.length > 0
              ? 'Master each structure twice in a row to clear'
              : 'Missed structures appear here automatically'}
          </span>
        </div>

        <div className="a360-plab-stat-action">
          {weakList.length > 0 ? (
            <button
              type="button"
              className="a360-btn-primary"
              disabled={!atlas}
              onClick={handleStartWeakPractice}
            >
              <RotateCcw size={15} />
              Practice Weak Structures ({Math.min(20, weakList.length)})
            </button>
          ) : (
            <div className="a360-plab-ready-note">
              <CheckCircle2 size={16} />
              <span>No pending weak structures</span>
            </div>
          )}
        </div>
      </section>

      {atlasError && (
        <div className="a360-disclosure-note" role="alert">
          <AlertCircle size={16} />
          <span>{atlasError}</span>
        </div>
      )}

      {/* Main 2-Column Exam Configuration Desk */}
      <div className="a360-plab-config-grid">
        <div className="a360-plab-config-main">
          {/* 1. Examination Mode */}
          <section className="a360-plab-card">
            <div className="a360-plab-card-head">
              <h2>1. Select Examination Mode</h2>
              <span className="a360-muted">Choose how structures are tested on the 3D atlas</span>
            </div>

            <div className="a360-plab-mode-grid">
              {MODE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = mode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`a360-plab-mode-btn ${active ? 'active' : ''}`}
                    aria-pressed={active}
                    onClick={() => setMode(opt.id)}
                  >
                    <div className="a360-plab-mode-top">
                      <Icon size={17} />
                      <span className="a360-plab-mode-badge">{opt.badge}</span>
                    </div>
                    <strong>{opt.title}</strong>
                    <p>{opt.description}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. Anatomical System Scope */}
          <section className="a360-plab-card">
            <div className="a360-plab-card-head">
              <h2>2. Anatomical System Scope</h2>
              <span className="a360-muted">Focus on a single canonical system or test across all 12</span>
            </div>

            <div className="a360-plab-system-grid">
              <button
                type="button"
                className={`a360-syslearn-pill ${scope === 'all' ? 'active' : ''}`}
                aria-pressed={scope === 'all'}
                onClick={() => setScope('all')}
              >
                <Compass size={14} />
                <span className="a360-syslearn-pill-name">All 12 Body Systems</span>
              </button>

              {CANONICAL_SYSTEMS.map((sys) => {
                const active = scope === sys.id;
                return (
                  <button
                    key={sys.id}
                    type="button"
                    className={`a360-syslearn-pill ${active ? 'active' : ''}`}
                    aria-pressed={active}
                    onClick={() => setScope(sys.id)}
                  >
                    <span className="a360-sys-dot" style={{ background: sys.color }} />
                    <span className="a360-syslearn-pill-name">
                      {sys.name.en.replace(' System', '')}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedSystemInfo && selectedSystemInfo.coverage !== 'full' && (
              <div className="a360-disclosure-note" role="note">
                <AlertCircle size={15} />
                <span>
                  <strong>{selectedSystemInfo.coverageLabel}:</strong>{' '}
                  {selectedSystemInfo.coverageNote}
                </span>
              </div>
            )}
          </section>

          {/* 3. Difficulty, Question Count, Timer & Preset */}
          <section className="a360-plab-card">
            <div className="a360-plab-card-head">
              <h2>3. Difficulty, Length & Exam Policy</h2>
              <span className="a360-muted">
                Counts automatically validate against verified 3D structures
              </span>
            </div>

            <div className="a360-plab-settings-stack">
              {/* Difficulty */}
              <div className="a360-plab-field">
                <label>Difficulty Tier</label>
                <div className="a360-plab-segmented-grid">
                  {DIFFICULTY_OPTIONS.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      className={`a360-plab-seg-btn ${difficulty === d.id ? 'active' : ''}`}
                      aria-pressed={difficulty === d.id}
                      onClick={() => setDifficulty(d.id)}
                    >
                      <strong>{d.label}</strong>
                      <span>{d.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count (Eligibility-Gated) */}
              <div className="a360-plab-field">
                <div className="a360-plab-field-head">
                  <label>Question Count</label>
                  <span className="a360-tabular-count">
                    {atlas ? `${availability.totalAvailable} verified eligible items` : 'Loading catalog…'}
                  </span>
                </div>
                <div className="a360-plab-count-row">
                  {([10, 20, 30] as ExamQuestionCount[]).map((cnt) => {
                    const supported = availability.totalAvailable >= cnt;
                    const active = effectiveCount === cnt;
                    return (
                      <button
                        key={cnt}
                        type="button"
                        disabled={!supported}
                        className={`a360-plab-choice-btn ${active ? 'active' : ''}`}
                        onClick={() => setQuestionCount(cnt)}
                      >
                        {cnt} Questions
                      </button>
                    );
                  })}

                  {availability.totalAvailable > 0 && availability.totalAvailable < 10 && (
                    <button
                      type="button"
                      className={`a360-plab-choice-btn ${
                        effectiveCount === availability.totalAvailable ? 'active' : ''
                      }`}
                      onClick={() => setQuestionCount(availability.totalAvailable)}
                    >
                      All {availability.totalAvailable} Available
                    </button>
                  )}
                </div>

                {atlas && availability.totalAvailable < 30 && availability.totalAvailable > 0 && (
                  <p className="a360-stat-note">
                    {selectedSystemInfo ? selectedSystemInfo.name.en : 'This filter'} provides{' '}
                    {availability.totalAvailable} distinct verified items at this tier; larger counts
                    are disabled so structures never repeat or pad with filler.
                  </p>
                )}

                {atlas && availability.totalAvailable === 0 && (
                  <div className="a360-disclosure-note" role="note">
                    <AlertCircle size={15} />
                    <span>
                      No questions match this exact combination. Switch difficulty to{' '}
                      <strong>All Levels</strong> or select another system.
                    </span>
                  </div>
                )}
              </div>

              {/* Practice Preset + Timer */}
              <div className="a360-plab-two-col">
                <div className="a360-plab-field">
                  <label>Evaluation Policy</label>
                  <div className="a360-plab-preset-stack">
                    <button
                      type="button"
                      className={`a360-plab-policy-btn ${preset === 'strict' ? 'active' : ''}`}
                      aria-pressed={preset === 'strict'}
                      onClick={() => setPreset('strict')}
                    >
                      <div>
                        <strong>Strict Exam</strong>
                        <span>1 attempt per station · immediate score lock</span>
                      </div>
                      <ShieldCheck size={16} />
                    </button>

                    <button
                      type="button"
                      className={`a360-plab-policy-btn ${preset === 'guided' ? 'active' : ''}`}
                      aria-pressed={preset === 'guided'}
                      onClick={() => setPreset('guided')}
                    >
                      <div>
                        <strong>Guided Practice</strong>
                        <span>1 retry on Locate misses · optional region clue</span>
                      </div>
                      <Compass size={16} />
                    </button>
                  </div>
                </div>

                <div className="a360-plab-field">
                  <label>Timer Mode</label>
                  <div className="a360-plab-preset-stack">
                    <button
                      type="button"
                      className={`a360-plab-policy-btn ${timerMode === 'untimed' ? 'active' : ''}`}
                      aria-pressed={timerMode === 'untimed'}
                      onClick={() => setTimerMode('untimed')}
                    >
                      <div>
                        <strong>Untimed Study</strong>
                        <span>No countdown · inspect anatomy at your own pace</span>
                      </div>
                      <Clock size={16} />
                    </button>

                    <button
                      type="button"
                      className={`a360-plab-policy-btn ${timerMode === 'timed' ? 'active' : ''}`}
                      aria-pressed={timerMode === 'timed'}
                      onClick={() => setTimerMode('timed')}
                    >
                      <div>
                        <strong>Timed Spotter ({secondsPerQuestion}s / station)</strong>
                        <span>Auto-submits when countdown reaches zero</span>
                      </div>
                      <Clock size={16} />
                    </button>
                  </div>

                  {timerMode === 'timed' && (
                    <div className="a360-plab-pace-row">
                      <span>Pace:</span>
                      {[45, 60, 90].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          className={`a360-mini-btn ${secondsPerQuestion === sec ? 'active' : ''}`}
                          onClick={() => setSecondsPerQuestion(sec)}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Blueprint Summary & Start CTA */}
        <aside className="a360-plab-blueprint" aria-label="Examination blueprint summary">
          <div className="a360-plab-card a360-plab-sticky">
            <p className="a360-kicker">Practical Blueprint</p>
            <h3>Ready to Begin</h3>

            <dl className="a360-plab-summary-list">
              <div>
                <dt>System Scope</dt>
                <dd>{selectedSystemInfo ? selectedSystemInfo.name.en : 'All 12 Systems'}</dd>
              </div>
              <div>
                <dt>Exam Mode</dt>
                <dd>{MODE_OPTIONS.find((m) => m.id === mode)?.title}</dd>
              </div>
              <div>
                <dt>Difficulty</dt>
                <dd>{DIFFICULTY_OPTIONS.find((d) => d.id === difficulty)?.label}</dd>
              </div>
              <div>
                <dt>Stations</dt>
                <dd className="a360-tabular-count">
                  {effectiveCount > 0 ? `${effectiveCount} unique questions` : 'Unavailable'}
                </dd>
              </div>
              <div>
                <dt>Policy</dt>
                <dd>{preset === 'strict' ? 'Strict Exam' : 'Guided Practice'}</dd>
              </div>
              <div>
                <dt>Time Limit</dt>
                <dd className="a360-tabular-count">
                  {timerMode === 'timed' && effectiveCount > 0
                    ? `${formatDuration(effectiveCount * secondsPerQuestion)} total`
                    : 'Untimed'}
                </dd>
              </div>
            </dl>

            <div className="a360-plab-blueprint-note">
              {mode === 'locate' ? (
                <p>
                  <strong>3D Presentation:</strong> Active system layers stay solid and clickable
                  inside a translucent orientation shell. Tapping a mesh previews it before you
                  press <em>Submit Selection</em>.
                </p>
              ) : mode === 'identify' ? (
                <p>
                  <strong>Blind Spotter:</strong> The target structure is isolated in clinical teal
                  while labels and hover tooltips remain hidden until your answer is locked.
                </p>
              ) : (
                <p>
                  <strong>Verified Curriculum:</strong> All prompts and rationales draw strictly
                  from verified BodyParts3D geometry and curated anatomical knowledge.
                </p>
              )}
            </div>

            <button
              type="button"
              className="a360-btn-primary a360-plab-start-btn"
              disabled={!canStart}
              onClick={handleStart}
            >
              <Play size={16} />
              Start Practical Examination
              <ArrowRight size={16} />
            </button>
          </div>
        </aside>
      </div>

      {/* Past Attempts History */}
      {storage.attempts.length > 0 && (
        <section className="a360-plab-card">
          <div className="a360-plab-history-head">
            <div className="a360-plab-history-title">
              <History size={18} />
              <div>
                <h2>Recent Practical History</h2>
                <span className="a360-muted">
                  Last {storage.attempts.length} completed examinations saved on this device
                </span>
              </div>
            </div>

            {!confirmClear ? (
              <button
                type="button"
                className="a360-btn-secondary"
                onClick={() => setConfirmClear(true)}
              >
                Clear History
              </button>
            ) : (
              <div className="a360-plab-confirm-row">
                <span>Clear all saved scores?</span>
                <button
                  type="button"
                  className="a360-mini-btn active"
                  onClick={() => {
                    onResetProgress();
                    setConfirmClear(false);
                  }}
                >
                  Confirm Reset
                </button>
                <button
                  type="button"
                  className="a360-mini-btn"
                  onClick={() => setConfirmClear(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="a360-plab-history-list">
            {storage.attempts.slice(0, 8).map((att) => {
              const sysLabel =
                att.scope === 'all'
                  ? 'All Systems'
                  : CANONICAL_SYSTEMS.find((s) => s.id === att.scope)?.name.en ?? att.scope;
              const dateLabel = new Date(att.completedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <div key={att.id} className="a360-plab-history-row">
                  <div className="a360-plab-history-main">
                    <strong>
                      {att.isWeakPractice ? 'Weak Structures Drill' : sysLabel} ·{' '}
                      {MODE_OPTIONS.find((m) => m.id === att.mode)?.title ?? att.mode}
                    </strong>
                    <span>
                      {dateLabel} · {att.preset === 'strict' ? 'Strict Exam' : 'Guided Practice'} ·{' '}
                      {formatDuration(att.durationSec)}
                    </span>
                  </div>
                  <div className="a360-plab-history-score">
                    <Award size={15} />
                    <strong className="a360-tabular-count">
                      {att.score}/{att.attempted || att.totalQuestions} ({att.accuracyPct}%)
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
