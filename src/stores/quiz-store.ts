import { create } from "zustand";
import quizData from "@/data/quiz-data.json";
import type { Question, Chapter, QuizData } from "@/types/quiz";

interface QuizState {
  chapters: Chapter[];
  questions: Question[];
  currentChapter: number | null;
  currentQuestions: Question[];
  currentIndex: number;
  selectedAnswer: string | null;
  isAnswered: boolean;
  score: number;
  correctCount: number;
  wrongCount: number;
  quizMode: "chapter" | "random" | "all" | "timeattack" | "survival";
  timeLimit: number | null;
  maxWrong: number | null;

  // Actions
  loadQuiz: () => void;
  selectChapter: (chapterId: number) => void;
  startRandomQuiz: (count?: number) => void;
  startAllQuiz: () => void;
  startTimeAttack: (seconds: number) => void;
  startSurvival: (maxWrong: number) => void;
  selectAnswer: (answerId: string) => void;
  nextQuestion: () => void;
  resetQuiz: () => void;
  getChapterQuestions: (chapterId: number) => Question[];
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  chapters: [],
  questions: [],
  currentChapter: null,
  currentQuestions: [],
  currentIndex: 0,
  selectedAnswer: null,
  isAnswered: false,
  score: 0,
  correctCount: 0,
  wrongCount: 0,
  quizMode: "chapter",
  timeLimit: null,
  maxWrong: null,

  loadQuiz: () => {
    const data = quizData as QuizData;
    set({ chapters: data.chapters, questions: data.questions });
  },

  selectChapter: (chapterId) => {
    const { questions } = get();
    const chapterQuestions = shuffleArray(
      questions.filter((q) => q.chapter === chapterId)
    );
    set({
      currentChapter: chapterId,
      currentQuestions: chapterQuestions,
      currentIndex: 0,
      selectedAnswer: null,
      isAnswered: false,
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      quizMode: "chapter",
      timeLimit: null,
      maxWrong: null,
    });
  },

  startRandomQuiz: (count = 20) => {
    const { questions } = get();
    const randomQuestions = shuffleArray(questions).slice(0, count);
    set({
      currentChapter: null,
      currentQuestions: randomQuestions,
      currentIndex: 0,
      selectedAnswer: null,
      isAnswered: false,
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      quizMode: "random",
      timeLimit: null,
      maxWrong: null,
    });
  },

  startAllQuiz: () => {
    const { questions } = get();
    set({
      currentChapter: null,
      currentQuestions: shuffleArray(questions),
      currentIndex: 0,
      selectedAnswer: null,
      isAnswered: false,
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      quizMode: "all",
      timeLimit: null,
      maxWrong: null,
    });
  },

  startTimeAttack: (seconds) => {
    const { questions } = get();
    // Giới hạn tối đa 10 câu
    const randomQuestions = shuffleArray(questions).slice(0, 10);
    set({
      currentChapter: null,
      currentQuestions: randomQuestions,
      currentIndex: 0,
      selectedAnswer: null,
      isAnswered: false,
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      quizMode: "timeattack",
      timeLimit: seconds,
      maxWrong: null,
    });
  },

  startSurvival: (maxWrong) => {
    const { questions } = get();
    // Giới hạn tối đa 10 câu
    const randomQuestions = shuffleArray(questions).slice(0, 10);
    set({
      currentChapter: null,
      currentQuestions: randomQuestions,
      currentIndex: 0,
      selectedAnswer: null,
      isAnswered: false,
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      quizMode: "survival",
      timeLimit: null,
      maxWrong: maxWrong,
    });
  },

  selectAnswer: (answerId) => {
    const { isAnswered, currentQuestions, currentIndex } = get();
    if (isAnswered) return;

    const currentQ = currentQuestions[currentIndex];
    const isCorrect = answerId === currentQ.correctAnswer;

    set((state) => ({
      selectedAnswer: answerId,
      isAnswered: true,
      score: state.score + (isCorrect ? 10 : 0),
      correctCount: state.correctCount + (isCorrect ? 1 : 0),
      wrongCount: state.wrongCount + (isCorrect ? 0 : 1),
    }));
  },

  nextQuestion: () => {
    set((state) => ({
      currentIndex: state.currentIndex + 1,
      selectedAnswer: null,
      isAnswered: false,
    }));
  },

  resetQuiz: () => {
    set({
      currentChapter: null,
      currentQuestions: [],
      currentIndex: 0,
      selectedAnswer: null,
      isAnswered: false,
      score: 0,
      correctCount: 0,
      wrongCount: 0,
    });
  },

  getChapterQuestions: (chapterId) => {
    const { questions } = get();
    return questions.filter((q) => q.chapter === chapterId);
  },
}));
