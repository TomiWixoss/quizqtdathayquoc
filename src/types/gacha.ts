// Gacha Types

// Item đã sở hữu
export interface OwnedCard {
  cardImg: string;
  cardScarcity: number;
  obtainedAt: string;
  collectionId: number;
  lotteryId: number;
}

export interface OwnedReward {
  type: "avatar" | "frame" | "badge";
  image: string;
  name: string;
  obtainedAt: string;
  collectionId: number;
}

// Gacha inventory trong user
export interface GachaInventory {
  // Cards theo collection: { [collectionId]: { [cardImg]: count } }
  cards: Record<number, Record<string, number>>;
  // Rewards đã có
  rewards: OwnedReward[];
  // Shards (mảnh) - đổi từ thẻ trùng
  shards: number;
  // Tổng số lần quay
  totalPulls: number;
  // Pity counter cho mỗi collection (đảm bảo UR sau X lần)
  pityCounters: Record<number, number>;
}

// Kết quả 1 lần quay
export interface GachaPullResult {
  cardImg: string;
  cardScarcity: number;
  isNew: boolean;
  shardsGained: number; // Nếu trùng
  videoList?: string[];
  width?: number;
  height?: number;
}

// Config
export const GACHA_CONFIG = {
  COST_PER_PULL: 150, // Gems
  PULLS_SINGLE: 1,
  PULLS_MULTI: 10,
  PITY_UR: 90, // Đảm bảo UR sau 90 lần
  // Shards khi trùng theo scarcity (rarity cao = nhiều mảnh hơn)
  DUPLICATE_SHARDS: {
    40: 100, // UR - hiếm nhất, nhiều mảnh nhất
    30: 30, // SR
    20: 10, // R
    10: 3, // N - phổ biến nhất, ít mảnh
  } as Record<number, number>,
  // Tỷ lệ rơi (%)
  RATES: {
    40: 1, // UR 1%
    30: 9, // SR 9%
    20: 30, // R 30%
    10: 60, // N 60%
  } as Record<number, number>,
  // Giá đổi thẻ UR bằng mảnh
  UR_EXCHANGE_COST: 150,
};
