import { Page } from "@/components/ui/page";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { X, Swords, Trophy, Zap, Loader2, Gift } from "lucide-react";
import { useConquestStore } from "@/stores/conquest-store";
import { useUserStore } from "@/stores/user-store";
import {
  getRankImage,
  RANK_LEVELS,
  getRankFromPoints,
} from "@/services/ai-quiz-service";
import { ConquestQuizCard } from "@/components/conquest/conquest-quiz-card";
import { ConquestResult } from "@/components/conquest/conquest-result";
import { RankRewardsSheet } from "@/components/conquest/rank-rewards-sheet";

function ConquestPage() {
  const navigate = useNavigate();
  const { user, initUser } = useUserStore();
  const {
    isActive,
    isLoading,
    questions,
    currentIndex,
    rank,
    rankPoints,
    correctCount,
    wrongCount,
    startConquest,
    endConquest,
    resetConquest,
    loadConquestStats,
  } = useConquestStore();

  const [showResult, setShowResult] = useState(false);
  const [finalResult, setFinalResult] = useState<{
    totalScore: number;
    correct: number;
    wrong: number;
    pointsGained: number;
  } | null>(null);
  const [conquestStats, setConquestStats] = useState<{
    rankPoints: number;
    totalConquests: number;
    bestWinStreak: number;
  } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [showRankRewards, setShowRankRewards] = useState(false);

  // Load conquest stats from Firebase on mount
  useEffect(() => {
    const loadStats = async () => {
      if (user?.oderId) {
        setIsLoadingStats(true);
        const stats = await loadConquestStats(user.oderId);
        setConquestStats(stats);
        setIsLoadingStats(false);
      }
    };
    loadStats();
  }, [user?.oderId, loadConquestStats]);

  // Get rank points from conquest stats or fallback to totalScore
  const userRankPoints =
    conquestStats?.rankPoints ??
    user?.conquestStats?.rankPoints ??
    user?.totalScore ??
    0;
  const displayRank = getRankFromPoints(userRankPoints);

  const handleStart = async () => {
    if (!user?.oderId) return;
    await startConquest(user.oderId, userRankPoints);
  };

  const handleEnd = async () => {
    // Set showResult TRƯỚC khi endConquest để tránh flash về trang chính
    setShowResult(true);
    const result = await endConquest();
    setFinalResult(result);
    // Reload user data to get updated stats
    await initUser();
    // Reload conquest stats
    if (user?.oderId) {
      const stats = await loadConquestStats(user.oderId);
      setConquestStats(stats);
    }
  };

  const handlePlayAgain = () => {
    setShowResult(false);
    setFinalResult(null);
    resetConquest();
  };

  // Màn hình kết quả - check TRƯỚC để tránh flash
  if (showResult) {
    if (!finalResult) {
      // Đang tính kết quả
      return (
        <Page className="bg-background min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-[var(--duo-purple)] mx-auto mb-4" />
            <p className="text-foreground font-bold">Đang tính kết quả...</p>
          </div>
        </Page>
      );
    }
    return (
      <ConquestResult
        result={finalResult}
        rank={rank}
        onPlayAgain={handlePlayAgain}
        onGoBack={() => navigate("/")}
      />
    );
  }

  // Màn hình đang chơi - KHÔNG có bottom nav
  if (isActive && questions.length > 0) {
    return (
      <Page className="bg-background min-h-screen">
        {/* Header */}
        <div className="pt-4 pb-2 px-4 bg-background sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <button
              onClick={handleEnd}
              className="w-10 h-10 rounded-xl bg-[var(--secondary)] flex items-center justify-center"
            >
              <X className="w-5 h-5 text-[var(--muted-foreground)]" />
            </button>

            <div className="flex items-center gap-3">
              {/* Stats */}
              <div className="flex items-center gap-1.5 text-[var(--duo-green)]">
                <span className="text-sm">✓</span>
                <span className="font-bold">{correctCount}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[var(--duo-red)]">
                <span className="text-sm">✗</span>
                <span className="font-bold">{wrongCount}</span>
              </div>
            </div>

            {/* Rank display */}
            <div className="flex items-center gap-2">
              <img
                src={getRankImage(rank)}
                alt={rank.rankName}
                className="w-8 h-8 object-contain"
              />
              <div className="text-right">
                <p className="text-xs font-bold text-foreground">
                  {rankPoints} RP
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Question */}
        <div style={{ minHeight: "calc(100vh - 100px)" }}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--duo-purple)]" />
              <span className="text-foreground font-bold">
                Đang tạo câu hỏi...
              </span>
            </div>
          ) : (
            <ConquestQuizCard
              question={questions[currentIndex]}
              onEnd={handleEnd}
            />
          )}
        </div>
      </Page>
    );
  }

  // Calculate progress to next rank
  const calculateRankProgress = () => {
    const currentRankIndex = RANK_LEVELS.findIndex(
      (r) => r.id === displayRank.rankId
    );
    if (currentRankIndex === -1 || currentRankIndex >= RANK_LEVELS.length - 1)
      return 100;

    const currentRankMin = RANK_LEVELS[currentRankIndex].minScore;
    const nextRankMin = RANK_LEVELS[currentRankIndex + 1].minScore;
    const progress =
      ((userRankPoints - currentRankMin) / (nextRankMin - currentRankMin)) *
      100;
    return Math.min(100, Math.max(0, progress));
  };

  const getNextRankName = () => {
    const currentRankIndex = RANK_LEVELS.findIndex(
      (r) => r.id === displayRank.rankId
    );
    if (currentRankIndex === -1 || currentRankIndex >= RANK_LEVELS.length - 1)
      return "Max Rank";
    return RANK_LEVELS[currentRankIndex + 1].name;
  };

  // Màn hình chính - chọn bắt đầu
  return (
    <Page className="bg-background min-h-screen">
      {/* Header */}
      <div className="pt-4 pb-3 px-4 bg-[var(--card)] border-b-2 border-[var(--border)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="btn-back-3d w-10 h-10 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="font-bold text-xl text-foreground">Chinh Chiến</h1>
            <p className="text-xs text-[var(--muted-foreground)]">
              Đấu trí với AI - Leo rank
            </p>
          </div>
        </div>
      </div>

      {/* Content with padding for bottom nav */}
      <div
        className="px-4 py-4 pb-28 overflow-y-auto"
        style={{ height: "calc(100vh - 100px)" }}
      >
        {isLoadingStats ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--duo-purple)]" />
            <span className="text-foreground font-bold">
              Đang tải dữ liệu...
            </span>
          </div>
        ) : (
          <>
            {/* Current Rank */}
            <div className="card-3d p-6 text-center mb-4">
              <img
                src={getRankImage(displayRank)}
                alt={displayRank.rankName}
                className="w-24 h-24 mx-auto mb-4 object-contain"
              />
              <h2 className="text-2xl font-bold text-foreground mb-1">
                {displayRank.rankName}
              </h2>
              <p className="text-[var(--muted-foreground)] mb-4">
                {userRankPoints} Rank Points
              </p>

              {/* Progress to next rank */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-[var(--muted-foreground)] mb-1">
                  <span>{displayRank.rankName}</span>
                  <span>{getNextRankName()}</span>
                </div>
                <div className="progress-duo h-2.5">
                  <div
                    className="progress-duo-fill"
                    style={{ width: `${calculateRankProgress()}%` }}
                  />
                </div>
              </div>

              {/* Conquest Stats */}
              {conquestStats && conquestStats.totalConquests > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                  <div className="bg-[var(--secondary)] rounded-lg p-2">
                    <p className="text-[var(--muted-foreground)]">Tổng trận</p>
                    <p className="font-bold text-foreground">
                      {conquestStats.totalConquests}
                    </p>
                  </div>
                  <div className="bg-[var(--secondary)] rounded-lg p-2">
                    <p className="text-[var(--muted-foreground)]">
                      Chuỗi thắng tốt nhất
                    </p>
                    <p className="font-bold text-foreground">
                      {conquestStats.bestWinStreak}
                    </p>
                  </div>
                </div>
              )}

              {/* Rank tiers preview - 2 hàng x 4 cột */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {RANK_LEVELS.slice(0, 8).map((r) => (
                  <div
                    key={r.id}
                    className={`h-11 rounded-xl flex items-center justify-center ${
                      r.id === displayRank.rankId
                        ? "bg-[var(--duo-purple)]/20 border-2 border-[var(--duo-purple)]"
                        : "bg-[var(--secondary)] border-2 border-transparent"
                    }`}
                  >
                    <p className="text-[11px] font-bold text-foreground">
                      {r.shortName}
                    </p>
                  </div>
                ))}
              </div>

              {/* Nút xem quà rank */}
              <button
                onClick={() => setShowRankRewards(true)}
                className="w-full btn-3d btn-3d-yellow py-3 flex items-center justify-center gap-2"
              >
                <Gift className="w-5 h-5" />
                <span>Xem Quà Rank</span>
              </button>
            </div>

            {/* Game Info */}
            <div className="space-y-2.5 mb-4">
              <div className="card-3d p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--duo-purple)]/20 flex items-center justify-center">
                  <Swords className="w-5 h-5 text-[var(--duo-purple)]" />
                </div>
                <div>
                  <p className="font-bold text-foreground">AI Tạo Đề</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Câu hỏi được AI tạo dựa trên rank của bạn
                  </p>
                </div>
              </div>

              <div className="card-3d p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--duo-yellow)]/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-[var(--duo-yellow)]" />
                </div>
                <div>
                  <p className="font-bold text-foreground">Leo Rank</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Trả lời đúng +RP, sai -RP. Rank càng cao càng khó!
                  </p>
                </div>
              </div>

              <div className="card-3d p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--duo-blue)]/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[var(--duo-blue)]" />
                </div>
                <div>
                  <p className="font-bold text-foreground">Đa Dạng Câu Hỏi</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Trắc nghiệm, điền từ, nối cặp, sắp xếp...
                  </p>
                </div>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStart}
              disabled={isLoading || !user?.oderId}
              className={`btn-3d w-full py-4 text-lg flex items-center justify-center gap-2 ${
                isLoading
                  ? "bg-[var(--secondary)] text-[var(--muted-foreground)] shadow-[0_5px_0_var(--border)] cursor-not-allowed"
                  : "btn-3d-purple"
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang chuẩn bị...
                </>
              ) : (
                <>
                  <Swords className="w-5 h-5" />
                  BẮT ĐẦU CHINH CHIẾN
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* Rank Rewards Bottom Sheet */}
      <RankRewardsSheet
        isOpen={showRankRewards}
        onClose={() => setShowRankRewards(false)}
        userRankPoints={userRankPoints}
      />
    </Page>
  );
}

export default ConquestPage;
