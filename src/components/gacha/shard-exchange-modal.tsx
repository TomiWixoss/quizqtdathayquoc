import { useState } from "react";
import { Star, Sparkles, X, Check } from "lucide-react";
import type { GachaCard } from "@/services/gacha-service";
import {
  getScarcityColor,
  getScarcityName,
  getHQImage,
} from "@/services/gacha-service";
import { exchangeShardsForCard } from "@/services/gacha-pull-service";
import { GACHA_CONFIG, type GachaInventory } from "@/types/gacha";
import { formatNumber } from "@/lib/utils";

interface ShardExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionId: number;
  urCards: GachaCard[];
  inventory: GachaInventory | null;
  userId: string;
  onExchangeSuccess: (card: GachaCard) => void;
}

export function ShardExchangeModal({
  isOpen,
  onClose,
  collectionId,
  urCards,
  inventory,
  userId,
  onExchangeSuccess,
}: ShardExchangeModalProps) {
  const [selectedCard, setSelectedCard] = useState<GachaCard | null>(null);
  const [isExchanging, setIsExchanging] = useState(false);

  if (!isOpen) return null;

  const currentShards = inventory?.shards || 0;
  const cost = GACHA_CONFIG.UR_EXCHANGE_COST;
  const canAfford = currentShards >= cost;

  // Filter UR cards not owned
  const availableCards = urCards.filter(
    (card) => !inventory?.cards[collectionId]?.[card.card_img]
  );

  const handleExchange = async () => {
    if (!selectedCard || !canAfford || isExchanging) return;

    setIsExchanging(true);
    const result = await exchangeShardsForCard(
      userId,
      collectionId,
      selectedCard.card_img
    );

    if (result.success) {
      const exchangedCard = selectedCard;
      setSelectedCard(null);
      onClose();
      onExchangeSuccess(exchangedCard);
    } else {
      alert(result.error || "Có lỗi xảy ra!");
    }
    setIsExchanging(false);
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-b from-[var(--card)] to-[var(--background)] rounded-t-[2rem] max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-12 h-1.5 bg-[var(--border)] rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pb-4">
          <div className="flex items-center justify-between mb-1">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--secondary)] border-2 border-[var(--border)] active:scale-95 transition-transform"
            >
              <X className="w-5 h-5 text-[var(--muted-foreground)]" />
            </button>
            <div className="text-center">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--duo-yellow)]" />
                Đổi mảnh lấy thẻ UR
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Chọn thẻ UR bạn muốn sở hữu
              </p>
            </div>
            <button
              onClick={handleExchange}
              disabled={!selectedCard || !canAfford || isExchanging}
              className={`btn-3d px-4 py-2 rounded-xl text-sm font-bold text-white flex items-center gap-1.5 ${
                selectedCard && canAfford
                  ? "btn-3d-yellow"
                  : "btn-3d-gray opacity-60"
              }`}
            >
              <Check className="w-4 h-4" />
              Đổi
            </button>
          </div>
        </div>

        {/* Shards Info */}
        <div className="px-5 pb-4">
          <div className="bg-[var(--secondary)]/50 rounded-2xl p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src="/IconPack/Currency/Crystal/256w/Crystal Blue 256px.png"
                  className="w-8 h-8"
                />
                <div>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Mảnh hiện có
                  </p>
                  <p className="font-bold text-lg">
                    {formatNumber(currentShards)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--muted-foreground)]">
                  Chi phí đổi
                </p>
                <p className="font-bold text-lg text-[var(--duo-yellow)]">
                  {formatNumber(cost)}
                </p>
              </div>
            </div>
            {!canAfford && selectedCard && (
              <p className="text-center text-xs text-[var(--duo-red)] mt-2 pt-2 border-t border-[var(--border)]">
                Không đủ mảnh! Cần thêm {formatNumber(cost - currentShards)}{" "}
                mảnh
              </p>
            )}
          </div>
        </div>

        {/* Cards Grid */}
        <div className="flex-1 overflow-y-auto px-5 pb-8">
          {availableCards.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--secondary)] flex items-center justify-center">
                <Star className="w-10 h-10 text-[var(--duo-yellow)]" />
              </div>
              <p className="text-[var(--muted-foreground)] font-medium">
                Bạn đã sở hữu tất cả thẻ UR!
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Hãy thử bộ sưu tập khác nhé
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {availableCards.map((card, idx) => {
                const isSelected = selectedCard?.card_img === card.card_img;
                const hasVideo = card.video_list && card.video_list.length > 1;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedCard(isSelected ? null : card)}
                    className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all shadow-md hover:shadow-lg ${
                      isSelected
                        ? "ring-2 ring-[var(--duo-yellow)] shadow-[var(--duo-yellow)]/30"
                        : ""
                    }`}
                    style={{
                      borderColor: getScarcityColor(card.card_scarcity),
                    }}
                  >
                    <img
                      src={getHQImage(card.card_img, 200)}
                      alt=""
                      className="w-full h-full object-cover object-top"
                      referrerPolicy="no-referrer"
                    />
                    {hasVideo && (
                      <div className="absolute top-1 right-1 p-1 rounded-full bg-black/50">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div
                      className="absolute bottom-0 left-0 right-0 py-1 text-center text-[10px] font-bold text-white"
                      style={{
                        backgroundColor: getScarcityColor(card.card_scarcity),
                      }}
                    >
                      {getScarcityName(card.card_scarcity)}
                    </div>
                    {isSelected && (
                      <div className="absolute inset-0 bg-[var(--duo-yellow)]/20 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-[var(--duo-yellow)] flex items-center justify-center shadow-lg">
                          <Check className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
