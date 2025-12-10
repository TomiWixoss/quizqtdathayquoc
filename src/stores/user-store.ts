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
};

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  initUser: async () => {
    set({ isLoading: true, error: null });
    try {
      const { userInfo } = await getUserInfo({});
      const userId = userInfo.id;

      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        set({ user: userSnap.data() as UserStats, isLoading: false });
      } else {
        const newUser: UserStats = {
          oderId: userId,
          odername: userInfo.name || "Người chơi",
          avatar: userInfo.avatar || "",
          ...DEFAULT_STATS,
        };
        await setDoc(userRef, newUser);
        set({ user: newUser, isLoading: false });
      }
    } catch (error) {
      console.error("Error init user:", error);
      // Fallback for development
      const fallbackUser: UserStats = {
        oderId: "dev_user_" + Date.now(),
        odername: "Dev User",
        avatar: "",
        ...DEFAULT_STATS,
      };
      set({ user: fallbackUser, isLoading: false });
    }
  },

  updateStats: async (correct, chapter, score) => {
    const { user } = get();
    if (!user) return;

    const updates = {
      totalScore: user.totalScore + score,
      totalCorrect: user.totalCorrect + (correct ? 1 : 0),
      totalWrong: user.totalWrong + (correct ? 0 : 1),
      exp: user.exp + (correct ? 10 : 2),
    };

    const newLevel = Math.floor(updates.exp / 100) + 1;

    try {
      const userRef = doc(db, "users", user.oderId);
      await updateDoc(userRef, { ...updates, level: newLevel });
      set({ user: { ...user, ...updates, level: newLevel } });
    } catch (error) {
      console.error("Error updating stats:", error);
      set({ user: { ...user, ...updates, level: newLevel } });
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
      console.error("Error updating chapter progress:", error);
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
      console.error("Error adding badge:", error);
      set({ user: { ...user, badges: newBadges } });
    }
  },

  updateStreak: async () => {
    const { user } = get();
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

    try {
      const userRef = doc(db, "users", user.oderId);
      await updateDoc(userRef, { streak: newStreak, lastPlayDate: today });
      set({ user: { ...user, streak: newStreak, lastPlayDate: today } });
    } catch (error) {
      console.error("Error updating streak:", error);
      set({ user: { ...user, streak: newStreak, lastPlayDate: today } });
    }
  },
}));
