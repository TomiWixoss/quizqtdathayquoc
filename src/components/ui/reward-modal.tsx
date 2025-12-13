import { Gift } from "lucide-react";
import { CustomModal } from "./custom-modal";

export interface RewardItem {
  type: "gems" | "xp" | "exp" | "hearts" | "shard" | "custom";
  amount: number;
  icon?: string; // Custom icon path
  label?: string; // Custom label
}

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  rewards: RewardItem[];
  buttonText?: string;
  gradientFrom?: string;
  gradientTo?: string;
}

export function RewardModal({
  isOpen,
  onClose,
  title = "Nhận quà thành công!",
  subtitle,
  rewards,
  buttonText = "Tuyệt vời!",
  gradientFrom = "var(--duo-green)",
  gradientTo = "var(--duo-blue)",
}: RewardModalProps) {
  if (!isOpen) return null;

  const getRewardIcon = (reward: RewardItem) => {
    if (reward.icon) return reward.icon;
    switch (reward.type) {
      case "gems":
        return "/AppAssets/BlueDiamond.png";
      case "xp":
      case "exp":
        return "/AppAssets/Lighting.png";
      case "hearts":
        return "/AppAssets/Heart.png";
      case "shard":
        return "/AppAssets/Shard.png";
      default:
        return "/AppAssets/BlueDiamond.png";
    }
  };

  const getRewardLabel = (reward: RewardItem) => {
    if (reward.label) return reward.label;
    switch (reward.type) {
      case "gems":
        return "Gems";
      case "xp":
      case "exp":
        return "XP";
      case "hearts":
        return "Tim";
      case "shard":
        return "Mảnh";
      default:
        return "";
    }
  };

  return (
    <CustomModal isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      <div className="text-center">
        {/* Gift icon */}
        <div
          className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
          }}
        >
          <Gift className="w-10 h-10 text-white" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold mb-2" style={{ color: gradientFrom }}>
          {title}
        </h2>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-[var(--muted-foreground)] mb-4">{subtitle}</p>
        )}

        {/* Rewards */}
        <div className="bg-[var(--secondary)] rounded-2xl p-4 mb-4 space-y-3">
          {rewards.map((reward, index) => (
            <div key={index} className="flex items-center justify-center gap-2">
              <img
                src={getRewardIcon(reward)}
                alt={reward.type}
                className="w-10 h-10"
              />
              <span className="text-3xl font-bold text-[var(--duo-blue)]">
                +{reward.amount}
              </span>
              {getRewardLabel(reward) && (
                <span className="text-sm text-[var(--muted-foreground)]">
                  {getRewardLabel(reward)}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Button */}
        <button onClick={onClose} className="btn-3d btn-3d-green w-full py-3">
          {buttonText}
        </button>
      </div>
    </CustomModal>
  );
}
