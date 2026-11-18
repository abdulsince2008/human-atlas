# ANATOMY 360 — Implementation Log

## 2026-11-18 — High-Fidelity Natural Anatomy & Educational Platform Upgrade
- **Baseline:** Workspace without `.git` history; `public/models/atlas.json` audited at `2,234` parts, `3,432` concepts, `15` chunks, `2,288,268` triangles (from `6,681,030` source triangles).
- **Phase 1 (Natural Anatomy Default):**
  - Created `app/tissue-materials.ts` with 27 realistic tissue material presets, 8 visualization modes (`natural` default), `classifyPartTissue`, `resolveNaturalAnatomyColors`, `resolveTissueClassificationColors`, and `RENDER_QUALITY_PRESETS`.
  - Updated `app/visualization-colors.ts` so `resolvePartColorOverrides` defaults to Natural Anatomy (`natural`) and only applies Regional Brain colors when explicitly opted in.
  - Updated `app/components/ExplorerView.tsx` to default `visualizationMode = 'natural'` and `brainRegionalColors = false`, added Visual Mode & Quality Preset controls, and added a reversible **Return to Natural Anatomy** button.
- **Phase 2 (Rendering Quality & Surgical Anatomy Studio):**
  - Wired `qualityPreset` (`performance | balanced | high | ultra`) through `app/anatomy.ts` and `app/scene.tsx` to dynamically control pixel ratio cap and ACES exposure.
  - Created `app/data/surgical-anatomy.ts` with 4 structured surgical learning regions and mandatory non-clinical educational disclaimer; wired into the new **Surgical** sub-tab in Dissection Studio.
- **Phase 3 (Relationship Explorer & License Reconciliation):**
  - Upgraded `app/pages/RelationshipsPage.tsx` with Natural Anatomy base colors, a **Natural Anatomy** view reset button, and explicit *Illustrative Spatial Connectors* disclosure.
  - Created `app/data/asset-registries.ts` (`LICENSE_REGISTRY`, `GEOMETRY_QUALITY_POLICIES`, `LOD_LEVEL_SPECS`, `TEXTURE_REGISTRY`) and reconciled BodyParts3D 4.0 license wording (`CC BY 4.0` current DBCLS archive; historically `CC BY-SA 2.1 Japan`).
- **Phase 4 (Pipeline, Validation & Tests):**
  - Upgraded `scripts/optimize-anatomy.mjs` with `--lod=0|1|2|3`, `--preserve-source`, structure-aware error policies, and NaN/Inf validation.
  - Created `scripts/validate-platform-registries.mjs` and wired `validate:assets`, `validate:materials`, `validate:licenses`, `validate:anatomy`, `validate:lod` into `package.json` and `validate:all`.
  - Added `app/tissue-materials.test.ts` and updated `app/visualization-colors.test.ts`.
