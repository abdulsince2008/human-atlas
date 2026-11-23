# ANATOMY 360 — Master Curriculum Blueprint (16 Domains · 267 Chapters)

**Version:** 2026-11-23 · **Status:** Core curriculum authored (`complete_for_core_scope` for declared written material; `awaiting_academic_review` across all chapters)

This register enumerates all **16 domains (`A`–`P`)** and **267 chapters** verified in `app/education/chapters/` and indexed by `app/education/education-content.ts`.

| Domain Code | Domain ID | Title | Expected / Authored Chapters | Learning Outcomes | Tracks Supported | Primary Source Files |
|---|---|---|---|---|---|---|
| **A** | `human_anatomy` | Human Anatomy | 14 (`A1`–`A14`) | 42 | All 6 tracks | `app/education/chapters/domain-a-anatomy.ts`, `app/learning-data.ts` |
| **B** | `cell_biology` | Cell Biology & Cytology | 10 (`B1`–`B10`) | 31 | School, Pre-Med, Med, Allied, Graduate | `app/education/chapters/domain-b-cell.ts` |
| **C** | `histology` | Histology & Microscopic Anatomy | 18 (`C1`–`C18`) | 54 | Pre-Med, Med, Clinical, Allied, Graduate | `app/education/chapters/domain-c-histology.ts`, `app/data/histology-data.ts` |
| **D** | `embryology` | Embryology & Human Development | 18 (`D1`–`D18`) | 54 | Pre-Med, Med, Clinical, Allied, Graduate | `app/education/chapters/domain-d-embryology.ts` |
| **E** | `human_physiology` | Human Physiology & Homeostasis | 16 (`E1`–`E16`) | 48 | All 6 tracks | `app/education/chapters/domain-e-physiology.ts`, `app/data/physiology-data.ts` |
| **F** | `biochemistry` | Biochemistry & Human Metabolism | 19 (`F1`–`F19`) | 57 | Pre-Med, Med, Clinical, Allied, Graduate | `app/education/chapters/domain-f-biochemistry.ts` |
| **G** | `molecular_genetics` | Molecular Biology & Genetics | 16 (`G1`–`G16`) | 48 | School, Pre-Med, Med, Clinical, Allied, Graduate | `app/education/chapters/domain-g-genetics.ts` |
| **H** | `microbiology_parasitology` | Microbiology & Parasitology | 16 (`H1`–`H16`) | 48 | School, Pre-Med, Med, Clinical, Allied, Graduate | `app/education/chapters/domain-h-microbiology.ts` |
| **I** | `immunology` | Immunology & Host Defence | 17 (`I1`–`I17`) | 51 | School, Pre-Med, Med, Clinical, Allied, Graduate | `app/education/chapters/domain-i-immunology.ts` |
| **J** | `pathology` | General & Systemic Pathology | 20 (`J1`–`J20`) | 60 | Med, Clinical, Allied, Graduate | `app/education/chapters/domain-j-pathology.ts`, `app/data/clinical-data.ts` |
| **K** | `pharmacology` | Pharmacology & Therapeutics | 20 (`K1`–`K20`) | 60 | Med, Clinical, Allied, Graduate | `app/education/chapters/domain-k-pharmacology.ts` |
| **L** | `nutrition_health` | Nutrition & Human Health | 14 (`L1`–`L14`) | 42 | All 6 tracks | `app/education/chapters/domain-l-nutrition.ts` |
| **M** | `haematology_lab` | Haematology & Laboratory Medicine | 17 (`M1`–`M17`) | 51 | Pre-Med, Med, Clinical, Allied, Graduate | `app/education/chapters/domain-m-haematology.ts` |
| **N** | `radiology_imaging` | Radiology & Medical Imaging | 14 (`N1`–`N14`) | 42 | Med, Clinical, Allied, Graduate | `app/education/chapters/domain-n-radiology.ts` |
| **O** | `clinical_specialties` | Clinical Medicine & Specialties | 18 (`O1`–`O18`) | 54 | Med, Clinical, Allied, Graduate | `app/education/chapters/domain-o-clinical.ts` |
| **P** | `clinical_skills_public_health` | Clinical Skills, Public Health & Ethics | 20 (`P1`–`P20`) | 60 | Pre-Med, Med, Clinical, Allied, Graduate | `app/education/chapters/domain-p-practice.ts` |
| **TOTAL** | **16 Domains** | **Domains A–P** | **267 Chapters** | **802 Outcomes** | **6 Academic Tracks · 13 Curricula** | **Validated by `education-validation.ts`** |

---

## Legacy & Existing Module Preservation

All **267** domain chapters extend — without duplicating or replacing — pre-existing Anatomy 360 modules:
- **BodyParts3D 3D Atlas:** `2,234` adult male meshes (`3,432` FMA concepts) + `14` HuBMAP female meshes mapped to `A1`–`A14` and cross-domain anatomical anchors (`relatedFmaConceptIds`).
- **System Anatomy Lessons (`app/learning-data.ts`):** `12` canonical system lessons (`28` topics, `8` guided pathways, `32` terminology items) synchronized via `onOpenSystemLesson`.
- **Quantitative Physiology Simulators (`app/data/physiology-data.ts`):** `5` active evaluators + `1` planned endocrine spec linked to `E1`–`E16`.
- **Built-In 3D Presentations (`app/presentation/builtin-presentations.ts`):** `5` interactive 3D walkthroughs linked alongside `267` original 9-slide chapter decks (`ChapterPresentationDeck`).
