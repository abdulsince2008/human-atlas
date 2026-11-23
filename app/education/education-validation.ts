import type { Atlas } from '../anatomy';
import { CANONICAL_SYSTEMS } from '../anatomy-systems';
import {
  EDUCATION_TOPICS,
  EXPECTED_DOMAIN_CHAPTER_COUNTS,
  PLATFORM_RESOURCE_MAPPINGS,
} from './education-content';
import { CURRICULUM_FRAMEWORKS, EDUCATION_TRACKS } from './education-curricula';
import { EDUCATION_DOMAINS } from './education-domains';

export interface EducationValidationResult {
  valid: boolean;
  errors: string[];
  summary: {
    tracks: number;
    frameworks: number;
    domains: number;
    topics: number;
    selfChecks: number;
    shortAnswers: number;
    appliedCases: number;
    presentationSlides: number;
    readingLinks: number;
    platformMappings: number;
  };
}

/**
 * Structural, referential, FMA-mesh, deck/rubric, and governance validator for
 * the 16-domain, 267-chapter education data layer. Passing this validator proves
 * schema integrity and honest asset/review disclosures ONLY — it does NOT certify
 * medical accuracy, clinical safety, or qualified human faculty review.
 */
export function validateEducationSystem(atlas?: Atlas | null): EducationValidationResult {
  const errors: string[] = [];

  const trackIds = new Set(EDUCATION_TRACKS.map((t) => t.id));
  const frameworkIds = new Set(CURRICULUM_FRAMEWORKS.map((f) => f.id));
  const domainIds = new Set(EDUCATION_DOMAINS.map((d) => d.id));
  const systemIds = new Set(CANONICAL_SYSTEMS.map((s) => s.id));

  // 1. Unique IDs for tracks, frameworks, domains
  if (trackIds.size !== EDUCATION_TRACKS.length) {
    errors.push('Duplicate track ID detected in EDUCATION_TRACKS.');
  }
  if (frameworkIds.size !== CURRICULUM_FRAMEWORKS.length) {
    errors.push('Duplicate framework ID detected in CURRICULUM_FRAMEWORKS.');
  }
  if (domainIds.size !== EDUCATION_DOMAINS.length) {
    errors.push('Duplicate domain ID detected in EDUCATION_DOMAINS.');
  }
  if (EDUCATION_DOMAINS.length !== 16) {
    errors.push(`Expected 16 domains, found ${EDUCATION_DOMAINS.length}.`);
  }

  // 2. Validate frameworks
  for (const fw of CURRICULUM_FRAMEWORKS) {
    if (!fw.title.trim() || !fw.authority.trim() || !fw.country.trim()) {
      errors.push(`Framework ${fw.id}: missing required title, authority, or country.`);
    }
    if (!fw.url.startsWith('https://')) {
      errors.push(`Framework ${fw.id}: URL must use https://.`);
    }
    if (!fw.dateAccessed.trim() || !fw.academicYearOrVersion.trim()) {
      errors.push(`Framework ${fw.id}: missing dateAccessed or academicYearOrVersion.`);
    }
    for (const tr of fw.tracks) {
      if (!trackIds.has(tr)) {
        errors.push(`Framework ${fw.id}: unknown track ${tr}.`);
      }
    }
  }

  // 3. Validate domains & exact 267-chapter distribution
  for (const dom of EDUCATION_DOMAINS) {
    if ((dom.reviewStatus as string) === 'expert_verified' || (dom.reviewStatus as string) === 'faculty_reviewed') {
      errors.push(`Domain ${dom.id}: false verified/faculty_reviewed status is forbidden.`);
    }
    if (!dom.overview.trim()) {
      errors.push(`Domain ${dom.id}: missing overview.`);
    }
    if (!dom.assetDisclosure.summary.trim()) {
      errors.push(`Domain ${dom.id}: missing assetDisclosure summary.`);
    }
    for (const tr of dom.targetTracks) {
      if (!trackIds.has(tr)) errors.push(`Domain ${dom.id}: invalid track ${tr}.`);
    }
    for (const fw of dom.curriculumFrameworks) {
      if (!frameworkIds.has(fw)) errors.push(`Domain ${dom.id}: invalid framework ${fw}.`);
    }
    for (const sys of dom.relatedSystems) {
      if (!systemIds.has(sys)) errors.push(`Domain ${dom.id}: invalid canonical system ${sys}.`);
    }

    const domTopics = EDUCATION_TOPICS.filter((t) => t.domainId === dom.id);
    const expectedCount = EXPECTED_DOMAIN_CHAPTER_COUNTS[dom.id];
    if (domTopics.length !== expectedCount) {
      errors.push(
        `Domain ${dom.id}: expected ${expectedCount} chapters, found ${domTopics.length}.`,
      );
    }
  }

  if (EDUCATION_TOPICS.length !== 267) {
    errors.push(`Expected 267 total chapters across all 16 domains, found ${EDUCATION_TOPICS.length}.`);
  }

  // Enforce honest asset disclosure on asset-dependent domains
  const histologyDomain = EDUCATION_DOMAINS.find((d) => d.id === 'histology');
  if (histologyDomain && histologyDomain.coverageStatus !== 'asset_missing') {
    errors.push('Histology domain must honestly report asset_missing until licensed microscopy images are bundled.');
  }
  const radiologyDomain = EDUCATION_DOMAINS.find((d) => d.id === 'radiology_imaging');
  if (radiologyDomain && radiologyDomain.coverageStatus !== 'asset_missing') {
    errors.push('Radiology domain must honestly report asset_missing until licensed medical imaging datasets are bundled.');
  }

  // 4. Validate topics, FMA mappings, quiz bounds, sources, decks, rubrics, and governance
  const seenTopicIds = new Set<string>();
  const seenChapterCodes = new Set<string>();
  const seenQuestionIds = new Set<string>();
  const atlasConceptMap = atlas
    ? new Map(atlas.concepts.map((c) => [c.id, c]))
    : null;

  let totalSelfChecks = 0;
  let totalShortAnswers = 0;
  let totalAppliedCases = 0;
  let totalSlides = 0;
  let totalReadingLinks = 0;

  for (const topic of EDUCATION_TOPICS) {
    if (seenTopicIds.has(topic.id)) {
      errors.push(`Duplicate topic ID: ${topic.id}`);
    }
    seenTopicIds.add(topic.id);

    if (!topic.chapterCode) {
      errors.push(`Topic ${topic.id}: missing chapterCode.`);
    } else if (seenChapterCodes.has(topic.chapterCode)) {
      errors.push(`Duplicate chapterCode: ${topic.chapterCode}`);
    } else {
      seenChapterCodes.add(topic.chapterCode);
    }

    if (!domainIds.has(topic.domainId)) {
      errors.push(`Topic ${topic.id}: invalid domainId ${topic.domainId}.`);
    }
    if ((topic.reviewStatus as string) === 'expert_verified' || (topic.reviewStatus as string) === 'faculty_reviewed') {
      errors.push(`Topic ${topic.id}: false expert_verified/faculty_reviewed status is forbidden.`);
    }
    if (topic.learningObjectives.length === 0) {
      errors.push(`Topic ${topic.id}: must include at least one learning objective.`);
    }
    if (topic.sources.length === 0) {
      errors.push(`Topic ${topic.id}: must include at least one source reference.`);
    }
    if (topic.curriculumMappings.length === 0) {
      errors.push(`Topic ${topic.id}: must include at least one curriculum mapping.`);
    }

    const depthCount = Object.values(topic.depthExplanations).filter(
      (v) => typeof v === 'string' && v.trim().length > 20,
    ).length;
    if (depthCount === 0) {
      errors.push(`Topic ${topic.id}: must provide at least one substantive depth explanation.`);
    }

    for (const tr of topic.targetTracks) {
      if (!trackIds.has(tr)) errors.push(`Topic ${topic.id}: invalid track ${tr}.`);
    }
    for (const cm of topic.curriculumMappings) {
      if (!frameworkIds.has(cm.frameworkId)) {
        errors.push(`Topic ${topic.id}: invalid curriculum framework ${cm.frameworkId}.`);
      }
    }
    for (const sys of topic.relatedSystems) {
      if (!systemIds.has(sys)) {
        errors.push(`Topic ${topic.id}: invalid canonical system ${sys}.`);
      }
    }
    for (const link of topic.crossSubjectLinks) {
      if (!domainIds.has(link.domainId)) {
        errors.push(`Topic ${topic.id}: invalid crossSubjectLink domainId ${link.domainId}.`);
      }
    }

    // Validate HTTPS readingLinks & uniqueness per topic
    if (!topic.readingLinks || topic.readingLinks.length === 0) {
      errors.push(`Topic ${topic.id}: missing curated external readingLinks.`);
    } else {
      const seenReadIds = new Set<string>();
      for (const rl of topic.readingLinks) {
        totalReadingLinks++;
        if (seenReadIds.has(rl.id)) {
          errors.push(`Topic ${topic.id}: duplicate reading link ID ${rl.id}.`);
        }
        seenReadIds.add(rl.id);
        if (!rl.url.startsWith('https://')) {
          errors.push(`Topic ${topic.id}: readingLink ${rl.id} URL must use https://.`);
        }
      }
    }

    // Validate transparent video fallback storyboard (zero fabricated YouTube URLs)
    if (!topic.videoResource) {
      errors.push(`Topic ${topic.id}: missing videoResource disclosure/script.`);
    } else if (
      topic.videoResource.availabilityStatus === 'unavailable_fallback_script' &&
      (!topic.videoResource.scenes || topic.videoResource.scenes.length < 4)
    ) {
      errors.push(`Topic ${topic.id}: fallback video script must supply storyboard scenes.`);
    }

    // Validate 9-slide interactive presentation deck
    if (!topic.presentationDeck || topic.presentationDeck.slides.length !== 9) {
      errors.push(
        `Topic ${topic.id}: presentationDeck must have 9 slides (found ${topic.presentationDeck?.slides.length ?? 0}).`,
      );
    } else {
      totalSlides += topic.presentationDeck.slides.length;
      if (!topic.presentationDeck.slides[7]?.quizPrompt) {
        errors.push(`Topic ${topic.id}: presentationDeck slide 8 must include an interactive quizPrompt.`);
      }
    }

    // Validate short-answer & applied reasoning exercises
    if (!topic.shortAnswerExercises || topic.shortAnswerExercises.length < 3) {
      errors.push(`Topic ${topic.id}: must include at least 3 shortAnswerExercises.`);
    } else {
      totalShortAnswers += topic.shortAnswerExercises.length;
    }

    if (!topic.appliedReasoningExercises || topic.appliedReasoningExercises.length < 1) {
      errors.push(`Topic ${topic.id}: must include at least 1 appliedReasoningExercise.`);
    } else {
      totalAppliedCases += topic.appliedReasoningExercises.length;
    }

    // Validate honest completionTracker review governance
    if (!topic.completionTracker) {
      errors.push(`Topic ${topic.id}: missing Section 7 completionTracker.`);
    } else if (topic.completionTracker.reviewStatus !== 'awaiting_academic_review') {
      errors.push(`Topic ${topic.id}: completionTracker.reviewStatus must be awaiting_academic_review.`);
    }

    // Enforce asset_required honesty on media-dependent chapters
    if (
      (topic.domainId === 'histology' ||
        topic.domainId === 'radiology_imaging' ||
        topic.domainId === 'microbiology_parasitology' ||
        topic.domainId === 'pathology' ||
        topic.domainId === 'haematology_lab') &&
      topic.assetDisclosure.status !== 'asset_required'
    ) {
      errors.push(
        `Topic ${topic.id}: domain ${topic.domainId} must preserve assetDisclosure.status='asset_required'.`,
      );
    }

    if (atlasConceptMap) {
      for (const fmaId of topic.relatedFmaConceptIds) {
        const concept = atlasConceptMap.get(fmaId);
        if (!concept || concept.elements.length === 0) {
          errors.push(`Topic ${topic.id}: FMA concept ${fmaId} does not resolve to real meshes in atlas.json.`);
        }
      }
    }

    if (topic.selfChecks.length < 5) {
      errors.push(`Topic ${topic.id}: must include at least 5 self-check questions (found ${topic.selfChecks.length}).`);
    }
    for (const q of topic.selfChecks) {
      totalSelfChecks++;
      if (seenQuestionIds.has(q.id)) {
        errors.push(`Duplicate self-check question ID: ${q.id}`);
      }
      seenQuestionIds.add(q.id);
      if (!q.question.trim() || !q.explanation.trim()) {
        errors.push(`Question ${q.id}: missing question text or explanation.`);
      }
      if (!Array.isArray(q.options) || q.options.length < 2) {
        errors.push(`Question ${q.id}: must provide at least 2 options.`);
      }
      if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.options.length) {
        errors.push(`Question ${q.id}: correctIndex ${q.correctIndex} is out of bounds.`);
      }
      if (!trackIds.has(q.level)) {
        errors.push(`Question ${q.id}: invalid track level ${q.level}.`);
      }
    }
  }

  for (const pm of PLATFORM_RESOURCE_MAPPINGS) {
    if (!domainIds.has(pm.domainId)) {
      errors.push(`Platform mapping ${pm.moduleName}: invalid domainId ${pm.domainId}.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    summary: {
      tracks: EDUCATION_TRACKS.length,
      frameworks: CURRICULUM_FRAMEWORKS.length,
      domains: EDUCATION_DOMAINS.length,
      topics: EDUCATION_TOPICS.length,
      selfChecks: totalSelfChecks,
      shortAnswers: totalShortAnswers,
      appliedCases: totalAppliedCases,
      presentationSlides: totalSlides,
      readingLinks: totalReadingLinks,
      platformMappings: PLATFORM_RESOURCE_MAPPINGS.length,
    },
  };
}
