import crypto from 'crypto';

const BOT_TOKEN = '7926659142:AAGLxdrm9eoBa108vGN2P8g0jVz2MiiXIug';  // عوض هنا بالتوكن
const CHAT_ID = '7340138728';                // عوض هنا بالآي دي الخاص بك
const SECRET_KEY = 'amine-ouazzi';  // سر تشفير خاص بك

// لتخزين جلسة بسيطة في الذاكرة (لأغراض المثال فقط)
let session = {
  lastUpdate: 0,
  timeoutMs: 5 * 60 * 1000 // 5 دقائق
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const now = Date.now();
  // تحقق من الجلسة: هل انتهت؟
  if (now - session.lastUpdate > session.timeoutMs) {
    session.lastUpdate = now;
  } else {
    // إذا حاول المستخدم إرسال رسالة قبل انتهاء المهلة، امنع السبام
    return res.status(429).json({ error: 'Too many requests, wait for session reset.' });
  }

  try {
    const { encryptedMessage, iv, sessionId } = req.body;

    // تحقق أن الرسالة والجلسة موجودة
    if (!encryptedMessage || !iv || !sessionId) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    // تحقق أن sessionId يطابق الجلسة الحالية (من موقعك)
    if (sessionId !== SECRET_KEY) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // فك التشفير (AES-256-CBC)
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      crypto.createHash('sha256').update(SECRET_KEY).digest(),
      Buffer.from(iv, 'hex')
    );

    let decrypted = decipher.update(encryptedMessage, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    // إرسال الرسالة المفككة إلى بوت تيليجرام
    const telegramResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: decrypted,
      }),
    });

    const telegramData = await telegramResponse.json();

    if (!telegramData.ok) {
      throw new Error('Telegram API error');
    }

    res.status(200).json({ success: true, message: 'Message sent to Telegram' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
