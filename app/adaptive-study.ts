import type { Atlas } from './anatomy';
import type { CanonicalSystemId } from './anatomy-systems';
import { ANATOMY_LESSONS } from './learning-data';
import { QUIZ_QUESTIONS } from './quiz-data';
import { ANATOMY_FLASHCARDS, isCardDue } from './spaced-repetition';
import { resolveStudyContext, type StudyContextInput } from './study-context-engine';
import type { StudyStateV1 } from './study-store';

export type AdaptiveReasonType =
  | 'quiz_miss'
  | 'practical_weak'
  | 'flashcard_due'
  | 'incomplete_topic'
  | 'bookmarked';

export interface AdaptiveRecommendation {
  id: string;
  reasonType: AdaptiveReasonType;
  reasonLabel: string;
  explanation: string;
  priority: number;
  targetTitle: string;
  systemId?: CanonicalSystemId;
  conceptId?: string;
  topicId?: string;
  studyInput: StudyContextInput;
  validated: boolean;
}

/**
 * Deterministic, explainable adaptive recommendation generator.
 * Reads real browser progress (missed MCQs, Practical Lab weak concepts,
 * SM-2 due/lapsed/difficult flashcards, incomplete topics, and bookmarks)
 * and validates every recommendation target against real modules.
 */
export function generateAdaptiveRecommendations(
  state: StudyStateV1,
  atlas?: Atlas | null,
  options?: { limit?: number; nowMs?: number },
): AdaptiveRecommendation[] {
  const limit = options?.limit ?? 8;
  const nowMs = options?.nowMs ?? Date.now();
  const candidates: AdaptiveRecommendation[] = [];
  const seenTargets = new Set<string>();

  // 1. Recent missed quiz questions (answeredIds minus correctIds)
  const correctSet = new Set(state.quizProgress.correctIds);
  const missedQuizIds = state.quizProgress.answeredIds.filter((id) => !correctSet.has(id));
  for (const qid of missedQuizIds) {
    const q = QUIZ_QUESTIONS.find((item) => item.id === qid);
    if (!q) continue;
    const dedupeKey = `concept:${q.relatedConceptId}`;
    if (seenTargets.has(dedupeKey)) continue;
    seenTargets.add(dedupeKey);

    const studyInput: StudyContextInput = {
      questionId: q.id,
      conceptId: q.relatedConceptId,
      topicId: q.topicId,
      systemId: q.systemId,
      sourceModule: 'quiz',
      sourceItemId: q.id,
      sex: state.preferredSex,
    };
    const resolved = resolveStudyContext(studyInput, atlas);

    candidates.push({
      id: `adapt-quiz-${q.id}`,
      reasonType: 'quiz_miss',
      reasonLabel: 'Based on your recent incorrect answers',
      explanation: `You missed "${q.relatedStructureName}" (${q.difficulty}). Review its 3D anatomy, explanation, and related questions.`,
      priority: 120,
      targetTitle: resolved.title,
      systemId: q.systemId,
      conceptId: q.relatedConceptId,
      topicId: q.topicId,
      studyInput,
      validated: resolved.coverage.studyContent !== 'unavailable',
    });
  }

  // 2. Practical Lab weak concepts sorted by missCount
  const weakList = Object.values(state.weakConcepts).sort((a, b) => b.missCount - a.missCount);
  for (const weak of weakList) {
    const dedupeKey = `concept:${weak.conceptId}`;
    if (seenTargets.has(dedupeKey)) continue;
    seenTargets.add(dedupeKey);

    const studyInput: StudyContextInput = {
      conceptId: weak.conceptId,
      systemId: weak.canonicalSystem,
      sourceModule: 'practical_lab',
      sourceItemId: weak.conceptId,
      sex: state.preferredSex,
    };
    const resolved = resolveStudyContext(studyInput, atlas);

    candidates.push({
      id: `adapt-weak-${weak.conceptId}`,
      reasonType: 'practical_weak',
      reasonLabel: `Missed ${weak.missCount}× in Practical Lab`,
      explanation: `Weak structure spotter target in ${weak.canonicalSystem} system (${weak.correctCount}/2 recovery streak).`,
      priority: 110 + Math.min(20, weak.missCount * 4),
      targetTitle: weak.name || resolved.title,
      systemId: weak.canonicalSystem,
      conceptId: weak.conceptId,
      topicId: resolved.topicId ?? undefined,
      studyInput,
      validated: resolved.coverage.studyContent !== 'unavailable',
    });
  }

  // 3. Difficult / lapsed / due SM-2 flashcards
  for (const rev of Object.values(state.flashcardReviews)) {
    const isDiff = rev.lastRating === 'difficult' || rev.lapses > 0;
    const isDue = isCardDue(rev, nowMs);
    if (!isDiff && !isDue) continue;
    const card = ANATOMY_FLASHCARDS.find((c) => c.id === rev.cardId);
    if (!card) continue;

    const dedupeKey = `concept:${card.conceptId}`;
    if (seenTargets.has(dedupeKey)) continue;
    seenTargets.add(dedupeKey);

    const studyInput: StudyContextInput = {
      conceptId: card.conceptId,
      systemId: card.canonicalSystem,
      sourceModule: 'revision',
      sourceItemId: card.id,
      sex: state.preferredSex,
    };
    const resolved = resolveStudyContext(studyInput, atlas);

    candidates.push({
      id: `adapt-card-${card.id}`,
      reasonType: 'flashcard_due',
      reasonLabel: isDiff ? 'Marked Difficult on spaced repetition' : 'Spaced repetition review due',
      explanation: `${card.structureName} (${card.focus}) requires active recall reinforcement.`,
      priority: isDiff ? 92 : 70,
      targetTitle: `${card.structureName} · ${card.focus}`,
      systemId: card.canonicalSystem,
      conceptId: card.conceptId,
      topicId: resolved.topicId ?? undefined,
      studyInput,
      validated: resolved.coverage.studyContent !== 'unavailable',
    });
  }

  // 4. Bookmarked structures / topics / quizzes needing review
  for (const bm of Object.values(state.bookmarks)) {
    const dedupeKey = `${bm.kind}:${bm.targetId}`;
    if (seenTargets.has(dedupeKey)) continue;
    seenTargets.add(dedupeKey);

    const studyInput: StudyContextInput =
      bm.kind === 'structure'
        ? {
            conceptId: bm.targetId,
            systemId: bm.canonicalSystem,
            sourceModule: 'bookmarks',
            sourceItemId: bm.id,
            sex: state.preferredSex,
          }
        : bm.kind === 'topic'
          ? {
              topicId: bm.targetId,
              systemId: bm.canonicalSystem,
              sourceModule: 'bookmarks',
              sourceItemId: bm.id,
              sex: state.preferredSex,
            }
          : {
              questionId: bm.kind === 'quiz' ? bm.targetId : undefined,
              systemId: bm.canonicalSystem,
              sourceModule: 'bookmarks',
              sourceItemId: bm.id,
              sex: state.preferredSex,
            };

    const resolved = resolveStudyContext(studyInput, atlas);
    candidates.push({
      id: `adapt-bm-${bm.id}`,
      reasonType: 'bookmarked',
      reasonLabel: 'Saved to your revision bookmarks',
      explanation: `Revisit saved ${bm.kind}: ${bm.title} in full 3D & study context.`,
      priority: 55,
      targetTitle: bm.title,
      systemId: bm.canonicalSystem ?? resolved.systemId ?? undefined,
      conceptId: resolved.canonicalConceptId ?? undefined,
      topicId: resolved.topicId ?? undefined,
      studyInput,
      validated: resolved.coverage.studyContent !== 'unavailable',
    });
  }

  // 5. Incomplete topics in ANATOMY_LESSONS (prioritize weak systems first!)
  const weakSystems = new Set<CanonicalSystemId>(
    candidates.map((c) => c.systemId).filter((s): s is CanonicalSystemId => Boolean(s)),
  );
  const completedSet = new Set(state.completedTopicIds);
  for (const lesson of ANATOMY_LESSONS) {
    for (const topic of lesson.topics) {
      if (completedSet.has(topic.id)) continue;
      const dedupeKey = `topic:${topic.id}`;
      if (seenTargets.has(dedupeKey)) continue;
      seenTargets.add(dedupeKey);

      const inWeakSys = weakSystems.has(lesson.systemId);
      const studyInput: StudyContextInput = {
        topicId: topic.id,
        systemId: lesson.systemId,
        conceptId: topic.conceptIds[0],
        sourceModule: 'learn',
        sourceItemId: topic.id,
        sex: state.preferredSex,
      };
      const resolved = resolveStudyContext(studyInput, atlas);

      candidates.push({
        id: `adapt-topic-${topic.id}`,
        reasonType: 'incomplete_topic',
        reasonLabel: inWeakSys
          ? `Recommended next for ${lesson.systemId} review`
          : 'Next uncompleted system topic',
        explanation: `${lesson.chapter}: ${topic.title.en} (${topic.level}) — includes 3D structures and self-checks.`,
        priority: inWeakSys ? 62 : 35,
        targetTitle: topic.title.en,
        systemId: lesson.systemId,
        conceptId: topic.conceptIds[0],
        topicId: topic.id,
        studyInput,
        validated: resolved.coverage.studyContent !== 'unavailable',
      });
    }
  }

  return candidates
    .filter((c) => c.validated)
    .sort((a, b) => b.priority - a.priority || a.targetTitle.localeCompare(b.targetTitle))
    .slice(0, limit);
}
