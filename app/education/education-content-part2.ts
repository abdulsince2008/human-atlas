import type { EducationTopic } from './education-types';

/**
 * Domains I–P: Immunology, General & Systemic Pathology, Pharmacology,
 * Nutrition & Health, Haematology & Lab Medicine, Radiology & Imaging,
 * Clinical Specialties, and Clinical Skills & Public Health.
 */
export const EDUCATION_TOPICS_PART_2: EducationTopic[] = [
  // =========================================================================
  // DOMAIN I — IMMUNOLOGY
  // =========================================================================
  {
    id: 'edu-immuno-innate-adaptive-vaccines',
    domainId: 'immunology',
    chapterTitle: 'Host Defence, Lymphoid Organs & Immunisation',
    title: 'Innate vs Adaptive Immunity, MHC Presentation & Vaccination',
    summary:
      'Physical/cellular innate barriers, complement, antigen presentation via MHC I & II, humoral (B-cell/antibody) and cell-mediated (T-cell) immunity, immunological memory, and hypersensitivity concepts.',
    targetTracks: ['school_foundations', 'secondary_premed', 'medical_foundations', 'clinical_applied'],
    curriculumMappings: [
      { frameworkId: 'pk_ncp_gs_4_8', gradeOrYear: 'Grades 6–8', unitOrModule: 'Immunity & Diseases', status: 'compulsory' },
      { frameworkId: 'pk_ncp_bio_9_12', gradeOrYear: 'Grade XI', unitOrModule: 'Immunity (First, Second & Third Lines of Defence)', status: 'elective' },
      { frameworkId: 'in_cbse_bio_11_12', gradeOrYear: 'Class XII (Unit VIII)', unitOrModule: 'Human Health and Disease — Immunity & Vaccination', status: 'elective' },
      { frameworkId: 'au_wa_human_bio', gradeOrYear: 'Year 12 (Unit 4)', unitOrModule: 'Body Defences & Immunity', status: 'elective' },
      { frameworkId: 'hms_pathways', gradeOrYear: 'MD Year 1', unitOrModule: 'Immunity in Defense and Disease', status: 'institution_specific' },
    ],
    learningObjectives: [
      'Contrast rapid, non-specific innate immunity with antigen-specific adaptive immunity and immunological memory.',
      'Differentiate MHC Class I (CD8+ cytotoxic T cells) from MHC Class II (CD4+ helper T cells) antigen presentation.',
      'Explain how active vaccination primes memory B and T cells for a faster, stronger secondary response.',
    ],
    depthExplanations: {
      school_foundations:
        'Your immune system protects you in layers: skin and mucus block germs first, white blood cells attack invaders quickly, and specialized immune cells remember past germs so your body responds much faster the next time—which is how vaccines work.',
      secondary_premed:
        'Innate immunity (skin, phagocytes, NK cells, fever, complement) acts immediately without antigen memory. Adaptive immunity relies on B lymphocytes (differentiating into antibody-secreting plasma cells) and T lymphocytes (helper CD4+ and cytotoxic CD8+), generating memory cells after infection or vaccination.',
      medical_foundations:
        'Pattern-recognition receptors (TLRs) on dendritic cells bridge innate sensing to adaptive priming. Endogenous cytosolic peptides load onto MHC Class I (all nucleated cells → CD8+ T cells), whereas exogenous phagocytosed peptides load onto MHC Class II (APCs → CD4+ T cells). Dysregulated immunity produces Gell-Coombs Types I–IV hypersensitivity, autoimmunity, or immunodeficiency.',
      clinical_applied:
        'Distinguishing active immunisation from passive antibody transfer, recognizing anaphylaxis (Type I IgE-mediated mast-cell degranulation), and understanding immunosuppression risks are central to clinical practice.',
    },
    keyConcepts: [
      { term: 'MHC Class I vs II', definition: 'MHC I presents intracellular antigens to CD8+ T cells; MHC II on APCs presents extracellular antigens to CD4+ T cells.' },
      { term: 'Primary vs Secondary Response', definition: 'Secondary response is faster, higher-affinity, and IgG-predominant due to memory lymphocytes.' },
      { term: 'Thymus & Spleen', definition: 'Thymus is the primary site of T-cell maturation; spleen filters blood-borne antigens.' },
    ],
    keyFacts: [
      'Primary lymphoid organs (bone marrow and thymus) generate and educate lymphocytes; secondary lymphoid organs (lymph nodes, spleen, MALT) initiate adaptive responses.',
      'IgG is the most abundant serum immunoglobulin and crosses the placenta to provide passive neonatal immunity.',
    ],
    crossSubjectLinks: [
      { domainId: 'human_anatomy', relation: 'Inspect real 3D Thymus (FMA9607) and Spleen (FMA7196) meshes in the 3D Explorer.' },
      { domainId: 'microbiology_parasitology', relation: 'Host immune responses target bacterial, viral, fungal, and parasitic antigens.' },
    ],
    relatedSystems: ['lymphatic', 'cardiovascular', 'integumentary'],
    relatedFmaConceptIds: ['FMA9607', 'FMA7196'],
    visualFormats: ['2d_diagram', '3d_anatomy', 'structured_text'],
    diagram: {
      id: 'diag-immune-bridge',
      title: 'Innate-to-Adaptive Immune Cascade',
      kind: 'pathway',
      caption: 'Dendritic cell antigen presentation connects rapid innate sensing to antigen-specific memory.',
      disclaimer: 'Conceptual immunological pathway diagram.',
      nodes: [
        { id: 'im1', label: 'Barrier & Innate Sensors', sublabel: 'Skin/mucosa, neutrophils, macrophages, TLRs', tone: 'teal' },
        { id: 'im2', label: 'Antigen Presentation (APC)', sublabel: 'Dendritic cell MHC I/II → lymph node', tone: 'amber' },
        { id: 'im3', label: 'Adaptive Effectors', sublabel: 'CD4+ Th, CD8+ CTL, B-cell plasma antibodies', tone: 'blue' },
        { id: 'im4', label: 'Immunological Memory', sublabel: 'Rapid IgG secondary response (Vaccination)', tone: 'emerald' },
      ],
    },
    assetDisclosure: {
      status: 'partial',
      summary: 'Linked to verified 3D Thymus (FMA9607) and Spleen (FMA7196) meshes; cellular signalling is presented via 2D conceptual diagrams.',
    },
    selfChecks: [
      {
        id: 'q-edu-imm-1',
        question: 'Antigen-presenting cells (dendritic cells, macrophages, B cells) present extracellularly captured peptides to CD4+ helper T cells via:',
        options: ['MHC Class I molecules', 'MHC Class II molecules', 'Complement C3b', 'IgM pentamers'],
        correctIndex: 1,
        explanation: 'MHC Class II molecules on professional APCs present processed exogenous antigens specifically to CD4+ helper T lymphocytes.',
        level: 'medical_foundations',
      },
    ],
    sources: [
      { title: 'Anatomy and Physiology 2e — Chapter 21: The Lymphatic and Immune System', authority: 'OpenStax (CC BY 4.0)', supports: 'Innate and adaptive immunity, lymphoid organs, and antibodies' },
    ],
    reviewStatus: 'structured_reference',
  },

  // =========================================================================
  // DOMAIN J — GENERAL & SYSTEMIC PATHOLOGY
  // =========================================================================
  {
    id: 'edu-path-injury-inflammation-ischaemia',
    domainId: 'pathology',
    chapterTitle: 'General Pathology Mechanisms',
    title: 'Cellular Adaptation, Injury, Inflammation, Thrombosis & Ischaemia',
    summary:
      'Foundational disease mechanisms: hypertrophy/hyperplasia/atrophy/metaplasia, reversible vs irreversible cell injury, acute vs chronic inflammation, Virchow’s triad, ischaemia/infarction, and neoplasia concepts.',
    targetTracks: ['medical_foundations', 'clinical_applied'],
    curriculumMappings: [
      { frameworkId: 'pk_pmdc_mbbs', gradeOrYear: 'MBBS Years 3–4', unitOrModule: 'General & Systemic Pathology (~500 hrs Pakistan reference)', status: 'compulsory' },
      { frameworkId: 'pk_uhs_mbbs', gradeOrYear: 'MBBS Years 3–4', unitOrModule: 'Integrated Pathology Modules', status: 'institution_specific' },
      { frameworkId: 'hms_pathways', gradeOrYear: 'MD Year 1–2', unitOrModule: 'Human Pathophysiology', status: 'institution_specific' },
      { frameworkId: 'ox_preclinical', gradeOrYear: 'Year 2', unitOrModule: 'Principles of Pathology', status: 'institution_specific' },
    ],
    learningObjectives: [
      'Distinguish cellular adaptations (hypertrophy, hyperplasia, atrophy, metaplasia) from irreversible cell death.',
      'Compare acute inflammation (neutrophil-predominant, vascular permeability) with chronic inflammation (macrophages/lymphocytes, fibrosis).',
      'Apply Virchow’s triad (endothelial injury, abnormal flow/stasis, hypercoagulability) to thrombosis and ischaemic infarction.',
    ],
    depthExplanations: {
      medical_foundations:
        'Cells respond to physiological or pathological stress by adapting (e.g., left ventricular hypertrophy in hypertension, squamous metaplasia in smoker airways). When stress exceeds adaptive capacity, ATP depletion and membrane/mitochondrial damage transition reversible swelling into irreversible necrosis (coagulative in most solid organs, liquefactive in brain) or apoptosis. Acute inflammation increases microvascular permeability and recruits neutrophils; persistent injury shifts to chronic mononuclear inflammation and tissue fibrosis.',
      clinical_applied:
        'Linking general pathology to organ anatomy explains bedside syndromes: coronary atherosclerotic plaque rupture triggers thrombosis (Virchow’s triad), downstream myocardial ischaemia, and coagulative necrosis—explored spatially in Anatomy 360’s Coronary Ischemia 3D Explainer.',
    },
    keyConcepts: [
      { term: 'Virchow’s Triad', definition: 'Three predisposing factors for thrombosis: endothelial injury, stasis/turbulence, and hypercoagulability.' },
      { term: 'Coagulative vs Liquefactive Necrosis', definition: 'Coagulative preserves tissue outline briefly (e.g., heart/kidney infarct); liquefactive digests tissue into fluid (e.g., CNS infarct, abscess).' },
      { term: 'Neoplasia', definition: 'Autonomous, clonal cell proliferation driven by accumulated genetic alterations in oncogenes and tumour suppressors.' },
    ],
    keyFacts: [
      'Anatomy 360’s 3 clinical 3D presentations (Coronary Ischemia, Pituitary–Optic Chiasm, Hepatic Portal Circulation) teach spatial mechanisms on normal reference meshes with explicit non-pathological disclosure.',
      'Real gross pathology photographs and histopathology slides are not yet bundled and are never simulated by recolouring healthy meshes as real lesions.',
    ],
    crossSubjectLinks: [
      { domainId: 'human_anatomy', relation: 'Vascular territories determine which anatomical regions suffer ischaemia after arterial occlusion.' },
      { domainId: 'clinical_specialties', relation: 'Systemic pathology forms the mechanistic bridge into Cardiology, Pulmonology, Neurology, and Surgery.' },
    ],
    relatedSystems: ['cardiovascular', 'nervous', 'digestive'],
    relatedFmaConceptIds: ['FMA7088', 'FMA3736', 'FMA66645'],
    visualFormats: ['clinical_case', '2d_diagram', '3d_anatomy', 'microscopy'],
    diagram: {
      id: 'diag-ischaemic-cascade',
      title: 'From Vascular Obstruction to Cellular Injury',
      kind: 'pathway',
      caption: 'General pathological sequence connecting thrombosis, hypoxia, ATP loss, and infarction.',
      disclaimer: 'Conceptual mechanism diagram; normal 3D meshes are used strictly for spatial orientation.',
      nodes: [
        { id: 'pt1', label: 'Virchow’s Triad / Occlusion', sublabel: 'Endothelial injury, stasis, thrombosis', tone: 'amber' },
        { id: 'pt2', label: 'Ischaemia & Hypoxia', sublabel: '↓ O2 delivery → ↓ oxidative phosphorylation', tone: 'rose' },
        { id: 'pt3', label: 'Reversible Injury', sublabel: '↓ ATP, Na+/K+ pump failure, cellular swelling', tone: 'blue' },
        { id: 'pt4', label: 'Irreversible Necrosis', sublabel: 'Membrane rupture, enzyme release, inflammation', tone: 'slate' },
      ],
    },
    assetDisclosure: {
      status: 'asset_required',
      summary: 'Mechanistic explanations and 3 spatial 3D clinical walkthroughs are implemented; authentic licensed histopathology slides and gross pathology photos are not yet bundled.',
      missingAssets: ['Licensed histopathology photomicrographs and gross pathology teaching images'],
    },
    selfChecks: [
      {
        id: 'q-edu-path-1',
        question: 'Which three components constitute Virchow’s triad predisposing to vascular thrombosis?',
        options: [
          'Fever, leukocytosis, and oedema',
          'Endothelial injury, abnormal blood flow (stasis/turbulence), and hypercoagulability',
          'Hypertrophy, hyperplasia, and metaplasia',
          'Hypoxia, acidosis, and hyperkalaemia',
        ],
        correctIndex: 1,
        explanation: 'Virchow’s triad defines the three classic factors promoting thrombus formation: endothelial damage, stasis or turbulent flow, and hypercoagulability.',
        level: 'medical_foundations',
      },
    ],
    sources: [
      { title: 'Robbins & Cotran Pathologic Basis of Disease (Reference Framework)', authority: 'Elsevier (Conceptual Curriculum Reference)', supports: 'General pathology principles: cellular adaptation, injury, inflammation, and thrombosis' },
    ],
    reviewStatus: 'structured_reference',
    educationalDisclaimer:
      'Educational pathology mechanisms only. Not intended for patient diagnosis or clinical management.',
  },

  // =========================================================================
  // DOMAIN K — PHARMACOLOGY & THERAPEUTICS
  // =========================================================================
  {
    id: 'edu-pharm-pk-pd-autonomic',
    domainId: 'pharmacology',
    chapterTitle: 'General & Autonomic Pharmacology Principles',
    title: 'Pharmacokinetics (ADME), Pharmacodynamics & Receptor Signalling',
    summary:
      'Core drug disposition (Absorption, Distribution, Metabolism, Excretion), bioavailability, half-life, agonist/antagonist receptor interactions, therapeutic index, and autonomic drug-class principles.',
    targetTracks: ['medical_foundations', 'clinical_applied', 'allied_health'],
    curriculumMappings: [
      { frameworkId: 'pk_pmdc_mbbs', gradeOrYear: 'MBBS Year 3', unitOrModule: 'Pharmacology & Therapeutics (~300 hrs Pakistan reference)', status: 'compulsory' },
      { frameworkId: 'pk_uhs_mbbs', gradeOrYear: 'MBBS Year 3', unitOrModule: 'General & Systemic Pharmacology', status: 'institution_specific' },
      { frameworkId: 'ox_preclinical', gradeOrYear: 'Year 1', unitOrModule: 'Physiology and Pharmacology', status: 'institution_specific' },
    ],
    learningObjectives: [
      'Differentiate pharmacokinetics (what the body does to the drug: ADME) from pharmacodynamics (what the drug does to the body).',
      'Explain first-pass hepatic metabolism, volume of distribution, half-life (t1/2), and steady state (~4–5 half-lives).',
      'Contrast potency (EC50) versus efficacy (Emax) and competitive versus non-competitive receptor antagonism.',
    ],
    depthExplanations: {
      medical_foundations:
        'Pharmacokinetics governs plasma concentration over time via Absorption (bioavailability F, hepatic first-pass via portal vein), Distribution (Vd, plasma protein binding), Metabolism (Phase I CYP450 oxidation/reduction/hydrolysis; Phase II conjugation), and Excretion (renal filtration/secretion, biliary). Pharmacodynamics relates concentration to biological effect via receptors (GPCRs, ion channels, enzyme-linked, nuclear).',
      clinical_applied:
        'Drugs with a narrow therapeutic index (e.g., warfarin, digoxin, aminoglycosides) require careful monitoring because toxic concentrations lie close to therapeutic ones. Renal or hepatic impairment alters clearance and prolongs elimination half-life.',
      allied_health:
        'Medication safety relies on understanding route bioavailability (IV = 100% vs oral first-pass), adverse drug reactions, and CYP450 drug-drug interaction risks.',
    },
    keyConcepts: [
      { term: 'First-Pass Metabolism', definition: 'Hepatic/intestinal biotransformation of an orally absorbed drug via the portal vein before reaching systemic circulation.' },
      { term: 'Therapeutic Index (TI)', definition: 'Ratio comparing toxic dose (TD50) to effective dose (ED50); higher TI indicates a wider safety margin.' },
      { term: 'Steady State', definition: 'State where rate of drug administration equals rate of elimination, reached in ~4–5 elimination half-lives.' },
    ],
    keyFacts: [
      'Orally absorbed drugs travel first through the hepatic portal vein (FMA66645) to the liver (FMA7197) before entering systemic venous circulation.',
      'Potency refers to the dose/concentration needed for half-maximal effect (EC50), whereas efficacy is the maximal achievable response (Emax).',
    ],
    crossSubjectLinks: [
      { domainId: 'human_anatomy', relation: 'Inspect the Portal Vein (FMA66645), Liver (FMA7197), and Kidney (FMA7203) in 3D for ADME pathways.' },
      { domainId: 'molecular_genetics', relation: 'Genetic variants in CYP450 enzymes alter drug metabolism rates.' },
    ],
    relatedSystems: ['digestive', 'urinary', 'cardiovascular', 'nervous'],
    relatedFmaConceptIds: ['FMA7197', 'FMA66645', 'FMA7203'],
    visualFormats: ['2d_diagram', 'structured_text', 'clinical_case'],
    diagram: {
      id: 'diag-adme-pkpd',
      title: 'Pharmacokinetic (ADME) & Pharmacodynamic Flow',
      kind: 'pathway',
      caption: 'Drug journey from administration through hepatic metabolism, receptor action, and renal/biliary clearance.',
      disclaimer: 'Conceptual educational pharmacology diagram — NOT for clinical prescribing or dosing.',
      nodes: [
        { id: 'ph1', label: 'Absorption', sublabel: 'Route & Bioavailability (F)', tone: 'blue' },
        { id: 'ph2', label: 'Distribution', sublabel: 'Plasma binding & Volume of Distribution (Vd)', tone: 'teal' },
        { id: 'ph3', label: 'Target Action (PD)', sublabel: 'Receptor binding (Agonist / Antagonist)', tone: 'emerald' },
        { id: 'ph4', label: 'Metabolism & Excretion', sublabel: 'Liver Phase I/II & Renal clearance (t1/2)', tone: 'amber' },
      ],
    },
    assetDisclosure: {
      status: 'conceptual_diagram_only',
      summary: 'Conceptual ADME/receptor diagrams linked to real 3D liver, portal vein, and kidney anatomy.',
    },
    selfChecks: [
      {
        id: 'q-edu-pharm-1',
        question: 'Approximately how many elimination half-lives (t1/2) are required for a drug administered at a constant rate to approach steady-state plasma concentration?',
        options: ['1 half-life', '2 half-lives', '4 to 5 half-lives', '10 to 12 half-lives'],
        correctIndex: 2,
        explanation: 'At constant dosing without a loading dose, ~94–97% of steady state is achieved after 4–5 elimination half-lives.',
        level: 'medical_foundations',
      },
    ],
    sources: [
      { title: 'Basic & Clinical Pharmacology (Reference Framework)', authority: 'Katzung / McGraw Hill (Curriculum Reference)', supports: 'ADME pharmacokinetics, pharmacodynamics, and therapeutic index concepts' },
    ],
    reviewStatus: 'structured_reference',
    educationalDisclaimer:
      'Educational pharmacology principles only. Do not use for patient-specific prescribing, dosing calculations, or medical treatment.',
  },

  // =========================================================================
  // DOMAIN L — NUTRITION & HUMAN HEALTH
  // =========================================================================
  {
    id: 'edu-nutr-macro-micro-balance',
    domainId: 'nutrition_health',
    chapterTitle: 'Macronutrients, Micronutrients & Metabolic Health',
    title: 'Nutrients, Digestive Absorption, Vitamin Deficiencies & Energy Balance',
    summary:
      'Roles of carbohydrates, proteins, lipids, fat-soluble (A, D, E, K) vs water-soluble (B-complex, C) vitamins, essential minerals (iron, calcium, iodine), and nutritional deficiency mechanisms.',
    targetTracks: ['school_foundations', 'secondary_premed', 'medical_foundations', 'allied_health'],
    curriculumMappings: [
      { frameworkId: 'pk_ncp_gs_4_8', gradeOrYear: 'Grades 5–8', unitOrModule: 'Balanced Diet, Digestion & Deficiency Diseases', status: 'compulsory' },
      { frameworkId: 'pk_ncp_bio_9_12', gradeOrYear: 'Grade IX', unitOrModule: 'Nutrition & Human Digestive System', status: 'elective' },
      { frameworkId: 'en_nc_science', gradeOrYear: 'KS3', unitOrModule: 'Nutrition and Digestion', status: 'compulsory' },
      { frameworkId: 'cn_moe_bio_2022', gradeOrYear: 'Grades 7–9', unitOrModule: 'Human Nutrition and Health', status: 'compulsory' },
    ],
    learningObjectives: [
      'Distinguish macronutrients (carbohydrates, proteins, lipids) from micronutrients (vitamins and minerals).',
      'Contrast fat-soluble vitamins (A, D, E, K) with water-soluble vitamins (B-complex, C) in absorption and storage.',
      'Connect classic micronutrient deficiencies (iron, vitamin D, vitamin C, vitamin B12/folate, iodine) to physiological consequences.',
    ],
    depthExplanations: {
      school_foundations:
        'A balanced diet provides carbohydrates and healthy fats for energy, proteins for body building and repair, and vitamins and minerals to keep eyes, bones, blood, and immunity healthy.',
      secondary_premed:
        'Digestion breaks polysaccharides into monosaccharides, proteins into amino acids, and triglycerides into fatty acids/monoglycerides for absorption across small-intestinal villi. Fat-soluble vitamins (A, D, E, K) require dietary lipids and bile salts for absorption and are stored in liver/adipose tissue; water-soluble vitamins are generally not stored long-term (except B12 in the liver).',
      medical_foundations:
        'Site-specific GI absorption governs clinical deficiencies: iron is absorbed primarily in the duodenum, folate in the jejunum, and vitamin B12 (bound to gastric intrinsic factor) in the terminal ileum. Protein-energy malnutrition manifests across a spectrum from marasmus (total caloric wasting) to kwashiorkor (severe protein deficiency with oedema).',
      allied_health:
        'Nutritional screening across pregnancy, childhood growth, chronic illness, and older adulthood supports wound healing, bone density, and anaemia prevention.',
    },
    keyConcepts: [
      { term: 'Fat-Soluble Vitamins (A, D, E, K)', definition: 'Absorbed with dietary lipids/bile salts and stored in liver and adipose tissues.' },
      { term: 'Essential Amino Acids', definition: 'Amino acids that human cells cannot synthesize de novo and must obtain from diet.' },
      { term: 'Energy Balance', definition: 'Relationship between dietary caloric intake and total daily energy expenditure (BMR + activity + thermogenesis).' },
    ],
    keyFacts: [
      'Vitamin C is required for collagen hydroxylation; deficiency causes impaired wound healing and scurvy.',
      'Vitamin D promotes intestinal calcium and phosphate absorption; deficiency impairs bone mineralization (rickets/osteomalacia).',
    ],
    crossSubjectLinks: [
      { domainId: 'biochemistry', relation: 'B-complex vitamins serve as essential coenzymes (e.g., NAD+, FAD, CoA, pyridoxal phosphate) in metabolism.' },
      { domainId: 'haematology_lab', relation: 'Iron, folate, and vitamin B12 deficiencies cause microcytic or megaloblastic anaemias.' },
    ],
    relatedSystems: ['digestive', 'skeletal', 'endocrine'],
    relatedFmaConceptIds: ['FMA7148', 'FMA7197', 'FMA7198'],
    visualFormats: ['2d_diagram', 'structured_text'],
    diagram: {
      id: 'diag-gi-absorption-sites',
      title: 'Site-Specific Nutrient Absorption Overview',
      kind: 'pathway',
      caption: 'Regional specialization along the gastrointestinal tract optimizes nutrient uptake.',
      disclaimer: 'Conceptual educational nutrition diagram.',
      nodes: [
        { id: 'nu1', label: 'Stomach', sublabel: 'HCl, pepsin, intrinsic factor (for B12)', tone: 'amber' },
        { id: 'nu2', label: 'Duodenum', sublabel: 'Iron, calcium, bile/pancreatic digestion', tone: 'teal' },
        { id: 'nu3', label: 'Jejunum', sublabel: 'Major macronutrients & folate uptake', tone: 'blue' },
        { id: 'nu4', label: 'Terminal Ileum', sublabel: 'Vitamin B12 & bile-salt reabsorption', tone: 'emerald' },
      ],
    },
    assetDisclosure: {
      status: 'conceptual_diagram_only',
      summary: 'Conceptual absorption diagram linked to real 3D Stomach, Liver, and Pancreas meshes.',
    },
    selfChecks: [
      {
        id: 'q-edu-nutr-1',
        question: 'Which group consists exclusively of fat-soluble vitamins?',
        options: ['Vitamins B1, B6, B12, and C', 'Vitamins A, D, E, and K', 'Vitamins A, B12, C, and D', 'Vitamins C, D, E, and Folate'],
        correctIndex: 1,
        explanation: 'Vitamins A, D, E, and K are fat-soluble and depend on bile salts and dietary lipids for intestinal absorption.',
        level: 'school_foundations',
      },
    ],
    sources: [
      { title: 'Anatomy and Physiology 2e — Chapter 24: Metabolism and Nutrition', authority: 'OpenStax (CC BY 4.0)', supports: 'Macronutrient digestion, vitamin roles, and energy balance' },
    ],
    reviewStatus: 'structured_reference',
  },

  // =========================================================================
  // DOMAIN M — HAEMATOLOGY & LABORATORY MEDICINE
  // =========================================================================
  {
    id: 'edu-haem-blood-coagulation-labs',
    domainId: 'haematology_lab',
    chapterTitle: 'Blood Physiology, Haemostasis & Core Laboratory Panels',
    title: 'Blood Components, Haemostasis, ABO/Rh Groups & Basic Lab Concepts',
    summary:
      'Erythrocytes, leukocytes, platelets, plasma, primary/secondary haemostasis, ABO/Rh transfusion compatibility, and educational interpretation concepts for CBC, urinalysis, renal/liver panels, and electrolytes.',
    targetTracks: ['secondary_premed', 'medical_foundations', 'clinical_applied', 'allied_health'],
    curriculumMappings: [
      { frameworkId: 'pk_ncp_bio_9_12', gradeOrYear: 'Grade IX & XI', unitOrModule: 'Transport in Humans — Blood & ABO Blood Groups', status: 'elective' },
      { frameworkId: 'in_cbse_bio_11_12', gradeOrYear: 'Class XI (Unit V)', unitOrModule: 'Body Fluids and Circulation', status: 'elective' },
      { frameworkId: 'pk_pmdc_mbbs', gradeOrYear: 'MBBS Years 1–4', unitOrModule: 'Haematology & Clinical Pathology', status: 'compulsory' },
    ],
    learningObjectives: [
      'Describe the cellular composition of blood and the physiological roles of haemoglobin, leukocytes, and platelets.',
      'Explain ABO and Rh antigen-antibody compatibility principles in blood transfusion.',
      'Differentiate primary haemostasis (platelet plug) from secondary haemostasis (fibrin clot cascade) and understand basic CBC/MCV classification of anaemia.',
    ],
    depthExplanations: {
      secondary_premed:
        'Blood consists of liquid plasma (~55%) and formed elements (~45%): red blood cells carry oxygen via haemoglobin, white blood cells defend against infection, and platelets initiate clotting. ABO blood types depend on A and B surface antigens on RBCs and reciprocal antibodies in plasma.',
      medical_foundations:
        'Primary haemostasis forms a temporary platelet plug via vWF-mediated adhesion and GPIIb/IIIa aggregation; secondary haemostasis stabilizes it via intrinsic/extrinsic/common coagulation pathways generating cross-linked fibrin. Mean Corpuscular Volume (MCV) classifies anaemia into microcytic (<80 fL, e.g., iron deficiency/thalassaemia), normocytic (80–100 fL), and macrocytic (>100 fL, e.g., B12/folate deficiency).',
      clinical_applied:
        'Educational lab panels map to organ physiology: creatinine/BUN/eGFR track renal filtration; AST/ALT/ALP/bilirubin differentiate hepatocellular vs cholestatic liver patterns; troponin reflects cardiomyocyte injury; HbA1c reflects ~3-month glycaemic exposure.',
      allied_health:
        'Accurate specimen collection, understanding basic reference concepts, and verifying blood-product compatibility protocols are vital patient-safety pillars.',
    },
    keyConcepts: [
      { term: 'MCV (Mean Corpuscular Volume)', definition: 'Average red blood cell volume (typically ~80–100 fL in adults), used to classify anaemia.' },
      { term: 'Primary vs Secondary Haemostasis', definition: 'Primary = vasoconstriction + platelet plug; Secondary = coagulation cascade forming fibrin mesh.' },
      { term: 'ABO Compatibility', definition: 'Group O RBCs lack A/B surface antigens; Group AB plasma lacks anti-A/anti-B antibodies.' },
    ],
    keyFacts: [
      'Mature human erythrocytes circulate for approximately 120 days before splenic macrophage clearance.',
      'Reference ranges vary by laboratory method, age, and sex—educational examples never replace clinician review.',
    ],
    crossSubjectLinks: [
      { domainId: 'immunology', relation: 'Leukocytes (neutrophils, lymphocytes, monocytes, eosinophils, basophils) execute immune defence.' },
      { domainId: 'human_physiology', relation: 'Renal erythropoietin (EPO) stimulates bone-marrow erythropoiesis during hypoxia.' },
    ],
    relatedSystems: ['cardiovascular', 'urinary', 'digestive'],
    relatedFmaConceptIds: ['FMA7088', 'FMA7196', 'FMA7203'],
    visualFormats: ['2d_diagram', 'microscopy', 'clinical_case'],
    diagram: {
      id: 'diag-haemostasis-steps',
      title: 'Haemostasis & Clot Resolution Sequence',
      kind: 'pathway',
      caption: 'Coordinated vascular, platelet, and coagulation cascade steps preventing haemorrhage.',
      disclaimer: 'Conceptual educational diagram; genuine peripheral blood smear slides are marked Asset Required.',
      nodes: [
        { id: 'h1', label: '1. Vasoconstriction', sublabel: 'Immediate reflex & endothelin narrowing', tone: 'rose' },
        { id: 'h2', label: '2. Primary Haemostasis', sublabel: 'vWF adhesion & platelet plug', tone: 'amber' },
        { id: 'h3', label: '3. Secondary Haemostasis', sublabel: 'Thrombin → cross-linked fibrin mesh', tone: 'teal' },
        { id: 'h4', label: '4. Fibrinolysis', sublabel: 'tPA → plasmin degrades clot during repair', tone: 'emerald' },
      ],
    },
    assetDisclosure: {
      status: 'asset_required',
      summary: 'Coagulation pathways and educational lab concepts are implemented; licensed Wright-Giemsa peripheral blood smear images are not yet bundled.',
      missingAssets: ['Licensed Wright-Giemsa peripheral blood smear reference micrographs'],
    },
    selfChecks: [
      {
        id: 'q-edu-haem-1',
        question: 'In educational CBC interpretation, a low Mean Corpuscular Volume (MCV < 80 fL) is most classically associated with:',
        options: ['Microcytic anaemia (e.g., iron deficiency or thalassaemia)', 'Vitamin B12 deficiency', 'Folate deficiency', 'Acute haemolytic polycythaemia'],
        correctIndex: 0,
        explanation: 'Low MCV defines microcytic erythrocytes, classically caused by impaired haemoglobin synthesis such as iron deficiency or thalassaemia.',
        level: 'medical_foundations',
      },
    ],
    sources: [
      { title: 'Anatomy and Physiology 2e — Chapter 18: The Cardiovascular System: Blood', authority: 'OpenStax (CC BY 4.0)', supports: 'Blood composition, haemostasis, and ABO/Rh typing' },
    ],
    reviewStatus: 'structured_reference',
    educationalDisclaimer:
      'Educational laboratory concepts only. Never use these examples to interpret personal medical test results.',
  },

  // =========================================================================
  // DOMAIN N — RADIOLOGY & MEDICAL IMAGING
  // =========================================================================
  {
    id: 'edu-rad-modalities-planes',
    domainId: 'radiology_imaging',
    chapterTitle: 'Imaging Modalities & Cross-Sectional Orientation',
    title: 'X-Ray, CT, MRI & Ultrasound Principles and Axial Viewing Convention',
    summary:
      'Physical basis of major imaging modalities (ionising vs non-ionising), tissue appearance (radiodensity, Hounsfield units, T1/T2 MRI, echogenicity), and how standard axial slices orient relative to 3D anatomy.',
    targetTracks: ['medical_foundations', 'clinical_applied'],
    curriculumMappings: [
      { frameworkId: 'pk_pmdc_mbbs', gradeOrYear: 'MBBS Years 1–5', unitOrModule: 'Radiological Anatomy & Diagnostic Imaging Orientation', status: 'recommended' },
      { frameworkId: 'pk_uhs_mbbs', gradeOrYear: 'MBBS Years 1–5', unitOrModule: 'Vertical Integration — Radiological Anatomy', status: 'institution_specific' },
      { frameworkId: 'hms_pathways', gradeOrYear: 'MD Years 1–2', unitOrModule: 'Integrated Anatomy & Imaging Correlation', status: 'institution_specific' },
    ],
    learningObjectives: [
      'Classify X-ray/CT/nuclear medicine (ionising) versus MRI/ultrasound (non-ionising) modalities.',
      'Apply the standard radiological viewing convention (viewing axial slices from the patient’s feet upward: patient’s right is on the viewer’s left).',
      'Correlate cross-sectional clipping planes in the 3D Explorer with axial, coronal, and sagittal radiological anatomy.',
    ],
    depthExplanations: {
      medical_foundations:
        'Plain X-ray and CT rely on differential X-ray attenuation (air = black, fat = dark grey, soft tissue/fluid = grey, bone/contrast = white). Ultrasound uses high-frequency sound waves (safe in pregnancy, real-time bedside imaging). MRI aligns hydrogen protons in a strong magnetic field to achieve superior soft-tissue contrast (brain, spinal cord, ligaments) without ionising radiation.',
      clinical_applied:
        'Standard axial CT/MRI orientation views the patient from inferiorly ("from the feet"): anterior is at the top, posterior at the bottom, and the patient’s right side appears on the viewer’s left. Modality choice balances diagnostic resolution, speed, cost, and radiation safety (ALARA principle).',
    },
    keyConcepts: [
      { term: 'Radiological Axial Convention', definition: 'Axial CT/MRI slices are displayed as if looking from the patient’s feet upward (patient right = viewer left).' },
      { term: 'Ionising vs Non-Ionising', definition: 'X-ray & CT use ionising radiation; MRI & Ultrasound do not use ionising radiation.' },
      { term: 'Hounsfield Units (HU)', definition: 'Quantitative CT radiodensity scale (Air ≈ −1000, Water = 0, Cortical bone ≈ +1000).' },
    ],
    keyFacts: [
      'Anatomy 360 currently has NO bundled licensed DICOM/X-ray/CT/MRI/ultrasound image datasets; real imaging assets are explicitly marked Asset Required.',
      'Students can practice anatomical plane orientation using the 3D Explorer’s real-time axial, coronal, and sagittal clipping planes.',
    ],
    crossSubjectLinks: [
      { domainId: 'human_anatomy', relation: 'Cross-sectional anatomy in the 3D Explorer directly previews axial, coronal, and sagittal organ relationships.' },
    ],
    relatedSystems: ['skeletal', 'respiratory', 'cardiovascular', 'nervous'],
    relatedFmaConceptIds: ['FMA46565', 'FMA7088', 'FMA7309', 'FMA50801'],
    visualFormats: ['medical_imaging', '3d_anatomy', '2d_diagram'],
    diagram: {
      id: 'diag-imaging-modalities',
      title: 'Core Medical Imaging Modalities Comparison',
      kind: 'comparison',
      caption: 'Physical energy source and primary anatomical strengths across four foundational imaging modalities.',
      disclaimer: 'Conceptual comparison chart — NO real radiographs or DICOM datasets are bundled yet (Asset Required).',
      nodes: [
        { id: 'r1', label: 'Plain X-Ray', sublabel: 'Ionising · Rapid bone & chest overview', tone: 'slate' },
        { id: 'r2', label: 'CT Scan', sublabel: 'Ionising · Rapid 3D cross-sections & trauma', tone: 'amber' },
        { id: 'r3', label: 'MRI', sublabel: 'Non-ionising · High brain/soft-tissue contrast', tone: 'blue' },
        { id: 'r4', label: 'Ultrasound', sublabel: 'Non-ionising · Real-time bedside & obstetrics', tone: 'teal' },
      ],
    },
    assetDisclosure: {
      status: 'asset_required',
      summary:
        'Modality physics and orientation concepts are implemented, but NO real licensed X-ray, CT, MRI, or ultrasound image datasets are currently bundled. No fake radiographs are generated.',
      missingAssets: ['De-identified, openly licensed normal Chest X-ray, Brain MRI, and Abdominal CT teaching image sets'],
    },
    selfChecks: [
      {
        id: 'q-edu-rad-1',
        question: 'Which pair of medical imaging modalities operates WITHOUT ionising radiation?',
        options: ['CT and Plain X-ray', 'MRI and Ultrasound', 'CT and Nuclear PET', 'Fluoroscopy and Mammography'],
        correctIndex: 1,
        explanation: 'MRI (magnetic fields/radiofrequency pulses) and Ultrasound (acoustic waves) do not expose patients to ionising radiation.',
        level: 'medical_foundations',
      },
    ],
    sources: [
      { title: 'Anatomy and Physiology 2e — Section 1.7: Medical Imaging', authority: 'OpenStax (CC BY 4.0)', url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/1-7-medical-imaging', supports: 'X-ray, CT, MRI, PET, and ultrasound physical principles' },
    ],
    reviewStatus: 'structured_reference',
    educationalDisclaimer:
      'Educational imaging orientation concepts only; not for clinical radiograph interpretation or patient diagnosis.',
  },

  // =========================================================================
  // DOMAIN O — CLINICAL MEDICINE & SPECIALTIES
  // =========================================================================
  {
    id: 'edu-clin-specialties-map',
    domainId: 'clinical_specialties',
    chapterTitle: 'System-Based Clinical Medicine & Surgery Overview',
    title: 'Organ-System Mapping of Medical & Surgical Specialties',
    summary:
      'Structured orientation to major internal medicine and surgical specialties—linking each specialty’s core organ systems, foundational sciences, and existing Anatomy 360 clinical cases and 3D explainers.',
    targetTracks: ['medical_foundations', 'clinical_applied'],
    curriculumMappings: [
      { frameworkId: 'pk_pmdc_mbbs', gradeOrYear: 'MBBS Years 3–5', unitOrModule: 'Medicine & Allied (~1,500h) + Surgery & Allied (~1,600h) Pakistan reference', status: 'compulsory' },
      { frameworkId: 'pk_uhs_mbbs', gradeOrYear: 'MBBS Years 3–5', unitOrModule: 'Clinical Clerkship Rotations', status: 'institution_specific' },
      { frameworkId: 'hms_pathways', gradeOrYear: 'MD Year 2–4', unitOrModule: 'Principal Clinical Experience (PCE)', status: 'institution_specific' },
    ],
    learningObjectives: [
      'Map major medical specialties (Cardiology, Pulmonology, Gastroenterology, Nephrology, Neurology, Endocrinology, Haematology-Oncology, Infectious Disease, Dermatology, Psychiatry) to their underlying organ systems.',
      'Map major surgical specialties (General Surgery, Orthopaedics, Neurosurgery, Cardiothoracic/Vascular, Urology, Obstetrics & Gynaecology, Ophthalmology, ENT) to regional anatomical domains.',
      'Connect Anatomy 360’s 10 clinical correlation cases and 3 guided 3D mechanism presentations to specialty reasoning.',
    ],
    depthExplanations: {
      medical_foundations:
        'Clinical specialties apply basic sciences to specific organ systems or patient populations: Cardiology applies cardiac anatomy/haemodynamics; Neurology localizes lesions via neuroanatomical tracts; General & Vascular Surgery rely on fascial planes and visceral blood supply.',
      clinical_applied:
        'Modern clinical care is multidisciplinary—for example, a pituitary macroadenoma involves Endocrinology (hormone axes), Ophthalmology (bitemporal hemianopia at the optic chiasm), Radiology (sellar MRI), and Neurosurgery (transsphenoidal approach). Explore this spatial relationship directly in Anatomy 360’s Pituitary–Optic Chiasm 3D Explainer.',
    },
    keyConcepts: [
      { term: 'Internal Medicine Specialties', definition: 'Non-operative organ-system diagnosis and longitudinal medical management (Cardiology, Pulmonology, GI, Nephrology, Neurology, Endocrinology, etc.).' },
      { term: 'Surgical Specialties', definition: 'Operative and procedural management grounded in regional/surgical anatomy (General, Orthopaedics, Neurosurgery, ENT, Ophthalmology, Ob/Gyn, Urology).' },
      { term: 'Primary & Emergency Care', definition: 'Family/Community Medicine (longitudinal preventive care) and Emergency/Critical Care (acute stabilization).' },
    ],
    keyFacts: [
      'Anatomy 360 includes 10 anatomy-led clinical cases (3 with full multi-stage guided 3D explanations: Coronary Ischemia, Pituitary–Optic Chiasm, Hepatic Portal Circulation).',
      'Software-based learning complements—and never replaces—supervised clinical clerkships, bedside teaching, and accredited specialty training.',
    ],
    crossSubjectLinks: [
      { domainId: 'pathology', relation: 'Systemic pathology underpins disease mechanisms across every medical and surgical specialty.' },
      { domainId: 'clinical_skills_public_health', relation: 'History taking, examination, and clinical reasoning unify all clinical specialties.' },
    ],
    relatedSystems: ['cardiovascular', 'nervous', 'digestive', 'skeletal', 'respiratory'],
    relatedFmaConceptIds: ['FMA7088', 'FMA13889', 'FMA62045', 'FMA66645'],
    visualFormats: ['clinical_case', '3d_anatomy', 'structured_text'],
    diagram: {
      id: 'diag-specialty-clusters',
      title: 'Clinical Specialty Clusters Linked to Basic Sciences',
      kind: 'comparison',
      caption: 'Four major clinical training pillars built atop foundational anatomy, physiology, pathology, and pharmacology.',
      disclaimer: 'Educational curriculum orientation only — not a substitute for clinical clerkships.',
      nodes: [
        { id: 'sp1', label: 'Medicine & Allied', sublabel: 'Cardiology, Pulm, GI, Nephro, Neuro, Endo, Derm, Psych', tone: 'blue' },
        { id: 'sp2', label: 'Surgery & Allied', sublabel: 'General, Ortho, Neurosurg, Vascular, Urology, ENT, Ophth', tone: 'teal' },
        { id: 'sp3', label: 'Maternal & Child', sublabel: 'Obstetrics & Gynaecology, Paediatrics & Neonatology', tone: 'amber' },
        { id: 'sp4', label: 'Acute & Community', sublabel: 'Emergency, Anaesthesia, Family & Community Medicine', tone: 'emerald' },
      ],
    },
    assetDisclosure: {
      status: 'partial',
      summary: '10 clinical correlation cases and 3 guided 3D clinical explainers are live; full specialty curricula require clinical clerkship training.',
    },
    selfChecks: [
      {
        id: 'q-edu-clin-1',
        question: 'Compression of the optic chiasm by an expanding sellar pituitary mass illustrates an anatomical intersection between which specialties?',
        options: [
          'Dermatology and Orthopaedics',
          'Endocrinology, Ophthalmology, and Neurosurgery',
          'Urology and Pulmonology',
          'Rheumatology and Haematology',
        ],
        correctIndex: 1,
        explanation: 'The pituitary gland sits immediately inferior to the optic chiasm in the sella turcica, linking Endocrinology (pituitary hormones), Ophthalmology (visual fields), and Neurosurgery.',
        level: 'clinical_applied',
      },
    ],
    sources: [
      { title: 'PM&DC Guidelines for Undergraduate Medical Education (2024)', authority: 'PM&DC, Pakistan', url: 'https://www.pmdc.pk/Documents/Others/PM%26DC%20GUIDELINES%20FOR%20UG%20M.EDUCATION-06242024035407.pdf', supports: 'Clinical specialty rotation scope in undergraduate MBBS education' },
    ],
    reviewStatus: 'structured_reference',
    educationalDisclaimer:
      'Educational specialty orientation only. Not a replacement for accredited clinical training, guidelines, or medical advice.',
  },

  // =========================================================================
  // DOMAIN P — CLINICAL SKILLS, PUBLIC HEALTH & MEDICAL PRACTICE
  // =========================================================================
  {
    id: 'edu-practice-skills-ethics-epi',
    domainId: 'clinical_skills_public_health',
    chapterTitle: 'Clinical Reasoning, Ethics, Epidemiology & Evidence-Based Medicine',
    title: 'Clinical Reasoning, Medical Ethics, Diagnostic Accuracy & Epidemiology',
    summary:
      'Structured history/examination principles, four pillars of biomedical ethics, informed consent, patient safety, incidence vs prevalence, sensitivity/specificity, and hierarchy of clinical evidence.',
    targetTracks: ['medical_foundations', 'clinical_applied', 'allied_health'],
    curriculumMappings: [
      { frameworkId: 'pk_pmdc_mbbs', gradeOrYear: 'MBBS Years 1–5', unitOrModule: 'Community Medicine (~170h), Forensic/Ethics (~100h) & Research Skills', status: 'compulsory' },
      { frameworkId: 'pk_uhs_mbbs', gradeOrYear: 'MBBS Years 1–5', unitOrModule: 'Behavioural Sciences, Ethics, EBM & OSCE Foundations', status: 'institution_specific' },
      { frameworkId: 'hms_pathways', gradeOrYear: 'MD Years 1–2', unitOrModule: 'Practice of Medicine (POM) & Essentials of the Profession', status: 'institution_specific' },
      { frameworkId: 'ox_preclinical', gradeOrYear: 'Year 1', unitOrModule: 'Medical Sociology & Patient-Doctor Course', status: 'institution_specific' },
    ],
    learningObjectives: [
      'Apply the four core principles of biomedical ethics (autonomy, beneficence, non-maleficence, justice) to informed consent and confidentiality.',
      'Distinguish incidence (new cases over time) from prevalence (total existing cases at a point in time).',
      'Differentiate diagnostic test sensitivity (ruling out when negative) from specificity (ruling in when positive).',
    ],
    depthExplanations: {
      medical_foundations:
        'Effective medical practice pairs biological knowledge with structured clinical reasoning (history → focused physical examination → problem representation → prioritized differential diagnosis), communication skills, patient safety, and biomedical ethics (autonomy, beneficence, non-maleficence, justice).',
      clinical_applied:
        'Evidence-based medicine (EBM) integrates best research evidence (systematic reviews/RCTs > cohort > case-control > case series) with clinical expertise and patient values. Understanding sensitivity = TP/(TP+FN), specificity = TN/(TN+FP), and how disease prevalence shifts positive/negative predictive values prevents diagnostic over-interpretation.',
      allied_health:
        'Vital-sign monitoring, infection prevention, clear handover communication (e.g., SBAR), informed consent, and patient-safety culture apply across nursing and all allied-health professions.',
    },
    keyConcepts: [
      { term: 'Four Pillars of Ethics', definition: 'Autonomy (self-determination/consent), Beneficence (acting for patient good), Non-Maleficence (avoiding harm), Justice (fairness).' },
      { term: 'Sensitivity vs Specificity', definition: 'Sensitivity = true-positive rate among diseased; Specificity = true-negative rate among non-diseased.' },
      { term: 'Incidence vs Prevalence', definition: 'Incidence measures new cases in a period; prevalence measures total existing cases in a population.' },
    ],
    keyFacts: [
      'A test with very high sensitivity produces few false negatives, making a negative result useful for ruling out disease.',
      'Hands-on physical examination and OSCE competency require supervised skills-lab and clinical instruction.',
    ],
    crossSubjectLinks: [
      { domainId: 'haematology_lab', relation: 'Sensitivity, specificity, and predictive values govern how laboratory test results are interpreted.' },
      { domainId: 'microbiology_parasitology', relation: 'Epidemiology and infection control reduce healthcare-associated and community outbreaks.' },
    ],
    relatedSystems: ['cardiovascular', 'respiratory'],
    relatedFmaConceptIds: [],
    visualFormats: ['2d_diagram', 'structured_text', 'clinical_case'],
    diagram: {
      id: 'diag-ebm-reasoning',
      title: 'Structured Clinical Reasoning & EBM Workflow',
      kind: 'pathway',
      caption: 'Systematic progression from patient history to evidence-informed reasoning and safety checks.',
      disclaimer: 'Conceptual educational workflow — supervised clinical training is required for real patient care.',
      nodes: [
        { id: 'cs1', label: '1. History & Vital Signs', sublabel: 'Patient-centred communication & consent', tone: 'blue' },
        { id: 'cs2', label: '2. Focused Exam', sublabel: 'Inspection, palpation, percussion, auscultation', tone: 'teal' },
        { id: 'cs3', label: '3. Differential & Tests', sublabel: 'Pre-test probability, sensitivity/specificity', tone: 'amber' },
        { id: 'cs4', label: '4. Ethics & EBM Review', sublabel: 'Evidence hierarchy & patient safety', tone: 'emerald' },
      ],
    },
    assetDisclosure: {
      status: 'conceptual_diagram_only',
      summary: 'Structured frameworks and self-checks implemented; physical examination skills require supervised in-person clinical teaching.',
    },
    activity: {
      title: 'Diagnostic Test Interpretation Exercise',
      kind: 'interpretation',
      prompt: 'A screening test has 98% sensitivity and 70% specificity. If a student obtains a negative result vs a positive result, which conclusion is stronger and why?',
      keyTakeaway: 'A negative result strongly lowers disease likelihood (high sensitivity → low false-negative rate), whereas a positive result requires confirmatory testing due to lower specificity (higher false-positive rate).',
    },
    selfChecks: [
      {
        id: 'q-edu-prac-1',
        question: 'Which epidemiological measure describes the proportion of a population that has a condition at a specific point in time?',
        options: ['Incidence rate', 'Point prevalence', 'Case-fatality ratio', 'Relative risk'],
        correctIndex: 1,
        explanation: 'Point prevalence captures all existing cases (both new and pre-existing) divided by the total population at a given moment.',
        level: 'clinical_applied',
      },
    ],
    sources: [
      { title: 'PM&DC Guidelines for Undergraduate Medical Education (2024)', authority: 'PM&DC, Pakistan', supports: 'Ethics, community medicine, biostatistics, and clinical skills foundations' },
      { title: 'CDC Principles of Epidemiology in Public Health Practice (3rd ed., Public Domain)', authority: 'U.S. Centers for Disease Control and Prevention', supports: 'Incidence, prevalence, and screening test metrics' },
    ],
    reviewStatus: 'structured_reference',
    educationalDisclaimer:
      'Educational clinical reasoning, ethics, and epidemiology concepts only. Supervised faculty instruction is mandatory for clinical practice.',
  },
];
