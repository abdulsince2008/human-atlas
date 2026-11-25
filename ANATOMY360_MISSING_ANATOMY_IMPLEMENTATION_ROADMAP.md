# ANATOMY 360 — Missing Anatomy Implementation & Sourcing Roadmap

This roadmap catalogs **every missing, merged, approximated, or unadapted gross-anatomy structure** identified in `ANATOMY360_COMPLETE_ANATOMY_COVERAGE_AUDIT.md` and `app/data/coverage-matrix.ts` (`CANONICAL_GROSS_ANATOMY_INVENTORY`), along with candidate open-science sources, license status, complexity, dependencies, and current implementation state.

---

## 1. Sourcing & Licensing Hierarchy

1. **Tier 1 (Already Bundled / CC BY 4.0):** BodyParts3D 4.0 (DBCLS) + HuBMAP Human Reference Atlas (CCF 3D Reference Library).
2. **Tier 2 (Pending External Import / License Compatible CC BY 4.0):** Additional HuBMAP HRA v2.x organ GLBs (e.g., Lymph Node, Thymus, Female Whole-Body CT subsets) & NIH/NLM Visible Human Male/Female cross-sectional reconstructions.
3. **Tier 3 (Original Anatomically Validated Sculpting — CC BY 4.0 / MIT):** Co-registered original anatomical modeling anchored to BP3D/HuBMAP bounding landmarks where no verified open dataset supplies the geometry.
4. **Tier 4 (Isolated Optional ShareAlike Pack — `LICENSE_BLOCKED` for Core):** Z-Anatomy (`CC BY-SA 4.0`) and AnatomyTOOL `Open3DModel` (`CC BY-SA 4.0`) — kept strictly outside the core `MIT + CC BY 4.0` bundle unless distributed via a separately hosted, clearly attributed CC BY-SA download module after per-asset upstream provenance checks.
5. **Strictly Prohibited:** Proprietary/commercial atlases (e.g., 3D Neurosurgical Atlas, Complete Anatomy, Primal Pictures, Innerbody illustrations/assets).

---

## 2. Roadmap of Missing & Incomplete Structures

| Inventory ID | Structure & Subdivisions | System | Sex Scope | Current Status | Est. Mesh Gap (M / F) | Priority | Complexity | Recommended Legitimate Source | License Status | Dependencies & State |
|---|---|---|---|---|---:|---|---|---|---|---|
| `gap-endo-thyroid-gland` | **Thyroid gland** (left lobe, right lobe, isthmus) | Endocrine | Both (Shared) | `MISSING_GEOMETRY` | 3 / 3 | **Critical** | Medium | Original sculpted/NLM Visible Human segmentation anchored to BP3D `FJ2808` (thyroid cartilage) & `FJ2209/FJ2210` (inferior thyroid arteries) | CC BY 4.0 compatible (when sculpted) | Independent; **Open Gap** |
| `gap-endo-parathyroid-glands` | **Parathyroid glands** (L/R superior & inferior) | Endocrine | Both (Shared) | `MISSING_GEOMETRY` | 4 / 4 | High | Low | Original anatomical modeling anchored on posterior surface of thyroid lobes | CC BY 4.0 compatible | Depends on `gap-endo-thyroid-gland`; **Open Gap** |
| `gap-sens-middle-ear-ossicles` | **Middle ear** (L/R tympanic membrane, malleus, incus, stapes) | Sensory | Both (Shared) | `MISSING_GEOMETRY` | 8 / 8 | **Critical** | High | Micro-CT / original anatomical modeling inside temporal bone, OR Z-Anatomy isolated CC BY-SA 4.0 pack after checking non-NC upstream rights | Pending CC BY 4.0 / `CC BY-SA 4.0` isolated review | Requires temporal bone cavity registration; **Open Gap** |
| `gap-sens-inner-ear-labyrinth` | **Inner ear** (L/R cochlea, vestibule & semicircular canals) | Sensory | Both (Shared) | `MISSING_GEOMETRY` | 4 / 4 | High | High | Original anatomical modeling inside petrous temporal bone anchored to CN VIII (`FJ*` vestibulocochlear nerve) | Pending CC BY 4.0 | Pairs with `gap-sens-middle-ear-ossicles`; **Open Gap** |
| `gap-lymph-thoracic-duct-nodes` | **Thoracic duct, cisterna chyli, right lymphatic duct & systemic lymph node chains** | Lymphatic | Both (Shared) | `SOURCE_AVAILABLE_NOT_IMPORTED` | 12 / 12 | **Critical** | High | HuBMAP HRA 3D Lymph Node GLBs (`CC BY 4.0`) + original spline modeling for thoracic duct along anterior vertebral bodies | HuBMAP GLBs verified **CC BY 4.0** | Must avoid aortic/azygos vein collision; **Open Gap** |
| `gap-fem-lymph-pelvic-mammary` | **Female axillary, parasternal mammary, pelvic/obturator & inguinal lymph nodes** | Lymphatic | Female | `MISSING_GEOMETRY` | 0 / 6 | High | Medium | HuBMAP HRA Lymph Node GLB instanced/scaled to axillary vessels & `HF_MAMMARY_*` | CC BY 4.0 compatible | Depends on `HF_MAMMARY_*` & thoracic duct; **Open Gap** |
| `gap-fem-pelvic-floor-muscles` | **Female pelvic diaphragm & perineal musculature** (female-widened levator ani, bulbospongiosus, ischiocavernosus, deep transverse perineal, external urethral sphincter, perineal body) | Muscular | Female (+6 shared male gaps) | `MISSING_GEOMETRY` (F) / `PRESENT_BUT_MERGED` (M) | 6 / 12 | **Critical** | High | NLM Visible Human Female 0.33 mm cryosection segmentation or HuBMAP-aligned anatomical reconstruction fitted inside `HF_ILIUM/ISCHIUM/PUBIS` | Pending CC BY 4.0 | Must replace inherited male levator ani (`FJ1450..FJ2551`) in Female mode; **Open Gap** |
| `gap-fem-cv-ovarian-vaginal-clitoral-vessels` | **Female ovarian arteries/veins, vaginal vessels, internal pudendal artery & dorsal clitoral vessels** | Cardiovascular | Female | `MISSING_GEOMETRY` | 0 / 10 | **Critical** | Medium | HuBMAP HRA v1.3/v1.4 Female Vasculature check or spline modeling from abdominal aorta / internal iliac to `HF_OVARY_*` and `HF_CLITORIS` | Pending CC BY 4.0 | Depends on `HF_OVARY_*`, `HF_VAGINA`, `HF_CLITORIS`; **Open Gap** |
| `gap-fem-nerv-pudendal-clitoral` | **Female pudendal nerve, perineal nerves, dorsal nerve of clitoris & uterovaginal plexus** | Nervous | Female | `MISSING_GEOMETRY` | 0 / 5 | High | Medium | Original anatomical nerve paths from S2–S4 roots through lesser sciatic foramen & Alcock canal | Pending CC BY 4.0 | Pairs with `HF_INTERNAL_PUDENDAL_VEIN_*`; **Open Gap** |
| `fem-repro-external-vulva` | **Replace 8 procedural reconstructions** (`HF_URETHRA`, `HF_ENDOMETRIUM`, `HF_CLITORIS` glans/body/crura split, `HF_VESTIBULAR_BULBS`, `HF_BARTHOLIN_GLANDS`, `HF_LABIA_*`, `HF_MONS_PUBIS`) | Reproductive / Urinary / Integumentary | Female | `PRESENT_BUT_APPROXIMATED` | 0 / 4 | High | Medium | NLM Visible Human Female / verified medical-illustrator mesh sculpting to replace current procedural approximations & split clitoral crura/body/glans | Current: MIT Procedural; Target: CC BY 4.0 | Currently bundled as disclosed procedural approximations; **Upgrade Pending** |
| `gap-fem-repro-histologic-layers` | **Uterine myometrium/perimetrium split, ovarian cortex/medulla, vaginal fornices & rectouterine pouch (Douglas)** | Reproductive | Female | `PRESENT_BUT_APPROXIMATED` | 0 / 6 | Medium | Medium | Subdivide `HF_UTERUS_*` shells & `HF_OVARY_*` using HuBMAP HRA metadata bounds | CC BY 4.0 compatible | Depends on `HF_UTERUS_*` & `HF_OVARY_*`; **Open Gap** |
| `gap-male-repro-bulbourethral-glands` | **Bulbourethral (Cowper) glands (L/R)** | Reproductive | Male | `MISSING_GEOMETRY` | 2 / 0 | High | Low | Original anatomical modeling anchored below `FJ3139` (prostate apex) beside membranous urethra | CC BY 4.0 compatible | **Open Gap** |
| `gap-male-repro-scrotum-spermatic-cord-pampiniform` | **Scrotal wall/dartos, tunica vaginalis, spermatic cord fascia & pampiniform plexus** | Reproductive | Male | `PRESENT_BUT_MERGED` | 6 / 0 | High | Medium | NLM Visible Human Male / original anatomical modeling enveloping `FJ3138/FJ3142` & `FJ3532/FJ3617` | Pending CC BY 4.0 | **Open Gap** |
| `gap-male-nerv-pudendal-prostatic-plexus` | **Male pudendal nerve, dorsal nerve of penis & prostatic autonomic plexus** | Nervous | Male | `MISSING_GEOMETRY` | 4 / 0 | Medium | Medium | Original nerve modeling from S2–S4 roots to prostate & dorsal shaft | Pending CC BY 4.0 | **Open Gap** |
| `gap-male-urin-urethral-subdivisions` | **Male prostatic, membranous & spongy urethra regional splits** | Urinary | Male | `PRESENT_BUT_MERGED` | 3 / 0 | Medium | Low | Vertex-segment split of BP3D `FJ3148` along prostate/membranous landmarks | CC BY 4.0 | Preserves `FJ3148` coordinate frame; **Open Gap** |
| `gap-nerv-cranial-meninges` | **Cranial dura mater, falx cerebri, arachnoid & pia mater** | Nervous | Both (Shared) | `PRESENT_BUT_MERGED` | 3 / 3 | High | Medium | Original shell extraction inside BP3D cranium (`FJ1843` tentorium cerebelli already present) | CC BY 4.0 compatible | **Open Gap** |
| `gap-nerv-spinal-meninges-cauda` | **Spinal dural sac, cauda equina refinement & hypogastric autonomic plexuses** | Nervous | Both (Shared) | `MISSING_GEOMETRY` | 4 / 4 | High | Medium | Extend `HS_SPINAL_L1..S5` canal with dural sheath & autonomic roots | Pending CC BY 4.0 | Depends on `HS_SPINAL_*`; **Open Gap** |
| `gap-cv-heart-valves-microcoronary` | **4 Heart valve leaflets & SA/AV/His conduction system** | Cardiovascular | Both (Shared) | `PRESENT_BUT_MERGED` | 7 / 7 | Medium | High | HuBMAP HRA Heart reference organ comparison / anatomical sub-mesh sculpting inside BP3D chambers | Pending CC BY 4.0 | **Open Gap** |
| `gap-skel-articular-bursae-menisci` | **Major shoulder/knee synovial bursae & glenoid/acetabular labra** | Skeletal | Both (Shared) | `PRESENT_BUT_MERGED` | 8 / 8 | Medium | Medium | `Open3DModel` (AnatomyTOOL — check per-model CC BY vs CC BY-SA license) | License verification required | **Open Gap** |
| `gap-fem-skel-nonpelvic-unadapted` | **Female thoracic ribcage, sternum, clavicles & craniofacial sexual dimorphism** | Skeletal | Female | `CONCEPT_ONLY_NO_GEOMETRY` | 0 / 12 | Medium | High | NLM Visible Human Female CT segmentation or HuBMAP HRA Female torso bones | Pending CC BY 4.0 | Eliminates male-donor thoracic cage reuse in Female mode; **Long-Term Gap** |
| `gap-resp-pleura-serous` | **Visceral & parietal pleural membranes (L/R)** | Respiratory | Both (Shared) | `CONCEPT_ONLY_NO_GEOMETRY` | 2 / 2 | Low | Low | Translucent shell offsets over BP3D lung meshes & inner ribcage | CC BY 4.0 compatible | **Open Gap** |
| `gap-dig-peritoneum-mesentery-omenta` | **Greater omentum, lesser omentum & transverse mesocolon** | Digestive | Both (Shared) | `PRESENT_BUT_MERGED` | 3 / 3 | Low | Medium | Translucent peritoneal sheet modeling complementing `HS_HEPATODUODENAL_LIG` | CC BY 4.0 compatible | **Open Gap** |
| `gap-license-blocked-z-anatomy` | **Extra Z-Anatomy cranial ganglia & sub-organ detail pack** | Nervous | Both (Shared) | `LICENSE_BLOCKED` | 0 / 0 (opt.) | Low | Low | `Z-Anatomy/Models-of-human-anatomy` via isolated optional CC BY-SA pack downloader | **CC BY-SA 4.0** (Blocked from core MIT build) | Requires optional external pack loader; **Blocked by Policy** |

---

## 3. Optional Advanced Layers Roadmap (Outside Default Baseline Target)

| Layer | Bundled Status | Mesh Count | License | Target Plan |
|---|---|---:|---|---|
| **Full-Term Placenta, Amnion & Umbilical Cord (`HO_*`)** | **Bundled (`pregnancy-placenta.json`, OFF by default)** | 8 | HuBMAP HRA v1.1 (CC BY 4.0) | Complete; user toggles via *Pregnancy / Placenta Layer* switch in Female mode |
| **Gravid Uterus (T1–T3) & Fetal Anatomy** | Planned (`OUT_OF_SCOPE`) | 0 | Requires verified CC BY 4.0 obstetrics dataset | Separate optional manifest `/models/optional/fetal-dev.json` |
| **Menstrual-Cycle Ovarian Follicles & Corpus Luteum** | Planned (`OUT_OF_SCOPE`) | 0 | Pending CC BY 4.0 modeling | Cyclical physiological overlay separate from static adult female baseline |
| **Carnegie Embryology / Pediatric Reference / Histology / Pathology Variants** | Curriculum / 2D media only | 0 | CC0 / CC BY / CC BY-SA (2D `/media/`) | Pediatric atlas tracked in `REGISTERED_ATLASES`; cellular microanatomy stays in Histology Lab |

---

## 4. Which Missing Structures Block a Complete Educational Atlas?

For general pre-medical, MBBS, nursing, and biomedical education (`ANATOMY 360`), **4 gaps directly block completeness across core curricula**:
1. **Thyroid & Parathyroid Glands (`gap-endo-thyroid-gland`, `gap-endo-parathyroid-glands`)** — Without the thyroid gland, Endocrine system 3D mesh coverage is only `36.4%`.
2. **Middle & Inner Ear (`gap-sens-middle-ear-ossicles`, `gap-sens-inner-ear-labyrinth`)** — Auditory ossicles, tympanic membrane, cochlea, and semicircular canals are tested in nearly every medical & MDCAT sensory curriculum.
3. **Thoracic Duct & Systemic Lymph Nodes (`gap-lymph-thoracic-duct-nodes`, `gap-fem-lymph-pelvic-mammary`)** — Lymphatic 3D mesh coverage sits at `29.4%` (Male) and `21.7%` (Female) until nodal chains & ducts are imported/modeled.
4. **Female Pelvic Floor & Ovarian/Vaginal/Clitoral Vasculature + Verified Vulva (`gap-fem-pelvic-floor-muscles`, `gap-fem-cv-ovarian-vaginal-clitoral-vessels`, `fem-repro-external-vulva`)** — Needed so Female mode advances beyond the `94.0%` male-donor inherited base + `8` procedural vulvar/urethral reconstructions into true anatomical parity.
