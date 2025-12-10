import { create } from "zustand";
import { getUserInfo } from "zmp-sdk";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserStats, ChapterProgress } from "@/types/quiz";

interface UserState {
  user: UserStats | null;
  isLoading: boolean;
  error: string | null;
  initUser: () => Promise<void>;
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
}

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
};

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

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
    const { user, checkAchievements } = get();
    if (!user) return;

    const xpGain = correct ? 10 : 2;
    const updates = {
      totalScore: user.totalScore + score,
      totalCorrect: user.totalCorrect + (correct ? 1 : 0),
      totalWrong: user.totalWrong + (correct ? 0 : 1),
      exp: user.exp + xpGain,
      gems: user.gems + (correct ? 1 : 0),
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
    const { user } = get();
    if (!user || user.hearts <= 0) return false;

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
    const bonusGems = 5;
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

    let newStreak = user.streak;
    if (lastPlay === yesterday) {
      newStreak += 1;
    } else if (lastPlay !== today) {
      newStreak = 1;
    }

    const longestStreak = Math.max(user.longestStreak, newStreak);
    const bonusGems = newStreak % 7 === 0 ? 10 : 0; // Bonus every 7 days

    try {
      const userRef = doc(db, "users", user.oderId);
      await updateDoc(userRef, {
        streak: newStreak,
        lastPlayDate: today,
        longestStreak,
        gems: user.gems + bonusGems,
      });
      set({
        user: {
          ...user,
          streak: newStreak,
          lastPlayDate: today,
          longestStreak,
          gems: user.gems + bonusGems,
        },
      });
      await checkAchievements();
    } catch (error) {
      set({
        user: {
          ...user,
          streak: newStreak,
          lastPlayDate: today,
          longestStreak,
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
      switch (achievement.type) {
        case "streak":
          earned = user.streak >= achievement.requirement;
          break;
        case "correct":
          earned = user.totalCorrect >= achievement.requirement;
          break;
        case "perfect":
          earned = user.perfectLessons >= achievement.requirement;
          break;
        case "level":
          earned = user.level >= achievement.requirement;
          break;
        case "gems":
          earned = user.gems >= achievement.requirement;
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
}));
