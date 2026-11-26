import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  Compass,
  GitBranch,
  GraduationCap,
  Play,
  Search,
} from 'lucide-react';
import type { Atlas } from '../anatomy';
import type { CanonicalSystemId } from '../anatomy-systems';
import type { AppRoute } from '../components/SiteHeader';
import StructureReferenceCard from '../components/StructureReferenceCard';
import { useStudy } from '../components/StudyContext';
import {
  getActiveConceptsForSex,
  getActivePartsForSex,
  loadFemaleAtlasManifest,
  loadMaleEnhancementsManifest,
  loadSharedEnhancementsManifest,
  type FemaleAtlasManifest,
  type OverlayManifest,
} from '../atlas-layers';
import { EDUCATION_TRACKS } from '../education/education-curricula';
import type {
  CurriculumAuthorityId,
  EducationDomainId,
  EducationTrackId,
} from '../education/education-types';
import { getStructureRecordV2 } from '../knowledge-graph';
import { REGISTRY_SUBJECTS } from '../registry/knowledge-registry';
import {
  searchUnifiedEducationCatalog,
  UNIFIED_SEARCH_SUGGESTIONS,
  type UnifiedSearchCategory,
  type UnifiedSearchResultItem,
} from '../search-engine';
import type { StudyContextInput } from '../study-context-engine';

interface Props {
  atlas: Atlas | null;
  initialQuery?: string | null;
  onInspectConcept: (conceptId: string) => void;
  onInspectPart: (partId: string) => void;
  onOpenRelationships: (conceptId: string) => void;
  onOpenLearnSystem: (systemId: CanonicalSystemId, topicId?: string) => void;
  onOpenFlashcards: (systemId: CanonicalSystemId) => void;
  onOpenPracticalLab: () => void;
  onOpenTopic?: (params: {
    route: AppRoute;
    domainId?: EducationDomainId;
    topicId?: string;
    systemId?: CanonicalSystemId;
    conceptId?: string;
    presentationId?: string;
    frameworkId?: CurriculumAuthorityId;
  }) => void;
  onOpenSyllabus?: (frameworkId?: CurriculumAuthorityId) => void;
  onOpenEducator?: (domainId?: EducationDomainId) => void;
  onOpenPresentation?: (presentationId: string) => void;
  onOpenStudyContext?: (input: StudyContextInput) => void;
}

const UNIFIED_CATEGORY_TABS: { id: UnifiedSearchCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'subject', label: 'Subjects' },
  { id: 'topic', label: 'Topics' },
  { id: 'structure', label: '3D Structures' },
  { id: 'relationship', label: 'Relationships' },
  { id: 'terminology', label: 'Terminology' },
  { id: 'physiology', label: 'Physiology' },
  { id: 'histology', label: 'Histology' },
  { id: 'clinical', label: 'Clinical' },
  { id: 'presentation', label: '3D Walkthroughs' },
  { id: 'quiz', label: 'Quizzes' },
  { id: 'resource', label: 'External Readings' },
  { id: 'video', label: 'Videos' },
  { id: 'curriculum', label: 'Syllabi' },
  { id: 'educator', label: 'Educator' },
];

export default function SearchPage({
  atlas,
  initialQuery,
  onInspectConcept,
  onInspectPart,
  onOpenRelationships,
  onOpenLearnSystem,
  onOpenFlashcards,
  onOpenPracticalLab,
  onOpenTopic,
  onOpenSyllabus,
  onOpenEducator,
  onOpenPresentation,
  onOpenStudyContext,
}: Props) {
  const [query, setQuery] = useState(initialQuery ?? '');
  const [categoryFilter, setCategoryFilter] = useState<UnifiedSearchCategory>('all');
  const [domainFilter, setDomainFilter] = useState<EducationDomainId | 'all'>('all');
  const [trackFilter, setTrackFilter] = useState<EducationTrackId | 'all'>('all');
  const [modelOnly, setModelOnly] = useState(false);
  const [focusedHit, setFocusedHit] = useState<UnifiedSearchResultItem | null>(null);

  const { state, addRecentSearch, isBookmarked, toggleBookmark } = useStudy();
  const [sharedOverlay, setSharedOverlay] = useState<OverlayManifest | null>(null);
  const [maleOverlay, setMaleOverlay] = useState<OverlayManifest | null>(null);
  const [femaleAtlas, setFemaleAtlas] = useState<FemaleAtlasManifest | null>(null);

  useEffect(() => {
    if (!sharedOverlay) {
      void loadSharedEnhancementsManifest()
        .then(setSharedOverlay)
        .catch(() => {});
    }
    if (state.preferredSex === 'male' && !maleOverlay) {
      void loadMaleEnhancementsManifest()
        .then(setMaleOverlay)
        .catch(() => {});
    }
    if (state.preferredSex === 'female' && !femaleAtlas) {
      void loadFemaleAtlasManifest()
        .then(setFemaleAtlas)
        .catch(() => {
          // Graceful fallback to base atlas
        });
    }
  }, [state.preferredSex, sharedOverlay, maleOverlay, femaleAtlas]);

  const effectiveAtlas = useMemo<Atlas | null>(() => {
    if (!atlas) return null;
    if (state.preferredSex === 'female' && !femaleAtlas) return atlas;
    return {
      ...atlas,
      sex: state.preferredSex,
      parts: getActivePartsForSex(atlas, femaleAtlas, state.preferredSex, {
        shared: sharedOverlay,
        male: maleOverlay,
      }),
      concepts: getActiveConceptsForSex(atlas, femaleAtlas, state.preferredSex, {
        shared: sharedOverlay,
        male: maleOverlay,
      }),
    };
  }, [atlas, sharedOverlay, maleOverlay, femaleAtlas, state.preferredSex]);

  useEffect(() => {
    if (typeof initialQuery === 'string' && initialQuery !== query) {
      setQuery(initialQuery);
      setFocusedHit(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const discovery = useMemo(
    () =>
      searchUnifiedEducationCatalog(query, effectiveAtlas, {
        category: categoryFilter,
        domainId: domainFilter,
        trackId: trackFilter,
        modelOnly,
        limit: 80,
      }),
    [query, effectiveAtlas, categoryFilter, domainFilter, trackFilter, modelOnly],
  );

  const focusedRecordV2 = useMemo(() => {
    if (!focusedHit?.conceptId) return null;
    return getStructureRecordV2(focusedHit.conceptId, effectiveAtlas, focusedHit.title);
  }, [focusedHit, effectiveAtlas]);

  const applyQuery = (q: string) => {
    setQuery(q);
    setFocusedHit(null);
    if (q.trim().length >= 2) addRecentSearch(q.trim());
  };

  const totalAcrossCategories = useMemo(
    () => Object.values(discovery.categoryCounts).reduce((a, b) => a + b, 0),
    [discovery.categoryCounts],
  );

  const buildStudyInputForHit = (hit: UnifiedSearchResultItem): StudyContextInput => ({
    ...(hit.studyInput ?? {
      conceptId: hit.conceptId,
      partId: hit.partId,
      topicId: hit.topicId,
      domainId: hit.domainId,
      systemId: hit.systemId,
      relationshipId: hit.relationshipId,
      resourceId: hit.resourceId,
      videoId: hit.videoId,
      presentationId: hit.presentationId,
    }),
    sex: state.preferredSex,
    sourceModule: 'search',
  });

  const handlePrimaryOpen = (hit: UnifiedSearchResultItem) => {
    if (query.trim().length >= 2) addRecentSearch(query.trim());

    if (hit.category === 'resource' || hit.category === 'video' || hit.route === 'study') {
      if (onOpenStudyContext) {
        onOpenStudyContext(buildStudyInputForHit(hit));
        return;
      }
    }

    if (hit.category === 'relationship') {
      if (onOpenStudyContext) {
        onOpenStudyContext(buildStudyInputForHit(hit));
        return;
      }
      if (hit.conceptId) {
        onOpenRelationships(hit.conceptId);
        return;
      }
    }

    if (hit.category === 'structure') {
      if (hit.inModel) {
        if (hit.partId) onInspectPart(hit.partId);
        else if (hit.conceptId) onInspectConcept(hit.conceptId);
      } else if (hit.conceptId) {
        setFocusedHit(hit);
      }
      return;
    }

    if (hit.category === 'presentation' && hit.presentationId) {
      if (onOpenPresentation) onOpenPresentation(hit.presentationId);
      else onOpenTopic?.({ route: 'present', presentationId: hit.presentationId });
      return;
    }

    if (hit.category === 'curriculum') {
      if (onOpenSyllabus) onOpenSyllabus(hit.frameworkId);
      else onOpenTopic?.({ route: 'syllabus', frameworkId: hit.frameworkId });
      return;
    }

    if (hit.category === 'educator') {
      if (onOpenEducator) onOpenEducator(hit.domainId ?? 'human_anatomy');
      else onOpenTopic?.({ route: 'educator', domainId: hit.domainId ?? 'human_anatomy' });
      return;
    }

    if (onOpenTopic) {
      onOpenTopic({
        route: hit.route,
        domainId: hit.domainId,
        topicId: hit.topicId,
        systemId: hit.systemId,
        conceptId: hit.conceptId,
        presentationId: hit.presentationId,
        frameworkId: hit.frameworkId,
      });
      return;
    }

    if (hit.systemId) {
      onOpenLearnSystem(hit.systemId, hit.topicId);
    } else if (hit.conceptId) {
      onInspectConcept(hit.conceptId);
    }
  };

  return (
    <div className="a360-page">
      <header className="a360-page-header">
        <p className="a360-kicker">Universal Knowledge Search</p>
        <h1>Search Across All Subjects, Topics, 3D Anatomy &amp; Syllabi</h1>
        <p className="a360-lead">
          One unified discovery index across all 16 biomedical domains, chapters, learning
          outcomes, 3,432+ FMA concepts, 2,401 multi-layer 3D meshes (2,301 Male · 2,328 Female + 8
          optional), physiology labs, histology entries, clinical cases, guided 3D walkthroughs,
          MCQs, and 13 worldwide curricula.
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
          placeholder="Search pharmacology, heart, ADME, ABG, FMA7088, renal, cell biology, PMDC, CBSE…"
          aria-label="Search universal knowledge catalog"
        />
      </div>

      {/* Category Scope Buttons */}
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Search result categories">
        {UNIFIED_CATEGORY_TABS.map((tab) => {
          const count =
            tab.id === 'all' ? totalAcrossCategories : discovery.categoryCounts[tab.id];
          const active = categoryFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setCategoryFilter(tab.id)}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? 'border-teal-800 bg-teal-800 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`font-mono text-[11px] tabular-nums ${
                  active ? 'text-teal-100' : 'text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Domain, Track & 3D Filters */}
      <div className="a360-quiz-filters">
        <label className="a360-select-field">
          <span>Subject / Domain</span>
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value as EducationDomainId | 'all')}
          >
            <option value="all">All 16 Domains</option>
            {REGISTRY_SUBJECTS.map((subj) => (
              <option key={subj.domainId} value={subj.domainId}>
                {subj.code} · {subj.shortTitle}
              </option>
            ))}
          </select>
        </label>

        <label className="a360-select-field">
          <span>Academic Level</span>
          <select
            value={trackFilter}
            onChange={(e) => setTrackFilter(e.target.value as EducationTrackId | 'all')}
          >
            <option value="all">All Academic Tracks</option>
            {EDUCATION_TRACKS.map((tr) => (
              <option key={tr.id} value={tr.id}>
                {tr.shortLabel}
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
          {(categoryFilter !== 'all' ||
            domainFilter !== 'all' ||
            trackFilter !== 'all' ||
            modelOnly ||
            query.trim().length > 0) && (
            <button
              type="button"
              className="a360-filter-btn"
              onClick={() => {
                setQuery('');
                setCategoryFilter('all');
                setDomainFilter('all');
                setTrackFilter('all');
                setModelOnly(false);
                setFocusedHit(null);
              }}
            >
              Reset Filters
            </button>
          )}
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
          {UNIFIED_SEARCH_SUGGESTIONS.map((sg) => (
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
        <div className="mt-2">
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

      {/* Results Count Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 text-xs text-slate-600">
        <span className="font-mono tabular-nums">
          Showing {discovery.results.length} of {discovery.totalBeforeLimit} matching catalog entries
        </span>
        {onOpenSyllabus && (
          <button
            type="button"
            onClick={() => onOpenSyllabus()}
            className="font-semibold text-teal-800 hover:underline"
          >
            Looking for a specific country or university syllabus? Open Worldwide Syllabus Navigator →
          </button>
        )}
      </div>

      {/* Unified Results List */}
      <div className="a360-search-results-list">
        {discovery.results.length === 0 ? (
          <div className="a360-empty-box">
            <p>
              No matching records found for &ldquo;{query}&rdquo; under the selected filters. Try a
              domain name (e.g., Pharmacology, Pathology, Embryology), anatomical synonym
              (collarbone, cor, windpipe), shorthand (ADME, ABG, PK), or reset filters.
            </p>
          </div>
        ) : (
          discovery.results.map((hit) => {
            const saved = hit.conceptId ? isBookmarked('structure', hit.conceptId) : false;

            return (
              <article key={hit.key} className="a360-search-rich-row">
                <div className="a360-search-row-info">
                  <div className="a360-search-title-line">
                    <strong>{hit.title}</strong>
                    <span className="a360-muted">
                      · {hit.categoryLabel} · {hit.subtitle} · {hit.matchReason}
                    </span>
                  </div>
                  <p className="a360-card-detail">{hit.summary}</p>
                  <p className="a360-muted font-mono text-xs tabular-nums">
                    {hit.coverageStatusLabel} · {hit.metadataLine}
                  </p>
                </div>

                <div className="a360-card-actions flex-wrap">
                  {hit.category === 'structure' ? (
                    <>
                      {onOpenStudyContext && (
                        <button
                          type="button"
                          className="a360-card-btn"
                          onClick={() => onOpenStudyContext(buildStudyInputForHit(hit))}
                        >
                          Study Workspace <ArrowRight size={14} />
                        </button>
                      )}
                      {hit.inModel && (
                        <button
                          type="button"
                          className="a360-btn-secondary"
                          onClick={() => handlePrimaryOpen(hit)}
                        >
                          Inspect in 3D
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
                            aria-label={`Bookmark ${hit.title}`}
                            onClick={() =>
                              toggleBookmark({
                                kind: 'structure',
                                targetId: hit.conceptId!,
                                title: hit.title,
                                subtitle: hit.subtitle,
                                canonicalSystem: hit.systemId ?? 'cardiovascular',
                              })
                            }
                          >
                            <Bookmark size={13} />
                          </button>
                        </>
                      )}
                    </>
                  ) : hit.category === 'presentation' ? (
                    <>
                      <button
                        type="button"
                        className="a360-card-btn"
                        onClick={() => handlePrimaryOpen(hit)}
                      >
                        <Play size={13} /> Open 3D Walkthrough
                      </button>
                      {onOpenStudyContext && (
                        <button
                          type="button"
                          className="a360-btn-secondary"
                          onClick={() => onOpenStudyContext(buildStudyInputForHit(hit))}
                        >
                          Study Workspace
                        </button>
                      )}
                    </>
                  ) : hit.category === 'curriculum' ? (
                    <button
                      type="button"
                      className="a360-card-btn"
                      onClick={() => handlePrimaryOpen(hit)}
                    >
                      <Compass size={13} /> Open in Syllabus Navigator
                    </button>
                  ) : hit.category === 'educator' ? (
                    <button
                      type="button"
                      className="a360-card-btn"
                      onClick={() => handlePrimaryOpen(hit)}
                    >
                      <GraduationCap size={13} /> Open Educator Workspace
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="a360-card-btn"
                        onClick={() => handlePrimaryOpen(hit)}
                      >
                        <BookOpen size={13} />{' '}
                        {hit.category === 'subject'
                          ? 'Browse Subject'
                          : hit.category === 'physiology'
                            ? 'Open Lab'
                            : hit.category === 'quiz'
                              ? 'Practice Question'
                              : hit.category === 'video'
                                ? 'Watch in Study Workspace'
                                : hit.category === 'resource'
                                  ? 'Open Reading in Study Workspace'
                                  : hit.category === 'relationship'
                                    ? 'Study Relationship in 3D'
                                    : 'Open Module'}
                      </button>
                      {onOpenStudyContext &&
                        hit.category !== 'video' &&
                        hit.category !== 'resource' &&
                        hit.category !== 'relationship' && (
                          <button
                            type="button"
                            className="a360-btn-secondary"
                            onClick={() => onOpenStudyContext(buildStudyInputForHit(hit))}
                          >
                            Study Workspace
                          </button>
                        )}
                      {hit.externalUrl && (
                        <a
                          href={hit.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="a360-btn-secondary"
                        >
                          Open External Source
                        </a>
                      )}
                      {hit.domainId && onOpenEducator && hit.category === 'subject' && (
                        <button
                          type="button"
                          className="a360-btn-secondary"
                          onClick={() => onOpenEducator(hit.domainId)}
                        >
                          <GraduationCap size={13} /> Plan Outline
                        </button>
                      )}
                      {hit.conceptId && (
                        <button
                          type="button"
                          className="a360-btn-secondary"
                          onClick={() => onInspectConcept(hit.conceptId!)}
                        >
                          Inspect in 3D <ArrowRight size={13} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
