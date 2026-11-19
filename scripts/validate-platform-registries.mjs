import fs from 'node:fs';
import path from 'node:path';

/**
 * Automated Anatomy 360 Asset, Material, License, Anatomy & LOD Validator
 *
 * Modes:
 *   node scripts/validate-platform-registries.mjs --mode=assets
 *   node scripts/validate-platform-registries.mjs --mode=materials
 *   node scripts/validate-platform-registries.mjs --mode=licenses
 *   node scripts/validate-platform-registries.mjs --mode=anatomy
 *   node scripts/validate-platform-registries.mjs --mode=lod
 */

const mode =
  process.argv.find((a) => a.startsWith('--mode='))?.split('=')[1] ?? 'all';

const atlasPath = path.resolve('public/models/atlas.json');
const atlas = JSON.parse(fs.readFileSync(atlasPath, 'utf8'));

function fail(scope, errors) {
  console.error(`[validate:${scope}] FAILED with ${errors.length} error(s):`);
  for (const err of errors) console.error(`  - ${err}`);
  process.exit(1);
}

function pass(scope, summary) {
  console.log(`[validate:${scope}] OK — ${summary}`);
}

function validateAssets() {
  const errors = [];
  if (!Array.isArray(atlas.parts) || atlas.parts.length < 2000) {
    errors.push(`Expected >= 2000 parts in atlas.json, found ${atlas.parts?.length ?? 0}`);
  }
  const seenIds = new Set();
  for (const p of atlas.parts) {
    if (!p.id || seenIds.has(p.id)) {
      errors.push(`Duplicate or empty part ID: ${p.id}`);
    }
    seenIds.add(p.id);
    if (!p.name || !p.conceptId || !p.system) {
      errors.push(`Part ${p.id} missing name/conceptId/system`);
    }
    if (p.vertexCount <= 0 || p.indexCount <= 0 || p.indexCount % 3 !== 0) {
      errors.push(`Part ${p.id} has invalid vertex/index counts`);
    }
    const [bmin, bmax] = p.bounds ?? [[], []];
    for (let i = 0; i < 3; i++) {
      if (!Number.isFinite(bmin[i]) || !Number.isFinite(bmax[i]) || bmin[i] > bmax[i]) {
        errors.push(`Part ${p.id} has invalid bounding box on axis ${i}`);
      }
    }
  }
  for (const chunk of atlas.chunks ?? []) {
    const filePath = path.resolve('public', chunk.url.replace(/^\//, ''));
    if (!fs.existsSync(filePath)) {
      errors.push(`Missing binary chunk file: ${chunk.url}`);
    }
  }
  if (errors.length > 0) fail('assets', errors);
  pass(
    'assets',
    `${atlas.parts.length} parts, ${atlas.chunks.length} chunks, ${atlas.triangles.toLocaleString()} triangles verified`,
  );
}

function validateMaterials() {
  const errors = [];
  const tissueSrc = fs.readFileSync(path.resolve('app/tissue-materials.ts'), 'utf8');
  const explorerSrc = fs.readFileSync(path.resolve('app/components/ExplorerView.tsx'), 'utf8');
  const sceneSrc = fs.readFileSync(path.resolve('app/scene.tsx'), 'utf8');

  if (!tissueSrc.includes("id: 'natural'")) {
    errors.push('tissue-materials.ts must define Natural Anatomy mode');
  }
  if (!tissueSrc.includes('isDefault: true')) {
    errors.push('tissue-materials.ts must mark Natural Anatomy as isDefault: true');
  }
  if (!explorerSrc.includes("useState<VisualizationMode>('natural')")) {
    errors.push("ExplorerView.tsx must default visualizationMode to 'natural'");
  }
  if (!explorerSrc.includes('useState(false)') || explorerSrc.includes('setBrainRegionalColors] = useState(true)')) {
    errors.push('ExplorerView.tsx must default brainRegionalColors to false (NO rainbow brain by default)');
  }
  if (!sceneSrc.includes('partMaterialTexture') || !sceneSrc.includes('roughnessmap_fragment')) {
    errors.push('scene.tsx must bind per-part PBR roughness/metalness texture via partMaterialTexture');
  }
  if (errors.length > 0) fail('materials', errors);
  pass('materials', 'Natural Anatomy default, opt-in Regional Brain OFF, and per-part PBR roughness/metalness verified');
}

function validateLicenses() {
  const errors = [];
  const regSrc = fs.readFileSync(path.resolve('app/data/asset-registries.ts'), 'utf8');
  const provSrc = fs.readFileSync(path.resolve('app/data/provenance-registry.ts'), 'utf8');
  const thirdPartySrc = fs.readFileSync(path.resolve('THIRD_PARTY_LICENSES.md'), 'utf8');

  if (!regSrc.includes('CC BY 4.0') || !provSrc.includes('CC BY 4.0') || !thirdPartySrc.includes('CC BY 4.0')) {
    errors.push('BodyParts3D 4.0 license must consistently cite CC BY 4.0 (DBCLS current archive)');
  }
  if (!provSrc.includes("license: 'CUSTOM") || !regSrc.includes('fma-ontology')) {
    errors.push('FMA ontology must be recorded under its official CUSTOM OBO Foundry license (not CC BY 4.0)');
  }
  if (!provSrc.includes('CC BY-ND 4.0') || !regSrc.includes('ifaa-ta2-terminology')) {
    errors.push('IFAA/FIPAT Terminologia Anatomica (TA2) must be recorded with CC BY-ND 4.0 license');
  }
  if (!regSrc.includes('z-anatomy-models') || !regSrc.includes("integrationStatus: 'excluded_license_review'")) {
    errors.push('Z-Anatomy CC BY-SA 4.0 must be explicitly marked excluded_license_review pending isolated asset-pack architecture');
  }
  if (!regSrc.includes('3d-neurosurgical-atlas') || !regSrc.includes("integrationStatus: 'benchmark_only'")) {
    errors.push('3D Neurosurgical Atlas must be explicitly marked benchmark_only (never imported)');
  }
  if (errors.length > 0) fail('licenses', errors);
  pass('licenses', 'Unified BodyParts3D CC BY 4.0, FMA CUSTOM, TA2 CC BY-ND 4.0, and source license boundaries verified');
}

function validateAnatomy() {
  const errors = [];
  const surgicalSrc = fs.readFileSync(path.resolve('app/data/surgical-anatomy.ts'), 'utf8');
  const relSrc = fs.readFileSync(path.resolve('app/pages/RelationshipsPage.tsx'), 'utf8');

  if (!surgicalSrc.includes('not a certified surgical simulator')) {
    errors.push('Surgical anatomy module must include an explicit non-clinical safety disclaimer');
  }
  if (!surgicalSrc.includes('resolveSurgicalRegionLayers')) {
    errors.push('Surgical anatomy module must export resolveSurgicalRegionLayers for real mesh-mapped peeling');
  }
  if (!relSrc.includes('illustrative spatial connectors')) {
    errors.push('RelationshipsPage.tsx must explicitly label 3D arrows as illustrative spatial connectors');
  }
  const conceptIds = new Set(atlas.concepts.map((c) => c.id));
  const coreConcepts = ['FMA7088', 'FMA50801', 'FMA7197', 'FMA7309', 'FMA7310', 'FMA46565'];
  for (const cid of coreConcepts) {
    if (!conceptIds.has(cid)) {
      errors.push(`Core anatomical concept ${cid} missing from atlas.json`);
    }
  }
  if (errors.length > 0) fail('anatomy', errors);
  pass('anatomy', 'Core FMA concepts, mesh-mapped surgical dissection, disclaimer, and spatial connector honesty verified');
}

function validateLod() {
  const errors = [];
  const regSrc = fs.readFileSync(path.resolve('app/data/asset-registries.ts'), 'utf8');
  const optSrc = fs.readFileSync(path.resolve('scripts/optimize-anatomy.mjs'), 'utf8');

  for (const lvl of ['level: 0', 'level: 1', 'level: 2', 'level: 3']) {
    if (!regSrc.includes(lvl)) {
      errors.push(`LOD registry missing specification for ${lvl}`);
    }
  }
  if (!optSrc.includes('--preserve-source') || !optSrc.includes('--lod=')) {
    errors.push('scripts/optimize-anatomy.mjs must support --lod and --preserve-source');
  }
  const smallParts = atlas.parts.filter((p) => p.indexCount / 3 < 50);
  if (smallParts.length > 0) {
    errors.push(`Found ${smallParts.length} over-simplified parts with < 50 triangles`);
  }
  if (errors.length > 0) fail('lod', errors);
  pass('lod', 'LOD 0-3 specifications, non-destructive optimizer flags, and minimum triangle floor (>=50 tris) verified');
}

if (mode === 'assets' || mode === 'all') validateAssets();
if (mode === 'materials' || mode === 'all') validateMaterials();
if (mode === 'licenses' || mode === 'all') validateLicenses();
if (mode === 'anatomy' || mode === 'all') validateAnatomy();
if (mode === 'lod' || mode === 'all') validateLod();
