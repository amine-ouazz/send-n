import axios from "axios";
import CryptoJS from "crypto-js";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const AES_KEY = "secret-key-2005-09-08-12-00-00";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("الطريقة غير مسموحة.");
  }

  const { message: encryptedMsg } = req.body;
  if (!encryptedMsg) return res.status(400).send("رسالة غير صالحة.");

  let decryptedMsg;
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedMsg, AES_KEY);
    decryptedMsg = bytes.toString(CryptoJS.enc.Utf8);

    if (!decryptedMsg) throw new Error("فشل في فك التشفير.");
  } catch (err) {
    return res.status(400).send("الرسالة مشفرة بشكل خاطئ.");
  }

  const text = `📩 رسالة مجهولة:\n\n${decryptedMsg}`;

  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: text,
    });

    res.status(200).send("✅ تم الإرسال.");
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("❌ فشل في الإرسال.");
  }
}
