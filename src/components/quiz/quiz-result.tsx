import { useNavigate } from "zmp-ui";
import {
  Trophy,
  Star,
  RotateCcw,
  Home,
  Flame,
  Zap,
  Target,
} from "lucide-react";
import { useQuizStore } from "@/stores/quiz-store";
import { useUserStore } from "@/stores/user-store";
import { useEffect } from "react";
import confetti from "canvas-confetti";

export function QuizResult() {
  const navigate = useNavigate();
  const {
    score,
    correctCount,
    wrongCount,
    currentQuestions,
    currentChapter,
    resetQuiz,
    selectChapter,
  } = useQuizStore();
  const { user, updateChapterProgress, addBadge } = useUserStore();

  const totalQuestions = currentQuestions.length;
  const percentage = Math.round((correctCount / totalQuestions) * 100);

  useEffect(() => {
    if (currentChapter && user) {
      const currentProgress = user.chapterProgress[currentChapter];
      updateChapterProgress(currentChapter, {
        completed: Math.max(currentProgress?.completed || 0, correctCount),
        correct: (currentProgress?.correct || 0) + correctCount,
        bestScore: Math.max(currentProgress?.bestScore || 0, score),
        lastAttempt: new Date().toISOString(),
      });
    }

    if (percentage >= 80) {
      const duration = percentage === 100 ? 3000 : 1500;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({
          particleCount: percentage === 100 ? 7 : 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#58cc02", "#ffc800", "#1cb0f6"],
        });
        confetti({
          particleCount: percentage === 100 ? 7 : 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#58cc02", "#ffc800", "#1cb0f6"],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }

    if (percentage === 100) addBadge("perfect_score");
    if (user && user.streak >= 7) addBadge("week_streak");
  }, []);

  const getGrade = () => {
    if (percentage >= 90)
      return { label: "Xuất sắc!", emoji: "🏆", color: "var(--duo-yellow)" };
    if (percentage >= 70)
      return { label: "Tốt lắm!", emoji: "⭐", color: "var(--duo-green)" };
    if (percentage >= 50)
      return { label: "Khá ổn!", emoji: "👍", color: "var(--duo-blue)" };
    return { label: "Cố gắng hơn!", emoji: "💪", color: "var(--duo-orange)" };
  };

  const grade = getGrade();

  const handleRetry = () => {
    if (currentChapter) {
      selectChapter(currentChapter);
    } else {
      resetQuiz();
      navigate("/");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      {/* Emoji */}
      <div className="text-8xl mb-4">{grade.emoji}</div>

      {/* Grade Label */}
      <h1 className="text-3xl font-bold mb-2" style={{ color: grade.color }}>
        {grade.label}
      </h1>

      {/* Score Circle */}
      <div className="relative w-40 h-40 mb-6">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="var(--secondary)"
            strokeWidth="12"
          />
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke={grade.color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${(percentage / 100) * 440} 440`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-foreground">
            {percentage}%
          </span>
          <span className="text-sm text-[var(--muted-foreground)]">
            Chính xác
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="w-full max-w-sm card-3d p-4 mb-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="w-10 h-10 mx-auto rounded-xl bg-[var(--duo-green)]/20 flex items-center justify-center mb-1">
              <Target className="w-5 h-5 text-[var(--duo-green)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--duo-green)]">
              {correctCount}
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">Đúng</div>
          </div>
          <div>
            <div className="w-10 h-10 mx-auto rounded-xl bg-[var(--duo-red)]/20 flex items-center justify-center mb-1">
              <Star className="w-5 h-5 text-[var(--duo-red)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--duo-red)]">
              {wrongCount}
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">Sai</div>
          </div>
          <div>
            <div className="w-10 h-10 mx-auto rounded-xl bg-[var(--duo-yellow)]/20 flex items-center justify-center mb-1">
              <Zap className="w-5 h-5 text-[var(--duo-yellow)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--duo-yellow)]">
              {score}
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">XP</div>
          </div>
        </div>

        {user && (
          <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-center gap-4">
            <div className="flex items-center gap-1">
              <Flame className="w-5 h-5 text-[var(--duo-orange)] flame-animate" />
              <span className="font-bold text-[var(--duo-orange)]">
                {user.streak} ngày
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="w-5 h-5 text-[var(--duo-yellow)]" />
              <span className="font-bold">Lv.{user.level}</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={handleRetry}
          className="btn-3d btn-3d-green w-full py-4 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          Làm lại
        </button>
        <button
          onClick={() => {
            resetQuiz();
            navigate("/");
          }}
          className="btn-3d btn-3d-blue w-full py-4 flex items-center justify-center gap-2"
        >
          <Home className="w-5 h-5" />
          Trang chủ
        </button>
      </div>
    </div>
  );
}
