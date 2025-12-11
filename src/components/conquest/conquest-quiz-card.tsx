import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ArrowRight, Loader2 } from "lucide-react";
import { AIQuestion } from "@/services/ai-quiz-service";
import { useConquestStore } from "@/stores/conquest-store";
import { MatchingQuestion } from "@/components/conquest/question-types/matching-question";
import { OrderingQuestion } from "@/components/conquest/question-types/ordering-question";
import { FillBlankQuestion } from "@/components/conquest/question-types/fill-blank-question";

interface Props {
  question: AIQuestion;
  onEnd: () => void;
}

export function ConquestQuizCard({ question, onEnd }: Props) {
  const { submitAnswer, nextQuestion, isLoading } = useConquestStore();
  const [selectedAnswer, setSelectedAnswer] = useState<
    string | string[] | null
  >(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<{
    correct: boolean;
    points: number;
  } | null>(null);
  const [isLoadingNext, setIsLoadingNext] = useState(false);

  const handleSubmit = () => {
    if (!selectedAnswer) return;
    const res = submitAnswer(selectedAnswer);
    setResult(res);
    setIsSubmitted(true);
  };

  const handleNext = async () => {
    setIsLoadingNext(true);
    const hasMore = await nextQuestion();
    if (!hasMore) {
      onEnd();
    }
    setSelectedAnswer(null);
    setIsSubmitted(false);
    setResult(null);
    setIsLoadingNext(false);
  };

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
        return (
          <div className="space-y-3">
            {question.options?.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              const isCorrect =
                isSubmitted && option === question.correctAnswer;
              const isWrong = isSubmitted && isSelected && !isCorrect;

              return (
                <motion.button
                  key={idx}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => !isSubmitted && setSelectedAnswer(option)}
                  disabled={isSubmitted}
                  className={`w-full p-4 rounded-xl text-left transition-all border-2 ${
                    isCorrect
                      ? "bg-green-500/20 border-green-500 text-green-700"
                      : isWrong
                      ? "bg-red-500/20 border-red-500 text-red-700"
                      : isSelected
                      ? "bg-primary/20 border-primary"
                      : "bg-[var(--card)] border-[var(--border)] hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        isCorrect
                          ? "bg-green-500 text-white"
                          : isWrong
                          ? "bg-red-500 text-white"
                          : isSelected
                          ? "bg-primary text-white"
                          : "bg-[var(--muted)]"
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 text-foreground">{option}</span>
                    {isCorrect && <Check className="w-5 h-5 text-green-500" />}
                    {isWrong && <X className="w-5 h-5 text-red-500" />}
                  </div>
                </motion.button>
              );
            })}
          </div>
        );
    }
  };

  return (
    <div className="px-4 py-6">
      {/* Question */}
      <div className="bg-[var(--card)] rounded-2xl p-5 border-2 border-[var(--border)] mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-1 rounded-lg bg-primary/20 text-primary text-xs font-medium">
            {question.type === "multiple_choice" && "Trắc nghiệm"}
            {question.type === "true_false" && "Đúng/Sai"}
            {question.type === "fill_blank" && "Điền từ"}
            {question.type === "matching" && "Nối cặp"}
            {question.type === "ordering" && "Sắp xếp"}
          </span>
        </div>
        <p className="text-lg font-medium text-foreground leading-relaxed">
          {question.question}
        </p>
      </div>

      {/* Options */}
      {renderQuestionContent()}

      {/* Result feedback */}
      <AnimatePresence>
        {isSubmitted && result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-4 p-4 rounded-xl ${
              result.correct ? "bg-green-500/20" : "bg-red-500/20"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {result.correct ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <X className="w-5 h-5 text-red-500" />
              )}
              <span
                className={`font-bold ${
                  result.correct ? "text-green-600" : "text-red-600"
                }`}
              >
                {result.correct ? "Chính xác!" : "Sai rồi!"}
              </span>
              <span
                className={`ml-auto font-bold ${
                  result.points >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {result.points >= 0 ? "+" : ""}
                {result.points} RP
              </span>
            </div>
            {question.explanation && (
              <p className="text-sm text-[var(--muted-foreground)]">
                {question.explanation}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="mt-6">
        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            disabled={!selectedAnswer || isLoading}
            className="w-full py-4 rounded-xl font-bold text-white bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Xác nhận
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={isLoadingNext}
            className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center gap-2"
          >
            {isLoadingNext ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang tải...
              </>
            ) : (
              <>
                Câu tiếp theo
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
