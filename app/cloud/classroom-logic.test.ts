import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BLUEPRINT_LIMITS,
  buildSubmissionId,
  computeClassroomAnalytics,
  generateJoinCode,
  isValidJoinCodeFormat,
  mergeLocalAndCloudStudyState,
  normalizeJoinCode,
  sanitizeCloudStudyProgressPayload,
  sanitizeMemberSummaryPayload,
  type AssignmentSubmissionRecord,
  type ClassroomAssignmentItem,
  type ClassroomMemberRecord,
} from './classroom-logic';
import { createEmptyStudyState } from '../study-store';

test('join code generation and normalization adhere strictly to blueprint regex and length', () => {
  for (let i = 0; i < 15; i++) {
    const code = generateJoinCode();
    assert.equal(isValidJoinCodeFormat(code), true, `Expected valid join code: ${code}`);
    assert.ok(code.startsWith('A360-'));
  }

  assert.equal(normalizeJoinCode(' a360 - 7k$2m '), 'A360-7K2M');
  assert.equal(isValidJoinCodeFormat('A360-7K2M'), true);
  assert.equal(isValidJoinCodeFormat('short'), false);
  assert.equal(isValidJoinCodeFormat('a360-lower'), false);
});

test('submission ID builder creates bounded deterministic IDs', () => {
  const id = buildSubmissionId('asgn_123', 'user-abc-999');
  assert.equal(id, 'asgn_123__user-abc-999');
  assert.ok(id.length <= BLUEPRINT_LIMITS.submissionIdMaxLength);
  assert.match(id, BLUEPRINT_LIMITS.idPattern);
});

test('sanitizeCloudStudyProgressPayload clamps arrays and maps within Firestore rule limits', () => {
  const state = createEmptyStudyState();
  state.completedTopicIds = Array.from({ length: 500 }, (_, i) => `topic-${i}`);
  state.recentSearches = Array.from({ length: 25 }, (_, i) => `query-${i}`);
  state.practicalAttempts = Array.from({ length: 65 }, (_, i) => ({
    id: `att-${i}`,
    completedAt: 2000 + i,
    scope: 'all',
    mode: 'identify',
    difficulty: 'foundational',
    preset: 'guided',
    timerMode: 'untimed',
    isWeakPractice: false,
    score: 8,
    attempted: 10,
    totalQuestions: 10,
    accuracyPct: 80,
    durationSec: 60,
    timedOut: false,
    perSystem: [],
    missedConceptIds: [],
  }));

  const payload = sanitizeCloudStudyProgressPayload('uid-123', state);
  assert.equal(payload.uid, 'uid-123');
  assert.equal(payload.completedTopicIds.length, BLUEPRINT_LIMITS.completedTopicsMax);
  assert.equal(payload.recentSearches.length, BLUEPRINT_LIMITS.recentSearchesMax);
  assert.equal(payload.practicalAttempts.length, BLUEPRINT_LIMITS.practicalAttemptsMax);
  assert.equal(payload.practicalAvgAccuracy, 80);
});

test('mergeLocalAndCloudStudyState combines local offline work with cloud progress without loss', () => {
  const local = createEmptyStudyState();
  local.updatedAt = 2000;
  local.preferredSex = 'female';
  local.completedTopicIds = ['topic-local-1', 'topic-shared'];
  local.quizProgress = {
    answeredIds: ['q1', 'q2'],
    correctIds: ['q1'],
  };
  local.flashcardReviews = {
    c1: {
      cardId: 'c1',
      conceptId: 'fma-1',
      intervalDays: 3,
      easeFactor: 2.5,
      repetitions: 2,
      lapses: 0,
      lastRating: 'understood',
      lastReviewedAt: 2500,
      dueAt: 5000,
    },
  };

  const merged = mergeLocalAndCloudStudyState(local, {
    uid: 'uid-1',
    updatedAtMs: 1500,
    preferredSex: 'male',
    completedTopicIds: ['topic-cloud-1', 'topic-shared'],
    quizAnsweredIds: ['q2', 'q3'],
    quizCorrectIds: ['q3'],
    flashcardReviews: {
      c1: {
        cardId: 'c1',
        conceptId: 'fma-1',
        intervalDays: 1,
        easeFactor: 2.3,
        repetitions: 1,
        lapses: 0,
        lastRating: 'repeat',
        lastReviewedAt: 1000,
        dueAt: 2000,
      },
      c2: {
        cardId: 'c2',
        conceptId: 'fma-2',
        intervalDays: 6,
        easeFactor: 2.6,
        repetitions: 3,
        lapses: 0,
        lastRating: 'understood',
        lastReviewedAt: 1500,
        dueAt: 8000,
      },
    },
  });

  assert.deepEqual(merged.completedTopicIds.sort(), ['topic-cloud-1', 'topic-local-1', 'topic-shared']);
  assert.deepEqual(merged.quizProgress.answeredIds.sort(), ['q1', 'q2', 'q3']);
  assert.deepEqual(merged.quizProgress.correctIds.sort(), ['q1', 'q3']);
  assert.equal(merged.preferredSex, 'female');
  assert.equal(merged.flashcardReviews.c1.repetitions, 2);
  assert.equal(merged.flashcardReviews.c2.repetitions, 3);
});

test('sanitizeMemberSummaryPayload limits weak concepts and computes metrics cleanly', () => {
  const state = createEmptyStudyState();
  state.profile.displayName = '  Amina   Tariq  ';
  state.completedTopicIds = ['t1', 't2', 't3'];
  state.quizProgress = { answeredIds: ['q1', 'q2', 'q3', 'q4'], correctIds: ['q1', 'q2', 'q3'] };
  state.weakConcepts = {
    a: { conceptId: 'a', name: 'Mitral Valve', canonicalSystem: 'cardiovascular', missCount: 4, correctCount: 0, lastMissedAt: 1, lastPracticedAt: 1 },
    b: { conceptId: 'b', name: 'Phrenic Nerve', canonicalSystem: 'nervous', missCount: 2, correctCount: 0, lastMissedAt: 1, lastPracticedAt: 1 },
  };

  const member = sanitizeMemberSummaryPayload({
    classroomId: 'cls-1',
    teacherUid: 't-1',
    studentUid: 's-1',
    state,
  });

  assert.equal(member.studentName, 'Amina Tariq');
  assert.equal(member.completedTopicsCount, 3);
  assert.equal(member.quizAccuracyPct, 75);
  assert.deepEqual(member.weakConceptNames, ['Mitral Valve', 'Phrenic Nerve']);
});

test('computeClassroomAnalytics derives honest aggregate metrics from members and submissions', () => {
  const members: ClassroomMemberRecord[] = [
    {
      classroomId: 'cls-1',
      teacherUid: 't1',
      studentUid: 's1',
      studentName: 'Student One',
      track: 'MBBS / Medical',
      completedTopicsCount: 10,
      quizAccuracyPct: 80,
      practicalAvgAccuracy: 90,
      practicalAttemptsCount: 2,
      flashcardsReviewedCount: 12,
      weakConceptNames: ['Brachial Plexus', 'Aortic Arch'],
    },
    {
      classroomId: 'cls-1',
      teacherUid: 't1',
      studentUid: 's2',
      studentName: 'Student Two',
      track: 'MBBS / Medical',
      completedTopicsCount: 4,
      quizAccuracyPct: 60,
      practicalAvgAccuracy: 70,
      practicalAttemptsCount: 1,
      flashcardsReviewedCount: 5,
      weakConceptNames: ['Brachial Plexus'],
    },
  ];

  const assignments: ClassroomAssignmentItem[] = [
    {
      assignmentId: 'a1',
      classroomId: 'cls-1',
      teacherUid: 't1',
      title: 'Thorax Spotter',
      description: 'Identify heart chambers',
      kind: 'practical_lab',
      targetDomainId: 'human_anatomy',
      targetTopicId: 'thorax',
      dueLabel: 'Friday',
      status: 'open',
    },
  ];

  const submissions: AssignmentSubmissionRecord[] = [
    {
      submissionId: 'a1__s1',
      classroomId: 'cls-1',
      assignmentId: 'a1',
      teacherUid: 't1',
      studentUid: 's1',
      studentName: 'Student One',
      status: 'reviewed',
      scorePct: 92,
      completedTopicsCount: 10,
      notes: 'Done',
      teacherFeedback: 'Great accuracy',
    },
  ];

  const analytics = computeClassroomAnalytics(members, assignments, submissions);
  assert.equal(analytics.enrolledCount, 2);
  assert.equal(analytics.activeMembersCount, 2);
  assert.equal(analytics.avgCompletedTopics, 7);
  assert.equal(analytics.avgPracticalAccuracy, 80);
  assert.equal(analytics.avgQuizAccuracy, 70);
  assert.equal(analytics.submissionCompletionRatePct, 50);
  assert.equal(analytics.avgSubmissionScorePct, 92);
  assert.equal(analytics.topWeakConcepts[0].name, 'Brachial Plexus');
  assert.equal(analytics.topWeakConcepts[0].studentCount, 2);
  assert.equal(analytics.assignmentStats[0].reviewedCount, 1);
});
