import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Star } from "lucide-react";
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

// Get highest scarcity in results
function getHighestScarcity(results: GachaPullResult[]): number {
  return Math.max(...results.map((r) => r.cardScarcity));
}

// Golden particles for UR
function GoldenParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-yellow-400 rounded-full"
          initial={{
            x: "50%",
            y: "50%",
            scale: 0,
            opacity: 1,
          }}
          animate={{
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
            scale: [0, 1, 0],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 1.5,
            delay: i * 0.05,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
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
  const [canSkipLoading, setCanSkipLoading] = useState(false);
  const [minLoadingDone, setMinLoadingDone] = useState(false);
  const [loadingStarted, setLoadingStarted] = useState(false);

  // Reset states when modal opens with loading
  useEffect(() => {
    if (isOpen && isLoading) {
      setRevealPhase("loading");
      setMinLoadingDone(false);
      setCanSkipLoading(false);
      setLoadingStarted(true);
      setShowAll(false);
      setCurrentIndex(0);
      setVideoErrors({});
    }
  }, [isOpen, isLoading]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setRevealPhase("loading");
      setMinLoadingDone(false);
      setCanSkipLoading(false);
      setLoadingStarted(false);
      setShowAll(false);
      setCurrentIndex(0);
      setVideoErrors({});
    }
  }, [isOpen]);

  // Minimum loading time of 2 seconds
  useEffect(() => {
    if (loadingStarted && revealPhase === "loading") {
      // Show skip button after 1 second
      const skipTimer = setTimeout(() => setCanSkipLoading(true), 1000);
      // Minimum loading time 2 seconds
      const minTimer = setTimeout(() => setMinLoadingDone(true), 2000);

      return () => {
        clearTimeout(skipTimer);
        clearTimeout(minTimer);
      };
    }
  }, [loadingStarted, revealPhase]);

  // Transition to reveal phase when loading done AND min time passed
  useEffect(() => {
    if (
      isOpen &&
      results.length > 0 &&
      !isLoading &&
      minLoadingDone &&
      revealPhase === "loading"
    ) {
      setRevealPhase("reveal");
    }
  }, [isOpen, results, isLoading, minLoadingDone, revealPhase]);

  const handleSkipLoading = () => {
    setMinLoadingDone(true);
  };

  const handleNext = () => {
    if (currentIndex < results.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowAll(true);
      setRevealPhase("done");
    }
  };

  const handleSkip = () => {
    // Find next NEW UR card (scarcity 40 and isNew) after current index
    const nextNewURIndex = results.findIndex(
      (r, idx) => idx > currentIndex && r.cardScarcity === 40 && r.isNew
    );

    if (nextNewURIndex !== -1) {
      // Jump to the new UR card
      setCurrentIndex(nextNewURIndex);
    } else {
      // No more new UR cards, show all results
      setShowAll(true);
      setRevealPhase("done");
    }
  };

  if (!isOpen) return null;

  const currentResult = results[currentIndex];
  const isUR = currentResult?.cardScarcity === 40;
  const highestScarcity = results.length > 0 ? getHighestScarcity(results) : 10;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Skip button for loading phase */}
        {revealPhase === "loading" && canSkipLoading && !isLoading && (
          <button
            onClick={handleSkipLoading}
            className="absolute top-20 right-4 px-4 py-2 rounded-xl bg-white/10 z-10 text-white text-sm font-medium"
          >
            Bỏ qua
          </button>
        )}

        {/* Skip button for reveal phase */}
        {revealPhase === "reveal" && results.length > 1 && (
          <button
            onClick={handleSkip}
            className="absolute top-20 right-4 px-4 py-2 rounded-xl bg-white/10 z-10 text-white text-sm font-medium"
          >
            Bỏ qua
          </button>
        )}

        {/* Loading Animation - Genshin style with scarcity hint */}
        {revealPhase === "loading" && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            {/* Meteor/shooting star effect based on highest scarcity */}
            <div className="relative">
              {/* Outer glow ring */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 w-40 h-40 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${getScarcityColor(
                    highestScarcity
                  )}40 0%, transparent 70%)`,
                }}
              />
              {/* Spinning ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-32 h-32 rounded-full border-4"
                style={{
                  borderColor: `${getScarcityColor(highestScarcity)}`,
                  borderTopColor: "transparent",
                  borderRightColor: `${getScarcityColor(highestScarcity)}80`,
                }}
              />
              {/* Center star */}
              <motion.div
                animate={{ scale: [0.8, 1.2, 0.8], rotate: [0, 180, 360] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Star
                  className="w-10 h-10"
                  style={{ color: getScarcityColor(highestScarcity) }}
                  fill={getScarcityColor(highestScarcity)}
                />
              </motion.div>
            </div>
            <p className="text-white mt-6 text-lg">Đang quay...</p>
            {/* Scarcity hint text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              className="mt-2 text-sm font-bold"
              style={{ color: getScarcityColor(highestScarcity) }}
            >
              {highestScarcity === 40 && "Có thẻ UR!"}
              {highestScarcity === 30 && "Có thẻ SR!"}
            </motion.p>
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
            {/* UR Golden explosion effect */}
            {isUR && <GoldenParticles />}

            {/* Glow effect - bigger for UR */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: isUR ? [0, 1, 0.8] : [0, 1, 0.5],
                scale: isUR ? [0.5, 1.5, 1.2] : [0.5, 1.2, 1],
              }}
              transition={{ duration: isUR ? 0.8 : 0.5 }}
              className={`absolute rounded-full blur-3xl ${
                isUR ? "w-96 h-96" : "w-80 h-80"
              }`}
              style={{
                backgroundColor:
                  getScarcityColor(currentResult.cardScarcity) +
                  (isUR ? "60" : "40"),
              }}
            />

            {/* Card */}
            <div
              className={`relative rounded-2xl overflow-hidden border-4 shadow-2xl max-w-[280px] min-h-[300px] bg-black/50 ${
                isUR
                  ? "ring-4 ring-yellow-400/50 ring-offset-2 ring-offset-black"
                  : ""
              }`}
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

            {/* Scarcity label - animated for UR */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{
                y: 0,
                opacity: 1,
                scale: isUR ? [1, 1.1, 1] : 1,
              }}
              transition={{
                delay: 0.3,
                scale: { duration: 0.5, repeat: isUR ? Infinity : 0 },
              }}
              className="mt-4 flex items-center gap-2"
            >
              <Star
                className={isUR ? "w-8 h-8" : "w-6 h-6"}
                style={{ color: getScarcityColor(currentResult.cardScarcity) }}
                fill={getScarcityColor(currentResult.cardScarcity)}
              />
              <span
                className={`font-bold ${isUR ? "text-3xl" : "text-2xl"}`}
                style={{ color: getScarcityColor(currentResult.cardScarcity) }}
              >
                {getScarcityName(currentResult.cardScarcity)}
              </span>
              {isUR && (
                <Star
                  className="w-8 h-8"
                  style={{
                    color: getScarcityColor(currentResult.cardScarcity),
                  }}
                  fill={getScarcityColor(currentResult.cardScarcity)}
                />
              )}
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
                    className={`relative aspect-[2/3] rounded-xl overflow-hidden border-2 ${
                      result.cardScarcity === 40
                        ? "ring-2 ring-yellow-400/50"
                        : ""
                    }`}
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
