import { useNavigate } from "zmp-ui";
import { Page } from "zmp-ui";
import { Trophy, Flame, Zap, BookOpen, Shuffle, Play } from "lucide-react";
import { motion } from "framer-motion";
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

  return (
    <Page className="bg-background min-h-screen">
      {/* Header with safe area */}
      <div className="safe-top bg-[#1a2c35] px-4 pb-4">
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--duo-green)] flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-white">Quiz QTDA</h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                {chapters.length} chương
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/leaderboard")}
            className="w-10 h-10 rounded-xl bg-[var(--duo-yellow)] flex items-center justify-center"
          >
            <Trophy className="w-5 h-5 text-[#1a2c35]" />
          </button>
        </div>
      </div>

      {/* User Stats Bar */}
      {user && (
        <div className="px-4 py-3 bg-[#1a2c35] border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Streak */}
              <div className="flex items-center gap-1">
                <Flame className="w-5 h-5 text-[var(--duo-orange)] flame-animate" />
                <span className="font-bold text-[var(--duo-orange)]">
                  {user.streak}
                </span>
              </div>
              {/* XP */}
              <div className="flex items-center gap-1">
                <Zap className="w-5 h-5 text-[var(--duo-yellow)]" />
                <span className="font-bold text-[var(--duo-yellow)]">
                  {user.exp}
                </span>
              </div>
            </div>
            {/* Level */}
            <div className="flex items-center gap-2 bg-[var(--duo-green)] px-3 py-1 rounded-full">
              <span className="text-sm font-bold text-white">
                Lv.{user.level}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className="px-4 py-4 pb-24 overflow-y-auto"
        style={{ height: "calc(100vh - 180px)" }}
      >
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleRandom}
            className="btn-3d btn-3d-orange py-4 px-4 flex flex-col items-center gap-2"
          >
            <Shuffle className="w-8 h-8" />
            <span className="text-sm">Ngẫu nhiên</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAll}
            className="btn-3d btn-3d-purple py-4 px-4 flex flex-col items-center gap-2"
          >
            <Play className="w-8 h-8" />
            <span className="text-sm">Tất cả</span>
          </motion.button>
        </div>

        {/* Chapter List */}
        <h2 className="text-lg font-bold mb-3 text-[var(--muted-foreground)]">
          Chọn chương
        </h2>
        <div className="space-y-3">
          {chapters.map((chapter, index) => {
            const progress = user?.chapterProgress[chapter.id];
            const percent = progress
              ? Math.round((progress.completed / chapter.totalQuestions) * 100)
              : 0;

            return (
              <motion.div
                key={chapter.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <button
                  onClick={() => handleChapter(chapter.id)}
                  className="card-3d w-full p-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                      style={{
                        background: `hsl(${(chapter.id * 30) % 360}, 70%, 50%)`,
                      }}
                    >
                      {chapter.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-foreground line-clamp-1">
                        {chapter.name}
                      </h3>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {chapter.totalQuestions} câu hỏi
                      </p>
                      {/* Progress bar */}
                      <div className="mt-2 progress-duo">
                        <div
                          className="progress-duo-fill"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                    {progress && progress.bestScore > 0 && (
                      <div className="text-right">
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
              </motion.div>
            );
          })}
        </div>
      </div>
    </Page>
  );
}

export default HomePage;
