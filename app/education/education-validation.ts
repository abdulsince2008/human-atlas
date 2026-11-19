import type { Atlas } from '../anatomy';
import { CANONICAL_SYSTEMS } from '../anatomy-systems';
import { EDUCATION_TOPICS, PLATFORM_RESOURCE_MAPPINGS } from './education-content';
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
    platformMappings: number;
  };
}

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

  // 3. Validate domains
  for (const dom of EDUCATION_DOMAINS) {
    if ((dom.reviewStatus as string) === 'expert_verified') {
      errors.push(`Domain ${dom.id}: false expert_verified status is forbidden.`);
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
    // Every domain must have at least one foundational topic
    const domTopics = EDUCATION_TOPICS.filter((t) => t.domainId === dom.id);
    if (domTopics.length === 0) {
      errors.push(`Domain ${dom.id}: has zero topics implemented.`);
    }
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

  // 4. Validate topics, FMA mappings, quiz bounds, sources, and governance
  const seenTopicIds = new Set<string>();
  const seenQuestionIds = new Set<string>();
  const atlasConceptMap = atlas
    ? new Map(atlas.concepts.map((c) => [c.id, c]))
    : null;

  let totalSelfChecks = 0;

  for (const topic of EDUCATION_TOPICS) {
    if (seenTopicIds.has(topic.id)) {
      errors.push(`Duplicate topic ID: ${topic.id}`);
    }
    seenTopicIds.add(topic.id);

    if (!domainIds.has(topic.domainId)) {
      errors.push(`Topic ${topic.id}: invalid domainId ${topic.domainId}.`);
    }
    if ((topic.reviewStatus as string) === 'expert_verified') {
      errors.push(`Topic ${topic.id}: false expert_verified status is forbidden.`);
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

    if (atlasConceptMap) {
      for (const fmaId of topic.relatedFmaConceptIds) {
        const concept = atlasConceptMap.get(fmaId);
        if (!concept || concept.elements.length === 0) {
          errors.push(`Topic ${topic.id}: FMA concept ${fmaId} does not resolve to real meshes in atlas.json.`);
        }
      }
    }

    if (topic.selfChecks.length === 0) {
      errors.push(`Topic ${topic.id}: must include at least one self-check question.`);
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
      platformMappings: PLATFORM_RESOURCE_MAPPINGS.length,
    },
  };
}
