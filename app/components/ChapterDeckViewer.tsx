import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Presentation,
  XCircle,
} from 'lucide-react';
import type { ChapterPresentationDeck, ChapterPresentationSlide } from '../education/education-types';
import {
  buildChapterPresentationPdf,
  buildChapterPresentationPptx,
  triggerBinaryDownload,
} from '../utils/teaching-exports';

interface Props {
  deck: ChapterPresentationDeck;
  chapterCode?: string;
}

const SLIDE_SHORT_LABELS: Record<ChapterPresentationSlide['slideType'], string> = {
  title: 'Scope',
  objectives: 'Goals',
  concepts: 'Concepts',
  mechanisms: 'Mechanism',
  visual: 'Visual',
  comparison: 'Compare',
  applied_case: 'Applied',
  knowledge_check: 'Quiz',
  summary: 'Summary',
  references: 'Refs',
};

const SLIDE_TYPE_LABELS: Record<ChapterPresentationSlide['slideType'], string> = {
  title: '01 · Title & Scope',
  objectives: '02 · Learning Objectives',
  concepts: '03 · Foundational Concepts',
  mechanisms: '04 · Core Mechanisms',
  visual: '05 · Labelled Conceptual Visual',
  comparison: '06 · Structured Comparison',
  applied_case: '07 · Applied Clinical/Lab Case',
  knowledge_check: '08 · Interactive Knowledge Check',
  summary: '09 · Summary & References',
  references: '10 · References',
};

function buildDeckMarkdown(deck: ChapterPresentationDeck, chapterCode?: string): string {
  const lines: string[] = [
    `# ${deck.title}`,
    '',
    `- **Chapter**: ${chapterCode ?? deck.chapterId}`,
    `- **Author**: ${deck.author}`,
    `- **Licence**: ${deck.licence}`,
    `- **Slides**: ${deck.slides.length}`,
    '',
    '---',
    '',
  ];

  for (const slide of deck.slides) {
    lines.push(`## Slide ${slide.slideNumber}: ${slide.title}`);
    if (slide.subtitle) lines.push(`*${slide.subtitle}*`, '');
    for (const b of slide.bullets) {
      lines.push(`- ${b}`);
    }
    if (slide.tableRows && slide.tableRows.length > 0) {
      lines.push('', '| Dimension | Primary Concept | Comparator | Clinical / Functional Note |');
      lines.push('| --- | --- | --- | --- |');
      for (const row of slide.tableRows) {
        lines.push(`| ${row.dimension} | ${row.primary} | ${row.comparator} | ${row.clinicalOrFunctionalNote} |`);
      }
    }
    if (slide.quizPrompt) {
      lines.push('', `**Knowledge Check:** ${slide.quizPrompt.question}`);
      slide.quizPrompt.options.forEach((opt, i) => {
        lines.push(`${i + 1}. ${opt}`);
      });
      lines.push(
        '',
        `**Answer:** ${slide.quizPrompt.options[slide.quizPrompt.correctIndex] ?? ''}`,
        `**Explanation:** ${slide.quizPrompt.explanation}`,
      );
    }
    if (slide.speakerNote) {
      lines.push('', `> **Speaker Notes:** ${slide.speakerNote}`);
    }
    lines.push('', '---', '');
  }

  return lines.join('\n');
}

export default function ChapterDeckViewer({ deck, chapterCode }: Props) {
  const [slideIdx, setSlideIdx] = useState(0);
  const [showNotes, setShowNotes] = useState(true);
  const [selectedQuizIdx, setSelectedQuizIdx] = useState<number | null>(null);
  const [exportingFormat, setExportingFormat] = useState<'pptx' | 'pdf' | null>(null);

  useEffect(() => {
    setSlideIdx(0);
    setSelectedQuizIdx(null);
  }, [deck.id]);

  const slides = deck.slides;
  const activeSlide = slides[slideIdx] ?? slides[0];

  if (!activeSlide) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
        No slides defined for this presentation deck.
      </div>
    );
  }

  const handleDownloadDeck = () => {
    const md = buildDeckMarkdown(deck, chapterCode);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(chapterCode ?? deck.id).toLowerCase()}-presentation-deck.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPptx = async () => {
    setExportingFormat('pptx');
    try {
      const bytes = await buildChapterPresentationPptx(deck, chapterCode);
      triggerBinaryDownload(
        `${(chapterCode ?? deck.id).toLowerCase()}-presentation-deck.pptx`,
        bytes,
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      );
    } finally {
      setExportingFormat(null);
    }
  };

  const handleDownloadPdf = () => {
    setExportingFormat('pdf');
    try {
      const bytes = buildChapterPresentationPdf(deck, chapterCode);
      triggerBinaryDownload(
        `${(chapterCode ?? deck.id).toLowerCase()}-presentation-deck.pdf`,
        bytes,
        'application/pdf',
      );
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Deck Header & Action Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-600 font-mono tabular-nums">
            <span className="inline-flex items-center gap-1.5 font-semibold text-teal-800">
              <Presentation size={14} className="shrink-0" />
              <span>Engine-Generated Chapter Deck</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>{slides.length} slides</span>
          </div>
          <h4 className="text-base font-bold leading-snug text-slate-900">{deck.title}</h4>
          <p className="text-xs text-slate-600">
            Author: {deck.author} · {deck.licence}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNotes((v) => !v)}
            aria-expanded={showNotes}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 whitespace-nowrap shrink-0"
          >
            <FileText size={13} />
            <span>{showNotes ? 'Hide Speaker Notes' : 'Show Speaker Notes'}</span>
          </button>
          <button
            type="button"
            disabled={exportingFormat !== null}
            onClick={handleDownloadPptx}
            data-testid="download-deck-pptx"
            className="inline-flex items-center gap-1.5 rounded-lg border border-teal-700 bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 whitespace-nowrap shrink-0 disabled:opacity-60"
          >
            <Download size={13} />
            <span>{exportingFormat === 'pptx' ? 'Building .pptx…' : 'Download Slides (.pptx)'}</span>
          </button>
          <button
            type="button"
            disabled={exportingFormat !== null}
            onClick={handleDownloadPdf}
            data-testid="download-deck-pdf"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 whitespace-nowrap shrink-0 disabled:opacity-60"
          >
            <Download size={13} />
            <span>Download Slides (.pdf)</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadDeck}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 whitespace-nowrap shrink-0"
          >
            <Download size={13} />
            <span>Download (.md)</span>
          </button>
        </div>
      </div>

      {/* Numbered Slide Grid (all 1–9 visible cleanly without horizontal clipping) */}
      <div
        className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 lg:grid-cols-9"
        role="tablist"
        aria-label="Presentation slide selector"
      >
        {slides.map((s, idx) => {
          const isCurrent = idx === slideIdx;
          const shortType = SLIDE_SHORT_LABELS[s.slideType] ?? `Slide ${s.slideNumber}`;
          return (
            <button
              key={s.slideNumber}
              type="button"
              role="tab"
              aria-selected={isCurrent}
              title={`Slide ${s.slideNumber}: ${s.title}`}
              onClick={() => {
                setSlideIdx(idx);
                setSelectedQuizIdx(null);
              }}
              className={`flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                isCurrent
                  ? 'border-teal-700 bg-teal-700 text-white shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="font-mono tabular-nums font-bold">{s.slideNumber}</span>
              <span className="text-[11px]">{shortType}</span>
            </button>
          );
        })}
      </div>

      {/* Main Slide Canvas */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <p className="font-mono text-xs font-semibold text-teal-800 tabular-nums">
              Slide {activeSlide.slideNumber} of {slides.length} · {SLIDE_TYPE_LABELS[activeSlide.slideType] ?? activeSlide.slideType}
            </p>
            <h5 className="mt-1 text-lg font-bold text-slate-900">{activeSlide.title}</h5>
            {activeSlide.subtitle && (
              <p className="mt-0.5 text-xs text-slate-600">{activeSlide.subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={slideIdx === 0}
              onClick={() => {
                setSlideIdx((i) => Math.max(0, i - 1));
                setSelectedQuizIdx(null);
              }}
              aria-label="Previous slide"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <ChevronLeft size={14} />
              <span>Prev</span>
            </button>
            <button
              type="button"
              disabled={slideIdx >= slides.length - 1}
              onClick={() => {
                setSlideIdx((i) => Math.min(slides.length - 1, i + 1));
                setSelectedQuizIdx(null);
              }}
              aria-label="Next slide"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Slide Bullets (omitted on Slide 8 when interactive quiz prompt is rendered cleanly below) */}
        {activeSlide.bullets.length > 0 && !activeSlide.quizPrompt && (
          <ul className="space-y-2.5 text-sm leading-relaxed text-slate-800">
            {activeSlide.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-sm bg-teal-700" aria-hidden="true" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Structured Comparison Table (typically Slide 6) */}
        {activeSlide.tableRows && activeSlide.tableRows.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">Dimension</th>
                  <th className="px-3 py-2.5">Primary Focus</th>
                  <th className="px-3 py-2.5">Comparator</th>
                  <th className="px-3 py-2.5">Functional / Clinical Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 tabular-nums">
                {activeSlide.tableRows.map((row) => (
                  <tr key={row.dimension} className="hover:bg-slate-50/70">
                    <td className="px-3 py-2.5 font-semibold text-slate-900">{row.dimension}</td>
                    <td className="px-3 py-2.5">{row.primary}</td>
                    <td className="px-3 py-2.5">{row.comparator}</td>
                    <td className="px-3 py-2.5 text-slate-600">{row.clinicalOrFunctionalNote}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Interactive Slide 8 Knowledge Check */}
        {activeSlide.quizPrompt && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-900">{activeSlide.quizPrompt.question}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label={activeSlide.quizPrompt.question}>
              {activeSlide.quizPrompt.options.map((opt, idx) => {
                const chosen = selectedQuizIdx === idx;
                const answered = selectedQuizIdx !== null;
                let btnStyle = 'border-slate-200 bg-white text-slate-800 hover:border-teal-600';
                if (answered) {
                  if (idx === activeSlide.quizPrompt!.correctIndex) {
                    btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold';
                  } else if (chosen) {
                    btnStyle = 'border-rose-400 bg-rose-50 text-rose-950';
                  }
                }
                return (
                  <button
                    key={opt}
                    type="button"
                    role="radio"
                    aria-checked={chosen}
                    onClick={() => setSelectedQuizIdx(idx)}
                    className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${btnStyle}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {selectedQuizIdx !== null && (
              <div
                className={`flex items-start gap-2 rounded-lg p-3 text-xs ${
                  selectedQuizIdx === activeSlide.quizPrompt.correctIndex
                    ? 'bg-emerald-50 text-emerald-950 border border-emerald-200'
                    : 'bg-rose-50 text-rose-950 border border-rose-200'
                }`}
              >
                {selectedQuizIdx === activeSlide.quizPrompt.correctIndex ? (
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-700" />
                ) : (
                  <XCircle size={15} className="mt-0.5 shrink-0 text-rose-700" />
                )}
                <p>{activeSlide.quizPrompt.explanation}</p>
              </div>
            )}
          </div>
        )}

        {/* Speaker Notes */}
        {showNotes && activeSlide.speakerNote && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700">
            <p className="font-semibold text-slate-900">Presenter &amp; Study Notes</p>
            <p className="mt-1 leading-relaxed">{activeSlide.speakerNote}</p>
          </div>
        )}
      </div>

      {/* External Presentation Disclosure & References */}
      {(deck.externalSlideNote || (deck.externalReferences && deck.externalReferences.length > 0)) && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-700 space-y-2">
          {deck.externalSlideNote && <p>{deck.externalSlideNote}</p>}
          {deck.externalReferences && deck.externalReferences.length > 0 && (
            <ul className="space-y-1.5 pt-1">
              {deck.externalReferences.map((ref) => (
                <li key={ref.url} className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-900">{ref.title}</span>
                  <span aria-hidden="true">·</span>
                  <span>{ref.publisher}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{ref.licence}</span>
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-teal-800 hover:underline"
                  >
                    <span>Open External Slide Reference</span>
                    <ExternalLink size={11} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
