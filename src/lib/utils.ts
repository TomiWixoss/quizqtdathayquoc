import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { UserStats, ScoreCategories } from "@/types/quiz";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Tính điểm theo từng lĩnh vực
 * @param user - User stats
 * @param towerFloor - Tầng cao nhất trong Tower (từ localStorage)
 */
export function calculateScoreCategories(
  user: UserStats | null,
  towerFloor: number = 0
): ScoreCategories {
  if (!user) {
    return {
      quizScore: 0,
      conquestScore: 0,
      gachaScore: 0,
      towerScore: 0,
      achievementScore: 0,
      totalScore: 0,
    };
  }

  // Quiz Score: Điểm từ luyện tập
  // totalCorrect * 10 + perfectLessons * 50
  const quizScore =
    (user.totalCorrect ?? 0) * 10 + (user.perfectLessons ?? 0) * 50;

  // Conquest Score: Điểm từ Chinh Chiến
  // rankPoints + totalConquests * 5 + bestWinStreak * 20
  const conquestStats = user.conquestStats;
  const conquestScore =
    (conquestStats?.rankPoints ?? 0) +
    (conquestStats?.totalConquests ?? 0) * 5 +
    (conquestStats?.bestWinStreak ?? 0) * 20;

  // Gacha Score: Điểm từ bộ sưu tập
  // UR * 100 + SR * 50 + R * 20 + N * 5 + completedCollections * 200
  const gachaStats = user.gachaInventory?.gachaStats;
  const gachaScore =
    (gachaStats?.totalURCards ?? 0) * 100 +
    (gachaStats?.totalSRCards ?? 0) * 50 +
    (gachaStats?.totalRCards ?? 0) * 20 +
    (gachaStats?.totalNCards ?? 0) * 5 +
    (gachaStats?.completedCollections ?? 0) * 200;

  // Tower Score: Điểm từ Tháp Luyện Ngục
  // floor * 10
  const towerScore = towerFloor * 10;

  // Achievement Score: Điểm từ thành tựu
  // achievements * 25
  const achievementScore = (user.achievements?.length ?? 0) * 25;

  // Total Score
  const totalScore =
    quizScore + conquestScore + gachaScore + towerScore + achievementScore;

  return {
    quizScore,
    conquestScore,
    gachaScore,
    towerScore,
    achievementScore,
    totalScore,
  };
}

/**
 * Format số lớn thành dạng ngắn gọn (1K, 1.5M, etc.)
 * @param num - Số cần format
 * @param decimals - Số chữ số thập phân (mặc định 1)
 */
export function formatNumber(num: number, decimals: number = 1): string {
  if (num < 1000) return num.toString();
  if (num < 1000000) {
    const k = num / 1000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(decimals)}K`;
  }
  if (num < 1000000000) {
    const m = num / 1000000;
    return m % 1 === 0 ? `${m}M` : `${m.toFixed(decimals)}M`;
  }
  const b = num / 1000000000;
  return b % 1 === 0 ? `${b}B` : `${b.toFixed(decimals)}B`;
}
