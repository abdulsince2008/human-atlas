import type {
  ExamAttemptSummary,
  PracticalLabStorageState,
  PracticalQuestion,
  QuestionSubmission,
  WeakConceptStats,
} from './types';

const STORAGE_KEY = 'a360.practicalLab.progress.v1';
const MAX_ATTEMPTS = 25;

function emptyState(): PracticalLabStorageState {
  return {
    version: 1,
    attempts: [],
    weakStructures: {},
  };
}

export function loadPracticalLabStorage(): PracticalLabStorageState {
  if (typeof window === 'undefined') return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<PracticalLabStorageState> | null;
    if (!parsed || parsed.version !== 1) return emptyState();

    const attempts = Array.isArray(parsed.attempts)
      ? parsed.attempts.filter(
          (a): a is ExamAttemptSummary =>
            Boolean(a && typeof a.id === 'string' && typeof a.score === 'number'),
        )
      : [];

    const weakStructures: Record<string, WeakConceptStats> = {};
    if (parsed.weakStructures && typeof parsed.weakStructures === 'object') {
      for (const [key, val] of Object.entries(parsed.weakStructures)) {
        if (
          val &&
          typeof val.conceptId === 'string' &&
          typeof val.name === 'string' &&
          typeof val.missCount === 'number'
        ) {
          weakStructures[key] = val;
        }
      }
    }

    return {
      version: 1,
      attempts: attempts.slice(0, MAX_ATTEMPTS),
      weakStructures,
    };
  } catch {
    return emptyState();
  }
}

export function savePracticalLabStorage(state: PracticalLabStorageState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota / private browsing errors gracefully
  }
}

export function recordCompletedPracticalExam(
  prev: PracticalLabStorageState,
  summary: ExamAttemptSummary,
  questions: PracticalQuestion[],
  submissions: Record<string, QuestionSubmission>,
): PracticalLabStorageState {
  const nextWeak: Record<string, WeakConceptStats> = { ...prev.weakStructures };
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
      const nextCorrectStreak = existing.correctCount + 1;
      if (nextCorrectStreak >= 2) {
        // Student mastered this previously weak structure twice in a row
        delete nextWeak[q.targetConceptId];
      } else {
        nextWeak[q.targetConceptId] = {
          ...existing,
          correctCount: nextCorrectStreak,
          lastPracticedAt: now,
        };
      }
    }
  }

  const nextState: PracticalLabStorageState = {
    version: 1,
    attempts: [summary, ...prev.attempts].slice(0, MAX_ATTEMPTS),
    weakStructures: nextWeak,
  };

  savePracticalLabStorage(nextState);
  return nextState;
}

export function clearPracticalLabStorage(): PracticalLabStorageState {
  const fresh = emptyState();
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
  return fresh;
}
