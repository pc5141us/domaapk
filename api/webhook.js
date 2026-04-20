const axios = require('axios');

const botToken = process.env.BOT_TOKEN;
const adminId = 682572594;
const telegramUrl = `https://api.telegram.org/bot${botToken}`;

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(200).send('Active');

    const { message, callback_query } = req.body;
    
    if (callback_query) {
        const chatId = callback_query.message.chat.id;
        const data = callback_query.data;
        if (data.startsWith('del_')) {
            const appId = data.replace('del_', '');
            await sendMessage(chatId, "⏳ جاري الحذف وتحديث القائمة...");
            try {
                await axios.post("https://script.google.com/macros/s/AKfycbxgr2lfK9pdy4ChWEZIey5yahTsnd9zjh1XRoffPBhQzZnLI4o-jkuQGRhiKellMg4/exec", {
                    action: "delete_item",
                    id: appId
                });
                await sendMessage(chatId, "✅ تم الحذف وتحديث الأزرار!");
                // جلب القائمة الجديدة فوراً
                await sendManageKeyboard(chatId);
            } catch (e) { await sendMessage(chatId, "❌ فشل التحديث."); }
        }
        else if (data === 'cancel') {
            await sendMessage(chatId, "🏠 تم الإلغاء.");
            await sendMainKeyboard(chatId);
        }
        return res.status(200).send('OK');
    }

    if (!message) return res.status(200).send('OK');
    const chatId = message.chat.id;
    const text = message.text || "";

    if (chatId.toString() !== adminId.toString()) return res.status(200).send('Unauthorized');

    if (message.reply_to_message) {
        const replyText = message.reply_to_message.text;

        // الخطوة 1 -> 2: اسم -> صورة
        if (replyText.includes("أرسل اسم التطبيق الآن")) {
            await sendMessage(chatId, `🖼 **الخطوة 2:** أرسل رابط صورة التطبيق لـ:\n\n*${text}*`, { 
                reply_markup: { force_reply: true, selective: true } 
            });
        }
        // الخطوة 2 -> 3: صورة -> وصف
        else if (replyText.includes("أرسل رابط صورة التطبيق لـ")) {
            const name = replyText.split("\n\n*")[1].replace(/\*/g, "");
            const icon = text;
            await sendMessage(chatId, `📝 **الخطوة 3:** أرسل وصفاً للتطبيق:\n\n*اسم:* ${name}\n*صورة:* ${icon}`, { 
                reply_markup: { force_reply: true, selective: true } 
            });
        }
        // الخطوة 3 -> 4: وصف -> رابط تحميل
        else if (replyText.includes("أرسل وصفاً للتطبيق")) {
            const lines = replyText.split("\n");
            const name = lines[2].replace("*اسم:* ", "");
            const icon = lines[3].replace("*صورة:* ", "");
            const desc = text;
            await sendMessage(chatId, `🔗 **الخطوة الأخيرة:** أرسل رابط التحميل لـ:\n\n*الاسم:* ${name}\n*الصورة:* ${icon}\n*الوصف:* ${desc}`, { 
                reply_markup: { force_reply: true, selective: true } 
            });
        }
        // الخطوة 4: الحفظ النهائي
        else if (replyText.includes("أرسل رابط التحميل لـ")) {
            const lines = replyText.split("\n");
            const name = lines[2].replace("*الاسم:* ", "");
            const icon = lines[3].replace("*الصورة:* ", "");
            const desc = lines[4].replace("*الوصف:* ", "");
            const link = text;
            
            await sendMessage(chatId, "⏳ جاري الرفع والمزامنة...");
            try {
                await axios.post("https://script.google.com/macros/s/AKfycbxgr2lfK9pdy4ChWEZIey5yahTsnd9zjh1XRoffPBhQzZnLI4o-jkuQGRhiKellMg4/exec", {
                    action: "add_manual",
                    name: name,
                    icon: icon,
                    desc: desc,
                    link: link
                });
                await sendMessage(chatId, "✅ **تمت الإضافة بنجاح!**\n(تم استخدام الصورة كأيقونة وكفر تلقائياً)");
            } catch (err) { await sendMessage(chatId, "❌ فشل الحفظ."); }
            await sendMainKeyboard(chatId);
        }
        return res.status(200).send('OK');
    }

    if (text === '/start' || text === '🏠 القائمة الرئيسية') await sendMainKeyboard(chatId);
    else if (text === '➕ إضافة APK جديد') {
        await sendMessage(chatId, "📝 **الخطوة 1:** أرسل اسم التطبيق الآن:", { reply_markup: { force_reply: true, selective: true } });
    }
    else if (text === '📋 إدارة المحتوى') await sendManageKeyboard(chatId);
    else await sendMainKeyboard(chatId);

    res.status(200).send('OK');
};

async function sendMainKeyboard(chatId) {
    const keyboard = {
        keyboard: [[{ text: "➕ إضافة APK جديد" }], [{ text: "📋 إدارة المحتوى" }, { text: "🌐 زيارة المتجر" }]],
        resize_keyboard: true
    };
    await sendMessage(chatId, "🎮 **دوما APK - لوحة التحكم:**", { reply_markup: keyboard });
}

async function sendManageKeyboard(chatId) {
    try {
        const timestamp = Date.now();
        const response = await axios.get(`https://script.google.com/macros/s/AKfycbxgr2lfK9pdy4ChWEZIey5yahTsnd9zjh1XRoffPBhQzZnLI4o-jkuQGRhiKellMg4/exec?t=${timestamp}`);
        const apps = response.data;
        if (apps.length === 0) return await sendMessage(chatId, "📭 فارغ.");
        const keyboard = {
            keyboard: apps.slice(0, 10).map(app => [{ text: `⚙️ إدارة: ${app.title} (#${app.id})` }]),
            resize_keyboard: true
        };
        keyboard.keyboard.push([{ text: "🏠 القائمة الرئيسية" }]);
        await sendMessage(chatId, "👇 اختر التطبيق لإدارته:", { reply_markup: keyboard });
    } catch (e) { await sendMessage(chatId, "❌ خطأ في جلب البيانات."); }
}

async function sendMessage(chatId, text, extra = {}) {
    try { await axios.post(`${telegramUrl}/sendMessage`, { chat_id: chatId, text, parse_mode: 'Markdown', ...extra }); } catch(e) {}
}
