import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import type { Atlas } from './anatomy';
import {
  FEMALE_REPLACED_MALE_PART_SET,
  getActiveConceptsForSex,
  getActivePartsForSex,
  isPartHiddenForSex,
  type FemaleAtlasManifest,
} from './female-atlas';

const baseAtlas = JSON.parse(
  fs.readFileSync(path.resolve('public/models/atlas.json'), 'utf8'),
) as Atlas;
const femaleAtlas = JSON.parse(
  fs.readFileSync(path.resolve('public/models/female/female-atlas.json'), 'utf8'),
) as FemaleAtlasManifest;

test('female overlay manifest contains 14 valid non-empty anatomical parts and binary chunks', () => {
  assert.equal(femaleAtlas.sex, 'female');
  assert.equal(femaleAtlas.parts.length, 14);
  const binPath = path.resolve('public', femaleAtlas.chunks[0].url.replace(/^\//, ''));
  assert.equal(fs.existsSync(binPath), true);
  const bin = fs.readFileSync(binPath);

  for (const p of femaleAtlas.parts) {
    assert.ok(p.id.startsWith('HF_'));
    assert.ok(p.vertexCount > 20);
    assert.ok(p.indexCount / 3 >= 50, `${p.id} must have >= 50 triangles`);
    assert.ok(p.indices + p.indexCount * 4 <= bin.length);
    for (let i = 0; i < 3; i++) {
      assert.ok(Number.isFinite(p.bounds[0][i]));
      assert.ok(Number.isFinite(p.bounds[1][i]));
      assert.ok(p.bounds[0][i] < p.bounds[1][i]);
    }
  }
});

test('switching to female removes all male-only reproductive parts and inserts female organs', () => {
  const maleParts = getActivePartsForSex(baseAtlas, femaleAtlas, 'male');
  assert.equal(maleParts.length, 2234);

  const femaleParts = getActivePartsForSex(baseAtlas, femaleAtlas, 'female');
  // 2234 - 29 male-specific/replaced parts + 14 female parts = 2219
  assert.equal(femaleParts.length, 2234 - FEMALE_REPLACED_MALE_PART_SET.size + 14);

  assert.equal(femaleParts.some((p) => p.id === 'FJ3139'), false, 'Prostate must be hidden in female');
  assert.equal(femaleParts.some((p) => p.id === 'FJ3138'), false, 'Testis must be hidden in female');
  assert.equal(femaleParts.some((p) => p.id === 'FJ3132'), false, 'Penis must be hidden in female');
  assert.equal(femaleParts.some((p) => p.id === 'FJ3393'), false, 'Male sacrum must be replaced');

  assert.equal(femaleParts.some((p) => p.id === 'HF_UTERUS'), true);
  assert.equal(femaleParts.some((p) => p.id === 'HF_CERVIX'), true);
  assert.equal(femaleParts.some((p) => p.id === 'HF_OVARY_LEFT'), true);
  assert.equal(femaleParts.some((p) => p.id === 'HF_TUBE_LEFT'), true);
  assert.equal(femaleParts.some((p) => p.id === 'HF_VAGINA'), true);
  assert.equal(femaleParts.some((p) => p.id === 'HF_MAMMARY_LEFT'), true);
  assert.equal(femaleParts.some((p) => p.id === 'HF_SACRUM'), true);

  assert.equal(isPartHiddenForSex('FJ3139', 'female'), true);
  assert.equal(isPartHiddenForSex('FJ3139', 'male'), false);
  assert.equal(isPartHiddenForSex('HF_UTERUS', 'male'), true);
  assert.equal(isPartHiddenForSex('HF_UTERUS', 'female'), false);
});

test('female concept list excludes male-only concepts and includes female reproductive FMA concepts', () => {
  const femaleConcepts = getActiveConceptsForSex(baseAtlas, femaleAtlas, 'female');
  const names = new Set(femaleConcepts.map((c) => c.name.toLowerCase()));
  assert.equal(names.has('prostate'), false);
  assert.equal(names.has('uterus'), true);
  assert.equal(names.has('vagina'), true);
  assert.equal(names.has('left ovary'), true);
  assert.equal(names.has('left mammary gland'), true);
});
