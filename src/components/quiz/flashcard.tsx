import { ChevronRight, RotateCcw } from "lucide-react";
import { useQuizStore } from "@/stores/quiz-store";
import { useUserStore } from "@/stores/user-store";
import { useState } from "react";

export function Flashcard() {
  const {
    currentQuestions,
    currentIndex,
    nextQuestion,
  } = useQuizStore();
  const { user } = useUserStore();
  const [isFlipped, setIsFlipped] = useState(false);

  const currentQ = currentQuestions[currentIndex];
  const progress = ((currentIndex + 1) / currentQuestions.length) * 100;
  const isLastQuestion = currentIndex === currentQuestions.length - 1;

  const handleNext = () => {
    setIsFlipped(false);
    nextQuestion();
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const correctOption = currentQ?.options.find(
    (o) => o.id === currentQ.correctAnswer
  );

  if (!currentQ) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      {/* Progress Bar */}
      <div className="w-full max-w-md mb-6">
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
          {user && (
            <div className="flex items-center gap-1 bg-gradient-to-r from-[var(--duo-red)] to-[var(--duo-pink)] px-2 py-0.5 rounded-full">
              <img
                src="/AppAssets/Heart.png"
                alt="heart"
                className="w-4 h-4"
              />
              <span className="text-white font-bold text-sm">∞</span>
            </div>
          )}
        </div>
      </div>

      {/* Flashcard */}
      <div className="w-full max-w-md mb-6">
        <div
          className="flashcard-container"
          style={{
            perspective: "1000px",
            minHeight: "400px",
          }}
        >
          <div
            className={`flashcard ${isFlipped ? "flipped" : ""}`}
            onClick={handleFlip}
            style={{
              position: "relative",
              width: "100%",
              height: "400px",
              transformStyle: "preserve-3d",
              transition: "transform 0.6s",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              cursor: "pointer",
            }}
          >
            {/* Front - Question */}
            <div
              className="flashcard-front"
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
            >
              <div className="card-3d h-full p-6 flex flex-col items-center justify-center bg-gradient-to-br from-[var(--duo-blue)]/10 to-[var(--duo-purple)]/10">
                <div className="inline-block px-3 py-1 rounded-full bg-[var(--secondary)] text-xs text-[var(--muted-foreground)] mb-4">
                  {currentQ.chapterName}
                </div>
                <h2 className="text-xl font-bold text-foreground text-center mb-6 leading-relaxed">
                  {currentQ.question}
                </h2>
                <div className="mt-auto">
                  <div className="flex items-center gap-2 text-[var(--muted-foreground)] text-sm">
                    <RotateCcw className="w-4 h-4" />
                    <span>Nhấn để xem đáp án</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Back - Answer */}
            <div
              className="flashcard-back"
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <div className="card-3d h-full p-6 flex flex-col items-center justify-center bg-gradient-to-br from-[var(--duo-green)]/10 to-[var(--duo-yellow)]/10">
                <div className="inline-block px-3 py-1 rounded-full bg-[var(--duo-green)]/20 text-xs text-[var(--duo-green)] font-bold mb-4">
                  ĐÁP ÁN ĐÚNG
                </div>
                <div className="w-full bg-[var(--duo-green)]/10 border-2 border-[var(--duo-green)] rounded-2xl p-4 mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-[var(--duo-green)] text-white flex items-center justify-center font-bold">
                      {correctOption?.id}
                    </div>
                    <span className="font-bold text-[var(--duo-green)]">
                      Đáp án {correctOption?.id}
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-foreground leading-relaxed">
                    {correctOption?.text}
                  </p>
                </div>
                <div className="mt-auto">
                  <div className="flex items-center gap-2 text-[var(--muted-foreground)] text-sm">
                    <RotateCcw className="w-4 h-4" />
                    <span>Nhấn để xem câu hỏi</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="w-full max-w-md space-y-2">
        <button
          onClick={handleFlip}
          className="btn-3d btn-3d-blue w-full py-3 text-base flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          {isFlipped ? "Xem câu hỏi" : "Xem đáp án"}
        </button>
        <button
          onClick={handleNext}
          className="btn-3d btn-3d-green w-full py-3.5 text-base flex items-center justify-center gap-2"
        >
          {isLastQuestion ? "HOÀN THÀNH" : "TIẾP TỤC"}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
