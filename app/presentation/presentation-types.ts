import { SYSTEMS, type Atlas, type ClipAxis, type SystemId, type View } from '../anatomy';
import type { ProvenanceReviewStatus } from '../data/provenance-registry';

/**
 * Anatomy 360 — Clinical Mechanism & Guided 3D Presentation Schema
 *
 * Strongly typed, deterministic, JSON-serializable schema for guided 3D
 * anatomical, clinical mechanism/pathophysiology, and surgical education
 * presentations. Backward compatible with v1 and v2 JSON payloads.
 */

export const PRESENTATION_SCHEMA_VERSION = 2;

export type PresentationCategory =
  | 'anatomical'
  | 'pathophysiology'
  | 'surgical_education';

export type MechanismDomain =
  | 'anatomical_relationships'
  | 'cardiovascular_pathophysiology'
  | 'neurological_pathway'
  | 'vascular_hemodynamics'
  | 'surgical_regional';

export type PresentationDifficulty =
  | 'Foundational / Pre-Medical'
  | 'MBBS / Allied Health'
  | 'Advanced Regional';

export type StepStageRole =
  | 'normal_anatomy'
  | 'supply_pathway'
  | 'mechanism'
  | 'affected_territory'
  | 'functional_consequence'
  | 'clinical_correlation'
  | 'checkpoint';

export interface PresentationSourceReference {
  title: string;
  source: string;
  url?: string;
  license?: string;
  /** Which part of the explanation this reference supports */
  supports?: string;
}

export interface PresentationAnnotation {
  id: string;
  label: string;
  detail?: string;
  /** Optional FMA concept ID grounding the annotation to a real 3D mesh in atlas.json */
  anchorConceptId?: string;
  /** Explicitly marks conceptual notes that do not point to a modeled mesh */
  isConceptual?: boolean;
  /** Semantic accent category for visual distinction */
  tone?: 'landmark' | 'vessel' | 'nerve' | 'clinical' | 'warning';
}

export interface PresentationCameraConfig {
  view: View;
  /** Optional bounding box [min, max] in atlas meters to auto-frame the region */
  focusBounds?: {
    min: [number, number, number];
    max: [number, number, number];
  };
  /** Optional 3D view direction vector [x, y, z] used with focusBounds */
  viewDirection?: [number, number, number];
  autoRotate?: boolean;
}

export interface PresentationSceneConfig {
  /** Visible anatomical mesh systems for this step */
  visibleSystems: SystemId[];
  /** FMA concept IDs to select and highlight in the 3D viewport */
  selectedConceptIds: string[];
  /** Optional surgical region ID from SURGICAL_ANATOMY_REGIONS for progressive layer peeling */
  surgicalRegionId?: string;
  /** Number of superficial layers to peel (0 = intact, 1 = peel first layer, etc.) */
  peeledLayerCount?: number;
  /** Optional explicit FMA concept IDs to hide in this step */
  hiddenConceptIds?: string[];
  /** Isolate selected structures (hide non-selected) */
  isolate?: boolean;
  /** Ghost surrounding non-selected structures to translucent glass */
  ghostSurroundings?: boolean;
  /** Global explode factor [0..1] */
  explode?: number;
  /** Optional cutaway clipping plane */
  clipping?: {
    enabled: boolean;
    axis: ClipAxis;
    offset: number;
    inverted: boolean;
  };
  /** Optional per-concept color highlight overrides (#RRGGBB) for educational/conceptual overlays */
  conceptColorOverrides?: Record<string, string>;
}

export interface PresentationAssessmentCheck {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ClinicalMechanismProfile {
  normalAnatomy: string;
  mechanism: string;
  structuralConsequences: string;
  functionalConsequences: string;
  clinicalCorrelations: string;
  datasetLimitations: string;
}

export interface PresentationStep {
  id: string;
  title: string;
  subtitle?: string;
  explanation: string;
  /** Full spoken teleprompter script for Presenter Mode (distinct from shorter captionText) */
  narrationText?: string;
  /** Concise on-screen caption rendered on stage and composited into recorded video */
  captionText?: string;
  /** Single high-yield educational takeaway for this step */
  keyLearningPoint?: string;
  /** Optional pedagogical stage role in clinical mechanism storytelling */
  stageRole?: StepStageRole;
  /** Marks steps whose 3D visuals include conceptual educational overlays */
  isConceptualOverlay?: boolean;
  /** Display duration in seconds during automatic playback */
  durationSec: number;
  camera: PresentationCameraConfig;
  scene: PresentationSceneConfig;
  annotations: PresentationAnnotation[];
  /** Optional clinical or scientific disclosure banner shown on this step */
  disclosureNote?: string;
  /** Optional step-level supporting references */
  sourceReferences?: PresentationSourceReference[];
  /** Optional step-level scientific review status */
  reviewStatus?: ProvenanceReviewStatus;
  /** Optional interactive self-check embedded at this step */
  assessmentCheck?: PresentationAssessmentCheck;
}

export interface AnatomyPresentation {
  schemaVersion: number;
  id: string;
  title: string;
  subtitle: string;
  category: PresentationCategory;
  /** Domain classification for Clinical Mechanism Library filtering */
  mechanismDomain?: MechanismDomain;
  /** Stable link to CLINICAL_CASES[].id when paired with a clinical case */
  relatedClinicalCaseId?: string;
  region: string;
  targetSystems?: SystemId[];
  difficultyLevel?: PresentationDifficulty;
  summary: string;
  learningObjectives: string[];
  priorKnowledge?: string[];
  /** Structured clinical mechanism breakdown for pathophysiology & clinical explainers */
  mechanismProfile?: ClinicalMechanismProfile;
  /** Mandatory disclosure for conceptual pathophysiology or educational-only surgical demos */
  scientificDisclosure: string;
  reviewStatus: ProvenanceReviewStatus;
  sources: PresentationSourceReference[];
  isBuiltIn?: boolean;
  updatedAt: string;
  steps: PresentationStep[];
}

export interface PresentationValidationResult {
  valid: boolean;
  errors: string[];
}

const VALID_CATEGORIES = new Set<PresentationCategory>([
  'anatomical',
  'pathophysiology',
  'surgical_education',
]);

const VALID_DOMAINS = new Set<MechanismDomain>([
  'anatomical_relationships',
  'cardiovascular_pathophysiology',
  'neurological_pathway',
  'vascular_hemodynamics',
  'surgical_regional',
]);

const VALID_DIFFICULTIES = new Set<PresentationDifficulty>([
  'Foundational / Pre-Medical',
  'MBBS / Allied Health',
  'Advanced Regional',
]);

const VALID_REVIEW_STATUSES = new Set<ProvenanceReviewStatus>([
  'draft',
  'needs_evidence',
  'automated_check_passed',
  'source_reviewed',
  'under_expert_review',
  'expert_verified',
  'needs_revision',
  'deprecated',
]);

const VALID_STAGE_ROLES = new Set<StepStageRole>([
  'normal_anatomy',
  'supply_pathway',
  'mechanism',
  'affected_territory',
  'functional_consequence',
  'clinical_correlation',
  'checkpoint',
]);

const VALID_VIEWS = new Set<View>(['three-quarter', 'front', 'back', 'left', 'right']);

const VALID_CLIP_AXES = new Set<ClipAxis>(['x', 'y', 'z']);

const VALID_SYSTEM_IDS = new Set<SystemId>(SYSTEMS.map((s) => s.id));

function isNonEmptyString(val: unknown): val is string {
  return typeof val === 'string' && val.trim().length > 0;
}

function isVec3(val: unknown): val is [number, number, number] {
  return (
    Array.isArray(val) &&
    val.length === 3 &&
    val.every((n) => typeof n === 'number' && Number.isFinite(n))
  );
}

/**
 * Validates the complete presentation JSON schema (v1 and v2 compatible),
 * reporting exact presentation, step, and field errors.
 */
export function validatePresentationSchema(input: unknown): PresentationValidationResult {
  const errors: string[] = [];

  if (!input || typeof input !== 'object') {
    return { valid: false, errors: ['Presentation payload must be a JSON object.'] };
  }

  const p = input as Record<string, unknown>;
  const presLabel = isNonEmptyString(p.id) ? `Presentation "${p.id}"` : 'Presentation';

  if (
    p.schemaVersion !== undefined &&
    (typeof p.schemaVersion !== 'number' || (p.schemaVersion !== 1 && p.schemaVersion !== 2))
  ) {
    errors.push(`${presLabel}: "schemaVersion" must be 1 or 2.`);
  }
  if (!isNonEmptyString(p.id)) {
    errors.push(`${presLabel}: "id" must be a non-empty string.`);
  }
  if (!isNonEmptyString(p.title)) {
    errors.push(`${presLabel}: "title" must be a non-empty string.`);
  }
  if (typeof p.category !== 'string' || !VALID_CATEGORIES.has(p.category as PresentationCategory)) {
    errors.push(`${presLabel}: "category" must be anatomical, pathophysiology, or surgical_education.`);
  }
  if (
    p.mechanismDomain !== undefined &&
    (typeof p.mechanismDomain !== 'string' ||
      !VALID_DOMAINS.has(p.mechanismDomain as MechanismDomain))
  ) {
    errors.push(`${presLabel}: "mechanismDomain" is invalid.`);
  }
  if (
    p.difficultyLevel !== undefined &&
    (typeof p.difficultyLevel !== 'string' ||
      !VALID_DIFFICULTIES.has(p.difficultyLevel as PresentationDifficulty))
  ) {
    errors.push(`${presLabel}: "difficultyLevel" is invalid.`);
  }
  if (
    p.reviewStatus !== undefined &&
    (typeof p.reviewStatus !== 'string' ||
      !VALID_REVIEW_STATUSES.has(p.reviewStatus as ProvenanceReviewStatus))
  ) {
    errors.push(`${presLabel}: "reviewStatus" is invalid.`);
  }
  if (p.reviewStatus === 'expert_verified') {
    errors.push(
      `${presLabel}: "reviewStatus" cannot be "expert_verified" without recorded human medical-faculty review.`,
    );
  }
  if (!isNonEmptyString(p.summary)) {
    errors.push(`${presLabel}: "summary" must be a non-empty string.`);
  }
  if (p.region !== undefined && !isNonEmptyString(p.region)) {
    errors.push(`${presLabel}: "region" must be a non-empty string when provided.`);
  }
  if (!isNonEmptyString(p.scientificDisclosure)) {
    errors.push(`${presLabel}: "scientificDisclosure" must be a non-empty string.`);
  }

  // Validate sources if present
  if (p.sources !== undefined) {
    if (!Array.isArray(p.sources)) {
      errors.push(`${presLabel}: "sources" must be an array.`);
    } else {
      p.sources.forEach((rawSrc, idx) => {
        if (!rawSrc || typeof rawSrc !== 'object') {
          errors.push(`${presLabel}: sources[${idx}] must be an object.`);
          return;
        }
        const src = rawSrc as Record<string, unknown>;
        if (!isNonEmptyString(src.title)) {
          errors.push(`${presLabel}: sources[${idx}].title must be a non-empty string.`);
        }
        if (!isNonEmptyString(src.source)) {
          errors.push(`${presLabel}: sources[${idx}].source must be a non-empty string.`);
        }
      });
    }
  }

  // Validate mechanismProfile when present
  if (p.mechanismProfile !== undefined) {
    if (!p.mechanismProfile || typeof p.mechanismProfile !== 'object') {
      errors.push(`${presLabel}: "mechanismProfile" must be an object.`);
    } else {
      const mp = p.mechanismProfile as Record<string, unknown>;
      const requiredFields: (keyof ClinicalMechanismProfile)[] = [
        'normalAnatomy',
        'mechanism',
        'structuralConsequences',
        'functionalConsequences',
        'clinicalCorrelations',
        'datasetLimitations',
      ];
      for (const field of requiredFields) {
        if (!isNonEmptyString(mp[field])) {
          errors.push(`${presLabel}: mechanismProfile.${field} must be a non-empty string.`);
        }
      }
    }
  }

  // Validate steps
  if (!Array.isArray(p.steps) || p.steps.length === 0) {
    errors.push(`${presLabel}: "steps" must contain at least one step.`);
  } else {
    const seenStepIds = new Set<string>();
    p.steps.forEach((rawStep, idx) => {
      const stepLabel = `${presLabel} step ${idx + 1}`;
      if (!rawStep || typeof rawStep !== 'object') {
        errors.push(`${stepLabel} must be an object.`);
        return;
      }
      const s = rawStep as Record<string, unknown>;
      if (!isNonEmptyString(s.id)) {
        errors.push(`${stepLabel}: "id" must be a non-empty string.`);
      } else if (seenStepIds.has(s.id)) {
        errors.push(`${stepLabel}: duplicate step id "${s.id}".`);
      } else {
        seenStepIds.add(s.id);
      }

      if (!isNonEmptyString(s.title)) {
        errors.push(`${stepLabel}: "title" must be a non-empty string.`);
      }
      if (!isNonEmptyString(s.explanation)) {
        errors.push(`${stepLabel}: "explanation" must be a non-empty string.`);
      }
      if (
        typeof s.durationSec !== 'number' ||
        !Number.isFinite(s.durationSec) ||
        s.durationSec < 1 ||
        s.durationSec > 120
      ) {
        errors.push(`${stepLabel}: "durationSec" must be a number between 1 and 120.`);
      }
      if (
        s.stageRole !== undefined &&
        (typeof s.stageRole !== 'string' || !VALID_STAGE_ROLES.has(s.stageRole as StepStageRole))
      ) {
        errors.push(`${stepLabel}: "stageRole" is invalid.`);
      }
      if (s.narrationText !== undefined && typeof s.narrationText !== 'string') {
        errors.push(`${stepLabel}: "narrationText" must be a string when provided.`);
      }
      if (s.captionText !== undefined && typeof s.captionText !== 'string') {
        errors.push(`${stepLabel}: "captionText" must be a string when provided.`);
      }
      if (s.keyLearningPoint !== undefined && typeof s.keyLearningPoint !== 'string') {
        errors.push(`${stepLabel}: "keyLearningPoint" must be a string when provided.`);
      }
      if (
        s.reviewStatus !== undefined &&
        (typeof s.reviewStatus !== 'string' ||
          !VALID_REVIEW_STATUSES.has(s.reviewStatus as ProvenanceReviewStatus) ||
          s.reviewStatus === 'expert_verified')
      ) {
        errors.push(`${stepLabel}: "reviewStatus" is invalid or unverified.`);
      }

      // Camera validation
      if (!s.camera || typeof s.camera !== 'object') {
        errors.push(`${stepLabel}: missing "camera" configuration.`);
      } else {
        const cam = s.camera as Record<string, unknown>;
        if (typeof cam.view !== 'string' || !VALID_VIEWS.has(cam.view as View)) {
          errors.push(`${stepLabel}: "camera.view" is invalid.`);
        }
        if (cam.focusBounds !== undefined) {
          const fb = cam.focusBounds as Record<string, unknown>;
          if (!fb || typeof fb !== 'object' || !isVec3(fb.min) || !isVec3(fb.max)) {
            errors.push(`${stepLabel}: "camera.focusBounds" must have numeric [x,y,z] min and max.`);
          }
        }
        if (cam.viewDirection !== undefined && !isVec3(cam.viewDirection)) {
          errors.push(`${stepLabel}: "camera.viewDirection" must be a numeric [x,y,z] tuple.`);
        }
      }

      // Scene validation
      if (!s.scene || typeof s.scene !== 'object') {
        errors.push(`${stepLabel}: missing "scene" configuration.`);
      } else {
        const sc = s.scene as Record<string, unknown>;
        if (!Array.isArray(sc.visibleSystems) || sc.visibleSystems.length === 0) {
          errors.push(`${stepLabel}: "scene.visibleSystems" must be a non-empty array.`);
        } else {
          for (const sysId of sc.visibleSystems) {
            if (typeof sysId !== 'string' || !VALID_SYSTEM_IDS.has(sysId as SystemId)) {
              errors.push(`${stepLabel}: unknown anatomical system "${String(sysId)}" in scene.visibleSystems.`);
            }
          }
        }
        if (!Array.isArray(sc.selectedConceptIds)) {
          errors.push(`${stepLabel}: "scene.selectedConceptIds" must be an array.`);
        }
        if (sc.clipping && typeof sc.clipping === 'object') {
          const clip = sc.clipping as Record<string, unknown>;
          if (typeof clip.axis === 'string' && !VALID_CLIP_AXES.has(clip.axis as ClipAxis)) {
            errors.push(`${stepLabel}: "scene.clipping.axis" must be x, y, or z.`);
          }
        }
      }

      // Annotations validation
      if (!Array.isArray(s.annotations)) {
        errors.push(`${stepLabel}: "annotations" must be an array.`);
      } else {
        s.annotations.forEach((rawAnn, aIdx) => {
          if (!rawAnn || typeof rawAnn !== 'object') {
            errors.push(`${stepLabel}: annotations[${aIdx}] must be an object.`);
            return;
          }
          const ann = rawAnn as Record<string, unknown>;
          if (!isNonEmptyString(ann.id)) {
            errors.push(`${stepLabel}: annotations[${aIdx}].id must be a non-empty string.`);
          }
          if (!isNonEmptyString(ann.label)) {
            errors.push(`${stepLabel}: annotations[${aIdx}].label must be a non-empty string.`);
          }
        });
      }

      // Knowledge check validation
      if (s.assessmentCheck !== undefined) {
        if (!s.assessmentCheck || typeof s.assessmentCheck !== 'object') {
          errors.push(`${stepLabel}: "assessmentCheck" must be an object.`);
        } else {
          const qc = s.assessmentCheck as Record<string, unknown>;
          if (!isNonEmptyString(qc.question)) {
            errors.push(`${stepLabel}: assessmentCheck.question must be a non-empty string.`);
          }
          if (!isNonEmptyString(qc.explanation)) {
            errors.push(`${stepLabel}: assessmentCheck.explanation must be a non-empty string.`);
          }
          if (!Array.isArray(qc.options) || qc.options.length < 2) {
            errors.push(`${stepLabel}: assessmentCheck.options must contain at least 2 options.`);
          } else {
            qc.options.forEach((opt, oIdx) => {
              if (!isNonEmptyString(opt)) {
                errors.push(`${stepLabel}: assessmentCheck.options[${oIdx}] must be non-empty.`);
              }
            });
            if (
              typeof qc.correctIndex !== 'number' ||
              !Number.isInteger(qc.correctIndex) ||
              qc.correctIndex < 0 ||
              qc.correctIndex >= qc.options.length
            ) {
              errors.push(
                `${stepLabel}: assessmentCheck.correctIndex must be an integer within options bounds.`,
              );
            }
          }
        }
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates that every anatomical FMA concept ID, color override, annotation anchor,
 * and optional clinical case reference in a presentation exists and resolves to real
 * mesh elements in atlas.json.
 */
export function validatePresentationAgainstAtlas(
  presentation: AnatomyPresentation,
  atlas: Atlas,
  validClinicalCaseIds?: ReadonlySet<string>,
): PresentationValidationResult {
  const errors: string[] = [];
  const conceptById = new Map(atlas.concepts.map((c) => [c.id, c]));

  if (
    presentation.relatedClinicalCaseId &&
    validClinicalCaseIds &&
    !validClinicalCaseIds.has(presentation.relatedClinicalCaseId)
  ) {
    errors.push(
      `Presentation "${presentation.id}": relatedClinicalCaseId "${presentation.relatedClinicalCaseId}" does not match any clinical case.`,
    );
  }

  presentation.steps.forEach((step, idx) => {
    const stepLabel = `Presentation "${presentation.id}" step ${idx + 1} ("${step.id}")`;

    for (const cid of step.scene.selectedConceptIds) {
      const concept = conceptById.get(cid);
      if (!concept) {
        errors.push(`${stepLabel}: selectedConceptId "${cid}" does not exist in atlas.json.`);
      } else if (concept.elements.length === 0) {
        errors.push(`${stepLabel}: selectedConceptId "${cid}" has no 3D mesh elements in atlas.json.`);
      }
    }

    for (const cid of step.scene.hiddenConceptIds ?? []) {
      const concept = conceptById.get(cid);
      if (!concept || concept.elements.length === 0) {
        errors.push(`${stepLabel}: hiddenConceptId "${cid}" does not resolve to any atlas mesh.`);
      }
    }

    if (step.scene.conceptColorOverrides) {
      for (const cid of Object.keys(step.scene.conceptColorOverrides)) {
        const concept = conceptById.get(cid);
        if (!concept || concept.elements.length === 0) {
          errors.push(
            `${stepLabel}: conceptColorOverrides key "${cid}" does not resolve to any atlas mesh.`,
          );
        }
      }
    }

    step.annotations.forEach((ann) => {
      if (ann.anchorConceptId) {
        const concept = conceptById.get(ann.anchorConceptId);
        if (!concept || concept.elements.length === 0) {
          errors.push(
            `${stepLabel}: annotation "${ann.label}" anchorConceptId "${ann.anchorConceptId}" does not resolve to any atlas mesh.`,
          );
        }
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Helper resolving the concise on-screen caption text for a step,
 * preserving backward compatibility with v1 presentations that only set `explanation`.
 */
export function resolveStepCaption(step: PresentationStep): string {
  return step.captionText && step.captionText.trim().length > 0
    ? step.captionText.trim()
    : step.explanation;
}

/**
 * Helper resolving the spoken presenter teleprompter script for a step.
 */
export function resolveStepNarration(step: PresentationStep): string {
  return step.narrationText && step.narrationText.trim().length > 0
    ? step.narrationText.trim()
    : step.explanation;
}
