import type { Atlas, Concept, Part, SystemId } from './anatomy';

export type AnatomySex = 'male' | 'female';

export type LayerClassification =
  | 'shared_verified'
  | 'reused_from_male_unadapted'
  | 'male_specific'
  | 'female_adapted_or_specific'
  | 'optional_pregnancy';

export const LAYER_CLASSIFICATION_LABELS: Record<LayerClassification, string> = {
  shared_verified: 'Shared Verified Anatomy',
  reused_from_male_unadapted: 'Reused from Male Base (Unadapted)',
  male_specific: 'Adult Male Specific',
  female_adapted_or_specific: 'Adult Female Adapted / Specific',
  optional_pregnancy: 'Optional Pregnancy / Placenta Layer',
};

export interface OverlayPart extends Part {
  source?: string;
  license?: string;
}

export interface OverlayManifest extends Atlas {
  layer?: LayerClassification;
  optionalLayer?: string;
  parts: OverlayPart[];
}

export interface FemaleAtlasManifest extends OverlayManifest {
  sex: 'female';
}

export interface ActiveLayerBundle {
  shared?: OverlayManifest | null;
  male?: OverlayManifest | null;
  female?: FemaleAtlasManifest | null;
  optionalPregnancy?: OverlayManifest | null;
  includePregnancy?: boolean;
}

export const PREFERRED_SEX_STORAGE_KEY = 'a360.preferredSex.v1';

export function readPersistedAnatomySex(): AnatomySex {
  if (typeof window === 'undefined') return 'male';
  try {
    const raw = window.localStorage.getItem(PREFERRED_SEX_STORAGE_KEY);
    return raw === 'female' ? 'female' : 'male';
  } catch {
    return 'male';
  }
}

export function writePersistedAnatomySex(sex: AnatomySex): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PREFERRED_SEX_STORAGE_KEY, sex);
  } catch {
    // Ignore storage restrictions in private mode
  }
}

/**
 * Adult male BodyParts3D 4.0 part IDs that are replaced or hidden when
 * switching the 3D viewer to the Adult Female anatomical model (45 parts total):
 * - 12 male reproductive organs (penis, prostate, seminal vesicles, testes, epididymides, deferent ducts)
 * - 8 male penile vessels
 * - 4 male testicular vessels
 * - 5 male-proportioned urinary & pelvic structures replaced by HuBMAP Female equivalents
 * - 16 male-pelvis-framed iliac, pudendal, sacral & rectal vessels replaced by 13 HuBMAP HRA female vessels
 */
export const FEMALE_REPLACED_MALE_PART_IDS: readonly string[] = [
  // Male reproductive organs (12)
  'FJ3132', // Corpus cavernosum of penis
  'FJ3133', // Corpus spongiosum of penis
  'FJ3134', // Glans penis
  'FJ3135', // Left deferent duct
  'FJ3136', // Left epididymis
  'FJ3137', // Left seminal vesicle
  'FJ3138', // Left testis
  'FJ3139', // Prostate
  'FJ3140', // Right deferent duct
  'FJ3141', // Right epididymis
  'FJ3142', // Right testis
  'FJ3143', // Right seminal vesicle
  // Male penile vessels (8)
  'FJ2056', // Deep dorsal vein of penis
  'FJ2208', // Superficial dorsal vein of penis
  'FJ3426', // Left superficial dorsal vein of penis
  'FJ3496', // Left dorsal artery of penis
  'FJ3497', // Left dorsal artery of penis
  'FJ3592', // Right dorsal artery of penis
  'FJ3593', // Right dorsal artery of penis
  'FJ3637', // Right superficial dorsal vein of penis
  // Male testicular vessels (4)
  'FJ3532', // Left testicular artery
  'FJ3533', // Left testicular vein
  'FJ3617', // Right testicular artery
  'FJ3618', // Right testicular vein
  // Male-proportioned urinary & pelvic structures replaced by HuBMAP Female equivalents (5)
  'FJ3148', // Male urethra -> HF_URETHRA
  'FJ3149', // Male urinary bladder -> HF_BLADDER_*
  'FJ3152', // Right male hip bone -> HF_HIP_RIGHT
  'FJ3288', // Left male hip bone -> HF_HIP_LEFT
  'FJ3393', // Male sacrum -> HF_SACRUM
  // Male-pelvis-framed pelvic/rectal vessels replaced by 13 HuBMAP Female pelvic vessels (16)
  'FJ3465', // Left common iliac vein -> HF_COMMON_ILIAC_VEIN_LEFT
  'FJ3566', // Right common iliac vein -> HF_COMMON_ILIAC_VEIN_RIGHT
  'FJ3469', // Left internal iliac vein (1) -> HF_INTERNAL_ILIAC_VEIN_LEFT
  'FJ3470', // Left internal iliac vein (2) -> HF_INTERNAL_ILIAC_VEIN_LEFT
  'FJ3471', // Left internal iliac vein (3) -> HF_INTERNAL_ILIAC_VEIN_LEFT
  'FJ3570', // Right internal iliac vein (1) -> HF_INTERNAL_ILIAC_VEIN_RIGHT
  'FJ3571', // Right internal iliac vein (2) -> HF_INTERNAL_ILIAC_VEIN_RIGHT
  'FJ3572', // Right internal iliac vein (3) -> HF_INTERNAL_ILIAC_VEIN_RIGHT
  'FJ3607', // Right internal iliac vein (4) -> HF_INTERNAL_ILIAC_VEIN_RIGHT
  'FJ3608', // Right internal iliac vein (5) -> HF_INTERNAL_ILIAC_VEIN_RIGHT
  'FJ3609', // Right internal iliac vein (6) -> HF_INTERNAL_ILIAC_VEIN_RIGHT
  'FJ3525', // Left internal pudendal vein -> HF_INTERNAL_PUDENDAL_VEIN_LEFT
  'FJ3610', // Right internal pudendal vein -> HF_INTERNAL_PUDENDAL_VEIN_RIGHT
  'FJ3541', // Median sacral vein -> HF_MEDIAN_SACRAL_VEIN
  'FJ3656', // Superior rectal artery -> HF_SUPERIOR_RECTAL_ARTERY
  'FJ3657', // Superior rectal vein -> HF_SUPERIOR_RECTAL_VEIN
];

export const FEMALE_REPLACED_MALE_PART_SET = new Set<string>(FEMALE_REPLACED_MALE_PART_IDS);

export const FEMALE_ONLY_CONCEPT_IDS: readonly string[] = [
  'FMA16589', 'FMA16588', 'FMA16593', 'FMA16592', 'FMA16596', 'FMA16595',
  'FMA15916', 'FMA15926', 'FMA15924', 'FMA15931', 'FMA15930',
  'FMA17558', 'FMA17748', 'FMA17739', 'FMA17738', 'FMA17745', 'FMA17746',
  'FMA17742', 'FMA17741', 'FMA17740', 'FMA17743', 'FMA17744',
  'FMA19949', 'FMA19971', 'FMA20000', 'FMA20045', 'FMA20058', 'FMA20015', 'FMA20012', 'FMA20006',
  'FMA18246', 'FMA18245', 'FMA18304', 'FMA18303', 'FMA18300', 'FMA18299',
  'FMA18296', 'FMA18295', 'FMA18298', 'FMA18297',
  'FMA7214', 'FMA7213', 'FMA7209',
  'FMA19761', 'FMA19760', 'FMA19763', 'FMA19762', 'FMA19759', 'FMA19758',
  'FMA19769', 'FMA19768', 'FMA19767', 'FMA19766', 'FMA19749', 'FMA19753', 'FMA19752', 'FMA19757', 'FMA19756', 'FMA19773',
  'FMA18824', 'FMA18823', 'FMA18908', 'FMA18907',
  'FMA57991', 'FMA57990', 'FMA9601', 'FMA67804', 'FMA67806', 'FMA72025', 'FMA76818', 'FMA57995', 'FMA67796', 'FMA72031',
];

export const FEMALE_ONLY_CONCEPT_SET = new Set<string>(FEMALE_ONLY_CONCEPT_IDS);

export const OPTIONAL_PREGNANCY_CONCEPT_IDS: readonly string[] = [
  'FMA83051',
  'FMA83052',
  'FMA83053',
  'FMA63932',
  'FMA63933',
  'FMA18820',
  'FMA18821',
  'FMA18909_UMB',
];

export const OPTIONAL_PREGNANCY_CONCEPT_SET = new Set<string>(OPTIONAL_PREGNANCY_CONCEPT_IDS);

export const LAYER_BUNDLE_PROVENANCE = {
  baseMaleParts: 2234,
  baseMaleChunks: 15,
  sharedEnhancementParts: 47,
  sharedEnhancementConcepts: 49,
  sharedEnhancementTriangles: 33_766,
  maleEnhancementParts: 20,
  maleEnhancementConcepts: 20,
  maleEnhancementTriangles: 16_969,
  femaleOverlayParts: 92,
  femaleOverlayConcepts: 92,
  femaleOverlayTriangles: 133_837,
  femaleHubmapDirectParts: 84, // 55 HRA v1.5 pelvis/viscera + 16 HRA v1.1 mammary + 13 HRA v1.3 vasculature
  femaleHubmapV15Pelvis: 55,
  femaleHubmapV11Mammary: 16,
  femaleHubmapV13Vasculature: 13,
  femaleProceduralReconstructions: 8,
  replacedMalePartsInFemale: 45,
  optionalPregnancyParts: 8,
  optionalPregnancyConcepts: 8,
  optionalPregnancyTriangles: 13_267,
  activeMalePartsTotal: 2301, // 2234 + 47 + 20
  activeFemalePartsTotal: 2328, // (2234 - 45) + 47 + 92
  totalDistinctBundledAssets: 2401, // 2234 + 47 + 20 + 92 + 8
} as const;

export function getPartLayerClassification(
  partId: string,
  sex: AnatomySex,
): LayerClassification {
  if (partId.startsWith('HO_')) return 'optional_pregnancy';
  if (partId.startsWith('HF_')) return 'female_adapted_or_specific';
  if (partId.startsWith('HM_')) return 'male_specific';
  if (partId.startsWith('HS_')) return 'shared_verified';
  if (FEMALE_REPLACED_MALE_PART_SET.has(partId)) return 'male_specific';
  return sex === 'male' ? 'shared_verified' : 'reused_from_male_unadapted';
}

export function isFemaleSpecificTarget(
  conceptId?: string | null,
  partId?: string | null,
): boolean {
  if (partId && (partId.startsWith('HF_') || partId.startsWith('HO_'))) return true;
  if (conceptId && (FEMALE_ONLY_CONCEPT_SET.has(conceptId) || OPTIONAL_PREGNANCY_CONCEPT_SET.has(conceptId))) {
    return true;
  }
  return false;
}

export function isMaleOnlyTarget(
  baseAtlas: Atlas | null,
  conceptId?: string | null,
  partId?: string | null,
): boolean {
  if (partId && (partId.startsWith('HM_') || FEMALE_REPLACED_MALE_PART_SET.has(partId))) return true;
  if (conceptId && baseAtlas) {
    const concept = baseAtlas.concepts.find((c) => c.id === conceptId);
    if (
      concept &&
      concept.elements.length > 0 &&
      concept.elements.every((el) => FEMALE_REPLACED_MALE_PART_SET.has(el))
    ) {
      return true;
    }
  }
  return false;
}

export function getSystemDescriptionForSex(
  systemId: SystemId,
  fallbackDescription: string,
  sex: AnatomySex,
): string {
  if (systemId === 'reproductive' && sex === 'female') {
    return 'The female reproductive structures represented here include the ovaries, uterine (Fallopian) tubes, uterus, cervix, vagina, external vulvar anatomy, supporting pelvic ligaments, and mammary glands (plus an optional full-term placenta & umbilical cord layer).';
  }
  return fallbackDescription;
}

let cachedSharedPromise: Promise<OverlayManifest> | null = null;
let cachedMalePromise: Promise<OverlayManifest> | null = null;
let cachedFemalePromise: Promise<FemaleAtlasManifest> | null = null;
let cachedPregnancyPromise: Promise<OverlayManifest> | null = null;

export async function loadSharedEnhancementsManifest(): Promise<OverlayManifest> {
  if (!cachedSharedPromise) {
    cachedSharedPromise = fetch('/models/shared/shared-enhancements.json').then(async (res) => {
      if (!res.ok) {
        cachedSharedPromise = null;
        throw new Error(`Could not load shared anatomical enhancements (${res.status}).`);
      }
      return (await res.json()) as OverlayManifest;
    });
  }
  return cachedSharedPromise;
}

export async function loadMaleEnhancementsManifest(): Promise<OverlayManifest> {
  if (!cachedMalePromise) {
    cachedMalePromise = fetch('/models/male/male-enhancements.json').then(async (res) => {
      if (!res.ok) {
        cachedMalePromise = null;
        throw new Error(`Could not load male anatomical enhancements (${res.status}).`);
      }
      return (await res.json()) as OverlayManifest;
    });
  }
  return cachedMalePromise;
}

export async function loadFemaleAtlasManifest(): Promise<FemaleAtlasManifest> {
  if (!cachedFemalePromise) {
    cachedFemalePromise = fetch('/models/female/female-atlas.json').then(async (res) => {
      if (!res.ok) {
        cachedFemalePromise = null;
        throw new Error(`Could not load female anatomical manifest (${res.status}).`);
      }
      return (await res.json()) as FemaleAtlasManifest;
    });
  }
  return cachedFemalePromise;
}

export async function loadOptionalPregnancyManifest(): Promise<OverlayManifest> {
  if (!cachedPregnancyPromise) {
    cachedPregnancyPromise = fetch('/models/optional/pregnancy-placenta.json').then(async (res) => {
      if (!res.ok) {
        cachedPregnancyPromise = null;
        throw new Error(`Could not load optional pregnancy/placenta layer (${res.status}).`);
      }
      return (await res.json()) as OverlayManifest;
    });
  }
  return cachedPregnancyPromise;
}

export function isPartHiddenForSex(
  partId: string,
  sex: AnatomySex,
  includePregnancy = false,
): boolean {
  if (partId.startsWith('HO_')) {
    return !(sex === 'female' && includePregnancy);
  }
  if (sex === 'male') {
    return partId.startsWith('HF_');
  }
  return partId.startsWith('HM_') || FEMALE_REPLACED_MALE_PART_SET.has(partId);
}

export function getActivePartsForBundle(
  baseAtlas: Atlas,
  sex: AnatomySex,
  bundle: ActiveLayerBundle,
): Part[] {
  const parts: Part[] = [];
  if (sex === 'male') {
    parts.push(...baseAtlas.parts);
    if (bundle.shared?.parts) parts.push(...bundle.shared.parts);
    if (bundle.male?.parts) parts.push(...bundle.male.parts);
    return parts;
  }

  for (const p of baseAtlas.parts) {
    if (!FEMALE_REPLACED_MALE_PART_SET.has(p.id)) {
      parts.push(p);
    }
  }
  if (bundle.shared?.parts) parts.push(...bundle.shared.parts);
  if (bundle.female?.parts) parts.push(...bundle.female.parts);
  if (bundle.includePregnancy && bundle.optionalPregnancy?.parts) {
    parts.push(...bundle.optionalPregnancy.parts);
  }
  return parts;
}

// BodyParts3D 4.0 assigned these 3 FMA IDs to different anatomical structures than HuBMAP Female overlay.
// Keep the unreplaced base parts cleanly separated under dedicated concept keys in Female mode.
const BP3D_CROSS_ORGAN_CONCEPT_IDS = new Set(['FMA20225', 'FMA18908', 'FMA18907']);

export function getActiveConceptsForBundle(
  baseAtlas: Atlas,
  sex: AnatomySex,
  bundle: ActiveLayerBundle,
): Concept[] {
  const activePartSet = new Set(getActivePartsForBundle(baseAtlas, sex, bundle).map((p) => p.id));
  const merged = new Map<string, Concept>();

  for (const c of baseAtlas.concepts) {
    const remaining = c.elements.filter((el) => activePartSet.has(el));
    if (remaining.length === 0) continue;
    if (sex === 'female' && bundle.female && BP3D_CROSS_ORGAN_CONCEPT_IDS.has(c.id)) {
      merged.set(`${c.id}_BP3D_BASE`, {
        ...c,
        id: `${c.id}_BP3D_BASE`,
        elements: remaining,
      });
    } else {
      merged.set(c.id, { ...c, elements: remaining });
    }
  }

  const mergeOverlayConcepts = (overlay?: OverlayManifest | null) => {
    if (!overlay) return;
    for (const oc of overlay.concepts) {
      const validElements = oc.elements.filter((el) => activePartSet.has(el));
      if (validElements.length === 0) continue;
      const existing = merged.get(oc.id);
      if (existing) {
        merged.set(oc.id, {
          ...oc,
          elements: Array.from(new Set([...existing.elements, ...validElements])),
        });
      } else {
        merged.set(oc.id, { ...oc, elements: validElements });
      }
    }
  };

  mergeOverlayConcepts(bundle.shared);
  if (sex === 'male') {
    mergeOverlayConcepts(bundle.male);
  } else {
    mergeOverlayConcepts(bundle.female);
    if (bundle.includePregnancy) {
      mergeOverlayConcepts(bundle.optionalPregnancy);
    }
  }

  return Array.from(merged.values());
}

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

