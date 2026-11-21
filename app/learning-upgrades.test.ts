import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import type { Atlas } from './anatomy';
import { CANONICAL_SYSTEMS } from './anatomy-systems';
import { evaluateAcidBaseOxygenSimulation } from './data/physiology-data';
import { ANATOMY_LESSONS, GUIDED_PATHWAYS, TERMINOLOGY_ENTRIES } from './learning-data';
import {
  SYSTEM_TEACHING_METADATA,
  TOPIC_DEPTH_SUPPLEMENTS,
  getQuestionsForTopicOrSystem,
} from './learning-supplements';
import { QUIZ_DIFFICULTY_LEVELS, QUIZ_QUESTIONS } from './quiz-data';
import { buildEducatorWorksheetMarkdown, selectTierQuestionsForSystem } from './utils/educator-export';

const atlasPath = path.resolve(process.cwd(), 'public/models/atlas.json');
const atlas = JSON.parse(fs.readFileSync(atlasPath, 'utf8')) as Atlas;
const atlasConceptIds = new Set(atlas.concepts.map((c) => c.id));

test('QUIZ_QUESTIONS covers all 12 canonical systems (>= 3/system), all 4 tiers, valid FMA IDs, and unique IDs', () => {
  assert.ok(QUIZ_QUESTIONS.length >= 42, `Expected >= 42 questions, found ${QUIZ_QUESTIONS.length}`);
  assert.equal(QUIZ_DIFFICULTY_LEVELS.length, 4);

  const seenIds = new Set<string>();
  const systemCounts = new Map<string, number>();
  const tierCounts = new Map<string, number>();

  for (const q of QUIZ_QUESTIONS) {
    assert.ok(!seenIds.has(q.id), `Duplicate quiz question ID: ${q.id}`);
    seenIds.add(q.id);
    assert.equal(q.options.length, 4, `Question ${q.id} must have 4 options`);
    assert.ok(q.correctIndex >= 0 && q.correctIndex < 4, `Question ${q.id} correctIndex out of range`);
    assert.ok(
      atlasConceptIds.has(q.relatedConceptId),
      `Question ${q.id} references unknown FMA concept ${q.relatedConceptId}`,
    );

    systemCounts.set(q.systemId, (systemCounts.get(q.systemId) ?? 0) + 1);
    tierCounts.set(q.difficulty, (tierCounts.get(q.difficulty) ?? 0) + 1);
  }

  for (const sys of CANONICAL_SYSTEMS) {
    const count = systemCounts.get(sys.id) ?? 0;
    assert.ok(count >= 3, `Canonical system ${sys.id} has only ${count} quiz questions (expected >= 3)`);
  }

  for (const tier of QUIZ_DIFFICULTY_LEVELS) {
    const count = tierCounts.get(tier) ?? 0;
    assert.ok(count >= 8, `Quiz tier "${tier}" has only ${count} questions (expected >= 8)`);
  }
});

test('TOPIC_DEPTH_SUPPLEMENTS covers all 28 ANATOMY_LESSONS topics with non-empty 3-tier pedagogy', () => {
  const allLessonTopics = ANATOMY_LESSONS.flatMap((l) => l.topics);
  assert.equal(allLessonTopics.length, 28, 'Expected 28 canonical lesson topics across 12 chapters');

  for (const topic of allLessonTopics) {
    const sup = TOPIC_DEPTH_SUPPLEMENTS[topic.id];
    assert.ok(sup, `Missing depth supplement for lesson topic ${topic.id}`);
    assert.ok(sup.school_9_12.trim().length > 30, `Topic ${topic.id} school_9_12 supplement too short`);
    assert.ok(sup.bs_mbbs.trim().length > 30, `Topic ${topic.id} bs_mbbs supplement too short`);
    assert.ok(sup.phd_research.trim().length > 30, `Topic ${topic.id} phd_research supplement too short`);
    assert.ok(
      sup.quantitativeOrExperimentalNote.trim().length > 20,
      `Topic ${topic.id} quantitativeOrExperimentalNote too short`,
    );
  }
});

test('SYSTEM_TEACHING_METADATA covers all 12 systems with Bloom objectives, misconceptions, spotter focus, and connected labs', () => {
  for (const sys of CANONICAL_SYSTEMS) {
    const guide = SYSTEM_TEACHING_METADATA[sys.id];
    assert.ok(guide, `Missing teaching metadata for system ${sys.id}`);
    assert.ok(guide.bloomObjectives.school_9_12.length >= 2, `${sys.id}: school_9_12 Bloom objectives needed`);
    assert.ok(guide.bloomObjectives.bs_mbbs.length >= 2, `${sys.id}: bs_mbbs Bloom objectives needed`);
    assert.ok(
      guide.bloomObjectives.phd_research.length >= 1 && guide.bloomObjectives.phd_research[0].trim().length > 20,
      `${sys.id}: phd_research Bloom objective needed`,
    );
    assert.ok(guide.commonMisconceptions.length >= 1, `${sys.id}: commonMisconceptions needed`);
    assert.ok(guide.labSpotterFocus.length >= 2, `${sys.id}: labSpotterFocus needed`);
    assert.ok(guide.graduateSeminarPrompt.trim().length > 25, `${sys.id}: graduateSeminarPrompt needed`);
    assert.ok(guide.connectedLabs.length >= 1, `${sys.id}: connectedLabs needed`);
  }

  const fallbackQs = getQuestionsForTopicOrSystem('skeletal', 'topic-skeletal-skull-jaw', 3);
  assert.ok(fallbackQs.length >= 1 && fallbackQs.length <= 3);
});

test('TERMINOLOGY_ENTRIES covers all 4 categories including Movement and GUIDED_PATHWAYS has >= 8 pathways', () => {
  assert.ok(GUIDED_PATHWAYS.length >= 8, `Expected >= 8 guided pathways, found ${GUIDED_PATHWAYS.length}`);
  const categories = new Set(TERMINOLOGY_ENTRIES.map((t) => t.category));
  for (const required of ['Plane', 'Directional', 'Movement', 'Root'] as const) {
    assert.ok(categories.has(required), `Missing terminology category ${required}`);
  }
  const movementTerms = TERMINOLOGY_ENTRIES.filter((t) => t.category === 'Movement');
  assert.ok(movementTerms.length >= 10, `Expected >= 10 Movement terms, found ${movementTerms.length}`);
});

test('evaluateAcidBaseOxygenSimulation computes Henderson-Hasselbalch pH and Bohr shift accurately', () => {
  const normal = evaluateAcidBaseOxygenSimulation({ paco2: 40, hco3: 24, pao2: 95 });
  assert.ok(Math.abs(normal.pH - 7.40) < 0.02, `Expected ~7.40 pH at baseline, got ${normal.pH}`);
  assert.ok(Math.abs(normal.p50 - 26.8) < 0.5, `Expected ~26.8 mmHg P50 at baseline, got ${normal.p50}`);
  assert.ok(normal.sao2Pct > 95 && normal.sao2Pct < 99);
  assert.equal(normal.curvePoints.length, 13);

  const acidemic = evaluateAcidBaseOxygenSimulation({ paco2: 60, hco3: 24, pao2: 68 });
  assert.ok(acidemic.pH < 7.26, 'PaCO2 60 / HCO3 24 must produce respiratory acidemia');
  assert.ok(acidemic.p50 > normal.p50, 'Acidemia must increase P50 (Bohr right shift)');

  const alkalemic = evaluateAcidBaseOxygenSimulation({ paco2: 26, hco3: 24, pao2: 108 });
  assert.ok(alkalemic.pH > 7.55, 'PaCO2 26 / HCO3 24 must produce respiratory alkalemia');
  assert.ok(alkalemic.p50 < normal.p50, 'Alkalemia must decrease P50 (Bohr left shift)');
});

test('buildEducatorWorksheetMarkdown generates structured lesson packets across tiers with optional answer key', () => {
  const mdWithKey = buildEducatorWorksheetMarkdown({
    systemId: 'cardiovascular',
    tier: 'phd_research',
    includeAnswerKey: true,
  });
  assert.ok(mdWithKey.includes('Bloom’s Learning Objectives'));
  assert.ok(mdWithKey.includes('Common Student Misconceptions'));
  assert.ok(mdWithKey.includes('Recommended 3D Practical Spotter Structures'));
  assert.ok(mdWithKey.includes('Graduate / PhD Seminar Discussion Prompt'));
  assert.ok(mdWithKey.includes('Quantitative / Experimental Lens'));
  assert.ok(mdWithKey.includes('Instructor Answer Key & Rationale'));

  const mdNoKey = buildEducatorWorksheetMarkdown({
    systemId: 'skeletal',
    tier: 'school_9_12',
    includeAnswerKey: false,
  });
  assert.ok(!mdNoKey.includes('Instructor Answer Key & Rationale'));
  assert.ok(!mdNoKey.includes('Graduate / PhD Seminar Discussion Prompt'));

  const tierQs = selectTierQuestionsForSystem('reproductive', 'bs_mbbs');
  assert.ok(tierQs.length >= 1);
});
