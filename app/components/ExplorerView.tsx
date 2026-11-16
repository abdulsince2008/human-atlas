import {
  Activity,
  ArrowUpRight,
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  Focus,
  GitBranch,
  Hand,
  Layers3,
  Maximize2,
  Minimize2,
  Move3d,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Scissors,
  Search,
  SlidersHorizontal,
  Square,
  Undo2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { flushSync } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { registerAtlasTools } from '../agent-tools';
import {
  DEFAULT_VISIBLE,
  SYSTEMS,
  type Atlas,
  type ClipAxis,
  type Concept,
  type InteractionMode,
  type SceneState,
  type SystemId,
  type View,
} from '../anatomy';
import { CURATED_KNOWLEDGE, lookupStructureKnowledge } from '../anatomy-knowledge';
import { canonicalSystemForMeshSystem } from '../anatomy-systems';
import { buildDissectionRegistry } from '../dissection-registry';
import {
  buildSceneStateFromEngine,
  computeClipPlaneEquation,
  createInitialEngineState,
  getAxisLabel,
  hideParts,
  resetEntireModel,
  restoreSingleStructure,
  setClippingState,
  setGroupExplosion,
  setOuterLayerOpacity,
  setRegionLayerDepth,
  setRegionalExplode,
  setStructureOpacity,
  setSystemOpacity,
  toggleIsolateParts,
  undoLastAction,
  type InteractionEngineState,
} from '../interaction-engine';
import AnatomyScene from '../scene';
import { useStudy } from './StudyContext';
import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

interface Props {
  atlas: Atlas | null;
  atlasError: string;
  initialFocusConceptId?: string | null;
  initialFocusPartId?: string | null;
  initialVisibleSystems?: SystemId[] | null;
  onClearExternalIntent: () => void;
  onOpenFullSearch: () => void;
  onOpenRelationships?: (conceptId: string) => void;
}

type RailTab = 'systems' | 'studio';
type StudioSubTab = 'depth' | 'xray' | 'cutaway' | 'motion';

let cachedSoftwareGl: boolean | null = null;
function isSoftwareWebGL(): boolean {
  if (cachedSoftwareGl !== null) return cachedSoftwareGl;
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      cachedSoftwareGl = true;
      return true;
    }
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    cachedSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    cachedSoftwareGl = false;
  }
  return cachedSoftwareGl;
}

const CLIP_MODEL_BOUNDS: { min: [number, number, number]; max: [number, number, number] } = {
  min: [-0.42, -0.02, -0.22],
  max: [0.42, 1.78, 0.22],
};

export default function ExplorerView({
  atlas,
  atlasError,
  initialFocusConceptId,
  initialFocusPartId,
  initialVisibleSystems,
  onClearExternalIntent,
  onOpenFullSearch,
  onOpenRelationships,
}: Props) {
  const studioRef = useRef<HTMLDivElement>(null);
  const detailTitle = useRef<HTMLHeadingElement>(null);
  const { isBookmarked, toggleBookmark } = useStudy();

  const [engine, setEngine] = useState<InteractionEngineState>(() =>
    createInitialEngineState(DEFAULT_VISIBLE),
  );
  const [tapToRemove, setTapToRemove] = useState(false);
  const [view, setView] = useState<View>('three-quarter');
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('orbit');
  const [rotate, setRotate] = useState(false);
  const [zoomStep, setZoomStep] = useState<{ id: number; delta: number } | undefined>(undefined);

  const [railTab, setRailTab] = useState<RailTab>('systems');
  const [studioSubTab, setStudioSubTab] = useState<StudioSubTab>('depth');
  const [xraySystem, setXraySystem] = useState<SystemId>('skeletal');

  const [progress, setProgress] = useState(0);
  const [sceneError, setSceneError] = useState('');
  const [panel, setPanel] = useState<'layers' | 'search' | null>(null);
  const [details, setDetails] = useState(false);
  const [query, setQuery] = useState('');
  const [chosen, setChosen] = useState<Concept | null>(null);
  const [hudHidden, setHudHidden] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [groupAnimTarget, setGroupAnimTarget] = useState<{
    groupId: string;
    startAmount: number;
    targetAmount: number;
    elapsed: number;
    duration: number;
  } | null>(null);

  const error = atlasError || sceneError;

  const registry = useMemo(
    () => (atlas ? buildDissectionRegistry(atlas) : null),
    [atlas],
  );

  const parts = useMemo(() => new Map(atlas?.parts.map((p) => [p.id, p])), [atlas]);
  const conceptsById = useMemo(
    () => new Map(atlas?.concepts.map((c) => [c.id, c])),
    [atlas],
  );

  const counts = useMemo(
    () =>
      Object.fromEntries(
        SYSTEMS.map((s) => [s.id, atlas?.parts.filter((p) => p.system === s.id).length ?? 0]),
      ),
    [atlas],
  );
  const activeSystems = SYSTEMS.filter((s) => counts[s.id] > 0);

  const sceneState: SceneState = useMemo(() => {
    if (!atlas || !registry) {
      return {
        explode: engine.explode,
        visible: engine.visible,
        selected: engine.selected,
        isolate: engine.isolate,
        ghostSurroundings: engine.ghostSurroundings,
        interactionMode,
        view,
        rotate,
        reset: engine.resetCounter,
        zoomStep,
        focusRequest: engine.focusRequestCounter,
      };
    }
    return buildSceneStateFromEngine(engine, registry, atlas, {
      interactionMode,
      view,
      rotate,
      zoomStep,
    });
  }, [atlas, registry, engine, interactionMode, view, rotate, zoomStep]);

  const hiddenSet = useMemo(() => new Set(engine.hiddenPartIds), [engine.hiddenPartIds]);

  const selectedParts = engine.selected
    .map((id) => parts.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const selected = selectedParts[0];
  const system = SYSTEMS.find((s) => s.id === selected?.system);
  const knowledge =
    chosen && selected ? lookupStructureKnowledge(chosen.id, chosen.name, selected.system) : null;
  const canonicalSys = selected ? canonicalSystemForMeshSystem(selected.system) : null;

  const visibleCount = useMemo(() => {
    if (!atlas) return 0;
    const visSet = new Set(engine.visible);
    const selSet = new Set(engine.selected);
    return atlas.parts.filter((p) => {
      if (hiddenSet.has(p.id)) return false;
      return engine.isolate ? selSet.has(p.id) : visSet.has(p.system) || selSet.has(p.id);
    }).length;
  }, [atlas, engine.visible, engine.selected, engine.isolate, hiddenSet]);

  // Selected structure group + depth-layer info
  const selectedGroup = useMemo(() => {
    if (!registry || !selected) return null;
    const gid = registry.partToGroupId.get(selected.id);
    return gid ? registry.groups.find((g) => g.id === gid) ?? null : null;
  }, [registry, selected]);

  const selectedDepthTarget = useMemo(() => {
    if (!registry || !selected) return null;
    for (const region of registry.regions) {
      for (let idx = 0; idx < region.layers.length - 1; idx++) {
        if (region.layers[idx].partIds.includes(selected.id)) {
          return {
            region,
            currentLayerIndex: idx,
            nextDepth: idx + 1,
            nextLayer: region.layers[idx + 1],
          };
        }
      }
    }
    return null;
  }, [registry, selected]);

  const chooseConcept = useCallback((c: Concept, shouldFocus = true) => {
    setChosen(c);
    setEngine((st) => ({
      ...st,
      hiddenPartIds: st.hiddenPartIds.filter((id) => !c.elements.includes(id)),
      selected: c.elements,
      isolate: false,
      focusRequestCounter: shouldFocus ? st.focusRequestCounter + 1 : st.focusRequestCounter,
    }));
    setRotate(false);
    setDetails(true);
    setPanel(null);
  }, []);

  const choosePart = useCallback(
    (id: string, shouldFocus = false) => {
      const p = parts.get(id);
      if (!p) return;

      if (engine.dissectionMode && tapToRemove && !shouldFocus) {
        setEngine((st) => hideParts(st, [id]));
        setDetails(false);
        return;
      }

      setChosen({ id: p.conceptId, name: p.name, elements: [id] });
      setEngine((st) => ({
        ...st,
        selected: [id],
        isolate: false,
        focusRequestCounter: shouldFocus ? st.focusRequestCounter + 1 : st.focusRequestCounter,
      }));
      setRotate(false);
      setDetails(true);
      setPanel(null);
    },
    [parts, engine.dissectionMode, tapToRemove],
  );

  // Handle external navigation requests (from Home, Systems, Learn, Quiz, Search)
  useEffect(() => {
    if (!atlas) return;
    if (initialFocusConceptId) {
      const c = conceptsById.get(initialFocusConceptId);
      if (c) {
        chooseConcept(c, true);
      }
      onClearExternalIntent();
    } else if (initialFocusPartId) {
      if (parts.has(initialFocusPartId)) {
        choosePart(initialFocusPartId, true);
      }
      onClearExternalIntent();
    } else if (initialVisibleSystems && initialVisibleSystems.length > 0) {
      setEngine((st) => ({
        ...st,
        visible: initialVisibleSystems,
        selected: [],
        isolate: false,
        ghostSurroundings: false,
      }));
      setChosen(null);
      setDetails(false);
      onClearExternalIntent();
    }
  }, [atlas, initialFocusConceptId, initialFocusPartId, initialVisibleSystems]);

  useEffect(() => {
    if (!atlas) return;
    return registerAtlasTools(atlas, (c) => flushSync(() => chooseConcept(c, true)));
  }, [atlas, chooseConcept]);

  // Active animation playback loop (only runs when a supported rigid clip is actively playing)
  const activeAnimSpec = useMemo(
    () =>
      registry?.animations.find((a) => a.id === engine.activeAnimationId) ??
      registry?.animations[0] ??
      null,
    [registry, engine.activeAnimationId],
  );

  useEffect(() => {
    if (!engine.animationPlaying || !activeAnimSpec || activeAnimSpec.status !== 'supported_rigid') {
      return;
    }
    let raf = 0;
    let lastTs: number | null = null;
    let lastCommitTs = 0;
    const minStepMs = isSoftwareWebGL() ? 180 : 33;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (lastTs === null) {
        lastTs = now;
        return;
      }
      if (now - lastCommitTs < minStepMs) return;
      const dt = Math.max(0, Math.min((now - lastTs) / 1000, 0.25));
      lastTs = now;
      lastCommitTs = now;
      setEngine((st) => {
        if (!st.animationPlaying) return st;
        const deltaProg = (dt * st.animationSpeed) / Math.max(0.4, activeAnimSpec.durationSec);
        const rawNext = st.animationProgress + deltaProg;
        if (st.animationLoop) {
          return { ...st, animationProgress: rawNext % 1 };
        }
        if (rawNext >= 1) {
          return { ...st, animationProgress: 1, animationPlaying: false };
        }
        return { ...st, animationProgress: rawNext };
      });
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [engine.animationPlaying, activeAnimSpec]);

  const getGroupSystems = useCallback(
    (partIds: string[]): SystemId[] => {
      if (!atlas) return [];
      const setIds = new Set(partIds);
      const sysSet = new Set<SystemId>();
      for (const p of atlas.parts) {
        if (setIds.has(p.id)) sysSet.add(p.system);
      }
      return [...sysSet];
    },
    [atlas],
  );

  const triggerAnimatedGroupExplode = useCallback(
    (groupId: string | null, explodeIt: boolean, frameCamera = true) => {
      if (!registry || !groupId) {
        setGroupAnimTarget(null);
        setEngine((st) => setGroupExplosion(st, null, 0, true));
        return;
      }
      const grp = registry.groups.find((g) => g.id === groupId);
      if (!grp) return;

      if (!explodeIt) {
        const startAmt =
          engine.groupExplosion?.groupId === groupId ? engine.groupExplosion.amount : 0;
        if (startAmt <= 0.02) {
          setGroupAnimTarget(null);
          setEngine((st) => setGroupExplosion(st, null, 0, true, grp.partIds));
          return;
        }
        setGroupAnimTarget({
          groupId,
          startAmount: startAmt,
          targetAmount: 0,
          elapsed: 0,
          duration: isSoftwareWebGL() ? 0.36 : 0.65,
        });
        return;
      }

      const ensureSystems = getGroupSystems(grp.partIds);
      if (frameCamera) {
        setView('three-quarter');
        setRotate(false);
      }
      setEngine((st) =>
        setGroupExplosion(
          st,
          grp.id,
          0.04,
          true,
          grp.partIds,
          frameCamera ? grp.extractedFocusBounds : undefined,
          ensureSystems,
        ),
      );
      setGroupAnimTarget({
        groupId: grp.id,
        startAmount: 0.04,
        targetAmount: 1.0,
        elapsed: 0,
        duration: isSoftwareWebGL() ? 0.56 : 1.05,
      });
    },
    [registry, engine.groupExplosion, getGroupSystems],
  );

  useEffect(() => {
    if (!groupAnimTarget || !registry) return;
    const grp = registry.groups.find((g) => g.id === groupAnimTarget.groupId);
    if (!grp) {
      setGroupAnimTarget(null);
      return;
    }
    const ensureSystems = getGroupSystems(grp.partIds);
    let raf = 0;
    let startTs: number | null = null;
    let lastCommitTs = 0;
    const minStepMs = isSoftwareWebGL() ? 270 : 30;
    const durationMs = Math.max(100, groupAnimTarget.duration * 1000);

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (startTs === null) {
        startTs = now - groupAnimTarget.elapsed * 1000;
        lastCommitTs = now;
        return;
      }
      if (now - lastCommitTs < minStepMs) return;
      lastCommitTs = now;
      const t = Math.max(0, Math.min(1, (now - startTs) / durationMs));
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const nextAmt =
        groupAnimTarget.startAmount +
        (groupAnimTarget.targetAmount - groupAnimTarget.startAmount) * eased;

      if (t >= 1) {
        const finalTarget = groupAnimTarget.targetAmount;
        setGroupAnimTarget(null);
        setEngine((st) =>
          setGroupExplosion(
            st,
            finalTarget <= 0.005 ? null : grp.id,
            finalTarget <= 0.005 ? 0 : finalTarget,
            false,
            grp.partIds,
            undefined,
            finalTarget <= 0.005 ? undefined : ensureSystems,
          ),
        );
        return;
      }

      setEngine((st) =>
        setGroupExplosion(st, grp.id, nextAmt, false, grp.partIds, undefined, ensureSystems),
      );
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [groupAnimTarget, registry, getGroupSystems]);

  // Keyboard shortcuts: / search, H toggle HUD, Ctrl/Cmd+Z Undo
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === 'z' &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setGroupAnimTarget(null);
        setEngine((st) => undoLastAction(st));
        return;
      }
      if (
        e.key === '/' &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setPanel('search');
        setDetails(false);
      } else if (
        (e.key === 'h' || e.key === 'H') &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        setHudHidden((v) => !v);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const searchResults = useMemo(() => {
    if (!atlas) return [];
    const term = query.toLowerCase().trim();
    if (!term) {
      return [
        'heart',
        'brain',
        'frontal bone',
        'mandible',
        'liver',
        'stomach',
        'spleen',
        'trachea',
        'femur',
        'skull',
      ]
        .map((name) => atlas.concepts.find((c) => c.name.toLowerCase() === name))
        .filter((x): x is Concept => Boolean(x));
    }

    const synonymHits = new Set<string>();
    for (const k of CURATED_KNOWLEDGE) {
      if (!k.inModel) continue;
      if (
        k.commonName.toLowerCase().includes(term) ||
        k.synonyms.some((syn) => syn.toLowerCase().includes(term))
      ) {
        synonymHits.add(k.conceptId);
      }
    }

    return atlas.concepts
      .filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.id.toLowerCase().includes(term) ||
          synonymHits.has(c.id),
      )
      .sort((a, b) => {
        const aExact = a.name.toLowerCase() === term ? -1 : 0;
        const bExact = b.name.toLowerCase() === term ? -1 : 0;
        if (aExact !== bExact) return aExact - bExact;
        return a.name.length - b.name.length;
      })
      .slice(0, 80);
  }, [atlas, query]);

  const toggleSystem = (id: SystemId) => {
    setDetails(false);
    setEngine((st) => ({
      ...st,
      selected: [],
      isolate: false,
      ghostSurroundings: false,
      visible: st.visible.includes(id)
        ? st.visible.filter((x) => x !== id)
        : [...st.visible, id],
    }));
  };

  const reset = () => {
    setGroupAnimTarget(null);
    setEngine((st) => resetEntireModel(st, DEFAULT_VISIBLE));
    setView('three-quarter');
    setInteractionMode('orbit');
    setRotate(false);
    setTapToRemove(false);
    setChosen(null);
    setDetails(false);
    setPanel(null);
  };

  const openPanel = (next: 'layers' | 'search') => {
    setDetails(false);
    setPanel((p) => (p === next ? null : next));
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && studioRef.current?.requestFullscreen) {
        await studioRef.current.requestFullscreen();
      } else if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      // Embedded preview iframes may block fullscreen API.
    }
  };

  const triggerZoom = (delta: number) => {
    setZoomStep((z) => ({ id: (z?.id ?? 0) + 1, delta }));
  };

  const presetViews: { id: View; short: string; label: string }[] = [
    { id: 'three-quarter', short: '¾', label: 'Three-quarter view' },
    { id: 'front', short: 'F', label: 'Front (anterior) view' },
    { id: 'back', short: 'B', label: 'Back (posterior) view' },
    { id: 'left', short: 'L', label: 'Left lateral view' },
    { id: 'right', short: 'R', label: 'Right lateral view' },
  ];

  const activeRegion =
    registry?.regions.find((r) => r.id === engine.activeRegionId) ?? registry?.regions[0] ?? null;
  const activeDepthLevel = activeRegion
    ? engine.activeLayerDepthByRegion[activeRegion.id] ?? 0
    : 0;

  const selectedOpacity =
    selected ? engine.partOpacities[selected.id] ?? 1 : 1;

  const clipEq = computeClipPlaneEquation(engine.clipping, CLIP_MODEL_BOUNDS);

  const selectAndPlayAnimation = (animId: string, autoPlay = true) => {
    if (!registry) return;
    const spec = registry.animations.find((a) => a.id === animId);
    if (!spec || spec.status !== 'supported_rigid') {
      setEngine((st) => ({
        ...st,
        activeAnimationId: animId,
        animationPlaying: false,
      }));
      return;
    }
    setEngine((st) => {
      // Make sure skeletal/relevant parts are visible and not hidden
      const vis = new Set(st.visible);
      vis.add('skeletal');
      const hidden = st.hiddenPartIds.filter((id) => !spec.involvedPartIds.includes(id));
      return {
        ...st,
        visible: [...vis],
        hiddenPartIds: hidden,
        isolate: false,
        explode: 0,
        activeAnimationId: animId,
        animationPlaying: autoPlay,
        animationLoop: spec.defaultLoop,
        animationProgress: autoPlay && st.activeAnimationId !== animId ? 0 : st.animationProgress,
        focusBox: spec.focusBounds
          ? {
              min: [...spec.focusBounds.min],
              max: [...spec.focusBounds.max],
              request: st.focusRequestCounter + 1,
            }
          : st.focusBox,
        focusRequestCounter: spec.focusBounds ? st.focusRequestCounter + 1 : st.focusRequestCounter,
      };
    });
  };

  return (
    <div className="studio" ref={studioRef}>
      {atlas && (
        <AnatomyScene
          atlas={atlas}
          state={{ ...sceneState, inspectorOpen: details && selectedParts.length > 0 }}
          onSelect={(id) => choosePart(id, false)}
          onProgress={(n) => {
            setProgress(n);
            if (n === 100) setSceneError('');
          }}
          onError={setSceneError}
        />
      )}

      <div className="vignette" />

      {!hudHidden && (
        <>
          <div className="explorer-header">
            <div className="explorer-identity">
              <span className="explorer-title">3D Human Anatomy</span>
              <span className="explorer-meta" data-testid="explorer-visible-count">
                {atlas ? atlas.parts.length.toLocaleString() : '2,234'} meshes ·{' '}
                {visibleCount.toLocaleString()} visible
                {engine.hiddenPartIds.length > 0
                  ? ` · ${engine.hiddenPartIds.length} dissected`
                  : ''}
                {engine.clipping.enabled ? ` · ${getAxisLabel(engine.clipping.axis)} cut` : ''}
              </span>
            </div>

            <div className="explorer-top-actions">
              <Button
                variant="ghost"
                data-testid="dissect-mode-btn"
                className={engine.dissectionMode ? 'active' : ''}
                aria-pressed={engine.dissectionMode}
                onClick={() => {
                  setEngine((st) => ({ ...st, dissectionMode: !st.dissectionMode }));
                  if (!engine.dissectionMode) {
                    setRailTab('studio');
                    setStudioSubTab('depth');
                  }
                }}
                title="Toggle Dissection Mode & Layer Lab"
              >
                <Scissors size={16} />
                <span>{engine.dissectionMode ? 'Dissecting' : 'Dissect'}</span>
              </Button>

              <Button
                variant="ghost"
                data-testid="undo-action-btn"
                disabled={engine.history.length === 0}
                onClick={() => {
                  setGroupAnimTarget(null);
                  setEngine((st) => undoLastAction(st));
                }}
                title="Undo last action (Ctrl+Z)"
                aria-label="Restore last action"
              >
                <Undo2 size={16} />
                <span>Restore Last</span>
              </Button>

              <Button
                variant="ghost"
                className={panel === 'search' ? 'active' : ''}
                onClick={() => openPanel('search')}
                aria-label="Quick search structures"
              >
                <Search size={17} />
                <span>Find structure</span>
                <kbd>/</kbd>
              </Button>
              <Button
                variant="ghost"
                className="icon-button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen viewer'}
              >
                {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
              </Button>
            </div>
          </div>

          <section
            className={`layers-panel glass ${panel === 'layers' ? 'mobile-open' : ''}`}
            aria-label="Anatomical layers and dissection studio"
          >
            <div className="panel-heading">
              <div className="studio-rail-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={railTab === 'systems'}
                  className={railTab === 'systems' ? 'active' : ''}
                  onClick={() => setRailTab('systems')}
                >
                  Systems ({activeSystems.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  data-testid="studio-tab-btn"
                  aria-selected={railTab === 'studio'}
                  className={railTab === 'studio' ? 'active' : ''}
                  onClick={() => setRailTab('studio')}
                >
                  Dissect Lab
                </button>
              </div>
              <Button
                variant="ghost"
                className="mobile-only icon-button"
                onClick={() => setPanel(null)}
                aria-label="Close panel"
              >
                <X size={18} />
              </Button>
            </div>

            {railTab === 'systems' ? (
              <>
                <div className="layer-presets">
                  <Button
                    variant="ghost"
                    aria-pressed={activeSystems.every((x) => engine.visible.includes(x.id))}
                    onClick={() =>
                      setEngine((st) => ({
                        ...st,
                        selected: [],
                        isolate: false,
                        ghostSurroundings: false,
                        visible: activeSystems.map((x) => x.id),
                      }))
                    }
                  >
                    All
                  </Button>
                  <Button
                    variant="ghost"
                    aria-pressed={engine.visible.length === 1 && engine.visible[0] === 'skeletal'}
                    onClick={() =>
                      setEngine((st) => ({
                        ...st,
                        selected: [],
                        isolate: false,
                        ghostSurroundings: false,
                        visible: ['skeletal'],
                      }))
                    }
                  >
                    Skeleton
                  </Button>
                  <Button
                    variant="ghost"
                    aria-pressed={
                      engine.visible.length === 6 &&
                      ['cardiac', 'respiratory', 'digestive', 'urinary', 'endocrine', 'reproductive'].every(
                        (id) => engine.visible.includes(id as SystemId),
                      )
                    }
                    onClick={() =>
                      setEngine((st) => ({
                        ...st,
                        selected: [],
                        isolate: false,
                        ghostSurroundings: false,
                        visible: [
                          'cardiac',
                          'respiratory',
                          'digestive',
                          'urinary',
                          'endocrine',
                          'reproductive',
                        ],
                      }))
                    }
                  >
                    Organs
                  </Button>
                </div>

                {engine.hiddenPartIds.length > 0 && (
                  <div className="dissected-banner">
                    <span>{engine.hiddenPartIds.length} hidden pieces</span>
                    <button
                      type="button"
                      data-testid="restore-all-hidden-btn"
                      onClick={() =>
                        setEngine((st) => restoreSingleStructure(st, st.hiddenPartIds))
                      }
                    >
                      Restore all
                    </button>
                  </div>
                )}

                <div className="system-list">
                  {activeSystems.map((s) => (
                    <div
                      className={`system-row ${engine.visible.includes(s.id) ? 'enabled' : ''}`}
                      key={s.id}
                    >
                      <Button
                        variant="ghost"
                        className="system-name"
                        title={`Show only ${s.name.toLowerCase()}`}
                        onClick={() =>
                          setEngine((st) => ({
                            ...st,
                            visible: [s.id],
                            isolate: false,
                            ghostSurroundings: false,
                            selected: [],
                          }))
                        }
                      >
                        <span className="system-dot" style={{ background: s.color }} />
                        {s.name}
                        <span className="system-count">{counts[s.id]}</span>
                      </Button>
                      <Switch
                        checked={engine.visible.includes(s.id)}
                        onCheckedChange={() => toggleSystem(s.id)}
                        aria-label={`Show ${s.name.toLowerCase()}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="panel-foot">
                  <span>{visibleCount.toLocaleString()} visible</span>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setEngine((st) => ({
                        ...st,
                        visible: [],
                        selected: [],
                        isolate: false,
                        ghostSurroundings: false,
                      }))
                    }
                  >
                    Hide all
                  </Button>
                </div>
              </>
            ) : (
              <div className="studio-tab-body">
                <div className="studio-subtabs" role="tablist">
                  <button
                    type="button"
                    data-testid="studio-subtab-depth"
                    className={studioSubTab === 'depth' ? 'active' : ''}
                    onClick={() => setStudioSubTab('depth')}
                  >
                    Depth
                  </button>
                  <button
                    type="button"
                    data-testid="studio-subtab-xray"
                    className={studioSubTab === 'xray' ? 'active' : ''}
                    onClick={() => setStudioSubTab('xray')}
                  >
                    X-Ray
                  </button>
                  <button
                    type="button"
                    data-testid="studio-subtab-cutaway"
                    className={studioSubTab === 'cutaway' ? 'active' : ''}
                    onClick={() => setStudioSubTab('cutaway')}
                  >
                    Cutaway
                  </button>
                  <button
                    type="button"
                    data-testid="studio-subtab-motion"
                    className={studioSubTab === 'motion' ? 'active' : ''}
                    onClick={() => setStudioSubTab('motion')}
                  >
                    Motion
                  </button>
                </div>

                <div className="studio-scroll">
                  {studioSubTab === 'depth' && registry && activeRegion && (
                    <div className="studio-section">
                      <div className="studio-row-between">
                        <label htmlFor="dissect-tap-mode" className="studio-label">
                          Tap directly removes mesh
                        </label>
                        <Switch
                          id="dissect-tap-mode"
                          checked={tapToRemove}
                          onCheckedChange={(v) => {
                            setTapToRemove(v);
                            if (v && !engine.dissectionMode) {
                              setEngine((st) => ({ ...st, dissectionMode: true }));
                            }
                          }}
                        />
                      </div>

                      <div className="studio-field">
                        <span className="studio-label">Dissection Region</span>
                        <select
                          aria-label="Dissection region"
                          data-testid="dissection-region-select"
                          className="studio-select"
                          value={activeRegion.id}
                          onChange={(e) => {
                            const regId = e.target.value;
                            setEngine((st) =>
                              setRegionLayerDepth(
                                st,
                                registry,
                                regId,
                                st.activeLayerDepthByRegion[regId] ?? 0,
                              ),
                            );
                          }}
                        >
                          {registry.regions.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="depth-stepper-bar">
                        <Button
                          variant="ghost"
                          data-testid="depth-prev-btn"
                          disabled={activeDepthLevel <= 0}
                          onClick={() =>
                            setEngine((st) =>
                              setRegionLayerDepth(
                                st,
                                registry,
                                activeRegion.id,
                                activeDepthLevel - 1,
                              ),
                            )
                          }
                        >
                          <ChevronLeft size={15} />
                          Restore Layer
                        </Button>
                        <span className="depth-step-badge">
                          {activeDepthLevel} / {activeRegion.layers.length - 1}
                        </span>
                        <Button
                          variant="ghost"
                          data-testid="depth-next-btn"
                          disabled={activeDepthLevel >= activeRegion.layers.length - 1}
                          onClick={() =>
                            setEngine((st) =>
                              setRegionLayerDepth(
                                st,
                                registry,
                                activeRegion.id,
                                activeDepthLevel + 1,
                              ),
                            )
                          }
                        >
                          Peel Next
                          <ChevronRight size={15} />
                        </Button>
                      </div>

                      <div className="depth-layer-list">
                        {activeRegion.layers.map((layer, idx) => {
                          const removed = idx < activeDepthLevel;
                          const current = idx === activeDepthLevel;
                          return (
                            <button
                              type="button"
                              key={layer.id}
                              data-testid={`depth-layer-${idx}`}
                              className={`depth-layer-item ${current ? 'current' : ''} ${
                                removed ? 'removed' : ''
                              }`}
                              onClick={() =>
                                setEngine((st) =>
                                  setRegionLayerDepth(st, registry, activeRegion.id, idx),
                                )
                              }
                            >
                              <div className="depth-layer-head">
                                <strong>{layer.label}</strong>
                                <span>{layer.partIds.length} meshes</span>
                              </div>
                              <p>{current ? layer.exposesSummary : layer.description}</p>
                              {layer.missingAssetNote && (
                                <em className="missing-note">{layer.missingAssetNote}</em>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {activeRegion.missingAssets.length > 0 && (
                        <div className="honest-asset-box">
                          <strong>Dataset asset boundaries</strong>
                          <ul>
                            {activeRegion.missingAssets.map((note) => (
                              <li key={note}>{note}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {studioSubTab === 'xray' && (
                    <div className="studio-section">
                      <div className="studio-field">
                        <div className="studio-row-between">
                          <span className="studio-label">Outer Layer (Body Surface)</span>
                          <output className="studio-val">
                            {Math.round(engine.outerLayerOpacity * 100)}%
                          </output>
                        </div>
                        <Slider
                          min={5}
                          max={100}
                          step={5}
                          aria-label="Outer layer opacity"
                          value={[Math.round(engine.outerLayerOpacity * 100)]}
                          onValueChange={(v) => {
                            const val = Array.isArray(v) ? v[0] : v;
                            setEngine((st) => setOuterLayerOpacity(st, val / 100, false));
                          }}
                        />
                      </div>

                      <div className="studio-field">
                        <div className="studio-row-between">
                          <span className="studio-label">System X-Ray</span>
                          <output className="studio-val">
                            {Math.round((engine.systemOpacities[xraySystem] ?? 1) * 100)}%
                          </output>
                        </div>
                        <select
                          aria-label="Select anatomical system for X-Ray"
                          data-testid="system-xray-select"
                          className="studio-select"
                          value={xraySystem}
                          onChange={(e) => setXraySystem(e.target.value as SystemId)}
                        >
                          {activeSystems.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        <Slider
                          min={5}
                          max={100}
                          step={5}
                          aria-label="System X-Ray opacity"
                          value={[Math.round((engine.systemOpacities[xraySystem] ?? 1) * 100)]}
                          onValueChange={(v) => {
                            const val = Array.isArray(v) ? v[0] : v;
                            setEngine((st) => setSystemOpacity(st, xraySystem, val / 100, false));
                          }}
                        />
                      </div>

                      {selected && (
                        <div className="studio-field">
                          <div className="studio-row-between">
                            <span className="studio-label">
                              Selected ({selected.name})
                            </span>
                            <output className="studio-val">
                              {Math.round(selectedOpacity * 100)}%
                            </output>
                          </div>
                          <Slider
                            min={5}
                            max={100}
                            step={5}
                            aria-label="Selected structure opacity"
                            value={[Math.round(selectedOpacity * 100)]}
                            onValueChange={(v) => {
                              const val = Array.isArray(v) ? v[0] : v;
                              setEngine((st) =>
                                setStructureOpacity(st, st.selected, val / 100, false),
                              );
                            }}
                          />
                        </div>
                      )}

                      <div className="studio-preset-grid">
                        <Button
                          variant="ghost"
                          data-testid="xray-skeleton-preset"
                          onClick={() =>
                            setEngine((st) => setSystemOpacity(st, 'skeletal', 0.22, true))
                          }
                        >
                          Ghost Skeleton (22%)
                        </Button>
                        <Button
                          variant="ghost"
                          data-testid="xray-restore-all"
                          onClick={() =>
                            setEngine((st) => ({
                              ...st,
                              partOpacities: {},
                              systemOpacities: {},
                              outerLayerOpacity: 1,
                              ghostSurroundings: false,
                            }))
                          }
                        >
                          Restore Solid
                        </Button>
                      </div>
                    </div>
                  )}

                  {studioSubTab === 'cutaway' && (
                    <div className="studio-section">
                      <div className="studio-row-between">
                        <label htmlFor="cutaway-switch" className="studio-label">
                          Cross-Section Clipping Plane
                        </label>
                        <Switch
                          id="cutaway-switch"
                          data-testid="cutaway-enable-switch"
                          checked={engine.clipping.enabled}
                          onCheckedChange={(enabled) =>
                            setEngine((st) => setClippingState(st, { enabled }, true))
                          }
                        />
                      </div>

                      <div className="studio-field">
                        <span className="studio-label">Anatomical Plane Orientation</span>
                        <div className="axis-segmented">
                          {(['x', 'y', 'z'] as ClipAxis[]).map((ax) => (
                            <button
                              type="button"
                              key={ax}
                              data-testid={`cutaway-axis-${ax}`}
                              className={engine.clipping.axis === ax ? 'active' : ''}
                              onClick={() =>
                                setEngine((st) =>
                                  setClippingState(st, { axis: ax, enabled: true }, true),
                                )
                              }
                            >
                              {getAxisLabel(ax)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="studio-field">
                        <div className="studio-row-between">
                          <span className="studio-label">Plane Offset</span>
                          <output className="studio-val">
                            {clipEq.worldCoordinate.toFixed(2)} m
                          </output>
                        </div>
                        <Slider
                          min={2}
                          max={98}
                          step={1}
                          aria-label="Cross section slice position"
                          value={[Math.round(engine.clipping.offset * 100)]}
                          onValueChange={(v) => {
                            const val = Array.isArray(v) ? v[0] : v;
                            setEngine((st) =>
                              setClippingState(st, { offset: val / 100, enabled: true }, false),
                            );
                          }}
                        />
                      </div>

                      <div className="studio-preset-grid">
                        <Button
                          variant="ghost"
                          data-testid="cutaway-flip-btn"
                          onClick={() =>
                            setEngine((st) =>
                              setClippingState(
                                st,
                                { inverted: !st.clipping.inverted, enabled: true },
                                true,
                              ),
                            )
                          }
                        >
                          Reverse Cut Side
                        </Button>
                        <Button
                          variant="ghost"
                          data-testid="cutaway-reset-btn"
                          onClick={() =>
                            setEngine((st) =>
                              setClippingState(
                                st,
                                { enabled: false, axis: 'x', offset: 0.5, inverted: false },
                                true,
                              ),
                            )
                          }
                        >
                          Reset Cutaway
                        </Button>
                      </div>

                      <p className="studio-hint">
                        Clipped outer surfaces are excluded from raycasting so exposed internal organs can be clicked directly.
                      </p>
                    </div>
                  )}

                  {studioSubTab === 'motion' && registry && (
                    <div className="studio-section">
                      <div className="studio-field">
                        <div className="studio-row-between">
                          <span className="studio-label">3D Regional Separation</span>
                          <output className="studio-val">
                            {Math.round(engine.regionalExplode * 100)}%
                          </output>
                        </div>
                        <Slider
                          min={0}
                          max={100}
                          step={1}
                          aria-label="3D regional anatomical separation"
                          value={[Math.round(engine.regionalExplode * 100)]}
                          onValueChange={(v) => {
                            const val = Array.isArray(v) ? v[0] : v;
                            setEngine((st) => setRegionalExplode(st, val / 100, false));
                          }}
                        />
                      </div>

                      <div className="studio-field">
                        <div className="studio-row-between">
                          <span className="studio-label">Anatomical Group Explode</span>
                          <output className="studio-val" data-testid="group-explode-val">
                            {Math.round((engine.groupExplosion?.amount ?? 0) * 100)}%
                            {(engine.groupExplosion?.amount ?? 0) > 0.42
                              ? ' · Explode'
                              : (engine.groupExplosion?.amount ?? 0) > 0.01
                                ? ' · Emerge'
                                : ''}
                          </output>
                        </div>
                        <select
                          aria-label="Select anatomical group to explode"
                          data-testid="group-explode-select"
                          className="studio-select"
                          value={
                            engine.groupExplosion?.groupId ??
                            selectedGroup?.id ??
                            registry.groups[0].id
                          }
                          onChange={(e) => {
                            triggerAnimatedGroupExplode(e.target.value, true, true);
                          }}
                        >
                          {registry.groups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.label} ({g.partIds.length})
                            </option>
                          ))}
                        </select>
                        <Slider
                          min={0}
                          max={100}
                          step={1}
                          aria-label="Anatomical group separation"
                          value={[Math.round((engine.groupExplosion?.amount ?? 0) * 100)]}
                          onValueChange={(v) => {
                            const val = Array.isArray(v) ? v[0] : v;
                            const gid =
                              engine.groupExplosion?.groupId ??
                              selectedGroup?.id ??
                              registry.groups[0].id;
                            const grp = registry.groups.find((g) => g.id === gid);
                            const ensureSystems = grp ? getGroupSystems(grp.partIds) : undefined;
                            setGroupAnimTarget(null);
                            setEngine((st) =>
                              setGroupExplosion(
                                st,
                                gid,
                                val / 100,
                                false,
                                grp?.partIds,
                                undefined,
                                val > 0 ? ensureSystems : undefined,
                              ),
                            );
                          }}
                        />
                        <div className="studio-action-pair">
                          <Button
                            variant="ghost"
                            data-testid="motion-group-explode-btn"
                            onClick={() => {
                              const gid =
                                engine.groupExplosion?.groupId ??
                                selectedGroup?.id ??
                                registry.groups[0].id;
                              const isExpanded = (engine.groupExplosion?.amount ?? 0) > 0.05;
                              triggerAnimatedGroupExplode(gid, !isExpanded, true);
                            }}
                          >
                            {(engine.groupExplosion?.amount ?? 0) > 0.05
                              ? 'Assemble Group'
                              : 'Emerge & Explode'}
                          </Button>
                          <Button
                            variant="ghost"
                            data-testid="motion-group-reset-btn"
                            disabled={!engine.groupExplosion}
                            onClick={() => {
                              const gid = engine.groupExplosion?.groupId ?? null;
                              triggerAnimatedGroupExplode(gid, false, false);
                            }}
                          >
                            Reset Group
                          </Button>
                        </div>
                      </div>

                      {activeAnimSpec && (
                        <div className="anim-player">
                          <div className="studio-row-between">
                            <span className="studio-label">Animation Transport</span>
                            <output className="studio-val">
                              {Math.round(engine.animationProgress * 100)}%
                            </output>
                          </div>
                          <div className="anim-transport">
                            <Button
                              variant="ghost"
                              data-testid="anim-play-btn"
                              disabled={activeAnimSpec.status !== 'supported_rigid'}
                              onClick={() => {
                                if (!engine.activeAnimationId) {
                                  selectAndPlayAnimation(activeAnimSpec.id, true);
                                  return;
                                }
                                setEngine((st) => ({
                                  ...st,
                                  animationPlaying: !st.animationPlaying,
                                }));
                              }}
                            >
                              {engine.animationPlaying ? <Pause size={15} /> : <Play size={15} />}
                              {engine.animationPlaying ? 'Pause' : 'Play'}
                            </Button>

                            <Button
                              variant="ghost"
                              data-testid="anim-stop-btn"
                              disabled={activeAnimSpec.status !== 'supported_rigid'}
                              onClick={() =>
                                setEngine((st) => ({
                                  ...st,
                                  animationPlaying: false,
                                  animationProgress: 0,
                                }))
                              }
                            >
                              <Square size={14} />
                              Stop
                            </Button>

                            <select
                              aria-label="Animation playback speed"
                              className="studio-speed-select"
                              value={engine.animationSpeed}
                              onChange={(e) =>
                                setEngine((st) => ({
                                  ...st,
                                  animationSpeed: Number(e.target.value),
                                }))
                              }
                            >
                              <option value={0.5}>0.5×</option>
                              <option value={1}>1×</option>
                              <option value={1.5}>1.5×</option>
                            </select>
                          </div>

                          <Slider
                            min={0}
                            max={100}
                            step={1}
                            disabled={activeAnimSpec.status !== 'supported_rigid'}
                            aria-label="Animation timeline scrubber"
                            value={[Math.round(engine.animationProgress * 100)]}
                            onValueChange={(v) => {
                              const val = Array.isArray(v) ? v[0] : v;
                              setEngine((st) => ({
                                ...st,
                                activeAnimationId: activeAnimSpec.id,
                                animationPlaying: false,
                                animationProgress: val / 100,
                              }));
                            }}
                          />
                        </div>
                      )}

                      <div className="studio-field">
                        <span className="studio-label">Registered Anatomical Animations</span>
                        <div className="anim-list">
                          {registry.animations.map((anim) => {
                            const isSelected = (engine.activeAnimationId ?? registry.animations[0].id) === anim.id;
                            const isSupported = anim.status === 'supported_rigid';
                            return (
                              <button
                                type="button"
                                key={anim.id}
                                data-testid={`anim-clip-${anim.id}`}
                                className={`anim-item ${isSelected ? 'active' : ''} ${
                                  !isSupported ? 'pending' : ''
                                }`}
                                onClick={() => selectAndPlayAnimation(anim.id, false)}
                              >
                                <div className="anim-item-head">
                                  <strong>{anim.title}</strong>
                                  <span className={`anim-badge ${anim.status}`}>
                                    {anim.status === 'supported_rigid'
                                      ? 'Rigid Rig'
                                      : anim.status === 'requires_rig'
                                        ? 'Needs Morph Rig'
                                        : 'Needs Asset'}
                                  </span>
                                </div>
                                <p>{anim.description}</p>
                                {anim.rigRequirementNote && (
                                  <em className="missing-note">{anim.rigRequirementNote}</em>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {panel === 'search' && (
            <section className="search-panel glass" aria-label="Find anatomical structure">
              <div className="panel-heading">
                <span>Find a structure</span>
                <Button
                  variant="ghost"
                  className="icon-button"
                  onClick={() => setPanel(null)}
                  aria-label="Close search"
                >
                  <X size={18} />
                </Button>
              </div>
              <Combobox<Concept>
                items={searchResults}
                value={null}
                onValueChange={(value) => {
                  if (value) chooseConcept(value, true);
                }}
                inputValue={query}
                onInputValueChange={setQuery}
                itemToStringLabel={(c) => c.name}
                filter={null}
                open
                onOpenChange={(open) => {
                  if (!open) setPanel(null);
                }}
              >
                <ComboboxInput
                  autoFocus
                  placeholder="Heart, frontal bone, mandible, thalamus…"
                  aria-label="Search named anatomical structures"
                  showTrigger={false}
                />
                <ComboboxContent className="anatomy-search-results">
                  <ComboboxEmpty>No 3D structures match your search.</ComboboxEmpty>
                  <ComboboxList>
                    {(c: Concept) => (
                      <ComboboxItem key={c.id} value={c}>
                        <span className="search-result-name">{c.name}</span>
                        <span className="small-number">
                          {c.elements.length} {c.elements.length === 1 ? 'piece' : 'pieces'}
                        </span>
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
              <div className="search-panel-foot">
                <p className="search-note">
                  {query
                    ? 'Showing up to 80 3D matches.'
                    : 'Includes common names & 3,432 FMA concepts.'}
                </p>
                <button
                  type="button"
                  className="search-full-link"
                  onClick={() => {
                    setPanel(null);
                    onOpenFullSearch();
                  }}
                >
                  Full directory
                </button>
              </div>
            </section>
          )}

          <nav className="view-controls glass" aria-label="Camera controls">
            {presetViews.map((v) => (
              <Button
                variant="ghost"
                key={v.id}
                className={view === v.id ? 'active' : ''}
                aria-pressed={view === v.id}
                disabled={engine.explode > 0.8 && v.id !== 'front'}
                onClick={() => {
                  setView(v.id);
                  setRotate(false);
                  setEngine((st) => ({ ...st, resetCounter: st.resetCounter + 1 }));
                }}
                title={v.label}
                aria-label={v.label}
              >
                <span>{v.short}</span>
              </Button>
            ))}
            <i />
            <Button
              variant="ghost"
              onClick={() => triggerZoom(0.76)}
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn size={17} />
            </Button>
            <Button
              variant="ghost"
              onClick={() => triggerZoom(1.3)}
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut size={17} />
            </Button>
            <i />
            <Button
              variant="ghost"
              className={interactionMode === 'pan' ? 'active' : ''}
              aria-pressed={interactionMode === 'pan'}
              onClick={() => setInteractionMode((m) => (m === 'pan' ? 'orbit' : 'pan'))}
              title={
                interactionMode === 'pan'
                  ? 'Switch drag gesture to Orbit'
                  : 'Switch drag gesture to Pan'
              }
              aria-label={interactionMode === 'pan' ? 'Pan mode active' : 'Orbit mode active'}
            >
              {interactionMode === 'pan' ? <Hand size={17} /> : <Move3d size={17} />}
            </Button>
            <Button
              variant="ghost"
              disabled={engine.explode >= 0.4}
              aria-label={rotate ? 'Pause rotation' : 'Auto rotate body'}
              title="Auto rotate"
              className={rotate ? 'active' : ''}
              onClick={() => setRotate((r) => !r)}
            >
              {rotate ? <Pause size={17} /> : <RotateCw size={17} />}
            </Button>
            <Button
              variant="ghost"
              aria-label="Reset camera and layers"
              title="Reset view and layers"
              onClick={reset}
            >
              <RotateCcw size={17} />
            </Button>
          </nav>

          <div className="scene-caption">
            <span className="caption-line" />
            <span>
              {engine.isolate
                ? chosen?.name ?? 'SELECTED STRUCTURE'
                : engine.clipping.enabled
                  ? `${getAxisLabel(engine.clipping.axis).toUpperCase()} CROSS-SECTION`
                  : engine.explode > 0.95
                    ? 'ANATOMICAL INVENTORY'
                    : engine.regionalExplode > 0.05 || (engine.groupExplosion?.amount ?? 0) > 0.05
                      ? 'SEPARATED STRUCTURES'
                      : engine.dissectionMode
                        ? 'DISSECTION MODE ACTIVE'
                        : interactionMode === 'pan'
                          ? 'PAN MODE · DRAG TO MOVE'
                          : 'ADULT MALE REFERENCE · BODYPARTS3D'}
            </span>
            <span className="caption-line" />
          </div>
        </>
      )}

      <div className={`bottom-dock-wrap ${hudHidden ? 'is-collapsed' : ''}`}>
        <button
          type="button"
          className="hud-collapse-pill"
          onClick={() => setHudHidden((v) => !v)}
          aria-label={hudHidden ? 'Show 3D controls' : 'Hide 3D controls'}
        >
          {hudHidden ? (
            <>
              <ChevronUp size={14} /> Show Controls
            </>
          ) : (
            <>
              <ChevronDown size={14} /> Hide Controls
            </>
          )}
        </button>

        {!hudHidden && (
          <div className="bottom-dock glass">
            <Button
              variant="ghost"
              className="mobile-only dock-layers"
              onClick={() => openPanel('layers')}
              aria-label="Open system layers and dissect lab"
            >
              <Layers3 size={19} />
              <span>Lab</span>
            </Button>

            <div className="explode-control">
              <div className="explode-label">
                <label id="explode-label">Explode inventory</label>
                <output>
                  {Math.round(engine.explode * 100)}
                  <span>%</span>
                </output>
              </div>
              <Slider
                aria-labelledby="explode-label"
                min={0}
                max={100}
                step={1}
                value={[engine.explode * 100]}
                onValueChange={(v) => {
                  const val = Array.isArray(v) ? v[0] : v;
                  setEngine((st) => ({
                    ...st,
                    explode: val / 100,
                    regionalExplode: 0,
                    groupExplosion: null,
                  }));
                  if (val > 80) setView('front');
                  setRotate(false);
                }}
              />
              <div className="slider-endpoints">
                <span>Assembled</span>
                <span>Every piece</span>
              </div>
            </div>

            <Button
              variant="ghost"
              className="dock-reset"
              data-testid="dock-reset-btn"
              onClick={reset}
              aria-label="Assemble and reset"
            >
              <RotateCcw size={17} />
              <span>Reset</span>
            </Button>
          </div>
        )}
      </div>

      {!hudHidden && (
        <div className="studio-footer">
          <span>
            {engine.explode > 0.8 || interactionMode === 'pan'
              ? 'Drag to pan'
              : 'Drag to orbit'}{' '}
            <b>·</b> Scroll / pinch to zoom <b>·</b>{' '}
            {tapToRemove ? 'Tap structure to remove' : 'Tap structure to dissect or inspect'}
          </span>
        </div>
      )}

      {progress < 100 && !error && (
        <div className="loading glass" role="status">
          <Activity size={18} />
          <div>
            <strong>Preparing 3D anatomy</strong>
            <span>
              {progress}% · Loading {atlas?.parts.length.toLocaleString() ?? '2,234'} meshes
            </span>
            <div className="loading-track">
              <i style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="loading glass error" role="alert">
          <p>{error}</p>
          <Button variant="ghost" onClick={() => location.reload()}>
            Reload viewer
          </Button>
        </div>
      )}

      <Sheet
        open={details && selectedParts.length > 0}
        modal={false}
        disablePointerDismissal
        onOpenChange={setDetails}
      >
        <SheetContent
          initialFocus={detailTitle}
          className={`detail-sheet glass ${engine.isolate ? 'is-isolated' : ''}`}
          showCloseButton={true}
        >
          <div className="detail-header">
            <div className="detail-accent" style={{ background: system?.color }} />
            <div className="eyebrow">
              {canonicalSys?.name.en ?? system?.name ?? 'ANATOMY'}
            </div>
            <SheetTitle ref={detailTitle} tabIndex={-1} className="structure-title">
              {chosen?.name}
            </SheetTitle>
            {knowledge && knowledge.commonName !== chosen?.name && (
              <p className="detail-common-name">Common name: {knowledge.commonName}</p>
            )}
          </div>

          <div className="detail-scroll" key={`${chosen?.id}-${engine.isolate}`}>
            <div className="dissect-context-card">
              <div className="dissect-context-head">
                <SlidersHorizontal size={14} />
                <span>Dissection & Layer Controls</span>
                <span className="dissect-opacity-tag">
                  {Math.round(selectedOpacity * 100)}% solid
                </span>
              </div>
              <div className="dissect-context-grid">
                <Button
                  variant="ghost"
                  data-testid="detail-remove-btn"
                  className="utility-action remove-btn"
                  onClick={() => {
                    const targets = engine.selected;
                    setEngine((st) => hideParts(st, targets));
                    setDetails(false);
                  }}
                >
                  <Scissors size={14} />
                  Remove
                </Button>

                <Button
                  variant="ghost"
                  data-testid="detail-xray-btn"
                  className={`utility-action ${selectedOpacity < 0.9 ? 'active' : ''}`}
                  onClick={() => {
                    const nextAlpha = selectedOpacity < 0.9 ? 1.0 : 0.25;
                    setEngine((st) => setStructureOpacity(st, st.selected, nextAlpha, true));
                  }}
                >
                  <Eye size={14} />
                  {selectedOpacity < 0.9 ? 'Opaque' : 'X-Ray 25%'}
                </Button>

                {selectedDepthTarget && registry && (
                  <Button
                    variant="ghost"
                    data-testid="detail-deeper-btn"
                    className="utility-action deeper-btn"
                    onClick={() => {
                      setRailTab('studio');
                      setStudioSubTab('depth');
                      setEngine((st) =>
                        setRegionLayerDepth(
                          st,
                          registry,
                          selectedDepthTarget.region.id,
                          selectedDepthTarget.nextDepth,
                        ),
                      );
                      setDetails(false);
                    }}
                  >
                    <Layers3 size={14} />
                    Explore Deeper
                  </Button>
                )}

                {selectedGroup && (
                  <Button
                    variant="ghost"
                    data-testid="detail-explode-group-btn"
                    className={`utility-action ${
                      engine.groupExplosion?.groupId === selectedGroup.id ? 'active' : ''
                    }`}
                    onClick={() => {
                      const isExpanded = engine.groupExplosion?.groupId === selectedGroup.id;
                      triggerAnimatedGroupExplode(selectedGroup.id, !isExpanded, true);
                    }}
                  >
                    <Move3d size={14} />
                    {engine.groupExplosion?.groupId === selectedGroup.id
                      ? 'Assemble Group'
                      : 'Explode Group'}
                  </Button>
                )}
              </div>

              <div className="dissect-opacity-slider">
                <span>Structure Transparency</span>
                <Slider
                  min={5}
                  max={100}
                  step={5}
                  aria-label="Structure opacity"
                  value={[Math.round(selectedOpacity * 100)]}
                  onValueChange={(v) => {
                    const val = Array.isArray(v) ? v[0] : v;
                    setEngine((st) => setStructureOpacity(st, st.selected, val / 100, false));
                  }}
                />
              </div>
            </div>

            {knowledge && (
              <>
                <div className="detail-field">
                  <h4>Location</h4>
                  <SheetDescription className="structure-description">
                    {knowledge.location.en}
                  </SheetDescription>
                </div>

                <div className="detail-field">
                  <h4>Main Function</h4>
                  <p className="structure-description">{knowledge.mainFunction.en}</p>
                </div>

                {knowledge.classification && (
                  <div className="detail-field">
                    <h4>Classification</h4>
                    <p className="structure-description">{knowledge.classification}</p>
                  </div>
                )}

                {knowledge.primaryAction && (
                  <div className="detail-field">
                    <h4>Primary Action</h4>
                    <p className="structure-description">{knowledge.primaryAction}</p>
                  </div>
                )}

                {knowledge.characteristics.length > 0 && (
                  <div className="detail-field">
                    <h4>Key Characteristics</h4>
                    <ul className="detail-bullets">
                      {knowledge.characteristics.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {knowledge.terminology.length > 0 && (
                  <div className="detail-field">
                    <h4>Terminology</h4>
                    <ul className="detail-bullets">
                      {knowledge.terminology.map((t) => (
                        <li key={t.term}>
                          <strong>{t.term}:</strong> {t.meaning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {!knowledge.verifiedCurated && (
                  <span className="context-note">
                    Verified 3D piece from BodyParts3D. Detailed per-piece educational notes are not
                    yet authored; showing verified system overview.
                  </span>
                )}
              </>
            )}

            <div className="structure-meta">
              <span>
                Atlas FMA ID<strong>{chosen?.id}</strong>
              </span>
              <span>
                Selected pieces<strong>{engine.selected.length.toLocaleString()}</strong>
              </span>
            </div>

            {selectedGroup && (
              <div className="member-list">
                <h3>Anatomical group · {selectedGroup.label}</h3>
                {selectedGroup.partIds
                  .filter((id) => id !== selected?.id)
                  .slice(0, 10)
                  .map((pid) => {
                    const peer = parts.get(pid);
                    if (!peer) return null;
                    return (
                      <Button
                        variant="ghost"
                        key={pid}
                        onClick={() => choosePart(pid, true)}
                      >
                        <span>
                          {peer.name}
                          {hiddenSet.has(pid) ? ' (hidden)' : ''}
                        </span>
                        <ChevronRight size={14} />
                      </Button>
                    );
                  })}
              </div>
            )}

            {knowledge && knowledge.relatedConceptIds.length > 0 && (
              <div className="member-list">
                <h3>Related structures</h3>
                {knowledge.relatedConceptIds.map((rid) => {
                  const rc = conceptsById.get(rid);
                  if (!rc) return null;
                  return (
                    <Button
                      variant="ghost"
                      key={rid}
                      onClick={() => chooseConcept(rc, true)}
                    >
                      <span>{rc.name}</span>
                      <ChevronRight size={14} />
                    </Button>
                  );
                })}
              </div>
            )}

            {selectedParts.length > 1 && (
              <div className="member-list">
                <h3>Included pieces ({selectedParts.length})</h3>
                {selectedParts.slice(0, 40).map((p) => (
                  <Button
                    variant="ghost"
                    key={p.id}
                    onClick={() => choosePart(p.id, true)}
                  >
                    <span>{p.name}</span>
                    <ChevronRight size={14} />
                  </Button>
                ))}
                {selectedParts.length > 40 && (
                  <p className="context-note">
                    And {selectedParts.length - 40} more modeled pieces.
                  </p>
                )}
              </div>
            )}

            <a
              className="source-link"
              href="https://lifesciencedb.jp/bp3d/"
              target="_blank"
              rel="noreferrer"
            >
              BodyParts3D anatomical source <ArrowUpRight size={14} />
            </a>
          </div>

          <div className="detail-actions">
            <div className="detail-action-row">
              <Button
                variant="ghost"
                className="utility-action"
                onClick={() =>
                  setEngine((st) => ({
                    ...st,
                    focusRequestCounter: st.focusRequestCounter + 1,
                  }))
                }
              >
                <ZoomIn size={15} />
                Focus in 3D
              </Button>
              <Button
                variant="ghost"
                className={`utility-action ${engine.ghostSurroundings ? 'active' : ''}`}
                aria-pressed={Boolean(engine.ghostSurroundings)}
                onClick={() =>
                  setEngine((st) => ({
                    ...st,
                    isolate: false,
                    ghostSurroundings: !st.ghostSurroundings,
                  }))
                }
              >
                <Eye size={15} />
                {engine.ghostSurroundings ? 'Opaque body' : 'Transparent body'}
              </Button>
            </div>

            {chosen && (
              <div className="detail-action-row">
                <Button
                  variant="ghost"
                  className={`utility-action ${
                    isBookmarked('structure', chosen.id) ? 'active' : ''
                  }`}
                  aria-pressed={isBookmarked('structure', chosen.id)}
                  onClick={() =>
                    toggleBookmark({
                      kind: 'structure',
                      targetId: chosen.id,
                      title: chosen.name,
                      subtitle: canonicalSys?.name.en ?? system?.name ?? 'Anatomy 3D',
                      canonicalSystem: canonicalSys?.id,
                    })
                  }
                >
                  <Bookmark size={15} />
                  {isBookmarked('structure', chosen.id) ? 'Bookmarked' : 'Bookmark'}
                </Button>
                {onOpenRelationships && (
                  <Button
                    variant="ghost"
                    className="utility-action"
                    onClick={() => onOpenRelationships(chosen.id)}
                  >
                    <GitBranch size={15} />
                    Relationships
                  </Button>
                )}
              </div>
            )}

            <Button
              data-testid="detail-isolate-btn"
              className={`primary-action ${engine.isolate ? 'active' : ''}`}
              onClick={() =>
                setEngine((st) => toggleIsolateParts(st, st.selected))
              }
            >
              <Focus size={17} />
              {engine.isolate ? 'Restore full model' : 'Isolate structure'}
              <ChevronRight size={16} />
            </Button>

            <Button
              variant="ghost"
              className="secondary-action"
              onClick={() => {
                setEngine((st) => ({
                  ...st,
                  selected: [],
                  isolate: false,
                  ghostSurroundings: false,
                }));
                setDetails(false);
              }}
            >
              Clear selection
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
