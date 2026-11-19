import type { Atlas, SystemId } from '../anatomy';
import type { ProvenanceReviewStatus } from './provenance-registry';

/**
 * Surgical Anatomy Regional Dissection & Learning Registry
 *
 * Maps 10 core anatomical regions to real progressive 3D mesh dissection layers
 * resolved directly against BodyParts3D 4.0 meshes in public/models/atlas.json.
 *
 * Strictly educational — NOT a certified surgical simulator, surgical planning tool,
 * or substitute for supervised clinical/cadaveric training.
 */

export const SURGICAL_ANATOMY_SCHEMA_VERSION = 2;

export const SURGICAL_EDUCATION_DISCLAIMER =
  'Educational Reference Only: This module teaches regional anatomical layers, neurovascular relations, and landmarks for study. It is not a certified surgical simulator, intraoperative navigation system, or substitute for supervised clinical training.';

export interface AnatomicalVariationRecord {
  id: string;
  name: string;
  normalAnatomy: string;
  variantAnatomy: string;
  clinicalRelevance: string;
  sourceReference: string;
  has3DGeometry: boolean;
}

export type SurgicalLayerMappingMethod =
  | 'concept_id_verified'
  | 'pattern_plus_bounds'
  | 'conceptual_only';

export interface SurgicalDissectionLayerSpec {
  id: string;
  label: string;
  systems: SystemId[];
  /** Explicit FMA concept IDs that deterministically belong to this layer */
  explicitConceptIds?: string[];
  /** Anatomical structure name matchers (required for precision so broad bounds never sweep unrelated neighbors) */
  namePatterns?: RegExp[];
  /** Explicit exclusion matchers preventing cross-region anatomical bleed (e.g., teeth in neck, glutes in abdomen) */
  excludePatterns?: RegExp[];
  /** Expected anatomical structures documented for this layer */
  expectedStructures?: string[];
  mappingMethod?: SurgicalLayerMappingMethod;
  educationalNote: string;
  coverageStatus: 'real_meshes' | 'partial_meshes' | 'conceptual_only';
  missingAssetNote?: string;
}

export interface ResolvedSurgicalLayer extends SurgicalDissectionLayerSpec {
  partIds: string[];
  resolvedConceptIds: string[];
  excludedCount: number;
  unresolvedExpectedStructures: string[];
  mappingMethod: SurgicalLayerMappingMethod;
  reviewStatus: ProvenanceReviewStatus;
}

export interface SurgicalAnatomyRegion {
  id: string;
  title: string;
  anatomicalRegion: string;
  summary: string;
  boundaries: string[];
  superficialLayers: string[];
  deepLayers: string[];
  keyVessels: string[];
  keyNerves: string[];
  fascialPlanes: string[];
  criticalLandmarks: string[];
  documentedVariations: string[];
  variations: AnatomicalVariationRecord[];
  crossSectionNote: string;
  focusBounds: { min: [number, number, number]; max: [number, number, number] };
  recommendedViewDirection: [number, number, number];
  highlightSystems: SystemId[];
  dissectionLayers: SurgicalDissectionLayerSpec[];
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
      'Layered cranial organization from superficial facial/scalp musculature and calvarial bones through the tentorium cerebelli to cerebral hemispheres, deep nuclei, brainstem, and ventricles.',
    boundaries: ['Superior: Calvarial vertex', 'Inferior: Cranial base & tentorium cerebelli', 'Lateral: Temporal fossa & pterion'],
    superficialLayers: ['Superficial scalp & temporalis musculature', 'Frontal, parietal, temporal, and occipital cranial vault bones'],
    deepLayers: ['Tentorium cerebelli (dural partition)', 'Cerebral hemispheres & cortical gyri', 'Corpus callosum, thalamus & basal nuclei', 'Brainstem, cerebellum & ventricles'],
    keyVessels: ['Internal carotid arteries', 'Middle & anterior cerebral arteries', 'Basilar & vertebral arteries', 'Dural venous sinuses'],
    keyNerves: ['Optic nerve (CN II) & optic chiasm', 'Oculomotor (CN III) & trochlear (CN IV) nerves'],
    fascialPlanes: ['Galea aponeurotica (conceptual)', 'Periosteum / pericranium (conceptual)', 'Tentorium cerebelli (modeled)'],
    criticalLandmarks: ['Pterion (overlies middle meningeal artery)', 'Central sulcus (precentral motor vs postcentral sensory gyri)', 'Sella turcica & pituitary fossa'],
    documentedVariations: ['Circle of Willis communicating artery asymmetry or hypoplasia is frequently documented in anatomical literature.'],
    variations: [
      {
        id: 'var-willis-asymmetry',
        name: 'Circle of Willis Communicating Artery Asymmetry',
        normalAnatomy: 'Symmetric anterior and posterior communicating arteries completing the cerebral arterial circle.',
        variantAnatomy: 'Hypoplasia or absence of one posterior communicating artery or fetal-origin posterior cerebral artery.',
        clinicalRelevance: 'Alters collateral cross-flow potential between anterior and posterior intracranial circulations.',
        sourceReference: 'OpenStax A&P 2e & NCBI StatPearls Neuroanatomy, Circle of Willis',
        has3DGeometry: false,
      },
    ],
    crossSectionNote: 'Use Midsagittal (X) or Axial (Y) cutaway planes to inspect corpus callosum, thalamus, and ventricles.',
    focusBounds: { min: [-0.11, 1.50, -0.13], max: [0.11, 1.77, 0.13] },
    recommendedViewDirection: [0.45, 0.12, 1],
    highlightSystems: ['skeletal', 'muscular', 'nervous', 'arterial', 'venous'],
    dissectionLayers: [
      {
        id: 'cv-muscles',
        label: 'Scalp & Cranial Musculature (Conceptual)',
        systems: ['muscular'],
        namePatterns: [/temporalis|occipitofrontalis|frontalis|epicrani/i],
        excludePatterns: [/rectus|oblique|levator palpebrae|ciliary|tongue|lingual|pharyng|laryng|trapezius|sternocleidomastoid/i],
        expectedStructures: ['Temporalis', 'Occipitofrontalis'],
        mappingMethod: 'conceptual_only',
        educationalNote: 'Superficial scalp aponeurosis (galea) and temporalis overlie the calvaria; 3D mesh peeling begins at Layer 2 (Cranial Vault Bones).',
        coverageStatus: 'conceptual_only',
        missingAssetNote: 'Epicranial (occipitofrontalis) and temporalis muscles are not individually meshed in BodyParts3D 4.0.',
      },
      {
        id: 'cv-vault-bones',
        label: 'Cranial Vault & Cranial Base Bones',
        systems: ['skeletal'],
        namePatterns: [/frontal bone|parietal bone|temporal bone|occipital bone|sphenoid|ethmoid|calvaria|skull|zygomatic|nasal bone|maxilla|lacrimal bone/i],
        excludePatterns: [/tooth|teeth|gingiva|incisor|canine|premolar|molar|mandible|hyoid|vertebra|cervical/i],
        expectedStructures: ['Frontal bone', 'Parietal bone', 'Temporal bone', 'Occipital bone'],
        mappingMethod: 'pattern_plus_bounds',
        educationalNote: 'Remove cranial vault bones (frontal, parietal, temporal, occipital) to expose the intracranial cavity.',
        coverageStatus: 'real_meshes',
      },
      {
        id: 'cv-dura-vessels',
        label: 'Intracranial Vessels & Tentorium',
        systems: ['arterial', 'venous', 'connective'],
        namePatterns: [/cerebral|carotid|basilar|vertebral|meningeal|sinus|tentorium|dura|communicating|cerebellar|choroidal|ophthalmic|petrosal/i],
        excludePatterns: [/check ligament|trochlea|palpebrae|gingiva|tooth|dental|subclavian|brachial/i],
        expectedStructures: ['Cerebral arteries', 'Dural venous sinuses', 'Tentorium cerebelli'],
        mappingMethod: 'pattern_plus_bounds',
        educationalNote: 'Inspect intracranial arteries, veins, and tentorium cerebelli; arachnoid/pia mater are conceptual only.',
        coverageStatus: 'partial_meshes',
        missingAssetNote: 'Falx cerebri and arachnoid/pia mater sheets are not individually meshed in BodyParts3D 4.0.',
      },
      {
        id: 'cv-brain',
        label: 'Cerebral Hemispheres, Brainstem & Ventricles',
        systems: ['nervous', 'endocrine'],
        namePatterns: [/gyrus|lobe|cerebr|cerebell|brainstem|pons|medulla|midbrain|thalam|hypothalam|hippocamp|amygdala|caudate|putamen|pallidus|corpus callosum|ventricle|pituitary|pineal|fornix|optic/i],
        excludePatterns: [/ethmoidal|ciliary|lacrimal|infratrochlear|nasociliary|gingiva|dental/i],
        expectedStructures: ['Cerebral cortex', 'Cerebellum', 'Brainstem', 'Ventricles'],
        mappingMethod: 'pattern_plus_bounds',
        educationalNote: 'Exposed cerebral gyri, cerebellum, brainstem, pituitary, and ventricular system.',
        coverageStatus: 'real_meshes',
      },
    ],
    relatedConceptIds: ['FMA46565', 'FMA50801', 'FMA67944', 'FMA79876', 'FMA13889'],
    reviewStatus: 'source_reviewed',
    sourceReference: 'OpenStax Anatomy & Physiology 2e (Ch. 7 & 13) · NCBI StatPearls Neuroanatomy',
  },
  {
    id: 'cranial-base-sella',
    title: 'Cranial Base, Orbit & Sellar Region',
    anatomicalRegion: 'Anterior & Middle Cranial Fossae',
    summary:
      'Spatial relationship of the sphenoid sella turcica, pituitary gland, optic chiasm, extraocular orbit, and cranial base foramina.',
    boundaries: ['Anterior: Orbital roof & cribriform plate', 'Central: Sphenoid body & sella turcica', 'Posterior: Clivus & petrous temporal ridge'],
    superficialLayers: ['Frontal & zygomatic orbital rim', 'Orbital & periorbital musculature'],
    deepLayers: ['Sphenoid & ethmoid cranial base', 'Optic nerves, chiasm & tracts', 'Pituitary gland & cavernous arterial relations'],
    keyVessels: ['Internal carotid artery (cavernous & supraclinoid segments)', 'Ophthalmic artery', 'Basilar artery along clivus'],
    keyNerves: ['Optic nerve (CN II) & optic chiasm', 'Oculomotor (CN III) & trochlear (CN IV) nerves'],
    fascialPlanes: ['Periorbita (conceptual)', 'Diaphragma sellae (conceptual)'],
    criticalLandmarks: ['Sella turcica (hypophyseal fossa)', 'Optic canal', 'Superior orbital fissure'],
    documentedVariations: ['Sphenoid sinus pneumatization patterns (conchal, presellar, sellar) vary markedly across adults.'],
    variations: [
      {
        id: 'var-sphenoid-pneumatization',
        name: 'Sphenoid Sinus Pneumatization Type',
        normalAnatomy: 'Sellar-type pneumatization extending beneath and posterior to the hypophyseal fossa.',
        variantAnatomy: 'Conchal or presellar pneumatization with thicker intervening sphenoid bone.',
        clinicalRelevance: 'Directly governs skull-base bony thickness along transsphenoidal educational corridors.',
        sourceReference: 'NCBI StatPearls — Anatomy, Head and Neck, Sphenoid Sinus',
        has3DGeometry: false,
      },
    ],
    crossSectionNote: 'Midsagittal (X) cut clearly aligns the sphenoid body, pituitary gland, optic chiasm, and brainstem clivus.',
    focusBounds: { min: [-0.09, 1.54, -0.06], max: [0.09, 1.68, 0.11] },
    recommendedViewDirection: [0.55, 0.06, 0.85],
    highlightSystems: ['skeletal', 'sensory', 'nervous', 'endocrine', 'arterial'],
    dissectionLayers: [
      {
        id: 'cb-orbit-bone',
        label: 'Orbital & Cranial Base Bones',
        systems: ['skeletal'],
        namePatterns: [/frontal bone|sphenoid|ethmoid|zygomatic|maxilla|lacrimal|nasal|palatine|vomer|temporal bone|orbit/i],
        excludePatterns: [/tooth|teeth|gingiva|incisor|canine|premolar|molar|mandible/i],
        expectedStructures: ['Sphenoid bone', 'Ethmoid bone', 'Frontal bone', 'Zygomatic bone'],
        mappingMethod: 'pattern_plus_bounds',
        educationalNote: 'Peel anterior orbital and facial skeleton to inspect the orbital cone and sellar floor.',
        coverageStatus: 'real_meshes',
      },
      {
        id: 'cb-sensory',
        label: 'Eyeballs & Extraocular Apparatus',
        systems: ['sensory', 'muscular'],
        namePatterns: [/eyeball|eye|cornea|sclera|choroid|retina|lens|iris|ciliar|rectus|oblique|levator palpebrae|lacrimal|vitreous|anterior chamber|posterior chamber/i],
        excludePatterns: [/tooth|gingiva|masseter|temporalis|buccinator|orbicularis oris/i],
        expectedStructures: ['Eyeball', 'Extraocular rectus & oblique muscles'],
        mappingMethod: 'pattern_plus_bounds',
        educationalNote: 'Remove ocular globe and extraocular muscles to follow the optic nerve posteriorly.',
        coverageStatus: 'real_meshes',
      },
      {
        id: 'cb-sella-neuro',
        label: 'Optic Chiasm, Pituitary & Carotid Relations',
        systems: ['nervous', 'endocrine', 'arterial'],
        namePatterns: [/optic|pituitary|hypophys|carotid|ophthalmic|oculomotor|trochlear|abducens|trigeminal|cerebral|communicating|basilar|hypothalam/i],
        excludePatterns: [/dental|alveolar|lingual|buccal|gingiva/i],
        expectedStructures: ['Optic nerve / chiasm', 'Pituitary gland', 'Internal carotid artery'],
        mappingMethod: 'pattern_plus_bounds',
        educationalNote: 'Inspect optic chiasm directly superior to the pituitary fossa and adjacent internal carotid arteries.',
        coverageStatus: 'real_meshes',
      },
    ],
    relatedConceptIds: ['FMA13889', 'FMA50863', 'FMA46565'],
    reviewStatus: 'source_reviewed',
    sourceReference: 'OpenStax Anatomy & Physiology 2e (Ch. 7 & 17) · TA2 Cranial Base Nomenclature',
  },
  {
    id: 'neck-carotid-thyroid',
    title: 'Neck, Carotid Sheath & Thyroid Region',
    anatomicalRegion: 'Anterior & Lateral Cervical Triangles',
    summary:
      'Layered cervical anatomy from platysma and sternocleidomastoid through infrahyoid strap muscles to the thyroid gland, trachea, and carotid sheath neurovascular bundle.',
    boundaries: ['Superior: Inferior mandibular border', 'Inferior: Clavicle & suprasternal notch', 'Posterior: Cervical vertebral column'],
    superficialLayers: ['Sternocleidomastoid & superficial cervical muscles', 'Infrahyoid (strap) muscles'],
    deepLayers: ['Thyroid gland & laryngeal/tracheal cartilages', 'Common/internal carotid artery & internal jugular vein', 'Cervical spine & deep prevertebral musculature'],
    keyVessels: ['Common, internal & external carotid arteries', 'Internal & external jugular veins', 'Subclavian arteries & veins'],
    keyNerves: ['Vagus nerve (CN X, conceptual within carotid sheath)', 'Phrenic nerve (C3–C5 on anterior scalene)', 'Cervical plexus'],
    fascialPlanes: ['Investing layer of deep cervical fascia (conceptual)', 'Pretracheal fascia (conceptual)', 'Carotid sheath (conceptual)'],
    criticalLandmarks: ['Cricoid cartilage (C6 level: laryngeal-tracheal junction)', 'Carotid bifurcation (~C3–C4 level)', 'Suprasternal notch'],
    documentedVariations: ['Level of common carotid bifurcation varies between C2 and C5 vertebral levels; thyroid ima artery occurs in a minority of individuals.'],
    variations: [
      {
        id: 'var-carotid-bifurcation',
        name: 'Carotid Bifurcation Vertebral Level',
        normalAnatomy: 'Common carotid bifurcates near the superior border of the thyroid cartilage (~C3–C4).',
        variantAnatomy: 'High bifurcation near C2 or low bifurcation near C5–C6.',
        clinicalRelevance: 'Important landmark awareness in anterior cervical regional anatomy.',
        sourceReference: 'NCBI StatPearls — Anatomy, Head and Neck, Carotid Arteries',
        has3DGeometry: false,
      },
    ],
    crossSectionNote: 'Axial (Y) section at C6–C7 demonstrates trachea, esophagus, thyroid lobes, carotid vessels, and cervical vertebra.',
    focusBounds: { min: [-0.11, 1.38, -0.09], max: [0.11, 1.54, 0.09] },
    recommendedViewDirection: [0.32, 0.04, 1],
    highlightSystems: ['muscular', 'arterial', 'venous', 'endocrine', 'respiratory', 'skeletal'],
    dissectionLayers: [
      {
        id: 'nk-superficial-muscles',
        label: 'Sternocleidomastoid, Platysma & Strap Muscles',
        systems: ['muscular'],
        namePatterns: [/sternocleidomastoid|platysma|sternohyoid|sternothyroid|thyrohyoid|omohyoid|scalene|digastric|mylohyoid|stylohyoid|longus colli|longus capitis|splenius/i],
        excludePatterns: [/pectoralis|subclavius|supraspinatus|infraspinatus|deltoid|trapezius|serratus|intercostal/i],
        expectedStructures: ['Sternocleidomastoid', 'Infrahyoid strap muscles', 'Scalene muscles'],
        mappingMethod: 'pattern_plus_bounds',
        educationalNote: 'Peel sternocleidomastoid and anterior cervical musculature to expose the visceral neck.',
        coverageStatus: 'real_meshes',
      },
      {
        id: 'nk-vessels',
        label: 'Carotid & Jugular Neurovascular Columns',
        systems: ['arterial', 'venous'],
        namePatterns: [/carotid|jugular|thyroid artery|thyroid vein|vertebral artery|vertebral vein|subclavian|cervical artery|cervical vein|laryngeal artery|facial artery|lingual artery/i],
        excludePatterns: [/bronchial|intercostal|coronary|hepatic|pulmonary|brachial|axillary/i],
        expectedStructures: ['Common/internal carotid artery', 'Internal jugular vein', 'Vertebral artery'],
        mappingMethod: 'pattern_plus_bounds',
        educationalNote: 'Examine internal jugular vein lateral to the common/internal carotid artery.',
        coverageStatus: 'real_meshes',
      },
      {
        id: 'nk-viscera',
        label: 'Thyroid, Larynx, Trachea & Cervical Spine',
        systems: ['endocrine', 'respiratory', 'skeletal'],
        namePatterns: [/thyroid|laryn|cricoid|epiglott|arytenoid|trachea|hyoid|cervical vertebra|atlas|axis|first cervical|second cervical|third cervical|fourth cervical|fifth cervical|sixth cervical|seventh cervical/i],
        excludePatterns: [/tooth|teeth|gingiva|incisor|canine|premolar|molar|mandible|clavicle|rib|scapula|bronch|lung/i],
        expectedStructures: ['Thyroid gland', 'Larynx & cricoid cartilage', 'Trachea', 'Cervical vertebrae'],
        mappingMethod: 'pattern_plus_bounds',
        educationalNote: 'Inspect thyroid gland draped across upper tracheal rings anterior to the cervical vertebrae.',
        coverageStatus: 'real_meshes',
      },
    ],
    relatedConceptIds: ['FMA7394', 'FMA9915', 'FMA9603'],
    reviewStatus: 'source_reviewed',
    sourceReference: 'OpenStax Anatomy & Physiology 2e (Ch. 11 & 22) · NCBI StatPearls Neck Fascia',
  },
  {
    id: 'thorax-mediastinum',
    title: 'Thoracic Wall & Middle Mediastinum',
    anatomicalRegion: 'Thorax',
    summary:
      'Anterior chest wall musculature and osteocartilaginous rib cage protecting the pleural lungs, pericardial heart chambers, and great vessels.',
    boundaries: ['Superior: Thoracic inlet (T1)', 'Inferior: Thoracic diaphragm', 'Anterior/Lateral: Sternum, costal cartilages & ribs 1–12'],
    superficialLayers: ['Pectoralis major & minor', 'Sternum, costal cartilages, and ribs 1–12'],
    deepLayers: ['Right and left lungs & main bronchi', 'Heart chambers & ascending aorta', 'Superior & inferior vena cava, pulmonary trunk', 'Diaphragm inferiorly'],
    keyVessels: ['Ascending aorta & aortic arch', 'Left & right coronary arteries', 'Superior & inferior vena cava', 'Pulmonary arteries & veins'],
    keyNerves: ['Phrenic nerves (C3–C5, anterior to lung hilum)', 'Vagus nerves (CN X, posterior to lung hilum)'],
    fascialPlanes: ['Endothoracic fascia (conceptual)', 'Fibrous pericardium (conceptual)', 'Parietal and visceral pleura (conceptual)'],
    criticalLandmarks: ['Sternal angle (T4–T5 level: tracheal carina & aortic arch)', 'Left 5th intercostal space midclavicular line (cardiac apex)'],
    documentedVariations: ['Aortic arch branching variants (e.g., bovine-type common origin of brachiocephalic and left common carotid) are well documented.'],
    variations: [
      {
        id: 'var-aortic-arch',
        name: 'Aortic Arch Branching Variant',
        normalAnatomy: 'Three separate branches: brachiocephalic trunk, left common carotid, and left subclavian arteries.',
        variantAnatomy: 'Common origin of brachiocephalic trunk and left common carotid artery, or direct left vertebral origin from arch.',
        clinicalRelevance: 'Key anatomical consideration when tracing superior mediastinal vascular branches.',
        sourceReference: 'NCBI StatPearls — Anatomy, Thorax, Aortic Arch',
        has3DGeometry: false,
      },
    ],
    crossSectionNote: 'Axial (Y) section at T4–T5 demonstrates great vessels; T8 level demonstrates four-chamber cardiac orientation.',
    focusBounds: { min: [-0.20, 1.15, -0.14], max: [0.20, 1.48, 0.15] },
    recommendedViewDirection: [0.25, 0.08, 1],
    highlightSystems: ['muscular', 'skeletal', 'respiratory', 'cardiac', 'arterial', 'venous'],
    dissectionLayers: [
      {
        id: 'th-muscles',
        label: 'Pectoral & Anterior Thoracic Wall Musculature',
        systems: ['muscular'],
        namePatterns: [/pectoralis|intercostal|transversus thoracis|serratus anterior|subclavius|sternalis/i],
        excludePatterns: [/latissimus|trapezius|rhomboid|erector|multifidus|subscapularis|supraspinatus|infraspinatus|teres|deltoid|biceps|triceps|gluteus/i],
        expectedStructures: ['Pectoralis major', 'Pectoralis minor', 'Intercostal muscles'],
        mappingMethod: 'pattern_plus_bounds',
        educationalNote: 'Peel pectoralis major, pectoralis minor, and intercostal musculature.',
        coverageStatus: 'real_meshes',
      },
      {
        id: 'th-ribcage',
        label: 'Sternum, Ribs & Costal Cartilages',
        systems: ['skeletal', 'connective'],
        namePatterns: [/sternum|manubrium|xiphoid|rib|costal cartilage|sternocostal|costochondral/i],
        excludePatterns: [/subscapularis|levator scapulae|scapula|clavicle|cricoid|hyo-epiglottic|cuneiform|laryn|vertebra|humerus/i],
        expectedStructures: ['Sternum', 'Ribs', 'Costal cartilages'],
        mappingMethod: 'pattern_plus_bounds',
        educationalNote: 'Remove anterior thoracic cage to expose bilateral lungs and mediastinum.',
        coverageStatus: 'real_meshes',
      },
      {
        id: 'th-lungs',
        label: 'Lungs & Tracheobronchial Tree',
        systems: ['respiratory'],
        namePatterns: [/lung|lobe of.*lung|bronch|trachea|pulmonary/i],
        excludePatterns: [/laryn|cricoid|epiglott|nasal|pharyn/i],
        expectedStructures: ['Right & left lungs', 'Main & segmental bronchi', 'Trachea'],
        mappingMethod: 'pattern_plus_bounds',
        educationalNote: 'Retract/remove pulmonary lobes to reveal the pericardial heart and great vessel roots.',
        coverageStatus: 'real_meshes',
      },
      {
        id: 'th-heart-vessels',
        label: 'Heart Chambers & Thoracic Great Vessels',
        systems: ['cardiac', 'arterial', 'venous'],
        namePatterns: [/heart|atrium|ventricle|valve|coronary|aorta|aortic|pulmonary trunk|pulmonary artery|pulmonary vein|vena cava|brachiocephalic|azygos|thoracic|pericard|cardiac/i],
        excludePatterns: [/celiac|hepatic|portal|hepatovenous|mesenteric|renal|splenic|gastric|iliac|femoral|abdominal/i],
        expectedStructures: ['Heart chambers', 'Ascending aorta & arch', 'Pulmonary trunk', 'Venae cavae'],
        mappingMethod: 'pattern_plus_bounds',
        educationalNote: 'Exposed four-chamber heart, ascending aorta, pulmonary trunk, and venae cavae.',
        coverageStatus: 'real_meshes',
      },
    ],
    relatedConceptIds: ['FMA7088', 'FMA7309', 'FMA7310', 'FMA3768', 'FMA13295'],
    reviewStatus: 'source_reviewed',
    sourceReference: 'OpenStax Anatomy & Physiology 2e (Ch. 19 & 22) · NCBI StatPearls Thorax Anatomy',
  },
  {
    id: 'heart-coronary',
    title: 'Heart, Coronary Circulation & Great Vessels',
    anatomicalRegion: 'Middle Mediastinum',
    summary:
      'Focused inspection of the four cardiac chambers, pulmonary trunk, ascending aorta, venae cavae, and epicardial coronary arterial/venous relations.',
    boundaries: ['Anterior: Sternum & costal cartilages 3–6', 'Lateral: Mediastinal pleurae', 'Posterior: Esophagus & descending thoracic aorta'],
    superficialLayers: ['Anterior thoracic wall (sternum & ribs)', 'Anterior pulmonary borders'],
    deepLayers: ['Right ventricle & right atrium (anteriorly)', 'Left ventricle & left atrium (posteriorly/left)', 'Ascending aorta, pulmonary trunk & coronary arteries'],
    keyVessels: ['Left main, LAD & circumflex coronary arteries', 'Right coronary artery (RCA)', 'Coronary sinus & cardiac veins', 'Ascending aorta & pulmonary trunk'],
    keyNerves: ['Cardiac autonomic plexus (conceptual)', 'Left recurrent laryngeal nerve looping under aortic arch (conceptual)'],
    fascialPlanes: ['Fibrous & serous pericardium (conceptual; oblique & transverse pericardial sinuses)'],
    criticalLandmarks: ['Anterior interventricular sulcus (LAD & great cardiac vein)', 'Coronary (atrioventricular) sulcus', 'Left 5th intercostal space (apex)'],
    documentedVariations: ['Coronary dominance (right-dominant, left-dominant, or codominant) depends on which artery supplies the posterior interventricular (PDA) branch.'],
    variations: [
      {
        id: 'var-coronary-dominance',
        name: 'Coronary Arterial Dominance',
        normalAnatomy: 'Right coronary artery most commonly gives rise to the posterior interventricular (PDA) artery.',
        variantAnatomy: 'Left-dominant (PDA from left circumflex) or codominant supply.',
        clinicalRelevance: 'Determines which coronary territory supplies the posterior third of the interventricular septum and AV node.',
        sourceReference: 'OpenStax A&P 2e (Ch. 19) · NCBI StatPearls Coronary Arteries',
        has3DGeometry: false,
      },
    ],
    crossSectionNote: 'Axial (Y) cut through T7–T8 highlights right ventricle anteriorly and left atrium posteriorly adjacent to the esophagus.',
    focusBounds: { min: [-0.11, 1.22, -0.09], max: [0.11, 1.42, 0.12] },
    recommendedViewDirection: [0.3, 0.08, 1],
    highlightSystems: ['cardiac', 'arterial', 'venous', 'skeletal', 'respiratory'],
    dissectionLayers: [
      {
        id: 'hc-cage',
        label: 'Overlying Sternum, Anterior Ribs & Lungs',
        systems: ['skeletal', 'muscular', 'respiratory'],
        namePatterns: [/sternum|manubrium|xiphoid|rib|costal|pectoralis|intercostal|lung|bronch/i],
        excludePatterns: [/vertebra|scapula|clavicle|trapezius|latissimus|subscapularis|erector/i],
        expectedStructures: ['Sternum & ribs', 'Pectoral/intercostal wall', 'Anterior lung lobes'],
        mappingMethod: 'pattern_plus_bounds',
        educationalNote: 'Remove overlying chest wall and anterior lung margins to expose the cardiac silhouette.',
        coverageStatus: 'real_meshes',
      },
      {
        id: 'hc-great-vessels',
        label: 'Great Vessels & Coronary Tree',
        systems: ['arterial', 'venous'],
        namePatterns: [/aorta|aortic|coronary|cardiac vein|pulmonary trunk|pulmonary artery|pulmonary vein|vena cava|brachiocephalic|azygos/i],
        excludePatterns: [/hepatic|hepatovenous|portal|celiac|mesenteric|renal|splenic|gastric|abdominal|bronchial|esophageal/i],
        expectedStructures: ['Ascending aorta & arch', 'Coronary arteries & cardiac veins', 'Pulmonary trunk', 'Venae cavae'],
        mappingMethod: 'pattern_plus_bounds',
        educationalNote: 'Inspect ascending aorta, pulmonary trunk, venae cavae, and coronary vessels.',
        coverageStatus: 'real_meshes',
      },
      {
        id: 'hc-chambers',
        label: 'Cardiac Chambers & Valve Apparatus',
        systems: ['cardiac'],
        namePatterns: [/atrium|ventricle|valve|cusp|leaflet|myocard|heart|septum|papillary|chordae|auricle/i],
        expectedStructures: ['Right & left ventricles', 'Right & left atria', 'Cardiac valves'],
        mappingMethod: 'pattern_plus_bounds',
        educationalNote: 'Inspect individual BodyParts3D cardiac chambers and valve rings.',
        coverageStatus: 'real_meshes',
      },
    ],
    relatedConceptIds: ['FMA7088', 'FMA3736', 'FMA8612', 'FMA4720'],
    reviewStatus: 'source_reviewed',
    sourceReference: 'OpenStax Anatomy & Physiology 2e (Ch. 19) · NCBI StatPearls Heart Anatomy',
  },
  {
    id: 'abdomen-portal',
    title: 'Abdominal Viscera & Porta Hepatis',
    anatomicalRegion: 'Supracolic Abdomen',
    summary:
      'Anterior abdominal wall layers overlying the liver, gallbladder, stomach, duodenal C-loop, pancreas, spleen, and hepatic portal venous confluence.',
    boundaries: ['Superior: Diaphragm', 'Anterior: Rectus abdominis & lateral obliques', 'Posterior: Retroperitoneal pancreas, aorta & IVC'],
    superficialLayers: ['Anterior abdominal wall musculature (rectus abdominis, obliques)'],
    deepLayers: ['Liver & gallbladder (RUQ)', 'Stomach & spleen (LUQ)', 'Pancreas & duodenum (retroperitoneal C-loop)', 'Hepatic portal vein, celiac trunk & SMA'],
    keyVessels: ['Celiac trunk & hepatic artery proper', 'Hepatic portal vein', 'Superior mesenteric artery & vein'],
    keyNerves: ['Celiac autonomic plexus (conceptual)', 'Anterior & posterior vagal trunks (conceptual)'],
    fascialPlanes: ['Rectus sheath & linea alba', 'Transversalis fascia (conceptual)', 'Hepatoduodenal ligament (conceptual)'],
    criticalLandmarks: ['Portal triad (portal vein posterior, hepatic artery left, common bile duct right)', 'Transpyloric plane (L1 vertebral level)'],
    documentedVariations: ['Replaced or accessory right hepatic artery arising from the superior mesenteric artery is a classic hepatobiliary variation.'],
    variations: [
      {
        id: 'var-replaced-rha',
        name: 'Replaced / Accessory Right Hepatic Artery',
        normalAnatomy: 'Right hepatic artery arises from the hepatic artery proper (celiac trunk).',
        variantAnatomy: 'Right hepatic artery arises from the superior mesenteric artery and ascends posterior to the portal vein.',
        clinicalRelevance: 'Critical arterial relationship when studying porta hepatis and pancreaticoduodenal anatomy.',
        sourceReference: 'NCBI StatPearls — Anatomy, Abdomen and Pelvis, Hepatic Artery',
        has3DGeometry: false,
      },
    ],
    crossSectionNote: 'Axial (Y) section at L1 highlights liver, stomach, pancreas, spleen, abdominal aorta, IVC, and bilateral kidneys.',
    focusBounds: { min: [-0.19, 0.92, -0.14], max: [0.19, 1.24, 0.15] },
    recommendedViewDirection: [0.18, 0.05, 1],
    highlightSystems: ['muscular', 'digestive', 'arterial', 'venous', 'lymphatic'],
    dissectionLayers: [
      {
        id: 'ab-wall',
        label: 'Anterior Abdominal Wall Muscles',
        systems: ['muscular'],
        namePatterns: [/rectus abdominis|external oblique|internal oblique|transversus abdominis|pyramidalis|abdominal/i],
        excludePatterns: [/gluteus|iliacus|piriformis|psoas|gemellus|obturator|quadratus lumborum|latissimus|erector|pectoralis|thigh|femoral/i],
        expectedStructures: ['Rectus abdominis', 'External & internal obliques', 'Transversus abdominis'],
        mappingMethod: 'pattern_plus_bounds',
        educationalNote: 'Peel rectus abdominis, external/internal obliques, and transversus abdominis.',
        coverageStatus: 'real_meshes',
      },
      {
        id: 'ab-viscera',
        label: 'Liver, Stomach, Intestines & Spleen',
        systems: ['digestive', 'lymphatic'],
        namePatterns: [/liver|hepatic|biliary|gallbladder|cystic|stomach|gastric|duodenum|jejunum|ileum|colon|cecum|appendix|pancreas|pancreatic|spleen/i],
        excludePatterns: [/esophagus|rectum|anal|tooth|gingiva|tongue|salivary/i],
        expectedStructures: ['Liver & gallbladder', 'Stomach', 'Pancreas & duodenum', 'Spleen'],
        mappingMethod: 'pattern_plus_bounds',
        educationalNote: 'Remove anterior GI viscera to uncover retroperitoneal vessels and portal confluence.',
        coverageStatus: 'real_meshes',
      },
      {
        id: 'ab-portal-vessels',
        label: 'Portal Vein, Celiac Trunk, Aorta & IVC',
        systems: ['arterial', 'venous'],
        namePatterns: [/portal|hepatic|hepatovenous|celiac|mesenteric|splenic|gastric|gastroduodenal|pancreatic|abdominal aorta|inferior vena cava/i],
        excludePatterns: [/pulmonary|coronary|brachial|femoral|iliac|intercostal|epigastric|subcostal/i],
        expectedStructures: ['Hepatic portal vein', 'Celiac trunk', 'Superior mesenteric artery', 'Abdominal aorta & IVC'],
        mappingMethod: 'pattern_plus_bounds',
        educationalNote: 'Inspect hepatic portal vein, superior mesenteric vessels, abdominal aorta, and IVC.',
        coverageStatus: 'real_meshes',
      },
    ],
    relatedConceptIds: ['FMA7197', 'FMA7148', 'FMA7198', 'FMA7196', 'FMA50735'],
    reviewStatus: 'source_reviewed',
    sourceReference: 'OpenStax Anatomy & Physiology 2e (Ch. 23) · NCBI StatPearls Hepatobiliary Anatomy',
  },
  {
    id: 'retroperitoneum-renal',
    title: 'Retroperitoneum & Renal Hilum',
    anatomicalRegion: 'Posterior Abdominal Wall',
    summary:
      'Retroperitoneal relations of the kidneys, suprarenal glands, renal arteries and veins, ureters, abdominal aorta, inferior vena cava, and psoas major.',
    boundaries: ['Anterior: Posterior parietal peritoneum (conceptual)', 'Posterior: Psoas major, quadratus lumborum & lumbar spine', 'Superior: T12 / Diaphragm'],
    superficialLayers: ['Anterior abdominal wall & intraperitoneal GI viscera'],
    deepLayers: ['Bilateral kidneys, adrenal glands & ureters', 'Renal veins (anterior), renal arteries (middle), renal pelvis (posterior)', 'Abdominal aorta, IVC & lumbar spine'],
    keyVessels: ['Left & right renal arteries', 'Left renal vein (crosses anterior to aorta beneath SMA)', 'Abdominal aorta & IVC'],
    keyNerves: ['Lumbar plexus branches (iliohypogastric, ilioinguinal, genitofemoral — conceptual)', 'Sympathetic trunks'],
    fascialPlanes: ['Renal (Gerota) fascia (conceptual)', 'Perirenal & pararenal fat pads (conceptual)'],
    criticalLandmarks: ['Renal hilum anterior-to-posterior order: Vein–Artery–Pelvis (V-A-P)', 'Aortomesenteric angle (left renal vein passage)'],
    documentedVariations: ['Accessory (supernumerary) polar renal arteries arising directly from the abdominal aorta are common anatomical variants.'],
    variations: [
      {
        id: 'var-accessory-renal',
        name: 'Accessory Polar Renal Arteries',
        normalAnatomy: 'Single main renal artery entering each renal hilum from the abdominal aorta.',
        variantAnatomy: 'Additional superior or inferior polar artery entering the renal capsule directly.',
        clinicalRelevance: 'Inferior polar arteries can cross anterior to the ureteropelvic junction.',
        sourceReference: 'NCBI StatPearls — Anatomy, Abdomen and Pelvis, Renal Arteries',
        has3DGeometry: false,
      },
    ],
    crossSectionNote: 'Axial (Y) section at L1–L2 clearly demonstrates the left renal vein crossing between the aorta and SMA.',
    focusBounds: { min: [-0.17, 0.90, -0.14], max: [0.17, 1.15, 0.12] },
    recommendedViewDirection: [0.15, 0.05, 1],
    highlightSystems: ['digestive', 'urinary', 'endocrine', 'arterial', 'venous', 'skeletal'],
    dissectionLayers: [
      {
        id: 'rp-gi',
        label: 'Overlying Abdominal Wall & Intraperitoneal GI Tract',
        systems: ['muscular', 'digestive'],
        namePatterns: [/rectus abdominis|oblique|transversus abdominis|stomach|colon|jejunum|ileum|duodenum|pancreas|liver|gallbladder|cecum|appendix/i],
        excludePatterns: [/gluteus|gemellus|piriformis|obturator|iliacus|psoas|thigh|adductor|rectus femoris/i],
        expectedStructures: ['Anterior abdominal wall', 'Colon & small intestine', 'Stomach & pancreas'],
        mappingMethod: 'pattern_plus_bounds',
        educationalNote: 'Remove anterior abdominal wall and intraperitoneal GI organs to expose the retroperitoneum.',
        coverageStatus: 'real_meshes',
      },
      {
        id: 'rp-renal-vessels',
        label: 'Renal Vessels, Abdominal Aorta & IVC',
        systems: ['arterial', 'venous'],
        namePatterns: [/renal|suprarenal|adrenal|abdominal aorta|inferior vena cava|gonadal|testicular|lumbar artery|lumbar vein|superior mesenteric/i],
        excludePatterns: [/epigastric|subcostal|musculophrenic|intercostal|hepatic|portal|pulmonary|femoral/i],
        expectedStructures: ['Renal arteries & veins', 'Abdominal aorta', 'Inferior vena cava'],
        mappingMethod: 'pattern_plus_bounds',
        educationalNote: 'Inspect left renal vein crossing anterior to the aorta and right renal artery passing posterior to IVC.',
        coverageStatus: 'real_meshes',
      },
      {
        id: 'rp-kidneys',
        label: 'Kidneys, Adrenals, Ureters & Lumbar Spine',
        systems: ['urinary', 'endocrine', 'skeletal'],
        namePatterns: [/kidney|adrenal|suprarenal|ureter|lumbar vertebra|twelfth thoracic|first lumbar|second lumbar|third lumbar|fourth lumbar|fifth lumbar/i],
        excludePatterns: [/bladder|hip bone|ilium|ischium|pubis|sacrum|femur|rib/i],
        expectedStructures: ['Left & right kidneys', 'Adrenal glands', 'Ureters', 'Lumbar vertebrae'],
        mappingMethod: 'pattern_plus_bounds',
        educationalNote: 'Inspect bilateral kidneys, ureters descending over psoas, and lumbar vertebral column.',
        coverageStatus: 'real_meshes',
      },
    ],
    relatedConceptIds: ['FMA7203', 'FMA14751', 'FMA14334', 'FMA9704'],
    reviewStatus: 'source_reviewed',
    sourceReference: 'OpenStax Anatomy & Physiology 2e (Ch. 25) · NCBI StatPearls Retroperitoneum',
  },
  {
    id: 'pelvis-perineum',
    title: 'Pelvic Cavity & Perineal Relations (Male Ref)',
    anatomicalRegion: 'True Pelvis & Pelvic Floor',
    summary:
      'Bony pelvic ring, internal iliac neurovascular branches, urinary bladder, rectum, and adult male reproductive viscera (female pelvic pack not bundled).',
    boundaries: ['Anterior: Pubic symphysis', 'Posterior: Sacrum & coccyx', 'Inferior: Pelvic diaphragm (levator ani)'],
    superficialLayers: ['Anterior pelvic ring & lower abdominal musculature'],
    deepLayers: ['Urinary bladder & distal ureters', 'Rectum & sigmoid colon', 'Internal/external iliac vessels & male pelvic viscera'],
    keyVessels: ['Common, internal & external iliac arteries', 'Internal & external iliac veins'],
    keyNerves: ['Sacral plexus & sciatic nerve roots', 'Pudendal nerve (conceptual)'],
    fascialPlanes: ['Endopelvic fascia (conceptual)', 'Rectovesical septum (conceptual)'],
    criticalLandmarks: ['Pelvic brim (linea terminalis)', 'Ischial spine (pudendal landmark)', 'Pubic symphysis'],
    documentedVariations: ['Obturator artery arising from the inferior epigastric artery (corona mortis anastomosis) is a recognized pelvic vascular variant.'],
    variations: [
      {
        id: 'var-corona-mortis',
        name: 'Aberrant Obturator Artery (Corona Mortis)',
        normalAnatomy: 'Obturator artery arises from the anterior division of the internal iliac artery.',
        variantAnatomy: 'Obturator artery arises from the inferior epigastric or external iliac artery crossing the superior pubic ramus.',
        clinicalRelevance: 'Key vascular relationship along the superior pubic ramus during pelvic regional study.',
        sourceReference: 'NCBI StatPearls — Anatomy, Abdomen and Pelvis, Obturator Artery',
        has3DGeometry: false,
      },
    ],
    crossSectionNote: 'Midsagittal (X) cutaway aligns pubic symphysis, urinary bladder, prostate, rectum, and sacrum.',
    focusBounds: { min: [-0.18, 0.72, -0.14], max: [0.18, 0.96, 0.14] },
    recommendedViewDirection: [0.42, 0.14, 0.9],
    highlightSystems: ['skeletal', 'urinary', 'reproductive', 'digestive', 'arterial', 'venous'],
    dissectionLayers: [
      {
        id: 'pl-muscles',
        label: 'Pelvic Floor & Deep Pelvic Wall Musculature',
        systems: ['muscular'],
        namePatterns: [/levator ani|coccygeus|obturator internus|piriformis|pelvic|perineal|sphincter|bulbospongiosus|ischiocavernosus|iliacus|psoas/i],
        excludePatterns: [/adductor|gemellus|quadriceps|biceps femoris|sartorius|gracilis|pectineus|tensor fasciae|vastus/i],
        expectedStructures: ['Levator ani', 'Obturator internus', 'Piriformis'],
        mappingMethod: 'pattern_plus_bounds',
        educationalNote: 'Peel pelvic wall and pelvic diaphragm muscles surrounding the true pelvis.',
        coverageStatus: 'real_meshes',
      },
      {
        id: 'pl-bone',
        label: 'Os Coxae, Sacrum & Pelvic Ring',
        systems: ['skeletal'],
        namePatterns: [/hip bone|ilium|ischium|pubis|pubic|sacrum|coccyx|pelvis/i],
        excludePatterns: [/iliotibial|femur|lumbar|tibia/i],
        expectedStructures: ['Right & left hip bones (os coxae)', 'Sacrum & coccyx'],
        mappingMethod: 'pattern_plus_bounds',
        educationalNote: 'Remove bony pelvic ring to inspect deep pelvic viscera and iliac vessels.',
        coverageStatus: 'real_meshes',
      },
      {
        id: 'pl-viscera',
        label: 'Bladder, Rectum, Male Viscera & Iliac Vessels',
        systems: ['urinary', 'reproductive', 'digestive', 'arterial', 'venous'],
        namePatterns: [/bladder|prostate|seminal|vas deferens|ductus deferens|rectum|sigmoid|iliac|pudendal|vesical|obturator artery|obturator vein|gluteal artery|gluteal vein|penis|urethra/i],
        excludePatterns: [/femoral|tibial|calcaneal|perforating|saphenous|popliteal|fibular|circumflex femoral/i],
        expectedStructures: ['Urinary bladder', 'Rectum', 'Male pelvic viscera', 'Internal & external iliac vessels'],
        mappingMethod: 'pattern_plus_bounds',
        educationalNote: 'Inspect adult male pelvic organs and iliac branches (female pelvic organs not bundled in BP3D 4.0).',
        coverageStatus: 'partial_meshes',
        missingAssetNote: 'Adult male reference only; female pelvic reproductive anatomy requires a separate licensed pack.',
      },
    ],
    relatedConceptIds: ['FMA15900', 'FMA9704', 'FMA14544'],
    reviewStatus: 'source_reviewed',
    sourceReference: 'OpenStax Anatomy & Physiology 2e (Ch. 27) · NCBI StatPearls Pelvic Floor',
  },
  {
    id: 'shoulder-arm-elbow',
    title: 'Shoulder, Axilla, Arm Compartments & Elbow',
    anatomicalRegion: 'Upper Limb',
    summary:
      'Anterior flexor vs posterior extensor compartments of the arm, deltoid/rotator cuff envelope, and neurovascular relations around the surgical neck and cubital fossa.',
    boundaries: ['Proximal: Glenohumeral joint & axilla', 'Mid-arm: Medial & lateral intermuscular septa (conceptual)', 'Distal: Cubital fossa'],
    superficialLayers: ['Deltoid & pectoralis major', 'Biceps brachii (anterior) & triceps brachii (posterior)'],
    deepLayers: ['Brachialis, coracobrachialis & rotator cuff', 'Brachial artery, radial/ulnar nerves', 'Humerus, radius & ulna'],
    keyVessels: ['Axillary & brachial arteries', 'Profunda brachii artery', 'Cephalic & basilic veins'],
    keyNerves: ['Axillary nerve (surgical neck)', 'Radial nerve (spiral groove)', 'Median & ulnar nerves'],
    fascialPlanes: ['Brachial deep fascia (conceptual)', 'Bicipital aponeurosis (lacertus fibrosus)'],
    criticalLandmarks: ['Surgical neck of humerus (axillary nerve)', 'Spiral groove (radial nerve)', 'Cubital fossa (TAN: Tendon–Artery–Nerve lateral to medial)'],
    documentedVariations: ['High bifurcation of the brachial artery into radial and ulnar arteries in the upper arm is a classic upper-limb variant.'],
    variations: [
      {
        id: 'var-high-brachial',
        name: 'High Brachial Artery Bifurcation',
        normalAnatomy: 'Brachial artery divides into radial and ulnar arteries in the cubital fossa near the neck of the radius.',
        variantAnatomy: 'Division occurs proximally in the mid or upper arm, creating a superficial radial or ulnar artery.',
        clinicalRelevance: 'Important arterial relationship across the anterior arm and cubital fossa.',
        sourceReference: 'NCBI StatPearls — Anatomy, Shoulder and Upper Limb, Brachial Artery',
        has3DGeometry: false,
      },
    ],
    crossSectionNote: 'Axial (Y) mid-humeral section cleanly separates anterior flexor and posterior extensor compartments.',
    focusBounds: { min: [-0.40, 0.90, -0.15], max: [-0.04, 1.50, 0.15] },
    recommendedViewDirection: [-0.35, 0.06, 1],
    highlightSystems: ['muscular', 'skeletal', 'arterial', 'venous', 'nervous'],
    dissectionLayers: [
      {
        id: 'ul-muscles',
        label: 'Deltoid, Rotator Cuff, Biceps, Triceps & Forearm Muscles',
        systems: ['muscular'],
        namePatterns: [/deltoid|biceps brachii|triceps brachii|brachialis|coracobrachialis|supraspinatus|infraspinatus|teres|subscapularis|brachioradialis|pronator|supinator|flexor carpi|extensor carpi|anconeus/i],
        excludePatterns: [/gluteus|gemellus|iliacus|obturator|piriformis|psoas|pectineus|adductor|vastus|biceps femoris|gastrocnemius/i],
        expectedStructures: ['Deltoid', 'Biceps brachii', 'Triceps brachii', 'Brachialis', 'Rotator cuff'],
        mappingMethod: 'pattern_plus_bounds',
        educationalNote: 'Peel superficial upper-limb musculature to expose the brachial neurovascular bundle.',
        coverageStatus: 'real_meshes',
      },
      {
        id: 'ul-neurovascular',
        label: 'Axillary/Brachial Vessels & Upper-Limb Nerves',
        systems: ['arterial', 'venous', 'nervous'],
        namePatterns: [/axillary|brachial|radial|ulnar|cephalic|basilic|subclavian|profunda brachii|circumflex humeral|median nerve|musculocutaneous|interosseous/i],
        excludePatterns: [/hepatic|hepatovenous|portal|mesenteric|celiac|renal|splenic|gastric|femoral|iliac|tibial|carotid/i],
        expectedStructures: ['Axillary & brachial arteries', 'Cephalic & basilic veins', 'Median, radial & ulnar nerves'],
        mappingMethod: 'pattern_plus_bounds',
        educationalNote: 'Inspect brachial artery, basilic/cephalic veins, and upper-limb nerve trunks.',
        coverageStatus: 'real_meshes',
      },
      {
        id: 'ul-skeleton',
        label: 'Scapula, Clavicle, Humerus, Radius & Ulna',
        systems: ['skeletal', 'connective'],
        namePatterns: [/scapula|clavicle|humerus|radius|ulna|acromioclavicular|coracoclavicular|glenohumeral|forearm|elbow|carpal|humeral/i],
        excludePatterns: [/tooth|teeth|premolar|molar|incisor|gingiva|levator ani|tensor fasciae latae|subscapularis|levator scapulae|rib|vertebra|femur/i],
        expectedStructures: ['Scapula & clavicle', 'Humerus', 'Radius & ulna'],
        mappingMethod: 'pattern_plus_bounds',
        educationalNote: 'Inspect glenohumeral and humeroulnar bony landmarks and joint capsules.',
        coverageStatus: 'real_meshes',
      },
    ],
    relatedConceptIds: ['FMA13303', 'FMA34676', 'FMA37683', 'FMA37692', 'FMA23463', 'FMA23466'],
    reviewStatus: 'source_reviewed',
    sourceReference: 'OpenStax Anatomy & Physiology 2e (Ch. 8 & 11) · NCBI StatPearls Upper Limb',
  },
  {
    id: 'femoral-lower-limb',
    title: 'Femoral Triangle & Lower-Limb Compartments',
    anatomicalRegion: 'Thigh, Knee & Leg',
    summary:
      'Anterior femoral triangle neurovascular order (NAVEL lateral-to-medial), quadriceps/hamstring/adductor compartments, popliteal fossa, and posterior calf triceps surae.',
    boundaries: ['Superior: Inguinal ligament', 'Lateral: Sartorius', 'Medial: Adductor longus'],
    superficialLayers: ['Sartorius, rectus femoris, tensor fasciae latae & gastrocnemius'],
    deepLayers: ['Vastus muscles, adductor group & soleus', 'Femoral & popliteal neurovascular bundles', 'Femur, patella, tibia & fibula'],
    keyVessels: ['Femoral & profunda femoris arteries', 'Femoral & great saphenous veins', 'Popliteal artery & vein'],
    keyNerves: ['Femoral nerve', 'Sciatic, tibial & common fibular nerves'],
    fascialPlanes: ['Fascia lata & iliotibial tract', 'Femoral sheath (conceptual)', 'Adductor (Hunter) canal (conceptual)'],
    criticalLandmarks: ['Femoral triangle order lateral-to-medial: Nerve–Artery–Vein (N-A-V)', 'Mid-inguinal point (femoral pulse)', 'Calcaneal (Achilles) tendon'],
    documentedVariations: ['Profunda femoris origin distance below the inguinal ligament and circumflex femoral origins vary across individuals.'],
    variations: [
      {
        id: 'var-sciatic-piriformis',
        name: 'Sciatic Nerve Relationship to Piriformis',
        normalAnatomy: 'Sciatic nerve exits the greater sciatic foramen entirely inferior to the piriformis muscle.',
        variantAnatomy: 'Common fibular division pierces through or passes superior to the piriformis.',
        clinicalRelevance: 'Important gluteal regional neuro-muscular relationship.',
        sourceReference: 'NCBI StatPearls — Anatomy, Bony Pelvis and Lower Limb, Sciatic Nerve',
        has3DGeometry: false,
      },
    ],
    crossSectionNote: 'Axial (Y) mid-thigh section contrasts anterior extensor, medial adductor, and posterior flexor compartments around the femur.',
    focusBounds: { min: [-0.26, 0.25, -0.16], max: [0.26, 0.88, 0.16] },
    recommendedViewDirection: [0.22, 0.04, 1],
    highlightSystems: ['muscular', 'arterial', 'venous', 'nervous', 'skeletal'],
    dissectionLayers: [
      {
        id: 'll-muscles',
        label: 'Thigh & Leg Musculature (Quadriceps, Sartorius, Hamstrings, Calf)',
        systems: ['muscular'],
        namePatterns: [/rectus femoris|vastus|sartorius|gracilis|adductor|pectineus|biceps femoris|semitendinosus|semimembranosus|gastrocnemius|soleus|tibialis|fibularis|peroneus|popliteus|plantaris|tensor fasciae latae/i],
        excludePatterns: [/gluteus|piriformis|levator ani|obturator internus|deltoid|biceps brachii/i],
        expectedStructures: ['Quadriceps femoris', 'Sartorius & adductors', 'Hamstrings', 'Gastrocnemius & soleus'],
        mappingMethod: 'pattern_plus_bounds',
        educationalNote: 'Peel thigh and leg muscles to uncover the femoral/popliteal vessels and sciatic nerve.',
        coverageStatus: 'real_meshes',
      },
      {
        id: 'll-neurovascular',
        label: 'Femoral/Popliteal Vessels & Sciatic/Tibial Nerves',
        systems: ['arterial', 'venous', 'nervous'],
        namePatterns: [/femoral|popliteal|tibial|fibular|peroneal|saphenous|sciatic|genicular|circumflex femoral|profunda femoris|sural|obturator nerve/i],
        excludePatterns: [/penis|pudendal|prostate|vesical|rectal|iliac|renal|hepatic|brachial/i],
        expectedStructures: ['Femoral & popliteal arteries', 'Femoral & great saphenous veins', 'Sciatic & femoral nerves'],
        mappingMethod: 'pattern_plus_bounds',
        educationalNote: 'Inspect femoral artery, femoral/saphenous veins, and sciatic/tibial nerve paths.',
        coverageStatus: 'real_meshes',
      },
      {
        id: 'll-skeleton',
        label: 'Femur, Patella, Tibia & Fibula',
        systems: ['skeletal', 'connective'],
        namePatterns: [/femur|patella|tibia|fibula|cruciate|collateral ligament|meniscus|patellar ligament|interosseous membrane of.*leg|calcaneal tendon/i],
        excludePatterns: [/tibialis|fibularis|iliotibial|hip bone|sacrum|humerus|radius|ulna/i],
        expectedStructures: ['Femur', 'Patella', 'Tibia & fibula'],
        mappingMethod: 'pattern_plus_bounds',
        educationalNote: 'Inspect lower-limb weight-bearing skeleton and knee/ankle ligamentous structures.',
        coverageStatus: 'real_meshes',
      },
    ],
    relatedConceptIds: ['FMA9611', 'FMA24476', 'FMA45950', 'FMA22542'],
    reviewStatus: 'source_reviewed',
    sourceReference: 'OpenStax Anatomy & Physiology 2e (Ch. 8 & 11) · NCBI StatPearls Femoral Triangle',
  },
];

/**
 * Resolves each surgical dissection layer to actual verified BodyParts3D mesh partIds
 * using strict priority rules:
 *   1. Explicit verified FMA concept IDs (if declared)
 *   2. Explicit anatomical namePatterns + system filter + exclusion filters inside region bounds
 *   3. Full per-layer audit metadata (resolvedConceptIds, excludedCount, unresolvedExpectedStructures)
 */
export function resolveSurgicalRegionLayers(
  region: SurgicalAnatomyRegion,
  atlas: Atlas,
): ResolvedSurgicalLayer[] {
  const [bMin, bMax] = [region.focusBounds.min, region.focusBounds.max];
  const pad = 0.025;
  const regionParts = atlas.parts.filter((p) => {
    const cx = (p.bounds[0][0] + p.bounds[1][0]) * 0.5;
    const cy = (p.bounds[0][1] + p.bounds[1][1]) * 0.5;
    const cz = (p.bounds[0][2] + p.bounds[1][2]) * 0.5;
    return (
      cx >= bMin[0] - pad &&
      cx <= bMax[0] + pad &&
      cy >= bMin[1] - pad &&
      cy <= bMax[1] + pad &&
      cz >= bMin[2] - pad &&
      cz <= bMax[2] + pad
    );
  });

  const assigned = new Set<string>();
  return region.dissectionLayers.map((layer) => {
    const sysSet = new Set(layer.systems);
    const explicitConcepts = new Set(layer.explicitConceptIds ?? []);
    let excludedCount = 0;

    const matched = regionParts.filter((p) => {
      if (assigned.has(p.id)) return false;

      // Priority 1: explicit concept ID match
      if (explicitConcepts.size > 0 && explicitConcepts.has(p.conceptId)) {
        return true;
      }

      if (!sysSet.has(p.system)) return false;

      // Priority 2: explicit cross-region bleed exclusion
      if (layer.excludePatterns && layer.excludePatterns.some((rx) => rx.test(p.name))) {
        excludedCount++;
        return false;
      }

      // Priority 3: anatomical name pattern match
      if (layer.namePatterns && layer.namePatterns.length > 0) {
        return layer.namePatterns.some((rx) => rx.test(p.name));
      }

      return true;
    });

    for (const m of matched) assigned.add(m.id);

    const resolvedConceptIds = Array.from(new Set(matched.map((m) => m.conceptId)));
    const expected = layer.expectedStructures ?? [];
    const unresolvedExpectedStructures = expected.filter((exp) => {
      const tokens = exp
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length >= 4 && !['left', 'right', 'main', 'wall', 'anterior', 'posterior'].includes(t));
      if (tokens.length === 0) return false;
      return !matched.some((m) => {
        const lower = m.name.toLowerCase();
        return tokens.some((tok) => lower.includes(tok));
      });
    });

    const mappingMethod: SurgicalLayerMappingMethod =
      layer.mappingMethod ??
      (explicitConcepts.size > 0
        ? 'concept_id_verified'
        : matched.length > 0
          ? 'pattern_plus_bounds'
          : 'conceptual_only');

    return {
      ...layer,
      partIds: matched.map((m) => m.id),
      resolvedConceptIds,
      excludedCount,
      unresolvedExpectedStructures,
      mappingMethod,
      reviewStatus: region.reviewStatus,
    };
  });
}

export function validateSurgicalAnatomyRegistry(atlas?: Atlas): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!SURGICAL_EDUCATION_DISCLAIMER.includes('Educational Reference Only')) {
    errors.push('SURGICAL_EDUCATION_DISCLAIMER must explicitly state Educational Reference Only.');
  }
  const seen = new Set<string>();
  for (const r of SURGICAL_ANATOMY_REGIONS) {
    if (seen.has(r.id)) errors.push(`Duplicate surgical region id: ${r.id}`);
    seen.add(r.id);
    if (r.dissectionLayers.length < 3) errors.push(`Region ${r.id}: requires >= 3 progressive dissection layers`);
    if (r.superficialLayers.length === 0 || r.deepLayers.length === 0) {
      errors.push(`Region ${r.id}: must define both superficial and deep anatomical layers`);
    }
    if (r.keyVessels.length === 0 || r.keyNerves.length === 0) {
      errors.push(`Region ${r.id}: must list key vessels and nerves`);
    }
    if (!r.sourceReference.trim()) {
      errors.push(`Region ${r.id}: missing sourceReference`);
    }
    if (r.reviewStatus === 'expert_verified') {
      errors.push(`Region ${r.id}: cannot mark expert_verified without documented human expert review`);
    }
    if (atlas) {
      const resolved = resolveSurgicalRegionLayers(r, atlas);
      for (const layer of resolved) {
        if (layer.coverageStatus !== 'conceptual_only' && layer.partIds.length === 0) {
          errors.push(`Region ${r.id} layer ${layer.id}: resolved 0 meshes despite coverageStatus=${layer.coverageStatus}`);
        }
      }
    }
  }
  return { valid: errors.length === 0, errors };
}
