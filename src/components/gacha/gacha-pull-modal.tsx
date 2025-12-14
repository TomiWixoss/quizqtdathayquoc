import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Star } from "lucide-react";
import type { GachaPullResult } from "@/types/gacha";
import {
  getScarcityName,
  getScarcityColor,
  getFullImage,
  hasCardVideo,
} from "@/services/gacha-service";

interface GachaPullModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: GachaPullResult[];
  isLoading: boolean;
  skipLoading?: boolean; // Skip loading animation (for exchange)
}

// Get highest scarcity in results
function getHighestScarcity(results: GachaPullResult[]): number {
  return Math.max(...results.map((r) => r.cardScarcity));
}

// Sparkle particles effect
function SparkleParticles({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{
            x: "50%",
            y: "50%",
            scale: 0,
            opacity: 1,
          }}
          animate={{
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
            scale: [0, 1.5, 0],
            opacity: [1, 1, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2,
            delay: i * 0.03,
            ease: "easeOut",
          }}
        >
          <Star className="w-3 h-3" style={{ color }} fill={color} />
        </motion.div>
      ))}
    </div>
  );
}

// Ring burst effect
function RingBurst({ color }: { color: string }) {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border-4 pointer-events-none"
          style={{ borderColor: color }}
          initial={{ scale: 0.5, opacity: 0.8 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{
            duration: 1.2,
            delay: i * 0.15,
            ease: "easeOut",
          }}
        />
      ))}
    </>
  );
}

export function GachaPullModal({
  isOpen,
  onClose,
  results,
  isLoading,
  skipLoading = false,
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
    // Skip loading for exchange - go directly to reveal
    if (isOpen && skipLoading && results.length > 0 && !isLoading) {
      setRevealPhase("reveal");
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

        {/* Loading Animation - Smooth, không chớp */}
        {revealPhase === "loading" && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            {/* Smooth spinning animation */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* Outer glow - smooth pulse */}
              <div
                className="absolute inset-0 rounded-full animate-pulse"
                style={{
                  background: `radial-gradient(circle, ${getScarcityColor(
                    highestScarcity
                  )}30 0%, transparent 70%)`,
                }}
              />
              {/* Spinning ring - smooth rotation */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-32 h-32 rounded-full border-4"
                style={{
                  borderColor: `${getScarcityColor(highestScarcity)}`,
                  borderTopColor: "transparent",
                  borderRightColor: `${getScarcityColor(highestScarcity)}60`,
                }}
              />
              {/* Center star - gentle pulse */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
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
            {/* Scarcity hint - smooth fade */}
            {(highestScarcity === 40 || highestScarcity === 30) && (
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="mt-2 text-sm font-bold"
                style={{ color: getScarcityColor(highestScarcity) }}
              >
                {highestScarcity === 40 && "Có thẻ UR!"}
                {highestScarcity === 30 && "Có thẻ SR!"}
              </motion.p>
            )}
          </motion.div>
        )}

        {/* Single Card Reveal with Flip Effect */}
        {revealPhase === "reveal" && currentResult && !showAll && (
          <motion.div
            key={currentIndex}
            className="flex flex-col items-center px-4 perspective-1000"
            onClick={handleNext}
          >
            {/* Sparkle particles effect */}
            <SparkleParticles
              color={getScarcityColor(currentResult.cardScarcity)}
            />

            {/* Ring burst for SR/UR */}
            {(isUR || currentResult.cardScarcity === 30) && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <RingBurst
                  color={getScarcityColor(currentResult.cardScarcity)}
                />
              </div>
            )}

            {/* Glow effect - bigger for UR */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: isUR ? 0.9 : 0.6, scale: 1 }}
              transition={{ duration: 0.5 }}
              className={`absolute rounded-full blur-3xl ${
                isUR ? "w-[400px] h-[400px]" : "w-80 h-80"
              }`}
              style={{
                backgroundColor:
                  getScarcityColor(currentResult.cardScarcity) +
                  (isUR ? "70" : "50"),
              }}
            />

            {/* Flip Card Container */}
            <motion.div
              initial={{ rotateY: 180, scale: 0.8 }}
              animate={{ rotateY: 0, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 15,
                duration: 0.8,
              }}
              className={`relative rounded-2xl overflow-hidden border-4 shadow-2xl max-w-[280px] min-h-[300px] bg-gradient-to-b from-gray-800 to-gray-900 ${
                isUR
                  ? "ring-4 ring-yellow-400/60 ring-offset-2 ring-offset-black animate-pulse"
                  : currentResult.cardScarcity === 30
                  ? "ring-2 ring-purple-400/50"
                  : ""
              }`}
              style={{
                borderColor: getScarcityColor(currentResult.cardScarcity),
                aspectRatio:
                  currentResult.width && currentResult.height
                    ? currentResult.width / currentResult.height
                    : 2 / 3,
                transformStyle: "preserve-3d",
                boxShadow: `0 0 ${isUR ? "60px" : "30px"} ${getScarcityColor(
                  currentResult.cardScarcity
                )}${isUR ? "80" : "50"}`,
              }}
            >
              {/* Shine overlay effect */}
              <motion.div
                className="absolute inset-0 z-20 pointer-events-none"
                initial={{ x: "-100%", opacity: 0 }}
                animate={{ x: "200%", opacity: [0, 0.5, 0] }}
                transition={{ duration: 1, delay: 0.3 }}
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                  transform: "skewX(-20deg)",
                }}
              />

              {hasCardVideo(currentResult.videoList) &&
              !videoErrors[currentIndex] ? (
                <video
                  key={currentResult.videoList![1]}
                  className="w-full h-full object-contain"
                  autoPlay
                  loop
                  muted
                  playsInline
                  poster={getFullImage(currentResult.cardImg, 400)}
                  onError={() =>
                    setVideoErrors((prev) => ({
                      ...prev,
                      [currentIndex]: true,
                    }))
                  }
                >
                  <source src={currentResult.videoList![1]} type="video/mp4" />
                </video>
              ) : (
                <img
                  src={getFullImage(currentResult.cardImg, 400)}
                  alt=""
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  loading="eager"
                  decoding="sync"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src.includes("@")) {
                      target.src = currentResult.cardImg;
                    }
                  }}
                />
              )}

              {/* NEW badge with bounce */}
              {currentResult.isNew && (
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", delay: 0.5 }}
                  className="absolute top-2 left-2 px-3 py-1 bg-[var(--duo-green)] text-white text-xs font-bold rounded-full shadow-lg"
                >
                  MỚI!
                </motion.div>
              )}

              {/* Shards if duplicate */}
              {currentResult.shardsGained > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute top-2 right-2 px-2 py-1 bg-purple-500 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg"
                >
                  <img
                    src="/IconPack/Currency/Crystal/256w/Crystal Blue 256px.png"
                    className="w-4 h-4"
                  />
                  +{currentResult.shardsGained}
                </motion.div>
              )}
            </motion.div>

            {/* Scarcity label with entrance animation */}
            <motion.div
              initial={{ y: 30, opacity: 0, scale: 0.8 }}
              animate={{
                y: 0,
                opacity: 1,
                scale: 1,
              }}
              transition={{
                delay: 0.4,
                type: "spring",
                stiffness: 200,
              }}
              className="mt-5 flex items-center gap-2"
            >
              <motion.div
                animate={isUR ? { rotate: [0, 360] } : {}}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Star
                  className={isUR ? "w-8 h-8" : "w-6 h-6"}
                  style={{
                    color: getScarcityColor(currentResult.cardScarcity),
                  }}
                  fill={getScarcityColor(currentResult.cardScarcity)}
                />
              </motion.div>
              <motion.span
                animate={isUR ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
                className={`font-bold ${isUR ? "text-3xl" : "text-2xl"}`}
                style={{ color: getScarcityColor(currentResult.cardScarcity) }}
              >
                {getScarcityName(currentResult.cardScarcity)}
              </motion.span>
              {isUR && (
                <motion.div
                  animate={{ rotate: [0, -360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Star
                    className="w-8 h-8"
                    style={{
                      color: getScarcityColor(currentResult.cardScarcity),
                    }}
                    fill={getScarcityColor(currentResult.cardScarcity)}
                  />
                </motion.div>
              )}
            </motion.div>

            {/* Tap hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-white/70 mt-4 text-sm"
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
            {/* Header - fixed, thêm padding top để tránh app bar */}
            <h2 className="text-white text-xl font-bold text-center pt-16 pb-4 flex items-center justify-center gap-2 flex-shrink-0">
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
