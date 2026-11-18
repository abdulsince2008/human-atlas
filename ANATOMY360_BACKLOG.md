# ANATOMY 360 — Engineering & Asset Backlog

1. **Per-Tissue GPU Roughness / Metalness Attribute Texture:** Extend `app/scene.tsx` shader with a secondary 4096×1 material-properties texture so wet serosal organs, matte bone, fibrous tendons, and striated skeletal muscle exhibit distinct specular roughness in real time.
2. **Procedural PBR Micro-Detail Maps (CC0/MIT):** Add tileable muscle fiber striation, cortical bone porosity, and organ parenchyma normal/roughness maps registered in `TEXTURE_REGISTRY`.
3. **High-Resolution Meninges & Cranial Nerve Cistern Pack:** Source and validate CC BY 4.0 meshes for falx cerebri, arachnoid/pia mater, and cranial nerves V–XII (currently explicitly disclosed as absent in BodyParts3D 4.0).
4. **Female Reference Anatomy Pack:** Integrate a verified, license-compliant adult female anatomical mesh set with matching FMA concept alignment.
5. **Isolated Optional CC BY-SA Asset Pack Loader:** If Z-Anatomy (`CC BY-SA 4.0`) meshes are ever adopted, serve them as an isolated external asset pack with distinct license attribution rather than bundling into the MIT/CC-BY core.
6. **Soft-Tissue Deformable Muscle Kinematics:** Upgrade rigid-body upper-limb pilots (`elbow-flexion`, `shoulder-abduction`) to morph-target or rigged soft-tissue contraction once verified rigged assets exist.
