import type { Atlas, Part } from './anatomy';

/**
 * Tissue Material Registry & Visualization Mode System
 *
 * Enforces Natural Anatomy as the default rendering appearance across the entire body.
 * Every mesh is classified by anatomical tissue type (bone, skeletal muscle, tendon,
 * ligament, cartilage, grey/white neural matter, peripheral nerve, vessels, visceral
 * parenchyma, skin, fascia) rather than arbitrary rainbow or index-based colors.
 */

export const MATERIAL_REGISTRY_VERSION = 1;

export type VisualizationMode =
  | 'natural'
  | 'system_highlight'
  | 'regional_brain'
  | 'relationship'
  | 'muscle_role'
  | 'tissue_classification'
  | 'dissection_layer'
  | 'cross_section';

export interface VisualizationModeMeta {
  id: VisualizationMode;
  label: string;
  shortLabel: string;
  description: string;
  isDefault?: boolean;
}

export const VISUALIZATION_MODES: VisualizationModeMeta[] = [
  {
    id: 'natural',
    label: 'Natural Anatomy',
    shortLabel: 'Natural',
    description: 'Anatomically realistic tissue appearance (bone, muscle, tendon, grey/white brain matter, organs) without arbitrary color overlays.',
    isDefault: true,
  },
  {
    id: 'system_highlight',
    label: 'Anatomical System Highlight',
    shortLabel: 'Systems',
    description: 'Uses standard system-level tinting to distinguish skeletal, muscular, vascular, and nervous networks.',
  },
  {
    id: 'regional_brain',
    label: 'Regional Brain Overlay (Optional)',
    shortLabel: 'Brain Regions',
    description: 'Optional colorblind-safe overlay distinguishing cerebral lobes, cerebellum, brainstem, diencephalon, and ventricles.',
  },
  {
    id: 'tissue_classification',
    label: 'Tissue Classification',
    shortLabel: 'Tissues',
    description: 'Highlights distinct anatomical tissue classes (compact bone, skeletal muscle, fibrous tendon/ligament, cartilage, neural, visceral).',
  },
  {
    id: 'muscle_role',
    label: 'Functional Muscle Highlight',
    shortLabel: 'Muscle Roles',
    description: 'Highlights agonist, antagonist, synergist, and stabilizer muscle roles for active upper-limb pilots.',
  },
  {
    id: 'relationship',
    label: 'Relationship Highlight',
    shortLabel: 'Relations',
    description: 'Highlights connected anatomical structures and illustrative spatial relationships.',
  },
  {
    id: 'dissection_layer',
    label: 'Dissection & Layer Exploration',
    shortLabel: 'Dissection',
    description: 'Natural tissue rendering paired with reversible layer-by-layer removal and depth inspection.',
  },
  {
    id: 'cross_section',
    label: 'Cross-Sectional Anatomy',
    shortLabel: 'Cross-Section',
    description: 'Natural tissue rendering with interactive Sagittal, Axial, and Coronal clipping planes.',
  },
];

export type TissueType =
  | 'compact_bone'
  | 'teeth_enamel'
  | 'cartilage'
  | 'skeletal_muscle'
  | 'cardiac_muscle'
  | 'tendon'
  | 'ligament'
  | 'fascia_membrane'
  | 'adipose'
  | 'skin_surface'
  | 'arterial_wall'
  | 'venous_wall'
  | 'brain_grey_matter'
  | 'brain_white_matter'
  | 'brain_cerebellum'
  | 'brain_brainstem'
  | 'ventricle_csf'
  | 'peripheral_nerve'
  | 'liver_parenchyma'
  | 'lung_parenchyma'
  | 'kidney_parenchyma'
  | 'spleen_parenchyma'
  | 'gi_viscera'
  | 'endocrine_gland'
  | 'lymphoid'
  | 'ocular_sensory'
  | 'reproductive_tissue';

export interface TissueMaterialPreset {
  id: TissueType;
  label: string;
  /** Natural anatomical base color (sRGB hex, evidence-grounded, never neon/rainbow) */
  naturalColor: string;
  /** Distinct educational classification color when Tissue Classification mode is explicitly enabled */
  classificationColor: string;
  roughness: number;
  metalness: number;
  opacity: number;
  materialNote: string;
}

export const TISSUE_MATERIAL_PRESETS: Record<TissueType, TissueMaterialPreset> = {
  compact_bone: {
    id: 'compact_bone',
    label: 'Bone (Osseous Tissue)',
    naturalColor: '#DDD4BC',
    classificationColor: '#E5DEC9',
    roughness: 0.62,
    metalness: 0.02,
    opacity: 1,
    materialNote: 'Natural ivory/cream mineralized bone surface with subtle matte finish.',
  },
  teeth_enamel: {
    id: 'teeth_enamel',
    label: 'Dental Enamel',
    naturalColor: '#ECE8DC',
    classificationColor: '#F2EFE6',
    roughness: 0.28,
    metalness: 0.04,
    opacity: 1,
    materialNote: 'Smooth mineralized enamel surface.',
  },
  cartilage: {
    id: 'cartilage',
    label: 'Hyaline & Fibrocartilage',
    naturalColor: '#BDC9CC',
    classificationColor: '#7FA8B8',
    roughness: 0.36,
    metalness: 0.02,
    opacity: 0.94,
    materialNote: 'Smooth bluish-pearl avascular cartilage surface.',
  },
  skeletal_muscle: {
    id: 'skeletal_muscle',
    label: 'Skeletal Muscle',
    naturalColor: '#9E4A42',
    classificationColor: '#A8443A',
    roughness: 0.56,
    metalness: 0.02,
    opacity: 1,
    materialNote: 'Natural deep red-brown striated myofibrillar tissue.',
  },
  cardiac_muscle: {
    id: 'cardiac_muscle',
    label: 'Cardiac Myocardium',
    naturalColor: '#96423D',
    classificationColor: '#B53838',
    roughness: 0.46,
    metalness: 0.02,
    opacity: 1,
    materialNote: 'Moist, vascularized myocardial tissue.',
  },
  tendon: {
    id: 'tendon',
    label: 'Tendon (Dense Regular Connective)',
    naturalColor: '#D7CEBC',
    classificationColor: '#C8B98B',
    roughness: 0.46,
    metalness: 0.03,
    opacity: 1,
    materialNote: 'Pale fibrous collagenous tendon sheen.',
  },
  ligament: {
    id: 'ligament',
    label: 'Ligament & Joint Capsule',
    naturalColor: '#C8C0AE',
    classificationColor: '#B0A07A',
    roughness: 0.52,
    metalness: 0.02,
    opacity: 1,
    materialNote: 'Dense fibrous articular connective tissue.',
  },
  fascia_membrane: {
    id: 'fascia_membrane',
    label: 'Fascia & Meningeal Membrane',
    naturalColor: '#CFCAC0',
    classificationColor: '#9CA8A4',
    roughness: 0.48,
    metalness: 0.02,
    opacity: 0.92,
    materialNote: 'Thin pearlescent fibrous membrane or aponeurosis.',
  },
  adipose: {
    id: 'adipose',
    label: 'Adipose Soft Tissue',
    naturalColor: '#DEC78A',
    classificationColor: '#D4B65E',
    roughness: 0.50,
    metalness: 0.01,
    opacity: 1,
    materialNote: 'Natural soft yellowish lobulated fat tissue.',
  },
  skin_surface: {
    id: 'skin_surface',
    label: 'Skin (Integument)',
    naturalColor: '#C69E82',
    classificationColor: '#C69E82',
    roughness: 0.64,
    metalness: 0.0,
    opacity: 0.12,
    materialNote: 'Natural cutaneous reference surface.',
  },
  arterial_wall: {
    id: 'arterial_wall',
    label: 'Arterial Vasculature',
    naturalColor: '#A63D38',
    classificationColor: '#C43832',
    roughness: 0.44,
    metalness: 0.03,
    opacity: 1,
    materialNote: 'Muted oxygenated arterial wall without neon saturation.',
  },
  venous_wall: {
    id: 'venous_wall',
    label: 'Venous Vasculature',
    naturalColor: '#4E657E',
    classificationColor: '#3B6694',
    roughness: 0.46,
    metalness: 0.03,
    opacity: 1,
    materialNote: 'Distinguishable slate-blue venous tone avoiding unrealistic electric blue.',
  },
  brain_grey_matter: {
    id: 'brain_grey_matter',
    label: 'Cerebral Cortex (Grey Matter)',
    naturalColor: '#CBB8AD',
    classificationColor: '#C29B8A',
    roughness: 0.50,
    metalness: 0.02,
    opacity: 1,
    materialNote: 'Natural pinkish-grey cortical surface (no rainbow lobe coloring by default).',
  },
  brain_white_matter: {
    id: 'brain_white_matter',
    label: 'Cerebral White Matter & Deep Tracts',
    naturalColor: '#DDD5C6',
    classificationColor: '#D6C8A9',
    roughness: 0.46,
    metalness: 0.02,
    opacity: 1,
    materialNote: 'Pale myelinated tract appearance (corpus callosum, internal capsule, white matter).',
  },
  brain_cerebellum: {
    id: 'brain_cerebellum',
    label: 'Cerebellar Cortex',
    naturalColor: '#BFA79A',
    classificationColor: '#AD8678',
    roughness: 0.54,
    metalness: 0.02,
    opacity: 1,
    materialNote: 'Subtly warmer foliated cerebellar cortex tone.',
  },
  brain_brainstem: {
    id: 'brain_brainstem',
    label: 'Brainstem & Deep Nuclei',
    naturalColor: '#D2C5B4',
    classificationColor: '#C5B091',
    roughness: 0.48,
    metalness: 0.02,
    opacity: 1,
    materialNote: 'Natural pale cream-tan brainstem and diencephalic tissue.',
  },
  ventricle_csf: {
    id: 'ventricle_csf',
    label: 'Ventricular Space / Choroid Plexus',
    naturalColor: '#B7CBD1',
    classificationColor: '#6AA4BD',
    roughness: 0.30,
    metalness: 0.02,
    opacity: 0.85,
    materialNote: 'Subtle translucent-sheen CSF cavity representation.',
  },
  peripheral_nerve: {
    id: 'peripheral_nerve',
    label: 'Peripheral & Cranial Nerves',
    naturalColor: '#D9C892',
    classificationColor: '#CCA94A',
    roughness: 0.48,
    metalness: 0.02,
    opacity: 1,
    materialNote: 'Natural pale ivory-yellow myelinated nerve fascicles.',
  },
  liver_parenchyma: {
    id: 'liver_parenchyma',
    label: 'Hepatic Parenchyma',
    naturalColor: '#7D3E34',
    classificationColor: '#8A4436',
    roughness: 0.38,
    metalness: 0.02,
    opacity: 1,
    materialNote: 'Deep reddish-brown glossy hepatic capsule.',
  },
  lung_parenchyma: {
    id: 'lung_parenchyma',
    label: 'Pulmonary Parenchyma',
    naturalColor: '#B98A8E',
    classificationColor: '#C28A96',
    roughness: 0.58,
    metalness: 0.01,
    opacity: 1,
    materialNote: 'Spongy muted rose-grey aerated lung parenchyma.',
  },
  kidney_parenchyma: {
    id: 'kidney_parenchyma',
    label: 'Renal Parenchyma',
    naturalColor: '#8B4E42',
    classificationColor: '#9C5546',
    roughness: 0.42,
    metalness: 0.02,
    opacity: 1,
    materialNote: 'Smooth reddish-brown renal capsule.',
  },
  spleen_parenchyma: {
    id: 'spleen_parenchyma',
    label: 'Splenic Parenchyma',
    naturalColor: '#6F3C47',
    classificationColor: '#7C4256',
    roughness: 0.40,
    metalness: 0.02,
    opacity: 1,
    materialNote: 'Deep purplish-brown vascular lymphoid parenchyma.',
  },
  gi_viscera: {
    id: 'gi_viscera',
    label: 'Gastrointestinal Viscera',
    naturalColor: '#BC8E78',
    classificationColor: '#B88464',
    roughness: 0.48,
    metalness: 0.02,
    opacity: 1,
    materialNote: 'Natural pale pinkish-tan serosal organ surface.',
  },
  endocrine_gland: {
    id: 'endocrine_gland',
    label: 'Endocrine Glandular Tissue',
    naturalColor: '#B8877C',
    classificationColor: '#BA7E7E',
    roughness: 0.48,
    metalness: 0.02,
    opacity: 1,
    materialNote: 'Vascularized lobular glandular parenchyma.',
  },
  lymphoid: {
    id: 'lymphoid',
    label: 'Lymphatic Vessels & Nodes',
    naturalColor: '#A6AD8E',
    classificationColor: '#7E9E6E',
    roughness: 0.50,
    metalness: 0.02,
    opacity: 1,
    materialNote: 'Muted pale olive-ivory lymphoid tissue.',
  },
  ocular_sensory: {
    id: 'ocular_sensory',
    label: 'Special Sensory Organ',
    naturalColor: '#CFD6D9',
    classificationColor: '#8BB4BF',
    roughness: 0.30,
    metalness: 0.03,
    opacity: 1,
    materialNote: 'Smooth scleral/ocular anatomical surface.',
  },
  reproductive_tissue: {
    id: 'reproductive_tissue',
    label: 'Reproductive Organs',
    naturalColor: '#B8948B',
    classificationColor: '#B08488',
    roughness: 0.50,
    metalness: 0.02,
    opacity: 1,
    materialNote: 'Natural pelvic visceral soft-tissue tone.',
  },
};

/**
 * Classifies an individual anatomical mesh into its realistic tissue class
 * using system membership and anatomical nomenclature.
 */
export function classifyPartTissue(part: Pick<Part, 'id' | 'name' | 'system' | 'bounds'>): TissueType {
  const n = part.name.toLowerCase();

  // Specific anatomical structure overrides regardless of broad system grouping
  if (/tooth|molar|premolar|incisor|canine|dentin|enamel/.test(n)) return 'teeth_enamel';
  if (/tendon|aponeurosis/.test(n)) return 'tendon';
  if (/ligament|retinaculum|capsule|meniscus|labrum/.test(n)) return 'ligament';
  if (/cartilage|intervertebral disk|intervertebral disc|epiglottis|tracheal ring/.test(n)) return 'cartilage';
  if (/fascia|tentorium|dura|pericardium|pleura|peritoneum|mesentery|omentum|sheath|septum of/.test(n)) {
    return 'fascia_membrane';
  }
  if (/adipose|fat pad|fat body/.test(n)) return 'adipose';

  // Brain & CNS realistic grey vs white matter vs cerebellum vs brainstem vs ventricles
  if (part.system === 'nervous') {
    if (/ventricle|cerebral aqueduct|choroid plexus/.test(n)) return 'ventricle_csf';
    if (/\bcerebellum\b/.test(n)) return 'brain_cerebellum';
    if (/midbrain|\bpons\b|medulla oblongata|colliculus|peduncle of midbrain|interpeduncular|thalamus|hypothalamus|caudate|putamen|globus pallidus|geniculate/.test(n)) {
      return 'brain_brainstem';
    }
    if (/white matter|corpus callosum|internal capsule|fornix|commissure|stria |optic tract|optic chiasm/.test(n)) {
      return 'brain_white_matter';
    }
    if (/gyrus|lobe|insula|hippocampus|amygdala|cortex|mammillary|tuber cinereum|lamina terminalis/.test(n)) {
      return 'brain_grey_matter';
    }
    return 'peripheral_nerve';
  }

  // Organ-specific realistic tones
  if (/\bliver\b|hepatic lobe/.test(n)) return 'liver_parenchyma';
  if (/\bspleen\b/.test(n)) return 'spleen_parenchyma';
  if (/\bkidney\b|renal cortex|renal medulla|renal pyramid/.test(n)) return 'kidney_parenchyma';
  if (/\blung\b|lobe of .*lung/.test(n)) return 'lung_parenchyma';

  switch (part.system) {
    case 'skeletal':
      return 'compact_bone';
    case 'muscular':
      return 'skeletal_muscle';
    case 'cardiac':
      return 'cardiac_muscle';
    case 'arterial':
      return 'arterial_wall';
    case 'venous':
      return 'venous_wall';
    case 'respiratory':
      return /trachea|bronch|larynx/.test(n) ? 'cartilage' : 'lung_parenchyma';
    case 'digestive':
      return 'gi_viscera';
    case 'urinary':
      return 'gi_viscera';
    case 'lymphatic':
      return 'lymphoid';
    case 'endocrine':
      return 'endocrine_gland';
    case 'reproductive':
      return 'reproductive_tissue';
    case 'integumentary':
      return 'skin_surface';
    case 'sensory':
      return 'ocular_sensory';
    case 'connective':
      return 'ligament';
    default:
      return 'fascia_membrane';
  }
}

export function resolveNaturalAnatomyColors(atlas: Atlas): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of atlas.parts) {
    const tissue = classifyPartTissue(p);
    out[p.id] = TISSUE_MATERIAL_PRESETS[tissue].naturalColor;
  }
  return out;
}

export function resolveTissueClassificationColors(atlas: Atlas): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of atlas.parts) {
    const tissue = classifyPartTissue(p);
    out[p.id] = TISSUE_MATERIAL_PRESETS[tissue].classificationColor;
  }
  return out;
}

export interface PartPbrMaterialValues {
  roughness: number;
  metalness: number;
  /** Subtle procedural micro-detail contrast [0..1] (e.g., fibrous muscle/tendon vs smooth cartilage) */
  microDetail: number;
}

/**
 * Resolves physically based per-part roughness, metalness, and restrained micro-detail
 * strength for the GPU partMaterialTexture in app/scene.tsx.
 * Biological metalness stays physically near zero (<= 0.05).
 */
export function resolvePartMaterialProps(atlas: Atlas): Record<string, PartPbrMaterialValues> {
  const out: Record<string, PartPbrMaterialValues> = {};
  for (const p of atlas.parts) {
    const tissue = classifyPartTissue(p);
    const preset = TISSUE_MATERIAL_PRESETS[tissue];
    let microDetail = 0.2;
    if (tissue === 'skeletal_muscle' || tissue === 'cardiac_muscle') microDetail = 0.65;
    else if (tissue === 'tendon' || tissue === 'ligament' || tissue === 'fascia_membrane') microDetail = 0.45;
    else if (tissue === 'compact_bone') microDetail = 0.35;
    else if (tissue === 'brain_grey_matter' || tissue === 'brain_cerebellum') microDetail = 0.3;
    else if (tissue === 'cartilage' || tissue === 'ocular_sensory' || tissue === 'ventricle_csf') microDetail = 0.08;

    out[p.id] = {
      roughness: preset.roughness,
      metalness: Math.min(0.05, preset.metalness),
      microDetail,
    };
  }
  return out;
}

// ---------------------------------------------------------------------------
// Hardware-Aware Rendering Quality Presets
// ---------------------------------------------------------------------------

export type RenderQualityPresetId = 'performance' | 'balanced' | 'high' | 'ultra';

export interface RenderQualityPresetSpec {
  id: RenderQualityPresetId;
  label: string;
  pixelRatioCap: number;
  antialias: boolean;
  preferredLod: 0 | 1 | 2 | 3;
  memoryBudgetMb: number;
  exposure: number;
  envMapIntensity: number;
  microDetailStrength: number;
  description: string;
}

export const RENDER_QUALITY_PRESETS: Record<RenderQualityPresetId, RenderQualityPresetSpec> = {
  performance: {
    id: 'performance',
    label: 'Performance',
    pixelRatioCap: 1.0,
    antialias: false,
    preferredLod: 3,
    memoryBudgetMb: 128,
    exposure: 1.06,
    envMapIntensity: 0.72,
    microDetailStrength: 0.0,
    description: 'Lowest GPU workload (1.0x pixel ratio, minimal shading overhead) for mobile or integrated GPUs.',
  },
  balanced: {
    id: 'balanced',
    label: 'Balanced',
    pixelRatioCap: 1.5,
    antialias: true,
    preferredLod: 2,
    memoryBudgetMb: 256,
    exposure: 1.08,
    envMapIntensity: 0.92,
    microDetailStrength: 0.55,
    description: 'Recommended default balancing per-tissue PBR response, crisp contours, and responsive frame pacing.',
  },
  high: {
    id: 'high',
    label: 'High Detail',
    pixelRatioCap: 2.0,
    antialias: true,
    preferredLod: 1,
    memoryBudgetMb: 512,
    exposure: 1.1,
    envMapIntensity: 1.05,
    microDetailStrength: 0.85,
    description: 'Full retina pixel ratio (up to 2.0x), enhanced studio IBL reflections, and full per-tissue PBR micro-detail.',
  },
  ultra: {
    id: 'ultra',
    label: 'Ultra Detail',
    pixelRatioCap: 2.0,
    antialias: true,
    preferredLod: 0,
    memoryBudgetMb: 1024,
    exposure: 1.12,
    envMapIntensity: 1.15,
    microDetailStrength: 1.0,
    description: 'Maximum PBR fidelity and studio lighting response; targets LOD 0 source packs when installed and falls back cleanly to bundled BP3D 4.0 chunks.',
  },
};

export function validateMaterialRegistry(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const defaultModes = VISUALIZATION_MODES.filter((m) => m.isDefault);
  if (defaultModes.length !== 1 || defaultModes[0].id !== 'natural') {
    errors.push('Exactly one default visualization mode must be defined and it must be "natural".');
  }
  for (const [id, preset] of Object.entries(TISSUE_MATERIAL_PRESETS)) {
    if (!/^#[0-9a-fA-F]{6}$/.test(preset.naturalColor)) {
      errors.push(`Tissue ${id}: invalid naturalColor "${preset.naturalColor}"`);
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(preset.classificationColor)) {
      errors.push(`Tissue ${id}: invalid classificationColor "${preset.classificationColor}"`);
    }
    if (preset.roughness < 0 || preset.roughness > 1) {
      errors.push(`Tissue ${id}: roughness out of [0..1]`);
    }
    if (preset.metalness < 0 || preset.metalness > 0.25) {
      errors.push(`Tissue ${id}: biological tissue metalness must stay physically non-metallic (<= 0.25)`);
    }
  }
  return { valid: errors.length === 0, errors };
}
