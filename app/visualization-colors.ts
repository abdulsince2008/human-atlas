import type { Atlas, ClippingPlaneState, Part } from './anatomy';

/**
 * Multi-Layer Visualization Color & Anatomical Pilot Registry
 *
 * Pure, deterministic module powering:
 *  1. Colorblind-safe Regional Brain Color Architecture (on by default, toggleable)
 *  2. 7 Anatomical Brain Viewing Presets (Anterior, Posterior, Left/Right Lateral, Superior, Inferior, Medial)
 *  3. Functional Muscle Role Visualization Pilots (Upper Limb: Elbow Flexion & Shoulder Abduction)
 *  4. Unified Per-Part GPU Color Override Resolver (for partColorTexture)
 */

export type BrainRegionId =
  | 'frontal_lobe'
  | 'parietal_lobe'
  | 'temporal_lobe'
  | 'occipital_lobe'
  | 'limbic_insula'
  | 'diencephalon_basal'
  | 'cerebellum'
  | 'brainstem'
  | 'ventricular_system'
  | 'cranial_nerves_dura';

export interface BrainRegionSpec {
  id: BrainRegionId;
  label: string;
  shortLabel: string;
  color: string;
  functionalSummary: string;
  explicitPartIds: string[];
  namePattern: RegExp;
}

/**
 * Colorblind-safe distinct palette inspired by Okabe–Ito / Paul Tol scientific palettes,
 * tuned for legibility under ACES Filmic tone mapping in the 3D scene.
 */
export const BRAIN_REGION_SPECS: BrainRegionSpec[] = [
  {
    id: 'frontal_lobe',
    label: 'Frontal Lobe & Motor Cortex',
    shortLabel: 'Frontal',
    color: '#2E86AB',
    functionalSummary: 'Executive cognition, voluntary motor output (precentral gyrus), and expressive speech.',
    explicitPartIds: [
      'FJ1833', 'FJ1834', 'FJ1787', 'FJ1788', 'FJ1744', 'FJ1745',
      'FJ1800', 'FJ1801', 'FJ1793', 'FJ1794',
    ],
    namePattern: /frontal gyrus|precentral gyrus|orbital gyrus|frontal lobe/i,
  },
  {
    id: 'parietal_lobe',
    label: 'Parietal Lobe & Somatosensory Cortex',
    shortLabel: 'Parietal',
    color: '#44AF69',
    functionalSummary: 'Primary somatosensation (postcentral gyrus), spatial awareness, and multimodal integration.',
    explicitPartIds: [
      'FJ1797', 'FJ1798', 'FJ1835', 'FJ1836', 'FJ1732', 'FJ1733', 'FJ1841', 'FJ1842',
    ],
    namePattern: /parietal|postcentral gyrus|angular gyrus|supramarginal gyrus/i,
  },
  {
    id: 'temporal_lobe',
    label: 'Temporal Lobe',
    shortLabel: 'Temporal',
    color: '#E69F00',
    functionalSummary: 'Auditory processing, language comprehension, and visual-memory association.',
    explicitPartIds: [
      'FJ1746', 'FJ1747', 'FJ1789', 'FJ1790', 'FJ1837', 'FJ1838', 'FJ1839', 'FJ1840',
      'FJ1783', 'FJ1784',
    ],
    namePattern: /temporal gyrus|fusiform gyrus|temporal lobe/i,
  },
  {
    id: 'occipital_lobe',
    label: 'Occipital Lobe',
    shortLabel: 'Occipital',
    color: '#9B5DE5',
    functionalSummary: 'Primary and associative visual cortex processing retinal input.',
    explicitPartIds: ['FJ1791', 'FJ1792'],
    namePattern: /occipital lobe|calcarine|cuneus/i,
  },
  {
    id: 'limbic_insula',
    label: 'Limbic System & Insula',
    shortLabel: 'Limbic / Insula',
    color: '#D55E00',
    functionalSummary: 'Memory consolidation (hippocampus), emotional salience (amygdala), cingulate, and interoception (insula).',
    explicitPartIds: [
      'FJ1748', 'FJ1749', 'FJ1739', 'FJ1740', 'FJ1785', 'FJ1786',
      'FJ1759', 'FJ1807', 'FJ1753', 'FJ1829', 'FJ1756', 'FJ1804', 'FJ1815', 'FJ1832',
    ],
    namePattern: /insula|cingulate|parahippocampal|hippocampus|amygdala|fornix|mammillary|septum of telencephalon/i,
  },
  {
    id: 'diencephalon_basal',
    label: 'Diencephalon, Basal Nuclei & White Matter',
    shortLabel: 'Diencephalon & Nuclei',
    color: '#009E73',
    functionalSummary: 'Thalamic sensory relay, hypothalamic homeostasis, basal ganglia motor loops, corpus callosum, and internal capsule.',
    explicitPartIds: [
      'FJ1742', 'FJ1758', 'FJ1806', 'FJ1750', 'FJ1751', 'FJ1734', 'FJ1799',
      'FJ1782', 'FJ1827', 'FJ1760', 'FJ1808', 'FJ1754', 'FJ1802',
      'FJ1776', 'FJ1823', 'FJ1757', 'FJ1805', 'FJ1796', 'FJ1795',
      'FJ1777', 'FJ1824', 'FJ1778', 'FJ1825', 'FJ1780', 'FJ1828', 'FJ1812',
      'FJ1813', 'FJ1816', 'FJ1816M',
    ],
    namePattern: /thalamus|hypothalamus|caudate|putamen|globus pallidus|corpus callosum|internal capsule|white matter of .*cerebral|pituitary|pineal|commissure|geniculate|stria medullaris|stria terminalis|tuber cinereum|lamina terminalis/i,
  },
  {
    id: 'cerebellum',
    label: 'Cerebellum',
    shortLabel: 'Cerebellum',
    color: '#CC79A7',
    functionalSummary: 'Motor coordination, postural balance, error correction, and smooth eye-movement calibration.',
    explicitPartIds: ['FJ1781', 'FJ1830'],
    namePattern: /\bcerebellum\b/i,
  },
  {
    id: 'brainstem',
    label: 'Brainstem (Midbrain, Pons & Medulla)',
    shortLabel: 'Brainstem',
    color: '#B85D3B',
    functionalSummary: 'Cardiorespiratory autonomic centers, cranial nerve nuclei, and ascending/descending neural tracts.',
    explicitPartIds: [
      'FJ1770', 'FJ1817', 'FJ1775', 'FJ1822', 'FJ1769', 'FJ1831',
      'FJ1774', 'FJ1821', 'FJ1779', 'FJ1826', 'FJ1809', 'FJ1810', 'FJ1811',
    ],
    namePattern: /midbrain|\bpons\b|medulla oblongata|colliculus|interpeduncular/i,
  },
  {
    id: 'ventricular_system',
    label: 'Ventricular System & Choroid Plexus',
    shortLabel: 'Ventricles',
    color: '#56B4E9',
    functionalSummary: 'Cerebrospinal fluid production and circulation through lateral, third, and fourth ventricles.',
    explicitPartIds: ['FJ1767', 'FJ1814', 'FJ1730', 'FJ1731', 'FJ1738', 'FJ1755', 'FJ1803'],
    namePattern: /ventricle|cerebral aqueduct|choroid plexus/i,
  },
  {
    id: 'cranial_nerves_dura',
    label: 'Optic Pathways & Tentorium Cerebelli',
    shortLabel: 'Optic & Dura',
    color: '#C8A415',
    functionalSummary: 'Optic nerves, chiasm, optic tracts, oculomotor/trochlear nerves, and dural tentorium cerebelli.',
    explicitPartIds: [
      'FJ1772', 'FJ1819', 'FJ1771', 'FJ1818', 'FJ1773', 'FJ1820',
      'FJ1313', 'FJ1364', 'FJ1293', 'FJ1321', 'FJ1344', 'FJ1372',
      'FJ1330', 'FJ1381', 'FJ1843',
    ],
    namePattern: /optic nerve|optic chiasm|optic tract|oculomotor|trochlear|tentorium cerebelli/i,
  },
];

/** Honest audit of brain/meningeal structures NOT individually modeled in BodyParts3D 4.0 */
export const MISSING_BRAIN_ASSETS: string[] = [
  'Falx cerebri, arachnoid mater, and pia mater (only tentorium cerebelli FJ1843 is modeled as a dural partition)',
  'Individual trigeminal (CN V), facial (CN VII), vestibulocochlear (CN VIII), and lower cranial nerves (CN IX–XII) within the brainstem cisterns',
  'Fine Brodmann-level cortical sub-parcellations beyond the major BodyParts3D gyri',
];

export interface BrainRegionResolution {
  regionByPartId: Map<string, BrainRegionSpec>;
  partIdsByRegion: Map<BrainRegionId, string[]>;
  totalMappedParts: number;
  allBrainPartIds: string[];
  brainBounds: { min: [number, number, number]; max: [number, number, number] };
}

const DEFAULT_BRAIN_BOUNDS: { min: [number, number, number]; max: [number, number, number] } = {
  min: [-0.085, 1.54, -0.11],
  max: [0.085, 1.72, 0.09],
};

export function resolveBrainRegions(atlas: Atlas): BrainRegionResolution {
  const regionByPartId = new Map<string, BrainRegionSpec>();
  const partIdsByRegion = new Map<BrainRegionId, string[]>(
    BRAIN_REGION_SPECS.map((spec) => [spec.id, []]),
  );

  // Explicit ID pass first (highest precision)
  const explicitLookup = new Map<string, BrainRegionSpec>();
  for (const spec of BRAIN_REGION_SPECS) {
    for (const pid of spec.explicitPartIds) {
      explicitLookup.set(pid, spec);
    }
  }

  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  for (const p of atlas.parts) {
    let matched = explicitLookup.get(p.id);
    if (!matched) {
      const cy = (p.bounds[0][1] + p.bounds[1][1]) * 0.5;
      if ((p.system === 'nervous' || p.system === 'endocrine') && cy > 1.53) {
        matched = BRAIN_REGION_SPECS.find((spec) => spec.namePattern.test(p.name));
      }
    }
    if (!matched) continue;
    regionByPartId.set(p.id, matched);
    partIdsByRegion.get(matched.id)!.push(p.id);

    minX = Math.min(minX, p.bounds[0][0]);
    minY = Math.min(minY, p.bounds[0][1]);
    minZ = Math.min(minZ, p.bounds[0][2]);
    maxX = Math.max(maxX, p.bounds[1][0]);
    maxY = Math.max(maxY, p.bounds[1][1]);
    maxZ = Math.max(maxZ, p.bounds[1][2]);
  }

  const allBrainPartIds = Array.from(regionByPartId.keys());
  const brainBounds =
    allBrainPartIds.length > 0 && Number.isFinite(minX)
      ? {
          min: [minX, minY, minZ] as [number, number, number],
          max: [maxX, maxY, maxZ] as [number, number, number],
        }
      : DEFAULT_BRAIN_BOUNDS;

  return {
    regionByPartId,
    partIdsByRegion,
    totalMappedParts: allBrainPartIds.length,
    allBrainPartIds,
    brainBounds,
  };
}

export type BrainCameraPresetId =
  | 'anterior'
  | 'posterior'
  | 'left_lateral'
  | 'right_lateral'
  | 'superior'
  | 'inferior'
  | 'medial';

export interface BrainCameraPreset {
  id: BrainCameraPresetId;
  label: string;
  viewDirection: [number, number, number];
  clipping?: ClippingPlaneState;
  note: string;
}

export const BRAIN_CAMERA_PRESETS: BrainCameraPreset[] = [
  {
    id: 'anterior',
    label: 'Anterior',
    viewDirection: [0, 0.06, 1],
    note: 'Frontal poles, orbital gyri, and optic chiasm orientation.',
  },
  {
    id: 'posterior',
    label: 'Posterior',
    viewDirection: [0, 0.06, -1],
    note: 'Occipital lobes, tentorium cerebelli, and cerebellar hemispheres.',
  },
  {
    id: 'left_lateral',
    label: 'Left Lateral',
    viewDirection: [1, 0.05, 0.05],
    note: 'Left hemisphere frontal, parietal, temporal, and occipital sulcal landmarks.',
  },
  {
    id: 'right_lateral',
    label: 'Right Lateral',
    viewDirection: [-1, 0.05, 0.05],
    note: 'Right hemisphere lateral convexity and cerebellar profile.',
  },
  {
    id: 'superior',
    label: 'Superior',
    viewDirection: [0, 1, 0.14],
    note: 'Dorsal longitudinal fissure, precentral/postcentral gyri, and parietal lobules.',
  },
  {
    id: 'inferior',
    label: 'Inferior',
    viewDirection: [0, -1, 0.18],
    note: 'Ventral brainstem (midbrain, pons, medulla), cerebellum, and pituitary fossa.',
  },
  {
    id: 'medial',
    label: 'Medial (Sagittal Cut)',
    viewDirection: [1, 0.04, 0.1],
    clipping: { enabled: true, axis: 'x', offset: 0.5, inverted: false },
    note: 'Midsagittal section revealing corpus callosum, thalamus, ventricles, and brainstem.',
  },
];

// ---------------------------------------------------------------------------
// Functional Muscle Role Pilots (Upper Limb — Rigid-Body Kinematics + Roles)
// ---------------------------------------------------------------------------

export type MuscleFunctionalRole = 'agonist' | 'antagonist' | 'synergist' | 'stabilizer';

export const MUSCLE_ROLE_META: Record<
  MuscleFunctionalRole,
  { label: string; color: string; description: string }
> = {
  agonist: {
    label: 'Agonist (Prime Mover)',
    color: '#1B7F79',
    description: 'Primary contracting muscle generating the target joint movement.',
  },
  antagonist: {
    label: 'Antagonist',
    color: '#C84B31',
    description: 'Opposing muscle group that lengthens and modulates speed/control.',
  },
  synergist: {
    label: 'Synergist',
    color: '#2E86AB',
    description: 'Assisting muscle reinforcing torque or neutralizing unwanted motion.',
  },
  stabilizer: {
    label: 'Stabilizer',
    color: '#C68B17',
    description: 'Proximal joint stabilizer anchoring the scapula or humeral head.',
  },
};

export interface FunctionalMusclePilot {
  id: string;
  title: string;
  jointName: string;
  animationId: string | null;
  summary: string;
  scopeNote: string;
  focusBounds: { min: [number, number, number]; max: [number, number, number] };
  roles: {
    role: MuscleFunctionalRole;
    partPatterns: RegExp[];
    muscleNames: string[];
  }[];
}

export const FUNCTIONAL_MUSCLE_PILOTS: FunctionalMusclePilot[] = [
  {
    id: 'elbow-flexion',
    title: 'Elbow Flexion (Upper Limb)',
    jointName: 'Humeroulnar & Humeroradial Joint',
    animationId: 'elbow-flexion',
    summary:
      'Demonstrates anterior arm flexors (brachialis, biceps brachii) opposing posterior triceps brachii across the elbow hinge.',
    scopeNote:
      'Rigid-body skeletal kinematics paired with color-coded muscle functional roles. Soft-tissue muscle belly shortening/bulging is not simulated.',
    focusBounds: { min: [-0.4, 0.92, -0.14], max: [-0.08, 1.44, 0.14] },
    roles: [
      {
        role: 'agonist',
        partPatterns: [/right brachialis/i, /right biceps brachii/i],
        muscleNames: ['Right brachialis', 'Right biceps brachii (long & short heads)'],
      },
      {
        role: 'antagonist',
        partPatterns: [/right triceps brachii/i],
        muscleNames: ['Right triceps brachii (long, lateral & medial heads)'],
      },
      {
        role: 'synergist',
        partPatterns: [/right pronator teres/i, /right coracobrachialis/i],
        muscleNames: ['Right pronator teres', 'Right coracobrachialis'],
      },
      {
        role: 'stabilizer',
        partPatterns: [/right deltoid/i, /right supraspinatus/i],
        muscleNames: ['Right deltoid', 'Right supraspinatus'],
      },
    ],
  },
  {
    id: 'shoulder-abduction',
    title: 'Shoulder Abduction (Glenohumeral)',
    jointName: 'Glenohumeral Joint',
    animationId: null,
    summary:
      'Highlights supraspinatus initiation and acromial deltoid abduction balanced by pectoralis major/teres major adductors and rotator cuff stabilizers.',
    scopeNote:
      'Functional anatomical role visualization on verified BodyParts3D shoulder musculature. Full scapulohumeral rhythm rigging is planned for a future GLB rig pack.',
    focusBounds: { min: [-0.38, 1.15, -0.16], max: [0.02, 1.54, 0.16] },
    roles: [
      {
        role: 'agonist',
        partPatterns: [/right deltoid/i, /right supraspinatus/i],
        muscleNames: ['Right deltoid (acromial, clavicular, spinal)', 'Right supraspinatus'],
      },
      {
        role: 'antagonist',
        partPatterns: [/right pectoralis major/i, /right teres major/i],
        muscleNames: ['Right pectoralis major', 'Right teres major'],
      },
      {
        role: 'synergist',
        partPatterns: [/long head of right biceps brachii/i],
        muscleNames: ['Long head of right biceps brachii'],
      },
      {
        role: 'stabilizer',
        partPatterns: [/right infraspinatus/i, /right teres minor/i],
        muscleNames: ['Right infraspinatus', 'Right teres minor'],
      },
    ],
  },
];

export function resolveMusclePilotColors(
  atlas: Atlas,
  pilotId: string,
): { partColors: Record<string, string>; matchedPartIds: string[]; countsByRole: Record<MuscleFunctionalRole, number> } {
  const pilot = FUNCTIONAL_MUSCLE_PILOTS.find((p) => p.id === pilotId);
  const partColors: Record<string, string> = {};
  const matchedPartIds: string[] = [];
  const countsByRole: Record<MuscleFunctionalRole, number> = {
    agonist: 0,
    antagonist: 0,
    synergist: 0,
    stabilizer: 0,
  };
  if (!pilot) return { partColors, matchedPartIds, countsByRole };

  for (const p of atlas.parts) {
    if (p.system !== 'muscular') continue;
    for (const group of pilot.roles) {
      if (group.partPatterns.some((rx) => rx.test(p.name))) {
        partColors[p.id] = MUSCLE_ROLE_META[group.role].color;
        matchedPartIds.push(p.id);
        countsByRole[group.role]++;
        break;
      }
    }
  }
  return { partColors, matchedPartIds, countsByRole };
}

// ---------------------------------------------------------------------------
// Unified Color Layer Resolver (Deterministic Priority for GPU partColorTexture)
// ---------------------------------------------------------------------------

export interface ColorLayerInput {
  atlas: Atlas;
  brainRegionalEnabled: boolean;
  activeMusclePilotId?: string | null;
  relationshipColors?: Record<string, string> | null;
}

/**
 * Resolves the final per-part hex color override map.
 * Priority (highest wins):
 *   1. Relationship role colors (3D Relationship Explorer)
 *   2. Active Functional Muscle Pilot role colors
 *   3. Regional Brain Palette (enabled by default, toggleable)
 */
export function resolvePartColorOverrides(input: ColorLayerInput): Record<string, string> {
  const out: Record<string, string> = {};

  if (input.brainRegionalEnabled) {
    const brain = resolveBrainRegions(input.atlas);
    for (const [partId, spec] of brain.regionByPartId.entries()) {
      out[partId] = spec.color;
    }
  }

  if (input.activeMusclePilotId) {
    const muscle = resolveMusclePilotColors(input.atlas, input.activeMusclePilotId);
    for (const [partId, hex] of Object.entries(muscle.partColors)) {
      out[partId] = hex;
    }
  }

  if (input.relationshipColors) {
    for (const [partId, hex] of Object.entries(input.relationshipColors)) {
      out[partId] = hex;
    }
  }

  return out;
}

/**
 * Parses a #RRGGBB hex string into [r, g, b] bytes (0..255).
 * Returns null if invalid.
 */
export function hexToRgbBytes(hex: string): [number, number, number] | null {
  const clean = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function getPartCenter(part: Part): [number, number, number] {
  return [
    (part.bounds[0][0] + part.bounds[1][0]) * 0.5,
    (part.bounds[0][1] + part.bounds[1][1]) * 0.5,
    (part.bounds[0][2] + part.bounds[1][2]) * 0.5,
  ];
}
