import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  ClipboardList,
  Compass,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  Layers,
  Library,
  Microscope,
  PlayCircle,
  Presentation,
  Search,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import type { Atlas } from '../anatomy';
import { CANONICAL_SYSTEMS, type CanonicalSystemId } from '../anatomy-systems';
import {
  filterTopicsForTrackAndFramework,
  getDomainById,
  getDomainCompletionSummary,
  getFrameworkById,
  getPlatformCompletionSummary,
  getTrackById,
  getVisibleDomainsForFilter,
  resolveExplanationForTrack,
} from '../education/education-content';
import {
  CURRICULUM_FRAMEWORKS,
  EDUCATION_TRACKS,
} from '../education/education-curricula';
import type {
  ContentCompletionStatus,
  CoverageStatus,
  CurriculumAuthorityId,
  DiagramNode,
  EducationDomainId,
  EducationTopic,
  EducationTrackId,
} from '../education/education-types';
import ChapterDeckViewer from './ChapterDeckViewer';
import Persistent3DPane from './Persistent3DPane';
import type { AppRoute } from './SiteHeader';
import { useStudy } from './StudyContext';
import StudyVideoSection from './StudyVideoSection';
import { RADIOLOGY_CASES, type RadiologyModality } from '../data/radiology-data';
import { useSexAwareAtlas } from '../hooks/useSexAwareAtlas';
import type { StudyContextInput } from '../study-context-engine';
import { buildChapterStudyGuidePdf, triggerBinaryDownload } from '../utils/teaching-exports';

interface Props {
  atlas: Atlas | null;
  initialDomainId?: EducationDomainId | null;
  initialTopicId?: string | null;
  initialTrackId?: EducationTrackId | null;
  initialFrameworkId?: CurriculumAuthorityId | null;
  onInspectConcept: (conceptId: string) => void;
  onNavigate: (route: AppRoute) => void;
  onOpenSystemLesson: (systemId: CanonicalSystemId) => void;
  onOpenPresentation: (presentationId: string) => void;
  onOpenEducatorWorkspace?: (domainId: EducationDomainId) => void;
  onOpenStudyContext?: (input: StudyContextInput) => void;
}

type ChapterTabId =
  | 'learn'
  | 'read'
  | 'watch'
  | 'presentations'
  | 'visualise'
  | 'practise'
  | 'references';

const CHAPTER_TABS: { id: ChapterTabId; label: string }[] = [
  { id: 'learn', label: 'Learn' },
  { id: 'read', label: 'Read' },
  { id: 'watch', label: 'Watch' },
  { id: 'presentations', label: 'Presentations' },
  { id: 'visualise', label: 'Visualise' },
  { id: 'practise', label: 'Practise' },
  { id: 'references', label: 'References' },
];

const COVERAGE_META: Record<
  CoverageStatus,
  { label: string; textClass: string }
> = {
  implemented_validated: {
    label: 'Core 3D & Text Ready · Awaiting Faculty Review',
    textClass: 'text-emerald-800',
  },
  implemented_partial: {
    label: 'Structured Reference · Awaiting Faculty Review',
    textClass: 'text-teal-800',
  },
  content_only_no_visual: {
    label: 'Written Reference · 2D Schematic Only',
    textClass: 'text-slate-700',
  },
  asset_missing: {
    label: 'Asset Required (Media Pending)',
    textClass: 'text-amber-800',
  },
  planned_scaffold_only: {
    label: 'Planned Scaffold',
    textClass: 'text-slate-600',
  },
  not_present: {
    label: 'Not Present',
    textClass: 'text-rose-700',
  },
  out_of_scope: {
    label: 'Out of Scope',
    textClass: 'text-slate-500',
  },
};

const STATUS_LABELS: Record<ContentCompletionStatus, string> = {
  not_started: 'Not started',
  planned: 'Planned',
  in_progress: 'In progress',
  content_drafted: 'Content drafted',
  source_checked: 'Source checked',
  resource_incomplete: 'Resource incomplete',
  partially_complete: 'Partially complete',
  complete_for_core_scope: 'Complete for core scope',
  blocked_by_source_availability: 'Blocked by source availability',
  awaiting_academic_review: 'Awaiting academic review',
  faculty_reviewed: 'Faculty reviewed',
};

const NODE_TONE_CLASSES: Record<NonNullable<DiagramNode['tone']>, string> = {
  teal: 'border-teal-300 bg-teal-50/70 text-teal-950',
  blue: 'border-blue-300 bg-blue-50/70 text-blue-950',
  amber: 'border-amber-300 bg-amber-50/70 text-amber-950',
  rose: 'border-rose-300 bg-rose-50/70 text-rose-950',
  emerald: 'border-emerald-300 bg-emerald-50/70 text-emerald-950',
  slate: 'border-slate-300 bg-slate-50 text-slate-900',
};

function downloadMarkdownFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildChapterStudyGuideMarkdown(
  topic: EducationTopic,
  trackLabel: string,
  explanationText: string,
): string {
  const lines: string[] = [
    `# ${topic.chapterCode ? `${topic.chapterCode}: ` : ''}${topic.chapterTitle} — ${topic.title}`,
    '',
    `- **Summary**: ${topic.summary}`,
    `- **Academic Track Depth**: ${trackLabel}`,
    `- **Review Status**: ${topic.completionTracker?.reviewStatus ?? topic.reviewStatus} (not faculty-certified)`,
    '',
    '## Learning Objectives',
    ...topic.learningObjectives.map((obj) => `- ${obj}`),
    '',
    '## Written Explanation',
    explanationText,
    '',
  ];

  if (topic.mechanisms && topic.mechanisms.length > 0) {
    lines.push('## Key Mechanisms', ...topic.mechanisms.map((m) => `- ${m}`), '');
  }
  if (topic.stepByStep && topic.stepByStep.length > 0) {
    lines.push('## Step-by-Step Sequence', ...topic.stepByStep.map((s, idx) => `${idx + 1}. ${s}`), '');
  }
  if (topic.comparisonTable) {
    lines.push(
      `## Comparison: ${topic.comparisonTable.columnA} vs ${topic.comparisonTable.columnB}`,
      `| Dimension | ${topic.comparisonTable.columnA} | ${topic.comparisonTable.columnB} | Clinical / Functional Note |`,
      '| --- | --- | --- | --- |',
      ...topic.comparisonTable.rows.map(
        (r) => `| ${r.dimension} | ${r.primary} | ${r.comparator} | ${r.clinicalOrFunctionalNote} |`,
      ),
      '',
    );
  }
  if (topic.readingLinks && topic.readingLinks.length > 0) {
    lines.push(
      '## Verified External Reading Links',
      ...topic.readingLinks.map(
        (rl) => `- [${rl.title}](${rl.url}) — ${rl.authorOrPublisher} (${rl.licence}, checked ${rl.dateChecked}): ${rl.sectionCovered}`,
      ),
      '',
    );
  }
  if (topic.sources.length > 0) {
    lines.push(
      '## Supporting References',
      ...topic.sources.map((s) => `- ${s.title} (${s.authority})${s.url ? ` — ${s.url}` : ''}`),
      '',
    );
  }

  return lines.join('\n');
}

function buildVideoScriptMarkdown(topic: EducationTopic): string {
  const vr = topic.videoResource;
  if (!vr) return `# ${topic.title}\n\nNo video script available.\n`;
  const lines: string[] = [
    `# ${vr.title}`,
    '',
    `- **Chapter**: ${topic.chapterCode ?? topic.id} — ${topic.title}`,
    `- **Channel / Author**: ${vr.channelOrAuthor}`,
    `- **Availability Status**: ${vr.availabilityStatus}`,
    `- **Disclosure**: ${vr.availabilityNote}`,
    `- **Duration**: ${vr.durationNote}`,
    '',
    '## Visual Storyboard & Narration Script',
    '',
  ];
  for (const sc of vr.scenes ?? []) {
    lines.push(
      `### Scene ${sc.sceneNumber} (${sc.timecode})`,
      `**Visual Cue:** ${sc.visualCue}`,
      '',
      `**Narration:** ${sc.narration}`,
      '',
    );
  }
  return lines.join('\n');
}

export default function MedicalCurriculumHub({
  atlas,
  initialDomainId,
  initialTopicId,
  initialTrackId,
  initialFrameworkId,
  onInspectConcept,
  onNavigate,
  onOpenSystemLesson,
  onOpenPresentation,
  onOpenEducatorWorkspace,
  onOpenStudyContext,
}: Props) {
  const { state, setTopicCompleted, recordQuizResult, setPreferredSex } = useStudy();
  const { effectiveAtlas } = useSexAwareAtlas(atlas, state.preferredSex);
  const [selectedTrack, setSelectedTrack] = useState<EducationTrackId>(
    initialTrackId ?? 'secondary_premed',
  );
  const [frameworkFilter, setFrameworkFilter] = useState<CurriculumAuthorityId | 'all'>(
    initialFrameworkId ?? 'all',
  );
  const [activeDomainId, setActiveDomainId] = useState<EducationDomainId>(
    initialDomainId ?? 'cell_biology',
  );
  const [activeTopicId, setActiveTopicId] = useState<string>(
    initialTopicId ?? 'edu-cell-organelles-transport',
  );
  const [activeTab, setActiveTab] = useState<ChapterTabId>('learn');
  const [chapterQuery, setChapterQuery] = useState('');
  const [answersByQuestion, setAnswersByQuestion] = useState<Record<string, number>>({});
  const [revealedShortAnswers, setRevealedShortAnswers] = useState<Record<string, boolean>>({});
  const [revealedCases, setRevealedCases] = useState<Record<string, boolean>>({});
  const [selectedDiagramNodeId, setSelectedDiagramNodeId] = useState<string | null>(null);
  const [showFullPlatformMatrix, setShowFullPlatformMatrix] = useState(false);
  const [radiologyFilter, setRadiologyFilter] = useState<RadiologyModality | 'all'>('all');
  const [showInline3D, setShowInline3D] = useState(false);

  useEffect(() => {
    if (initialFrameworkId) {
      setFrameworkFilter(initialFrameworkId);
    } else if (initialDomainId || initialTopicId) {
      setFrameworkFilter('all');
    }
    if (initialTrackId) {
      setSelectedTrack(initialTrackId);
    } else if (initialDomainId) {
      const matched = filterTopicsForTrackAndFramework(initialDomainId, 'all', 'all')[0];
      if (matched && !matched.targetTracks.includes(selectedTrack)) {
        setSelectedTrack(matched.targetTracks[0]);
      }
    }
    if (initialDomainId) {
      setActiveDomainId(initialDomainId);
      setSelectedDiagramNodeId(null);
      setChapterQuery('');
      if (!initialTopicId) {
        const firstTopic = filterTopicsForTrackAndFramework(initialDomainId, 'all', 'all')[0];
        if (firstTopic) setActiveTopicId(firstTopic.id);
      }
    }
    if (initialTopicId) {
      setActiveTopicId(initialTopicId);
      setSelectedDiagramNodeId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDomainId, initialTopicId, initialTrackId, initialFrameworkId]);

  const conceptNameMap = useMemo(() => {
    const map = new Map<string, string>();
    if (atlas) {
      for (const c of atlas.concepts) {
        map.set(c.id, c.name);
      }
    }
    return map;
  }, [atlas]);

  const visibleDomains = useMemo(
    () => getVisibleDomainsForFilter(selectedTrack, frameworkFilter),
    [selectedTrack, frameworkFilter],
  );

  const activeDomain = useMemo(() => {
    if (visibleDomains.length === 0) return null;
    return visibleDomains.find((d) => d.id === activeDomainId) ?? visibleDomains[0];
  }, [visibleDomains, activeDomainId]);

  const domainTopics = useMemo(
    () =>
      activeDomain
        ? filterTopicsForTrackAndFramework(activeDomain.id, selectedTrack, frameworkFilter)
        : [],
    [activeDomain, selectedTrack, frameworkFilter],
  );

  const filteredChapterList = useMemo(() => {
    const q = chapterQuery.trim().toLowerCase();
    if (!q) return domainTopics;
    return domainTopics.filter(
      (tp) =>
        tp.title.toLowerCase().includes(q) ||
        tp.chapterTitle.toLowerCase().includes(q) ||
        (tp.chapterCode ?? '').toLowerCase().includes(q) ||
        tp.summary.toLowerCase().includes(q),
    );
  }, [domainTopics, chapterQuery]);

  const activeTopic = useMemo(() => {
    if (domainTopics.length === 0) return null;
    return domainTopics.find((t) => t.id === activeTopicId) ?? domainTopics[0];
  }, [domainTopics, activeTopicId]);

  const depthInfo = useMemo(
    () => (activeTopic ? resolveExplanationForTrack(activeTopic, selectedTrack) : null),
    [activeTopic, selectedTrack],
  );

  const platformSummary = useMemo(() => getPlatformCompletionSummary(), []);

  const activeDomainSummary = useMemo(
    () => (activeDomain ? getDomainCompletionSummary(activeDomain.id) : null),
    [activeDomain],
  );

  const activeTrackSpec = getTrackById(selectedTrack) ?? EDUCATION_TRACKS[1];
  const isTopicDone = activeTopic ? state.completedTopicIds.includes(activeTopic.id) : false;

  const handleSelectDomain = (domId: EducationDomainId) => {
    setActiveDomainId(domId);
    setSelectedDiagramNodeId(null);
    setChapterQuery('');
    const firstTopic = filterTopicsForTrackAndFramework(domId, selectedTrack, frameworkFilter)[0];
    if (firstTopic) setActiveTopicId(firstTopic.id);
  };

  const handleSelectChapter = (topicId: string) => {
    setActiveTopicId(topicId);
    setSelectedDiagramNodeId(null);
  };

  const handleAnswer = (
    questionId: string,
    optionIdx: number,
    correctIndex: number,
    label: string,
  ) => {
    setAnswersByQuestion((prev) => ({ ...prev, [questionId]: optionIdx }));
    recordQuizResult(questionId, optionIdx === correctIndex, label);
  };

  const tabIcon = (id: ChapterTabId) => {
    if (id === 'learn') return <BookOpen size={14} />;
    if (id === 'read') return <FileText size={14} />;
    if (id === 'watch') return <PlayCircle size={14} />;
    if (id === 'presentations') return <Presentation size={14} />;
    if (id === 'visualise') return <Layers size={14} />;
    if (id === 'practise') return <ClipboardCheck size={14} />;
    return <Library size={14} />;
  };

  return (
    <div className="space-y-6">
      {/* Educational Scope, Track & Framework Selector */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold text-teal-800 font-mono tabular-nums">
              16 Biomedical Domains · {platformSummary.totalChapters} Chapters · {platformSummary.mcqTotal} MCQs · {platformSummary.presentationDecksCount} Decks
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Select Your Learning Level &amp; Curriculum Reference
            </h2>
            <p className="mt-1 text-sm text-slate-600">{activeTrackSpec.description}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="curriculum-framework-select"
              className="text-xs font-semibold text-slate-600"
            >
              Curriculum Reference Filter
            </label>
            <select
              id="curriculum-framework-select"
              value={frameworkFilter}
              onChange={(e) => setFrameworkFilter(e.target.value as CurriculumAuthorityId | 'all')}
              className="max-w-full sm:max-w-[340px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-700 focus:outline-none"
            >
              <option value="all">All {CURRICULUM_FRAMEWORKS.length} Curriculum References</option>
              {CURRICULUM_FRAMEWORKS.map((fw) => (
                <option key={fw.id} value={fw.id}>
                  {fw.country} — {fw.title.replace(/^[^—]+—\s*/, '')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Learning Track Tabs */}
        <div
          className="mt-4 flex flex-wrap gap-2"
          role="tablist"
          aria-label="Student learning track"
        >
          {EDUCATION_TRACKS.map((track) => {
            const active = selectedTrack === track.id;
            return (
              <button
                key={track.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedTrack(track.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'border-teal-700 bg-teal-700 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <GraduationCap size={14} />
                <span>{track.shortLabel}</span>
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-xs text-slate-600">
          <strong>Educational Scope Notice:</strong> Alphatomy provides structured biomedical
          study material for education only—not medical diagnosis, prescribing, or supervised clinical
          training. All chapters are currently <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">awaiting_academic_review</code> (faculty review count: <span className="font-mono tabular-nums">{platformSummary.facultyReviewedCount}</span>).
        </p>
      </section>

      {/* Main Split Workspace: Domain Sidebar + Active Chapter Study Reader */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Sidebar: 16 Domains */}
        <aside
          className="space-y-2.5 lg:col-span-4"
          aria-label="Human biology and medical science domains"
        >
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-600">
              Subjects ({visibleDomains.length} of {platformSummary.totalDomains})
            </h3>
            {frameworkFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setFrameworkFilter('all')}
                className="text-xs font-semibold text-teal-800 hover:underline whitespace-nowrap"
              >
                Clear filter
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:pb-0">
            {visibleDomains.map((dom) => {
              const isSelected = activeDomain?.id === dom.id;
              const cov = COVERAGE_META[dom.coverageStatus];
              const topicCount = filterTopicsForTrackAndFramework(
                dom.id,
                selectedTrack,
                frameworkFilter,
              ).length;
              return (
                <button
                  key={dom.id}
                  type="button"
                  onClick={() => handleSelectDomain(dom.id)}
                  className={`flex min-w-[215px] shrink-0 items-start gap-2.5 rounded-xl border p-3 text-left transition-colors lg:w-full lg:min-w-0 ${
                    isSelected
                      ? 'border-teal-700 bg-teal-50/70 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold ${
                      isSelected ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {dom.code}
                  </span>
                  <span className="min-w-0 flex-1 space-y-0.5">
                    <span className="block text-sm font-semibold leading-snug text-slate-900">
                      {dom.shortTitle}
                    </span>
                    <span className="block font-mono text-[11px] tabular-nums font-medium text-slate-600">
                      {topicCount} {topicCount === 1 ? 'chapter' : 'chapters'}
                    </span>
                    <span className={`block text-[11px] leading-snug ${cov.textClass}`}>
                      {cov.label}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Reader: Domain Overview + Chapter Selector + 7-Tab Chapter Package */}
        <article className="min-w-0 space-y-5 lg:col-span-8">
          {!activeDomain || !activeTopic || !depthInfo ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
              <p className="text-sm font-semibold text-slate-900">
                No chapters match this learning level and curriculum reference.
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Switch learning track or reset the curriculum reference filter to view chapters.
              </p>
              <button
                type="button"
                onClick={() => setFrameworkFilter('all')}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-teal-700 bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-800 whitespace-nowrap"
              >
                Reset Curriculum Filter
              </button>
            </div>
          ) : (
            <>
              {/* Domain Header & Connected Tools */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500 font-mono tabular-nums">
                      Domain {activeDomain.code} · Priority {activeDomain.priority} · {activeDomainSummary?.writtenCompleteCount ?? 0}/{activeDomainSummary?.totalChapters ?? domainTopics.length} core chapters drafted
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-slate-900">{activeDomain.title}</h2>
                  </div>
                  <p className={`text-xs font-semibold ${COVERAGE_META[activeDomain.coverageStatus].textClass}`}>
                    {COVERAGE_META[activeDomain.coverageStatus].label}
                  </p>
                </div>

                <p className="text-sm leading-relaxed text-slate-700">{activeDomain.overview}</p>

                {/* Platform Deep-Links & Educator Workspace */}
                <div className="flex flex-wrap gap-2">
                  {activeDomain.platformLinks.map((pl) => (
                    <button
                      key={pl.label}
                      type="button"
                      onClick={() => {
                        if (pl.presentationId) {
                          onOpenPresentation(pl.presentationId);
                        } else if (pl.systemId) {
                          onOpenSystemLesson(pl.systemId);
                        } else {
                          onNavigate(pl.route);
                        }
                      }}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-left text-xs font-semibold text-teal-900 hover:bg-teal-100"
                    >
                      <Compass size={13} className="shrink-0" />
                      <span>{pl.label}</span>
                      <ArrowRight size={13} className="shrink-0" />
                    </button>
                  ))}
                  {onOpenEducatorWorkspace && (
                    <button
                      type="button"
                      onClick={() => onOpenEducatorWorkspace(activeDomain.id)}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50"
                    >
                      <ClipboardList size={13} className="shrink-0" />
                      <span>Prepare in Educator Workspace</span>
                    </button>
                  )}
                </div>

                {/* Honest Asset Disclosure Banner */}
                <div
                  className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs ${
                    activeDomain.assetDisclosure.status === 'asset_required'
                      ? 'border-amber-200 bg-amber-50 text-amber-950'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  {activeDomain.assetDisclosure.status === 'asset_required' ? (
                    <Microscope size={15} className="mt-0.5 shrink-0 text-amber-700" />
                  ) : (
                    <Layers size={15} className="mt-0.5 shrink-0 text-slate-500" />
                  )}
                  <div>
                    <p className="font-semibold">
                      Visual &amp; Media Disclosure: {activeDomain.assetDisclosure.status.replace(/_/g, ' ')}
                    </p>
                    <p className="mt-0.5 leading-relaxed">{activeDomain.assetDisclosure.summary}</p>
                  </div>
                </div>

                {activeDomain.educationalDisclaimer && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-950">
                    <ShieldAlert size={15} className="mt-0.5 shrink-0 text-rose-700" />
                    <p>{activeDomain.educationalDisclaimer}</p>
                  </div>
                )}
              </div>

              {/* Searchable / Indexed Chapter Selector */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Chapters in {activeDomain.shortTitle} ({domainTopics.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Choose a chapter below to study its written lesson, reading links, storyboard, 9-slide deck, visuals, and assessments.
                    </p>
                  </div>

                  {domainTopics.length > 6 && (
                    <div className="relative w-full sm:w-64">
                      <Search
                        size={14}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="search"
                        value={chapterQuery}
                        onChange={(e) => setChapterQuery(e.target.value)}
                        placeholder={`Filter ${domainTopics.length} chapters…`}
                        aria-label={`Filter chapters in ${activeDomain.shortTitle}`}
                        className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 focus:border-teal-700 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                <div className="grid max-h-56 grid-cols-1 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
                  {filteredChapterList.length === 0 ? (
                    <p className="col-span-full py-3 text-center text-xs text-slate-500">
                      No chapters matched &ldquo;{chapterQuery}&rdquo;.
                    </p>
                  ) : (
                    filteredChapterList.map((tp) => {
                      const active = tp.id === activeTopic.id;
                      const done = state.completedTopicIds.includes(tp.id);
                      return (
                        <button
                          key={tp.id}
                          type="button"
                          onClick={() => handleSelectChapter(tp.id)}
                          className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                            active
                              ? 'border-teal-700 bg-teal-700 text-white'
                              : 'border-slate-200 bg-slate-50/60 text-slate-800 hover:bg-slate-100'
                          }`}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            {tp.chapterCode && (
                              <span
                                className={`font-mono text-[11px] font-bold tabular-nums shrink-0 ${
                                  active ? 'text-teal-100' : 'text-teal-800'
                                }`}
                              >
                                {tp.chapterCode}
                              </span>
                            )}
                            <span className="truncate font-medium">{tp.title}</span>
                          </span>
                          {done && (
                            <CheckCircle2
                              size={14}
                              className={`shrink-0 ${active ? 'text-white' : 'text-emerald-700'}`}
                              aria-label="Completed"
                            />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Active Chapter Package + 7 Separate Study Tabs */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
                {/* Chapter Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs font-medium text-slate-500 font-mono tabular-nums">
                      {activeTopic.chapterCode ? `${activeTopic.chapterCode} · ` : ''}
                      {activeTopic.chapterTitle} · Review: awaiting academic review
                    </p>
                    <h3 className="text-lg font-bold text-slate-900">{activeTopic.title}</h3>
                    <p className="text-xs leading-relaxed text-slate-600">{activeTopic.summary}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {onOpenStudyContext && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenStudyContext({
                            topicId: activeTopic.id,
                            domainId: activeDomain.id,
                            conceptId: activeTopic.relatedFmaConceptIds[0],
                            systemId: activeTopic.relatedSystems[0],
                            sex: state.preferredSex,
                            sourceModule: 'curriculum',
                            sourceItemId: activeTopic.id,
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-teal-700 bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800 whitespace-nowrap"
                      >
                        <Compass size={14} />
                        <span>Connected 3D Study Workspace</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setTopicCompleted(activeTopic.id, !isTopicDone, activeTopic.title)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        isTopicDone
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <CheckCircle2 size={14} />
                      <span>{isTopicDone ? 'Completed' : 'Mark Completed'}</span>
                    </button>
                  </div>
                </div>

                {/* 7-Tab Navigation Bar (Mandate Section 8) */}
                <div
                  className="flex items-center justify-between gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1 lg:overflow-visible"
                  role="tablist"
                  aria-label="Chapter resource sections"
                >
                  {CHAPTER_TABS.map((tab) => {
                    const isSelected = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => setActiveTab(tab.id)}
                        className={`inline-flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                          isSelected
                            ? 'bg-teal-700 text-white shadow-xs'
                            : 'text-slate-700 hover:bg-white hover:text-slate-900'
                        }`}
                      >
                        {tabIcon(tab.id)}
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* TAB 1: LEARN (Written Lesson) */}
                {activeTab === 'learn' && (
                  <div className="space-y-5" role="tabpanel" aria-label="Learn written lesson">
                    {activeTopic.prerequisites && activeTopic.prerequisites.length > 0 && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <h4 className="text-xs font-bold text-slate-700">Prerequisites Before Starting</h4>
                        <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs text-slate-700">
                          {activeTopic.prerequisites.map((pre) => (
                            <li key={pre}>{pre}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Learning Objectives */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-600">Core Learning Objectives</h4>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-800">
                        {activeTopic.learningObjectives.map((obj) => (
                          <li key={obj}>{obj}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Track-Differentiated Explanation */}
                    <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-teal-900">
                          Depth Explanation ({getTrackById(depthInfo.trackUsed)?.shortLabel ?? depthInfo.trackUsed})
                        </h4>
                        {depthInfo.trackUsed !== selectedTrack && (
                          <span className="text-[11px] text-slate-600">
                            Showing closest matching track depth
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-800">{depthInfo.text}</p>
                    </div>

                    {/* Mechanisms & Step-by-Step Sequence */}
                    {(() => {
                      const mechs = activeTopic.mechanisms ?? [];
                      const steps = activeTopic.stepByStep ?? [];
                      if (mechs.length === 0 && steps.length === 0) return null;
                      const isIdentical =
                        mechs.length > 0 &&
                        steps.length > 0 &&
                        JSON.stringify(mechs) === JSON.stringify(steps);

                      if (isIdentical) {
                        return (
                          <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <h4 className="text-xs font-bold text-slate-700">
                              Key Mechanisms &amp; Progression Sequence
                            </h4>
                            <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-slate-700">
                              {steps.map((s) => (
                                <li key={s}>{s}</li>
                              ))}
                            </ol>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {mechs.length > 0 && (
                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                              <h4 className="text-xs font-bold text-slate-700">
                                Key Physiological / Molecular Mechanisms
                              </h4>
                              <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-slate-700">
                                {mechs.map((m) => (
                                  <li key={m}>{m}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {steps.length > 0 && (
                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                              <h4 className="text-xs font-bold text-slate-700">
                                Step-by-Step Progression
                              </h4>
                              <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-slate-700">
                                {steps.map((s) => (
                                  <li key={s}>{s}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Structured Comparison Table */}
                    {activeTopic.comparisonTable && activeTopic.comparisonTable.rows.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-700">
                          Structured Comparison: {activeTopic.comparisonTable.columnA} vs{' '}
                          {activeTopic.comparisonTable.columnB}
                        </h4>
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                          <table className="w-full border-collapse text-left text-xs">
                            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                              <tr>
                                <th className="px-3 py-2.5">Dimension</th>
                                <th className="px-3 py-2.5">{activeTopic.comparisonTable.columnA}</th>
                                <th className="px-3 py-2.5">{activeTopic.comparisonTable.columnB}</th>
                                <th className="px-3 py-2.5">Functional / Clinical Note</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-800 tabular-nums">
                              {activeTopic.comparisonTable.rows.map((row) => (
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
                      </div>
                    )}

                    {/* Common Misconceptions vs Scientific Corrections */}
                    {activeTopic.misconceptions && activeTopic.misconceptions.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-700">
                          Common Misconceptions &amp; Corrections
                        </h4>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {activeTopic.misconceptions.map((mc) => (
                            <div
                              key={mc.misconception}
                              className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-1.5"
                            >
                              <p className="font-semibold text-rose-800">Misconception: {mc.misconception}</p>
                              <p className="text-slate-800">
                                <strong className="text-emerald-800">Correction:</strong> {mc.correction}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Key Concepts & High-Yield Facts */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-700">Key Concepts &amp; Terminology</h4>
                        <dl className="mt-2 space-y-2">
                          {activeTopic.keyConcepts.map((kc) => (
                            <div key={kc.term} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                              <dt className="text-xs font-bold text-slate-900">{kc.term}</dt>
                              <dd className="mt-0.5 text-xs text-slate-600">{kc.definition}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs font-bold text-slate-700">High-Yield Facts</h4>
                          <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-slate-700">
                            {activeTopic.keyFacts.map((fact) => (
                              <li key={fact}>{fact}</li>
                            ))}
                          </ul>
                        </div>

                        {activeTopic.clinicalCorrelation && (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
                            <p className="font-bold text-slate-900">Clinical &amp; Applied Correlation</p>
                            <p className="mt-1 leading-relaxed text-slate-700">
                              {activeTopic.clinicalCorrelation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chapter Summary & Key Takeaways */}
                    {(activeTopic.summaryParagraph || (activeTopic.keyTakeaways && activeTopic.keyTakeaways.length > 0)) && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-xs space-y-2">
                        <h4 className="font-bold text-slate-900">Chapter Synthesis &amp; Key Takeaways</h4>
                        {activeTopic.summaryParagraph && (
                          <p className="leading-relaxed text-slate-700">{activeTopic.summaryParagraph}</p>
                        )}
                        {activeTopic.keyTakeaways && activeTopic.keyTakeaways.length > 0 && (
                          <ul className="list-disc space-y-1 pl-4 text-slate-700">
                            {activeTopic.keyTakeaways.map((kt) => (
                              <li key={kt}>{kt}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: READ (External Open-Access Readings & Printable Study Guide) */}
                {activeTab === 'read' && (
                  <div className="space-y-4" role="tabpanel" aria-label="Read external textbook resources">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          Curated Open-Access Textbook &amp; Reference Readings ({activeTopic.readingLinks?.length ?? 0})
                        </h4>
                        <p className="text-xs text-slate-600">
                          Verified HTTPS links with publisher, section focus, licence, and verification date.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          data-testid="download-study-guide-pdf"
                          onClick={() => {
                            const bytes = buildChapterStudyGuidePdf(
                              activeTopic,
                              getTrackById(depthInfo.trackUsed)?.shortLabel ?? depthInfo.trackUsed,
                              depthInfo.text,
                            );
                            triggerBinaryDownload(
                              `${(activeTopic.chapterCode ?? activeTopic.id).toLowerCase()}-study-guide.pdf`,
                              bytes,
                              'application/pdf',
                            );
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-teal-700 bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 whitespace-nowrap"
                        >
                          <Download size={13} />
                          <span>Download Study Guide (.pdf)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            downloadMarkdownFile(
                              `${(activeTopic.chapterCode ?? activeTopic.id).toLowerCase()}-study-guide.md`,
                              buildChapterStudyGuideMarkdown(
                                activeTopic,
                                getTrackById(depthInfo.trackUsed)?.shortLabel ?? depthInfo.trackUsed,
                                depthInfo.text,
                              ),
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 whitespace-nowrap"
                        >
                          <Download size={13} />
                          <span>Download (.md)</span>
                        </button>
                        {onOpenEducatorWorkspace && (
                          <button
                            type="button"
                            onClick={() => onOpenEducatorWorkspace(activeDomain.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 whitespace-nowrap"
                          >
                            <ClipboardList size={13} />
                            <span>Educator Handout Export</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {(!activeTopic.readingLinks || activeTopic.readingLinks.length === 0) ? (
                      <div className="rounded-xl border border-slate-200 bg-white p-5 text-xs text-slate-600">
                        No external reading links attached for this chapter yet.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {activeTopic.readingLinks.map((rl) => (
                          <div
                            key={rl.id}
                            className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
                          >
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                                <span className="font-semibold text-teal-800">
                                  {rl.topicRelationship.replace(/_/g, ' ')}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span>{rl.authorOrPublisher}</span>
                                <span aria-hidden="true">·</span>
                                <span>{rl.licence}</span>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums">Checked {rl.dateChecked}</span>
                              </div>
                              <h5 className="text-sm font-bold text-slate-900">{rl.title}</h5>
                              <p className="text-xs text-slate-600">Section covered: {rl.sectionCovered}</p>
                            </div>
                            <a
                              href={rl.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-50 whitespace-nowrap shrink-0"
                            >
                              <span>Open Reading</span>
                              <ExternalLink size={12} />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: WATCH (Verified Topic-Specific YouTube Video + Explicit Storyboard Separation) */}
                {activeTab === 'watch' && (
                  <div className="space-y-4" role="tabpanel" aria-label="Watch video lesson or storyboard script">
                    <StudyVideoSection
                      topicTitle={activeTopic.title}
                      topicId={activeTopic.id}
                      conceptId={activeTopic.relatedFmaConceptIds[0]}
                      systemId={activeTopic.relatedSystems[0]}
                      domainId={activeDomain.id}
                      academicLevel={selectedTrack}
                      fallbackStoryboard={null}
                    />
                    {!activeTopic.videoResource ? (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-xs text-slate-700">
                        No synthetic narration storyboard script attached for this chapter.
                      </div>
                    ) : (
                      <>
                        {/* Explicit Storyboard Separation Disclosure */}
                        <div
                          className={`rounded-xl border p-4 text-xs space-y-2 ${
                            activeTopic.videoResource.availabilityStatus === 'verified'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                              : 'border-amber-200 bg-amber-50 text-amber-950'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-bold">
                              Video Status:{' '}
                              {activeTopic.videoResource.availabilityStatus === 'verified'
                                ? 'Verified External Video Lecture'
                                : 'External Video Unavailable — Original 5-Scene Fallback Storyboard Script'}
                            </p>
                            <span className="font-mono tabular-nums text-[11px]">
                              Checked {activeTopic.videoResource.dateChecked} · {activeTopic.videoResource.durationNote}
                            </span>
                          </div>
                          <p className="leading-relaxed">{activeTopic.videoResource.availabilityNote}</p>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {activeTopic.videoResource.availabilityStatus === 'verified' &&
                              activeTopic.videoResource.url && (
                                <a
                                  href={activeTopic.videoResource.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700 bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 whitespace-nowrap"
                                >
                                  <span>Watch Verified Video</span>
                                  <ExternalLink size={12} />
                                </a>
                              )}
                            <button
                              type="button"
                              onClick={() =>
                                downloadMarkdownFile(
                                  `${(activeTopic.chapterCode ?? activeTopic.id).toLowerCase()}-video-storyboard.md`,
                                  buildVideoScriptMarkdown(activeTopic),
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 whitespace-nowrap"
                            >
                              <Download size={13} />
                              <span>Download Storyboard Script (.md)</span>
                            </button>
                          </div>
                        </div>

                        {/* Storyboard Scenes */}
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">
                              {activeTopic.videoResource.title}
                            </h4>
                            <p className="text-xs text-slate-600">
                              Author: {activeTopic.videoResource.channelOrAuthor} · Relevance: {activeTopic.videoResource.relevance}
                            </p>
                          </div>

                          <div className="space-y-2.5">
                            {(activeTopic.videoResource.scenes ?? []).map((scene) => (
                              <div
                                key={scene.sceneNumber}
                                className="rounded-xl border border-slate-200 bg-white p-4 text-xs space-y-1.5"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="font-mono font-bold text-teal-800 tabular-nums">
                                    Scene {scene.sceneNumber} · {scene.timecode}
                                  </span>
                                  <span className="text-slate-500">Visual &amp; Narration Cue</span>
                                </div>
                                <p className="text-slate-900">
                                  <strong>Visual:</strong> {scene.visualCue}
                                </p>
                                <p className="leading-relaxed text-slate-700">
                                  <strong>Narration:</strong> {scene.narration}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* TAB 4: PRESENTATIONS (Original 9-Slide Interactive Deck Viewer + 3D Studio Links) */}
                {activeTab === 'presentations' && (
                  <div className="space-y-4" role="tabpanel" aria-label="Chapter presentations and slides">
                    {activeTopic.presentationDeck ? (
                      <ChapterDeckViewer
                        deck={activeTopic.presentationDeck}
                        chapterCode={activeTopic.chapterCode}
                      />
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-xs text-slate-700">
                        No interactive presentation deck is linked to this chapter.
                      </div>
                    )}

                    {activeDomain.platformLinks.some((pl) => pl.presentationId) && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-2">
                        <p className="font-bold text-slate-900">
                          Connected 3D Walkthrough Presentations
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {activeDomain.platformLinks
                            .filter((pl) => pl.presentationId)
                            .map((pl) => (
                              <button
                                key={pl.presentationId}
                                type="button"
                                onClick={() => onOpenPresentation(pl.presentationId!)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-teal-700 bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 whitespace-nowrap"
                              >
                                <Compass size={13} />
                                <span>{pl.label}</span>
                                <ArrowRight size={13} />
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 5: VISUALISE (2D Schematic, 3D FMA Meshes, & Honest Media Asset Disclosures) */}
                {activeTab === 'visualise' && (
                  <div className="space-y-5" role="tabpanel" aria-label="Visual learning resources">
                    {/* Chapter-Level Asset Honesty Banner */}
                    <div
                      className={`flex items-start gap-2.5 rounded-xl border p-4 text-xs ${
                        activeTopic.assetDisclosure.status === 'asset_required'
                          ? 'border-amber-200 bg-amber-50 text-amber-950'
                          : 'border-slate-200 bg-slate-50 text-slate-700'
                      }`}
                    >
                      {activeTopic.assetDisclosure.status === 'asset_required' ? (
                        <Microscope size={16} className="mt-0.5 shrink-0 text-amber-700" />
                      ) : (
                        <Layers size={16} className="mt-0.5 shrink-0 text-slate-600" />
                      )}
                      <div className="space-y-1">
                        <p className="font-bold">
                          Media Availability Disclosure: {activeTopic.assetDisclosure.status.replace(/_/g, ' ')}
                        </p>
                        <p className="leading-relaxed">{activeTopic.assetDisclosure.summary}</p>
                        {activeTopic.assetDisclosure.missingAssets &&
                          activeTopic.assetDisclosure.missingAssets.length > 0 && (
                            <ul className="list-disc space-y-0.5 pl-4 pt-1">
                              {activeTopic.assetDisclosure.missingAssets.map((ma) => (
                                <li key={ma}>{ma}</li>
                              ))}
                            </ul>
                          )}
                      </div>
                    </div>

                    {/* Interactive 2D Conceptual Schematic */}
                    {activeTopic.diagram && (() => {
                      const allLinks = activeTopic.diagram.links ?? [];
                      const activeNodeExists = activeTopic.diagram.nodes.some(
                        (n) => n.id === selectedDiagramNodeId,
                      );
                      const activeNodeId = activeNodeExists ? selectedDiagramNodeId : null;
                      const visibleLinks = activeNodeId
                        ? allLinks.filter((l) => l.from === activeNodeId || l.to === activeNodeId)
                        : allLinks;
                      const connectedNodeIds = new Set<string>();
                      if (activeNodeId) {
                        connectedNodeIds.add(activeNodeId);
                        for (const l of visibleLinks) {
                          connectedNodeIds.add(l.from);
                          connectedNodeIds.add(l.to);
                        }
                      }

                      return (
                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-sm font-bold text-slate-900">
                              {activeTopic.diagram.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              {activeNodeId && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedDiagramNodeId(null)}
                                  className="rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-teal-800 hover:bg-slate-100 whitespace-nowrap"
                                >
                                  Show All Nodes
                                </button>
                              )}
                              <span className="text-[11px] font-medium text-slate-600">
                                Interactive 2D Schematic · {activeTopic.diagram.kind}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-600">
                            {activeTopic.diagram.caption}{' '}
                            <span className="font-medium text-teal-800">
                              Select any stage below to isolate its pathway links.
                            </span>
                          </p>

                          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                            {activeTopic.diagram.nodes.map((node, idx) => {
                              const isFocused = activeNodeId === node.id;
                              const isDimmed = Boolean(activeNodeId && !connectedNodeIds.has(node.id));
                              return (
                                <button
                                  key={node.id}
                                  type="button"
                                  aria-pressed={isFocused}
                                  onClick={() =>
                                    setSelectedDiagramNodeId((prev) =>
                                      prev === node.id ? null : node.id,
                                    )
                                  }
                                  className={`rounded-lg border p-3 text-left transition-all ${
                                    NODE_TONE_CLASSES[node.tone ?? 'slate']
                                  } ${
                                    isFocused
                                      ? 'ring-2 ring-teal-700 shadow-xs'
                                      : isDimmed
                                        ? 'opacity-45 hover:opacity-85'
                                        : 'hover:shadow-xs'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/90 font-mono text-[11px] font-bold tabular-nums text-slate-800">
                                      {idx + 1}
                                    </span>
                                    <span className="text-xs font-bold">{node.label}</span>
                                  </div>
                                  {node.sublabel && (
                                    <p className="mt-1 pl-7 text-xs opacity-90">{node.sublabel}</p>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {visibleLinks.length > 0 && (
                            <div className="rounded-lg border border-slate-200 bg-white/90 p-3">
                              <p className="text-[11px] font-semibold text-slate-600">
                                {activeNodeId
                                  ? 'Focused Stage Connections'
                                  : `Pathway Connections (${visibleLinks.length})`}
                              </p>
                              <ul className="mt-1.5 space-y-1 text-xs text-slate-700">
                                {visibleLinks.map((lnk) => {
                                  const fromNode = activeTopic.diagram?.nodes.find(
                                    (n) => n.id === lnk.from,
                                  );
                                  const toNode = activeTopic.diagram?.nodes.find(
                                    (n) => n.id === lnk.to,
                                  );
                                  return (
                                    <li
                                      key={`${lnk.from}-${lnk.to}-${lnk.label ?? ''}`}
                                      className="flex flex-wrap items-center gap-1.5"
                                    >
                                      <span className="font-semibold text-slate-900">
                                        {fromNode?.label ?? lnk.from}
                                      </span>
                                      <ArrowRight size={12} className="shrink-0 text-teal-700" />
                                      <span className="font-semibold text-slate-900">
                                        {toNode?.label ?? lnk.to}
                                      </span>
                                      {lnk.label && (
                                        <span className="text-slate-600">— {lnk.label}</span>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}

                          <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <AlertTriangle size={12} className="shrink-0" />
                            <span>{activeTopic.diagram.disclaimer}</span>
                          </p>
                        </div>
                      );
                    })()}

                    {/* Connected 3D Meshes & Organ System Views */}
                    {activeTopic.relatedFmaConceptIds.length > 0 && effectiveAtlas && (
                      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">
                              Inline Interactive 3D Preview ({activeTopic.relatedFmaConceptIds.length} mapped structure{activeTopic.relatedFmaConceptIds.length === 1 ? '' : 's'})
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              Preview highlighted BodyParts3D / Female HRA meshes alongside this chapter.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowInline3D((v) => !v)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-teal-700 bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 whitespace-nowrap"
                          >
                            {showInline3D ? 'Hide 3D Preview' : 'Open Inline 3D Preview'}
                          </button>
                        </div>

                        {showInline3D && (() => {
                          const partIds = activeTopic.relatedFmaConceptIds.flatMap(
                            (cid) => effectiveAtlas.concepts.find((c) => c.id === cid)?.elements ?? [],
                          );
                          return (
                            <Persistent3DPane
                              atlas={effectiveAtlas}
                              matchedPartIds={partIds}
                              anatomySex={state.preferredSex}
                              onSexChange={setPreferredSex}
                              onSelectConcept={(cid) => onInspectConcept(cid)}
                              in3DModel={partIds.length > 0}
                              highlightedLabel={activeTopic.title}
                              compact
                              hideToolbarViews
                            />
                          );
                        })()}
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {activeTopic.relatedFmaConceptIds.length > 0 && (
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <h4 className="text-xs font-bold text-slate-700">
                            Verified 3D BodyParts3D Structures
                          </h4>
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {activeTopic.relatedFmaConceptIds.map((fmaId) => (
                              <button
                                key={fmaId}
                                type="button"
                                onClick={() => onInspectConcept(fmaId)}
                                className="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-50"
                              >
                                <span>{conceptNameMap.get(fmaId) ?? fmaId}</span>
                                <ArrowRight size={12} />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeTopic.relatedSystems.length > 0 && (
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <h4 className="text-xs font-bold text-slate-700">
                            Connected Organ System Modules
                          </h4>
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {activeTopic.relatedSystems.map((sysId) => {
                              const sys = CANONICAL_SYSTEMS.find((s) => s.id === sysId);
                              return (
                                <button
                                  key={sysId}
                                  type="button"
                                  onClick={() => onOpenSystemLesson(sysId)}
                                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100"
                                >
                                  {sys?.name.en ?? sysId}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bundled De-Identified Normal Radiology Reference Gallery (Domain N) */}
                    {activeDomain.id === 'radiology_imaging' && (
                      <div
                        className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-4"
                        data-testid="radiology-reference-gallery"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">
                              Bundled Normal Clinical Imaging Reference Plates ({RADIOLOGY_CASES.length} Modalities)
                            </h4>
                            <p className="text-xs text-slate-600">
                              De-identified normal CC0 / CC BY / CC BY-SA reference studies for anatomical correlation. Broader 14-chapter Domain N pathology series remain text-first (<code>asset_required</code>).
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter radiology modality">
                            {(['all', 'X-Ray', 'CT', 'MRI', 'Ultrasound'] as const).map((mod) => (
                              <button
                                key={mod}
                                type="button"
                                onClick={() => setRadiologyFilter(mod)}
                                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
                                  radiologyFilter === mod
                                    ? 'border-teal-700 bg-teal-700 text-white'
                                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                {mod === 'all' ? 'All Modalities' : mod}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                          {RADIOLOGY_CASES.filter(
                            (rc) => radiologyFilter === 'all' || rc.modality === radiologyFilter,
                          ).map((rc) => (
                            <article
                              key={rc.id}
                              className="rounded-xl border border-slate-200 bg-white p-4 space-y-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                <span className="font-mono font-bold text-teal-800">
                                  {rc.modality} · {rc.planeOrProjection}
                                </span>
                                <span className="text-slate-500">{rc.license}</span>
                              </div>
                              <h5 className="text-sm font-bold text-slate-900">{rc.title}</h5>
                              <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
                                <img
                                  src={rc.imageUrl}
                                  alt={`${rc.title} — ${rc.planeOrProjection}`}
                                  loading="lazy"
                                  className="h-60 w-full object-contain"
                                />
                              </div>
                              <p className="text-xs leading-relaxed text-slate-700">{rc.summary}</p>
                              <p className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[11px] text-slate-700">
                                <strong>Orientation &amp; Signal Convention:</strong> {rc.orientationConvention}
                              </p>
                              <div>
                                <p className="text-[11px] font-bold text-slate-700">Key Landmarks</p>
                                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-slate-700">
                                  {rc.anatomicalLandmarks.map((lm) => (
                                    <li key={lm}>{lm}</li>
                                  ))}
                                </ul>
                              </div>
                              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-[11px] text-slate-600">
                                <span>
                                  {rc.author} · {rc.license} ·{' '}
                                  <a
                                    href={rc.sourceUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-semibold text-teal-800 hover:underline"
                                  >
                                    Commons Source
                                  </a>
                                </span>
                                {rc.linkedConceptIds[0] && (
                                  <button
                                    type="button"
                                    onClick={() => onInspectConcept(rc.linkedConceptIds[0])}
                                    className="inline-flex items-center gap-1 rounded border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-100"
                                  >
                                    <span>Inspect 3D Structure</span>
                                    <ArrowRight size={12} />
                                  </button>
                                )}
                              </div>
                              <p className="text-[11px] text-amber-800">{rc.clinicalDisclaimer}</p>
                            </article>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 6: PRACTISE (MCQs, Expandable Short Answers, Applied Reasoning Case, & Activity) */}
                {activeTab === 'practise' && (
                  <div className="space-y-6" role="tabpanel" aria-label="Practise assessments and activities">
                    {/* Applied Learning Activity */}
                    {activeTopic.activity && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                        <p className="text-xs font-bold text-teal-800">
                          Applied Activity · {activeTopic.activity.kind.replace(/_/g, ' ')}
                        </p>
                        <h4 className="text-sm font-bold text-slate-900">{activeTopic.activity.title}</h4>
                        <p className="text-xs leading-relaxed text-slate-700">{activeTopic.activity.prompt}</p>
                        <p className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-700">
                          <strong>Key Takeaway:</strong> {activeTopic.activity.keyTakeaway}
                        </p>
                      </div>
                    )}

                    {/* Self-Assessment MCQs */}
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                          <BookOpen size={15} className="text-teal-700" />
                          <span>Self-Assessment Concept Check ({activeTopic.selfChecks.length} MCQs)</span>
                        </h4>
                        <span className="font-mono text-xs text-slate-600 tabular-nums">
                          Answered{' '}
                          {
                            activeTopic.selfChecks.filter((q) => answersByQuestion[q.id] !== undefined)
                              .length
                          }
                          /{activeTopic.selfChecks.length}
                        </span>
                      </div>

                      {activeTopic.selfChecks.map((q, qIdx) => {
                        const chosen = answersByQuestion[q.id];
                        const answered = chosen !== undefined;
                        const isCorrect = chosen === q.correctIndex;
                        return (
                          <div
                            key={q.id}
                            className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-900">
                                <span className="font-mono text-teal-800 tabular-nums mr-1.5">
                                  Q{qIdx + 1}.
                                </span>
                                {q.question}
                              </p>
                              <span className="text-[11px] font-medium text-slate-500 shrink-0">
                                {getTrackById(q.level)?.shortLabel ?? q.level}
                              </span>
                            </div>

                            <div
                              className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2"
                              role="radiogroup"
                              aria-label={q.question}
                            >
                              {q.options.map((opt, idx) => {
                                const selected = chosen === idx;
                                let style =
                                  'border-slate-200 bg-white text-slate-800 hover:border-teal-600';
                                if (answered) {
                                  if (idx === q.correctIndex) {
                                    style =
                                      'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold';
                                  } else if (selected) {
                                    style = 'border-rose-400 bg-rose-50 text-rose-950';
                                  }
                                }
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    role="radio"
                                    aria-checked={selected}
                                    onClick={() =>
                                      handleAnswer(q.id, idx, q.correctIndex, activeTopic.title)
                                    }
                                    className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${style}`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>

                            {answered && (
                              <div
                                className={`mt-3 flex items-start gap-2 rounded-lg border p-2.5 text-xs ${
                                  isCorrect
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                                    : 'border-rose-200 bg-rose-50 text-rose-950'
                                }`}
                              >
                                {isCorrect ? (
                                  <CheckCircle2
                                    size={15}
                                    className="mt-0.5 shrink-0 text-emerald-700"
                                  />
                                ) : (
                                  <XCircle size={15} className="mt-0.5 shrink-0 text-rose-700" />
                                )}
                                <p>{q.explanation}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Structured Short-Answer Exercises */}
                    {activeTopic.shortAnswerExercises &&
                      activeTopic.shortAnswerExercises.length > 0 && (
                        <div className="space-y-3 border-t border-slate-200 pt-5">
                          <h4 className="text-sm font-bold text-slate-900">
                            Structured Short-Answer Exercises ({activeTopic.shortAnswerExercises.length})
                          </h4>
                          {activeTopic.shortAnswerExercises.map((sa, idx) => {
                            const open = Boolean(revealedShortAnswers[sa.id]);
                            return (
                              <div
                                key={sa.id}
                                className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <p className="text-xs font-semibold leading-relaxed text-slate-900">
                                    <span className="font-mono text-teal-800 tabular-nums mr-1.5">
                                      SA{idx + 1}.
                                    </span>
                                    {sa.prompt}
                                  </p>
                                  <button
                                    type="button"
                                    aria-expanded={open}
                                    onClick={() =>
                                      setRevealedShortAnswers((prev) => ({
                                        ...prev,
                                        [sa.id]: !prev[sa.id],
                                      }))
                                    }
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-100 whitespace-nowrap shrink-0"
                                  >
                                    <span>{open ? 'Hide Rubric' : 'Reveal Model Answer & Rubric'}</span>
                                    {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                  </button>
                                </div>

                                {open && (
                                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs space-y-2">
                                    <div>
                                      <p className="font-semibold text-slate-900">Expected Marking Points</p>
                                      <ul className="mt-1 list-disc space-y-1 pl-4 text-slate-700">
                                        {sa.expectedPoints.map((pt) => (
                                          <li key={pt}>{pt}</li>
                                        ))}
                                      </ul>
                                    </div>
                                    <div>
                                      <p className="font-semibold text-slate-900">Model Answer</p>
                                      <p className="mt-1 leading-relaxed text-slate-700">
                                        {sa.modelAnswer}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                    {/* Worked Applied / Clinical Reasoning Exercise */}
                    {activeTopic.appliedReasoningExercises &&
                      activeTopic.appliedReasoningExercises.length > 0 && (
                        <div className="space-y-3 border-t border-slate-200 pt-5">
                          <h4 className="text-sm font-bold text-slate-900">
                            Applied &amp; Clinical Reasoning Exercise
                          </h4>
                          {activeTopic.appliedReasoningExercises.map((ar) => {
                            const open = Boolean(revealedCases[ar.id]);
                            return (
                              <div
                                key={ar.id}
                                className="rounded-xl border border-slate-200 bg-white p-4 space-y-3"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div>
                                    <h5 className="text-sm font-bold text-slate-900">{ar.title}</h5>
                                    <p className="mt-1 text-xs leading-relaxed text-slate-700">
                                      {ar.scenario}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    aria-expanded={open}
                                    onClick={() =>
                                      setRevealedCases((prev) => ({
                                        ...prev,
                                        [ar.id]: !prev[ar.id],
                                      }))
                                    }
                                    className="inline-flex items-center gap-1 rounded-lg border border-teal-700 bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 whitespace-nowrap shrink-0"
                                  >
                                    <span>{open ? 'Hide Worked Solution' : 'Reveal Worked Solution'}</span>
                                    {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                  </button>
                                </div>

                                <ol className="list-decimal space-y-1 pl-5 text-xs font-medium text-slate-800">
                                  {ar.questions.map((qText) => (
                                    <li key={qText}>{qText}</li>
                                  ))}
                                </ol>

                                {open && (
                                  <div className="rounded-lg border border-teal-200 bg-teal-50/40 p-3.5 text-xs text-slate-800 space-y-1">
                                    <p className="font-bold text-teal-900">Worked Solution &amp; Synthesis</p>
                                    <p className="leading-relaxed">{ar.workedSolution}</p>
                                  </div>
                                )}

                                {ar.disclaimer && (
                                  <p className="text-[11px] text-slate-500">{ar.disclaimer}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                  </div>
                )}

                {/* TAB 7: REFERENCES (Curriculum Alignment, Cross-Subject Links, Sources & Section 7 Tracker) */}
                {activeTab === 'references' && (
                  <div className="space-y-5" role="tabpanel" aria-label="References, alignment and completion tracker">
                    {/* Cross-Subject Connections */}
                    {activeTopic.crossSubjectLinks.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-700">Cross-Subject Biomedical Links</h4>
                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {activeTopic.crossSubjectLinks.map((csl) => {
                            const targetDom = getDomainById(csl.domainId);
                            return (
                              <button
                                key={`${csl.domainId}-${csl.relation}`}
                                type="button"
                                onClick={() => handleSelectDomain(csl.domainId)}
                                className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-left text-xs hover:bg-slate-100"
                              >
                                <span className="font-bold text-teal-800">
                                  {targetDom ? `${targetDom.code} · ${targetDom.shortTitle}` : csl.domainId}
                                </span>
                                <span className="mt-0.5 block text-slate-600">{csl.relation}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Curriculum Mappings */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-700">Curriculum Alignment</h4>
                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {activeTopic.curriculumMappings.map((cm) => {
                          const fw = getFrameworkById(cm.frameworkId);
                          return (
                            <div
                              key={`${cm.frameworkId}-${cm.unitOrModule}`}
                              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
                            >
                              <strong className="text-slate-900">{fw?.country ?? cm.frameworkId}</strong> ({cm.gradeOrYear}): {cm.unitOrModule}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Educational Sources */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-700">Educational Sources &amp; Provenance</h4>
                      <ul className="mt-2 space-y-1.5 text-xs">
                        {activeTopic.sources.map((src) => (
                          <li key={src.title} className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-slate-900">{src.title}</span>
                            <span className="text-slate-500">({src.authority})</span>
                            {src.url && (
                              <a
                                href={src.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 font-semibold text-teal-800 hover:underline"
                              >
                                <span>Open Source</span>
                                <ExternalLink size={11} />
                              </a>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Section 7 Transparent Content Completion Tracker */}
                    {activeTopic.completionTracker && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-900">
                              Section 7 Content Completion &amp; Academic Transparency Tracker
                            </h4>
                            <p className="text-xs text-slate-600">
                              Separates written material completeness, external media availability, technical integration, and human faculty review.
                            </p>
                          </div>
                          <button
                            type="button"
                            aria-expanded={showFullPlatformMatrix}
                            onClick={() => setShowFullPlatformMatrix((v) => !v)}
                            className="inline-flex items-center gap-1 self-start rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 whitespace-nowrap shrink-0"
                          >
                            <span>
                              {showFullPlatformMatrix
                                ? 'Hide All-16-Domain Matrix'
                                : 'View All-16-Domain Matrix'}
                            </span>
                            {showFullPlatformMatrix ? (
                              <ChevronUp size={13} />
                            ) : (
                              <ChevronDown size={13} />
                            )}
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 text-xs">
                          <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                            <p className="text-slate-500">Learning Outcomes</p>
                            <p className="mt-0.5 font-mono font-bold text-slate-900 tabular-nums">
                              {activeTopic.completionTracker.completedLearningOutcomes}/
                              {activeTopic.completionTracker.plannedLearningOutcomes}
                            </p>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                            <p className="text-slate-500">Written Lesson</p>
                            <p className="mt-0.5 font-semibold text-teal-800">
                              {STATUS_LABELS[activeTopic.completionTracker.writtenMaterialStatus]}
                            </p>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                            <p className="text-slate-500">External Videos</p>
                            <p className="mt-0.5 font-mono font-bold text-amber-800 tabular-nums">
                              {platformSummary.verifiedVideosCount} live · Fallback Script Ready
                            </p>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                            <p className="text-slate-500">Faculty Review</p>
                            <p className="mt-0.5 font-semibold text-slate-800">
                              {STATUS_LABELS[activeTopic.completionTracker.reviewStatus]}
                            </p>
                          </div>
                        </div>

                        {activeTopic.completionTracker.knownLimitations.length > 0 && (
                          <div className="text-xs text-slate-700">
                            <p className="font-semibold text-slate-900">Declared Chapter Limitations</p>
                            <ul className="mt-1 list-disc space-y-0.5 pl-4">
                              {activeTopic.completionTracker.knownLimitations.map((lim) => (
                                <li key={lim}>{lim}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {showFullPlatformMatrix && (
                          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                            <table className="w-full border-collapse text-left text-xs">
                              <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                                <tr>
                                  <th className="px-3 py-2">Domain</th>
                                  <th className="px-3 py-2 text-right">Chapters</th>
                                  <th className="px-3 py-2 text-right">Readings</th>
                                  <th className="px-3 py-2 text-right">9-Slide Decks</th>
                                  <th className="px-3 py-2 text-right">Verified Videos</th>
                                  <th className="px-3 py-2 text-right">MCQs</th>
                                  <th className="px-3 py-2 text-right">Asset Blocked</th>
                                  <th className="px-3 py-2 text-right">Faculty Reviewed</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-mono tabular-nums text-slate-800">
                                {platformSummary.byDomain.map((d) => (
                                  <tr key={d.domainId} className="hover:bg-slate-50">
                                    <td className="px-3 py-2 font-sans font-semibold text-slate-900">
                                      {d.code} · {d.shortTitle}
                                    </td>
                                    <td className="px-3 py-2 text-right">{d.totalChapters}</td>
                                    <td className="px-3 py-2 text-right">{d.readingLinksTotal}</td>
                                    <td className="px-3 py-2 text-right">{d.presentationDecksCount}</td>
                                    <td className="px-3 py-2 text-right text-amber-800">
                                      {d.verifiedVideosCount}
                                    </td>
                                    <td className="px-3 py-2 text-right">{d.mcqTotal}</td>
                                    <td className="px-3 py-2 text-right">{d.assetBlockedChaptersCount}</td>
                                    <td className="px-3 py-2 text-right">{d.facultyReviewedCount}</td>
                                  </tr>
                                ))}
                                <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                                  <td className="px-3 py-2 font-sans">Platform Total (16 Domains)</td>
                                  <td className="px-3 py-2 text-right">{platformSummary.totalChapters}</td>
                                  <td className="px-3 py-2 text-right">{platformSummary.readingLinksTotal}</td>
                                  <td className="px-3 py-2 text-right">{platformSummary.presentationDecksCount}</td>
                                  <td className="px-3 py-2 text-right text-amber-800">
                                    {platformSummary.verifiedVideosCount}
                                  </td>
                                  <td className="px-3 py-2 text-right">{platformSummary.mcqTotal}</td>
                                  <td className="px-3 py-2 text-right">{platformSummary.assetBlockedChaptersCount}</td>
                                  <td className="px-3 py-2 text-right">{platformSummary.facultyReviewedCount}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </article>
      </div>
    </div>
  );
}
