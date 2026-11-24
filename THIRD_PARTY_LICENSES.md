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

### HuBMAP Human Reference Atlas 3D Reference Library & Female Overlay
- **Asset Name:** HuBMAP HRA 3D Reference Organ Library (Visible Human Female v1.5 `DOI: 10.48539/HBM352.BTSQ.586` + Mammary Gland v1.1) paired with 8 Anatomically Co-Registered Procedural Reconstructions
- **Copyright Holder:** HuBMAP Consortium / Indiana University & U.S. National Library of Medicine
- **Source URL:** https://humanatlas.io/3d-reference-library
- **Official License URL:** https://creativecommons.org/licenses/by/4.0/
- **License:** Creative Commons Attribution 4.0 International (CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/)
- **Commercial Use Permitted:** Yes (CC BY 4.0 permits commercial use and adaptation with attribution)
- **Modification Permitted:** Yes (co-registered into BP3D meter/Y-up coordinate frame, simplified via `meshoptimizer`: **71** direct HuBMAP HRA CC BY 4.0 meshes [`55` Visible Human Female + `16` Mammary Gland] paired with **8** anatomically anchored procedural reconstructions [`HF_URETHRA`, `HF_ENDOMETRIUM`, `HF_CLITORIS`, `HF_VESTIBULAR_BULBS`, `HF_BARTHOLIN_GLANDS`, `HF_LABIA_MINORA`, `HF_LABIA_MAJORA`, `HF_MONS_PUBIS`] for **79** total parts / **124,440** triangles under `public/models/female/`)
- **Required Attribution:**
  > "HuBMAP Human Reference Atlas 3D Reference Organ Library, licensed under CC Attribution 4.0 International (CC BY 4.0)."
- **Where Used:** `public/models/female/female-atlas.json` and `public/models/female/female-0.bin(.gz)`, loaded dynamically in `app/scene.tsx` when Female mode is selected (replacing 29 male-specific/pelvic parts for 2,284 active parts).

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
| **pptxgenjs** / **jspdf** | `^4.0.1` / `^4.2.0` | MIT | https://github.com/gitbrent/PptxGenJS · https://github.com/parallax/jsPDF | Client-side PowerPoint (`.pptx`) & PDF (`.pdf`) study/educator exports |
| **meshoptimizer** (dev/build tool) | `^1.2.0` | MIT | https://github.com/zeux/meshoptimizer | Offline mesh compression during asset build |

### Wikimedia Commons CC-Licensed Educational Media (`public/media/`)
- **Histology Light Micrographs (`public/media/histology/`):** 10 verified Creative Commons (`CC0` / `CC BY` / `CC BY-SA`) light-microscopy images (trachea epithelium, compact bone osteon, cardiac muscle, cerebellum cortex, lung alveoli, renal glomerulus, liver lobule, muscular artery, lymph node cortex, thick skin epidermis), credited per-image inside `app/data/histology-data.ts`.
- **De-Identified Normal Radiology Plates (`public/media/radiology/`):** 5 verified Creative Commons (`CC0` / `CC BY` / `CC BY-SA`) normal reference scans (Chest PA X-ray, Brain CT, Brain T2 MRI, Renal Ultrasound, Foot DP X-ray), credited per-image inside `app/data/radiology-data.ts`.

---

## 4. Fonts & Browser Storage

- **Typography:** Plus Jakarta Sans, DM Sans, and IBM Plex Mono (Open Font License 1.1 / system sans-serif fallbacks).
- **Client Persistence:** Browser-native **IndexedDB** (`Anatomy360StudyDB`) and **Web Storage** (`localStorage`), keeping all student progress and bookmarks on the user's device.

---

## 5. Unavailable / Excluded Assets (Honest Scope Disclosure)

- **Female Reference Remaining Coverage Gaps:** Systemic female cranium/limbs share BodyParts3D base meshes while the 79-part overlay (`public/models/female/`) handles female breast, pelvis, pelvic floor, urogenital, and reproductive organs (`2,284` active parts). Broader female-specific vascular, nervous, and visceral coverage, anatomical variants/individual variation, and deeper region-by-region female validation remain open tasks.
- **Pediatric Reference 3D Model:** Not bundled in `public/models/`. Listed with explicit asset and FMA concept requirements.
- **Per-Chapter Clinical Microscopy & Radiology Libraries:** `public/media/histology/` (10 starter micrographs) and `public/media/radiology/` (5 normal starter plates) supplement written modules, while complete per-chapter `C1–C18` and `N1–N14` clinical slide/smear/DICOM series remain `asset_required`.
- **Z-Anatomy (`Z-Anatomy/Models`):** Excluded pending per-asset license harmonization so Anatomy 360 maintains clean MIT + CC BY 4.0 distribution terms.
