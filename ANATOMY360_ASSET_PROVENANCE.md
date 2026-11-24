# ANATOMY 360 — Asset Provenance & License Registry

All external datasets and reference benchmarks are cataloged in `app/data/asset-registries.ts` (`LICENSE_REGISTRY`) and `app/data/provenance-registry.ts`.

| Source | Authority | License | Integration Status | Notes |
| --- | --- | --- | --- | --- |
| **BodyParts3D / Anatomography 4.0** | DBCLS, Japan | **CC BY 4.0** (current DBCLS Archive; historically released under CC BY-SA 2.1 Japan) | **Active Production Geometry** | 2,234 adult male meshes across 15 system groups. |
| **HuBMAP HRA Female Reference + Procedural Reconstructions** | HuBMAP Consortium (Indiana Univ. / NLM) & Anatomy 360 | **CC BY 4.0** + MIT Procedural | **Active Female Overlay** | 79 overlay parts (`124.4k` tris): 71 HuBMAP HRA meshes (Visible Human Female v1.5 + Mammary Gland v1.1) + 8 aligned procedural reconstructions; replaces 29 male parts. Broader vascular/nervous/visceral/variant/validation gaps remain. |
| **Wikimedia Commons Histology & Radiology Media** | Wikimedia Commons Contributors | **CC0 / CC BY / CC BY-SA** | **Active Starter Media** | 10 Histology micrographs (`public/media/histology/`) & 5 normal Radiology scans (`public/media/radiology/`); per-chapter C1–C18/N1–N14 clinical libraries remain `asset_required`. |
| **Foundational Model of Anatomy (FMA)** | University of Washington | **CUSTOM** (OBO Foundry: `https://obofoundry.org/ontology/fma.html`) | **Active Ontology** | Canonical FMA concept IDs (`FMA7088`, `FMA50801`, etc.). |
| **Terminologia Anatomica (TA2) / TNA** | IFAA / FIPAT | **CC BY-ND 4.0** | **Active Terminology Reference** | Unmodified official anatomical naming alignment. |
| **Human Atlas Web Runtime** | Open-source repository | **MIT** | **Active Codebase** | Rendering engine, UI, and interaction layer. |
| **OpenStax Anatomy & Physiology 2e / NCBI StatPearls** | Rice University / NLM | **CC BY 4.0** | **Active Educational References** | Curated open-access educational citations and external links. |
| **Z-Anatomy** | Z-Anatomy Contributors | **CC BY-SA 4.0** | **Excluded** | Not mixed into MIT/CC-BY core bundle; requires isolated optional pack architecture if ever adopted. |
| **NLM Visible Human / Open3DModel / VOXEL-MAN** | Respective Authorities | Various (Public Domain / Custom) | **Evaluated / Candidate Only** | Not imported into current production build. |
| **3D Neurosurgical Atlas** | The Neurosurgical Atlas | **Proprietary / Educational Copyright** | **Reference Only (Never Imported)** | Visual/pedagogical benchmark only; zero assets or text copied. |
