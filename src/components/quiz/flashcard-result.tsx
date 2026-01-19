import { useNavigate } from "react-router-dom";
import { BookOpen, Home, Target, CheckCircle } from "lucide-react";
import { useQuizStore } from "@/stores/quiz-store";
import { useUserStore } from "@/stores/user-store";
import confetti from "canvas-confetti";
import { useEffect } from "react";

export function FlashcardResult() {
  const navigate = useNavigate();
  const {
    currentQuestions,
    currentChapter,
    resetQuiz,
    selectChapter,
    chapters,
  } = useQuizStore();
  const { user } = useUserStore();

  const totalCards = currentQuestions.length;
  const chapterInfo = currentChapter
    ? chapters.find((c) => c.id === currentChapter)
    : null;

  useEffect(() => {
    // Celebration
    const duration = 2000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#58cc02", "#ffc800", "#1cb0f6"],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#58cc02", "#ffc800", "#1cb0f6"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  const handlePractice = () => {
    if (currentChapter) {
      selectChapter(currentChapter, "practice");
    }
  };

  const handleHome = () => {
    resetQuiz();
    navigate("/");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-4">
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--duo-green)] to-[var(--duo-blue)] flex items-center justify-center mb-4">
        <CheckCircle className="w-10 h-10 text-white" />
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold mb-2 text-[var(--duo-green)]">
        Hoàn thành!
      </h1>

      {/* Subtitle */}
      <p className="text-[var(--muted-foreground)] text-center mb-6">
        Bạn đã xem hết {totalCards} flashcard
        {chapterInfo && (
          <>
            <br />
            <span className="font-semibold text-foreground">
              {chapterInfo.name}
            </span>
          </>
        )}
      </p>

      {/* Stats Card */}
      <div className="w-full max-w-xs card-3d p-4 mb-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <BookOpen className="w-8 h-8 text-[var(--duo-blue)]" />
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground">
              {totalCards}
            </div>
            <div className="text-sm text-[var(--muted-foreground)]">
              Thẻ đã học
            </div>
          </div>
        </div>

        {user && (
          <div className="pt-3 border-t border-[var(--border)] flex items-center justify-center gap-4">
            <div className="flex items-center gap-1">
              <img src="/AppAssets/Fire.png" alt="streak" className="w-5 h-5" />
              <span className="font-bold text-sm text-[var(--duo-orange)]">
                {user.streak}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <img
                src="/AppAssets/BlueDiamond.png"
                alt="gems"
                className="w-5 h-5"
              />
              <span className="font-bold text-sm text-[var(--duo-blue)]">
                {user.gems}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="w-full max-w-xs bg-[var(--duo-blue)]/10 border-2 border-[var(--duo-blue)] rounded-2xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Target className="w-6 h-6 text-[var(--duo-blue)] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-foreground mb-1">
              Sẵn sàng kiểm tra?
            </p>
            <p className="text-sm text-[var(--muted-foreground)]">
              Bấm "Luyện tập trắc nghiệm" để kiểm tra kiến thức bạn vừa học!
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-xs space-y-2.5">
        {currentChapter && (
          <button
            onClick={handlePractice}
            className="btn-3d btn-3d-green w-full py-3.5 flex items-center justify-center gap-2"
          >
            <Target className="w-5 h-5" /> Luyện tập trắc nghiệm
          </button>
        )}
        <button
          onClick={handleHome}
          className="btn-3d btn-3d-blue w-full py-3 flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" /> Trang chủ
        </button>
      </div>
    </div>
  );
}
