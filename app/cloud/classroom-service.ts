import type { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type { StudyStateV1, StudyTrack } from '../study-store';
import {
  BLUEPRINT_LIMITS,
  buildSubmissionId,
  clampText,
  generateJoinCode,
  isValidJoinCodeFormat,
  makeSafeId,
  normalizeJoinCode,
  normalizeTrack,
  sanitizeCloudStudyProgressPayload,
  sanitizeMemberSummaryPayload,
  type AssignmentKind,
  type AssignmentSubmissionRecord,
  type ClassroomAssignmentItem,
  type ClassroomMemberRecord,
  type ClassroomRecord,
  type CloudStudyProgressPayload,
  type StudentEnrollmentRecord,
} from './classroom-logic';

function timestampToMs(val: unknown): number | undefined {
  if (val && typeof val === 'object' && 'toMillis' in val && typeof (val as { toMillis: () => number }).toMillis === 'function') {
    return (val as { toMillis: () => number }).toMillis();
  }
  if (typeof val === 'number') return val;
  return undefined;
}

export interface LoadedCloudBundle {
  profile?: {
    displayName: string;
    track: StudyTrack;
    dailyFlashcardGoal: number;
    preferredSex: 'male' | 'female';
    updatedAtMs?: number;
  };
  progress?: Partial<CloudStudyProgressPayload> & { updatedAtMs?: number };
}

export async function upsertSignedInUserRecords(
  user: User,
  localState: StudyStateV1,
): Promise<void> {
  const uid = user.uid;
  const profilePath = `users/${uid}`;
  const privatePath = `users/${uid}/private/account`;
  const displayName = clampText(
    localState.profile.displayName !== 'Anatomy Student'
      ? localState.profile.displayName
      : user.displayName || 'Anatomy Student',
    BLUEPRINT_LIMITS.displayNameMaxLength,
    'Anatomy Student',
  );
  const track = normalizeTrack(localState.profile.track);
  const preferredSex = localState.preferredSex === 'female' ? 'female' : 'male';
  const dailyFlashcardGoal = Math.max(5, Math.min(100, Math.round(localState.profile.dailyFlashcardGoal || 15)));

  try {
    const profileRef = doc(db, 'users', uid);
    const snap = await getDoc(profileRef);
    const batch = writeBatch(db);
    if (!snap.exists()) {
      batch.set(profileRef, {
        uid,
        displayName,
        track,
        preferredSex,
        dailyFlashcardGoal,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.update(profileRef, {
        displayName,
        track,
        preferredSex,
        dailyFlashcardGoal,
        updatedAt: serverTimestamp(),
      });
    }

    const email = clampText(user.email || 'verified@user.local', BLUEPRINT_LIMITS.emailMaxLength, 'verified@user.local');
    const privateRef = doc(db, 'users', uid, 'private', 'account');
    const privSnap = await getDoc(privateRef);
    if (!privSnap.exists()) {
      batch.set(privateRef, {
        uid,
        email,
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.update(privateRef, {
        email,
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${profilePath} | ${privatePath}`);
  }
}

export async function fetchCloudBundle(uid: string): Promise<LoadedCloudBundle> {
  const profilePath = `users/${uid}`;
  const progressPath = `users/${uid}/studyProgress/primary`;
  try {
    const [profileSnap, progressSnap] = await Promise.all([
      getDoc(doc(db, 'users', uid)),
      getDoc(doc(db, 'users', uid, 'studyProgress', 'primary')),
    ]);

    const bundle: LoadedCloudBundle = {};
    if (profileSnap.exists()) {
      const d = profileSnap.data();
      bundle.profile = {
        displayName: String(d.displayName ?? 'Anatomy Student'),
        track: normalizeTrack(d.track),
        dailyFlashcardGoal: Number(d.dailyFlashcardGoal ?? 15),
        preferredSex: d.preferredSex === 'female' ? 'female' : 'male',
        updatedAtMs: timestampToMs(d.updatedAt),
      };
    }

    if (progressSnap.exists()) {
      const d = progressSnap.data();
      bundle.progress = {
        uid: String(d.uid ?? uid),
        schemaVersion: 1,
        preferredSex: d.preferredSex === 'female' ? 'female' : 'male',
        completedTopicIds: Array.isArray(d.completedTopicIds) ? d.completedTopicIds : [],
        quizAnsweredIds: Array.isArray(d.quizAnsweredIds) ? d.quizAnsweredIds : [],
        quizCorrectIds: Array.isArray(d.quizCorrectIds) ? d.quizCorrectIds : [],
        practicalAttempts: Array.isArray(d.practicalAttempts) ? d.practicalAttempts : [],
        weakConcepts: (d.weakConcepts && typeof d.weakConcepts === 'object' ? d.weakConcepts : {}) as CloudStudyProgressPayload['weakConcepts'],
        flashcardReviews: (d.flashcardReviews && typeof d.flashcardReviews === 'object' ? d.flashcardReviews : {}) as CloudStudyProgressPayload['flashcardReviews'],
        bookmarks: (d.bookmarks && typeof d.bookmarks === 'object' ? d.bookmarks : {}) as CloudStudyProgressPayload['bookmarks'],
        recentSearches: Array.isArray(d.recentSearches) ? d.recentSearches : [],
        practicalAvgAccuracy: Number(d.practicalAvgAccuracy ?? 0),
        flashcardsReviewedCount: Number(d.flashcardsReviewedCount ?? 0),
        bookmarksCount: Number(d.bookmarksCount ?? 0),
        updatedAtMs: timestampToMs(d.updatedAt),
      };
    }
    return bundle;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `${profilePath} | ${progressPath}`);
  }
}

export async function saveCloudStudyProgress(uid: string, state: StudyStateV1): Promise<void> {
  const path = `users/${uid}/studyProgress/primary`;
  const payload = sanitizeCloudStudyProgressPayload(uid, state);
  const ref = doc(db, 'users', uid, 'studyProgress', 'primary');
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const batch = writeBatch(db);
      batch.set(ref, {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
    } else {
      await updateDoc(ref, {
        preferredSex: payload.preferredSex,
        completedTopicIds: payload.completedTopicIds,
        quizAnsweredIds: payload.quizAnsweredIds,
        quizCorrectIds: payload.quizCorrectIds,
        practicalAttempts: payload.practicalAttempts,
        weakConcepts: payload.weakConcepts,
        flashcardReviews: payload.flashcardReviews,
        bookmarks: payload.bookmarks,
        recentSearches: payload.recentSearches,
        practicalAvgAccuracy: payload.practicalAvgAccuracy,
        flashcardsReviewedCount: payload.flashcardsReviewedCount,
        bookmarksCount: payload.bookmarksCount,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function syncMemberSummariesForEnrollments(
  uid: string,
  enrollments: StudentEnrollmentRecord[],
  state: StudyStateV1,
): Promise<void> {
  if (enrollments.length === 0) return;
  for (const enr of enrollments) {
    const path = `classrooms/${enr.classroomId}/members/${uid}`;
    const summary = sanitizeMemberSummaryPayload({
      classroomId: enr.classroomId,
      teacherUid: enr.teacherUid,
      studentUid: uid,
      state,
    });
    try {
      const ref = doc(db, 'classrooms', enr.classroomId, 'members', uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, {
          studentName: summary.studentName,
          track: summary.track,
          completedTopicsCount: summary.completedTopicsCount,
          quizAccuracyPct: summary.quizAccuracyPct,
          practicalAvgAccuracy: summary.practicalAvgAccuracy,
          practicalAttemptsCount: summary.practicalAttemptsCount,
          flashcardsReviewedCount: summary.flashcardsReviewedCount,
          weakConceptNames: summary.weakConceptNames,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }
}

export async function createClassroomWithCode(params: {
  teacherUid: string;
  teacherName: string;
  title: string;
  track: StudyTrack;
}): Promise<ClassroomRecord> {
  const classroomId = makeSafeId('cls');
  const joinCode = generateJoinCode();
  const title = clampText(params.title, BLUEPRINT_LIMITS.classroomTitleMaxLength, 'Anatomy Cohort');
  const teacherName = clampText(params.teacherName, BLUEPRINT_LIMITS.displayNameMaxLength, 'Educator');
  const track = normalizeTrack(params.track);

  const path = `classrooms/${classroomId}`;
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'classrooms', classroomId), {
      classroomId,
      teacherUid: params.teacherUid,
      teacherName,
      title,
      track,
      joinCode,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'classroomCodes', joinCode), {
      joinCode,
      classroomId,
      teacherUid: params.teacherUid,
      teacherName,
      title,
      track,
      status: 'active',
      createdAt: serverTimestamp(),
    });
    batch.set(doc(db, 'classrooms', classroomId, 'manifest', 'assignments'), {
      classroomId,
      teacherUid: params.teacherUid,
      items: [],
      updatedAt: serverTimestamp(),
    });
    await batch.commit();

    return {
      classroomId,
      teacherUid: params.teacherUid,
      teacherName,
      title,
      track,
      joinCode,
      status: 'active',
      createdAtMs: Date.now(),
      updatedAtMs: Date.now(),
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function archiveClassroom(classroom: ClassroomRecord): Promise<void> {
  const path = `classrooms/${classroom.classroomId}`;
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'classrooms', classroom.classroomId), {
      status: 'archived',
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, 'classroomCodes', classroom.joinCode), {
      status: 'archived',
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function joinClassroomByCode(params: {
  studentUid: string;
  joinCode: string;
  state: StudyStateV1;
}): Promise<{ ok: boolean; error?: string; enrollment?: StudentEnrollmentRecord }> {
  const code = normalizeJoinCode(params.joinCode);
  if (!isValidJoinCodeFormat(code)) {
    return {
      ok: false,
      error: 'Enter a valid 6–16 character join code (e.g., A360-7K2M).',
    };
  }

  const codePath = `classroomCodes/${code}`;
  try {
    const codeSnap = await getDoc(doc(db, 'classroomCodes', code));
    if (!codeSnap.exists()) {
      return { ok: false, error: `No classroom found for code ${code}.` };
    }
    const d = codeSnap.data();
    if (d.status !== 'active') {
      return { ok: false, error: `Classroom ${String(d.title ?? code)} is archived and no longer accepting enrollments.` };
    }
    const classroomId = String(d.classroomId);
    const teacherUid = String(d.teacherUid);
    const teacherName = clampText(String(d.teacherName ?? 'Educator'), BLUEPRINT_LIMITS.displayNameMaxLength, 'Educator');
    const classroomTitle = clampText(String(d.title ?? 'Anatomy Class'), BLUEPRINT_LIMITS.classroomTitleMaxLength, 'Anatomy Class');
    const track = normalizeTrack(d.track);

    const enrollmentRef = doc(db, 'users', params.studentUid, 'enrollments', classroomId);
    const existingEnr = await getDoc(enrollmentRef);
    if (existingEnr.exists()) {
      return {
        ok: true,
        enrollment: {
          studentUid: params.studentUid,
          classroomId,
          joinCode: code,
          classroomTitle,
          teacherUid,
          teacherName,
          track,
          joinedAtMs: timestampToMs(existingEnr.data().joinedAt),
        },
      };
    }

    const memberSummary = sanitizeMemberSummaryPayload({
      classroomId,
      teacherUid,
      studentUid: params.studentUid,
      state: params.state,
    });

    const batch = writeBatch(db);
    batch.set(doc(db, 'classrooms', classroomId, 'members', params.studentUid), {
      ...memberSummary,
      joinedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(enrollmentRef, {
      studentUid: params.studentUid,
      classroomId,
      joinCode: code,
      classroomTitle,
      teacherUid,
      teacherName,
      track,
      joinedAt: serverTimestamp(),
    });
    await batch.commit();

    return {
      ok: true,
      enrollment: {
        studentUid: params.studentUid,
        classroomId,
        joinCode: code,
        classroomTitle,
        teacherUid,
        teacherName,
        track,
        joinedAtMs: Date.now(),
      },
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, codePath);
  }
}

export async function leaveClassroom(studentUid: string, classroomId: string): Promise<void> {
  const path = `users/${studentUid}/enrollments/${classroomId}`;
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'users', studentUid, 'enrollments', classroomId));
    batch.delete(doc(db, 'classrooms', classroomId, 'members', studentUid));
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function fetchClassroomManifest(classroomId: string): Promise<ClassroomAssignmentItem[]> {
  const path = `classrooms/${classroomId}/manifest/assignments`;
  try {
    const snap = await getDoc(doc(db, 'classrooms', classroomId, 'manifest', 'assignments'));
    if (!snap.exists()) return [];
    const rawItems = snap.data().items;
    if (!Array.isArray(rawItems)) return [];
    return rawItems.map((it) => ({
      assignmentId: String(it.assignmentId ?? ''),
      classroomId: String(it.classroomId ?? classroomId),
      teacherUid: String(it.teacherUid ?? ''),
      title: String(it.title ?? 'Assignment'),
      description: String(it.description ?? ''),
      kind: (it.kind as AssignmentKind) ?? 'chapter',
      targetDomainId: String(it.targetDomainId ?? 'human_anatomy'),
      targetTopicId: String(it.targetTopicId ?? ''),
      dueLabel: String(it.dueLabel ?? ''),
      status: it.status === 'closed' ? 'closed' : 'open',
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function createClassroomAssignment(params: {
  classroomId: string;
  teacherUid: string;
  title: string;
  description: string;
  kind: AssignmentKind;
  targetDomainId: string;
  targetTopicId: string;
  dueLabel: string;
  existingAssignments: ClassroomAssignmentItem[];
}): Promise<ClassroomAssignmentItem> {
  const assignmentId = makeSafeId('asg');
  const title = clampText(params.title, BLUEPRINT_LIMITS.assignmentTitleMaxLength, 'Assigned Module');
  const description = clampText(params.description, BLUEPRINT_LIMITS.assignmentDescMaxLength, '');
  const targetDomainId = clampText(params.targetDomainId, BLUEPRINT_LIMITS.targetDomainMaxLength, 'human_anatomy');
  const targetTopicId = clampText(params.targetTopicId, BLUEPRINT_LIMITS.targetTopicMaxLength, '');
  const dueLabel = clampText(params.dueLabel, BLUEPRINT_LIMITS.dueLabelMaxLength, 'Self-paced');

  const manifestItem = {
    assignmentId,
    classroomId: params.classroomId,
    teacherUid: params.teacherUid,
    title,
    description,
    kind: params.kind,
    targetDomainId,
    targetTopicId,
    dueLabel,
    status: 'open' as const,
  };

  const nextManifestItems = [
    manifestItem,
    ...params.existingAssignments.map((a) => ({
      assignmentId: a.assignmentId,
      classroomId: a.classroomId,
      teacherUid: a.teacherUid,
      title: a.title,
      description: a.description,
      kind: a.kind,
      targetDomainId: a.targetDomainId,
      targetTopicId: a.targetTopicId,
      dueLabel: a.dueLabel,
      status: a.status,
    })),
  ].slice(0, BLUEPRINT_LIMITS.manifestItemsMax);

  const path = `classrooms/${params.classroomId}/assignments/${assignmentId}`;
  try {
    const manifestRef = doc(db, 'classrooms', params.classroomId, 'manifest', 'assignments');
    const manifestSnap = await getDoc(manifestRef);
    const batch = writeBatch(db);
    batch.set(doc(db, 'classrooms', params.classroomId, 'assignments', assignmentId), {
      ...manifestItem,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    if (manifestSnap.exists()) {
      batch.update(manifestRef, {
        items: nextManifestItems,
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.set(manifestRef, {
        classroomId: params.classroomId,
        teacherUid: params.teacherUid,
        items: nextManifestItems,
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();

    return {
      ...manifestItem,
      createdAtMs: Date.now(),
      updatedAtMs: Date.now(),
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function submitClassroomAssignment(params: {
  classroomId: string;
  assignmentId: string;
  teacherUid: string;
  studentUid: string;
  studentName: string;
  scorePct: number;
  completedTopicsCount: number;
  notes: string;
  existingSubmission?: AssignmentSubmissionRecord;
}): Promise<void> {
  const submissionId = buildSubmissionId(params.assignmentId, params.studentUid);
  const path = `classrooms/${params.classroomId}/submissions/${submissionId}`;
  const studentName = clampText(params.studentName, BLUEPRINT_LIMITS.displayNameMaxLength, 'Student');
  const scorePct = Math.max(0, Math.min(100, Math.round(params.scorePct)));
  const completedTopicsCount = Math.max(0, Math.min(500, Math.round(params.completedTopicsCount)));
  const notes = clampText(params.notes, BLUEPRINT_LIMITS.notesMaxLength, '');

  const ref = doc(db, 'classrooms', params.classroomId, 'submissions', submissionId);
  try {
    if (!params.existingSubmission) {
      const batch = writeBatch(db);
      batch.set(ref, {
        submissionId,
        classroomId: params.classroomId,
        assignmentId: params.assignmentId,
        teacherUid: params.teacherUid,
        studentUid: params.studentUid,
        studentName,
        status: 'submitted',
        scorePct,
        completedTopicsCount,
        notes,
        teacherFeedback: '',
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
    } else {
      await updateDoc(ref, {
        studentName,
        scorePct,
        completedTopicsCount,
        notes,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function reviewClassroomSubmission(params: {
  classroomId: string;
  submissionId: string;
  teacherFeedback: string;
}): Promise<void> {
  const path = `classrooms/${params.classroomId}/submissions/${params.submissionId}`;
  const teacherFeedback = clampText(params.teacherFeedback, BLUEPRINT_LIMITS.feedbackMaxLength, 'Reviewed by educator.');
  try {
    await updateDoc(doc(db, 'classrooms', params.classroomId, 'submissions', params.submissionId), {
      status: 'reviewed',
      teacherFeedback,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export function subscribeTeacherClassrooms(
  teacherUid: string,
  onData: (rows: ClassroomRecord[]) => void,
): Unsubscribe {
  const path = 'classrooms';
  const q = query(collection(db, 'classrooms'), where('teacherUid', '==', teacherUid));
  return onSnapshot(
    q,
    (snap) => {
      const rows: ClassroomRecord[] = snap.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          classroomId: String(d.classroomId ?? docSnap.id),
          teacherUid: String(d.teacherUid ?? teacherUid),
          teacherName: String(d.teacherName ?? 'Educator'),
          title: String(d.title ?? 'Cohort'),
          track: normalizeTrack(d.track),
          joinCode: String(d.joinCode ?? ''),
          status: d.status === 'archived' ? 'archived' : 'active',
          createdAtMs: timestampToMs(d.createdAt),
          updatedAtMs: timestampToMs(d.updatedAt),
        };
      });
      rows.sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0));
      onData(rows);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    },
  );
}

export function subscribeClassroomDetailsForTeacher(
  classroomId: string,
  teacherUid: string,
  callbacks: {
    onMembers: (members: ClassroomMemberRecord[]) => void;
    onAssignments: (assignments: ClassroomAssignmentItem[]) => void;
    onSubmissions: (submissions: AssignmentSubmissionRecord[]) => void;
  },
): Unsubscribe {
  const unsubMembers = onSnapshot(
    query(collection(db, 'classrooms', classroomId, 'members'), where('teacherUid', '==', teacherUid)),
    (snap) => {
      callbacks.onMembers(
        snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            classroomId,
            teacherUid,
            studentUid: String(d.studentUid ?? docSnap.id),
            studentName: String(d.studentName ?? 'Student'),
            track: normalizeTrack(d.track),
            completedTopicsCount: Number(d.completedTopicsCount ?? 0),
            quizAccuracyPct: Number(d.quizAccuracyPct ?? 0),
            practicalAvgAccuracy: Number(d.practicalAvgAccuracy ?? 0),
            practicalAttemptsCount: Number(d.practicalAttemptsCount ?? 0),
            flashcardsReviewedCount: Number(d.flashcardsReviewedCount ?? 0),
            weakConceptNames: Array.isArray(d.weakConceptNames) ? d.weakConceptNames : [],
            joinedAtMs: timestampToMs(d.joinedAt),
            updatedAtMs: timestampToMs(d.updatedAt),
          };
        }),
      );
    },
    (err) => handleFirestoreError(err, OperationType.LIST, `classrooms/${classroomId}/members`),
  );

  const unsubAssignments = onSnapshot(
    query(collection(db, 'classrooms', classroomId, 'assignments'), where('teacherUid', '==', teacherUid)),
    (snap) => {
      const list: ClassroomAssignmentItem[] = snap.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          assignmentId: String(d.assignmentId ?? docSnap.id),
          classroomId,
          teacherUid,
          title: String(d.title ?? 'Assignment'),
          description: String(d.description ?? ''),
          kind: (d.kind as AssignmentKind) ?? 'chapter',
          targetDomainId: String(d.targetDomainId ?? 'human_anatomy'),
          targetTopicId: String(d.targetTopicId ?? ''),
          dueLabel: String(d.dueLabel ?? ''),
          status: d.status === 'closed' ? 'closed' : 'open',
          createdAtMs: timestampToMs(d.createdAt),
          updatedAtMs: timestampToMs(d.updatedAt),
        };
      });
      list.sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0));
      callbacks.onAssignments(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, `classrooms/${classroomId}/assignments`),
  );

  const unsubSubmissions = onSnapshot(
    query(collection(db, 'classrooms', classroomId, 'submissions'), where('teacherUid', '==', teacherUid)),
    (snap) => {
      const list: AssignmentSubmissionRecord[] = snap.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          submissionId: String(d.submissionId ?? docSnap.id),
          classroomId,
          assignmentId: String(d.assignmentId ?? ''),
          teacherUid,
          studentUid: String(d.studentUid ?? ''),
          studentName: String(d.studentName ?? 'Student'),
          status: d.status === 'reviewed' ? 'reviewed' : 'submitted',
          scorePct: Number(d.scorePct ?? 0),
          completedTopicsCount: Number(d.completedTopicsCount ?? 0),
          notes: String(d.notes ?? ''),
          teacherFeedback: String(d.teacherFeedback ?? ''),
          submittedAtMs: timestampToMs(d.submittedAt),
          updatedAtMs: timestampToMs(d.updatedAt),
        };
      });
      list.sort((a, b) => (b.updatedAtMs ?? 0) - (a.updatedAtMs ?? 0));
      callbacks.onSubmissions(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, `classrooms/${classroomId}/submissions`),
  );

  return () => {
    unsubMembers();
    unsubAssignments();
    unsubSubmissions();
  };
}

export function subscribeStudentEnrollments(
  studentUid: string,
  onData: (rows: StudentEnrollmentRecord[]) => void,
): Unsubscribe {
  const path = `users/${studentUid}/enrollments`;
  return onSnapshot(
    collection(db, 'users', studentUid, 'enrollments'),
    (snap) => {
      const rows: StudentEnrollmentRecord[] = snap.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          studentUid,
          classroomId: String(d.classroomId ?? docSnap.id),
          joinCode: String(d.joinCode ?? ''),
          classroomTitle: String(d.classroomTitle ?? 'Anatomy Class'),
          teacherUid: String(d.teacherUid ?? ''),
          teacherName: String(d.teacherName ?? 'Educator'),
          track: normalizeTrack(d.track),
          joinedAtMs: timestampToMs(d.joinedAt),
        };
      });
      rows.sort((a, b) => (b.joinedAtMs ?? 0) - (a.joinedAtMs ?? 0));
      onData(rows);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path),
  );
}

export function subscribeStudentClassroomSubmissions(
  classroomId: string,
  studentUid: string,
  onData: (rows: AssignmentSubmissionRecord[]) => void,
): Unsubscribe {
  const path = `classrooms/${classroomId}/submissions`;
  return onSnapshot(
    query(collection(db, 'classrooms', classroomId, 'submissions'), where('studentUid', '==', studentUid)),
    (snap) => {
      onData(
        snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            submissionId: String(d.submissionId ?? docSnap.id),
            classroomId,
            assignmentId: String(d.assignmentId ?? ''),
            teacherUid: String(d.teacherUid ?? ''),
            studentUid,
            studentName: String(d.studentName ?? 'Student'),
            status: d.status === 'reviewed' ? 'reviewed' : 'submitted',
            scorePct: Number(d.scorePct ?? 0),
            completedTopicsCount: Number(d.completedTopicsCount ?? 0),
            notes: String(d.notes ?? ''),
            teacherFeedback: String(d.teacherFeedback ?? ''),
            submittedAtMs: timestampToMs(d.submittedAt),
            updatedAtMs: timestampToMs(d.updatedAt),
          };
        }),
      );
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path),
  );
}
