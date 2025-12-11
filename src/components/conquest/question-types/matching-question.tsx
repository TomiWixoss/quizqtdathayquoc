import { useState } from "react";
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

    // Convert to answer format
    const answer = Object.entries(newMatches).map(([l, r]) => `${l}-${r}`);
    onAnswer(answer);
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
                className={`w-full p-3 rounded-lg text-left text-sm border-2 transition-all ${
                  isSelected
                    ? "border-primary bg-primary/20"
                    : isMatched
                    ? "border-green-500 bg-green-500/20"
                    : "border-[var(--border)] bg-[var(--card)]"
                }`}
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
                className={`w-full p-3 rounded-lg text-left text-sm border-2 transition-all ${
                  isMatched
                    ? "border-green-500 bg-green-500/20"
                    : selectedLeft !== null && !isMatched
                    ? "border-primary/50 bg-primary/10 cursor-pointer"
                    : "border-[var(--border)] bg-[var(--card)] opacity-70"
                }`}
              >
                {item.text}
              </button>
            );
          })}
        </div>
      </div>

      {/* Matched pairs display */}
      {Object.keys(matches).length > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-[var(--muted)]/50">
          <p className="text-xs text-[var(--muted-foreground)] mb-2">Đã nối:</p>
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
