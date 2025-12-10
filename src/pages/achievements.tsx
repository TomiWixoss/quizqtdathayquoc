import { Page } from "zmp-ui";
import { Award, Lock } from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import { ACHIEVEMENTS } from "@/types/quiz";

function AchievementsPage() {
  const { user } = useUserStore();

  const getProgress = (achievement: (typeof ACHIEVEMENTS)[0]) => {
    if (!user) return 0;
    switch (achievement.type) {
      case "streak":
        return Math.min((user.streak / achievement.requirement) * 100, 100);
      case "correct":
        return Math.min(
          (user.totalCorrect / achievement.requirement) * 100,
          100
        );
      case "perfect":
        return Math.min(
          ((user.perfectLessons ?? 0) / achievement.requirement) * 100,
          100
        );
      case "level":
        return Math.min((user.level / achievement.requirement) * 100, 100);
      case "gems":
        return Math.min(
          ((user.gems ?? 0) / achievement.requirement) * 100,
          100
        );
      default:
        return 0;
    }
  };

  const getCurrentValue = (achievement: (typeof ACHIEVEMENTS)[0]) => {
    if (!user) return 0;
    switch (achievement.type) {
      case "streak":
        return user.streak;
      case "correct":
        return user.totalCorrect;
      case "perfect":
        return user.perfectLessons ?? 0;
      case "level":
        return user.level ?? 1;
      case "gems":
        return user.gems ?? 0;
      default:
        return 0;
    }
  };

  return (
    <Page className="bg-background min-h-screen">
      {/* Header */}
      <div className="pt-16 pb-4 px-4 bg-gradient-to-r from-[var(--duo-purple)] to-[var(--duo-blue)]">
        <div className="flex items-center gap-2">
          <Award className="w-6 h-6 text-white" />
          <h1 className="font-bold text-xl text-white">Thành tựu</h1>
        </div>
        {user && (
          <p className="text-white/80 text-sm mt-1">
            Đã đạt {(user.achievements ?? []).length}/{ACHIEVEMENTS.length}{" "}
            thành tựu
          </p>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-4 pb-28 space-y-3">
        {ACHIEVEMENTS.map((achievement) => {
          const earned = (user?.achievements ?? []).includes(achievement.id);
          const progress = getProgress(achievement);
          const current = getCurrentValue(achievement);

          return (
            <div
              key={achievement.id}
              className={`card-3d p-4 ${
                earned ? "border-[var(--duo-yellow)] border-2" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${
                    earned
                      ? "bg-[var(--duo-yellow)]/20"
                      : "bg-[var(--secondary)]"
                  }`}
                >
                  {earned ? (
                    achievement.icon
                  ) : (
                    <Lock className="w-6 h-6 text-[var(--muted-foreground)]" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3
                    className={`font-bold ${
                      earned ? "text-[var(--duo-yellow)]" : "text-foreground"
                    }`}
                  >
                    {achievement.name}
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)] mb-2">
                    {achievement.description}
                  </p>

                  {/* Progress */}
                  {!earned && (
                    <div>
                      <div className="progress-duo h-2">
                        <div
                          className="progress-duo-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">
                        {current}/{achievement.requirement}
                      </p>
                    </div>
                  )}
                </div>

                {/* Reward */}
                {earned && (
                  <div className="text-center">
                    <span className="text-2xl">✓</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Page>
  );
}

export default AchievementsPage;
