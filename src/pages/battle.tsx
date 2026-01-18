import { useNavigate } from "react-router-dom";
import { Page } from "@/components/ui/page";
import { ArrowLeft, Shuffle, Zap, Clock, Skull } from "lucide-react";
import { useQuizStore } from "@/stores/quiz-store";
import { useUserStore } from "@/stores/user-store";
import { formatNumber } from "@/lib/utils";

const gameModes = [
  {
    id: "random",
    name: "Ngẫu nhiên",
    desc: "10 câu hỏi ngẫu nhiên",
    icon: Shuffle,
    color: "#ff9600",
    shadow: "#ea7e00",
  },
  {
    id: "quick",
    name: "Nhanh",
    desc: "5 câu - Luyện nhanh",
    icon: Zap,
    color: "#58cc02",
    shadow: "#46a302",
  },
  {
    id: "timeattack",
    name: "Chạy Đua",
    desc: "10 câu trong 60 giây",
    icon: Clock,
    color: "#1cb0f6",
    shadow: "#1899d6",
  },
  {
    id: "survival",
    name: "Hardcore",
    desc: "10 câu - 1 sai = Thua",
    icon: Skull,
    color: "#ff4b4b",
    shadow: "#ea2b2b",
  },
];

function BattlePage() {
  const navigate = useNavigate();
  const { startRandomQuiz, startTimeAttack, startSurvival } = useQuizStore();
  const { user } = useUserStore();

  const startMode = (modeId: string) => {
    switch (modeId) {
      case "random":
        startRandomQuiz(10);
        break;
      case "quick":
        startRandomQuiz(5);
        break;
      case "timeattack":
        startTimeAttack(60);
        break;
      case "survival":
        startSurvival(1);
        break;
    }
    navigate("/quiz");
  };

  // Chế độ luyện tập không cần tim - chơi thoải mái
  const handleMode = (modeId: string) => {
    startMode(modeId);
  };

  return (
    <Page className="bg-background min-h-screen">
      {/* Header */}
      <div className="pt-4 pb-4 px-4 bg-[var(--card)] border-b-2 border-[var(--border)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="btn-back-3d w-10 h-10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="font-bold text-xl text-foreground">Luyện Tập</h1>
            <p className="text-xs text-[var(--muted-foreground)]">
              Chọn chế độ luyện
            </p>
          </div>
        </div>
      </div>

      {/* User Stats - Luyện tập không cần tim */}
      {user && (
        <div className="px-4 py-3 flex items-center justify-center gap-6 bg-[var(--card)] border-b-2 border-[var(--border)]">
          <div className="flex items-center gap-1.5 bg-[var(--duo-green)]/20 px-3 py-1 rounded-full">
            <span className="text-sm font-bold text-[var(--duo-green)]">
              Không giới hạn tim
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <img src="/AppAssets/Lighting.png" alt="xp" className="w-5 h-5" />
            <span className="font-bold text-foreground">
              {formatNumber(user.exp)} XP
            </span>
          </div>
        </div>
      )}

      {/* Game Modes */}
      <div className="px-4 py-6 space-y-4">
        {gameModes.map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => handleMode(mode.id)}
              className="btn-mode w-full p-4 rounded-2xl text-left flex items-center gap-4"
              style={
                {
                  background: mode.color,
                  boxShadow: `0 5px 0 ${mode.shadow}`,
                  "--shadow-color": mode.shadow,
                } as React.CSSProperties
              }
            >
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                <Icon className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-white">{mode.name}</h3>
                <p className="text-sm text-white/80">{mode.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </Page>
  );
}

export default BattlePage;
