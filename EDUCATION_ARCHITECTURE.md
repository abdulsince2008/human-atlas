# ANATOMY 360 — Shared Educational Architecture

## 1. Architectural Overview

Rather than creating disconnected mini-applications, ANATOMY 360 uses a shared, strongly typed educational domain layer in `app/education/` that integrates seamlessly with existing 3D anatomy, physiology simulations, histology entries, clinical cases, 3D presentations, and the `StudyContext` progress store.

```
app/education/
  ├── education-types.ts          # Canonical taxonomy, track, curriculum, diagram, quiz & asset types
  ├── education-curricula.ts      # 5 student learning tracks + 11 official curriculum frameworks + PM&DC reference
  ├── education-domains.ts        # 16 human-biology & medical-science domains with honest coverage & asset disclosures
  ├── education-content-part1.ts  # Foundational level-differentiated modules (Domains A–H)
  ├── education-content-part2.ts  # Disease, therapeutics & clinical modules (Domains I–P)
  ├── education-content.ts        # Unified topic index, track depth resolver & existing platform mappings
  └── education-validation.ts     # Automated validator enforcing FMA mesh links, quiz bounds & governance
```

---

## 2. Shared Data Model & Level-Appropriate Depth

Every `EducationTopic` binds together:
- **Taxonomy:** `domainId`, `chapterTitle`, `title`, `targetTracks` (`school_foundations`, `secondary_premed`, `medical_foundations`, `clinical_applied`, `allied_health`).
- **Curriculum Provenance:** `curriculumMappings[]` referencing verified IDs in `CURRICULUM_FRAMEWORKS` with grade/year, unit/module, and requirement status (`compulsory`, `elective`, `optional`, `recommended`, `institution_specific`).
- **Differentiated Explanations (`depthExplanations`):** Separate explanations authored for School Foundations, Secondary/Pre-Medical, Medical Foundations, Clinical/Applied, and Allied Health so students study the same canonical scientific concept at appropriate depth without duplicating conflicting records.
- **Right-Sized Visuals:**
  - Verified 3D FMA concept links (`relatedFmaConceptIds`, validated against `public/models/atlas.json`) for gross anatomy and organ-level cross-links.
  - Data-driven 2D conceptual diagrams (`TopicDiagramSpec`: pathways, hierarchies, comparisons, cycles) clearly labeled as educational schematics.
  - Deep-links to quantitative simulations (`#/physiology`), Histology (`#/histology`), Clinical Cases (`#/clinical`), 3D Presentations (`#/present`), and System Lessons (`#/learn`).
- **Honest Asset & Review Governance:**
  - Explicit `assetDisclosure` (`available`, `partial`, `asset_required`, `conceptual_diagram_only`) with `missingAssets[]`.
  - `reviewStatus` strictly restricted to `structured_reference | curriculum_draft | pending_faculty_review` (automated tests fail if any record claims `expert_verified` without human faculty sign-off).
  - Mandatory `educationalDisclaimer` on clinical, pathology, pharmacology, haematology/lab, radiology, and clinical-skills domains.

---

## 3. UI & Study Progress Integration

- **Entry Point:** Integrated directly inside `#/learn` (`app/pages/LearnPage.tsx`) via the **Human Biology & Medical Sciences** tab (`app/components/MedicalCurriculumHub.tsx`), preserving all four existing tabs (*Learn by Anatomical System*, *Learn by Individual Structure*, *Explore the Human Body*, *Anatomy Terminology*) without cluttering the top navigation bar.
- **Progress Persistence:**
  - Topic completion (`Mark Completed`) persists via `useStudy().setTopicCompleted()`.
  - Self-assessment concept checks persist via `useStudy().recordQuizResult()`.
- **Validation Pipeline:**
  - `app/education.test.ts` (unit tests via `npx tsx --test`) and Section 7 of `scripts/test-platform.mjs` (`npm test` / `npm run validate:all`) automatically verify unique IDs, valid curriculum links, real FMA mesh existence in `atlas.json`, valid MCQ bounds, honest asset disclosures for Histology and Radiology, and zero false `expert_verified` claims.
