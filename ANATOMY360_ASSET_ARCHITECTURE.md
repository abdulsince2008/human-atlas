# ANATOMY 360 — Multi-Source Asset & Rendering Architecture

## 1. Current Production Atlas Baseline (Verified Metrics)
- **Active Geometry Dataset:** BodyParts3D / Anatomography 4.0 (DBCLS, Japan — CC BY 4.0 current archive; historically CC BY-SA 2.1 Japan)
- **Mesh Parts:** `2,234` individually selectable anatomical surface meshes
- **FMA Concepts:** `3,432` canonical Foundational Model of Anatomy concept entries
- **Binary Chunks:** `15` gzip-streamed binary geometry chunks (`public/models/body-*.bin`)
- **Triangle Budget:** `2,288,268` optimized triangles (simplified from `6,681,030` source triangles via `meshoptimizer` at `0.002` max relative error; min `52` tris, median `520` tris, max `44,744` tris)

## 2. Multi-Layer Visualization Architecture
`app/tissue-materials.ts` and `app/visualization-colors.ts` separate realistic anatomical appearance from optional educational overlays:
1. **Natural Anatomy Mode (`natural`, MANDATORY DEFAULT):** Per-part GPU `partColorTexture` (4096×1 RGBA `DataTexture`) assigns realistic tissue colors across 27 tissue presets (ivory bone, red-brown skeletal muscle, pale fibrous tendon, dense ligament, smooth cartilage, natural grey/white brain matter without rainbow lobes, muted crimson arteries, deep muted blue veins, pale yellow peripheral nerves, organ-specific liver/lung/kidney/spleen/GI).
2. **Regional Brain Overlay (`regional_brain`, OPT-IN ONLY):** Disabled by default; applies a colorblind-safe 10-region cortical/subcortical palette when explicitly toggled on, and cleanly reverts to Natural Anatomy when disabled.
3. **Tissue Classification (`tissue_classification`):** Highlights structural tissue classes (bone, muscle, tendon, cartilage, vessels, nerves, organs).
4. **System Highlight (`system_highlight`):** Standard canonical system materials.
5. **Functional Muscle Roles (`functional_muscle`):** Rigid-body upper-limb pilots (`elbow-flexion`, `shoulder-abduction`) highlighting agonist, antagonist, synergist, and stabilizer roles.
6. **Relationship Highlight (`relationship_highlight`):** 3D Spatial Network with Natural Anatomy context and explicit *Illustrative Spatial Connectors* (bounding-box-center arrows, never misrepresented as anatomical vessel/nerve paths).

## 3. Quality-Aware Geometry & LOD Architecture (`LOD 0–3`)
Defined in `app/data/asset-registries.ts` and implemented in `scripts/optimize-anatomy.mjs`:
- **LOD 0 (Master):** Lossless / minimal-error preservation (`<= 0.0002` relative error) for high-detail cranial, brain, cardiac, and vascular meshes.
- **LOD 1 (High Study):** Structure-aware preservation (`very_high` tier protects brain gyri, skull bones, heart chambers/valves, sensory organs).
- **LOD 2 (Balanced Web — Active Baseline):** Current production balance (~2.29M triangles across 2,234 parts) with minimum triangle floor (`>= 50` tris).
- **LOD 3 (Mobile / Overview):** Lightweight silhouette-preserving overview for low-memory devices.

## 4. Hardware-Aware Rendering Quality Presets
Configured in `app/tissue-materials.ts` (`RENDER_QUALITY_PRESETS`) and consumed dynamically by `app/scene.tsx`:
- `performance` (pixelRatio cap `1.0`, exposure `1.06`)
- `balanced` (default, pixelRatio cap `1.5`, exposure `1.08`)
- `high` (pixelRatio cap `2.0`, exposure `1.10`)
- `ultra` (pixelRatio cap `2.0`, exposure `1.12`)
