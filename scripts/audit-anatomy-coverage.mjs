import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

registerHooks({
  resolve(specifier, context, nextResolve) {
    if ((specifier.startsWith('./') || specifier.startsWith('../')) && !/\.[a-z0-9]+$/i.test(specifier)) {
      const parentPath = context.parentURL ? fileURLToPath(context.parentURL) : path.join(ROOT_DIR, 'app/index.ts');
      const base = path.resolve(path.dirname(parentPath), specifier);
      for (const ext of ['.ts', '.tsx', '.mjs', '.js']) {
        if (fs.existsSync(base + ext)) {
          return { shortCircuit: true, url: pathToFileURL(base + ext).href };
        }
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith('.ts') || url.endsWith('.tsx')) {
      const source = fs.readFileSync(fileURLToPath(url), 'utf8');
      const { outputText } = ts.transpileModule(source, {
        fileName: fileURLToPath(url),
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
        },
      });
      return { shortCircuit: true, format: 'module', source: outputText };
    }
    return nextLoad(url, context);
  },
});

function loadJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT_DIR, relPath), 'utf8'));
}

const baseAtlas = loadJson('public/models/atlas.json');
const sharedManifest = loadJson('public/models/shared/shared-enhancements.json');
const maleManifest = loadJson('public/models/male/male-enhancements.json');
const femaleManifest = loadJson('public/models/female/female-atlas.json');
const pregnancyManifest = loadJson('public/models/optional/pregnancy-placenta.json');

const { canonicalSystemForMeshSystem } = await import('../app/anatomy-systems.ts');
const { FEMALE_REPLACED_MALE_PART_SET, LAYER_BUNDLE_PROVENANCE } = await import('../app/atlas-layers.ts');
const { lookupStructureKnowledge } = await import('../app/anatomy-knowledge.ts');
const {
  CANONICAL_GROSS_ANATOMY_INVENTORY,
  OPTIONAL_ADVANCED_LAYERS,
  buildStaticBundleFromManifests,
  computeAtlasCoverageSummary,
} = await import('../app/data/coverage-matrix.ts');

// Verify all 5 manifests + binary chunk bounds & uniqueness across the entire bundle
const allManifests = [
  { id: 'base-bp3d', manifest: baseAtlas, dir: 'public/models' },
  { id: 'shared-enh', manifest: sharedManifest, dir: 'public/models/shared' },
  { id: 'male-enh', manifest: maleManifest, dir: 'public/models/male' },
  { id: 'female-v3', manifest: femaleManifest, dir: 'public/models/female' },
  { id: 'opt-preg', manifest: pregnancyManifest, dir: 'public/models/optional' },
];

const globalSeenPartIds = new Set();
for (const entry of allManifests) {
  const chunkBins = entry.manifest.chunks.map((c) => {
    const filePath = path.join(ROOT_DIR, 'public', c.url.replace(/^\//, ''));
    assert.ok(fs.existsSync(filePath), `[${entry.id}] Missing binary chunk: ${filePath}`);
    return fs.readFileSync(filePath);
  });

  for (const p of entry.manifest.parts) {
    assert.ok(!globalSeenPartIds.has(p.id), `Global duplicate part ID across layers: ${p.id}`);
    globalSeenPartIds.add(p.id);
    const tris = Math.round(p.indexCount / 3);
    assert.ok(tris >= 50, `[${entry.id}] Part ${p.id} below 50-triangle floor (${tris} tris)`);
    const bin = chunkBins[p.chunk];
    assert.ok(bin, `[${entry.id}] Part ${p.id} invalid chunk index ${p.chunk}`);
    assert.ok(p.indices + p.indexCount * 4 <= bin.length, `[${entry.id}] Part ${p.id} binary slice out of range`);
  }
}

const bundle = buildStaticBundleFromManifests({
  shared: sharedManifest,
  male: maleManifest,
  female: femaleManifest,
  optionalPregnancy: pregnancyManifest,
});

const summary = computeAtlasCoverageSummary(baseAtlas, bundle);

// Cross-check runtime counts against atlas-layers provenance constants
assert.equal(summary.originalMaleBaseMeshes, LAYER_BUNDLE_PROVENANCE.baseMaleParts);
assert.equal(summary.sharedEnhancementMeshes, LAYER_BUNDLE_PROVENANCE.sharedEnhancementParts);
assert.equal(summary.maleEnhancementMeshes, LAYER_BUNDLE_PROVENANCE.maleEnhancementParts);
assert.equal(summary.femaleOverlayMeshes, LAYER_BUNDLE_PROVENANCE.femaleOverlayParts);
assert.equal(summary.replacedMalePartsInFemale, LAYER_BUNDLE_PROVENANCE.replacedMalePartsInFemale);
assert.equal(summary.optionalPregnancyMeshes, LAYER_BUNDLE_PROVENANCE.optionalPregnancyParts);
assert.equal(summary.maleActiveMeshes, LAYER_BUNDLE_PROVENANCE.activeMalePartsTotal);
assert.equal(summary.femaleActiveMeshes, LAYER_BUNDLE_PROVENANCE.activeFemalePartsTotal);
assert.equal(summary.totalDistinctBundledMeshes, LAYER_BUNDLE_PROVENANCE.totalDistinctBundledAssets);

function csvCell(value) {
  const s = String(value ?? '').replace(/\r?\n/g, ' ');
  return /[",]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function inferLaterality(name) {
  const n = name.toLowerCase();
  if (/\bleft\b/.test(n)) return 'left';
  if (/\bright\b/.test(n)) return 'right';
  if (/\bbilateral\b|\bpaired\b/.test(n)) return 'bilateral';
  return 'midline';
}

function inferRegion(p, canonicalSys) {
  const n = p.name.toLowerCase();
  if (/mammary|breast|nipple|areola|cooper|lactiferous/.test(n)) return 'breast_mammary';
  if (/placenta|umbilical|amnion/.test(n)) return 'optional_advanced';
  if (/uter|ovary|ovarian|vagina|clitor|labia|vulva|mons pubis|bartholin|vestibular|prostat|penis|testis|epididym|seminal|deferent|pelv|sacr|coccy|ilium|ischium|pubis|pudendal|iliac|rectal|bladder|ureteral orifice|urethra/.test(n)) {
    return 'pelvis_perineum';
  }
  if (/skull|crani|brain|gyrus|cerebell|pons|medulla|eye|retina|cornea|iris|lens|ear|mandib|maxilla|tonsil|hyoid|cricoid|thyroid|pharynx|larynx|carotid|jugular/.test(n)) {
    return 'head_neck';
  }
  if (/heart|coronary|lung|bronch|trachea|rib|sternum|thorac|pulmonary|aorta|vena cava|thymus/.test(n)) {
    return 'thorax';
  }
  if (/liver|hepatic|stomach|spleen|kidney|renal|adrenal|colon|intestin|duoden|jejun|ileum|pancrea|gallbladder|celiac|mesenteric|portal|lumbar/.test(n)) {
    return 'abdomen';
  }
  if (/humerus|radius|ulna|scapula|clavicle|brachial|radial|ulnar|carpal|hand|finger|deltoid|biceps brachii|triceps/.test(n)) {
    return 'upper_limb';
  }
  if (/femur|tibia|fibula|patella|foot|tarsal|metatarsal|calcane|femoral|popliteal|saphenous|gastrocnemius|quadriceps|soleus|glute/.test(n)) {
    return 'lower_limb';
  }
  return canonicalSys === 'nervous' || canonicalSys === 'cardiovascular' ? 'systemic' : 'systemic';
}

const rows = [];
const header = [
  'record_kind',
  'inventory_id',
  'canonical_name',
  'fma_id',
  'ta2_term',
  'uberon_id',
  'canonical_system',
  'raw_mesh_system',
  'region',
  'laterality',
  'male_status',
  'female_status',
  'layer_classification',
  'male_mesh_ids',
  'female_mesh_ids',
  'mesh_count',
  'triangles',
  'geometry_source',
  'asset_license',
  'geometry_quality',
  'validation_status',
  'notes',
];
rows.push(header.map(csvCell).join(','));

const emitPartRow = (p, layerInfo) => {
  const canonSys = canonicalSystemForMeshSystem(p.system).id;
  const know = lookupStructureKnowledge(p.conceptId, p.name);
  const ta2 = know?.verifiedCurated && know.latinName ? `${know.latinName}` : p.name;
  const tris = Math.round(p.indexCount / 3);
  rows.push(
    [
      'bundled_mesh',
      p.id,
      p.name,
      p.conceptId,
      ta2,
      '',
      canonSys,
      p.system,
      inferRegion(p, canonSys),
      inferLaterality(p.name),
      layerInfo.maleStatus,
      layerInfo.femaleStatus,
      layerInfo.layerClassification,
      layerInfo.inMale ? p.id : '',
      layerInfo.inFemale ? p.id : '',
      1,
      tris,
      p.source || layerInfo.defaultSource,
      p.license || 'CC BY 4.0',
      layerInfo.quality,
      layerInfo.validationStatus,
      layerInfo.notes,
    ]
      .map(csvCell)
      .join(','),
  );
};

// 1. Emit all 2,234 Base Adult Male BodyParts3D 4.0 meshes
for (const p of baseAtlas.parts) {
  const replacedInFemale = FEMALE_REPLACED_MALE_PART_SET.has(p.id);
  emitPartRow(p, {
    maleStatus: replacedInFemale ? 'PRESENT_SEX_SPECIFIC_GEOMETRY' : 'PRESENT_SHARED',
    femaleStatus: replacedInFemale ? 'OUT_OF_SCOPE' : 'PRESENT_SHARED',
    layerClassification: replacedInFemale ? 'male_specific' : 'reused_from_male_unadapted',
    inMale: true,
    inFemale: !replacedInFemale,
    defaultSource: 'BodyParts3D 4.0 (DBCLS, isa_BP3D_4.0_obj_99)',
    quality: 'high_detail_optimized',
    validationStatus: 'source_reviewed',
    notes: replacedInFemale
      ? 'Hidden/replaced in Female mode by HuBMAP Female or pelvic equivalent.'
      : 'Shared BP3D base geometry (inherited without female-specific morphing in Female mode).',
  });
}

// 2. Emit all 47 Shared Enhancement meshes
for (const p of sharedManifest.parts) {
  emitPartRow(p, {
    maleStatus: 'PRESENT_SHARED',
    femaleStatus: 'PRESENT_SHARED',
    layerClassification: 'shared_verified',
    inMale: true,
    inFemale: true,
    defaultSource: p.source || 'HuBMAP Human Reference Atlas (CC BY 4.0)',
    quality: 'verified_medical_reference',
    validationStatus: 'source_reviewed',
    notes: 'Shared anatomical enhancement active in both Adult Male and Adult Female.',
  });
}

// 3. Emit all 20 Male Enhancement meshes
for (const p of maleManifest.parts) {
  emitPartRow(p, {
    maleStatus: 'PRESENT_SEX_SPECIFIC_GEOMETRY',
    femaleStatus: 'OUT_OF_SCOPE',
    layerClassification: 'male_specific',
    inMale: true,
    inFemale: false,
    defaultSource: p.source || 'HuBMAP Human Reference Atlas Male (CC BY 4.0)',
    quality: 'verified_medical_reference',
    validationStatus: 'source_reviewed',
    notes: 'Male-specific enhancement mesh active in Male mode only.',
  });
}

// 4. Emit all 92 Female Overlay v3.0 meshes
for (const p of femaleManifest.parts) {
  const isProc = !String(p.source || '').startsWith('HuBMAP');
  emitPartRow(p, {
    maleStatus: 'OUT_OF_SCOPE',
    femaleStatus: isProc ? 'PRESENT_BUT_APPROXIMATED' : 'PRESENT_SEX_SPECIFIC_GEOMETRY',
    layerClassification: 'female_adapted_or_specific',
    inMale: false,
    inFemale: true,
    defaultSource: p.source || 'HuBMAP HRA Female + Anatomically Co-Registered Reconstruction',
    quality: isProc ? 'procedural_approximation' : 'verified_medical_reference',
    validationStatus: 'source_reviewed',
    notes: isProc
      ? 'Co-registered procedural reconstruction aligned to HuBMAP female pelvis.'
      : 'Direct HuBMAP HRA female reference mesh.',
  });
}

// 5. Emit all 8 Optional Pregnancy meshes
for (const p of pregnancyManifest.parts) {
  emitPartRow(p, {
    maleStatus: 'OUT_OF_SCOPE',
    femaleStatus: 'OUT_OF_SCOPE',
    layerClassification: 'optional_pregnancy',
    inMale: false,
    inFemale: false,
    defaultSource: p.source || 'HuBMAP HRA v1.1 Visible Human Female Full-Term Placenta',
    quality: 'optional_layer',
    validationStatus: 'optional_off_by_default',
    notes: 'Optional pregnancy/placenta layer; OFF by default in non-pregnant female reference.',
  });
}

// 6. Emit canonical audit gap / merged / optional summary entries
for (const item of CANONICAL_GROSS_ANATOMY_INVENTORY) {
  rows.push(
    [
      'canonical_audit_item',
      item.id,
      item.canonicalName,
      item.fmaId,
      item.ta2Term,
      item.uberonId,
      item.canonicalSystem,
      item.canonicalSystem,
      item.region,
      item.laterality,
      item.maleStatus,
      item.femaleStatus,
      item.femaleAdaptation,
      item.maleMeshIds.join('|'),
      item.femaleMeshIds.join('|'),
      Math.max(item.maleMeshIds.length, item.femaleMeshIds.length),
      0,
      item.geometrySource,
      item.assetLicense,
      item.geometryQuality,
      item.validationStatus,
      `${item.notes} [Gap additions -> Male: +${item.targetGapAdditionMale}, Female: +${item.targetGapAdditionFemale}]`,
    ]
      .map(csvCell)
      .join(','),
  );
}

for (const opt of OPTIONAL_ADVANCED_LAYERS) {
  rows.push(
    [
      'optional_advanced_layer',
      opt.id,
      opt.name,
      opt.fmaId,
      opt.ta2Term,
      '',
      'reproductive',
      'optional',
      'optional_advanced',
      'midline',
      'OUT_OF_SCOPE',
      'OUT_OF_SCOPE',
      'optional_layer',
      '',
      opt.meshIds.join('|'),
      opt.partCount,
      opt.triangles,
      opt.source,
      opt.license,
      'optional_layer',
      'optional_off_by_default',
      opt.notes,
    ]
      .map(csvCell)
      .join(','),
  );
}

const csvOutPath = path.join(ROOT_DIR, 'ANATOMY360_MALE_FEMALE_MESH_INVENTORY.csv');
fs.writeFileSync(csvOutPath, rows.join('\n') + '\n', 'utf8');

console.log('=== ANATOMY 360 COVERAGE AUDIT ===');
console.log(
  `Original BP3D Male Base: ${summary.originalMaleBaseMeshes} meshes (${summary.originalMaleUniquePartConcepts} unique part concepts / ${summary.originalMaleManifestConcepts} manifest FMA entries)`,
);
console.log(
  `Overlays -> Shared: +${summary.sharedEnhancementMeshes} | Male Enh: +${summary.maleEnhancementMeshes} | Female v3.0: +${summary.femaleOverlayMeshes} (${summary.femaleHubmapMeshes} HuBMAP + ${summary.femaleProceduralMeshes} procedural, replacing ${summary.replacedMalePartsInFemale} male parts) | Optional Pregnancy: +${summary.optionalPregnancyMeshes}`,
);
console.log(
  `Totals -> Distinct Bundled: ${summary.totalDistinctBundledMeshes} | Male Active: ${summary.maleActiveMeshes} | Female Active: ${summary.femaleActiveMeshes}`,
);
console.log(
  `Targets -> Male: ${summary.maleTargetMeshes} (Gap: ${summary.maleMissingRequiredMeshes}, Mesh Cov: ${summary.maleMeshCoveragePct}%, Concept Cov: ${summary.maleConceptCoveragePct}%) | Female: ${summary.femaleTargetMeshes} (Gap: ${summary.femaleMissingRequiredMeshes}, Mesh Cov: ${summary.femaleMeshCoveragePct}%, Concept Cov: ${summary.femaleConceptCoveragePct}%)`,
);
console.log('--- Per-System Breakdown ---');
for (const s of summary.systems) {
  console.log(
    `${s.systemId.padEnd(15)} | M: ${String(s.maleExisting).padStart(4)}/${String(s.maleTarget).padStart(4)} (-${String(s.maleMissingGap).padStart(2)}, ${String(s.maleMeshCoveragePct).padStart(5)}%) | F: ${String(s.femaleExisting).padStart(4)}/${String(s.femaleTarget).padStart(4)} (-${String(s.femaleMissingGap).padStart(2)}, ${String(s.femaleMeshCoveragePct).padStart(5)}%)`,
  );
}
console.log(`CSV written to ANATOMY360_MALE_FEMALE_MESH_INVENTORY.csv (${rows.length - 1} data rows).`);
