import type { Atlas, Concept, Part } from './anatomy';
import { CURATED_KNOWLEDGE, lookupStructureKnowledge } from './anatomy-knowledge';
import { CANONICAL_SYSTEMS, canonicalSystemForMeshSystem, type CanonicalSystemId } from './anatomy-systems';
import type { AnatomySex } from './atlas-layers';
import { CLINICAL_CASES, type ClinicalCaseStudy } from './data/clinical-data';
import { HISTOLOGY_ENTRIES, type HistologyEntry } from './data/histology-data';
import { PHYSIOLOGY_MODULES, type PhysiologyModuleSpec } from './data/physiology-data';
import { RADIOLOGY_CASES, type RadiologyStudyCase } from './data/radiology-data';
import { getStudyResourcesFor, STUDY_RESOURCES, type CuratedStudyResource } from './data/study-resources';
import {
  getYouTubeVideosFor,
  VERIFIED_YOUTUBE_VIDEOS,
  type YouTubeVideoResource,
} from './data/video-resources';
import { EDUCATION_TOPICS } from './education/education-content';
import { EDUCATION_DOMAINS } from './education/education-domains';
import type {
  AppliedReasoningExercise,
  EducationDomainId,
  EducationTopic,
  EducationTrackId,
  ShortAnswerExercise,
  TopicSelfCheckQuestion,
  VideoLessonEntry,
} from './education/education-types';
import {
  getRelationshipsForConcept,
  getStructureRecordV2,
  KNOWLEDGE_GRAPH_V2,
  VERIFIED_RELATIONSHIPS,
  type ModelCoverageTier,
  type StructureKnowledgeV2,
  type StructureRelationship,
} from './knowledge-graph';
import { ANATOMY_LESSONS, type AnatomyLesson, type LessonTopic } from './learning-data';
import { TOPIC_DEPTH_SUPPLEMENTS } from './learning-supplements';
import { BUILTIN_PRESENTATIONS } from './presentation/builtin-presentations';
import type { AnatomyPresentation } from './presentation/presentation-types';
import { QUIZ_QUESTIONS, type QuizQuestion } from './quiz-data';
import { REGISTRY_TOPICS } from './registry/knowledge-registry';

export type StudyContextSourceModule =
  | 'home'
  | 'explorer'
  | 'learn'
  | 'curriculum'
  | 'systems'
  | 'relationships'
  | 'quiz'
  | 'practical_lab'
  | 'physiology'
  | 'histology'
  | 'radiology'
  | 'clinical'
  | 'present'
  | 'search'
  | 'dashboard'
  | 'revision'
  | 'bookmarks'
  | 'study';

export interface StudyContextInput {
  conceptId?: string | null;
  partId?: string | null;
  topicId?: string | null;
  chapterId?: string | null;
  domainId?: EducationDomainId | null;
  systemId?: CanonicalSystemId | null;
  questionId?: string | null;
  relationshipId?: string | null;
  physiologyId?: string | null;
  clinicalCaseId?: string | null;
  histologyId?: string | null;
  radiologyId?: string | null;
  presentationId?: string | null;
  resourceId?: string | null;
  videoId?: string | null;
  learningObjective?: string | null;
  sourceModule?: StudyContextSourceModule | null;
  sourceItemId?: string | null;
  sex?: AnatomySex | null;
}

export interface ResolvedMcqItem {
  id: string;
  source: 'quiz_bank' | 'chapter_self_check';
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficultyOrLevel: string;
  topicId?: string;
  relatedConceptId?: string;
  relatedStructureName?: string;
  systemId?: CanonicalSystemId;
}

export interface StudyCoverageDisclosure {
  studyContent: 'available' | 'partial' | 'planned' | 'unavailable';
  mesh3D: 'available' | 'partial' | 'unavailable';
  meshMessage: string;
  externalReadingCount: number;
  verifiedVideoCount: number;
  reviewStatusLabel: string;
}

export interface ResolvedStudyContext {
  title: string;
  subtitle: string;
  sex: AnatomySex;
  canonicalConceptId: string | null;
  conceptName: string | null;
  conceptRecord: StructureKnowledgeV2 | null;
  allRelevantConceptIds: string[];
  matchedPartIds: string[];
  in3DModel: boolean;
  modelCoverageTier: ModelCoverageTier;
  systemId: CanonicalSystemId | null;
  domainId: EducationDomainId | null;
  topicId: string | null;
  chapterCode: string | null;
  educationTopic: EducationTopic | null;
  lessonTopic: { lesson: AnatomyLesson; topic: LessonTopic } | null;
  learningObjectives: string[];
  prerequisites: string[];
  summaryText: string;
  depthExplanations: {
    foundational: string | null;
    intermediate: string | null;
    advanced: string | null;
  };
  keyFacts: string[];
  terminology: { term: string; meaning: string }[];
  relationships: {
    outgoing: StructureRelationship[];
    incoming: StructureRelationship[];
    fallbackRelated: { conceptId: string; name: string }[];
  };
  mcqs: ResolvedMcqItem[];
  shortAnswers: ShortAnswerExercise[];
  appliedCases: AppliedReasoningExercise[];
  physiologyModules: PhysiologyModuleSpec[];
  clinicalCases: ClinicalCaseStudy[];
  histologyEntries: HistologyEntry[];
  radiologyCases: RadiologyStudyCase[];
  presentations: AnatomyPresentation[];
  externalResources: CuratedStudyResource[];
  videoResources: YouTubeVideoResource[];
  fallbackStoryboard: VideoLessonEntry | null;
  coverage: StudyCoverageDisclosure;
  origin: {
    sourceModule: StudyContextSourceModule;
    sourceItemId: string | null;
    questionId: string | null;
    relationshipId: string | null;
    learningObjective: string | null;
  };
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    out.push(it);
  }
  return out;
}

function uniqueStrings(list: (string | undefined | null)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    if (!item || !item.trim()) continue;
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

function resolveMeshConceptInfo(
  conceptId: string | null,
  partId: string | null,
  atlas?: Atlas | null,
): {
  resolvedConceptId: string | null;
  conceptName: string | null;
  matchedPartIds: string[];
  in3DModel: boolean;
  atlasConcept: Concept | undefined;
  atlasPart: Part | undefined;
} {
  if (!atlas) {
    return {
      resolvedConceptId: conceptId,
      conceptName: null,
      matchedPartIds: [],
      in3DModel: false,
      atlasConcept: undefined,
      atlasPart: undefined,
    };
  }

  let atlasPart: Part | undefined;
  let resolvedId = conceptId;

  if (partId) {
    atlasPart = atlas.parts.find((p) => p.id === partId);
    if (!resolvedId && atlasPart) {
      resolvedId = atlasPart.conceptId;
    }
  }

  const atlasConcept = resolvedId
    ? atlas.concepts.find((c) => c.id === resolvedId)
    : undefined;

  const matchedPartIds = atlasConcept
    ? atlasConcept.elements
    : atlasPart
      ? [atlasPart.id]
      : [];

  return {
    resolvedConceptId: resolvedId,
    conceptName: atlasConcept?.name ?? atlasPart?.name ?? null,
    matchedPartIds,
    in3DModel: matchedPartIds.length > 0,
    atlasConcept,
    atlasPart,
  };
}

export function resolveStudyContext(
  input: StudyContextInput,
  atlas?: Atlas | null,
  options?: { academicLevel?: EducationTrackId },
): ResolvedStudyContext {
  const sex: AnatomySex = input.sex === 'female' ? 'female' : atlas?.sex === 'female' ? 'female' : 'male';

  let conceptId = input.conceptId?.trim() || null;
  const partId = input.partId?.trim() || null;
  let topicId = input.topicId?.trim() || input.chapterId?.trim() || null;
  let domainId: EducationDomainId | null = input.domainId ?? null;
  let systemId: CanonicalSystemId | null = input.systemId ?? null;

  // 1. Seed from specific entity identifiers if provided
  const requestedQuestion: QuizQuestion | undefined = input.questionId
    ? QUIZ_QUESTIONS.find((q) => q.id === input.questionId)
    : undefined;
  if (requestedQuestion) {
    if (!conceptId) conceptId = requestedQuestion.relatedConceptId;
    if (!topicId && requestedQuestion.topicId) topicId = requestedQuestion.topicId;
    if (!systemId) systemId = requestedQuestion.systemId;
  }

  // Also check if questionId is a selfCheck id inside EDUCATION_TOPICS
  let requestedSelfCheckTopic: EducationTopic | undefined;
  if (input.questionId && !requestedQuestion) {
    requestedSelfCheckTopic = EDUCATION_TOPICS.find((t) =>
      t.selfChecks.some((sc) => sc.id === input.questionId),
    );
    if (requestedSelfCheckTopic && !topicId) {
      topicId = requestedSelfCheckTopic.id;
    }
  }

  const requestedRelationship: StructureRelationship | undefined = input.relationshipId
    ? VERIFIED_RELATIONSHIPS.find((r) => r.id === input.relationshipId)
    : undefined;
  if (requestedRelationship && !conceptId) {
    conceptId = requestedRelationship.sourceConceptId;
  }

  const requestedClinical: ClinicalCaseStudy | undefined = input.clinicalCaseId
    ? CLINICAL_CASES.find((c) => c.id === input.clinicalCaseId)
    : undefined;
  if (requestedClinical) {
    if (!conceptId) conceptId = requestedClinical.relevantConcepts[0]?.conceptId ?? null;
    if (!topicId) topicId = requestedClinical.associatedTopicIds[0] ?? null;
    if (!systemId) systemId = requestedClinical.systemId;
  }

  const requestedPhysiology: PhysiologyModuleSpec | undefined = input.physiologyId
    ? PHYSIOLOGY_MODULES.find((p) => p.id === input.physiologyId)
    : undefined;
  if (requestedPhysiology) {
    if (!conceptId) conceptId = requestedPhysiology.linkedConcepts[0]?.conceptId ?? null;
    if (!systemId) systemId = requestedPhysiology.systemId;
  }

  const requestedHistology: HistologyEntry | undefined = input.histologyId
    ? HISTOLOGY_ENTRIES.find((h) => h.id === input.histologyId)
    : undefined;
  if (requestedHistology) {
    if (!conceptId) conceptId = requestedHistology.linkedConceptIds[0] ?? null;
    if (!topicId) topicId = requestedHistology.linkedTopicIds[0] ?? null;
    if (!systemId && requestedHistology.canonicalSystem) systemId = requestedHistology.canonicalSystem;
  }

  const requestedRadiology: RadiologyStudyCase | undefined = input.radiologyId
    ? RADIOLOGY_CASES.find((r) => r.id === input.radiologyId)
    : undefined;
  if (requestedRadiology) {
    if (!conceptId) conceptId = requestedRadiology.linkedConceptIds[0] ?? null;
    if (!systemId) systemId = requestedRadiology.canonicalSystem;
  }

  const requestedPresentation: AnatomyPresentation | undefined = input.presentationId
    ? BUILTIN_PRESENTATIONS.find((p) => p.id === input.presentationId)
    : undefined;
  if (requestedPresentation) {
    const firstConcept = requestedPresentation.steps.flatMap((s) => s.scene.selectedConceptIds)[0] ?? null;
    if (!conceptId && firstConcept) conceptId = firstConcept;
    const firstSys = requestedPresentation.targetSystems?.[0];
    if (!systemId && firstSys) systemId = canonicalSystemForMeshSystem(firstSys).id;
  }

  const requestedResource: CuratedStudyResource | undefined = input.resourceId
    ? STUDY_RESOURCES.find((r) => r.id === input.resourceId)
    : undefined;
  if (requestedResource) {
    if (!conceptId) conceptId = requestedResource.conceptIds[0] ?? null;
    if (!topicId) topicId = requestedResource.topicIds?.[0] ?? null;
    if (!domainId) domainId = requestedResource.domainIds?.[0] ?? null;
    if (!systemId) systemId = requestedResource.canonicalSystems[0] ?? null;
  }

  const requestedVideo: YouTubeVideoResource | undefined = input.videoId
    ? VERIFIED_YOUTUBE_VIDEOS.find((v) => v.id === input.videoId || v.youtubeId === input.videoId)
    : undefined;
  if (requestedVideo) {
    if (!conceptId) conceptId = requestedVideo.conceptIds[0] ?? null;
    if (!topicId) topicId = requestedVideo.topicIds[0] ?? null;
    if (!domainId) domainId = requestedVideo.domainIds[0] ?? null;
    if (!systemId) systemId = requestedVideo.canonicalSystems[0] ?? null;
  }

  // 2. Resolve EducationTopic or LessonTopic from topicId / chapterId / conceptId / systemId
  let educationTopic: EducationTopic | null = topicId
    ? EDUCATION_TOPICS.find((t) => t.id === topicId || t.chapterCode?.toLowerCase() === topicId?.toLowerCase()) ??
      null
    : null;

  let lessonPair: { lesson: AnatomyLesson; topic: LessonTopic } | null = null;
  if (topicId) {
    for (const lesson of ANATOMY_LESSONS) {
      const found = lesson.topics.find((t) => t.id === topicId);
      if (found) {
        lessonPair = { lesson, topic: found };
        break;
      }
    }
  }

  // If partId was provided without conceptId, resolve conceptId from atlas first
  if (!conceptId && partId && atlas) {
    const p = atlas.parts.find((pt) => pt.id === partId);
    if (p) conceptId = p.conceptId;
  }

  // Cross-match topic from conceptId if topicId wasn't directly supplied or matched
  if (!lessonPair && conceptId) {
    for (const lesson of ANATOMY_LESSONS) {
      const found = lesson.topics.find((t) => t.conceptIds.includes(conceptId!));
      if (found) {
        lessonPair = { lesson, topic: found };
        break;
      }
    }
  }

  if (!educationTopic && conceptId) {
    const sysHint = lessonPair?.lesson.systemId ?? systemId;
    const isGeneralIntroTopic = (id: string) =>
      id === 'edu-anat-organization-planes' || id === 'edu-anat-a14-integration';
    educationTopic =
      (sysHint
        ? EDUCATION_TOPICS.find(
            (t) =>
              !isGeneralIntroTopic(t.id) &&
              t.relatedSystems.includes(sysHint) &&
              t.relatedFmaConceptIds.includes(conceptId!),
          )
        : undefined) ??
      EDUCATION_TOPICS.find(
        (t) => !isGeneralIntroTopic(t.id) && t.relatedFmaConceptIds.includes(conceptId!),
      ) ??
      EDUCATION_TOPICS.find((t) => t.relatedFmaConceptIds.includes(conceptId!)) ??
      null;
  }

  // Infer system / domain from matched entities
  if (!domainId && educationTopic) domainId = educationTopic.domainId;
  if (!systemId && lessonPair) systemId = lessonPair.lesson.systemId;
  if (!systemId && educationTopic?.relatedSystems[0]) systemId = educationTopic.relatedSystems[0];

  // If conceptId exists, check Knowledge Graph V2 and Atlas metadata
  const rawMeshInfo = resolveMeshConceptInfo(conceptId, partId, atlas);
  if (!conceptId && rawMeshInfo.resolvedConceptId) {
    conceptId = rawMeshInfo.resolvedConceptId;
  }

  const conceptKnownInCuratedOrGraph = Boolean(
    conceptId &&
      (KNOWLEDGE_GRAPH_V2.some((r) => r.conceptId === conceptId) ||
        CURATED_KNOWLEDGE.some((k) => k.conceptId === conceptId) ||
        rawMeshInfo.atlasConcept ||
        rawMeshInfo.atlasPart),
  );

  const conceptRecord: StructureKnowledgeV2 | null =
    conceptId && conceptKnownInCuratedOrGraph
      ? getStructureRecordV2(conceptId, atlas, rawMeshInfo.conceptName ?? undefined)
      : null;

  if (!systemId && conceptRecord) {
    systemId = conceptRecord.canonicalSystem;
  } else if (!systemId && rawMeshInfo.atlasPart) {
    systemId = canonicalSystemForMeshSystem(rawMeshInfo.atlasPart.system).id;
  }

  if (!domainId && systemId) {
    domainId = 'human_anatomy';
  }

  // Fallback topic association ONLY when browsing purely by systemId without a specific topic or concept
  if (!lessonPair && !topicId && !educationTopic && !conceptId && systemId) {
    const sysLesson = ANATOMY_LESSONS.find((l) => l.systemId === systemId);
    if (sysLesson && sysLesson.topics[0]) {
      lessonPair = { lesson: sysLesson, topic: sysLesson.topics[0] };
    }
  }
  if (!educationTopic && systemId && !topicId) {
    educationTopic =
      EDUCATION_TOPICS.find((t) => t.relatedSystems.includes(systemId!)) ?? null;
  }
  if (!educationTopic && domainId && !topicId) {
    educationTopic = EDUCATION_TOPICS.find((t) => t.domainId === domainId) ?? null;
  }

  // Gather all relevant FMA concept IDs (explicit concept first, then topic/case/sim concepts)
  const relevantConceptIds = uniqueStrings([
    conceptId,
    ...(requestedRelationship ? [requestedRelationship.sourceConceptId, requestedRelationship.targetConceptId] : []),
    ...(requestedClinical ? requestedClinical.relevantConcepts.map((c) => c.conceptId) : []),
    ...(requestedPhysiology ? requestedPhysiology.linkedConcepts.map((c) => c.conceptId) : []),
    ...(requestedHistology ? requestedHistology.linkedConceptIds : []),
    ...(requestedRadiology ? requestedRadiology.linkedConceptIds : []),
    ...(requestedPresentation ? requestedPresentation.steps.flatMap((s) => s.scene.selectedConceptIds) : []),
    ...(lessonPair ? lessonPair.topic.conceptIds : []),
    ...(educationTopic ? educationTopic.relatedFmaConceptIds : []),
  ]);

  // If no explicit primary conceptId was supplied, choose the primary modeled concept from relevant list
  if (!conceptId && relevantConceptIds.length > 0) {
    const firstModeled = atlas
      ? relevantConceptIds.find((cid) => atlas.concepts.some((c) => c.id === cid && c.elements.length > 0))
      : relevantConceptIds[0];
    conceptId = firstModeled ?? relevantConceptIds[0];
  }

  // Collect matched 3D partIds across primary concept (or whole topic group if primary is unmodeled)
  const meshInfo = resolveMeshConceptInfo(conceptId, partId, atlas);
  let matchedPartIds = [...meshInfo.matchedPartIds];
  if (matchedPartIds.length === 0 && atlas && relevantConceptIds.length > 0) {
    const fallbackParts = new Set<string>();
    for (const cid of relevantConceptIds) {
      const c = atlas.concepts.find((ac) => ac.id === cid);
      if (c) c.elements.forEach((el) => fallbackParts.add(el));
    }
    matchedPartIds = Array.from(fallbackParts);
  }

  const effectiveConceptRecord =
    conceptRecord ??
    (conceptId &&
    (KNOWLEDGE_GRAPH_V2.some((r) => r.conceptId === conceptId) ||
      CURATED_KNOWLEDGE.some((k) => k.conceptId === conceptId) ||
      Boolean(atlas?.concepts.some((c) => c.id === conceptId)))
      ? getStructureRecordV2(conceptId, atlas, meshInfo.conceptName ?? undefined)
      : null);

  const curatedLegacy = conceptId
    ? lookupStructureKnowledge(conceptId, meshInfo.conceptName ?? conceptId)
    : undefined;
  const resolvedConceptName =
    effectiveConceptRecord?.canonicalName ??
    meshInfo.conceptName ??
    curatedLegacy?.anatomicalName ??
    requestedQuestion?.relatedStructureName ??
    null;

  // Determine 3D mesh availability truthfully
  const in3DModel = atlas ? meshInfo.in3DModel || matchedPartIds.length > 0 : Boolean(effectiveConceptRecord?.visualization.inModel);
  const modelCoverageTier: ModelCoverageTier =
    effectiveConceptRecord?.visualization.coverageTier ??
    (in3DModel ? 'individual_mesh' : 'concept_only');

  // Relationships (both source & target)
  const relationships = conceptId
    ? getRelationshipsForConcept(conceptId, atlas)
    : { outgoing: [], incoming: [], fallbackRelated: [] };

  // MCQs (quiz bank + topic self-checks, deduplicated)
  const quizMatches = QUIZ_QUESTIONS.filter((q) => {
    if (requestedQuestion && q.id === requestedQuestion.id) return true;
    if (conceptId && q.relatedConceptId === conceptId) return true;
    if (relevantConceptIds.includes(q.relatedConceptId)) return true;
    if (lessonPair && q.topicId === lessonPair.topic.id) return true;
    if (systemId && q.systemId === systemId && !conceptId) return true;
    return false;
  });

  // Ensure direct quiz matches come before system-wide ones
  quizMatches.sort((a, b) => {
    const score = (q: QuizQuestion) => {
      let s = 0;
      if (requestedQuestion && q.id === requestedQuestion.id) s += 100;
      if (conceptId && q.relatedConceptId === conceptId) s += 30;
      if (lessonPair && q.topicId === lessonPair.topic.id) s += 20;
      if (relevantConceptIds.includes(q.relatedConceptId)) s += 10;
      return s;
    };
    return score(b) - score(a);
  });

  const sysQuizExtras =
    systemId && quizMatches.length < 4
      ? QUIZ_QUESTIONS.filter((q) => q.systemId === systemId && !quizMatches.some((m) => m.id === q.id))
      : [];

  const combinedQuizBank = [...quizMatches, ...sysQuizExtras].slice(0, 8);
  const selfChecks: TopicSelfCheckQuestion[] = educationTopic?.selfChecks ?? [];

  const mcqs: ResolvedMcqItem[] = [
    ...combinedQuizBank.map((q) => ({
      id: q.id,
      source: 'quiz_bank' as const,
      prompt: q.prompt,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      difficultyOrLevel: q.difficulty,
      topicId: q.topicId,
      relatedConceptId: q.relatedConceptId,
      relatedStructureName: q.relatedStructureName,
      systemId: q.systemId,
    })),
    ...selfChecks.map((sc) => ({
      id: sc.id,
      source: 'chapter_self_check' as const,
      prompt: sc.question,
      options: sc.options,
      correctIndex: sc.correctIndex,
      explanation: sc.explanation,
      difficultyOrLevel: sc.level.replace(/_/g, ' '),
      topicId: educationTopic?.id,
      systemId: systemId ?? undefined,
    })),
  ];

  // Physiology, Clinical, Histology, Radiology, Presentations
  const physiologyModules = dedupeById(
    PHYSIOLOGY_MODULES.filter((pm) => {
      if (requestedPhysiology && pm.id === requestedPhysiology.id) return true;
      if (conceptId && pm.linkedConcepts.some((lc) => lc.conceptId === conceptId)) return true;
      if (pm.linkedConcepts.some((lc) => relevantConceptIds.includes(lc.conceptId))) return true;
      if (systemId && pm.systemId === systemId) return true;
      return false;
    }),
  );

  const clinicalCases = dedupeById(
    CLINICAL_CASES.filter((cs) => {
      if (requestedClinical && cs.id === requestedClinical.id) return true;
      if (conceptId && cs.relevantConcepts.some((rc) => rc.conceptId === conceptId)) return true;
      if (lessonPair && cs.associatedTopicIds.includes(lessonPair.topic.id)) return true;
      if (cs.relevantConcepts.some((rc) => relevantConceptIds.includes(rc.conceptId))) return true;
      if (systemId && cs.systemId === systemId) return true;
      return false;
    }),
  );

  const histologyEntries = dedupeById(
    HISTOLOGY_ENTRIES.filter((he) => {
      if (requestedHistology && he.id === requestedHistology.id) return true;
      if (conceptId && he.linkedConceptIds.includes(conceptId)) return true;
      if (lessonPair && he.linkedTopicIds.includes(lessonPair.topic.id)) return true;
      if (he.linkedConceptIds.some((cid) => relevantConceptIds.includes(cid))) return true;
      if (systemId && he.canonicalSystem === systemId) return true;
      if (domainId === 'histology') return true;
      return false;
    }),
  ).slice(0, 6);

  const radiologyCases = dedupeById(
    RADIOLOGY_CASES.filter((rc) => {
      if (requestedRadiology && rc.id === requestedRadiology.id) return true;
      if (conceptId && rc.linkedConceptIds.includes(conceptId)) return true;
      if (rc.linkedConceptIds.some((cid) => relevantConceptIds.includes(cid))) return true;
      if (systemId && rc.canonicalSystem === systemId) return true;
      if (domainId === 'radiology_imaging') return true;
      return false;
    }),
  );

  const presentations = dedupeById(
    BUILTIN_PRESENTATIONS.filter((pres) => {
      if (requestedPresentation && pres.id === requestedPresentation.id) return true;
      const presConcepts = pres.steps.flatMap((s) => s.scene.selectedConceptIds);
      if (conceptId && presConcepts.includes(conceptId)) return true;
      if (presConcepts.some((cid) => relevantConceptIds.includes(cid))) return true;
      if (systemId && pres.targetSystems?.some((ts) => canonicalSystemForMeshSystem(ts).id === systemId)) {
        return true;
      }
      return false;
    }),
  );

  // External resources & verified YouTube videos
  const externalResources = getStudyResourcesFor({
    conceptId: conceptId ?? undefined,
    topicId: lessonPair?.topic.id ?? educationTopic?.id,
    canonicalSystem: systemId ?? undefined,
    domainId: domainId ?? undefined,
    academicLevel: options?.academicLevel,
    module: 'study_workspace',
    limit: 8,
  });

  const videoResources = getYouTubeVideosFor({
    conceptId: conceptId ?? undefined,
    topicId: lessonPair?.topic.id ?? educationTopic?.id,
    systemId: systemId ?? undefined,
    domainId: domainId ?? undefined,
    academicLevel: options?.academicLevel,
    searchHint: educationTopic?.title ?? lessonPair?.topic.title.en ?? resolvedConceptName ?? undefined,
    limit: 6,
  });

  // Learning objectives & explanations
  const topicSupplement = lessonPair ? TOPIC_DEPTH_SUPPLEMENTS[lessonPair.topic.id] : undefined;
  const learningObjectives = uniqueStrings([
    input.learningObjective,
    ...(educationTopic?.learningObjectives ?? []),
    ...(lessonPair?.lesson.learningObjectives ?? []),
    ...(effectiveConceptRecord?.education.learningObjectives ?? []),
    ...(requestedClinical?.learningObjectives ?? []),
  ]);

  const prerequisites = uniqueStrings([
    ...(educationTopic?.prerequisites ?? []),
  ]);

  const depthExplanations = {
    foundational:
      educationTopic?.depthExplanations.school_foundations ??
      educationTopic?.depthExplanations.secondary_premed ??
      topicSupplement?.school_9_12 ??
      effectiveConceptRecord?.education.beginner ??
      null,
    intermediate:
      educationTopic?.depthExplanations.medical_foundations ??
      educationTopic?.depthExplanations.allied_health ??
      topicSupplement?.bs_mbbs ??
      lessonPair?.topic.explanation.en ??
      effectiveConceptRecord?.education.intermediate ??
      null,
    advanced:
      educationTopic?.depthExplanations.clinical_applied ??
      educationTopic?.depthExplanations.graduate_research ??
      topicSupplement?.phd_research ??
      effectiveConceptRecord?.education.advanced ??
      null,
  };

  const keyFacts = uniqueStrings([
    ...(educationTopic?.keyFacts ?? []),
    ...(lessonPair?.topic.keyFacts ?? []),
    ...(effectiveConceptRecord?.education.importantFacts ?? []),
  ]);

  const rawTerminology = [
    ...(educationTopic?.keyConcepts ?? []).map((kc) => ({ term: kc.term, meaning: kc.definition })),
    ...(lessonPair?.topic.terminology ?? []),
    ...(effectiveConceptRecord?.education.terminology ?? []),
  ];
  const seenTerms = new Set<string>();
  const terminology = rawTerminology.filter((item) => {
    const key = item.term.trim().toLowerCase();
    if (!key || seenTerms.has(key)) return false;
    seenTerms.add(key);
    return true;
  });

  const systemMeta = systemId ? CANONICAL_SYSTEMS.find((s) => s.id === systemId) : undefined;
  const registryNode = (educationTopic?.id || lessonPair?.topic.id)
    ? REGISTRY_TOPICS.find((rt) => rt.id === (educationTopic?.id ?? lessonPair?.topic.id))
    : undefined;

  const isConceptPrimaryEntry = Boolean(
    input.conceptId &&
      !input.topicId &&
      !input.chapterId &&
      !input.physiologyId &&
      !input.clinicalCaseId &&
      !input.histologyId &&
      !input.radiologyId &&
      !input.presentationId,
  );

  const title = isConceptPrimaryEntry
    ? resolvedConceptName ??
      lessonPair?.topic.title.en ??
      educationTopic?.title ??
      systemMeta?.name.en ??
      'Connected Study Context'
    : educationTopic?.title ??
      lessonPair?.topic.title.en ??
      requestedClinical?.title ??
      requestedPhysiology?.title ??
      requestedHistology?.title ??
      requestedRadiology?.title ??
      requestedPresentation?.title ??
      resolvedConceptName ??
      systemMeta?.name.en ??
      'Connected Study Context';

  const domainMeta = domainId ? EDUCATION_DOMAINS.find((d) => d.id === domainId) : undefined;
  const primarySubjectLabel =
    domainMeta && domainMeta.id !== 'human_anatomy'
      ? domainMeta.shortTitle
      : systemMeta?.name.en ?? domainMeta?.shortTitle;

  const subtitleParts = [
    educationTopic?.chapterCode,
    primarySubjectLabel,
    educationTopic?.chapterTitle && educationTopic.chapterTitle !== title ? educationTopic.chapterTitle : null,
    lessonPair?.topic.title.en && lessonPair.topic.title.en !== title ? lessonPair.topic.title.en : null,
    resolvedConceptName && resolvedConceptName !== title ? resolvedConceptName : null,
    conceptId,
  ].filter(Boolean);

  const summaryText =
    educationTopic?.summary ??
    lessonPair?.topic.explanation.en ??
    requestedClinical?.anatomicalExplanation ??
    requestedPhysiology?.explanation ??
    effectiveConceptRecord?.function.primary ??
    systemMeta?.shortSummary.en ??
    'Explore synchronized 3D anatomy, structural relationships, physiology, clinical correlations, assessments, and verified external references.';

  // Honest coverage & 3D mesh status disclosure
  const isPlanned = Boolean(
    registryNode?.coverageStatus === 'planned' ||
      (requestedPhysiology?.status === 'specification_ready' && !in3DModel && !educationTopic && !lessonPair),
  );

  const hasContent = Boolean(
    educationTopic ||
      lessonPair ||
      effectiveConceptRecord ||
      requestedClinical ||
      requestedPhysiology ||
      requestedHistology ||
      requestedRadiology ||
      requestedPresentation ||
      quizMatches.length > 0,
  );

  const studyContentStatus: StudyCoverageDisclosure['studyContent'] = isPlanned
    ? 'planned'
    : hasContent && (learningObjectives.length > 0 || keyFacts.length > 0)
      ? 'available'
      : hasContent
        ? 'partial'
        : 'unavailable';

  const mesh3DStatus: StudyCoverageDisclosure['mesh3D'] = in3DModel
    ? meshInfo.in3DModel
      ? 'available'
      : 'partial'
    : 'unavailable';

  const meshMessage =
    mesh3DStatus === 'available'
      ? `${matchedPartIds.length} synchronized 3D mesh${matchedPartIds.length === 1 ? '' : 'es'} ready (${sex} atlas).`
      : mesh3DStatus === 'partial'
        ? `Primary target lacks an individual mesh; displaying ${matchedPartIds.length} related topic mesh${matchedPartIds.length === 1 ? '' : 'es'} in ${sex} atlas.`
        : 'This concept is included in the study content, but a matching 3D mesh is not currently available.';

  return {
    title,
    subtitle: subtitleParts.join(' · ') || 'Universal Study Workspace',
    sex,
    canonicalConceptId: conceptId,
    conceptName: resolvedConceptName,
    conceptRecord: effectiveConceptRecord,
    allRelevantConceptIds: relevantConceptIds,
    matchedPartIds,
    in3DModel,
    modelCoverageTier,
    systemId,
    domainId,
    topicId: educationTopic?.id ?? lessonPair?.topic.id ?? topicId,
    chapterCode: educationTopic?.chapterCode ?? lessonPair?.lesson.chapter ?? null,
    educationTopic,
    lessonTopic: lessonPair,
    learningObjectives,
    prerequisites,
    summaryText,
    depthExplanations,
    keyFacts,
    terminology,
    relationships,
    mcqs,
    shortAnswers: educationTopic?.shortAnswerExercises ?? [],
    appliedCases: educationTopic?.appliedReasoningExercises ?? [],
    physiologyModules,
    clinicalCases,
    histologyEntries,
    radiologyCases,
    presentations,
    externalResources,
    videoResources,
    fallbackStoryboard: educationTopic?.videoResource ?? null,
    coverage: {
      studyContent: studyContentStatus,
      mesh3D: mesh3DStatus,
      meshMessage,
      externalReadingCount: externalResources.length,
      verifiedVideoCount: videoResources.length,
      reviewStatusLabel: 'Structured reference · Pending faculty review',
    },
    origin: {
      sourceModule: input.sourceModule ?? 'study',
      sourceItemId: input.sourceItemId ?? null,
      questionId: input.questionId ?? null,
      relationshipId: input.relationshipId ?? null,
      learningObjective: input.learningObjective ?? null,
    },
  };
}

export function encodeStudyContextHash(input: StudyContextInput): string {
  const params = new URLSearchParams();
  if (input.conceptId) params.set('conceptId', input.conceptId);
  if (input.partId) params.set('partId', input.partId);
  if (input.topicId) params.set('topicId', input.topicId);
  if (input.chapterId) params.set('chapterId', input.chapterId);
  if (input.domainId) params.set('domainId', input.domainId);
  if (input.systemId) params.set('systemId', input.systemId);
  if (input.questionId) params.set('questionId', input.questionId);
  if (input.relationshipId) params.set('relationshipId', input.relationshipId);
  if (input.physiologyId) params.set('physiologyId', input.physiologyId);
  if (input.clinicalCaseId) params.set('clinicalCaseId', input.clinicalCaseId);
  if (input.histologyId) params.set('histologyId', input.histologyId);
  if (input.radiologyId) params.set('radiologyId', input.radiologyId);
  if (input.presentationId) params.set('presentationId', input.presentationId);
  if (input.resourceId) params.set('resourceId', input.resourceId);
  if (input.videoId) params.set('videoId', input.videoId);
  if (input.sourceModule) params.set('source', input.sourceModule);
  if (input.sourceItemId) params.set('item', input.sourceItemId);
  if (input.sex) params.set('sex', input.sex);
  const qs = params.toString();
  return qs ? `#/study?${qs}` : '#/study';
}

export function parseStudyContextFromHash(hash: string): StudyContextInput {
  const query = hash.split('?')[1] ?? '';
  const p = new URLSearchParams(query);
  return {
    conceptId: p.get('conceptId') ?? p.get('concept') ?? undefined,
    partId: p.get('partId') ?? p.get('part') ?? undefined,
    topicId: p.get('topicId') ?? p.get('topic') ?? undefined,
    chapterId: p.get('chapterId') ?? undefined,
    domainId: (p.get('domainId') ?? p.get('domain') ?? undefined) as EducationDomainId | undefined,
    systemId: (p.get('systemId') ?? p.get('system') ?? undefined) as CanonicalSystemId | undefined,
    questionId: p.get('questionId') ?? p.get('question') ?? undefined,
    relationshipId: p.get('relationshipId') ?? undefined,
    physiologyId: p.get('physiologyId') ?? p.get('module') ?? undefined,
    clinicalCaseId: p.get('clinicalCaseId') ?? p.get('case') ?? undefined,
    histologyId: p.get('histologyId') ?? p.get('entry') ?? undefined,
    radiologyId: p.get('radiologyId') ?? undefined,
    presentationId: p.get('presentationId') ?? undefined,
    resourceId: p.get('resourceId') ?? undefined,
    videoId: p.get('videoId') ?? undefined,
    sourceModule: (p.get('source') ?? undefined) as StudyContextSourceModule | undefined,
    sourceItemId: p.get('item') ?? undefined,
    sex: (p.get('sex') === 'female' ? 'female' : p.get('sex') === 'male' ? 'male' : undefined),
  };
}
