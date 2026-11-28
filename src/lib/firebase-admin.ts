import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';

if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

export const adminAuth = getAuth();

export async function verifyAdminFirebaseIdToken(
  token: string | undefined | null,
): Promise<DecodedIdToken | null> {
  if (!token || typeof token !== 'string') return null;
  try {
    return await adminAuth.verifyIdToken(token.trim());
  } catch {
    return null;
  }
}
