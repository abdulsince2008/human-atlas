# ANATOMY 360 — Complete Male & Female Anatomical Mesh Coverage Audit

**Generated & Verified From Live Manifests:** `public/models/atlas.json`, `public/models/shared/shared-enhancements.json`, `public/models/male/male-enhancements.json`, `public/models/female/female-atlas.json`, `public/models/optional/pregnancy-placenta.json`, and `app/data/coverage-matrix.ts` via `npm run audit:coverage` (`scripts/audit-anatomy-coverage.mjs`).

---

## 1. Counting Standard & Methodology (Section 2 Compliance)

There is **no authoritative universal constant** for the number of 3D meshes in an educational human atlas, because anatomical structures can be modeled as compound bones/viscera or sub-divided down to capillary beds and trabeculae. To avoid fabricated or inflated counts, ANATOMY 360 enforces a strict project-specific counting standard derived from `ANATOMY360_MALE_FEMALE_MESH_INVENTORY.csv`:

1. **3D Mesh (`parts[]` entry):** An independently selectable geometric object with non-empty vertex/index buffers (`>= 50` triangles), finite bounding boxes, and a valid binary chunk slice.
2. **Anatomical Concept (`concepts[]` vs unique part `conceptId`):** Named anatomical entities in FMA / TA2 / UBERON. Concepts are reported **separately** from meshes because `atlas.json` stores `3,432` FMA hierarchy/grouping concepts across `1,659` unique directly meshed `conceptId`s (`1,773` ontology grouping entries carry no standalone single leaf mesh).
3. **Bilateral Pairing:** Left and right paired structures are counted individually when represented by distinct geometry (`HF_OVARY_LEFT`, `HF_OVARY_RIGHT`).
4. **Shared Geometry vs Reused Male-Donor Geometry:**
   - **Shared Verified Geometry (`shared-enhancements.json`):** `47` meshes explicitly segmented for sex-neutral shared use (`HS_*`).
   - **Inherited/Reused Male-Donor Geometry:** `2,189` meshes from BodyParts3D 4.0 remain active in Female mode without female-specific morphological scaling or reshaping. They are shared **by inheritance** in the viewer (`2,236` active shared meshes total) and explicitly disclosed as `reused_from_male_unadapted`.
5. **Optional Advanced Layers:** Pregnancy / full-term placenta (`8` meshes, `HO_*`) and future embryology / histology / pathology / variant layers are strictly excluded from default Adult Male (`2,301`) and Adult Female (`2,328`) baseline counts.
6. **Derived Educational Target Denominator:** Project-specific targets (`2,380` Male; `2,441` Female) equal **Current Active Meshes + Documented Missing / Unsplit Gross-Anatomy Mesh Additions** defined in `CANONICAL_GROSS_ANATOMY_INVENTORY` (`app/data/coverage-matrix.ts`).

---

## 2. Executive Comparison: Original Baseline vs Current Multi-Layer Architecture

| Layer / Component | Source & Release | License | Parts (Meshes) | Manifest Concepts | Unique Part Concepts | Triangles | Default Active State |
|---|---|---|---:|---:|---:|---:|---|
| **Base Adult Male Atlas** (`atlas.json`) | BodyParts3D 4.0 (`isa_BP3D_4.0_obj_99`, DBCLS) | CC BY 4.0 | 2,234 | 3,432 | 1,659 | 2,288,268 | Male (all 2,234) / Female (2,189 kept, 45 replaced) |
| **Shared Enhancements** (`shared-enhancements.json`) | HuBMAP HRA Male v1.1/v1.2 (Spinal Cord C1–S5, Liver ligaments, Tonsils, Kidney sub-parts) | CC BY 4.0 | +47 | 49 | 47 | 33,766 | Both Male & Female |
| **Male Enhancements** (`male-enhancements.json`) | HuBMAP HRA Male v1.2/v1.3 (Coccyx, Bladder trigone/neck, 13 Prostate zones/ducts, 4 Rectal veins) | CC BY 4.0 | +20 | 20 | 20 | 16,969 | Male only |
| **Female Overlay v3.0** (`female-atlas.json`) | 84 HuBMAP HRA (55 v1.5 Visible Human Female `DOI: 10.48539/HBM352.BTSQ.586` + 16 v1.1 Mammary + 13 v1.3 Female Pelvic Vasculature) + 8 co-registered procedural reconstructions | CC BY 4.0 + MIT Procedural | +92 | 92 | 85 | 133,837 | Female only (replaces 45 male parts) |
| **Optional Pregnancy Layer** (`pregnancy-placenta.json`) | HuBMAP HRA v1.1 Visible Human Female Full-Term Placenta | CC BY 4.0 | +8 | 8 | 8 | 13,267 | **OFF by default** (Opt-in toggle in Female) |
| **Total Distinct Bundled Geometry** | **All 5 Layer Manifests** | **CC BY 4.0 + MIT Procedural** | **2,401** | — | — | **2,486,107** | Multi-layer runtime bundle |

- **Previous Audit Baseline:** `2,234` Male / `79` Female overlay (`-29` replaced = `2,284` Female active).
- **Current Verified Build:** **`2,301` Male active meshes** (`2,234 + 47 + 20`) and **`2,328` Female active meshes** (`2,234 - 45 + 47 + 92`), plus **`8` optional pregnancy meshes** (`2,336` when toggled ON).

---

## 3. Authoritative Research Sources & License Audit

| Source | Authority / Date | Scope & Geometry Availability | Ontology / IDs | License & Commercial Rights | Attribution & Constraints | Role in ANATOMY 360 |
|---|---|---|---|---|---|---|
| **BodyParts3D / Anatomography 4.0** | DBCLS, Japan (2013 / Archive CC BY 4.0 update) · [Download](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html) · [License](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) | Adult male whole-body reference; 2,234 bundled surface meshes (`6.68M` source tris optimized to `2.29M` LOD1 / `1.68M` LOD3). Missing thyroid, parathyroids, ear ossicles/cochlea, thoracic duct, regional lymph nodes, bulbourethral glands, meninges beyond tentorium. | FMA 4.x concept IDs + IS-A / PART-OF tables | **CC BY 4.0** (commercial & derivatives permitted) | Cite DBCLS CC BY 4.0 & Mitsuhashi et al. (2009) | Primary systemic geometry (`atlas.json`) |
| **HuBMAP Human Reference Atlas (HRA)** | HuBMAP Consortium / Indiana Univ. & NLM ([Portal](https://humanatlas.io/3d-reference-library) · [CCF Repo](https://hubmapconsortium.github.io/ccf/pages/ccf-3d-reference-library.html)) | Visible Human Male (`1 mm` CT/cryosection) & Visible Human Female (`0.33 mm` cryosection, `DOI: 10.48539/HBM352.BTSQ.586`) GLB reference organs. Major pelvic, mammary, urinary, spinal, kidney, liver, tonsil & vasculature coverage; does **not** supply full whole-body female skeleton/musculature/nerves or ear ossicles/thyroid. | UBERON + FMA semantic JSON-LD crosswalks | **CC BY 4.0** (commercial & derivatives permitted) | Credit HuBMAP Consortium / HRA 3D Reference Organ Library + DOIs | Verified shared (`47`), male (`20`), female (`84`), and optional placenta (`8`) geometry (`159` HuBMAP meshes total) |
| **Foundational Model of Anatomy (FMA)** | Structural Informatics Group, Univ. of Washington ([OBO Foundry](https://obofoundry.org/ontology/fma.html)) | Comprehensive symbolic anatomical ontology (`75k+` classes). Classes do **not** equal 3D geometry. | `FMA*` canonical IDs | **CUSTOM** (NOT CC BY 4.0) | Do not redistribute full ontology dump; reference canonical IDs only | Identifier & hierarchy backbone |
| **Terminologia Anatomica 2 (TA2)** | IFAA / FIPAT (2019) · [IFAA/FIPAT](https://ifaa.net/committees/anatomical-terminology-fipat/) · [AACA](https://clinical-anatomy.org/Clinical_Anatomical_Terminology) | International English/Latin standardized gross-anatomy nomenclature. | TA2 IDs & official terms | **CC BY-ND 4.0** (NoDerivatives) | Do not modify or redistribute verbatim FIPAT source tables | Terminology alignment benchmark only |
| **Z-Anatomy** | Z-Anatomy Contributors ([Models](https://github.com/Z-Anatomy/Models-of-human-anatomy) · [Unity App](https://github.com/Z-Anatomy/Unity-app_Z-Anatomy)) | Rich Blender/Unity anatomical models expanding on BP3D (includes ear ossicles, ganglia, fasciae, visceral refinements). Certain third-party brain/ear components carry separate upstream attribution or NC flags requiring per-asset checks. | TA2 / English / Latin names | **CC BY-SA 4.0** (ShareAlike + upstream checks) | Excluded from core MIT/CC BY 4.0 bundle to prevent ShareAlike contamination | Comparison benchmark; candidate only via isolated optional ShareAlike pack |
| **Co-Registered Procedural Reconstructions** | Anatomy 360 (`scripts/build-female-pack.mjs`) | 8 female structures anchored to HuBMAP pelvis (`HF_URETHRA`, `HF_ENDOMETRIUM`, `HF_CLITORIS`, `HF_VESTIBULAR_BULBS`, `HF_BARTHOLIN_GLANDS`, `HF_LABIA_MINORA`, `HF_LABIA_MAJORA`, `HF_MONS_PUBIS`). | FMA IDs mapped in `female-atlas.json` | MIT / CC BY 4.0 | Explicitly flagged `PRESENT_BUT_APPROXIMATED` until segmented reference geometry replaces them | Female urogenital/vulvar continuity |

---

## 4. Model-Level Coverage Summary (Dual Metric: Mesh Inventory vs Concept Inventory)

| Metric | Adult Male | Adult Female (Default) | Notes / Exact Formula |
|---|---:|---:|---|
| **Existing active meshes** | **2,301** | **2,328** | Male = `2,234 + 47 + 20`; Female = `2,234 - 45 + 47 + 92` |
| **Shared active meshes (total active in both)** | **2,236** | **2,236** | `2,189` BP3D base + `47` `HS_*` shared enhancements |
| — *Verified sex-neutral shared (`HS_*`)* | 47 | 47 | HuBMAP Spinal Cord, Liver ligaments, Tonsils, Kidney sub-structures |
| — *Reused from male BP3D donor (unadapted)* | 2,189 | **2,189 (94.0%)** | Cranium, non-pelvic spine/ribs, muscles, nerves, lungs, GI tract |
| **Sex-specific active meshes** | **65** | **92** | Male: `45` replaced BP3D + `20` `HM_*`; Female: `84` HuBMAP + `8` approx. |
| **Optional advanced meshes (OFF by default)** | 0 | **+8 (`2,336` if ON)** | Full-term placenta, amnion, umbilical vessels (`HO_*`) |
| **Missing required mesh structures (Inventory Gap)** | **79** | **113** | Sum of `targetGapAdditionMale` / `targetGapAdditionFemale` |
| **Present but merged / undivided entries** | **7** | **5** | E.g., `FJ3148` male urethra, BP3D tentorium-only meninges, cardiac valves, clitoral components |
| **Approximate / procedural meshes** | **0** | **8** | Female urethra, endometrium, clitoris, bulbs, Bartholin glands, labia minora/majora, mons pubis |
| **Concept-only FMA grouping entries (BP3D manifest)** | **1,773** | **1,773** | `3,432` manifest entries minus `1,659` unique directly meshed BP3D `conceptId`s |
| **Concept-only unmeshed inventory entries** | **1** | **2** | Pleura serous sheets; female extra-pelvic dimorphism |
| **License-blocked entries** | **1** | **1** | Z-Anatomy extra cranial ganglia / sub-organ meshes (`CC BY-SA 4.0`) |
| **Total project-specific target meshes** | **2,380** | **2,441** | `Existing Active + Documented Inventory Gaps` |
| **Mesh-inventory coverage percentage** | **96.7%** (`2,301 / 2,380`) | **95.4%** (`2,328 / 2,441`) | Strictly reflects gross-anatomy inventory scope; excludes histology/variants |
| **Verified medical-reference-only Female mesh share** | — | **89.7%** (`2,089` BP3D + `47` shared + `84` HuBMAP? No: `2,320 / 2,441` = `95.0%` incl. reused male base; only **`131 / 2,441 = 5.4%`** is natively sex-verified/sex-neutral) | Highlights why Female coverage must not be mistaken for 100% natively female-segmented geometry |
| **Active unique directly meshed concepts** | **1,726** | **1,754** | Unique `conceptId` across active parts |
| **Concept-inventory coverage percentage** | **99.1%** (`1,726 / 1,742`) | **99.0%** (`1,754 / 1,772`) | Distinct from mesh coverage; concepts remain higher when sub-parts are merged |

---

## 5. System-by-System Gap Analysis (All 12 Canonical Systems)

| Canonical Anatomical System | Male Existing | Female Existing | Male Target | Female Target | Male Gap | Female Gap | Male Mesh Cov. | Female Mesh Cov. | Critical Verified Findings & Honest Gaps |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **Skeletal System** (incl. connective ligaments) | 343 | 347 | 351 | 367 | 8 | 20 | 97.7% | 94.6% | Female pelvis (sacrum, coccyx, bilateral ilium/ischium/pubis) is genuine HuBMAP Female geometry; skull, ribs, sternum, and limb bones reuse BP3D male donor (`+12` female dimorphism gap). Articular bursae & labra missing (`+8`). |
| **Muscular System** | 402 | 402 | 408 | 414 | 6 | 12 | 98.5% | 97.1% | All 402 skeletal muscles in Female mode are reused from BP3D male donor. Levator ani is male-framed; bulbospongiosus, ischiocavernosus, deep transverse perineal muscle, external urethral sphincter, and perineal body are missing. |
| **Nervous System** | 169 | 169 | 180 | 181 | 11 | 12 | 93.9% | 93.4% | Enhanced with 30 HuBMAP spinal cord segments (`HS_SPINAL_C1..S5`). Missing: falx cerebri, cranial/spinal dura sac, arachnoid/pia mater, hypogastric/pelvic autonomic plexuses, and pudendal/clitoral/penile terminal branches. |
| **Cardiovascular System** (Arterial + Venous + Cardiac) | 1,070 | 1,055 | 1,077 | 1,072 | 7 | 17 | 99.4% | 98.4% | Female replaces 28 male penile/testicular/pelvic vessels with 17 HuBMAP Female uterine/iliac/pudendal/rectal vessels. Missing: cardiac valve leaflets & conduction system (`+7`), plus female ovarian, vaginal, internal pudendal artery, and dorsal clitoral vessels (`+10`). |
| **Respiratory System** | 119 | 119 | 121 | 121 | 2 | 2 | 98.3% | 98.3% | Larynx, trachea, bronchi, and lung segments present. Parietal and visceral pleural serous sacs remain concept-only (`+2`). |
| **Digestive System** | 98 | 98 | 101 | 101 | 3 | 3 | 97.0% | 97.0% | Enhanced with `HS_PORTA_HEPATIS` (plus 6 hepatic ligaments in connective/skeletal). Greater/lesser omenta and transverse mesocolon missing (`+3`). |
| **Urinary System** | 16 | 19 | 19 | 19 | 3 | 0 | 84.2% | 100.0%* | Both sexes carry 8 `HS_*` intrarenal structures. Male has bladder dome/trigone/neck (`HM_*`), but single merged `FJ3148` urethra (`-3` subdivisions). *Female has 18 HuBMAP/BP3D verified meshes + 1 procedural `HF_URETHRA` (`94.7%` verified). |
| **Reproductive System** | 25 | 58 | 33 | 68 | 8 | 10 | 75.8% | 85.3%* | Male enhanced with 13 `HM_*` prostate zones/ducts; missing bulbourethral glands, scrotal fascia/tunica vaginalis, and pampiniform plexus (`-8`). Female includes 52 HuBMAP pelvic/mammary + 6 procedural vulvar/endometrial meshes; missing ovarian cortex/medulla, myometrium/perimetrium split, rectouterine pouch, and separate clitoral crura/body/glans (`-10`). |
| **Endocrine System** | 4 | 4 | 11 | 11 | 7 | 7 | **36.4%** | **36.4%** | **CRITICAL GAP:** Only pineal, pituitary, and bilateral adrenals exist. **Thyroid gland** (left/right/isthmus) and all **4 parathyroid glands** have ZERO standalone meshes (`FJ2808` is thyroid *cartilage*). |
| **Lymphatic System** | 5 | 5 | 17 | 23 | 12 | 18 | **29.4%** | **21.7%** | **CRITICAL GAP:** Only spleen, 2 thymus lobes, and 2 `HS_*` palatine tonsils exist. Thoracic duct, cisterna chyli, and cervical/axillary/pelvic/inguinal lymph node chains are missing. |
| **Integumentary System** | 5 | 7 | 5 | 7 | 0 | 0 | 100.0% | 100.0% | Surface reference skin envelope + hair/lip + female labia majora & mons pubis (2 procedural). Micro-layers (epidermis/dermis) reside in Histology curriculum. |
| **Sensory Organs** | 45 | 45 | 57 | 57 | 12 | 12 | **78.9%** | **78.9%** | Eye structures are richly modeled, and note that 6 BP3D entries (`FJ1471/M`, `FJ1755/1803`, `FJ3265/3371`) are wrist retinaculum/choroid plexus/lacrimal bones bucketed into `sensory`. **CRITICAL GAP:** Tympanic membrane, malleus, incus, stapes, cochlea, and semicircular canals are missing. |

---

## 6. Geometry Health & Integrity Verification (Verified via `scripts/audit-anatomy-coverage.mjs`)

- **Duplicate Mesh IDs Across All 5 Layers:** `0` (`2,401` distinct IDs).
- **BP3D Geometric Duplicate Candidates (Same Bounds):** `9` identical-bounds pairs (`18` parts total, including `6` duplicate `conceptId` pairs such as `FJ1846/FJ2013` Celiac artery, `FJ1928/FJ2011` Superior mesenteric artery, `FJ2440/FJ2769` Cricoid cartilage, and `FJ2772/FJ3201` Hyoid bone). Preserved read-only in `atlas.json` to avoid breaking part-index GPU textures, and flagged for future non-breaking deduplication.
- **Over-Simplified Meshes (`< 50` triangles):** `0` across all `2,401` parts.
- **Curated Knowledge Coverage (`app/anatomy-knowledge.ts`):** `100%` of concepts in `shared-enhancements.json`, `male-enhancements.json`, `female-atlas.json`, and `pregnancy-placenta.json` carry curated entries (`verifiedCurated: true`).
- **Automated Reproducibility:** Run `npm run audit:coverage` anytime manifests change to regenerate `ANATOMY360_MALE_FEMALE_MESH_INVENTORY.csv` and verify every figure in this report.
