# Gacha API Backend

Backend server để xử lý gacha API calls thông qua Firebase Realtime Database.

## Cách hoạt động

```
App (Zalo Mini App)
    ↓ write command
Firebase Realtime Database (/gacha_commands)
    ↓ listen
Backend Server (firebase-bridge.js)
    ↓ fetch
workers.vrp.moe API
    ↓ write response
Firebase Realtime Database
    ↓ listen
App (nhận kết quả)
```

## Setup

1. Đảm bảo `firebase-service-account.json` có ở thư mục gốc project

2. Cài dependencies:

```bash
cd backend
npm install
```

3. Chạy Firebase Bridge Server:

```bash
npm run bridge
```

Hoặc với auto-reload:

```bash
npm run bridge:dev
```

## Commands hỗ trợ

| Action           | Params                                 | Description               |
| ---------------- | -------------------------------------- | ------------------------- |
| `getCollections` | -                                      | Lấy danh sách collections |
| `getCollection`  | `actId`                                | Lấy chi tiết collection   |
| `getLottery`     | `collectionId`, `lotteryId`            | Lấy lottery với cards     |
| `getVideoUrl`    | `collectionId`, `lotteryId`, `cardImg` | Lấy video URL mới         |

## Caching

- Collections: 5 phút
- Collection detail: 5 phút
- Lottery: 30 phút
- Video URL: 30 phút

## Deploy

Server này cần chạy liên tục để listen Firebase commands. Có thể deploy lên:

- VPS (DigitalOcean, Vultr, etc.)
- Railway
- Render
- Fly.io

Hoặc chạy local với `pm2`:

```bash
npm i -g pm2
pm2 start firebase-bridge.js --name gacha-bridge
```
