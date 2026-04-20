const axios = require('axios');

const botToken = "8791910472:AAFV5-CMq0QuOnPGa8QR-UmxTGOWOjySrds";
const telegramUrl = `https://api.telegram.org/bot${botToken}`;
const GAS_URL = "https://script.google.com/macros/s/AKfycbxgr2lfK9pdy4ChWEZIey5yahTsnd9zjh1XRoffPBhQzZnLI4o-jkuQGRhiKellMg4/exec";

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(200).send('Bot is ready');

    try {
        const update = req.body;
        if (!update || (!update.message && !update.callback_query)) return res.status(200).send('OK');

        const message = update.message;
        const callback_query = update.callback_query;
        const chatId = message ? message.chat.id : callback_query.message.chat.id;

        // 1. الأزرار المضمنة
        if (callback_query) {
            const data = callback_query.data;
            if (data.startsWith('del_')) {
                const id = data.replace('del_', '');
                await sendMessage(chatId, "⏳ جاري الحذف...");
                await axios.post(GAS_URL, { action: "delete_item", id: id });
                await sendMessage(chatId, "✅ تم الحذف.");
                await sendManageKeyboard(chatId);
            } else if (data === 'cancel') {
                await sendMainKeyboard(chatId);
            }
            return res.status(200).send('OK');
        }

        const text = message.text || "";

        // 2. المحادثة المتسلسلة (إصدار V14 المستقر)
        if (message.reply_to_message) {
            const reply = message.reply_to_message.text;
            
            // الخطوة 1 -> 2
            if (reply.includes("أرسل اسم التطبيق الآن")) {
                await sendMessage(chatId, `🚀 الاسم: ${text}\n🖼 الخطوة 2: أرسل رابط الصورة الآن:`, { reply_markup: { force_reply: true, selective: true } });
            }
            // الخطوة 2 -> 3
            else if (reply.includes("أرسل رابط الصورة الآن")) {
                const name = reply.split("\n")[0].replace("🚀 الاسم: ", "");
                await sendMessage(chatId, `📦 التطبيق: ${name}\n🖼 الصورة: ${text}\n📝 الخطوة 3: أرسل وصف التطبيق:`, { reply_markup: { force_reply: true, selective: true } });
            }
            // الخطوة 3 -> 4
            else if (reply.includes("أرسل وصف التطبيق")) {
                const lines = reply.split("\n");
                const name = lines[0].replace("📦 التطبيق: ", "");
                const icon = lines[1].replace("🖼 الصورة: ", "");
                await sendMessage(chatId, `📍 الاسم: ${name}\n🖼 الصورة: ${icon}\n📄 الوصف: ${text}\n🔗 الخطوة الأخيرة: أرسل رابط التحميل:`, { reply_markup: { force_reply: true, selective: true } });
            }
            // الخطوة 4 الحفظ
            else if (reply.includes("أرسل رابط التحميل")) {
                const lines = reply.split("\n");
                const name = lines[0].replace("📍 الاسم: ", "");
                const icon = lines[1].replace("🖼 الصورة: ", "");
                const desc = lines[2].replace("📄 الوصف: ", "");
                const link = text;
                
                await sendMessage(chatId, "⏳ جاري الحفظ النهائي...");
                try {
                    await axios.post(GAS_URL, { action: "add_manual", name, icon, desc, link });
                    await sendMessage(chatId, "✅ تم الحفظ بنجاح!");
                    await sendMainKeyboard(chatId);
                } catch (e) {
                    await sendMessage(chatId, "❌ فشل الاتصال بجوجل شيت.");
                }
            }
            return res.status(200).send('OK');
        }

        // 3. الأوامر
        if (text === '/start' || text === '🏠 القائمة الرئيسية') {
            await sendMainKeyboard(chatId);
        }
        else if (text === '➕ إضافة APK جديد') {
            await sendMessage(chatId, "📝 أرسل اسم التطبيق الآن:", { reply_markup: { force_reply: true, selective: true } });
        }
        else if (text === '📋 إدارة المحتوى') {
            await sendManageKeyboard(chatId);
        }
        else if (text.startsWith('⚙️ إدارة:')) {
            const match = text.match(/\(#([^)]+)\)/);
            if (match) {
                await sendMessage(chatId, `🛠 إدارة التطبيق:`, {
                    reply_markup: { inline_keyboard: [[{ text: "🗑 حذف نهائي", callback_data: `del_${match[1]}` }], [{ text: "🏠 إلغاء", callback_data: "cancel" }]] }
                });
            }
        } else {
            await sendMainKeyboard(chatId);
        }

        res.status(200).send('OK');
    } catch (e) {
        console.error("Bot Error:", e.message);
        res.status(200).send('Error');
    }
};

async function sendMainKeyboard(chatId) {
    const keyboard = {
        keyboard: [[{ text: "➕ إضافة APK جديد" }], [{ text: "📋 إدارة المحتوى" }]],
        resize_keyboard: true
    };
    await sendMessage(chatId, "🏠 لوحة التحكم:", { reply_markup: keyboard });
}

async function sendManageKeyboard(chatId) {
    try {
        const response = await axios.get(`${GAS_URL}?t=${Date.now()}`);
        const apps = response.data;
        const keyboard = {
            keyboard: apps.slice(0, 30).map(app => [{ text: `⚙️ إدارة: ${app.title} (#${app.id})` }]),
            resize_keyboard: true
        };
        keyboard.keyboard.push([{ text: "🏠 القائمة الرئيسية" }]);
        await sendMessage(chatId, "📂 القائمة:", { reply_markup: keyboard });
    } catch (e) {
        await sendMessage(chatId, "❌ خطأ في جلب البيانات.");
    }
}

async function sendMessage(chatId, text, extra = {}) {
    try {
        await axios.post(`${telegramUrl}/sendMessage`, { chat_id: chatId, text, ...extra });
    } catch (err) {}
}
