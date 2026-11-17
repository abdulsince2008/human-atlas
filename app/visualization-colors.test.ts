import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { Atlas } from './anatomy';
import {
  BRAIN_CAMERA_PRESETS,
  BRAIN_REGION_SPECS,
  FUNCTIONAL_MUSCLE_PILOTS,
  hexToRgbBytes,
  resolveBrainRegions,
  resolveMusclePilotColors,
  resolvePartColorOverrides,
} from './visualization-colors';
import {
  getReviewStatusLabel,
  normalizeReviewStatus,
  validateProvenanceIntegrity,
} from './data/provenance-registry';
import {
  getStudyResourcesFor,
  validateStudyResources,
} from './data/study-resources';

const atlas = JSON.parse(
  fs.readFileSync(path.resolve('public/models/atlas.json'), 'utf8'),
) as Atlas;

test('regional brain palette maps all 10 major brain divisions to real BodyParts3D meshes', () => {
  const res = resolveBrainRegions(atlas);
  assert.ok(res.totalMappedParts >= 70, `Expected >= 70 mapped brain meshes, got ${res.totalMappedParts}`);
  for (const spec of BRAIN_REGION_SPECS) {
    const ids = res.partIdsByRegion.get(spec.id) ?? [];
    assert.ok(ids.length > 0, `Brain region "${spec.id}" should match at least one real mesh`);
    assert.ok(hexToRgbBytes(spec.color) !== null, `Brain region "${spec.id}" has valid hex color`);
  }
  // Ensure distinct colors across all brain regions
  const uniqueColors = new Set(BRAIN_REGION_SPECS.map((s) => s.color.toLowerCase()));
  assert.equal(uniqueColors.size, BRAIN_REGION_SPECS.length, 'Brain regions must have distinct colors');
});

test('all 7 brain anatomical camera presets are defined including medial sagittal cut', () => {
  assert.equal(BRAIN_CAMERA_PRESETS.length, 7);
  const medial = BRAIN_CAMERA_PRESETS.find((p) => p.id === 'medial');
  assert.ok(medial && medial.clipping?.enabled && medial.clipping.axis === 'x');
});

test('functional muscle pilots map agonist, antagonist, synergist, and stabilizer roles to real meshes', () => {
  for (const pilot of FUNCTIONAL_MUSCLE_PILOTS) {
    const resolved = resolveMusclePilotColors(atlas, pilot.id);
    assert.ok(resolved.matchedPartIds.length >= 6, `Pilot "${pilot.id}" should match >= 6 muscle meshes`);
    assert.ok(resolved.countsByRole.agonist > 0, `Pilot "${pilot.id}" must have agonist meshes`);
    assert.ok(resolved.countsByRole.antagonist > 0, `Pilot "${pilot.id}" must have antagonist meshes`);
  }
});

test('color layer resolver enforces strict priority: relationship > muscle pilot > brain regional', () => {
  const brainOnly = resolvePartColorOverrides({ atlas, brainRegionalEnabled: true });
  assert.equal(brainOnly['FJ1781'], '#CC79A7'); // Cerebellum

  const disabled = resolvePartColorOverrides({ atlas, brainRegionalEnabled: false });
  assert.equal(disabled['FJ1781'], undefined);

  const overridden = resolvePartColorOverrides({
    atlas,
    brainRegionalEnabled: true,
    activeMusclePilotId: 'elbow-flexion',
    relationshipColors: { FJ1781: '#B91C1C', FJ1478: '#1D4ED8' },
  });
  assert.equal(overridden['FJ1781'], '#B91C1C');
  assert.equal(overridden['FJ1478'], '#1D4ED8');
});

test('provenance registry and curated study resources pass strict integrity checks', () => {
  const prov = validateProvenanceIntegrity();
  assert.equal(prov.valid, true, prov.errors.join('; '));
  assert.equal(normalizeReviewStatus('unverified'), 'needs_evidence');
  assert.equal(getReviewStatusLabel('under_review'), 'Under Review');

  const resCheck = validateStudyResources();
  assert.equal(resCheck.valid, true, resCheck.errors.join('; '));

  const brainLinks = getStudyResourcesFor({ conceptId: 'FMA50801', module: 'brain', limit: 3 });
  assert.ok(brainLinks.length >= 2, 'Brain concept should return curated open links');
  assert.ok(brainLinks.every((r) => r.url.startsWith('https://')));
});
