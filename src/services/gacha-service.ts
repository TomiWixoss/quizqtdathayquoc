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

// ============ CACHE CONFIG ============
const CACHE_KEYS = {
  COLLECTIONS: "gacha_collections",
  COLLECTION_DETAIL: "gacha_detail_",
  LOTTERIES: "gacha_lotteries_",
};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

function getCache<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const item: CacheItem<T> = JSON.parse(cached);
    if (Date.now() - item.timestamp > CACHE_DURATION) {
      localStorage.removeItem(key);
      return null;
    }
    return item.data;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T): void {
  try {
    const item: CacheItem<T> = { data, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (e) {
    console.warn("Cache write failed:", e);
  }
}

// ============ IMAGE PRELOAD ============
const preloadedImages = new Set<string>();

export function preloadImages(urls: string[]): void {
  urls.forEach((url) => {
    if (!url || preloadedImages.has(url)) return;
    const img = new Image();
    img.referrerPolicy = "no-referrer";
    img.crossOrigin = "anonymous";
    img.src = url;
    preloadedImages.add(url);
  });
}

export function preloadLotteryImages(lottery: GachaLottery): void {
  if (!lottery?.item_list) return;
  const urls = lottery.item_list.map((card) =>
    getFullImage(card.card_img, 400)
  );
  preloadImages(urls);
}

// ============ FIRESTORE FUNCTIONS ============

export function preloadCollectionImages(collections: GachaCollection[]): void {
  const urls = collections.map((c) => getFullImage(c.act_square_img, 400));
  preloadImages(urls);
}

export async function getGachaCollections(
  maxItems?: number
): Promise<GachaCollection[]> {
  // Check cache first
  const cacheKey = CACHE_KEYS.COLLECTIONS + (maxItems || "all");
  const cached = getCache<GachaCollection[]>(cacheKey);
  if (cached) {
    // Preload collection images from cache
    preloadCollectionImages(cached);
    return cached;
  }

  try {
    const collectionRef = collection(db, "gachaCollections");
    let q = query(collectionRef, orderBy("startTime", "desc"));
    if (maxItems) q = query(q, limit(maxItems));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((d) => d.data() as GachaCollection);
    setCache(cacheKey, data);
    // Preload collection images
    preloadCollectionImages(data);
    return data;
  } catch (error) {
    console.error("Error fetching gacha collections:", error);
    throw error;
  }
}

export async function getGachaCollectionDetail(
  actId: number
): Promise<GachaCollection | null> {
  // Check cache first
  const cacheKey = CACHE_KEYS.COLLECTION_DETAIL + actId;
  const cached = getCache<GachaCollection>(cacheKey);
  if (cached) return cached;

  try {
    const docRef = doc(db, "gachaCollections", actId.toString());
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as GachaCollection;
      setCache(cacheKey, data);
      return data;
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
  // Check cache first
  const cacheKey = CACHE_KEYS.LOTTERIES + actId;
  const cached = getCache<GachaLottery[]>(cacheKey);
  if (cached) {
    // Preload images from cache
    cached.forEach(preloadLotteryImages);
    return cached;
  }

  try {
    const lotteriesRef = collection(
      db,
      "gachaCollections",
      actId.toString(),
      "lotteries"
    );
    const snapshot = await getDocs(lotteriesRef);
    const data = snapshot.docs.map((d) => d.data() as GachaLottery);
    setCache(cacheKey, data);
    // Preload images
    data.forEach(preloadLotteryImages);
    return data;
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

// Clear cache (for admin/debug)
export function clearGachaCache(): void {
  Object.values(CACHE_KEYS).forEach((prefix) => {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    }
  });
}
