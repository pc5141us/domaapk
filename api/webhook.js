const { webhookCallback } = require("grammy");
const { bot } = require("../src/bot");

const handleWebhook = webhookCallback(bot, "express");

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(200).send("OK - Telegram Webhook Endpoint Active");
    }

    // التأكد من تحويل نص الجسم إلى JSON إذا جاء كسطر نصي
    if (typeof req.body === "string") {
      try {
        req.body = JSON.parse(req.body);
      } catch (e) {}
    }

    return await handleWebhook(req, res);
  } catch (err) {
    console.error("Webhook Execution Error:", err);
    // إرجاع 200 لتجنب حظر تليجرام للويب هوك عند حصول أخطاء عابرة
    return res.status(200).json({ ok: true, note: "Handled error safely", error: err.message });
  }
};

