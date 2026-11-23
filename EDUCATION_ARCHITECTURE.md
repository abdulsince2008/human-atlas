# ANATOMY 360 — Shared Educational & Registry Architecture

## 1. Architectural Overview

ANATOMY 360 connects 3D human anatomy, all 16 biomedical domains (`A`–`P`, **267 chapters**), interactive chapter study decks, labs, assessments, and worldwide syllabi through a strongly typed shared registry layer backed by client-side IndexedDB/`localStorage` persistence:

```
app/education/
  ├── education-types.ts             # Canonical types: tracks, frameworks, decks, video scripts, trackers
  ├── verified-sources.ts            # 63 verified HTTPS open educational references + licence metadata
  ├── chapter-package-engine.ts      # Generates 9-slide decks, 5-scene storyboards, trackers & reading links
  ├── chapters/domain-a..p-*.ts      # Complete 16-domain chapter files (267 chapters total)
  ├── education-curricula.ts         # 6 learning tracks + 13 curriculum frameworks + PM&DC 6,200h reference
  ├── education-domains.ts           # 16 domain specs with honest asset & disclaimer disclosures
  ├── education-content.ts           # Unified 267-chapter index, track resolver & completion aggregators
  └── education-validation.ts        # Validator enforcing 267 chapters, FMA meshes, quiz bounds & review honesty

app/components/
  ├── MedicalCurriculumHub.tsx       # 7-tab chapter study workspace (Learn, Read, Watch, Presentations, Visualise, Practise, References)
  └── ChapterDeckViewer.tsx          # Interactive 9-slide deck viewer with Slide 6 tables, Slide 8 MCQ & MD export

app/registry/
  ├── registry-types.ts              # Canonical Domain → Subject → Chapter → Topic & metrics types
  ├── knowledge-registry.ts          # Unifies 16 domains, 280 chapters, 296 topics, FMA 3D links, labs & quizzes
  └── registry-validation.ts         # Integrity checks (zero false expert_verified, honest planned/asset gaps)

app/syllabus/
  ├── syllabus-types.ts              # CustomSyllabusProfile, mapping confidence & coverage report schemas
  ├── syllabus-parser.ts             # Parses pasted text, Markdown headings, numbered lists & CSV lines
  └── syllabus-mapper.ts             # Synonym/keyword matcher & honest 3-bucket coverage report engine
```

---

## 2. Canonical Hierarchy & Truthful Governance Rules

- **Four-Level Registry (`16 Domains → 16 Subjects → 280 Chapters → 296 Registry Topics`):**
  - **28 System Anatomy Lesson Topics** from `ANATOMY_LESSONS` (`substantially_covered`, `countsAsFullCoverage: true`, synchronized with verified BodyParts3D FMA meshes, `TOPIC_DEPTH_SUPPLEMENTS`, `PHYSIOLOGY_MODULES`, `QUIZ_QUESTIONS`, and `SYSTEM_TEACHING_METADATA`).
  - **267 Biomedical Curriculum Chapters** across Domains `A`–`P` (`EDUCATION_TOPICS`): each chapter supplies multi-track depth explanations, prerequisites, objectives, comparison tables, misconceptions, interactive 2D schematics, FMA 3D concept links, curated external reading links, 5-scene storyboard scripts, interactive 9-slide decks, 5–10 MCQs, 3 short-answer rubric exercises, 1 applied reasoning exercise, and Section 7 completion tracking.
  - **1 Planned Specification Slot** (`endocrine-feedback-planned` under `human_physiology`, explicitly `coverageStatus: 'planned'`).
- **6 Academic Tracks:** `school_foundations` (Grades 6–8), `secondary_premed` (Grades 9–12 / FSc / MDCAT / CBSE / A-Level), `medical_foundations` (MBBS/MD Pre-Clinical), `clinical_applied` (Clerkship), `allied_health` (Nursing & Allied Health), and `graduate_research` (BS / MPhil / PhD).
- **Separated Resource Experience (Mandate Section 8):**
  1. **Learn** — written lesson, track-differentiated explanations, comparison tables, misconceptions, summaries.
  2. **Read** — verified open-access readings with licences/check dates + downloadable `.md` study guide.
  3. **Watch** — explicit external video unavailability notice + 5-scene narrated storyboard script + `.md` export.
  4. **Presentations** — interactive 9-slide `ChapterDeckViewer` + `.md` deck export + connected 3D presentations.
  5. **Visualise** — interactive 2D node/pathway inspector, verified 3D FMA structure launches, organ links, and `asset_required` alerts.
  6. **Practise** — MCQs, expandable short-answer rubrics, worked applied clinical/lab reasoning exercises, and applied tasks.
  7. **References** — cross-subject links, curriculum alignment, source provenance, and Section 7 16-domain completion matrix.
- **Zero False Verification:** Every topic enforces `reviewStatus: 'awaiting_academic_review'` / `'structured_reference'`; validators reject `expert_verified` or `faculty_reviewed`, and `asset_missing` / `asset_required` remains enforced on Histology, Microbiology, Pathology, Haematology, and Radiology until licensed media datasets are bundled.
