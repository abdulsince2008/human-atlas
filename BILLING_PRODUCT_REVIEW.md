# Alphatomy — Whop Product-Category Pre-Approval Brief

**Approval Status:** `BLOCKED_PROVIDER_CONFIRMATION`  
**Selected Provider:** **Whop** (`https://whop.com/elysiumforge/alphatomy/`). Alphatomy does **not** claim production payout/category approval from Whop prior to completing KYC and review.

---

## 1. Accurate Product Description

**Alphatomy** is an interactive, browser-based **human anatomy and biomedical educational software platform** built with React, TypeScript, Three.js/WebGL, and server-side metered educational tooling.

### Live Implemented Educational Features (Verified in Codebase)
1. **Interactive 3D Human Anatomy Viewer**:
   - Adult Male atlas (**2,301 active parts**: 2,234 base BodyParts3D 4.0 CC BY 4.0 meshes + 47 Shared + 20 Male HuBMAP HRA CC BY 4.0 enhancement meshes).
   - Adult Female v3.0 overlay (**2,328 active parts**: replaces male pelvic/reproductive parts with 84 HuBMAP HRA female meshes + 8 co-registered reconstructions, plus an 8-part Optional Full-Term Placenta layer OFF by default).
   - Real-time orbit, system isolation, x-ray, explode packing, coronal/sagittal/axial cross-section slicing, and FMA structure inspection.
2. **Educational Content & Curriculum Navigation**:
   - **12 Canonical Body Systems** and **16 Biomedical Subjects** (267–296 structured topics across learning tracks from School Grades 6–12 through FSc Pre-Medical, MDCAT, Nursing/Allied Health, MBBS, and Graduate/PhD).
   - **13 Worldwide Curriculum Frameworks** + local custom syllabus matcher (`SyllabusNavigatorPage`).
3. **Practice Quizzes & Practical Anatomy Identification**:
   - Topic-tagged multiple-choice practice questions with anatomical explanations.
   - **3D Spotter Practical Lab**: interactive spotter identification exercises directly on the 3D human body model, plus SM-2 spaced repetition flashcards.
4. **AI Study Guidance (Optional & Separately Metered)**:
   - Optional AI Anatomy Navigator powered by server-side Gemini proxy (`/api/ai/navigate`) returning plain-language anatomical explanations and typed 3D scene camera/filter commands. Strictly token-metered and never claimed as unlimited.
5. **Educator Workspace & Classroom Features**:
   - Course planner, custom teaching step sequencer, Guided 3D Presentation Studio, and client-side `.pptx`, `.pdf`, and `.md` teaching export tools, plus optional Firebase Classroom join codes.
6. **Additional Scientific Modules**:
   - Deterministic **Physiology Simulations** (cardiac output, respiratory ventilation, renal filtration, elbow lever mechanics, acid-base/oxygenation), **Histology** light-microscopy slides (10 CC-licensed micrographs), **Radiology** reference plates (5 de-identified normal plates), **Clinical Correlations** educational reasoning cases, and **Optional YouTube Educational Lectures** (`youtube-nocookie.com`).
7. **Existing Disclaimers & Data Transparency**:
   - Explicit educational disclaimer on Home, About, Features, and Terms: educational reference software only — **not intended for medical diagnosis, patient-specific medical advice, treatment, or surgical planning**.
   - Transparent coverage audit disclosing unmodeled structures (e.g., thyroid/parathyroid 3D meshes, middle ear ossicles) and clarifying that 0/267 chapters have external clinical-faculty accreditation.

---

## 2. Explicit Pre-Approval Questions for Any Selected Payment Provider

Before launching live checkout with Whop (`BILLING_PROVIDER=whop`), confirm all six items below are permitted under Whop's current Acceptable Use Policy and Terms:

1. **Anatomy and biomedical educational software:** Is interactive browser-based 3D human anatomy and biomedical study software permitted for subscription sales?
2. **School and pre-medical curriculum-aligned learning:** Are structured lessons supporting school biology and pre-medical syllabi (Grades 6–12, FSc Pre-Medical, A-Level, CBSE, Nursing, MBBS) permitted?
3. **Self-study quizzes and practical anatomy identification:** Are built-in practice MCQs, SM-2 flashcards, and 3D anatomical spotter identification exercises permitted?
4. **MDCAT-oriented or other exam-related learning features:** Are study modules and practice questions tagged for medical/pre-medical entrance and university exams (including MDCAT and MBBS study tracks) permitted (without guaranteeing exam scores or representing test-cheating services)?
5. **AI educational explanations:** Is our optional, separately metered AI Anatomy Navigator assistant (providing anatomical explanations and 3D viewer navigation commands) permitted?
6. **Educator / professor affiliate commissions:** Does Whop permit Alphatomy (either via Whop's native affiliate features or via manual business-paid referral commissions outside checkout) to compensate verified anatomy teachers/professors for qualifying referrals (no sub-affiliates, no recruitment bonuses, no MLM/pyramid structure)?

---

## 3. Compliance Notes

- Exam-related study tracks (`MDCAT`, `FSc Pre-Medical`, `MBBS`) are disclosed verbatim — never hidden or renamed.
- No live checkout is enabled (`liveCheckoutAllowed: false`) while Whop plan IDs (`plan_...`), webhook secrets (`ws_...`), seller details, and Whop KYC/category approval remain pending.
