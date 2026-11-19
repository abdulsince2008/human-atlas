import { SURGICAL_EDUCATION_DISCLAIMER } from '../data/surgical-anatomy';
import { AUTHORITATIVE_BP3D_SOURCE } from './presentation-engine';
import {
  PRESENTATION_SCHEMA_VERSION,
  type AnatomyPresentation,
} from './presentation-types';

/**
 * Built-In Clinical Mechanism & Guided 3D Presentations
 *
 * Every FMA concept ID in these presentations is verified against
 * public/models/atlas.json (BodyParts3D 4.0) and tested by app/presentation.test.ts.
 *
 * Included Presentations (5 total):
 *   1. builtin-thorax-coronary-ischemia   (FLAGSHIP 7-stage pathophysiology — linked to case-coronary-lad-septum)
 *   2. builtin-pituitary-optic-chiasm     (5-stage neuro-endocrine mechanism — linked to case-pituitary-optic-chiasm)
 *   3. builtin-hepatic-portal-mechanism   (5-stage vascular mechanism — linked to case-hepatic-portal-circulation)
 *   4. builtin-cranial-dissection         (5-stage anatomical dissection)
 *   5. builtin-upper-limb-surgical        (5-stage regional surgical education)
 */

export const BUILTIN_PRESENTATIONS: AnatomyPresentation[] = [
  // =========================================================================
  // 1. FLAGSHIP 7-STAGE CLINICAL MECHANISM: CORONARY ISCHEMIA (LAD)
  // =========================================================================
  {
    schemaVersion: PRESENTATION_SCHEMA_VERSION,
    id: 'builtin-thorax-coronary-ischemia',
    title: 'Coronary Ischemia Mechanism: LAD Supply & Left Ventricular Territory',
    subtitle: '7-Stage Flagship Clinical Mechanism & Cardiorespiratory 3D Explainer',
    category: 'pathophysiology',
    mechanismDomain: 'cardiovascular_pathophysiology',
    relatedClinicalCaseId: 'case-coronary-lad-septum',
    region: 'Thorax & Middle Mediastinum',
    targetSystems: ['cardiac', 'arterial', 'venous', 'respiratory', 'skeletal'],
    difficultyLevel: 'MBBS / Allied Health',
    summary:
      'A structured 7-stage 3D clinical mechanism walkthrough grounded in real BodyParts3D cardiac and coronary meshes: normal heart and mediastinal relations, left anterior descending (LAD) arterial supply, conceptual luminal narrowing, dependent anterior left ventricular territory, functional oxygen supply-demand imbalance, referred pain neuroanatomy, and an interactive final checkpoint.',
    learningObjectives: [
      'Orient the heart, ascending aorta, pulmonary trunk, and superior vena cava inside the intact thoracic cage.',
      'Trace the left main coronary artery and anterior interventricular (LAD) branch down the anterior interventricular sulcus.',
      'Distinguish healthy reference 3D anatomy from conceptual educational overlays illustrating luminal narrowing and myocardial ischemia.',
      'Connect anterior left ventricular oxygen supply-demand mismatch to impaired contractility and visceral referred pain pathways.',
    ],
    priorKnowledge: [
      'Basic four-chamber cardiac anatomy and systemic vs. pulmonary circulation.',
      'Understanding that left ventricular myocardium is perfused predominantly during ventricular diastole.',
    ],
    mechanismProfile: {
      normalAnatomy:
        'The heart sits obliquely in the middle mediastinum behind the sternum and between the right and left lungs. The left and right coronary arteries arise from the aortic sinuses immediately above the aortic valve.',
      mechanism:
        'Atherosclerotic plaque buildup or acute thrombosis narrows the lumen of an epicardial coronary artery (here conceptually illustrated along the LAD), sharply increasing vascular resistance and limiting downstream blood flow.',
      structuralConsequences:
        'Reduced perfusion affects the dependent myocardial territory supplied by the LAD: the anterior wall of the left ventricle, the anterior two-thirds of the interventricular septum, and the cardiac apex.',
      functionalConsequences:
        'Because ventricular myocardium extracts oxygen near maximally at rest, reduced flow causes aerobic ATP depletion, impaired systolic contraction, and reduced diastolic relaxation in the affected region.',
      clinicalCorrelations:
        'Educational correlation: myocardial ischemia classically produces visceral chest discomfort mediated by cardiac sympathetic afferents (T1–T4), which converge in the spinal cord with somatic dermatomes of the chest, medial left arm, and jaw. This is an educational anatomical principle, not diagnostic or treatment guidance.',
      datasetLimitations:
        'BodyParts3D 4.0 provides healthy adult male reference meshes only. No atherosclerotic plaque, thrombus, infarct zone, electrical conduction animation, or contractile deformation mesh exists in the atlas.',
    },
    scientificDisclosure:
      'Conceptual Pathophysiology Disclosure: BodyParts3D 4.0 supplies healthy reference anatomy only. No atherosclerotic plaque, thrombus, or necrotic tissue 3D geometry is fabricated; amber and crimson color highlights are strictly conceptual educational overlays marking the coronary vessel and dependent myocardial territory.',
    reviewStatus: 'source_reviewed',
    sources: [
      AUTHORITATIVE_BP3D_SOURCE,
      {
        title: 'Anatomy and Physiology 2e — 19.1 Heart Anatomy & Coronary Circulation',
        source: 'OpenStax (Rice University)',
        url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/19-1-heart-anatomy',
        license: 'CC BY 4.0',
        supports: 'Normal heart orientation, chambers, great vessels, and epicardial coronary arterial anatomy',
      },
      {
        title: 'Anatomy, Thorax, Heart Coronary Arteries',
        source: 'NCBI StatPearls (Open Access)',
        url: 'https://www.ncbi.nlm.nih.gov/books/NBK534790/',
        license: 'CC BY-NC-ND 4.0',
        supports: 'LAD myocardial supply territory (anterior LV wall, anterior two-thirds of interventricular septum, apex)',
      },
    ],
    isBuiltIn: true,
    updatedAt: '2026-11-19T00:00:00.000Z',
    steps: [
      {
        id: 'coronary-stage-1',
        title: 'Stage 1 — Normal Cardiovascular & Thoracic Orientation',
        subtitle: 'Heart, great vessels, and thoracic context',
        stageRole: 'normal_anatomy',
        explanation:
          'Inside the middle mediastinum, the four-chambered heart sits posterior to the sternum and between the lungs. The ascending aorta and aortic arch carry oxygenated blood systemically, while the pulmonary trunk directs right ventricular output to the lungs.',
        captionText:
          'Normal mediastinal orientation: heart, ascending aorta, pulmonary trunk, and superior vena cava in situ.',
        narrationText:
          'Welcome to this guided 3D explanation of coronary ischemia. We begin with normal thoracic anatomy. Notice how the heart sits obliquely in the middle mediastinum, protected anteriorly by the sternum and flanked by the lungs. At the base of the heart, the ascending aorta rises from the left ventricle, the pulmonary trunk exits anteriorly from the right ventricle, and the superior vena cava returns venous blood to the right atrium.',
        keyLearningPoint:
          'The coronary arteries originate from the root of the ascending aorta immediately above the aortic valve.',
        durationSec: 10,
        camera: {
          view: 'three-quarter',
          focusBounds: { min: [-0.14, 1.10, -0.11], max: [0.14, 1.40, 0.11] },
          viewDirection: [0.38, 0.10, 1.0],
          autoRotate: false,
        },
        scene: {
          visibleSystems: ['cardiac', 'arterial', 'venous', 'respiratory'],
          selectedConceptIds: ['FMA7088', 'FMA3736', 'FMA3768', 'FMA8612', 'FMA4720'],
          surgicalRegionId: 'thorax-mediastinum',
          peeledLayerCount: 2,
          ghostSurroundings: true,
          explode: 0,
        },
        annotations: [
          {
            id: 'cor-ann-1',
            label: 'Heart (Middle Mediastinum)',
            detail: 'Four-chambered muscular pump positioned obliquely behind the sternum.',
            anchorConceptId: 'FMA7088',
            tone: 'landmark',
          },
          {
            id: 'cor-ann-2',
            label: 'Ascending Aorta & Pulmonary Trunk',
            detail: 'Great arterial roots; coronary ostia arise from the aortic sinuses.',
            anchorConceptId: 'FMA3736',
            tone: 'vessel',
          },
        ],
      },
      {
        id: 'coronary-stage-2',
        title: 'Stage 2 — Normal Coronary Arterial Supply (LAD & RCA)',
        subtitle: 'Epicardial arterial branches on the anterior heart surface',
        stageRole: 'supply_pathway',
        explanation:
          'The left main coronary artery emerges from the left aortic sinus and divides into the anterior interventricular (LAD) artery and circumflex branch. The LAD descends in the anterior interventricular sulcus toward the apex, supplying the anterior left ventricle and anterior septum.',
        captionText:
          'Real coronary meshes: left main trunk dividing into the LAD along the anterior interventricular sulcus.',
        narrationText:
          'Zooming onto the epicardial surface, we isolate the real coronary arterial meshes. Trace the left main coronary trunk as it passes behind the pulmonary trunk and bifurcates. Its anterior interventricular branch—commonly called the LAD—descends directly down the groove between the right and left ventricles toward the apex, giving off septal and diagonal branches. Meanwhile, the right coronary artery courses along the right atrioventricular groove.',
        keyLearningPoint:
          'The LAD supplies the anterior wall of the left ventricle, the cardiac apex, and the anterior two-thirds of the interventricular septum.',
        durationSec: 11,
        camera: {
          view: 'front',
          focusBounds: { min: [-0.09, 1.13, -0.08], max: [0.09, 1.32, 0.08] },
          viewDirection: [0.28, 0.06, 1.0],
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
            id: 'cor-ann-3',
            label: 'Left Main & LAD Artery',
            detail: 'Courses down the anterior interventricular sulcus to perfuse the anterior LV.',
            anchorConceptId: 'FMA3862',
            tone: 'vessel',
          },
          {
            id: 'cor-ann-4',
            label: 'Right Coronary Artery',
            detail: 'Courses along the right AV groove to supply the right ventricle and inferior wall.',
            anchorConceptId: 'FMA50039',
            tone: 'vessel',
          },
        ],
      },
      {
        id: 'coronary-stage-3',
        title: 'Stage 3 — Initiating Mechanism: Coronary Luminal Narrowing',
        subtitle: 'Conceptual educational overlay on healthy LAD geometry',
        stageRole: 'mechanism',
        isConceptualOverlay: true,
        explanation:
          'In coronary artery disease, subendothelial lipid accumulation and atherosclerotic plaque narrow the arterial lumen. Acute plaque disruption can trigger local platelet aggregation and thrombosis, abruptly reducing distal coronary blood flow.',
        captionText:
          'Conceptual mechanism: amber highlight marks the site of proximal LAD luminal narrowing (healthy reference mesh).',
        narrationText:
          'Now let us examine the initiating mechanism. In coronary atherosclerosis, plaque narrows the internal diameter of the epicardial vessel, and acute plaque rupture with thrombus formation can abruptly obstruct flow. Here, we highlight the proximal LAD in amber as a conceptual marker—importantly, this 3D mesh is still the healthy reference artery; no fabricated plaque geometry is modeled.',
        keyLearningPoint:
          'Even modest reductions in arterial lumen radius dramatically increase resistance and limit peak coronary blood flow.',
        durationSec: 11,
        camera: {
          view: 'front',
          focusBounds: { min: [-0.08, 1.15, -0.07], max: [0.08, 1.31, 0.07] },
          viewDirection: [0.32, 0.08, 1.0],
          autoRotate: false,
        },
        scene: {
          visibleSystems: ['cardiac', 'arterial'],
          selectedConceptIds: ['FMA3855', 'FMA3862'],
          ghostSurroundings: true,
          explode: 0,
          conceptColorOverrides: {
            FMA3855: '#f97316',
            FMA3862: '#f59e0b',
          },
        },
        annotations: [
          {
            id: 'cor-ann-5',
            label: 'Conceptual Obstruction Zone (LAD)',
            detail: 'Amber overlay illustrates proximal luminal narrowing on healthy reference anatomy.',
            anchorConceptId: 'FMA3862',
            isConceptual: true,
            tone: 'warning',
          },
          {
            id: 'cor-ann-6',
            label: 'No Fabricated Plaque Mesh',
            detail: 'Atherosclerotic plaque and thrombus are taught conceptually without synthetic lesion geometry.',
            isConceptual: true,
            tone: 'warning',
          },
        ],
        disclosureNote:
          'Conceptual Overlay: Amber highlight indicates the educational obstruction site on healthy BodyParts3D LAD geometry.',
      },
      {
        id: 'coronary-stage-4',
        title: 'Stage 4 — Dependent Ischemic Territory (Left Ventricle)',
        subtitle: 'Anatomical mapping of downstream myocardial vulnerability',
        stageRole: 'affected_territory',
        isConceptualOverlay: true,
        explanation:
          'Because coronary arteries behave largely as functional end-arteries with limited acute collateral reserve, proximal LAD obstruction places the high-pressure left ventricular myocardium (crimson conceptual overlay) in an immediate oxygen deficit while the right ventricle (muted slate) is largely spared.',
        captionText:
          'Conceptual perfusion territory: crimson marks the dependent left ventricle downstream of the LAD.',
        narrationText:
          'What happens downstream of this obstruction? Coronary branches act largely as functional end-arteries. When proximal LAD flow falls, the dependent myocardium—especially the thick, high-pressure left ventricular wall highlighted here in crimson—rapidly develops oxygen supply-demand mismatch, whereas the right ventricle shown in muted gray is primarily supplied by the right coronary artery.',
        keyLearningPoint:
          'Because the LAD perfuses a large proportion of the left ventricle, proximal LAD occlusion threatens systemic cardiac output.',
        durationSec: 11,
        camera: {
          view: 'three-quarter',
          focusBounds: { min: [-0.09, 1.13, -0.08], max: [0.09, 1.32, 0.08] },
          viewDirection: [0.48, 0.10, 1.0],
          autoRotate: false,
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
            id: 'cor-ann-7',
            label: 'Dependent Territory: Left Ventricle',
            detail: 'Crimson conceptual overlay marks left ventricular myocardium supplied by the LAD.',
            anchorConceptId: 'FMA7101',
            isConceptual: true,
            tone: 'clinical',
          },
          {
            id: 'cor-ann-8',
            label: 'Relatively Spared: Right Ventricle',
            detail: 'Primarily perfused by the right coronary artery in most individuals.',
            anchorConceptId: 'FMA7098',
            tone: 'landmark',
          },
        ],
        disclosureNote:
          'Conceptual Territory Overlay: Illustrates textbook arterial supply territory; does not represent measured patient perfusion data.',
      },
      {
        id: 'coronary-stage-5',
        title: 'Stage 5 — Functional & Physiological Consequences',
        subtitle: 'Oxygen supply-demand mismatch and ventricular mechanics',
        stageRole: 'functional_consequence',
        isConceptualOverlay: true,
        explanation:
          'The left ventricle generates high systemic systolic pressure and extracts roughly 65–75% of arterial oxygen even at rest. When coronary flow cannot meet metabolic demand, anaerobic metabolism accumulates lactate, diastolic relaxation stiffens first, and systolic ejection fraction falls.',
        captionText:
          'Functional consequence: ATP depletion impairs left ventricular relaxation and systolic pumping efficiency.',
        narrationText:
          'Let us connect this anatomical territory to physiology. In this sagittal cutaway context, remember that the left ventricle has the thickest muscular wall and relies almost entirely on diastolic coronary inflow. When oxygen delivery drops, cardiomyocytes shift to anaerobic glycolysis, intracellular ATP falls, diastolic compliance worsens, and regional systolic contraction weakens—reducing stroke volume.',
        keyLearningPoint:
          'Left ventricular coronary perfusion occurs predominantly during diastole; tachycardia shortens diastole and worsens ischemia.',
        durationSec: 11,
        camera: {
          view: 'left',
          focusBounds: { min: [-0.10, 1.12, -0.09], max: [0.10, 1.34, 0.09] },
          viewDirection: [-0.85, 0.08, 0.52],
          autoRotate: false,
        },
        scene: {
          visibleSystems: ['cardiac', 'arterial'],
          selectedConceptIds: ['FMA7101', 'FMA3736'],
          ghostSurroundings: true,
          clipping: { enabled: true, axis: 'x', offset: 0.5, inverted: false },
          explode: 0,
          conceptColorOverrides: {
            FMA7101: '#dc2626',
            FMA3862: '#f59e0b',
          },
        },
        annotations: [
          {
            id: 'cor-ann-9',
            label: 'Thick Left Ventricular Wall',
            detail: 'High intramural pressure during systole makes LV perfusion predominantly diastolic.',
            anchorConceptId: 'FMA7101',
            tone: 'clinical',
          },
          {
            id: 'cor-ann-10',
            label: 'No Simulated Contraction',
            detail: 'Mechanical wall-motion and ECG changes are explained conceptually without unvalidated physics simulation.',
            isConceptual: true,
            tone: 'warning',
          },
        ],
        disclosureNote:
          'Physiological Concept: Cutaway exposes left ventricular orientation; contractile deformation and ECG waveforms are not simulated in 3D.',
      },
      {
        id: 'coronary-stage-6',
        title: 'Stage 6 — Clinical Correlation & Referred Pain Pathways',
        subtitle: 'Visceral-somatic convergence in the upper thoracic spinal cord',
        stageRole: 'clinical_correlation',
        isConceptualOverlay: true,
        explanation:
          'Ischemic metabolites stimulate cardiac visceral afferent fibers traveling with sympathetic nerves to spinal cord segments T1–T4. Because these segments also receive somatic pain fibers from the anterior chest wall and medial upper limb, the brain perceives visceral ischemia as substernal chest discomfort often radiating to the left shoulder or arm.',
        captionText:
          'Clinical correlation: cardiac afferents (T1–T4) share spinal segments with anterior chest and medial arm dermatomes.',
        narrationText:
          'Zooming back out to the anterior thorax helps explain a classic clinical correlation. Why is myocardial ischemia felt in the chest, shoulder, or left arm rather than pinpointed to the heart? Cardiac visceral pain afferents enter the thoracic spinal cord at levels T1 through T4—the exact same segments receiving somatic sensory input from the substernal chest wall and medial arm. Note that this explains the anatomical mechanism of referred pain and is not diagnostic or treatment advice.',
        keyLearningPoint:
          'Visceral-somatic convergence at spinal segments T1–T4 explains classic referred ischemic chest and medial arm discomfort.',
        durationSec: 11,
        camera: {
          view: 'front',
          focusBounds: { min: [-0.22, 1.05, -0.15], max: [0.22, 1.46, 0.15] },
          viewDirection: [0.18, 0.08, 1.0],
          autoRotate: false,
        },
        scene: {
          visibleSystems: ['skeletal', 'cardiac', 'arterial'],
          selectedConceptIds: ['FMA7485', 'FMA7101', 'FMA3862'],
          ghostSurroundings: true,
          explode: 0,
          conceptColorOverrides: {
            FMA3862: '#f59e0b',
            FMA7101: '#dc2626',
          },
        },
        annotations: [
          {
            id: 'cor-ann-11',
            label: 'Substernal Projection',
            detail: 'Sternum overlies the anterior left ventricle and anterior interventricular sulcus.',
            anchorConceptId: 'FMA7485',
            tone: 'landmark',
          },
          {
            id: 'cor-ann-12',
            label: 'T1–T4 Visceral-Somatic Convergence',
            detail: 'Conceptual neuroanatomical pathway explaining referred chest and left arm discomfort.',
            isConceptual: true,
            tone: 'clinical',
          },
        ],
        disclosureNote:
          'Educational Correlation Only: Explains anatomical referred-pain principles; not intended for clinical diagnosis or patient management.',
      },
      {
        id: 'coronary-stage-7',
        title: 'Stage 7 — Knowledge Check & Mechanism Recap',
        subtitle: 'Verify the anatomical pathway from LAD to left ventricular territory',
        stageRole: 'checkpoint',
        isConceptualOverlay: true,
        explanation:
          'Recap: Ascending aorta → Left main coronary artery → Anterior interventricular (LAD) branch → Anterior left ventricular wall & anterior septum. Complete the checkpoint below to test your understanding of normal anatomy versus conceptual ischemic territory.',
        captionText:
          'Recap & Checkpoint: Aortic root → Left Main → LAD → Anterior Left Ventricle & Interventricular Septum.',
        narrationText:
          'To wrap up, trace the complete anatomical sequence one final time: blood enters the left main coronary artery from the ascending aorta during diastole, flows down the anterior interventricular branch, and nourishes the anterior left ventricle and septum. Pause here and complete the knowledge check below to reinforce what you have seen.',
        keyLearningPoint:
          'Distinguish real anatomical coronary course (LAD in anterior interventricular sulcus) from conceptual ischemic overlays.',
        durationSec: 12,
        camera: {
          view: 'three-quarter',
          focusBounds: { min: [-0.09, 1.13, -0.08], max: [0.09, 1.32, 0.08] },
          viewDirection: [0.42, 0.12, 1.0],
          autoRotate: true,
        },
        scene: {
          visibleSystems: ['cardiac', 'arterial'],
          selectedConceptIds: ['FMA3855', 'FMA3862', 'FMA7101'],
          ghostSurroundings: true,
          explode: 0,
          conceptColorOverrides: {
            FMA3862: '#f59e0b',
            FMA7101: '#dc2626',
          },
        },
        annotations: [
          {
            id: 'cor-ann-13',
            label: 'Summary Pathway',
            detail: 'Ascending Aorta → Left Main → LAD (amber) → Anterior Left Ventricle (crimson).',
            anchorConceptId: 'FMA3862',
            isConceptual: true,
            tone: 'clinical',
          },
        ],
        disclosureNote:
          'Conceptual Overlay: Uses healthy BodyParts3D 4.0 reference meshes with educational color coding.',
        assessmentCheck: {
          question:
            'In this 3D sequence, occlusion of the anterior interventricular (LAD) branch primarily compromises perfusion to which anatomical territory, and during which phase of the cardiac cycle does most left ventricular coronary inflow occur?',
          options: [
            'Anterior left ventricular wall & anterior septum — predominantly during ventricular diastole',
            'Posterior right atrium only — predominantly during peak ventricular systole',
            'Descending thoracic aorta — predominantly during atrial systole',
            'Superior vena cava wall — exclusively during isovolumetric contraction',
          ],
          correctIndex: 0,
          explanation:
            'The LAD supplies the anterior left ventricular wall, apex, and anterior two-thirds of the interventricular septum; thick left ventricular myocardium is perfused predominantly during ventricular diastole when intramural compression drops.',
        },
      },
    ],
  },

  // =========================================================================
  // 2. STARTER CLINICAL EXPLAINER #1: PITUITARY FOSSA & OPTIC CHIASM
  // =========================================================================
  {
    schemaVersion: PRESENTATION_SCHEMA_VERSION,
    id: 'builtin-pituitary-optic-chiasm',
    title: 'Sellar Anatomy: Pituitary Mass Effect & Optic Chiasm Compression',
    subtitle: '5-Stage Neuro-Endocrine & Visual Pathway 3D Explainer',
    category: 'pathophysiology',
    mechanismDomain: 'neurological_pathway',
    relatedClinicalCaseId: 'case-pituitary-optic-chiasm',
    region: 'Cranial Base & Sella Turcica',
    targetSystems: ['skeletal', 'endocrine', 'nervous', 'arterial'],
    difficultyLevel: 'MBBS / Allied Health',
    summary:
      'Explores the exact 3D spatial anatomy of the sphenoid sella turcica, pituitary gland, optic nerves, optic chiasm, and flanking internal carotid arteries to explain why upward intrasellar expansion compresses decussating nasal retinal fibers.',
    learningObjectives: [
      'Locate the pituitary gland seated within the sphenoid sella turcica at the midline cranial base.',
      'Identify the optic nerves converging into the optic chiasm directly superior to the pituitary fossa.',
      'Explain why rigid bony walls force upward intrasellar expansion toward the central optic chiasm.',
    ],
    priorKnowledge: [
      'Basic cranial base bones (sphenoid) and retinal visual field projection (nasal retina views temporal visual field).',
    ],
    mechanismProfile: {
      normalAnatomy:
        'The pituitary gland sits inside the hypophyseal fossa of the sphenoid bone, flanked laterally by the cavernous sinuses and internal carotid arteries, with the optic chiasm crossing immediately superiorly.',
      mechanism:
        'Because the sphenoid bone forms a rigid floor and anterior/posterior walls, an enlarging intrasellar lesion preferentially expands superiorly through the diaphragma sellae.',
      structuralConsequences:
        'Superior expansion presses upward against the central midline of the optic chiasm, where axons from the nasal half of each retina cross to the contralateral optic tract.',
      functionalConsequences:
        'Disruption of crossing nasal retinal fibers impairs perception of the bilateral outer (temporal) visual fields—classically described as bitemporal visual field loss.',
      clinicalCorrelations:
        'Educational neuro-ophthalmic correlation demonstrating how rigid bony boundaries dictate the direction of mass effect. Not diagnostic or clinical guidance.',
      datasetLimitations:
        'Pituitary gland, optic chiasm, optic nerves, sphenoid bone, and internal carotid arteries are real BodyParts3D 4.0 meshes. Diaphragma sellae, cavernous sinus walls, and pituitary adenoma mass geometry are conceptual only.',
    },
    scientificDisclosure:
      'Conceptual Mechanism Disclosure: Pituitary gland, optic chiasm, optic nerves, sphenoid bone, and internal carotid arteries are real healthy BodyParts3D 4.0 meshes. No tumor/adenoma mesh or diaphragma sellae sheet is modeled; amber/crimson color highlights conceptually represent upward mass-effect pressure.',
    reviewStatus: 'source_reviewed',
    sources: [
      AUTHORITATIVE_BP3D_SOURCE,
      {
        title: 'Anatomy and Physiology 2e — 17.3 The Pituitary Gland and Hypothalamus & 14.1 Visual Pathways',
        source: 'OpenStax (Rice University)',
        url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/17-3-the-pituitary-gland-and-hypothalamus',
        license: 'CC BY 4.0',
        supports: 'Pituitary fossa location, sphenoid sella relations, and optic chiasm decussation',
      },
    ],
    isBuiltIn: true,
    updatedAt: '2026-11-19T00:00:00.000Z',
    steps: [
      {
        id: 'pit-step-1',
        title: '1. Midline Cranial Base & Sphenoid Sella',
        subtitle: 'Bony cradle of the central skull base',
        stageRole: 'normal_anatomy',
        explanation:
          'At the center of the cranial base, the sphenoid bone forms the sella turcica—a rigid bony saddle that houses and protects the pituitary gland anteriorly, inferiorly, and posteriorly.',
        captionText:
          'Sphenoid bone forms the rigid bony sella turcica at the midline cranial base.',
        narrationText:
          'Let us examine sellar regional anatomy at the center of the skull base. With the upper cranial vault peeled away, look at the butterfly-shaped sphenoid bone. Its central depression—the sella turcica—forms a rigid bony cradle directly beneath the brain.',
        keyLearningPoint:
          'Rigid sphenoid bone walls restrict inferior and anteroposterior expansion from inside the sella.',
        durationSec: 9,
        camera: {
          view: 'three-quarter',
          focusBounds: { min: [-0.07, 1.56, -0.07], max: [0.07, 1.69, 0.08] },
          viewDirection: [0.55, 0.25, 0.85],
          autoRotate: false,
        },
        scene: {
          visibleSystems: ['skeletal', 'endocrine', 'nervous', 'arterial'],
          selectedConceptIds: ['FMA52736', 'FMA13889'],
          surgicalRegionId: 'cranial-vault-neuro',
          peeledLayerCount: 2,
          ghostSurroundings: true,
          explode: 0,
        },
        annotations: [
          {
            id: 'pit-ann-1',
            label: 'Sphenoid Bone (Sella Turcica)',
            detail: 'Rigid midline cranial base bone forming the floor of the pituitary fossa.',
            anchorConceptId: 'FMA52736',
            tone: 'landmark',
          },
          {
            id: 'pit-ann-2',
            label: 'Pituitary Gland',
            detail: 'Master endocrine gland seated directly inside the hypophyseal fossa.',
            anchorConceptId: 'FMA13889',
            tone: 'clinical',
          },
        ],
      },
      {
        id: 'pit-step-2',
        title: '2. Optic Nerves & Optic Chiasm Immediately Superior',
        subtitle: 'Visual fibers crossing directly above the pituitary gland',
        stageRole: 'supply_pathway',
        explanation:
          'Both optic nerves enter the cranial cavity through the optic canals and unite at the optic chiasm directly above the pituitary gland. Here, fibers from the nasal half of each retina cross to the opposite side.',
        captionText:
          'Real meshes: optic nerves converge into the optic chiasm directly superior to the pituitary gland.',
        narrationText:
          'Now focus on the visual pathway sitting right above the gland. The right and left optic nerves enter from the orbits and meet at the optic chiasm directly superior to the pituitary fossa. Crucially, the axons carrying information from the nasal retinas—which observe the outer temporal visual fields—cross right across the midline of this chiasm.',
        keyLearningPoint:
          'Nasal retinal fibers (viewing temporal visual fields) decussate in the central optic chiasm directly above the pituitary.',
        durationSec: 10,
        camera: {
          view: 'front',
          focusBounds: { min: [-0.06, 1.57, -0.06], max: [0.06, 1.67, 0.07] },
          viewDirection: [0.25, 0.22, 1.0],
          autoRotate: false,
        },
        scene: {
          visibleSystems: ['endocrine', 'nervous', 'arterial'],
          selectedConceptIds: ['FMA13889', 'FMA50863', 'FMA62045'],
          ghostSurroundings: true,
          explode: 0,
        },
        annotations: [
          {
            id: 'pit-ann-3',
            label: 'Optic Chiasm',
            detail: 'Midline decussation of nasal retinal fibers sitting immediately above the pituitary.',
            anchorConceptId: 'FMA62045',
            tone: 'nerve',
          },
          {
            id: 'pit-ann-4',
            label: 'Optic Nerves (CN II)',
            detail: 'Transmit retinal signals posteriorly from both orbits to the chiasm.',
            anchorConceptId: 'FMA50863',
            tone: 'nerve',
          },
        ],
      },
      {
        id: 'pit-step-3',
        title: '3. Lateral Vascular Relations — Internal Carotid Arteries',
        subtitle: 'Why lateral expansion is constrained by parasellar vessels',
        stageRole: 'supply_pathway',
        explanation:
          'Flanking both sides of the sella turcica are the internal carotid arteries coursing through the cavernous sinuses. This close parasellar neurovascular corridor explains why suprasellar growth toward the chiasm is the path of least resistance.',
        captionText:
          'Internal carotid arteries flank the pituitary laterally, framing the parasellar corridor.',
        narrationText:
          'Look just lateral to the pituitary gland. The paired internal carotid arteries ascend on both sides of the sella turcica. With rigid sphenoid bone below and major vessels laterally, the roof of the sella—the thin dural diaphragma sellae—represents the path of least resistance.',
        keyLearningPoint:
          'Internal carotid arteries lie immediately lateral to the pituitary fossa on both sides.',
        durationSec: 9,
        camera: {
          view: 'three-quarter',
          focusBounds: { min: [-0.06, 1.56, -0.06], max: [0.06, 1.67, 0.07] },
          viewDirection: [0.60, 0.15, 0.80],
          autoRotate: false,
        },
        scene: {
          visibleSystems: ['endocrine', 'nervous', 'arterial'],
          selectedConceptIds: ['FMA13889', 'FMA3947', 'FMA62045'],
          ghostSurroundings: true,
          explode: 0,
        },
        annotations: [
          {
            id: 'pit-ann-5',
            label: 'Internal Carotid Arteries',
            detail: 'Paired parasellar arteries ascending immediately lateral to the pituitary gland.',
            anchorConceptId: 'FMA3947',
            tone: 'vessel',
          },
        ],
      },
      {
        id: 'pit-step-4',
        title: '4. Conceptual Mechanism: Upward Suprasellar Compression',
        subtitle: 'Why central chiasmal compression affects temporal visual fields',
        stageRole: 'mechanism',
        isConceptualOverlay: true,
        explanation:
          'When an intrasellar mass expands superiorly (conceptually highlighted amber on the healthy pituitary mesh), it compresses the central crossing fibers of the optic chiasm (highlighted crimson), selectively disrupting bilateral temporal peripheral vision.',
        captionText:
          'Conceptual mass effect: upward intrasellar expansion (amber) compresses central optic chiasm fibers (crimson).',
        narrationText:
          'Here we apply a conceptual color overlay to the healthy reference meshes. As an intrasellar mass expands upward from the pituitary fossa—marked in amber—it presses directly against the undersurface of the central optic chiasm, marked in crimson. Because those central fibers originate from both nasal retinas, compression produces classic bilateral outer, or bitemporal, visual field impairment.',
        keyLearningPoint:
          'Upward pituitary compression of central decussating chiasmal fibers impairs bilateral temporal visual fields.',
        durationSec: 11,
        camera: {
          view: 'left',
          focusBounds: { min: [-0.06, 1.57, -0.06], max: [0.06, 1.67, 0.06] },
          viewDirection: [-0.90, 0.12, 0.42],
          autoRotate: false,
        },
        scene: {
          visibleSystems: ['endocrine', 'nervous', 'skeletal'],
          selectedConceptIds: ['FMA13889', 'FMA62045'],
          ghostSurroundings: true,
          clipping: { enabled: true, axis: 'x', offset: 0.5, inverted: false },
          explode: 0,
          conceptColorOverrides: {
            FMA13889: '#f59e0b',
            FMA62045: '#dc2626',
          },
        },
        annotations: [
          {
            id: 'pit-ann-6',
            label: 'Conceptual Intrasellar Expansion',
            detail: 'Amber highlight on healthy pituitary mesh; no adenoma geometry is fabricated.',
            anchorConceptId: 'FMA13889',
            isConceptual: true,
            tone: 'warning',
          },
          {
            id: 'pit-ann-7',
            label: 'Compressed Central Chiasm',
            detail: 'Crimson highlight marks crossing nasal retinal fibers carrying temporal visual fields.',
            anchorConceptId: 'FMA62045',
            isConceptual: true,
            tone: 'clinical',
          },
        ],
        disclosureNote:
          'Conceptual Overlay: Uses healthy BodyParts3D pituitary and optic chiasm meshes; no tumor mesh or diaphragma sellae is modeled.',
      },
      {
        id: 'pit-step-5',
        title: '5. Knowledge Check & Sellar Pathway Recap',
        subtitle: 'Consolidate bony, vascular, and visual pathway relations',
        stageRole: 'checkpoint',
        isConceptualOverlay: true,
        explanation:
          'Recap: Sphenoid sella turcica (rigid floor) → Pituitary gland → Superior optic chiasm (crossing nasal retinal fibers) → Flanking internal carotid arteries. Answer the checkpoint below.',
        captionText:
          'Checkpoint: Connect rigid sellar floor geometry to upward optic chiasm compression.',
        narrationText:
          'Review the three-dimensional neighborhood one last time: rigid sphenoid bone beneath, internal carotid arteries to each side, and the optic chiasm directly overhead. Complete the knowledge check below to verify your understanding.',
        keyLearningPoint:
          'Midline chiasmal compression selectively affects crossing nasal retinal fibers and outer temporal visual fields.',
        durationSec: 10,
        camera: {
          view: 'three-quarter',
          focusBounds: { min: [-0.06, 1.56, -0.06], max: [0.06, 1.67, 0.07] },
          viewDirection: [0.45, 0.20, 0.90],
          autoRotate: true,
        },
        scene: {
          visibleSystems: ['endocrine', 'nervous', 'arterial'],
          selectedConceptIds: ['FMA13889', 'FMA62045', 'FMA50863'],
          ghostSurroundings: true,
          explode: 0,
          conceptColorOverrides: {
            FMA13889: '#f59e0b',
            FMA62045: '#dc2626',
          },
        },
        annotations: [
          {
            id: 'pit-ann-8',
            label: 'Sellar-Chiasmal Axis',
            detail: 'Direct vertical relationship explains bitemporal visual field defects.',
            anchorConceptId: 'FMA62045',
            tone: 'nerve',
          },
        ],
        assessmentCheck: {
          question:
            'Why does upward expansion from the pituitary fossa classically impair the outer (temporal) visual fields of both eyes?',
          options: [
            'It compresses crossing nasal retinal fibers in the central optic chiasm directly above the sella',
            'It occludes the posterior cerebellar arteries in the occipital lobe',
            'It compresses the thoracic sympathetic chain',
            'It blocks the auditory ossicles inside the temporal bone',
          ],
          correctIndex: 0,
          explanation:
            'Fibers from the nasal half of each retina—which receive light from the temporal visual fields—decussate in the central optic chiasm immediately superior to the pituitary gland.',
        },
      },
    ],
  },

  // =========================================================================
  // 3. STARTER CLINICAL EXPLAINER #2: HEPATIC PORTAL VENOUS MECHANISM
  // =========================================================================
  {
    schemaVersion: PRESENTATION_SCHEMA_VERSION,
    id: 'builtin-hepatic-portal-mechanism',
    title: 'Hepatic Portal Circulation & Portal Resistance Mechanism',
    subtitle: '5-Stage Abdominal Vascular & Visceral 3D Explainer',
    category: 'pathophysiology',
    mechanismDomain: 'vascular_hemodynamics',
    relatedClinicalCaseId: 'case-hepatic-portal-circulation',
    region: 'Upper Abdomen & Portal Triad',
    targetSystems: ['venous', 'digestive', 'lymphatic'],
    difficultyLevel: 'Foundational / Pre-Medical',
    summary:
      'Traces nutrient-rich gastrointestinal and splenic venous drainage through the real BodyParts3D hepatic portal vein into the liver and inferior vena cava, explaining how increased intrahepatic resistance elevates portal venous pressure.',
    learningObjectives: [
      'Identify the liver, spleen, pancreas, stomach, hepatic portal vein, and inferior vena cava in upper abdominal 3D context.',
      'Explain why GI venous outflow passes through a second sinusoidal capillary bed in the liver before entering systemic venous return.',
      'Understand conceptually how elevated intrahepatic resistance backs up pressure through the portal venous tree.',
    ],
    priorKnowledge: [
      'General systemic venous return via the inferior vena cava to the right atrium.',
    ],
    mechanismProfile: {
      normalAnatomy:
        'The hepatic portal vein forms posterior to the pancreatic neck from the splenic and superior mesenteric veins and delivers ~75% of hepatic blood flow directly into liver sinusoids before hepatic veins drain into the IVC.',
      mechanism:
        'When hepatic parenchymal architecture becomes stiffened or obstructed (conceptually illustrated), sinusoidal resistance rises and opposes normal low-pressure portal inflow.',
      structuralConsequences:
        'Elevated portal venous pressure dilates upstream portal tributaries and favors alternative portosystemic collateral venous pathways around the esophagus, stomach, and spleen.',
      functionalConsequences:
        'Bypassing hepatic sinusoids reduces first-pass metabolic processing and detoxification of absorbed gastrointestinal compounds before they reach the systemic circulation.',
      clinicalCorrelations:
        'Educational vascular-anatomy correlation connecting portal-systemic anatomy to splenomegaly and collateral venous shunting concepts. Not diagnostic or clinical guidance.',
      datasetLimitations:
        'Liver, hepatic portal vein, spleen, pancreas, stomach, and IVC are real BodyParts3D 4.0 meshes. Microscopic hepatic sinusoids, cirrhotic fibrosis, and dilated esophageal varices are conceptual only.',
    },
    scientificDisclosure:
      'Conceptual Hemodynamics Disclosure: Liver, hepatic portal vein, spleen, pancreas, stomach, and IVC are healthy BodyParts3D 4.0 meshes. Microscopic sinusoids, hepatic fibrosis, and variceal collateral dilations are not modeled and are explained conceptually.',
    reviewStatus: 'source_reviewed',
    sources: [
      AUTHORITATIVE_BP3D_SOURCE,
      {
        title: 'Anatomy and Physiology 2e — 20.5 Circulatory Pathways (Hepatic Portal System)',
        source: 'OpenStax (Rice University)',
        url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/20-5-circulatory-pathways',
        license: 'CC BY 4.0',
        supports: 'Hepatic portal vein formation, sinusoidal processing, and hepatic venous return to the IVC',
      },
    ],
    isBuiltIn: true,
    updatedAt: '2026-11-19T00:00:00.000Z',
    steps: [
      {
        id: 'portal-step-1',
        title: '1. Upper Abdominal Visceral Context',
        subtitle: 'Liver, stomach, pancreas, and spleen',
        stageRole: 'normal_anatomy',
        explanation:
          'In the upper abdomen beneath the diaphragm, the liver occupies the right upper quadrant while the stomach, pancreas, and spleen sit centrally and to the left—forming the digestive and lymphoid beds that feed the portal system.',
        captionText:
          'Upper abdominal organs feeding and receiving the hepatic portal circulation.',
        narrationText:
          'Unlike most organs that drain straight into the vena cava, the gastrointestinal tract and spleen route their venous blood through the liver first. Here in the upper abdomen, orient yourself to the large liver on the right, the stomach and pancreas centrally, and the spleen tucked in the left upper quadrant.',
        keyLearningPoint:
          'The liver receives dual blood supply: oxygenated hepatic arterial blood and nutrient-rich portal venous blood.',
        durationSec: 9,
        camera: {
          view: 'front',
          focusBounds: { min: [-0.18, 0.90, -0.12], max: [0.18, 1.22, 0.12] },
          viewDirection: [0.15, 0.08, 1.0],
          autoRotate: false,
        },
        scene: {
          visibleSystems: ['digestive', 'lymphatic', 'venous'],
          selectedConceptIds: ['FMA7197', 'FMA7148', 'FMA7198', 'FMA7196'],
          ghostSurroundings: false,
          explode: 0,
        },
        annotations: [
          {
            id: 'port-ann-1',
            label: 'Liver (Right Upper Quadrant)',
            detail: 'Primary metabolic organ receiving ~75% of its blood flow via the portal vein.',
            anchorConceptId: 'FMA7197',
            tone: 'landmark',
          },
          {
            id: 'port-ann-2',
            label: 'Stomach, Pancreas & Spleen',
            detail: 'Upper abdominal viscera whose venous drainage enters the hepatic portal system.',
            anchorConceptId: 'FMA7196',
            tone: 'landmark',
          },
        ],
      },
      {
        id: 'portal-step-2',
        title: '2. Hepatic Portal Vein Entering the Porta Hepatis',
        subtitle: 'Confluence behind the pancreatic neck into the liver',
        stageRole: 'supply_pathway',
        explanation:
          'Ghosting the surrounding viscera reveals the real 3D hepatic portal vein ascending posterior to the pancreas and branching inside the liver parenchyma to distribute absorbed nutrients to hepatic sinusoids.',
        captionText:
          'Real hepatic portal vein mesh ascending behind the pancreas and branching throughout the liver.',
        narrationText:
          'When we make the surrounding digestive organs translucent, the real hepatic portal vein stands out clearly. Formed behind the neck of the pancreas by the union of the splenic and superior mesenteric veins, it ascends to the porta hepatis and branches extensively throughout the liver lobes.',
        keyLearningPoint:
          'The hepatic portal vein forms posterior to the pancreatic neck from the splenic and superior mesenteric veins.',
        durationSec: 10,
        camera: {
          view: 'front',
          focusBounds: { min: [-0.15, 0.94, -0.10], max: [0.15, 1.20, 0.10] },
          viewDirection: [0.22, 0.06, 1.0],
          autoRotate: false,
        },
        scene: {
          visibleSystems: ['venous', 'digestive', 'lymphatic'],
          selectedConceptIds: ['FMA50735', 'FMA7198'],
          ghostSurroundings: true,
          explode: 0,
        },
        annotations: [
          {
            id: 'port-ann-3',
            label: 'Hepatic Portal Vein',
            detail: 'Delivers nutrient-rich GI and splenic venous blood into intrahepatic branches.',
            anchorConceptId: 'FMA50735',
            tone: 'vessel',
          },
          {
            id: 'port-ann-4',
            label: 'Pancreas',
            detail: 'Portal confluence lies directly posterior to the pancreatic neck.',
            anchorConceptId: 'FMA7198',
            tone: 'landmark',
          },
        ],
      },
      {
        id: 'portal-step-3',
        title: '3. Systemic Return via the Inferior Vena Cava',
        subtitle: 'Two-step venous routing: Portal Vein → Sinusoids → IVC',
        stageRole: 'supply_pathway',
        explanation:
          'After metabolic processing inside microscopic hepatic sinusoids (conceptual), blood exits via short hepatic veins directly into the retrohepatic inferior vena cava and returns to the right atrium.',
        captionText:
          'After hepatic sinusoidal processing, blood exits into the inferior vena cava toward the heart.',
        narrationText:
          'Trace the exit pathway. After portal blood percolates through microscopic liver sinusoids, it collects into hepatic veins and empties directly into the inferior vena cava running vertically behind the liver on its way up to the right atrium.',
        keyLearningPoint:
          'First-pass hepatic filtration occurs because GI venous blood traverses liver sinusoids before reaching the IVC.',
        durationSec: 9,
        camera: {
          view: 'three-quarter',
          focusBounds: { min: [-0.15, 0.94, -0.10], max: [0.15, 1.22, 0.10] },
          viewDirection: [-0.45, 0.10, 0.90],
          autoRotate: false,
        },
        scene: {
          visibleSystems: ['venous', 'digestive'],
          selectedConceptIds: ['FMA50735', 'FMA10951'],
          ghostSurroundings: true,
          explode: 0,
        },
        annotations: [
          {
            id: 'port-ann-5',
            label: 'Inferior Vena Cava (IVC)',
            detail: 'Receives hepatic venous outflow immediately inferior to the diaphragm.',
            anchorConceptId: 'FMA10951',
            tone: 'vessel',
          },
        ],
      },
      {
        id: 'portal-step-4',
        title: '4. Conceptual Mechanism: Elevated Intrahepatic Resistance',
        subtitle: 'Upstream portal pressure backup and splenic congestion',
        stageRole: 'mechanism',
        isConceptualOverlay: true,
        explanation:
          'If intrahepatic sinusoidal resistance rises (conceptually highlighted crimson on the liver), low-pressure portal inflow encounters resistance—raising pressure upstream in the portal vein (amber) and congested spleen, and encouraging blood to divert through portosystemic collaterals.',
        captionText:
          'Conceptual hemodynamics: elevated intrahepatic resistance (crimson) backs up pressure into the portal vein (amber).',
        narrationText:
          'Now consider what happens when intrahepatic resistance increases, such as in chronic parenchymal scarring. Here, crimson conceptually marks increased hepatic sinusoidal resistance, while amber highlights upstream pressure elevation along the portal vein and toward the spleen. Because portal blood seeks lower-resistance paths back to the vena cava, portosystemic collateral veins can enlarge.',
        keyLearningPoint:
          'Elevated resistance inside the liver raises upstream portal pressure and promotes portosystemic collateral shunting.',
        durationSec: 11,
        camera: {
          view: 'front',
          focusBounds: { min: [-0.17, 0.92, -0.11], max: [0.17, 1.21, 0.11] },
          viewDirection: [0.20, 0.08, 1.0],
          autoRotate: false,
        },
        scene: {
          visibleSystems: ['venous', 'digestive', 'lymphatic'],
          selectedConceptIds: ['FMA50735', 'FMA7197', 'FMA7196'],
          ghostSurroundings: true,
          explode: 0,
          conceptColorOverrides: {
            FMA7197: '#dc2626',
            FMA50735: '#f59e0b',
            FMA7196: '#d97706',
          },
        },
        annotations: [
          {
            id: 'port-ann-6',
            label: 'Conceptual Intrahepatic Resistance',
            detail: 'Crimson highlight on healthy liver mesh; microscopic fibrosis is not modeled.',
            anchorConceptId: 'FMA7197',
            isConceptual: true,
            tone: 'clinical',
          },
          {
            id: 'port-ann-7',
            label: 'Upstream Portal Pressure (Amber)',
            detail: 'Pressure backs up into portal tributaries and splenic venous outflow.',
            anchorConceptId: 'FMA50735',
            isConceptual: true,
            tone: 'warning',
          },
        ],
        disclosureNote:
          'Conceptual Overlay: Uses healthy BodyParts3D liver, portal vein, and spleen meshes; sinusoidal fibrosis and varices are not modeled.',
      },
      {
        id: 'portal-step-5',
        title: '5. Knowledge Check & Portal Pathway Recap',
        subtitle: 'Verify the two-step portal-to-systemic sequence',
        stageRole: 'checkpoint',
        isConceptualOverlay: true,
        explanation:
          'Recap: Splenic + Superior Mesenteric Veins → Hepatic Portal Vein → Liver Sinusoids → Hepatic Veins → Inferior Vena Cava. Test your understanding below.',
        captionText:
          'Checkpoint: Trace GI venous blood from portal confluence through the liver to the IVC.',
        narrationText:
          'Let us recap the portal pathway from start to finish: gastrointestinal and splenic venous blood unites behind the pancreas into the hepatic portal vein, passes through hepatic sinusoids for metabolic processing, and exits into the inferior vena cava. Complete the checkpoint below.',
        keyLearningPoint:
          'The hepatic portal system interposes liver sinusoids between GI capillary beds and the systemic IVC.',
        durationSec: 10,
        camera: {
          view: 'three-quarter',
          focusBounds: { min: [-0.16, 0.93, -0.11], max: [0.16, 1.21, 0.11] },
          viewDirection: [0.35, 0.12, 0.95],
          autoRotate: true,
        },
        scene: {
          visibleSystems: ['venous', 'digestive', 'lymphatic'],
          selectedConceptIds: ['FMA50735', 'FMA10951'],
          ghostSurroundings: true,
          explode: 0,
        },
        annotations: [
          {
            id: 'port-ann-8',
            label: 'Portal-to-IVC Pathway',
            detail: 'Portal vein delivers GI venous return for hepatic processing prior to IVC entry.',
            anchorConceptId: 'FMA50735',
            tone: 'vessel',
          },
        ],
        assessmentCheck: {
          question:
            'Why does gastrointestinal venous blood pass through the hepatic portal vein before entering the inferior vena cava?',
          options: [
            'To route absorbed nutrients and compounds through hepatic sinusoids for metabolic processing before systemic circulation',
            'To deliver oxygenated arterial blood directly from the lungs to the spleen',
            'To bypass the liver completely during digestion',
            'To drain cerebrospinal fluid from the cranial cavity',
          ],
          correctIndex: 0,
          explanation:
            'The hepatic portal vein carries nutrient-rich GI and splenic venous blood into liver sinusoids for first-pass metabolic regulation and detoxification before returning to the systemic circulation via the IVC.',
        },
      },
    ],
  },

  // =========================================================================
  // 4. ANATOMICAL / PROGRESSIVE DISSECTION: CRANIAL ANATOMY
  // =========================================================================
  {
    schemaVersion: PRESENTATION_SCHEMA_VERSION,
    id: 'builtin-cranial-dissection',
    title: 'Cranial Anatomy & Progressive Dissection',
    subtitle: 'From Calvarial Vault to Intracranial Vessels, Tentorium & Deep Brain',
    category: 'anatomical',
    mechanismDomain: 'anatomical_relationships',
    region: 'Head & Cranial Cavity',
    targetSystems: ['skeletal', 'nervous', 'arterial', 'venous', 'connective', 'endocrine'],
    difficultyLevel: 'Foundational / Pre-Medical',
    summary:
      'A 5-stage progressive 3D dissection of the human cranium using real BodyParts3D 4.0 meshes: inspect calvarial bones, peel the cranial vault, trace internal carotid and tentorial landmarks, and explore cerebral hemispheres, brainstem, cerebellum, and deep midline structures.',
    learningObjectives: [
      'Identify the frontal, parietal, temporal, and occipital bones forming the protective cranial vault.',
      'Understand the relationship between the tentorium cerebelli, intracranial arterial supply, and cerebral hemispheres.',
      'Locate deep midline neuroanatomy including the corpus callosum, thalamus, pituitary gland, pons, and cerebellum.',
    ],
    scientificDisclosure:
      'Anatomical Reference Mode: Uses healthy BodyParts3D 4.0 reference meshes. Epicranial scalp musculature (galea aponeurotica, temporalis) and arachnoid/pia mater membranes are conceptual educational references and are not individually meshed in this dataset.',
    reviewStatus: 'source_reviewed',
    sources: [
      AUTHORITATIVE_BP3D_SOURCE,
      {
        title: 'Anatomy and Physiology 2e — The Skull & Central Nervous System',
        source: 'OpenStax (Rice University)',
        url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/13-2-the-central-nervous-system',
        license: 'CC BY 4.0',
        supports: 'Cranial vault osteology, dural partitions, and major brain divisions',
      },
    ],
    isBuiltIn: true,
    updatedAt: '2026-11-19T00:00:00.000Z',
    steps: [
      {
        id: 'cran-step-1',
        title: '1. Intact Cranial Vault & Osteology',
        subtitle: 'Protective calvarial shell',
        stageRole: 'normal_anatomy',
        explanation:
          'The neurocranium encloses and protects the brain via interlocking flat bones—principally the frontal, paired parietal, temporal, and occipital bones—joined along fibrous sutures.',
        captionText:
          'Intact neurocranium: frontal, parietal, temporal, and occipital bones protect the brain.',
        narrationText:
          'We begin with the intact neurocranium. Notice how the frontal, paired parietal, temporal, and occipital bones interlock to form a rigid protective dome around the cerebral hemispheres.',
        keyLearningPoint:
          'Interlocking calvarial flat bones shield the intracranial compartment.',
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
        stageRole: 'normal_anatomy',
        explanation:
          'Peeling away the superficial calvarial bone layer exposes the intracranial neurovascular compartment without disturbing the underlying cerebral hemispheres or tentorial partition.',
        captionText:
          'Calvarial bone layer peeled to expose the cerebral hemispheres in situ.',
        narrationText:
          'Peeling away the calvarial bone layer reveals the cerebral cortex seated inside the cranial cavity. Remember that the scalp galea and thin arachnoid and pia mater membranes are not individually meshed in this dataset.',
        keyLearningPoint:
          'Progressive layer peeling exposes deep neuroanatomy while preserving spatial orientation.',
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
        stageRole: 'supply_pathway',
        explanation:
          'The internal carotid arteries ascend into the cranial base to supply the anterior and middle cerebral territories, while the tentorium cerebelli separates the occipital lobes from the posterior fossa cerebellum.',
        captionText:
          'Internal carotid arteries and tentorium cerebelli organize intracranial supply and compartments.',
        narrationText:
          'With the brain ghosted, trace the paired internal carotid arteries ascending into the anterior circulation alongside the transverse dural roof of the posterior fossa—the tentorium cerebelli.',
        keyLearningPoint:
          'The tentorium cerebelli separates the supratentorial cerebrum from the infratentorial cerebellum.',
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
        stageRole: 'normal_anatomy',
        explanation:
          'Applying a sagittal cutaway plane reveals interhemispheric white-matter commissures (corpus callosum), the diencephalic relay hub (thalamus), the sellar pituitary gland, and the pons.',
        captionText:
          'Midsagittal cutaway exposes corpus callosum, thalamus, pituitary gland, and pons.',
        narrationText:
          'A live midsagittal cutaway reveals the deep midline structures: the arched corpus callosum connecting both hemispheres, the oval thalamus beneath it, the pituitary gland in the sella turcica, and the bulging pons of the brainstem.',
        keyLearningPoint:
          'Sagittal sectioning aligns the corpus callosum, thalamus, pituitary gland, and brainstem along a single axis.',
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
        stageRole: 'checkpoint',
        explanation:
          'In the posterior fossa beneath the tentorium, the cerebellum coordinates balance and fine motor timing while the pons and brainstem house cranial nerve nuclei and vital cardiorespiratory pathways.',
        captionText:
          'Posterior fossa synthesis: cerebellum and pons beneath the tentorium cerebelli.',
        narrationText:
          'Finally, rotating to a posterior perspective highlights the cerebellum and pons tucked inside the posterior cranial fossa beneath the tentorium. Test your recall with the checkpoint below.',
        keyLearningPoint:
          'The tentorium cerebelli roofs the posterior fossa containing the cerebellum and brainstem.',
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
  // 5. REGIONAL SURGICAL EDUCATION: UPPER LIMB VASCULAR & COMPARTMENTS
  // =========================================================================
  {
    schemaVersion: PRESENTATION_SCHEMA_VERSION,
    id: 'builtin-upper-limb-surgical',
    title: 'Shoulder, Humeral Compartments & Upper-Limb Vascular Relations',
    subtitle: 'Regional Musculoskeletal & Arterial Landmarks for Surgical Education',
    category: 'surgical_education',
    mechanismDomain: 'surgical_regional',
    region: 'Shoulder, Arm & Forearm',
    targetSystems: ['skeletal', 'muscular', 'arterial', 'venous'],
    difficultyLevel: 'MBBS / Allied Health',
    summary:
      'A 5-stage educational regional anatomy walkthrough of the pectoral girdle, rotator cuff, humeral shaft, and continuous subclavian-to-axillary-to-brachial-to-radial/ulnar arterial axis, highlighting surgical landmarks and honest dataset boundaries.',
    learningObjectives: [
      'Orient the clavicle, scapula, and humerus in relation to the rotator cuff and deltoid zone.',
      'Trace the continuous upper-limb arterial tree from subclavian and axillary to brachial, radial, and ulnar arteries.',
      'Recognize key surgical danger zones along the humeral shaft and cubital fossa while understanding peripheral nerve relationships.',
    ],
    scientificDisclosure: `${SURGICAL_EDUCATION_DISCLAIMER} Dataset note: Subclavian, axillary, brachial, radial, and ulnar arteries and shoulder bones/rotator cuff muscles are real BodyParts3D 4.0 meshes; brachial plexus, radial, median, and ulnar peripheral nerves are not individually meshed in this dataset and are taught conceptually.`,
    reviewStatus: 'source_reviewed',
    sources: [
      AUTHORITATIVE_BP3D_SOURCE,
      {
        title: 'Anatomy and Physiology 2e — Appendicular Skeleton & Upper-Limb Vessels',
        source: 'OpenStax (Rice University)',
        url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/8-1-the-pectoral-girdle',
        license: 'CC BY 4.0',
        supports: 'Pectoral girdle osteology, rotator cuff attachments, and upper-limb arterial transitions',
      },
    ],
    isBuiltIn: true,
    updatedAt: '2026-11-19T00:00:00.000Z',
    steps: [
      {
        id: 'ul-step-1',
        title: '1. Pectoral Girdle & Deltoid Surface Landmarks',
        subtitle: 'Superficial shoulder architecture',
        stageRole: 'normal_anatomy',
        explanation:
          'Surgical orientation of the upper limb begins with bony palpable landmarks—the clavicle and scapular acromion—framed superficially by the deltoid zone and pectoralis major.',
        captionText:
          'Superficial shoulder landmarks: clavicle, scapula, and deltoid contour.',
        narrationText:
          'In regional upper-limb education, orientation starts with palpable surface landmarks: the clavicle anteriorly, the scapular spine and acromion posteriorly, and the rounded deltoid zone covering the proximal humerus.',
        keyLearningPoint:
          'Clavicle and acromion anchor superficial orientation over the shoulder joint.',
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
        stageRole: 'normal_anatomy',
        explanation:
          'Deep to the superficial shoulder contour, the supraspinatus, infraspinatus, and subscapularis muscles wrap around the proximal humerus to dynamically center the humeral head in the glenoid fossa.',
        captionText:
          'Deep rotator cuff muscles dynamically stabilize the humeral head within the glenoid fossa.',
        narrationText:
          'Looking deep to the deltoid, the rotator cuff sleeve—including supraspinatus above, infraspinatus posteriorly, and subscapularis anteriorly—dynamically centers the humeral head.',
        keyLearningPoint:
          'Rotator cuff muscles provide dynamic glenohumeral stability deep to the deltoid.',
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
        subtitle: 'Vascular gateway beneath the clavicle',
        stageRole: 'supply_pathway',
        explanation:
          'As the subclavian artery and vein cross the lateral border of the first rib beneath the clavicle, they continue into the axilla as the axillary artery and vein—passing posterior to pectoralis minor.',
        captionText:
          'Subclavian artery transitions to axillary artery at the lateral border of the first rib.',
        narrationText:
          'Peeling the superficial shoulder musculature exposes the continuous arterial axis. At the outer border of the first rib beneath the clavicle, the subclavian artery becomes the axillary artery. Note that brachial plexus cords are not individually meshed in this dataset and are taught conceptually.',
        keyLearningPoint:
          'The lateral border of the first rib defines the subclavian-to-axillary arterial transition.',
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
            detail: 'Divided into three parts relative to pectoralis minor; brachial plexus cords are conceptual.',
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
        subtitle: 'Medial arm vascular course and fracture landmarks',
        stageRole: 'clinical_correlation',
        explanation:
          'Distal to teres major, the axillary artery becomes the brachial artery—descending along the medial aspect of the humerus toward the cubital fossa. Mid-shaft humeral fractures classically endanger the radial nerve in the posterior radial groove (conceptual correlation).',
        captionText:
          'Brachial artery descends medially along the humerus; posterior radial groove is a key trauma landmark.',
        narrationText:
          'Moving down the arm, the axillary artery continues as the brachial artery along the medial border of the humerus. Meanwhile, remember conceptually that the radial nerve spirals directly against the posterior mid-shaft of the humerus.',
        keyLearningPoint:
          'The brachial artery courses medially along the arm while the radial nerve spirals posteriorly.',
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
            detail: 'Posterior mid-shaft radial groove is a critical landmark for radial nerve vulnerability (conceptual).',
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
        subtitle: 'Distal forearm perfusion and checkpoint',
        stageRole: 'checkpoint',
        explanation:
          'In the cubital fossa distal to the elbow joint, the brachial artery bifurcates into the radial artery laterally (palpable at the wrist) and the ulnar artery medially, supplying the forearm compartments and palmar arches.',
        captionText:
          'Brachial artery bifurcates into radial (lateral) and ulnar (medial) arteries in the cubital fossa.',
        narrationText:
          'Finally, in the cubital fossa distal to the elbow, the brachial artery bifurcates into the lateral radial artery and medial ulnar artery. Complete the knowledge check below to finish this regional walkthrough.',
        keyLearningPoint:
          'Continuous arterial naming transitions: Subclavian → Axillary → Brachial → Radial & Ulnar.',
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
            detail: 'Descends laterally along the radius; accessible at the wrist for pulse palpation.',
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

// =========================================================================
// CLINICAL CASE → GUIDED 3D EXPLANATION ASSOCIATION REGISTRY
// =========================================================================

export type ClinicalExplainerAvailability =
  | 'guided_3d_available'
  | 'under_development'
  | 'requires_more_coverage';

export interface ClinicalCaseExplainerLink {
  status: ClinicalExplainerAvailability;
  presentationId?: string;
  label: string;
  detail: string;
}

const COVERAGE_NOTES_BY_CASE: Record<
  string,
  { status: 'under_development' | 'requires_more_coverage'; detail: string }
> = {
  'case-axillary-nerve-humerus': {
    status: 'requires_more_coverage',
    detail:
      'Humerus, scapula, and deltoid zone are available in 3D, but the axillary nerve itself is not individually meshed in BodyParts3D 4.0.',
  },
  'case-radial-nerve-spiral-groove': {
    status: 'requires_more_coverage',
    detail:
      'Humerus, triceps, and radius are available in 3D, but the radial nerve is not individually meshed in BodyParts3D 4.0.',
  },
  'case-phrenic-diaphragm-ventilation': {
    status: 'requires_more_coverage',
    detail:
      'Diaphragm, lungs, and cervical vertebrae are available in 3D, but the paired phrenic nerves are not individually meshed in BodyParts3D 4.0.',
  },
  'case-femoral-triangle-navel': {
    status: 'requires_more_coverage',
    detail:
      'Femoral nerve and inguinal ligament meshes are not individually segmented in BodyParts3D 4.0.',
  },
  'case-achilles-triceps-surae': {
    status: 'under_development',
    detail:
      'Gastrocnemius, soleus, and calcaneal tendon meshes exist in the atlas; a guided 3D presentation is planned.',
  },
  'case-left-renal-vein-aortomesenteric': {
    status: 'under_development',
    detail:
      'Kidney, renal vein, aorta, and IVC meshes exist in the atlas; a guided 3D presentation is planned.',
  },
  'case-spleen-left-ribs': {
    status: 'under_development',
    detail:
      'Spleen, stomach, pancreas, kidney, and rib meshes exist in the atlas; a guided 3D presentation is planned.',
  },
};

export function getClinicalCaseExplainerLink(
  clinicalCaseId: string,
): ClinicalCaseExplainerLink {
  const matched = BUILTIN_PRESENTATIONS.find(
    (p) => p.relatedClinicalCaseId === clinicalCaseId,
  );
  if (matched) {
    return {
      status: 'guided_3d_available',
      presentationId: matched.id,
      label: 'Guided 3D Explanation Available',
      detail: `${matched.steps.length}-stage interactive 3D walkthrough with presenter narration & local video export.`,
    };
  }

  const note = COVERAGE_NOTES_BY_CASE[clinicalCaseId];
  if (note) {
    return {
      status: note.status,
      label:
        note.status === 'requires_more_coverage'
          ? 'Requires More 3D Coverage'
          : 'Guided 3D Explainer Under Development',
      detail: note.detail,
    };
  }

  return {
    status: 'under_development',
    label: 'Clinical Case Available (Text & 3D Inspection)',
    detail:
      'Individual structures can be inspected in 3D; a guided multi-step presentation is not yet authored.',
  };
}
