const { bot } = require("../src/bot");

module.exports = async (req, res) => {
  try {
    // استخراج الهوست تلقائياً من الطلب أو من المتغيرات البيئية
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["host"] || req.headers["x-forwarded-host"];
    
    // إمكانية تحديد رابط مخصص عبر البارامتر ?url=https://...
    let webhookUrl = req.query.url;

    if (!webhookUrl) {
      if (host) {
        webhookUrl = `${protocol}://${host}/api/webhook`;
      } else if (process.env.VERCEL_URL && !process.env.VERCEL_URL.includes("localhost")) {
        let envUrl = process.env.VERCEL_URL;
        if (!envUrl.startsWith("http")) envUrl = `https://${envUrl}`;
        webhookUrl = `${envUrl}/api/webhook`;
      }
    }

    if (!webhookUrl) {
      return res.status(400).json({
        ok: false,
        message: "❌ تعذر تحديد رابط الويب هوك تلقائياً. يرجى تزويد الرابط عبر ?url=HTTPS_URL",
      });
    }

    // تفعيل الويب هوك عبر Telegram API
    const result = await bot.api.setWebhook(webhookUrl, {
      drop_pending_updates: false,
    });

    const botInfo = await bot.api.getMe();

    return res.status(200).json({
      ok: result,
      message: "✅ تم ربط الويب هوك بنجاح على Vercel!",
      webhook_url: webhookUrl,
      bot: {
        id: botInfo.id,
        first_name: botInfo.first_name,
        username: botInfo.username,
      },
    });
  } catch (error) {
    console.error("Set Webhook Error:", error);
    return res.status(500).json({
      ok: false,
      message: "❌ حدث خطأ أثناء تفعيل الويب هوك",
      error: error.message,
    });
  }
};
