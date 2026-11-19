import type { ClipAxis, SystemId, View } from '../anatomy';
import type { ProvenanceReviewStatus } from '../data/provenance-registry';

/**
 * Anatomy 360 — Guided 3D Presentation & Video Studio Schema
 *
 * Strongly typed, deterministic, JSON-serializable schema for guided 3D
 * anatomical, pathophysiology, and surgical education presentations.
 */

export const PRESENTATION_SCHEMA_VERSION = 1;

export type PresentationCategory =
  | 'anatomical'
  | 'pathophysiology'
  | 'surgical_education';

export interface PresentationSourceReference {
  title: string;
  source: string;
  url?: string;
  license?: string;
}

export interface PresentationAnnotation {
  id: string;
  label: string;
  detail?: string;
  /** Optional FMA concept ID used to ground the annotation to a real 3D structure */
  anchorConceptId?: string;
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

export interface PresentationStep {
  id: string;
  title: string;
  subtitle?: string;
  explanation: string;
  /** Display duration in seconds during automatic playback */
  durationSec: number;
  camera: PresentationCameraConfig;
  scene: PresentationSceneConfig;
  annotations: PresentationAnnotation[];
  /** Optional clinical or scientific disclosure banner shown on this step */
  disclosureNote?: string;
  /** Optional interactive self-check embedded at this step */
  assessmentCheck?: PresentationAssessmentCheck;
}

export interface AnatomyPresentation {
  schemaVersion: number;
  id: string;
  title: string;
  subtitle: string;
  category: PresentationCategory;
  region: string;
  summary: string;
  learningObjectives: string[];
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

const VALID_VIEWS = new Set<View>(['three-quarter', 'front', 'back', 'left', 'right']);

const VALID_CLIP_AXES = new Set<ClipAxis>(['x', 'y', 'z']);

export function validatePresentationSchema(input: unknown): PresentationValidationResult {
  const errors: string[] = [];

  if (!input || typeof input !== 'object') {
    return { valid: false, errors: ['Presentation payload must be a JSON object.'] };
  }

  const p = input as Record<string, unknown>;

  if (typeof p.id !== 'string' || p.id.trim().length === 0) {
    errors.push('Presentation "id" must be a non-empty string.');
  }
  if (typeof p.title !== 'string' || p.title.trim().length === 0) {
    errors.push('Presentation "title" must be a non-empty string.');
  }
  if (typeof p.category !== 'string' || !VALID_CATEGORIES.has(p.category as PresentationCategory)) {
    errors.push('Presentation "category" must be anatomical, pathophysiology, or surgical_education.');
  }
  if (typeof p.summary !== 'string' || p.summary.trim().length === 0) {
    errors.push('Presentation "summary" must be a non-empty string.');
  }
  if (typeof p.scientificDisclosure !== 'string' || p.scientificDisclosure.trim().length === 0) {
    errors.push('Presentation "scientificDisclosure" must be a non-empty string.');
  }
  if (!Array.isArray(p.steps) || p.steps.length === 0) {
    errors.push('Presentation must contain at least one step in "steps".');
  } else {
    p.steps.forEach((rawStep, idx) => {
      if (!rawStep || typeof rawStep !== 'object') {
        errors.push(`Step ${idx + 1} must be an object.`);
        return;
      }
      const s = rawStep as Record<string, unknown>;
      if (typeof s.id !== 'string' || s.id.trim().length === 0) {
        errors.push(`Step ${idx + 1} is missing a valid "id".`);
      }
      if (typeof s.title !== 'string' || s.title.trim().length === 0) {
        errors.push(`Step ${idx + 1} is missing a valid "title".`);
      }
      if (typeof s.explanation !== 'string' || s.explanation.trim().length === 0) {
        errors.push(`Step ${idx + 1} is missing a valid "explanation".`);
      }
      if (typeof s.durationSec !== 'number' || !Number.isFinite(s.durationSec) || s.durationSec < 1 || s.durationSec > 120) {
        errors.push(`Step ${idx + 1} "durationSec" must be a number between 1 and 120.`);
      }
      if (!s.camera || typeof s.camera !== 'object') {
        errors.push(`Step ${idx + 1} is missing "camera" configuration.`);
      } else {
        const cam = s.camera as Record<string, unknown>;
        if (typeof cam.view !== 'string' || !VALID_VIEWS.has(cam.view as View)) {
          errors.push(`Step ${idx + 1} "camera.view" is invalid.`);
        }
      }
      if (!s.scene || typeof s.scene !== 'object') {
        errors.push(`Step ${idx + 1} is missing "scene" configuration.`);
      } else {
        const sc = s.scene as Record<string, unknown>;
        if (!Array.isArray(sc.visibleSystems) || sc.visibleSystems.length === 0) {
          errors.push(`Step ${idx + 1} "scene.visibleSystems" must be a non-empty array.`);
        }
        if (!Array.isArray(sc.selectedConceptIds)) {
          errors.push(`Step ${idx + 1} "scene.selectedConceptIds" must be an array.`);
        }
        if (sc.clipping && typeof sc.clipping === 'object') {
          const clip = sc.clipping as Record<string, unknown>;
          if (typeof clip.axis === 'string' && !VALID_CLIP_AXES.has(clip.axis as ClipAxis)) {
            errors.push(`Step ${idx + 1} "scene.clipping.axis" must be x, y, or z.`);
          }
        }
      }
      if (!Array.isArray(s.annotations)) {
        errors.push(`Step ${idx + 1} "annotations" must be an array.`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
