const axios = require('axios');

const botToken = process.env.BOT_TOKEN;
const adminId = 682572594; 
const telegramUrl = `https://api.telegram.org/bot${botToken}`;

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(200).send('Active');

    const { message } = req.body;
    if (!message) return res.status(200).send('OK');

    const chatId = message.chat.id;
    const text = message.text || "";

    // حماية الأدمن
    if (chatId.toString() !== adminId.toString()) {
        return res.status(200).send('Unauthorized');
    }

    // 1. معالجة الردود أولاً (الخطوات التفاعلية)
    if (message.reply_to_message) {
        const replyText = message.reply_to_message.text;

        if (replyText.includes("أرسل اسم التطبيق الآن")) {
            await sendMessage(chatId, `🚀 ممتاز، الاسم هو: *${text}*\n\n🔗 **الخطوة 2:** أرسل رابط التحميل الآن لـ ${text}:`, { reply_markup: { force_reply: true, selective: true } });
        } 
        else if (replyText.includes("أرسل رابط التحميل الآن")) {
            const appName = replyText.split("لـ ")[1];
            const appLink = text;
            
            await sendMessage(chatId, `⏳ جاري معالجة الرفع لـ ${appName}...`);
            
            // إرسال البيانات لجوجل شيت عبر الرابط الذي قدمته
            try {
                await axios.post("https://script.google.com/macros/s/AKfycbx62qKg3x8gFAxF-tvQs176D9sN1NE292afMHSLDSSd3fZaxdzgA16C0HatmU-_PTZQ/exec", {
                    action: "add_from_vercel",
                    name: appName,
                    link: appLink
                });
                await sendMessage(chatId, "✅ **تمت الإضافة بنجاح!** الموقع سيظهر فيه التطبيق الآن.");
            } catch (err) {
                console.error("GAS API Error:", err);
                await sendMessage(chatId, "❌ حدث خطأ أثناء الحفظ في جوجل شيت. تأكد من أن السكريبت مفعّل كـ Web App.");
            }
            await sendMainKeyboard(chatId);
        }
        return res.status(200).send('OK');
    }

    // 2. معالجة الأوامر الرئيسية
    if (text === '/start' || text === '🏠 القائمة الرئيسية') {
        await sendMainKeyboard(chatId);
    } 
    else if (text === '➕ إضافة APK جديد') {
        await sendMessage(chatId, "📝 **الخطوة 1:** أرسل اسم التطبيق الآن:", { reply_markup: { force_reply: true, selective: true } });
    } 
    else {
        await sendMainKeyboard(chatId);
    }

    res.status(200).send('OK');
};

async function sendMainKeyboard(chatId) {
    const keyboard = {
        keyboard: [
            [{ text: "➕ إضافة APK جديد" }],
            [{ text: "📋 عرض المحتوى الحالي" }, { text: "🌐 زيارة المتجر" }],
            [{ text: "🏠 القائمة الرئيسية" }]
        ],
        resize_keyboard: true,
        persistent: true
    };
    await sendMessage(chatId, "🎮 **تحكم بمتجرك بسهولة عبر الأزرار أدناه:**", { reply_markup: keyboard });
}

async function sendMessage(chatId, text, extraParams = {}) {
    const payload = {
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
        ...extraParams
    };
    try {
        await axios.post(`${telegramUrl}/sendMessage`, payload);
    } catch (e) {
        console.error("Telegram API Error:", e.response ? e.response.data : e.message);
    }
}
