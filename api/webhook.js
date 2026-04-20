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
        const messageId = callback_query.message.message_id;

        if (data.startsWith('del_')) {
            const appId = data.replace('del_', '');
            await sendMessage(chatId, "⏳ جاري الحذف من قاعدة البيانات...");
            try {
                await axios.post("https://script.google.com/macros/s/AKfycbxn8UniaDF1aQW5T_VklH61DbHpwODY_pK5irvFsSUbMrN_r-xQINfwAtBvgl9l8rC9/exec", {
                    action: "delete_item",
                    id: appId
                });
                await sendMessage(chatId, "✅ تم الحذف بنجاح!");
                // انتظار ثانية واحدة لضمان تحديث بيانات جوجل
                await new Promise(resolve => setTimeout(resolve, 1500));
                await sendManageKeyboard(chatId);
            } catch (e) {
                await sendMessage(chatId, "❌ فشل الحذف.");
            }
        }
        else if (data.startsWith('editlink_')) {
// ... (سيتم إكمال الوظيفة في استبدال شامل لاحقاً أو التأكد من وجودها)
            const appId = data.replace('editlink_', '');
            await sendMessage(chatId, `🔗 **أرسل الرابط الجديد الآن لـ (#${appId}):**\n*(يرجى الرد على هذه الرسالة)*`, { 
                reply_markup: { force_reply: true, selective: true } 
            });
        }
        else if (data === 'cancel') {
            await sendMessage(chatId, "🏠 تم الإلغاء والعودة للقائمة الرئيسية.");
            await sendMainKeyboard(chatId);
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
        else if (replyText.includes("أرسل رابط التحميل الآن لـ")) {
            const appName = replyText.split("لـ ")[1].split(":")[0];
            const appLink = text;
            await sendMessage(chatId, `⏳ جاري معالجة الرفع لـ ${appName}...`);
            try {
                await axios.post("https://script.google.com/macros/s/AKfycbxn8UniaDF1aQW5T_VklH61DbHpwODY_pK5irvFsSUbMrN_r-xQINfwAtBvgl9l8rC9/exec", {
                    action: "add_from_vercel",
                    name: appName,
                    link: appLink
                });
                await sendMessage(chatId, "✅ **تمت الإضافة بنجاح!**");
            } catch (err) {
                await sendMessage(chatId, "❌ حدث خطأ أثناء الحفظ.");
            }
            await sendMainKeyboard(chatId);
        }
        else if (replyText.includes("أرسل الرابط الجديد الآن لـ")) {
            const appId = replyText.match(/\(#([^)]+)\)/)[1];
            const newLink = text;
            await sendMessage(chatId, `⏳ جاري تحديث الرابط لـ #${appId}...`);
            try {
                await axios.post("https://script.google.com/macros/s/AKfycbxn8UniaDF1aQW5T_VklH61DbHpwODY_pK5irvFsSUbMrN_r-xQINfwAtBvgl9l8rC9/exec", {
                    action: "update_link",
                    id: appId,
                    link: newLink
                });
                await sendMessage(chatId, "✅ **تم تحديث الرابط بنجاح!**");
            } catch (err) {
                await sendMessage(chatId, "❌ فشل التحديث.");
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
            await axios.post("https://script.google.com/macros/s/AKfycbxn8UniaDF1aQW5T_VklH61DbHpwODY_pK5irvFsSUbMrN_r-xQINfwAtBvgl9l8rC9/exec", {
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
    else if (text === '📋 عرض المحتوى الحالي' || text === '📋 إدارة المحتوى') {
        await sendManageKeyboard(chatId);
    }
    else if (text.startsWith('⚙️ إدارة:')) {
        const idMatch = text.match(/\(#([^)]+)\)/);
        const appTitle = text.split('⚙️ إدارة: ')[1].split(' (#')[0];
        const appId = idMatch[1];

        const inlineKeyboard = {
            inline_keyboard: [
                [
                    { text: "🗑 حذف نهائي", callback_data: `del_${appId}` },
                    { text: "✏️ تعديل الرابط", callback_data: `editlink_${appId}` }
                ],
                [{ text: "❌ إلغاء", callback_data: "cancel" }]
            ]
        };

        await sendMessage(chatId, `🛠 **ماذا تريد أن تفعل بـ ${appTitle}؟**`, { reply_markup: inlineKeyboard });
    }
    // ... باقي معالجة الحذف في callback_query تم تحديثها بالأعلى لتشمل التعديل أيضاً
    else if (text === '➕ إضافة APK جديد') {
        await sendMessage(chatId, "📝 **الخطوة 1:** أرسل اسم التطبيق الآن:", { reply_markup: { force_reply: true, selective: true } });
    }
    else if (text === '🌐 زيارة المتجر') {
        await sendMessage(chatId, "🔗 يمكنك زيارة متجرك من هذا الرابط:\n\nhttps://domaapk.vercel.app/");
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

async function sendManageKeyboard(chatId) {
    try {
        const GAS_URL = `https://script.google.com/macros/s/AKfycbxn8UniaDF1aQW5T_VklH61DbHpwODY_pK5irvFsSUbMrN_r-xQINfwAtBvgl9l8rC9/exec?t=${Date.now()}`;
        const response = await axios.get(GAS_URL);
        const apps = response.data;

        if (apps.length === 0) {
            await sendMessage(chatId, "📭 لا يوجد محتوى حالياً.");
        } else {
            const keyboard = {
                keyboard: apps.map(app => [{ text: `⚙️ إدارة: ${app.title} (#${app.id})` }]),
                resize_keyboard: true,
                one_time_keyboard: false,
                is_persistent: true
            };
            keyboard.keyboard.push([{ text: "🏠 القائمة الرئيسية" }]);
            await sendMessage(chatId, "👇 **اختر التطبيق الذي تريد تعديله أو حذفه:**", { reply_markup: keyboard });
        }
    } catch (err) {
        await sendMessage(chatId, "❌ حدث خطأ أثناء جلب قائمة التطبيقات.");
    }
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
