import { useMemo, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import type { Atlas } from '../anatomy';
import { CANONICAL_SYSTEMS, type CanonicalSystemId } from '../anatomy-systems';

interface Props {
  atlas: Atlas | null;
  selectedSystem: CanonicalSystemId;
  onSelectSystem: (id: CanonicalSystemId) => void;
  onExploreSystem: (id: CanonicalSystemId) => void;
  onInspectPart: (partId: string) => void;
  onInspectConcept: (conceptId: string) => void;
}

export default function SystemsPage({
  atlas,
  selectedSystem,
  onSelectSystem,
  onExploreSystem,
  onInspectPart,
  onInspectConcept,
}: Props) {
  const [filter, setFilter] = useState('');

  const active = useMemo(
    () => CANONICAL_SYSTEMS.find((s) => s.id === selectedSystem) ?? CANONICAL_SYSTEMS[0],
    [selectedSystem],
  );

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

  const featuredConcepts = useMemo(() => {
    if (!atlas) return [];
    const byId = new Map(atlas.concepts.map((c) => [c.id, c]));
    return active.featuredConceptIds
      .map((id) => byId.get(id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));
  }, [atlas, active]);

  return (
    <div className="a360-page">
      <header className="a360-page-header">
        <p className="a360-kicker">Anatomical Organization</p>
        <h1>12 Human Body Systems</h1>
        <p className="a360-lead">
          Select a system to read its function, verify 3D coverage status, browse modeled
          structures, and launch filtered 3D exploration.
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
            <button
              type="button"
              className="a360-btn-primary"
              onClick={() => onExploreSystem(active.id)}
            >
              Show in 3D Explorer
              <ArrowRight size={16} />
            </button>
          </div>

          <p className="a360-body-copy">{active.description.en}</p>

          <div className="a360-coverage-box">
            <strong>3D Coverage Note:</strong> {active.coverageNote}
          </div>

          {featuredConcepts.length > 0 && (
            <div className="a360-subblock">
              <h3>Key Structures (Quick 3D Inspect)</h3>
              <div className="a360-chip-grid">
                {featuredConcepts.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="a360-structure-btn"
                    onClick={() => onInspectConcept(c.id)}
                  >
                    <span className="a360-capitalize">{c.name}</span>
                    <span className="a360-tabular-count">
                      {c.elements.length} {c.elements.length === 1 ? 'piece' : 'pieces'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {active.plannedStructures.length > 0 && (
            <div className="a360-subblock">
              <h3>Planned for Future Dataset Expansion (Not Yet in 3D)</h3>
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
                Available 3D Meshes ({systemParts.length.toLocaleString()})
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
              <p className="a360-muted">No meshes match "{filter}".</p>
            ) : (
              <div className="a360-parts-list">
                {systemParts.slice(0, 120).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="a360-part-row"
                    onClick={() => onInspectPart(p.id)}
                  >
                    <span className="a360-part-name">{p.name}</span>
                    <span className="a360-part-id">{p.conceptId}</span>
                  </button>
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
