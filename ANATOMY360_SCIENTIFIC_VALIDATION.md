# ANATOMY 360 — Scientific & Anatomical Validation Report

## 1. Scientific Honesty & Scope Boundaries
- **Educational Purpose Only:** Anatomy 360 is an educational anatomical reference platform. It is **not** clinically validated, **not** surgical-grade, and **not** intended for diagnosis, surgical planning, or patient care.
- **No Fabricated Geometry:** All 2,234 3D meshes originate from BodyParts3D 4.0. Structures absent from the dataset (e.g., falx cerebri, arachnoid/pia mater, individual lower cranial nerve cisterns, female reproductive anatomy, deformable soft-tissue muscle rigs) are explicitly disclosed in the UI and documentation rather than synthesized.
- **Illustrative Spatial Connectors vs Verified Meshes:** In the 3D Relationship Explorer (`app/pages/RelationshipsPage.tsx`), highlighted organs represent verified BodyParts3D 3D meshes, whereas curved directional arrows are explicitly labeled as *illustrative spatial connectors linking bounding-box centers* (not anatomical vessel or nerve trajectories).

## 2. Automated Verification Gates
Run all checks via `npm run validate:all`:
- `npm run check`: TypeScript strict type-checking (`tsc --noEmit`)
- `npm run lint`: Static linting (`oxlint app web`)
- `npm run validate:atlas`: Binary chunk & manifest integrity
- `npm run validate:interactions`: Dissection registry, layer sequences, and kinematic invariants
- `npm run validate:content`: Knowledge graph & curriculum validation
- `npm run validate:assets`: Part IDs, bounding boxes, vertex/index triangle counts, and chunk existence
- `npm run validate:materials`: Confirms Natural Anatomy is the default and Regional Brain overlay is OFF by default
- `npm run validate:licenses`: Verifies unified BodyParts3D CC BY 4.0 attribution and exclusion/reference-only boundaries
- `npm run validate:anatomy`: Verifies core FMA concepts, surgical disclaimer, and spatial connector disclosures
- `npm run validate:lod`: Verifies LOD 0–3 registry specs, non-destructive optimizer flags, and minimum triangle floor (`>= 50` tris)
- Unit test suites (`node --test` via `tsx`): `app/tissue-materials.test.ts`, `app/visualization-colors.test.ts`, `app/dissection-registry.test.ts`, `app/interaction-engine.test.ts`
