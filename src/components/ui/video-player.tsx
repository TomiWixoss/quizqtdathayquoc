import { useState, useRef, useEffect, useCallback } from "react";
import { getFullImage, getFreshVideoUrl } from "@/services/gacha-service";

interface VideoCardProps {
  videoList?: string[];
  imageUrl: string;
  className?: string;
  imageSize?: number;
  timeout?: number; // Custom timeout in ms
  // For fetching fresh video URL via proxy
  collectionId?: number;
  lotteryId?: number;
}

/**
 * Video card component with automatic fallback to image
 * Handles Bilibili CDN videos which may fail due to hotlink protection
 */
export function VideoCard({
  videoList,
  imageUrl,
  className = "w-full h-full object-contain",
  imageSize = 600,
  timeout = 8000, // Default 8 seconds timeout
  collectionId,
  lotteryId,
}: VideoCardProps) {
  const [status, setStatus] = useState<"loading" | "playing" | "error">(
    "loading"
  );
  const [freshVideoUrl, setFreshVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hasVideo = videoList && videoList.length > 1 && videoList[1];
  const videoUrl = freshVideoUrl || (hasVideo ? videoList[1] : null);
  const posterUrl = getFullImage(imageUrl, imageSize);

  // Fetch fresh video URL via proxy when old URL fails
  const fetchFreshUrl = useCallback(async () => {
    if (!collectionId || !lotteryId || !imageUrl) return null;
    console.log("[VideoCard] Fetching fresh URL via proxy...");
    const url = await getFreshVideoUrl(collectionId, lotteryId, imageUrl);
    if (url) {
      console.log("[VideoCard] Got fresh URL:", url.substring(0, 60) + "...");
      setFreshVideoUrl(url);
    }
    return url;
  }, [collectionId, lotteryId, imageUrl]);

  const clearTimeoutRef = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Reset state when card changes (imageUrl or videoUrl)
  useEffect(() => {
    console.log("[VideoCard] Card changed, resetting state");
    setStatus("loading");
    setFreshVideoUrl(null);
    clearTimeoutRef();

    if (!hasVideo) {
      console.log("[VideoCard] No video, showing image:", imageUrl);
      setStatus("error");
      return;
    }

    console.log("[VideoCard] Loading video:", videoUrl);

    // Start timeout - use ref to track current status
    const currentTimeout = setTimeout(() => {
      setStatus((prev) => {
        if (prev === "loading") {
          console.warn("[VideoCard] Timeout after", timeout, "ms:", videoUrl);
          return "error";
        }
        return prev;
      });
    }, timeout);

    return () => {
      clearTimeout(currentTimeout);
      clearTimeoutRef();
    };
  }, [videoUrl, imageUrl, hasVideo, timeout, clearTimeoutRef]);

  // Handle video events
  const handleCanPlay = useCallback(() => {
    clearTimeoutRef();
    console.log("[VideoCard] Video can play:", videoUrl);
    setStatus("playing");
    videoRef.current?.play().catch((err) => {
      console.error("[VideoCard] Autoplay blocked:", err.message, videoUrl);
      setStatus("error");
    });
  }, [clearTimeoutRef, videoUrl]);

  const handleError = useCallback(
    async (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
      const video = e.currentTarget;
      const error = video.error;

      // Ignore AbortError - happens when component unmounts during load
      // MediaError codes: 1=ABORTED, 2=NETWORK, 3=DECODE, 4=SRC_NOT_SUPPORTED
      if (error?.code === 1) {
        console.log(
          "[VideoCard] Load aborted (normal when switching cards):",
          videoUrl
        );
        return;
      }

      console.error("[VideoCard] Video error:", {
        url: videoUrl,
        code: error?.code,
        message: error?.message,
        networkState: video.networkState,
        readyState: video.readyState,
      });

      // Try to fetch fresh URL via proxy if we haven't already
      if (!freshVideoUrl && collectionId && lotteryId) {
        console.log("[VideoCard] Trying to fetch fresh URL...");
        const newUrl = await fetchFreshUrl();
        if (newUrl) {
          // Fresh URL fetched, component will re-render with new URL
          return;
        }
      }

      clearTimeoutRef();
      setStatus("error");
    },
    [
      clearTimeoutRef,
      videoUrl,
      freshVideoUrl,
      collectionId,
      lotteryId,
      fetchFreshUrl,
    ]
  );

  const handleLoadedData = useCallback(() => {
    // Video data loaded, extend timeout a bit more for buffering
    console.log("[VideoCard] Data loaded, buffering:", videoUrl);
    clearTimeoutRef();
    timeoutRef.current = setTimeout(() => {
      setStatus((prev) => {
        if (prev === "loading") {
          console.warn("[VideoCard] Buffering timeout:", videoUrl);
          return "error";
        }
        return prev;
      });
    }, 3000);
  }, [clearTimeoutRef, videoUrl]);

  // Show image fallback
  if (!hasVideo || status === "error") {
    return (
      <img
        src={posterUrl}
        alt=""
        className={className}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <video
      ref={videoRef}
      key={videoUrl}
      className={className}
      autoPlay
      loop
      muted
      playsInline
      poster={posterUrl}
      onCanPlay={handleCanPlay}
      onError={handleError}
      onLoadedData={handleLoadedData}
    >
      <source src={videoUrl!} type="video/mp4" />
    </video>
  );
}

// Re-export helpers from service
export { hasCardVideo, getVideoUrl } from "@/services/gacha-service";
