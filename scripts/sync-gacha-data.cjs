/**
 * Script để sync FULL data từ Bilibili API vào Firebase Firestore
 *
 * Usage:
 *   node scripts/sync-gacha-data.cjs              # Sync mới (skip existing)
 *   node scripts/sync-gacha-data.cjs --force      # Force sync tất cả
 *   node scripts/sync-gacha-data.cjs --single 110873  # Sync 1 collection cụ thể
 *
 * API Documentation:
 * 1. Collection List: https://workers.vrp.moe/laplace/collections
 * 2. Collection Detail: https://workers.vrp.moe/bilibili/collection/{act_id}
 * 3. Lottery Items: https://workers.vrp.moe/bilibili/collection-info/{act_id}/{lottery_id}
 */

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// Initialize Firebase Admin
const serviceAccount = require("../firebase-service-account.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

// Rate limiting helper
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry helper with exponential backoff
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: { Accept: "application/json", ...options.headers },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        throw new Error(`Invalid JSON: ${text.substring(0, 50)}...`);
      }
    } catch (err) {
      if (attempt === maxRetries) {
        throw err;
      }
      const waitTime = attempt * 1000; // 1s, 2s, 3s
      console.log(
        `   ⚠️ Attempt ${attempt} failed, retrying in ${waitTime}ms...`
      );
      await delay(waitTime);
    }
  }
}

/**
 * Lấy danh sách IDs đã có trong Firebase
 */
async function getExistingIds() {
  const snapshot = await db.collection("gachaCollections").select().get();
  return new Set(snapshot.docs.map((doc) => parseInt(doc.id)));
}

/**
 * Fetch collection list từ Laplace API
 */
async function fetchCollectionList() {
  const json = await fetchWithRetry(
    "https://workers.vrp.moe/laplace/collections"
  );
  return json;
}

/**
 * Fetch collection detail từ Bilibili API
 */
async function fetchCollectionDetail(actId) {
  const json = await fetchWithRetry(
    `https://workers.vrp.moe/bilibili/collection/${actId}`
  );
  return json.data;
}

/**
 * Fetch lottery items từ Bilibili API
 */
async function fetchLotteryInfo(actId, lotteryId) {
  const json = await fetchWithRetry(
    `https://workers.vrp.moe/bilibili/collection-info/${actId}/${lotteryId}`
  );
  return json.data;
}

/**
 * Parse collector_medal_info từ JSON string
 */
function parseMedalInfo(medalInfoStr) {
  if (!medalInfoStr) return null;
  try {
    return JSON.parse(medalInfoStr);
  } catch {
    return null;
  }
}

/**
 * Sync một collection và lotteries của nó - LƯU FULL DATA
 */
async function syncCollection(item, detail) {
  const actId = item.id;

  // Prepare collection data - LƯU FULL
  const collectionData = {
    // === Basic info from list ===
    id: actId,
    name: item.name,
    description: item.description || "",
    startTime: item.startTime,
    relatedUsers: item.relatedUsers || [],
    totalPreorderCount: item.totalPreorderCount || 0,
    totalPurchaseCount: item.totalPurchaseCount || 0,
    act_square_img: item.act_square_img || "",
    lottery_image: item.lottery_image || "",

    // === Detail info - FULL ===
    act_title: detail?.act_title || item.name,
    product_introduce: detail?.product_introduce || "",
    start_time: detail?.start_time || item.startTime,
    end_time: detail?.end_time || 0,
    total_book_cnt: detail?.total_book_cnt || 0,
    total_buy_cnt: detail?.total_buy_cnt || 0,

    // UP chủ info - FULL object
    related_user_infos: detail?.related_user_infos || {},

    // Medal/Badge info khi sưu tập đủ thẻ
    collector_medal_info: parseMedalInfo(detail?.collector_medal_info),

    // Lottery list basic (chi tiết lưu ở subcollection)
    lottery_list: (detail?.lottery_list || []).map((l) => ({
      lottery_id: l.lottery_id,
      lottery_name: l.lottery_name,
      price: l.price,
      lottery_image: l.lottery_image,
    })),

    // === Raw data backup ===
    _raw_detail: detail || null,

    updatedAt: new Date(),
  };

  // Save collection to Firestore
  const collectionRef = db.collection("gachaCollections").doc(actId.toString());
  await collectionRef.set(collectionData);

  // Fetch and save lottery details - FULL DATA
  if (detail?.lottery_list && detail.lottery_list.length > 0) {
    for (const lottery of detail.lottery_list) {
      const lotteryId = lottery.lottery_id;

      try {
        const lotteryInfo = await fetchLotteryInfo(actId, lotteryId);
        await delay(200); // Rate limiting

        // LƯU FULL LOTTERY DATA
        const lotteryData = {
          lottery_id: lotteryId,
          lottery_name: lottery.lottery_name || "",
          price: lottery.price || 0,
          lottery_image: lottery.lottery_image || "",

          // === CARDS - FULL INFO ===
          item_list: (lotteryInfo?.item_list || []).map((item) => ({
            item_type: item.item_type,
            // Full card_info object
            card_info: item.card_info || {},
            // Extracted for easy access
            card_name: item.card_info?.card_name || "",
            card_img: item.card_info?.card_img || "",
            card_scarcity: item.card_info?.card_scarcity || 0,
            card_type: item.card_info?.card_type || 0,
            width: item.card_info?.width || 0,
            height: item.card_info?.height || 0,
            // Video cho thẻ động
            video_list: item.card_info?.video_list || [],
            // Ảnh download chất lượng cao
            card_img_download: item.card_info?.card_img_download || "",
            // Các field khác có thể có
            card_id: item.card_info?.card_id || 0,
            is_physical_orientation:
              item.card_info?.is_physical_orientation || 0,
          })),

          // === COLLECT REWARDS - FULL ===
          // Phần thưởng khi sưu tập đủ thẻ (avatar, frame, badge...)
          collect_list: lotteryInfo?.collect_list || {},

          // Chi tiết collect_infos (mốc thưởng theo số thẻ khác nhau)
          collect_infos: lotteryInfo?.collect_list?.collect_infos || [],

          // Chi tiết collect_chain (mốc thưởng theo số lần rút)
          collect_chain: lotteryInfo?.collect_list?.collect_chain || [],

          // === RAW DATA BACKUP ===
          _raw_lottery_info: lotteryInfo || null,

          updatedAt: new Date(),
        };

        // Save lottery as subcollection
        const lotteryRef = collectionRef
          .collection("lotteries")
          .doc(lotteryId.toString());
        await lotteryRef.set(lotteryData);

        const cardCount = lotteryData.item_list.length;
        const videoCards = lotteryData.item_list.filter(
          (c) => c.video_list?.length > 0
        ).length;
        console.log(
          `   ✓ Lottery ${lotteryId}: ${lottery.lottery_name} (${cardCount} cards, ${videoCards} animated)`
        );
      } catch (lotteryErr) {
        console.log(`   ✗ Lottery ${lotteryId} failed: ${lotteryErr.message}`);
      }
    }
  }
}

/**
 * Sync tất cả collections (skip existing nếu không force)
 */
async function syncAllCollections(forceSync = false) {
  console.log(`🔄 Starting FULL sync... (force: ${forceSync})\n`);

  try {
    // Step 1: Get existing IDs from Firebase
    console.log("📦 Checking existing collections in Firebase...");
    const existingIds = await getExistingIds();
    console.log(`   Found ${existingIds.size} existing collections\n`);

    // Step 2: Fetch collection list from API
    console.log("📋 Fetching collection list from API...");
    const collections = await fetchCollectionList();
    console.log(`   Found ${collections.length} collections from API\n`);

    // Sort by startTime descending
    collections.sort((a, b) => b.startTime - a.startTime);

    // Filter out existing if not force
    const toSync = forceSync
      ? collections
      : collections.filter((c) => !existingIds.has(c.id));

    if (toSync.length === 0) {
      console.log("✅ Nothing new to sync!");
      return;
    }

    console.log(`📥 Will sync ${toSync.length} collections (FULL DATA)\n`);
    console.log("═".repeat(50));

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = collections.length - toSync.length;

    for (let i = 0; i < toSync.length; i++) {
      const item = toSync[i];
      const actId = item.id;

      console.log(`[${i + 1}/${toSync.length}] ${item.name} (ID: ${actId})`);

      try {
        // Fetch collection detail
        const detail = await fetchCollectionDetail(actId);
        await delay(200); // Rate limiting

        // Sync collection and lotteries - FULL DATA
        await syncCollection(item, detail);

        successCount++;
        console.log(`   ✅ Done\n`);
      } catch (err) {
        errorCount++;
        console.log(`   ❌ Error: ${err.message}\n`);

        // Still save basic info
        const basicData = {
          id: actId,
          name: item.name,
          description: item.description || "",
          startTime: item.startTime,
          relatedUsers: item.relatedUsers || [],
          totalPreorderCount: item.totalPreorderCount || 0,
          totalPurchaseCount: item.totalPurchaseCount || 0,
          act_square_img: item.act_square_img || "",
          lottery_image: item.lottery_image || "",
          updatedAt: new Date(),
          syncError: err.message,
        };

        const collectionRef = db
          .collection("gachaCollections")
          .doc(actId.toString());
        await collectionRef.set(basicData);
      }

      // Rate limiting between collections
      await delay(300);
    }

    // Save metadata
    const metaRef = db.collection("metadata").doc("gacha");
    await metaRef.set({
      totalCollections: existingIds.size + successCount,
      lastSync: new Date(),
      lastSyncStats: {
        newSynced: successCount,
        errors: errorCount,
        skipped: skippedCount,
        fullData: true,
      },
    });

    console.log("═".repeat(50));
    console.log(`✅ FULL Sync completed!`);
    console.log(`   New synced: ${successCount}`);
    console.log(`   Skipped (existing): ${skippedCount}`);
    console.log(`   Errors: ${errorCount}`);
  } catch (err) {
    console.error("❌ Sync failed:", err);
    process.exit(1);
  }
}

/**
 * Sync một collection cụ thể (dùng để test hoặc update riêng lẻ)
 */
async function syncSingleCollection(actId) {
  console.log(`🔄 Syncing collection ${actId} (FULL DATA)...\n`);

  try {
    // Fetch from API
    const collections = await fetchCollectionList();
    const item = collections.find((c) => c.id === actId);

    if (!item) {
      console.log(`❌ Collection ${actId} not found in API`);
      process.exit(1);
    }

    const detail = await fetchCollectionDetail(actId);
    await syncCollection(item, detail);

    console.log(`\n✅ Collection ${actId} synced successfully (FULL DATA)!`);
  } catch (err) {
    console.error("❌ Sync failed:", err);
    process.exit(1);
  }
}

// CLI handling
const args = process.argv.slice(2);

if (args[0] === "--single" && args[1]) {
  // Sync single collection: node scripts/sync-gacha-data.cjs --single 110873
  syncSingleCollection(parseInt(args[1]));
} else if (args[0] === "--force") {
  // Force sync all: node scripts/sync-gacha-data.cjs --force
  syncAllCollections(true);
} else {
  // Sync new only: node scripts/sync-gacha-data.cjs
  syncAllCollections(false);
}
