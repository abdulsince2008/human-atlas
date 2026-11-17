# Data Provenance & Visualization Architecture

## 1. Four-Layer Provenance Separation (`app/data/provenance-registry.ts`)
1. **Geometry Provenance:** BodyParts3D / Anatomography 4.0 (DBCLS, CC BY-SA 2.1 Japan) — 2,234 adult male 3D meshes.
2. **Anatomical Ontology Provenance:** Foundational Model of Anatomy (FMA, University of Washington, CC BY 4.0) — canonical FMA IDs linking geometry to curriculum.
3. **Educational Evidence Provenance:** Curated anatomical summaries, relationships, regional brain mappings, and functional muscle pilots aligned with OpenStax Anatomy & Physiology 2e and NCBI StatPearls. Every record uses a normalized 6-state review lifecycle (`draft`, `needs_evidence`, `under_review`, `verified`, `needs_revision`, `deprecated`).
4. **External Study Resources (`app/data/study-resources.ts`):** Curated direct HTTPS links to open educational resources (OpenStax, NCBI Bookshelf / StatPearls, Radiopaedia, Histology Guide, BodyParts3D) displayed with explicit publisher, access type, license, and verification status.

## 2. GPU Multi-Layer Color Architecture (`app/scene.tsx` & `app/visualization-colors.ts`)
- Preserves the single-pass merged-geometry WebGL draw-call budget by adding a 4096×1 RGBA `DataTexture` (`partColorTexture`) sampled in the vertex shader (`partColorOverride`) and applied in linear space (`pow(rgb, 2.2)`) before selection tinting.
- **Deterministic Layer Priority:**
  1. Relationship Role Highlight (`RelationshipsPage` 3D Spatial Network)
  2. Functional Muscle Role Pilot (`Elbow Flexion`, `Shoulder Abduction` — Agonist, Antagonist, Synergist, Stabilizer)
  3. Regional Brain Palette (enabled by default, toggleable)
  4. Default Anatomical System Material (alpha = 0 fallback)
- **3D Relationship Spatial Connectors:** Lightweight curved `TubeGeometry` + directional `ConeGeometry` arrowheads computed from real mesh bounding-box centers (`SceneRelationshipEdge[]`); ontology-only concepts without 3D meshes are disclosed separately and never placed at guessed coordinates.
