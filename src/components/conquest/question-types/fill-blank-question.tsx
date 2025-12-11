import { useState } from "react";
import { AIQuestion } from "@/services/ai-quiz-service";

interface Props {
  question: AIQuestion;
  onAnswer: (answer: string) => void;
  disabled: boolean;
}

export function FillBlankQuestion({ question, onAnswer, disabled }: Props) {
  const [value, setValue] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onAnswer(newValue);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted-foreground)]">
        Điền từ/cụm từ thích hợp vào chỗ trống
      </p>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder="Nhập câu trả lời..."
        className="w-full p-4 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] text-foreground placeholder:text-[var(--muted-foreground)] focus:border-primary focus:outline-none disabled:opacity-50"
      />
      {disabled && question.correctAnswer && (
        <p className="text-sm text-green-600">
          Đáp án đúng: <strong>{String(question.correctAnswer)}</strong>
        </p>
      )}
    </div>
  );
}
