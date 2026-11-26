import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  CheckCircle2,
  Compass,
  ExternalLink,
  Eye,
  GitBranch,
  HelpCircle,
  Microscope,
  Play,
  Sparkles,
  Stethoscope,
  XCircle,
} from 'lucide-react';
import { generateAdaptiveRecommendations } from '../adaptive-study';
import type { Atlas, SystemId } from '../anatomy';
import { CANONICAL_SYSTEMS, type CanonicalSystemId } from '../anatomy-systems';
import type { AnatomySex } from '../atlas-layers';
import { getStructureRecordV2 } from '../knowledge-graph';
import { computeRegistryMetrics, REGISTRY_TOPICS } from '../registry/knowledge-registry';
import {
  resolveStudyContext,
  type ResolvedMcqItem,
  type StudyContextInput,
} from '../study-context-engine';
import { useSexAwareAtlas } from '../hooks/useSexAwareAtlas';
import Persistent3DPane from './Persistent3DPane';
import { useStudy } from './StudyContext';
import StudyResourceList from './StudyResourceList';
import StudyVideoSection from './StudyVideoSection';

type WorkspaceTab =
  | 'overview'
  | 'relationships'
  | 'physiology'
  | 'histology_radiology'
  | 'clinical'
  | 'assessments'
  | 'readings_videos'
  | 'next_steps';

type DepthLevel = 'foundational' | 'intermediate' | 'advanced';

interface Props {
  atlas: Atlas | null;
  atlasError?: string;
  studyInput: StudyContextInput;
  returnLabel?: string | null;
  onReturnOrigin?: () => void;
  onChangeStudyInput: (next: StudyContextInput) => void;
  onInspectInFullExplorer: (conceptId: string) => void;
  onOpenRelationships: (conceptId: string) => void;
  onOpenPhysiology: (moduleId?: string | null, systemId?: CanonicalSystemId | null) => void;
  onOpenClinical: (caseId?: string | null, systemId?: CanonicalSystemId | null) => void;
  onOpenHistology: (entryId?: string | null, systemId?: CanonicalSystemId | null) => void;
  onOpenPresentation: (presentationId: string) => void;
  onOpenSystemLesson: (systemId: CanonicalSystemId, topicId?: string) => void;
}

const TABS: { id: WorkspaceTab; label: string }[] = [
  { id: 'overview', label: 'Overview & Depth' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'physiology', label: 'Physiology' },
  { id: 'histology_radiology', label: 'Histology & Radiology' },
  { id: 'clinical', label: 'Clinical & 3D Tours' },
  { id: 'assessments', label: 'Assessments' },
  { id: 'readings_videos', label: 'Readings & Videos' },
  { id: 'next_steps', label: 'Next Steps' },
];

export default function UniversalStudyWorkspace({
  atlas,
  atlasError,
  studyInput,
  returnLabel,
  onReturnOrigin,
  onChangeStudyInput,
  onInspectInFullExplorer,
  onOpenRelationships,
  onOpenPhysiology,
  onOpenClinical,
  onOpenHistology,
  onOpenPresentation,
  onOpenSystemLesson,
}: Props) {
  const {
    state,
    isBookmarked,
    toggleBookmark,
    setTopicCompleted,
    recordQuizResult,
    setPreferredSex,
  } = useStudy();

  const activeSex: AnatomySex = studyInput.sex ?? state.preferredSex;
  const { effectiveAtlas } = useSexAwareAtlas(atlas, activeSex);

  const context = useMemo(
    () =>
      resolveStudyContext(
        {
          ...studyInput,
          sex: activeSex,
        },
        effectiveAtlas,
      ),
    [studyInput, activeSex, effectiveAtlas],
  );

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [depthLevel, setDepthLevel] = useState<DepthLevel>('intermediate');
  const [mobilePane, setMobilePane] = useState<'content' | 'viewer'>('content');
  const [previewConceptOverride, setPreviewConceptOverride] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [revealedShortIds, setRevealedShortIds] = useState<Record<string, boolean>>({});

  // Reset per-context preview override when primary study context changes
  useEffect(() => {
    setPreviewConceptOverride(null);
    setSelectedAnswers({});
    setRevealedShortIds({});
  }, [
    context.canonicalConceptId,
    context.topicId,
    studyInput.questionId,
    studyInput.relationshipId,
    studyInput.physiologyId,
    studyInput.clinicalCaseId,
    studyInput.histologyId,
    studyInput.radiologyId,
    studyInput.presentationId,
    studyInput.videoId,
    studyInput.resourceId,
  ]);

  // If user enters specifically from video/resource/question/relationship, pick the most relevant initial tab once;
  // otherwise reset cleanly to overview when switching study targets
  useEffect(() => {
    setMobilePane('content');
    if (studyInput.videoId || studyInput.resourceId) setActiveTab('readings_videos');
    else if (studyInput.relationshipId) setActiveTab('relationships');
    else if (studyInput.physiologyId) setActiveTab('physiology');
    else if (studyInput.histologyId || studyInput.radiologyId) setActiveTab('histology_radiology');
    else if (studyInput.clinicalCaseId || studyInput.presentationId) setActiveTab('clinical');
    else if (studyInput.questionId) setActiveTab('assessments');
    else setActiveTab('overview');
  }, [
    studyInput.conceptId,
    studyInput.topicId,
    studyInput.partId,
    studyInput.systemId,
    studyInput.domainId,
    studyInput.videoId,
    studyInput.resourceId,
    studyInput.relationshipId,
    studyInput.physiologyId,
    studyInput.histologyId,
    studyInput.radiologyId,
    studyInput.clinicalCaseId,
    studyInput.presentationId,
    studyInput.questionId,
  ]);

  const previewTarget = useMemo(() => {
    const cid = previewConceptOverride ?? context.canonicalConceptId;
    if (!cid || !effectiveAtlas) {
      return {
        conceptId: cid,
        partIds: context.matchedPartIds,
        inModel: context.in3DModel,
        label: context.conceptName ?? context.title,
      };
    }
    const c = effectiveAtlas.concepts.find((item) => item.id === cid);
    if (c && c.elements.length > 0) {
      return {
        conceptId: cid,
        partIds: c.elements,
        inModel: true,
        label: c.name,
      };
    }
    if (previewConceptOverride && cid !== context.canonicalConceptId) {
      return {
        conceptId: cid,
        partIds: [],
        inModel: false,
        label: cid,
      };
    }
    return {
      conceptId: cid,
      partIds: context.matchedPartIds,
      inModel: context.in3DModel,
      label: context.conceptName ?? context.title,
    };
  }, [
    context.canonicalConceptId,
    context.conceptName,
    context.in3DModel,
    context.matchedPartIds,
    context.title,
    effectiveAtlas,
    previewConceptOverride,
  ]);

  const systemMeta = useMemo(
    () => (context.systemId ? CANONICAL_SYSTEMS.find((s) => s.id === context.systemId) : undefined),
    [context.systemId],
  );
  const systemMeshIds: SystemId[] | undefined = systemMeta?.meshSystems;

  const adaptiveRecs = useMemo(
    () => generateAdaptiveRecommendations(state, effectiveAtlas, { limit: 6 }),
    [effectiveAtlas, state],
  );

  const registryTotals = useMemo(() => {
    const metrics = computeRegistryMetrics(effectiveAtlas);
    const complete3D = REGISTRY_TOPICS.filter((t) => t.relatedConceptIds.length > 0).length;
    const plannedScaffold = REGISTRY_TOPICS.filter((t) => t.coverageStatus === 'planned').length;
    const textAnd2DOnly = Math.max(0, metrics.topicsCount - complete3D - plannedScaffold);
    return {
      domains: metrics.domainsCount,
      chapters: metrics.chaptersCount,
      topics: metrics.topicsCount,
      complete3D,
      textAnd2DOnly,
      plannedScaffold,
    };
  }, [effectiveAtlas]);

  const bookmarkTargetId = context.canonicalConceptId ?? context.topicId ?? 'study-context';
  const bookmarkKind = context.canonicalConceptId ? 'structure' : 'topic';
  const bookmarked = isBookmarked(bookmarkKind, bookmarkTargetId);
  const topicCompleted = Boolean(context.topicId && state.completedTopicIds.includes(context.topicId));

  const activeDepthText =
    depthLevel === 'foundational'
      ? context.depthExplanations.foundational ?? context.summaryText
      : depthLevel === 'advanced'
        ? context.depthExplanations.advanced ?? context.summaryText
        : context.depthExplanations.intermediate ?? context.summaryText;

  const handleSelect3DConcept = (cid: string, partId: string) => {
    if (cid === context.canonicalConceptId) return;
    onChangeStudyInput({
      ...studyInput,
      conceptId: cid,
      partId,
      questionId: undefined,
      relationshipId: undefined,
      physiologyId: undefined,
      clinicalCaseId: undefined,
      histologyId: undefined,
      radiologyId: undefined,
      presentationId: undefined,
      resourceId: undefined,
      videoId: undefined,
      sourceModule: 'study',
      sex: activeSex,
    });
  };

  const handleSexChange = (nextSex: AnatomySex) => {
    setPreferredSex(nextSex);
    onChangeStudyInput({
      ...studyInput,
      sex: nextSex,
    });
  };

  const handleMcqPick = (q: ResolvedMcqItem, optIdx: number) => {
    if (typeof selectedAnswers[q.id] === 'number') return;
    setSelectedAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
    const isCorrect = optIdx === q.correctIndex;
    if (q.source === 'quiz_bank') {
      recordQuizResult(q.id, isCorrect, q.relatedStructureName ?? context.title);
    }
  };

  const totalRelationships =
    context.relationships.outgoing.length +
    context.relationships.incoming.length +
    context.relationships.fallbackRelated.length;

  return (
    <div className="a360-page a360-study-page" data-testid="universal-study-workspace">
      {/* Context Header */}
      <header className="a360-study-header">
        <div className="a360-study-header-top">
          {onReturnOrigin && returnLabel && (
            <button
              type="button"
              className="a360-mini-btn"
              onClick={onReturnOrigin}
            >
              <ArrowLeft size={13} aria-hidden="true" />
              <span>Back to {returnLabel}</span>
            </button>
          )}
          <span className="a360-muted">
            Connected Study Context · Origin: {context.origin.sourceModule.replace(/_/g, ' ')}
            {context.origin.learningObjective ? ` · Goal: ${context.origin.learningObjective}` : ''}
          </span>
        </div>

        <div className="a360-study-title-row">
          <div className="a360-study-title-block">
            <h1>{context.title}</h1>
            <p className="a360-study-subtitle">{context.subtitle}</p>
            <p className="a360-study-coverage-line">
              Content: {context.coverage.studyContent} · 3D Geometry: {context.coverage.mesh3D} ·{' '}
              {context.coverage.externalReadingCount} curated reading{context.coverage.externalReadingCount === 1 ? '' : 's'} ·{' '}
              {context.coverage.verifiedVideoCount} verified video{context.coverage.verifiedVideoCount === 1 ? '' : 's'} ·{' '}
              {context.coverage.reviewStatusLabel}
            </p>
          </div>

          <div className="a360-study-header-actions">
            <button
              type="button"
              className={`a360-btn-secondary ${bookmarked ? 'is-active' : ''}`}
              onClick={() =>
                toggleBookmark({
                  kind: bookmarkKind,
                  targetId: bookmarkTargetId,
                  title: context.title,
                  canonicalSystem: context.systemId ?? undefined,
                })
              }
            >
              <Bookmark size={14} aria-hidden="true" />
              <span>{bookmarked ? 'Saved' : 'Save Bookmark'}</span>
            </button>

            {context.topicId && (
              <button
                type="button"
                className={`a360-complete-btn ${topicCompleted ? 'completed' : ''}`}
                onClick={() =>
                  setTopicCompleted(context.topicId!, !topicCompleted, context.title)
                }
              >
                <CheckCircle2 size={14} aria-hidden="true" />
                <span>{topicCompleted ? 'Topic Completed' : 'Mark Completed'}</span>
              </button>
            )}

            {context.canonicalConceptId && context.in3DModel && (
              <button
                type="button"
                className="a360-btn-primary"
                onClick={() => onInspectInFullExplorer(context.canonicalConceptId!)}
              >
                <Compass size={14} aria-hidden="true" />
                <span>Full 3D Explorer</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Pane Switcher (Single Persistent 3D Viewport stays mounted underneath) */}
      <div className="a360-study-mobile-switcher" role="tablist" aria-label="Workspace view">
        <button
          type="button"
          role="tab"
          aria-selected={mobilePane === 'content'}
          className={`a360-study-mobile-tab ${mobilePane === 'content' ? 'active' : ''}`}
          onClick={() => setMobilePane('content')}
        >
          Study Content
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobilePane === 'viewer'}
          className={`a360-study-mobile-tab ${mobilePane === 'viewer' ? 'active' : ''}`}
          onClick={() => setMobilePane('viewer')}
        >
          3D Anatomy Viewport ({activeSex === 'female' ? 'Female' : 'Male'})
        </button>
      </div>

      {/* Synchronized Split Layout */}
      <div className="a360-study-split">
        {/* Left Study Content Pane */}
        <div className={`a360-study-content-col ${mobilePane !== 'content' ? 'is-mobile-hidden' : ''}`}>
          <nav className="a360-study-tabs" role="tablist" aria-label="Connected study dimensions">
            {TABS.map((tab) => {
              let countLabel = '';
              if (tab.id === 'relationships' && totalRelationships > 0) {
                countLabel = ` (${totalRelationships})`;
              } else if (tab.id === 'physiology' && context.physiologyModules.length > 0) {
                countLabel = ` (${context.physiologyModules.length})`;
              } else if (
                tab.id === 'histology_radiology' &&
                context.histologyEntries.length + context.radiologyCases.length > 0
              ) {
                countLabel = ` (${context.histologyEntries.length + context.radiologyCases.length})`;
              } else if (
                tab.id === 'clinical' &&
                context.clinicalCases.length + context.presentations.length + context.appliedCases.length > 0
              ) {
                countLabel = ` (${context.clinicalCases.length + context.presentations.length + context.appliedCases.length})`;
              } else if (tab.id === 'assessments' && context.mcqs.length > 0) {
                countLabel = ` (${context.mcqs.length})`;
              } else if (
                tab.id === 'readings_videos' &&
                context.externalResources.length + context.videoResources.length > 0
              ) {
                countLabel = ` (${context.externalResources.length + context.videoResources.length})`;
              }

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={`a360-study-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                  {countLabel}
                </button>
              );
            })}
          </nav>

          <div className="a360-study-tabpanel" role="tabpanel">
            {/* TAB 1: Overview & Multi-Level Depth */}
            {activeTab === 'overview' && (
              <div className="a360-study-stack">
                <div className="a360-study-depth-row">
                  <span className="a360-muted">Academic Depth:</span>
                  <div className="a360-embedded-toolgroup" role="group" aria-label="Academic depth selector">
                    {(
                      [
                        ['foundational', 'Foundational (6–12)'],
                        ['intermediate', 'Intermediate (Pre-Med / MBBS)'],
                        ['advanced', 'Advanced / Clinical'],
                      ] as [DepthLevel, string][]
                    ).map(([lvl, label]) => (
                      <button
                        key={lvl}
                        type="button"
                        className={`a360-mini-btn ${depthLevel === lvl ? 'active' : ''}`}
                        onClick={() => setDepthLevel(lvl)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="a360-topic-explanation">{activeDepthText}</p>

                {context.allRelevantConceptIds.length > 0 && (
                  <div className="a360-study-subblock">
                    <h3>Linked 3D Structures in this Study Unit</h3>
                    <div className="a360-structure-chips">
                      {context.allRelevantConceptIds.slice(0, 8).map((cid) => {
                        const c = effectiveAtlas?.concepts.find((item) => item.id === cid);
                        const knownRec = !c ? getStructureRecordV2(cid) : null;
                        const label = c?.name ?? knownRec?.canonicalName ?? cid;
                        const isPrimary = cid === (previewTarget.conceptId ?? context.canonicalConceptId);
                        return (
                          <button
                            key={cid}
                            type="button"
                            className={`a360-structure-chip ${isPrimary ? 'active' : ''}`}
                            onClick={() =>
                              onChangeStudyInput({
                                ...studyInput,
                                conceptId: cid,
                                questionId: undefined,
                                relationshipId: undefined,
                                sourceModule: 'study',
                                sex: activeSex,
                              })
                            }
                          >
                            <span className="a360-structure-chip-title">{label}</span>
                            <span className="a360-structure-chip-action">
                              {!effectiveAtlas
                                ? 'Loading 3D index…'
                                : c && c.elements.length > 0
                                  ? 'Focus 3D & Study'
                                  : 'Study Context (No 3D mesh)'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {context.learningObjectives.length > 0 && (
                  <div className="a360-objectives-box">
                    <h3>Learning Objectives</h3>
                    <ul>
                      {context.learningObjectives.map((obj) => (
                        <li key={obj}>{obj}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {context.prerequisites.length > 0 && (
                  <div className="a360-study-subblock">
                    <h3>Prerequisites</h3>
                    <p className="a360-muted">{context.prerequisites.join(' · ')}</p>
                  </div>
                )}

                {(context.keyFacts.length > 0 || context.terminology.length > 0) && (
                  <div className="a360-topic-columns">
                    {context.keyFacts.length > 0 && (
                      <div className="a360-topic-subcard">
                        <h4>Key Anatomical & Functional Facts</h4>
                        <ul className="a360-detail-bullets">
                          {context.keyFacts.map((fact) => (
                            <li key={fact}>{fact}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {context.terminology.length > 0 && (
                      <div className="a360-topic-subcard">
                        <h4>Key Terminology</h4>
                        <dl className="a360-term-defs">
                          {context.terminology.slice(0, 6).map((t, idx) => (
                            <div key={`${t.term}-${idx}`} className="a360-term-def-row">
                              <dt>{t.term}</dt>
                              <dd>{t.meaning}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    )}
                  </div>
                )}

                {context.systemId && (
                  <div className="a360-study-footer-actions">
                    <button
                      type="button"
                      className="a360-btn-secondary"
                      onClick={() => onOpenSystemLesson(context.systemId!, context.topicId ?? undefined)}
                    >
                      <BookOpen size={14} aria-hidden="true" />
                      <span>Open System Lesson Chapter</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Relationships */}
            {activeTab === 'relationships' && (
              <div className="a360-study-stack">
                <div className="a360-study-section-head">
                  <div>
                    <h3>Verified Structural & Functional Relationships</h3>
                    <p className="a360-muted">
                      Focus any connected structure in the synchronized 3D viewport or shift your study context.
                    </p>
                  </div>
                  {context.canonicalConceptId && (
                    <button
                      type="button"
                      className="a360-btn-secondary"
                      onClick={() => onOpenRelationships(context.canonicalConceptId!)}
                    >
                      <GitBranch size={14} aria-hidden="true" />
                      <span>Open Full Relationship Explorer</span>
                    </button>
                  )}
                </div>

                {totalRelationships === 0 ? (
                  <div className="a360-disclosure-note" role="status">
                    <GitBranch size={15} aria-hidden="true" />
                    <span>
                      No curated direct relationship links are indexed for this topic yet. Select a modeled 3D organ or explore verified anatomical pathways.
                    </span>
                  </div>
                ) : (
                  <div className="a360-study-rel-list">
                    {[
                      ...context.relationships.outgoing.map((r) => ({
                        rel: r,
                        role: 'Outgoing',
                        focusConceptId: r.targetConceptId,
                        focusLabel: r.targetLabel,
                      })),
                      ...context.relationships.incoming.map((r) => ({
                        rel: r,
                        role: 'Incoming',
                        focusConceptId: r.sourceConceptId,
                        focusLabel: r.sourceConceptId,
                      })),
                    ].map(({ rel, role, focusConceptId, focusLabel }) => {
                      const targetName =
                        effectiveAtlas?.concepts.find((c) => c.id === focusConceptId)?.name ??
                        focusLabel;
                      return (
                        <article key={`${role}-${rel.id}`} className="a360-study-card">
                          <div className="a360-study-card-meta">
                            <span>{role} · {rel.directionLabel} · {rel.sourceReference}</span>
                          </div>
                          <h4>{targetName}</h4>
                          <p>{rel.note}</p>
                          <div className="a360-study-card-actions">
                            <button
                              type="button"
                              className="a360-mini-btn"
                              onClick={() => setPreviewConceptOverride(focusConceptId ?? null)}
                              disabled={!focusConceptId}
                            >
                              <Eye size={13} aria-hidden="true" />
                              <span>Preview in 3D</span>
                            </button>
                            <button
                              type="button"
                              className="a360-mini-btn active"
                              onClick={() =>
                                onChangeStudyInput({
                                  conceptId: focusConceptId,
                                  relationshipId: rel.id,
                                  sourceModule: 'study',
                                  sex: activeSex,
                                })
                              }
                            >
                              <span>Study Connected Structure</span>
                              <ArrowRight size={13} aria-hidden="true" />
                            </button>
                          </div>
                        </article>
                      );
                    })}

                    {context.relationships.fallbackRelated.length > 0 && (
                      <div className="a360-study-subblock">
                        <h4>Related System Structures</h4>
                        <div className="a360-structure-chips">
                          {context.relationships.fallbackRelated.map((fb) => (
                            <button
                              key={fb.conceptId}
                              type="button"
                              className="a360-structure-chip"
                              onClick={() =>
                                onChangeStudyInput({
                                  conceptId: fb.conceptId,
                                  sourceModule: 'study',
                                  sex: activeSex,
                                })
                              }
                            >
                              <span className="a360-structure-chip-title">{fb.name}</span>
                              <span className="a360-structure-chip-action">Switch Study Context</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Physiology */}
            {activeTab === 'physiology' && (
              <div className="a360-study-stack">
                {context.physiologyModules.length === 0 ? (
                  <div className="a360-disclosure-note" role="status">
                    <Activity size={15} aria-hidden="true" />
                    <span>
                      No quantitative physiology simulation is directly bound to this topic yet. Open the Physiology Lab to explore Cardiac, Respiratory, Renal, Musculoskeletal, and Acid-Base models.
                    </span>
                  </div>
                ) : (
                  context.physiologyModules.map((mod) => (
                    <article key={mod.id} className="a360-study-card">
                      <div className="a360-study-card-meta">
                        <span>
                          {mod.status === 'interactive'
                            ? 'Interactive Quantitative Simulation'
                            : 'Specification Ready (Planned)'} · {mod.formulaNote}
                        </span>
                      </div>
                      <h3>{mod.title}</h3>
                      <p>{mod.explanation}</p>
                      <p className="a360-muted">
                        Linked 3D concepts: {mod.linkedConcepts.map((lc) => lc.label).join(', ')}
                      </p>
                      <div className="a360-study-card-actions">
                        {mod.linkedConcepts[0] && (
                          <button
                            type="button"
                            className="a360-mini-btn"
                            onClick={() => setPreviewConceptOverride(mod.linkedConcepts[0].conceptId)}
                          >
                            <Eye size={13} aria-hidden="true" />
                            <span>Focus Primary Organ in 3D</span>
                          </button>
                        )}
                        <button
                          type="button"
                          className="a360-btn-primary"
                          onClick={() => onOpenPhysiology(mod.id, mod.systemId)}
                        >
                          <Activity size={14} aria-hidden="true" />
                          <span>Open Interactive Simulation</span>
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            )}

            {/* TAB 4: Histology & Radiology */}
            {activeTab === 'histology_radiology' && (
              <div className="a360-study-stack">
                {context.histologyEntries.length === 0 && context.radiologyCases.length === 0 ? (
                  <div className="a360-disclosure-note" role="status">
                    <Microscope size={15} aria-hidden="true" />
                    <span>
                      No bundled histology micrograph or normal radiology plate is mapped specifically to this topic yet. You can open the Histology Library to inspect all 10 bundled micrographs.
                    </span>
                  </div>
                ) : (
                  <>
                    {context.histologyEntries.map((h) => (
                      <article key={h.id} className="a360-study-card">
                        <div className="a360-study-card-meta">
                          <span>
                            Histology · {h.specimenSlot.stainProtocol} · {h.specimenSlot.expectedMagnification}
                          </span>
                        </div>
                        <h3>{h.title}</h3>
                        <p>{h.summary}</p>
                        {h.specimenSlot.imageUrl && (
                          <div className="a360-study-media-row">
                            <img
                              src={h.specimenSlot.imageUrl}
                              alt={h.specimenSlot.title}
                              className="a360-study-thumb"
                              loading="lazy"
                            />
                            <div className="a360-study-media-info">
                              <strong>Diagnostic Features</strong>
                              <ul className="a360-detail-bullets">
                                {h.diagnosticFeatures.slice(0, 3).map((df) => (
                                  <li key={df}>{df}</li>
                                ))}
                              </ul>
                              <span className="a360-muted">
                                {h.specimenSlot.author} · {h.specimenSlot.license}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="a360-study-card-actions">
                          <button
                            type="button"
                            className="a360-btn-secondary"
                            onClick={() => onOpenHistology(h.id, h.canonicalSystem)}
                          >
                            <Microscope size={14} aria-hidden="true" />
                            <span>Open Zoomable Specimen Viewer</span>
                          </button>
                        </div>
                      </article>
                    ))}

                    {context.radiologyCases.map((rad) => (
                      <article key={rad.id} className="a360-study-card">
                        <div className="a360-study-card-meta">
                          <span>
                            Radiology ({rad.modality}) · {rad.planeOrProjection} · {rad.license}
                          </span>
                        </div>
                        <h3>{rad.title}</h3>
                        <p>{rad.summary}</p>
                        <div className="a360-study-media-row">
                          <img
                            src={rad.imageUrl}
                            alt={rad.title}
                            className="a360-study-thumb"
                            loading="lazy"
                          />
                          <div className="a360-study-media-info">
                            <strong>Key Landmarks</strong>
                            <ul className="a360-detail-bullets">
                              {rad.anatomicalLandmarks.slice(0, 3).map((lm) => (
                                <li key={lm}>{lm}</li>
                              ))}
                            </ul>
                            <span className="a360-muted">{rad.orientationConvention}</span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* TAB 5: Clinical & 3D Tours */}
            {activeTab === 'clinical' && (
              <div className="a360-study-stack">
                {context.presentations.map((pres) => (
                  <article key={pres.id} className="a360-study-card">
                    <div className="a360-study-card-meta">
                      <span>Guided 3D Presentation · {pres.steps.length} steps · {pres.region}</span>
                    </div>
                    <h3>{pres.title}</h3>
                    <p>{pres.summary}</p>
                    <div className="a360-study-card-actions">
                      <button
                        type="button"
                        className="a360-btn-primary"
                        onClick={() => onOpenPresentation(pres.id)}
                      >
                        <Play size={14} aria-hidden="true" />
                        <span>Launch Guided 3D Presentation</span>
                      </button>
                    </div>
                  </article>
                ))}

                {context.clinicalCases.map((cs) => (
                  <article key={cs.id} className="a360-study-card">
                    <div className="a360-study-card-meta">
                      <span>Clinical Correlation · {cs.categoryLabel} · {cs.level}</span>
                    </div>
                    <h3>{cs.title}</h3>
                    <p>{cs.educationalScenario}</p>
                    <p className="a360-muted">{cs.anatomicalExplanation}</p>
                    <div className="a360-study-card-actions">
                      {cs.relevantConcepts[0] && (
                        <button
                          type="button"
                          className="a360-mini-btn"
                          onClick={() => setPreviewConceptOverride(cs.relevantConcepts[0].conceptId)}
                        >
                          <Eye size={13} aria-hidden="true" />
                          <span>Highlight {cs.relevantConcepts[0].label}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        className="a360-btn-secondary"
                        onClick={() => onOpenClinical(cs.id, cs.systemId)}
                      >
                        <Stethoscope size={14} aria-hidden="true" />
                        <span>Open Clinical Case & Check</span>
                      </button>
                    </div>
                  </article>
                ))}

                {context.appliedCases.map((ac) => (
                  <article key={ac.id} className="a360-study-card">
                    <div className="a360-study-card-meta">
                      <span>Applied Reasoning Vignette · {ac.level.replace(/_/g, ' ')}</span>
                    </div>
                    <h3>{ac.title}</h3>
                    <p>{ac.scenario}</p>
                    <p className="a360-muted">
                      <strong>Worked reasoning:</strong> {ac.workedSolution}
                    </p>
                  </article>
                ))}

                {context.presentations.length === 0 &&
                  context.clinicalCases.length === 0 &&
                  context.appliedCases.length === 0 && (
                    <div className="a360-disclosure-note" role="status">
                      <Stethoscope size={15} aria-hidden="true" />
                      <span>
                        No clinical vignette or guided 3D presentation is directly linked to this item yet.
                      </span>
                    </div>
                  )}
              </div>
            )}

            {/* TAB 6: Assessments */}
            {activeTab === 'assessments' && (
              <div className="a360-study-stack">
                {context.mcqs.length === 0 && context.shortAnswers.length === 0 ? (
                  <div className="a360-disclosure-note" role="status">
                    <HelpCircle size={15} aria-hidden="true" />
                    <span>No active recall questions are indexed for this specific entry yet.</span>
                  </div>
                ) : (
                  <>
                    {context.mcqs.map((q, idx) => {
                      const picked = selectedAnswers[q.id];
                      const answered = typeof picked === 'number';
                      const isCorrect = answered && picked === q.correctIndex;
                      return (
                        <article key={q.id} className="a360-study-card">
                          <div className="a360-study-card-meta">
                            <span>
                              Question {idx + 1} · {q.difficultyOrLevel} ·{' '}
                              {q.source === 'quiz_bank' ? 'Anatomy Quiz Bank' : 'Chapter Self-Check'}
                            </span>
                            {q.relatedConceptId && (
                              <button
                                type="button"
                                className="a360-mini-btn"
                                onClick={() => setPreviewConceptOverride(q.relatedConceptId!)}
                              >
                                <Eye size={12} aria-hidden="true" />
                                <span>Focus in 3D</span>
                              </button>
                            )}
                          </div>
                          <h4>{q.prompt}</h4>
                          <div className="a360-options-list">
                            {q.options.map((opt, optIdx) => {
                              let cls = '';
                              if (answered) {
                                if (optIdx === q.correctIndex) cls = 'correct';
                                else if (optIdx === picked) cls = 'incorrect';
                              }
                              return (
                                <button
                                  key={`${q.id}-opt-${optIdx}`}
                                  type="button"
                                  disabled={answered}
                                  className={`a360-option-btn ${cls}`}
                                  onClick={() => handleMcqPick(q, optIdx)}
                                >
                                  <span className="a360-option-letter">
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  <span className="a360-option-text">{opt}</span>
                                  {answered && optIdx === q.correctIndex && (
                                    <CheckCircle2 size={16} className="a360-icon-ok" />
                                  )}
                                  {answered && optIdx === picked && optIdx !== q.correctIndex && (
                                    <XCircle size={16} className="a360-icon-err" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          {answered && (
                            <div className={`a360-quiz-feedback ${isCorrect ? 'is-ok' : 'is-err'}`}>
                              <p className="a360-feedback-heading">
                                {isCorrect ? 'Correct' : 'Incorrect'} — Explanation
                              </p>
                              <p>{q.explanation}</p>
                            </div>
                          )}
                        </article>
                      );
                    })}

                    {context.shortAnswers.map((sa) => {
                      const revealed = Boolean(revealedShortIds[sa.id]);
                      return (
                        <article key={sa.id} className="a360-study-card">
                          <div className="a360-study-card-meta">
                            <span>Short Answer Rubric · {sa.level.replace(/_/g, ' ')}</span>
                          </div>
                          <h4>{sa.prompt}</h4>
                          <button
                            type="button"
                            className="a360-btn-secondary"
                            onClick={() =>
                              setRevealedShortIds((prev) => ({ ...prev, [sa.id]: !revealed }))
                            }
                          >
                            {revealed ? 'Hide Model Answer' : 'Reveal Key Criteria & Model Answer'}
                          </button>
                          {revealed && (
                            <div className="a360-study-rubric-box">
                              <p>{sa.modelAnswer}</p>
                              <ul className="a360-detail-bullets">
                                {sa.expectedPoints.map((kp) => (
                                  <li key={kp}>{kp}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </>
                )}
              </div>
            )}

            {/* TAB 7: Readings & Verified YouTube Videos */}
            {activeTab === 'readings_videos' && (
              <div className="a360-study-stack">
                <StudyVideoSection
                  topicTitle={context.title}
                  topicId={context.topicId ?? undefined}
                  conceptId={context.canonicalConceptId ?? undefined}
                  systemId={context.systemId ?? undefined}
                  domainId={context.domainId ?? undefined}
                  preferredVideoId={studyInput.videoId ?? undefined}
                  fallbackStoryboard={context.fallbackStoryboard}
                />

                <StudyResourceList
                  conceptId={context.canonicalConceptId ?? undefined}
                  canonicalSystem={context.systemId ?? undefined}
                  topicId={context.topicId ?? undefined}
                  domainId={context.domainId ?? undefined}
                  module="study_workspace"
                  limit={8}
                  heading="Curated External Textbooks & Primary Repositories"
                />

                {context.externalResources.length === 0 && (
                  <div className="a360-disclosure-note" role="status">
                    <ExternalLink size={15} aria-hidden="true" />
                    <span>
                      No curated direct external textbook URL is matched specifically to this narrow ID yet. All curated links across Anatomy 360 come strictly from OpenStax, NCBI Bookshelf, Radiopaedia, Histology Guide, OpenMedEd, and peer-reviewed biomedical repositories.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* TAB 8: Adaptive Next Steps & Honest Registry Coverage */}
            {activeTab === 'next_steps' && (
              <div className="a360-study-stack">
                <div className="a360-study-section-head">
                  <div>
                    <h3>Adaptive Next Study Recommendations</h3>
                    <p className="a360-muted">
                      Computed deterministically from your local missed quizzes, Practical Lab weak structures, SM-2 due flashcards, bookmarks, and incomplete chapters.
                    </p>
                  </div>
                </div>

                <div className="a360-study-rec-list">
                  {adaptiveRecs.map((rec) => (
                    <article key={rec.id} className="a360-study-card">
                      <div className="a360-study-card-meta">
                        <span>{rec.reasonLabel}</span>
                      </div>
                      <h4>{rec.targetTitle}</h4>
                      <p>{rec.explanation}</p>
                      <div className="a360-study-card-actions">
                        <button
                          type="button"
                          className="a360-btn-primary"
                          onClick={() => onChangeStudyInput(rec.studyInput)}
                        >
                          <Sparkles size={14} aria-hidden="true" />
                          <span>Open Recommended Study Context</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="a360-disclosure-note" role="note">
                  <span>
                    Platform Registry Coverage: {registryTotals.domains} domains · {registryTotals.chapters} chapters · {registryTotals.topics} curriculum topics · {registryTotals.complete3D} topics with direct 3D anatomical meshes · {registryTotals.textAnd2DOnly} text/2D biomedical topics · {registryTotals.plannedScaffold} planned specification slots.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Persistent Synchronized 3D Anatomy Viewport */}
        <aside
          className={`a360-study-viewer-col ${mobilePane !== 'viewer' ? 'is-mobile-hidden' : ''}`}
          aria-label="Synchronized 3D anatomy viewport"
        >
          <Persistent3DPane
            atlas={atlas}
            effectiveAtlas={effectiveAtlas}
            atlasError={atlasError}
            matchedPartIds={previewTarget.partIds}
            systemMeshIds={systemMeshIds}
            anatomySex={activeSex}
            onSexChange={handleSexChange}
            onSelectConcept={handleSelect3DConcept}
            in3DModel={previewTarget.inModel}
            missingMeshMessage={context.coverage.meshMessage}
            highlightedLabel={previewTarget.label}
          />
        </aside>
      </div>
    </div>
  );
}
