# ANATOMY 360 — Shared Educational & Registry Architecture

## 1. Architectural Overview

ANATOMY 360 connects 3D human anatomy, biomedical modules, labs, assessments, and worldwide syllabi through a strongly typed shared registry layer backed by client-side IndexedDB/`localStorage` persistence:

```
app/education/
  ├── education-types.ts          # Canonical taxonomy, track, curriculum, diagram, quiz & asset types
  ├── education-curricula.ts      # 6 learning tracks + 13 curriculum frameworks + PM&DC reference
  ├── education-domains.ts        # 16 human-biology & medical-science domains with asset disclosures
  ├── education-content-part1.ts  # Level-differentiated modules (Domains A–H)
  ├── education-content-part2.ts  # Level-differentiated modules (Domains I–P)
  ├── education-content.ts        # Unified topic index, track depth resolver & system mappings
  └── education-validation.ts     # Automated validator enforcing FMA links, quiz bounds & governance

app/registry/
  ├── registry-types.ts           # Canonical Domain → Subject → Chapter → Topic & metrics types
  ├── knowledge-registry.ts       # Unifies all 16 domains, 29 chapters, 46 topics, FMA 3D links, labs & quizzes
  └── registry-validation.ts      # Integrity checks (zero false expert_verified, honest planned/asset gaps)

app/syllabus/
  ├── syllabus-types.ts           # CustomSyllabusProfile, mapping confidence & coverage report schemas
  ├── syllabus-parser.ts          # Parses pasted text, Markdown headings, numbered lists & CSV lines
  └── syllabus-mapper.ts          # Token/synonym/keyword matcher + honest 3-bucket coverage report engine
```

---

## 2. Canonical Hierarchy & Truthful Coverage Rules

- **Four-Level Registry (`16 Domains → 16 Subjects → 29 Chapters → 46 Topics`):**
  - **28 Anatomy Lesson Topics** from `ANATOMY_LESSONS` (`substantially_covered`, `countsAsFullCoverage: true`, linked directly to verified BodyParts3D FMA meshes, `TOPIC_DEPTH_SUPPLEMENTS`, `PHYSIOLOGY_MODULES`, `QUIZ_QUESTIONS`, and `SYSTEM_TEACHING_METADATA`).
  - **17 Biomedical Modules** from `EDUCATION_TOPICS` across Domains A–P (`countsAsFullCoverage: false` for introductory/partial modules; `assetStatus: 'asset_missing'` for Histology and Radiology).
  - **1 Planned Specification Slot** (`endocrine-feedback-planned` under `human_physiology`, explicitly `coverageStatus: 'planned'`).
- **6 Academic Tracks:** `school_foundations` (Grades 6–8), `secondary_premed` (Grades 9–12 / FSc / MDCAT / CBSE / A-Level), `medical_foundations` (MBBS/MD Pre-Clinical), `clinical_applied` (Clerkship), `allied_health` (Nursing & Allied Health), and `graduate_research` (BS / MPhil / PhD).
- **Governance & Honest Disclosures:**
  - `reviewStatus` is restricted strictly to `structured_reference | curriculum_draft | needs_academic_review | pending_faculty_review` (automated tests fail if any record claims `faculty_reviewed` or `expert_verified` without faculty sign-off).
  - Histology and Radiology enforce `asset_missing` disclosures so text/diagram overviews never masquerade as real micrographs or diagnostic radiographs.

---

## 3. Navigation, Unified Search & Custom Syllabus Integration

- **Homepage Gateway (`app/pages/HomePage.tsx`):** Global search hero + Section A (`#/syllabus`), Section B (all 16 subjects), Section C (12 canonical 3D body systems), Section D (`#/educator` + 8 labs), and live `computeRegistryMetrics(atlas)` stats.
- **Worldwide Syllabus Navigator (`app/pages/SyllabusNavigatorPage.tsx`, `#/syllabus`):** Browse 13 official curricula with provenance URLs and alignment-vs-endorsement notices, or parse/upload any unlisted syllabus locally, confirm suggested mappings, remap items multi-to-multi, inspect `available` vs `partially_available` vs `not_available_yet` coverage, and persist profiles in `StudyContext`.
- **Unified Search (`app/search-engine.ts` + `app/pages/SearchPage.tsx`, `#/search`):** Deduplicated index spanning domains, registry topics, 3D FMA concepts, terminology, physiology, histology, clinical cases, 3D presentations, MCQs, official curricula, and educator guides.
- **Universal Educator Workspace (`app/utils/educator-export.ts` + `app/components/EducatorToolkitPanel.tsx`, `#/educator`):** Works across all 16 domains, 13 frameworks, and saved custom syllabi; supports persisted topic sequencing (`educatorSequences`) and Markdown export of Lecture Outlines and Student Worksheets.
