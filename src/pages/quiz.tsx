import { useNavigate } from "zmp-ui";
import { Page } from "zmp-ui";
import { X } from "lucide-react";
import { QuizCard } from "@/components/quiz/quiz-card";
import { QuizResult } from "@/components/quiz/quiz-result";
import { useQuizStore } from "@/stores/quiz-store";
import { useUserStore } from "@/stores/user-store";
import { useEffect } from "react";

function QuizPage() {
  const navigate = useNavigate();
  const {
    currentQuestions,
    currentIndex,
    resetQuiz,
    chapters,
    currentChapter,
    correctCount,
    score,
  } = useQuizStore();
  const { user, updateChapterProgress } = useUserStore();

  const isFinished = currentIndex >= currentQuestions.length;
  const chapterName = currentChapter
    ? chapters.find((c) => c.id === currentChapter)?.name
    : "Trắc nghiệm";

  useEffect(() => {
    if (currentQuestions.length === 0) {
      navigate("/");
    }
  }, [currentQuestions, navigate]);

  const handleClose = async () => {
    // Lưu tiến trình nếu đang làm quiz chương và đã trả lời ít nhất 1 câu
    if (currentChapter && currentIndex > 0 && user) {
      const currentProgress = user.chapterProgress?.[currentChapter];
      await updateChapterProgress(currentChapter, {
        completed: Math.max(currentProgress?.completed ?? 0, correctCount),
        correct: (currentProgress?.correct ?? 0) + correctCount,
        bestScore: Math.max(currentProgress?.bestScore ?? 0, score),
        lastAttempt: new Date().toISOString(),
      });
    }
    resetQuiz();
    navigate("/");
  };

  if (currentQuestions.length === 0) return null;

  return (
    <Page className="bg-background min-h-screen">
      {/* Header - pt-16 để tránh dính nút X của Zalo */}
      <div className="pt-16 pb-2 px-4 bg-background sticky top-0 z-10">
        <div className="flex items-center justify-between">
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
      <div className="px-4 pb-8" style={{ minHeight: "calc(100vh - 100px)" }}>
        {isFinished ? <QuizResult /> : <QuizCard />}
      </div>
    </Page>
  );
}

export default QuizPage;
