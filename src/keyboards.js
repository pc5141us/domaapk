const { InlineKeyboard } = require("grammy");

/**
 * القائمة الرئيسية التفاعلية للبوت باللغة العربية
 */
function getMainMenuKeyboard() {
  return new InlineKeyboard()
    .text("ℹ️ فحص الويب هوك الحالي", "webhook_info")
    .text("🔗 ربط ويب هوك جديد", "webhook_set_prompt")
    .row()
    .text("🗑️ حذف الويب هوك الحالي", "webhook_delete_confirm")
    .text("🤖 بيانات وصلاحيات البوت", "bot_info")
    .row()
    .text("🧪 إرسال رسالة اختبارية", "test_msg")
    .text("🚀 دليل النشر على Vercel", "vercel_guide")
    .row()
    .url("🌐 التوثيق الرسمي لتليجرام", "https://core.telegram.org/bots/api#setwebhook");
}

/**
 * زر العودة للقائمة الرئيسية
 */
function getBackKeyboard() {
  return new InlineKeyboard().text("🔙 العودة للقائمة الرئيسية", "main_menu");
}

/**
 * لوحة تأكيد حذف الويب هوك
 */
function getDeleteConfirmKeyboard() {
  return new InlineKeyboard()
    .text("✅ نعم، أحذف الويب هوك", "webhook_delete_execute")
    .text("❌ إلغاء", "main_menu");
}

module.exports = {
  getMainMenuKeyboard,
  getBackKeyboard,
  getDeleteConfirmKeyboard,
};
