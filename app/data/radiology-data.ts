import type { CanonicalSystemId } from '../anatomy-systems';

export type RadiologyModality = 'X-Ray' | 'CT' | 'MRI' | 'Ultrasound';

export interface RadiologyStudyCase {
  id: string;
  title: string;
  modality: RadiologyModality;
  planeOrProjection: string;
  orientationConvention: string;
  imageUrl: string;
  summary: string;
  anatomicalLandmarks: string[];
  linkedConceptIds: string[];
  canonicalSystem: CanonicalSystemId;
  author: string;
  license: string;
  sourceUrl: string;
  clinicalDisclaimer: string;
}

export const RADIOLOGY_CASES: RadiologyStudyCase[] = [
  {
    id: 'rad-chest-pa-xray',
    title: 'Normal Posteroanterior (PA) Chest Radiograph',
    modality: 'X-Ray',
    planeOrProjection: 'Posteroanterior (PA) Upright Projection',
    orientationConvention:
      'Radiological standard convention: patient right (Dx) on viewer left; patient left (Sin) and gastric air bubble on viewer right.',
    imageUrl: '/media/radiology/normal-chest-pa-xray.jpg',
    summary:
      'Demonstrates normal aerated lung fields, sharp costophrenic angles, cardiothoracic ratio < 0.5, aortic knob, and medial clavicular symmetry.',
    anatomicalLandmarks: [
      'Tracheal air column midline over thoracic spinous processes',
      'Cardiac silhouette (right atrium border, left ventricular apex)',
      'Aortic arch knob & hilar pulmonary vessels',
      'Right & left hemidiaphragms with gastric fundic gas bubble below left diaphragm',
    ],
    linkedConceptIds: ['FMA7088', 'FMA7195', 'FMA7394'],
    canonicalSystem: 'respiratory',
    author: 'Mikael Häggström',
    license: 'CC0 1.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Normal_posteroanterior_(PA)_chest_radiograph_(X-ray).jpg',
    clinicalDisclaimer: 'De-identified normal reference radiograph for educational study only — not for clinical diagnosis.',
  },
  {
    id: 'rad-brain-ct-multiplanar',
    title: 'Normal Head Computed Tomography (4 mm Multiplanar Reference)',
    modality: 'CT',
    planeOrProjection: 'Sagittal, Coronal & Axial Non-Contrast Views',
    orientationConvention:
      'CT attenuation scale (Hounsfield Units): hyperdense cortical bone (white), intermediate gray/white matter parenchyma, hypodense CSF & air-filled paranasal sinuses (black).',
    imageUrl: '/media/radiology/normal-brain-ct.png',
    summary:
      'Illustrates normal midline cranial anatomy, symmetrical lateral ventricles, orbital globes, paranasal sinuses, brainstem, and cerebellum across three orthogonal planes.',
    anatomicalLandmarks: [
      'Hyperdense calvarium, ethmoid/sphenoid sinuses, and petrous temporal bone',
      'Corpus callosum, brainstem, and cerebellar vermis on sagittal view',
      'Symmetrical lateral ventricles and basal cisterns without midline shift',
      'Extraocular globes and optic nerve trajectory in axial orbit cut',
    ],
    linkedConceptIds: ['FMA50801', 'FMA67944', 'FMA50863'],
    canonicalSystem: 'nervous',
    author: 'Mikael Häggström',
    license: 'CC0 1.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:CT_of_a_normal_brain_(thumbnail).png',
    clinicalDisclaimer: 'De-identified normal reference head CT for neuroanatomy correlation only — not for clinical diagnosis.',
  },
  {
    id: 'rad-brain-mri-t2-axial',
    title: 'Normal Brain T2-Weighted Axial MRI',
    modality: 'MRI',
    planeOrProjection: 'Axial T2-Weighted Spin-Echo Plane',
    orientationConvention:
      'T2-weighted contrast: cerebrospinal fluid (CSF) in ventricles and cortical sulci appears hyperintense (bright white), while myelinated white matter tracts appear darker than cortical gray matter.',
    imageUrl: '/media/radiology/normal-brain-mri-t2.png',
    summary:
      'Provides high soft-tissue contrast between cortical gray matter ribbon, subcortical white matter, corpus callosum, lentiform/caudate nuclei, and bright CSF ventricular spaces.',
    anatomicalLandmarks: [
      'Frontal horns and trigones of lateral ventricles filled with bright T2 CSF',
      'Genu and splenium of corpus callosum',
      'Caudate head, lentiform nucleus (putamen/globus pallidus), and internal capsule',
      'Cortical gyral ribbon vs subcortical white matter contrast',
    ],
    linkedConceptIds: ['FMA50801', 'FMA61817'],
    canonicalSystem: 'nervous',
    author: 'Sean Novak',
    license: 'CC BY-SA 4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Brain-T2-axial.png',
    clinicalDisclaimer: 'De-identified normal reference T2 brain MRI for neuroanatomy education only — not for clinical diagnosis.',
  },
  {
    id: 'rad-kidney-ultrasound',
    title: 'Normal Renal Longitudinal B-Mode Ultrasound',
    modality: 'Ultrasound',
    planeOrProjection: 'Longitudinal Parasagittal Sonographic Plane',
    orientationConvention:
      'Marker convention shown with depth scale (cm) on right: (*) renal column of Bertin, (**) hypoechoic medullary pyramid, (***) echogenic renal cortex, (****) hyperechoic central renal sinus.',
    imageUrl: '/media/radiology/normal-kidney-ultrasound.jpg',
    summary:
      'Demonstrates clear corticomedullary differentiation between echogenic peripheral cortex, hypoechoic triangular medullary pyramids, and the central fatty renal sinus.',
    anatomicalLandmarks: [
      '(*) Hypertrophied/normal renal column of Bertin extending between pyramids',
      '(**) Hypoechoic renal medullary pyramids',
      '(***) Peripheral renal cortex adjacent to acoustic capsule',
      '(****) Central echogenic renal sinus (collecting system & hilar fat)',
    ],
    linkedConceptIds: ['FMA7203', 'FMA15575'],
    canonicalSystem: 'urinary',
    author: 'Kristoffer Lindskov Hansen, Michael Bachmann Nielsen & Caroline Ewertsen',
    license: 'CC BY 4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Normal_pediatric_kidney.jpg',
    clinicalDisclaimer: 'De-identified normal reference sonogram for educational study only — not for clinical diagnosis.',
  },
  {
    id: 'rad-foot-dp-xray',
    title: 'Normal Right Foot Dorsoplantar (DP) Radiograph',
    modality: 'X-Ray',
    planeOrProjection: 'Dorsoplantar (AP) Projection (Right / Dx)',
    orientationConvention:
      'Radiopaque cortical bone borders with preserved joint spaces across tarsals, metatarsals (I–V), sesamoids under 1st metatarsal head, and phalanges.',
    imageUrl: '/media/radiology/normal-foot-dp-xray.jpg',
    summary:
      'Ideal osteology correlation plate for tracing tarsal articulations (navicular, cuboid, medial/intermediate/lateral cuneiforms) and metatarsophalangeal alignment.',
    anatomicalLandmarks: [
      'First through fifth metatarsals and proximal/middle/distal phalanges',
      'Medial and lateral hallucal sesamoid bones beneath 1st metatarsal head',
      'Navicular, cuboid, and three cuneiform tarsal articulations',
      'Talocalcaneal overlap and calcaneocuboid joint line',
    ],
    linkedConceptIds: ['FMA9664', 'FMA24492'],
    canonicalSystem: 'skeletal',
    author: 'Mikael Häggström',
    license: 'CC0 1.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:X-ray_of_normal_right_foot_by_dorsoplantar_projection.jpg',
    clinicalDisclaimer: 'De-identified normal reference skeletal radiograph for educational study only — not for clinical diagnosis.',
  },
];
