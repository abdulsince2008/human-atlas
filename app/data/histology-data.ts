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
  },
];
