# ANATOMY 360 — Asset Provenance & License Registry

All external datasets and reference benchmarks are cataloged in `app/data/asset-registries.ts` (`LICENSE_REGISTRY`) and `app/data/provenance-registry.ts`.

| Source | Authority | License | Integration Status | Notes |
| --- | --- | --- | --- | --- |
| **BodyParts3D / Anatomography 4.0** | DBCLS, Japan | **CC BY 4.0** (current DBCLS Archive; historically released under CC BY-SA 2.1 Japan) | **Active Production Geometry** | 2,234 adult male meshes across 15 system groups. |
| **Foundational Model of Anatomy (FMA)** | University of Washington | **CC BY 4.0** | **Active Ontology** | Canonical FMA concept IDs (`FMA7088`, `FMA50801`, etc.). |
| **Human Atlas Web Runtime** | Open-source repository | **MIT** | **Active Codebase** | Rendering engine, UI, and interaction layer. |
| **OpenStax Anatomy & Physiology 2e / NCBI StatPearls** | Rice University / NLM | **CC BY 4.0** | **Active Educational References** | Curated open-access educational citations and external links. |
| **Z-Anatomy** | Z-Anatomy Contributors | **CC BY-SA 4.0** | **Excluded** | Not mixed into MIT/CC-BY core bundle; requires isolated optional pack architecture if ever adopted. |
| **HuBMAP HRA / NLM Visible Human / Open3DModel / VOXEL-MAN** | Respective Authorities | Various (CC BY 4.0 / Public Domain / Custom) | **Evaluated / Candidate Only** | Not imported into current production build. |
| **3D Neurosurgical Atlas** | The Neurosurgical Atlas | **Proprietary / Educational Copyright** | **Reference Only (Never Imported)** | Visual/pedagogical benchmark only; zero assets or text copied. |
