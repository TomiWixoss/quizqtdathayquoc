// ============ GACHA SERVICE - FIREBASE BRIDGE VERSION ============
// All API calls go through Firebase Realtime Database
// Backend server listens and processes, then writes results back
// This bypasses CORS issues in Zalo Mini App

import { ref, push, onValue, off, set } from "firebase/database";
import { rtdb } from "@/lib/firebase";

// Timeout for waiting response (ms)
const COMMAND_TIMEOUT = 30000;

// Send command and wait for response
async function sendCommand<T>(
  action: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  const commandsRef = ref(rtdb, "gacha_commands");
  const commandRef = push(commandsRef);

  return new Promise((resolve, reject) => {
    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        off(commandRef);
        reject(new Error(`Command timeout: ${action}`));
      }
    }, COMMAND_TIMEOUT);

    onValue(commandRef, (snapshot) => {
      const data = snapshot.val();
      if (!data || resolved) return;

      if (data.status === "completed" || data.status === "error") {
        resolved = true;
        clearTimeout(timeout);
        off(commandRef);

        if (data.status === "error") {
          reject(new Error(data.response?.error || "Unknown error"));
        } else {
          resolve(data.response as T);
        }
      }
    });

    set(commandRef, {
      action,
      params,
      status: "pending",
      createdAt: Date.now(),
    }).catch((err) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        off(commandRef);
        reject(err);
      }
    });
  });
}

// ============ TYPES ============

export interface CardInfo {
  card_id?: number;
  card_name: string;
  card_img: string;
  card_scarcity: number;
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

export interface CollectReward {
  redeem_text: string;
  redeem_item_name: string;
  redeem_item_image: string;
  redeem_item_type?: number;
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
      return "#FFD700";
    case 30:
      return "#9B59B6";
    case 20:
      return "#3498DB";
    case 10:
      return "#95A5A6";
    default:
      return "#7F8C8D";
  }
}

export function formatPrice(price: number): string {
  return `¥${(price / 100).toFixed(2)}`;
}

export function getHQImage(url: string, size = 400): string {
  if (!url) return "";
  if (url.includes("hdslb.com")) {
    return `${url}@${size}w_${size}h_1c.webp`;
  }
  return url;
}

export function getFullImage(url: string, width = 600): string {
  if (!url) return "";
  if (url.includes("hdslb.com")) {
    return `${url}@${width}w.webp`;
  }
  return url;
}

export function getVideoUrl(videoList?: string[]): string | null {
  if (!videoList || videoList.length < 2) return null;
  return videoList[1];
}

export function hasCardVideo(videoList?: string[]): boolean {
  return Boolean(videoList && videoList.length > 1 && videoList[1]);
}

// ============ LOCAL CACHE ============

const CACHE_DURATION = 5 * 60 * 1000;

interface CacheItem<T> {
  data: T;
  expiry: number;
}

const memoryCache = new Map<string, CacheItem<unknown>>();

function getCached<T>(key: string): T | null {
  const item = memoryCache.get(key) as CacheItem<T> | undefined;
  if (item && item.expiry > Date.now()) {
    return item.data;
  }
  memoryCache.delete(key);
  return null;
}

function setCached<T>(key: string, data: T, duration = CACHE_DURATION): void {
  memoryCache.set(key, { data, expiry: Date.now() + duration });
}

// ============ IMAGE PRELOAD ============

const preloadedImages = new Set<string>();

export function preloadImages(urls: string[]): void {
  urls.forEach((url) => {
    if (!url || preloadedImages.has(url)) return;
    const img = new Image();
    img.referrerPolicy = "no-referrer";
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

export function preloadCollectionImages(collections: GachaCollection[]): void {
  const urls = collections.map((c) => getFullImage(c.act_square_img, 400));
  preloadImages(urls);
}

// ============ API FUNCTIONS (via Firebase Bridge) ============

interface CollectionsResponse {
  success: boolean;
  data: GachaCollection[];
  cached?: boolean;
}

interface CollectionResponse {
  success: boolean;
  data: { data: GachaCollection };
  cached?: boolean;
}

interface LotteryResponse {
  success: boolean;
  data: { data: Record<string, unknown> };
  cached?: boolean;
}

interface VideoUrlResponse {
  success: boolean;
  videoUrl: string;
  cached?: boolean;
}

/**
 * Get all gacha collections
 */
export async function getGachaCollections(): Promise<GachaCollection[]> {
  const cacheKey = "collections";
  const cached = getCached<GachaCollection[]>(cacheKey);
  if (cached) {
    preloadCollectionImages(cached);
    return cached;
  }

  try {
    console.log("[Gacha] Fetching collections via Firebase bridge...");
    const result = await sendCommand<CollectionsResponse>("getCollections");
    const data = result.data || [];

    data.sort((a, b) => b.startTime - a.startTime);

    setCached(cacheKey, data);
    preloadCollectionImages(data);
    console.log("[Gacha] Got", data.length, "collections");
    return data;
  } catch (error) {
    console.error("[getGachaCollections] Error:", error);
    throw error;
  }
}

/**
 * Get collection detail
 */
export async function getGachaCollectionDetail(
  actId: number
): Promise<GachaCollection | null> {
  const cacheKey = `collection-${actId}`;
  const cached = getCached<GachaCollection>(cacheKey);
  if (cached) return cached;

  try {
    const result = await sendCommand<CollectionResponse>("getCollection", {
      actId,
    });
    const data = result.data?.data as GachaCollection;

    if (data) {
      setCached(cacheKey, data);
    }
    return data || null;
  } catch (error) {
    console.error("[getGachaCollectionDetail] Error:", error);
    throw error;
  }
}

/**
 * Get lotteries for a collection
 */
export async function getCollectionLotteries(
  actId: number
): Promise<GachaLottery[]> {
  const collection = await getGachaCollectionDetail(actId);
  if (!collection?.lottery_list?.length) return [];

  const lotteries: GachaLottery[] = [];

  for (const lotteryBasic of collection.lottery_list) {
    const lottery = await getLotteryDetail(actId, lotteryBasic.lottery_id);
    if (lottery) {
      lotteries.push(lottery);
    }
  }

  return lotteries;
}

/**
 * Get lottery detail with all cards
 */
export async function getLotteryDetail(
  actId: number,
  lotteryId: number
): Promise<GachaLottery | null> {
  const cacheKey = `lottery-${actId}-${lotteryId}`;
  const cached = getCached<GachaLottery>(cacheKey);
  if (cached) {
    preloadLotteryImages(cached);
    return cached;
  }

  try {
    const result = await sendCommand<LotteryResponse>("getLottery", {
      collectionId: actId,
      lotteryId,
    });
    const rawData = result.data?.data;

    if (!rawData) return null;

    const lottery: GachaLottery = {
      lottery_id: lotteryId,
      lottery_name: (rawData.lottery_name as string) || "",
      price: (rawData.price as number) || 0,
      lottery_image: (rawData.lottery_image as string) || "",
      item_list: (
        (rawData.item_list as Array<{
          item_type: number;
          card_info: CardInfo;
        }>) || []
      ).map((item) => ({
        item_type: item.item_type,
        card_info: item.card_info,
        card_name: item.card_info?.card_name || "",
        card_img: item.card_info?.card_img || "",
        card_scarcity: item.card_info?.card_scarcity || 0,
        card_type: item.card_info?.card_type,
        card_id: item.card_info?.card_id,
        width: item.card_info?.width || 0,
        height: item.card_info?.height || 0,
        video_list: item.card_info?.video_list || [],
        card_img_download: item.card_info?.card_img_download || "",
        is_physical_orientation: item.card_info?.is_physical_orientation,
      })),
      collect_list: (rawData.collect_list as CollectList) || {},
      collect_infos:
        ((rawData.collect_list as CollectList)
          ?.collect_infos as CollectReward[]) || [],
      collect_chain:
        ((rawData.collect_list as CollectList)
          ?.collect_chain as CollectReward[]) || [],
    };

    setCached(cacheKey, lottery, 30 * 60 * 1000);
    preloadLotteryImages(lottery);
    return lottery;
  } catch (error) {
    console.error("[getLotteryDetail] Error:", error);
    throw error;
  }
}

/**
 * Get fresh video URL for a card
 */
export async function getFreshVideoUrl(
  collectionId: number,
  lotteryId: number,
  cardImg: string
): Promise<string | null> {
  const cacheKey = `video-${collectionId}-${lotteryId}-${cardImg}`;
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  try {
    const result = await sendCommand<VideoUrlResponse>("getVideoUrl", {
      collectionId,
      lotteryId,
      cardImg,
    });

    if (result.videoUrl) {
      setCached(cacheKey, result.videoUrl, 25 * 60 * 1000);
      return result.videoUrl;
    }
    return null;
  } catch (error) {
    console.error("[getFreshVideoUrl] Error:", error);
    return null;
  }
}

// Clear cache
export function clearGachaCache(): void {
  memoryCache.clear();
}
