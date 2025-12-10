# Cấu trúc Firebase cho Quiz QTDA

## Collections

### 1. users

Lưu thông tin người dùng

```json
{
  "oderId": "string - Zalo user ID",
  "odername": "string - Tên người dùng",
  "avatar": "string - URL avatar",
  "totalScore": "number",
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
  "longestStreak": "number"
}
```

### 2. mails

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

### 3. redeemCodes

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
