const axios = require('axios');

const botToken = process.env.BOT_TOKEN;
const adminId = 682572594;
const telegramUrl = `https://api.telegram.org/bot${botToken}`;

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(200).send('Active');

    const { message, callback_query } = req.body;
    
    // التعامل مع ضغطات الأزرار (الحذف والتعديل)
    if (callback_query) {
        const chatId = callback_query.message.chat.id;
        const data = callback_query.data;

        if (data.startsWith('del_')) {
            const appId = data.replace('del_', '');
            await sendMessage(chatId, "⏳ جاري الحذف من قاعدة البيانات...");
            try {
                await axios.post("https://script.google.com/macros/s/AKfycbz9qFyXw9ij44UFs9409tx39j3uSlYFlVokdAVtB0ElNiAncl2EWDl4Ajz6VDKOk0x7/exec", {
                    action: "delete_item",
                    id: appId
                });
                await sendMessage(chatId, "✅ تم الحذف بنجاح!");
            } catch (e) {
                await sendMessage(chatId, "❌ فشل الحذف.");
            }
        }
        return res.status(200).send('OK');
    }

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
                await axios.post("https://script.google.com/macros/s/AKfycbz9qFyXw9ij44UFs9409tx39j3uSlYFlVokdAVtB0ElNiAncl2EWDl4Ajz6VDKOk0x7/exec", {
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
    else if (text.startsWith('/add')) {
        const parts = text.split(" ");
        if (parts.length < 3) {
            await sendMessage(chatId, "⚠️ الطريقة الصحيحة:\n`/add الاسم رابط_التحميل`\n\nمثال:\n`/add Subway Surfers https://example.com/apk` ");
            return res.status(200).send('OK');
        }
        
        const appName = parts.slice(1, parts.length - 1).join(" ");
        const appLink = parts[parts.length - 1];

        await sendMessage(chatId, `⏳ جاري معالجة الرفع لـ ${appName}...`);

        try {
            await axios.post("https://script.google.com/macros/s/AKfycbz9qFyXw9ij44UFs9409tx39j3uSlYFlVokdAVtB0ElNiAncl2EWDl4Ajz6VDKOk0x7/exec", {
                action: "add_from_vercel",
                name: appName,
                link: appLink
            });
            await sendMessage(chatId, "✅ **تمت الإضافة بنجاح!** الموقع سيظهر فيه التطبيق الآن.");
        } catch (err) {
            await sendMessage(chatId, "❌ حدث خطأ أثناء الحفظ.");
        }
        await sendMainKeyboard(chatId);
    }
    else if (text === '📋 عرض المحتوى الحالي') {
        await sendMessage(chatId, "🔎 جارٍ جلب قائمة التطبيقات...");
        try {
            const GAS_URL = "https://script.google.com/macros/s/AKfycbz9qFyXw9ij44UFs9409tx39j3uSlYFlVokdAVtB0ElNiAncl2EWDl4Ajz6VDKOk0x7/exec";
            const response = await axios.get(GAS_URL);
            const apps = response.data;

            if (apps.length === 0) {
                await sendMessage(chatId, "📭 لا يوجد محتوى حالياً.");
            } else {
                // إنشاء كيبورد يحتوي على أسماء التطبيقات
                const keyboard = {
                    keyboard: apps.map(app => [{ text: `🗑 حذف: ${app.title}` }]),
                    resize_keyboard: true,
                    one_time_keyboard: true
                };
                keyboard.keyboard.push([{ text: "🏠 القائمة الرئيسية" }]);
                
                await sendMessage(chatId, "👇 **اختر التطبيق الذي تريد حذفه من الكيبورد أدناه:**", { reply_markup: keyboard });
            }
        } catch (err) {
            await sendMessage(chatId, "❌ حدث خطأ أثناء جلب البيانات.");
        }
    }
    else if (text.startsWith('🗑 حذف:')) {
        const appTitle = text.replace('🗑 حذف: ', '');
        await sendMessage(chatId, `⏳ جاري حذف ${appTitle}...`);
        
        try {
            // جلب البيانات للبحث عن الـ ID بموجب الاسم
            const response = await axios.get("https://script.google.com/macros/s/AKfycbz9qFyXw9ij44UFs9409tx39j3uSlYFlVokdAVtB0ElNiAncl2EWDl4Ajz6VDKOk0x7/exec");
            const app = response.data.find(a => a.title === appTitle);
            
            if (app) {
                await axios.post("https://script.google.com/macros/s/AKfycbz9qFyXw9ij44UFs9409tx39j3uSlYFlVokdAVtB0ElNiAncl2EWDl4Ajz6VDKOk0x7/exec", {
                    action: "delete_item",
                    id: app.id
                });
                await sendMessage(chatId, `✅ تم حذف ${appTitle} بنجاح!`);
            } else {
                await sendMessage(chatId, "❌ لم يتم العثور على التطبيق.");
            }
        } catch (e) {
            await sendMessage(chatId, "❌ فشل الحذف.");
        }
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
