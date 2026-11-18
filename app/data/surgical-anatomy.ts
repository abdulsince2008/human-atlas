import type { SystemId } from '../anatomy';
import type { ProvenanceReviewStatus } from './provenance-registry';

/**
 * Surgical Anatomy Educational Learning Registry
 *
 * Data-driven regional surgical anatomy curriculum.
 * Strictly educational — NOT a surgical simulator, surgical planning tool,
 * or substitute for supervised clinical/cadaveric training.
 */

export const SURGICAL_ANATOMY_SCHEMA_VERSION = 1;

export const SURGICAL_EDUCATION_DISCLAIMER =
  'Educational Reference Only: This module teaches regional anatomical layers, neurovascular relations, and landmarks for study. It is not a certified surgical simulator, intraoperative navigation system, or substitute for supervised clinical training.';

export interface SurgicalAnatomyRegion {
  id: string;
  title: string;
  anatomicalRegion: string;
  summary: string;
  superficialLayers: string[];
  deepLayers: string[];
  keyVessels: string[];
  keyNerves: string[];
  fascialPlanes: string[];
  criticalLandmarks: string[];
  documentedVariations: string[];
  crossSectionNote: string;
  focusBounds: { min: [number, number, number]; max: [number, number, number] };
  recommendedViewDirection: [number, number, number];
  highlightSystems: SystemId[];
  relatedConceptIds: string[];
  reviewStatus: ProvenanceReviewStatus;
  sourceReference: string;
}

export const SURGICAL_ANATOMY_REGIONS: SurgicalAnatomyRegion[] = [
  {
    id: 'cranial-vault-neuro',
    title: 'Cranial Vault & Neuroanatomy',
    anatomicalRegion: 'Head & Cranial Cavity',
    summary:
      'Layered cranial organization from scalp and calvarial bones through the tentorium cerebelli to cerebral lobes, deep nuclei, brainstem, and ventricular system.',
    superficialLayers: ['Scalp soft tissue envelope', 'Frontal, parietal, temporal, and occipital cranial vault bones'],
    deepLayers: ['Tentorium cerebelli (dural partition)', 'Cerebral hemispheres & gyri', 'Corpus callosum, thalamus & basal nuclei', 'Brainstem, cerebellum & ventricles'],
    keyVessels: ['Internal carotid arteries', 'Middle & anterior cerebral arteries', 'Basilar & vertebral arteries', 'Dural venous sinuses'],
    keyNerves: ['Optic nerve (CN II) & optic chiasm', 'Oculomotor (CN III) & trochlear (CN IV) nerves'],
    fascialPlanes: ['Galea aponeurotica (epicranial aponeurosis)', 'Periosteum / pericranium', 'Dural reflections (tentorium cerebelli)'],
    criticalLandmarks: ['Pterion (overlies middle meningeal artery)', 'Central sulcus (separates precentral motor & postcentral sensory gyri)', 'Sella turcica & pituitary fossa'],
    documentedVariations: ['Circle of Willis communicating artery hypoplasia/asymmetry is common in healthy individuals.'],
    crossSectionNote: 'Use Midsagittal (X) or Axial (Y) cutaway planes to inspect corpus callosum, thalamus, and lateral/third/fourth ventricles.',
    focusBounds: { min: [-0.11, 1.50, -0.13], max: [0.11, 1.77, 0.13] },
    recommendedViewDirection: [0.45, 0.12, 1],
    highlightSystems: ['skeletal', 'nervous', 'arterial', 'venous'],
    relatedConceptIds: ['FMA46565', 'FMA50801', 'FMA67944', 'FMA79876', 'FMA13889'],
    reviewStatus: 'verified',
    sourceReference: 'OpenStax Anatomy & Physiology 2e (Ch. 7 & 13) · NCBI StatPearls Neuroanatomy',
  },
  {
    id: 'thorax-mediastinum',
    title: 'Thoracic Wall & Middle Mediastinum',
    anatomicalRegion: 'Thorax',
    summary:
      'Anterior chest wall musculature and rib cage protecting the pleural cavities, lungs, pericardial heart chambers, coronary circulation, and great vessels.',
    superficialLayers: ['Pectoralis major & minor', 'Sternum, costal cartilages, and ribs 1–12'],
    deepLayers: ['Right and left lungs & main bronchi', 'Heart chambers & ascending aorta', 'Superior & inferior vena cava, pulmonary trunk', 'Diaphragm inferiorly'],
    keyVessels: ['Ascending aorta & aortic arch', 'Left & right coronary arteries', 'Superior & inferior vena cava', 'Pulmonary arteries & veins'],
    keyNerves: ['Phrenic nerves (C3–C5, anterior to lung hilum)', 'Vagus nerves (CN X, posterior to lung hilum)'],
    fascialPlanes: ['Endothoracic fascia', 'Fibrous pericardium', 'Parietal and visceral pleura (conceptual; not individually meshed in BP3D)'],
    criticalLandmarks: ['Sternal angle (T4–T5 level: carina & aortic arch boundary)', 'Left 5th intercostal space midclavicular line (cardiac apex)'],
    documentedVariations: ['Coronary dominance (right-dominant ~80–85%, left-dominant ~8–10%, codominant ~5–10%).'],
    crossSectionNote: 'Axial (Y) section at T4–T5 demonstrates great vessels; T8 level demonstrates four-chamber cardiac orientation.',
    focusBounds: { min: [-0.20, 1.15, -0.14], max: [0.20, 1.48, 0.15] },
    recommendedViewDirection: [0.25, 0.08, 1],
    highlightSystems: ['skeletal', 'cardiac', 'respiratory', 'arterial', 'venous'],
    relatedConceptIds: ['FMA7088', 'FMA7309', 'FMA7310', 'FMA3768', 'FMA13295'],
    reviewStatus: 'verified',
    sourceReference: 'OpenStax Anatomy & Physiology 2e (Ch. 19 & 22) · NCBI StatPearls Thorax Anatomy',
  },
  {
    id: 'abdomen-portal',
    title: 'Abdominal Viscera & Portal Relations',
    anatomicalRegion: 'Abdomen & Retroperitoneum',
    summary:
      'Supracolic and retroperitoneal organ relations centering on the liver, gallbladder, stomach, duodenal C-loop, pancreas, spleen, kidneys, and hepatic portal vein.',
    superficialLayers: ['Anterior abdominal wall musculature (rectus abdominis, obliques)'],
    deepLayers: ['Liver & gallbladder (RUQ)', 'Stomach & spleen (LUQ)', 'Pancreas & duodenum (retroperitoneal C-loop)', 'Kidneys, ureters & abdominal aorta / IVC'],
    keyVessels: ['Celiac trunk & hepatic artery proper', 'Hepatic portal vein', 'Superior mesenteric artery & vein', 'Renal arteries & veins'],
    keyNerves: ['Celiac autonomic plexus', 'Vagal trunks (anterior & posterior)'],
    fascialPlanes: ['Transversalis fascia', 'Renal (Gerota) fascia (conceptual)', 'Peritoneal reflections / lesser omentum (conceptual)'],
    criticalLandmarks: ['Hepatoduodenal ligament triad (portal vein posterior, hepatic artery left, common bile duct right)', 'Transpyloric plane (L1: renal hila, pancreatic neck, pylorus)'],
    documentedVariations: ['Replaced or accessory right hepatic artery arising from the superior mesenteric artery (~10–15%).'],
    crossSectionNote: 'Axial (Y) section at L1 highlights liver, stomach, pancreas, spleen, abdominal aorta, IVC, and bilateral kidneys.',
    focusBounds: { min: [-0.19, 0.90, -0.14], max: [0.19, 1.24, 0.15] },
    recommendedViewDirection: [0.18, 0.05, 1],
    highlightSystems: ['digestive', 'urinary', 'arterial', 'venous'],
    relatedConceptIds: ['FMA7197', 'FMA7148', 'FMA7198', 'FMA7196', 'FMA7203'],
    reviewStatus: 'verified',
    sourceReference: 'OpenStax Anatomy & Physiology 2e (Ch. 23 & 25)',
  },
  {
    id: 'upper-limb-brachium',
    title: 'Shoulder, Arm Compartments & Elbow',
    anatomicalRegion: 'Upper Limb',
    summary:
      'Glenohumeral stabilizers, anterior flexor and posterior extensor arm compartments, and neurovascular relations around the humerus and cubital fossa.',
    superficialLayers: ['Deltoid & pectoralis major', 'Biceps brachii (long & short heads)'],
    deepLayers: ['Brachialis & coracobrachialis', 'Triceps brachii (long, lateral, medial heads)', 'Supraspinatus, infraspinatus & teres muscles', 'Humerus, scapula, clavicle, radius & ulna'],
    keyVessels: ['Axillary & brachial arteries', 'Profunda brachii artery', 'Posterior circumflex humeral artery'],
    keyNerves: ['Axillary nerve (surgical neck of humerus)', 'Radial nerve (radial groove of humerus)', 'Musculocutaneous nerve (pierces coracobrachialis)'],
    fascialPlanes: ['Brachial fascia', 'Medial and lateral intermuscular septa dividing anterior/posterior arm compartments'],
    criticalLandmarks: ['Surgical neck of humerus (axillary nerve risk)', 'Radial groove (midshaft humeral fracture radial nerve risk)', 'Deltopectoral groove'],
    documentedVariations: ['High bifurcation of the brachial artery into radial and ulnar arteries in the proximal arm.'],
    crossSectionNote: 'Axial (Y) slice through mid-brachium cleanly separates anterior flexor (biceps/brachialis) and posterior extensor (triceps) compartments.',
    focusBounds: { min: [-0.40, 0.95, -0.15], max: [-0.05, 1.52, 0.15] },
    recommendedViewDirection: [0.5, 0.12, 1],
    highlightSystems: ['skeletal', 'muscular', 'arterial', 'nervous'],
    relatedConceptIds: ['FMA13303', 'FMA13394', 'FMA34676', 'FMA37683', 'FMA37692'],
    reviewStatus: 'verified',
    sourceReference: 'OpenStax Anatomy & Physiology 2e (Ch. 11.5) · NCBI StatPearls Upper Limb',
  },
];

export function validateSurgicalAnatomyRegistry(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const seen = new Set<string>();
  if (!SURGICAL_EDUCATION_DISCLAIMER.toLowerCase().includes('not a certified surgical simulator')) {
    errors.push('Surgical anatomy module must include explicit non-clinical safety disclaimer.');
  }
  for (const reg of SURGICAL_ANATOMY_REGIONS) {
    if (seen.has(reg.id)) errors.push(`Duplicate surgical region id: ${reg.id}`);
    seen.add(reg.id);
    if (reg.superficialLayers.length === 0 || reg.deepLayers.length === 0) {
      errors.push(`Surgical region ${reg.id}: missing layer specifications`);
    }
    if (!reg.sourceReference.trim()) {
      errors.push(`Surgical region ${reg.id}: missing sourceReference`);
    }
  }
  return { valid: errors.length === 0, errors };
}
