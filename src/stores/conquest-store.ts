import { create } from "zustand";
import {
  AIQuestion,
  UserRank,
  generateAIQuestions,
  getRankFromPoints,
  calculateRankPoints,
  checkAnswer,
} from "@/services/ai-quiz-service";

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

  // Results
  results: { questionId: string; correct: boolean; points: number }[];

  // Actions
  startConquest: (initialPoints?: number) => Promise<void>;
  submitAnswer: (answer: string | string[]) => {
    correct: boolean;
    points: number;
  };
  nextQuestion: () => Promise<boolean>;
  endConquest: () => {
    totalScore: number;
    correct: number;
    wrong: number;
    pointsGained: number;
  };
  resetConquest: () => void;
}

const QUESTIONS_PER_ROUND = 5;

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
  results: [],

  startConquest: async (initialPoints = 0) => {
    set({ isLoading: true });

    const rank = getRankFromPoints(initialPoints);

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
        rankPoints: initialPoints,
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
    const { currentIndex, questions, rank } = get();
    const nextIndex = currentIndex + 1;

    if (nextIndex >= questions.length) {
      // Load thêm câu hỏi mới
      set({ isLoading: true });
      try {
        const newQuestions = await generateAIQuestions(
          rank,
          QUESTIONS_PER_ROUND
        );
        set({
          questions: newQuestions,
          currentIndex: 0,
          isLoading: false,
        });
        return true;
      } catch {
        set({ isLoading: false });
        return false;
      }
    }

    set({ currentIndex: nextIndex });
    return true;
  },

  endConquest: () => {
    const { score, correctCount, wrongCount, results } = get();
    const pointsGained = results.reduce((sum, r) => sum + r.points, 0);

    set({ isActive: false });

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
      results: [],
    });
  },
}));
