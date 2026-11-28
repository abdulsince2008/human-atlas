import { useEffect, useRef } from 'react';
import * as T from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  SYSTEMS,
  type Atlas,
  type ClippingPlaneState,
  type Part,
  type SceneRelationshipEdge,
  type SceneState,
  type SystemId,
} from './anatomy';
import { createExplosionLayout } from './explosion-layout';
import {
  isPartHiddenForSex,
  loadFemaleAtlasManifest,
  loadMaleEnhancementsManifest,
  loadOptionalPregnancyManifest,
  loadSharedEnhancementsManifest,
  type OverlayManifest,
} from './atlas-layers';
import { computeClipPlaneEquation } from './interaction-engine';
import { decodeModelResponse } from './model-download';
import { PointerTap } from './pointer-tap';
import {
  classifyPartTissue,
  RENDER_QUALITY_PRESETS,
  resolvePartMaterialProps,
  TISSUE_MATERIAL_PRESETS,
} from './tissue-materials';
import { hexToRgbBytes } from './visualization-colors';
import { ensureAnatomicalUVs } from './graphics/uv-generator';
import { createTissueTextureLibrary } from './graphics/tissue-textures';
import { AnatomicalLodManager } from './graphics/lod-manager';

interface Props {
  atlas: Atlas;
  state: SceneState;
  onSelect: (id: string) => void;
  onProgress: (n: number) => void;
  onError: (s: string) => void;
}

const _vecA = new T.Vector3();
const _vecB = new T.Vector3();
const _vecC = new T.Vector3();
const _vecPivot = new T.Vector3();
const _vecRotPivot = new T.Vector3();
const _quatTmp = new T.Quaternion();
const _boxTmp = new T.Box3();
const _worldOrigin = new T.Vector3(0, 0.85, 0);

const MODEL_BOUNDS: { min: [number, number, number]; max: [number, number, number] } = {
  min: [-0.42, -0.02, -0.22],
  max: [0.42, 1.78, 0.22],
};

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

export default function AnatomyScene({ atlas, state, onSelect, onProgress, onError }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef(state);
  const select = useRef(onSelect);
  const wakeRef = useRef<() => void>(() => {});
  latest.current = state;
  select.current = onSelect;

  useEffect(() => {
    wakeRef.current();
  }, [state]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    let disposed = false;
    let frame = 0;
    let swTimerId = 0;
    let swRenderBusy = false;
    let swFrameScheduled = false;
    let wakeRender = () => {};
    let dirty = true;
    let ready = false;
    let lastView = '';
    let lastReset = -1;
    let lastIsolate = '';
    let lastZoomId = 0;
    let lastFocusId = 0;
    let lastFocusBoxId = 0;
    let layoutKey = '';
    let amount = 0;
    let lastState: SceneState | null = null;
    let lastGhostMode = false;
    let lastDimmedKey = '';
    let lastSysOpacityKey = '';
    let lastClippingEnabled = false;
    let lastOverlayKey = '';
    let lastPinnedKey = '';
    let lastColorOverridesRef: Record<string, string> | undefined = undefined;
    let lastRelEdgesRef: SceneRelationshipEdge[] | undefined = undefined;
    let lastQualityPreset = '';
    let lastAnatomySex: 'male' | 'female' = latest.current.anatomySex ?? 'male';
    let lastShowPregnancy = Boolean(latest.current.showPregnancyLayer);

    const isSoftwareGl = detectSoftwareWebGL();
    const abort = new AbortController();

    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true,
      });
    } catch {
      onError('This browser could not start the 3D viewer. Please enable WebGL and reload.');
      return;
    }

    const updatePixelRatio = () => {
      if (isSoftwareGl) {
        renderer.setPixelRatio(1);
      } else {
        const preset =
          RENDER_QUALITY_PRESETS[latest.current.qualityPreset ?? 'balanced'] ??
          RENDER_QUALITY_PRESETS.balanced;
        const mobileCap = el.clientWidth < 768 || el.clientHeight < 600 ? Math.min(1.5, preset.pixelRatioCap) : preset.pixelRatioCap;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobileCap));
      }
    };
    updatePixelRatio();
    renderer.setClearColor('#f4f6f8');
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.localClippingEnabled = true;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      'aria-label',
      'Interactive 3D human anatomy model. Drag to orbit or pan, scroll or pinch to zoom, and tap a structure to inspect it.',
    );

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(
      34,
      Math.max(1, el.clientWidth) / Math.max(1, el.clientHeight),
      0.005,
      100,
    );
    const controls = new OrbitControls(camera, renderer.domElement);
    camera.position.set(1.4, 1.05, 3.6);
    controls.target.set(0, 0.85, 0);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.085;
    controls.minDistance = 0.07;
    controls.maxDistance = 40;
    controls.maxPolarAngle = Math.PI * 0.96;

    let camTransitionActive = false;
    const camTargetGoal = new T.Vector3().copy(controls.target);
    const camPosGoal = new T.Vector3().copy(camera.position);

    controls.addEventListener('start', () => {
      camTransitionActive = false;
    });
    controls.addEventListener('change', () => {
      dirty = true;
      wakeRender();
    });

    const pmrem = new T.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04);
    scene.environment = env.texture;
    room.dispose();
    pmrem.dispose();

    scene.add(new T.HemisphereLight(0xffffff, 0xa7acb2, 1.0));
    const key = new T.DirectionalLight(0xfffaf4, 2.25);
    key.position.set(-2, 4, 3);
    key.castShadow = !isSoftwareGl;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1.0;
    key.shadow.camera.far = 9.0;
    key.shadow.camera.left = -0.75;
    key.shadow.camera.right = 0.75;
    key.shadow.camera.top = 1.95;
    key.shadow.camera.bottom = -0.15;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.018;
    scene.add(key);

    const rim = new T.DirectionalLight(0xe9f0ff, 1.65);
    rim.position.set(2, 2, -3);
    scene.add(rim);

    // Soft anterior-inferior fill light so deep cavities remain clearly legible during dissection
    const cavityFill = new T.DirectionalLight(0xf1f6ff, 0.55);
    cavityFill.position.set(1.2, 0.4, 2.6);
    scene.add(cavityFill);

    const ground = new T.Mesh(
      new T.CircleGeometry(30, 96),
      new T.MeshStandardMaterial({ color: 0xd9dfe4, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.019;
    ground.receiveShadow = !isSoftwareGl;
    scene.add(ground);

    const platform = new T.Mesh(
      new T.CylinderGeometry(0.68, 0.7, 0.028, 100),
      new T.MeshStandardMaterial({ color: 0xf1f3f5, metalness: 0.08, roughness: 0.7 }),
    );
    platform.position.y = -0.016;
    platform.receiveShadow = !isSoftwareGl;
    scene.add(platform);

    const ring = new T.Mesh(
      new T.RingGeometry(0.63, 0.632, 128),
      new T.MeshBasicMaterial({ color: 0x8c969f, transparent: true, opacity: 0.35, side: T.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.001;
    scene.add(ring);

    const innerRing = new T.Mesh(
      new T.RingGeometry(0.55, 0.551, 128),
      new T.MeshBasicMaterial({ color: 0xa4aeb8, transparent: true, opacity: 0.15, side: T.DoubleSide }),
    );
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.001;
    scene.add(innerRing);

    // Cross-section clipping plane + visual orientation frame
    const clipPlane = new T.Plane(new T.Vector3(-1, 0, 0), 0);
    const activeClipPlanes: T.Plane[] = [];

    const clipFrameGroup = new T.Group();
    clipFrameGroup.visible = false;
    clipFrameGroup.renderOrder = 8;
    const clipPlaneGeo = new T.PlaneGeometry(1, 1);
    const clipPlaneMat = new T.MeshBasicMaterial({
      color: 0x0f5c6e,
      transparent: true,
      opacity: 0.06,
      side: T.DoubleSide,
      depthWrite: false,
    });
    const clipPlaneFill = new T.Mesh(clipPlaneGeo, clipPlaneMat);
    clipFrameGroup.add(clipPlaneFill);

    const clipEdgePts = [
      new T.Vector3(-0.5, -0.5, 0),
      new T.Vector3(0.5, -0.5, 0),
      new T.Vector3(0.5, 0.5, 0),
      new T.Vector3(-0.5, 0.5, 0),
    ];
    const clipOutlineGeo = new T.BufferGeometry().setFromPoints(clipEdgePts);
    const clipOutlineMat = new T.LineBasicMaterial({ color: 0x0f5c6e, transparent: true, opacity: 0.85 });
    const clipOutline = new T.LineLoop(clipOutlineGeo, clipOutlineMat);
    clipFrameGroup.add(clipOutline);
    scene.add(clipFrameGroup);

    // Per-part GPU state textures (2,234 parts fit cleanly in 4096x1 textures)
    const width = T.MathUtils.ceilPowerOfTwo(atlas.parts.length);
    const data = new Float32Array(width * 4);
    const partTexture = new T.DataTexture(data, width, 1, T.RGBAFormat, T.FloatType);
    partTexture.needsUpdate = true;

    const rotData = new Float32Array(width * 4);
    const pivotData = new Float32Array(width * 4);
    for (let i = 0; i < width; i++) {
      rotData[i * 4 + 3] = 1;
    }
    const partRotTexture = new T.DataTexture(rotData, width, 1, T.RGBAFormat, T.FloatType);
    partRotTexture.needsUpdate = true;
    const partPivotTexture = new T.DataTexture(pivotData, width, 1, T.RGBAFormat, T.FloatType);
    partPivotTexture.needsUpdate = true;

    const selectedData = new Uint8Array(width * 4);
    const selectionTexture = new T.DataTexture(selectedData, width, 1);
    selectionTexture.needsUpdate = true;

    const partColorData = new Uint8Array(width * 4);
    const partColorTexture = new T.DataTexture(partColorData, width, 1);
    partColorTexture.needsUpdate = true;

    // Per-part physically based tissue properties (r = roughness, g = metalness, b = microDetail, a = active)
    const partMaterialData = new Uint8Array(width * 4);
    const resolvedPbr = resolvePartMaterialProps(atlas);
    atlas.parts.forEach((p, idx) => {
      const matProps = resolvedPbr[p.id];
      if (!matProps) return;
      partMaterialData[idx * 4] = Math.round(T.MathUtils.clamp(matProps.roughness, 0.08, 0.96) * 255);
      partMaterialData[idx * 4 + 1] = Math.round(T.MathUtils.clamp(matProps.metalness, 0, 0.08) * 255);
      partMaterialData[idx * 4 + 2] = Math.round(T.MathUtils.clamp(matProps.microDetail, 0, 1) * 255);
      partMaterialData[idx * 4 + 3] = 255;
    });
    const partMaterialTexture = new T.DataTexture(partMaterialData, width, 1);
    partMaterialTexture.needsUpdate = true;
    const microDetailUniform = { value: RENDER_QUALITY_PRESETS.balanced.microDetailStrength };

    // Real tileable PBR normal/roughness/AO texture library (explicitly procedural approximations)
    const maxAniso = isSoftwareGl ? 1 : Math.min(4, renderer.capabilities.getMaxAnisotropy());
    const tissueTextureLib = createTissueTextureLibrary(128, maxAniso);

    // Runtime LOD 0 (full detail) & LOD 3 (verified meshoptimizer overview) scene groups
    const lod0Group = new T.Group();
    lod0Group.name = 'anatomy-lod0';
    scene.add(lod0Group);
    const lod3Group = new T.Group();
    lod3Group.name = 'anatomy-lod3';
    lod3Group.visible = false;
    scene.add(lod3Group);
    const lodManager = new AnatomicalLodManager(atlas.triangles);

    interface OverlayMeshEntry {
      part: Part;
      mesh: T.Mesh;
      material: T.MeshStandardMaterial;
      bounds: T.Box3;
      center: T.Vector3;
      baseColorHex: string;
      baseOpacity: number;
      baseNormalStrength: number;
      offset: T.Vector3;
    }

    const sharedGroup = new T.Group();
    sharedGroup.name = 'anatomy-shared-enhancements';
    sharedGroup.visible = false;
    scene.add(sharedGroup);
    const sharedEntries: OverlayMeshEntry[] = [];
    const sharedLayer = { loading: false, ready: false, justLoaded: false };

    const maleEnhancementGroup = new T.Group();
    maleEnhancementGroup.name = 'anatomy-male-enhancements';
    maleEnhancementGroup.visible = false;
    scene.add(maleEnhancementGroup);
    const maleEnhancementEntries: OverlayMeshEntry[] = [];
    const maleLayer = { loading: false, ready: false, justLoaded: false };

    const femaleGroup = new T.Group();
    femaleGroup.name = 'anatomy-female-overlay';
    femaleGroup.visible = false;
    scene.add(femaleGroup);
    const femaleEntries: OverlayMeshEntry[] = [];
    const femaleLayer = { loading: false, ready: false, justLoaded: false };

    const pregnancyGroup = new T.Group();
    pregnancyGroup.name = 'anatomy-optional-pregnancy';
    pregnancyGroup.visible = false;
    scene.add(pregnancyGroup);
    const pregnancyEntries: OverlayMeshEntry[] = [];
    const pregnancyLayer = { loading: false, ready: false, justLoaded: false };

    const allOverlayEntryLists = [
      sharedEntries,
      maleEnhancementEntries,
      femaleEntries,
      pregnancyEntries,
    ];

    const materials: T.MeshStandardMaterial[] = [];
    const geometries: T.BufferGeometry[] = [];
    const pickers: (T.Mesh | undefined)[] = [];
    const centers = atlas.parts.map((p) =>
      new T.Vector3().fromArray(p.bounds[0]).add(new T.Vector3().fromArray(p.bounds[1])).multiplyScalar(0.5),
    );
    const partIndexById = new Map<string, number>(atlas.parts.map((p, idx) => [p.id, idx]));
    let prevActiveTransformIds = new Set<string>();
    const offsets: T.Vector3[] = [];
    const bounds = atlas.parts.map(
      (p) => new T.Box3(new T.Vector3().fromArray(p.bounds[0]), new T.Vector3().fromArray(p.bounds[1])),
    );

    // Smooth per-part removal / restoration transition tracking (0 = intact, 1 = removed/hidden)
    const removalFade = new Float32Array(atlas.parts.length);
    const removalTarget = new Float32Array(atlas.parts.length);
    const prevDesiredHidden = new Uint8Array(atlas.parts.length);

    let packingWidth = 1;
    let packingHeight = 1;

    const markerPositions = new Float32Array(atlas.parts.length * 3);
    const markerGeometry = new T.BufferGeometry();
    markerGeometry.setAttribute('position', new T.BufferAttribute(markerPositions, 3));
    const markerMaterial = new T.PointsMaterial({
      color: 0x64748b,
      size: 5,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.72,
      depthTest: false,
    });
    markerMaterial.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <clipping_planes_fragment>',
        '#include <clipping_planes_fragment>\nif (distance(gl_PointCoord, vec2(0.5)) > 0.5) discard;',
      );
    };
    const markers = new T.Points(markerGeometry, markerMaterial);
    markers.frustumCulled = false;
    markers.renderOrder = 10;
    markers.visible = false;
    scene.add(markers);

    // Highlight overlay group for transparent-surroundings mode (reuses picker geometries)
    const highlightGroup = new T.Group();
    highlightGroup.renderOrder = 5;
    scene.add(highlightGroup);
    const highlightMaterial = new T.MeshStandardMaterial({
      color: '#1b9aa0',
      emissive: '#0c4e55',
      emissiveIntensity: 0.35,
      metalness: 0.08,
      roughness: 0.42,
      side: T.DoubleSide,
    });
    const colorHighlightMaterials = new Map<string, T.MeshStandardMaterial>();
    const getHighlightMaterialForColor = (hex?: string) => {
      if (!hex) return highlightMaterial;
      let mat = colorHighlightMaterials.get(hex);
      if (!mat) {
        mat = new T.MeshStandardMaterial({
          color: hex,
          emissive: hex,
          emissiveIntensity: 0.22,
          metalness: 0.08,
          roughness: 0.44,
          side: T.DoubleSide,
          ...(activeClipPlanes.length > 0 ? { clippingPlanes: activeClipPlanes } : {}),
        });
        colorHighlightMaterials.set(hex, mat);
      }
      return mat;
    };
    const highlightMeshes: { index: number; mesh: T.Mesh }[] = [];

    // 3D Relationship spatial connector group (curves + directional arrowheads)
    const relationshipEdgeGroup = new T.Group();
    relationshipEdgeGroup.renderOrder = 7;
    scene.add(relationshipEdgeGroup);
    const disposeEdgeGroup = () => {
      while (relationshipEdgeGroup.children.length > 0) {
        const child = relationshipEdgeGroup.children[0];
        relationshipEdgeGroup.remove(child);
        if (child instanceof T.Mesh || child instanceof T.Line) {
          child.geometry.dispose();
          const ms = Array.isArray(child.material) ? child.material : [child.material];
          ms.forEach((m) => m.dispose());
        }
      }
    };
    const syncRelationshipEdges = (edges: SceneRelationshipEdge[] | undefined) => {
      disposeEdgeGroup();
      if (!edges || edges.length === 0) return;
      for (const edge of edges) {
        const p0 = new T.Vector3(edge.from[0], edge.from[1], edge.from[2]);
        const p2 = new T.Vector3(edge.to[0], edge.to[1], edge.to[2]);
        const dist = p0.distanceTo(p2);
        if (dist < 0.004) continue;

        const mid = p0.clone().add(p2).multiplyScalar(0.5);
        // Gentle outward/upward arc so connectors never collapse straight through organs
        const arcLift = Math.min(0.09, dist * 0.24);
        mid.y += arcLift * 0.65;
        mid.z += arcLift * 0.75;

        const curve = new T.QuadraticBezierCurve3(p0, mid, p2);
        const tubeGeo = new T.TubeGeometry(curve, 20, 0.0024, 6, false);
        const tubeMat = new T.MeshStandardMaterial({
          color: edge.color,
          emissive: edge.color,
          emissiveIntensity: 0.32,
          roughness: 0.35,
          metalness: 0.05,
        });
        const tube = new T.Mesh(tubeGeo, tubeMat);
        relationshipEdgeGroup.add(tube);

        // Directional arrowhead cone near the target end (for outgoing/incoming)
        const arrowT = edge.direction === 'incoming' ? 0.18 : 0.82;
        const arrowPos = curve.getPoint(arrowT);
        const tangent = curve.getTangent(arrowT).normalize();
        if (edge.direction === 'incoming') tangent.negate();
        const coneGeo = new T.ConeGeometry(0.0068, 0.018, 10);
        const coneMat = new T.MeshStandardMaterial({
          color: edge.color,
          emissive: edge.color,
          emissiveIntensity: 0.4,
          roughness: 0.3,
        });
        const cone = new T.Mesh(coneGeo, coneMat);
        cone.position.copy(arrowPos);
        cone.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), tangent);
        relationshipEdgeGroup.add(cone);
      }
    };

    // Dedicated per-part translucent overlay group (prevents breaking depthWrite on opaque merged systems)
    const translucentGroup = new T.Group();
    translucentGroup.renderOrder = 3;
    scene.add(translucentGroup);
    const translucentMaterials = new Map<string, T.MeshStandardMaterial>();

    const getTranslucentMaterial = (system: SystemId, alpha: number, selectedPart: boolean) => {
      const bucket = Math.max(1, Math.min(20, Math.round(alpha * 20)));
      const key = `${system}:${bucket}:${selectedPart ? 1 : 0}`;
      let mat = translucentMaterials.get(key);
      if (!mat) {
        const baseColor = SYSTEMS.find((s) => s.id === system)?.color ?? '#aebbb8';
        mat = new T.MeshStandardMaterial({
          color: selectedPart ? '#1cb0b8' : baseColor,
          emissive: selectedPart ? '#0c4e55' : '#000000',
          emissiveIntensity: selectedPart ? 0.25 : 0,
          metalness: 0.08,
          roughness: 0.48,
          side: T.DoubleSide,
          transparent: true,
          opacity: bucket / 20,
          depthWrite: false,
          clippingPlanes: activeClipPlanes,
        });
        translucentMaterials.set(key, mat);
      }
      return mat;
    };

    const hover = document.createElement('div');
    hover.className = 'part-hover';
    hover.setAttribute('role', 'tooltip');
    hover.hidden = true;
    el.appendChild(hover);

    type Target = {
      id: string;
      name: string;
      x: number;
      y: number;
      left: number;
      right: number;
      top: number;
      bottom: number;
    };
    let targets: Target[] = [];
    const projected = new T.Vector3();

    const findTarget = (x: number, y: number, radius: number): Target | null => {
      let best: Target | null = null;
      let score = Infinity;
      for (const t of targets) {
        const dx = Math.max(t.left - x, 0, x - t.right);
        const dy = Math.max(t.top - y, 0, y - t.bottom);
        const distance = Math.hypot(dx, dy);
        if (distance > radius) continue;
        const candidate = distance + Math.hypot(t.x - x, t.y - y) * 0.025;
        if (candidate < score) {
          score = candidate;
          best = t;
        }
      }
      return best;
    };

    const materialFor = (system: string) => {
      const texSet = tissueTextureLib.getForSystem(system as SystemId);
      const isEnvelope = system === 'integumentary';
      const baseNormalStrength = isEnvelope ? 0 : texSet.normalStrength;
      const m = new T.MeshStandardMaterial({
        color: SYSTEMS.find((s) => s.id === system)?.color ?? '#aebbb8',
        metalness: 0.04,
        roughness: 0.54,
        side: T.DoubleSide,
        transparent: isEnvelope,
        opacity: isEnvelope ? 0.1 : 1,
        depthWrite: !isEnvelope,
        ...(isEnvelope
          ? {}
          : {
              normalMap: texSet.normalMap,
              normalScale: new T.Vector2(
                baseNormalStrength * RENDER_QUALITY_PRESETS.balanced.microDetailStrength,
                baseNormalStrength * RENDER_QUALITY_PRESETS.balanced.microDetailStrength,
              ),
              roughnessMap: texSet.roughnessMap,
              aoMap: texSet.aoMap,
              aoMapIntensity: 0.32,
            }),
      });
      m.userData.baseSystem = system;
      m.userData.baseNormalStrength = baseNormalStrength;
      m.userData.systemOpacity = isEnvelope ? 0.1 : 1.0;
      m.envMapIntensity = RENDER_QUALITY_PRESETS.balanced.envMapIntensity;
      m.onBeforeCompile = (shader) => {
        shader.uniforms.partState = { value: partTexture };
        shader.uniforms.partRot = { value: partRotTexture };
        shader.uniforms.partPivot = { value: partPivotTexture };
        shader.uniforms.selectionState = { value: selectionTexture };
        shader.uniforms.partColor = { value: partColorTexture };
        shader.uniforms.partMaterial = { value: partMaterialTexture };
        shader.uniforms.microDetailStrength = microDetailUniform;
        shader.uniforms.stateWidth = { value: width };
        shader.uniforms.systemOpacity = { value: m.userData.systemOpacity };
        m.userData.shader = shader;

        shader.vertexShader =
          'attribute float partIndex;\nuniform sampler2D partState;\nuniform sampler2D partRot;\nuniform sampler2D partPivot;\nuniform sampler2D selectionState;\nuniform sampler2D partColor;\nuniform sampler2D partMaterial;\nuniform float stateWidth;\nvarying float partVisible;\nvarying float partSelected;\nvarying float partDimmed;\nvarying float partPinned;\nvarying vec4 partColorOverride;\nvarying vec4 partPbrProps;\nvarying vec3 a360LocalPos;\nvec3 a360RotateQuat(vec3 v, vec4 q) {\n  return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);\n}\n' +
          shader.vertexShader;

        shader.vertexShader = shader.vertexShader.replace(
          '#include <beginnormal_vertex>',
          `#include <beginnormal_vertex>
          vec2 normStateUv = vec2((partIndex + 0.5) / stateWidth, 0.5);
          vec4 normQuat = texture2D(partRot, normStateUv);
          objectNormal = a360RotateQuat(objectNormal, normQuat);`,
        );

        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          a360LocalPos = position;
          vec2 stateUv = vec2((partIndex + 0.5) / stateWidth, 0.5);
          vec4 state = texture2D(partState, stateUv);
          vec4 selState = texture2D(selectionState, stateUv);
          vec4 qRot = texture2D(partRot, stateUv);
          vec4 qPivot = texture2D(partPivot, stateUv);
          transformed = a360RotateQuat(transformed - qPivot.xyz, qRot) + qPivot.xyz + state.xyz;
          partVisible = state.w;
          partSelected = selState.r;
          partDimmed = selState.g;
          partPinned = selState.b;
          partColorOverride = texture2D(partColor, stateUv);
          partPbrProps = texture2D(partMaterial, stateUv);`,
        );

        shader.fragmentShader =
          'uniform float systemOpacity;\nuniform float microDetailStrength;\nvarying float partVisible;\nvarying float partSelected;\nvarying float partDimmed;\nvarying float partPinned;\nvarying vec4 partColorOverride;\nvarying vec4 partPbrProps;\nvarying vec3 a360LocalPos;\n' +
          shader.fragmentShader;

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <clipping_planes_fragment>',
          '#include <clipping_planes_fragment>\nif (partVisible < 0.5) discard;\nif (partPinned < 0.5 && partDimmed > 0.5 && partSelected > 0.5) discard;',
        );

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <color_fragment>',
          `#include <color_fragment>
          if (partColorOverride.a > 0.5) {
            diffuseColor.rgb = pow(partColorOverride.rgb, vec3(2.2));
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.95, 0.99, 1.0), partSelected * 0.16);
          } else {
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.11, 0.68, 0.71), partSelected * 0.78);
          }
          if (partPinned > 0.5) {
            diffuseColor.a = 1.0;
          } else if (partDimmed > 0.5 && partSelected < 0.5) {
            diffuseColor.a *= min(0.14, systemOpacity);
          } else if (systemOpacity < 0.995) {
            diffuseColor.a *= systemOpacity;
          }`,
        );

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <roughnessmap_fragment>',
          `#include <roughnessmap_fragment>
          if (partPbrProps.a > 0.5) {
            float microWave = sin(a360LocalPos.x * 180.0 + a360LocalPos.z * 140.0) * sin(a360LocalPos.y * 120.0);
            float microShift = microWave * 0.045 * partPbrProps.b * microDetailStrength;
            roughnessFactor = clamp(partPbrProps.r + microShift, 0.14, 0.95);
          }`,
        );

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <metalnessmap_fragment>',
          `#include <metalnessmap_fragment>
          if (partPbrProps.a > 0.5) {
            metalnessFactor = clamp(partPbrProps.g, 0.0, 0.08);
          }`,
        );
      };
      materials.push(m);
      return m;
    };

    const mats = new Map(SYSTEMS.map((s) => [s.id, materialFor(s.id)]));

    let loaded = 0;
    const loadChunk = async (ci: number) => {
      const chunk = atlas.chunks[ci];
      const compressed = !!chunk.gzip && typeof DecompressionStream !== 'undefined';
      const response = await fetch(compressed ? chunk.gzip! : chunk.url, { signal: abort.signal });
      const buffer = await decodeModelResponse(response, chunk.bytes, compressed);
      if (disposed) return;

      const groups = new Map<string, T.BufferGeometry[]>();
      atlas.parts.forEach((p, i) => {
        if (p.chunk !== ci) return;
        const g = new T.BufferGeometry();
        g.setAttribute('position', new T.BufferAttribute(new Float32Array(buffer, p.positions, p.vertexCount * 3), 3));
        g.setAttribute('normal', new T.BufferAttribute(new Int16Array(buffer, p.normals, p.vertexCount * 3), 3, true));
        g.setIndex(new T.BufferAttribute(new Uint32Array(buffer, p.indices, p.indexCount), 1));
        ensureAnatomicalUVs(g, 0.08);
        g.boundingBox = bounds[i].clone();
        g.computeBoundingSphere();

        const pick = new T.Mesh(g);
        pick.matrixAutoUpdate = false;
        pickers[i] = pick;
        geometries.push(g);

        g.setAttribute('partIndex', new T.BufferAttribute(new Float32Array(p.vertexCount).fill(i), 1));
        const list = groups.get(p.system) ?? [];
        list.push(g);
        groups.set(p.system, list);
      });

      groups.forEach((gs, system) => {
        const geometry = mergeGeometries(gs, false);
        if (!geometry) throw new Error('Could not assemble anatomy geometry.');
        geometries.push(geometry);
        const mesh = new T.Mesh(geometry, mats.get(system as never));
        mesh.frustumCulled = false;
        if (!isSoftwareGl && system !== 'integumentary') {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
        lod0Group.add(mesh);
      });

      lastState = null;
      loaded++;
      onProgress(Math.round((loaded / atlas.chunks.length) * 100));
      dirty = true;
      wakeRender();
    };

    // Background loader for verified meshoptimizer LOD 3 overview chunks (never blocks initial render)
    const loadLod3Background = async () => {
      try {
        const res = await fetch('/models/atlas.lod3.json', { signal: abort.signal });
        if (!res.ok) return;
        const lod3Atlas = (await res.json()) as Atlas;
        if (disposed || !Array.isArray(lod3Atlas.parts) || lod3Atlas.parts.length !== atlas.parts.length) return;

        for (let ci = 0; ci < lod3Atlas.chunks.length; ci++) {
          if (disposed) return;
          const chunk = lod3Atlas.chunks[ci];
          const compressed = !!chunk.gzip && typeof DecompressionStream !== 'undefined';
          const resp = await fetch(compressed ? chunk.gzip! : chunk.url, { signal: abort.signal });
          if (!resp.ok) return;
          const buffer = await decodeModelResponse(resp, chunk.bytes, compressed);
          if (disposed) return;

          const groups = new Map<string, T.BufferGeometry[]>();
          lod3Atlas.parts.forEach((p) => {
            if (p.chunk !== ci) return;
            const partIdx = partIndexById.get(p.id);
            if (partIdx === undefined) return;
            const g = new T.BufferGeometry();
            g.setAttribute('position', new T.BufferAttribute(new Float32Array(buffer, p.positions, p.vertexCount * 3), 3));
            g.setAttribute('normal', new T.BufferAttribute(new Int16Array(buffer, p.normals, p.vertexCount * 3), 3, true));
            g.setIndex(new T.BufferAttribute(new Uint32Array(buffer, p.indices, p.indexCount), 1));
            ensureAnatomicalUVs(g, 0.08);
            g.setAttribute('partIndex', new T.BufferAttribute(new Float32Array(p.vertexCount).fill(partIdx), 1));
            const list = groups.get(p.system) ?? [];
            list.push(g);
            groups.set(p.system, list);
          });

          groups.forEach((gs, system) => {
            const geometry = mergeGeometries(gs, false);
            gs.forEach((sub) => sub.dispose());
            if (!geometry) return;
            geometries.push(geometry);
            const mesh = new T.Mesh(geometry, mats.get(system as never));
            mesh.frustumCulled = false;
            if (!isSoftwareGl && system !== 'integumentary') {
              mesh.castShadow = true;
              mesh.receiveShadow = true;
            }
            lod3Group.add(mesh);
          });
        }

        if (!disposed) {
          lodManager.registerLod3(lod3Atlas.triangles);
          el.dataset.lod3Ready = 'true';
          dirty = true;
          wakeRender();
        }
      } catch {
        // LOD 3 is strictly additive; keep LOD 0 active silently if unavailable or aborted
      }
    };

    const loadOverlayManifestLayer = async (
      manifestPromise: Promise<OverlayManifest>,
      group: T.Group,
      entries: OverlayMeshEntry[],
      status: { loading: boolean; ready: boolean; justLoaded: boolean },
      datasetFlag: string,
      errorLabel: string,
    ) => {
      if (status.loading || status.ready || disposed) return;
      status.loading = true;
      try {
        const manifest = await manifestPromise;
        if (disposed || manifest.chunks.length === 0) return;
        const chunk = manifest.chunks[0];
        const compressed = !!chunk.gzip && typeof DecompressionStream !== 'undefined';
        const response = await fetch(compressed ? chunk.gzip! : chunk.url, { signal: abort.signal });
        if (!response.ok) throw new Error(`${errorLabel} HTTP ${response.status}`);
        const buffer = await decodeModelResponse(response, chunk.bytes, compressed);
        if (disposed) return;

        const quality =
          RENDER_QUALITY_PRESETS[latest.current.qualityPreset ?? 'balanced'] ??
          RENDER_QUALITY_PRESETS.balanced;

        for (const p of manifest.parts) {
          const g = new T.BufferGeometry();
          g.setAttribute('position', new T.BufferAttribute(new Float32Array(buffer, p.positions, p.vertexCount * 3), 3));
          g.setAttribute('normal', new T.BufferAttribute(new Int16Array(buffer, p.normals, p.vertexCount * 3), 3, true));
          g.setIndex(new T.BufferAttribute(new Uint32Array(buffer, p.indices, p.indexCount), 1));
          ensureAnatomicalUVs(g, 0.08);
          const partBounds = new T.Box3(
            new T.Vector3().fromArray(p.bounds[0]),
            new T.Vector3().fromArray(p.bounds[1]),
          );
          g.boundingBox = partBounds.clone();
          g.computeBoundingSphere();

          const tissue = classifyPartTissue(p);
          const preset = TISSUE_MATERIAL_PRESETS[tissue];
          const texSet = tissueTextureLib.getForSystem(p.system);
          const baseNormalStrength = texSet.normalStrength;
          const isPeritonealFold = /broad ligament|mesosalpinx|mesovarium|peritoneal pouch|vesicouterine|amniotic|amnion/i.test(
            p.name,
          );
          const baseOpacity = isPeritonealFold ? 0.42 : p.system === 'integumentary' ? 0.28 : preset.opacity;
          const initTransparent = baseOpacity < 0.995;

          const m = new T.MeshStandardMaterial({
            color: preset.naturalColor,
            roughness: preset.roughness,
            metalness: Math.min(0.05, preset.metalness),
            side: T.DoubleSide,
            transparent: initTransparent,
            opacity: baseOpacity,
            depthWrite: !initTransparent,
            normalMap: texSet.normalMap,
            normalScale: new T.Vector2(
              baseNormalStrength * quality.microDetailStrength,
              baseNormalStrength * quality.microDetailStrength,
            ),
            roughnessMap: texSet.roughnessMap,
            aoMap: texSet.aoMap,
            aoMapIntensity: 0.32,
            envMapIntensity: quality.envMapIntensity,
            ...(activeClipPlanes.length > 0 ? { clippingPlanes: activeClipPlanes } : {}),
          });

          const mesh = new T.Mesh(g, m);
          mesh.name = p.id;
          mesh.castShadow = !isSoftwareGl;
          mesh.receiveShadow = !isSoftwareGl;
          group.add(mesh);

          const center = partBounds.getCenter(new T.Vector3());
          entries.push({
            part: p,
            mesh,
            material: m,
            bounds: partBounds,
            center: center.clone(),
            baseColorHex: preset.naturalColor,
            baseOpacity,
            baseNormalStrength,
            offset: center.clone(),
          });
        }

        if (!disposed) {
          status.ready = true;
          status.loading = false;
          status.justLoaded = true;
          el.dataset[datasetFlag] = 'true';
          lastState = null;
          dirty = true;
          wakeRender();
        }
      } catch (err) {
        status.loading = false;
        if (!disposed && !(err instanceof DOMException && err.name === 'AbortError')) {
          onError(err instanceof Error ? err.message : `Could not load ${errorLabel}.`);
        }
      }
    };

    const ensureSharedLoaded = () =>
      loadOverlayManifestLayer(
        loadSharedEnhancementsManifest(),
        sharedGroup,
        sharedEntries,
        sharedLayer,
        'sharedReady',
        'shared anatomical enhancements',
      );
    const ensureMaleLoaded = () =>
      loadOverlayManifestLayer(
        loadMaleEnhancementsManifest(),
        maleEnhancementGroup,
        maleEnhancementEntries,
        maleLayer,
        'maleEnhancementsReady',
        'male anatomical enhancements',
      );
    const ensureFemaleLoaded = () =>
      loadOverlayManifestLayer(
        loadFemaleAtlasManifest(),
        femaleGroup,
        femaleEntries,
        femaleLayer,
        'femaleReady',
        'female anatomical overlay',
      );
    const ensurePregnancyLoaded = () =>
      loadOverlayManifestLayer(
        loadOptionalPregnancyManifest(),
        pregnancyGroup,
        pregnancyEntries,
        pregnancyLayer,
        'pregnancyReady',
        'optional pregnancy/placenta layer',
      );

    (async () => {
      try {
        let cursor = 0;
        await Promise.all(
          Array.from({ length: 3 }, async () => {
            while (cursor < atlas.chunks.length) {
              const i = cursor++;
              await loadChunk(i);
            }
          }),
        );
        if (!disposed) {
          ready = true;
          dirty = true;
          el.dataset.lodLevel = '0';
          el.dataset.activeTriangles = String(atlas.triangles);
          wakeRender();
          void ensureSharedLoaded();
          const curSex = latest.current.anatomySex ?? 'male';
          if (curSex === 'female') {
            void ensureFemaleLoaded();
            if (latest.current.showPregnancyLayer) {
              void ensurePregnancyLoaded();
            }
          } else {
            void ensureMaleLoaded();
          }
          void loadLod3Background();
        }
      } catch (e) {
        if (!disposed) onError(e instanceof Error ? e.message : 'Could not load the anatomy.');
      }
    })();

    const viewDirection = (view: string, out: T.Vector3) => {
      if (view === 'front') return out.set(0, 0.02, 1);
      if (view === 'back') return out.set(0, 0.02, -1);
      if (view === 'left') return out.set(1, 0.02, 0);
      if (view === 'right') return out.set(-1, 0.02, 0);
      return out.set(0.35, 0.06, 1).normalize();
    };

    const fit = (view: string, extent = 0, immediate = false) => {
      const embedded = Boolean(latest.current.embedded);
      const mobile = el.clientWidth < 768;
      const normalDistance = embedded
        ? 3.85
        : mobile
          ? Math.max(
              4.5,
              (1.8 * el.clientHeight) /
                Math.max(160, el.clientHeight - 350) /
                (2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2))),
            )
          : 4;
      const reservedHeight = embedded ? 72 : mobile ? 350 : 270;
      const sideReserve = embedded ? 40 : mobile ? 40 : 340;
      const availableAspect = Math.max(
        0.35,
        (el.clientWidth - sideReserve) / Math.max(160, el.clientHeight - reservedHeight),
      );
      const atlasDistance =
        (Math.max(packingHeight, packingWidth / availableAspect) /
          (2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2)))) *
        (el.clientHeight / Math.max(160, el.clientHeight - reservedHeight)) *
        1.08;

      const distance = T.MathUtils.lerp(normalDistance, Math.max(0.2, atlasDistance), extent);
      if (extent > 0.8) view = 'front';
      viewDirection(view, _vecA);
      camTargetGoal.set(
        !embedded && extent > 0.1 && el.clientWidth > 767 ? -packingWidth * 0.12 : 0,
        embedded ? 0.84 : extent > 0.1 || mobile ? 0.85 : 0.68,
        0,
      );
      camPosGoal.copy(camTargetGoal).addScaledVector(_vecA, distance);

      if (immediate || isSoftwareGl) {
        controls.target.copy(camTargetGoal);
        camera.position.copy(camPosGoal);
        controls.update();
        camTransitionActive = false;
      } else {
        camTransitionActive = true;
      }
      dirty = true;
    };

    const focusOnBox = (
      box: T.Box3,
      inspectorOpen?: boolean,
      embedded?: boolean,
      preferredDir?: [number, number, number],
    ) => {
      if (box.isEmpty()) return;
      const center = box.getCenter(_vecB);
      const size = box.getSize(_vecC);
      const w = el.clientWidth;
      const h = el.clientHeight;
      const mobile = w < 768;
      const landscape = w > h && h <= 600;
      let left = 20;
      let right = w - 20;
      let top = embedded ? 52 : mobile ? 150 : 100;
      let bottom = embedded ? Math.max(top + 100, h - 36) : h - 160;
      if (inspectorOpen) {
        if (landscape) {
          right = w - 340;
          top = 90;
          bottom = h - 120;
        } else if (mobile) {
          const sheet = document.querySelector('.detail-sheet')?.getBoundingClientRect();
          const header = document.querySelector('.explorer-header')?.getBoundingClientRect();
          top = (header?.bottom ?? 90) + 12;
          bottom = (sheet?.top ?? h * 0.56) - 12;
        } else {
          right = w - 380;
          left = w > 1100 ? 290 : 25;
        }
      }
      const availableWidth = Math.max(150, right - left);
      const availableHeight = Math.max(60, bottom - top);
      camera.setViewOffset(w, h, w / 2 - (left + right) / 2, h / 2 - (top + bottom) / 2, w, h);

      const projectedSpanX = preferredDir ? size.x * 0.86 + size.z * 0.52 : size.x;
      const padding = preferredDir ? 1.24 : 1.45;
      const distance = Math.max(
        0.16,
        (Math.max(
          (size.y * h) / availableHeight,
          (projectedSpanX * w) / availableWidth / Math.max(0.25, camera.aspect),
          size.z,
        ) /
          (2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2)))) *
          padding,
      );
      controls.maxDistance = Math.max(40, distance * 2.5);
      camTargetGoal.copy(center);
      if (preferredDir) {
        _vecA.set(preferredDir[0], preferredDir[1], preferredDir[2]);
      } else {
        _vecA.subVectors(camera.position, controls.target);
      }
      if (_vecA.lengthSq() < 1e-6) _vecA.set(0.2, 0.1, 1);
      _vecA.normalize();
      camPosGoal.copy(center).addScaledVector(_vecA, distance);

      if (isSoftwareGl) {
        controls.target.copy(camTargetGoal);
        camera.position.copy(camPosGoal);
        controls.update();
        camTransitionActive = false;
      } else {
        camTransitionActive = true;
      }
      dirty = true;
    };

    const focusOnSelection = (selectedIds: string[], inspectorOpen?: boolean, embedded?: boolean) => {
      if (!selectedIds.length) return;
      _boxTmp.makeEmpty();
      const selSet = new Set(selectedIds);
      const activeSex = latest.current.anatomySex ?? 'male';
      const showPregnancy = activeSex === 'female' && Boolean(latest.current.showPregnancyLayer);
      atlas.parts.forEach((p, i) => {
        if (selSet.has(p.id) && !isPartHiddenForSex(p.id, activeSex, showPregnancy)) {
          const picker = pickers[i];
          if (picker) {
            _boxTmp.union(bounds[i].clone().applyMatrix4(picker.matrix));
          } else {
            _vecA.set(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
            _boxTmp.union(bounds[i].clone().translate(_vecA));
          }
        }
      });
      const activeOverlayLists = [
        sharedEntries,
        ...(activeSex === 'male' ? [maleEnhancementEntries] : [femaleEntries]),
        ...(showPregnancy ? [pregnancyEntries] : []),
      ];
      for (const list of activeOverlayLists) {
        for (const oe of list) {
          if (selSet.has(oe.part.id)) {
            oe.mesh.updateMatrix();
            _boxTmp.union(oe.bounds.clone().applyMatrix4(oe.mesh.matrix));
          }
        }
      }
      focusOnBox(_boxTmp, inspectorOpen, embedded);
    };

    const resize = () => {
      if (!el.clientWidth || !el.clientHeight) return;
      layoutKey = '';
      lastState = null;
      updatePixelRatio();
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
      if (latest.current.embedded && latest.current.selected.length > 0 && latest.current.focusRequest && !latest.current.isolate) {
        focusOnSelection(latest.current.selected, latest.current.inspectorOpen, true);
      } else {
        fit(latest.current.view, amount, true);
      }
      wakeRender();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);

    const raycaster = new T.Raycaster();
    const pointer = new T.Vector2();
    const tap = new PointerTap();
    const worldBox = new T.Box3();
    const hitPoint = new T.Vector3();

    const down = (e: PointerEvent) => {
      hover.hidden = true;
      tap.down(e.pointerId, e.clientX, e.clientY, e.pointerType === 'touch' ? 12 : 5);
    };
    const move = (e: PointerEvent) => {
      tap.move(e.pointerId, e.clientX, e.clientY);
      if (e.buttons || amount < 0.5 || e.pointerType === 'touch' || latest.current.suppressHoverTooltip) {
        hover.hidden = true;
        return;
      }
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const hitTarget = findTarget(x, y, 12);
      hover.hidden = !hitTarget;
      renderer.domElement.style.cursor = !hitTarget ? 'grab' : 'pointer';
      if (hitTarget) {
        hover.textContent = hitTarget.name;
        hover.style.left = `${Math.max(8, Math.min(x + 14, el.clientWidth - 260))}px`;
        hover.style.top = `${Math.max(8, Math.min(y + 18, el.clientHeight - 55))}px`;
      }
    };
    const cancel = (e: PointerEvent) => tap.cancel(e.pointerId);

    const up = (e: PointerEvent) => {
      const validTap = tap.up(e.pointerId, e.clientX, e.clientY);
      if (!validTap || !ready) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);

      let nearest = Infinity;
      let foundId: string | null = null;
      const s = latest.current;
      const activeSex = s.anatomySex ?? 'male';
      const activeDimmed = new Set(s.dimmedSystems ?? []);
      const clipActive = Boolean(s.clipping?.enabled);
      const hiddenSet = new Set(s.hiddenPartIds ?? []);
      const visibleSet = new Set(s.visible);
      const selectedSet = new Set(s.selected);

      const showPregnancyPick = activeSex === 'female' && Boolean(s.showPregnancyLayer);
      const isPartPickable = (i: number) => {
        const p = atlas.parts[i];
        if (isPartHiddenForSex(p.id, activeSex, showPregnancyPick)) return false;
        if (hiddenSet.has(p.id) || removalFade[i] > 0.25) return false;
        const vis = s.isolate ? selectedSet.has(p.id) : visibleSet.has(p.system) || selectedSet.has(p.id);
        return vis;
      };

      const pinnedPickSet = new Set(s.pinnedOpaquePartIds ?? []);
      const activeOverlayPickLists: OverlayMeshEntry[][] = [];
      if (sharedLayer.ready) activeOverlayPickLists.push(sharedEntries);
      if (activeSex === 'male' && maleLayer.ready) activeOverlayPickLists.push(maleEnhancementEntries);
      if (activeSex === 'female' && femaleLayer.ready) activeOverlayPickLists.push(femaleEntries);
      if (showPregnancyPick && pregnancyLayer.ready) activeOverlayPickLists.push(pregnancyEntries);

      const pickFadeLeftKidneyShell =
        !selectedSet.has('FJ3145') &&
        ['HS_KIDNEY_CORTEX_L', 'HS_KIDNEY_COLUMNS_L', 'HS_KIDNEY_MEDULLA_L', 'HS_KIDNEY_HILUM_L'].some((id) =>
          selectedSet.has(id),
        );
      const pickFadeRightKidneyShell =
        !selectedSet.has('FJ3147') &&
        ['HS_KIDNEY_CORTEX_R', 'HS_KIDNEY_COLUMNS_R', 'HS_KIDNEY_MEDULLA_R', 'HS_KIDNEY_HILUM_R'].some((id) =>
          selectedSet.has(id),
        );
      const pickFadeLeftKidneyCortex =
        !selectedSet.has('HS_KIDNEY_CORTEX_L') &&
        (selectedSet.has('HS_KIDNEY_MEDULLA_L') || selectedSet.has('HS_KIDNEY_COLUMNS_L'));
      const pickFadeRightKidneyCortex =
        !selectedSet.has('HS_KIDNEY_CORTEX_R') &&
        (selectedSet.has('HS_KIDNEY_MEDULLA_R') || selectedSet.has('HS_KIDNEY_COLUMNS_R'));
      const pickFadeProstateShell =
        !selectedSet.has('FJ3139') &&
        s.selected.some(
          (id) =>
            id.startsWith('HM_PROSTATE_') ||
            id === 'HM_EJACULATORY_DUCT' ||
            id === 'HM_PROSTATIC_UTRICLE' ||
            id === 'HM_SEMINAL_COLLICULUS',
        );
      const pickFadeBladderShell =
        !selectedSet.has('FJ3149') &&
        (selectedSet.has('HM_BLADDER_TRIGONE') || selectedSet.has('HM_BLADDER_NECK'));

      const hasSolid =
        atlas.parts.some(
          (p, i) =>
            (pinnedPickSet.has(p.id) ||
              (p.system !== 'integumentary' &&
                !activeDimmed.has(p.system) &&
                (s.systemOpacities?.[p.system] ?? 1) > 0.45)) &&
            isPartPickable(i),
        ) ||
        activeOverlayPickLists.some((list) =>
          list.some(
            (oe) =>
              oe.mesh.visible &&
              (pinnedPickSet.has(oe.part.id) ||
                (!activeDimmed.has(oe.part.system) && (s.systemOpacities?.[oe.part.system] ?? 1) > 0.45)),
          ),
        );

      pickers.forEach((mesh, i) => {
        if (!mesh || !isPartPickable(i)) return;
        const p = atlas.parts[i];
        const isPinned = pinnedPickSet.has(p.id);
        const sysOp = isPinned
          ? 1
          : (s.systemOpacities?.[p.system] ?? (p.system === 'integumentary' ? (s.outerLayerOpacity ?? 0.1) : 1));
        let autoPickShellOp: number | undefined;
        if (p.id === 'FJ3145' && pickFadeLeftKidneyShell) autoPickShellOp = 0.16;
        else if (p.id === 'FJ3147' && pickFadeRightKidneyShell) autoPickShellOp = 0.16;
        else if (p.id === 'FJ3139' && pickFadeProstateShell) autoPickShellOp = 0.16;
        else if (p.id === 'FJ3149' && pickFadeBladderShell) autoPickShellOp = 0.20;
        const partOp = s.partOpacities?.[p.id] ?? autoPickShellOp ?? 1;
        if (
          hasSolid &&
          !isPinned &&
          (p.system === 'integumentary' || activeDimmed.has(p.system) || sysOp <= 0.3 || partOp <= 0.3)
        ) {
          return;
        }
        worldBox.copy(bounds[i]).applyMatrix4(mesh.matrix);
        if (!raycaster.ray.intersectBox(worldBox, hitPoint)) return;
        const hits = raycaster.intersectObject(mesh, false);
        for (const h of hits) {
          if (clipActive && clipPlane.distanceToPoint(h.point) < 0) continue;
          if (h.distance < nearest) {
            nearest = h.distance;
            foundId = p.id;
          }
          break;
        }
      });

      for (const list of activeOverlayPickLists) {
        for (const oe of list) {
          if (!oe.mesh.visible) continue;
          const p = oe.part;
          const isPinned = pinnedPickSet.has(p.id);
          const sysOp = isPinned ? 1 : (s.systemOpacities?.[p.system] ?? 1);
          let autoOverlayPickOp: number | undefined;
          if (p.id === 'HS_KIDNEY_CORTEX_L' && pickFadeLeftKidneyCortex) autoOverlayPickOp = 0.22;
          else if (p.id === 'HS_KIDNEY_CORTEX_R' && pickFadeRightKidneyCortex) autoOverlayPickOp = 0.22;
          const partOp = s.partOpacities?.[p.id] ?? autoOverlayPickOp ?? oe.baseOpacity;
          if (
            hasSolid &&
            !isPinned &&
            (p.system === 'integumentary' ||
              activeDimmed.has(p.system) ||
              sysOp <= 0.3 ||
              partOp <= 0.45)
          ) {
            continue;
          }
          worldBox.copy(oe.bounds).applyMatrix4(oe.mesh.matrixWorld);
          if (!raycaster.ray.intersectBox(worldBox, hitPoint)) continue;
          const hits = raycaster.intersectObject(oe.mesh, false);
          for (const h of hits) {
            if (clipActive && clipPlane.distanceToPoint(h.point) < 0) continue;
            if (h.distance < nearest) {
              nearest = h.distance;
              foundId = p.id;
            }
            break;
          }
        }
      }

      if (!foundId && amount > 0.45) {
        foundId = findTarget(e.clientX - rect.left, e.clientY - rect.top, e.pointerType === 'touch' ? 24 : 16)?.id ?? null;
      }
      if (foundId) {
        hover.hidden = true;
        select.current(foundId);
      }
    };

    renderer.domElement.addEventListener('pointerdown', down);
    renderer.domElement.addEventListener('pointermove', move);
    renderer.domElement.addEventListener('pointerup', up);
    renderer.domElement.addEventListener('pointercancel', cancel);

    const syncHighlightOverlay = (
      selection: Set<string>,
      activeGhost: boolean,
      colorOverrides?: Record<string, string>,
    ) => {
      while (highlightGroup.children.length > 0) {
        highlightGroup.remove(highlightGroup.children[0]);
      }
      highlightMeshes.length = 0;
      if (!activeGhost || selection.size === 0) return;
      atlas.parts.forEach((p, i) => {
        if (!selection.has(p.id)) return;
        const picker = pickers[i];
        if (!picker) return;
        const mat = getHighlightMaterialForColor(colorOverrides?.[p.id]);
        const m = new T.Mesh(picker.geometry, mat);
        m.position.copy(picker.position);
        m.quaternion.copy(picker.quaternion);
        highlightGroup.add(m);
        highlightMeshes.push({ index: i, mesh: m });
      });
    };

    const syncClippingPlane = (clip: ClippingPlaneState | undefined) => {
      const enabled = Boolean(clip?.enabled);
      if (enabled && clip) {
        const eq = computeClipPlaneEquation(clip, MODEL_BOUNDS);
        clipPlane.normal.set(eq.normal[0], eq.normal[1], eq.normal[2]);
        clipPlane.constant = eq.constant;
        if (activeClipPlanes.length === 0) activeClipPlanes.push(clipPlane);

        clipFrameGroup.visible = true;
        const spanX = MODEL_BOUNDS.max[0] - MODEL_BOUNDS.min[0];
        const spanY = MODEL_BOUNDS.max[1] - MODEL_BOUNDS.min[1];
        const spanZ = MODEL_BOUNDS.max[2] - MODEL_BOUNDS.min[2];
        const cx = (MODEL_BOUNDS.min[0] + MODEL_BOUNDS.max[0]) * 0.5;
        const cy = (MODEL_BOUNDS.min[1] + MODEL_BOUNDS.max[1]) * 0.5;
        const cz = (MODEL_BOUNDS.min[2] + MODEL_BOUNDS.max[2]) * 0.5;

        if (clip.axis === 'x') {
          clipFrameGroup.position.set(eq.worldCoordinate, cy, cz);
          clipFrameGroup.rotation.set(0, Math.PI / 2, 0);
          clipFrameGroup.scale.set(spanZ * 1.35, spanY * 1.04, 1);
        } else if (clip.axis === 'y') {
          clipFrameGroup.position.set(cx, eq.worldCoordinate, cz);
          clipFrameGroup.rotation.set(Math.PI / 2, 0, 0);
          clipFrameGroup.scale.set(spanX * 1.15, spanZ * 1.35, 1);
        } else {
          clipFrameGroup.position.set(cx, cy, eq.worldCoordinate);
          clipFrameGroup.rotation.set(0, 0, 0);
          clipFrameGroup.scale.set(spanX * 1.15, spanY * 1.04, 1);
        }
      } else {
        activeClipPlanes.length = 0;
        clipFrameGroup.visible = false;
      }

      const anyOverlayJustLoaded =
        sharedLayer.justLoaded ||
        maleLayer.justLoaded ||
        femaleLayer.justLoaded ||
        pregnancyLayer.justLoaded;

      if (enabled !== lastClippingEnabled || anyOverlayJustLoaded) {
        const planesRef = enabled ? activeClipPlanes : null;
        materials.forEach((m) => {
          m.clippingPlanes = planesRef;
          m.needsUpdate = true;
        });
        for (const list of allOverlayEntryLists) {
          list.forEach((oe) => {
            oe.material.clippingPlanes = planesRef;
            oe.material.needsUpdate = true;
          });
        }
        highlightMaterial.clippingPlanes = planesRef;
        highlightMaterial.needsUpdate = true;
        colorHighlightMaterials.forEach((m) => {
          m.clippingPlanes = planesRef;
          m.needsUpdate = true;
        });
        translucentMaterials.forEach((m) => {
          m.clippingPlanes = planesRef;
          m.needsUpdate = true;
        });
        lastClippingEnabled = enabled;
      }
      dirty = true;
    };

    const clock = new T.Clock();
    let lastExtent = -1;
    let swWakeQueued = false;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) {
            if (sync) gl.deleteSync(sync);
            return;
          }
          const syncState = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
          if (syncState === gl.UNSIGNALED) {
            swTimerId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            swTimerId = window.setTimeout(cb, 80);
          }
        };
        swTimerId = window.setTimeout(poll, 5);
      } else {
        swTimerId = window.setTimeout(cb, 80);
      }
    };

    wakeRender = () => {
      if (disposed || !isSoftwareGl) return;
      if (swRenderBusy) {
        swWakeQueued = true;
        return;
      }
      if (!swFrameScheduled) {
        swFrameScheduled = true;
        frame = requestAnimationFrame(animate);
      }
    };
    wakeRef.current = wakeRender;

    const animate = () => {
      swFrameScheduled = false;
      if (disposed) return;
      if (!isSoftwareGl) {
        frame = requestAnimationFrame(animate);
      } else if (swRenderBusy) {
        swWakeQueued = true;
        return;
      }
      const dt = Math.min(clock.getDelta(), 0.05);
      const s = latest.current;
      const activeSex = s.anatomySex ?? 'male';
      const showPregnancy = activeSex === 'female' && Boolean(s.showPregnancyLayer);
      el.dataset.activeSex = activeSex;
      if (ready && !sharedLayer.ready && !sharedLayer.loading) {
        void ensureSharedLoaded();
      }
      if (activeSex === 'male' && ready && !maleLayer.ready && !maleLayer.loading) {
        void ensureMaleLoaded();
      }
      if (activeSex === 'female' && !femaleLayer.ready && !femaleLayer.loading) {
        void ensureFemaleLoaded();
      }
      if (showPregnancy && !pregnancyLayer.ready && !pregnancyLayer.loading) {
        void ensurePregnancyLoaded();
      }
      const anyOverlayJustLoaded =
        sharedLayer.justLoaded ||
        maleLayer.justLoaded ||
        femaleLayer.justLoaded ||
        pregnancyLayer.justLoaded;
      const presetKey = s.qualityPreset ?? 'balanced';
      if (presetKey !== lastQualityPreset || anyOverlayJustLoaded) {
        lastQualityPreset = presetKey;
        const preset = RENDER_QUALITY_PRESETS[presetKey] ?? RENDER_QUALITY_PRESETS.balanced;
        renderer.toneMappingExposure = preset.exposure;
        const shadowsOn = !isSoftwareGl && presetKey !== 'performance';
        key.castShadow = shadowsOn;
        renderer.shadowMap.enabled = shadowsOn;
        microDetailUniform.value = preset.microDetailStrength;
        materials.forEach((m) => {
          m.envMapIntensity = preset.envMapIntensity;
          const baseNorm = (m.userData.baseNormalStrength as number | undefined) ?? 0;
          if (m.normalScale && baseNorm > 0) {
            const scaled = baseNorm * preset.microDetailStrength;
            m.normalScale.set(scaled, scaled);
          }
        });
        for (const list of allOverlayEntryLists) {
          list.forEach((oe) => {
            oe.material.envMapIntensity = preset.envMapIntensity;
            if (oe.material.normalScale && oe.baseNormalStrength > 0) {
              const scaled = oe.baseNormalStrength * preset.microDetailStrength;
              oe.material.normalScale.set(scaled, scaled);
            }
          });
        }
        updatePixelRatio();
        dirty = true;
      }

      if (ready) {
        const camDist = camera.position.distanceTo(controls.target);
        const lodDecision = lodManager.evaluate({
          cameraDistance: camDist,
          qualityPreset: presetKey,
          lod3Available: lod3Group.children.length > 0,
          isIsolatedOrCloseFocus: Boolean(s.isolate || camDist < 1.1),
          isExploded: amount > 0.05 || Object.keys(s.partTransforms ?? {}).length > 0,
        });
        if (lodDecision.changed) {
          lod0Group.visible = lodDecision.level === 0;
          lod3Group.visible = lodDecision.level === 3;
          const telem = lodManager.getTelemetry();
          el.dataset.lodLevel = String(telem.activeLevel);
          el.dataset.activeTriangles = String(telem.activeTriangles);
          dirty = true;
        }
      }

      const ghostActive = Boolean(s.ghostSurroundings && s.selected.length > 0 && !s.isolate);
      const dimmedKey = (s.dimmedSystems ?? []).join(',');
      const sysOpacityKey = JSON.stringify(s.systemOpacities ?? {}) + ':' + (s.outerLayerOpacity ?? 1);
      const hiddenKey = (s.hiddenPartIds ?? []).join(',');
      const partOpKey = JSON.stringify(s.partOpacities ?? {});
      const clipKey = JSON.stringify(s.clipping ?? null);
      const pinnedKey = (s.pinnedOpaquePartIds ?? []).join(',');

      const nonTransformChanged =
        lastAnatomySex !== activeSex ||
        lastShowPregnancy !== showPregnancy ||
        anyOverlayJustLoaded ||
        lastState?.visible !== s.visible ||
        lastState?.selected !== s.selected ||
        lastState?.isolate !== s.isolate ||
        lastState?.hiddenPartIds !== s.hiddenPartIds ||
        lastState?.partOpacities !== s.partOpacities ||
        lastState?.clipping !== s.clipping ||
        lastState?.pinnedOpaquePartIds !== s.pinnedOpaquePartIds ||
        lastColorOverridesRef !== s.partColorOverrides ||
        lastRelEdgesRef !== s.relationshipEdges ||
        lastGhostMode !== ghostActive ||
        lastDimmedKey !== dimmedKey ||
        lastSysOpacityKey !== sysOpacityKey ||
        lastPinnedKey !== pinnedKey ||
        lastOverlayKey !== `${hiddenKey}|${partOpKey}|${clipKey}`;

      const changed = nonTransformChanged || lastState?.partTransforms !== s.partTransforms;

      const moving = Math.abs(amount - s.explode) > 0.0001;
      if (moving) {
        amount = isSoftwareGl ? s.explode : T.MathUtils.damp(amount, s.explode, 8, dt);
        if (Math.abs(amount - s.explode) <= 0.0001) amount = s.explode;
        dirty = true;
      }

      // Check smooth dissection fade/removal transitions
      const hiddenInputSet = new Set(s.hiddenPartIds ?? []);
      let fadeMoving = false;
      for (let i = 0; i < atlas.parts.length; i++) {
        const pid = atlas.parts[i].id;
        const desired = hiddenInputSet.has(pid) ? 1 : 0;
        if (desired !== prevDesiredHidden[i]) {
          prevDesiredHidden[i] = desired;
          removalTarget[i] = desired;
          if (isSoftwareGl) removalFade[i] = desired;
        }
        const diff = removalTarget[i] - removalFade[i];
        if (Math.abs(diff) > 0.002) {
          fadeMoving = true;
          if (isSoftwareGl) {
            removalFade[i] = removalTarget[i];
          } else {
            removalFade[i] = T.MathUtils.damp(removalFade[i], removalTarget[i], 10, dt);
            if (Math.abs(removalTarget[i] - removalFade[i]) <= 0.003) {
              removalFade[i] = removalTarget[i];
            }
          }
        }
      }

      const onlyTransformsChanged =
        !nonTransformChanged &&
        !moving &&
        !fadeMoving &&
        lastExtent >= 0 &&
        amount < 0.05 &&
        lastState?.partTransforms !== s.partTransforms;

      if (onlyTransformsChanged) {
        const nextTransformKeys = Object.keys(s.partTransforms ?? {});
        const touchedIds = new Set<string>(prevActiveTransformIds);
        for (const id of nextTransformKeys) touchedIds.add(id);

        const touchedIndices = new Set<number>();
        for (const id of touchedIds) {
          const i = partIndexById.get(id);
          if (i === undefined) continue;
          touchedIndices.add(i);
          const c = centers[i];
          let dx = 0;
          let dy = 0;
          let dz = 0;
          let qx = 0;
          let qy = 0;
          let qz = 0;
          let qw = 1;
          let px = c.x;
          let py = c.y;
          let pz = c.z;
          const xform = s.partTransforms?.[id];
          if (xform) {
            dx += xform.translation[0];
            dy += xform.translation[1];
            dz += xform.translation[2];
            qx = xform.rotation[0];
            qy = xform.rotation[1];
            qz = xform.rotation[2];
            qw = xform.rotation[3];
            px = xform.pivot[0];
            py = xform.pivot[1];
            pz = xform.pivot[2];
          }
          const fade = removalFade[i];
          if (fade > 0.002) {
            _vecA.subVectors(c, _worldOrigin);
            if (c.y > 1.48) _vecA.set(c.x, (c.y - 1.56) * 1.4 + 0.05, c.z * 1.2);
            if (_vecA.lengthSq() < 1e-5) _vecA.set(0, 0.1, 0.1);
            _vecA.normalize();
            const slideDist = 0.26 * fade;
            dx += _vecA.x * slideDist;
            dy += (_vecA.y + 0.25) * slideDist;
            dz += _vecA.z * slideDist;
            if (qx === 0 && qy === 0 && qz === 0) {
              _quatTmp.setFromAxisAngle(_vecB.set(-_vecA.z, 0, _vecA.x).normalize(), 0.22 * fade);
              qx = _quatTmp.x;
              qy = _quatTmp.y;
              qz = _quatTmp.z;
              qw = _quatTmp.w;
            }
          }

          data[i * 4] = dx;
          data[i * 4 + 1] = dy;
          data[i * 4 + 2] = dz;
          rotData.set([qx, qy, qz, qw], i * 4);
          pivotData.set([px, py, pz, 0], i * 4);

          if (data[i * 4 + 3] > 0.5) {
            markerPositions.set([c.x + dx, c.y + dy, c.z + dz], i * 3);
          }

          const picker = pickers[i];
          if (picker) {
            _quatTmp.set(qx, qy, qz, qw);
            _vecPivot.set(px, py, pz);
            _vecRotPivot.copy(_vecPivot).applyQuaternion(_quatTmp);
            picker.quaternion.copy(_quatTmp);
            picker.position.set(
              dx + px - _vecRotPivot.x,
              dy + py - _vecRotPivot.y,
              dz + pz - _vecRotPivot.z,
            );
            picker.updateMatrix();
            picker.updateMatrixWorld(true);
          }
        }

        if (translucentGroup.children.length > 0) {
          for (const child of translucentGroup.children) {
            const pIdx = child.userData.partIndex as number | undefined;
            if (pIdx !== undefined && touchedIndices.has(pIdx)) {
              const picker = pickers[pIdx];
              if (picker) {
                child.position.copy(picker.position);
                child.quaternion.copy(picker.quaternion);
              }
            }
          }
        }
        for (const h of highlightMeshes) {
          if (touchedIndices.has(h.index)) {
            const picker = pickers[h.index];
            if (picker) {
              h.mesh.position.copy(picker.position);
              h.mesh.quaternion.copy(picker.quaternion);
            }
          }
        }

        partTexture.needsUpdate = true;
        partRotTexture.needsUpdate = true;
        partPivotTexture.needsUpdate = true;
        markerGeometry.attributes.position.needsUpdate = true;
        prevActiveTransformIds = new Set(nextTransformKeys);
        lastState = s;
        dirty = true;
      } else if (changed || moving || fadeMoving || lastExtent < 0) {
        prevActiveTransformIds = new Set(Object.keys(s.partTransforms ?? {}));
        syncClippingPlane(s.clipping);

        const visible = new Set(s.visible);
        const selection = new Set(s.selected);
        const visibleParts = atlas.parts.filter(
          (p) =>
            !isPartHiddenForSex(p.id, activeSex, showPregnancy) &&
            (s.isolate ? selection.has(p.id) : visible.has(p.system) || selection.has(p.id)),
        );
        const activeOverlayConfigs: Array<{ entries: OverlayMeshEntry[]; ready: boolean }> = [
          { entries: sharedEntries, ready: sharedLayer.ready },
          ...(activeSex === 'male'
            ? [{ entries: maleEnhancementEntries, ready: maleLayer.ready }]
            : [{ entries: femaleEntries, ready: femaleLayer.ready }]),
          ...(showPregnancy ? [{ entries: pregnancyEntries, ready: pregnancyLayer.ready }] : []),
        ];
        for (const cfg of activeOverlayConfigs) {
          if (!cfg.ready) continue;
          for (const oe of cfg.entries) {
            if (s.isolate ? selection.has(oe.part.id) : visible.has(oe.part.system) || selection.has(oe.part.id)) {
              visibleParts.push(oe.part);
            }
          }
        }
        const nextLayoutKey =
          activeSex +
          ':' +
          (showPregnancy ? 'P1' : 'P0') +
          ':' +
          (sharedLayer.ready ? 'S1' : 'S0') +
          (maleLayer.ready ? 'M1' : 'M0') +
          (femaleLayer.ready ? 'F1' : 'F0') +
          (pregnancyLayer.ready ? 'O1' : 'O0') +
          ':' +
          visibleParts.map((p) => p.id).join(',') +
          ':' +
          camera.aspect.toFixed(3);
        if (nextLayoutKey !== layoutKey) {
          const layout = createExplosionLayout(visibleParts, camera.aspect);
          packingWidth = layout.width;
          packingHeight = layout.height;
          atlas.parts.forEach((p, i) => {
            const cell = layout.cells.get(p.id);
            offsets[i] = cell ? new T.Vector3(cell.x, cell.y + 0.85, 0) : centers[i].clone();
          });
          for (const list of allOverlayEntryLists) {
            list.forEach((oe) => {
              const cell = layout.cells.get(oe.part.id);
              oe.offset = cell ? new T.Vector3(cell.x, cell.y + 0.85, 0) : oe.center.clone();
            });
          }
          layoutKey = nextLayoutKey;
          if (amount > 0.05 && !s.isolate) fit(s.view, Math.max(0, (amount - 0.3) / 0.7));
        }

        const dimmedSet = new Set(s.dimmedSystems ?? []);
        if (
          lastGhostMode !== ghostActive ||
          lastDimmedKey !== dimmedKey ||
          lastSysOpacityKey !== sysOpacityKey
        ) {
          materials.forEach((mat) => {
            const baseSys = mat.userData.baseSystem as SystemId;
            const isSkin = baseSys === 'integumentary';
            const isDimmedLayer = dimmedSet.has(baseSys);
            const explicitSysOpacity = s.systemOpacities?.[baseSys];
            const sysOp =
              explicitSysOpacity !== undefined
                ? explicitSysOpacity
                : isSkin
                  ? s.outerLayerOpacity ?? 0.1
                  : 1.0;

            mat.userData.systemOpacity = sysOp;
            if (mat.userData.shader) {
              mat.userData.shader.uniforms.systemOpacity.value = sysOp;
            }

            const shouldBeTransparent = ghostActive || isSkin || isDimmedLayer || sysOp < 0.995;
            if (mat.transparent !== shouldBeTransparent || mat.depthWrite !== !shouldBeTransparent) {
              mat.transparent = shouldBeTransparent;
              mat.depthWrite = !shouldBeTransparent;
              mat.needsUpdate = true;
            }
          });
          lastGhostMode = ghostActive;
          lastDimmedKey = dimmedKey;
          lastSysOpacityKey = sysOpacityKey;
        }

        // Rebuild lightweight translucent overlay meshes only for individually faded/X-Rayed parts
        while (translucentGroup.children.length > 0) {
          translucentGroup.remove(translucentGroup.children[0]);
        }

        const pinnedSet = new Set(s.pinnedOpaquePartIds ?? []);

        // Auto-reveal nested internal structures inside kidneys, prostate, and urinary bladder when selected
        const fadeLeftKidneyShell =
          !selection.has('FJ3145') &&
          ['HS_KIDNEY_CORTEX_L', 'HS_KIDNEY_COLUMNS_L', 'HS_KIDNEY_MEDULLA_L', 'HS_KIDNEY_HILUM_L'].some((id) =>
            selection.has(id),
          );
        const fadeRightKidneyShell =
          !selection.has('FJ3147') &&
          ['HS_KIDNEY_CORTEX_R', 'HS_KIDNEY_COLUMNS_R', 'HS_KIDNEY_MEDULLA_R', 'HS_KIDNEY_HILUM_R'].some((id) =>
            selection.has(id),
          );
        const fadeLeftKidneyCortex =
          !selection.has('HS_KIDNEY_CORTEX_L') &&
          (selection.has('HS_KIDNEY_MEDULLA_L') || selection.has('HS_KIDNEY_COLUMNS_L'));
        const fadeRightKidneyCortex =
          !selection.has('HS_KIDNEY_CORTEX_R') &&
          (selection.has('HS_KIDNEY_MEDULLA_R') || selection.has('HS_KIDNEY_COLUMNS_R'));
        const fadeProstateShell =
          !selection.has('FJ3139') &&
          s.selected.some(
            (id) =>
              id.startsWith('HM_PROSTATE_') ||
              id === 'HM_EJACULATORY_DUCT' ||
              id === 'HM_PROSTATIC_UTRICLE' ||
              id === 'HM_SEMINAL_COLLICULUS',
          );
        const fadeBladderShell =
          !selection.has('FJ3149') &&
          (selection.has('HM_BLADDER_TRIGONE') || selection.has('HM_BLADDER_NECK'));

        atlas.parts.forEach((p, i) => {
          const c = centers[i];
          const destination = offsets[i];
          let dx = 0;
          let dy = 0;
          let dz = 0;

          if (amount > 0.0001) {
            if (amount <= 0.45) {
              const t = amount / 0.45;
              const group = SYSTEMS.findIndex((sys) => sys.id === p.system);
              const angle = (group / SYSTEMS.length) * Math.PI * 2;
              dx = Math.sin(angle) * t * 0.48;
              dy = (c.y - 0.85) * t * 0.28;
              dz = Math.cos(angle) * t * 0.48;
            } else {
              const t = (amount - 0.45) / 0.55;
              const group = SYSTEMS.findIndex((sys) => sys.id === p.system);
              const angle = (group / SYSTEMS.length) * Math.PI * 2;
              dx = T.MathUtils.lerp(Math.sin(angle) * 0.48, destination.x - c.x, t);
              dy = T.MathUtils.lerp((c.y - 0.85) * 0.28, destination.y - c.y, t);
              dz = T.MathUtils.lerp(Math.cos(angle) * 0.48, -c.z, t);
            }
          }

          // Merge active kinematic / directional group separation transform
          let qx = 0;
          let qy = 0;
          let qz = 0;
          let qw = 1;
          let px = c.x;
          let py = c.y;
          let pz = c.z;
          const xform = s.partTransforms?.[p.id];
          if (xform && amount < 0.05) {
            dx += xform.translation[0];
            dy += xform.translation[1];
            dz += xform.translation[2];
            qx = xform.rotation[0];
            qy = xform.rotation[1];
            qz = xform.rotation[2];
            qw = xform.rotation[3];
            px = xform.pivot[0];
            py = xform.pivot[1];
            pz = xform.pivot[2];
          }

          // Smooth Dissection Removal slide + subtle peel rotation
          const fade = removalFade[i];
          if (fade > 0.002) {
            _vecA.subVectors(c, _worldOrigin);
            if (c.y > 1.48) _vecA.set(c.x, (c.y - 1.56) * 1.4 + 0.05, c.z * 1.2);
            if (_vecA.lengthSq() < 1e-5) _vecA.set(0, 0.1, 0.1);
            _vecA.normalize();
            const slideDist = 0.26 * fade;
            dx += _vecA.x * slideDist;
            dy += (_vecA.y + 0.25) * slideDist;
            dz += _vecA.z * slideDist;
            if (qx === 0 && qy === 0 && qz === 0) {
              _quatTmp.setFromAxisAngle(_vecB.set(-_vecA.z, 0, _vecA.x).normalize(), 0.22 * fade);
              qx = _quatTmp.x;
              qy = _quatTmp.y;
              qz = _quatTmp.z;
              qw = _quatTmp.w;
            }
          }

          const sexHidden = isPartHiddenForSex(p.id, activeSex, showPregnancy);
          const isSelected = !sexHidden && selection.has(p.id);
          const baseVisible = !sexHidden && (s.isolate ? isSelected : visible.has(p.system) || isSelected);
          const fullyRemoved = fade >= 0.996;
          const isTranslucentAnimating = fade > 0.002 && !fullyRemoved;
          let autoShellOp: number | undefined;
          if (p.id === 'FJ3145' && fadeLeftKidneyShell) autoShellOp = 0.16;
          else if (p.id === 'FJ3147' && fadeRightKidneyShell) autoShellOp = 0.16;
          else if (p.id === 'FJ3139' && fadeProstateShell) autoShellOp = 0.16;
          else if (p.id === 'FJ3149' && fadeBladderShell) autoShellOp = 0.20;
          const partOp = s.partOpacities?.[p.id] ?? autoShellOp;
          const isIndividuallyTransparent = partOp !== undefined && partOp < 0.995;

          const drawInMergedPass =
            baseVisible && !fullyRemoved && !isTranslucentAnimating && !isIndividuallyTransparent;

          data.set([dx, dy, dz, drawInMergedPass ? 1 : 0], i * 4);
          rotData.set([qx, qy, qz, qw], i * 4);
          pivotData.set([px, py, pz, 0], i * 4);

          const hasColorOverride = Boolean(s.partColorOverrides?.[p.id]);
          selectedData[i * 4] = isSelected && !(s.isolate && hasColorOverride) ? 255 : 0;
          selectedData[i * 4 + 1] = ghostActive ? 255 : dimmedSet.has(p.system) && !isSelected ? 255 : 0;
          selectedData[i * 4 + 2] = pinnedSet.has(p.id) ? 255 : 0;

          markerPositions.set(
            baseVisible && !fullyRemoved ? [c.x + dx, c.y + dy, c.z + dz] : [10000, 10000, 10000],
            i * 3,
          );

          const picker = pickers[i];
          if (picker) {
            _quatTmp.set(qx, qy, qz, qw);
            _vecPivot.set(px, py, pz);
            _vecRotPivot.copy(_vecPivot).applyQuaternion(_quatTmp);
            picker.quaternion.copy(_quatTmp);
            picker.position.set(
              dx + px - _vecRotPivot.x,
              dy + py - _vecRotPivot.y,
              dz + pz - _vecRotPivot.z,
            );
            picker.updateMatrix();
            picker.updateMatrixWorld(true);

            if (baseVisible && !fullyRemoved && (isTranslucentAnimating || isIndividuallyTransparent)) {
              const effAlpha = (partOp ?? 1) * (1 - fade);
              if (effAlpha > 0.03) {
                const tMat = getTranslucentMaterial(p.system, effAlpha, isSelected);
                const tMesh = new T.Mesh(picker.geometry, tMat);
                tMesh.userData.partIndex = i;
                tMesh.position.copy(picker.position);
                tMesh.quaternion.copy(picker.quaternion);
                translucentGroup.add(tMesh);
              }
            }
          }
        });

        if (lastColorOverridesRef !== s.partColorOverrides || lastState === null) {
          partColorData.fill(0);
          if (s.partColorOverrides) {
            for (const [partId, hex] of Object.entries(s.partColorOverrides)) {
              const idx = partIndexById.get(partId);
              if (idx === undefined) continue;
              const rgb = hexToRgbBytes(hex);
              if (!rgb) continue;
              partColorData[idx * 4] = rgb[0];
              partColorData[idx * 4 + 1] = rgb[1];
              partColorData[idx * 4 + 2] = rgb[2];
              partColorData[idx * 4 + 3] = 255;
            }
          }
          partColorTexture.needsUpdate = true;
          lastColorOverridesRef = s.partColorOverrides;
        }

        if (lastRelEdgesRef !== s.relationshipEdges) {
          syncRelationshipEdges(s.relationshipEdges);
          lastRelEdgesRef = s.relationshipEdges;
        }

        const syncOverlayGroup = (entries: OverlayMeshEntry[], group: T.Group, active: boolean) => {
          group.visible = active;
          if (!active) return;
          for (const oe of entries) {
            const fp = oe.part;
            const c = oe.center;
            const destination = oe.offset;
            let dx = 0;
            let dy = 0;
            let dz = 0;
            if (amount > 0.0001) {
              if (amount <= 0.45) {
                const t = amount / 0.45;
                const groupIdx = SYSTEMS.findIndex((sys) => sys.id === fp.system);
                const angle = (groupIdx / SYSTEMS.length) * Math.PI * 2;
                dx = Math.sin(angle) * t * 0.48;
                dy = (c.y - 0.85) * t * 0.28;
                dz = Math.cos(angle) * t * 0.48;
              } else {
                const t = (amount - 0.45) / 0.55;
                const groupIdx = SYSTEMS.findIndex((sys) => sys.id === fp.system);
                const angle = (groupIdx / SYSTEMS.length) * Math.PI * 2;
                dx = T.MathUtils.lerp(Math.sin(angle) * 0.48, destination.x - c.x, t);
                dy = T.MathUtils.lerp((c.y - 0.85) * 0.28, destination.y - c.y, t);
                dz = T.MathUtils.lerp(Math.cos(angle) * 0.48, -c.z, t);
              }
            }

            const xform = s.partTransforms?.[fp.id];
            if (xform && amount < 0.05) {
              _quatTmp.set(xform.rotation[0], xform.rotation[1], xform.rotation[2], xform.rotation[3]);
              _vecPivot.set(xform.pivot[0], xform.pivot[1], xform.pivot[2]);
              _vecRotPivot.copy(_vecPivot).applyQuaternion(_quatTmp);
              oe.mesh.quaternion.copy(_quatTmp);
              oe.mesh.position.set(
                dx + xform.translation[0] + _vecPivot.x - _vecRotPivot.x,
                dy + xform.translation[1] + _vecPivot.y - _vecRotPivot.y,
                dz + xform.translation[2] + _vecPivot.z - _vecRotPivot.z,
              );
            } else {
              oe.mesh.quaternion.set(0, 0, 0, 1);
              oe.mesh.position.set(dx, dy, dz);
            }
            oe.mesh.updateMatrix();
            oe.mesh.updateMatrixWorld(true);

            const isSelected = selection.has(fp.id);
            const isHidden = hiddenInputSet.has(fp.id);
            const baseVisible = !isHidden && (s.isolate ? isSelected : visible.has(fp.system) || isSelected);
            oe.mesh.visible = baseVisible;
            if (!baseVisible) continue;

            const isPinned = pinnedSet.has(fp.id);
            const isEnvelope = fp.system === 'integumentary';
            const explicitSysOp = s.systemOpacities?.[fp.system];
            let autoOverlayOp: number | undefined;
            if (fp.id === 'HS_KIDNEY_CORTEX_L' && fadeLeftKidneyCortex) autoOverlayOp = 0.22;
            else if (fp.id === 'HS_KIDNEY_CORTEX_R' && fadeRightKidneyCortex) autoOverlayOp = 0.22;
            const partOp = s.partOpacities?.[fp.id] ?? autoOverlayOp;
            const naturalOp =
              partOp !== undefined
                ? partOp
                : isSelected
                  ? Math.max(0.9, oe.baseOpacity)
                  : isEnvelope
                    ? Math.max(oe.baseOpacity, s.outerLayerOpacity ?? oe.baseOpacity)
                    : oe.baseOpacity;
            const sysOp = explicitSysOp !== undefined ? explicitSysOp : 1.0;
            const isDimmed = !isPinned && (ghostActive ? !isSelected : dimmedSet.has(fp.system) && !isSelected);
            const effAlpha = isPinned
              ? 1.0
              : (isDimmed ? Math.min(0.14, sysOp) : sysOp) * naturalOp;
            const shouldTransparent = effAlpha < 0.995;

            if (oe.material.transparent !== shouldTransparent || oe.material.depthWrite !== !shouldTransparent) {
              oe.material.transparent = shouldTransparent;
              oe.material.depthWrite = !shouldTransparent;
              oe.material.needsUpdate = true;
            }
            oe.material.opacity = effAlpha;
            oe.mesh.renderOrder = isSelected && ghostActive ? 5 : shouldTransparent ? 3 : 0;

            const overrideHex = s.partColorOverrides?.[fp.id];
            if (isSelected && !(s.isolate && overrideHex)) {
              oe.material.color.set(overrideHex ?? oe.baseColorHex).lerp(new T.Color('#1cb0b8'), overrideHex ? 0.25 : 0.78);
              oe.material.emissive.set('#0c4e55');
              oe.material.emissiveIntensity = ghostActive ? 0.35 : 0.22;
            } else {
              oe.material.color.set(overrideHex ?? oe.baseColorHex);
              oe.material.emissive.set('#000000');
              oe.material.emissiveIntensity = 0;
            }
          }
        };

        syncOverlayGroup(sharedEntries, sharedGroup, sharedLayer.ready);
        syncOverlayGroup(maleEnhancementEntries, maleEnhancementGroup, activeSex === 'male' && maleLayer.ready);
        syncOverlayGroup(femaleEntries, femaleGroup, activeSex === 'female' && femaleLayer.ready);
        syncOverlayGroup(pregnancyEntries, pregnancyGroup, showPregnancy && pregnancyLayer.ready);

        partTexture.needsUpdate = true;
        partRotTexture.needsUpdate = true;
        partPivotTexture.needsUpdate = true;
        selectionTexture.needsUpdate = true;
        markerGeometry.attributes.position.needsUpdate = true;
        syncHighlightOverlay(selection, ghostActive, s.partColorOverrides);

        lastAnatomySex = activeSex;
        lastShowPregnancy = showPregnancy;
        sharedLayer.justLoaded = false;
        maleLayer.justLoaded = false;
        femaleLayer.justLoaded = false;
        pregnancyLayer.justLoaded = false;
        lastState = s;
        lastOverlayKey = `${hiddenKey}|${partOpKey}|${clipKey}`;
        lastPinnedKey = pinnedKey;
        lastExtent = amount;
        dirty = true;
      }

      if (s.view !== lastView || s.reset !== lastReset) {
        camera.clearViewOffset();
        fit(s.view, amount, lastView === '');
        lastView = s.view;
        lastReset = s.reset;
      }

      if (moving && !s.isolate) {
        fit(amount > 0.5 ? 'front' : s.view, Math.max(0, (amount - 0.3) / 0.7), isSoftwareGl);
      }

      if (s.zoomStep && s.zoomStep.id !== lastZoomId) {
        lastZoomId = s.zoomStep.id;
        _vecA.subVectors(camera.position, controls.target);
        const curDist = Math.max(controls.minDistance, _vecA.length());
        const nextDist = T.MathUtils.clamp(curDist * s.zoomStep.delta, controls.minDistance, controls.maxDistance);
        _vecA.normalize().multiplyScalar(nextDist);
        camTargetGoal.copy(controls.target);
        camPosGoal.copy(controls.target).add(_vecA);
        if (isSoftwareGl) {
          camera.position.copy(camPosGoal);
          controls.update();
        } else {
          camTransitionActive = true;
        }
        dirty = true;
      }

      if (s.focusRequest && s.focusRequest !== lastFocusId && s.selected.length > 0 && !s.isolate) {
        lastFocusId = s.focusRequest;
        focusOnSelection(s.selected, s.inspectorOpen, s.embedded);
      }

      const isolateKey = s.isolate
        ? s.selected.join(',') + ':' + s.reset + ':' + s.inspectorOpen + ':' + Boolean(s.embedded) + ':' + camera.aspect
        : '';
      if (isolateKey !== lastIsolate || (s.isolate && moving)) {
        if (s.isolate) {
          focusOnSelection(s.selected, s.inspectorOpen, s.embedded);
        } else if (lastIsolate) {
          camera.clearViewOffset();
          fit(s.view, amount);
        }
        lastIsolate = isolateKey;
      }

      if (s.focusBox && s.focusBox.request !== lastFocusBoxId) {
        lastFocusBoxId = s.focusBox.request;
        _boxTmp.min.set(s.focusBox.min[0], s.focusBox.min[1], s.focusBox.min[2]);
        _boxTmp.max.set(s.focusBox.max[0], s.focusBox.max[1], s.focusBox.max[2]);
        focusOnBox(_boxTmp, s.inspectorOpen, s.embedded, s.focusBox.viewDirection);
      }

      if (camTransitionActive) {
        const k = 1 - Math.exp(-9 * dt);
        controls.target.lerp(camTargetGoal, k);
        camera.position.lerp(camPosGoal, k);
        if (
          controls.target.distanceToSquared(camTargetGoal) < 1e-6 &&
          camera.position.distanceToSquared(camPosGoal) < 1e-6
        ) {
          controls.target.copy(camTargetGoal);
          camera.position.copy(camPosGoal);
          camTransitionActive = false;
        }
        dirty = true;
      }

      const panMode = amount >= 0.8 || s.interactionMode === 'pan';
      controls.enableRotate = !panMode;
      controls.mouseButtons.LEFT = panMode ? T.MOUSE.PAN : T.MOUSE.ROTATE;
      controls.touches.ONE = panMode ? T.TOUCH.PAN : T.TOUCH.ROTATE;

      ground.visible = platform.visible = ring.visible = innerRing.visible = amount < 0.5 && !s.isolate;
      markers.visible = amount > 0.75;
      controls.autoRotate = !isSoftwareGl && s.rotate && !s.isolate && amount < 0.4;
      controls.autoRotateSpeed = 0.65;
      controls.update();
      if (controls.autoRotate) dirty = true;

      if (dirty) {
        if (isSoftwareGl && !ready) {
          // Wait for base chunks to finish before software WebGL draw
        } else {
          renderer.render(scene, camera);
          targets = [];
          if (amount > 0.45) {
            const hasSolid = atlas.parts.some(
              (p, i) =>
                !isPartHiddenForSex(p.id, activeSex, showPregnancy) &&
                p.system !== 'integumentary' &&
                data[i * 4 + 3] > 0.5,
            );
            atlas.parts.forEach((p, i) => {
              if (
                isPartHiddenForSex(p.id, activeSex, showPregnancy) ||
                data[i * 4 + 3] < 0.5 ||
                (hasSolid && p.system === 'integumentary')
              )
                return;
              let left = Infinity;
              let right = -Infinity;
              let top = Infinity;
              let bottom = -Infinity;
              for (let corner = 0; corner < 8; corner++) {
                projected
                  .set(
                    p.bounds[corner & 1 ? 1 : 0][0] + data[i * 4],
                    p.bounds[corner & 2 ? 1 : 0][1] + data[i * 4 + 1],
                    p.bounds[corner & 4 ? 1 : 0][2] + data[i * 4 + 2],
                  )
                  .project(camera);
                const x = ((projected.x + 1) * el.clientWidth) / 2;
                const y = ((1 - projected.y) * el.clientHeight) / 2;
                left = Math.min(left, x);
                right = Math.max(right, x);
                top = Math.min(top, y);
                bottom = Math.max(bottom, y);
              }
              projected.copy(centers[i]).add(_vecA.set(data[i * 4], data[i * 4 + 1], data[i * 4 + 2])).project(camera);
              if (projected.z < -1 || projected.z > 1) return;
              targets.push({
                id: p.id,
                name: p.name,
                x: ((projected.x + 1) * el.clientWidth) / 2,
                y: ((1 - projected.y) * el.clientHeight) / 2,
                left,
                right,
                top,
                bottom,
              });
            });
            const activeTargetLists: OverlayMeshEntry[][] = [];
            if (sharedLayer.ready) activeTargetLists.push(sharedEntries);
            if (activeSex === 'male' && maleLayer.ready) activeTargetLists.push(maleEnhancementEntries);
            if (activeSex === 'female' && femaleLayer.ready) activeTargetLists.push(femaleEntries);
            if (showPregnancy && pregnancyLayer.ready) activeTargetLists.push(pregnancyEntries);
            for (const list of activeTargetLists) {
              for (const oe of list) {
                if (!oe.mesh.visible) continue;
                let left = Infinity;
                let right = -Infinity;
                let top = Infinity;
                let bottom = -Infinity;
                for (let corner = 0; corner < 8; corner++) {
                  projected
                    .set(
                      oe.part.bounds[corner & 1 ? 1 : 0][0] + oe.mesh.position.x,
                      oe.part.bounds[corner & 2 ? 1 : 0][1] + oe.mesh.position.y,
                      oe.part.bounds[corner & 4 ? 1 : 0][2] + oe.mesh.position.z,
                    )
                    .project(camera);
                  const x = ((projected.x + 1) * el.clientWidth) / 2;
                  const y = ((1 - projected.y) * el.clientHeight) / 2;
                  left = Math.min(left, x);
                  right = Math.max(right, x);
                  top = Math.min(top, y);
                  bottom = Math.max(bottom, y);
                }
                projected.copy(oe.center).add(oe.mesh.position).project(camera);
                if (projected.z < -1 || projected.z > 1) continue;
                targets.push({
                  id: oe.part.id,
                  name: oe.part.name,
                  x: ((projected.x + 1) * el.clientWidth) / 2,
                  y: ((1 - projected.y) * el.clientHeight) / 2,
                  left,
                  right,
                  top,
                  bottom,
                });
              }
            }
          }
          dirty = false;
          if (isSoftwareGl) {
            swRenderBusy = true;
            afterDraw(() => {
              swRenderBusy = false;
              if (disposed) return;
              if (swWakeQueued || dirty) {
                swWakeQueued = false;
                wakeRender();
              }
            });
          }
        }
      }
    };
    if (isSoftwareGl) {
      wakeRender();
    } else {
      animate();
    }

    const contextLost = (e: Event) => {
      e.preventDefault();
      onError('The 3D WebGL context was paused by your device. Tap reload to resume.');
    };
    const contextRestored = () => {
      onError('');
      dirty = true;
      wakeRender();
    };
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    renderer.domElement.addEventListener('webglcontextrestored', contextRestored);

    return () => {
      disposed = true;
      wakeRef.current = () => {};
      abort.abort();
      cancelAnimationFrame(frame);
      clearTimeout(swTimerId);
      observer.disconnect();
      renderer.domElement.removeEventListener('pointerdown', down);
      renderer.domElement.removeEventListener('pointermove', move);
      renderer.domElement.removeEventListener('pointerup', up);
      renderer.domElement.removeEventListener('pointercancel', cancel);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', contextRestored);
      controls.dispose();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      for (const list of allOverlayEntryLists) {
        list.forEach((oe) => {
          oe.mesh.geometry.dispose();
          oe.material.dispose();
        });
        list.length = 0;
      }
      disposeEdgeGroup();
      highlightMaterial.dispose();
      colorHighlightMaterials.forEach((m) => m.dispose());
      translucentMaterials.forEach((m) => m.dispose());
      scene.traverse((o) => {
        if ((o instanceof T.Mesh || o instanceof T.LineLoop) && !geometries.includes(o.geometry)) {
          o.geometry.dispose();
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          ms.forEach((m) => m.dispose());
        }
      });
      env.dispose();
      partTexture.dispose();
      partRotTexture.dispose();
      partPivotTexture.dispose();
      selectionTexture.dispose();
      partColorTexture.dispose();
      partMaterialTexture.dispose();
      tissueTextureLib.dispose();
      markerGeometry.dispose();
      markerMaterial.dispose();
      hover.remove();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [atlas]);

  return <div className="scene" ref={host} />;
}
