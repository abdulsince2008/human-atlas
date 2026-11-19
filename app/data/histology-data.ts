import type { CanonicalSystemId } from '../anatomy-systems';

export type HistologyCategory = 'epithelial' | 'connective' | 'muscle' | 'nervous';

export interface SpecimenAssetSlot {
  slotId: string;
  title: string;
  stainProtocol: string;
  expectedMagnification: string;
  mediaStatus: 'text_only_import_ready';
  imageUrl?: string;
  attributionRequirement: string;
}

export interface HistologySelfCheck {
  prompt: string;
  options: string[];
  correctIndex: number;
  rationale: string;
}

export interface HistologyEntry {
  id: string;
  title: string;
  kind: 'tissue-class' | 'organ-microanatomy';
  category: HistologyCategory;
  canonicalSystem?: CanonicalSystemId;
  summary: string;
  microscopicStructures: string[];
  diagnosticFeatures: string[];
  linkedConceptIds: string[];
  linkedTopicIds: string[];
  specimenSlot: SpecimenAssetSlot;
  selfCheck?: HistologySelfCheck;
}

export const HISTOLOGY_CATEGORIES: { id: HistologyCategory; label: string; summary: string }[] = [
  {
    id: 'epithelial',
    label: 'Epithelial Tissue',
    summary: 'Polarized cellular sheets forming protective barriers, absorptive surfaces, and secretory glands.',
  },
  {
    id: 'connective',
    label: 'Connective Tissue',
    summary: 'Cells embedded in an abundant extracellular matrix of collagen/elastic fibers and ground substance (includes bone, cartilage, blood).',
  },
  {
    id: 'muscle',
    label: 'Muscle Tissue',
    summary: 'Contractile actin-myosin filaments organized into skeletal, cardiac, and smooth muscle architectures.',
  },
  {
    id: 'nervous',
    label: 'Nervous Tissue',
    summary: 'Excitable neurons paired with supportive neuroglia (astrocytes, oligodendrocytes, Schwann cells, microglia).',
  },
];

export const HISTOLOGY_ENTRIES: HistologyEntry[] = [
  {
    id: 'hist-epithelial-overview',
    title: 'Epithelial Classification & Polarity',
    kind: 'tissue-class',
    category: 'epithelial',
    canonicalSystem: 'integumentary',
    summary:
      'Classified by cell layers (simple vs. stratified vs. pseudostratified) and apical cell shape (squamous, cuboidal, columnar). Sits atop a basement membrane and is avascular.',
    microscopicStructures: ['Apical microvilli or cilia', 'Basolateral junctional complexes (tight, adherens, desmosomes)', 'Basal lamina & reticular lamina'],
    diagnosticFeatures: [
      'Simple squamous: alveoli & blood vessel endothelium optimize diffusion.',
      'Pseudostratified ciliated columnar: trachea respiratory mucociliary escalator.',
      'Stratified squamous keratinized: epidermis resisting abrasion and desiccation.',
    ],
    linkedConceptIds: ['FMA7163', 'FMA7394'],
    linkedTopicIds: ['topic-integumentary-skin-appendages', 'topic-respiratory-airways'],
    specimenSlot: {
      slotId: 'spec-epithelial-trachea',
      title: 'Pseudostratified Ciliated Respiratory Epithelium (Import Slot)',
      stainProtocol: 'H&E',
      expectedMagnification: '400×',
      mediaStatus: 'text_only_import_ready',
      attributionRequirement: 'Requires verified CC BY 4.0 / CC0 virtual microscopy micrograph with source URL and magnification scale bar.',
    },
    selfCheck: {
      prompt: 'Which epithelial type lines the trachea and powers the mucociliary escalator?',
      options: [
        'Simple squamous epithelium',
        'Pseudostratified ciliated columnar epithelium with goblet cells',
        'Stratified squamous keratinized epithelium',
        'Transitional epithelium (urothelium)',
      ],
      correctIndex: 1,
      rationale: 'Tracheal respiratory mucosa is lined by pseudostratified ciliated columnar epithelium whose cilia sweep mucus-trapped particulates cephalad.',
    },
  },
  {
    id: 'hist-connective-osteon',
    title: 'Compact Bone & Haversian (Osteon) Microarchitecture',
    kind: 'organ-microanatomy',
    category: 'connective',
    canonicalSystem: 'skeletal',
    summary:
      'Calcified extracellular matrix arranged in concentric lamellae around a central Haversian canal housing blood vessels and nerves.',
    microscopicStructures: ['Central (Haversian) canal', 'Concentric lamellae', 'Osteocytes inside lacunae', 'Canaliculi & Volkmann perforating canals'],
    diagnosticFeatures: [
      'Canaliculi link osteocyte cytoplasmic processes for nutrient exchange across mineralized bone.',
      'Type I collagen provides tensile resistance while hydroxyapatite crystals confer compressive strength.',
    ],
    linkedConceptIds: ['FMA9611', 'FMA24476', 'FMA13303'],
    linkedTopicIds: ['topic-skeletal-lower-limb'],
    specimenSlot: {
      slotId: 'spec-compact-bone',
      title: 'Ground Compact Bone Transverse Section (Import Slot)',
      stainProtocol: 'Schmorl or unstained ground section',
      expectedMagnification: '100× – 200×',
      mediaStatus: 'text_only_import_ready',
      attributionRequirement: 'Requires CC BY 4.0 / CC0 micrograph; no synthetic microscopy image generated.',
    },
    selfCheck: {
      prompt: 'Which microscopic channels link osteocyte lacunae across mineralized bone lamellae for nutrient exchange?',
      options: [
        'Intercalated discs',
        'Canaliculi',
        'Bile canaliculi',
        'Fenestrated sinusoids',
      ],
      correctIndex: 1,
      rationale: 'Canaliculi are tiny tunnels housing osteocyte cytoplasmic processes that connect via gap junctions across the calcified matrix.',
    },
  },
  {
    id: 'hist-muscle-cardiac',
    title: 'Cardiac Muscle (Myocardium) vs. Skeletal Muscle',
    kind: 'organ-microanatomy',
    category: 'muscle',
    canonicalSystem: 'cardiovascular',
    summary:
      'Branched striated myocytes containing 1–2 central nuclei, joined end-to-end by intercalated discs rich in desmosomes and gap junctions.',
    microscopicStructures: ['Sarcomeres (A & I bands)', 'Intercalated discs with fascia adherens & gap junctions', 'Central oval nuclei', 'Abundant mitochondria (~30–35% cell volume)'],
    diagnosticFeatures: [
      'Gap junctions allow rapid electrical propagation so myocardium contracts as a functional syncytium.',
      'Skeletal muscle differs by having peripheral multinucleated unbranched fibers.',
    ],
    linkedConceptIds: ['FMA7088', 'FMA37683'],
    linkedTopicIds: ['topic-cardio-heart-chambers', 'topic-muscular-upper-limb'],
    specimenSlot: {
      slotId: 'spec-myocardium',
      title: 'Longitudinal Myocardium Section (Import Slot)',
      stainProtocol: 'H&E',
      expectedMagnification: '400×',
      mediaStatus: 'text_only_import_ready',
      attributionRequirement: 'Requires verified CC BY 4.0 / CC0 cardiac muscle histology micrograph.',
    },
    selfCheck: {
      prompt: 'Which histological hallmark distinguishes cardiac myocytes from skeletal muscle fibers?',
      options: [
        'Peripheral multinucleated unbranched cylinders',
        'Branched striated fibers with central nuclei and intercalated discs',
        'Absence of sarcomeres and spindle-shaped nuclei',
        'Concentric calcified lamellae around central canals',
      ],
      correctIndex: 1,
      rationale: 'Cardiac myocytes are branched, striated, have 1–2 central nuclei, and connect end-to-end via intercalated discs containing desmosomes and gap junctions.',
    },
  },
  {
    id: 'hist-nervous-cortex',
    title: 'Cerebellar & Peripheral Nerve Microanatomy',
    kind: 'tissue-class',
    category: 'nervous',
    canonicalSystem: 'nervous',
    summary:
      'CNS white vs. gray matter organized alongside myelinated peripheral axons wrapped in endoneurium, perineurium, and epineurium.',
    microscopicStructures: ['Neuronal soma with Nissl bodies (RER)', 'Myelin sheaths (oligodendrocyte CNS vs. Schwann cell PNS)', 'Nodes of Ranvier'],
    diagnosticFeatures: [
      'Cerebellar cortex exhibits three classic layers: outer molecular, Purkinje cell monolayer, and inner granule layer.',
      'Peripheral nerve fascicles exhibit wavy collagenous endoneurium and epithelioid perineurium.',
    ],
    linkedConceptIds: ['FMA50801', 'FMA67944', 'FMA7647', 'FMA50863'],
    linkedTopicIds: ['topic-nervous-brain-divisions', 'topic-nervous-spinal-cranial'],
    specimenSlot: {
      slotId: 'spec-cerebellum',
      title: 'Cerebellar Folia Three-Layer Cortex (Import Slot)',
      stainProtocol: 'H&E or Luxol Fast Blue',
      expectedMagnification: '100× – 400×',
      mediaStatus: 'text_only_import_ready',
      attributionRequirement: 'Requires verified CC BY 4.0 / CC0 neurohistology specimen.',
    },
    selfCheck: {
      prompt: 'Which three layers compose the cerebellar cortex from superficial to deep?',
      options: [
        'Tunica intima, tunica media, tunica adventitia',
        'Molecular layer, Purkinje cell monolayer, and granule cell layer',
        'Stratum corneum, stratum granulosum, stratum basale',
        'Endoneurium, perineurium, epineurium',
      ],
      correctIndex: 1,
      rationale: 'Cerebellar folia characteristically display an outer molecular layer, a single row of large Purkinje neurons, and a densely packed inner granule cell layer.',
    },
  },
  {
    id: 'hist-organ-alveoli',
    title: 'Pulmonary Alveoli & Blood-Air Barrier',
    kind: 'organ-microanatomy',
    category: 'epithelial',
    canonicalSystem: 'respiratory',
    summary:
      'Thin-walled polyhedral air sacs lined by Type I pneumocytes (gas diffusion) and cuboidal Type II pneumocytes (pulmonary surfactant).',
    microscopicStructures: ['Type I alveolar cells (squamous)', 'Type II septal cells (lamellar bodies)', 'Alveolar macrophages (dust cells)', 'Continuous capillary endothelium'],
    diagnosticFeatures: [
      'Fused basal laminae between Type I pneumocyte and capillary endothelium minimize diffusion distance (~0.2–0.6 µm).',
    ],
    linkedConceptIds: ['FMA7309', 'FMA7310', 'FMA7394'],
    linkedTopicIds: ['topic-respiratory-mechanics'],
    specimenSlot: {
      slotId: 'spec-lung-alveoli',
      title: 'Lung Parenchyma & Alveolar Septa (Import Slot)',
      stainProtocol: 'H&E',
      expectedMagnification: '200× – 400×',
      mediaStatus: 'text_only_import_ready',
      attributionRequirement: 'Requires verified CC BY 4.0 / CC0 lung tissue specimen.',
    },
    selfCheck: {
      prompt: 'Which alveolar cell type secretes pulmonary surfactant to reduce surface tension and prevent alveolar collapse?',
      options: [
        'Type I squamous pneumocytes',
        'Type II cuboidal pneumocytes (septal cells)',
        'Alveolar macrophages (dust cells)',
        'Capillary endothelial cells',
      ],
      correctIndex: 1,
      rationale: 'Type II pneumocytes contain lamellar bodies that secrete surfactant, while Type I pneumocytes form the thin gas-diffusion surface.',
    },
  },
  {
    id: 'hist-organ-renal-corpuscle',
    title: 'Renal Corpuscle (Glomerulus) & Tubules',
    kind: 'organ-microanatomy',
    category: 'epithelial',
    canonicalSystem: 'urinary',
    summary:
      'Fenestrated glomerular capillary tuft enveloped by podocyte foot processes (visceral Bowman layer), feeding into brush-border proximal convoluted tubules.',
    microscopicStructures: ['Glomerular capillaries & mesangium', 'Podocytes & filtration slits', 'PCT eosinophilic cuboidal cells with microvillous brush border', 'DCT clearer lumen without dense brush border'],
    diagnosticFeatures: [
      'PCT cells exhibit dense acidophilic cytoplasm due to abundant mitochondria powering active Na+/glucose reabsorption.',
    ],
    linkedConceptIds: ['FMA7203', 'FMA14751', 'FMA9704'],
    linkedTopicIds: ['topic-urinary-kidneys-vessels'],
    specimenSlot: {
      slotId: 'spec-renal-cortex',
      title: 'Renal Cortex Glomerulus & PCT/DCT Section (Import Slot)',
      stainProtocol: 'H&E or PAS',
      expectedMagnification: '400×',
      mediaStatus: 'text_only_import_ready',
      attributionRequirement: 'Requires verified CC BY 4.0 / CC0 renal histology specimen.',
    },
    selfCheck: {
      prompt: 'Which histological feature distinguishes proximal convoluted tubule (PCT) cells from distal convoluted tubule (DCT) cells on H&E?',
      options: [
        'PCT cells are flatter with wide clear lumens and no brush border',
        'PCT cells show dense eosinophilic cytoplasm and an apical microvillous brush border',
        'PCT cells are keratinized stratified squamous cells',
        'PCT cells lack mitochondria and perform only passive diffusion',
      ],
      correctIndex: 1,
      rationale: 'Abundant mitochondria and a dense apical microvillous brush border give PCT cells eosinophilic cytoplasm and a narrower, fuzzy lumen.',
    },
  },
  {
    id: 'hist-organ-liver-lobule',
    title: 'Hepatic Lobule & Portal Triad',
    kind: 'organ-microanatomy',
    category: 'epithelial',
    canonicalSystem: 'digestive',
    summary:
      'Hexagonal plates of polyhedral hepatocytes radiating toward a central vein, supplied at each lobule corner by a portal triad (hepatic arteriole, portal venule, bile duct).',
    microscopicStructures: ['Hepatocyte cords & bile canaliculi', 'Discontinuous fenestrated hepatic sinusoids', 'Kupffer macrophages in Space of Disse', 'Portal triad vessels'],
    diagnosticFeatures: [
      'Mixed arterial and portal venous blood flows centripetally along sinusoids toward the central vein while bile flows centrifugally toward the bile duct.',
    ],
    linkedConceptIds: ['FMA7197', 'FMA7202', 'FMA50735'],
    linkedTopicIds: ['topic-digestive-accessory-glands'],
    specimenSlot: {
      slotId: 'spec-liver-lobule',
      title: 'Hepatic Portal Triad & Central Vein (Import Slot)',
      stainProtocol: 'H&E or Masson Trichrome',
      expectedMagnification: '100× – 200×',
      mediaStatus: 'text_only_import_ready',
      attributionRequirement: 'Requires verified CC BY 4.0 / CC0 hepatic histology specimen.',
    },
    selfCheck: {
      prompt: 'Which three tubular structures compose a classic hepatic portal triad at the corner of a liver lobule?',
      options: [
        'Central vein, sinusoid, and lymphatic duct',
        'Hepatic arteriole, portal venule, and bile ductule',
        'Pulmonary venule, bronchiole, and capillary',
        'Glomerulus, proximal tubule, and collecting duct',
      ],
      correctIndex: 1,
      rationale: 'Each portal triad contains a branch of the hepatic artery, a branch of the hepatic portal vein, and a bile ductule.',
    },
  },
  {
    id: 'hist-muscle-smooth-vascular',
    title: 'Smooth Muscle & Muscular Artery Wall (Tunica Media)',
    kind: 'tissue-class',
    category: 'muscle',
    canonicalSystem: 'cardiovascular',
    summary:
      'Spindle-shaped non-striated smooth myocytes with single central cigar-shaped nuclei forming the muscular tunica media of arteries and visceral walls.',
    microscopicStructures: [
      'Tunica intima (endothelium + internal elastic lamina)',
      'Tunica media (circumferential smooth muscle & elastic lamellae)',
      'Tunica externa / adventitia (collagen & vasa vasorum)',
    ],
    diagnosticFeatures: [
      'Arteries exhibit a thicker, rounder tunica media and prominent internal elastic lamina compared to companion veins.',
      'Smooth muscle lacks sarcomere striations and contracts involuntarily via dense bodies.',
    ],
    linkedConceptIds: ['FMA3736', 'FMA10951'],
    linkedTopicIds: ['topic-cardio-great-vessels'],
    specimenSlot: {
      slotId: 'spec-muscular-artery',
      title: 'Muscular Artery & Vein Cross-Section (Import Slot)',
      stainProtocol: 'H&E or Verhoeff-Van Gieson (Elastic)',
      expectedMagnification: '100× – 200×',
      mediaStatus: 'text_only_import_ready',
      attributionRequirement: 'Requires verified CC BY 4.0 / CC0 vascular wall micrograph.',
    },
    selfCheck: {
      prompt: 'Which vascular wall layer is markedly thicker in a muscular artery than in a companion vein of similar caliber?',
      options: ['Tunica intima endothelium only', 'Tunica media (smooth muscle)', 'Basement membrane', 'Pericardium'],
      correctIndex: 1,
      rationale: 'Arteries withstand higher systemic pressure and regulate vascular resistance via a thick muscular tunica media.',
    },
  },
  {
    id: 'hist-lymphoid-node-spleen',
    title: 'Lymph Node Cortex & Splenic White/Red Pulp',
    kind: 'organ-microanatomy',
    category: 'connective',
    canonicalSystem: 'lymphatic',
    summary:
      'Reticular connective tissue meshwork supporting B-cell lymphoid follicles (germinal centers), T-cell paracortex, and blood-filtering splenic sinusoids.',
    microscopicStructures: [
      'Subcapsular & medullary sinuses (lymph node)',
      'Cortical lymphoid follicles with germinal centers',
      'Splenic white pulp (PALS & follicles around central arteriole) vs red pulp cords/sinusoids',
    ],
    diagnosticFeatures: [
      'Lymph nodes filter lymph via afferent/efferent vessels; the spleen filters blood directly and lacks afferent lymphatics.',
    ],
    linkedConceptIds: ['FMA7196'],
    linkedTopicIds: ['topic-lymphatic-organs'],
    specimenSlot: {
      slotId: 'spec-spleen-pulp',
      title: 'Splenic White Pulp & Red Pulp Section (Import Slot)',
      stainProtocol: 'H&E',
      expectedMagnification: '100× – 200×',
      mediaStatus: 'text_only_import_ready',
      attributionRequirement: 'Requires verified CC BY 4.0 / CC0 lymphoid histology specimen.',
    },
    selfCheck: {
      prompt: 'Which distinguishing feature separates splenic white pulp follicles from lymph node cortical follicles under microscopy?',
      options: [
        'Presence of an eccentric central arteriole inside splenic white pulp',
        'Presence of skeletal muscle striations',
        'Presence of Haversian canals',
        'Presence of alveolar Type II pneumocytes',
      ],
      correctIndex: 0,
      rationale: 'Splenic white pulp forms periarteriolar lymphatic sheaths (PALS) and follicles around a characteristic central arteriole.',
    },
  },
  {
    id: 'hist-skin-epidermis-dermis',
    title: 'Integument: Epidermal Strata & Dermal Appendages',
    kind: 'organ-microanatomy',
    category: 'epithelial',
    canonicalSystem: 'integumentary',
    summary:
      'Keratinized stratified squamous epidermis (stratum basale through stratum corneum) anchored to collagenous papillary and reticular dermis.',
    microscopicStructures: [
      'Stratum basale, spinosum, granulosum, (lucidum in thick skin), and corneum',
      'Dermal papillae & Meissner corpuscles',
      'Reticular dermis dense irregular connective tissue, hair follicles & sweat glands',
    ],
    diagnosticFeatures: [
      'Thick skin (palms/soles) displays a prominent stratum lucidum and thick stratum corneum without hair follicles.',
      'Gross 3D body surface meshes do not model cellular epidermal layers; skin microanatomy belongs strictly to histology.',
    ],
    linkedConceptIds: ['FMA7163'],
    linkedTopicIds: ['topic-integumentary-skin-appendages'],
    specimenSlot: {
      slotId: 'spec-thick-skin',
      title: 'Thick Skin Epidermis & Dermis Section (Import Slot)',
      stainProtocol: 'H&E',
      expectedMagnification: '100× – 400×',
      mediaStatus: 'text_only_import_ready',
      attributionRequirement: 'Requires verified CC BY 4.0 / CC0 integumentary micrograph.',
    },
    selfCheck: {
      prompt: 'Which epidermal layer is uniquely visible in thick skin (palms and soles) between stratum granulosum and stratum corneum?',
      options: ['Stratum basale', 'Stratum lucidum', 'Reticular dermis', 'Hypodermis'],
      correctIndex: 1,
      rationale: 'Stratum lucidum is a thin translucent layer of dead keratinocytes present only in thick skin.',
    },
  },
];
