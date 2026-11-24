import type { CanonicalSystemId } from '../anatomy-systems';
import type { AppRoute } from '../components/SiteHeader';

export type EducationTrackId =
  | 'school_foundations'
  | 'secondary_premed'
  | 'medical_foundations'
  | 'clinical_applied'
  | 'allied_health'
  | 'graduate_research';

export type EducationDomainId =
  | 'human_anatomy'
  | 'cell_biology'
  | 'histology'
  | 'embryology'
  | 'human_physiology'
  | 'biochemistry'
  | 'molecular_genetics'
  | 'microbiology_parasitology'
  | 'immunology'
  | 'pathology'
  | 'pharmacology'
  | 'nutrition_health'
  | 'haematology_lab'
  | 'radiology_imaging'
  | 'clinical_specialties'
  | 'clinical_skills_public_health';

export type CoverageStatus =
  | 'implemented_validated'
  | 'implemented_partial'
  | 'content_only_no_visual'
  | 'asset_missing'
  | 'planned_scaffold_only'
  | 'not_present'
  | 'out_of_scope';

export type PriorityTier = 'P0' | 'P1' | 'P2' | 'P3' | 'out_of_scope';

export type VisualFormat =
  | '3d_anatomy'
  | '2d_diagram'
  | 'quantitative_simulation'
  | 'microscopy'
  | 'medical_imaging'
  | 'clinical_case'
  | 'structured_text';

export type EducationReviewStatus =
  | 'structured_reference'
  | 'curriculum_draft'
  | 'pending_faculty_review';

export type CurriculumAuthorityId =
  | 'pk_ncp_gs_4_8'
  | 'pk_ncp_bio_9_12'
  | 'pk_pmdc_mbbs'
  | 'pk_uhs_mbbs'
  | 'in_cbse_bio_11_12'
  | 'en_nc_science'
  | 'us_ap_bio'
  | 'cn_moe_bio_2022'
  | 'au_wa_human_bio'
  | 'hms_pathways'
  | 'ox_preclinical'
  | 'qaa_biosciences'
  | 'anat_soc_core';

export interface EducationTrackSpec {
  id: EducationTrackId;
  label: string;
  shortLabel: string;
  stageSummary: string;
  description: string;
  recommendedDomains: EducationDomainId[];
  typicalCurricula: CurriculumAuthorityId[];
}

export interface CurriculumFrameworkSpec {
  id: CurriculumAuthorityId;
  title: string;
  authority: string;
  country: string;
  geographicScope: string;
  url: string;
  academicYearOrVersion: string;
  dateAccessed: string;
  applicableGradesOrYears: string;
  requirementType: 'compulsory' | 'elective_stream' | 'advanced_optional' | 'professional_guideline' | 'institutional_example';
  adoptionNote: string;
  supports: string;
  tracks: EducationTrackId[];
}

export interface CurriculumMappingRef {
  frameworkId: CurriculumAuthorityId;
  gradeOrYear: string;
  unitOrModule: string;
  status: 'compulsory' | 'elective' | 'optional' | 'recommended' | 'institution_specific';
}

export interface EducationSourceRef {
  title: string;
  authority: string;
  url?: string;
  editionOrYear?: string;
  supports: string;
}

export interface AssetDisclosure {
  status: 'available' | 'partial' | 'asset_required' | 'conceptual_diagram_only';
  summary: string;
  missingAssets?: string[];
}

export interface DiagramNode {
  id: string;
  label: string;
  sublabel?: string;
  tone?: 'teal' | 'blue' | 'amber' | 'rose' | 'slate' | 'emerald';
}

export interface TopicDiagramSpec {
  id: string;
  title: string;
  kind: 'pathway' | 'hierarchy' | 'comparison' | 'cycle';
  caption: string;
  disclaimer: string;
  nodes: DiagramNode[];
  links?: { from: string; to: string; label?: string }[];
}

export interface TopicSelfCheckQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  level: EducationTrackId;
}

export interface TopicActivity {
  title: string;
  kind: 'interpretation' | 'case_reasoning' | '3d_inspection' | 'comparison_task' | 'calculation' | 'simulation';
  prompt: string;
  keyTakeaway: string;
}

export interface PlatformLink {
  label: string;
  route: AppRoute;
  systemId?: CanonicalSystemId;
  presentationId?: string;
  note?: string;
}

export interface LevelDepthContent {
  school_foundations?: string;
  secondary_premed?: string;
  medical_foundations?: string;
  clinical_applied?: string;
  allied_health?: string;
  graduate_research?: string;
}

export type ContentCompletionStatus =
  | 'not_started'
  | 'planned'
  | 'in_progress'
  | 'content_drafted'
  | 'source_checked'
  | 'resource_incomplete'
  | 'partially_complete'
  | 'complete_for_core_scope'
  | 'blocked_by_source_availability'
  | 'awaiting_academic_review'
  | 'faculty_reviewed';

export interface ExternalReadingLink {
  id: string;
  title: string;
  authorOrPublisher: string;
  url: string;
  sectionCovered: string;
  level: EducationTrackId | 'multi_level';
  language: string;
  accessType: 'open_access' | 'open_textbook' | 'institutional_or_reference';
  licence: string;
  dateChecked: string;
  topicRelationship: 'primary_reading' | 'supplementary_reading' | 'reference_manual';
  reviewStatus: 'source_checked' | 'pending_review';
}

export interface VideoStoryboardScene {
  sceneNumber: number;
  timecode: string;
  visualCue: string;
  narration: string;
}

export interface VideoLessonEntry {
  id: string;
  kind: 'verified_video' | 'script_storyboard';
  title: string;
  channelOrAuthor: string;
  url?: string;
  coveredTopic: string;
  relevance: string;
  level: EducationTrackId | 'multi_level';
  durationNote: string;
  dateChecked: string;
  availabilityStatus: 'verified' | 'unavailable_fallback_script';
  availabilityNote: string;
  scenes?: VideoStoryboardScene[];
}

export interface ChapterPresentationSlide {
  slideNumber: number;
  slideType:
    | 'title'
    | 'objectives'
    | 'concepts'
    | 'mechanisms'
    | 'visual'
    | 'comparison'
    | 'applied_case'
    | 'knowledge_check'
    | 'summary'
    | 'references';
  title: string;
  subtitle?: string;
  bullets: string[];
  speakerNote: string;
  tableRows?: StructuredComparisonRow[];
  quizPrompt?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface ChapterPresentationDeck {
  id: string;
  chapterId: string;
  title: string;
  level: EducationTrackId | 'multi_level';
  author: string;
  licence: string;
  slideCount: number;
  slides: ChapterPresentationSlide[];
  externalSlideNote?: string;
  externalReferences?: {
    title: string;
    publisher: string;
    url: string;
    licence: string;
    slideCountNote: string;
    dateChecked: string;
  }[];
}

export interface ShortAnswerExercise {
  id: string;
  prompt: string;
  expectedPoints: string[];
  modelAnswer: string;
  level: EducationTrackId;
}

export interface AppliedReasoningExercise {
  id: string;
  title: string;
  scenario: string;
  questions: string[];
  workedSolution: string;
  level: EducationTrackId;
  disclaimer?: string;
}

export interface StructuredComparisonRow {
  dimension: string;
  primary: string;
  comparator: string;
  clinicalOrFunctionalNote: string;
}

export interface ContentCompletionTracker {
  chapterCode: string;
  plannedLearningOutcomes: number;
  completedLearningOutcomes: number;
  writtenMaterialStatus: ContentCompletionStatus;
  readingLinksCount: number;
  readingStatus: ContentCompletionStatus;
  videoCount: number;
  videoStatus: ContentCompletionStatus;
  presentationCount: number;
  presentationStatus: ContentCompletionStatus;
  visualAssetsCount: number;
  visualStatus: ContentCompletionStatus;
  practicalCount: number;
  practicalStatus: ContentCompletionStatus;
  mcqCount: number;
  shortAnswerCount: number;
  appliedCaseCount: number;
  assessmentStatus: ContentCompletionStatus;
  sourceVerification: 'verified_open_sources' | 'partial_sources' | 'pending_source_check';
  licenceVerification: 'open_licensed_or_cited' | 'mixed_terms' | 'pending';
  knownLimitations: string[];
  overallStatus: ContentCompletionStatus;
  reviewStatus: 'awaiting_academic_review';
}

export interface EducationTopic {
  id: string;
  domainId: EducationDomainId;
  chapterCode?: string;
  chapterOrder?: number;
  chapterTitle: string;
  title: string;
  summary: string;
  targetTracks: EducationTrackId[];
  curriculumMappings: CurriculumMappingRef[];
  prerequisites?: string[];
  learningObjectives: string[];
  depthExplanations: LevelDepthContent;
  keyConcepts: { term: string; definition: string }[];
  keyFacts: string[];
  mechanisms?: string[];
  stepByStep?: string[];
  comparisonTable?: {
    columnA: string;
    columnB: string;
    rows: StructuredComparisonRow[];
  };
  misconceptions?: { misconception: string; correction: string }[];
  clinicalCorrelation?: string;
  summaryParagraph?: string;
  keyTakeaways?: string[];
  crossSubjectLinks: { domainId: EducationDomainId; relation: string }[];
  relatedSystems: CanonicalSystemId[];
  relatedFmaConceptIds: string[];
  visualFormats: VisualFormat[];
  diagram?: TopicDiagramSpec;
  assetDisclosure: AssetDisclosure;
  activity?: TopicActivity;
  readingLinks?: ExternalReadingLink[];
  videoResource?: VideoLessonEntry;
  presentationDeck?: ChapterPresentationDeck;
  shortAnswerExercises?: ShortAnswerExercise[];
  appliedReasoningExercises?: AppliedReasoningExercise[];
  selfChecks: TopicSelfCheckQuestion[];
  sources: EducationSourceRef[];
  completionTracker?: ContentCompletionTracker;
  reviewStatus: EducationReviewStatus;
  educationalDisclaimer?: string;
}

export interface EducationDomainSpec {
  id: EducationDomainId;
  code: string;
  title: string;
  shortTitle: string;
  group: 'foundational_biosciences' | 'organ_systems_and_function' | 'disease_and_therapeutics' | 'clinical_and_practice';
  overview: string;
  coverageStatus: CoverageStatus;
  priority: PriorityTier;
  targetTracks: EducationTrackId[];
  recommendedFormats: VisualFormat[];
  relatedSystems: CanonicalSystemId[];
  platformLinks: PlatformLink[];
  assetDisclosure: AssetDisclosure;
  curriculumFrameworks: CurriculumAuthorityId[];
  reviewStatus: EducationReviewStatus;
  educationalDisclaimer?: string;
}
