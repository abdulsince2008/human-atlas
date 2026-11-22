import type { SystemId } from './anatomy';
import { CANONICAL_SYSTEMS } from './anatomy-systems';
import { CURATED_KNOWLEDGE } from './anatomy-knowledge';
import { KNOWLEDGE_SCHEMA_VERSION } from './knowledge-graph';
import { ANATOMY_LESSONS, GUIDED_PATHWAYS, TERMINOLOGY_ENTRIES } from './learning-data';
import { QUIZ_QUESTIONS } from './quiz-data';

export const SCHEMA_VERSIONS = {
  atlasRegistry: 1,
  knowledgeGraph: KNOWLEDGE_SCHEMA_VERSION,
  contentPack: 1,
  studyStore: 1,
} as const;

export type AtlasAvailabilityStatus = 'available' | 'unavailable_assets';

export interface AtlasDefinition {
  id: string;
  displayName: string;
  referenceProfile: 'adult-male' | 'adult-female' | 'pediatric' | 'variation';
  status: AtlasAvailabilityStatus;
  statusLabel: string;
  modelSource: string;
  modelVersion: string;
  geometryFormat: string;
  manifestUrl?: string;
  assetsSummary: string;
  license: string;
  attribution: string;
  coverageSummary: string;
  missingAssetRequirements?: string[];
  meshCount?: number;
  conceptCount?: number;
}

export const REGISTERED_ATLASES: AtlasDefinition[] = [
  {
    id: 'bp3d-male-4.0',
    displayName: 'Adult Male Reference Anatomy (BodyParts3D 4.0)',
    referenceProfile: 'adult-male',
    status: 'available',
    statusLabel: 'Active in 3D Explorer',
    modelSource: 'The Database Center for Life Science (DBCLS)',
    modelVersion: 'BodyParts3D 4.0 (Simplified Chunked Binary)',
    geometryFormat: 'Indexed Float32/Int16 Binary Chunks + JSON Manifest',
    manifestUrl: '/models/atlas.json',
    assetsSummary: '15 binary chunks (body-0.bin.gz – body-14.bin.gz), 2.29M triangles',
    license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    attribution: 'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.',
    coverageSummary:
      'Complete skeletal framework, major visceral organs, vascular trunks, ocular sensory organs, and adult male reproductive structures.',
    meshCount: 2234,
    conceptCount: 3432,
  },
  {
    id: 'hubmap-female-overlay',
    displayName: 'Adult Female Pelvic & Reproductive Overlay (HuBMAP HRA CC BY 4.0)',
    referenceProfile: 'adult-female',
    status: 'available',
    statusLabel: 'Active in 3D Explorer (Male / Female Toggle)',
    modelSource: 'HuBMAP Human Reference Atlas (NLM Visible Human Female) + Co-Registered Reconstructions',
    modelVersion: 'HuBMAP HRA v2.x + Female Overlay v1.0',
    geometryFormat: 'Indexed Float32/Int16 Binary Chunk + JSON Manifest (merged over BP3D shared torso/limbs)',
    manifestUrl: '/models/female/female-atlas.json',
    assetsSummary: '14 co-registered female meshes (female-0.bin.gz, 23.7k triangles) replacing male-only pelvic/reproductive parts',
    license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    attribution:
      'HuBMAP Human Reference Atlas 3D Reference Library (NLM Visible Human Female, CC BY 4.0) paired with BodyParts3D systemic anatomy.',
    coverageSummary:
      'Female bony pelvis (sacrum, coccyx, hip bones), uterus (fundus, body, cervix), bilateral uterine tubes & ovaries, vagina, female urinary bladder & urethra, and bilateral mammary glands.',
    meshCount: 14,
    conceptCount: 16,
  },
  {
    id: 'pediatric-reference-planned',
    displayName: 'Pediatric Developmental Reference Atlas (Planned)',
    referenceProfile: 'pediatric',
    status: 'unavailable_assets',
    statusLabel: 'Planned — Requires Verified Dataset',
    modelSource: 'Pending verified open-licensed developmental anatomy dataset',
    modelVersion: 'Manifest v1 Specification Ready',
    geometryFormat: 'Chunked Binary (.bin.gz) + Atlas JSON',
    assetsSummary: 'No pediatric geometry bundled',
    license: 'Requires verified CC BY 4.0 / CC0 license',
    attribution: 'Pending source dataset verification',
    coverageSummary:
      'Designed for open epiphyseal growth plates, cranial fontanelles, thymus proportions, and developmental airway dimensions.',
    missingAssetRequirements: [
      'Open-licensed pediatric volumetric/surface meshes normalized to meters',
      'Validated atlas manifest passing validateAtlasManifest() checks',
    ],
  },
];

export interface ManifestValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary?: {
    version: string;
    partsCount: number;
    conceptsCount: number;
    chunksCount: number;
    triangles: number;
    systemsFound: SystemId[];
  };
}

export function validateAtlasManifest(rawJson: unknown): ManifestValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!rawJson || typeof rawJson !== 'object') {
    return { valid: false, errors: ['Manifest root must be a JSON object.'], warnings };
  }

  const obj = rawJson as Record<string, unknown>;
  if (typeof obj.version !== 'string' && typeof obj.version !== 'number') {
    errors.push('Missing required "version" string or number.');
  }
  if (!Array.isArray(obj.parts) || obj.parts.length === 0) {
    errors.push('Manifest "parts" must be a non-empty array of mesh descriptors.');
  }
  if (!Array.isArray(obj.concepts) || obj.concepts.length === 0) {
    errors.push('Manifest "concepts" must be a non-empty array of concept groupings.');
  }
  if (!Array.isArray(obj.chunks) || obj.chunks.length === 0) {
    errors.push('Manifest "chunks" must list at least one binary geometry chunk.');
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  const parts = obj.parts as Record<string, unknown>[];
  const concepts = obj.concepts as Record<string, unknown>[];
  const chunks = obj.chunks as Record<string, unknown>[];

  const partIds = new Set<string>();
  const systemsSet = new Set<SystemId>();

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (!p || typeof p.id !== 'string' || !p.id.trim()) {
      errors.push(`Part at index ${i} is missing a valid string "id".`);
      if (errors.length > 15) break;
      continue;
    }
    if (partIds.has(p.id)) {
      errors.push(`Duplicate part ID detected: "${p.id}".`);
    }
    partIds.add(p.id);

    if (typeof p.conceptId !== 'string' || !p.conceptId.trim()) {
      errors.push(`Part "${p.id}" is missing a valid "conceptId".`);
    }
    if (typeof p.chunk !== 'number' || p.chunk < 0 || p.chunk >= chunks.length) {
      errors.push(`Part "${p.id}" references invalid chunk index ${String(p.chunk)}.`);
    }
    if (typeof p.system === 'string') {
      systemsSet.add(p.system as SystemId);
    } else {
      errors.push(`Part "${p.id}" is missing "system".`);
    }
    if (!Array.isArray(p.bounds) || p.bounds.length !== 2) {
      warnings.push(`Part "${p.id}" has missing or non-standard bounds tuple.`);
    }
  }

  const conceptIds = new Set<string>();
  for (let i = 0; i < concepts.length; i++) {
    const c = concepts[i];
    if (!c || typeof c.id !== 'string' || !c.id.trim()) {
      errors.push(`Concept at index ${i} is missing a valid "id".`);
      if (errors.length > 20) break;
      continue;
    }
    if (conceptIds.has(c.id)) {
      errors.push(`Duplicate concept ID detected: "${c.id}".`);
    }
    conceptIds.add(c.id);

    if (!Array.isArray(c.elements) || c.elements.length === 0) {
      warnings.push(`Concept "${c.id}" has an empty "elements" array.`);
    } else {
      for (const eid of c.elements) {
        if (typeof eid !== 'string' || !partIds.has(eid)) {
          errors.push(`Concept "${c.id}" references unknown part ID "${String(eid)}".`);
          if (errors.length > 25) break;
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.slice(0, 20),
    summary: {
      version: String(obj.version),
      partsCount: parts.length,
      conceptsCount: concepts.length,
      chunksCount: chunks.length,
      triangles: typeof obj.triangles === 'number' ? obj.triangles : 0,
      systemsFound: Array.from(systemsSet),
    },
  };
}

export interface ContentPackValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  packName?: string;
  counts: {
    structures: number;
    lessons: number;
    questions: number;
    histology: number;
    clinicalCases: number;
  };
}

export function validateContentPackJson(rawJson: unknown): ContentPackValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const counts = { structures: 0, lessons: 0, questions: 0, histology: 0, clinicalCases: 0 };

  if (!rawJson || typeof rawJson !== 'object') {
    return { valid: false, errors: ['Content pack must be a JSON object.'], warnings, counts };
  }

  const pack = rawJson as Record<string, unknown>;
  if (typeof pack.packId !== 'string' || !pack.packId.trim()) {
    errors.push('Missing required "packId" string.');
  }
  if (typeof pack.title !== 'string' || !pack.title.trim()) {
    errors.push('Missing required "title" string.');
  }
  if (typeof pack.license !== 'string' || !pack.license.trim()) {
    errors.push('Missing required "license" metadata (e.g., CC BY 4.0).');
  }
  if (typeof pack.attribution !== 'string' || !pack.attribution.trim()) {
    errors.push('Missing required "attribution" metadata.');
  }

  const validSystems = new Set(CANONICAL_SYSTEMS.map((s) => s.id));

  if (Array.isArray(pack.structures)) {
    counts.structures = pack.structures.length;
    const ids = new Set<string>();
    for (const s of pack.structures as Record<string, unknown>[]) {
      if (!s || typeof s.conceptId !== 'string' || !s.anatomicalName) {
        errors.push('Structure entry missing "conceptId" or "anatomicalName".');
      } else {
        if (ids.has(s.conceptId)) errors.push(`Duplicate structure conceptId "${s.conceptId}".`);
        ids.add(s.conceptId);
      }
      if (typeof s.canonicalSystem === 'string' && !validSystems.has(s.canonicalSystem as never)) {
        errors.push(`Structure "${String(s.conceptId)}" references invalid system "${s.canonicalSystem}".`);
      }
    }
  }

  if (Array.isArray(pack.lessons)) {
    counts.lessons = pack.lessons.length;
    for (const l of pack.lessons as Record<string, unknown>[]) {
      if (!l || typeof l.id !== 'string' || typeof l.title !== 'string') {
        errors.push('Lesson entry missing "id" or "title".');
      }
      if (typeof l.systemId === 'string' && !validSystems.has(l.systemId as never)) {
        errors.push(`Lesson "${String(l.id)}" references unknown system "${l.systemId}".`);
      }
      if (!Array.isArray(l.topics) || l.topics.length === 0) {
        warnings.push(`Lesson "${String(l.id)}" currently contains zero topics.`);
      }
    }
  }

  if (Array.isArray(pack.questions)) {
    counts.questions = pack.questions.length;
    for (const q of pack.questions as Record<string, unknown>[]) {
      if (!q || typeof q.id !== 'string' || typeof q.prompt !== 'string') {
        errors.push('Question entry missing "id" or "prompt".');
      }
      if (typeof q.explanation !== 'string' || !q.explanation.trim()) {
        errors.push(`Question "${String(q.id)}" is missing an educational explanation.`);
      }
    }
  }

  if (Array.isArray(pack.histology)) counts.histology = pack.histology.length;
  if (Array.isArray(pack.clinicalCases)) counts.clinicalCases = pack.clinicalCases.length;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    packName: typeof pack.title === 'string' ? pack.title : undefined,
    counts,
  };
}

export function getRegisteredContentSummary() {
  return {
    schemaVersions: SCHEMA_VERSIONS,
    atlases: REGISTERED_ATLASES.length,
    activeAtlases: REGISTERED_ATLASES.filter((a) => a.status === 'available').length,
    systems: CANONICAL_SYSTEMS.length,
    curatedStructures: CURATED_KNOWLEDGE.length,
    lessons: ANATOMY_LESSONS.length,
    lessonTopics: ANATOMY_LESSONS.reduce((sum, l) => sum + l.topics.length, 0),
    pathways: GUIDED_PATHWAYS.length,
    terminologyTerms: TERMINOLOGY_ENTRIES.length,
    quizQuestions: QUIZ_QUESTIONS.length,
  };
}
