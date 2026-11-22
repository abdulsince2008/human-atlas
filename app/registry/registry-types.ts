import type { CanonicalSystemId } from '../anatomy-systems';
import type { AppRoute } from '../components/SiteHeader';
import type {
  AssetDisclosure,
  CurriculumAuthorityId,
  CurriculumMappingRef,
  EducationDomainId,
  EducationTrackId,
} from '../education/education-types';

export type RegistryCoverageStatus =
  | 'not_started'
  | 'planned'
  | 'introductory'
  | 'partial'
  | 'substantially_covered'
  | 'complete';

export type RegistryReviewStatus =
  | 'structured_reference'
  | 'curriculum_draft'
  | 'needs_academic_review'
  | 'pending_faculty_review'
  | 'faculty_reviewed';

export type RegistryAssetStatus =
  | 'available'
  | 'partial'
  | 'asset_missing'
  | 'conceptual_only'
  | 'specification_ready';

export interface RegistryLearningOutcome {
  id: string;
  statement: string;
  tracks: EducationTrackId[];
}

export type RegistryResourceKind =
  | '3d_structure'
  | '3d_presentation'
  | 'physiology_sim'
  | 'histology_entry'
  | 'clinical_case'
  | 'quiz'
  | 'external_resource'
  | 'lesson_2d_diagram';

export interface RegistryResourceLink {
  id: string;
  kind: RegistryResourceKind;
  title: string;
  route: AppRoute;
  targetId?: string;
  systemId?: CanonicalSystemId;
  note?: string;
  assetStatus?: RegistryAssetStatus;
}

export interface RegistryProvenance {
  sourceOrganization: string;
  authorOrCompiler: string;
  publicationOrRevisionDate: string;
  reviewedBy: string | null;
  reviewDate: string | null;
  knownLimitations: string[];
  missingOutcomes: string[];
  sourceUrls: string[];
}

export interface RegistryNavigationTarget {
  route: AppRoute;
  domainId?: EducationDomainId;
  systemId?: CanonicalSystemId;
  topicId?: string;
  conceptId?: string;
  presentationId?: string;
}

export interface RegistryTopicNode {
  id: string;
  sourceKind: 'education_topic' | 'anatomy_lesson_topic' | 'planned_module';
  domainId: EducationDomainId;
  subjectId: string;
  chapterId: string;
  chapterTitle: string;
  systemId?: CanonicalSystemId;
  title: string;
  summary: string;
  searchText: string;
  academicTracks: EducationTrackId[];
  difficultyTiers: string[];
  learningOutcomes: RegistryLearningOutcome[];
  keyTerms: string[];
  coverageStatus: RegistryCoverageStatus;
  reviewStatus: RegistryReviewStatus;
  assetStatus: RegistryAssetStatus;
  countsAsFullCoverage: boolean;
  provenance: RegistryProvenance;
  resources: RegistryResourceLink[];
  relatedConceptIds: string[];
  assessmentIds: string[];
  curriculumMappings: CurriculumMappingRef[];
  navigationTarget: RegistryNavigationTarget;
}

export interface RegistryChapterNode {
  id: string;
  domainId: EducationDomainId;
  subjectId: string;
  systemId?: CanonicalSystemId;
  title: string;
  summary: string;
  topicIds: string[];
  coverageStatus: RegistryCoverageStatus;
  reviewStatus: RegistryReviewStatus;
}

export interface RegistrySubjectNode {
  id: string;
  domainId: EducationDomainId;
  code: string;
  title: string;
  shortTitle: string;
  group:
    | 'foundational_biosciences'
    | 'organ_systems_and_function'
    | 'disease_and_therapeutics'
    | 'clinical_and_practice';
  overview: string;
  chapterIds: string[];
  topicIds: string[];
  topicCount: number;
  coverageStatus: RegistryCoverageStatus;
  coverageLabel: string;
  reviewStatus: RegistryReviewStatus;
  assetStatus: RegistryAssetStatus;
  assetDisclosure: AssetDisclosure;
  targetTracks: EducationTrackId[];
  curriculumFrameworks: CurriculumAuthorityId[];
  relatedSystems: CanonicalSystemId[];
  provenance: RegistryProvenance;
  educationalDisclaimer?: string;
}

export interface RegistryDatasetMetrics {
  domainsCount: number;
  subjectsCount: number;
  chaptersCount: number;
  topicsCount: number;
  anatomyLessonTopicsCount: number;
  biomedicalModulesCount: number;
  canonicalSystemsCount: number;
  curriculumFrameworksCount: number;
  learningTracksCount: number;
  quizBankCount: number;
  moduleSelfCheckCount: number;
  totalAssessmentQuestionsCount: number;
  physiologyInteractiveCount: number;
  physiologyPlannedCount: number;
  histologyEntriesCount: number;
  clinicalCasesCount: number;
  presentationsCount: number;
  externalStudyResourcesCount: number;
  knowledgeGraphV2Count: number;
  terminologyEntriesCount: number;
  atlasMeshesCount: number;
  atlasConceptsCount: number;
}

export interface RegistryCoverageBreakdown {
  totalTopics: number;
  completeCount: number;
  substantiallyCoveredCount: number;
  partialCount: number;
  introductoryCount: number;
  plannedCount: number;
  notStartedCount: number;
  assetMissingTopicsCount: number;
  pendingReviewTopicsCount: number;
  knownGaps: string[];
}

export interface RegistryValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  metrics: RegistryDatasetMetrics;
}
