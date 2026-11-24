import type { Atlas, Concept, Part, SystemId } from './anatomy';

export type AnatomySex = 'male' | 'female';

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
 * switching the 3D viewer to the Adult Female anatomical model.
 *
 * Includes:
 * - All 12 male reproductive organs (penis, prostate, seminal vesicles, testes, epididymides, deferent ducts)
 * - Male penile & testicular vascular branches
 * - Male urethra (replaced by co-registered short female urethra)
 * - Male urinary bladder (replaced by co-registered HuBMAP female urinary bladder)
 * - Male pelvic bones (sacrum + left/right hip bones replaced by co-registered HuBMAP female bony pelvis)
 */
export const FEMALE_REPLACED_MALE_PART_IDS: readonly string[] = [
  // Male reproductive organs
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
  // Male penile vessels
  'FJ2056', // Deep dorsal vein of penis
  'FJ2208', // Superficial dorsal vein of penis
  'FJ3426', // Left superficial dorsal vein of penis
  'FJ3496', // Left dorsal artery of penis
  'FJ3497', // Left dorsal artery of penis
  'FJ3592', // Right dorsal artery of penis
  'FJ3593', // Right dorsal artery of penis
  'FJ3637', // Right superficial dorsal vein of penis
  // Male testicular vessels
  'FJ3532', // Left testicular artery
  'FJ3533', // Left testicular vein
  'FJ3617', // Right testicular artery
  'FJ3618', // Right testicular vein
  // Male-proportioned urinary & pelvic structures replaced by HuBMAP Female equivalents
  'FJ3148', // Male urethra -> HF_URETHRA
  'FJ3149', // Male urinary bladder -> HF_BLADDER
  'FJ3152', // Right male hip bone -> HF_HIP_RIGHT
  'FJ3288', // Left male hip bone -> HF_HIP_LEFT
  'FJ3393', // Male sacrum -> HF_SACRUM
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
  'FMA18824', 'FMA18823',
  'FMA57991', 'FMA57990', 'FMA9601', 'FMA67804', 'FMA67806', 'FMA72025', 'FMA76818', 'FMA57995', 'FMA67796', 'FMA72031',
];

export const FEMALE_ONLY_CONCEPT_SET = new Set<string>(FEMALE_ONLY_CONCEPT_IDS);

export function isFemaleSpecificTarget(
  conceptId?: string | null,
  partId?: string | null,
): boolean {
  if (partId && partId.startsWith('HF_')) return true;
  if (conceptId && FEMALE_ONLY_CONCEPT_SET.has(conceptId)) return true;
  return false;
}

export function isMaleOnlyTarget(
  baseAtlas: Atlas | null,
  conceptId?: string | null,
  partId?: string | null,
): boolean {
  if (partId && FEMALE_REPLACED_MALE_PART_SET.has(partId)) return true;
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
    return 'The female reproductive structures represented here include the ovaries, uterine (Fallopian) tubes, uterus, cervix, vagina, external vulvar anatomy, supporting pelvic ligaments, and mammary glands.';
  }
  return fallbackDescription;
}

export interface FemaleAtlasManifest extends Atlas {
  sex: 'female';
  parts: (Part & { source?: string })[];
}

export const FEMALE_ATLAS_ATTRIBUTION =
  'Adult Female Pelvic & Reproductive Overlay: HuBMAP Human Reference Atlas (NLM Visible Human Female, CC BY 4.0) co-registered with BodyParts3D systemic reference.';

let cachedFemaleAtlasPromise: Promise<FemaleAtlasManifest> | null = null;

export async function loadFemaleAtlasManifest(): Promise<FemaleAtlasManifest> {
  if (!cachedFemaleAtlasPromise) {
    cachedFemaleAtlasPromise = fetch('/models/female/female-atlas.json').then(async (res) => {
      if (!res.ok) {
        cachedFemaleAtlasPromise = null;
        throw new Error(`Could not load female anatomical manifest (${res.status}).`);
      }
      return (await res.json()) as FemaleAtlasManifest;
    });
  }
  return cachedFemaleAtlasPromise;
}

export function isPartHiddenForSex(partId: string, sex: AnatomySex): boolean {
  if (sex === 'male') {
    return partId.startsWith('HF_');
  }
  return FEMALE_REPLACED_MALE_PART_SET.has(partId);
}

export function getActivePartsForSex(
  baseAtlas: Atlas,
  femaleOverlay: FemaleAtlasManifest | null,
  sex: AnatomySex,
): Part[] {
  if (sex === 'male' || !femaleOverlay) {
    return baseAtlas.parts;
  }
  const kept = baseAtlas.parts.filter((p) => !FEMALE_REPLACED_MALE_PART_SET.has(p.id));
  return [...kept, ...femaleOverlay.parts];
}

export function getActiveConceptsForSex(
  baseAtlas: Atlas,
  femaleOverlay: FemaleAtlasManifest | null,
  sex: AnatomySex,
): Concept[] {
  if (sex === 'male' || !femaleOverlay) {
    return baseAtlas.concepts;
  }

  const femalePartSet = new Set(femaleOverlay.parts.map((p) => p.id));
  const merged = new Map<string, Concept>();

  for (const c of baseAtlas.concepts) {
    const remaining = c.elements.filter((el) => !FEMALE_REPLACED_MALE_PART_SET.has(el));
    if (remaining.length > 0) {
      merged.set(c.id, { ...c, elements: remaining });
    }
  }

  for (const fc of femaleOverlay.concepts) {
    const validElements = fc.elements.filter((el) => femalePartSet.has(el));
    if (validElements.length === 0) continue;
    const existing = merged.get(fc.id);
    if (existing) {
      merged.set(fc.id, {
        ...fc,
        elements: Array.from(new Set([...existing.elements, ...validElements])),
      });
    } else {
      merged.set(fc.id, { ...fc, elements: validElements });
    }
  }

  return Array.from(merged.values());
}
