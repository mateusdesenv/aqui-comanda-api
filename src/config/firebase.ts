import { applicationDefault, cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { env } from './env';

let firebaseApp: App | null = null;

function hasValidServiceAccountConfig(): boolean {
  return Boolean(
    env.FIREBASE_PROJECT_ID &&
      env.FIREBASE_CLIENT_EMAIL?.includes('gserviceaccount.com') &&
      env.FIREBASE_PRIVATE_KEY?.includes('BEGIN PRIVATE KEY'),
  );
}

export function getFirebaseAdmin(): App {
  if (firebaseApp) {
    return firebaseApp;
  }

  const existingApp = getApps()[0];
  if (existingApp) {
    firebaseApp = existingApp;
    return firebaseApp;
  }

  if (hasValidServiceAccountConfig()) {
    firebaseApp = initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      projectId: env.FIREBASE_PROJECT_ID,
    });

    return firebaseApp;
  }

  if (env.FIREBASE_PROJECT_ID) {
    firebaseApp = initializeApp({ projectId: env.FIREBASE_PROJECT_ID });
    return firebaseApp;
  }

  firebaseApp = initializeApp({ credential: applicationDefault() });
  return firebaseApp;
}

export const firebaseAuth = () => getAuth(getFirebaseAdmin());
