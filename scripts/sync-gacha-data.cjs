/**
 * Script để sync data từ Laplace API vào Firebase Firestore
 * Chạy: node scripts/sync-gacha-data.cjs
 *
 * Cần chạy định kỳ (cron job) hoặc manual khi cần update data
 */

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// Initialize Firebase Admin (cần service account key)
// Download từ: Firebase Console > Project Settings > Service Accounts > Generate new private key
const serviceAccount = require("../firebase-service-account.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function syncGachaCollections() {
  console.log("🔄 Fetching collections from Laplace API...");

  try {
    const res = await fetch("https://workers.vrp.moe/laplace/collections", {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const collections = await res.json();
    console.log(`✅ Fetched ${collections.length} collections`);

    // Sort by startTime descending
    collections.sort((a, b) => b.startTime - a.startTime);

    // Batch write to Firestore
    const batch = db.batch();

    // Clear old data and write new
    const collectionRef = db.collection("gachaCollections");

    // Write each collection
    for (const item of collections) {
      const docRef = collectionRef.doc(item.id.toString());
      batch.set(docRef, {
        ...item,
        updatedAt: new Date(),
      });
    }

    // Also save metadata
    const metaRef = db.collection("metadata").doc("gacha");
    batch.set(metaRef, {
      totalCollections: collections.length,
      lastSync: new Date(),
    });

    await batch.commit();
    console.log(`✅ Synced ${collections.length} collections to Firestore`);
  } catch (err) {
    console.error("❌ Sync failed:", err);
    process.exit(1);
  }
}

syncGachaCollections();
