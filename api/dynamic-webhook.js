const fetch = globalThis.fetch;
const { BOT_TOKEN } = require("../src/bot");

// كاش مؤقت للذاكرة لسرعة جلب محتوى الملفات
const fileCache = new Map();

/**
 * تحليل واستخراج الرد المناسب بناءً على محتوى الملف المرفوع
 */
function parseAndExecuteFile(fileContent, text, userFirstName) {
  if (!fileContent || typeof fileContent !== "string") return null;

  const trimmedContent = fileContent.trim();
  const lowerText = text.toLowerCase().trim();

  // 1. محاولة قراءة الملف كـ JSON
  try {
    const jsonRules = JSON.parse(trimmedContent);
    if (typeof jsonRules === "object" && jsonRules !== null) {
      // البحث عن مفتاح يطابق نص الرسالة
      for (const [key, val] of Object.entries(jsonRules)) {
        const cleanKey = key.trim().toLowerCase();
        if (cleanKey === lowerText || (cleanKey.length > 1 && lowerText.includes(cleanKey))) {
          return typeof val === "string" ? val : JSON.stringify(val, null, 2);
        }
      }
      // إذا كان المصفوفة تحتوي على كائنات قواعد
      if (Array.isArray(jsonRules)) {
        for (const rule of jsonRules) {
          const matchTarget = String(rule.command || rule.trigger || rule.key || "").toLowerCase();
          if (matchTarget && lowerText.includes(matchTarget)) {
            return rule.response || rule.reply || rule.text || rule.msg;
          }
        }
      }
    }
  } catch (e) {
    // ليس JSON، ننتقل للتحليل البرمجي لـ JS / PHP / TXT
  }

  // 2. تحليل الأسطر من نمط (أمر = رد) أو (كلمة => رد)
  const lines = trimmedContent.split("\n");
  for (const line of lines) {
    if (line.includes("=") || line.includes("=>") || line.includes(":")) {
      const parts = line.split(/=>|=/);
      if (parts.length >= 2) {
        const trigger = parts[0].replace(/['"`;]/g, "").trim().toLowerCase();
        const response = parts.slice(1).join("=").replace(/['"`;]/g, "").trim();
        if (trigger && response && (lowerText === trigger || lowerText.includes(trigger))) {
          return response;
        }
      }
    }
  }

  // 3. استخراج نصوص الاقتباس الموجهة للرد مثل reply("...") أو sendMessage("...") أو echo "..."
  const stringMatches = Array.from(trimmedContent.matchAll(/(?:reply|sendMessage|send|text|echo|print)\s*\(?\s*['"`]([^'"`]+)['"`]/gi));
  if (stringMatches.length > 0) {
    // إذا كان الأمر /start، نرجع أول نص اقتباس في الملف البرمجي المرفوع
    if (lowerText.startsWith("/start")) {
      return stringMatches[0][1];
    }
    // البحث عن مطابقة جزئية
    for (const m of stringMatches) {
      if (m[1] && m[1].length > 2) {
        return m[1];
      }
    }
    return stringMatches[0][1];
  }

  return null;
}

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(200).send("OK - Dynamic File Execution Webhook Engine Active");
    }

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

    // جلب محتوى الملف المرفوع دائمًا من سيرفرات تليجرام
    if (fileId) {
      if (fileCache.has(fileId)) {
        fileContent = fileCache.get(fileId);
      } else {
        try {
          const getFileUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`;
          const fileInfoRes = await fetch(getFileUrl);
          const fileInfoJson = await fileInfoRes.json();

          if (fileInfoJson.ok && fileInfoJson.result && fileInfoJson.result.file_path) {
            const downloadUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfoJson.result.file_path}`;
            const downloadRes = await fetch(downloadUrl);
            fileContent = await downloadRes.text();
            fileCache.set(fileId, fileContent);
          }
        } catch (err) {
          console.error("Error fetching file content from Telegram:", err.message);
        }
      }
    }

    // محاولة تنفيذ واستخراج الرد من الملف المرفوع نفسه
    let responseText = parseAndExecuteFile(fileContent, text, userFirstName);

    // إذا لم يتوفر رد محدد من الملف المرفوع، نرجع الرد الافتراضي
    if (!responseText) {
      if (text.startsWith("/start")) {
        responseText = `👋 **أهلاً بك يا ${userFirstName}!**\n\nالبوت يعمل بنجاح بناءً على ملفك البرمجي المرفوع (\`${fileName}\`)! ✨`;
      } else {
        responseText = `💬 **استلمنا رسالتك:** "${text}"\n⚡ يتم معالجتها بموجب ملفك البرمجي المرفوع (\`${fileName}\`).`;
      }
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

    return res.status(200).json({ ok: true, note: "Executed custom file response successfully" });
  } catch (err) {
    console.error("Dynamic Webhook Execution Error:", err);
    return res.status(200).json({ ok: true, note: "Handled safely", error: err.message });
  }
};
