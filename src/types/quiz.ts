// Quiz Types
export interface QuizOption {
  id: string;
  text: string;
}

export interface Question {
  id: number;
  question: string;
  options: QuizOption[];
  correctAnswer: string;
  chapter: number;
  chapterName: string;
}

export interface Chapter {
  id: number;
  name: string;
  totalQuestions: number;
  icon: string;
}

export interface QuizData {
  chapters: Chapter[];
  questions: Question[];
}

// User & Gamification Types
export interface UserStats {
  oderId: string;
  odername: string;
  avatar: string;
  totalScore: number;
  totalCorrect: number;
  totalWrong: number;
  totalQuizzes: number;
  streak: number;
  lastPlayDate: string;
  level: number;
  exp: number;
  badges: string[];
  chapterProgress: Record<number, ChapterProgress>;
}

export interface ChapterProgress {
  completed: number;
  correct: number;
  bestScore: number;
  lastAttempt: string;
}
