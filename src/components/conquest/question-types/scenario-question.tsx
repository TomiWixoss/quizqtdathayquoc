import { useState } from "react";
import { CheckCircle2, XCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIQuestion } from "@/services/ai-quiz-service";

interface Props {
  question: AIQuestion;
  onAnswer: (answer: string) => void;
  disabled: boolean;
}

export function ScenarioQuestion({ question, onAnswer, disabled }: Props) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const handleSelect = (option: string) => {
    if (disabled) return;
    setSelectedAnswer(option);
    onAnswer(option);
  };

  return (
    <div className="space-y-4">
      {/* Scenario Box */}
      {question.scenario && (
        <div className="card-3d p-4 bg-gradient-to-br from-[var(--duo-purple)]/10 to-[var(--duo-blue)]/10 border-[var(--duo-purple)]/30">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--duo-purple)]/20 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-[var(--duo-purple)]" />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--duo-purple)] mb-1">
                TÌNH HUỐNG
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                {question.scenario}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Options */}
      <div className="space-y-2.5">
        {question.options?.map((option, idx) => {
          const isSelected = selectedAnswer === option;
          const isCorrectOption = option === question.correctAnswer;
          const showCorrect = disabled && isCorrectOption;
          const showWrong = disabled && isSelected && !isCorrectOption;

          return (
            <button
              key={idx}
              onClick={() => handleSelect(option)}
              disabled={disabled}
              className={cn(
                "option-btn w-full p-3 text-left flex items-center gap-3",
                isSelected && !disabled && "selected",
                showCorrect && "correct",
                showWrong && "wrong"
              )}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0",
                  showCorrect && "bg-[var(--duo-green)] text-white",
                  showWrong && "bg-[var(--duo-red)] text-white",
                  !disabled &&
                    !isSelected &&
                    "bg-[var(--secondary)] text-[var(--muted-foreground)]",
                  isSelected && !disabled && "bg-[var(--duo-blue)] text-white"
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
    </div>
  );
}
