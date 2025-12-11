/**
 * Script chuẩn hóa IconPack:
 * 1. Chỉ giữ lại thư mục 256px, xóa 64px
 * 2. Di chuyển file từ 256px lên thư mục cha
 * 3. Chuẩn hóa tên file (bỏ " 256px", thay space bằng -)
 *
 * Chạy: node scripts/normalize-iconpack.js
 */

const fs = require("fs");
const path = require("path");

const ICONPACK_DIR = "public/IconPack";

let stats = {
  foldersDeleted: 0,
  filesRenamed: 0,
  filesMoved: 0,
  errors: [],
};

/**
 * Chuẩn hóa tên file
 * "Blue Diamond 1st Outline 256px.png" -> "blue-diamond-1st-outline.png"
 */
function normalizeName(filename) {
  let name = filename;

  // Bỏ " 256px" hoặc " 64px"
  name = name.replace(/\s*256px/gi, "");
  name = name.replace(/\s*64px/gi, "");

  // Lấy extension
  const ext = path.extname(name);
  const baseName = path.basename(name, ext);

  // Chuẩn hóa: lowercase, thay space bằng -
  let normalized = baseName
    .toLowerCase()
    .replace(/\s+/g, "-") // space -> -
    .replace(/_+/g, "-") // _ -> -
    .replace(/-+/g, "-") // multiple - -> single -
    .replace(/^-|-$/g, ""); // trim -

  return normalized + ext.toLowerCase();
}

/**
 * Xóa thư mục đệ quy
 */
function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const curPath = path.join(folderPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(folderPath);
  }
}

/**
 * Xử lý một thư mục icon (vd: Crown, Star, ...)
 */
function processIconFolder(iconFolderPath) {
  const folderName = path.basename(iconFolderPath);
  const folder256 = path.join(iconFolderPath, "256px");
  const folder64 = path.join(iconFolderPath, "64px");

  // Kiểm tra có thư mục 256px không
  if (!fs.existsSync(folder256)) {
    // Có thể đã được xử lý hoặc cấu trúc khác
    return;
  }

  console.log(`  📂 Processing: ${folderName}`);

  // 1. Xóa thư mục 64px nếu có
  if (fs.existsSync(folder64)) {
    try {
      deleteFolderRecursive(folder64);
      stats.foldersDeleted++;
      console.log(`    🗑️  Deleted: 64px/`);
    } catch (err) {
      stats.errors.push(`Error deleting 64px in ${folderName}: ${err.message}`);
    }
  }

  // 2. Di chuyển và đổi tên file từ 256px lên thư mục cha
  const files = fs.readdirSync(folder256);

  for (const file of files) {
    const oldPath = path.join(folder256, file);

    // Bỏ qua thư mục
    if (fs.lstatSync(oldPath).isDirectory()) continue;

    const newName = normalizeName(file);
    const newPath = path.join(iconFolderPath, newName);

    try {
      // Di chuyển file
      fs.renameSync(oldPath, newPath);
      stats.filesMoved++;

      if (file !== newName) {
        stats.filesRenamed++;
        console.log(`    ✅ ${file} -> ${newName}`);
      } else {
        console.log(`    ✅ Moved: ${newName}`);
      }
    } catch (err) {
      stats.errors.push(`Error moving ${file}: ${err.message}`);
    }
  }

  // 3. Xóa thư mục 256px (giờ đã trống)
  try {
    if (fs.existsSync(folder256) && fs.readdirSync(folder256).length === 0) {
      fs.rmdirSync(folder256);
      stats.foldersDeleted++;
      console.log(`    🗑️  Deleted: 256px/ (empty)`);
    }
  } catch (err) {
    stats.errors.push(
      `Error deleting 256px folder in ${folderName}: ${err.message}`
    );
  }
}

/**
 * Xử lý một category (vd: Item, Main, Currency, ...)
 */
function processCategory(categoryPath) {
  const categoryName = path.basename(categoryPath);
  console.log(`\n📁 Category: ${categoryName}`);

  const items = fs.readdirSync(categoryPath);

  for (const item of items) {
    const itemPath = path.join(categoryPath, item);

    if (fs.lstatSync(itemPath).isDirectory()) {
      processIconFolder(itemPath);
    }
  }
}

function main() {
  console.log("🎨 Bắt đầu chuẩn hóa IconPack...\n");
  console.log("Các bước:");
  console.log("  1. Xóa thư mục 64px");
  console.log("  2. Di chuyển file từ 256px lên thư mục cha");
  console.log("  3. Chuẩn hóa tên file (lowercase, dùng -)");
  console.log("");

  if (!fs.existsSync(ICONPACK_DIR)) {
    console.error(`❌ Không tìm thấy thư mục: ${ICONPACK_DIR}`);
    process.exit(1);
  }

  // Lấy danh sách categories
  const categories = fs.readdirSync(ICONPACK_DIR);

  for (const category of categories) {
    const categoryPath = path.join(ICONPACK_DIR, category);

    if (fs.lstatSync(categoryPath).isDirectory()) {
      processCategory(categoryPath);
    }
  }

  // In kết quả
  console.log("\n========================================");
  console.log("✅ Hoàn thành!");
  console.log(`   - Folders deleted: ${stats.foldersDeleted}`);
  console.log(`   - Files moved: ${stats.filesMoved}`);
  console.log(`   - Files renamed: ${stats.filesRenamed}`);

  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors (${stats.errors.length}):`);
    stats.errors.forEach((err) => console.log(`   - ${err}`));
  }

  console.log("========================================");

  // In ví dụ cách sử dụng
  console.log("\n📝 Ví dụ đường dẫn mới:");
  console.log("   /IconPack/Main/Star/golden-star-1st.png");
  console.log("   /IconPack/Item/Crown/crown-1st.png");
  console.log("   /IconPack/Currency/Diamond/blue-diamond-1st-outline.png");
}

main();
