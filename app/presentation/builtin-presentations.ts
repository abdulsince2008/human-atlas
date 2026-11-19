import { SURGICAL_EDUCATION_DISCLAIMER } from '../data/surgical-anatomy';
import {
  PRESENTATION_SCHEMA_VERSION,
  type AnatomyPresentation,
} from './presentation-types';

/**
 * Three Complete Built-In Guided 3D Presentations
 *
 * Every FMA concept ID in these presentations is verified against
 * public/models/atlas.json (BodyParts3D 4.0) and tested by app/presentation.test.ts.
 *
 * Categories covered:
 *   1. anatomical          — Cranial Anatomy & Progressive Dissection
 *   2. pathophysiology     — Thoracic Cardiorespiratory Relations & Coronary Ischemia
 *   3. surgical_education  — Shoulder, Humeral Compartments & Upper-Limb Vascular Relations
 */

export const BUILTIN_PRESENTATIONS: AnatomyPresentation[] = [
  // =========================================================================
  // PRESENTATION A: ANATOMICAL / PROGRESSIVE DISSECTION
  // =========================================================================
  {
    schemaVersion: PRESENTATION_SCHEMA_VERSION,
    id: 'builtin-cranial-dissection',
    title: 'Cranial Anatomy & Progressive Dissection',
    subtitle: 'From Calvarial Vault to Intracranial Vessels, Tentorium & Deep Brain',
    category: 'anatomical',
    region: 'Head & Cranial Cavity',
    summary:
      'A 5-stage progressive 3D dissection of the human cranium using real BodyParts3D 4.0 meshes: inspect calvarial bones, peel the cranial vault, trace internal carotid and tentorial landmarks, and explore cerebral hemispheres, brainstem, cerebellum, and deep midline structures.',
    learningObjectives: [
      'Identify the frontal, parietal, temporal, and occipital bones forming the protective cranial vault.',
      'Understand the relationship between the tentorium cerebelli, intracranial arterial supply, and cerebral hemispheres.',
      'Locate deep midline neuroanatomy including the corpus callosum, thalamus, pituitary gland, pons, and cerebellum.',
    ],
    scientificDisclosure:
      'Anatomical Reference Mode: Uses healthy BodyParts3D 4.0 meshes (CC BY-SA 2.1 JP). Epicranial scalp musculature (galea aponeurotica, temporalis) and arachnoid/pia mater membranes are conceptual educational references and are not individually meshed in this dataset.',
    reviewStatus: 'draft',
    sources: [
      {
        title: 'BodyParts3D 4.0 Cranial & Neuroanatomical Meshes',
        source: 'DBCLS (Database Center for Life Science)',
        license: 'CC BY-SA 2.1 JP',
      },
      {
        title: 'Anatomy and Physiology 2e — The Skull & Central Nervous System',
        source: 'OpenStax (Rice University)',
        url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/13-2-the-central-nervous-system',
        license: 'CC BY 4.0',
      },
    ],
    isBuiltIn: true,
    updatedAt: '2026-11-19T00:00:00.000Z',
    steps: [
      {
        id: 'cran-step-1',
        title: '1. Intact Cranial Vault & Osteology',
        subtitle: 'Protective calvarial shell',
        explanation:
          'The neurocranium encloses and protects the brain via interlocking flat bones—principally the frontal, paired parietal, temporal, and occipital bones—joined along fibrous sutures.',
        durationSec: 8,
        camera: {
          view: 'three-quarter',
          focusBounds: { min: [-0.11, 1.50, -0.13], max: [0.11, 1.77, 0.13] },
          viewDirection: [0.55, 0.14, 1.0],
          autoRotate: false,
        },
        scene: {
          visibleSystems: ['skeletal', 'nervous', 'arterial', 'venous', 'connective'],
          selectedConceptIds: ['FMA52734', 'FMA9613', 'FMA52737', 'FMA52735'],
          surgicalRegionId: 'cranial-vault-neuro',
          peeledLayerCount: 0,
          ghostSurroundings: false,
          explode: 0,
        },
        annotations: [
          {
            id: 'cran-ann-1',
            label: 'Frontal & Parietal Bones',
            detail: 'Form the anterior forehead and superior-lateral roof of the cranial vault.',
            anchorConceptId: 'FMA52734',
            tone: 'landmark',
          },
          {
            id: 'cran-ann-2',
            label: 'Temporal & Occipital Bones',
            detail: 'Form the lateral temple (pterion region) and posterior cranial fossa.',
            anchorConceptId: 'FMA52737',
            tone: 'landmark',
          },
        ],
      },
      {
        id: 'cran-step-2',
        title: '2. Cranial Vault Removed — Intracranial Exposure',
        subtitle: 'Progressive bone peeling reveals the cranial cavity',
        explanation:
          'Peeling away the superficial calvarial bone layer exposes the intracranial neurovascular compartment without disturbing the underlying cerebral hemispheres or tentorial partition.',
        durationSec: 9,
        camera: {
          view: 'three-quarter',
          focusBounds: { min: [-0.10, 1.52, -0.12], max: [0.10, 1.76, 0.12] },
          viewDirection: [0.65, 0.22, 0.9],
          autoRotate: false,
        },
        scene: {
          visibleSystems: ['skeletal', 'nervous', 'arterial', 'venous', 'connective'],
          selectedConceptIds: ['FMA50801'],
          surgicalRegionId: 'cranial-vault-neuro',
          peeledLayerCount: 2,
          ghostSurroundings: false,
          explode: 0,
        },
        annotations: [
          {
            id: 'cran-ann-3',
            label: 'Exposed Brain & Cortical Surface',
            detail: 'Frontal, parietal, temporal, and occipital gyri sit directly deep to the calvaria and meninges.',
            anchorConceptId: 'FMA50801',
            tone: 'nerve',
          },
        ],
        disclosureNote:
          'Note: Scalp galea aponeurotica and arachnoid/pia mater sheets are conceptual layers not individually meshed in BodyParts3D 4.0.',
      },
      {
        id: 'cran-step-3',
        title: '3. Intracranial Arterial Supply & Tentorium Cerebelli',
        subtitle: 'Internal carotid circulation and dural compartmentalization',
        explanation:
          'The internal carotid arteries ascend into the cranial base to supply the anterior and middle cerebral territories, while the tentorium cerebelli separates the occipital lobes from the posterior fossa cerebellum.',
        durationSec: 9,
        camera: {
          view: 'front',
          focusBounds: { min: [-0.09, 1.53, -0.11], max: [0.09, 1.74, 0.11] },
          viewDirection: [0.35, 0.12, 1.0],
          autoRotate: false,
        },
        scene: {
          visibleSystems: ['nervous', 'arterial', 'venous', 'connective'],
          selectedConceptIds: ['FMA3947', 'FMA83966'],
          surgicalRegionId: 'cranial-vault-neuro',
          peeledLayerCount: 2,
          ghostSurroundings: true,
          explode: 0,
        },
        annotations: [
          {
            id: 'cran-ann-4',
            label: 'Internal Carotid Artery',
            detail: 'Primary anterior cerebral arterial inflow entering via the carotid canal.',
            anchorConceptId: 'FMA3947',
            tone: 'vessel',
          },
          {
            id: 'cran-ann-5',
            label: 'Tentorium Cerebelli',
            detail: 'Dural fold roofing the posterior cranial fossa above the cerebellum.',
            anchorConceptId: 'FMA83966',
            tone: 'landmark',
          },
        ],
      },
      {
        id: 'cran-step-4',
        title: '4. Deep Midline Neuroanatomy — Midsagittal Cutaway',
        subtitle: 'Corpus callosum, thalamus, pituitary & brainstem',
        explanation:
          'Applying a sagittal cutaway plane reveals interhemispheric white-matter commissures (corpus callosum), the diencephalic relay hub (thalamus), the sellar pituitary gland, and the pons.',
        durationSec: 10,
        camera: {
          view: 'left',
          focusBounds: { min: [-0.09, 1.53, -0.11], max: [0.09, 1.74, 0.11] },
          viewDirection: [-1.0, 0.08, 0.25],
          autoRotate: false,
        },
        scene: {
          visibleSystems: ['nervous', 'endocrine', 'arterial'],
          selectedConceptIds: ['FMA86464', 'FMA62007', 'FMA13889', 'FMA67943'],
          surgicalRegionId: 'cranial-vault-neuro',
          peeledLayerCount: 2,
          ghostSurroundings: true,
          clipping: { enabled: true, axis: 'x', offset: 0.5, inverted: false },
          explode: 0,
        },
        annotations: [
          {
            id: 'cran-ann-6',
            label: 'Corpus Callosum & Thalamus',
            detail: 'Major interhemispheric commissure arching over the deep sensory-motor thalamic nuclei.',
            anchorConceptId: 'FMA86464',
            tone: 'nerve',
          },
          {
            id: 'cran-ann-7',
            label: 'Pituitary Gland & Pons',
            detail: 'Hypophysis seated in the sella turcica anterior to the brainstem pons.',
            anchorConceptId: 'FMA13889',
            tone: 'clinical',
          },
        ],
      },
      {
        id: 'cran-step-5',
        title: '5. Posterior Fossa — Cerebellum & Brainstem Synthesis',
        subtitle: 'Motor coordination and autonomic relay centers',
        explanation:
          'In the posterior fossa beneath the tentorium, the cerebellum coordinates balance and fine motor timing while the pons and brainstem house cranial nerve nuclei and vital cardiorespiratory pathways.',
        durationSec: 9,
        camera: {
          view: 'back',
          focusBounds: { min: [-0.09, 1.52, -0.11], max: [0.09, 1.73, 0.11] },
          viewDirection: [0.35, 0.08, -1.0],
          autoRotate: true,
        },
        scene: {
          visibleSystems: ['nervous', 'arterial'],
          selectedConceptIds: ['FMA67944', 'FMA67943'],
          surgicalRegionId: 'cranial-vault-neuro',
          peeledLayerCount: 2,
          ghostSurroundings: true,
          explode: 0,
        },
        annotations: [
          {
            id: 'cran-ann-8',
            label: 'Cerebellum',
            detail: 'Located inferior to the tentorium cerebelli; integrates proprioceptive and motor feedback.',
            anchorConceptId: 'FMA67944',
            tone: 'nerve',
          },
        ],
        assessmentCheck: {
          question:
            'Which dural partition separates the occipital lobes of the cerebrum from the underlying cerebellum in the posterior cranial fossa?',
          options: [
            'Tentorium cerebelli',
            'Corpus callosum',
            'Internal carotid canal',
            'Parietal suture',
          ],
          correctIndex: 0,
          explanation:
            'The tentorium cerebelli is a transverse dural fold that roofs the posterior cranial fossa, separating the cerebellum from the occipital lobes.',
        },
      },
    ],
  },

  // =========================================================================
  // PRESENTATION B: CARDIORESPIRATORY & PATHOPHYSIOLOGY MECHANISM
  // =========================================================================
  {
    schemaVersion: PRESENTATION_SCHEMA_VERSION,
    id: 'builtin-thorax-coronary-ischemia',
    title: 'Thoracic Anatomy & Coronary Ischemia Mechanism',
    subtitle: 'Cardiorespiratory Relations & Conceptual LAD Occlusion Pathophysiology',
    category: 'pathophysiology',
    region: 'Thorax & Mediastinum',
    summary:
      'Progresses from the intact thoracic cage and lungs to the middle mediastinum, heart, great vessels, and coronary arterial tree—concluding with an educational pathophysiology overlay illustrating how left anterior descending (LAD) arterial occlusion compromises anterior left ventricular perfusion.',
    learningObjectives: [
      'Trace the layered thoracic wall (pectoralis major, sternum, ribs) protecting the lungs and mediastinum.',
      'Identify the heart chambers, ascending aorta, pulmonary trunk, and superior vena cava in situ.',
      'Correlate the left anterior descending (LAD) coronary artery with its anterior left ventricular myocardial territory during ischemia.',
    ],
    scientificDisclosure:
      'Conceptual Pathophysiology Disclosure: BodyParts3D 4.0 provides healthy reference anatomy only. No atherosclerotic plaque, thrombus, or necrotic myocardium 3D geometry is fabricated; color highlights conceptually indicate the affected coronary vessel and downstream myocardial perfusion territory.',
    reviewStatus: 'draft',
    sources: [
      {
        title: 'BodyParts3D 4.0 Thoracic, Cardiac & Coronary Meshes',
        source: 'DBCLS (Database Center for Life Science)',
        license: 'CC BY-SA 2.1 JP',
      },
      {
        title: 'Anatomy and Physiology 2e — Heart Anatomy & Coronary Circulation',
        source: 'OpenStax (Rice University)',
        url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/19-1-heart-anatomy',
        license: 'CC BY 4.0',
      },
      {
        title: 'Anatomy, Thorax, Heart Coronary Arteries',
        source: 'NCBI StatPearls (Open Access)',
        url: 'https://www.ncbi.nlm.nih.gov/books/NBK534790/',
        license: 'CC BY-NC-ND 4.0',
      },
    ],
    isBuiltIn: true,
    updatedAt: '2026-11-19T00:00:00.000Z',
    steps: [
      {
        id: 'thorax-step-1',
        title: '1. Anterior Thoracic Wall & Protective Cage',
        subtitle: 'Sternum, costal arch, and superficial pectoral musculature',
        explanation:
          'The thoracic cage—anchored anteriorly by the sternum and costal cartilages and overlaid by pectoralis major—shields the cardiopulmonary organs while providing mechanical leverage for ventilation.',
        durationSec: 8,
        camera: {
          view: 'front',
          focusBounds: { min: [-0.22, 1.05, -0.15], max: [0.22, 1.46, 0.15] },
          viewDirection: [0.25, 0.08, 1.0],
          autoRotate: false,
        },
        scene: {
          visibleSystems: ['skeletal', 'muscular', 'respiratory', 'cardiac', 'arterial', 'venous'],
          selectedConceptIds: ['FMA7485', 'FMA13373'],
          surgicalRegionId: 'thorax-mediastinum',
          peeledLayerCount: 0,
          ghostSurroundings: false,
          explode: 0,
        },
        annotations: [
          {
            id: 'thorax-ann-1',
            label: 'Sternum',
            detail: 'Midline breastbone (manubrium, body, xiphoid) directly anterior to the heart and great vessels.',
            anchorConceptId: 'FMA7485',
            tone: 'landmark',
          },
          {
            id: 'thorax-ann-2',
            label: 'Pectoralis Major',
            detail: 'Superficial anterior chest wall muscle overlying the upper ribs.',
            anchorConceptId: 'FMA13373',
            tone: 'landmark',
          },
        ],
      },
      {
        id: 'thorax-step-2',
        title: '2. Thoracic Cage Peeled — Cardiorespiratory Relations',
        subtitle: 'Bilateral lungs framing the middle mediastinum',
        explanation:
          'Removing the anterior chest muscles and rib cage exposes the right and left lungs flanking the pericardial mediastinum, with the trachea descending superiorly to bifurcate into main bronchi.',
        durationSec: 9,
        camera: {
          view: 'front',
          focusBounds: { min: [-0.19, 1.08, -0.13], max: [0.19, 1.44, 0.13] },
          viewDirection: [0.22, 0.06, 1.0],
          autoRotate: false,
        },
        scene: {
          visibleSystems: ['respiratory', 'cardiac', 'arterial', 'venous'],
          selectedConceptIds: ['FMA7309', 'FMA7310', 'FMA7394'],
          surgicalRegionId: 'thorax-mediastinum',
          peeledLayerCount: 2,
          ghostSurroundings: false,
          explode: 0,
        },
        annotations: [
          {
            id: 'thorax-ann-3',
            label: 'Right & Left Lungs',
            detail: 'The left lung features the cardiac notch accommodating the apex of the heart.',
            anchorConceptId: 'FMA7310',
            tone: 'landmark',
          },
          {
            id: 'thorax-ann-4',
            label: 'Trachea',
            detail: 'Conducts inspired air posterior to the aortic arch and superior vena cava.',
            anchorConceptId: 'FMA7394',
            tone: 'landmark',
          },
        ],
      },
      {
        id: 'thorax-step-3',
        title: '3. Heart & Great Vessels in the Mediastinum',
        subtitle: 'Ascending aorta, pulmonary trunk, and superior vena cava',
        explanation:
          'Peeling the lungs isolates the four-chambered heart and its great vascular roots: deoxygenated blood enters via the superior vena cava and exits to the lungs via the pulmonary trunk, while oxygenated blood leaves via the ascending aorta and aortic arch.',
        durationSec: 9,
        camera: {
          view: 'three-quarter',
          focusBounds: { min: [-0.12, 1.12, -0.10], max: [0.12, 1.38, 0.10] },
          viewDirection: [0.42, 0.10, 1.0],
          autoRotate: false,
        },
        scene: {
          visibleSystems: ['cardiac', 'arterial', 'venous'],
          selectedConceptIds: ['FMA7088', 'FMA3736', 'FMA3768', 'FMA8612', 'FMA4720'],
          surgicalRegionId: 'thorax-mediastinum',
          peeledLayerCount: 3,
          ghostSurroundings: false,
          explode: 0,
        },
        annotations: [
          {
            id: 'thorax-ann-5',
            label: 'Ascending Aorta & Arch',
            detail: 'Gives off the right and left coronary arteries immediately above the aortic valve sinuses.',
            anchorConceptId: 'FMA3736',
            tone: 'vessel',
          },
          {
            id: 'thorax-ann-6',
            label: 'Pulmonary Trunk & SVC',
            detail: 'Right-sided inflow (SVC) and outflow (pulmonary trunk) coursing anterior to the aortic root.',
            anchorConceptId: 'FMA8612',
            tone: 'vessel',
          },
        ],
      },
      {
        id: 'thorax-step-4',
        title: '4. Coronary Arterial Supply — LAD & Right Coronary',
        subtitle: 'Epicardial vessels nourishing the myocardium',
        explanation:
          'The left main coronary artery divides into the anterior interventricular (LAD) branch—running down the anterior interventricular sulcus—and the circumflex branch, while the right coronary artery courses along the right atrioventricular groove.',
        durationSec: 10,
        camera: {
          view: 'front',
          focusBounds: { min: [-0.09, 1.13, -0.08], max: [0.09, 1.32, 0.08] },
          viewDirection: [0.30, 0.05, 1.0],
          autoRotate: false,
        },
        scene: {
          visibleSystems: ['cardiac', 'arterial'],
          selectedConceptIds: ['FMA3855', 'FMA3862', 'FMA50039'],
          ghostSurroundings: true,
          explode: 0,
        },
        annotations: [
          {
            id: 'thorax-ann-7',
            label: 'Left Main & LAD Artery',
            detail: 'Supplies the anterior interventricular septum, apex, and anterior wall of the left ventricle.',
            anchorConceptId: 'FMA3862',
            tone: 'vessel',
          },
          {
            id: 'thorax-ann-8',
            label: 'Right Coronary Artery',
            detail: 'Supplies the right ventricle and, in right-dominant hearts, the inferior wall and AV node.',
            anchorConceptId: 'FMA50039',
            tone: 'vessel',
          },
        ],
      },
      {
        id: 'thorax-step-5',
        title: '5. Conceptual Pathophysiology: LAD Occlusion & Ischemia',
        subtitle: 'Supply-demand mismatch in the anterior left ventricular territory',
        explanation:
          'When atherosclerotic plaque rupture and thrombosis acutely narrow or occlude the LAD artery (highlighted amber), distal myocardial perfusion falls sharply—placing the high-pressure left ventricle (highlighted crimson) at risk of subendocardial-to-transmural ischemia and reduced ejection fraction.',
        durationSec: 11,
        camera: {
          view: 'three-quarter',
          focusBounds: { min: [-0.09, 1.13, -0.08], max: [0.09, 1.32, 0.08] },
          viewDirection: [0.48, 0.10, 1.0],
          autoRotate: true,
        },
        scene: {
          visibleSystems: ['cardiac', 'arterial'],
          selectedConceptIds: ['FMA3862', 'FMA7101'],
          ghostSurroundings: true,
          explode: 0,
          conceptColorOverrides: {
            FMA3862: '#f59e0b',
            FMA7101: '#dc2626',
            FMA7098: '#64748b',
          },
        },
        annotations: [
          {
            id: 'thorax-ann-9',
            label: 'Occluded Vessel Concept (LAD)',
            detail: 'Amber highlight marks the anterior interventricular branch (healthy reference mesh).',
            anchorConceptId: 'FMA3862',
            tone: 'warning',
          },
          {
            id: 'thorax-ann-10',
            label: 'Downstream Territory (Left Ventricle)',
            detail: 'Crimson highlight indicates the dependent left ventricular myocardium vulnerable to ischemia.',
            anchorConceptId: 'FMA7101',
            tone: 'clinical',
          },
        ],
        disclosureNote:
          'Conceptual Overlay: Uses healthy BodyParts3D 4.0 meshes with educational color coding; no pathological plaque or infarct mesh is fabricated.',
        assessmentCheck: {
          question:
            'Occlusion of the anterior interventricular branch of the left coronary artery (LAD) primarily compromises perfusion to which structure?',
          options: [
            'Anterior wall of the left ventricle and anterior interventricular septum',
            'Posterior cranial fossa and cerebellum',
            'Descending thoracic esophagus',
            'Superior vena cava wall',
          ],
          correctIndex: 0,
          explanation:
            'The LAD supplies the anterior interventricular septum, cardiac apex, and anterior wall of the left ventricle.',
        },
      },
    ],
  },

  // =========================================================================
  // PRESENTATION C: REGIONAL SURGICAL EDUCATION (UPPER LIMB)
  // =========================================================================
  {
    schemaVersion: PRESENTATION_SCHEMA_VERSION,
    id: 'builtin-upper-limb-surgical',
    title: 'Shoulder, Humeral Compartments & Upper-Limb Vascular Relations',
    subtitle: 'Regional Musculoskeletal & Arterial Landmarks for Surgical Education',
    category: 'surgical_education',
    region: 'Shoulder, Arm & Forearm',
    summary:
      'A 5-stage educational regional anatomy walkthrough of the pectoral girdle, rotator cuff, humeral shaft, and continuous subclavian-to-axillary-to-brachial-to-radial/ulnar arterial axis, highlighting surgical landmarks and honest dataset boundaries.',
    learningObjectives: [
      'Orient the clavicle, scapula, and humerus in relation to the rotator cuff and deltoid zone.',
      'Trace the continuous upper-limb arterial tree from subclavian and axillary to brachial, radial, and ulnar arteries.',
      'Recognize key surgical danger zones along the humeral shaft and cubital fossa while understanding peripheral nerve relationships.',
    ],
    scientificDisclosure: `${SURGICAL_EDUCATION_DISCLAIMER} Dataset note: Subclavian, axillary, brachial, radial, and ulnar arteries and shoulder bones/rotator cuff muscles are real BodyParts3D 4.0 meshes; brachial plexus, radial, median, and ulnar peripheral nerves are not individually meshed in this dataset and are taught conceptually.`,
    reviewStatus: 'draft',
    sources: [
      {
        title: 'BodyParts3D 4.0 Upper-Limb Skeletal, Muscular & Vascular Meshes',
        source: 'DBCLS (Database Center for Life Science)',
        license: 'CC BY-SA 2.1 JP',
      },
      {
        title: 'Anatomy and Physiology 2e — Appendicular Skeleton & Upper-Limb Vessels',
        source: 'OpenStax (Rice University)',
        url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/8-1-the-pectoral-girdle',
        license: 'CC BY 4.0',
      },
    ],
    isBuiltIn: true,
    updatedAt: '2026-11-19T00:00:00.000Z',
    steps: [
      {
        id: 'ul-step-1',
        title: '1. Pectoral Girdle & Deltoid Surface Landmarks',
        subtitle: 'Superficial shoulder architecture',
        explanation:
          'Surgical orientation of the upper limb begins with bony palpable landmarks—the clavicle and scapular acromion—framed superficially by the deltoid zone and pectoralis major.',
        durationSec: 8,
        camera: {
          view: 'front',
          focusBounds: { min: [-0.42, 0.85, -0.14], max: [-0.08, 1.50, 0.14] },
          viewDirection: [-0.35, 0.10, 1.0],
          autoRotate: false,
        },
        scene: {
          visibleSystems: ['skeletal', 'muscular', 'arterial', 'venous'],
          selectedConceptIds: ['FMA13321', 'FMA13394', 'FMA34676'],
          surgicalRegionId: 'shoulder-arm-elbow',
          peeledLayerCount: 0,
          ghostSurroundings: false,
          explode: 0,
        },
        annotations: [
          {
            id: 'ul-ann-1',
            label: 'Clavicle & Scapula',
            detail: 'Bony strut and glenoid platform anchoring the glenohumeral joint.',
            anchorConceptId: 'FMA13321',
            tone: 'landmark',
          },
          {
            id: 'ul-ann-2',
            label: 'Deltoid Zone',
            detail: 'Forms the rounded shoulder contour; deep to it runs the axillary neurovascular bundle.',
            anchorConceptId: 'FMA34676',
            tone: 'landmark',
          },
        ],
      },
      {
        id: 'ul-step-2',
        title: '2. Rotator Cuff & Glenohumeral Stabilizers',
        subtitle: 'Deep shoulder muscular sleeve',
        explanation:
          'Deep to the superficial shoulder contour, the supraspinatus, infraspinatus, and subscapularis muscles wrap around the proximal humerus to dynamically center the humeral head in the glenoid fossa.',
        durationSec: 9,
        camera: {
          view: 'three-quarter',
          focusBounds: { min: [-0.38, 1.15, -0.13], max: [-0.10, 1.48, 0.13] },
          viewDirection: [-0.55, 0.14, 0.85],
          autoRotate: false,
        },
        scene: {
          visibleSystems: ['skeletal', 'muscular', 'arterial'],
          selectedConceptIds: ['FMA9629', 'FMA32546', 'FMA13413'],
          ghostSurroundings: true,
          explode: 0,
        },
        annotations: [
          {
            id: 'ul-ann-3',
            label: 'Supraspinatus & Infraspinatus',
            detail: 'Superior and posterior cuff stabilizers inserting on the greater tubercle of the humerus.',
            anchorConceptId: 'FMA9629',
            tone: 'landmark',
          },
          {
            id: 'ul-ann-4',
            label: 'Subscapularis',
            detail: 'Anterior rotator cuff muscle bordering the posterior wall of the axilla.',
            anchorConceptId: 'FMA13413',
            tone: 'landmark',
          },
        ],
      },
      {
        id: 'ul-step-3',
        title: '3. Subclavian-to-Axillary Vascular Transition',
        subtitle: 'Neurovascular gateway beneath the clavicle',
        explanation:
          'As the subclavian artery and vein cross the lateral border of the first rib beneath the clavicle, they continue into the axilla as the axillary artery and vein—passing posterior to pectoralis minor.',
        durationSec: 9,
        camera: {
          view: 'front',
          focusBounds: { min: [-0.36, 1.15, -0.12], max: [-0.04, 1.46, 0.12] },
          viewDirection: [-0.25, 0.08, 1.0],
          autoRotate: false,
        },
        scene: {
          visibleSystems: ['skeletal', 'arterial', 'venous'],
          selectedConceptIds: ['FMA3951', 'FMA4725', 'FMA22654'],
          surgicalRegionId: 'shoulder-arm-elbow',
          peeledLayerCount: 1,
          ghostSurroundings: true,
          explode: 0,
        },
        annotations: [
          {
            id: 'ul-ann-5',
            label: 'Subclavian Artery & Vein',
            detail: 'Major inflow/outflow vessels traversing the costoclavicular space.',
            anchorConceptId: 'FMA3951',
            tone: 'vessel',
          },
          {
            id: 'ul-ann-6',
            label: 'Axillary Artery',
            detail: 'Divided into three anatomical parts relative to pectoralis minor; surrounded by brachial plexus cords (conceptual).',
            anchorConceptId: 'FMA22654',
            tone: 'vessel',
          },
        ],
        disclosureNote:
          'Dataset transparency: Brachial plexus cords and upper-limb peripheral nerves are not individually meshed in BodyParts3D 4.0.',
      },
      {
        id: 'ul-step-4',
        title: '4. Humeral Shaft & Brachial Arterial Course',
        subtitle: 'Medial arm neurovascular bundle and fracture landmarks',
        explanation:
          'Distal to teres major, the axillary artery becomes the brachial artery—descending along the medial aspect of the humerus toward the cubital fossa. Mid-shaft humeral fractures classically endanger the radial nerve in the posterior radial groove (conceptual correlation).',
        durationSec: 10,
        camera: {
          view: 'front',
          focusBounds: { min: [-0.40, 0.90, -0.12], max: [-0.14, 1.38, 0.12] },
          viewDirection: [-0.30, 0.05, 1.0],
          autoRotate: false,
        },
        scene: {
          visibleSystems: ['skeletal', 'arterial', 'venous'],
          selectedConceptIds: ['FMA13303', 'FMA22689'],
          surgicalRegionId: 'shoulder-arm-elbow',
          peeledLayerCount: 1,
          ghostSurroundings: true,
          explode: 0,
        },
        annotations: [
          {
            id: 'ul-ann-7',
            label: 'Humerus',
            detail: 'Posterior mid-shaft radial groove is a critical landmark for radial nerve vulnerability in trauma.',
            anchorConceptId: 'FMA13303',
            tone: 'clinical',
          },
          {
            id: 'ul-ann-8',
            label: 'Brachial Artery',
            detail: 'Palpable medially along the arm; primary site for non-invasive blood pressure auscultation.',
            anchorConceptId: 'FMA22689',
            tone: 'vessel',
          },
        ],
      },
      {
        id: 'ul-step-5',
        title: '5. Cubital Bifurcation — Radial & Ulnar Arteries',
        subtitle: 'Distal forearm perfusion and collateral arches',
        explanation:
          'In the cubital fossa distal to the elbow joint, the brachial artery bifurcates into the radial artery laterally (palpable at the wrist) and the ulnar artery medially, supplying the forearm compartments and palmar arches.',
        durationSec: 10,
        camera: {
          view: 'three-quarter',
          focusBounds: { min: [-0.44, 0.72, -0.12], max: [-0.18, 1.12, 0.12] },
          viewDirection: [-0.45, 0.08, 1.0],
          autoRotate: true,
        },
        scene: {
          visibleSystems: ['skeletal', 'arterial'],
          selectedConceptIds: ['FMA22689', 'FMA22730', 'FMA22796'],
          surgicalRegionId: 'shoulder-arm-elbow',
          peeledLayerCount: 1,
          ghostSurroundings: true,
          explode: 0,
        },
        annotations: [
          {
            id: 'ul-ann-9',
            label: 'Radial Artery',
            detail: 'Descends laterally along the radius; accessible at the wrist for pulse palpation and arterial cannulation.',
            anchorConceptId: 'FMA22730',
            tone: 'vessel',
          },
          {
            id: 'ul-ann-10',
            label: 'Ulnar Artery',
            detail: 'Courses medially to form the primary contributor to the superficial palmar arch.',
            anchorConceptId: 'FMA22796',
            tone: 'vessel',
          },
        ],
        disclosureNote:
          'Educational Reference Only — Not a certified surgical simulator or operative navigation system.',
        assessmentCheck: {
          question:
            'At the lateral border of the first rib, the subclavian artery continues into the upper limb as which vessel?',
          options: [
            'Axillary artery',
            'Radial artery',
            'Internal carotid artery',
            'Coronary sinus',
          ],
          correctIndex: 0,
          explanation:
            'The subclavian artery becomes the axillary artery at the outer border of the first rib, and then the brachial artery at the lower border of teres major.',
        },
      },
    ],
  },
];
