import { DOMAIN_A_ANATOMY_CHAPTERS } from './chapters/domain-a-anatomy';
import { DOMAIN_B_CELL_CHAPTERS } from './chapters/domain-b-cell';
import { DOMAIN_C_HISTOLOGY_CHAPTERS } from './chapters/domain-c-histology';
import { DOMAIN_D_EMBRYOLOGY_CHAPTERS } from './chapters/domain-d-embryology';
import { DOMAIN_E_PHYSIOLOGY_CHAPTERS } from './chapters/domain-e-physiology';
import { DOMAIN_F_BIOCHEMISTRY_CHAPTERS } from './chapters/domain-f-biochemistry';
import { DOMAIN_G_GENETICS_CHAPTERS } from './chapters/domain-g-genetics';
import { DOMAIN_H_MICROBIOLOGY_CHAPTERS } from './chapters/domain-h-microbiology';
import { DOMAIN_I_IMMUNOLOGY_CHAPTERS } from './chapters/domain-i-immunology';
import { DOMAIN_J_PATHOLOGY_CHAPTERS } from './chapters/domain-j-pathology';
import { DOMAIN_K_PHARMACOLOGY_CHAPTERS } from './chapters/domain-k-pharmacology';
import { DOMAIN_L_NUTRITION_CHAPTERS } from './chapters/domain-l-nutrition';
import { DOMAIN_M_HAEMATOLOGY_CHAPTERS } from './chapters/domain-m-haematology';
import { DOMAIN_N_CHAPTERS } from './chapters/domain-n-radiology';
import { DOMAIN_O_CHAPTERS } from './chapters/domain-o-clinical';
import { DOMAIN_P_PRACTICE_CHAPTERS } from './chapters/domain-p-practice';
import { CURRICULUM_FRAMEWORKS, EDUCATION_TRACKS } from './education-curricula';
import { EDUCATION_DOMAINS } from './education-domains';
import type {
  CurriculumAuthorityId,
  EducationDomainId,
  EducationDomainSpec,
  EducationTopic,
  EducationTrackId,
} from './education-types';

/**
 * Complete 16-Domain, 267-Chapter Structured Curriculum Library (Domains A–P).
 * Preserves all 17 legacy topic IDs while delivering the full blueprint inventory.
 */
export const EDUCATION_TOPICS: EducationTopic[] = [
  ...DOMAIN_A_ANATOMY_CHAPTERS,       // A: 14 chapters
  ...DOMAIN_B_CELL_CHAPTERS,          // B: 10 chapters
  ...DOMAIN_C_HISTOLOGY_CHAPTERS,     // C: 18 chapters
  ...DOMAIN_D_EMBRYOLOGY_CHAPTERS,    // D: 18 chapters
  ...DOMAIN_E_PHYSIOLOGY_CHAPTERS,    // E: 16 chapters
  ...DOMAIN_F_BIOCHEMISTRY_CHAPTERS,  // F: 19 chapters
  ...DOMAIN_G_GENETICS_CHAPTERS,      // G: 16 chapters
  ...DOMAIN_H_MICROBIOLOGY_CHAPTERS,  // H: 16 chapters
  ...DOMAIN_I_IMMUNOLOGY_CHAPTERS,    // I: 17 chapters
  ...DOMAIN_J_PATHOLOGY_CHAPTERS,     // J: 20 chapters
  ...DOMAIN_K_PHARMACOLOGY_CHAPTERS,  // K: 20 chapters
  ...DOMAIN_L_NUTRITION_CHAPTERS,     // L: 14 chapters
  ...DOMAIN_M_HAEMATOLOGY_CHAPTERS,   // M: 17 chapters
  ...DOMAIN_N_CHAPTERS,               // N: 14 chapters
  ...DOMAIN_O_CHAPTERS,               // O: 18 chapters
  ...DOMAIN_P_PRACTICE_CHAPTERS,      // P: 20 chapters
];

export const EXPECTED_DOMAIN_CHAPTER_COUNTS: Record<EducationDomainId, number> = {
  human_anatomy: 14,
  cell_biology: 10,
  histology: 18,
  embryology: 18,
  human_physiology: 16,
  biochemistry: 19,
  molecular_genetics: 16,
  microbiology_parasitology: 16,
  immunology: 17,
  pathology: 20,
  pharmacology: 20,
  nutrition_health: 14,
  haematology_lab: 17,
  radiology_imaging: 14,
  clinical_specialties: 18,
  clinical_skills_public_health: 20,
};

export interface ExistingPlatformMapping {
  domainId: EducationDomainId;
  moduleName: string;
  countSummary: string;
  route: 'explorer' | 'learn' | 'physiology' | 'histology' | 'clinical' | 'present' | 'practical-lab' | 'quiz';
  note: string;
}

/**
 * Explicit integration map connecting pre-existing Anatomy 360 modules into the
 * 16-domain educational taxonomy without duplicating or overwriting working data.
 */
export const PLATFORM_RESOURCE_MAPPINGS: ExistingPlatformMapping[] = [
  {
    domainId: 'human_anatomy',
    moduleName: '3D BodyParts3D Atlas & Explorer',
    countSummary: '2,234 selectable meshes · 3,432 FMA concepts · 12 canonical systems · 14 HuBMAP female meshes',
    route: 'explorer',
    note: 'Adult reference geometry with explode, isolate, X-ray, clipping, and surgical layers.',
  },
  {
    domainId: 'human_anatomy',
    moduleName: 'System Anatomy Lessons & Practical Lab',
    countSummary: '12 chapters · 28 topics · 8 guided 3D pathways · 43 multi-tier quizzes',
    route: 'learn',
    note: 'Synchronized with 3D inspection, flashcards, Practical Spotter Lab, and Teacher/Professor Prep worksheets.',
  },
  {
    domainId: 'human_physiology',
    moduleName: 'Physiology Simulation Lab',
    countSummary: '5 interactive quantitative models + 1 planned endocrine spec',
    route: 'physiology',
    note: 'Cardiac, Respiratory, Renal, Musculoskeletal, and Acid–Base/O₂ Curve evaluators with equations and bounds.',
  },
  {
    domainId: 'histology',
    moduleName: 'Histology & Microanatomy Library',
    countSummary: '10 tissue entries with self-checks (real microscopy images pending)',
    route: 'histology',
    note: 'Structured microanatomy guides; licensed H&E photomicrographs explicitly marked Asset Required.',
  },
  {
    domainId: 'pathology',
    moduleName: 'Clinical Correlations & 3D Mechanism Studio',
    countSummary: '10 clinical cases · 5 built-in 3D presentations (3 clinical mechanisms)',
    route: 'clinical',
    note: 'Coronary ischemia, Pituitary–Optic chiasm, and Hepatic portal 3D walkthroughs on normal reference geometry.',
  },
  {
    domainId: 'clinical_specialties',
    moduleName: 'Guided 3D Presentation Studio & Video Recorder',
    countSummary: '5 built-in walkthroughs + browser-local WebM recording',
    route: 'present',
    note: 'Multi-stage narration, captions, step knowledge checks, and local presentation export.',
  },
];

export interface DomainCompletionSummary {
  domainId: EducationDomainId;
  code: string;
  shortTitle: string;
  totalChapters: number;
  expectedChapters: number;
  writtenCompleteCount: number;
  readingCompleteCount: number;
  readingLinksTotal: number;
  presentationDecksCount: number;
  verifiedVideosCount: number;
  fallbackVideoScriptsCount: number;
  mcqTotal: number;
  shortAnswersTotal: number;
  appliedCasesTotal: number;
  assetBlockedChaptersCount: number;
  completeForCoreScopeCount: number;
  partiallyCompleteCount: number;
  awaitingAcademicReviewCount: number;
  facultyReviewedCount: number;
  materialCompletionPct: number;
  technicalAvailabilityPct: number;
  knownLimitations: string[];
}

export interface PlatformCompletionSummary {
  totalDomains: number;
  totalChapters: number;
  expectedChapters: number;
  writtenCompleteCount: number;
  readingLinksTotal: number;
  presentationDecksCount: number;
  totalSlides: number;
  verifiedVideosCount: number;
  fallbackVideoScriptsCount: number;
  mcqTotal: number;
  shortAnswersTotal: number;
  appliedCasesTotal: number;
  assetBlockedChaptersCount: number;
  completeForCoreScopeCount: number;
  partiallyCompleteCount: number;
  awaitingAcademicReviewCount: number;
  facultyReviewedCount: number;
  byDomain: DomainCompletionSummary[];
}

export function getDomainCompletionSummary(domainId: EducationDomainId): DomainCompletionSummary {
  const dom = getDomainById(domainId);
  const topics = getTopicsByDomain(domainId);
  const total = topics.length;
  let writtenCompleteCount = 0;
  let readingCompleteCount = 0;
  let readingLinksTotal = 0;
  let presentationDecksCount = 0;
  let verifiedVideosCount = 0;
  let fallbackVideoScriptsCount = 0;
  let mcqTotal = 0;
  let shortAnswersTotal = 0;
  let appliedCasesTotal = 0;
  let assetBlockedChaptersCount = 0;
  let completeForCoreScopeCount = 0;
  let partiallyCompleteCount = 0;
  let awaitingAcademicReviewCount = 0;
  let facultyReviewedCount = 0;
  const limitationSet = new Set<string>();

  for (const t of topics) {
    const tr = t.completionTracker;
    if (tr?.writtenMaterialStatus === 'complete_for_core_scope') writtenCompleteCount++;
    if (tr?.readingStatus === 'complete_for_core_scope') readingCompleteCount++;
    readingLinksTotal += t.readingLinks?.length ?? 0;
    if (t.presentationDeck) presentationDecksCount++;
    if (t.videoResource?.availabilityStatus === 'verified') verifiedVideosCount++;
    if (t.videoResource?.availabilityStatus === 'unavailable_fallback_script') fallbackVideoScriptsCount++;
    mcqTotal += t.selfChecks.length;
    shortAnswersTotal += t.shortAnswerExercises?.length ?? 0;
    appliedCasesTotal += t.appliedReasoningExercises?.length ?? 0;
    if (t.assetDisclosure.status === 'asset_required') assetBlockedChaptersCount++;
    if (tr?.overallStatus === 'complete_for_core_scope') completeForCoreScopeCount++;
    if (tr?.overallStatus === 'partially_complete') partiallyCompleteCount++;
    if (tr?.reviewStatus === 'awaiting_academic_review' || t.reviewStatus !== 'structured_reference') {
      awaitingAcademicReviewCount++;
    }
    if ((t.reviewStatus as string) === 'faculty_reviewed') facultyReviewedCount++;
    for (const lim of tr?.knownLimitations ?? []) {
      limitationSet.add(lim);
    }
  }

  return {
    domainId,
    code: dom?.code ?? '?',
    shortTitle: dom?.shortTitle ?? domainId,
    totalChapters: total,
    expectedChapters: EXPECTED_DOMAIN_CHAPTER_COUNTS[domainId],
    writtenCompleteCount,
    readingCompleteCount,
    readingLinksTotal,
    presentationDecksCount,
    verifiedVideosCount,
    fallbackVideoScriptsCount,
    mcqTotal,
    shortAnswersTotal,
    appliedCasesTotal,
    assetBlockedChaptersCount,
    completeForCoreScopeCount,
    partiallyCompleteCount,
    awaitingAcademicReviewCount,
    facultyReviewedCount,
    materialCompletionPct: total === 0 ? 0 : Math.round((writtenCompleteCount / total) * 100),
    technicalAvailabilityPct: total === 0 ? 0 : Math.round(((total - assetBlockedChaptersCount) / total) * 100),
    knownLimitations: Array.from(limitationSet).slice(0, 6),
  };
}

export function getPlatformCompletionSummary(): PlatformCompletionSummary {
  const byDomain = EDUCATION_DOMAINS.map((d) => getDomainCompletionSummary(d.id));
  const totalSlides = EDUCATION_TOPICS.reduce((s, t) => s + (t.presentationDeck?.slides.length ?? 0), 0);
  return {
    totalDomains: EDUCATION_DOMAINS.length,
    totalChapters: EDUCATION_TOPICS.length,
    expectedChapters: Object.values(EXPECTED_DOMAIN_CHAPTER_COUNTS).reduce((a, b) => a + b, 0),
    writtenCompleteCount: byDomain.reduce((s, d) => s + d.writtenCompleteCount, 0),
    readingLinksTotal: byDomain.reduce((s, d) => s + d.readingLinksTotal, 0),
    presentationDecksCount: byDomain.reduce((s, d) => s + d.presentationDecksCount, 0),
    totalSlides,
    verifiedVideosCount: byDomain.reduce((s, d) => s + d.verifiedVideosCount, 0),
    fallbackVideoScriptsCount: byDomain.reduce((s, d) => s + d.fallbackVideoScriptsCount, 0),
    mcqTotal: byDomain.reduce((s, d) => s + d.mcqTotal, 0),
    shortAnswersTotal: byDomain.reduce((s, d) => s + d.shortAnswersTotal, 0),
    appliedCasesTotal: byDomain.reduce((s, d) => s + d.appliedCasesTotal, 0),
    assetBlockedChaptersCount: byDomain.reduce((s, d) => s + d.assetBlockedChaptersCount, 0),
    completeForCoreScopeCount: byDomain.reduce((s, d) => s + d.completeForCoreScopeCount, 0),
    partiallyCompleteCount: byDomain.reduce((s, d) => s + d.partiallyCompleteCount, 0),
    awaitingAcademicReviewCount: byDomain.reduce((s, d) => s + d.awaitingAcademicReviewCount, 0),
    facultyReviewedCount: byDomain.reduce((s, d) => s + d.facultyReviewedCount, 0),
    byDomain,
  };
}

export function getDomainById(id: EducationDomainId): EducationDomainSpec | undefined {
  return EDUCATION_DOMAINS.find((d) => d.id === id);
}

export function getTopicsByDomain(domainId: EducationDomainId): EducationTopic[] {
  return EDUCATION_TOPICS.filter((t) => t.domainId === domainId);
}

export function getDomainsForTrack(trackId: EducationTrackId | 'all'): EducationDomainSpec[] {
  if (trackId === 'all') return EDUCATION_DOMAINS;
  return EDUCATION_DOMAINS.filter((d) => d.targetTracks.includes(trackId));
}

export function getTopicsForFramework(
  frameworkId: CurriculumAuthorityId | 'all',
): EducationTopic[] {
  if (frameworkId === 'all') return EDUCATION_TOPICS;
  return EDUCATION_TOPICS.filter((t) =>
    t.curriculumMappings.some((m) => m.frameworkId === frameworkId),
  );
}

/**
 * Returns only topics in `domainId` that explicitly belong to the selected
 * learning track and (when not 'all') the selected curriculum reference,
 * respecting whether the selected curriculum reference applies to `trackId`.
 */
export function filterTopicsForTrackAndFramework(
  domainId: EducationDomainId,
  trackId: EducationTrackId | 'all',
  frameworkId: CurriculumAuthorityId | 'all',
): EducationTopic[] {
  if (trackId !== 'all' && frameworkId !== 'all') {
    const fw = getFrameworkById(frameworkId);
    if (!fw || !fw.tracks.includes(trackId)) return [];
  }
  return EDUCATION_TOPICS.filter((t) => {
    if (t.domainId !== domainId) return false;
    if (trackId !== 'all' && !t.targetTracks.includes(trackId)) return false;
    if (
      frameworkId !== 'all' &&
      !t.curriculumMappings.some((m) => m.frameworkId === frameworkId)
    ) {
      return false;
    }
    return true;
  });
}

/**
 * Returns domains matching `trackId` and `frameworkId` that have at least one
 * topic matching the same filter criteria. Returns an empty array when no
 * domain/topic matches (never falls back silently to an unrelated domain).
 */
export function getVisibleDomainsForFilter(
  trackId: EducationTrackId | 'all',
  frameworkId: CurriculumAuthorityId | 'all',
): EducationDomainSpec[] {
  if (trackId !== 'all' && frameworkId !== 'all') {
    const fw = getFrameworkById(frameworkId);
    if (!fw || !fw.tracks.includes(trackId)) return [];
  }
  return EDUCATION_DOMAINS.filter((d) => {
    if (trackId !== 'all' && !d.targetTracks.includes(trackId)) return false;
    if (frameworkId !== 'all' && !d.curriculumFrameworks.includes(frameworkId)) return false;
    return filterTopicsForTrackAndFramework(d.id, trackId, frameworkId).length > 0;
  });
}

export function resolveExplanationForTrack(
  topic: EducationTopic,
  preferredTrack: EducationTrackId,
): { trackUsed: EducationTrackId; text: string } {
  const direct = topic.depthExplanations[preferredTrack];
  if (direct) return { trackUsed: preferredTrack, text: direct };

  const fallbackOrder: EducationTrackId[] = [
    'secondary_premed',
    'medical_foundations',
    'graduate_research',
    'school_foundations',
    'clinical_applied',
    'allied_health',
  ];
  for (const t of fallbackOrder) {
    const candidate = topic.depthExplanations[t];
    if (candidate) return { trackUsed: t, text: candidate };
  }
  return { trackUsed: preferredTrack, text: topic.summary };
}

export function getFrameworkById(id: CurriculumAuthorityId) {
  return CURRICULUM_FRAMEWORKS.find((f) => f.id === id);
}

export function getTrackById(id: EducationTrackId) {
  return EDUCATION_TRACKS.find((t) => t.id === id);
}
