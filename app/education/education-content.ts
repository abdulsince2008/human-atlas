import { EDUCATION_TOPICS_PART_1 } from './education-content-part1';
import { EDUCATION_TOPICS_PART_2 } from './education-content-part2';
import { CURRICULUM_FRAMEWORKS, EDUCATION_TRACKS } from './education-curricula';
import { EDUCATION_DOMAINS } from './education-domains';
import type {
  CurriculumAuthorityId,
  EducationDomainId,
  EducationDomainSpec,
  EducationTopic,
  EducationTrackId,
} from './education-types';

export const EDUCATION_TOPICS: EducationTopic[] = [
  ...EDUCATION_TOPICS_PART_1,
  ...EDUCATION_TOPICS_PART_2,
];

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
    countSummary: '2,234 selectable meshes · 3,432 FMA concepts · 12 canonical systems',
    route: 'explorer',
    note: 'Adult male reference geometry with explode, isolate, X-ray, clipping, and surgical layers.',
  },
  {
    domainId: 'human_anatomy',
    moduleName: 'System Anatomy Lessons & Practical Lab',
    countSummary: '12 chapters · 28 topics · 4 guided 3D pathways · 100 curated structures (97 in 3D)',
    route: 'learn',
    note: 'Synchronized with 3D inspection, flashcards, and Practical Spotter Lab.',
  },
  {
    domainId: 'human_physiology',
    moduleName: 'Physiology Simulation Lab',
    countSummary: '4 interactive quantitative models + 1 planned endocrine spec',
    route: 'physiology',
    note: 'Cardiac, Respiratory, Renal, and Musculoskeletal evaluators with equations and bounds.',
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
