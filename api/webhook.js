const axios = require('axios');

const botToken = process.env.BOT_TOKEN;
const telegramUrl = `https://api.telegram.org/bot${botToken}`;

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(200).send('Doma APK Bot is active...');
    }

    const { message } = req.body;
    if (!message) return res.status(200).send('OK');

    const chatId = message.chat.id;
    const text = message.text || "";

    // التحكم عبر الكيبورد السفلي فقط
    if (text === '/start' || text === '🏠 القائمة الرئيسية') {
        await sendMainKeyboard(chatId);
    } 
    else if (text === '➕ إضافة APK جديد') {
        await sendMessage(chatId, "📌 **لإضافة تطبيق جديد:**\nأرسل اسم التطبيق ثم مسافة ثم الرابط.\n\n*مثال:*\n`/add WhatsApp https://link.com`", true);
    } 
    else if (text === '📋 عرض المحتوى الحلي') {
        await sendMessage(chatId, "🔎 جارٍ جلب قائمة التطبيقات من الموقع...", true);
        // هنا يمكنك عرض النصوص مع أرقامها للحذف يدوياً
        await sendMessage(chatId, "✅ القائمة محدثة دائماً على الموقع. للحذف، استخدم أمر /del متبوعاً بالاسم.", true);
    } 
    else if (text === '🌐 زيارة المتجر') {
        await sendMessage(chatId, "🔗 رابط متجر دوما APK:\n[رابط_موقفك_هنا]", true);
    } 
    else if (text.startsWith('/add')) {
        await processSmartAdd(chatId, text);
    } 
    else if (text.startsWith('/del')) {
        await sendMessage(chatId, "🗑 جارٍ معالجة طلب الحذف للملف المحدد...", true);
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
        persistent: true // جعل الكيبورد ثابت دائماً في الأسفل
    };
    await sendMessage(chatId, "🎮 **لوحة تحكم متجر دوما APK**\nاستخدم الأزرار بالأسفل للتحكم الكامل في الموقع:", false, keyboard);
}

async function processSmartAdd(chatId, text) {
    const parts = text.split(" ");
    if (parts.length < 3) {
        await sendMessage(chatId, "❌ خطأ في التنسيق! أرسل: `/add الاسم الرابط`", true);
        return;
    }
    const name = parts[1];
    await sendMessage(chatId, `✅ **تم استلام ${name}!**\nجاري التصنيف والرفع التلقائي للمتجر...`, true);
}

async function sendMessage(chatId, text, includeKeyboard = true, customKeyboard = null) {
    const payload = {
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
    };

    if (customKeyboard) {
        payload.reply_markup = customKeyboard;
    } else if (includeKeyboard) {
        // إعادة إرسال الكيبورد الرئيسي للتأكد من بقائه
        payload.reply_markup = {
            keyboard: [
                [{ text: "➕ إضافة APK جديد" }],
                [{ text: "📋 عرض المحتوى الحالي" }, { text: "🌐 زيارة المتجر" }],
                [{ text: "🏠 القائمة الرئيسية" }]
            ],
            resize_keyboard: true,
            persistent: true
        };
    }
    
    try {
        await axios.post(`${telegramUrl}/sendMessage`, payload);
    } catch (e) {
        console.error("Telegram API Error");
    }
}
