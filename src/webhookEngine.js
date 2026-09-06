const fs = require("fs");
const path = require("path");
const os = require("os");

// في بيئة Vercel Serverless، يكون المجلد الوحيد القابل للكتابة هو os.tmpdir() (/tmp)
const DATA_DIR = path.join(os.tmpdir(), "telegram_bots_data");
const BOTS_FILE = path.join(DATA_DIR, "hosted_bots.json");

let hostedBots = {};

// تهيئة ذاكرة البيانات بأمان بدون التسبب في تعطل السيرفر
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(BOTS_FILE)) {
    const raw = fs.readFileSync(BOTS_FILE, "utf8");
    hostedBots = JSON.parse(raw);
  }
} catch (e) {
  console.warn("Storage notice:", e.message);
  hostedBots = {};
}

function saveHostedBots() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(BOTS_FILE, JSON.stringify(hostedBots, null, 2), "utf8");
  } catch (e) {
    console.warn("Save storage notice:", e.message);
  }
}

/**
 * تسجيل وتخزين بوت جديد مع ملف الكود الخاص به
 */
function registerHostedBot(botId, botToken, botInfo, fileName, fileContent) {
  hostedBots[String(botId)] = {
    botId: String(botId),
    botToken,
    username: botInfo.username,
    first_name: botInfo.first_name,
    fileName,
    fileContent,
    updatedAt: new Date().toISOString(),
  };
  saveHostedBots();
  return hostedBots[String(botId)];
}

/**
 * الحصول على بيانات بوت مستضاف برقم البوت
 */
function getHostedBot(botId) {
  return hostedBots[String(botId)];
}

/**
 * الحصول على جميع البوتات المستضافة
 */
function getAllHostedBots() {
  return Object.values(hostedBots);
}

module.exports = {
  registerHostedBot,
  getHostedBot,
  getAllHostedBots,
};
