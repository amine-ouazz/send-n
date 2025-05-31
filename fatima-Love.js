const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require("cors");
const CryptoJS = require("crypto-js");

const app = express();

app.use(cors({ origin: "*" }));
app.use(bodyParser.json());
app.use(express.json());

const TELEGRAM_BOT_TOKEN = "8156375475:AAEE4TEFI5yG7KSB5qGghROI6Cer1Duo5ZA";
const TELEGRAM_CHAT_ID = '7340138728'

const AES_KEY = "secret-key-2005-09-08-12-00-00";

app.post("/", async (req, res) => {
  const encryptedMsg = req.body.message;
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

    res.status(200).send("تم الإرسال.");
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("فشل في الإرسال.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`السيرفر شغال على بورت ${PORT}`));
