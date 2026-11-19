import * as T from 'three';
import type { SystemId } from '../anatomy';

/**
 * Tissue-Specific PBR Texture Infrastructure
 *
 * Provides tileable normal, roughness, and ambient occlusion (AO) maps per anatomical
 * tissue archetype with explicit color-space configuration, mipmapping, validation,
 * and deterministic GPU disposal.
 *
 * HONEST PROVENANCE DISCLOSURE:
 * All bundled runtime maps are explicitly labeled `procedural_approximation`.
 * No authentic 2K/4K photographic medical tissue textures are currently bundled in this
 * static repository. The `ExternalTexturePackSlot` interface allows dropping in licensed
 * CC BY 4.0 / CC0 PBR texture sets without rewriting the renderer.
 */

export type TissueSurfaceArchetype =
  | 'muscle_fibrous'
  | 'bone_cortical'
  | 'parenchyma_organ'
  | 'vascular_smooth'
  | 'tendon_fascia'
  | 'neural_tissue';

export interface TissueTextureSet {
  archetype: TissueSurfaceArchetype;
  provenance: 'procedural_approximation' | 'licensed_photographic_pack';
  resolution: number;
  normalMap: T.DataTexture;
  roughnessMap: T.DataTexture;
  aoMap: T.DataTexture;
  normalStrength: number;
  licenseNote: string;
}

export interface TextureValidationReport {
  valid: boolean;
  checkedArchetypes: number;
  errors: string[];
}

export interface ExternalTexturePackSlot {
  archetype: TissueSurfaceArchetype;
  baseColorUrl?: string;
  normalMapUrl?: string;
  roughnessMapUrl?: string;
  aoMapUrl?: string;
  license: string;
  attribution: string;
}

export function archetypeForSystem(system: SystemId): TissueSurfaceArchetype {
  switch (system) {
    case 'muscular':
    case 'cardiac':
      return 'muscle_fibrous';
    case 'skeletal':
      return 'bone_cortical';
    case 'arterial':
    case 'venous':
      return 'vascular_smooth';
    case 'connective':
      return 'tendon_fascia';
    case 'nervous':
    case 'sensory':
      return 'neural_tissue';
    default:
      return 'parenchyma_organ';
  }
}

/** Deterministic seamless 2D value noise on a periodic [0..period) grid */
function periodicHash(ix: number, iy: number, period: number, seed: number): number {
  const x = ((ix % period) + period) % period;
  const y = ((iy % period) + period) % period;
  let n = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  n = n ^ (n >>> 16);
  return (n >>> 0) / 4294967295;
}

function periodicSmoothNoise(u: number, v: number, freq: number, seed: number): number {
  const gx = u * freq;
  const gy = v * freq;
  const ix = Math.floor(gx);
  const iy = Math.floor(gy);
  const fx = gx - ix;
  const fy = gy - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);

  const n00 = periodicHash(ix, iy, freq, seed);
  const n10 = periodicHash(ix + 1, iy, freq, seed);
  const n01 = periodicHash(ix, iy + 1, freq, seed);
  const n11 = periodicHash(ix + 1, iy + 1, freq, seed);

  const nx0 = n00 + (n10 - n00) * sx;
  const nx1 = n01 + (n11 - n01) * sx;
  return nx0 + (nx1 - nx0) * sy;
}

function periodicFbm(u: number, v: number, baseFreq: number, octaves: number, seed: number): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let freq = baseFreq;
  for (let o = 0; o < octaves; o++) {
    sum += amp * periodicSmoothNoise(u, v, freq, seed + o * 31);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

/**
 * Synthesizes a seamless scalar heightfield [0..1] for each biological surface archetype.
 * Intentionally restrained so anatomical silhouettes and colors remain scientifically clear.
 */
function sampleArchetypeHeight(archetype: TissueSurfaceArchetype, u: number, v: number): number {
  switch (archetype) {
    case 'muscle_fibrous': {
      // Anisotropic longitudinal muscle fascicle bundles + fine perimysium micro-variation
      const bundle = Math.sin(u * Math.PI * 2 * 18 + periodicFbm(u, v, 4, 2, 11) * 2.2) * 0.5 + 0.5;
      const micro = periodicFbm(u * 4, v, 8, 3, 17);
      return 0.65 * bundle + 0.35 * micro;
    }
    case 'bone_cortical': {
      // Subtle periosteal porous grain and fine longitudinal osteon channels
      const grain = periodicFbm(u, v, 12, 3, 23);
      const streak = periodicFbm(u * 2, v, 6, 2, 29);
      return 0.7 * grain + 0.3 * streak;
    }
    case 'parenchyma_organ': {
      // Gentle lobular/capsular organic relief (liver, kidney, lung, GI)
      const lobule = periodicFbm(u, v, 8, 3, 41);
      const fine = periodicFbm(u, v, 24, 2, 47);
      return 0.72 * lobule + 0.28 * fine;
    }
    case 'vascular_smooth': {
      // Smooth hydrated adventitia with faint longitudinal/circumferential collagen texture
      const smooth = periodicFbm(u, v, 6, 2, 53);
      const ring = Math.sin(v * Math.PI * 2 * 10) * 0.5 + 0.5;
      return 0.75 * smooth + 0.25 * ring;
    }
    case 'tendon_fascia': {
      // Fine parallel dense regular collagen fibrils
      const fibril = Math.sin(u * Math.PI * 2 * 26) * 0.5 + 0.5;
      const sheen = periodicFbm(u * 3, v, 6, 2, 61);
      return 0.68 * fibril + 0.32 * sheen;
    }
    case 'neural_tissue': {
      // Subtle pia-like soft organic micro-undulation
      const soft = periodicFbm(u, v, 6, 3, 71);
      return soft;
    }
  }
}

function configureDataTexture(tex: T.DataTexture, maxAnisotropy: number): T.DataTexture {
  tex.wrapS = T.RepeatWrapping;
  tex.wrapT = T.RepeatWrapping;
  tex.colorSpace = T.NoColorSpace; // Data maps (normal, roughness, AO) MUST stay linear
  tex.generateMipmaps = true;
  tex.minFilter = T.LinearMipmapLinearFilter;
  tex.magFilter = T.LinearFilter;
  tex.anisotropy = Math.max(1, Math.min(8, maxAnisotropy));
  tex.needsUpdate = true;
  return tex;
}

export function buildTissueTextureSet(
  archetype: TissueSurfaceArchetype,
  resolution = 128,
  maxAnisotropy = 4,
): TissueTextureSet {
  const size = resolution;
  const height = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      height[y * size + x] = sampleArchetypeHeight(archetype, u, v);
    }
  }

  const normalData = new Uint8Array(size * size * 4);
  const roughData = new Uint8Array(size * size * 4);
  const aoData = new Uint8Array(size * size * 4);

  const bumpGainByArchetype: Record<TissueSurfaceArchetype, number> = {
    muscle_fibrous: 1.55,
    bone_cortical: 1.2,
    parenchyma_organ: 1.05,
    vascular_smooth: 0.65,
    tendon_fascia: 1.25,
    neural_tissue: 0.75,
  };
  const normalStrengthByArchetype: Record<TissueSurfaceArchetype, number> = {
    muscle_fibrous: 0.34,
    bone_cortical: 0.24,
    parenchyma_organ: 0.22,
    vascular_smooth: 0.14,
    tendon_fascia: 0.26,
    neural_tissue: 0.16,
  };

  const gain = bumpGainByArchetype[archetype];

  for (let y = 0; y < size; y++) {
    const ym = (y - 1 + size) % size;
    const yp = (y + 1) % size;
    for (let x = 0; x < size; x++) {
      const xm = (x - 1 + size) % size;
      const xp = (x + 1) % size;

      const hL = height[y * size + xm];
      const hR = height[y * size + xp];
      const hD = height[ym * size + x];
      const hU = height[yp * size + x];
      const hC = height[y * size + x];

      const dx = (hL - hR) * gain;
      const dy = (hD - hU) * gain;
      const dz = 1.0;
      const invLen = 1 / Math.hypot(dx, dy, dz);

      const idx = (y * size + x) * 4;
      normalData[idx] = Math.round(((dx * invLen) * 0.5 + 0.5) * 255);
      normalData[idx + 1] = Math.round(((dy * invLen) * 0.5 + 0.5) * 255);
      normalData[idx + 2] = Math.round(((dz * invLen) * 0.5 + 0.5) * 255);
      normalData[idx + 3] = 255;

      // Restrained roughness multiplier centered around ~0.92..1.0 so per-part roughness stays accurate
      const roughByte = Math.round(T.MathUtils.clamp(0.86 + hC * 0.14, 0.78, 1.0) * 255);
      roughData[idx] = roughByte;
      roughData[idx + 1] = roughByte;
      roughData[idx + 2] = roughByte;
      roughData[idx + 3] = 255;

      // Subtle crevice ambient occlusion (0.86..1.0) to accentuate fascicle & lobule depth
      const aoByte = Math.round(T.MathUtils.clamp(0.86 + hC * 0.14, 0.82, 1.0) * 255);
      aoData[idx] = aoByte;
      aoData[idx + 1] = aoByte;
      aoData[idx + 2] = aoByte;
      aoData[idx + 3] = 255;
    }
  }

  const normalMap = configureDataTexture(new T.DataTexture(normalData, size, size, T.RGBAFormat), maxAnisotropy);
  const roughnessMap = configureDataTexture(new T.DataTexture(roughData, size, size, T.RGBAFormat), maxAnisotropy);
  const aoMap = configureDataTexture(new T.DataTexture(aoData, size, size, T.RGBAFormat), maxAnisotropy);

  return {
    archetype,
    provenance: 'procedural_approximation',
    resolution: size,
    normalMap,
    roughnessMap,
    aoMap,
    normalStrength: normalStrengthByArchetype[archetype],
    licenseNote: 'MIT procedural PBR approximation (no photographic medical tissue scan bundled).',
  };
}

export interface TissueTextureLibrary {
  sets: Record<TissueSurfaceArchetype, TissueTextureSet>;
  getForSystem: (system: SystemId) => TissueTextureSet;
  validate: () => TextureValidationReport;
  dispose: () => void;
}

const ALL_ARCHETYPES: TissueSurfaceArchetype[] = [
  'muscle_fibrous',
  'bone_cortical',
  'parenchyma_organ',
  'vascular_smooth',
  'tendon_fascia',
  'neural_tissue',
];

export function createTissueTextureLibrary(
  resolution = 128,
  maxAnisotropy = 4,
): TissueTextureLibrary {
  const sets = {} as Record<TissueSurfaceArchetype, TissueTextureSet>;
  for (const arch of ALL_ARCHETYPES) {
    sets[arch] = buildTissueTextureSet(arch, resolution, maxAnisotropy);
  }

  return {
    sets,
    getForSystem: (system) => sets[archetypeForSystem(system)],
    validate: () => validateTissueTextureLibrary(sets),
    dispose: () => {
      for (const arch of ALL_ARCHETYPES) {
        sets[arch].normalMap.dispose();
        sets[arch].roughnessMap.dispose();
        sets[arch].aoMap.dispose();
      }
    },
  };
}

export function validateTissueTextureLibrary(
  sets: Record<TissueSurfaceArchetype, TissueTextureSet>,
): TextureValidationReport {
  const errors: string[] = [];
  for (const arch of ALL_ARCHETYPES) {
    const s = sets[arch];
    if (!s) {
      errors.push(`Missing texture set for archetype "${arch}"`);
      continue;
    }
    const isPow2 = s.resolution > 0 && (s.resolution & (s.resolution - 1)) === 0;
    if (!isPow2) {
      errors.push(`Archetype "${arch}" has non-power-of-two resolution ${s.resolution}`);
    }
    for (const [name, tex] of [
      ['normalMap', s.normalMap],
      ['roughnessMap', s.roughnessMap],
      ['aoMap', s.aoMap],
    ] as const) {
      if (!tex || !tex.image) {
        errors.push(`Archetype "${arch}" missing ${name} image data`);
        continue;
      }
      if (tex.colorSpace !== T.NoColorSpace) {
        errors.push(`Archetype "${arch}" ${name} must use linear NoColorSpace, found ${tex.colorSpace}`);
      }
      if (tex.wrapS !== T.RepeatWrapping || tex.wrapT !== T.RepeatWrapping) {
        errors.push(`Archetype "${arch}" ${name} must use RepeatWrapping`);
      }
    }
  }
  return {
    valid: errors.length === 0,
    checkedArchetypes: ALL_ARCHETYPES.length,
    errors,
  };
}
