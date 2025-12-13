# Cấu trúc Firebase cho Quiz QTDA

## Collections

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
