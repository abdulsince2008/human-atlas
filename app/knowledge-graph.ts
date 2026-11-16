import type { Atlas, Part, SystemId, View } from './anatomy';
import { CURATED_KNOWLEDGE, lookupStructureKnowledge, type StructureKnowledge } from './anatomy-knowledge';
import { CANONICAL_SYSTEMS, canonicalSystemForMeshSystem, type CanonicalSystemId } from './anatomy-systems';
import { ANATOMY_LESSONS } from './learning-data';
import { QUIZ_QUESTIONS } from './quiz-data';

export const KNOWLEDGE_SCHEMA_VERSION = 2;

export type StructureCategory =
  | 'organ'
  | 'bone'
  | 'muscle'
  | 'nerve'
  | 'artery'
  | 'vein'
  | 'lymphatic'
  | 'gland'
  | 'sensory'
  | 'connective'
  | 'region';

export type ModelCoverageTier =
  | 'individual_mesh'
  | 'mesh_group'
  | 'concept_only'
  | 'planned_unavailable';

export type VerificationStatus = 'verified' | 'draft' | 'unverified';

export type RelationshipType =
  | 'origin'
  | 'insertion'
  | 'attachment'
  | 'articulation'
  | 'innervation'
  | 'arterial_supply'
  | 'venous_drainage'
  | 'lymphatic_drainage'
  | 'adjacent_to'
  | 'part_of'
  | 'has_part'
  | 'supports'
  | 'antagonist';

export interface StructureRelationship {
  id: string;
  sourceConceptId: string;
  targetConceptId?: string;
  targetLabel: string;
  type: RelationshipType;
  directionLabel: string;
  note: string;
  verificationStatus: VerificationStatus;
  sourceReference: string;
}

export interface StructureProvenance {
  sourceReference: string;
  sourceUrl?: string;
  attribution: string;
  license: string;
  verificationStatus: VerificationStatus;
  lastUpdated: string;
}

export interface StructureKnowledgeV2 {
  schemaVersion: 2;
  conceptId: string;
  canonicalName: string;
  commonName: string;
  latinName?: string;
  synonyms: string[];
  category: StructureCategory;
  canonicalSystem: CanonicalSystemId;
  parentConceptId?: string;
  childConceptIds: string[];
  relatedConceptIds: string[];
  location: {
    region: string;
    subdivision?: string;
    position: string;
    orientation?: string;
    nearbyStructures: string[];
    boundaries?: string;
  };
  function: {
    primary: string;
    secondary: string[];
    physiologicalRole: string;
    associatedProcesses: string[];
  };
  structuralRelationships: {
    origin?: string;
    insertion?: string;
    attachments?: string[];
    articulations?: string[];
    innervation?: string;
    arterialSupply?: string;
    venousDrainage?: string;
    lymphaticDrainage?: string;
    anatomicalNotes?: string[];
  };
  education: {
    beginner: string;
    intermediate: string;
    advanced: string;
    importantFacts: string[];
    terminology: { term: string; meaning: string }[];
    learningObjectives: string[];
    associatedTopicIds: string[];
    associatedQuizIds: string[];
    examRelevance?: string;
  };
  visualization: {
    conceptId: string;
    meshIds: string[];
    preferredView: View;
    capabilities: ('highlight' | 'isolate' | 'ghost' | 'explode')[];
    coverageTier: ModelCoverageTier;
    inModel: boolean;
  };
  provenance: StructureProvenance;
}

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  origin: 'Muscle Origin',
  insertion: 'Muscle Insertion',
  attachment: 'Attachment',
  articulation: 'Joint Articulation',
  innervation: 'Innervation',
  arterial_supply: 'Arterial Supply',
  venous_drainage: 'Venous Drainage',
  lymphatic_drainage: 'Lymphatic Drainage',
  adjacent_to: 'Adjacent / Regional Relation',
  part_of: 'Parent / Part Of',
  has_part: 'Component Structure',
  supports: 'Structural Support',
  antagonist: 'Antagonistic Pair',
};

interface CuratedSupplement {
  latinName?: string;
  category?: StructureCategory;
  parentConceptId?: string;
  childConceptIds?: string[];
  region?: string;
  subdivision?: string;
  orientation?: string;
  boundaries?: string;
  nearbyStructures?: string[];
  secondaryFunctions?: string[];
  physiologicalRole?: string;
  associatedProcesses?: string[];
  structuralRelationships?: StructureKnowledgeV2['structuralRelationships'];
  advancedNote?: string;
  preferredView?: View;
}

const SUPPLEMENTS: Record<string, CuratedSupplement> = {
  FMA7088: {
    latinName: 'Cor',
    category: 'organ',
    childConceptIds: ['FMA3802'],
    region: 'Thorax',
    subdivision: 'Middle mediastinum',
    orientation: 'Apex directed anteriorly, inferiorly, and to the left (left 5th intercostal space)',
    boundaries: 'Bounded laterally by the lungs/pleura, inferiorly by central tendon of diaphragm, anteriorly by sternum/costal cartilages.',
    nearbyStructures: ['Right lung', 'Left lung', 'Esophagus (posterior)', 'Diaphragm (inferior)'],
    secondaryFunctions: ['Secretes atrial natriuretic peptide (ANP) in response to atrial stretch', 'Maintains unidirectional pressure gradients via four valves'],
    physiologicalRole: 'Central electromechanical pump coupling pulmonary gas exchange with systemic tissue perfusion.',
    associatedProcesses: ['Cardiac cycle (systole & diastole)', 'SA/AV electrical conduction', 'Frank-Starling stroke volume regulation'],
    structuralRelationships: {
      innervation: 'Autonomic cardiac plexus (sympathetic T1–T4 accelerates rate/contractility; parasympathetic vagus CN X slows SA/AV nodal rate).',
      arterialSupply: 'Left and right coronary arteries arising from the ascending aorta immediately above the aortic valve.',
      venousDrainage: 'Cardiac veins converging into the coronary sinus, draining directly into the right atrium.',
      lymphaticDrainage: 'Subepicardial lymphatic plexus draining into tracheobronchial and mediastinal lymph nodes.',
    },
    advancedNote: 'Coronary perfusion occurs predominantly during ventricular diastole when myocardial wall tension drops and aortic elastic recoil drives flow into the coronary ostia.',
    preferredView: 'front',
  },
  FMA50801: {
    latinName: 'Encephalon',
    category: 'organ',
    childConceptIds: ['FMA67944', 'FMA79876', 'FMA13889', 'FMA62033'],
    region: 'Head',
    subdivision: 'Cranial cavity',
    orientation: 'Rostral-caudal neural axis flexed at the midbrain flexure',
    boundaries: 'Enclosed superiorly and laterally by the cranial vault; rests on the anterior, middle, and posterior cranial fossae.',
    nearbyStructures: ['Skull', 'Pituitary gland', 'Optic nerve', 'Spinal cord'],
    secondaryFunctions: ['Neuroendocrine regulation via hypothalamic-pituitary axis', 'Cerebrospinal fluid production within ventricular choroid plexuses'],
    physiologicalRole: 'Integrates multimodal sensory processing, executive cognition, somatic motor output, and autonomic homeostasis.',
    associatedProcesses: ['Synaptic neurotransmission', 'Cerebral autoregulation', 'Blood-brain barrier selective transport'],
    structuralRelationships: {
      arterialSupply: 'Paired internal carotid arteries (anterior circulation) and vertebral-basilar arteries (posterior circulation) anastomosing at the Circle of Willis.',
      venousDrainage: 'Superficial and deep cerebral veins draining into dural venous sinuses and then the internal jugular veins.',
      anatomicalNotes: ['Continuous inferiorly with the spinal cord at the foramen magnum.'],
    },
    preferredView: 'three-quarter',
  },
  FMA67944: {
    latinName: 'Cerebellum',
    category: 'organ',
    parentConceptId: 'FMA50801',
    region: 'Head',
    subdivision: 'Posterior cranial fossa',
    orientation: 'Dorsal to the pons and medulla oblongata beneath the tentorium cerebelli',
    nearbyStructures: ['Brainstem', 'Occipital lobes', 'Fourth ventricle'],
    secondaryFunctions: ['Error-correction during ongoing motor execution', 'Calibration of vestibulo-ocular reflexes'],
    physiologicalRole: 'Comparator coordinating intended motor commands with proprioceptive feedback.',
    associatedProcesses: ['Motor learning', 'Postural equilibrium', 'Muscle tone modulation'],
    structuralRelationships: {
      arterialSupply: 'Superior cerebellar artery (SCA), anterior inferior cerebellar artery (AICA), and posterior inferior cerebellar artery (PICA).',
      venousDrainage: 'Cerebellar veins draining into adjacent transverse, sigmoid, and straight dural sinuses.',
      anatomicalNotes: ['Connected to the brainstem via superior, middle, and inferior cerebellar peduncles.'],
    },
    preferredView: 'back',
  },
  FMA79876: {
    latinName: 'Truncus encephali',
    category: 'organ',
    parentConceptId: 'FMA50801',
    region: 'Head / Neck junction',
    subdivision: 'Posterior cranial fossa',
    nearbyStructures: ['Cerebellum', 'Spinal cord', 'Pituitary gland'],
    secondaryFunctions: ['Houses reticular activating system controlling consciousness', 'Originates cranial nerves III–XII'],
    physiologicalRole: 'Houses cardiorespiratory centers indispensable for spontaneous breathing and blood pressure control.',
    associatedProcesses: ['Autonomic respiratory rhythmogenesis', 'Baroreceptor reflex integration', 'Cranial nerve relay'],
    structuralRelationships: {
      arterialSupply: 'Vertebral arteries, basilar artery, and penetrating pontine/paramedian branches.',
      venousDrainage: 'Brainstem venous plexuses draining to petrosal and occipital dural sinuses.',
    },
    preferredView: 'back',
  },
  FMA7647: {
    latinName: 'Medulla spinalis',
    category: 'nerve',
    region: 'Axial trunk',
    subdivision: 'Vertebral canal',
    orientation: 'Cylindrical neural cord spanning foramen magnum to L1–L2 conus medullaris',
    boundaries: 'Protected by vertebral bodies, pedicles, laminae, epidural fat, and three meningeal layers.',
    nearbyStructures: ['Cervical vertebrae', 'Thoracic vertebrae', 'Lumbar vertebrae', 'Brainstem'],
    secondaryFunctions: ['Generates rhythmic spinal locomotor pattern activity', 'Mediates monosynaptic and polysynaptic withdrawal reflexes'],
    physiologicalRole: 'Bidirectional sensorimotor trunk conduit and local reflex integration hub.',
    associatedProcesses: ['Spinothalamic pain/temperature relay', 'Dorsal column proprioception', 'Alpha motor neuron output'],
    structuralRelationships: {
      arterialSupply: 'Single anterior spinal artery and paired posterior spinal arteries reinforced by segmental radicular arteries (e.g., artery of Adamkiewicz).',
      venousDrainage: 'Internal and external vertebral venous plexuses.',
    },
    preferredView: 'back',
  },
  FMA7309: {
    latinName: 'Pulmo dexter',
    category: 'organ',
    region: 'Thorax',
    subdivision: 'Right pleural cavity',
    nearbyStructures: ['Left lung', 'Heart', 'Right main bronchus', 'Diaphragm', 'Liver (inferior)'],
    secondaryFunctions: ['Converts angiotensin I to angiotensin II via pulmonary capillary endothelial ACE', 'Filters small venous microthrombi'],
    physiologicalRole: 'Three-lobed alveolar-capillary gas exchanger.',
    associatedProcesses: ['External respiration (O2/CO2 diffusion)', 'Ventilation-perfusion matching', 'Surfactant-mediated alveolar stability'],
    structuralRelationships: {
      innervation: 'Pulmonary plexus (parasympathetic vagal bronchoconstriction; sympathetic bronchodilation).',
      arterialSupply: 'Pulmonary arteries (deoxygenated venous blood for gas exchange) plus bronchial arteries (oxygenated systemic blood for airway tissue).',
      venousDrainage: 'Right superior and inferior pulmonary veins returning oxygenated blood to the left atrium.',
      lymphaticDrainage: 'Intrapulmonary -> bronchopulmonary (hilar) -> tracheobronchial nodes.',
    },
    preferredView: 'front',
  },
  FMA7310: {
    latinName: 'Pulmo sinister',
    category: 'organ',
    region: 'Thorax',
    subdivision: 'Left pleural cavity',
    nearbyStructures: ['Heart', 'Right lung', 'Left main bronchus', 'Diaphragm', 'Spleen (inferior)'],
    secondaryFunctions: ['Features cardiac notch and lingula accommodating the left ventricle'],
    physiologicalRole: 'Two-lobed alveolar-capillary gas exchanger.',
    associatedProcesses: ['External respiration', 'Elastic recoil during passive expiration'],
    structuralRelationships: {
      innervation: 'Pulmonary autonomic plexus (vagus CN X and T1–T4 sympathetic fibers).',
      arterialSupply: 'Left pulmonary artery (gas exchange) and left bronchial arteries (nutritive).',
      venousDrainage: 'Left superior and inferior pulmonary veins emptying into the left atrium.',
      lymphaticDrainage: 'Bronchopulmonary (hilar) and superior tracheobronchial lymph nodes.',
    },
    preferredView: 'front',
  },
  FMA7394: {
    latinName: 'Trachea',
    category: 'organ',
    childConceptIds: ['FMA7395', 'FMA7396'],
    region: 'Neck & Superior Mediastinum',
    subdivision: 'Anterior to esophagus',
    nearbyStructures: ['Esophagus (posterior)', 'Arch of aorta', 'Right main bronchus', 'Left main bronchus'],
    secondaryFunctions: ['Mucociliary escalator traps and clears inhaled particulates'],
    physiologicalRole: 'Rigid yet flexible cartilaginous airway conduit keeping dead-space resistance low.',
    associatedProcesses: ['Airway conduction', 'Mucociliary clearance', 'Cough reflex'],
    structuralRelationships: {
      innervation: 'Recurrent laryngeal nerves (vagus CN X) and sympathetic trunks.',
      arterialSupply: 'Inferior thyroid arteries and bronchial arteries.',
      venousDrainage: 'Inferior thyroid venous plexus draining into brachiocephalic veins.',
    },
    preferredView: 'front',
  },
  FMA13295: {
    latinName: 'Diaphragma',
    category: 'muscle',
    region: 'Thoracoabdominal junction',
    subdivision: 'Inferior thoracic aperture',
    orientation: 'Double-domed fibromuscular sheet separating thoracic and abdominal cavities',
    nearbyStructures: ['Heart', 'Right lung', 'Left lung', 'Liver', 'Stomach', 'Esophagus', 'Inferior vena cava'],
    secondaryFunctions: ['Aids venous return and lymph flow during inspiration by increasing intra-abdominal pressure', 'Assists Valsalva/expulsive efforts'],
    physiologicalRole: 'Primary inspiratory pump accounting for roughly two-thirds of resting tidal volume.',
    associatedProcesses: ['Negative-pressure ventilation', 'Boyle’s law thoracic volume expansion'],
    structuralRelationships: {
      origin: 'Xiphoid process (sternal part), inner surfaces of lower 6 ribs/costal cartilages (costal part), and L1–L3 vertebral bodies via crura (lumbar part).',
      insertion: 'Converges radially into the strong aponeurotic central tendon of the diaphragm.',
      innervation: 'Paired phrenic nerves (C3, C4, C5 — "C3, 4, 5 keeps the diaphragm alive").',
      arterialSupply: 'Pericardiacophrenic, musculophrenic, superior phrenic, and inferior phrenic arteries.',
      venousDrainage: 'Inferior phrenic veins to IVC and superior/pericardiacophrenic veins.',
    },
    preferredView: 'front',
  },
  FMA7197: {
    latinName: 'Hepar',
    category: 'organ',
    region: 'Abdomen',
    subdivision: 'Right upper quadrant (right hypochondrium / epigastrium)',
    nearbyStructures: ['Diaphragm (superior)', 'Gallbladder (inferior)', 'Stomach (left)', 'Duodenum', 'Inferior vena cava'],
    secondaryFunctions: ['Synthesizes albumin and clotting factors', 'Detoxifies drugs and ammonia (urea cycle)', 'Stores glycogen, iron, and fat-soluble vitamins'],
    physiologicalRole: 'Primary metabolic processing plant receiving nutrient-rich portal venous blood directly from the gut.',
    associatedProcesses: ['Bile salt synthesis', 'Gluconeogenesis & glycogenesis', 'First-pass portal metabolism'],
    structuralRelationships: {
      arterialSupply: 'Dual supply: ~25% oxygenated blood via hepatic artery proper (celiac trunk) and ~75% nutrient-rich venous blood via hepatic portal vein.',
      venousDrainage: 'Right, middle, and left hepatic veins emptying directly into the inferior vena cava.',
      lymphaticDrainage: 'Hepatic and celiac lymph nodes draining into cisterna chyli.',
      innervation: 'Hepatic plexus (celiac sympathetic and vagal parasympathetic fibers; capsule innervated by phrenic/intercostal afferents).',
    },
    preferredView: 'front',
  },
  FMA7148: {
    latinName: 'Gaster (Ventriculus)',
    category: 'organ',
    region: 'Abdomen',
    subdivision: 'Epigastrium and left hypochondrium',
    nearbyStructures: ['Esophagus', 'Duodenum', 'Liver', 'Spleen', 'Pancreas (posterior)'],
    secondaryFunctions: ['Secretes intrinsic factor essential for vitamin B12 absorption', 'Begins protein digestion via pepsinogen/HCl'],
    physiologicalRole: 'Muscular reservoir converting solid meals into acidic semi-liquid chyme.',
    associatedProcesses: ['Gastric acid secretion', 'Mechanical churning', 'Controlled pyloric emptying'],
    structuralRelationships: {
      arterialSupply: 'Branches of the celiac trunk (left/right gastric, left/right gastroepiploic, and short gastric arteries).',
      venousDrainage: 'Gastric and gastroepiploic veins draining into the hepatic portal venous system.',
      innervation: 'Vagus nerve (CN X stimulates motility/acid) and celiac plexus sympathetics (T6–T9).',
    },
    preferredView: 'front',
  },
  FMA7198: {
    latinName: 'Pancreas',
    category: 'gland',
    region: 'Abdomen (retroperitoneal)',
    subdivision: 'Epigastrium & left hypochondrium',
    nearbyStructures: ['Duodenum (head cradled in C-loop)', 'Stomach (anterior)', 'Spleen (tail)', 'Hepatic portal vein'],
    secondaryFunctions: ['Secretes bicarbonate-rich fluid to neutralize acidic duodenal chyme'],
    physiologicalRole: 'Dual-role gland pairing exocrine acinar digestion with endocrine islet glucose regulation.',
    associatedProcesses: ['Exocrine zymogen secretion', 'Insulin & glucagon blood-glucose homeostasis'],
    structuralRelationships: {
      arterialSupply: 'Splenic artery (body/tail) and superior/inferior pancreaticoduodenal arcades (head).',
      venousDrainage: 'Splenic and superior mesenteric veins uniting behind the neck to form the hepatic portal vein.',
      innervation: 'Celiac and superior mesenteric autonomic plexuses.',
    },
    preferredView: 'front',
  },
  FMA7203: {
    latinName: 'Ren',
    category: 'organ',
    region: 'Posterior Abdomen (retroperitoneal)',
    subdivision: 'Paravertebral gutters (T12–L3)',
    nearbyStructures: ['Adrenal gland (superior pole)', 'Ureter', 'Renal artery', 'Renal vein', 'Diaphragm'],
    secondaryFunctions: ['Produces erythropoietin (RBC stimulation)', 'Activates vitamin D (calcitriol)', 'Releases renin for blood pressure regulation'],
    physiologicalRole: 'Filters ~180 L/day of plasma filtrate across ~1 million nephrons per kidney to maintain internal electrolyte and fluid homeostasis.',
    associatedProcesses: ['Glomerular filtration', 'Tubular reabsorption & secretion', 'Countercurrent urine concentration'],
    structuralRelationships: {
      arterialSupply: 'Renal arteries branching directly from the abdominal aorta (~20–25% of resting cardiac output).',
      venousDrainage: 'Renal veins emptying directly into the inferior vena cava.',
      lymphaticDrainage: 'Lateral aortic (para-aortic) lumbar lymph nodes.',
      innervation: 'Renal autonomic plexus (T10–L1 sympathetic vasomotor regulation of afferent arterioles).',
    },
    preferredView: 'back',
  },
  FMA15900: {
    latinName: 'Vesica urinaria',
    category: 'organ',
    region: 'Pelvis',
    subdivision: 'Anterior pelvic cavity posterior to pubic symphysis',
    nearbyStructures: ['Ureter (entering trigone)', 'Urethra (exiting neck)', 'Prostate (inferior in adult male)', 'Rectum (posterior)'],
    secondaryFunctions: ['Transitional epithelium (urothelium) stretches without leaking hypertonic urine'],
    physiologicalRole: 'Distensible smooth-muscle (detrusor) storage chamber enabling voluntary micturition.',
    associatedProcesses: ['Compliance storage phase', 'Parasympathetic detrusor voiding reflex'],
    structuralRelationships: {
      arterialSupply: 'Superior and inferior vesical arteries (branches of internal iliac artery).',
      venousDrainage: 'Vesical venous plexus draining into the internal iliac veins.',
      innervation: 'Pelvic splanchnic parasympathetic nerves (S2–S4 detrusor contraction) and hypogastric sympathetics (T11–L2).',
    },
    preferredView: 'front',
  },
  FMA7196: {
    latinName: 'Splen (Lien)',
    category: 'lymphatic',
    region: 'Abdomen',
    subdivision: 'Left upper quadrant beneath ribs 9–11',
    nearbyStructures: ['Stomach', 'Pancreas (tail)', 'Kidney (left)', 'Diaphragm'],
    secondaryFunctions: ['Acts as reservoir for platelets and monocytes', 'Recycles iron from senescent erythrocytes'],
    physiologicalRole: 'Largest secondary lymphoid organ filtering blood-borne antigens and aged red blood cells.',
    associatedProcesses: ['Erythrocyte culling in red pulp', 'Adaptive B/T-cell activation in white pulp'],
    structuralRelationships: {
      arterialSupply: 'Splenic artery (largest branch of the celiac trunk).',
      venousDrainage: 'Splenic vein joining the superior mesenteric vein to form the hepatic portal vein.',
    },
    preferredView: 'left',
  },
  FMA13303: {
    latinName: 'Humerus',
    category: 'bone',
    region: 'Upper limb',
    subdivision: 'Brachium (arm)',
    nearbyStructures: ['Scapula', 'Radius', 'Ulna', 'Zone of deltoid', 'Long head of biceps brachii', 'Long head of triceps brachii'],
    secondaryFunctions: ['Provides broad surfaces (deltoid tuberosity, epicondyles) for shoulder and forearm muscles'],
    physiologicalRole: 'Sole long bone of the arm transmitting loads between the forearm lever and shoulder girdle.',
    structuralRelationships: {
      articulations: ['Proximally with glenoid cavity of scapula (glenohumeral joint); distally with trochlear notch of ulna and head of radius (elbow joint).'],
      attachments: ['Deltoid at deltoid tuberosity', 'Pectoralis major at lateral lip of intertubercular sulcus', 'Flexor/extensor forearm groups at medial/lateral epicondyles'],
      anatomicalNotes: ['Surgical neck relates closely to axillary nerve; radial groove relates to radial nerve.'],
    },
    preferredView: 'front',
  },
  FMA9611: {
    latinName: 'Femur',
    category: 'bone',
    region: 'Lower limb',
    subdivision: 'Thigh',
    nearbyStructures: ['Pelvis', 'Patella', 'Tibia', 'Gluteus maximus', 'Gluteus medius', 'Zone of quadriceps femoris'],
    secondaryFunctions: ['Adult proximal femoral epiphysis retains hematopoietic red marrow sites'],
    physiologicalRole: 'Longest and strongest weight-bearing tubular bone supporting upright stance and stride.',
    structuralRelationships: {
      articulations: ['Proximally with acetabulum of pelvic bone (hip joint); distally with tibial plateaus and patella (knee joint).'],
      attachments: ['Gluteus medius at greater trochanter', 'Quadriceps vasti along femoral shaft / linea aspera'],
      arterialSupply: 'Profunda femoris perforating branches and medial/lateral circumflex femoral arteries around the femoral neck.',
    },
    preferredView: 'front',
  },
  FMA24476: {
    latinName: 'Tibia',
    category: 'bone',
    region: 'Lower limb',
    subdivision: 'Anterior/medial leg',
    nearbyStructures: ['Femur', 'Fibula', 'Patella', 'Soleus', 'Head of gastrocnemius'],
    physiologicalRole: 'Primary weight-bearing bone of the lower leg transmitting load from femur to talus.',
    structuralRelationships: {
      articulations: ['Superiorly with femoral condyles (knee joint) and fibular head; inferiorly with talus and distal fibula (ankle mortise).'],
      attachments: ['Patellar ligament at tibial tuberosity', 'Soleus along soleal line'],
    },
    preferredView: 'front',
  },
  FMA46565: {
    latinName: 'Cranium',
    category: 'bone',
    childConceptIds: ['FMA52748'],
    region: 'Head',
    subdivision: 'Axial skeleton',
    nearbyStructures: ['Brain', 'Cerebellum', 'Mandible', 'Cervical vertebra', 'Cornea'],
    physiologicalRole: 'Rigid cranial vault and facial scaffold shielding the brain and special sense organs.',
    structuralRelationships: {
      articulations: ['Sutural fibrous joints between cranial plates; condylar synovial joint at atlanto-occipital junction and TMJ with mandible.'],
    },
    preferredView: 'three-quarter',
  },
  FMA52748: {
    latinName: 'Mandibula',
    category: 'bone',
    parentConceptId: 'FMA46565',
    region: 'Head',
    subdivision: 'Viscerocranium (lower jaw)',
    nearbyStructures: ['Skull'],
    physiologicalRole: 'Only mobile skull bone enabling mastication and speech articulation.',
    structuralRelationships: {
      articulations: ['Bilateral temporomandibular joints (TMJ) with mandibular fossae of temporal bones.'],
      attachments: ['Masseter, temporalis, and medial/lateral pterygoid muscles of mastication'],
      innervation: 'Mandibular division of trigeminal nerve (CN V3) supplies teeth and skin via inferior alveolar/mental branches.',
    },
    preferredView: 'three-quarter',
  },
  FMA7485: {
    latinName: 'Sternum',
    category: 'bone',
    region: 'Thorax',
    subdivision: 'Anterior thoracic wall',
    nearbyStructures: ['Clavicle', 'Rib', 'Heart', 'Zone of pectoralis major'],
    physiologicalRole: 'Keystone anterior shield protecting heart and great vessels while anchoring ribs 1–7 and clavicles.',
    structuralRelationships: {
      articulations: ['Sternoclavicular joints with medial clavicles; sternocostal joints with costal cartilages 1–7.'],
      attachments: ['Sternocleidomastoid at manubrium', 'Pectoralis major along anterior sternal border'],
    },
    preferredView: 'front',
  },
  FMA7574: {
    latinName: 'Costa',
    category: 'bone',
    region: 'Thorax',
    subdivision: 'Thoracic cage',
    nearbyStructures: ['Sternum', 'Thoracic vertebra', 'Right lung', 'Left lung', 'Diaphragm'],
    physiologicalRole: 'Curved elastic arches forming a protective cage that expands outward via bucket-handle & pump-handle mechanics during inspiration.',
    structuralRelationships: {
      articulations: ['Posteriorly with thoracic vertebrae (costovertebral & costotransverse joints); anteriorly via costal cartilages to sternum (ribs 1–10).'],
    },
    preferredView: 'front',
  },
  FMA13394: {
    latinName: 'Scapula',
    category: 'bone',
    region: 'Upper limb / Back',
    subdivision: 'Pectoral (shoulder) girdle',
    nearbyStructures: ['Clavicle', 'Humerus', 'Zone of trapezius', 'Zone of deltoid', 'Pectoralis minor'],
    physiologicalRole: 'Floating muscularly stabilized shoulder blade increasing upper limb reach via scapulothoracic rotation.',
    structuralRelationships: {
      articulations: ['Glenoid cavity articulates with humeral head; acromion articulates with lateral clavicle (acromioclavicular joint).'],
      attachments: ['Trapezius on spine/acromion', 'Deltoid on acromion/spine', 'Pectoralis minor on coracoid process', 'Biceps/triceps long heads at supra/infraglenoid tubercles'],
    },
    preferredView: 'back',
  },
  FMA13321: {
    latinName: 'Clavicula',
    category: 'bone',
    region: 'Superior thorax / Shoulder',
    subdivision: 'Pectoral girdle',
    nearbyStructures: ['Sternum', 'Scapula', 'Sternocleidomastoid', 'Zone of deltoid', 'Zone of pectoralis major'],
    physiologicalRole: 'Horizontal strut holding the shoulder laterally away from the ribcage and transmitting upper limb forces to the axial skeleton.',
    structuralRelationships: {
      articulations: ['Medially with manubrium of sternum (SC joint); laterally with acromion of scapula (AC joint).'],
      attachments: ['Sternocleidomastoid', 'Pectoralis major', 'Deltoid', 'Trapezius'],
    },
    preferredView: 'front',
  },
  FMA37683: {
    latinName: 'Caput longum musculi bicipitis bracchii',
    category: 'muscle',
    region: 'Upper limb',
    subdivision: 'Anterior compartment of arm',
    nearbyStructures: ['Short head of biceps brachii', 'Humerus', 'Radius', 'Long head of triceps brachii'],
    physiologicalRole: 'Powerful forearm supinator when elbow is flexed, and synergistic elbow flexor opposing triceps brachii.',
    structuralRelationships: {
      origin: 'Supraglenoid tubercle of the scapula (passes intra-articularly through the shoulder joint and intertubercular groove).',
      insertion: 'Radial tuberosity of the radius and bicipital aponeurosis into deep forearm fascia.',
      innervation: 'Musculocutaneous nerve (C5–C6).',
      arterialSupply: 'Muscular branches of the brachial artery.',
    },
    preferredView: 'front',
  },
  FMA37682: {
    latinName: 'Caput breve musculi bicipitis bracchii',
    category: 'muscle',
    region: 'Upper limb',
    subdivision: 'Anterior compartment of arm',
    nearbyStructures: ['Long head of biceps brachii', 'Scapula', 'Humerus', 'Radius'],
    structuralRelationships: {
      origin: 'Apex of the coracoid process of the scapula.',
      insertion: 'Radial tuberosity of the radius alongside the long head.',
      innervation: 'Musculocutaneous nerve (C5–C6).',
      arterialSupply: 'Brachial artery muscular branches.',
    },
    preferredView: 'front',
  },
  FMA37692: {
    latinName: 'Caput longum musculi tricipitis bracchii',
    category: 'muscle',
    region: 'Upper limb',
    subdivision: 'Posterior compartment of arm',
    nearbyStructures: ['Humerus', 'Ulna', 'Scapula', 'Long head of biceps brachii'],
    physiologicalRole: 'Antagonist to biceps brachii responsible for forceful extension of the elbow joint.',
    structuralRelationships: {
      origin: 'Infraglenoid tubercle of the scapula (long head); posterior humerus (lateral & medial heads).',
      insertion: 'Posterior surface of the olecranon process of the ulna.',
      innervation: 'Radial nerve (C6–C8).',
      arterialSupply: 'Profunda brachii (deep brachial) artery.',
    },
    preferredView: 'back',
  },
  FMA34676: {
    latinName: 'Musculus deltoideus',
    category: 'muscle',
    region: 'Shoulder',
    subdivision: 'Scapulohumeral group',
    nearbyStructures: ['Humerus', 'Scapula', 'Clavicle', 'Zone of pectoralis major'],
    structuralRelationships: {
      origin: 'Lateral third of clavicle, acromion, and spine of the scapula.',
      insertion: 'Deltoid tuberosity on lateral aspect of humeral shaft.',
      innervation: 'Axillary nerve (C5–C6), which wraps around the surgical neck of the humerus immediately deep to the muscle.',
      arterialSupply: 'Posterior circumflex humeral artery and deltoid branch of thoracoacromial artery.',
    },
    preferredView: 'three-quarter',
  },
  FMA22429: {
    latinName: 'Musculus quadriceps femoris',
    category: 'muscle',
    region: 'Lower limb',
    subdivision: 'Anterior compartment of thigh',
    nearbyStructures: ['Femur', 'Patella', 'Tibia'],
    structuralRelationships: {
      origin: 'Anterior inferior iliac spine (rectus femoris) and proximal/anterior femoral shaft (vasti muscles).',
      insertion: 'Base of the patella and via the patellar ligament onto the tibial tuberosity.',
      innervation: 'Femoral nerve (L2–L4).',
      arterialSupply: 'Lateral femoral circumflex artery and femoral/profunda femoris branches.',
    },
    preferredView: 'front',
  },
  FMA45950: {
    latinName: 'Musculus gastrocnemius',
    category: 'muscle',
    region: 'Lower limb',
    subdivision: 'Superficial posterior compartment of leg',
    nearbyStructures: ['Femur', 'Soleus', 'Right calcaneal tendon', 'Tibia'],
    structuralRelationships: {
      origin: 'Medial and lateral condyles of the distal femur.',
      insertion: 'Posterior surface of the calcaneus via the calcaneal (Achilles) tendon.',
      innervation: 'Tibial nerve (S1–S2).',
      arterialSupply: 'Sural branches of the popliteal artery.',
    },
    preferredView: 'back',
  },
  FMA22542: {
    latinName: 'Musculus soleus',
    category: 'muscle',
    region: 'Lower limb',
    subdivision: 'Superficial posterior compartment of leg',
    nearbyStructures: ['Head of gastrocnemius', 'Right calcaneal tendon', 'Tibia', 'Fibula'],
    structuralRelationships: {
      origin: 'Soleal line of posterior tibia, proximal fibula, and tendinous arch.',
      insertion: 'Posterior calcaneus via the calcaneal (Achilles) tendon.',
      innervation: 'Tibial nerve (S1–S2).',
      arterialSupply: 'Posterior tibial, fibular, and sural arteries.',
    },
    preferredView: 'back',
  },
  FMA3768: {
    latinName: 'Arcus aortae',
    category: 'artery',
    region: 'Superior mediastinum',
    nearbyStructures: ['Heart', 'Ascending aorta', 'Descending aorta', 'Trachea', 'Common carotid artery'],
    structuralRelationships: {
      arterialSupply: 'Continuity of ascending aorta; gives off brachiocephalic trunk, left common carotid artery, and left subclavian artery.',
      anatomicalNotes: ['Arches posteriorly over the left main bronchus and left pulmonary artery.'],
    },
    preferredView: 'front',
  },
  FMA13889: {
    latinName: 'Hypophysis',
    category: 'gland',
    parentConceptId: 'FMA50801',
    region: 'Head',
    subdivision: 'Sella turcica (hypophyseal fossa of sphenoid bone)',
    nearbyStructures: ['Brain', 'Optic nerve', 'Pineal body'],
    structuralRelationships: {
      arterialSupply: 'Superior and inferior hypophyseal arteries (branches of internal carotid artery) feeding the hypophyseal portal system.',
      venousDrainage: 'Cavernous and intercavernous dural venous sinuses.',
      anatomicalNotes: ['Lies immediately inferior to the optic chiasm — pituitary enlargement classically compresses decussating optic fibers.'],
    },
    preferredView: 'three-quarter',
  },
  FMA58238: {
    latinName: 'Cornea',
    category: 'sensory',
    region: 'Head (Orbit)',
    subdivision: 'Anterior fibrous tunic of eyeball',
    nearbyStructures: ['Sclera', 'Iris', 'Anterior chamber of eyeball', 'Lens', 'Lacrimal gland'],
    structuralRelationships: {
      innervation: 'Nasociliary sensory branches of ophthalmic nerve (CN V1) mediating the corneal blink reflex.',
      anatomicalNotes: ['Avascular transparent dome nourished anteriorly by tear film and posteriorly by aqueous humor.'],
    },
    preferredView: 'front',
  },
  FMA50863: {
    latinName: 'Nervus opticus (CN II)',
    category: 'nerve',
    region: 'Head (Orbit & Cranial base)',
    nearbyStructures: ['Region of retina', 'Brain', 'Pituitary gland'],
    structuralRelationships: {
      arterialSupply: 'Central retinal artery and ophthalmic artery pial branches.',
      anatomicalNotes: ['Exits the orbit through the optic canal to decussate partially at the optic chiasm above the pituitary fossa.'],
    },
    preferredView: 'three-quarter',
  },
};

interface RelationshipSeed {
  sourceConceptId: string;
  targetConceptId?: string;
  targetLabel: string;
  type: RelationshipType;
  note: string;
  verificationStatus?: VerificationStatus;
}

const CURATED_RELATIONSHIPS: RelationshipSeed[] = [
  // Cardiovascular
  { sourceConceptId: 'FMA7088', targetConceptId: 'FMA3736', targetLabel: 'Ascending aorta', type: 'has_part', note: 'Left ventricle ejects oxygenated blood through the aortic valve directly into the ascending aorta.' },
  { sourceConceptId: 'FMA3736', targetConceptId: 'FMA3768', targetLabel: 'Arch of aorta', type: 'adjacent_to', note: 'Ascending aorta continues superiorly as the aortic arch in the superior mediastinum.' },
  { sourceConceptId: 'FMA3768', targetConceptId: 'FMA3784', targetLabel: 'Descending aorta', type: 'adjacent_to', note: 'Arch of aorta continues past the left subclavian origin as the descending thoracic aorta.' },
  { sourceConceptId: 'FMA3768', targetConceptId: 'FMA3939', targetLabel: 'Common carotid artery', type: 'arterial_supply', note: 'Aortic arch gives rise to the left common carotid directly and right common carotid via brachiocephalic trunk.' },
  { sourceConceptId: 'FMA7088', targetConceptId: 'FMA4720', targetLabel: 'Superior vena cava', type: 'venous_drainage', note: 'Returns deoxygenated venous blood from head, neck, and upper limbs into the right atrium.' },
  { sourceConceptId: 'FMA7088', targetConceptId: 'FMA10951', targetLabel: 'Inferior vena cava', type: 'venous_drainage', note: 'Returns deoxygenated venous blood from abdomen, pelvis, and lower limbs into the right atrium.' },
  { sourceConceptId: 'FMA7088', targetConceptId: 'FMA8612', targetLabel: 'Pulmonary trunk', type: 'adjacent_to', note: 'Right ventricle pumps deoxygenated blood into the pulmonary trunk toward both lungs.' },
  { sourceConceptId: 'FMA7088', targetConceptId: 'FMA8648', targetLabel: 'Trunk of pulmonary vein', type: 'venous_drainage', note: 'Four pulmonary veins deliver oxygenated blood from the lungs back to the left atrium.' },
  { sourceConceptId: 'FMA3736', targetConceptId: 'FMA3802', targetLabel: 'Trunk of right coronary artery', type: 'arterial_supply', note: 'Right coronary artery arises from the right aortic sinus of the ascending aorta to perfuse myocardium.' },
  { sourceConceptId: 'FMA3939', targetConceptId: 'FMA4724', targetLabel: 'Internal jugular vein', type: 'adjacent_to', note: 'Run together within the carotid sheath of the neck alongside the vagus nerve.' },
  // Respiratory & Diaphragm
  { sourceConceptId: 'FMA7394', targetConceptId: 'FMA7395', targetLabel: 'Right main bronchus', type: 'has_part', note: 'Trachea bifurcates at the carina into the wider, more vertical right main bronchus.' },
  { sourceConceptId: 'FMA7394', targetConceptId: 'FMA7396', targetLabel: 'Left main bronchus', type: 'has_part', note: 'Left main bronchus passes inferior to the aortic arch to enter the left lung hilum.' },
  { sourceConceptId: 'FMA7395', targetConceptId: 'FMA7309', targetLabel: 'Right lung', type: 'part_of', note: 'Conducts inspired air into the three lobes of the right lung.' },
  { sourceConceptId: 'FMA7396', targetConceptId: 'FMA7310', targetLabel: 'Left lung', type: 'part_of', note: 'Conducts inspired air into the two lobes of the left lung.' },
  { sourceConceptId: 'FMA13295', targetConceptId: 'FMA7309', targetLabel: 'Right lung', type: 'supports', note: 'Inferior dome contraction lowers intrathoracic pressure to expand the right pleural cavity.' },
  { sourceConceptId: 'FMA13295', targetConceptId: 'FMA7310', targetLabel: 'Left lung', type: 'supports', note: 'Left hemidiaphragm descent drives negative-pressure inspiration into the left lung.' },
  { sourceConceptId: 'FMA13295', targetConceptId: 'FMA7574', targetLabel: 'Rib', type: 'origin', note: 'Costal fibers of the diaphragm originate from the inner surfaces of the lower six ribs.' },
  // Digestive & Hepatic Portal
  { sourceConceptId: 'FMA7131', targetConceptId: 'FMA7148', targetLabel: 'Stomach', type: 'adjacent_to', note: 'Esophagus pierces the diaphragmatic hiatus to join the cardia of the stomach.' },
  { sourceConceptId: 'FMA7148', targetConceptId: 'FMA7206', targetLabel: 'Duodenum', type: 'adjacent_to', note: 'Stomach empties regulated chyme across the pyloric sphincter into the C-shaped duodenum.' },
  { sourceConceptId: 'FMA7197', targetConceptId: 'FMA7202', targetLabel: 'Gallbladder', type: 'adjacent_to', note: 'Gallbladder sits on the visceral inferior surface of the liver to store and concentrate bile.' },
  { sourceConceptId: 'FMA7197', targetConceptId: 'FMA50735', targetLabel: 'Hepatic portal vein', type: 'venous_drainage', note: 'Portal vein delivers nutrient-rich blood from GI tract and spleen to liver sinusoids.' },
  { sourceConceptId: 'FMA7198', targetConceptId: 'FMA7206', targetLabel: 'Duodenum', type: 'adjacent_to', note: 'Pancreatic head nestles inside the duodenal C-loop where digestive enzymes and bicarbonate enter.' },
  { sourceConceptId: 'FMA7196', targetConceptId: 'FMA50735', targetLabel: 'Hepatic portal vein', type: 'venous_drainage', note: 'Splenic vein joins the superior mesenteric vein to form the hepatic portal vein.' },
  // Urinary
  { sourceConceptId: 'FMA14751', targetConceptId: 'FMA7203', targetLabel: 'Kidney', type: 'arterial_supply', note: 'Renal arteries deliver ~20–25% of cardiac output into the kidneys for filtration.' },
  { sourceConceptId: 'FMA7203', targetConceptId: 'FMA14334', targetLabel: 'Renal vein', type: 'venous_drainage', note: 'Filtered renal venous blood drains via renal veins into the inferior vena cava.' },
  { sourceConceptId: 'FMA7203', targetConceptId: 'FMA9704', targetLabel: 'Ureter', type: 'adjacent_to', note: 'Renal pelvis tapers into the muscular ureter to propel urine via peristalsis.' },
  { sourceConceptId: 'FMA9704', targetConceptId: 'FMA15900', targetLabel: 'Urinary bladder', type: 'adjacent_to', note: 'Ureters pierce the posterior wall of the urinary bladder obliquely to prevent reflux.' },
  { sourceConceptId: 'FMA15900', targetConceptId: 'FMA19667', targetLabel: 'Urethra', type: 'adjacent_to', note: 'Internal urethral orifice leads from the bladder neck into the urethra for excretion.' },
  // Musculoskeletal Upper & Lower Limb
  { sourceConceptId: 'FMA37683', targetConceptId: 'FMA13394', targetLabel: 'Scapula', type: 'origin', note: 'Long head of biceps originates from the supraglenoid tubercle of the scapula.' },
  { sourceConceptId: 'FMA37682', targetConceptId: 'FMA13394', targetLabel: 'Scapula', type: 'origin', note: 'Short head of biceps originates from the coracoid process of the scapula.' },
  { sourceConceptId: 'FMA37683', targetConceptId: 'FMA23463', targetLabel: 'Radius', type: 'insertion', note: 'Distal biceps tendon inserts onto the radial tuberosity of the radius to supinate and flex.' },
  { sourceConceptId: 'FMA37692', targetConceptId: 'FMA13394', targetLabel: 'Scapula', type: 'origin', note: 'Long head of triceps originates from the infraglenoid tubercle of the scapula.' },
  { sourceConceptId: 'FMA37692', targetConceptId: 'FMA23466', targetLabel: 'Ulna', type: 'insertion', note: 'Triceps brachii inserts onto the olecranon process of the ulna to extend the elbow.' },
  { sourceConceptId: 'FMA37683', targetConceptId: 'FMA37692', targetLabel: 'Long head of triceps brachii', type: 'antagonist', note: 'Biceps brachii flexes the elbow while triceps brachii acts as its antagonistic extensor.' },
  { sourceConceptId: 'FMA34676', targetConceptId: 'FMA13321', targetLabel: 'Clavicle', type: 'origin', note: 'Anterior deltoid fibers originate from the lateral third of the clavicle.' },
  { sourceConceptId: 'FMA34676', targetConceptId: 'FMA13303', targetLabel: 'Humerus', type: 'insertion', note: 'Deltoid fibers converge onto the deltoid tuberosity of the humerus to abduct the arm.' },
  { sourceConceptId: 'FMA34686', targetConceptId: 'FMA7485', targetLabel: 'Sternum', type: 'origin', note: 'Sternocostal head of pectoralis major originates from the anterior sternum and costal cartilages.' },
  { sourceConceptId: 'FMA34686', targetConceptId: 'FMA13303', targetLabel: 'Humerus', type: 'insertion', note: 'Pectoralis major inserts on the lateral lip of the intertubercular sulcus of the humerus.' },
  { sourceConceptId: 'FMA13303', targetConceptId: 'FMA13394', targetLabel: 'Scapula', type: 'articulation', note: 'Humeral head articulates with the glenoid cavity of the scapula (glenohumeral joint).' },
  { sourceConceptId: 'FMA13303', targetConceptId: 'FMA23466', targetLabel: 'Ulna', type: 'articulation', note: 'Trochlea of humerus articulates with the trochlear notch of the ulna (humeroulnar hinge joint).' },
  { sourceConceptId: 'FMA13321', targetConceptId: 'FMA7485', targetLabel: 'Sternum', type: 'articulation', note: 'Medial clavicle articulates with the manubrium of the sternum (sternoclavicular joint).' },
  { sourceConceptId: 'FMA13321', targetConceptId: 'FMA13394', targetLabel: 'Scapula', type: 'articulation', note: 'Lateral clavicle articulates with the acromion of the scapula (acromioclavicular joint).' },
  { sourceConceptId: 'FMA22429', targetConceptId: 'FMA24485', targetLabel: 'Patella', type: 'insertion', note: 'Quadriceps tendon embeds the patella as a sesamoid fulcrum before inserting on the tibia.' },
  { sourceConceptId: 'FMA22429', targetConceptId: 'FMA24476', targetLabel: 'Tibia', type: 'insertion', note: 'Transmits knee extension torque via the patellar ligament to the tibial tuberosity.' },
  { sourceConceptId: 'FMA9611', targetConceptId: 'FMA9578', targetLabel: 'Pelvis', type: 'articulation', note: 'Femoral head articulates deeply within the acetabulum of the pelvic hip bone.' },
  { sourceConceptId: 'FMA9611', targetConceptId: 'FMA24476', targetLabel: 'Tibia', type: 'articulation', note: 'Femoral condyles articulate with tibial plateaus at the tibiofemoral knee joint.' },
  { sourceConceptId: 'FMA45950', targetConceptId: 'FMA258847', targetLabel: 'Right calcaneal tendon', type: 'insertion', note: 'Gastrocnemius and soleus merge into the calcaneal (Achilles) tendon to plantarflex the foot.' },
  { sourceConceptId: 'FMA22542', targetConceptId: 'FMA258847', targetLabel: 'Right calcaneal tendon', type: 'insertion', note: 'Deep soleus contributes heavy muscular fibers to the calcaneal tendon.' },
  { sourceConceptId: 'FMA22314', targetConceptId: 'FMA9578', targetLabel: 'Pelvis', type: 'origin', note: 'Originates from the posterior ilium, sacrum, and thoracolumbar fascia.' },
  { sourceConceptId: 'FMA22315', targetConceptId: 'FMA9611', targetLabel: 'Femur', type: 'insertion', note: 'Inserts on the lateral greater trochanter of the femur to stabilize the pelvis during single-leg stance.' },
  // Nervous & Sensory
  { sourceConceptId: 'FMA58599', targetConceptId: 'FMA50863', targetLabel: 'Optic nerve', type: 'adjacent_to', note: 'Retinal ganglion cell axons converge at the optic disc to form CN II (optic nerve).' },
  { sourceConceptId: 'FMA50863', targetConceptId: 'FMA50801', targetLabel: 'Brain', type: 'part_of', note: 'Visual fibers pass through the optic chiasm and optic tracts into the thalamus and occipital cortex.' },
  { sourceConceptId: 'FMA50863', targetConceptId: 'FMA13889', targetLabel: 'Pituitary gland', type: 'adjacent_to', note: 'Optic chiasm sits immediately superior to the sella turcica housing the pituitary gland.' },
  { sourceConceptId: 'FMA58238', targetConceptId: 'FMA58269', targetLabel: 'Sclera', type: 'adjacent_to', note: 'Cornea forms the transparent anterior 1/6 of the outer fibrous ocular coat continuous with the sclera.' },
  { sourceConceptId: 'FMA59101', targetConceptId: 'FMA9703', targetLabel: 'Nasolacrimal duct', type: 'adjacent_to', note: 'Tears secreted by the superolateral lacrimal gland drain medially down the nasolacrimal duct.' },
  // Spine & Axial
  { sourceConceptId: 'FMA46565', targetConceptId: 'FMA9915', targetLabel: 'Cervical vertebra', type: 'articulation', note: 'Occipital condyles articulate with C1 (atlas) to permit head flexion and extension.' },
  { sourceConceptId: 'FMA9139', targetConceptId: 'FMA7574', targetLabel: 'Rib', type: 'articulation', note: 'All 12 pairs of ribs articulate posteriorly with the thoracic vertebrae T1–T12.' },
  { sourceConceptId: 'FMA9921', targetConceptId: 'FMA9578', targetLabel: 'Pelvis', type: 'articulation', note: 'L5 articulates inferiorly with the sacrum to transfer upper body weight into the pelvic ring.' },
];

function inferCategoryFromKnowledge(k: StructureKnowledge): StructureCategory {
  const name = k.anatomicalName.toLowerCase();
  if (SUPPLEMENTS[k.conceptId]?.category) return SUPPLEMENTS[k.conceptId].category!;
  if (name.includes('artery') || name.includes('aorta') || name.includes('trunk')) return 'artery';
  if (name.includes('vein') || name.includes('vena cava')) return 'vein';
  if (name.includes('nerve') || name.includes('spinal cord')) return 'nerve';
  if (name.includes('gland') || name.includes('pituitary') || name.includes('pineal') || name.includes('pancreas')) return 'gland';
  if (name.includes('tendon') || name.includes('ligament')) return 'connective';
  if (k.canonicalSystem === 'skeletal') return 'bone';
  if (k.canonicalSystem === 'muscular') return 'muscle';
  if (k.canonicalSystem === 'lymphatic') return 'lymphatic';
  if (k.canonicalSystem === 'sensory') return 'sensory';
  return 'organ';
}

function inferCategoryFromMeshSystem(meshSystem: SystemId): StructureCategory {
  switch (meshSystem) {
    case 'skeletal':
      return 'bone';
    case 'muscular':
      return 'muscle';
    case 'arterial':
      return 'artery';
    case 'venous':
      return 'vein';
    case 'nervous':
      return 'nerve';
    case 'lymphatic':
      return 'lymphatic';
    case 'endocrine':
      return 'gland';
    case 'sensory':
      return 'sensory';
    case 'connective':
      return 'connective';
    default:
      return 'organ';
  }
}

const TOPICS_BY_SYSTEM = new Map<CanonicalSystemId, string[]>();
for (const lesson of ANATOMY_LESSONS) {
  const list = TOPICS_BY_SYSTEM.get(lesson.systemId) ?? [];
  for (const t of lesson.topics) {
    list.push(t.id);
  }
  TOPICS_BY_SYSTEM.set(lesson.systemId, list);
}

const TOPICS_BY_CONCEPT = new Map<string, string[]>();
for (const lesson of ANATOMY_LESSONS) {
  for (const t of lesson.topics) {
    for (const cid of t.conceptIds) {
      const list = TOPICS_BY_CONCEPT.get(cid) ?? [];
      if (!list.includes(t.id)) list.push(t.id);
      TOPICS_BY_CONCEPT.set(cid, list);
    }
  }
}

const QUIZZES_BY_CONCEPT = new Map<string, string[]>();
for (const q of QUIZ_QUESTIONS) {
  const list = QUIZZES_BY_CONCEPT.get(q.relatedConceptId) ?? [];
  list.push(q.id);
  QUIZZES_BY_CONCEPT.set(q.relatedConceptId, list);
}

function toV2Record(k: StructureKnowledge, atlas?: Atlas | null): StructureKnowledgeV2 {
  const sup = SUPPLEMENTS[k.conceptId];
  const category = inferCategoryFromKnowledge(k);
  const concept = atlas?.concepts.find((c) => c.id === k.conceptId);
  const meshIds = concept?.elements ?? [];

  let coverageTier: ModelCoverageTier = 'planned_unavailable';
  if (!k.inModel) {
    coverageTier = 'planned_unavailable';
  } else if (meshIds.length === 1) {
    coverageTier = 'individual_mesh';
  } else if (meshIds.length > 1) {
    coverageTier = 'mesh_group';
  } else if (atlas) {
    coverageTier = 'concept_only';
  } else {
    // Atlas JSON not yet hydrated in static node context
    coverageTier = k.inModel ? 'individual_mesh' : 'planned_unavailable';
  }

  const associatedTopics =
    TOPICS_BY_CONCEPT.get(k.conceptId) ??
    (TOPICS_BY_SYSTEM.get(k.canonicalSystem)?.slice(0, 1) ?? []);
  const associatedQuizzes = QUIZZES_BY_CONCEPT.get(k.conceptId) ?? [];

  // Build beginner / intermediate / advanced without duplicating or inventing muscle/bone fields
  const beginner = `${k.commonName !== k.anatomicalName ? `${k.commonName}: ` : ''}${k.mainFunction.en}`;
  const intermediate = `${k.location.en} ${k.characteristics[0] ?? ''}`.trim();
  const advanced =
    sup?.advancedNote ??
    (k.characteristics.length > 1
      ? k.characteristics.slice(1).join(' ')
      : k.examRelevance
        ? `High-yield focus for ${k.examRelevance}. Study regional relationships in the 3D Explorer.`
        : 'Examine spatial proximity and adjacent neurovascular structures in the 3D Explorer.');

  return {
    schemaVersion: KNOWLEDGE_SCHEMA_VERSION,
    conceptId: k.conceptId,
    canonicalName: k.anatomicalName,
    commonName: k.commonName,
    latinName: sup?.latinName,
    synonyms: k.synonyms,
    category,
    canonicalSystem: k.canonicalSystem,
    parentConceptId: sup?.parentConceptId,
    childConceptIds: sup?.childConceptIds ?? [],
    relatedConceptIds: k.relatedConceptIds,
    location: {
      region: sup?.region ?? CANONICAL_SYSTEMS.find((s) => s.id === k.canonicalSystem)?.name.en ?? 'Human Body',
      subdivision: sup?.subdivision,
      position: k.location.en,
      orientation: sup?.orientation,
      nearbyStructures: sup?.nearbyStructures ?? [],
      boundaries: sup?.boundaries,
    },
    function: {
      primary: k.mainFunction.en,
      secondary: sup?.secondaryFunctions ?? [],
      physiologicalRole: sup?.physiologicalRole ?? k.mainFunction.en,
      associatedProcesses: sup?.associatedProcesses ?? [],
    },
    structuralRelationships: sup?.structuralRelationships ?? {},
    education: {
      beginner,
      intermediate,
      advanced,
      importantFacts: k.characteristics,
      terminology: k.terminology,
      learningObjectives: k.examRelevance ? [`Exam focus: ${k.examRelevance}`] : [],
      associatedTopicIds: associatedTopics,
      associatedQuizIds: associatedQuizzes,
      examRelevance: k.examRelevance,
    },
    visualization: {
      conceptId: k.conceptId,
      meshIds,
      preferredView: sup?.preferredView ?? 'three-quarter',
      capabilities: k.inModel ? ['highlight', 'isolate', 'ghost', 'explode'] : [],
      coverageTier,
      inModel: k.inModel,
    },
    provenance: {
      sourceReference: k.inModel
        ? 'BodyParts3D 4.0 / Foundational Model of Anatomy (FMA)'
        : 'Standard Anatomical Reference (Planned 3D Dataset Expansion)',
      sourceUrl: k.inModel ? 'https://lifesciencedb.jp/bp3d/' : undefined,
      attribution: k.inModel
        ? 'BodyParts3D, © The Database Center for Life Science (CC BY 4.0)'
        : 'Anatomy 360 Curated Curriculum',
      license: 'CC BY 4.0',
      verificationStatus: k.verifiedCurated ? 'verified' : 'draft',
      lastUpdated: '2026-11-15',
    },
  };
}

export const KNOWLEDGE_GRAPH_V2: StructureKnowledgeV2[] = CURATED_KNOWLEDGE.map((k) =>
  toV2Record(k, null),
);

const KNOWLEDGE_V2_BY_ID = new Map(KNOWLEDGE_GRAPH_V2.map((r) => [r.conceptId, r]));

const BUILT_RELATIONSHIPS: StructureRelationship[] = CURATED_RELATIONSHIPS.map((seed, idx) => ({
  id: `rel-${idx + 1}-${seed.sourceConceptId}-${seed.type}`,
  sourceConceptId: seed.sourceConceptId,
  targetConceptId: seed.targetConceptId,
  targetLabel: seed.targetLabel,
  type: seed.type,
  directionLabel: RELATIONSHIP_LABELS[seed.type],
  note: seed.note,
  verificationStatus: seed.verificationStatus ?? 'verified',
  sourceReference: 'BodyParts3D / FMA Anatomical Reference',
}));

export const VERIFIED_RELATIONSHIPS: StructureRelationship[] = BUILT_RELATIONSHIPS;

export function getStructureRecordV2(
  conceptId: string,
  atlas?: Atlas | null,
  fallbackName?: string,
  fallbackMeshSystem?: SystemId,
): StructureKnowledgeV2 {
  const curated = CURATED_KNOWLEDGE.find((k) => k.conceptId === conceptId);
  if (curated) {
    return atlas ? toV2Record(curated, atlas) : (KNOWLEDGE_V2_BY_ID.get(conceptId) ?? toV2Record(curated, null));
  }

  const concept = atlas?.concepts.find((c) => c.id === conceptId);
  const firstPart: Part | undefined = concept ? atlas?.parts.find((p) => p.id === concept.elements[0]) : undefined;
  const resolvedSystem = fallbackMeshSystem ?? firstPart?.system ?? 'skeletal';
  const resolvedName = fallbackName ?? concept?.name ?? conceptId;
  const legacyFallback = lookupStructureKnowledge(conceptId, resolvedName, resolvedSystem);
  const canonical = canonicalSystemForMeshSystem(resolvedSystem);
  const v2 = toV2Record(legacyFallback, atlas);

  return {
    ...v2,
    category: inferCategoryFromMeshSystem(resolvedSystem),
    canonicalSystem: canonical.id,
    provenance: {
      ...v2.provenance,
      verificationStatus: concept ? 'verified' : 'unverified',
      sourceReference: concept
        ? 'BodyParts3D 4.0 Mesh Manifest (System-level educational summary)'
        : 'Unverified identifier',
    },
  };
}

export function getRelationshipsForConcept(
  conceptId: string,
  atlas?: Atlas | null,
): {
  outgoing: StructureRelationship[];
  incoming: StructureRelationship[];
  fallbackRelated: { conceptId: string; name: string }[];
} {
  const outgoing = BUILT_RELATIONSHIPS.filter((r) => r.sourceConceptId === conceptId);
  const incoming = BUILT_RELATIONSHIPS.filter((r) => r.targetConceptId === conceptId);

  const rec = getStructureRecordV2(conceptId, atlas);
  const linkedIds = new Set<string>([
    ...outgoing.map((r) => r.targetConceptId).filter((x): x is string => Boolean(x)),
    ...incoming.map((r) => r.sourceConceptId),
  ]);

  const fallbackRelated = rec.relatedConceptIds
    .filter((id) => !linkedIds.has(id))
    .map((id) => {
      const target = KNOWLEDGE_V2_BY_ID.get(id) ?? atlas?.concepts.find((c) => c.id === id);
      if (!target) return null;
      return {
        conceptId: id,
        name: 'canonicalName' in target ? target.canonicalName : target.name,
      };
    })
    .filter((x): x is { conceptId: string; name: string } => Boolean(x));

  return { outgoing, incoming, fallbackRelated };
}

export function getCoverageBadgeLabel(tier: ModelCoverageTier): string {
  switch (tier) {
    case 'individual_mesh':
      return 'Individual 3D Mesh Available';
    case 'mesh_group':
      return 'Grouped 3D Meshes Available';
    case 'concept_only':
      return 'Concept Indexed (No Separate Mesh)';
    case 'planned_unavailable':
      return 'Educational Entry (3D Asset Unavailable)';
  }
}
