import { db } from "@/lib/firebase-client";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { BinDocument } from "@/types/find-bins";

const BINS_COLLECTION = "bins";

/**
 * Creates a new crowdsourced waste-bin document in Firestore.
 */
export async function createBin(
  userId: string,
  binData: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    locationType: string;
    photoUrl: string;
  }
): Promise<string> {
  const binsRef = collection(db, BINS_COLLECTION);
  
  const newBin = {
    name: binData.name,
    address: binData.address,
    latitude: binData.latitude,
    longitude: binData.longitude,
    locationType: binData.locationType,
    photoUrl: binData.photoUrl,
    addedBy: userId,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(binsRef, newBin);
  return docRef.id;
}

/**
 * Subscribes to real-time updates for all shared bin locations in Firestore.
 */
export function subscribeToBins(
  onUpdate: (bins: BinDocument[]) => void,
  onError?: (error: Error) => void
) {
  const binsRef = collection(db, BINS_COLLECTION);
  const q = query(binsRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const bins: BinDocument[] = [];
      snapshot.forEach((doc) => {
        bins.push({
          id: doc.id,
          ...doc.data(),
        } as BinDocument);
      });
      onUpdate(bins);
    },
    (error) => {
      console.error("Error subscribing to Firestore bins:", error);
      if (onError) onError(error);
    }
  );
}
