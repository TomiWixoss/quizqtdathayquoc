import { useNavigate } from "zmp-ui";
import { Page } from "zmp-ui";
import {
  BookOpen,
  Star,
  Target,
  CheckCircle,
  Swords,
  Dumbbell,
} from "lucide-react";
import { useQuizStore } from "@/stores/quiz-store";
import { useUserStore } from "@/stores/user-store";
import { useEffect, useState } from "react";
import { NoHeartsModal } from "@/components/ui/custom-modal";

function HomePage() {
  const navigate = useNavigate();
  const { loadQuiz, chapters } = useQuizStore();
  const { initUser, user, spendGems, refillHearts } = useUserStore();
  const [showNoHeartsModal, setShowNoHeartsModal] = useState(false);
  const [pendingChapterId, setPendingChapterId] = useState<number | null>(null);

  useEffect(() => {
    loadQuiz();
    initUser();
  }, []);

  const handleChapter = (id: number) => {
    if (user && user.hearts <= 0) {
      setPendingChapterId(id);
      setShowNoHeartsModal(true);
      return;
    }
    useQuizStore.getState().selectChapter(id);
    navigate("/quiz");
  };

  const handleBuyHearts = async () => {
    const success = await spendGems(50);
    if (success) {
      await refillHearts();
      setShowNoHeartsModal(false);
      if (pendingChapterId !== null) {
        useQuizStore.getState().selectChapter(pendingChapterId);
        navigate("/quiz");
      }
    }
  };

  const handleGoToShop = () => {
    setShowNoHeartsModal(false);
    navigate("/shop");
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

  // Safe defaults for new fields
  const dailyProgressValue = user?.dailyProgress ?? 0;
  const dailyGoalValue = user?.dailyGoal ?? 50;
  const dailyProgress =
    dailyGoalValue > 0
      ? Math.min((dailyProgressValue / dailyGoalValue) * 100, 100)
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
                {[...Array(user.maxHearts ?? 5)].map((_, i) => (
                  <img
                    key={i}
                    src="/AppAssets/Heart.png"
                    alt="heart"
                    className={`w-4 h-4 ${
                      i >= (user.hearts ?? 5) ? "opacity-30 grayscale" : ""
                    }`}
                  />
                ))}
              </div>
              {/* Streak */}
              <div className="flex items-center gap-1">
                <img src="/AppAssets/Fire.png" alt="streak" className="w-5 h-5" />
                <span className="font-bold text-sm text-[var(--duo-orange)]">
                  {user.streak}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Gems */}
              <div className="flex items-center gap-1">
                <img src="/AppAssets/BlueDiamond.png" alt="gem" className="w-5 h-5" />
                <span className="font-bold text-sm text-[var(--duo-blue)]">
                  {user.gems}
                </span>
              </div>
              {/* XP */}
              <div className="flex items-center gap-1">
                <img src="/AppAssets/Lighting.png" alt="xp" className="w-5 h-5" />
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
              <div className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-[var(--duo-green)]" />
                <span className="font-bold text-sm text-foreground">
                  Mục tiêu hôm nay
                </span>
              </div>
              <span
                className={`font-bold text-sm ${
                  (user.dailyProgress ?? 0) >= (user.dailyGoal ?? 50)
                    ? "text-[var(--duo-green)]"
                    : "text-[var(--muted-foreground)]"
                }`}
              >
                {user.dailyProgress ?? 0}/{user.dailyGoal ?? 50} XP
              </span>
            </div>
            <div className="progress-duo h-2.5">
              <div
                className="progress-duo-fill"
                style={{
                  width: `${dailyProgress}%`,
                  background:
                    (user.dailyProgress ?? 0) >= (user.dailyGoal ?? 50)
                      ? "var(--duo-yellow)"
                      : undefined,
                }}
              />
            </div>
          </div>
        )}

        {/* Practice Button */}
        <button
          onClick={() => navigate("/battle")}
          className="btn-battle w-full mb-3 py-4 px-4 rounded-2xl font-bold text-white text-lg flex items-center justify-center gap-3"
          style={{
            background: "linear-gradient(135deg, #58cc02 0%, #46a302 100%)",
            boxShadow: "0 6px 0 #3d8c02, 0 8px 20px rgba(88, 204, 2, 0.4)",
          }}
        >
          <Dumbbell className="w-7 h-7" />
          <span>LUYỆN TẬP</span>
        </button>

        {/* Conquest Button */}
        <button
          onClick={() => navigate("/conquest")}
          className="btn-battle w-full mb-5 py-4 px-4 rounded-2xl font-bold text-white text-lg flex items-center justify-center gap-3"
          style={{
            background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
            boxShadow: "0 6px 0 #7c3aed, 0 8px 20px rgba(139, 92, 246, 0.4)",
          }}
        >
          <Swords className="w-7 h-7" />
          <span>CHINH CHIẾN</span>
        </button>

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
                  <div className="flex items-center gap-2 shrink-0">
                    {progress?.isCompleted && (
                      <CheckCircle className="w-5 h-5 text-[var(--duo-green)]" />
                    )}
                    {progress && progress.bestScore > 0 && (
                      <div className="text-right">
                        <div className="text-[10px] text-[var(--muted-foreground)]">
                          Best
                        </div>
                        <div className="font-bold text-sm text-[var(--duo-green)]">
                          {progress.bestScore}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* No Hearts Modal */}
      <NoHeartsModal
        isOpen={showNoHeartsModal}
        onClose={() => {
          setShowNoHeartsModal(false);
          setPendingChapterId(null);
        }}
        onBuyHearts={handleBuyHearts}
        onGoToShop={handleGoToShop}
        userGems={user?.gems ?? 0}
        heartCost={50}
      />
    </Page>
  );
}

export default HomePage;
