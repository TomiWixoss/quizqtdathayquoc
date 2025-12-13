import { X } from "lucide-react";
import { ReactNode, useState } from "react";

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  showCloseButton?: boolean;
}

export function CustomModal({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
}: CustomModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-[var(--card)] rounded-3xl p-6 mx-4 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[var(--secondary)] flex items-center justify-center"
          >
            <X className="w-4 h-4 text-[var(--muted-foreground)]" />
          </button>
        )}
        {title && (
          <h2 className="font-bold text-xl text-foreground text-center mb-4">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}

interface NoHeartsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBuyHearts: () => void;
  onGoToShop: () => void;
  userGems: number;
  heartCost: number;
}

export function NoHeartsModal({
  isOpen,
  onClose,
  onBuyHearts,
  onGoToShop,
  userGems,
  heartCost,
}: NoHeartsModalProps) {
  const [showNotEnoughGems, setShowNotEnoughGems] = useState(false);
  const canAfford = userGems >= heartCost;

  const handleBuyClick = () => {
    if (canAfford) {
      onBuyHearts();
    } else {
      setShowNotEnoughGems(true);
    }
  };

  const handleClose = () => {
    setShowNotEnoughGems(false);
    onClose();
  };

  if (showNotEnoughGems) {
    return (
      <CustomModal isOpen={isOpen} onClose={handleClose}>
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--duo-blue)]/20 flex items-center justify-center">
            <img
              src="/AppAssets/BlueDiamond.png"
              alt="gem"
              className="w-12 h-12 grayscale opacity-50"
            />
          </div>
          <h2 className="font-bold text-xl text-foreground mb-2">
            Không đủ Gems!
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Bạn cần thêm gems để mua tim.
          </p>
          <div className="bg-[var(--secondary)] rounded-xl p-3 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[var(--muted-foreground)]">
                Cần
              </span>
              <div className="flex items-center gap-1">
                <img
                  src="/AppAssets/BlueDiamond.png"
                  alt="gem"
                  className="w-4 h-4"
                />
                <span className="font-bold text-foreground">{heartCost}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[var(--muted-foreground)]">
                Hiện có
              </span>
              <div className="flex items-center gap-1">
                <img
                  src="/AppAssets/BlueDiamond.png"
                  alt="gem"
                  className="w-4 h-4"
                />
                <span className="font-bold text-[var(--duo-blue)]">
                  {userGems}
                </span>
              </div>
            </div>
            <div className="border-t border-[var(--border)] pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--duo-red)]">Thiếu</span>
                <div className="flex items-center gap-1">
                  <img
                    src="/AppAssets/BlueDiamond.png"
                    alt="gem"
                    className="w-4 h-4"
                  />
                  <span className="font-bold text-[var(--duo-red)]">
                    {heartCost - userGems}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => {
                setShowNotEnoughGems(false);
                onGoToShop();
              }}
              className="w-full py-3 px-4 rounded-xl font-bold text-white flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #1cb0f6 0%, #1899d6 100%)",
                boxShadow: "0 4px 0 #1682c4",
              }}
            >
              <img
                src="/AppAssets/BlueDiamond.png"
                alt="gem"
                className="w-5 h-5"
              />
              <span>Kiếm thêm Gems</span>
            </button>
            <button
              onClick={() => setShowNotEnoughGems(false)}
              className="w-full py-3 px-4 rounded-xl font-bold text-[var(--muted-foreground)] bg-[var(--secondary)]"
            >
              Quay lại
            </button>
          </div>
        </div>
      </CustomModal>
    );
  }

  return (
    <CustomModal isOpen={isOpen} onClose={handleClose}>
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--duo-red)]/20 flex items-center justify-center">
          <img
            src="/AppAssets/Heart.png"
            alt="heart"
            className="w-12 h-12 grayscale opacity-50"
          />
        </div>
        <h2 className="font-bold text-xl text-foreground mb-2">Hết tim rồi!</h2>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Bạn cần tim để tiếp tục chơi. Hãy chờ hồi phục hoặc dùng gems để mua
          thêm.
        </p>

        {/* Hiển thị gems hiện tại */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-sm text-[var(--muted-foreground)]">
            Gems hiện có:
          </span>
          <div className="flex items-center gap-1">
            <img
              src="/AppAssets/BlueDiamond.png"
              alt="gem"
              className="w-5 h-5"
            />
            <span className="font-bold text-[var(--duo-blue)]">{userGems}</span>
          </div>
        </div>

        {/* Gợi ý cày gems */}
        <div className="bg-[var(--duo-blue)]/10 rounded-xl p-3 mb-4">
          <p className="text-xs text-[var(--duo-blue)] font-semibold">
            Vào <span className="font-bold">Luyện tập</span> hoặc{" "}
            <span className="font-bold">Chinh chiến</span> để cày gems mà hồi
            tim nhé!
          </p>
        </div>

        <div className="space-y-3">
          {canAfford && (
            <button
              onClick={handleBuyClick}
              className="w-full py-3 px-4 rounded-xl font-bold text-white flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #58cc02 0%, #46a302 100%)",
                boxShadow: "0 4px 0 #3d8c02",
              }}
            >
              <img src="/AppAssets/Heart.png" alt="heart" className="w-5 h-5" />
              <span>Hồi đầy tim</span>
              <div className="flex items-center gap-1 ml-2 bg-white/20 px-2 py-0.5 rounded-full">
                <img
                  src="/AppAssets/BlueDiamond.png"
                  alt="gem"
                  className="w-4 h-4"
                />
                <span>{heartCost}</span>
              </div>
            </button>
          )}
          {!canAfford && (
            <button
              onClick={onGoToShop}
              className="w-full py-3 px-4 rounded-xl font-bold text-white flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #1cb0f6 0%, #1899d6 100%)",
                boxShadow: "0 4px 0 #1682c4",
              }}
            >
              <img
                src="/AppAssets/BlueDiamond.png"
                alt="gem"
                className="w-5 h-5"
              />
              <span>Kiếm thêm Gems</span>
            </button>
          )}
          <button
            onClick={handleClose}
            className="w-full py-3 px-4 rounded-xl font-bold text-[var(--muted-foreground)] bg-[var(--secondary)]"
          >
            Chờ hồi phục
          </button>
        </div>
        <p className="text-xs text-[var(--muted-foreground)] mt-4">
          Tim tự hồi phục mỗi 30 phút
        </p>
      </div>
    </CustomModal>
  );
}
