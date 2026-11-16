# Third-Party Licenses & Attribution

This document records the audited origin, license, commercial-use status, and attribution requirements for every external dataset, open-source package, and font/asset used in **Anatomy 360**.

## 1. 3D Anatomical Dataset & Meshes

### BodyParts3D 4.0
- **Asset Name:** BodyParts3D (Adult Male Reference Anatomy, `isa_BP3D_4.0_obj_99.zip`)
- **Copyright Holder:** © The Database Center for Life Science (DBCLS)
- **Source URL:** https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- **Official License URL:** https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html
- **License:** Creative Commons Attribution 4.0 International (CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/)
- **Commercial Use Permitted:** Yes (CC BY 4.0 permits commercial use and adaptation with attribution)
- **Modification Permitted:** Yes (adapted to meters/Y-up, simplified via `meshoptimizer` with 0.2% relative error bound, quantized int16 normals, packed into 15 binary chunks under `public/models/`)
- **Required Attribution:**
  > "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International."
- **Where Used:** `public/models/atlas.json` and `public/models/body-0.bin` through `public/models/body-14.bin(.gz)`, rendered in `app/scene.tsx`.
- **Source Publication:** Mitsuhashi et al. (2009), *BodyParts3D: 3D structure database for anatomical concepts*, Nucleic Acids Research, https://doi.org/10.1093/nar/gkn613

---

## 2. Base Application & Rendering Code

### Human Atlas
- **Repository:** https://github.com/ashemag/human-atlas
- **License:** MIT License (see `LICENSE`)
- **Commercial Use Permitted:** Yes
- **Modification Permitted:** Yes
- **Attribution Requirement:** Preserve copyright notice (`Copyright (c) 2026 ashemag`) and MIT license text in `LICENSE`.
- **Where Used:** Core Three.js merged-geometry + GPU `DataTexture` rendering engine (`app/scene.tsx`), binary loader (`app/model-download.ts`), explosion packing algorithm (`app/explosion-layout.ts`), and pointer tap disambiguation (`app/pointer-tap.ts`).

---

## 3. Runtime & Visualization Dependencies (Audited against `package.json`)

| Package | Version in `package.json` | License | Repository / Source | Purpose in Anatomy 360 |
|---|---|---|---|---|
| **three** | `^0.159.0` | MIT | https://github.com/mrdoob/three.js | WebGL 3D scene engine, OrbitControls, RoomEnvironment, Raycaster |
| **react** / **react-dom** | `19.2.6` | MIT | https://github.com/facebook/react | UI component runtime |
| **recharts** | `3.8.0` | MIT | https://github.com/recharts/recharts | Study Dashboard per-system bar charts |
| **lucide-react** | `1.31.0` | ISC | https://github.com/lucide-icons/lucide | UI affordance iconography |
| **@base-ui/react** / **@shadcn/react** | `1.7.0` / `0.3.0` | MIT | https://base-ui.com / https://ui.shadcn.com | Accessible sheets, sliders, switches, combobox primitives |
| **cmdk** | `1.1.1` | MIT | https://github.com/pacocoursey/cmdk | Accessible combobox list behavior |
| **date-fns** | `4.1.0` | MIT | https://github.com/date-fns/date-fns | Date/time formatting utilities |
| **tailwindcss** | `4.2.1` | MIT | https://github.com/tailwindlabs/tailwindcss | CSS utility & design token system |
| **class-variance-authority** / **clsx** / **tailwind-merge** | `0.7.1` / `2.1.1` / `3.6.0` | Apache-2.0 / MIT | NPM registry | Class composition helpers |
| **meshoptimizer** (dev/build tool) | `^1.2.0` | MIT | https://github.com/zeux/meshoptimizer | Offline mesh compression during asset build |

---

## 4. Fonts & Browser Storage

- **Typography:** Plus Jakarta Sans, DM Sans, and IBM Plex Mono (Open Font License 1.1 / system sans-serif fallbacks).
- **Client Persistence:** Browser-native **IndexedDB** (`Anatomy360StudyDB`) and **Web Storage** (`localStorage`), keeping all student progress and bookmarks on the user's device.

---

## 5. Unavailable / Excluded Assets (Honest Scope Disclosure)

- **Female Reference 3D Model (HuBMAP / Verified Female Atlas v1.5):** Not bundled in `public/models/`. Listed in the Atlas Registry with `unavailable_assets` status and explicit mesh/manifest integration requirements.
- **Pediatric Reference 3D Model:** Not bundled in `public/models/`. Listed with explicit asset and FMA concept requirements.
- **Real Microscopy Histology Slides:** `app/data/histology-data.ts` ships verified microanatomy text and strict `SpecimenAssetSlot` schemas requiring CC BY 4.0 / CC0 micrographs with magnification metadata before attaching image files.
- **Z-Anatomy (`Z-Anatomy/Models`):** Excluded pending per-asset license harmonization so Anatomy 360 maintains clean MIT + CC BY 4.0 distribution terms.
