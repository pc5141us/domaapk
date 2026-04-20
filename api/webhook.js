const axios = require('axios');

const botToken = "8791910472:AAFV5-CMq0QuOnPGa8QR-UmxTGOWOjySrds";
const telegramUrl = `https://api.telegram.org/bot${botToken}`;
const GAS_URL = "https://script.google.com/macros/s/AKfycbxgr2lfK9pdy4ChWEZIey5yahTsnd9zjh1XRoffPBhQzZnLI4o-jkuQGRhiKellMg4/exec";

module.exports = async (req, res) => {
    try {
        res.status(200).send('OK');

        if (req.method !== 'POST') return;
        const update = req.body;
        const message = update.message;
        const callback_query = update.callback_query;
        
        const chatId = message ? message.chat.id : (callback_query ? callback_query.message.chat.id : null);
        if (!chatId) return;

        // 1. الأزرار المضمنة (الحذف)
        if (callback_query) {
            const data = callback_query.data;
            if (data.startsWith('del_')) {
                await sendMessage(chatId, "⏳ جاري حذف التطبيق...");
                await axios.post(GAS_URL, { action: "delete_item", id: data.replace('del_', '') });
                await sendMessage(chatId, "✅ تم الحذف بنجاح.");
                await sendManageKeyboard(chatId);
            }
            return;
        }

        const text = message.text || "";

        // 2. نظام الردود (المعالجة الذكية)
        if (message.reply_to_message) {
            const replyText = message.reply_to_message.text;

            try {
                // الخطوة 1 -> 2: استلام الاسم وطلب الصورة
                if (replyText.includes("أرسل اسم التطبيق الآن")) {
                    await sendMessage(chatId, `🖼 أرسل رابط صورة لـ [ ${text} ] :`, { reply_markup: { force_reply: true, selective: true } });
                }
                // الخطوة 2 -> 3: استلام الصورة وطلب الوصف
                else if (replyText.includes("أرسل رابط صورة لـ")) {
                    const name = replyText.match(/\[ (.*?) \]/)[1];
                    await sendMessage(chatId, `📝 أرسل وصفاً للتطبيق:\n📦 الاسم: ${name}\n🖼 الصورة: ${text}`, { reply_markup: { force_reply: true, selective: true } });
                }
                // الخطوة 3 -> 4: استلام الوصف وطلب الرابط
                else if (replyText.includes("أرسل وصفاً للتطبيق")) {
                    const name = replyText.match(/📦 الاسم: (.*)/)[1];
                    const icon = replyText.match(/🖼 الصورة: (.*)/)[1];
                    await sendMessage(chatId, `🔗 أخيراً أرسل رابط التحميل لـ:\n📍 الاسم: ${name}\n🖼 الصورة: ${icon}\n📄 الوصف: ${text}`, { reply_markup: { force_reply: true, selective: true } });
                }
                // الخطوة 4: الحفظ النهائي
                else if (replyText.includes("أرسل رابط التحميل لـ")) {
                    const name = replyText.match(/📍 الاسم: (.*)/)[1];
                    const icon = replyText.match(/🖼 الصورة: (.*)/)[1];
                    const desc = replyText.match(/📄 الوصف: (.*)/)[1];
                    
                    await sendMessage(chatId, "⏳ جاري الرفع للموقع...");
                    await axios.post(GAS_URL, { action: "add_manual", name, icon, desc, link: text });
                    await sendMessage(chatId, "✅ تمت الإضافة بنجاح!");
                    await sendMainKeyboard(chatId);
                }
            } catch (err) {
                await sendMessage(chatId, "⚠️ حدث خطأ في فهم البيانات، يرجى إعادة المحاولة من البداية.");
                await sendMainKeyboard(chatId);
            }
            return;
        }

        // 3. الأوامر الرئيسية
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
            const idMatch = text.match(/\(#([^)]+)\)/);
            if (idMatch) {
                const appId = idMatch[1];
                await sendMessage(chatId, `🛠 إدارة التطبيق:`, {
                    reply_markup: {
                        inline_keyboard: [[{ text: "🗑 حذف نهائي", callback_data: `del_${appId}` }], [{ text: "🏠 إلغاء", callback_data: "cancel" }]]
                    }
                });
            }
        } else {
            await sendMainKeyboard(chatId);
        }

    } catch (e) {
        console.error("General Error:", e);
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
    } catch (e) { await sendMessage(chatId, "❌ خطأ في الجلب."); }
}

async function sendMessage(chatId, text, extra = {}) {
    try { await axios.post(`${telegramUrl}/sendMessage`, { chat_id: chatId, text, parse_mode: 'HTML', ...extra }); } catch(err) {}
}
