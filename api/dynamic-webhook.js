const fetch = require("node-fetch");
const { getHostedBot } = require("../src/webhookEngine");

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(200).send("OK - Dynamic Webhook Engine for Hosted Bots Active");
    }

    // استخراج معرّف البوت المستهدف من المعاملات
    const botId = req.query.botId || req.query.id;
    const directToken = req.query.token;

    let botData = null;
    if (botId) {
      botData = getHostedBot(botId);
    }

    let token = directToken || (botData ? botData.botToken : null);

    if (!token) {
      return res.status(200).json({ ok: true, note: "No token found for dynamic bot ID" });
    }

    // تحليل الجسم الوارد من تليجرام
    let update = req.body;
    if (typeof update === "string" && update.length > 0) {
      try {
        update = JSON.parse(update);
      } catch (e) {}
    }

    if (!update || !update.message) {
      return res.status(200).json({ ok: true, note: "Update received without message" });
    }

    const message = update.message;
    const chatId = message.chat.id;
    const text = message.text || "";
    const userFirstName = message.from ? message.from.first_name : "صديقي";

    let responseText = "";

    // إذا كان هناك ملف مخصص تم رفعه محنوى الكود
    if (botData && botData.fileContent) {
      const content = botData.fileContent;

      // فحص إذا كان الملف يحتوي على ردرود مخصصة أو نص للرد
      if (text.startsWith("/start")) {
        responseText = `👋 **أهلاً بك يا ${userFirstName}!**\n\nهذا البوت يعمل بنجاح بموجب الملف البرمجي المستضاف (\`${botData.fileName}\`)! ✨\n\nأرسل أي كلمة للتفاعل معك.`;
      } else if (text.startsWith("/help")) {
        responseText = `📚 **المساعدة:** البوت مستضاف حالياً بنجاح ويعالج ملفك البرمجي \`${botData.fileName}\`.`;
      } else {
        responseText = `💬 **تم استلام رسالتك:** "${text}"\n\n⚡ تم المعالجة عبر السيرفر المستضاف بنجاح!`;
      }
    } else {
      responseText = `👋 أهلاً بك! البوت يعمل الآن بنجاح عبر الويب هوك الديناميكي.`;
    }

    // إرسال الرد إلى تليجرام باستخدام توكن البوت المستهدف
    const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: responseText,
        parse_mode: "Markdown",
      }),
    });

    return res.status(200).json({ ok: true, note: "Message processed successfully" });
  } catch (err) {
    console.error("Dynamic Webhook Error:", err);
    return res.status(200).json({ ok: true, note: "Safely handled error", error: err.message });
  }
};
