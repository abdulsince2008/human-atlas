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
  kind: 'interpretation' | 'case_reasoning' | '3d_inspection' | 'comparison_task' | 'calculation';
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

export interface EducationTopic {
  id: string;
  domainId: EducationDomainId;
  chapterTitle: string;
  title: string;
  summary: string;
  targetTracks: EducationTrackId[];
  curriculumMappings: CurriculumMappingRef[];
  learningObjectives: string[];
  depthExplanations: LevelDepthContent;
  keyConcepts: { term: string; definition: string }[];
  keyFacts: string[];
  crossSubjectLinks: { domainId: EducationDomainId; relation: string }[];
  relatedSystems: CanonicalSystemId[];
  relatedFmaConceptIds: string[];
  visualFormats: VisualFormat[];
  diagram?: TopicDiagramSpec;
  assetDisclosure: AssetDisclosure;
  activity?: TopicActivity;
  selfChecks: TopicSelfCheckQuestion[];
  sources: EducationSourceRef[];
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
