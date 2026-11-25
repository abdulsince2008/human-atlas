import type { AnatomySex } from '../female-atlas';
import type { ExamAttemptSummary, WeakConceptStats } from '../practical-lab/types';
import type { FlashcardReviewState } from '../spaced-repetition';
import type { BookmarkItem, StudyStateV1, StudyTrack } from '../study-store';

export const BLUEPRINT_LIMITS = {
  idPattern: /^[a-zA-Z0-9_-]+$/,
  joinCodePattern: /^[A-Z0-9-]+$/,
  idMaxLength: 128,
  classroomIdMaxLength: 64,
  submissionIdMaxLength: 192,
  joinCodeMinLength: 6,
  joinCodeMaxLength: 16,
  displayNameMaxLength: 60,
  emailMaxLength: 160,
  classroomTitleMinLength: 2,
  classroomTitleMaxLength: 100,
  assignmentTitleMinLength: 2,
  assignmentTitleMaxLength: 120,
  assignmentDescMaxLength: 500,
  targetDomainMaxLength: 64,
  targetTopicMaxLength: 120,
  dueLabelMaxLength: 60,
  notesMaxLength: 400,
  feedbackMaxLength: 400,
  completedTopicsMax: 400,
  quizIdsMax: 400,
  practicalAttemptsMax: 50,
  weakConceptsMax: 200,
  flashcardReviewsMax: 500,
  bookmarksMax: 300,
  recentSearchesMax: 12,
  weakConceptNamesMax: 12,
  manifestItemsMax: 50,
} as const;

export const VALID_STUDY_TRACKS: readonly StudyTrack[] = [
  'FSc Pre-Medical',
  'MDCAT',
  'MBBS / Medical',
  'Nursing / Allied Health',
  'General Biology',
] as const;

export type AssignmentKind = 'chapter' | 'quiz' | 'practical_lab' | 'flashcards';
export type AssignmentStatus = 'open' | 'closed';
export type SubmissionStatus = 'submitted' | 'reviewed';
export type ClassroomStatus = 'active' | 'archived';

export interface CloudStudyProgressPayload {
  uid: string;
  schemaVersion: 1;
  preferredSex: AnatomySex;
  completedTopicIds: string[];
  quizAnsweredIds: string[];
  quizCorrectIds: string[];
  practicalAttempts: ExamAttemptSummary[];
  weakConcepts: Record<string, WeakConceptStats>;
  flashcardReviews: Record<string, FlashcardReviewState>;
  bookmarks: Record<string, BookmarkItem>;
  recentSearches: string[];
  practicalAvgAccuracy: number;
  flashcardsReviewedCount: number;
  bookmarksCount: number;
}

export interface ClassroomRecord {
  classroomId: string;
  teacherUid: string;
  teacherName: string;
  title: string;
  track: StudyTrack;
  joinCode: string;
  status: ClassroomStatus;
  createdAtMs?: number;
  updatedAtMs?: number;
}

export interface StudentEnrollmentRecord {
  studentUid: string;
  classroomId: string;
  joinCode: string;
  classroomTitle: string;
  teacherUid: string;
  teacherName: string;
  track: StudyTrack;
  joinedAtMs?: number;
}

export interface ClassroomMemberRecord {
  classroomId: string;
  teacherUid: string;
  studentUid: string;
  studentName: string;
  track: StudyTrack;
  completedTopicsCount: number;
  quizAccuracyPct: number;
  practicalAvgAccuracy: number;
  practicalAttemptsCount: number;
  flashcardsReviewedCount: number;
  weakConceptNames: string[];
  joinedAtMs?: number;
  updatedAtMs?: number;
}

export interface ClassroomAssignmentItem {
  assignmentId: string;
  classroomId: string;
  teacherUid: string;
  title: string;
  description: string;
  kind: AssignmentKind;
  targetDomainId: string;
  targetTopicId: string;
  dueLabel: string;
  status: AssignmentStatus;
  createdAtMs?: number;
  updatedAtMs?: number;
}

export interface AssignmentSubmissionRecord {
  submissionId: string;
  classroomId: string;
  assignmentId: string;
  teacherUid: string;
  studentUid: string;
  studentName: string;
  status: SubmissionStatus;
  scorePct: number;
  completedTopicsCount: number;
  notes: string;
  teacherFeedback: string;
  submittedAtMs?: number;
  updatedAtMs?: number;
}

export interface ClassroomAnalyticsSummary {
  enrolledCount: number;
  activeMembersCount: number;
  avgCompletedTopics: number;
  avgPracticalAccuracy: number | null;
  avgQuizAccuracy: number | null;
  submissionCompletionRatePct: number | null;
  avgSubmissionScorePct: number | null;
  topWeakConcepts: { name: string; studentCount: number }[];
  assignmentStats: {
    assignmentId: string;
    title: string;
    kind: AssignmentKind;
    status: AssignmentStatus;
    submissionCount: number;
    reviewedCount: number;
    avgScorePct: number | null;
  }[];
}

export function clampText(raw: string, maxLen: number, fallback = ''): string {
  const cleaned = raw.trim().replace(/\s+/g, ' ');
  if (!cleaned) return fallback;
  return cleaned.slice(0, maxLen);
}

export function normalizeJoinCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, BLUEPRINT_LIMITS.joinCodeMaxLength);
}

export function isValidJoinCodeFormat(code: string): boolean {
  return (
    code.length >= BLUEPRINT_LIMITS.joinCodeMinLength &&
    code.length <= BLUEPRINT_LIMITS.joinCodeMaxLength &&
    BLUEPRINT_LIMITS.joinCodePattern.test(code)
  );
}

export function generateJoinCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `A360-${suffix}`;
}

export function makeSafeId(prefix: string, rawSuffix?: string): string {
  const suffix = (rawSuffix ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`)
    .replace(/[^a-zA-Z0-9_-]/g, '');
  return `${prefix}-${suffix}`.slice(0, BLUEPRINT_LIMITS.classroomIdMaxLength);
}

export function buildSubmissionId(assignmentId: string, studentUid: string): string {
  const safeA = assignmentId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
  const safeS = studentUid.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 120);
  return `${safeA}__${safeS}`.slice(0, BLUEPRINT_LIMITS.submissionIdMaxLength);
}

export function normalizeTrack(track: unknown): StudyTrack {
  return VALID_STUDY_TRACKS.includes(track as StudyTrack)
    ? (track as StudyTrack)
    : 'MBBS / Medical';
}

export function computePracticalAvgAccuracy(attempts: ExamAttemptSummary[]): number {
  if (attempts.length === 0) return 0;
  const total = attempts.reduce((acc, a) => acc + (Number.isFinite(a.accuracyPct) ? a.accuracyPct : 0), 0);
  return Math.max(0, Math.min(100, Math.round(total / attempts.length)));
}

export function computeQuizAccuracyPct(state: StudyStateV1): number {
  const answered = state.quizProgress.answeredIds.length;
  if (answered === 0) return 0;
  return Math.max(0, Math.min(100, Math.round((state.quizProgress.correctIds.length / answered) * 100)));
}

export function sanitizeCloudStudyProgressPayload(
  uid: string,
  state: StudyStateV1,
): CloudStudyProgressPayload {
  const completedTopicIds = Array.from(new Set(state.completedTopicIds))
    .filter((id) => typeof id === 'string' && id.length > 0)
    .slice(0, BLUEPRINT_LIMITS.completedTopicsMax);

  const quizAnsweredIds = Array.from(new Set(state.quizProgress.answeredIds))
    .filter((id) => typeof id === 'string' && id.length > 0)
    .slice(0, BLUEPRINT_LIMITS.quizIdsMax);

  const quizCorrectIds = Array.from(new Set(state.quizProgress.correctIds))
    .filter((id) => typeof id === 'string' && id.length > 0)
    .slice(0, BLUEPRINT_LIMITS.quizIdsMax);

  const practicalAttempts = state.practicalAttempts.slice(0, BLUEPRINT_LIMITS.practicalAttemptsMax);

  const weakConcepts: Record<string, WeakConceptStats> = {};
  for (const [k, v] of Object.entries(state.weakConcepts).slice(0, BLUEPRINT_LIMITS.weakConceptsMax)) {
    weakConcepts[k] = v;
  }

  const flashcardReviews: Record<string, FlashcardReviewState> = {};
  for (const [k, v] of Object.entries(state.flashcardReviews).slice(0, BLUEPRINT_LIMITS.flashcardReviewsMax)) {
    flashcardReviews[k] = v;
  }

  const bookmarks: Record<string, BookmarkItem> = {};
  for (const [k, v] of Object.entries(state.bookmarks).slice(0, BLUEPRINT_LIMITS.bookmarksMax)) {
    bookmarks[k] = v;
  }

  const recentSearches = state.recentSearches
    .filter((s) => typeof s === 'string' && s.trim().length > 0)
    .slice(0, BLUEPRINT_LIMITS.recentSearchesMax);

  return {
    uid,
    schemaVersion: 1,
    preferredSex: state.preferredSex === 'female' ? 'female' : 'male',
    completedTopicIds,
    quizAnsweredIds,
    quizCorrectIds,
    practicalAttempts,
    weakConcepts,
    flashcardReviews,
    bookmarks,
    recentSearches,
    practicalAvgAccuracy: computePracticalAvgAccuracy(practicalAttempts),
    flashcardsReviewedCount: Object.keys(flashcardReviews).length,
    bookmarksCount: Object.keys(bookmarks).length,
  };
}

export function sanitizeMemberSummaryPayload(params: {
  classroomId: string;
  teacherUid: string;
  studentUid: string;
  state: StudyStateV1;
}): Omit<ClassroomMemberRecord, 'joinedAtMs' | 'updatedAtMs'> {
  const weakConceptNames = Object.values(params.state.weakConcepts)
    .sort((a, b) => b.missCount - a.missCount)
    .slice(0, BLUEPRINT_LIMITS.weakConceptNamesMax)
    .map((w) => clampText(w.name, 60, w.conceptId));

  return {
    classroomId: params.classroomId,
    teacherUid: params.teacherUid,
    studentUid: params.studentUid,
    studentName: clampText(params.state.profile.displayName, BLUEPRINT_LIMITS.displayNameMaxLength, 'Student'),
    track: normalizeTrack(params.state.profile.track),
    completedTopicsCount: Math.min(500, params.state.completedTopicIds.length),
    quizAccuracyPct: computeQuizAccuracyPct(params.state),
    practicalAvgAccuracy: computePracticalAvgAccuracy(params.state.practicalAttempts),
    practicalAttemptsCount: Math.min(500, params.state.practicalAttempts.length),
    flashcardsReviewedCount: Math.min(2000, Object.keys(params.state.flashcardReviews).length),
    weakConceptNames,
  };
}

export function mergeLocalAndCloudStudyState(
  local: StudyStateV1,
  cloud: Partial<CloudStudyProgressPayload> & { updatedAtMs?: number },
  cloudProfile?: {
    displayName?: string;
    track?: StudyTrack;
    dailyFlashcardGoal?: number;
    preferredSex?: AnatomySex;
    updatedAtMs?: number;
  },
): StudyStateV1 {
  const completedTopicIds = Array.from(
    new Set([...(cloud.completedTopicIds ?? []), ...local.completedTopicIds]),
  ).slice(0, BLUEPRINT_LIMITS.completedTopicsMax);

  const answeredIds = Array.from(
    new Set([...(cloud.quizAnsweredIds ?? []), ...local.quizProgress.answeredIds]),
  ).slice(0, BLUEPRINT_LIMITS.quizIdsMax);

  const correctIds = Array.from(
    new Set([...(cloud.quizCorrectIds ?? []), ...local.quizProgress.correctIds]),
  ).slice(0, BLUEPRINT_LIMITS.quizIdsMax);

  const attemptMap = new Map<string, ExamAttemptSummary>();
  for (const a of cloud.practicalAttempts ?? []) {
    if (a && typeof a.id === 'string') attemptMap.set(a.id, a);
  }
  for (const a of local.practicalAttempts) {
    if (a && typeof a.id === 'string') attemptMap.set(a.id, a);
  }
  const practicalAttempts = Array.from(attemptMap.values())
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
    .slice(0, BLUEPRINT_LIMITS.practicalAttemptsMax);

  const weakConcepts: Record<string, WeakConceptStats> = {
    ...cloud.weakConcepts,
    ...local.weakConcepts,
  };

  const flashcardReviews: Record<string, FlashcardReviewState> = {
    ...cloud.flashcardReviews,
  };
  for (const [cardId, localRev] of Object.entries(local.flashcardReviews)) {
    const cloudRev = flashcardReviews[cardId];
    if (!cloudRev || localRev.lastReviewedAt >= cloudRev.lastReviewedAt) {
      flashcardReviews[cardId] = localRev;
    }
  }

  const bookmarks: Record<string, BookmarkItem> = {
    ...cloud.bookmarks,
    ...local.bookmarks,
  };

  const recentSearches = Array.from(
    new Set([...local.recentSearches, ...(cloud.recentSearches ?? [])]),
  ).slice(0, BLUEPRINT_LIMITS.recentSearchesMax);

  const cloudNewer = (cloud.updatedAtMs ?? 0) > local.updatedAt;
  const preferredSex: AnatomySex = cloudNewer
    ? (cloud.preferredSex ?? cloudProfile?.preferredSex ?? local.preferredSex)
    : local.preferredSex;

  const profileNewer = (cloudProfile?.updatedAtMs ?? 0) > local.profile.updatedAt;

  return {
    ...local,
    migratedLegacy: true,
    preferredSex,
    profile: {
      displayName:
        profileNewer && cloudProfile?.displayName
          ? clampText(cloudProfile.displayName, BLUEPRINT_LIMITS.displayNameMaxLength, local.profile.displayName)
          : local.profile.displayName,
      track: profileNewer && cloudProfile?.track ? normalizeTrack(cloudProfile.track) : local.profile.track,
      dailyFlashcardGoal:
        profileNewer && typeof cloudProfile?.dailyFlashcardGoal === 'number'
          ? Math.max(5, Math.min(100, Math.round(cloudProfile.dailyFlashcardGoal)))
          : local.profile.dailyFlashcardGoal,
      updatedAt: Math.max(local.profile.updatedAt, cloudProfile?.updatedAtMs ?? 0),
    },
    completedTopicIds,
    quizProgress: { answeredIds, correctIds },
    practicalAttempts,
    weakConcepts,
    flashcardReviews,
    bookmarks,
    recentSearches,
    updatedAt: Math.max(local.updatedAt, cloud.updatedAtMs ?? 0),
  };
}

export function computeClassroomAnalytics(
  members: ClassroomMemberRecord[],
  assignments: ClassroomAssignmentItem[],
  submissions: AssignmentSubmissionRecord[],
): ClassroomAnalyticsSummary {
  const enrolledCount = members.length;
  const activeMembers = members.filter(
    (m) =>
      m.completedTopicsCount > 0 ||
      m.practicalAttemptsCount > 0 ||
      m.flashcardsReviewedCount > 0,
  );

  const avgCompletedTopics =
    enrolledCount > 0
      ? Math.round(members.reduce((sum, m) => sum + m.completedTopicsCount, 0) / enrolledCount)
      : 0;

  const membersWithLab = members.filter((m) => m.practicalAttemptsCount > 0);
  const avgPracticalAccuracy =
    membersWithLab.length > 0
      ? Math.round(
          membersWithLab.reduce((sum, m) => sum + m.practicalAvgAccuracy, 0) / membersWithLab.length,
        )
      : null;

  const membersWithQuiz = members.filter((m) => m.quizAccuracyPct > 0);
  const avgQuizAccuracy =
    membersWithQuiz.length > 0
      ? Math.round(membersWithQuiz.reduce((sum, m) => sum + m.quizAccuracyPct, 0) / membersWithQuiz.length)
      : null;

  const totalExpectedSubmissions = enrolledCount * assignments.length;
  const submissionCompletionRatePct =
    totalExpectedSubmissions > 0
      ? Math.min(100, Math.round((submissions.length / totalExpectedSubmissions) * 100))
      : null;

  const avgSubmissionScorePct =
    submissions.length > 0
      ? Math.round(submissions.reduce((sum, s) => sum + s.scorePct, 0) / submissions.length)
      : null;

  const weakCounts = new Map<string, number>();
  for (const m of members) {
    for (const w of m.weakConceptNames) {
      weakCounts.set(w, (weakCounts.get(w) ?? 0) + 1);
    }
  }
  const topWeakConcepts = Array.from(weakCounts.entries())
    .map(([name, studentCount]) => ({ name, studentCount }))
    .sort((a, b) => b.studentCount - a.studentCount || a.name.localeCompare(b.name))
    .slice(0, 6);

  const assignmentStats = assignments.map((a) => {
    const subs = submissions.filter((s) => s.assignmentId === a.assignmentId);
    const reviewedCount = subs.filter((s) => s.status === 'reviewed').length;
    const avgScorePct =
      subs.length > 0 ? Math.round(subs.reduce((sum, s) => sum + s.scorePct, 0) / subs.length) : null;
    return {
      assignmentId: a.assignmentId,
      title: a.title,
      kind: a.kind,
      status: a.status,
      submissionCount: subs.length,
      reviewedCount,
      avgScorePct,
    };
  });

  return {
    enrolledCount,
    activeMembersCount: activeMembers.length,
    avgCompletedTopics,
    avgPracticalAccuracy,
    avgQuizAccuracy,
    submissionCompletionRatePct,
    avgSubmissionScorePct,
    topWeakConcepts,
    assignmentStats,
  };
}
