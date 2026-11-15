# Third-Party Licenses & Attribution

This document records the origin, license, commercial-use status, and attribution requirements for every external repository, dataset, and major dependency used in **Anatomy 360**.

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
- **Where Used:** Core Three.js merged-geometry + GPU `DataTexture` rendering engine (`app/scene.tsx`), binary loader (`app/model-download.ts`), explosion packing algorithm (`app/explosion-layout.ts`), pointer tap disambiguation (`app/pointer-tap.ts`), and asset optimization scripts (`scripts/`).

---

## 3. Core Open-Source Libraries

| Package | License | Source / Repository | Purpose in Anatomy 360 |
|---|---|---|---|
| **Three.js** (`three`) | MIT | https://github.com/mrdoob/three.js | WebGL 3D rendering, OrbitControls, RoomEnvironment, Raycaster |
| **React & React DOM** | MIT | https://github.com/facebook/react | UI component runtime |
| **Tailwind CSS** | MIT | https://github.com/tailwindlabs/tailwindcss | Styling and responsive utility system |
| **Lucide React** | ISC | https://github.com/lucide-icons/lucide | UI affordance icons |
| **shadcn/ui & Base UI** | MIT | https://ui.shadcn.com / https://base-ui.com | Accessible UI primitives (buttons, sheets, sliders, switches, combobox) |
| **meshoptimizer** | MIT | https://github.com/zeux/meshoptimizer | Offline mesh simplification during model pipeline |

---

## 4. Excluded Assets (Inspected, Not Integrated)

- **Z-Anatomy (`Z-Anatomy/Models`)**: Inspected as reference. Individual blended/annotated assets require explicit per-asset license verification (many derived from BodyParts3D CC BY-SA 2.1 JP or Blender community assets with ShareAlike/non-uniform terms). Not bundled in this release to keep Anatomy 360 cleanly under MIT + CC BY 4.0.
- **HuBMAP Female Reference Organ Set v1.5**: Referenced in upstream `public/ATTRIBUTION.md` as historical; not included in the `public/models/` binary bundle of this repository. Female reproductive and missing endocrine/sensory structures are explicitly marked as planned for future verified CC BY 4.0 / CC0 expansion.
