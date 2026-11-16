import type { Atlas, Part, SystemId, View } from '../anatomy';
import { CURATED_KNOWLEDGE, lookupStructureKnowledge } from '../anatomy-knowledge';
import { CANONICAL_SYSTEMS, canonicalSystemForMeshSystem, type CanonicalSystemId } from '../anatomy-systems';
import type { ConcreteDifficulty, SpotterCandidate } from './types';

// Brain ventricular meshes misclassified under the 'cardiac' mesh layer in BodyParts3D
const BRAIN_VENTRICLE_IDS = new Set([
  'FMA78454',
  'FMA78469',
  'FMA78450',
  'FMA78449',
  'FMA242790',
]);

// Generic FMA ontology classes that wrap many distinct organs rather than naming one anatomical target
const UMBRELLA_CONCEPT_NAMES = new Set([
  'bone organ',
  'muscle organ',
  'organ component',
  'organ component gland',
  'membrane organ',
  'long bone',
  'short bone',
  'irregular bone',
  'flat bone',
  'sesamoid bone',
  'vascular tree',
  'segment of artery',
  'segment of vein',
  'variant artery',
  'anastomosis',
  'vascular anastomosis',
  'arterial anastomosis',
  'anatomical junction',
  'anatomical space',
  'anatomical lobe',
  'solid organ',
  'parenchymatous organ',
  'lobular organ',
  'corticomedullary organ',
  'organ cavity subdivision',
  'retinaculum',
  'cranial nerve',
  'ganglion',
  'autonomic ganglion',
  'parasympathetic ganglion',
  'cranial parasympathetic ganglion',
  'subdivision of head',
  'subdivision of mouth',
  'hair',
  'skin',
]);

// Unclickably occluded internal cavity / lumen / wall fragments unless explicitly curated
const OCCLUDED_PATTERN = /\b(cavity of|lumen of|wall of|taenia |subdivision of)\b/i;

const CURATED_BY_ID = new Map(CURATED_KNOWLEDGE.map((entry) => [entry.conceptId, entry]));

const PREFERRED_VIEW_BY_CONCEPT: Record<string, View> = {
  FMA67944: 'back',
  FMA7647: 'back',
  FMA13394: 'back',
  FMA22314: 'back',
  FMA22315: 'back',
  FMA32529: 'back',
  FMA45950: 'back',
  FMA22542: 'back',
  FMA258847: 'back',
  FMA37692: 'back',
  FMA7203: 'back',
  FMA7204: 'back',
  FMA7205: 'back',
  FMA9604: 'back',
  FMA9915: 'back',
  FMA9139: 'back',
  FMA9921: 'back',
  FMA7196: 'left',
  FMA7148: 'front',
  FMA7197: 'front',
  FMA7088: 'front',
};

function computeConceptBoundingSize(elementIds: string[], partMap: Map<string, Part>): number {
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  for (const id of elementIds) {
    const p = partMap.get(id);
    if (!p) continue;
    minX = Math.min(minX, p.bounds[0][0]);
    minY = Math.min(minY, p.bounds[0][1]);
    minZ = Math.min(minZ, p.bounds[0][2]);
    maxX = Math.max(maxX, p.bounds[1][0]);
    maxY = Math.max(maxY, p.bounds[1][1]);
    maxZ = Math.max(maxZ, p.bounds[1][2]);
  }

  if (!Number.isFinite(minX)) return 0;
  return Math.max(maxX - minX, maxY - minY, maxZ - minZ);
}

function inferPreferredView(elementIds: string[], partMap: Map<string, Part>, conceptId: string): View {
  if (PREFERRED_VIEW_BY_CONCEPT[conceptId]) {
    return PREFERRED_VIEW_BY_CONCEPT[conceptId];
  }
  let sumX = 0;
  let sumZ = 0;
  let count = 0;
  for (const id of elementIds) {
    const p = partMap.get(id);
    if (!p) continue;
    sumX += (p.bounds[0][0] + p.bounds[1][0]) * 0.5;
    sumZ += (p.bounds[0][2] + p.bounds[1][2]) * 0.5;
    count++;
  }
  if (count === 0) return 'three-quarter';
  const avgX = sumX / count;
  const avgZ = sumZ / count;
  if (avgZ < -0.05) return 'back';
  if (avgX > 0.14) return 'left';
  if (avgX < -0.14) return 'right';
  return 'three-quarter';
}

function buildRegionClue(
  anatomicalName: string,
  canonicalSystem: CanonicalSystemId,
  elementIds: string[],
  partMap: Map<string, Part>,
  hasCurated: boolean,
  conceptId: string,
): string {
  const sysInfo = CANONICAL_SYSTEMS.find((s) => s.id === canonicalSystem);
  const sysLabel = sysInfo?.name.en ?? 'Human Anatomy';

  if (hasCurated) {
    const knowledge = lookupStructureKnowledge(conceptId, anatomicalName);
    const rawLocation = knowledge.location.en.trim();
    // Redact the exact structure name if it appears inside the location clue
    const escaped = anatomicalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const sanitized = rawLocation.replace(new RegExp(escaped, 'gi'), 'this structure');
    return `${sysLabel} · ${sanitized}`;
  }

  let avgY = 0.85;
  let avgX = 0;
  let count = 0;
  for (const id of elementIds) {
    const p = partMap.get(id);
    if (!p) continue;
    avgX += (p.bounds[0][0] + p.bounds[1][0]) * 0.5;
    avgY += (p.bounds[0][1] + p.bounds[1][1]) * 0.5;
    count++;
  }
  if (count > 0) {
    avgX /= count;
    avgY /= count;
  }

  let region = 'trunk region';
  if (avgY >= 1.44) region = 'head and neck region';
  else if (avgY >= 1.14) region = Math.abs(avgX) > 0.18 ? 'upper limb / shoulder region' : 'thoracic region';
  else if (avgY >= 0.84) region = Math.abs(avgX) > 0.19 ? 'forearm or hand region' : 'abdominal region';
  else if (avgY >= 0.68) region = Math.abs(avgX) > 0.19 ? 'pelvic / hand region' : 'pelvic region';
  else if (avgY >= 0.35) region = 'thigh and knee region';
  else region = 'lower leg and foot region';

  return `${sysLabel} · Located in the ${region} of the anatomical model.`;
}

function classifyDifficulty(
  conceptId: string,
  canonicalSystem: CanonicalSystemId,
  boundingSize: number,
  hasCurated: boolean,
  name: string,
): ConcreteDifficulty {
  const sys = CANONICAL_SYSTEMS.find((s) => s.id === canonicalSystem);
  const curated = CURATED_BY_ID.get(conceptId);
  const isFeatured = sys?.featuredConceptIds.includes(conceptId) ?? false;

  if (curated) {
    const relevance = curated.examRelevance ?? '';
    if (isFeatured || /FSc|Foundational/i.test(relevance) || boundingSize >= 0.085) {
      return 'foundational';
    }
    if (/MBBS/i.test(relevance) && boundingSize < 0.06) {
      return 'advanced';
    }
    return 'intermediate';
  }

  if (boundingSize >= 0.14 && !/\b(branch|tributary|segmental|head of|zone of)\b/i.test(name)) {
    return 'foundational';
  }
  if (boundingSize >= 0.055 && !/\b(tributary|communicating|segmental)\b/i.test(name)) {
    return 'intermediate';
  }
  return 'advanced';
}

function resolveCanonicalSystem(
  conceptId: string,
  parts: Part[],
): { canonicalSystem: CanonicalSystemId; meshSystem: SystemId } {
  const curated = CURATED_BY_ID.get(conceptId);
  const primaryMeshSystem = parts[0]?.system ?? 'skeletal';
  if (curated) {
    return {
      canonicalSystem: curated.canonicalSystem,
      meshSystem: primaryMeshSystem,
    };
  }
  const canonical = canonicalSystemForMeshSystem(primaryMeshSystem);
  return {
    canonicalSystem: canonical.id,
    meshSystem: primaryMeshSystem,
  };
}

export function buildSpotterCatalog(atlas: Atlas): SpotterCandidate[] {
  const partMap = new Map(atlas.parts.map((p) => [p.id, p]));
  const conceptMap = new Map(atlas.concepts.map((c) => [c.id, c]));

  const seenIds = new Set<string>();
  const seenNormalizedNames = new Set<string>();
  const candidates: SpotterCandidate[] = [];

  const tryAddConcept = (conceptId: string, isCurated: boolean) => {
    if (seenIds.has(conceptId) || BRAIN_VENTRICLE_IDS.has(conceptId)) return;
    const concept = conceptMap.get(conceptId);
    if (!concept || concept.elements.length === 0) return;

    const parts = concept.elements
      .map((id) => partMap.get(id))
      .filter((p): p is Part => Boolean(p));
    if (parts.length === 0) return;

    // Filter out non-curated umbrella/occluded/abstract ontology groupings
    const lowerName = concept.name.trim().toLowerCase();
    if (!isCurated) {
      if (UMBRELLA_CONCEPT_NAMES.has(lowerName)) return;
      if (OCCLUDED_PATTERN.test(lowerName)) return;
      if (concept.elements.length > 14) return;
      // Avoid duplicate numbered tooth / generic minor sub-branches that clutter MCQ options unless needed
      if (/\bgingiva of\b/i.test(lowerName)) return;
    }

    const { canonicalSystem, meshSystem } = resolveCanonicalSystem(conceptId, parts);
    const curated = CURATED_BY_ID.get(conceptId);
    const anatomicalName = curated?.anatomicalName ?? capitalizeAnatomyName(concept.name);
    const commonName = curated?.commonName ?? anatomicalName;

    const normalizedKey = `${canonicalSystem}:${anatomicalName.toLowerCase()}`;
    if (seenNormalizedNames.has(normalizedKey)) return;

    const boundingSize = computeConceptBoundingSize(concept.elements, partMap);
    // Non-curated items below 2.0 cm are typically too tiny/faint for fair click-to-locate spotters
    if (!isCurated && boundingSize < 0.02) return;

    const difficulty = classifyDifficulty(
      conceptId,
      canonicalSystem,
      boundingSize,
      isCurated,
      anatomicalName,
    );

    const preferredView = inferPreferredView(concept.elements, partMap, conceptId);
    const regionClue = buildRegionClue(
      anatomicalName,
      canonicalSystem,
      concept.elements,
      partMap,
      isCurated,
      conceptId,
    );

    seenIds.add(conceptId);
    seenNormalizedNames.add(normalizedKey);

    candidates.push({
      conceptId,
      anatomicalName,
      commonName,
      canonicalSystem,
      meshSystem,
      elementIds: concept.elements,
      boundingSize,
      difficulty,
      hasCuratedKnowledge: isCurated,
      preferredView,
      regionClue,
      synonyms: curated?.synonyms ?? [],
    });
  };

  // Pass 1: Prioritize all verified CURATED_KNOWLEDGE concepts in the 3D atlas
  for (const item of CURATED_KNOWLEDGE) {
    if (!item.inModel) continue;
    tryAddConcept(item.conceptId, true);
  }

  // Pass 2: Add verified direct leaf part concepts from atlas.parts
  for (const part of atlas.parts) {
    tryAddConcept(part.conceptId, CURATED_BY_ID.has(part.conceptId));
  }

  return candidates;
}

export function capitalizeAnatomyName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
