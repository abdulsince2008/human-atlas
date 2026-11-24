import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { MeshoptSimplifier } from 'meshoptimizer';

await MeshoptSimplifier.ready;

const TMP_DIR = process.env.HUBMAP_DIR || '/tmp/hubmap_check';
const OUT_DIR = path.resolve('public/models/female');
const APPEND_INNERBODY_MODE = process.argv.includes('--append-innerbody');
fs.mkdirSync(OUT_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Two-region co-registration from HuBMAP Visible Human Female HRA v1.5 world
// space (glTF node hierarchy resolved) into BodyParts3D Y-up meters.
// ---------------------------------------------------------------------------

// 1. Pelvis & pelvic viscera alignment (matched to BP3D Sacrum + L/R Hip + Rectum + Iliac vessels)
const PELVIS_H_CENTER = [-0.0086, 0.0589, -0.0911];
const PELVIS_B_TARGET = [-0.0004, 0.933, -0.034];
const PELVIS_SCALE = [0.92, 0.97, 0.82];

function xformPelvis(x, y, z) {
  return [
    (x - PELVIS_H_CENTER[0]) * PELVIS_SCALE[0] + PELVIS_B_TARGET[0],
    (y - PELVIS_H_CENTER[1]) * PELVIS_SCALE[1] + PELVIS_B_TARGET[1],
    (z - PELVIS_H_CENTER[2]) * PELVIS_SCALE[2] + PELVIS_B_TARGET[2],
  ];
}

// 2. Thorax / Mammary Gland alignment (matched directly onto BP3D anterior pectoralis major fascia)
function xformChest(x, y, z) {
  return [
    (x - -0.00605) * 0.96,
    1.275 + (y - 0.414) * 0.92,
    0.092 + (z - 0.021) * 1.0,
  ];
}

// ---------------------------------------------------------------------------
// glTF 2.0 binary reader with full node-hierarchy worldMatrix evaluation
// ---------------------------------------------------------------------------

function mat4Mul(a, b) {
  const out = new Float64Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      out[c * 4 + r] =
        a[0 * 4 + r] * b[c * 4 + 0] +
        a[1 * 4 + r] * b[c * 4 + 1] +
        a[2 * 4 + r] * b[c * 4 + 2] +
        a[3 * 4 + r] * b[c * 4 + 3];
    }
  }
  return out;
}

function nodeLocalMat(n) {
  if (n.matrix) return Float64Array.from(n.matrix);
  const t = n.translation || [0, 0, 0];
  const q = n.rotation || [0, 0, 0, 1];
  const s = n.scale || [1, 1, 1];
  const [x, y, z, w] = q;
  const x2 = x + x;
  const y2 = y + y;
  const z2 = z + z;
  const xx = x * x2;
  const xy = x * y2;
  const xz = x * z2;
  const yy = y * y2;
  const yz = y * z2;
  const zz = z * z2;
  const wx = w * x2;
  const wy = w * y2;
  const wz = w * z2;
  const [sx, sy, sz] = s;
  return Float64Array.from([
    (1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0,
    (xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0,
    (xz + wy) * sz, (yz - wx) * sz, (1 - (xx + yy)) * sz, 0,
    t[0], t[1], t[2], 1,
  ]);
}

function readGlbWithScene(filePath) {
  const buf = fs.readFileSync(filePath);
  const magic = buf.readUInt32LE(0);
  if (magic !== 0x46546c67) throw new Error(`Invalid GLB magic in ${filePath}`);
  const jsonLen = buf.readUInt32LE(12);
  const gltf = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
  const binOffset = 20 + jsonLen;
  const binLen = buf.readUInt32LE(binOffset);
  const bin = buf.subarray(binOffset + 8, binOffset + 8 + binLen);

  const worldMats = new Array(gltf.nodes?.length ?? 0);
  const ident = Float64Array.from([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);
  const walk = (idx, parentMat) => {
    const m = mat4Mul(parentMat, nodeLocalMat(gltf.nodes[idx]));
    worldMats[idx] = m;
    for (const ch of gltf.nodes[idx].children ?? []) {
      walk(ch, m);
    }
  };
  const scene = gltf.scenes?.[gltf.scene ?? 0];
  for (const r of scene?.nodes ?? []) walk(r, ident);

  return { gltf, bin, worldMats };
}

const glbCache = new Map();
function getLoadedGlb(glbFile) {
  if (APPEND_INNERBODY_MODE) return null;
  if (!glbCache.has(glbFile)) {
    glbCache.set(glbFile, readGlbWithScene(path.join(TMP_DIR, glbFile)));
  }
  return glbCache.get(glbFile);
}

function readAccessorPositions(gltf, bin, accIdx) {
  const acc = gltf.accessors[accIdx];
  const bv = gltf.bufferViews[acc.bufferView];
  const baseOffset = (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  const stride = bv.byteStride || 12;
  const out = new Float32Array(acc.count * 3);
  for (let i = 0; i < acc.count; i++) {
    const off = baseOffset + i * stride;
    out[i * 3] = bin.readFloatLE(off);
    out[i * 3 + 1] = bin.readFloatLE(off + 4);
    out[i * 3 + 2] = bin.readFloatLE(off + 8);
  }
  return out;
}

function readAccessorIndices(gltf, bin, accIdx, vertexCount) {
  if (accIdx === undefined) {
    const out = new Uint32Array(vertexCount);
    for (let i = 0; i < vertexCount; i++) out[i] = i;
    return out;
  }
  const acc = gltf.accessors[accIdx];
  const bv = gltf.bufferViews[acc.bufferView];
  const baseOffset = (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  const out = new Uint32Array(acc.count);
  if (acc.componentType === 5123) {
    const stride = bv.byteStride || 2;
    for (let i = 0; i < acc.count; i++) out[i] = bin.readUInt16LE(baseOffset + i * stride);
  } else if (acc.componentType === 5125) {
    const stride = bv.byteStride || 4;
    for (let i = 0; i < acc.count; i++) out[i] = bin.readUInt32LE(baseOffset + i * stride);
  } else {
    throw new Error(`Unsupported index componentType ${acc.componentType}`);
  }
  return out;
}

function extractNodeMeshes(glbFile, nodeNamePredicate, transformFn) {
  if (APPEND_INNERBODY_MODE) {
    return { positions: new Float32Array(0), indices: new Uint32Array(0), skipped: true };
  }
  const { gltf, bin, worldMats } = getLoadedGlb(glbFile);
  const posList = [];
  const idxList = [];
  let vertOffset = 0;

  for (let ni = 0; ni < (gltf.nodes?.length ?? 0); ni++) {
    const node = gltf.nodes[ni];
    if (node.mesh === undefined) continue;
    const mesh = gltf.meshes[node.mesh];
    const name = node.name || mesh.name || '';
    if (!nodeNamePredicate(name)) continue;

    const m = worldMats[ni];
    for (const prim of mesh.primitives ?? []) {
      const posAccIdx = prim.attributes?.POSITION;
      if (posAccIdx === undefined) continue;
      const rawPos = readAccessorPositions(gltf, bin, posAccIdx);
      const rawIdx = readAccessorIndices(gltf, bin, prim.indices, rawPos.length / 3);

      for (let i = 0; i < rawPos.length; i += 3) {
        const x = rawPos[i];
        const y = rawPos[i + 1];
        const z = rawPos[i + 2];
        const wx = m[0] * x + m[4] * y + m[8] * z + m[12];
        const wy = m[1] * x + m[5] * y + m[9] * z + m[13];
        const wz = m[2] * x + m[6] * y + m[10] * z + m[14];
        const [tx, ty, tz] = transformFn(wx, wy, wz);
        posList.push(tx, ty, tz);
      }
      for (let i = 0; i < rawIdx.length; i++) {
        idxList.push(rawIdx[i] + vertOffset);
      }
      vertOffset += rawPos.length / 3;
    }
  }

  if (posList.length === 0 || idxList.length === 0) {
    throw new Error(`No matching node geometry extracted from ${glbFile}`);
  }
  return {
    positions: new Float32Array(posList),
    indices: new Uint32Array(idxList),
  };
}

function weldAndSimplify({ positions, indices }, targetTriangles, minTriangles = 80, checkWinding = false) {
  const vertCount = positions.length / 3;
  const map = new Map();
  const remap = new Uint32Array(vertCount);
  const weldedPos = [];
  for (let i = 0; i < vertCount; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    const key = `${Math.round(x * 1e5)}_${Math.round(y * 1e5)}_${Math.round(z * 1e5)}`;
    let idx = map.get(key);
    if (idx === undefined) {
      idx = weldedPos.length / 3;
      map.set(key, idx);
      weldedPos.push(x, y, z);
    }
    remap[i] = idx;
  }

  let curPos = new Float32Array(weldedPos);
  const rawIdx = [];
  for (let i = 0; i < indices.length; i += 3) {
    const a = remap[indices[i]];
    const b = remap[indices[i + 1]];
    const c = remap[indices[i + 2]];
    if (a !== b && b !== c && c !== a) {
      rawIdx.push(a, b, c);
    }
  }
  let curIdx = new Uint32Array(rawIdx);
  const currentTris = curIdx.length / 3;

  if (currentTris > targetTriangles && currentTris > minTriangles) {
    const goal = Math.max(minTriangles, targetTriangles) * 3;
    const [simplified] = MeshoptSimplifier.simplify(curIdx, curPos, 3, goal, 0.0025);
    if (simplified.length / 3 >= Math.min(minTriangles, 50)) {
      const [compactRemap, count] = MeshoptSimplifier.compactMesh(simplified);
      const nextPos = new Float32Array(count * 3);
      for (let old = 0; old < compactRemap.length; old++) {
        const n = compactRemap[old];
        if (n === 0xffffffff) continue;
        nextPos.set(curPos.subarray(old * 3, old * 3 + 3), n * 3);
      }
      curPos = nextPos;
      curIdx = simplified;
    }
  }

  const vLen = curPos.length / 3;
  const accum = new Float32Array(vLen * 3);
  for (let i = 0; i < curIdx.length; i += 3) {
    const ia = curIdx[i] * 3;
    const ib = curIdx[i + 1] * 3;
    const ic = curIdx[i + 2] * 3;
    const ux = curPos[ib] - curPos[ia];
    const uy = curPos[ib + 1] - curPos[ia + 1];
    const uz = curPos[ib + 2] - curPos[ia + 2];
    const vx = curPos[ic] - curPos[ia];
    const vy = curPos[ic + 1] - curPos[ia + 1];
    const vz = curPos[ic + 2] - curPos[ia + 2];
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    accum[ia] += nx; accum[ia + 1] += ny; accum[ia + 2] += nz;
    accum[ib] += nx; accum[ib + 1] += ny; accum[ib + 2] += nz;
    accum[ic] += nx; accum[ic + 1] += ny; accum[ic + 2] += nz;
  }
  const normals = new Int16Array(vLen * 3);
  for (let i = 0; i < vLen * 3; i += 3) {
    const len = Math.hypot(accum[i], accum[i + 1], accum[i + 2]) || 1;
    normals[i] = Math.max(-32767, Math.min(32767, Math.round((accum[i] / len) * 32767)));
    normals[i + 1] = Math.max(-32767, Math.min(32767, Math.round((accum[i + 1] / len) * 32767)));
    normals[i + 2] = Math.max(-32767, Math.min(32767, Math.round((accum[i + 2] / len) * 32767)));
  }

  const bmin = [Infinity, Infinity, Infinity];
  const bmax = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < curPos.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      bmin[k] = Math.min(bmin[k], curPos[i + k]);
      bmax[k] = Math.max(bmax[k], curPos[i + k]);
    }
  }

  if (checkWinding) {
    const cx = (bmin[0] + bmax[0]) * 0.5;
    const cy = (bmin[1] + bmax[1]) * 0.5;
    const cz = (bmin[2] + bmax[2]) * 0.5;
    let dotSum = 0;
    for (let i = 0; i < curPos.length; i += 3) {
      dotSum +=
        (curPos[i] - cx) * normals[i] +
        (curPos[i + 1] - cy) * normals[i + 1] +
        (curPos[i + 2] - cz) * normals[i + 2];
    }
    if (dotSum < 0) {
      for (let i = 0; i < curIdx.length; i += 3) {
        const tmp = curIdx[i + 1];
        curIdx[i + 1] = curIdx[i + 2];
        curIdx[i + 2] = tmp;
      }
      for (let i = 0; i < normals.length; i++) normals[i] = -normals[i];
    }
  }

  return { positions: curPos, normals, indices: curIdx, bounds: [bmin, bmax] };
}

function buildTubeMesh(points, radiusFn, radialSegments = 16, squashX = 1.0, squashY = 1.0) {
  const rings = points.length;
  const pos = [];
  const idx = [];
  for (let r = 0; r < rings; r++) {
    const p = points[r];
    const pPrev = points[Math.max(0, r - 1)];
    const pNext = points[Math.min(rings - 1, r + 1)];
    let tx = pNext[0] - pPrev[0];
    let ty = pNext[1] - pPrev[1];
    let tz = pNext[2] - pPrev[2];
    const tLen = Math.hypot(tx, ty, tz) || 1;
    tx /= tLen; ty /= tLen; tz /= tLen;
    let rx = 1, ry = 0, rz = 0;
    if (Math.abs(tx) > 0.9) { rx = 0; ry = 0; rz = 1; }
    let bx = ty * rz - tz * ry;
    let by = tz * rx - tx * rz;
    let bz = tx * ry - ty * rx;
    const bLen = Math.hypot(bx, by, bz) || 1;
    bx /= bLen; by /= bLen; bz /= bLen;
    const nx = by * tz - bz * ty;
    const ny = bz * tx - bx * tz;
    const nz = bx * ty - by * tx;
    const rad = radiusFn(r / (rings - 1));
    for (let s = 0; s < radialSegments; s++) {
      const ang = (s / radialSegments) * Math.PI * 2;
      const ca = Math.cos(ang) * rad * squashX;
      const sa = Math.sin(ang) * rad * squashY;
      pos.push(p[0] + nx * ca + bx * sa, p[1] + ny * ca + by * sa, p[2] + nz * ca + bz * sa);
    }
  }
  const firstCenter = rings * radialSegments;
  pos.push(...points[0]);
  const lastCenter = firstCenter + 1;
  pos.push(...points[rings - 1]);
  for (let r = 0; r < rings - 1; r++) {
    for (let s = 0; s < radialSegments; s++) {
      const sn = (s + 1) % radialSegments;
      const a = r * radialSegments + s;
      const b = r * radialSegments + sn;
      const c = (r + 1) * radialSegments + s;
      const d = (r + 1) * radialSegments + sn;
      idx.push(a, c, b, b, c, d);
    }
  }
  for (let s = 0; s < radialSegments; s++) {
    const sn = (s + 1) % radialSegments;
    idx.push(firstCenter, s, sn);
    const lastRing = (rings - 1) * radialSegments;
    idx.push(lastCenter, lastRing + sn, lastRing + s);
  }
  return { positions: new Float32Array(pos), indices: new Uint32Array(idx) };
}

function buildEllipsoidMesh(cx, cy, cz, rx, ry, rz, uSegs = 20, vSegs = 14, deformFn) {
  const pos = [];
  const idx = [];
  for (let iv = 0; iv <= vSegs; iv++) {
    const phi = (iv / vSegs) * Math.PI;
    const sp = Math.sin(phi);
    const cp = Math.cos(phi);
    for (let iu = 0; iu <= uSegs; iu++) {
      const theta = (iu / uSegs) * Math.PI * 2;
      let lx = Math.cos(theta) * sp * rx;
      let ly = cp * ry;
      let lz = Math.sin(theta) * sp * rz;
      if (deformFn) {
        [lx, ly, lz] = deformFn(lx, ly, lz, cp, sp, theta);
      }
      pos.push(cx + lx, cy + ly, cz + lz);
    }
  }
  for (let iv = 0; iv < vSegs; iv++) {
    for (let iu = 0; iu < uSegs; iu++) {
      const a = iv * (uSegs + 1) + iu;
      const b = a + 1;
      const c = a + (uSegs + 1);
      const d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
  }
  return { positions: new Float32Array(pos), indices: new Uint32Array(idx) };
}

function mergeGeoms(list) {
  const pos = [];
  const idx = [];
  let offset = 0;
  for (const g of list) {
    for (let i = 0; i < g.positions.length; i++) pos.push(g.positions[i]);
    for (let i = 0; i < g.indices.length; i++) idx.push(g.indices[i] + offset);
    offset += g.positions.length / 3;
  }
  return { positions: new Float32Array(pos), indices: new Uint32Array(idx) };
}

function buildEndometriumMesh(cx, cy, cz) {
  // Pear-shaped triangular uterine mucosal cavity nested inside HF_UTERUS_BODY / FUNDUS
  const uSegs = 22;
  const vSegs = 18;
  const pos = [];
  const idx = [];
  for (let iv = 0; iv <= vSegs; iv++) {
    const t = iv / vSegs; // 0 = internal cervical os (bottom), 1 = fundal border (top)
    const widthProfile = t < 0.85 ? 0.0028 + 0.0105 * Math.pow(t / 0.85, 0.8) : 0.0133 * Math.cos(((t - 0.85) / 0.15) * Math.PI * 0.5);
    const depthProfile = t < 0.85 ? 0.0022 + 0.0026 * Math.sin((t / 0.85) * Math.PI) : 0.0022 * Math.cos(((t - 0.85) / 0.15) * Math.PI * 0.5);
    const y = cy - 0.012 + t * 0.021;
    const zCenter = cz - 0.012 + t * 0.020;
    for (let iu = 0; iu <= uSegs; iu++) {
      const ang = (iu / uSegs) * Math.PI * 2;
      pos.push(cx + Math.cos(ang) * widthProfile, y, zCenter + Math.sin(ang) * depthProfile);
    }
  }
  for (let iv = 0; iv < vSegs; iv++) {
    for (let iu = 0; iu < uSegs; iu++) {
      const a = iv * (uSegs + 1) + iu;
      const b = a + 1;
      const c = a + (uSegs + 1);
      const d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
  }
  return { positions: new Float32Array(pos), indices: new Uint32Array(idx) };
}

const HUBMAP_SOURCE =
  'HuBMAP HRA v1.5 Visible Human Female 3D Reference Library (CC BY 4.0, DOI: 10.48539/HBM352.BTSQ.586)';
const MAMMARY_SOURCE =
  'HuBMAP HRA v1.1 Visible Human Female Mammary Gland (CC BY 4.0)';

const pExact = (exact) => (n) => n === exact;

// ---------------------------------------------------------------------------
// 1. Real HuBMAP CC BY 4.0 Female Pelvic, Reproductive, Urinary, Vascular &
//    Mammary Gland Meshes
// ---------------------------------------------------------------------------
const rawDefinitions = [
  // --- Bony Pelvis (Skeletal) ---
  {
    id: 'HF_SACRUM',
    name: 'Female sacrum',
    conceptId: 'FMA16202',
    system: 'skeletal',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_sacrum'), xformPelvis),
    targetTris: 2200,
    minTris: 600,
  },
  {
    id: 'HF_COCCYX',
    name: 'Coccyx (tailbone)',
    conceptId: 'FMA20225',
    system: 'skeletal',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_coccyx'), xformPelvis),
    targetTris: 550,
    minTris: 180,
  },
  {
    id: 'HF_ILIUM_LEFT',
    name: 'Left female ilium',
    conceptId: 'FMA16589',
    system: 'skeletal',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_ilium_compact_bone_L'), xformPelvis),
    targetTris: 1800,
    minTris: 500,
  },
  {
    id: 'HF_ILIUM_RIGHT',
    name: 'Right female ilium',
    conceptId: 'FMA16588',
    system: 'skeletal',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_ilium_compact_bone_R'), xformPelvis),
    targetTris: 1800,
    minTris: 500,
  },
  {
    id: 'HF_ISCHIUM_LEFT',
    name: 'Left female ischium',
    conceptId: 'FMA16593',
    system: 'skeletal',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_ischium_compact_bone_L'), xformPelvis),
    targetTris: 1000,
    minTris: 350,
  },
  {
    id: 'HF_ISCHIUM_RIGHT',
    name: 'Right female ischium',
    conceptId: 'FMA16592',
    system: 'skeletal',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_ischium_compact_bone_R'), xformPelvis),
    targetTris: 1000,
    minTris: 350,
  },
  {
    id: 'HF_PUBIS_LEFT',
    name: 'Left female pubis',
    conceptId: 'FMA16596',
    system: 'skeletal',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_pubis_compact_bone_L'), xformPelvis),
    targetTris: 1000,
    minTris: 350,
  },
  {
    id: 'HF_PUBIS_RIGHT',
    name: 'Right female pubis',
    conceptId: 'FMA16595',
    system: 'skeletal',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_pubis_compact_bone_R'), xformPelvis),
    targetTris: 1000,
    minTris: 350,
  },

  // --- Female Urinary Bladder & Orifices (Urinary) ---
  {
    id: 'HF_BLADDER_DOME',
    name: 'Dome of urinary bladder',
    conceptId: 'FMA15900',
    system: 'urinary',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_fundus_of_urinary_bladder_dome'), xformPelvis),
    targetTris: 1400,
    minTris: 400,
  },
  {
    id: 'HF_BLADDER_BASE',
    name: 'Body & base of urinary bladder',
    conceptId: 'FMA15916',
    system: 'urinary',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_fundus_of_urinary_bladder_base'), xformPelvis),
    targetTris: 1800,
    minTris: 450,
  },
  {
    id: 'HF_BLADDER_TRIGONE',
    name: 'Trigone of urinary bladder',
    conceptId: 'FMA15926',
    system: 'urinary',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_trigone_of_urinary_bladder'), xformPelvis),
    targetTris: 600,
    minTris: 200,
  },
  {
    id: 'HF_BLADDER_NECK',
    name: 'Neck of urinary bladder',
    conceptId: 'FMA15924',
    system: 'urinary',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_urinary_bladder_neck_smooth_muscle'), xformPelvis),
    targetTris: 600,
    minTris: 200,
  },
  {
    id: 'HF_URETERAL_ORIFICE_LEFT',
    name: 'Left ureteric orifice',
    conceptId: 'FMA15931',
    system: 'urinary',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_ureteral_orifice_L'), xformPelvis),
    targetTris: 194,
    minTris: 90,
  },
  {
    id: 'HF_URETERAL_ORIFICE_RIGHT',
    name: 'Right ureteric orifice',
    conceptId: 'FMA15930',
    system: 'urinary',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_ureteral_orifice_R'), xformPelvis),
    targetTris: 180,
    minTris: 90,
  },

  // --- Uterus & Cervix Regions (Reproductive) ---
  {
    id: 'HF_UTERUS_FUNDUS',
    name: 'Fundus of uterus',
    conceptId: 'FMA17739',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_fundus_of_uterus'), xformPelvis),
    targetTris: 900,
    minTris: 300,
  },
  {
    id: 'HF_UTERUS_BODY',
    name: 'Body of uterus',
    conceptId: 'FMA17738',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_body_of_uterus'), xformPelvis),
    targetTris: 1200,
    minTris: 400,
  },
  {
    id: 'HF_UTERUS_ANTERIOR_WALL',
    name: 'Anterior wall of uterus',
    conceptId: 'FMA17745',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_anterior_wall_of_uterus'), xformPelvis),
    targetTris: 1200,
    minTris: 350,
  },
  {
    id: 'HF_UTERUS_POSTERIOR_WALL',
    name: 'Posterior wall of uterus',
    conceptId: 'FMA17746',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_posterior_wall_of_uterus'), xformPelvis),
    targetTris: 1200,
    minTris: 350,
  },
  {
    id: 'HF_UTERUS_CORNUA',
    name: 'Uterine horns (cornua)',
    conceptId: 'FMA17742',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes(
      'united_f.glb',
      (n) => n === 'VH_F_cornua' || n === 'VH_F_abdominal_ostium_of_uterine_tube',
      xformPelvis,
    ),
    targetTris: 800,
    minTris: 250,
  },
  {
    id: 'HF_UTERUS_LOWER_SEGMENT',
    name: 'Lower uterine segment (isthmus of uterus)',
    conceptId: 'FMA17741',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_lower_uterine_segment'), xformPelvis),
    targetTris: 700,
    minTris: 220,
  },
  {
    id: 'HF_CERVIX',
    name: 'Cervix of uterus',
    conceptId: 'FMA17740',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_cervix'), xformPelvis),
    targetTris: 1000,
    minTris: 350,
  },
  {
    id: 'HF_CERVICAL_OS_INTERNAL',
    name: 'Internal cervical os',
    conceptId: 'FMA17743',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_internal_cervical_os'), xformPelvis),
    targetTris: 216,
    minTris: 100,
  },
  {
    id: 'HF_CERVICAL_OS_EXTERNAL',
    name: 'External cervical os',
    conceptId: 'FMA17744',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_external_cervical_os'), xformPelvis),
    targetTris: 270,
    minTris: 120,
  },

  // --- Vagina & Cervicovaginal Junction (REAL HuBMAP scan!) ---
  {
    id: 'HF_VAGINA',
    name: 'Vagina',
    conceptId: 'FMA19949',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_vagina'), xformPelvis),
    targetTris: 1600,
    minTris: 500,
  },
  {
    id: 'HF_CERVICOVAGINAL_JUNCTION',
    name: 'Cervicovaginal junction & vaginal fornices',
    conceptId: 'FMA19971',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_cervicovaginal_junction'), xformPelvis),
    targetTris: 900,
    minTris: 300,
  },

  // --- Fallopian (Uterine) Tube Regions ---
  {
    id: 'HF_TUBE_ISTHMUS_LEFT',
    name: 'Left isthmus of uterine tube',
    conceptId: 'FMA18304',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_isthmus_of_fallopian_tube_L'), xformPelvis),
    targetTris: 600,
    minTris: 220,
  },
  {
    id: 'HF_TUBE_ISTHMUS_RIGHT',
    name: 'Right isthmus of uterine tube',
    conceptId: 'FMA18303',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_isthmus_of_fallopian_tube_R'), xformPelvis),
    targetTris: 600,
    minTris: 220,
  },
  {
    id: 'HF_TUBE_AMPULLA_LEFT',
    name: 'Left ampulla of uterine tube',
    conceptId: 'FMA18300',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_ampulla_of_uterine_tube_L'), xformPelvis),
    targetTris: 1200,
    minTris: 400,
  },
  {
    id: 'HF_TUBE_AMPULLA_RIGHT',
    name: 'Right ampulla of uterine tube',
    conceptId: 'FMA18299',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_ampulla_of_uterine_tube_R'), xformPelvis),
    targetTris: 1200,
    minTris: 400,
  },
  {
    id: 'HF_TUBE_INFUNDIBULUM_LEFT',
    name: 'Left infundibulum of uterine tube',
    conceptId: 'FMA18296',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_uterine_tube_infundibulum_L'), xformPelvis),
    targetTris: 700,
    minTris: 250,
  },
  {
    id: 'HF_TUBE_INFUNDIBULUM_RIGHT',
    name: 'Right infundibulum of uterine tube',
    conceptId: 'FMA18295',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_uterine_tube_infundibulum_R'), xformPelvis),
    targetTris: 700,
    minTris: 250,
  },
  {
    id: 'HF_TUBE_FIMBRIAE_LEFT',
    name: 'Left fimbriae of uterine tube',
    conceptId: 'FMA18298',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_fibria_of_uterine_tube_L'), xformPelvis),
    targetTris: 900,
    minTris: 300,
  },
  {
    id: 'HF_TUBE_FIMBRIAE_RIGHT',
    name: 'Right fimbriae of uterine tube',
    conceptId: 'FMA18297',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_fibria_of_uterine_tube_R'), xformPelvis),
    targetTris: 900,
    minTris: 300,
  },

  // --- Ovaries & Pelvic Supporting Ligaments ---
  {
    id: 'HF_OVARY_LEFT',
    name: 'Left ovary',
    conceptId: 'FMA7214',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_left_ovary'), xformPelvis),
    targetTris: 424,
    minTris: 180,
  },
  {
    id: 'HF_OVARY_RIGHT',
    name: 'Right ovary',
    conceptId: 'FMA7213',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_right_ovary'), xformPelvis),
    targetTris: 410,
    minTris: 180,
  },
  {
    id: 'HF_OVARIAN_LIGAMENT_LEFT',
    name: 'Left proper ovarian ligament',
    conceptId: 'FMA19761',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_ovarian_ligament_L'), xformPelvis),
    targetTris: 208,
    minTris: 100,
  },
  {
    id: 'HF_OVARIAN_LIGAMENT_RIGHT',
    name: 'Right proper ovarian ligament',
    conceptId: 'FMA19760',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_ovarian_ligament_R'), xformPelvis),
    targetTris: 198,
    minTris: 100,
  },
  {
    id: 'HF_SUSPENSORY_OVARY_LEFT',
    name: 'Left suspensory ligament of ovary',
    conceptId: 'FMA19763',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_suspensory_ligament_of_ovary_L'), xformPelvis),
    targetTris: 450,
    minTris: 180,
  },
  {
    id: 'HF_SUSPENSORY_OVARY_RIGHT',
    name: 'Right suspensory ligament of ovary',
    conceptId: 'FMA19762',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_suspensory_ligament_of_ovary_R'), xformPelvis),
    targetTris: 450,
    minTris: 180,
  },
  {
    // Note: in HuBMAP united_f.glb, VH_F_right_round_ligament_of_uterus lies on +X (anatomical Left)
    // and VH_F_left_round_ligament_of_uterus lies on -X (anatomical Right). Mapped strictly by laterality (+X/-X).
    id: 'HF_ROUND_LIGAMENT_LEFT',
    name: 'Left round ligament of uterus',
    conceptId: 'FMA19759',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_right_round_ligament_of_uterus'), xformPelvis),
    targetTris: 450,
    minTris: 180,
  },
  {
    id: 'HF_ROUND_LIGAMENT_RIGHT',
    name: 'Right round ligament of uterus',
    conceptId: 'FMA19758',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_left_round_ligament_of_uterus'), xformPelvis),
    targetTris: 450,
    minTris: 180,
  },
  {
    id: 'HF_CARDINAL_LIGAMENT_LEFT',
    name: 'Left cardinal (transverse cervical) ligament',
    conceptId: 'FMA19769',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_left_cardinal_ligament_of_uterus'), xformPelvis),
    targetTris: 800,
    minTris: 250,
  },
  {
    id: 'HF_CARDINAL_LIGAMENT_RIGHT',
    name: 'Right cardinal (transverse cervical) ligament',
    conceptId: 'FMA19768',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_right_cardinal_ligament_of_uterus'), xformPelvis),
    targetTris: 800,
    minTris: 250,
  },
  {
    id: 'HF_UTEROSACRAL_LIGAMENT_LEFT',
    name: 'Left uterosacral ligament',
    conceptId: 'FMA19767',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_left_uterosacral_ligament'), xformPelvis),
    targetTris: 600,
    minTris: 200,
  },
  {
    id: 'HF_UTEROSACRAL_LIGAMENT_RIGHT',
    name: 'Right uterosacral ligament',
    conceptId: 'FMA19766',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_right_uterosacral_ligament'), xformPelvis),
    targetTris: 600,
    minTris: 200,
  },
  {
    id: 'HF_BROAD_LIGAMENT',
    name: 'Broad ligament of uterus',
    conceptId: 'FMA19749',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_broad_ligament'), xformPelvis),
    targetTris: 1600,
    minTris: 450,
  },
  {
    id: 'HF_MESOSALPINX_LEFT',
    name: 'Left mesosalpinx',
    conceptId: 'FMA19753',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_mesosalpinx_L'), xformPelvis),
    targetTris: 500,
    minTris: 180,
  },
  {
    id: 'HF_MESOSALPINX_RIGHT',
    name: 'Right mesosalpinx',
    conceptId: 'FMA19752',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_mesosalpinx_R'), xformPelvis),
    targetTris: 500,
    minTris: 180,
  },
  {
    id: 'HF_MESOVARIUM_LEFT',
    name: 'Left mesovarium',
    conceptId: 'FMA19757',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_mesovarium_L'), xformPelvis),
    targetTris: 350,
    minTris: 120,
  },
  {
    id: 'HF_MESOVARIUM_RIGHT',
    name: 'Right mesovarium',
    conceptId: 'FMA19756',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_mesovarium_R'), xformPelvis),
    targetTris: 183,
    minTris: 90,
  },
  {
    id: 'HF_UTEROVESICAL_POUCH',
    name: 'Vesicouterine peritoneal pouch',
    conceptId: 'FMA19773',
    system: 'reproductive',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_uterovesical_pouch'), xformPelvis),
    targetTris: 1200,
    minTris: 350,
  },

  // --- Female Uterine Blood Supply (Arterial / Venous) ---
  {
    id: 'HF_UTERINE_ARTERY_LEFT',
    name: 'Left uterine artery',
    conceptId: 'FMA18824',
    system: 'arterial',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_left_uterine_artery'), xformPelvis),
    targetTris: 500,
    minTris: 200,
  },
  {
    id: 'HF_UTERINE_ARTERY_RIGHT',
    name: 'Right uterine artery',
    conceptId: 'FMA18823',
    system: 'arterial',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_right_uterine_artery'), xformPelvis),
    targetTris: 500,
    minTris: 200,
  },
  {
    id: 'HF_UTERINE_VEIN_LEFT',
    name: 'Left uterine vein',
    conceptId: 'FMA18908',
    system: 'venous',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_left_uterine_vein'), xformPelvis),
    targetTris: 600,
    minTris: 220,
  },
  {
    id: 'HF_UTERINE_VEIN_RIGHT',
    name: 'Right uterine vein',
    conceptId: 'FMA18907',
    system: 'venous',
    source: HUBMAP_SOURCE,
    geom: extractNodeMeshes('united_f.glb', pExact('VH_F_right_uterine_vein'), xformPelvis),
    targetTris: 600,
    minTris: 220,
  },

  // --- Female Mammary Glands: Detailed Sub-Structures (mam_l.glb & mam_r.glb) ---
  {
    id: 'HF_MAMMARY_FAT_LEFT',
    name: 'Left mammary adipose stroma',
    conceptId: 'FMA57991',
    system: 'reproductive',
    source: MAMMARY_SOURCE,
    geom: extractNodeMeshes('mam_l.glb', pExact('VH_F_fat_L'), xformChest),
    targetTris: 2200,
    minTris: 600,
  },
  {
    id: 'HF_MAMMARY_FAT_RIGHT',
    name: 'Right mammary adipose stroma',
    conceptId: 'FMA57990',
    system: 'reproductive',
    source: MAMMARY_SOURCE,
    geom: extractNodeMeshes('mam_r.glb', pExact('VH_F_fat_R'), xformChest),
    targetTris: 2200,
    minTris: 600,
  },
  {
    id: 'HF_MAMMARY_LOBES_LEFT',
    name: 'Left mammary gland lobes (alveolar lobules)',
    conceptId: 'FMA67804',
    system: 'reproductive',
    source: MAMMARY_SOURCE,
    geom: extractNodeMeshes('mam_l.glb', pExact('VH_F_mammary_lobes_L'), xformChest),
    targetTris: 2400,
    minTris: 700,
  },
  {
    id: 'HF_MAMMARY_LOBES_RIGHT',
    name: 'Right mammary gland lobes (alveolar lobules)',
    conceptId: 'FMA67804',
    system: 'reproductive',
    source: MAMMARY_SOURCE,
    geom: extractNodeMeshes('mam_r.glb', pExact('VH_F_mammary_lobes_R'), xformChest),
    targetTris: 2400,
    minTris: 700,
  },
  {
    id: 'HF_LACTIFEROUS_DUCTS_LEFT',
    name: 'Left main lactiferous ducts',
    conceptId: 'FMA67806',
    system: 'reproductive',
    source: MAMMARY_SOURCE,
    geom: extractNodeMeshes('mam_l.glb', pExact('VH_F_main_lactiferous_ducts_L'), xformChest),
    targetTris: 1600,
    minTris: 500,
  },
  {
    id: 'HF_LACTIFEROUS_DUCTS_RIGHT',
    name: 'Right main lactiferous ducts',
    conceptId: 'FMA67806',
    system: 'reproductive',
    source: MAMMARY_SOURCE,
    geom: extractNodeMeshes('mam_r.glb', pExact('VH_F_main_lactiferous_ducts_R'), xformChest),
    targetTris: 1600,
    minTris: 500,
  },
  {
    id: 'HF_LACTIFEROUS_SINUSES_LEFT',
    name: 'Left lactiferous sinuses',
    conceptId: 'FMA72025',
    system: 'reproductive',
    source: MAMMARY_SOURCE,
    geom: extractNodeMeshes('mam_l.glb', pExact('VH_F_main_lactiferous_sinuses_L'), xformChest),
    targetTris: 800,
    minTris: 260,
  },
  {
    id: 'HF_LACTIFEROUS_SINUSES_RIGHT',
    name: 'Right lactiferous sinuses',
    conceptId: 'FMA72025',
    system: 'reproductive',
    source: MAMMARY_SOURCE,
    geom: extractNodeMeshes('mam_r.glb', pExact('VH_F_main_lactiferous_sinuses_R'), xformChest),
    targetTris: 800,
    minTris: 260,
  },
  {
    id: 'HF_COOPER_LIGAMENTS_LEFT',
    name: 'Left suspensory ligaments of breast (Cooper)',
    conceptId: 'FMA76818',
    system: 'reproductive',
    source: MAMMARY_SOURCE,
    geom: extractNodeMeshes('mam_l.glb', pExact('VH_F_suspensory_ligaments_L'), xformChest),
    targetTris: 1800,
    minTris: 500,
  },
  {
    id: 'HF_COOPER_LIGAMENTS_RIGHT',
    name: 'Right suspensory ligaments of breast (Cooper)',
    conceptId: 'FMA76818',
    system: 'reproductive',
    source: MAMMARY_SOURCE,
    geom: extractNodeMeshes('mam_r.glb', pExact('VH_F_suspensory_ligaments_R'), xformChest),
    targetTris: 1800,
    minTris: 500,
  },
  {
    id: 'HF_AREOLA_LEFT',
    name: 'Left areola of breast',
    conceptId: 'FMA57995',
    system: 'reproductive',
    source: MAMMARY_SOURCE,
    geom: extractNodeMeshes('mam_l.glb', pExact('VH_F_areola_L'), xformChest),
    targetTris: 700,
    minTris: 240,
  },
  {
    id: 'HF_AREOLA_RIGHT',
    name: 'Right areola of breast',
    conceptId: 'FMA57995',
    system: 'reproductive',
    source: MAMMARY_SOURCE,
    geom: extractNodeMeshes('mam_r.glb', pExact('VH_F_areola_R'), xformChest),
    targetTris: 700,
    minTris: 240,
  },
  {
    id: 'HF_NIPPLE_LEFT',
    name: 'Left nipple (mammary papilla)',
    conceptId: 'FMA67796',
    system: 'reproductive',
    source: MAMMARY_SOURCE,
    geom: extractNodeMeshes('mam_l.glb', pExact('VH_F_nipple_L'), xformChest),
    targetTris: 450,
    minTris: 160,
  },
  {
    id: 'HF_NIPPLE_RIGHT',
    name: 'Right nipple (mammary papilla)',
    conceptId: 'FMA67796',
    system: 'reproductive',
    source: MAMMARY_SOURCE,
    geom: extractNodeMeshes('mam_r.glb', pExact('VH_F_nipple_R'), xformChest),
    targetTris: 450,
    minTris: 160,
  },
  {
    id: 'HF_AREOLAR_TUBERCLES_LEFT',
    name: 'Left areolar glands (Montgomery tubercles)',
    conceptId: 'FMA72031',
    system: 'reproductive',
    source: MAMMARY_SOURCE,
    geom: extractNodeMeshes('mam_l.glb', pExact('VH_F_areolar_tubercles_L'), xformChest),
    targetTris: 450,
    minTris: 160,
  },
  {
    id: 'HF_AREOLAR_TUBERCLES_RIGHT',
    name: 'Right areolar glands (Montgomery tubercles)',
    conceptId: 'FMA72031',
    system: 'reproductive',
    source: MAMMARY_SOURCE,
    geom: extractNodeMeshes('mam_r.glb', pExact('VH_F_areolar_tubercles_R'), xformChest),
    targetTris: 450,
    minTris: 160,
  },
];

const existingManifest =
  APPEND_INNERBODY_MODE && fs.existsSync(path.join(OUT_DIR, 'female-atlas.json'))
    ? JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'female-atlas.json'), 'utf8'))
    : null;
const existingBin =
  APPEND_INNERBODY_MODE && fs.existsSync(path.join(OUT_DIR, 'female-0.bin'))
    ? fs.readFileSync(path.join(OUT_DIR, 'female-0.bin'))
    : null;

function computeGeomCenter(geom, partId) {
  if (APPEND_INNERBODY_MODE && existingManifest) {
    const p = existingManifest.parts.find((x) => x.id === partId);
    if (p) {
      return [
        (p.bounds[0][0] + p.bounds[1][0]) * 0.5,
        (p.bounds[0][1] + p.bounds[1][1]) * 0.5,
        (p.bounds[0][2] + p.bounds[1][2]) * 0.5,
      ];
    }
  }
  let sx = 0, sy = 0, sz = 0;
  const n = geom.positions.length / 3;
  for (let i = 0; i < geom.positions.length; i += 3) {
    sx += geom.positions[i];
    sy += geom.positions[i + 1];
    sz += geom.positions[i + 2];
  }
  return [sx / n, sy / n, sz / n];
}

const neckDef = rawDefinitions.find((d) => d.id === 'HF_BLADDER_NECK');
const neckCenter = computeGeomCenter(neckDef.geom, 'HF_BLADDER_NECK');
const uterusCenter = computeGeomCenter(rawDefinitions.find((d) => d.id === 'HF_UTERUS_BODY').geom, 'HF_UTERUS_BODY');
const vaginaCenter = computeGeomCenter(rawDefinitions.find((d) => d.id === 'HF_VAGINA').geom, 'HF_VAGINA');

// HuBMAP HRA united-female does not separately segment the short (~3.8 cm) female urethra;
// anchor an anatomically co-registered urethral conduit inferiorly/anteriorly from HuBMAP's real bladder neck.
const urethraPts = [
  [neckCenter[0], neckCenter[1] + 0.002, neckCenter[2]],
  [neckCenter[0] + 0.0005, neckCenter[1] - 0.017, neckCenter[2] + 0.006],
  [neckCenter[0] + 0.001, neckCenter[1] - 0.036, neckCenter[2] + 0.013],
];
rawDefinitions.push({
  id: 'HF_URETHRA',
  name: 'Female urethra',
  conceptId: 'FMA19667',
  system: 'urinary',
  source: 'Anatomically co-registered female urethral conduit anchored to HuBMAP bladder neck',
  geom: buildTubeMesh(urethraPts, () => 0.0044, 16),
  targetTris: 260,
  minTris: 100,
  checkWinding: true,
});

// ---------------------------------------------------------------------------
// 2. Innerbody-aligned Female Uterine Lining & External Reproductive Structures
//    Co-registered to exact HuBMAP uterus, vagina, urethral meatus & pubic arch
// ---------------------------------------------------------------------------
const mx = vaginaCenter[0]; // -0.0037 anatomical midline of female pelvis
const INNERBODY_SOURCE =
  'Anatomically co-registered female reproductive reconstruction aligned to HuBMAP pelvis & Innerbody anatomical guide';

const innerbodyDefinitions = [
  {
    id: 'HF_ENDOMETRIUM',
    name: 'Endometrium (uterine cavity lining)',
    conceptId: 'FMA17748',
    system: 'reproductive',
    source: INNERBODY_SOURCE,
    geom: buildEndometriumMesh(uterusCenter[0], uterusCenter[1], uterusCenter[2]),
    targetTris: 720,
    minTris: 200,
    checkWinding: true,
  },
  {
    id: 'HF_CLITORIS',
    name: 'Clitoris (glans, body & crura)',
    conceptId: 'FMA20000',
    system: 'reproductive',
    source: INNERBODY_SOURCE,
    geom: mergeGeoms([
      buildTubeMesh(
        [
          [mx, 0.844, 0.016],
          [mx, 0.846, 0.022],
          [mx, 0.842, 0.026],
          [mx, 0.837, 0.028],
        ],
        (t) => (t > 0.72 ? 0.0040 * (1 - (t - 0.72) * 1.1) : 0.0034),
        14,
      ),
      buildTubeMesh(
        [
          [mx + 0.002, 0.844, 0.018],
          [mx + 0.010, 0.839, 0.010],
          [mx + 0.019, 0.833, -0.002],
          [mx + 0.025, 0.829, -0.012],
        ],
        (t) => 0.0032 * (1 - 0.35 * t),
        12,
      ),
      buildTubeMesh(
        [
          [mx - 0.002, 0.844, 0.018],
          [mx - 0.010, 0.839, 0.010],
          [mx - 0.019, 0.833, -0.002],
          [mx - 0.025, 0.829, -0.012],
        ],
        (t) => 0.0032 * (1 - 0.35 * t),
        12,
      ),
    ]),
    targetTris: 780,
    minTris: 240,
    checkWinding: false,
  },
  {
    id: 'HF_VESTIBULAR_BULBS',
    name: 'Bulbs of vestibule',
    conceptId: 'FMA20045',
    system: 'reproductive',
    source: INNERBODY_SOURCE,
    geom: mergeGeoms([
      buildTubeMesh(
        [
          [mx + 0.005, 0.836, 0.018],
          [mx + 0.012, 0.830, 0.009],
          [mx + 0.015, 0.826, -0.004],
          [mx + 0.013, 0.823, -0.017],
        ],
        (t) => 0.0030 + 0.0036 * Math.sin(t * Math.PI * 0.85),
        14,
        0.75,
        1.15,
      ),
      buildTubeMesh(
        [
          [mx - 0.005, 0.836, 0.018],
          [mx - 0.012, 0.830, 0.009],
          [mx - 0.015, 0.826, -0.004],
          [mx - 0.013, 0.823, -0.017],
        ],
        (t) => 0.0030 + 0.0036 * Math.sin(t * Math.PI * 0.85),
        14,
        0.75,
        1.15,
      ),
    ]),
    targetTris: 520,
    minTris: 160,
    checkWinding: false,
  },
  {
    id: 'HF_BARTHOLIN_GLANDS',
    name: 'Greater vestibular glands (Bartholin glands)',
    conceptId: 'FMA20058',
    system: 'reproductive',
    source: INNERBODY_SOURCE,
    geom: mergeGeoms([
      buildEllipsoidMesh(mx + 0.014, 0.821, -0.021, 0.0048, 0.0052, 0.0055, 16, 12),
      buildEllipsoidMesh(mx - 0.014, 0.821, -0.021, 0.0048, 0.0052, 0.0055, 16, 12),
    ]),
    targetTris: 360,
    minTris: 120,
    checkWinding: false,
  },
  {
    id: 'HF_LABIA_MINORA',
    name: 'Labia minora',
    conceptId: 'FMA20015',
    system: 'reproductive',
    source: INNERBODY_SOURCE,
    geom: mergeGeoms([
      buildTubeMesh(
        [
          [mx + 0.002, 0.836, 0.026],
          [mx + 0.009, 0.824, 0.013],
          [mx + 0.010, 0.819, -0.004],
          [mx + 0.005, 0.817, -0.022],
        ],
        (t) => 0.0026 + 0.0012 * Math.sin(t * Math.PI),
        12,
        0.65,
        1.4,
      ),
      buildTubeMesh(
        [
          [mx - 0.002, 0.836, 0.026],
          [mx - 0.009, 0.824, 0.013],
          [mx - 0.010, 0.819, -0.004],
          [mx - 0.005, 0.817, -0.022],
        ],
        (t) => 0.0026 + 0.0012 * Math.sin(t * Math.PI),
        12,
        0.65,
        1.4,
      ),
    ]),
    targetTris: 440,
    minTris: 140,
    checkWinding: false,
  },
  {
    id: 'HF_LABIA_MAJORA',
    name: 'Labia majora',
    conceptId: 'FMA20012',
    system: 'integumentary',
    source: INNERBODY_SOURCE,
    geom: mergeGeoms([
      buildTubeMesh(
        [
          [mx + 0.016, 0.848, 0.032],
          [mx + 0.021, 0.827, 0.014],
          [mx + 0.019, 0.818, -0.008],
          [mx + 0.009, 0.815, -0.026],
        ],
        (t) => 0.0075 + 0.0025 * Math.sin(t * Math.PI),
        14,
        0.85,
        1.25,
      ),
      buildTubeMesh(
        [
          [mx - 0.016, 0.848, 0.032],
          [mx - 0.021, 0.827, 0.014],
          [mx - 0.019, 0.818, -0.008],
          [mx - 0.009, 0.815, -0.026],
        ],
        (t) => 0.0075 + 0.0025 * Math.sin(t * Math.PI),
        14,
        0.85,
        1.25,
      ),
    ]),
    targetTris: 520,
    minTris: 160,
    checkWinding: false,
  },
  {
    id: 'HF_MONS_PUBIS',
    name: 'Mons pubis',
    conceptId: 'FMA20006',
    system: 'integumentary',
    source: INNERBODY_SOURCE,
    geom: buildEllipsoidMesh(mx, 0.878, 0.038, 0.038, 0.028, 0.018, 22, 14, (lx, ly, lz) => {
      const taper = ly < 0 ? 0.82 : 1.0;
      return [lx * taper, ly, lz * (lz > 0 ? 1.1 : 0.6)];
    }),
    targetTris: 560,
    minTris: 180,
    checkWinding: true,
  },
];

// ---------------------------------------------------------------------------
// Pack into indexed binary buffer
// ---------------------------------------------------------------------------
const segments = [];
let bytes = 0;
let totalTriangles = 0;

function appendTyped(arr) {
  const padding = (4 - (bytes % 4)) % 4;
  if (padding) {
    segments.push(Buffer.alloc(padding));
    bytes += padding;
  }
  const offset = bytes;
  const buf = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
  segments.push(buf);
  bytes += buf.length;
  return offset;
}

const innerbodyIds = new Set(innerbodyDefinitions.map((d) => d.id));
const parts = [];

if (APPEND_INNERBODY_MODE && existingManifest && existingBin) {
  // Preserve all existing HuBMAP meshes bit-for-bit, replacing/appending only Innerbody entries
  const baseParts = existingManifest.parts.filter((p) => !innerbodyIds.has(p.id));
  for (const p of baseParts) {
    const posSlice = existingBin.subarray(p.positions, p.positions + p.vertexCount * 3 * 4);
    const normSlice = existingBin.subarray(p.normals, p.normals + p.vertexCount * 3 * 2);
    const idxSlice = existingBin.subarray(p.indices, p.indices + p.indexCount * 4);
    const posOff = appendTyped(new Uint8Array(posSlice));
    const normOff = appendTyped(new Uint8Array(normSlice));
    const idxOff = appendTyped(new Uint8Array(idxSlice));
    totalTriangles += p.indexCount / 3;
    parts.push({ ...p, positions: posOff, normals: normOff, indices: idxOff });
  }
} else {
  for (const def of rawDefinitions) {
    const processed = weldAndSimplify(
      def.geom,
      def.targetTris,
      def.minTris,
      Boolean(def.checkWinding),
    );
    const posOff = appendTyped(processed.positions);
    const normOff = appendTyped(processed.normals);
    const idxOff = appendTyped(processed.indices);
    const triCount = processed.indices.length / 3;
    totalTriangles += triCount;

    parts.push({
      id: def.id,
      name: def.name,
      conceptId: def.conceptId,
      system: def.system,
      chunk: 0,
      positions: posOff,
      normals: normOff,
      indices: idxOff,
      vertexCount: processed.positions.length / 3,
      indexCount: processed.indices.length,
      bounds: processed.bounds,
      source: def.source,
    });
  }
}

for (const def of innerbodyDefinitions) {
  const processed = weldAndSimplify(
    def.geom,
    def.targetTris,
    def.minTris,
    Boolean(def.checkWinding),
  );
  const posOff = appendTyped(processed.positions);
  const normOff = appendTyped(processed.normals);
  const idxOff = appendTyped(processed.indices);
  const triCount = processed.indices.length / 3;
  totalTriangles += triCount;

  parts.push({
    id: def.id,
    name: def.name,
    conceptId: def.conceptId,
    system: def.system,
    chunk: 0,
    positions: posOff,
    normals: normOff,
    indices: idxOff,
    vertexCount: processed.positions.length / 3,
    indexCount: processed.indices.length,
    bounds: processed.bounds,
    source: def.source,
  });
}

const binBuffer = Buffer.concat(segments);
const gzBuffer = zlib.gzipSync(binBuffer, { level: 9 });
fs.writeFileSync(path.join(OUT_DIR, 'female-0.bin'), binBuffer);
fs.writeFileSync(path.join(OUT_DIR, 'female-0.bin.gz'), gzBuffer);

// ---------------------------------------------------------------------------
// Hierarchical & granular FMA concepts so searching either parent organ
// ("Uterus", "Left mammary gland", "Left hip bone") or sub-part ("Fimbriae",
// "Lactiferous ducts", "Cooper ligaments", "Trigone") resolves cleanly.
// ---------------------------------------------------------------------------
const concepts = [
  // Skeletal Pelvis
  { id: 'FMA16202', name: 'Female sacrum', elements: ['HF_SACRUM'] },
  { id: 'FMA20225', name: 'Coccyx (tailbone)', elements: ['HF_COCCYX'] },
  { id: 'FMA16589', name: 'Left female ilium', elements: ['HF_ILIUM_LEFT'] },
  { id: 'FMA16588', name: 'Right female ilium', elements: ['HF_ILIUM_RIGHT'] },
  { id: 'FMA16593', name: 'Left female ischium', elements: ['HF_ISCHIUM_LEFT'] },
  { id: 'FMA16592', name: 'Right female ischium', elements: ['HF_ISCHIUM_RIGHT'] },
  { id: 'FMA16596', name: 'Left female pubis', elements: ['HF_PUBIS_LEFT'] },
  { id: 'FMA16595', name: 'Right female pubis', elements: ['HF_PUBIS_RIGHT'] },
  {
    id: 'FMA16586',
    name: 'Left female hip bone (pelvis)',
    elements: ['HF_ILIUM_LEFT', 'HF_ISCHIUM_LEFT', 'HF_PUBIS_LEFT'],
  },
  {
    id: 'FMA16585',
    name: 'Right female hip bone (pelvis)',
    elements: ['HF_ILIUM_RIGHT', 'HF_ISCHIUM_RIGHT', 'HF_PUBIS_RIGHT'],
  },

  // Urinary Bladder & Urethra
  {
    id: 'FMA15900',
    name: 'Female urinary bladder',
    elements: [
      'HF_BLADDER_DOME',
      'HF_BLADDER_BASE',
      'HF_BLADDER_TRIGONE',
      'HF_BLADDER_NECK',
      'HF_URETERAL_ORIFICE_LEFT',
      'HF_URETERAL_ORIFICE_RIGHT',
    ],
  },
  { id: 'FMA15916', name: 'Body & base of urinary bladder', elements: ['HF_BLADDER_BASE'] },
  { id: 'FMA15926', name: 'Trigone of urinary bladder', elements: ['HF_BLADDER_TRIGONE'] },
  { id: 'FMA15924', name: 'Neck of urinary bladder', elements: ['HF_BLADDER_NECK'] },
  { id: 'FMA15931', name: 'Left ureteric orifice', elements: ['HF_URETERAL_ORIFICE_LEFT'] },
  { id: 'FMA15930', name: 'Right ureteric orifice', elements: ['HF_URETERAL_ORIFICE_RIGHT'] },
  { id: 'FMA19667', name: 'Female urethra', elements: ['HF_URETHRA'] },

  // Uterus & Cervix
  {
    id: 'FMA17558',
    name: 'Uterus',
    elements: [
      'HF_UTERUS_FUNDUS',
      'HF_UTERUS_BODY',
      'HF_UTERUS_ANTERIOR_WALL',
      'HF_UTERUS_POSTERIOR_WALL',
      'HF_UTERUS_CORNUA',
      'HF_UTERUS_LOWER_SEGMENT',
      'HF_ENDOMETRIUM',
      'HF_CERVIX',
      'HF_CERVICAL_OS_INTERNAL',
      'HF_CERVICAL_OS_EXTERNAL',
    ],
  },
  { id: 'FMA17748', name: 'Endometrium (uterine cavity lining)', elements: ['HF_ENDOMETRIUM'] },
  { id: 'FMA17739', name: 'Fundus of uterus', elements: ['HF_UTERUS_FUNDUS'] },
  { id: 'FMA17738', name: 'Body of uterus', elements: ['HF_UTERUS_BODY'] },
  { id: 'FMA17745', name: 'Anterior wall of uterus', elements: ['HF_UTERUS_ANTERIOR_WALL'] },
  { id: 'FMA17746', name: 'Posterior wall of uterus', elements: ['HF_UTERUS_POSTERIOR_WALL'] },
  { id: 'FMA17742', name: 'Uterine horns (cornua)', elements: ['HF_UTERUS_CORNUA'] },
  { id: 'FMA17741', name: 'Lower uterine segment (isthmus of uterus)', elements: ['HF_UTERUS_LOWER_SEGMENT'] },
  {
    id: 'FMA17740',
    name: 'Cervix of uterus',
    elements: ['HF_CERVIX', 'HF_CERVICAL_OS_INTERNAL', 'HF_CERVICAL_OS_EXTERNAL'],
  },
  { id: 'FMA17743', name: 'Internal cervical os', elements: ['HF_CERVICAL_OS_INTERNAL'] },
  { id: 'FMA17744', name: 'External cervical os', elements: ['HF_CERVICAL_OS_EXTERNAL'] },

  // Vagina, Junction & External Female Genitalia (Vulva / Innerbody)
  { id: 'FMA19949', name: 'Vagina', elements: ['HF_VAGINA'] },
  { id: 'FMA19971', name: 'Cervicovaginal junction & vaginal fornices', elements: ['HF_CERVICOVAGINAL_JUNCTION'] },
  { id: 'FMA20000', name: 'Clitoris (glans, body & crura)', elements: ['HF_CLITORIS'] },
  { id: 'FMA20045', name: 'Bulbs of vestibule', elements: ['HF_VESTIBULAR_BULBS'] },
  { id: 'FMA20058', name: 'Greater vestibular glands (Bartholin glands)', elements: ['HF_BARTHOLIN_GLANDS'] },
  { id: 'FMA20015', name: 'Labia minora', elements: ['HF_LABIA_MINORA'] },
  { id: 'FMA20012', name: 'Labia majora', elements: ['HF_LABIA_MAJORA'] },
  { id: 'FMA20006', name: 'Mons pubis', elements: ['HF_MONS_PUBIS'] },

  // Fallopian Tubes
  {
    id: 'FMA18246',
    name: 'Left uterine tube (Fallopian tube)',
    elements: [
      'HF_TUBE_ISTHMUS_LEFT',
      'HF_TUBE_AMPULLA_LEFT',
      'HF_TUBE_INFUNDIBULUM_LEFT',
      'HF_TUBE_FIMBRIAE_LEFT',
    ],
  },
  {
    id: 'FMA18245',
    name: 'Right uterine tube (Fallopian tube)',
    elements: [
      'HF_TUBE_ISTHMUS_RIGHT',
      'HF_TUBE_AMPULLA_RIGHT',
      'HF_TUBE_INFUNDIBULUM_RIGHT',
      'HF_TUBE_FIMBRIAE_RIGHT',
    ],
  },
  { id: 'FMA18304', name: 'Left isthmus of uterine tube', elements: ['HF_TUBE_ISTHMUS_LEFT'] },
  { id: 'FMA18303', name: 'Right isthmus of uterine tube', elements: ['HF_TUBE_ISTHMUS_RIGHT'] },
  { id: 'FMA18300', name: 'Left ampulla of uterine tube', elements: ['HF_TUBE_AMPULLA_LEFT'] },
  { id: 'FMA18299', name: 'Right ampulla of uterine tube', elements: ['HF_TUBE_AMPULLA_RIGHT'] },
  { id: 'FMA18296', name: 'Left infundibulum of uterine tube', elements: ['HF_TUBE_INFUNDIBULUM_LEFT'] },
  { id: 'FMA18295', name: 'Right infundibulum of uterine tube', elements: ['HF_TUBE_INFUNDIBULUM_RIGHT'] },
  { id: 'FMA18298', name: 'Left fimbriae of uterine tube', elements: ['HF_TUBE_FIMBRIAE_LEFT'] },
  { id: 'FMA18297', name: 'Right fimbriae of uterine tube', elements: ['HF_TUBE_FIMBRIAE_RIGHT'] },

  // Ovaries & Ligaments
  { id: 'FMA7214', name: 'Left ovary', elements: ['HF_OVARY_LEFT'] },
  { id: 'FMA7213', name: 'Right ovary', elements: ['HF_OVARY_RIGHT'] },
  { id: 'FMA7209', name: 'Ovary (bilateral)', elements: ['HF_OVARY_LEFT', 'HF_OVARY_RIGHT'] },
  { id: 'FMA19761', name: 'Left proper ovarian ligament', elements: ['HF_OVARIAN_LIGAMENT_LEFT'] },
  { id: 'FMA19760', name: 'Right proper ovarian ligament', elements: ['HF_OVARIAN_LIGAMENT_RIGHT'] },
  { id: 'FMA19763', name: 'Left suspensory ligament of ovary', elements: ['HF_SUSPENSORY_OVARY_LEFT'] },
  { id: 'FMA19762', name: 'Right suspensory ligament of ovary', elements: ['HF_SUSPENSORY_OVARY_RIGHT'] },
  { id: 'FMA19759', name: 'Left round ligament of uterus', elements: ['HF_ROUND_LIGAMENT_LEFT'] },
  { id: 'FMA19758', name: 'Right round ligament of uterus', elements: ['HF_ROUND_LIGAMENT_RIGHT'] },
  { id: 'FMA19769', name: 'Left cardinal (transverse cervical) ligament', elements: ['HF_CARDINAL_LIGAMENT_LEFT'] },
  { id: 'FMA19768', name: 'Right cardinal (transverse cervical) ligament', elements: ['HF_CARDINAL_LIGAMENT_RIGHT'] },
  { id: 'FMA19767', name: 'Left uterosacral ligament', elements: ['HF_UTEROSACRAL_LIGAMENT_LEFT'] },
  { id: 'FMA19766', name: 'Right uterosacral ligament', elements: ['HF_UTEROSACRAL_LIGAMENT_RIGHT'] },
  { id: 'FMA19749', name: 'Broad ligament of uterus', elements: ['HF_BROAD_LIGAMENT'] },
  { id: 'FMA19753', name: 'Left mesosalpinx', elements: ['HF_MESOSALPINX_LEFT'] },
  { id: 'FMA19752', name: 'Right mesosalpinx', elements: ['HF_MESOSALPINX_RIGHT'] },
  { id: 'FMA19757', name: 'Left mesovarium', elements: ['HF_MESOVARIUM_LEFT'] },
  { id: 'FMA19756', name: 'Right mesovarium', elements: ['HF_MESOVARIUM_RIGHT'] },
  { id: 'FMA19773', name: 'Vesicouterine peritoneal pouch', elements: ['HF_UTEROVESICAL_POUCH'] },

  // Uterine Vessels
  { id: 'FMA18824', name: 'Left uterine artery', elements: ['HF_UTERINE_ARTERY_LEFT'] },
  { id: 'FMA18823', name: 'Right uterine artery', elements: ['HF_UTERINE_ARTERY_RIGHT'] },
  { id: 'FMA18908', name: 'Left uterine vein', elements: ['HF_UTERINE_VEIN_LEFT'] },
  { id: 'FMA18907', name: 'Right uterine vein', elements: ['HF_UTERINE_VEIN_RIGHT'] },

  // Mammary Glands
  {
    id: 'FMA57991',
    name: 'Left mammary gland',
    elements: [
      'HF_MAMMARY_FAT_LEFT',
      'HF_MAMMARY_LOBES_LEFT',
      'HF_LACTIFEROUS_DUCTS_LEFT',
      'HF_LACTIFEROUS_SINUSES_LEFT',
      'HF_COOPER_LIGAMENTS_LEFT',
      'HF_AREOLA_LEFT',
      'HF_NIPPLE_LEFT',
      'HF_AREOLAR_TUBERCLES_LEFT',
    ],
  },
  {
    id: 'FMA57990',
    name: 'Right mammary gland',
    elements: [
      'HF_MAMMARY_FAT_RIGHT',
      'HF_MAMMARY_LOBES_RIGHT',
      'HF_LACTIFEROUS_DUCTS_RIGHT',
      'HF_LACTIFEROUS_SINUSES_RIGHT',
      'HF_COOPER_LIGAMENTS_RIGHT',
      'HF_AREOLA_RIGHT',
      'HF_NIPPLE_RIGHT',
      'HF_AREOLAR_TUBERCLES_RIGHT',
    ],
  },
  {
    id: 'FMA9601',
    name: 'Mammary glands (bilateral)',
    elements: [
      'HF_MAMMARY_FAT_LEFT',
      'HF_MAMMARY_LOBES_LEFT',
      'HF_LACTIFEROUS_DUCTS_LEFT',
      'HF_LACTIFEROUS_SINUSES_LEFT',
      'HF_COOPER_LIGAMENTS_LEFT',
      'HF_AREOLA_LEFT',
      'HF_NIPPLE_LEFT',
      'HF_AREOLAR_TUBERCLES_LEFT',
      'HF_MAMMARY_FAT_RIGHT',
      'HF_MAMMARY_LOBES_RIGHT',
      'HF_LACTIFEROUS_DUCTS_RIGHT',
      'HF_LACTIFEROUS_SINUSES_RIGHT',
      'HF_COOPER_LIGAMENTS_RIGHT',
      'HF_AREOLA_RIGHT',
      'HF_NIPPLE_RIGHT',
      'HF_AREOLAR_TUBERCLES_RIGHT',
    ],
  },
  {
    id: 'FMA67804',
    name: 'Mammary gland lobes (alveolar lobules)',
    elements: ['HF_MAMMARY_LOBES_LEFT', 'HF_MAMMARY_LOBES_RIGHT'],
  },
  {
    id: 'FMA67806',
    name: 'Main lactiferous ducts',
    elements: ['HF_LACTIFEROUS_DUCTS_LEFT', 'HF_LACTIFEROUS_DUCTS_RIGHT'],
  },
  {
    id: 'FMA72025',
    name: 'Lactiferous sinuses',
    elements: ['HF_LACTIFEROUS_SINUSES_LEFT', 'HF_LACTIFEROUS_SINUSES_RIGHT'],
  },
  {
    id: 'FMA76818',
    name: 'Suspensory ligaments of breast (Cooper)',
    elements: ['HF_COOPER_LIGAMENTS_LEFT', 'HF_COOPER_LIGAMENTS_RIGHT'],
  },
  {
    id: 'FMA57995',
    name: 'Areola of breast',
    elements: ['HF_AREOLA_LEFT', 'HF_AREOLA_RIGHT'],
  },
  {
    id: 'FMA67796',
    name: 'Nipple (mammary papilla)',
    elements: ['HF_NIPPLE_LEFT', 'HF_NIPPLE_RIGHT'],
  },
  {
    id: 'FMA72031',
    name: 'Areolar glands (Montgomery tubercles)',
    elements: ['HF_AREOLAR_TUBERCLES_LEFT', 'HF_AREOLAR_TUBERCLES_RIGHT'],
  },
];

const manifest = {
  version: 'female-overlay-2.0',
  sex: 'female',
  source:
    'HuBMAP HRA v1.5 Visible Human Female (CC BY 4.0, DOI: 10.48539/HBM352.BTSQ.586) + co-registered female urethral conduit',
  chunks: [
    {
      url: '/models/female/female-0.bin',
      bytes: binBuffer.length,
      gzip: '/models/female/female-0.bin.gz',
      gzipBytes: gzBuffer.length,
    },
  ],
  parts,
  concepts,
  triangles: totalTriangles,
};

fs.writeFileSync(path.join(OUT_DIR, 'female-atlas.json'), JSON.stringify(manifest, null, 2));

console.log(
  `Built enhanced female anatomical overlay pack: ${parts.length} parts, ${concepts.length} concepts, ${totalTriangles.toLocaleString()} tris | raw=${(binBuffer.length / 1024).toFixed(1)}KB | gz=${(gzBuffer.length / 1024).toFixed(1)}KB`,
);
for (const p of parts) {
  console.log(
    `  ${p.id.padEnd(28)} | ${(p.indexCount / 3).toString().padStart(4)} tris | min=${p.bounds[0].map((n) => n.toFixed(3)).join(',')} max=${p.bounds[1].map((n) => n.toFixed(3)).join(',')}`,
  );
}
