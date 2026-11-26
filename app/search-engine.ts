import type { Atlas, Part } from './anatomy';
import {
  CANONICAL_SYSTEMS,
  canonicalSystemForMeshSystem,
  type CanonicalSystemId,
} from './anatomy-systems';
import type { AppRoute } from './components/SiteHeader';
import { CLINICAL_CASES } from './data/clinical-data';
import { HISTOLOGY_ENTRIES } from './data/histology-data';
import { PHYSIOLOGY_MODULES } from './data/physiology-data';
import { getAllKnownExternalResources } from './data/study-resources';
import { VERIFIED_YOUTUBE_VIDEOS } from './data/video-resources';
import { EDUCATION_TOPICS } from './education/education-content';
import { CURRICULUM_FRAMEWORKS } from './education/education-curricula';
import type { CurriculumAuthorityId, EducationDomainId, EducationTrackId } from './education/education-types';
import {
  KNOWLEDGE_GRAPH_V2,
  VERIFIED_RELATIONSHIPS,
  type ModelCoverageTier,
  type StructureCategory,
  type StructureKnowledgeV2,
} from './knowledge-graph';
import { ANATOMY_LESSONS, TERMINOLOGY_ENTRIES } from './learning-data';
import { SYSTEM_TEACHING_METADATA } from './learning-supplements';
import { BUILTIN_PRESENTATIONS } from './presentation/builtin-presentations';
import { QUIZ_QUESTIONS } from './quiz-data';
import {
  REGISTRY_COVERAGE_LABELS,
  REGISTRY_SUBJECTS,
  REGISTRY_TOPICS,
} from './registry/knowledge-registry';
import type { StudyContextInput } from './study-context-engine';

export interface SearchFilterOptions {
  system?: CanonicalSystemId | 'all';
  category?: StructureCategory | 'all';
  modelOnly?: boolean;
  limit?: number;
}

export interface SearchResultItem {
  key: string;
  score: number;
  matchReason: string;
  conceptId?: string;
  partId?: string;
  anatomicalName: string;
  commonName: string;
  latinName?: string;
  canonicalSystem: CanonicalSystemId;
  systemLabel: string;
  category: StructureCategory;
  region: string;
  shortDefinition: string;
  coverageTier: ModelCoverageTier;
  inModel: boolean;
  piecesCount: number;
  synonyms: string[];
  relatedConceptIds: string[];
  associatedTopicIds: string[];
  terminology: { term: string; meaning: string }[];
  recordV2?: StructureKnowledgeV2;
}

export const SEARCH_SUGGESTIONS: string[] = [
  'Heart',
  'Diaphragm',
  'Windpipe',
  'Biceps brachii',
  'Renal artery',
  'Femur',
  'Pituitary gland',
  'Optic nerve',
  'Cornea',
  'Collarbone',
];

/**
 * Bounded Damerau-Levenshtein distance for typo tolerance (transpositions, insertions, deletions, substitutions).
 * Returns distance <= maxDist or maxDist + 1 early-exit.
 */
export function damerauDistance(a: string, b: string, maxDist = 2): number {
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > maxDist) return maxDist + 1;
  if (a === b) return 0;

  const d: number[][] = Array.from({ length: la + 1 }, () => Array<number>(lb + 1).fill(0));
  for (let i = 0; i <= la; i++) d[i][0] = i;
  for (let j = 0; j <= lb; j++) d[0][j] = j;

  for (let i = 1; i <= la; i++) {
    let rowMin = maxDist + 1;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let val = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        val = Math.min(val, d[i - 2][j - 2] + cost);
      }
      d[i][j] = val;
      if (val < rowMin) rowMin = val;
    }
    if (rowMin > maxDist) return maxDist + 1;
  }
  return d[la][lb];
}

function fuzzyWordMatch(queryWord: string, targetText: string): boolean {
  if (queryWord.length < 4) return false;
  const maxDist = queryWord.length >= 7 ? 2 : 1;
  const tokens = targetText.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  for (const tok of tokens) {
    if (tok.length < 3) continue;
    if (Math.abs(tok.length - queryWord.length) <= maxDist) {
      if (damerauDistance(queryWord, tok, maxDist) <= maxDist) return true;
    }
  }
  return false;
}

const SYSTEM_MAP = new Map(CANONICAL_SYSTEMS.map((s) => [s.id, s]));
const CURATED_V2_BY_ID = new Map(KNOWLEDGE_GRAPH_V2.map((r) => [r.conceptId, r]));

// Index terminology entries by canonical system for enriching fallback concepts
const TERMS_BY_NAME = new Map(TERMINOLOGY_ENTRIES.map((t) => [t.term.toLowerCase(), t]));

export function searchAnatomyCatalog(
  rawQuery: string,
  atlas: Atlas | null,
  filters: SearchFilterOptions = {},
): {
  results: SearchResultItem[];
  relatedTerms: typeof TERMINOLOGY_ENTRIES;
  relatedTopics: { id: string; title: string; systemId: CanonicalSystemId; conceptIds: string[] }[];
} {
  const term = rawQuery.trim().toLowerCase();
  const limit = filters.limit ?? 75;
  const sysFilter = filters.system ?? 'all';
  const catFilter = filters.category ?? 'all';
  const modelOnly = Boolean(filters.modelOnly);

  const conceptMap = atlas ? new Map(atlas.concepts.map((c) => [c.id, c])) : null;
  const partMap: Map<string, Part> | null = atlas ? new Map(atlas.parts.map((p) => [p.id, p])) : null;

  const results: SearchResultItem[] = [];
  const seenConcepts = new Set<string>();

  // 1. Curated Knowledge Graph v2 records (richest educational index)
  for (const rec of KNOWLEDGE_GRAPH_V2) {
    if (sysFilter !== 'all' && rec.canonicalSystem !== sysFilter) continue;
    if (catFilter !== 'all' && rec.category !== catFilter) continue;

    const concept = conceptMap?.get(rec.conceptId);
    const inModel = rec.visualization.inModel && (conceptMap ? Boolean(concept) : true);
    if (modelOnly && !inModel) continue;

    const sysInfo = SYSTEM_MAP.get(rec.canonicalSystem);
    const piecesCount = concept?.elements.length ?? rec.visualization.meshIds.length;
    const coverageTier: ModelCoverageTier = !inModel
      ? 'planned_unavailable'
      : piecesCount > 1
        ? 'mesh_group'
        : 'individual_mesh';

    let score = 0;
    let matchReason = 'Featured curriculum';

    if (!term) {
      score = rec.visualization.inModel ? 50 : 20;
    } else {
      const nameL = rec.canonicalName.toLowerCase();
      const commonL = rec.commonName.toLowerCase();
      const latinL = (rec.latinName ?? '').toLowerCase();
      const idL = rec.conceptId.toLowerCase();
      const regionL = `${rec.location.region} ${rec.location.subdivision ?? ''}`.toLowerCase();
      const defL = `${rec.function.primary} ${rec.location.position}`.toLowerCase();
      const sysL = (sysInfo?.name.en ?? '').toLowerCase();

      if (nameL === term || commonL === term || idL === term) {
        score = 120;
        matchReason = 'Exact canonical match';
      } else if (nameL.startsWith(term) || commonL.startsWith(term)) {
        score = 100;
        matchReason = 'Starts with query';
      } else if (rec.synonyms.some((s) => s.toLowerCase() === term)) {
        score = 98;
        matchReason = 'Exact synonym match';
      } else if (latinL && latinL.includes(term)) {
        score = 92;
        matchReason = `Latin term (${rec.latinName})`;
      } else if (nameL.includes(term) || commonL.includes(term)) {
        score = 86;
        matchReason = 'Name match';
      } else if (rec.synonyms.some((s) => s.toLowerCase().includes(term))) {
        score = 82;
        matchReason = 'Synonym match';
      } else if (regionL.includes(term)) {
        score = 70;
        matchReason = `Region (${rec.location.region})`;
      } else if (sysL.includes(term) || rec.category.includes(term)) {
        score = 62;
        matchReason = 'System / category match';
      } else if (defL.includes(term)) {
        score = 54;
        matchReason = 'Definition match';
      } else if (
        fuzzyWordMatch(term, `${rec.canonicalName} ${rec.commonName} ${rec.latinName ?? ''} ${rec.synonyms.join(' ')}`)
      ) {
        score = 45;
        matchReason = 'Fuzzy typo match';
      }
    }

    if (score > 0) {
      seenConcepts.add(rec.conceptId);
      results.push({
        key: `v2-${rec.conceptId}`,
        score,
        matchReason,
        conceptId: rec.conceptId,
        anatomicalName: rec.canonicalName,
        commonName: rec.commonName,
        latinName: rec.latinName,
        canonicalSystem: rec.canonicalSystem,
        systemLabel: sysInfo?.name.en ?? 'Anatomy',
        category: rec.category,
        region: rec.location.region,
        shortDefinition: rec.function.primary,
        coverageTier,
        inModel,
        piecesCount,
        synonyms: rec.synonyms,
        relatedConceptIds: rec.relatedConceptIds,
        associatedTopicIds: rec.education.associatedTopicIds,
        terminology: rec.education.terminology,
        recordV2: rec,
      });
    }
  }

  // 2. Expand into all 3,432 atlas concepts when query is non-empty or a specific system filter is selected
  if (atlas && partMap && (term.length > 0 || sysFilter !== 'all')) {
    for (const c of atlas.concepts) {
      if (seenConcepts.has(c.id)) continue;
      const firstPart = partMap.get(c.elements[0]);
      if (!firstPart) continue;
      const canonical = canonicalSystemForMeshSystem(firstPart.system);
      if (sysFilter !== 'all' && canonical.id !== sysFilter) continue;

      const cat: StructureCategory =
        firstPart.system === 'skeletal'
          ? 'bone'
          : firstPart.system === 'muscular'
            ? 'muscle'
            : firstPart.system === 'arterial'
              ? 'artery'
              : firstPart.system === 'venous'
                ? 'vein'
                : firstPart.system === 'nervous'
                  ? 'nerve'
                  : firstPart.system === 'lymphatic'
                    ? 'lymphatic'
                    : firstPart.system === 'endocrine'
                      ? 'gland'
                      : firstPart.system === 'sensory'
                        ? 'sensory'
                        : firstPart.system === 'connective'
                          ? 'connective'
                          : 'organ';
      if (catFilter !== 'all' && cat !== catFilter) continue;

      const nameL = c.name.toLowerCase();
      let score = 0;
      let matchReason = 'Atlas FMA concept';

      if (!term) {
        score = 15;
      } else if (nameL === term || c.id.toLowerCase() === term) {
        score = 95;
        matchReason = 'Exact FMA concept';
      } else if (nameL.startsWith(term)) {
        score = 78;
        matchReason = 'FMA prefix match';
      } else if (nameL.includes(term) || c.id.toLowerCase().includes(term)) {
        score = 60;
        matchReason = 'Atlas FMA match';
      } else if (fuzzyWordMatch(term, c.name)) {
        score = 32;
        matchReason = 'Fuzzy FMA match';
      }

      if (score > 0) {
        seenConcepts.add(c.id);
        results.push({
          key: `concept-${c.id}`,
          score,
          matchReason,
          conceptId: c.id,
          anatomicalName: c.name,
          commonName: c.name,
          canonicalSystem: canonical.id,
          systemLabel: canonical.name.en,
          category: cat,
          region: canonical.name.en,
          shortDefinition: canonical.shortSummary.en,
          coverageTier: c.elements.length > 1 ? 'mesh_group' : 'individual_mesh',
          inModel: true,
          piecesCount: c.elements.length,
          synonyms: [],
          relatedConceptIds: canonical.featuredConceptIds.filter((id) => id !== c.id).slice(0, 3),
          associatedTopicIds: [],
          terminology: [],
        });
      }
    }

    // 3. Individual mesh parts if query matches distinct sub-piece
    if (term.length >= 2) {
      let partHits = 0;
      for (const p of atlas.parts) {
        if (partHits >= 20) break;
        if (seenConcepts.has(p.conceptId)) continue;
        if (!p.name.toLowerCase().includes(term)) continue;
        const canonical = canonicalSystemForMeshSystem(p.system);
        if (sysFilter !== 'all' && canonical.id !== sysFilter) continue;
        partHits++;
        results.push({
          key: `part-${p.id}`,
          score: 40,
          matchReason: '3D mesh piece',
          conceptId: p.conceptId,
          partId: p.id,
          anatomicalName: p.name,
          commonName: p.name,
          canonicalSystem: canonical.id,
          systemLabel: canonical.name.en,
          category: 'organ',
          region: canonical.name.en,
          shortDefinition: canonical.shortSummary.en,
          coverageTier: 'individual_mesh',
          inModel: true,
          piecesCount: 1,
          synonyms: [],
          relatedConceptIds: [],
          associatedTopicIds: [],
          terminology: [],
        });
      }
    }
  }

  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.anatomicalName.length - b.anatomicalName.length;
  });

  // Match related terminology & lesson topics from canonical data
  const relatedTerms = term
    ? TERMINOLOGY_ENTRIES.filter(
        (t) =>
          t.term.toLowerCase().includes(term) ||
          t.definition.toLowerCase().includes(term) ||
          t.example.toLowerCase().includes(term),
      ).slice(0, 6)
    : Array.from(TERMS_BY_NAME.values()).slice(0, 4);

  const relatedTopics: {
    id: string;
    title: string;
    systemId: CanonicalSystemId;
    conceptIds: string[];
  }[] = [];

  if (term) {
    for (const lesson of ANATOMY_LESSONS) {
      if (sysFilter !== 'all' && lesson.systemId !== sysFilter) continue;
      for (const topic of lesson.topics) {
        const hay = `${topic.title.en} ${topic.explanation.en} ${topic.keyFacts.join(' ')}`.toLowerCase();
        if (hay.includes(term)) {
          relatedTopics.push({
            id: topic.id,
            title: topic.title.en,
            systemId: lesson.systemId,
            conceptIds: topic.conceptIds,
          });
        }
      }
    }
  }

  return {
    results: results.slice(0, limit),
    relatedTerms,
    relatedTopics: relatedTopics.slice(0, 6),
  };
}

export function resolveRelatedNames(conceptIds: string[], atlas: Atlas | null): { id: string; name: string }[] {
  const cMap = atlas ? new Map(atlas.concepts.map((c) => [c.id, c])) : null;
  return conceptIds
    .map((id) => {
      const v2 = CURATED_V2_BY_ID.get(id);
      if (v2) return { id, name: v2.canonicalName };
      const c = cMap?.get(id);
      if (c) return { id, name: c.name };
      return null;
    })
    .filter((x): x is { id: string; name: string } => Boolean(x));
}

// ---------------------------------------------------------------------------
// Unified Multi-Domain Educational Search (Universal Knowledge Registry)
// ---------------------------------------------------------------------------

export type UnifiedSearchCategory =
  | 'all'
  | 'subject'
  | 'topic'
  | 'structure'
  | 'relationship'
  | 'terminology'
  | 'physiology'
  | 'histology'
  | 'clinical'
  | 'presentation'
  | 'quiz'
  | 'resource'
  | 'video'
  | 'curriculum'
  | 'educator';

export interface UnifiedSearchFilters {
  category?: UnifiedSearchCategory;
  domainId?: EducationDomainId | 'all';
  trackId?: EducationTrackId | 'all';
  modelOnly?: boolean;
  limit?: number;
}

export interface UnifiedSearchResultItem {
  key: string;
  category: Exclude<UnifiedSearchCategory, 'all'>;
  categoryLabel: string;
  score: number;
  matchReason: string;
  title: string;
  subtitle: string;
  summary: string;
  domainId?: EducationDomainId;
  domainLabel?: string;
  systemId?: CanonicalSystemId;
  topicId?: string;
  conceptId?: string;
  partId?: string;
  presentationId?: string;
  frameworkId?: CurriculumAuthorityId;
  relationshipId?: string;
  resourceId?: string;
  videoId?: string;
  externalUrl?: string;
  studyInput?: StudyContextInput;
  route: AppRoute;
  academicTracks: string[];
  coverageStatusLabel: string;
  inModel?: boolean;
  metadataLine: string;
  keywords: string[];
}

export const UNIFIED_SEARCH_SUGGESTIONS: string[] = [
  'Pharmacology',
  'Heart',
  'Cell Biology',
  'Pathology',
  'Acid-Base',
  'Microbiology',
  'Femur',
  'Immunology',
  'Embryology',
  'Renal filtration',
];

const SEARCH_SYNONYM_MAP: Record<string, string[]> = {
  pk: ['pharmacology', 'pharmacokinetics', 'adme'],
  pd: ['pharmacology', 'pharmacodynamics', 'receptor'],
  adme: ['pharmacology', 'pharmacokinetics', 'absorption', 'metabolism'],
  abg: ['acid-base', 'ph', 'oxygen', 'haemoglobin'],
  cvs: ['cardiovascular', 'heart', 'coronary'],
  cns: ['nervous', 'brain', 'neuroanatomy', 'spinal'],
  gi: ['digestive', 'gastrointestinal', 'liver', 'hepatic'],
  cor: ['heart', 'cardiac'],
  haem: ['haematology', 'blood', 'coagulation'],
  cbc: ['haematology', 'laboratory', 'blood'],
};

function expandSearchQueryTokens(rawLower: string): string[] {
  const base = rawLower
    .split(/[^a-z0-9]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2);
  const out = new Set<string>(base);
  for (const tok of base) {
    const extra = SEARCH_SYNONYM_MAP[tok];
    if (extra) {
      for (const e of extra) out.add(e);
    }
  }
  return Array.from(out);
}

function scoreTextMatch(
  term: string,
  tokens: string[],
  title: string,
  subtitle: string,
  body: string,
  defaultFeatureScore = 30,
): { score: number; reason: string } {
  if (!term) return { score: defaultFeatureScore, reason: 'Featured directory entry' };

  const titleL = title.toLowerCase();
  const subL = subtitle.toLowerCase();
  const bodyL = body.toLowerCase();

  if (titleL === term) return { score: 130, reason: 'Exact title match' };
  if (titleL.startsWith(term)) return { score: 112, reason: 'Starts with query' };
  if (titleL.includes(term)) return { score: 96, reason: 'Title match' };
  if (subL.includes(term)) return { score: 82, reason: 'Domain / subtitle match' };

  let tokScore = 0;
  let matchedWords = 0;
  for (const tok of tokens) {
    if (titleL.includes(tok)) {
      tokScore += 32;
      matchedWords++;
    } else if (subL.includes(tok)) {
      tokScore += 22;
      matchedWords++;
    } else if (bodyL.includes(tok)) {
      tokScore += 14;
      matchedWords++;
    }
  }
  if (tokScore > 0) {
    return {
      score: Math.min(92, tokScore),
      reason:
        bodyL.includes(term)
          ? 'Outcome / content match'
          : `${matchedWords} keyword match${matchedWords > 1 ? 'es' : ''}`,
    };
  }
  if (bodyL.includes(term)) return { score: 64, reason: 'Content / learning outcome match' };
  if (fuzzyWordMatch(term, `${titleL} ${subL}`)) return { score: 42, reason: 'Fuzzy spelling match' };
  return { score: 0, reason: '' };
}

export function searchUnifiedEducationCatalog(
  rawQuery: string,
  atlas: Atlas | null,
  filters: UnifiedSearchFilters = {},
): {
  results: UnifiedSearchResultItem[];
  totalBeforeLimit: number;
  categoryCounts: Record<Exclude<UnifiedSearchCategory, 'all'>, number>;
} {
  const term = rawQuery.trim().toLowerCase();
  const tokens = term ? expandSearchQueryTokens(term) : [];
  const catFilter = filters.category ?? 'all';
  const domFilter = filters.domainId ?? 'all';
  const trackFilter = filters.trackId ?? 'all';
  const modelOnly = Boolean(filters.modelOnly);
  const limit = filters.limit ?? 80;

  const subjectByDomain = new Map(REGISTRY_SUBJECTS.map((s) => [s.domainId, s]));
  const items: UnifiedSearchResultItem[] = [];
  const seenKeys = new Set<string>();

  const pushUnique = (entry: UnifiedSearchResultItem) => {
    if (seenKeys.has(entry.key)) return;
    if (domFilter !== 'all' && entry.domainId !== domFilter) return;
    if (trackFilter !== 'all' && !entry.academicTracks.includes(trackFilter)) return;
    if (modelOnly && entry.inModel === false) return;
    seenKeys.add(entry.key);
    items.push(entry);
  };

  // 1. 16 Biomedical & Clinical Domains (Subjects)
  for (const subj of REGISTRY_SUBJECTS) {
    const res = scoreTextMatch(
      term,
      tokens,
      subj.title,
      `${subj.shortTitle} Domain ${subj.code}`,
      `${subj.overview} ${subj.group.replace(/_/g, ' ')}`,
      58,
    );
    if (res.score > 0) {
      pushUnique({
        key: `subj-${subj.domainId}`,
        category: 'subject',
        categoryLabel: 'Subject Domain',
        score: res.score + 8,
        matchReason: res.reason,
        title: subj.title,
        subtitle: `Domain ${subj.code} · ${subj.topicCount} curriculum topics`,
        summary: subj.overview,
        domainId: subj.domainId,
        domainLabel: subj.shortTitle,
        systemId: subj.relatedSystems[0],
        route: 'learn',
        academicTracks: subj.targetTracks,
        coverageStatusLabel: subj.coverageLabel,
        metadataLine: `Domain ${subj.code} · ${subj.chapterIds.length} chapters · ${subj.topicCount} topics · ${subj.coverageLabel}`,
        keywords: [subj.shortTitle, subj.code],
      });
    }
  }

  // 2. Universal Registry Topics (Chapters, Lesson Topics, Biomedical Modules & Outcomes)
  for (const tp of REGISTRY_TOPICS) {
    const subj = subjectByDomain.get(tp.domainId);
    const res = scoreTextMatch(
      term,
      tokens,
      tp.title,
      `${subj?.shortTitle ?? tp.domainId} · ${tp.chapterTitle}`,
      `${tp.summary} ${tp.keyTerms.join(' ')} ${tp.learningOutcomes.map((o) => o.statement).join(' ')}`,
      46,
    );
    if (res.score > 0) {
      const covLabel = REGISTRY_COVERAGE_LABELS[tp.coverageStatus];
      pushUnique({
        key: `topic-${tp.id}`,
        category: 'topic',
        categoryLabel: tp.sourceKind === 'planned_module' ? 'Planned Module' : 'Curriculum Topic',
        score: res.score + (tp.sourceKind === 'anatomy_lesson_topic' ? 3 : 5),
        matchReason: res.reason,
        title: tp.title,
        subtitle: `${subj?.shortTitle ?? 'Subject'} · ${tp.chapterTitle}`,
        summary: tp.summary,
        domainId: tp.domainId,
        domainLabel: subj?.shortTitle,
        systemId: tp.systemId,
        topicId: tp.id,
        conceptId: tp.relatedConceptIds[0],
        route: tp.navigationTarget.route,
        academicTracks: tp.academicTracks,
        coverageStatusLabel: covLabel,
        inModel: tp.relatedConceptIds.length > 0 ? true : undefined,
        metadataLine: `${subj?.shortTitle ?? ''} · ${covLabel} · ${tp.learningOutcomes.length} outcomes · ${tp.difficultyTiers.slice(0, 3).join(' / ')}`,
        keywords: tp.keyTerms.slice(0, 5),
      });
    }
  }

  // 3. 3D Anatomical Structures (KG V2 + Atlas FMA Concepts via searchAnatomyCatalog — deduplicated)
  const anatSearch = searchAnatomyCatalog(rawQuery, atlas, {
    limit: term ? 45 : 12,
    modelOnly,
  });
  for (const sr of anatSearch.results) {
    if (sr.partId && !sr.conceptId) continue;
    const dedupeConcept = sr.conceptId ?? sr.key;
    pushUnique({
      key: `struct-${dedupeConcept}`,
      category: 'structure',
      categoryLabel: '3D Structure',
      score: sr.score,
      matchReason: sr.matchReason,
      title: sr.anatomicalName,
      subtitle: `${sr.systemLabel} · ${sr.region}${sr.latinName ? ` · ${sr.latinName}` : ''}`,
      summary: sr.shortDefinition,
      domainId: 'human_anatomy',
      domainLabel: 'Human Anatomy',
      systemId: sr.canonicalSystem,
      conceptId: sr.conceptId,
      partId: sr.partId,
      route: 'explorer',
      academicTracks: ['school_foundations', 'secondary_premed', 'medical_foundations', 'allied_health', 'graduate_research'],
      coverageStatusLabel: sr.inModel ? `3D Mesh (${sr.piecesCount} part${sr.piecesCount === 1 ? '' : 's'})` : 'Text reference only',
      inModel: sr.inModel,
      metadataLine: `Human Anatomy · ${sr.systemLabel} · ${sr.inModel ? `${sr.piecesCount} 3D mesh(es)` : 'Planned reference'}`,
      keywords: sr.synonyms.slice(0, 4),
    });
  }

  // 4. Anatomical Terminology Entries
  for (const t of TERMINOLOGY_ENTRIES) {
    const res = scoreTextMatch(
      term,
      tokens,
      t.term,
      'Anatomical Terminology & Planes',
      `${t.definition} ${t.example}`,
      25,
    );
    if (res.score > 0) {
      pushUnique({
        key: `term-${t.term.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        category: 'terminology',
        categoryLabel: 'Terminology',
        score: res.score,
        matchReason: res.reason,
        title: t.term,
        subtitle: `Standard Anatomical Nomenclature`,
        summary: `${t.definition} Example: ${t.example}`,
        domainId: 'human_anatomy',
        domainLabel: 'Human Anatomy',
        route: 'learn',
        academicTracks: ['school_foundations', 'secondary_premed', 'medical_foundations', 'allied_health'],
        coverageStatusLabel: 'Available reference',
        metadataLine: `Terminology · ${t.term}`,
        keywords: [t.term],
      });
    }
  }

  // 5. Physiology Simulations (5 interactive + 1 planned)
  for (const mod of PHYSIOLOGY_MODULES) {
    const res = scoreTextMatch(
      term,
      tokens,
      mod.title,
      `${mod.subtitle} · Physiology Lab`,
      `${mod.explanation} ${mod.formulaNote} ${mod.assumptions.join(' ')}`,
      38,
    );
    if (res.score > 0) {
      pushUnique({
        key: `phys-${mod.id}`,
        category: 'physiology',
        categoryLabel: mod.status === 'specification_ready' ? 'Planned Simulation' : 'Physiology Sim',
        score: res.score + 4,
        matchReason: res.reason,
        title: mod.title,
        subtitle: mod.subtitle,
        summary: mod.explanation,
        domainId: 'human_physiology',
        domainLabel: 'Physiology',
        systemId: mod.systemId,
        conceptId: mod.linkedConcepts[0]?.conceptId,
        route: 'physiology',
        academicTracks: ['secondary_premed', 'medical_foundations', 'clinical_applied', 'allied_health', 'graduate_research'],
        coverageStatusLabel: mod.status === 'specification_ready' ? 'Planned specification' : 'Interactive simulation',
        metadataLine: `Physiology · ${mod.status === 'specification_ready' ? 'Planned spec' : 'Interactive model'}`,
        keywords: [mod.formulaNote],
      });
    }
  }

  // 6. Histology Microanatomy Entries (honest asset_missing disclosure)
  for (const h of HISTOLOGY_ENTRIES) {
    const res = scoreTextMatch(
      term,
      tokens,
      h.title,
      `${h.category} histology · ${h.specimenSlot.stainProtocol}`,
      `${h.summary} ${h.microscopicStructures.join(' ')} ${h.diagnosticFeatures.join(' ')}`,
      28,
    );
    if (res.score > 0) {
      pushUnique({
        key: `hist-${h.id}`,
        category: 'histology',
        categoryLabel: 'Histology Guide',
        score: res.score,
        matchReason: res.reason,
        title: h.title,
        subtitle: `Microscopic Anatomy · ${h.specimenSlot.stainProtocol}`,
        summary: h.summary,
        domainId: 'histology',
        domainLabel: 'Histology',
        systemId: h.canonicalSystem,
        conceptId: h.linkedConceptIds[0],
        route: 'histology',
        academicTracks: ['secondary_premed', 'medical_foundations', 'allied_health', 'graduate_research'],
        coverageStatusLabel: 'Text & self-check · Asset required (microscopy image pending)',
        metadataLine: `Histology · ${h.specimenSlot.stainProtocol} · Asset required`,
        keywords: h.microscopicStructures.slice(0, 4),
      });
    }
  }

  // 7. Clinical Case Correlations
  for (const cs of CLINICAL_CASES) {
    const res = scoreTextMatch(
      term,
      tokens,
      cs.title,
      `${cs.categoryLabel} · ${cs.level}`,
      `${cs.educationalScenario} ${cs.anatomicalExplanation} ${cs.learningObjectives.join(' ')}`,
      34,
    );
    if (res.score > 0) {
      pushUnique({
        key: `clin-${cs.id}`,
        category: 'clinical',
        categoryLabel: 'Clinical Case',
        score: res.score + 2,
        matchReason: res.reason,
        title: cs.title,
        subtitle: `${cs.categoryLabel} · ${cs.level}`,
        summary: cs.educationalScenario,
        domainId: 'clinical_specialties',
        domainLabel: 'Clinical Specialties',
        systemId: cs.systemId,
        conceptId: cs.relevantConcepts[0]?.conceptId,
        route: 'clinical',
        academicTracks: ['medical_foundations', 'clinical_applied', 'allied_health'],
        coverageStatusLabel: 'Interactive case study',
        metadataLine: `Clinical Correlation · ${cs.level}`,
        keywords: cs.relevantConcepts.map((r) => r.label).slice(0, 4),
      });
    }
  }

  // 8. Built-in Guided 3D Presentations
  for (const pres of BUILTIN_PRESENTATIONS) {
    const res = scoreTextMatch(
      term,
      tokens,
      pres.title,
      `${pres.region} · ${pres.steps.length} guided 3D steps`,
      `${pres.summary} ${pres.learningObjectives.join(' ')} ${pres.mechanismProfile?.mechanism ?? ''}`,
      36,
    );
    if (res.score > 0) {
      pushUnique({
        key: `pres-${pres.id}`,
        category: 'presentation',
        categoryLabel: '3D Walkthrough',
        score: res.score + 4,
        matchReason: res.reason,
        title: pres.title,
        subtitle: `${pres.region} · ${pres.difficultyLevel}`,
        summary: pres.summary,
        domainId: pres.category === 'pathophysiology' ? 'pathology' : 'human_anatomy',
        domainLabel: pres.category === 'pathophysiology' ? 'Pathology' : 'Human Anatomy',
        presentationId: pres.id,
        route: 'present',
        academicTracks: ['medical_foundations', 'clinical_applied', 'allied_health'],
        coverageStatusLabel: `${pres.steps.length}-stage 3D explainer`,
        inModel: true,
        metadataLine: `3D Presentation · ${pres.steps.length} steps · ${pres.region}`,
        keywords: [pres.region, pres.category],
      });
    }
  }

  // 9. Quiz MCQs + Biomedical Module Self-Checks
  for (const q of QUIZ_QUESTIONS) {
    const res = scoreTextMatch(term, tokens, q.prompt, `${q.difficulty} · Anatomy Quiz`, q.explanation, 12);
    if (res.score > 0) {
      pushUnique({
        key: `quiz-anat-${q.id}`,
        category: 'quiz',
        categoryLabel: 'Assessment MCQ',
        score: res.score - 6,
        matchReason: res.reason,
        title: q.prompt,
        subtitle: `${q.difficulty} · Active Recall Quiz`,
        summary: q.explanation,
        domainId: 'human_anatomy',
        domainLabel: 'Human Anatomy',
        systemId: q.systemId,
        conceptId: q.relatedConceptId,
        route: 'quiz',
        academicTracks:
          q.difficulty === 'BS / MPhil / PhD Research'
            ? ['graduate_research']
            : q.difficulty === 'MBBS / Nursing'
              ? ['medical_foundations', 'allied_health']
              : ['school_foundations', 'secondary_premed'],
        coverageStatusLabel: '4-option MCQ with rationale',
        metadataLine: `Assessment · ${q.difficulty}`,
        keywords: [q.difficulty],
      });
    }
  }
  for (const et of EDUCATION_TOPICS) {
    const subj = subjectByDomain.get(et.domainId);
    for (const sc of et.selfChecks) {
      const res = scoreTextMatch(
        term,
        tokens,
        sc.question,
        `${subj?.shortTitle ?? et.domainId} Self-Check · ${et.title}`,
        sc.explanation,
        10,
      );
      if (res.score > 0) {
        pushUnique({
          key: `quiz-edu-${sc.id}`,
          category: 'quiz',
          categoryLabel: 'Module Self-Check',
          score: res.score - 4,
          matchReason: res.reason,
          title: sc.question,
          subtitle: `${subj?.shortTitle ?? ''} · ${et.title}`,
          summary: sc.explanation,
          domainId: et.domainId,
          domainLabel: subj?.shortTitle,
          topicId: et.id,
          route: 'learn',
          academicTracks: et.targetTracks,
          coverageStatusLabel: 'Self-check MCQ',
          metadataLine: `Self-Check · ${subj?.shortTitle ?? ''}`,
          keywords: [et.title],
        });
      }
    }
  }

  // 10. Official Curriculum Frameworks (13 worldwide/institutional frameworks)
  for (const fw of CURRICULUM_FRAMEWORKS) {
    const res = scoreTextMatch(
      term,
      tokens,
      fw.title,
      `${fw.country} · ${fw.authority}`,
      `${fw.supports} ${fw.adoptionNote} ${fw.applicableGradesOrYears}`,
      32,
    );
    if (res.score > 0) {
      pushUnique({
        key: `curr-${fw.id}`,
        category: 'curriculum',
        categoryLabel: 'Curriculum Framework',
        score: res.score + 4,
        matchReason: res.reason,
        title: fw.title,
        subtitle: `${fw.country} · ${fw.authority}`,
        summary: fw.supports,
        frameworkId: fw.id,
        route: 'syllabus',
        academicTracks: fw.tracks,
        coverageStatusLabel: `${fw.applicableGradesOrYears} · Alignment mapping`,
        metadataLine: `Syllabus · ${fw.country} · ${fw.academicYearOrVersion}`,
        keywords: [fw.country, fw.authority],
      });
    }
  }

  // 11. Teacher & Professor Guides (12 canonical system guides)
  for (const sys of CANONICAL_SYSTEMS) {
    const guide = SYSTEM_TEACHING_METADATA[sys.id];
    const res = scoreTextMatch(
      term,
      tokens,
      `${sys.name.en} Teaching Guide & Outcomes`,
      `Educator Prep · Grades 9–12, BS/MBBS, MPhil/PhD`,
      `${guide.bloomObjectives.school_9_12.join(' ')} ${guide.bloomObjectives.bs_mbbs.join(' ')} ${guide.commonMisconceptions.join(' ')} ${guide.labSpotterFocus.join(' ')}`,
      22,
    );
    if (res.score > 0) {
      pushUnique({
        key: `edu-${sys.id}`,
        category: 'educator',
        categoryLabel: 'Educator Guide',
        score: res.score,
        matchReason: res.reason,
        title: `${sys.name.en} — Educator Outcomes & Spotter Guide`,
        subtitle: `Human Anatomy · Bloom’s Objectives & Misconceptions`,
        summary: guide.commonMisconceptions[0] ?? sys.shortSummary.en,
        domainId: 'human_anatomy',
        domainLabel: 'Human Anatomy',
        systemId: sys.id,
        route: 'educator',
        academicTracks: ['school_foundations', 'secondary_premed', 'medical_foundations', 'graduate_research'],
        coverageStatusLabel: 'Lecture outline & worksheet ready',
        metadataLine: `Educator Workspace · ${guide.labSpotterFocus.length} spotter items`,
        keywords: guide.labSpotterFocus.slice(0, 3),
      });
    }
  }

  // 12. Verified Anatomical Relationships
  for (const rel of VERIFIED_RELATIONSHIPS) {
    const srcRec = CURATED_V2_BY_ID.get(rel.sourceConceptId);
    const title = `${srcRec?.canonicalName ?? rel.sourceConceptId} -> ${rel.targetLabel}`;
    const res = scoreTextMatch(
      term,
      tokens,
      title,
      `${rel.directionLabel} · ${rel.sourceReference}`,
      rel.note,
      14,
    );
    if (res.score > 0) {
      pushUnique({
        key: `rel-${rel.id}`,
        category: 'relationship',
        categoryLabel: 'Anatomical Relationship',
        score: res.score - 2,
        matchReason: res.reason,
        title,
        subtitle: `${rel.directionLabel} · ${srcRec?.canonicalSystem ?? 'anatomy'}`,
        summary: rel.note,
        domainId: 'human_anatomy',
        domainLabel: 'Human Anatomy',
        systemId: srcRec?.canonicalSystem,
        conceptId: rel.sourceConceptId,
        relationshipId: rel.id,
        studyInput: {
          conceptId: rel.sourceConceptId,
          relationshipId: rel.id,
          systemId: srcRec?.canonicalSystem,
          sourceModule: 'search',
          sourceItemId: rel.id,
        },
        route: 'relationships',
        academicTracks: ['secondary_premed', 'medical_foundations', 'clinical_applied'],
        coverageStatusLabel: rel.verificationStatus === 'verified' ? 'Verified relationship' : 'Draft relationship',
        inModel: Boolean(srcRec?.visualization.inModel),
        metadataLine: `Relationship · ${rel.type.replace(/_/g, ' ')}`,
        keywords: [rel.directionLabel, rel.targetLabel, srcRec?.canonicalName ?? ''],
      });
    }
  }

  // 13. Extended External Study Resources (OpenStax, NCBI, Radiopaedia, Histology Guide, etc.)
  for (const er of getAllKnownExternalResources()) {
    const res = scoreTextMatch(
      term,
      tokens,
      er.title,
      `${er.publisher} · ${er.licenseNote}`,
      er.summary,
      10,
    );
    if (res.score > 0) {
      pushUnique({
        key: `extres-${er.id}`,
        category: 'resource',
        categoryLabel: 'External Reading',
        score: res.score - 4,
        matchReason: res.reason,
        title: er.title,
        subtitle: `${er.publisher} · ${er.licenseNote}`,
        summary: er.summary,
        domainId: er.domainIds?.[0] ?? 'human_anatomy',
        domainLabel: er.publisher,
        systemId: er.canonicalSystems[0],
        conceptId: er.conceptIds[0],
        topicId: er.topicIds?.[0],
        resourceId: er.id,
        externalUrl: er.url,
        studyInput: {
          resourceId: er.id,
          conceptId: er.conceptIds[0],
          topicId: er.topicIds?.[0],
          domainId: er.domainIds?.[0],
          systemId: er.canonicalSystems[0],
          sourceModule: 'search',
          sourceItemId: er.id,
        },
        route: 'study',
        academicTracks: er.academicLevels ?? ['secondary_premed', 'medical_foundations'],
        coverageStatusLabel: `${er.accessType.replace(/_/g, ' ')} · External link`,
        metadataLine: `External Reading · ${er.publisher}`,
        keywords: [er.publisher, er.licenseNote],
      });
    }
  }

  // 14. Verified Topic-Specific YouTube Educational Videos
  for (const vid of VERIFIED_YOUTUBE_VIDEOS) {
    const res = scoreTextMatch(
      term,
      tokens,
      vid.title,
      `${vid.channelTitle} · Verified Educational Video`,
      vid.learningRelevance,
      12,
    );
    if (res.score > 0) {
      pushUnique({
        key: `ytvid-${vid.id}`,
        category: 'video',
        categoryLabel: 'Educational Video',
        score: res.score - 2,
        matchReason: res.reason,
        title: vid.title,
        subtitle: `${vid.channelTitle} · Verified YouTube oEmbed`,
        summary: vid.learningRelevance,
        domainId: vid.domainIds[0] ?? 'human_anatomy',
        domainLabel: vid.channelTitle,
        systemId: vid.canonicalSystems[0],
        conceptId: vid.conceptIds[0],
        topicId: vid.topicIds[0],
        videoId: vid.id,
        externalUrl: vid.watchUrl,
        studyInput: {
          videoId: vid.id,
          conceptId: vid.conceptIds[0],
          topicId: vid.topicIds[0],
          domainId: vid.domainIds[0],
          systemId: vid.canonicalSystems[0],
          sourceModule: 'search',
          sourceItemId: vid.id,
        },
        route: 'study',
        academicTracks: vid.academicLevels,
        coverageStatusLabel: 'oEmbed-verified YouTube lecture',
        metadataLine: `Video · ${vid.channelTitle}`,
        keywords: [vid.channelTitle, vid.youtubeId],
      });
    }
  }

  const categoryCounts: Record<Exclude<UnifiedSearchCategory, 'all'>, number> = {
    subject: 0,
    topic: 0,
    structure: 0,
    relationship: 0,
    terminology: 0,
    physiology: 0,
    histology: 0,
    clinical: 0,
    presentation: 0,
    quiz: 0,
    resource: 0,
    video: 0,
    curriculum: 0,
    educator: 0,
  };
  for (const it of items) {
    categoryCounts[it.category]++;
  }

  const filtered = catFilter === 'all' ? items : items.filter((it) => it.category === catFilter);
  filtered.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.title.length - b.title.length;
  });

  return {
    results: filtered.slice(0, limit),
    totalBeforeLimit: filtered.length,
    categoryCounts,
  };
}

