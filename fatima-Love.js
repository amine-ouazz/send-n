// project-root/api/index.js

// ستحتاج إلى node-fetch لإجراء طلبات HTTP إلى Telegram API
// قم بتثبيته إذا لم يكن موجودًا: npm install node-fetch
const fetch = require('node-fetch');

// ---! مهم: قم بتعيين هذه كمتغيرات بيئة في إعدادات مشروع Vercel الخاص بك !---
// يمكنك وضع القيم مباشرة هنا للتجربة السريعة، ولكن للأمان يفضل استخدام متغيرات البيئة.
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7926659142:AAGLxdrm9eoBa108vGN2P8g0jVz2MiiXIug';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '7340138728';

export default async function handler(req, res) {
    // السماح بالطلبات من أي مصدر (للتطوير). في الإنتاج، قد ترغب في تقييد هذا.
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        // التعامل مع طلبات OPTIONS (preflight) لـ CORS
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    }

    try {
        const { message } = req.body;

        if (!message || typeof message !== 'string' || message.trim() === '') {
            return res.status(400).json({ ok: false, error: 'Message is required and must be a non-empty string.' });
        }

        if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
            console.error('Server configuration error: Telegram token or chat ID is missing.');
            return res.status(500).json({ ok: false, error: 'Server configuration error. Please check Telegram Bot Token and Chat ID.' });
        }

        const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const telegramPayload = {
            chat_id: TELEGRAM_CHAT_ID,
            text: `رسالة جديدة من الصفحة الشخصية:\n\n${message.trim()}`,
            // يمكنك إضافة parse_mode إذا أردت:
            // parse_mode: 'MarkdownV2' // أو 'HTML'
        };

        const telegramResponse = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(telegramPayload),
        });

        const telegramResult = await telegramResponse.json();

        if (!telegramResult.ok) {
            console.error('Telegram API Error:', telegramResult.description, 'Error Code:', telegramResult.error_code);
            // حاول تقديم رسالة خطأ أوضح للعميل إذا أمكن
            let clientError = `Telegram API Error: ${telegramResult.description}`;
            if (telegramResult.error_code === 400 && telegramResult.description.includes("chat not found")) {
                clientError = "خطأ في الإرسال: لم يتم العثور على الدردشة (تأكد من صحة Chat ID وأن البوت لديه صلاحية إرسال رسائل إليها).";
            } else if (telegramResult.error_code === 401 && telegramResult.description.includes("Unauthorized")) {
                 clientError = "خطأ في الإرسال: توكن البوت غير صحيح أو غير مصرح له.";
            }
            return res.status(telegramResponse.status).json({ ok: false, error: clientError, telegram_response: telegramResult });
        }

        return res.status(200).json({ ok: true, message: 'Message sent to Telegram successfully.' });

    } catch (error) {
        console.error('Error processing request:', error.message);
        console.error('Stacktrace:', error.stack);
        return res.status(500).json({ ok: false, error: 'Failed to process message due to an internal server error.' });
    }
}
