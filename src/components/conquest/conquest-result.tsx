import { Page } from "zmp-ui";
import { motion } from "framer-motion";
import { Trophy, Target, TrendingUp, RotateCcw, Home } from "lucide-react";
import { UserRank, getRankImage } from "@/services/ai-quiz-service";

interface Props {
  result: {
    totalScore: number;
    correct: number;
    wrong: number;
    pointsGained: number;
  };
  rank: UserRank;
  onPlayAgain: () => void;
  onGoBack: () => void;
}

export function ConquestResult({ result, rank, onPlayAgain, onGoBack }: Props) {
  const accuracy =
    result.correct + result.wrong > 0
      ? Math.round((result.correct / (result.correct + result.wrong)) * 100)
      : 0;

  return (
    <Page className="bg-background min-h-screen">
      <div className="pt-16 px-4 pb-6">
        {/* Header */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Kết Quả Chinh Chiến
          </h1>
        </motion.div>

        {/* Rank Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 text-center mb-6"
        >
          <img
            src={getRankImage(rank)}
            alt={rank.rankName}
            className="w-24 h-24 mx-auto mb-3 object-contain"
          />
          <h2 className="text-xl font-bold text-white mb-1">{rank.rankName}</h2>
          <p className="text-white/80">{rank.points} Rank Points</p>

          <div
            className={`mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full ${
              result.pointsGained >= 0 ? "bg-green-500/30" : "bg-red-500/30"
            }`}
          >
            <TrendingUp
              className={`w-4 h-4 ${
                result.pointsGained >= 0
                  ? "text-green-300"
                  : "text-red-300 rotate-180"
              }`}
            />
            <span
              className={`font-bold ${
                result.pointsGained >= 0 ? "text-green-300" : "text-red-300"
              }`}
            >
              {result.pointsGained >= 0 ? "+" : ""}
              {result.pointsGained} RP
            </span>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          <div className="bg-[var(--card)] rounded-xl p-4 text-center border-2 border-[var(--border)]">
            <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold text-foreground">
              {result.totalScore}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">Điểm</p>
          </div>

          <div className="bg-[var(--card)] rounded-xl p-4 text-center border-2 border-[var(--border)]">
            <Target className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold text-foreground">{accuracy}%</p>
            <p className="text-xs text-[var(--muted-foreground)]">Chính xác</p>
          </div>

          <div className="bg-[var(--card)] rounded-xl p-4 text-center border-2 border-[var(--border)]">
            <div className="flex justify-center gap-2 mb-2">
              <span className="text-green-500 font-bold">{result.correct}</span>
              <span className="text-[var(--muted-foreground)]">/</span>
              <span className="text-red-500 font-bold">{result.wrong}</span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">Đúng/Sai</p>
          </div>
        </motion.div>

        {/* Accuracy bar */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-[var(--card)] rounded-xl p-4 border-2 border-[var(--border)] mb-6"
        >
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[var(--muted-foreground)]">Độ chính xác</span>
            <span className="font-bold text-foreground">{accuracy}%</span>
          </div>
          <div className="h-3 bg-[var(--muted)] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${accuracy}%` }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className={`h-full rounded-full ${
                accuracy >= 80
                  ? "bg-green-500"
                  : accuracy >= 60
                  ? "bg-yellow-500"
                  : accuracy >= 40
                  ? "bg-orange-500"
                  : "bg-red-500"
              }`}
            />
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <button
            onClick={onPlayAgain}
            className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Chơi Lại
          </button>

          <button
            onClick={onGoBack}
            className="w-full py-4 rounded-xl font-bold text-foreground bg-[var(--card)] border-2 border-[var(--border)] flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Về Trang Chủ
          </button>
        </motion.div>
      </div>
    </Page>
  );
}
