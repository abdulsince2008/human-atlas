# ANATOMY 360 — Verified Educational Source & Curriculum Register

All external educational sources referenced across the **267 chapters (`A`–`P`)** and **13 curriculum frameworks** are maintained in `app/education/verified-sources.ts` and `app/education/education-curricula.ts` and validated for HTTPS integrity on every `validateEducationSystem()` run.

---

## 1. Core Open Textbooks & Reference Portals (`VERIFIED_SOURCES` — 63 Entries, Checked 2026-11-23)

| Publisher / Source Family | Scope Covered in ANATOMY 360 | Canonical URL Root | Licence / Access Terms | Verification Status |
|---|---|---|---|---|
| **OpenStax *Anatomy & Physiology 2e*** (Rice University) | Anatomy (`A`), Histology (`C`), Embryology (`D`), Physiology (`E`), Immunology (`I`), Haematology (`M`), Nutrition (`L`), Clinical (`O`) — 25 chapter-specific links | `https://openstax.org/books/anatomy-and-physiology-2e/pages/1-6-anatomical-terminology` | CC BY 4.0 (Open Textbook) | Source Checked |
| **OpenStax *Biology 2e*** (Rice University) | Cell Biology (`B`), Biochemistry (`F`), Genetics (`G`), Embryology (`D`) — 9 chapter-specific links | `https://openstax.org/books/biology-2e/pages/4-3-eukaryotic-cells` | CC BY 4.0 (Open Textbook) | Source Checked |
| **OpenStax *Microbiology*** (Rice University) | Microbiology & Parasitology (`H`), Immunology (`I`), Infectious Diseases (`O9`) — 6 chapter-specific links | `https://openstax.org/books/microbiology/pages/3-introduction` | CC BY 4.0 (Open Textbook) | Source Checked |
| **NCBI Bookshelf / StatPearls & *MBoC* (Alberts)** | Cell Signalling (`NBK21054`), Cerebral Cortex (`NBK537247`), Thorax/Heart (`NBK470256`), Shoulder/Humerus (`NBK537056`) | `https://www.ncbi.nlm.nih.gov/books/` | NCBI Open Viewing / CC BY-NC-ND 4.0 (StatPearls) | Source Checked |
| **Histology Guide & University of Michigan Histology** | External whole-slide virtual microscopy pairs for Histology (`C1`–`C18`) while in-app micrographs are `asset_required` | `https://histologyguide.com/slidebox/slidebox.html` · `https://histology.medicine.umich.edu` | Non-Commercial Academic / CC BY-NC-SA 3.0 | Source Checked |
| **The Human Protein Atlas** | Organ/tissue immunohistochemistry & proteome reference | `https://www.proteinatlas.org/humanproteome/tissue` | CC BY-SA 4.0 | Source Checked |
| **IUPHAR Pharmacology Education Project** | Pharmacokinetics, pharmacodynamics, autonomic & systemic therapeutics (`K1`–`K20`) | `https://www.pharmacologyeducation.org` | CC BY-SA 4.0 | Source Checked |
| **University of Edinburgh *Pathologia* & Utah *WebPath*** | General/systemic pathology (`J1`–`J20`) and haematopathology tutorials (`M1`–`M17`) | `https://pathologia.ed.ac.uk/` · `https://webpath.med.utah.edu/` | Open Educational / Non-Commercial Academic | Source Checked |
| **MedPix (NIH/NLM) & Radiopaedia** | Diagnostic imaging orientation, planes, CNS & systemic cases (`N1`–`N14`) | `https://medpix.nlm.nih.gov` · `https://radiopaedia.org/articles/anatomical-planes` | Public Domain (MedPix) / CC BY-NC-SA 3.0 (Radiopaedia) | Source Checked |
| **Virtual Human Embryo (EHD)** | Carnegie Stages 1–23 human developmental cross-sections (`D1`–`D18`) | `https://www.ehd.org/virtual-human-embryo/` | Open Educational Access (Terms apply) | Source Checked |
| **Allen Human Brain Atlas** | Cortical & subcortical neuroanatomy (`A`, `E`) | `https://human.brain-map.org` | Allen Institute Open Data Terms | Source Checked |
| **CDC Public Health 101 & Geeky Medics** | Epidemiology, prevention (`cdc_ph101`) and systematic clinical examination / OSCEs (`geeky_medics`) for Domains `P` & `O` | `https://www.cdc.gov/training-publichealth101/` · `https://geekymedics.com/` | Public Domain (CDC) / Reference Portal (Geeky Medics) | Source Checked |
| **The Anatomical Society (UK) · PM&DC · QAA Biosciences** | Core gross anatomy outcomes, MBBS clerkship standards (6,200h minimum contact note), & graduate biosciences benchmark | `https://www.anatsoc.org.uk/` · `https://www.qaa.ac.uk/the-quality-code/subject-benchmark-statements/biosciences` | Academic & Regulatory Public Standards | Source Checked |

---

## 2. 3D Anatomical Geometry & Third-Party Licences (Preserved)

- **BodyParts3D 4.0 / Anatomography (`public/models/atlas.json`):** 2,234 adult male meshes · **CC BY 4.0** (Database Center for Life Science).
- **Foundational Model of Anatomy (FMA):** 3,432 indexed concepts · **FMA Custom Academic License** (`app/data/provenance-registry.ts`).
- **HuBMAP 3D Reference Organs (`public/models/female/female-atlas.json`):** 14 female reference meshes · **CC BY 4.0**.
- **Terminologia Anatomica (TA2):** Referenced nomenclature terms · **CC BY-ND 4.0**.

---

## 3. Curriculum Alignment Benchmarks (`CURRICULUM_FRAMEWORKS` — 13 Frameworks)

`pk_ncp_gs_4_8`, `pk_ncp_bio_9_12`, `pk_pmdc_mbbs` (6,200 minimum hours documented transparently), `pk_uhs_mbbs`, `in_cbse_bio_11_12`, `en_nc_science`, `us_ap_bio`, `cn_moe_bio_2022`, `au_wa_human_bio`, `hms_pathways`, `ox_preclinical`, `qaa_biosciences`, and `anat_soc_core`. Alignment mappings indicate thematic curriculum support—not official accreditation or endorsement by any external regulator.
