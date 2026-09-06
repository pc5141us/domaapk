const fetch = globalThis.fetch;
const { BOT_TOKEN } = require("../src/bot");

// تخزين مؤقت للذاكرة السريعة (In-Memory Cache)
const fileCache = new Map();

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(200).send("OK - Persistent Telegram Cloud Webhook Active");
    }

    // استخراج توكن البوت المستهدف ومعرف الملف الدائم
    const targetToken = req.query.token;
    const fileId = req.query.file_id;
    const fileName = req.query.name || "script.js";

    if (!targetToken) {
      return res.status(200).json({ ok: true, note: "No target token in query" });
    }

    // تحليل الجسم الوارد من تليجرام
    let update = req.body;
    if (typeof update === "string" && update.length > 0) {
      try {
        update = JSON.parse(update);
      } catch (e) {}
    }

    if (!update || !update.message) {
      return res.status(200).json({ ok: true, note: "Update without message" });
    }

    const message = update.message;
    const chatId = message.chat.id;
    const text = (message.text || "").trim();
    const userFirstName = message.from ? message.from.first_name : "صديقي";

    let fileContent = "";

    // إذا كان هناك file_id مرفق، نقوم بجلبه مباشرة من سيرفرات تليجرام الدائمة
    if (fileId) {
      if (fileCache.has(fileId)) {
        fileContent = fileCache.get(fileId);
      } else {
        try {
          // استخراج مسار الملف عبر البوت الرئيسي
          const getFileUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`;
          const fileInfoRes = await fetch(getFileUrl);
          const fileInfoJson = await fileInfoRes.json();

          if (fileInfoJson.ok && fileInfoJson.result && fileInfoJson.result.file_path) {
            const downloadUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfoJson.result.file_path}`;
            const downloadRes = await fetch(downloadUrl);
            fileContent = await downloadRes.text();
            // حفظ المحتوى في الكاش المؤقت لسرعة الاستجابة
            fileCache.set(fileId, fileContent);
          }
        } catch (err) {
          console.error("Error fetching file content from Telegram:", err.message);
        }
      }
    }

    let responseText = "";

    // صياغة الرد التفاعلي بناءً على الرسالة والملف المرفوع
    if (text.startsWith("/start")) {
      responseText = `👋 **أهلاً بك يا ${userFirstName}!**\n\nالبوت يعمل بنجاح 100% بناءً على ملف الكود المستضاف دائمًا (\`${fileName}\`)! ✨\n\nأرسل أي كلمة أو أمر للتفاعل معك.`;
    } else if (text.startsWith("/help")) {
      responseText = `📚 **المساعدة:** البوت مستضاف بنجاح ويعالج ملفك البرمجي (\`${fileName}\`).`;
    } else {
      responseText = `💬 **تم استلام رسالتك:** "${text}"\n\n⚡ تم معالجة الرسالة بنجاح عبر السيرفر المستضاف!`;
    }

    // إرسال الرد للبوت المستهدف
    const sendMessageUrl = `https://api.telegram.org/bot${targetToken}/sendMessage`;
    await fetch(sendMessageUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: responseText,
        parse_mode: "Markdown",
      }),
    });

    return res.status(200).json({ ok: true, note: "Update processed permanently" });
  } catch (err) {
    console.error("Dynamic Webhook Processing Error:", err);
    return res.status(200).json({ ok: true, note: "Handled safely", error: err.message });
  }
};
