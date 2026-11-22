import type { EducationDomainId } from '../education/education-types';
import type { RegistryCoverageStatus, RegistryReviewStatus } from '../registry/registry-types';

export type MappingConfidence = 'exact' | 'high' | 'suggested' | 'manual';

export type SyllabusCoverageCategory =
  | 'available'
  | 'partially_available'
  | 'not_available_yet';

export interface CustomSyllabusMetadata {
  country: string;
  institution: string;
  programme: string;
  degree: string;
  yearOrSemester: string;
  courseName: string;
}

export interface SyllabusItemMapping {
  registryTopicId: string;
  domainId: EducationDomainId;
  title: string;
  confidence: MappingConfidence;
  matchReason: string;
  confirmed: boolean;
}

export interface CustomSyllabusItem {
  id: string;
  rawLine: string;
  title: string;
  unit?: string;
  keywords: string[];
  mappings: SyllabusItemMapping[];
  ignored?: boolean;
}

export interface CustomSyllabusProfile {
  id: string;
  createdAt: number;
  updatedAt: number;
  sourceFormat: 'manual' | 'paste' | 'file';
  metadata: CustomSyllabusMetadata;
  items: CustomSyllabusItem[];
}

export interface ParsedSyllabusDraftItem {
  id: string;
  rawLine: string;
  title: string;
  unit?: string;
}

export interface SyllabusItemReportRow {
  itemId: string;
  title: string;
  unit?: string;
  category: SyllabusCoverageCategory;
  needsAcademicReview: boolean;
  hasUnconfirmedSuggestions: boolean;
  mappedTopicStatuses: {
    topicId: string;
    title: string;
    domainId: EducationDomainId;
    coverageStatus: RegistryCoverageStatus;
    reviewStatus: RegistryReviewStatus;
    confidence: MappingConfidence;
    confirmed: boolean;
  }[];
  explanation: string;
}

export interface SyllabusCoverageReport {
  totalItems: number;
  activeItems: number;
  availableCount: number;
  partiallyAvailableCount: number;
  notAvailableYetCount: number;
  needsAcademicReviewCount: number;
  unconfirmedCount: number;
  availablePct: number;
  partialOrBetterPct: number;
  notAvailablePct: number;
  disclaimer: string;
  rows: SyllabusItemReportRow[];
}
