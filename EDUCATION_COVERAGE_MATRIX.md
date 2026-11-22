# ANATOMY 360 — Education Coverage Matrix & Verified Inventory

**Audit Date:** 2026-11-22  
**Verified Repository Inventory (Measured Directly from Source Files & Registry):**
- `public/models/atlas.json`: **2,234** selectable BodyParts3D 4.0 meshes (15 binary chunks, 2,288,268 triangles), **3,432** FMA concepts (adult male reference anatomy).
- `app/registry/knowledge-registry.ts`: **16** domains, **16** subjects, **29** chapters, **46** registry topics (**28** anatomy lesson topics + **17** biomedical curriculum modules + **1** planned endocrine specification slot).
- `app/anatomy-systems.ts`: **12** canonical organ systems.
- `app/anatomy-knowledge.ts`: **100** curated anatomical knowledge entries (**97** with real 3D meshes, **3** conceptual/non-modeled) and **58** verified relationships.
- `app/learning-data.ts`: **12** system lesson chapters, **28** structured topics, **8** guided 3D pathways, **32** terminology entries.
- `app/data/physiology-data.ts`: **6** physiology specifications (**5** interactive quantitative evaluators: Cardiac, Respiratory, Renal, Musculoskeletal, Acid-Base Henderson–Hasselbalch; **1** planned endocrine feedback spec).
- `app/data/histology-data.ts`: **10** histology entries with self-checks (**0** genuine licensed microscopy images populated — marked `asset_missing`).
- `app/data/clinical-data.ts`: **10** anatomy-led clinical correlation cases (**3** linked to built-in 3D presentations, **4** partial 3D coverage, **3** case study only).
- `app/data/surgical-anatomy.ts`: **10** regional surgical dissection specifications.
- `app/presentation/builtin-presentations.ts`: **5** built-in 3D presentations (**3** clinical mechanisms + **2** anatomical/surgical walkthroughs) + browser-native local WebM video recorder.
- **Assessment Bank:** **96** total items (**43** quiz questions in `app/quiz-data.ts` + **33** module self-checks in `app/education/` + **10** clinical case checks + **10** histology checks).
- `app/data/study-resources.ts`: **18** curated external study resources.
- `app/education/`: **6** learning tracks (`School 6–8`, `Secondary/Pre-Med 9–12`, `Medical Foundations`, `Clinical & Applied`, `Allied Health`, `Graduate / BS / MPhil / PhD`), **13** official curriculum frameworks, **16** domains, **17** level-differentiated modules.
- `app/syllabus/`: Custom syllabus parser, synonym/keyword matcher, and local coverage report engine (`available` / `partially_available` / `not_available_yet`).

---

## Status Legend (Used Strictly & Consistently)
- `implemented_validated` / `substantially_covered` — Structured lessons, working interactive 3D/visuals, multi-tier depth, assessments, and passing automated validation (still pending formal academic faculty sign-off).
- `implemented_partial` / `introductory` / `partial` — Real introductory module(s) (1–2 topics per domain), conceptual 2D schematics, curriculum mapping, and self-checks; counts as **Partially Available** (never full course coverage) in the Syllabus Navigator.
- `asset_missing` — Educational structure and text implemented, but genuine licensed external media (microscopy slides or de-identified radiographs) is required before claiming visual completion.
- `planned_scaffold_only` / `planned` — Specification or architectural slot exists without an interactive simulation (`endocrine-feedback-planned`).
- `out_of_scope` — Deliberately outside ANATOMY 360’s human biology & medical sciences mission (e.g. plant botany, patient-specific prescribing).

---

## 1. Domain Coverage Matrix (All 16 Domains)

| Code | Domain | Subdomain / Scope | Representative Frameworks | Target Levels | Current Repo Status | Registry Topics | Evidence (Actual Files) | Gap / Missing Requirements | Priority |
|---|---|---|---|---|---|---|---|---|---|
| **A** | Human Anatomy | Gross, regional, systemic (12 systems), neuroanatomy, joints, terminology | PK NCP, PM&DC, UHS, CBSE, WA, Oxford, HMS, Anat. Soc. | All 6 tracks | `substantially_covered` | 29 (28 lesson + 1 overview) | `atlas.json` (2,234 meshes), `learning-data.ts`, `surgical-anatomy.ts`, `PracticalLabPage.tsx` | Female reproductive 3D meshes, meninges, parathyroid/inner-ear meshes, paediatric variants | **P1** |
| **B** | Cell Biology & Cytology | Organelles, membrane transport, cell cycle, mitosis, meiosis, apoptosis | PK NCP, CBSE, England KS3–4, AP Bio, China 2022, WA, Oxford, QAA | School, Pre-Med, Med, Allied, Graduate | `partial` (2 intro modules) | 2 | `education-content-part1.ts` (2 modules + 2D diagrams + self-checks) | Signalling/stem-cell chapters; licensed TEM/SEM micrographs | **P0** |
| **C** | Histology & Microscopic Anatomy | 4 primary tissues, H&E staining, organ microanatomy | PK NCP IX, CBSE XI, PM&DC, UHS, WA, Oxford | Pre-Med, Med, Allied, Graduate | `asset_missing` | 1 | `histology-data.ts` (10 entries), `HistologyPage.tsx`, `education-content-part1.ts` | **Genuine licensed H&E light-microscopy images** with magnification & scale bars | **P1** |
| **D** | Embryology & Human Development | Fertilisation, cleavage, gastrulation, neurulation, placenta, teratogens | PK NCP XII, CBSE XII, PM&DC, UHS, WA, Oxford, Anat. Soc. | Pre-Med, Med | `introductory` (1 module) | 1 | `education-content-part1.ts` (Early development & germ layers + 2D diagram) | Organogenesis modules; staged Carnegie 3D embryonic models | **P0** |
| **E** | Human Physiology & Homeostasis | Homeostasis, cardiac, respiratory, renal, musculoskeletal, acid-base, endocrine | All 13 frameworks | All 6 tracks | `partial` (1 overview + 1 planned) | 2 | `physiology-data.ts` (5 active simulators + 1 planned endocrine spec), `PhysiologyPage.tsx` | Validated quantitative Endocrine feedback model & action-potential sandbox | **P1** |
| **F** | Biochemistry & Human Metabolism | Biomolecules, enzymes, glycolysis, TCA, ETC/ATP, organ integration | PK NCP, CBSE, AP Bio, PM&DC, Oxford, HMS, QAA | Pre-Med, Med, Allied, Graduate | `introductory` (1 module) | 1 | `education-content-part1.ts` (Enzymes & Bioenergetics + 2D pathway) | Lipid, glycogen, amino-acid, nucleotide & vitamin coenzyme chapters | **P0** |
| **G** | Molecular Biology & Genetics | DNA replication, transcription, translation, mutations, Mendelian/X-linked inheritance | PK NCP, CBSE, England KS4, AP Bio, China 2022, WA, Oxford, QAA | Pre-Med, Med, Graduate | `introductory` (1 module) | 1 | `education-content-part1.ts` (Central Dogma & Inheritance + 2D diagram) | Interactive Punnett/pedigree solver; chromosomal disorders depth | **P0** |
| **H** | Microbiology & Parasitology | Bacteria (Gram+/−), viruses, fungi, parasites, sterilisation, AMR | PK NCP, CBSE, England KS4, PM&DC, UHS, HMS, QAA | School, Pre-Med, Med, Allied | `introductory` (1 module) | 1 | `education-content-part1.ts` (Pathogen classes & AMR + 2D comparison) | Licensed Gram-stain & parasitology microscopy slides; organism chapters | **P0** |
| **I** | Immunology & Host Defence | Innate/adaptive, MHC I/II, antibodies, vaccination, hypersensitivity | PK NCP, CBSE, England KS4, WA, PM&DC, HMS, Oxford, QAA | School, Pre-Med, Med, Clinical | `introductory` (1 module) | 1 | `education-content-part2.ts` (Innate/Adaptive & MHC + 3D Thymus/Spleen links) | Hypersensitivity Types I–IV, autoimmunity & immunodeficiency modules | **P0** |
| **J** | General & Systemic Pathology | Adaptation, injury, inflammation, Virchow’s triad, ischaemia, neoplasia | PM&DC, UHS, HMS, Oxford | Med, Clinical, Graduate | `introductory` (1 module) | 1 | `clinical-data.ts` (10 cases), `builtin-presentations.ts` (3 explainers), `education-content-part2.ts` | Authentic licensed histopathology/gross pathology slides; systemic chapters | **P0** |
| **K** | Pharmacology & Therapeutics | PK (ADME), PD (receptors, EC50/Emax, TI), autonomic & organ drug classes | PM&DC, UHS, Oxford, HMS | Med, Clinical, Allied, Graduate | `introductory` (1 module) | 1 | `education-content-part2.ts` (PK/PD + 2D ADME flow + 3D Liver/Kidney links) | Autonomic, cardiovascular, antimicrobial & CNS drug-class chapters | **P0** |
| **L** | Nutrition & Human Health | Macronutrients, vitamins, minerals, absorption sites, deficiencies | PK NCP 4–8 & IX, England KS3, China 2022, PM&DC | School, Pre-Med, Med, Allied | `introductory` (1 module) | 1 | `education-content-part2.ts` (Nutrients & GI absorption + 3D GI links) | Lifespan nutrition & malnutrition clinical exercises | **P1** |
| **M** | Haematology & Lab Medicine | Blood cells, ABO/Rh, haemostasis, CBC/MCV, urinalysis, organ markers | PK NCP, CBSE XI, PM&DC, UHS, HMS | Pre-Med, Med, Clinical, Allied | `introductory` (1 module) | 1 | `education-content-part2.ts` (Blood, Haemostasis & Lab Concepts) | Licensed Wright-Giemsa peripheral blood smear slides | **P1** |
| **N** | Radiology & Medical Imaging | X-ray, CT, MRI, Ultrasound physics; axial viewing convention; plane correlation | PM&DC, UHS, HMS, Anat. Soc. | Med, Clinical | `asset_missing` | 1 | `education-content-part2.ts` (Modality physics & 3D clipping plane link) | **Openly licensed de-identified normal X-ray, CT, MRI & Ultrasound datasets** | **P2** |
| **O** | Clinical Medicine & Specialties | System-based overview of internal medicine & surgical specialties | PM&DC, UHS, HMS | Med, Clinical | `introductory` (1 module) | 1 | `ClinicalPage.tsx` (10 cases), `PresentationStudioPage.tsx`, `education-content-part2.ts` | Expanded system-based specialty introductions | **P2** |
| **P** | Clinical Skills, Public Health & Ethics | History/exam frameworks, 4 pillars of ethics, EBM, epidemiology | PM&DC, UHS, HMS, Oxford | Med, Clinical, Allied, Graduate | `introductory` (1 module) | 1 | `education-content-part2.ts` (Clinical Reasoning, Ethics & Epidemiology) | Biostatistics worked exercises & OSCE communication checklists | **P1** |
