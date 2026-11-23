import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import type { Atlas } from './anatomy';
import {
  EDUCATION_TOPICS,
  filterTopicsForTrackAndFramework,
  getDomainsForTrack,
  getPlatformCompletionSummary,
  getTopicsByDomain,
  getTopicsForFramework,
  getVisibleDomainsForFilter,
  resolveExplanationForTrack,
} from './education/education-content';
import {
  CURRICULUM_FRAMEWORKS,
  EDUCATION_TRACKS,
  PMDC_HOUR_AGGREGATION_NOTE,
  PMDC_OFFICIAL_MIN_TOTAL_HOURS,
  PMDC_PAKISTAN_MBBS_HOUR_REFERENCE,
} from './education/education-curricula';
import { EDUCATION_DOMAINS } from './education/education-domains';
import { validateEducationSystem } from './education/education-validation';

const atlasPath = path.resolve(process.cwd(), 'public/models/atlas.json');
const atlas = JSON.parse(fs.readFileSync(atlasPath, 'utf8')) as Atlas;

test('education system passes full 16-domain, 267-chapter structural, atlas FMA, deck, and governance validation', () => {
  const result = validateEducationSystem(atlas);
  assert.deepEqual(result.errors, [], `Education validation errors:\n${result.errors.join('\n')}`);
  assert.equal(result.valid, true);
  assert.equal(result.summary.tracks, 6);
  assert.equal(result.summary.frameworks, 13);
  assert.equal(result.summary.domains, 16);
  assert.equal(result.summary.topics, 267);
  assert.ok(result.summary.selfChecks >= 1400, 'All 267 chapters must deliver expanded MCQs');
  assert.equal(result.summary.presentationSlides, 267 * 9);
  assert.equal(result.summary.shortAnswers, 267 * 3);
  assert.equal(result.summary.appliedCases, 267);

  const completion = getPlatformCompletionSummary();
  assert.equal(completion.totalChapters, 267);
  assert.equal(completion.verifiedVideosCount, 0, 'Must never claim verified live YouTube links without verification');
  assert.equal(completion.facultyReviewedCount, 0, 'Must never falsely mark human faculty review complete');
  assert.equal(completion.awaitingAcademicReviewCount, 267);
});

test('all 6 learning tracks, 13 curriculum references, and PM&DC 6,200h benchmark are consistent', () => {
  for (const track of EDUCATION_TRACKS) {
    const domains = getDomainsForTrack(track.id);
    assert.ok(domains.length >= 4, `Track ${track.id} should map to multiple domains`);
  }

  for (const fw of CURRICULUM_FRAMEWORKS) {
    assert.ok(fw.url.startsWith('https://'), `Framework ${fw.id} must have an https URL`);
    assert.ok(fw.adoptionNote.length > 20, `Framework ${fw.id} must include adoption/scope notes`);
  }

  const pkBioTopics = getTopicsForFramework('pk_ncp_bio_9_12');
  assert.ok(pkBioTopics.length >= 6, 'Pakistan NCP Biology IX-XII must map across core human biology domains');

  const pmdcTopics = getTopicsForFramework('pk_pmdc_mbbs');
  assert.ok(pmdcTopics.length >= 8, 'PM&DC MBBS must map across pre-clinical and clinical domains');

  const qaaTopics = getTopicsForFramework('qaa_biosciences');
  assert.ok(qaaTopics.length >= 8, 'QAA Subject Benchmark Biosciences must map across BS/MPhil/PhD domains');

  const anatSocTopics = getTopicsForFramework('anat_soc_core');
  assert.ok(anatSocTopics.length >= 3, 'Anatomical Society core syllabus must map across anatomy/histology/embryology');

  assert.equal(PMDC_OFFICIAL_MIN_TOTAL_HOURS, 6200, 'Official PM&DC 2024 MBBS minimum total is 6,200 contact hours');
  assert.ok(PMDC_HOUR_AGGREGATION_NOTE.includes('6,200'), 'Aggregation note must document the 6,200h total transparently');
  assert.ok(PMDC_PAKISTAN_MBBS_HOUR_REFERENCE.length >= 9, 'PM&DC subject minimum references must be populated');
});

test('strict curriculum filtering filters both domains and topics and never falls back on zero matches', () => {
  const medPmdcDomains = getVisibleDomainsForFilter('medical_foundations', 'pk_pmdc_mbbs');
  assert.ok(medPmdcDomains.length >= 6, 'Medical Foundations + PM&DC MBBS must return matching domains');

  for (const dom of medPmdcDomains) {
    const filteredTopics = filterTopicsForTrackAndFramework(dom.id, 'medical_foundations', 'pk_pmdc_mbbs');
    assert.ok(filteredTopics.length >= 1, `Visible domain ${dom.id} must have >=1 matching topic`);
    for (const tp of filteredTopics) {
      assert.ok(tp.targetTracks.includes('medical_foundations'), `Topic ${tp.id} must belong to medical_foundations`);
      assert.ok(
        tp.curriculumMappings.some((m) => m.frameworkId === 'pk_pmdc_mbbs'),
        `Topic ${tp.id} must map to pk_pmdc_mbbs`,
      );
    }
  }

  const gradQaaDomains = getVisibleDomainsForFilter('graduate_research', 'qaa_biosciences');
  assert.ok(gradQaaDomains.length >= 6, 'Graduate Research + QAA Biosciences must return matching domains');

  // Incompatible combination: School (6–8) + Harvard Pathways MD should return empty (no fallback domain)
  const emptyDomains = getVisibleDomainsForFilter('school_foundations', 'hms_pathways');
  assert.deepEqual(emptyDomains, [], 'Incompatible track + framework must return [] with no silent fallback');
});

test('level-appropriate depth resolver returns differentiated explanations, schematic links, and honest asset disclosures', () => {
  const cellTopic = EDUCATION_TOPICS.find((t) => t.id === 'edu-cell-organelles-transport');
  assert.ok(cellTopic);
  const school = resolveExplanationForTrack(cellTopic, 'school_foundations');
  const med = resolveExplanationForTrack(cellTopic, 'medical_foundations');
  const grad = resolveExplanationForTrack(cellTopic, 'graduate_research');
  assert.equal(school.trackUsed, 'school_foundations');
  assert.equal(med.trackUsed, 'medical_foundations');
  assert.equal(grad.trackUsed, 'graduate_research');
  assert.notEqual(school.text, med.text, 'School and medical explanations must differ in depth');
  assert.notEqual(med.text, grad.text, 'Medical and graduate_research explanations must differ in depth');

  for (const tp of EDUCATION_TOPICS) {
    assert.ok(
      tp.diagram && tp.diagram.links && tp.diagram.links.length >= 1,
      `Topic ${tp.id} diagram must include explicit directed links for interactive node filtering`,
    );
  }

  const histDomain = EDUCATION_DOMAINS.find((d) => d.id === 'histology');
  const radDomain = EDUCATION_DOMAINS.find((d) => d.id === 'radiology_imaging');
  assert.equal(histDomain?.coverageStatus, 'asset_missing');
  assert.equal(radDomain?.coverageStatus, 'asset_missing');

  for (const dom of EDUCATION_DOMAINS) {
    assert.ok(getTopicsByDomain(dom.id).length >= 1, `Domain ${dom.id} must have at least 1 topic`);
  }
});
