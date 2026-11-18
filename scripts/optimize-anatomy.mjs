import fs from 'node:fs';
import { MeshoptSimplifier } from 'meshoptimizer';

/**
 * Quality-Aware Non-Destructive Anatomy Mesh Optimization Pipeline
 *
 * Supports:
 *   node scripts/optimize-anatomy.mjs [atlas.json] [--lod=0|1|2|3] [--preserve-source]
 *
 * Policies:
 *   - LOD 0 (Master): lossless / ultra-high preservation (no aggressive decimation)
 *   - LOD 1 (High Study): structure-aware preservation (high error tolerance for cranial/brain/cardiac/vessels)
 *   - LOD 2 (Balanced Web): standard web balance with strict floor for small structures
 *   - LOD 3 (Mobile / Overview): lightweight interactive overview preserving silhouette & labels
 */

await MeshoptSimplifier.ready;

const args = process.argv.slice(2);
const name = args.find((a) => !a.startsWith('--')) ?? 'atlas.json';
const lodArg = args.find((a) => a.startsWith('--lod='))?.split('=')[1] ?? '2';
const lodLevel = Number.parseInt(lodArg, 10);
const preserveSource = args.includes('--preserve-source');

if (![0, 1, 2, 3].includes(lodLevel)) {
  throw new Error(`Invalid --lod=${lodArg}. Supported values: 0, 1, 2, 3.`);
}

const LOD_MULTIPLIER = {
  0: { ratioScale: 1.0, errorScale: 0.25 },
  1: { ratioScale: 0.72, errorScale: 0.6 },
  2: { ratioScale: 0.35, errorScale: 1.0 },
  3: { ratioScale: 0.18, errorScale: 1.5 },
}[lodLevel];

function resolvePartPolicy(part) {
  const n = (part.name ?? '').toLowerCase();
  if (
    part.system === 'cardiac' ||
    part.system === 'sensory' ||
    /gyrus|sulcus|cerebellum|hippocampus|amygdala|thalamus|brainstem|midbrain|pons|medulla|ventricle|skull|cranial|sphenoid|ethmoid|temporal bone|mandible|valve|coronary|cochlea|ossicle/i.test(n)
  ) {
    return { tier: 'very_high', minTri: 180, baseRatio: 0.65, maxError: 0.0008 };
  }
  if (
    part.system === 'arterial' ||
    part.system === 'venous' ||
    part.system === 'nervous' ||
    part.system === 'skeletal' ||
    part.system === 'muscular'
  ) {
    return { tier: 'high', minTri: 120, baseRatio: 0.45, maxError: 0.0014 };
  }
  return { tier: 'standard', minTri: 96, baseRatio: 0.28, maxError: 0.002 };
}

function validateGeometryBuffers(partId, positions, indices) {
  for (let i = 0; i < positions.length; i++) {
    if (!Number.isFinite(positions[i])) {
      throw new Error(`Non-finite vertex coordinate detected in part ${partId} at index ${i}`);
    }
  }
  if (indices.length % 3 !== 0) {
    throw new Error(`Non-triangular index buffer in part ${partId} (${indices.length} indices)`);
  }
}

const prefix = name.includes('female') ? 'female' : `body-lod${lodLevel}`;
const dir = new URL('../public/models/', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL(name, dir), 'utf8'));
const originals = manifest.chunks.map((c) => c.url.split('/').pop());

if (manifest.optimized && !preserveSource) {
  throw new Error('Already optimized. Re-run from unoptimized source or pass --preserve-source to emit an additive LOD output.');
}

const source = manifest.chunks.map((c) => fs.readFileSync(new URL(c.url.split('/').pop(), dir)));
const chunks = [];
let segments = [];
let bytes = 0;
let triangles = 0;
let maxError = 0;

const flush = () => {
  if (!bytes) return;
  const url = `/models/${prefix}-${chunks.length}.bin`;
  fs.writeFileSync(new URL(url.split('/').pop(), dir), Buffer.concat(segments));
  chunks.push({ url, bytes });
  segments = [];
  bytes = 0;
};

const append = (a) => {
  const padding = (4 - (bytes % 4)) % 4;
  if (padding) {
    segments.push(Buffer.alloc(padding));
    bytes += padding;
  }
  const offset = bytes;
  const b = Buffer.from(a.buffer, a.byteOffset, a.byteLength);
  segments.push(b);
  bytes += b.length;
  return offset;
};

for (const p of manifest.parts) {
  const b = source[p.chunk];
  let pos = new Float32Array(b.buffer, b.byteOffset + p.positions, p.vertexCount * 3);
  let normal = new Int16Array(b.buffer, b.byteOffset + p.normals, p.vertexCount * 3);
  let indices = new Uint32Array(b.buffer, b.byteOffset + p.indices, p.indexCount);
  validateGeometryBuffers(p.id, pos, indices);

  if (name.includes('female')) {
    const map = new Map();
    const remap = new Uint32Array(p.vertexCount);
    const wp = [];
    const wn = [];
    for (let i = 0; i < p.vertexCount; i++) {
      const k = `${pos[i * 3]},${pos[i * 3 + 1]},${pos[i * 3 + 2]}`;
      let index = map.get(k);
      if (index === undefined) {
        index = wp.length / 3;
        map.set(k, index);
        wp.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
        wn.push(0, 0, 0);
      }
      remap[i] = index;
      for (let a = 0; a < 3; a++) wn[index * 3 + a] += normal[i * 3 + a];
    }
    for (let i = 0; i < wn.length; i += 3) {
      const length = Math.hypot(wn[i], wn[i + 1], wn[i + 2]) || 1;
      for (let a = 0; a < 3; a++) wn[i + a] = Math.round((wn[i + a] / length) * 32767);
    }
    pos = new Float32Array(wp);
    normal = new Int16Array(wn);
    indices = Uint32Array.from(indices, (i) => remap[i]);
  }

  const policy = resolvePartPolicy(p);
  const currentTris = Math.floor(indices.length / 3);
  let finalPos = pos;
  let finalNormal = normal;
  let finalIndices = indices;

  if (lodLevel > 0 && currentTris > policy.minTri) {
    const effectiveRatio = Math.min(1, policy.baseRatio * LOD_MULTIPLIER.ratioScale);
    const targetIndices = Math.max(
      policy.minTri * 3,
      Math.floor((indices.length * effectiveRatio) / 3) * 3,
    );
    const allowedError = policy.maxError * LOD_MULTIPLIER.errorScale;
    const [simplified, error] = MeshoptSimplifier.simplify(
      indices,
      pos,
      3,
      Math.min(indices.length, targetIndices),
      allowedError,
    );
    maxError = Math.max(maxError, error);
    const [remap, count] = MeshoptSimplifier.compactMesh(simplified);
    const positions = new Float32Array(count * 3);
    const normals = new Int16Array(count * 3);
    for (let old = 0; old < remap.length; old++) {
      const n = remap[old];
      if (n === 0xffffffff) continue;
      positions.set(pos.subarray(old * 3, old * 3 + 3), n * 3);
      normals.set(normal.subarray(old * 3, old * 3 + 3), n * 3);
    }
    finalPos = positions;
    finalNormal = normals;
    finalIndices = simplified;
  }

  validateGeometryBuffers(p.id, finalPos, finalIndices);
  if (bytes > 4_000_000) flush();
  p.chunk = chunks.length;
  p.positions = append(finalPos);
  p.normals = append(finalNormal);
  p.indices = append(finalIndices);
  p.vertexCount = finalPos.length / 3;
  p.indexCount = finalIndices.length;
  triangles += finalIndices.length / 3;
}

flush();
manifest.sourceTriangles = manifest.sourceTriangles ?? manifest.triangles;
manifest.triangles = triangles;
manifest.chunks = chunks;
manifest.optimized = {
  method: 'meshoptimizer quality-aware quadric simplification',
  lodLevel,
  maximumRelativeError: Number(maxError.toFixed(6)),
  preservedMeshes: manifest.parts.length,
  preserveSource,
};

const outManifestName = preserveSource ? name.replace(/\.json$/i, `.lod${lodLevel}.json`) : name;
fs.writeFileSync(new URL(outManifestName, dir), JSON.stringify(manifest));

if (!preserveSource) {
  for (const orig of originals) {
    if (!chunks.some((c) => c.url.endsWith(`/${orig}`))) {
      fs.unlinkSync(new URL(orig, dir));
    }
  }
}

console.log(
  JSON.stringify({
    manifest: outManifestName,
    lodLevel,
    parts: manifest.parts.length,
    triangles,
    bytes: chunks.reduce((n, c) => n + c.bytes, 0),
    chunks: chunks.length,
    maxError,
    preserveSource,
  }),
);
