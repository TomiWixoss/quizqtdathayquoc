import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIQuestion } from "@/services/ai-quiz-service";

interface Props {
  question: AIQuestion;
  onAnswer: (answer: string[]) => void;
  disabled: boolean;
}

export function MatchingQuestion({ question, onAnswer, disabled }: Props) {
  const pairs = question.pairs || [];
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matches, setMatches] = useState<Record<number, number>>({});

  const leftItems = pairs.map((p, i) => ({ text: p.left, index: i }));
  const rightItems = pairs.map((p, i) => ({ text: p.right, index: i }));

  const handleLeftClick = (index: number) => {
    if (disabled) return;
    setSelectedLeft(index);
  };

  const handleRightClick = (index: number) => {
    if (disabled || selectedLeft === null) return;

    const newMatches = { ...matches, [selectedLeft]: index };
    setMatches(newMatches);
    setSelectedLeft(null);

    const answer = Object.entries(newMatches).map(([l, r]) => `${l}-${r}`);
    onAnswer(answer);
  };

  const handleReset = () => {
    if (disabled) return;
    setMatches({});
    setSelectedLeft(null);
    onAnswer([]);
  };

  const getMatchedRight = (leftIndex: number): number | undefined => {
    return matches[leftIndex];
  };

  const isRightMatched = (rightIndex: number): boolean => {
    return Object.values(matches).includes(rightIndex);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted-foreground)]">
        Chọn một mục bên trái, sau đó chọn mục tương ứng bên phải
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* Left column */}
        <div className="space-y-2">
          {leftItems.map((item) => {
            const isSelected = selectedLeft === item.index;
            const isMatched = getMatchedRight(item.index) !== undefined;

            return (
              <button
                key={`left-${item.index}`}
                onClick={() => handleLeftClick(item.index)}
                disabled={disabled}
                className={cn(
                  "option-btn w-full p-3 text-left text-sm",
                  isSelected && "selected",
                  isMatched && "correct"
                )}
              >
                {item.text}
              </button>
            );
          })}
        </div>

        {/* Right column */}
        <div className="space-y-2">
          {rightItems.map((item) => {
            const isMatched = isRightMatched(item.index);

            return (
              <button
                key={`right-${item.index}`}
                onClick={() => handleRightClick(item.index)}
                disabled={disabled || selectedLeft === null || isMatched}
                className={cn(
                  "option-btn w-full p-3 text-left text-sm",
                  isMatched && "correct",
                  selectedLeft !== null &&
                    !isMatched &&
                    "border-[var(--duo-blue)]/50"
                )}
              >
                {item.text}
              </button>
            );
          })}
        </div>
      </div>

      {/* Matched pairs display */}
      {Object.keys(matches).length > 0 && (
        <div className="card-3d p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-[var(--muted-foreground)]">Đã nối:</p>
            {!disabled && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--duo-orange)]/20 text-[var(--duo-orange)] text-xs font-bold"
              >
                <RotateCcw className="w-3 h-3" />
                Làm lại
              </button>
            )}
          </div>
          <div className="space-y-1">
            {Object.entries(matches).map(([leftIdx, rightIdx]) => (
              <p key={leftIdx} className="text-sm text-foreground">
                {leftItems[Number(leftIdx)]?.text} →{" "}
                {rightItems[rightIdx]?.text}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
