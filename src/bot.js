const { Bot } = require("grammy");
require("dotenv").config();

const {
  getMainMenuKeyboard,
  getBackKeyboard,
  getDeleteConfirmKeyboard,
} = require("./keyboards");

// توكن البوت
const BOT_TOKEN =
  process.env.BOT_TOKEN ||
  "5777908472:AAHoyjbO-SouHb8Mw3aYl51zdTKpj3DQuog";

if (!BOT_TOKEN) {
  throw new Error("⚠️ يرجى تزويد توكن البوت في ملف .env تحت اسم BOT_TOKEN");
}

// إنشاء كائن البوت
const bot = new Bot(BOT_TOKEN);

// تخزين بسيط في الذاكرة لحالة المستخدمين (لعمل رابط جديد)
const userStates = new Map();

/**
 * رسالة الترحيب الرئيسية
 */
const WELCOME_MESSAGE = `
👋 **مرحباً بك في بوت إدارة الويب هوك (Webhook Bot)**

هذا البوت عربي بالكامل، مصمم لمساعدتك في **ربط، فحص، وإدارة الويب هوك (Webhook)** لبوتات تليجرام بسهولة، ودعم الاستضافة غير الملموسة على **Vercel (Serverless Functions)**.

✨ **المميزات المتوفرة:**
▫️ ℹ️ **فحص الويب هوك:** الاستعلام عن الرابط الحالي وعدد الرسائل المعلقة والأخطاء.
▫️ 🔗 **ربط ويب هوك جديد:** إدخال أي رابط وسيقوم البوت بربطه فوراً مع Telegram API.
▫️ 🗑️ **حذف الويب هوك:** إلغاء الويب هوك للعودة لنظام البولينج (Polling).
▫️ 🤖 **بيانات البوت:** استخراج معرف ومعلومات البوت.
▫️ 🚀 **دليل Vercel:** شرح خطوة بخطوة لرفع المشروعات على فيرسل.

اختر من القائمة التفاعلية أدناه للبدء:
`;

// -------------------------------------------------------------
// الأوامر الرئيسية (Commands)
// -------------------------------------------------------------

// أمر البدء /start
bot.command("start", async (ctx) => {
  await ctx.reply(WELCOME_MESSAGE, {
    parse_mode: "Markdown",
    reply_markup: getMainMenuKeyboard(),
  });
});

// أمر المساعدة /help
bot.command("help", async (ctx) => {
  const helpText = `
📚 **قائمة الأوامر المتاحة في البوت:**

/start - إعادة تشغيل البوت وعرض القائمة الرئيسية
/info - فحص حالة الويب هوك الحالي للبوت
/set <رابط_الويب_هوك> - ربط البوت برابط ويب هوك جديد فوراً
/delete - إلغاء وحذف الويب هوك الحالي
/botinfo - عرض معلومات هذا البوت وحالته
/help - عرض دليل المساعدة

💡 **مثال لربط ويب هوك عبر الأمر:**
\`\`\`
/set https://my-bot.vercel.app/api/webhook
\`\`\`
`;
  await ctx.reply(helpText, {
    parse_mode: "Markdown",
    reply_markup: getBackKeyboard(),
  });
});

// أمر فحص الويب هوك /info
bot.command("info", async (ctx) => {
  await handleWebhookInfo(ctx);
});

// أمر ربط الويب هوك /set <URL>
bot.command("set", async (ctx) => {
  const urlArg = ctx.match ? ctx.match.trim() : "";
  if (!urlArg) {
    userStates.set(ctx.from.id, "WAITING_FOR_WEBHOOK_URL");
    return ctx.reply(
      "🔗 **يرجى إرسال رابط الويب هوك (URL) الذي تريد ربطه الآن:**\n\nيجب أن يبدأ الرابط بـ `https://` (مثال: `https://my-app.vercel.app/api/webhook`)",
      { parse_mode: "Markdown", reply_markup: getBackKeyboard() }
    );
  }
  await executeSetWebhook(ctx, urlArg);
});

// أمر حذف الويب هوك /delete
bot.command("delete", async (ctx) => {
  await ctx.reply("⚠️ **هل أنت أصلًا متأكد من رغبتك في حذف الويب هوك الحالي؟**", {
    parse_mode: "Markdown",
    reply_markup: getDeleteConfirmKeyboard(),
  });
});

// أمر بيانات البوت /botinfo
bot.command("botinfo", async (ctx) => {
  await handleBotInfo(ctx);
});

// -------------------------------------------------------------
// الأزرار التفاعلية (Callback Queries)
// -------------------------------------------------------------

bot.callbackQuery("main_menu", async (ctx) => {
  await ctx.answerCallbackQuery();
  userStates.delete(ctx.from.id);
  try {
    await ctx.editMessageText(WELCOME_MESSAGE, {
      parse_mode: "Markdown",
      reply_markup: getMainMenuKeyboard(),
    });
  } catch (err) {
    await ctx.reply(WELCOME_MESSAGE, {
      parse_mode: "Markdown",
      reply_markup: getMainMenuKeyboard(),
    });
  }
});

bot.callbackQuery("webhook_info", async (ctx) => {
  await ctx.answerCallbackQuery("جاري فحص الويب هوك...");
  await handleWebhookInfo(ctx, true);
});

bot.callbackQuery("webhook_set_prompt", async (ctx) => {
  await ctx.answerCallbackQuery();
  userStates.set(ctx.from.id, "WAITING_FOR_WEBHOOK_URL");
  const msg =
    "🔗 **إعداد ويب هوك جديد:**\n\nأرسل الآن رابط الويب هوك الخاص بك (Webhook URL).\n\n⚠️ **ملاحظة:** ينبغي أن يتضمن الرابط البروتوكول `https://` ويكون صالحاً للاستقبال من سيرفرات تليجرام.";
  await ctx.editMessageText(msg, {
    parse_mode: "Markdown",
    reply_markup: getBackKeyboard(),
  });
});

bot.callbackQuery("webhook_delete_confirm", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText("⚠️ **هل تريد التأكيد على حذف وإلغاء الويب هوك الحالي؟**", {
    parse_mode: "Markdown",
    reply_markup: getDeleteConfirmKeyboard(),
  });
});

bot.callbackQuery("webhook_delete_execute", async (ctx) => {
  await ctx.answerCallbackQuery("جاري حذف الويب هوك...");
  try {
    const success = await ctx.api.deleteWebhook({ drop_pending_updates: false });
    if (success) {
      await ctx.editMessageText(
        "✅ **تم حذف وإلغاء الويب هوك بنجاح!**\n\nالبوت الآن لا يستخدم أي Webhook، ويمكنك تشغيله بطريقة Polling أو إعادة ربطه برابط جديد.",
        { parse_mode: "Markdown", reply_markup: getBackKeyboard() }
      );
    } else {
      await ctx.editMessageText("❌ لم يكتمل حذف الويب هوك، يرجى المحاولة لاحقاً.", {
        parse_mode: "Markdown",
        reply_markup: getBackKeyboard(),
      });
    }
  } catch (err) {
    await ctx.editMessageText(`❌ **حدث خطأ أثناء الحذف:**\n\`${err.message}\``, {
      parse_mode: "Markdown",
      reply_markup: getBackKeyboard(),
    });
  }
});

bot.callbackQuery("bot_info", async (ctx) => {
  await ctx.answerCallbackQuery();
  await handleBotInfo(ctx, true);
});

bot.callbackQuery("test_msg", async (ctx) => {
  await ctx.answerCallbackQuery("اختبار الرسائل...");
  const dateStr = new Date().toLocaleString("ar-EG", { timeZone: "Africa/Cairo" });
  const testText = `
🧪 **رسالة اختبارية من بوت الويب هوك (Test Message)**

⏱️ **تاريخ ووقت الاختبار:** \`${dateStr}\`
👤 **المستخدم:** [${ctx.from.first_name}](tg://user?id=${ctx.from.id}) (ID: \`${ctx.from.id}\`)
⚡ **حالة الاتصال:** مستقر وجاهز للعمل 100%!
`;
  await ctx.reply(testText, {
    parse_mode: "Markdown",
    reply_markup: getBackKeyboard(),
  });
});

bot.callbackQuery("vercel_guide", async (ctx) => {
  await ctx.answerCallbackQuery();
  const vercelText = `
🚀 **دليل نشر البوت على موقع Vercel (فيرتيكال/فيرسل):**

1️⃣ **خطوة 1: رفع الكود على GitHub**
أنشئ مستودع جديد (Repository) وارفعه إلى حسابك على GitHub.

2️⃣ **خطوة 2: ربط المشروع بـ Vercel**
افتح [Vercel.com](https://vercel.com) وانقر على **Add New Project** واختر المستودع.

3️⃣ **خطوة 3: إضافة المتغيرات البيئية (Environment Variables)**
في إعدادات Vercel أضف المتغير التالي:
▫️ \`BOT_TOKEN\` = \`${BOT_TOKEN}\`

4️⃣ **خطوة 4: تفعيل الويب هوك**
بعد انتهاء عملية الـ Deploy، انسخ رابط مشروعك (مثال: \`https://my-bot.vercel.app\`) وافتح الرابط التالي في متصفحك:
\`https://my-bot.vercel.app/api/set-webhook\`
أو استخدم زر **ربط ويب هوك جديد** هنا وأرسل الرابط: \`https://my-bot.vercel.app/api/webhook\`

✨ **مبروك! أصبح البوت يعمل 24/7 على Vercel بدون خادم مجاناً.**
`;
  await ctx.editMessageText(vercelText, {
    parse_mode: "Markdown",
    disable_web_page_preview: true,
    reply_markup: getBackKeyboard(),
  });
});

// -------------------------------------------------------------
// معالج الرسائل النصية العام (الاستجابة لروابط الويب هوك)
// -------------------------------------------------------------
bot.on("message:text", async (ctx) => {
  const userId = ctx.from.id;
  const state = userStates.get(userId);
  const text = ctx.message.text.trim();

  // إذا كان المستخدم في حالة انتظار رابط
  if (state === "WAITING_FOR_WEBHOOK_URL" || text.startsWith("http://") || text.startsWith("https://")) {
    userStates.delete(userId);
    await executeSetWebhook(ctx, text);
    return;
  }

  // الرد على أي رسالة أخرى
  await ctx.reply(
    "💡 أهلاً بك! يمكنك استخدام الأزرار في القائمة أدناه أو كتابة /help لرؤية الأوامر المتاحة.",
    { reply_markup: getMainMenuKeyboard() }
  );
});

// -------------------------------------------------------------
// الدوال المساعدة (Helper Functions)
// -------------------------------------------------------------

/**
 * فحص وعرض حالة الويب هوك
 */
async function handleWebhookInfo(ctx, isEdit = false) {
  try {
    const info = await ctx.api.getWebhookInfo();
    const hasUrl = info.url && info.url.length > 0;

    let errorDetails = "لا يوجد أخطاء سابقة ✨";
    if (info.last_error_date) {
      const errDate = new Date(info.last_error_date * 1000).toLocaleString("ar-EG");
      errorDetails = `⚠️ **آخر خطأ:** \`${info.last_error_message || "غير معروف"}\`\n🗓️ **التاريخ:** \`${errDate}\``;
    }

    const messageContent = `
ℹ️ **تفاصيل حالة الويب هوك الحالي (Webhook Info):**

🌐 **رابط الويب هوك:**
${hasUrl ? `\`${info.url}\`` : "❌ **غير مرتبط بأي رابط حالياً**"}

📊 **حالة الاتصال والتحديثات:**
▫️ **التحديثات المعلقة (Pending Updates):** \`${info.pending_update_count}\`
▫️ **شهادة أمان مخصصة (Custom Cert):** ${info.has_custom_certificate ? "نعم ✅" : "لا ❌"}
▫️ **الحد الأقصى للاتصالات (Max Connections):** \`${info.max_connections || 40}\`

${errorDetails}
`;

    if (isEdit) {
      await ctx.editMessageText(messageContent, {
        parse_mode: "Markdown",
        reply_markup: getBackKeyboard(),
      });
    } else {
      await ctx.reply(messageContent, {
        parse_mode: "Markdown",
        reply_markup: getBackKeyboard(),
      });
    }
  } catch (err) {
    const errMsg = `❌ **حدث خطأ أثناء إحضار بيانات الويب هوك:**\n\`${err.message}\``;
    if (isEdit) {
      await ctx.editMessageText(errMsg, { parse_mode: "Markdown", reply_markup: getBackKeyboard() });
    } else {
      await ctx.reply(errMsg, { parse_mode: "Markdown", reply_markup: getBackKeyboard() });
    }
  }
}

/**
 * تطبيق تفعيل الويب هوك برابط محدد
 */
async function executeSetWebhook(ctx, rawUrl) {
  let targetUrl = rawUrl.trim();

  // تصحيح الرابط إذا لزم الأمر
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = "https://" + targetUrl;
  }

  if (!targetUrl.startsWith("https://")) {
    return ctx.reply(
      "❌ **خطأ:** يتطلب تليجرام أن يكون رابط الويب هوك مشفراً بـ `https://` آمناً.\nيرجى إعادة المحاولة برابط صحيح.",
      { parse_mode: "Markdown", reply_markup: getBackKeyboard() }
    );
  }

  const statusMsg = await ctx.reply(`🔄 **جاري جلب الاتصال وربط الويب هوك بـ:**\n\`${targetUrl}\`...`, {
    parse_mode: "Markdown",
  });

  try {
    const isOk = await ctx.api.setWebhook(targetUrl, {
      drop_pending_updates: false,
    });

    if (isOk) {
      await ctx.api.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        `✅ **تم ربط الويب هوك بنجاح!**\n\n🌐 **الرابط المرتبط:**\n\`${targetUrl}\`\n\nسيرسل تليجرام الآن جميع الرسائل والتحديثات فورياً لهذا الرابط.`,
        { parse_mode: "Markdown", reply_markup: getBackKeyboard() }
      );
    } else {
      await ctx.api.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        "❌ فشل ربط الويب هوك. يرجى التأكد من أن السيرفر يعمل ويقبل طلبات HTTPS.",
        { parse_mode: "Markdown", reply_markup: getBackKeyboard() }
      );
    }
  } catch (err) {
    await ctx.api.editMessageText(
      ctx.chat.id,
      statusMsg.message_id,
      `❌ **فشل الربط بسبب خطأ من تليجرام:**\n\`${err.message}\``,
      { parse_mode: "Markdown", reply_markup: getBackKeyboard() }
    );
  }
}

/**
 * عرض بيانات البوت
 */
async function handleBotInfo(ctx, isEdit = false) {
  try {
    const me = await ctx.api.getMe();
    const botText = `
🤖 **بيانات البوت الحالي (Bot Info):**

▫️ **الاسم:** ${me.first_name} ${me.last_name || ""}
▫️ **اليوزر نيم:** @${me.username}
▫️ **معرف البوت (ID):** \`${me.id}\`
▫️ **الانضمام للمجموعات:** ${me.can_join_groups ? "مسموح ✅" : "غير مسموح ❌"}
▫️ **قراءة جميع الرسائل:** ${me.can_read_all_group_messages ? "مفعل 🔓" : "معطل (المشرفين فقط) 🔒"}
▫️ **الدعم المباشر:** يعمل وجاهز للربط على Vercel!
`;
    if (isEdit) {
      await ctx.editMessageText(botText, { parse_mode: "Markdown", reply_markup: getBackKeyboard() });
    } else {
      await ctx.reply(botText, { parse_mode: "Markdown", reply_markup: getBackKeyboard() });
    }
  } catch (err) {
    const errMsg = `❌ **تعذر جلب بيانات البوت:**\n\`${err.message}\``;
    if (isEdit) {
      await ctx.editMessageText(errMsg, { parse_mode: "Markdown", reply_markup: getBackKeyboard() });
    } else {
      await ctx.reply(errMsg, { parse_mode: "Markdown", reply_markup: getBackKeyboard() });
    }
  }
}

module.exports = { bot, BOT_TOKEN };
