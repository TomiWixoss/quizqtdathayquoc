import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load service account
const serviceAccount = JSON.parse(
  readFileSync(resolve(process.cwd(), 'firebase-service-account.json'), 'utf8')
);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function sendSupportMail() {
  const mailData = {
    title: "🎁 QUÀ ỦNG HỘ ÔN THI 20/01",
    content: "Chúc các bạn thi tốt môn Quản trị dự án vào ngày 20/01 tới! Món quà 1 TỶ Kim Cương này hy vọng sẽ giúp các bạn có thêm động lực học tập và đạt kết quả cao nhất. Cố gắng lên nhé!",
    reward: 1000000000,
    active: true,
    createdAt: new Date().toISOString(),
    type: "system"
  };

  try {
    const docRef = await db.collection('mails').add(mailData);
    console.log('✅ Mail sent successfully with ID:', docRef.id);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error sending mail:', error);
    process.exit(1);
  }
}

sendSupportMail();
