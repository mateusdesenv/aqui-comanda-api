import { applicationDefault, cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { env } from './env';

let firebaseApp: App | null = null;

export function getFirebaseAdmin(): App {
  if (firebaseApp) {
    return firebaseApp;
  }

  const existingApp = getApps()[0];
  if (existingApp) {
    firebaseApp = existingApp;
    return firebaseApp;
  }

  const hasServiceAccount = env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY;

  if (hasServiceAccount) {
    firebaseApp = initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    firebaseApp = initializeApp({ credential: applicationDefault() });
  }

  return firebaseApp;
}

export const firebaseAuth = () => getAuth(getFirebaseAdmin());
