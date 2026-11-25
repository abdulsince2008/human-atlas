# ANATOMY 360 — Scientific & Anatomical Validation Report

## 1. Scientific Honesty & Scope Boundaries
- **Educational Purpose Only:** Anatomy 360 is an educational anatomical reference platform. It is **not** clinically validated, **not** surgical-grade, and **not** intended for diagnosis, surgical planning, or patient care.
- **Honest Geometry & Multi-Layer Overlay Disclosures:** The `2,234` baseline adult male meshes originate from BodyParts3D 4.0, expanded by `47` Shared HuBMAP meshes, `20` Male HuBMAP meshes (`2,301` active Male parts), a `92`-part Adult Female v3.0 overlay (`84` direct HuBMAP HRA CC BY 4.0 meshes + `8` anatomically aligned procedural reconstructions, replacing `45` male-specific/pelvic parts for `2,328` active Female parts), and `8` Optional Full-Term Placenta meshes (OFF by default). Female mode honestly discloses `2,189` reused unadapted BP3D torso/cranium/limb meshes (`94.0%`), and both sexes document missing gross-anatomy structures (thyroid & parathyroid glands, middle/inner ear ossicles & cochlea, thoracic duct & lymph nodes, cranial meninges beyond tentorium, female pelvic floor muscles, ovarian/clitoral arterial vessels, male bulbourethral glands) in `ANATOMY360_COMPLETE_ANATOMY_COVERAGE_AUDIT.md`.
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
- `npm run audit:coverage`: Validates all 5 asset layers (`2,401` meshes) and regenerates `ANATOMY360_MALE_FEMALE_MESH_INVENTORY.csv`
- Unit test suites (`node --test` via `tsx`): `app/female-atlas.test.ts`, `app/surgical-anatomy.test.ts`, `app/ai/navigator-contract.test.ts`, `app/tissue-materials.test.ts`, `app/visualization-colors.test.ts`, `app/dissection-registry.test.ts`, `app/interaction-engine.test.ts`
