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

    // 1. القائمة الرئيسية
    if (text === '/start' || text === '🏠 القائمة الرئيسية') {
        await sendMainKeyboard(chatId);
    } 
    // 2. طلب الاسم (الخطوة الأولى)
    else if (text === '➕ إضافة APK جديد') {
        await sendMessage(chatId, "📝 **الخطوة 1:** أرسل اسم التطبيق الآن:", { force_reply: true });
    } 
    // 3. معالجة الردود (الخطوات التالية)
    else if (message.reply_to_message) {
        const replyText = message.reply_to_message.text;

        if (replyText.includes("أرسل اسم التطبيق الآن")) {
            // حفظنا الاسم في المتصفح مؤقتاً عبر طلب الرابط والرد عليه
            await sendMessage(chatId, `🚀 ممتاز، الاسم هو: *${text}*\n\n🔗 **الخطوة 2:** أرسل رابط التحميل الآن لـ ${text}:`, { force_reply: true });
        } 
        else if (replyText.includes("أرسل رابط التحميل الآن")) {
            const appName = replyText.split("لـ ")[1];
            const appLink = text;
            
            await sendMessage(chatId, `⏳ جاري معالجة الرفع...\n📦 **الاسم:** ${appName}\n🔗 **الرابط:** ${appLink}`);
            
            // هنا تضع كود إرسال البيانات لقاعدة بياناتك
            await sendMessage(chatId, "✅ **تمت الإضافة بنجاح!** الموقع سيظهر فيه التطبيق الآن.", null);
            await sendMainKeyboard(chatId);
        }
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
    await sendMessage(chatId, "🎮 **مرحباً بك يا أدمن!**\nتحكم بمتجرك بسهولة عبر الأزرار أدناه:", { reply_markup: keyboard });
}

async function sendMessage(chatId, text, options = {}) {
    const payload = {
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
        ...options
    };
    try {
        await axios.post(`${telegramUrl}/sendMessage`, payload);
    } catch (e) {
        console.error("Telegram API Error");
    }
}
