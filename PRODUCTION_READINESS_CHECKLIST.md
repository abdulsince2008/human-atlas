# Anatomy 360 — V1 Production Readiness & Release Checklist

This checklist separates **Automated Technical Checks** (verified in code/CI) from **Human & Asset Sign-Offs** (external binary assets, microscopy media, and institutional review).

---

## A. Automated Verification Gates (Run via `npm run validate:all`)

| Gate | Script / Command | Verification Scope |
|---|---|---|
| TypeScript Strict Check | `npm run check` (`tsc --noEmit`) | Zero compile/type errors across all app & data files |
| Static Code Lint | `npm run lint` (`oxlint app web`) | Clean lint rules across React & TS modules |
| 3D Binary & Manifest Integrity | `npm run validate:atlas` | Verifies 2,234 meshes, 3,432 FMA concepts, 2,288,268 triangles, valid vertex bounds & 15 `.bin` buffers |
| 3D Layout & Input Contracts | `npm run validate:interactions` | Verifies zero overlapping cells in explosion layouts & tap/drag/multitouch behavior |
| Educational Content Integrity | `npm run validate:content` | Verifies unique IDs, all 12 canonical systems covered, valid FMA IDs on every lesson/quiz/relationship/lab, & provenance metadata |
| Automated Platform Suite | `npm test` | Tests Damerau search/synonyms, Knowledge Graph links, SM-2 interval math, corrupted StudyStore JSON recovery, manifest/pack validators, and physiology formulas |
| Production Static Build | `npm run build` | Bundles optimized static `dist/` artifacts cleanly with zero build errors |

---

## B. Runtime & Device Verification Checklist

- [ ] Test desktop Chrome/Edge/Firefox at `1280×800` across `#/`, `#/explorer`, `#/systems`, `#/relationships`, `#/learn`, `#/practical-lab`, `#/dashboard`, `#/revision`, `#/physiology`, `#/histology`, `#/clinical`, `#/atlases`, and `#/search`.
- [ ] Test mobile viewport (`390×844`): verify hamburger drawer shows Core, Study, and Labs sections cleanly with >=44px touch targets and zero horizontal overflow (`scrollWidth <= innerWidth`).
- [ ] Verify WebGL 3D Viewer graceful fallback if hardware acceleration is unavailable.
- [ ] Verify IndexedDB persistence + JSON export & re-import roundtrip + confirmation-guarded Reset in `#/dashboard`.

---

## C. Human & External Asset Sign-Offs (Required Before Claiming Complete External Media Coverage)

- [ ] **Legal Attribution Verification:** Confirm `BodyParts3D, © DBCLS (CC BY 4.0)` and MIT notices remain visible in About (`#/about`), Home footer, and packaged `THIRD_PARTY_LICENSES.md`.
- [ ] **Adult Female Reference 3D Model:** Bundle verified CC BY 4.0 / CC0 chunked binary meshes and manifest (e.g., HuBMAP / verified anatomical source) into `public/models/` before flipping female atlas entry from `unavailable_assets` to `available`.
- [ ] **Real Microscopy Micrographs:** Obtain CC BY 4.0 / CC0 photomicrographs with scale bars and populate `SpecimenAssetSlot.imageUrl` fields in `app/data/histology-data.ts`.
- [ ] **Urdu Localization Faculty Sign-Off:** Complete domain-reviewed Urdu medical translations for `LocalizedText.ur` fields prior to exposing a language switcher.
- [ ] **Production Static CDN Caching:** Verify `.bin.gz` / `.bin` model chunks serve cleanly over HTTPS with cache-control headers on Cloudflare Pages or target CDN.
