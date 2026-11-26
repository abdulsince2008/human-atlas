import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import type { Atlas } from './anatomy';
import {
  getActiveConceptsForSex,
  getActivePartsForSex,
  type FemaleAtlasManifest,
  type OverlayManifest,
} from './atlas-layers';
import { CLINICAL_CASES } from './data/clinical-data';
import { HISTOLOGY_ENTRIES } from './data/histology-data';
import { PHYSIOLOGY_MODULES } from './data/physiology-data';
import { STUDY_RESOURCES } from './data/study-resources';
import { VERIFIED_YOUTUBE_VIDEOS } from './data/video-resources';
import { VERIFIED_RELATIONSHIPS } from './knowledge-graph';
import { BUILTIN_PRESENTATIONS } from './presentation/builtin-presentations';
import { QUIZ_QUESTIONS } from './quiz-data';
import {
  encodeStudyContextHash,
  parseStudyContextFromHash,
  resolveStudyContext,
} from './study-context-engine';

const baseAtlas = JSON.parse(
  fs.readFileSync(path.resolve('public/models/atlas.json'), 'utf8'),
) as Atlas;
const sharedOverlay = JSON.parse(
  fs.readFileSync(path.resolve('public/models/shared/shared-enhancements.json'), 'utf8'),
) as OverlayManifest;
const maleOverlay = JSON.parse(
  fs.readFileSync(path.resolve('public/models/male/male-enhancements.json'), 'utf8'),
) as OverlayManifest;
const femaleOverlay = JSON.parse(
  fs.readFileSync(path.resolve('public/models/female/female-atlas.json'), 'utf8'),
) as FemaleAtlasManifest;

const effectiveMaleAtlas: Atlas = {
  ...baseAtlas,
  sex: 'male',
  parts: getActivePartsForSex(baseAtlas, null, 'male', { shared: sharedOverlay, male: maleOverlay }),
  concepts: getActiveConceptsForSex(baseAtlas, null, 'male', { shared: sharedOverlay, male: maleOverlay }),
};

const effectiveFemaleAtlas: Atlas = {
  ...baseAtlas,
  sex: 'female',
  parts: getActivePartsForSex(baseAtlas, femaleOverlay, 'female', { shared: sharedOverlay }),
  concepts: getActiveConceptsForSex(baseAtlas, femaleOverlay, 'female', { shared: sharedOverlay }),
};

test('resolveStudyContext resolves FMA7088 (Heart) with 3D parts, relationships, MCQs without duplicates, readings, and verified videos', () => {
  const ctx = resolveStudyContext({ conceptId: 'FMA7088', sex: 'male' }, effectiveMaleAtlas);

  assert.equal(ctx.canonicalConceptId, 'FMA7088');
  assert.equal(ctx.in3DModel, true);
  assert.ok(ctx.matchedPartIds.length > 0, 'Expected matched 3D part IDs for FMA7088');
  assert.equal(ctx.coverage.mesh3D, 'available');
  assert.ok(
    ctx.relationships.outgoing.length + ctx.relationships.incoming.length > 0 ||
      ctx.relationships.fallbackRelated.length > 0,
    'Expected anatomical relationships for FMA7088',
  );
  assert.ok(ctx.mcqs.length > 0, 'Expected MCQs for FMA7088');
  const mcqIds = ctx.mcqs.map((m) => m.id);
  assert.equal(new Set(mcqIds).size, mcqIds.length, 'MCQ IDs must be deduplicated');
  assert.ok(ctx.externalResources.length > 0, 'Expected curated open readings for FMA7088');
  assert.ok(ctx.videoResources.length > 0, 'Expected verified YouTube videos for FMA7088');
  assert.ok(
    ctx.videoResources.some((v) => v.youtubeId === 'X9ZZ6tcxArI'),
    'Expected Heart video yt-ccap-25-heart-1 for FMA7088',
  );
});

test('resolveStudyContext resolves non-3D topic edu-cell-organelles-transport with honest missing-mesh disclosure', () => {
  const ctx = resolveStudyContext(
    { topicId: 'edu-cell-organelles-transport', sex: 'male' },
    effectiveMaleAtlas,
  );

  assert.equal(ctx.topicId, 'edu-cell-organelles-transport');
  assert.equal(ctx.in3DModel, false);
  assert.equal(ctx.matchedPartIds.length, 0);
  assert.equal(ctx.coverage.mesh3D, 'unavailable');
  assert.match(ctx.coverage.meshMessage, /not currently available/i);
  assert.ok(ctx.learningObjectives.length > 0);
  assert.notEqual(ctx.coverage.studyContent, 'unavailable');
});

test('resolveStudyContext resolves female overlay concepts cleanly when female effectiveAtlas is supplied', () => {
  const ctx = resolveStudyContext({ conceptId: 'FMA17558', sex: 'female' }, effectiveFemaleAtlas);

  assert.equal(ctx.sex, 'female');
  assert.equal(ctx.canonicalConceptId, 'FMA17558');
  assert.equal(ctx.in3DModel, true);
  assert.ok(ctx.matchedPartIds.some((id) => id.startsWith('HF_')));
  assert.ok(ctx.videoResources.length > 0);
});

test('resolveStudyContext resolves entrypoints from question, relationship, physiology, clinical, histology, presentation, reading, video, and unknown IDs', () => {
  const qCtx = resolveStudyContext({ questionId: QUIZ_QUESTIONS[0].id }, effectiveMaleAtlas);
  assert.equal(qCtx.canonicalConceptId, QUIZ_QUESTIONS[0].relatedConceptId);
  assert.equal(qCtx.origin.questionId, QUIZ_QUESTIONS[0].id);

  const rel = VERIFIED_RELATIONSHIPS[0];
  const rCtx = resolveStudyContext({ relationshipId: rel.id }, effectiveMaleAtlas);
  assert.equal(rCtx.canonicalConceptId, rel.sourceConceptId);
  assert.equal(rCtx.origin.relationshipId, rel.id);

  const phys = PHYSIOLOGY_MODULES[0];
  const pCtx = resolveStudyContext({ physiologyId: phys.id }, effectiveMaleAtlas);
  assert.ok(pCtx.physiologyModules.some((m) => m.id === phys.id));

  const clin = CLINICAL_CASES[0];
  const cCtx = resolveStudyContext({ clinicalCaseId: clin.id }, effectiveMaleAtlas);
  assert.ok(cCtx.clinicalCases.some((c) => c.id === clin.id));

  const hist = HISTOLOGY_ENTRIES[0];
  const hCtx = resolveStudyContext({ histologyId: hist.id }, effectiveMaleAtlas);
  assert.ok(hCtx.histologyEntries.some((h) => h.id === hist.id));

  const pres = BUILTIN_PRESENTATIONS[0];
  const prCtx = resolveStudyContext({ presentationId: pres.id }, effectiveMaleAtlas);
  assert.ok(prCtx.presentations.some((p) => p.id === pres.id));

  const res = STUDY_RESOURCES[0];
  const resCtx = resolveStudyContext({ resourceId: res.id }, effectiveMaleAtlas);
  assert.ok(resCtx.externalResources.some((r) => r.id === res.id));

  const vid = VERIFIED_YOUTUBE_VIDEOS[0];
  const vidCtx = resolveStudyContext({ videoId: vid.id }, effectiveMaleAtlas);
  assert.ok(vidCtx.videoResources.some((v) => v.id === vid.id));

  // Unknown / invalid identifiers must resolve gracefully without throwing
  const fallbackCtx = resolveStudyContext(
    {
      conceptId: 'FMA_DOES_NOT_EXIST_999999',
      topicId: 'topic-does-not-exist',
      questionId: 'q-missing',
    },
    effectiveMaleAtlas,
  );
  assert.equal(fallbackCtx.in3DModel, false);
  assert.equal(fallbackCtx.matchedPartIds.length, 0);
  assert.equal(fallbackCtx.coverage.mesh3D, 'unavailable');
});

test('encodeStudyContextHash and parseStudyContextFromHash roundtrip study context parameters', () => {
  const input = {
    conceptId: 'FMA7088',
    topicId: 'topic-cardio-heart-chambers',
    systemId: 'cardiovascular' as const,
    questionId: QUIZ_QUESTIONS[0].id,
    sourceModule: 'quiz' as const,
    sourceItemId: 'item-1',
    sex: 'female' as const,
  };
  const hash = encodeStudyContextHash(input);
  assert.ok(hash.startsWith('#/study?'));
  const parsed = parseStudyContextFromHash(hash);

  assert.equal(parsed.conceptId, input.conceptId);
  assert.equal(parsed.topicId, input.topicId);
  assert.equal(parsed.systemId, input.systemId);
  assert.equal(parsed.questionId, input.questionId);
  assert.equal(parsed.sourceModule, input.sourceModule);
  assert.equal(parsed.sourceItemId, input.sourceItemId);
  assert.equal(parsed.sex, input.sex);
});
