import type { Atlas, Concept, Part } from '../anatomy';
import { CANONICAL_SYSTEMS, canonicalSystemForMeshSystem, type CanonicalSystemId } from '../anatomy-systems';
import {
  FEMALE_REPLACED_MALE_PART_SET,
  LAYER_BUNDLE_PROVENANCE,
  type ActiveLayerBundle,
  type OverlayManifest,
} from '../atlas-layers';

export type GeometryCoverageTier =
  | 'real_individual_meshes'
  | 'partial_mesh_coverage'
  | 'male_reference_only'
  | 'surface_reference_only';

export type CoverageStatus =
  | 'PRESENT_IN_MALE'
  | 'PRESENT_IN_FEMALE'
  | 'PRESENT_SHARED'
  | 'PRESENT_SEX_SPECIFIC_GEOMETRY'
  | 'PRESENT_BUT_MERGED'
  | 'PRESENT_BUT_APPROXIMATED'
  | 'CONCEPT_ONLY_NO_GEOMETRY'
  | 'MISSING_GEOMETRY'
  | 'SOURCE_AVAILABLE_NOT_IMPORTED'
  | 'LICENSE_BLOCKED'
  | 'OUT_OF_SCOPE';

export type FemaleAdaptationStatus =
  | 'genuinely_shared'
  | 'sex_specific'
  | 'reused_from_male_unadapted'
  | 'optional_layer'
  | 'not_applicable';

export interface CanonicalAnatomyInventoryItem {
  id: string;
  canonicalName: string;
  synonyms: string[];
  fmaId: string;
  ta2Term: string;
  uberonId: string;
  canonicalSystem: CanonicalSystemId;
  region:
    | 'head_neck'
    | 'thorax'
    | 'abdomen'
    | 'pelvis_perineum'
    | 'upper_limb'
    | 'lower_limb'
    | 'breast_mammary'
    | 'systemic'
    | 'optional_advanced';
  laterality: 'left' | 'right' | 'bilateral' | 'midline';
  parentStructure: string;
  subdivisions: string[];
  maleStatus: CoverageStatus;
  femaleStatus: CoverageStatus;
  femaleAdaptation: FemaleAdaptationStatus;
  maleMeshIds: string[];
  femaleMeshIds: string[];
  /** Number of target sub-meshes required at adult gross-anatomy educational resolution if gap is filled (0 if not needed in default atlas or already satisfied). */
  targetGapAdditionMale: number;
  targetGapAdditionFemale: number;
  geometrySource: string;
  assetLicense: string;
  geometryQuality: 'verified_medical_reference' | 'high_detail_optimized' | 'procedural_approximation' | 'missing' | 'optional_layer';
  validationStatus: 'source_reviewed' | 'automated_check_passed' | 'unmodeled_gap' | 'license_blocked' | 'optional_off_by_default';
  priority: 'critical' | 'high' | 'medium' | 'low' | 'optional';
  recommendedSource: string;
  notes: string;
}

export interface SystemCoverageRow {
  systemId: CanonicalSystemId;
  name: string;
  meshCount: number;
  uniqueConceptCount: number;
  bilateralPairedCount: number;
  totalTriangles: number;
  geometryStatus: GeometryCoverageTier;
  honestLimitationNote: string;
}

export interface MultiLayerSystemCoverageRow {
  systemId: CanonicalSystemId;
  name: string;
  maleExisting: number;
  femaleExisting: number;
  sharedVerifiedCount: number;
  reusedUnadaptedCount: number;
  maleSpecificCount: number;
  femaleSpecificCount: number;
  optionalPregnancyCount: number;
  maleMissingGap: number;
  femaleMissingGap: number;
  maleTarget: number;
  femaleTarget: number;
  maleMeshCoveragePct: number;
  femaleMeshCoveragePct: number;
  maleActiveConceptCount: number;
  femaleActiveConceptCount: number;
  maleConceptTarget: number;
  femaleConceptTarget: number;
  maleConceptCoveragePct: number;
  femaleConceptCoveragePct: number;
  honestLimitationNote: string;
}

export interface ModelCoverageSummary {
  originalMaleBaseMeshes: number;
  originalMaleManifestConcepts: number;
  originalMaleUniquePartConcepts: number;
  sharedEnhancementMeshes: number;
  maleEnhancementMeshes: number;
  femaleOverlayMeshes: number;
  femaleHubmapMeshes: number;
  femaleProceduralMeshes: number;
  replacedMalePartsInFemale: number;
  optionalPregnancyMeshes: number;
  totalDistinctBundledMeshes: number;
  maleActiveMeshes: number;
  femaleActiveMeshes: number;
  sharedActiveMeshes: number;
  genuinelySharedVerifiedMeshes: number;
  reusedFromMaleUnadaptedInFemale: number;
  maleSpecificActiveMeshes: number;
  femaleSpecificActiveMeshes: number;
  maleMissingRequiredMeshes: number;
  femaleMissingRequiredMeshes: number;
  presentButMergedEntries: number;
  approximateProceduralMeshes: number;
  conceptOnlyFmaGroupingEntries: number;
  conceptOnlyUnmeshedInventoryEntries: number;
  licenseBlockedEntries: number;
  maleTargetMeshes: number;
  femaleTargetMeshes: number;
  maleMeshCoveragePct: number;
  femaleMeshCoveragePct: number;
  maleActivePartConcepts: number;
  femaleActivePartConcepts: number;
  maleConceptCoveragePct: number;
  femaleConceptCoveragePct: number;
  systems: MultiLayerSystemCoverageRow[];
}

export const COVERAGE_STATUS_LABELS: Record<CoverageStatus, string> = {
  PRESENT_IN_MALE: 'Present in Male Reference',
  PRESENT_IN_FEMALE: 'Present in Female Reference',
  PRESENT_SHARED: 'Present (Shared Asset)',
  PRESENT_SEX_SPECIFIC_GEOMETRY: 'Present (Sex-Specific Geometry)',
  PRESENT_BUT_MERGED: 'Present but Merged / Undivided',
  PRESENT_BUT_APPROXIMATED: 'Present (Approximated / Procedural)',
  CONCEPT_ONLY_NO_GEOMETRY: 'Concept Only (No 3D Mesh)',
  MISSING_GEOMETRY: 'Missing 3D Geometry',
  SOURCE_AVAILABLE_NOT_IMPORTED: 'Licensed Source Available (Not Imported)',
  LICENSE_BLOCKED: 'License Blocked for Core Bundle (CC BY-SA / Proprietary)',
  OUT_OF_SCOPE: 'Out of Default Scope (Optional Layer)',
};

const SYSTEM_LIMITATIONS: Record<CanonicalSystemId, { status: GeometryCoverageTier; note: string }> = {
  skeletal: {
    status: 'real_individual_meshes',
    note: 'Male: 343 meshes (336 BP3D skeletal+connective + 6 HS_* hepatic ligaments + HM_COCCYX). Female: 347 meshes (replaces FJ3152/FJ3288/FJ3393 with 8 HuBMAP Female pelvis/sacrum/coccyx + 6 HS_* hepatic ligaments + BP3D cranium/spine/ribs/limbs). Skull, ribs, and limb bones in Female mode remain unadapted BP3D male-donor geometry; micro-foramina and articular bursae are unmodeled.',
  },
  muscular: {
    status: 'partial_mesh_coverage',
    note: '402 BP3D skeletal muscles shared across Male and Female (no female thoracic/pelvic-floor adaptation yet). Deep transverse perineal muscle, bulbospongiosus, ischiocavernosus, external urethral sphincter, and deformable soft-tissue rigs are absent.',
  },
  nervous: {
    status: 'partial_mesh_coverage',
    note: '169 meshes (139 BP3D CNS/peripheral + 30 HS_SPINAL_C1..S5 segments). Missing: cranial meninges (dura/falx cerebri exists, pia & arachnoid absent), autonomic pelvic/hypogastric plexuses, pudendal nerve branches, and female pelvic innervation.',
  },
  cardiovascular: {
    status: 'real_individual_meshes',
    note: 'Male: 1,070 meshes (1,066 BP3D + 4 HM_* rectal veins). Female: 1,055 meshes (replaces 28 male-specific penile/testicular/pelvic vessels with 17 HuBMAP HRA female uterine, common/internal iliac, internal pudendal & rectal vessels). Fine microvascular beds and ovarian/clitoral arterial micro-branches remain absent.',
  },
  respiratory: {
    status: 'real_individual_meshes',
    note: '119 BP3D meshes (larynx, trachea, main/lobar bronchi, lung segments). Separate visceral/parietal pleura serous membranes and alveoli remain absent or conceptual; female thoracic cage proportion is inherited from BP3D.',
  },
  digestive: {
    status: 'real_individual_meshes',
    note: '98 meshes (97 BP3D GI tract & accessory glands + HS_PORTA_HEPATIS). Greater/lesser omenta, mesocolon sheets, and peritoneal pouches outside the vesicouterine fold remain conceptual or merged.',
  },
  urinary: {
    status: 'partial_mesh_coverage',
    note: 'Male: 16 meshes (6 BP3D + 8 HS_* intrarenal + HM_BLADDER_TRIGONE/NECK). Female: 19 meshes (replaces FJ3148/FJ3149 with 6 HuBMAP Female bladder/ureteric-orifice parts + HF_URETHRA, plus 8 HS_* intrarenal & 4 BP3D kidneys/ureters). Urethral sphincters and microscopic nephrons remain absent.',
  },
  reproductive: {
    status: 'partial_mesh_coverage',
    note: 'Male: 25 meshes (12 BP3D external/internal + 13 HM_* prostate zones/ducts/ejaculatory ducts; bulbourethral glands & pampiniform plexus absent). Female: 58 HF_* reproductive meshes (HuBMAP pelvis/ovaries/tubes/uterus/vagina/ligaments + mammary glands + 6 procedural vulvar/endometrial reconstructions); internal follicular/vaginal wall layers & female pelvic lymphatics remain absent.',
  },
  endocrine: {
    status: 'partial_mesh_coverage',
    note: 'CRITICAL GAP: Only 4 meshes exist in both sexes (pineal body, pituitary gland, left/right adrenal glands). Thyroid gland (isthmus & lobes) and all 4 parathyroid glands have ZERO standalone 3D meshes (FJ2808 is thyroid cartilage).',
  },
  lymphatic: {
    status: 'partial_mesh_coverage',
    note: '5 meshes (spleen, left/right thymus lobes + HS_PALATINE_TONSIL_L/R). CRITICAL GAP: Thoracic duct, right lymphatic duct, cisterna chyli, and cervical/axillary/mediastinal/pelvic/inguinal lymph node chains are missing.',
  },
  integumentary: {
    status: 'surface_reference_only',
    note: 'Male: 5 BP3D surface meshes (skin envelope, eyebrow, scalp hair, lip, pubic hair). Female adds HF_LABIA_MAJORA and HF_MONS_PUBIS (7 total). Epidermal/dermal histological layers and skin appendages belong to the Histology curriculum.',
  },
  sensory: {
    status: 'partial_mesh_coverage',
    note: '45 BP3D entries assigned to sensory (eye globe/cornea/iris/lens/retina/lacrimal apparatus + external ear + 6 misbucketed wrist/bone/choroid parts). CRITICAL GAP: Tympanic membrane, auditory ossicles (malleus/incus/stapes), cochlea, and semicircular canals are missing.',
  },
};

/**
 * Canonical gross-anatomy audit entries covering:
 *  - Every enhancement & sex-specific domain (Male & Female)
 *  - Every verified missing, merged, approximated, concept-only, or license-blocked structure
 *    across all 12 systems and Optional Advanced Layers.
 */
export const CANONICAL_GROSS_ANATOMY_INVENTORY: CanonicalAnatomyInventoryItem[] = [
  // =========================================================================
  // 1. SHARED SYSTEMIC GAPS (BOTH MALE & FEMALE)
  // =========================================================================
  {
    id: 'gap-endo-thyroid-gland',
    canonicalName: 'Thyroid gland (left lobe, right lobe, isthmus)',
    synonyms: ['Glandula thyroidea', 'Thyroid'],
    fmaId: 'FMA9603',
    ta2Term: 'Thyroid gland (Glandula thyroidea)',
    uberonId: 'UBERON:0002046',
    canonicalSystem: 'endocrine',
    region: 'head_neck',
    laterality: 'midline',
    parentStructure: 'Endocrine system',
    subdivisions: ['Right lobe of thyroid', 'Left lobe of thyroid', 'Isthmus of thyroid'],
    maleStatus: 'MISSING_GEOMETRY',
    femaleStatus: 'MISSING_GEOMETRY',
    femaleAdaptation: 'genuinely_shared',
    maleMeshIds: [],
    femaleMeshIds: [],
    targetGapAdditionMale: 3,
    targetGapAdditionFemale: 3,
    geometrySource: 'None bundled (FJ2808 is thyroid cartilage; FJ2209/FJ2210 are inferior thyroid arteries)',
    assetLicense: 'Pending CC BY 4.0 / MIT',
    geometryQuality: 'missing',
    validationStatus: 'unmodeled_gap',
    priority: 'critical',
    recommendedSource: 'BodyParts3D 4.0 full archive check / original anatomical modeling (CC BY 4.0) or Z-Anatomy isolated CC BY-SA pack',
    notes: 'Major gross-anatomy omission: thyroid gland itself is absent from bundled BP3D 4.0 parts.',
  },
  {
    id: 'gap-endo-parathyroid-glands',
    canonicalName: 'Parathyroid glands (superior & inferior, left & right)',
    synonyms: ['Glandulae parathyroideae'],
    fmaId: 'FMA13890',
    ta2Term: 'Parathyroid glands (Glandulae parathyroideae)',
    uberonId: 'UBERON:0001132',
    canonicalSystem: 'endocrine',
    region: 'head_neck',
    laterality: 'bilateral',
    parentStructure: 'Endocrine system',
    subdivisions: ['Left superior', 'Left inferior', 'Right superior', 'Right inferior'],
    maleStatus: 'MISSING_GEOMETRY',
    femaleStatus: 'MISSING_GEOMETRY',
    femaleAdaptation: 'genuinely_shared',
    maleMeshIds: [],
    femaleMeshIds: [],
    targetGapAdditionMale: 4,
    targetGapAdditionFemale: 4,
    geometrySource: 'None bundled',
    assetLicense: 'Pending CC BY 4.0 / MIT',
    geometryQuality: 'missing',
    validationStatus: 'unmodeled_gap',
    priority: 'high',
    recommendedSource: 'Original anatomical modeling anchored posterior to thyroid lobes (CC BY 4.0)',
    notes: 'Requires thyroid gland first for accurate posterior cervical placement.',
  },
  {
    id: 'gap-sens-middle-ear-ossicles',
    canonicalName: 'Middle ear cavity, tympanic membrane & auditory ossicles (malleus, incus, stapes)',
    synonyms: ['Ossicula auditus', 'Ear ossicles', 'Eardrum'],
    fmaId: 'FMA52750',
    ta2Term: 'Auditory ossicles & tympanic membrane',
    uberonId: 'UBERON:0001686',
    canonicalSystem: 'sensory',
    region: 'head_neck',
    laterality: 'bilateral',
    parentStructure: 'Middle ear',
    subdivisions: ['L/R tympanic membrane', 'L/R malleus', 'L/R incus', 'L/R stapes'],
    maleStatus: 'MISSING_GEOMETRY',
    femaleStatus: 'MISSING_GEOMETRY',
    femaleAdaptation: 'genuinely_shared',
    maleMeshIds: [],
    femaleMeshIds: [],
    targetGapAdditionMale: 8,
    targetGapAdditionFemale: 8,
    geometrySource: 'None bundled (only FJ2811 external ear auricle exists)',
    assetLicense: 'Pending CC BY 4.0 / isolated CC BY-SA review',
    geometryQuality: 'missing',
    validationStatus: 'unmodeled_gap',
    priority: 'critical',
    recommendedSource: 'Open3DModel / isolated Z-Anatomy check (verify CC BY-SA 4.0 & non-NC upstream) or original high-res ossicle modeling',
    notes: 'Essential head & neck sensory anatomy missing in both Male and Female.',
  },
  {
    id: 'gap-sens-inner-ear-labyrinth',
    canonicalName: 'Inner ear osseous & membranous labyrinth (cochlea, vestibule, semicircular canals)',
    synonyms: ['Labyrinthus osseus', 'Cochlea'],
    fmaId: 'FMA60201',
    ta2Term: 'Internal ear (Auris interna)',
    uberonId: 'UBERON:0001846',
    canonicalSystem: 'sensory',
    region: 'head_neck',
    laterality: 'bilateral',
    parentStructure: 'Internal ear',
    subdivisions: ['L/R cochlea', 'L/R vestibular apparatus & semicircular canals'],
    maleStatus: 'MISSING_GEOMETRY',
    femaleStatus: 'MISSING_GEOMETRY',
    femaleAdaptation: 'genuinely_shared',
    maleMeshIds: [],
    femaleMeshIds: [],
    targetGapAdditionMale: 4,
    targetGapAdditionFemale: 4,
    geometrySource: 'None bundled',
    assetLicense: 'Pending CC BY 4.0',
    geometryQuality: 'missing',
    validationStatus: 'unmodeled_gap',
    priority: 'high',
    recommendedSource: 'Original medical-reference modeling inside petrous temporal bone (CC BY 4.0)',
    notes: 'Paired with CN VIII vestibulocochlear root inside internal acoustic meatus.',
  },
  {
    id: 'gap-nerv-cranial-meninges',
    canonicalName: 'Cranial meninges (dura mater, falx cerebri, arachnoid mater, pia mater)',
    synonyms: ['Meninges encephali', 'Dura mater'],
    fmaId: 'FMA9592',
    ta2Term: 'Cranial meninges',
    uberonId: 'UBERON:0002360',
    canonicalSystem: 'nervous',
    region: 'head_neck',
    laterality: 'midline',
    parentStructure: 'Central nervous system coverings',
    subdivisions: ['Falx cerebri', 'Periosteal/meningeal cranial dura', 'Arachnoid & pia mater'],
    maleStatus: 'PRESENT_BUT_MERGED',
    femaleStatus: 'PRESENT_BUT_MERGED',
    femaleAdaptation: 'genuinely_shared',
    maleMeshIds: ['FJ1843'],
    femaleMeshIds: ['FJ1843'],
    targetGapAdditionMale: 3,
    targetGapAdditionFemale: 3,
    geometrySource: 'BodyParts3D 4.0 (FJ1843 Tentorium cerebelli only; falx/dura/arachnoid/pia missing)',
    assetLicense: 'CC BY 4.0 (partial) / Pending',
    geometryQuality: 'high_detail_optimized',
    validationStatus: 'unmodeled_gap',
    priority: 'high',
    recommendedSource: 'Original anatomical modeling around BP3D brain & cranial vault',
    notes: 'Only tentorium cerebelli (FJ1843) is bundled; falx cerebri, dural sac, arachnoid, and pia mater remain missing.',
  },
  {
    id: 'gap-nerv-spinal-cord-segments',
    canonicalName: 'Spinal cord segmental divisions (C1–S5, 30 segments)',
    synonyms: ['Medulla spinalis'],
    fmaId: 'FMA7647',
    ta2Term: 'Spinal cord (Medulla spinalis)',
    uberonId: 'UBERON:0002240',
    canonicalSystem: 'nervous',
    region: 'systemic',
    laterality: 'midline',
    parentStructure: 'Central nervous system',
    subdivisions: ['C1–C8 cervical', 'T1–T12 thoracic', 'L1–L5 lumbar', 'S1–S5 sacral'],
    maleStatus: 'PRESENT_SHARED',
    femaleStatus: 'PRESENT_SHARED',
    femaleAdaptation: 'genuinely_shared',
    maleMeshIds: ['HS_SPINAL_C1', 'HS_SPINAL_C2', 'HS_SPINAL_S5'],
    femaleMeshIds: ['HS_SPINAL_C1', 'HS_SPINAL_C2', 'HS_SPINAL_S5'],
    targetGapAdditionMale: 0,
    targetGapAdditionFemale: 0,
    geometrySource: 'HuBMAP HRA v1.1 Visible Human Male Spinal Cord (30 HS_SPINAL_* meshes)',
    assetLicense: 'CC BY 4.0',
    geometryQuality: 'verified_medical_reference',
    validationStatus: 'source_reviewed',
    priority: 'medium',
    recommendedSource: 'Bundled in shared-enhancements.json',
    notes: 'Integrated across C1–S5 (30 meshes). Coccygeal spinal cord segment Co1 and filum terminale remain absent.',
  },
  {
    id: 'gap-nerv-spinal-meninges-cauda',
    canonicalName: 'Spinal meninges, cauda equina & autonomic sympathetic/pelvic plexuses',
    synonyms: ['Cauda equina', 'Hypogastric plexus'],
    fmaId: 'FMA6237',
    ta2Term: 'Spinal meninges & autonomic plexuses',
    uberonId: 'UBERON:0002010',
    canonicalSystem: 'nervous',
    region: 'pelvis_perineum',
    laterality: 'midline',
    parentStructure: 'Peripheral & autonomic nervous system',
    subdivisions: ['Spinal dural sac', 'Superior/inferior hypogastric plexus', 'Sympathetic chain ganglia refinement'],
    maleStatus: 'MISSING_GEOMETRY',
    femaleStatus: 'MISSING_GEOMETRY',
    femaleAdaptation: 'reused_from_male_unadapted',
    maleMeshIds: [],
    femaleMeshIds: [],
    targetGapAdditionMale: 4,
    targetGapAdditionFemale: 4,
    geometrySource: 'None bundled',
    assetLicense: 'Pending CC BY 4.0',
    geometryQuality: 'missing',
    validationStatus: 'unmodeled_gap',
    priority: 'high',
    recommendedSource: 'Original anatomical modeling or isolated Z-Anatomy CC BY-SA 4.0 audit',
    notes: 'Major autonomic innervation gap for thorax, abdomen, and pelvic viscera.',
  },
  {
    id: 'gap-lymph-thoracic-duct-nodes',
    canonicalName: 'Thoracic duct, cisterna chyli, right lymphatic duct & regional lymph node chains',
    synonyms: ['Ductus thoracicus', 'Lymph nodes'],
    fmaId: 'FMA5031',
    ta2Term: 'Thoracic duct & regional lymph nodes',
    uberonId: 'UBERON:0001631',
    canonicalSystem: 'lymphatic',
    region: 'systemic',
    laterality: 'bilateral',
    parentStructure: 'Lymphatic system',
    subdivisions: ['Cisterna chyli', 'Thoracic duct', 'Cervical nodes', 'Axillary nodes', 'Mediastinal nodes', 'Para-aortic/iliac nodes', 'Inguinal nodes'],
    maleStatus: 'SOURCE_AVAILABLE_NOT_IMPORTED',
    femaleStatus: 'SOURCE_AVAILABLE_NOT_IMPORTED',
    femaleAdaptation: 'genuinely_shared',
    maleMeshIds: [],
    femaleMeshIds: [],
    targetGapAdditionMale: 12,
    targetGapAdditionFemale: 12,
    geometrySource: 'Only spleen (FJ2561), thymus lobes (FJ3150/1), and HS_PALATINE_TONSIL_L/R are bundled',
    assetLicense: 'HuBMAP HRA Lymph Node GLB available under CC BY 4.0',
    geometryQuality: 'missing',
    validationStatus: 'unmodeled_gap',
    priority: 'critical',
    recommendedSource: 'HuBMAP HRA 3D Reference Library Lymph Node / Open anatomical modeling of thoracic duct & nodal stations',
    notes: 'Largest systemic gap in the current atlas: entire lymphatic vascular tree and regional node basins are absent.',
  },
  {
    id: 'gap-skel-articular-bursae-menisci',
    canonicalName: 'Major synovial joints, articular capsules & knee/shoulder menisci-bursae details',
    synonyms: ['Synovial bursa', 'Joint capsules'],
    fmaId: 'FMA7490',
    ta2Term: 'Articular system (Systema articulare)',
    uberonId: 'UBERON:0000982',
    canonicalSystem: 'skeletal',
    region: 'systemic',
    laterality: 'bilateral',
    parentStructure: 'Articular system',
    subdivisions: ['Subacromial/subdeltoid bursa', 'Prepatellar/infrapatellar bursae', 'Acetabular labrum & glenohumeral labrum'],
    maleStatus: 'PRESENT_BUT_MERGED',
    femaleStatus: 'PRESENT_BUT_MERGED',
    femaleAdaptation: 'reused_from_male_unadapted',
    maleMeshIds: ['FJ1465', 'FJ1465M'],
    femaleMeshIds: ['FJ1465', 'FJ1465M'],
    targetGapAdditionMale: 8,
    targetGapAdditionFemale: 8,
    geometrySource: 'BodyParts3D 4.0 contains 40 connective/ligament parts; fine bursae/labra absent',
    assetLicense: 'Pending CC BY 4.0',
    geometryQuality: 'high_detail_optimized',
    validationStatus: 'unmodeled_gap',
    priority: 'medium',
    recommendedSource: 'Open3DModel / AnatomyTOOL regional limb packs (verify CC BY-SA 4.0 boundaries)',
    notes: 'Major knee menisci & major ligaments exist in BP3D, while bursae and labra are absent.',
  },
  {
    id: 'gap-cv-heart-valves-microcoronary',
    canonicalName: 'Cardiac valves, papillary muscles, conduction system & distal coronary branches',
    synonyms: ['Valvae cordis', 'SA node', 'AV node'],
    fmaId: 'FMA7110',
    ta2Term: 'Cardiac valves & conducting system',
    uberonId: 'UBERON:0000946',
    canonicalSystem: 'cardiovascular',
    region: 'thorax',
    laterality: 'midline',
    parentStructure: 'Heart',
    subdivisions: ['Mitral/tricuspid/aortic/pulmonary valves (4)', 'Conduction nodes & bundle branches (3)'],
    maleStatus: 'PRESENT_BUT_MERGED',
    femaleStatus: 'PRESENT_BUT_MERGED',
    femaleAdaptation: 'genuinely_shared',
    maleMeshIds: [],
    femaleMeshIds: [],
    targetGapAdditionMale: 7,
    targetGapAdditionFemale: 7,
    geometrySource: 'BP3D cardiac group has 23 chambers/wall parts; internal valve leaflets and electrical nodes not separately meshed',
    assetLicense: 'CC BY 4.0 / Pending',
    geometryQuality: 'high_detail_optimized',
    validationStatus: 'unmodeled_gap',
    priority: 'medium',
    recommendedSource: 'HuBMAP HRA Heart reference valves/chambers comparison or detailed cardiac valve sub-modeling',
    notes: '23 BP3D cardiac structures exist, but individual valve cusps and SA/AV conduction system lack dedicated geometry.',
  },
  {
    id: 'gap-resp-pleura-serous',
    canonicalName: 'Visceral and parietal pleurae (left & right pleural cavities)',
    synonyms: ['Pleura parietalis', 'Pleura visceralis'],
    fmaId: 'FMA9583',
    ta2Term: 'Pleura',
    uberonId: 'UBERON:0000977',
    canonicalSystem: 'respiratory',
    region: 'thorax',
    laterality: 'bilateral',
    parentStructure: 'Thoracic serous membranes',
    subdivisions: ['Left/right parietal pleura', 'Left/right visceral pleura'],
    maleStatus: 'CONCEPT_ONLY_NO_GEOMETRY',
    femaleStatus: 'CONCEPT_ONLY_NO_GEOMETRY',
    femaleAdaptation: 'reused_from_male_unadapted',
    maleMeshIds: [],
    femaleMeshIds: [],
    targetGapAdditionMale: 2,
    targetGapAdditionFemale: 2,
    geometrySource: 'Conceptual only (lung lobes FJ* present)',
    assetLicense: 'Pending CC BY 4.0',
    geometryQuality: 'missing',
    validationStatus: 'unmodeled_gap',
    priority: 'low',
    recommendedSource: 'Translucent offset pleural membranes around BP3D lungs (CC BY 4.0)',
    notes: 'Important for clinical pneumothorax/pleural effusion teaching.',
  },
  {
    id: 'gap-dig-peritoneum-mesentery-omenta',
    canonicalName: 'Greater omentum, lesser omentum & transverse/sigmoid mesocolon',
    synonyms: ['Omentum majus', 'Omentum minus'],
    fmaId: 'FMA14668',
    ta2Term: 'Peritoneal folds & omenta',
    uberonId: 'UBERON:0005448',
    canonicalSystem: 'digestive',
    region: 'abdomen',
    laterality: 'midline',
    parentStructure: 'Peritoneum',
    subdivisions: ['Greater omentum', 'Lesser omentum', 'Transverse mesocolon'],
    maleStatus: 'PRESENT_BUT_MERGED',
    femaleStatus: 'PRESENT_BUT_MERGED',
    femaleAdaptation: 'genuinely_shared',
    maleMeshIds: ['FJ3396', 'HS_HEPATODUODENAL_LIG'],
    femaleMeshIds: ['FJ3396', 'HS_HEPATODUODENAL_LIG'],
    targetGapAdditionMale: 3,
    targetGapAdditionFemale: 3,
    geometrySource: 'FJ3396 (mesentery of small intestine) + HS_* hepatic ligaments present; greater/lesser omenta absent',
    assetLicense: 'Pending CC BY 4.0',
    geometryQuality: 'high_detail_optimized',
    validationStatus: 'unmodeled_gap',
    priority: 'low',
    recommendedSource: 'Translucent peritoneal sheet modeling (CC BY 4.0)',
    notes: 'Hepatic ligaments & porta hepatis (7 HS_* parts) were added via HuBMAP HRA Liver v1.2.',
  },

  // =========================================================================
  // 2. FEMALE-SPECIFIC ANATOMY & SEX-ADAPTED GAPS (SECTION 4B)
  // =========================================================================
  {
    id: 'fem-skel-pelvic-ring',
    canonicalName: 'Female bony pelvis (sacrum, coccyx, bilateral ilium, ischium, pubis)',
    synonyms: ['Female os coxae', 'Female pelvic girdle'],
    fmaId: 'FMA16586',
    ta2Term: 'Female pelvic girdle (Cingulum pelvicum)',
    uberonId: 'UBERON:0001271',
    canonicalSystem: 'skeletal',
    region: 'pelvis_perineum',
    laterality: 'bilateral',
    parentStructure: 'Pelvic skeleton',
    subdivisions: ['HF_SACRUM', 'HF_COCCYX', 'HF_ILIUM_LEFT/RIGHT', 'HF_ISCHIUM_LEFT/RIGHT', 'HF_PUBIS_LEFT/RIGHT'],
    maleStatus: 'PRESENT_SEX_SPECIFIC_GEOMETRY',
    femaleStatus: 'PRESENT_SEX_SPECIFIC_GEOMETRY',
    femaleAdaptation: 'sex_specific',
    maleMeshIds: ['FJ3152', 'FJ3288', 'FJ3393', 'HM_COCCYX'],
    femaleMeshIds: ['HF_SACRUM', 'HF_COCCYX', 'HF_ILIUM_LEFT', 'HF_ILIUM_RIGHT', 'HF_ISCHIUM_LEFT', 'HF_ISCHIUM_RIGHT', 'HF_PUBIS_LEFT', 'HF_PUBIS_RIGHT'],
    targetGapAdditionMale: 0,
    targetGapAdditionFemale: 0,
    geometrySource: 'HuBMAP HRA v1.5 Visible Human Female (DOI: 10.48539/HBM352.BTSQ.586) / Male BP3D + HM_COCCYX',
    assetLicense: 'CC BY 4.0',
    geometryQuality: 'verified_medical_reference',
    validationStatus: 'source_reviewed',
    priority: 'high',
    recommendedSource: 'Bundled in female-atlas.json',
    notes: 'Replaces male FJ3152/FJ3288/FJ3393 with 8 wider-subpubic-angle female pelvic bones.',
  },
  {
    id: 'gap-fem-skel-nonpelvic-unadapted',
    canonicalName: 'Extra-pelvic skeleton & thoracic cage female dimorphism (ribcage, clavicle, mandible, femur)',
    synonyms: ['Female thorax', 'Female skull morphology'],
    fmaId: 'FMA23881',
    ta2Term: 'Axial & appendicular skeleton (female morphology)',
    uberonId: 'UBERON:0001434',
    canonicalSystem: 'skeletal',
    region: 'systemic',
    laterality: 'midline',
    parentStructure: 'Skeletal system',
    subdivisions: ['Female ribcage/sternum', 'Female craniofacial variants', 'Female femoral/humeral carrying-angle proportions'],
    maleStatus: 'PRESENT_IN_MALE',
    femaleStatus: 'CONCEPT_ONLY_NO_GEOMETRY',
    femaleAdaptation: 'reused_from_male_unadapted',
    maleMeshIds: [],
    femaleMeshIds: [],
    targetGapAdditionMale: 0,
    targetGapAdditionFemale: 12,
    geometrySource: 'Female mode reuses BP3D male thorax/cranium/limb bones (2,189 base meshes inherited)',
    assetLicense: 'CC BY 4.0 (male reference reused)',
    geometryQuality: 'missing',
    validationStatus: 'unmodeled_gap',
    priority: 'medium',
    recommendedSource: 'HuBMAP HRA Visible Human Female ribcage/vertebrae or NLM Visible Human Female CT segmentation',
    notes: 'Explicitly disclosed: only the pelvic girdle has true female skeletal geometry; ribs, skull, and long bones reuse adult male BP3D meshes.',
  },
  {
    id: 'gap-fem-pelvic-floor-muscles',
    canonicalName: 'Female pelvic floor (pubococcygeus, puborectalis, iliococcygeus, coccygeus) & deep perineal muscles',
    synonyms: ['Diaphragma pelvis female', 'Levator ani female', 'Perineal body'],
    fmaId: 'FMA19087',
    ta2Term: 'Pelvic diaphragm & perineal musculature (female)',
    uberonId: 'UBERON:0001351',
    canonicalSystem: 'muscular',
    region: 'pelvis_perineum',
    laterality: 'bilateral',
    parentStructure: 'Pelvic floor & perineum',
    subdivisions: ['Female L/R levator ani', 'Female L/R bulbospongiosus', 'Female L/R ischiocavernosus', 'Superficial/deep transverse perineal', 'External urethral sphincter', 'Perineal body'],
    maleStatus: 'PRESENT_BUT_MERGED',
    femaleStatus: 'MISSING_GEOMETRY',
    femaleAdaptation: 'reused_from_male_unadapted',
    maleMeshIds: ['FJ1450', 'FJ1450M', 'FJ1453M', 'FJ1457M', 'FJ1458M', 'FJ1449M', 'FJ2547', 'FJ2549', 'FJ2550', 'FJ2551'],
    femaleMeshIds: ['FJ1450', 'FJ1450M', 'FJ1453M', 'FJ1457M', 'FJ1458M', 'FJ1449M', 'FJ2547', 'FJ2549', 'FJ2550', 'FJ2551'],
    targetGapAdditionMale: 6,
    targetGapAdditionFemale: 12,
    geometrySource: 'Inherited BP3D male levator ani/coccygeus/anal sphincter; bulbospongiosus, ischiocavernosus, deep perineal & perineal body absent',
    assetLicense: 'Pending CC BY 4.0',
    geometryQuality: 'missing',
    validationStatus: 'unmodeled_gap',
    priority: 'critical',
    recommendedSource: 'HuBMAP Visible Human Female CT/cryosection segmentation or anatomically co-registered pelvic-floor modeling',
    notes: 'CRITICAL GAP: Female mode currently inherits male-pelvis-fitted levator ani meshes and lacks dedicated female perineal body, bulbospongiosus, ischiocavernosus, and urogenital diaphragm.',
  },
  {
    id: 'fem-repro-ovaries-tubes-uterus-vagina',
    canonicalName: 'Female internal reproductive organs (ovaries, uterine tubes, uterus, cervix, vagina)',
    synonyms: ['Uterus', 'Fallopian tubes', 'Ovaries', 'Vagina'],
    fmaId: 'FMA17558',
    ta2Term: 'Internal female genitalia (Organa genitalia feminina interna)',
    uberonId: 'UBERON:0000474',
    canonicalSystem: 'reproductive',
    region: 'pelvis_perineum',
    laterality: 'midline',
    parentStructure: 'Female reproductive system',
    subdivisions: [
      'HF_OVARY_LEFT/RIGHT',
      'HF_TUBE_ISTHMUS/AMPULLA/INFUNDIBULUM/FIMBRIAE_LEFT/RIGHT',
      'HF_UTERUS_FUNDUS/BODY/ANTERIOR_WALL/POSTERIOR_WALL/CORNUA/LOWER_SEGMENT',
      'HF_CERVIX/CERVICAL_OS_INTERNAL/EXTERNAL',
      'HF_VAGINA/CERVICOVAGINAL_JUNCTION',
    ],
    maleStatus: 'OUT_OF_SCOPE',
    femaleStatus: 'PRESENT_SEX_SPECIFIC_GEOMETRY',
    femaleAdaptation: 'sex_specific',
    maleMeshIds: [],
    femaleMeshIds: ['HF_UTERUS_FUNDUS', 'HF_UTERUS_BODY', 'HF_CERVIX', 'HF_VAGINA', 'HF_OVARY_LEFT', 'HF_OVARY_RIGHT', 'HF_TUBE_AMPULLA_LEFT', 'HF_TUBE_FIMBRIAE_LEFT'],
    targetGapAdditionMale: 0,
    targetGapAdditionFemale: 0,
    geometrySource: 'HuBMAP HRA v1.5 Visible Human Female (DOI: 10.48539/HBM352.BTSQ.586) — 23 meshes',
    assetLicense: 'CC BY 4.0',
    geometryQuality: 'verified_medical_reference',
    validationStatus: 'source_reviewed',
    priority: 'high',
    recommendedSource: 'Bundled in female-atlas.json',
    notes: 'Complete primary gross divisions from HuBMAP HRA v1.5.',
  },
  {
    id: 'fem-repro-supporting-ligaments',
    canonicalName: 'Female pelvic supporting ligaments & peritoneal folds (broad, round, ovarian, suspensory, cardinal, uterosacral, vesicouterine)',
    synonyms: ['Broad ligament', 'Uterosacral ligament', 'Cardinal ligament'],
    fmaId: 'FMA19749',
    ta2Term: 'Ligaments of uterus & ovary',
    uberonId: 'UBERON:0006844',
    canonicalSystem: 'reproductive',
    region: 'pelvis_perineum',
    laterality: 'bilateral',
    parentStructure: 'Female pelvic support',
    subdivisions: [
      'HF_BROAD_LIGAMENT',
      'HF_MESOSALPINX_LEFT/RIGHT',
      'HF_MESOVARIUM_LEFT/RIGHT',
      'HF_OVARIAN_LIGAMENT_LEFT/RIGHT',
      'HF_SUSPENSORY_OVARY_LEFT/RIGHT',
      'HF_ROUND_LIGAMENT_LEFT/RIGHT',
      'HF_CARDINAL_LIGAMENT_LEFT/RIGHT',
      'HF_UTEROSACRAL_LIGAMENT_LEFT/RIGHT',
      'HF_UTEROVESICAL_POUCH',
    ],
    maleStatus: 'OUT_OF_SCOPE',
    femaleStatus: 'PRESENT_SEX_SPECIFIC_GEOMETRY',
    femaleAdaptation: 'sex_specific',
    maleMeshIds: [],
    femaleMeshIds: ['HF_BROAD_LIGAMENT', 'HF_ROUND_LIGAMENT_LEFT', 'HF_CARDINAL_LIGAMENT_LEFT', 'HF_UTEROSACRAL_LIGAMENT_LEFT'],
    targetGapAdditionMale: 0,
    targetGapAdditionFemale: 0,
    geometrySource: 'HuBMAP HRA v1.5 Visible Human Female — 16 ligament/peritoneal meshes',
    assetLicense: 'CC BY 4.0',
    geometryQuality: 'verified_medical_reference',
    validationStatus: 'source_reviewed',
    priority: 'high',
    recommendedSource: 'Bundled in female-atlas.json',
    notes: 'Pubocervical ligament & rectouterine (Douglas) pouch discrete meshes remain minor missing subdivisions.',
  },
  {
    id: 'gap-fem-repro-histologic-layers',
    canonicalName: 'Female reproductive micro-layers (endometrium/myometrium/perimetrium split, ovarian cortex/medulla, vaginal rugae & fornices)',
    synonyms: ['Myometrium', 'Perimetrium', 'Ovarian cortex', 'Rectouterine pouch'],
    fmaId: 'FMA17749',
    ta2Term: 'Uterine wall coats & ovarian zones',
    uberonId: 'UBERON:0001296',
    canonicalSystem: 'reproductive',
    region: 'pelvis_perineum',
    laterality: 'midline',
    parentStructure: 'Uterus / Ovary / Vagina',
    subdivisions: ['HF_ENDOMETRIUM (approx.)', 'Separate myometrium vs perimetrium', 'L/R ovarian cortex & medulla', 'Anterior/posterior/lateral vaginal fornices', 'Rectouterine pouch (Douglas)'],
    maleStatus: 'OUT_OF_SCOPE',
    femaleStatus: 'PRESENT_BUT_APPROXIMATED',
    femaleAdaptation: 'sex_specific',
    maleMeshIds: [],
    femaleMeshIds: ['HF_ENDOMETRIUM', 'HF_CERVICOVAGINAL_JUNCTION'],
    targetGapAdditionMale: 0,
    targetGapAdditionFemale: 6,
    geometrySource: 'HF_ENDOMETRIUM is a co-registered procedural reconstruction; myometrium/perimetrium/ovarian cortex-medulla merged in wall meshes',
    assetLicense: 'MIT Procedural / CC BY 4.0',
    geometryQuality: 'procedural_approximation',
    validationStatus: 'unmodeled_gap',
    priority: 'medium',
    recommendedSource: 'Split HuBMAP uterine wall shells or high-resolution anatomical modeling',
    notes: 'HF_ENDOMETRIUM is explicitly flagged as procedural approximation; rectouterine pouch and distinct ovarian cortex/medulla meshes are absent.',
  },
  {
    id: 'fem-repro-external-vulva',
    canonicalName: 'Female external genitalia (mons pubis, labia majora, labia minora, clitoris, vestibular bulbs, Bartholin glands)',
    synonyms: ['Vulva', 'Clitoris', 'Greater vestibular glands'],
    fmaId: 'FMA20000',
    ta2Term: 'External female genitalia (Pudendum femininum)',
    uberonId: 'UBERON:0000997',
    canonicalSystem: 'reproductive',
    region: 'pelvis_perineum',
    laterality: 'midline',
    parentStructure: 'Female external genitalia',
    subdivisions: ['HF_CLITORIS', 'HF_VESTIBULAR_BULBS', 'HF_BARTHOLIN_GLANDS', 'HF_LABIA_MINORA', 'HF_LABIA_MAJORA', 'HF_MONS_PUBIS'],
    maleStatus: 'OUT_OF_SCOPE',
    femaleStatus: 'PRESENT_BUT_APPROXIMATED',
    femaleAdaptation: 'sex_specific',
    maleMeshIds: [],
    femaleMeshIds: ['HF_CLITORIS', 'HF_VESTIBULAR_BULBS', 'HF_BARTHOLIN_GLANDS', 'HF_LABIA_MINORA', 'HF_LABIA_MAJORA', 'HF_MONS_PUBIS'],
    targetGapAdditionMale: 0,
    targetGapAdditionFemale: 4,
    geometrySource: 'Anatomically co-registered procedural reconstructions (6 external vulvar + 1 urethral + 1 endometrial = 8 total procedural HF_* meshes)',
    assetLicense: 'MIT Procedural / CC BY 4.0',
    geometryQuality: 'procedural_approximation',
    validationStatus: 'source_reviewed',
    priority: 'high',
    recommendedSource: 'Replace procedural vulvar reconstructions with NLM Visible Human Female / verified medical sculpt separating clitoral glans/body/crura & Skene glands',
    notes: 'Disclosed honestly as co-registered reconstructions; glans/body/crura of clitoris are currently merged into single HF_CLITORIS mesh.',
  },
  {
    id: 'fem-repro-mammary-gland',
    canonicalName: 'Female mammary glands (lobes, ducts, sinuses, Cooper ligaments, adipose stroma, areola, nipple, Montgomery tubercles)',
    synonyms: ['Breasts', 'Glandula mammaria'],
    fmaId: 'FMA9601',
    ta2Term: 'Female breast (Mamma feminina)',
    uberonId: 'UBERON:0001911',
    canonicalSystem: 'reproductive',
    region: 'breast_mammary',
    laterality: 'bilateral',
    parentStructure: 'Mammary region',
    subdivisions: ['HF_MAMMARY_FAT_L/R', 'HF_MAMMARY_LOBES_L/R', 'HF_LACTIFEROUS_DUCTS_L/R', 'HF_LACTIFEROUS_SINUSES_L/R', 'HF_COOPER_LIGAMENTS_L/R', 'HF_AREOLA_L/R', 'HF_NIPPLE_L/R', 'HF_AREOLAR_TUBERCLES_L/R'],
    maleStatus: 'OUT_OF_SCOPE',
    femaleStatus: 'PRESENT_SEX_SPECIFIC_GEOMETRY',
    femaleAdaptation: 'sex_specific',
    maleMeshIds: [],
    femaleMeshIds: ['HF_MAMMARY_FAT_LEFT', 'HF_MAMMARY_LOBES_LEFT', 'HF_LACTIFEROUS_DUCTS_LEFT', 'HF_NIPPLE_LEFT'],
    targetGapAdditionMale: 0,
    targetGapAdditionFemale: 0,
    geometrySource: 'HuBMAP HRA v1.1 Visible Human Female Mammary Gland (16 meshes)',
    assetLicense: 'CC BY 4.0',
    geometryQuality: 'verified_medical_reference',
    validationStatus: 'source_reviewed',
    priority: 'high',
    recommendedSource: 'Bundled in female-atlas.json',
    notes: 'Axillary tail of Spence and internal thoracic/lateral thoracic mammary arteries & lymphatics remain unmodeled.',
  },
  {
    id: 'fem-urin-bladder-urethra',
    canonicalName: 'Female urinary bladder subdivisions & female urethra',
    synonyms: ['Female bladder', 'Female urethra'],
    fmaId: 'FMA15900',
    ta2Term: 'Female urinary bladder & urethra',
    uberonId: 'UBERON:0001255',
    canonicalSystem: 'urinary',
    region: 'pelvis_perineum',
    laterality: 'midline',
    parentStructure: 'Lower urinary tract (Female)',
    subdivisions: ['HF_BLADDER_DOME', 'HF_BLADDER_BASE', 'HF_BLADDER_TRIGONE', 'HF_BLADDER_NECK', 'HF_URETERAL_ORIFICE_L/R', 'HF_URETHRA (approx.)'],
    maleStatus: 'PRESENT_SEX_SPECIFIC_GEOMETRY',
    femaleStatus: 'PRESENT_SEX_SPECIFIC_GEOMETRY',
    femaleAdaptation: 'sex_specific',
    maleMeshIds: ['FJ3149', 'FJ3148', 'HM_BLADDER_TRIGONE', 'HM_BLADDER_NECK'],
    femaleMeshIds: ['HF_BLADDER_DOME', 'HF_BLADDER_BASE', 'HF_BLADDER_TRIGONE', 'HF_BLADDER_NECK', 'HF_URETERAL_ORIFICE_LEFT', 'HF_URETERAL_ORIFICE_RIGHT', 'HF_URETHRA'],
    targetGapAdditionMale: 0,
    targetGapAdditionFemale: 0,
    geometrySource: 'HuBMAP HRA v1.5 Visible Human Female (6 meshes) + HF_URETHRA procedural conduit',
    assetLicense: 'CC BY 4.0 + MIT Procedural',
    geometryQuality: 'verified_medical_reference',
    validationStatus: 'source_reviewed',
    priority: 'high',
    recommendedSource: 'Bundled in female-atlas.json',
    notes: 'Replaces male FJ3149/FJ3148 cleanly.',
  },
  {
    id: 'fem-cv-pelvic-vasculature',
    canonicalName: 'Female uterine arteries/veins & female-framed iliac/pudendal/rectal pelvic vessels',
    synonyms: ['Uterine artery', 'Female internal iliac vein', 'Female superior rectal artery'],
    fmaId: 'FMA18824',
    ta2Term: 'Female pelvic vasculature',
    uberonId: 'UBERON:0001315',
    canonicalSystem: 'cardiovascular',
    region: 'pelvis_perineum',
    laterality: 'bilateral',
    parentStructure: 'Pelvic arterial & venous trees',
    subdivisions: ['HF_UTERINE_ARTERY_L/R', 'HF_UTERINE_VEIN_L/R', 'HF_COMMON/INTERNAL_ILIAC_VEIN_L/R', 'HF_INTERNAL_PUDENDAL_VEIN_L/R', 'HF_MIDDLE/INFERIOR_RECTAL_VEIN_L/R', 'HF_MEDIAN_SACRAL_VEIN', 'HF_SUPERIOR_RECTAL_A/V'],
    maleStatus: 'PRESENT_SEX_SPECIFIC_GEOMETRY',
    femaleStatus: 'PRESENT_SEX_SPECIFIC_GEOMETRY',
    femaleAdaptation: 'sex_specific',
    maleMeshIds: ['HM_MIDDLE_RECTAL_VEIN_L', 'HM_MIDDLE_RECTAL_VEIN_R', 'HM_INFERIOR_RECTAL_VEIN_L', 'HM_INFERIOR_RECTAL_VEIN_R'],
    femaleMeshIds: ['HF_UTERINE_ARTERY_LEFT', 'HF_UTERINE_ARTERY_RIGHT', 'HF_UTERINE_VEIN_LEFT', 'HF_UTERINE_VEIN_RIGHT', 'HF_COMMON_ILIAC_VEIN_LEFT', 'HF_INTERNAL_ILIAC_VEIN_LEFT'],
    targetGapAdditionMale: 0,
    targetGapAdditionFemale: 0,
    geometrySource: 'HuBMAP HRA v1.5 (4 uterine vessels) + HRA v1.3 Visible Human Female Vasculature (13 pelvic vessels)',
    assetLicense: 'CC BY 4.0',
    geometryQuality: 'verified_medical_reference',
    validationStatus: 'source_reviewed',
    priority: 'high',
    recommendedSource: 'Bundled in female-atlas.json',
    notes: 'Replaces 16 male-framed pelvic/rectal vessels + 12 male penile/testicular vessels.',
  },
  {
    id: 'gap-fem-cv-ovarian-vaginal-clitoral-vessels',
    canonicalName: 'Female ovarian, vaginal, internal pudendal (artery) & dorsal clitoral vessels',
    synonyms: ['Ovarian artery', 'Pampiniform ovarian plexus', 'Vaginal artery', 'Dorsal artery of clitoris'],
    fmaId: 'FMA14763',
    ta2Term: 'Ovarian, vaginal & clitoral blood vessels',
    uberonId: 'UBERON:0001319',
    canonicalSystem: 'cardiovascular',
    region: 'pelvis_perineum',
    laterality: 'bilateral',
    parentStructure: 'Internal iliac & gonadal branches (Female)',
    subdivisions: ['L/R ovarian artery & vein', 'L/R vaginal artery & plexus', 'L/R internal pudendal artery', 'Dorsal artery & deep vein of clitoris'],
    maleStatus: 'OUT_OF_SCOPE',
    femaleStatus: 'MISSING_GEOMETRY',
    femaleAdaptation: 'sex_specific',
    maleMeshIds: [],
    femaleMeshIds: [],
    targetGapAdditionMale: 0,
    targetGapAdditionFemale: 10,
    geometrySource: 'None bundled (male testicular FJ3532/3/3617/8 & penile vessels are properly hidden in Female mode)',
    assetLicense: 'Pending CC BY 4.0',
    geometryQuality: 'missing',
    validationStatus: 'unmodeled_gap',
    priority: 'critical',
    recommendedSource: 'HuBMAP HRA v1.3/v1.4 Female Vasculature check or anatomical spline modeling anchored to HF_OVARY & HF_CLITORIS',
    notes: 'Major female pelvic vascular gap after properly removing male testicular and penile vessels.',
  },
  {
    id: 'gap-fem-nerv-pudendal-clitoral',
    canonicalName: 'Female pudendal nerve, perineal nerves, dorsal nerve of clitoris & uterovaginal plexus',
    synonyms: ['Dorsal nerve of clitoris', 'Uterovaginal plexus'],
    fmaId: 'FMA19034',
    ta2Term: 'Female pelvic & perineal nerves',
    uberonId: 'UBERON:0011322',
    canonicalSystem: 'nervous',
    region: 'pelvis_perineum',
    laterality: 'bilateral',
    parentStructure: 'Sacral & autonomic pelvic plexuses',
    subdivisions: ['L/R pudendal nerve', 'L/R dorsal nerve of clitoris', 'Uterovaginal autonomic plexus'],
    maleStatus: 'OUT_OF_SCOPE',
    femaleStatus: 'MISSING_GEOMETRY',
    femaleAdaptation: 'sex_specific',
    maleMeshIds: [],
    femaleMeshIds: [],
    targetGapAdditionMale: 0,
    targetGapAdditionFemale: 5,
    geometrySource: 'None bundled',
    assetLicense: 'Pending CC BY 4.0',
    geometryQuality: 'missing',
    validationStatus: 'unmodeled_gap',
    priority: 'high',
    recommendedSource: 'Original anatomical nerve path modeling from BP3D sacral plexus S2–S4 to HuBMAP female pelvis',
    notes: 'BP3D pelvic nerves lack pudendal/clitoral terminal branches.',
  },
  {
    id: 'gap-fem-lymph-pelvic-mammary',
    canonicalName: 'Female mammary/axillary, internal/external iliac, obturator & inguinal lymph nodes',
    synonyms: ['Sentinel breast lymph nodes', 'Pelvic lymphatic drainage'],
    fmaId: 'FMA12798',
    ta2Term: 'Axillary & female pelvic lymph nodes',
    uberonId: 'UBERON:0002506',
    canonicalSystem: 'lymphatic',
    region: 'breast_mammary',
    laterality: 'bilateral',
    parentStructure: 'Regional lymphatic drainage',
    subdivisions: ['L/R axillary & parasternal mammary chains', 'Pelvic/obturator/iliac chains', 'Superficial/deep inguinal chains'],
    maleStatus: 'OUT_OF_SCOPE',
    femaleStatus: 'MISSING_GEOMETRY',
    femaleAdaptation: 'sex_specific',
    maleMeshIds: [],
    femaleMeshIds: [],
    targetGapAdditionMale: 0,
    targetGapAdditionFemale: 6,
    geometrySource: 'None bundled',
    assetLicense: 'HuBMAP HRA Lymph Node GLB (CC BY 4.0 candidate)',
    geometryQuality: 'missing',
    validationStatus: 'unmodeled_gap',
    priority: 'high',
    recommendedSource: 'HuBMAP HRA 3D Lymph Node library + regional mammary/pelvic placement',
    notes: 'Essential for clinical oncology & surgical anatomy education of breast and pelvic drainage.',
  },

  // =========================================================================
  // 3. MALE-SPECIFIC ANATOMY & REMAINING GAPS (SECTION 4C)
  // =========================================================================
  {
    id: 'male-repro-prostate-subdivisions',
    canonicalName: 'Prostate zonal architecture, prostatic ducts, ejaculatory ducts, prostatic utricle & seminal colliculus',
    synonyms: ['Zonal prostate', 'Verumontanum'],
    fmaId: 'FMA9600',
    ta2Term: 'Prostate & ejaculatory apparatus',
    uberonId: 'UBERON:0002367',
    canonicalSystem: 'reproductive',
    region: 'pelvis_perineum',
    laterality: 'midline',
    parentStructure: 'Male accessory glands',
    subdivisions: ['Peripheral zone L/R', 'Central zone L/R', 'Transition zone L/R', 'Anterior fibromuscular stroma L/R', 'Prostatic ducts L/R', 'Ejaculatory ducts', 'Prostatic utricle', 'Seminal colliculus'],
    maleStatus: 'PRESENT_SEX_SPECIFIC_GEOMETRY',
    femaleStatus: 'OUT_OF_SCOPE',
    femaleAdaptation: 'not_applicable',
    maleMeshIds: ['FJ3139', 'HM_EJACULATORY_DUCT', 'HM_PROSTATIC_UTRICLE', 'HM_SEMINAL_COLLICULUS', 'HM_PROSTATE_PERIPHERAL_L'],
    femaleMeshIds: [],
    targetGapAdditionMale: 0,
    targetGapAdditionFemale: 0,
    geometrySource: 'BodyParts3D 4.0 (FJ3139) + HuBMAP HRA v1.2 Visible Human Male Prostate (13 HM_* meshes)',
    assetLicense: 'CC BY 4.0',
    geometryQuality: 'verified_medical_reference',
    validationStatus: 'source_reviewed',
    priority: 'high',
    recommendedSource: 'Bundled in male-enhancements.json',
    notes: '13 sub-zonal/ductal meshes added alongside base BP3D prostate capsule.',
  },
  {
    id: 'gap-male-repro-bulbourethral-glands',
    canonicalName: "Bulbourethral (Cowper's) glands",
    synonyms: ["Cowper's gland", 'Glandula bulbourethralis'],
    fmaId: 'FMA19650',
    ta2Term: 'Bulbourethral gland',
    uberonId: 'UBERON:0002366',
    canonicalSystem: 'reproductive',
    region: 'pelvis_perineum',
    laterality: 'bilateral',
    parentStructure: 'Male accessory sex glands',
    subdivisions: ['Left bulbourethral gland', 'Right bulbourethral gland'],
    maleStatus: 'MISSING_GEOMETRY',
    femaleStatus: 'OUT_OF_SCOPE',
    femaleAdaptation: 'not_applicable',
    maleMeshIds: [],
    femaleMeshIds: [],
    targetGapAdditionMale: 2,
    targetGapAdditionFemale: 0,
    geometrySource: 'None bundled in BP3D 4.0 or HuBMAP HRA Male',
    assetLicense: 'Pending CC BY 4.0',
    geometryQuality: 'missing',
    validationStatus: 'unmodeled_gap',
    priority: 'high',
    recommendedSource: 'Original anatomical modeling posterolateral to membranous urethra',
    notes: 'Classic MBBS/MDCAT male accessory gland missing from BP3D 4.0.',
  },
  {
    id: 'gap-male-repro-scrotum-spermatic-cord-pampiniform',
    canonicalName: 'Scrotal layers (dartos, tunica vaginalis), spermatic cord & pampiniform venous plexus',
    synonyms: ['Funiculus spermaticus', 'Tunica vaginalis', 'Pampiniform plexus'],
    fmaId: 'FMA18252',
    ta2Term: 'Scrotum, spermatic cord & coverings of testis',
    uberonId: 'UBERON:0006845',
    canonicalSystem: 'reproductive',
    region: 'pelvis_perineum',
    laterality: 'bilateral',
    parentStructure: 'Male external genitalia & coverings',
    subdivisions: ['Scrotal skin & dartos tunic', 'L/R cremasteric/spermatic fascia', 'L/R tunica vaginalis', 'L/R pampiniform venous plexus'],
    maleStatus: 'PRESENT_BUT_MERGED',
    femaleStatus: 'OUT_OF_SCOPE',
    femaleAdaptation: 'not_applicable',
    maleMeshIds: ['FJ3138', 'FJ3142', 'FJ3136', 'FJ3141'],
    femaleMeshIds: [],
    targetGapAdditionMale: 6,
    targetGapAdditionFemale: 0,
    geometrySource: 'Testis/epididymis/deferent duct/testicular vessels present in BP3D; outer scrotal fascia, tunica vaginalis & pampiniform plexus unmodeled',
    assetLicense: 'Pending CC BY 4.0',
    geometryQuality: 'missing',
    validationStatus: 'unmodeled_gap',
    priority: 'high',
    recommendedSource: 'Original anatomical modeling or NLM Visible Human Male segmentation',
    notes: 'Important for inguinal canal, varicocele, and hydrocele clinical teaching.',
  },
  {
    id: 'gap-male-urin-urethral-subdivisions',
    canonicalName: 'Male urethral subdivisions (pre-prostatic, prostatic, membranous, bulbar/spongy urethra)',
    synonyms: ['Urethra masculina'],
    fmaId: 'FMA19675',
    ta2Term: 'Male urethra',
    uberonId: 'UBERON:0001333',
    canonicalSystem: 'urinary',
    region: 'pelvis_perineum',
    laterality: 'midline',
    parentStructure: 'Male lower urinary tract',
    subdivisions: ['Prostatic part', 'Membranous part', 'Spongy part'],
    maleStatus: 'PRESENT_BUT_MERGED',
    femaleStatus: 'OUT_OF_SCOPE',
    femaleAdaptation: 'not_applicable',
    maleMeshIds: ['FJ3148'],
    femaleMeshIds: [],
    targetGapAdditionMale: 3,
    targetGapAdditionFemale: 0,
    geometrySource: 'BodyParts3D 4.0 FJ3148 represents entire male urethra as 1 continuous mesh',
    assetLicense: 'CC BY 4.0 (merged)',
    geometryQuality: 'high_detail_optimized',
    validationStatus: 'source_reviewed',
    priority: 'medium',
    recommendedSource: 'Regional subdivision split of FJ3148',
    notes: 'Single mesh FJ3148 covers full course without separate prostatic/membranous/spongy selection.',
  },
  {
    id: 'gap-male-nerv-pudendal-prostatic-plexus',
    canonicalName: 'Male pudendal nerve, dorsal nerve of penis & prostatic/pelvic plexus',
    synonyms: ['Dorsal nerve of penis', 'Prostatic nerve plexus'],
    fmaId: 'FMA19036',
    ta2Term: 'Male perineal & penile nerves',
    uberonId: 'UBERON:0011322',
    canonicalSystem: 'nervous',
    region: 'pelvis_perineum',
    laterality: 'bilateral',
    parentStructure: 'Sacral & pelvic autonomic plexuses',
    subdivisions: ['L/R pudendal nerve', 'L/R dorsal nerve of penis', 'Prostatic autonomic plexus'],
    maleStatus: 'MISSING_GEOMETRY',
    femaleStatus: 'OUT_OF_SCOPE',
    femaleAdaptation: 'not_applicable',
    maleMeshIds: [],
    femaleMeshIds: [],
    targetGapAdditionMale: 4,
    targetGapAdditionFemale: 0,
    geometrySource: 'None bundled',
    assetLicense: 'Pending CC BY 4.0',
    geometryQuality: 'missing',
    validationStatus: 'unmodeled_gap',
    priority: 'medium',
    recommendedSource: 'Original nerve path modeling anchored to sacrum and prostate/penile shaft',
    notes: 'Crucial for radical prostatectomy neurovascular bundle & pudendal block anatomy.',
  },
  {
    id: 'gap-license-blocked-z-anatomy',
    canonicalName: 'Z-Anatomy extra sub-organ detail (cranial ganglia, dental ligaments, nasal conchae refinements)',
    synonyms: ['Z-Anatomy CC BY-SA 4.0 Pack'],
    fmaId: 'FMA50801',
    ta2Term: 'Candidate external CC BY-SA 4.0 pack structures',
    uberonId: 'UBERON:0000468',
    canonicalSystem: 'nervous',
    region: 'head_neck',
    laterality: 'bilateral',
    parentStructure: 'External optional ShareAlike pack architecture',
    subdivisions: ['Pterygopalatine/submandibular ganglia', 'Sphenopalatine fibers', 'Minor articular capsules'],
    maleStatus: 'LICENSE_BLOCKED',
    femaleStatus: 'LICENSE_BLOCKED',
    femaleAdaptation: 'genuinely_shared',
    maleMeshIds: [],
    femaleMeshIds: [],
    targetGapAdditionMale: 0,
    targetGapAdditionFemale: 0,
    geometrySource: 'Z-Anatomy/Models-of-human-anatomy (excluded from core bundle)',
    assetLicense: 'CC BY-SA 4.0 (ShareAlike + per-asset upstream attribution checks)',
    geometryQuality: 'missing',
    validationStatus: 'license_blocked',
    priority: 'low',
    recommendedSource: 'Requires isolated CC BY-SA 4.0 optional download pack separate from core MIT/CC BY 4.0 build',
    notes: 'Intentionally excluded from core repository to prevent ShareAlike license contamination.',
  },
];

export interface OptionalAdvancedLayerSpec {
  id: string;
  name: string;
  scope: 'female' | 'both';
  fmaId: string;
  ta2Term: string;
  bundledInRepo: boolean;
  defaultEnabled: boolean;
  partCount: number;
  triangles: number;
  meshIds: string[];
  source: string;
  license: string;
  status: CoverageStatus;
  notes: string;
}

/**
 * Section 4D: Optional Advanced Layers — tracked and reported strictly outside the default adult reference targets.
 */
export const OPTIONAL_ADVANCED_LAYERS: OptionalAdvancedLayerSpec[] = [
  {
    id: 'opt-full-term-placenta-umbilical',
    name: 'Full-Term Placenta, Amnion & Umbilical Cord',
    scope: 'female',
    fmaId: 'FMA63934',
    ta2Term: 'Placenta & umbilical cord (Funiculus umbilicalis)',
    bundledInRepo: true,
    defaultEnabled: false,
    partCount: LAYER_BUNDLE_PROVENANCE.optionalPregnancyParts,
    triangles: LAYER_BUNDLE_PROVENANCE.optionalPregnancyTriangles,
    meshIds: [
      'HO_PLACENTA_BASAL_PLATE',
      'HO_PLACENTA_CHORIONIC_PLATE',
      'HO_PLACENTA_VESSELS',
      'HO_PLACENTA_AMNION',
      'HO_UMBILICAL_CORD',
      'HO_UMBILICAL_ARTERY_1',
      'HO_UMBILICAL_ARTERY_2',
      'HO_UMBILICAL_VEIN',
    ],
    source: 'HuBMAP HRA v1.1 Visible Human Female Full-Term Placenta (3d-vh-f-placenta-full-term)',
    license: 'CC BY 4.0',
    status: 'OUT_OF_SCOPE',
    notes: 'Bundled under public/models/optional/pregnancy-placenta.json; toggled OFF by default in Female mode.',
  },
  {
    id: 'opt-gravid-uterus-fetal',
    name: 'Gravid Uterus (First/Second/Third Trimester) & Fetal Anatomy',
    scope: 'female',
    fmaId: 'FMA17558',
    ta2Term: 'Gravid uterus & fetus',
    bundledInRepo: false,
    defaultEnabled: false,
    partCount: 0,
    triangles: 0,
    meshIds: [],
    source: 'Not bundled',
    license: 'Requires verified CC BY 4.0 developmental/fetal dataset',
    status: 'OUT_OF_SCOPE',
    notes: 'Future optional obstetrics layer outside default non-pregnant adult female target.',
  },
  {
    id: 'opt-embryology-stages',
    name: 'Carnegie Embryological Developmental Stages',
    scope: 'both',
    fmaId: 'FMA83050',
    ta2Term: 'Human embryo developmental series',
    bundledInRepo: false,
    defaultEnabled: false,
    partCount: 0,
    triangles: 0,
    meshIds: [],
    source: 'Not bundled',
    license: 'Pending verified educational dataset',
    status: 'OUT_OF_SCOPE',
    notes: 'Covered as written curriculum modules; separate 3D Carnegie series planned outside default adult target.',
  },
  {
    id: 'opt-menstrual-follicular-variants',
    name: 'Menstrual-Cycle Ovarian Follicles & Corpus Luteum Variants',
    scope: 'female',
    fmaId: 'FMA18625',
    ta2Term: 'Ovarian follicles & corpus luteum',
    bundledInRepo: false,
    defaultEnabled: false,
    partCount: 0,
    triangles: 0,
    meshIds: [],
    source: 'Not bundled',
    license: 'Pending CC BY 4.0 modeling',
    status: 'OUT_OF_SCOPE',
    notes: 'Cyclical physiological states intentionally separated from static default adult female baseline.',
  },
  {
    id: 'opt-histology-pathology-pediatric',
    name: 'Cellular Microanatomy, Pediatric Reference & Pathological Variants',
    scope: 'both',
    fmaId: 'FMA68646',
    ta2Term: 'Microanatomy, Pediatric & Pathology layers',
    bundledInRepo: false,
    defaultEnabled: false,
    partCount: 0,
    triangles: 0,
    meshIds: [],
    source: 'Histology & Radiology represented via CC-licensed 2D micrographs/plates in /media/',
    license: 'CC0 / CC BY / CC BY-SA (2D media only)',
    status: 'OUT_OF_SCOPE',
    notes: 'Microscopic nephrons, alveoli, sarcomeres, pediatric epiphyseal atlases, and clinical variations remain outside default adult gross-anatomy mesh count.',
  },
];

/**
 * Backward-compatible 12-system summary for base atlas validation & surgical-anatomy.test.ts.
 */
export function buildAnatomyCoverageMatrix(atlas: Atlas): SystemCoverageRow[] {
  const buckets = new Map<
    CanonicalSystemId,
    { meshes: number; concepts: Set<string>; bilateral: number; tris: number }
  >(
    CANONICAL_SYSTEMS.map((s) => [
      s.id,
      { meshes: 0, concepts: new Set<string>(), bilateral: 0, tris: 0 },
    ]),
  );

  for (const part of atlas.parts) {
    const sysObj = canonicalSystemForMeshSystem(part.system);
    const b = buckets.get(sysObj.id);
    if (!b) continue;
    b.meshes++;
    b.concepts.add(part.conceptId);
    if (/\b(left|right)\b/i.test(part.name)) b.bilateral++;
    b.tris += Math.floor(part.indexCount / 3);
  }

  return CANONICAL_SYSTEMS.map((sys) => {
    const b = buckets.get(sys.id)!;
    const lim = SYSTEM_LIMITATIONS[sys.id];
    return {
      systemId: sys.id,
      name: sys.name.en,
      meshCount: b.meshes,
      uniqueConceptCount: b.concepts.size,
      bilateralPairedCount: b.bilateral,
      totalTriangles: b.tris,
      geometryStatus: lim.status,
      honestLimitationNote: lim.note,
    };
  });
}

function collectConceptIdsFromParts(parts: Part[]): Set<string> {
  return new Set(parts.map((p) => p.conceptId));
}

function countGapAdditionsBySystem(): Record<
  CanonicalSystemId,
  { maleGap: number; femaleGap: number; conceptGapMale: number; conceptGapFemale: number }
> {
  const rec = {} as Record<
    CanonicalSystemId,
    { maleGap: number; femaleGap: number; conceptGapMale: number; conceptGapFemale: number }
  >;
  for (const s of CANONICAL_SYSTEMS) {
    rec[s.id] = { maleGap: 0, femaleGap: 0, conceptGapMale: 0, conceptGapFemale: 0 };
  }
  for (const item of CANONICAL_GROSS_ANATOMY_INVENTORY) {
    const bucket = rec[item.canonicalSystem];
    bucket.maleGap += item.targetGapAdditionMale;
    bucket.femaleGap += item.targetGapAdditionFemale;
    if (item.targetGapAdditionMale > 0) bucket.conceptGapMale += 1;
    if (item.targetGapAdditionFemale > 0) bucket.conceptGapFemale += 1;
  }
  return rec;
}

/**
 * Truthful multi-layer coverage matrix across Base BodyParts3D + Shared + Male + Female + Optional layers.
 * Separates 3D mesh counts from FMA concept counts and counts gaps strictly from CANONICAL_GROSS_ANATOMY_INVENTORY.
 */
export function computeAtlasCoverageSummary(
  baseAtlas: Atlas,
  bundle: ActiveLayerBundle,
): ModelCoverageSummary {
  const sharedParts: Part[] = bundle.shared?.parts ?? [];
  const maleEnhParts: Part[] = bundle.male?.parts ?? [];
  const femaleParts: Part[] = bundle.female?.parts ?? [];
  const optionalPregParts: Part[] = bundle.optionalPregnancy?.parts ?? [];

  const inheritedSharedFromBase = baseAtlas.parts.filter(
    (p) => !FEMALE_REPLACED_MALE_PART_SET.has(p.id),
  );
  const replacedBaseMaleParts = baseAtlas.parts.filter((p) =>
    FEMALE_REPLACED_MALE_PART_SET.has(p.id),
  );

  const maleActiveParts: Part[] = [...baseAtlas.parts, ...sharedParts, ...maleEnhParts];
  const femaleActiveParts: Part[] = [...inheritedSharedFromBase, ...sharedParts, ...femaleParts];

  const gapAdditions = countGapAdditionsBySystem();

  const sysBuckets = new Map<
    CanonicalSystemId,
    {
      maleParts: Part[];
      femaleParts: Part[];
      sharedVerified: number;
      reusedUnadapted: number;
      maleSpecific: number;
      femaleSpecific: number;
      optionalPregnancy: number;
    }
  >(
    CANONICAL_SYSTEMS.map((s) => [
      s.id,
      {
        maleParts: [],
        femaleParts: [],
        sharedVerified: 0,
        reusedUnadapted: 0,
        maleSpecific: 0,
        femaleSpecific: 0,
        optionalPregnancy: 0,
      },
    ]),
  );

  for (const p of inheritedSharedFromBase) {
    const sys = canonicalSystemForMeshSystem(p.system).id;
    const b = sysBuckets.get(sys)!;
    b.maleParts.push(p);
    b.femaleParts.push(p);
    b.reusedUnadapted++;
  }
  for (const p of replacedBaseMaleParts) {
    const sys = canonicalSystemForMeshSystem(p.system).id;
    const b = sysBuckets.get(sys)!;
    b.maleParts.push(p);
    b.maleSpecific++;
  }
  for (const p of sharedParts) {
    const sys = canonicalSystemForMeshSystem(p.system).id;
    const b = sysBuckets.get(sys)!;
    b.maleParts.push(p);
    b.femaleParts.push(p);
    b.sharedVerified++;
  }
  for (const p of maleEnhParts) {
    const sys = canonicalSystemForMeshSystem(p.system).id;
    const b = sysBuckets.get(sys)!;
    b.maleParts.push(p);
    b.maleSpecific++;
  }
  for (const p of femaleParts) {
    const sys = canonicalSystemForMeshSystem(p.system).id;
    const b = sysBuckets.get(sys)!;
    b.femaleParts.push(p);
    b.femaleSpecific++;
  }
  for (const p of optionalPregParts) {
    const sys = canonicalSystemForMeshSystem(p.system).id;
    sysBuckets.get(sys)!.optionalPregnancy++;
  }

  let totalMaleTarget = 0;
  let totalFemaleTarget = 0;
  let totalMaleConceptTarget = 0;
  let totalFemaleConceptTarget = 0;

  const systems: MultiLayerSystemCoverageRow[] = CANONICAL_SYSTEMS.map((sys) => {
    const b = sysBuckets.get(sys.id)!;
    const gap = gapAdditions[sys.id];
    const maleExisting = b.maleParts.length;
    const femaleExisting = b.femaleParts.length;
    const maleTarget = maleExisting + gap.maleGap;
    const femaleTarget = femaleExisting + gap.femaleGap;

    const maleCids = collectConceptIdsFromParts(b.maleParts).size;
    const femaleCids = collectConceptIdsFromParts(b.femaleParts).size;
    const maleConceptTarget = maleCids + gap.conceptGapMale;
    const femaleConceptTarget = femaleCids + gap.conceptGapFemale;

    totalMaleTarget += maleTarget;
    totalFemaleTarget += femaleTarget;
    totalMaleConceptTarget += maleConceptTarget;
    totalFemaleConceptTarget += femaleConceptTarget;

    return {
      systemId: sys.id,
      name: sys.name.en,
      maleExisting,
      femaleExisting,
      sharedVerifiedCount: b.sharedVerified,
      reusedUnadaptedCount: b.reusedUnadapted,
      maleSpecificCount: b.maleSpecific,
      femaleSpecificCount: b.femaleSpecific,
      optionalPregnancyCount: b.optionalPregnancy,
      maleMissingGap: gap.maleGap,
      femaleMissingGap: gap.femaleGap,
      maleTarget,
      femaleTarget,
      maleMeshCoveragePct: maleTarget > 0 ? Math.round((maleExisting / maleTarget) * 1000) / 10 : 100,
      femaleMeshCoveragePct:
        femaleTarget > 0 ? Math.round((femaleExisting / femaleTarget) * 1000) / 10 : 100,
      maleActiveConceptCount: maleCids,
      femaleActiveConceptCount: femaleCids,
      maleConceptTarget,
      femaleConceptTarget,
      maleConceptCoveragePct:
        maleConceptTarget > 0 ? Math.round((maleCids / maleConceptTarget) * 1000) / 10 : 100,
      femaleConceptCoveragePct:
        femaleConceptTarget > 0 ? Math.round((femaleCids / femaleConceptTarget) * 1000) / 10 : 100,
      honestLimitationNote: SYSTEM_LIMITATIONS[sys.id].note,
    };
  });

  const basePartConceptIds = collectConceptIdsFromParts(baseAtlas.parts);
  const maleActivePartConcepts = collectConceptIdsFromParts(maleActiveParts).size;
  const femaleActivePartConcepts = collectConceptIdsFromParts(femaleActiveParts).size;

  const baseConceptIdsNotDirectlyMeshed = baseAtlas.concepts.filter(
    (c: Concept) => !basePartConceptIds.has(c.id),
  ).length;

  const femaleHubmapMeshes = femaleParts.filter((p) =>
    String((p as { source?: string }).source ?? '').startsWith('HuBMAP'),
  ).length;
  const femaleProceduralMeshes = femaleParts.length - femaleHubmapMeshes;

  const maleMissingRequiredMeshes = systems.reduce((s, r) => s + r.maleMissingGap, 0);
  const femaleMissingRequiredMeshes = systems.reduce((s, r) => s + r.femaleMissingGap, 0);

  return {
    originalMaleBaseMeshes: baseAtlas.parts.length,
    originalMaleManifestConcepts: baseAtlas.concepts.length,
    originalMaleUniquePartConcepts: basePartConceptIds.size,
    sharedEnhancementMeshes: sharedParts.length,
    maleEnhancementMeshes: maleEnhParts.length,
    femaleOverlayMeshes: femaleParts.length,
    femaleHubmapMeshes,
    femaleProceduralMeshes,
    replacedMalePartsInFemale: replacedBaseMaleParts.length,
    optionalPregnancyMeshes: optionalPregParts.length,
    totalDistinctBundledMeshes:
      baseAtlas.parts.length +
      sharedParts.length +
      maleEnhParts.length +
      femaleParts.length +
      optionalPregParts.length,
    maleActiveMeshes: maleActiveParts.length,
    femaleActiveMeshes: femaleActiveParts.length,
    sharedActiveMeshes: inheritedSharedFromBase.length + sharedParts.length,
    genuinelySharedVerifiedMeshes: sharedParts.length,
    reusedFromMaleUnadaptedInFemale: inheritedSharedFromBase.length,
    maleSpecificActiveMeshes: replacedBaseMaleParts.length + maleEnhParts.length,
    femaleSpecificActiveMeshes: femaleParts.length,
    maleMissingRequiredMeshes,
    femaleMissingRequiredMeshes,
    presentButMergedEntries: CANONICAL_GROSS_ANATOMY_INVENTORY.filter(
      (i) => i.maleStatus === 'PRESENT_BUT_MERGED' || i.femaleStatus === 'PRESENT_BUT_MERGED',
    ).length,
    approximateProceduralMeshes: femaleProceduralMeshes,
    conceptOnlyFmaGroupingEntries: baseConceptIdsNotDirectlyMeshed,
    conceptOnlyUnmeshedInventoryEntries: CANONICAL_GROSS_ANATOMY_INVENTORY.filter(
      (i) => i.maleStatus === 'CONCEPT_ONLY_NO_GEOMETRY' || i.femaleStatus === 'CONCEPT_ONLY_NO_GEOMETRY',
    ).length,
    licenseBlockedEntries: CANONICAL_GROSS_ANATOMY_INVENTORY.filter(
      (i) => i.maleStatus === 'LICENSE_BLOCKED' || i.femaleStatus === 'LICENSE_BLOCKED',
    ).length,
    maleTargetMeshes: totalMaleTarget,
    femaleTargetMeshes: totalFemaleTarget,
    maleMeshCoveragePct:
      totalMaleTarget > 0 ? Math.round((maleActiveParts.length / totalMaleTarget) * 1000) / 10 : 100,
    femaleMeshCoveragePct:
      totalFemaleTarget > 0 ? Math.round((femaleActiveParts.length / totalFemaleTarget) * 1000) / 10 : 100,
    maleActivePartConcepts,
    femaleActivePartConcepts,
    maleConceptCoveragePct:
      totalMaleConceptTarget > 0
        ? Math.round((maleActivePartConcepts / totalMaleConceptTarget) * 1000) / 10
        : 100,
    femaleConceptCoveragePct:
      totalFemaleConceptTarget > 0
        ? Math.round((femaleActivePartConcepts / totalFemaleConceptTarget) * 1000) / 10
        : 100,
    systems,
  };
}

/**
 * Helper for scripts and offline validation when manifests are loaded synchronously from Node fs.
 */
export function buildStaticBundleFromManifests(manifests: {
  shared?: OverlayManifest | null;
  male?: OverlayManifest | null;
  female?: ActiveLayerBundle['female'];
  optionalPregnancy?: OverlayManifest | null;
}): ActiveLayerBundle {
  return {
    shared: manifests.shared ?? null,
    male: manifests.male ?? null,
    female: manifests.female ?? null,
    optionalPregnancy: manifests.optionalPregnancy ?? null,
    includePregnancy: false,
  };
}
