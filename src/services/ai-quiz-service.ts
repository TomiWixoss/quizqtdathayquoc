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
=== CHƯƠNG 1: TỔNG QUAN DỰ ÁN ===

Câu 1: Dự án là gì?
A. Là hoạt động nghiên cứu mang tính lý thuyết.
B. Là công việc lặp lại nhiều lần theo chu kỳ nhất định.
C. Là hoạt động có phương pháp, sử dụng nguồn lực để tạo sản phẩm mới.
D. Là kế hoạch sản xuất được áp dụng lâu dài.
=> ĐÁP ÁN ĐÚNG: C

Câu 2: Mục tiêu của dự án là gì?
A. Giải quyết vấn đề thực tế và đáp ứng nhu cầu người dùng.
B. Đưa ra mô hình khoa học và phương pháp nghiên cứu.
C. Xây dựng chiến lược tài chính cho tổ chức.
D. Phát triển hệ thống phần mềm phục vụ nghiên cứu.
=> ĐÁP ÁN ĐÚNG: A

Câu 3: Quản lý dự án CNTT là gì?
A. Là việc tổ chức các hoạt động nhằm đạt được mục tiêu trong giới hạn về thời gian, kinh phí và chất lượng.
B. Là công việc lập trình và phát triển phần mềm cho doanh nghiệp.
C. Là hoạt động nghiên cứu công nghệ thông tin ứng dụng.
D. Là kế hoạch kiểm thử và vận hành phần mềm.
=> ĐÁP ÁN ĐÚNG: A

Câu 4: Một dự án CNTT được đánh giá là thành công khi:
A. Hoàn thành đúng thời gian và đáp ứng yêu cầu người dùng.
B. Được đầu tư nguồn vốn lớn và có nhiều nhân lực tham gia.
C. Có sản phẩm ứng dụng công nghệ mới.
D. Sử dụng phần mềm quản lý hiện đại.
=> ĐÁP ÁN ĐÚNG: A

Câu 5: Trong giai đoạn khởi tạo dự án, người quản lý cần thực hiện việc nào sau đây?
A. Đánh giá hiệu quả sau khi bàn giao sản phẩm.
B. Xác định yêu cầu, mức ưu tiên và phân công trách nhiệm.
C. Thực hiện kiểm thử và viết tài liệu hướng dẫn.
D. Xây dựng báo cáo tài chính cuối kỳ.
=> ĐÁP ÁN ĐÚNG: B

Câu 6: Giai đoạn lập kế hoạch dự án có nhiệm vụ:
A. Hoàn thiện sản phẩm và bàn giao cho khách hàng.
B. Lập kế hoạch chi tiết, xác định phạm vi và điều chỉnh mục tiêu.
C. Thực hiện giám sát tiến độ dự án.
D. Đánh giá rủi ro và đề xuất kết thúc dự án.
=> ĐÁP ÁN ĐÚNG: B

Câu 7: Theo quy trình quản lý dự án phần mềm, giai đoạn kết thúc nhằm:
A. Thực hiện kiểm thử hệ thống và vận hành thử.
B. Chính thức đóng dự án và hoàn tất các hoạt động còn lại.
C. Triển khai nâng cấp và bảo trì phần mềm.
D. Lập kế hoạch cho dự án tiếp theo.
=> ĐÁP ÁN ĐÚNG: B

Câu 8: Một dự án CNTT thất bại chủ yếu vì:
A. Thiếu kế hoạch chi tiết và không hiểu rõ yêu cầu người dùng.
B. Sử dụng công nghệ lỗi thời hoặc quá hiện đại.
C. Thiếu nguồn vốn từ cơ quan nhà nước.
D. Thay đổi nhân sự trong quá trình bảo trì.
=> ĐÁP ÁN ĐÚNG: A

Câu 9: Theo phân loại dự án, dự án lớn thường có đặc điểm:
A. Nguồn kinh phí ít, nhân lực gọn nhẹ, thời gian ngắn.
B. Nhiều bên tham gia, phạm vi rộng và chi phí lớn.
C. Chỉ thực hiện trong phạm vi nội bộ.
D. Không cần có cơ cấu tổ chức riêng biệt.
=> ĐÁP ÁN ĐÚNG: B

Câu 10: Các nhiệm vụ trong hoạt động quản lý dự án bao gồm:
A. Quản lý thời gian, kinh phí, nhân lực và kết quả chuyển giao.
B. Quản lý công nghệ, truyền thông, dữ liệu và bảo mật.
C. Quản lý tài chính, kế toán, nhân sự và hành chính.
D. Quản lý phần cứng, phần mềm, mạng và tài liệu.
=> ĐÁP ÁN ĐÚNG: A

Câu 11: Mục đích của quản lý dự án là:
A. Đảm bảo sản phẩm đáp ứng yêu cầu, đúng hạn, trong giới hạn chi phí.
B. Đạt lợi nhuận cao nhất và mở rộng quy mô tổ chức.
C. Đưa ra giải pháp mới và cải tiến quy trình công nghệ.
D. Giảm thiểu rủi ro tài chính và nâng cao uy tín doanh nghiệp.
=> ĐÁP ÁN ĐÚNG: A

Câu 12: Trong quy trình lập kế hoạch, yếu tố ràng buộc của dự án gồm:
A. Thời gian, nhân lực và ngân sách.
B. Khách hàng, sản phẩm và thị trường.
C. Tài nguyên, kỹ năng và kỹ thuật.
D. Thời gian, địa điểm và công nghệ.
=> ĐÁP ÁN ĐÚNG: A

Câu 13: Dự án bên ngoài là:
A. Dự án phục vụ chính nội bộ tổ chức.
B. Dự án được thực hiện cho một đơn vị khác.
C. Dự án không có yếu tố khách hàng tham gia.
D. Dự án nghiên cứu phát triển nội bộ.
=> ĐÁP ÁN ĐÚNG: B

Câu 14: Khi một dự án kéo dài vượt 50% thời gian dự kiến, được coi là:
A. Dự án chậm tiến độ.
B. Dự án thất bại.
C. Dự án đang tạm dừng.
D. Dự án cần tái cấu trúc.
=> ĐÁP ÁN ĐÚNG: B

Câu 15: Một trong những nguyên nhân sâu xa khiến dự án thất bại là:
A. Bắt đầu lập trình khi chưa hiểu rõ yêu cầu thực tế.
B. Không có đủ kinh phí và nhân lực.
C. Không được khách hàng phê duyệt yêu cầu.
D. Sử dụng phần mềm không tương thích.
=> ĐÁP ÁN ĐÚNG: A

Câu 16: Để cân bằng bộ ba ràng buộc (phạm vi – chi phí – thời gian), nhà quản lý cần:
A. Cắt giảm phạm vi khi chi phí vượt quá giới hạn.
B. Phân tích ưu tiên, điều chỉnh linh hoạt giữa ba yếu tố.
C. Tăng ngân sách để rút ngắn tiến độ dự án.
D. Giữ nguyên thời gian, giảm chất lượng sản phẩm.
=> ĐÁP ÁN ĐÚNG: B

=== CHƯƠNG 2: GIAO TIẾP VÀ TRUYỀN THÔNG ===

Câu 1: Giao tiếp là gì?
A. Là quá trình truyền đạt thông tin bằng văn bản.
B. Là hành động truyền tin một chiều từ người nói đến người nghe.
C. Là quá trình trao đổi thông tin, tình cảm và hiểu biết giữa con người.
D. Là hoạt động truyền thông qua các phương tiện kỹ thuật.
=> ĐÁP ÁN ĐÚNG: C

Câu 2: Giao tiếp hiệu quả nhất diễn ra trong tình huống nào?
A. Giao tiếp trực tiếp, mặt đối mặt giữa hai bên.
B. Giao tiếp qua thư điện tử và báo cáo.
C. Giao tiếp qua điện thoại và tin nhắn.
D. Giao tiếp bằng các văn bản hành chính.
=> ĐÁP ÁN ĐÚNG: A

Câu 3: Trong bốn quy mô giao tiếp, quy mô nào là cơ bản nhất?
A. Giao tiếp với chính bản thân.
B. Giao tiếp nhóm.
C. Giao tiếp giữa các tổ chức.
D. Giao tiếp trong cộng đồng.
=> ĐÁP ÁN ĐÚNG: A

Câu 4: Nguyên tắc quan trọng nhất trong giao tiếp là:
A. Cạnh tranh và khẳng định bản thân.
B. Dùng quyền lực để điều khiển người khác.
C. Tôn trọng nhân cách và đối xử bình đẳng trong giao tiếp.
D. Giữ im lặng để tránh xung đột.
=> ĐÁP ÁN ĐÚNG: C

Câu 5: Theo thuyết “hoạt động”, giao tiếp là:
A. Quá trình biểu đạt cảm xúc bằng lời nói.
B. Phương tiện để thỏa mãn nhu cầu tâm lý.
C. Hệ thống quá trình có mục đích đảm bảo sự tương tác giữa người với người trong hoạt động tập thể.
D. Phản ứng tâm lý khi tiếp xúc xã hội.
=> ĐÁP ÁN ĐÚNG: C

Câu 6: Phong cách giao tiếp “độc đoán” có ưu điểm là:
A. Tạo môi trường dân chủ và hợp tác.
B. Giúp đưa ra quyết định nhanh chóng trong tình huống khẩn cấp.
C. Tăng sự tự tin và sáng tạo của cấp dưới.
D. Làm tăng tính dân chủ trong tổ chức.
=> ĐÁP ÁN ĐÚNG: B

Câu 7: Phong cách giao tiếp “dân chủ” được đặc trưng bởi:
A. Kiểm soát chặt chẽ và áp đặt ý kiến cá nhân.
B. Linh hoạt nhưng dễ thay đổi mục tiêu.
C. Biểu hiện sự tôn trọng, lắng nghe và hợp tác giữa các bên.
D. Không quan tâm đến cảm xúc người đối thoại.
=> ĐÁP ÁN ĐÚNG: C

Câu 8: Sự khác biệt giữa “nghe” và “lắng nghe” là gì?
A. “Nghe” chủ động, còn “lắng nghe” là thụ động.
B. “Nghe” là thụ động, còn “lắng nghe” là chủ động, có chọn lọc và tập trung.
C. “Nghe” dùng giác quan, còn “lắng nghe” dùng lý trí.
D. “Nghe” dành cho công việc, còn “lắng nghe” dành cho cảm xúc.
=> ĐÁP ÁN ĐÚNG: B

Câu 9: Một trong những yếu tố làm giảm hiệu quả lắng nghe là:
A. Giữ im lặng khi đối phương nói.
B. Ngắt lời hoặc đánh giá người nói khi chưa hiểu rõ.
C. Gật đầu và phản hồi tích cực.
D. Ghi chú lại các ý chính trong khi nghe.
=> ĐÁP ÁN ĐÚNG: B

Câu 10: Một trong các kỹ năng giúp rèn luyện lắng nghe hiệu quả là:
A. Tập trung vào phong cách người nói hơn là nội dung.
B. Phản biện liên tục để thể hiện hiểu biết.
C. Chú ý, tập trung, không ngắt lời và phản hồi đúng lúc.
D. Giữ khoảng cách để tránh bị chi phối cảm xúc.
=> ĐÁP ÁN ĐÚNG: C

Câu 11: Viết trong giao tiếp có vai trò gì?
A. Thể hiện cảm xúc và sự quan tâm cá nhân.
B. Là công cụ truyền tải thông tin chính xác, lưu trữ và xem xét chi tiết.
C. Là hình thức giao tiếp không chính thức.
D. Là cách thể hiện uy quyền và kiểm soát thông tin.
=> ĐÁP ÁN ĐÚNG: B

Câu 12: Một bài viết tốt cần đảm bảo yếu tố nào?
A. Cảm xúc, hình thức và bố cục.
B. Rõ ràng, súc tích, đúng ngữ pháp và dễ hiểu.
C. Dài dòng, chi tiết và dùng nhiều ví dụ.
D. Phức tạp, khoa trương và mang tính học thuật.
=> ĐÁP ÁN ĐÚNG: B

Câu 13: Trong kỹ năng nói, yếu tố quyết định hiệu quả là:
A. Nội dung bài nói dài và có số liệu.
B. Cách diễn đạt, giọng nói và sự tự tin khi trình bày.
C. Viết sẵn toàn bộ nội dung để đọc lại.
D. Dùng ngôn từ phức tạp và trừu tượng.
=> ĐÁP ÁN ĐÚNG: B

Câu 14: Trước khi thuyết trình, bước chuẩn bị quan trọng nhất là:
A. Viết lại toàn bộ bài thuyết trình từ trí nhớ.
B. Chuẩn bị trang phục phù hợp và phần thưởng.
C. Xác định mục tiêu, đối tượng người nghe và nội dung chính.
D. Học thuộc lòng toàn bộ nội dung bài nói.
=> ĐÁP ÁN ĐÚNG: C

Câu 15: Ngôn ngữ cơ thể trong khi nói giúp:
A. Làm giảm căng thẳng cho người nói.
B. Tăng tính thuyết phục và thể hiện cảm xúc chân thật.
C. Thay thế hoàn toàn lời nói trong giao tiếp.
D. Giảm nhu cầu sử dụng ngôn ngữ.
=> ĐÁP ÁN ĐÚNG: B

Câu 16: Thuyết trình bằng cách “đọc toàn văn bài viết” có hạn chế gì?
A. Giúp đảm bảo tính chính xác của nội dung.
B. Gây buồn chán, thiếu tương tác và khó thu hút người nghe.
C. Tăng khả năng ghi nhớ cho người nói.
D. Thể hiện sự chuyên nghiệp trong trình bày.
=> ĐÁP ÁN ĐÚNG: B

Câu 17: Theo Maslow, nguyên nhân khiến người thuyết trình hồi hộp là do:
A. Lo ngại phản ứng tiêu cực từ khán giả.
B. Nhu cầu an toàn bị đe dọa trong tình huống công khai.
C. Thiếu sự chuẩn bị và kinh nghiệm.
D. Sợ mất vị thế xã hội và uy tín cá nhân.
=> ĐÁP ÁN ĐÚNG: A

Câu 18: Yếu tố phi ngôn từ trong giao tiếp gồm:
A. Giọng nói, từ ngữ và cấu trúc câu.
B. Nội dung, cách viết và thái độ.
C. Ánh mắt, cử chỉ, tư thế, trang phục và nét mặt.
D. Hình thức trình bày văn bản.
=> ĐÁP ÁN ĐÚNG: C

Câu 19: Trong giao tiếp nhóm, để đạt hiệu quả cần:
A. Tránh bất đồng và chấp nhận mọi ý kiến.
B. Lắng nghe, tôn trọng và phối hợp hài hòa giữa các thành viên.
C. Phân chia nhiệm vụ không rõ ràng để linh hoạt hơn.
D. Chỉ tập trung vào mục tiêu cá nhân.
=> ĐÁP ÁN ĐÚNG: B

Câu 20: Khi viết báo cáo hoặc email công việc, điều cần tránh nhất là:
A. Viết ngắn gọn, rõ ràng và đúng chính tả.
B. Ghi chú đầy đủ các số liệu quan trọng.
C. Dùng từ ngữ cảm tính, thiếu trọng tâm và không có cấu trúc.
D. Trình bày nội dung theo thứ tự logic.
=> ĐÁP ÁN ĐÚNG: C

=== CHƯƠNG 3: ƯỚC LƯỢNG DỰ ÁN ===

Câu 1: “Ước lượng” trong quản lý dự án là gì?
A. Quá trình kiểm tra và điều chỉnh chi phí thực tế của dự án.
B. Quá trình dự đoán công sức, chi phí và thời gian cần thiết để hoàn thành công việc.
C. Quá trình so sánh kết quả thực tế với kế hoạch ban đầu.
D. Hoạt động tổng kết sau khi dự án kết thúc.
=> ĐÁP ÁN ĐÚNG: B

Câu 2: Khi dự án tiến triển và thông tin rõ hơn, sai số ước lượng có xu hướng:
A. Tăng dần do rủi ro cao hơn.
B. Giảm dần nhờ dữ liệu thực tế được cập nhật.
C. Không thay đổi vì đã có dự báo ban đầu.
D. Phụ thuộc vào ý kiến của khách hàng.
=> ĐÁP ÁN ĐÚNG: B

Câu 3: Phương pháp ước lượng “đánh giá chuyên gia” dựa trên yếu tố nào?
A. Kinh nghiệm và kiến thức thực tế của các chuyên gia trong lĩnh vực.
B. Số liệu thống kê từ các dự án đã hoàn thành.
C. Mức chi phí trung bình của ngành.
D. Quy định kỹ thuật của cơ quan quản lý.
=> ĐÁP ÁN ĐÚNG: A

Câu 4: Ưu điểm của phương pháp “đánh giá chuyên gia” là:
A. Nhanh chóng, có thể chính xác nếu chọn đúng chuyên gia.
B. Tiết kiệm chi phí và dễ tự động hóa.
C. Không phụ thuộc vào con người.
D. Phù hợp với các dự án chưa có dữ liệu lịch sử.
=> ĐÁP ÁN ĐÚNG: A

Câu 5: Nhược điểm của phương pháp “đánh giá chuyên gia” là:
A. Tốn thời gian và chi phí cao.
B. Phụ thuộc vào chủ quan và kinh nghiệm cá nhân.
C. Không áp dụng cho các dự án nhỏ.
D. Không phù hợp với dự án phần mềm.
=> ĐÁP ÁN ĐÚNG: B

Câu 6: Phương pháp ước lượng “quy trình lịch sử” dựa vào:
A. Cảm nhận của nhóm dự án về tiến độ công việc.
B. Dữ liệu và kết quả thực tế từ các dự án trước đó.
C. Báo cáo tài chính và chi phí đầu tư.
D. Thời gian thực hiện trung bình của dự án mẫu.
=> ĐÁP ÁN ĐÚNG: B

Câu 7: Khi sử dụng “quy trình lịch sử” để ước lượng, yếu tố quan trọng nhất là:
A. Có cơ sở dữ liệu đầy đủ về thời gian, chi phí và nhân lực dự án trước.
B. Tính toán theo cảm tính và kinh nghiệm cá nhân.
C. Áp dụng quy tắc phần trăm tăng trưởng.
D. Dựa vào mô hình dự toán tài chính.
=> ĐÁP ÁN ĐÚNG: A

Câu 8: Công thức COCOMO được dùng để ước lượng:
A. Chi phí, thời gian, nhân lực và lịch biểu của dự án phần mềm.
B. Rủi ro, chất lượng và chi phí vận hành.
C. Tài nguyên phần cứng và hiệu năng hệ thống.
D. Kế hoạch đào tạo và bảo trì sản phẩm.
=> ĐÁP ÁN ĐÚNG: A

Câu 9: Trong mô hình COCOMO, thông tin đầu vào quan trọng nhất là:
A. Số dòng lệnh mã nguồn (LOSC) dự kiến.
B. Số lượng lập trình viên tham gia.
C. Mức lương bình quân của nhóm kỹ thuật.
D. Tốc độ xử lý của hệ thống máy tính.
=> ĐÁP ÁN ĐÚNG: A

Câu 10: Phương pháp “điểm chức năng” dùng để:
A. Đo độ phức tạp và khối lượng công việc của phần mềm.
B. Đánh giá chất lượng mã nguồn chương trình.
C. Kiểm thử hiệu năng hệ thống.
D. Đo tốc độ xử lý của phần mềm.
=> ĐÁP ÁN ĐÚNG: A

Câu 11: Theo công thức D=C×(G+J), trong đó D là thời gian thực hiện, C là độ phức tạp, G là kinh nghiệm, J là tri thức chuyên môn, ta hiểu rằng:
A. Thời gian hoàn thành phụ thuộc vào độ phức tạp và năng lực người thực hiện.
B. Hiệu năng hệ thống quyết định hoàn toàn thời gian dự án.
C. Chỉ cần kinh nghiệm chung là đủ để giảm thời gian.
D. Tri thức chuyên môn không ảnh hưởng đến tiến độ.
=> ĐÁP ÁN ĐÚNG: A

Câu 12: Một nguyên tắc quan trọng của quy tắc ước lượng theo DEC là:
A. Nên để người mới ước lượng để có góc nhìn khách quan.
B. Không cần thảo luận khi có sai khác giữa các nhóm.
C. Nếu có chênh lệch lớn giữa các nhóm ước lượng, phải họp lại để thống nhất.
D. Lấy trung bình cộng của mọi kết quả ước lượng để tăng độ tin cậy.
=> ĐÁP ÁN ĐÚNG: C

Câu 13: Yếu tố nào là nguyên nhân chính khiến việc ước lượng sai lệch lớn?
A. Không có dữ liệu lịch sử hoặc không phân tích kỹ yêu cầu dự án.
B. Thiếu nhân lực có trình độ cao.
C. Do khách hàng thay đổi yêu cầu giữa chừng.
D. Do thiết bị phần cứng chưa ổn định.
=> ĐÁP ÁN ĐÚNG: A

Câu 14: Theo quy tắc DEC, vì sao không nên ép buộc lập trình viên đưa ra ước lượng?
A. Vì họ không có khả năng tính toán.
B. Vì họ thường đánh giá quá thấp công việc.
C. Vì việc ép buộc làm mất tính khách quan và giảm độ tin cậy của kết quả.
D. Vì họ không có trách nhiệm với tiến độ dự án.
=> ĐÁP ÁN ĐÚNG: C

Câu 15: Theo DEC, cách xử lý hợp lý nhất khi có nhiều ước lượng khác nhau cho cùng một công việc là:
A. Chọn giá trị cao nhất để tránh thiếu hụt thời gian.
B. Lấy trung bình cộng để đảm bảo cân bằng.
C. Tổ chức thảo luận để tìm nguyên nhân sai khác và thống nhất lại kết quả.
D. Chọn ngẫu nhiên một kết quả và điều chỉnh sau.
=> ĐÁP ÁN ĐÚNG: C

Câu 16: Theo tiến trình ước lượng, “ngẫu nhiên” được thêm vào nhằm mục đích:
A. Tăng độ chính xác cho kết quả tính toán.
B. Đảm bảo ước lượng phù hợp với thực tế thống kê.
C. Bù trừ cho những biến động hoặc rủi ro không lường trước.
D. Giảm sự khác biệt giữa các nhóm thực hiện.
=> ĐÁP ÁN ĐÚNG: C

Câu 17: Kết luận của tài liệu về kỹ năng ước lượng trong dự án là gì?
A. Là một quy trình định lượng chính xác.
B. Có thể tự động hóa hoàn toàn bằng phần mềm.
C. Là một quá trình vừa mang tính nghệ thuật, vừa cần điều chỉnh liên tục.
D. Không cần thiết nếu dự án đã có kế hoạch cụ thể.
=> ĐÁP ÁN ĐÚNG: C

=== CHƯƠNG 4: LẬP LỊCH DỰ ÁN ===

Câu 1: Mục đích chính của việc lập lịch trong quản lý dự án là gì?
A. Dự đoán chi phí và phân bổ ngân sách dự án.
B. Xác định thứ tự, thời gian và quan hệ giữa các công việc.
C. Xác định người chịu trách nhiệm trong từng giai đoạn.
D. Đánh giá hiệu quả tổng thể của kết quả thực hiện.
=> ĐÁP ÁN ĐÚNG: B

Câu 2: Từ “PERT” trong quản lý dự án là viết tắt của cụm từ nào sau đây?
A. Program Evaluation and Review Technique.
B. Project Execution and Reporting Template.
C. Process Evaluation and Resource Tracking.
D. Planning Estimation and Review Tool.
=> ĐÁP ÁN ĐÚNG: A

Câu 3: “Đường găng” (Critical Path) trong sơ đồ PERT có ý nghĩa gì?
A. Là đường có số lượng hoạt động lớn nhất trong dự án.
B. Là chuỗi hoạt động dài nhất quyết định thời gian hoàn thành dự án.
C. Là tuyến đường có mức chi phí thực hiện thấp nhất.
D. Là chuỗi hoạt động có độ thả nổi cao nhất trong dự án.
=> ĐÁP ÁN ĐÚNG: B

Câu 4: Mối quan hệ giữa “đường găng” và “thời hạn hoàn thành dự án” là gì?
A. Mọi thay đổi trên đường găng đều làm thay đổi thời hạn dự án.
B. Đường găng chỉ ảnh hưởng đến các công việc đầu tiên.
C. Các công việc trên đường găng có thể dời lịch tùy ý.
D. Đường găng chỉ dùng để theo dõi chi phí dự kiến.
=> ĐÁP ÁN ĐÚNG: A

Câu 5: Khi một công việc không nằm trên đường găng, điều đó cho biết:
A. Công việc đó có vai trò trung tâm của dự án.
B. Công việc đó có thể trễ trong giới hạn cho phép mà không ảnh hưởng dự án.
C. Công việc đó phải hoàn thành sớm nhất để đạt tiến độ.
D. Công việc đó không ảnh hưởng đến sản phẩm cuối cùng.
=> ĐÁP ÁN ĐÚNG: B

Câu 6: “Thả nổi toàn bộ” (Total Float) trong dự án được hiểu là gì?
A. Thời gian công việc có thể trễ mà không làm trễ toàn bộ dự án.
B. Thời gian dự án có thể kéo dài trước khi bị hủy bỏ.
C. Thời gian chờ đợi giữa hai hoạt động liên tiếp nhau.
D. Thời gian mà người quản lý dự án có thể phân bổ lại nhân sự.
=> ĐÁP ÁN ĐÚNG: A

Câu 7: “Thả nổi tự do” (Free Float) có ý nghĩa như thế nào trong quản lý dự án?
A. Khoảng thời gian dự án có thể kéo dài tối đa.
B. Khoảng thời gian công việc có thể trễ mà không ảnh hưởng đến công việc sau.
C. Khoảng thời gian người quản lý có thể nghỉ giữa chừng.
D. Khoảng thời gian dùng để chuẩn bị báo cáo kết quả.
=> ĐÁP ÁN ĐÚNG: B

Câu 8: Khi một hoạt động bị kéo dài và làm thay đổi đường găng, người quản lý cần:
A. Cập nhật sơ đồ PERT và điều chỉnh kế hoạch tổng thể.
B. Giữ nguyên tiến độ và chờ đánh giá sau.
C. Giảm yêu cầu chất lượng để bù thời gian.
D. Dời các hoạt động khác sang giai đoạn sau.
=> ĐÁP ÁN ĐÚNG: A

Câu 9: Việc cấp phát tài nguyên nhân lực cần dựa trên nguyên tắc nào?
A. Dựa trên thâm niên công tác và chức vụ của mỗi người.
B. Dựa trên kỹ năng, mức độ phù hợp và sự tin cậy của nhân sự.
C. Dựa trên độ tuổi, giới tính và khả năng làm việc nhóm.
D. Dựa trên số lượng người có thể huy động trong giai đoạn đó.
=> ĐÁP ÁN ĐÚNG: B

Câu 10: Theo quy tắc công nghiệp, khi bổ sung thêm người vào nhóm, điều gì xảy ra?
A. Hiệu suất giảm vì cần thêm thời gian phối hợp giữa các thành viên.
B. Hiệu suất tăng vì nhiều người cùng chia sẻ công việc.
C. Chi phí giảm vì rút ngắn được thời gian dự án.
D. Tiến độ được rút ngắn tỉ lệ thuận với số lượng nhân viên.
=> ĐÁP ÁN ĐÚNG: A

Câu 11: Tài nguyên “phi con người” trong dự án thường bao gồm những gì?
A. Phần cứng, phần mềm, tài liệu, thiết bị và các dịch vụ hỗ trợ.
B. Chi phí nhân sự, phương tiện đi lại và phụ cấp công tác.
C. Hợp đồng, giấy tờ hành chính và tài liệu đào tạo.
D. Thời gian nghỉ phép và lịch công tác của nhóm dự án.
=> ĐÁP ÁN ĐÚNG: A

Câu 12: “Ràng buộc bộ ba” (Triple Constraint) trong quản lý dự án gồm những yếu tố nào?
A. Thời gian – Chi phí – Phạm vi (hoặc Chất lượng).
B. Nhân lực – Công nghệ – Kinh nghiệm.
C. Thời gian – Địa điểm – Nguồn lực.
D. Kế hoạch – Tiến độ – Đánh giá.
=> ĐÁP ÁN ĐÚNG: A

Câu 13: Sơ đồ Gantt có vai trò gì trong quản lý dự án?
A. Thể hiện tiến độ công việc theo trục thời gian để theo dõi thực hiện.
B. Mô tả quan hệ nhân quả giữa các công việc dự án.
C. Đánh giá năng suất của từng thành viên trong nhóm.
D. Biểu diễn mức độ rủi ro và sự phụ thuộc kỹ thuật.
=> ĐÁP ÁN ĐÚNG: A

Câu 14: Việc “lập lịch lại” các hoạt động trong dự án được thực hiện khi nào?
A. Khi dự án kết thúc và cần rút kinh nghiệm.
B. Khi có thay đổi trong tiến độ, nguồn lực hoặc các ràng buộc khác.
C. Khi khách hàng yêu cầu bổ sung thêm chức năng mới.
D. Khi nhóm dự án thay đổi người quản lý hoặc nhà tài trợ.
=> ĐÁP ÁN ĐÚNG: B

Câu 15: Người quản lý dự án cần đặc biệt tập trung vào đường găng vì lý do nào?
A. Đường găng chứa các công việc ít quan trọng nhất.
B. Đường găng xác định chi phí phát sinh của từng công đoạn.
C. Mọi sự chậm trễ trên đường găng đều làm chậm toàn bộ tiến độ dự án.
D. Đường găng chỉ ảnh hưởng đến các công việc phụ trợ trong dự án.
=> ĐÁP ÁN ĐÚNG: C

Câu 16: Khi rút ngắn tiến độ dự án, điều giả định nào cần được đảm bảo?
A. Các nhiệm vụ có thể rút ngắn độc lập và không ảnh hưởng lẫn nhau.
B. Thêm nhân lực luôn giúp tiến độ được rút ngắn nhanh chóng.
C. Có thể giảm thời gian mà không tăng thêm chi phí hoặc rủi ro.
D. Mọi hoạt động có thể được rút ngắn mà không cần điều chỉnh kế hoạch.
=> ĐÁP ÁN ĐÚNG: A

=== CHƯƠNG 5: KIỂM SOÁT VÀ GIÁM SÁT ===

Câu 1: Kiểm soát dự án bao gồm các công việc chính nào?
A. Phân tích yêu cầu, thiết kế và thử nghiệm sản phẩm.
B. Giám sát tiến độ, phát hiện vấn đề và điều chỉnh kế hoạch.
C. Lập kế hoạch ngân sách và phân công nhân sự.
D. Tổng kết dự án và đánh giá chất lượng sản phẩm.
=> ĐÁP ÁN ĐÚNG: B

Câu 2: Mục tiêu quan trọng của kiểm soát dự án là:
A. Đảm bảo dự án được thực hiện đúng kế hoạch, đúng thời gian và ngân sách.
B. Tăng doanh thu, giảm chi phí và mở rộng thị trường.
C. Giảm bớt các bước triển khai và tối giản nhân sự.
D. Đảm bảo tất cả yêu cầu kỹ thuật đều được viết bằng tài liệu.
=> ĐÁP ÁN ĐÚNG: A

Câu 3: Giám sát dự án là quá trình:
A. Phát triển các tính năng mới theo yêu cầu khách hàng.
B. Theo dõi, kiểm tra tiến độ và chất lượng công việc so với kế hoạch.
C. Kiểm thử phần mềm và sửa lỗi sau triển khai.
D. Đánh giá tổng kết khi dự án đã hoàn thành.
=> ĐÁP ÁN ĐÚNG: B

Câu 4: Ai là người chịu trách nhiệm giám sát chi tiết các công đoạn kỹ thuật trong dự án?
A. Phó giám đốc điều hành (PGĐ điều hành).
B. Giám đốc dự án (GĐ dự án).
C. Khách hàng sử dụng phần mềm.
D. Ban chỉ đạo cấp trên của dự án.
=> ĐÁP ÁN ĐÚNG: B

Câu 5: Theo tài liệu, giám sát dự án từ phía khách hàng có ý nghĩa gì?
A. Giúp khách hàng nắm tiến độ, chất lượng và chi phí để đảm bảo quyền lợi.
B. Giúp nhà tài trợ kiểm soát nguồn vốn đầu tư hiệu quả hơn.
C. Giúp ban chỉ đạo theo dõi hiệu suất làm việc của nhân viên.
D. Giúp nhóm kỹ thuật phát triển thêm các chức năng bổ sung.
=> ĐÁP ÁN ĐÚNG: A

Câu 6: Khi dự án bị kéo dài thời hạn, người quản lý cần làm gì trước tiên?
A. Bổ sung nhân lực và yêu cầu làm thêm giờ.
B. Giảm phạm vi dự án để rút ngắn thời gian.
C. Kiểm tra nguyên nhân, xác định công việc găng và điều chỉnh kế hoạch.
D. Tạm dừng dự án để đánh giá lại toàn bộ kế hoạch.
=> ĐÁP ÁN ĐÚNG: C

Câu 7: Trong kiểm soát chi phí, “giá trị phần việc đã thực hiện” (EV) thể hiện điều gì?
A. Tổng chi phí đã chi trả tính đến thời điểm hiện tại.
B. Giá trị công việc hoàn thành theo ngân sách dự kiến.
C. Khoản chi phí phát sinh vượt ngoài kế hoạch.
D. Lợi nhuận dự kiến thu được sau khi bàn giao dự án.
=> ĐÁP ÁN ĐÚNG: B

Câu 8: Người quản lý nên phát hiện vấn đề của dự án vào giai đoạn nào?
A. Càng sớm càng tốt, trước khi vấn đề ảnh hưởng đến tiến độ và chi phí.
B. Sau khi dự án kết thúc để có số liệu chính xác.
C. Khi khách hàng yêu cầu báo cáo chính thức.
D. Khi nhóm dự án hoàn thành 50% khối lượng công việc.
=> ĐÁP ÁN ĐÚNG: A

=== CHƯƠNG 6: QUẢN LÝ PHẠM VI ===

Câu 1: “Phạm vi dự án” được hiểu là gì?
A. Tập hợp các rủi ro có thể xảy ra trong quá trình thực hiện dự án.
B. Danh sách toàn bộ những công việc mà dự án phải thực hiện.
C. Tập hợp các nguồn lực cần thiết để hoàn thành dự án.
D. Các chỉ tiêu tài chính và lợi nhuận của dự án.
=> ĐÁP ÁN ĐÚNG: B

Câu 2: Quản lý phạm vi dự án nhằm mục đích chính là gì?
A. Giảm thiểu rủi ro và tăng hiệu quả vận hành của dự án.
B. Đảm bảo dự án hoàn thành đúng những nội dung đã được xác định.
C. Duy trì tiến độ và cân bằng chi phí của dự án.
D. Theo dõi kết quả và đánh giá chất lượng sản phẩm.
=> ĐÁP ÁN ĐÚNG: B

Câu 3: Các kết quả chuyển giao (deliverables) của dự án là:
A. Các chi phí đã được chi trả cho các hoạt động.
B. Những sản phẩm hoặc kết quả cụ thể mà dự án phải bàn giao.
C. Những công việc đang trong quá trình thực hiện.
D. Những tài liệu hướng dẫn kỹ thuật và báo cáo chi tiết.
=> ĐÁP ÁN ĐÚNG: B

Câu 4: Tuyên bố phạm vi (Scope Statement) thường bao gồm những nội dung nào?
A. Mục tiêu tài chính, thời gian hoàn thành và kết quả kiểm thử.
B. Lý do dự án, mô tả sản phẩm, các sản phẩm trung gian và tiêu chí thành công.
C. Danh sách nhân sự, sơ đồ PERT và biểu đồ Gantt.
D. Kế hoạch chi phí, nguồn lực và tiến độ thực hiện.
=> ĐÁP ÁN ĐÚNG: B

Câu 5: “Xác định phạm vi dự án” là bước nhằm:
A. Chia nhỏ công việc thành các phần chi tiết dễ quản lý và kiểm soát.
B. Tổng hợp tất cả kết quả của các giai đoạn triển khai dự án.
C. Thiết lập cơ chế theo dõi và đánh giá tiến độ.
D. Kiểm tra tính khả thi của các phương án kỹ thuật.
=> ĐÁP ÁN ĐÚNG: A

Câu 6: Lợi ích của việc xác định phạm vi đúng đắn là:
A. Giúp dự án linh hoạt hơn khi mở rộng quy mô thực hiện.
B. Giúp ước lượng chính xác thời gian, chi phí và tài nguyên cần thiết.
C. Giúp tiết kiệm ngân sách và giảm nhân sự trong dự án.
D. Giúp tập trung vào giai đoạn cuối mà không cần kiểm soát đầu vào.
=> ĐÁP ÁN ĐÚNG: B

Câu 7: Vấn đề phổ biến khi quản lý phạm vi dự án CNTT là gì?
A. Phạm vi bị mở rộng liên tục do thay đổi yêu cầu (scope creep).
B. Không xác định được ngân sách và thời hạn cụ thể cho từng công việc.
C. Các thành viên nhóm dự án không có kỹ năng lập kế hoạch.
D. Thiếu dữ liệu đánh giá rủi ro trong giai đoạn đầu dự án.
=> ĐÁP ÁN ĐÚNG: A

Câu 8: Để kiểm soát và hạn chế “phạm vi phình ra” (scope creep), người quản lý cần:
A. Cho phép thay đổi tùy ý để đảm bảo sự linh hoạt trong dự án.
B. Trì hoãn việc cập nhật kế hoạch cho đến khi hoàn thành giai đoạn chính.
C. Xác lập quy trình kiểm soát thay đổi và được phê duyệt trước khi thực hiện.
D. Tăng thêm nhân lực và kinh phí để đáp ứng các yêu cầu mới.
=> ĐÁP ÁN ĐÚNG: C

=== CHƯƠNG 7: QUẢN LÝ THỜI GIAN ===

Câu 1: Tại sao quản lý thời gian dự án lại quan trọng?
A. Vì thời gian là yếu tố dễ thay đổi và ít ảnh hưởng đến chi phí.
B. Vì tiến độ dự án quyết định sự thành công của sản phẩm cuối cùng.
C. Vì việc hoàn thành đúng hạn là thách thức lớn nhất đối với mọi dự án.
D. Vì thời gian có thể được điều chỉnh linh hoạt trong mọi giai đoạn.
=> ĐÁP ÁN ĐÚNG: C

Câu 2: Quản lý thời gian dự án bao gồm hoạt động nào sau đây?
A. Xác định hoạt động, sắp xếp thứ tự, ước lượng và phát triển lịch biểu.
B. Lên kế hoạch chi phí, phân bổ nguồn lực và theo dõi hiệu suất.
C. Xác định rủi ro, đánh giá phạm vi và điều chỉnh nhân sự.
D. Kiểm soát chất lượng, lập báo cáo và phân tích năng suất.
=> ĐÁP ÁN ĐÚNG: A

Câu 3: Sắp xếp thứ tự các hoạt động trong dự án nhằm mục đích gì?
A. Giúp xác định chi phí trung bình của từng hạng mục.
B. Giúp xác định quan hệ phụ thuộc giữa các hoạt động để lập kế hoạch.
C. Giúp tăng tính linh hoạt trong quá trình kiểm soát dự án.
D. Giúp rút ngắn thời gian thực hiện thông qua làm song song công việc.
=> ĐÁP ÁN ĐÚNG: B

Câu 4: Phụ thuộc bắt buộc giữa các hoạt động là gì?
A. Là sự phụ thuộc được nhóm dự án quyết định.
B. Là mối quan hệ do bản chất kỹ thuật của công việc quy định.
C. Là sự phụ thuộc do khách hàng hoặc nhà tài trợ đặt ra.
D. Là mối quan hệ tạm thời do thiếu nguồn lực thực hiện.
=> ĐÁP ÁN ĐÚNG: B

Câu 5: Phương pháp CPM (Critical Path Method) được sử dụng để:
A. Xác định đường găng và thời gian hoàn thành sớm nhất của dự án.
B. Tính toán chi phí dự kiến và ngân sách của từng công việc.
C. Ước lượng nhân lực và vật tư cần thiết cho mỗi giai đoạn.
D. Đánh giá mức độ hài lòng của khách hàng trong quá trình thực hiện.
=> ĐÁP ÁN ĐÚNG: A

Câu 6: Khi lập lịch, “điều khiển lịch biểu” có nghĩa là gì?
A. Tính toán lại chi phí dự án dựa trên tiến độ thực tế.
B. Xây dựng kế hoạch nhân sự theo năng lực của từng cá nhân.
C. Theo dõi tiến độ, xử lý sai lệch và cập nhật lại lịch biểu khi cần.
D. Dừng các hoạt động trễ để bảo đảm chi phí không vượt quá dự kiến.
=> ĐÁP ÁN ĐÚNG: C

Câu 7: Trong phương pháp PERT, công thức tính thời gian kỳ vọng là gì?
A. (Thời gian lạc quan + 4 × Thời gian trung bình) / 6
B. (Thời gian lạc quan + 4 × Thời gian khả dĩ + Thời gian bi quan) / 6
C. (Thời gian bi quan + Thời gian trung bình) / 2
D. (Thời gian thực tế + Thời gian dự kiến) / 2
=> ĐÁP ÁN ĐÚNG: B

Câu 8: Yếu tố nào gây xung đột nhiều nhất trong các dự án là gì?
A. Chi phí phát sinh và thay đổi yêu cầu khách hàng.
B. Lịch biểu và tiến độ công việc, đặc biệt ở giai đoạn cuối dự án.
C. Phạm vi công việc không rõ ràng giữa các bộ phận.
D. Thiếu thông tin và truyền thông trong nhóm dự án.
=> ĐÁP ÁN ĐÚNG: B

=== CHƯƠNG 8: QUẢN LÝ CHI PHÍ ===

Câu 1: Quản lý chi phí dự án là gì?
A. Là quá trình lập kế hoạch, giám sát và phân bổ nguồn lực cho nhân sự.
B. Là quá trình ước lượng, lập kế hoạch và kiểm soát chi phí của dự án.
C. Là hoạt động giám sát rủi ro và kiểm soát tiến độ của dự án.
D. Là quá trình đánh giá hiệu suất và chất lượng của các hoạt động.
=> ĐÁP ÁN ĐÚNG: B

Câu 2: Mục tiêu chính của quản lý chi phí dự án là:
A. Đảm bảo dự án hoàn thành trong giới hạn ngân sách đã được phê duyệt.
B. Tăng doanh thu và tối ưu hóa lợi nhuận cho tổ chức thực hiện.
C. Duy trì tiến độ thực hiện và hạn chế rủi ro phát sinh trong dự án.
D. Tối đa hóa hiệu suất sử dụng nhân lực và vật tư của dự án.
=> ĐÁP ÁN ĐÚNG: A

Câu 3: Các quy trình chính của quản lý chi phí bao gồm:
A. Lập ngân sách, quản lý rủi ro và đánh giá chất lượng sản phẩm.
B. Ước lượng nguồn lực, đào tạo nhân sự và xác định mục tiêu dự án.
C. Lập kế hoạch tài nguyên, ước lượng chi phí, dự toán và kiểm soát chi phí.
D. Tính toán lương, chi tiêu nội bộ và lợi nhuận sau dự án.
=> ĐÁP ÁN ĐÚNG: C

Câu 4: Trong quản lý chi phí, “ước lượng chi phí” có nghĩa là gì?
A. Xác định giá bán sản phẩm cuối cùng của dự án.
B. Dự đoán chi phí cần thiết để hoàn thành các hoạt động dự án.
C. Phân tích các khoản chi phát sinh trong giai đoạn kết thúc dự án.
D. Đánh giá mức độ hiệu quả của việc sử dụng ngân sách.
=> ĐÁP ÁN ĐÚNG: B

Câu 5: Phương pháp “ước lượng từ dưới lên” (Bottom-up Estimating) là:
A. Ước tính chi phí tổng thể dựa trên phạm vi công việc chung.
B. Ước lượng chi phí chi tiết cho từng hạng mục rồi tổng hợp lại toàn dự án.
C. Ước lượng chi phí bằng cách lấy trung bình chi phí của các nhóm.
D. Ước lượng chi phí theo tỷ lệ phần trăm doanh thu của dự án.
=> ĐÁP ÁN ĐÚNG: B

Câu 6: Phương pháp “thông số” (Parametric Estimating) được hiểu là:
A. Ước lượng dựa vào dữ liệu từ các dự án khác có quy mô tương đương.
B. Ước lượng dựa vào kinh nghiệm thực tế của người quản lý dự án.
C. Ước lượng dựa trên các biến số toán học phản ánh mối quan hệ chi phí.
D. Ước lượng bằng cách so sánh các báo cáo tài chính của nhiều dự án.
=> ĐÁP ÁN ĐÚNG: C

Câu 7: Quản lý chi phí sử dụng công cụ EMV (Earned Value Management) nhằm mục đích:
A. Đánh giá mức độ hoàn thành công việc thông qua so sánh chi phí và tiến độ.
B. Theo dõi các khoản nợ và doanh thu từ hợp đồng dự án.
C. Tính toán các chỉ tiêu tài chính để đánh giá lợi nhuận đầu tư.
D. Xác định số lượng nhân sự cần thiết trong từng giai đoạn.
=> ĐÁP ÁN ĐÚNG: A

Câu 8: Trong EMV, chỉ số SPI = EV/PV phản ánh điều gì?
A. Hiệu suất chi phí so với giá trị thực tế đã chi tiêu.
B. Mức độ tiến độ – nếu SPI < 1 nghĩa là dự án bị trễ so với kế hoạch.
C. Tỷ lệ giữa chi phí dự kiến và chi phí thực tế của dự án.
D. Hiệu quả đầu tư – nếu SPI > 1 nghĩa là lợi nhuận cao hơn dự kiến.
=> ĐÁP ÁN ĐÚNG: B

Câu 9: Để kiểm soát chi phí hiệu quả, người quản lý dự án cần:
A. Tăng ngân sách dự án khi chi phí vượt kế hoạch.
B. Chỉ điều chỉnh chi phí vào giai đoạn cuối dự án.
C. Giám sát chi phí định kỳ, phát hiện sai lệch và điều chỉnh kịp thời.
D. Giảm chi phí bằng cách cắt giảm nhân sự và trang thiết bị.
=> ĐÁP ÁN ĐÚNG: C

=== CHƯƠNG 9: QUẢN LÝ CHẤT LƯỢNG ===

Câu 1: Theo ISO, “chất lượng” được định nghĩa là gì?
A. Là chi phí đầu tư để đảm bảo sản phẩm đạt tiêu chuẩn.
B. Là mức độ mà sản phẩm đáp ứng các yêu cầu đã được xác định.
C. Là khả năng sản phẩm tạo ra lợi nhuận cho tổ chức thực hiện.
D. Là mức độ phù hợp giữa sản phẩm và nhu cầu của khách hàng.
=> ĐÁP ÁN ĐÚNG: B

Câu 2: Mục tiêu cơ bản của quản lý chất lượng trong dự án là gì?
A. Tăng doanh thu và mở rộng quy mô hoạt động của tổ chức.
B. Đảm bảo sản phẩm thoả mãn yêu cầu khách hàng và tiêu chuẩn đề ra.
C. Giảm chi phí sản xuất để nâng cao hiệu quả kinh tế tổng thể.
D. Rút ngắn thời gian thực hiện mà vẫn đảm bảo hiệu suất tối đa.
=> ĐÁP ÁN ĐÚNG: B

Câu 3: Trong quy trình quản lý chất lượng, “lập kế hoạch chất lượng” là gì?
A. Giai đoạn kiểm tra các kết quả đầu ra của dự án.
B. Quá trình xác định tiêu chuẩn và cách thức để đảm bảo sản phẩm đạt yêu cầu.
C. Hoạt động đo lường hiệu quả và chi phí của từng công việc.
D. Giai đoạn phê duyệt kết quả trước khi bàn giao cho khách hàng.
=> ĐÁP ÁN ĐÚNG: B

Câu 4: “Đảm bảo chất lượng” (Quality Assurance) tập trung vào:
A. Đánh giá quy trình làm việc nhằm đảm bảo sản phẩm tuân thủ tiêu chuẩn.
B. Sửa lỗi kỹ thuật và khắc phục sự cố phần mềm phát sinh trong dự án.
C. Kiểm tra kết quả cuối cùng trước khi giao cho người sử dụng.
D. Xác định phạm vi dự án và đo lường hiệu quả quản lý thời gian.
=> ĐÁP ÁN ĐÚNG: A

Câu 5: “Kiểm tra chất lượng” (Quality Control) được hiểu là:
A. Xem xét chi tiết kết quả để xác định mức độ tuân thủ các tiêu chuẩn đã đặt ra.
B. Đánh giá khả năng nhân viên trong việc đảm bảo tiến độ dự án.
C. Kiểm tra ngân sách và điều chỉnh chi phí thực hiện từng phần việc.
D. Kiểm định mức độ hài lòng của khách hàng sau khi bàn giao sản phẩm.
=> ĐÁP ÁN ĐÚNG: A

Câu 6: Chi phí ngăn ngừa trong quản lý chất lượng là gì?
A. Là chi phí dùng để phòng tránh sai lỗi trước khi sản phẩm được tạo ra.
B. Là chi phí cho việc sửa lỗi sau khi sản phẩm đã được bàn giao.
C. Là chi phí kiểm định chất lượng và kiểm tra tài liệu hướng dẫn.
D. Là chi phí phát sinh do không tuân thủ quy trình đã được phê duyệt.
=> ĐÁP ÁN ĐÚNG: A

Câu 7: Yếu tố quan trọng nhất để cải tiến chất lượng là gì?
A. Sử dụng phần mềm kiểm thử tự động và các công cụ quản lý tiên tiến.
B. Sự cam kết và hỗ trợ của lãnh đạo trong việc thúc đẩy văn hóa chất lượng.
C. Giảm thiểu thời gian kiểm thử để tiết kiệm chi phí nhân sự.
D. Tăng số lượng nhân viên để kiểm soát tốt hơn quá trình thực hiện.
=> ĐÁP ÁN ĐÚNG: B

=== CHƯƠNG 10: QUẢN LÝ NHÂN LỰC ===

Câu 1: Quản lý nguồn nhân lực dự án là gì?
A. Là hoạt động phân bổ ngân sách cho các hoạt động kỹ thuật của dự án.
B. Là quá trình tổ chức, phân công và giám sát con người tham gia dự án.
C. Là quá trình xây dựng chiến lược phát triển sản phẩm phần mềm.
D. Là hoạt động lập kế hoạch chi phí và theo dõi tiến độ dự án.
=> ĐÁP ÁN ĐÚNG: B

Câu 2: Mục tiêu chính của quản lý nhân lực trong dự án là:
A. Đảm bảo các công việc được giao đúng người, đúng thời điểm và đúng năng lực.
B. Tối đa hóa lợi nhuận và giảm chi phí lao động của dự án.
C. Đảm bảo tiến độ bằng cách phân chia khối lượng đồng đều cho mọi người.
D. Duy trì tinh thần làm việc và văn hóa tổ chức trong doanh nghiệp.
=> ĐÁP ÁN ĐÚNG: A

Câu 3: Nhân sự của dự án bao gồm:
A. Chỉ những người tham gia trực tiếp vào lập trình và kiểm thử.
B. Những người hỗ trợ dự án ở cấp quản lý hoặc hành chính.
C. Tất cả cá nhân tham gia vào quá trình thực hiện, điều hành và hỗ trợ dự án.
D. Các nhà tài trợ và khách hàng cung cấp nguồn vốn cho dự án.
=> ĐÁP ÁN ĐÚNG: C

Câu 4: Trong dự án CNTT, GĐ dự án có trách nhiệm gì?
A. Báo cáo kế hoạch, giám sát tiến độ và duy trì liên hệ giữa dự án và bên ngoài.
B. Thực hiện kiểm thử kỹ thuật và đảm bảo chất lượng của phần mềm.
C. Phụ trách lập trình chi tiết và xử lý lỗi trong quá trình phát triển.
D. Giám sát việc bảo trì và vận hành hệ thống sau khi bàn giao.
=> ĐÁP ÁN ĐÚNG: A

Câu 5: Phó Giám đốc kỹ thuật (PGĐ kỹ thuật) trong dự án có vai trò chính là:
A. Quản lý ngân sách, hợp đồng và chi phí nhân công cho toàn dự án.
B. Chỉ đạo kỹ thuật, giám sát tiến độ và đảm bảo chất lượng sản phẩm.
C. Quản lý khách hàng và giải quyết các vấn đề truyền thông.
D. Phân tích yêu cầu và thiết kế chức năng của hệ thống phần mềm.
=> ĐÁP ÁN ĐÚNG: B

Câu 6: Theo tài liệu, cán bộ lập trình có trách nhiệm gì trong dự án?
A. Đề xuất yêu cầu và xác nhận phạm vi công việc của dự án.
B. Thiết kế chi tiết, lập trình, kiểm thử và báo cáo tiến độ thực hiện.
C. Xây dựng tài liệu quản lý rủi ro và đánh giá chi phí thực tế.
D. Quản lý ngân sách và phân công công việc cho các nhóm kỹ thuật.
=> ĐÁP ÁN ĐÚNG: B

Câu 7: Người đại diện phía khách hàng trong dự án có nhiệm vụ chính là:
A. Theo dõi tiến độ tài chính và phê duyệt chi phí dự án.
B. Liên hệ, cung cấp dữ liệu và xác nhận các tài liệu kỹ thuật.
C. Tham gia viết mã nguồn và kiểm thử hệ thống phần mềm.
D. Giám sát việc phân công nhân sự trong đội ngũ phát triển.
=> ĐÁP ÁN ĐÚNG: B

Câu 8: Tính cách quan trọng của người quản lý dự án là gì?
A. Kiên nhẫn, cẩn thận và chỉ đạo theo quy trình chi tiết.
B. Tập trung tuyệt đối vào kỹ thuật và hạn chế tương tác xã hội.
C. Biết giao tiếp, có tổ chức, biết lắng nghe và có khả năng ra quyết định.
D. Cầu toàn, thích làm việc độc lập và không cần sự hỗ trợ từ người khác.
=> ĐÁP ÁN ĐÚNG: C

=== CHƯƠNG 11: TRUYỀN THÔNG VÀ GIAO TIẾP ===

Câu 1: Vì sao truyền thông đóng vai trò quan trọng trong quản lý dự án?
A. Vì thông tin được chia sẻ đầy đủ giúp phối hợp hiệu quả và tránh sai lệch.
B. Vì truyền thông giúp giảm chi phí và rút ngắn thời gian dự án.
C. Vì truyền thông giúp kiểm soát chất lượng kỹ thuật của sản phẩm.
D. Vì truyền thông giúp xác định vai trò của các thành viên dự án.
=> ĐÁP ÁN ĐÚNG: A

Câu 2: Quản lý truyền thông trong dự án bao gồm các quá trình nào?
A. Phân tích rủi ro, điều phối tài nguyên và đánh giá kết quả.
B. Lập kế hoạch truyền thông, phân phối thông tin, báo cáo hiệu suất và kết thúc hành chính.
C. Lập kế hoạch chi phí, báo cáo tiến độ và kiểm soát thay đổi.
D. Phân công nhân sự, tổ chức họp và đánh giá hiệu quả công việc.
=> ĐÁP ÁN ĐÚNG: B

Câu 3: Kế hoạch quản lý truyền thông là tài liệu nhằm:
A. Mô tả yêu cầu kỹ thuật và quy trình lập báo cáo nội bộ.
B. Xác định cách thức, nội dung và thời gian chia sẻ thông tin trong dự án.
C. Ghi nhận toàn bộ chi phí liên quan đến truyền thông nội bộ.
D. Tổng hợp kết quả dự án và lập báo cáo sau khi hoàn thành.
=> ĐÁP ÁN ĐÚNG: B

Câu 4: Phân tích các bên liên quan trong kế hoạch truyền thông giúp:
A. Xác định chi phí liên lạc và mức độ tương tác giữa các bộ phận.
B. Xây dựng quy trình giám sát hoạt động của từng cá nhân trong nhóm.
C. Xác định nhu cầu thông tin và hình thức truyền đạt phù hợp cho từng đối tượng.
D. Xác định nội dung đào tạo và thời điểm huấn luyện nhân viên mới.
=> ĐÁP ÁN ĐÚNG: C

Câu 5: “Phân phối thông tin” trong quản lý truyền thông có nghĩa là:
A. Cung cấp thông tin đúng người, đúng thời điểm và đúng định dạng yêu cầu.
B. Gửi báo cáo định kỳ đến lãnh đạo cấp cao để phê duyệt ngân sách.
C. Tạo điều kiện để các bên thảo luận và chỉnh sửa yêu cầu dự án.
D. Tổng hợp dữ liệu kỹ thuật và truyền đạt qua các phương tiện số.
=> ĐÁP ÁN ĐÚNG: A

Câu 6: “Báo cáo hiệu suất” (Performance Reporting) có vai trò gì trong dự án?
A. Giúp các bên nắm được tình hình sử dụng tài nguyên và tiến độ đạt được.
B. Giúp khách hàng xem xét các thay đổi trong thiết kế hệ thống phần mềm.
C. Giúp đội ngũ kỹ thuật kiểm tra lỗi và điều chỉnh chương trình.
D. Giúp nhà quản lý xác định chi phí phát sinh trong từng giai đoạn.
=> ĐÁP ÁN ĐÚNG: A

Câu 7: Giai đoạn “kết thúc hành chính” trong quản lý truyền thông nhằm mục đích:
A. Lưu trữ các báo cáo tài chính và hồ sơ kỹ thuật của dự án.
B. Tạo và lưu hồ sơ chính thức, chấp nhận kết quả và rút ra bài học kinh nghiệm.
C. Giải quyết các tranh chấp hợp đồng và thanh toán các khoản chi phí.
D. Cập nhật dữ liệu khách hàng và thông tin phần mềm sau triển khai.
=> ĐÁP ÁN ĐÚNG: B

Câu 8: Yếu tố nào giúp cải thiện hiệu quả truyền thông trong nhóm dự án?
A. Tăng cường giám sát để giảm sai sót khi truyền đạt thông tin.
B. Lắng nghe tích cực, phản hồi kịp thời và đảm bảo thông tin hai chiều.
C. Giới hạn số lượng kênh liên lạc để tránh trùng lặp dữ liệu.
D. Tập trung sử dụng văn bản thay vì giao tiếp trực tiếp.
=> ĐÁP ÁN ĐÚNG: B

Câu 9: Để tổ chức cuộc họp dự án hiệu quả, người chủ trì cần:
A. Mở rộng thời gian họp để mọi người được phát biểu ý kiến đầy đủ.
B. Chỉ định một người ghi chép và một người điều hành để tiết kiệm thời gian.
C. Xác định mục tiêu, nội dung, người tham dự và chuẩn bị tài liệu trước khi họp.
D. Tập trung thảo luận chi tiết kỹ thuật thay vì các vấn đề tổng thể.
=> ĐÁP ÁN ĐÚNG: C

=== CHƯƠNG 12: QUẢN LÝ RỦI RO ===

Câu 1: Quản lý rủi ro trong dự án bao gồm mấy bước cơ bản?
A. Bốn bước: dự đoán, khử bỏ, giảm tác động và kiểm soát khi xảy ra.
B. Ba bước: phân tích, đánh giá và xử lý rủi ro.
C. Hai bước: xác định và loại trừ rủi ro.
D. Năm bước: phân tích, lập kế hoạch, theo dõi, đánh giá và báo cáo.
=> ĐÁP ÁN ĐÚNG: A

Câu 2: Trong quản lý rủi ro, bước đầu tiên cần thực hiện là gì?
A. Nhận diện và dự đoán các tình huống rủi ro có thể xảy ra.
B. Tính toán chi phí để khắc phục khi rủi ro xảy ra.
C. Lên kế hoạch tài chính để phòng ngừa rủi ro.
D. Đánh giá thiệt hại sau khi rủi ro đã phát sinh.
=> ĐÁP ÁN ĐÚNG: A

Câu 3: Rủi ro về nhân sự trong dự án thường xuất phát từ nguyên nhân nào?
A. Nhân viên có kỹ năng cao nhưng thiếu kinh nghiệm thực tế.
B. Nhân viên không phù hợp, thiếu kinh nghiệm hoặc thiếu đào tạo.
C. Nhân viên làm việc quá năng suất dẫn đến mất cân bằng tiến độ.
D. Nhân viên không đồng ý làm thêm giờ và thiếu động lực.
=> ĐÁP ÁN ĐÚNG: B

Câu 4: Rủi ro kỹ thuật trong dự án CNTT thường liên quan đến:
A. Sự thay đổi trong tổ chức hoặc mô hình làm việc của nhóm.
B. Việc lựa chọn sai công nghệ, ngôn ngữ lập trình hoặc phần cứng.
C. Sự chậm trễ trong phê duyệt tài chính và ký hợp đồng.
D. Việc thiếu dữ liệu đầu vào và thông tin về khách hàng.
=> ĐÁP ÁN ĐÚNG: B

Câu 5: Trong quá trình đánh giá rủi ro, hai yếu tố quan trọng cần xem xét là gì?
A. Tác động và phạm vi ảnh hưởng của rủi ro.
B. Xác suất xảy ra và mức độ tác động của rủi ro.
C. Nguyên nhân hình thành và chi phí khắc phục rủi ro.
D. Mức độ quan tâm của lãnh đạo và nhóm kỹ thuật.
=> ĐÁP ÁN ĐÚNG: B

Câu 6: Khi không thể loại bỏ rủi ro, người quản lý nên làm gì?
A. Chuyển giao rủi ro cho các đối tác hoặc nhà tài trợ.
B. Lập kế hoạch dự phòng để giảm thiểu tác động khi rủi ro xảy ra.
C. Bỏ qua rủi ro để tập trung vào mục tiêu chính của dự án.
D. Kéo dài tiến độ nhằm tránh rủi ro trong giai đoạn hiện tại.
=> ĐÁP ÁN ĐÚNG: B

Câu 7: “Khử bỏ rủi ro” trong quản lý dự án có nghĩa là gì?
A. Loại trừ nguyên nhân gây rủi ro hoặc thay đổi điều kiện để rủi ro không xảy ra.
B. Giảm bớt ảnh hưởng của rủi ro bằng cách phân chia công việc nhỏ hơn.
C. Chuyển toàn bộ trách nhiệm cho bộ phận kiểm soát nội bộ.
D. Giảm thời gian thực hiện để rủi ro không kịp phát sinh.
=> ĐÁP ÁN ĐÚNG: A

Câu 8: Khi một rủi ro đã xảy ra, hành động đầu tiên của người quản lý dự án là gì?
A. Báo cáo ngay cho cấp trên và chờ hướng dẫn xử lý cụ thể.
B. Đánh giá mức độ ảnh hưởng, kiểm soát tình hình và triển khai biện pháp ứng phó.
C. Tạm dừng toàn bộ hoạt động cho đến khi có hướng xử lý mới.
D. Cắt giảm chi phí để bù vào thiệt hại do rủi ro gây ra.
=> ĐÁP ÁN ĐÚNG: B

=== CHƯƠNG 13: QUẢN LÝ TÍCH HỢP ===

Câu 1: “Quản lý tích hợp dự án” được hiểu là gì?
A. Là quá trình quản lý tài chính, nhân sự và truyền thông trong dự án.
B. Là việc phối hợp tất cả các lĩnh vực kiến thức để đảm bảo dự án thống nhất.
C. Là hoạt động tổng hợp dữ liệu, báo cáo và lưu trữ tài liệu của dự án.
D. Là công tác kết nối giữa các nhà tài trợ và đội ngũ kỹ thuật trong dự án.
=> ĐÁP ÁN ĐÚNG: B

Câu 2: Quản lý tích hợp dự án giúp nhà quản lý đạt được điều gì?
A. Tối ưu hóa hiệu quả của từng bộ phận riêng biệt trong dự án.
B. Đảm bảo các quy trình dự án phối hợp nhịp nhàng và đồng bộ với nhau.
C. Giảm thiểu chi phí vận hành và số lượng nhân sự trong nhóm dự án.
D. Giới hạn phạm vi công việc để rút ngắn tiến độ dự án.
=> ĐÁP ÁN ĐÚNG: B

Câu 3: Các quy trình chính của quản lý tích hợp bao gồm:
A. Phân bổ tài nguyên, kiểm soát rủi ro và kết thúc dự án.
B. Phát triển kế hoạch, thực thi kế hoạch và điều khiển thay đổi tích hợp.
C. Lập ngân sách, quản lý thời gian và theo dõi tiến độ công việc.
D. Đánh giá hiệu suất, kiểm tra chất lượng và bàn giao sản phẩm.
=> ĐÁP ÁN ĐÚNG: B

Câu 4: Kế hoạch dự án là tài liệu nhằm mục đích gì?
A. Mô tả chi tiết các chi phí, lợi nhuận và rủi ro của dự án.
B. Hướng dẫn thực thi dự án và đánh giá tình trạng thực hiện so với mục tiêu.
C. Ghi lại danh sách nhân sự, cơ cấu tổ chức và quy trình kiểm thử.
D. Thống kê tài nguyên và thời gian sử dụng trong suốt quá trình làm việc.
=> ĐÁP ÁN ĐÚNG: B

Câu 5: Một kế hoạch dự án hiệu quả cần có đặc điểm nào sau đây?
A. Cố định, không thay đổi trong suốt vòng đời dự án.
B. Chỉ tập trung vào các yếu tố kỹ thuật của dự án.
C. Mang tính linh hoạt, có thể cập nhật và điều chỉnh khi có thay đổi.
D. Chỉ do giám đốc dự án biên soạn mà không cần sự tham gia của nhóm.
=> ĐÁP ÁN ĐÚNG: C

Câu 6: “Thực thi kế hoạch dự án” (Project Execution) là giai đoạn nhằm:
A. Đánh giá các rủi ro và tính toán chi phí cho toàn bộ dự án.
B. Quản lý và thực hiện các công việc được mô tả trong kế hoạch dự án.
C. Lưu trữ dữ liệu và lập báo cáo tổng hợp kết quả thực hiện.
D. Kiểm tra và nghiệm thu sản phẩm trước khi bàn giao cho khách hàng.
=> ĐÁP ÁN ĐÚNG: B

Câu 7: “Điều khiển thay đổi tích hợp” (Integrated Change Control) có mục tiêu là:
A. Đánh giá năng suất của nhân viên trong quá trình thực hiện dự án.
B. Tạo điều kiện cho các nhóm tự do thay đổi quy trình khi cần thiết.
C. Phối hợp và quản lý mọi thay đổi trong phạm vi và mục tiêu của dự án.
D. Hạn chế sự tham gia của các bên liên quan khi thay đổi dự án.
=> ĐÁP ÁN ĐÚNG: C

Câu 8: Vì sao quản lý thay đổi tích hợp lại quan trọng trong dự án CNTT?
A. Vì khách hàng thường xuyên thay đổi yêu cầu kỹ thuật trong quá trình thực hiện.
B. Vì các yếu tố phạm vi, chi phí và thời gian luôn có thể bị tác động lẫn nhau.
C. Vì nhóm dự án thường không tuân thủ quy trình khi thay đổi nhiệm vụ.
D. Vì việc thay đổi luôn giúp dự án đạt kết quả nhanh và hiệu quả hơn.
=> ĐÁP ÁN ĐÚNG: B

Câu 9: Yếu tố cốt lõi giúp việc quản lý tích hợp dự án thành công là gì?
A. Cấu trúc tổ chức phức tạp và hệ thống báo cáo đa tầng.
B. Sử dụng các công cụ phần mềm tiên tiến để kiểm soát tiến độ.
C. Duy trì giao tiếp hiệu quả và sự phối hợp chặt chẽ giữa các bên liên quan.
D. Tập trung vào các chỉ tiêu tài chính và lợi nhuận của dự án.
=> ĐÁP ÁN ĐÚNG: C
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
