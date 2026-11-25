import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { MeshoptSimplifier } from 'meshoptimizer';

await MeshoptSimplifier.ready;

const TMP_DIR = process.env.HRA_INSPECT_DIR || '/tmp/hra_inspect';
const ATLAS_PATH = path.resolve('public/models/atlas.json');
const atlas = JSON.parse(fs.readFileSync(ATLAS_PATH, 'utf8'));

const partById = new Map(atlas.parts.map((p) => [p.id, p]));
function boundsCenter(b) {
  return [
    (b[0][0] + b[1][0]) * 0.5,
    (b[0][1] + b[1][1]) * 0.5,
    (b[0][2] + b[1][2]) * 0.5,
  ];
}
function boundsSize(b) {
  return [b[1][0] - b[0][0], b[1][1] - b[0][1], b[1][2] - b[0][2]];
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

const glbCache = new Map();
function readGlbWithScene(glbFile) {
  const filePath = path.join(TMP_DIR, glbFile);
  if (glbCache.has(filePath)) return glbCache.get(filePath);
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
  const loaded = { gltf, bin, worldMats };
  glbCache.set(filePath, loaded);
  return loaded;
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

function extractNodeMeshes(glbFile, nodeNamePredicate, transformFn = (x, y, z) => [x, y, z]) {
  const { gltf, bin, worldMats } = readGlbWithScene(glbFile);
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

function measureGeomBounds(positions) {
  const bmin = [Infinity, Infinity, Infinity];
  const bmax = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      bmin[k] = Math.min(bmin[k], positions[i + k]);
      bmax[k] = Math.max(bmax[k], positions[i + k]);
    }
  }
  return [bmin, bmax];
}

function transformGeom(geom, fn) {
  const out = new Float32Array(geom.positions.length);
  for (let i = 0; i < geom.positions.length; i += 3) {
    const [tx, ty, tz] = fn(geom.positions[i], geom.positions[i + 1], geom.positions[i + 2]);
    out[i] = tx;
    out[i + 1] = ty;
    out[i + 2] = tz;
  }
  return { positions: out, indices: geom.indices };
}

function weldAndSimplify({ positions, indices }, targetTriangles, minTriangles = 55) {
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

  const [bmin, bmax] = measureGeomBounds(curPos);
  for (let k = 0; k < 3; k++) {
    if (!Number.isFinite(bmin[k]) || !Number.isFinite(bmax[k]) || bmin[k] >= bmax[k]) {
      throw new Error(`Degenerate bounds after packing: ${JSON.stringify([bmin, bmax])}`);
    }
  }
  if (curIdx.length / 3 < 50) {
    throw new Error(`Mesh below 50-triangle floor (${curIdx.length / 3} tris)`);
  }
  return { positions: curPos, normals, indices: curIdx, bounds: [bmin, bmax] };
}

function packDefinitionsToBinary(definitions, outDir, binName, manifestName, manifestMeta) {
  fs.mkdirSync(outDir, { recursive: true });
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

  const parts = [];
  for (const def of definitions) {
    if (def.prebuilt) {
      const { posBuf, normBuf, idxBuf, part } = def.prebuilt;
      const posOff = appendTyped(new Uint8Array(posBuf));
      const normOff = appendTyped(new Uint8Array(normBuf));
      const idxOff = appendTyped(new Uint8Array(idxBuf));
      totalTriangles += part.indexCount / 3;
      parts.push({ ...part, chunk: 0, positions: posOff, normals: normOff, indices: idxOff });
      continue;
    }
    const processed = weldAndSimplify(def.geom, def.targetTris, def.minTris ?? 55);
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
      license: 'CC BY 4.0',
    });
  }

  const binBuffer = Buffer.concat(segments);
  const gzBuffer = zlib.gzipSync(binBuffer, { level: 9 });
  fs.writeFileSync(path.join(outDir, binName), binBuffer);
  fs.writeFileSync(path.join(outDir, `${binName}.gz`), gzBuffer);

  const webDir = '/' + path.relative(path.resolve('public'), outDir).replace(/\\/g, '/');
  const manifest = {
    ...manifestMeta,
    chunks: [
      {
        url: `${webDir}/${binName}`,
        bytes: binBuffer.length,
        gzip: `${webDir}/${binName}.gz`,
        gzipBytes: gzBuffer.length,
      },
    ],
    parts,
    concepts: manifestMeta.conceptsBuilder(parts),
    triangles: totalTriangles,
  };
  delete manifest.conceptsBuilder;

  fs.writeFileSync(path.join(outDir, manifestName), JSON.stringify(manifest, null, 2));
  console.log(
    `[pack] ${manifestName}: ${parts.length} parts, ${manifest.concepts.length} concepts, ${totalTriangles.toLocaleString()} tris | bin=${(binBuffer.length / 1024).toFixed(1)}KB gz=${(gzBuffer.length / 1024).toFixed(1)}KB`,
  );
  return manifest;
}

const pExact = (exact) => (n) => n === exact;

// ===========================================================================
// 1. SHARED ENHANCEMENTS PACK (Loaded in BOTH Adult Male & Adult Female)
//    - 30 HuBMAP HRA Spinal Cord Segments (C1-S5) along BP3D C1-L2 neural canal
//    - 7 Non-Redundant HuBMAP HRA Hepatic Ligaments & Porta Hepatis
//    - 2 HuBMAP HRA Palatine Tonsils (L/R)
//    - 8 HuBMAP HRA Internal Renal Cortex / Medulla / Columns / Hilum (L/R)
// ===========================================================================
const HRA_SPINAL_SRC = 'HuBMAP HRA v1.1 Visible Human Male Spinal Cord (CC BY 4.0, 3d-vh-m-spinal-cord)';
const HRA_LIVER_SRC = 'HuBMAP HRA v1.2 Visible Human Male Liver (CC BY 4.0, 3d-vh-m-liver)';
const HRA_TONSIL_SRC = 'HuBMAP HRA v1.1 Visible Human Palatine Tonsil (CC BY 4.0, 3d-vh-m-palatine-tonsil)';
const HRA_KIDNEY_SRC = 'HuBMAP HRA v1.2 Visible Human Male Kidney (CC BY 4.0, 3d-vh-m-kidney)';

// Compute BP3D vertebral neural canal spline from C1 (Atlas) down to L2 conus termination
const canalAnchorIds = [
  'FJ3176', // C1 Atlas
  'FJ3177', // C2 Axis
  'FJ3161', // C3
  'FJ3164', // C4
  'FJ3167', // C5
  'FJ3170', // C6
  'FJ3172', // C7
  'FJ3158', // T1
  'FJ3160', // T2
  'FJ3163', // T3
  'FJ3166', // T4
  'FJ3169', // T5
  'FJ3171', // T6
  'FJ3173', // T7
  'FJ3174', // T8
  'FJ3175', // T9
  'FJ3154', // T10
  'FJ3155', // T11
  'FJ3156', // T12
  'FJ3157', // L1
  'FJ3159', // L2
];

const canalWaypoints = canalAnchorIds
  .map((id) => {
    const p = partById.get(id);
    const c = boundsCenter(p.bounds);
    const zCanal = p.bounds[0][2] + 0.36 * (p.bounds[1][2] - p.bounds[0][2]);
    return { id, x: c[0], y: c[1], z: zCanal };
  })
  .sort((a, b) => a.y - b.y);

function sampleCanalAtY(y) {
  if (y <= canalWaypoints[0].y) return [canalWaypoints[0].x, canalWaypoints[0].z];
  const last = canalWaypoints[canalWaypoints.length - 1];
  if (y >= last.y) return [last.x, last.z];
  for (let i = 0; i < canalWaypoints.length - 1; i++) {
    const a = canalWaypoints[i];
    const b = canalWaypoints[i + 1];
    if (y >= a.y && y <= b.y) {
      const t = (y - a.y) / Math.max(1e-6, b.y - a.y);
      return [a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t];
    }
  }
  return [last.x, last.z];
}

const SPINAL_DEFS = [
  ['HS_SPINAL_C1', 'C1 cervical spinal cord segment', 'FMA72721', 'VH_M_C1_segment_of_cervical_spinal_cord'],
  ['HS_SPINAL_C2', 'C2 cervical spinal cord segment', 'FMA72722', 'VH_M_C2_segment_of_cervical_spinal_cord'],
  ['HS_SPINAL_C3', 'C3 cervical spinal cord segment', 'FMA72723', 'VH_M_C3_segment_of_cervical_spinal_cord'],
  ['HS_SPINAL_C4', 'C4 cervical spinal cord segment', 'FMA72724', 'VH_M_C4_segment_of_cervical_spinal_cord'],
  ['HS_SPINAL_C5', 'C5 cervical spinal cord segment', 'FMA72725', 'VH_M_C5_segment_of_cervical_spinal_cord'],
  ['HS_SPINAL_C6', 'C6 cervical spinal cord segment', 'FMA72726', 'VH_M_C6_segment_of_cervical_spinal_cord'],
  ['HS_SPINAL_C7', 'C7 cervical spinal cord segment', 'FMA72727', 'VH_M_C7_segment_of_cervical_spinal_cord'],
  ['HS_SPINAL_C8', 'C8 cervical spinal cord segment', 'FMA72728', 'VH_M_C8_segment_of_cervical_spinal_cord'],
  ['HS_SPINAL_T1', 'T1 thoracic spinal cord segment', 'FMA72729', 'VH_M_first_thoracic_spinal_cord_segment'],
  ['HS_SPINAL_T2', 'T2 thoracic spinal cord segment', 'FMA72730', 'VH_M_second_thoracic_spinal_cord_segment'],
  ['HS_SPINAL_T3', 'T3 thoracic spinal cord segment', 'FMA72731', 'VH_M_third_thoracic_spinal_cord_segment'],
  ['HS_SPINAL_T4', 'T4 thoracic spinal cord segment', 'FMA72732', 'VH_M_fourth_thoracic_spinal_cord_segment'],
  ['HS_SPINAL_T5', 'T5 thoracic spinal cord segment', 'FMA72733', 'VH_M_fifth_thoracic_spinal_cord_segment'],
  ['HS_SPINAL_T6', 'T6 thoracic spinal cord segment', 'FMA72734', 'VH_M_sixth_thoracic_spinal_cord_segment'],
  ['HS_SPINAL_T7', 'T7 thoracic spinal cord segment', 'FMA72735', 'VH_M_seventh_thoracic_spinal_cord_segment'],
  ['HS_SPINAL_T8', 'T8 thoracic spinal cord segment', 'FMA72736', 'VH_M_eighth_thoracic_spinal_cord_segment'],
  ['HS_SPINAL_T9', 'T9 thoracic spinal cord segment', 'FMA72737', 'VH_M_ninth_thoracic_spinal_cord_segment'],
  ['HS_SPINAL_T10', 'T10 thoracic spinal cord segment', 'FMA72738', 'VH_M_tenth_thoracic_spinal_cord_segment'],
  ['HS_SPINAL_T11', 'T11 thoracic spinal cord segment', 'FMA72739', 'VH_M_eleventh_thoracic_spinal_cord_segment'],
  ['HS_SPINAL_T12', 'T12 thoracic spinal cord segment', 'FMA72740', 'VH_M_twelfth_thoracic_spinal_cord_segment'],
  ['HS_SPINAL_L1', 'L1 lumbar spinal cord segment', 'FMA72741', 'VH_M_first_lumbar_spinal_cord_segment'],
  ['HS_SPINAL_L2', 'L2 lumbar spinal cord segment', 'FMA72742', 'VH_M_second_lumbar_spinal_cord_segment'],
  ['HS_SPINAL_L3', 'L3 lumbar spinal cord segment', 'FMA72743', 'VH_M_third_lumbar_spinal_cord_segment'],
  ['HS_SPINAL_L4', 'L4 lumbar spinal cord segment', 'FMA72744', 'VH_M_fourth_lumbar_spinal_cord_segment'],
  ['HS_SPINAL_L5', 'L5 lumbar spinal cord segment', 'FMA72745', 'VH_M_fifth_lumbar_spinal_cord_segment'],
  ['HS_SPINAL_S1', 'S1 sacral spinal cord segment', 'FMA72746', 'VH_M_first_sacral_spinal_cord_segment'],
  ['HS_SPINAL_S2', 'S2 sacral spinal cord segment', 'FMA72747', 'VH_M_second_sacral_spinal_cord_segment'],
  ['HS_SPINAL_S3', 'S3 sacral spinal cord segment', 'FMA72748', 'VH_M_third_sacral_spinal_cord_segment'],
  ['HS_SPINAL_S4', 'S4 sacral spinal cord segment', 'FMA72749', 'VH_M_fourth_sacral_spinal_cord_segment'],
  ['HS_SPINAL_S5', 'S5 sacral spinal cord segment', 'FMA72750', 'VH_M_fifth_sacral_spinal_cord_segment'],
];

const rawSpinalGeoms = SPINAL_DEFS.map(([, , , nodeName]) => {
  const g = extractNodeMeshes('m_spinal.glb', pExact(nodeName));
  return { g, bounds: measureGeomBounds(g.positions) };
});
const hraCordMinY = Math.min(...rawSpinalGeoms.map((s) => s.bounds[0][1]));
const hraCordMaxY = Math.max(...rawSpinalGeoms.map((s) => s.bounds[1][1]));
const bpCordBottomY = boundsCenter(partById.get('FJ3159').bounds)[1] + 0.008; // Conus medullaris ~L1/L2 junction
const bpCordTopY = partById.get('FJ1737').bounds[1][1] - 0.004; // C1 level

const sharedDefinitions = [];
for (let i = 0; i < SPINAL_DEFS.length; i++) {
  const [id, name, conceptId] = SPINAL_DEFS[i];
  const { g, bounds } = rawSpinalGeoms[i];
  const segCenterX = (bounds[0][0] + bounds[1][0]) * 0.5;
  const segCenterZ = (bounds[0][2] + bounds[1][2]) * 0.5;
  const mapped = transformGeom(g, (x, y, z) => {
    const u = (y - hraCordMinY) / (hraCordMaxY - hraCordMinY);
    const ty = bpCordBottomY + u * (bpCordTopY - bpCordBottomY);
    const [cx, cz] = sampleCanalAtY(ty);
    return [cx + (x - segCenterX) * 0.92, ty, cz + (z - segCenterZ) * 0.92];
  });
  sharedDefinitions.push({
    id,
    name,
    conceptId,
    system: 'nervous',
    source: HRA_SPINAL_SRC,
    geom: mapped,
    targetTris: 260,
    minTris: 80,
  });
}

// Liver ligands & porta hepatis (anchored via Caudate Lobe FJ2816)
const hraCaudateBounds = measureGeomBounds(extractNodeMeshes('m_liver.glb', pExact('VH_M_caudate_lobe_of_liver')).positions);
const bpCaudateCenter = boundsCenter(partById.get('FJ2816').bounds);
const hraCaudateCenter = boundsCenter(hraCaudateBounds);
const liverShift = [
  bpCaudateCenter[0] - hraCaudateCenter[0],
  bpCaudateCenter[1] - hraCaudateCenter[1],
  bpCaudateCenter[2] - hraCaudateCenter[2],
];
const xformLiver = (x, y, z) => [x + liverShift[0], y + liverShift[1], z + liverShift[2]];

const LIVER_ADD_DEFS = [
  ['HS_PORTA_HEPATIS', 'Porta hepatis (hepatic hilum)', 'FMA15759', 'digestive', 'VH_M_porta_hepatis', 420],
  ['HS_LIVER_FALCIFORM_LIG', 'Falciform ligament of liver', 'FMA14074', 'connective', 'VH_M_falciform_ligament', 192],
  ['HS_LIVER_ROUND_LIG', 'Round ligament of liver (ligamentum teres)', 'FMA14075', 'connective', 'VH_M_round_ligament_of_liver', 190],
  ['HS_LIVER_CORONARY_LIG', 'Coronary ligament of liver', 'FMA14071', 'connective', 'VH_M_coronary_ligament_of_liver', 520],
  ['HS_LIVER_TRIANGULAR_LIG', 'Triangular ligament of liver', 'FMA14072', 'connective', 'VH_M_triangular_ligament_of_liver', 58],
  ['HS_LIVER_VENOSUM_LIG', 'Ligamentum venosum of liver', 'FMA14076', 'connective', 'VH_M_ligamentum_venosum', 350],
  ['HS_HEPATODUODENAL_LIG', 'Hepatoduodenal ligament', 'FMA16470', 'connective', 'VH_M_hepataduodenal_ligament', 360],
];
for (const [id, name, conceptId, system, nodeName, targetTris] of LIVER_ADD_DEFS) {
  sharedDefinitions.push({
    id,
    name,
    conceptId,
    system,
    source: HRA_LIVER_SRC,
    geom: extractNodeMeshes('m_liver.glb', pExact(nodeName), xformLiver),
    targetTris,
    minTris: Math.min(55, targetTris),
  });
}

// Palatine tonsils (anchored into tonsillar fossa between palatopharyngeus FJ2743/FJ2755 & tongue FJ2761)
const leftPalatopharyngeus = partById.get('FJ2743').bounds;
const rightPalatopharyngeus = partById.get('FJ2755').bounds;
const tonsilBaseY = 1.522;
const tonsilBaseZ = 0.008;

function buildTonsilXform(glbFile, nodeName, targetXCenter) {
  const g = extractNodeMeshes(glbFile, pExact(nodeName));
  const c = boundsCenter(measureGeomBounds(g.positions));
  return transformGeom(g, (x, y, z) => [
    targetXCenter + (x - c[0]) * 0.85,
    tonsilBaseY + (y - c[1]) * 0.85,
    tonsilBaseZ + (z - c[2]) * 0.85,
  ]);
}
sharedDefinitions.push(
  {
    id: 'HS_PALATINE_TONSIL_L',
    name: 'Left palatine tonsil',
    conceptId: 'FMA54975',
    system: 'lymphatic',
    source: HRA_TONSIL_SRC,
    geom: buildTonsilXform('m_tonsil_l.glb', 'VH_M_palatine_tonsil_L', leftPalatopharyngeus[1][0] - 0.003),
    targetTris: 650,
    minTris: 200,
  },
  {
    id: 'HS_PALATINE_TONSIL_R',
    name: 'Right palatine tonsil',
    conceptId: 'FMA54974',
    system: 'lymphatic',
    source: HRA_TONSIL_SRC,
    geom: buildTonsilXform('m_tonsil_r.glb', 'VH_M_palatine_tonsil_R', rightPalatopharyngeus[0][0] + 0.003),
    targetTris: 650,
    minTris: 200,
  },
);

// Internal Kidney Structures (Cortex, Renal Columns, Medullary Pyramids, Hilum) fitted inside FJ3145 & FJ3147
function buildKidneyTransform(glbFile, capsuleNodeName, bpKidneyId) {
  const capGeom = extractNodeMeshes(glbFile, pExact(capsuleNodeName));
  const hraB = measureGeomBounds(capGeom.positions);
  const hraC = boundsCenter(hraB);
  const hraS = boundsSize(hraB);
  const bpB = partById.get(bpKidneyId).bounds;
  const bpC = boundsCenter(bpB);
  const bpS = boundsSize(bpB);
  const scale = [
    (bpS[0] * 0.90) / hraS[0],
    (bpS[1] * 0.92) / hraS[1],
    (bpS[2] * 0.90) / hraS[2],
  ];
  return (x, y, z) => [
    bpC[0] + (x - hraC[0]) * scale[0],
    bpC[1] + (y - hraC[1]) * scale[1],
    bpC[2] + (z - hraC[2]) * scale[2],
  ];
}

const xformKidneyL = buildKidneyTransform('m_kidney_l.glb', 'VH_M_kidney_capsule_L', 'FJ3145');
const xformKidneyR = buildKidneyTransform('m_kidney_r.glb', 'VH_M_kidney_capsule_R', 'FJ3147');

sharedDefinitions.push(
  {
    id: 'HS_KIDNEY_CORTEX_L',
    name: 'Left renal cortex',
    conceptId: 'FMA15587',
    system: 'urinary',
    source: HRA_KIDNEY_SRC,
    geom: extractNodeMeshes('m_kidney_l.glb', pExact('VH_M_outer_cortex_of_kidney_L'), xformKidneyL),
    targetTris: 1400,
    minTris: 400,
  },
  {
    id: 'HS_KIDNEY_CORTEX_R',
    name: 'Right renal cortex',
    conceptId: 'FMA15586',
    system: 'urinary',
    source: HRA_KIDNEY_SRC,
    geom: extractNodeMeshes('m_kidney_r.glb', pExact('VH_M_outer_cortex_of_kidney_R'), xformKidneyR),
    targetTris: 1400,
    minTris: 400,
  },
  {
    id: 'HS_KIDNEY_COLUMNS_L',
    name: 'Left renal columns (columns of Bertin)',
    conceptId: 'FMA15609',
    system: 'urinary',
    source: HRA_KIDNEY_SRC,
    geom: extractNodeMeshes('m_kidney_l.glb', pExact('VH_M_renal_column_L'), xformKidneyL),
    targetTris: 1200,
    minTris: 350,
  },
  {
    id: 'HS_KIDNEY_COLUMNS_R',
    name: 'Right renal columns (columns of Bertin)',
    conceptId: 'FMA15608',
    system: 'urinary',
    source: HRA_KIDNEY_SRC,
    geom: extractNodeMeshes('m_kidney_r.glb', pExact('VH_M_renal_column_R'), xformKidneyR),
    targetTris: 1200,
    minTris: 350,
  },
  {
    id: 'HS_KIDNEY_MEDULLA_L',
    name: 'Left renal medulla & medullary pyramids',
    conceptId: 'FMA15590',
    system: 'urinary',
    source: HRA_KIDNEY_SRC,
    geom: extractNodeMeshes('m_kidney_l.glb', (n) => /^VH_M_renal_(pyramid|papilla)_L_/.test(n), xformKidneyL),
    targetTris: 1500,
    minTris: 450,
  },
  {
    id: 'HS_KIDNEY_MEDULLA_R',
    name: 'Right renal medulla & medullary pyramids',
    conceptId: 'FMA15589',
    system: 'urinary',
    source: HRA_KIDNEY_SRC,
    geom: extractNodeMeshes('m_kidney_r.glb', (n) => /^VH_M_renal_(pyramid|papilla)_/.test(n), xformKidneyR),
    targetTris: 1500,
    minTris: 450,
  },
  {
    id: 'HS_KIDNEY_HILUM_L',
    name: 'Left renal hilum',
    conceptId: 'FMA15616',
    system: 'urinary',
    source: HRA_KIDNEY_SRC,
    geom: extractNodeMeshes('m_kidney_l.glb', pExact('VH_M_hilum_of_kidney_L'), xformKidneyL),
    targetTris: 700,
    minTris: 220,
  },
  {
    id: 'HS_KIDNEY_HILUM_R',
    name: 'Right renal hilum',
    conceptId: 'FMA15615',
    system: 'urinary',
    source: HRA_KIDNEY_SRC,
    geom: extractNodeMeshes('m_kidney_r.glb', pExact('VH_M_hilum_of_kidney_R'), xformKidneyR),
    targetTris: 700,
    minTris: 220,
  },
);

const sharedManifest = packDefinitionsToBinary(
  sharedDefinitions,
  path.resolve('public/models/shared'),
  'shared-0.bin',
  'shared-enhancements.json',
  {
    version: 'shared-enhancements-1.0',
    layer: 'shared_verified',
    source:
      'HuBMAP HRA Visible Human Male 3D Reference Library (CC BY 4.0: Spinal Cord v1.1, Liver v1.2, Palatine Tonsil v1.1, Kidney v1.2)',
    conceptsBuilder: (parts) => {
      const list = [
        {
          id: 'FMA7647',
          name: 'Spinal cord (C1–S5 segments)',
          elements: parts.filter((p) => p.id.startsWith('HS_SPINAL_')).map((p) => p.id),
        },
        {
          id: 'FMA54973',
          name: 'Palatine tonsils (bilateral)',
          elements: ['HS_PALATINE_TONSIL_L', 'HS_PALATINE_TONSIL_R'],
        },
      ];
      for (const p of parts) {
        list.push({ id: p.conceptId, name: p.name, elements: [p.id] });
      }
      return list;
    },
  },
);

// ===========================================================================
// 2. MALE ENHANCEMENTS PACK (Loaded in Adult Male mode only)
//    - 1 Male Coccyx (from 3d-vh-m-pelvis v1.3)
//    - 2 Male Bladder Trigone & Neck (from 3d-vh-m-urinary-bladder v1.2)
//    - 13 Prostatic Subdivisions & Ducts (from 3d-vh-m-prostate v1.2)
//    - 4 Male Middle/Inferior Rectal Veins (from 3d-vh-m-blood-vasculature v1.3)
// ===========================================================================
const HRA_M_PELVIS_SRC = 'HuBMAP HRA v1.3 Visible Human Male Pelvis (CC BY 4.0, 3d-vh-m-pelvis)';
const HRA_M_BLADDER_SRC = 'HuBMAP HRA v1.2 Visible Human Male Urinary Bladder (CC BY 4.0, 3d-vh-m-urinary-bladder)';
const HRA_M_PROSTATE_SRC = 'HuBMAP HRA v1.2 Visible Human Male Prostate (CC BY 4.0, 3d-vh-m-prostate)';
const HRA_M_VASC_SRC = 'HuBMAP HRA v1.3 Visible Human Male Blood Vasculature (CC BY 4.0, 3d-vh-m-blood-vasculature)';

const mSacrumBounds = measureGeomBounds(extractNodeMeshes('m_pelvis.glb', pExact('VH_M_sacrum')).positions);
const bpSacrumCenter = boundsCenter(partById.get('FJ3393').bounds);
const mSacrumCenter = boundsCenter(mSacrumBounds);
const mPelvisShift = [
  bpSacrumCenter[0] - mSacrumCenter[0],
  bpSacrumCenter[1] - mSacrumCenter[1],
  bpSacrumCenter[2] - mSacrumCenter[2],
];
const xformMPelvis = (x, y, z) => [x + mPelvisShift[0], y + mPelvisShift[1], z + mPelvisShift[2]];

// Male bladder trigone & neck fitted to BP3D FJ3149 Bladder
const mBladderOuterBounds = measureGeomBounds(
  extractNodeMeshes('m_bladder.glb', (n) => /fundus_of_urinary_bladder/.test(n)).positions,
);
const mBladderCenter = boundsCenter(mBladderOuterBounds);
const bpBladderCenter = boundsCenter(partById.get('FJ3149').bounds);
const mBladderShift = [
  bpBladderCenter[0] - mBladderCenter[0],
  bpBladderCenter[1] - mBladderCenter[1],
  bpBladderCenter[2] - mBladderCenter[2],
];
const xformMBladder = (x, y, z) => [x + mBladderShift[0], y + mBladderShift[1], z + mBladderShift[2]];

// Male prostate subdivisions & ducts fitted cleanly inside BP3D FJ3139 Prostate
const mProstateGlandBounds = measureGeomBounds(
  extractNodeMeshes(
    'm_prostate.glb',
    (n) => /peripheral_zone|central_zone|transition_zone|fibromuscular/.test(n),
  ).positions,
);
const mProsC = boundsCenter(mProstateGlandBounds);
const mProsS = boundsSize(mProstateGlandBounds);
const bpProsB = partById.get('FJ3139').bounds;
const bpProsC = boundsCenter(bpProsB);
const bpProsS = boundsSize(bpProsB);
const prosScale = [
  (bpProsS[0] * 0.92) / mProsS[0],
  (bpProsS[1] * 0.94) / mProsS[1],
  (bpProsS[2] * 0.92) / mProsS[2],
];
const xformMProstate = (x, y, z) => [
  bpProsC[0] + (x - mProsC[0]) * prosScale[0],
  bpProsC[1] + (y - mProsC[1]) * prosScale[1],
  bpProsC[2] + (z - mProsC[2]) * prosScale[2],
];

const maleDefinitions = [
  {
    id: 'HM_COCCYX',
    name: 'Male coccyx (tailbone)',
    conceptId: 'FMA20225_COCCYX',
    system: 'skeletal',
    source: HRA_M_PELVIS_SRC,
    geom: extractNodeMeshes('m_pelvis.glb', pExact('VH_M_coccyx'), xformMPelvis),
    targetTris: 460,
    minTris: 140,
  },
  {
    id: 'HM_BLADDER_TRIGONE',
    name: 'Trigone of male urinary bladder',
    conceptId: 'FMA15926',
    system: 'urinary',
    source: HRA_M_BLADDER_SRC,
    geom: extractNodeMeshes('m_bladder.glb', pExact('VH_M_trigone_of_urinary_bladder'), xformMBladder),
    targetTris: 443,
    minTris: 140,
  },
  {
    id: 'HM_BLADDER_NECK',
    name: 'Neck of male urinary bladder',
    conceptId: 'FMA15924',
    system: 'urinary',
    source: HRA_M_BLADDER_SRC,
    geom: extractNodeMeshes('m_bladder.glb', pExact('VH_M_urinary_bladder_neck_smooth_muscle'), xformMBladder),
    targetTris: 112,
    minTris: 80,
  },
  {
    id: 'HM_EJACULATORY_DUCT',
    name: 'Ejaculatory ducts',
    conceptId: 'FMA19290',
    system: 'reproductive',
    source: HRA_M_PROSTATE_SRC,
    geom: extractNodeMeshes('m_prostate.glb', pExact('VH_M_ejaculatory_duct'), xformMProstate),
    targetTris: 700,
    minTris: 220,
  },
  {
    id: 'HM_PROSTATIC_UTRICLE',
    name: 'Prostatic utricle',
    conceptId: 'FMA19645',
    system: 'reproductive',
    source: HRA_M_PROSTATE_SRC,
    geom: extractNodeMeshes('m_prostate.glb', pExact('VH_M_prostatic_utricle'), xformMProstate),
    targetTris: 450,
    minTris: 150,
  },
  {
    id: 'HM_SEMINAL_COLLICULUS',
    name: 'Seminal colliculus (verumontanum)',
    conceptId: 'FMA19644',
    system: 'reproductive',
    source: HRA_M_PROSTATE_SRC,
    geom: extractNodeMeshes('m_prostate.glb', pExact('VH_M_seminal_colliculus'), xformMProstate),
    targetTris: 240,
    minTris: 100,
  },
  {
    id: 'HM_PROSTATE_DUCT_L',
    name: 'Left prostatic ducts',
    conceptId: 'FMA19299',
    system: 'reproductive',
    source: HRA_M_PROSTATE_SRC,
    geom: extractNodeMeshes('m_prostate.glb', pExact('VH_M_prostate_duct_L'), xformMProstate),
    targetTris: 600,
    minTris: 200,
  },
  {
    id: 'HM_PROSTATE_DUCT_R',
    name: 'Right prostatic ducts',
    conceptId: 'FMA19298',
    system: 'reproductive',
    source: HRA_M_PROSTATE_SRC,
    geom: extractNodeMeshes('m_prostate.glb', pExact('VH_M_prostate_duct_R'), xformMProstate),
    targetTris: 600,
    minTris: 200,
  },
  {
    id: 'HM_PROSTATE_PERIPHERAL_L',
    name: 'Left peripheral zone of prostate',
    conceptId: 'FMA74139',
    system: 'reproductive',
    source: HRA_M_PROSTATE_SRC,
    geom: extractNodeMeshes('m_prostate.glb', pExact('VH_M_peripheral_zone_of_prostate_L'), xformMProstate),
    targetTris: 900,
    minTris: 280,
  },
  {
    id: 'HM_PROSTATE_PERIPHERAL_R',
    name: 'Right peripheral zone of prostate',
    conceptId: 'FMA74138',
    system: 'reproductive',
    source: HRA_M_PROSTATE_SRC,
    geom: extractNodeMeshes('m_prostate.glb', pExact('VH_M_peripheral_zone_of_prostate_R'), xformMProstate),
    targetTris: 900,
    minTris: 280,
  },
  {
    id: 'HM_PROSTATE_CENTRAL_L',
    name: 'Left central zone of prostate',
    conceptId: 'FMA74141',
    system: 'reproductive',
    source: HRA_M_PROSTATE_SRC,
    geom: extractNodeMeshes('m_prostate.glb', pExact('VH_M_central_zone_of_prostate_L'), xformMProstate),
    targetTris: 650,
    minTris: 220,
  },
  {
    id: 'HM_PROSTATE_CENTRAL_R',
    name: 'Right central zone of prostate',
    conceptId: 'FMA74140',
    system: 'reproductive',
    source: HRA_M_PROSTATE_SRC,
    geom: extractNodeMeshes('m_prostate.glb', pExact('VH_M_central_zone_of_prostate_R'), xformMProstate),
    targetTris: 650,
    minTris: 220,
  },
  {
    id: 'HM_PROSTATE_TRANSITION_L',
    name: 'Left transition zone of prostate',
    conceptId: 'FMA74143',
    system: 'reproductive',
    source: HRA_M_PROSTATE_SRC,
    geom: extractNodeMeshes('m_prostate.glb', pExact('VH_M_transition_zone__of_prostate_L'), xformMProstate),
    targetTris: 500,
    minTris: 180,
  },
  {
    id: 'HM_PROSTATE_TRANSITION_R',
    name: 'Right transition zone of prostate',
    conceptId: 'FMA74142',
    system: 'reproductive',
    source: HRA_M_PROSTATE_SRC,
    geom: extractNodeMeshes('m_prostate.glb', pExact('VH_M_transition_zone_of_prostate_R'), xformMProstate),
    targetTris: 500,
    minTris: 180,
  },
  {
    id: 'HM_PROSTATE_AFMS_L',
    name: 'Left anterior fibromuscular stroma of prostate',
    conceptId: 'FMA74145',
    system: 'reproductive',
    source: HRA_M_PROSTATE_SRC,
    geom: extractNodeMeshes('m_prostate.glb', pExact('VH_M_anterior_fibromuscular_stroma_L'), xformMProstate),
    targetTris: 550,
    minTris: 180,
  },
  {
    id: 'HM_PROSTATE_AFMS_R',
    name: 'Right anterior fibromuscular stroma of prostate',
    conceptId: 'FMA74144',
    system: 'reproductive',
    source: HRA_M_PROSTATE_SRC,
    geom: extractNodeMeshes('m_prostate.glb', pExact('VH_M_anterior_fibromuscular_stroma_R'), xformMProstate),
    targetTris: 550,
    minTris: 180,
  },
  {
    id: 'HM_MIDDLE_RECTAL_VEIN_L',
    name: 'Left middle rectal vein',
    conceptId: 'FMA18911_MRV',
    system: 'venous',
    source: HRA_M_VASC_SRC,
    geom: extractNodeMeshes('m_vasc.glb', pExact('VH_M_middle_rectal_vein_L'), xformMPelvis),
    targetTris: 440,
    minTris: 140,
  },
  {
    id: 'HM_MIDDLE_RECTAL_VEIN_R',
    name: 'Right middle rectal vein',
    conceptId: 'FMA18910_MRV',
    system: 'venous',
    source: HRA_M_VASC_SRC,
    geom: extractNodeMeshes('m_vasc.glb', pExact('VH_M_middle_rectal_vein_R'), xformMPelvis),
    targetTris: 314,
    minTris: 120,
  },
  {
    id: 'HM_INFERIOR_RECTAL_VEIN_L',
    name: 'Left inferior rectal vein',
    conceptId: 'FMA18923',
    system: 'venous',
    source: HRA_M_VASC_SRC,
    geom: extractNodeMeshes('m_vasc.glb', pExact('VH_M_inferior_rectal_vein_L'), xformMPelvis),
    targetTris: 550,
    minTris: 180,
  },
  {
    id: 'HM_INFERIOR_RECTAL_VEIN_R',
    name: 'Right inferior rectal vein',
    conceptId: 'FMA18922',
    system: 'venous',
    source: HRA_M_VASC_SRC,
    geom: extractNodeMeshes('m_vasc.glb', pExact('VH_M_inferior_rectal_vein_R'), xformMPelvis),
    targetTris: 550,
    minTris: 180,
  },
];

const maleManifest = packDefinitionsToBinary(
  maleDefinitions,
  path.resolve('public/models/male'),
  'male-0.bin',
  'male-enhancements.json',
  {
    version: 'male-enhancements-1.0',
    sex: 'male',
    layer: 'male_specific',
    source:
      'HuBMAP HRA Visible Human Male 3D Reference Library (CC BY 4.0: Pelvis v1.3, Urinary Bladder v1.2, Prostate v1.2, Blood Vasculature v1.3)',
    conceptsBuilder: (parts) =>
      parts.map((p) => ({
        id: p.conceptId,
        name: p.name,
        elements: [p.id],
      })),
  },
);

// ===========================================================================
// 3. EXPANDED FEMALE OVERLAY (Existing 79 parts + 13 HuBMAP Female Pelvic Vessels)
//    Co-registered cleanly with xformPelvis
// ===========================================================================
const PELVIS_H_CENTER = [-0.0086, 0.0589, -0.0911];
const PELVIS_B_TARGET = [-0.0004, 0.933, -0.034];
const PELVIS_SCALE = [0.92, 0.97, 0.82];
function xformFPelvis(x, y, z) {
  return [
    (x - PELVIS_H_CENTER[0]) * PELVIS_SCALE[0] + PELVIS_B_TARGET[0],
    (y - PELVIS_H_CENTER[1]) * PELVIS_SCALE[1] + PELVIS_B_TARGET[1],
    (z - PELVIS_H_CENTER[2]) * PELVIS_SCALE[2] + PELVIS_B_TARGET[2],
  ];
}

const existingFemaleDir = path.resolve('public/models/female');
const existingFemaleManifest = JSON.parse(
  fs.readFileSync(path.join(existingFemaleDir, 'female-atlas.json'), 'utf8'),
);
const existingFemaleBin = fs.readFileSync(path.join(existingFemaleDir, 'female-0.bin'));

// Keep the verified 79 base parts intact, excluding only any vessels from prior expansion runs
const NEW_F_VESSEL_IDS = new Set([
  'HF_COMMON_ILIAC_VEIN_LEFT',
  'HF_COMMON_ILIAC_VEIN_RIGHT',
  'HF_INTERNAL_ILIAC_VEIN_LEFT',
  'HF_INTERNAL_ILIAC_VEIN_RIGHT',
  'HF_INTERNAL_PUDENDAL_VEIN_LEFT',
  'HF_INTERNAL_PUDENDAL_VEIN_RIGHT',
  'HF_MIDDLE_RECTAL_VEIN_LEFT',
  'HF_MIDDLE_RECTAL_VEIN_RIGHT',
  'HF_INFERIOR_RECTAL_VEIN_LEFT',
  'HF_INFERIOR_RECTAL_VEIN_RIGHT',
  'HF_MEDIAN_SACRAL_VEIN',
  'HF_SUPERIOR_RECTAL_VEIN',
  'HF_SUPERIOR_RECTAL_ARTERY',
]);

const femaleDefinitions = [];
for (const p of existingFemaleManifest.parts) {
  if (NEW_F_VESSEL_IDS.has(p.id)) continue;
  femaleDefinitions.push({
    prebuilt: {
      part: p,
      posBuf: existingFemaleBin.subarray(p.positions, p.positions + p.vertexCount * 3 * 4),
      normBuf: existingFemaleBin.subarray(p.normals, p.normals + p.vertexCount * 3 * 2),
      idxBuf: existingFemaleBin.subarray(p.indices, p.indices + p.indexCount * 4),
    },
  });
}

const HRA_F_VASC_SRC =
  'HuBMAP HRA v1.3 Visible Human Female Blood Vasculature (CC BY 4.0, 3d-vh-f-blood-vasculature)';

const FEMALE_PELVIC_VESSELS = [
  ['HF_COMMON_ILIAC_VEIN_LEFT', 'Female left common iliac vein', 'FMA21388', 'venous', 'VH_F_left_common_iliac_vein', 850],
  ['HF_COMMON_ILIAC_VEIN_RIGHT', 'Female right common iliac vein', 'FMA21387', 'venous', 'VH_F_right_common_iliac_vein', 700],
  ['HF_INTERNAL_ILIAC_VEIN_LEFT', 'Female left internal iliac vein', 'FMA18888', 'venous', 'VH_F_internal_iliac_vein_L', 450],
  ['HF_INTERNAL_ILIAC_VEIN_RIGHT', 'Female right internal iliac vein', 'FMA18887', 'venous', 'VH_F_internal_iliac_vein_R', 550],
  ['HF_INTERNAL_PUDENDAL_VEIN_LEFT', 'Female left internal pudendal vein', 'FMA18919', 'venous', 'VH_F_internal_pudendal_vein_L', 700],
  ['HF_INTERNAL_PUDENDAL_VEIN_RIGHT', 'Female right internal pudendal vein', 'FMA18918', 'venous', 'VH_F_internal_pudendal_vein_R', 750],
  ['HF_MIDDLE_RECTAL_VEIN_LEFT', 'Female left middle rectal vein', 'FMA18911_MRV', 'venous', 'VH_F_middle_rectal_vein_L', 650],
  ['HF_MIDDLE_RECTAL_VEIN_RIGHT', 'Female right middle rectal vein', 'FMA18910_MRV', 'venous', 'VH_F_middle_rectal_vein_R', 650],
  ['HF_INFERIOR_RECTAL_VEIN_LEFT', 'Female left inferior rectal vein', 'FMA18923', 'venous', 'VH_F_inferior_rectal_vein_L', 750],
  ['HF_INFERIOR_RECTAL_VEIN_RIGHT', 'Female right inferior rectal vein', 'FMA18922', 'venous', 'VH_F_inferior_rectal_vein_R', 750],
  ['HF_MEDIAN_SACRAL_VEIN', 'Female median sacral vein', 'FMA77168', 'venous', 'VH_F_median_sacral_vein', 800],
  ['HF_SUPERIOR_RECTAL_VEIN', 'Female superior rectal vein', 'FMA15393', 'venous', 'VH_F_superior_rectal_vein', 950],
  ['HF_SUPERIOR_RECTAL_ARTERY', 'Female superior rectal artery', 'FMA14832', 'arterial', 'VH_F_superior_rectal_artery', 850],
];

for (const [id, name, conceptId, system, nodeName, targetTris] of FEMALE_PELVIC_VESSELS) {
  femaleDefinitions.push({
    id,
    name,
    conceptId,
    system,
    source: HRA_F_VASC_SRC,
    geom: extractNodeMeshes('f_vasc.glb', pExact(nodeName), xformFPelvis),
    targetTris,
    minTris: 160,
  });
}

const femaleManifest = packDefinitionsToBinary(
  femaleDefinitions,
  existingFemaleDir,
  'female-0.bin',
  'female-atlas.json',
  {
    version: 'female-overlay-3.0',
    sex: 'female',
    source:
      'HuBMAP HRA Visible Human Female 3D Reference Library (CC BY 4.0: United Pelvis/Viscera v1.5 DOI:10.48539/HBM352.BTSQ.586, Mammary v1.1, Blood Vasculature v1.3) + 8 co-registered reconstructions',
    conceptsBuilder: (parts) => {
      const baseConcepts = existingFemaleManifest.concepts.filter(
        (c) => !c.elements.some((el) => NEW_F_VESSEL_IDS.has(el)),
      );
      const added = parts
        .filter((p) => NEW_F_VESSEL_IDS.has(p.id))
        .map((p) => ({
          id: p.conceptId,
          name: p.name,
          elements: [p.id],
        }));
      return [...baseConcepts, ...added];
    },
  },
);

// ===========================================================================
// 4. OPTIONAL ADVANCED LAYER: FULL-TERM PLACENTA & UMBILICAL CORD (OFF by default)
// ===========================================================================
const HRA_PLACENTA_SRC =
  'HuBMAP HRA v1.1 Visible Human Female Full-Term Placenta (CC BY 4.0, 3d-vh-f-placenta-full-term)';

const placentaDefinitions = [
  {
    id: 'HO_PLACENTA_BASAL_PLATE',
    name: 'Placenta basal plate (maternal decidua basalis interface)',
    conceptId: 'FMA83051',
    system: 'reproductive',
    source: HRA_PLACENTA_SRC,
    geom: extractNodeMeshes('f_placenta.glb', pExact('VH_F_basal_plate'), xformFPelvis),
    targetTris: 1400,
    minTris: 350,
  },
  {
    id: 'HO_PLACENTA_CHORIONIC_PLATE',
    name: 'Placenta chorionic plate (fetal surface)',
    conceptId: 'FMA83052',
    system: 'reproductive',
    source: HRA_PLACENTA_SRC,
    geom: extractNodeMeshes('f_placenta.glb', pExact('VH_F_chorionic_plate'), xformFPelvis),
    targetTris: 1400,
    minTris: 350,
  },
  {
    id: 'HO_PLACENTA_VESSELS',
    name: 'Placental chorionic & villous vasculature',
    conceptId: 'FMA83053',
    system: 'arterial',
    source: HRA_PLACENTA_SRC,
    geom: extractNodeMeshes('f_placenta.glb', pExact('VH_F_placenta_vessels'), xformFPelvis),
    targetTris: 2600,
    minTris: 600,
  },
  {
    id: 'HO_PLACENTA_AMNION',
    name: 'Amniotic membrane (amnion)',
    conceptId: 'FMA63932',
    system: 'reproductive',
    source: HRA_PLACENTA_SRC,
    geom: extractNodeMeshes('f_placenta.glb', pExact('VH_F_amnion'), xformFPelvis),
    targetTris: 1200,
    minTris: 300,
  },
  {
    id: 'HO_UMBILICAL_CORD',
    name: 'Umbilical cord (Wharton jelly sheath)',
    conceptId: 'FMA63933',
    system: 'reproductive',
    source: HRA_PLACENTA_SRC,
    geom: extractNodeMeshes('f_placenta.glb', pExact('VH_F_umbilical_cord'), xformFPelvis),
    targetTris: 1600,
    minTris: 400,
  },
  {
    id: 'HO_UMBILICAL_ARTERY_1',
    name: 'First umbilical artery',
    conceptId: 'FMA18820',
    system: 'arterial',
    source: HRA_PLACENTA_SRC,
    geom: extractNodeMeshes('f_placenta.glb', pExact('VH_F_umbilical_artery_1'), xformFPelvis),
    targetTris: 900,
    minTris: 250,
  },
  {
    id: 'HO_UMBILICAL_ARTERY_2',
    name: 'Second umbilical artery',
    conceptId: 'FMA18821',
    system: 'arterial',
    source: HRA_PLACENTA_SRC,
    geom: extractNodeMeshes('f_placenta.glb', pExact('VH_F_umbilical_artery_2'), xformFPelvis),
    targetTris: 900,
    minTris: 250,
  },
  {
    id: 'HO_UMBILICAL_VEIN',
    name: 'Umbilical vein',
    conceptId: 'FMA18909_UMB',
    system: 'venous',
    source: HRA_PLACENTA_SRC,
    geom: extractNodeMeshes('f_placenta.glb', pExact('VH_F_umbilical_vein'), xformFPelvis),
    targetTris: 900,
    minTris: 250,
  },
];

const placentaManifest = packDefinitionsToBinary(
  placentaDefinitions,
  path.resolve('public/models/optional'),
  'pregnancy-0.bin',
  'pregnancy-placenta.json',
  {
    version: 'optional-pregnancy-placenta-1.0',
    sex: 'female',
    optionalLayer: 'pregnancy_placenta',
    source: HRA_PLACENTA_SRC,
    conceptsBuilder: (parts) =>
      parts.map((p) => ({
        id: p.conceptId,
        name: p.name,
        elements: [p.id],
      })),
  },
);

console.log('\n=== SUMMARY COUNTS ===');
console.log('Shared enhancements:', sharedManifest.parts.length, 'parts,', sharedManifest.triangles, 'tris');
console.log('Male enhancements:', maleManifest.parts.length, 'parts,', maleManifest.triangles, 'tris');
console.log('Female overlay:', femaleManifest.parts.length, 'parts,', femaleManifest.triangles, 'tris');
console.log('Optional pregnancy:', placentaManifest.parts.length, 'parts,', placentaManifest.triangles, 'tris');
