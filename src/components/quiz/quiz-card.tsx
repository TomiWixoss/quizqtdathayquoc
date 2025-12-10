import { CheckCircle2, XCircle, Zap, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuizStore } from "@/stores/quiz-store";
import { useUserStore } from "@/stores/user-store";
import confetti from "canvas-confetti";
import { useEffect, useState } from "react";

export function QuizCard() {
  const {
    currentQuestions,
    currentIndex,
    selectedAnswer,
    isAnswered,
    selectAnswer,
    nextQuestion,
    score,
  } = useQuizStore();
  const { user, updateStats, updateStreak, loseHeart, updateDailyProgress } =
    useUserStore();
  const [showXP, setShowXP] = useState(false);
  const [showHeartLost, setShowHeartLost] = useState(false);

  const currentQ = currentQuestions[currentIndex];
  const progress = ((currentIndex + 1) / currentQuestions.length) * 100;
  const isCorrect = selectedAnswer === currentQ?.correctAnswer;
  const isLastQuestion = currentIndex === currentQuestions.length - 1;

  useEffect(() => {
    if (isAnswered) {
      if (isCorrect) {
        setShowXP(true);
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#58cc02", "#89e219", "#ffc800"],
        });
        setTimeout(() => setShowXP(false), 800);
      } else {
        setShowHeartLost(true);
        setTimeout(() => setShowHeartLost(false), 800);
      }
    }
  }, [isAnswered, isCorrect]);

  const handleSelectAnswer = async (answerId: string) => {
    selectAnswer(answerId);
    const correct = answerId === currentQ.correctAnswer;

    if (!correct) {
      await loseHeart();
    }

    await updateStats(correct, currentQ.chapter, correct ? 10 : 0);
    await updateDailyProgress(correct ? 10 : 2);

    if (currentIndex === 0) {
      await updateStreak();
    }
  };

  if (!currentQ) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="progress-duo">
          <div
            className="progress-duo-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-2 text-sm">
          <span className="text-[var(--muted-foreground)]">
            Câu {currentIndex + 1}/{currentQuestions.length}
          </span>
          <div className="flex items-center gap-3">
            {/* Hearts */}
            {user && (
              <div className="flex items-center gap-0.5">
                {[...Array(user.maxHearts ?? 5)].map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-4 h-4 ${
                      i < (user.hearts ?? 5)
                        ? "text-[var(--duo-red)] fill-[var(--duo-red)]"
                        : "text-[var(--muted-foreground)]"
                    }`}
                  />
                ))}
              </div>
            )}
            {/* XP */}
            <div className="flex items-center gap-1 text-[var(--duo-yellow)]">
              <Zap className="w-4 h-4" />
              <span className="font-bold">{score}</span>
            </div>
          </div>
        </div>
      </div>

      {/* XP Popup */}
      {showXP && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50">
          <div className="xp-pop flex items-center gap-2 bg-[var(--duo-green)] text-white px-4 py-2 rounded-full font-bold">
            <Zap className="w-5 h-5" />
            +10 XP
          </div>
        </div>
      )}

      {/* Heart Lost Popup */}
      {showHeartLost && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50">
          <div className="xp-pop flex items-center gap-2 bg-[var(--duo-red)] text-white px-4 py-2 rounded-full font-bold">
            <Heart className="w-5 h-5" />
            -1
          </div>
        </div>
      )}

      {/* Question */}
      <div className="flex-1">
        <div className="inline-block px-3 py-1 rounded-full bg-[var(--secondary)] text-xs text-[var(--muted-foreground)] mb-3">
          {currentQ.chapterName}
        </div>

        <h2 className="text-lg font-bold text-foreground mb-5 leading-relaxed">
          {currentQ.question}
        </h2>

        {/* Options */}
        <div className="space-y-2.5">
          {currentQ.options.map((option) => {
            const isSelected = selectedAnswer === option.id;
            const isCorrectOption = option.id === currentQ.correctAnswer;
            const showCorrect = isAnswered && isCorrectOption;
            const showWrong = isAnswered && isSelected && !isCorrectOption;

            return (
              <button
                key={option.id}
                onClick={() => !isAnswered && handleSelectAnswer(option.id)}
                disabled={isAnswered}
                className={cn(
                  "option-btn w-full p-3 text-left flex items-center gap-3",
                  isSelected && !isAnswered && "selected",
                  showCorrect && "correct",
                  showWrong && "wrong"
                )}
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0",
                    showCorrect && "bg-[var(--duo-green)] text-white",
                    showWrong && "bg-[var(--duo-red)] text-white",
                    !isAnswered &&
                      "bg-[var(--secondary)] text-[var(--muted-foreground)]",
                    isSelected &&
                      !isAnswered &&
                      "bg-[var(--duo-blue)] text-white"
                  )}
                >
                  {showCorrect ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : showWrong ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    option.id
                  )}
                </div>
                <span className="flex-1 text-sm text-foreground">
                  {option.text}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Action */}
      {isAnswered && (
        <div className="mt-5">
          <div
            className={cn(
              "p-3 rounded-2xl mb-3",
              isCorrect ? "bg-[var(--duo-green)]/20" : "bg-[var(--duo-red)]/20"
            )}
          >
            <div className="flex items-center gap-2">
              {isCorrect ? (
                <CheckCircle2 className="w-5 h-5 text-[var(--duo-green)]" />
              ) : (
                <XCircle className="w-5 h-5 text-[var(--duo-red)]" />
              )}
              <span
                className={cn(
                  "font-bold",
                  isCorrect
                    ? "text-[var(--duo-green)]"
                    : "text-[var(--duo-red)]"
                )}
              >
                {isCorrect ? "Chính xác!" : "Chưa đúng!"}
              </span>
            </div>
            {!isCorrect && (
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Đáp án: {currentQ.correctAnswer}
              </p>
            )}
          </div>
          <button
            onClick={nextQuestion}
            className={cn(
              "btn-3d w-full py-3.5 text-base",
              isCorrect ? "btn-3d-green" : "btn-3d-blue"
            )}
          >
            {isLastQuestion ? "Xem kết quả" : "Tiếp tục"}
          </button>
        </div>
      )}
    </div>
  );
}
