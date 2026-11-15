import { useEffect, useRef } from 'react';
import * as T from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createExplosionLayout } from './explosion-layout';
import { decodeModelResponse } from './model-download';
import { PointerTap } from './pointer-tap';
import { SYSTEMS, type Atlas, type SceneState } from './anatomy';

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
const _boxTmp = new T.Box3();

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
  latest.current = state;
  select.current = onSelect;

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    let disposed = false;
    let frame = 0;
    let dirty = true;
    let ready = false;
    let lastView = '';
    let lastReset = -1;
    let lastIsolate = '';
    let lastZoomId = 0;
    let lastFocusId = 0;
    let layoutKey = '';
    let amount = 0;
    let lastState: SceneState | null = null;
    let lastGhostMode = false;

    const isSoftwareGl = detectSoftwareWebGL();
    const abort = new AbortController();

    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch {
      onError('This browser could not start the 3D viewer. Please enable WebGL and reload.');
      return;
    }

    const updatePixelRatio = () => {
      if (isSoftwareGl) {
        renderer.setPixelRatio(1);
      } else {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, el.clientWidth < 768 || el.clientHeight < 600 ? 1.5 : 2));
      }
    };
    updatePixelRatio();
    renderer.setClearColor('#f4f6f8');
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      'aria-label',
      'Interactive 3D human anatomy model. Drag to orbit or pan, scroll or pinch to zoom, and tap a structure to inspect it.',
    );

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(34, Math.max(1, el.clientWidth) / Math.max(1, el.clientHeight), 0.005, 100);
    const controls = new OrbitControls(camera, renderer.domElement);
    camera.position.set(1.4, 1.05, 3.6);
    controls.target.set(0, 0.85, 0);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.085;
    controls.minDistance = 0.07;
    controls.maxDistance = 40;
    controls.maxPolarAngle = Math.PI * 0.96;

    // Smooth camera transition state (cancelled immediately when user grabs controls)
    let camTransitionActive = false;
    const camTargetGoal = new T.Vector3().copy(controls.target);
    const camPosGoal = new T.Vector3().copy(camera.position);

    controls.addEventListener('start', () => {
      camTransitionActive = false;
    });
    controls.addEventListener('change', () => {
      dirty = true;
    });

    const pmrem = new T.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04);
    scene.environment = env.texture;
    room.dispose();
    pmrem.dispose();

    scene.add(new T.HemisphereLight(0xffffff, 0xa7acb2, 1.05));
    const key = new T.DirectionalLight(0xfffaf4, 2.3);
    key.position.set(-2, 4, 3);
    scene.add(key);
    const rim = new T.DirectionalLight(0xe9f0ff, 1.8);
    rim.position.set(2, 2, -3);
    scene.add(rim);

    const ground = new T.Mesh(
      new T.CircleGeometry(30, 96),
      new T.MeshStandardMaterial({ color: 0xd9dfe4, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.019;
    scene.add(ground);

    const platform = new T.Mesh(
      new T.CylinderGeometry(0.68, 0.7, 0.028, 100),
      new T.MeshStandardMaterial({ color: 0xf1f3f5, metalness: 0.1, roughness: 0.68 }),
    );
    platform.position.y = -0.016;
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

    const width = T.MathUtils.ceilPowerOfTwo(atlas.parts.length);
    const data = new Float32Array(width * 4);
    const partTexture = new T.DataTexture(data, width, 1, T.RGBAFormat, T.FloatType);
    partTexture.needsUpdate = true;

    const selectedData = new Uint8Array(width * 4);
    const selectionTexture = new T.DataTexture(selectedData, width, 1);
    selectionTexture.needsUpdate = true;

    const materials: T.MeshStandardMaterial[] = [];
    const geometries: T.BufferGeometry[] = [];
    const pickers: (T.Mesh | undefined)[] = [];
    const centers = atlas.parts.map((p) =>
      new T.Vector3().fromArray(p.bounds[0]).add(new T.Vector3().fromArray(p.bounds[1])).multiplyScalar(0.5),
    );
    const offsets: T.Vector3[] = [];
    const bounds = atlas.parts.map(
      (p) => new T.Box3(new T.Vector3().fromArray(p.bounds[0]), new T.Vector3().fromArray(p.bounds[1])),
    );

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

    // Highlight overlay group for transparent-surroundings mode (reuses picker geometries with zero extra memory)
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
    const highlightMeshes: { index: number; mesh: T.Mesh }[] = [];

    const hover = document.createElement('div');
    hover.className = 'part-hover';
    hover.setAttribute('role', 'tooltip');
    hover.hidden = true;
    el.appendChild(hover);

    type Target = { index: number; x: number; y: number; left: number; right: number; top: number; bottom: number };
    let targets: Target[] = [];
    const projected = new T.Vector3();

    const findTarget = (x: number, y: number, radius: number) => {
      let best = -1;
      let score = Infinity;
      for (const t of targets) {
        const dx = Math.max(t.left - x, 0, x - t.right);
        const dy = Math.max(t.top - y, 0, y - t.bottom);
        const distance = Math.hypot(dx, dy);
        if (distance > radius) continue;
        const candidate = distance + Math.hypot(t.x - x, t.y - y) * 0.025;
        if (candidate < score) {
          score = candidate;
          best = t.index;
        }
      }
      return best;
    };

    const materialFor = (system: string) => {
      const m = new T.MeshStandardMaterial({
        color: SYSTEMS.find((s) => s.id === system)?.color ?? '#aebbb8',
        metalness: 0.08,
        roughness: 0.53,
        side: T.DoubleSide,
        transparent: system === 'integumentary',
        opacity: system === 'integumentary' ? 0.1 : 1,
        depthWrite: system !== 'integumentary',
      });
      m.userData.baseSystem = system;
      m.onBeforeCompile = (shader) => {
        shader.uniforms.partState = { value: partTexture };
        shader.uniforms.selectionState = { value: selectionTexture };
        shader.uniforms.stateWidth = { value: width };
        shader.vertexShader =
          'attribute float partIndex; uniform sampler2D partState; uniform sampler2D selectionState; uniform float stateWidth; varying float partVisible; varying float partSelected; varying float partDimmed;\n' +
          shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          vec2 stateUv = vec2((partIndex + 0.5) / stateWidth, 0.5);
          vec4 state = texture2D(partState, stateUv);
          vec4 selState = texture2D(selectionState, stateUv);
          transformed += state.xyz;
          partVisible = state.w;
          partSelected = selState.r;
          partDimmed = selState.g;`,
        );
        shader.fragmentShader =
          'varying float partVisible; varying float partSelected; varying float partDimmed;\n' +
          shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <clipping_planes_fragment>',
          '#include <clipping_planes_fragment>\nif (partVisible < 0.5) discard;\nif (partDimmed > 0.5 && partSelected > 0.5) discard;',
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <color_fragment>',
          `#include <color_fragment>
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.11, 0.68, 0.71), partSelected * 0.78);
          if (partDimmed > 0.5 && partSelected < 0.5) {
            diffuseColor.a *= 0.13;
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
        scene.add(mesh);
      });

      lastState = null;
      loaded++;
      onProgress(Math.round((loaded / atlas.chunks.length) * 100));
      dirty = true;
    };

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
              (1.8 * el.clientHeight) / Math.max(160, el.clientHeight - 350) / (2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2))),
            )
          : 4;
      const reservedHeight = embedded ? 72 : mobile ? 350 : 270;
      const sideReserve = embedded ? 40 : mobile ? 40 : 340;
      const availableAspect = Math.max(
        0.35,
        (el.clientWidth - sideReserve) / Math.max(160, el.clientHeight - reservedHeight),
      );
      const atlasDistance =
        (Math.max(packingHeight, packingWidth / availableAspect) / (2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2)))) *
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

    const focusOnSelection = (selectedIds: string[], inspectorOpen?: boolean, embedded?: boolean) => {
      if (!selectedIds.length) return;
      _boxTmp.makeEmpty();
      const selSet = new Set(selectedIds);
      atlas.parts.forEach((p, i) => {
        if (selSet.has(p.id)) {
          _vecA.set(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
          _boxTmp.union(bounds[i].clone().translate(_vecA));
        }
      });
      if (_boxTmp.isEmpty()) return;

      const center = _boxTmp.getCenter(_vecB);
      const size = _boxTmp.getSize(_vecC);
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

      const distance = Math.max(
        0.16,
        (Math.max(
          (size.y * h) / availableHeight,
          (size.x * w) / availableWidth / Math.max(0.25, camera.aspect),
          size.z,
        ) /
          (2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2)))) *
          1.45,
      );
      controls.maxDistance = Math.max(40, distance * 2.5);
      camTargetGoal.copy(center);
      _vecA.subVectors(camera.position, controls.target);
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
      if (e.buttons || amount < 0.5 || e.pointerType === 'touch') {
        hover.hidden = true;
        return;
      }
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const index = findTarget(x, y, 12);
      hover.hidden = index < 0;
      renderer.domElement.style.cursor = index < 0 ? 'grab' : 'pointer';
      if (index >= 0) {
        hover.textContent = atlas.parts[index].name;
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
      let found = -1;
      const hasSolid = atlas.parts.some((p, i) => p.system !== 'integumentary' && data[i * 4 + 3] > 0.5);

      pickers.forEach((mesh, i) => {
        if (!mesh || data[i * 4 + 3] < 0.5 || (hasSolid && atlas.parts[i].system === 'integumentary')) return;
        worldBox.copy(bounds[i]).translate(mesh.position);
        if (!raycaster.ray.intersectBox(worldBox, hitPoint)) return;
        const hits = raycaster.intersectObject(mesh, false);
        if (hits[0] && hits[0].distance < nearest) {
          nearest = hits[0].distance;
          found = i;
        }
      });

      if (found < 0 && amount > 0.45) {
        found = findTarget(e.clientX - rect.left, e.clientY - rect.top, e.pointerType === 'touch' ? 24 : 16);
      }
      if (found >= 0) {
        hover.hidden = true;
        select.current(atlas.parts[found].id);
      }
    };

    renderer.domElement.addEventListener('pointerdown', down);
    renderer.domElement.addEventListener('pointermove', move);
    renderer.domElement.addEventListener('pointerup', up);
    renderer.domElement.addEventListener('pointercancel', cancel);

    const syncHighlightOverlay = (selection: Set<string>, activeGhost: boolean) => {
      // Remove previous highlight meshes (geometries belong to pickers, never disposed here)
      while (highlightGroup.children.length > 0) {
        highlightGroup.remove(highlightGroup.children[0]);
      }
      highlightMeshes.length = 0;
      if (!activeGhost || selection.size === 0) return;
      atlas.parts.forEach((p, i) => {
        if (!selection.has(p.id)) return;
        const picker = pickers[i];
        if (!picker) return;
        const m = new T.Mesh(picker.geometry, highlightMaterial);
        m.position.set(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
        highlightGroup.add(m);
        highlightMeshes.push({ index: i, mesh: m });
      });
    };

    const clock = new T.Clock();
    let lastExtent = -1;

    const animate = () => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const s = latest.current;

      const ghostActive = Boolean(s.ghostSurroundings && s.selected.length > 0 && !s.isolate);
      const changed =
        lastState?.visible !== s.visible ||
        lastState?.selected !== s.selected ||
        lastState?.isolate !== s.isolate ||
        lastGhostMode !== ghostActive;

      const moving = Math.abs(amount - s.explode) > 0.0001;
      if (moving) {
        amount = isSoftwareGl ? s.explode : T.MathUtils.damp(amount, s.explode, 8, dt);
        if (Math.abs(amount - s.explode) <= 0.0001) amount = s.explode;
        dirty = true;
      }

      if (changed || moving || lastExtent < 0) {
        const visible = new Set(s.visible);
        const selection = new Set(s.selected);
        const visibleParts = atlas.parts.filter((p) =>
          s.isolate ? selection.has(p.id) : visible.has(p.system) || selection.has(p.id),
        );
        const nextLayoutKey = visibleParts.map((p) => p.id).join(',') + ':' + camera.aspect.toFixed(3);
        if (nextLayoutKey !== layoutKey) {
          const layout = createExplosionLayout(visibleParts, camera.aspect);
          packingWidth = layout.width;
          packingHeight = layout.height;
          atlas.parts.forEach((p, i) => {
            const cell = layout.cells.get(p.id);
            offsets[i] = cell ? new T.Vector3(cell.x, cell.y + 0.85, 0) : centers[i].clone();
          });
          layoutKey = nextLayoutKey;
          if (amount > 0.05 && !s.isolate) fit(s.view, Math.max(0, (amount - 0.3) / 0.7));
        }

        if (lastGhostMode !== ghostActive) {
          materials.forEach((mat) => {
            const isSkin = mat.userData.baseSystem === 'integumentary';
            mat.transparent = ghostActive || isSkin;
            mat.depthWrite = ghostActive ? false : !isSkin;
            mat.needsUpdate = true;
          });
          lastGhostMode = ghostActive;
        }

        atlas.parts.forEach((p, i) => {
          const c = centers[i];
          const destination = offsets[i];
          let dx = 0;
          let dy = 0;
          let dz = 0;
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
          const isSelected = selection.has(p.id);
          const isPartVisible = s.isolate ? isSelected : visible.has(p.system) || isSelected;
          data.set([dx, dy, dz, isPartVisible ? 1 : 0], i * 4);
          selectedData[i * 4] = isSelected ? 255 : 0;
          selectedData[i * 4 + 1] = ghostActive ? 255 : 0;
          markerPositions.set(isPartVisible ? [c.x + dx, c.y + dy, c.z + dz] : [10000, 10000, 10000], i * 3);
          const mesh = pickers[i];
          if (mesh) {
            mesh.position.set(dx, dy, dz);
            mesh.updateMatrix();
            mesh.updateMatrixWorld(true);
          }
        });

        partTexture.needsUpdate = true;
        selectionTexture.needsUpdate = true;
        markerGeometry.attributes.position.needsUpdate = true;
        syncHighlightOverlay(selection, ghostActive);
        for (const h of highlightMeshes) {
          h.mesh.position.set(data[h.index * 4], data[h.index * 4 + 1], data[h.index * 4 + 2]);
        }

        lastState = s;
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

      const isolateKey = s.isolate ? s.selected.join(',') + ':' + s.reset + ':' + s.inspectorOpen + ':' + Boolean(s.embedded) + ':' + camera.aspect : '';
      if (isolateKey !== lastIsolate || (s.isolate && moving)) {
        if (s.isolate) {
          focusOnSelection(s.selected, s.inspectorOpen, s.embedded);
        } else if (lastIsolate) {
          camera.clearViewOffset();
          fit(s.view, amount);
        }
        lastIsolate = isolateKey;
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
        renderer.render(scene, camera);
        targets = [];
        if (amount > 0.45) {
          const hasSolid = atlas.parts.some((p, i) => p.system !== 'integumentary' && data[i * 4 + 3] > 0.5);
          atlas.parts.forEach((p, i) => {
            if (data[i * 4 + 3] < 0.5 || (hasSolid && p.system === 'integumentary')) return;
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
              index: i,
              x: ((projected.x + 1) * el.clientWidth) / 2,
              y: ((1 - projected.y) * el.clientHeight) / 2,
              left,
              right,
              top,
              bottom,
            });
          });
        }
        dirty = false;
      }
    };
    animate();

    const contextLost = (e: Event) => {
      e.preventDefault();
      onError('The 3D WebGL context was paused by your device. Tap reload to resume.');
    };
    const contextRestored = () => {
      onError('');
      dirty = true;
    };
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    renderer.domElement.addEventListener('webglcontextrestored', contextRestored);

    return () => {
      disposed = true;
      abort.abort();
      cancelAnimationFrame(frame);
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
      highlightMaterial.dispose();
      scene.traverse((o) => {
        if (o instanceof T.Mesh && !geometries.includes(o.geometry)) {
          o.geometry.dispose();
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          ms.forEach((m) => m.dispose());
        }
      });
      env.dispose();
      partTexture.dispose();
      selectionTexture.dispose();
      markerGeometry.dispose();
      markerMaterial.dispose();
      hover.remove();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [atlas]);

  return <div className="scene" ref={host} />;
}
