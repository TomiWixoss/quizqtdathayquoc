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
  hearts: number;
  maxHearts: number;
  lastHeartRefill: string;
  gems: number;
  dailyGoal: number;
  dailyProgress: number;
  achievements: string[];
  totalPlayTime: number;
  perfectLessons: number;
  longestStreak: number;
}

export interface ChapterProgress {
  completed: number;
  correct: number;
  bestScore: number;
  lastAttempt: string;
  stars: number;
  locked: boolean;
  isCompleted: boolean;
}

// Achievement Types - Using icon names from Lucide
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon:
    | "Target"
    | "Flame"
    | "Zap"
    | "Crown"
    | "BookOpen"
    | "Trophy"
    | "GraduationCap"
    | "Gem"
    | "Star"
    | "Sparkles"
    | "Medal"
    | "Coins";
  requirement: number;
  type: "streak" | "correct" | "perfect" | "level" | "gems" | "chapters";
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_quiz",
    name: "Khởi đầu",
    description: "Hoàn thành bài quiz đầu tiên",
    icon: "Target",
    requirement: 1,
    type: "correct",
  },
  {
    id: "streak_3",
    name: "Kiên trì",
    description: "Đạt streak 3 ngày",
    icon: "Flame",
    requirement: 3,
    type: "streak",
  },
  {
    id: "streak_7",
    name: "Tuần lễ hoàn hảo",
    description: "Đạt streak 7 ngày",
    icon: "Zap",
    requirement: 7,
    type: "streak",
  },
  {
    id: "streak_30",
    name: "Tháng vàng",
    description: "Đạt streak 30 ngày",
    icon: "Crown",
    requirement: 30,
    type: "streak",
  },
  {
    id: "correct_50",
    name: "Học sinh giỏi",
    description: "Trả lời đúng 50 câu",
    icon: "BookOpen",
    requirement: 50,
    type: "correct",
  },
  {
    id: "correct_100",
    name: "Xuất sắc",
    description: "Trả lời đúng 100 câu",
    icon: "Trophy",
    requirement: 100,
    type: "correct",
  },
  {
    id: "correct_500",
    name: "Bậc thầy",
    description: "Trả lời đúng 500 câu",
    icon: "GraduationCap",
    requirement: 500,
    type: "correct",
  },
  {
    id: "perfect_5",
    name: "Hoàn hảo",
    description: "5 bài quiz 100%",
    icon: "Gem",
    requirement: 5,
    type: "perfect",
  },
  {
    id: "perfect_20",
    name: "Siêu sao",
    description: "20 bài quiz 100%",
    icon: "Star",
    requirement: 20,
    type: "perfect",
  },
  {
    id: "level_5",
    name: "Cấp 5",
    description: "Đạt level 5",
    icon: "Sparkles",
    requirement: 5,
    type: "level",
  },
  {
    id: "level_10",
    name: "Cấp 10",
    description: "Đạt level 10",
    icon: "Medal",
    requirement: 10,
    type: "level",
  },
  {
    id: "gems_100",
    name: "Nhà giàu",
    description: "Sở hữu 100 gems",
    icon: "Coins",
    requirement: 100,
    type: "gems",
  },
];
