import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { DEFAULT_VISIBLE, type Atlas } from './anatomy';
import { buildDissectionRegistry } from './dissection-registry';
import {
  buildSceneStateFromEngine,
  computeClipPlaneEquation,
  computeDirectionalSeparationTransforms,
  createInitialEngineState,
  evaluateAnimationPartTransforms,
  hideParts,
  isPointClippedOut,
  resetEntireModel,
  restoreSingleStructure,
  setClippingState,
  setGroupExplosion,
  setOuterLayerOpacity,
  setRegionLayerDepth,
  setRegionalExplode,
  setStructureOpacity,
  setSystemOpacity,
  showParts,
  toggleIsolateParts,
  undoLastAction,
} from './interaction-engine';

const atlasPath = path.resolve(process.cwd(), 'public/models/atlas.json');
const atlas = JSON.parse(fs.readFileSync(atlasPath, 'utf8')) as Atlas;
const registry = buildDissectionRegistry(atlas);

test('hide, multi-selection hide, undo last action, single restore, and reset entire model', () => {
  let st = createInitialEngineState(DEFAULT_VISIBLE);
  st = { ...st, selected: ['FJ3200', 'FJ3274'] };

  // Hide frontal bone and left parietal bone
  st = hideParts(st, ['FJ3200', 'FJ3274']);
  assert.deepEqual(st.hiddenPartIds, ['FJ3200', 'FJ3274']);
  assert.deepEqual(st.selected, [], 'Hidden parts are cleared from active selection');
  assert.equal(st.history.length, 1);

  // Hide occipital bone too
  st = hideParts(st, ['FJ3309']);
  assert.deepEqual(st.hiddenPartIds, ['FJ3200', 'FJ3274', 'FJ3309']);
  assert.equal(st.history.length, 2);

  // Undo restores previous state (only FJ3200, FJ3274 hidden)
  st = undoLastAction(st);
  assert.deepEqual(st.hiddenPartIds, ['FJ3200', 'FJ3274']);
  assert.equal(st.history.length, 1);

  // Single-structure restore of FJ3200 leaves FJ3274 hidden
  st = restoreSingleStructure(st, ['FJ3200']);
  assert.deepEqual(st.hiddenPartIds, ['FJ3274']);

  // Show remaining hidden part
  st = showParts(st, ['FJ3274']);
  assert.deepEqual(st.hiddenPartIds, []);

  // Full reset clears opacity, clipping, explosion, and active animations
  st = setStructureOpacity(st, ['FJ3289'], 0.35);
  st = setClippingState(st, { enabled: true, axis: 'y', offset: 0.7 });
  st = setGroupExplosion(st, 'cranial-vault', 0.8);
  st = { ...st, activeAnimationId: 'jaw-tmj-depression', animationPlaying: true, animationProgress: 0.45 };

  const reset = resetEntireModel(st, DEFAULT_VISIBLE);
  assert.deepEqual(reset.hiddenPartIds, []);
  assert.deepEqual(reset.partOpacities, {});
  assert.equal(reset.clipping.enabled, false);
  assert.equal(reset.groupExplosion, null);
  assert.equal(reset.activeAnimationId, null);
  assert.equal(reset.animationPlaying, false);
  assert.equal(reset.resetCounter, st.resetCounter + 1);
});

test('progressive depth-layer sequence removes cranial layers cleanly and reverses via undo', () => {
  let st = createInitialEngineState(DEFAULT_VISIBLE);
  const step0 = setRegionLayerDepth(st, registry, 'head-skull-neuro', 0);
  assert.equal(step0.hiddenPartIds.length, 0);

  // Step 2 removes superficial scalp + cranial vault bones (Frontal, Parietals, Occipital, Temporals)
  const step2 = setRegionLayerDepth(step0, registry, 'head-skull-neuro', 2);
  assert.ok(step2.hiddenPartIds.includes('FJ3200'), 'Frontal bone removed at depth 2');
  assert.ok(step2.hiddenPartIds.includes('FJ3274'), 'Left parietal bone removed at depth 2');
  assert.ok(step2.hiddenPartIds.includes('FJ3309'), 'Occipital bone removed at depth 2');
  assert.ok(step2.visible.includes('nervous'), 'Intracranial nervous system auto-enabled');
  assert.ok(!step2.hiddenPartIds.includes('FJ1843'), 'Tentorium cerebelli still visible at depth 2');

  // Step 4 removes facial/base + tentorium + outer cerebral cortex
  const step4 = setRegionLayerDepth(step2, registry, 'head-skull-neuro', 4);
  assert.ok(step4.hiddenPartIds.includes('FJ1843'), 'Tentorium cerebelli removed at depth 4');
  assert.ok(step4.hiddenPartIds.includes('FJ1833'), 'Superior frontal gyrus removed at depth 4');
  assert.ok(!step4.hiddenPartIds.includes('FJ1782'), 'Deep thalamus remains exposed at depth 4');

  // Undo restores depth 2 cleanly
  const back = undoLastAction(step4);
  assert.equal(back.activeLayerDepthByRegion['head-skull-neuro'], 2);
  assert.ok(!back.hiddenPartIds.includes('FJ1843'));
});

test('X-Ray transparency per structure, per system, and outer layer builds clean opacities and restores', () => {
  let st = createInitialEngineState(DEFAULT_VISIBLE);
  st = setStructureOpacity(st, ['FJ3200'], 0.25);
  st = setSystemOpacity(st, 'skeletal', 0.4);
  st = setOuterLayerOpacity(st, 0.2);

  const scene = buildSceneStateFromEngine(st, registry, atlas, {
    interactionMode: 'orbit',
    view: 'three-quarter',
    rotate: false,
  });

  assert.equal(scene.partOpacities?.FJ3200, 0.25);
  assert.equal(scene.systemOpacities?.skeletal, 0.4);
  assert.equal(scene.systemOpacities?.integumentary, 0.2);

  // Restore structure opacity back to 1 removes key cleanly
  st = setStructureOpacity(st, ['FJ3200'], 1.0);
  assert.equal(st.partOpacities.FJ3200, undefined);

  st = toggleIsolateParts(st, ['FJ1796']);
  assert.equal(st.isolate, true);
  assert.deepEqual(st.selected, ['FJ1796']);
});

test('two-stage directional group explosion emerges clear of body walls for all 7 groups and restores cleanly', () => {
  const partMap = new Map(atlas.parts.map((p) => [p.id, p]));

  // Stage 1 (amount = 0.42): Cavity of right ventricle + all heart chambers move forward intact clear of chest wall
  const stage1Heart = computeDirectionalSeparationTransforms(
    atlas,
    registry,
    { groupId: 'heart-chambers', amount: 0.42 },
    0,
  );
  const rvcStage1 = stage1Heart.FJ2423;
  assert.ok(rvcStage1, 'Cavity of right ventricle FJ2423 receives transform');
  assert.ok(rvcStage1.translation[2] >= 0.24, 'Stage 1 translates Cavity of right ventricle anteriorly >= 24cm');

  // Verify zero relative dispersion across Stage 1 (moves as a cohesive intact heart)
  const heartGroup = registry.groups.find((g) => g.id === 'heart-chambers')!;
  for (const pid of heartGroup.partIds) {
    const tr = stage1Heart[pid].translation;
    assert.ok(
      Math.hypot(
        tr[0] - rvcStage1.translation[0],
        tr[1] - rvcStage1.translation[1],
        tr[2] - rvcStage1.translation[2],
      ) < 1e-6,
      `Part ${pid} should translate rigidly with heart at Stage 1 boundary`,
    );
  }

  // Stage 2 (amount = 1.0): verify full anterior/lateral clearance for ALL 7 anatomical groups
  const sternalRibMaxZ = Math.max(
    partMap.get('FJ3140')?.bounds[1][2] ?? 0.114,
    0.114,
  );
  const skullAnteriorMaxZ = 0.108;
  const ribcageMaxX = 0.144;

  const fullHeart = computeDirectionalSeparationTransforms(
    atlas,
    registry,
    { groupId: 'heart-chambers', amount: 1.0 },
    0,
  );
  for (const pid of heartGroup.partIds) {
    const p = partMap.get(pid)!;
    const translatedMinZ = p.bounds[0][2] + fullHeart[pid].translation[2];
    assert.ok(
      translatedMinZ > sternalRibMaxZ - 0.015,
      `Heart part ${pid} (${p.name}) minZ=${translatedMinZ.toFixed(3)} must clear thoracic cage in front of sternum`,
    );
  }
  const rvcFull = fullHeart.FJ2423;
  assert.ok(
    partMap.get('FJ2423')!.bounds[0][2] + rvcFull.translation[2] > sternalRibMaxZ + 0.04,
    'Cavity of right ventricle (FJ2423) explodes cleanly anterior to sternum',
  );

  // Verify intracranial brain & ocular orbit emerge anteriorly in front of brow/maxilla
  for (const gid of ['intracranial-brain', 'ocular-orbit', 'facial-skeleton', 'thoracic-cage'] as const) {
    const grp = registry.groups.find((g) => g.id === gid)!;
    const trMap = computeDirectionalSeparationTransforms(
      atlas,
      registry,
      { groupId: gid, amount: 1.0 },
      0,
    );
    const avgMovedCenterZ =
      grp.partIds.reduce((acc, pid) => {
        const p = partMap.get(pid)!;
        return acc + (p.bounds[0][2] + p.bounds[1][2]) * 0.5 + trMap[pid].translation[2];
      }, 0) / grp.partIds.length;
    assert.ok(
      avgMovedCenterZ > skullAnteriorMaxZ + 0.08,
      `Group ${gid} average center Z=${avgMovedCenterZ.toFixed(3)} must emerge clearly anteriorly`,
    );
  }

  // Cranial vault elevates superiorly above cranial base
  const vaultGroup = registry.groups.find((g) => g.id === 'cranial-vault')!;
  const fullVault = computeDirectionalSeparationTransforms(
    atlas,
    registry,
    { groupId: 'cranial-vault', amount: 1.0 },
    0,
  );
  assert.ok(fullVault.FJ3200.translation[1] > 0.12, 'Frontal bone elevates superiorly');
  assert.ok(fullVault.FJ3200.translation[2] > fullVault.FJ3309.translation[2], 'Frontal separates anteriorly from occipital');

  // Left upper limb translates laterally clear of chest ribcage
  const armGroup = registry.groups.find((g) => g.id === 'left-upper-limb')!;
  const fullArm = computeDirectionalSeparationTransforms(
    atlas,
    registry,
    { groupId: 'left-upper-limb', amount: 1.0 },
    0,
  );
  const avgArmX =
    armGroup.partIds.reduce((acc, pid) => {
      const p = partMap.get(pid)!;
      return acc + (p.bounds[0][0] + p.bounds[1][0]) * 0.5 + fullArm[pid].translation[0];
    }, 0) / armGroup.partIds.length;
  assert.ok(avgArmX > ribcageMaxX + 0.22, 'Left upper limb bones separate laterally clear of thorax');

  // Verify buildSceneStateFromEngine applies gentle overlying X-Ray & pins all group members solid (incl. papillary muscles)
  let heartState = createInitialEngineState(DEFAULT_VISIBLE);
  heartState = setGroupExplosion(
    heartState,
    'heart-chambers',
    1.0,
    true,
    heartGroup.partIds,
    heartGroup.extractedFocusBounds,
    ['cardiac', 'arterial', 'venous', 'muscular'],
  );
  const heartScene = buildSceneStateFromEngine(heartState, registry, atlas, {
    interactionMode: 'orbit',
    view: 'three-quarter',
    rotate: false,
  });
  assert.ok((heartScene.systemOpacities?.muscular ?? 1) <= 0.35, 'Overlying chest musculature fades to X-Ray');
  assert.ok((heartScene.systemOpacities?.skeletal ?? 1) <= 0.38, 'Overlying rib cage fades to X-Ray');
  assert.ok(heartScene.pinnedOpaquePartIds?.includes('FJ2423'), 'Cavity of right ventricle pinned solid');
  assert.ok(heartScene.pinnedOpaquePartIds?.includes('FJ2418'), 'Heart papillary muscle in muscular system pinned solid');
  assert.ok(heartScene.focusBox?.viewDirection, '3/4 viewDirection requested on group focusBox');

  // Reassembly & Undo cleanly clear overlying fades & pinned IDs
  const undoneHeart = undoLastAction(heartState);
  const undoneScene = buildSceneStateFromEngine(undoneHeart, registry, atlas, {
    interactionMode: 'orbit',
    view: 'three-quarter',
    rotate: false,
  });
  assert.equal(undoneScene.pinnedOpaquePartIds, undefined);
  assert.equal(undoneScene.systemOpacities?.muscular, undefined);
  assert.deepEqual(computeDirectionalSeparationTransforms(atlas, registry, null, 0), {});

  let st = createInitialEngineState(DEFAULT_VISIBLE);
  st = setRegionalExplode(st, 0.5);
  const regionScene = buildSceneStateFromEngine(st, registry, atlas, {
    interactionMode: 'orbit',
    view: 'three-quarter',
    rotate: false,
  });
  assert.ok(Object.keys(regionScene.partTransforms ?? {}).length > 2000);

  // Exploding a previously dissected group automatically restores its hidden bones
  const hiddenVault = hideParts(createInitialEngineState(DEFAULT_VISIBLE), ['FJ3200', 'FJ3274']);
  assert.ok(hiddenVault.hiddenPartIds.includes('FJ3200'));
  const explodedVault = setGroupExplosion(
    hiddenVault,
    'cranial-vault',
    0.6,
    true,
    vaultGroup.partIds,
  );
  assert.ok(!explodedVault.hiddenPartIds.includes('FJ3200'), 'Hidden vault bone unhides on group explode');
  assert.ok(!explodedVault.hiddenPartIds.includes('FJ3274'));
});

test('cross-section clipping math computes plane equations and filters clipped points accurately', () => {
  const bounds = {
    min: [-0.4, 0.0, -0.2] as [number, number, number],
    max: [0.4, 1.8, 0.2] as [number, number, number],
  };
  const clip = { enabled: true, axis: 'x' as const, offset: 0.5, inverted: false };
  const eq = computeClipPlaneEquation(clip, bounds);
  assert.deepEqual(eq.normal, [-1, 0, 0]);
  assert.ok(Math.abs(eq.constant - 0) < 1e-6);

  // Default direction keeps x <= 0, clips x > 0
  assert.equal(isPointClippedOut([0.2, 1.0, 0], clip, bounds), true);
  assert.equal(isPointClippedOut([-0.2, 1.0, 0], clip, bounds), false);

  // Inverted flips direction: keeps x >= 0, clips x < 0
  const inv = { ...clip, inverted: true };
  assert.equal(isPointClippedOut([0.2, 1.0, 0], inv, bounds), false);
  assert.equal(isPointClippedOut([-0.2, 1.0, 0], inv, bounds), true);
});

test('rigid joint animations evaluate exact quaternion pivots cleanly without static mesh distortion', () => {
  const tmj = registry.animations.find((a) => a.id === 'jaw-tmj-depression')!;
  const rest = evaluateAnimationPartTransforms(tmj, 0, true);
  assert.ok(rest.FJ3289);
  assert.ok(Math.abs(rest.FJ3289.rotation[0]) < 1e-6, 'At t=0 loop, jaw rotation angle is 0');
  assert.equal(rest.FJ3289.rotation[3], 1);

  const mid = evaluateAnimationPartTransforms(tmj, 0.5, true);
  assert.ok(mid.FJ3289.rotation[0] > 0.1, 'At t=0.5 loop, mandible rotates open around X axis');
  assert.deepEqual(mid.FJ3289.pivot, [0, 1.576, 0.002]);
});
