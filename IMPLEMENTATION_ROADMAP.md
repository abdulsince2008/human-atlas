# Anatomy 360 — Implementation Roadmap

## Phase 1 — Foundation
- Inspect Human Atlas codebase, BodyParts3D 4.0 manifest (`atlas.json`), and licenses.
- Normalize Node.js / Vite / Cloudflare Pages compatibility (`port 3000`, `allowedHosts: true`, static `dist/`).
- Establish **Anatomy 360** branding, typography (`Plus Jakarta Sans`, `DM Sans`, `IBM Plex Mono`), and clinical-scientific design system.
- Create project continuity & licensing documentation (`PROJECT_STATUS.md`, `IMPLEMENTATION_ROADMAP.md`, `COMPLETED_FEATURES.md`, `REMAINING_TASKS.md`, `TECHNICAL_NOTES.md`, `THIRD_PARTY_LICENSES.md`).

## Phase 2 — Core 3D Experience
- Preserve merged-batch WebGL rendering (`2,234` meshes, `2,288,268` triangles, GPU `DataTexture` transform/visibility/selection).
- Add software-WebGL detection & safe pixel-ratio/damping/context-loss handling.
- Add full camera control suite: Front, Back, Left, Right, ¾ preset views, smooth Zoom In / Zoom Out buttons, Orbit vs. Pan interaction toggle, Auto-Rotate, Reset Camera, Focus on Selected Structure, and Fullscreen Viewer.
- Add "Transparent Surroundings" (ghost mode) alongside "Isolate Structure" so surrounding anatomy stays visible as a translucent anatomical reference.

## Phase 3 — Anatomical Organization & Search
- Organize the 12 canonical anatomical systems (Skeletal, Muscular, Nervous, Cardiovascular, Respiratory, Digestive, Urinary, Reproductive, Endocrine, Lymphatic, Integumentary, Sensory Organs) mapped cleanly to the 15 underlying BodyParts3D mesh layers.
- Explicitly mark coverage status (`Full`, `Partial`, `Male Reference Only`, `Planned`) without inventing unavailable geometry.
- Upgrade anatomical search to match anatomical names, common names, synonyms, FMA IDs, and system names—including clearly labeled planned entries for structures not yet in the 3D mesh set.

## Phase 4 — Educational Layer & Application Pages
- Build all 6 functional pages with hash-synced navigation (`Home`, `3D Anatomy`, `Systems`, `Learn`, `Quizzes`, `About`).
- Build verified educational structure knowledge base (`app/anatomy-knowledge.ts`) with localization-ready schema (`en` + prepared `ur` slots, keeping canonical `id`/`conceptId` decoupled from display text).
- Build structured Learn section (Learn by System, Learn by Structure, Guided 3D Pathways, Anatomy Terminology).
- Build verified Quiz engine (System & Structure MCQs, immediate feedback, direct "Inspect in 3D" links, honest `localStorage` progress with clear reset).

## Phase 5 — Mobile & Performance
- Responsive mobile-first navigation (compact top bar + drawer, `>= 44px` touch targets, touch Orbit/Pan/Pinch-Zoom, mobile bottom sheets, zero horizontal overflow).
- Lazy-load binary 3D chunks only when entering the 3D Explorer; keep Home/Systems/Learn/Quiz/About fast and lightweight.
- Code-split non-3D pages or keep bundle clean and fast.

## Phase 6 — Finalization & Deployment Readiness
- Run `npm run check`, `npm run lint`, `node scripts/validate-atlas.mjs`, `node scripts/validate-interactions.mjs`, and `npm run build`.
- Test live browser interactions across desktop and mobile viewports (3D model load, rotate, zoom, pan, select, isolate, transparent surroundings, search, systems, learn, quiz, about).
- Finalize `README.md` with Cloudflare Pages deployment instructions and update all status documentation.
