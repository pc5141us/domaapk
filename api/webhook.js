const axios = require('axios');

// توكن البوت والبيانات الأساسية
const botToken = "8791910472:AAFV5-CMq0QuOnPGa8QR-UmxTGOWOjySrds";
const adminId = 682572594;
const telegramUrl = `https://api.telegram.org/bot${botToken}`;
const GAS_URL = "https://script.google.com/macros/s/AKfycbxgr2lfK9pdy4ChWEZIey5yahTsnd9zjh1XRoffPBhQzZnLI4o-jkuQGRhiKellMg4/exec";

module.exports = async (req, res) => {
    // التأكد أن الطلب قادم من تلجرام
    if (req.method !== 'POST') return res.status(200).send('Bot is Active');

    const { message, callback_query } = req.body;
    
    // 1. التعامل مع الأزرار المضمنة (Callback Queries)
    if (callback_query) {
        const chatId = callback_query.message.chat.id;
        const data = callback_query.data;

        if (data.startsWith('del_')) {
            const appId = data.replace('del_', '');
            await sendMessage(chatId, "⏳ جاري الحذف...");
            try {
                await axios.post(GAS_URL, { action: "delete_item", id: appId });
                await sendMessage(chatId, "✅ تم الحذف وتحديث الموقع بنجاح.");
                await sendManageKeyboard(chatId);
            } catch (e) { await sendMessage(chatId, "❌ فشل حذف البرنامج."); }
        }
        else if (data === 'cancel') {
            await sendMessage(chatId, "🏠 تم إلغاء العملية.");
            await sendMainKeyboard(chatId);
        }
        return res.status(200).send('OK');
    }

    if (!message) return res.status(200).send('OK');
    const chatId = message.chat.id;
    const text = message.text || "";

    // التأكد من هوية الأدمن
    if (chatId.toString() !== adminId.toString()) return res.status(200).send('Unauthorized');

    // 2. نظام الإضافة اليدوي المتسلسل
    if (message.reply_to_message) {
        const replyText = message.reply_to_message.text;

        if (replyText.includes("أرسل اسم التطبيق الآن")) {
            await sendMessage(chatId, `🖼 **الخطوة 2:** أرسل رابط صورة التطبيق لـ:\n\n*${text}*`, { reply_markup: { force_reply: true, selective: true } });
        }
        else if (replyText.includes("أرسل رابط صورة التطبيق لـ")) {
            const name = replyText.split("\n\n*")[1].replace(/\*/g, "");
            await sendMessage(chatId, `📝 **الخطوة 3:** أرسل وصفاً للتطبيق:\n\n*اسم:* ${name}\n*صورة:* ${text}`, { reply_markup: { force_reply: true, selective: true } });
        }
        else if (replyText.includes("أرسل وصفاً للتطبيق")) {
            const lines = replyText.split("\n");
            const name = lines[2].replace("*اسم:* ", "");
            const icon = lines[3].replace("*صورة:* ", "");
            await sendMessage(chatId, `🔗 **الخطوة الأخيرة:** أرسل رابط التحميل لـ:\n\n*الاسم:* ${name}\n*الصورة:* ${icon}\n*الوصف:* ${text}`, { reply_markup: { force_reply: true, selective: true } });
        }
        else if (replyText.includes("أرسل رابط التحميل لـ")) {
            const lines = replyText.split("\n");
            const name = lines[2].replace("*الاسم:* ", "");
            const icon = lines[3].replace("*الصورة:* ", "");
            const desc = lines[4].replace("*الوصف:* ", "");
            const link = text;
            await sendMessage(chatId, "⏳ جاري الرفع للموقع...");
            try {
                await axios.post(GAS_URL, { action: "add_manual", name, icon, desc, link });
                await sendMessage(chatId, "✅ **تمت الإضافة بنجاح!**");
            } catch (err) { await sendMessage(chatId, "❌ حدث خطأ أثناء الحفظ."); }
            await sendMainKeyboard(chatId);
        }
        return res.status(200).send('OK');
    }

    // 3. الأوامر والقائمة الرئيسية
    if (text === '/start' || text === '🏠 القائمة الرئيسية') await sendMainKeyboard(chatId);
    else if (text === '➕ إضافة APK جديد') {
        await sendMessage(chatId, "📝 **الخطوة 1:** أرسل اسم التطبيق الآن:", { reply_markup: { force_reply: true, selective: true } });
    }
    else if (text === '📋 إدارة المحتوى' || text === '📋 عرض وحذف المحتوى') await sendManageKeyboard(chatId);
    else if (text.startsWith('⚙️ إدارة:')) {
        const idMatch = text.match(/\(#([^)]+)\)/);
        if (idMatch) {
            const appId = idMatch[1];
            const appTitle = text.split('⚙️ إدارة: ')[1].split(' (#')[0];
            const inlineKeyboard = {
                inline_keyboard: [
                    [{ text: "🗑 حذف نهائي", callback_data: `del_${appId}` }],
                    [{ text: "❌ إلغاء", callback_data: "cancel" }]
                ]
            };
            await sendMessage(chatId, `🛠 **إدارة:** *${appTitle}*\n🆔 *${appId}*`, { reply_markup: inlineKeyboard });
        }
    } else {
        await sendMainKeyboard(chatId);
    }

    res.status(200).send('OK');
};

async function sendMainKeyboard(chatId) {
    const keyboard = {
        keyboard: [[{ text: "➕ إضافة APK جديد" }], [{ text: "📋 إدارة المحتوى" }, { text: "🌐 زيارة المتجر" }]],
        resize_keyboard: true, persistent: true
    };
    await sendMessage(chatId, "🎮 **مرحباً بك في لوحة تحكم دوما APK:**", { reply_markup: keyboard });
}

async function sendManageKeyboard(chatId) {
    try {
        const timestamp = Date.now();
        const response = await axios.get(`${GAS_URL}?t=${timestamp}`);
        const apps = response.data;
        if (apps.length === 0) return await sendMessage(chatId, "📭 فارغ حالياً.");
        const keyboard = {
            keyboard: apps.slice(0, 50).map(app => [{ text: `⚙️ إدارة: ${app.title} (#${app.id})` }]),
            resize_keyboard: true
        };
        keyboard.keyboard.push([{ text: "🏠 القائمة الرئيسية" }]);
        await sendMessage(chatId, "📂 اختر التطبيق للإدارة:", { reply_markup: keyboard });
    } catch (e) { await sendMessage(chatId, "❌ فشل الاتصال بقاعدة البيانات."); }
}

async function sendMessage(chatId, text, extra = {}) {
    try { await axios.post(`${telegramUrl}/sendMessage`, { chat_id: chatId, text, parse_mode: 'Markdown', ...extra }); } catch(e) {}
}
