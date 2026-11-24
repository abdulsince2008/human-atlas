import PptxGenJS from 'pptxgenjs';
import { jsPDF } from 'jspdf';
import type { ChapterPresentationDeck, EducationTopic } from '../education/education-types';
import { EDUCATION_TOPICS, resolveExplanationForTrack } from '../education/education-content';
import { resolveReadingLinks } from '../education/verified-sources';
import {
  ACADEMIC_DEPTH_LABELS,
  SYSTEM_TEACHING_METADATA,
  TOPIC_DEPTH_SUPPLEMENTS,
} from '../learning-supplements';
import {
  REGISTRY_COVERAGE_LABELS,
  REGISTRY_REVIEW_LABELS,
} from '../registry/knowledge-registry';
import {
  getEducatorQuestionsForTopics,
  resolveEducatorTopicSelection,
  type UniversalEducatorExportOptions,
} from './educator-export';

type PptxConstructor = new () => PptxGenJS;

function createPptxInstance(): PptxGenJS {
  const mod = PptxGenJS as unknown as PptxConstructor | { default?: PptxConstructor };
  const Ctor =
    typeof mod === 'function'
      ? mod
      : typeof mod?.default === 'function'
        ? mod.default
        : null;
  if (!Ctor) {
    throw new Error('Could not resolve PptxGenJS constructor.');
  }
  return new Ctor();
}

export function triggerBinaryDownload(
  filename: string,
  bytes: Uint8Array,
  mimeType: string,
): void {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy.buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// 1. Real .pptx Presentation Exports (Chapter 9-Slide Deck + Educator Deck)
// ---------------------------------------------------------------------------

export async function buildChapterPresentationPptx(
  deck: ChapterPresentationDeck,
  chapterCode?: string,
): Promise<Uint8Array> {
  const pptx = createPptxInstance();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = deck.author;
  pptx.subject = deck.title;
  pptx.title = deck.title;

  for (const s of deck.slides) {
    const slide = pptx.addSlide();
    slide.background = { color: s.slideNumber === 1 ? '0F4C5C' : 'F8FAFC' };

    const isTitleSlide = s.slideNumber === 1;
    const headerColor = isTitleSlide ? 'FFFFFF' : '0F172A';
    const subColor = isTitleSlide ? 'CCFBF1' : '0F766E';
    const bodyColor = isTitleSlide ? 'F1F5F9' : '1E293B';

    slide.addText(
      `${chapterCode ?? deck.chapterId} · Slide ${s.slideNumber} of ${deck.slides.length}`,
      {
        x: 0.6,
        y: 0.35,
        w: 11.8,
        h: 0.3,
        fontSize: 10,
        bold: true,
        color: subColor,
      },
    );

    slide.addText(s.title, {
      x: 0.6,
      y: isTitleSlide ? 1.1 : 0.72,
      w: 12.1,
      h: isTitleSlide ? 1.0 : 0.7,
      fontSize: isTitleSlide ? 26 : 20,
      bold: true,
      color: headerColor,
      valign: 'top',
    });

    let bodyStartY = isTitleSlide ? 2.25 : 1.5;
    if (s.subtitle) {
      slide.addText(s.subtitle, {
        x: 0.6,
        y: bodyStartY,
        w: 12.1,
        h: 0.45,
        fontSize: 12,
        italic: true,
        color: subColor,
        valign: 'top',
      });
      bodyStartY += 0.52;
    }

    if (s.tableRows && s.tableRows.length > 0) {
      const tableData: PptxGenJS.TableRow[] = [
        [
          { text: 'Dimension', options: { bold: true, fill: { color: '0F766E' }, color: 'FFFFFF' } },
          { text: 'Primary Focus', options: { bold: true, fill: { color: '0F766E' }, color: 'FFFFFF' } },
          { text: 'Comparator', options: { bold: true, fill: { color: '0F766E' }, color: 'FFFFFF' } },
          { text: 'Clinical / Functional Note', options: { bold: true, fill: { color: '0F766E' }, color: 'FFFFFF' } },
        ],
        ...s.tableRows.slice(0, 6).map((r) => [
          { text: r.dimension, options: { bold: true } },
          { text: r.primary },
          { text: r.comparator },
          { text: r.clinicalOrFunctionalNote },
        ]),
      ];
      slide.addTable(tableData, {
        x: 0.6,
        y: bodyStartY,
        w: 12.1,
        fontSize: 11,
        color: '1E293B',
        border: { type: 'solid', color: 'CBD5E1', pt: 1 },
        fill: { color: 'FFFFFF' },
      });
    } else if (s.quizPrompt) {
      const quizLines: PptxGenJS.TextProps[] = [
        { text: `${s.quizPrompt.question}\n`, options: { bold: true, breakLine: true } },
        ...s.quizPrompt.options.map((opt, idx) => ({
          text: `${String.fromCharCode(65 + idx)}) ${opt}`,
          options: { bullet: false, breakLine: true },
        })),
        {
          text: `\nAnswer Key: ${s.quizPrompt.options[s.quizPrompt.correctIndex] ?? ''} — ${s.quizPrompt.explanation}`,
          options: { italic: true, color: '0F766E', breakLine: true },
        },
      ];
      slide.addText(quizLines, {
        x: 0.6,
        y: bodyStartY,
        w: 12.1,
        h: 4.8,
        fontSize: 14,
        color: bodyColor,
        valign: 'top',
      });
    } else if (s.bullets.length > 0) {
      const bulletProps: PptxGenJS.TextProps[] = s.bullets.slice(0, 8).map((b) => ({
        text: b,
        options: { bullet: true, breakLine: true, paraSpaceAfter: 6 },
      }));
      slide.addText(bulletProps, {
        x: 0.6,
        y: bodyStartY,
        w: 12.1,
        h: 7.0 - bodyStartY - 0.55,
        fontSize: isTitleSlide ? 14 : 13.5,
        color: bodyColor,
        valign: 'top',
      });
    }

    slide.addText(
      `ANATOMY 360 Educational Deck · ${deck.licence} · Status: awaiting_academic_review`,
      {
        x: 0.6,
        y: 6.95,
        w: 12.1,
        h: 0.28,
        fontSize: 8.5,
        color: isTitleSlide ? 'CBD5E1' : '64748B',
      },
    );

    if (s.speakerNote) {
      slide.addNotes(s.speakerNote);
    }
  }

  const out = (await pptx.write({ outputType: 'uint8array' })) as Uint8Array;
  return out instanceof Uint8Array ? out : new Uint8Array(out as ArrayBuffer);
}

export async function buildUniversalEducatorPptx(
  options: UniversalEducatorExportOptions,
): Promise<Uint8Array> {
  const tierMeta = ACADEMIC_DEPTH_LABELS[options.tier];
  const { title, subtitle, topics, knownGaps } = resolveEducatorTopicSelection(options);
  const questions = getEducatorQuestionsForTopics(topics, options.tier);
  const isOutline = options.exportKind === 'lecture_outline';
  const includeAnswerKey = options.includeAnswerKey ?? !isOutline;

  const pptx = createPptxInstance();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.title = title;
  pptx.author = 'Anatomy 360 Teacher & Professor Workspace';

  // Slide 1: Cover
  const cover = pptx.addSlide();
  cover.background = { color: '0F4C5C' };
  cover.addText(
    isOutline ? 'LECTURE & SEMINAR SLIDE DECK' : 'STUDENT WORKSHEET & DISCUSSION SLIDES',
    { x: 0.7, y: 0.7, w: 11.8, h: 0.4, fontSize: 12, bold: true, color: '99F6E4' },
  );
  cover.addText(title, {
    x: 0.7,
    y: 1.35,
    w: 11.8,
    h: 1.4,
    fontSize: 28,
    bold: true,
    color: 'FFFFFF',
    valign: 'top',
  });
  cover.addText(
    [
      subtitle ? `Context: ${subtitle}` : null,
      `Academic Tier: ${tierMeta.full}`,
      `Sequenced Topics: ${topics.length} · Assessment Items: ${questions.length}`,
      'Review Governance: Structured educational reference (pending human faculty review)',
    ]
      .filter(Boolean)
      .join('\n'),
    { x: 0.7, y: 3.1, w: 11.8, h: 2.2, fontSize: 14, color: 'E2E8F0', valign: 'top' },
  );

  // Slide 2: Learning Outcomes
  const seenOutcomes = new Set<string>();
  const outcomes: string[] = [];
  for (const tp of topics) {
    for (const lo of tp.learningOutcomes) {
      if (!seenOutcomes.has(lo.statement)) {
        seenOutcomes.add(lo.statement);
        outcomes.push(lo.statement);
      }
    }
  }
  const outcomeSlide = pptx.addSlide();
  outcomeSlide.background = { color: 'F8FAFC' };
  outcomeSlide.addText('Learning Outcomes Across Teaching Sequence', {
    x: 0.6,
    y: 0.55,
    w: 12.1,
    h: 0.6,
    fontSize: 22,
    bold: true,
    color: '0F172A',
  });
  outcomeSlide.addText(
    (outcomes.length > 0 ? outcomes : ['Review domain topics in teaching order.'])
      .slice(0, 10)
      .map((o) => ({ text: o, options: { bullet: true, breakLine: true, paraSpaceAfter: 6 } })),
    { x: 0.6, y: 1.35, w: 12.1, h: 5.2, fontSize: 13.5, color: '1E293B', valign: 'top' },
  );

  // Slides for Sequenced Topics (capped neatly at 16 slides so deck stays fast & classroom-usable)
  for (const [idx, tp] of topics.slice(0, 16).entries()) {
    const s = pptx.addSlide();
    s.background = { color: 'FFFFFF' };
    s.addText(`Topic ${idx + 1} · ${tp.chapterTitle}`, {
      x: 0.6,
      y: 0.35,
      w: 12.1,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: '0F766E',
    });
    s.addText(tp.title, {
      x: 0.6,
      y: 0.72,
      w: 12.1,
      h: 0.65,
      fontSize: 21,
      bold: true,
      color: '0F172A',
    });

    let bodyText = tp.summary;
    if (tp.sourceKind === 'anatomy_lesson_topic') {
      const sup = TOPIC_DEPTH_SUPPLEMENTS[tp.id];
      bodyText = sup ? sup[options.tier] : tp.summary;
    } else if (tp.sourceKind === 'education_topic') {
      const et = EDUCATION_TOPICS.find((e) => e.id === tp.id);
      const trackForTier =
        options.tier === 'school_9_12'
          ? 'secondary_premed'
          : options.tier === 'bs_mbbs'
            ? 'medical_foundations'
            : 'graduate_research';
      if (et) bodyText = resolveExplanationForTrack(et, trackForTier).text;
    }

    const bullets: PptxGenJS.TextProps[] = [
      { text: bodyText.slice(0, 620), options: { bullet: false, breakLine: true, paraSpaceAfter: 10 } },
      {
        text: `Coverage: ${REGISTRY_COVERAGE_LABELS[tp.coverageStatus]} · Review: ${REGISTRY_REVIEW_LABELS[tp.reviewStatus]}`,
        options: { bullet: true, breakLine: true, color: '475569' },
      },
    ];
    if (tp.keyTerms.length > 0) {
      bullets.push({
        text: `Key Terms: ${tp.keyTerms.slice(0, 6).join(', ')}`,
        options: { bullet: true, breakLine: true, color: '0F766E' },
      });
    }
    s.addText(bullets, {
      x: 0.6,
      y: 1.5,
      w: 12.1,
      h: 5.0,
      fontSize: 13.5,
      color: '1E293B',
      valign: 'top',
    });
  }

  // Assessment Slide(s)
  if (questions.length > 0) {
    const qSlide = pptx.addSlide();
    qSlide.background = { color: 'F8FAFC' };
    qSlide.addText(`Concept Check Assessment Items (${questions.length})`, {
      x: 0.6,
      y: 0.5,
      w: 12.1,
      h: 0.6,
      fontSize: 20,
      bold: true,
      color: '0F172A',
    });
    const qLines: PptxGenJS.TextProps[] = questions.slice(0, 4).flatMap((q, qi) => [
      {
        text: `${qi + 1}. ${q.prompt}`,
        options: { bold: true, breakLine: true, paraSpaceAfter: 2 },
      },
      {
        text: q.options.map((o, oi) => `${String.fromCharCode(65 + oi)}) ${o}`).join('   '),
        options: { breakLine: true, paraSpaceAfter: 8, color: '334155' },
      },
    ]);
    qSlide.addText(qLines, {
      x: 0.6,
      y: 1.25,
      w: 12.1,
      h: 5.4,
      fontSize: 12,
      color: '0F172A',
      valign: 'top',
    });

    if (includeAnswerKey) {
      const kSlide = pptx.addSlide();
      kSlide.background = { color: 'FFFFFF' };
      kSlide.addText('Instructor Answer Key & Rationale', {
        x: 0.6,
        y: 0.5,
        w: 12.1,
        h: 0.6,
        fontSize: 20,
        bold: true,
        color: '0F766E',
      });
      kSlide.addText(
        questions.slice(0, 6).map((q, qi) => ({
          text: `${qi + 1}. ${String.fromCharCode(65 + q.correctIndex)}) ${q.options[q.correctIndex] ?? ''} — ${q.explanation}`,
          options: { bullet: false, breakLine: true, paraSpaceAfter: 6 },
        })),
        { x: 0.6, y: 1.25, w: 12.1, h: 5.4, fontSize: 11.5, color: '1E293B', valign: 'top' },
      );
    }
  }

  // Limitations & Attribution slide
  if (knownGaps.length > 0 || topics.some((t) => t.systemId)) {
    const gapSlide = pptx.addSlide();
    gapSlide.background = { color: 'FFFBEB' };
    gapSlide.addText('Coverage Notes, Asset Disclosures & Misconceptions', {
      x: 0.6,
      y: 0.5,
      w: 12.1,
      h: 0.6,
      fontSize: 20,
      bold: true,
      color: '78350F',
    });
    const firstSys = topics.find((t) => t.systemId)?.systemId;
    const guide = firstSys ? SYSTEM_TEACHING_METADATA[firstSys] : null;
    const notes: string[] = [
      ...Array.from(new Set(knownGaps)).slice(0, 5),
      ...(guide?.commonMisconceptions.slice(0, 2).map((m) => `Misconception watch: ${m}`) ?? []),
    ];
    gapSlide.addText(
      notes.map((n) => ({ text: n, options: { bullet: true, breakLine: true, paraSpaceAfter: 6 } })),
      { x: 0.6, y: 1.3, w: 12.1, h: 5.2, fontSize: 13, color: '451A03', valign: 'top' },
    );
  }

  const out = (await pptx.write({ outputType: 'uint8array' })) as Uint8Array;
  return out instanceof Uint8Array ? out : new Uint8Array(out as ArrayBuffer);
}

// ---------------------------------------------------------------------------
// 2. Real Printable .pdf Exports (Study Guide, Slide Handout, Educator Pack)
// ---------------------------------------------------------------------------

class PdfWriter {
  doc: jsPDF;
  y = 18;
  readonly margin = 15;
  readonly maxWidth = 180;
  readonly pageHeight = 282;

  constructor() {
    this.doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  }

  private ensureSpace(neededMm: number) {
    if (this.y + neededMm > this.pageHeight) {
      this.doc.addPage();
      this.y = 18;
    }
  }

  addTitle(text: string) {
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(16);
    this.doc.setTextColor(15, 76, 92);
    const lines = this.doc.splitTextToSize(text, this.maxWidth) as string[];
    this.ensureSpace(lines.length * 7 + 4);
    this.doc.text(lines, this.margin, this.y);
    this.y += lines.length * 7 + 3;
  }

  addHeading(text: string) {
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(11.5);
    this.doc.setTextColor(15, 23, 42);
    const lines = this.doc.splitTextToSize(text, this.maxWidth) as string[];
    this.ensureSpace(lines.length * 5.5 + 4);
    this.y += 2;
    this.doc.text(lines, this.margin, this.y);
    this.y += lines.length * 5.5 + 1.5;
  }

  addParagraph(text: string, muted = false) {
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(muted ? 100 : 30, muted ? 116 : 41, muted ? 139 : 59);
    const lines = this.doc.splitTextToSize(text, this.maxWidth) as string[];
    for (const line of lines) {
      this.ensureSpace(5);
      this.doc.text(line, this.margin, this.y);
      this.y += 4.6;
    }
    this.y += 1.5;
  }

  addBullet(text: string) {
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(30, 41, 59);
    const lines = this.doc.splitTextToSize(`• ${text}`, this.maxWidth - 3) as string[];
    for (const line of lines) {
      this.ensureSpace(5);
      this.doc.text(line, this.margin + 2, this.y);
      this.y += 4.5;
    }
  }

  toBytes(): Uint8Array {
    const ab = this.doc.output('arraybuffer');
    return new Uint8Array(ab);
  }
}

export function buildChapterPresentationPdf(
  deck: ChapterPresentationDeck,
  chapterCode?: string,
): Uint8Array {
  const w = new PdfWriter();
  w.addTitle(`${chapterCode ? `${chapterCode} — ` : ''}${deck.title}`);
  w.addParagraph(
    `Author: ${deck.author} | Licence: ${deck.licence} | Slides: ${deck.slides.length} | Status: awaiting_academic_review`,
    true,
  );

  for (const s of deck.slides) {
    w.addHeading(`Slide ${s.slideNumber}: ${s.title}`);
    if (s.subtitle) w.addParagraph(s.subtitle, true);
    for (const b of s.bullets) w.addBullet(b);
    if (s.tableRows && s.tableRows.length > 0) {
      for (const r of s.tableRows) {
        w.addBullet(`${r.dimension}: ${r.primary} vs. ${r.comparator} (${r.clinicalOrFunctionalNote})`);
      }
    }
    if (s.quizPrompt) {
      w.addParagraph(`Knowledge Check: ${s.quizPrompt.question}`);
      s.quizPrompt.options.forEach((opt, i) => w.addBullet(`${String.fromCharCode(65 + i)}) ${opt}`));
      w.addParagraph(
        `Answer: ${s.quizPrompt.options[s.quizPrompt.correctIndex] ?? ''} — ${s.quizPrompt.explanation}`,
        true,
      );
    }
    if (s.speakerNote) {
      w.addParagraph(`Speaker Notes: ${s.speakerNote}`, true);
    }
  }

  return w.toBytes();
}

export function buildChapterStudyGuidePdf(
  topic: EducationTopic,
  trackLabel: string,
  explanationText: string,
): Uint8Array {
  const w = new PdfWriter();
  w.addTitle(`${topic.chapterCode ? `${topic.chapterCode}: ` : ''}${topic.chapterTitle} — ${topic.title}`);
  w.addParagraph(
    `Academic Track Depth: ${trackLabel} | Review Status: ${topic.completionTracker?.reviewStatus ?? topic.reviewStatus} (educational reference; not faculty-certified)`,
    true,
  );
  w.addParagraph(topic.summary);

  w.addHeading('Learning Objectives');
  for (const obj of topic.learningObjectives) w.addBullet(obj);

  w.addHeading('Detailed Study Explanation');
  w.addParagraph(explanationText);

  if (topic.mechanisms && topic.mechanisms.length > 0) {
    w.addHeading('Key Mechanisms');
    for (const m of topic.mechanisms) w.addBullet(m);
  }

  if (topic.comparisonTable && topic.comparisonTable.rows.length > 0) {
    w.addHeading(`Comparison: ${topic.comparisonTable.columnA} vs. ${topic.comparisonTable.columnB}`);
    for (const row of topic.comparisonTable.rows) {
      w.addBullet(`${row.dimension}: ${row.primary} vs. ${row.comparator} — ${row.clinicalOrFunctionalNote}`);
    }
  }

  const readings = topic.readingLinks ?? resolveReadingLinks([]);
  if (readings.length > 0) {
    w.addHeading('Verified Open Reading References');
    for (const rl of readings) {
      w.addBullet(`${rl.title} (${rl.authorOrPublisher}, ${rl.licence}): ${rl.url}`);
    }
  }

  return w.toBytes();
}

export function buildUniversalEducatorPdf(options: UniversalEducatorExportOptions): Uint8Array {
  const tierMeta = ACADEMIC_DEPTH_LABELS[options.tier];
  const { title, subtitle, topics, knownGaps } = resolveEducatorTopicSelection(options);
  const isOutline = options.exportKind === 'lecture_outline';
  const includeAnswerKey = options.includeAnswerKey ?? !isOutline;
  const questions = getEducatorQuestionsForTopics(topics, options.tier);

  const w = new PdfWriter();
  w.addTitle(
    isOutline
      ? 'Anatomy 360 — Instructor Lecture & Seminar Outline'
      : 'Anatomy 360 — Student Activity & Assessment Worksheet',
  );
  w.addParagraph(
    `Scope: ${title}${subtitle ? ` | ${subtitle}` : ''} | Tier: ${tierMeta.full} | Topics: ${topics.length}`,
    true,
  );

  w.addHeading('1. Learning Outcomes Across Teaching Sequence');
  const seenOutcomes = new Set<string>();
  for (const tp of topics) {
    for (const lo of tp.learningOutcomes) {
      if (!seenOutcomes.has(lo.statement)) {
        seenOutcomes.add(lo.statement);
        w.addBullet(lo.statement);
      }
    }
  }

  w.addHeading('2. Sequenced Topics & Teaching Notes');
  topics.forEach((tp, idx) => {
    w.addHeading(`${idx + 1}. ${tp.title} (${tp.chapterTitle})`);
    if (tp.sourceKind === 'anatomy_lesson_topic') {
      const sup = TOPIC_DEPTH_SUPPLEMENTS[tp.id];
      w.addParagraph(sup ? sup[options.tier] : tp.summary);
    } else if (tp.sourceKind === 'education_topic') {
      const et = EDUCATION_TOPICS.find((e) => e.id === tp.id);
      const trackForTier =
        options.tier === 'school_9_12'
          ? 'secondary_premed'
          : options.tier === 'bs_mbbs'
            ? 'medical_foundations'
            : 'graduate_research';
      w.addParagraph(et ? resolveExplanationForTrack(et, trackForTier).text : tp.summary);
    } else {
      w.addParagraph(tp.summary);
    }
  });

  if (knownGaps.length > 0) {
    w.addHeading('3. Coverage Scope & Honest Asset Limitations');
    for (const gap of Array.from(new Set(knownGaps)).slice(0, 8)) {
      w.addBullet(gap);
    }
  }

  if (questions.length > 0) {
    w.addHeading('4. Concept Check Assessment Items');
    questions.forEach((q, idx) => {
      w.addParagraph(`${idx + 1}. [${q.sourceLabel}] ${q.prompt}`);
      q.options.forEach((opt, optIdx) => {
        w.addBullet(`${String.fromCharCode(65 + optIdx)}) ${opt}`);
      });
    });

    if (includeAnswerKey) {
      w.addHeading('Instructor Answer Key & Rationale');
      questions.forEach((q, idx) => {
        const letter = String.fromCharCode(65 + q.correctIndex);
        w.addBullet(`${idx + 1}. Answer ${letter}) ${q.options[q.correctIndex] ?? ''} — ${q.explanation}`);
      });
    }
  }

  w.addParagraph(
    'Generated from Anatomy 360 educational reference modules. Structured reference only — awaiting qualified faculty review.',
    true,
  );
  return w.toBytes();
}
