import { useNavigate } from "zmp-ui";
import { Page } from "zmp-ui";
import { ArrowLeft, Shuffle, Infinity, Clock, Skull } from "lucide-react";
import { useQuizStore } from "@/stores/quiz-store";
import { useUserStore } from "@/stores/user-store";
import { useState } from "react";
import { NoHeartsModal } from "@/components/ui/custom-modal";

const gameModes = [
  {
    id: "random",
    name: "Ngẫu nhiên",
    desc: "20 câu hỏi ngẫu nhiên",
    icon: Shuffle,
    color: "#ff9600",
    shadow: "#ea7e00",
  },
  {
    id: "marathon",
    name: "Marathon",
    desc: "Tất cả câu hỏi",
    icon: Infinity,
    color: "#ce82ff",
    shadow: "#a855f7",
  },
  {
    id: "timeattack",
    name: "Time Attack",
    desc: "60 giây - Trả lời nhanh",
    icon: Clock,
    color: "#1cb0f6",
    shadow: "#1899d6",
  },
  {
    id: "survival",
    name: "Sinh Tồn",
    desc: "3 lần sai = Thua",
    icon: Skull,
    color: "#ff4b4b",
    shadow: "#ea2b2b",
  },
];

function BattlePage() {
  const navigate = useNavigate();
  const { startRandomQuiz, startAllQuiz, startTimeAttack, startSurvival } =
    useQuizStore();
  const { user, spendGems, refillHearts, hasUnlimitedHearts } = useUserStore();
  const [showNoHeartsModal, setShowNoHeartsModal] = useState(false);
  const [pendingModeId, setPendingModeId] = useState<string | null>(null);

  const startMode = (modeId: string) => {
    switch (modeId) {
      case "random":
        startRandomQuiz(20);
        break;
      case "marathon":
        startAllQuiz();
        break;
      case "timeattack":
        startTimeAttack(60);
        break;
      case "survival":
        startSurvival(3);
        break;
    }
    navigate("/quiz");
  };

  const handleMode = (modeId: string) => {
    // Bỏ qua kiểm tra tim nếu có unlimited hearts
    if (user && user.hearts <= 0 && !hasUnlimitedHearts()) {
      setPendingModeId(modeId);
      setShowNoHeartsModal(true);
      return;
    }
    startMode(modeId);
  };

  const handleBuyHearts = async () => {
    const success = await spendGems(50);
    if (success) {
      await refillHearts();
      setShowNoHeartsModal(false);
      if (pendingModeId) {
        startMode(pendingModeId);
      }
    }
  };

  const handleGoToShop = () => {
    setShowNoHeartsModal(false);
    navigate("/shop");
  };

  return (
    <Page className="bg-background min-h-screen">
      {/* Header */}
      <div className="pt-16 pb-4 px-4 bg-[var(--card)] border-b-2 border-[var(--border)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
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

      {/* User Stats */}
      {user && (
        <div className="px-4 py-3 flex items-center justify-center gap-6 bg-[var(--card)] border-b-2 border-[var(--border)]">
          {hasUnlimitedHearts() ? (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-[var(--duo-red)] to-[var(--duo-pink)] px-2.5 py-1 rounded-full">
              <img src="/AppAssets/Heart.png" alt="heart" className="w-5 h-5" />
              <span className="font-bold text-white">∞</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <img src="/AppAssets/Heart.png" alt="heart" className="w-5 h-5" />
              <span className="font-bold text-foreground">{user.hearts}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <img src="/AppAssets/Lighting.png" alt="xp" className="w-5 h-5" />
            <span className="font-bold text-foreground">{user.exp} XP</span>
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

      {/* No Hearts Modal */}
      <NoHeartsModal
        isOpen={showNoHeartsModal}
        onClose={() => {
          setShowNoHeartsModal(false);
          setPendingModeId(null);
        }}
        onBuyHearts={handleBuyHearts}
        onGoToShop={handleGoToShop}
        userGems={user?.gems ?? 0}
        heartCost={50}
      />
    </Page>
  );
}

export default BattlePage;
