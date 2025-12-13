import { Page, useNavigate } from "zmp-ui";
import { useEffect, useState, useRef } from "react";
import {
  ArrowLeft,
  Flame,
  RotateCcw,
  Skull,
  CheckCircle2,
  XCircle,
  Lock,
  Gift,
  Star,
  Check,
  Play,
} from "lucide-react";
import { useTowerStore, getFloorReward } from "@/stores/tower-store";
import { useUserStore } from "@/stores/user-store";
import { RewardModal } from "@/components/ui/reward-modal";
import confetti from "canvas-confetti";

function EventTowerPage() {
  const navigate = useNavigate();
  const {
    currentFloor,
    highestFloor,
    claimedFloors,
    totalFloors,
    activeFloor,
    currentQuestion,
    selectedAnswer,
    isAnswered,
    isCorrect,
    initTower,
    startFloor,
    selectAnswer,
    completeFloor,
    failFloor,
    claimReward,
    exitQuiz,
    resetTower,
  } = useTowerStore();

  const { addGems } = useUserStore();
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [claimedReward, setClaimedReward] = useState(0);
  const currentFloorRef = useRef<HTMLDivElement>(null);

  // Initialize tower on mount
  useEffect(() => {
    initTower();
  }, []);

  // Auto scroll to current floor when loaded
  useEffect(() => {
    if (totalFloors > 0 && !activeFloor && currentFloorRef.current) {
      setTimeout(() => {
        currentFloorRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 300);
    }
  }, [totalFloors, activeFloor]);

  // Handle answer result
  useEffect(() => {
    if (isAnswered && activeFloor) {
      const timer = setTimeout(async () => {
        if (isCorrect) {
          const result = completeFloor();
          const claimed = claimReward(activeFloor);
          if (claimed > 0) {
            await addGems(claimed);
          }
          setClaimedReward(result.gems);
          setShowRewardModal(true);
          confetti({
            particleCount: 100,
            spread: 60,
            origin: { y: 0.7 },
            colors: ["#58cc02", "#ffc800", "#ce82ff"],
          });
        } else {
          setShowFailModal(true);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAnswered, isCorrect]);

  const handleCloseReward = () => {
    setShowRewardModal(false);
    setClaimedReward(0);
    exitQuiz();
  };

  const handleFailAndReset = () => {
    failFloor();
    setShowFailModal(false);
  };

  // Quiz screen
  if (activeFloor && currentQuestion) {
    return (
      <Page className="bg-background min-h-screen">
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 z-50 pt-12 pb-4 px-4 bg-gradient-to-r from-[#8B5CF6] to-[#A855F7]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => exitQuiz()}
              className="btn-back-3d w-10 h-10 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1">
              <h1 className="font-bold text-xl text-white">
                Tầng {activeFloor}/{totalFloors}
              </h1>
              <p className="text-white/80 text-sm flex items-center gap-1">
                Phần thưởng: +{getFloorReward(activeFloor)}
                <img
                  src="/AppAssets/BlueDiamond.png"
                  alt="gem"
                  className="w-4 h-4"
                />
              </p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${(activeFloor / totalFloors) * 100}%` }}
            />
          </div>
        </div>

        {/* Question content */}
        <div className="px-4 pt-36 pb-8">
          <div className="card-3d p-5">
            <div className="mb-6">
              <p className="text-xs text-[var(--muted-foreground)] mb-2">
                Chương {currentQuestion.chapter}: {currentQuestion.chapterName}
              </p>
              <h2 className="font-bold text-lg text-foreground">
                {currentQuestion.question}
              </h2>
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedAnswer === option.id;
                const isCorrectAnswer =
                  option.id === currentQuestion.correctAnswer;

                let optionClass = "p-4 rounded-xl border-2 transition-all ";

                if (isAnswered) {
                  if (isCorrectAnswer) {
                    optionClass +=
                      "border-[var(--duo-green)] bg-[var(--duo-green)]/10";
                  } else if (isSelected && !isCorrectAnswer) {
                    optionClass +=
                      "border-[var(--duo-red)] bg-[var(--duo-red)]/10";
                  } else {
                    optionClass +=
                      "border-[var(--border)] bg-[var(--secondary)] opacity-50";
                  }
                } else {
                  optionClass += isSelected
                    ? "border-[var(--duo-blue)] bg-[var(--duo-blue)]/10"
                    : "border-[var(--border)] bg-[var(--secondary)]";
                }

                return (
                  <button
                    key={option.id}
                    onClick={() => !isAnswered && selectAnswer(option.id)}
                    disabled={isAnswered}
                    className={`w-full text-left ${optionClass}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-[var(--background)] flex items-center justify-center font-bold text-sm">
                        {option.id}
                      </span>
                      <span className="flex-1 text-foreground">
                        {option.text}
                      </span>
                      {isAnswered && isCorrectAnswer && (
                        <CheckCircle2 className="w-5 h-5 text-[var(--duo-green)]" />
                      )}
                      {isAnswered && isSelected && !isCorrectAnswer && (
                        <XCircle className="w-5 h-5 text-[var(--duo-red)]" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <RewardModal
          isOpen={showRewardModal}
          onClose={handleCloseReward}
          title={`Vượt qua tầng ${activeFloor}!`}
          subtitle="Tiếp tục leo tháp nào!"
          rewards={[{ type: "gems", amount: claimedReward }]}
          gradientFrom="#8B5CF6"
          gradientTo="#A855F7"
        />

        {showFailModal && (
          <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4">
            <div className="bg-[var(--card)] rounded-3xl p-6 max-w-sm w-full">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-[var(--duo-red)]/20 flex items-center justify-center">
                  <Skull className="w-10 h-10 text-[var(--duo-red)]" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-foreground text-center mb-2">
                Rớt xuống đáy tháp!
              </h2>
              <p className="text-sm text-[var(--muted-foreground)] text-center mb-4">
                Bạn phải leo lại từ tầng 1. Quà đã nhận vẫn giữ nguyên!
              </p>
              <button
                onClick={handleFailAndReset}
                className="w-full btn-3d btn-3d-purple py-3 font-bold"
              >
                <RotateCcw className="w-4 h-4 mr-2 inline" />
                Leo lại từ đầu
              </button>
            </div>
          </div>
        )}
      </Page>
    );
  }

  // Tower floor selection screen - show ALL floors
  const totalClaimed = claimedFloors.length;

  return (
    <Page className="bg-background min-h-screen">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 pt-12 pb-4 px-4 bg-gradient-to-r from-[#8B5CF6] to-[#A855F7]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="btn-back-3d w-10 h-10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-xl text-white">Tháp Luyện Ngục</h1>
            <p className="text-white/80 text-sm">
              {totalFloors} tầng - Leo tháp nhận thưởng!
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-32 pb-28">
        {/* Current Progress */}
        <div className="card-3d p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#A855F7] flex items-center justify-center">
                <Flame className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Tầng hiện tại
                </p>
                <p className="font-bold text-2xl text-foreground">
                  {currentFloor}/{totalFloors}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-[var(--muted-foreground)]">Cao nhất</p>
              <div className="flex items-center gap-1 justify-end">
                <Star className="w-4 h-4 text-[var(--duo-yellow)]" />
                <span className="font-bold text-lg text-foreground">
                  {highestFloor}
                </span>
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-2 bg-[var(--secondary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] transition-all"
              style={{ width: `${(highestFloor / totalFloors) * 100}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 card-3d p-3 text-center">
            <p className="text-2xl font-bold text-[var(--duo-green)]">
              {totalClaimed}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">Đã nhận</p>
          </div>
          <div className="flex-1 card-3d p-3 text-center">
            <p className="text-2xl font-bold text-[#8B5CF6]">{highestFloor}</p>
            <p className="text-xs text-[var(--muted-foreground)]">Đã vượt</p>
          </div>
          <div className="flex-1 card-3d p-3 text-center">
            <p className="text-2xl font-bold text-[var(--muted-foreground)]">
              {totalFloors - highestFloor}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">Còn lại</p>
          </div>
        </div>

        {/* Floor List - ALL floors from top to bottom */}
        <div className="space-y-2">
          {Array.from({ length: totalFloors }, (_, i) => totalFloors - i).map(
            (floor) => {
              const isUnlocked = floor <= currentFloor;
              const isCompleted = floor <= highestFloor;
              const isClaimed = claimedFloors.includes(floor);
              const isCurrent = floor === currentFloor;
              const reward = getFloorReward(floor);

              // Milestone floors (every 10, 50, 100)
              const isMilestone =
                floor % 100 === 0 || floor % 50 === 0 || floor % 10 === 0;
              const isLegendary = floor === totalFloors;

              return (
                <div
                  key={floor}
                  ref={isCurrent ? currentFloorRef : null}
                  className={`card-3d p-3 flex items-center gap-3 ${
                    isLegendary
                      ? "border-2 border-[var(--duo-yellow)]"
                      : isCurrent
                      ? "border-2 border-[#8B5CF6]"
                      : isCompleted
                      ? "border-2 border-[var(--duo-green)]"
                      : !isUnlocked
                      ? "opacity-50"
                      : ""
                  }`}
                >
                  {/* Floor number */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isLegendary
                        ? "bg-gradient-to-br from-[var(--duo-yellow)] to-[var(--duo-orange)]"
                        : isMilestone
                        ? "bg-gradient-to-br from-[#8B5CF6] to-[#A855F7]"
                        : isCompleted
                        ? "bg-[var(--duo-green)]"
                        : "bg-[var(--secondary)]"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-6 h-6 text-white" />
                    ) : (
                      <span
                        className={`font-bold ${
                          isMilestone || isLegendary
                            ? "text-white"
                            : "text-foreground"
                        }`}
                      >
                        {floor}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={`font-bold ${
                          isCurrent ? "text-[#8B5CF6]" : "text-foreground"
                        }`}
                      >
                        Tầng {floor}
                      </p>
                      {isLegendary && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--duo-yellow)] text-black font-bold">
                          ĐỈNH
                        </span>
                      )}
                      {isMilestone && !isLegendary && floor % 50 === 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#8B5CF6] text-white">
                          Mốc
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {isClaimed ? (
                        <span className="text-xs text-[var(--duo-green)]">
                          Đã nhận thưởng
                        </span>
                      ) : (
                        <>
                          <span
                            className={`font-bold ${
                              isLegendary
                                ? "text-[var(--duo-yellow)]"
                                : "text-[var(--duo-blue)]"
                            }`}
                          >
                            +{reward}
                          </span>
                          <img
                            src="/AppAssets/BlueDiamond.png"
                            alt="gem"
                            className="w-4 h-4"
                          />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  {isClaimed ? (
                    <div className="w-10 h-10 rounded-full bg-[var(--duo-green)] flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  ) : isUnlocked && isCurrent ? (
                    <button
                      onClick={() => startFloor(floor)}
                      className="btn-3d btn-3d-purple px-4 py-2 text-sm flex items-center gap-1"
                    >
                      <Play className="w-4 h-4" />
                      Vào
                    </button>
                  ) : !isUnlocked ? (
                    <div className="w-10 h-10 rounded-full bg-[var(--muted-foreground)]/30 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-[var(--muted-foreground)]" />
                    </div>
                  ) : null}
                </div>
              );
            }
          )}
        </div>

        {/* Info */}
        <div className="mt-6 card-3d p-4">
          <div className="flex items-start gap-3">
            <Gift className="w-5 h-5 text-[var(--duo-yellow)] flex-shrink-0 mt-0.5" />
            <div className="text-sm text-[var(--muted-foreground)]">
              <p className="font-semibold text-foreground mb-1">Luật chơi:</p>
              <ul className="space-y-1">
                <li>• Mỗi tầng 1 câu hỏi, trả lời đúng để lên tầng tiếp</li>
                <li>• Phần thưởng: Tầng N = N x 10 gems</li>
                <li>• Sai 1 câu = Rớt xuống tầng 1, leo lại từ đầu</li>
                <li>• Quà đã nhận vẫn giữ nguyên khi rớt</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Reset button */}
        {highestFloor > 0 && (
          <button
            onClick={() => {
              if (
                confirm(
                  "Bạn có chắc muốn reset tháp? Tiến trình sẽ mất nhưng quà đã nhận vẫn giữ!"
                )
              ) {
                resetTower();
              }
            }}
            className="w-full mt-4 py-3 text-[var(--muted-foreground)] text-sm"
          >
            <RotateCcw className="w-4 h-4 mr-1 inline" />
            Reset tháp (giữ quà đã nhận)
          </button>
        )}
      </div>
    </Page>
  );
}

export default EventTowerPage;
