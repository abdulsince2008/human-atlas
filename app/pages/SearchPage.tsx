import { useMemo, useState } from 'react';
import { ArrowRight, Bookmark, BookOpen, GitBranch, Search } from 'lucide-react';
import type { Atlas } from '../anatomy';
import { CANONICAL_SYSTEMS, type CanonicalSystemId } from '../anatomy-systems';
import StructureReferenceCard from '../components/StructureReferenceCard';
import { useStudy } from '../components/StudyContext';
import {
  getCoverageBadgeLabel,
  getStructureRecordV2,
  type StructureCategory,
} from '../knowledge-graph';
import {
  resolveRelatedNames,
  SEARCH_SUGGESTIONS,
  searchAnatomyCatalog,
  type SearchResultItem,
} from '../search-engine';

interface Props {
  atlas: Atlas | null;
  onInspectConcept: (conceptId: string) => void;
  onInspectPart: (partId: string) => void;
  onOpenRelationships: (conceptId: string) => void;
  onOpenLearnSystem: (systemId: CanonicalSystemId, topicId?: string) => void;
  onOpenFlashcards: (systemId: CanonicalSystemId) => void;
  onOpenPracticalLab: () => void;
}

const CATEGORIES: { id: StructureCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Categories' },
  { id: 'organ', label: 'Organs' },
  { id: 'bone', label: 'Bones' },
  { id: 'muscle', label: 'Muscles' },
  { id: 'artery', label: 'Arteries' },
  { id: 'vein', label: 'Veins' },
  { id: 'nerve', label: 'Nerves' },
  { id: 'gland', label: 'Glands' },
  { id: 'sensory', label: 'Sensory' },
  { id: 'lymphatic', label: 'Lymphatic' },
];

export default function SearchPage({
  atlas,
  onInspectConcept,
  onInspectPart,
  onOpenRelationships,
  onOpenLearnSystem,
  onOpenFlashcards,
  onOpenPracticalLab,
}: Props) {
  const [query, setQuery] = useState('');
  const [systemFilter, setSystemFilter] = useState<CanonicalSystemId | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<StructureCategory | 'all'>('all');
  const [modelOnly, setModelOnly] = useState(false);
  const [focusedHit, setFocusedHit] = useState<SearchResultItem | null>(null);

  const { state, addRecentSearch, isBookmarked, toggleBookmark } = useStudy();

  const discovery = useMemo(
    () =>
      searchAnatomyCatalog(query, atlas, {
        system: systemFilter,
        category: categoryFilter,
        modelOnly,
        limit: 75,
      }),
    [query, atlas, systemFilter, categoryFilter, modelOnly],
  );

  const focusedRecordV2 = useMemo(() => {
    if (!focusedHit?.conceptId) return null;
    return getStructureRecordV2(focusedHit.conceptId, atlas, focusedHit.anatomicalName);
  }, [focusedHit, atlas]);

  const applyQuery = (q: string) => {
    setQuery(q);
    setFocusedHit(null);
    if (q.trim().length >= 2) addRecentSearch(q.trim());
  };

  return (
    <div className="a360-page">
      <header className="a360-page-header">
        <p className="a360-kicker">Anatomical Discovery Engine</p>
        <h1>Search Structures, Latin Terms, Synonyms & Systems</h1>
        <p className="a360-lead">
          Indexes all 3,432 FMA concepts, 2,234 3D meshes, Latin nomenclature, common names
          (collarbone, windpipe, shinbone), anatomical regions, definitions, and typo-tolerant queries.
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
            setFocusedHit(null);
          }}
          onBlur={() => {
            if (query.trim().length >= 2) addRecentSearch(query.trim());
          }}
          placeholder="Search heart, cor, cerebrum, windpipe, biceps, FMA7088, thorax…"
          aria-label="Search anatomical catalog"
        />
      </div>

      {/* Filters */}
      <div className="a360-quiz-filters" style={{ marginTop: '12px' }}>
        <label className="a360-select-field">
          <span>System Filter</span>
          <select
            value={systemFilter}
            onChange={(e) => setSystemFilter(e.target.value as CanonicalSystemId | 'all')}
          >
            <option value="all">All 12 Systems</option>
            {CANONICAL_SYSTEMS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name.en}
              </option>
            ))}
          </select>
        </label>

        <label className="a360-select-field">
          <span>Category</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as StructureCategory | 'all')}
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <div className="a360-filter-toggle-wrap">
          <button
            type="button"
            className={`a360-filter-btn ${modelOnly ? 'active' : ''}`}
            onClick={() => setModelOnly((v) => !v)}
          >
            3D Modeled Only
          </button>
        </div>
      </div>

      {/* Recent Searches & Suggestions */}
      <div className="a360-search-chips-bar">
        {state.recentSearches.length > 0 && (
          <div className="a360-search-chip-group">
            <span className="a360-stat-label">Recent:</span>
            {state.recentSearches.slice(0, 6).map((rs) => (
              <button
                key={rs}
                type="button"
                className="a360-filter-btn"
                onClick={() => applyQuery(rs)}
              >
                {rs}
              </button>
            ))}
          </div>
        )}
        <div className="a360-search-chip-group">
          <span className="a360-stat-label">Suggested:</span>
          {SEARCH_SUGGESTIONS.slice(0, 7).map((sg) => (
            <button
              key={sg}
              type="button"
              className="a360-filter-btn"
              onClick={() => applyQuery(sg)}
            >
              {sg}
            </button>
          ))}
        </div>
      </div>

      {focusedRecordV2 && (
        <div style={{ marginTop: '16px', marginBottom: '20px' }}>
          <StructureReferenceCard
            record={focusedRecordV2}
            atlas={atlas}
            onInspectConcept={onInspectConcept}
            onOpenRelationships={onOpenRelationships}
            onOpenLearnSystem={onOpenLearnSystem}
            onOpenFlashcards={onOpenFlashcards}
            onOpenPracticalLab={onOpenPracticalLab}
          />
        </div>
      )}

      {/* Results List */}
      <div className="a360-search-results-list" style={{ marginTop: '16px' }}>
        {discovery.results.length === 0 ? (
          <div className="a360-empty-box">
            <p>
              No anatomical structures match &ldquo;{query}&rdquo; under the current filters. Try a
              common term (e.g., collarbone, shinbone), Latin name (e.g., cor, hepar), or clear your system filter.
            </p>
          </div>
        ) : (
          discovery.results.map((hit) => {
            const relatedNames = hit.relatedConceptIds.length
              ? resolveRelatedNames(hit.relatedConceptIds.slice(0, 3), atlas)
              : [];
            const saved = hit.conceptId ? isBookmarked('structure', hit.conceptId) : false;

            return (
              <article key={hit.key} className="a360-search-rich-row">
                <div className="a360-search-row-info">
                  <div className="a360-search-title-line">
                    <strong className="a360-capitalize">{hit.anatomicalName}</strong>
                    {hit.latinName && (
                      <span className="a360-muted">
                        · <em>{hit.latinName}</em>
                      </span>
                    )}
                    <span className="a360-muted">
                      · {hit.systemLabel} · {hit.region} · {hit.matchReason}
                    </span>
                  </div>
                  <p className="a360-card-detail">{hit.shortDefinition}</p>
                  <p className="a360-muted">
                    {hit.conceptId ?? hit.partId} · {getCoverageBadgeLabel(hit.coverageTier)}
                    {relatedNames.length > 0 && (
                      <> · Related: {relatedNames.map((r) => r.name).join(', ')}</>
                    )}
                  </p>
                </div>

                <div className="a360-card-actions">
                  {hit.inModel && (
                    <button
                      type="button"
                      className="a360-card-btn"
                      onClick={() => {
                        if (query.trim().length >= 2) addRecentSearch(query.trim());
                        if (hit.partId) onInspectPart(hit.partId);
                        else if (hit.conceptId) onInspectConcept(hit.conceptId);
                      }}
                    >
                      Inspect in 3D <ArrowRight size={14} />
                    </button>
                  )}
                  {hit.conceptId && (
                    <>
                      <button
                        type="button"
                        className="a360-btn-secondary"
                        onClick={() => setFocusedHit(hit)}
                      >
                        Reference Notes
                      </button>
                      <button
                        type="button"
                        className="a360-btn-secondary"
                        onClick={() => onOpenRelationships(hit.conceptId!)}
                      >
                        <GitBranch size={13} /> Relations
                      </button>
                      <button
                        type="button"
                        className={`a360-btn-secondary ${saved ? 'is-saved' : ''}`}
                        aria-label={`Bookmark ${hit.anatomicalName}`}
                        onClick={() =>
                          toggleBookmark({
                            kind: 'structure',
                            targetId: hit.conceptId!,
                            title: hit.anatomicalName,
                            subtitle: hit.systemLabel,
                            canonicalSystem: hit.canonicalSystem,
                          })
                        }
                      >
                        <Bookmark size={13} />
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Matching Lessons & Terminology */}
      {(discovery.relatedTopics.length > 0 || discovery.relatedTerms.length > 0) && (
        <section className="a360-dashboard-grid" style={{ marginTop: '24px' }}>
          {discovery.relatedTopics.length > 0 && (
            <div className="a360-chart-panel">
              <h2>Related Learning Lesson Topics</h2>
              <div className="a360-dash-list">
                {discovery.relatedTopics.map((tp) => (
                  <div key={tp.id} className="a360-dash-row">
                    <div>
                      <strong>{tp.title}</strong>
                      <span>System lesson topic</span>
                    </div>
                    <button
                      type="button"
                      className="a360-card-btn"
                      onClick={() => onOpenLearnSystem(tp.systemId, tp.id)}
                    >
                      <BookOpen size={13} /> Open Lesson
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {discovery.relatedTerms.length > 0 && (
            <div className="a360-chart-panel">
              <h2>Related Anatomical Terminology</h2>
              <div className="a360-dash-list">
                {discovery.relatedTerms.map((tm) => (
                  <div key={tm.term} className="a360-dash-row">
                    <div>
                      <strong>{tm.term}</strong>
                      <span>{tm.definition}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
