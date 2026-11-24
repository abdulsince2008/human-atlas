import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import type { Atlas } from './anatomy';
import {
  FEMALE_ATLAS_PROVENANCE,
  FEMALE_REPLACED_MALE_PART_SET,
  getActiveConceptsForSex,
  getActivePartsForSex,
  isFemaleSpecificTarget,
  isMaleOnlyTarget,
  isPartHiddenForSex,
  type FemaleAtlasManifest,
} from './female-atlas';
import { lookupStructureKnowledge } from './anatomy-knowledge';
import { classifyPartTissue, TISSUE_MATERIAL_PRESETS } from './tissue-materials';

const baseAtlas = JSON.parse(
  fs.readFileSync(path.resolve('public/models/atlas.json'), 'utf8'),
) as Atlas;
const femaleAtlas = JSON.parse(
  fs.readFileSync(path.resolve('public/models/female/female-atlas.json'), 'utf8'),
) as FemaleAtlasManifest;

test('female overlay manifest contains 79 valid parts (71 HuBMAP + 8 procedural) and exact provenance totals', () => {
  assert.equal(femaleAtlas.sex, 'female');
  assert.equal(femaleAtlas.parts.length, FEMALE_ATLAS_PROVENANCE.totalParts);
  assert.equal(femaleAtlas.concepts.length, FEMALE_ATLAS_PROVENANCE.totalConcepts);
  assert.equal(femaleAtlas.chunks.length, FEMALE_ATLAS_PROVENANCE.chunkCount);
  const binPath = path.resolve('public', femaleAtlas.chunks[0].url.replace(/^\//, ''));
  assert.equal(fs.existsSync(binPath), true);
  const bin = fs.readFileSync(binPath);

  let totalTriangles = 0;
  let hubmapV15 = 0;
  let hubmapV11 = 0;
  let procedural = 0;

  for (const p of femaleAtlas.parts) {
    assert.ok(p.id.startsWith('HF_'));
    assert.ok(p.vertexCount > 20);
    assert.ok(p.indexCount / 3 >= 50, `${p.id} must have >= 50 triangles`);
    assert.ok(p.indices + p.indexCount * 4 <= bin.length);
    totalTriangles += p.indexCount / 3;
    if (p.source?.includes('v1.5')) hubmapV15++;
    else if (p.source?.includes('v1.1')) hubmapV11++;
    else procedural++;

    for (let i = 0; i < 3; i++) {
      assert.ok(Number.isFinite(p.bounds[0][i]));
      assert.ok(Number.isFinite(p.bounds[1][i]));
      assert.ok(p.bounds[0][i] < p.bounds[1][i]);
    }
  }

  assert.equal(totalTriangles, FEMALE_ATLAS_PROVENANCE.triangles);
  assert.equal(hubmapV15, FEMALE_ATLAS_PROVENANCE.hubmapV15VisibleHuman);
  assert.equal(hubmapV11, FEMALE_ATLAS_PROVENANCE.hubmapV11Mammary);
  assert.equal(hubmapV15 + hubmapV11, FEMALE_ATLAS_PROVENANCE.hubmapDirectParts);
  assert.equal(procedural, FEMALE_ATLAS_PROVENANCE.proceduralReconstructedParts);
  assert.equal(FEMALE_REPLACED_MALE_PART_SET.size, FEMALE_ATLAS_PROVENANCE.replacedMaleParts);
});

test('switching to female removes male-only parts, keeps common organs intact, and inserts female parts', () => {
  const maleParts = getActivePartsForSex(baseAtlas, femaleAtlas, 'male');
  assert.equal(maleParts.length, 2234);

  const femaleParts = getActivePartsForSex(baseAtlas, femaleAtlas, 'female');
  // 2234 - 29 male-specific/replaced parts + 79 female parts = 2284
  assert.equal(femaleParts.length, 2234 - FEMALE_REPLACED_MALE_PART_SET.size + 79);

  // Common shared structures (e.g., brain cortex & heart/viscera) remain untouched
  assert.equal(femaleParts.some((p) => p.id === 'FJ1833'), true, 'Shared brain gyrus must remain untouched');
  assert.equal(
    femaleParts.filter((p) => !p.id.startsWith('HF_')).length,
    2234 - FEMALE_REPLACED_MALE_PART_SET.size,
  );

  // Male-only organs & replaced pelvic bones hidden
  assert.equal(femaleParts.some((p) => p.id === 'FJ3139'), false, 'Prostate must be hidden in female');
  assert.equal(femaleParts.some((p) => p.id === 'FJ3138'), false, 'Testis must be hidden in female');
  assert.equal(femaleParts.some((p) => p.id === 'FJ3132'), false, 'Penis must be hidden in female');
  assert.equal(femaleParts.some((p) => p.id === 'FJ3393'), false, 'Male sacrum must be replaced');

  // HuBMAP HRA female internal pelvic, vascular & mammary parts
  for (const requiredId of [
    'HF_UTERUS_FUNDUS',
    'HF_CERVIX',
    'HF_OVARY_LEFT',
    'HF_TUBE_AMPULLA_LEFT',
    'HF_TUBE_FIMBRIAE_LEFT',
    'HF_VAGINA',
    'HF_MAMMARY_LOBES_LEFT',
    'HF_LACTIFEROUS_DUCTS_LEFT',
    'HF_AREOLA_LEFT',
    'HF_NIPPLE_LEFT',
    'HF_SACRUM',
    'HF_ENDOMETRIUM',
    'HF_CLITORIS',
    'HF_VESTIBULAR_BULBS',
    'HF_BARTHOLIN_GLANDS',
    'HF_LABIA_MINORA',
    'HF_LABIA_MAJORA',
    'HF_MONS_PUBIS',
  ]) {
    assert.equal(femaleParts.some((p) => p.id === requiredId), true, `Missing female part ${requiredId}`);
  }

  assert.equal(isPartHiddenForSex('FJ3139', 'female'), true);
  assert.equal(isPartHiddenForSex('FJ3139', 'male'), false);
  assert.equal(isPartHiddenForSex('HF_CLITORIS', 'male'), true);
  assert.equal(isPartHiddenForSex('HF_CLITORIS', 'female'), false);
});

test('female concept list covers all HuBMAP + Innerbody structures with 100% curated knowledge', () => {
  const femaleConcepts = getActiveConceptsForSex(baseAtlas, femaleAtlas, 'female');
  const names = new Set(femaleConcepts.map((c) => c.name.toLowerCase()));
  assert.equal(names.has('prostate'), false);
  assert.equal(names.has('uterus'), true);
  assert.equal(names.has('vagina'), true);
  assert.equal(names.has('left ovary'), true);
  assert.equal(names.has('left mammary gland'), true);
  assert.equal(names.has('endometrium (uterine cavity lining)'), true);
  assert.equal(names.has('clitoris (glans, body & crura)'), true);
  assert.equal(names.has('greater vestibular glands (bartholin glands)'), true);

  for (const fc of femaleAtlas.concepts) {
    const k = lookupStructureKnowledge(fc.id, fc.name);
    assert.equal(k.verifiedCurated, true, `Missing curated knowledge for ${fc.id} (${fc.name})`);
  }

  const stromaPart = femaleAtlas.parts.find((p) => p.id === 'HF_MAMMARY_FAT_LEFT')!;
  assert.equal(classifyPartTissue(stromaPart), 'mammary_stroma');
  assert.ok(TISSUE_MATERIAL_PRESETS.mammary_stroma.opacity < 0.5);

  const nipplePart = femaleAtlas.parts.find((p) => p.id === 'HF_NIPPLE_LEFT')!;
  assert.equal(classifyPartTissue(nipplePart), 'areolar_skin');
});

test('isFemaleSpecificTarget and isMaleOnlyTarget classify sex-specific structures accurately', () => {
  assert.equal(isFemaleSpecificTarget(null, 'HF_UTERUS_FUNDUS'), true);
  assert.equal(isFemaleSpecificTarget('FMA17558', null), true); // Uterus
  assert.equal(isFemaleSpecificTarget('FMA7088', 'FJ1833'), false); // Heart / brain gyrus

  assert.equal(isMaleOnlyTarget(baseAtlas, null, 'FJ3139'), true); // Prostate part
  assert.equal(isMaleOnlyTarget(baseAtlas, 'FMA9600', null), true); // Prostate concept
  assert.equal(isMaleOnlyTarget(baseAtlas, 'FMA7088', null), false); // Heart concept
});
