const fs = require("fs");
const path = require("path");

// المسار المحلي لتخزين بيانات وملفات البوتات المستضافة
const DATA_DIR = path.join(__dirname, "../data");
const BOTS_FILE = path.join(DATA_DIR, "hosted_bots.json");

// التأكد من وجود مجلد البيانات
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// القاموس المؤقت في الذاكرة
let hostedBots = {};

// تحميل البيانات المحفوظة سابقاً إن وجدت
try {
  if (fs.existsSync(BOTS_FILE)) {
    const raw = fs.readFileSync(BOTS_FILE, "utf8");
    hostedBots = JSON.parse(raw);
  }
} catch (e) {
  console.error("Error reading hosted_bots.json:", e.message);
  hostedBots = {};
}

function saveHostedBots() {
  try {
    fs.writeFileSync(BOTS_FILE, JSON.stringify(hostedBots, null, 2), "utf8");
  } catch (e) {
    console.error("Error saving hosted_bots.json:", e.message);
  }
}

/**
 * تسجيل وتخزين بوت جديد مع ملف الكود الخاص به
 */
function registerHostedBot(botId, botToken, botInfo, fileName, fileContent) {
  hostedBots[botId] = {
    botId: String(botId),
    botToken,
    username: botInfo.username,
    first_name: botInfo.first_name,
    fileName,
    fileContent,
    updatedAt: new Date().toISOString(),
  };
  saveHostedBots();
  return hostedBots[botId];
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
