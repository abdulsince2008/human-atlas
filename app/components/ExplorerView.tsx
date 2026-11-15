import {
  Activity,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Eye,
  Focus,
  Hand,
  Layers3,
  Maximize2,
  Minimize2,
  Move3d,
  Pause,
  RotateCcw,
  RotateCw,
  Search,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { flushSync } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { registerAtlasTools } from '../agent-tools';
import {
  DEFAULT_VISIBLE,
  SYSTEMS,
  type Atlas,
  type Concept,
  type SceneState,
  type SystemId,
  type View,
} from '../anatomy';
import { CURATED_KNOWLEDGE, lookupStructureKnowledge } from '../anatomy-knowledge';
import { canonicalSystemForMeshSystem } from '../anatomy-systems';
import AnatomyScene from '../scene';
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
}

const INITIAL_SCENE: SceneState = {
  explode: 0,
  visible: DEFAULT_VISIBLE,
  selected: [],
  isolate: false,
  ghostSurroundings: false,
  interactionMode: 'orbit',
  view: 'three-quarter',
  rotate: false,
  reset: 0,
  zoomStep: undefined,
  focusRequest: 0,
};

export default function ExplorerView({
  atlas,
  atlasError,
  initialFocusConceptId,
  initialFocusPartId,
  initialVisibleSystems,
  onClearExternalIntent,
  onOpenFullSearch,
}: Props) {
  const studioRef = useRef<HTMLDivElement>(null);
  const detailTitle = useRef<HTMLHeadingElement>(null);

  const [state, setState] = useState<SceneState>(INITIAL_SCENE);
  const [progress, setProgress] = useState(0);
  const [sceneError, setSceneError] = useState('');
  const [panel, setPanel] = useState<'layers' | 'search' | null>(null);
  const [details, setDetails] = useState(false);
  const [query, setQuery] = useState('');
  const [chosen, setChosen] = useState<Concept | null>(null);
  const [hudHidden, setHudHidden] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const error = atlasError || sceneError;

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

  const selectedParts = state.selected
    .map((id) => parts.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const selected = selectedParts[0];
  const system = SYSTEMS.find((s) => s.id === selected?.system);
  const knowledge = chosen && selected ? lookupStructureKnowledge(chosen.id, chosen.name, selected.system) : null;
  const canonicalSys = selected ? canonicalSystemForMeshSystem(selected.system) : null;

  const visibleCount =
    atlas?.parts.filter((p) =>
      state.isolate
        ? state.selected.includes(p.id)
        : state.visible.includes(p.system) || state.selected.includes(p.id),
    ).length ?? 0;

  const chooseConcept = (c: Concept, shouldFocus = true) => {
    setChosen(c);
    setState((s) => ({
      ...s,
      selected: c.elements,
      isolate: false,
      rotate: false,
      focusRequest: shouldFocus ? (s.focusRequest ?? 0) + 1 : s.focusRequest,
    }));
    setDetails(true);
    setPanel(null);
  };

  const choosePart = (id: string, shouldFocus = false) => {
    const p = parts.get(id);
    if (!p) return;
    setChosen({ id: p.conceptId, name: p.name, elements: [id] });
    setState((s) => ({
      ...s,
      selected: [id],
      isolate: false,
      rotate: false,
      focusRequest: shouldFocus ? (s.focusRequest ?? 0) + 1 : s.focusRequest,
    }));
    setDetails(true);
    setPanel(null);
  };

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
      setState((s) => ({
        ...s,
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
  }, [atlas]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
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
      return ['heart', 'brain', 'liver', 'stomach', 'spleen', 'pancreas', 'urinary bladder', 'trachea', 'femur', 'skull']
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
    setState((s) => ({
      ...s,
      selected: [],
      isolate: false,
      ghostSurroundings: false,
      visible: s.visible.includes(id)
        ? s.visible.filter((x) => x !== id)
        : [...s.visible, id],
    }));
  };

  const reset = () => {
    setState((s) => ({
      ...INITIAL_SCENE,
      visible: DEFAULT_VISIBLE,
      reset: s.reset + 1,
    }));
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
      // Some embedded preview iframes disallow fullscreen APIs; fail silently.
    }
  };

  const triggerZoom = (delta: number) => {
    setState((s) => ({
      ...s,
      zoomStep: { id: (s.zoomStep?.id ?? 0) + 1, delta },
    }));
  };

  const presetViews: { id: View; short: string; label: string }[] = [
    { id: 'three-quarter', short: '¾', label: 'Three-quarter view' },
    { id: 'front', short: 'F', label: 'Front (anterior) view' },
    { id: 'back', short: 'B', label: 'Back (posterior) view' },
    { id: 'left', short: 'L', label: 'Left lateral view' },
    { id: 'right', short: 'R', label: 'Right lateral view' },
  ];

  return (
    <div className="studio" ref={studioRef}>
      {atlas && (
        <AnatomyScene
          atlas={atlas}
          state={{ ...state, inspectorOpen: details && selectedParts.length > 0 }}
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
              <span className="explorer-meta">
                {atlas ? atlas.parts.length.toLocaleString() : '2,234'} meshes ·{' '}
                {visibleCount.toLocaleString()} visible · BodyParts3D
              </span>
            </div>

            <div className="explorer-top-actions">
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
            aria-label="Anatomical system layers"
          >
            <div className="panel-heading">
              <span>Systems ({activeSystems.length})</span>
              <Button
                variant="ghost"
                className="mobile-only icon-button"
                onClick={() => setPanel(null)}
                aria-label="Close systems"
              >
                <X size={18} />
              </Button>
            </div>

            <div className="layer-presets">
              <Button
                variant="ghost"
                aria-pressed={activeSystems.every((x) => state.visible.includes(x.id))}
                onClick={() =>
                  setState((s) => ({
                    ...s,
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
                aria-pressed={state.visible.length === 1 && state.visible[0] === 'skeletal'}
                onClick={() =>
                  setState((s) => ({
                    ...s,
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
                  state.visible.length === 6 &&
                  ['cardiac', 'respiratory', 'digestive', 'urinary', 'endocrine', 'reproductive'].every(
                    (id) => state.visible.includes(id as SystemId),
                  )
                }
                onClick={() =>
                  setState((s) => ({
                    ...s,
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

            <div className="system-list">
              {activeSystems.map((s) => (
                <div
                  className={`system-row ${state.visible.includes(s.id) ? 'enabled' : ''}`}
                  key={s.id}
                >
                  <Button
                    variant="ghost"
                    className="system-name"
                    title={`Show only ${s.name.toLowerCase()}`}
                    onClick={() =>
                      setState((v) => ({
                        ...v,
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
                    checked={state.visible.includes(s.id)}
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
                  setState((s) => ({
                    ...s,
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
                  placeholder="Heart, femur, windpipe, pituitary…"
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
                className={state.view === v.id ? 'active' : ''}
                aria-pressed={state.view === v.id}
                disabled={state.explode > 0.8 && v.id !== 'front'}
                onClick={() =>
                  setState((s) => ({ ...s, view: v.id, reset: s.reset + 1, rotate: false }))
                }
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
              className={state.interactionMode === 'pan' ? 'active' : ''}
              aria-pressed={state.interactionMode === 'pan'}
              onClick={() =>
                setState((s) => ({
                  ...s,
                  interactionMode: s.interactionMode === 'pan' ? 'orbit' : 'pan',
                }))
              }
              title={
                state.interactionMode === 'pan'
                  ? 'Switch drag gesture to Orbit'
                  : 'Switch drag gesture to Pan'
              }
              aria-label={
                state.interactionMode === 'pan' ? 'Pan mode active' : 'Orbit mode active'
              }
            >
              {state.interactionMode === 'pan' ? <Hand size={17} /> : <Move3d size={17} />}
            </Button>
            <Button
              variant="ghost"
              disabled={state.explode >= 0.4}
              aria-label={state.rotate ? 'Pause rotation' : 'Auto rotate body'}
              title="Auto rotate"
              className={state.rotate ? 'active' : ''}
              onClick={() => setState((s) => ({ ...s, rotate: !s.rotate }))}
            >
              {state.rotate ? <Pause size={17} /> : <RotateCw size={17} />}
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
              {state.isolate
                ? chosen?.name ?? 'SELECTED STRUCTURE'
                : state.explode > 0.95
                  ? 'ANATOMICAL INVENTORY'
                  : state.explode > 0.05
                    ? 'SEPARATED STRUCTURES'
                    : state.interactionMode === 'pan'
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
              aria-label="Open system layers"
            >
              <Layers3 size={19} />
              <span>Systems</span>
            </Button>

            <div className="explode-control">
              <div className="explode-label">
                <label id="explode-label">Explode anatomy</label>
                <output>
                  {Math.round(state.explode * 100)}
                  <span>%</span>
                </output>
              </div>
              <Slider
                aria-labelledby="explode-label"
                min={0}
                max={100}
                step={1}
                value={[state.explode * 100]}
                onValueChange={(v) => {
                  const val = Array.isArray(v) ? v[0] : v;
                  setState((s) => ({
                    ...s,
                    explode: val / 100,
                    view: val > 80 ? 'front' : s.view,
                    rotate: false,
                  }));
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
            {state.explode > 0.8 || state.interactionMode === 'pan'
              ? 'Drag to pan'
              : 'Drag to orbit'}{' '}
            <b>·</b> Scroll / pinch to zoom <b>·</b> Tap structure to inspect
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
          className={`detail-sheet glass ${state.isolate ? 'is-isolated' : ''}`}
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

          <div className="detail-scroll" key={`${chosen?.id}-${state.isolate}`}>
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
                Selected pieces<strong>{state.selected.length.toLocaleString()}</strong>
              </span>
            </div>

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
                  setState((s) => ({
                    ...s,
                    focusRequest: (s.focusRequest ?? 0) + 1,
                  }))
                }
              >
                <ZoomIn size={15} />
                Focus in 3D
              </Button>
              <Button
                variant="ghost"
                className={`utility-action ${state.ghostSurroundings ? 'active' : ''}`}
                aria-pressed={Boolean(state.ghostSurroundings)}
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    isolate: false,
                    ghostSurroundings: !s.ghostSurroundings,
                  }))
                }
              >
                <Eye size={15} />
                {state.ghostSurroundings ? 'Opaque body' : 'Transparent body'}
              </Button>
            </div>

            <Button
              className={`primary-action ${state.isolate ? 'active' : ''}`}
              onClick={() =>
                setState((s) => ({
                  ...s,
                  isolate: !s.isolate,
                  ghostSurroundings: false,
                  explode: 0,
                }))
              }
            >
              <Focus size={17} />
              {state.isolate ? 'Restore full model' : 'Isolate structure'}
              <ChevronRight size={16} />
            </Button>

            <Button
              variant="ghost"
              className="secondary-action"
              onClick={() => {
                setState((s) => ({
                  ...s,
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
