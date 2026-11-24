# ANATOMY 360 — Educational Resource, Copyright & Verification Standards

## 1. Zero-Fabrication & Source Verification Policy

Every educational record added across the **16 domains (267 chapters)** obeys the non-negotiable academic safety and attribution standards defined in the platform governance layer (`app/education/education-validation.ts`, `app/registry/registry-validation.ts`):

1. **No Copied Textbook Prose:** All written lessons, track explanations (`school_foundations` through `graduate_research`), mechanisms, comparison tables, misconception pairs, short-answer rubrics, and applied reasoning cases are authored as original educational syntheses.
2. **No Fabricated External URLs:** All **570** chapter reading links map from a centralized register of **63** source records in `app/education/verified-sources.ts` (`VERIFIED_SOURCES`), restricted strictly to verified `https://` portals (`OpenStax`, `NCBI Bookshelf / StatPearls`, `Histology Guide`, `University of Michigan Histology`, `Human Protein Atlas`, `IUPHAR`, `Edinburgh Pathologia`, `Utah WebPath`, `Radiopaedia`, `MedPix NLM`, `Allen Brain Atlas`, `CDC PH101`, `Geeky Medics`, `Virtual Human Embryo`, `Anatomical Society`, `PM&DC`, `QAA Biosciences`).
3. **No Invented YouTube Videos or Timestamps:** External videos remain marked `availabilityStatus: 'unavailable_fallback_script'` (**0 verified live external video URLs claimed**). Every chapter supplies an honest unavailability disclosure and an engine-generated 5-scene Video Script & Visual Storyboard exportable as `.md`.
4. **Honest Microscopy & Radiology Disclosures:** Starter CC-licensed plates (**10** Histology micrographs + **5** normal Radiology scans) are bundled in `public/media/`, while complete per-chapter microscopy, Gram stain, smear, histopathology, and clinical radiograph libraries (`85` chapters across Domains C, H, J, M, N) strictly preserve `assetDisclosure.status = 'asset_required'`. Text placeholders never count as visual images.
5. **No False Faculty Approval:** Automated validators explicitly forbid `'faculty_reviewed'` or `'expert_verified'` labels. All 267 chapters hold `reviewStatus: 'awaiting_academic_review'`.
6. **Non-Prescribing & Non-Diagnostic Educational Boundary:** Clinical Medicine (`O`), Pharmacology (`K`), Radiology (`N`), Pathology (`J`), and Clinical Skills (`P`) carry explicit educational scope disclaimers prohibiting individual clinical diagnosis or prescribing.

---

## 2. Separated Chapter Resource Architecture (7 User-Facing Tabs)

Implemented inside `app/components/MedicalCurriculumHub.tsx` and `app/components/ChapterDeckViewer.tsx`:

| Tab | Pedagogical Purpose | Underlying Schema Fields |
|---|---|---|
| **1. Learn** | Track-differentiated written lesson, prerequisites, objectives, mechanisms, structured comparison table, misconceptions, terminology, high-yield facts, clinical correlation, & summary | `prerequisites`, `learningObjectives`, `depthExplanations`, `mechanisms`, `stepByStep`, `comparisonTable`, `misconceptions`, `keyConcepts`, `keyFacts`, `clinicalCorrelation`, `summaryParagraph`, `keyTakeaways` |
| **2. Read** | External open textbook links mapped from 63 source records with publisher, section focus, licence, date checked + functional `.pdf` / `.md` study guide & Educator Handout export | `readingLinks`, `buildChapterStudyGuideMarkdown` |
| **3. Watch** | Honest video unavailability disclosure (**0** live links claimed) + engine-generated 5-scene storyboard script + Markdown script download | `videoResource` (`availabilityStatus`, `availabilityNote`, `scenes`) |
| **4. Presentations** | Engine-generated 9-slide interactive viewer (titles, objectives, concepts, mechanisms, visual, Slide 6 table, case, Slide 8 clickable MCQ, summary & speaker notes) + `.pptx`, `.pdf`, and `.md` exports + 3D studio deep links | `presentationDeck` (`ChapterPresentationDeck`), `externalReferences` |
| **5. Visualise** | Interactive 2D conceptual diagram node/pathway filter, verified 3D BodyParts3D + Female overlay FMA buttons, connected organ system lessons, bundled Radiology normal plates (Domain N), and honest `asset_required` alerts | `diagram`, `relatedFmaConceptIds`, `relatedSystems`, `assetDisclosure` |
| **6. Practise** | 5–10 MCQs synced with `StudyContext`, 3 short-answer exercises with expandable rubrics, 1 applied clinical/lab reasoning case with worked solution, & applied task | `selfChecks`, `shortAnswerExercises`, `appliedReasoningExercises`, `activity` |
| **7. References** | Cross-subject clickable domain links, curriculum framework alignments, reference URLs, and Section 7 Chapter/Domain/Platform completion matrix | `crossSubjectLinks`, `curriculumMappings`, `sources`, `completionTracker` |
