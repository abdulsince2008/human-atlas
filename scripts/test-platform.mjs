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

const atlas = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'public/models/atlas.json'), 'utf8'));

const { searchAnatomyCatalog, damerauDistance } = await import('../app/search-engine.ts');
const { computeNextReview, ANATOMY_FLASHCARDS } = await import('../app/spaced-repetition.ts');
const { getRelationshipsForConcept, getStructureRecordV2 } = await import('../app/knowledge-graph.ts');
const {
  validateAndSanitizeStudyState,
  createEmptyStudyState,
  applyFlashcardReviewToState,
  toggleBookmarkInState,
  buildRevisionQueue,
} = await import('../app/study-store.ts');
const { validateAtlasManifest, validateContentPackJson } = await import('../app/content-registry.ts');
const {
  evaluateCardiacSimulation,
  evaluateRespiratorySimulation,
  evaluateRenalSimulation,
  evaluateMusculoskeletalSimulation,
} = await import('../app/data/physiology-data.ts');

// ---------------------------------------------------------------------------
// 1. Search Engine Tests (exact, synonym, Latin, typo tolerance, filters)
// ---------------------------------------------------------------------------
assert.equal(damerauDistance('femur', 'fmeur'), 1, 'Damerau transposition distance');
assert.equal(damerauDistance('heart', 'haert'), 1, 'Damerau typo distance');

const emptyRes = searchAnatomyCatalog('', atlas);
assert.ok(emptyRes.results.length >= 6, 'Empty query returns suggested core structures');

const heartRes = searchAnatomyCatalog('cor', atlas);
assert.ok(
  heartRes.results.some((r) => r.conceptId === 'FMA7088'),
  'Latin synonym "cor" must match Heart (FMA7088)',
);

const typoRes = searchAnatomyCatalog('tracheea', atlas);
assert.ok(
  typoRes.results.some((r) => r.anatomicalName.toLowerCase().includes('trachea')),
  'Typo-tolerant search "tracheea" must recover Trachea',
);

const collarboneRes = searchAnatomyCatalog('collarbone', atlas);
assert.ok(
  collarboneRes.results.some((r) => r.anatomicalName.toLowerCase().includes('clavicle')),
  'Common name "collarbone" must resolve Clavicle',
);

const scopedRes = searchAnatomyCatalog('artery', atlas, {
  system: 'cardiovascular',
  category: 'artery',
  modelOnly: true,
});
assert.ok(scopedRes.results.every((r) => r.canonicalSystem === 'cardiovascular' && r.inModel));

// ---------------------------------------------------------------------------
// 2. Knowledge Graph & Relationship Integrity Tests
// ---------------------------------------------------------------------------
const heartGraph = getRelationshipsForConcept('FMA7088', atlas);
assert.ok(
  heartGraph.outgoing.length + heartGraph.incoming.length >= 2,
  'Heart must have curated anatomical relationships',
);

const femurRec = getStructureRecordV2('FMA9611', atlas);
assert.ok(femurRec.canonicalName.toLowerCase().includes('femur'));
assert.equal(femurRec.visualization.coverageTier, 'mesh_group');

// ---------------------------------------------------------------------------
// 3. Spaced Repetition (SM-2) & Study Store Migration / Corruption Tests
// ---------------------------------------------------------------------------
assert.ok(ANATOMY_FLASHCARDS.length >= 20, 'Must derive rich flashcard deck from Knowledge Graph');

const now = 1_700_000_000_000;
const firstUnderstood = computeNextReview(undefined, 'fc-heart', 'FMA7088', 'understood', now);
assert.equal(firstUnderstood.repetitions, 1);
assert.equal(firstUnderstood.intervalDays, 1);

const secondUnderstood = computeNextReview(firstUnderstood, 'fc-heart', 'FMA7088', 'understood', now);
assert.equal(secondUnderstood.repetitions, 2);
assert.equal(secondUnderstood.intervalDays, 6);

const resetDifficult = computeNextReview(secondUnderstood, 'fc-heart', 'FMA7088', 'difficult', now);
assert.equal(resetDifficult.repetitions, 0);
assert.equal(resetDifficult.lapses, 1);

// Corruption recovery tests
const invalidRoot = validateAndSanitizeStudyState(null);
assert.equal(invalidRoot.ok, false);

const badSchema = validateAndSanitizeStudyState({ schemaVersion: 999 });
assert.equal(badSchema.ok, false);

const partialRecover = validateAndSanitizeStudyState({
  schemaVersion: 1,
  completedTopicIds: ['topic-1', 123, null],
  profile: { displayName: 'Amina', track: 'INVALID_TRACK', dailyFlashcardGoal: 999 },
  bookmarks: {
    'structure:FMA7088': {
      id: 'structure:FMA7088',
      kind: 'structure',
      targetId: 'FMA7088',
      title: 'Heart',
      createdAt: now,
    },
    broken: { foo: 'bar' },
  },
});
assert.equal(partialRecover.ok, true);
assert.deepEqual(partialRecover.state.completedTopicIds, ['topic-1']);
assert.equal(partialRecover.state.profile.track, 'MBBS / Medical');
assert.ok(partialRecover.state.profile.dailyFlashcardGoal <= 200);
assert.ok(partialRecover.state.bookmarks['structure:FMA7088']);
assert.equal(partialRecover.state.bookmarks.broken, undefined);

// Bookmark & Revision Queue state transitions
let studyState = createEmptyStudyState();
studyState = toggleBookmarkInState(studyState, {
  kind: 'structure',
  targetId: 'FMA7088',
  title: 'Heart',
  canonicalSystem: 'cardiovascular',
});
assert.ok(studyState.bookmarks['structure:FMA7088']);
studyState = applyFlashcardReviewToState(studyState, ANATOMY_FLASHCARDS[0].id, 'FMA7088', 'Heart', 'difficult', now);
const queue = buildRevisionQueue(studyState, now + 1000 * 60 * 60 * 6);
assert.ok(queue.some((q) => q.source === 'difficult_card'));

// ---------------------------------------------------------------------------
// 4. Multi-Atlas Manifest & Content Pack Validation Tests
// ---------------------------------------------------------------------------
const realManifestCheck = validateAtlasManifest(atlas);
assert.equal(realManifestCheck.valid, true, 'Production public/models/atlas.json must pass manifest schema validator');
assert.equal(realManifestCheck.summary.partsCount, 2234);

const badManifestCheck = validateAtlasManifest({ version: 1, parts: [{ id: 'x' }] });
assert.equal(badManifestCheck.valid, false);
assert.ok(badManifestCheck.errors.length >= 2);

const goodPackCheck = validateContentPackJson({
  packId: 'sample-pack-v1',
  title: 'Sample Regional Pack',
  license: 'CC BY 4.0',
  attribution: 'Verified faculty contributor',
  structures: [{ conceptId: 'FMA7088', anatomicalName: 'heart', canonicalSystem: 'cardiovascular' }],
});
assert.equal(goodPackCheck.valid, true);

const badPackCheck = validateContentPackJson({ packId: 'broken-pack', schemaVersion: 1 });
assert.equal(badPackCheck.valid, false);

// ---------------------------------------------------------------------------
// 5. Physiology Deterministic Evaluators Sanity Tests
// ---------------------------------------------------------------------------
const cardiac = evaluateCardiacSimulation({ heartRate: 72, strokeVolume: 70, phasePct: 25 });
assert.equal(cardiac.readouts[0].value, '5.04');
assert.ok(cardiac.phaseName.includes('Systole'));

const resp = evaluateRespiratorySimulation({ respRate: 12, tidalVolume: 500, breathPhase: 30 });
assert.equal(resp.readouts[0].value, '6.00');
assert.equal(resp.readouts[1].value, '4.20');

const renal = evaluateRenalSimulation({ glomerularPressure: 60, oncoticPressure: 32 });
assert.equal(renal.nfp, 10);
assert.equal(renal.gfrApprox, 125);

const elbow = evaluateMusculoskeletalSimulation({ elbowAngle: 90, bicepsDrive: 70 });
assert.equal(elbow.mechanicalAdvantagePct, 100);

console.log(
  'All automated platform tests passed: search-engine, knowledge-graph, SM-2 scheduler, ' +
    'study-store sanitization/migration/queue, atlas/pack validators, and physiology evaluators.',
);
