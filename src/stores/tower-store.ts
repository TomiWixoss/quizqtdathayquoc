import { create } from "zustand";
import { persist } from "zustand/middleware";
import quizData from "@/data/quiz-data.json";
import type { Question, QuizData } from "@/types/quiz";

// Helper: Lấy timestamp của đầu tuần tiếp theo (Thứ 2, 00:00:00)
function getNextMondayTimestamp(): number {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = CN, 1 = T2, ...
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday.getTime();
}

// Helper: Kiểm tra xem đã qua tuần mới chưa (so với lastResetTime)
function shouldResetWeekly(lastResetTime: number | null): boolean {
  if (!lastResetTime) return false; // Lần đầu chơi, không reset

  const now = new Date();
  const lastReset = new Date(lastResetTime);

  // Tính đầu tuần hiện tại (Thứ 2)
  const currentWeekStart = new Date(now);
  const dayOfWeek = now.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  currentWeekStart.setDate(now.getDate() - daysFromMonday);
  currentWeekStart.setHours(0, 0, 0, 0);

  // Nếu lastResetTime trước đầu tuần hiện tại => cần reset
  return lastReset.getTime() < currentWeekStart.getTime();
}

interface TowerState {
  // Tower progress (persisted)
  currentFloor: number; // Tầng hiện tại đang ở (đã mở khóa)
  highestFloor: number; // Tầng cao nhất đã đạt được
  claimedFloors: number[]; // Các tầng đã nhận thưởng
  totalGemsEarned: number; // Tổng gems đã nhận từ tháp
  lastResetTime: number | null; // Thời gian reset cuối cùng

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
  getNextResetTime: () => number; // Lấy thời gian reset tiếp theo
}

// Tính gems cho mỗi tầng: tầng N = N * 25 gems (tăng từ 10)
export function getFloorReward(floor: number): number {
  return floor * 25;
}

export const useTowerStore = create<TowerState>()(
  persist(
    (set, get) => ({
      // Persisted state
      currentFloor: 1,
      highestFloor: 0,
      claimedFloors: [],
      totalGemsEarned: 0,
      lastResetTime: null,

      // Non-persisted state
      allQuestions: [],
      totalFloors: 0,
      activeFloor: null,
      currentQuestion: null,
      selectedAnswer: null,
      isAnswered: false,
      isCorrect: null,

      initTower: () => {
        const { lastResetTime } = get();
        const data = quizData as QuizData;

        // Kiểm tra reset tuần
        if (shouldResetWeekly(lastResetTime)) {
          set({
            currentFloor: 1,
            highestFloor: 0,
            claimedFloors: [],
            lastResetTime: Date.now(),
            allQuestions: data.questions,
            totalFloors: data.questions.length,
          });
        } else {
          // Nếu chưa có lastResetTime (lần đầu), set nó
          if (!lastResetTime) {
            set({
              lastResetTime: Date.now(),
              allQuestions: data.questions,
              totalFloors: data.questions.length,
            });
          } else {
            set({
              allQuestions: data.questions,
              totalFloors: data.questions.length,
            });
          }
        }
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
        const { activeFloor, highestFloor, totalFloors } = get();
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
          lastResetTime: Date.now(),
          allQuestions: data.questions,
          activeFloor: null,
          currentQuestion: null,
          selectedAnswer: null,
          isAnswered: false,
          isCorrect: null,
        });
      },

      getNextResetTime: () => {
        return getNextMondayTimestamp();
      },
    }),
    {
      name: "tower-storage",
      partialize: (state) => ({
        currentFloor: state.currentFloor,
        highestFloor: state.highestFloor,
        claimedFloors: state.claimedFloors,
        totalGemsEarned: state.totalGemsEarned,
        lastResetTime: state.lastResetTime,
      }),
    }
  )
);
