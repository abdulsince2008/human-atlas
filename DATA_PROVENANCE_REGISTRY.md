# Data Provenance & Visualization Architecture

## 1. Provenance Separation (`app/data/provenance-registry.ts`)
1. **Geometry Provenance:** BodyParts3D / Anatomography 4.0 (DBCLS, CC BY 4.0 current DBCLS Archive; historically CC BY-SA 2.1 Japan) — 2,234 adult male 3D meshes.
2. **Anatomical Ontology Provenance:** Foundational Model of Anatomy (FMA, University of Washington, **CUSTOM** license per OBO Foundry: `https://obofoundry.org/ontology/fma.html`) — canonical FMA IDs linking geometry to curriculum.
3. **Standard Terminology Provenance:** Terminologia Anatomica 2nd Edition (TA2) & Terminologia Neuroanatomica (TNA), IFAA / FIPAT (**CC BY-ND 4.0**, unmodified reference only).
4. **Educational Evidence Provenance:** Curated anatomical summaries, relationships, surgical dissection layers, clinical cases, histology guides, and functional muscle pilots aligned with OpenStax Anatomy & Physiology 2e and NCBI StatPearls. Every record uses a strict 8-state review lifecycle (`draft`, `needs_evidence`, `automated_check_passed`, `source_reviewed`, `under_expert_review`, `expert_verified`, `needs_revision`, `deprecated`). Zero records are marked `expert_verified` without an actual named human anatomist/clinician reviewer.
5. **External Study Resources (`app/data/study-resources.ts`):** Curated direct HTTPS links to open educational resources (OpenStax, NCBI Bookshelf / StatPearls, Radiopaedia, Histology Guide, BodyParts3D) displayed with explicit publisher, access type, license, and verification status.

## 2. GPU Multi-Layer Color & Per-Tissue PBR Architecture (`app/scene.tsx`, `app/tissue-materials.ts`, `app/visualization-colors.ts`)
- Preserves the single-pass merged-geometry WebGL draw-call budget by binding two 4096×1 RGBA `DataTexture` lookups: `partColorTexture` (albedo override) and `partMaterialTexture` (per-tissue PBR `roughness`, `metalness <= 0.05`, and quality-scaled restrained micro-detail).
- **Deterministic Layer Priority:**
  1. Relationship Role Highlight (`RelationshipsPage` 3D Spatial Network)
  2. Functional Muscle Role Pilot (`Elbow Flexion`, `Shoulder Abduction` — Agonist, Antagonist, Synergist, Stabilizer)
  3. Opt-in Regional Brain Palette (OFF by default so the brain renders in Natural Anatomy)
  4. Natural Anatomy Per-Tissue Material (default) or System Highlight Mode
- **3D Relationship Spatial Connectors:** Lightweight curved `TubeGeometry` + directional `ConeGeometry` arrowheads computed from real mesh bounding-box centers (`SceneRelationshipEdge[]`); ontology-only concepts without 3D meshes are disclosed separately and never placed at guessed coordinates.
