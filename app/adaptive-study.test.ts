import assert from 'node:assert/strict';
import test from 'node:test';
import { generateAdaptiveRecommendations } from './adaptive-study';
import { QUIZ_QUESTIONS } from './quiz-data';
import { ANATOMY_FLASHCARDS } from './spaced-repetition';
import { createEmptyStudyState } from './study-store';

test('generateAdaptiveRecommendations returns validated incomplete-topic recommendations on empty state', () => {
  const state = createEmptyStudyState();
  const recs = generateAdaptiveRecommendations(state, null, { limit: 5 });

  assert.ok(recs.length > 0);
  assert.ok(recs.length <= 5);
  for (const r of recs) {
    assert.equal(r.validated, true);
    assert.equal(r.reasonType, 'incomplete_topic');
    assert.ok(r.studyInput.topicId);
  }
});

test('generateAdaptiveRecommendations ranks missed quiz, practical weak concept, difficult flashcard, and bookmark by priority', () => {
  const nowMs = 1_700_000_000_000;
  const base = createEmptyStudyState();

  // Distinct concepts so candidate deduplication retains all 4 adaptive signal types
  const missedQuiz = QUIZ_QUESTIONS.find((q) => q.relatedConceptId === 'FMA52748') ?? QUIZ_QUESTIONS[0];
  const difficultCard = ANATOMY_FLASHCARDS.find(
    (c) => c.conceptId !== missedQuiz.relatedConceptId && c.conceptId !== 'FMA7088' && c.conceptId !== 'FMA7203',
  )!;

  const state = {
    ...base,
    quizProgress: {
      answeredIds: [missedQuiz.id],
      correctIds: [],
    },
    weakConcepts: {
      FMA7088: {
        conceptId: 'FMA7088',
        name: 'Heart',
        canonicalSystem: 'cardiovascular' as const,
        missCount: 3,
        correctCount: 0,
        lastMissedAt: nowMs - 1000,
      },
    },
    flashcardReviews: {
      [difficultCard.id]: {
        cardId: difficultCard.id,
        conceptId: difficultCard.conceptId,
        repetitions: 0,
        intervalDays: 0.17,
        easeFactor: 2.3,
        lapses: 1,
        lastRating: 'difficult' as const,
        lastReviewedAt: nowMs - 5000,
        dueAt: nowMs + 60_000,
      },
    },
    bookmarks: {
      'structure:FMA7203': {
        id: 'structure:FMA7203',
        kind: 'structure' as const,
        targetId: 'FMA7203',
        title: 'Kidney',
        canonicalSystem: 'urinary' as const,
        createdAt: nowMs - 10_000,
      },
    },
  };

  const recs = generateAdaptiveRecommendations(state, null, { limit: 30, nowMs });

  const quizMiss = recs.find((r) => r.reasonType === 'quiz_miss');
  const practicalWeak = recs.find((r) => r.reasonType === 'practical_weak');
  const flashcardDue = recs.find((r) => r.reasonType === 'flashcard_due');
  const bookmarked = recs.find((r) => r.reasonType === 'bookmarked');

  assert.ok(quizMiss, 'Expected quiz_miss recommendation');
  assert.equal(quizMiss.reasonLabel, 'Based on your recent incorrect answers');
  assert.equal(quizMiss.conceptId, missedQuiz.relatedConceptId);

  assert.ok(practicalWeak, 'Expected practical_weak recommendation');
  assert.equal(practicalWeak.conceptId, 'FMA7088');

  assert.ok(flashcardDue, 'Expected flashcard_due recommendation for difficult card');
  assert.equal(flashcardDue.conceptId, difficultCard.conceptId);

  assert.ok(bookmarked, 'Expected bookmarked recommendation');
  assert.equal(bookmarked.conceptId, 'FMA7203');

  // Verify priorities descend strictly from quiz/practical (>=110) -> difficult card (92) -> bookmarked (55)
  assert.ok(quizMiss.priority >= 120);
  assert.ok(practicalWeak.priority >= 110);
  assert.ok(flashcardDue.priority > bookmarked.priority);
});
