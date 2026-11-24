import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  ClipboardCheck,
  Copy,
  Download,
  Eye,
  GraduationCap,
  Microscope,
} from 'lucide-react';
import type { CanonicalSystemId } from '../anatomy-systems';
import type { AppRoute } from './SiteHeader';
import { useStudy } from './StudyContext';
import { CURRICULUM_FRAMEWORKS } from '../education/education-curricula';
import { EDUCATION_DOMAINS } from '../education/education-domains';
import type { CurriculumAuthorityId, EducationDomainId } from '../education/education-types';
import {
  ACADEMIC_DEPTH_LABELS,
  SYSTEM_TEACHING_METADATA,
  type AcademicDepthTier,
} from '../learning-supplements';
import {
  getDomainCoverageBreakdown,
  getRegistrySubjectByDomain,
  REGISTRY_COVERAGE_LABELS,
  REGISTRY_REVIEW_LABELS,
} from '../registry/knowledge-registry';
import {
  buildUniversalEducatorMarkdown,
  getEducatorQuestionsForTopics,
  resolveEducatorTopicSelection,
  type UniversalExportKind,
} from '../utils/educator-export';
import {
  buildUniversalEducatorPdf,
  buildUniversalEducatorPptx,
  triggerBinaryDownload,
} from '../utils/teaching-exports';

interface Props {
  activeSystemId?: CanonicalSystemId | null;
  onSelectSystem?: (sysId: CanonicalSystemId) => void;
  initialSourceKind?: 'domain' | 'framework' | 'custom_syllabus';
  initialDomainId?: EducationDomainId;
  initialFrameworkId?: CurriculumAuthorityId;
  initialCustomSyllabusId?: string;
  onNavigate?: (route: AppRoute) => void;
  onOpenTopic?: (params: {
    route: AppRoute;
    domainId?: EducationDomainId;
    topicId?: string;
    systemId?: CanonicalSystemId;
    conceptId?: string;
  }) => void;
}

const TIERS: AcademicDepthTier[] = ['school_9_12', 'bs_mbbs', 'phd_research'];

export default function EducatorToolkitPanel({
  activeSystemId,
  onSelectSystem,
  initialSourceKind,
  initialDomainId,
  initialFrameworkId,
  initialCustomSyllabusId,
  onNavigate,
  onOpenTopic,
}: Props) {
  const { state, saveEducatorSequence } = useStudy();

  const [sourceKind, setSourceKind] = useState<'domain' | 'framework' | 'custom_syllabus'>(
    initialSourceKind ?? 'domain',
  );
  const [domainId, setDomainId] = useState<EducationDomainId>(
    initialDomainId ?? 'human_anatomy',
  );
  const [frameworkId, setFrameworkId] = useState<CurriculumAuthorityId>(
    initialFrameworkId ?? CURRICULUM_FRAMEWORKS[0].id,
  );
  const [customSyllabusId, setCustomSyllabusId] = useState<string>(
    initialCustomSyllabusId ?? state.customSyllabi[0]?.id ?? '',
  );

  const [tier, setTier] = useState<AcademicDepthTier>('bs_mbbs');
  const [exportKind, setExportKind] = useState<UniversalExportKind>('lecture_outline');
  const [includeAnswerKey, setIncludeAnswerKey] = useState(true);
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<'pdf' | 'pptx' | null>(null);

  useEffect(() => {
    if (initialSourceKind) setSourceKind(initialSourceKind);
    if (initialDomainId) setDomainId(initialDomainId);
    if (initialFrameworkId) setFrameworkId(initialFrameworkId);
    if (initialCustomSyllabusId) setCustomSyllabusId(initialCustomSyllabusId);
  }, [initialSourceKind, initialDomainId, initialFrameworkId, initialCustomSyllabusId]);

  const activeCustomSyllabus = useMemo(
    () =>
      state.customSyllabi.find((s) => s.id === customSyllabusId) ??
      state.customSyllabi[0],
    [state.customSyllabi, customSyllabusId],
  );

  const sequenceKey = useMemo(() => {
    if (sourceKind === 'domain') return `domain:${domainId}`;
    if (sourceKind === 'framework') return `framework:${frameworkId}`;
    return `custom:${activeCustomSyllabus?.id ?? 'none'}`;
  }, [sourceKind, domainId, frameworkId, activeCustomSyllabus]);

  const baseSelection = useMemo(
    () =>
      resolveEducatorTopicSelection({
        sourceKind,
        domainId,
        frameworkId,
        customSyllabus: activeCustomSyllabus,
      }),
    [sourceKind, domainId, frameworkId, activeCustomSyllabus],
  );

  const savedOrder = state.educatorSequences[sequenceKey];
  const orderedTopics = useMemo(() => {
    if (!savedOrder || savedOrder.length === 0) return baseSelection.topics;
    const byId = new Map(baseSelection.topics.map((t) => [t.id, t]));
    const ordered = savedOrder
      .map((id) => byId.get(id))
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
    // Include any new topics missing from saved sequence at the end
    const seen = new Set(ordered.map((t) => t.id));
    for (const t of baseSelection.topics) {
      if (!seen.has(t.id)) ordered.push(t);
    }
    return ordered;
  }, [baseSelection.topics, savedOrder]);

  const moveTopicInSequence = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= orderedTopics.length) return;
    const nextIds = orderedTopics.map((t) => t.id);
    const [moved] = nextIds.splice(index, 1);
    nextIds.splice(target, 0, moved);
    saveEducatorSequence(sequenceKey, nextIds);
  };

  const resetSequence = () => {
    saveEducatorSequence(sequenceKey, []);
  };

  const activeSubject = getRegistrySubjectByDomain(domainId);
  const domainBreakdown = useMemo(() => getDomainCoverageBreakdown(domainId), [domainId]);

  const effectiveSystemGuideId: CanonicalSystemId = useMemo(() => {
    if (sourceKind === 'domain' && domainId === 'human_anatomy' && activeSystemId) {
      return activeSystemId;
    }
    return (
      orderedTopics.find((t) => t.systemId)?.systemId ??
      activeSubject?.relatedSystems[0] ??
      'cardiovascular'
    );
  }, [sourceKind, domainId, activeSystemId, orderedTopics, activeSubject]);

  const guide = SYSTEM_TEACHING_METADATA[effectiveSystemGuideId];
  const tierQuestions = useMemo(
    () => getEducatorQuestionsForTopics(orderedTopics, tier),
    [orderedTopics, tier],
  );

  const markdown = useMemo(
    () =>
      buildUniversalEducatorMarkdown({
        sourceKind,
        domainId,
        frameworkId,
        customSyllabus: activeCustomSyllabus,
        orderedTopicIds: orderedTopics.map((t) => t.id),
        tier,
        exportKind,
        includeAnswerKey: exportKind === 'student_worksheet' ? includeAnswerKey : false,
      }),
    [sourceKind, domainId, frameworkId, activeCustomSyllabus, orderedTopics, tier, exportKind, includeAnswerKey],
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
    const slug =
      sourceKind === 'domain'
        ? domainId
        : sourceKind === 'framework'
          ? frameworkId
          : activeCustomSyllabus?.id ?? 'custom';
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `anatomy360-${slug}-${tier}-${exportKind}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const buildExportOptions = () => ({
    sourceKind,
    domainId,
    frameworkId,
    customSyllabus: activeCustomSyllabus,
    systemId: activeSystemId ?? 'cardiovascular',
    tier,
    exportKind,
    includeAnswerKey,
    topicIdsOverride: orderedTopics.map((t) => t.id),
  });

  const exportSlug =
    sourceKind === 'domain'
      ? domainId
      : sourceKind === 'framework'
        ? frameworkId
        : activeCustomSyllabus?.id ?? 'custom';

  const handleDownloadPdf = () => {
    setExportingFormat('pdf');
    try {
      const bytes = buildUniversalEducatorPdf(buildExportOptions());
      triggerBinaryDownload(
        `anatomy360-${exportSlug}-${tier}-${exportKind}.pdf`,
        bytes,
        'application/pdf',
      );
    } finally {
      setExportingFormat(null);
    }
  };

  const handleDownloadPptx = async () => {
    setExportingFormat('pptx');
    try {
      const bytes = await buildUniversalEducatorPptx(buildExportOptions());
      triggerBinaryDownload(
        `anatomy360-${exportSlug}-${tier}-${exportKind}.pptx`,
        bytes,
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      );
    } finally {
      setExportingFormat(null);
    }
  };

  const allOutcomes = useMemo(() => {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const tp of orderedTopics) {
      for (const lo of tp.learningOutcomes) {
        if (!seen.has(lo.statement)) {
          seen.add(lo.statement);
          out.push(lo.statement);
        }
      }
    }
    return out;
  }, [orderedTopics]);

  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-6"
      aria-label="Teacher and Professor Workspace"
    >
      {/* Header & Source Switcher */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800">
            <GraduationCap size={14} />
            <span>Teacher &amp; Professor Workspace · Grades 9–12 · BS/MBBS · MPhil/PhD</span>
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">
            {baseSelection.title}
          </h2>
          {baseSelection.subtitle && (
            <p className="mt-0.5 text-xs text-slate-600">{baseSelection.subtitle}</p>
          )}
        </div>

        {/* Source Scope Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1" role="tablist" aria-label="Workspace scope">
            <button
              type="button"
              role="tab"
              aria-selected={sourceKind === 'domain'}
              onClick={() => setSourceKind('domain')}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
                sourceKind === 'domain' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              16 Domains
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={sourceKind === 'framework'}
              onClick={() => setSourceKind('framework')}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
                sourceKind === 'framework' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              13 References
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={sourceKind === 'custom_syllabus'}
              onClick={() => setSourceKind('custom_syllabus')}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
                sourceKind === 'custom_syllabus' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Custom ({state.customSyllabi.length})
            </button>
          </div>

          {sourceKind === 'domain' && (
            <select
              aria-label="Select human science domain"
              value={domainId}
              onChange={(e) => {
                const next = e.target.value as EducationDomainId;
                setDomainId(next);
                if (next === 'human_anatomy' && activeSystemId) {
                  onSelectSystem?.(activeSystemId);
                }
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800"
            >
              {EDUCATION_DOMAINS.map((d) => (
                <option key={d.id} value={d.id}>
                  Domain {d.code}: {d.shortTitle}
                </option>
              ))}
            </select>
          )}

          {sourceKind === 'framework' && (
            <select
              aria-label="Select curriculum alignment reference"
              value={frameworkId}
              onChange={(e) => setFrameworkId(e.target.value as CurriculumAuthorityId)}
              className="max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800"
            >
              {CURRICULUM_FRAMEWORKS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.country} — {f.title}
                </option>
              ))}
            </select>
          )}

          {sourceKind === 'custom_syllabus' && (
            state.customSyllabi.length > 0 ? (
              <select
                aria-label="Select saved custom syllabus"
                value={activeCustomSyllabus?.id ?? ''}
                onChange={(e) => setCustomSyllabusId(e.target.value)}
                className="max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800"
              >
                {state.customSyllabi.map((cs) => (
                  <option key={cs.id} value={cs.id}>
                    {cs.metadata.courseName} ({cs.metadata.institution})
                  </option>
                ))}
              </select>
            ) : (
              onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('syllabus')}
                  className="rounded-lg border border-teal-700 bg-white px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-50 whitespace-nowrap"
                >
                  Create Custom Syllabus →
                </button>
              )
            )
          )}
        </div>
      </div>

      {/* Tier + Document Kind Controls */}
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
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? 'border-teal-800 bg-teal-800 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {ACADEMIC_DEPTH_LABELS[t].short} · {ACADEMIC_DEPTH_LABELS[t].badge}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1" role="tablist" aria-label="Export document type">
            <button
              type="button"
              role="tab"
              aria-selected={exportKind === 'lecture_outline'}
              onClick={() => setExportKind('lecture_outline')}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
                exportKind === 'lecture_outline' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Lecture Outline
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={exportKind === 'student_worksheet'}
              onClick={() => setExportKind('student_worksheet')}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
                exportKind === 'student_worksheet' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Student Worksheet
            </button>
          </div>

          {exportKind === 'student_worksheet' && (
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={includeAnswerKey}
                onChange={(e) => setIncludeAnswerKey(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-teal-700"
              />
              <span>Include Answer Key</span>
            </label>
          )}
        </div>
      </div>

      {/* 3-Column Instructor Outcomes / Limitations / Context */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
            <ClipboardCheck size={14} className="text-teal-700" />
            <span>Learning Outcomes (<span className="tabular-nums">{allOutcomes.length}</span>)</span>
          </h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-slate-700">
            {(allOutcomes.length > 0 ? allOutcomes.slice(0, 6) : guide.bloomObjectives[tier]).map((obj) => (
              <li key={obj}>{obj}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-900">
            <AlertCircle size={14} className="text-amber-700" />
            <span>Honest Coverage Gaps &amp; Asset Notes</span>
          </h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-slate-700">
            {(baseSelection.knownGaps.length > 0
              ? baseSelection.knownGaps
              : domainBreakdown.knownGaps
            )
              .slice(0, 5)
              .map((gap) => (
                <li key={gap}>{gap}</li>
              ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
            <Microscope size={14} className="text-teal-700" />
            <span>Practical Focus &amp; Seminar Prompt</span>
          </h3>
          <p className="mt-2 text-xs text-slate-700">
            <strong>3D / System Spotter Focus:</strong> {guide.labSpotterFocus.slice(0, 4).join(' · ')}
          </p>
          <p className="mt-2 border-t border-slate-200 pt-2 text-xs leading-relaxed text-slate-600">
            <strong>Seminar Lens:</strong> {guide.graduateSeminarPrompt}
          </p>
        </div>
      </div>

      {/* Teaching Sequence Arranger (Topics, Outcomes, Connected Resources) */}
      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Arranged Teaching Sequence (<span className="tabular-nums">{orderedTopics.length}</span> topics)
            </h3>
            <p className="text-xs text-slate-600">
              Reorder modules cleanly for your lecture sequence (saved locally per syllabus/domain).
            </p>
          </div>
          {savedOrder && savedOrder.length > 0 && (
            <button
              type="button"
              onClick={resetSequence}
              className="text-xs font-semibold text-teal-800 hover:underline"
            >
              Reset Default Order
            </button>
          )}
        </div>

        {orderedTopics.length === 0 ? (
          <p className="py-4 text-xs text-slate-600">
            No topics mapped for this selection yet. Choose another domain or map topics in Syllabus Navigator.
          </p>
        ) : (
          <ol className="mt-3 divide-y divide-slate-200">
            {orderedTopics.map((tp, idx) => (
              <li key={tp.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-500">
                    <span className="tabular-nums font-semibold">Step {idx + 1}</span> · {tp.chapterTitle} ·{' '}
                    {REGISTRY_COVERAGE_LABELS[tp.coverageStatus]} · {REGISTRY_REVIEW_LABELS[tp.reviewStatus]}
                  </p>
                  <p className="text-sm font-semibold text-slate-900">{tp.title}</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    aria-label={`Move ${tp.title} up`}
                    onClick={() => moveTopicInSequence(idx, -1)}
                    className="rounded border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === orderedTopics.length - 1}
                    aria-label={`Move ${tp.title} down`}
                    onClick={() => moveTopicInSequence(idx, 1)}
                    className="rounded border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ArrowDown size={13} />
                  </button>
                  {onOpenTopic && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenTopic({
                          route: tp.navigationTarget.route,
                          domainId: tp.domainId,
                          topicId: tp.id,
                          systemId: tp.systemId,
                          conceptId: tp.relatedConceptIds[0],
                        })
                      }
                      className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-100 whitespace-nowrap"
                    >
                      <span>Open</span>
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Export Action Row */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <span className="text-xs text-slate-500 tabular-nums">
          Export bundles {orderedTopics.length} sequenced topic(s), {allOutcomes.length} learning outcomes, and {tierQuestions.length} assessment items.
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMarkdownPreview((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <Eye size={13} />
            <span>{showMarkdownPreview ? 'Hide Markdown' : 'Preview Markdown'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap"
          >
            {copied ? <Check size={13} className="text-emerald-700" /> : <Copy size={13} />}
            <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
          </button>

          <button
            type="button"
            disabled={exportingFormat !== null}
            onClick={handleDownloadPdf}
            data-testid="educator-download-pdf"
            className="inline-flex items-center gap-1.5 rounded-lg border border-teal-800 bg-teal-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-900 whitespace-nowrap disabled:opacity-60"
          >
            <Download size={13} />
            <span>
              Download {exportKind === 'lecture_outline' ? 'Lecture Outline' : 'Worksheet'} (.pdf)
            </span>
          </button>

          <button
            type="button"
            disabled={exportingFormat !== null}
            onClick={handleDownloadPptx}
            data-testid="educator-download-pptx"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap disabled:opacity-60"
          >
            <Download size={13} />
            <span>{exportingFormat === 'pptx' ? 'Building .pptx…' : 'Download Slides (.pptx)'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <Download size={13} />
            <span>Download (.md)</span>
          </button>
        </div>
      </div>

      {showMarkdownPreview && (
        <pre className="mt-3 max-h-80 overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">
          {markdown}
        </pre>
      )}
    </section>
  );
}
