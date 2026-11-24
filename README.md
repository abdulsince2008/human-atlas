# Anatomy 360

**Anatomy 360** is a connected, searchable, syllabus-aware 3D human anatomy and human sciences learning platform for Grades 6–12, FSc pre-medical, MDCAT, CBSE, A-Level, MBBS/MD, nursing/allied health, BS/MPhil/PhD biosciences, and educators. Built with React, TypeScript, Three.js, the **BodyParts3D 4.0** adult male reference dataset (**2,234** selectable meshes, **3,432** FMA concepts), and a co-registered **Female Anatomy Overlay** (**79** parts / **124.4k** triangles: **71** HuBMAP HRA CC BY 4.0 meshes + **8** anatomically aligned procedural reconstructions, replacing 29 male-specific/pelvic parts for **2,284** active female-mode parts), it unites 3D anatomy with a **Universal Knowledge & Curriculum Coverage Registry (`16` domains · `280` chapters · `296` topics)**, a **Worldwide Syllabus Navigator** (`13` curriculum alignment references + custom syllabus local matching), unified cross-domain search, and a universal **Teacher & Professor Workspace**.

## Key Capabilities

- **Homepage Gateway (`#/`):** Global unified search entry, **Section A — Find My Syllabus** (`#/syllabus`), **Section B — Browse All 16 Subjects**, **Section C — Explore the Human Body** (12 canonical 3D systems with Male/Female toggle), **Section D — Teacher & Professor Workspace** (`#/educator`) + connected study labs, and live-computed registry metrics.
- **Universal Knowledge Registry & 16-Domain Curriculum (`app/registry/`, `app/education/`):** Canonical `Domain (16) → Subject (16) → Chapter (280) → Topic (296)` hierarchy uniting 12 anatomical lesson chapters (28 topics), 267 chapters across **6 learning tracks** (`School 6–8`, `Secondary / Pre-Med 9–12`, `Medical Foundations`, `Clinical & Applied`, `Allied Health`, `Graduate / BS / MPhil / PhD`), and 1 planned Endocrine specification slot — where `chapter-package-engine.ts` generates 267 9-slide decks (`2,403` slides), 267 5-scene video storyboards (`0` verified external videos), 801 short-answer rubrics, 267 applied cases, and 570 reading links resolved from a register of 63 source records — with truthful coverage, review (`awaiting_academic_review` / `structured_reference` — zero false `expert_verified` claims), and honest asset-gap disclosures (10 bundled CC Histology micrographs and 5 bundled CC normal Radiology images alongside `asset_required` disclosures for complete chapter microscopy/smears/DICOM series).
- **Worldwide Syllabus Navigator (`#/syllabus`):** Browse **13 curriculum alignment references** (Pakistan NCC/PM&DC/UHS, India CBSE, England DfE, US AP Biology, China MOE, Western Australia SCSA, Harvard Pathways, Oxford Pre-Clinical, UK QAA Biosciences, and Anatomical Society Core Syllabi) with provenance URLs and explicit alignment-vs-endorsement notices — plus **"My syllabus is not listed"** local custom syllabus builder (metadata form, paste text or `.txt`/`.md`/`.csv` upload, editable topic rows, synonym/keyword matcher requiring manual confirmation on `suggested` hits, multi-to-multi topic remapping, honest `available` vs `partially_available` vs `not_available_yet` coverage report, and IndexedDB/`localStorage` persistence).
- **Unified Discovery Search (`#/search` or `/`):** Searches all 16 domains, 296 registry topics, learning outcomes, 3,432 FMA concepts, 2,234 BodyParts3D meshes + 79 female overlay parts, 32 terminology entries, 6 physiology specs, 10 histology entries, 10 clinical cases, 5 guided 3D presentations, 1,478 MCQ items, 13 curriculum alignment references, and 12 educator guides with category/domain/track filters and zero duplicate entries.
- **Interactive 3D Anatomy Explorer (`#/explorer`):** Male & Female body selector (with explicit disclosure of remaining female vascular, nervous, visceral, anatomical-variant, and region-by-region validation gaps), Natural Anatomy default PBR rendering (per-part roughness/metalness, triplanar UVs, procedural tissue micro-detail maps, soft shadows, runtime LOD 0 ↔ LOD 3 switching), Orbit/Pan/Zoom, camera presets, 10-region progressive surgical dissection, structure isolation, ghost transparent body context, `0–100%` explosion layout, cutaway planes, and one-click Relationship jump.
- **Guided 3D Presentation & Video Studio (`#/present`):** Deterministic 3D anatomical walkthrough engine reusing the shared `AnatomyScene` WebGL renderer with 5 built-in presentations, clinical-to-presentation deep linking, separate narration & captions, timeline editor, `localStorage` persistence, JSON import/export, and browser-native local WebM recording.
- **Teacher & Professor Workspace (`#/educator`):** Plan courses across all 16 domains, all 13 curriculum alignment references, or saved custom syllabi; inspect chapter outcomes and coverage gaps; reorder custom teaching sequences (`educatorSequences` persisted locally); filter by `Grades 9–12`, `BS / MBBS`, or `MPhil / PhD Research`; and preview, copy, or download **Lecture Outlines**, **Chapter Decks**, and printable **Student Worksheets** in `.pptx`, `.pdf`, and `.md` formats.
- **Reference, Practical Lab, Study Dashboard & Interactive Labs (`#/systems`, `#/relationships`, `#/learn`, `#/practical-lab`, `#/dashboard`, `#/revision`, `#/physiology`, `#/histology`, `#/clinical`, `#/quiz`, `#/atlases`):**
  - *Physiology Simulations:* 5 live quantitative evaluators (Cardiac, Respiratory, Renal, Musculoskeletal, Acid-Base Henderson–Hasselbalch) + 1 planned Endocrine feedback specification slot.
  - *Histology & Radiology Starter Plates:* 10 organ microanatomy entries backed by 10 bundled CC-licensed light micrographs with zoomable `1×–4×` specimen viewer + 5 bundled CC-licensed de-identified normal radiology images in Domain N (`Visualise` tab), while remaining chapter-specific `C1–C18` and `N1–N14` datasets remain `asset_required`.
  - *Clinical Correlations:* 10 regional anatomy educational scenarios (3 linked to guided 3D presentations) with MCQ self-checks.
  - *Study Dashboard & Spaced Repetition:* Local IndexedDB/`localStorage` persistence for study progress, SM-2 flashcards, custom syllabi, educator sequences, bookmarks, and JSON Export / Import / Reset.

## Technology Stack

- **Frontend:** React 19, TypeScript 5.9, Vite 8
- **3D Engine:** Three.js (`OrbitControls`, `RoomEnvironment`, merged-geometry GPU `DataTexture` shader architecture)
- **Visualization & UI:** Recharts 3.8, Tailwind CSS v4, Lucide React
- **Persistence:** IndexedDB (`Anatomy360StudyDB`) with automatic `localStorage` migration & fallback (100% client-side, zero backend or paid APIs required)

## Installation & Commands

Requires **Node.js 22.13+** and **npm**.

```sh
npm install
npm run dev                  # Starts dev server on http://localhost:3000
npm run check                # TypeScript type-check (tsc --noEmit)
npm run lint                 # Static lint (oxlint app web)
npm run validate:atlas       # Verifies 2,234 meshes, 3,432 concepts, and 15 binary buffers
npm run validate:interactions# Verifies non-overlapping explosion layout & tap/drag state
npm run validate:content     # Validates registry, FMA mappings, lessons, quizzes, & provenance
npm test                     # Runs automated unit & platform integrity tests
npx --yes tsx --test app/*.test.ts # Runs modular TypeScript test suites (registry, syllabus, education, graphics, store)
npm run validate:all         # Runs check + lint + all validations + tests
npm run build                # Builds static production bundle to dist/
```

## Asset Organization, Curriculum & Scalability Guides

- [`CURRICULUM_ALIGNMENT.md`](CURRICULUM_ALIGNMENT.md) — Alignment and provenance across 13 national, board, regulator, and university references with geographic/adoption caveats.
- [`EDUCATION_COVERAGE_MATRIX.md`](EDUCATION_COVERAGE_MATRIX.md) — Coverage matrix across all 16 biomedical & clinical domains (A–P), including explicit `asset_missing` disclosures for Histology microscopy and Radiology imaging.
- [`EDUCATION_ARCHITECTURE.md`](EDUCATION_ARCHITECTURE.md) — Technical architecture of `app/education/`, `app/registry/`, `app/syllabus/`, unified search, and universal educator exports.
- [`CONTENT_PACK_GUIDE.md`](CONTENT_PACK_GUIDE.md) — Schema & authoring instructions for adding new anatomical structures, lessons, quizzes, histology slots, or additional 3D atlas bundles without modifying application code.
- [`PRODUCTION_READINESS_CHECKLIST.md`](PRODUCTION_READINESS_CHECKLIST.md) — Automated verification audit vs. manual release checks.
- [`THIRD_PARTY_LICENSES.md`](THIRD_PARTY_LICENSES.md) — Complete audited attribution and license inventory (MIT, ISC, CC BY 4.0).

## Cloudflare Pages Deployment

Anatomy 360 compiles to a purely static bundle in `dist/` using hash routing (`#/...`):

1. Push repository to GitHub and connect via **Cloudflare Dashboard -> Workers & Pages -> Create -> Pages**.
2. Build command: `npm run build` · Build output directory: `dist` · Env var: `NODE_VERSION = 22`.

> **Educational Disclaimer:** Anatomy 360 is strictly an educational reference platform and is not intended for clinical diagnosis, patient treatment, or surgical planning.
