import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

interface CachedCerts {
  certs: Record<string, string>;
  expiresAt: number;
}

let cachedCerts: CachedCerts | null = null;
let cachedProjectId: string | null | undefined;

function getConfiguredProjectId(): string | null {
  if (cachedProjectId !== undefined) return cachedProjectId;
  const fromEnv = process.env.FIREBASE_PROJECT_ID?.trim();
  if (fromEnv) {
    cachedProjectId = fromEnv;
    return cachedProjectId;
  }
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8')) as { projectId?: string };
      cachedProjectId = parsed.projectId?.trim() || null;
      return cachedProjectId;
    }
  } catch {
    // Ignore read error
  }
  cachedProjectId = null;
  return cachedProjectId;
}

async function fetchGoogleSecureTokenCerts(): Promise<Record<string, string> | null> {
  const now = Date.now();
  if (cachedCerts && now < cachedCerts.expiresAt) {
    return cachedCerts.certs;
  }
  try {
    const res = await fetch(
      'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',
    );
    if (!res.ok) return null;
    const certs = (await res.json()) as Record<string, string>;
    const cc = res.headers.get('cache-control') ?? '';
    const match = /max-age=(\d+)/i.exec(cc);
    const maxAgeSec = match ? Math.max(60, Math.min(86_400, Number(match[1]))) : 3600;
    cachedCerts = { certs, expiresAt: now + maxAgeSec * 1000 };
    return certs;
  } catch {
    return null;
  }
}

export interface VerifiedFirebaseIdentity {
  uid: string;
  email: string | null;
  emailVerified: boolean;
}

/**
 * Verifies a Firebase Auth ID token locally using Google's public x509 certificates
 * without requiring firebase-admin IAM credentials.
 */
export async function verifyFirebaseIdToken(
  idToken: string | undefined | null,
): Promise<VerifiedFirebaseIdentity | null> {
  if (!idToken || typeof idToken !== 'string') return null;
  const projectId = getConfiguredProjectId();
  if (!projectId) return null;

  const segments = idToken.trim().split('.');
  if (segments.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = segments;
  if (!headerB64 || !payloadB64 || !sigB64) return null;

  try {
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8')) as {
      alg?: string;
      kid?: string;
    };
    if (header.alg !== 'RS256' || !header.kid) return null;

    const certs = await fetchGoogleSecureTokenCerts();
    const pem = certs?.[header.kid];
    if (!pem) return null;

    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${headerB64}.${payloadB64}`);
    verifier.end();
    const signature = Buffer.from(sigB64, 'base64url');
    if (!verifier.verify(pem, signature)) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as {
      aud?: string;
      iss?: string;
      sub?: string;
      exp?: number;
      iat?: number;
      email?: string;
      email_verified?: boolean;
    };

    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.aud !== projectId) return null;
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null;
    if (typeof payload.sub !== 'string' || !payload.sub.trim() || payload.sub.length > 128) {
      return null;
    }
    if (typeof payload.exp !== 'number' || payload.exp <= nowSec) return null;
    if (typeof payload.iat !== 'number' || payload.iat > nowSec + 300) return null;

    return {
      uid: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : null,
      emailVerified: Boolean(payload.email_verified),
    };
  } catch {
    return null;
  }
}
