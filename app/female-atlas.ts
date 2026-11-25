import type { Atlas, Concept, Part } from './anatomy';
import {
  FEMALE_REPLACED_MALE_PART_IDS,
  FEMALE_REPLACED_MALE_PART_SET,
  LAYER_BUNDLE_PROVENANCE,
  getActiveConceptsForBundle,
  getActivePartsForBundle,
  loadFemaleAtlasManifest,
  type ActiveLayerBundle,
  type AnatomySex,
  type FemaleAtlasManifest,
} from './atlas-layers';

export {
  FEMALE_ONLY_CONCEPT_IDS,
  FEMALE_ONLY_CONCEPT_SET,
  FEMALE_REPLACED_MALE_PART_IDS,
  FEMALE_REPLACED_MALE_PART_SET,
  LAYER_BUNDLE_PROVENANCE,
  OPTIONAL_PREGNANCY_CONCEPT_IDS,
  OPTIONAL_PREGNANCY_CONCEPT_SET,
  PREFERRED_SEX_STORAGE_KEY,
  getPartLayerClassification,
  getSystemDescriptionForSex,
  isFemaleSpecificTarget,
  isMaleOnlyTarget,
  isPartHiddenForSex,
  loadFemaleAtlasManifest,
  loadMaleEnhancementsManifest,
  loadOptionalPregnancyManifest,
  loadSharedEnhancementsManifest,
  readPersistedAnatomySex,
  writePersistedAnatomySex,
  type ActiveLayerBundle,
  type AnatomySex,
  type FemaleAtlasManifest,
  type LayerClassification,
  type OverlayManifest,
  type OverlayPart,
} from './atlas-layers';

export const FEMALE_ATLAS_PROVENANCE = {
  totalParts: LAYER_BUNDLE_PROVENANCE.femaleOverlayParts,
  totalConcepts: LAYER_BUNDLE_PROVENANCE.femaleOverlayConcepts,
  triangles: LAYER_BUNDLE_PROVENANCE.femaleOverlayTriangles,
  chunkCount: 1,
  hubmapDirectParts: LAYER_BUNDLE_PROVENANCE.femaleHubmapDirectParts,
  hubmapV15VisibleHuman: LAYER_BUNDLE_PROVENANCE.femaleHubmapV15Pelvis,
  hubmapV11Mammary: LAYER_BUNDLE_PROVENANCE.femaleHubmapV11Mammary,
  hubmapV13Vasculature: LAYER_BUNDLE_PROVENANCE.femaleHubmapV13Vasculature,
  proceduralReconstructedParts: LAYER_BUNDLE_PROVENANCE.femaleProceduralReconstructions,
  urethraConduitParts: 1,
  pelvicAndExternalReconstructions: 7,
  proceduralPartIds: [
    'HF_URETHRA',
    'HF_ENDOMETRIUM',
    'HF_CLITORIS',
    'HF_VESTIBULAR_BULBS',
    'HF_BARTHOLIN_GLANDS',
    'HF_LABIA_MINORA',
    'HF_LABIA_MAJORA',
    'HF_MONS_PUBIS',
  ] as readonly string[],
  replacedMaleParts: LAYER_BUNDLE_PROVENANCE.replacedMalePartsInFemale,
  activeMalePartsTotal: LAYER_BUNDLE_PROVENANCE.activeMalePartsTotal,
  activeFemalePartsTotal: LAYER_BUNDLE_PROVENANCE.activeFemalePartsTotal,
  sharedEnhancementParts: LAYER_BUNDLE_PROVENANCE.sharedEnhancementParts,
  maleEnhancementParts: LAYER_BUNDLE_PROVENANCE.maleEnhancementParts,
  optionalPregnancyParts: LAYER_BUNDLE_PROVENANCE.optionalPregnancyParts,
  knownGaps: [
    'Non-pelvic skeleton, skeletal muscles, cranial/peripheral nerves, and thorax/abdomen remain reused from the BodyParts3D 4.0 adult male donor rather than female-specific segmented geometry.',
    'Thyroid gland, parathyroid glands, inner ear ossicles/cochlea, and female pelvic-floor musculature (levator ani / pelvic fascia) remain missing as separate 3D meshes.',
    'Full-term placenta/umbilical cord is shipped as an explicit Optional Advanced Layer (OFF by default); early-pregnancy/fetal, embryology, menstrual-cycle, and histology 3D models are not yet bundled.',
  ] as readonly string[],
} as const;

export const FEMALE_ATLAS_ATTRIBUTION =
  'Adult Female Pelvic, Vascular & Reproductive Overlay (92 parts / 133.8k triangles): 84 HuBMAP Human Reference Atlas meshes (55 HRA v1.5 Visible Human Female DOI: 10.48539/HBM352.BTSQ.586 + 16 HRA v1.1 Mammary Gland + 13 HRA v1.3 Female Pelvic Blood Vasculature, CC BY 4.0) + 8 anatomically co-registered pelvic/urethral reconstructions.';

export function getActivePartsForSex(
  baseAtlas: Atlas,
  femaleOverlay: FemaleAtlasManifest | null,
  sex: AnatomySex,
  extraBundle?: Pick<ActiveLayerBundle, 'shared' | 'male' | 'optionalPregnancy' | 'includePregnancy'>,
): Part[] {
  return getActivePartsForBundle(baseAtlas, sex, {
    female: femaleOverlay,
    shared: extraBundle?.shared,
    male: extraBundle?.male,
    optionalPregnancy: extraBundle?.optionalPregnancy,
    includePregnancy: extraBundle?.includePregnancy,
  });
}

export function getActiveConceptsForSex(
  baseAtlas: Atlas,
  femaleOverlay: FemaleAtlasManifest | null,
  sex: AnatomySex,
  extraBundle?: Pick<ActiveLayerBundle, 'shared' | 'male' | 'optionalPregnancy' | 'includePregnancy'>,
): Concept[] {
  return getActiveConceptsForBundle(baseAtlas, sex, {
    female: femaleOverlay,
    shared: extraBundle?.shared,
    male: extraBundle?.male,
    optionalPregnancy: extraBundle?.optionalPregnancy,
    includePregnancy: extraBundle?.includePregnancy,
  });
}
