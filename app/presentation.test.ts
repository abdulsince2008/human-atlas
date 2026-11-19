import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import type { Atlas } from './anatomy';
import { CLINICAL_CASES } from './data/clinical-data';
import { GEOMETRY_PROVENANCE } from './data/provenance-registry';
import {
  BUILTIN_PRESENTATIONS,
  getClinicalCaseExplainerLink,
} from './presentation/builtin-presentations';
import {
  AUTHORITATIVE_BP3D_SOURCE,
  compileStepToSceneState,
  createNewCustomPresentation,
  duplicatePresentationStep,
  exportPresentationToJson,
  getPresentationTotalDuration,
  importPresentationFromJson,
  loadCustomPresentations,
  reorderSteps,
  saveCustomPresentations,
} from './presentation/presentation-engine';
import {
  resolveStepCaption,
  resolveStepNarration,
  validatePresentationSchema,
} from './presentation/presentation-types';
import {
  PresentationVideoRecorder,
  detectSupportedVideoMimeType,
  getVideoRecordingCapability,
} from './presentation/video-recorder';

const atlasPath = path.resolve(process.cwd(), 'public/models/atlas.json');
const atlas: Atlas = JSON.parse(fs.readFileSync(atlasPath, 'utf8'));
const conceptById = new Map(atlas.concepts.map((c) => [c.id, c]));
const clinicalCaseIds = new Set(CLINICAL_CASES.map((c) => c.id));

test('all 5 built-in presentations have unique IDs, reconciled licenses, valid schema, and zero false expert_verified', () => {
  assert.equal(BUILTIN_PRESENTATIONS.length, 5);
  const seenIds = new Set<string>();
  const categories = new Set(BUILTIN_PRESENTATIONS.map((p) => p.category));
  assert.ok(categories.has('anatomical'), 'Missing anatomical presentation');
  assert.ok(categories.has('pathophysiology'), 'Missing pathophysiology presentation');
  assert.ok(categories.has('surgical_education'), 'Missing surgical_education presentation');

  for (const pres of BUILTIN_PRESENTATIONS) {
    assert.ok(!seenIds.has(pres.id), `Duplicate presentation ID: ${pres.id}`);
    seenIds.add(pres.id);

    const res = validatePresentationSchema(pres);
    assert.equal(res.valid, true, `Schema errors for ${pres.id}: ${res.errors.join('; ')}`);
    assert.notEqual(
      pres.reviewStatus,
      'expert_verified',
      `${pres.id} must not claim expert_verified without recorded human review`,
    );
    assert.ok(pres.steps.length >= 5, `${pres.id} should have at least 5 guided steps`);
    assert.ok(pres.scientificDisclosure.length > 20, `${pres.id} must include scientific disclosure`);
    assert.ok(pres.sources.length >= 2, `${pres.id} must cite traceable sources`);
    assert.equal(
      pres.sources[0].license,
      GEOMETRY_PROVENANCE.license,
      `${pres.id} must use reconciled BodyParts3D license from GEOMETRY_PROVENANCE`,
    );
    assert.equal(AUTHORITATIVE_BP3D_SOURCE.license, GEOMETRY_PROVENANCE.license);

    if (pres.relatedClinicalCaseId) {
      assert.ok(
        clinicalCaseIds.has(pres.relatedClinicalCaseId),
        `${pres.id} references unknown clinical case ${pres.relatedClinicalCaseId}`,
      );
    }
  }
});

test('flagship coronary ischemia explainer has 7 structured stages with distinct presenter narration and captions', () => {
  const coronary = BUILTIN_PRESENTATIONS.find(
    (p) => p.id === 'builtin-thorax-coronary-ischemia',
  )!;
  assert.ok(coronary, 'Flagship coronary ischemia presentation must exist');
  assert.equal(coronary.relatedClinicalCaseId, 'case-coronary-lad-septum');
  assert.equal(coronary.steps.length, 7);
  assert.ok(coronary.mechanismProfile, 'Flagship must include ClinicalMechanismProfile');

  const expectedRoles = [
    'normal_anatomy',
    'supply_pathway',
    'mechanism',
    'affected_territory',
    'functional_consequence',
    'clinical_correlation',
    'checkpoint',
  ];
  coronary.steps.forEach((step, idx) => {
    assert.equal(step.stageRole, expectedRoles[idx], `Stage ${idx + 1} role mismatch`);
    assert.ok(step.narrationText && step.narrationText.length > 40, `Stage ${idx + 1} needs presenter narration`);
    assert.ok(step.captionText && step.captionText.length > 20, `Stage ${idx + 1} needs concise caption`);
    assert.notEqual(
      step.narrationText,
      step.captionText,
      `Stage ${idx + 1} presenter script should be distinct from concise on-screen caption`,
    );
    assert.ok(step.keyLearningPoint && step.keyLearningPoint.length > 10, `Stage ${idx + 1} needs key learning point`);
  });

  // Stages 3..7 must explicitly flag conceptual overlays
  for (let i = 2; i < 7; i++) {
    assert.equal(
      coronary.steps[i].isConceptualOverlay,
      true,
      `Stage ${i + 1} must be marked as conceptual overlay`,
    );
  }
  assert.ok(coronary.steps[6].assessmentCheck, 'Stage 7 must include a knowledge checkpoint');
});

test('clinical case association registry links 3 verified cases and honestly discloses coverage gaps for others', () => {
  const coronaryLink = getClinicalCaseExplainerLink('case-coronary-lad-septum');
  assert.equal(coronaryLink.status, 'guided_3d_available');
  assert.equal(coronaryLink.presentationId, 'builtin-thorax-coronary-ischemia');

  const pituitaryLink = getClinicalCaseExplainerLink('case-pituitary-optic-chiasm');
  assert.equal(pituitaryLink.status, 'guided_3d_available');
  assert.equal(pituitaryLink.presentationId, 'builtin-pituitary-optic-chiasm');

  const portalLink = getClinicalCaseExplainerLink('case-hepatic-portal-circulation');
  assert.equal(portalLink.status, 'guided_3d_available');
  assert.equal(portalLink.presentationId, 'builtin-hepatic-portal-mechanism');

  // Unmodeled peripheral nerve cases must be honestly disclosed as requiring more coverage
  const radialLink = getClinicalCaseExplainerLink('case-radial-nerve-spiral-groove');
  assert.equal(radialLink.status, 'requires_more_coverage');
  assert.equal(radialLink.presentationId, undefined);

  const phrenicLink = getClinicalCaseExplainerLink('case-phrenic-diaphragm-ventilation');
  assert.equal(phrenicLink.status, 'requires_more_coverage');
  assert.equal(phrenicLink.presentationId, undefined);
});

test('every FMA concept ID in all 5 built-in presentations resolves to real meshes in atlas.json', () => {
  for (const pres of BUILTIN_PRESENTATIONS) {
    for (const step of pres.steps) {
      for (const cid of step.scene.selectedConceptIds) {
        const concept = conceptById.get(cid);
        assert.ok(concept, `${pres.id}/${step.id}: missing concept ${cid} in atlas.json`);
        assert.ok(
          concept.elements.length > 0,
          `${pres.id}/${step.id}: concept ${cid} has zero 3D meshes`,
        );
      }

      if (step.scene.conceptColorOverrides) {
        for (const cid of Object.keys(step.scene.conceptColorOverrides)) {
          const concept = conceptById.get(cid);
          assert.ok(concept && concept.elements.length > 0, `Invalid color override concept ${cid}`);
        }
      }

      for (const ann of step.annotations) {
        if (ann.anchorConceptId) {
          const concept = conceptById.get(ann.anchorConceptId);
          assert.ok(
            concept && concept.elements.length > 0,
            `${pres.id}/${step.id}: annotation "${ann.label}" references invalid concept ${ann.anchorConceptId}`,
          );
        }
      }
    }
  }
});

test('compileStepToSceneState deterministically compiles all 5 built-in presentations including peeling, clipping, and color overrides', () => {
  for (const pres of BUILTIN_PRESENTATIONS) {
    pres.steps.forEach((step, idx) => {
      const compiled = compileStepToSceneState(step, atlas, idx + 1);
      assert.ok(compiled.visible.length > 0, `${pres.id}/${step.id} must have visible systems`);
      assert.ok(compiled.selected.length > 0, `${pres.id}/${step.id} must select real mesh parts`);
    });
  }

  const coronary = BUILTIN_PRESENTATIONS.find((p) => p.id === 'builtin-thorax-coronary-ischemia')!;
  const stage4 = compileStepToSceneState(coronary.steps[3], atlas, 4);
  assert.ok(
    stage4.partColorOverrides && Object.keys(stage4.partColorOverrides).length > 0,
    'Stage 4 must compile conceptColorOverrides to GPU partColorOverrides',
  );
  const stage5 = compileStepToSceneState(coronary.steps[4], atlas, 5);
  assert.equal(stage5.clipping?.enabled, true);
});

test('timeline editing, v1/v2 JSON import/export backward compatibility, and localStorage persistence work deterministically', () => {
  const custom = createNewCustomPresentation('Custom Thoracic Tour');
  const step2 = duplicatePresentationStep(custom.steps[0]);
  step2.title = 'Scene 2: Deep Mediastinum';
  step2.narrationText = 'Spoken script for scene 2.';
  step2.captionText = 'Concise caption for scene 2.';
  custom.steps.push(step2);

  assert.equal(getPresentationTotalDuration(custom), 16);

  const reordered = reorderSteps(custom.steps, 0, 1);
  assert.equal(reordered[0].title, 'Scene 2: Deep Mediastinum');

  const json = exportPresentationToJson(custom);
  const imported = importPresentationFromJson(json);
  assert.equal(imported.errors.length, 0);
  assert.ok(imported.presentation);
  assert.equal(imported.presentation.title, 'Custom Thoracic Tour');
  assert.equal(imported.presentation.steps[1].narrationText, 'Spoken script for scene 2.');
  assert.equal(imported.presentation.steps[1].captionText, 'Concise caption for scene 2.');

  // Backward compatibility: v1 JSON without narrationText/captionText
  const legacyV1 = JSON.stringify({
    schemaVersion: 1,
    id: 'legacy-v1-test',
    title: 'Legacy V1 Presentation',
    subtitle: 'Old format',
    category: 'anatomical',
    region: 'Thorax',
    summary: 'Legacy test',
    learningObjectives: ['Test'],
    scientificDisclosure: 'Healthy reference anatomy.',
    reviewStatus: 'draft',
    sources: [],
    updatedAt: '2026-01-01T00:00:00.000Z',
    steps: [
      {
        id: 'old-step-1',
        title: 'Old Step 1',
        explanation: 'Legacy explanation text.',
        durationSec: 6,
        camera: { view: 'front' },
        scene: { visibleSystems: ['cardiac'], selectedConceptIds: ['FMA7088'] },
        annotations: [],
      },
    ],
  });
  const legacyImported = importPresentationFromJson(legacyV1);
  assert.equal(legacyImported.errors.length, 0);
  assert.ok(legacyImported.presentation);
  assert.equal(resolveStepCaption(legacyImported.presentation.steps[0]), 'Legacy explanation text.');
  assert.equal(resolveStepNarration(legacyImported.presentation.steps[0]), 'Legacy explanation text.');

  // Invalid JSON rejection
  const bad = importPresentationFromJson('{"title": "Missing fields"}');
  assert.equal(bad.presentation, null);
  assert.ok(bad.errors.length > 0);

  // Mock Storage persistence round-trip
  const mem = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => {
      mem.set(k, v);
    },
  };
  assert.equal(saveCustomPresentations([custom, BUILTIN_PRESENTATIONS[0]], mockStorage), true);
  const loaded = loadCustomPresentations(mockStorage);
  assert.equal(loaded.length, 1, 'Built-in presentations should not be duplicated in custom storage');
  assert.equal(loaded[0].id, custom.id);
});

test('video-recorder negotiates MIME types, handles unsupported environments cleanly, and disposes safely', () => {
  const fakeRecorderCtor = {
    isTypeSupported: (mime: string) => mime === 'video/webm;codecs=vp8,opus',
  } as unknown as typeof MediaRecorder;

  assert.equal(
    detectSupportedVideoMimeType(fakeRecorderCtor),
    'video/webm;codecs=vp8,opus',
  );

  const unsupported = getVideoRecordingCapability({
    hasMediaRecorder: false,
    hasCaptureStream: true,
    hasMediaDevices: false,
  });
  assert.equal(unsupported.supported, false);
  assert.ok(unsupported.reason?.includes('MediaRecorder'));

  const supported = getVideoRecordingCapability({
    hasMediaRecorder: true,
    mediaRecorderCtor: fakeRecorderCtor,
    hasCaptureStream: true,
    hasMediaDevices: true,
  });
  assert.equal(supported.supported, true);
  assert.equal(supported.preferredMimeType, 'video/webm;codecs=vp8,opus');
  assert.equal(supported.fileExtension, 'webm');

  // Dispose on unstarted recorder must not throw
  const recorder = new PresentationVideoRecorder(
    () => null,
    () => ({
      presentationTitle: 'Test',
      stepIndex: 0,
      stepCount: 1,
      stepTitle: 'Step 1',
      explanation: 'Desc',
      annotations: [],
    }),
  );
  assert.doesNotThrow(() => recorder.dispose());
});
