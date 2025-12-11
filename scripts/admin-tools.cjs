/**
 * Admin Tools - Gửi thư và tạo mã quà tặng
 *
 * Cách sử dụng:
 * node scripts/admin-tools.cjs send-mail "Tiêu đề" "Nội dung" 50
 * node scripts/admin-tools.cjs create-code "QTDA2024" 100 1000
 * node scripts/admin-tools.cjs list-mails
 * node scripts/admin-tools.cjs list-codes
 * node scripts/admin-tools.cjs deactivate-mail <mailId>
 * node scripts/admin-tools.cjs deactivate-code <codeId>
 */

const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
} = require("firebase/firestore");
const fs = require("fs");
const path = require("path");

// Đọc .env file thủ công
function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  const envContent = fs.readFileSync(envPath, "utf-8");
  const env = {};
  envContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join("=").trim();
    }
  });
  return env;
}

const env = loadEnv();

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ============ MAIL FUNCTIONS ============

/**
 * Gửi thư cho tất cả người dùng
 * @param {string} title - Tiêu đề thư
 * @param {string} content - Nội dung thư
 * @param {number} reward - Số gems thưởng
 */
async function sendMail(title, content, reward) {
  try {
    const mailData = {
      title,
      content,
      reward: parseInt(reward) || 0,
      active: true,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, "mails"), mailData);
    console.log("✅ Đã gửi thư thành công!");
    console.log("   ID:", docRef.id);
    console.log("   Tiêu đề:", title);
    console.log("   Nội dung:", content);
    console.log("   Phần thưởng:", reward, "gems");
  } catch (error) {
    console.error("❌ Lỗi khi gửi thư:", error.message);
  }
}

/**
 * Liệt kê tất cả thư
 */
async function listMails() {
  try {
    const snapshot = await getDocs(collection(db, "mails"));
    console.log("\n📬 Danh sách thư (" + snapshot.size + " thư):\n");

    snapshot.forEach((doc) => {
      const data = doc.data();
      const status = data.active ? "🟢 Active" : "🔴 Inactive";
      console.log(`${status} [${doc.id}]`);
      console.log(`   📌 ${data.title}`);
      console.log(`   💎 ${data.reward} gems`);
      console.log(`   📅 ${new Date(data.createdAt).toLocaleString("vi-VN")}`);
      console.log("");
    });
  } catch (error) {
    console.error("❌ Lỗi:", error.message);
  }
}

/**
 * Vô hiệu hóa thư
 */
async function deactivateMail(mailId) {
  try {
    await updateDoc(doc(db, "mails", mailId), { active: false });
    console.log("✅ Đã vô hiệu hóa thư:", mailId);
  } catch (error) {
    console.error("❌ Lỗi:", error.message);
  }
}

// ============ REDEEM CODE FUNCTIONS ============

/**
 * Tạo mã đổi thưởng
 * @param {string} code - Mã (sẽ được uppercase)
 * @param {number} reward - Số gems thưởng
 * @param {number} usageLimit - Giới hạn số lần sử dụng (0 = không giới hạn)
 * @param {string} expiresAt - Ngày hết hạn (optional, format: YYYY-MM-DD)
 */
async function createRedeemCode(
  code,
  reward,
  usageLimit = 0,
  expiresAt = null
) {
  try {
    // Kiểm tra mã đã tồn tại chưa
    const q = query(
      collection(db, "redeemCodes"),
      where("code", "==", code.toUpperCase())
    );
    const existing = await getDocs(q);

    if (!existing.empty) {
      console.error("❌ Mã này đã tồn tại!");
      return;
    }

    const codeData = {
      code: code.toUpperCase(),
      reward: parseInt(reward) || 0,
      usageLimit: parseInt(usageLimit) || null,
      usedCount: 0,
      active: true,
      createdAt: new Date().toISOString(),
    };

    if (expiresAt) {
      codeData.expiresAt = new Date(expiresAt).toISOString();
    }

    const docRef = await addDoc(collection(db, "redeemCodes"), codeData);
    console.log("✅ Đã tạo mã thành công!");
    console.log("   ID:", docRef.id);
    console.log("   Mã:", code.toUpperCase());
    console.log("   Phần thưởng:", reward, "gems");
    console.log("   Giới hạn:", usageLimit || "Không giới hạn");
    if (expiresAt) {
      console.log("   Hết hạn:", expiresAt);
    }
  } catch (error) {
    console.error("❌ Lỗi khi tạo mã:", error.message);
  }
}

/**
 * Liệt kê tất cả mã
 */
async function listCodes() {
  try {
    const snapshot = await getDocs(collection(db, "redeemCodes"));
    console.log("\n🎁 Danh sách mã đổi thưởng (" + snapshot.size + " mã):\n");

    snapshot.forEach((doc) => {
      const data = doc.data();
      const status = data.active ? "🟢 Active" : "🔴 Inactive";
      const usage = data.usageLimit
        ? `${data.usedCount}/${data.usageLimit}`
        : `${data.usedCount}/∞`;

      console.log(`${status} [${doc.id}]`);
      console.log(`   🔑 ${data.code}`);
      console.log(`   💎 ${data.reward} gems`);
      console.log(`   📊 Đã dùng: ${usage}`);
      if (data.expiresAt) {
        console.log(
          `   ⏰ Hết hạn: ${new Date(data.expiresAt).toLocaleString("vi-VN")}`
        );
      }
      console.log("");
    });
  } catch (error) {
    console.error("❌ Lỗi:", error.message);
  }
}

/**
 * Vô hiệu hóa mã
 */
async function deactivateCode(codeId) {
  try {
    await updateDoc(doc(db, "redeemCodes", codeId), { active: false });
    console.log("✅ Đã vô hiệu hóa mã:", codeId);
  } catch (error) {
    console.error("❌ Lỗi:", error.message);
  }
}

// ============ CLI HANDLER ============

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log("\n🔧 Quiz QTDA - Admin Tools\n");

  switch (command) {
    case "send-mail":
      if (args.length < 4) {
        console.log(
          'Cách dùng: node admin-tools.cjs send-mail "Tiêu đề" "Nội dung" <gems>'
        );
        console.log(
          'Ví dụ: node admin-tools.cjs send-mail "Chào mừng!" "Cảm ơn bạn đã tham gia" 50'
        );
      } else {
        await sendMail(args[1], args[2], args[3]);
      }
      break;

    case "list-mails":
      await listMails();
      break;

    case "deactivate-mail":
      if (!args[1]) {
        console.log("Cách dùng: node admin-tools.cjs deactivate-mail <mailId>");
      } else {
        await deactivateMail(args[1]);
      }
      break;

    case "create-code":
      if (args.length < 3) {
        console.log(
          'Cách dùng: node admin-tools.cjs create-code "MÃ" <gems> [giới_hạn] [ngày_hết_hạn]'
        );
        console.log(
          'Ví dụ: node admin-tools.cjs create-code "NEWYEAR2025" 100 1000 2025-01-31'
        );
      } else {
        await createRedeemCode(args[1], args[2], args[3], args[4]);
      }
      break;

    case "list-codes":
      await listCodes();
      break;

    case "deactivate-code":
      if (!args[1]) {
        console.log("Cách dùng: node admin-tools.cjs deactivate-code <codeId>");
      } else {
        await deactivateCode(args[1]);
      }
      break;

    default:
      console.log("📋 Các lệnh có sẵn:\n");
      console.log("  📬 THƯ:");
      console.log('     send-mail "Tiêu đề" "Nội dung" <gems>  - Gửi thư mới');
      console.log(
        "     list-mails                             - Xem danh sách thư"
      );
      console.log(
        "     deactivate-mail <mailId>               - Vô hiệu hóa thư\n"
      );
      console.log("  🎁 MÃ ĐỔI THƯỞNG:");
      console.log('     create-code "MÃ" <gems> [limit] [exp]  - Tạo mã mới');
      console.log(
        "     list-codes                             - Xem danh sách mã"
      );
      console.log(
        "     deactivate-code <codeId>               - Vô hiệu hóa mã\n"
      );
      console.log("📌 Ví dụ:");
      console.log(
        '   node scripts/admin-tools.cjs send-mail "Quà Giáng Sinh" "Chúc mừng Giáng Sinh!" 100'
      );
      console.log(
        '   node scripts/admin-tools.cjs create-code "XMAS2024" 50 500 2024-12-31'
      );
  }

  process.exit(0);
}

main();
