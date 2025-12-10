import { CheckCircle2, XCircle, Zap } from "lucide-react";
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
  const { updateStats, updateStreak } = useUserStore();
  const [showXP, setShowXP] = useState(false);

  const currentQ = currentQuestions[currentIndex];
  const progress = ((currentIndex + 1) / currentQuestions.length) * 100;
  const isCorrect = selectedAnswer === currentQ?.correctAnswer;
  const isLastQuestion = currentIndex === currentQuestions.length - 1;

  useEffect(() => {
    if (isAnswered && isCorrect) {
      setShowXP(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#58cc02", "#89e219", "#ffc800"],
      });
      setTimeout(() => setShowXP(false), 800);
    }
  }, [isAnswered, isCorrect]);

  const handleSelectAnswer = async (answerId: string) => {
    selectAnswer(answerId);
    const correct = answerId === currentQ.correctAnswer;
    await updateStats(correct, currentQ.chapter, correct ? 10 : 0);
    if (currentIndex === 0) {
      await updateStreak();
    }
  };

  if (!currentQ) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="progress-duo">
          <div
            className="progress-duo-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-[var(--muted-foreground)]">
            Câu {currentIndex + 1}/{currentQuestions.length}
          </span>
          <div className="flex items-center gap-1 text-[var(--duo-yellow)]">
            <Zap className="w-4 h-4" />
            <span className="font-bold">{score} XP</span>
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

      {/* Question */}
      <div className="flex-1">
        {/* Chapter badge */}
        <div className="inline-block px-3 py-1 rounded-full bg-[var(--secondary)] text-xs text-[var(--muted-foreground)] mb-3">
          {currentQ.chapterName}
        </div>

        {/* Question text */}
        <h2 className="text-xl font-bold text-foreground mb-6 leading-relaxed">
          {currentQ.question}
        </h2>

        {/* Options */}
        <div className="space-y-3">
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
                  "option-btn w-full p-4 text-left flex items-center gap-3",
                  isSelected && !isAnswered && "selected",
                  showCorrect && "correct",
                  showWrong && "wrong"
                )}
              >
                {/* Option indicator */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0",
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
                    <CheckCircle2 className="w-5 h-5" />
                  ) : showWrong ? (
                    <XCircle className="w-5 h-5" />
                  ) : (
                    option.id
                  )}
                </div>
                <span className="flex-1 text-foreground">{option.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Action */}
      {isAnswered && (
        <div className="mt-6">
          {/* Feedback */}
          <div
            className={cn(
              "p-4 rounded-2xl mb-4",
              isCorrect ? "bg-[var(--duo-green)]/20" : "bg-[var(--duo-red)]/20"
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              {isCorrect ? (
                <CheckCircle2 className="w-6 h-6 text-[var(--duo-green)]" />
              ) : (
                <XCircle className="w-6 h-6 text-[var(--duo-red)]" />
              )}
              <span
                className={cn(
                  "font-bold text-lg",
                  isCorrect
                    ? "text-[var(--duo-green)]"
                    : "text-[var(--duo-red)]"
                )}
              >
                {isCorrect ? "Chính xác!" : "Chưa đúng!"}
              </span>
            </div>
            {!isCorrect && (
              <p className="text-sm text-[var(--muted-foreground)]">
                Đáp án đúng: {currentQ.correctAnswer}
              </p>
            )}
          </div>

          {/* Next button */}
          <button
            onClick={nextQuestion}
            className={cn(
              "btn-3d w-full py-4 text-lg",
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
