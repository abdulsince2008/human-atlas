import { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  BarChart3,
  Check,
  Copy,
  LogIn,
  LogOut,
  Plus,
  Send,
  Users,
} from 'lucide-react';
import {
  BLUEPRINT_LIMITS,
  computeClassroomAnalytics,
  VALID_STUDY_TRACKS,
  type AssignmentKind,
  type AssignmentSubmissionRecord,
  type ClassroomAssignmentItem,
  type ClassroomMemberRecord,
  type ClassroomRecord,
} from '../cloud/classroom-logic';
import {
  archiveClassroom,
  createClassroomAssignment,
  createClassroomWithCode,
  reviewClassroomSubmission,
  subscribeClassroomDetailsForTeacher,
  subscribeTeacherClassrooms,
} from '../cloud/classroom-service';
import { EDUCATION_DOMAINS } from '../education/education-domains';
import type { StudyTrack } from '../study-store';
import { useFirebase } from './FirebaseContext';
import { useStudy } from './StudyContext';

const ASSIGNMENT_KINDS: { value: AssignmentKind; label: string }[] = [
  { value: 'chapter', label: 'Chapter Study' },
  { value: 'practical_lab', label: '3D Practical Lab' },
  { value: 'quiz', label: 'MCQ Quiz' },
  { value: 'flashcards', label: 'Spaced Repetition' },
];

export default function TeacherClassroomPanel() {
  const { authReady, user, isVerifiedUser, authBusy, authError, signInWithGoogle, signOutAccount } =
    useFirebase();
  const { state } = useStudy();

  const [classrooms, setClassrooms] = useState<ClassroomRecord[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('');
  const [members, setMembers] = useState<ClassroomMemberRecord[]>([]);
  const [assignments, setAssignments] = useState<ClassroomAssignmentItem[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmissionRecord[]>([]);

  const [newClassTitle, setNewClassTitle] = useState('');
  const [newClassTrack, setNewClassTrack] = useState<StudyTrack>('MBBS / Medical');
  const [creatingClass, setCreatingClass] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [asgTitle, setAsgTitle] = useState('');
  const [asgDesc, setAsgDesc] = useState('');
  const [asgKind, setAsgKind] = useState<AssignmentKind>('chapter');
  const [asgDomainId, setAsgDomainId] = useState<string>('human_anatomy');
  const [asgDueLabel, setAsgDueLabel] = useState('End of Week');
  const [creatingAsg, setCreatingAsg] = useState(false);

  const [reviewingSubmissionId, setReviewingSubmissionId] = useState<string | null>(null);
  const [feedbackDraft, setFeedbackDraft] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);

  useEffect(() => {
    if (!authReady || !isVerifiedUser || !user) {
      setClassrooms([]);
      return;
    }
    const unsub = subscribeTeacherClassrooms(user.uid, (rows) => {
      setClassrooms(rows);
    });
    return () => unsub();
  }, [authReady, isVerifiedUser, user]);

  const activeClassroom = useMemo(
    () => classrooms.find((c) => c.classroomId === selectedClassroomId) ?? classrooms[0] ?? null,
    [classrooms, selectedClassroomId],
  );

  useEffect(() => {
    if (activeClassroom && activeClassroom.classroomId !== selectedClassroomId) {
      setSelectedClassroomId(activeClassroom.classroomId);
    }
  }, [activeClassroom, selectedClassroomId]);

  useEffect(() => {
    if (!isVerifiedUser || !user || !activeClassroom) {
      setMembers([]);
      setAssignments([]);
      setSubmissions([]);
      return;
    }
    const unsub = subscribeClassroomDetailsForTeacher(activeClassroom.classroomId, user.uid, {
      onMembers: setMembers,
      onAssignments: setAssignments,
      onSubmissions: setSubmissions,
    });
    return () => unsub();
  }, [isVerifiedUser, user, activeClassroom]);

  const analytics = useMemo(
    () => computeClassroomAnalytics(members, assignments, submissions),
    [members, assignments, submissions],
  );

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isVerifiedUser || newClassTitle.trim().length < 2) return;
    setCreatingClass(true);
    try {
      const created = await createClassroomWithCode({
        teacherUid: user.uid,
        teacherName: user.displayName || state.profile.displayName || 'Educator',
        title: newClassTitle,
        track: newClassTrack,
      });
      setNewClassTitle('');
      setSelectedClassroomId(created.classroomId);
    } finally {
      setCreatingClass(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      }
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isVerifiedUser || !activeClassroom || asgTitle.trim().length < 2) return;
    setCreatingAsg(true);
    try {
      await createClassroomAssignment({
        classroomId: activeClassroom.classroomId,
        teacherUid: user.uid,
        title: asgTitle,
        description: asgDesc,
        kind: asgKind,
        targetDomainId: asgDomainId,
        targetTopicId: '',
        dueLabel: asgDueLabel,
        existingAssignments: assignments,
      });
      setAsgTitle('');
      setAsgDesc('');
    } finally {
      setCreatingAsg(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent, sub: AssignmentSubmissionRecord) => {
    e.preventDefault();
    if (!activeClassroom) return;
    setReviewBusy(true);
    try {
      await reviewClassroomSubmission({
        classroomId: activeClassroom.classroomId,
        submissionId: sub.submissionId,
        teacherFeedback: feedbackDraft || 'Reviewed and recorded.',
      });
      setReviewingSubmissionId(null);
      setFeedbackDraft('');
    } finally {
      setReviewBusy(false);
    }
  };

  return (
    <section
      className="mb-6 rounded-xl border border-slate-200 bg-white p-6"
      aria-label="Educator Cloud Classrooms, Assignments and Analytics"
      data-testid="teacher-classroom-panel"
    >
      <div
        className={`flex flex-wrap items-center justify-between gap-4 ${
          isVerifiedUser ? 'border-b border-slate-100 pb-4' : ''
        }`}
      >
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800">
            <Users size={14} />
            <span>Educator Cloud Classrooms, Assignments &amp; Class Analytics</span>
          </p>
          <h2 className="mt-1 text-base font-bold text-slate-900">
            {isVerifiedUser
              ? `Signed in as ${user?.displayName || 'Educator'} · ${classrooms.length} Classroom(s)`
              : 'Manage Student Cohorts, Publish Assignments & Track Class Performance'}
          </h2>
          {!isVerifiedUser && (
            <p className="mt-0.5 text-xs text-slate-600">
              Sign in with Google to generate shareable classroom join codes, assign modules/quizzes/labs, and review student submissions.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!authReady ? (
            <span className="text-xs text-slate-500">Checking account…</span>
          ) : isVerifiedUser ? (
            <button
              type="button"
              onClick={() => void signOutAccount()}
              disabled={authBusy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              disabled={authBusy}
              data-testid="teacher-google-signin"
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
        <div className="mt-4 space-y-5">
          {/* Create Classroom + Classroom Switcher */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <form
              onSubmit={handleCreateClassroom}
              className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-4"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Create New Classroom
              </h3>
              <label className="block text-xs font-medium text-slate-700">
                <span className="mb-1 block">Cohort / Section Title</span>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={BLUEPRINT_LIMITS.classroomTitleMaxLength}
                  value={newClassTitle}
                  placeholder="e.g., Year 1 MBBS Thorax & Abdomen"
                  onChange={(e) => setNewClassTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                />
              </label>
              <label className="block text-xs font-medium text-slate-700">
                <span className="mb-1 block">Curriculum Track</span>
                <select
                  value={newClassTrack}
                  onChange={(e) => setNewClassTrack(e.target.value as StudyTrack)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                >
                  {VALID_STUDY_TRACKS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                disabled={creatingClass || newClassTitle.trim().length < 2}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-teal-800 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-900 disabled:opacity-50"
              >
                <Plus size={14} />
                <span>{creatingClass ? 'Creating…' : 'Create Classroom & Code'}</span>
              </button>
            </form>

            {/* Active Classroom Summary & Analytics */}
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
              {classrooms.length === 0 ? (
                <p className="py-6 text-xs text-slate-500">
                  No classrooms created yet. Use the form on the left to generate your first join code.
                </p>
              ) : activeClassroom ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <label htmlFor="teacher-active-classroom" className="sr-only">
                        Select Classroom
                      </label>
                      <select
                        id="teacher-active-classroom"
                        value={activeClassroom.classroomId}
                        onChange={(e) => setSelectedClassroomId(e.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-900"
                      >
                        {classrooms.map((c) => (
                          <option key={c.classroomId} value={c.classroomId}>
                            {c.title} ({c.status})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => void handleCopyCode(activeClassroom.joinCode)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1.5 font-mono text-xs font-bold text-teal-900 hover:bg-teal-100"
                      >
                        <span>Code: {activeClassroom.joinCode}</span>
                        {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>

                    {activeClassroom.status === 'active' && (
                      <button
                        type="button"
                        onClick={() => void archiveClassroom(activeClassroom)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-700"
                      >
                        <Archive size={12} />
                        <span>Archive</span>
                      </button>
                    )}
                  </div>

                  {/* Real Class Performance Analytics */}
                  <div>
                    <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                      <BarChart3 size={13} className="text-teal-700" />
                      <span>Real Class Performance Analytics</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                      <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
                        <strong className="block text-base font-bold text-slate-900 tabular-nums">
                          {analytics.enrolledCount}
                        </strong>
                        <span className="text-[11px] text-slate-600">
                          Enrolled ({analytics.activeMembersCount} active)
                        </span>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
                        <strong className="block text-base font-bold text-slate-900 tabular-nums">
                          {analytics.avgCompletedTopics}
                        </strong>
                        <span className="text-[11px] text-slate-600">Avg Topics Completed</span>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
                        <strong className="block text-base font-bold text-slate-900 tabular-nums">
                          {analytics.avgPracticalAccuracy !== null ? `${analytics.avgPracticalAccuracy}%` : '—'}
                        </strong>
                        <span className="text-[11px] text-slate-600">Avg Practical Lab</span>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
                        <strong className="block text-base font-bold text-slate-900 tabular-nums">
                          {analytics.submissionCompletionRatePct !== null
                            ? `${analytics.submissionCompletionRatePct}%`
                            : '—'}
                        </strong>
                        <span className="text-[11px] text-slate-600">
                          Submission Rate
                          {analytics.avgSubmissionScorePct !== null
                            ? ` (${analytics.avgSubmissionScorePct}% avg)`
                            : ''}
                        </span>
                      </div>
                    </div>

                    {analytics.topWeakConcepts.length > 0 && (
                      <p className="mt-2.5 text-xs text-slate-700">
                        <strong>Most Missed Structures in Cohort:</strong>{' '}
                        {analytics.topWeakConcepts
                          .map((w) => `${w.name} (${w.studentCount})`)
                          .join(' · ')}
                      </p>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {/* Publish Assignment + Roster + Submissions */}
          {activeClassroom && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Publish Assignment */}
              <form
                onSubmit={handleCreateAssignment}
                className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-4"
              >
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Publish Assignment
                </h3>
                <label className="block text-xs font-medium text-slate-700">
                  <span className="mb-1 block">Task Title</span>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={BLUEPRINT_LIMITS.assignmentTitleMaxLength}
                    value={asgTitle}
                    placeholder="e.g., Brachial Plexus & Thoracotomy Lab"
                    onChange={(e) => setAsgTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs font-medium text-slate-700">
                    <span className="mb-1 block">Activity Type</span>
                    <select
                      value={asgKind}
                      onChange={(e) => setAsgKind(e.target.value as AssignmentKind)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                    >
                      {ASSIGNMENT_KINDS.map((k) => (
                        <option key={k.value} value={k.value}>
                          {k.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-medium text-slate-700">
                    <span className="mb-1 block">Due Window</span>
                    <input
                      type="text"
                      maxLength={BLUEPRINT_LIMITS.dueLabelMaxLength}
                      value={asgDueLabel}
                      onChange={(e) => setAsgDueLabel(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </label>
                </div>
                <label className="block text-xs font-medium text-slate-700">
                  <span className="mb-1 block">Biomedical Domain</span>
                  <select
                    value={asgDomainId}
                    onChange={(e) => setAsgDomainId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                  >
                    {EDUCATION_DOMAINS.map((d) => (
                      <option key={d.id} value={d.id}>
                        Domain {d.code}: {d.shortTitle}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-medium text-slate-700">
                  <span className="mb-1 block">Instructions (optional)</span>
                  <textarea
                    rows={2}
                    maxLength={BLUEPRINT_LIMITS.assignmentDescMaxLength}
                    value={asgDesc}
                    placeholder="Identify key structures and submit your score."
                    onChange={(e) => setAsgDesc(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                  />
                </label>
                <button
                  type="submit"
                  disabled={creatingAsg || activeClassroom.status !== 'active' || asgTitle.trim().length < 2}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-teal-800 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-900 disabled:opacity-50"
                >
                  <Send size={13} />
                  <span>{creatingAsg ? 'Publishing…' : 'Assign to Class'}</span>
                </button>
              </form>

              {/* Student Roster & Submissions */}
              <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Student Roster &amp; Progress ({members.length})
                  </h3>
                  {members.length === 0 ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Share join code <strong className="font-mono">{activeClassroom.joinCode}</strong> with students so they can enroll from their Study Dashboard.
                    </p>
                  ) : (
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="py-1.5 pr-3">Student</th>
                            <th className="py-1.5 pr-3">Track</th>
                            <th className="py-1.5 pr-3">Topics</th>
                            <th className="py-1.5 pr-3">Practical Lab</th>
                            <th className="py-1.5">Weak Areas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {members.map((m) => (
                            <tr key={m.studentUid}>
                              <td className="py-2 pr-3 font-semibold text-slate-900">{m.studentName}</td>
                              <td className="py-2 pr-3 text-slate-600">{m.track}</td>
                              <td className="py-2 pr-3 tabular-nums">{m.completedTopicsCount}</td>
                              <td className="py-2 pr-3 tabular-nums">
                                {m.practicalAttemptsCount > 0
                                  ? `${m.practicalAvgAccuracy}% (${m.practicalAttemptsCount})`
                                  : '—'}
                              </td>
                              <td className="py-2 text-slate-600">
                                {m.weakConceptNames.slice(0, 3).join(', ') || 'None recorded'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Student Submissions ({submissions.length})
                  </h3>
                  {submissions.length === 0 ? (
                    <p className="mt-2 text-xs text-slate-500">
                      No assignment submissions recorded yet.
                    </p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {submissions.map((sub) => {
                        const asg = assignments.find((a) => a.assignmentId === sub.assignmentId);
                        return (
                          <div
                            key={sub.submissionId}
                            className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <strong className="text-slate-900">{sub.studentName}</strong>{' '}
                                <span className="text-slate-600">
                                  · {asg?.title ?? sub.assignmentId} · Score: <strong>{sub.scorePct}%</strong> ({sub.status})
                                </span>
                                {sub.notes && <p className="mt-1 text-slate-600">Student note: {sub.notes}</p>}
                                {sub.teacherFeedback && (
                                  <p className="mt-1 text-teal-900">
                                    <strong>Feedback:</strong> {sub.teacherFeedback}
                                  </p>
                                )}
                              </div>
                              {sub.status === 'submitted' && reviewingSubmissionId !== sub.submissionId && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReviewingSubmissionId(sub.submissionId);
                                    setFeedbackDraft('');
                                  }}
                                  className="rounded-lg border border-teal-800 bg-white px-2.5 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-50"
                                >
                                  Review &amp; Feedback
                                </button>
                              )}
                            </div>

                            {reviewingSubmissionId === sub.submissionId && (
                              <form
                                onSubmit={(e) => void handleReviewSubmit(e, sub)}
                                className="mt-2 flex flex-wrap gap-2"
                              >
                                <input
                                  type="text"
                                  maxLength={BLUEPRINT_LIMITS.feedbackMaxLength}
                                  value={feedbackDraft}
                                  placeholder="Write instructor feedback..."
                                  onChange={(e) => setFeedbackDraft(e.target.value)}
                                  className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900"
                                />
                                <button
                                  type="submit"
                                  disabled={reviewBusy}
                                  className="rounded-lg bg-teal-800 px-3 py-1 text-xs font-semibold text-white hover:bg-teal-900"
                                >
                                  {reviewBusy ? 'Saving…' : 'Mark Reviewed'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setReviewingSubmissionId(null)}
                                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-600"
                                >
                                  Cancel
                                </button>
                              </form>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
