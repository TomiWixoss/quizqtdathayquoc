import Cerebras from "@cerebras/cerebras_cloud_sdk";

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
    | "ordering";
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  pairs?: { left: string; right: string }[];
  items?: string[];
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

// System prompt - BẠN TỰ ĐIỀN NỘI DUNG QTDA VÀO ĐÂY
const QTDA_SYSTEM_PROMPT = `
[ĐIỀN NỘI DUNG QTDA.txt VÀO ĐÂY]
`;

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
  // Đảo ngược: tier 7 -> ảnh 1, tier 1 -> ảnh 7
  const imageNumber = 8 - rank.tier;
  return `/Rank/${rankInfo.folder}/rank-${rank.rankId}-${imageNumber}_NoOL_large.png`;
}

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
    questionTypes = "multiple_choice, fill_blank, matching, ordering";
    creativity =
      "Tạo câu hỏi suy luận, kết hợp nhiều khái niệm, tình huống thực tế";
  } else if (totalDifficulty <= 10) {
    difficultyDesc =
      "RẤT KHÓ - Câu hỏi nâng cao, cần nắm vững toàn bộ lý thuyết";
    questionTypes = "multiple_choice, fill_blank, matching, ordering";
    creativity =
      "Tạo câu hỏi hoàn toàn mới dựa trên kiến thức, tình huống phức tạp";
  } else {
    difficultyDesc = "SIÊU KHÓ - Bậc thầy, cần hiểu sâu và vận dụng linh hoạt";
    questionTypes = "multiple_choice, fill_blank, matching, ordering";
    creativity =
      "Tạo câu hỏi theo lối hoàn toàn khác, kết hợp đa chương, phân tích case study";
  }

  return `Bạn là AI tạo câu hỏi trắc nghiệm về Quản Trị Dự Án CNTT.

⚠️ BẮT BUỘC: TẤT CẢ CÂU HỎI, ĐÁP ÁN, GIẢI THÍCH PHẢI BẰNG TIẾNG VIỆT. KHÔNG DÙNG TIẾNG ANH HAY NGÔN NGỮ KHÁC.

RANK HIỆN TẠI: ${rank.rankName} (Độ khó: ${totalDifficulty.toFixed(1)}/12)
MỨC ĐỘ: ${difficultyDesc}
SÁNG TẠO: ${creativity}

Tạo ${questionCount} câu hỏi với các loại: ${questionTypes}

QUY TẮC:
- NGÔN NGỮ: Chỉ dùng tiếng Việt cho tất cả nội dung
- multiple_choice: 4 options, correctAnswer là 1 trong các options
- true_false: options là ["Đúng", "Sai"], correctAnswer là "Đúng" hoặc "Sai"
- fill_blank: question có chỗ trống ___, correctAnswer là từ cần điền
- matching: pairs là mảng {left, right}, correctAnswer là mảng ["0-0", "1-1"...] 
- ordering: items là mảng cần sắp xếp, correctAnswer là mảng đúng thứ tự`;
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
    const response = await client.chat.completions.create({
      model: "gpt-oss-120b",
      messages: [
        { role: "system", content: QTDA_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      max_completion_tokens: 65536,
      temperature: 0.7,
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
    case "fill_blank": {
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

    default:
      return false;
  }
}
