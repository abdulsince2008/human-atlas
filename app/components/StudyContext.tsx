import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { ExamAttemptSummary, PracticalQuestion, QuestionSubmission, WeakConceptStats } from '../practical-lab/types';
import { type ReviewRating } from '../spaced-repetition';
import {
  applyFlashcardReviewToState,
  buildRevisionQueue,
  createBrowserStudyAdapter,
  createEmptyStudyState,
  toggleBookmarkInState,
  validateAndSanitizeStudyState,
  type BookmarkItem,
  type LocalStudentProfile,
  type RevisionQueueEntry,
  type StudyStateV1,
} from '../study-store';
import type { CustomSyllabusProfile } from '../syllabus/syllabus-types';
import { writePersistedAnatomySex, type AnatomySex } from '../female-atlas';

export interface StudyContextValue {
  ready: boolean;
  backendName: 'indexeddb' | 'localstorage' | 'memory';
  state: StudyStateV1;
  revisionQueue: RevisionQueueEntry[];
  isBookmarked: (kind: BookmarkItem['kind'], targetId: string) => boolean;
  toggleBookmark: (item: Omit<BookmarkItem, 'id' | 'createdAt'>) => void;
  rateFlashcard: (cardId: string, conceptId: string, structureName: string, rating: ReviewRating) => void;
  setTopicCompleted: (topicId: string, completed: boolean, topicTitle?: string) => void;
  recordQuizResult: (questionId: string, isCorrect: boolean, label?: string) => void;
  recordPracticalExam: (
    summary: ExamAttemptSummary,
    questions: PracticalQuestion[],
    submissions: Record<string, QuestionSubmission>,
  ) => void;
  updateProfile: (patch: Partial<LocalStudentProfile>) => void;
  dismissOnboarding: (dismissed?: boolean) => void;
  addRecentSearch: (query: string) => void;
  exportStudyJson: () => string;
  importStudyJson: (rawText: string) => Promise<{ ok: boolean; error?: string }>;
  resetAllStudyProgress: () => Promise<void>;
  saveCustomSyllabus: (syllabus: CustomSyllabusProfile) => void;
  deleteCustomSyllabus: (syllabusId: string) => void;
  saveEducatorSequence: (key: string, topicIds: string[]) => void;
  setPreferredSex: (sex: AnatomySex) => void;
  replaceStateFromCloudMerge: (merged: StudyStateV1) => void;
}

const StudyContext = createContext<StudyContextValue | null>(null);

export function StudyProvider({ children }: { children: ReactNode }) {
  const adapterRef = useRef(createBrowserStudyAdapter());
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<StudyStateV1>(() => createEmptyStudyState());

  useEffect(() => {
    let active = true;
    adapterRef.current.load().then((loaded) => {
      if (!active) return;
      setState(loaded);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const commit = useCallback((updater: (prev: StudyStateV1) => StudyStateV1) => {
    setState((prev) => {
      const next = updater(prev);
      void adapterRef.current.save(next);
      return next;
    });
  }, []);

  const isBookmarked = useCallback(
    (kind: BookmarkItem['kind'], targetId: string) => Boolean(state.bookmarks[`${kind}:${targetId}`]),
    [state.bookmarks],
  );

  const toggleBookmark = useCallback(
    (item: Omit<BookmarkItem, 'id' | 'createdAt'>) => {
      commit((prev) => toggleBookmarkInState(prev, item));
    },
    [commit],
  );

  const rateFlashcard = useCallback(
    (cardId: string, conceptId: string, structureName: string, rating: ReviewRating) => {
      commit((prev) => applyFlashcardReviewToState(prev, cardId, conceptId, structureName, rating));
    },
    [commit],
  );

  const setTopicCompleted = useCallback(
    (topicId: string, completed: boolean, topicTitle?: string) => {
      commit((prev) => {
        const exists = prev.completedTopicIds.includes(topicId);
        const nextTopics = completed
          ? exists
            ? prev.completedTopicIds
            : [...prev.completedTopicIds, topicId]
          : prev.completedTopicIds.filter((id) => id !== topicId);

        const nextLog =
          completed && !exists
            ? [
                {
                  id: `act-topic-${Date.now()}-${topicId}`,
                  at: Date.now(),
                  kind: 'learn' as const,
                  label: `Completed lesson topic${topicTitle ? `: ${topicTitle}` : ''}`,
                },
                ...prev.activityLog,
              ].slice(0, 40)
            : prev.activityLog;

        return {
          ...prev,
          completedTopicIds: nextTopics,
          activityLog: nextLog,
        };
      });
    },
    [commit],
  );

  const recordQuizResult = useCallback(
    (questionId: string, isCorrect: boolean, label?: string) => {
      commit((prev) => {
        const answeredIds = prev.quizProgress.answeredIds.includes(questionId)
          ? prev.quizProgress.answeredIds
          : [...prev.quizProgress.answeredIds, questionId];
        const correctIds = isCorrect
          ? prev.quizProgress.correctIds.includes(questionId)
            ? prev.quizProgress.correctIds
            : [...prev.quizProgress.correctIds, questionId]
          : prev.quizProgress.correctIds.filter((id) => id !== questionId);

        return {
          ...prev,
          quizProgress: { answeredIds, correctIds },
          activityLog: [
            {
              id: `act-quiz-${Date.now()}-${questionId}`,
              at: Date.now(),
              kind: 'quiz' as const,
              label: `Quiz question: ${label ?? questionId}`,
              detail: isCorrect ? 'Correct' : 'Missed',
            },
            ...prev.activityLog,
          ].slice(0, 40),
        };
      });
    },
    [commit],
  );

  const recordPracticalExam = useCallback(
    (
      summary: ExamAttemptSummary,
      questions: PracticalQuestion[],
      submissions: Record<string, QuestionSubmission>,
    ) => {
      commit((prev) => {
        const nextWeak: Record<string, WeakConceptStats> = { ...prev.weakConcepts };
        const now = summary.completedAt;
        for (const q of questions) {
          const sub = submissions[q.id];
          if (!sub || sub.status !== 'submitted') continue;
          const existing = nextWeak[q.targetConceptId];
          if (!sub.isCorrect) {
            nextWeak[q.targetConceptId] = {
              conceptId: q.targetConceptId,
              name: q.targetName,
              canonicalSystem: q.canonicalSystem,
              missCount: (existing?.missCount ?? 0) + 1,
              correctCount: 0,
              lastMissedAt: now,
              lastPracticedAt: now,
            };
          } else if (existing) {
            const nextStreak = existing.correctCount + 1;
            if (nextStreak >= 2) {
              delete nextWeak[q.targetConceptId];
            } else {
              nextWeak[q.targetConceptId] = {
                ...existing,
                correctCount: nextStreak,
                lastPracticedAt: now,
              };
            }
          }
        }

        const dedupedAttempts = [
          summary,
          ...prev.practicalAttempts.filter((a) => a.id !== summary.id),
        ].slice(0, 50);

        return {
          ...prev,
          practicalAttempts: dedupedAttempts,
          weakConcepts: nextWeak,
          activityLog: [
            {
              id: `act-lab-${now}-${summary.id}`,
              at: now,
              kind: 'practical' as const,
              label: `Practical Lab (${summary.mode})`,
              detail: `${summary.score}/${summary.totalQuestions} (${summary.accuracyPct}%)`,
            },
            ...prev.activityLog,
          ].slice(0, 40),
        };
      });
    },
    [commit],
  );

  const updateProfile = useCallback(
    (patch: Partial<LocalStudentProfile>) => {
      commit((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          ...patch,
          updatedAt: Date.now(),
        },
      }));
    },
    [commit],
  );

  const dismissOnboarding = useCallback(
    (dismissed = true) => {
      commit((prev) => ({ ...prev, onboardingDismissed: dismissed }));
    },
    [commit],
  );

  const addRecentSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (trimmed.length < 2) return;
      commit((prev) => ({
        ...prev,
        recentSearches: [
          trimmed,
          ...prev.recentSearches.filter((x) => x.toLowerCase() !== trimmed.toLowerCase()),
        ].slice(0, 10),
      }));
    },
    [commit],
  );

  const exportStudyJson = useCallback(() => JSON.stringify(state, null, 2), [state]);

  const importStudyJson = useCallback(async (rawText: string) => {
    try {
      const parsed = JSON.parse(rawText);
      const check = validateAndSanitizeStudyState(parsed);
      if (!check.ok || !check.state) {
        return { ok: false, error: check.error ?? 'Invalid study backup format.' };
      }
      const next: StudyStateV1 = { ...check.state, migratedLegacy: true, updatedAt: Date.now() };
      setState(next);
      await adapterRef.current.save(next);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Could not parse JSON file. Check file syntax and try again.' };
    }
  }, []);

  const resetAllStudyProgress = useCallback(async () => {
    const fresh = await adapterRef.current.reset();
    setState(fresh);
  }, []);

  const saveCustomSyllabus = useCallback(
    (syllabus: CustomSyllabusProfile) => {
      commit((prev) => {
        const existingIdx = prev.customSyllabi.findIndex((s) => s.id === syllabus.id);
        const nextList =
          existingIdx >= 0
            ? prev.customSyllabi.map((s) => (s.id === syllabus.id ? syllabus : s))
            : [syllabus, ...prev.customSyllabi].slice(0, 25);
        return {
          ...prev,
          customSyllabi: nextList,
        };
      });
    },
    [commit],
  );

  const deleteCustomSyllabus = useCallback(
    (syllabusId: string) => {
      commit((prev) => ({
        ...prev,
        customSyllabi: prev.customSyllabi.filter((s) => s.id !== syllabusId),
      }));
    },
    [commit],
  );

  const saveEducatorSequence = useCallback(
    (key: string, topicIds: string[]) => {
      commit((prev) => ({
        ...prev,
        educatorSequences: {
          ...prev.educatorSequences,
          [key]: topicIds,
        },
      }));
    },
    [commit],
  );

  const setPreferredSex = useCallback(
    (sex: AnatomySex) => {
      writePersistedAnatomySex(sex);
      commit((prev) =>
        prev.preferredSex === sex
          ? prev
          : {
              ...prev,
              preferredSex: sex,
            },
      );
    },
    [commit],
  );

  const replaceStateFromCloudMerge = useCallback((merged: StudyStateV1) => {
    writePersistedAnatomySex(merged.preferredSex);
    setState(merged);
    void adapterRef.current.save(merged);
  }, []);

  const revisionQueue = useMemo(() => buildRevisionQueue(state), [state]);

  const value = useMemo<StudyContextValue>(
    () => ({
      ready,
      backendName: adapterRef.current.backendName,
      state,
      revisionQueue,
      isBookmarked,
      toggleBookmark,
      rateFlashcard,
      setTopicCompleted,
      recordQuizResult,
      recordPracticalExam,
      updateProfile,
      dismissOnboarding,
      addRecentSearch,
      exportStudyJson,
      importStudyJson,
      resetAllStudyProgress,
      saveCustomSyllabus,
      deleteCustomSyllabus,
      saveEducatorSequence,
      setPreferredSex,
      replaceStateFromCloudMerge,
    }),
    [
      ready,
      state,
      revisionQueue,
      isBookmarked,
      toggleBookmark,
      rateFlashcard,
      setTopicCompleted,
      recordQuizResult,
      recordPracticalExam,
      updateProfile,
      dismissOnboarding,
      addRecentSearch,
      exportStudyJson,
      importStudyJson,
      resetAllStudyProgress,
      saveCustomSyllabus,
      deleteCustomSyllabus,
      saveEducatorSequence,
      setPreferredSex,
      replaceStateFromCloudMerge,
    ],
  );

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy(): StudyContextValue {
  const ctx = useContext(StudyContext);
  if (!ctx) {
    throw new Error('useStudy() must be called inside <StudyProvider>');
  }
  return ctx;
}
