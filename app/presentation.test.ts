import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import type { Atlas } from './anatomy';
import { BUILTIN_PRESENTATIONS } from './presentation/builtin-presentations';
import {
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
import { validatePresentationSchema } from './presentation/presentation-types';
import {
  PresentationVideoRecorder,
  detectSupportedVideoMimeType,
  getVideoRecordingCapability,
} from './presentation/video-recorder';

const atlasPath = path.resolve(process.cwd(), 'public/models/atlas.json');
const atlas: Atlas = JSON.parse(fs.readFileSync(atlasPath, 'utf8'));
const conceptById = new Map(atlas.concepts.map((c) => [c.id, c]));

test('all 3 built-in presentations cover required categories and pass schema validation', () => {
  assert.equal(BUILTIN_PRESENTATIONS.length, 3);
  const categories = new Set(BUILTIN_PRESENTATIONS.map((p) => p.category));
  assert.ok(categories.has('anatomical'), 'Missing anatomical presentation');
  assert.ok(categories.has('pathophysiology'), 'Missing pathophysiology presentation');
  assert.ok(categories.has('surgical_education'), 'Missing surgical_education presentation');

  for (const pres of BUILTIN_PRESENTATIONS) {
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
  }
});

test('every FMA concept ID in all built-in presentations resolves to real meshes in atlas.json', () => {
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

test('compileStepToSceneState deterministically produces valid SceneState with peeling, clipping, and color overrides', () => {
  const cranial = BUILTIN_PRESENTATIONS.find((p) => p.id === 'builtin-cranial-dissection')!;
  const peeledStep = cranial.steps[1];
  const scenePeeled = compileStepToSceneState(peeledStep, atlas, 1);
  assert.ok(scenePeeled.selected.length > 0, 'Cranial step 2 should select brain meshes');
  assert.ok(
    (scenePeeled.hiddenPartIds?.length ?? 0) > 0,
    'Cranial step 2 should peel calvarial bone meshes',
  );
  assert.ok(scenePeeled.focusBox, 'Cranial step 2 should compute focusBox');

  const cutawayStep = cranial.steps[3];
  const sceneCutaway = compileStepToSceneState(cutawayStep, atlas, 2);
  assert.equal(sceneCutaway.clipping?.enabled, true);
  assert.equal(sceneCutaway.clipping?.axis, 'x');

  const coronary = BUILTIN_PRESENTATIONS.find((p) => p.id === 'builtin-thorax-coronary-ischemia')!;
  const ischemiaStep = coronary.steps[4];
  const sceneIschemia = compileStepToSceneState(ischemiaStep, atlas, 3);
  assert.ok(
    sceneIschemia.partColorOverrides && Object.keys(sceneIschemia.partColorOverrides).length > 0,
    'Pathophysiology step should compile conceptColorOverrides to GPU partColorOverrides',
  );
});

test('timeline editing, JSON import/export round-trip, and localStorage persistence work deterministically', () => {
  const custom = createNewCustomPresentation('Custom Thoracic Tour');
  const step2 = duplicatePresentationStep(custom.steps[0]);
  step2.title = 'Scene 2: Deep Mediastinum';
  custom.steps.push(step2);

  assert.equal(getPresentationTotalDuration(custom), 16);

  const reordered = reorderSteps(custom.steps, 0, 1);
  assert.equal(reordered[0].title, 'Scene 2: Deep Mediastinum');

  const json = exportPresentationToJson(custom);
  const imported = importPresentationFromJson(json);
  assert.equal(imported.errors.length, 0);
  assert.ok(imported.presentation);
  assert.equal(imported.presentation.title, 'Custom Thoracic Tour');
  assert.equal(imported.presentation.steps.length, 2);

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
