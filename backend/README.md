# Gacha API Proxy

Backend proxy để bypass CORS khi gọi API từ `workers.vrp.moe`.

## Endpoints

| Endpoint                                                  | Description                            |
| --------------------------------------------------------- | -------------------------------------- |
| `GET /api/collections`                                    | Lấy danh sách tất cả gacha collections |
| `GET /api/collection/:actId`                              | Lấy chi tiết collection                |
| `GET /api/lottery/:collectionId/:lotteryId`               | Lấy lottery với cards (video URLs mới) |
| `GET /api/video-url?collectionId=X&lotteryId=Y&cardImg=Z` | Lấy video URL mới cho card             |
| `GET /health`                                             | Health check                           |

## Local Development

```bash
npm install
npm run dev
```

Server chạy tại `http://localhost:3001`

## Deploy to Vercel

1. Install Vercel CLI:

```bash
npm i -g vercel
```

2. Deploy:

```bash
cd backend
vercel
```

3. Sau khi deploy, copy URL production (vd: `https://your-project.vercel.app`)

4. Cập nhật `.env` ở frontend:

```
VITE_GACHA_PROXY_URL=https://your-project.vercel.app
```

## Caching

- Collections list: 5 phút
- Collection detail: 5 phút
- Lottery detail: 30 phút
- Video URL: 30 phút

Video URLs từ Bilibili CDN hết hạn sau ~15-24 giờ, nên cache 30 phút là an toàn.
