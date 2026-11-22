import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { MeshoptSimplifier } from 'meshoptimizer';

await MeshoptSimplifier.ready;

const TMP_DIR = '/tmp/hubmap';
const OUT_DIR = path.resolve('public/models/female');
fs.mkdirSync(OUT_DIR, { recursive: true });

// Co-registration from HuBMAP Visible Human Female CCF coordinates to BodyParts3D Y-up meters
const H_CENTER = [-0.0086, 0.0590, -0.0911];
const B_TARGET = [-0.0004, 0.9330, -0.0340];
const REG_SCALE = [0.95, 0.97, 0.84];

function xformPoint(x, y, z) {
  return [
    (x - H_CENTER[0]) * REG_SCALE[0] + B_TARGET[0],
    (y - H_CENTER[1]) * REG_SCALE[1] + B_TARGET[1],
    (z - H_CENTER[2]) * REG_SCALE[2] + B_TARGET[2],
  ];
}

function readGlb(filePath) {
  const buf = fs.readFileSync(filePath);
  const magic = buf.readUInt32LE(0);
  if (magic !== 0x46546c67) throw new Error(`Invalid GLB magic in ${filePath}`);
  const jsonLen = buf.readUInt32LE(12);
  const gltf = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
  const binOffset = 20 + jsonLen;
  const binLen = buf.readUInt32LE(binOffset);
  const bin = buf.subarray(binOffset + 8, binOffset + 8 + binLen);
  return { gltf, bin };
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

function readAccessorIndices(gltf, bin, accIdx) {
  const acc = gltf.accessors[accIdx];
  const bv = gltf.bufferViews[acc.bufferView];
  const baseOffset = (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  const out = new Uint32Array(acc.count);
  if (acc.componentType === 5123) {
    const stride = bv.byteStride || 2;
    for (let i = 0; i < acc.count; i++) {
      out[i] = bin.readUInt16LE(baseOffset + i * stride);
    }
  } else if (acc.componentType === 5125) {
    const stride = bv.byteStride || 4;
    for (let i = 0; i < acc.count; i++) {
      out[i] = bin.readUInt32LE(baseOffset + i * stride);
    }
  } else {
    throw new Error(`Unsupported index componentType ${acc.componentType}`);
  }
  return out;
}

function extractGlbMeshes(glbFile, meshNameFilter, transformFn = xformPoint) {
  const { gltf, bin } = readGlb(path.join(TMP_DIR, glbFile));
  const posList = [];
  const idxList = [];
  let vertOffset = 0;

  for (const mesh of gltf.meshes ?? []) {
    if (meshNameFilter && !meshNameFilter(mesh.name ?? '')) continue;
    for (const prim of mesh.primitives ?? []) {
      const posAccIdx = prim.attributes?.POSITION;
      const idxAccIdx = prim.indices;
      if (posAccIdx === undefined || idxAccIdx === undefined) continue;
      const rawPos = readAccessorPositions(gltf, bin, posAccIdx);
      const rawIdx = readAccessorIndices(gltf, bin, idxAccIdx);
      for (let i = 0; i < rawPos.length; i += 3) {
        const [tx, ty, tz] = transformFn(rawPos[i], rawPos[i + 1], rawPos[i + 2]);
        posList.push(tx, ty, tz);
      }
      for (let i = 0; i < rawIdx.length; i++) {
        idxList.push(rawIdx[i] + vertOffset);
      }
      vertOffset += rawPos.length / 3;
    }
  }
  if (posList.length === 0 || idxList.length === 0) {
    throw new Error(`No matching geometry extracted from ${glbFile}`);
  }
  return {
    positions: new Float32Array(posList),
    indices: new Uint32Array(idxList),
  };
}

function weldAndSimplify({ positions, indices }, targetTriangles, minTriangles = 180) {
  // Weld coincident vertices for smooth normals + clean meshopt simplification
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
    const [simplified] = MeshoptSimplifier.simplify(curIdx, curPos, 3, goal, 0.003);
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

  // Compute smooth vertex normals -> Int16Array normalized
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

  const cx = (bmin[0] + bmax[0]) * 0.5;
  const cy = (bmin[1] + bmax[1]) * 0.5;
  const cz = (bmin[2] + bmax[2]) * 0.5;
  let dotSum = 0;
  for (let i = 0; i < curPos.length; i += 3) {
    dotSum += (curPos[i] - cx) * normals[i] + (curPos[i + 1] - cy) * normals[i + 1] + (curPos[i + 2] - cz) * normals[i + 2];
  }
  if (dotSum < 0) {
    for (let i = 0; i < curIdx.length; i += 3) {
      const tmp = curIdx[i + 1];
      curIdx[i + 1] = curIdx[i + 2];
      curIdx[i + 2] = tmp;
    }
    for (let i = 0; i < normals.length; i++) {
      normals[i] = -normals[i];
    }
  }

  return { positions: curPos, normals, indices: curIdx, bounds: [bmin, bmax] };
}

function buildTubeMesh(points, radiusFn, radialSegments = 24, squashX = 1.0, squashZ = 1.0) {
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

    // Reference axis for frame
    let rx = 1, ry = 0, rz = 0;
    if (Math.abs(tx) > 0.9) { rx = 0; ry = 0; rz = 1; }
    // bitangent = normalize(T x R)
    let bx = ty * rz - tz * ry;
    let by = tz * rx - tx * rz;
    let bz = tx * ry - ty * rx;
    const bLen = Math.hypot(bx, by, bz) || 1;
    bx /= bLen; by /= bLen; bz /= bLen;
    // normal = B x T
    const nx = by * tz - bz * ty;
    const ny = bz * tx - bx * tz;
    const nz = bx * ty - by * tx;

    const rad = radiusFn(r / (rings - 1));
    for (let s = 0; s < radialSegments; s++) {
      const ang = (s / radialSegments) * Math.PI * 2;
      const ca = Math.cos(ang) * rad * squashX;
      const sa = Math.sin(ang) * rad * squashZ;
      pos.push(
        p[0] + nx * ca + bx * sa,
        p[1] + ny * ca + by * sa,
        p[2] + nz * ca + bz * sa,
      );
    }
  }

  // Bottom and top center vertices to cap cleanly
  const firstCenterIdx = rings * radialSegments;
  pos.push(...points[0]);
  const lastCenterIdx = firstCenterIdx + 1;
  pos.push(...points[rings - 1]);

  for (let r = 0; r < rings - 1; r++) {
    for (let s = 0; s < radialSegments; s++) {
      const sNext = (s + 1) % radialSegments;
      const a = r * radialSegments + s;
      const b = r * radialSegments + sNext;
      const c = (r + 1) * radialSegments + s;
      const d = (r + 1) * radialSegments + sNext;
      idx.push(a, c, b, b, c, d);
    }
  }
  for (let s = 0; s < radialSegments; s++) {
    const sNext = (s + 1) % radialSegments;
    idx.push(firstCenterIdx, s, sNext);
    const lastRing = (rings - 1) * radialSegments;
    idx.push(lastCenterIdx, lastRing + sNext, lastRing + s);
  }

  return { positions: new Float32Array(pos), indices: new Uint32Array(idx) };
}

function buildMammaryMesh(sideSign) {
  // sideSign: +1 = Anatomical Left (+X), -1 = Anatomical Right (-X)
  // Chest seat anchored directly to sternum/pectoralis major anterior surface (y = 1.21..1.34, z = 0.095..0.118)
  const cx = sideSign * 0.092;
  const cy = 1.270;
  const cz = 0.098;
  const uSegs = 28;
  const vSegs = 22;
  const pos = [];
  const idx = [];

  for (let iv = 0; iv <= vSegs; iv++) {
    const v = iv / vSegs; // 0 = base against chest wall, 1 = nipple apex
    for (let iu = 0; iu <= uSegs; iu++) {
      const u = (iu / uSegs) * Math.PI * 2;
      const cu = Math.cos(u);
      const su = Math.sin(u);
      // Natural teardrop anatomical slope: fuller inferior-lateral lobe, tapering smoothly superiorly
      const radialT = Math.cos(v * Math.PI * 0.5);
      const lobularMod = 1 + 0.032 * Math.cos(u * 7 + v * 2.2) * Math.sin(v * Math.PI);
      const rx = 0.056 * radialT * lobularMod;
      const ry = (su < 0 ? 0.064 : 0.056) * radialT * lobularMod;

      let localX = cu * rx + sideSign * 0.008 * Math.sin(v * Math.PI);
      // Slight natural lateral-inferior sag of mammary corpus
      let localY = su * ry - 0.014 * Math.pow(Math.sin(v * Math.PI * 0.5), 1.4);
      // Anterior projection + subtle areolar/nipple landmark near apex v > 0.85
      let localZ = 0.056 * Math.sin(v * Math.PI * 0.5);
      if (v > 0.86) {
        const nipT = (v - 0.86) / 0.14;
        localZ += 0.008 * Math.sin(nipT * Math.PI * 0.5);
        localX *= 0.82;
        localY *= 0.82;
      }
      // Subtle ribcage posterior curvature wrap
      localZ -= 0.010 * Math.pow(cu, 2) * (1 - v);

      pos.push(cx + localX, cy + localY, cz + localZ);
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

// 1. Extract & simplify real HuBMAP CC BY 4.0 GLBs
const rawDefinitions = [
  {
    id: 'HF_SACRUM',
    name: 'Female sacrum & coccyx',
    conceptId: 'FMA16202',
    system: 'skeletal',
    source: 'HuBMAP HRA v2.x Visible Human Female Pelvis (CC BY 4.0)',
    geom: extractGlbMeshes('pelvis.glb', (n) => /sacrum|coccyx/i.test(n)),
    targetTris: 2600,
    minTris: 600,
  },
  {
    id: 'HF_HIP_LEFT',
    name: 'Left female hip bone (pelvis)',
    conceptId: 'FMA16586',
    system: 'skeletal',
    source: 'HuBMAP HRA v2.x Visible Human Female Pelvis (CC BY 4.0)',
    geom: extractGlbMeshes('pelvis.glb', (n) => /compact_bone_L/i.test(n)),
    targetTris: 2800,
    minTris: 700,
  },
  {
    id: 'HF_HIP_RIGHT',
    name: 'Right female hip bone (pelvis)',
    conceptId: 'FMA16585',
    system: 'skeletal',
    source: 'HuBMAP HRA v2.x Visible Human Female Pelvis (CC BY 4.0)',
    geom: extractGlbMeshes('pelvis.glb', (n) => /compact_bone_R/i.test(n)),
    targetTris: 2800,
    minTris: 700,
  },
  {
    id: 'HF_BLADDER',
    name: 'Female urinary bladder',
    conceptId: 'FMA15900',
    system: 'urinary',
    source: 'HuBMAP HRA v2.x Visible Human Female Urinary Bladder (CC BY 4.0)',
    geom: extractGlbMeshes('bladder.glb', (n) => !/ureteral_orifice/i.test(n)),
    targetTris: 2200,
    minTris: 500,
  },
  {
    id: 'HF_UTERUS',
    name: 'Uterus (Fundus & Body)',
    conceptId: 'FMA17558',
    system: 'reproductive',
    source: 'HuBMAP HRA v2.x Visible Human Female Uterus (CC BY 4.0)',
    geom: extractGlbMeshes('uterus.glb', (n) => !/cervix|cervicovaginal|cervical_os/i.test(n)),
    targetTris: 2400,
    minTris: 600,
  },
  {
    id: 'HF_CERVIX',
    name: 'Cervix of uterus',
    conceptId: 'FMA17740',
    system: 'reproductive',
    source: 'HuBMAP HRA v2.x Visible Human Female Uterus (CC BY 4.0)',
    geom: extractGlbMeshes('uterus.glb', (n) => /cervix|cervicovaginal|cervical_os/i.test(n)),
    targetTris: 1200,
    minTris: 350,
  },
  {
    id: 'HF_TUBE_LEFT',
    name: 'Left uterine tube (Fallopian tube)',
    conceptId: 'FMA18246',
    system: 'reproductive',
    source: 'HuBMAP HRA v2.x Visible Human Female Fallopian Tube (CC BY 4.0)',
    geom: extractGlbMeshes('tube_l.glb'),
    targetTris: 1400,
    minTris: 400,
  },
  {
    id: 'HF_TUBE_RIGHT',
    name: 'Right uterine tube (Fallopian tube)',
    conceptId: 'FMA18245',
    system: 'reproductive',
    source: 'HuBMAP HRA v2.x Visible Human Female Fallopian Tube (CC BY 4.0)',
    geom: extractGlbMeshes('tube_r.glb'),
    targetTris: 1400,
    minTris: 400,
  },
  {
    id: 'HF_OVARY_LEFT',
    name: 'Left ovary',
    conceptId: 'FMA7214',
    system: 'reproductive',
    source: 'HuBMAP HRA v2.x Visible Human Female Ovary (CC BY 4.0)',
    geom: extractGlbMeshes('ovary_l.glb'),
    targetTris: 400,
    minTris: 180,
  },
  {
    id: 'HF_OVARY_RIGHT',
    name: 'Right ovary',
    conceptId: 'FMA7213',
    system: 'reproductive',
    source: 'HuBMAP HRA v2.x Visible Human Female Ovary (CC BY 4.0)',
    geom: extractGlbMeshes('ovary_r.glb'),
    targetTris: 400,
    minTris: 180,
  },
];

// Derive exact cervix & bladder base anchor coordinates from the transformed HuBMAP meshes
function computeGeomCenter(geom) {
  let sx = 0, sy = 0, sz = 0;
  const n = geom.positions.length / 3;
  for (let i = 0; i < geom.positions.length; i += 3) {
    sx += geom.positions[i];
    sy += geom.positions[i + 1];
    sz += geom.positions[i + 2];
  }
  return [sx / n, sy / n, sz / n];
}

const cervixDef = rawDefinitions.find((d) => d.id === 'HF_CERVIX');
const bladderDef = rawDefinitions.find((d) => d.id === 'HF_BLADDER');
const cervixCenter = computeGeomCenter(cervixDef.geom);
const bladderCenter = computeGeomCenter(bladderDef.geom);

// Contoured vaginal canal descending anteriorly-inferiorly from cervix external os between bladder & rectum
const vaginaPts = [];
for (let i = 0; i <= 12; i++) {
  const t = i / 12;
  vaginaPts.push([
    cervixCenter[0] * (1 - t * 0.7),
    cervixCenter[1] - t * 0.088,
    cervixCenter[2] + t * 0.042 + Math.sin(t * Math.PI) * 0.004,
  ]);
}
rawDefinitions.push({
  id: 'HF_VAGINA',
  name: 'Vagina',
  conceptId: 'FMA19949',
  system: 'reproductive',
  source: 'Anatomically co-registered fibromuscular reconstruction anchored to HuBMAP cervix',
  geom: buildTubeMesh(
    vaginaPts,
    (t) => (t < 0.2 ? 0.0175 - (0.2 - t) * 0.012 : 0.0175 - t * 0.004),
    24,
    0.85,
    1.15,
  ),
  targetTris: 800,
  minTris: 250,
});

// Female urethra (~3.8 cm) descending anterior to vagina from inferior bladder neck
const urethraPts = [
  [bladderCenter[0], bladderCenter[1] - 0.018, bladderCenter[2] + 0.004],
  [bladderCenter[0] * 0.7, bladderCenter[1] - 0.036, bladderCenter[2] + 0.011],
  [bladderCenter[0] * 0.35, bladderCenter[1] - 0.056, bladderCenter[2] + 0.018],
];
rawDefinitions.push({
  id: 'HF_URETHRA',
  name: 'Female urethra',
  conceptId: 'FMA19667',
  system: 'urinary',
  source: 'Anatomically co-registered urethral reconstruction anchored to HuBMAP female bladder neck',
  geom: buildTubeMesh(urethraPts, () => 0.0046, 16, 1.0, 1.0),
  targetTris: 300,
  minTris: 120,
});

// Bilateral mammary glands anchored directly over thoracic pectoralis major fascia
rawDefinitions.push(
  {
    id: 'HF_MAMMARY_LEFT',
    name: 'Left mammary gland',
    conceptId: 'FMA57991',
    system: 'reproductive',
    source: 'Anatomically proportioned thoracic mammary reconstruction over pectoralis major',
    geom: buildMammaryMesh(1),
    targetTris: 1200,
    minTris: 400,
  },
  {
    id: 'HF_MAMMARY_RIGHT',
    name: 'Right mammary gland',
    conceptId: 'FMA57990',
    system: 'reproductive',
    source: 'Anatomically proportioned thoracic mammary reconstruction over pectoralis major',
    geom: buildMammaryMesh(-1),
    targetTris: 1200,
    minTris: 400,
  },
);

// Pack binary buffers
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
for (const def of rawDefinitions) {
  const processed = weldAndSimplify(def.geom, def.targetTris, def.minTris);
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

const concepts = [
  { id: 'FMA16202', name: 'Female sacrum & coccyx', elements: ['HF_SACRUM'] },
  { id: 'FMA16586', name: 'Left female hip bone (pelvis)', elements: ['HF_HIP_LEFT'] },
  { id: 'FMA16585', name: 'Right female hip bone (pelvis)', elements: ['HF_HIP_RIGHT'] },
  { id: 'FMA15900', name: 'Female urinary bladder', elements: ['HF_BLADDER'] },
  { id: 'FMA19667', name: 'Female urethra', elements: ['HF_URETHRA'] },
  { id: 'FMA17558', name: 'Uterus', elements: ['HF_UTERUS', 'HF_CERVIX'] },
  { id: 'FMA17740', name: 'Cervix of uterus', elements: ['HF_CERVIX'] },
  { id: 'FMA18246', name: 'Left uterine tube (Fallopian tube)', elements: ['HF_TUBE_LEFT'] },
  { id: 'FMA18245', name: 'Right uterine tube (Fallopian tube)', elements: ['HF_TUBE_RIGHT'] },
  { id: 'FMA7214', name: 'Left ovary', elements: ['HF_OVARY_LEFT'] },
  { id: 'FMA7213', name: 'Right ovary', elements: ['HF_OVARY_RIGHT'] },
  { id: 'FMA7209', name: 'Ovary (bilateral)', elements: ['HF_OVARY_LEFT', 'HF_OVARY_RIGHT'] },
  { id: 'FMA19949', name: 'Vagina', elements: ['HF_VAGINA'] },
  { id: 'FMA57991', name: 'Left mammary gland', elements: ['HF_MAMMARY_LEFT'] },
  { id: 'FMA57990', name: 'Right mammary gland', elements: ['HF_MAMMARY_RIGHT'] },
  { id: 'FMA9601', name: 'Mammary glands (bilateral)', elements: ['HF_MAMMARY_LEFT', 'HF_MAMMARY_RIGHT'] },
];

const manifest = {
  version: 'female-overlay-1.0',
  sex: 'female',
  source: 'HuBMAP HRA v2.x Visible Human Female (CC BY 4.0) + co-registered anatomical reconstructions',
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
  `Built female anatomical overlay pack: ${parts.length} parts, ${concepts.length} concepts, ${totalTriangles.toLocaleString()} tris | raw=${(binBuffer.length / 1024).toFixed(1)}KB | gz=${(gzBuffer.length / 1024).toFixed(1)}KB`,
);
for (const p of parts) {
  console.log(
    `  ${p.id.padEnd(16)} | ${(p.indexCount / 3).toString().padStart(4)} tris | min=${p.bounds[0].map((n) => n.toFixed(3)).join(',')} max=${p.bounds[1].map((n) => n.toFixed(3)).join(',')}`,
  );
}
