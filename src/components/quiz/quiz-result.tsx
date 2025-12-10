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
  CheckCircle,
  Award,
  Crown,
  BookOpen,
  GraduationCap,
  Sparkles,
  Medal,
  Coins,
} from "lucide-react";

// Keep Lucide icons for ICON_MAP (achievements use them)
import { useQuizStore } from "@/stores/quiz-store";
import { useUserStore } from "@/stores/user-store";
import { useEffect, useState } from "react";
import { ACHIEVEMENTS, Achievement } from "@/types/quiz";
import confetti from "canvas-confetti";

const ICON_MAP: Record<Achievement["icon"], React.ElementType> = {
  Target,
  Flame,
  Zap,
  Crown,
  BookOpen,
  Trophy,
  GraduationCap,
  Gem,
  Star,
  Sparkles,
  Medal,
  Coins,
};

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
    chapters,
  } = useQuizStore();
  const {
    user,
    updateChapterProgress,
    addBadge,
    addPerfectLesson,
    addGems,
    checkAchievements,
  } = useUserStore();
  const [bonusGems, setBonusGems] = useState(0);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [showAchievement, setShowAchievement] = useState(false);

  const totalQuestions = currentQuestions.length;
  const percentage =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const isPerfect = percentage === 100;

  const getStars = () => {
    if (percentage >= 90) return 3;
    if (percentage >= 70) return 2;
    if (percentage >= 50) return 1;
    return 0;
  };
  const stars = getStars();

  // Get chapter info
  const chapterInfo = currentChapter
    ? chapters.find((c) => c.id === currentChapter)
    : null;
  const isChapterCompleted =
    chapterInfo && correctCount >= chapterInfo.totalQuestions * 0.7;

  useEffect(() => {
    const saveProgress = async () => {
      // Track daily quiz completion for quests
      const today = new Date().toDateString();
      const dailyQuiz = parseInt(
        localStorage.getItem(`daily_quiz_${today}`) || "0"
      );
      localStorage.setItem(`daily_quiz_${today}`, (dailyQuiz + 1).toString());

      // Track weekly perfect for quests
      if (isPerfect) {
        const weeklyPerfect = parseInt(
          localStorage.getItem("weekly_perfect") || "0"
        );
        localStorage.setItem("weekly_perfect", (weeklyPerfect + 1).toString());
      }

      // Update chapter progress
      if (currentChapter && user) {
        const currentProgress = user.chapterProgress?.[currentChapter];
        await updateChapterProgress(currentChapter, {
          completed: correctCount,
          correct: (currentProgress?.correct ?? 0) + correctCount,
          bestScore: Math.max(currentProgress?.bestScore ?? 0, score),
          lastAttempt: new Date().toISOString(),
          stars: Math.max(currentProgress?.stars ?? 0, stars),
          isCompleted:
            isChapterCompleted || (currentProgress?.isCompleted ?? false),
        });
      }

      // Perfect lesson bonus
      if (isPerfect) {
        await addPerfectLesson();
        setBonusGems(10);
      } else if (percentage >= 80) {
        await addGems(5);
        setBonusGems(5);
      }

      // Check achievements
      const earned = await checkAchievements();
      if (earned.length > 0) {
        const achievementDetails = ACHIEVEMENTS.filter((a) =>
          earned.includes(a.id)
        );
        setNewAchievements(achievementDetails);
        setShowAchievement(true);
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

      if (isPerfect) await addBadge("perfect_score");
    };

    saveProgress();
  }, []);

  const getGrade = () => {
    if (percentage >= 90)
      return { label: "Xuất sắc!", icon: Trophy, color: "var(--duo-yellow)" };
    if (percentage >= 70)
      return { label: "Tốt lắm!", icon: Star, color: "var(--duo-green)" };
    if (percentage >= 50)
      return { label: "Khá ổn!", icon: Target, color: "var(--duo-blue)" };
    return { label: "Cố gắng hơn!", icon: Flame, color: "var(--duo-orange)" };
  };
  const grade = getGrade();
  const GradeIcon = grade.icon;

  const handleRetry = () => {
    if (currentChapter) selectChapter(currentChapter);
    else {
      resetQuiz();
      navigate("/battle");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-4">
      {/* Achievement Popup */}
      {showAchievement && newAchievements.length > 0 && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--card)] rounded-3xl p-6 max-w-sm w-full text-center">
            <Award className="w-16 h-16 text-[var(--duo-yellow)] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[var(--duo-yellow)] mb-2">
              Thành tựu mới!
            </h2>
            <div className="space-y-3 mb-4">
              {newAchievements.map((a) => {
                const AIcon = ICON_MAP[a.icon];
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 bg-[var(--secondary)] p-3 rounded-xl"
                  >
                    <AIcon className="w-8 h-8 text-[var(--duo-yellow)]" />
                    <div className="text-left">
                      <p className="font-bold text-foreground">{a.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {a.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-1 text-[var(--duo-blue)] mb-4">
              <img src="/BlueDiamond.png" alt="gem" className="w-6 h-6" />
              <span className="font-bold">
                +{newAchievements.length * 10} Gems
              </span>
            </div>
            <button
              onClick={() => setShowAchievement(false)}
              className="btn-3d btn-3d-green w-full py-3"
            >
              Tuyệt vời!
            </button>
          </div>
        </div>
      )}

      {/* Grade Icon */}
      <div className="w-20 h-20 rounded-full bg-[var(--secondary)] flex items-center justify-center mb-3">
        <GradeIcon className="w-10 h-10" style={{ color: grade.color }} />
      </div>

      {/* Grade */}
      <h1 className="text-2xl font-bold mb-1" style={{ color: grade.color }}>
        {grade.label}
      </h1>

      {/* Chapter completed badge */}
      {isChapterCompleted && (
        <div className="flex items-center gap-1 text-[var(--duo-green)] mb-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold text-sm">Chương hoàn thành!</span>
        </div>
      )}

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
              <CheckCircle className="w-4 h-4 text-[var(--duo-green)]" />
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
              <Target className="w-4 h-4 text-[var(--duo-red)]" />
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
              <img src="/Lighting.png" alt="xp" className="w-5 h-5" />
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
              <img src="/BlueDiamond.png" alt="gem" className="w-5 h-5" />
              <span className="font-bold">+{bonusGems} Gems bonus!</span>
            </div>
          </div>
        )}

        {user && (
          <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-center gap-4">
            <div className="flex items-center gap-1">
              <img src="/Fire.png" alt="streak" className="w-5 h-5" />
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
            const isBattleMode = !currentChapter;
            resetQuiz();
            navigate(isBattleMode ? "/battle" : "/");
          }}
          className="btn-3d btn-3d-blue w-full py-3 flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />{" "}
          {currentChapter ? "Trang chủ" : "Luyện tập"}
        </button>
      </div>
    </div>
  );
}
