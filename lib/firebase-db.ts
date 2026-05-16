import { db } from '@/lib/firebase-client';
import { collection, doc, setDoc, addDoc, serverTimestamp, getDoc, updateDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { UserDocument, SubmissionDocument, PointsHistoryDocument } from '@/types/firebase';

// Collections
export const usersCollection = collection(db, 'users');
export const submissionsCollection = collection(db, 'submissions');
export const pointsHistoryCollection = collection(db, 'pointsHistory');

// --- USER OPERATIONS ---

export async function createUser(userId: string, data: Omit<UserDocument, 'id' | 'joinedAt' | 'updatedAt'>) {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    ...data,
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getUser(userId: string): Promise<UserDocument | null> {
  const userRef = doc(db, 'users', userId);
  const snapshot = await getDoc(userRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as UserDocument;
  }
  return null;
}

export async function updateUserPoints(userId: string, pointsToAdd: number) {
  const userRef = doc(db, 'users', userId);
  const user = await getUser(userId);
  if (!user) throw new Error("User not found");
  
  await updateDoc(userRef, {
    points: user.points + pointsToAdd,
    updatedAt: serverTimestamp()
  });
}

// --- SUBMISSION OPERATIONS ---

export async function createSubmission(data: Omit<SubmissionDocument, 'id' | 'createdAt'>) {
  const docRef = await addDoc(submissionsCollection, {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getPendingSubmissions(): Promise<SubmissionDocument[]> {
  const q = query(submissionsCollection, where("status", "==", "PENDING"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubmissionDocument));
}

export async function verifySubmission(submissionId: string, adminId: string, pointsToAward: number) {
  const submissionRef = doc(db, 'submissions', submissionId);
  await updateDoc(submissionRef, {
    status: 'VERIFIED',
    pointsAwarded: pointsToAward,
    verifiedAt: serverTimestamp(),
    assignedAdminId: adminId
  });
}

export async function rejectSubmission(submissionId: string, adminId: string, reason: string) {
  const submissionRef = doc(db, 'submissions', submissionId);
  await updateDoc(submissionRef, {
    status: 'REJECTED',
    rejectionReason: reason,
    assignedAdminId: adminId
  });
}

// --- POINTS HISTORY OPERATIONS ---

export async function createPointsHistory(userId: string, submissionId: string, points: number) {
  await addDoc(pointsHistoryCollection, {
    userId,
    submissionId,
    points,
    createdAt: serverTimestamp()
  });
}
