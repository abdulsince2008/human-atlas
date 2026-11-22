import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Compass,
  ExternalLink,
  GraduationCap,
  Layers,
  Microscope,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import type { Atlas } from '../anatomy';
import { CANONICAL_SYSTEMS, type CanonicalSystemId } from '../anatomy-systems';
import {
  filterTopicsForTrackAndFramework,
  getFrameworkById,
  getTrackById,
  getVisibleDomainsForFilter,
  resolveExplanationForTrack,
} from '../education/education-content';
import {
  CURRICULUM_FRAMEWORKS,
  EDUCATION_TRACKS,
} from '../education/education-curricula';
import type {
  CoverageStatus,
  CurriculumAuthorityId,
  DiagramNode,
  EducationDomainId,
  EducationTrackId,
} from '../education/education-types';
import type { AppRoute } from './SiteHeader';
import { useStudy } from './StudyContext';

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
}

const COVERAGE_BADGE: Record<
  CoverageStatus,
  { label: string; className: string }
> = {
  implemented_validated: {
    label: 'Core 3D Anatomy · Unreviewed by Faculty',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  implemented_partial: {
    label: 'Introductory Overview (1–2 Modules)',
    className: 'bg-teal-50 text-teal-800 border-teal-200',
  },
  content_only_no_visual: {
    label: 'Content Only',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  asset_missing: {
    label: 'External Media Asset Required',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  planned_scaffold_only: {
    label: 'Planned Scaffold',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  not_present: {
    label: 'Not Present',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  out_of_scope: {
    label: 'Out of Scope',
    className: 'bg-slate-100 text-slate-500 border-slate-200',
  },
};

const NODE_TONE_CLASSES: Record<NonNullable<DiagramNode['tone']>, string> = {
  teal: 'border-teal-300 bg-teal-50/70 text-teal-950',
  blue: 'border-blue-300 bg-blue-50/70 text-blue-950',
  amber: 'border-amber-300 bg-amber-50/70 text-amber-950',
  rose: 'border-rose-300 bg-rose-50/70 text-rose-950',
  emerald: 'border-emerald-300 bg-emerald-50/70 text-emerald-950',
  slate: 'border-slate-300 bg-slate-50 text-slate-900',
};

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
}: Props) {
  const { state, setTopicCompleted, recordQuizResult } = useStudy();
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
  const [answersByQuestion, setAnswersByQuestion] = useState<Record<string, number>>({});
  const [selectedDiagramNodeId, setSelectedDiagramNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (initialFrameworkId) {
      setFrameworkFilter(initialFrameworkId);
    } else if (initialDomainId || initialTopicId) {
      // Clear restrictive curriculum filters when deep-linking directly to a domain/topic
      setFrameworkFilter('all');
    }
    if (initialTrackId) {
      setSelectedTrack(initialTrackId);
    } else if (initialDomainId) {
      // Ensure selected track actually includes this domain so it stays visible
      const matched = filterTopicsForTrackAndFramework(initialDomainId, 'all', 'all')[0];
      if (matched && !matched.targetTracks.includes(selectedTrack)) {
        setSelectedTrack(matched.targetTracks[0]);
      }
    }
    if (initialDomainId) {
      setActiveDomainId(initialDomainId);
      setSelectedDiagramNodeId(null);
      if (!initialTopicId) {
        const firstTopic = filterTopicsForTrackAndFramework(initialDomainId, 'all', 'all')[0];
        if (firstTopic) setActiveTopicId(firstTopic.id);
      }
    }
    if (initialTopicId) {
      setActiveTopicId(initialTopicId);
      setSelectedDiagramNodeId(null);
    }
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

  const activeTopic = useMemo(() => {
    if (domainTopics.length === 0) return null;
    return domainTopics.find((t) => t.id === activeTopicId) ?? domainTopics[0];
  }, [domainTopics, activeTopicId]);

  const depthInfo = useMemo(
    () => (activeTopic ? resolveExplanationForTrack(activeTopic, selectedTrack) : null),
    [activeTopic, selectedTrack],
  );

  const activeTrackSpec = getTrackById(selectedTrack) ?? EDUCATION_TRACKS[1];
  const isTopicDone = activeTopic ? state.completedTopicIds.includes(activeTopic.id) : false;

  const handleSelectDomain = (domId: EducationDomainId) => {
    setActiveDomainId(domId);
    setSelectedDiagramNodeId(null);
    const firstTopic = filterTopicsForTrackAndFramework(domId, selectedTrack, frameworkFilter)[0];
    if (firstTopic) setActiveTopicId(firstTopic.id);
  };

  const handleAnswer = (questionId: string, optionIdx: number, correctIndex: number, label: string) => {
    setAnswersByQuestion((prev) => ({ ...prev, [questionId]: optionIdx }));
    recordQuizResult(questionId, optionIdx === correctIndex, label);
  };

  return (
    <div className="space-y-6">
      {/* Educational Scope & Track Selector Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              Biomedical Curriculum Overview (Introductory Reference Modules)
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Select Your Learning Level &amp; Curriculum Reference
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {activeTrackSpec.description}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="curriculum-framework-select"
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Curriculum Reference Filter
            </label>
            <select
              id="curriculum-framework-select"
              value={frameworkFilter}
              onChange={(e) => setFrameworkFilter(e.target.value as CurriculumAuthorityId | 'all')}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-600 focus:outline-none"
            >
              <option value="all">All {CURRICULUM_FRAMEWORKS.length} Curriculum References</option>
              {CURRICULUM_FRAMEWORKS.map((fw) => (
                <option key={fw.id} value={fw.id}>
                  {fw.country} — {fw.title.replace(/^[^—]+—\s*/, '').slice(0, 48)}
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
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
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

        <p className="mt-3 text-xs text-slate-500">
          <strong>Educational Boundary:</strong> Anatomy 360 is an educational learning platform, not a substitute for an accredited medical degree, cadaveric dissection, clinical placements, supervised practice, or medical advice. All content is currently <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">structured_reference</code> (pending formal faculty sign-off).
        </p>
      </section>

      {/* Main Split Workspace: Domain Sidebar + Topic Reader */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Sidebar: 16 Domains */}
        <aside
          className="space-y-2 lg:col-span-4"
          aria-label="Human biology and medical science domains"
        >
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Subjects ({visibleDomains.length} matching)
            </h3>
            {frameworkFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setFrameworkFilter('all')}
                className="text-xs font-medium text-teal-700 hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            {visibleDomains.map((dom) => {
              const isSelected = activeDomain?.id === dom.id;
              const badge = COVERAGE_BADGE[dom.coverageStatus];
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
                  className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                    isSelected
                      ? 'border-teal-600 bg-teal-50/60 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                      isSelected ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {dom.code}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold leading-snug text-slate-900">
                      {dom.shortTitle}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {topicCount} {topicCount === 1 ? 'module' : 'modules'}
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Reader: Domain Overview + Active Topic */}
        <article className="space-y-5 lg:col-span-8">
          {!activeDomain || !activeTopic || !depthInfo ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
              <p className="text-sm font-semibold text-slate-900">
                No introductory modules match this learning level and curriculum reference.
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Try switching to a matching learning track or resetting the curriculum reference filter.
              </p>
              <button
                type="button"
                onClick={() => setFrameworkFilter('all')}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-teal-700 bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-800"
              >
                Reset Curriculum Filter
              </button>
            </div>
          ) : (
            <>
          {/* Domain Header & Platform Connections */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                  Domain {activeDomain.code} · Priority {activeDomain.priority} · Review: {activeDomain.reviewStatus.replace(/_/g, ' ')}
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {activeDomain.title}
                </h2>
              </div>
              <span
                className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${COVERAGE_BADGE[activeDomain.coverageStatus].className}`}
              >
                {COVERAGE_BADGE[activeDomain.coverageStatus].label}
              </span>
            </div>

            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              {activeDomain.overview}
            </p>

            {/* Platform Deep-Links & Educator Workspace */}
            <div className="mt-4 flex flex-wrap gap-2">
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
                  className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-900 hover:bg-teal-100 whitespace-nowrap"
                >
                  <Compass size={13} />
                  <span>{pl.label}</span>
                  <ArrowRight size={13} />
                </button>
              ))}
              {onOpenEducatorWorkspace && (
                <button
                  type="button"
                  onClick={() => onOpenEducatorWorkspace(activeDomain.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap"
                >
                  <ClipboardList size={13} />
                  <span>Prepare Lesson in Educator Workspace</span>
                </button>
              )}
            </div>

            {/* Honest Asset Disclosure Banner */}
            <div
              className={`mt-4 flex items-start gap-2.5 rounded-xl border p-3 text-xs ${
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
                  Visual &amp; Asset Status: {activeDomain.assetDisclosure.status.replace(/_/g, ' ')}
                </p>
                <p className="mt-0.5 leading-relaxed">{activeDomain.assetDisclosure.summary}</p>
              </div>
            </div>

            {activeDomain.educationalDisclaimer && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-950">
                <ShieldAlert size={15} className="mt-0.5 shrink-0 text-rose-700" />
                <p>{activeDomain.educationalDisclaimer}</p>
              </div>
            )}
          </div>

          {/* Topic Selector (when domain has multiple foundational topics) */}
          {domainTopics.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {domainTopics.map((tp) => (
                <button
                  key={tp.id}
                  type="button"
                  onClick={() => {
                    setActiveTopicId(tp.id);
                    setSelectedDiagramNodeId(null);
                  }}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                    tp.id === activeTopic.id
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {tp.title}
                </button>
              ))}
            </div>
          )}

          {/* Active Topic Content Card */}
          <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {activeTopic.chapterTitle}
                </p>
                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  {activeTopic.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTopicCompleted(activeTopic.id, !isTopicDone, activeTopic.title)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isTopicDone
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 size={14} />
                <span>{isTopicDone ? 'Completed' : 'Mark Completed'}</span>
              </button>
            </div>

            {/* Learning Objectives */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Learning Objectives
              </h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {activeTopic.learningObjectives.map((obj) => (
                  <li key={obj}>{obj}</li>
                ))}
              </ul>
            </div>

            {/* Level-Differentiated Explanation */}
            <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-800">
                  Explanation ({getTrackById(depthInfo.trackUsed)?.shortLabel ?? depthInfo.trackUsed})
                </h4>
                {depthInfo.trackUsed !== selectedTrack && (
                  <span className="text-[11px] text-slate-500">
                    Showing closest available track depth
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-800">
                {depthInfo.text}
              </p>
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
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-900">
                      {activeTopic.diagram.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      {activeNodeId && (
                        <button
                          type="button"
                          onClick={() => setSelectedDiagramNodeId(null)}
                          className="rounded border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-teal-800 hover:bg-slate-100"
                        >
                          Show All Nodes
                        </button>
                      )}
                      <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                        Interactive 2D Schematic · {activeTopic.diagram.kind}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    {activeTopic.diagram.caption}{' '}
                    <span className="text-teal-800 font-medium">
                      Click any stage below to trace its incoming &amp; outgoing pathway links.
                    </span>
                  </p>

                  <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {activeTopic.diagram.nodes.map((node, idx) => {
                      const isFocused = activeNodeId === node.id;
                      const isDimmed = Boolean(activeNodeId && !connectedNodeIds.has(node.id));
                      return (
                        <button
                          key={node.id}
                          type="button"
                          aria-pressed={isFocused}
                          onClick={() =>
                            setSelectedDiagramNodeId((prev) => (prev === node.id ? null : node.id))
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
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/85 text-[11px] font-bold text-slate-700">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold">{node.label}</span>
                          </div>
                          {node.sublabel && (
                            <p className="mt-1 pl-7 text-xs opacity-85">{node.sublabel}</p>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {visibleLinks.length > 0 && (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-white/85 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        {activeNodeId
                          ? 'Focused Stage Connections'
                          : `Pathway Connections (${visibleLinks.length})`}
                      </p>
                      <ul className="mt-1.5 space-y-1 text-xs text-slate-700">
                        {visibleLinks.map((lnk) => {
                          const fromNode = activeTopic.diagram?.nodes.find((n) => n.id === lnk.from);
                          const toNode = activeTopic.diagram?.nodes.find((n) => n.id === lnk.to);
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

                  <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <AlertTriangle size={12} className="shrink-0" />
                    <span>{activeTopic.diagram.disclaimer}</span>
                  </p>
                </div>
              );
            })()}

            {/* Key Terminology & Key Facts */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Key Concepts &amp; Terminology
                </h4>
                <dl className="mt-2 space-y-2">
                  {activeTopic.keyConcepts.map((kc) => (
                    <div key={kc.term} className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                      <dt className="text-xs font-bold text-slate-900">{kc.term}</dt>
                      <dd className="mt-0.5 text-xs text-slate-600">{kc.definition}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    High-Yield Facts
                  </h4>
                  <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-slate-700">
                    {activeTopic.keyFacts.map((fact) => (
                      <li key={fact}>{fact}</li>
                    ))}
                  </ul>
                </div>

                {/* Verified 3D Structure Links */}
                {activeTopic.relatedFmaConceptIds.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Connected 3D Structures (Verified Meshes)
                    </h4>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {activeTopic.relatedFmaConceptIds.map((fmaId) => (
                        <button
                          key={fmaId}
                          type="button"
                          onClick={() => onInspectConcept(fmaId)}
                          className="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-white px-2.5 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-50"
                        >
                          <span>{conceptNameMap.get(fmaId) ?? fmaId}</span>
                          <ArrowRight size={12} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Connected Organ Systems */}
                {activeTopic.relatedSystems.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Related Organ Systems
                    </h4>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {activeTopic.relatedSystems.map((sysId) => {
                        const sys = CANONICAL_SYSTEMS.find((s) => s.id === sysId);
                        return (
                          <button
                            key={sysId}
                            type="button"
                            onClick={() => onOpenSystemLesson(sysId)}
                            className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                          >
                            {sys?.name.en ?? sysId}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Practical / Interpretation Activity */}
            {activeTopic.activity && (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                  Applied Learning Activity · {activeTopic.activity.kind.replace(/_/g, ' ')}
                </p>
                <h4 className="mt-1 text-sm font-bold text-slate-900">
                  {activeTopic.activity.title}
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-slate-700">
                  {activeTopic.activity.prompt}
                </p>
                <p className="mt-2 rounded-lg bg-white/80 p-2.5 text-xs text-slate-700">
                  <strong>Key Takeaway:</strong> {activeTopic.activity.keyTakeaway}
                </p>
              </div>
            )}

            {/* Self-Assessment Knowledge Check */}
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                <BookOpen size={14} />
                <span>Self-Assessment Concept Check</span>
              </h4>

              {activeTopic.selfChecks.map((q) => {
                const chosen = answersByQuestion[q.id];
                const answered = chosen !== undefined;
                const isCorrect = chosen === q.correctIndex;
                return (
                  <div
                    key={q.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                  >
                    <p className="text-sm font-semibold text-slate-900">{q.question}</p>
                    <div
                      className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2"
                      role="radiogroup"
                      aria-label={q.question}
                    >
                      {q.options.map((opt, idx) => {
                        const selected = chosen === idx;
                        let style = 'border-slate-200 bg-white text-slate-800 hover:border-teal-400';
                        if (answered) {
                          if (idx === q.correctIndex) {
                            style = 'border-emerald-400 bg-emerald-50 text-emerald-950 font-semibold';
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
                            onClick={() => handleAnswer(q.id, idx, q.correctIndex, activeTopic.title)}
                            className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${style}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {answered && (
                      <div
                        className={`mt-3 flex items-start gap-2 rounded-lg p-2.5 text-xs ${
                          isCorrect
                            ? 'bg-emerald-50 text-emerald-900'
                            : 'bg-rose-50 text-rose-900'
                        }`}
                      >
                        {isCorrect ? (
                          <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-700" />
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

            {/* Curriculum Mapping & Source Provenance Footer */}
            <div className="space-y-3 border-t border-slate-100 pt-4 text-xs text-slate-600">
              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-500">
                  Curriculum Alignment
                </h4>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {activeTopic.curriculumMappings.map((cm) => {
                    const fw = getFrameworkById(cm.frameworkId);
                    return (
                      <span
                        key={`${cm.frameworkId}-${cm.unitOrModule}`}
                        className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-700"
                      >
                        <strong>{fw?.country ?? cm.frameworkId}</strong> ({cm.gradeOrYear}): {cm.unitOrModule}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-500">
                  Educational Sources
                </h4>
                <ul className="mt-1.5 space-y-1">
                  {activeTopic.sources.map((src) => (
                    <li key={src.title} className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium text-slate-800">{src.title}</span>
                      <span className="text-slate-500">({src.authority})</span>
                      {src.url && (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-0.5 text-teal-700 hover:underline"
                        >
                          <span>Source</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
            </>
          )}
        </article>
      </div>
    </div>
  );
}
