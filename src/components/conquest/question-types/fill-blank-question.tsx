import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { AIQuestion } from "@/services/ai-quiz-service";

interface Props {
  question: AIQuestion;
  onAnswer: (answer: string) => void;
  disabled: boolean;
}

// Fallback distractors nếu AI không trả về
const FALLBACK_DISTRACTORS = [
  "dự án",
  "quản lý",
  "kế hoạch",
  "tiến độ",
  "chi phí",
  "chất lượng",
  "rủi ro",
  "phạm vi",
  "nguồn lực",
  "thời gian",
  "giao tiếp",
  "truyền thông",
  "kiểm soát",
  "giám sát",
  "đánh giá",
];

export function FillBlankQuestion({ question, onAnswer, disabled }: Props) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  // Tạo danh sách từ gợi ý (đáp án đúng + các từ nhiễu từ AI)
  const wordOptions = useMemo(() => {
    const correctAnswer = String(question.correctAnswer);

    // Ưu tiên dùng distractors từ AI, fallback nếu không có
    let distractors: string[] = [];

    if (question.distractors && question.distractors.length >= 3) {
      // Dùng distractors từ AI
      distractors = question.distractors.slice(0, 3);
    } else {
      // Fallback: random từ danh sách có sẵn
      const filtered = FALLBACK_DISTRACTORS.filter(
        (d) => d.toLowerCase() !== correctAnswer.toLowerCase()
      );
      const shuffled = filtered.sort(() => Math.random() - 0.5);
      distractors = shuffled.slice(0, 3);
    }

    // Trộn đáp án đúng với các từ nhiễu
    const allOptions = [...distractors, correctAnswer].sort(
      () => Math.random() - 0.5
    );

    return allOptions;
  }, [question.correctAnswer, question.distractors]);

  const handleSelectWord = (word: string) => {
    if (disabled) return;
    setSelectedWord(word);
    onAnswer(word);
  };

  const questionParts = question.question.split("___");

  return (
    <div className="space-y-5">
      {/* Câu hỏi với chỗ trống */}
      <div className="card-3d p-4">
        <p className="text-base text-foreground leading-relaxed">
          {questionParts[0]}
          <span
            className={cn(
              "inline-block min-w-[80px] mx-1 px-3 py-1 rounded-lg border-2 border-dashed text-center",
              selectedWord
                ? "border-[var(--duo-blue)] bg-[var(--duo-blue)]/20 text-[var(--duo-blue)] font-bold"
                : "border-[var(--muted-foreground)] text-[var(--muted-foreground)]"
            )}
          >
            {selectedWord || "______"}
          </span>
          {questionParts[1]}
        </p>
      </div>

      {/* Các từ để chọn */}
      <div>
        <p className="text-sm text-[var(--muted-foreground)] mb-3">
          Chọn từ phù hợp:
        </p>
        <div className="flex flex-wrap gap-2">
          {wordOptions.map((word, idx) => {
            const isSelected = selectedWord === word;
            const isCorrect = disabled && word === question.correctAnswer;
            const isWrong =
              disabled && isSelected && word !== question.correctAnswer;

            return (
              <button
                key={idx}
                onClick={() => handleSelectWord(word)}
                disabled={disabled}
                className={cn(
                  "px-4 py-2.5 rounded-xl font-bold text-sm border-2",
                  isCorrect &&
                    "bg-[var(--duo-green)]/20 border-[var(--duo-green)] text-[var(--duo-green)]",
                  isWrong &&
                    "bg-[var(--duo-red)]/20 border-[var(--duo-red)] text-[var(--duo-red)]",
                  isSelected &&
                    !disabled &&
                    "bg-[var(--duo-blue)]/20 border-[var(--duo-blue)] text-[var(--duo-blue)]",
                  !isSelected &&
                    !isCorrect &&
                    !isWrong &&
                    "bg-[var(--card)] border-[var(--border)] text-foreground shadow-[0_4px_0_var(--border)]",
                  !disabled && "active:translate-y-1 active:shadow-none"
                )}
              >
                {word}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hiển thị đáp án đúng khi đã submit */}
      {disabled && selectedWord !== question.correctAnswer && (
        <div className="p-3 rounded-xl bg-[var(--duo-green)]/20 border-2 border-[var(--duo-green)]">
          <p className="text-sm text-[var(--duo-green)]">
            Đáp án đúng: <strong>{String(question.correctAnswer)}</strong>
          </p>
        </div>
      )}
    </div>
  );
}
