import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  Eye,
  GitBranch,
  Layers,
  RotateCcw,
  Search,
} from 'lucide-react';
import {
  DEFAULT_VISIBLE,
  type Atlas,
  type SceneState,
} from '../anatomy';
import { CANONICAL_SYSTEMS, type CanonicalSystemId } from '../anatomy-systems';
import {
  getRelationshipsForConcept,
  getStructureRecordV2,
  KNOWLEDGE_GRAPH_V2,
  type RelationshipType,
} from '../knowledge-graph';
import { useStudy } from '../components/StudyContext';

const AnatomyScene = lazy(() => import('../scene'));

interface Props {
  atlas: Atlas | null;
  initialConceptId?: string | null;
  onInspectConcept: (conceptId: string) => void;
  onOpenLearnSystem: (systemId: CanonicalSystemId, topicId?: string) => void;
  onOpenReference: (conceptId: string) => void;
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

export default function RelationshipsPage({
  atlas,
  initialConceptId,
  onInspectConcept,
  onOpenLearnSystem,
  onOpenReference,
}: Props) {
  const [selectedId, setSelectedId] = useState<string>(initialConceptId ?? 'FMA7088');
  const [filterText, setFilterText] = useState('');
  const [systemFilter, setSystemFilter] = useState<CanonicalSystemId | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<RelationshipType | 'all'>('all');
  const [show3DPreview, setShow3DPreview] = useState(false);
  const [highlightMode, setHighlightMode] = useState<'center' | 'network'>('network');
  const [focusRequest, setFocusRequest] = useState(1);

  const { isBookmarked, toggleBookmark } = useStudy();

  useEffect(() => {
    if (initialConceptId) {
      setSelectedId(initialConceptId);
      setFocusRequest((n) => n + 1);
    }
  }, [initialConceptId]);

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
    () => getStructureRecordV2(selectedId, atlas),
    [selectedId, atlas],
  );

  const relationships = useMemo(
    () => getRelationshipsForConcept(selectedId, atlas),
    [selectedId, atlas],
  );

  const combinedNodes = useMemo(() => {
    const items: {
      key: string;
      conceptId?: string;
      label: string;
      type: RelationshipType | 'related';
      typeLabel: string;
      direction: 'outgoing' | 'incoming' | 'curated';
      note: string;
      status: string;
    }[] = [];

    for (const r of relationships.outgoing) {
      if (typeFilter !== 'all' && r.type !== typeFilter) continue;
      items.push({
        key: r.id,
        conceptId: r.targetConceptId,
        label: r.targetLabel,
        type: r.type,
        typeLabel: r.directionLabel,
        direction: 'outgoing',
        note: r.note,
        status: r.verificationStatus,
      });
    }

    for (const r of relationships.incoming) {
      if (typeFilter !== 'all' && r.type !== typeFilter) continue;
      const srcRec = getStructureRecordV2(r.sourceConceptId, atlas);
      items.push({
        key: `in-${r.id}`,
        conceptId: r.sourceConceptId,
        label: srcRec.canonicalName,
        type: r.type,
        typeLabel: `${r.directionLabel} (Incoming)`,
        direction: 'incoming',
        note: r.note,
        status: r.verificationStatus,
      });
    }

    if (typeFilter === 'all') {
      for (const fb of relationships.fallbackRelated) {
        items.push({
          key: `fb-${fb.conceptId}`,
          conceptId: fb.conceptId,
          label: fb.name,
          type: 'related',
          typeLabel: 'Associated Structure',
          direction: 'curated',
          note: `Cataloged anatomical relation with ${activeRecord.canonicalName}.`,
          status: 'verified',
        });
      }
    }

    return items.slice(0, 12);
  }, [relationships, typeFilter, atlas, activeRecord.canonicalName]);

  const sceneState = useMemo<SceneState>(() => {
    const cMap = atlas ? new Map(atlas.concepts.map((c) => [c.id, c])) : null;
    const selectedIds = new Set<string>(cMap?.get(selectedId)?.elements ?? []);
    if (highlightMode === 'network' && cMap) {
      for (const node of combinedNodes) {
        if (!node.conceptId) continue;
        for (const el of cMap.get(node.conceptId)?.elements ?? []) {
          selectedIds.add(el);
        }
      }
    }
    return {
      embedded: true,
      suppressHoverTooltip: true,
      explode: 0,
      visible: DEFAULT_VISIBLE,
      selected: Array.from(selectedIds),
      isolate: false,
      ghostSurroundings: selectedIds.size > 0,
      interactionMode: 'orbit',
      view: activeRecord.visualization.preferredView,
      rotate: false,
      reset: 0,
      focusRequest,
    };
  }, [atlas, selectedId, highlightMode, combinedNodes, activeRecord.visualization.preferredView, focusRequest]);

  const activeSystem = CANONICAL_SYSTEMS.find((s) => s.id === activeRecord.canonicalSystem);
  const saved = isBookmarked('structure', activeRecord.conceptId);

  const selectStructure = (cid: string) => {
    setSelectedId(cid);
    setFocusRequest((n) => n + 1);
  };

  return (
    <div className="a360-page">
      <header className="a360-page-header">
        <p className="a360-kicker">Anatomical Connections & Pathways</p>
        <h1>Structure Relationship Explorer</h1>
        <p className="a360-lead">
          Investigate verified muscle origins and insertions, joint articulations, arterial supply,
          venous drainage, innervation, and adjacent anatomical neighbors—connected directly to 3D highlighting.
        </p>
      </header>

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
                {activeSystem?.name.en} · {activeRecord.category} · {activeRecord.conceptId}
              </p>
              <h2>{activeRecord.canonicalName}</h2>
              {activeRecord.latinName && (
                <p className="a360-muted">Latin: <em>{activeRecord.latinName}</em></p>
              )}
            </div>

            <div className="a360-ref-actions">
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
              <button
                type="button"
                className="a360-btn-secondary"
                onClick={() => setShow3DPreview((v) => !v)}
              >
                <Eye size={14} /> {show3DPreview ? 'Hide 3D Preview' : 'Show 3D Network'}
              </button>
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
                ['all', 'All Relations'],
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

          {/* Interactive SVG Network Map */}
          <div className="a360-rel-diagram-box">
            {combinedNodes.length === 0 ? (
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
                {/* Radial links */}
                {combinedNodes.map((node, i) => {
                  const angle = (i / combinedNodes.length) * Math.PI * 2 - Math.PI / 2;
                  const rx = 270;
                  const ry = 148;
                  const cx = 380 + Math.cos(angle) * rx;
                  const cy = 200 + Math.sin(angle) * ry;
                  const stroke =
                    node.type === 'related' ? '#64748b' : RELATIONSHIP_COLOR[node.type] ?? '#0f5c6e';
                  return (
                    <g key={`edge-${node.key}`}>
                      <line
                        x1={380}
                        y1={200}
                        x2={cx}
                        y2={cy}
                        stroke={stroke}
                        strokeWidth={1.75}
                        strokeDasharray={node.direction === 'curated' ? '4 4' : undefined}
                        opacity={0.75}
                      />
                    </g>
                  );
                })}

                {/* Neighbor Nodes */}
                {combinedNodes.map((node, i) => {
                  const angle = (i / combinedNodes.length) * Math.PI * 2 - Math.PI / 2;
                  const rx = 270;
                  const ry = 148;
                  const cx = 380 + Math.cos(angle) * rx;
                  const cy = 200 + Math.sin(angle) * ry;
                  const stroke =
                    node.type === 'related' ? '#64748b' : RELATIONSHIP_COLOR[node.type] ?? '#0f5c6e';
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
                        stroke={stroke}
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
                        fill={stroke}
                      >
                        {node.typeLabel}
                      </text>
                    </g>
                  );
                })}

                {/* Center Focal Node */}
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

          {show3DPreview && (
            <div className="a360-rel-3d-wrap">
              <div className="a360-rel-3d-bar">
                <span>
                  <Layers size={14} /> Inline 3D Relationship Highlight
                </span>
                <div className="a360-level-bar">
                  <button
                    type="button"
                    className={`a360-filter-btn ${highlightMode === 'network' ? 'active' : ''}`}
                    onClick={() => setHighlightMode('network')}
                  >
                    Highlight Full Network
                  </button>
                  <button
                    type="button"
                    className={`a360-filter-btn ${highlightMode === 'center' ? 'active' : ''}`}
                    onClick={() => setHighlightMode('center')}
                  >
                    Target Structure Only
                  </button>
                </div>
              </div>
              <div className="a360-rel-3d-viewport">
                {atlas ? (
                  <Suspense
                    fallback={<div className="a360-empty-box">Loading 3D preview…</div>}
                  >
                    <AnatomyScene
                      atlas={atlas}
                      state={sceneState}
                      onSelect={(partId) => {
                        const part = atlas.parts.find((p) => p.id === partId);
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
            </div>
          )}

          {/* Detailed Directional Relationship List */}
          <div className="a360-rel-cards-grid">
            {combinedNodes.map((node) => (
              <article key={`card-${node.key}`} className="a360-rel-item-card">
                <div className="a360-rel-item-head">
                  <span className="a360-kicker">
                    <GitBranch size={12} /> {node.typeLabel} · Status: {node.status}
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
                      Focus Graph Here
                    </button>
                    <button
                      type="button"
                      className="a360-card-link"
                      onClick={() => onInspectConcept(node.conceptId!)}
                    >
                      Inspect in 3D
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>

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
