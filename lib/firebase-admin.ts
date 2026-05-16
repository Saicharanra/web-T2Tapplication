import * as admin from 'firebase-admin';
import { NextRequest } from 'next/server';

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('Firebase Admin SDK: Missing environment variables. Server-side operations may fail.');
    return null;
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (error) {
    console.error('Firebase Admin SDK: Initialization error', error);
    return null;
  }
}

// Initialize once
initializeFirebaseAdmin();

// Export services
// Note: We check admin.apps.length to ensure services are only accessed if initialization succeeded
export const adminAuth = admin.apps.length > 0 ? admin.auth() : null as unknown as admin.auth.Auth;
export const adminDb = admin.apps.length > 0 ? admin.firestore() : null as unknown as admin.firestore.Firestore;
export const adminStorage = admin.apps.length > 0 ? admin.storage() : null as unknown as admin.storage.Storage;

/**
 * Verifies the Firebase ID Token from the Authorization header
 */
export async function verifySession(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing or invalid Authorization header');
  }

  const token = authHeader.split('Bearer ')[1];
  
  if (!adminAuth) {
    console.error('Firebase Admin Auth not initialized');
    throw new Error('Internal Server Error: Auth service unavailable');
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying token:', error);
    throw new Error('Unauthorized: Invalid token');
  }
}
