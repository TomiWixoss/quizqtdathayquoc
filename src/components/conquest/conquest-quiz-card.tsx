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
    <div className="px-4 py-4 pb-8">
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
      <div className="inline-block px-3 py-1 rounded-full bg-[var(--secondary)] text-xs text-[var(--muted-foreground)] mb-3">
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
      {renderQuestionContent()}

      {/* Result feedback */}
      {isSubmitted && result && (
        <div
          className={cn(
            "p-3 rounded-2xl mt-4",
            result.correct
              ? "bg-[var(--duo-green)]/20"
              : "bg-[var(--duo-red)]/20"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {result.correct ? (
                <CheckCircle2 className="w-5 h-5 text-[var(--duo-green)]" />
              ) : (
                <XCircle className="w-5 h-5 text-[var(--duo-red)]" />
              )}
              <span
                className={cn(
                  "font-bold",
                  result.correct
                    ? "text-[var(--duo-green)]"
                    : "text-[var(--duo-red)]"
                )}
              >
                {result.correct ? "Chính xác!" : "Chưa đúng!"}
              </span>
            </div>
            <span
              className={cn(
                "font-bold",
                result.points >= 0
                  ? "text-[var(--duo-green)]"
                  : "text-[var(--duo-red)]"
              )}
            >
              {result.points >= 0 ? "+" : ""}
              {result.points} RP
            </span>
          </div>
          {question.explanation && (
            <p className="text-xs text-[var(--muted-foreground)] mt-2">
              {question.explanation}
            </p>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-5">
        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            disabled={!selectedAnswer || isLoading}
            className={cn(
              "btn-3d w-full py-3.5 text-base",
              selectedAnswer ? "btn-3d-green" : "btn-3d-blue opacity-50"
            )}
          >
            Xác nhận
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={isLoadingNext}
            className={cn(
              "btn-3d w-full py-3.5 text-base",
              result?.correct ? "btn-3d-green" : "btn-3d-blue"
            )}
          >
            {isLoadingNext
              ? "Đang tải..."
              : isLastQuestion
              ? "Xem kết quả"
              : "Tiếp tục"}
          </button>
        )}
      </div>
    </div>
  );
}
