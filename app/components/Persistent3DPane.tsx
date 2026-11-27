import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Crosshair,
  Eye,
  Focus,
  Hand,
  Layers,
  MousePointerClick,
  RotateCcw,
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
import type { AnatomySex } from '../atlas-layers';

const AnatomyScene = lazy(() => import('../scene'));

export type PersistentContextMode = 'context' | 'system' | 'isolate';

interface Props {
  atlas: Atlas | null;
  effectiveAtlas?: Atlas | null;
  atlasError?: string;
  matchedPartIds: string[];
  systemMeshIds?: SystemId[];
  preferredView?: View;
  anatomySex: AnatomySex;
  onSexChange?: (sex: AnatomySex) => void;
  onSelectConcept?: (conceptId: string, partId: string) => void;
  in3DModel: boolean;
  missingMeshMessage?: string;
  highlightedLabel?: string | null;
  compact?: boolean;
  hideToolbarViews?: boolean;
}

export default function Persistent3DPane({
  atlas,
  effectiveAtlas,
  atlasError,
  matchedPartIds,
  systemMeshIds,
  preferredView = 'three-quarter',
  anatomySex,
  onSexChange,
  onSelectConcept,
  in3DModel,
  missingMeshMessage = 'This concept is included in the study content, but a matching 3D mesh is not currently available.',
  highlightedLabel,
  compact = false,
  hideToolbarViews = false,
}: Props) {
  const [view, setView] = useState<View>(preferredView);
  const [contextMode, setContextMode] = useState<PersistentContextMode>('context');
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('orbit');
  const [resetCount, setResetCount] = useState(0);
  const [zoomStep, setZoomStep] = useState<{ id: number; delta: number } | undefined>(undefined);
  const [focusRequest, setFocusRequest] = useState(1);
  const [sceneProgress, setSceneProgress] = useState(0);
  const [sceneError, setSceneError] = useState('');
  const initialFocusDoneRef = useRef(false);

  const selectionSignature = useMemo(() => matchedPartIds.join(','), [matchedPartIds]);

  useEffect(() => {
    setView(preferredView);
  }, [preferredView]);

  useEffect(() => {
    if (matchedPartIds.length > 0) {
      setFocusRequest((n) => n + 1);
    }
  }, [selectionSignature, anatomySex, matchedPartIds.length]);

  useEffect(() => {
    if (sceneProgress >= 100 && !initialFocusDoneRef.current && matchedPartIds.length > 0) {
      initialFocusDoneRef.current = true;
      setFocusRequest((n) => n + 1);
    }
  }, [sceneProgress, matchedPartIds.length]);

  const lookupAtlas = effectiveAtlas ?? atlas;
  const partToConcept = useMemo(() => {
    const map = new Map<string, string>();
    if (!lookupAtlas) return map;
    for (const p of lookupAtlas.parts) {
      map.set(p.id, p.conceptId);
    }
    return map;
  }, [lookupAtlas]);

  const sceneState = useMemo<SceneState>(() => {
    const baseSystems = systemMeshIds && systemMeshIds.length > 0 ? systemMeshIds : DEFAULT_VISIBLE;
    const visible: SystemId[] =
      contextMode === 'system'
        ? baseSystems
        : Array.from(new Set([...DEFAULT_VISIBLE, ...baseSystems]));

    return {
      embedded: true,
      anatomySex,
      explode: 0,
      visible,
      selected: matchedPartIds,
      isolate: contextMode === 'isolate' && matchedPartIds.length > 0,
      ghostSurroundings: contextMode === 'context' && matchedPartIds.length > 0,
      interactionMode,
      view,
      rotate: false,
      reset: resetCount,
      zoomStep,
      focusRequest,
    };
  }, [
    anatomySex,
    contextMode,
    focusRequest,
    interactionMode,
    matchedPartIds,
    resetCount,
    systemMeshIds,
    view,
    zoomStep,
  ]);

  return (
    <div
      className={`a360-embedded-studio a360-persistent-3d ${compact ? 'is-compact' : ''}`}
      data-testid="persistent-3d-pane"
      data-sex={anatomySex}
      data-in-model={in3DModel ? 'true' : 'false'}
    >
      <div className="a360-embedded-toolbar">
        {!hideToolbarViews && (
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
        )}

        <div className="a360-embedded-toolgroup" role="group" aria-label="3D context mode">
          <button
            type="button"
            className={`a360-mini-btn ${contextMode === 'context' ? 'active' : ''}`}
            onClick={() => setContextMode('context')}
            aria-label="Show ghosted body context"
          >
            <Eye size={13} aria-hidden="true" />
            <span>Body Context</span>
          </button>
          <button
            type="button"
            className={`a360-mini-btn ${contextMode === 'system' ? 'active' : ''}`}
            onClick={() => setContextMode('system')}
            aria-label="Show active system only"
          >
            <Layers size={13} aria-hidden="true" />
            <span>System Only</span>
          </button>
          <button
            type="button"
            className={`a360-mini-btn ${contextMode === 'isolate' ? 'active' : ''}`}
            disabled={matchedPartIds.length === 0}
            onClick={() => setContextMode('isolate')}
            aria-label="Isolate selected structure"
          >
            <Focus size={13} aria-hidden="true" />
            <span>Isolate</span>
          </button>
        </div>

        <div className="a360-embedded-toolgroup" role="group" aria-label="Viewport controls">
          {onSexChange && (
            <>
              <button
                type="button"
                className={`a360-mini-btn ${anatomySex === 'male' ? 'active' : ''}`}
                aria-pressed={anatomySex === 'male'}
                aria-label="Switch 3D viewport to Adult Male"
                onClick={() => onSexChange('male')}
              >
                Male
              </button>
              <button
                type="button"
                className={`a360-mini-btn ${anatomySex === 'female' ? 'active' : ''}`}
                aria-pressed={anatomySex === 'female'}
                aria-label="Switch 3D viewport to Adult Female"
                onClick={() => onSexChange('female')}
              >
                Female
              </button>
            </>
          )}

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
            <Hand size={13} aria-hidden="true" />
            <span>Pan</span>
          </button>
          <button
            type="button"
            className="a360-mini-btn"
            aria-label="Zoom in 3D model"
            onClick={() => setZoomStep({ id: Date.now(), delta: 0.78 })}
          >
            <ZoomIn size={13} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="a360-mini-btn"
            aria-label="Zoom out 3D model"
            onClick={() => setZoomStep({ id: Date.now() + 1, delta: 1.28 })}
          >
            <ZoomOut size={13} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="a360-mini-btn"
            aria-label="Focus selected 3D structure"
            disabled={matchedPartIds.length === 0}
            onClick={() => setFocusRequest((n) => n + 1)}
          >
            <Crosshair size={13} aria-hidden="true" />
            <span>Focus</span>
          </button>
          <button
            type="button"
            className="a360-mini-btn"
            aria-label="Reset 3D camera framing"
            onClick={() => setResetCount((n) => n + 1)}
          >
            <RotateCcw size={13} aria-hidden="true" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {!in3DModel && (
        <div className="a360-study-mesh-notice" role="status">
          <AlertCircle size={15} aria-hidden="true" />
          <span>{missingMeshMessage}</span>
        </div>
      )}

      <div className={`a360-embedded-canvas-box ${compact ? 'is-compact' : ''}`}>
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
                <strong>Initializing 3D Viewport…</strong>
                <span>Loading WebGL engine</span>
              </div>
            }
          >
            <AnatomyScene
              atlas={atlas}
              state={sceneState}
              onSelect={(partId) => {
                if (!onSelectConcept) return;
                const cid = partToConcept.get(partId);
                if (cid) onSelectConcept(cid, partId);
              }}
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
          <MousePointerClick size={13} aria-hidden="true" />
          <span>
            {in3DModel && matchedPartIds.length > 0
              ? `${highlightedLabel ?? 'Selected part'} shown in 3D (${matchedPartIds.length} piece${matchedPartIds.length === 1 ? '' : 's'} · ${anatomySex}) · Drag to spin · Tap any part to study it`
              : `Viewing ${anatomySex} 3D body · Drag to spin, scroll to zoom, or tap any part to sync notes`}
          </span>
        </div>
      </div>
    </div>
  );
}
