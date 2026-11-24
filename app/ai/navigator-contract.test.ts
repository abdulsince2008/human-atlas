import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { Atlas } from '../anatomy';
import {
  getActiveConceptsForSex,
  getActivePartsForSex,
  getSystemDescriptionForSex,
  isFemaleSpecificTarget,
  type FemaleAtlasManifest,
} from '../female-atlas';
import { validateAndSanitizeStudyState } from '../study-store';
import {
  inferRequiredSexFromQuery,
  resolveConceptForAiQuery,
  validateAndNormalizeAiResponse,
} from './navigator-contract';

const ROOT = process.cwd();
const maleAtlas = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'public/models/atlas.json'), 'utf8'),
) as Atlas;
const femaleManifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'public/models/female/female-atlas.json'), 'utf8'),
) as FemaleAtlasManifest;

test('StudyStateV1 validation persists preferredSex safely while remaining backward-compatible', () => {
  const femaleBackup = validateAndSanitizeStudyState({
    schemaVersion: 1,
    preferredSex: 'female',
  });
  assert.equal(femaleBackup.ok, true);
  assert.equal(femaleBackup.state?.preferredSex, 'female');

  const legacyBackup = validateAndSanitizeStudyState({
    schemaVersion: 1,
  });
  assert.equal(legacyBackup.ok, true);
  assert.equal(legacyBackup.state?.preferredSex, 'male');

  const invalidSex = validateAndSanitizeStudyState({
    schemaVersion: 1,
    preferredSex: 'unknown',
  });
  assert.equal(invalidSex.ok, true);
  assert.equal(invalidSex.state?.preferredSex, 'male');
});

test('shared anatomy remains intact while gender-specific organs index accurately per Sex', () => {
  const femaleParts = getActivePartsForSex(maleAtlas, femaleManifest, 'female');
  const femaleConcepts = getActiveConceptsForSex(maleAtlas, femaleManifest, 'female');
  const femaleAtlas: Atlas = {
    ...maleAtlas,
    sex: 'female',
    parts: femaleParts,
    concepts: femaleConcepts,
  };

  assert.equal(femaleParts.length, 2284);
  assert.ok(femaleConcepts.some((c) => c.id === 'FMA7088'), 'Shared Heart must remain in Female atlas');
  assert.ok(femaleConcepts.some((c) => c.id === 'FMA17558'), 'Uterus must be indexed in Female atlas');
  assert.ok(!femaleConcepts.some((c) => c.id === 'FMA9600'), 'Prostate must not be indexed in Female atlas');

  assert.equal(isFemaleSpecificTarget('FMA17558', null), true);
  assert.equal(isFemaleSpecificTarget(null, 'HF_UTERUS'), true);
  assert.equal(isFemaleSpecificTarget('FMA7088', null), false);

  const femaleReproDesc = getSystemDescriptionForSex('reproductive', 'male default', 'female');
  assert.ok(femaleReproDesc.toLowerCase().includes('ovaries'));
  assert.equal(inferRequiredSexFromQuery('Inspect endometrium in sagittal view'), 'female');
  assert.equal(inferRequiredSexFromQuery('Show me the prostate gland'), 'male');

  // Cross-sex structure resolution detects female concepts even when currently on male atlas
  const uterusFromMale = resolveConceptForAiQuery('uterus', maleAtlas, femaleManifest);
  assert.equal(uterusFromMale?.concept.id, 'FMA17558');
  assert.equal(uterusFromMale?.requiresSex, 'female');

  // Active resolution inside female atlas finds uterus without switching sex
  const uterusFromFemale = resolveConceptForAiQuery('uterus', femaleAtlas, femaleManifest);
  assert.equal(uterusFromFemale?.concept.id, 'FMA17558');
  assert.equal(uterusFromFemale?.requiresSex, undefined);
});

test('AI navigator response validation clamps numeric parameters and drops unknown actions', () => {
  const normalized = validateAndNormalizeAiResponse({
    reply: 'Isolating the uterus in sagittal cross-section.',
    studyTip: 'Note the anteverted position relative to the urinary bladder.',
    followUpSuggestions: ['Show uterine arteries', 'Open pelvic quiz'],
    actions: [
      { type: 'switch_sex', sex: 'female' },
      { type: 'focus_structure', query: 'uterus', isolate: true },
      { type: 'set_render_mode', explode: 9.5, xrayOpacity: -2, clipAxis: 'x', clipOffset: 2.3 },
      { type: 'unknown_hack_action', evil: true },
      { type: 'open_activity', route: 'invalid_route' },
      { type: 'open_activity', route: 'quiz' },
    ],
  });

  assert.equal(normalized.actions.length, 4);
  assert.deepEqual(normalized.actions[0], { type: 'switch_sex', sex: 'female' });
  assert.deepEqual(normalized.actions[1], {
    type: 'focus_structure',
    query: 'uterus',
    isolate: true,
    ghost: undefined,
  });
  assert.deepEqual(normalized.actions[2], {
    type: 'set_render_mode',
    explode: 1,
    xrayOpacity: 0.05,
    clipAxis: 'x',
    clipOffset: 1,
  });
  assert.deepEqual(normalized.actions[3], {
    type: 'open_activity',
    route: 'quiz',
    targetId: undefined,
    label: undefined,
  });
});
