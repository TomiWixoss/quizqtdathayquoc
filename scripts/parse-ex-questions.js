/**
 * Script để parse file QTDAEx.txt và chuyển thành dạng JSON
 * Chia thành 6 chương EX (mỗi chương 10 câu)
 * Thêm vào quiz-data.json
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đọc file QTDAEx.txt
const inputPath = path.join(__dirname, "..", "QTDAEx.txt");
const outputPath = path.join(__dirname, "..", "src", "data", "quiz-data.json");

const content = fs.readFileSync(inputPath, "utf-8");
const lines = content.split(/\r?\n/);

const questions = [];
let currentQuestion = null;
let currentOptions = [];
let correctAnswer = null;
let pendingOptionId = null; // Track khi gặp a., b., c., d.

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();

  // Tìm dòng "Câu hỏi N" (chỉ số, không có "Trả lời")
  if (line.match(/^Câu hỏi \d+$/) && !line.includes("Trả lời")) {
    // Lưu câu hỏi trước đó nếu có
    if (currentQuestion && currentOptions.length === 4 && correctAnswer) {
      questions.push({
        question: currentQuestion,
        options: currentOptions,
        correctAnswer: correctAnswer,
      });
    }

    // Reset cho câu hỏi mới
    currentQuestion = null;
    currentOptions = [];
    correctAnswer = null;
    pendingOptionId = null;
    continue;
  }

  // Tìm "Đoạn văn câu hỏi" - câu kế tiếp là nội dung câu hỏi
  if (line === "Đoạn văn câu hỏi") {
    // Đọc dòng tiếp theo là nội dung câu hỏi
    if (i + 1 < lines.length) {
      currentQuestion = lines[i + 1].trim();
    }
    continue;
  }

  // Tìm các marker option (a., b., c., d.)
  if (line.match(/^[a-d]\.\s*$/)) {
    pendingOptionId = line.charAt(0).toUpperCase(); // 'a' -> 'A'
    continue;
  }

  // Nếu có pending option và dòng hiện tại không rỗng và không phải marker khác
  if (pendingOptionId && line && !line.match(/^[a-d]\.\s*$/) && line !== "Phản hồi" && !line.startsWith("The correct answer is:")) {
    currentOptions.push({
      id: pendingOptionId,
      text: line,
    });
    pendingOptionId = null;
    continue;
  }

  // Tìm đáp án đúng
  if (line.startsWith("The correct answer is:")) {
    const answerText = line.replace("The correct answer is:", "").trim();
    // Tìm option tương ứng với đáp án
    for (let opt of currentOptions) {
      // So sánh text, loại bỏ dấu chấm cuối nếu có
      const optText = opt.text.replace(/\.?\s*$/, "");
      const ansText = answerText.replace(/\.?\s*$/, "");
      if (optText === ansText) {
        correctAnswer = opt.id;
        break;
      }
    }
    continue;
  }
}

// Lưu câu hỏi cuối cùng
if (currentQuestion && currentOptions.length === 4 && correctAnswer) {
  questions.push({
    question: currentQuestion,
    options: currentOptions,
    correctAnswer: correctAnswer,
  });
}

console.log(`Đã parse ${questions.length} câu hỏi`);

// Debug: In 3 câu đầu
if (questions.length > 0) {
  console.log("\n=== 3 CÂU ĐẦU TIÊN ===");
  for (let i = 0; i < Math.min(3, questions.length); i++) {
    console.log(`\nCâu ${i + 1}: ${questions[i].question}`);
    console.log(`Options: ${questions[i].options.map(o => `${o.id}. ${o.text.substring(0, 30)}...`).join(" | ")}`);
    console.log(`Đáp án: ${questions[i].correctAnswer}`);
  }
}

// Tạo 6 chương EX
const exChapters = [];
const startChapterId = 100; // EX chapters bắt đầu từ ID 100

for (let i = 0; i < 6; i++) {
  exChapters.push({
    id: startChapterId + i,
    name: `EX ${i + 1} - ĐỀ LUYỆN TẬP`,
    totalQuestions: 10,
    icon: "Star",
    isEx: true,
  });
}

// Gán câu hỏi vào các chương EX
const exQuestions = [];
const startQuestionId = 10000; // ID bắt đầu cho câu hỏi EX

for (let i = 0; i < questions.length && i < 60; i++) {
  const chapterIndex = Math.floor(i / 10); // 0-9 -> chương 0, 10-19 -> chương 1, etc.
  const chapter = exChapters[chapterIndex];

  exQuestions.push({
    id: startQuestionId + i,
    question: questions[i].question,
    options: questions[i].options,
    correctAnswer: questions[i].correctAnswer,
    chapter: chapter.id,
    chapterName: chapter.name,
    isEx: true,
  });
}

console.log(`\nĐã tạo ${exQuestions.length} câu hỏi EX trong ${exChapters.length} chương`);

// Đọc quiz-data.json hiện tại
const quizData = JSON.parse(fs.readFileSync(outputPath, "utf-8"));

// Kiểm tra xem đã có chapters EX chưa
const existingExChapterIds = quizData.chapters.filter((c) => c.isEx).map((c) => c.id);
if (existingExChapterIds.length > 0) {
  // Xóa chapters EX cũ
  quizData.chapters = quizData.chapters.filter((c) => !c.isEx);
  // Xóa questions EX cũ
  quizData.questions = quizData.questions.filter((q) => !q.isEx);
  console.log("Đã xóa dữ liệu EX cũ");
}

// Thêm chapters và questions EX mới
quizData.chapters.push(...exChapters);
quizData.questions.push(...exQuestions);

// Lưu file
fs.writeFileSync(outputPath, JSON.stringify(quizData, null, 2), "utf-8");
console.log(`Đã cập nhật ${outputPath}`);

// In thống kê
console.log("\n=== THỐNG KÊ ===");
console.log(`Tổng số chapters: ${quizData.chapters.length}`);
console.log(`Tổng số questions: ${quizData.questions.length}`);
console.log(`Số chapters EX: ${exChapters.length}`);
console.log(`Số questions EX: ${exQuestions.length}`);

// In chi tiết các chương EX
console.log("\n=== CHI TIẾT CHƯƠNG EX ===");
for (const chapter of exChapters) {
  const chapterQuestions = exQuestions.filter((q) => q.chapter === chapter.id);
  console.log(`${chapter.name}: ${chapterQuestions.length} câu`);
}
