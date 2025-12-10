import { Page } from "zmp-ui";
import { Sun, Moon, User, Info } from "lucide-react";
import { useThemeStore } from "@/stores/theme-store";
import { useUserStore } from "@/stores/user-store";

function SettingsPage() {
  const { theme, toggleTheme } = useThemeStore();
  const { user } = useUserStore();

  return (
    <Page className="bg-background min-h-screen">
      {/* Header - pt-16 để tránh dính nút X của Zalo */}
      <div className="pt-16 pb-4 px-4 bg-[var(--card)] border-b-2 border-[var(--border)]">
        <h1 className="font-bold text-xl text-foreground">Cài đặt</h1>
      </div>

      {/* Content */}
      <div className="px-4 py-4 pb-32">
        {/* User Info */}
        {user && (
          <div className="card-3d p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[var(--duo-blue)] flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user.odername.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h2 className="font-bold text-lg text-foreground">
                  {user.odername}
                </h2>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Level {user.level} • {user.totalScore} XP
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Settings List */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--muted-foreground)] mb-2">
            Giao diện
          </h3>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="card-3d w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--duo-yellow)]/20 flex items-center justify-center">
                {theme === "dark" ? (
                  <Moon className="w-5 h-5 text-[var(--duo-yellow)]" />
                ) : (
                  <Sun className="w-5 h-5 text-[var(--duo-yellow)]" />
                )}
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Chế độ tối</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {theme === "dark" ? "Đang bật" : "Đang tắt"}
                </p>
              </div>
            </div>
            {/* Toggle Switch */}
            <div
              className={`w-14 h-8 rounded-full p-1 ${
                theme === "dark"
                  ? "bg-[var(--duo-green)]"
                  : "bg-[var(--secondary)]"
              }`}
            >
              <div
                className="w-6 h-6 rounded-full bg-white shadow-md"
                style={{
                  transform:
                    theme === "dark" ? "translateX(24px)" : "translateX(0)",
                }}
              />
            </div>
          </button>

          <h3 className="text-sm font-semibold text-[var(--muted-foreground)] mt-6 mb-2">
            Thông tin
          </h3>

          {/* App Info */}
          <div className="card-3d p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--duo-blue)]/20 flex items-center justify-center">
                <Info className="w-5 h-5 text-[var(--duo-blue)]" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Quiz QTDA</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Phiên bản 1.0.0
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          {user && (
            <div className="card-3d p-4 mt-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--duo-purple)]/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-[var(--duo-purple)]" />
                </div>
                <p className="font-semibold text-foreground">
                  Thống kê của bạn
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[var(--secondary)] rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-[var(--duo-green)]">
                    {user.totalCorrect}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Câu đúng
                  </p>
                </div>
                <div className="bg-[var(--secondary)] rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-[var(--duo-red)]">
                    {user.totalWrong}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Câu sai
                  </p>
                </div>
                <div className="bg-[var(--secondary)] rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-[var(--duo-orange)]">
                    {user.streak}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Streak
                  </p>
                </div>
                <div className="bg-[var(--secondary)] rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-[var(--duo-yellow)]">
                    {user.exp}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Tổng XP
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}

export default SettingsPage;
