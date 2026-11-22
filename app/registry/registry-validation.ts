import type { Atlas } from '../anatomy';
import { CURRICULUM_FRAMEWORKS } from '../education/education-curricula';
import { EDUCATION_DOMAINS } from '../education/education-domains';
import { KNOWLEDGE_GRAPH_V2 } from '../knowledge-graph';
import {
  computeRegistryMetrics,
  REGISTRY_CHAPTERS,
  REGISTRY_SUBJECTS,
  REGISTRY_TOPICS,
} from './knowledge-registry';
import type { RegistryValidationResult } from './registry-types';

export function validateKnowledgeRegistry(atlas?: Atlas | null): RegistryValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const subjectIds = new Set<string>();
  const chapterIds = new Set<string>();
  const topicIds = new Set<string>();
  const domainIds = new Set(EDUCATION_DOMAINS.map((d) => d.id));
  const frameworkIds = new Set(CURRICULUM_FRAMEWORKS.map((f) => f.id));
  const plannedConcepts = new Set(
    KNOWLEDGE_GRAPH_V2.filter((r) => !r.visualization.inModel).map((r) => r.conceptId),
  );
  const atlasConceptIds = atlas ? new Set(atlas.concepts.map((c) => c.id)) : null;

  if (REGISTRY_SUBJECTS.length !== EDUCATION_DOMAINS.length) {
    errors.push(
      `Registry subjects count (${REGISTRY_SUBJECTS.length}) does not match 16 domains (${EDUCATION_DOMAINS.length}).`,
    );
  }

  for (const subj of REGISTRY_SUBJECTS) {
    if (subjectIds.has(subj.id)) errors.push(`Duplicate registry subject ID: ${subj.id}`);
    subjectIds.add(subj.id);

    if (!domainIds.has(subj.domainId)) {
      errors.push(`Subject ${subj.id} references unknown domainId ${subj.domainId}`);
    }
    if ((subj.reviewStatus as string) === 'expert_verified') {
      errors.push(`Subject ${subj.id} illegally claims expert_verified review status.`);
    }
    if (subj.topicIds.length === 0) {
      errors.push(`Subject ${subj.id} has zero linked topics.`);
    }
  }

  for (const ch of REGISTRY_CHAPTERS) {
    if (chapterIds.has(ch.id)) errors.push(`Duplicate registry chapter ID: ${ch.id}`);
    chapterIds.add(ch.id);
    if (!subjectIds.has(ch.subjectId)) {
      errors.push(`Chapter ${ch.id} references unknown subjectId ${ch.subjectId}`);
    }
    if (ch.topicIds.length === 0) {
      errors.push(`Chapter ${ch.id} has zero topics.`);
    }
  }

  for (const tp of REGISTRY_TOPICS) {
    if (topicIds.has(tp.id)) errors.push(`Duplicate registry topic ID: ${tp.id}`);
    topicIds.add(tp.id);

    if (!subjectIds.has(tp.subjectId)) {
      errors.push(`Topic ${tp.id} references unknown subjectId ${tp.subjectId}`);
    }
    if (!chapterIds.has(tp.chapterId)) {
      errors.push(`Topic ${tp.id} references unknown chapterId ${tp.chapterId}`);
    }
    if ((tp.reviewStatus as string) === 'expert_verified') {
      errors.push(`Topic ${tp.id} illegally claims expert_verified review status.`);
    }
    if (!tp.provenance.sourceOrganization.trim() || !tp.provenance.publicationOrRevisionDate.trim()) {
      errors.push(`Topic ${tp.id} missing provenance sourceOrganization or publicationOrRevisionDate.`);
    }
    if (tp.provenance.knownLimitations.length === 0) {
      errors.push(`Topic ${tp.id} must disclose knownLimitations honestly.`);
    }
    if (tp.learningOutcomes.length === 0) {
      errors.push(`Topic ${tp.id} must include at least one learning outcome.`);
    }

    for (const cm of tp.curriculumMappings) {
      if (!frameworkIds.has(cm.frameworkId)) {
        errors.push(`Topic ${tp.id} references unknown curriculum framework ${cm.frameworkId}`);
      }
    }

    if (atlasConceptIds) {
      for (const cid of tp.relatedConceptIds) {
        if (!atlasConceptIds.has(cid) && !plannedConcepts.has(cid)) {
          errors.push(`Topic ${tp.id} references unknown FMA concept ${cid}`);
        }
      }
    }

    // Enforce truthfulness rules for introductory modules & missing assets
    if (tp.sourceKind === 'education_topic' && tp.countsAsFullCoverage) {
      errors.push(`Introductory module ${tp.id} must not claim countsAsFullCoverage=true.`);
    }
    if (tp.domainId === 'histology' || tp.domainId === 'radiology_imaging') {
      if (tp.assetStatus !== 'asset_missing') {
        errors.push(`Topic ${tp.id} in ${tp.domainId} must preserve assetStatus=asset_missing.`);
      }
      if (tp.coverageStatus === 'complete' || tp.coverageStatus === 'substantially_covered') {
        errors.push(`Topic ${tp.id} in ${tp.domainId} cannot claim full coverage while assets are missing.`);
      }
    }
    if (tp.id === 'endocrine-feedback-planned' && tp.coverageStatus !== 'planned') {
      errors.push('endocrine-feedback-planned must stay coverageStatus=planned.');
    }
  }

  // Ensure every chapter topicId resolves to an actual topic
  for (const ch of REGISTRY_CHAPTERS) {
    for (const tid of ch.topicIds) {
      if (!topicIds.has(tid)) {
        errors.push(`Chapter ${ch.id} references missing topicId ${tid}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    metrics: computeRegistryMetrics(atlas),
  };
}
