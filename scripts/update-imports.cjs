/**
 * Script cập nhật import paths trong dự án
 * Chuyển từ đường dẫn cũ sang đường dẫn mới trong public/
 *
 * Chạy: node scripts/update-imports.js
 */

const fs = require("fs");
const path = require("path");

// Mapping đường dẫn cũ -> mới
const PATH_MAPPINGS = {
  // AppAssets
  "/BlueDiamond.png": "/AppAssets/BlueDiamond.png",
  "/Heart.png": "/AppAssets/Heart.png",
  "/Fire.png": "/AppAssets/Fire.png",
  "/Lighting.png": "/AppAssets/Lighting.png",

  // AI Workers
  "/caro-ai-worker.js": "/AI/caro-ai-worker.js",
  "/caro-ai-worker-v2.js": "/AI/caro-ai-worker-v2.js",
  "/caro-ai-worker-v3.js": "/AI/caro-ai-worker-v3.js",
  "/caro-ai-worker-v4.js": "/AI/caro-ai-worker-v4.js",
  "/caro-ai-worker-v5.js": "/AI/caro-ai-worker-v5.js",
  "/caro-ai-ultimate.js": "/AI/caro-ai-ultimate.js",
  "/2048-ai-worker.js": "/AI/2048-ai-worker.js",
};

// Thư mục cần scan
const SCAN_DIRS = ["src"];

// Extensions cần xử lý
const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

// Đếm số file đã cập nhật
let updatedFiles = 0;
let totalReplacements = 0;

function getAllFiles(dir, files = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Bỏ qua node_modules
      if (item !== "node_modules") {
        getAllFiles(fullPath, files);
      }
    } else if (EXTENSIONS.includes(path.extname(item))) {
      files.push(fullPath);
    }
  }

  return files;
}

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let originalContent = content;
  let fileReplacements = 0;

  for (const [oldPath, newPath] of Object.entries(PATH_MAPPINGS)) {
    // Escape special regex characters
    const escapedOldPath = oldPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Tìm các pattern: src="...", href="...", '/...', "..."
    const patterns = [
      new RegExp(`src=["']${escapedOldPath}["']`, "g"),
      new RegExp(`href=["']${escapedOldPath}["']`, "g"),
      new RegExp(`["']${escapedOldPath}["']`, "g"),
    ];

    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        fileReplacements += matches.length;
        content = content.replace(pattern, (match) => {
          return match.replace(oldPath, newPath);
        });
      }
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✅ Updated: ${filePath} (${fileReplacements} replacements)`);
    updatedFiles++;
    totalReplacements += fileReplacements;
  }
}

function main() {
  console.log("🔄 Bắt đầu cập nhật import paths...\n");
  console.log("Mapping:");
  for (const [oldPath, newPath] of Object.entries(PATH_MAPPINGS)) {
    console.log(`  ${oldPath} -> ${newPath}`);
  }
  console.log("\n");

  for (const dir of SCAN_DIRS) {
    if (fs.existsSync(dir)) {
      const files = getAllFiles(dir);
      console.log(`📁 Scanning ${dir}/ (${files.length} files)...\n`);

      for (const file of files) {
        updateFile(file);
      }
    }
  }

  console.log("\n========================================");
  console.log(`✅ Hoàn thành!`);
  console.log(`   - Files updated: ${updatedFiles}`);
  console.log(`   - Total replacements: ${totalReplacements}`);
  console.log("========================================");
}

main();
