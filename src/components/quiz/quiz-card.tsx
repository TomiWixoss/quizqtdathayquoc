import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuizStore } from "@/stores/quiz-store";
import { useUserStore } from "@/stores/user-store";
import confetti from "canvas-confetti";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    quizMode,
  } = useQuizStore();
  const {
    user,
    updateStats,
    updateStreak,
    loseHeart,
    updateDailyProgress,
    spendGems,
    refillHearts,
    hasUnlimitedHearts,
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
      } else if (quizMode === "chapter" && !hasUnlimitedHearts()) {
        // Chỉ hiện mất tim ở chế độ học chương và không có tim vô hạn
        setShowHeartLost(true);
        setTimeout(() => setShowHeartLost(false), 800);
      }
    }
  }, [isAnswered, isCorrect, quizMode]);

  // Select answer (just highlight, don't check yet)
  const handleSelectOption = (answerId: string) => {
    if (isAnswered) return;
    setPendingAnswer(answerId);
  };

  // Check answer when pressing "Kiểm tra" button
  const handleCheckAnswer = async () => {
    if (!pendingAnswer || isAnswered) return;

    // Chế độ luyện tập (battle) không cần tim, chỉ chế độ học chương mới cần
    const isPracticeMode = quizMode !== "chapter";

    // Check if user has hearts (bỏ qua nếu có unlimited hearts hoặc đang ở chế độ luyện tập)
    if (user && user.hearts <= 0 && !hasUnlimitedHearts() && !isPracticeMode) {
      setShowNoHeartsModal(true);
      return;
    }

    selectAnswer(pendingAnswer);
    const correct = pendingAnswer === currentQ.correctAnswer;

    // Chỉ trừ tim khi sai ở chế độ học chương
    if (!correct && !isPracticeMode) {
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
    const success = await spendGems(500);
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
            {/* Hearts - chỉ hiện ở chế độ học chương, không hiện ở luyện tập */}
            {user &&
              quizMode === "chapter" &&
              (hasUnlimitedHearts() ? (
                <div className="flex items-center gap-1 bg-gradient-to-r from-[var(--duo-red)] to-[var(--duo-pink)] px-2 py-0.5 rounded-full">
                  <img
                    src="/AppAssets/Heart.png"
                    alt="heart"
                    className="w-4 h-4"
                  />
                  <span className="text-white font-bold text-sm">∞</span>
                </div>
              ) : (
                <div className="flex items-center gap-0.5">
                  {[...Array(user.maxHearts ?? 5)].map((_, i) => (
                    <img
                      key={i}
                      src="/AppAssets/Heart.png"
                      alt="heart"
                      className={`w-4 h-4 ${
                        i >= (user.hearts ?? 5) ? "opacity-30 grayscale" : ""
                      }`}
                    />
                  ))}
                </div>
              ))}
            {/* XP */}
            <div className="flex items-center gap-1 text-[var(--duo-yellow)]">
              <img src="/AppAssets/Lighting.png" alt="xp" className="w-4 h-4" />
              <span className="font-bold">{score}</span>
            </div>
          </div>
        </div>
      </div>

      {/* XP Popup */}
      {showXP && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50">
          <div className="xp-pop flex items-center gap-2 bg-[var(--duo-green)] text-white px-4 py-2 rounded-full font-bold">
            <img src="/AppAssets/Lighting.png" alt="xp" className="w-5 h-5" />
            +10 XP
          </div>
        </div>
      )}

      {/* Heart Lost Popup */}
      {showHeartLost && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50">
          <div className="xp-pop flex items-center gap-2 bg-[var(--duo-red)] text-white px-4 py-2 rounded-full font-bold">
            <img src="/AppAssets/Heart.png" alt="heart" className="w-5 h-5" />
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
          "fixed bottom-0 left-0 right-0 z-40 safe-bottom transition-colors duration-300",
          isAnswered
            ? isCorrect
              ? "bg-[#d7ffb8]"
              : "bg-[#ffdfe0]"
            : "bg-[var(--card)] border-t-2 border-[var(--border)]"
        )}
      >
        <div className="max-w-2xl mx-auto w-full">
        {isAnswered ? (
          // Result bottom sheet - Duolingo style
          <div className="px-4 pt-4 pb-6">
            <div className="flex items-center gap-4 mb-4">
              {isCorrect ? (
                <CheckCircle2 className="w-10 h-10 text-[var(--duo-green)]" />
              ) : (
                <XCircle className="w-10 h-10 text-[var(--duo-red)]" />
              )}
              <div className="flex-1">
                <p
                  className={cn(
                    "font-bold text-xl",
                    isCorrect
                      ? "text-[var(--duo-green)]"
                      : "text-[var(--duo-red)]"
                  )}
                >
                  {isCorrect ? "Chính xác!" : "Sai mất rồi!"}
                </p>
                {!isCorrect && (
                  <p className="text-[var(--duo-red)]/80 text-sm">
                    Đáp án:{" "}
                    {
                      currentQ.options.find(
                        (o) => o.id === currentQ.correctAnswer
                      )?.text
                    }
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={nextQuestion}
              className={cn(
                "btn-3d w-full py-3.5 text-base",
                isCorrect ? "btn-3d-green" : "btn-3d-orange"
              )}
            >
              {isLastQuestion ? "XEM KẾT QUẢ" : "TIẾP TỤC"}
            </button>
          </div>
        ) : (
          // Check button
          <div className="px-4 pt-4 pb-6">
            <button
              onClick={handleCheckAnswer}
              disabled={!pendingAnswer}
              className={cn(
                "btn-3d w-full py-3.5 text-base",
                pendingAnswer
                  ? "btn-3d-green"
                  : "bg-[var(--secondary)] text-[var(--muted-foreground)] cursor-not-allowed shadow-[0_5px_0_var(--border)]"
              )}
            >
              KIỂM TRA
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
        heartCost={500}
      />
    </div>
  );
}
