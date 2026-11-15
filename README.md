# Anatomy 360

**Anatomy 360** is an interactive 3D human anatomy learning platform built for FSc pre-medical, MDCAT, MBBS, nursing, biology, and general learners. Powered by React, TypeScript, Three.js, and the **BodyParts3D 4.0** adult male reference dataset, it lets students explore **2,234 individually selectable 3D meshes** across **12 canonical body systems** and **3,432 named FMA concepts** alongside structured lessons, guided anatomical pathways, terminology, and verified revision quizzes.

## Key Features

- **Interactive 3D Anatomy Explorer (`#/explorer`):**
  - Smooth mouse and touch **Orbit**, **Pan** (with dedicated Orbit/Pan toggle for single-finger/trackpad use), **Zoom** (wheel, pinch-to-zoom, and Zoom In/Out buttons), and **Fullscreen** viewer.
  - Anatomical preset views: **¾**, **Front**, **Back**, **Left**, and **Right** (verified against model coordinates), plus **Auto-Rotate** and **Reset Camera**.
  - Direct 3D structure picking via raycasting + tap-vs-drag/pinch disambiguation (`PointerTap`).
  - **Focus in 3D**, **Transparent Surroundings** (ghost mode keeping selected structures opaque and highlighted inside translucent surrounding anatomy), **Isolate Structure**, and **Explode Anatomy** (`0–100%` non-overlapping inventory packing).
  - Collapsible **Hide Controls / Show Controls** (`H`) drawer for unobstructed 3D inspection.
- **12 Canonical Anatomical Systems (`#/systems`):** Skeletal, Muscular, Nervous, Cardiovascular, Respiratory, Digestive, Urinary, Reproductive (Male reference only), Endocrine, Lymphatic, Integumentary, and Sensory Organs — with transparent coverage indicators (`Available in 3D`, `Partial 3D Coverage`, `Male Reference Only`, and `Planned`).
- **Unified Search (`#/search` or `/`):** Searches across 3,432 FMA concepts, 2,234 mesh names, common names/synonyms (e.g., *windpipe*, *collarbone*, *shinbone*), system names, and clearly labeled planned expansion structures.
- **Structured Learning (`#/learn`):** Learn by Anatomical System, Learn by Individual Structure, Guided 3D Pathways (step-by-step tours), and Anatomy Terminology (planes, directional terms, roots).
- **Verified Revision Quizzes (`#/quiz`):** Multiple-choice questions with instant explanations, 1-click "Inspect in 3D" links, and local browser progress (`localStorage`).
- **Localization-Ready Schema:** Canonical FMA and BodyParts3D IDs are decoupled from `LocalizedText` (`en`, prepared `ur` slots) for future Urdu translation without breaking 3D geometry bindings.

## Technology Stack

- **Frontend:** React 19, TypeScript 5.9, Vite 8
- **3D Engine:** Three.js (`OrbitControls`, `RoomEnvironment`, merged-geometry GPU `DataTexture` shader architecture)
- **Styling & UI Primitives:** Tailwind CSS v4, Lucide React, Base UI / shadcn components
- **Backend / APIs:** None — 100% static frontend with local datasets (no paid APIs or subscriptions required)

## Installation & Development

Requires **Node.js 22.13+** and **npm**.

```sh
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validation & Production Build

```sh
npm run check                        # TypeScript type-checking (tsc --noEmit)
npm run lint                         # Static lint check (oxlint)
node scripts/validate-atlas.mjs      # Verifies 2,234 meshes, 3,432 concepts, and 15 binary chunks
node scripts/validate-interactions.mjs # Verifies explosion packing, tap/drag, and search contracts
npm run build                        # Builds static production output to dist/
```

## Asset Organization

- `public/models/atlas.json` — Manifest describing 2,234 `Part` meshes, 3,432 `Concept` groupings, bounding boxes, and chunk byte offsets.
- `public/models/body-0.bin` .. `body-14.bin` (and `.bin.gz`) — Pre-optimized binary geometry buffers (2,288,268 triangles; ~33 MB compressed, lazy-loaded when opening the 3D Explorer).
- `app/anatomy-systems.ts` — Canonical 12-system mapping and honest coverage metadata.
- `app/anatomy-knowledge.ts` — Verified educational explanations, synonyms, terminology, and planned-structure notes.
- `app/learning-data.ts` — Structured chapters, topics, guided 3D pathways, and anatomical terminology.
- `app/quiz-data.ts` — Verified MCQ bank linked to real 3D concepts.

## Cloudflare Pages Deployment

Anatomy 360 builds to a purely static directory (`dist/`) with hash-based client routing (`#/...`), requiring zero server-side runtime or rewrite rules:

1. Push this repository to GitHub.
2. In the **Cloudflare Dashboard**, go to **Workers & Pages -> Create -> Pages -> Connect to Git**.
3. Configure the build settings:
   - **Framework preset:** `Vite` (or `None`)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Environment variables:** `NODE_VERSION = 22` (no secrets or API keys required)
4. Deploy. All binary geometry files under `public/models/` are copied directly into `dist/models/`.

## Anatomical Data Sources & Licenses

- **BodyParts3D 4.0:** BodyParts3D, © The Database Center for Life Science licensed under **CC Attribution 4.0 International (CC BY 4.0)**.
  - Dataset: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
  - License: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html
  - Publication: Mitsuhashi et al. (2009), *Nucleic Acids Research*, https://doi.org/10.1093/nar/gkn613
- **Application Base Code:** Adapted from [Human Atlas](https://github.com/ashemag/human-atlas) under the **MIT License** (`LICENSE`).
- Full third-party license details and commercial-readiness notes are documented in [`THIRD_PARTY_LICENSES.md`](THIRD_PARTY_LICENSES.md) and [`public/ATTRIBUTION.md`](public/ATTRIBUTION.md).

> **Educational Disclaimer:** Anatomy 360 is an educational anatomical reference and is not a clinical, diagnostic, or surgical tool.
