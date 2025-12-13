import { create } from "zustand";
import { persist } from "zustand/middleware";
import quizData from "@/data/quiz-data.json";
import type { Question, QuizData } from "@/types/quiz";

interface TowerState {
  // Tower progress (persisted)
  currentFloor: number; // Tầng hiện tại đang ở (đã mở khóa)
  highestFloor: number; // Tầng cao nhất đã đạt được
  claimedFloors: number[]; // Các tầng đã nhận thưởng
  totalGemsEarned: number; // Tổng gems đã nhận từ tháp

  // Quiz state (not persisted)
  allQuestions: Question[];
  totalFloors: number;
  activeFloor: number | null; // Tầng đang làm quiz
  currentQuestion: Question | null;
  selectedAnswer: string | null;
  isAnswered: boolean;
  isCorrect: boolean | null;

  // Actions
  initTower: () => void;
  startFloor: (floor: number) => void;
  selectAnswer: (answerId: string) => void;
  completeFloor: () => { gems: number; isNewRecord: boolean };
  failFloor: () => void;
  claimReward: (floor: number) => number;
  exitQuiz: () => void;
  resetTower: () => void; // Reset toàn bộ tiến trình
}

// Tính gems cho mỗi tầng: tầng N = N * 10 gems
export function getFloorReward(floor: number): number {
  return floor * 10;
}

export const useTowerStore = create<TowerState>()(
  persist(
    (set, get) => ({
      // Persisted state
      currentFloor: 1,
      highestFloor: 0,
      claimedFloors: [],
      totalGemsEarned: 0,

      // Non-persisted state
      allQuestions: [],
      totalFloors: 0,
      activeFloor: null,
      currentQuestion: null,
      selectedAnswer: null,
      isAnswered: false,
      isCorrect: null,

      initTower: () => {
        const data = quizData as QuizData;
        // Giữ nguyên thứ tự câu hỏi, không shuffle
        set({
          allQuestions: data.questions,
          totalFloors: data.questions.length,
        });
      },

      startFloor: (floor: number) => {
        const { allQuestions, currentFloor } = get();

        // Chỉ có thể bắt đầu tầng hiện tại hoặc thấp hơn
        if (floor > currentFloor || floor < 1) return;

        // Lấy câu hỏi cho tầng này (index = floor - 1)
        const question = allQuestions[floor - 1];
        if (!question) return;

        set({
          activeFloor: floor,
          currentQuestion: question,
          selectedAnswer: null,
          isAnswered: false,
          isCorrect: null,
        });
      },

      selectAnswer: (answerId: string) => {
        const { isAnswered, currentQuestion } = get();
        if (isAnswered || !currentQuestion) return;

        const isCorrect = answerId === currentQuestion.correctAnswer;

        set({
          selectedAnswer: answerId,
          isAnswered: true,
          isCorrect,
        });
      },

      completeFloor: () => {
        const { activeFloor, highestFloor, currentFloor, totalFloors } = get();
        if (!activeFloor) return { gems: 0, isNewRecord: false };

        const isNewRecord = activeFloor > highestFloor;
        const nextFloor = Math.min(activeFloor + 1, totalFloors);

        set({
          currentFloor: nextFloor,
          highestFloor: isNewRecord ? activeFloor : highestFloor,
        });

        return {
          gems: getFloorReward(activeFloor),
          isNewRecord,
        };
      },

      failFloor: () => {
        // Rớt xuống tầng 1
        set({
          currentFloor: 1,
          activeFloor: null,
          currentQuestion: null,
          selectedAnswer: null,
          isAnswered: false,
          isCorrect: null,
        });
      },

      claimReward: (floor: number) => {
        const { claimedFloors, totalGemsEarned, highestFloor } = get();

        // Chỉ claim được nếu đã vượt qua tầng đó và chưa claim
        if (floor > highestFloor || claimedFloors.includes(floor)) {
          return 0;
        }

        const gems = getFloorReward(floor);

        set({
          claimedFloors: [...claimedFloors, floor],
          totalGemsEarned: totalGemsEarned + gems,
        });

        return gems;
      },

      exitQuiz: () => {
        set({
          activeFloor: null,
          currentQuestion: null,
          selectedAnswer: null,
          isAnswered: false,
          isCorrect: null,
        });
      },

      resetTower: () => {
        const data = quizData as QuizData;

        set({
          currentFloor: 1,
          highestFloor: 0,
          claimedFloors: [],
          totalGemsEarned: 0,
          allQuestions: data.questions,
          activeFloor: null,
          currentQuestion: null,
          selectedAnswer: null,
          isAnswered: false,
          isCorrect: null,
        });
      },
    }),
    {
      name: "tower-storage",
      partialize: (state) => ({
        currentFloor: state.currentFloor,
        highestFloor: state.highestFloor,
        claimedFloors: state.claimedFloors,
        totalGemsEarned: state.totalGemsEarned,
      }),
    }
  )
);
