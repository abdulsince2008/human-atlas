# Anatomy 360

**Anatomy 360** is a structured, interactive 3D human anatomy learning and practical examination platform for FSc pre-medical, MDCAT, MBBS, nursing, and biology learners. Built with React, TypeScript, Three.js, and the **BodyParts3D 4.0** adult male reference dataset, it unites **2,234 individually selectable 3D meshes** and **3,432 named FMA concepts** with multi-level reference notes, directional relationship graphs, 12-system interactive lessons, a 3D Practical Spotter Exam Lab, SM-2 spaced repetition flashcards, quantitative physiological sandboxes, histology microanatomy specifications, and local client-side study analytics.

## Key Capabilities

- **Interactive 3D Anatomy Explorer (`#/explorer`):** Orbit/Pan/Zoom, Fullscreen, `¾` / `F` / `B` / `L` / `R` camera views, structure isolation, ghost transparent body context, `0–100%` non-overlapping explosion layout, structure bookmarking, and one-click Relationship jump.
- **Reference Library (`#/systems`):** 12 canonical body systems with category filtering, coverage tier disclosure (`Individual 3D Mesh`, `Mesh Group`, `Concept Only`, `Educational Entry — 3D Asset Unavailable`), Beginner/Intermediate/Advanced study tabs, Latin & synonym terminology, and provenance badges.
- **Relationship Explorer (`#/relationships`):** Interactive radial SVG map + directional cards (`origin`, `insertion`, `articulation`, `innervation`, `arterial_supply`, `venous_drainage`, `lymphatic_drainage`, `antagonist`) with an optional toggleable live `AnatomyScene` preview.
- **Structured Learning (`#/learn`):** Synchronized split-screen 12-system curriculum (28 topics), Learn by Structure, Guided 3D Pathways, and Terminology glossary, integrated with unified topic completion and bookmarks.
- **Practical Lab (`#/practical-lab`):** Spotter practical examination with Identify the Structure, Locate in 3D, and Anatomical Knowledge stations; Strict Exam & Guided Practice presets; countdown/untimed options; weak-concept targeting; and review breakdown.
- **Study Dashboard & Revision (`#/dashboard`, `#/revision`, `#/bookmarks`):** Local student profile (no login), dismissible onboarding banner, Recharts per-system Learn & Practical Lab bar analytics, SM-2 flashcard scheduler with optional live 3D card preview, unified revision queue, bookmark manager, and validated JSON Export / Import / Reset backed by IndexedDB (with legacy `localStorage` migration and fallback).
- **Discovery Search (`#/search` or `/`):** Indexes FMA concepts, 3D meshes, Latin terms, common synonyms, regions, lesson topics, and terminology with bounded Damerau-Levenshtein typo tolerance (`<=2` edits) and multi-criteria filters.
- **Educational Labs (`#/physiology`, `#/histology`, `#/clinical`, `#/atlases`):**
  - *Physiology Simulations:* Interactive cardiac cycle, respiratory ventilation, renal filtration pressure, and musculoskeletal elbow-lever models + documented Endocrine feedback slot.
  - *Histology Library:* Epithelial, connective, muscle, and nervous tissue classes + 6 organ microanatomy entries with honest import-ready micrograph asset specifications (zero fabricated microscopy pictures).
  - *Clinical Correlations:* 5 regional anatomy educational scenarios with instant MCQ self-checks and 3D inspection links (strictly educational; zero diagnostic or patient claims).
  - *Atlas & Pack Manager:* Multi-atlas registry, offline availability status (highlighting exact asset requirements for future Adult Female and Pediatric bundles), and client-side JSON validator for candidate manifests and content packs.

## Technology Stack

- **Frontend:** React 19, TypeScript 5.9, Vite 8
- **3D Engine:** Three.js (`OrbitControls`, `RoomEnvironment`, merged-geometry GPU `DataTexture` shader architecture)
- **Visualization & UI:** Recharts 3.8, Tailwind CSS v4, Lucide React, Base UI / shadcn components
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
npm run validate:content     # Validates unique IDs, FMA concept mappings, lessons, quizzes, & provenance
npm test                     # Runs automated unit & integration tests (search, SM-2, store, validators)
npm run validate:all         # Runs check + lint + all validations + tests
npm run build                # Builds static production bundle to dist/
```

## Asset Organization & Scalability Guides

- [`CONTENT_PACK_GUIDE.md`](CONTENT_PACK_GUIDE.md) — Schema & authoring instructions for adding new anatomical structures, lessons, quizzes, histology slots, or additional 3D atlas bundles without modifying application code.
- [`PRODUCTION_READINESS_CHECKLIST.md`](PRODUCTION_READINESS_CHECKLIST.md) — Automated verification audit vs. manual release checks (licensing, missing female/pediatric 3D meshes, real microscopy images, hosting).
- [`THIRD_PARTY_LICENSES.md`](THIRD_PARTY_LICENSES.md) — Complete audited attribution and license inventory (MIT, ISC, CC BY 4.0).

## Cloudflare Pages Deployment

Anatomy 360 compiles to a purely static bundle in `dist/` using hash routing (`#/...`):

1. Push repository to GitHub and connect via **Cloudflare Dashboard -> Workers & Pages -> Create -> Pages**.
2. Build command: `npm run build` · Build output directory: `dist` · Env var: `NODE_VERSION = 22`.

> **Educational Disclaimer:** Anatomy 360 is strictly an educational anatomical reference and is not intended for clinical diagnosis, patient treatment, or surgical planning.
