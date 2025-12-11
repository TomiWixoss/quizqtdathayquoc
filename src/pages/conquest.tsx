import { Page, useNavigate } from "zmp-ui";
import { useState } from "react";
import { ArrowLeft, Swords, Trophy, Zap, Loader2 } from "lucide-react";
import { useConquestStore } from "@/stores/conquest-store";
import { useUserStore } from "@/stores/user-store";
import { getRankImage, RANK_LEVELS } from "@/services/ai-quiz-service";
import { ConquestQuizCard } from "@/components/conquest/conquest-quiz-card";
import { ConquestResult } from "@/components/conquest/conquest-result";

function ConquestPage() {
  const navigate = useNavigate();
  const { user } = useUserStore();
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
  } = useConquestStore();

  const [showResult, setShowResult] = useState(false);
  const [finalResult, setFinalResult] = useState<{
    totalScore: number;
    correct: number;
    wrong: number;
    pointsGained: number;
  } | null>(null);

  // Lấy điểm rank từ user (có thể lưu trong Firebase)
  const userRankPoints = user?.totalScore || 0;

  const handleStart = async () => {
    await startConquest(userRankPoints);
  };

  const handleEnd = () => {
    const result = endConquest();
    setFinalResult(result);
    setShowResult(true);
  };

  const handlePlayAgain = () => {
    setShowResult(false);
    setFinalResult(null);
    resetConquest();
  };

  // Màn hình kết quả
  if (showResult && finalResult) {
    return (
      <ConquestResult
        result={finalResult}
        rank={rank}
        onPlayAgain={handlePlayAgain}
        onGoBack={() => navigate(-1)}
      />
    );
  }

  // Màn hình đang chơi
  if (isActive && questions.length > 0) {
    return (
      <Page className="bg-background min-h-screen">
        {/* Header */}
        <div className="pt-16 pb-3 px-4 bg-[var(--card)] border-b-2 border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleEnd}
                className="btn-back-3d w-10 h-10 flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="font-bold text-lg text-foreground">
                  Chinh Chiến
                </h1>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Câu {currentIndex + 1}/{questions.length}
                </p>
              </div>
            </div>

            {/* Rank display */}
            <div className="flex items-center gap-2">
              <img
                src={getRankImage(rank)}
                alt={rank.rankName}
                className="w-10 h-10 object-contain"
              />
              <div className="text-right">
                <p className="text-xs font-bold text-foreground">
                  {rank.rankName}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {rankPoints} RP
                </p>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex items-center justify-center gap-6 mt-3">
            <div className="flex items-center gap-1.5 text-green-500">
              <span className="text-sm">✓</span>
              <span className="font-bold">{correctCount}</span>
            </div>
            <div className="flex items-center gap-1.5 text-red-500">
              <span className="text-sm">✗</span>
              <span className="font-bold">{wrongCount}</span>
            </div>
          </div>
        </div>

        {/* Question */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-foreground">Đang tạo câu hỏi...</span>
          </div>
        ) : (
          <ConquestQuizCard
            question={questions[currentIndex]}
            onEnd={handleEnd}
          />
        )}
      </Page>
    );
  }

  // Màn hình chính - chọn bắt đầu
  return (
    <Page className="bg-background min-h-screen">
      {/* Header */}
      <div className="pt-16 pb-4 px-4 bg-[var(--card)] border-b-2 border-[var(--border)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="btn-back-3d w-10 h-10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="font-bold text-xl text-foreground">Chinh Chiến</h1>
            <p className="text-xs text-[var(--muted-foreground)]">
              Đấu trí với AI - Leo rank
            </p>
          </div>
        </div>
      </div>

      {/* Current Rank */}
      <div className="px-4 py-6">
        <div className="bg-[var(--card)] rounded-2xl p-6 border-2 border-[var(--border)] text-center">
          <img
            src={getRankImage(rank)}
            alt={rank.rankName}
            className="w-24 h-24 mx-auto mb-4 object-contain"
          />
          <h2 className="text-2xl font-bold text-foreground mb-1">
            {rank.rankName}
          </h2>
          <p className="text-[var(--muted-foreground)] mb-4">
            {userRankPoints} Rank Points
          </p>

          {/* Progress to next rank */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-[var(--muted-foreground)] mb-1">
              <span>{rank.rankName}</span>
              <span>Rank tiếp theo</span>
            </div>
            <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
                style={{ width: "45%" }}
              />
            </div>
          </div>

          {/* Rank tiers preview */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {RANK_LEVELS.slice(0, 8).map((r) => (
              <div
                key={r.id}
                className={`p-2 rounded-lg text-center ${
                  r.id === rank.rankId
                    ? "bg-primary/20 border-2 border-primary"
                    : "bg-[var(--muted)]/50"
                }`}
              >
                <p className="text-xs font-medium text-foreground">{r.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Game Info */}
      <div className="px-4 space-y-3">
        <div className="bg-[var(--card)] rounded-xl p-4 border-2 border-[var(--border)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Swords className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <p className="font-bold text-foreground">AI Tạo Đề</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Câu hỏi được AI tạo dựa trên rank của bạn
            </p>
          </div>
        </div>

        <div className="bg-[var(--card)] rounded-xl p-4 border-2 border-[var(--border)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <p className="font-bold text-foreground">Leo Rank</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Trả lời đúng +RP, sai -RP. Rank càng cao càng khó!
            </p>
          </div>
        </div>

        <div className="bg-[var(--card)] rounded-xl p-4 border-2 border-[var(--border)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="font-bold text-foreground">Đa Dạng Câu Hỏi</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Trắc nghiệm, điền từ, nối cặp, sắp xếp...
            </p>
          </div>
        </div>
      </div>

      {/* Start Button - thêm padding bottom để không bị dính bottom nav */}
      <div className="px-4 py-6 pb-28">
        <button
          onClick={handleStart}
          disabled={isLoading}
          className="w-full py-4 rounded-2xl font-bold text-lg text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang chuẩn bị...
            </>
          ) : (
            <>
              <Swords className="w-5 h-5" />
              Bắt Đầu Chinh Chiến
            </>
          )}
        </button>
      </div>
    </Page>
  );
}

export default ConquestPage;
