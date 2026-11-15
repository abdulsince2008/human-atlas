import { useMemo, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import type { Atlas } from '../anatomy';
import { CURATED_KNOWLEDGE, type StructureKnowledge } from '../anatomy-knowledge';
import { CANONICAL_SYSTEMS, canonicalSystemForMeshSystem } from '../anatomy-systems';

interface Props {
  atlas: Atlas | null;
  onInspectConcept: (conceptId: string) => void;
  onInspectPart: (partId: string) => void;
}

interface SearchHit {
  key: string;
  title: string;
  subtitle: string;
  systemLabel: string;
  inModel: boolean;
  piecesCount: number;
  conceptId?: string;
  partId?: string;
  knowledge?: StructureKnowledge;
}

export default function SearchPage({ atlas, onInspectConcept, onInspectPart }: Props) {
  const [query, setQuery] = useState('');
  const [selectedPlanned, setSelectedPlanned] = useState<StructureKnowledge | null>(null);

  const hits = useMemo<SearchHit[]>(() => {
    const term = query.toLowerCase().trim();
    const list: SearchHit[] = [];
    const seenConcepts = new Set<string>();

    // 1. Match curated knowledge (including synonyms, common names, and planned entries)
    for (const k of CURATED_KNOWLEDGE) {
      const sys = CANONICAL_SYSTEMS.find((s) => s.id === k.canonicalSystem);
      const haystack = [
        k.anatomicalName,
        k.commonName,
        k.conceptId,
        sys?.name.en ?? '',
        ...k.synonyms,
      ]
        .join(' ')
        .toLowerCase();

      if (!term || haystack.includes(term)) {
        const concept = atlas?.concepts.find((c) => c.id === k.conceptId);
        seenConcepts.add(k.conceptId);
        list.push({
          key: `curated-${k.conceptId}`,
          title: k.anatomicalName,
          subtitle:
            k.commonName !== k.anatomicalName
              ? `${k.commonName} · ${k.conceptId}`
              : k.conceptId,
          systemLabel: sys?.name.en ?? 'Anatomy',
          inModel: k.inModel && Boolean(concept),
          piecesCount: concept?.elements.length ?? 0,
          conceptId: k.conceptId,
          knowledge: k,
        });
      }
    }

    if (!atlas) return list;

    // 2. Match remaining 3,432 concepts in atlas.json (requires non-empty query or keeps top suggestions)
    if (term) {
      const partsMap = new Map(atlas.parts.map((p) => [p.id, p]));
      const conceptMatches = atlas.concepts
        .filter((c) => {
          if (seenConcepts.has(c.id)) return false;
          const firstPart = partsMap.get(c.elements[0]);
          const canonical = firstPart ? canonicalSystemForMeshSystem(firstPart.system) : null;
          return (
            c.name.toLowerCase().includes(term) ||
            c.id.toLowerCase().includes(term) ||
            (canonical?.name.en.toLowerCase().includes(term) ?? false)
          );
        })
        .sort((a, b) => a.name.length - b.name.length)
        .slice(0, 60);

      for (const c of conceptMatches) {
        seenConcepts.add(c.id);
        const firstPart = partsMap.get(c.elements[0]);
        const canonical = firstPart ? canonicalSystemForMeshSystem(firstPart.system) : null;
        list.push({
          key: `concept-${c.id}`,
          title: c.name,
          subtitle: c.id,
          systemLabel: canonical?.name.en ?? 'Anatomy',
          inModel: true,
          piecesCount: c.elements.length,
          conceptId: c.id,
        });
      }

      // 3. Match individual part names if distinct
      const partMatches = atlas.parts
        .filter((p) => p.name.toLowerCase().includes(term) && !seenConcepts.has(p.conceptId))
        .slice(0, 25);

      for (const p of partMatches) {
        const canonical = canonicalSystemForMeshSystem(p.system);
        list.push({
          key: `part-${p.id}`,
          title: p.name,
          subtitle: `${p.id} · ${p.conceptId}`,
          systemLabel: canonical.name.en,
          inModel: true,
          piecesCount: 1,
          partId: p.id,
        });
      }
    }

    return list;
  }, [atlas, query]);

  return (
    <div className="a360-page a360-narrow">
      <header className="a360-page-header">
        <p className="a360-kicker">Anatomical Directory</p>
        <h1>Search Structures, Systems & Synonyms</h1>
        <p className="a360-lead">
          Search across 3,432 FMA concepts, 2,234 3D meshes, common names (such as breastbone,
          collarbone, windpipe), and planned expansion structures.
        </p>
      </header>

      <div className="a360-big-search">
        <Search size={18} />
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedPlanned(null);
          }}
          placeholder="Search heart, femur, windpipe, thyroid, pituitary, FMA7088…"
          aria-label="Search anatomical catalog"
        />
      </div>

      {selectedPlanned && (
        <article className="a360-planned-detail" aria-live="polite">
          <p className="a360-kicker">Not Yet Modeled in Current 3D Release</p>
          <h2>{selectedPlanned.anatomicalName}</h2>
          <p>{selectedPlanned.location.en}</p>
          <p>{selectedPlanned.mainFunction.en}</p>
          <ul className="a360-fact-list">
            {selectedPlanned.characteristics.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </article>
      )}

      <div className="a360-search-results-list">
        {hits.length === 0 ? (
          <div className="a360-empty-box">
            <p>
              No anatomical structures match &ldquo;{query}&rdquo;. Try an anatomical name, common
              term (e.g. shinbone, kneecap), system name, or FMA identifier.
            </p>
          </div>
        ) : (
          hits.map((hit) => (
            <div key={hit.key} className="a360-search-row">
              <div className="a360-search-row-info">
                <strong className="a360-capitalize">{hit.title}</strong>
                <span>
                  {hit.systemLabel} · {hit.subtitle} ·{' '}
                  {hit.inModel
                    ? `${hit.piecesCount} ${hit.piecesCount === 1 ? '3D piece' : '3D pieces'}`
                    : 'Planned (Not in current 3D model)'}
                </span>
              </div>
              {hit.inModel ? (
                <button
                  type="button"
                  className="a360-card-btn"
                  onClick={() => {
                    if (hit.partId) onInspectPart(hit.partId);
                    else if (hit.conceptId) onInspectConcept(hit.conceptId);
                  }}
                >
                  Inspect in 3D <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  className="a360-btn-secondary"
                  onClick={() => hit.knowledge && setSelectedPlanned(hit.knowledge)}
                >
                  Read Notes
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
