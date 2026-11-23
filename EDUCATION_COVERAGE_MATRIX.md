# ANATOMY 360 — Education Coverage Matrix & Verified Inventory

**Audit Date:** 2026-11-23  
**Verified Repository Inventory (Measured Directly from Source Files & Registry):**
- `public/models/atlas.json`: **2,234** selectable BodyParts3D 4.0 meshes (15 binary chunks, 2,288,268 triangles), **3,432** FMA concepts (adult male reference anatomy); plus `public/models/female/female-atlas.json` (**14** HuBMAP female reference meshes).
- `app/education/chapters/`: **16** human biology & medical science domains (`A`–`P`), **267** structured chapter modules, **802** core learning outcomes, **570** verified HTTPS reading references, **267** original 9-slide decks (**2,403** slides total), **267** 5-scene narrated video storyboard scripts (**0** fabricated external video URLs), **1,415** chapter MCQs, **801** structured short-answer rubric exercises, and **267** worked applied reasoning cases.
- `app/registry/knowledge-registry.ts`: **16** domains, **16** subjects, **280** chapters (`12` system anatomy + `267` domain curriculum + `1` planned endocrine specification), **296** registry topics (`28` system anatomy lesson topics + `267` curriculum chapters + `1` planned endocrine specification slot).
- `app/anatomy-systems.ts`: **12** canonical organ systems.
- `app/anatomy-knowledge.ts`: **112** curated V2 anatomical knowledge entries and **58** verified relationships.
- `app/learning-data.ts`: **12** system lesson chapters, **28** structured topics, **8** guided 3D pathways, **32** terminology entries.
- `app/data/physiology-data.ts`: **6** physiology specifications (**5** interactive quantitative evaluators: Cardiac, Respiratory, Renal, Musculoskeletal, Acid-Base Henderson–Hasselbalch; **1** planned endocrine feedback spec).
- `app/data/histology-data.ts`: **10** histology entries with self-checks (**0** genuine licensed microscopy images bundled — marked `asset_missing` / `asset_required`).
- `app/data/clinical-data.ts`: **10** anatomy-led clinical correlation cases (**3** linked to built-in 3D presentations).
- `app/presentation/builtin-presentations.ts`: **5** built-in 3D presentations + browser-native local WebM video recorder.
- **Total Assessments Across Platform:** **1,478** MCQ-style items (`1,415` chapter MCQs + `43` anatomy quiz bank + `10` clinical case checks + `10` histology checks), plus **801** short-answer exercises and **267** applied reasoning exercises.

---

## Status Legend & Separation of Statuses (Mandate Sections 6 & 7)
- **Written Curriculum Status:** `complete_for_core_scope` across all 267 declared chapter blueprints (original multi-track prose, mechanisms, comparison tables, misconceptions, summaries).
- **External Media Assets (`asset_required`):** **85** chapters across Histology (18), Microbiology (16), Pathology (20), Haematology (17), and Radiology (14) require licensed real photomicrographs, Gram stains, blood smears, or de-identified DICOM/radiology images.
- **External Video Links:** **0** verified external video URLs are claimed; every chapter carries an explicit unavailability disclosure paired with an original 5-scene narrated Video Script & Storyboard (`unavailable_fallback_script`).
- **Academic Review Status:** `awaiting_academic_review` across all **267** chapters (**0** faculty-reviewed chapters — zero false `faculty_reviewed` or `expert_verified` labels).

---

## 1. Domain Coverage Matrix (All 16 Domains — 267 Chapters)

| Code | Domain | Chapters | Learning Outcomes | Reading Links | Interactive Decks (Slides) | Verified Videos / Fallback Scripts | MCQs | Short Answers | Applied Cases | Asset-Blocked Chapters | Review Status | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **A** | Human Anatomy | 14 | 42 | 30 | 14 (126) | 0 / 14 | 75 | 42 | 14 | 0 (partial 3D scope notes) | `awaiting_academic_review` | **P1** |
| **B** | Cell Biology & Cytology | 10 | 31 | 22 | 10 (90) | 0 / 10 | 60 | 30 | 10 | 0 | `awaiting_academic_review` | **P0** |
| **C** | Histology & Microscopic Anatomy | 18 | 54 | 54 | 18 (162) | 0 / 18 | 90 | 54 | 18 | **18 (`asset_required`)** | `awaiting_academic_review` | **P0/P1** |
| **D** | Embryology & Human Development | 18 | 54 | 36 | 18 (162) | 0 / 18 | 95 | 54 | 18 | 0 | `awaiting_academic_review` | **P0** |
| **E** | Human Physiology & Homeostasis | 16 | 48 | 32 | 16 (144) | 0 / 16 | 85 | 48 | 16 | 0 (+1 planned endocrine) | `awaiting_academic_review` | **P0** |
| **F** | Biochemistry & Human Metabolism | 19 | 57 | 32 | 19 (171) | 0 / 19 | 100 | 57 | 19 | 0 | `awaiting_academic_review` | **P0** |
| **G** | Molecular Biology & Genetics | 16 | 48 | 32 | 16 (144) | 0 / 16 | 85 | 48 | 16 | 0 | `awaiting_academic_review` | **P0** |
| **H** | Microbiology & Parasitology | 16 | 48 | 16 | 16 (144) | 0 / 16 | 85 | 48 | 16 | **16 (`asset_required`)** | `awaiting_academic_review` | **P0** |
| **I** | Immunology & Host Defence | 17 | 51 | 34 | 17 (153) | 0 / 17 | 90 | 51 | 17 | 0 | `awaiting_academic_review` | **P0** |
| **J** | General & Systemic Pathology | 20 | 60 | 60 | 20 (180) | 0 / 20 | 105 | 60 | 20 | **20 (`asset_required`)** | `awaiting_academic_review` | **P0** |
| **K** | Pharmacology & Therapeutics | 20 | 60 | 35 | 20 (180) | 0 / 20 | 105 | 60 | 20 | 0 | `awaiting_academic_review` | **P0** |
| **L** | Nutrition & Human Health | 14 | 42 | 28 | 14 (126) | 0 / 14 | 75 | 42 | 14 | 0 | `awaiting_academic_review` | **P1** |
| **M** | Haematology & Laboratory Medicine | 17 | 51 | 34 | 17 (153) | 0 / 17 | 90 | 51 | 17 | **17 (`asset_required`)** | `awaiting_academic_review` | **P1** |
| **N** | Radiology & Medical Imaging | 14 | 42 | 35 | 14 (126) | 0 / 14 | 75 | 42 | 14 | **14 (`asset_required`)** | `awaiting_academic_review` | **P2** |
| **O** | Clinical Medicine & Specialties | 18 | 54 | 52 | 18 (162) | 0 / 18 | 95 | 54 | 18 | 0 | `awaiting_academic_review` | **P2** |
| **P** | Clinical Skills, Public Health & Ethics | 20 | 60 | 38 | 20 (180) | 0 / 20 | 105 | 60 | 20 | 0 | `awaiting_academic_review` | **P1** |
| **TOTAL** | **All 16 Domains (`A`–`P`)** | **267** | **802** | **570** | **267 (2,403)** | **0 / 267** | **1,415** | **801** | **267** | **85** | **0 / 267 faculty reviewed** | **P0–P2** |
