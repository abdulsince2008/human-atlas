import type { CanonicalSystemId } from './anatomy-systems';
import type { EducationTrackId } from './education/education-types';
import { ANATOMY_LESSONS } from './learning-data';
import { loadPracticalLabStorage } from './practical-lab/storage';
import type { ExamAttemptSummary, WeakConceptStats } from './practical-lab/types';
import {
  ANATOMY_FLASHCARDS,
  computeNextReview,
  isCardDue,
  type FlashcardReviewState,
  type ReviewRating,
} from './spaced-repetition';
import type { StudyContextInput } from './study-context-engine';
import type { CustomSyllabusProfile } from './syllabus/syllabus-types';
import {
  readPersistedAnatomySex,
  writePersistedAnatomySex,
  PREFERRED_SEX_STORAGE_KEY,
  type AnatomySex,
} from './female-atlas';

export const STUDY_SCHEMA_VERSION = 1;
const IDB_DB_NAME = 'Anatomy360StudyDB';
const IDB_STORE_NAME = 'studyState';
const IDB_RECORD_KEY = 'primaryProfileV1';
const FALLBACK_STORAGE_KEY = 'a360.studyStore.fallback.v1';

// Legacy localStorage keys preserved & migrated seamlessly
export const LEGACY_KEYS = {
  learnTopics: 'a360.learn.completedTopics.v1',
  practicalLab: 'a360.practicalLab.progress.v1',
  quizProgress: 'anatomy360_quiz_progress_v1',
} as const;

export type StudyTrack = 'FSc Pre-Medical' | 'MDCAT' | 'MBBS / Medical' | 'Nursing / Allied Health' | 'General Biology';

export type BookmarkKind = 'structure' | 'lesson' | 'topic' | 'quiz' | 'question' | 'term';

export interface BookmarkItem {
  id: string; // `${kind}:${targetId}`
  kind: BookmarkKind;
  targetId: string;
  title: string;
  subtitle?: string;
  canonicalSystem?: CanonicalSystemId;
  createdAt: number;
}

export interface StudyActivityEntry {
  id: string;
  at: number;
  kind: 'learn' | 'practical' | 'quiz' | 'flashcard' | 'bookmark' | 'physiology';
  label: string;
  detail?: string;
}

export type AudienceRole = 'unset' | 'learning' | 'teaching' | 'exploring';
export type ExperienceDepth = 'guided' | 'full';

export interface LocalStudentProfile {
  displayName: string;
  track: StudyTrack;
  dailyFlashcardGoal: number;
  updatedAt: number;
}

export interface StudyStateV1 {
  schemaVersion: 1;
  updatedAt: number;
  migratedLegacy: boolean;
  onboardingDismissed: boolean;
  onboardingCompleted: boolean;
  trackSelected: boolean;
  audienceRole: AudienceRole;
  educationTrackId: EducationTrackId | null;
  experienceDepth: ExperienceDepth;
  preferredSex: AnatomySex;
  profile: LocalStudentProfile;
  completedTopicIds: string[];
  quizProgress: {
    answeredIds: string[];
    correctIds: string[];
  };
  practicalAttempts: ExamAttemptSummary[];
  weakConcepts: Record<string, WeakConceptStats>;
  flashcardReviews: Record<string, FlashcardReviewState>;
  bookmarks: Record<string, BookmarkItem>;
  recentSearches: string[];
  activityLog: StudyActivityEntry[];
  customSyllabi: CustomSyllabusProfile[];
  educatorSequences: Record<string, string[]>;
  lastStudyContext: StudyContextInput | null;
  lastRoute: string | null;
}

export function createEmptyStudyState(): StudyStateV1 {
  return {
    schemaVersion: STUDY_SCHEMA_VERSION,
    updatedAt: Date.now(),
    migratedLegacy: false,
    onboardingDismissed: false,
    onboardingCompleted: false,
    trackSelected: false,
    audienceRole: 'unset',
    educationTrackId: null,
    experienceDepth: 'guided',
    preferredSex: readPersistedAnatomySex(),
    profile: {
      displayName: 'Explorer',
      track: 'General Biology',
      dailyFlashcardGoal: 15,
      updatedAt: Date.now(),
    },
    completedTopicIds: [],
    quizProgress: { answeredIds: [], correctIds: [] },
    practicalAttempts: [],
    weakConcepts: {},
    flashcardReviews: {},
    bookmarks: {},
    recentSearches: [],
    activityLog: [],
    customSyllabi: [],
    educatorSequences: {},
    lastStudyContext: null,
    lastRoute: null,
  };
}

function safeReadLegacyState(): Partial<StudyStateV1> {
  if (typeof window === 'undefined') return {};
  const result: Partial<StudyStateV1> = {};
  try {
    const rawTopics = window.localStorage.getItem(LEGACY_KEYS.learnTopics);
    if (rawTopics) {
      const parsed = JSON.parse(rawTopics);
      if (Array.isArray(parsed)) {
        result.completedTopicIds = parsed.filter((x): x is string => typeof x === 'string');
      }
    }
  } catch {
    // Ignore malformed legacy learn storage
  }

  try {
    const rawQuiz = window.localStorage.getItem(LEGACY_KEYS.quizProgress);
    if (rawQuiz) {
      const parsed = JSON.parse(rawQuiz) as { answeredIds?: unknown; correctIds?: unknown };
      result.quizProgress = {
        answeredIds: Array.isArray(parsed?.answeredIds)
          ? parsed.answeredIds.filter((x): x is string => typeof x === 'string')
          : [],
        correctIds: Array.isArray(parsed?.correctIds)
          ? parsed.correctIds.filter((x): x is string => typeof x === 'string')
          : [],
      };
    }
  } catch {
    // Ignore malformed legacy quiz storage
  }

  try {
    const lab = loadPracticalLabStorage();
    if (lab.attempts.length > 0 || Object.keys(lab.weakStructures).length > 0) {
      result.practicalAttempts = lab.attempts;
      result.weakConcepts = lab.weakStructures;
    }
  } catch {
    // Ignore malformed practical lab storage
  }

  return result;
}

export function validateAndSanitizeStudyState(raw: unknown): {
  ok: boolean;
  state?: StudyStateV1;
  error?: string;
} {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Study backup must be a JSON object.' };
  }
  const obj = raw as Record<string, unknown>;
  if (obj.schemaVersion !== 1) {
    return { ok: false, error: `Unsupported study backup schemaVersion (${String(obj.schemaVersion)}). Expected 1.` };
  }

  const base = createEmptyStudyState();

  const profileObj = obj.profile && typeof obj.profile === 'object' ? (obj.profile as Record<string, unknown>) : {};
  const validTracks: StudyTrack[] = [
    'FSc Pre-Medical',
    'MDCAT',
    'MBBS / Medical',
    'Nursing / Allied Health',
    'General Biology',
  ];
  const isLegacyPayload = obj.audienceRole === undefined && obj.trackSelected === undefined;
  const hasExplicitValidTrack = validTracks.includes(profileObj.track as StudyTrack);
  const track: StudyTrack = hasExplicitValidTrack
    ? (profileObj.track as StudyTrack)
    : isLegacyPayload && profileObj.track !== undefined
      ? 'MBBS / Medical'
      : base.profile.track;

  const completedTopicIds = Array.isArray(obj.completedTopicIds)
    ? Array.from(new Set(obj.completedTopicIds.filter((x): x is string => typeof x === 'string')))
    : [];

  const quizObj = obj.quizProgress && typeof obj.quizProgress === 'object'
    ? (obj.quizProgress as Record<string, unknown>)
    : {};
  const answeredIds = Array.isArray(quizObj.answeredIds)
    ? quizObj.answeredIds.filter((x): x is string => typeof x === 'string')
    : [];
  const correctIds = Array.isArray(quizObj.correctIds)
    ? quizObj.correctIds.filter((x): x is string => typeof x === 'string')
    : [];

  const practicalAttempts = Array.isArray(obj.practicalAttempts)
    ? obj.practicalAttempts.filter(
        (a): a is ExamAttemptSummary =>
          Boolean(a && typeof a === 'object' && typeof (a as ExamAttemptSummary).id === 'string' && typeof (a as ExamAttemptSummary).score === 'number'),
      )
    : [];

  const weakConcepts: Record<string, WeakConceptStats> = {};
  if (obj.weakConcepts && typeof obj.weakConcepts === 'object') {
    for (const [k, v] of Object.entries(obj.weakConcepts as Record<string, unknown>)) {
      if (v && typeof v === 'object' && typeof (v as WeakConceptStats).conceptId === 'string') {
        weakConcepts[k] = v as WeakConceptStats;
      }
    }
  }

  const flashcardReviews: Record<string, FlashcardReviewState> = {};
  if (obj.flashcardReviews && typeof obj.flashcardReviews === 'object') {
    for (const [k, v] of Object.entries(obj.flashcardReviews as Record<string, unknown>)) {
      if (
        v &&
        typeof v === 'object' &&
        typeof (v as FlashcardReviewState).cardId === 'string' &&
        typeof (v as FlashcardReviewState).dueAt === 'number'
      ) {
        flashcardReviews[k] = v as FlashcardReviewState;
      }
    }
  }

  const bookmarks: Record<string, BookmarkItem> = {};
  if (obj.bookmarks && typeof obj.bookmarks === 'object') {
    for (const [k, v] of Object.entries(obj.bookmarks as Record<string, unknown>)) {
      if (
        v &&
        typeof v === 'object' &&
        typeof (v as BookmarkItem).targetId === 'string' &&
        typeof (v as BookmarkItem).title === 'string'
      ) {
        bookmarks[k] = v as BookmarkItem;
      }
    }
  }

  const recentSearches = Array.isArray(obj.recentSearches)
    ? obj.recentSearches.filter((x): x is string => typeof x === 'string').slice(0, 12)
    : [];

  const activityLog = Array.isArray(obj.activityLog)
    ? (obj.activityLog as StudyActivityEntry[])
        .filter((a) => a && typeof a.id === 'string' && typeof a.at === 'number')
        .slice(0, 40)
    : [];

  const customSyllabi: CustomSyllabusProfile[] = Array.isArray(obj.customSyllabi)
    ? (obj.customSyllabi as CustomSyllabusProfile[])
        .filter(
          (s) =>
            Boolean(s) &&
            typeof s === 'object' &&
            typeof s.id === 'string' &&
            s.metadata &&
            typeof s.metadata === 'object' &&
            typeof s.metadata.courseName === 'string' &&
            Array.isArray(s.items),
        )
        .slice(0, 25)
    : [];

  const educatorSequences: Record<string, string[]> = {};
  if (obj.educatorSequences && typeof obj.educatorSequences === 'object') {
    for (const [k, v] of Object.entries(obj.educatorSequences as Record<string, unknown>)) {
      if (Array.isArray(v)) {
        educatorSequences[k] = v.filter((x): x is string => typeof x === 'string').slice(0, 80);
      }
    }
  }

  const validRoles: AudienceRole[] = ['unset', 'learning', 'teaching', 'exploring'];
  const audienceRole: AudienceRole = validRoles.includes(obj.audienceRole as AudienceRole)
    ? (obj.audienceRole as AudienceRole)
    : base.audienceRole;

  const validEduTracks: EducationTrackId[] = [
    'school_foundations',
    'secondary_premed',
    'medical_foundations',
    'clinical_applied',
    'allied_health',
    'graduate_research',
  ];
  const educationTrackId: EducationTrackId | null = validEduTracks.includes(
    obj.educationTrackId as EducationTrackId,
  )
    ? (obj.educationTrackId as EducationTrackId)
    : null;

  const hasSavedHistory =
    completedTopicIds.length > 0 ||
    answeredIds.length > 0 ||
    practicalAttempts.length > 0 ||
    Object.keys(flashcardReviews).length > 0 ||
    Object.keys(bookmarks).length > 0 ||
    customSyllabi.length > 0;

  const trackSelected =
    typeof obj.trackSelected === 'boolean'
      ? obj.trackSelected
      : hasExplicitValidTrack || hasSavedHistory;

  const onboardingCompleted =
    typeof obj.onboardingCompleted === 'boolean'
      ? obj.onboardingCompleted
      : Boolean(obj.onboardingDismissed) || hasSavedHistory;

  const experienceDepth: ExperienceDepth =
    obj.experienceDepth === 'full' || obj.experienceDepth === 'guided'
      ? obj.experienceDepth
      : isLegacyPayload && (track === 'MBBS / Medical' || track === 'Nursing / Allied Health')
        ? 'full'
        : 'guided';

  let lastStudyContext: StudyContextInput | null = null;
  if (obj.lastStudyContext && typeof obj.lastStudyContext === 'object') {
    const lsc = obj.lastStudyContext as Record<string, unknown>;
    lastStudyContext = {
      conceptId: typeof lsc.conceptId === 'string' ? lsc.conceptId : undefined,
      partId: typeof lsc.partId === 'string' ? lsc.partId : undefined,
      topicId: typeof lsc.topicId === 'string' ? lsc.topicId : undefined,
      domainId: typeof lsc.domainId === 'string' ? (lsc.domainId as StudyContextInput['domainId']) : undefined,
      systemId: typeof lsc.systemId === 'string' ? (lsc.systemId as CanonicalSystemId) : undefined,
      sourceModule: typeof lsc.sourceModule === 'string' ? (lsc.sourceModule as StudyContextInput['sourceModule']) : 'study',
    };
  }

  return {
    ok: true,
    state: {
      schemaVersion: 1,
      updatedAt: typeof obj.updatedAt === 'number' ? obj.updatedAt : Date.now(),
      migratedLegacy: Boolean(obj.migratedLegacy),
      onboardingDismissed: Boolean(obj.onboardingDismissed),
      onboardingCompleted,
      trackSelected,
      audienceRole,
      educationTrackId,
      experienceDepth,
      preferredSex: obj.preferredSex === 'female' ? 'female' : 'male',
      profile: {
        displayName:
          typeof profileObj.displayName === 'string' && profileObj.displayName.trim()
            ? profileObj.displayName.trim().slice(0, 60)
            : base.profile.displayName,
        track,
        dailyFlashcardGoal:
          typeof profileObj.dailyFlashcardGoal === 'number' &&
          profileObj.dailyFlashcardGoal >= 5 &&
          profileObj.dailyFlashcardGoal <= 100
            ? Math.round(profileObj.dailyFlashcardGoal)
            : base.profile.dailyFlashcardGoal,
        updatedAt: typeof profileObj.updatedAt === 'number' ? profileObj.updatedAt : Date.now(),
      },
      completedTopicIds,
      quizProgress: { answeredIds, correctIds },
      practicalAttempts: practicalAttempts.slice(0, 50),
      weakConcepts,
      flashcardReviews,
      bookmarks,
      recentSearches,
      activityLog,
      customSyllabi,
      educatorSequences,
      lastStudyContext,
      lastRoute: typeof obj.lastRoute === 'string' ? obj.lastRoute.slice(0, 40) : null,
    },
  };
}

export interface StudyStoreAdapter {
  readonly backendName: 'indexeddb' | 'localstorage' | 'memory';
  load(): Promise<StudyStateV1>;
  save(state: StudyStateV1): Promise<void>;
  reset(): Promise<StudyStateV1>;
}

function openStudyDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = window.indexedDB.open(IDB_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open error'));
  });
}

function mergeLegacyIntoState(base: StudyStateV1): StudyStateV1 {
  const legacy = safeReadLegacyState();
  const mergedTopics = Array.from(
    new Set([...base.completedTopicIds, ...(legacy.completedTopicIds ?? [])]),
  );
  const mergedAnswered = Array.from(
    new Set([...base.quizProgress.answeredIds, ...(legacy.quizProgress?.answeredIds ?? [])]),
  );
  const mergedCorrect = Array.from(
    new Set([...base.quizProgress.correctIds, ...(legacy.quizProgress?.correctIds ?? [])]),
  );

  const attemptIds = new Set(base.practicalAttempts.map((a) => a.id));
  const mergedAttempts = [
    ...base.practicalAttempts,
    ...(legacy.practicalAttempts ?? []).filter((a) => !attemptIds.has(a.id)),
  ].slice(0, 50);

  return {
    ...base,
    migratedLegacy: true,
    completedTopicIds: mergedTopics,
    quizProgress: { answeredIds: mergedAnswered, correctIds: mergedCorrect },
    practicalAttempts: mergedAttempts,
    weakConcepts: { ...legacy.weakConcepts, ...base.weakConcepts },
  };
}

function syncLegacyMirrors(state: StudyStateV1): void {
  if (typeof window === 'undefined') return;
  try {
    writePersistedAnatomySex(state.preferredSex);
    window.localStorage.setItem(LEGACY_KEYS.learnTopics, JSON.stringify(state.completedTopicIds));
    window.localStorage.setItem(LEGACY_KEYS.quizProgress, JSON.stringify(state.quizProgress));
    window.localStorage.setItem(
      LEGACY_KEYS.practicalLab,
      JSON.stringify({
        version: 1,
        attempts: state.practicalAttempts,
        weakStructures: state.weakConcepts,
      }),
    );
  } catch {
    // Ignore storage quota or private-mode restrictions
  }
}

export function createBrowserStudyAdapter(): StudyStoreAdapter {
  let memoryFallback = createEmptyStudyState();
  const hasIdb = typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';

  return {
    backendName: hasIdb ? 'indexeddb' : typeof window !== 'undefined' ? 'localstorage' : 'memory',

    async load(): Promise<StudyStateV1> {
      let loaded: StudyStateV1 | null = null;

      if (hasIdb) {
        try {
          const db = await openStudyDb();
          loaded = await new Promise<StudyStateV1 | null>((resolve, reject) => {
            const tx = db.transaction(IDB_STORE_NAME, 'readonly');
            const store = tx.objectStore(IDB_STORE_NAME);
            const req = store.get(IDB_RECORD_KEY);
            req.onsuccess = () => {
              const check = validateAndSanitizeStudyState(req.result);
              resolve(check.ok && check.state ? check.state : null);
            };
            req.onerror = () => reject(req.error);
          });
          db.close();
        } catch {
          loaded = null;
        }
      }

      if (!loaded && typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem(FALLBACK_STORAGE_KEY);
          if (raw) {
            const check = validateAndSanitizeStudyState(JSON.parse(raw));
            if (check.ok && check.state) loaded = check.state;
          }
        } catch {
          loaded = null;
        }
      }

      const initial = loaded ?? memoryFallback;
      const synced = !initial.migratedLegacy ? mergeLegacyIntoState(initial) : initial;
      memoryFallback = synced;
      if (!loaded || !initial.migratedLegacy) {
        await this.save(synced);
      }
      return synced;
    },

    async save(state: StudyStateV1): Promise<void> {
      const next: StudyStateV1 = { ...state, updatedAt: Date.now() };
      memoryFallback = next;
      syncLegacyMirrors(next);

      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignore quota issues
        }
      }

      if (hasIdb) {
        try {
          const db = await openStudyDb();
          await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
            tx.objectStore(IDB_STORE_NAME).put(next, IDB_RECORD_KEY);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
          });
          db.close();
        } catch {
          // Already saved to fallback localStorage / memoryFallback
        }
      }
    },

    async reset(): Promise<StudyStateV1> {
      const fresh: StudyStateV1 = { ...createEmptyStudyState(), migratedLegacy: true };
      memoryFallback = fresh;
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.removeItem(LEGACY_KEYS.learnTopics);
          window.localStorage.removeItem(LEGACY_KEYS.quizProgress);
          window.localStorage.removeItem(LEGACY_KEYS.practicalLab);
          window.localStorage.removeItem(FALLBACK_STORAGE_KEY);
          window.localStorage.removeItem(PREFERRED_SEX_STORAGE_KEY);
        } catch {
          // Ignore
        }
      }
      await this.save(fresh);
      return fresh;
    },
  };
}

export interface RevisionQueueEntry {
  id: string;
  source: 'practical_miss' | 'difficult_card' | 'due_card' | 'incomplete_lesson' | 'bookmark';
  priority: number;
  title: string;
  subtitle: string;
  canonicalSystem?: CanonicalSystemId;
  conceptId?: string;
  lessonTopicId?: string;
  cardId?: string;
}

export function buildRevisionQueue(state: StudyStateV1, nowMs = Date.now()): RevisionQueueEntry[] {
  const queue: RevisionQueueEntry[] = [];
  const seen = new Set<string>();

  // 1. Highest priority: Practical Lab missed concepts
  const weakList = Object.values(state.weakConcepts).sort((a, b) => b.missCount - a.missCount);
  for (const w of weakList) {
    seen.add(`concept:${w.conceptId}`);
    queue.push({
      id: `rev-weak-${w.conceptId}`,
      source: 'practical_miss',
      priority: 100 + w.missCount * 5,
      title: w.name,
      subtitle: `Missed ${w.missCount}× in Practical Lab · Needs active recall & 3D spotter practice`,
      canonicalSystem: w.canonicalSystem,
      conceptId: w.conceptId,
    });
  }

  // 2. Difficult or lapsed flashcards
  for (const rev of Object.values(state.flashcardReviews)) {
    if (rev.lastRating === 'difficult' || rev.lapses > 0 || isCardDue(rev, nowMs)) {
      const card = ANATOMY_FLASHCARDS.find((c) => c.id === rev.cardId);
      if (!card) continue;
      const isDiff = rev.lastRating === 'difficult';
      queue.push({
        id: `rev-card-${card.id}`,
        source: isDiff ? 'difficult_card' : 'due_card',
        priority: isDiff ? 85 : 60,
        title: `${card.structureName} (${card.focus})`,
        subtitle: isDiff
          ? 'Marked Difficult on last flashcard review'
          : 'Spaced repetition review now due',
        canonicalSystem: card.canonicalSystem,
        conceptId: card.conceptId,
        cardId: card.id,
      });
    }
  }

  // 3. Bookmarked weak structures not already queued from Practical Lab
  for (const bm of Object.values(state.bookmarks)) {
    if (bm.kind === 'structure' && seen.has(`concept:${bm.targetId}`)) continue;
    queue.push({
      id: `rev-bm-${bm.id}`,
      source: 'bookmark',
      priority: 45,
      title: bm.title,
      subtitle: `Saved ${bm.kind}${bm.subtitle ? ` · ${bm.subtitle}` : ''}`,
      canonicalSystem: bm.canonicalSystem,
      conceptId: bm.kind === 'structure' ? bm.targetId : undefined,
      lessonTopicId: bm.kind === 'topic' ? bm.targetId : undefined,
    });
  }

  // 4. Incomplete Learning topics (up to first 6 so queue stays focused)
  const completedSet = new Set(state.completedTopicIds);
  let incompleteAdded = 0;
  for (const lesson of ANATOMY_LESSONS) {
    for (const topic of lesson.topics) {
      if (completedSet.has(topic.id)) continue;
      queue.push({
        id: `rev-topic-${topic.id}`,
        source: 'incomplete_lesson',
        priority: 30,
        title: topic.title.en,
        subtitle: `${lesson.title.en} · Uncompleted lesson topic`,
        canonicalSystem: lesson.systemId,
        conceptId: topic.conceptIds[0],
        lessonTopicId: topic.id,
      });
      incompleteAdded++;
      if (incompleteAdded >= 6) break;
    }
    if (incompleteAdded >= 6) break;
  }

  return queue.sort((a, b) => b.priority - a.priority);
}

export function applyFlashcardReviewToState(
  state: StudyStateV1,
  cardId: string,
  conceptId: string,
  structureName: string,
  rating: ReviewRating,
  nowMs = Date.now(),
): StudyStateV1 {
  const prev = state.flashcardReviews[cardId];
  const nextRev = computeNextReview(prev, cardId, conceptId, rating, nowMs);
  const entry: StudyActivityEntry = {
    id: `act-${nowMs}-${cardId}`,
    at: nowMs,
    kind: 'flashcard',
    label: `Reviewed flashcard: ${structureName}`,
    detail: rating === 'understood' ? 'Understood' : rating === 'repeat' ? 'Repeat later' : 'Marked difficult',
  };
  return {
    ...state,
    flashcardReviews: { ...state.flashcardReviews, [cardId]: nextRev },
    activityLog: [entry, ...state.activityLog].slice(0, 40),
  };
}

export function toggleBookmarkInState(
  state: StudyStateV1,
  item: Omit<BookmarkItem, 'id' | 'createdAt'>,
  nowMs = Date.now(),
): StudyStateV1 {
  const id = `${item.kind}:${item.targetId}`;
  const nextBookmarks = { ...state.bookmarks };
  let activityLog = state.activityLog;

  if (nextBookmarks[id]) {
    delete nextBookmarks[id];
  } else {
    nextBookmarks[id] = { ...item, id, createdAt: nowMs };
    const nextEntry: StudyActivityEntry = {
      id: `act-bm-${nowMs}-${item.targetId}`,
      at: nowMs,
      kind: 'bookmark',
      label: `Saved ${item.kind}: ${item.title}`,
    };
    activityLog = [nextEntry, ...activityLog].slice(0, 40);
  }

  return {
    ...state,
    bookmarks: nextBookmarks,
    activityLog,
  };
}
