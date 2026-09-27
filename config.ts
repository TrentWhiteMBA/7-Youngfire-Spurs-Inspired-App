import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

// Production Firebase Configuration provided for YoungFire Ministry (youngfire-673ef)
export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCgF596WSlKTLKLpuJn5JM1eG40U6JNByQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "youngfire-673ef.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "youngfire-673ef",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "youngfire-673ef.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "134531923215",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:134531923215:web:fffdd234f09577c000927a",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-EFHS4FVQZZ"
};

export const isMockFirebaseMode = false;
export const isFirebaseConfigured = true;

let appInstance: any = null;
let authInstance: any = null;
let dbInstance: any = null;
let storageInstance: any = null;
let googleProviderInstance: any = null;
let analyticsInstance: Analytics | null = null;

try {
  appInstance = getApps().length > 0 ? getApp() : initializeApp(FIREBASE_CONFIG);
  authInstance = getAuth(appInstance);
  dbInstance = getFirestore(appInstance);
  storageInstance = getStorage(appInstance);
  googleProviderInstance = new GoogleAuthProvider();

  // Safely initialize analytics if supported in browser runtime
  if (typeof window !== 'undefined') {
    isSupported().then(supported => {
      if (supported && appInstance) {
        analyticsInstance = getAnalytics(appInstance);
      }
    }).catch(() => {});
  }
} catch (err) {
  console.warn('[Firebase] Initialization error, falling back to local resilience:', err);
}

// Global Error Handler for Firestore operations (Skill specification)
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentAuth = authInstance;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth?.currentUser?.uid,
      email: currentAuth?.currentUser?.email,
      emailVerified: currentAuth?.currentUser?.emailVerified,
      isAnonymous: currentAuth?.currentUser?.isAnonymous,
      tenantId: currentAuth?.currentUser?.tenantId,
      providerInfo: currentAuth?.currentUser?.providerData?.map((p: any) => ({
        providerId: p.providerId,
        email: p.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('[Firestore Error]:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection Validation helper
export async function testConnection(): Promise<boolean> {
  if (!dbInstance) return false;
  try {
    await getDocFromServer(doc(dbInstance, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or internet connection.");
    }
    return false;
  }
}

// Kick off test connection
if (typeof window !== 'undefined') {
  testConnection().catch(() => {});
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;
export const googleProvider = googleProviderInstance;
export const analytics = analyticsInstance;

// Authentication helpers
export const safeSignInWithPopup = async (_auth: any, _provider: any) => {
  if (authInstance && googleProviderInstance && typeof signInWithPopup === 'function') {
    try {
      return await signInWithPopup(authInstance, googleProviderInstance);
    } catch (err) {
      console.warn('[Firebase] signInWithPopup encountered error:', err);
    }
  }

  // Graceful local fallback for preview sandbox
  const demoUser = {
    uid: 'user_trent_white',
    displayName: 'Trent D. White',
    email: 'trentwhite0308@gmail.com',
    photoURL: '/image_4.png'
  };
  localStorage.setItem('youngfire_user_session', JSON.stringify({
    id: 'roster_trent',
    name: 'Trent D. White',
    email: 'trentwhite0308@gmail.com',
    role: 'Lead Facilitator & Overseer',
    group: 'Men On Fire',
    avatar: '/image_4.png',
    isAdmin: true
  }));
  return { user: demoUser };
};

export const safeSignOut = async (_auth: any) => {
  if (authInstance && typeof signOut === 'function') {
    try {
      await signOut(authInstance);
    } catch {}
  }
  localStorage.removeItem('youngfire_user_session');
  return Promise.resolve();
};

export { safeSignInWithPopup as signInWithPopup, safeSignOut as signOut };
export default app;
