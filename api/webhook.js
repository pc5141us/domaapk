const axios = require('axios');

const botToken = "8791910472:AAFV5-CMq0QuOnPGa8QR-UmxTGOWOjySrds";
const telegramUrl = `https://api.telegram.org/bot${botToken}`;
const GAS_URL = "https://script.google.com/macros/s/AKfycbxgr2lfK9pdy4ChWEZIey5yahTsnd9zjh1XRoffPBhQzZnLI4o-jkuQGRhiKellMg4/exec";

module.exports = async (req, res) => {
    // 1. رد فوري لتلجرام لضمان عدم تكرار الرسائل
    res.status(200).send('OK');

    try {
        if (req.method !== 'POST') return;
        const update = req.body;
        if (!update || (!update.message && !update.callback_query)) return;

        const chatId = update.message ? update.message.chat.id : update.callback_query.message.chat.id;
        const text = update.message ? (update.message.text || "") : "";

        // 2. معالجة الحذف (Callback)
        if (update.callback_query) {
            const data = update.callback_query.data;
            if (data.startsWith('del_')) {
                await sendMessage(chatId, "⏳ جاري الحذف...");
                await axios.post(GAS_URL, { action: "delete_item", id: data.replace('del_', '') });
                await sendMessage(chatId, "✅ تم الحذف بنجاح.");
                await sendManageKeyboard(chatId);
            }
            return;
        }

        // 3. نظام الإضافة (Reply) - معالجة فائقة الأمان
        if (update.message.reply_to_message) {
            const reply = update.message.reply_to_message.text;
            try {
                if (reply.includes("أرسل اسم التطبيق")) {
                    await sendMessage(chatId, `🖼 الخطوة 2: أرسل رابط الصورة لـ:\nAPP:[${text}]`, { reply_markup: { force_reply: true, selective: true } });
                }
                else if (reply.includes("الخطوة 2: أرسل رابط الصورة")) {
                    const nameMatch = reply.match(/APP:\[(.*?)\]/);
                    const name = nameMatch ? nameMatch[1] : "تطبيق";
                    await sendMessage(chatId, `📝 الخطوة 3: أرسل وصف التطبيق لـ:\nAPP:[${name}]\nIMG:[${text}]`, { reply_markup: { force_reply: true, selective: true } });
                }
                else if (reply.includes("الخطوة 3: أرسل وصف التطبيق")) {
                    const nameMatch = reply.match(/APP:\[(.*?)\]/);
                    const imgMatch = reply.match(/IMG:\[(.*?)\]/);
                    const name = nameMatch ? nameMatch[1] : "تطبيق";
                    const img = imgMatch ? imgMatch[1] : "";
                    await sendMessage(chatId, `🔗 الخطوة 4: أرسل رابط التحميل لـ:\nAPP:[${name}]\nIMG:[${img}]\nDESC:[${text}]`, { reply_markup: { force_reply: true, selective: true } });
                }
                else if (reply.includes("الخطوة 4: أرسل رابط التحميل")) {
                    const nameMatch = reply.match(/APP:\[(.*?)\]/);
                    const imgMatch = reply.match(/IMG:\[(.*?)\]/);
                    const descMatch = reply.match(/DESC:\[(.*?)\]/);
                    
                    const name = nameMatch ? nameMatch[1] : "";
                    const img = imgMatch ? imgMatch[1] : "";
                    const desc = descMatch ? descMatch[1] : "";
                    
                    await sendMessage(chatId, "⏳ جاري الرفع والمزامنة...");
                    await axios.post(GAS_URL, { action: "add_manual", name, icon: img, desc, link: text });
                    await sendMessage(chatId, "✅ تمت الإضافة بنجاح للموقع!");
                    await sendMainKeyboard(chatId);
                }
            } catch (err) {
                await sendMessage(chatId, "⚠️ حدث خطأ في معالجة الرد، يرجى البدء من جديد بالضغط على زر الإضافة.");
            }
            return;
        }

        // 4. الأوامر العادية
        if (text === '/start' || text === '🏠 القائمة الرئيسية') {
            await sendMainKeyboard(chatId);
        }
        else if (text === '➕ إضافة APK جديد') {
            await sendMessage(chatId, "📝 الخطوة 1: أرسل اسم التطبيق الآن:", { reply_markup: { force_reply: true, selective: true } });
        }
        else if (text === '📋 إدارة المحتوى') {
            await sendManageKeyboard(chatId);
        }
        else if (text.startsWith('⚙️ إدارة:')) {
            const id = text.match(/\(#([^)]+)\)/);
            if (id) {
                await sendMessage(chatId, `🛠 إدارة التطبيق:`, {
                    reply_markup: { inline_keyboard: [[{ text: "🗑 حذف نهائي", callback_data: `del_${id[1]}` }], [{ text: "❌ إلغاء", callback_data: "cancel" }]] }
                });
            }
        } else {
            await sendMainKeyboard(chatId);
        }

    } catch (e) {
        console.error("Critical Webhook Error:", e.message);
    }
};

async function sendMainKeyboard(chatId) {
    const keyboard = {
        keyboard: [[{ text: "➕ إضافة APK جديد" }], [{ text: "📋 إدارة المحتوى" }]],
        resize_keyboard: true, persistent: true
    };
    await sendMessage(chatId, "🏠 لوحة تحكم دوما APK:", { reply_markup: keyboard });
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
        await sendMessage(chatId, "📂 اختر للتعديل أو الحذف:", { reply_markup: keyboard });
    } catch (e) { await sendMessage(chatId, "❌ خطأ في الاتصال بالبيانات."); }
}

async function sendMessage(chatId, text, extra = {}) {
    try {
        await axios.post(`${telegramUrl}/sendMessage`, { chat_id: chatId, text, ...extra });
    } catch (err) {}
}
