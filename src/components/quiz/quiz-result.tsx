import { useNavigate } from "zmp-ui";
import {
  Trophy,
  Star,
  RotateCcw,
  Home,
  Flame,
  Zap,
  Target,
  Gem,
} from "lucide-react";
import { useQuizStore } from "@/stores/quiz-store";
import { useUserStore } from "@/stores/user-store";
import { useEffect, useState } from "react";
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
  const { user, updateChapterProgress, addBadge, addPerfectLesson, addGems } =
    useUserStore();
  const [bonusGems, setBonusGems] = useState(0);

  const totalQuestions = currentQuestions.length;
  const percentage = Math.round((correctCount / totalQuestions) * 100);
  const isPerfect = percentage === 100;

  // Calculate stars
  const getStars = () => {
    if (percentage >= 90) return 3;
    if (percentage >= 70) return 2;
    if (percentage >= 50) return 1;
    return 0;
  };
  const stars = getStars();

  useEffect(() => {
    // Update chapter progress with stars
    if (currentChapter && user) {
      const currentProgress = user.chapterProgress[currentChapter];
      updateChapterProgress(currentChapter, {
        completed: Math.max(currentProgress?.completed || 0, correctCount),
        correct: (currentProgress?.correct || 0) + correctCount,
        bestScore: Math.max(currentProgress?.bestScore || 0, score),
        lastAttempt: new Date().toISOString(),
        stars: Math.max(currentProgress?.stars || 0, stars),
      });
    }

    // Perfect lesson bonus
    if (isPerfect) {
      addPerfectLesson();
      setBonusGems(10);
    } else if (percentage >= 80) {
      const bonus = 5;
      addGems(bonus);
      setBonusGems(bonus);
    }

    // Celebration
    if (percentage >= 80) {
      const duration = isPerfect ? 3000 : 1500;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({
          particleCount: isPerfect ? 7 : 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#58cc02", "#ffc800", "#1cb0f6"],
        });
        confetti({
          particleCount: isPerfect ? 7 : 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#58cc02", "#ffc800", "#1cb0f6"],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }

    if (isPerfect) addBadge("perfect_score");
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
    if (currentChapter) selectChapter(currentChapter);
    else {
      resetQuiz();
      navigate("/");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-4">
      {/* Emoji */}
      <div className="text-7xl mb-3">{grade.emoji}</div>

      {/* Grade */}
      <h1 className="text-2xl font-bold mb-1" style={{ color: grade.color }}>
        {grade.label}
      </h1>

      {/* Stars */}
      <div className="flex items-center gap-1 mb-4">
        {[...Array(3)].map((_, i) => (
          <Star
            key={i}
            className={`w-8 h-8 ${
              i < stars
                ? "text-[var(--duo-yellow)] fill-[var(--duo-yellow)]"
                : "text-[var(--muted-foreground)]"
            }`}
          />
        ))}
      </div>

      {/* Score Circle */}
      <div className="relative w-32 h-32 mb-4">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="56"
            fill="none"
            stroke="var(--secondary)"
            strokeWidth="10"
          />
          <circle
            cx="64"
            cy="64"
            r="56"
            fill="none"
            stroke={grade.color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(percentage / 100) * 352} 352`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-foreground">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Stats Card */}
      <div className="w-full max-w-xs card-3d p-3 mb-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="w-8 h-8 mx-auto rounded-lg bg-[var(--duo-green)]/20 flex items-center justify-center mb-1">
              <Target className="w-4 h-4 text-[var(--duo-green)]" />
            </div>
            <div className="text-xl font-bold text-[var(--duo-green)]">
              {correctCount}
            </div>
            <div className="text-[10px] text-[var(--muted-foreground)]">
              Đúng
            </div>
          </div>
          <div>
            <div className="w-8 h-8 mx-auto rounded-lg bg-[var(--duo-red)]/20 flex items-center justify-center mb-1">
              <Star className="w-4 h-4 text-[var(--duo-red)]" />
            </div>
            <div className="text-xl font-bold text-[var(--duo-red)]">
              {wrongCount}
            </div>
            <div className="text-[10px] text-[var(--muted-foreground)]">
              Sai
            </div>
          </div>
          <div>
            <div className="w-8 h-8 mx-auto rounded-lg bg-[var(--duo-yellow)]/20 flex items-center justify-center mb-1">
              <Zap className="w-4 h-4 text-[var(--duo-yellow)]" />
            </div>
            <div className="text-xl font-bold text-[var(--duo-yellow)]">
              {score}
            </div>
            <div className="text-[10px] text-[var(--muted-foreground)]">XP</div>
          </div>
        </div>

        {/* Bonus */}
        {bonusGems > 0 && (
          <div className="mt-3 pt-3 border-t border-[var(--border)] text-center">
            <div className="flex items-center justify-center gap-1 text-[var(--duo-blue)]">
              <Gem className="w-4 h-4" />
              <span className="font-bold">+{bonusGems} Gems bonus!</span>
            </div>
          </div>
        )}

        {user && (
          <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-center gap-4">
            <div className="flex items-center gap-1">
              <Flame className="w-4 h-4 text-[var(--duo-orange)] flame-animate" />
              <span className="font-bold text-sm text-[var(--duo-orange)]">
                {user.streak}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="w-4 h-4 text-[var(--duo-yellow)]" />
              <span className="font-bold text-sm">Lv.{user.level}</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="w-full max-w-xs space-y-2.5">
        <button
          onClick={handleRetry}
          className="btn-3d btn-3d-green w-full py-3 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" /> Làm lại
        </button>
        <button
          onClick={() => {
            resetQuiz();
            navigate("/");
          }}
          className="btn-3d btn-3d-blue w-full py-3 flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" /> Trang chủ
        </button>
      </div>
    </div>
  );
}
