import type { LocalizedText, View } from './anatomy';
import type { CanonicalSystemId } from './anatomy-systems';

export type LearningCategoryId =
  | 'curriculum-hub'
  | 'by-system'
  | 'by-structure'
  | 'explore-body'
  | 'terminology';

export type StudentLevel = 'Foundational' | 'FSc / MDCAT' | 'MBBS / Nursing';

export interface NonModeledConcept {
  name: string;
  note: string;
}

export interface LessonTopic {
  id: string;
  title: LocalizedText;
  level: StudentLevel;
  explanation: LocalizedText;
  relationships: string[];
  keyFacts: string[];
  terminology: { term: string; meaning: string }[];
  conceptIds: string[];
  nonModeledConcepts?: NonModeledConcept[];
  preferredView?: View;
}

export interface AnatomyLesson {
  id: string;
  chapter: string;
  systemId: CanonicalSystemId;
  level: StudentLevel;
  title: LocalizedText;
  chapterDescription: LocalizedText;
  summary: LocalizedText;
  learningObjectives: string[];
  coverageDisclosure?: string;
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
  { id: 'curriculum-hub', title: 'Human Biology & Medical Sciences', subtitle: '16 curriculum-aligned domains across School, Pre-Medical, Medical Foundations, Clinical, and Allied Health tracks.' },
  { id: 'by-system', title: 'Learn by Anatomical System', subtitle: 'Structured chapters and interactive 3D lessons across all 12 canonical organ systems.' },
  { id: 'by-structure', title: 'Learn by Individual Structure', subtitle: 'High-yield organ, bone, and muscle study guides linked directly to 3D inspection.' },
  { id: 'explore-body', title: 'Explore the Human Body', subtitle: 'Step-by-step guided 3D pathways tracing blood flow, airflow, digestion, and skeleton.' },
  { id: 'terminology', title: 'Anatomy Terminology', subtitle: 'Anatomical position, planes, directional terms, and classical root vocabulary.' },
];

export const ANATOMY_LESSONS: AnatomyLesson[] = [
  {
    id: 'lesson-skeletal-framework',
    chapter: 'Chapter 1 · Skeletal System',
    systemId: 'skeletal',
    level: 'FSc / MDCAT',
    title: { en: 'Axial & Appendicular Skeletal Architecture' },
    chapterDescription: {
      en: 'Understand how the central axial axis protects vital organs while the pectoral and pelvic girdles suspend limbs for movement and weight bearing.',
    },
    summary: {
      en: 'Organization of the cranium, spine, thoracic cage, shoulder and pelvic girdles, and upper/lower limb long bones.',
    },
    learningObjectives: [
      'Distinguish the protective axial skeleton from the mobile appendicular skeleton.',
      'Identify cervical, thoracic, and lumbar vertebral regions and true vs. floating rib attachments.',
      'Compare upper-limb mobility (clavicle/scapula/radius/ulna) with lower-limb weight transfer (pelvis/femur/tibia/fibula).',
    ],
    topics: [
      {
        id: 'topic-skeletal-skull-jaw',
        title: { en: 'Cranium & Mandible' },
        level: 'Foundational',
        explanation: {
          en: 'The skull consists of the protective neurocranium surrounding the brain and the viscerocranium supporting the face and teeth. While cranial vault bones interlock tightly at fibrous sutures, the mandible hinges at the temporomandibular joint (TMJ) for chewing and speech.',
        },
        relationships: [
          'Superiorly and internally, the cranial cavity encloses the brain, cerebellum, and brainstem.',
          'Inferiorly, the occipital base articulates with the first cervical vertebra (atlas) at the atlanto-occipital joint.',
        ],
        keyFacts: [
          'The mandible is the only freely movable bone of the skull.',
          'Cranial sutures act as shock-absorbing fibrous joints that gradually ossify with age.',
        ],
        terminology: [
          { term: 'Neurocranium', meaning: 'Bony vault enclosing and shielding the brain.' },
          { term: 'Sutures', meaning: 'Immovable fibrous joints uniting adjacent flat skull bones.' },
        ],
        conceptIds: ['FMA46565', 'FMA52748'],
        preferredView: 'three-quarter',
      },
      {
        id: 'topic-skeletal-thorax-spine',
        title: { en: 'Thoracic Cage & Vertebral Column' },
        level: 'FSc / MDCAT',
        explanation: {
          en: 'The axial spine stacks cervical (7), thoracic (12), and lumbar (5) vertebrae to carry upper-body weight and guard the spinal cord. Twelve pairs of ribs curve anteriorly from the thoracic vertebrae toward the sternum, creating a flexible protective cage around the heart and lungs.',
        },
        relationships: [
          'Sternum lies directly anterior to the heart and thymus; ribs wrap laterally around both lungs.',
          'Thoracic vertebrae articulate posteriorly with ribs, while lumbar vertebrae transfer trunk weight into the sacrum and pelvis.',
        ],
        keyFacts: [
          'Pairs 1–7 are true ribs attaching directly to the sternum via costal cartilages; 8–10 are false ribs; 11–12 are floating ribs.',
          'Sternum comprises three segments: manubrium, body, and xiphoid process.',
        ],
        terminology: [
          { term: 'Sternal Angle', meaning: 'Palpable ridge between manubrium and body marking the level of the 2nd rib.' },
          { term: 'Costal Cartilage', meaning: 'Hyaline cartilage bars giving elasticity to anterior rib attachments.' },
        ],
        conceptIds: ['FMA7485', 'FMA7574', 'FMA9915', 'FMA9139', 'FMA9921'],
        preferredView: 'three-quarter',
      },
      {
        id: 'topic-skeletal-upper-limb',
        title: { en: 'Pectoral Girdle & Upper Limb' },
        level: 'FSc / MDCAT',
        explanation: {
          en: 'The clavicle acts as a horizontal strut holding the shoulder laterally away from the chest wall, while the triangular scapula glides posteriorly over the ribs. Distal to the humerus, the lateral radius rotates around the medial ulna so the hand can pronate and supinate.',
        },
        relationships: [
          'Clavicle connects the pectoral girdle medially to the manubrium of the sternum and laterally to the acromion of the scapula.',
          'Radius lies on the lateral (thumb) side in anatomical position; ulna forms the primary hinge at the elbow.',
        ],
        keyFacts: [
          'Glenohumeral joint sacrifices stability for multi-axis range of motion compared with the deep hip socket.',
          'Pronation turns the palm posteriorly as the radius crosses obliquely over the ulna.',
        ],
        terminology: [
          { term: 'Glenoid Cavity', meaning: 'Shallow lateral socket on the scapula articulating with the humeral head.' },
          { term: 'Pronation / Supination', meaning: 'Forearm rotation turning the palm downward/backward vs. forward/upward.' },
        ],
        conceptIds: ['FMA13321', 'FMA13394', 'FMA13303', 'FMA23463', 'FMA23466'],
        preferredView: 'front',
      },
      {
        id: 'topic-skeletal-lower-limb',
        title: { en: 'Pelvic Girdle & Lower Limb' },
        level: 'MBBS / Nursing',
        explanation: {
          en: 'Unlike the mobile shoulder, the pelvic girdle forms a sturdy bony ring transferring trunk weight into both femora. Below the knee—protected anteriorly by the sesamoid patella—the thick medial tibia carries vertical load down to the ankle while the slender lateral fibula stabilizes the ankle mortise.',
        },
        relationships: [
          'Pelvis shields the urinary bladder, rectum, and internal pelvic structures anteriorly and laterally.',
          'Gastrocnemius and soleus transmit force through the calcaneal (Achilles) tendon onto the heel.',
        ],
        keyFacts: [
          'Femur is the longest and strongest bone in the human body; patella is the largest sesamoid bone.',
          'Fibula bears negligible axial body weight and does not enter the knee joint.',
        ],
        terminology: [
          { term: 'Acetabulum', meaning: 'Deep cup-shaped hip socket formed by fusion of ilium, ischium, and pubis.' },
          { term: 'Sesamoid Bone', meaning: 'Bone embedded inside a tendon to boost mechanical leverage.' },
        ],
        conceptIds: ['FMA9578', 'FMA9611', 'FMA24485', 'FMA24476', 'FMA24479', 'FMA258847'],
        preferredView: 'front',
      },
    ],
  },
  {
    id: 'lesson-muscular-mechanics',
    chapter: 'Chapter 2 · Muscular System',
    systemId: 'muscular',
    level: 'FSc / MDCAT',
    title: { en: 'Posture, Breathing & Antagonistic Limb Action' },
    chapterDescription: {
      en: 'Explore how skeletal muscles generate force by shortening between origin and insertion across joints, driving head orientation, ventilation, and bipedal locomotion.',
    },
    summary: {
      en: 'Superficial neck and trunk stabilizers, the thoracic diaphragm, upper-limb flexor/extensor pairs, and lower-limb propulsion groups.',
    },
    learningObjectives: [
      'Explain how the diaphragm alters intrathoracic volume during quiet inspiration.',
      'Contrast antagonistic flexion and extension pairs in the upper arm (biceps vs. triceps).',
      'Identify primary gluteal, anterior thigh, and posterior calf muscles supporting upright posture and gait.',
    ],
    topics: [
      {
        id: 'topic-muscular-neck-diaphragm',
        title: { en: 'Neck Posture & Thoracic Diaphragm' },
        level: 'FSc / MDCAT',
        explanation: {
          en: 'Superficial neck and upper back muscles—such as sternocleidomastoid and trapezius—position the head and brace the pectoral girdle. Beneath the lungs, the dome-shaped diaphragm partitions the thorax from the abdomen and contracts downward to pull air into the airways.',
        },
        relationships: [
          'Sternocleidomastoid runs obliquely superficial to the carotid sheath containing the common carotid artery and internal jugular vein.',
          'The diaphragm sits immediately superior to the liver and stomach and inferior to the heart and lungs.',
        ],
        keyFacts: [
          'Diaphragm is innervated by the phrenic nerves arising from cervical spinal roots C3–C5.',
          'Unilateral sternocleidomastoid contraction tilts the head ipsilaterally and rotates the chin contralaterally.',
        ],
        terminology: [
          { term: 'Origin / Insertion', meaning: 'Usually proximal stationary attachment vs. distal bone moved during contraction.' },
          { term: 'Phrenic Nerve', meaning: 'Motor supply to the diaphragm ("C3, 4, 5 keeps the diaphragm alive").' },
        ],
        conceptIds: ['FMA13407', 'FMA32529', 'FMA13295'],
        preferredView: 'three-quarter',
      },
      {
        id: 'topic-muscular-upper-limb',
        title: { en: 'Thorax, Shoulder & Arm Antagonists' },
        level: 'FSc / MDCAT',
        explanation: {
          en: 'Pectoralis major and pectoralis minor bridge the chest wall to the humerus and scapula, while the deltoid caps the shoulder for arm abduction. Along the humerus, anterior biceps brachii flexes the elbow and supinates the forearm against the posterior triceps brachii.',
        },
        relationships: [
          'Pectoralis minor lies deep to pectoralis major and inserts onto the coracoid process of the scapula.',
          'Long and short heads of biceps brachii lie anteriorly over the humerus; the three heads of triceps lie posteriorly.',
        ],
        keyFacts: [
          'Biceps brachii is a powerful forearm supinator as well as an elbow flexor.',
          'All three heads of triceps brachii are innervated by the radial nerve.',
        ],
        terminology: [
          { term: 'Agonist / Antagonist', meaning: 'Prime mover generating a motion vs. opposing muscle restoring extension or braking.' },
          { term: 'Abduction / Adduction', meaning: 'Moving a limb away from vs. back toward the body midline.' },
        ],
        conceptIds: ['FMA34686', 'FMA13109', 'FMA34676', 'FMA37682', 'FMA37683', 'FMA37692', 'FMA37693', 'FMA37694'],
        preferredView: 'front',
      },
      {
        id: 'topic-muscular-lower-limb',
        title: { en: 'Gluteal Stability & Lower Limb Propulsion' },
        level: 'MBBS / Nursing',
        explanation: {
          en: 'Standing and walking rely on gluteus maximus to extend the hip, gluteus medius to prevent pelvic drop during single-leg stance, the four-headed quadriceps femoris to extend the knee via the patella, and gastrocnemius plus soleus to plantarflex the ankle.',
        },
        relationships: [
          'Quadriceps femoris converges directly onto the patella and tibial tuberosity anteriorly.',
          'Gastrocnemius and the deeper soleus share the calcaneal tendon posteriorly.',
        ],
        keyFacts: [
          'Gluteus maximus is the largest muscle of the posterior hip; gluteus medius weakness causes Trendelenburg gait.',
          'Soleus contains predominantly fatigue-resistant slow-twitch fibers suited for standing posture.',
        ],
        terminology: [
          { term: 'Plantarflexion', meaning: 'Pointing the toes downward by elevating the heel, essential for push-off.' },
          { term: 'Triceps Surae', meaning: 'Combined two-headed gastrocnemius and soleus calf group.' },
        ],
        conceptIds: ['FMA22314', 'FMA22315', 'FMA22429', 'FMA45950', 'FMA22542'],
        nonModeledConcepts: [
          {
            name: 'Sarcomere Ultrastructure & Smooth/Cardiac Histology',
            note: 'Actin–myosin sliding filament cross-bridges and smooth/cardiac muscle fibers are microscopic concepts not individually modeled as 3D meshes.',
          },
        ],
        preferredView: 'three-quarter',
      },
    ],
  },
  {
    id: 'lesson-nervous-control',
    chapter: 'Chapter 3 · Nervous System',
    systemId: 'nervous',
    level: 'MBBS / Nursing',
    title: { en: 'Central Nervous System & Cranial Pathways' },
    chapterDescription: {
      en: 'Examine the structural divisions of the central nervous system and trace how cranial and spinal nerves connect peripheral sensory organs to central processing centers.',
    },
    summary: {
      en: 'Functional division between cerebrum, cerebellum, brainstem, spinal cord, and orbital/cranial neural structures.',
    },
    learningObjectives: [
      'Contrast executive cerebral functions with cerebellar coordination and autonomic brainstem control.',
      'Trace the continuity of the brainstem through the foramen magnum into the spinal cord.',
      'Locate modeled orbital neural pathways including the optic nerve and ciliary ganglion.',
    ],
    coverageDisclosure:
      'Partial 3D coverage: major brain regions, brainstem, spinal cord, and key cranial/orbital/limb nerves are modeled; cortical Brodmann maps, synaptic clefts, and peripheral microscopic endings are conceptual.',
    topics: [
      {
        id: 'topic-nervous-brain-divisions',
        title: { en: 'Cerebrum, Cerebellum & Brainstem' },
        level: 'MBBS / Nursing',
        explanation: {
          en: 'The cerebrum governs conscious sensory perception, memory, language, and voluntary motor planning. Beneath its occipital lobes sits the cerebellum, fine-tuning posture and movement accuracy, while the midline brainstem (midbrain, pons, medulla) sustains heart rate, blood pressure, and breathing.',
        },
        relationships: [
          'All three central divisions lie protected inside the cranial cavity of the skull.',
          'The pituitary gland and pineal body attach directly to hypothalamic and epithalamic regions of the brain.',
        ],
        keyFacts: [
          'Brainstem consists superior-to-inferior of midbrain, pons, and medulla oblongata.',
          'Right cerebral hemisphere primarily controls and perceives the left side of the body, and vice versa.',
        ],
        terminology: [
          { term: 'Gyri & Sulci', meaning: 'Folded ridges and grooves maximizing cerebral cortical surface area.' },
          { term: 'Medulla Oblongata', meaning: 'Inferior brainstem containing vital respiratory and vasomotor centers.' },
        ],
        conceptIds: ['FMA50801', 'FMA67944', 'FMA79876'],
        preferredView: 'left',
      },
      {
        id: 'topic-nervous-spinal-cranial',
        title: { en: 'Spinal Cord & Cranial/Orbital Nerves' },
        level: 'FSc / MDCAT',
        explanation: {
          en: 'Descending from the medulla oblongata through the vertebral canal, the spinal cord links 31 pairs of spinal nerves to the brain and executes rapid reflex arcs. Cranial pathways—such as the optic nerve (CN II), ophthalmic division (CN V1), and ciliary ganglion—connect the orbit directly to the brain.',
        },
        relationships: [
          'Spinal cord travels inside the protective vertebral canal formed by cervical, thoracic, and lumbar vertebrae.',
          'Optic nerve exits the posterior sclera of the eyeball to transmit visual impulses into the cranial cavity.',
        ],
        keyFacts: [
          'Adult spinal cord typically terminates near vertebral level L1–L2 as the conus medullaris.',
          'Optic nerve (CN II) is wrapped in meninges and myelinated by oligodendrocytes rather than Schwann cells.',
        ],
        terminology: [
          { term: 'Reflex Arc', meaning: 'Rapid involuntary sensory-to-motor circuit mediated at the spinal cord level.' },
          { term: 'Ganglion', meaning: 'Collection of neuronal cell bodies outside the central nervous system.' },
        ],
        conceptIds: ['FMA7647', 'FMA50863', 'FMA52623', 'FMA53550'],
        preferredView: 'three-quarter',
      },
    ],
  },
  {
    id: 'lesson-cardio-circulation',
    chapter: 'Chapter 4 · Cardiovascular System',
    systemId: 'cardiovascular',
    level: 'FSc / MDCAT',
    title: { en: 'The Heart, Pulmonary Loop & Systemic Vessels' },
    chapterDescription: {
      en: 'Follow blood continuously through the four-chambered heart, pulmonary gas-exchange circuit, coronary supply, and systemic arterial and venous trees.',
    },
    summary: {
      en: 'How the heart separates pulmonary and systemic circulation and delivers blood through major arteries and veins.',
    },
    learningObjectives: [
      'Identify all four cardiac chambers and four one-way valves enforcing unidirectional flow.',
      'Differentiate the low-pressure pulmonary circuit from the high-pressure systemic circuit.',
      'Trace the aortic arch, venae cavae, carotid/jugular vessels, and hepatic portal circulation.',
    ],
    topics: [
      {
        id: 'topic-cardio-heart-chambers',
        title: { en: 'Four Chambers & One-Way Valves' },
        level: 'FSc / MDCAT',
        explanation: {
          en: 'Deoxygenated blood enters the right atrium, passes through the tricuspid valve into the right ventricle, and is pumped through the pulmonary valve toward the lungs. Oxygenated blood returns to the left atrium, crosses the mitral valve into the thick-walled left ventricle, and ejects through the aortic valve.',
        },
        relationships: [
          'The heart sits obliquely in the middle mediastinum between the right and left lungs, resting on the diaphragm.',
          'The sternum and costal cartilages shield the anterior cardiac surface.',
        ],
        keyFacts: [
          'Left ventricular myocardium is ~3x thicker than the right ventricle because systemic vascular resistance far exceeds pulmonary resistance.',
          'First heart sound ("lub") reflects AV valve (tricuspid/mitral) closure; second ("dub") reflects semilunar valve closure.',
        ],
        terminology: [
          { term: 'Systole / Diastole', meaning: 'Ventricular contraction/ejection phase vs. relaxation/filling phase.' },
          { term: 'Atrioventricular Valves', meaning: 'Tricuspid (right) and mitral/bicuspid (left) valves preventing backflow into atria.' },
        ],
        conceptIds: ['FMA7088', 'FMA11359', 'FMA9291', 'FMA9465', 'FMA9466', 'FMA7238', 'FMA7242', 'FMA7247', 'FMA7254'],
        preferredView: 'front',
      },
      {
        id: 'topic-cardio-pulmonary-coronary',
        title: { en: 'Pulmonary Circuit & Coronary Supply' },
        level: 'MBBS / Nursing',
        explanation: {
          en: 'The pulmonary trunk carries deoxygenated blood from the right ventricle into both lungs, and pulmonary veins return oxygenated blood to the left atrium. Simultaneously, the heart muscle nourishes itself via coronary arteries arising directly above the aortic valve.',
        },
        relationships: [
          'Pulmonary trunk bifurcates immediately beneath the arch of aorta to reach the hila of the right and left lungs.',
          'Right coronary artery courses along the atrioventricular groove supplying the right heart and SA/AV nodes in most individuals.',
        ],
        keyFacts: [
          'Pulmonary arteries carry deoxygenated blood while pulmonary veins carry oxygenated blood—exceptions to the systemic rule.',
          'Coronary myocardium perfusion peaks during ventricular diastole when the aortic valve closes.',
        ],
        terminology: [
          { term: 'Pulmonary Circuit', meaning: 'Right heart → lungs → left atrium loop dedicated solely to gas exchange.' },
          { term: 'Myocardial Ischemia', meaning: 'Reduced oxygen delivery to heart muscle when coronary flow is obstructed.' },
        ],
        conceptIds: ['FMA8612', 'FMA8648', 'FMA3802', 'FMA7088'],
        preferredView: 'front',
      },
      {
        id: 'topic-cardio-great-vessels',
        title: { en: 'Aorta, Venae Cavae & Portal Return' },
        level: 'FSc / MDCAT',
        explanation: {
          en: 'Oxygenated blood leaves the left ventricle via the ascending aorta, arch of aorta (supplying the head via common carotid arteries), and descending aorta. Venous blood drains via internal jugular veins into the superior vena cava, from abdominal viscera into the inferior vena cava, and from the gut into the liver via the hepatic portal vein.',
        },
        relationships: [
          'Superior and inferior venae cavae converge directly into the posterior/superior walls of the right atrium.',
          'Hepatic portal vein delivers nutrient-rich blood from intestines and spleen into the liver before hepatic veins join the IVC.',
        ],
        keyFacts: [
          'Aortic arch typically gives off three branches: brachiocephalic trunk, left common carotid artery, and left subclavian artery.',
          'Hepatic portal vein supplies ~75% of blood reaching the liver.',
        ],
        terminology: [
          { term: 'Systemic Circuit', meaning: 'Left heart → entire body tissues → right atrium loop delivering O2 and nutrients.' },
          { term: 'Portal Vein', meaning: 'Vein carrying blood between two capillary beds (GI tract capillaries → liver sinusoids).' },
        ],
        conceptIds: ['FMA3736', 'FMA3768', 'FMA3784', 'FMA3939', 'FMA4720', 'FMA10951', 'FMA4724', 'FMA50735'],
        preferredView: 'front',
      },
    ],
  },
  {
    id: 'lesson-respiratory-mechanics',
    chapter: 'Chapter 5 · Respiratory System',
    systemId: 'respiratory',
    level: 'FSc / MDCAT',
    title: { en: 'Airways, Bronchial Trees & Breathing Mechanics' },
    chapterDescription: {
      en: 'Follow inspired air along the cartilaginous conducting airways into both lungs and examine how the diaphragm and ribcage create pressure gradients for ventilation.',
    },
    summary: {
      en: 'Air conduction from trachea and main bronchi into both lungs paired with diaphragm-driven inhalation.',
    },
    learningObjectives: [
      'Describe why tracheal cartilage rings are C-shaped rather than complete rings.',
      'Compare the three-lobed right lung and wider right main bronchus with the two-lobed left lung.',
      'Explain Boyle’s law pressure changes produced by the diaphragm and ribcage during breathing.',
    ],
    topics: [
      {
        id: 'topic-respiratory-airways',
        title: { en: 'Trachea, Main Bronchi & Lung Lobes' },
        level: 'FSc / MDCAT',
        explanation: {
          en: 'Inhaled air passes down the trachea and splits at the carina into the right and left main bronchi, branching into lobar and segmental bronchial trees inside each lung. The right lung houses three lobes, while the left lung has two lobes and a cardiac notch accommodating the heart.',
        },
        relationships: [
          'Trachea lies directly anterior to the esophagus and posterior to the sternum and thymus.',
          'Left main bronchus passes inferior to the arch of aorta to reach the left lung hilum.',
        ],
        keyFacts: [
          'C-shaped hyaline cartilage rings keep the trachea patent while allowing its posterior wall to yield as food passes down the esophagus.',
          'Right main bronchus is wider, shorter, and more vertical than the left—common destination for aspirated objects.',
        ],
        terminology: [
          { term: 'Carina', meaning: 'Sensitive internal ridge at the bifurcation of the trachea into main bronchi.' },
          { term: 'Cardiac Notch', meaning: 'Anterior indentation on the left lung accommodating the apex of the heart.' },
        ],
        conceptIds: ['FMA7394', 'FMA7395', 'FMA7396', 'FMA7309', 'FMA7310'],
        preferredView: 'front',
      },
      {
        id: 'topic-respiratory-mechanics',
        title: { en: 'Diaphragm & Thoracic Ventilation' },
        level: 'FSc / MDCAT',
        explanation: {
          en: 'During quiet inspiration, diaphragm contraction pulls its central dome downward while ribs elevate outward. Expanding thoracic volume lowers intrapulmonary pressure slightly below atmospheric pressure, drawing air into the bronchial tree; quiet expiration occurs mainly through elastic recoil.',
        },
        relationships: [
          'Diaphragm forms the muscular floor beneath both lungs and heart and sits immediately above the liver and stomach.',
          'Ribs surround the pleura-lined lungs laterally and protect them from external trauma.',
        ],
        keyFacts: [
          'Quiet breathing obeys Boyle’s Law: increasing volume decreases pressure so air flows down its pressure gradient.',
          'Diaphragm contraction accounts for roughly two-thirds of quiet tidal volume.',
        ],
        terminology: [
          { term: 'Pleura', meaning: 'Double-layered serous membrane anchoring the lung surface to the thoracic wall.' },
          { term: 'Tidal Volume', meaning: 'Air volume (~500 mL) inhaled and exhaled during a normal resting breath.' },
        ],
        conceptIds: ['FMA13295', 'FMA7574', 'FMA7309', 'FMA7310'],
        nonModeledConcepts: [
          {
            name: 'Alveolar-Capillary Gas Exchange Membrane',
            note: 'Microscopic alveoli, Type I/II pneumocytes (surfactant), and capillary diffusion barriers are below gross 3D mesh resolution.',
          },
        ],
        preferredView: 'three-quarter',
      },
    ],
  },
  {
    id: 'lesson-digestive-system',
    chapter: 'Chapter 6 · Digestive System',
    systemId: 'digestive',
    level: 'FSc / MDCAT',
    title: { en: 'Alimentary Canal & Accessory Digestive Organs' },
    chapterDescription: {
      en: 'Trace food from swallowing in the esophagus through gastric acid breakdown, hepatic/pancreatic enzymatic digestion in the duodenum, intestinal absorption, and colonic water recovery.',
    },
    summary: {
      en: 'Sequential mechanical and chemical digestion across the GI tract paired with liver, gallbladder, and pancreas secretions.',
    },
    learningObjectives: [
      'Trace the anatomical sequence of the alimentary canal from esophagus to rectum.',
      'Differentiate the digestive roles of the liver, gallbladder, and exocrine pancreas in the duodenum.',
      'Explain regional specialization of the small intestine (absorption) vs. large intestine (water/electrolyte recovery).',
    ],
    topics: [
      {
        id: 'topic-digestive-upper-gi',
        title: { en: 'Esophagus, Stomach & Duodenum' },
        level: 'FSc / MDCAT',
        explanation: {
          en: 'Swallowed food travels down the muscular esophagus behind the trachea, passes through the diaphragm into the stomach—where hydrochloric acid and pepsin begin protein digestion—and enters the C-shaped duodenum as acidic chyme ready for neutralization and enzymatic breakdown.',
        },
        relationships: [
          'Esophagus descends immediately posterior to the trachea and anterior to the thoracic vertebrae.',
          'The C-loop of the duodenum wraps snugly around the head of the pancreas.',
        ],
        keyFacts: [
          'Stomach mucosa forms folds called rugae that flatten as the organ distends after a meal.',
          'Duodenum receives alkaline pancreatic bicarbonate, digestive enzymes, and bile through the duodenal papilla.',
        ],
        terminology: [
          { term: 'Peristalsis', meaning: 'Involuntary smooth muscle waves propelling food forward along the GI tract.' },
          { term: 'Chyme', meaning: 'Semi-fluid acidic mixture leaving the stomach into the duodenum.' },
        ],
        conceptIds: ['FMA7131', 'FMA7148', 'FMA7206'],
        preferredView: 'front',
      },
      {
        id: 'topic-digestive-accessory-glands',
        title: { en: 'Liver, Gallbladder & Exocrine Pancreas' },
        level: 'FSc / MDCAT',
        explanation: {
          en: 'Sitting beneath the right diaphragm, the liver synthesizes bile salts that emulsify dietary fats and processes absorbed nutrients arriving via the hepatic portal vein. The gallbladder stores and concentrates bile, while the pancreas delivers amylase, lipase, and proteases via the pancreatic duct into the duodenum.',
        },
        relationships: [
          'Gallbladder nests on the inferior visceral surface of the right liver lobe.',
          'Pancreas extends retroperitoneally from the duodenal C-loop leftward to touch the spleen.',
        ],
        keyFacts: [
          'Bile emulsifies fats mechanically into small droplets without containing digestive enzymes itself.',
          'Pancreas is a dual organ: exocrine acini aid digestion while endocrine islets regulate blood glucose.',
        ],
        terminology: [
          { term: 'Emulsification', meaning: 'Dispersion of large fat globules into tiny droplets so pancreatic lipase can act efficiently.' },
          { term: 'Pancreatic Duct', meaning: 'Main duct draining exocrine enzymes from pancreas into the duodenum.' },
        ],
        conceptIds: ['FMA7197', 'FMA7202', 'FMA7198', 'FMA10419'],
        preferredView: 'front',
      },
      {
        id: 'topic-digestive-intestines',
        title: { en: 'Small Intestine, Colon, Appendix & Rectum' },
        level: 'MBBS / Nursing',
        explanation: {
          en: 'Coils of the small intestine (jejunum and ileum) absorb carbohydrates, amino acids, lipids, and vitamins across folded villi. Remaining residue passes through the ileocecal junction past the appendix, ascends, crosses, and descends along the colon for water/electrolyte reabsorption before storage in the rectum.',
        },
        relationships: [
          'Small intestine coils centrally inside the abdominal cavity, framed along the perimeter by the ascending, transverse, and descending colon.',
          'Rectum descends anteriorly to the sacrum and posterior to the urinary bladder (and prostate in males).',
        ],
        keyFacts: [
          'Small intestine accounts for the vast majority of nutrient and water absorption.',
          'Colon features longitudinal muscle bands (taeniae coli) and segmented pouches (haustra).',
        ],
        terminology: [
          { term: 'Villi', meaning: 'Microscopic finger-like mucosal projections increasing intestinal absorptive surface area.' },
          { term: 'Haustra', meaning: 'Characteristic sacculated pouches along the large intestine.' },
        ],
        conceptIds: ['FMA7200', 'FMA14542', 'FMA14545', 'FMA14546', 'FMA14547', 'FMA14544'],
        preferredView: 'front',
      },
    ],
  },
  {
    id: 'lesson-urinary-system',
    chapter: 'Chapter 7 · Urinary System',
    systemId: 'urinary',
    level: 'FSc / MDCAT',
    title: { en: 'Renal Filtration & Urinary Tract Elimination' },
    chapterDescription: {
      en: 'Study how paired retroperitoneal kidneys filter blood plasma, regulate fluid and acid–base homeostasis, and transport urine through ureters, bladder, and urethra.',
    },
    summary: {
      en: 'Gross renal anatomy, renal vascular pedicles, ureteric peristalsis, bladder storage, and urethral elimination.',
    },
    learningObjectives: [
      'Locate both kidneys retroperitoneally and explain why the right kidney sits slightly lower than the left.',
      'Trace blood entering and leaving the renal hilum via renal arteries and veins.',
      'Follow urine transport from kidneys down both ureters into the detrusor-lined urinary bladder and out the urethra.',
    ],
    topics: [
      {
        id: 'topic-urinary-kidneys-vessels',
        title: { en: 'Kidneys & Renal Vascular Supply' },
        level: 'FSc / MDCAT',
        explanation: {
          en: 'The paired kidneys rest against the posterior abdominal wall behind the peritoneum (T12–L3), clearing nitrogenous waste (urea, creatinine) while balancing water, electrolytes, and blood pH. Large renal arteries branch directly from the abdominal aorta into each renal hilum, and renal veins return filtered blood to the inferior vena cava.',
        },
        relationships: [
          'The right kidney sits slightly lower than the left kidney due to the large overlying right lobe of the liver.',
          'Paired adrenal glands rest directly atop the superior poles of both kidneys.',
        ],
        keyFacts: [
          'Kidneys receive ~20–25% of total resting cardiac output despite representing under 1% of body weight.',
          'Right renal artery is longer (crosses behind IVC); left renal vein is longer (crosses in front of aorta).',
        ],
        terminology: [
          { term: 'Retroperitoneal', meaning: 'Positioned behind the peritoneal lining on the posterior abdominal wall.' },
          { term: 'Renal Hilum', meaning: 'Medial cleft transmitting renal vein, renal artery, and ureter.' },
        ],
        conceptIds: ['FMA7203', 'FMA7204', 'FMA7205', 'FMA14751', 'FMA14334'],
        nonModeledConcepts: [
          {
            name: 'Nephron & Glomerular Filtration Unit',
            note: 'Microscopic nephrons (~1 million per kidney: Bowman capsule, loop of Henle, collecting duct) are conceptual histology not resolved as separate 3D meshes.',
          },
        ],
        preferredView: 'front',
      },
      {
        id: 'topic-urinary-ureters-bladder',
        title: { en: 'Ureters, Urinary Bladder & Urethra' },
        level: 'FSc / MDCAT',
        explanation: {
          en: 'From each renal pelvis, muscular ureters descend retroperitoneally and deliver urine via peristalsis into the posterior wall of the urinary bladder. The distensible bladder stores urine behind the pubic symphysis until coordinated detrusor contraction and sphincter relaxation expel it through the urethra.',
        },
        relationships: [
          'Ureters enter the bladder obliquely so rising bladder pressure compresses their openings, preventing vesicoureteral reflux.',
          'In the male reference model, the bladder neck rests immediately superior to the prostate gland and anterior to the rectum.',
        ],
        keyFacts: [
          'Three physiological ureteric narrowings (pelviureteric junction, pelvic brim, bladder entry) are common sites for kidney stone impaction.',
          'Transitional epithelium (urothelium) stretches safely as the bladder fills without leaking.',
        ],
        terminology: [
          { term: 'Detrusor Muscle', meaning: 'Three-layered smooth muscle coat of the bladder wall driving micturition.' },
          { term: 'Micturition', meaning: 'Autonomic and voluntary reflex emptying urine from the bladder through the urethra.' },
        ],
        conceptIds: ['FMA9704', 'FMA15900', 'FMA19667'],
        preferredView: 'front',
      },
    ],
  },
  {
    id: 'lesson-reproductive-system',
    chapter: 'Chapter 8 · Reproductive System',
    systemId: 'reproductive',
    level: 'FSc / MDCAT',
    title: { en: 'Gametogenesis & Male Pelvic Reproductive Anatomy' },
    chapterDescription: {
      en: 'Examine sperm production, maturation, ductal transport, accessory seminal secretions, and external anatomy using the verified adult male 3D reference, alongside transparent notes on female pelvic anatomy.',
    },
    summary: {
      en: 'Testes, epididymis, deferent ducts, seminal vesicles, prostate, and penile structures (adult male 3D reference only).',
    },
    learningObjectives: [
      'Trace the complete pathway of spermatozoa from testis through epididymis, deferent duct, and urethra.',
      'Identify the fluid contributions of the seminal vesicles and prostate gland.',
      'Recognize the dataset boundary: current 3D meshes cover adult male reproductive anatomy only.',
    ],
    coverageDisclosure:
      'Male Reference Only: BodyParts3D 4.0 provides 12 verified adult male reproductive meshes. Female reproductive organs (ovaries, uterine tubes, uterus) are taught below conceptually and are not present in this 3D mesh pack.',
    topics: [
      {
        id: 'topic-repro-gonads-ducts',
        title: { en: 'Testes, Epididymis & Deferent Duct' },
        level: 'FSc / MDCAT',
        explanation: {
          en: 'Paired testes produce haploid spermatozoa inside seminiferous tubules and testosterone from interstitial Leydig cells, cooled slightly outside the abdomen within the scrotum. Sperm mature and gain motility in the coiled epididymis before ascending through the muscular deferent duct (vas deferens) into the pelvis.',
        },
        relationships: [
          'Epididymis caps the superior and posterior border of each testis.',
          'Each deferent duct ascends through the spermatic cord and loops posterior to the urinary bladder to meet the seminal vesicle.',
        ],
        keyFacts: [
          'Extra-abdominal scrotal position keeps spermatogenesis ~2–3 °C below core body temperature.',
          'Sertoli cells form the blood-testis barrier and nourish developing spermatids.',
        ],
        terminology: [
          { term: 'Leydig Cells', meaning: 'Interstitial testicular cells secreting testosterone in response to LH.' },
          { term: 'Vas Deferens', meaning: 'Thick-walled muscular duct propelling sperm toward the ejaculatory duct.' },
        ],
        conceptIds: ['FMA7210', 'FMA18255', 'FMA19234'],
        preferredView: 'three-quarter',
      },
      {
        id: 'topic-repro-accessory-external',
        title: { en: 'Seminal Vesicles, Prostate & Penile Structures' },
        level: 'MBBS / Nursing',
        explanation: {
          en: 'Posterior to the bladder, paired seminal vesicles add fructose-rich alkaline fluid as the deferent ducts form ejaculatory ducts entering the prostate gland, which contributes milky activating enzymes. Distally, paired corpora cavernosa and the midline corpus spongiosum (enclosing the urethra and expanding as glans penis) form the copulatory organ.',
        },
        relationships: [
          'Prostate encircles the prostatic urethra immediately inferior to the urinary bladder neck.',
          'Corpus spongiosum runs ventrally beneath the corpora cavernosa to protect the spongy urethra.',
        ],
        keyFacts: [
          'Seminal vesicles contribute ~60–70% of total semen volume; prostate adds ~20–30%.',
          'In male anatomy, the spongy urethra is shared by both urinary and reproductive systems.',
        ],
        terminology: [
          { term: 'Ejaculatory Duct', meaning: 'Short duct inside the prostate formed by union of vas deferens and seminal vesicle duct.' },
          { term: 'Corpora Cavernosa', meaning: 'Paired dorsal erectile columns engorging with arterial blood during erection.' },
        ],
        conceptIds: ['FMA19386', 'FMA9600', 'FMA19618', 'FMA19617', 'FMA18247'],
        nonModeledConcepts: [
          {
            name: 'Female Reproductive Anatomy (Ovaries, Fallopian Tubes & Uterus)',
            note: 'Educational disclosure: Ovaries produce oocytes and estrogen/progesterone, uterine tubes conduct fertilization, and the muscular uterus supports implantation; female 3D meshes are not included in the current male-only BodyParts3D 4.0 release.',
          },
        ],
        preferredView: 'left',
      },
    ],
  },
  {
    id: 'lesson-endocrine-system',
    chapter: 'Chapter 9 · Endocrine System',
    systemId: 'endocrine',
    level: 'Foundational',
    title: { en: 'Neuroendocrine Control & Peripheral Hormone Glands' },
    chapterDescription: {
      en: 'Examine ductless hormone-secreting organs that coordinate metabolism, circadian rhythms, stress responses, and glucose balance alongside clear notes on glands without separate 3D meshes.',
    },
    summary: {
      en: 'Pituitary gland, pineal body, adrenal glands, pancreatic islets, and gonadal hormone production.',
    },
    learningObjectives: [
      'Explain how the pituitary gland links nervous hypothalamic signaling to systemic target glands.',
      'Distinguish the steroid-producing adrenal cortex from the catecholamine-producing adrenal medulla.',
      'Understand dual endocrine/exocrine function in the pancreas and identify non-modeled cervical glands (thyroid/parathyroid).',
    ],
    coverageDisclosure:
      'Partial 3D coverage: Pituitary gland, pineal body, and paired adrenal glands reside in the endocrine mesh layer, while pancreas (Digestive) and testes (Reproductive) are also modeled. Thyroid and parathyroid gland parenchyma meshes are not present in this 3D dataset.',
    topics: [
      {
        id: 'topic-endocrine-central',
        title: { en: 'Pituitary Gland & Pineal Body' },
        level: 'FSc / MDCAT',
        explanation: {
          en: 'Suspended beneath the hypothalamus inside the sella turcica of the skull, the pituitary gland (hypophysis) regulates growth, thyroid/adrenal axes, lactation, and kidney water conservation. Deep at the posterior roof of the third ventricle, the pineal body secretes melatonin in darkness to entrain circadian sleep–wake cycles.',
        },
        relationships: [
          'Pituitary sits inferior to the optic chiasm and brain base inside the bony sphenoid sella turcica.',
          'Pineal body receives indirect light/dark signals transmitted from the retina through the suprachiasmatic nucleus.',
        ],
        keyFacts: [
          'Anterior pituitary synthesizes GH, TSH, ACTH, FSH, LH, and prolactin; posterior pituitary releases hypothalamic ADH and oxytocin.',
          'Melatonin secretion from the pineal body rises at night and falls during daylight exposure.',
        ],
        terminology: [
          { term: 'Hypothalamic–Pituitary Axis', meaning: 'Releasing-hormone pathway linking CNS sensory integration to endocrine cascades.' },
          { term: 'Circadian Rhythm', meaning: 'Endogenous ~24-hour biological cycle synchronized by light and melatonin.' },
        ],
        conceptIds: ['FMA13889', 'FMA62033'],
        preferredView: 'left',
      },
      {
        id: 'topic-endocrine-peripheral',
        title: { en: 'Adrenal Glands, Pancreatic Islets & Gonads' },
        level: 'FSc / MDCAT',
        explanation: {
          en: 'Capping each kidney, the adrenal cortex releases aldosterone, cortisol, and adrenal androgens, while the inner adrenal medulla secretes epinephrine and norepinephrine during acute stress. In the abdomen, pancreatic islets regulate blood sugar via insulin and glucagon, while testes secrete testosterone.',
        },
        relationships: [
          'Right and left adrenal glands sit directly on the superomedial poles of the right and left kidneys.',
          'Pancreas lies retroperitoneally between the duodenum and spleen.',
        ],
        keyFacts: [
          'Insulin (beta cells) lowers blood glucose by promoting cellular uptake; glucagon (alpha cells) raises it via glycogenolysis.',
          'Adrenal medulla behaves like a modified sympathetic ganglion secreting directly into the bloodstream.',
        ],
        terminology: [
          { term: 'Homeostasis', meaning: 'Maintenance of stable internal glucose, ion, pressure, and metabolic ranges via negative feedback.' },
          { term: 'Islets of Langerhans', meaning: 'Endocrine cell clusters scattered within the pancreas (~1–2% of pancreatic mass).' },
        ],
        conceptIds: ['FMA9604', 'FMA7198', 'FMA7210'],
        nonModeledConcepts: [
          {
            name: 'Thyroid & Parathyroid Glands',
            note: 'The thyroid wraps around the anterior upper trachea to secrete T3, T4, and calcitonin (with four posterior parathyroid glands regulating calcium via PTH); thyroid parenchyma meshes are not separately modeled in BodyParts3D 4.0.',
          },
        ],
        preferredView: 'front',
      },
    ],
  },
  {
    id: 'lesson-lymphatic-system',
    chapter: 'Chapter 10 · Lymphatic System',
    systemId: 'lymphatic',
    level: 'FSc / MDCAT',
    title: { en: 'Primary & Secondary Lymphoid Organs' },
    chapterDescription: {
      en: 'Investigate the thymus and spleen—the major lymphoid organs represented in the 3D atlas—and understand how lymphatic vessels and lymph nodes complement systemic circulation.',
    },
    summary: {
      en: 'T-cell maturation in the bilobed thymus and blood-borne immune filtration in the spleen.',
    },
    learningObjectives: [
      'Distinguish primary lymphoid organs (thymus, bone marrow) from secondary lymphoid organs (spleen, lymph nodes).',
      'Locate the thymus in the superior mediastinum and describe its post-pubertal involution.',
      'Describe red-pulp erythrocyte clearance vs. white-pulp immune surveillance inside the spleen.',
    ],
    coverageDisclosure:
      'Partial 3D coverage: Spleen and right/left lobes of the thymus are modeled in 3D. Peripheral lymphatic vessels, thoracic duct, and lymph nodes are not modeled as meshes in BodyParts3D 4.0.',
    topics: [
      {
        id: 'topic-lymphatic-thymus',
        title: { en: 'Thymus & T-Lymphocyte Maturation' },
        level: 'FSc / MDCAT',
        explanation: {
          en: 'The bilobed thymus rests in the superior mediastinum behind the manubrium of the sternum. Bone-marrow-derived precursor cells migrate here to mature into functional T-lymphocytes capable of recognizing foreign antigens while eliminating self-reactive clones.',
        },
        relationships: [
          'Lies immediately posterior to the sternum and anterior to the aortic arch, superior vena cava, and trachea.',
        ],
        keyFacts: [
          'Reaches peak relative size in childhood and progressively undergoes fatty involution after puberty.',
          'Thymosin hormones support T-cell differentiation.',
        ],
        terminology: [
          { term: 'Primary Lymphoid Organ', meaning: 'Site where lymphocytes originate or acquire antigen-specific maturation (bone marrow and thymus).' },
          { term: 'Thymic Involution', meaning: 'Normal age-related replacement of active thymic cortex by adipose tissue.' },
        ],
        conceptIds: ['FMA9607', 'FMA71194', 'FMA71195'],
        preferredView: 'front',
      },
      {
        id: 'topic-lymphatic-spleen',
        title: { en: 'Spleen & Blood-Borne Immune Surveillance' },
        level: 'MBBS / Nursing',
        explanation: {
          en: 'Tucked in the left upper quadrant beneath ribs 9–11, the spleen is the largest secondary lymphoid organ. Unlike lymph nodes that filter tissue lymph, the spleen filters circulating blood directly—clearing aged red blood cells in red pulp while activating lymphocytes against blood-borne pathogens in white pulp.',
        },
        relationships: [
          'Lies lateral to the stomach and left kidney, inferior to the left dome of the diaphragm, and directly against the pancreatic tail.',
        ],
        keyFacts: [
          'Red pulp recycles hemoglobin iron and stores platelets; white pulp forms periarteriolar lymphoid sheaths.',
          'Venous drainage feeds directly into the splenic vein and hepatic portal vein.',
        ],
        terminology: [
          { term: 'Red & White Pulp', meaning: 'Erythrocyte-clearing vascular cords vs. lymphocyte-rich immune nodules inside the spleen.' },
        ],
        conceptIds: ['FMA7196'],
        nonModeledConcepts: [
          {
            name: 'Lymph Nodes, Thoracic Duct & Lymphatic Capillaries',
            note: 'Regional lymph nodes (cervical, axillary, inguinal) and the thoracic duct drain interstitial fluid back to the venous angles; these fine networks are not modeled in this 3D pack.',
          },
        ],
        preferredView: 'left',
      },
    ],
  },
  {
    id: 'lesson-integumentary-system',
    chapter: 'Chapter 11 · Integumentary System',
    systemId: 'integumentary',
    level: 'Foundational',
    title: { en: 'Cutaneous Envelope & External Surface Landmarks' },
    chapterDescription: {
      en: 'Examine the body’s outer protective shell, keratinized hair structures, and mucocutaneous landmarks that shield internal organs and regulate heat and sensation.',
    },
    summary: {
      en: 'Outer skin surface, scalp hair, eyebrows, lips, and protective surface roles.',
    },
    learningObjectives: [
      'List the core physiological functions of skin: physical/microbial barrier, thermoregulation, vitamin D synthesis, and sensation.',
      'Inspect how the outer cutaneous shell relates spatially to the musculoskeletal frame beneath.',
      'Differentiate keratinized epidermal appendages (hair, eyebrows) from mucocutaneous boundaries (lips).',
    ],
    coverageDisclosure:
      'Partial surface reference: The 3D dataset models the outer skin envelope and surface appendages (scalp hair, eyebrows, lip, pubic hair); microscopic skin layers and sweat/sebaceous glands are not modeled in 3D.',
    topics: [
      {
        id: 'topic-integumentary-skin-appendages',
        title: { en: 'Skin Envelope & Surface Appendages' },
        level: 'Foundational',
        explanation: {
          en: 'The skin forms a continuous waterproof and antimicrobial barrier across the body, housing sensory mechanoreceptors and thermoreceptors while synthesizing vitamin D upon UV exposure. Scalp hair insulates the cranium, eyebrows divert sweat from the corneas, and the lips form a sensitive seal at the oral entrance.',
        },
        relationships: [
          'Directly overlies superficial fascia, skeletal muscles, and subcutaneous bony landmarks (such as the anterior tibia and sternum).',
          'Eyebrows trace the supraorbital ridges immediately superior to the eyes and lacrimal glands.',
        ],
        keyFacts: [
          'Skin accounts for ~15% of adult body weight, making it the body’s largest organ.',
          'Dermal vasodilation sheds excess heat while vasoconstriction and shivering conserve core body temperature.',
        ],
        terminology: [
          { term: 'Keratin', meaning: 'Tough water-resistant structural protein filling outer epidermal cells and hair shafts.' },
          { term: 'Thermoregulation', meaning: 'Balancing heat production and cutaneous heat loss via sweat evaporation and dermal blood flow.' },
        ],
        conceptIds: ['FMA7163', 'FMA54241', 'FMA54237', 'FMA59816', 'FMA54319'],
        nonModeledConcepts: [
          {
            name: 'Epidermis, Dermis, Hypodermis & Cutaneous Glands',
            note: 'Stratified keratinocyte layers, dermal papillae, eccrine sweat glands, and sebaceous glands are microscopic histological structures without separate 3D meshes.',
          },
        ],
        preferredView: 'three-quarter',
      },
    ],
  },
  {
    id: 'lesson-sensory-organs',
    chapter: 'Chapter 12 · Sensory Organs',
    systemId: 'sensory',
    level: 'FSc / MDCAT',
    title: { en: 'Ocular Optics, Retina & Lacrimal Apparatus' },
    chapterDescription: {
      en: 'Inspect the 3D structures of the human eye—from light refraction in the cornea and lens to photoreception in the retina and tear drainage—alongside notes on auditory/vestibular organs.',
    },
    summary: {
      en: 'Anterior refractive media, three concentric ocular tunics, optic transduction, and lacrimal tear drainage.',
    },
    learningObjectives: [
      'Trace the optical path of light sequentially through cornea, anterior chamber, pupil/iris, lens, and retina.',
      'Compare the protective sclera, vascular pigmented choroid, and neural retina.',
      'Identify the lacrimal gland and nasolacrimal duct protecting the corneal surface.',
    ],
    coverageDisclosure:
      'Partial 3D coverage: BodyParts3D 4.0 provides 45 detailed ocular and lacrimal meshes. Inner ear auditory/vestibular organs (cochlea, ossicles, tympanic membrane) and olfactory/taste receptors are not modeled in this 3D release.',
    topics: [
      {
        id: 'topic-sensory-anterior-optics',
        title: { en: 'Anterior Optics: Cornea, Iris & Lens' },
        level: 'FSc / MDCAT',
        explanation: {
          en: 'Incoming light first refracts sharply at the transparent avascular cornea, crosses the aqueous-filled anterior chamber, passes through the pupil whose aperture is tuned by the muscular iris, and undergoes fine ciliary-muscle accommodation in the crystalline lens to focus onto the retina.',
        },
        relationships: [
          'Cornea sits anteriorly continuous with the opaque white sclera at the limbus.',
          'Iris partitions the anterior chamber from the posterior chamber immediately in front of the lens.',
        ],
        keyFacts: [
          'Cornea provides roughly two-thirds of the eye’s fixed refractive power; the lens provides variable fine accommodation.',
          'Sphincter pupillae constricts the pupil (parasympathetic); dilator pupillae widens it (sympathetic).',
        ],
        terminology: [
          { term: 'Accommodation', meaning: 'Changing lens curvature to focus near vs. distant objects cleanly onto the retina.' },
          { term: 'Aqueous Humor', meaning: 'Clear fluid maintaining intraocular pressure and nourishing the cornea and lens.' },
        ],
        conceptIds: ['FMA58238', 'FMA58078', 'FMA58235', 'FMA58241'],
        preferredView: 'front',
      },
      {
        id: 'topic-sensory-tunics-lacrimal',
        title: { en: 'Ocular Tunics, Retina & Tear Apparatus' },
        level: 'MBBS / Nursing',
        explanation: {
          en: 'The eyeball wall has three layers: an outer tough sclera, a dark vascular choroid nourishing the eye and absorbing stray light, and an inner sensory retina converting photons into action potentials along the optic nerve. Superolaterally, the lacrimal gland produces protective tears drained into the nose via the nasolacrimal duct.',
        },
        relationships: [
          'Choroid sits directly between the outer sclera and inner retina.',
          'Lacrimal gland lies superolateral to the eyeball; the nasolacrimal duct descends medially toward the inferior nasal meatus.',
        ],
        keyFacts: [
          'Rods mediate dim-light peripheral vision; cones mediate high-acuity color vision centered at the fovea.',
          'Tears contain antibacterial lysozyme and keep the corneal epithelium moist and optically smooth.',
        ],
        terminology: [
          { term: 'Photoreceptors', meaning: 'Specialized retinal rods and cones converting light energy into neural membrane potentials.' },
          { term: 'Lacrimal Apparatus', meaning: 'Tear-producing gland and canalicular-nasolacrimal drainage pathway.' },
        ],
        conceptIds: ['FMA58269', 'FMA58300', 'FMA58599', 'FMA59101', 'FMA9703'],
        nonModeledConcepts: [
          {
            name: 'Auditory & Vestibular Ear Organs (Tympanic Membrane, Ossicles & Cochlea)',
            note: 'Hearing (tympanic membrane, malleus/incus/stapes, cochlea) and balance (semicircular canals, vestibule) reside inside the temporal bone and are not individually modeled in BodyParts3D 4.0.',
          },
        ],
        preferredView: 'front',
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
  {
    id: 'pathway-nervous-axis',
    title: 'Central Nervous & Cranial Projection Axis',
    systemId: 'nervous',
    summary: 'Trace cortical processing down through brainstem and spinal cord alongside cranial optic outflow.',
    steps: [
      { stepNumber: 1, title: 'Brain (Cerebrum)', conceptId: 'FMA50801', note: 'Governs conscious perception, executive cognition, and voluntary motor planning.' },
      { stepNumber: 2, title: 'Cerebellum', conceptId: 'FMA67944', note: 'Compares motor commands with proprioceptive feedback for fine coordination.' },
      { stepNumber: 3, title: 'Brainstem', conceptId: 'FMA79876', note: 'Midbrain, pons, and medulla sustain vital autonomic cardiorespiratory drives.' },
      { stepNumber: 4, title: 'Spinal Cord', conceptId: 'FMA7647', note: 'Conveys ascending/descending tracts and executes segmental spinal reflexes.' },
      { stepNumber: 5, title: 'Optic Nerve', conceptId: 'FMA50863', note: 'CNS myelinated visual tract exiting the posterior globe to the optic chiasm.' },
    ],
  },
  {
    id: 'pathway-urinary-filtration',
    title: 'Renal Blood Supply & Urine Drainage',
    systemId: 'urinary',
    summary: 'Follow renal arterial inflow through kidney filtration and peristaltic urine storage.',
    steps: [
      { stepNumber: 1, title: 'Renal Artery', conceptId: 'FMA14751', note: 'Supplies high-pressure aortic blood directly into the kidney hilum for filtration.' },
      { stepNumber: 2, title: 'Kidney', conceptId: 'FMA7203', note: 'Filters ~180 L/day of plasma ultrafiltrate and concentrates nitrogenous waste.' },
      { stepNumber: 3, title: 'Renal Vein', conceptId: 'FMA14334', note: 'Returns cleaned, electrolyte-balanced blood to the inferior vena cava.' },
      { stepNumber: 4, title: 'Ureter', conceptId: 'FMA9704', note: 'Peristaltic smooth-muscle conduit carrying urine retroperitoneally.' },
      { stepNumber: 5, title: 'Urinary Bladder', conceptId: 'FMA15900', note: 'Distensible detrusor reservoir storing urine prior to micturition.' },
    ],
  },
  {
    id: 'pathway-endocrine-axis',
    title: 'Neuroendocrine & Metabolic Signaling Axis',
    systemId: 'endocrine',
    summary: 'Connect central intracranial regulators with peripheral metabolic and steroid glands.',
    steps: [
      { stepNumber: 1, title: 'Pituitary Gland', conceptId: 'FMA13889', note: 'Master hypophyseal gland seated in the sella turcica below the hypothalamus.' },
      { stepNumber: 2, title: 'Pineal Body', conceptId: 'FMA62033', note: 'Epithalamic transducer secreting nocturnal melatonin for circadian alignment.' },
      { stepNumber: 3, title: 'Adrenal Gland', conceptId: 'FMA9604', note: 'Suprarenal cortex (cortisol/aldosterone) and medulla (catecholamines).' },
      { stepNumber: 4, title: 'Pancreas', conceptId: 'FMA7198', note: 'Endocrine islets regulating systemic glucose via insulin and glucagon.' },
      { stepNumber: 5, title: 'Testis', conceptId: 'FMA7210', note: 'Gonadal Leydig steroidogenesis responding to anterior pituitary LH/FSH.' },
    ],
  },
  {
    id: 'pathway-upper-limb-chain',
    title: 'Upper-Limb Musculoskeletal Lever Chain',
    systemId: 'muscular',
    summary: 'Inspect bone-to-muscle mechanical force transfer from scapula through humerus and forearm.',
    steps: [
      { stepNumber: 1, title: 'Scapula', conceptId: 'FMA13394', note: 'Dynamic posterior shoulder blade providing glenoid socket and muscle attachments.' },
      { stepNumber: 2, title: 'Deltoid', conceptId: 'FMA34676', note: 'Multipennate shoulder cap abducting the arm past the first 15 degrees.' },
      { stepNumber: 3, title: 'Long Head of Biceps Brachii', conceptId: 'FMA37682', note: 'Anterior compartment flexor and forearm supinator pulling across the elbow.' },
      { stepNumber: 4, title: 'Long Head of Triceps Brachii', conceptId: 'FMA37692', note: 'Posterior antagonist straightening the elbow joint.' },
      { stepNumber: 5, title: 'Radius', conceptId: 'FMA23463', note: 'Lateral rotating forearm bone transmitting biceps supination torque.' },
    ],
  },
];

export const TERMINOLOGY_ENTRIES: TerminologyEntry[] = [
  // Planes (5)
  { term: 'Anatomical Position', category: 'Plane', definition: 'Standard reference posture: standing upright, facing forward, arms at sides with palms facing anteriorly (forward), and feet flat.', example: 'In this position, the radius is always lateral to the ulna.' },
  { term: 'Sagittal Plane', category: 'Plane', definition: 'Vertical plane dividing the body into left and right portions (median/midsagittal divides into equal halves).', example: 'Viewing the body in Left or Right profile aligns with a sagittal view.' },
  { term: 'Coronal (Frontal) Plane', category: 'Plane', definition: 'Vertical plane dividing the body into anterior (front) and posterior (back) sections.', example: 'Front and Back camera presets look perpendicular to the coronal plane.' },
  { term: 'Transverse (Axial) Plane', category: 'Plane', definition: 'Horizontal plane dividing the body into superior (upper) and inferior (lower) parts.', example: 'The diaphragm lies near a transverse boundary between thorax and abdomen.' },
  { term: 'Oblique Plane', category: 'Plane', definition: 'Any planar section angled between sagittal, coronal, and transverse axes to track curved organs or vessels.', example: 'Echocardiographic long-axis views slice the heart along an oblique plane.' },

  // Directional (9)
  { term: 'Anterior / Posterior', category: 'Directional', definition: 'Toward the front (ventral) vs. toward the back (dorsal) of the body.', example: 'The sternum is anterior to the heart; the esophagus is posterior to the trachea.' },
  { term: 'Superior / Inferior', category: 'Directional', definition: 'Closer to the head (cranial) vs. closer to the feet (caudal).', example: 'The lungs are superior to the diaphragm; the urinary bladder is inferior to the kidneys.' },
  { term: 'Medial / Lateral', category: 'Directional', definition: 'Closer to the midline of the body vs. farther from the midline.', example: 'The ulna is medial in the forearm; the fibula is lateral in the lower leg.' },
  { term: 'Proximal / Distal', category: 'Directional', definition: 'Closer to the trunk/point of attachment vs. farther away along a limb or tubular structure.', example: 'The humerus is proximal to the radius; the duodenum is proximal to the colon.' },
  { term: 'Superficial / Deep', category: 'Directional', definition: 'Closer to the outer skin surface vs. farther inside toward visceral cavities or bone.', example: 'Pectoralis major is superficial to pectoralis minor and the ribcage.' },
  { term: 'Ipsilateral / Contralateral', category: 'Directional', definition: 'Situated on the same side of the body midline vs. on the opposite side.', example: 'The liver and appendix are ipsilateral (both predominantly right-sided).' },
  { term: 'Rostral / Caudal', category: 'Directional', definition: 'In neuroanatomy and embryology: toward the anterior nose/forebrain vs. toward the tail/inferior spinal cord.', example: 'The frontal lobe sits rostral to the brainstem along the neuraxis.' },
  { term: 'Visceral / Parietal', category: 'Directional', definition: 'Directly investing the surface of an internal organ vs. lining the outer body-cavity wall.', example: 'Visceral pleura clings to lung tissue while parietal pleura lines the ribs.' },
  { term: 'Afferent / Efferent', category: 'Directional', definition: 'Carrying signal or fluid inward toward a center/organ vs. carrying it outward away.', example: 'Afferent arterioles feed the glomerulus; motor efferent nerves drive skeletal muscle.' },

  // Movement (10 — previously missing!)
  { term: 'Flexion / Extension', category: 'Movement', definition: 'Decreasing vs. increasing the sagittal-plane angle between two articulating bones at a joint.', example: 'Biceps brachii produces elbow flexion; triceps brachii drives elbow extension.' },
  { term: 'Abduction / Adduction', category: 'Movement', definition: 'Moving a limb away from the coronal midline vs. drawing it back toward the midline.', example: 'Deltoid abducts the humerus; pectoralis major adducts the arm.' },
  { term: 'Medial / Lateral Rotation', category: 'Movement', definition: 'Pivoting a bone around its own longitudinal axis toward the midline (internal) vs. away (external).', example: 'Rotator cuff muscles stabilize humeral head rotation inside the glenoid.' },
  { term: 'Pronation / Supination', category: 'Movement', definition: 'Forearm rotation turning the palm posteriorly/downward (radius crosses ulna) vs. anteriorly/upward (bones parallel).', example: 'Biceps brachii is the strongest forearm supinator when the elbow is flexed.' },
  { term: 'Dorsiflexion / Plantarflexion', category: 'Movement', definition: 'Lifting the top (dorsum) of the foot toward the shin vs. pointing toes downward by pressing the ball of the foot.', example: 'Gastrocnemius and soleus contract during push-off plantarflexion.' },
  { term: 'Inversion / Eversion', category: 'Movement', definition: 'Tilting the sole of the foot inward toward the midline vs. outward away from the midline at subtalar joints.', example: 'Excessive forced inversion stresses the lateral ankle ligaments.' },
  { term: 'Circumduction', category: 'Movement', definition: 'Conical circular sweep combining sequential flexion, abduction, extension, and adduction at a ball-and-socket joint.', example: 'Drawing a large circle in the air with an outstretched arm.' },
  { term: 'Protraction / Retraction', category: 'Movement', definition: 'Gliding a structure anteriorly vs. posteriorly along a horizontal plane.', example: 'Serratus anterior protracts the scapula during pushing; rhomboids and trapezius retract it.' },
  { term: 'Elevation / Depression', category: 'Movement', definition: 'Lifting a structure superiorly vs. lowering it inferiorly.', example: 'Upper trapezius elevates the scapula when shrugging the shoulders.' },
  { term: 'Opposition / Reposition', category: 'Movement', definition: 'Bringing the thumb pad across the palm to meet another fingertip vs. returning it to anatomical rest.', example: 'Precision grip relies on carpometacarpal opposition of the pollex.' },

  // Classical & Scientific Roots (8)
  { term: 'Hepato- / Reno- / Cardio- / Pulmo-', category: 'Root', definition: 'Classical Greek/Latin roots referring to Liver, Kidney, Heart, and Lung respectively.', example: 'Hepatic portal vein (liver), Renal hilum (kidney), Myocardium (heart), Pulmonary circuit (lungs).' },
  { term: 'Osteo- / Chondro- / Myo- / Arthro-', category: 'Root', definition: 'Musculoskeletal tissue roots denoting Bone, Cartilage, Muscle, and Joint.', example: 'Osteon (compact bone unit), Costal chondritis, Myofibril, Diarthrosis.' },
  { term: 'Encephalo- / Myelo- / Neuro-', category: 'Root', definition: 'Neural and marrow roots referring to Brain, Spinal Cord/Marrow, and Nerve.', example: 'Diencephalon, Poliomyelitis (spinal cord grey horn), Optic neuropathy.' },
  { term: 'Angio- / Vaso- / Phlebo- / Hemo-', category: 'Root', definition: 'Vascular roots denoting Blood Vessel, Duct/Vessel, Vein, and Blood.', example: 'Coronary angiography, Vasoconstriction, Phlebitis, Haemostasis.' },
  { term: 'Gastro- / Entero- / Colo- / Chole-', category: 'Root', definition: 'Digestive roots for Stomach, Small Intestine, Large Intestine, and Bile/Gallbladder.', example: 'Gastroesophageal, Enterocyte, Colectomy, Cholecystitis.' },
  { term: 'Nephro- / Uro- / Cysto-', category: 'Root', definition: 'Renal/urinary roots denoting Functional Kidney Unit, Urine/Urinary Tract, and Sac/Bladder.', example: 'Nephron, Ureteric peristalsis, Cystoscopy.' },
  { term: 'Hyper- / Hypo- / Iso- / Endo- / Exo-', category: 'Root', definition: 'Quantitative/directional Greek prefixes: Above/Excessive, Below/Deficient, Equal, Within, and Outward.', example: 'Hypercapnia, Hypoxemia, Isovolumetric contraction, Endocrine vs. Exocrine secretion.' },
  { term: '-ectomy / -otomy / -ostomy / -pathy', category: 'Root', definition: 'Surgical and pathological suffixes: Surgical Removal, Incision into, Creating an Opening, and Disease Process.', example: 'Appendectomy, Tracheotomy, Colostomy, Cardiomyopathy.' },
];

