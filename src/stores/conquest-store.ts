import { create } from "zustand";
import { doc, updateDoc, collection, addDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  AIQuestion,
  UserRank,
  generateAIQuestions,
  getRankFromPoints,
  calculateRankPoints,
  checkAnswer,
} from "@/services/ai-quiz-service";
import type { ConquestStats, ConquestSession } from "@/types/quiz";
import { useUserStore } from "@/stores/user-store";

interface ConquestState {
  // Session state
  isActive: boolean;
  isLoading: boolean;
  questions: AIQuestion[];
  currentIndex: number;
  score: number;
  correctCount: number;
  wrongCount: number;
  startTime: number;

  // Rank state
  rank: UserRank;
  rankPoints: number;
  initialRankPoints: number;
  initialRankId: string;

  // User info for Firebase
  userId: string;

  // Results
  results: { questionId: string; correct: boolean; points: number }[];

  // Actions
  startConquest: (userId: string, initialPoints?: number) => Promise<void>;
  submitAnswer: (answer: string | string[]) => {
    correct: boolean;
    points: number;
  };
  nextQuestion: () => Promise<boolean>;
  endConquest: () => Promise<{
    totalScore: number;
    correct: number;
    wrong: number;
    pointsGained: number;
  }>;
  resetConquest: () => void;
  loadConquestStats: (userId: string) => Promise<ConquestStats | null>;
}

const QUESTIONS_PER_ROUND = 5;

const DEFAULT_CONQUEST_STATS: ConquestStats = {
  rankPoints: 0,
  highestRankId: "wood_1",
  totalConquests: 0,
  totalConquestCorrect: 0,
  totalConquestWrong: 0,
  bestWinStreak: 0,
  currentWinStreak: 0,
  lastConquestDate: "",
};

export const useConquestStore = create<ConquestState>((set, get) => ({
  isActive: false,
  isLoading: false,
  questions: [],
  currentIndex: 0,
  score: 0,
  correctCount: 0,
  wrongCount: 0,
  startTime: 0,
  rank: getRankFromPoints(0),
  rankPoints: 0,
  initialRankPoints: 0,
  initialRankId: "wood_1",
  userId: "",
  results: [],

  loadConquestStats: async (userId: string) => {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        return data.conquestStats || DEFAULT_CONQUEST_STATS;
      }
      return DEFAULT_CONQUEST_STATS;
    } catch (error) {
      console.error("Error loading conquest stats:", error);
      return DEFAULT_CONQUEST_STATS;
    }
  },

  startConquest: async (userId: string, initialPoints = 0) => {
    set({ isLoading: true });

    // Load conquest stats from Firebase
    const conquestStats = await get().loadConquestStats(userId);
    const actualPoints = conquestStats?.rankPoints || initialPoints;
    const rank = getRankFromPoints(actualPoints);

    try {
      const questions = await generateAIQuestions(rank, QUESTIONS_PER_ROUND);

      set({
        isActive: true,
        isLoading: false,
        questions,
        currentIndex: 0,
        score: 0,
        correctCount: 0,
        wrongCount: 0,
        startTime: Date.now(),
        rank,
        rankPoints: actualPoints,
        initialRankPoints: actualPoints,
        initialRankId: rank.rankId,
        userId,
        results: [],
      });
    } catch (error) {
      console.error("Error starting conquest:", error);
      set({ isLoading: false });
    }
  },

  submitAnswer: (answer) => {
    const {
      questions,
      currentIndex,
      rank,
      rankPoints,
      results,
      correctCount,
      wrongCount,
      score,
    } = get();
    const question = questions[currentIndex];

    if (!question) return { correct: false, points: 0 };

    const correct = checkAnswer(question, answer);
    const timeBonus = 0; // Có thể thêm logic time bonus sau
    const points = calculateRankPoints(correct, rank, timeBonus);

    const newRankPoints = Math.max(0, rankPoints + points);
    const newRank = getRankFromPoints(newRankPoints);

    set({
      correctCount: correct ? correctCount + 1 : correctCount,
      wrongCount: correct ? wrongCount : wrongCount + 1,
      score: score + (correct ? 10 : 0),
      rankPoints: newRankPoints,
      rank: newRank,
      results: [...results, { questionId: question.id, correct, points }],
    });

    return { correct, points };
  },

  nextQuestion: async () => {
    const { currentIndex, questions } = get();
    const nextIndex = currentIndex + 1;

    // Nếu hết câu hỏi, return false để kết thúc
    if (nextIndex >= questions.length) {
      return false;
    }

    set({ currentIndex: nextIndex });
    return true;
  },

  endConquest: async () => {
    const {
      score,
      correctCount,
      wrongCount,
      results,
      userId,
      rankPoints,
      rank,
      initialRankPoints,
      initialRankId,
      startTime,
    } = get();
    const pointsGained = results.reduce((sum, r) => sum + r.points, 0);
    const totalQuestions = correctCount + wrongCount;
    const accuracy =
      totalQuestions > 0
        ? Math.round((correctCount / totalQuestions) * 100)
        : 0;

    set({ isActive: false });

    // Sync to Firebase
    if (userId) {
      try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const currentStats: ConquestStats =
            userData.conquestStats || DEFAULT_CONQUEST_STATS;

          // Calculate new win streak
          const isWin = pointsGained > 0;
          const newWinStreak = isWin ? currentStats.currentWinStreak + 1 : 0;
          const bestWinStreak = Math.max(
            currentStats.bestWinStreak,
            newWinStreak
          );

          // Update conquest stats
          const newConquestStats: ConquestStats = {
            rankPoints: rankPoints,
            highestRankId:
              rankPoints > (currentStats.rankPoints || 0)
                ? rank.rankId
                : currentStats.highestRankId,
            totalConquests: currentStats.totalConquests + 1,
            totalConquestCorrect:
              currentStats.totalConquestCorrect + correctCount,
            totalConquestWrong: currentStats.totalConquestWrong + wrongCount,
            bestWinStreak,
            currentWinStreak: newWinStreak,
            lastConquestDate: new Date().toISOString(),
          };

          // Update user document with conquest stats
          // NOTE: totalScore là điểm từ luyện tập, KHÔNG ghi đè bằng rankPoints
          // Tính gems: base từ pointsGained + bonus nếu accuracy >= 90%
          let gemsEarned = Math.max(0, Math.floor(pointsGained / 10));
          if (accuracy >= 90 && correctCount >= 3) {
            gemsEarned += 5; // Bonus cho accuracy cao
          }

          // Áp dụng XP Boost multiplier
          const userStore = useUserStore.getState();
          const xpMultiplier = userStore.getXPMultiplier();
          const xpGained = correctCount * 10 * xpMultiplier;

          await updateDoc(userRef, {
            conquestStats: newConquestStats,
            totalCorrect: (userData.totalCorrect || 0) + correctCount,
            totalWrong: (userData.totalWrong || 0) + wrongCount,
            exp: (userData.exp || 0) + xpGained,
            gems: (userData.gems || 0) + gemsEarned,
          });

          // Save conquest session history
          const sessionData: ConquestSession = {
            oderId: userId,
            startTime: new Date(startTime).toISOString(),
            endTime: new Date().toISOString(),
            rankBefore: initialRankId,
            rankAfter: rank.rankId,
            pointsBefore: initialRankPoints,
            pointsAfter: rankPoints,
            pointsGained,
            correctCount,
            wrongCount,
            totalQuestions,
            accuracy,
          };

          await addDoc(collection(db, "conquestSessions"), sessionData);

          // Update quest progress
          await userStore.incrementDailyConquests();
          if (isWin) {
            await userStore.incrementWeeklyConquestWins();
          }

          console.log("Conquest synced to Firebase:", newConquestStats);
        }
      } catch (error) {
        console.error("Error syncing conquest to Firebase:", error);
      }
    }

    return {
      totalScore: score,
      correct: correctCount,
      wrong: wrongCount,
      pointsGained,
    };
  },

  resetConquest: () => {
    set({
      isActive: false,
      isLoading: false,
      questions: [],
      currentIndex: 0,
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      startTime: 0,
      initialRankPoints: 0,
      initialRankId: "wood_1",
      results: [],
    });
  },
}));
