import { useNavigate } from "zmp-ui";
import { Page } from "zmp-ui";
import { X } from "lucide-react";
import { QuizCard } from "@/components/quiz/quiz-card";
import { QuizResult } from "@/components/quiz/quiz-result";
import { useQuizStore } from "@/stores/quiz-store";
import { useEffect } from "react";

function QuizPage() {
  const navigate = useNavigate();
  const {
    currentQuestions,
    currentIndex,
    resetQuiz,
    chapters,
    currentChapter,
  } = useQuizStore();

  const isFinished = currentIndex >= currentQuestions.length;
  const chapterName = currentChapter
    ? chapters.find((c) => c.id === currentChapter)?.name
    : "Trắc nghiệm";

  useEffect(() => {
    if (currentQuestions.length === 0) {
      navigate("/");
    }
  }, [currentQuestions, navigate]);

  const handleClose = () => {
    resetQuiz();
    navigate("/");
  };

  if (currentQuestions.length === 0) return null;

  return (
    <Page className="bg-background min-h-screen">
      {/* Header */}
      <div className="safe-top bg-background px-4 pb-2 sticky top-0 z-10">
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-xl bg-[var(--secondary)] flex items-center justify-center"
          >
            <X className="w-5 h-5 text-[var(--muted-foreground)]" />
          </button>
          {!isFinished && (
            <h1 className="font-bold text-sm text-[var(--muted-foreground)] truncate max-w-[200px]">
              {chapterName}
            </h1>
          )}
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      {/* Content */}
      <div
        className="px-4 pb-8 safe-bottom"
        style={{ minHeight: "calc(100vh - 80px)" }}
      >
        {isFinished ? <QuizResult /> : <QuizCard />}
      </div>
    </Page>
  );
}

export default QuizPage;
