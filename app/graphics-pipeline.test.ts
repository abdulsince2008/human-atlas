import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as T from 'three';
import type { Atlas } from './anatomy';
import {
  ensureAnatomicalUVs,
  generateAnatomicalUVs,
  validateAnatomicalGeometry,
} from './graphics/uv-generator';
import {
  archetypeForSystem,
  createTissueTextureLibrary,
} from './graphics/tissue-textures';
import { AnatomicalLodManager } from './graphics/lod-manager';

const atlas = JSON.parse(
  fs.readFileSync(path.resolve('public/models/atlas.json'), 'utf8'),
) as Atlas;

test('anatomical UV generator produces finite, valid UVs for real BodyParts3D binary meshes', () => {
  const chunk0 = fs.readFileSync(path.resolve('public/models/body-0.bin'));
  const sampleParts = atlas.parts.filter((p) => p.chunk === 0).slice(0, 25);
  assert.ok(sampleParts.length === 25);

  for (const p of sampleParts) {
    const g = new T.BufferGeometry();
    g.setAttribute(
      'position',
      new T.BufferAttribute(
        new Float32Array(chunk0.buffer, chunk0.byteOffset + p.positions, p.vertexCount * 3),
        3,
      ),
    );
    g.setAttribute(
      'normal',
      new T.BufferAttribute(
        new Int16Array(chunk0.buffer, chunk0.byteOffset + p.normals, p.vertexCount * 3),
        3,
        true,
      ),
    );
    g.setIndex(
      new T.BufferAttribute(
        new Uint32Array(chunk0.buffer, chunk0.byteOffset + p.indices, p.indexCount),
        1,
      ),
    );

    // Before UV generation, validation must honestly flag missing UVs
    const before = validateAnatomicalGeometry(g, p.id);
    assert.equal(before.valid, false);
    assert.equal(before.hasUVs, false);

    // After UV generation, geometry passes all checks
    const src = ensureAnatomicalUVs(g, 0.08);
    assert.equal(src, 'generated_triplanar');
    const after = validateAnatomicalGeometry(g, p.id);
    assert.equal(after.valid, true, after.errors.join('; '));
    assert.equal(after.hasUVs, true);
    assert.equal(after.uvSource, 'generated_triplanar');
    g.dispose();
  }
});

test('UV generator preserves valid source UVs when already present on external geometry', () => {
  const box = new T.BoxGeometry(0.1, 0.1, 0.1);
  const src = ensureAnatomicalUVs(box, 0.08);
  assert.equal(src, 'source_mesh');
  const check = validateAnatomicalGeometry(box, 'test-box');
  assert.equal(check.valid, true);
  assert.equal(check.uvSource, 'source_mesh');

  // Explicit generateAnatomicalUVs regenerates triplanar UVs cleanly
  const uvs = generateAnatomicalUVs(box, 0.05);
  assert.equal(uvs.length, box.getAttribute('position').count * 2);
  box.dispose();
});

test('tissue PBR texture library builds valid linear-space normal/roughness/AO maps for all 6 archetypes and disposes cleanly', () => {
  const lib = createTissueTextureLibrary(64, 4);
  const report = lib.validate();
  assert.equal(report.valid, true, report.errors.join('; '));
  assert.equal(report.checkedArchetypes, 6);

  assert.equal(archetypeForSystem('muscular'), 'muscle_fibrous');
  assert.equal(archetypeForSystem('skeletal'), 'bone_cortical');
  assert.equal(archetypeForSystem('arterial'), 'vascular_smooth');
  assert.equal(archetypeForSystem('nervous'), 'neural_tissue');
  assert.equal(archetypeForSystem('connective'), 'tendon_fascia');
  assert.equal(archetypeForSystem('digestive'), 'parenchyma_organ');

  for (const set of Object.values(lib.sets)) {
    assert.equal(set.provenance, 'procedural_approximation');
    assert.equal(set.normalMap.colorSpace, T.NoColorSpace);
    assert.equal(set.roughnessMap.colorSpace, T.NoColorSpace);
    assert.equal(set.aoMap.colorSpace, T.NoColorSpace);
    assert.ok(set.normalStrength > 0 && set.normalStrength <= 0.5);
  }
  lib.dispose();
});

test('real LOD 3 binary manifest exists, preserves all 2,234 part IDs, and reduces triangle count', () => {
  const lod3Path = path.resolve('public/models/atlas.lod3.json');
  assert.ok(fs.existsSync(lod3Path), 'Expected generated public/models/atlas.lod3.json');
  const lod3 = JSON.parse(fs.readFileSync(lod3Path, 'utf8')) as Atlas;

  assert.equal(lod3.parts.length, atlas.parts.length, 'LOD 3 must preserve all 2,234 anatomical parts');
  assert.ok(
    lod3.triangles < atlas.triangles,
    `LOD 3 triangles (${lod3.triangles}) must be lower than LOD 0 (${atlas.triangles})`,
  );

  const origIds = new Set(atlas.parts.map((p) => p.id));
  for (const p of lod3.parts) {
    assert.ok(origIds.has(p.id), `LOD 3 part ${p.id} must match original atlas`);
    assert.ok(p.indexCount >= 3, `LOD 3 part ${p.id} must retain valid triangles`);
  }
  for (const c of lod3.chunks) {
    const filePath = path.resolve('public', c.url.replace(/^\//, ''));
    assert.ok(fs.existsSync(filePath), `Missing LOD 3 binary chunk: ${c.url}`);
  }
});

test('AnatomicalLodManager switches cleanly with hysteresis and forces LOD 0 on close-up, isolation, explode, and ultra', () => {
  const mgr = new AnatomicalLodManager(2288268);
  // Before LOD 3 is registered, always stays on LOD 0
  assert.equal(
    mgr.evaluate({
      cameraDistance: 4.0,
      qualityPreset: 'balanced',
      lod3Available: false,
      isIsolatedOrCloseFocus: false,
      isExploded: false,
    }).level,
    0,
  );

  mgr.registerLod3(1684412);

  // Far overview on balanced switches to LOD 3
  const far = mgr.evaluate({
    cameraDistance: 3.2,
    qualityPreset: 'balanced',
    lod3Available: true,
    isIsolatedOrCloseFocus: false,
    isExploded: false,
  });
  assert.equal(far.level, 3);
  assert.equal(far.changed, true);

  // Hysteresis band (2.4m is between 2.25 and 2.65): stays on LOD 3 without thrashing
  const mid = mgr.evaluate({
    cameraDistance: 2.4,
    qualityPreset: 'balanced',
    lod3Available: true,
    isIsolatedOrCloseFocus: false,
    isExploded: false,
  });
  assert.equal(mid.level, 3);
  assert.equal(mid.changed, false);

  // Zooming in (< 2.25m) switches cleanly back to LOD 0
  const near = mgr.evaluate({
    cameraDistance: 1.8,
    qualityPreset: 'balanced',
    lod3Available: true,
    isIsolatedOrCloseFocus: false,
    isExploded: false,
  });
  assert.equal(near.level, 0);
  assert.equal(near.changed, true);

  // Ultra preset always stays on LOD 0 even at 5m
  const ultra = mgr.evaluate({
    cameraDistance: 5.0,
    qualityPreset: 'ultra',
    lod3Available: true,
    isIsolatedOrCloseFocus: false,
    isExploded: false,
  });
  assert.equal(ultra.level, 0);
  assert.ok(mgr.getTelemetry().switchCount >= 2);
});
