const { webhookCallback } = require("grammy");
const { bot } = require("../src/bot");

// استخدام محول express من grammy
const handleWebhook = webhookCallback(bot, "express");

module.exports = async (req, res) => {
  try {
    // التأكد من أن الطلب من نوع POST
    if (req.method !== "POST") {
      return res.status(200).send("OK - Telegram Webhook Endpoint Active");
    }

    // دعم دالة req.header المطلوبة من grammy لبيئة Vercel Serverless
    if (typeof req.header !== "function") {
      req.header = function (name) {
        if (!name) return undefined;
        return this.headers[name.toLowerCase()];
      };
    }

    // تحويل req.body إذا وصل كـ String بدلاً من JSON Object
    if (typeof req.body === "string" && req.body.trim().length > 0) {
      try {
        req.body = JSON.parse(req.body);
      } catch (e) {
        console.error("Error parsing JSON body:", e);
      }
    }

    // تنفيذ معالجة الويب هوك
    await handleWebhook(req, res);
  } catch (err) {
    console.error("Webhook Execution Error:", err);
    // إرجاع 200 لتجنب حظر الويب هوك من تليجرام عند الأخطاء العابرة
    if (!res.headersSent) {
      return res.status(200).json({ ok: true, note: "Handled error safely", error: err.message });
    }
  }
};
