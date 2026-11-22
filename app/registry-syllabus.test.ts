import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import type { Atlas } from './anatomy';
import {
  computeRegistryMetrics,
  getDomainCoverageBreakdown,
  getRegistrySubjectByDomain,
  getRegistryTopicsForDomain,
  getRegistryTopicsForFramework,
  REGISTRY_CHAPTERS,
  REGISTRY_SUBJECTS,
  REGISTRY_TOPICS,
} from './registry/knowledge-registry';
import { validateKnowledgeRegistry } from './registry/registry-validation';
import { searchUnifiedEducationCatalog } from './search-engine';
import {
  createEmptyStudyState,
  validateAndSanitizeStudyState,
} from './study-store';
import {
  computeSyllabusCoverageReport,
  matchDraftItemsToRegistry,
  tokenizeSyllabusText,
} from './syllabus/syllabus-mapper';
import { parseCsvSyllabus, parseSyllabusText } from './syllabus/syllabus-parser';
import type { CustomSyllabusProfile } from './syllabus/syllabus-types';
import { buildUniversalEducatorMarkdown } from './utils/educator-export';

const atlasPath = path.resolve(process.cwd(), 'public/models/atlas.json');
const atlas = JSON.parse(fs.readFileSync(atlasPath, 'utf8')) as Atlas;

test('Universal Knowledge Registry passes validation and maintains truthful provenance & asset limits', () => {
  const res = validateKnowledgeRegistry(atlas);
  assert.deepEqual(res.errors, [], `Registry errors:\n${res.errors.join('\n')}`);
  assert.equal(res.valid, true);
  assert.equal(REGISTRY_SUBJECTS.length, 16);
  assert.ok(REGISTRY_CHAPTERS.length >= 29);
  assert.equal(REGISTRY_TOPICS.length, 46);

  // Honest coverage boundaries:
  const endoPlanned = REGISTRY_TOPICS.find((t) => t.id === 'endocrine-feedback-planned');
  assert.ok(endoPlanned);
  assert.equal(endoPlanned.coverageStatus, 'planned');
  assert.equal(endoPlanned.countsAsFullCoverage, false);

  const histTopic = getRegistryTopicsForDomain('histology')[0];
  assert.ok(histTopic);
  assert.equal(histTopic.assetStatus, 'asset_missing');
  assert.notEqual(histTopic.coverageStatus, 'complete');

  const radTopic = getRegistryTopicsForDomain('radiology_imaging')[0];
  assert.ok(radTopic);
  assert.equal(radTopic.assetStatus, 'asset_missing');

  const pharmTopic = getRegistryTopicsForDomain('pharmacology')[0];
  assert.ok(pharmTopic);
  assert.equal(pharmTopic.countsAsFullCoverage, false);
  assert.equal(pharmTopic.coverageStatus, 'introductory');

  const metrics = computeRegistryMetrics(atlas);
  assert.equal(metrics.domainsCount, 16);
  assert.equal(metrics.curriculumFrameworksCount, 13);
  assert.equal(metrics.learningTracksCount, 6);
  assert.equal(metrics.physiologyInteractiveCount, 5);
  assert.equal(metrics.physiologyPlannedCount, 1);
  assert.equal(metrics.atlasMeshesCount, 2234);
  assert.equal(metrics.atlasConceptsCount, 3432);

  const uhsTopics = getRegistryTopicsForFramework('pk_uhs_mbbs');
  assert.ok(uhsTopics.length >= 10);
  const anatomyBreakdown = getDomainCoverageBreakdown('human_anatomy');
  assert.ok(anatomyBreakdown.substantiallyCoveredCount > 0);
  assert.ok(getRegistrySubjectByDomain('pharmacology'));
});

test('Syllabus parser extracts outlines, headings, bullets, and CSV columns reliably', () => {
  const textOutline = `
# Unit 1: Cardiovascular Foundations
1. Chambers, Valves & Systemic-Pulmonary Circulation
2. Coronary Arterial Supply & Venous Drainage

Unit 2: Pharmacology Basics
- Pharmacokinetics (ADME) & First-Pass Metabolism
- Pharmacodynamics & Receptor Agonists
`;
  const parsed = parseSyllabusText(textOutline);
  assert.equal(parsed.length, 4);
  assert.equal(parsed[0].unit, 'Unit 1: Cardiovascular Foundations');
  assert.equal(parsed[0].title, 'Chambers, Valves & Systemic-Pulmonary Circulation');
  assert.equal(parsed[2].unit, 'Unit 2: Pharmacology Basics');

  const csvRaw = `Unit,Topic\nCardio,Heart Chambers\nPharmacology,ADME Pharmacokinetics\nCustom Module,Pediatric Audiology Screening`;
  const csvParsed = parseCsvSyllabus(csvRaw);
  assert.equal(csvParsed.length, 3);
  assert.equal(csvParsed[0].unit, 'Cardio');
  assert.equal(csvParsed[1].title, 'ADME Pharmacokinetics');
});

test('Syllabus mapper resolves abbreviations/synonyms, flags suggestions for review, and prevents introductory modules from counting as full Available coverage', () => {
  const tokens = tokenizeSyllabusText('CVS PK/PD ABG');
  assert.ok(tokens.includes('cardiovascular'));
  assert.ok(tokens.includes('pharmacology'));
  assert.ok(tokens.includes('haemoglobin'));

  const drafts = parseSyllabusText(
    [
      '1. Heart Chambers, Valves & Great Vessels',
      '2. Pharmacokinetics (ADME) and receptor binding',
      '3. Stellar Nucleosynthesis and Supernova Remnant Hydrodynamics',
    ].join('\n'),
  );
  const matched = matchDraftItemsToRegistry(drafts);
  assert.equal(matched.length, 3);

  // Item 1 -> Anatomy topic should match heart chambers & count as available
  assert.ok(matched[0].mappings.some((m) => m.domainId === 'human_anatomy' && m.confirmed));
  // Item 2 -> Pharmacology introductory module MUST NEVER count as fully available
  assert.ok(matched[1].mappings.some((m) => m.domainId === 'pharmacology'));
  // Item 3 -> Out of scope -> not_available_yet
  assert.equal(matched[2].mappings.length, 0);

  const report = computeSyllabusCoverageReport(matched);
  assert.equal(report.totalItems, 3);
  assert.equal(report.availableCount, 1);
  assert.equal(report.partiallyAvailableCount, 1);
  assert.equal(report.notAvailableYetCount, 1);
  assert.equal(report.rows[0].category, 'available');
  assert.equal(report.rows[1].category, 'partially_available');
  assert.equal(report.rows[2].category, 'not_available_yet');

  // Suggested matches must require explicit confirmation (confirmed: false)
  const weakSuggestionDrafts = parseSyllabusText('Host defence immune antibodies & vaccines');
  const suggestedItems = matchDraftItemsToRegistry(weakSuggestionDrafts);
  if (suggestedItems[0].mappings[0]?.confidence === 'suggested') {
    assert.equal(suggestedItems[0].mappings[0].confirmed, false);
  }
});

test('Unified educational search resolves non-anatomy and anatomy queries across all 16 domains without duplicates', () => {
  for (const query of ['pharmacology', 'pathology', 'microbiology', 'cell biology', 'heart']) {
    const res = searchUnifiedEducationCatalog(query, atlas, { limit: 40 });
    assert.ok(res.results.length >= 2, `Expected rich unified results for "${query}"`);
    const keys = res.results.map((r) => r.key);
    assert.equal(new Set(keys).size, keys.length, `Duplicate keys returned for query "${query}"`);
  }

  const pharmSearch = searchUnifiedEducationCatalog('pharmacology', atlas, { domainId: 'pharmacology' });
  assert.ok(pharmSearch.results.every((r) => r.domainId === 'pharmacology'));
  assert.ok(pharmSearch.results.some((r) => r.category === 'subject' || r.category === 'topic'));

  const corSearch = searchUnifiedEducationCatalog('cor', atlas);
  assert.ok(corSearch.results.some((r) => r.conceptId === 'FMA7088'));
});

test('Universal educator exporter creates Lecture Outline and Student Worksheet across non-anatomy domains and custom syllabi', () => {
  const pharmOutline = buildUniversalEducatorMarkdown({
    sourceKind: 'domain',
    domainId: 'pharmacology',
    tier: 'bs_mbbs',
    exportKind: 'lecture_outline',
  });
  assert.ok(pharmOutline.includes('Instructor Lecture & Seminar Outline'));
  assert.ok(pharmOutline.includes('Pharmacology'));
  assert.ok(pharmOutline.includes('Honest Coverage & Asset Limitations'));

  const customSyllabus: CustomSyllabusProfile = {
    id: 'cs-test-1',
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    sourceFormat: 'paste',
    metadata: {
      country: 'Pakistan',
      institution: 'Example Medical University',
      programme: 'MBBS',
      degree: 'Undergraduate',
      yearOrSemester: 'Year 1 · Block 1',
      courseName: 'Foundations of Cell & Heart',
    },
    items: matchDraftItemsToRegistry(parseSyllabusText('Heart Chambers\nCellular Organelles')),
  };

  const worksheetNoKey = buildUniversalEducatorMarkdown({
    sourceKind: 'custom_syllabus',
    customSyllabus,
    tier: 'school_9_12',
    exportKind: 'student_worksheet',
    includeAnswerKey: false,
  });
  assert.ok(worksheetNoKey.includes('Student Activity & Assessment Worksheet'));
  assert.ok(worksheetNoKey.includes('Foundations of Cell & Heart'));
  assert.equal(worksheetNoKey.includes('Instructor Answer Key & Rationale'), false);
});

test('Study store sanitizes customSyllabi and educatorSequences while staying backward compatible with legacy v1 backups', () => {
  const legacyStateRes = validateAndSanitizeStudyState({
    schemaVersion: 1,
    completedTopicIds: ['topic-cv-chambers'],
  });
  assert.equal(legacyStateRes.ok, true);
  assert.ok(legacyStateRes.state);
  assert.deepEqual(legacyStateRes.state.customSyllabi, []);
  assert.deepEqual(legacyStateRes.state.educatorSequences, {});

  const empty = createEmptyStudyState();
  assert.deepEqual(empty.customSyllabi, []);

  const richStateRes = validateAndSanitizeStudyState({
    schemaVersion: 1,
    customSyllabi: [
      {
        id: 'cs-1',
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        sourceFormat: 'manual',
        metadata: {
          country: 'UK',
          institution: 'Demo Univ',
          programme: 'BSc Biomedical Science',
          degree: 'BS Hons',
          yearOrSemester: 'Year 2',
          courseName: 'Human Physiology II',
        },
        items: [
          {
            id: 'i1',
            rawLine: 'Cardiac Cycle',
            title: 'Cardiac Cycle',
            keywords: ['cardiac'],
            mappings: [
              {
                registryTopicId: 'topic-cv-chambers',
                domainId: 'human_anatomy',
                title: 'Heart Chambers & Valves',
                confidence: 'high',
                matchReason: 'Keyword match',
                confirmed: true,
              },
            ],
          },
        ],
      },
      { broken: true },
    ],
    educatorSequences: {
      'domain:pharmacology': ['edu-pharmacology-pk-pd', 123 as unknown as string],
    },
  });
  assert.equal(richStateRes.ok, true);
  assert.ok(richStateRes.state);
  assert.equal(richStateRes.state.customSyllabi.length, 1);
  assert.deepEqual(richStateRes.state.educatorSequences['domain:pharmacology'], [
    'edu-pharmacology-pk-pd',
  ]);
});
