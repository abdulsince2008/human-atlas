import type { LocalizedText } from './anatomy';
import type { CanonicalSystemId } from './anatomy-systems';

export type LearningCategoryId = 'by-system' | 'by-structure' | 'explore-body' | 'terminology';

export interface LessonTopic {
  id: string;
  title: LocalizedText;
  explanation: LocalizedText;
  keyFacts: string[];
  conceptIds: string[];
}

export interface AnatomyLesson {
  id: string;
  chapter: string;
  systemId: CanonicalSystemId;
  level: 'FSc / MDCAT' | 'MBBS / Nursing' | 'Foundational';
  title: LocalizedText;
  summary: LocalizedText;
  topics: LessonTopic[];
}

export interface GuidedPathwayStep {
  stepNumber: number;
  title: string;
  conceptId: string;
  note: string;
}

export interface GuidedPathway {
  id: string;
  title: string;
  systemId: CanonicalSystemId;
  summary: string;
  steps: GuidedPathwayStep[];
}

export interface TerminologyEntry {
  term: string;
  category: 'Plane' | 'Directional' | 'Movement' | 'Root';
  definition: string;
  example: string;
}

export const LEARNING_CATEGORIES: { id: LearningCategoryId; title: string; subtitle: string }[] = [
  { id: 'by-system', title: 'Learn by Anatomical System', subtitle: 'Structured chapters and key concepts organized by organ system.' },
  { id: 'by-structure', title: 'Learn by Individual Structure', subtitle: 'High-yield organ, bone, and muscle study guides linked directly to 3D inspection.' },
  { id: 'explore-body', title: 'Explore the Human Body', subtitle: 'Step-by-step guided 3D pathways tracing blood flow, airflow, digestion, and skeleton.' },
  { id: 'terminology', title: 'Anatomy Terminology', subtitle: 'Anatomical position, planes, directional terms, and classical root vocabulary.' },
];

export const ANATOMY_LESSONS: AnatomyLesson[] = [
  {
    id: 'lesson-cardio-circulation',
    chapter: 'Chapter 1 · Transport & Circulation',
    systemId: 'cardiovascular',
    level: 'FSc / MDCAT',
    title: { en: 'The Heart & Double Circulation' },
    summary: { en: 'How the four-chambered heart separates pulmonary and systemic blood flow through arteries and veins.' },
    topics: [
      {
        id: 'topic-heart-chambers',
        title: { en: 'Four Chambers & One-Way Valves' },
        explanation: { en: 'Deoxygenated blood returns from the body into the right atrium, passes into the right ventricle, and is pumped to the lungs. Oxygenated blood returns to the left atrium, enters the thick-walled left ventricle, and is ejected into the aorta.' },
        keyFacts: [
          'Tricuspid valve guards the right atrioventricular opening; mitral (bicuspid) valve guards the left.',
          'Left ventricular wall is ~3x thicker than the right ventricle because systemic resistance is much higher than pulmonary resistance.',
          'Arteries always carry blood away from the heart; veins always return blood toward the heart.',
        ],
        conceptIds: ['FMA7088', 'FMA3768', 'FMA4720', 'FMA10951'],
      },
      {
        id: 'topic-great-vessels',
        title: { en: 'Aortic Arch & Venae Cavae' },
        explanation: { en: 'The ascending aorta rises from the left ventricle and curves as the arch of aorta, supplying the head and upper limbs before descending through the thorax and abdomen. Venous return converges via the superior and inferior vena cava.' },
        keyFacts: [
          'Superior vena cava drains head, neck, upper limbs, and thorax.',
          'Inferior vena cava drains abdomen, pelvis, and lower limbs.',
        ],
        conceptIds: ['FMA3736', 'FMA3768', 'FMA3784', 'FMA4720', 'FMA10951'],
      },
    ],
  },
  {
    id: 'lesson-respiratory-mechanics',
    chapter: 'Chapter 2 · Gaseous Exchange',
    systemId: 'respiratory',
    level: 'FSc / MDCAT',
    title: { en: 'Airways, Lungs & Breathing Mechanics' },
    summary: { en: 'Air conduction from trachea to bronchial trees and how diaphragm contraction drives ventilation.' },
    topics: [
      {
        id: 'topic-conducting-airways',
        title: { en: 'Trachea & Lobes of the Lungs' },
        explanation: { en: 'Air travels down the cartilage-ringed trachea, divides at the carina into left and right main bronchi, and branches into lobar and segmental bronchial trees inside each lung.' },
        keyFacts: [
          'C-shaped cartilage rings keep the trachea open during negative-pressure inspiration.',
          'The right lung has 3 lobes; the left lung has 2 lobes and a cardiac notch for the heart.',
        ],
        conceptIds: ['FMA7394', 'FMA7309', 'FMA7310'],
      },
      {
        id: 'topic-diaphragm-ventilation',
        title: { en: 'Role of the Diaphragm' },
        explanation: { en: 'During quiet inspiration, the dome-shaped diaphragm contracts and flattens downward while external intercostals elevate the ribs. Thoracic volume increases, alveolar pressure drops below atmospheric pressure, and air enters.' },
        keyFacts: [
          'Diaphragm is innervated by the phrenic nerve (C3–C5).',
          'Quiet expiration is largely passive elastic recoil of the lungs and chest wall.',
        ],
        conceptIds: ['FMA13295', 'FMA7574'],
      },
    ],
  },
  {
    id: 'lesson-skeletal-framework',
    chapter: 'Chapter 3 · Support & Movement',
    systemId: 'skeletal',
    level: 'FSc / MDCAT',
    title: { en: 'Axial vs. Appendicular Skeleton' },
    summary: { en: 'Organization of the skull, thoracic cage, girdles, and long bones of the upper and lower limbs.' },
    topics: [
      {
        id: 'topic-axial',
        title: { en: 'Axial Skeleton: Skull, Sternum & Ribs' },
        explanation: { en: 'The axial skeleton forms the central upright axis of the body, shielding the brain inside the cranium and protecting thoracic viscera within the ribcage and sternum.' },
        keyFacts: [
          'The mandible is the only freely movable bone of the skull.',
          'Twelve pairs of ribs articulate posteriorly with thoracic vertebrae; pairs 1–7 attach directly to the sternum via costal cartilages.',
        ],
        conceptIds: ['FMA46565', 'FMA52748', 'FMA7485', 'FMA7574'],
      },
      {
        id: 'topic-appendicular',
        title: { en: 'Appendicular Skeleton: Girdles & Limbs' },
        explanation: { en: 'The pectoral girdle (clavicle and scapula) suspends the upper limb for wide mobility, while the pelvic girdle anchors the femur for weight-bearing locomotion.' },
        keyFacts: [
          'Radius lies laterally (thumb side) and rotates around the medial ulna during pronation/supination.',
          'Femur is the longest and strongest bone in the human body; patella is the largest sesamoid bone.',
        ],
        conceptIds: ['FMA13321', 'FMA13394', 'FMA13303', 'FMA23463', 'FMA23466', 'FMA9578', 'FMA9611', 'FMA24476', 'FMA24485'],
      },
    ],
  },
  {
    id: 'lesson-nervous-control',
    chapter: 'Chapter 4 · Coordination & Control',
    systemId: 'nervous',
    level: 'MBBS / Nursing',
    title: { en: 'Central Nervous System Organization' },
    summary: { en: 'Functional division between cerebrum, cerebellum, brainstem, and spinal cord.' },
    topics: [
      {
        id: 'topic-brain-divisions',
        title: { en: 'Brain, Cerebellum & Brainstem' },
        explanation: { en: 'The cerebrum governs conscious thought and voluntary action; the cerebellum refines balance and motor coordination; the brainstem regulates vital cardiac and respiratory centers.' },
        keyFacts: [
          'Brainstem consists of midbrain, pons, and medulla oblongata.',
          'Spinal cord connects the brainstem to 31 pairs of spinal nerves and mediates rapid reflex arcs.',
        ],
        conceptIds: ['FMA50801', 'FMA67944', 'FMA79876', 'FMA7647'],
      },
    ],
  },
  {
    id: 'lesson-digestive-urinary',
    chapter: 'Chapter 5 · Digestion & Excretion',
    systemId: 'digestive',
    level: 'FSc / MDCAT',
    title: { en: 'Alimentary Canal, Accessory Organs & Renal Filtration' },
    summary: { en: 'Mechanical/chemical digestion from esophagus to colon alongside hepatic, pancreatic, and renal roles.' },
    topics: [
      {
        id: 'topic-gi-tract',
        title: { en: 'Esophagus, Stomach, Intestines & Accessory Glands' },
        explanation: { en: 'Food passes down the esophagus into the acidic stomach, enters the duodenum to receive bile (from liver/gallbladder) and pancreatic enzymes, absorbs nutrients in the small intestine, and reabsorbs water in the colon.' },
        keyFacts: [
          'Pancreas functions as both an exocrine digestive gland and an endocrine hormone gland (insulin/glucagon).',
          'Liver produces bile; gallbladder stores and concentrates it.',
        ],
        conceptIds: ['FMA7131', 'FMA7148', 'FMA7206', 'FMA7200', 'FMA7197', 'FMA7202', 'FMA7198', 'FMA14545', 'FMA14547'],
      },
      {
        id: 'topic-urinary-tract',
        title: { en: 'Kidneys & Urinary Bladder' },
        explanation: { en: 'Paired retroperitoneal kidneys filter blood plasma to remove nitrogenous wastes and regulate electrolyte/fluid balance before urine flows via ureters to the muscular urinary bladder.' },
        keyFacts: [
          'Right kidney normally sits slightly lower than the left due to the liver above it.',
          'Adrenal glands rest directly atop the superior poles of both kidneys.',
        ],
        conceptIds: ['FMA7203', 'FMA15900', 'FMA9604'],
      },
    ],
  },
  {
    id: 'lesson-endocrine-sensory-placeholders',
    chapter: 'Chapter 6 · Endocrine & Special Senses (Expanding)',
    systemId: 'endocrine',
    level: 'Foundational',
    title: { en: 'Neuroendocrine Control & Ocular Anatomy' },
    summary: { en: 'Available 3D pituitary, pineal, adrenal, and eye structures — plus transparent notes on planned additions.' },
    topics: [
      {
        id: 'topic-endocrine-modeled',
        title: { en: 'Pituitary, Pineal & Adrenal Glands' },
        explanation: { en: 'Explore the pituitary gland in the sella turcica, the melatonin-producing pineal body, and the paired adrenal glands atop the kidneys. Note: thyroid and parathyroid glands are not yet modeled as separate meshes in this release.' },
        keyFacts: [
          'Pituitary gland links nervous and endocrine control via the hypothalamus.',
          'Thyroid gland parenchyma is scheduled for a future 3D dataset expansion.',
        ],
        conceptIds: ['FMA13889', 'FMA62033', 'FMA9604'],
      },
      {
        id: 'topic-eye-modeled',
        title: { en: 'Optical Media of the Eye (Cornea, Iris & Lens)' },
        explanation: { en: 'Light enters through the transparent cornea, passes through the pupil regulated by the pigmented iris, and is focused by the crystalline lens. Inner-ear auditory structures (cochlea) are planned for future addition.' },
        keyFacts: [
          'Cornea provides the majority of fixed optical refraction; the lens performs fine accommodation.',
        ],
        conceptIds: ['FMA58238', 'FMA58235', 'FMA58241'],
      },
    ],
  },
];

export const GUIDED_PATHWAYS: GuidedPathway[] = [
  {
    id: 'pathway-circulation',
    title: 'Blood Flow Through the Great Vessels',
    systemId: 'cardiovascular',
    summary: 'Trace venous return into the heart and arterial distribution through the aorta.',
    steps: [
      { stepNumber: 1, title: 'Superior Vena Cava', conceptId: 'FMA4720', note: 'Drains deoxygenated blood from upper body into the right atrium.' },
      { stepNumber: 2, title: 'Inferior Vena Cava', conceptId: 'FMA10951', note: 'Returns deoxygenated blood from abdomen, pelvis, and lower limbs.' },
      { stepNumber: 3, title: 'Heart', conceptId: 'FMA7088', note: 'Pumps blood to the lungs (right side) and systemic body (left side).' },
      { stepNumber: 4, title: 'Arch of Aorta', conceptId: 'FMA3768', note: 'Distributes oxygenated blood to head, arms, and descending aorta.' },
    ],
  },
  {
    id: 'pathway-respiration',
    title: 'Airway & Ventilation Pathway',
    systemId: 'respiratory',
    summary: 'Follow inspired air from the windpipe into both lungs and the muscle driving inhalation.',
    steps: [
      { stepNumber: 1, title: 'Trachea', conceptId: 'FMA7394', note: 'Cartilage-supported airway conducting air into the chest.' },
      { stepNumber: 2, title: 'Right Lung', conceptId: 'FMA7309', note: 'Three-lobed lung receiving air via the right main bronchus.' },
      { stepNumber: 3, title: 'Left Lung', conceptId: 'FMA7310', note: 'Two-lobed lung accommodating the cardiac notch.' },
      { stepNumber: 4, title: 'Diaphragm', conceptId: 'FMA13295', note: 'Primary inspiratory muscle expanding thoracic volume.' },
    ],
  },
  {
    id: 'pathway-digestion',
    title: 'Digestive Tract Journey',
    systemId: 'digestive',
    summary: 'Step from ingestion in the esophagus through chemical digestion, absorption, and elimination.',
    steps: [
      { stepNumber: 1, title: 'Esophagus', conceptId: 'FMA7131', note: 'Peristaltic muscular conduit passing posterior to the trachea.' },
      { stepNumber: 2, title: 'Stomach', conceptId: 'FMA7148', note: 'Acidic enzymatic churning chamber producing chyme.' },
      { stepNumber: 3, title: 'Duodenum', conceptId: 'FMA7206', note: 'Receives bile from liver/gallbladder and enzymes from pancreas.' },
      { stepNumber: 4, title: 'Small Intestine', conceptId: 'FMA7200', note: 'Major site of nutrient absorption via mucosal villi.' },
      { stepNumber: 5, title: 'Ascending & Descending Colon', conceptId: 'FMA14545', note: 'Reabsorbs water and electrolytes before rectal storage.' },
    ],
  },
  {
    id: 'pathway-skeleton',
    title: 'Core Skeletal Axis & Lower Limb',
    systemId: 'skeletal',
    summary: 'Inspect weight transfer from cranium and ribcage through pelvis down to the shin.',
    steps: [
      { stepNumber: 1, title: 'Skull', conceptId: 'FMA46565', note: 'Protects the brain and special sensory organs.' },
      { stepNumber: 2, title: 'Sternum & Ribs', conceptId: 'FMA7485', note: 'Shields heart and lungs within the thoracic cage.' },
      { stepNumber: 3, title: 'Pelvis', conceptId: 'FMA9578', note: 'Transfers axial weight into the hip joints.' },
      { stepNumber: 4, title: 'Femur', conceptId: 'FMA9611', note: 'Longest weight-bearing bone of the thigh.' },
      { stepNumber: 5, title: 'Tibia', conceptId: 'FMA24476', note: 'Medial shinbone carrying vertical load to the ankle.' },
    ],
  },
];

export const TERMINOLOGY_ENTRIES: TerminologyEntry[] = [
  { term: 'Anatomical Position', category: 'Plane', definition: 'Standard reference posture: standing upright, facing forward, arms at sides with palms facing anteriorly (forward), and feet flat.', example: 'In this position, the radius is always lateral to the ulna.' },
  { term: 'Sagittal Plane', category: 'Plane', definition: 'Vertical plane dividing the body into left and right portions (median/midsagittal divides into equal halves).', example: 'Viewing the body in Left or Right profile aligns with a sagittal view.' },
  { term: 'Coronal (Frontal) Plane', category: 'Plane', definition: 'Vertical plane dividing the body into anterior (front) and posterior (back) sections.', example: 'Front and Back camera presets look perpendicular to the coronal plane.' },
  { term: 'Transverse (Axial) Plane', category: 'Plane', definition: 'Horizontal plane dividing the body into superior (upper) and inferior (lower) parts.', example: 'The diaphragm lies near a transverse boundary between thorax and abdomen.' },
  { term: 'Anterior / Posterior', category: 'Directional', definition: 'Toward the front (ventral) vs. toward the back (dorsal) of the body.', example: 'The sternum is anterior to the heart; the esophagus is posterior to the trachea.' },
  { term: 'Superior / Inferior', category: 'Directional', definition: 'Closer to the head (cranial) vs. closer to the feet (caudal).', example: 'The lungs are superior to the diaphragm; the urinary bladder is inferior to the kidneys.' },
  { term: 'Medial / Lateral', category: 'Directional', definition: 'Closer to the midline of the body vs. farther from the midline.', example: 'The ulna is medial in the forearm; the fibula is lateral in the lower leg.' },
  { term: 'Proximal / Distal', category: 'Directional', definition: 'Closer to the trunk/point of attachment vs. farther away along a limb.', example: 'The humerus is proximal to the radius and ulna.' },
  { term: 'Superficial / Deep', category: 'Directional', definition: 'Closer to the outer skin surface vs. farther inside the body.', example: 'The skin is superficial to skeletal muscles, which are superficial to bones.' },
  { term: 'Hepato- / Reno- / Cardio- / Pulmo-', category: 'Root', definition: 'Classical Greek/Latin roots referring to Liver, Kidney, Heart, and Lung respectively.', example: 'Hepatic portal vein (liver), Renal hilum (kidney), Myocardium (heart), Pulmonary circuit (lungs).' },
];
