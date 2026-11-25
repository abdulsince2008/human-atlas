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
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  auth,
  signInWithGooglePopup,
  signOutFirebase,
  testConnection,
} from '../firebase';
import {
  mergeLocalAndCloudStudyState,
  type StudentEnrollmentRecord,
} from '../cloud/classroom-logic';
import {
  fetchCloudBundle,
  saveCloudStudyProgress,
  subscribeStudentEnrollments,
  syncMemberSummariesForEnrollments,
  upsertSignedInUserRecords,
} from '../cloud/classroom-service';
import { useStudy } from './StudyContext';

export type CloudSyncStatus = 'signed_out' | 'syncing' | 'synced' | 'error';

export interface FirebaseContextValue {
  authReady: boolean;
  user: User | null;
  isVerifiedUser: boolean;
  authBusy: boolean;
  authError: string | null;
  syncStatus: CloudSyncStatus;
  lastSyncedAt: number | null;
  enrollments: StudentEnrollmentRecord[];
  signInWithGoogle: () => Promise<void>;
  signOutAccount: () => Promise<void>;
  syncNow: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const { ready: studyReady, state, replaceStateFromCloudMerge } = useStudy();

  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>('signed_out');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [enrollments, setEnrollments] = useState<StudentEnrollmentRecord[]>([]);

  const stateRef = useRef(state);
  stateRef.current = state;

  const enrollmentsRef = useRef(enrollments);
  enrollmentsRef.current = enrollments;

  const hydratedUidRef = useRef<string | null>(null);
  const suppressNextAutosaveRef = useRef(false);

  useEffect(() => {
    void testConnection();
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      if (!nextUser) {
        hydratedUidRef.current = null;
        setEnrollments([]);
        setSyncStatus('signed_out');
      }
    });
    return () => unsub();
  }, []);

  const isVerifiedUser = Boolean(user && user.emailVerified);

  // Subscribe to student's enrolled classrooms ONLY when auth is ready & verified
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) {
      setEnrollments([]);
      return;
    }
    const unsub = subscribeStudentEnrollments(user.uid, (rows) => {
      setEnrollments(rows);
    });
    return () => unsub();
  }, [authReady, user]);

  // Initial pull + merge when signed-in user and local study store are both ready
  useEffect(() => {
    if (!authReady || !studyReady || !user || !user.emailVerified) return;
    if (hydratedUidRef.current === user.uid) return;

    let active = true;
    hydratedUidRef.current = user.uid;
    setSyncStatus('syncing');
    setAuthError(null);

    (async () => {
      try {
        await upsertSignedInUserRecords(user, stateRef.current);
        const bundle = await fetchCloudBundle(user.uid);
        if (!active) return;

        const merged = mergeLocalAndCloudStudyState(
          stateRef.current,
          bundle.progress ?? {},
          bundle.profile,
        );
        suppressNextAutosaveRef.current = true;
        replaceStateFromCloudMerge(merged);
        await saveCloudStudyProgress(user.uid, merged);
        if (!active) return;
        setSyncStatus('synced');
        setLastSyncedAt(Date.now());
      } catch (err) {
        if (!active) return;
        setSyncStatus('error');
        setAuthError(err instanceof Error ? err.message : 'Cloud sync failed.');
      }
    })();

    return () => {
      active = false;
    };
  }, [authReady, studyReady, user, replaceStateFromCloudMerge]);

  // Debounced autosave to cloud whenever local study state updates while signed in
  useEffect(() => {
    if (!authReady || !studyReady || !user || !user.emailVerified) return;
    if (hydratedUidRef.current !== user.uid) return;
    if (suppressNextAutosaveRef.current) {
      suppressNextAutosaveRef.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      setSyncStatus('syncing');
      Promise.all([
        upsertSignedInUserRecords(user, stateRef.current),
        saveCloudStudyProgress(user.uid, stateRef.current),
        syncMemberSummariesForEnrollments(user.uid, enrollmentsRef.current, stateRef.current),
      ])
        .then(() => {
          setSyncStatus('synced');
          setLastSyncedAt(Date.now());
        })
        .catch((err) => {
          setSyncStatus('error');
          setAuthError(err instanceof Error ? err.message : 'Cloud autosave failed.');
        });
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [authReady, studyReady, user, state.updatedAt, state.completedTopicIds.length, state.practicalAttempts.length]);

  const signInWithGoogle = useCallback(async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await signInWithGooglePopup();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google Sign-In could not be completed.';
      if (!msg.includes('popup-closed-by-user')) {
        setAuthError(msg);
      }
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const signOutAccount = useCallback(async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await signOutFirebase();
      hydratedUidRef.current = null;
      setSyncStatus('signed_out');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Sign-out failed.');
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (!user || !user.emailVerified) return;
    setSyncStatus('syncing');
    setAuthError(null);
    try {
      await upsertSignedInUserRecords(user, stateRef.current);
      const bundle = await fetchCloudBundle(user.uid);
      const merged = mergeLocalAndCloudStudyState(
        stateRef.current,
        bundle.progress ?? {},
        bundle.profile,
      );
      suppressNextAutosaveRef.current = true;
      replaceStateFromCloudMerge(merged);
      await saveCloudStudyProgress(user.uid, merged);
      await syncMemberSummariesForEnrollments(user.uid, enrollmentsRef.current, merged);
      setSyncStatus('synced');
      setLastSyncedAt(Date.now());
    } catch (err) {
      setSyncStatus('error');
      setAuthError(err instanceof Error ? err.message : 'Cloud sync failed.');
    }
  }, [user, replaceStateFromCloudMerge]);

  const value = useMemo<FirebaseContextValue>(
    () => ({
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
    }),
    [
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
    ],
  );

  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>;
}

export function useFirebase(): FirebaseContextValue {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error('useFirebase() must be called inside <FirebaseProvider>');
  }
  return ctx;
}
