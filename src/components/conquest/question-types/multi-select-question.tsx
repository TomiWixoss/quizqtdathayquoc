import { useState } from "react";
import { CheckCircle2, XCircle, Square, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIQuestion } from "@/services/ai-quiz-service";

interface Props {
  question: AIQuestion;
  onAnswer: (answer: string[]) => void;
  disabled: boolean;
}

export function MultiSelectQuestion({ question, onAnswer, disabled }: Props) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const handleToggle = (option: string) => {
    if (disabled) return;

    const newSelected = selectedOptions.includes(option)
      ? selectedOptions.filter((o) => o !== option)
      : [...selectedOptions, option];

    setSelectedOptions(newSelected);
    onAnswer(newSelected);
  };

  const correctAnswers = Array.isArray(question.correctAnswer)
    ? question.correctAnswer
    : [question.correctAnswer];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--duo-purple)]/20 border border-[var(--duo-purple)]/30">
        <CheckSquare className="w-4 h-4 text-[var(--duo-purple)]" />
        <p className="text-xs text-[var(--duo-purple)] font-medium">
          Chọn TẤT CẢ đáp án đúng ({correctAnswers.length} đáp án)
        </p>
      </div>

      <div className="space-y-2.5">
        {question.options?.map((option, idx) => {
          const isSelected = selectedOptions.includes(option);
          const isCorrectOption = correctAnswers.includes(option);
          const showCorrect = disabled && isCorrectOption;
          const showWrong = disabled && isSelected && !isCorrectOption;
          const showMissed = disabled && !isSelected && isCorrectOption;

          return (
            <button
              key={idx}
              onClick={() => handleToggle(option)}
              disabled={disabled}
              className={cn(
                "option-btn w-full p-3 text-left flex items-center gap-3",
                isSelected && !disabled && "selected",
                showCorrect && "correct",
                showWrong && "wrong",
                showMissed &&
                  "border-[var(--duo-yellow)] bg-[var(--duo-yellow)]/10"
              )}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                  showCorrect && "bg-[var(--duo-green)] text-white",
                  showWrong && "bg-[var(--duo-red)] text-white",
                  showMissed && "bg-[var(--duo-yellow)] text-white",
                  !disabled && isSelected && "bg-[var(--duo-blue)] text-white",
                  !disabled &&
                    !isSelected &&
                    "bg-[var(--secondary)] text-[var(--muted-foreground)]"
                )}
              >
                {showCorrect ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : showWrong ? (
                  <XCircle className="w-4 h-4" />
                ) : showMissed ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : isSelected ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </div>
              <span className="flex-1 text-sm text-foreground">{option}</span>
            </button>
          );
        })}
      </div>

      {disabled && (
        <div className="text-xs text-[var(--muted-foreground)] mt-2">
          Bạn chọn đúng:{" "}
          {selectedOptions.filter((o) => correctAnswers.includes(o)).length}/
          {correctAnswers.length}
        </div>
      )}
    </div>
  );
}
