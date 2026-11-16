import { useMemo, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import type { Atlas } from '../anatomy';
import { CANONICAL_SYSTEMS, type CanonicalSystemId } from '../anatomy-systems';
import StructureReferenceCard from '../components/StructureReferenceCard';
import {
  getStructureRecordV2,
  KNOWLEDGE_GRAPH_V2,
  type StructureCategory,
} from '../knowledge-graph';

interface Props {
  atlas: Atlas | null;
  selectedSystem: CanonicalSystemId;
  initialConceptId?: string | null;
  onSelectSystem: (id: CanonicalSystemId) => void;
  onExploreSystem: (id: CanonicalSystemId) => void;
  onInspectPart: (partId: string) => void;
  onInspectConcept: (conceptId: string) => void;
  onOpenRelationships: (conceptId: string) => void;
  onOpenLearnSystem: (systemId: CanonicalSystemId, topicId?: string) => void;
  onOpenFlashcards: (systemId: CanonicalSystemId) => void;
  onOpenPracticalLab: () => void;
}

export default function SystemsPage({
  atlas,
  selectedSystem,
  initialConceptId,
  onSelectSystem,
  onExploreSystem,
  onInspectPart,
  onInspectConcept,
  onOpenRelationships,
  onOpenLearnSystem,
  onOpenFlashcards,
  onOpenPracticalLab,
}: Props) {
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<StructureCategory | 'all'>('all');
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(
    initialConceptId ?? null,
  );

  const active = useMemo(
    () => CANONICAL_SYSTEMS.find((s) => s.id === selectedSystem) ?? CANONICAL_SYSTEMS[0],
    [selectedSystem],
  );

  const systemKnowledgeRecords = useMemo(
    () =>
      KNOWLEDGE_GRAPH_V2.filter(
        (r) =>
          r.canonicalSystem === active.id &&
          (categoryFilter === 'all' || r.category === categoryFilter),
      ),
    [active.id, categoryFilter],
  );

  const systemCategories = useMemo(() => {
    const cats = new Set(
      KNOWLEDGE_GRAPH_V2.filter((r) => r.canonicalSystem === active.id).map((r) => r.category),
    );
    return Array.from(cats);
  }, [active.id]);

  const systemParts = useMemo(() => {
    if (!atlas) return [];
    const allowed = new Set(active.meshSystems);
    const term = filter.toLowerCase().trim();
    const list = atlas.parts.filter((p) => allowed.has(p.system));
    if (!term) return list;
    return list.filter(
      (p) => p.name.toLowerCase().includes(term) || p.conceptId.toLowerCase().includes(term),
    );
  }, [atlas, active, filter]);

  const activeRefConceptId =
    selectedConceptId ??
    systemKnowledgeRecords[0]?.conceptId ??
    active.featuredConceptIds[0] ??
    null;

  const activeRecord = useMemo(
    () => (activeRefConceptId ? getStructureRecordV2(activeRefConceptId, atlas) : null),
    [activeRefConceptId, atlas],
  );

  return (
    <div className="a360-page">
      <header className="a360-page-header">
        <p className="a360-kicker">Anatomical Organization & Reference Library</p>
        <h1>12 Human Body Systems & Structure Reference</h1>
        <p className="a360-lead">
          Select a body system and any structure below to study hierarchical anatomy, verified
          relationships, multi-level explanations, model coverage status, lessons, and 3D inspection.
        </p>
      </header>

      <div className="a360-split-layout">
        <aside className="a360-system-nav" aria-label="Anatomical systems">
          {CANONICAL_SYSTEMS.map((sys) => {
            const count = atlas
              ? atlas.parts.filter((p) => sys.meshSystems.includes(p.system)).length
              : 0;
            const isSelected = sys.id === active.id;
            return (
              <button
                key={sys.id}
                type="button"
                className={`a360-system-nav-item ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  onSelectSystem(sys.id);
                  setFilter('');
                  setCategoryFilter('all');
                  setSelectedConceptId(null);
                }}
              >
                <span className="a360-swatch" style={{ background: sys.color }} aria-hidden="true" />
                <span className="a360-system-nav-label">{sys.name.en}</span>
                <span className="a360-tabular-count">{count || '—'}</span>
              </button>
            );
          })}
        </aside>

        <section className="a360-system-detail" aria-live="polite">
          <div className="a360-detail-top">
            <div>
              <p className="a360-kicker">
                {active.coverageLabel} · {active.meshSystems.join(' / ')}
              </p>
              <h2>{active.name.en}</h2>
            </div>
            <div className="a360-ref-actions">
              <button
                type="button"
                className="a360-btn-secondary"
                onClick={() => onOpenLearnSystem(active.id)}
              >
                Open System Lessons
              </button>
              <button
                type="button"
                className="a360-btn-primary"
                onClick={() => onExploreSystem(active.id)}
              >
                Show System in 3D
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <p className="a360-body-copy">{active.description.en}</p>

          <div className="a360-coverage-box">
            <strong>3D Coverage & Dataset Note:</strong> {active.coverageNote}
          </div>

          {systemKnowledgeRecords.length > 0 && (
            <div className="a360-subblock">
              <div className="a360-list-header">
                <h3>Curated Structures by Category ({systemKnowledgeRecords.length})</h3>
                {systemCategories.length > 1 && (
                  <div className="a360-filter-row" style={{ marginBottom: 0 }}>
                    <button
                      type="button"
                      className={`a360-filter-btn ${categoryFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setCategoryFilter('all')}
                    >
                      All
                    </button>
                    {systemCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`a360-filter-btn ${categoryFilter === cat ? 'active' : ''}`}
                        onClick={() => setCategoryFilter(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="a360-chip-grid">
                {systemKnowledgeRecords.map((rec) => (
                  <button
                    key={rec.conceptId}
                    type="button"
                    className={`a360-structure-btn ${activeRecord?.conceptId === rec.conceptId ? 'is-selected' : ''}`}
                    onClick={() => setSelectedConceptId(rec.conceptId)}
                  >
                    <span className="a360-capitalize">{rec.canonicalName}</span>
                    <span className="a360-tabular-count">
                      {rec.visualization.inModel ? rec.category : 'Planned'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeRecord && (
            <StructureReferenceCard
              record={activeRecord}
              atlas={atlas}
              onInspectConcept={onInspectConcept}
              onOpenRelationships={onOpenRelationships}
              onOpenLearnSystem={onOpenLearnSystem}
              onOpenFlashcards={onOpenFlashcards}
              onOpenPracticalLab={onOpenPracticalLab}
            />
          )}

          {active.plannedStructures.length > 0 && (
            <div className="a360-subblock">
              <h3>Planned / Unavailable in Current 3D Release</h3>
              <ul className="a360-planned-list">
                {active.plannedStructures.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="a360-subblock">
            <div className="a360-list-header">
              <h3>
                All Modeled 3D Meshes in System ({systemParts.length.toLocaleString()})
              </h3>
              <div className="a360-inline-search">
                <Search size={15} />
                <input
                  type="search"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder={`Filter ${active.name.en.toLowerCase()} meshes…`}
                  aria-label={`Filter ${active.name.en} structures`}
                />
              </div>
            </div>

            {!atlas ? (
              <p className="a360-muted">Loading anatomical catalog…</p>
            ) : systemParts.length === 0 ? (
              <p className="a360-muted">No meshes match &ldquo;{filter}&rdquo;.</p>
            ) : (
              <div className="a360-parts-list">
                {systemParts.slice(0, 120).map((p) => (
                  <div key={p.id} className="a360-part-row">
                    <button
                      type="button"
                      className="a360-part-select-btn"
                      onClick={() => setSelectedConceptId(p.conceptId)}
                    >
                      <span className="a360-part-name">{p.name}</span>
                      <span className="a360-part-id">{p.conceptId}</span>
                    </button>
                    <button
                      type="button"
                      className="a360-card-link"
                      onClick={() => onInspectPart(p.id)}
                    >
                      3D
                    </button>
                  </div>
                ))}
                {systemParts.length > 120 && (
                  <p className="a360-muted">
                    Showing first 120 of {systemParts.length.toLocaleString()} meshes. Refine your
                    filter above to narrow results.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
