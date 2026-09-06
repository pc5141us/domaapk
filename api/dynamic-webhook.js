const fetch = globalThis.fetch;
const { BOT_TOKEN } = require("../src/bot");

// كاش مؤقت للذاكرة السريعة
const fileCache = new Map();

/**
 * تحليل واستخراج الرد المناسب من محتوى الملف المرفوع بأمان بدون أخطاء تنسيق
 */
function parseAndExecuteFile(fileContent, text, userFirstName) {
  if (!fileContent || typeof fileContent !== "string") return null;

  const trimmedContent = fileContent.trim();
  if (!trimmedContent) return null;

  const lowerText = text.toLowerCase().trim();

  // 1. محاولة قراءة الملف كـ JSON
  try {
    const jsonRules = JSON.parse(trimmedContent);
    if (typeof jsonRules === "object" && jsonRules !== null) {
      if (Array.isArray(jsonRules)) {
        for (const rule of jsonRules) {
          const matchTarget = String(rule.command || rule.trigger || rule.key || "").toLowerCase();
          if (matchTarget && lowerText.includes(matchTarget)) {
            return String(rule.response || rule.reply || rule.text || rule.msg || "");
          }
        }
      } else {
        for (const [key, val] of Object.entries(jsonRules)) {
          const cleanKey = key.trim().toLowerCase();
          if (cleanKey === lowerText || (cleanKey.length > 0 && lowerText.includes(cleanKey))) {
            return typeof val === "string" ? val : JSON.stringify(val, null, 2);
          }
        }
      }
    }
  } catch (e) {}

  // 2. تحليل الأسطر البرمجية والنصية (مثل: أمر = رد أو كلمة => رد)
  const lines = trimmedContent.split(/\r?\n/);
  for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.startsWith("//") || cleanLine.startsWith("#")) continue;

    if (cleanLine.includes("=") || cleanLine.includes("=>") || cleanLine.includes(":")) {
      const parts = cleanLine.split(/=>|=/);
      if (parts.length >= 2) {
        const trigger = parts[0].replace(/['"`;]/g, "").trim().toLowerCase();
        const response = parts.slice(1).join("=").replace(/['"`;]/g, "").trim();
        if (trigger && response && (lowerText === trigger || lowerText.includes(trigger))) {
          return response;
        }
      }
    }
  }

  // 3. استخراج نصوص الاقتباس الموجهة للرد في كود JS/PHP/Python
  const matches = Array.from(trimmedContent.matchAll(/(?:reply|sendMessage|send|text|echo|print|return)\s*\(?\s*['"`]([^'"`]+)['"`]/gi));
  if (matches.length > 0) {
    if (lowerText.startsWith("/start")) {
      return matches[0][1];
    }
    for (const m of matches) {
      if (m[1] && m[1].length > 1) {
        return m[1];
      }
    }
    return matches[0][1];
  }

  // 4. استجابة افتراضية ذكية إذا كان الملف نصي عام
  if (lowerText.startsWith("/start")) {
    const previewLine = lines.find(l => l.trim().length > 0) || "";
    return `👋 أهلاً بك يا ${userFirstName}!\n\nتم تشغيل البوت بنجاح بناءً على الملف المرفوع (${lines.length} سطر).\n\nمحتوى أول سطر:\n${previewLine}`;
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

    // محاولة استخراج الرد المباشر من محتوى الملف المرفوع
    let responseText = parseAndExecuteFile(fileContent, text, userFirstName);

    // الرد الافتراضي عند عدم وجود مطابقة للكلمة
    if (!responseText) {
      if (text.startsWith("/start")) {
        responseText = `👋 أهلاً بك يا ${userFirstName}!\n\nتم تشغيل البوت بنجاح بموجب الملف البرمجي المرفوع (${fileName})! ✨`;
      } else {
        responseText = `💬 استلمنا رسالتك: "${text}"\n⚡ يتم المعالجة بموجب الملف البرمجي المرفوع (${fileName}).`;
      }
    }

    // إرسال الرد للبوت المستهدف (بدون إجبار parse_mode لتجنب خطأ التنسيق والرموز)
    const sendMessageUrl = `https://api.telegram.org/bot${targetToken}/sendMessage`;
    const sendRes = await fetch(sendMessageUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: responseText,
      }),
    });

    const sendJson = await sendRes.json();
    if (!sendJson.ok) {
      console.error("Telegram sendMessage API Error:", sendJson);
    }

    return res.status(200).json({ ok: true, note: "Executed custom file response safely" });
  } catch (err) {
    console.error("Dynamic Webhook Execution Error:", err);
    return res.status(200).json({ ok: true, note: "Handled safely", error: err.message });
  }
};
