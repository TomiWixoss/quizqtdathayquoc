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
  PITY_UR: 200, // Đảm bảo UR sau 200 lần (Priconne style)
  // Shards khi trùng theo scarcity - Priconne style
  DUPLICATE_SHARDS: {
    40: 50, // UR (3★)
    30: 10, // SR (2★)
    20: 1, // R (1★)
    10: 1, // N
  } as Record<number, number>,
  // Tỷ lệ rơi (%) - Priconne style
  RATES: {
    40: 3, // UR 3%
    30: 18, // SR 18%
    20: 39, // R 39%
    10: 40, // N 40%
  } as Record<number, number>,
  // Giá đổi thẻ UR bằng mảnh - Priconne style (145 Divine Amulet)
  UR_EXCHANGE_COST: 145,
};
