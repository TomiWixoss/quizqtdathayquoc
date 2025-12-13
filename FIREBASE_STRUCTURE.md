# Cấu trúc Firebase cho Quiz QTDA

## Collections

### 0. gachaCollections

Lưu thông tin bộ sưu tập gacha từ Bilibili

```json
{
  "id": "number - Act ID",
  "name": "string - Tên bộ sưu tập",
  "description": "string - Mô tả ngắn",
  "startTime": "number - Unix timestamp bắt đầu",
  "end_time": "number - Unix timestamp kết thúc",
  "relatedUsers": "number[] - Danh sách UID UP chủ",
  "totalPreorderCount": "number - Số lượt đặt trước",
  "totalPurchaseCount": "number - Số lượt mua",
  "act_square_img": "string - URL ảnh vuông",
  "lottery_image": "string - URL ảnh lottery",
  "act_title": "string - Tiêu đề đầy đủ",
  "product_introduce": "string - Giới thiệu chi tiết",
  "total_book_cnt": "number - Tổng đặt trước",
  "total_buy_cnt": "number - Tổng đã mua",
  "related_user_infos": {
    "[uid]": {
      "nickname": "string",
      "avatar": "string"
    }
  },
  "collector_medal_info": "object[] - Thông tin huy hiệu",
  "lottery_list": [
    {
      "lottery_id": "number",
      "lottery_name": "string",
      "price": "number (fen)",
      "lottery_image": "string"
    }
  ],
  "updatedAt": "timestamp"
}
```

#### Subcollection: gachaCollections/{actId}/lotteries

```json
{
  "lottery_id": "number",
  "lottery_name": "string",
  "price": "number (fen)",
  "lottery_image": "string",
  "item_list": [
    {
      "item_type": "number",
      "card_name": "string",
      "card_img": "string",
      "card_scarcity": "number (40=UR, 30=SR, 20=R, 10=N)",
      "width": "number",
      "height": "number",
      "video_list": "string[]",
      "card_img_download": "string"
    }
  ],
  "collect_list": {
    "collect_infos": [
      {
        "redeem_text": "string",
        "redeem_item_name": "string",
        "redeem_item_image": "string",
        "require_item_amount": "number"
      }
    ],
    "collect_chain": []
  },
  "updatedAt": "timestamp"
}
```

### 1. users

Lưu thông tin người dùng

```json
{
  "oderId": "string - Zalo user ID",
  "odername": "string - Tên người dùng",
  "avatar": "string - URL avatar",
  "totalScore": "number - Sync với conquestStats.rankPoints",
  "totalCorrect": "number",
  "totalWrong": "number",
  "totalQuizzes": "number",
  "streak": "number",
  "lastPlayDate": "string - ISO date",
  "level": "number",
  "exp": "number",
  "badges": "string[]",
  "chapterProgress": {
    "[chapterId]": {
      "completed": "number",
      "correct": "number",
      "bestScore": "number",
      "lastAttempt": "string",
      "stars": "number (0-3)",
      "locked": "boolean",
      "isCompleted": "boolean"
    }
  },
  "hearts": "number (0-5)",
  "maxHearts": "number (default 5)",
  "lastHeartRefill": "string - ISO date",
  "gems": "number",
  "dailyGoal": "number (default 50)",
  "dailyProgress": "number",
  "achievements": "string[] - achievement IDs",
  "totalPlayTime": "number",
  "perfectLessons": "number",
  "longestStreak": "number",
  "conquestStats": {
    "rankPoints": "number - Điểm rank hiện tại",
    "highestRankId": "string - Rank cao nhất đạt được",
    "totalConquests": "number - Tổng số trận đã chơi",
    "totalConquestCorrect": "number - Tổng câu đúng trong Chinh Chiến",
    "totalConquestWrong": "number - Tổng câu sai trong Chinh Chiến",
    "bestWinStreak": "number - Chuỗi thắng tốt nhất",
    "currentWinStreak": "number - Chuỗi thắng hiện tại",
    "lastConquestDate": "string - ISO date"
  },
  "questProgress": {
    "dailyCorrect": "number - Số câu đúng hôm nay",
    "dailyQuizzes": "number - Số quiz hoàn thành hôm nay",
    "dailyDate": "string - Ngày hiện tại (để reset)",
    "weeklyXP": "number - XP kiếm được trong tuần",
    "weeklyPerfect": "number - Số quiz 100% trong tuần",
    "weeklyStartDate": "string - Ngày bắt đầu tuần (để reset)",
    "claimedDailyQuests": "string[] - ID nhiệm vụ ngày đã nhận",
    "claimedWeeklyQuests": "string[] - ID nhiệm vụ tuần đã nhận"
  },
  "claimedAchievementRewards": "string[] - ID thành tựu đã nhận thưởng",
  "claimedMails": "string[] - ID thư đã nhận",
  "usedRedeemCodes": "string[] - ID mã đã sử dụng"
}
```

### 2. conquestSessions

Lưu lịch sử các phiên Chinh Chiến

```json
{
  "oderId": "string - Zalo user ID",
  "startTime": "string - ISO date",
  "endTime": "string - ISO date",
  "rankBefore": "string - Rank ID trước khi chơi",
  "rankAfter": "string - Rank ID sau khi chơi",
  "pointsBefore": "number - Điểm trước khi chơi",
  "pointsAfter": "number - Điểm sau khi chơi",
  "pointsGained": "number - Điểm thay đổi (có thể âm)",
  "correctCount": "number - Số câu đúng",
  "wrongCount": "number - Số câu sai",
  "totalQuestions": "number - Tổng số câu hỏi",
  "accuracy": "number - Độ chính xác (%)"
}
```

**Ví dụ:**

```json
{
  "oderId": "user123",
  "startTime": "2024-12-11T10:00:00.000Z",
  "endTime": "2024-12-11T10:15:00.000Z",
  "rankBefore": "bronze_3",
  "rankAfter": "bronze_4",
  "pointsBefore": 250,
  "pointsAfter": 320,
  "pointsGained": 70,
  "correctCount": 8,
  "wrongCount": 2,
  "totalQuestions": 10,
  "accuracy": 80
}
```

### 3. mails

Hòm thư - gửi quà cho tất cả người dùng

```json
{
  "title": "string - Tiêu đề thư",
  "content": "string - Nội dung thư",
  "reward": "number - Số gems thưởng",
  "active": "boolean - Còn hiệu lực không",
  "createdAt": "string - ISO date"
}
```

**Ví dụ:**

```json
{
  "title": "Chào mừng bạn mới!",
  "content": "Cảm ơn bạn đã tham gia Quiz QTDA. Đây là quà chào mừng dành cho bạn!",
  "reward": 50,
  "active": true,
  "createdAt": "2024-12-10T00:00:00.000Z"
}
```

### 4. redeemCodes

Mã đổi thưởng

```json
{
  "code": "string - Mã đổi thưởng (uppercase)",
  "reward": "number - Số gems thưởng",
  "usageLimit": "number - Giới hạn số lần sử dụng (null = không giới hạn)",
  "usedCount": "number - Số lần đã sử dụng",
  "active": "boolean - Còn hiệu lực không",
  "expiresAt": "string - ISO date (optional)"
}
```

**Ví dụ:**

```json
{
  "code": "QTDA2024",
  "reward": 100,
  "usageLimit": 1000,
  "usedCount": 0,
  "active": true,
  "expiresAt": "2025-01-01T00:00:00.000Z"
}
```

## Firestore Rules (Gợi ý)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users - chỉ đọc/ghi document của chính mình
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Conquest Sessions - user chỉ đọc/ghi session của mình
    match /conquestSessions/{sessionId} {
      allow read: if request.auth != null && resource.data.oderId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.oderId == request.auth.uid;
    }

    // Mails - chỉ đọc
    match /mails/{mailId} {
      allow read: if true;
      allow write: if false; // Chỉ admin ghi qua console
    }

    // Redeem codes - đọc và update usedCount
    match /redeemCodes/{codeId} {
      allow read: if true;
      allow update: if request.resource.data.diff(resource.data).affectedKeys().hasOnly(['usedCount']);
    }
  }
}
```
