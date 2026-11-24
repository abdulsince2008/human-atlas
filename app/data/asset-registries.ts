import type { Atlas, Part } from '../anatomy';
import { classifyPartTissue, type TissueType } from '../tissue-materials';
import type { ProvenanceReviewStatus } from './provenance-registry';

/**
 * Multi-Source Asset, License, Geometry Quality Policy, LOD & Texture Registries
 *
 * Schema-versioned, source-independent infrastructure allowing future anatomy packs
 * (Z-Anatomy, Open3DModel, VOXEL-MAN, HuBMAP HRA, NLM Visible Human) to be registered
 * and validated without rewriting the core Three.js renderer.
 */

export const ASSET_REGISTRY_SCHEMA_VERSION = 2;

export type AssetIntegrationStatus =
  | 'integrated'
  | 'pending_external_download'
  | 'excluded_license_review'
  | 'benchmark_only';

export interface DatasetLicenseRecord {
  id: string;
  datasetName: string;
  version: string;
  rightsHolder: string;
  officialSourceUrl: string;
  officialLicenseUrl: string;
  licenseName: string;
  redistributionAllowed: boolean;
  modificationAllowed: boolean;
  commercialUseAllowed: boolean;
  shareAlikeRequired: boolean;
  attributionText: string;
  integrationStatus: AssetIntegrationStatus;
  bundledInPublicBuild: boolean;
  notes: string;
  dateChecked: string;
}

export const LICENSE_REGISTRY: DatasetLicenseRecord[] = [
  {
    id: 'bp3d-4.0',
    datasetName: 'BodyParts3D / Anatomography',
    version: '4.0 (isa_BP3D_4.0_obj_99)',
    rightsHolder: 'The Database Center for Life Science (DBCLS), Japan',
    officialSourceUrl: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html',
    officialLicenseUrl: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
    licenseName: 'CC BY 4.0 International (updated by DBCLS from historical CC BY-SA 2.1 Japan)',
    redistributionAllowed: true,
    modificationAllowed: true,
    commercialUseAllowed: true,
    shareAlikeRequired: false,
    attributionText:
      'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.',
    integrationStatus: 'integrated',
    bundledInPublicBuild: true,
    notes:
      'Primary bundled adult male 3D mesh dataset (2,234 meshes, 15 binary chunks). Historical BP3D 4.0 releases carried CC BY-SA 2.1 Japan; current DBCLS archive license page specifies CC BY 4.0.',
    dateChecked: '2026-11-18',
  },
  {
    id: 'human-atlas-engine',
    datasetName: 'Human Atlas WebGL Base',
    version: '2026 baseline',
    rightsHolder: 'ashemag / contributors',
    officialSourceUrl: 'https://github.com/ashemag/human-atlas',
    officialLicenseUrl: 'https://opensource.org/licenses/MIT',
    licenseName: 'MIT License',
    redistributionAllowed: true,
    modificationAllowed: true,
    commercialUseAllowed: true,
    shareAlikeRequired: false,
    attributionText: 'Copyright (c) 2026 ashemag (MIT License).',
    integrationStatus: 'integrated',
    bundledInPublicBuild: true,
    notes: 'Core binary chunk loader and merged-geometry WebGL foundation.',
    dateChecked: '2026-11-18',
  },
  {
    id: 'fma-ontology',
    datasetName: 'Foundational Model of Anatomy (FMA)',
    version: 'FMA 4.x concept identifiers',
    rightsHolder: 'Structural Informatics Group, University of Washington',
    officialSourceUrl: 'https://obofoundry.org/ontology/fma.html',
    officialLicenseUrl: 'https://obofoundry.org/ontology/fma.html',
    licenseName: 'CUSTOM (OBO Foundry recorded license — not CC BY 4.0)',
    redistributionAllowed: false,
    modificationAllowed: false,
    commercialUseAllowed: false,
    shareAlikeRequired: false,
    attributionText:
      'Concept IDs aligned with Foundational Model of Anatomy (FMA), Structural Informatics Group, University of Washington (CUSTOM license; full ontology dump not redistributed).',
    integrationStatus: 'integrated',
    bundledInPublicBuild: false,
    notes:
      'Corrected from legacy CC BY 4.0 assumption. Only canonical FMA concept IDs carried in BodyParts3D metadata are referenced.',
    dateChecked: '2026-11-18',
  },
  {
    id: 'ifaa-ta2-terminology',
    datasetName: 'Terminologia Anatomica (TA2) & Terminologia Neuroanatomica (TNA)',
    version: 'TA2 (2019) / TNA (2017)',
    rightsHolder: 'IFAA / FIPAT',
    officialSourceUrl: 'https://ifaa.net/committees/anatomical-terminology-fipat/',
    officialLicenseUrl: 'https://ifaa.net/committees/anatomical-terminology-fipat/fipat-ifaa-terminologies/',
    licenseName: 'CC BY-ND 4.0 (NoDerivatives)',
    redistributionAllowed: true,
    modificationAllowed: false,
    commercialUseAllowed: true,
    shareAlikeRequired: false,
    attributionText:
      'Anatomical nomenclature aligned with FIPAT/IFAA Terminologia Anatomica (TA2, CC BY-ND 4.0; source tables not modified or redistributed).',
    integrationStatus: 'benchmark_only',
    bundledInPublicBuild: false,
    notes:
      'Used as authoritative terminology reference; modified TA2 tables are never bundled to respect CC BY-ND 4.0.',
    dateChecked: '2026-11-18',
  },
  {
    id: 'z-anatomy-models',
    datasetName: 'Z-Anatomy Models of Human Anatomy',
    version: 'Latest upstream Blender/GLB release',
    rightsHolder: 'Z-Anatomy / BodyParts3D derivatives & contributors',
    officialSourceUrl: 'https://github.com/Z-Anatomy/Models-of-human-anatomy',
    officialLicenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    licenseName: 'CC BY-SA 4.0 (per-asset verification required)',
    redistributionAllowed: true,
    modificationAllowed: true,
    commercialUseAllowed: true,
    shareAlikeRequired: true,
    attributionText: 'Z-Anatomy (CC BY-SA 4.0) — must be distributed as a separately attributed share-alike pack.',
    integrationStatus: 'excluded_license_review',
    bundledInPublicBuild: false,
    notes:
      'Excluded from main public bundle pending per-asset license audit and isolated CC BY-SA pack distribution.',
    dateChecked: '2026-11-18',
  },
  {
    id: 'open3dmodel-anatomytool',
    datasetName: 'Open3DModel (AnatomyTOOL)',
    version: 'Regional musculoskeletal & neurovascular packs',
    rightsHolder: 'AnatomyTOOL / Leiden University Medical Center & partners',
    officialSourceUrl: 'https://anatomytool.org/open3dmodel',
    officialLicenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    licenseName: 'CC BY-SA 4.0 / CC BY 4.0 (varies by regional model)',
    redistributionAllowed: true,
    modificationAllowed: true,
    commercialUseAllowed: true,
    shareAlikeRequired: true,
    attributionText: 'Open3DModel / AnatomyTOOL (per-model attribution required upon import).',
    integrationStatus: 'pending_external_download',
    bundledInPublicBuild: false,
    notes:
      'Priority candidate for detailed upper/lower limb tendons, ligaments, fasciae, and neurovascular bundles via external GLB import adapter.',
    dateChecked: '2026-11-18',
  },
  {
    id: 'voxel-man-zenodo',
    datasetName: 'VOXEL-MAN Segmented Organ Dataset',
    version: 'Zenodo record 15882019',
    rightsHolder: 'VOXEL-MAN / University Medical Center Hamburg-Eppendorf',
    officialSourceUrl: 'https://doi.org/10.5281/zenodo.15882019',
    officialLicenseUrl: 'https://doi.org/10.5281/zenodo.15882019',
    licenseName: 'Verify Zenodo record license before bundling',
    redistributionAllowed: false,
    modificationAllowed: false,
    commercialUseAllowed: false,
    shareAlikeRequired: false,
    attributionText: 'Pending Zenodo metadata license audit.',
    integrationStatus: 'pending_external_download',
    bundledInPublicBuild: false,
    notes: 'Candidate for thoracic, abdominal, and pelvic segmented organ and cross-sectional reference integration.',
    dateChecked: '2026-11-18',
  },
  {
    id: 'hubmap-hra-3d',
    datasetName: 'HuBMAP Human Reference Atlas 3D Reference Library',
    version: 'HRA v2.x',
    rightsHolder: 'HuBMAP Consortium / Indiana University',
    officialSourceUrl: 'https://humanatlas.io/3d-reference-library',
    officialLicenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    licenseName: 'CC BY 4.0',
    redistributionAllowed: true,
    modificationAllowed: true,
    commercialUseAllowed: true,
    shareAlikeRequired: false,
    attributionText: 'HuBMAP Human Reference Atlas 3D Reference Organ Library (CC BY 4.0).',
    integrationStatus: 'integrated',
    bundledInPublicBuild: true,
    notes: '71 direct HuBMAP HRA CC BY 4.0 meshes (55 HRA v1.5 Visible Human Female DOI: 10.48539/HBM352.BTSQ.586 + 16 HRA v1.1 Mammary Gland) combined with 8 anatomically co-registered reconstructions (79 parts / 124.4k triangles) in public/models/female/ for Male/Female 3D viewer switching.',
    dateChecked: '2026-11-24',
  },
  {
    id: 'nlm-visible-human',
    datasetName: 'NLM Visible Human Project',
    version: 'Male & Female Cryosection / CT / MRI Archive',
    rightsHolder: 'U.S. National Library of Medicine (NIH)',
    officialSourceUrl: 'https://datadiscovery.nlm.nih.gov/Diagnostic-Imaging/Visible-Human-Project/ux2j-9i9a',
    officialLicenseUrl: 'https://www.nlm.nih.gov/databases/download/terms_and_conditions.html',
    licenseName: 'NLM Open Public Data (attribution required)',
    redistributionAllowed: true,
    modificationAllowed: true,
    commercialUseAllowed: true,
    shareAlikeRequired: false,
    attributionText: 'Courtesy of the U.S. National Library of Medicine Visible Human Project.',
    integrationStatus: 'pending_external_download',
    bundledInPublicBuild: false,
    notes: 'Multi-gigabyte dataset; never commit unprocessed files into the repository. Intended for external cross-sectional slice pack import.',
    dateChecked: '2026-11-18',
  },
  {
    id: '3d-neurosurgical-atlas',
    datasetName: '3D Atlas of Neurological Surgery',
    version: 'Reference benchmark only',
    rightsHolder: 'The Neurosurgical Atlas, Inc.',
    officialSourceUrl: 'https://3datlasofneurologicalsurgery.org/',
    officialLicenseUrl: 'https://3datlasofneurologicalsurgery.org/',
    licenseName: 'Proprietary / All Rights Reserved (Visual Benchmark Only)',
    redistributionAllowed: false,
    modificationAllowed: false,
    commercialUseAllowed: false,
    shareAlikeRequired: false,
    attributionText: 'Referenced solely as an educational quality benchmark; zero assets copied or redistributed.',
    integrationStatus: 'benchmark_only',
    bundledInPublicBuild: false,
    notes: 'Strict exclusion: protected assets must never be scraped or copied.',
    dateChecked: '2026-11-18',
  },
];

// ---------------------------------------------------------------------------
// Structure-Specific Geometry Quality Policy & LOD Architecture
// ---------------------------------------------------------------------------

export type GeometryPreservationTier = 'very_high' | 'high' | 'standard' | 'adaptive';

export interface GeometryQualityPolicy {
  tier: GeometryPreservationTier;
  minTriangleCount: number;
  maxSimplificationError: number;
  targetRetentionRatio: number;
  simplificationPermitted: boolean;
  preserveSharpEdges: boolean;
  nearCameraHighDetail: boolean;
  rationale: string;
}

export const GEOMETRY_QUALITY_POLICIES: Record<GeometryPreservationTier, GeometryQualityPolicy> = {
  very_high: {
    tier: 'very_high',
    minTriangleCount: 600,
    maxSimplificationError: 0.0005,
    targetRetentionRatio: 0.85,
    simplificationPermitted: true,
    preserveSharpEdges: true,
    nearCameraHighDetail: true,
    rationale: 'Cranial nerves, fine cerebral arteries, ossicles, and delicate sensory/landmark structures.',
  },
  high: {
    tier: 'high',
    minTriangleCount: 350,
    maxSimplificationError: 0.001,
    targetRetentionRatio: 0.65,
    simplificationPermitted: true,
    preserveSharpEdges: true,
    nearCameraHighDetail: true,
    rationale: 'Major vessels, tendons, ligaments, articular surfaces, facial structures, and cortical gyri.',
  },
  standard: {
    tier: 'standard',
    minTriangleCount: 180,
    maxSimplificationError: 0.0018,
    targetRetentionRatio: 0.45,
    simplificationPermitted: true,
    preserveSharpEdges: false,
    nearCameraHighDetail: false,
    rationale: 'Internal organs and medium-sized skeletal/muscular structures.',
  },
  adaptive: {
    tier: 'adaptive',
    minTriangleCount: 120,
    maxSimplificationError: 0.0025,
    targetRetentionRatio: 0.28,
    simplificationPermitted: true,
    preserveSharpEdges: false,
    nearCameraHighDetail: false,
    rationale: 'Large broad superficial muscles, skin envelope, and broad flat bones.',
  },
};

export function evaluatePartGeometryPolicy(part: Pick<Part, 'id' | 'name' | 'system' | 'indexCount'>): GeometryQualityPolicy {
  const n = part.name.toLowerCase();
  if (/optic|oculomotor|trochlear|trigeminal|facial nerve|vagus|cochlea|ossicle|cornea|retina|cerebral artery|coronary|pituitary|pineal|hippocampus|amygdala/.test(n)) {
    return GEOMETRY_QUALITY_POLICIES.very_high;
  }
  if (
    part.system === 'arterial' ||
    part.system === 'venous' ||
    part.system === 'nervous' ||
    part.system === 'sensory' ||
    /tendon|ligament|meniscus|cartilage|gyrus|valve|foramen|maxilla|mandible|zygomatic|sphenoid|ethmoid/.test(n)
  ) {
    return GEOMETRY_QUALITY_POLICIES.high;
  }
  if (part.system === 'integumentary' || (part.system === 'muscular' && part.indexCount / 3 > 2500)) {
    return GEOMETRY_QUALITY_POLICIES.adaptive;
  }
  return GEOMETRY_QUALITY_POLICIES.standard;
}

export interface LodLevelSpec {
  level: 0 | 1 | 2 | 3;
  name: string;
  targetDescription: string;
  availableInBundledAtlas: boolean;
  notes: string;
}

export const LOD_LEVEL_SPECS: LodLevelSpec[] = [
  {
    level: 0,
    name: 'LOD 0 (Unsimplified Source)',
    targetDescription: 'Original unsimplified source geometry (e.g., 6.68M triangles for BP3D 4.0)',
    availableInBundledAtlas: false,
    notes: 'Supported by scripts/optimize-anatomy.mjs --lod=0 --preserve-source; not bundled in static web build to respect browser memory budgets.',
  },
  {
    level: 1,
    name: 'LOD 1 (High-Detail Optimized)',
    targetDescription: 'Bundled BodyParts3D 4.0 production mesh set (2.29M triangles, 0.2% error bound)',
    availableInBundledAtlas: true,
    notes: 'Active bundled default in public/models/atlas.json across 15 gzipped binary chunks.',
  },
  {
    level: 2,
    name: 'LOD 2 (Medium Detail)',
    targetDescription: 'Balanced desktop/tablet pack (~1.1M triangles) preserving high-priority nerves & vessels',
    availableInBundledAtlas: false,
    notes: 'Generatable via scripts/optimize-anatomy.mjs --lod=2.',
  },
  {
    level: 3,
    name: 'LOD 3 (Mobile / Distant)',
    targetDescription: 'Lightweight mobile fallback (~450k triangles) with structure-aware floor',
    availableInBundledAtlas: false,
    notes: 'Generatable via scripts/optimize-anatomy.mjs --lod=3.',
  },
];

// ---------------------------------------------------------------------------
// PBR Texture Registry (Honest Procedural Fallback + 2K/4K/8K Ready Schema)
// ---------------------------------------------------------------------------

export interface TextureAssetRecord {
  id: string;
  tissueType: TissueType;
  resolutionTier: 'procedural_fallback' | '2K' | '4K' | '8K';
  compression: 'none' | 'ktx2_basis';
  baseColorUrl?: string;
  normalMapUrl?: string;
  roughnessMapUrl?: string;
  aoMapUrl?: string;
  licenseId: string;
  reviewStatus: ProvenanceReviewStatus;
  notes: string;
}

export const TEXTURE_REGISTRY: TextureAssetRecord[] = [
  {
    id: 'tex-procedural-natural-fallback',
    tissueType: 'compact_bone',
    resolutionTier: 'procedural_fallback',
    compression: 'none',
    licenseId: 'human-atlas-engine',
    reviewStatus: 'automated_check_passed',
    notes:
      'Honest PBR material fallback (per-tissue natural albedo + calibrated roughness/metalness). No AI-fabricated or unverified medical texture photographs are bundled.',
  },
];

// ---------------------------------------------------------------------------
// Source-Independent Structure Identity Record Builder
// ---------------------------------------------------------------------------

export interface StructureRegistryEntry {
  internalId: string;
  fmaId: string;
  canonicalName: string;
  laterality: 'left' | 'right' | 'bilateral' | 'midline';
  system: Part['system'];
  tissueType: TissueType;
  atlasSourceId: string;
  sourcePartId: string;
  triangleCount: number;
  preservationTier: GeometryPreservationTier;
  licenseId: string;
}

export function inferLaterality(name: string): StructureRegistryEntry['laterality'] {
  const n = name.toLowerCase();
  if (/\bleft\b/.test(n)) return 'left';
  if (/\bright\b/.test(n)) return 'right';
  if (/\bbilateral\b|\bpaired\b/.test(n)) return 'bilateral';
  return 'midline';
}

export function buildStructureRegistrySample(atlas: Atlas, limit = 50): StructureRegistryEntry[] {
  return atlas.parts.slice(0, limit).map((p) => ({
    internalId: `a360:${p.conceptId}:${p.id}`,
    fmaId: p.conceptId,
    canonicalName: p.name,
    laterality: inferLaterality(p.name),
    system: p.system,
    tissueType: classifyPartTissue(p),
    atlasSourceId: 'bp3d-male-4.0',
    sourcePartId: p.id,
    triangleCount: Math.round(p.indexCount / 3),
    preservationTier: evaluatePartGeometryPolicy(p).tier,
    licenseId: 'bp3d-4.0',
  }));
}

export function validateLicenseRegistry(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const lic of LICENSE_REGISTRY) {
    if (!lic.id.trim()) errors.push('License entry missing id');
    if (seen.has(lic.id)) errors.push(`Duplicate license id: ${lic.id}`);
    seen.add(lic.id);
    if (!/^https:\/\//i.test(lic.officialSourceUrl)) {
      errors.push(`License ${lic.id}: officialSourceUrl must use HTTPS`);
    }
    if (lic.bundledInPublicBuild && !lic.redistributionAllowed) {
      errors.push(`License ${lic.id}: bundled in public build despite redistributionAllowed=false`);
    }
    if (lic.integrationStatus === 'benchmark_only' && lic.bundledInPublicBuild) {
      errors.push(`License ${lic.id}: benchmark_only dataset must never be bundled`);
    }
    if (!lic.attributionText.trim()) {
      errors.push(`License ${lic.id}: missing attributionText`);
    }
  }
  return { valid: errors.length === 0, errors };
}
