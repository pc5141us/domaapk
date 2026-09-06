const express = require("express");
const { webhookCallback } = require("grammy");
const { bot, BOT_TOKEN } = require("./src/bot");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

// إذا كنا نشغل المشروع محلياً وليس على بيئة Serverless Vercel
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  const app = express();
  app.use(express.json());

  // نقطة الويب هوك
  app.post("/api/webhook", webhookCallback(bot, "express"));
  
  // نقطة تفعيل الويب هوك
  app.get("/api/set-webhook", require("./api/set-webhook"));
  
  // اللوحة الرئيسية
  app.get("/api/info", require("./api/info"));
  app.get("/", require("./api/info"));

  // تشغيل السيرفر المحلي أو تشغيل نظام Polling
  const usePolling = process.argv.includes("--polling");

  if (usePolling) {
    console.log("⚡ جاري تشغيل البوت محلياً بنظام (Long Polling)...");
    bot.start({
      onStart: (info) => {
        console.log(`✅ تم تشغيل البوت بنجاح: @${info.username} (${info.first_name})`);
        console.log("👉 أرسل /start للبوت في تليجرام لبدء الاستخدام.");
      },
    });
  } else {
    app.listen(PORT, () => {
      console.log(`🚀 خادم البوت المحلي يعمل الآن على المنفذ: http://localhost:${PORT}`);
      console.log(`🌐 لرؤية لوحة المعلومات: http://localhost:${PORT}/api/info`);
      console.log("💡 لتشغيل البوت بنظام Polling المباشر استخدم: npm start -- --polling");
    });
  }
} else {
  module.exports = bot;
}
