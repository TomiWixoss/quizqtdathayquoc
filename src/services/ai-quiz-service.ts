import { GoogleGenAI, Type } from "@google/genai";
import { QTDA_CHAPTERS, type QTDAChapter } from "@/data/qtda-chapters";

// Rank levels với các bậc (tier) - từ thấp đến cao
export const RANK_LEVELS = [
  {
    id: "wood",
    name: "Gỗ",
    shortName: "Gỗ",
    tiers: 7,
    minScore: 0,
    difficulty: 1,
    folder: "Wood",
  },
  {
    id: "stone",
    name: "Đá",
    shortName: "Đá",
    tiers: 7,
    minScore: 100,
    difficulty: 2,
    folder: "Stone",
  },
  {
    id: "bronze",
    name: "Đồng",
    shortName: "Đồng",
    tiers: 7,
    minScore: 300,
    difficulty: 3,
    folder: "Bronze",
  },
  {
    id: "silver",
    name: "Bạc",
    shortName: "Bạc",
    tiers: 7,
    minScore: 600,
    difficulty: 4,
    folder: "Silver",
  },
  {
    id: "gold",
    name: "Vàng",
    shortName: "Vàng",
    tiers: 7,
    minScore: 1000,
    difficulty: 5,
    folder: "Gold",
  },
  {
    id: "platinum",
    name: "Bạch Kim",
    shortName: "B.Kim",
    tiers: 7,
    minScore: 1500,
    difficulty: 6,
    folder: "Platinum",
  },
  {
    id: "amethyst",
    name: "Thạch Anh",
    shortName: "T.Anh",
    tiers: 7,
    minScore: 2200,
    difficulty: 7,
    folder: "Amethyst",
  },
  {
    id: "onyx",
    name: "Hắc Ngọc",
    shortName: "H.Ngọc",
    tiers: 7,
    minScore: 3000,
    difficulty: 8,
    folder: "Onyx",
  },
  {
    id: "master",
    name: "Huyền Thoại",
    shortName: "H.Thoại",
    tiers: 0, // Không có tier, tính theo điểm tăng dần
    minScore: 4000,
    difficulty: 10,
    folder: "Master",
    isMaster: true, // Flag đặc biệt cho rank Huyền Thoại
  },
] as const;

export type RankId = (typeof RANK_LEVELS)[number]["id"];

export interface UserRank {
  rankId: RankId;
  tier: number;
  points: number;
  rankName: string;
}

export interface AIQuestion {
  id: string;
  type:
    | "multiple_choice"
    | "fill_blank"
    | "matching"
    | "true_false"
    | "ordering"
    | "multi_select" // Chọn nhiều đáp án đúng
    | "scenario"; // Tình huống thực tế
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  pairs?: { left: string; right: string }[];
  scenario?: string; // Mô tả tình huống cho câu hỏi scenario
  items?: string[];
  distractors?: string[]; // Các từ gây nhiễu cho fill_blank (AI tự sinh)
}

export interface AIQuizSession {
  questions: AIQuestion[];
  currentIndex: number;
  score: number;
  rank: UserRank;
  startTime: number;
  correctCount: number;
  wrongCount: number;
}

// Hàm random chọn 1 chương từ QTDA_CHAPTERS
function getRandomChapter(): QTDAChapter {
  const randomIndex = Math.floor(Math.random() * QTDA_CHAPTERS.length);
  return QTDA_CHAPTERS[randomIndex];
}

// Tạo system prompt từ nội dung 1 chương được chọn
function buildSystemPrompt(chapter: QTDAChapter): string {
  return `Bạn là AI chuyên gia về Quản Trị Dự Án CNTT. Dưới đây là nội dung kiến thức bạn cần dựa vào để tạo câu hỏi:

=== ${chapter.name} ===
${chapter.content}

⚠️ QUY TẮC QUAN TRỌNG:
1. CHỈ tạo câu hỏi dựa trên nội dung kiến thức của chương này
2. KHÔNG tạo câu hỏi về nội dung không có trong tài liệu
3. Đảm bảo đáp án đúng phải chính xác theo nội dung tài liệu
4. Giải thích phải trích dẫn hoặc tham chiếu đến nội dung trong tài liệu`;
}

// Schema cho Structured Outputs (dùng Type enum của Gemini)
const questionSchema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "ID duy nhất của câu hỏi" },
          type: {
            type: Type.STRING,
            enum: [
              "multiple_choice",
              "true_false",
              "fill_blank",
              "matching",
              "ordering",
              "multi_select",
              "scenario",
            ],
            description: "Loại câu hỏi",
          },
          question: { type: Type.STRING, description: "Nội dung câu hỏi" },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description:
              "Các lựa chọn cho câu hỏi multiple_choice, true_false, multi_select, scenario",
          },
          correctAnswer: {
            type: Type.STRING,
            description:
              "Đáp án đúng (string cho single answer, JSON array string cho multi answer)",
          },
          explanation: { type: Type.STRING, description: "Giải thích đáp án" },
          pairs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                left: { type: Type.STRING },
                right: { type: Type.STRING },
              },
              required: ["left", "right"],
            },
            description: "Các cặp ghép cho câu hỏi matching",
          },
          items: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Các mục cần sắp xếp cho câu hỏi ordering",
          },
          distractors: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3 từ gây nhiễu cho câu hỏi fill_blank",
          },
          scenario: {
            type: Type.STRING,
            description: "Mô tả tình huống thực tế cho câu hỏi scenario",
          },
        },
        required: ["id", "type", "question", "correctAnswer", "explanation"],
        propertyOrdering: [
          "id",
          "type",
          "question",
          "options",
          "correctAnswer",
          "explanation",
          "pairs",
          "items",
          "distractors",
          "scenario",
        ],
      },
      description: "Danh sách câu hỏi",
    },
  },
  required: ["questions"],
  propertyOrdering: ["questions"],
};

// Hàm lấy rank từ điểm
export function getRankFromPoints(points: number): UserRank {
  let currentRank: (typeof RANK_LEVELS)[number] = RANK_LEVELS[0];

  for (const rank of RANK_LEVELS) {
    if (points >= rank.minScore) {
      currentRank = rank;
    } else {
      break;
    }
  }

  // Xử lý đặc biệt cho rank Master (Huyền Thoại)
  if (currentRank.id === "master") {
    return {
      rankId: currentRank.id as RankId,
      tier: 0, // Không có tier
      points,
      rankName: currentRank.name, // Chỉ hiện "Huyền Thoại"
    };
  }

  const nextRank = RANK_LEVELS.find((r) => r.minScore > currentRank.minScore);
  const pointsInRank = points - currentRank.minScore;
  const pointsPerTier = nextRank
    ? (nextRank.minScore - currentRank.minScore) / currentRank.tiers
    : 200;

  const tierFromBottom = Math.min(
    Math.floor(pointsInRank / pointsPerTier),
    currentRank.tiers - 1
  );
  const tier = currentRank.tiers - tierFromBottom;

  return {
    rankId: currentRank.id as RankId,
    tier,
    points,
    rankName: `${currentRank.name} ${tier}`,
  };
}

// Hàm lấy ảnh rank - tier 7 (thấp nhất) = ảnh 1, tier 1 (cao nhất) = ảnh 7
export function getRankImage(rank: UserRank): string {
  const rankInfo = RANK_LEVELS.find((r) => r.id === rank.rankId);
  if (!rankInfo) return "/Rank/Wood/rank-wood-1_NoOL_large.png";

  // Rank Master dùng icon riêng
  if (rank.rankId === "master") {
    return "/Rank/master.png";
  }

  // Đảo ngược: tier 7 -> ảnh 1, tier 1 -> ảnh 7
  const imageNumber = 8 - rank.tier;
  return `/Rank/${rankInfo.folder}/rank-${rank.rankId}-${imageNumber}_NoOL_large.png`;
}

// Tạo prompt dựa trên rank, tier và chương được chọn
function buildQuestionPrompt(
  rank: UserRank,
  questionCount: number,
  selectedChapter: QTDAChapter
): string {
  const difficulty =
    RANK_LEVELS.find((r) => r.id === rank.rankId)?.difficulty || 1;
  const totalDifficulty = difficulty + (8 - rank.tier) * 0.5;

  let difficultyDesc = "";
  let questionTypes = "";
  let creativity = "";

  // Điều chỉnh độ khó: nâng cao ngưỡng cho các loại câu hỏi khó
  // Tất cả đều BÁM SÁT tài liệu, chỉ khác ở cách hỏi và độ phức tạp
  if (totalDifficulty <= 3) {
    // Gỗ, Đá (tier thấp)
    difficultyDesc = "DỄ - Câu hỏi trực tiếp từ tài liệu, dễ nhận biết đáp án";
    questionTypes = "multiple_choice, true_false";
    creativity =
      "Hỏi trực tiếp định nghĩa, khái niệm cơ bản. Đáp án sai rõ ràng khác biệt với đáp án đúng.";
  } else if (totalDifficulty <= 5) {
    // Đá (tier cao), Đồng
    difficultyDesc =
      "TRUNG BÌNH DỄ - Câu hỏi bám sát tài liệu, cần nhớ chi tiết";
    questionTypes = "multiple_choice, true_false, fill_blank";
    creativity =
      "Hỏi về chi tiết trong tài liệu, các đáp án sai có thể gần giống đáp án đúng.";
  } else if (totalDifficulty <= 7) {
    // Bạc, Vàng (tier thấp)
    difficultyDesc = "TRUNG BÌNH - Câu hỏi cần hiểu nội dung, không chỉ nhớ";
    questionTypes = "multiple_choice, true_false, fill_blank, matching";
    creativity =
      "Diễn đạt lại câu hỏi theo cách khác, hỏi về mối quan hệ giữa các khái niệm trong tài liệu.";
  } else if (totalDifficulty <= 9) {
    // Vàng (tier cao), Bạch Kim
    difficultyDesc = "KHÓ - Câu hỏi đòi hỏi hiểu sâu và liên kết kiến thức";
    questionTypes =
      "multiple_choice, fill_blank, matching, ordering, multi_select";
    creativity =
      "Hỏi về quy trình, thứ tự các bước, kết hợp nhiều khái niệm trong cùng chương. Đáp án sai rất gần với đáp án đúng.";
  } else if (totalDifficulty <= 11) {
    // Thạch Anh, Hắc Ngọc
    difficultyDesc = "RẤT KHÓ - Câu hỏi phân tích, vận dụng kiến thức";
    questionTypes =
      "multiple_choice, fill_blank, matching, ordering, multi_select, scenario";
    creativity =
      "Đặt câu hỏi trong tình huống cụ thể, yêu cầu phân tích và áp dụng kiến thức từ tài liệu. Các đáp án đều có vẻ hợp lý.";
  } else {
    // Rank Master (Huyền Thoại) - Độ khó cao nhất
    difficultyDesc = "HUYỀN THOẠI - Câu hỏi tổng hợp, phân tích chuyên sâu";
    questionTypes =
      "multiple_choice, fill_blank, matching, ordering, multi_select, scenario";
    creativity =
      "Tạo tình huống phức tạp đòi hỏi hiểu sâu toàn bộ nội dung chương. Các đáp án đều rất gần đúng, chỉ khác ở chi tiết nhỏ.";
  }

  // Tạo seed ngẫu nhiên để AI tạo câu hỏi khác nhau mỗi lần
  const randomSeed = Math.floor(Math.random() * 1000000);
  const timestamp = Date.now();

  return `Bạn là AI tạo câu hỏi trắc nghiệm về Quản Trị Dự Án CNTT.

⚠️ BẮT BUỘC: TẤT CẢ CÂU HỎI, ĐÁP ÁN, GIẢI THÍCH PHẢI BẰNG TIẾNG VIỆT. KHÔNG DÙNG TIẾNG ANH HAY NGÔN NGỮ KHÁC.

🎲 SESSION ID: ${randomSeed}-${timestamp}
(Dùng session ID này để tạo bộ câu hỏi HOÀN TOÀN MỚI, KHÁC với các lần trước)

RANK HIỆN TẠI: ${rank.rankName} (Độ khó: ${totalDifficulty.toFixed(1)}/12)
MỨC ĐỘ: ${difficultyDesc}
SÁNG TẠO: ${creativity}

📚 TẠO CÂU HỎI TỪ CHƯƠNG: ${selectedChapter.name}
(Nội dung chương đã được cung cấp trong system prompt)

Tạo ${questionCount} câu hỏi với các loại CÓ THỂ DÙNG: ${questionTypes}

⚠️ YÊU CẦU QUAN TRỌNG:
- BÁM SÁT NỘI DUNG TÀI LIỆU: Tất cả câu hỏi và đáp án PHẢI dựa trên nội dung chương đã cung cấp
- KHÔNG bịa thông tin không có trong tài liệu
- PHẢI tạo câu hỏi KHÁC NHAU mỗi lần gọi, KHÔNG lặp lại câu hỏi cũ
- Mỗi câu hỏi phải có ID duy nhất (dùng format: q_${randomSeed}_1, q_${randomSeed}_2, ...)

🎯 VỀ ĐỘ KHÓ:
- Độ khó KHÔNG phải là hỏi ngoài tài liệu, mà là CÁCH HỎI phức tạp hơn
- Rank thấp: Hỏi trực tiếp, đáp án sai dễ loại
- Rank cao: Hỏi gián tiếp, đáp án sai rất gần đúng, cần hiểu sâu mới phân biệt được

🎯 VỀ LOẠI CÂU HỎI:
- TỰ DO chọn loại câu hỏi phù hợp với nội dung, KHÔNG cần theo thứ tự
- Có thể tạo nhiều câu cùng loại, hoặc đa dạng các loại - tùy nội dung phù hợp
- Ưu tiên loại câu hỏi PHÙ HỢP với kiến thức trong chương

QUY TẮC:
- NGÔN NGỮ: Chỉ dùng tiếng Việt cho tất cả nội dung
- multiple_choice: 4 options, correctAnswer là 1 trong các options
- true_false: options là ["Đúng", "Sai"], correctAnswer là "Đúng" hoặc "Sai"
- fill_blank: question có chỗ trống ___, correctAnswer là từ cần điền, distractors là mảng 3 từ gây nhiễu (từ liên quan nhưng SAI, phải khác correctAnswer)
- matching: pairs là mảng {left, right}, correctAnswer là mảng ["0-0", "1-1"...] 
- ordering: items là mảng cần sắp xếp, correctAnswer là mảng đúng thứ tự
- multi_select: 5-6 options, correctAnswer là MẢNG các đáp án đúng (2-3 đáp án), câu hỏi phải ghi rõ "Chọn TẤT CẢ đáp án đúng"
- scenario: scenario là mô tả tình huống thực tế (2-3 câu), question là câu hỏi về tình huống đó, 4 options, correctAnswer là 1 đáp án`;
}

// Gemini API keys (đọc từ VITE_GEMINI_API_KEY_1, VITE_GEMINI_API_KEY_2, ...)
function getGeminiApiKeys(): string[] {
  const keys: string[] = [];
  for (let i = 1; i <= 30; i++) {
    const key = import.meta.env[`VITE_GEMINI_API_KEY_${i}`];
    if (key && key.trim()) {
      keys.push(key.trim());
    }
  }
  return keys;
}

const geminiApiKeys = getGeminiApiKeys();

// Index của key đang dùng
let currentGeminiKeyIndex = 0;

// Kiểm tra lỗi có phải rate limit không
function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes("429") ||
      error.message.includes("rate limit") ||
      error.message.includes("RESOURCE_EXHAUSTED") ||
      error.message.includes("quota") ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any).status === 429
    );
  }
  return false;
}

// Gọi Gemini API với key rotation
async function callGemini(
  systemPrompt: string,
  userPrompt: string
): Promise<AIQuestion[]> {
  const totalKeys = geminiApiKeys.length;
  let triedKeys = 0;

  while (triedKeys < totalKeys) {
    const apiKey = geminiApiKeys[currentGeminiKeyIndex];
    const client = new GoogleGenAI({ apiKey });

    console.log(
      `🔑 Using Gemini key ${currentGeminiKeyIndex + 1}/${totalKeys}`
    );

    try {
      const response = await client.models.generateContent({
        model: "models/gemini-flash-latest",
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.9,
          thinkingConfig: {
            thinkingBudget: 24576,
          },
          responseMimeType: "application/json",
          responseSchema: questionSchema,
        },
      });

      const content = response.text || "";
      const parsed = JSON.parse(content);
      return parsed.questions || [];
    } catch (error) {
      if (isRateLimitError(error)) {
        console.warn(
          `⚠️ Gemini key ${
            currentGeminiKeyIndex + 1
          } rate limited, trying next key...`
        );
        currentGeminiKeyIndex = (currentGeminiKeyIndex + 1) % totalKeys;
        triedKeys++;
      } else {
        throw error;
      }
    }
  }

  // Tất cả keys đều bị rate limit
  throw new Error("ALL_GEMINI_KEYS_RATE_LIMITED");
}

// Tạo câu hỏi từ AI với Structured Outputs
// Random chọn 1 chương và gửi nội dung chương đó cho AI tạo câu hỏi
// Xoay vòng key khi bị rate limit (429)
export async function generateAIQuestions(
  rank: UserRank,
  questionCount: number = 5
): Promise<AIQuestion[]> {
  // Random chọn 1 chương
  const selectedChapter = getRandomChapter();

  console.log("📚 Chương được chọn:", selectedChapter.shortName);

  // Tạo system prompt từ nội dung chương được chọn
  const systemPrompt = buildSystemPrompt(selectedChapter);

  // Tạo user prompt với thông tin rank và yêu cầu
  const userPrompt = buildQuestionPrompt(rank, questionCount, selectedChapter);

  try {
    // Thử gọi Gemini với key rotation
    return await callGemini(systemPrompt, userPrompt);
  } catch (error) {
    // Nếu tất cả Gemini keys đều bị rate limit, dùng fallback questions
    const allKeysRateLimited =
      error instanceof Error &&
      error.message === "ALL_GEMINI_KEYS_RATE_LIMITED";

    if (allKeysRateLimited) {
      console.warn(
        "⚠️ All Gemini keys rate limited, using fallback questions..."
      );
      return getFallbackQuestions(questionCount);
    }

    console.error("Error generating AI questions:", error);
    return getFallbackQuestions(questionCount);
  }
}

// Câu hỏi dự phòng khi AI lỗi
function getFallbackQuestions(count: number): AIQuestion[] {
  const fallback: AIQuestion[] = [
    {
      id: "fb1",
      type: "multiple_choice",
      question: "Dự án là gì?",
      options: [
        "Là hoạt động nghiên cứu mang tính lý thuyết",
        "Là công việc lặp lại nhiều lần theo chu kỳ",
        "Là hoạt động có phương pháp, sử dụng nguồn lực để tạo sản phẩm mới",
        "Là kế hoạch sản xuất được áp dụng lâu dài",
      ],
      correctAnswer:
        "Là hoạt động có phương pháp, sử dụng nguồn lực để tạo sản phẩm mới",
      explanation:
        "Dự án là hoạt động có phương pháp, sử dụng nguồn lực để tạo sản phẩm mới.",
    },
    {
      id: "fb2",
      type: "true_false",
      question:
        "Quản lý dự án CNTT là việc tổ chức các hoạt động nhằm đạt được mục tiêu trong giới hạn về thời gian, kinh phí và chất lượng.",
      options: ["Đúng", "Sai"],
      correctAnswer: "Đúng",
      explanation: "Đây là định nghĩa chính xác về quản lý dự án CNTT.",
    },
    {
      id: "fb3",
      type: "fill_blank",
      question:
        "Giao tiếp hiệu quả nhất diễn ra khi giao tiếp ___, mặt đối mặt giữa hai bên.",
      correctAnswer: "trực tiếp",
      explanation:
        "Giao tiếp trực tiếp, mặt đối mặt là hình thức hiệu quả nhất.",
    },
    {
      id: "fb4",
      type: "multiple_choice",
      question: "Mục tiêu của dự án là gì?",
      options: [
        "Giải quyết vấn đề thực tế và đáp ứng nhu cầu người dùng",
        "Đưa ra mô hình khoa học và phương pháp nghiên cứu",
        "Xây dựng chiến lược tài chính cho tổ chức",
        "Phát triển hệ thống phần mềm phục vụ nghiên cứu",
      ],
      correctAnswer: "Giải quyết vấn đề thực tế và đáp ứng nhu cầu người dùng",
      explanation:
        "Mục tiêu của dự án là giải quyết vấn đề thực tế và đáp ứng nhu cầu người dùng.",
    },
    {
      id: "fb5",
      type: "true_false",
      question:
        "Đường găng (Critical Path) là chuỗi hoạt động dài nhất quyết định thời gian hoàn thành dự án.",
      options: ["Đúng", "Sai"],
      correctAnswer: "Đúng",
      explanation:
        "Đường găng là chuỗi hoạt động dài nhất, quyết định thời gian tối thiểu để hoàn thành dự án.",
    },
  ];
  return fallback.slice(0, count);
}

// Tính điểm thưởng/phạt dựa trên rank
export function calculateRankPoints(
  isCorrect: boolean,
  rank: UserRank,
  timeBonus: number = 0
): number {
  const basePoints = isCorrect ? 10 : -5;
  const difficultyMultiplier =
    RANK_LEVELS.find((r) => r.id === rank.rankId)?.difficulty || 1;
  const tierBonus = (8 - rank.tier) * 0.2;

  if (isCorrect) {
    return Math.round(
      basePoints * (1 + difficultyMultiplier * 0.1 + tierBonus) + timeBonus
    );
  }
  return basePoints;
}

// Kiểm tra đáp án
export function checkAnswer(
  question: AIQuestion,
  userAnswer: string | string[]
): boolean {
  switch (question.type) {
    case "multiple_choice":
    case "true_false":
    case "fill_blank":
    case "scenario": {
      const correct = String(question.correctAnswer).toLowerCase().trim();
      const user = String(userAnswer).toLowerCase().trim();
      return (
        correct === user || correct.includes(user) || user.includes(correct)
      );
    }

    case "matching": {
      if (
        !Array.isArray(userAnswer) ||
        !Array.isArray(question.correctAnswer)
      ) {
        return false;
      }
      return (
        JSON.stringify([...userAnswer].sort()) ===
        JSON.stringify([...(question.correctAnswer as string[])].sort())
      );
    }

    case "ordering": {
      if (
        !Array.isArray(userAnswer) ||
        !Array.isArray(question.correctAnswer)
      ) {
        return false;
      }
      return (
        JSON.stringify(userAnswer) === JSON.stringify(question.correctAnswer)
      );
    }

    case "multi_select": {
      // Multi-select: phải chọn đúng TẤT CẢ đáp án, không thừa không thiếu
      if (
        !Array.isArray(userAnswer) ||
        !Array.isArray(question.correctAnswer)
      ) {
        return false;
      }
      const userSorted = [...userAnswer].sort();
      const correctSorted = [...(question.correctAnswer as string[])].sort();
      return JSON.stringify(userSorted) === JSON.stringify(correctSorted);
    }

    default:
      return false;
  }
}
