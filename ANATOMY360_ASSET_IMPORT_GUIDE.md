# ANATOMY 360 — Non-Destructive Asset Import & Optimization Guide

## 1. Pre-Import License Gate
Before importing any external 3D mesh or texture asset:
1. Record the source authority, exact license, and URL in `app/data/asset-registries.ts` (`LICENSE_REGISTRY`).
2. Never mix `CC BY-SA` or proprietary assets into the core MIT / CC BY 4.0 bundle without an isolated asset-pack boundary.
3. Run `npm run validate:licenses` to verify compliance.

## 2. Coordinate System & Scale Normalization
- Canonical coordinate system: **Y-up, right-handed, meters**, anatomical standing pose facing **+Z**, feet near `Y = 0.0`, cranial vertex near `Y = 1.76`.
- All vertices must be finite (`Number.isFinite`) with outward-facing unit normals and valid triangular index buffers (`indexCount % 3 === 0`).

## 3. Non-Destructive LOD Generation (`scripts/optimize-anatomy.mjs`)
Always preserve master source geometry by passing `--preserve-source`:
```bash
node scripts/optimize-anatomy.mjs atlas.json --lod=0 --preserve-source
node scripts/optimize-anatomy.mjs atlas.json --lod=1 --preserve-source
node scripts/optimize-anatomy.mjs atlas.json --lod=2 --preserve-source
node scripts/optimize-anatomy.mjs atlas.json --lod=3 --preserve-source
```
- **Very High Priority Tier** (brain gyri, cerebellum, brainstem, skull bones, cardiac valves/chambers, sensory organs) enforces stricter error thresholds (`0.0008`) and higher minimum triangle floors (`>= 180` tris).
- **High Priority Tier** (major vessels, nerves, skeleton, muscles) enforces `0.0014` error threshold and `>= 120` tris.
- **Standard Tier** enforces `0.002` error threshold and `>= 96` tris.

## 4. Post-Import Verification
Run `npm run validate:all` and verify in-browser rendering across Natural Anatomy Mode, Isolated Brain, and Dissection Studio.
