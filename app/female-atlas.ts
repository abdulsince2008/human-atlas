import type { Atlas, Concept, Part } from './anatomy';

export type AnatomySex = 'male' | 'female';

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
