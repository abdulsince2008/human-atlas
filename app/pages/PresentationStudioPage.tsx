import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Copy,
  Download,
  Edit3,
  FileText,
  Film,
  Layers,
  Mic,
  MicOff,
  Pause,
  Play,
  Plus,
  RotateCcw,
  SkipBack,
  SkipForward,
  Square,
  Stethoscope,
  Trash2,
  Upload,
  Video,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import type { Atlas, SystemId, View } from '../anatomy';
import { SYSTEMS } from '../anatomy';
import { SURGICAL_ANATOMY_REGIONS } from '../data/surgical-anatomy';
import { BUILTIN_PRESENTATIONS } from '../presentation/builtin-presentations';
import {
  compileStepToSceneState,
  createBlankStep,
  createNewCustomPresentation,
  duplicatePresentationStep,
  exportPresentationToJson,
  getPresentationTotalDuration,
  importPresentationFromJson,
  loadCustomPresentations,
  reorderSteps,
  saveCustomPresentations,
} from '../presentation/presentation-engine';
import {
  resolveStepCaption,
  resolveStepNarration,
  type AnatomyPresentation,
  type PresentationCategory,
  type PresentationStep,
} from '../presentation/presentation-types';
import {
  PresentationVideoRecorder,
  getVideoRecordingCapability,
  type RecordingOverlayState,
  type RecordingStatus,
} from '../presentation/video-recorder';
import AnatomyScene from '../scene';

interface Props {
  atlas: Atlas | null;
  atlasError?: string;
  initialPresentationId?: string | null;
  onInspectConcept: (conceptId: string) => void;
  onOpenClinical?: () => void;
}

const CATEGORY_LABELS: Record<PresentationCategory, string> = {
  anatomical: 'Anatomical & Dissection',
  pathophysiology: 'Clinical Mechanism',
  surgical_education: 'Surgical Education',
};

const REVIEW_STATUS_LABELS: Record<string, string> = {
  source_reviewed: 'Source Reviewed',
  draft: 'Draft',
  automated_check_passed: 'Auto-Checked',
  under_expert_review: 'Under Faculty Review',
  expert_verified: 'Expert Verified',
};

const PLAYBACK_SPEEDS = [0.5, 1, 1.5, 2] as const;

function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function PresentationStudioPage({
  atlas,
  atlasError,
  initialPresentationId,
  onInspectConcept,
  onOpenClinical,
}: Props) {
  const [customPresentations, setCustomPresentations] = useState<
    AnatomyPresentation[]
  >(() => loadCustomPresentations());

  const allPresentations = useMemo(
    () => [...BUILTIN_PRESENTATIONS, ...customPresentations],
    [customPresentations],
  );

  const [categoryFilter, setCategoryFilter] = useState<
    PresentationCategory | 'all'
  >('all');
  const [activePresentationId, setActivePresentationId] = useState<string>(
    () => {
      if (
        initialPresentationId &&
        BUILTIN_PRESENTATIONS.some((p) => p.id === initialPresentationId)
      ) {
        return initialPresentationId;
      }
      return BUILTIN_PRESENTATIONS[0].id;
    },
  );
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [focusCounter, setFocusCounter] = useState<number>(1);

  // Sync deep-linked presentation ID when navigating from ClinicalPage
  useEffect(() => {
    if (!initialPresentationId) return;
    if (allPresentations.some((p) => p.id === initialPresentationId)) {
      setActivePresentationId(initialPresentationId);
      setActiveStepIndex(0);
      setStepElapsedSec(0);
      setIsPlaying(false);
      setFocusCounter((c) => c + 1);
    }
  }, [initialPresentationId, allPresentations]);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [stepElapsedSec, setStepElapsedSec] = useState<number>(0);

  // Scene loader state
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [sceneError, setSceneError] = useState<string>('');

  // Presenter Mode, Mechanism Guide & Editor state
  const [presenterOpen, setPresenterOpen] = useState<boolean>(true);
  const [mechanismOpen, setMechanismOpen] = useState<boolean>(false);
  const [editorOpen, setEditorOpen] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [importError, setImportError] = useState<string>('');
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(
    null,
  );

  // New annotation draft state
  const [newAnnLabel, setNewAnnLabel] = useState<string>('');
  const [newAnnDetail, setNewAnnDetail] = useState<string>('');

  // Video recording state
  const recordingCap = useMemo(() => getVideoRecordingCapability(), []);
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>(
    recordingCap.supported ? 'idle' : 'unsupported',
  );
  const [includeMic, setIncludeMic] = useState<boolean>(false);
  const [recordingElapsedSec, setRecordingElapsedSec] = useState<number>(0);
  const [recordingNotice, setRecordingNotice] = useState<string>('');
  const [recordedVideo, setRecordedVideo] = useState<{
    url: string;
    mimeType: string;
    sizeBytes: number;
  } | null>(null);

  const stageHostRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<PresentationVideoRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activePresentation = useMemo(
    () =>
      allPresentations.find((p) => p.id === activePresentationId) ??
      BUILTIN_PRESENTATIONS[0],
    [allPresentations, activePresentationId],
  );

  const safeStepIndex = Math.min(
    activeStepIndex,
    Math.max(0, activePresentation.steps.length - 1),
  );
  const activeStep: PresentationStep | undefined =
    activePresentation.steps[safeStepIndex];
  const nextStep: PresentationStep | undefined =
    activePresentation.steps[safeStepIndex + 1];

  const activeCaption = activeStep ? resolveStepCaption(activeStep) : '';
  const activeNarration = activeStep ? resolveStepNarration(activeStep) : '';

  const overlayRef = useRef<RecordingOverlayState>({
    presentationTitle: activePresentation.title,
    stepIndex: safeStepIndex,
    stepCount: activePresentation.steps.length,
    stepTitle: activeStep?.title ?? '',
    explanation: activeCaption,
    annotations: activeStep?.annotations ?? [],
    disclosureNote:
      activeStep?.disclosureNote ?? activePresentation.scientificDisclosure,
  });

  // Video compositor always uses concise on-screen caption (never long teleprompter script)
  useEffect(() => {
    overlayRef.current = {
      presentationTitle: activePresentation.title,
      stepIndex: safeStepIndex,
      stepCount: activePresentation.steps.length,
      stepTitle: activeStep?.title ?? '',
      explanation: activeCaption,
      annotations: activeStep?.annotations ?? [],
      disclosureNote:
        activeStep?.disclosureNote ?? activePresentation.scientificDisclosure,
    };
  }, [activePresentation, activeStep, activeCaption, safeStepIndex]);

  // Persist custom presentations whenever they change
  useEffect(() => {
    saveCustomPresentations(customPresentations);
  }, [customPresentations]);

  // Cleanup recorder and media tracks on unmount
  useEffect(() => {
    return () => {
      recorderRef.current?.dispose();
    };
  }, []);

  // Reset quiz selection when changing step
  useEffect(() => {
    setSelectedQuizOption(null);
  }, [activePresentationId, safeStepIndex]);

  // Deterministic playback timer
  useEffect(() => {
    if (!isPlaying || !activeStep) return;
    const tickMs = 100;
    const timer = window.setInterval(() => {
      setStepElapsedSec((prev) => {
        const next = prev + (tickMs / 1000) * playbackSpeed;
        if (next >= activeStep.durationSec) {
          if (safeStepIndex + 1 < activePresentation.steps.length) {
            setActiveStepIndex((idx) => idx + 1);
            setFocusCounter((c) => c + 1);
            return 0;
          } else {
            setIsPlaying(false);
            return activeStep.durationSec;
          }
        }
        return next;
      });
    }, tickMs);
    return () => window.clearInterval(timer);
  }, [
    isPlaying,
    activeStep,
    playbackSpeed,
    safeStepIndex,
    activePresentation.steps.length,
  ]);

  // Recording duration ticker
  useEffect(() => {
    if (recordingStatus !== 'recording') return;
    const id = window.setInterval(() => {
      setRecordingElapsedSec((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [recordingStatus]);

  const compiledSceneState = useMemo(() => {
    if (!atlas || !activeStep) return null;
    return compileStepToSceneState(activeStep, atlas, focusCounter);
  }, [atlas, activeStep, focusCounter]);

  const selectPresentation = useCallback((id: string) => {
    setActivePresentationId(id);
    setActiveStepIndex(0);
    setStepElapsedSec(0);
    setIsPlaying(false);
    setFocusCounter((c) => c + 1);
    setStatusMessage('');
    setImportError('');
    if (typeof window !== 'undefined') {
      window.location.hash = `#/present?id=${encodeURIComponent(id)}`;
    }
  }, []);

  const goToStep = useCallback((index: number) => {
    setActiveStepIndex(index);
    setStepElapsedSec(0);
    setFocusCounter((c) => c + 1);
  }, []);

  const handleRestart = useCallback(() => {
    setActiveStepIndex(0);
    setStepElapsedSec(0);
    setFocusCounter((c) => c + 1);
    setIsPlaying(true);
  }, []);

  const handleRestoreStepView = useCallback(() => {
    setFocusCounter((c) => c + 1);
  }, []);

  const updateCustomPresentation = useCallback(
    (updater: (prev: AnatomyPresentation) => AnatomyPresentation) => {
      setCustomPresentations((list) =>
        list.map((p) =>
          p.id === activePresentation.id
            ? { ...updater(p), updatedAt: new Date().toISOString() }
            : p,
        ),
      );
    },
    [activePresentation.id],
  );

  const handleDuplicateToEditable = useCallback(() => {
    const cloned: AnatomyPresentation = {
      ...activePresentation,
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `${activePresentation.title} (Custom Copy)`,
      isBuiltIn: false,
      reviewStatus: 'draft',
      updatedAt: new Date().toISOString(),
      steps: activePresentation.steps.map((s) => ({
        ...s,
        camera: { ...s.camera },
        scene: {
          ...s.scene,
          visibleSystems: [...s.scene.visibleSystems],
          selectedConceptIds: [...s.scene.selectedConceptIds],
        },
        annotations: s.annotations.map((a) => ({ ...a })),
      })),
    };
    setCustomPresentations((prev) => [cloned, ...prev]);
    setActivePresentationId(cloned.id);
    setEditorOpen(true);
    setStatusMessage('Duplicated into your editable custom library.');
  }, [activePresentation]);

  const handleCreateNew = useCallback(() => {
    const created = createNewCustomPresentation();
    setCustomPresentations((prev) => [created, ...prev]);
    setActivePresentationId(created.id);
    setActiveStepIndex(0);
    setStepElapsedSec(0);
    setIsPlaying(false);
    setEditorOpen(true);
    setStatusMessage('Created new custom presentation.');
  }, []);

  const handleDeleteCustom = useCallback(
    (id: string) => {
      setCustomPresentations((prev) => prev.filter((p) => p.id !== id));
      if (activePresentationId === id) {
        setActivePresentationId(BUILTIN_PRESENTATIONS[0].id);
        setActiveStepIndex(0);
        setEditorOpen(false);
      }
      setStatusMessage('Removed custom presentation.');
    },
    [activePresentationId],
  );

  const handleExportJson = useCallback(() => {
    const json = exportPresentationToJson(activePresentation);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activePresentation.id}.anatomy360.json`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatusMessage('Exported presentation JSON.');
  }, [activePresentation]);

  const handleImportJsonFile = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? '');
        const { presentation, errors } = importPresentationFromJson(text);
        if (!presentation) {
          setImportError(errors.join(' '));
          return;
        }
        setImportError('');
        setCustomPresentations((prev) => [presentation, ...prev]);
        setActivePresentationId(presentation.id);
        setActiveStepIndex(0);
        setStepElapsedSec(0);
        setStatusMessage(`Imported "${presentation.title}" successfully.`);
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [],
  );

  // Step authoring handlers (for custom presentations)
  const updateActiveStep = useCallback(
    (updater: (step: PresentationStep) => PresentationStep) => {
      if (activePresentation.isBuiltIn) return;
      updateCustomPresentation((pres) => ({
        ...pres,
        steps: pres.steps.map((s, idx) =>
          idx === safeStepIndex ? updater(s) : s,
        ),
      }));
    },
    [activePresentation.isBuiltIn, safeStepIndex, updateCustomPresentation],
  );

  const handleAddStep = useCallback(() => {
    if (activePresentation.isBuiltIn) {
      handleDuplicateToEditable();
      return;
    }
    const newStep = createBlankStep(activePresentation.steps.length + 1);
    updateCustomPresentation((pres) => ({
      ...pres,
      steps: [...pres.steps, newStep],
    }));
    setActiveStepIndex(activePresentation.steps.length);
    setStepElapsedSec(0);
    setEditorOpen(true);
  }, [
    activePresentation.isBuiltIn,
    activePresentation.steps.length,
    handleDuplicateToEditable,
    updateCustomPresentation,
  ]);

  const handleDuplicateStep = useCallback(() => {
    if (activePresentation.isBuiltIn || !activeStep) return;
    const copy = duplicatePresentationStep(activeStep);
    updateCustomPresentation((pres) => {
      const next = [...pres.steps];
      next.splice(safeStepIndex + 1, 0, copy);
      return { ...pres, steps: next };
    });
    setActiveStepIndex(safeStepIndex + 1);
  }, [
    activePresentation.isBuiltIn,
    activeStep,
    safeStepIndex,
    updateCustomPresentation,
  ]);

  const handleMoveStep = useCallback(
    (delta: -1 | 1) => {
      if (activePresentation.isBuiltIn) return;
      const target = safeStepIndex + delta;
      if (target < 0 || target >= activePresentation.steps.length) return;
      updateCustomPresentation((pres) => ({
        ...pres,
        steps: reorderSteps(pres.steps, safeStepIndex, target),
      }));
      setActiveStepIndex(target);
    },
    [
      activePresentation.isBuiltIn,
      activePresentation.steps.length,
      safeStepIndex,
      updateCustomPresentation,
    ],
  );

  const handleDeleteStep = useCallback(() => {
    if (
      activePresentation.isBuiltIn ||
      activePresentation.steps.length <= 1
    ) {
      return;
    }
    updateCustomPresentation((pres) => ({
      ...pres,
      steps: pres.steps.filter((_, i) => i !== safeStepIndex),
    }));
    setActiveStepIndex((idx) => Math.max(0, idx - 1));
  }, [
    activePresentation.isBuiltIn,
    activePresentation.steps.length,
    safeStepIndex,
    updateCustomPresentation,
  ]);

  // Synchronized Video Recording Handlers
  const handleStartRecording = useCallback(async () => {
    if (!recordingCap.supported) {
      setRecordingStatus('unsupported');
      return;
    }
    setRecordingNotice('');
    setRecordedVideo(null);
    setRecordingElapsedSec(0);

    if (!recorderRef.current) {
      recorderRef.current = new PresentationVideoRecorder(
        () => stageHostRef.current?.querySelector('canvas') ?? null,
        () => overlayRef.current,
      );
    }

    try {
      const res = await recorderRef.current.start({
        includeMicrophone: includeMic,
        fps: 30,
        width: 1280,
        height: 720,
      });
      setRecordingStatus('recording');
      if (res.micWarning) {
        setRecordingNotice(res.micWarning);
      } else {
        setRecordingNotice(
          `Recording 1280×720 (${res.mimeType})${res.microphoneActive ? ' with microphone narration' : ' (video only)'}.`,
        );
      }
      if (!isPlaying) {
        setIsPlaying(true);
      }
    } catch (err) {
      setRecordingStatus('error');
      setRecordingNotice(
        err instanceof Error
          ? err.message
          : 'Could not start browser video recording.',
      );
    }
  }, [includeMic, isPlaying, recordingCap.supported]);

  const handlePauseResumeRecording = useCallback(() => {
    if (!recorderRef.current) return;
    if (recordingStatus === 'recording') {
      recorderRef.current.pause();
      setRecordingStatus('paused');
      setIsPlaying(false);
    } else if (recordingStatus === 'paused') {
      recorderRef.current.resume();
      setRecordingStatus('recording');
      setIsPlaying(true);
    }
  }, [recordingStatus]);

  const handleStopRecording = useCallback(async () => {
    if (!recorderRef.current) return;
    setIsPlaying(false);
    try {
      const result = await recorderRef.current.stop();
      setRecordingStatus('stopped');
      setRecordedVideo({
        url: result.url,
        mimeType: result.mimeType,
        sizeBytes: result.blob.size,
      });
      setRecordingNotice(
        `Recording ready (${(result.blob.size / (1024 * 1024)).toFixed(2)} MB, ${result.mimeType}).`,
      );
    } catch (err) {
      setRecordingStatus('error');
      setRecordingNotice(
        err instanceof Error ? err.message : 'Failed to finalize video.',
      );
    }
  }, []);

  const handleDiscardRecording = useCallback(() => {
    recorderRef.current?.dispose();
    recorderRef.current = null;
    setRecordedVideo(null);
    setRecordingElapsedSec(0);
    setRecordingStatus(recordingCap.supported ? 'idle' : 'unsupported');
    setRecordingNotice('');
  }, [recordingCap.supported]);

  const handleDownloadRecording = useCallback(() => {
    if (!recordedVideo) return;
    const ext = recordedVideo.mimeType.includes('mp4') ? 'mp4' : 'webm';
    const a = document.createElement('a');
    a.href = recordedVideo.url;
    a.download = `${activePresentation.id}-recording.${ext}`;
    a.click();
  }, [activePresentation.id, recordedVideo]);

  const filteredPresentations = useMemo(
    () =>
      categoryFilter === 'all'
        ? allPresentations
        : allPresentations.filter((p) => p.category === categoryFilter),
    [allPresentations, categoryFilter],
  );

  const totalDurationSec = useMemo(
    () => getPresentationTotalDuration(activePresentation),
    [activePresentation],
  );

  const progressPct = activeStep
    ? Math.min(100, (stepElapsedSec / Math.max(1, activeStep.durationSec)) * 100)
    : 0;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f4f6f8] text-slate-900">
      <div className="mx-auto max-w-[1600px] px-4 py-4">
        {/* Top Studio Header Bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700 text-white">
              <Film size={18} />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-slate-900">
                Clinical Mechanism &amp; 3D Presentation Studio
              </h1>
              <p className="text-xs text-slate-600">
                Guided 3D clinical explanations, presenter narration scripts, knowledge checks, and local video export.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenClinical && (
              <button
                type="button"
                onClick={onOpenClinical}
                className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-900 hover:bg-teal-100"
              >
                <Stethoscope size={14} /> Clinical Library
              </button>
            )}
            <button
              type="button"
              onClick={() => setPresenterOpen((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                presenterOpen
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              <FileText size={14} /> {presenterOpen ? 'Hide Presenter Script' : 'Presenter Script'}
            </button>
            <button
              type="button"
              onClick={handleCreateNew}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
            >
              <Plus size={14} /> New
            </button>
            <button
              type="button"
              onClick={handleDuplicateToEditable}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
            >
              <Copy size={14} /> Duplicate to Edit
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
            >
              <Download size={14} /> Export JSON
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
            >
              <Upload size={14} /> Import JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImportJsonFile}
            />
          </div>
        </div>

        {(statusMessage || importError) && (
          <div
            className={`mb-3 rounded-lg border px-3 py-2 text-xs ${
              importError
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-teal-200 bg-teal-50 text-teal-900'
            }`}
          >
            {importError || statusMessage}
          </div>
        )}

        {/* Main Studio Grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Left Panel: Clinical Mechanism & Presentation Library */}
          <aside className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs lg:col-span-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Explainer Library ({filteredPresentations.length})
              </h2>
              <span className="text-[11px] text-slate-500">
                {BUILTIN_PRESENTATIONS.length} Built-In · {customPresentations.length} Custom
              </span>
            </div>

            {/* Category filter */}
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  ['all', 'All'],
                  ['pathophysiology', 'Clinical Mechanisms'],
                  ['anatomical', 'Anatomical'],
                  ['surgical_education', 'Surgical Ed'],
                ] as const
              ).map(([cat, label]) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`rounded-md px-2 py-1 text-left text-xs font-medium transition-colors ${
                    categoryFilter === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Presentation Cards */}
            <div className="flex max-h-[520px] flex-col gap-2 overflow-y-auto pr-1">
              {filteredPresentations.map((pres) => {
                const isSelected = pres.id === activePresentation.id;
                const isClinicalMech = Boolean(pres.mechanismProfile);
                return (
                  <div
                    key={pres.id}
                    className={`rounded-lg border p-2.5 transition-colors ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/60'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => selectPresentation(pres.id)}
                      className="w-full text-left"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-700">
                          {CATEGORY_LABELS[pres.category]}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {pres.steps.length} steps · {getPresentationTotalDuration(pres)}s
                        </span>
                      </div>
                      <div className="text-sm font-semibold leading-snug text-slate-900">
                        {pres.title}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                        {pres.subtitle}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700">
                          {pres.region}
                        </span>
                        {pres.difficultyLevel && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5">
                            {pres.difficultyLevel}
                          </span>
                        )}
                        {isClinicalMech && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-900">
                            Mechanism
                          </span>
                        )}
                        <span className="rounded bg-slate-100 px-1.5 py-0.5">
                          {REVIEW_STATUS_LABELS[pres.reviewStatus] ?? pres.reviewStatus}
                        </span>
                      </div>
                    </button>

                    {!pres.isBuiltIn && (
                      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5">
                        <span className="text-[10px] font-medium text-amber-700">
                          Custom · Editable
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustom(pres.id)}
                          className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:text-red-800"
                          aria-label={`Delete ${pres.title}`}
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Scientific Disclosure & Sources */}
            <div className="mt-auto rounded-lg border border-amber-200 bg-amber-50/70 p-2.5 text-xs text-amber-950">
              <div className="mb-1 flex items-center justify-between gap-1.5 font-semibold">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle size={13} className="shrink-0 text-amber-700" />
                  <span>Scientific Scope</span>
                </span>
                <span className="text-[10px] font-medium uppercase text-amber-800">
                  {REVIEW_STATUS_LABELS[activePresentation.reviewStatus] ??
                    activePresentation.reviewStatus}
                </span>
              </div>
              <p className="leading-relaxed text-amber-900/90">
                {activePresentation.scientificDisclosure}
              </p>
              <div className="mt-2 border-t border-amber-200/80 pt-1.5 text-[11px] text-amber-900">
                <strong>Sources:</strong>
                <ul className="mt-1 space-y-0.5">
                  {activePresentation.sources.map((src) => (
                    <li key={src.title}>
                      {src.url ? (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noreferrer"
                          className="underline hover:text-teal-800"
                        >
                          {src.source}: {src.title}
                        </a>
                      ) : (
                        <span>
                          {src.source}: {src.title}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          {/* Main Right Workspace */}
          <section className="flex flex-col gap-3 lg:col-span-9">
            {/* 3D Stage Container */}
            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-[#f4f6f8] shadow-xs">
              <div
                ref={stageHostRef}
                className="relative h-[440px] w-full sm:h-[500px]"
              >
                {atlas && compiledSceneState ? (
                  <AnatomyScene
                    atlas={atlas}
                    state={compiledSceneState}
                    onSelect={(partId) => {
                      const part = atlas.parts.find((p) => p.id === partId);
                      if (part?.conceptId) {
                        setStatusMessage(
                          `Selected 3D structure: ${part.name} (${part.conceptId})`,
                        );
                      }
                    }}
                    onProgress={setLoadProgress}
                    onError={setSceneError}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-slate-600">
                    {atlasError || sceneError || 'Loading 3D anatomical atlas…'}
                  </div>
                )}

                {loadProgress > 0 && loadProgress < 1 && (
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-slate-200">
                    <div
                      className="h-full bg-teal-600 transition-all"
                      style={{ width: `${Math.round(loadProgress * 100)}%` }}
                    />
                  </div>
                )}

                {/* Top-Left Step Badge */}
                <div className="pointer-events-none absolute left-3 top-3 max-w-[60%] rounded-lg bg-slate-900/85 px-3 py-2 text-white backdrop-blur-none">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-teal-300">
                    <span>{CATEGORY_LABELS[activePresentation.category]}</span>
                    <span>•</span>
                    <span>
                      Step {safeStepIndex + 1} / {activePresentation.steps.length}
                    </span>
                    {activeStep?.isConceptualOverlay && (
                      <>
                        <span>•</span>
                        <span className="text-amber-300">Conceptual Overlay</span>
                      </>
                    )}
                  </div>
                  <div className="mt-0.5 text-sm font-semibold leading-tight">
                    {activePresentation.title}
                  </div>
                </div>

                {/* Top-Right Educational Annotation Cards */}
                {activeStep && activeStep.annotations.length > 0 && (
                  <div className="absolute right-3 top-3 flex max-w-[280px] flex-col gap-2">
                    {activeStep.annotations.slice(0, 4).map((ann) => {
                      const borderTone =
                        ann.tone === 'vessel'
                          ? 'border-l-red-500'
                          : ann.tone === 'nerve'
                            ? 'border-l-yellow-400'
                            : ann.tone === 'clinical'
                              ? 'border-l-orange-500'
                              : ann.tone === 'warning'
                                ? 'border-l-amber-400'
                                : 'border-l-teal-400';
                      const hasAnchor = Boolean(ann.anchorConceptId);
                      return (
                        <div
                          key={ann.id}
                          className={`rounded-md border-l-4 ${borderTone} bg-slate-900/82 px-2.5 py-2 text-white shadow-sm backdrop-blur-none`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold leading-tight">
                              {ann.label}
                            </span>
                            {hasAnchor ? (
                              <button
                                type="button"
                                onClick={() =>
                                  onInspectConcept(ann.anchorConceptId!)
                                }
                                className="shrink-0 text-[10px] font-medium text-teal-300 underline hover:text-teal-200"
                              >
                                Inspect 3D
                              </button>
                            ) : (
                              <span className="shrink-0 text-[10px] font-medium text-amber-300">
                                Conceptual
                              </span>
                            )}
                          </div>
                          {ann.detail && (
                            <p className="mt-0.5 text-[11px] leading-snug text-slate-200">
                              {ann.detail}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Recording Live Indicator */}
                {(recordingStatus === 'recording' ||
                  recordingStatus === 'paused') && (
                  <div className="absolute left-3 top-[74px] inline-flex items-center gap-1.5 rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                    <Circle size={9} className="fill-white text-white" />
                    <span>
                      {recordingStatus === 'paused' ? 'PAUSED' : 'REC'}{' '}
                      {formatTime(recordingElapsedSec)}
                    </span>
                  </div>
                )}

                {/* Bottom On-Screen Caption Overlay (matches recorded video caption) */}
                {activeStep && (
                  <div className="absolute inset-x-3 bottom-3 rounded-lg bg-slate-900/86 px-4 py-3 text-white backdrop-blur-none">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h2 className="text-sm font-semibold text-teal-300">
                        {activeStep.title}
                      </h2>
                      {activeStep.subtitle && (
                        <span className="text-xs text-slate-300">
                          {activeStep.subtitle}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-100">
                      {activeCaption}
                    </p>
                    {activeStep.disclosureNote && (
                      <p className="mt-1.5 text-[11px] font-medium text-amber-300">
                        {activeStep.disclosureNote}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Playback Transport + Synchronized Video Recording Strip */}
              <div className="border-t border-slate-200 bg-white px-4 py-3">
                {/* Step Progress Bar */}
                <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full bg-teal-600 transition-all duration-100"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Playback Controls */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsPlaying((p) => !p)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800"
                    >
                      {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                      {isPlaying ? 'Pause' : 'Play'}
                    </button>
                    <button
                      type="button"
                      onClick={handleRestart}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      title="Restart from Step 1"
                    >
                      <RotateCcw size={13} /> Restart
                    </button>
                    <button
                      type="button"
                      onClick={handleRestoreStepView}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      title="Restore this step's camera framing"
                    >
                      Reframe
                    </button>
                    <button
                      type="button"
                      onClick={() => goToStep(Math.max(0, safeStepIndex - 1))}
                      disabled={safeStepIndex === 0}
                      className="rounded-lg border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                      aria-label="Previous step"
                    >
                      <SkipBack size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        goToStep(
                          Math.min(
                            activePresentation.steps.length - 1,
                            safeStepIndex + 1,
                          ),
                        )
                      }
                      disabled={
                        safeStepIndex >= activePresentation.steps.length - 1
                      }
                      className="rounded-lg border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                      aria-label="Next step"
                    >
                      <SkipForward size={14} />
                    </button>

                    <div className="ml-1 flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
                      <span className="text-slate-500">Speed:</span>
                      {PLAYBACK_SPEEDS.map((spd) => (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => setPlaybackSpeed(spd)}
                          className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                            playbackSpeed === spd
                              ? 'bg-slate-900 text-white'
                              : 'text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {spd}×
                        </button>
                      ))}
                    </div>

                    <span className="ml-1 text-xs text-slate-500">
                      Total: {formatTime(totalDurationSec)}
                    </span>
                  </div>

                  {/* Browser-Native Video Recording Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    <label
                      className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs ${
                        recordingCap.microphoneApiAvailable
                          ? 'cursor-pointer bg-slate-50 text-slate-700'
                          : 'cursor-not-allowed bg-slate-100 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={includeMic}
                        disabled={
                          !recordingCap.microphoneApiAvailable ||
                          recordingStatus === 'recording' ||
                          recordingStatus === 'paused'
                        }
                        onChange={(e) => setIncludeMic(e.target.checked)}
                      />
                      {includeMic ? <Mic size={13} /> : <MicOff size={13} />}
                      <span>Mic Narration</span>
                    </label>

                    {recordingStatus !== 'recording' &&
                    recordingStatus !== 'paused' ? (
                      <button
                        type="button"
                        onClick={handleStartRecording}
                        disabled={!recordingCap.supported}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:bg-slate-300 disabled:text-slate-600"
                      >
                        <Video size={14} /> Record Video
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handlePauseResumeRecording}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                        >
                          {recordingStatus === 'paused' ? (
                            <>
                              <Play size={13} /> Resume Rec + Play
                            </>
                          ) : (
                            <>
                              <Pause size={13} /> Pause Rec + Play
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={handleStopRecording}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                        >
                          <Square size={13} /> Stop ({formatTime(recordingElapsedSec)})
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Recording Capability / Status Notice */}
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span>
                    {recordingCap.supported
                      ? `Browser-local 2D+WebGL compositor ready (${recordingCap.preferredMimeType ?? 'video/webm'}). Records 3D canvas + titles + concise captions + annotations locally (presenter script stays private).`
                      : recordingCap.reason ||
                        'Video recording is unavailable in this browser.'}
                  </span>
                  {recordingNotice && (
                    <span className="font-medium text-teal-800">
                      {recordingNotice}
                    </span>
                  )}
                </div>

                {/* Recorded Video Preview & Download Bar */}
                {recordedVideo && (
                  <div className="mt-3 rounded-lg border border-teal-200 bg-teal-50/60 p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-teal-950">
                        Recorded Presentation Preview (Local Browser Export)
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleDownloadRecording}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800"
                        >
                          <Download size={13} /> Download Video
                        </button>
                        <button
                          type="button"
                          onClick={handleDiscardRecording}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Trash2 size={13} /> Discard
                        </button>
                      </div>
                    </div>
                    <video
                      src={recordedVideo.url}
                      controls
                      className="max-h-[260px] w-full rounded-md bg-slate-950"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Presenter Mode / Teleprompter Panel */}
            {presenterOpen && activeStep && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText size={15} className="text-teal-700" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Presenter Teleprompter &amp; Teaching Notes
                    </h3>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      Speaker View Only (Not Burned Into Video)
                    </span>
                  </div>
                  {activePresentation.mechanismProfile && (
                    <button
                      type="button"
                      onClick={() => setMechanismOpen((v) => !v)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-900 hover:bg-teal-100"
                    >
                      <BookOpen size={13} />
                      {mechanismOpen ? 'Hide Mechanism Profile' : 'Clinical Mechanism Profile'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                  {/* Spoken Script */}
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 md:col-span-8">
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Spoken Narration Script — Step {safeStepIndex + 1} ({activeStep.durationSec}s)
                    </div>
                    <p className="text-sm leading-relaxed text-slate-900">
                      {activeNarration}
                    </p>
                    {activeStep.explanation !== activeCaption && (
                      <div className="mt-2 border-t border-slate-200 pt-2 text-xs text-slate-600">
                        <strong className="text-slate-800">Detailed Context:</strong>{' '}
                        {activeStep.explanation}
                      </div>
                    )}
                  </div>

                  {/* Key Learning Point + Next-Step Preview */}
                  <div className="flex flex-col gap-2.5 md:col-span-4">
                    {activeStep.keyLearningPoint && (
                      <div className="rounded-lg border border-teal-200 bg-teal-50/70 p-3">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-teal-800">
                          Key Learning Takeaway
                        </div>
                        <p className="mt-1 text-xs font-medium leading-relaxed text-teal-950">
                          {activeStep.keyLearningPoint}
                        </p>
                      </div>
                    )}

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        {nextStep ? `Up Next — Step ${safeStepIndex + 2}` : 'Final Step'}
                      </div>
                      {nextStep ? (
                        <button
                          type="button"
                          onClick={() => goToStep(safeStepIndex + 1)}
                          className="mt-1 text-left text-xs font-semibold text-slate-900 hover:text-teal-700"
                        >
                          {nextStep.title} →
                        </button>
                      ) : (
                        <p className="mt-1 text-xs text-slate-600">
                          Complete the step knowledge check or stop recording to export video.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expandable Clinical Mechanism Profile */}
                {mechanismOpen && activePresentation.mechanismProfile && (
                  <div className="mt-3 grid grid-cols-1 gap-2.5 border-t border-slate-200 pt-3 text-xs md:grid-cols-3">
                    <div className="rounded-lg bg-slate-50 p-2.5">
                      <strong className="text-slate-900">Normal Anatomy</strong>
                      <p className="mt-1 leading-relaxed text-slate-700">
                        {activePresentation.mechanismProfile.normalAnatomy}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2.5">
                      <strong className="text-slate-900">Initiating Mechanism</strong>
                      <p className="mt-1 leading-relaxed text-slate-700">
                        {activePresentation.mechanismProfile.mechanism}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2.5">
                      <strong className="text-slate-900">Structural Consequences</strong>
                      <p className="mt-1 leading-relaxed text-slate-700">
                        {activePresentation.mechanismProfile.structuralConsequences}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2.5">
                      <strong className="text-slate-900">Functional Consequences</strong>
                      <p className="mt-1 leading-relaxed text-slate-700">
                        {activePresentation.mechanismProfile.functionalConsequences}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2.5">
                      <strong className="text-slate-900">Clinical Correlation</strong>
                      <p className="mt-1 leading-relaxed text-slate-700">
                        {activePresentation.mechanismProfile.clinicalCorrelations}
                      </p>
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2.5">
                      <strong className="text-amber-950">Dataset Limitations</strong>
                      <p className="mt-1 leading-relaxed text-amber-900">
                        {activePresentation.mechanismProfile.datasetLimitations}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Embedded Assessment Check (when present on active step) */}
            {activeStep?.assessmentCheck && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-indigo-700">
                  Step Knowledge Check
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {activeStep.assessmentCheck.question}
                </p>
                <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {activeStep.assessmentCheck.options.map((opt, idx) => {
                    const answered = selectedQuizOption !== null;
                    const isPicked = selectedQuizOption === idx;
                    const isCorrect =
                      idx === activeStep.assessmentCheck!.correctIndex;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSelectedQuizOption(idx)}
                        className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors ${
                          answered && isCorrect
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
                            : answered && isPicked && !isCorrect
                              ? 'border-red-400 bg-red-50 text-red-900'
                              : 'border-slate-200 bg-white text-slate-800 hover:border-indigo-300'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {selectedQuizOption !== null && (
                  <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-white p-2.5 text-xs text-slate-700">
                    <CheckCircle2
                      size={15}
                      className="mt-0.5 shrink-0 text-emerald-600"
                    />
                    <span>{activeStep.assessmentCheck.explanation}</span>
                  </div>
                )}
              </div>
            )}

            {/* Visual Timeline & Authoring Panel */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Layers size={15} className="text-teal-700" />
                  <h2 className="text-sm font-semibold text-slate-900">
                    Presentation Timeline ({activePresentation.steps.length} Steps)
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50"
                  >
                    <Plus size={13} /> Add Step
                  </button>
                  {!activePresentation.isBuiltIn && (
                    <>
                      <button
                        type="button"
                        onClick={handleDuplicateStep}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Copy size={12} /> Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveStep(-1)}
                        disabled={safeStepIndex === 0}
                        className="rounded-md border border-slate-300 bg-white p-1 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                        title="Move step earlier"
                      >
                        <ArrowLeft size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveStep(1)}
                        disabled={
                          safeStepIndex >= activePresentation.steps.length - 1
                        }
                        className="rounded-md border border-slate-300 bg-white p-1 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                        title="Move step later"
                      >
                        <ArrowRight size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteStep}
                        disabled={activePresentation.steps.length <= 1}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-40"
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditorOpen((v) => !v)}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ${
                      editorOpen
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <Edit3 size={12} /> {editorOpen ? 'Hide Step Editor' : 'Edit Step'}
                  </button>
                </div>
              </div>

              {/* Horizontal Step Cards */}
              <div className="flex gap-2.5 overflow-x-auto pb-2">
                {activePresentation.steps.map((step, idx) => {
                  const isCurrent = idx === safeStepIndex;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => goToStep(idx)}
                      className={`flex min-w-[200px] max-w-[230px] shrink-0 flex-col rounded-lg border p-2.5 text-left transition-colors ${
                        isCurrent
                          ? 'border-teal-600 bg-teal-50/70 ring-1 ring-teal-600'
                          : 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span className="text-teal-700">Step {idx + 1}</span>
                        <span className="text-slate-500">{step.durationSec}s</span>
                      </div>
                      <div className="mt-1 line-clamp-2 text-xs font-semibold text-slate-900">
                        {step.title}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1 text-[10px] text-slate-500">
                        <span>{step.camera.view}</span>
                        {step.isConceptualOverlay ? (
                          <span className="text-amber-700">· conceptual</span>
                        ) : null}
                        {step.scene.clipping?.enabled ? (
                          <span>· cutaway</span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Collapsible Step Editor */}
              {editorOpen && activeStep && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  {activePresentation.isBuiltIn ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
                      <span>
                        Built-in presentations are read-only reference sequences. Duplicate this presentation to customize narration scripts, captions, camera presets, layers, and annotations.
                      </span>
                      <button
                        type="button"
                        onClick={handleDuplicateToEditable}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800"
                      >
                        <Copy size={13} /> Duplicate &amp; Edit Now
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {/* Presentation Title */}
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Presentation Title
                        </label>
                        <input
                          type="text"
                          value={activePresentation.title}
                          onChange={(e) =>
                            updateCustomPresentation((p) => ({
                              ...p,
                              title: e.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                        />
                      </div>

                      {/* Step Title */}
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Step Title
                        </label>
                        <input
                          type="text"
                          value={activeStep.title}
                          onChange={(e) =>
                            updateActiveStep((s) => ({
                              ...s,
                              title: e.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                        />
                      </div>

                      {/* Duration & Camera View */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Duration (sec)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={60}
                            value={activeStep.durationSec}
                            onChange={(e) =>
                              updateActiveStep((s) => ({
                                ...s,
                                durationSec: Math.max(
                                  1,
                                  Math.min(60, Number(e.target.value) || 8),
                                ),
                              }))
                            }
                            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Camera Angle
                          </label>
                          <select
                            value={activeStep.camera.view}
                            onChange={(e) =>
                              updateActiveStep((s) => ({
                                ...s,
                                camera: {
                                  ...s.camera,
                                  view: e.target.value as View,
                                },
                              }))
                            }
                            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900"
                          >
                            <option value="three-quarter">Three-Quarter</option>
                            <option value="front">Anterior (Front)</option>
                            <option value="back">Posterior (Back)</option>
                            <option value="left">Left Lateral</option>
                            <option value="right">Right Lateral</option>
                          </select>
                        </div>
                      </div>

                      {/* Concise On-Screen Caption */}
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          On-Screen Caption (Composited Into Video)
                        </label>
                        <textarea
                          rows={2}
                          value={activeStep.captionText ?? activeStep.explanation}
                          onChange={(e) =>
                            updateActiveStep((s) => ({
                              ...s,
                              captionText: e.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                        />
                      </div>

                      {/* Presenter Narration Script */}
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Presenter Narration Script (Teleprompter)
                        </label>
                        <textarea
                          rows={2}
                          value={activeStep.narrationText ?? activeStep.explanation}
                          onChange={(e) =>
                            updateActiveStep((s) => ({
                              ...s,
                              narrationText: e.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                        />
                      </div>

                      {/* Key Learning Point */}
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Key Learning Takeaway
                        </label>
                        <input
                          type="text"
                          value={activeStep.keyLearningPoint ?? ''}
                          onChange={(e) =>
                            updateActiveStep((s) => ({
                              ...s,
                              keyLearningPoint: e.target.value,
                            }))
                          }
                          placeholder="Single high-yield educational takeaway for this step"
                          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                        />
                      </div>

                      {/* Surgical Region & Peel + Scene Toggles */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Surgical Region Focus
                          </label>
                          <select
                            value={activeStep.scene.surgicalRegionId ?? ''}
                            onChange={(e) =>
                              updateActiveStep((s) => ({
                                ...s,
                                scene: {
                                  ...s.scene,
                                  surgicalRegionId: e.target.value || undefined,
                                  peeledLayerCount: e.target.value
                                    ? s.scene.peeledLayerCount ?? 0
                                    : 0,
                                },
                              }))
                            }
                            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900"
                          >
                            <option value="">Whole Body / Custom</option>
                            {SURGICAL_ANATOMY_REGIONS.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.title}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Peeled Layers ({activeStep.scene.peeledLayerCount ?? 0})
                          </label>
                          <input
                            type="range"
                            min={0}
                            max={4}
                            value={activeStep.scene.peeledLayerCount ?? 0}
                            onChange={(e) =>
                              updateActiveStep((s) => ({
                                ...s,
                                scene: {
                                  ...s.scene,
                                  peeledLayerCount: Number(e.target.value),
                                },
                              }))
                            }
                            className="mt-2 w-full"
                          />
                        </div>
                      </div>

                      {/* Scene Toggles */}
                      <div className="flex flex-wrap items-center gap-3 pt-4 text-xs text-slate-700">
                        <label className="inline-flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={Boolean(activeStep.camera.autoRotate)}
                            onChange={(e) =>
                              updateActiveStep((s) => ({
                                ...s,
                                camera: {
                                  ...s.camera,
                                  autoRotate: e.target.checked,
                                },
                              }))
                            }
                          />
                          Auto-Rotate
                        </label>
                        <label className="inline-flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={Boolean(activeStep.scene.ghostSurroundings)}
                            onChange={(e) =>
                              updateActiveStep((s) => ({
                                ...s,
                                scene: {
                                  ...s.scene,
                                  ghostSurroundings: e.target.checked,
                                },
                              }))
                            }
                          />
                          Ghost Surroundings
                        </label>
                        <label className="inline-flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={Boolean(activeStep.scene.clipping?.enabled)}
                            onChange={(e) =>
                              updateActiveStep((s) => ({
                                ...s,
                                scene: {
                                  ...s.scene,
                                  clipping: {
                                    enabled: e.target.checked,
                                    axis: s.scene.clipping?.axis ?? 'x',
                                    offset: s.scene.clipping?.offset ?? 0.5,
                                    inverted: s.scene.clipping?.inverted ?? false,
                                  },
                                },
                              }))
                            }
                          />
                          Cutaway Plane
                        </label>
                      </div>

                      {/* Visible Systems Quick Toggles */}
                      <div className="md:col-span-2">
                        <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Visible Systems
                        </span>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {SYSTEMS.map((sys) => {
                            const active = activeStep.scene.visibleSystems.includes(
                              sys.id,
                            );
                            return (
                              <button
                                key={sys.id}
                                type="button"
                                onClick={() =>
                                  updateActiveStep((s) => {
                                    const has = s.scene.visibleSystems.includes(
                                      sys.id,
                                    );
                                    const next: SystemId[] = has
                                      ? s.scene.visibleSystems.filter(
                                          (id) => id !== sys.id,
                                        )
                                      : [...s.scene.visibleSystems, sys.id];
                                    return {
                                      ...s,
                                      scene: {
                                        ...s.scene,
                                        visibleSystems:
                                          next.length > 0 ? next : [sys.id],
                                      },
                                    };
                                  })
                                }
                                className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                                  active
                                    ? 'bg-teal-700 text-white'
                                    : 'border border-slate-300 bg-white text-slate-600'
                                }`}
                              >
                                {sys.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Quick Annotation Adder */}
                      <div className="md:col-span-2 border-t border-slate-200 pt-2.5">
                        <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Step Annotations ({activeStep.annotations.length})
                        </span>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          <input
                            type="text"
                            placeholder="Annotation label (e.g., Left Ventricle)"
                            value={newAnnLabel}
                            onChange={(e) => setNewAnnLabel(e.target.value)}
                            className="flex-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs"
                          />
                          <input
                            type="text"
                            placeholder="Short educational detail"
                            value={newAnnDetail}
                            onChange={(e) => setNewAnnDetail(e.target.value)}
                            className="flex-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!newAnnLabel.trim()) return;
                              updateActiveStep((s) => ({
                                ...s,
                                annotations: [
                                  ...s.annotations,
                                  {
                                    id: `ann-${Date.now()}`,
                                    label: newAnnLabel.trim(),
                                    detail: newAnnDetail.trim() || undefined,
                                    isConceptual: true,
                                    tone: 'landmark',
                                  },
                                ],
                              }));
                              setNewAnnLabel('');
                              setNewAnnDetail('');
                            }}
                            className="rounded-md bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                          >
                            Add Callout
                          </button>
                        </div>
                        {activeStep.annotations.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {activeStep.annotations.map((ann) => (
                              <span
                                key={ann.id}
                                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2 py-0.5 text-xs text-slate-700"
                              >
                                {ann.label}
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateActiveStep((s) => ({
                                      ...s,
                                      annotations: s.annotations.filter(
                                        (a) => a.id !== ann.id,
                                      ),
                                    }))
                                  }
                                  className="text-red-600 hover:text-red-800"
                                  aria-label={`Remove ${ann.label}`}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
