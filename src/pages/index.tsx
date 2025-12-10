import { useNavigate } from "zmp-ui";
import { Page } from "zmp-ui";
import { Flame, Zap, BookOpen, Shuffle, Play } from "lucide-react";
import { useQuizStore } from "@/stores/quiz-store";
import { useUserStore } from "@/stores/user-store";
import { useEffect } from "react";

function HomePage() {
  const navigate = useNavigate();
  const { loadQuiz, chapters, startRandomQuiz, startAllQuiz } = useQuizStore();
  const { initUser, user } = useUserStore();

  useEffect(() => {
    loadQuiz();
    initUser();
  }, []);

  const handleChapter = (id: number) => {
    useQuizStore.getState().selectChapter(id);
    navigate("/quiz");
  };

  const handleRandom = () => {
    startRandomQuiz(20);
    navigate("/quiz");
  };

  const handleAll = () => {
    startAllQuiz();
    navigate("/quiz");
  };

  // Colors for chapters
  const colors = [
    "#ff9600",
    "#ffc800",
    "#58cc02",
    "#1cb0f6",
    "#ce82ff",
    "#ff4b4b",
    "#ff9600",
    "#ffc800",
    "#58cc02",
    "#1cb0f6",
    "#ce82ff",
    "#ff4b4b",
    "#ff9600",
  ];

  return (
    <Page className="bg-background min-h-screen">
      {/* Header - pt-16 để tránh dính nút X của Zalo */}
      <div className="pt-16 pb-4 px-4 bg-[var(--card)] border-b-2 border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--duo-green)] flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-foreground">Quiz QTDA</h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                {chapters.length} chương
              </p>
            </div>
          </div>
          {user && (
            <div className="bg-[var(--duo-yellow)] px-3 py-1.5 rounded-xl">
              <span className="text-sm font-bold text-[#1a2c35]">
                Lv.{user.level}
              </span>
            </div>
          )}
        </div>

        {/* Stats Row */}
        {user && (
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1">
              <Flame className="w-5 h-5 text-[var(--duo-orange)] flame-animate" />
              <span className="font-bold text-[var(--duo-orange)]">
                {user.streak}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-5 h-5 text-[var(--duo-yellow)]" />
              <span className="font-bold text-[var(--duo-yellow)]">
                {user.exp}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className="px-4 py-4 pb-28 overflow-y-auto"
        style={{ height: "calc(100vh - 140px)" }}
      >
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={handleRandom}
            className="btn-3d btn-3d-orange py-4 px-4 flex flex-col items-center gap-2"
          >
            <Shuffle className="w-8 h-8" />
            <span className="text-sm">Ngẫu nhiên</span>
          </button>
          <button
            onClick={handleAll}
            className="btn-3d btn-3d-purple py-4 px-4 flex flex-col items-center gap-2"
          >
            <Play className="w-8 h-8" />
            <span className="text-sm">Tất cả</span>
          </button>
        </div>

        {/* Chapter List */}
        <h2 className="text-base font-bold mb-3 text-[var(--muted-foreground)]">
          Chọn chương
        </h2>
        <div className="space-y-3">
          {chapters.map((chapter, index) => {
            const progress = user?.chapterProgress[chapter.id];
            const percent = progress
              ? Math.round((progress.completed / chapter.totalQuestions) * 100)
              : 0;

            return (
              <button
                key={chapter.id}
                onClick={() => handleChapter(chapter.id)}
                className="card-3d w-full p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                    style={{ background: colors[index % colors.length] }}
                  >
                    {chapter.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-foreground line-clamp-1">
                      {chapter.name}
                    </h3>
                    <p className="text-xs text-[var(--muted-foreground)] mb-2">
                      {chapter.totalQuestions} câu hỏi
                    </p>
                    <div className="progress-duo h-2">
                      <div
                        className="progress-duo-fill"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                  {progress && progress.bestScore > 0 && (
                    <div className="text-right shrink-0">
                      <div className="text-xs text-[var(--muted-foreground)]">
                        Best
                      </div>
                      <div className="font-bold text-[var(--duo-green)]">
                        {progress.bestScore}
                      </div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Page>
  );
}

export default HomePage;
