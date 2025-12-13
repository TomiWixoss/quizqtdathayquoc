import Cerebras from "@cerebras/cerebras_cloud_sdk";
import { QTDA_CONTENT } from "@/data/qtda-content";

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

// System prompt - Nội dung được import từ file riêng
const QTDA_SYSTEM_PROMPT = QTDA_CONTENT;

// JSON Schema cho Structured Outputs
const questionSchema = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          type: {
            type: "string",
            enum: [
              "multiple_choice",
              "true_false",
              "fill_blank",
              "matching",
              "ordering",
              "multi_select",
              "scenario",
            ],
          },
          question: { type: "string" },
          options: {
            type: "array",
            items: { type: "string" },
          },
          correctAnswer: {
            anyOf: [
              { type: "string" },
              { type: "array", items: { type: "string" } },
            ],
          },
          explanation: { type: "string" },
          pairs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                left: { type: "string" },
                right: { type: "string" },
              },
              required: ["left", "right"],
              additionalProperties: false,
            },
          },
          items: {
            type: "array",
            items: { type: "string" },
          },
          distractors: {
            type: "array",
            items: { type: "string" },
            description: "3 từ gây nhiễu cho câu hỏi fill_blank",
          },
          scenario: {
            type: "string",
            description: "Mô tả tình huống thực tế cho câu hỏi scenario",
          },
        },
        required: ["id", "type", "question", "correctAnswer", "explanation"],
        additionalProperties: false,
      },
    },
  },
  required: ["questions"],
  additionalProperties: false,
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

// Danh sách đầy đủ 13 chương để random
const CHAPTERS = [
  "Chương 1: Tổng quan dự án",
  "Chương 2: Giao tiếp và truyền thông",
  "Chương 3: Ước lượng dự án",
  "Chương 4: Lập lịch dự án",
  "Chương 5: Kiểm soát và giám sát",
  "Chương 6: Quản lý phạm vi",
  "Chương 7: Quản lý thời gian",
  "Chương 8: Quản lý chi phí",
  "Chương 9: Quản lý chất lượng",
  "Chương 10: Quản lý nhân lực",
  "Chương 11: Truyền thông và giao tiếp",
  "Chương 12: Quản lý rủi ro",
  "Chương 13: Quản lý tích hợp",
];

// Tạo prompt dựa trên rank và tier
function buildQuestionPrompt(rank: UserRank, questionCount: number): string {
  const difficulty =
    RANK_LEVELS.find((r) => r.id === rank.rankId)?.difficulty || 1;
  const totalDifficulty = difficulty + (8 - rank.tier) * 0.5;

  let difficultyDesc = "";
  let questionTypes = "";
  let creativity = "";

  if (totalDifficulty <= 2) {
    difficultyDesc = "CỰC KỲ DỄ - Câu hỏi cơ bản, trực tiếp từ tài liệu";
    questionTypes = "multiple_choice, true_false";
    creativity = "Giữ nguyên câu hỏi như trong tài liệu";
  } else if (totalDifficulty <= 4) {
    difficultyDesc = "DỄ - Câu hỏi đơn giản, có thể thay đổi từ ngữ nhẹ";
    questionTypes = "multiple_choice, true_false, fill_blank";
    creativity = "Có thể đổi từ đồng nghĩa, giữ ý chính";
  } else if (totalDifficulty <= 6) {
    difficultyDesc = "TRUNG BÌNH - Câu hỏi có độ phức tạp vừa phải";
    questionTypes = "multiple_choice, fill_blank, matching";
    creativity = "Có thể diễn đạt lại câu hỏi theo cách khác, thêm ngữ cảnh";
  } else if (totalDifficulty <= 8) {
    difficultyDesc = "KHÓ - Câu hỏi đòi hỏi hiểu sâu kiến thức";
    questionTypes =
      "multiple_choice, fill_blank, matching, ordering, multi_select";
    creativity =
      "Tạo câu hỏi suy luận, kết hợp nhiều khái niệm, tình huống thực tế";
  } else if (totalDifficulty <= 10) {
    difficultyDesc =
      "RẤT KHÓ - Câu hỏi nâng cao, cần nắm vững toàn bộ lý thuyết";
    questionTypes =
      "multiple_choice, fill_blank, matching, ordering, multi_select, scenario";
    creativity =
      "Tạo câu hỏi hoàn toàn mới dựa trên kiến thức, tình huống phức tạp";
  } else {
    // Rank Master (Huyền Thoại) - Độ khó cao nhất
    difficultyDesc =
      "HUYỀN THOẠI - Bậc thầy, cần hiểu sâu và vận dụng linh hoạt";
    questionTypes =
      "multiple_choice, fill_blank, matching, ordering, multi_select, scenario";
    creativity =
      "Tạo câu hỏi theo lối hoàn toàn khác, kết hợp đa chương, phân tích case study phức tạp, tình huống thực tế đa chiều";
  }

  // Random chọn các chương để tạo câu hỏi đa dạng
  const shuffledChapters = [...CHAPTERS].sort(() => Math.random() - 0.5);
  const selectedChapters = shuffledChapters.slice(
    0,
    Math.min(questionCount, CHAPTERS.length)
  );

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

📚 CHỌN CÂU HỎI TỪ CÁC CHƯƠNG SAU (mỗi chương ít nhất 1 câu nếu có thể):
${selectedChapters.map((ch, i) => `${i + 1}. ${ch}`).join("\n")}

Tạo ${questionCount} câu hỏi với các loại: ${questionTypes}

⚠️ YÊU CẦU QUAN TRỌNG:
- PHẢI tạo câu hỏi KHÁC NHAU mỗi lần gọi, KHÔNG lặp lại câu hỏi cũ
- Chọn NGẪU NHIÊN các câu hỏi từ tài liệu, ưu tiên các chương được chỉ định
- Có thể BIẾN ĐỔI cách diễn đạt, thay đổi thứ tự đáp án
- Mỗi câu hỏi phải có ID duy nhất (dùng format: q_${randomSeed}_1, q_${randomSeed}_2, ...)

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

// Cerebras client
const client = new Cerebras({
  apiKey: import.meta.env.VITE_CEREBRAS_API_KEY || "",
});

// Tạo câu hỏi từ AI với Structured Outputs
export async function generateAIQuestions(
  rank: UserRank,
  questionCount: number = 5
): Promise<AIQuestion[]> {
  try {
    const prompt = buildQuestionPrompt(rank, questionCount);

    // Sử dụng model gpt-oss-120b với Structured Outputs
    // Temperature cao hơn (0.9) để tạo câu hỏi đa dạng hơn mỗi lần gọi
    const response = await client.chat.completions.create({
      model: "gpt-oss-120b",
      messages: [
        { role: "system", content: QTDA_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      max_completion_tokens: 65536,
      temperature: 0.9,
      top_p: 0.95,
      reasoning_effort: "high",
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "quiz_questions",
          strict: true,
          schema: questionSchema,
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content = (response as any).choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(content);
    return parsed.questions || [];
  } catch (error) {
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
