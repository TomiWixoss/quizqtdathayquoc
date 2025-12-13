import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  getDoc,
} from "firebase/firestore";

export interface GachaCollection {
  id: number;
  name: string;
  description: string;
  startTime: number;
  relatedUsers: number[];
  totalPreorderCount: number;
  totalPurchaseCount: number;
  act_square_img: string;
  lottery_image: string;
  updatedAt?: Date;
}

export interface GachaMetadata {
  totalCollections: number;
  lastSync: Date;
}

/**
 * Lấy danh sách collections từ Firestore
 */
export async function getGachaCollections(
  maxItems?: number
): Promise<GachaCollection[]> {
  try {
    const collectionRef = collection(db, "gachaCollections");
    let q = query(collectionRef, orderBy("startTime", "desc"));

    if (maxItems) {
      q = query(q, limit(maxItems));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as GachaCollection);
  } catch (error) {
    console.error("Error fetching gacha collections:", error);
    throw error;
  }
}

/**
 * Lấy metadata (thời gian sync cuối, tổng số collections)
 */
export async function getGachaMetadata(): Promise<GachaMetadata | null> {
  try {
    const docRef = doc(db, "metadata", "gacha");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as GachaMetadata;
    }
    return null;
  } catch (error) {
    console.error("Error fetching gacha metadata:", error);
    return null;
  }
}
