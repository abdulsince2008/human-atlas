import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { Atlas } from './anatomy';
import {
  SURGICAL_ANATOMY_REGIONS,
  SURGICAL_EDUCATION_DISCLAIMER,
  resolveSurgicalRegionLayers,
} from './data/surgical-anatomy';
import { buildAnatomyCoverageMatrix } from './data/coverage-matrix';
import { resolvePartMaterialProps } from './tissue-materials';
import {
  EDUCATIONAL_EVIDENCE_RECORDS,
  ONTOLOGY_PROVENANCE,
  TERMINOLOGY_PROVENANCE,
  validateProvenanceIntegrity,
} from './data/provenance-registry';
import { CLINICAL_CASES } from './data/clinical-data';
import { HISTOLOGY_ENTRIES } from './data/histology-data';

const atlas = JSON.parse(
  fs.readFileSync(path.resolve('public/models/atlas.json'), 'utf8'),
) as Atlas;

test('all 10 surgical-anatomy regions resolve real BodyParts3D meshes and keep variations concept-only', () => {
  assert.equal(SURGICAL_ANATOMY_REGIONS.length, 10, 'Expected 10 core surgical-anatomy regions');
  assert.ok(
    SURGICAL_EDUCATION_DISCLAIMER.includes('not a certified surgical simulator'),
    'Must include explicit non-clinical safety disclaimer',
  );

  for (const region of SURGICAL_ANATOMY_REGIONS) {
    const resolved = resolveSurgicalRegionLayers(region, atlas);
    assert.ok(resolved.length >= 2, `Region "${region.id}" must have >= 2 dissection layers`);
    const totalMatched = resolved.reduce((acc, layer) => acc + layer.partIds.length, 0);
    assert.ok(
      totalMatched >= 4,
      `Region "${region.id}" should resolve >= 4 real BodyParts3D meshes, got ${totalMatched}`,
    );
    for (const v of region.variations) {
      assert.equal(
        v.has3DGeometry,
        false,
        `Variation "${v.id}" in "${region.id}" must be marked has3DGeometry: false`,
      );
    }
  }
});

test('12-system anatomical coverage matrix truthfully accounts for all 2,234 atlas meshes', () => {
  const rows = buildAnatomyCoverageMatrix(atlas);
  assert.equal(rows.length, 12, 'Coverage matrix must include all 12 canonical systems');
  const sumParts = rows.reduce((acc, row) => acc + row.meshCount, 0);
  assert.equal(sumParts, atlas.parts.length, 'Per-system mesh totals must equal atlas.parts.length');
  for (const row of rows) {
    assert.ok(row.honestLimitationNote.length > 0, `System "${row.systemId}" must list honest limitations`);
  }
});

test('per-part PBR material lookup assigns physically plausible roughness and metalness <= 0.05 to all 2,234 parts', () => {
  const props = resolvePartMaterialProps(atlas);
  assert.equal(Object.keys(props).length, atlas.parts.length);
  for (const [id, p] of Object.entries(props)) {
    assert.ok(p.roughness >= 0.2 && p.roughness <= 0.92, `Part ${id} roughness out of range: ${p.roughness}`);
    assert.ok(p.metalness >= 0 && p.metalness <= 0.05, `Part ${id} biological metalness too high: ${p.metalness}`);
    assert.ok(p.microDetail >= 0 && p.microDetail <= 1, `Part ${id} microDetail out of range: ${p.microDetail}`);
  }
});

test('provenance registry enforces FMA CUSTOM license, TA2 CC BY-ND 4.0, and zero false expert_verified records', () => {
  assert.ok(ONTOLOGY_PROVENANCE.license.includes('CUSTOM'));
  assert.ok(!ONTOLOGY_PROVENANCE.license.includes('CC BY 4.0'));
  assert.ok(TERMINOLOGY_PROVENANCE.license.includes('CC BY-ND 4.0'));
  const check = validateProvenanceIntegrity();
  assert.equal(check.valid, true, check.errors.join('; '));
  for (const rec of EDUCATIONAL_EVIDENCE_RECORDS) {
    assert.notEqual(
      rec.reviewStatus,
      'expert_verified',
      `Record "${rec.id}" must not claim expert_verified without an actual named human reviewer`,
    );
  }
});

test('expanded clinical (10 cases) and histology (10 entries with self-checks) libraries are complete', () => {
  assert.equal(CLINICAL_CASES.length, 10, 'Expected 10 clinical correlation cases');
  assert.equal(HISTOLOGY_ENTRIES.length, 10, 'Expected 10 histology & microanatomy entries');
  for (const h of HISTOLOGY_ENTRIES) {
    assert.ok(h.selfCheck, `Histology entry "${h.id}" should include an interactive selfCheck`);
    assert.ok(h.selfCheck!.options.length >= 3, `Histology "${h.id}" selfCheck needs >= 3 options`);
    assert.equal(h.specimenSlot.mediaStatus, 'text_only_import_ready');
  }
});
