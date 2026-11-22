# ANATOMY 360 — Curriculum Alignment & Worldwide Reference Research

**Date Accessed / Verified:** 2026-11-22  
**Product Scope:** Educational human biology and medical sciences learning platform spanning **6 academic tracks** (`School Foundations 6–8` → `Secondary / Pre-Medical 9–12` → `Medical Foundations` → `Clinical / Applied Medicine` → `Allied Health` → `Graduate / BS / MPhil / PhD Research`).  
**Important Educational Boundary:** ANATOMY 360 is an educational learning support platform. Alignment with any published curriculum indicates topic mapping only and does **not** constitute official endorsement, accreditation, or replacement of cadaveric dissection, clinical clerkships, qualified medical faculty, or clinical decision-making.

---

## 1. Curriculum References Audited (13 Distinct Authorities & Institutional Examples)

> **Authority Distinction:** The 13 references below are **not** equivalent legal authorities. They include national statutory curricula (Pakistan NCC, England DfE, China MOE), a national medical regulator (PM&DC), examination boards (CBSE, Western Australia SCSA), an optional advanced programme (College Board AP), higher-education quality/society benchmarks (UK QAA Biosciences, Anatomical Society Core Syllabi), and individual university curricula (UHS Lahore, Harvard Medical School, University of Oxford). All 13 are browsable interactively inside `#/syllabus` alongside the custom unlisted-syllabus matcher.

| ID | Reference Title | Authority / Publisher | Country & Geographic Scope | Version / Academic Year | Requirement Type | Date Accessed | URL |
|---|---|---|---|---|---|---|---|
| `pk_ncp_gs_4_8` | National Curriculum of Pakistan — General Science (Grades 4–8) | National Curriculum Council (NCC) | Pakistan (Federal/ICT baseline; provincial adoption varies) | NCP 2022–2023 notified framework | Compulsory | 2026-11-19 | https://www.ncc.gov.pk/Detail/MjM3NGE4Y2ItNjIyNC00ZTY5LTg0OTQtOWZhZWMzODRlYTQ2 |
| `pk_ncp_bio_9_12` | National Curriculum of Pakistan — Biology (Grades IX–XII) | National Curriculum Council (NCC) | Pakistan (Federal/FBISE baseline; provincial BISE adoption is board-dependent) | NCP 2023/2026 rationalized SLO framework | Elective stream (Science / Pre-Medical) | 2026-11-19 | https://www.ncc.gov.pk/SiteImage/Misc/files/Biology.pdf |
| `pk_pmdc_mbbs` | PM&DC Guidelines for Undergraduate Medical Education (MBBS) | Pakistan Medical and Dental Council (PM&DC) | Pakistan (National regulatory baseline for accredited MBBS) | 2024 Guidelines (min 6,200 contact hours / 5 years) | Professional guideline | 2026-11-19 | https://www.pmdc.pk/Documents/Others/PM%26DC%20GUIDELINES%20FOR%20UG%20M.EDUCATION-06242024035407.pdf |
| `pk_uhs_mbbs` | UHS Lahore — MBBS Modular Integrated Curriculum (2K23) | University of Health Sciences (UHS), Lahore | Pakistan — Punjab UHS-affiliated colleges | Curriculum 2K23 v2.0 | Institutional example | 2026-11-19 | https://www.uhs.edu.pk/downloads/2k23mbbscurriculumv20.pdf |
| `in_cbse_bio_11_12` | CBSE Biology Curriculum (Classes XI–XII) | Central Board of Secondary Education (CBSE) | India (CBSE-affiliated schools; not all state boards) | Academic Year 2026–27 | Elective stream | 2026-11-19 | https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart2/Biology_SecP2_2026-27.pdf |
| `en_nc_science` | National Curriculum in England — Science Programmes of Study | Department for Education (DfE) | **England only** (Scotland, Wales, NI separate) | Statutory Key Stages 3 & 4 | Compulsory | 2026-11-19 | https://www.gov.uk/government/publications/national-curriculum-in-england-science-programmes-of-study/national-curriculum-in-england-science-programmes-of-study |
| `us_ap_bio` | AP Biology Course Framework | College Board | United States & international schools (**advanced optional course**) | 8-Unit AP Biology Framework | Advanced optional | 2026-11-19 | https://apcentral.collegeboard.org/courses/ap-biology |
| `cn_moe_bio_2022` | Compulsory Education Biology Curriculum Standards | Ministry of Education (MOE), PRC | China (National compulsory standard, Grades 7–9) | 2022 Edition | Compulsory | 2026-11-19 | https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220420582359998122.pdf |
| `au_wa_human_bio` | Senior Secondary Human Biology (ATAR) | School Curriculum and Standards Authority (SCSA), Western Australia | **Western Australia state syllabus** | ATAR Units 1–4 (Years 11–12) | Elective stream | 2026-11-19 | https://senior-secondary.scsa.wa.edu.au/syllabus-and-support-materials/science/human-biology |
| `hms_pathways` | Pathways MD Curriculum | Harvard Medical School | United States (institution-specific example) | Pathways Curriculum (Pre-Clerkship → PCE → Post-PCE) | Institutional example | 2026-11-19 | https://hms.harvard.edu/education-admissions/md-program/curriculum/pathways |
| `ox_preclinical` | Pre-Clinical Medical Course Structure (A100) | Medical Sciences Division, University of Oxford | England / UK (institution-specific example) | A100 Pre-Clinical Years 1–3 | Institutional example | 2026-11-19 | https://www.medsci.ox.ac.uk/study/medicine/pre-clinical/structure/pre-clinical-course-structure-description |
| `qaa_biosciences` | UK QAA Subject Benchmark Statement: Biosciences | Quality Assurance Agency for Higher Education (QAA) | United Kingdom higher-education reference (BSc Hons, Master's/MPhil, PhD) | 2023 Subject Benchmark Statement | Professional guideline | 2026-11-21 | https://www.qaa.ac.uk/the-quality-code/subject-benchmark-statements/biosciences |
| `anat_soc_core` | Anatomical Society Core Regional & Systemic Anatomy Syllabi | The Anatomical Society (UK & Ireland) | Academic undergraduate, medical & postgraduate anatomy programmes | Published Core Syllabi Reference | Professional guideline | 2026-11-21 | https://www.anatsoc.org.uk |

---

## 2. Custom Unlisted Syllabus Matching (`#/syllabus`)

For any school, board, college, or university syllabus not listed among the 13 references above, Anatomy 360 provides a purely client-side **Custom Syllabus Matcher** (`app/syllabus/syllabus-parser.ts` & `app/syllabus/syllabus-mapper.ts`):
1. Accepts country, institution, programme, degree, year/semester, and course metadata alongside pasted text, `.txt`/`.md`/`.csv` upload, or manual rows.
2. Expands medical abbreviations/synonyms (`PK`/`ADME`, `ABG`, `CVS`, `CNS`, `GI`, `AMR`, etc.) against the 46 canonical registry topics.
3. Requires explicit user confirmation for uncertain `suggested` matches, supports multi-to-multi remapping, and reports truthful coverage (`Available`, `Partially Available` for introductory/asset-missing topics, or `Not Available Yet`).
4. Persists locally via IndexedDB (`localStorage` fallback) with JSON export/import and one-click handoff into the **Teacher & Professor Workspace (`#/educator`)**.

---

## 3. Pakistan-Specific PM&DC MBBS Subject-Minimum Hour Reference
*(Strictly a Pakistan-specific regulatory reference — NOT a universal global percentage model. Individual subject minimums/ranges below do NOT sum mechanically to the 6,200-hour programme minimum because colleges allocate integrated, longitudinal, elective, and self-directed hours differently.)*

| Subject Area | Minimum / Reference Hours | Phase | Mapped Anatomy 360 Domains |
|---|---|---|---|
| Anatomy (Gross, Histology, Embryology) | 500–600 h minimum range | Pre-Clinical | A (`human_anatomy`), C (`histology`), D (`embryology`) |
| Physiology | 450–600 h minimum range | Pre-Clinical | E (`human_physiology`) |
| Biochemistry | 250–300 h minimum range | Pre-Clinical | F (`biochemistry`), G (`molecular_genetics`) |
| Pathology (General, Special, Haematology, Microbiology & Parasitology) | 500 h minimum | Paraclinical | J (`pathology`), H (`microbiology_parasitology`), I (`immunology`), M (`haematology_lab`) |
| Pharmacology & Therapeutics | 300 h minimum | Paraclinical | K (`pharmacology`) |
| Community Medicine & Public Health | ~170 h reference | Paraclinical | P (`clinical_skills_public_health`), L (`nutrition_health`) |
| Forensic Medicine & Toxicology | 100 h minimum | Paraclinical | P (`clinical_skills_public_health`), K (`pharmacology`) |
| Medicine & Allied Specialties | 1,700 h clinical allocation | Clinical | O (`clinical_specialties`), N (`radiology_imaging`) |
| Surgery & Allied Specialties | 1,625 h clinical allocation | Clinical | O (`clinical_specialties`), A (`human_anatomy`) |
| **Overall 5-Year MBBS Programme Minimum** | **6,200 contact hours** | **All Phases** | Includes institutional longitudinal, elective & SDL balance |
