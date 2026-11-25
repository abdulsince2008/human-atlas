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
  referenceProfile: 'adult-male' | 'adult-female' | 'shared-layer' | 'optional-layer' | 'pediatric' | 'variation';
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
    displayName: 'Adult Male Base Reference (BodyParts3D 4.0)',
    referenceProfile: 'adult-male',
    status: 'available',
    statusLabel: 'Active Base Layer (2,301 Male Active w/ Overlays)',
    modelSource: 'The Database Center for Life Science (DBCLS)',
    modelVersion: 'BodyParts3D 4.0 (Simplified Chunked Binary)',
    geometryFormat: 'Indexed Float32/Int16 Binary Chunks + JSON Manifest',
    manifestUrl: '/models/atlas.json',
    assetsSummary: '2,234 base parts / 3,432 FMA concepts (15 binary chunks body-0..14.bin.gz, 2.29M triangles)',
    license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    attribution: 'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.',
    coverageSummary:
      'Complete skeletal framework, muscles, systemic vasculature, CNS/eye structures, and male reproductive/urinary anatomy (paired with 47 shared & 20 male HuBMAP enhancements = 2,301 Male active parts).',
    meshCount: 2234,
    conceptCount: 3432,
  },
  {
    id: 'hubmap-shared-enhancements',
    displayName: 'Shared Systemic Enhancements (HuBMAP HRA)',
    referenceProfile: 'shared-layer',
    status: 'available',
    statusLabel: 'Active in Both Male & Female',
    modelSource: 'HuBMAP Human Reference Atlas (Visible Human Male Spinal Cord v1.1, Liver v1.2, Palatine Tonsil v1.1, Kidney v1.2)',
    modelVersion: 'Shared Enhancements v1.0',
    geometryFormat: 'Indexed Binary Chunk + JSON Manifest (shared-0.bin.gz)',
    manifestUrl: '/models/shared/shared-enhancements.json',
    assetsSummary: '47 shared verified parts / 49 concepts (33.8k triangles): C1–S5 spinal cord segments (30), hepatic porta/ligaments (7), palatine tonsils (2), and intrarenal cortex/medulla/columns/hilum (8)',
    license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    attribution: 'HuBMAP Human Reference Atlas 3D Reference Organ Library (CC BY 4.0).',
    coverageSummary: 'Fills verified sex-neutral CNS spinal cord segmentation, hepatic ligamentous, tonsillar, and intrarenal anatomical detail.',
    meshCount: 47,
    conceptCount: 49,
  },
  {
    id: 'hubmap-male-enhancements',
    displayName: 'Adult Male Uro-Pelvic Enhancements (HuBMAP HRA)',
    referenceProfile: 'adult-male',
    status: 'available',
    statusLabel: 'Active in Male Mode (+20 Parts)',
    modelSource: 'HuBMAP Human Reference Atlas (Male Pelvis v1.3, Bladder v1.2, Prostate v1.2, Male Vasculature v1.3)',
    modelVersion: 'Male Enhancements v1.0',
    geometryFormat: 'Indexed Binary Chunk + JSON Manifest (male-0.bin.gz)',
    manifestUrl: '/models/male/male-enhancements.json',
    assetsSummary: '20 male-specific parts / 20 concepts (17.0k triangles): prostate zones/ducts/utricle/colliculus (13), bladder trigone/neck (2), male coccyx (1), rectal veins (4)',
    license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    attribution: 'HuBMAP Human Reference Atlas 3D Reference Organ Library (CC BY 4.0).',
    coverageSummary: 'Deepens Adult Male prostate zonal micro-subdivisions, bladder trigone/neck, and pelvic venous drainage.',
    missingAssetRequirements: [
      "Bulbourethral (Cowper's) glands, scrotal fascia/tunica vaginalis, and pampiniform plexus",
      'Male pudendal/prostatic autonomic nerve branches and urethral subdivision splits',
    ],
    meshCount: 20,
    conceptCount: 20,
  },
  {
    id: 'hubmap-female-overlay',
    displayName: 'Adult Female Pelvic, Vascular & Mammary Overlay v3.0 (84 HuBMAP + 8 Reconstructions)',
    referenceProfile: 'adult-female',
    status: 'available',
    statusLabel: 'Active in Female Mode (2,328 Active Parts)',
    modelSource: 'HuBMAP HRA (84 CC BY 4.0 meshes) + 8 Anatomically Co-Registered Reconstructions',
    modelVersion: 'female-overlay-3.0 (HuBMAP HRA v1.5 / v1.3 / v1.1)',
    geometryFormat: 'Indexed Binary Chunk + JSON Manifest (female-0.bin.gz, replaces 45 male-specific/pelvic parts)',
    manifestUrl: '/models/female/female-atlas.json',
    assetsSummary: '92 female parts / 92 concepts (133.8k triangles): 84 direct HuBMAP HRA CC BY 4.0 meshes (55 HRA v1.5 Visible Human Female DOI: 10.48539/HBM352.BTSQ.586 + 16 HRA v1.1 Mammary Gland + 13 HRA v1.3 Female Pelvic Vasculature) + 8 procedural reconstructions; 2,189 base parts reused + 47 shared = 2,328 active Female parts',
    license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    attribution:
      'HuBMAP Human Reference Atlas 3D Reference Library (84 CC BY 4.0 meshes) + 8 co-registered pelvic/urethral reconstructions paired with BodyParts3D systemic anatomy.',
    coverageSummary:
      'Female bony pelvis (sacrum, coccyx, bilateral ilium/ischium/pubis), uterus, cervix, ovaries, uterine tubes, ligaments, vagina, external vulvar reconstructions, female urinary bladder & urethra, female pelvic/iliac/pudendal/rectal vessels, and bilateral mammary glands. 2,189 extra-pelvic cranium/thorax/limb parts remain reused from BP3D adult male donor.',
    missingAssetRequirements: [
      'Female-adapted levator ani, perineal musculature, and external urethral sphincter',
      'Female ovarian, vaginal, internal pudendal artery, and dorsal clitoral vasculature',
      'Female pelvic autonomic/pudendal innervation and axillary/pelvic lymph node chains',
      'Replace 8 procedural vulvar/urethral/endometrial reconstructions with segmented cadaveric meshes',
    ],
    meshCount: 92,
    conceptCount: 92,
  },
  {
    id: 'hubmap-optional-pregnancy',
    displayName: 'Optional Pregnancy & Full-Term Placenta Layer (HuBMAP HRA v1.1)',
    referenceProfile: 'optional-layer',
    status: 'available',
    statusLabel: 'Optional Layer (OFF by Default in Female Mode)',
    modelSource: 'HuBMAP Human Reference Atlas (Visible Human Female Full-Term Placenta v1.1)',
    modelVersion: 'Optional Layer v1.0',
    geometryFormat: 'Indexed Binary Chunk + JSON Manifest (pregnancy-0.bin.gz)',
    manifestUrl: '/models/optional/pregnancy-placenta.json',
    assetsSummary: '8 parts / 8 concepts (13.3k triangles): placenta basal/chorionic plates, villous vessels, amnion, umbilical cord, and umbilical arteries/vein',
    license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    attribution: 'HuBMAP Human Reference Atlas 3D Reference Organ Library (CC BY 4.0).',
    coverageSummary: 'Separated outside the non-pregnant Adult Female baseline (2,328 parts); raises active count to 2,336 parts when explicitly toggled ON.',
    meshCount: 8,
    conceptCount: 8,
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
