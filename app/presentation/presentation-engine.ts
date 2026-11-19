import type { Atlas, SceneState } from '../anatomy';
import { GEOMETRY_PROVENANCE } from '../data/provenance-registry';
import {
  SURGICAL_ANATOMY_REGIONS,
  resolveSurgicalRegionLayers,
} from '../data/surgical-anatomy';
import {
  PRESENTATION_SCHEMA_VERSION,
  validatePresentationAgainstAtlas,
  validatePresentationSchema,
  type AnatomyPresentation,
  type PresentationSourceReference,
  type PresentationStep,
} from './presentation-types';

export const PRESENTATIONS_STORAGE_KEY = 'anatomy360.presentations.v1';

/**
 * Centralized, reconciled BodyParts3D 4.0 attribution sourced directly from
 * GEOMETRY_PROVENANCE in app/data/provenance-registry.ts.
 */
export const AUTHORITATIVE_BP3D_SOURCE: PresentationSourceReference = {
  title: `${GEOMETRY_PROVENANCE.name} ${GEOMETRY_PROVENANCE.version}`,
  source: GEOMETRY_PROVENANCE.authority,
  url: GEOMETRY_PROVENANCE.url,
  license: GEOMETRY_PROVENANCE.license,
  supports: '3D adult male anatomical reference surface meshes and FMA concept alignment',
};

/**
 * Resolves a list of FMA concept IDs into real mesh part IDs present in atlas.json.
 */
export function resolveConceptIdsToPartIds(
  atlas: Atlas,
  conceptIds: string[],
): string[] {
  if (conceptIds.length === 0) return [];
  const conceptMap = new Map(atlas.concepts.map((c) => [c.id, c]));
  const partSet = new Set<string>();

  for (const cid of conceptIds) {
    const concept = conceptMap.get(cid);
    if (concept && concept.elements.length > 0) {
      for (const pid of concept.elements) {
        partSet.add(pid);
      }
    }
  }
  return [...partSet];
}

/**
 * Deterministically compiles a PresentationStep into a SceneState directly
 * consumable by the existing AnatomyScene WebGL renderer.
 */
export function compileStepToSceneState(
  step: PresentationStep,
  atlas: Atlas,
  focusRequestCounter: number,
  options?: {
    qualityPreset?: SceneState['qualityPreset'];
  },
): SceneState {
  const selectedPartIds = resolveConceptIdsToPartIds(
    atlas,
    step.scene.selectedConceptIds,
  );

  const hiddenSet = new Set<string>(
    resolveConceptIdsToPartIds(atlas, step.scene.hiddenConceptIds ?? []),
  );

  let derivedFocusBounds = step.camera.focusBounds;
  let derivedViewDirection = step.camera.viewDirection;

  // Apply progressive surgical layer peeling if configured
  if (step.scene.surgicalRegionId) {
    const region = SURGICAL_ANATOMY_REGIONS.find(
      (r) => r.id === step.scene.surgicalRegionId,
    );
    if (region) {
      if (!derivedFocusBounds) {
        derivedFocusBounds = region.focusBounds;
      }
      if (!derivedViewDirection) {
        derivedViewDirection = region.recommendedViewDirection;
      }
      const peelCount = Math.max(0, step.scene.peeledLayerCount ?? 0);
      if (peelCount > 0) {
        const resolvedLayers = resolveSurgicalRegionLayers(region, atlas);
        for (let i = 0; i < Math.min(peelCount, resolvedLayers.length); i++) {
          for (const pid of resolvedLayers[i].partIds) {
            hiddenSet.add(pid);
          }
        }
      }
    }
  }

  // Never hide explicitly selected structures
  for (const pid of selectedPartIds) {
    hiddenSet.delete(pid);
  }

  // Compile per-concept educational color overrides into per-part GPU overrides
  let partColorOverrides: Record<string, string> | undefined;
  if (
    step.scene.conceptColorOverrides &&
    Object.keys(step.scene.conceptColorOverrides).length > 0
  ) {
    const overrides: Record<string, string> = {};
    for (const [conceptId, hex] of Object.entries(
      step.scene.conceptColorOverrides,
    )) {
      const pids = resolveConceptIdsToPartIds(atlas, [conceptId]);
      for (const pid of pids) {
        overrides[pid] = hex;
      }
    }
    if (Object.keys(overrides).length > 0) {
      partColorOverrides = overrides;
    }
  }

  return {
    embedded: true,
    inspectorOpen: false,
    visible: [...step.scene.visibleSystems],
    selected: selectedPartIds,
    isolate: Boolean(step.scene.isolate && selectedPartIds.length > 0),
    ghostSurroundings: Boolean(
      step.scene.ghostSurroundings && selectedPartIds.length > 0,
    ),
    hiddenPartIds: hiddenSet.size > 0 ? [...hiddenSet] : undefined,
    explode: Math.max(0, Math.min(1, step.scene.explode ?? 0)),
    view: step.camera.view,
    rotate: Boolean(step.camera.autoRotate),
    reset: 0,
    clipping: step.scene.clipping
      ? { ...step.scene.clipping }
      : { enabled: false, axis: 'x', offset: 0.5, inverted: false },
    partColorOverrides,
    qualityPreset: options?.qualityPreset ?? 'balanced',
    focusBox: derivedFocusBounds
      ? {
          min: [...derivedFocusBounds.min] as [number, number, number],
          max: [...derivedFocusBounds.max] as [number, number, number],
          request: focusRequestCounter,
          viewDirection: derivedViewDirection
            ? ([...derivedViewDirection] as [number, number, number])
            : undefined,
        }
      : null,
  };
}

export function getPresentationTotalDuration(
  presentation: AnatomyPresentation,
): number {
  return presentation.steps.reduce((acc, s) => acc + Math.max(1, s.durationSec), 0);
}

export function reorderSteps(
  steps: PresentationStep[],
  fromIndex: number,
  toIndex: number,
): PresentationStep[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= steps.length ||
    toIndex >= steps.length ||
    fromIndex === toIndex
  ) {
    return steps;
  }
  const next = [...steps];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function duplicatePresentationStep(
  step: PresentationStep,
): PresentationStep {
  return {
    ...step,
    id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: `${step.title} (Copy)`,
    camera: {
      ...step.camera,
      focusBounds: step.camera.focusBounds
        ? {
            min: [...step.camera.focusBounds.min] as [number, number, number],
            max: [...step.camera.focusBounds.max] as [number, number, number],
          }
        : undefined,
      viewDirection: step.camera.viewDirection
        ? ([...step.camera.viewDirection] as [number, number, number])
        : undefined,
    },
    scene: {
      ...step.scene,
      visibleSystems: [...step.scene.visibleSystems],
      selectedConceptIds: [...step.scene.selectedConceptIds],
      hiddenConceptIds: step.scene.hiddenConceptIds
        ? [...step.scene.hiddenConceptIds]
        : undefined,
      clipping: step.scene.clipping ? { ...step.scene.clipping } : undefined,
      conceptColorOverrides: step.scene.conceptColorOverrides
        ? { ...step.scene.conceptColorOverrides }
        : undefined,
    },
    annotations: step.annotations.map((a) => ({
      ...a,
      id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    })),
  };
}

export function createBlankStep(stepNumber: number): PresentationStep {
  return {
    id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: `Scene ${stepNumber}: Anatomical Overview`,
    explanation:
      'Describe the anatomical structures, spatial relationships, or clinical correlation highlighted in this step.',
    captionText: 'Overview of the highlighted anatomical structures in 3D context.',
    narrationText:
      'In this scene, orient your learners to the primary anatomical structures and their surrounding spatial landmarks.',
    keyLearningPoint: 'Identify the primary anatomical landmarks in three-dimensional context.',
    durationSec: 8,
    camera: {
      view: 'three-quarter',
      autoRotate: false,
    },
    scene: {
      visibleSystems: ['skeletal', 'muscular', 'cardiac', 'arterial', 'venous', 'nervous', 'respiratory'],
      selectedConceptIds: [],
      explode: 0,
      isolate: false,
      ghostSurroundings: false,
    },
    annotations: [],
  };
}

export function createNewCustomPresentation(title?: string): AnatomyPresentation {
  const now = new Date().toISOString();
  return {
    schemaVersion: PRESENTATION_SCHEMA_VERSION,
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: title?.trim() || 'Untitled 3D Anatomy Presentation',
    subtitle: 'Custom Guided 3D Sequence',
    category: 'anatomical',
    mechanismDomain: 'anatomical_relationships',
    region: 'Whole Body / Custom',
    difficultyLevel: 'Foundational / Pre-Medical',
    summary: 'Author-created guided 3D anatomical sequence using BodyParts3D 4.0 meshes.',
    learningObjectives: [
      'Identify key 3D anatomical landmarks and spatial relationships.',
    ],
    scientificDisclosure:
      'Custom educational presentation created in Anatomy 360 using BodyParts3D 4.0 reference anatomy.',
    reviewStatus: 'draft',
    sources: [AUTHORITATIVE_BP3D_SOURCE],
    isBuiltIn: false,
    updatedAt: now,
    steps: [createBlankStep(1)],
  };
}

export function exportPresentationToJson(
  presentation: AnatomyPresentation,
): string {
  const exportPayload: AnatomyPresentation = {
    ...presentation,
    schemaVersion: PRESENTATION_SCHEMA_VERSION,
    isBuiltIn: false,
    updatedAt: new Date().toISOString(),
  };
  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Imports and migrates v1 or v2 presentation JSON payloads safely,
 * validating both schema structure and (when atlas is provided) FMA mesh identity.
 */
export function importPresentationFromJson(
  jsonText: string,
  options?: {
    atlas?: Atlas | null;
    validClinicalCaseIds?: ReadonlySet<string>;
  },
): {
  presentation: AnatomyPresentation | null;
  errors: string[];
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    return {
      presentation: null,
      errors: [
        `Invalid JSON syntax: ${err instanceof Error ? err.message : 'Unable to parse file.'}`,
      ],
    };
  }

  const validation = validatePresentationSchema(parsed);
  if (!validation.valid) {
    return { presentation: null, errors: validation.errors };
  }

  const raw = parsed as AnatomyPresentation;

  if (options?.atlas) {
    const atlasValidation = validatePresentationAgainstAtlas(
      raw,
      options.atlas,
      options.validClinicalCaseIds,
    );
    if (!atlasValidation.valid) {
      return { presentation: null, errors: atlasValidation.errors };
    }
  }

  const imported: AnatomyPresentation = {
    ...raw,
    schemaVersion: PRESENTATION_SCHEMA_VERSION,
    isBuiltIn: false,
    id: raw.id.startsWith('builtin-')
      ? `imported-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      : raw.id,
    updatedAt: new Date().toISOString(),
  };

  return { presentation: imported, errors: [] };
}

export function loadCustomPresentations(
  storage?: Pick<Storage, 'getItem'>,
): AnatomyPresentation[] {
  const store =
    storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!store) return [];
  try {
    const raw = store.getItem(PRESENTATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => validatePresentationSchema(item).valid);
  } catch {
    return [];
  }
}

export function saveCustomPresentations(
  presentations: AnatomyPresentation[],
  storage?: Pick<Storage, 'setItem'>,
): boolean {
  const store =
    storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!store) return false;
  try {
    const clean = presentations.filter((p) => !p.isBuiltIn);
    store.setItem(PRESENTATIONS_STORAGE_KEY, JSON.stringify(clean));
    return true;
  } catch {
    return false;
  }
}
