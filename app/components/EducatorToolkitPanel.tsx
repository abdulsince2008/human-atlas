import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  ClipboardCheck,
  Copy,
  Download,
  Eye,
  GraduationCap,
  Microscope,
} from 'lucide-react';
import { CANONICAL_SYSTEMS, type CanonicalSystemId } from '../anatomy-systems';
import {
  ACADEMIC_DEPTH_LABELS,
  SYSTEM_TEACHING_METADATA,
  type AcademicDepthTier,
} from '../learning-supplements';
import {
  buildEducatorWorksheetMarkdown,
  selectTierQuestionsForSystem,
} from '../utils/educator-export';

interface Props {
  activeSystemId?: CanonicalSystemId | null;
  onSelectSystem?: (sysId: CanonicalSystemId) => void;
}

const TIERS: AcademicDepthTier[] = ['school_9_12', 'bs_mbbs', 'phd_research'];

export default function EducatorToolkitPanel({ activeSystemId, onSelectSystem }: Props) {
  const [selectedSystemId, setSelectedSystemId] = useState<CanonicalSystemId>(
    activeSystemId ?? 'cardiovascular',
  );
  const [tier, setTier] = useState<AcademicDepthTier>('bs_mbbs');
  const [includeAnswerKey, setIncludeAnswerKey] = useState(true);
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const effectiveSystemId = activeSystemId ?? selectedSystemId;
  const system = useMemo(
    () => CANONICAL_SYSTEMS.find((s) => s.id === effectiveSystemId) ?? CANONICAL_SYSTEMS[0],
    [effectiveSystemId],
  );
  const guide = SYSTEM_TEACHING_METADATA[system.id];
  const tierQuestions = useMemo(
    () => selectTierQuestionsForSystem(system.id, tier),
    [system.id, tier],
  );

  const markdown = useMemo(
    () =>
      buildEducatorWorksheetMarkdown({
        systemId: system.id,
        tier,
        includeAnswerKey,
      }),
    [system.id, tier, includeAnswerKey],
  );

  const handleCopyMarkdown = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(markdown);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setShowMarkdownPreview(true);
    }
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `anatomy360-${system.id}-${tier}-worksheet.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      className="rounded-2xl border border-teal-200 bg-white p-5 shadow-xs"
      aria-label="Teacher and Professor Prep Mode"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-800">
            <GraduationCap size={14} />
            <span>Teacher &amp; Professor Prep Mode (Grades 9–12 · BS/MBBS · MPhil/PhD)</span>
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">
            {system.name.en} — Instructor Planning &amp; Handout Builder
          </h2>
          <p className="mt-0.5 text-xs text-slate-600">
            Prepare level-appropriate Bloom’s objectives, anticipate common learner misconceptions,
            pick verified 3D spotter targets, and export printable Markdown worksheets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-semibold text-slate-600" htmlFor="educator-sys-select">
            System:
          </label>
          <select
            id="educator-sys-select"
            value={system.id}
            onChange={(e) => {
              const nextId = e.target.value as CanonicalSystemId;
              setSelectedSystemId(nextId);
              onSelectSystem?.(nextId);
            }}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800"
          >
            {CANONICAL_SYSTEMS.map((sys) => (
              <option key={sys.id} value={sys.id}>
                {sys.name.en}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tier Switcher */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Teaching academic tier">
          {TIERS.map((t) => {
            const active = tier === t;
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTier(t)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'border-teal-700 bg-teal-700 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {ACADEMIC_DEPTH_LABELS[t].short} · {ACADEMIC_DEPTH_LABELS[t].badge}
              </button>
            );
          })}
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
          <input
            type="checkbox"
            checked={includeAnswerKey}
            onChange={(e) => setIncludeAnswerKey(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-300 text-teal-700"
          />
          <span>Include Instructor Answer Key in Export</span>
        </label>
      </div>

      {/* 3-Column Educator Matrix */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
            <ClipboardCheck size={14} className="text-teal-700" />
            <span>Bloom’s Objectives ({ACADEMIC_DEPTH_LABELS[tier].short})</span>
          </h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-slate-700">
            {guide.bloomObjectives[tier].map((obj) => (
              <li key={obj}>{obj}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5">
          <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-900">
            <AlertCircle size={14} className="text-amber-700" />
            <span>Common Learner Misconceptions</span>
          </h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-slate-700">
            {guide.commonMisconceptions.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
            <Microscope size={14} className="text-teal-700" />
            <span>3D Spotter Targets &amp; Seminar Lens</span>
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {guide.labSpotterFocus.map((spot) => (
              <span
                key={spot}
                className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700"
              >
                {spot}
              </span>
            ))}
          </div>
          <p className="mt-2.5 border-t border-slate-200 pt-2 text-[11px] leading-relaxed text-slate-600">
            <strong>PhD / Seminar Question:</strong> {guide.graduateSeminarPrompt}
          </p>
        </div>
      </div>

      {/* Worksheet Export Action Row */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <span className="text-xs text-slate-500">
          Worksheet bundles {guide.bloomObjectives[tier].length} objectives,{' '}
          {guide.labSpotterFocus.length} 3D spotter FMA concepts, and {tierQuestions.length}{' '}
          tier-matched MCQ items.
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMarkdownPreview((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Eye size={13} />
            <span>{showMarkdownPreview ? 'Hide Markdown' : 'Preview Worksheet'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            {copied ? <Check size={13} className="text-emerald-700" /> : <Copy size={13} />}
            <span>{copied ? 'Copied Worksheet!' : 'Copy Markdown'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="inline-flex items-center gap-1.5 rounded-lg border border-teal-700 bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800"
          >
            <Download size={13} />
            <span>Download .md Worksheet</span>
          </button>
        </div>
      </div>

      {showMarkdownPreview && (
        <pre className="mt-3 max-h-72 overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">
          {markdown}
        </pre>
      )}
    </section>
  );
}
