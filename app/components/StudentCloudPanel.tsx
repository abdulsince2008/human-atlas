import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Cloud,
  CloudOff,
  LogIn,
  LogOut,
  RefreshCw,
  Send,
  Users,
} from 'lucide-react';
import {
  BLUEPRINT_LIMITS,
  computePracticalAvgAccuracy,
  computeQuizAccuracyPct,
  isValidJoinCodeFormat,
  normalizeJoinCode,
  type AssignmentSubmissionRecord,
  type ClassroomAssignmentItem,
} from '../cloud/classroom-logic';
import {
  fetchClassroomManifest,
  joinClassroomByCode,
  leaveClassroom,
  submitClassroomAssignment,
  subscribeStudentClassroomSubmissions,
} from '../cloud/classroom-service';
import { EDUCATION_DOMAINS } from '../education/education-domains';
import { useFirebase } from './FirebaseContext';
import type { AppRoute } from './SiteHeader';
import { useStudy } from './StudyContext';

interface Props {
  onNavigate: (route: AppRoute) => void;
}

const KIND_LABELS: Record<ClassroomAssignmentItem['kind'], string> = {
  chapter: 'Chapter Study',
  quiz: 'MCQ Quiz',
  practical_lab: '3D Practical Lab',
  flashcards: 'Spaced Repetition',
};

export default function StudentCloudPanel({ onNavigate }: Props) {
  const {
    authReady,
    user,
    isVerifiedUser,
    authBusy,
    authError,
    syncStatus,
    lastSyncedAt,
    enrollments,
    signInWithGoogle,
    signOutAccount,
    syncNow,
  } = useFirebase();
  const { state } = useStudy();

  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinMessage, setJoinMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('');
  const [assignments, setAssignments] = useState<ClassroomAssignmentItem[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [submissions, setSubmissions] = useState<AssignmentSubmissionRecord[]>([]);

  const [activeSubmissionTarget, setActiveSubmissionTarget] = useState<ClassroomAssignmentItem | null>(null);
  const [scoreInput, setScoreInput] = useState<number>(80);
  const [notesInput, setNotesInput] = useState('');
  const [submitBusy, setSubmitBusy] = useState(false);
  const [submitFeedbackMsg, setSubmitFeedbackMsg] = useState<string | null>(null);

  const activeEnrollment = useMemo(
    () => enrollments.find((e) => e.classroomId === selectedClassroomId) ?? enrollments[0] ?? null,
    [enrollments, selectedClassroomId],
  );

  useEffect(() => {
    if (activeEnrollment && activeEnrollment.classroomId !== selectedClassroomId) {
      setSelectedClassroomId(activeEnrollment.classroomId);
    }
  }, [activeEnrollment, selectedClassroomId]);

  // Load classroom assignment manifest & subscribe to student's submissions for active enrollment
  useEffect(() => {
    if (!isVerifiedUser || !user || !activeEnrollment) {
      setAssignments([]);
      setSubmissions([]);
      return;
    }

    let cancelled = false;
    setLoadingAssignments(true);
    fetchClassroomManifest(activeEnrollment.classroomId)
      .then((items) => {
        if (!cancelled) setAssignments(items);
      })
      .finally(() => {
        if (!cancelled) setLoadingAssignments(false);
      });

    const unsub = subscribeStudentClassroomSubmissions(
      activeEnrollment.classroomId,
      user.uid,
      (rows) => setSubmissions(rows),
    );

    return () => {
      cancelled = true;
      unsub();
    };
  }, [isVerifiedUser, user, activeEnrollment]);

  const submissionByAssignmentId = useMemo(() => {
    const map = new Map<string, AssignmentSubmissionRecord>();
    for (const s of submissions) {
      map.set(s.assignmentId, s);
    }
    return map;
  }, [submissions]);

  const suggestedDefaultScore = useMemo(() => {
    const labAvg = computePracticalAvgAccuracy(state.practicalAttempts);
    if (state.practicalAttempts.length > 0) return labAvg;
    if (state.quizProgress.answeredIds.length > 0) return computeQuizAccuracyPct(state);
    return state.completedTopicIds.length > 0 ? 100 : 0;
  }, [state]);

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isVerifiedUser) return;
    const normalized = normalizeJoinCode(joinCodeInput);
    if (!isValidJoinCodeFormat(normalized)) {
      setJoinMessage({ ok: false, text: 'Enter a valid 6–16 character join code (e.g., A360-7K2M).' });
      return;
    }

    setJoinBusy(true);
    setJoinMessage(null);
    try {
      const res = await joinClassroomByCode({
        studentUid: user.uid,
        joinCode: normalized,
        state,
      });
      if (!res.ok) {
        setJoinMessage({ ok: false, text: res.error ?? 'Could not join classroom.' });
      } else {
        setJoinCodeInput('');
        if (res.enrollment) setSelectedClassroomId(res.enrollment.classroomId);
        setJoinMessage({
          ok: true,
          text: `Joined ${res.enrollment?.classroomTitle ?? 'classroom'} cleanly.`,
        });
      }
    } finally {
      setJoinBusy(false);
    }
  };

  const handleOpenAssignmentTask = (item: ClassroomAssignmentItem) => {
    if (item.kind === 'quiz') {
      onNavigate('quiz');
      return;
    }
    if (item.kind === 'practical_lab') {
      onNavigate('practical-lab');
      return;
    }
    if (item.kind === 'flashcards') {
      onNavigate('revision');
      return;
    }
    const domainExists = EDUCATION_DOMAINS.some((d) => d.id === item.targetDomainId);
    const domain = domainExists ? item.targetDomainId : 'human_anatomy';
    window.location.hash = item.targetTopicId
      ? `#/learn?domain=${encodeURIComponent(domain)}&topic=${encodeURIComponent(item.targetTopicId)}`
      : `#/learn?domain=${encodeURIComponent(domain)}`;
  };

  const handleOpenSubmitBox = (item: ClassroomAssignmentItem) => {
    const existing = submissionByAssignmentId.get(item.assignmentId);
    setActiveSubmissionTarget(item);
    setScoreInput(existing ? existing.scorePct : suggestedDefaultScore);
    setNotesInput(existing ? existing.notes : '');
    setSubmitFeedbackMsg(null);
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isVerifiedUser || !activeEnrollment || !activeSubmissionTarget) return;
    setSubmitBusy(true);
    setSubmitFeedbackMsg(null);
    try {
      const existing = submissionByAssignmentId.get(activeSubmissionTarget.assignmentId);
      await submitClassroomAssignment({
        classroomId: activeEnrollment.classroomId,
        assignmentId: activeSubmissionTarget.assignmentId,
        teacherUid: activeEnrollment.teacherUid,
        studentUid: user.uid,
        studentName: state.profile.displayName || user.displayName || 'Student',
        scorePct: scoreInput,
        completedTopicsCount: state.completedTopicIds.length,
        notes: notesInput,
        existingSubmission: existing,
      });
      setActiveSubmissionTarget(null);
      setSubmitFeedbackMsg('Assignment submission saved to classroom.');
    } finally {
      setSubmitBusy(false);
    }
  };

  return (
    <section
      className="mt-5 mb-5 rounded-xl border border-slate-200 bg-white p-5"
      aria-label="Cloud Progress Sync and Student Classrooms"
      data-testid="student-cloud-panel"
    >
      <div
        className={`flex flex-wrap items-center justify-between gap-4 ${
          isVerifiedUser ? 'border-b border-slate-100 pb-4' : ''
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-teal-50 p-2 text-teal-800">
            {isVerifiedUser ? <Cloud size={18} /> : <CloudOff size={18} />}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Cloud Study Sync &amp; Classroom Portal
            </h2>
            <p className="mt-0.5 text-xs text-slate-600">
              {isVerifiedUser
                ? `Signed in as ${user?.displayName || 'Verified Student'} · Sync: ${
                    syncStatus === 'syncing'
                      ? 'Syncing…'
                      : syncStatus === 'synced'
                        ? `Up to date${lastSyncedAt ? ` (${new Date(lastSyncedAt).toLocaleTimeString()})` : ''}`
                        : syncStatus === 'error'
                          ? 'Attention needed'
                          : 'Ready'
                  }`
                : 'Optional Google sign-in syncs your IndexedDB progress across devices and unlocks teacher classrooms & assignments.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!authReady ? (
            <span className="text-xs text-slate-500">Checking account…</span>
          ) : isVerifiedUser ? (
            <>
              <button
                type="button"
                onClick={() => void syncNow()}
                disabled={syncStatus === 'syncing'}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                <RefreshCw size={13} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                <span>Sync Now</span>
              </button>
              <button
                type="button"
                onClick={() => void signOutAccount()}
                disabled={authBusy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              disabled={authBusy}
              data-testid="student-google-signin"
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-900 disabled:opacity-60"
            >
              <LogIn size={14} />
              <span>{authBusy ? 'Signing in…' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>
      </div>

      {authError && (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800" role="alert">
          {authError}
        </p>
      )}

      {isVerifiedUser && (
        <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Join Classroom & Enrolled List */}
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <form onSubmit={handleJoinSubmit} className="space-y-2">
              <label htmlFor="student-join-code" className="block text-xs font-bold text-slate-800">
                Join a Classroom by Code
              </label>
              <div className="flex gap-2">
                <input
                  id="student-join-code"
                  type="text"
                  value={joinCodeInput}
                  maxLength={BLUEPRINT_LIMITS.joinCodeMaxLength}
                  placeholder="e.g. A360-7K2M"
                  onChange={(e) => setJoinCodeInput(normalizeJoinCode(e.target.value))}
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs uppercase text-slate-900"
                />
                <button
                  type="submit"
                  disabled={joinBusy || !joinCodeInput.trim()}
                  className="rounded-lg bg-teal-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-900 disabled:opacity-50"
                >
                  {joinBusy ? 'Joining…' : 'Join'}
                </button>
              </div>
            </form>

            {joinMessage && (
              <p
                className={`text-xs ${joinMessage.ok ? 'text-emerald-700' : 'text-rose-700'}`}
                role="status"
              >
                {joinMessage.text}
              </p>
            )}

            <div>
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                <Users size={13} />
                <span>Enrolled Classrooms ({enrollments.length})</span>
              </h3>
              {enrollments.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">
                  Not enrolled in any classroom yet. Ask your lecturer for an A360 join code.
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {enrollments.map((enr) => {
                    const active = enr.classroomId === activeEnrollment?.classroomId;
                    return (
                      <li
                        key={enr.classroomId}
                        className={`rounded-lg border p-2.5 text-xs ${
                          active
                            ? 'border-teal-700 bg-white shadow-xs'
                            : 'border-slate-200 bg-white/70 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedClassroomId(enr.classroomId)}
                            className="text-left"
                          >
                            <strong className="block text-slate-900">{enr.classroomTitle}</strong>
                            <span className="text-slate-500">
                              {enr.teacherName} · {enr.track} · {enr.joinCode}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void leaveClassroom(user!.uid, enr.classroomId)}
                            className="text-[11px] font-medium text-slate-500 hover:text-rose-700"
                          >
                            Leave
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Assignments & Submissions */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {activeEnrollment ? `${activeEnrollment.classroomTitle} — Assignments` : 'Class Assignments'}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeEnrollment
                    ? `Instructor: ${activeEnrollment.teacherName} · Open an assignment to study or submit your progress.`
                    : 'Join or select a classroom to view assigned modules, quizzes, and Practical Labs.'}
                </p>
              </div>
              {submitFeedbackMsg && (
                <span className="text-xs font-semibold text-emerald-700" role="status">
                  {submitFeedbackMsg}
                </span>
              )}
            </div>

            {!activeEnrollment ? (
              <p className="py-6 text-xs text-slate-500">
                Your joined classroom tasks and teacher feedback will appear here.
              </p>
            ) : loadingAssignments ? (
              <p className="py-6 text-xs text-slate-500">Loading classroom assignments…</p>
            ) : assignments.length === 0 ? (
              <p className="py-6 text-xs text-slate-500">
                Your instructor has not published assignments for this classroom yet.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {assignments.map((asg) => {
                  const sub = submissionByAssignmentId.get(asg.assignmentId);
                  const isReviewed = sub?.status === 'reviewed';
                  return (
                    <article
                      key={asg.assignmentId}
                      className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-800">
                            {KIND_LABELS[asg.kind]} · {asg.dueLabel || 'Self-paced'}
                          </p>
                          <h4 className="mt-0.5 text-sm font-bold text-slate-900">{asg.title}</h4>
                          {asg.description && (
                            <p className="mt-1 text-xs text-slate-600">{asg.description}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenAssignmentTask(asg)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                          >
                            <span>Open Task</span>
                            <ArrowRight size={12} />
                          </button>
                          {!isReviewed && asg.status === 'open' && (
                            <button
                              type="button"
                              onClick={() => handleOpenSubmitBox(asg)}
                              className="inline-flex items-center gap-1 rounded-lg bg-teal-800 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-900"
                            >
                              <Send size={12} />
                              <span>{sub ? 'Update Submission' : 'Submit Progress'}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {sub && (
                        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-2 text-xs">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                            <CheckCircle2 size={14} className={isReviewed ? 'text-emerald-700' : 'text-teal-700'} />
                            <span>
                              {isReviewed ? 'Reviewed' : 'Submitted'} · Self-reported/Lab Score: {sub.scorePct}% · Topics: {sub.completedTopicsCount}
                            </span>
                          </span>
                          {sub.teacherFeedback && (
                            <span className="text-slate-700">
                              <strong>Instructor Note:</strong> {sub.teacherFeedback}
                            </span>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            {activeSubmissionTarget && (
              <form
                onSubmit={handleSubmitAssignment}
                className="mt-4 space-y-3 rounded-xl border border-teal-200 bg-teal-50/40 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900">
                    Submit: {activeSubmissionTarget.title}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActiveSubmissionTarget(null)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <label className="text-xs font-medium text-slate-700">
                    <span className="block mb-1">Score / Mastery (%)</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={scoreInput}
                      onChange={(e) => setScoreInput(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </label>
                  <label className="text-xs font-medium text-slate-700 sm:col-span-2">
                    <span className="block mb-1">Reflection or Question for Instructor (optional)</span>
                    <input
                      type="text"
                      maxLength={BLUEPRINT_LIMITS.notesMaxLength}
                      value={notesInput}
                      placeholder="e.g., Reviewed thoracic wall and completed spotter."
                      onChange={(e) => setNotesInput(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </label>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitBusy}
                    className="rounded-lg bg-teal-800 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-900 disabled:opacity-60"
                  >
                    {submitBusy ? 'Submitting…' : 'Confirm Submission'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
