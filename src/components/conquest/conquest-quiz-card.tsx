import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIQuestion } from "@/services/ai-quiz-service";
import { useConquestStore } from "@/stores/conquest-store";
import { MatchingQuestion } from "@/components/conquest/question-types/matching-question";
import { OrderingQuestion } from "@/components/conquest/question-types/ordering-question";
import { FillBlankQuestion } from "@/components/conquest/question-types/fill-blank-question";
import confetti from "canvas-confetti";

interface Props {
  question: AIQuestion;
  onEnd: () => void | Promise<void>;
}

export function ConquestQuizCard({ question, onEnd }: Props) {
  const { submitAnswer, nextQuestion, isLoading, questions, currentIndex } =
    useConquestStore();
  const [selectedAnswer, setSelectedAnswer] = useState<
    string | string[] | null
  >(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<{
    correct: boolean;
    points: number;
  } | null>(null);
  const [isLoadingNext, setIsLoadingNext] = useState(false);

  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleSubmit = () => {
    if (!selectedAnswer) return;
    const res = submitAnswer(selectedAnswer);
    setResult(res);
    setIsSubmitted(true);

    if (res.correct) {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#58cc02", "#89e219", "#ffc800"],
      });
    }
  };

  const handleNext = async () => {
    setIsLoadingNext(true);
    const hasMore = await nextQuestion();
    if (!hasMore) {
      onEnd();
      return;
    }
    setSelectedAnswer(null);
    setIsSubmitted(false);
    setResult(null);
    setIsLoadingNext(false);
  };

  // Render multiple choice / true false
  const renderMultipleChoice = () => (
    <div className="space-y-2.5">
      {question.options?.map((option, idx) => {
        const isSelected = selectedAnswer === option;
        const isCorrectOption = option === question.correctAnswer;
        const showCorrect = isSubmitted && isCorrectOption;
        const showWrong = isSubmitted && isSelected && !isCorrectOption;

        return (
          <button
            key={idx}
            onClick={() => !isSubmitted && setSelectedAnswer(option)}
            disabled={isSubmitted}
            className={cn(
              "option-btn w-full p-3 text-left flex items-center gap-3",
              isSelected && !isSubmitted && "selected",
              showCorrect && "correct",
              showWrong && "wrong"
            )}
          >
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0",
                showCorrect && "bg-[var(--duo-green)] text-white",
                showWrong && "bg-[var(--duo-red)] text-white",
                !isSubmitted &&
                  !isSelected &&
                  "bg-[var(--secondary)] text-[var(--muted-foreground)]",
                isSelected && !isSubmitted && "bg-[var(--duo-blue)] text-white"
              )}
            >
              {showCorrect ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : showWrong ? (
                <XCircle className="w-4 h-4" />
              ) : (
                String.fromCharCode(65 + idx)
              )}
            </div>
            <span className="flex-1 text-sm text-foreground">{option}</span>
          </button>
        );
      })}
    </div>
  );

  // Render theo loại câu hỏi
  const renderQuestionContent = () => {
    switch (question.type) {
      case "matching":
        return (
          <MatchingQuestion
            question={question}
            onAnswer={setSelectedAnswer}
            disabled={isSubmitted}
          />
        );
      case "ordering":
        return (
          <OrderingQuestion
            question={question}
            onAnswer={setSelectedAnswer}
            disabled={isSubmitted}
          />
        );
      case "fill_blank":
        return (
          <FillBlankQuestion
            question={question}
            onAnswer={setSelectedAnswer}
            disabled={isSubmitted}
          />
        );
      case "multiple_choice":
      case "true_false":
      default:
        return renderMultipleChoice();
    }
  };

  return (
    <div className="flex flex-col h-full px-4 py-4">
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
            Câu {currentIndex + 1}/{questions.length}
          </span>
        </div>
      </div>

      {/* Question Type Badge */}
      <div className="inline-block px-3 py-1 rounded-full bg-[var(--secondary)] text-xs text-[var(--muted-foreground)] mb-3 w-fit">
        {question.type === "multiple_choice" && "Trắc nghiệm"}
        {question.type === "true_false" && "Đúng/Sai"}
        {question.type === "fill_blank" && "Điền từ"}
        {question.type === "matching" && "Nối cặp"}
        {question.type === "ordering" && "Sắp xếp"}
      </div>

      {/* Question */}
      <h2 className="text-lg font-bold text-foreground mb-5 leading-relaxed">
        {question.question}
      </h2>

      {/* Options */}
      <div className="flex-1">{renderQuestionContent()}</div>

      {/* Spacer for bottom sheet */}
      <div className="h-28" />

      {/* Bottom Sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 p-4 pb-6 transition-all duration-300 z-40",
          isSubmitted && result
            ? result.correct
              ? "bg-[var(--duo-green)]/95"
              : "bg-[var(--duo-red)]/95"
            : "bg-[var(--card)] border-t border-[var(--border)]"
        )}
      >
        {isSubmitted && result ? (
          // Result bottom sheet
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {result.correct ? (
                  <CheckCircle2 className="w-8 h-8 text-white" />
                ) : (
                  <XCircle className="w-8 h-8 text-white" />
                )}
                <div>
                  <p className="font-bold text-white text-lg">
                    {result.correct ? "Chính xác!" : "Chưa đúng!"}
                  </p>
                  {question.explanation && (
                    <p className="text-white/80 text-sm">
                      {question.explanation}
                    </p>
                  )}
                </div>
              </div>
              <span className="font-bold text-white text-lg">
                {result.points >= 0 ? "+" : ""}
                {result.points} RP
              </span>
            </div>
            <button
              onClick={handleNext}
              disabled={isLoadingNext}
              className="w-full py-3.5 rounded-2xl font-bold text-base bg-white text-[var(--duo-green)] shadow-lg"
            >
              {isLoadingNext
                ? "Đang tải..."
                : isLastQuestion
                ? "Xem kết quả"
                : "Tiếp tục"}
            </button>
          </div>
        ) : (
          // Check button
          <div className="max-w-lg mx-auto">
            <button
              onClick={handleSubmit}
              disabled={!selectedAnswer || isLoading}
              className={cn(
                "w-full py-3.5 rounded-2xl font-bold text-base transition-all",
                selectedAnswer
                  ? "btn-3d btn-3d-green"
                  : "bg-[var(--secondary)] text-[var(--muted-foreground)] cursor-not-allowed"
              )}
            >
              Kiểm tra
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
