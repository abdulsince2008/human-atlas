import type { CanonicalSystemId } from './anatomy-systems';
import {
  KNOWLEDGE_GRAPH_V2,
  VERIFIED_RELATIONSHIPS,
  type StructureKnowledgeV2,
} from './knowledge-graph';

export type FlashcardFocus = 'name' | 'function' | 'location' | 'relationship' | 'fact';
export type ReviewRating = 'difficult' | 'repeat' | 'understood';

export interface AnatomyFlashcard {
  id: string;
  conceptId: string;
  canonicalSystem: CanonicalSystemId;
  structureName: string;
  focus: FlashcardFocus;
  frontPrompt: string;
  backAnswer: string;
  backDetails: string[];
  inModel: boolean;
  difficulty: 'foundational' | 'intermediate';
}

export interface FlashcardReviewState {
  cardId: string;
  conceptId: string;
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  lapses: number;
  lastRating: ReviewRating;
  lastReviewedAt: number;
  dueAt: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_EASE = 1.3;
const MAX_EASE = 2.8;

/**
 * Documented SM-2 Variant Spaced Repetition Scheduler.
 *
 * Disclaimer: Implements the standard SuperMemo-2 interval curve adapted to 3 clear
 * student feedback states ('difficult', 'repeat', 'understood') for study organization.
 * Does not claim clinically validated learning outcomes.
 *
 * Rules:
 * - 'difficult' (quality q=1): resets repetitions to 0, logs a lapse, schedules re-review in 4 hours,
 *   and reduces easeFactor by 0.20 (floored at 1.3).
 * - 'repeat' (quality q=3): advances interval conservatively (1 day -> 3 days -> interval * 1.25),
 *   nudges easeFactor slightly down (-0.08).
 * - 'understood' (quality q=5): advances repetitions (1 day -> 6 days -> interval * easeFactor),
 *   increases easeFactor by +0.10 (capped at 2.8).
 */
export function computeNextReview(
  prev: FlashcardReviewState | undefined,
  cardId: string,
  conceptId: string,
  rating: ReviewRating,
  nowMs = Date.now(),
): FlashcardReviewState {
  const baseEase = prev?.easeFactor ?? 2.5;
  const baseReps = prev?.repetitions ?? 0;
  const baseInterval = prev?.intervalDays ?? 0;
  const baseLapses = prev?.lapses ?? 0;

  let nextEase = baseEase;
  let nextReps = baseReps;
  let nextIntervalDays = baseInterval;
  let nextLapses = baseLapses;
  let dueOffsetMs = DAY_MS;

  if (rating === 'difficult') {
    nextReps = 0;
    nextLapses = baseLapses + 1;
    nextIntervalDays = 0.17; // ~4 hours
    nextEase = Math.max(MIN_EASE, Number((baseEase - 0.2).toFixed(2)));
    dueOffsetMs = Math.round(nextIntervalDays * DAY_MS);
  } else if (rating === 'repeat') {
    nextReps = baseReps + 1;
    if (baseReps === 0) nextIntervalDays = 1;
    else if (baseReps === 1) nextIntervalDays = 3;
    else nextIntervalDays = Math.max(2, Math.round(baseInterval * 1.25));
    nextEase = Math.max(MIN_EASE, Number((baseEase - 0.08).toFixed(2)));
    dueOffsetMs = nextIntervalDays * DAY_MS;
  } else {
    nextReps = baseReps + 1;
    if (baseReps === 0) nextIntervalDays = 1;
    else if (baseReps === 1) nextIntervalDays = 6;
    else nextIntervalDays = Math.max(6, Math.round(baseInterval * baseEase));
    nextEase = Math.min(MAX_EASE, Number((baseEase + 0.1).toFixed(2)));
    dueOffsetMs = nextIntervalDays * DAY_MS;
  }

  return {
    cardId,
    conceptId,
    repetitions: nextReps,
    intervalDays: nextIntervalDays,
    easeFactor: nextEase,
    lapses: nextLapses,
    lastRating: rating,
    lastReviewedAt: nowMs,
    dueAt: nowMs + dueOffsetMs,
  };
}

export function isCardDue(state: FlashcardReviewState | undefined, nowMs = Date.now()): boolean {
  if (!state) return true;
  return state.dueAt <= nowMs;
}

export function formatIntervalLabel(days: number): string {
  if (days < 1) return `${Math.max(1, Math.round(days * 24))} hr`;
  if (days === 1) return '1 day';
  return `${days} days`;
}

function deriveCardsForStructure(rec: StructureKnowledgeV2): AnatomyFlashcard[] {
  const cards: AnatomyFlashcard[] = [];
  const rel = VERIFIED_RELATIONSHIPS.find((r) => r.sourceConceptId === rec.conceptId);

  // 1. Primary Function card
  cards.push({
    id: `fc-${rec.conceptId}-fn`,
    conceptId: rec.conceptId,
    canonicalSystem: rec.canonicalSystem,
    structureName: rec.canonicalName,
    focus: 'function',
    frontPrompt: `What is the primary anatomical function of the ${rec.canonicalName}${rec.commonName !== rec.canonicalName ? ` (${rec.commonName})` : ''}?`,
    backAnswer: rec.function.primary,
    backDetails: [
      `Region: ${rec.location.region}`,
      ...(rec.education.importantFacts.slice(0, 1)),
    ],
    inModel: rec.visualization.inModel,
    difficulty: 'foundational',
  });

  // 2. Anatomical Location card
  cards.push({
    id: `fc-${rec.conceptId}-loc`,
    conceptId: rec.conceptId,
    canonicalSystem: rec.canonicalSystem,
    structureName: rec.canonicalName,
    focus: 'location',
    frontPrompt: `Where is the ${rec.canonicalName} located anatomically?`,
    backAnswer: rec.location.position,
    backDetails: [
      rec.location.subdivision ? `Subdivision: ${rec.location.subdivision}` : `System: ${rec.canonicalSystem}`,
      ...(rec.location.nearbyStructures.length > 0
        ? [`Nearby: ${rec.location.nearbyStructures.slice(0, 3).join(', ')}`]
        : []),
    ],
    inModel: rec.visualization.inModel,
    difficulty: 'foundational',
  });

  // 3. Name / Identification card when synonyms or Latin name exist
  if (rec.latinName || rec.synonyms.length > 0) {
    const clue = rec.commonName !== rec.canonicalName ? rec.commonName : rec.synonyms[0] ?? rec.latinName!;
    cards.push({
      id: `fc-${rec.conceptId}-id`,
      conceptId: rec.conceptId,
      canonicalSystem: rec.canonicalSystem,
      structureName: rec.canonicalName,
      focus: 'name',
      frontPrompt: `Identify the canonical anatomical structure known as "${clue}" (${rec.location.region}).`,
      backAnswer: `${rec.canonicalName}${rec.latinName ? ` (Latin: ${rec.latinName})` : ''}`,
      backDetails: [rec.function.primary],
      inModel: rec.visualization.inModel,
      difficulty: 'foundational',
    });
  }

  // 4. Relationship card if verified structural relationship exists
  if (rel) {
    cards.push({
      id: `fc-${rec.conceptId}-rel`,
      conceptId: rec.conceptId,
      canonicalSystem: rec.canonicalSystem,
      structureName: rec.canonicalName,
      focus: 'relationship',
      frontPrompt: `How does ${rec.canonicalName} relate anatomically to ${rel.targetLabel} (${rel.directionLabel})?`,
      backAnswer: rel.note,
      backDetails: [`Relationship type: ${rel.directionLabel}`, `Source: ${rel.sourceReference}`],
      inModel: rec.visualization.inModel,
      difficulty: 'intermediate',
    });
  } else if (rec.education.importantFacts.length > 0) {
    cards.push({
      id: `fc-${rec.conceptId}-fact`,
      conceptId: rec.conceptId,
      canonicalSystem: rec.canonicalSystem,
      structureName: rec.canonicalName,
      focus: 'fact',
      frontPrompt: `State a key structural or physiological fact about the ${rec.canonicalName}.`,
      backAnswer: rec.education.importantFacts[0],
      backDetails: rec.education.importantFacts.slice(1, 2),
      inModel: rec.visualization.inModel,
      difficulty: 'intermediate',
    });
  }

  return cards;
}

export const ANATOMY_FLASHCARDS: AnatomyFlashcard[] = KNOWLEDGE_GRAPH_V2.flatMap(deriveCardsForStructure);
