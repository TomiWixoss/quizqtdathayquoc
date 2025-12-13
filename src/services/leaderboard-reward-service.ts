import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  setDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserStats } from "@/types/quiz";

// Icon types cho phần thưởng
export type RewardIcon = "crown" | "medal" | "trophy" | "star";

// Cấu hình phần thưởng BXH theo hạng mục (tăng đáng kể cho 233 gói thẻ)
export const LEADERBOARD_REWARDS = {
  conquest: {
    name: "Chinh Chiến",
    rewards: [
      {
        rank: 1,
        gems: 1500,
        title: "Top 1 Chinh Chiến",
        icon: "crown" as RewardIcon,
      },
      {
        rank: 2,
        gems: 1000,
        title: "Top 2 Chinh Chiến",
        icon: "medal" as RewardIcon,
      },
      {
        rank: 3,
        gems: 750,
        title: "Top 3 Chinh Chiến",
        icon: "medal" as RewardIcon,
      },
      {
        rank: [4, 10],
        gems: 400,
        title: "Top 4-10 Chinh Chiến",
        icon: "trophy" as RewardIcon,
      },
      {
        rank: [11, 20],
        gems: 200,
        title: "Top 11-20 Chinh Chiến",
        icon: "star" as RewardIcon,
      },
    ],
  },
  score: {
    name: "Điểm Tổng",
    rewards: [
      {
        rank: 1,
        gems: 1500,
        title: "Top 1 Điểm Tổng",
        icon: "crown" as RewardIcon,
      },
      {
        rank: 2,
        gems: 1000,
        title: "Top 2 Điểm Tổng",
        icon: "medal" as RewardIcon,
      },
      {
        rank: 3,
        gems: 750,
        title: "Top 3 Điểm Tổng",
        icon: "medal" as RewardIcon,
      },
      {
        rank: [4, 10],
        gems: 400,
        title: "Top 4-10 Điểm Tổng",
        icon: "trophy" as RewardIcon,
      },
      {
        rank: [11, 20],
        gems: 200,
        title: "Top 11-20 Điểm Tổng",
        icon: "star" as RewardIcon,
      },
    ],
  },
  urCards: {
    name: "Thẻ UR",
    rewards: [
      {
        rank: 1,
        gems: 1500,
        title: "Top 1 Thẻ UR",
        icon: "crown" as RewardIcon,
      },
      {
        rank: 2,
        gems: 1000,
        title: "Top 2 Thẻ UR",
        icon: "medal" as RewardIcon,
      },
      {
        rank: 3,
        gems: 750,
        title: "Top 3 Thẻ UR",
        icon: "medal" as RewardIcon,
      },
      {
        rank: [4, 10],
        gems: 400,
        title: "Top 4-10 Thẻ UR",
        icon: "trophy" as RewardIcon,
      },
      {
        rank: [11, 20],
        gems: 200,
        title: "Top 11-20 Thẻ UR",
        icon: "star" as RewardIcon,
      },
    ],
  },
};

// Lấy phần thưởng theo rank
export const getRewardForRank = (
  category: keyof typeof LEADERBOARD_REWARDS,
  rank: number
) => {
  const rewards = LEADERBOARD_REWARDS[category].rewards;
  for (const reward of rewards) {
    if (typeof reward.rank === "number" && reward.rank === rank) {
      return reward;
    }
    if (Array.isArray(reward.rank)) {
      const [min, max] = reward.rank;
      if (rank >= min && rank <= max) {
        return reward;
      }
    }
  }
  return null;
};

// Kiểm tra và gửi thưởng BXH hàng ngày
export const checkAndSendLeaderboardRewards = async (userId: string) => {
  const today = new Date().toDateString();

  // Kiểm tra đã gửi thưởng hôm nay chưa
  const rewardLogRef = doc(db, "leaderboardRewardLogs", `${userId}_${today}`);
  const rewardLogSnap = await getDoc(rewardLogRef);

  if (rewardLogSnap.exists()) {
    // Đã gửi thưởng hôm nay rồi
    return { sent: false, reason: "already_sent" };
  }

  // Lấy BXH từng hạng mục và kiểm tra rank của user
  const categories: Array<{
    key: keyof typeof LEADERBOARD_REWARDS;
    orderField: string;
  }> = [
    { key: "conquest", orderField: "conquestStats.rankPoints" },
    { key: "score", orderField: "totalScore" },
    { key: "urCards", orderField: "gachaInventory.gachaStats.totalURCards" },
  ];

  const rewardsToSend: Array<{
    category: string;
    rank: number;
    gems: number;
    title: string;
  }> = [];

  for (const { key, orderField } of categories) {
    try {
      const q = query(
        collection(db, "users"),
        orderBy(orderField, "desc"),
        limit(20)
      );
      const snapshot = await getDocs(q);
      const leaders = snapshot.docs.map((doc) => doc.data() as UserStats);

      // Tìm rank của user
      const userRank = leaders.findIndex((l) => l.oderId === userId) + 1;

      if (userRank > 0 && userRank <= 20) {
        const reward = getRewardForRank(key, userRank);
        if (reward) {
          rewardsToSend.push({
            category: LEADERBOARD_REWARDS[key].name,
            rank: userRank,
            gems: reward.gems,
            title: reward.title,
          });
        }
      }
    } catch (error) {
      console.error(`Error checking ${key} leaderboard:`, error);
    }
  }

  if (rewardsToSend.length === 0) {
    // Không có thưởng
    return { sent: false, reason: "no_rewards" };
  }

  // Gửi mail cho từng phần thưởng
  for (const reward of rewardsToSend) {
    await addDoc(collection(db, "mails"), {
      title: reward.title,
      content: `Chúc mừng bạn đã đạt hạng ${reward.rank} trong BXH ${reward.category}! Đây là phần thưởng xứng đáng cho nỗ lực của bạn.`,
      reward: reward.gems,
      active: true,
      createdAt: new Date().toISOString(),
      targetUserId: userId, // Mail riêng cho user này
      type: "leaderboard_reward",
    });
  }

  // Lưu log đã gửi thưởng
  await setDoc(rewardLogRef, {
    userId,
    date: today,
    rewards: rewardsToSend,
    sentAt: new Date().toISOString(),
  });

  return { sent: true, rewards: rewardsToSend };
};

// Lấy rank hiện tại của user trong tất cả BXH
export const getUserLeaderboardRanks = async (userId: string) => {
  const categories: Array<{
    key: keyof typeof LEADERBOARD_REWARDS;
    orderField: string;
  }> = [
    { key: "conquest", orderField: "conquestStats.rankPoints" },
    { key: "score", orderField: "totalScore" },
    { key: "urCards", orderField: "gachaInventory.gachaStats.totalURCards" },
  ];

  const ranks: Record<string, number | null> = {};

  for (const { key, orderField } of categories) {
    try {
      const q = query(
        collection(db, "users"),
        orderBy(orderField, "desc"),
        limit(50)
      );
      const snapshot = await getDocs(q);
      const leaders = snapshot.docs.map((doc) => doc.data() as UserStats);
      const userRank = leaders.findIndex((l) => l.oderId === userId) + 1;
      ranks[key] = userRank > 0 ? userRank : null;
    } catch {
      ranks[key] = null;
    }
  }

  return ranks;
};
