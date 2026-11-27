import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  Crosshair,
  ExternalLink,
  Eye,
  Hand,
  Layers,
  Lightbulb,
  MousePointerClick,
  RotateCcw,
  ShieldCheck,
  XCircle,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  DEFAULT_VISIBLE,
  type Atlas,
  type InteractionMode,
  type SceneState,
  type SystemId,
  type View,
} from '../anatomy';
import { CANONICAL_SYSTEMS, type CanonicalSystemId } from '../anatomy-systems';
import { evaluateLocateSelection, generatePracticalExam } from '../practical-lab/generator';
import {
  clearPracticalLabStorage,
  loadPracticalLabStorage,
  recordCompletedPracticalExam,
} from '../practical-lab/storage';
import type {
  ExamAttemptSummary,
  ExamConfig,
  PerSystemScore,
  PracticalLabStorageState,
  PracticalQuestion,
  QuestionSubmission,
} from '../practical-lab/types';
import PracticalLabResults from './PracticalLabResults';
import PracticalLabSetup from './PracticalLabSetup';
import PageOrientationBar from './PageOrientationBar';
import { useStudy } from './StudyContext';
import type { StudyContextInput } from '../study-context-engine';

const AnatomyScene = lazy(() => import('../scene'));

interface Props {
  atlas: Atlas | null;
  atlasError?: string;
  initialSystemId?: CanonicalSystemId | null;
  onInspectConcept: (conceptId: string) => void;
  onOpenLearnSystem: (systemId: CanonicalSystemId) => void;
  onOpenStudyContext?: (input: StudyContextInput) => void;
}

type Stage = 'setup' | 'active' | 'results';
type LocateShellMode = 'shell' | 'system-only';

const DEFAULT_CONFIG: ExamConfig = {
  scope: 'all',
  mode: 'mixed',
  difficulty: 'foundational',
  questionCount: 10,
  timerMode: 'untimed',
  secondsPerQuestion: 60,
  preset: 'strict',
};

const SHELL_LAYERS: SystemId[] = ['skeletal', 'connective', 'integumentary'];

export default function PracticalLabWorkspace({
  atlas,
  atlasError,
  initialSystemId,
  onInspectConcept,
  onOpenLearnSystem,
  onOpenStudyContext,
}: Props) {
  const { state: studyState, recordPracticalExam } = useStudy();
  const [stage, setStage] = useState<Stage>('setup');
  const [storage, setStorage] = useState<PracticalLabStorageState>(() =>
    loadPracticalLabStorage(),
  );
  const [activeConfig, setActiveConfig] = useState<ExamConfig>(() => ({
    ...DEFAULT_CONFIG,
    scope: initialSystemId ?? 'all',
  }));
  useEffect(() => {
    if (initialSystemId) {
      setActiveConfig((prev) => ({ ...prev, scope: initialSystemId }));
      setStage('setup');
    }
  }, [initialSystemId]);
  const [questions, setQuestions] = useState<PracticalQuestion[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, QuestionSubmission>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastSummary, setLastSummary] = useState<ExamAttemptSummary | null>(null);

  // Active station UI controls
  const [previewPartId, setPreviewPartId] = useState<string | null>(null);
  const [showClue, setShowClue] = useState(false);
  const [locateShellMode, setLocateShellMode] = useState<LocateShellMode>('shell');
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);

  // Embedded 3D viewport state (single persistent AnatomyScene while stage === 'active')
  const [view, setView] = useState<View>('three-quarter');
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('orbit');
  const [resetCount, setResetCount] = useState(0);
  const [zoomStep, setZoomStep] = useState<{ id: number; delta: number } | undefined>(undefined);
  const [focusRequest, setFocusRequest] = useState(1);
  const [sceneProgress, setSceneProgress] = useState(0);
  const [sceneError, setSceneError] = useState('');

  // Timer state
  const [remainingSec, setRemainingSec] = useState<number>(0);
  const examStartMsRef = useRef<number>(0);
  const examEndsMsRef = useRef<number>(0);
  const questionStartMsRef = useRef<number>(0);
  const finalizedRef = useRef<boolean>(false);
  const initialFocusDoneRef = useRef<boolean>(false);

  const currentQuestion: PracticalQuestion | undefined = questions[currentIndex];
  const currentSubmission: QuestionSubmission | undefined = currentQuestion
    ? submissions[currentQuestion.id]
    : undefined;

  const finalizeExam = useCallback(
    (timedOut: boolean) => {
      if (finalizedRef.current) return;
      finalizedRef.current = true;

      const now = Date.now();
      const durationSec = Math.max(1, Math.round((now - examStartMsRef.current) / 1000));

      const finalSubmissions: Record<string, QuestionSubmission> = { ...submissions };
      for (const q of questions) {
        const sub = finalSubmissions[q.id];
        if (!sub || sub.status !== 'submitted') {
          finalSubmissions[q.id] = {
            questionId: q.id,
            status: 'submitted',
            isCorrect: false,
            attemptsUsed: sub?.attemptsUsed ?? 0,
            clueUsed: sub?.clueUsed ?? false,
            timeSpentSec: sub?.timeSpentSec ?? 0,
            missReason: timedOut
              ? 'Time expired before submitting this station.'
              : 'Examination ended before completing this station.',
          };
        }
      }

      const attemptedCount = questions.filter((q) => {
        const s = submissions[q.id];
        return s && (s.status === 'submitted' || s.attemptsUsed > 0);
      }).length;

      const score = questions.filter((q) => finalSubmissions[q.id]?.isCorrect).length;
      const accuracyPct =
        questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

      const sysMap = new Map<CanonicalSystemId, { correct: number; total: number }>();
      const missedIds: string[] = [];
      for (const q of questions) {
        const entry = sysMap.get(q.canonicalSystem) ?? { correct: 0, total: 0 };
        entry.total += 1;
        if (finalSubmissions[q.id]?.isCorrect) {
          entry.correct += 1;
        } else {
          missedIds.push(q.targetConceptId);
        }
        sysMap.set(q.canonicalSystem, entry);
      }

      const perSystem: PerSystemScore[] = Array.from(sysMap.entries()).map(([sysId, counts]) => ({
        systemId: sysId,
        systemName: CANONICAL_SYSTEMS.find((s) => s.id === sysId)?.name.en ?? sysId,
        correct: counts.correct,
        total: counts.total,
        accuracyPct: Math.round((counts.correct / counts.total) * 100),
      }));

      const summary: ExamAttemptSummary = {
        id: `exam-${now}`,
        completedAt: now,
        scope: activeConfig.scope,
        mode: activeConfig.mode,
        difficulty: activeConfig.difficulty,
        preset: activeConfig.preset,
        timerMode: activeConfig.timerMode,
        isWeakPractice: Boolean(activeConfig.weakPracticeConceptIds?.length),
        score,
        attempted: attemptedCount,
        totalQuestions: questions.length,
        accuracyPct,
        durationSec,
        timedOut,
        perSystem,
        missedConceptIds: Array.from(new Set(missedIds)),
      };

      const nextStorage = recordCompletedPracticalExam(
        storage,
        summary,
        questions,
        finalSubmissions,
      );
      recordPracticalExam(summary, questions, finalSubmissions);
      setSubmissions(finalSubmissions);
      setStorage(nextStorage);
      setLastSummary(summary);
      setStage('results');
    },
    [activeConfig, questions, storage, submissions, recordPracticalExam],
  );

  const startExamWithConfig = useCallback(
    (config: ExamConfig) => {
      if (!atlas) return;
      const generated = generatePracticalExam(atlas, config);
      if (generated.length === 0) return;

      const now = Date.now();
      examStartMsRef.current = now;
      questionStartMsRef.current = now;
      finalizedRef.current = false;
      initialFocusDoneRef.current = false;

      const totalSec = generated.length * config.secondsPerQuestion;
      examEndsMsRef.current = config.timerMode === 'timed' ? now + totalSec * 1000 : 0;

      setActiveConfig(config);
      setQuestions(generated);
      setSubmissions({});
      setCurrentIndex(0);
      setPreviewPartId(null);
      setShowClue(false);
      setLocateShellMode('shell');
      setConfirmEndOpen(false);
      setLastSummary(null);
      setRemainingSec(config.timerMode === 'timed' ? totalSec : 0);

      const first = generated[0];
      setView(first.preferredView);
      setInteractionMode('orbit');
      setResetCount((n) => n + 1);
      setFocusRequest((n) => n + 1);
      setStage('active');
    },
    [atlas],
  );

  // Initial focus once WebGL finishes loading chunks for Station 1
  useEffect(() => {
    if (
      stage === 'active' &&
      sceneProgress >= 100 &&
      !initialFocusDoneRef.current &&
      currentQuestion &&
      currentQuestion.mode !== 'locate'
    ) {
      initialFocusDoneRef.current = true;
      setFocusRequest((n) => n + 1);
    }
  }, [stage, sceneProgress, currentQuestion]);

  // Countdown timer for timed exams
  useEffect(() => {
    if (stage !== 'active' || activeConfig.timerMode !== 'timed') return;
    const id = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((examEndsMsRef.current - Date.now()) / 1000));
      setRemainingSec(left);
      if (left <= 0) {
        window.clearInterval(id);
        finalizeExam(true);
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [stage, activeConfig.timerMode, finalizeExam]);

  // Move to a station and cleanly orient the 3D scene
  const goToStation = useCallback(
    (nextIdx: number) => {
      const nextQ = questions[nextIdx];
      if (!nextQ) return;
      questionStartMsRef.current = Date.now();
      setCurrentIndex(nextIdx);
      setPreviewPartId(null);
      setShowClue(false);
      setLocateShellMode('shell');
      setView(nextQ.preferredView);
      if (nextQ.mode === 'locate') {
        setResetCount((n) => n + 1);
      } else {
        setFocusRequest((n) => n + 1);
      }
    },
    [questions],
  );

  // Submit Mode A or Mode C MCQ option (locked against re-submission)
  const submitOptionAnswer = useCallback(
    (optionIndex: number) => {
      if (!currentQuestion || currentQuestion.mode === 'locate') return;
      if (currentSubmission?.status === 'submitted') return;

      const isCorrect = optionIndex === currentQuestion.correctIndex;
      const spent = Math.max(1, Math.round((Date.now() - questionStartMsRef.current) / 1000));
      const expectedAnswer =
        currentQuestion.options && typeof currentQuestion.correctIndex === 'number'
          ? currentQuestion.options[currentQuestion.correctIndex]
          : currentQuestion.targetName;

      setSubmissions((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          questionId: currentQuestion.id,
          status: 'submitted',
          isCorrect,
          attemptsUsed: 1,
          selectedOptionIndex: optionIndex,
          clueUsed: showClue,
          timeSpentSec: spent,
          missReason: isCorrect
            ? undefined
            : `Expected "${expectedAnswer}" (${currentQuestion.explanation.systemName}).`,
        },
      }));
    },
    [currentQuestion, currentSubmission?.status, showClue],
  );

  // Submit Mode B 3D click selection (handles Guided Practice 1 retry vs Strict single attempt)
  const submitLocateSelection = useCallback(() => {
    if (!atlas || !currentQuestion || currentQuestion.mode !== 'locate' || !previewPartId) return;
    if (currentSubmission?.status === 'submitted') return;

    const result = evaluateLocateSelection(currentQuestion, previewPartId, atlas);
    const prevAttempts = currentSubmission?.attemptsUsed ?? 0;
    const nextAttempts = prevAttempts + 1;
    const spent = Math.max(1, Math.round((Date.now() - questionStartMsRef.current) / 1000));

    if (result.isCorrect) {
      setSubmissions((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          questionId: currentQuestion.id,
          status: 'submitted',
          isCorrect: true,
          attemptsUsed: nextAttempts,
          clickedPartId: previewPartId,
          clickedConceptId: result.clickedConceptId,
          clickedName: result.clickedName,
          clueUsed: showClue,
          timeSpentSec: spent,
        },
      }));
      setFocusRequest((n) => n + 1);
      return;
    }

    // Missed click: allow 1 retry in Guided Practice on first attempt
    if (activeConfig.preset === 'guided' && prevAttempts === 0) {
      setPreviewPartId(null);
      setSubmissions((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          questionId: currentQuestion.id,
          status: 'retry_available',
          isCorrect: false,
          attemptsUsed: nextAttempts,
          clickedPartId: previewPartId,
          clickedConceptId: result.clickedConceptId,
          clickedName: result.clickedName,
          clueUsed: showClue,
          timeSpentSec: spent,
          missReason: result.missReason,
        },
      }));
      return;
    }

    // Final miss: lock station and illuminate true target structure on the 3D model
    setSubmissions((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        status: 'submitted',
        isCorrect: false,
        attemptsUsed: nextAttempts,
        clickedPartId: previewPartId,
        clickedConceptId: result.clickedConceptId,
        clickedName: result.clickedName,
        clueUsed: showClue,
        timeSpentSec: spent,
        missReason: result.missReason,
      },
    }));
    setFocusRequest((n) => n + 1);
  }, [atlas, currentQuestion, previewPartId, currentSubmission, showClue, activeConfig.preset]);

  // Handle pointer click on the 3D scene
  const handle3DSelect = useCallback(
    (partId: string) => {
      if (!currentQuestion) return;
      if (currentQuestion.mode !== 'locate') {
        // Mode A and Mode C lock the target highlight so orbiting/tapping doesn't replace the structure
        return;
      }
      if (currentSubmission?.status === 'submitted') {
        return;
      }
      setPreviewPartId(partId);
    },
    [currentQuestion, currentSubmission?.status],
  );

  // Build SceneState tailored cleanly for Mode A, Mode B (shell vs system-only), and Mode C
  const sceneState = useMemo<SceneState>(() => {
    if (!currentQuestion) {
      return {
        embedded: true,
        anatomySex: studyState.preferredSex,
        explode: 0,
        visible: DEFAULT_VISIBLE,
        selected: [],
        isolate: false,
        ghostSurroundings: true,
        suppressHoverTooltip: true,
        interactionMode,
        view,
        rotate: false,
        reset: resetCount,
        zoomStep,
        focusRequest,
      };
    }

    const activeSys = CANONICAL_SYSTEMS.find((s) => s.id === currentQuestion.canonicalSystem);
    const activeLayers = new Set<SystemId>(activeSys?.meshSystems ?? []);
    const isSubmitted = currentSubmission?.status === 'submitted';

    if (currentQuestion.mode === 'locate') {
      if (isSubmitted) {
        // After submission in Mode B, ghost surroundings & highlight the true target so student learns exact location
        return {
          embedded: true,
          anatomySex: studyState.preferredSex,
          explode: 0,
          visible: Array.from(new Set([...DEFAULT_VISIBLE, ...activeLayers])),
          selected: currentQuestion.targetElementIds,
          isolate: false,
          ghostSurroundings: true,
          dimmedSystems: undefined,
          suppressHoverTooltip: true,
          interactionMode,
          view,
          rotate: false,
          reset: resetCount,
          zoomStep,
          focusRequest,
        };
      }

      if (locateShellMode === 'system-only') {
        return {
          embedded: true,
          anatomySex: studyState.preferredSex,
          explode: 0,
          visible: Array.from(activeLayers),
          selected: previewPartId ? [previewPartId] : [],
          isolate: false,
          ghostSurroundings: false,
          dimmedSystems: [],
          suppressHoverTooltip: true,
          interactionMode,
          view,
          rotate: false,
          reset: resetCount,
          zoomStep,
          focusRequest,
        };
      }

      // Default Mode B (per Phase 1 choice): Active system solid & clickable inside translucent orientation shell
      const visible = Array.from(new Set([...activeLayers, ...SHELL_LAYERS]));
      const dimmedSystems = SHELL_LAYERS.filter((layer) => !activeLayers.has(layer));
      return {
        embedded: true,
        anatomySex: studyState.preferredSex,
        explode: 0,
        visible,
        selected: previewPartId ? [previewPartId] : [],
        isolate: false,
        ghostSurroundings: false,
        dimmedSystems,
        suppressHoverTooltip: true,
        interactionMode,
        view,
        rotate: false,
        reset: resetCount,
        zoomStep,
        focusRequest,
      };
    }

    // Mode A (Identify) & Mode C (Knowledge): target structure solid teal in transparent body context
    return {
      embedded: true,
      anatomySex: studyState.preferredSex,
      explode: 0,
      visible: Array.from(new Set([...DEFAULT_VISIBLE, ...activeLayers])),
      selected: currentQuestion.targetElementIds,
      isolate: false,
      ghostSurroundings: true,
      dimmedSystems: undefined,
      suppressHoverTooltip: true,
      interactionMode,
      view,
      rotate: false,
      reset: resetCount,
      zoomStep,
      focusRequest,
    };
  }, [
    currentQuestion,
    currentSubmission?.status,
    locateShellMode,
    previewPartId,
    interactionMode,
    view,
    resetCount,
    zoomStep,
    focusRequest,
    studyState.preferredSex,
  ]);

  const runningScore = useMemo(
    () => questions.filter((q) => submissions[q.id]?.isCorrect).length,
    [questions, submissions],
  );
  const completedStationsCount = useMemo(
    () => questions.filter((q) => submissions[q.id]?.status === 'submitted').length,
    [questions, submissions],
  );

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="a360-page a360-plab-page">
      <header className="a360-page-header">
        <p className="a360-kicker">Interactive 3D Spotter & Assessment</p>
        <h1>Anatomy 360 Practical Lab</h1>
        <p className="a360-lead">
          Test genuine anatomical recognition, direct 3D spatial location, and functional knowledge
          on the interactive human model.
        </p>
      </header>

      {stage === 'setup' && (
        <PageOrientationBar
          whatThisIs="A 3D spotter test where the model highlights an organ for you to name—or asks you to tap the right part in 3D."
          primaryHint="Pick your body system, choose Untimed if you want to practice calmly, and press Start Exam."
          spokenSummary="3D Spotter Practical Lab. Choose which body system and difficulty you want, start untimed for calm practice or timed for exam prep, and identify highlighted 3D body parts."
          howToSteps={[
            'Choose All Systems or focus on one system (such as Cardiovascular or Skeletal).',
            'Pick Foundational difficulty and Untimed mode if this is your first spotter test.',
            'Any structure you miss is added automatically to your Weak Areas & Flashcards queue.',
          ]}
        />
      )}

      {stage === 'setup' && (
        <PracticalLabSetup
          atlas={atlas}
          atlasError={atlasError}
          storage={storage}
          initialConfig={activeConfig}
          onStartExam={startExamWithConfig}
          onResetProgress={() => setStorage(clearPracticalLabStorage())}
        />
      )}

      {stage === 'active' && currentQuestion && (
        <div className="a360-plab-active-wrap">
          {/* Exam Telemetry Bar */}
          <div className="a360-plab-topbar">
            <div className="a360-plab-topbar-left">
              <strong className="a360-tabular-count">
                Question {currentIndex + 1} of {questions.length}
              </strong>
              <span className="a360-level-tag">
                {currentQuestion.mode === 'identify'
                  ? 'Mode A · Identify'
                  : currentQuestion.mode === 'locate'
                    ? 'Mode B · Locate in 3D'
                    : 'Mode C · Knowledge'}
              </span>
              <span className="a360-plab-preset-badge">
                {activeConfig.preset === 'strict' ? (
                  <>
                    <ShieldCheck size={13} /> Strict Exam
                  </>
                ) : (
                  <>
                    <Compass size={13} /> Guided Practice
                  </>
                )}
              </span>
            </div>

            <div className="a360-plab-topbar-right">
              <span className="a360-plab-running-score a360-tabular-count">
                Score: {runningScore} / {completedStationsCount}
              </span>

              {activeConfig.timerMode === 'timed' && (
                <span
                  className={`a360-plab-timer a360-tabular-count ${
                    remainingSec <= 20 ? 'is-critical' : remainingSec <= 60 ? 'is-warn' : ''
                  }`}
                  role="timer"
                  aria-live="off"
                >
                  <Clock size={14} />
                  {formatTimer(remainingSec)}
                </span>
              )}

              {!confirmEndOpen ? (
                <button
                  type="button"
                  className="a360-mini-btn"
                  onClick={() => setConfirmEndOpen(true)}
                >
                  End Exam
                </button>
              ) : (
                <div className="a360-plab-confirm-row">
                  <span>Finish now?</span>
                  <button
                    type="button"
                    className="a360-mini-btn active"
                    onClick={() => finalizeExam(false)}
                  >
                    Submit & Grade
                  </button>
                  <button
                    type="button"
                    className="a360-mini-btn"
                    onClick={() => setConfirmEndOpen(false)}
                  >
                    Resume
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="a360-plab-progress-track" aria-hidden="true">
            <div
              className="a360-plab-progress-fill"
              style={{
                width: `${Math.round(
                  ((currentIndex + (currentSubmission?.status === 'submitted' ? 1 : 0)) /
                    Math.max(1, questions.length)) *
                    100,
                )}%`,
              }}
            />
          </div>

          {/* Asymmetric 60 / 40 Examination Stage */}
          <div className="a360-plab-stage-grid">
            {/* Left 60%: Persistent Shared 3D Anatomy Viewer */}
            <div className="a360-plab-viewer-col">
              <div className="a360-embedded-studio">
                <div className="a360-embedded-toolbar">
                  <div className="a360-embedded-toolgroup" role="group" aria-label="Camera views">
                    {(
                      [
                        ['three-quarter', '3/4'],
                        ['front', 'Front'],
                        ['back', 'Back'],
                        ['left', 'Left'],
                        ['right', 'Right'],
                      ] as [View, string][]
                    ).map(([v, label]) => (
                      <button
                        key={v}
                        type="button"
                        className={`a360-mini-btn ${view === v ? 'active' : ''}`}
                        onClick={() => setView(v)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {currentQuestion.mode === 'locate' && (
                    <div
                      className="a360-embedded-toolgroup"
                      role="group"
                      aria-label="Orientation layer visibility"
                    >
                      <button
                        type="button"
                        className={`a360-mini-btn ${locateShellMode === 'shell' ? 'active' : ''}`}
                        onClick={() => setLocateShellMode('shell')}
                        title="Active system solid inside translucent orientation shell"
                      >
                        <Eye size={13} />
                        <span>Orientation Shell</span>
                      </button>
                      <button
                        type="button"
                        className={`a360-mini-btn ${
                          locateShellMode === 'system-only' ? 'active' : ''
                        }`}
                        onClick={() => setLocateShellMode('system-only')}
                        title="Show only active system meshes"
                      >
                        <Layers size={13} />
                        <span>System Only</span>
                      </button>
                    </div>
                  )}

                  <div className="a360-embedded-toolgroup" role="group" aria-label="Camera controls">
                    <button
                      type="button"
                      className={`a360-mini-btn ${interactionMode === 'orbit' ? 'active' : ''}`}
                      onClick={() => setInteractionMode('orbit')}
                    >
                      Orbit
                    </button>
                    <button
                      type="button"
                      className={`a360-mini-btn ${interactionMode === 'pan' ? 'active' : ''}`}
                      onClick={() => setInteractionMode('pan')}
                    >
                      <Hand size={13} />
                      <span>Pan</span>
                    </button>
                    <button
                      type="button"
                      className="a360-mini-btn"
                      aria-label="Zoom in"
                      onClick={() => setZoomStep({ id: Date.now(), delta: 0.78 })}
                    >
                      <ZoomIn size={13} />
                    </button>
                    <button
                      type="button"
                      className="a360-mini-btn"
                      aria-label="Zoom out"
                      onClick={() => setZoomStep({ id: Date.now() + 1, delta: 1.28 })}
                    >
                      <ZoomOut size={13} />
                    </button>
                    {currentQuestion.mode !== 'locate' ||
                    currentSubmission?.status === 'submitted' ? (
                      <button
                        type="button"
                        className="a360-mini-btn"
                        onClick={() => setFocusRequest((n) => n + 1)}
                        title="Refocus highlighted target"
                      >
                        <Crosshair size={13} />
                        <span>Refocus</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="a360-mini-btn"
                        onClick={() => setResetCount((n) => n + 1)}
                        title="Reset camera framing"
                      >
                        <RotateCcw size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="a360-embedded-canvas-box a360-plab-canvas-box">
                  {atlasError || sceneError ? (
                    <div className="a360-embedded-fallback" role="alert">
                      <strong>3D Viewer Unavailable</strong>
                      <span>{atlasError || sceneError}</span>
                    </div>
                  ) : !atlas ? (
                    <div className="a360-embedded-fallback" role="status">
                      <strong>Loading Anatomy Atlas…</strong>
                      <span>Preparing 3D structures</span>
                    </div>
                  ) : (
                    <Suspense
                      fallback={
                        <div className="a360-embedded-fallback" role="status">
                          <strong>Initializing 3D Practical Viewer…</strong>
                          <span>Loading WebGL engine</span>
                        </div>
                      }
                    >
                      <AnatomyScene
                        atlas={atlas}
                        state={sceneState}
                        onSelect={handle3DSelect}
                        onProgress={setSceneProgress}
                        onError={setSceneError}
                      />
                    </Suspense>
                  )}

                  {atlas && !sceneError && sceneProgress < 100 && (
                    <div className="a360-embedded-progress" role="status">
                      <span>Loading 3D Geometry ({sceneProgress}%)</span>
                      <div className="a360-embedded-progress-track">
                        <div style={{ width: `${sceneProgress}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="a360-embedded-hint">
                    <MousePointerClick size={13} />
                    <span>
                      {currentQuestion.mode === 'locate'
                        ? currentSubmission?.status === 'submitted'
                          ? 'Target structure highlighted in clinical teal'
                          : 'Drag to orbit or pan · Click a solid structure mesh, then press Submit Selection'
                        : 'Target highlighted in clinical teal · Labels hidden until submission · Drag to inspect angles'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 40%: Examination Station Panel */}
            <section className="a360-plab-station" aria-label="Examination station">
              <div className="a360-plab-station-meta">
                <span className="a360-kicker">
                  {currentQuestion.explanation.systemName}
                </span>
                <span className="a360-level-tag">{currentQuestion.difficulty}</span>
              </div>

              <h2 className="a360-plab-prompt">{currentQuestion.prompt}</h2>

              {/* Guided Practice Region Clue */}
              {activeConfig.preset === 'guided' && currentSubmission?.status !== 'submitted' && (
                <div className="a360-plab-clue-box">
                  {!showClue ? (
                    <button
                      type="button"
                      className="a360-mini-btn"
                      onClick={() => setShowClue(true)}
                    >
                      <Lightbulb size={13} />
                      Show Region Clue
                    </button>
                  ) : (
                    <div className="a360-disclosure-note" role="note">
                      <Lightbulb size={15} />
                      <span>{currentQuestion.clueText}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Mode A & Mode C: 4 Non-Synonym Multiple-Choice Options */}
              {currentQuestion.mode !== 'locate' && currentQuestion.options && (
                <div className="a360-options-list">
                  {currentQuestion.options.map((opt, idx) => {
                    const submitted = currentSubmission?.status === 'submitted';
                    const isChosen = currentSubmission?.selectedOptionIndex === idx;
                    const isRight = idx === currentQuestion.correctIndex;
                    let cls = '';
                    if (submitted) {
                      if (isRight) cls = 'correct';
                      else if (isChosen) cls = 'incorrect';
                    }
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={submitted}
                        className={`a360-option-btn ${cls}`}
                        onClick={() => submitOptionAnswer(idx)}
                      >
                        <span className="a360-option-letter">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="a360-option-text">{opt}</span>
                        {submitted && isRight && <CheckCircle2 size={18} className="a360-icon-ok" />}
                        {submitted && isChosen && !isRight && (
                          <XCircle size={18} className="a360-icon-err" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Mode B: 3D Click Preview + Explicit Confirm / Guided Retry */}
              {currentQuestion.mode === 'locate' && currentSubmission?.status !== 'submitted' && (
                <div className="a360-plab-locate-controls">
                  {currentSubmission?.status === 'retry_available' && (
                    <div className="a360-plab-retry-banner" role="status">
                      <AlertCircle size={16} />
                      <div>
                        <strong>Guided Practice Retry (1 Attempt Remaining)</strong>
                        <p>{currentSubmission.missReason}</p>
                      </div>
                    </div>
                  )}

                  <div
                    className={`a360-plab-selection-box ${
                      previewPartId ? 'has-selection' : ''
                    }`}
                  >
                    {previewPartId ? (
                      <>
                        <CheckCircle2 size={16} className="a360-icon-ok" />
                        <span>
                          3D mesh highlighted in teal — confirm when ready to submit your answer.
                        </span>
                      </>
                    ) : (
                      <>
                        <MousePointerClick size={16} />
                        <span>
                          Click directly on the target structure in the 3D viewer to preview your
                          selection.
                        </span>
                      </>
                    )}
                  </div>

                  <div className="a360-plab-locate-actions">
                    <button
                      type="button"
                      className="a360-btn-secondary"
                      disabled={!previewPartId}
                      onClick={() => setPreviewPartId(null)}
                    >
                      Clear Selection
                    </button>
                    <button
                      type="button"
                      className="a360-btn-primary"
                      disabled={!previewPartId}
                      onClick={submitLocateSelection}
                    >
                      Submit Selection
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* Locked Post-Submit Explanation */}
              {currentSubmission?.status === 'submitted' && (
                <div
                  className={`a360-quiz-feedback a360-plab-feedback ${
                    currentSubmission.isCorrect ? 'is-ok' : 'is-err'
                  }`}
                >
                  <div className="a360-plab-feedback-head">
                    {currentSubmission.isCorrect ? (
                      <CheckCircle2 size={18} className="a360-icon-ok" />
                    ) : (
                      <XCircle size={18} className="a360-icon-err" />
                    )}
                    <div>
                      <p className="a360-feedback-heading">
                        {currentSubmission.isCorrect ? 'Verified Correct' : 'Incorrect'} ·{' '}
                        {currentQuestion.explanation.verifiedName}
                      </p>
                      {currentQuestion.explanation.commonName && (
                        <span className="a360-muted">
                          Common name: {currentQuestion.explanation.commonName}
                        </span>
                      )}
                    </div>
                  </div>

                  {!currentSubmission.isCorrect && currentSubmission.missReason && (
                    <p className="a360-plab-miss-reason">{currentSubmission.missReason}</p>
                  )}

                  <p>
                    <strong>Location:</strong> {currentQuestion.explanation.location}
                  </p>
                  <p>
                    <strong>Function:</strong> {currentQuestion.explanation.mainFunction}
                  </p>

                  {currentQuestion.explanation.terminology.length > 0 && (
                    <p>
                      <strong>Key Term — {currentQuestion.explanation.terminology[0].term}:</strong>{' '}
                      {currentQuestion.explanation.terminology[0].meaning}
                    </p>
                  )}

                  {currentQuestion.explanation.coverageNote && (
                    <p className="a360-stat-note">
                      Note: {currentQuestion.explanation.coverageNote}
                    </p>
                  )}

                  <div className="a360-plab-feedback-footer">
                    <button
                      type="button"
                      className="a360-inspect-link"
                      onClick={() => onInspectConcept(currentQuestion.targetConceptId)}
                    >
                      <ExternalLink size={13} />
                      Open in 3D Explorer
                    </button>
                    {onOpenStudyContext && (
                      <button
                        type="button"
                        className="a360-btn-secondary"
                        onClick={() =>
                          onOpenStudyContext({
                            conceptId: currentQuestion.targetConceptId,
                            systemId: currentQuestion.canonicalSystem,
                            sourceModule: 'practical_lab',
                          })
                        }
                      >
                        Open in Study Workspace
                        <ArrowRight size={14} />
                      </button>
                    )}

                    {currentIndex < questions.length - 1 ? (
                      <button
                        type="button"
                        className="a360-btn-primary"
                        onClick={() => goToStation(currentIndex + 1)}
                      >
                        Next Station ({currentIndex + 2}/{questions.length})
                        <ArrowRight size={15} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="a360-btn-primary"
                        onClick={() => finalizeExam(false)}
                      >
                        Finish & View Results
                        <ArrowRight size={15} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {stage === 'results' && lastSummary && (
        <PracticalLabResults
          summary={lastSummary}
          questions={questions}
          submissions={submissions}
          onRetake={() => startExamWithConfig(activeConfig)}
          onPracticeWeak={(conceptIds) =>
            startExamWithConfig({
              scope: 'all',
              mode: 'mixed',
              difficulty: 'all',
              questionCount: conceptIds.length,
              timerMode: 'untimed',
              secondsPerQuestion: 60,
              preset: 'guided',
              weakPracticeConceptIds: conceptIds,
              label: `Missed Structures Practice (${conceptIds.length})`,
            })
          }
          onNewSetup={() => setStage('setup')}
          onInspectConcept={onInspectConcept}
          onOpenLearnSystem={onOpenLearnSystem}
          onOpenStudyContext={onOpenStudyContext}
        />
      )}
    </div>
  );
}
