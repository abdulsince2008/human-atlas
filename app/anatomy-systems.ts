import type { LocalizedText, SystemId } from './anatomy';

export type CanonicalSystemId =
  | 'skeletal'
  | 'muscular'
  | 'nervous'
  | 'cardiovascular'
  | 'respiratory'
  | 'digestive'
  | 'urinary'
  | 'reproductive'
  | 'endocrine'
  | 'lymphatic'
  | 'integumentary'
  | 'sensory';

export type CoverageStatus = 'full' | 'partial' | 'male-only' | 'planned';

export interface CanonicalSystem {
  id: CanonicalSystemId;
  order: number;
  name: LocalizedText;
  shortSummary: LocalizedText;
  description: LocalizedText;
  color: string;
  meshSystems: SystemId[];
  coverage: CoverageStatus;
  coverageLabel: string;
  coverageNote: string;
  featuredConceptIds: string[];
  plannedStructures: string[];
}

export const CANONICAL_SYSTEMS: CanonicalSystem[] = [
  {
    id: 'skeletal',
    order: 1,
    name: { en: 'Skeletal System', ur: undefined },
    shortSummary: { en: 'Structural bone framework, joints, and mineral reservoir' },
    description: {
      en: 'Comprises the axial and appendicular skeleton along with supportive cartilage and ligaments. It gives the body shape, shields vital organs such as the brain and heart, anchors skeletal muscles for movement, stores calcium and phosphorus, and houses red bone marrow for blood cell formation.',
    },
    color: '#c9b783',
    meshSystems: ['skeletal', 'connective'],
    coverage: 'full',
    coverageLabel: 'Available in 3D',
    coverageNote: 'Includes 296 skeletal bone/tooth meshes and 40 connective cartilage/ligament/tendon meshes from BodyParts3D 4.0.',
    featuredConceptIds: ['FMA46565', 'FMA52748', 'FMA7485', 'FMA7574', 'FMA9578', 'FMA13321', 'FMA13394', 'FMA13303', 'FMA9611', 'FMA24476', 'FMA24485'],
    plannedStructures: ['Microscopic osteon cross-section', 'Articular synovial capsule detail'],
  },
  {
    id: 'muscular',
    order: 2,
    name: { en: 'Muscular System' },
    shortSummary: { en: 'Voluntary skeletal muscles generating posture and locomotion' },
    description: {
      en: 'Consists of skeletal muscles attached to bones via tendons. By contracting and pulling across joints, muscles produce limb movement, maintain upright posture, assist respiration (diaphragm), and generate thermal energy.',
    },
    color: '#a85b50',
    meshSystems: ['muscular'],
    coverage: 'full',
    coverageLabel: 'Available in 3D',
    coverageNote: 'Includes 402 individually selectable skeletal muscle meshes across head, neck, trunk, and limbs.',
    featuredConceptIds: ['FMA13295', 'FMA13407', 'FMA13109', 'FMA37682', 'FMA37683', 'FMA22314', 'FMA22429', 'FMA45950'],
    plannedStructures: ['Sarcomere ultrastructure diagram', 'Smooth and cardiac muscle histology'],
  },
  {
    id: 'nervous',
    order: 3,
    name: { en: 'Nervous System' },
    shortSummary: { en: 'Brain, spinal cord, and peripheral nerve network' },
    description: {
      en: 'Coordinates sensory input, motor commands, cognition, memory, and homeostatic reflexes. Divided functionally into the central nervous system (brain and spinal cord) and the peripheral nervous system (cranial and spinal nerves).',
    },
    color: '#d8b565',
    meshSystems: ['nervous'],
    coverage: 'partial',
    coverageLabel: 'Partial 3D Coverage',
    coverageNote: 'Includes 139 meshes covering brain segments, cerebellum, brainstem, spinal cord, and major cranial/orbital/limb nerves. Microscopic synapses and some autonomic plexuses are not modeled.',
    featuredConceptIds: ['FMA50801', 'FMA67944', 'FMA79876', 'FMA7647'],
    plannedStructures: ['Cerebral cortex functional lobes (Brodmann areas)', 'Autonomic sympathetic chain ganglia detail', 'Sciatic nerve full course'],
  },
  {
    id: 'cardiovascular',
    order: 4,
    name: { en: 'Cardiovascular System' },
    shortSummary: { en: 'Heart pump, arterial distribution, and venous return' },
    description: {
      en: 'Circulates blood continuously through the pulmonary circuit (lungs for gas exchange) and systemic circuit (oxygen and nutrient delivery to tissues). Includes the four-chambered heart, arteries, and veins.',
    },
    color: '#c05245',
    meshSystems: ['cardiac', 'arterial', 'venous'],
    coverage: 'full',
    coverageLabel: 'Available in 3D',
    coverageNote: 'Combines 23 cardiac structures, 639 arterial segments, and 404 venous segments. Note: the source BodyParts3D cardiac layer also classifies 5 brain ventricle cavity meshes.',
    featuredConceptIds: ['FMA7088', 'FMA3736', 'FMA3768', 'FMA3784', 'FMA4720', 'FMA10951', 'FMA3939', 'FMA4724'],
    plannedStructures: ['Capillary bed microcirculation', 'Cardiac conduction system (SA/AV nodes)'],
  },
  {
    id: 'respiratory',
    order: 5,
    name: { en: 'Respiratory System' },
    shortSummary: { en: 'Upper/lower airways and bronchial tree of the lungs' },
    description: {
      en: 'Conducts inhaled air through the trachea and branching bronchi into the lungs for oxygen uptake and carbon dioxide elimination, driven by pressure changes from the diaphragm and ribcage.',
    },
    color: '#b98991',
    meshSystems: ['respiratory'],
    coverage: 'full',
    coverageLabel: 'Available in 3D',
    coverageNote: 'Includes 119 meshes covering trachea, main and segmental bronchi, and bronchial trees of both lungs.',
    featuredConceptIds: ['FMA7394', 'FMA7309', 'FMA7310'],
    plannedStructures: ['Alveolar capillary membrane (microscopic)', 'Nasal cavity turbinate mucosa detail'],
  },
  {
    id: 'digestive',
    order: 6,
    name: { en: 'Digestive System' },
    shortSummary: { en: 'Alimentary canal and accessory digestive glands' },
    description: {
      en: 'Breaks down ingested food mechanically and enzymatically, absorbs water, electrolytes, and nutrients across the intestinal wall, and eliminates solid waste. Supported by the liver, gallbladder, and pancreas.',
    },
    color: '#b8916b',
    meshSystems: ['digestive'],
    coverage: 'full',
    coverageLabel: 'Available in 3D',
    coverageNote: 'Includes 97 meshes covering esophagus, stomach, duodenum, small intestine segments, colon, appendix, rectum, liver, gallbladder, and pancreas.',
    featuredConceptIds: ['FMA7131', 'FMA7148', 'FMA7206', 'FMA7200', 'FMA14545', 'FMA14547', 'FMA14542', 'FMA14544', 'FMA7197', 'FMA7202', 'FMA7198'],
    plannedStructures: ['Salivary glands (parotid, submandibular) isolation', 'Intestinal villi microscopic structure'],
  },
  {
    id: 'urinary',
    order: 7,
    name: { en: 'Urinary System' },
    shortSummary: { en: 'Kidneys, ureters, urinary bladder, and urethra' },
    description: {
      en: 'Filters metabolic waste from blood plasma, regulates extracellular fluid volume, osmolarity, blood pressure, and acid-base balance, and stores and excretes urine.',
    },
    color: '#b47961',
    meshSystems: ['urinary'],
    coverage: 'full',
    coverageLabel: 'Available in 3D',
    coverageNote: 'Includes all 6 gross anatomical organs: right and left kidneys, right and left ureters, urinary bladder, and urethra.',
    featuredConceptIds: ['FMA7203', 'FMA7204', 'FMA7205', 'FMA15900'],
    plannedStructures: ['Nephron & glomerulus microscopic unit', 'Renal cortex vs. medulla internal section'],
  },
  {
    id: 'reproductive',
    order: 8,
    name: { en: 'Reproductive System' },
    shortSummary: { en: 'Male & female pelvic reproductive anatomy (92-part female overlay + 32 male meshes)' },
    description: {
      en: 'Produces gametes and sex hormones required for human reproduction. In 3D Explorer, Male mode renders 25 reproductive meshes (12 BodyParts3D 4.0 + 13 HM_* male enhancement meshes), while Female mode renders 58 female-specific reproductive parts from the 92-part Female Overlay v3.0 (84 direct HuBMAP HRA CC BY 4.0 meshes + 8 co-registered reconstructions) plus an optional 8-mesh Pregnancy/Placenta layer.',
    },
    color: '#bda098',
    meshSystems: ['reproductive'],
    coverage: 'partial',
    coverageLabel: 'Male & Female 3D (Partial)',
    coverageNote: 'Male mode renders 25 reproductive meshes (12 BodyParts3D + 13 HM_* enhancements, with 20 HM_* male parts total across pelvis/repro/urinary). Female mode activates the 92-part Female Overlay v3.0 (84 HuBMAP HRA CC BY 4.0 meshes [55 HRA v1.5 Visible Human Female + 16 HRA v1.1 Mammary Gland + 13 HRA v1.3 Female Pelvic Vasculature] + 8 co-registered reconstructions) replacing 45 male-specific/pelvic parts, plus an optional 8-mesh Pregnancy/Placenta layer (OFF by default). Still missing: ovarian/clitoral dedicated branches, female-specific pelvic-floor muscles, and microscopic gametes.',
    featuredConceptIds: ['FMA7210', 'FMA9600'],
    plannedStructures: [
      'Ovarian/uterine/clitoral sub-branches and female pelvic-floor muscle dimorphism',
      'Early-pregnancy embryological stages beyond full-term optional placenta',
      'Region-by-region female morphological validation',
      'Seminiferous tubule & ovarian follicle micro-anatomy',
    ],
  },
  {
    id: 'endocrine',
    order: 9,
    name: { en: 'Endocrine System' },
    shortSummary: { en: 'Hormone-secreting glands regulating metabolism and homeostasis' },
    description: {
      en: 'Secretes chemical messengers (hormones) directly into the bloodstream to coordinate growth, metabolism, stress adaptation, fluid balance, and reproductive cycles.',
    },
    color: '#c5a09a',
    meshSystems: ['endocrine'],
    coverage: 'partial',
    coverageLabel: 'Partial 3D Coverage',
    coverageNote: 'Dedicated endocrine mesh layer contains 4 structures: pituitary gland, pineal body, and right/left adrenal glands (4/11 canonical items = 36.4%). Pancreas and gonads live in Digestive/Reproductive layers; thyroid gland, bilateral parathyroid lobes, and pancreatic islet micro-architecture are not yet modeled as separate 3D meshes.',
    featuredConceptIds: ['FMA13889', 'FMA62033', 'FMA9604', 'FMA7198'],
    plannedStructures: ['Thyroid gland (right lobe, left lobe, isthmus)', 'Superior & inferior parathyroid glands (4 lobes)', 'Hypothalamic nuclei detail'],
  },
  {
    id: 'lymphatic',
    order: 10,
    name: { en: 'Lymphatic System' },
    shortSummary: { en: 'Spleen, thymus, tonsils, and immune fluid return' },
    description: {
      en: 'Collects excess interstitial fluid as lymph, transports dietary lipids, and houses immune cells in lymphoid organs to defend the body against pathogens.',
    },
    color: '#879f7c',
    meshSystems: ['lymphatic'],
    coverage: 'partial',
    coverageLabel: 'Partial 3D Coverage',
    coverageNote: 'Active lymphatic layer contains 5 parts: spleen, left/right thymus lobes, and bilateral HuBMAP HRA CC BY 4.0 palatine tonsils (HS_*) (5/17 Male = 29.4%, 5/23 Female = 21.7%). Thoracic duct, cisterna chyli, right lymphatic duct, and cervical/axillary/inguinal lymph-node chains remain missing.',
    featuredConceptIds: ['FMA7196'],
    plannedStructures: ['Cervical, axillary, inguinal & pelvic lymph node chains', 'Thoracic duct, cisterna chyli & right lymphatic duct', 'Lingual & tubal tonsils'],
  },
  {
    id: 'integumentary',
    order: 11,
    name: { en: 'Integumentary System' },
    shortSummary: { en: 'Outer body surface, skin envelope, and hair references' },
    description: {
      en: 'Forms the external protective interface of the body, preventing dehydration and pathogen entry while supporting thermoregulation, vitamin D synthesis, and tactile sensation.',
    },
    color: '#ba9b7d',
    meshSystems: ['integumentary'],
    coverage: 'partial',
    coverageLabel: 'Partial Surface Reference',
    coverageNote: 'Includes 5 outer surface meshes (skin shell, hair of head, eyebrows, lip, pubic hair) rendered semi-transparently by default so internal systems remain visible.',
    featuredConceptIds: ['FMA54237'],
    plannedStructures: ['Epidermis, dermis & subcutaneous cross-section', 'Sweat & sebaceous glands'],
  },
  {
    id: 'sensory',
    order: 12,
    name: { en: 'Sensory Organs' },
    shortSummary: { en: 'Ocular, orbital, and lacrimal structures (ear/olfactory planned)' },
    description: {
      en: 'Specialized organs that transduce light, sound, balance, taste, and smell into neural signals for interpretation by the brain.',
    },
    color: '#6b9aa6',
    meshSystems: ['sensory'],
    coverage: 'partial',
    coverageLabel: 'Partial 3D Coverage',
    coverageNote: 'Includes 45 detailed ocular and lacrimal structures (cornea, iris, lens, choroid, anterior chamber, lacrimal glands and ducts). Inner ear structures (cochlea, semicircular canals) and olfactory epithelium are not yet modeled in this mesh pack.',
    featuredConceptIds: ['FMA58238', 'FMA58235', 'FMA58241', 'FMA58078'],
    plannedStructures: ['External, middle, and inner ear (tympanic membrane, ossicles, cochlea)', 'Retinal layers & optic disc', 'Olfactory bulb & lingual papillae'],
  },
];

export function canonicalSystemForMeshSystem(meshSystem: SystemId): CanonicalSystem {
  return (
    CANONICAL_SYSTEMS.find((cs) => cs.meshSystems.includes(meshSystem)) ??
    CANONICAL_SYSTEMS[0]
  );
}
