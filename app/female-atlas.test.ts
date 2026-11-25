import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import type { Atlas } from './anatomy';
import {
  FEMALE_ATLAS_PROVENANCE,
  FEMALE_REPLACED_MALE_PART_SET,
  LAYER_BUNDLE_PROVENANCE,
  getActiveConceptsForSex,
  getActivePartsForSex,
  isFemaleSpecificTarget,
  isMaleOnlyTarget,
  isPartHiddenForSex,
  type FemaleAtlasManifest,
  type OverlayManifest,
} from './female-atlas';
import { buildStaticBundleFromManifests, computeAtlasCoverageSummary } from './data/coverage-matrix';
import { lookupStructureKnowledge } from './anatomy-knowledge';
import { classifyPartTissue, TISSUE_MATERIAL_PRESETS } from './tissue-materials';

const baseAtlas = JSON.parse(
  fs.readFileSync(path.resolve('public/models/atlas.json'), 'utf8'),
) as Atlas;
const sharedOverlay = JSON.parse(
  fs.readFileSync(path.resolve('public/models/shared/shared-enhancements.json'), 'utf8'),
) as OverlayManifest;
const maleOverlay = JSON.parse(
  fs.readFileSync(path.resolve('public/models/male/male-enhancements.json'), 'utf8'),
) as OverlayManifest;
const femaleAtlas = JSON.parse(
  fs.readFileSync(path.resolve('public/models/female/female-atlas.json'), 'utf8'),
) as FemaleAtlasManifest;
const pregnancyOverlay = JSON.parse(
  fs.readFileSync(path.resolve('public/models/optional/pregnancy-placenta.json'), 'utf8'),
) as OverlayManifest;

test('female overlay v3.0 manifest contains 92 valid parts (84 HuBMAP + 8 procedural) and exact provenance totals', () => {
  assert.equal(femaleAtlas.sex, 'female');
  assert.equal(femaleAtlas.parts.length, FEMALE_ATLAS_PROVENANCE.totalParts);
  assert.equal(femaleAtlas.parts.length, 92);
  assert.equal(femaleAtlas.concepts.length, FEMALE_ATLAS_PROVENANCE.totalConcepts);
  assert.equal(femaleAtlas.chunks.length, FEMALE_ATLAS_PROVENANCE.chunkCount);
  const binPath = path.resolve('public', femaleAtlas.chunks[0].url.replace(/^\//, ''));
  assert.equal(fs.existsSync(binPath), true);
  const bin = fs.readFileSync(binPath);

  let totalTriangles = 0;
  let hubmapV15 = 0;
  let hubmapV11 = 0;
  let hubmapV13 = 0;
  let procedural = 0;

  for (const p of femaleAtlas.parts) {
    assert.ok(p.id.startsWith('HF_'));
    assert.ok(p.vertexCount > 20);
    assert.ok(p.indexCount / 3 >= 50, `${p.id} must have >= 50 triangles`);
    assert.ok(p.indices + p.indexCount * 4 <= bin.length);
    totalTriangles += p.indexCount / 3;
    if (p.source?.includes('v1.5')) hubmapV15++;
    else if (p.source?.includes('v1.1')) hubmapV11++;
    else if (p.source?.includes('v1.3')) hubmapV13++;
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
  assert.equal(hubmapV13, FEMALE_ATLAS_PROVENANCE.hubmapV13Vasculature);
  assert.equal(hubmapV15 + hubmapV11 + hubmapV13, FEMALE_ATLAS_PROVENANCE.hubmapDirectParts);
  assert.equal(procedural, FEMALE_ATLAS_PROVENANCE.proceduralReconstructedParts);
  assert.equal(FEMALE_REPLACED_MALE_PART_SET.size, FEMALE_ATLAS_PROVENANCE.replacedMaleParts);
});

test('all 5 overlay/enhancement manifests match exact layer bundle provenance and zero-overlap contracts', () => {
  assert.equal(sharedOverlay.parts.length, LAYER_BUNDLE_PROVENANCE.sharedEnhancementParts);
  assert.equal(maleOverlay.parts.length, LAYER_BUNDLE_PROVENANCE.maleEnhancementParts);
  assert.equal(pregnancyOverlay.parts.length, LAYER_BUNDLE_PROVENANCE.optionalPregnancyParts);

  const allIds = new Set<string>();
  for (const p of [
    ...baseAtlas.parts,
    ...sharedOverlay.parts,
    ...maleOverlay.parts,
    ...femaleAtlas.parts,
    ...pregnancyOverlay.parts,
  ]) {
    assert.equal(allIds.has(p.id), false, `Duplicate part ID ${p.id}`);
    allIds.add(p.id);
    assert.ok(p.indexCount / 3 >= 50, `${p.id} must have >= 50 triangles`);
  }
  assert.equal(allIds.size, LAYER_BUNDLE_PROVENANCE.totalDistinctBundledAssets);
});

test('switching between Male and Female keeps common organs intact and produces exact active totals', () => {
  // Base + female overlay only (no extraBundle) -> 2234 - 45 + 92 = 2281
  const baseFemaleOnly = getActivePartsForSex(baseAtlas, femaleAtlas, 'female');
  assert.equal(baseFemaleOnly.length, 2234 - FEMALE_REPLACED_MALE_PART_SET.size + 92);

  // Full multi-layer bundle totals
  const maleParts = getActivePartsForSex(baseAtlas, femaleAtlas, 'male', {
    shared: sharedOverlay,
    male: maleOverlay,
  });
  assert.equal(maleParts.length, LAYER_BUNDLE_PROVENANCE.activeMalePartsTotal); // 2301

  const femaleDefaultParts = getActivePartsForSex(baseAtlas, femaleAtlas, 'female', {
    shared: sharedOverlay,
    optionalPregnancy: pregnancyOverlay,
    includePregnancy: false,
  });
  assert.equal(femaleDefaultParts.length, LAYER_BUNDLE_PROVENANCE.activeFemalePartsTotal); // 2328

  const femalePregnancyParts = getActivePartsForSex(baseAtlas, femaleAtlas, 'female', {
    shared: sharedOverlay,
    optionalPregnancy: pregnancyOverlay,
    includePregnancy: true,
  });
  assert.equal(
    femalePregnancyParts.length,
    LAYER_BUNDLE_PROVENANCE.activeFemalePartsTotal + LAYER_BUNDLE_PROVENANCE.optionalPregnancyParts,
  ); // 2336

  // Common shared structures (e.g., brain cortex & heart/viscera) remain untouched
  assert.equal(femaleDefaultParts.some((p) => p.id === 'FJ1833'), true, 'Shared brain gyrus must remain untouched');
  assert.equal(
    femaleDefaultParts.filter((p) => !p.id.startsWith('HF_') && !p.id.startsWith('HS_')).length,
    2234 - FEMALE_REPLACED_MALE_PART_SET.size,
  );

  // Male-only organs & replaced pelvic bones hidden
  assert.equal(femaleDefaultParts.some((p) => p.id === 'FJ3139'), false, 'Prostate must be hidden in female');
  assert.equal(femaleDefaultParts.some((p) => p.id === 'FJ3138'), false, 'Testis must be hidden in female');
  assert.equal(femaleDefaultParts.some((p) => p.id === 'FJ3132'), false, 'Penis must be hidden in female');
  assert.equal(femaleDefaultParts.some((p) => p.id === 'FJ3393'), false, 'Male sacrum must be replaced');
  assert.equal(maleParts.some((p) => p.id === 'HM_EJACULATORY_DUCT'), true);
  assert.equal(femaleDefaultParts.some((p) => p.id === 'HM_EJACULATORY_DUCT'), false);
  assert.equal(femaleDefaultParts.some((p) => p.id === 'HS_SPINAL_C1'), true);

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
    'HF_INTERNAL_ILIAC_VEIN_LEFT',
    'HF_ENDOMETRIUM',
    'HF_CLITORIS',
    'HF_VESTIBULAR_BULBS',
    'HF_BARTHOLIN_GLANDS',
    'HF_LABIA_MINORA',
    'HF_LABIA_MAJORA',
    'HF_MONS_PUBIS',
  ]) {
    assert.equal(femaleDefaultParts.some((p) => p.id === requiredId), true, `Missing female part ${requiredId}`);
  }

  assert.equal(isPartHiddenForSex('FJ3139', 'female'), true);
  assert.equal(isPartHiddenForSex('FJ3139', 'male'), false);
  assert.equal(isPartHiddenForSex('HF_CLITORIS', 'male'), true);
  assert.equal(isPartHiddenForSex('HF_CLITORIS', 'female'), false);
  assert.equal(isPartHiddenForSex('HO_PLACENTA', 'female', false), true);
  assert.equal(isPartHiddenForSex('HO_PLACENTA', 'female', true), false);
});

test('female concept list covers all HuBMAP + Innerbody structures with 100% curated knowledge', () => {
  const femaleConcepts = getActiveConceptsForSex(baseAtlas, femaleAtlas, 'female', {
    shared: sharedOverlay,
  });
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

test('coverage matrix computes exact Male/Female active counts, gaps, and HuBMAP vs procedural splits', () => {
  const bundle = buildStaticBundleFromManifests({
    shared: sharedOverlay,
    male: maleOverlay,
    female: femaleAtlas,
    optionalPregnancy: pregnancyOverlay,
  });
  const summary = computeAtlasCoverageSummary(baseAtlas, bundle);

  assert.equal(summary.totalDistinctBundledMeshes, 2401);
  assert.equal(summary.maleActiveMeshes, 2301);
  assert.equal(summary.femaleActiveMeshes, 2328);
  assert.equal(summary.optionalPregnancyMeshes, 8);
  assert.equal(summary.femaleHubmapMeshes, 84);
  assert.equal(summary.femaleProceduralMeshes, 8);
  assert.equal(summary.reusedFromMaleUnadaptedInFemale, 2189);
  assert.equal(summary.maleTargetMeshes, 2380);
  assert.equal(summary.femaleTargetMeshes, 2441);
  assert.equal(summary.maleMissingRequiredMeshes, 79);
  assert.equal(summary.femaleMissingRequiredMeshes, 113);

  const endocrine = summary.systems.find((s) => s.systemId === 'endocrine')!;
  assert.equal(endocrine.maleExisting, 4);
  assert.equal(endocrine.maleTarget, 11);
  assert.equal(endocrine.maleMeshCoveragePct, 36.4);
});

test('isFemaleSpecificTarget and isMaleOnlyTarget classify sex-specific structures accurately', () => {
  assert.equal(isFemaleSpecificTarget(null, 'HF_UTERUS_FUNDUS'), true);
  assert.equal(isFemaleSpecificTarget('FMA17558', null), true); // Uterus
  assert.equal(isFemaleSpecificTarget('FMA7088', 'FJ1833'), false); // Heart / brain gyrus

  assert.equal(isMaleOnlyTarget(baseAtlas, null, 'FJ3139'), true); // Prostate part
  assert.equal(isMaleOnlyTarget(baseAtlas, 'FMA9600', null), true); // Prostate concept
  assert.equal(isMaleOnlyTarget(baseAtlas, 'FMA7088', null), false); // Heart concept
});
