import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Crosshair,
  ExternalLink,
  Eye,
  Hand,
  Info,
  Layers,
  Maximize2,
  MousePointerClick,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  DEFAULT_VISIBLE,
  type Atlas,
  type InteractionMode,
  type Part,
  type SceneState,
  type SystemId,
  type View,
} from '../anatomy';
import { lookupStructureKnowledge } from '../anatomy-knowledge';
import { CANONICAL_SYSTEMS, canonicalSystemForMeshSystem, type CanonicalSystemId } from '../anatomy-systems';
import { ANATOMY_LESSONS, type AnatomyLesson, type LessonTopic } from '../learning-data';

const AnatomyScene = lazy(() => import('../scene'));

const COMPLETED_TOPICS_KEY = 'a360.learn.completedTopics.v1';

interface Props {
  atlas: Atlas | null;
  atlasError?: string;
  onInspectConcept: (conceptId: string) => void;
}

type ContextMode = 'body' | 'system' | 'isolate';

interface ClickedSelection {
  partId: string;
  conceptId: string;
  name: string;
  meshSystem: SystemId;
}

function readCompletedTopics(): string[] {
  try {
    const raw = window.localStorage.getItem(COMPLETED_TOPICS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export default function SystemLearnWorkspace({ atlas, atlasError, onInspectConcept }: Props) {
  const [activeSystemId, setActiveSystemId] = useState<CanonicalSystemId>('cardiovascular');
  const [activeTopicId, setActiveTopicId] = useState<string>('topic-cardio-heart-chambers');
  const [focusedConceptId, setFocusedConceptId] = useState<string | null>(null);
  const [clicked3D, setClicked3D] = useState<ClickedSelection | null>(null);

  const [completedTopics, setCompletedTopics] = useState<string[]>(() =>
    typeof window !== 'undefined' ? readCompletedTopics() : [],
  );

  // Embedded 3D viewport controls
  const [view, setView] = useState<View>('three-quarter');
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('orbit');
  const [contextMode, setContextMode] = useState<ContextMode>('body');
  const [resetCount, setResetCount] = useState(0);
  const [zoomStep, setZoomStep] = useState<{ id: number; delta: number } | undefined>(undefined);
  const [focusRequest, setFocusRequest] = useState(1);
  const [sceneProgress, setSceneProgress] = useState(0);
  const [sceneError, setSceneError] = useState('');

  const initialFocusDoneRef = useRef(false);

  const lessonsBySystem = useMemo(() => {
    const map = new Map<CanonicalSystemId, AnatomyLesson[]>();
    for (const lesson of ANATOMY_LESSONS) {
      const list = map.get(lesson.systemId) ?? [];
      list.push(lesson);
      map.set(lesson.systemId, list);
    }
    return map;
  }, []);

  const activeSystem = useMemo(
    () => CANONICAL_SYSTEMS.find((s) => s.id === activeSystemId) ?? CANONICAL_SYSTEMS[0],
    [activeSystemId],
  );

  const systemLessons = useMemo(
    () => lessonsBySystem.get(activeSystem.id) ?? [],
    [lessonsBySystem, activeSystem.id],
  );

  const flatTopics = useMemo(
    () =>
      systemLessons.flatMap((lesson) =>
        lesson.topics.map((topic) => ({
          lesson,
          topic,
        })),
      ),
    [systemLessons],
  );

  const activePair = useMemo(
    () => flatTopics.find((item) => item.topic.id === activeTopicId) ?? flatTopics[0],
    [flatTopics, activeTopicId],
  );

  const activeLesson: AnatomyLesson | undefined = activePair?.lesson;
  const activeTopic: LessonTopic | undefined = activePair?.topic;

  const conceptMap = useMemo(() => {
    if (!atlas) return new Map<string, { id: string; name: string; elements: string[] }>();
    return new Map(atlas.concepts.map((c) => [c.id, c]));
  }, [atlas]);

  const partMap = useMemo(() => {
    if (!atlas) return new Map<string, Part>();
    return new Map(atlas.parts.map((p) => [p.id, p]));
  }, [atlas]);

  // Persist topic completion honestly
  useEffect(() => {
    try {
      window.localStorage.setItem(COMPLETED_TOPICS_KEY, JSON.stringify(completedTopics));
    } catch {
      // Ignore storage quota errors
    }
  }, [completedTopics]);

  const toggleTopicCompleted = useCallback((topicId: string) => {
    setCompletedTopics((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId],
    );
  }, []);

  // Re-focus once after WebGL chunks finish loading so initial camera centers cleanly on topic structures
  useEffect(() => {
    if (sceneProgress >= 100 && !initialFocusDoneRef.current) {
      initialFocusDoneRef.current = true;
      setFocusRequest((n) => n + 1);
    }
  }, [sceneProgress]);

  const selectSystem = useCallback(
    (sysId: CanonicalSystemId) => {
      const nextLessons = lessonsBySystem.get(sysId) ?? [];
      const firstTopic = nextLessons[0]?.topics[0];
      setActiveSystemId(sysId);
      if (firstTopic) {
        setActiveTopicId(firstTopic.id);
        setView(firstTopic.preferredView ?? 'three-quarter');
      }
      setFocusedConceptId(null);
      setClicked3D(null);
      setFocusRequest((n) => n + 1);
    },
    [lessonsBySystem],
  );

  const selectTopic = useCallback((topic: LessonTopic) => {
    setActiveTopicId(topic.id);
    setFocusedConceptId(null);
    setClicked3D(null);
    if (topic.preferredView) {
      setView(topic.preferredView);
    }
    setFocusRequest((n) => n + 1);
  }, []);

  const inspectSingleConcept = useCallback((conceptId: string) => {
    setClicked3D(null);
    setFocusedConceptId(conceptId);
    setFocusRequest((n) => n + 1);
  }, []);

  const focusAllTopicConcepts = useCallback(() => {
    setClicked3D(null);
    setFocusedConceptId(null);
    setFocusRequest((n) => n + 1);
  }, []);

  // Resolve active 3D selected part IDs
  const selectedPartIds = useMemo(() => {
    if (!atlas) return [];
    const targetIds: string[] = [];
    const addConcept = (cid: string) => {
      const c = conceptMap.get(cid);
      if (c) targetIds.push(...c.elements);
    };

    if (clicked3D) {
      const c = conceptMap.get(clicked3D.conceptId);
      if (c && c.elements.length > 0) return c.elements;
      return [clicked3D.partId];
    }
    if (focusedConceptId) {
      addConcept(focusedConceptId);
    } else if (activeTopic) {
      for (const cid of activeTopic.conceptIds) {
        addConcept(cid);
      }
    }
    return Array.from(new Set(targetIds));
  }, [atlas, clicked3D, focusedConceptId, activeTopic, conceptMap]);

  // Visible mesh layers for SceneState
  const visibleLayers = useMemo<SystemId[]>(() => {
    if (contextMode === 'body') {
      return Array.from(new Set([...DEFAULT_VISIBLE, ...activeSystem.meshSystems]));
    }
    // System Layer mode shows the canonical system's mesh layers cleanly
    return [...activeSystem.meshSystems];
  }, [contextMode, activeSystem.meshSystems]);

  const sceneState = useMemo<SceneState>(
    () => ({
      inspectorOpen: false,
      embedded: true,
      explode: 0,
      visible: visibleLayers,
      selected: selectedPartIds,
      isolate: contextMode === 'isolate',
      ghostSurroundings: contextMode !== 'isolate',
      interactionMode,
      view,
      rotate: false,
      reset: resetCount,
      zoomStep,
      focusRequest,
    }),
    [visibleLayers, selectedPartIds, contextMode, interactionMode, view, resetCount, zoomStep, focusRequest],
  );

  const handle3DSelect = useCallback(
    (partId: string) => {
      const part = partMap.get(partId);
      if (!part) return;
      const concept = conceptMap.get(part.conceptId);
      setFocusedConceptId(null);
      setClicked3D({
        partId,
        conceptId: part.conceptId,
        name: concept?.name ?? part.name,
        meshSystem: part.system,
      });
    },
    [partMap, conceptMap],
  );

  // Educational info for currently focused or clicked structure
  const activeStructureInfo = useMemo(() => {
    if (clicked3D) {
      return {
        source: '3d-click' as const,
        knowledge: lookupStructureKnowledge(clicked3D.conceptId, clicked3D.name, clicked3D.meshSystem),
      };
    }
    if (focusedConceptId) {
      const concept = conceptMap.get(focusedConceptId);
      const firstPart = concept?.elements[0] ? partMap.get(concept.elements[0]) : undefined;
      return {
        source: 'topic-focus' as const,
        knowledge: lookupStructureKnowledge(
          focusedConceptId,
          concept?.name ?? focusedConceptId,
          firstPart?.system ?? activeSystem.meshSystems[0],
        ),
      };
    }
    return null;
  }, [clicked3D, focusedConceptId, conceptMap, partMap, activeSystem.meshSystems]);

  const currentTopicIndex = activeTopic
    ? flatTopics.findIndex((item) => item.topic.id === activeTopic.id)
    : -1;
  const prevTopic = currentTopicIndex > 0 ? flatTopics[currentTopicIndex - 1].topic : null;
  const nextTopic =
    currentTopicIndex >= 0 && currentTopicIndex < flatTopics.length - 1
      ? flatTopics[currentTopicIndex + 1].topic
      : null;

  const activeSystemIndex = CANONICAL_SYSTEMS.findIndex((s) => s.id === activeSystem.id);
  const nextSystem =
    activeSystemIndex >= 0 && activeSystemIndex < CANONICAL_SYSTEMS.length - 1
      ? CANONICAL_SYSTEMS[activeSystemIndex + 1]
      : CANONICAL_SYSTEMS[0];

  const totalTopicsCount = useMemo(
    () => ANATOMY_LESSONS.reduce((sum, l) => sum + l.topics.length, 0),
    [],
  );
  const completedCount = completedTopics.length;

  const isTopicCompleted = activeTopic ? completedTopics.includes(activeTopic.id) : false;

  return (
    <div className="a360-syslearn-wrap">
      {/* 12-System Selector Bar */}
      <div className="a360-syslearn-selector" aria-label="Select anatomical system">
        <div className="a360-syslearn-selector-head">
          <div>
            <strong>All 12 Anatomical Systems</strong>
            <span className="a360-muted">
              Select a system to study its chapters synchronized with the 3D atlas.
            </span>
          </div>
          <span className="a360-syslearn-progress-label">
            {completedCount} / {totalTopicsCount} topics completed
          </span>
        </div>

        <div className="a360-syslearn-grid" role="tablist" aria-label="Anatomical systems">
          {CANONICAL_SYSTEMS.map((sys) => {
            const sysTopics = (lessonsBySystem.get(sys.id) ?? []).flatMap((l) => l.topics);
            const sysDone = sysTopics.filter((t) => completedTopics.includes(t.id)).length;
            const isActive = sys.id === activeSystem.id;
            return (
              <button
                key={sys.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`a360-syslearn-pill ${isActive ? 'active' : ''}`}
                onClick={() => selectSystem(sys.id)}
              >
                <span className="a360-sys-dot" style={{ background: sys.color }} />
                <span className="a360-syslearn-pill-name">
                  {sys.name.en.replace(' System', '')}
                </span>
                <span className="a360-syslearn-pill-count">
                  {sysDone}/{sysTopics.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Synchronized Split Learning Workspace: Lesson Content + Embedded 3D Viewport */}
      <div className="a360-syslearn-split">
        {/* Left Column: Structured Lesson */}
        <article className="a360-syslearn-lesson" aria-label="Structured anatomical lesson">
          {activeLesson && activeTopic ? (
            <>
              <header className="a360-syslearn-chapter-head">
                <div className="a360-syslearn-meta-row">
                  <span className="a360-kicker">
                    {activeLesson.chapter} · {activeSystem.coverageLabel}
                  </span>
                  <span className="a360-level-tag">{activeTopic.level}</span>
                </div>
                <h2>{activeLesson.title.en}</h2>
                <p className="a360-muted">{activeLesson.chapterDescription.en}</p>

                {activeLesson.coverageDisclosure && (
                  <div className="a360-disclosure-note" role="note">
                    <Info size={15} />
                    <span>{activeLesson.coverageDisclosure}</span>
                  </div>
                )}

                <div className="a360-objectives-box">
                  <h3>Learning Objectives</h3>
                  <ul>
                    {activeLesson.learningObjectives.map((obj) => (
                      <li key={obj}>{obj}</li>
                    ))}
                  </ul>
                </div>
              </header>

              {/* Topic Switcher inside Chapter */}
              <div className="a360-topic-tabs" role="tablist" aria-label="Chapter topics">
                {flatTopics.map(({ topic }, idx) => {
                  const done = completedTopics.includes(topic.id);
                  const current = topic.id === activeTopic.id;
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      role="tab"
                      aria-selected={current}
                      className={`a360-topic-tab ${current ? 'active' : ''}`}
                      onClick={() => selectTopic(topic)}
                    >
                      {done ? (
                        <CheckCircle2 size={14} className="a360-topic-done-icon" />
                      ) : (
                        <span className="a360-topic-idx">{idx + 1}</span>
                      )}
                      <span>{topic.title.en}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Topic Body */}
              <section className="a360-topic-detail">
                <div className="a360-topic-detail-head">
                  <div>
                    <p className="a360-kicker">
                      Topic {currentTopicIndex + 1} of {flatTopics.length}
                    </p>
                    <h3>{activeTopic.title.en}</h3>
                  </div>
                  <button
                    type="button"
                    className={`a360-complete-btn ${isTopicCompleted ? 'completed' : ''}`}
                    onClick={() => toggleTopicCompleted(activeTopic.id)}
                  >
                    {isTopicCompleted ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                    <span>{isTopicCompleted ? 'Completed' : 'Mark Complete'}</span>
                  </button>
                </div>

                <p className="a360-topic-explanation">{activeTopic.explanation.en}</p>

                <div className="a360-topic-columns">
                  <div className="a360-topic-subcard">
                    <h4>Anatomical Relationships</h4>
                    <ul className="a360-fact-list">
                      {activeTopic.relationships.map((rel) => (
                        <li key={rel}>{rel}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="a360-topic-subcard">
                    <h4>Key Facts</h4>
                    <ul className="a360-fact-list">
                      {activeTopic.keyFacts.map((fact) => (
                        <li key={fact}>{fact}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {activeTopic.terminology.length > 0 && (
                  <div className="a360-topic-subcard">
                    <h4>Relevant Terminology</h4>
                    <dl className="a360-term-defs">
                      {activeTopic.terminology.map((item) => (
                        <div key={item.term} className="a360-term-def-row">
                          <dt>{item.term}</dt>
                          <dd>{item.meaning}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {/* Modeled 3D Structures Connected to This Topic */}
                <div className="a360-topic-structures">
                  <div className="a360-topic-structures-head">
                    <h4>Interactive 3D Structures ({activeTopic.conceptIds.length})</h4>
                    <button
                      type="button"
                      className={`a360-inspect-link ${!focusedConceptId && !clicked3D ? 'active' : ''}`}
                      onClick={focusAllTopicConcepts}
                      disabled={!atlas}
                    >
                      <Crosshair size={13} />
                      <span>Focus All in 3D</span>
                    </button>
                  </div>

                  <div className="a360-structure-chips">
                    {activeTopic.conceptIds.map((cid) => {
                      const concept = conceptMap.get(cid);
                      const known = lookupStructureKnowledge(
                        cid,
                        concept?.name ?? cid,
                        activeSystem.meshSystems[0],
                      );
                      const isFocused = focusedConceptId === cid && !clicked3D;
                      const hasMeshes = Boolean(concept && concept.elements.length > 0);
                      return (
                        <button
                          key={cid}
                          type="button"
                          className={`a360-structure-chip ${isFocused ? 'active' : ''}`}
                          onClick={() => inspectSingleConcept(cid)}
                          disabled={!hasMeshes && Boolean(atlas)}
                        >
                          <span className="a360-structure-chip-title">{known.anatomicalName}</span>
                          <span className="a360-structure-chip-action">
                            {hasMeshes ? 'Inspect in 3D' : atlas ? 'Not in 3D pack' : 'Loading…'}
                            <ArrowRight size={12} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Non-modeled educational concepts */}
                {activeTopic.nonModeledConcepts && activeTopic.nonModeledConcepts.length > 0 && (
                  <div className="a360-nonmodeled-box">
                    <h4>Educational Concepts (No Individual 3D Mesh)</h4>
                    {activeTopic.nonModeledConcepts.map((item) => (
                      <div key={item.name} className="a360-nonmodeled-item">
                        <strong>{item.name}</strong>
                        <p>{item.note}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Previous / Next Topic Controls */}
                <footer className="a360-topic-nav">
                  <button
                    type="button"
                    className="a360-nav-btn"
                    disabled={!prevTopic}
                    onClick={() => prevTopic && selectTopic(prevTopic)}
                  >
                    <ArrowLeft size={14} />
                    <span>{prevTopic ? `Previous: ${prevTopic.title.en}` : 'Start of Chapter'}</span>
                  </button>

                  {nextTopic ? (
                    <button
                      type="button"
                      className="a360-nav-btn primary"
                      onClick={() => selectTopic(nextTopic)}
                    >
                      <span>Next: {nextTopic.title.en}</span>
                      <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="a360-nav-btn primary"
                      onClick={() => selectSystem(nextSystem.id)}
                    >
                      <span>Next System: {nextSystem.name.en.replace(' System', '')}</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </footer>
              </section>
            </>
          ) : (
            <div className="a360-empty-box">
              <p>Select an anatomical system above to open its synchronized 3D chapter.</p>
            </div>
          )}
        </article>

        {/* Right Column: Synchronized 3D Viewport + Clicked Structure Educational Card */}
        <aside className="a360-syslearn-viewer-col" aria-label="Interactive 3D anatomical viewer">
          <div className="a360-embedded-studio">
            {/* Top Toolbar */}
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

              <div className="a360-embedded-toolgroup" role="group" aria-label="3D display mode">
                <button
                  type="button"
                  className={`a360-mini-btn ${contextMode === 'body' ? 'active' : ''}`}
                  title="Show highlighted topic structures inside transparent full body"
                  onClick={() => setContextMode('body')}
                >
                  <Eye size={13} />
                  <span>Body Context</span>
                </button>
                <button
                  type="button"
                  className={`a360-mini-btn ${contextMode === 'system' ? 'active' : ''}`}
                  title="Show only this system’s 3D meshes"
                  onClick={() => setContextMode('system')}
                >
                  <Layers size={13} />
                  <span>System Only</span>
                </button>
                <button
                  type="button"
                  className={`a360-mini-btn ${contextMode === 'isolate' ? 'active' : ''}`}
                  title="Isolate only highlighted structure(s)"
                  onClick={() => setContextMode('isolate')}
                >
                  <Maximize2 size={13} />
                  <span>Isolate</span>
                </button>
              </div>

              <div className="a360-embedded-toolgroup" role="group" aria-label="Camera interaction">
                <button
                  type="button"
                  className={`a360-mini-btn ${interactionMode === 'orbit' ? 'active' : ''}`}
                  title="Drag to rotate"
                  onClick={() => setInteractionMode('orbit')}
                >
                  Orbit
                </button>
                <button
                  type="button"
                  className={`a360-mini-btn ${interactionMode === 'pan' ? 'active' : ''}`}
                  title="Drag to pan"
                  onClick={() => setInteractionMode('pan')}
                >
                  <Hand size={13} />
                  <span>Pan</span>
                </button>
                <button
                  type="button"
                  className="a360-mini-btn"
                  title="Zoom in"
                  aria-label="Zoom in"
                  onClick={() => setZoomStep({ id: Date.now(), delta: 0.78 })}
                >
                  <ZoomIn size={13} />
                </button>
                <button
                  type="button"
                  className="a360-mini-btn"
                  title="Zoom out"
                  aria-label="Zoom out"
                  onClick={() => setZoomStep({ id: Date.now() + 1, delta: 1.28 })}
                >
                  <ZoomOut size={13} />
                </button>
                <button
                  type="button"
                  className="a360-mini-btn"
                  title="Focus highlighted structures"
                  onClick={() => setFocusRequest((n) => n + 1)}
                >
                  <Crosshair size={13} />
                  <span>Focus</span>
                </button>
                <button
                  type="button"
                  className="a360-mini-btn"
                  title="Reset view"
                  aria-label="Reset 3D view"
                  onClick={() => {
                    setView(activeTopic?.preferredView ?? 'three-quarter');
                    setResetCount((n) => n + 1);
                  }}
                >
                  <RotateCcw size={13} />
                </button>
              </div>
            </div>

            {/* 3D Canvas Host (Mounted ONCE — never remounted on system or topic switch) */}
            <div className="a360-embedded-canvas-box">
              {atlasError || sceneError ? (
                <div className="a360-embedded-fallback" role="alert">
                  <strong>3D Viewer Unavailable</strong>
                  <span>{atlasError || sceneError}</span>
                </div>
              ) : !atlas ? (
                <div className="a360-embedded-fallback" role="status">
                  <strong>Loading Anatomy Atlas…</strong>
                  <span>Preparing 3D structures for {activeSystem.name.en}</span>
                </div>
              ) : (
                <Suspense
                  fallback={
                    <div className="a360-embedded-fallback" role="status">
                      <strong>Initializing 3D Viewport…</strong>
                      <span>Loading geometry meshes</span>
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
                  <span>Loading 3D Meshes ({sceneProgress}%)</span>
                  <div className="a360-embedded-progress-track">
                    <div style={{ width: `${sceneProgress}%` }} />
                  </div>
                </div>
              )}

              <div className="a360-embedded-hint">
                <MousePointerClick size={13} />
                <span>
                  {selectedPartIds.length} highlighted mesh{selectedPartIds.length === 1 ? '' : 'es'} ·
                  Drag to orbit · Scroll to zoom · Click any structure to inspect
                </span>
              </div>
            </div>
          </div>

          {/* Live Educational Info Card for Selected 3D Structure */}
          <div className="a360-selected-info-card">
            {activeStructureInfo ? (
              <>
                <div className="a360-selected-info-head">
                  <div>
                    <p className="a360-kicker">
                      {activeStructureInfo.source === '3d-click'
                        ? 'Selected Directly in 3D'
                        : 'Focused Lesson Structure'}{' '}
                      ·{' '}
                      {canonicalSystemForMeshSystem(
                        CANONICAL_SYSTEMS.find(
                          (s) => s.id === activeStructureInfo.knowledge.canonicalSystem,
                        )?.meshSystems[0] ?? 'skeletal',
                      ).name.en}
                    </p>
                    <h3>{activeStructureInfo.knowledge.anatomicalName}</h3>
                    {activeStructureInfo.knowledge.commonName !==
                      activeStructureInfo.knowledge.anatomicalName && (
                      <p className="a360-muted">
                        Common name: {activeStructureInfo.knowledge.commonName}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    className="a360-inspect-link"
                    onClick={() => onInspectConcept(activeStructureInfo.knowledge.conceptId)}
                  >
                    <span>Full 3D Explorer</span>
                    <ExternalLink size={12} />
                  </button>
                </div>

                <p className="a360-card-detail">
                  <strong>Location:</strong> {activeStructureInfo.knowledge.location.en}
                </p>
                <p className="a360-card-detail">
                  <strong>Function:</strong> {activeStructureInfo.knowledge.mainFunction.en}
                </p>

                {activeStructureInfo.knowledge.characteristics.length > 0 && (
                  <ul className="a360-fact-list">
                    {activeStructureInfo.knowledge.characteristics.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                )}

                {activeTopic && (
                  <div className="a360-selected-info-actions">
                    <button
                      type="button"
                      className="a360-mini-btn"
                      onClick={focusAllTopicConcepts}
                    >
                      Return Highlight to Full Topic Group
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="a360-selected-info-overview">
                <div className="a360-selected-info-head">
                  <div>
                    <p className="a360-kicker">Synchronized Topic View</p>
                    <h3>{activeTopic?.title.en ?? activeSystem.name.en}</h3>
                  </div>
                  {activeTopic?.conceptIds[0] && (
                    <button
                      type="button"
                      className="a360-inspect-link"
                      onClick={() => onInspectConcept(activeTopic.conceptIds[0])}
                    >
                      <span>Full 3D Explorer</span>
                      <ExternalLink size={12} />
                    </button>
                  )}
                </div>
                <p className="a360-muted">
                  All modeled structures for this topic are highlighted in teal in the 3D scene above.
                  Click any individual structure in the 3D viewport—or click an{' '}
                  <strong>Inspect in 3D</strong> button in the lesson—to inspect its exact location,
                  function, and key facts.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
