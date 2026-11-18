# ANATOMY 360 — Visual Fidelity & Anatomical Realism Roadmap

## Phase 1 (Completed): Natural Anatomy Default & Multi-Layer Separation
- Set `visualizationMode = 'natural'` as the mandatory default across the 3D Explorer and Relationship Explorer.
- Disabled default rainbow/regional brain colors (`brainRegionalColors = false` by default).
- Implemented 27 realistic per-tissue material presets in `app/tissue-materials.ts` covering bone, muscle, tendon, ligament, cartilage, grey/white brain matter, cerebellum, brainstem, arteries, veins, nerves, and major viscera.
- Added instant, reversible **Return to Natural Anatomy** controls in both Dissection Studio and 3D Relationship Explorer.
- Wired hardware-aware Rendering Quality Presets (`Performance`, `Balanced`, `High Detail`, `Ultra Detail`) into `app/scene.tsx`.

## Phase 2 (Next): Procedural Micro-Detail & Per-Tissue PBR Roughness/Normal Maps
- Extend the custom `MeshStandardMaterial` shader in `app/scene.tsx` with a second per-part GPU attribute texture encoding roughness/metalness per tissue class (e.g., wet serosa vs matte bone vs striated muscle).
- Author tileable CC0 / MIT procedural normal and roughness maps (muscle fiber striations, cortical bone porosity, hepatic/splenic parenchyma) registered in `TEXTURE_REGISTRY`.

## Phase 3: Selective High-Resolution Asset Pack Upgrades
- Maintain strict license separation (`CC BY 4.0` core vs isolated optional `CC BY-SA 4.0` pack architecture if Z-Anatomy is ever packaged separately).
- Add dedicated high-resolution cranial vault, meningeal layers (falx cerebri, arachnoid/pia mater), and full cranial nerve cistern packs when verified CC-compatible meshes are imported.

## Phase 4: Deformable Kinematics & Multimodal Cross-Sectional Alignment
- Upgrade rigid-body upper-limb pilots to morph-target or skeletal-rigged muscle belly contraction only when verified rigged meshes are available.
- Pair Sagittal/Axial/Coronal clipping planes with open-licensed visible-human or radiologic reference slices (clearly attributed, never fabricated).
