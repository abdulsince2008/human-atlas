# Brain Anatomy Asset Audit & Regional Color Architecture

## 1. Verified BodyParts3D 4.0 Brain Coverage
All 10 regional divisions in `app/visualization-colors.ts` map strictly to verified meshes present in `public/models/atlas.json` (BodyParts3D 4.0, CC BY-SA 2.1 Japan):

| Region ID | Display Label | Color (Colorblind-Safe) | Representative Verified Meshes |
| :--- | :--- | :--- | :--- |
| `frontal_lobe` | Frontal Lobe & Motor Cortex | `#2E86AB` | Superior/middle/inferior frontal gyri, precentral gyrus, orbital gyri |
| `parietal_lobe` | Parietal Lobe & Somatosensory Cortex | `#44AF69` | Postcentral gyrus, superior parietal lobule, angular & supramarginal gyri |
| `temporal_lobe` | Temporal Lobe | `#E69F00` | Superior/middle/inferior temporal gyri, fusiform gyrus |
| `occipital_lobe` | Occipital Lobe | `#9B5DE5` | Left and right occipital lobes (`FJ1791`, `FJ1792`) |
| `limbic_insula` | Limbic System & Insula | `#D55E00` | Insula, cingulate, parahippocampal gyrus, hippocampus, amygdala, fornix |
| `diencephalon_basal` | Diencephalon, Basal Nuclei & White Matter | `#009E73` | Thalamus, hypothalamus, caudate, putamen, globus pallidus, corpus callosum, internal capsule, pituitary, pineal |
| `cerebellum` | Cerebellum | `#CC79A7` | Left & right cerebellar hemispheres (`FJ1781`, `FJ1830`) |
| `brainstem` | Brainstem (Midbrain, Pons & Medulla) | `#B85D3B` | Midbrain, pons, medulla oblongata, colliculi, cerebral peduncles |
| `ventricular_system` | Ventricular System & Choroid Plexus | `#56B4E9` | Lateral, third, and fourth ventricles, cerebral aqueduct, choroid plexus |
| `cranial_nerves_dura` | Optic Pathways & Tentorium Cerebelli | `#C8A415` | Optic nerves/chiasm/tracts, oculomotor/trochlear nerves, tentorium cerebelli (`FJ1843`) |

## 2. Explicit Missing Brain Assets (Never Fabricated)
- Falx cerebri, arachnoid mater, and pia mater sheets (only tentorium cerebelli is modeled).
- Individual cranial nerves V, VII, VIII, IX, X, XI, XII at brainstem exit cisterns.
- Fine Brodmann-level sub-cortical parcellation beyond BodyParts3D gyral meshes.

## 3. Viewing Presets & Rendering Architecture
- **Default Behavior:** Regional brain colors are active by default in the 3D Explorer (`partColorTexture` 4096×1 RGBA GPU `DataTexture`) with a one-click toggle to revert to the standard nervous-system palette.
- **7 Anatomical Presets:** Anterior, Posterior, Left Lateral, Right Lateral, Superior, Inferior, and Medial (automatically engaging the midsagittal X clipping plane).
