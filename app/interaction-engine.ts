import type {
  Atlas,
  ClipAxis,
  ClippingPlaneState,
  Part,
  PartAnimationTransform,
  SceneState,
  SystemId,
} from './anatomy';
import type {
  AnatomicalAnimationSpec,
  DissectionRegistry,
} from './dissection-registry';

export interface InteractionSnapshot {
  visible: SystemId[];
  selected: string[];
  isolate: boolean;
  ghostSurroundings: boolean;
  hiddenPartIds: string[];
  partOpacities: Record<string, number>;
  systemOpacities: Partial<Record<SystemId, number>>;
  outerLayerOpacity: number;
  explode: number;
  regionalExplode: number;
  groupExplosion: { groupId: string; amount: number } | null;
  clipping: ClippingPlaneState;
  activeLayerDepthByRegion: Record<string, number>;
  activeAnimationId: string | null;
  animationPlaying: boolean;
  animationProgress: number;
  animationSpeed: number;
  animationLoop: boolean;
}

export interface InteractionEngineState extends InteractionSnapshot {
  dissectionMode: boolean;
  activeRegionId: string;
  history: InteractionSnapshot[];
  resetCounter: number;
  focusRequestCounter: number;
  focusBox: {
    min: [number, number, number];
    max: [number, number, number];
    request: number;
    viewDirection?: [number, number, number];
  } | null;
}

export const DEFAULT_CLIPPING: ClippingPlaneState = {
  enabled: false,
  axis: 'x',
  offset: 0.5,
  inverted: false,
};

const MAX_HISTORY = 40;

function cloneSnapshot(s: InteractionSnapshot): InteractionSnapshot {
  return {
    visible: [...s.visible],
    selected: [...s.selected],
    isolate: s.isolate,
    ghostSurroundings: s.ghostSurroundings,
    hiddenPartIds: [...s.hiddenPartIds],
    partOpacities: { ...s.partOpacities },
    systemOpacities: { ...s.systemOpacities },
    outerLayerOpacity: s.outerLayerOpacity,
    explode: s.explode,
    regionalExplode: s.regionalExplode,
    groupExplosion: s.groupExplosion ? { ...s.groupExplosion } : null,
    clipping: { ...s.clipping },
    activeLayerDepthByRegion: { ...s.activeLayerDepthByRegion },
    activeAnimationId: s.activeAnimationId,
    animationPlaying: s.animationPlaying,
    animationProgress: s.animationProgress,
    animationSpeed: s.animationSpeed,
    animationLoop: s.animationLoop,
  };
}

export function createInitialEngineState(defaultVisible: SystemId[]): InteractionEngineState {
  return {
    visible: [...defaultVisible],
    selected: [],
    isolate: false,
    ghostSurroundings: false,
    hiddenPartIds: [],
    partOpacities: {},
    systemOpacities: {},
    outerLayerOpacity: 1,
    explode: 0,
    regionalExplode: 0,
    groupExplosion: null,
    clipping: { ...DEFAULT_CLIPPING },
    activeLayerDepthByRegion: {},
    activeAnimationId: null,
    animationPlaying: false,
    animationProgress: 0,
    animationSpeed: 1,
    animationLoop: true,
    dissectionMode: false,
    activeRegionId: 'head-skull-neuro',
    history: [],
    resetCounter: 0,
    focusRequestCounter: 0,
    focusBox: null,
  };
}

function pushUndo(state: InteractionEngineState): InteractionSnapshot[] {
  const snap = cloneSnapshot(state);
  const next = [...state.history, snap];
  return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
}

export function hideParts(state: InteractionEngineState, partIds: string[]): InteractionEngineState {
  if (partIds.length === 0) return state;
  const hiddenSet = new Set(state.hiddenPartIds);
  let changed = false;
  for (const id of partIds) {
    if (!hiddenSet.has(id)) {
      hiddenSet.add(id);
      changed = true;
    }
  }
  if (!changed) return state;
  return {
    ...state,
    history: pushUndo(state),
    hiddenPartIds: [...hiddenSet],
    selected: state.selected.filter((id) => !hiddenSet.has(id)),
    isolate: state.isolate && state.selected.some((id) => !hiddenSet.has(id)),
  };
}

export function showParts(state: InteractionEngineState, partIds: string[]): InteractionEngineState {
  if (partIds.length === 0) return state;
  const toShow = new Set(partIds);
  const nextHidden = state.hiddenPartIds.filter((id) => !toShow.has(id));
  if (nextHidden.length === state.hiddenPartIds.length) return state;
  return {
    ...state,
    history: pushUndo(state),
    hiddenPartIds: nextHidden,
  };
}

export function restoreSingleStructure(
  state: InteractionEngineState,
  partIds: string[],
): InteractionEngineState {
  const target = new Set(partIds);
  const nextHidden = state.hiddenPartIds.filter((id) => !target.has(id));
  const nextOpacities = { ...state.partOpacities };
  let opChanged = false;
  for (const id of partIds) {
    if (nextOpacities[id] !== undefined) {
      delete nextOpacities[id];
      opChanged = true;
    }
  }
  const hiddenChanged = nextHidden.length !== state.hiddenPartIds.length;
  if (!hiddenChanged && !opChanged) return state;
  return {
    ...state,
    history: pushUndo(state),
    hiddenPartIds: nextHidden,
    partOpacities: nextOpacities,
  };
}

export function toggleIsolateParts(
  state: InteractionEngineState,
  partIds: string[],
): InteractionEngineState {
  if (!state.isolate && partIds.length === 0) return state;
  return {
    ...state,
    history: pushUndo(state),
    selected: partIds.length > 0 ? [...partIds] : state.selected,
    isolate: !state.isolate,
    ghostSurroundings: false,
    explode: 0,
  };
}

export function setStructureOpacity(
  state: InteractionEngineState,
  partIds: string[],
  opacity: number,
  recordUndo = true,
): InteractionEngineState {
  const clamped = Math.max(0.05, Math.min(1, opacity));
  const nextOpacities = { ...state.partOpacities };
  for (const id of partIds) {
    if (clamped >= 0.995) {
      delete nextOpacities[id];
    } else {
      nextOpacities[id] = clamped;
    }
  }
  return {
    ...state,
    history: recordUndo ? pushUndo(state) : state.history,
    partOpacities: nextOpacities,
  };
}

export function setSystemOpacity(
  state: InteractionEngineState,
  system: SystemId,
  opacity: number,
  recordUndo = true,
): InteractionEngineState {
  const clamped = Math.max(0.05, Math.min(1, opacity));
  const next = { ...state.systemOpacities };
  if (clamped >= 0.995) {
    delete next[system];
  } else {
    next[system] = clamped;
  }
  return {
    ...state,
    history: recordUndo ? pushUndo(state) : state.history,
    systemOpacities: next,
  };
}

export function setOuterLayerOpacity(
  state: InteractionEngineState,
  opacity: number,
  recordUndo = true,
): InteractionEngineState {
  const clamped = Math.max(0.05, Math.min(1, opacity));
  return {
    ...state,
    history: recordUndo ? pushUndo(state) : state.history,
    outerLayerOpacity: clamped >= 0.995 ? 1 : clamped,
  };
}

export function setRegionLayerDepth(
  state: InteractionEngineState,
  registry: DissectionRegistry,
  regionId: string,
  depthLevel: number,
): InteractionEngineState {
  const region = registry.regions.find((r) => r.id === regionId);
  if (!region) return state;

  const clampedDepth = Math.max(0, Math.min(region.layers.length - 1, depthLevel));
  // Collect all parts managed across all layers of this region
  const regionManagedSet = new Set<string>();
  const hiddenByDepth = new Set<string>();
  for (const layer of region.layers) {
    for (const id of layer.partIds) {
      regionManagedSet.add(id);
    }
  }
  for (let i = 0; i < clampedDepth; i++) {
    for (const id of region.layers[i].partIds) {
      hiddenByDepth.add(id);
    }
  }

  // Keep unrelated hidden parts untouched, update this region's layers cleanly
  const nextHidden = state.hiddenPartIds.filter((id) => !regionManagedSet.has(id));
  for (const id of hiddenByDepth) {
    nextHidden.push(id);
  }

  // Ensure required anatomical systems for this dissection region are turned on
  const visSet = new Set<SystemId>(state.visible);
  for (const sys of region.requiredSystems) {
    visSet.add(sys);
  }

  return {
    ...state,
    history: pushUndo(state),
    visible: [...visSet],
    hiddenPartIds: nextHidden,
    isolate: false,
    explode: 0,
    activeRegionId: regionId,
    activeLayerDepthByRegion: {
      ...state.activeLayerDepthByRegion,
      [regionId]: clampedDepth,
    },
    focusBox: {
      min: [...region.focusBounds.min],
      max: [...region.focusBounds.max],
      request: state.focusRequestCounter + 1,
    },
    focusRequestCounter: state.focusRequestCounter + 1,
  };
}

export function setGroupExplosion(
  state: InteractionEngineState,
  groupId: string | null,
  amount: number,
  recordUndo = true,
  groupPartIds?: string[],
  focusBounds?: { min: [number, number, number]; max: [number, number, number] },
  ensureSystems?: SystemId[],
): InteractionEngineState {
  const clamped = Math.max(0, Math.min(1, amount));
  const active = Boolean(groupId && clamped > 0.005);
  let nextHidden = state.hiddenPartIds;
  if (active && groupPartIds && groupPartIds.length > 0 && state.hiddenPartIds.length > 0) {
    const groupSet = new Set(groupPartIds);
    nextHidden = state.hiddenPartIds.filter((id) => !groupSet.has(id));
  }
  let nextVisible = state.visible;
  if (active && ensureSystems && ensureSystems.length > 0) {
    const visSet = new Set(state.visible);
    let added = false;
    for (const sys of ensureSystems) {
      if (!visSet.has(sys)) {
        visSet.add(sys);
        added = true;
      }
    }
    if (added) nextVisible = [...visSet];
  }
  const nextFocusReq = active && focusBounds ? state.focusRequestCounter + 1 : state.focusRequestCounter;
  return {
    ...state,
    history: recordUndo ? pushUndo(state) : state.history,
    visible: nextVisible,
    hiddenPartIds: nextHidden,
    groupExplosion: active && groupId ? { groupId, amount: clamped } : null,
    explode: 0,
    focusBox:
      active && focusBounds
        ? {
            min: [...focusBounds.min],
            max: [...focusBounds.max],
            request: nextFocusReq,
            viewDirection: [0.46, 0.14, 0.88],
          }
        : state.focusBox,
    focusRequestCounter: nextFocusReq,
  };
}

export function setRegionalExplode(
  state: InteractionEngineState,
  amount: number,
  recordUndo = true,
): InteractionEngineState {
  const clamped = Math.max(0, Math.min(1, amount));
  return {
    ...state,
    history: recordUndo ? pushUndo(state) : state.history,
    regionalExplode: clamped,
    explode: 0,
  };
}

export function setClippingState(
  state: InteractionEngineState,
  patch: Partial<ClippingPlaneState>,
  recordUndo = true,
): InteractionEngineState {
  return {
    ...state,
    history: recordUndo ? pushUndo(state) : state.history,
    clipping: {
      ...state.clipping,
      ...patch,
      offset:
        patch.offset !== undefined
          ? Math.max(0.02, Math.min(0.98, patch.offset))
          : state.clipping.offset,
    },
  };
}

export function undoLastAction(state: InteractionEngineState): InteractionEngineState {
  if (state.history.length === 0) return state;
  const previous = state.history[state.history.length - 1];
  return {
    ...state,
    ...cloneSnapshot(previous),
    history: state.history.slice(0, -1),
  };
}

export function resetEntireModel(
  state: InteractionEngineState,
  defaultVisible: SystemId[],
): InteractionEngineState {
  const base = createInitialEngineState(defaultVisible);
  return {
    ...base,
    activeRegionId: state.activeRegionId,
    resetCounter: state.resetCounter + 1,
  };
}

// ============================================================================
// PURE SPATIAL MATH HELPERS (Testable in Node without Three.js DOM)
// ============================================================================

export function partCenter(part: Part): [number, number, number] {
  return [
    (part.bounds[0][0] + part.bounds[1][0]) * 0.5,
    (part.bounds[0][1] + part.bounds[1][1]) * 0.5,
    (part.bounds[0][2] + part.bounds[1][2]) * 0.5,
  ];
}

export function axisAngleToQuaternion(
  axis: [number, number, number],
  angleRad: number,
): [number, number, number, number] {
  const len = Math.hypot(axis[0], axis[1], axis[2]) || 1;
  const half = angleRad * 0.5;
  const s = Math.sin(half) / len;
  return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(half)];
}

/** Smoothly evaluates kinematic rigid transforms for a registered animation at normalized progress [0..1] */
export function evaluateAnimationPartTransforms(
  spec: AnatomicalAnimationSpec | undefined,
  progress: number,
  loop: boolean,
): Record<string, PartAnimationTransform> {
  const out: Record<string, PartAnimationTransform> = {};
  if (!spec || spec.status !== 'supported_rigid' || spec.rigidMotions.length === 0) {
    return out;
  }
  const t = Math.max(0, Math.min(1, progress));
  // Loop animations smoothly ping-pong 0 -> 1 -> 0; one-shot animations ease-in-out 0 -> 1
  const raw = loop ? 0.5 - 0.5 * Math.cos(t * Math.PI * 2) : t * t * (3 - 2 * t);

  for (const m of spec.rigidMotions) {
    const tr: [number, number, number] = m.maxTranslation
      ? [m.maxTranslation[0] * raw, m.maxTranslation[1] * raw, m.maxTranslation[2] * raw]
      : [0, 0, 0];
    out[m.partId] = {
      pivot: [...m.pivot],
      rotation: axisAngleToQuaternion(m.axis, m.maxAngleRad * raw),
      translation: tr,
    };
  }
  return out;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Computes reversible two-stage (extract outward -> radial explode) transforms for group or whole-model separation */
export function computeDirectionalSeparationTransforms(
  atlas: Atlas,
  registry: DissectionRegistry,
  groupExplosion: { groupId: string; amount: number } | null,
  regionalExplode: number,
): Record<string, PartAnimationTransform> {
  const out: Record<string, PartAnimationTransform> = {};
  const bodyCenter: [number, number, number] = [0, 0.92, 0];

  if (groupExplosion && groupExplosion.amount > 0.001) {
    const group = registry.groups.find((g) => g.id === groupExplosion.groupId);
    if (group) {
      const partMap = new Map(atlas.parts.map((p) => [p.id, p]));
      const amt = Math.max(0, Math.min(1, groupExplosion.amount));
      // Stage 1 (0 -> 0.42): extract intact anatomical group clear of overlying body walls
      const extractT = smoothstep(0.0, 0.42, amt);
      // Stage 2 (0.42 -> 1.0): radially fan individual parts out around the extracted center
      const explodeT = smoothstep(0.42, 1.0, amt);
      const ex = group.extractionVector[0] * extractT;
      const ey = group.extractionVector[1] * extractT;
      const ez = group.extractionVector[2] * extractT;
      const radScale = group.explodeRadius * explodeT;
      const bx = group.biasVector?.[0] ?? 0;
      const by = group.biasVector?.[1] ?? 0;
      const bz = group.biasVector?.[2] ?? 0;

      for (const pid of group.partIds) {
        const part = partMap.get(pid);
        if (!part) continue;
        const c = partCenter(part);
        const dx = c[0] - group.anchorCenter[0];
        const dy = c[1] - group.anchorCenter[1];
        const dz = c[2] - group.anchorCenter[2];
        const dist = Math.hypot(dx, dy, dz);
        const ux = dist > 1e-4 ? dx / dist : 0;
        const uy = dist > 1e-4 ? dy / dist : 0;
        const uz = dist > 1e-4 ? dz / dist : 1;
        out[pid] = {
          pivot: c,
          rotation: [0, 0, 0, 1],
          translation: [
            ex + (ux * 0.88 + bx * 2.0) * radScale,
            ey + (uy * 0.88 + by * 2.0) * radScale,
            ez + (uz * 0.88 + bz * 2.0) * radScale,
          ],
        };
      }
    }
  }

  if (regionalExplode > 0.001) {
    const amt = regionalExplode;
    for (const part of atlas.parts) {
      const c = partCenter(part);
      const dx = c[0] - bodyCenter[0];
      const dy = (c[1] - bodyCenter[1]) * 0.45;
      const dz = c[2] - bodyCenter[2];
      const dist = Math.hypot(dx, dy, dz) || 0.001;
      const radial = 0.28 * amt;
      const existing = out[part.id];
      const tx = (dx / dist) * radial + (existing?.translation[0] ?? 0);
      const ty = (dy / dist) * radial + (existing?.translation[1] ?? 0);
      const tz = (dz / dist) * radial + (existing?.translation[2] ?? 0);
      out[part.id] = {
        pivot: c,
        rotation: existing?.rotation ?? [0, 0, 0, 1],
        translation: [tx, ty, tz],
      };
    }
  }

  return out;
}

export function mergePartTransforms(
  a: Record<string, PartAnimationTransform>,
  b: Record<string, PartAnimationTransform>,
): Record<string, PartAnimationTransform> {
  if (Object.keys(b).length === 0) return a;
  if (Object.keys(a).length === 0) return b;
  const merged: Record<string, PartAnimationTransform> = { ...a };
  for (const [id, tb] of Object.entries(b)) {
    const ta = merged[id];
    if (!ta) {
      merged[id] = tb;
    } else {
      const hasRotA = ta.rotation[0] !== 0 || ta.rotation[1] !== 0 || ta.rotation[2] !== 0;
      merged[id] = {
        pivot: hasRotA ? ta.pivot : tb.pivot,
        rotation: hasRotA ? ta.rotation : tb.rotation,
        translation: [
          ta.translation[0] + tb.translation[0],
          ta.translation[1] + tb.translation[1],
          ta.translation[2] + tb.translation[2],
        ],
      };
    }
  }
  return merged;
}

/** Converts normalized clipping plane state into Three.js plane normal & constant: dot(normal, p) + constant >= 0 is KEPT */
export function computeClipPlaneEquation(
  clipping: ClippingPlaneState,
  bounds: { min: [number, number, number]; max: [number, number, number] },
): { normal: [number, number, number]; constant: number; worldCoordinate: number } {
  const idx = clipping.axis === 'x' ? 0 : clipping.axis === 'y' ? 1 : 2;
  const minVal = bounds.min[idx];
  const maxVal = bounds.max[idx];
  const worldCoord = minVal + (maxVal - minVal) * clipping.offset;
  const sign = clipping.inverted ? 1 : -1;
  const normal: [number, number, number] = [
    clipping.axis === 'x' ? sign : 0,
    clipping.axis === 'y' ? sign : 0,
    clipping.axis === 'z' ? sign : 0,
  ];
  // Three.js Plane keeps points where dot(normal, p) + constant >= 0
  // When sign = -1 (default), keeps p <= worldCoord => -p + worldCoord >= 0 => constant = worldCoord
  // When sign = +1 (inverted), keeps p >= worldCoord => +p - worldCoord >= 0 => constant = -worldCoord
  const constant = clipping.inverted ? -worldCoord : worldCoord;
  return { normal, constant, worldCoordinate: worldCoord };
}

export function isPointClippedOut(
  point: [number, number, number],
  clipping: ClippingPlaneState,
  bounds: { min: [number, number, number]; max: [number, number, number] },
): boolean {
  if (!clipping.enabled) return false;
  const { normal, constant } = computeClipPlaneEquation(clipping, bounds);
  const signedDistance =
    normal[0] * point[0] + normal[1] * point[1] + normal[2] * point[2] + constant;
  return signedDistance < 0;
}

export function buildSceneStateFromEngine(
  engine: InteractionEngineState,
  registry: DissectionRegistry,
  atlas: Atlas,
  base: Pick<SceneState, 'interactionMode' | 'view' | 'rotate' | 'zoomStep'>,
): SceneState {
  const animSpec = engine.activeAnimationId
    ? registry.animations.find((a) => a.id === engine.activeAnimationId)
    : undefined;
  const animTransforms = evaluateAnimationPartTransforms(
    animSpec,
    engine.animationProgress,
    engine.animationLoop,
  );
  const sepTransforms = computeDirectionalSeparationTransforms(
    atlas,
    registry,
    engine.groupExplosion,
    engine.regionalExplode,
  );

  // Merge outerLayerOpacity onto integumentary system if lowered
  const systemOpacities: Partial<Record<SystemId, number>> = { ...engine.systemOpacities };
  if (engine.outerLayerOpacity < 0.995) {
    const currentSkin = systemOpacities.integumentary ?? 1;
    systemOpacities.integumentary = Math.min(currentSkin, engine.outerLayerOpacity);
  }

  // Gently X-Ray overlying chest/skull walls while an internal group is extracted & exploded
  let pinnedOpaquePartIds: string[] | undefined;
  if (engine.groupExplosion && engine.groupExplosion.amount > 0.005) {
    const activeGroup = registry.groups.find((g) => g.id === engine.groupExplosion?.groupId);
    if (activeGroup) {
      pinnedOpaquePartIds = activeGroup.partIds;
      if (activeGroup.overlyingFadeSystems) {
        const fadeBlend = Math.min(1, engine.groupExplosion.amount / 0.35);
        for (const [sysKey, targetOp] of Object.entries(activeGroup.overlyingFadeSystems)) {
          const sys = sysKey as SystemId;
          if (targetOp === undefined) continue;
          const blended = 1 - (1 - targetOp) * fadeBlend;
          systemOpacities[sys] = Math.min(systemOpacities[sys] ?? 1, blended);
        }
      }
    }
  }

  return {
    explode: engine.explode,
    visible: engine.visible,
    selected: engine.selected,
    isolate: engine.isolate,
    ghostSurroundings: engine.ghostSurroundings,
    interactionMode: base.interactionMode,
    view: base.view,
    rotate: base.rotate,
    reset: engine.resetCounter,
    zoomStep: base.zoomStep,
    focusRequest: engine.focusRequestCounter,
    hiddenPartIds: engine.hiddenPartIds,
    partOpacities: engine.partOpacities,
    systemOpacities,
    pinnedOpaquePartIds,
    outerLayerOpacity: engine.outerLayerOpacity,
    regionalExplode: engine.regionalExplode,
    groupExplosion: engine.groupExplosion,
    clipping: engine.clipping,
    partTransforms: mergePartTransforms(animTransforms, sepTransforms),
    focusBox: engine.focusBox,
  };
}

export function getAxisLabel(axis: ClipAxis): string {
  if (axis === 'x') return 'Sagittal (X)';
  if (axis === 'y') return 'Axial (Y)';
  return 'Coronal (Z)';
}
