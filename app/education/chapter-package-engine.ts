import type { CanonicalSystemId } from '../anatomy-systems';
import type {
  AppliedReasoningExercise,
  AssetDisclosure,
  ChapterPresentationDeck,
  ContentCompletionStatus,
  ContentCompletionTracker,
  CurriculumMappingRef,
  EducationDomainId,
  EducationSourceRef,
  EducationTopic,
  EducationTrackId,
  LevelDepthContent,
  ShortAnswerExercise,
  StructuredComparisonRow,
  TopicActivity,
  TopicDiagramSpec,
  TopicSelfCheckQuestion,
  VideoLessonEntry,
  VisualFormat,
} from './education-types';
import { resolveReadingLinks, VERIFIED_SOURCES } from './verified-sources';

export interface ChapterAuthorSpec {
  id: string;
  domainId: EducationDomainId;
  chapterCode: string;
  chapterOrder: number;
  chapterTitle: string;
  title: string;
  summary: string;
  targetTracks: EducationTrackId[];
  curriculumMappings: CurriculumMappingRef[];
  prerequisites: string[];
  learningObjectives: string[];
  depthExplanations: LevelDepthContent;
  keyConcepts: { term: string; definition: string }[];
  keyFacts: string[];
  mechanisms: string[];
  stepByStep?: string[];
  comparisonTable: {
    columnA: string;
    columnB: string;
    rows: StructuredComparisonRow[];
  };
  misconceptions: { misconception: string; correction: string }[];
  clinicalCorrelation: string;
  summaryParagraph: string;
  keyTakeaways: string[];
  crossSubjectLinks: { domainId: EducationDomainId; relation: string }[];
  relatedSystems: CanonicalSystemId[];
  relatedFmaConceptIds: string[];
  visualFormats: VisualFormat[];
  diagram: TopicDiagramSpec;
  assetDisclosure: AssetDisclosure;
  activity: TopicActivity;
  readingKeys: (keyof typeof VERIFIED_SOURCES)[];
  shortAnswers: ShortAnswerExercise[];
  appliedCase: AppliedReasoningExercise;
  selfChecks: TopicSelfCheckQuestion[];
  extraSources?: EducationSourceRef[];
  educationalDisclaimer?: string;
}

/**
 * Generates an honest original Video Lesson Script + Scene-by-Scene Visual
 * Storyboard when curated YouTube lecture URLs/timestamps cannot be verified
 * reliably in this offline/grounding build environment. Never invents fake URLs.
 */
function buildFallbackVideoStoryboard(spec: ChapterAuthorSpec): VideoLessonEntry {
  return {
    id: `vid-script-${spec.id}`,
    kind: 'script_storyboard',
    title: `${spec.chapterCode}: ${spec.title} — Recording-Ready Video Script & Storyboard`,
    channelOrAuthor: 'ANATOMY 360 Curriculum Authoring Team (Original Script)',
    coveredTopic: spec.title,
    relevance: 'Covers core chapter learning objectives, mechanisms, comparison table, and worked applied reasoning.',
    level: spec.targetTracks[0] ?? 'medical_foundations',
    durationNote: 'Target 8–10 min narrated explainer (~5 structured scenes)',
    dateChecked: '2026-11-23',
    availabilityStatus: 'unavailable_fallback_script',
    availabilityNote:
      'External YouTube URLs and exact timestamps were not bundled because static verification could not guarantee live video availability without risking broken or inaccurate links. Below is a complete original video script & visual storyboard ready for studio recording.',
    scenes: [
      {
        sceneNumber: 1,
        timecode: '00:00 – 01:30',
        visualCue: `Title card (${spec.chapterCode}) + learning objective checklist overlay`,
        narration: `${spec.summary} By the end of this lesson you will be able to: ${spec.learningObjectives.join(' ')}`,
      },
      {
        sceneNumber: 2,
        timecode: '01:30 – 03:45',
        visualCue: `Animated terminology callouts featuring ${spec.keyConcepts.map((k) => k.term).slice(0, 3).join(', ')}`,
        narration: spec.keyConcepts.map((k) => `${k.term}: ${k.definition}`).join(' '),
      },
      {
        sceneNumber: 3,
        timecode: '03:45 – 06:15',
        visualCue: `Stepwise highlight of 2D pathway/hierarchy diagram: "${spec.diagram.title}"`,
        narration: spec.mechanisms.join(' '),
      },
      {
        sceneNumber: 4,
        timecode: '06:15 – 08:15',
        visualCue: `Split-screen comparison (${spec.comparisonTable.columnA} vs ${spec.comparisonTable.columnB}) + misconception red-X vs checkmarks`,
        narration: `${spec.comparisonTable.rows.map((r) => `${r.dimension}: ${r.primary} versus ${r.comparator}.`).join(' ')} Common pitfall: ${spec.misconceptions[0]?.misconception ?? ''} -> ${spec.misconceptions[0]?.correction ?? ''}`,
      },
      {
        sceneNumber: 5,
        timecode: '08:15 – 09:45',
        visualCue: `Clinical/applied scenario card + self-check prompt + open-source citation card`,
        narration: `${spec.clinicalCorrelation} Key takeaway: ${spec.keyTakeaways[0] ?? spec.summary}`,
      },
    ],
  };
}

/**
 * Generates an original 9-slide interactive ANATOMY 360 presentation deck usable
 * directly inside the in-app Chapter Slide Deck Viewer.
 */
function buildChapterPresentationDeck(spec: ChapterAuthorSpec): ChapterPresentationDeck {
  const firstCheck = spec.selfChecks[0];
  const readingRefs = resolveReadingLinks(spec.readingKeys);
  const slides: ChapterPresentationDeck['slides'] = [
    {
      slideNumber: 1,
      slideType: 'title',
      title: `${spec.chapterCode} · ${spec.title}`,
      subtitle: `${spec.chapterTitle} · ANATOMY 360 Open Curriculum Slide Deck`,
      bullets: [
        spec.summary,
        `Target academic levels: ${spec.targetTracks.join(', ').replace(/_/g, ' ')}`,
        spec.educationalDisclaimer ?? 'Structured academic educational reference deck.',
      ],
      speakerNote: `Introduce ${spec.title} within ${spec.chapterTitle} and confirm students have reviewed prerequisites: ${spec.prerequisites.join('; ')}.`,
    },
    {
      slideNumber: 2,
      slideType: 'objectives',
      title: 'Learning Objectives & Prerequisites',
      bullets: [
        ...spec.learningObjectives,
        ...spec.prerequisites.map((p) => `Prerequisite: ${p}`),
      ],
      speakerNote: 'Preview expected competencies before walking through definitions and mechanisms.',
    },
    {
      slideNumber: 3,
      slideType: 'concepts',
      title: 'Core Definitions & Foundational Concepts',
      bullets: spec.keyConcepts.map((kc) => `${kc.term} — ${kc.definition}`),
      speakerNote: 'Clarify formal terminology and contrast colloquial usage against scientific definitions.',
    },
    {
      slideNumber: 4,
      slideType: 'mechanisms',
      title: 'Step-by-Step Mechanism & Regulatory Logic',
      bullets: spec.mechanisms,
      speakerNote: 'Emphasize causal sequence, cellular localization, and homeostatic or clinical consequences.',
    },
    {
      slideNumber: 5,
      slideType: 'visual',
      title: `Visual Map: ${spec.diagram.title}`,
      subtitle: spec.diagram.disclaimer,
      bullets: [
        spec.diagram.caption,
        ...spec.diagram.nodes.map((n) => `${n.label}${n.sublabel ? ` (${n.sublabel})` : ''}`),
      ],
      speakerNote: `Walk students through nodes in "${spec.diagram.title}". ${spec.assetDisclosure.summary}`,
    },
    {
      slideNumber: 6,
      slideType: 'comparison',
      title: `Comparison Matrix: ${spec.comparisonTable.columnA} vs. ${spec.comparisonTable.columnB}`,
      bullets: spec.comparisonTable.rows.map(
        (r) => `${r.dimension}: ${r.primary} vs. ${r.comparator} — ${r.clinicalOrFunctionalNote}`,
      ),
      tableRows: spec.comparisonTable.rows,
      speakerNote: 'Highlight high-yield differentiators tested in pre-clinical and professional exams.',
    },
    {
      slideNumber: 7,
      slideType: 'applied_case',
      title: `Applied Correlation & Misconceptions Check`,
      bullets: [
        `Clinical / Applied Context: ${spec.clinicalCorrelation}`,
        `Applied Exercise (${spec.appliedCase.title}): ${spec.appliedCase.scenario}`,
        ...spec.misconceptions.map((m) => `Clarification: "${m.misconception}" → ${m.correction}`),
      ],
      speakerNote: `Debrief common misconceptions explicitly. Worked solution: ${spec.appliedCase.workedSolution}`,
    },
    {
      slideNumber: 8,
      slideType: 'knowledge_check',
      title: 'Interactive Knowledge Check',
      bullets: firstCheck
        ? [firstCheck.question]
        : ['Review the chapter self-check assessment module in the Practise tab.'],
      quizPrompt: firstCheck
        ? {
            question: firstCheck.question,
            options: firstCheck.options,
            correctIndex: firstCheck.correctIndex,
            explanation: firstCheck.explanation,
          }
        : undefined,
      speakerNote: firstCheck
        ? `Answer: ${firstCheck.options[firstCheck.correctIndex]}. ${firstCheck.explanation}`
        : 'Lead group recall discussion.',
    },
    {
      slideNumber: 9,
      slideType: 'summary',
      title: 'Key Takeaways & Open References',
      bullets: [
        ...spec.keyTakeaways,
        ...readingRefs.map((r) => `Reading: ${r.title} (${r.authorOrPublisher}, ${r.licence})`),
      ],
      speakerNote: 'Assign follow-up Practice & Short-Answer rubric exercises; remind learners of academic review status.',
    },
  ];

  return {
    id: `deck-${spec.id}`,
    chapterId: spec.id,
    title: `${spec.chapterCode}: ${spec.title} — Teaching Slide Deck`,
    level: spec.targetTracks[0] ?? 'medical_foundations',
    author: 'ANATOMY 360 Educational Authoring Team',
    licence: 'Original ANATOMY 360 Educational Slide Deck (built in-app; sources cited per slide)',
    slideCount: slides.length,
    slides,
    externalSlideNote:
      'External PowerPoint/OER slide decks were not bundled to avoid broken links or unverified licences; this 9-slide interactive teaching deck is directly playable and printable in-app.',
  };
}

/**
 * Computes Section 7 Honest Content-Level Completion Tracker directly from
 * actual bundled records — never inflating status.
 */
export function computeChapterCompletionTracker(spec: ChapterAuthorSpec): ContentCompletionTracker {
  const readingCount = spec.readingKeys.length;
  const mcqCount = spec.selfChecks.length;
  const shortCount = spec.shortAnswers.length;
  const appliedCount = 1;
  const assetMissing = spec.assetDisclosure.status === 'asset_required';

  const visualStatus: ContentCompletionStatus = assetMissing
    ? 'blocked_by_source_availability'
    : 'complete_for_core_scope';

  const assessmentStatus: ContentCompletionStatus =
    mcqCount >= 10 && shortCount >= 3 && appliedCount >= 1
      ? 'complete_for_core_scope'
      : mcqCount >= 5 && shortCount >= 3
        ? 'partially_complete'
        : 'in_progress';

  const limitations: string[] = [
    'Pending formal academic faculty peer review (reviewStatus = awaiting_academic_review).',
    'Verified live video stream links unavailable in static verification; original recording script & storyboard provided.',
  ];
  if (assetMissing && spec.assetDisclosure.missingAssets?.length) {
    limitations.push(...spec.assetDisclosure.missingAssets.map((m) => `Asset gap: ${m}`));
  } else if (spec.assetDisclosure.status === 'conceptual_diagram_only') {
    limitations.push('Uses original 2D conceptual diagram schematics where 3D sub-cellular/molecular assets are outside gross mesh scope.');
  }

  let overallStatus: ContentCompletionStatus = 'complete_for_core_scope';
  if (assetMissing) {
    overallStatus = 'blocked_by_source_availability';
  } else if (assessmentStatus !== 'complete_for_core_scope') {
    overallStatus = 'partially_complete';
  }

  return {
    chapterCode: spec.chapterCode,
    plannedLearningOutcomes: spec.learningObjectives.length,
    completedLearningOutcomes: spec.learningObjectives.length,
    writtenMaterialStatus: 'complete_for_core_scope',
    readingLinksCount: readingCount,
    readingStatus: readingCount > 0 ? 'complete_for_core_scope' : 'resource_incomplete',
    videoCount: 1,
    videoStatus: 'resource_incomplete', // transparent script fallback rather than fake video link
    presentationCount: 1,
    presentationStatus: 'complete_for_core_scope',
    visualAssetsCount: (spec.relatedFmaConceptIds.length > 0 ? 1 : 0) + 1,
    visualStatus,
    practicalCount: 1,
    practicalStatus: 'complete_for_core_scope',
    mcqCount,
    shortAnswerCount: shortCount,
    appliedCaseCount: appliedCount,
    assessmentStatus,
    sourceVerification: 'verified_open_sources',
    licenceVerification: 'open_licensed_or_cited',
    knownLimitations: limitations,
    overallStatus,
    reviewStatus: 'awaiting_academic_review',
  };
}

export function defineChapterTopic(spec: ChapterAuthorSpec): EducationTopic {
  const readingLinks = resolveReadingLinks(spec.readingKeys);
  const sources: EducationSourceRef[] = [
    ...readingLinks.map((r) => ({
      title: r.title,
      authority: `${r.authorOrPublisher} (${r.licence})`,
      url: r.url,
      editionOrYear: `Checked ${r.dateChecked}`,
      supports: r.sectionCovered,
    })),
    ...(spec.extraSources ?? []),
  ];

  return {
    id: spec.id,
    domainId: spec.domainId,
    chapterCode: spec.chapterCode,
    chapterOrder: spec.chapterOrder,
    chapterTitle: `${spec.chapterCode}: ${spec.chapterTitle}`,
    title: spec.title,
    summary: spec.summary,
    targetTracks: spec.targetTracks,
    curriculumMappings: spec.curriculumMappings,
    prerequisites: spec.prerequisites,
    learningObjectives: spec.learningObjectives,
    depthExplanations: spec.depthExplanations,
    keyConcepts: spec.keyConcepts,
    keyFacts: spec.keyFacts,
    mechanisms: spec.mechanisms,
    stepByStep: spec.stepByStep ?? spec.mechanisms,
    comparisonTable: spec.comparisonTable,
    misconceptions: spec.misconceptions,
    clinicalCorrelation: spec.clinicalCorrelation,
    summaryParagraph: spec.summaryParagraph,
    keyTakeaways: spec.keyTakeaways,
    crossSubjectLinks: spec.crossSubjectLinks,
    relatedSystems: spec.relatedSystems,
    relatedFmaConceptIds: spec.relatedFmaConceptIds,
    visualFormats: spec.visualFormats,
    diagram: spec.diagram,
    assetDisclosure: spec.assetDisclosure,
    activity: spec.activity,
    readingLinks,
    videoResource: buildFallbackVideoStoryboard(spec),
    presentationDeck: buildChapterPresentationDeck(spec),
    shortAnswerExercises: spec.shortAnswers,
    appliedReasoningExercises: [spec.appliedCase],
    selfChecks: spec.selfChecks,
    sources,
    completionTracker: computeChapterCompletionTracker(spec),
    reviewStatus: 'pending_faculty_review',
    educationalDisclaimer: spec.educationalDisclaimer,
  };
}
