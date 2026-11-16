import type { CanonicalSystemId } from '../anatomy-systems';

export type ClinicalCategory =
  | 'nerve-injury'
  | 'joint-ligament'
  | 'vascular-supply'
  | 'respiratory'
  | 'cardiovascular'
  | 'regional-anatomy';

export interface ClinicalCaseStudy {
  id: string;
  title: string;
  category: ClinicalCategory;
  categoryLabel: string;
  systemId: CanonicalSystemId;
  level: 'Foundational / Pre-Medical' | 'MBBS / Allied Health';
  learningObjectives: string[];
  educationalScenario: string;
  relevantConcepts: { conceptId: string; label: string; role: string }[];
  anatomicalExplanation: string;
  associatedTopicIds: string[];
  checkQuestion: {
    prompt: string;
    options: string[];
    correctIndex: number;
    rationale: string;
  };
  sourceReference: string;
  verificationStatus: 'textbook_principle';
}

export const CLINICAL_CASE_DISCLAIMER =
  'Educational Learning Material Only: These regional anatomy scenarios explain classic structure-function relationships from standard anatomy curricula. They do not constitute patient diagnosis, clinical guidelines, treatment recommendations, or epidemiological claims.';

export const CLINICAL_CASES: ClinicalCaseStudy[] = [
  {
    id: 'case-axillary-nerve-humerus',
    title: 'Proximal Humerus Surgical Neck & Shoulder Abduction',
    category: 'nerve-injury',
    categoryLabel: 'Nerve & Bone Relationships',
    systemId: 'muscular',
    level: 'MBBS / Allied Health',
    learningObjectives: [
      'Locate the surgical neck of the humerus relative to the deltoid muscle.',
      'Explain why disruption at the surgical neck impairs arm abduction beyond 15 degrees.',
    ],
    educationalScenario:
      'In regional upper-limb anatomy study, consider how the axillary nerve (C5–C6) and posterior circumflex humeral artery wrap horizontally immediately around the surgical neck of the humerus deep to the deltoid.',
    relevantConcepts: [
      { conceptId: 'FMA13303', label: 'Humerus', role: 'Surgical neck forms the immediate bony relation' },
      { conceptId: 'FMA34676', label: 'Zone of deltoid', role: 'Primary arm abductor (15°–90°) innervated by axillary nerve' },
      { conceptId: 'FMA13394', label: 'Scapula', role: 'Proximal attachment site for deltoid and glenohumeral socket' },
    ],
    anatomicalExplanation:
      'Because the axillary nerve hugs the posterior surgical neck of the humerus before entering the deep surface of the deltoid, trauma at the surgical neck or inferior glenohumeral dislocation places that nerve at high anatomical proximity. Loss of deltoid motor drive leaves abduction beyond the initial ~15° (initiated by supraspinatus) weakened, alongside altered sensation over the regimental badge area.',
    associatedTopicIds: ['topic-muscular-upper-limb', 'topic-skeletal-upper-limb'],
    checkQuestion: {
      prompt: 'Which movement depends directly on axillary nerve innervation to the deltoid muscle after the first 15 degrees?',
      options: [
        'Wrist extension',
        'Arm abduction at the glenohumeral joint',
        'Forearm pronation',
        'Diaphragmatic inspiration',
      ],
      correctIndex: 1,
      rationale: 'The deltoid, innervated by the axillary nerve (C5–C6), is the primary abductor of the humerus from roughly 15° to 90°.',
    },
    sourceReference: 'Standard Regional Upper-Limb Anatomy (Pectoral & Scapular Relationships)',
    verificationStatus: 'textbook_principle',
  },
  {
    id: 'case-phrenic-diaphragm-ventilation',
    title: 'Cervical Root Origins & Diaphragmatic Inspiration',
    category: 'respiratory',
    categoryLabel: 'Respiratory Relationships',
    systemId: 'respiratory',
    level: 'Foundational / Pre-Medical',
    learningObjectives: [
      'Connect embryonic cervical descent of the diaphragm to its C3–C5 phrenic nerve origin.',
      'Explain how pleural cavities and lungs expand together with diaphragmatic contraction.',
    ],
    educationalScenario:
      'Although the thoracic diaphragm sits at the thoracoabdominal junction separating chest and abdomen, its motor nerve supply originates high in the cervical spinal cord rather than the thoracic intercostal nerves.',
    relevantConcepts: [
      { conceptId: 'FMA13295', label: 'Diaphragm', role: 'Muscular dome driven by paired phrenic nerves (C3–C5)' },
      { conceptId: 'FMA7309', label: 'Right lung', role: 'Expands inferiorly above the right dome of the diaphragm' },
      { conceptId: 'FMA7310', label: 'Left lung', role: 'Expands with left hemidiaphragm descent' },
      { conceptId: 'FMA9915', label: 'Cervical vertebra', role: 'C3–C5 spinal levels where phrenic motor roots emerge' },
    ],
    anatomicalExplanation:
      'During development, cervical myotomes migrate caudally to form the diaphragm while pulling their C3, C4, and C5 somatic motor axons along with them. Descending through the neck and mediastinum anterior to the lung hila, the phrenic nerves trigger downward flattening of the diaphragm domes, creating sub-atmospheric intrathoracic pressure that draws air down the trachea into both lungs.',
    associatedTopicIds: ['topic-respiratory-mechanics', 'topic-muscular-neck-diaphragm'],
    checkQuestion: {
      prompt: 'Which spinal cord root levels supply somatic motor fibers to the thoracic diaphragm via the phrenic nerve?',
      options: ['T1–T4', 'C3–C5', 'L1–L3', 'S2–S4'],
      correctIndex: 1,
      rationale: 'The paired phrenic nerves arise from cervical anterior rami C3, C4, and C5.',
    },
    sourceReference: 'Standard Thoracic & Cervical Neuroanatomy Relationships',
    verificationStatus: 'textbook_principle',
  },
  {
    id: 'case-pituitary-optic-chiasm',
    title: 'Sellar Anatomy: Pituitary Fossa & Optic Pathway Proximity',
    category: 'regional-anatomy',
    categoryLabel: 'Cranial Regional Anatomy',
    systemId: 'nervous',
    level: 'MBBS / Allied Health',
    learningObjectives: [
      'Trace the spatial relationship between the sella turcica, pituitary gland, and optic chiasm.',
      'Understand why visual pathway fibers cross directly above the pituitary gland.',
    ],
    educationalScenario:
      'Inspect the midline cranial base where the endocrine pituitary gland sits inside the hypophyseal fossa of the sphenoid bone, covered superiorly by the diaphragma sellae.',
    relevantConcepts: [
      { conceptId: 'FMA13889', label: 'Pituitary gland', role: 'Resides within the sella turcica inferior to the optic chiasm' },
      { conceptId: 'FMA50863', label: 'Optic nerve', role: 'Nasal retinal fibers decussate directly above the pituitary fossa' },
      { conceptId: 'FMA46565', label: 'Skull', role: 'Sphenoid bone forms the rigid floor and lateral walls of the sella' },
    ],
    anatomicalExplanation:
      'Directly superior to the pituitary gland lies the optic chiasm, where fibers originating from the nasal half of each retina cross to the opposite optic tract. Because the bony sphenoid sella prevents downward growth, upward expansion of any intrasellar mass preferentially compresses these central decussating nasal retinal fibers carrying peripheral temporal visual fields.',
    associatedTopicIds: ['topic-endocrine-central', 'topic-nervous-spinal-cranial'],
    checkQuestion: {
      prompt: 'Which neural structure sits immediately superior to the pituitary gland inside the cranial cavity?',
      options: ['Cerebellar vermis', 'Optic chiasm', 'Medulla oblongata', 'Thoracic spinal cord'],
      correctIndex: 1,
      rationale: 'The optic chiasm crosses directly above the diaphragma sellae and pituitary gland.',
    },
    sourceReference: 'Standard Cranial Base & Neuro-Ophthalmic Anatomy',
    verificationStatus: 'textbook_principle',
  },
  {
    id: 'case-achilles-triceps-surae',
    title: 'Posterior Compartment Leverage & Calcaneal Tendon',
    category: 'joint-ligament',
    categoryLabel: 'Musculoskeletal Mechanics',
    systemId: 'skeletal',
    level: 'Foundational / Pre-Medical',
    learningObjectives: [
      'Identify the two superficial calf muscles converging onto the calcaneal tendon.',
      'Trace force transmission from posterior femoral/tibial origins to the heel bone.',
    ],
    educationalScenario:
      'Push-off during walking or standing on tiptoes relies on the combined triceps surae group transmitting high tensile load through the thickest tendon in the human body.',
    relevantConcepts: [
      { conceptId: 'FMA45950', label: 'Head of gastrocnemius', role: 'Two-joint muscle crossing knee and ankle' },
      { conceptId: 'FMA22542', label: 'Soleus', role: 'Deep postural single-joint plantarflexor' },
      { conceptId: 'FMA258847', label: 'Right calcaneal tendon', role: 'Common tendinous insertion onto posterior calcaneus' },
      { conceptId: 'FMA24476', label: 'Tibia', role: 'Primary weight-bearing bone of the lower leg' },
    ],
    anatomicalExplanation:
      'Both the gastrocnemius (originating from femoral condyles above the knee) and the deeper soleus (originating from posterior tibia and fibula) unite distally into the calcaneal (Achilles) tendon. Because it inserts posteriorly onto the calcaneal tuberosity behind the ankle axis, contraction creates strong plantarflexion torque essential for upright propulsion.',
    associatedTopicIds: ['topic-muscular-lower-limb', 'topic-skeletal-lower-limb'],
    checkQuestion: {
      prompt: 'Which muscle group inserts together into the calcaneal (Achilles) tendon to plantarflex the foot?',
      options: [
        'Quadriceps femoris',
        'Gastrocnemius and soleus',
        'Biceps and triceps brachii',
        'Gluteus medius and maximus',
      ],
      correctIndex: 1,
      rationale: 'Gastrocnemius and soleus (collectively the triceps surae) share the calcaneal tendon insertion onto the calcaneus.',
    },
    sourceReference: 'Standard Lower-Limb Musculoskeletal Anatomy',
    verificationStatus: 'textbook_principle',
  },
  {
    id: 'case-hepatic-portal-circulation',
    title: 'Dual Hepatic Blood Supply & Portal Filtering',
    category: 'vascular-supply',
    categoryLabel: 'Blood Supply & Regional Flow',
    systemId: 'cardiovascular',
    level: 'Foundational / Pre-Medical',
    learningObjectives: [
      'Distinguish nutritive arterial blood from nutrient-rich portal venous blood entering the liver.',
      'Trace abdominal GI venous return through the hepatic portal vein into the inferior vena cava.',
    ],
    educationalScenario:
      'Unlike most organs that receive arterial blood and return venous blood directly to the vena cava, gastrointestinal capillary beds route venous outflow through a second capillary-like sinusoidal bed inside the liver.',
    relevantConcepts: [
      { conceptId: 'FMA50735', label: 'Hepatic portal vein', role: 'Delivers ~75% of hepatic blood from GI tract and spleen' },
      { conceptId: 'FMA7197', label: 'Liver', role: 'Processes absorbed nutrients, drugs, and toxins before systemic entry' },
      { conceptId: 'FMA7196', label: 'Spleen', role: 'Splenic vein joins superior mesenteric vein to form portal vein' },
      { conceptId: 'FMA10951', label: 'Inferior vena cava', role: 'Receives hepatic veins after liver sinusoidal processing' },
    ],
    anatomicalExplanation:
      'The hepatic portal vein is formed posterior to the neck of the pancreas by the confluence of the splenic vein and superior mesenteric vein. Absorbed carbohydrates, amino acids, and orally ingested compounds travel through hepatic sinusoids for metabolic regulation before exiting via short hepatic veins into the inferior vena cava just below the diaphragm.',
    associatedTopicIds: ['topic-digestive-accessory-glands', 'topic-cardio-great-vessels'],
    checkQuestion: {
      prompt: 'Which two major veins unite posterior to the neck of the pancreas to form the hepatic portal vein?',
      options: [
        'Internal jugular and subclavian veins',
        'Renal and femoral veins',
        'Splenic vein and superior mesenteric vein',
        'Superior and inferior venae cavae',
      ],
      correctIndex: 2,
      rationale: 'The hepatic portal vein forms from the union of the splenic vein and superior mesenteric vein.',
    },
    sourceReference: 'Standard Abdominal Vascular & Digestive Anatomy',
    verificationStatus: 'textbook_principle',
  },
];
