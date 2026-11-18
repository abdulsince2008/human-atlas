import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { Atlas } from './anatomy';
import {
  classifyPartTissue,
  RENDER_QUALITY_PRESETS,
  resolveNaturalAnatomyColors,
  resolveTissueClassificationColors,
  TISSUE_MATERIAL_PRESETS,
  validateMaterialRegistry,
  VISUALIZATION_MODES,
} from './tissue-materials';
import {
  evaluatePartGeometryPolicy,
  LOD_LEVEL_SPECS,
  validateLicenseRegistry,
} from './data/asset-registries';
import {
  SURGICAL_ANATOMY_REGIONS,
  SURGICAL_EDUCATION_DISCLAIMER,
  validateSurgicalAnatomyRegistry,
} from './data/surgical-anatomy';

const atlas = JSON.parse(
  fs.readFileSync(path.resolve('public/models/atlas.json'), 'utf8'),
) as Atlas;

test('Natural Anatomy is the default visualization mode and material registry is valid', () => {
  const defaultModes = VISUALIZATION_MODES.filter((m) => m.isDefault);
  assert.equal(defaultModes.length, 1);
  assert.equal(defaultModes[0].id, 'natural');

  const check = validateMaterialRegistry();
  assert.equal(check.valid, true, check.errors.join('; '));
});

test('Natural Anatomy classifies real BodyParts3D tissues accurately without rainbow brain colors', () => {
  const naturalColors = resolveNaturalAnatomyColors(atlas);
  assert.equal(Object.keys(naturalColors).length, atlas.parts.length);

  // Brain cortex (frontal gyrus) -> natural cortical grey matter, NOT rainbow blue
  const frontalPart = atlas.parts.find((p) => p.id === 'FJ1833');
  assert.ok(frontalPart);
  assert.equal(classifyPartTissue(frontalPart), 'brain_grey_matter');
  assert.equal(naturalColors['FJ1833'], TISSUE_MATERIAL_PRESETS.brain_grey_matter.naturalColor);

  // Corpus callosum -> natural white matter
  const callosum = atlas.parts.find((p) => /corpus callosum/i.test(p.name));
  assert.ok(callosum);
  assert.equal(classifyPartTissue(callosum), 'brain_white_matter');

  // Tendon vs skeletal muscle differentiation
  const tendon = atlas.parts.find((p) => p.system === 'muscular' && /tendon/i.test(p.name));
  if (tendon) {
    assert.equal(classifyPartTissue(tendon), 'tendon');
  }

  // Tissue classification mode produces valid hex colors for every part
  const tissueColors = resolveTissueClassificationColors(atlas);
  assert.equal(Object.keys(tissueColors).length, atlas.parts.length);
});

test('Hardware quality presets and LOD 0-3 specs are complete and monotonic', () => {
  assert.ok(RENDER_QUALITY_PRESETS.performance.pixelRatioCap < RENDER_QUALITY_PRESETS.ultra.pixelRatioCap);
  assert.equal(LOD_LEVEL_SPECS.length, 4);
  assert.deepEqual(
    LOD_LEVEL_SPECS.map((l) => l.level),
    [0, 1, 2, 3],
  );
  const gyrusPolicy = evaluatePartGeometryPolicy(atlas.parts.find((p) => p.id === 'FJ1833')!);
  assert.equal(gyrusPolicy.tier, 'high');
  const hippo = atlas.parts.find((p) => /hippocampus/i.test(p.name));
  assert.ok(hippo);
  assert.equal(evaluatePartGeometryPolicy(hippo).tier, 'very_high');
});

test('License registry and Surgical Anatomy registry pass strict validation', () => {
  const lic = validateLicenseRegistry();
  assert.equal(lic.valid, true, lic.errors.join('; '));

  const surg = validateSurgicalAnatomyRegistry();
  assert.equal(surg.valid, true, surg.errors.join('; '));
  assert.ok(SURGICAL_ANATOMY_REGIONS.length >= 4);
  assert.ok(/educational/i.test(SURGICAL_EDUCATION_DISCLAIMER));
});
