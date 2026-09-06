const { InlineKeyboard } = require("grammy");

/**
 * القائمة الرئيسية التفاعلية لبوت رفع الملفات وتفعيل الويب هوك التلقائي
 */
function getMainMenuKeyboard() {
  return new InlineKeyboard()
    .text("📤 رفع ملف كود لبوت وتفعيل الويب هوك", "start_set_other")
    .row()
    .text("ℹ️ فحص ويب هوك أي بوت", "start_info_other")
    .text("🗑️ حذف ويب هوك أي بوت", "start_delete_other")
    .row()
    .text("📂 صيغ وقوالب الملفات المعتمدة للردود", "download_templates")
    .row()
    .text("🤖 بيانات المحرك المستضيف", "this_bot_info");
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
    .text("📜 صيغة JSON للردود التلقائية", "tpl_json")
    .text("📜 صيغة نصية TXT بسيطة", "tpl_txt")
    .row()
    .text("📜 صيغة JS / Node.js", "tpl_nodejs")
    .text("📜 صيغة PHP", "tpl_php")
    .row()
    .text("🔙 العودة للقائمة الرئيسية", "main_menu");
}

module.exports = {
  getMainMenuKeyboard,
  getBackKeyboard,
  getTemplatesKeyboard,
};
