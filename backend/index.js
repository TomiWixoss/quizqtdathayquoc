/**
 * Firebase Bridge Server for Render
 * - Listen for commands at /gacha_commands
 * - Execute API calls to workers.vrp.moe
 * - Write results back to Firebase
 */

import admin from "firebase-admin";
import fetch from "node-fetch";
import express from "express";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load service account - try env first, then local file
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // From environment variable (Render)
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // From local file (development)
    const filePath = path.join(
      __dirname,
      "..",
      "firebase-service-account.json"
    );
    serviceAccount = JSON.parse(fs.readFileSync(filePath, "utf8"));
    console.log("📁 Loaded service account from local file");
  }

  if (!serviceAccount.project_id) {
    throw new Error("Invalid service account");
  }
} catch (e) {
  console.error("❌ Cannot load Firebase service account");
  console.error("   - Set FIREBASE_SERVICE_ACCOUNT env (for Render)");
  console.error(
    "   - Or place firebase-service-account.json in project root (for local)"
  );
  process.exit(1);
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}-default-rtdb.asia-southeast1.firebasedatabase.app`,
});

const db = admin.database();
console.log("✅ Firebase Admin initialized");
console.log("📍 Project:", serviceAccount.project_id);

// In-memory cache
const cache = new Map();

function getCache(key, maxAge = 30 * 60 * 1000) {
  const cached = cache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key, data, maxAge = 30 * 60 * 1000) {
  cache.set(key, { data, expiry: Date.now() + maxAge });
}

// API Executors
const executors = {
  async getCollections() {
    const cacheKey = "collections";
    const cached = getCache(cacheKey, 5 * 60 * 1000);
    if (cached) return { success: true, data: cached, cached: true };

    const response = await fetch("https://workers.vrp.moe/laplace/collections");
    const data = await response.json();
    setCache(cacheKey, data, 5 * 60 * 1000);
    return { success: true, data };
  },

  async getCollection({ actId }) {
    if (!actId) throw new Error("Missing actId");

    const cacheKey = `collection-${actId}`;
    const cached = getCache(cacheKey, 5 * 60 * 1000);
    if (cached) return { success: true, data: cached, cached: true };

    const response = await fetch(
      `https://workers.vrp.moe/bilibili/collection/${actId}`
    );
    const data = await response.json();
    setCache(cacheKey, data, 5 * 60 * 1000);
    return { success: true, data };
  },

  async getLottery({ collectionId, lotteryId }) {
    if (!collectionId || !lotteryId)
      throw new Error("Missing collectionId or lotteryId");

    const cacheKey = `lottery-${collectionId}-${lotteryId}`;
    const cached = getCache(cacheKey, 30 * 60 * 1000);
    if (cached) return { success: true, data: cached, cached: true };

    const response = await fetch(
      `https://workers.vrp.moe/bilibili/collection-info/${collectionId}/${lotteryId}`
    );
    const data = await response.json();
    setCache(cacheKey, data, 30 * 60 * 1000);
    return { success: true, data };
  },

  async getVideoUrl({ collectionId, lotteryId, cardImg }) {
    if (!collectionId || !lotteryId || !cardImg) {
      throw new Error("Missing collectionId, lotteryId, or cardImg");
    }

    const cacheKey = `video-${collectionId}-${lotteryId}-${cardImg}`;
    const cached = getCache(cacheKey, 30 * 60 * 1000);
    if (cached) return { success: true, videoUrl: cached, cached: true };

    const response = await fetch(
      `https://workers.vrp.moe/bilibili/collection-info/${collectionId}/${lotteryId}`
    );
    const json = await response.json();
    const items = json.data?.item_list || [];
    const card = items.find((item) => item.card_info?.card_img === cardImg);

    if (!card?.card_info?.video_list?.length) {
      throw new Error("Video not found");
    }

    const videoUrl =
      card.card_info.video_list[1] || card.card_info.video_list[0];
    setCache(cacheKey, videoUrl, 30 * 60 * 1000);
    return { success: true, videoUrl };
  },
};

// Process command
async function processCommand(commandId, commandData) {
  const { action, params = {} } = commandData;
  const commandRef = db.ref(`gacha_commands/${commandId}`);

  console.log(`📥 [${commandId}] ${action}`, params);

  await commandRef.update({
    status: "processing",
    processedAt: admin.database.ServerValue.TIMESTAMP,
  });

  try {
    if (!action || !executors[action]) {
      throw new Error(`Invalid action: ${action}`);
    }

    const result = await executors[action](params);

    await commandRef.update({
      status: "completed",
      response: result,
      completedAt: admin.database.ServerValue.TIMESTAMP,
    });

    console.log(`✅ [${commandId}] completed`);

    // Auto-delete after 60 seconds
    setTimeout(() => commandRef.remove().catch(() => {}), 60000);
  } catch (error) {
    console.error(`❌ [${commandId}] ${error.message}`);

    await commandRef.update({
      status: "error",
      response: { success: false, error: error.message },
      completedAt: admin.database.ServerValue.TIMESTAMP,
    });

    setTimeout(() => commandRef.remove().catch(() => {}), 60000);
  }
}

// Start Firebase listener
function startListener() {
  const commandsRef = db.ref("gacha_commands");
  console.log("🎧 Listening for commands at /gacha_commands...");

  commandsRef.on("child_added", async (snapshot) => {
    const commandId = snapshot.key;
    const commandData = snapshot.val();

    if (
      commandData.status === "completed" ||
      commandData.status === "error" ||
      commandData.status === "processing"
    ) {
      return;
    }

    await processCommand(commandId, commandData);
  });
}

// Express server for health check (Render needs this)
const app = express();
const PORT = process.env.PORT || 3001;

app.get("/", (req, res) => {
  res.json({
    status: "running",
    service: "Gacha Firebase Bridge",
    cacheSize: cache.size,
    uptime: process.uptime(),
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`🌐 Health server on port ${PORT}`);
  startListener();
  console.log("🚀 Firebase Bridge Server running!");
});
