import { useState } from "react";
import { Star, Sparkles, X } from "lucide-react";
import type { GachaCard } from "@/services/gacha-service";
import {
  getScarcityColor,
  getScarcityName,
  getHQImage,
} from "@/services/gacha-service";
import { exchangeShardsForCard } from "@/services/gacha-pull-service";
import { GACHA_CONFIG, type GachaInventory } from "@/types/gacha";

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
      className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-2xl overflow-hidden max-w-md w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--duo-yellow)]" />
              Đổi mảnh lấy thẻ UR
            </h2>
            <div className="flex items-center gap-1 mt-1 text-sm">
              <img
                src="/IconPack/Currency/Crystal/256w/Crystal Blue 256px.png"
                className="w-4 h-4"
              />
              <span className="font-bold">{currentShards}</span>
              <span className="text-[var(--muted-foreground)]">mảnh</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[var(--secondary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {availableCards.length === 0 ? (
            <div className="text-center py-8">
              <Star className="w-12 h-12 mx-auto text-[var(--duo-yellow)] mb-3" />
              <p className="text-[var(--muted-foreground)]">
                Bạn đã sở hữu tất cả thẻ UR!
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-[var(--muted-foreground)] mb-3">
                Chọn thẻ UR muốn đổi ({cost} mảnh/thẻ)
              </p>
              <div className="grid grid-cols-3 gap-2">
                {availableCards.map((card, idx) => {
                  const isSelected = selectedCard?.card_img === card.card_img;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedCard(isSelected ? null : card)}
                      className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${
                        isSelected
                          ? "ring-2 ring-[var(--duo-yellow)] scale-105"
                          : "hover:scale-105"
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
                          <div className="w-8 h-8 rounded-full bg-[var(--duo-yellow)] flex items-center justify-center">
                            <Star className="w-5 h-5 text-white" fill="white" />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {availableCards.length > 0 && (
          <div className="p-4 border-t border-[var(--border)]">
            <button
              onClick={handleExchange}
              disabled={!selectedCard || !canAfford || isExchanging}
              className={`w-full btn-3d py-3 ${
                selectedCard && canAfford
                  ? "btn-3d-yellow"
                  : "btn-3d-gray opacity-60"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <img
                  src="/IconPack/Currency/Crystal/256w/Crystal Blue 256px.png"
                  className="w-5 h-5"
                />
                <span>
                  {isExchanging
                    ? "Đang đổi..."
                    : selectedCard
                    ? `Đổi ${cost} mảnh`
                    : "Chọn thẻ để đổi"}
                </span>
              </div>
            </button>
            {!canAfford && selectedCard && (
              <p className="text-center text-xs text-[var(--duo-red)] mt-2">
                Không đủ mảnh! Cần thêm {cost - currentShards} mảnh
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
