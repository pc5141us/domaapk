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
    .text("📂 قوالب وسورس كود جاهز للرفع", "download_templates")
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
    .text("📜 قالب Node.js جاهز", "tpl_nodejs")
    .text("📜 قالب PHP جاهز", "tpl_php")
    .row()
    .text("🔙 العودة للقائمة الرئيسية", "main_menu");
}

module.exports = {
  getMainMenuKeyboard,
  getBackKeyboard,
  getTemplatesKeyboard,
};
