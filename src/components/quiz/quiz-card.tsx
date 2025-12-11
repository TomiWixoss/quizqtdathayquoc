import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuizStore } from "@/stores/quiz-store";
import { useUserStore } from "@/stores/user-store";
import confetti from "canvas-confetti";
import { useEffect, useState } from "react";
import { useNavigate } from "zmp-ui";
import { NoHeartsModal } from "@/components/ui/custom-modal";

export function QuizCard() {
  const navigate = useNavigate();
  const {
    currentQuestions,
    currentIndex,
    selectedAnswer,
    isAnswered,
    selectAnswer,
    nextQuestion,
    score,
  } = useQuizStore();
  const {
    user,
    updateStats,
    updateStreak,
    loseHeart,
    updateDailyProgress,
    spendGems,
    refillHearts,
  } = useUserStore();
  const [showXP, setShowXP] = useState(false);
  const [showHeartLost, setShowHeartLost] = useState(false);
  const [showNoHeartsModal, setShowNoHeartsModal] = useState(false);
  const [pendingAnswer, setPendingAnswer] = useState<string | null>(null);

  const currentQ = currentQuestions[currentIndex];
  const progress = ((currentIndex + 1) / currentQuestions.length) * 100;
  const isCorrect = selectedAnswer === currentQ?.correctAnswer;
  const isLastQuestion = currentIndex === currentQuestions.length - 1;

  // Reset pending answer when question changes
  useEffect(() => {
    setPendingAnswer(null);
  }, [currentIndex]);

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

  // Select answer (just highlight, don't check yet)
  const handleSelectOption = (answerId: string) => {
    if (isAnswered) return;
    setPendingAnswer(answerId);
  };

  // Check answer when pressing "Kiểm tra" button
  const handleCheckAnswer = async () => {
    if (!pendingAnswer || isAnswered) return;

    // Check if user has hearts
    if (user && user.hearts <= 0) {
      setShowNoHeartsModal(true);
      return;
    }

    selectAnswer(pendingAnswer);
    const correct = pendingAnswer === currentQ.correctAnswer;

    if (!correct) {
      await loseHeart();
    }

    // Track daily correct for quests
    if (correct) {
      const today = new Date().toDateString();
      const dailyCorrect = parseInt(
        localStorage.getItem(`daily_correct_${today}`) || "0"
      );
      localStorage.setItem(
        `daily_correct_${today}`,
        (dailyCorrect + 1).toString()
      );

      // Track weekly XP
      const weeklyXP = parseInt(localStorage.getItem("weekly_xp") || "0");
      localStorage.setItem("weekly_xp", (weeklyXP + 10).toString());
    }

    await updateStats(correct, currentQ.chapter, correct ? 10 : 0);
    await updateDailyProgress(correct ? 10 : 2);

    if (currentIndex === 0) {
      await updateStreak();
    }
  };

  const handleBuyHearts = async () => {
    if (!user) return;
    const success = await spendGems(50);
    if (success) {
      await refillHearts();
      setShowNoHeartsModal(false);
    }
  };

  const handleGoToShop = () => {
    setShowNoHeartsModal(false);
    navigate("/shop");
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
                  <img
                    key={i}
                    src="/Heart.png"
                    alt="heart"
                    className={`w-4 h-4 ${
                      i >= (user.hearts ?? 5) ? "opacity-30 grayscale" : ""
                    }`}
                  />
                ))}
              </div>
            )}
            {/* XP */}
            <div className="flex items-center gap-1 text-[var(--duo-yellow)]">
              <img src="/Lighting.png" alt="xp" className="w-4 h-4" />
              <span className="font-bold">{score}</span>
            </div>
          </div>
        </div>
      </div>

      {/* XP Popup */}
      {showXP && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50">
          <div className="xp-pop flex items-center gap-2 bg-[var(--duo-green)] text-white px-4 py-2 rounded-full font-bold">
            <img src="/Lighting.png" alt="xp" className="w-5 h-5" />
            +10 XP
          </div>
        </div>
      )}

      {/* Heart Lost Popup */}
      {showHeartLost && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50">
          <div className="xp-pop flex items-center gap-2 bg-[var(--duo-red)] text-white px-4 py-2 rounded-full font-bold">
            <img src="/Heart.png" alt="heart" className="w-5 h-5" />
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
            const isSelected = pendingAnswer === option.id;
            const isAnsweredSelected = selectedAnswer === option.id;
            const isCorrectOption = option.id === currentQ.correctAnswer;
            const showCorrect = isAnswered && isCorrectOption;
            const showWrong =
              isAnswered && isAnsweredSelected && !isCorrectOption;

            return (
              <button
                key={option.id}
                onClick={() => handleSelectOption(option.id)}
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
                      !isSelected &&
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

      {/* Bottom Sheet - Result or Check Button */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 transition-all duration-300 z-40",
          isAnswered
            ? isCorrect
              ? "bg-[#d7ffb8]"
              : "bg-[#ffdfe0]"
            : "bg-[var(--card)] border-t border-[var(--border)]"
        )}
      >
        <div className="safe-area-bottom">
          {isAnswered ? (
            // Result bottom sheet - Duolingo style
            <div className="px-4 py-4">
              <div className="flex items-start gap-3 mb-4">
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                    isCorrect ? "bg-[var(--duo-green)]" : "bg-[var(--duo-red)]"
                  )}
                >
                  {isCorrect ? (
                    <CheckCircle2 className="w-7 h-7 text-white" />
                  ) : (
                    <XCircle className="w-7 h-7 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "font-bold text-xl",
                      isCorrect
                        ? "text-[var(--duo-green)]"
                        : "text-[var(--duo-red)]"
                    )}
                  >
                    {isCorrect ? "Tuyệt vời!" : "Sai rồi!"}
                  </p>
                  {!isCorrect && (
                    <p className="text-[var(--duo-red)] text-sm mt-1">
                      Đáp án đúng:{" "}
                      <span className="font-semibold">
                        {
                          currentQ.options.find(
                            (o) => o.id === currentQ.correctAnswer
                          )?.text
                        }
                      </span>
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={nextQuestion}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold text-base shadow-md active:scale-[0.98] transition-transform",
                  isCorrect
                    ? "bg-[var(--duo-green)] text-white"
                    : "bg-[var(--duo-red)] text-white"
                )}
              >
                {isLastQuestion ? "Xem kết quả" : "Tiếp tục"}
              </button>
            </div>
          ) : (
            // Check button
            <div className="px-4 py-4">
              <button
                onClick={handleCheckAnswer}
                disabled={!pendingAnswer}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98]",
                  pendingAnswer
                    ? "bg-[var(--duo-green)] text-white shadow-[0_4px_0_0_#58a700]"
                    : "bg-[var(--secondary)] text-[var(--muted-foreground)] cursor-not-allowed"
                )}
              >
                Kiểm tra
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Spacer for bottom sheet */}
      <div className="h-24" />

      {/* No Hearts Modal */}
      <NoHeartsModal
        isOpen={showNoHeartsModal}
        onClose={() => setShowNoHeartsModal(false)}
        onBuyHearts={handleBuyHearts}
        onGoToShop={handleGoToShop}
        userGems={user?.gems ?? 0}
        heartCost={50}
      />
    </div>
  );
}
