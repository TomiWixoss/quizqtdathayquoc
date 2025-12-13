import { create } from "zustand";
import { getUserInfo } from "zmp-sdk";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserStats, ChapterProgress, QuestProgress } from "@/types/quiz";

interface UserState {
  user: UserStats | null;
  isLoading: boolean;
  error: string | null;
  initUser: () => Promise<void>;
  updateUsername: (newName: string) => Promise<boolean>;
  updateStats: (
    correct: boolean,
    chapter: number,
    score: number
  ) => Promise<void>;
  updateChapterProgress: (
    chapter: number,
    progress: Partial<ChapterProgress>
  ) => Promise<void>;
  addBadge: (badge: string) => Promise<void>;
  updateStreak: () => Promise<void>;
  loseHeart: () => Promise<boolean>;
  refillHearts: () => Promise<void>;
  addGems: (amount: number) => Promise<void>;
  spendGems: (amount: number) => Promise<boolean>;
  updateDailyProgress: (xp: number) => Promise<void>;
  checkAchievements: () => Promise<string[]>;
  addPerfectLesson: () => Promise<void>;
  // Quest tracking methods
  updateQuestProgress: (updates: Partial<QuestProgress>) => Promise<void>;
  claimDailyQuest: (questId: string) => Promise<void>;
  claimWeeklyQuest: (questId: string) => Promise<void>;
  incrementDailyCorrect: () => Promise<void>;
  incrementDailyQuizzes: () => Promise<void>;
  incrementWeeklyXP: (xp: number) => Promise<void>;
  incrementWeeklyPerfect: () => Promise<void>;
  // Conquest quest methods
  incrementDailyConquests: () => Promise<void>;
  incrementWeeklyConquestWins: () => Promise<void>;
  // Gacha quest methods
  incrementDailyGachaPulls: (count?: number) => Promise<void>;
  // Claimed rewards methods
  claimAchievementReward: (achievementId: string) => Promise<void>;
  claimMail: (mailId: string) => Promise<void>;
  useRedeemCode: (codeId: string) => Promise<void>;

  // Unlimited hearts
  buyUnlimitedHearts: () => Promise<boolean>;
  hasUnlimitedHearts: () => boolean;
  getUnlimitedHeartsTimeLeft: () => string | null;

  // Cosmetics
  equipAvatar: (avatarUrl: string | null) => Promise<void>;
  equipFrame: (frameUrl: string | null) => Promise<void>;
  equipBadge: (badgeUrl: string | null) => Promise<void>;

  // XP Boost
  buyXPBoost: (hours: number) => Promise<boolean>;
  hasXPBoost: () => boolean;
  getXPBoostTimeLeft: () => string | null;
  getXPMultiplier: () => number;

  // Streak Freeze
  buyStreakFreeze: () => Promise<boolean>;
  useStreakFreeze: () => Promise<boolean>;
  getStreakFreezeCount: () => number;
}

const getWeekStart = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  return new Date(now.setDate(diff)).toDateString();
};

const DEFAULT_QUEST_PROGRESS: QuestProgress = {
  dailyCorrect: 0,
  dailyQuizzes: 0,
  dailyDate: new Date().toDateString(),
  weeklyXP: 0,
  weeklyPerfect: 0,
  weeklyStartDate: getWeekStart(),
  claimedDailyQuests: [],
  claimedWeeklyQuests: [],
  // Conquest quests
  dailyConquests: 0,
  weeklyConquests: 0,
  weeklyConquestWins: 0,
  // Gacha quests
  dailyGachaPulls: 0,
  weeklyGachaPulls: 0,
};

const DEFAULT_STATS: Omit<UserStats, "oderId" | "odername" | "avatar"> = {
  totalScore: 0,
  totalCorrect: 0,
  totalWrong: 0,
  totalQuizzes: 0,
  streak: 0,
  lastPlayDate: "",
  level: 1,
  exp: 0,
  badges: [],
  chapterProgress: {},
  hearts: 5,
  maxHearts: 5,
  lastHeartRefill: "",
  gems: 50,
  dailyGoal: 50,
  dailyProgress: 0,
  achievements: [],
  totalPlayTime: 0,
  perfectLessons: 0,
  longestStreak: 0,
  conquestStats: {
    rankPoints: 0,
    highestRankId: "wood_1",
    totalConquests: 0,
    totalConquestCorrect: 0,
    totalConquestWrong: 0,
    bestWinStreak: 0,
    currentWinStreak: 0,
    lastConquestDate: "",
  },
  questProgress: DEFAULT_QUEST_PROGRESS,
  claimedAchievementRewards: [],
  claimedMails: [],
  usedRedeemCodes: [],
  // Gacha inventory
  gachaInventory: {
    cards: {},
    rewards: [],
    shards: 0,
    totalPulls: 0,
    pityCounters: {},
    gachaStats: {
      totalNCards: 0,
      totalRCards: 0,
      totalSRCards: 0,
      totalURCards: 0,
      totalAvatars: 0,
      totalFrames: 0,
      totalBadges: 0,
      completedCollections: 0,
    },
  },
};

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  updateUsername: async (newName: string) => {
    const { user } = get();
    if (!user || !newName.trim()) return false;

    const trimmedName = newName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 20) return false;

    try {
      const userRef = doc(db, "users", user.oderId);
      await updateDoc(userRef, { odername: trimmedName });
      set({ user: { ...user, odername: trimmedName } });
      return true;
    } catch (error) {
      console.error("Error updating username:", error);
      return false;
    }
  },

  initUser: async () => {
    set({ isLoading: true, error: null });
    try {
      const { userInfo } = await getUserInfo({});
      const oderId = userInfo.id;
      const userRef = doc(db, "users", oderId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data() as UserStats;
        // Check heart refill (1 heart per 30 minutes)
        const now = Date.now();
        const lastRefill = data.lastHeartRefill
          ? new Date(data.lastHeartRefill).getTime()
          : 0;
        const hoursPassed = (now - lastRefill) / (1000 * 60 * 30);
        const heartsToAdd = Math.min(
          Math.floor(hoursPassed),
          data.maxHearts - data.hearts
        );
        if (heartsToAdd > 0) {
          data.hearts = Math.min(data.hearts + heartsToAdd, data.maxHearts);
          data.lastHeartRefill = new Date().toISOString();
          await updateDoc(userRef, {
            hearts: data.hearts,
            lastHeartRefill: data.lastHeartRefill,
          });
        }
        // Reset daily progress if new day
        const today = new Date().toDateString();
        const lastPlay = data.lastPlayDate
          ? new Date(data.lastPlayDate).toDateString()
          : "";
        if (lastPlay !== today) {
          data.dailyProgress = 0;
        }
        set({ user: data, isLoading: false });
      } else {
        const newUser: UserStats = {
          oderId,
          odername: userInfo.name || "Người chơi",
          avatar: userInfo.avatar || "",
          ...DEFAULT_STATS,
        };
        await setDoc(userRef, newUser);
        set({ user: newUser, isLoading: false });
      }
    } catch (error) {
      console.error("Error init user:", error);
      const fallbackUser: UserStats = {
        oderId: "dev_user_" + Date.now(),
        odername: "Dev User",
        avatar: "",
        ...DEFAULT_STATS,
      };
      set({ user: fallbackUser, isLoading: false });
    }
  },

  updateStats: async (correct, _chapter, score) => {
    const { user, checkAchievements, getXPMultiplier } = get();
    if (!user) return;

    // Áp dụng XP Boost multiplier
    const multiplier = getXPMultiplier();
    const baseXP = correct ? 10 : 2;
    const xpGain = baseXP * multiplier;

    const updates = {
      totalScore: user.totalScore + score,
      totalCorrect: user.totalCorrect + (correct ? 1 : 0),
      totalWrong: user.totalWrong + (correct ? 0 : 1),
      exp: user.exp + xpGain,
      gems: user.gems + (correct ? 10 : 0),
    };
    const newLevel = Math.floor(updates.exp / 100) + 1;

    try {
      const userRef = doc(db, "users", user.oderId);
      await updateDoc(userRef, { ...updates, level: newLevel });
      set({ user: { ...user, ...updates, level: newLevel } });
      await checkAchievements();
    } catch (error) {
      console.error("Error updating stats:", error);
      set({ user: { ...user, ...updates, level: newLevel } });
    }
  },

  loseHeart: async () => {
    const { user, hasUnlimitedHearts } = get();
    if (!user) return false;

    // Nếu có tim vô hạn, không mất tim
    if (hasUnlimitedHearts()) return true;

    if (user.hearts <= 0) return false;

    const newHearts = user.hearts - 1;
    try {
      const userRef = doc(db, "users", user.oderId);
      await updateDoc(userRef, { hearts: newHearts });
      set({ user: { ...user, hearts: newHearts } });
      return newHearts > 0;
    } catch (error) {
      set({ user: { ...user, hearts: newHearts } });
      return newHearts > 0;
    }
  },

  refillHearts: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.oderId);
      await updateDoc(userRef, {
        hearts: user.maxHearts,
        lastHeartRefill: new Date().toISOString(),
      });
      set({
        user: {
          ...user,
          hearts: user.maxHearts,
          lastHeartRefill: new Date().toISOString(),
        },
      });
    } catch (error) {
      set({ user: { ...user, hearts: user.maxHearts } });
    }
  },

  addGems: async (amount) => {
    const { user } = get();
    if (!user) return;

    const newGems = user.gems + amount;
    try {
      const userRef = doc(db, "users", user.oderId);
      await updateDoc(userRef, { gems: newGems });
      set({ user: { ...user, gems: newGems } });
    } catch (error) {
      set({ user: { ...user, gems: newGems } });
    }
  },

  spendGems: async (amount) => {
    const { user } = get();
    if (!user || user.gems < amount) return false;

    const newGems = user.gems - amount;
    try {
      const userRef = doc(db, "users", user.oderId);
      await updateDoc(userRef, { gems: newGems });
      set({ user: { ...user, gems: newGems } });
      return true;
    } catch (error) {
      set({ user: { ...user, gems: newGems } });
      return true;
    }
  },

  updateDailyProgress: async (xp) => {
    const { user } = get();
    if (!user) return;

    const newProgress = user.dailyProgress + xp;
    try {
      const userRef = doc(db, "users", user.oderId);
      await updateDoc(userRef, { dailyProgress: newProgress });
      set({ user: { ...user, dailyProgress: newProgress } });
    } catch (error) {
      set({ user: { ...user, dailyProgress: newProgress } });
    }
  },

  addPerfectLesson: async () => {
    const { user, checkAchievements } = get();
    if (!user) return;

    const newPerfect = user.perfectLessons + 1;
    const bonusGems = 50;
    try {
      const userRef = doc(db, "users", user.oderId);
      await updateDoc(userRef, {
        perfectLessons: newPerfect,
        gems: user.gems + bonusGems,
      });
      set({
        user: {
          ...user,
          perfectLessons: newPerfect,
          gems: user.gems + bonusGems,
        },
      });
      await checkAchievements();
    } catch (error) {
      set({
        user: {
          ...user,
          perfectLessons: newPerfect,
          gems: user.gems + bonusGems,
        },
      });
    }
  },

  updateChapterProgress: async (chapter, progress) => {
    const { user } = get();
    if (!user) return;

    const currentProgress = user.chapterProgress[chapter] || {
      completed: 0,
      correct: 0,
      bestScore: 0,
      lastAttempt: "",
      stars: 0,
      locked: false,
    };
    const newProgress = { ...currentProgress, ...progress };
    const newChapterProgress = {
      ...user.chapterProgress,
      [chapter]: newProgress,
    };

    try {
      const userRef = doc(db, "users", user.oderId);
      await updateDoc(userRef, { chapterProgress: newChapterProgress });
      set({ user: { ...user, chapterProgress: newChapterProgress } });
    } catch (error) {
      set({ user: { ...user, chapterProgress: newChapterProgress } });
    }
  },

  addBadge: async (badge) => {
    const { user } = get();
    if (!user || user.badges.includes(badge)) return;

    const newBadges = [...user.badges, badge];
    try {
      const userRef = doc(db, "users", user.oderId);
      await updateDoc(userRef, { badges: newBadges });
      set({ user: { ...user, badges: newBadges } });
    } catch (error) {
      set({ user: { ...user, badges: newBadges } });
    }
  },

  updateStreak: async () => {
    const { user, checkAchievements } = get();
    if (!user) return;

    const today = new Date().toDateString();
    const lastPlay = user.lastPlayDate
      ? new Date(user.lastPlayDate).toDateString()
      : "";
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    // Tính số ngày bỏ lỡ
    const lastPlayTime = user.lastPlayDate
      ? new Date(user.lastPlayDate).getTime()
      : 0;
    const todayTime = new Date(today).getTime();
    const daysMissed = lastPlayTime
      ? Math.floor((todayTime - lastPlayTime) / 86400000) - 1
      : 0;

    let newStreak = user.streak;
    let freezesUsed = 0;
    const availableFreezes = user.streakFreezes || 0;

    if (lastPlay === today) {
      // Đã chơi hôm nay rồi - không làm gì
      return;
    } else if (lastPlay === yesterday) {
      // Chơi liên tục - tăng streak
      newStreak += 1;
    } else if (daysMissed > 0 && availableFreezes >= daysMissed) {
      // Bỏ lỡ nhiều ngày nhưng có đủ streak freeze
      freezesUsed = daysMissed;
      newStreak += 1; // Vẫn tăng streak vì hôm nay chơi
    } else if (daysMissed > 0 && availableFreezes > 0) {
      // Bỏ lỡ nhiều ngày nhưng không đủ freeze - dùng hết freeze nhưng vẫn mất streak
      freezesUsed = availableFreezes;
      newStreak = 1;
    } else if (lastPlay !== today) {
      // Bỏ lỡ và không có freeze - reset streak
      newStreak = 1;
    }

    // Trừ streak freeze đã dùng
    const newFreezeCount = availableFreezes - freezesUsed;

    const longestStreak = Math.max(user.longestStreak, newStreak);
    const bonusGems = newStreak % 7 === 0 ? 100 : 0; // Bonus every 7 days

    try {
      const userRef = doc(db, "users", user.oderId);
      await updateDoc(userRef, {
        streak: newStreak,
        lastPlayDate: today,
        longestStreak,
        gems: user.gems + bonusGems,
        streakFreezes: newFreezeCount,
        // Lưu thông tin freeze đã dùng để hiển thị thông báo
        lastStreakFreezeUsed: freezesUsed > 0 ? freezesUsed : null,
      });
      set({
        user: {
          ...get().user!,
          streak: newStreak,
          lastPlayDate: today,
          longestStreak,
          gems: get().user!.gems + bonusGems,
          streakFreezes: newFreezeCount,
          lastStreakFreezeUsed: freezesUsed > 0 ? freezesUsed : undefined,
        },
      });
      await checkAchievements();

      // Log nếu đã dùng streak freeze
      if (freezesUsed > 0) {
        console.log(`Đã sử dụng ${freezesUsed} Streak Freeze tự động!`);
      }
    } catch (error) {
      set({
        user: {
          ...user,
          streak: newStreak,
          lastPlayDate: today,
          longestStreak,
          streakFreezes: newFreezeCount,
        },
      });
    }
  },

  checkAchievements: async () => {
    const { user } = get();
    if (!user) return [];

    const { ACHIEVEMENTS } = await import("@/types/quiz");
    const newAchievements: string[] = [];

    for (const achievement of ACHIEVEMENTS) {
      if (user.achievements.includes(achievement.id)) continue;

      let earned = false;
      const gachaStats = user.gachaInventory?.gachaStats;
      const totalCards =
        (gachaStats?.totalURCards ?? 0) +
        (gachaStats?.totalSRCards ?? 0) +
        (gachaStats?.totalRCards ?? 0) +
        (gachaStats?.totalNCards ?? 0);

      switch (achievement.type) {
        case "streak":
          earned = user.streak >= achievement.requirement;
          break;
        case "correct":
          earned = user.totalCorrect >= achievement.requirement;
          break;
        case "perfect":
          earned = (user.perfectLessons ?? 0) >= achievement.requirement;
          break;
        case "level":
          earned = (user.level ?? 1) >= achievement.requirement;
          break;
        case "conquest":
          earned =
            (user.conquestStats?.totalConquests ?? 0) >=
            achievement.requirement;
          break;
        case "conquest_wins":
          earned =
            (user.conquestStats?.bestWinStreak ?? 0) >= achievement.requirement;
          break;
        case "rank_points":
          earned =
            (user.conquestStats?.rankPoints ?? 0) >= achievement.requirement;
          break;
        case "gems":
          earned = user.gems >= achievement.requirement;
          break;
        // Gacha achievements
        case "gacha_pulls":
          earned =
            (user.gachaInventory?.totalPulls ?? 0) >= achievement.requirement;
          break;
        case "gacha_ur":
          earned = (gachaStats?.totalURCards ?? 0) >= achievement.requirement;
          break;
        case "gacha_sr":
          earned = (gachaStats?.totalSRCards ?? 0) >= achievement.requirement;
          break;
        case "gacha_total_cards":
          earned = totalCards >= achievement.requirement;
          break;
        case "gacha_collections":
          earned =
            (gachaStats?.completedCollections ?? 0) >= achievement.requirement;
          break;
      }

      if (earned) {
        newAchievements.push(achievement.id);
        const newAchievementsList = [...user.achievements, achievement.id];
        try {
          const userRef = doc(db, "users", user.oderId);
          await updateDoc(userRef, {
            achievements: newAchievementsList,
            gems: user.gems + 10,
          });
          set({
            user: {
              ...user,
              achievements: newAchievementsList,
              gems: user.gems + 10,
            },
          });
        } catch (error) {
          set({ user: { ...user, achievements: newAchievementsList } });
        }
      }
    }
    return newAchievements;
  },

  // Quest tracking methods
  updateQuestProgress: async (updates) => {
    const { user } = get();
    if (!user) return;

    const currentProgress = user.questProgress || DEFAULT_QUEST_PROGRESS;
    const today = new Date().toDateString();
    const weekStart = getWeekStart();

    // Reset daily if new day
    let newProgress = { ...currentProgress };
    if (currentProgress.dailyDate !== today) {
      newProgress = {
        ...newProgress,
        dailyCorrect: 0,
        dailyQuizzes: 0,
        dailyDate: today,
        claimedDailyQuests: [],
      };
    }

    // Reset weekly if new week
    if (currentProgress.weeklyStartDate !== weekStart) {
      newProgress = {
        ...newProgress,
        weeklyXP: 0,
        weeklyPerfect: 0,
        weeklyStartDate: weekStart,
        claimedWeeklyQuests: [],
      };
    }

    newProgress = { ...newProgress, ...updates };

    try {
      const userRef = doc(db, "users", user.oderId);
      await updateDoc(userRef, { questProgress: newProgress });
      set({ user: { ...user, questProgress: newProgress } });
    } catch (error) {
      console.error("Error updating quest progress:", error);
      set({ user: { ...user, questProgress: newProgress } });
    }
  },

  claimDailyQuest: async (questId) => {
    const { user, updateQuestProgress } = get();
    if (!user) return;

    const currentProgress = user.questProgress || DEFAULT_QUEST_PROGRESS;
    const newClaimed = [...currentProgress.claimedDailyQuests, questId];
    await updateQuestProgress({ claimedDailyQuests: newClaimed });
  },

  claimWeeklyQuest: async (questId) => {
    const { user, updateQuestProgress } = get();
    if (!user) return;

    const currentProgress = user.questProgress || DEFAULT_QUEST_PROGRESS;
    const newClaimed = [...currentProgress.claimedWeeklyQuests, questId];
    await updateQuestProgress({ claimedWeeklyQuests: newClaimed });
  },

  incrementDailyCorrect: async () => {
    const { user, updateQuestProgress } = get();
    if (!user) return;

    const currentProgress = user.questProgress || DEFAULT_QUEST_PROGRESS;
    await updateQuestProgress({
      dailyCorrect: currentProgress.dailyCorrect + 1,
    });
  },

  incrementDailyQuizzes: async () => {
    const { user, updateQuestProgress } = get();
    if (!user) return;

    const currentProgress = user.questProgress || DEFAULT_QUEST_PROGRESS;
    await updateQuestProgress({
      dailyQuizzes: currentProgress.dailyQuizzes + 1,
    });
  },

  incrementWeeklyXP: async (xp) => {
    const { user, updateQuestProgress } = get();
    if (!user) return;

    const currentProgress = user.questProgress || DEFAULT_QUEST_PROGRESS;
    await updateQuestProgress({ weeklyXP: currentProgress.weeklyXP + xp });
  },

  incrementWeeklyPerfect: async () => {
    const { user, updateQuestProgress } = get();
    if (!user) return;

    const currentProgress = user.questProgress || DEFAULT_QUEST_PROGRESS;
    await updateQuestProgress({
      weeklyPerfect: currentProgress.weeklyPerfect + 1,
    });
  },

  // Conquest quest methods
  incrementDailyConquests: async () => {
    const { user, updateQuestProgress } = get();
    if (!user) return;

    const currentProgress = user.questProgress || DEFAULT_QUEST_PROGRESS;
    await updateQuestProgress({
      dailyConquests: (currentProgress.dailyConquests || 0) + 1,
      weeklyConquests: (currentProgress.weeklyConquests || 0) + 1,
    });
  },

  incrementWeeklyConquestWins: async () => {
    const { user, updateQuestProgress } = get();
    if (!user) return;

    const currentProgress = user.questProgress || DEFAULT_QUEST_PROGRESS;
    await updateQuestProgress({
      weeklyConquestWins: (currentProgress.weeklyConquestWins || 0) + 1,
    });
  },

  // Gacha quest methods
  incrementDailyGachaPulls: async (count: number = 1) => {
    const { user, updateQuestProgress } = get();
    if (!user) return;

    const currentProgress = user.questProgress || DEFAULT_QUEST_PROGRESS;
    await updateQuestProgress({
      dailyGachaPulls: (currentProgress.dailyGachaPulls || 0) + count,
      weeklyGachaPulls: (currentProgress.weeklyGachaPulls || 0) + count,
    });
  },

  // Claimed rewards methods
  claimAchievementReward: async (achievementId) => {
    // Lấy user mới nhất từ store để tránh race condition
    const user = get().user;
    if (!user) return;

    const currentClaimed = user.claimedAchievementRewards || [];
    if (currentClaimed.includes(achievementId)) return;

    const newClaimed = [...currentClaimed, achievementId];
    try {
      const userRef = doc(db, "users", user.oderId);
      await updateDoc(userRef, { claimedAchievementRewards: newClaimed });
      // Lấy lại user mới nhất trước khi set để giữ các thay đổi khác (như gems)
      const latestUser = get().user;
      if (latestUser) {
        set({ user: { ...latestUser, claimedAchievementRewards: newClaimed } });
      }
    } catch (error) {
      console.error("Error claiming achievement reward:", error);
      const latestUser = get().user;
      if (latestUser) {
        set({ user: { ...latestUser, claimedAchievementRewards: newClaimed } });
      }
    }
  },

  claimMail: async (mailId) => {
    const { user } = get();
    if (!user) return;

    const currentClaimed = user.claimedMails || [];
    if (currentClaimed.includes(mailId)) return;

    const newClaimed = [...currentClaimed, mailId];
    try {
      const userRef = doc(db, "users", user.oderId);
      await updateDoc(userRef, { claimedMails: newClaimed });
      set({ user: { ...user, claimedMails: newClaimed } });
    } catch (error) {
      console.error("Error claiming mail:", error);
      set({ user: { ...user, claimedMails: newClaimed } });
    }
  },

  useRedeemCode: async (codeId) => {
    const { user } = get();
    if (!user) return;

    const currentUsed = user.usedRedeemCodes || [];
    if (currentUsed.includes(codeId)) return;

    const newUsed = [...currentUsed, codeId];
    try {
      const userRef = doc(db, "users", user.oderId);
      await updateDoc(userRef, { usedRedeemCodes: newUsed });
      set({ user: { ...user, usedRedeemCodes: newUsed } });
    } catch (error) {
      console.error("Error using redeem code:", error);
      set({ user: { ...user, usedRedeemCodes: newUsed } });
    }
  },

  // Unlimited hearts methods
  buyUnlimitedHearts: async () => {
    const { user, spendGems } = get();
    if (!user) return false;

    const UNLIMITED_HEARTS_COST = 3000;
    const UNLIMITED_HEARTS_DURATION = 24 * 60 * 60 * 1000; // 1 day (24 hours) in ms

    if (user.gems < UNLIMITED_HEARTS_COST) return false;

    const success = await spendGems(UNLIMITED_HEARTS_COST);
    if (!success) return false;

    const unlimitedHeartsUntil = new Date(
      Date.now() + UNLIMITED_HEARTS_DURATION
    ).toISOString();

    try {
      const userRef = doc(db, "users", user.oderId);
      await updateDoc(userRef, { unlimitedHeartsUntil });
      set({
        user: { ...get().user!, unlimitedHeartsUntil },
      });
      return true;
    } catch (error) {
      console.error("Error buying unlimited hearts:", error);
      return false;
    }
  },

  hasUnlimitedHearts: () => {
    const { user } = get();
    if (!user?.unlimitedHeartsUntil) return false;

    const until = new Date(user.unlimitedHeartsUntil).getTime();
    return Date.now() < until;
  },

  getUnlimitedHeartsTimeLeft: () => {
    const { user } = get();
    if (!user?.unlimitedHeartsUntil) return null;

    const until = new Date(user.unlimitedHeartsUntil).getTime();
    const remaining = until - Date.now();

    if (remaining <= 0) return null;

    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / 60000);
    return `${hours}h ${minutes}m`;
  },

  // Cosmetics methods
  equipAvatar: async (avatarUrl: string | null) => {
    const { user } = get();
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.oderId);
      await updateDoc(userRef, { equippedAvatar: avatarUrl || null });
      set({ user: { ...user, equippedAvatar: avatarUrl || undefined } });
    } catch (error) {
      console.error("Error equipping avatar:", error);
      set({ user: { ...user, equippedAvatar: avatarUrl || undefined } });
    }
  },

  equipFrame: async (frameUrl: string | null) => {
    const { user } = get();
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.oderId);
      await updateDoc(userRef, { equippedFrame: frameUrl || null });
      set({ user: { ...user, equippedFrame: frameUrl || undefined } });
    } catch (error) {
      console.error("Error equipping frame:", error);
      set({ user: { ...user, equippedFrame: frameUrl || undefined } });
    }
  },

  equipBadge: async (badgeUrl: string | null) => {
    const { user } = get();
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.oderId);
      await updateDoc(userRef, { equippedBadge: badgeUrl || null });
      set({ user: { ...user, equippedBadge: badgeUrl || undefined } });
    } catch (error) {
      console.error("Error equipping badge:", error);
      set({ user: { ...user, equippedBadge: badgeUrl || undefined } });
    }
  },

  // XP Boost methods
  buyXPBoost: async (hours: number) => {
    const { user, spendGems } = get();
    if (!user) return false;

    // Giá theo giờ: 1h = 500, 3h = 1200, 8h = 2500
    const prices: Record<number, number> = {
      1: 500,
      3: 1200,
      8: 2500,
    };
    const cost = prices[hours];
    if (!cost || user.gems < cost) return false;

    const success = await spendGems(cost);
    if (!success) return false;

    // Nếu đang có boost, cộng thêm thời gian
    const currentUntil = user.xpBoostUntil
      ? new Date(user.xpBoostUntil).getTime()
      : Date.now();
    const baseTime = currentUntil > Date.now() ? currentUntil : Date.now();
    const xpBoostUntil = new Date(
      baseTime + hours * 60 * 60 * 1000
    ).toISOString();

    try {
      const userRef = doc(db, "users", user.oderId);
      await updateDoc(userRef, { xpBoostUntil, xpBoostMultiplier: 2 });
      set({
        user: { ...get().user!, xpBoostUntil, xpBoostMultiplier: 2 },
      });
      return true;
    } catch (error) {
      console.error("Error buying XP boost:", error);
      return false;
    }
  },

  hasXPBoost: () => {
    const { user } = get();
    if (!user?.xpBoostUntil) return false;
    return Date.now() < new Date(user.xpBoostUntil).getTime();
  },

  getXPBoostTimeLeft: () => {
    const { user } = get();
    if (!user?.xpBoostUntil) return null;

    const until = new Date(user.xpBoostUntil).getTime();
    const remaining = until - Date.now();

    if (remaining <= 0) return null;

    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / 60000);
    return `${hours}h ${minutes}m`;
  },

  getXPMultiplier: () => {
    const { hasXPBoost, user } = get();
    if (!hasXPBoost()) return 1;
    return user?.xpBoostMultiplier || 2;
  },

  // Streak Freeze methods
  buyStreakFreeze: async () => {
    const { user, spendGems } = get();
    if (!user) return false;

    const STREAK_FREEZE_COST = 1000;
    const MAX_STREAK_FREEZES = 5;

    const currentFreezes = user.streakFreezes || 0;
    if (currentFreezes >= MAX_STREAK_FREEZES) return false;
    if (user.gems < STREAK_FREEZE_COST) return false;

    const success = await spendGems(STREAK_FREEZE_COST);
    if (!success) return false;

    const newFreezes = currentFreezes + 1;

    try {
      const userRef = doc(db, "users", user.oderId);
      await updateDoc(userRef, { streakFreezes: newFreezes });
      set({ user: { ...get().user!, streakFreezes: newFreezes } });
      return true;
    } catch (error) {
      console.error("Error buying streak freeze:", error);
      return false;
    }
  },

  useStreakFreeze: async () => {
    const { user } = get();
    if (!user) return false;

    const currentFreezes = user.streakFreezes || 0;
    if (currentFreezes <= 0) return false;

    const newFreezes = currentFreezes - 1;

    try {
      const userRef = doc(db, "users", user.oderId);
      await updateDoc(userRef, { streakFreezes: newFreezes });
      set({ user: { ...user, streakFreezes: newFreezes } });
      return true;
    } catch (error) {
      console.error("Error using streak freeze:", error);
      return false;
    }
  },

  getStreakFreezeCount: () => {
    const { user } = get();
    return user?.streakFreezes || 0;
  },
}));
