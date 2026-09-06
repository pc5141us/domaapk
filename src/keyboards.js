const { InlineKeyboard } = require("grammy");

/**
 * القائمة الرئيسية التفاعلية لبوت صانع ومقترن الويب هوك للبوتات الأخرى
 */
function getMainMenuKeyboard() {
  return new InlineKeyboard()
    .text("➕ ربط ويب هوك لبوت آخر", "start_set_other")
    .row()
    .text("ℹ️ فحص ويب هوك أي بوت", "start_info_other")
    .text("🗑️ حذف ويب هوك أي بوت", "start_delete_other")
    .row()
    .text("📂 تحميل أكواب وقوالب جاهزة", "download_templates")
    .text("🚀 دليل رفع كودك على Vercel", "vercel_guide")
    .row()
    .text("🤖 معلومات صانع الويب هوك", "this_bot_info");
}

/**
 * زر العودة وإلغاء العملية
 */
function getBackKeyboard() {
  return new InlineKeyboard()
    .text("🔙 العودة للقائمة الرئيسية", "main_menu")
    .text("❌ إلغاء العملية", "cancel_action");
}

/**
 * لوحة الأكواد والقوالب البرمجية الجاهزة
 */
function getTemplatesKeyboard() {
  return new InlineKeyboard()
    .text("📜 قالب Node.js / Express", "tpl_nodejs")
    .text("📜 قالب PHP Webhook", "tpl_php")
    .row()
    .text("📜 قالب Python / Telebot", "tpl_python")
    .row()
    .text("🔙 العودة للقائمة الرئيسية", "main_menu");
}

module.exports = {
  getMainMenuKeyboard,
  getBackKeyboard,
  getTemplatesKeyboard,
};
