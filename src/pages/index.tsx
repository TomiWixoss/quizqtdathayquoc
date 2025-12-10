import { useNavigate } from "zmp-ui";
import { Page } from "zmp-ui";
import {
  Flame,
  Zap,
  BookOpen,
  Shuffle,
  Play,
  Heart,
  Gem,
  Star,
} from "lucide-react";
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
    if (user && user.hearts <= 0) {
      alert("Bạn đã hết tim! Chờ hồi phục hoặc dùng gems để mua.");
      return;
    }
    useQuizStore.getState().selectChapter(id);
    navigate("/quiz");
  };

  const handleRandom = () => {
    if (user && user.hearts <= 0) {
      alert("Bạn đã hết tim!");
      return;
    }
    startRandomQuiz(20);
    navigate("/quiz");
  };

  const handleAll = () => {
    if (user && user.hearts <= 0) {
      alert("Bạn đã hết tim!");
      return;
    }
    startAllQuiz();
    navigate("/quiz");
  };

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

  const dailyProgress = user
    ? Math.min((user.dailyProgress / user.dailyGoal) * 100, 100)
    : 0;

  return (
    <Page className="bg-background min-h-screen">
      {/* Header */}
      <div className="pt-16 pb-3 px-4 bg-[var(--card)] border-b-2 border-[var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[var(--duo-green)] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">Quiz QTDA</h1>
              <p className="text-xs text-[var(--muted-foreground)]">
                {chapters.length} chương
              </p>
            </div>
          </div>
          {user && (
            <div className="bg-[var(--duo-yellow)] px-2.5 py-1 rounded-lg">
              <span className="text-xs font-bold text-[#1a2c35]">
                Lv.{user.level}
              </span>
            </div>
          )}
        </div>

        {/* Stats Row */}
        {user && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Hearts */}
              <div className="flex items-center gap-0.5">
                {[...Array(user.maxHearts)].map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-4 h-4 ${
                      i < user.hearts
                        ? "text-[var(--duo-red)] fill-[var(--duo-red)]"
                        : "text-[var(--muted-foreground)]"
                    }`}
                  />
                ))}
              </div>
              {/* Streak */}
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-[var(--duo-orange)] flame-animate" />
                <span className="font-bold text-sm text-[var(--duo-orange)]">
                  {user.streak}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Gems */}
              <div className="flex items-center gap-1">
                <Gem className="w-4 h-4 text-[var(--duo-blue)]" />
                <span className="font-bold text-sm text-[var(--duo-blue)]">
                  {user.gems}
                </span>
              </div>
              {/* XP */}
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-[var(--duo-yellow)]" />
                <span className="font-bold text-sm text-[var(--duo-yellow)]">
                  {user.exp}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className="px-4 py-4 pb-28 overflow-y-auto"
        style={{ height: "calc(100vh - 150px)" }}
      >
        {/* Daily Goal */}
        {user && (
          <div className="card-3d p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-foreground">
                🎯 Mục tiêu hôm nay
              </span>
              <span
                className={`font-bold text-sm ${
                  user.dailyProgress >= user.dailyGoal
                    ? "text-[var(--duo-green)]"
                    : "text-[var(--muted-foreground)]"
                }`}
              >
                {user.dailyProgress}/{user.dailyGoal} XP
              </span>
            </div>
            <div className="progress-duo h-2.5">
              <div
                className="progress-duo-fill"
                style={{
                  width: `${dailyProgress}%`,
                  background:
                    user.dailyProgress >= user.dailyGoal
                      ? "var(--duo-yellow)"
                      : undefined,
                }}
              />
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            onClick={handleRandom}
            className="btn-3d btn-3d-orange py-3 px-3 flex flex-col items-center gap-1"
          >
            <Shuffle className="w-7 h-7" />
            <span className="text-xs">Ngẫu nhiên</span>
          </button>
          <button
            onClick={handleAll}
            className="btn-3d btn-3d-purple py-3 px-3 flex flex-col items-center gap-1"
          >
            <Play className="w-7 h-7" />
            <span className="text-xs">Tất cả</span>
          </button>
        </div>

        {/* Chapter List */}
        <h2 className="text-sm font-bold mb-3 text-[var(--muted-foreground)]">
          Chọn chương
        </h2>
        <div className="space-y-2.5">
          {chapters.map((chapter, index) => {
            const progress = user?.chapterProgress[chapter.id];
            const percent = progress
              ? Math.round((progress.completed / chapter.totalQuestions) * 100)
              : 0;
            const stars = progress?.stars || 0;

            return (
              <button
                key={chapter.id}
                onClick={() => handleChapter(chapter.id)}
                className="card-3d w-full p-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0"
                    style={{ background: colors[index % colors.length] }}
                  >
                    {chapter.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-foreground line-clamp-1">
                      {chapter.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {chapter.totalQuestions} câu
                      </p>
                      {stars > 0 && (
                        <div className="flex items-center gap-0.5">
                          {[...Array(3)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < stars
                                  ? "text-[var(--duo-yellow)] fill-[var(--duo-yellow)]"
                                  : "text-[var(--muted-foreground)]"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="progress-duo h-1.5">
                      <div
                        className="progress-duo-fill"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                  {progress && progress.bestScore > 0 && (
                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-[var(--muted-foreground)]">
                        Best
                      </div>
                      <div className="font-bold text-sm text-[var(--duo-green)]">
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
