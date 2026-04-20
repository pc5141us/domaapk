const axios = require('axios');

const botToken = "8791910472:AAFV5-CMq0QuOnPGa8QR-UmxTGOWOjySrds";
const telegramUrl = `https://api.telegram.org/bot${botToken}`;
const GAS_URL = "https://script.google.com/macros/s/AKfycbxgr2lfK9pdy4ChWEZIey5yahTsnd9zjh1XRoffPBhQzZnLI4o-jkuQGRhiKellMg4/exec";
const adminId = 682572594;

module.exports = async (req, res) => {
    try {
        if (req.method !== 'POST') return res.status(200).send('Webhook is healthy');

        const { message, callback_query } = req.body;
        
        const chatId = message ? message.chat.id : (callback_query ? callback_query.message.chat.id : null);
        if (!chatId) return res.status(200).send('No Chat ID');

        // اختبار بسيط: إذا أرسلت رسالة وأنت لست الأدمن، سيخبرك البوت برقم هويتك
        if (chatId.toString() !== adminId.toString()) {
            await sendMessage(chatId, `⚠️ عذراً، أنت لست الأدمن المصرح له.\nرقم هويتك (ID) هو: \`${chatId}\`\nيرجى إرسال هذا الرقم للمطور.`);
            return res.status(200).send('Unauthorized');
        }

        if (callback_query) {
            const data = callback_query.data;
            if (data.startsWith('del_')) {
                await sendMessage(chatId, "⏳ جاري الحذف...");
                await axios.post(GAS_URL, { action: "delete_item", id: data.replace('del_', '') });
                await sendMessage(chatId, "✅ تم الحذف بنجاح.");
                await sendManageKeyboard(chatId);
            }
            return res.status(200).send('OK');
        }

        const text = message.text || "";

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
                await sendMessage(chatId, "⏳ جاري الحفظ...");
                await axios.post(GAS_URL, { action: "add_manual", name, icon, desc, link: text });
                await sendMessage(chatId, "✅ تمت الإضافة بنجاح!");
                await sendMainKeyboard(chatId);
            }
            return res.status(200).send('OK');
        }

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
                await sendMessage(chatId, `🛠 **إدارة:** *${appTitle}*`, {
                    reply_markup: {
                        inline_keyboard: [[{ text: "🗑 حذف نهائي", callback_data: `del_${appId}` }], [{ text: "❌ إلغاء", callback_data: "cancel" }]]
                    }
                });
            }
        } else {
            await sendMainKeyboard(chatId);
        }

        return res.status(200).send('OK');
    } catch (error) {
        console.error(error);
        return res.status(200).send('Error but handled');
    }
};

async function sendMainKeyboard(chatId) {
    const keyboard = {
        keyboard: [[{ text: "➕ إضافة APK جديد" }], [{ text: "📋 إدارة المحتوى" }]],
        resize_keyboard: true
    };
    await sendMessage(chatId, "🎮 لوحة تحكم دوما APK:", { reply_markup: keyboard });
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
    } catch (e) {
        await sendMessage(chatId, "❌ فشل جلب البيانات.");
    }
}

async function sendMessage(chatId, text, extra = {}) {
    await axios.post(`${telegramUrl}/sendMessage`, { chat_id: chatId, text, parse_mode: 'Markdown', ...extra });
}
