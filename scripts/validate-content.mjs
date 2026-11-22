import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

// Register lightweight in-process TypeScript hook for extensionless local ESM imports
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

const atlas = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'public/models/atlas.json'), 'utf8'));
const conceptIdsInAtlas = new Set(atlas.concepts.map((c) => c.id));

const { CANONICAL_SYSTEMS } = await import('../app/anatomy-systems.ts');
const { CURATED_KNOWLEDGE } = await import('../app/anatomy-knowledge.ts');
const { KNOWLEDGE_GRAPH_V2, VERIFIED_RELATIONSHIPS } = await import('../app/knowledge-graph.ts');
const { ANATOMY_LESSONS } = await import('../app/learning-data.ts');
const { QUIZ_QUESTIONS } = await import('../app/quiz-data.ts');
const { PHYSIOLOGY_MODULES } = await import('../app/data/physiology-data.ts');
const { HISTOLOGY_ENTRIES } = await import('../app/data/histology-data.ts');
const { CLINICAL_CASES } = await import('../app/data/clinical-data.ts');
const { REGISTERED_ATLASES } = await import('../app/content-registry.ts');

const canonicalSystemIds = new Set(CANONICAL_SYSTEMS.map((s) => s.id));
assert.equal(CANONICAL_SYSTEMS.length, 12, 'Must maintain exactly 12 canonical systems');

// 1. Validate unique IDs across all curriculum collections
function assertUnique(items, getKey, label) {
  const seen = new Set();
  for (const item of items) {
    const key = getKey(item);
    assert.ok(key && typeof key === 'string', `${label}: missing string key`);
    assert.ok(!seen.has(key), `${label}: duplicate key "${key}"`);
    seen.add(key);
  }
  return seen;
}

assertUnique(CANONICAL_SYSTEMS, (s) => s.id, 'CANONICAL_SYSTEMS');
assertUnique(CURATED_KNOWLEDGE, (k) => k.conceptId, 'CURATED_KNOWLEDGE');
assertUnique(KNOWLEDGE_GRAPH_V2, (k) => k.conceptId, 'KNOWLEDGE_GRAPH_V2');
assertUnique(ANATOMY_LESSONS, (l) => l.id, 'ANATOMY_LESSONS');
assertUnique(
  ANATOMY_LESSONS.flatMap((l) => l.topics),
  (t) => t.id,
  'LESSON_TOPICS',
);
assertUnique(QUIZ_QUESTIONS, (q) => q.id, 'QUIZ_QUESTIONS');
assertUnique(PHYSIOLOGY_MODULES, (p) => p.id, 'PHYSIOLOGY_MODULES');
assertUnique(HISTOLOGY_ENTRIES, (h) => h.id, 'HISTOLOGY_ENTRIES');
assertUnique(CLINICAL_CASES, (c) => c.id, 'CLINICAL_CASES');
assertUnique(VERIFIED_RELATIONSHIPS, (r) => r.id, 'VERIFIED_RELATIONSHIPS');

// 2. Validate Knowledge Graph V2 conceptIds, systems, categories & attributions
const plannedUnavailableConcepts = new Set(
  KNOWLEDGE_GRAPH_V2.filter((r) => r.visualization.coverageTier === 'planned_unavailable').map(
    (r) => r.conceptId,
  ),
);

for (const rec of KNOWLEDGE_GRAPH_V2) {
  assert.ok(
    canonicalSystemIds.has(rec.canonicalSystem),
    `KNOWLEDGE_GRAPH_V2[${rec.conceptId}]: invalid canonicalSystem ${rec.canonicalSystem}`,
  );
  if (rec.visualization.inModel) {
    assert.ok(
      conceptIdsInAtlas.has(rec.conceptId),
      `KNOWLEDGE_GRAPH_V2[${rec.conceptId}] marked inModel=true but missing from atlas.json`,
    );
  }
  assert.ok(rec.education.beginner.trim().length > 20, `${rec.conceptId}: empty beginner text`);
  assert.ok(rec.education.intermediate.trim().length > 20, `${rec.conceptId}: empty intermediate text`);
  assert.ok(rec.education.advanced.trim().length > 20, `${rec.conceptId}: empty advanced text`);
  assert.ok(rec.provenance.sourceReference.trim().length > 0, `${rec.conceptId}: missing provenance sourceReference`);
  assert.ok(rec.provenance.attribution.trim().length > 0, `${rec.conceptId}: missing provenance attribution`);
  assert.ok(rec.provenance.license.trim().length > 0, `${rec.conceptId}: missing provenance license`);
}

// 3. Validate VERIFIED_RELATIONSHIPS FMA links
for (const rel of VERIFIED_RELATIONSHIPS) {
  const srcValid = conceptIdsInAtlas.has(rel.sourceConceptId) || plannedUnavailableConcepts.has(rel.sourceConceptId);
  const tgtValid =
    !rel.targetConceptId ||
    conceptIdsInAtlas.has(rel.targetConceptId) ||
    plannedUnavailableConcepts.has(rel.targetConceptId);
  assert.ok(srcValid, `Relationship ${rel.id}: unknown sourceConceptId ${rel.sourceConceptId}`);
  assert.ok(tgtValid, `Relationship ${rel.id}: unknown targetConceptId ${rel.targetConceptId}`);
  assert.ok(rel.targetLabel.trim().length > 0, `Relationship ${rel.id}: missing targetLabel`);
  assert.ok(rel.note.trim().length > 10, `Relationship ${rel.id}: missing educational note`);
}

// 4. Validate all 12 canonical systems have lessons, objectives, and valid atlas concepts
const coveredSystems = new Set(ANATOMY_LESSONS.map((l) => l.systemId));
for (const sys of CANONICAL_SYSTEMS) {
  assert.ok(coveredSystems.has(sys.id), `Missing lessons for canonical system ${sys.id}`);
}

for (const lesson of ANATOMY_LESSONS) {
  assert.ok(canonicalSystemIds.has(lesson.systemId), `Lesson ${lesson.id}: invalid systemId ${lesson.systemId}`);
  assert.ok(lesson.learningObjectives.length >= 2, `Lesson ${lesson.id}: needs at least 2 objectives`);
  assert.ok(lesson.topics.length >= 1, `Lesson ${lesson.id}: needs topics`);
  for (const topic of lesson.topics) {
    assert.ok(topic.explanation.en.trim().length > 30, `Topic ${topic.id}: explanation too short`);
    for (const cid of topic.conceptIds) {
      const exists = conceptIdsInAtlas.has(cid) || plannedUnavailableConcepts.has(cid);
      assert.ok(exists, `Topic ${topic.id}: conceptId "${cid}" not found in atlas.json or planned registry`);
    }
  }
}

// 5. Validate Quiz questions
for (const q of QUIZ_QUESTIONS) {
  assert.ok(canonicalSystemIds.has(q.systemId), `Quiz ${q.id}: invalid systemId ${q.systemId}`);
  assert.equal(q.options.length, 4, `Quiz ${q.id}: expected 4 options`);
  assert.ok(q.correctIndex >= 0 && q.correctIndex < q.options.length, `Quiz ${q.id}: invalid correctIndex`);
  assert.ok(q.explanation.trim().length > 15, `Quiz ${q.id}: missing explanation`);
  assert.ok(
    conceptIdsInAtlas.has(q.relatedConceptId) || plannedUnavailableConcepts.has(q.relatedConceptId),
    `Quiz ${q.id}: unknown relatedConceptId ${q.relatedConceptId}`,
  );
}

// 6. Validate Physiology, Histology, Clinical cases & Atlas registry
for (const mod of PHYSIOLOGY_MODULES) {
  assert.ok(canonicalSystemIds.has(mod.systemId), `Physiology ${mod.id}: invalid system ${mod.systemId}`);
  for (const lc of mod.linkedConcepts) {
    assert.ok(conceptIdsInAtlas.has(lc.conceptId), `Physiology ${mod.id}: missing atlas concept ${lc.conceptId}`);
  }
  assert.ok(mod.assumptions.length > 0 && mod.disclaimer.length > 10, `Physiology ${mod.id}: missing assumptions/disclaimer`);
}

for (const h of HISTOLOGY_ENTRIES) {
  assert.ok(h.specimenSlot.attributionRequirement.length > 5, `Histology ${h.id}: missing attribution spec`);
  for (const cid of h.linkedConceptIds) {
    assert.ok(conceptIdsInAtlas.has(cid), `Histology ${h.id}: missing atlas concept ${cid}`);
  }
}

for (const c of CLINICAL_CASES) {
  assert.ok(canonicalSystemIds.has(c.systemId), `Clinical ${c.id}: invalid system ${c.systemId}`);
  assert.ok(c.sourceReference.length > 5, `Clinical ${c.id}: missing sourceReference`);
  assert.equal(c.checkQuestion.options.length, 4, `Clinical ${c.id}: expected 4 MCQ options`);
  for (const rc of c.relevantConcepts) {
    assert.ok(conceptIdsInAtlas.has(rc.conceptId), `Clinical ${c.id}: missing atlas concept ${rc.conceptId}`);
  }
}

assert.ok(
  REGISTERED_ATLASES.some((a) => a.status === 'available'),
  'At least one atlas must be available',
);

// 7. Validate 4-Layer Provenance Registry, Curated Study Resources & Multi-Layer Visualization Colors
const { validateProvenanceIntegrity, PROVENANCE_LAYERS, EDUCATIONAL_EVIDENCE_RECORDS } = await import(
  '../app/data/provenance-registry.ts'
);
const { validateStudyResources, STUDY_RESOURCES } = await import('../app/data/study-resources.ts');
const { resolveBrainRegions, resolveMusclePilotColors, FUNCTIONAL_MUSCLE_PILOTS } = await import(
  '../app/visualization-colors.ts'
);

const provCheck = validateProvenanceIntegrity();
assert.equal(provCheck.valid, true, `Provenance validation failed: ${provCheck.errors.join('; ')}`);

const resCheck = validateStudyResources();
assert.equal(resCheck.valid, true, `Study resources validation failed: ${resCheck.errors.join('; ')}`);
for (const res of STUDY_RESOURCES) {
  for (const sysId of res.canonicalSystems) {
    assert.ok(canonicalSystemIds.has(sysId), `Study resource ${res.id}: invalid canonicalSystem ${sysId}`);
  }
}

const brainRes = resolveBrainRegions(atlas);
assert.ok(brainRes.totalMappedParts >= 70, `Brain regional palette mapped too few parts: ${brainRes.totalMappedParts}`);

for (const pilot of FUNCTIONAL_MUSCLE_PILOTS) {
  const mRes = resolveMusclePilotColors(atlas, pilot.id);
  assert.ok(mRes.matchedPartIds.length >= 6, `Muscle pilot ${pilot.id}: expected >= 6 mapped muscles`);
}

const { validateKnowledgeRegistry } = await import('../app/registry/registry-validation.ts');
const registryCheck = validateKnowledgeRegistry(atlas);
assert.equal(
  registryCheck.valid,
  true,
  `Knowledge Registry validation failed: ${registryCheck.errors.join('; ')}`,
);

console.log(
  `Content validation passed: ${KNOWLEDGE_GRAPH_V2.length} V2 knowledge structures, ` +
    `${VERIFIED_RELATIONSHIPS.length} verified relationships, ${ANATOMY_LESSONS.length} lessons ` +
    `(${ANATOMY_LESSONS.reduce((s, l) => s + l.topics.length, 0)} topics), ` +
    `${registryCheck.metrics.domainsCount} registry domains (${registryCheck.metrics.topicsCount} topics, ${registryCheck.metrics.curriculumFrameworksCount} frameworks), ` +
    `${QUIZ_QUESTIONS.length} quiz questions, ${PHYSIOLOGY_MODULES.length} physiology specs, ` +
    `${HISTOLOGY_ENTRIES.length} histology entries, ${CLINICAL_CASES.length} clinical scenarios, ` +
    `${PROVENANCE_LAYERS.length} provenance layers (${EDUCATIONAL_EVIDENCE_RECORDS.length} evidence records), ` +
    `${STUDY_RESOURCES.length} curated study resources, and ${brainRes.totalMappedParts} mapped brain meshes.`,
);
