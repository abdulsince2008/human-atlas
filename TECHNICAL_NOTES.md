# Anatomy 360 — Technical Notes

## 1. Repository Architecture
- **Stack:** Vite 8 + React 19 + TypeScript 5.9 + Three.js (`0.159+`) + Tailwind CSS v4 + shadcn/Base UI primitives.
- **Entry Points:**
  - `web/index.html` — HTML entry point, fonts, metadata.
  - `web/main.tsx` — React mount point rendering `App`.
  - `app/page.tsx` — Top-level application shell, hash router (`#/`, `#/explorer`, `#/systems`, `#/learn`, `#/quiz`, `#/about`), shared atlas catalog loader, and page views.
- **Deployment Target:** Static frontend (`dist/`) compatible with **Cloudflare Pages** (`npm run build` -> `dist/`). Zero backend servers, zero paid APIs, zero secrets.

## 2. 3D Model Loading & Rendering Process
- **Manifest:** `/models/atlas.json` (~2,234 `Part` records, 3,432 `Concept` records, 15 binary chunk descriptors, 2,288,268 triangles).
- **Binary Chunks:** `/models/body-0.bin` through `/models/body-14.bin` (and `.bin.gz` variants). `app/model-download.ts` inspects the gzip magic bytes (`0x1f 0x8b`) before using `DecompressionStream('gzip')` so static hosts that already decode `Content-Encoding` are not double-decoded.
- **GPU Batch Rendering (`app/scene.tsx`):**
  - Geometries per chunk and per `SystemId` are merged into single `THREE.Mesh` draw calls using `mergeGeometries`.
  - Each vertex carries a `partIndex` float attribute.
  - Two `DataTexture`s (`partState` RGBA float for `(dx, dy, dz, visible)` and `selectionState` RGBA uint8 for `(selected, dimmed, ...)` ) drive per-part exploded offsets, visibility, selection tinting, and transparent-surroundings ghosting in a customized `MeshStandardMaterial` (`onBeforeCompile`) without splitting into 2,234 separate draw calls.
  - Separate non-rendered picker `THREE.Mesh` entries (`pickers[i]`) allow fast per-part bounding-box + exact triangle raycasting (`Raycaster`).
  - **Important:** Do NOT replace the merged-batch + `DataTexture` shader architecture with 2,234 individual scene meshes — that would degrade mobile WebGL performance significantly.

## 3. Coordinate Orientation (Verified against `public/models/atlas.json`)
- `+Y` is superior (head up, feet at `Y ≈ 0`).
- `+Z` is anterior (front of the body).
- `-Z` is posterior (back of the body).
- `+X` is anatomical **Left** (`Left kidney` X ≈ +0.03 to +0.09).
- `-X` is anatomical **Right** (`Right kidney` X ≈ -0.09 to -0.03).

## 4. Data & Localization Architecture
- Canonical anatomical IDs (`Part.id` e.g. `FJ1252` and `Concept.id` e.g. `FMA7088`) are decoupled from display labels and explanations.
- `app/anatomy-systems.ts` maps the 12 canonical anatomical systems to the 15 underlying `SystemId` mesh layers and tracks coverage status (`full`, `partial`, `male-only`, `planned`).
- `app/anatomy-knowledge.ts` holds verified student-friendly educational records (FSc / MDCAT / MBBS / Nursing level), synonyms, and localization-ready `ur` placeholder hooks without fabricating facts for uncurated parts.

## 5. Build & Validation Commands
- `npm run dev` — Starts Vite dev server on `0.0.0.0:3000`.
- `npm run check` — Runs `tsc --noEmit`.
- `npm run lint` — Runs `oxlint app web`.
- `node scripts/validate-atlas.mjs` — Validates binary buffers, vertex indices, and concept mappings.
- `node scripts/validate-interactions.mjs` — Validates explosion packing, tap-vs-drag, and search/inspect contracts.
- `npm run build` — Produces production static bundle in `dist/`.
