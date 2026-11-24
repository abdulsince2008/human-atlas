import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resolveClinicalCaseTarget,
  resolveHistologyTarget,
  resolvePhysiologyTarget,
} from './utils/deep-link-resolver';

test('resolvePhysiologyTarget resolves module IDs and system IDs deterministically', () => {
  assert.equal(resolvePhysiologyTarget('renal-filtration', null), 'renal-filtration');
  assert.equal(resolvePhysiologyTarget(null, 'respiratory'), 'respiratory-ventilation');
  assert.equal(resolvePhysiologyTarget(null, 'urinary'), 'renal-filtration');
  assert.equal(resolvePhysiologyTarget(null, 'muscular'), 'antagonistic-elbow');
  assert.equal(resolvePhysiologyTarget('unknown-id', null), 'cardiac-cycle');
});

test('resolveClinicalCaseTarget resolves case IDs and system IDs deterministically', () => {
  const byId = resolveClinicalCaseTarget('case-phrenic-diaphragm-ventilation', null);
  assert.equal(byId.id, 'case-phrenic-diaphragm-ventilation');

  const bySys = resolveClinicalCaseTarget(null, 'cardiovascular');
  assert.equal(bySys.systemId, 'cardiovascular');

  const resp = resolveClinicalCaseTarget(null, 'respiratory');
  assert.equal(resp.systemId, 'respiratory');
});

test('resolveHistologyTarget resolves entry IDs and system IDs deterministically', () => {
  const exact = resolveHistologyTarget('hist-organ-renal-corpuscle', null);
  assert.equal(exact.id, 'hist-organ-renal-corpuscle');

  const bySys = resolveHistologyTarget(null, 'nervous');
  assert.equal(bySys.id, 'hist-nervous-cortex');

  const bone = resolveHistologyTarget(null, 'skeletal');
  assert.equal(bone.id, 'hist-connective-osteon');
});
