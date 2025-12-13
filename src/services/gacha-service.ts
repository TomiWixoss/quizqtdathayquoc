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

// ============ TYPES ============

// Card info đầy đủ
export interface CardInfo {
  card_id?: number;
  card_name: string;
  card_img: string;
  card_scarcity: number; // 40=UR/SSR, 30=SR, 20=R, 10=N
  card_type?: number;
  width: number;
  height: number;
  video_list: string[];
  card_img_download: string;
  is_physical_orientation?: number;
}

export interface GachaCard {
  item_type: number;
  card_info: CardInfo;
  // Extracted fields for easy access
  card_name: string;
  card_img: string;
  card_scarcity: number;
  card_type?: number;
  card_id?: number;
  width: number;
  height: number;
  video_list: string[];
  card_img_download: string;
  is_physical_orientation?: number;
}

// Reward khi sưu tập
export interface CollectReward {
  redeem_text: string;
  redeem_item_name: string;
  redeem_item_image: string;
  redeem_item_type?: number; // avatar, frame, badge...
  require_item_amount?: number;
}

export interface CollectList {
  collect_infos?: CollectReward[];
  collect_chain?: CollectReward[];
}

export interface GachaLottery {
  lottery_id: number;
  lottery_name: string;
  price: number;
  lottery_image: string;
  item_list: GachaCard[];
  collect_list: CollectList;
  collect_infos: CollectReward[];
  collect_chain: CollectReward[];
  _raw_lottery_info?: unknown;
  updatedAt?: Date;
}

export interface LotteryBasic {
  lottery_id: number;
  lottery_name: string;
  price: number;
  lottery_image: string;
}

export interface UserInfo {
  nickname: string;
  avatar: string;
  uid?: number;
}

export interface MedalInfo {
  level?: number;
  name?: string;
  image?: string;
  require_count?: number;
}

export interface GachaCollection {
  id: number;
  name: string;
  description: string;
  startTime: number;
  start_time?: number;
  end_time?: number;
  relatedUsers: number[];
  totalPreorderCount: number;
  totalPurchaseCount: number;
  total_book_cnt?: number;
  total_buy_cnt?: number;
  act_square_img: string;
  lottery_image: string;
  act_title?: string;
  product_introduce?: string;
  related_user_infos?: Record<string, UserInfo>;
  collector_medal_info?: MedalInfo[] | MedalInfo;
  lottery_list?: LotteryBasic[];
  _raw_detail?: unknown;
  updatedAt?: Date;
  syncError?: string;
}

export interface GachaMetadata {
  totalCollections: number;
  lastSync: Date;
  lastSyncStats?: {
    newSynced: number;
    errors: number;
    skipped: number;
    fullData?: boolean;
  };
}

// ============ HELPER FUNCTIONS ============

export function getScarcityName(scarcity: number): string {
  switch (scarcity) {
    case 40:
      return "UR";
    case 30:
      return "SR";
    case 20:
      return "R";
    case 10:
      return "N";
    default:
      return "Unknown";
  }
}

export function getScarcityColor(scarcity: number): string {
  switch (scarcity) {
    case 40:
      return "#FFD700"; // Gold
    case 30:
      return "#9B59B6"; // Purple
    case 20:
      return "#3498DB"; // Blue
    case 10:
      return "#95A5A6"; // Gray
    default:
      return "#7F8C8D";
  }
}

export function formatPrice(price: number): string {
  return `¥${(price / 100).toFixed(2)}`;
}

// Thumbnail - crop vuông cho grid
export function getHQImage(url: string, size = 400): string {
  if (!url) return "";
  if (url.includes("hdslb.com")) {
    return `${url}@${size}w_${size}h_1c.webp`;
  }
  return url;
}

// Full image - giữ tỷ lệ gốc cho modal
export function getFullImage(url: string, width = 600): string {
  if (!url) return "";
  if (url.includes("hdslb.com")) {
    return `${url}@${width}w.webp`;
  }
  return url;
}

// ============ FIRESTORE FUNCTIONS ============

export async function getGachaCollections(
  maxItems?: number
): Promise<GachaCollection[]> {
  try {
    const collectionRef = collection(db, "gachaCollections");
    let q = query(collectionRef, orderBy("startTime", "desc"));
    if (maxItems) q = query(q, limit(maxItems));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as GachaCollection);
  } catch (error) {
    console.error("Error fetching gacha collections:", error);
    throw error;
  }
}

export async function getGachaCollectionDetail(
  actId: number
): Promise<GachaCollection | null> {
  try {
    const docRef = doc(db, "gachaCollections", actId.toString());
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as GachaCollection;
    }
    return null;
  } catch (error) {
    console.error("Error fetching collection detail:", error);
    throw error;
  }
}

export async function getCollectionLotteries(
  actId: number
): Promise<GachaLottery[]> {
  try {
    const lotteriesRef = collection(
      db,
      "gachaCollections",
      actId.toString(),
      "lotteries"
    );
    const snapshot = await getDocs(lotteriesRef);
    return snapshot.docs.map((doc) => doc.data() as GachaLottery);
  } catch (error) {
    console.error("Error fetching lotteries:", error);
    throw error;
  }
}

export async function getLotteryDetail(
  actId: number,
  lotteryId: number
): Promise<GachaLottery | null> {
  try {
    const docRef = doc(
      db,
      "gachaCollections",
      actId.toString(),
      "lotteries",
      lotteryId.toString()
    );
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as GachaLottery;
    }
    return null;
  } catch (error) {
    console.error("Error fetching lottery detail:", error);
    throw error;
  }
}

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
