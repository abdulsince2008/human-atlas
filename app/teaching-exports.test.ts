import assert from 'node:assert/strict';
import test from 'node:test';
import { EDUCATION_TOPICS } from './education/education-content';
import {
  buildChapterPresentationPdf,
  buildChapterPresentationPptx,
  buildChapterStudyGuidePdf,
  buildUniversalEducatorPdf,
  buildUniversalEducatorPptx,
} from './utils/teaching-exports';

test('Chapter Presentation exports generate valid non-empty PPTX (ZIP/OOXML) and PDF buffers', async () => {
  const sampleChapter = EDUCATION_TOPICS[0];
  assert.ok(sampleChapter?.presentationDeck);

  const pptxBytes = await buildChapterPresentationPptx(
    sampleChapter.presentationDeck,
    sampleChapter.chapterCode,
  );
  assert.ok(pptxBytes.byteLength > 10_000, `Expected non-trivial PPTX output, got ${pptxBytes.byteLength} bytes`);
  // ZIP magic bytes: PK\x03\x04
  assert.equal(pptxBytes[0], 0x50);
  assert.equal(pptxBytes[1], 0x4b);

  const pdfBytes = buildChapterPresentationPdf(
    sampleChapter.presentationDeck,
    sampleChapter.chapterCode,
  );
  const pdfHeader = new TextDecoder().decode(pdfBytes.slice(0, 5));
  assert.equal(pdfHeader, '%PDF-');
  assert.ok(pdfBytes.byteLength > 2_000);

  const guidePdf = buildChapterStudyGuidePdf(
    sampleChapter,
    'Medical Foundations',
    sampleChapter.depthExplanations.medical_foundations ?? sampleChapter.summary,
  );
  assert.equal(new TextDecoder().decode(guidePdf.slice(0, 5)), '%PDF-');
  assert.ok(guidePdf.byteLength > 1_500);
});

test('Universal Educator Workspace exports generate valid PDF and PPTX for lecture outlines and worksheets', async () => {
  const outlinePdf = buildUniversalEducatorPdf({
    sourceKind: 'domain',
    domainId: 'human_anatomy',
    tier: 'bs_mbbs',
    exportKind: 'lecture_outline',
  });
  assert.equal(new TextDecoder().decode(outlinePdf.slice(0, 5)), '%PDF-');
  assert.ok(outlinePdf.byteLength > 3_000);

  const worksheetPdf = buildUniversalEducatorPdf({
    sourceKind: 'domain',
    domainId: 'pharmacology',
    tier: 'school_9_12',
    exportKind: 'student_worksheet',
    includeAnswerKey: false,
  });
  assert.equal(new TextDecoder().decode(worksheetPdf.slice(0, 5)), '%PDF-');

  const educatorPptx = await buildUniversalEducatorPptx({
    sourceKind: 'framework',
    frameworkId: 'pk_pmdc_mbbs',
    tier: 'bs_mbbs',
    exportKind: 'lecture_outline',
  });
  assert.equal(educatorPptx[0], 0x50);
  assert.equal(educatorPptx[1], 0x4b);
  assert.ok(educatorPptx.byteLength > 10_000);
});
