/**
 * Script xóa các file icon có "outline" trong tên
 *
 * Chạy: node scripts/delete-outline-icons.cjs
 */

const fs = require("fs");
const path = require("path");

const ICONPACK_DIR = "public/IconPack";

let deletedCount = 0;
let errors = [];

function deleteOutlineFiles(dir) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      deleteOutlineFiles(fullPath);
    } else if (item.toLowerCase().includes("outline")) {
      try {
        fs.unlinkSync(fullPath);
        console.log(`🗑️  Deleted: ${fullPath}`);
        deletedCount++;
      } catch (err) {
        errors.push(`Error deleting ${fullPath}: ${err.message}`);
      }
    }
  }
}

function main() {
  console.log("🗑️  Xóa các file outline trong IconPack...\n");

  if (!fs.existsSync(ICONPACK_DIR)) {
    console.error(`❌ Không tìm thấy thư mục: ${ICONPACK_DIR}`);
    process.exit(1);
  }

  deleteOutlineFiles(ICONPACK_DIR);

  console.log("\n========================================");
  console.log("✅ Hoàn thành!");
  console.log(`   - Files deleted: ${deletedCount}`);

  if (errors.length > 0) {
    console.log(`\n⚠️  Errors (${errors.length}):`);
    errors.forEach((err) => console.log(`   - ${err}`));
  }

  console.log("========================================");
}

main();
