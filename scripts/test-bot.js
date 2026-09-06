const { Bot } = require("grammy");
require("dotenv").config();

const token = process.env.BOT_TOKEN || "5777908472:AAHoyjbO-SouHb8Mw3aYl51zdTKpj3DQuog";
const bot = new Bot(token);

async function testBot() {
  console.log("🔍 جاري التحقق من صلاحية التوكن والاتصال بتليجرام...");
  try {
    const me = await bot.api.getMe();
    console.log("✅ اتصالات البوت ناجحة 100%!");
    console.log(`🤖 اسم البوت: ${me.first_name}`);
    console.log(`👤 معرف اليوزر: @${me.username}`);
    console.log(`🆔 معرف البوت (ID): ${me.id}`);

    console.log("\n🌐 جاري جلب تفاصيل الويب هوك الحالي...");
    const webhookInfo = await bot.api.getWebhookInfo();
    console.log(`🔗 الرابط الحالي: ${webhookInfo.url || "غير مفعّل حالياً"}`);
    console.log(`📩 الرسائل المعلقة: ${webhookInfo.pending_update_count}`);
    if (webhookInfo.last_error_message) {
      console.log(`⚠️ آخر خطأ registrado: ${webhookInfo.last_error_message}`);
    }

    console.log("\n✨ البوت جاهز تماماً للاستخدام وللرفع على Vercel!");
  } catch (error) {
    console.error("❌ فشل الاتصال بتليجرام:", error.message);
    process.exit(1);
  }
}

testBot();
