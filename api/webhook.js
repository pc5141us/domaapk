const { webhookCallback } = require("grammy");
const { bot } = require("../src/bot");

// دالة Serverless الخاصة بـ Vercel لمعالجة تحديثات تليجرام
module.exports = webhookCallback(bot, "express");
