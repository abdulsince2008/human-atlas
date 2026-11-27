import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  Box,
  GitBranch,
  Layers,
  Network,
  RotateCcw,
  Search,
} from 'lucide-react';
import {
  DEFAULT_VISIBLE,
  type Atlas,
  type SceneRelationshipEdge,
  type SceneState,
} from '../anatomy';
import { CANONICAL_SYSTEMS, type CanonicalSystemId } from '../anatomy-systems';
import { getReviewStatusLabel } from '../data/provenance-registry';
import {
  getRelationshipsForConcept,
  getStructureRecordV2,
  KNOWLEDGE_GRAPH_V2,
  type RelationshipType,
} from '../knowledge-graph';
import { resolveNaturalAnatomyColors } from '../tissue-materials';
import { getPartCenter } from '../visualization-colors';
import { useStudy } from '../components/StudyContext';
import PageOrientationBar from '../components/PageOrientationBar';
import StudyResourceList from '../components/StudyResourceList';
import { useSexAwareAtlas } from '../hooks/useSexAwareAtlas';
import type { StudyContextInput } from '../study-context-engine';

const AnatomyScene = lazy(() => import('../scene'));

interface Props {
  atlas: Atlas | null;
  initialConceptId?: string | null;
  onInspectConcept: (conceptId: string) => void;
  onOpenLearnSystem: (systemId: CanonicalSystemId, topicId?: string) => void;
  onOpenReference: (conceptId: string) => void;
  onOpenStudyContext?: (input: StudyContextInput) => void;
}

const RELATIONSHIP_COLOR: Record<RelationshipType, string> = {
  origin: '#0f5c6e',
  insertion: '#0e7490',
  attachment: '#0e7490',
  articulation: '#854d0e',
  innervation: '#b45309',
  arterial_supply: '#b91c1c',
  venous_drainage: '#1d4ed8',
  lymphatic_drainage: '#15803d',
  adjacent_to: '#475569',
  part_of: '#334155',
  has_part: '#334155',
  supports: '#0f766e',
  antagonist: '#9a3412',
};

const CENTER_NODE_COLOR = '#0f5c6e';
const INITIAL_BATCH_SIZE = 12;

function getConceptWorldCenter(
  conceptId: string,
  conceptMap: Map<string, string[]>,
  partMap: Map<string, Atlas['parts'][number]>,
): [number, number, number] | null {
  const partIds = conceptMap.get(conceptId);
  if (!partIds || partIds.length === 0) return null;
  let sx = 0;
  let sy = 0;
  let sz = 0;
  let count = 0;
  for (const pid of partIds) {
    const part = partMap.get(pid);
    if (!part) continue;
    const c = getPartCenter(part);
    sx += c[0];
    sy += c[1];
    sz += c[2];
    count++;
  }
  if (count === 0) return null;
  return [sx / count, sy / count, sz / count];
}

export default function RelationshipsPage({
  atlas,
  initialConceptId,
  onInspectConcept,
  onOpenLearnSystem,
  onOpenReference,
  onOpenStudyContext,
}: Props) {
  const [selectedId, setSelectedId] = useState<string>(initialConceptId ?? 'FMA7088');
  const [filterText, setFilterText] = useState('');
  const [systemFilter, setSystemFilter] = useState<CanonicalSystemId | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<RelationshipType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [highlightMode, setHighlightMode] = useState<'center' | 'network' | 'natural'>('network');
  const [showConnectors, setShowConnectors] = useState(true);
  const [showAllNodes, setShowAllNodes] = useState(false);
  const [focusRequest, setFocusRequest] = useState(1);

  const { state: studyState, isBookmarked, toggleBookmark } = useStudy();
  const { effectiveAtlas } = useSexAwareAtlas(atlas, studyState.preferredSex);

  useEffect(() => {
    if (initialConceptId) {
      setSelectedId(initialConceptId);
      setShowAllNodes(false);
      setFocusRequest((n) => n + 1);
    }
  }, [initialConceptId]);

  const conceptPartsMap = useMemo(
    () => new Map(effectiveAtlas?.concepts.map((c) => [c.id, c.elements]) ?? []),
    [effectiveAtlas],
  );
  const partMap = useMemo(
    () => new Map(effectiveAtlas?.parts.map((p) => [p.id, p]) ?? []),
    [effectiveAtlas],
  );

  const curatedList = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    return KNOWLEDGE_GRAPH_V2.filter((r) => {
      if (!r.visualization.inModel) return false;
      if (systemFilter !== 'all' && r.canonicalSystem !== systemFilter) return false;
      if (!q) return true;
      return (
        r.canonicalName.toLowerCase().includes(q) ||
        r.commonName.toLowerCase().includes(q) ||
        (r.latinName?.toLowerCase().includes(q) ?? false) ||
        r.conceptId.toLowerCase().includes(q)
      );
    });
  }, [filterText, systemFilter]);

  const activeRecord = useMemo(
    () => getStructureRecordV2(selectedId, effectiveAtlas),
    [selectedId, effectiveAtlas],
  );

  const relationships = useMemo(
    () => getRelationshipsForConcept(selectedId, effectiveAtlas),
    [selectedId, effectiveAtlas],
  );

  const allCombinedNodes = useMemo(() => {
    const items: {
      key: string;
      conceptId?: string;
      label: string;
      type: RelationshipType | 'related';
      typeLabel: string;
      color: string;
      direction: 'outgoing' | 'incoming' | 'curated';
      note: string;
      status: string;
      hasMesh: boolean;
    }[] = [];

    for (const r of relationships.outgoing) {
      if (typeFilter !== 'all' && r.type !== typeFilter) continue;
      const hasMesh = Boolean(
        r.targetConceptId && (conceptPartsMap.get(r.targetConceptId)?.length ?? 0) > 0,
      );
      items.push({
        key: r.id,
        conceptId: r.targetConceptId,
        label: r.targetLabel,
        type: r.type,
        typeLabel: r.directionLabel,
        color: RELATIONSHIP_COLOR[r.type] ?? '#0f5c6e',
        direction: 'outgoing',
        note: r.note,
        status: r.verificationStatus,
        hasMesh,
      });
    }

    for (const r of relationships.incoming) {
      if (typeFilter !== 'all' && r.type !== typeFilter) continue;
      const srcRec = getStructureRecordV2(r.sourceConceptId, atlas);
      const hasMesh = (conceptPartsMap.get(r.sourceConceptId)?.length ?? 0) > 0;
      items.push({
        key: `in-${r.id}`,
        conceptId: r.sourceConceptId,
        label: srcRec.canonicalName,
        type: r.type,
        typeLabel: `${r.directionLabel} (Incoming)`,
        color: RELATIONSHIP_COLOR[r.type] ?? '#0f5c6e',
        direction: 'incoming',
        note: r.note,
        status: r.verificationStatus,
        hasMesh,
      });
    }

    if (typeFilter === 'all') {
      for (const fb of relationships.fallbackRelated) {
        const hasMesh = (conceptPartsMap.get(fb.conceptId)?.length ?? 0) > 0;
        items.push({
          key: `fb-${fb.conceptId}`,
          conceptId: fb.conceptId,
          label: fb.name,
          type: 'related',
          typeLabel: 'Associated Structure',
          color: '#64748b',
          direction: 'curated',
          note: `Cataloged anatomical relation with ${activeRecord.canonicalName}.`,
          status: 'verified',
          hasMesh,
        });
      }
    }

    return items;
  }, [relationships, typeFilter, atlas, activeRecord.canonicalName, conceptPartsMap]);

  const visibleNodes = useMemo(
    () => (showAllNodes ? allCombinedNodes : allCombinedNodes.slice(0, INITIAL_BATCH_SIZE)),
    [allCombinedNodes, showAllNodes],
  );

  const ontologyOnlyNodes = useMemo(
    () => allCombinedNodes.filter((n) => !n.hasMesh),
    [allCombinedNodes],
  );

  // Build role-based GPU color overrides on top of Natural Anatomy base + illustrative spatial connectors
  const { sceneState, activeLegendRoles } = useMemo(() => {
    const selectedIds = new Set<string>(conceptPartsMap.get(selectedId) ?? []);
    const colorOverrides: Record<string, string> = effectiveAtlas
      ? resolveNaturalAnatomyColors(effectiveAtlas)
      : {};
    const edges: SceneRelationshipEdge[] = [];
    const legendMap = new Map<string, { label: string; color: string }>();

    if (highlightMode !== 'natural') {
      for (const pid of selectedIds) {
        colorOverrides[pid] = CENTER_NODE_COLOR;
      }
    }

    const centerPos = getConceptWorldCenter(selectedId, conceptPartsMap, partMap);

    if (highlightMode === 'network') {
      for (const node of visibleNodes) {
        if (!node.conceptId || !node.hasMesh) continue;
        const partIds = conceptPartsMap.get(node.conceptId) ?? [];
        for (const el of partIds) {
          selectedIds.add(el);
          if (!conceptPartsMap.get(selectedId)?.includes(el)) {
            colorOverrides[el] = node.color;
          }
        }
        legendMap.set(node.type, {
          label: node.typeLabel.replace(' (Incoming)', ''),
          color: node.color,
        });

        if (showConnectors && centerPos) {
          const targetPos = getConceptWorldCenter(node.conceptId, conceptPartsMap, partMap);
          if (targetPos) {
            edges.push({
              id: node.key,
              from: centerPos,
              to: targetPos,
              color: node.color,
              direction: node.direction,
            });
          }
        }
      }
    }

    const state: SceneState = {
      embedded: true,
      suppressHoverTooltip: true,
      anatomySex: studyState.preferredSex,
      explode: 0,
      visible: DEFAULT_VISIBLE,
      selected: highlightMode === 'natural' ? [] : Array.from(selectedIds),
      isolate: false,
      ghostSurroundings: highlightMode !== 'natural' && selectedIds.size > 0,
      partColorOverrides: colorOverrides,
      relationshipEdges: highlightMode === 'natural' ? [] : edges,
      interactionMode: 'orbit',
      view: activeRecord.visualization.preferredView,
      rotate: false,
      reset: 0,
      focusRequest,
    };

    return {
      sceneState: state,
      activeLegendRoles: Array.from(legendMap.values()),
    };
  }, [
    effectiveAtlas,
    studyState.preferredSex,
    conceptPartsMap,
    partMap,
    selectedId,
    highlightMode,
    visibleNodes,
    showConnectors,
    activeRecord.visualization.preferredView,
    focusRequest,
  ]);

  const activeSystem = CANONICAL_SYSTEMS.find((s) => s.id === activeRecord.canonicalSystem);
  const saved = isBookmarked('structure', activeRecord.conceptId);

  const selectStructure = (cid: string) => {
    setSelectedId(cid);
    setShowAllNodes(false);
    setFocusRequest((n) => n + 1);
  };

  return (
    <div className="a360-page">
      <header className="a360-page-header">
        <p className="a360-kicker">3D Spatial Anatomical Network & Pathways</p>
        <h1>Structure Relationship Explorer</h1>
        <p className="a360-lead">
          Explore verified muscle origins and insertions, joint articulations, arterial supply,
          venous drainage, innervation, and anatomical neighbors directly in 3D space with
          directional connectors and an instant 2D radial graph toggle.
        </p>
      </header>

      <PageOrientationBar
        whatThisIs="See how one body part connects to blood vessels, nerves, bones, and neighbors in 3D or 2D."
        primaryHint="Pick any body part on the left, then click any connected card to jump between neighbors or switch to 2D diagram view."
        spokenSummary="How Parts Connect, the Structure Relationship Explorer. Select a body part on the left to trace its blood supply, nerve control, muscle attachments, and nearby organs in 3D or as a simple 2D map."
        howToSteps={[
          'Pick an organ or muscle from the left list (start with Heart or Biceps brachii).',
          'Use the filter pills to focus on blood supply, nerves, or attachments.',
          'Click Study Context to learn why those connections matter.',
        ]}
      />

      <div className="a360-rel-workspace">
        <aside className="a360-rel-sidebar" aria-label="Select central structure">
          <div className="a360-inline-search">
            <Search size={15} />
            <input
              type="search"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter structures…"
              aria-label="Filter anatomical structures"
            />
          </div>

          <select
            className="a360-select-compact"
            aria-label="Filter by anatomical system"
            value={systemFilter}
            onChange={(e) => setSystemFilter(e.target.value as CanonicalSystemId | 'all')}
          >
            <option value="all">All Systems</option>
            {CANONICAL_SYSTEMS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name.en}
              </option>
            ))}
          </select>

          <div className="a360-rel-selector-list">
            {curatedList.map((item) => (
              <button
                key={item.conceptId}
                type="button"
                className={`a360-rel-list-btn ${item.conceptId === selectedId ? 'active' : ''}`}
                onClick={() => selectStructure(item.conceptId)}
              >
                <strong>{item.canonicalName}</strong>
                <span>
                  {item.category} · {item.location.region}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="a360-rel-stage" aria-live="polite">
          <div className="a360-detail-top">
            <div>
              <p className="a360-kicker">
                {activeSystem?.name.en} · {activeRecord.category} · {activeRecord.conceptId} ·{' '}
                {getReviewStatusLabel(activeRecord.provenance.verificationStatus)}
              </p>
              <h2>{activeRecord.canonicalName}</h2>
              {activeRecord.latinName && (
                <p className="a360-muted">Latin: <em>{activeRecord.latinName}</em></p>
              )}
            </div>

            <div className="a360-ref-actions">
              <div className="a360-segmented-toggle" role="group" aria-label="Relationship view mode">
                <button
                  type="button"
                  className={`a360-filter-btn ${viewMode === '3d' ? 'active' : ''}`}
                  aria-pressed={viewMode === '3d'}
                  onClick={() => setViewMode('3d')}
                >
                  <Box size={14} /> 3D Spatial Network
                </button>
                <button
                  type="button"
                  className={`a360-filter-btn ${viewMode === '2d' ? 'active' : ''}`}
                  aria-pressed={viewMode === '2d'}
                  onClick={() => setViewMode('2d')}
                >
                  <Network size={14} /> 2D Radial Graph
                </button>
              </div>

              <button
                type="button"
                className={`a360-btn-secondary ${saved ? 'is-saved' : ''}`}
                onClick={() =>
                  toggleBookmark({
                    kind: 'structure',
                    targetId: activeRecord.conceptId,
                    title: activeRecord.canonicalName,
                    subtitle: activeSystem?.name.en,
                    canonicalSystem: activeRecord.canonicalSystem,
                  })
                }
              >
                <Bookmark size={14} /> {saved ? 'Saved' : 'Save'}
              </button>

              {onOpenStudyContext && (
                <button
                  type="button"
                  className="a360-btn-secondary"
                  onClick={() =>
                    onOpenStudyContext({
                      conceptId: activeRecord.conceptId,
                      systemId: activeRecord.canonicalSystem,
                      sex: studyState.preferredSex,
                      sourceModule: 'relationships',
                    })
                  }
                >
                  Open Connected Study Workspace
                </button>
              )}
              {activeRecord.visualization.inModel && (
                <button
                  type="button"
                  className="a360-btn-primary"
                  onClick={() => onInspectConcept(activeRecord.conceptId)}
                >
                  Open in 3D Explorer <ArrowRight size={15} />
                </button>
              )}
            </div>
          </div>

          <div className="a360-filter-row" aria-label="Filter relationship types">
            {(
              [
                ['all', `All Relations (${allCombinedNodes.length})`],
                ['origin', 'Origin'],
                ['insertion', 'Insertion'],
                ['articulation', 'Articulations'],
                ['arterial_supply', 'Arterial'],
                ['venous_drainage', 'Venous'],
                ['innervation', 'Innervation'],
                ['antagonist', 'Antagonist'],
              ] as [RelationshipType | 'all', string][]
            ).map(([t, label]) => (
              <button
                key={t}
                type="button"
                className={`a360-filter-btn ${typeFilter === t ? 'active' : ''}`}
                onClick={() => setTypeFilter(t)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Primary 3D Spatial Network Viewport (Default) */}
          {viewMode === '3d' && (
            <div className="a360-rel-3d-wrap" data-testid="relationship-3d-stage">
              <div className="a360-rel-3d-bar">
                <span>
                  <Layers size={14} /> 3D Spatial Network · Click any highlighted organ to pivot
                </span>
                <div className="a360-level-bar">
                  <button
                    type="button"
                    className={`a360-filter-btn ${highlightMode === 'network' ? 'active' : ''}`}
                    onClick={() => setHighlightMode('network')}
                  >
                    Full Network
                  </button>
                  <button
                    type="button"
                    className={`a360-filter-btn ${highlightMode === 'center' ? 'active' : ''}`}
                    onClick={() => setHighlightMode('center')}
                  >
                    Focal Organ Only
                  </button>
                  <button
                    type="button"
                    className={`a360-filter-btn ${highlightMode === 'natural' ? 'active' : ''}`}
                    onClick={() => setHighlightMode('natural')}
                  >
                    Natural Anatomy
                  </button>
                  <button
                    type="button"
                    className={`a360-filter-btn ${showConnectors ? 'active' : ''}`}
                    aria-pressed={showConnectors}
                    onClick={() => setShowConnectors((v) => !v)}
                  >
                    {showConnectors ? 'Illustrative Connectors: On' : 'Illustrative Connectors: Off'}
                  </button>
                </div>
              </div>

              <div className="a360-rel-3d-viewport a360-rel-3d-primary">
                {atlas && effectiveAtlas ? (
                  <Suspense
                    fallback={<div className="a360-empty-box">Loading 3D spatial network…</div>}
                  >
                    <AnatomyScene
                      atlas={atlas}
                      state={sceneState}
                      onSelect={(partId) => {
                        const part = effectiveAtlas.parts.find((p) => p.id === partId);
                        if (part) selectStructure(part.conceptId);
                      }}
                      onProgress={() => {}}
                      onError={() => {}}
                    />
                  </Suspense>
                ) : (
                  <div className="a360-empty-box">Loading 3D atlas catalog…</div>
                )}
              </div>

              {/* Dual-coded role color legend + scientific honesty disclosure */}
              <div className="a360-color-legend" aria-label="3D relationship color key">
                <span className="a360-legend-item">
                  <span className="a360-swatch" style={{ backgroundColor: CENTER_NODE_COLOR }} />
                  Focal: {activeRecord.canonicalName}
                </span>
                {activeLegendRoles.map((role) => (
                  <span key={role.label} className="a360-legend-item">
                    <span className="a360-swatch" style={{ backgroundColor: role.color }} />
                    {role.label}
                  </span>
                ))}
              </div>
              <p className="a360-connector-note">
                <strong>Spatial Representation Note:</strong> Highlighted organs are verified 3D
                BodyParts3D meshes; curved arrows are <em>illustrative spatial connectors</em>{' '}
                linking bounding-box centers (not anatomical vessel or nerve trajectories).
              </p>
            </div>
          )}

          {/* Secondary 2D Radial SVG Graph (Toggleable) */}
          {viewMode === '2d' && (
            <div className="a360-rel-diagram-box" data-testid="relationship-2d-stage">
              {visibleNodes.length === 0 ? (
                <div className="a360-empty-box">
                  <p>
                    No relationships match the active filter for {activeRecord.canonicalName}. Reset
                    to &ldquo;All Relations&rdquo; or inspect the structure in Reference View.
                  </p>
                  <button
                    type="button"
                    className="a360-btn-secondary"
                    onClick={() => setTypeFilter('all')}
                  >
                    <RotateCcw size={14} /> Reset Relationship Filter
                  </button>
                </div>
              ) : (
                <svg
                  viewBox="0 0 760 400"
                  className="a360-rel-svg"
                  role="img"
                  aria-label={`Anatomical relationship graph centered on ${activeRecord.canonicalName}`}
                >
                  {visibleNodes.map((node, i) => {
                    const angle = (i / visibleNodes.length) * Math.PI * 2 - Math.PI / 2;
                    const rx = 270;
                    const ry = 148;
                    const cx = 380 + Math.cos(angle) * rx;
                    const cy = 200 + Math.sin(angle) * ry;
                    return (
                      <g key={`edge-${node.key}`}>
                        <line
                          x1={380}
                          y1={200}
                          x2={cx}
                          y2={cy}
                          stroke={node.color}
                          strokeWidth={1.75}
                          strokeDasharray={node.direction === 'curated' ? '4 4' : undefined}
                          opacity={0.75}
                        />
                      </g>
                    );
                  })}

                  {visibleNodes.map((node, i) => {
                    const angle = (i / visibleNodes.length) * Math.PI * 2 - Math.PI / 2;
                    const rx = 270;
                    const ry = 148;
                    const cx = 380 + Math.cos(angle) * rx;
                    const cy = 200 + Math.sin(angle) * ry;
                    const shortTitle =
                      node.label.length > 22 ? `${node.label.slice(0, 20)}…` : node.label;
                    return (
                      <g
                        key={node.key}
                        className="a360-svg-node"
                        tabIndex={node.conceptId ? 0 : undefined}
                        role={node.conceptId ? 'button' : undefined}
                        aria-label={`Explore ${node.label} (${node.typeLabel})`}
                        onClick={() => node.conceptId && selectStructure(node.conceptId)}
                        onKeyDown={(e) => {
                          if ((e.key === 'Enter' || e.key === ' ') && node.conceptId) {
                            e.preventDefault();
                            selectStructure(node.conceptId);
                          }
                        }}
                      >
                        <rect
                          x={cx - 82}
                          y={cy - 22}
                          width={164}
                          height={44}
                          rx={8}
                          fill="#ffffff"
                          stroke={node.color}
                          strokeWidth={1.5}
                        />
                        <text
                          x={cx}
                          y={cy - 3}
                          textAnchor="middle"
                          fontSize="11.5"
                          fontWeight="600"
                          fill="#0f172a"
                        >
                          {shortTitle}
                        </text>
                        <text
                          x={cx}
                          y={cy + 13}
                          textAnchor="middle"
                          fontSize="9.5"
                          fill={node.color}
                        >
                          {node.typeLabel}
                        </text>
                      </g>
                    );
                  })}

                  <g>
                    <rect
                      x={284}
                      y={170}
                      width={192}
                      height={60}
                      rx={10}
                      fill="#0f5c6e"
                      stroke="#094250"
                      strokeWidth={2}
                    />
                    <text
                      x={380}
                      y={196}
                      textAnchor="middle"
                      fontSize="13.5"
                      fontWeight="700"
                      fill="#ffffff"
                    >
                      {activeRecord.canonicalName.length > 22
                        ? `${activeRecord.canonicalName.slice(0, 20)}…`
                        : activeRecord.canonicalName}
                    </text>
                    <text
                      x={380}
                      y={214}
                      textAnchor="middle"
                      fontSize="10.5"
                      fill="#d8eef3"
                    >
                      {activeRecord.category} · {activeRecord.conceptId}
                    </text>
                  </g>
                </svg>
              )}
            </div>
          )}

          {/* Progressive Expansion Control (No silent 12-node truncation) */}
          {allCombinedNodes.length > INITIAL_BATCH_SIZE && (
            <div className="a360-expand-bar">
              <span className="a360-muted">
                Showing {visibleNodes.length} of {allCombinedNodes.length} anatomical connections
              </span>
              <button
                type="button"
                className="a360-btn-secondary"
                onClick={() => setShowAllNodes((v) => !v)}
              >
                {showAllNodes
                  ? `Show First ${INITIAL_BATCH_SIZE}`
                  : `Show All ${allCombinedNodes.length} Connections`}
              </button>
            </div>
          )}

          {ontologyOnlyNodes.length > 0 && (
            <div className="a360-coverage-box" role="note">
              <strong>Ontology-Only Connections ({ontologyOnlyNodes.length}):</strong>{' '}
              {ontologyOnlyNodes.map((n) => n.label).join(', ')} — documented in the FMA
              relationship graph without individual 3D meshes in BodyParts3D 4.0 (no synthetic
              3D coordinates are fabricated).
            </div>
          )}

          {/* Detailed Directional Relationship List */}
          <div className="a360-rel-cards-grid">
            {visibleNodes.map((node) => (
              <article key={`card-${node.key}`} className="a360-rel-item-card">
                <div className="a360-rel-item-head">
                  <span className="a360-kicker">
                    <span
                      className="a360-swatch"
                      style={{ backgroundColor: node.color }}
                      aria-hidden="true"
                    />
                    <GitBranch size={12} /> {node.typeLabel} ·{' '}
                    {getReviewStatusLabel(node.status)} ·{' '}
                    {node.hasMesh ? '3D Mesh Linked' : 'Ontology Only'}
                  </span>
                  <h3>{node.label}</h3>
                </div>
                <p>{node.note}</p>
                {node.conceptId && (
                  <div className="a360-card-actions">
                    <button
                      type="button"
                      className="a360-card-btn"
                      onClick={() => selectStructure(node.conceptId!)}
                    >
                      Focus Network Here
                    </button>
                    {onOpenStudyContext && (
                      <button
                        type="button"
                        className="a360-btn-secondary"
                        onClick={() =>
                          onOpenStudyContext({
                            conceptId: node.conceptId!,
                            relationshipId: node.key.replace(/^in-/, ''),
                            sex: studyState.preferredSex,
                            sourceModule: 'relationships',
                          })
                        }
                      >
                        Study Workspace
                      </button>
                    )}
                    {node.hasMesh && (
                      <button
                        type="button"
                        className="a360-card-link"
                        onClick={() => onInspectConcept(node.conceptId!)}
                      >
                        Inspect in 3D
                      </button>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>

          <StudyResourceList
            conceptId={activeRecord.conceptId}
            canonicalSystem={activeRecord.canonicalSystem}
            module="relationships"
            limit={3}
          />

          <div className="a360-ref-footer-links">
            <button
              type="button"
              className="a360-btn-secondary"
              onClick={() => onOpenReference(activeRecord.conceptId)}
            >
              View Full Reference Entry
            </button>
            <button
              type="button"
              className="a360-btn-secondary"
              onClick={() =>
                onOpenLearnSystem(
                  activeRecord.canonicalSystem,
                  activeRecord.education.associatedTopicIds[0],
                )
              }
            >
              <BookOpen size={14} /> Open System Lesson
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
