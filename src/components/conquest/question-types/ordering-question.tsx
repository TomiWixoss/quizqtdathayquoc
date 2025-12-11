import { useState } from "react";
import { GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIQuestion } from "@/services/ai-quiz-service";

interface Props {
  question: AIQuestion;
  onAnswer: (answer: string[]) => void;
  disabled: boolean;
}

export function OrderingQuestion({ question, onAnswer, disabled }: Props) {
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
            className="option-btn flex items-center gap-2 p-3"
          >
            <GripVertical className="w-5 h-5 text-[var(--muted-foreground)]" />
            <span className="w-7 h-7 rounded-lg bg-[var(--duo-blue)] text-white text-sm font-bold flex items-center justify-center">
              {index + 1}
            </span>
            <span className="flex-1 text-foreground text-sm">{item}</span>

            {!disabled && (
              <div className="flex gap-1">
                <button
                  onClick={() => moveItem(index, "up")}
                  disabled={index === 0}
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    index === 0
                      ? "bg-[var(--secondary)] opacity-30"
                      : "bg-[var(--duo-blue)] text-white"
                  )}
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveItem(index, "down")}
                  disabled={index === items.length - 1}
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    index === items.length - 1
                      ? "bg-[var(--secondary)] opacity-30"
                      : "bg-[var(--duo-blue)] text-white"
                  )}
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {disabled && question.correctAnswer && (
        <div
          className="card-3d p-3"
          style={{
            background: "rgba(88, 204, 2, 0.15)",
            borderColor: "var(--duo-green)",
          }}
        >
          <p className="text-xs text-[var(--duo-green)] mb-1 font-bold">
            Thứ tự đúng:
          </p>
          <ol className="list-decimal list-inside text-sm text-[var(--duo-green)]">
            {(question.correctAnswer as string[]).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
