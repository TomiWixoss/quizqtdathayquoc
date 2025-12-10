import { useNavigate } from "zmp-ui";
import { Page } from "zmp-ui";
import { X, Clock, Skull } from "lucide-react";
import { QuizCard } from "@/components/quiz/quiz-card";
import { QuizResult } from "@/components/quiz/quiz-result";
import { useQuizStore } from "@/stores/quiz-store";
import { useUserStore } from "@/stores/user-store";
import { useEffect, useState, useRef } from "react";

function QuizPage() {
  const navigate = useNavigate();
  const {
    currentQuestions,
    currentIndex,
    resetQuiz,
    chapters,
    currentChapter,
    correctCount,
    wrongCount,
    score,
    quizMode,
    timeLimit,
    maxWrong,
  } = useQuizStore();
  const { user, updateChapterProgress } = useUserStore();

  const [timeLeft, setTimeLeft] = useState(timeLimit ?? 0);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Time Attack timer
  useEffect(() => {
    if (quizMode === "timeattack" && timeLimit && !isTimeUp) {
      setTimeLeft(timeLimit);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsTimeUp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [quizMode, timeLimit]);

  // Survival mode - check if lost
  const isSurvivalLost =
    quizMode === "survival" && maxWrong && wrongCount >= maxWrong;

  const isFinished =
    currentIndex >= currentQuestions.length || isTimeUp || isSurvivalLost;
  const chapterName = currentChapter
    ? chapters.find((c) => c.id === currentChapter)?.name
    : quizMode === "timeattack"
    ? "Time Attack"
    : quizMode === "survival"
    ? "Sinh Tồn"
    : "Trắc nghiệm";

  useEffect(() => {
    if (currentQuestions.length === 0) {
      navigate("/");
    }
  }, [currentQuestions, navigate]);

  const handleClose = async () => {
    // Clear timer if running
    if (timerRef.current) clearInterval(timerRef.current);

    // Lưu tiến trình nếu đang làm quiz chương và đã trả lời ít nhất 1 câu
    if (currentChapter && currentIndex > 0 && user) {
      const currentProgress = user.chapterProgress?.[currentChapter];
      const totalAnswered = correctCount + wrongCount;
      await updateChapterProgress(currentChapter, {
        completed: Math.max(currentProgress?.completed ?? 0, totalAnswered),
        correct: (currentProgress?.correct ?? 0) + correctCount,
        bestScore: Math.max(currentProgress?.bestScore ?? 0, score),
        lastAttempt: new Date().toISOString(),
      });
    }

    // Navigate back based on quiz mode (check before reset)
    const isBattleMode = !currentChapter;
    resetQuiz();
    navigate(isBattleMode ? "/battle" : "/");
  };

  if (currentQuestions.length === 0) return null;

  return (
    <Page className="bg-background min-h-screen">
      {/* Header - pt-16 để tránh dính nút X của Zalo */}
      <div className="pt-16 pb-2 px-4 bg-background sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-xl bg-[var(--secondary)] flex items-center justify-center"
          >
            <X className="w-5 h-5 text-[var(--muted-foreground)]" />
          </button>
          {!isFinished && (
            <div className="flex items-center gap-3">
              <h1 className="font-bold text-sm text-[var(--muted-foreground)] truncate max-w-[120px]">
                {chapterName}
              </h1>
              {/* Time Attack Timer */}
              {quizMode === "timeattack" && (
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                    timeLeft <= 10
                      ? "bg-[var(--duo-red)]"
                      : "bg-[var(--duo-blue)]"
                  }`}
                >
                  <Clock className="w-4 h-4 text-white" />
                  <span className="font-bold text-sm text-white">
                    {timeLeft}s
                  </span>
                </div>
              )}
              {/* Survival Lives */}
              {quizMode === "survival" && maxWrong && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--duo-red)]">
                  <Skull className="w-4 h-4 text-white" />
                  <span className="font-bold text-sm text-white">
                    {maxWrong - wrongCount}
                  </span>
                </div>
              )}
            </div>
          )}
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-8" style={{ minHeight: "calc(100vh - 100px)" }}>
        {isFinished ? <QuizResult /> : <QuizCard />}
      </div>
    </Page>
  );
}

export default QuizPage;
