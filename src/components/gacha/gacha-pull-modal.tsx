import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Star } from "lucide-react";
import type { GachaPullResult } from "@/types/gacha";
import {
  getScarcityName,
  getScarcityColor,
  getFullImage,
} from "@/services/gacha-service";

interface GachaPullModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: GachaPullResult[];
  isLoading: boolean;
}

export function GachaPullModal({
  isOpen,
  onClose,
  results,
  isLoading,
}: GachaPullModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [revealPhase, setRevealPhase] = useState<"loading" | "reveal" | "done">(
    "loading"
  );
  const [videoErrors, setVideoErrors] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (isOpen && results.length > 0 && !isLoading) {
      setRevealPhase("reveal");
      setCurrentIndex(0);
      setShowAll(false);
      setVideoErrors({});
    } else if (isLoading) {
      setRevealPhase("loading");
    }
  }, [isOpen, results, isLoading]);

  const handleNext = () => {
    if (currentIndex < results.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowAll(true);
      setRevealPhase("done");
    }
  };

  const handleSkip = () => {
    setShowAll(true);
    setRevealPhase("done");
  };

  if (!isOpen) return null;

  const currentResult = results[currentIndex];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button - hide when showing results (has its own close button) */}
        {!showAll && (
          <button
            onClick={onClose}
            className="absolute top-12 right-4 p-2 rounded-full bg-white/10 z-10"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        )}

        {/* Loading Animation */}
        {revealPhase === "loading" && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-32 h-32 rounded-full border-4 border-t-[var(--duo-purple)] border-r-[var(--duo-blue)] border-b-[var(--duo-green)] border-l-[var(--duo-yellow)]"
            />
            <p className="text-white mt-4 text-lg">Đang quay...</p>
          </motion.div>
        )}

        {/* Single Card Reveal */}
        {revealPhase === "reveal" && currentResult && !showAll && (
          <motion.div
            key={currentIndex}
            initial={{ scale: 0, rotateY: 180 }}
            animate={{ scale: 1, rotateY: 0 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="flex flex-col items-center px-4"
            onClick={handleNext}
          >
            {/* Glow effect */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 0.5], scale: [0.5, 1.2, 1] }}
              transition={{ duration: 0.5 }}
              className="absolute w-80 h-80 rounded-full blur-3xl"
              style={{
                backgroundColor:
                  getScarcityColor(currentResult.cardScarcity) + "40",
              }}
            />

            {/* Card */}
            <div
              className="relative rounded-2xl overflow-hidden border-4 shadow-2xl max-w-[280px] min-h-[300px] bg-black/50"
              style={{
                borderColor: getScarcityColor(currentResult.cardScarcity),
                aspectRatio:
                  currentResult.width && currentResult.height
                    ? currentResult.width / currentResult.height
                    : 2 / 3,
              }}
            >
              {currentResult.videoList &&
              currentResult.videoList.length > 1 &&
              !videoErrors[currentIndex] ? (
                <video
                  className="w-full h-full object-contain"
                  autoPlay
                  loop
                  muted
                  playsInline
                  src={currentResult.videoList[1]}
                  onError={() =>
                    setVideoErrors((prev) => ({
                      ...prev,
                      [currentIndex]: true,
                    }))
                  }
                />
              ) : (
                <img
                  src={getFullImage(currentResult.cardImg, 400)}
                  alt=""
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    // Fallback: try without webp transform
                    const target = e.target as HTMLImageElement;
                    if (target.src.includes("@")) {
                      target.src = currentResult.cardImg;
                    }
                  }}
                />
              )}

              {/* NEW badge */}
              {currentResult.isNew && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 left-2 px-3 py-1 bg-[var(--duo-green)] text-white text-xs font-bold rounded-full"
                >
                  MỚI!
                </motion.div>
              )}

              {/* Shards if duplicate */}
              {currentResult.shardsGained > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 px-2 py-1 bg-purple-500 text-white text-xs font-bold rounded-full flex items-center gap-1"
                >
                  <img
                    src="/IconPack/Currency/Crystal/256w/Crystal Blue 256px.png"
                    className="w-4 h-4"
                  />
                  +{currentResult.shardsGained}
                </motion.div>
              )}
            </div>

            {/* Scarcity label */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 flex items-center gap-2"
            >
              <Star
                className="w-6 h-6"
                style={{ color: getScarcityColor(currentResult.cardScarcity) }}
                fill={getScarcityColor(currentResult.cardScarcity)}
              />
              <span
                className="text-2xl font-bold"
                style={{ color: getScarcityColor(currentResult.cardScarcity) }}
              >
                {getScarcityName(currentResult.cardScarcity)}
              </span>
            </motion.div>

            {/* Tap hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-white/60 mt-4 text-sm"
            >
              Chạm để tiếp tục ({currentIndex + 1}/{results.length})
            </motion.p>

            {/* Skip button */}
            {results.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSkip();
                }}
                className="mt-4 px-4 py-2 bg-white/10 rounded-xl text-white text-sm"
              >
                Bỏ qua
              </button>
            )}
          </motion.div>
        )}

        {/* Show All Results */}
        {showAll && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full h-full flex flex-col"
          >
            {/* Header - fixed */}
            <h2 className="text-white text-xl font-bold text-center py-4 flex items-center justify-center gap-2 flex-shrink-0">
              <Sparkles className="w-6 h-6 text-[var(--duo-yellow)]" />
              Kết quả ({results.length} thẻ)
            </h2>

            {/* Scrollable cards area */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
                {results.map((result, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative aspect-[2/3] rounded-xl overflow-hidden border-2"
                    style={{
                      borderColor: getScarcityColor(result.cardScarcity),
                    }}
                  >
                    <img
                      src={getFullImage(result.cardImg, 200)}
                      alt=""
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src.includes("@")) {
                          target.src = result.cardImg;
                        }
                      }}
                    />
                    {result.isNew && (
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-[var(--duo-green)] text-white text-[10px] font-bold rounded">
                        MỚI
                      </div>
                    )}
                    {result.shardsGained > 0 && (
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-purple-500 text-white text-[10px] font-bold rounded flex items-center gap-0.5">
                        <img
                          src="/IconPack/Currency/Crystal/256w/Crystal Blue 256px.png"
                          className="w-3 h-3"
                        />
                        +{result.shardsGained}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Fixed button at bottom */}
            <div className="flex-shrink-0 p-4 bg-black/50">
              <button
                onClick={onClose}
                className="w-full max-w-md mx-auto block btn-3d btn-3d-purple py-3"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
