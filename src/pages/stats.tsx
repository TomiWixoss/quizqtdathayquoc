import { Page, useNavigate } from "zmp-ui";
import {
  BarChart3,
  TrendingUp,
  Target,
  Flame,
  Trophy,
  BookOpen,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  Star,
  ArrowLeft,
  Swords,
  Sparkles,
  User,
  Frame,
  Award,
  Package,
  Building,
  Medal,
} from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import { useQuizStore } from "@/stores/quiz-store";
import { getRankFromPoints, getRankImage } from "@/services/ai-quiz-service";
import { useState, useEffect } from "react";
import { formatNumber, calculateScoreCategories } from "@/lib/utils";

type TabType = "overview" | "chapters" | "history" | "gacha";

function StatsPage() {
  const navigate = useNavigate();
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

  // Conquest stats
  const conquestStats = user?.conquestStats;
  const rankPoints = conquestStats?.rankPoints ?? 0;
  const currentRank = getRankFromPoints(rankPoints);
  const conquestTotal =
    (conquestStats?.totalConquestCorrect ?? 0) +
    (conquestStats?.totalConquestWrong ?? 0);
  const conquestAccuracy =
    conquestTotal > 0
      ? Math.round(
          ((conquestStats?.totalConquestCorrect ?? 0) / conquestTotal) * 100
        )
      : 0;

  // Weekly data based on actual day and streak
  const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const today = new Date();
  // getDay(): 0=CN, 1=T2, 2=T3, ... 6=T7
  // Convert to our index: T2=0, T3=1, ... T7=5, CN=6
  const todayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const streak = user?.streak ?? 0;

  const weeklyData = weekDays.map((_, i) => {
    // Hiển thị hoạt động cho các ngày từ (hôm nay - streak + 1) đến hôm nay
    const daysFromToday = todayIndex - i;
    if (daysFromToday >= 0 && daysFromToday < streak) {
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

  // Get tower floor from localStorage
  const [towerFloor, setTowerFloor] = useState(0);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("tower_progress");
      if (saved) {
        const data = JSON.parse(saved);
        setTowerFloor(data.currentFloor || 0);
      }
    } catch (e) {
      console.error("Error loading tower progress:", e);
    }
  }, []);

  // Calculate score categories
  const scoreCategories = calculateScoreCategories(user, towerFloor);

  return (
    <Page className="bg-background min-h-screen">
      {/* Header - Fixed */}
      <div className="fixed top-0 left-0 right-0 z-40 pt-12 pb-4 px-4 bg-gradient-to-r from-[var(--duo-blue)] to-[var(--duo-purple)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/settings")}
            className="btn-back-3d w-10 h-10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-white" />
              <h1 className="font-bold text-xl text-white">Thống kê</h1>
            </div>
            <p className="text-white/80 text-sm mt-1">
              Phân tích chi tiết quá trình học
            </p>
          </div>
        </div>
      </div>

      {/* Tabs - Fixed */}
      <div className="fixed top-[108px] left-0 right-0 z-40 px-4 py-2 bg-[var(--card)] border-b border-[var(--border)]">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: "overview", label: "Tổng quan", icon: TrendingUp },
            { id: "chapters", label: "Chương", icon: BookOpen },
            { id: "history", label: "Lịch sử", icon: Calendar },
            { id: "gacha", label: "Gacha", icon: Sparkles },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? "bg-[var(--duo-green)] text-white"
                  : "bg-[var(--secondary)] text-[var(--muted-foreground)]"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-44 pb-28">
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

            {/* Score Categories - Điểm theo lĩnh vực */}
            <div className="card-3d p-4">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Medal className="w-5 h-5 text-[var(--duo-yellow)]" />
                Điểm theo lĩnh vực
              </h3>

              {/* Total Score */}
              <div className="bg-gradient-to-r from-[var(--duo-purple)] to-[var(--duo-blue)] rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm">Tổng điểm</p>
                    <p className="text-3xl font-bold text-white">
                      {formatNumber(scoreCategories.totalScore)}
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                    <Trophy className="w-7 h-7 text-white" />
                  </div>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="space-y-3">
                {[
                  {
                    label: "Luyện tập",
                    score: scoreCategories.quizScore,
                    icon: BookOpen,
                    color: "var(--duo-green)",
                    bgColor: "var(--duo-green)",
                  },
                  {
                    label: "Chinh Chiến",
                    score: scoreCategories.conquestScore,
                    icon: Swords,
                    color: "var(--duo-purple)",
                    bgColor: "var(--duo-purple)",
                  },
                  {
                    label: "Bộ sưu tập",
                    score: scoreCategories.gachaScore,
                    icon: Sparkles,
                    color: "var(--duo-yellow)",
                    bgColor: "var(--duo-yellow)",
                  },
                  {
                    label: "Tháp Luyện Ngục",
                    score: scoreCategories.towerScore,
                    icon: Building,
                    color: "var(--duo-orange)",
                    bgColor: "var(--duo-orange)",
                  },
                  {
                    label: "Thành tựu",
                    score: scoreCategories.achievementScore,
                    icon: Award,
                    color: "var(--duo-blue)",
                    bgColor: "var(--duo-blue)",
                  },
                ].map((item) => {
                  const percent =
                    scoreCategories.totalScore > 0
                      ? (item.score / scoreCategories.totalScore) * 100
                      : 0;
                  return (
                    <div key={item.label} className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${item.bgColor}20` }}
                      >
                        <item.icon
                          className="w-4.5 h-4.5"
                          style={{ color: item.color }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">
                            {item.label}
                          </span>
                          <span
                            className="text-sm font-bold"
                            style={{ color: item.color }}
                          >
                            {formatNumber(item.score)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-[var(--secondary)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(percent, 100)}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Accuracy Ring */}
            <div className="card-3d p-4">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-[var(--duo-blue)]" />
                Độ chính xác tổng
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

            {/* More Stats */}
            <div className="grid grid-cols-4 gap-2">
              <div className="card-3d p-3 text-center">
                <img
                  src="/AppAssets/Lighting.png"
                  alt="xp"
                  className="w-5 h-5 mx-auto mb-1"
                />
                <p className="text-sm font-bold text-foreground">
                  {user?.exp ?? 0}
                </p>
                <p className="text-[9px] text-[var(--muted-foreground)]">XP</p>
              </div>
              <div className="card-3d p-3 text-center">
                <Trophy className="w-5 h-5 text-[var(--duo-yellow)] mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">
                  Lv.{user?.level ?? 1}
                </p>
                <p className="text-[9px] text-[var(--muted-foreground)]">
                  Cấp độ
                </p>
              </div>
              <div className="card-3d p-3 text-center">
                <Star className="w-5 h-5 text-[var(--duo-yellow)] mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">
                  {user?.perfectLessons ?? 0}
                </p>
                <p className="text-[9px] text-[var(--muted-foreground)]">
                  100%
                </p>
              </div>
              <div className="card-3d p-3 text-center">
                <img
                  src="/AppAssets/BlueDiamond.png"
                  alt="gem"
                  className="w-5 h-5 mx-auto mb-1"
                />
                <p className="text-sm font-bold text-foreground">
                  {formatNumber(user?.gems ?? 0)}
                </p>
                <p className="text-[9px] text-[var(--muted-foreground)]">
                  Gems
                </p>
              </div>
            </div>

            {/* Weekly Chart */}
            <div className="card-3d p-4">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[var(--duo-purple)]" />
                Hoạt động tuần này
              </h3>
              <div className="flex items-end justify-between h-24 gap-1">
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
                <img
                  src="/AppAssets/Fire.png"
                  alt="streak"
                  className="w-6 h-6"
                />
                <span className="font-bold text-[var(--duo-orange)]">
                  {user?.streak ?? 0} ngày streak
                </span>
              </div>
            </div>

            {/* Conquest Stats */}
            <div className="card-3d p-4">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Swords className="w-5 h-5 text-[var(--duo-purple)]" />
                Chinh Chiến
              </h3>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <img
                    src={getRankImage(currentRank)}
                    alt={currentRank.rankName}
                    className="w-16 h-16 mx-auto object-contain"
                  />
                  <p className="text-sm font-bold text-foreground mt-1">
                    {currentRank.rankName}
                  </p>
                  <p className="text-xs text-[var(--duo-purple)] font-bold">
                    {rankPoints} RP
                  </p>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div className="bg-[var(--secondary)] rounded-xl p-2 text-center">
                    <p className="text-lg font-bold text-foreground">
                      {conquestStats?.totalConquests ?? 0}
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">
                      Tổng trận
                    </p>
                  </div>
                  <div className="bg-[var(--secondary)] rounded-xl p-2 text-center">
                    <p className="text-lg font-bold text-foreground">
                      {conquestAccuracy}%
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">
                      Độ chính xác
                    </p>
                  </div>
                  <div className="bg-[var(--secondary)] rounded-xl p-2 text-center">
                    <p className="text-lg font-bold text-[var(--duo-green)]">
                      {conquestStats?.totalConquestCorrect ?? 0}
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">
                      Câu đúng
                    </p>
                  </div>
                  <div className="bg-[var(--secondary)] rounded-xl p-2 text-center">
                    <p className="text-lg font-bold text-[var(--duo-orange)]">
                      {conquestStats?.bestWinStreak ?? 0}
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">
                      Win streak
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chapters Tab */}
        {activeTab === "chapters" && (
          <div className="space-y-4">
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
                    width: `${
                      (completedChapters / Math.max(chapters.length, 1)) * 100
                    }%`,
                  }}
                />
              </div>
            </div>

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
            <div className="card-3d p-4">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[var(--duo-blue)]" />
                Streak
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[var(--secondary)] rounded-xl p-3 text-center">
                  <img
                    src="/AppAssets/Fire.png"
                    alt="streak"
                    className="w-8 h-8 mx-auto mb-1"
                  />
                  <p className="text-2xl font-bold text-[var(--duo-orange)]">
                    {user?.streak ?? 0}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Hiện tại
                  </p>
                </div>
                <div className="bg-[var(--secondary)] rounded-xl p-3 text-center">
                  <Flame className="w-8 h-8 text-[var(--duo-red)] mx-auto mb-1" />
                  <p className="text-2xl font-bold text-[var(--duo-red)]">
                    {user?.longestStreak ?? 0}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Dài nhất
                  </p>
                </div>
              </div>
            </div>

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
                  {
                    label: "100 Rank Points",
                    value: 100,
                    current: conquestStats?.rankPoints ?? 0,
                    icon: Swords,
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

        {/* Gacha Tab */}
        {activeTab === "gacha" && (
          <div className="space-y-4">
            {/* Tổng quan Gacha */}
            <div className="card-3d p-4">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--duo-yellow)]" />
                Tổng quan Gacha
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[var(--secondary)] rounded-xl p-3 text-center">
                  <Package className="w-6 h-6 text-[var(--duo-purple)] mx-auto mb-1" />
                  <p className="text-xl font-bold text-foreground">
                    {user?.gachaInventory?.totalPulls ?? 0}
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    Tổng lần quay
                  </p>
                </div>
                <div className="bg-[var(--secondary)] rounded-xl p-3 text-center">
                  <img
                    src="/IconPack/Currency/Crystal/256w/Crystal Blue 256px.png"
                    alt="shard"
                    className="w-6 h-6 mx-auto mb-1"
                  />
                  <p className="text-xl font-bold text-[var(--duo-blue)]">
                    {formatNumber(user?.gachaInventory?.shards ?? 0)}
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    Mảnh ghép
                  </p>
                </div>
              </div>
            </div>

            {/* Thẻ theo độ hiếm */}
            <div className="card-3d p-4">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-[var(--duo-orange)]" />
                Thẻ theo độ hiếm
              </h3>
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-gradient-to-b from-[#FFD700]/20 to-[#FFD700]/5 rounded-xl p-3 text-center border border-[#FFD700]/30">
                  <p className="text-xs font-bold text-[#FFD700] mb-1">UR</p>
                  <p className="text-xl font-bold text-foreground">
                    {user?.gachaInventory?.gachaStats?.totalURCards ?? 0}
                  </p>
                </div>
                <div className="bg-gradient-to-b from-[#9B59B6]/20 to-[#9B59B6]/5 rounded-xl p-3 text-center border border-[#9B59B6]/30">
                  <p className="text-xs font-bold text-[#9B59B6] mb-1">SR</p>
                  <p className="text-xl font-bold text-foreground">
                    {user?.gachaInventory?.gachaStats?.totalSRCards ?? 0}
                  </p>
                </div>
                <div className="bg-gradient-to-b from-[#3498DB]/20 to-[#3498DB]/5 rounded-xl p-3 text-center border border-[#3498DB]/30">
                  <p className="text-xs font-bold text-[#3498DB] mb-1">R</p>
                  <p className="text-xl font-bold text-foreground">
                    {user?.gachaInventory?.gachaStats?.totalRCards ?? 0}
                  </p>
                </div>
                <div className="bg-gradient-to-b from-[#95A5A6]/20 to-[#95A5A6]/5 rounded-xl p-3 text-center border border-[#95A5A6]/30">
                  <p className="text-xs font-bold text-[#95A5A6] mb-1">N</p>
                  <p className="text-xl font-bold text-foreground">
                    {user?.gachaInventory?.gachaStats?.totalNCards ?? 0}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[var(--border)]">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--muted-foreground)]">
                    Tổng thẻ unique
                  </span>
                  <span className="font-bold text-foreground">
                    {(user?.gachaInventory?.gachaStats?.totalURCards ?? 0) +
                      (user?.gachaInventory?.gachaStats?.totalSRCards ?? 0) +
                      (user?.gachaInventory?.gachaStats?.totalRCards ?? 0) +
                      (user?.gachaInventory?.gachaStats?.totalNCards ?? 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Rewards */}
            <div className="card-3d p-4">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-[var(--duo-green)]" />
                Phần thưởng sưu tập
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[var(--secondary)] rounded-xl p-3 text-center">
                  <User className="w-6 h-6 text-[var(--duo-blue)] mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">
                    {user?.gachaInventory?.gachaStats?.totalAvatars ?? 0}
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    Avatar
                  </p>
                </div>
                <div className="bg-[var(--secondary)] rounded-xl p-3 text-center">
                  <Frame className="w-6 h-6 text-[var(--duo-purple)] mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">
                    {user?.gachaInventory?.gachaStats?.totalFrames ?? 0}
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    Khung
                  </p>
                </div>
                <div className="bg-[var(--secondary)] rounded-xl p-3 text-center">
                  <Award className="w-6 h-6 text-[var(--duo-yellow)] mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">
                    {user?.gachaInventory?.gachaStats?.totalBadges ?? 0}
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    Huy hiệu
                  </p>
                </div>
              </div>
            </div>

            {/* Collections */}
            <div className="card-3d p-4">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Package className="w-5 h-5 text-[var(--duo-purple)]" />
                Bộ sưu tập
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--duo-purple)] to-[var(--duo-blue)] flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {user?.gachaInventory?.gachaStats?.completedCollections ??
                      0}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-foreground">
                    Gói hoàn thành
                  </p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Số bộ sưu tập đã thu thập đủ thẻ
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-[var(--muted-foreground)]">
                      Đang tham gia:
                    </span>
                    <span className="font-bold text-[var(--duo-green)]">
                      {Object.keys(user?.gachaInventory?.cards ?? {}).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tỷ lệ may mắn */}
            <div className="card-3d p-4">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-[var(--duo-red)]" />
                Tỷ lệ may mắn
              </h3>
              {(user?.gachaInventory?.totalPulls ?? 0) > 0 ? (
                <div className="space-y-2">
                  {[
                    {
                      label: "UR",
                      count:
                        user?.gachaInventory?.gachaStats?.totalURCards ?? 0,
                      color: "#FFD700",
                      rate: 3,
                    },
                    {
                      label: "SR",
                      count:
                        user?.gachaInventory?.gachaStats?.totalSRCards ?? 0,
                      color: "#9B59B6",
                      rate: 18,
                    },
                    {
                      label: "R",
                      count: user?.gachaInventory?.gachaStats?.totalRCards ?? 0,
                      color: "#3498DB",
                      rate: 39,
                    },
                    {
                      label: "N",
                      count: user?.gachaInventory?.gachaStats?.totalNCards ?? 0,
                      color: "#95A5A6",
                      rate: 40,
                    },
                  ].map((item) => {
                    const totalCards =
                      (user?.gachaInventory?.gachaStats?.totalURCards ?? 0) +
                      (user?.gachaInventory?.gachaStats?.totalSRCards ?? 0) +
                      (user?.gachaInventory?.gachaStats?.totalRCards ?? 0) +
                      (user?.gachaInventory?.gachaStats?.totalNCards ?? 0);
                    const actualRate =
                      totalCards > 0
                        ? ((item.count / totalCards) * 100).toFixed(1)
                        : "0";
                    return (
                      <div key={item.label} className="flex items-center gap-2">
                        <span
                          className="text-xs font-bold w-6"
                          style={{ color: item.color }}
                        >
                          {item.label}
                        </span>
                        <div className="flex-1 h-2 bg-[var(--secondary)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(
                                (item.count / Math.max(totalCards, 1)) * 100,
                                100
                              )}%`,
                              background: item.color,
                            }}
                          />
                        </div>
                        <span className="text-xs text-[var(--muted-foreground)] w-16 text-right">
                          {actualRate}% ({item.rate}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-[var(--muted-foreground)] py-4">
                  Chưa có dữ liệu quay gacha
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}

export default StatsPage;
