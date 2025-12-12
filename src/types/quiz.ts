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
  // Conquest/Chinh Chiến stats
  conquestStats?: ConquestStats;
  // Quest tracking (synced to Firebase)
  questProgress?: QuestProgress;
  // Claimed rewards tracking
  claimedAchievementRewards?: string[];
  claimedMails?: string[];
  usedRedeemCodes?: string[];
  // Minigame tracking
  lastSpinTime?: string;
  minigameStats?: MinigameStats;
  // Unlimited hearts
  unlimitedHeartsUntil?: string;
}

// Quest Progress Types
export interface QuestProgress {
  dailyCorrect: number;
  dailyQuizzes: number;
  dailyDate: string;
  weeklyXP: number;
  weeklyPerfect: number;
  weeklyStartDate: string;
  claimedDailyQuests: string[];
  claimedWeeklyQuests: string[];
}

// Minigame Stats Types
export interface MinigameStats {
  spin: {
    totalSpins: number;
    totalGemsEarned: number;
    lastSpinTime: string;
  };
  caro: {
    gamesPlayed: number;
    wins: number;
    losses: number;
    totalGemsEarned: number;
    bestDifficulty: string;
  };
  memory: {
    gamesPlayed: number;
    wins: number;
    totalGemsEarned: number;
    bestTime: number;
  };
  game2048: {
    gamesPlayed: number;
    wins: number;
    totalGemsEarned: number;
    bestTile: number;
    bestScore: number;
  };
}

// Conquest/Chinh Chiến Types
export interface ConquestStats {
  rankPoints: number;
  highestRankId: string;
  totalConquests: number;
  totalConquestCorrect: number;
  totalConquestWrong: number;
  bestWinStreak: number;
  currentWinStreak: number;
  lastConquestDate: string;
}

export interface ConquestSession {
  oderId: string;
  startTime: string;
  endTime: string;
  rankBefore: string;
  rankAfter: string;
  pointsBefore: number;
  pointsAfter: number;
  pointsGained: number;
  correctCount: number;
  wrongCount: number;
  totalQuestions: number;
  accuracy: number;
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
    | "Coins"
    | "Swords"
    | "Shield"
    | "Award"
    | "Gamepad2"
    | "Brain"
    | "Dices"
    | "Grid2X2";
  requirement: number;
  type:
    | "streak"
    | "correct"
    | "perfect"
    | "level"
    | "gems"
    | "chapters"
    | "conquest"
    | "conquest_wins"
    | "rank_points"
    | "spin"
    | "caro_wins"
    | "memory_wins"
    | "game2048_tile";
}

export const ACHIEVEMENTS: Achievement[] = [
  // Streak achievements
  {
    id: "first_quiz",
    name: "Khởi đầu",
    description: "Trả lời đúng câu đầu tiên",
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
  // Correct answers achievements
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
    id: "correct_1000",
    name: "Huyền thoại",
    description: "Trả lời đúng 1000 câu",
    icon: "Crown",
    requirement: 1000,
    type: "correct",
  },
  // Perfect quiz achievements
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
    id: "perfect_50",
    name: "Thiên tài",
    description: "50 bài quiz 100%",
    icon: "Sparkles",
    requirement: 50,
    type: "perfect",
  },
  // Level achievements
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
    id: "level_20",
    name: "Cấp 20",
    description: "Đạt level 20",
    icon: "Trophy",
    requirement: 20,
    type: "level",
  },
  // Gems achievements
  {
    id: "gems_100",
    name: "Nhà giàu",
    description: "Sở hữu 100 gems",
    icon: "Coins",
    requirement: 100,
    type: "gems",
  },
  {
    id: "gems_500",
    name: "Triệu phú",
    description: "Sở hữu 500 gems",
    icon: "Gem",
    requirement: 500,
    type: "gems",
  },
  {
    id: "gems_1000",
    name: "Tỷ phú",
    description: "Sở hữu 1000 gems",
    icon: "Crown",
    requirement: 1000,
    type: "gems",
  },
  // Conquest achievements
  {
    id: "conquest_first",
    name: "Chiến binh",
    description: "Hoàn thành trận Chinh Chiến đầu tiên",
    icon: "Swords",
    requirement: 1,
    type: "conquest",
  },
  {
    id: "conquest_10",
    name: "Dũng sĩ",
    description: "Hoàn thành 10 trận Chinh Chiến",
    icon: "Shield",
    requirement: 10,
    type: "conquest",
  },
  {
    id: "conquest_50",
    name: "Chiến tướng",
    description: "Hoàn thành 50 trận Chinh Chiến",
    icon: "Award",
    requirement: 50,
    type: "conquest",
  },
  {
    id: "conquest_wins_5",
    name: "Chuỗi thắng",
    description: "Đạt chuỗi thắng 5 trận",
    icon: "Zap",
    requirement: 5,
    type: "conquest_wins",
  },
  {
    id: "conquest_wins_10",
    name: "Bất bại",
    description: "Đạt chuỗi thắng 10 trận",
    icon: "Crown",
    requirement: 10,
    type: "conquest_wins",
  },
  // Rank points achievements
  {
    id: "rank_100",
    name: "Tân binh",
    description: "Đạt 100 Rank Points",
    icon: "Target",
    requirement: 100,
    type: "rank_points",
  },
  {
    id: "rank_500",
    name: "Tinh anh",
    description: "Đạt 500 Rank Points",
    icon: "Star",
    requirement: 500,
    type: "rank_points",
  },
  {
    id: "rank_1000",
    name: "Cao thủ",
    description: "Đạt 1000 Rank Points",
    icon: "Medal",
    requirement: 1000,
    type: "rank_points",
  },
  {
    id: "rank_2000",
    name: "Đại cao thủ",
    description: "Đạt 2000 Rank Points",
    icon: "Trophy",
    requirement: 2000,
    type: "rank_points",
  },
  // Minigame achievements - Spin
  {
    id: "spin_10",
    name: "May mắn",
    description: "Quay vòng quay 10 lần",
    icon: "Dices",
    requirement: 10,
    type: "spin",
  },
  {
    id: "spin_50",
    name: "Tay quay vàng",
    description: "Quay vòng quay 50 lần",
    icon: "Star",
    requirement: 50,
    type: "spin",
  },
  // Minigame achievements - Caro
  {
    id: "caro_wins_5",
    name: "Kỳ thủ",
    description: "Thắng 5 ván Caro",
    icon: "Gamepad2",
    requirement: 5,
    type: "caro_wins",
  },
  {
    id: "caro_wins_20",
    name: "Cao thủ Caro",
    description: "Thắng 20 ván Caro",
    icon: "Trophy",
    requirement: 20,
    type: "caro_wins",
  },
  {
    id: "caro_wins_50",
    name: "Bậc thầy Caro",
    description: "Thắng 50 ván Caro",
    icon: "Crown",
    requirement: 50,
    type: "caro_wins",
  },
  // Minigame achievements - Memory
  {
    id: "memory_wins_5",
    name: "Trí nhớ tốt",
    description: "Thắng 5 ván Memory",
    icon: "Brain",
    requirement: 5,
    type: "memory_wins",
  },
  {
    id: "memory_wins_20",
    name: "Siêu trí nhớ",
    description: "Thắng 20 ván Memory",
    icon: "Star",
    requirement: 20,
    type: "memory_wins",
  },
  {
    id: "memory_wins_50",
    name: "Thiên tài trí nhớ",
    description: "Thắng 50 ván Memory",
    icon: "Crown",
    requirement: 50,
    type: "memory_wins",
  },
  // Minigame achievements - 2048
  {
    id: "game2048_512",
    name: "Người chơi 2048",
    description: "Đạt tile 512 trong 2048",
    icon: "Grid2X2",
    requirement: 512,
    type: "game2048_tile",
  },
  {
    id: "game2048_1024",
    name: "Gần đích",
    description: "Đạt tile 1024 trong 2048",
    icon: "Star",
    requirement: 1024,
    type: "game2048_tile",
  },
  {
    id: "game2048_2048",
    name: "Chinh phục 2048",
    description: "Đạt tile 2048!",
    icon: "Trophy",
    requirement: 2048,
    type: "game2048_tile",
  },
  {
    id: "game2048_4096",
    name: "Vượt giới hạn",
    description: "Đạt tile 4096 trong 2048",
    icon: "Crown",
    requirement: 4096,
    type: "game2048_tile",
  },
];
