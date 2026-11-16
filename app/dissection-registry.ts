import type { Atlas, Part, SystemId } from './anatomy';

export interface StructureCapabilitySpec {
  id: string;
  label: string;
  supportedModes: Array<'hide' | 'isolate' | 'xray' | 'explode-group' | 'dissect-deeper' | 'clip'>;
  groupId?: string;
  deeperTargetIds?: string[];
  missingChildAssets?: string[];
}

export interface DepthLayerSpec {
  id: string;
  label: string;
  depthOrder: number;
  description: string;
  /** Exact part IDs resolved dynamically/explicitly in this layer */
  partIds: string[];
  /** What becomes newly exposed once this layer is removed or faded */
  exposesSummary: string;
  /** Honest note if an anatomical layer (e.g. arachnoid, pleura) is absent in BP3D */
  missingAssetNote?: string;
}

export interface DepthRegionSequence {
  id: string;
  title: string;
  subtitle: string;
  recommendedView: 'three-quarter' | 'front' | 'left' | 'right';
  focusBounds: { min: [number, number, number]; max: [number, number, number] };
  requiredSystems: SystemId[];
  layers: DepthLayerSpec[];
  missingAssets: string[];
}

export interface AnatomicalGroupSpec {
  id: string;
  label: string;
  regionLabel: string;
  /** True geometric center of the assembled group */
  anchorCenter: [number, number, number];
  /** Explicit or pattern-matched part IDs */
  partIds: string[];
  /** Stage 1 translation vector (meters) extracting deep groups clear of surrounding walls */
  extractionVector: [number, number, number];
  /** Stage 2 radial separation distance (meters) around the extracted center */
  explodeRadius: number;
  /** Optional directional bias vector added during Stage 2 radial separation */
  biasVector?: [number, number, number];
  maxDistance: number;
  /** Overlying anatomical systems gently X-Rayed while this group is extracted & exploded */
  overlyingFadeSystems?: Partial<Record<SystemId, number>>;
  /** Bounding box enclosing origin + extracted cluster for automatic 3/4 camera framing */
  extractedFocusBounds: { min: [number, number, number]; max: [number, number, number] };
}

export type AnimationSupportStatus = 'supported_rigid' | 'requires_rig' | 'requires_asset';

export interface RigidPartMotionSpec {
  partId: string;
  pivot: [number, number, number];
  /** Unit axis of rotation */
  axis: [number, number, number];
  /** Peak angle in radians at curve value = 1 */
  maxAngleRad: number;
  /** Peak linear translation in meters at curve value = 1 */
  maxTranslation?: [number, number, number];
}

export interface AnatomicalAnimationSpec {
  id: string;
  title: string;
  region: string;
  category: 'joint-kinematic' | 'respiratory-cage' | 'cranial-dissection' | 'organ-motion';
  status: AnimationSupportStatus;
  durationSec: number;
  defaultLoop: boolean;
  description: string;
  involvedPartIds: string[];
  /** Procedural rigid-body joint/bone motions (strictly honest rigid transforms) */
  rigidMotions: RigidPartMotionSpec[];
  /** Honest engineering note for pending GLB rig / morph targets */
  rigRequirementNote?: string;
  focusBounds?: { min: [number, number, number]; max: [number, number, number] };
}

export interface DissectionRegistry {
  regions: DepthRegionSequence[];
  groups: AnatomicalGroupSpec[];
  animations: AnatomicalAnimationSpec[];
  partToGroupId: Map<string, string>;
}

const HEAD_SUPERFICIAL_PART_IDS = ['FJ2813', 'FJ2812', 'FJ2814'];

const CRANIAL_VAULT_PART_IDS = [
  'FJ3200', // Frontal bone
  'FJ3274', // Left parietal bone
  'FJ3380', // Right parietal bone
  'FJ3309', // Occipital bone
  'FJ3281', // Left temporal bone
  'FJ3386', // Right temporal bone
];

const CRANIAL_BASE_AND_FACIAL_PART_IDS = [
  'FJ3394', // Sphenoid bone
  'FJ3199', // Ethmoid
  'FJ3289', // Mandible
  'FJ3269', // Left maxilla
  'FJ3375', // Right maxilla
  'FJ3287', // Left zygomatic bone
  'FJ3392', // Right zygomatic bone
  'FJ3272', // Left nasal bone
  'FJ3378', // Right nasal bone
  'FJ3265', // Left lacrimal bone
  'FJ3371', // Right lacrimal bone
  'FJ3273', // Left palatine bone
  'FJ3379', // Right palatine bone
  'FJ3395', // Vomer
  'FJ3263', // Left inferior nasal concha
  'FJ3369', // Right inferior nasal concha
  'FJ2772', // Hyoid bone (muscle/connective group ref)
  'FJ3201', // Hyoid bone (skeletal)
];

const DURAL_PARTITION_PART_IDS = ['FJ1843']; // Tentorium cerebelli

const CORTICAL_LOBE_PART_IDS = [
  'FJ1833', 'FJ1834', 'FJ1787', 'FJ1788', 'FJ1744', 'FJ1745', // Frontal gyri
  'FJ1800', 'FJ1801', 'FJ1797', 'FJ1798', // Precentral & Postcentral gyri
  'FJ1835', 'FJ1836', 'FJ1732', 'FJ1733', 'FJ1841', 'FJ1842', // Parietal, angular, supramarginal
  'FJ1746', 'FJ1747', 'FJ1789', 'FJ1790', 'FJ1837', 'FJ1838', 'FJ1839', 'FJ1840', // Temporal gyri
  'FJ1791', 'FJ1792', // Occipital lobes
  'FJ1748', 'FJ1749', // Insula
  'FJ1739', 'FJ1740', 'FJ1783', 'FJ1784', 'FJ1785', 'FJ1786', 'FJ1793', 'FJ1794', // Cingulate, fusiform, parahippocampal, orbital
];

const DEEP_BRAIN_NUCLEI_PART_IDS = [
  'FJ1742', // Corpus callosum
  'FJ1758', 'FJ1806', // Cerebral white matter
  'FJ1750', 'FJ1751', // Internal capsule
  'FJ1756', 'FJ1804', // Fornix
  'FJ1734', 'FJ1799', // Anterior & Posterior commissure
  'FJ1782', 'FJ1827', // Thalamus
  'FJ1760', 'FJ1808', // Hypothalamus
  'FJ1754', 'FJ1802', // Caudate nucleus
  'FJ1776', 'FJ1823', // Putamen
  'FJ1757', 'FJ1805', // Globus pallidus
  'FJ1759', 'FJ1807', // Hippocampus
  'FJ1753', 'FJ1829', // Amygdala
  'FJ1796', // Pituitary gland
  'FJ1795', // Pineal body
];

const BRAINSTEM_CEREBELLUM_VENTRICLE_PART_IDS = [
  'FJ1770', 'FJ1817', // Midbrain
  'FJ1775', 'FJ1822', // Pons
  'FJ1769', 'FJ1831', // Medulla oblongata
  'FJ1781', 'FJ1830', // Cerebellum
  'FJ1767', 'FJ1814', // Lateral ventricles
  'FJ1730', // Third ventricle
  'FJ1731', // Fourth ventricle
  'FJ1738', // Cerebral aqueduct
  'FJ1755', 'FJ1803', // Choroid plexus
];

const ORBIT_AND_EYE_PART_IDS = [
  'FJ1289', 'FJ1340', // Cornea
  'FJ1297', 'FJ1348', // Iris
  'FJ1305', 'FJ1356', // Lens
  'FJ1317', 'FJ1368', // Sclera
  'FJ1285', 'FJ1286', 'FJ1336', 'FJ1337', // Choroid
  'FJ1316', 'FJ1367', // Retina
  'FJ1331', 'FJ1382', // Vitreous body
  'FJ1772', 'FJ1819', 'FJ1313', 'FJ1364', // Optic nerves
  'FJ1771', 'FJ1818', // Optic chiasm
  'FJ1293', 'FJ1321', 'FJ1344', 'FJ1372', // Oculomotor nerves
  'FJ1330', 'FJ1381', // Trochlear nerves
];

function validIds(partMap: Map<string, Part>, ids: string[]): string[] {
  return ids.filter((id) => partMap.has(id));
}

function matchParts(atlas: Atlas, predicate: (p: Part) => boolean): string[] {
  return atlas.parts.filter(predicate).map((p) => p.id);
}

export function buildDissectionRegistry(atlas: Atlas): DissectionRegistry {
  const partMap = new Map(atlas.parts.map((p) => [p.id, p]));

  const toothAndGingivaIds = matchParts(
    atlas,
    (p) =>
      p.system === 'skeletal' &&
      /tooth|gingiva/i.test(p.name) &&
      (p.bounds[0][1] + p.bounds[1][1]) / 2 >= 1.49,
  );

  const cranialBaseAndFacial = validIds(partMap, [
    ...CRANIAL_BASE_AND_FACIAL_PART_IDS,
    ...toothAndGingivaIds,
  ]);

  const headVesselsIds = matchParts(
    atlas,
    (p) =>
      (p.system === 'arterial' || p.system === 'venous') &&
      (p.bounds[0][1] + p.bounds[1][1]) / 2 >= 1.54,
  );

  // Thoracic wall & mediastinal layers
  const thoracicMuscles = matchParts(
    atlas,
    (p) =>
      p.system === 'muscular' &&
      /pectoralis major|pectoralis minor/i.test(p.name),
  );
  const thoracicCage = matchParts(
    atlas,
    (p) =>
      p.system === 'skeletal' &&
      (/rib$/i.test(p.name) || /sternum|manubrium|xiphoid|clavicle/i.test(p.name)),
  );
  const thoracicGreatVesselsAirways = matchParts(
    atlas,
    (p) =>
      (p.system === 'respiratory' && /trachea|bronch/i.test(p.name)) ||
      p.id === 'FJ3131' || // Diaphragm
      p.id === 'FJ2966' || // Pulmonary trunk
      /pulmonary artery|pulmonary vein|descending thoracic aorta|ascending aorta|arch of aorta|superior vena cava/i.test(
        p.name,
      ),
  );
  const heartPartsConcept = atlas.concepts.find((c) => c.id === 'FMA7088');
  const heartParts = validIds(partMap, heartPartsConcept?.elements ?? []);

  // Upper limb (left)
  const leftShoulderMuscles = matchParts(
    atlas,
    (p) =>
      p.system === 'muscular' &&
      /left (deltoid|biceps|triceps|brachialis|coracobrachialis)|part of left (deltoid|pectoralis)/i.test(
        p.name,
      ),
  );
  const leftForearmMuscles = matchParts(
    atlas,
    (p) =>
      p.system === 'muscular' &&
      (p.bounds[0][0] + p.bounds[1][0]) / 2 >= 0.16 &&
      (p.bounds[0][1] + p.bounds[1][1]) / 2 >= 0.78 &&
      (p.bounds[0][1] + p.bounds[1][1]) / 2 <= 1.15,
  );
  const leftArmBones = matchParts(
    atlas,
    (p) =>
      p.system === 'skeletal' &&
      (/left (clavicle|scapula|humerus|radius|ulna)/i.test(p.name) ||
        ((p.bounds[0][0] + p.bounds[1][0]) / 2 >= 0.16 &&
          (p.bounds[0][1] + p.bounds[1][1]) / 2 >= 0.65 &&
          (p.bounds[0][1] + p.bounds[1][1]) / 2 <= 1.13)),
  );
  const leftArmBelowElbowBones = matchParts(
    atlas,
    (p) =>
      p.system === 'skeletal' &&
      (p.bounds[0][0] + p.bounds[1][0]) / 2 >= 0.16 &&
      (p.bounds[0][1] + p.bounds[1][1]) / 2 >= 0.65 &&
      (p.bounds[0][1] + p.bounds[1][1]) / 2 <= 1.135 &&
      !/humerus/i.test(p.name),
  );

  const allHeadRegions: DepthRegionSequence = {
    id: 'head-skull-neuro',
    title: 'Skull & Intracranial Dissection',
    subtitle: 'Progressive cranial vault, dural partition, cerebral cortex, and deep nuclei reveal',
    recommendedView: 'three-quarter',
    focusBounds: { min: [-0.11, 1.48, -0.14], max: [0.11, 1.74, 0.12] },
    requiredSystems: ['skeletal', 'nervous', 'sensory', 'arterial', 'venous', 'endocrine', 'cardiac'],
    layers: [
      {
        id: 'head-superficial',
        label: '1. Superficial Scalp & Reference Surface',
        depthOrder: 1,
        description: 'Hair of head, eyebrows, and lips overlying the skull.',
        partIds: validIds(partMap, HEAD_SUPERFICIAL_PART_IDS),
        exposesSummary: 'Reveals frontal, parietal, nasal, maxillary, and mandibular contours.',
        missingAssetNote: 'Facial expression & mastication muscles (frontalis, temporalis, masseter) are not separately modeled in BodyParts3D.',
      },
      {
        id: 'cranial-vault',
        label: '2. Cranial Vault (Calvaria)',
        depthOrder: 2,
        description: 'Frontal bone, bilateral parietal bones, occipital bone, and bilateral temporal bones.',
        partIds: validIds(partMap, CRANIAL_VAULT_PART_IDS),
        exposesSummary: 'Exposes the cerebral hemispheres, cortical vessels, and tentorium cerebelli.',
        missingAssetNote: 'Outer convexity dura mater, arachnoid mater, pia mater, and falx cerebri are not modeled as separate surface shells.',
      },
      {
        id: 'facial-and-cranial-base',
        label: '3. Facial Skeleton, Mandible & Skull Base',
        depthOrder: 3,
        description: 'Sphenoid, ethmoid, maxillae, zygomatic bones, nasal bones, mandible, teeth, and hyoid.',
        partIds: cranialBaseAndFacial,
        exposesSummary: 'Clears the anterior & middle cranial fossae, eyeball globes, and optic nerves (CN II).',
      },
      {
        id: 'tentorium-and-cortex',
        label: '4. Tentorium Cerebelli & Cerebral Cortex',
        depthOrder: 4,
        description: 'Dural tentorium cerebelli and outer frontal, parietal, temporal, occipital, and insular gyri.',
        partIds: validIds(partMap, [...DURAL_PARTITION_PART_IDS, ...CORTICAL_LOBE_PART_IDS]),
        exposesSummary: 'Exposes the corpus callosum, cerebral white matter, thalamus, basal ganglia, and Circle of Willis.',
      },
      {
        id: 'deep-white-and-nuclei',
        label: '5. White Matter, Thalamus & Limbic Nuclei',
        depthOrder: 5,
        description: 'Corpus callosum, internal capsule, thalamus, hypothalamus, caudate, putamen, hippocampus, pituitary & pineal glands.',
        partIds: validIds(partMap, DEEP_BRAIN_NUCLEI_PART_IDS),
        exposesSummary: 'Isolates the brainstem (midbrain, pons, medulla), cerebellum, ventricles, and orbital nerves.',
      },
      {
        id: 'brainstem-ventricles-orbit',
        label: '6. Brainstem, Ventricles & Orbital Nerves',
        depthOrder: 6,
        description: 'Midbrain, pons, medulla oblongata, cerebellum, ventricular system, eyeballs, and cranial nerves II–IV.',
        partIds: validIds(partMap, [
          ...BRAINSTEM_CEREBELLUM_VENTRICLE_PART_IDS,
          ...ORBIT_AND_EYE_PART_IDS,
          ...headVesselsIds,
        ]),
        exposesSummary: 'Deepest intracranial core reached.',
        missingAssetNote: 'Cranial nerves I, V2/V3, VI–XII and middle-ear ossicles (malleus, incus, stapes) are absent in this dataset.',
      },
    ],
    missingAssets: [
      'Cranial convexity dura mater, arachnoid mater, pia mater, and falx cerebri',
      'Muscles of mastication (temporalis, masseter) & superficial facial expression muscles',
      'Cranial nerves I, V2/V3, VI, VII, VIII, IX, X, XI, XII (only CN II, III, IV, and V1 twigs present)',
      'Middle & inner ear ossicles (malleus, incus, stapes, bony cochlea)',
    ],
  };

  const thoraxRegion: DepthRegionSequence = {
    id: 'thorax-cardiac-mediastinum',
    title: 'Thoracic Wall & Mediastinum',
    subtitle: 'Anterior chest wall musculature, sternum & rib cage to bronchial tree and cardiac chambers',
    recommendedView: 'front',
    focusBounds: { min: [-0.20, 1.05, -0.15], max: [0.20, 1.48, 0.14] },
    requiredSystems: ['muscular', 'skeletal', 'respiratory', 'cardiac', 'arterial', 'venous'],
    layers: [
      {
        id: 'thorax-pectoral',
        label: '1. Pectoral Musculature',
        depthOrder: 1,
        description: 'Clavicular, sternocostal, and abdominal heads of pectoralis major & pectoralis minor.',
        partIds: thoracicMuscles,
        exposesSummary: 'Reveals sternum, clavicles, costal margin, and anterior rib shafts.',
      },
      {
        id: 'thorax-cage',
        label: '2. Sternum, Clavicles & Rib Cage',
        depthOrder: 2,
        description: 'Manubrium, sternal body, xiphoid process, clavicles, and 24 articulated ribs.',
        partIds: thoracicCage,
        exposesSummary: 'Exposes the tracheobronchial tree, great vessels, diaphragm, and heart.',
        missingAssetNote: 'Costal cartilages, parietal pleura, and lung parenchyma lobes are not separately modeled in BodyParts3D.',
      },
      {
        id: 'thorax-airways-vessels',
        label: '3. Airways, Great Vessels & Diaphragm',
        depthOrder: 3,
        description: 'Trachea, segmental bronchial trees, pulmonary trunk/vessels, thoracic aorta, and diaphragm.',
        partIds: thoracicGreatVesselsAirways,
        exposesSummary: 'Isolates the four cardiac chambers, valves, papillary muscles, and coronary vessels.',
      },
      {
        id: 'thorax-heart-core',
        label: '4. Cardiac Chambers & Valves',
        depthOrder: 4,
        description: 'Atrial & ventricular myocardium, chamber cavities, mitral/tricuspid/aortic/pulmonary valves.',
        partIds: heartParts,
        exposesSummary: 'Deepest thoracic core reached.',
        missingAssetNote: 'Fibrous & serous pericardial sacs are absent.',
      },
    ],
    missingAssets: [
      'Spongy lung parenchyma lobes & visceral/parietal pleura',
      'Fibrous & serous pericardium',
      'Costal cartilage bridges between anterior ribs and sternum',
    ],
  };

  const upperLimbRegion: DepthRegionSequence = {
    id: 'upper-limb-left',
    title: 'Left Upper Limb & Elbow',
    subtitle: 'Shoulder & arm musculature down to humerus, radius, ulna, and hand skeleton',
    recommendedView: 'three-quarter',
    focusBounds: { min: [0.06, 0.64, -0.09], max: [0.32, 1.46, 0.08] },
    requiredSystems: ['muscular', 'skeletal', 'arterial', 'venous'],
    layers: [
      {
        id: 'arm-superficial',
        label: '1. Shoulder & Arm Muscles',
        depthOrder: 1,
        description: 'Deltoid heads, biceps brachii, triceps brachii, and brachial musculature.',
        partIds: leftShoulderMuscles,
        exposesSummary: 'Exposes the clavicle, scapula, humerus, and proximal forearm flexors.',
      },
      {
        id: 'forearm-muscles',
        label: '2. Forearm Compartments',
        depthOrder: 2,
        description: 'Superficial and deep forearm flexor and extensor bellies.',
        partIds: leftForearmMuscles,
        exposesSummary: 'Exposes radius, ulna, and carpal/metacarpal joints.',
      },
      {
        id: 'arm-skeleton',
        label: '3. Upper Limb Osteology',
        depthOrder: 3,
        description: 'Clavicle, scapula, humerus, radius, ulna, carpals, metacarpals, and phalanges.',
        partIds: leftArmBones,
        exposesSummary: 'Deep osteological core exposed.',
      },
    ],
    missingAssets: [
      'Glenohumeral and elbow articular capsules & synovial membranes',
    ],
  };

  const groups: AnatomicalGroupSpec[] = [
    {
      id: 'cranial-vault',
      label: 'Cranial Vault Bones',
      regionLabel: 'Head & Skull',
      anchorCenter: [-0.001, 1.634, -0.02],
      partIds: validIds(partMap, CRANIAL_VAULT_PART_IDS),
      extractionVector: [0, 0.12, 0.02],
      explodeRadius: 0.125,
      biasVector: [0, 0.025, 0],
      maxDistance: 0.22,
      overlyingFadeSystems: { muscular: 0.36 },
      extractedFocusBounds: { min: [-0.15, 1.54, -0.16], max: [0.15, 1.88, 0.16] },
    },
    {
      id: 'facial-skeleton',
      label: 'Facial Bones & Mandible',
      regionLabel: 'Head & Skull',
      anchorCenter: [-0.001, 1.563, 0.04],
      partIds: cranialBaseAndFacial,
      extractionVector: [0, -0.01, 0.23],
      explodeRadius: 0.095,
      biasVector: [0, -0.01, 0.015],
      maxDistance: 0.2,
      overlyingFadeSystems: { muscular: 0.34 },
      extractedFocusBounds: { min: [-0.13, 1.44, 0.0], max: [0.13, 1.68, 0.36] },
    },
    {
      id: 'intracranial-brain',
      label: 'Brain & Deep Nuclei',
      regionLabel: 'Head & Skull',
      anchorCenter: [-0.001, 1.626, -0.02],
      partIds: validIds(partMap, [
        ...DURAL_PARTITION_PART_IDS,
        ...CORTICAL_LOBE_PART_IDS,
        ...DEEP_BRAIN_NUCLEI_PART_IDS,
        ...BRAINSTEM_CEREBELLUM_VENTRICLE_PART_IDS,
      ]),
      extractionVector: [0, 0.04, 0.3],
      explodeRadius: 0.105,
      biasVector: [0, 0.01, 0.015],
      maxDistance: 0.16,
      overlyingFadeSystems: { skeletal: 0.28, muscular: 0.32 },
      extractedFocusBounds: { min: [-0.14, 1.5, -0.04], max: [0.14, 1.8, 0.42] },
    },
    {
      id: 'ocular-orbit',
      label: 'Orbital & Eye Apparatus',
      regionLabel: 'Special Senses',
      anchorCenter: [-0.001, 1.603, 0.019],
      partIds: validIds(partMap, ORBIT_AND_EYE_PART_IDS),
      extractionVector: [0, 0, 0.22],
      explodeRadius: 0.068,
      biasVector: [0, 0, 0.015],
      maxDistance: 0.14,
      overlyingFadeSystems: { skeletal: 0.32, muscular: 0.34 },
      extractedFocusBounds: { min: [-0.11, 1.54, 0.0], max: [0.11, 1.68, 0.32] },
    },
    {
      id: 'thoracic-cage',
      label: 'Thoracic Cage & Sternum',
      regionLabel: 'Thorax',
      anchorCenter: [-0.001, 1.267, 0.009],
      partIds: thoracicCage,
      extractionVector: [0, 0.02, 0.28],
      explodeRadius: 0.14,
      biasVector: [0, 0.01, 0.03],
      maxDistance: 0.26,
      overlyingFadeSystems: { muscular: 0.32 },
      extractedFocusBounds: { min: [-0.22, 1.06, 0.0], max: [0.22, 1.5, 0.48] },
    },
    {
      id: 'heart-chambers',
      label: 'Heart Chambers & Valves',
      regionLabel: 'Thorax',
      anchorCenter: [0.022, 1.305, 0.023],
      partIds: heartParts,
      extractionVector: [0, 0.01, 0.25],
      explodeRadius: 0.085,
      biasVector: [0, 0, 0.02],
      maxDistance: 0.14,
      overlyingFadeSystems: { muscular: 0.3, skeletal: 0.34, respiratory: 0.42 },
      extractedFocusBounds: { min: [-0.08, 1.2, 0.0], max: [0.14, 1.42, 0.38] },
    },
    {
      id: 'left-upper-limb',
      label: 'Left Upper Limb Bones',
      regionLabel: 'Upper Limb',
      anchorCenter: [0.166, 1.082, -0.005],
      partIds: leftArmBones,
      extractionVector: [0.24, 0, 0.05],
      explodeRadius: 0.12,
      biasVector: [0.025, 0, 0],
      maxDistance: 0.24,
      overlyingFadeSystems: { muscular: 0.34 },
      extractedFocusBounds: { min: [0.08, 0.68, -0.14], max: [0.56, 1.5, 0.2] },
    },
  ];

  const partToGroupId = new Map<string, string>();
  for (const g of groups) {
    for (const pid of g.partIds) {
      if (!partToGroupId.has(pid)) {
        partToGroupId.set(pid, g.id);
      }
    }
  }

  // Genuine Rigid-Body Anatomical Animations backed by discrete atlas meshes
  const lowerTeethAndGingiva = validIds(partMap, [
    'FJ1253', 'FJ1254', 'FJ1255', 'FJ1256', 'FJ1257', 'FJ1258', 'FJ1259', 'FJ1260',
    'FJ1268', 'FJ1269', 'FJ1270', 'FJ1271', 'FJ1272', 'FJ1273', 'FJ1274',
  ]);
  const jawParts = validIds(partMap, ['FJ3289', ...lowerTeethAndGingiva]);
  const tmjPivot: [number, number, number] = [0, 1.576, 0.002];

  const rawVaultMotions: (RigidPartMotionSpec | null)[] = [
    partMap.has('FJ3200')
      ? {
          partId: 'FJ3200',
          pivot: [0, 1.65, 0.04],
          axis: [1, 0, 0],
          maxAngleRad: -0.25,
          maxTranslation: [0, 0.085, 0.065],
        }
      : null,
    partMap.has('FJ3274')
      ? {
          partId: 'FJ3274',
          pivot: [0.03, 1.65, -0.04],
          axis: [0, 0, 1],
          maxAngleRad: -0.22,
          maxTranslation: [0.075, 0.095, -0.015],
        }
      : null,
    partMap.has('FJ3380')
      ? {
          partId: 'FJ3380',
          pivot: [-0.03, 1.65, -0.04],
          axis: [0, 0, 1],
          maxAngleRad: 0.22,
          maxTranslation: [-0.075, 0.095, -0.015],
        }
      : null,
    partMap.has('FJ3309')
      ? {
          partId: 'FJ3309',
          pivot: [0, 1.61, -0.06],
          axis: [1, 0, 0],
          maxAngleRad: 0.24,
          maxTranslation: [0, 0.045, -0.08],
        }
      : null,
    partMap.has('FJ3281')
      ? {
          partId: 'FJ3281',
          pivot: [0.04, 1.59, -0.02],
          axis: [0, 0, 1],
          maxAngleRad: -0.18,
          maxTranslation: [0.07, 0.01, 0],
        }
      : null,
    partMap.has('FJ3386')
      ? {
          partId: 'FJ3386',
          pivot: [-0.04, 1.59, -0.02],
          axis: [0, 0, 1],
          maxAngleRad: 0.18,
          maxTranslation: [-0.07, 0.01, 0],
        }
      : null,
  ];
  const vaultMotions: RigidPartMotionSpec[] = rawVaultMotions.filter(
    (x): x is RigidPartMotionSpec => x !== null,
  );

  const ribSternumParts = matchParts(
    atlas,
    (p) => p.system === 'skeletal' && (/rib$/i.test(p.name) || /sternum|manubrium|xiphoid/i.test(p.name)),
  );
  const ribMotions: RigidPartMotionSpec[] = ribSternumParts.map((partId) => {
    const p = partMap.get(partId)!;
    const cy = (p.bounds[0][1] + p.bounds[1][1]) / 2;
    const isSternum = /sternum|manubrium|xiphoid/i.test(p.name);
    return {
      partId,
      pivot: [0, cy + 0.01, -0.07],
      axis: [1, 0, 0],
      maxAngleRad: isSternum ? -0.075 : -0.085,
      maxTranslation: isSternum ? [0, 0.012, 0.016] : [0, 0.008, 0.008],
    };
  });

  const elbowPivot: [number, number, number] = [0.228, 1.113, -0.025];

  const animations: AnatomicalAnimationSpec[] = [
    {
      id: 'jaw-tmj-depression',
      title: 'Mandibular Depression (TMJ)',
      region: 'Head & Jaw',
      category: 'joint-kinematic',
      status: 'supported_rigid',
      durationSec: 3.2,
      defaultLoop: true,
      description:
        'Articulates the mandible and lower dental arch downward around the bilateral temporomandibular condylar hinge axis.',
      involvedPartIds: jawParts,
      rigidMotions: jawParts.map((partId) => ({
        partId,
        pivot: tmjPivot,
        axis: [1, 0, 0],
        maxAngleRad: 0.34,
      })),
      focusBounds: { min: [-0.14, 1.44, -0.14], max: [0.14, 1.74, 0.14] },
    },
    {
      id: 'cranial-vault-lift',
      title: 'Cranial Vault Anatomical Lift',
      region: 'Head & Skull',
      category: 'cranial-dissection',
      status: 'supported_rigid',
      durationSec: 4.0,
      defaultLoop: false,
      description:
        'Smoothly elevates and separates frontal, parietal, occipital, and temporal cranial vault bones to expose the cerebral hemispheres.',
      involvedPartIds: vaultMotions.map((m) => m.partId),
      rigidMotions: vaultMotions,
      focusBounds: { min: [-0.14, 1.54, -0.16], max: [0.14, 1.78, 0.14] },
    },
    {
      id: 'left-elbow-flexion',
      title: 'Left Elbow Flexion (Humeroulnar)',
      region: 'Upper Limb',
      category: 'joint-kinematic',
      status: 'supported_rigid',
      durationSec: 3.4,
      defaultLoop: true,
      description:
        'Rotates the left radius, ulna, and articulated hand skeleton smoothly around the distal humeral trochlear axis.',
      involvedPartIds: leftArmBelowElbowBones,
      rigidMotions: leftArmBelowElbowBones.map((partId) => ({
        partId,
        pivot: elbowPivot,
        axis: [-1, 0, 0],
        maxAngleRad: 1.05,
      })),
      focusBounds: { min: [0.1, 0.68, -0.1], max: [0.34, 1.38, 0.26] },
    },
    {
      id: 'thoracic-rib-elevation',
      title: 'Rib Cage Inspiratory Elevation',
      region: 'Thorax',
      category: 'respiratory-cage',
      status: 'supported_rigid',
      durationSec: 4.2,
      defaultLoop: true,
      description:
        'Demonstrates rigid pump-handle elevation of the sternum and ribs around posterior costovertebral axes (bony kinematics only).',
      involvedPartIds: ribSternumParts,
      rigidMotions: ribMotions,
      focusBounds: { min: [-0.19, 1.06, -0.14], max: [0.19, 1.46, 0.14] },
    },
    {
      id: 'cardiac-systole-diastole',
      title: 'Cardiac Cycle (Wall Contraction)',
      region: 'Thorax',
      category: 'organ-motion',
      status: 'requires_rig',
      durationSec: 1.0,
      defaultLoop: true,
      description:
        'Deformable atrial and ventricular contraction with synchronized valve leaflet excursion.',
      involvedPartIds: heartParts,
      rigidMotions: [],
      rigRequirementNote:
        'Requires skinned cardiac wall weights or vertex morph targets (not fabricated via uniform scale on static BP3D meshes).',
      focusBounds: { min: [-0.06, 1.18, -0.02], max: [0.1, 1.31, 0.08] },
    },
    {
      id: 'pulmonary-lung-expansion',
      title: 'Pulmonary Lobes Expansion',
      region: 'Thorax',
      category: 'organ-motion',
      status: 'requires_asset',
      durationSec: 4.0,
      defaultLoop: true,
      description:
        'Elastic volumetric inflation of left and right lung lobes paired with diaphragm dome descent.',
      involvedPartIds: validIds(partMap, ['FJ3131']),
      rigidMotions: [],
      rigRequirementNote:
        'Requires lung parenchyma lobe meshes (currently only tracheobronchial trees exist) plus deformable morph targets.',
    },
  ];

  return {
    regions: [allHeadRegions, thoraxRegion, upperLimbRegion],
    groups,
    animations,
    partToGroupId,
  };
}
