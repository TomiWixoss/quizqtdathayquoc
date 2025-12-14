import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// In-memory cache (note: resets on each serverless invocation)
const cache = new Map();

function getCache(key, maxAge = 30 * 60 * 1000) {
  const cached = cache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }
  return null;
}

function setCache(key, data, maxAge = 30 * 60 * 1000) {
  cache.set(key, { data, expiry: Date.now() + maxAge });
}

// ============ COLLECTIONS ============

/**
 * GET /api/collections
 * Get all gacha collections list
 */
app.get("/api/collections", async (_req, res) => {
  const cacheKey = "collections";
  const cached = getCache(cacheKey, 5 * 60 * 1000);
  if (cached) {
    return res.json(cached);
  }

  try {
    console.log("[API] Fetching collections list...");
    const response = await fetch("https://workers.vrp.moe/laplace/collections");
    const json = await response.json();
    setCache(cacheKey, json, 5 * 60 * 1000);
    res.json(json);
  } catch (error) {
    console.error(`[Error] ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/collection/:actId
 * Get collection detail
 */
app.get("/api/collection/:actId", async (req, res) => {
  const { actId } = req.params;
  const cacheKey = `collection-${actId}`;
  const cached = getCache(cacheKey, 5 * 60 * 1000);
  if (cached) {
    return res.json(cached);
  }

  try {
    console.log(`[API] Fetching collection ${actId}...`);
    const response = await fetch(
      `https://workers.vrp.moe/bilibili/collection/${actId}`
    );
    const json = await response.json();
    setCache(cacheKey, json, 5 * 60 * 1000);
    res.json(json);
  } catch (error) {
    console.error(`[Error] ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// ============ LOTTERIES ============

/**
 * GET /api/lottery/:collectionId/:lotteryId
 * Get lottery info with all cards (fresh video URLs)
 */
app.get("/api/lottery/:collectionId/:lotteryId", async (req, res) => {
  const { collectionId, lotteryId } = req.params;
  const cacheKey = `lottery-${collectionId}-${lotteryId}`;
  const cached = getCache(cacheKey, 30 * 60 * 1000);
  if (cached) {
    return res.json(cached);
  }

  try {
    console.log(`[API] Fetching lottery ${collectionId}/${lotteryId}...`);
    const response = await fetch(
      `https://workers.vrp.moe/bilibili/collection-info/${collectionId}/${lotteryId}`
    );
    const json = await response.json();
    setCache(cacheKey, json, 30 * 60 * 1000);
    res.json(json);
  } catch (error) {
    console.error(`[Error] ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// ============ VIDEO URL ============

/**
 * GET /api/video-url
 * Get fresh video URL for a specific card
 */
app.get("/api/video-url", async (req, res) => {
  const { collectionId, lotteryId, cardImg } = req.query;

  if (!collectionId || !lotteryId || !cardImg) {
    return res.status(400).json({
      error: "Missing required params: collectionId, lotteryId, cardImg",
    });
  }

  const cacheKey = `video-${collectionId}-${lotteryId}-${cardImg}`;
  const cached = getCache(cacheKey, 30 * 60 * 1000);
  if (cached) {
    return res.json({ videoUrl: cached, cached: true });
  }

  try {
    console.log(`[API] Fetching video URL for card...`);
    const response = await fetch(
      `https://workers.vrp.moe/bilibili/collection-info/${collectionId}/${lotteryId}`
    );
    const json = await response.json();
    const items = json.data?.item_list || [];

    const card = items.find((item) => item.card_info?.card_img === cardImg);

    if (!card?.card_info?.video_list?.length) {
      return res.status(404).json({ error: "Video not found" });
    }

    const videoUrl =
      card.card_info.video_list[1] || card.card_info.video_list[0];
    setCache(cacheKey, videoUrl, 30 * 60 * 1000);
    res.json({ videoUrl, cached: false });
  } catch (error) {
    console.error(`[Error] ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// ============ HEALTH ============

app.get("/health", (_req, res) => {
  res.json({ status: "ok", cacheSize: cache.size });
});

app.get("/", (_req, res) => {
  res.json({
    name: "Gacha API Proxy",
    endpoints: [
      "GET /api/collections",
      "GET /api/collection/:actId",
      "GET /api/lottery/:collectionId/:lotteryId",
      "GET /api/video-url?collectionId=X&lotteryId=Y&cardImg=Z",
      "GET /health",
    ],
  });
});

// For local development
const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Gacha API Proxy running on port ${PORT}`);
  });
}

// Export for Vercel serverless
export default app;
