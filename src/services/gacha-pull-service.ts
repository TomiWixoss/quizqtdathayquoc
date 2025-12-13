import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { GachaCard, GachaLottery, CollectReward } from "./gacha-service";
import {
  type GachaInventory,
  type GachaPullResult,
  GACHA_CONFIG,
} from "@/types/gacha";

const DEFAULT_INVENTORY: GachaInventory = {
  cards: {},
  rewards: [],
  shards: 0,
  totalPulls: 0,
  pityCounters: {},
};

// Lấy inventory của user
export async function getUserGachaInventory(
  userId: string
): Promise<GachaInventory> {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      return data.gachaInventory || DEFAULT_INVENTORY;
    }
    return DEFAULT_INVENTORY;
  } catch (error) {
    console.error("Error getting gacha inventory:", error);
    return DEFAULT_INVENTORY;
  }
}

// Random card theo tỷ lệ
function rollCard(
  cards: GachaCard[],
  pityCount: number
): { card: GachaCard; resetPity: boolean } {
  // Pity system - đảm bảo UR sau PITY_UR lần
  if (pityCount >= GACHA_CONFIG.PITY_UR - 1) {
    const urCards = cards.filter((c) => c.card_scarcity === 40);
    if (urCards.length > 0) {
      return {
        card: urCards[Math.floor(Math.random() * urCards.length)],
        resetPity: true,
      };
    }
  }

  // Roll theo tỷ lệ
  const roll = Math.random() * 100;
  let cumulative = 0;
  let targetScarcity = 10; // Default N

  for (const [scarcity, rate] of Object.entries(GACHA_CONFIG.RATES)) {
    cumulative += rate;
    if (roll < cumulative) {
      targetScarcity = parseInt(scarcity);
      break;
    }
  }

  // Lọc cards theo scarcity
  let eligibleCards = cards.filter((c) => c.card_scarcity === targetScarcity);

  // Fallback nếu không có card ở scarcity đó
  if (eligibleCards.length === 0) {
    eligibleCards = cards;
  }

  const selectedCard =
    eligibleCards[Math.floor(Math.random() * eligibleCards.length)];
  return {
    card: selectedCard,
    resetPity: selectedCard.card_scarcity === 40,
  };
}

// Thực hiện quay gacha
export async function pullGacha(
  userId: string,
  collectionId: number,
  lottery: GachaLottery,
  pullCount: 1 | 10,
  currentGems: number
): Promise<{
  success: boolean;
  results: GachaPullResult[];
  newGems: number;
  newShards: number;
  error?: string;
}> {
  const totalCost = GACHA_CONFIG.COST_PER_PULL * pullCount;

  if (currentGems < totalCost) {
    return {
      success: false,
      results: [],
      newGems: currentGems,
      newShards: 0,
      error: "Không đủ Gems!",
    };
  }

  try {
    // Lấy inventory hiện tại
    const inventory = await getUserGachaInventory(userId);
    const results: GachaPullResult[] = [];
    let totalShardsGained = 0;

    // Khởi tạo collection trong inventory nếu chưa có
    if (!inventory.cards[collectionId]) {
      inventory.cards[collectionId] = {};
    }
    if (!inventory.pityCounters[collectionId]) {
      inventory.pityCounters[collectionId] = 0;
    }

    // Thực hiện quay
    for (let i = 0; i < pullCount; i++) {
      const { card, resetPity } = rollCard(
        lottery.item_list,
        inventory.pityCounters[collectionId]
      );

      // Check xem đã có card này chưa
      const cardKey = card.card_img;
      const isNew = !inventory.cards[collectionId][cardKey];
      let shardsGained = 0;

      if (isNew) {
        // Card mới
        inventory.cards[collectionId][cardKey] = 1;
      } else {
        // Card trùng - đổi thành shards
        inventory.cards[collectionId][cardKey]++;
        shardsGained = GACHA_CONFIG.DUPLICATE_SHARDS[card.card_scarcity] || 5;
        totalShardsGained += shardsGained;
      }

      // Update pity
      if (resetPity) {
        inventory.pityCounters[collectionId] = 0;
      } else {
        inventory.pityCounters[collectionId]++;
      }

      results.push({
        cardImg: card.card_img,
        cardScarcity: card.card_scarcity,
        isNew,
        shardsGained,
        videoList: card.video_list,
        width: card.width,
        height: card.height,
      });
    }

    // Update inventory
    inventory.shards += totalShardsGained;
    inventory.totalPulls += pullCount;

    // Lưu vào Firebase
    const userRef = doc(db, "users", userId);
    const newGems = currentGems - totalCost;
    await updateDoc(userRef, {
      gems: newGems,
      gachaInventory: inventory,
    });

    return {
      success: true,
      results,
      newGems,
      newShards: inventory.shards,
    };
  } catch (error) {
    console.error("Error pulling gacha:", error);
    return {
      success: false,
      results: [],
      newGems: currentGems,
      newShards: 0,
      error: "Có lỗi xảy ra!",
    };
  }
}

// Check xem user đã có card chưa
export function hasCard(
  inventory: GachaInventory,
  collectionId: number,
  cardImg: string
): boolean {
  return !!inventory.cards[collectionId]?.[cardImg];
}

// Check xem đã hoàn thành collection chưa
export function isCollectionComplete(
  inventory: GachaInventory,
  collectionId: number,
  totalCards: number
): boolean {
  const ownedCount = Object.keys(inventory.cards[collectionId] || {}).length;
  return ownedCount >= totalCards;
}

// Claim reward (avatar, frame, badge)
export async function claimReward(
  userId: string,
  collectionId: number,
  reward: CollectReward
): Promise<boolean> {
  try {
    const inventory = await getUserGachaInventory(userId);

    // Check xem đã claim chưa
    const alreadyClaimed = inventory.rewards.some(
      (r) =>
        r.collectionId === collectionId && r.image === reward.redeem_item_image
    );
    if (alreadyClaimed) return false;

    // Xác định type
    let rewardType: "avatar" | "frame" | "badge" = "badge";
    if (reward.redeem_item_type === 1000) rewardType = "avatar";
    else if (reward.redeem_item_type === 3) rewardType = "frame";
    else if (reward.redeem_item_type === 1001) rewardType = "badge";

    inventory.rewards.push({
      type: rewardType,
      image: reward.redeem_item_image || "",
      name: reward.redeem_item_name || "",
      obtainedAt: new Date().toISOString(),
      collectionId,
    });

    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { gachaInventory: inventory });
    return true;
  } catch (error) {
    console.error("Error claiming reward:", error);
    return false;
  }
}

// Claim all rewards for a collection
export async function claimAllRewards(
  userId: string,
  collectionId: number,
  rewards: CollectReward[]
): Promise<boolean> {
  try {
    const inventory = await getUserGachaInventory(userId);

    for (const reward of rewards) {
      // Check xem đã claim chưa
      const alreadyClaimed = inventory.rewards.some(
        (r) =>
          r.collectionId === collectionId &&
          r.image === reward.redeem_item_image
      );
      if (alreadyClaimed) continue;

      // Xác định type
      let rewardType: "avatar" | "frame" | "badge" = "badge";
      if (reward.redeem_item_type === 1000) rewardType = "avatar";
      else if (reward.redeem_item_type === 3) rewardType = "frame";
      else if (reward.redeem_item_type === 1001) rewardType = "badge";

      inventory.rewards.push({
        type: rewardType,
        image: reward.redeem_item_image || "",
        name: reward.redeem_item_name || "",
        obtainedAt: new Date().toISOString(),
        collectionId,
      });
    }

    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { gachaInventory: inventory });
    return true;
  } catch (error) {
    console.error("Error claiming all rewards:", error);
    return false;
  }
}

// Check if rewards already claimed for a collection
export function hasClaimedRewards(
  inventory: GachaInventory,
  collectionId: number
): boolean {
  return inventory.rewards.some((r) => r.collectionId === collectionId);
}

// Exchange shards for UR card
export async function exchangeShardsForCard(
  userId: string,
  collectionId: number,
  cardImg: string
): Promise<{ success: boolean; error?: string; newShards?: number }> {
  try {
    const inventory = await getUserGachaInventory(userId);
    const cost = GACHA_CONFIG.UR_EXCHANGE_COST;

    // Check if already owned
    if (inventory.cards[collectionId]?.[cardImg]) {
      return { success: false, error: "Bạn đã sở hữu thẻ này!" };
    }

    // Check shards
    if (inventory.shards < cost) {
      return { success: false, error: `Không đủ mảnh! Cần ${cost} mảnh.` };
    }

    // Deduct shards and add card
    inventory.shards -= cost;
    if (!inventory.cards[collectionId]) {
      inventory.cards[collectionId] = {};
    }
    inventory.cards[collectionId][cardImg] = 1;

    // Save to Firebase
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { gachaInventory: inventory });

    return { success: true, newShards: inventory.shards };
  } catch (error) {
    console.error("Error exchanging shards:", error);
    return { success: false, error: "Có lỗi xảy ra!" };
  }
}
