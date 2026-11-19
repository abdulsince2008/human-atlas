# Anatomy 360 — Remaining Tasks (External Blockers & Future Roadmap)

All Release 2.0 engineering tasks (3D graphics/PBR/LOD pipeline, scientific integrity hardening, and Guided 3D Presentation & Video Studio) are complete and verified. Remaining items require external assets, formal clinical review, or physical device testing:

1. **External Anatomical Mesh Expansion (CC BY 4.0 / CC0):** Source and integrate license-compliant 3D meshes for adult female reproductive anatomy, thyroid/parathyroid parenchyma, inner-ear cochlea/ossicles, epicranial scalp musculature, meninges (falx/arachnoid/pia), and upper-limb peripheral nerves (brachial plexus, radial, median, ulnar).
2. **Real Licensed Histological Micrographs & Pathological 3D Assets:** Import verified CC BY / CC0 microscopy slides into the existing Histology viewer slots and, if clinically validated pathological 3D meshes become available, upgrade conceptual pathophysiology overlays.
3. **Human Medical-Expert Review Sign-Off:** Conduct formal faculty review of anatomical notes, surgical dissection layers, clinical cases, and built-in presentations to advance provenance records beyond `draft` / `structured_reference`.
4. **Urdu Translation Pass:** Populate `.ur` fields inside `LocalizedText` objects with medically reviewed Urdu translations and RTL UI support.
5. **Physical Mobile & Cross-Browser Video Codec QA:** Test touch pinch-to-zoom, WebGL frame pacing, and `MediaRecorder` codec output (`video/webm` vs Safari `video/mp4`) on physical mobile and desktop browsers.
