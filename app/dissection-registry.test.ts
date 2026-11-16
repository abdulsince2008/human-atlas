import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import type { Atlas } from './anatomy';
import { buildDissectionRegistry } from './dissection-registry';

const atlasPath = path.resolve(process.cwd(), 'public/models/atlas.json');
const atlas = JSON.parse(fs.readFileSync(atlasPath, 'utf8')) as Atlas;
const registry = buildDissectionRegistry(atlas);
const partIds = new Set(atlas.parts.map((p) => p.id));

test('dissection registry validates against real atlas.json parts with zero missing IDs', () => {
  assert.ok(registry.regions.length >= 3, 'Should define multiple anatomical depth regions');

  const skullRegion = registry.regions.find((r) => r.id === 'head-skull-neuro');
  assert.ok(skullRegion, 'Skull & Intracranial Dissection region must exist');
  assert.equal(skullRegion.layers.length, 6, 'Skull dissection must support all 6 depth steps');

  for (const region of registry.regions) {
    assert.ok(region.layers.length >= 3, `${region.id} must have >= 3 progressive layers`);
    for (const layer of region.layers) {
      assert.ok(layer.partIds.length > 0, `Layer ${layer.id} must resolve real meshes`);
      for (const pid of layer.partIds) {
        assert.ok(partIds.has(pid), `Part ${pid} in layer ${layer.id} must exist in atlas.json`);
      }
    }
  }
});

test('skull dissection covers real cranial vault bones, tentorium cerebelli, cortex, deep nuclei, brainstem & ventricles', () => {
  const skullRegion = registry.regions.find((r) => r.id === 'head-skull-neuro')!;
  const vault = skullRegion.layers.find((l) => l.id === 'cranial-vault')!;
  // Verify exact real cranial vault bone IDs: Frontal, L/R Parietal, Occipital, L/R Temporal
  for (const expectedId of ['FJ3200', 'FJ3274', 'FJ3380', 'FJ3309', 'FJ3281', 'FJ3386']) {
    assert.ok(vault.partIds.includes(expectedId), `Cranial vault missing real bone ${expectedId}`);
  }
  const tentoriumLayer = skullRegion.layers.find((l) => l.id === 'tentorium-and-cortex')!;
  assert.ok(tentoriumLayer.partIds.includes('FJ1843'), 'Tentorium cerebelli FJ1843 should be included');

  // Verify honest disclosure of absent meninges & cranial nerves
  assert.ok(
    skullRegion.missingAssets.some((m) => /dura|arachnoid|pia/i.test(m)),
    'Must disclose absent convexity meninges',
  );
  assert.ok(
    skullRegion.missingAssets.some((m) => /cranial nerves/i.test(m)),
    'Must disclose absent cranial nerve segments',
  );
});

test('anatomical groups and animation specs reference valid parts and distinguish rigid vs pending-rig', () => {
  assert.equal(registry.groups.length, 7, 'All 7 anatomical groups should be registered');
  for (const group of registry.groups) {
    assert.ok(group.partIds.length > 0, `Group ${group.id} must have parts`);
    for (const pid of group.partIds) {
      assert.ok(partIds.has(pid), `Group ${group.id} contains unknown part ${pid}`);
    }
    const extLen = Math.hypot(
      group.extractionVector[0],
      group.extractionVector[1],
      group.extractionVector[2],
    );
    assert.ok(extLen > 0.1, `Group ${group.id} must define an anterior/outward extraction vector`);
    assert.ok(group.explodeRadius > 0.05, `Group ${group.id} must define positive explodeRadius`);
    assert.ok(
      group.extractedFocusBounds.max[2] > group.extractedFocusBounds.min[2],
      `Group ${group.id} must define valid extractedFocusBounds`,
    );
  }

  const rigidAnims = registry.animations.filter((a) => a.status === 'supported_rigid');
  const pendingAnims = registry.animations.filter((a) => a.status !== 'supported_rigid');
  assert.ok(rigidAnims.length >= 4, 'At least 4 rigid kinematic animations should be registered');
  assert.ok(pendingAnims.length >= 2, 'Honest pending-rig/asset slots should be registered');

  for (const anim of rigidAnims) {
    assert.ok(anim.rigidMotions.length > 0, `${anim.id} must have rigidMotions`);
    for (const m of anim.rigidMotions) {
      assert.ok(partIds.has(m.partId), `Animation ${anim.id} part ${m.partId} missing in atlas`);
      const axisLen = Math.hypot(m.axis[0], m.axis[1], m.axis[2]);
      assert.ok(axisLen > 0.5, `Animation ${anim.id} must have non-zero rotation axis`);
    }
  }

  for (const pending of pendingAnims) {
    assert.equal(pending.rigidMotions.length, 0, 'Pending-rig clips must not fake static scaling');
    assert.ok(pending.rigRequirementNote && pending.rigRequirementNote.length > 15);
  }
});
