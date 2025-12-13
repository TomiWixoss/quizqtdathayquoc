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
  X,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTowerStore, getFloorReward } from "@/stores/tower-store";
import { useUserStore } from "@/stores/user-store";
import { RewardModal } from "@/components/ui/reward-modal";
import confetti from "canvas-confetti";

// Helper format countdown
function formatCountdown(ms: number): string {
  if (ms <= 0) return "Đang reset...";

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const d = days;
  const h = hours % 24;
  const m = minutes % 60;
  const s = seconds % 60;

  if (d > 0) {
    return `${d}n ${h}g ${m}p`;
  }
  return `${h}g ${m}p ${s}s`;
}

function EventTowerPage() {
  const navigate = useNavigate();
  const towerState = useTowerStore();
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
    getNextResetTime,
  } = towerState;

  const { addGems, incrementDailyTowerFloors } = useUserStore();
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [claimedReward, setClaimedReward] = useState(0);
  const [pendingAnswer, setPendingAnswer] = useState<string | null>(null);
  const currentFloorRef = useRef<HTMLDivElement>(null);
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    initTower();
  }, []);

  // Countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const nextReset = getNextResetTime();
      const remaining = nextReset - Date.now();
      setCountdown(formatCountdown(remaining));

      // Auto refresh nếu đã hết thời gian
      if (remaining <= 0) {
        initTower();
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [getNextResetTime, initTower]);

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

  useEffect(() => {
    setPendingAnswer(null);
  }, [activeFloor]);

  const handleCheckAnswer = () => {
    if (!pendingAnswer || isAnswered) return;
    selectAnswer(pendingAnswer);
  };

  useEffect(() => {
    if (isAnswered && activeFloor) {
      if (isCorrect) {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#58cc02", "#89e219", "#ffc800"],
        });
      }
    }
  }, [isAnswered, isCorrect, activeFloor]);

  const handleContinue = async () => {
    if (isCorrect) {
      // Check if this floor was already claimed before
      const alreadyClaimed = claimedFloors.includes(activeFloor!);

      completeFloor();
      const claimed = claimReward(activeFloor!);
      if (claimed > 0) {
        await addGems(claimed);
      }

      // Track tower floor for quest (only for new floors)
      if (!alreadyClaimed) {
        await incrementDailyTowerFloors();
      }

      // Only show reward modal if this is a new floor (not already claimed)
      if (!alreadyClaimed && claimed > 0) {
        setClaimedReward(claimed);
        setShowRewardModal(true);
      } else {
        // Already claimed, just exit quiz silently
        exitQuiz();
      }
    } else {
      setShowFailModal(true);
    }
  };

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
        <div className="fixed top-0 left-0 right-0 z-40 pt-12 pb-4 px-4 bg-background">
          <div className="flex items-center justify-between">
            <button
              onClick={() => exitQuiz()}
              className="w-10 h-10 rounded-xl bg-[var(--secondary)] flex items-center justify-center"
            >
              <X className="w-5 h-5 text-[var(--muted-foreground)]" />
            </button>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#8B5CF6]" />
              <span className="font-bold text-foreground">
                Tầng {activeFloor}/{totalFloors}
              </span>
            </div>
            {!claimedFloors.includes(activeFloor) ? (
              <div className="flex items-center gap-1 text-[var(--duo-blue)]">
                <img
                  src="/AppAssets/BlueDiamond.png"
                  alt="gem"
                  className="w-5 h-5"
                />
                <span className="font-bold">
                  +{getFloorReward(activeFloor)}
                </span>
              </div>
            ) : (
              <div className="w-10" />
            )}
          </div>
        </div>

        <div className="px-4 pt-24 pb-32">
          <h2 className="text-lg font-bold text-foreground mb-5 leading-relaxed">
            {currentQuestion.question}
          </h2>

          <div className="space-y-2.5">
            {currentQuestion.options.map((option) => {
              const isSelected = pendingAnswer === option.id;
              const isAnsweredSelected = selectedAnswer === option.id;
              const isCorrectOption =
                option.id === currentQuestion.correctAnswer;
              // Chỉ hiện correct nếu người dùng chọn đúng
              const showCorrect = isAnswered && isCorrectOption && isCorrect;
              // Hiện wrong nếu người dùng chọn sai
              const showWrong =
                isAnswered && isAnsweredSelected && !isCorrectOption;

              return (
                <button
                  key={option.id}
                  onClick={() => !isAnswered && setPendingAnswer(option.id)}
                  disabled={isAnswered}
                  className={cn(
                    "option-btn w-full p-3 text-left flex items-center gap-3",
                    isSelected && !isAnswered && "selected",
                    showCorrect && "correct",
                    showWrong && "wrong"
                  )}
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0",
                      showCorrect && "bg-[var(--duo-green)] text-white",
                      showWrong && "bg-[var(--duo-red)] text-white",
                      !isAnswered &&
                        !isSelected &&
                        "bg-[var(--secondary)] text-[var(--muted-foreground)]",
                      isSelected &&
                        !isAnswered &&
                        "bg-[var(--duo-blue)] text-white"
                    )}
                  >
                    {showCorrect ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : showWrong ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      option.id
                    )}
                  </div>
                  <span className="flex-1 text-sm text-foreground">
                    {option.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          className={cn(
            "fixed bottom-0 left-0 right-0 z-40 safe-bottom",
            isAnswered
              ? isCorrect
                ? "bg-[#d7ffb8]"
                : "bg-[#ffdfe0]"
              : "bg-[var(--card)] border-t-2 border-[var(--border)]"
          )}
        >
          {isAnswered ? (
            <div className="px-4 pt-4 pb-6">
              <div className="flex items-center gap-4 mb-4">
                {isCorrect ? (
                  <CheckCircle2 className="w-10 h-10 text-[var(--duo-green)]" />
                ) : (
                  <XCircle className="w-10 h-10 text-[var(--duo-red)]" />
                )}
                <div className="flex-1">
                  <p
                    className={cn(
                      "font-bold text-xl",
                      isCorrect
                        ? "text-[var(--duo-green)]"
                        : "text-[var(--duo-red)]"
                    )}
                  >
                    {isCorrect ? "Chính xác!" : "Sai mất rồi!"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleContinue}
                className={cn(
                  "btn-3d w-full py-3.5 text-base flex items-center justify-center gap-2",
                  isCorrect ? "btn-3d-green" : "btn-3d-orange"
                )}
              >
                {isCorrect ? (
                  claimedFloors.includes(activeFloor) ? (
                    "TIẾP TỤC"
                  ) : (
                    <>
                      <img
                        src="/AppAssets/BlueDiamond.png"
                        alt="gem"
                        className="w-5 h-5"
                      />
                      NHẬN +{getFloorReward(activeFloor)}
                    </>
                  )
                ) : (
                  "RỚT THÁP"
                )}
              </button>
            </div>
          ) : (
            <div className="px-4 pt-4 pb-6">
              <button
                onClick={handleCheckAnswer}
                disabled={!pendingAnswer}
                className={cn(
                  "btn-3d w-full py-3.5 text-base",
                  pendingAnswer
                    ? "btn-3d-green"
                    : "bg-[var(--secondary)] text-[var(--muted-foreground)] cursor-not-allowed shadow-[0_5px_0_var(--border)]"
                )}
              >
                KIỂM TRA
              </button>
            </div>
          )}
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

  // Tower floor selection screen
  const totalClaimed = claimedFloors.length;

  return (
    <Page className="bg-background min-h-screen">
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
          <div className="flex items-center gap-1.5 bg-white/20 rounded-xl px-3 py-1.5">
            <Clock className="w-4 h-4 text-white" />
            <span className="text-white text-xs font-medium">{countdown}</span>
          </div>
        </div>
      </div>

      <div className="px-4 pt-36 pb-28">
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
          <div className="mt-3 h-2 bg-[var(--secondary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] transition-all"
              style={{ width: `${(highestFloor / totalFloors) * 100}%` }}
            />
          </div>
        </div>

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

        <div className="space-y-2">
          {Array.from({ length: totalFloors }, (_, i) => totalFloors - i).map(
            (floor) => {
              const isUnlocked = floor <= currentFloor;
              const isCompleted = floor <= highestFloor;
              const isClaimed = claimedFloors.includes(floor);
              const isCurrent = floor === currentFloor;
              const reward = getFloorReward(floor);
              const isMilestone =
                floor % 100 === 0 || floor % 50 === 0 || floor % 10 === 0;
              const isLegendary = floor === totalFloors;

              return (
                <div
                  key={floor}
                  ref={isCurrent ? currentFloorRef : null}
                  className={cn(
                    "card-3d p-3 flex items-center gap-3",
                    isLegendary && "border-2 border-[var(--duo-yellow)]",
                    isCurrent && !isLegendary && "border-2 border-[#8B5CF6]",
                    isCompleted &&
                      !isCurrent &&
                      !isLegendary &&
                      "border-2 border-[var(--duo-green)]",
                    !isUnlocked && "opacity-50"
                  )}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                      isLegendary &&
                        "bg-gradient-to-br from-[var(--duo-yellow)] to-[var(--duo-orange)]",
                      isMilestone &&
                        !isLegendary &&
                        "bg-gradient-to-br from-[#8B5CF6] to-[#A855F7]",
                      isCompleted &&
                        !isMilestone &&
                        !isLegendary &&
                        "bg-[var(--duo-green)]",
                      !isCompleted &&
                        !isMilestone &&
                        !isLegendary &&
                        "bg-[var(--secondary)]"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-6 h-6 text-white" />
                    ) : (
                      <span
                        className={cn(
                          "font-bold",
                          isMilestone || isLegendary
                            ? "text-white"
                            : "text-foreground"
                        )}
                      >
                        {floor}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "font-bold",
                          isCurrent ? "text-[#8B5CF6]" : "text-foreground"
                        )}
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
                            className={cn(
                              "font-bold",
                              isLegendary
                                ? "text-[var(--duo-yellow)]"
                                : "text-[var(--duo-blue)]"
                            )}
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

                  {isUnlocked && isCurrent ? (
                    <button
                      onClick={() => startFloor(floor)}
                      className="btn-3d btn-3d-purple px-4 py-2 text-sm flex items-center gap-1"
                    >
                      <Play className="w-4 h-4" />
                      Vào
                    </button>
                  ) : isClaimed ? (
                    <div className="w-10 h-10 rounded-full bg-[var(--duo-green)] flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
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
                <li className="text-[#8B5CF6] font-medium">
                  • Reset về tầng 1 mỗi thứ 2 hàng tuần
                </li>
              </ul>
            </div>
          </div>
        </div>

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
