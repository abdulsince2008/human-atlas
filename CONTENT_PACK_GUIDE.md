# Anatomy 360 — Content Pack & Multi-Atlas Authoring Guide

Anatomy 360 separates **canonical anatomical identity** (`FMA` concept IDs and `CanonicalSystemId` strings) from **rendering chunks**, **educational copy**, and **assessment packs**. Alongside the Adult Male BodyParts3D baseline (`public/models/atlas.json`) and the 79-part Female Overlay (`public/models/female/female-atlas.json`), new curriculum packs and future 3D body models (e.g., expanded Female vascular/nervous/visceral sets or Pediatric atlases) can be validated client-side via `#/atlases` (**Atlas & Pack Manager**) without changing core Three.js scene code or quiz/learn components.

---

## 1. Educational Content Pack JSON Schema (`v1`)

Any candidate educational content pack JSON uploaded to `#/atlases` must conform to the following structure checked by `validateContentPackJson()` in `app/content-registry.ts`:

```json
{
  "packId": "cardio-mbbs-module-1",
  "title": "MBBS Thoracic Great Vessels Pack",
  "license": "CC BY 4.0",
  "attribution": "Author / Institution attribution required for display",
  "structures": [
    {
      "conceptId": "FMA3736",
      "anatomicalName": "Ascending aorta",
      "canonicalSystem": "cardiovascular",
      "category": "artery"
    }
  ],
  "lessons": [
    {
      "id": "lesson-aorta-1",
      "title": "Ascending Aorta & Coronary Ostia",
      "systemId": "cardiovascular",
      "topics": []
    }
  ],
  "questions": [
    {
      "id": "q-aorta-1",
      "prompt": "Which pair of arteries arises from the aortic sinuses immediately above the aortic valve?",
      "explanation": "The left and right coronary arteries originate from the left and right aortic sinuses at the root of the ascending aorta."
    }
  ]
}
```

### Canonical System IDs (`CanonicalSystemId`)

Only the 12 canonical system identifiers are permitted:
`skeletal`, `muscular`, `nervous`, `cardiovascular`, `respiratory`, `digestive`, `urinary`, `reproductive`, `endocrine`, `lymphatic`, `integumentary`, `sensory`.

### Rules for Authors
1. **No Unattributed Clinical Claims:** Every structure/question/case must include `license` and `attribution`.
2. **Mandatory Explanations:** Every quiz question must provide a non-empty educational `explanation`.
3. **Model Coverage Honesty:** Never claim a structure has an individual 3D mesh unless its `conceptId` resolves to elements in the active atlas manifest.

---

## 2. Adding a New 3D Atlas Manifest (e.g., Adult Female / Pediatric)

When converted `.bin` / `.bin.gz` geometry chunks are prepared alongside a manifest JSON (`validateAtlasManifest()`):

1. `version` (string or number), `triangles` (total count), `chunks` (non-empty array with `url` & byte lengths).
2. `parts`: array of meshes, each containing unique `id`, valid `conceptId`, `system` (`SystemId`), valid `chunk` index, vertex/index byte offsets, and `bounds` tuple.
3. `concepts`: array mapping `id` (FMA ID) -> `name` & `elements` (`Part.id[]`). Every referenced `Part.id` must exist in `parts`.
4. Register the verified manifest inside `REGISTERED_ATLASES` in `app/content-registry.ts` once assets and license attribution are placed in `public/models/<pack-id>/`.
