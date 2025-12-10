import { Page } from "zmp-ui";
import {
  BarChart3,
  TrendingUp,
  Target,
  Flame,
  Zap,
  Trophy,
  BookOpen,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  Star,
} from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import { useQuizStore } from "@/stores/quiz-store";
import { useState, useEffect } from "react";

type TabType = "overview" | "chapters" | "history";

function StatsPage() {
  const { user } = useUserStore();
  const { chapters } = useQuizStore();
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Load quiz data
  useEffect(() => {
    useQuizStore.getState().loadQuiz();
  }, []);

  // Calculate stats
  const totalAnswered = (user?.totalCorrect ?? 0) + (user?.totalWrong ?? 0);
  const accuracy =
    totalAnswered > 0
      ? Math.round(((user?.totalCorrect ?? 0) / totalAnswered) * 100)
      : 0;

  // Weekly data (mock based on streak)
  const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const weeklyData = weekDays.map((_, i) => {
    // Simulate activity based on streak
    if (i >= 7 - (user?.streak ?? 0)) {
      return Math.floor(Math.random() * 50) + 20;
    }
    return 0;
  });
  const maxWeekly = Math.max(...weeklyData, 1);

  // Chapter progress
  const chapterStats = chapters.map((chapter) => {
    const progress = user?.chapterProgress?.[chapter.id];
    return {
      ...chapter,
      completed: progress?.completed ?? 0,
      correct: progress?.correct ?? 0,
      stars: progress?.stars ?? 0,
      bestScore: progress?.bestScore ?? 0,
      isCompleted: progress?.isCompleted ?? false,
    };
  });

  const completedChapters = chapterStats.filter((c) => c.isCompleted).length;

  return (
    <Page className="bg-background min-h-screen">
      {/* Header */}
      <div className="pt-16 pb-4 px-4 bg-gradient-to-r from-[var(--duo-blue)] to-[var(--duo-purple)]">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-white" />
          <h1 className="font-bold text-xl text-white">Thống kê</h1>
        </div>
        <p className="text-white/80 text-sm mt-1">
          Phân tích chi tiết quá trình học
        </p>
      </div>

      {/* Tabs */}
      <div className="px-4 py-3 bg-[var(--card)] border-b border-[var(--border)]">
        <div className="flex gap-2">
          {[
            { id: "overview", label: "Tổng quan", icon: TrendingUp },
            { id: "chapters", label: "Chương", icon: BookOpen },
            { id: "history", label: "Lịch sử", icon: Calendar },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-semibold ${
                activeTab === tab.id
                  ? "bg-[var(--duo-green)] text-white"
                  : "bg-[var(--secondary)] text-[var(--muted-foreground)]"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 pb-28">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Main Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="card-3d p-4 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[var(--duo-green)]/20 flex items-center justify-center mb-2">
                  <CheckCircle className="w-6 h-6 text-[var(--duo-green)]" />
                </div>
                <p className="text-2xl font-bold text-[var(--duo-green)]">
                  {user?.totalCorrect ?? 0}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Câu đúng
                </p>
              </div>
              <div className="card-3d p-4 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[var(--duo-red)]/20 flex items-center justify-center mb-2">
                  <XCircle className="w-6 h-6 text-[var(--duo-red)]" />
                </div>
                <p className="text-2xl font-bold text-[var(--duo-red)]">
                  {user?.totalWrong ?? 0}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Câu sai
                </p>
              </div>
            </div>

            {/* Accuracy Ring */}
            <div className="card-3d p-4">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-[var(--duo-blue)]" />
                Độ chính xác
              </h3>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      fill="none"
                      stroke="var(--secondary)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      fill="none"
                      stroke={
                        accuracy >= 70
                          ? "var(--duo-green)"
                          : accuracy >= 50
                          ? "var(--duo-yellow)"
                          : "var(--duo-red)"
                      }
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(accuracy / 100) * 251} 251`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">
                      {accuracy}%
                    </span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">
                      Tổng câu
                    </span>
                    <span className="font-bold text-foreground">
                      {totalAnswered}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Đúng</span>
                    <span className="font-bold text-[var(--duo-green)]">
                      {user?.totalCorrect ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Sai</span>
                    <span className="font-bold text-[var(--duo-red)]">
                      {user?.totalWrong ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Chart */}
            <div className="card-3d p-4">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[var(--duo-purple)]" />
                Hoạt động tuần này
              </h3>
              <div className="flex items-end justify-between h-32 gap-1">
                {weekDays.map((day, i) => (
                  <div
                    key={day}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className={`w-full rounded-t-lg ${
                          weeklyData[i] > 0
                            ? "bg-[var(--duo-green)]"
                            : "bg-[var(--secondary)]"
                        }`}
                        style={{
                          height: `${(weeklyData[i] / maxWeekly) * 100}%`,
                          minHeight: "4px",
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-[var(--muted-foreground)]">
                      {day}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-[var(--border)]">
                <Flame className="w-5 h-5 text-[var(--duo-orange)]" />
                <span className="font-bold text-[var(--duo-orange)]">
                  {user?.streak ?? 0} ngày streak
                </span>
              </div>
            </div>

            {/* More Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="card-3d p-3 text-center">
                <Zap className="w-5 h-5 text-[var(--duo-yellow)] mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">
                  {user?.exp ?? 0}
                </p>
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  Tổng XP
                </p>
              </div>
              <div className="card-3d p-3 text-center">
                <Trophy className="w-5 h-5 text-[var(--duo-yellow)] mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">
                  Lv.{user?.level ?? 1}
                </p>
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  Cấp độ
                </p>
              </div>
              <div className="card-3d p-3 text-center">
                <Star className="w-5 h-5 text-[var(--duo-yellow)] mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">
                  {user?.perfectLessons ?? 0}
                </p>
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  100%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Chapters Tab */}
        {activeTab === "chapters" && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="card-3d p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-foreground">Tiến độ chương</h3>
                <span className="text-sm text-[var(--duo-green)] font-bold">
                  {completedChapters}/{chapters.length}
                </span>
              </div>
              <div className="progress-duo h-3">
                <div
                  className="progress-duo-fill"
                  style={{
                    width: `${(completedChapters / chapters.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Chapter List */}
            <div className="space-y-2">
              {chapterStats.map((chapter, index) => {
                const colors = [
                  "#ff9600",
                  "#ffc800",
                  "#58cc02",
                  "#1cb0f6",
                  "#ce82ff",
                  "#ff4b4b",
                ];
                const color = colors[index % colors.length];
                const percent =
                  chapter.completed > 0
                    ? Math.round(
                        (chapter.completed / chapter.totalQuestions) * 100
                      )
                    : 0;

                return (
                  <div key={chapter.id} className="card-3d p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                        style={{ background: color }}
                      >
                        {chapter.id}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-foreground truncate">
                            {chapter.name}
                          </h4>
                          {chapter.isCompleted && (
                            <CheckCircle className="w-4 h-4 text-[var(--duo-green)] shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 progress-duo h-1.5">
                            <div
                              className="progress-duo-fill"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-xs text-[var(--muted-foreground)]">
                            {percent}%
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {chapter.stars > 0 && (
                          <div className="flex items-center gap-0.5 mb-1">
                            {[...Array(3)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < chapter.stars
                                    ? "text-[var(--duo-yellow)] fill-[var(--duo-yellow)]"
                                    : "text-[var(--muted-foreground)]"
                                }`}
                              />
                            ))}
                          </div>
                        )}
                        {chapter.bestScore > 0 && (
                          <p className="text-xs text-[var(--duo-green)] font-bold">
                            {chapter.bestScore} XP
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {/* Time Stats */}
            <div className="card-3d p-4">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[var(--duo-blue)]" />
                Thời gian học
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[var(--secondary)] rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {user?.streak ?? 0}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Streak hiện tại
                  </p>
                </div>
                <div className="bg-[var(--secondary)] rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {user?.longestStreak ?? 0}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Streak dài nhất
                  </p>
                </div>
              </div>
            </div>

            {/* Daily Goal History */}
            <div className="card-3d p-4">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-[var(--duo-green)]" />
                Mục tiêu hôm nay
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[var(--muted-foreground)]">
                      Tiến độ
                    </span>
                    <span className="font-bold text-foreground">
                      {user?.dailyProgress ?? 0}/{user?.dailyGoal ?? 50} XP
                    </span>
                  </div>
                  <div className="progress-duo h-3">
                    <div
                      className="progress-duo-fill"
                      style={{
                        width: `${Math.min(
                          ((user?.dailyProgress ?? 0) /
                            (user?.dailyGoal ?? 50)) *
                            100,
                          100
                        )}%`,
                        background:
                          (user?.dailyProgress ?? 0) >= (user?.dailyGoal ?? 50)
                            ? "var(--duo-yellow)"
                            : undefined,
                      }}
                    />
                  </div>
                </div>
                {(user?.dailyProgress ?? 0) >= (user?.dailyGoal ?? 50) && (
                  <CheckCircle className="w-8 h-8 text-[var(--duo-green)]" />
                )}
              </div>
            </div>

            {/* Milestones */}
            <div className="card-3d p-4">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[var(--duo-yellow)]" />
                Cột mốc
              </h3>
              <div className="space-y-3">
                {[
                  {
                    label: "Câu đúng đầu tiên",
                    value: 1,
                    current: user?.totalCorrect ?? 0,
                    icon: CheckCircle,
                  },
                  {
                    label: "50 câu đúng",
                    value: 50,
                    current: user?.totalCorrect ?? 0,
                    icon: Target,
                  },
                  {
                    label: "100 câu đúng",
                    value: 100,
                    current: user?.totalCorrect ?? 0,
                    icon: Star,
                  },
                  {
                    label: "Level 5",
                    value: 5,
                    current: user?.level ?? 1,
                    icon: Trophy,
                  },
                  {
                    label: "7 ngày streak",
                    value: 7,
                    current: user?.streak ?? 0,
                    icon: Flame,
                  },
                ].map((milestone, i) => {
                  const achieved = milestone.current >= milestone.value;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          achieved
                            ? "bg-[var(--duo-green)]/20"
                            : "bg-[var(--secondary)]"
                        }`}
                      >
                        <milestone.icon
                          className={`w-4 h-4 ${
                            achieved
                              ? "text-[var(--duo-green)]"
                              : "text-[var(--muted-foreground)]"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-sm font-semibold ${
                            achieved
                              ? "text-foreground"
                              : "text-[var(--muted-foreground)]"
                          }`}
                        >
                          {milestone.label}
                        </p>
                      </div>
                      {achieved ? (
                        <CheckCircle className="w-5 h-5 text-[var(--duo-green)]" />
                      ) : (
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {milestone.current}/{milestone.value}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}

export default StatsPage;
