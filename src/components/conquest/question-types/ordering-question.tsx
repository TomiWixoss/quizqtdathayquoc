import { useState } from "react";
import { GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { AIQuestion } from "@/services/ai-quiz-service";

interface Props {
  question: AIQuestion;
  onAnswer: (answer: string[]) => void;
  disabled: boolean;
}

export function OrderingQuestion({ question, onAnswer, disabled }: Props) {
  // Shuffle items initially
  const [items, setItems] = useState<string[]>(() => {
    const original = question.items || [];
    return [...original].sort(() => Math.random() - 0.5);
  });

  const moveItem = (index: number, direction: "up" | "down") => {
    if (disabled) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;

    const newItems = [...items];
    [newItems[index], newItems[newIndex]] = [
      newItems[newIndex],
      newItems[index],
    ];
    setItems(newItems);
    onAnswer(newItems);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted-foreground)]">
        Sắp xếp các mục theo thứ tự đúng (dùng nút mũi tên để di chuyển)
      </p>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={`${item}-${index}`}
            className="flex items-center gap-2 p-3 rounded-xl border-2 border-[var(--border)] bg-[var(--card)]"
          >
            <GripVertical className="w-5 h-5 text-[var(--muted-foreground)]" />
            <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-bold flex items-center justify-center">
              {index + 1}
            </span>
            <span className="flex-1 text-foreground text-sm">{item}</span>

            {!disabled && (
              <div className="flex gap-1">
                <button
                  onClick={() => moveItem(index, "up")}
                  disabled={index === 0}
                  className="p-1.5 rounded-lg bg-[var(--muted)] disabled:opacity-30"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveItem(index, "down")}
                  disabled={index === items.length - 1}
                  className="p-1.5 rounded-lg bg-[var(--muted)] disabled:opacity-30"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {disabled && question.correctAnswer && (
        <div className="p-3 rounded-lg bg-green-500/20">
          <p className="text-xs text-green-600 mb-1">Thứ tự đúng:</p>
          <ol className="list-decimal list-inside text-sm text-green-700">
            {(question.correctAnswer as string[]).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
