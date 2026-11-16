import type { Atlas, Part } from './anatomy';
import {
  CANONICAL_SYSTEMS,
  canonicalSystemForMeshSystem,
  type CanonicalSystemId,
} from './anatomy-systems';
import {
  KNOWLEDGE_GRAPH_V2,
  type ModelCoverageTier,
  type StructureCategory,
  type StructureKnowledgeV2,
} from './knowledge-graph';
import { ANATOMY_LESSONS, TERMINOLOGY_ENTRIES } from './learning-data';

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
