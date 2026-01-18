import { useNavigate } from "react-router-dom";
import { Page } from "@/components/ui/page";
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

  // Redirect to home only on initial load if no questions (user accessed /quiz directly)
  useEffect(() => {
    if (currentQuestions.length === 0) {
      // Check if we just reset (navigating away) - don't redirect
      const isNavigatingAway = window.location.pathname !== "/quiz";
      if (!isNavigatingAway) {
        navigate("/");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      {/* Header */}
      {!isFinished && (
        <div className="fixed top-0 left-0 right-0 z-40 pt-4 pb-4 px-4 bg-background border-b shadow-sm">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-xl bg-[var(--secondary)] flex items-center justify-center"
            >
              <X className="w-5 h-5 text-[var(--muted-foreground)]" />
            </button>
            <div className="flex items-center gap-3">
              <h1 className="font-bold text-sm text-[var(--muted-foreground)] truncate max-w-[200px]">
                {currentChapter
                  ? `Chương ${currentChapter}: ${chapterName}`
                  : chapterName}
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
            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className={`px-4 pb-24 ${isFinished ? "pt-4" : "pt-24"} max-w-2xl mx-auto`}
        style={{ minHeight: "calc(100vh - 100px)" }}
      >
        {isFinished ? <QuizResult /> : <QuizCard />}
      </div>
    </Page>
  );
}

export default QuizPage;
