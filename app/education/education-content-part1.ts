import type { EducationTopic } from './education-types';

/**
 * Domains A–H: Human Anatomy, Cell Biology, Histology, Embryology,
 * Human Physiology, Biochemistry, Molecular Genetics, Microbiology & Parasitology.
 *
 * All explanations are original educational syntheses aligned with official
 * curriculum outcomes; all FMA concept IDs are verified against atlas.json.
 */
export const EDUCATION_TOPICS_PART_1: EducationTopic[] = [
  // =========================================================================
  // DOMAIN A — HUMAN ANATOMY
  // =========================================================================
  {
    id: 'edu-anat-organization-planes',
    domainId: 'human_anatomy',
    chapterTitle: 'General Anatomy & Spatial Organization',
    title: 'Anatomical Position, Body Planes & Structural Hierarchy',
    summary:
      'Universal spatial reference conventions (anatomical position, sagittal/coronal/transverse planes, directional pairs) and hierarchical body organization from cells to organ systems.',
    targetTracks: ['school_foundations', 'secondary_premed', 'medical_foundations', 'allied_health'],
    curriculumMappings: [
      { frameworkId: 'pk_ncp_gs_4_8', gradeOrYear: 'Grades 6–8', unitOrModule: 'Cellular Organization & Human Organ Systems', status: 'compulsory' },
      { frameworkId: 'pk_ncp_bio_9_12', gradeOrYear: 'Grade IX–XI', unitOrModule: 'Levels of Biological Organization', status: 'elective' },
      { frameworkId: 'pk_pmdc_mbbs', gradeOrYear: 'MBBS Year 1', unitOrModule: 'General Anatomy & Terminology', status: 'compulsory' },
      { frameworkId: 'au_wa_human_bio', gradeOrYear: 'Year 11 (Unit 1)', unitOrModule: 'Functioning Human Body — Body Organization', status: 'elective' },
      { frameworkId: 'ox_preclinical', gradeOrYear: 'Year 1', unitOrModule: 'Organisation of the Body', status: 'institution_specific' },
    ],
    learningObjectives: [
      'Describe standard anatomical position and apply directional pairs (anterior/posterior, medial/lateral, proximal/distal).',
      'Distinguish sagittal, coronal (frontal), and transverse (axial) planes used in 3D dissection and cross-sectional imaging.',
      'Explain how cells, tissues, organs, and the 12 canonical organ systems integrate functionally.',
    ],
    depthExplanations: {
      school_foundations:
        'Your body is built in organized layers: tiny cells group together into tissues, tissues form organs such as the heart and lungs, and organs work together in body systems. Scientists use a standard standing pose—facing forward with palms facing ahead—so "left" and "right" always mean the person’s own left and right.',
      secondary_premed:
        'Structural organization progresses from biochemical macromolecules → organelles → cells → four primary tissues → organs → organ systems. Standard anatomical position provides an unambiguous coordinate frame: sagittal planes divide left/right, coronal planes divide anterior/posterior, and transverse planes divide superior/inferior.',
      medical_foundations:
        'Anatomical terminology standardized by Terminologia Anatomica (TA2) and FMA prevents clinical ambiguity during examination, surgery, and cross-sectional radiology. Proximal/distal apply to limb segments relative to trunk attachment, whereas superficial/deep describe depth relative to skin and investing fascial planes.',
      allied_health:
        'Accurate directional and positional language (supine, prone, lateral decubitus, proximal vs distal) is essential for documenting physical findings, positioning patients safely, and communicating across interprofessional clinical teams.',
    },
    keyConcepts: [
      { term: 'Anatomical Position', definition: 'Standing upright, eyes forward, arms at sides, palms facing anteriorly, feet parallel.' },
      { term: 'Sagittal / Median Plane', definition: 'Vertical plane dividing the body into right and left parts (midsagittal = equal halves).' },
      { term: 'Coronal (Frontal) Plane', definition: 'Vertical plane dividing the body into anterior (ventral) and posterior (dorsal) portions.' },
      { term: 'Transverse (Axial) Plane', definition: 'Horizontal plane dividing the body into superior (cranial) and inferior (caudal) sections.' },
    ],
    keyFacts: [
      'Anatomy 360 maps 2,234 adult male BodyParts3D 4.0 surface meshes across 12 canonical organ systems.',
      'Proximal/distal describe limb distance from the root of the limb, whereas medial/lateral describe distance from the midline.',
    ],
    crossSubjectLinks: [
      { domainId: 'radiology_imaging', relation: 'CT and MRI slices directly correspond to axial, coronal, and sagittal anatomical planes.' },
      { domainId: 'histology', relation: 'Organs combine epithelial, connective, muscular, and nervous tissues in layered architecture.' },
    ],
    relatedSystems: ['skeletal', 'muscular', 'cardiovascular'],
    relatedFmaConceptIds: ['FMA46565', 'FMA7088', 'FMA9611'],
    visualFormats: ['3d_anatomy', '2d_diagram'],
    diagram: {
      id: 'diag-body-hierarchy',
      title: 'Structural Hierarchy of the Human Body',
      kind: 'hierarchy',
      caption: 'Each level of biological organization builds emergent physiological function.',
      disclaimer: 'Conceptual educational diagram.',
      nodes: [
        { id: 'n1', label: 'Biomolecules & Organelles', sublabel: 'DNA, proteins, mitochondria', tone: 'slate' },
        { id: 'n2', label: 'Cells', sublabel: 'Cardiomyocytes, neurons, hepatocytes', tone: 'blue' },
        { id: 'n3', label: '4 Primary Tissues', sublabel: 'Epithelial, connective, muscle, nervous', tone: 'teal' },
        { id: 'n4', label: 'Organs', sublabel: 'Heart, liver, brain, kidney', tone: 'amber' },
        { id: 'n5', label: '12 Organ Systems', sublabel: 'Integrated organism homeostasis', tone: 'emerald' },
      ],
    },
    assetDisclosure: {
      status: 'partial',
      summary: 'Linked to real 3D adult male BodyParts3D reference meshes (Skull, Heart, Femur). Female reproductive and paediatric geometries are not yet modeled.',
    },
    activity: {
      title: '3D Plane & Directional Orientation Check',
      kind: '3d_inspection',
      prompt: 'Open the Heart (FMA7088) in the 3D Explorer and enable the Transverse and Sagittal clipping planes to observe how superior/inferior and left/right relationships appear in 3D.',
      keyTakeaway: 'Left and right in anatomy always refer to the subject’s own left and right, regardless of viewer orientation.',
    },
    selfChecks: [
      {
        id: 'q-edu-anat-1',
        question: 'Which anatomical plane divides the human body into anterior (front) and posterior (back) portions?',
        options: ['Sagittal plane', 'Coronal (frontal) plane', 'Transverse (axial) plane', 'Oblique parasagittal plane'],
        correctIndex: 1,
        explanation: 'The coronal (frontal) plane runs vertically from side to side, separating anterior from posterior structures.',
        level: 'secondary_premed',
      },
      {
        id: 'q-edu-anat-2',
        question: 'In standard anatomical position, the wrist is described as ______ to the elbow.',
        options: ['Proximal', 'Medial', 'Distal', 'Superior'],
        correctIndex: 2,
        explanation: 'In the limbs, distal means farther from the point of attachment to the trunk; the wrist is distal to the elbow.',
        level: 'school_foundations',
      },
    ],
    sources: [
      { title: 'Anatomy and Physiology 2e — Chapter 1: Anatomical Terminology', authority: 'OpenStax (CC BY 4.0)', url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/1-6-anatomical-terminology', supports: 'Standard anatomical planes and directional terminology' },
      { title: 'Terminologia Anatomica (TA2)', authority: 'FIPAT (CC BY-ND 4.0)', supports: 'International standardized anatomical nomenclature' },
    ],
    reviewStatus: 'structured_reference',
  },

  // =========================================================================
  // DOMAIN B — CELL BIOLOGY & CYTOLOGY
  // =========================================================================
  {
    id: 'edu-cell-organelles-transport',
    domainId: 'cell_biology',
    chapterTitle: 'Cell Ultrastructure & Membrane Transport',
    title: 'Eukaryotic Organelles, Plasma Membrane & Transport Mechanisms',
    summary:
      'Fluid-mosaic membrane architecture, selective permeability (diffusion, osmosis, active transport, endocytosis), and functional division of labour across eukaryotic organelles.',
    targetTracks: ['school_foundations', 'secondary_premed', 'medical_foundations', 'allied_health'],
    curriculumMappings: [
      { frameworkId: 'pk_ncp_gs_4_8', gradeOrYear: 'Grade 6', unitOrModule: 'Cellular Organization', status: 'compulsory' },
      { frameworkId: 'pk_ncp_bio_9_12', gradeOrYear: 'Grade IX & XI', unitOrModule: 'Cells and Tissues / Cell Structure & Function', status: 'elective' },
      { frameworkId: 'in_cbse_bio_11_12', gradeOrYear: 'Class XI (Unit III)', unitOrModule: 'Cell: The Unit of Life', status: 'elective' },
      { frameworkId: 'en_nc_science', gradeOrYear: 'KS3 & KS4', unitOrModule: 'Cell Biology & Transport in Cells', status: 'compulsory' },
      { frameworkId: 'us_ap_bio', gradeOrYear: 'AP Bio Unit 2', unitOrModule: 'Cell Structure and Function', status: 'optional' },
      { frameworkId: 'cn_moe_bio_2022', gradeOrYear: 'Grades 7–9', unitOrModule: 'Cell as the Basic Unit of Life', status: 'compulsory' },
    ],
    learningObjectives: [
      'Relate the phospholipid bilayer and integral membrane proteins to selective permeability.',
      'Compare passive transport (simple/facilitated diffusion, osmosis) with primary and secondary active transport.',
      'Match major organelles (nucleus, rough/smooth ER, Golgi apparatus, mitochondria, lysosomes, peroxisomes) to their cellular functions.',
    ],
    depthExplanations: {
      school_foundations:
        'Every human tissue is made of microscopic cells. The cell membrane acts like a smart gatekeeper controlling what enters and leaves, the nucleus holds the DNA instructions, mitochondria release usable energy from food, and ribosomes build proteins.',
      secondary_premed:
        'The plasma membrane is a fluid mosaic of amphipathic phospholipids, cholesterol, and transmembrane proteins. Small nonpolar molecules cross by simple diffusion, water crosses via osmosis/aquaporins, ions require channels or carriers, and active transport (e.g., Na+/K+-ATPase) moves solutes against electrochemical gradients using ATP.',
      medical_foundations:
        'Compartmentalization within eukaryotic cells underpins human pathophysiology: rough ER/Golgi coordinate secretory protein folding and glycosylation; mitochondrial inner-membrane cristae sustain the proton-motive force for oxidative phosphorylation; lysosomal acid hydrolases degrade macromolecules (defects cause lysosomal storage disorders); tight, adherens, desmosomal, and gap junctions maintain epithelial polarity and intercellular coupling.',
      allied_health:
        'Understanding osmosis and tonicity (isotonic, hypotonic, hypertonic fluid shifts) explains why intravenous fluid composition directly affects red blood cell volume and cellular hydration.',
    },
    keyConcepts: [
      { term: 'Fluid Mosaic Model', definition: 'Dynamic phospholipid bilayer with laterally mobile proteins and cholesterol.' },
      { term: 'Na+/K+-ATPase', definition: 'Primary active pump exporting 3 Na+ and importing 2 K+ per ATP hydrolyzed.' },
      { term: 'Endomembrane System', definition: 'Nuclear envelope, ER, Golgi apparatus, vesicles, and lysosomes coordinating protein trafficking.' },
      { term: 'Mitochondria', definition: 'Double-membrane organelles generating ATP via the citric acid cycle and oxidative phosphorylation.' },
    ],
    keyFacts: [
      'The Na+/K+-ATPase maintains the steep Na+ and K+ gradients required for resting membrane potential in neurons and muscle.',
      'Lysosomes maintain an acidic lumen (~pH 4.5–5.0) via V-type H+-ATPase proton pumps.',
    ],
    crossSubjectLinks: [
      { domainId: 'biochemistry', relation: 'Mitochondrial cristae host the electron transport chain and ATP synthase.' },
      { domainId: 'human_physiology', relation: 'Membrane ion channels and pumps generate excitable action potentials.' },
    ],
    relatedSystems: ['nervous', 'muscular', 'integumentary'],
    relatedFmaConceptIds: [],
    visualFormats: ['2d_diagram', 'structured_text'],
    diagram: {
      id: 'diag-secretory-pathway',
      title: 'Eukaryotic Secretory & Energy Compartments',
      kind: 'pathway',
      caption: 'Flow of genetic instruction to secreted protein alongside mitochondrial ATP supply.',
      disclaimer: 'Conceptual 2D educational schematic (not an electron micrograph).',
      nodes: [
        { id: 'c1', label: 'Nucleus (DNA → mRNA)', sublabel: 'Transcription & RNA export', tone: 'blue' },
        { id: 'c2', label: 'Rough ER (Ribosomes)', sublabel: 'Co-translational folding', tone: 'teal' },
        { id: 'c3', label: 'Golgi Apparatus', sublabel: 'Glycosylation & sorting', tone: 'amber' },
        { id: 'c4', label: 'Secretory Vesicle', sublabel: 'Exocytosis at plasma membrane', tone: 'emerald' },
        { id: 'c5', label: 'Mitochondria', sublabel: 'ATP supply for active transport', tone: 'rose' },
      ],
    },
    assetDisclosure: {
      status: 'conceptual_diagram_only',
      summary: 'Conceptual 2D pathway schematic; licensed TEM/SEM micrographs are not yet bundled.',
    },
    activity: {
      title: 'Osmotic Fluid Shift Interpretation',
      kind: 'interpretation',
      prompt: 'Predict what happens to a human erythrocyte placed into a markedly hypotonic solution vs a hypertonic solution, and explain the direction of net water movement.',
      keyTakeaway: 'Water moves by osmosis toward higher solute concentration: hypotonic exposure causes swelling/haemolysis; hypertonic exposure causes crenation (shrinkage).',
    },
    selfChecks: [
      {
        id: 'q-edu-cell-1',
        question: 'Which organelle is primarily responsible for modifying, sorting, and packaging proteins received from the rough endoplasmic reticulum?',
        options: ['Smooth endoplasmic reticulum', 'Golgi apparatus', 'Peroxisome', 'Nucleolus'],
        correctIndex: 1,
        explanation: 'The Golgi apparatus receives transport vesicles from the rough ER on its cis face, modifies glycoproteins/lipids, and dispatches them from the trans face.',
        level: 'secondary_premed',
      },
      {
        id: 'q-edu-cell-2',
        question: 'The Na+/K+-ATPase pump is classified as primary active transport because it:',
        options: [
          'Allows Na+ and K+ to diffuse down their concentration gradients',
          'Directly hydrolyzes ATP to move 3 Na+ out and 2 K+ into the cell against gradients',
          'Transports water through aquaporin channels',
          'Uses a pre-existing glucose gradient to move ions',
        ],
        correctIndex: 1,
        explanation: 'Primary active transport couples solute movement against electrochemical gradients directly to ATP hydrolysis.',
        level: 'medical_foundations',
      },
    ],
    sources: [
      { title: 'Biology 2e — Chapters 4 & 5: Cell Structure and Plasma Membranes', authority: 'OpenStax (CC BY 4.0)', url: 'https://openstax.org/books/biology-2e/pages/4-3-eukaryotic-cells', supports: 'Eukaryotic organelle functions and membrane transport' },
      { title: 'Molecular Biology of the Cell (7th ed., reference)', authority: 'Alberts et al. / W. W. Norton', supports: 'Cell junctions, vesicular trafficking, and membrane bioenergetics' },
    ],
    reviewStatus: 'structured_reference',
  },
  {
    id: 'edu-cell-cycle-mitosis-meiosis',
    domainId: 'cell_biology',
    chapterTitle: 'Cell Division, Signalling & Cell Death',
    title: 'Cell Cycle Checkpoints, Mitosis, Meiosis & Apoptosis',
    summary:
      'Somatic division (mitosis), reductive gamete division (meiosis), CDK/cyclin checkpoint control, and programmed cell death (apoptosis) versus accidental necrosis.',
    targetTracks: ['secondary_premed', 'medical_foundations'],
    curriculumMappings: [
      { frameworkId: 'pk_ncp_bio_9_12', gradeOrYear: 'Grade IX & XII', unitOrModule: 'Cell Cycle (Mitosis & Meiosis)', status: 'elective' },
      { frameworkId: 'in_cbse_bio_11_12', gradeOrYear: 'Class XI (Unit III)', unitOrModule: 'Cell Cycle and Cell Division', status: 'elective' },
      { frameworkId: 'us_ap_bio', gradeOrYear: 'AP Bio Units 4 & 5', unitOrModule: 'Cell Cycle & Meiosis', status: 'optional' },
      { frameworkId: 'hms_pathways', gradeOrYear: 'MD Year 1', unitOrModule: 'Foundations — Cell Regulation & Neoplasia', status: 'institution_specific' },
    ],
    learningObjectives: [
      'Trace G1, S, G2, and M phases and explain the role of G1/S and G2/M checkpoints.',
      'Contrast mitosis (two genetically identical diploid daughters) with meiosis (four genetically diverse haploid gametes).',
      'Distinguish regulated caspase-mediated apoptosis from inflammatory necrosis.',
    ],
    depthExplanations: {
      secondary_premed:
        'During interphase (G1, S, G2), a cell grows and replicates its DNA. Mitosis distributes identical sister chromatids into two diploid (2n) daughter cells for growth and tissue repair. Meiosis involves two divisions—with crossing-over in Prophase I—to produce haploid (n) gametes and genetic variation.',
      medical_foundations:
        'Cell-cycle progression is driven by cyclin-dependent kinases (CDKs) and restrained by tumour suppressors such as p53 and RB. Loss of G1/S checkpoint control permits genomic instability and clonal proliferation (neoplasia). Apoptosis proceeds via intrinsic (mitochondrial cytochrome c) or extrinsic (death-receptor) caspase cascades without membrane rupture or acute inflammation.',
    },
    keyConcepts: [
      { term: 'S Phase', definition: 'Interphase stage during which nuclear DNA is replicated semi-conservatively.' },
      { term: 'Crossing-Over (Prophase I)', definition: 'Reciprocal exchange of chromatid segments between homologous chromosomes during meiosis I.' },
      { term: 'Apoptosis', definition: 'ATP-dependent programmed cell death with cell shrinkage, chromatin condensation, and intact apoptotic bodies.' },
    ],
    keyFacts: [
      'Failure of homologous chromosomes or sister chromatids to separate (nondisjunction) causes aneuploidy such as trisomy 21.',
      'Unlike necrosis, apoptosis does not spill intracellular enzymes into the interstitium and therefore minimizes collateral inflammation.',
    ],
    crossSubjectLinks: [
      { domainId: 'pathology', relation: 'Dysregulated cell-cycle checkpoints drive neoplasia; necrosis vs apoptosis define cell injury outcomes.' },
      { domainId: 'embryology', relation: 'Meiosis produces haploid gametes; controlled apoptosis sculpts developing digits.' },
    ],
    relatedSystems: ['reproductive', 'integumentary'],
    relatedFmaConceptIds: [],
    visualFormats: ['2d_diagram', 'structured_text'],
    diagram: {
      id: 'diag-cell-cycle',
      title: 'Eukaryotic Cell Cycle & Checkpoints',
      kind: 'cycle',
      caption: 'Sequential progression through interphase and mitosis regulated by DNA-integrity checkpoints.',
      disclaimer: 'Conceptual educational diagram.',
      nodes: [
        { id: 'cc1', label: 'G1 Phase', sublabel: 'Growth & G1/S (p53/RB) checkpoint', tone: 'blue' },
        { id: 'cc2', label: 'S Phase', sublabel: 'DNA replication (2n → 4C)', tone: 'teal' },
        { id: 'cc3', label: 'G2 Phase', sublabel: 'Prep & G2/M DNA repair check', tone: 'amber' },
        { id: 'cc4', label: 'M Phase (Mitosis)', sublabel: 'Spindle checkpoint & cytokinesis', tone: 'emerald' },
      ],
    },
    assetDisclosure: {
      status: 'conceptual_diagram_only',
      summary: 'Conceptual 2D cell-cycle diagram; fluorescence microscopy time-lapse assets are not bundled.',
    },
    selfChecks: [
      {
        id: 'q-edu-cell-3',
        question: 'During which stage of meiosis does genetic recombination (crossing-over) occur between homologous chromosomes?',
        options: ['Metaphase II', 'Prophase I', 'Anaphase I', 'Telophase II'],
        correctIndex: 1,
        explanation: 'Homologous chromosomes pair (synapsis) and exchange genetic segments at chiasmata during Prophase I.',
        level: 'secondary_premed',
      },
    ],
    sources: [
      { title: 'Biology 2e — Chapters 10 & 11: Cell Reproduction and Meiosis', authority: 'OpenStax (CC BY 4.0)', supports: 'Mitosis, meiosis, and cell-cycle regulation' },
    ],
    reviewStatus: 'structured_reference',
  },

  // =========================================================================
  // DOMAIN C — HISTOLOGY & MICROSCOPIC ANATOMY
  // =========================================================================
  {
    id: 'edu-hist-four-primary-tissues',
    domainId: 'histology',
    chapterTitle: 'Primary Human Tissues & Staining Principles',
    title: 'Four Primary Tissues & H&E Microscopic Identification',
    summary:
      'Structural classification and functional specializations of epithelial, connective, muscular, and nervous tissues, plus Haematoxylin & Eosin (H&E) staining interpretation.',
    targetTracks: ['secondary_premed', 'medical_foundations', 'allied_health'],
    curriculumMappings: [
      { frameworkId: 'pk_ncp_bio_9_12', gradeOrYear: 'Grade IX', unitOrModule: 'Cells and Tissues (Animal Tissues)', status: 'elective' },
      { frameworkId: 'in_cbse_bio_11_12', gradeOrYear: 'Class XI (Unit II)', unitOrModule: 'Structural Organisation in Animals', status: 'elective' },
      { frameworkId: 'pk_pmdc_mbbs', gradeOrYear: 'MBBS Year 1', unitOrModule: 'General & Systemic Histology', status: 'compulsory' },
      { frameworkId: 'au_wa_human_bio', gradeOrYear: 'Year 11 (Unit 1)', unitOrModule: 'Cells, Tissues & Organ Systems', status: 'elective' },
    ],
    learningObjectives: [
      'Classify epithelia by cell layers (simple vs stratified) and apical cell shape (squamous, cuboidal, columnar).',
      'Differentiate skeletal, cardiac, and smooth muscle on microscopic criteria (striations, nuclei, intercalated discs).',
      'Interpret basophilic (purple/blue) versus eosinophilic (pink) staining in routine H&E tissue sections.',
    ],
    depthExplanations: {
      secondary_premed:
        'Animal tissues fall into four major classes: epithelial tissue covers surfaces and lines cavities, connective tissue supports and binds (bone, cartilage, blood, loose/dense fibrous tissue), muscle tissue contracts for movement, and nervous tissue conducts electrical impulses.',
      medical_foundations:
        'Routine H&E staining pairs basic haematoxylin (binds negatively charged nucleic acids/rER → blue-purple) with acidic eosin (binds basic cytoplasmic proteins/collagen → pink). Epithelial polarity rests on a basement membrane; cardiac myocytes feature central nuclei, branching fibres, and intercalated discs; smooth muscle lacks sarcomeric striations and has fusiform central nuclei.',
      allied_health:
        'Recognizing normal mucosal, vascular, and muscular tissue layers supports understanding wound healing, biopsy reports, and organ barrier integrity.',
    },
    keyConcepts: [
      { term: 'Haematoxylin (Basophilic)', definition: 'Basic dye staining acidic structures (DNA, RNA-rich nuclei) blue-purple.' },
      { term: 'Eosin (Acidophilic)', definition: 'Acidic dye staining basic structures (cytoplasmic proteins, collagen, RBCs) pink-red.' },
      { term: 'Intercalated Discs', definition: 'Specialized junctional complexes (desmosomes + gap junctions) unique to cardiac muscle.' },
    ],
    keyFacts: [
      'Anatomy 360 includes 10 structured histology tissue entries with self-checks in the Histology Library.',
      'Real licensed light-microscopy slide photographs are explicitly marked as Asset Required until verified CC-BY slides are integrated.',
    ],
    crossSubjectLinks: [
      { domainId: 'human_anatomy', relation: 'Microscopic tissue layers compose the macroscopic walls of vessels, airways, and GI organs.' },
      { domainId: 'pathology', relation: 'Histopathology detects cellular atypia, inflammation, and fibrosis relative to normal tissue architecture.' },
    ],
    relatedSystems: ['cardiovascular', 'respiratory', 'digestive', 'integumentary'],
    relatedFmaConceptIds: ['FMA7088', 'FMA7197', 'FMA7203'],
    visualFormats: ['microscopy', '2d_diagram', '3d_anatomy'],
    diagram: {
      id: 'diag-four-tissues',
      title: 'Four Primary Human Tissue Classes',
      kind: 'comparison',
      caption: 'Core structural hallmarks distinguishing the four primary tissue classes.',
      disclaimer: 'Conceptual classification chart — NOT a substitute for real light-microscopy slides.',
      nodes: [
        { id: 't1', label: 'Epithelial', sublabel: 'Polarized sheets, basement membrane, avascular', tone: 'teal' },
        { id: 't2', label: 'Connective', sublabel: 'Abundant ECM, collagen/elastin, bone/blood', tone: 'amber' },
        { id: 't3', label: 'Muscular', sublabel: 'Skeletal, cardiac (intercalated discs), smooth', tone: 'rose' },
        { id: 't4', label: 'Nervous', sublabel: 'Neurons + CNS/PNS neuroglia', tone: 'blue' },
      ],
    },
    assetDisclosure: {
      status: 'asset_required',
      summary:
        'Real licensed H&E microscopy photomicrographs with stain, magnification, and scale-bar metadata are not yet populated in the Histology Library. Do not treat diagrams as real microscopy specimens.',
      missingAssets: ['Licensed H&E light-microscopy images for epithelium, connective tissue, muscle, nerve, and major organs'],
    },
    selfChecks: [
      {
        id: 'q-edu-hist-1',
        question: 'Which microscopic feature specifically distinguishes cardiac muscle from skeletal muscle?',
        options: [
          'Presence of actin and myosin filaments',
          'Branching fibres joined by intercalated discs with central nuclei',
          'Absence of sarcomeric striations',
          'Multinucleated peripheral nuclei',
        ],
        correctIndex: 1,
        explanation: 'Cardiac myocytes are striated and branched with 1–2 central nuclei and intercalated discs containing desmosomes and gap junctions.',
        level: 'medical_foundations',
      },
    ],
    sources: [
      { title: 'Anatomy and Physiology 2e — Chapter 4: The Tissue Level of Organization', authority: 'OpenStax (CC BY 4.0)', supports: 'Primary tissue classification and functional histology' },
    ],
    reviewStatus: 'structured_reference',
  },

  // =========================================================================
  // DOMAIN D — EMBRYOLOGY & HUMAN DEVELOPMENT
  // =========================================================================
  {
    id: 'edu-embryo-early-development',
    domainId: 'embryology',
    chapterTitle: 'Early Human Development & Organogenesis',
    title: 'Fertilisation, Gastrulation (Germ Layers), Neurulation & Placenta',
    summary:
      'Developmental progression from zygote and blastocyst implantation through trilaminar germ disc formation (ectoderm, mesoderm, endoderm), neural tube closure, and uteroplacental exchange.',
    targetTracks: ['secondary_premed', 'medical_foundations'],
    curriculumMappings: [
      { frameworkId: 'pk_ncp_bio_9_12', gradeOrYear: 'Grade XII', unitOrModule: 'Reproduction & Growth and Development', status: 'elective' },
      { frameworkId: 'in_cbse_bio_11_12', gradeOrYear: 'Class XII (Unit VI)', unitOrModule: 'Human Reproduction & Embryonic Development', status: 'elective' },
      { frameworkId: 'pk_pmdc_mbbs', gradeOrYear: 'MBBS Years 1–2', unitOrModule: 'General & Systemic Embryology', status: 'compulsory' },
      { frameworkId: 'au_wa_human_bio', gradeOrYear: 'Year 11 (Unit 2)', unitOrModule: 'Human Reproduction & Development', status: 'elective' },
    ],
    learningObjectives: [
      'Sequence cleavage, morula, blastocyst implantation, gastrulation, and neurulation across weeks 1–4 of human development.',
      'Map major organ systems to ectoderm, mesoderm, and endoderm derivatives.',
      'Explain how incomplete neural tube closure relates to neural tube defects and maternal folate status.',
    ],
    depthExplanations: {
      secondary_premed:
        'After fertilisation in the uterine tube, the zygote undergoes mitotic cleavage to form a blastocyst that implants in the endometrium. During gastrulation, cells organize into three primary germ layers: ectoderm (skin and nervous system), mesoderm (muscle, bone, heart, blood, kidneys), and endoderm (lining of the digestive and respiratory tracts).',
      medical_foundations:
        'Week 2 establishes the bilaminar disc (epiblast/hypoblast); Week 3 gastrulation through the primitive streak generates all three definitive germ layers from epiblast cells. Notochordal signalling induces overlying neuroectoderm to form the neural plate and neural tube (neurulation, Weeks 3–4), while neural crest cells migrate to form PNS ganglia, craniofacial cartilage, melanocytes, and adrenal medulla. The chorionic villi and maternal decidua basalis form the haemochorial placenta.',
    },
    keyConcepts: [
      { term: 'Gastrulation (Week 3)', definition: 'Epiblast migration through the primitive streak establishing ectoderm, mesoderm, and endoderm.' },
      { term: 'Neurulation', definition: 'Folding of the neural plate into the neural tube (CNS precursor) with migrating neural crest cells.' },
      { term: 'Teratogen', definition: 'Environmental agent (drug, infection, radiation) capable of disrupting organogenesis, highest sensitivity in Weeks 3–8.' },
    ],
    keyFacts: [
      'The embryonic period (Weeks 3–8) is the period of major organogenesis and highest vulnerability to structural congenital anomalies.',
      'The cardiovascular system is the first major organ system to become functional in the human embryo (beating around Week 4).',
    ],
    crossSubjectLinks: [
      { domainId: 'human_anatomy', relation: 'Embryonic folding and pharyngeal arches explain adult cranial nerve and vascular trajectories.' },
      { domainId: 'nutrition_health', relation: 'Periconceptional folate sufficiency reduces risk of neural tube closure defects.' },
    ],
    relatedSystems: ['reproductive', 'nervous', 'cardiovascular'],
    relatedFmaConceptIds: ['FMA50801', 'FMA7647', 'FMA7088'],
    visualFormats: ['2d_diagram', 'structured_text'],
    diagram: {
      id: 'diag-germ-layers',
      title: 'Trilaminar Germ Disc Derivatives (Week 3)',
      kind: 'hierarchy',
      caption: 'All adult human organs arise from three primary embryonic germ layers.',
      disclaimer: 'Conceptual 2D developmental overview; staged 3D Carnegie embryonic meshes are not included in the current adult atlas.',
      nodes: [
        { id: 'g1', label: 'Ectoderm', sublabel: 'CNS, PNS (neural crest), epidermis, lens', tone: 'blue' },
        { id: 'g2', label: 'Mesoderm', sublabel: 'Muscle, bone, heart, blood, kidneys, gonads', tone: 'rose' },
        { id: 'g3', label: 'Endoderm', sublabel: 'GI/respiratory epithelium, liver, pancreas, thyroid', tone: 'emerald' },
      ],
    },
    assetDisclosure: {
      status: 'conceptual_diagram_only',
      summary: 'Conceptual developmental diagrams; staged embryonic 3D meshes are not part of the adult male BodyParts3D reference dataset.',
    },
    selfChecks: [
      {
        id: 'q-edu-embryo-1',
        question: 'Which primary germ layer gives rise to the heart, skeletal muscle, bone, and kidneys?',
        options: ['Ectoderm', 'Mesoderm', 'Endoderm', 'Trophoblast'],
        correctIndex: 1,
        explanation: 'Mesoderm differentiates into paraxial (somites: axial skeleton/skeletal muscle), intermediate (kidneys/gonads), and lateral plate (heart/blood/serosa) derivatives.',
        level: 'secondary_premed',
      },
    ],
    sources: [
      { title: 'Anatomy and Physiology 2e — Chapter 28: Development and Inheritance', authority: 'OpenStax (CC BY 4.0)', supports: 'Fertilisation, cleavage, gastrulation, and placental physiology' },
    ],
    reviewStatus: 'structured_reference',
  },

  // =========================================================================
  // DOMAIN E — HUMAN PHYSIOLOGY & HOMEOSTASIS
  // =========================================================================
  {
    id: 'edu-phys-homeostasis-cardiopulm',
    domainId: 'human_physiology',
    chapterTitle: 'Homeostasis, Excitable Membranes & Organ Physiology',
    title: 'Negative Feedback, Action Potentials & Integrated Cardiopulmonary Physiology',
    summary:
      'Principles of homeostatic feedback loops, neuronal action potentials, cardiac output (CO = HR × SV), alveolar gas exchange, and renal filtration linked to Anatomy 360’s interactive physiology simulators.',
    targetTracks: ['school_foundations', 'secondary_premed', 'medical_foundations', 'clinical_applied', 'allied_health'],
    curriculumMappings: [
      { frameworkId: 'pk_ncp_gs_4_8', gradeOrYear: 'Grades 7–8', unitOrModule: 'Human Organ Systems (Respiration, Circulation, Excretion)', status: 'compulsory' },
      { frameworkId: 'pk_ncp_bio_9_12', gradeOrYear: 'Grades X–XII', unitOrModule: 'Gaseous Exchange, Homeostasis, Coordination & Control', status: 'elective' },
      { frameworkId: 'in_cbse_bio_11_12', gradeOrYear: 'Class XI (Unit V)', unitOrModule: 'Human Physiology (Breathing, Body Fluids, Excretion, Neural/Chemical Control)', status: 'elective' },
      { frameworkId: 'au_wa_human_bio', gradeOrYear: 'Year 12 (Unit 3)', unitOrModule: 'Homeostasis, Nervous & Endocrine Systems', status: 'elective' },
      { frameworkId: 'pk_pmdc_mbbs', gradeOrYear: 'MBBS Years 1–2', unitOrModule: 'Human Physiology (~450 hrs Pakistan reference)', status: 'compulsory' },
      { frameworkId: 'hms_pathways', gradeOrYear: 'MD Year 1', unitOrModule: 'Homeostasis I & II', status: 'institution_specific' },
    ],
    learningObjectives: [
      'Identify sensor, control centre, and effector components in negative-feedback homeostasis (e.g., baroreceptor reflex, thermoregulation).',
      'Explain voltage-gated Na+ depolarization and K+ repolarization in neuronal action potentials.',
      'Apply CO = HR × SV and MAP ≈ CO × SVR to explain cardiovascular adjustments during exercise or hypovolaemia.',
    ],
    depthExplanations: {
      school_foundations:
        'Homeostasis is how your body keeps internal conditions steady—like body temperature, water levels, and oxygen delivery—even when the outside world changes. Your heart pumps faster during exercise so muscles receive more oxygen-rich blood.',
      secondary_premed:
        'Negative feedback opposes deviations from a physiological set point. In neurons, threshold depolarization opens voltage-gated Na+ channels (upstroke), followed by Na+ inactivation and voltage-gated K+ efflux (repolarization). In circulation, cardiac output equals heart rate multiplied by stroke volume (CO = HR × SV).',
      medical_foundations:
        'Integrated organ physiology couples Frank-Starling preload mechanics, autonomic chronotropy/inotropy, arterial baroreceptor buffering of mean arterial pressure (MAP ≈ CO × SVR), ventilation-perfusion (V/Q) matching in the lung, Starling forces governing glomerular filtration rate (GFR), and renal/respiratory compensation of acid-base balance (Henderson-Hasselbalch).',
      clinical_applied:
        'Shock states, respiratory failure, and acute kidney injury represent breakdowns of these core physiological relationships—e.g., reduced preload lowering SV in hypovolaemic shock, triggering baroreceptor-mediated reflex tachycardia and vasoconstriction.',
      allied_health:
        'Vital signs (heart rate, blood pressure, respiratory rate, SpO2, temperature) directly reflect cardiopulmonary and autonomic homeostasis at the bedside.',
    },
    keyConcepts: [
      { term: 'Negative Feedback', definition: 'Regulatory loop where the physiological response counteracts the initial deviation from set point.' },
      { term: 'Cardiac Output (CO)', definition: 'Volume of blood pumped per ventricle per minute: CO = Heart Rate × Stroke Volume (~5 L/min at rest).' },
      { term: 'Action Potential', definition: 'All-or-none transient membrane depolarization propagating along excitable axons and myocytes.' },
    ],
    keyFacts: [
      'Anatomy 360 provides 4 validated interactive quantitative simulations (Cardiac, Respiratory, Renal, Musculoskeletal) in the Physiology Lab.',
      'The Endocrine Feedback simulator remains explicitly marked Planned until validated parameter equations are completed.',
    ],
    crossSubjectLinks: [
      { domainId: 'human_anatomy', relation: 'Cardiac chambers, pulmonary alveoli, and nephron vasculature physically execute these physiological laws.' },
      { domainId: 'pharmacology', relation: 'Beta-blockers, ACE inhibitors, and diuretics modulate HR, SVR, and preload.' },
    ],
    relatedSystems: ['cardiovascular', 'respiratory', 'urinary', 'nervous', 'endocrine'],
    relatedFmaConceptIds: ['FMA7088', 'FMA7309', 'FMA7203', 'FMA50801'],
    visualFormats: ['quantitative_simulation', '2d_diagram', '3d_anatomy'],
    diagram: {
      id: 'diag-baroreceptor-loop',
      title: 'Arterial Baroreceptor Negative-Feedback Loop',
      kind: 'cycle',
      caption: 'Short-term blood pressure regulation linking vascular stretch receptors, brainstem medulla, and cardiac/vascular effectors.',
      disclaimer: 'Conceptual physiological feedback diagram; use Physiology Lab for quantitative cardiac/respiratory/renal calculators.',
      nodes: [
        { id: 'p1', label: 'Stimulus: Drop in MAP', sublabel: 'e.g., standing up or fluid loss', tone: 'rose' },
        { id: 'p2', label: 'Baroreceptors', sublabel: 'Carotid sinus & aortic arch (↓ firing)', tone: 'amber' },
        { id: 'p3', label: 'Medullary Control Centre', sublabel: '↑ Sympathetic, ↓ Parasympathetic', tone: 'blue' },
        { id: 'p4', label: 'Effectors: Heart & Arterioles', sublabel: '↑ HR, ↑ contractility, ↑ SVR → restores MAP', tone: 'emerald' },
      ],
    },
    assetDisclosure: {
      status: 'partial',
      summary: '4 interactive quantitative models live in Physiology Lab; endocrine, ECG, and acid-base numerical simulators are planned and not fabricated.',
    },
    activity: {
      title: 'Quantitative Cardiac Output Exploration',
      kind: 'calculation',
      prompt: 'Open the Physiology Simulation Lab and compare resting Cardiac Output (HR 70 bpm, SV 70 mL) against moderate exercise (HR 130 bpm, SV 100 mL).',
      keyTakeaway: 'Resting CO is ~4.9 L/min; exercise CO rises to ~13.0 L/min through combined increases in both heart rate and stroke volume.',
    },
    selfChecks: [
      {
        id: 'q-edu-phys-1',
        question: 'Which ion movement is directly responsible for the rapid depolarization (upstroke) of a typical neuronal action potential?',
        options: [
          'K+ efflux through voltage-gated potassium channels',
          'Na+ influx through voltage-gated sodium channels',
          'Cl- efflux through ligand-gated channels',
          'Ca2+ extrusion via plasma-membrane pumps',
        ],
        correctIndex: 1,
        explanation: 'Once threshold is reached, rapid opening of voltage-gated Na+ channels drives Na+ into the cell, depolarizing the membrane toward E_Na.',
        level: 'secondary_premed',
      },
    ],
    sources: [
      { title: 'Anatomy and Physiology 2e — Chapters 12, 19, 22, 25', authority: 'OpenStax (CC BY 4.0)', supports: 'Action potentials, cardiovascular, respiratory, and renal physiology' },
    ],
    reviewStatus: 'structured_reference',
  },

  // =========================================================================
  // DOMAIN F — BIOCHEMISTRY & HUMAN METABOLISM
  // =========================================================================
  {
    id: 'edu-biochem-enzymes-bioenergetics',
    domainId: 'biochemistry',
    chapterTitle: 'Biomolecules, Enzymes & Cellular Energy Metabolism',
    title: 'Enzymes, Glycolysis, Citric Acid Cycle & Oxidative Phosphorylation',
    summary:
      'Structure-function of biological macromolecules, enzyme kinetics (Km/Vmax, inhibition), and integrated ATP generation from glucose across cytosol and mitochondria.',
    targetTracks: ['secondary_premed', 'medical_foundations', 'allied_health'],
    curriculumMappings: [
      { frameworkId: 'pk_ncp_bio_9_12', gradeOrYear: 'Grade XI', unitOrModule: 'Biological Molecules, Enzymes & Bioenergetics', status: 'elective' },
      { frameworkId: 'in_cbse_bio_11_12', gradeOrYear: 'Class XI (Unit III)', unitOrModule: 'Biomolecules & Cellular Respiration', status: 'elective' },
      { frameworkId: 'us_ap_bio', gradeOrYear: 'AP Bio Units 1 & 3', unitOrModule: 'Chemistry of Life & Cellular Energetics', status: 'optional' },
      { frameworkId: 'pk_pmdc_mbbs', gradeOrYear: 'MBBS Years 1–2', unitOrModule: 'Medical Biochemistry (~250 hrs Pakistan reference)', status: 'compulsory' },
      { frameworkId: 'ox_preclinical', gradeOrYear: 'Year 1', unitOrModule: 'Biochemistry and Medical Genetics', status: 'institution_specific' },
    ],
    learningObjectives: [
      'Explain how enzymes lower activation energy and distinguish competitive from non-competitive inhibition.',
      'Trace carbon and electron carriers (NADH, FADH2) from glycolysis through pyruvate dehydrogenase, the citric acid cycle, and oxidative phosphorylation.',
      'Compare aerobic ATP yield with anaerobic lactate fermentation during intense muscle activity or tissue hypoxia.',
    ],
    depthExplanations: {
      secondary_premed:
        'Enzymes are protein catalysts that speed up biochemical reactions by lowering activation energy without being consumed. Cellular respiration breaks down glucose in three main stages: glycolysis in the cytoplasm (net 2 ATP + 2 pyruvate), the Krebs (citric acid) cycle in the mitochondrial matrix, and the electron transport chain on the inner mitochondrial membrane producing most of the cell’s ATP.',
      medical_foundations:
        'Michaelis-Menten kinetics quantify substrate affinity (Km) and maximal velocity (Vmax): competitive inhibitors raise apparent Km without changing Vmax, whereas non-competitive inhibitors reduce Vmax. Key irreversible regulatory steps of glycolysis (hexokinase/glucokinase, PFK-1, pyruvate kinase) integrate insulin/glucagon signalling with liver glycogenolysis, gluconeogenesis, and fatty-acid beta-oxidation.',
      allied_health:
        'Tissue hypoperfusion shifts cells from oxidative phosphorylation to anaerobic glycolysis, elevating serum lactate—a core clinical indicator of cellular hypoxia.',
    },
    keyConcepts: [
      { term: 'PFK-1 (Phosphofructokinase-1)', definition: 'Primary committed rate-limiting enzyme of glycolysis, inhibited by ATP/citrate and activated by AMP/fructose-2,6-bisphosphate.' },
      { term: 'Chemiosmosis', definition: 'Proton gradient across the inner mitochondrial membrane driving ATP synthase.' },
      { term: 'Km (Michaelis Constant)', definition: 'Substrate concentration at which reaction velocity equals half of Vmax (inversely related to affinity).' },
    ],
    keyFacts: [
      'Mature red blood cells lack mitochondria and depend exclusively on glycolysis for ATP.',
      'Complete aerobic oxidation of 1 glucose yields ~30–32 ATP, versus 2 net ATP in anaerobic glycolysis.',
    ],
    crossSubjectLinks: [
      { domainId: 'cell_biology', relation: 'Glycolysis occurs in the cytosol; TCA cycle and ETC occur in mitochondria.' },
      { domainId: 'pathology', relation: 'Ischaemia halts oxidative phosphorylation, depleting ATP and triggering cellular swelling and injury.' },
    ],
    relatedSystems: ['digestive', 'muscular', 'endocrine'],
    relatedFmaConceptIds: ['FMA7197', 'FMA7198'],
    visualFormats: ['2d_diagram', 'structured_text'],
    diagram: {
      id: 'diag-cellular-respiration',
      title: 'Aerobic Cellular Respiration Pathway',
      kind: 'pathway',
      caption: 'Sequential oxidation of glucose to CO2, H2O, and ATP across cytosol and mitochondria.',
      disclaimer: 'Conceptual biochemical pathway schematic.',
      nodes: [
        { id: 'b1', label: 'Glycolysis (Cytosol)', sublabel: 'Glucose → 2 Pyruvate + 2 ATP + 2 NADH', tone: 'blue' },
        { id: 'b2', label: 'Pyruvate → Acetyl-CoA', sublabel: 'PDH complex (Mitochondrial matrix)', tone: 'teal' },
        { id: 'b3', label: 'Citric Acid Cycle', sublabel: 'CO2 + NADH + FADH2 + GTP', tone: 'amber' },
        { id: 'b4', label: 'Oxidative Phosphorylation', sublabel: 'ETC + ATP Synthase (~30–32 total ATP)', tone: 'emerald' },
      ],
    },
    assetDisclosure: {
      status: 'conceptual_diagram_only',
      summary: '2D pathway diagram appropriate for metabolic learning; links to Liver (FMA7197) and Pancreas (FMA7198) for organ-level metabolic integration.',
    },
    selfChecks: [
      {
        id: 'q-edu-biochem-1',
        question: 'How does a classic competitive enzyme inhibitor affect apparent Km and Vmax?',
        options: [
          'Increases apparent Km; Vmax remains unchanged',
          'Decreases apparent Km; Vmax decreases',
          'Km remains unchanged; Vmax decreases',
          'Increases both Km and Vmax',
        ],
        correctIndex: 0,
        explanation: 'A competitive inhibitor competes at the active site and can be overcome by high substrate concentration, so Vmax is unchanged while apparent Km increases.',
        level: 'medical_foundations',
      },
    ],
    sources: [
      { title: 'Biology 2e — Chapters 6 & 7: Metabolism and Cellular Respiration', authority: 'OpenStax (CC BY 4.0)', supports: 'Enzyme kinetics, glycolysis, citric acid cycle, and oxidative phosphorylation' },
    ],
    reviewStatus: 'structured_reference',
  },

  // =========================================================================
  // DOMAIN G — MOLECULAR BIOLOGY & HUMAN GENETICS
  // =========================================================================
  {
    id: 'edu-genetics-central-dogma-inheritance',
    domainId: 'molecular_genetics',
    chapterTitle: 'Gene Expression & Human Inheritance',
    title: 'Central Dogma, Gene Regulation & Mendelian/Non-Mendelian Inheritance',
    summary:
      'DNA replication, transcription, RNA processing, ribosomal translation, point/frameshift mutations, autosomal/X-linked pedigree patterns, and introductory pharmacogenetics.',
    targetTracks: ['secondary_premed', 'medical_foundations'],
    curriculumMappings: [
      { frameworkId: 'pk_ncp_bio_9_12', gradeOrYear: 'Grade XII', unitOrModule: 'Chromosomes & DNA; Variation & Genetics', status: 'elective' },
      { frameworkId: 'in_cbse_bio_11_12', gradeOrYear: 'Class XII (Unit VII)', unitOrModule: 'Principles of Inheritance & Molecular Basis of Inheritance', status: 'elective' },
      { frameworkId: 'en_nc_science', gradeOrYear: 'KS4', unitOrModule: 'Inheritance, Variation and Evolution', status: 'compulsory' },
      { frameworkId: 'us_ap_bio', gradeOrYear: 'AP Bio Units 5 & 6', unitOrModule: 'Heredity & Gene Expression and Regulation', status: 'optional' },
      { frameworkId: 'cn_moe_bio_2022', gradeOrYear: 'Grades 7–9', unitOrModule: 'Heredity and Variation', status: 'compulsory' },
    ],
    learningObjectives: [
      'Trace information flow from DNA replication to mRNA transcription, splicing, and polypeptide translation.',
      'Differentiate silent, missense, nonsense, and frameshift mutations.',
      'Interpret autosomal dominant, autosomal recessive, X-linked recessive, and mitochondrial inheritance patterns.',
    ],
    depthExplanations: {
      secondary_premed:
        'DNA stores genetic information in complementary base pairs (A–T, G–C). During transcription, RNA polymerase copies a gene into mRNA; during translation, ribosomes read three-base codons using tRNA anticodons to assemble amino acids into proteins. Traits follow Mendelian dominance/recessiveness or sex-linked patterns.',
      medical_foundations:
        'Eukaryotic gene expression integrates chromatin remodelling, promoter/enhancer transcription factors, 5′-capping, polyadenylation, and alternative splicing. Clinical genetics distinguishes locus heterogeneity, variable expressivity, incomplete penetrance, imprinting, and trinucleotide repeat expansion. Pharmacogenetic variants (e.g., CYP450 alleles) alter drug metabolism rates.',
    },
    keyConcepts: [
      { term: 'Semi-Conservative Replication', definition: 'Each daughter DNA duplex retains one parental template strand and one newly synthesized strand.' },
      { term: 'Frameshift Mutation', definition: 'Insertion or deletion of nucleotides not divisible by 3, altering the downstream reading frame.' },
      { term: 'X-Linked Recessive', definition: 'Inheritance pattern affecting hemizygous males more frequently, with no male-to-male transmission.' },
    ],
    keyFacts: [
      'Human somatic cells contain 46 chromosomes (22 autosomal pairs + 1 sex-chromosome pair).',
      'Mitochondrial DNA is inherited almost exclusively from the mother.',
    ],
    crossSubjectLinks: [
      { domainId: 'pharmacology', relation: 'CYP450 genetic polymorphisms influence drug activation and toxicity (pharmacogenetics).' },
      { domainId: 'pathology', relation: 'Proto-oncogene activation and tumour-suppressor inactivation underlie cancer genetics.' },
    ],
    relatedSystems: ['reproductive'],
    relatedFmaConceptIds: [],
    visualFormats: ['2d_diagram', 'structured_text'],
    diagram: {
      id: 'diag-central-dogma',
      title: 'Central Dogma of Molecular Biology',
      kind: 'pathway',
      caption: 'Directional flow of genetic information from nuclear DNA to functional folded protein.',
      disclaimer: 'Conceptual molecular diagram.',
      nodes: [
        { id: 'm1', label: 'DNA (Double Helix)', sublabel: 'Semi-conservative replication (DNA Pol)', tone: 'blue' },
        { id: 'm2', label: 'Pre-mRNA → Mature mRNA', sublabel: 'Transcription & intron splicing', tone: 'teal' },
        { id: 'm3', label: 'Ribosome + tRNA', sublabel: 'Codon translation (5′ → 3′)', tone: 'amber' },
        { id: 'm4', label: 'Functional Protein', sublabel: 'Folding & post-translational modification', tone: 'emerald' },
      ],
    },
    assetDisclosure: {
      status: 'conceptual_diagram_only',
      summary: 'Conceptual molecular pathway diagram and inheritance reasoning exercises.',
    },
    activity: {
      title: 'Pedigree Pattern Reasoning',
      kind: 'interpretation',
      prompt: 'A trait skips generations, appears in both males and females equally, and arises in children of unaffected carrier parents. Which Mendelian pattern fits best?',
      keyTakeaway: 'Autosomal recessive inheritance (both parents are heterozygous carriers, giving a 25% recurrence probability per pregnancy).',
    },
    selfChecks: [
      {
        id: 'q-edu-gen-1',
        question: 'Which mutation type changes a single codon into a premature stop codon, truncating the resulting protein?',
        options: ['Silent mutation', 'Missense mutation', 'Nonsense mutation', 'Synonymous substitution'],
        correctIndex: 2,
        explanation: 'A nonsense mutation converts an amino-acid-coding codon into a stop codon (UAA, UAG, or UGA), causing premature termination of translation.',
        level: 'secondary_premed',
      },
    ],
    sources: [
      { title: 'Biology 2e — Chapters 12, 14, 15: Mendel, DNA Structure, and Genes/Proteins', authority: 'OpenStax (CC BY 4.0)', supports: 'Central dogma and Mendelian genetics' },
    ],
    reviewStatus: 'structured_reference',
  },

  // =========================================================================
  // DOMAIN H — MICROBIOLOGY & PARASITOLOGY
  // =========================================================================
  {
    id: 'edu-micro-pathogens-amr',
    domainId: 'microbiology_parasitology',
    chapterTitle: 'Medically Significant Microbes & Infection Control',
    title: 'Bacteria, Viruses, Fungi, Parasites & Antimicrobial Resistance',
    summary:
      'Structural differences across major pathogen groups, Gram-positive vs Gram-negative cell walls, transmission routes, sterilisation vs disinfection, and mechanisms of antimicrobial resistance (AMR).',
    targetTracks: ['school_foundations', 'secondary_premed', 'medical_foundations', 'allied_health'],
    curriculumMappings: [
      { frameworkId: 'pk_ncp_gs_4_8', gradeOrYear: 'Grades 5–8', unitOrModule: 'Microorganisms & Health/Hygiene', status: 'compulsory' },
      { frameworkId: 'pk_ncp_bio_9_12', gradeOrYear: 'Grade XI', unitOrModule: 'Acellular Life, Prokaryotes & Fungi', status: 'elective' },
      { frameworkId: 'in_cbse_bio_11_12', gradeOrYear: 'Class XII (Unit VIII)', unitOrModule: 'Human Health and Disease (Pathogens)', status: 'elective' },
      { frameworkId: 'en_nc_science', gradeOrYear: 'KS4', unitOrModule: 'Infection and Response', status: 'compulsory' },
      { frameworkId: 'pk_pmdc_mbbs', gradeOrYear: 'MBBS Year 3', unitOrModule: 'Medical Microbiology & Parasitology', status: 'compulsory' },
    ],
    learningObjectives: [
      'Compare cellular structure and replication strategies of bacteria, viruses, fungi, protozoa, and helminths.',
      'Contrast Gram-positive (thick peptidoglycan) and Gram-negative (thin peptidoglycan + outer LPS membrane) bacteria.',
      'Explain why antibiotics do not treat viral infections and how misuse accelerates antimicrobial resistance.',
    ],
    depthExplanations: {
      school_foundations:
        'Microorganisms include bacteria, viruses, fungi, and tiny parasites. Many microbes are helpful (such as gut bacteria), while pathogens cause infectious diseases. Handwashing, clean water, safe food handling, and vaccines help stop infections from spreading.',
      secondary_premed:
        'Bacteria are prokaryotic cells with peptidoglycan cell walls; viruses are acellular obligate intracellular parasites requiring host machinery; fungi are eukaryotic organisms with chitin cell walls. Transmission occurs via respiratory droplets, faeco-oral contamination, vectors, blood/body fluids, or direct contact.',
      medical_foundations:
        'Gram-negative outer membranes contain lipopolysaccharide (endotoxin, lipid A) capable of triggering septic shock cascades. Sterilisation eliminates all microbial life including bacterial spores (e.g., autoclaving at 121°C), whereas disinfection reduces vegetative pathogens on inanimate surfaces. AMR arises via target modification, efflux pumps, reduced permeability, and drug-inactivating enzymes (e.g., beta-lactamases) spread via plasmids.',
      allied_health:
        'Standard precautions, hand hygiene, aseptic technique, and responsible antimicrobial stewardship are core frontline barriers against healthcare-associated infections.',
    },
    keyConcepts: [
      { term: 'Gram-Positive vs Gram-Negative', definition: 'Gram+ retains crystal violet via thick peptidoglycan; Gram− has thin peptidoglycan plus an outer LPS membrane.' },
      { term: 'Sterilisation', definition: 'Complete destruction of all viable microorganisms, including resistant bacterial endospores.' },
      { term: 'Antimicrobial Resistance (AMR)', definition: 'Evolution of microbes to survive exposure to antimicrobial agents that previously inhibited or killed them.' },
    ],
    keyFacts: [
      'Antibiotics target bacterial structures (e.g., peptidoglycan wall or 70S ribosomes) and are ineffective against viruses.',
      'Horizontal gene transfer (conjugation, transformation, transduction) rapidly disseminates resistance genes across bacterial populations.',
    ],
    crossSubjectLinks: [
      { domainId: 'immunology', relation: 'Pathogen-associated molecular patterns (PAMPs) activate innate Toll-like receptors.' },
      { domainId: 'pharmacology', relation: 'Antimicrobial drug classes selectively target bacterial cell wall, protein synthesis, or nucleic acid pathways.' },
    ],
    relatedSystems: ['respiratory', 'digestive', 'lymphatic'],
    relatedFmaConceptIds: ['FMA7309', 'FMA7148'],
    visualFormats: ['2d_diagram', 'microscopy', 'structured_text'],
    diagram: {
      id: 'diag-microbe-classes',
      title: 'Major Medically Significant Pathogen Groups',
      kind: 'comparison',
      caption: 'Structural organization distinguishes therapeutic targets across pathogen groups.',
      disclaimer: 'Conceptual schematic — genuine Gram-stain and parasitology microscopy slides are marked Asset Required.',
      nodes: [
        { id: 'mc1', label: 'Bacteria (Prokaryotes)', sublabel: 'Peptidoglycan wall, 70S ribosomes', tone: 'teal' },
        { id: 'mc2', label: 'Viruses (Acellular)', sublabel: 'DNA/RNA + capsid; obligate intracellular', tone: 'rose' },
        { id: 'mc3', label: 'Fungi (Eukaryotes)', sublabel: 'Chitin wall, ergosterol membrane', tone: 'amber' },
        { id: 'mc4', label: 'Protozoa & Helminths', sublabel: 'Unicellular & multicellular parasites', tone: 'blue' },
      ],
    },
    assetDisclosure: {
      status: 'asset_required',
      summary: 'Text and 2D comparative diagrams implemented; licensed Gram-stain and parasitology photomicrographs are not yet bundled.',
      missingAssets: ['Licensed Gram-stain, AFB, fungal, and parasitology reference photomicrographs'],
    },
    selfChecks: [
      {
        id: 'q-edu-micro-1',
        question: 'Why are beta-lactam antibiotics (such as penicillins) ineffective against viral respiratory infections?',
        options: [
          'Viruses possess a thicker peptidoglycan wall than bacteria',
          'Viruses are acellular and lack peptidoglycan cell walls targeted by beta-lactams',
          'Viruses neutralize antibiotics using fungal chitin',
          'Beta-lactams only work in the gastrointestinal tract',
        ],
        correctIndex: 1,
        explanation: 'Beta-lactams inhibit bacterial peptidoglycan cross-linking; viruses have no cell wall or bacterial cell-wall enzymes.',
        level: 'secondary_premed',
      },
    ],
    sources: [
      { title: 'Microbiology — Chapters 3, 6, 13, 14', authority: 'OpenStax (CC BY 4.0)', url: 'https://openstax.org/books/microbiology/pages/1-introduction', supports: 'Microbial classification, sterilisation, and antimicrobial resistance' },
    ],
    reviewStatus: 'structured_reference',
  },
];
