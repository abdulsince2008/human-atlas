# Anatomy 360 — Completed Features

> Only features that have been implemented and verified are listed here.

- [x] **Biomedical Curriculum Overview (`#/learn`, `app/education/`, `app/components/MedicalCurriculumHub.tsx`):**
  - Introductory overview modules across 16 biomedical & clinical domains (17 modules total — introductory overviews, not completed courses)
  - 5 level-differentiated learning tracks with strict track+reference domain and topic filtering (zero silent fallback on unmatched combinations)
  - 11 curriculum references (distinct regulators, statutory frameworks, exam boards, and university examples) with geographic/adoption caveats and verified PM&DC 6,200 minimum contact hours benchmark
  - Static 2D conceptual schematics with rendered pathway connections, verified BodyParts3D FMA 3D inspection links, applied activities, self-assessment MCQs wired to `StudyContext`, topic completion tracking, and strict `asset_missing` disclosures for Histology microscopy and Radiology imaging
  - Structural/referential automated validation (`app/education/education-validation.ts`, `app/education.test.ts`, `scripts/test-platform.mjs` Section 7 — structural checks only, not medical accuracy certification)
- [x] **Repository Migration & Static Production Build:** Configured `vite.config.ts` (`0.0.0.0:3000`, `allowedHosts: true`), verified static `dist/` production output with lazy-loaded 3D chunks (`ExplorerView`, `PresentationStudioPage`, `scene`).
- [x] **3D Graphics, PBR, UV, Shadows & Runtime LOD Pipeline (`app/graphics/`, `app/scene.tsx`, `app/tissue-materials.ts`):**
  - Natural Anatomy default visualization mode with 27 physically grounded tissue presets and per-part GPU roughness/metalness (`partMaterialTexture`)
  - Triplanar UV generation (`ensureAnatomicalUVs`) and geometry validation (`validateAnatomicalGeometry`)
  - 6 linear-space procedural PBR micro-detail texture archetypes (`normalMap`, `roughnessMap`, `aoMap`) with GPU disposal
  - `PCFSoftShadowMap` + cavity fill lighting and hardware quality presets (`performance`, `balanced`, `high`, `ultra`)
  - Real runtime LOD 0 (`2,288,268` tris) ↔ LOD 3 (`1,684,412` tris) switching backed by `public/models/atlas.lod3.json` and `body-lod3-0..11.bin` preserving all 2,234 selectable parts
- [x] **Guided 3D Presentation, Clinical Explainers & Browser-Native Video Studio (`#/present`, `app/presentation/`, `app/pages/PresentationStudioPage.tsx`):**
  - Reuses the single `AnatomyScene` WebGL renderer (no duplicate 3D engine)
  - Strongly typed `AnatomyPresentation` / `PresentationStep` schema and deterministic `compileStepToSceneState` compiler supporting camera views, focus bounds, progressive surgical layer peeling, ghost surroundings, isolate, cutaway clipping planes, explode, and concept color overrides
  - 5 complete built-in presentations grounded in verified `atlas.json` FMA concept IDs:
    1. *Thoracic Anatomy & Coronary Ischemia Mechanism* (clinical mechanism explainer linked from Clinical Library)
    2. *Pituitary Adenoma & Optic Chiasm Compression* (clinical mechanism explainer linked from Clinical Library)
    3. *Hepatic Portal Circulation & Portal Hypertension* (clinical mechanism explainer linked from Clinical Library)
    4. *Cranial Anatomy & Progressive Dissection* (`anatomical`)
    5. *Shoulder, Humeral Compartments & Upper-Limb Vascular Relations* (`surgical_education`)
  - Separate presenter narration scripts & on-screen captions, step knowledge checks, automatic playback (`0.5×–2×`), visual timeline authoring, `localStorage` persistence, validated JSON export/import, and browser-native local video recording (`captureStream` + `MediaRecorder` + DOM-mounted 2D composition canvas + optional microphone audio + preview/download/discard)
- [x] **Enhanced 3D Anatomy Explorer & 10-Region Surgical Dissection (`app/components/ExplorerView.tsx`, `app/data/surgical-anatomy.ts`):**
  - Orbit/Pan/Zoom, 5 anatomical views, Focus, Isolate, Transparent Surroundings, Explode, Group Explosion, Cutaway Planes, and 10 anti-bleed validated surgical dissection regions with non-clinical disclaimers
- [x] **12 Canonical Systems, Knowledge Graph, Practical Lab, Study Analytics & Educational Labs:**
  - 12-system Reference Library, Relationship Explorer (3D spatial network + 2D radial map), Learn workspace (5 tabs including the new 16-domain Curriculum Hub + 12-system chapters), Practical Spotter Lab, SM-2 Flashcards, 10 Clinical Correlations, 10 Histology entries with zoomable `1×–4×` specimen viewer, 4 interactive Physiology simulations (+ 1 planned endocrine spec), and Atlas & Pack Manager
- [x] **Automated Validation & Test Suite:** `npm run validate:all` PASS, `39/39` unit tests PASS across 8 suites, `oxlint` 0 warnings/0 errors across 80 files, and `npm run build` PASS.
