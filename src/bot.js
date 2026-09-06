const { Bot } = require("grammy");
const {
  getMainMenuKeyboard,
  getBackKeyboard,
  getTemplatesKeyboard,
} = {
  getMainMenuKeyboard: require("./keyboards").getMainMenuKeyboard,
  getBackKeyboard: require("./keyboards").getBackKeyboard,
  getTemplatesKeyboard: require("./keyboards").getTemplatesKeyboard,
};

const BOT_TOKEN =
  process.env.BOT_TOKEN ||
  "5777908472:AAHoyjbO-SouHb8Mw3aYl51zdTKpj3DQuog";

const bot = new Bot(BOT_TOKEN);

// إدارة جلسات الخطوات للمستخدمين
const userSessions = new Map();

// النطاق الأساسي الرسمي لـ Vercel
const VERCEL_DOMAIN = "https://domaapk.vercel.app";

const WELCOME_MESSAGE = `
👋 **أهلاً بك في صانع ومستضيف الويب هوك الدائم للبوتات**

هذا البوت يتيح لك **رفع ملفات الكود الخاصة ببوتك، واستضافتها وتفعيل الويب هوك لها بشكل دائم ومضمون** على Vercel وسحابة تليجرام!

✨ **كيف تعمل الميزة؟**
1️⃣ **أرسل التوكن** الخص ببوتك (من BotFather).
2️⃣ **أرسل ملف الكود** الخاص بك (مثل \`.js\` أو \`.php\` أو \`.json\` أو \`.txt\`).
3️⃣ يقوم البوت **بحفظ ملفك دائمًا برابط حقيقي**، وتفعيل الويب هوك للبوت الخص بك فوراً!

اختر من القائمة أدناه للبدء:
`;

// -------------------------------------------------------------
// الأوامر الرئيسية
// -------------------------------------------------------------

bot.command("start", async (ctx) => {
  userSessions.delete(ctx.from.id);
  await ctx.reply(WELCOME_MESSAGE, {
    parse_mode: "Markdown",
    reply_markup: getMainMenuKeyboard(),
  });
});

bot.command("upload", async (ctx) => {
  await startSetProcess(ctx);
});

bot.command("set", async (ctx) => {
  await startSetProcess(ctx);
});

bot.command("info", async (ctx) => {
  userSessions.set(ctx.from.id, { step: "WAITING_FOR_TOKEN_INFO" });
  await ctx.reply("🔍 **أرسل توكن البوت الذي تريد فحص حالة الويب هوك الخص به:**", {
    parse_mode: "Markdown",
    reply_markup: getBackKeyboard(),
  });
});

bot.command("delete", async (ctx) => {
  userSessions.set(ctx.from.id, { step: "WAITING_FOR_TOKEN_DELETE" });
  await ctx.reply("🗑️ **أرسل توكن البوت الذي تريد حذف وإلغاء الويب هوك منه:**", {
    parse_mode: "Markdown",
    reply_markup: getBackKeyboard(),
  });
});

// -------------------------------------------------------------
// الأزرار التفاعلية
// -------------------------------------------------------------

bot.callbackQuery("main_menu", async (ctx) => {
  await ctx.answerCallbackQuery();
  userSessions.delete(ctx.from.id);
  try {
    await ctx.editMessageText(WELCOME_MESSAGE, {
      parse_mode: "Markdown",
      reply_markup: getMainMenuKeyboard(),
    });
  } catch (e) {}
});

bot.callbackQuery("cancel_action", async (ctx) => {
  await ctx.answerCallbackQuery("تم إلغاء العملية");
  userSessions.delete(ctx.from.id);
  await ctx.editMessageText("❌ **تم إلغاء العملية.**", {
    parse_mode: "Markdown",
    reply_markup: getMainMenuKeyboard(),
  });
});

bot.callbackQuery("start_set_other", async (ctx) => {
  await ctx.answerCallbackQuery();
  await startSetProcess(ctx, true);
});

bot.callbackQuery("start_info_other", async (ctx) => {
  await ctx.answerCallbackQuery();
  userSessions.set(ctx.from.id, { step: "WAITING_FOR_TOKEN_INFO" });
  await ctx.editMessageText("🔍 **فحص الويب هوك:** أرسل توكن البوت المراد فحصه الآن.", {
    parse_mode: "Markdown",
    reply_markup: getBackKeyboard(),
  });
});

bot.callbackQuery("start_delete_other", async (ctx) => {
  await ctx.answerCallbackQuery();
  userSessions.set(ctx.from.id, { step: "WAITING_FOR_TOKEN_DELETE" });
  await ctx.editMessageText("🗑️ **حذف الويب هوك:** أرسل توكن البوت المراد حذف الويب هوك منه.", {
    parse_mode: "Markdown",
    reply_markup: getBackKeyboard(),
  });
});

bot.callbackQuery("download_templates", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    "📂 **قوالب الأكواد والملفات البرمجية الجاهزة للرفع:**\n\nحمل أو انسخ القالب الذي يناسبك ثم أرسله للبوت لاستضافته وتفعيله فوراً:",
    { parse_mode: "Markdown", reply_markup: getTemplatesKeyboard() }
  );
});

bot.callbackQuery("tpl_json", async (ctx) => {
  await ctx.answerCallbackQuery();
  const codeJson = `
📜 **قالب JSON جاهز للردود المخصصة:**

\`\`\`json
{
  "/start": "مرحباً بك في بوتي الخاص!",
  "/help": "قائمة المساعدة والخدمات المتوفرة",
  "سلام": "وعليكم السلام ورحمة الله وبركاته",
  "من انت": "أنا بوت آلي للرد الفوري!"
}
\`\`\`
💡 احفظ هذا النص في ملف باسم \`rules.json\` وارفعه للبوت مباشرة بعد إرسال التوكن وسيرد البوت بهذه النصوص بالضبط!
`;
  await ctx.editMessageText(codeJson, {
    parse_mode: "Markdown",
    reply_markup: getTemplatesKeyboard(),
  });
});

bot.callbackQuery("tpl_txt", async (ctx) => {
  await ctx.answerCallbackQuery();
  const codeTxt = `
📜 **قالب نصي TXT بسيط للردود:**

\`\`\`text
/start = مرحباً بك في البوت!
/help = تواصل معنا عبر الدعم
هلا = أهلاً وسهلاً بك
\`\`\`
💡 احفظ هذا النص في ملف باسم \`bot.txt\` وارفعه للبوت وسيقوم بالرد بناءً عليه!
`;
  await ctx.editMessageText(codeTxt, {
    parse_mode: "Markdown",
    reply_markup: getTemplatesKeyboard(),
  });
});

bot.callbackQuery("tpl_nodejs", async (ctx) => {
  await ctx.answerCallbackQuery();
  const codeNode = `
📜 **قالب Node.js / JavaScript:**

\`\`\`javascript
// ملف bot.js
bot.on("/start", () => reply("أهلاً بك في البوت البرمجي الخاص بي!"));
\`\`\`
💡 ارفع ملف \`bot.js\` للبوت وسيقوم البوت باستخراج الردود البرمجية والرد بها فوراً!
`;
  await ctx.editMessageText(codeNode, {
    parse_mode: "Markdown",
    reply_markup: getTemplatesKeyboard(),
  });
});

bot.callbackQuery("tpl_php", async (ctx) => {
  await ctx.answerCallbackQuery();
  const codePhp = `
📜 **قالب PHP جاهز للرفع:**

\`\`\`php
<?php
// ملف bot.php
echo "PHP Bot Loaded";
?>
\`\`\`
💡 احفظ هذا النص في ملف باسم \`bot.php\` وارفعه للبوت مباشرة بعد إرسال التوكن!
`;
  await ctx.editMessageText(codePhp, {
    parse_mode: "Markdown",
    reply_markup: getTemplatesKeyboard(),
  });
});

bot.callbackQuery("this_bot_info", async (ctx) => {
  await ctx.answerCallbackQuery();
  const me = await ctx.api.getMe();
  await ctx.editMessageText(
    `🤖 **بيانات المحرك الخادم:**\n\n▫️ **الاسم:** ${me.first_name}\n▫️ **اليوزر:** @${me.username}\n▫️ **نظام الحفظ:** سحابة تليجرام + Vercel Serverless (دائم 100%).`,
    { parse_mode: "Markdown", reply_markup: getMainMenuKeyboard() }
  );
});

// -------------------------------------------------------------
// معالجة الرسائل النصية
// -------------------------------------------------------------

bot.on("message:text", async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text.trim();
  const session = userSessions.get(userId);

  if (!session) {
    if (isTelegramToken(text)) {
      await processTokenStep(ctx, text);
      return;
    }
    return ctx.reply(
      "💡 أهلاً بك! يرجى إرسال التوكن الخص ببوتك أولاً أو استخدام القائمة أدناه:",
      { reply_markup: getMainMenuKeyboard() }
    );
  }

  if (session.step === "WAITING_FOR_TOKEN") {
    await processTokenStep(ctx, text);
    return;
  }

  if (session.step === "WAITING_FOR_FILE_OR_URL") {
    if (text.startsWith("http://") || text.startsWith("https://")) {
      await processDirectUrlWebhook(ctx, text, session);
      return;
    }
    return ctx.reply(
      "📂 **يرجى رفع ملف الكود الخص بك** (أرسل الملف كـ Document) أو أرسل رابط الويب هوك الخص بك مباشرة.",
      { parse_mode: "Markdown", reply_markup: getBackKeyboard() }
    );
  }

  if (session.step === "WAITING_FOR_TOKEN_INFO") {
    await processTokenInfo(ctx, text);
    return;
  }

  if (session.step === "WAITING_FOR_TOKEN_DELETE") {
    await processTokenDelete(ctx, text);
    return;
  }
});

// -------------------------------------------------------------
// معالجة استقبال رفع الملفات وتوليد الويب هوك الدائم
// -------------------------------------------------------------

bot.on("message:document", async (ctx) => {
  const userId = ctx.from.id;
  const session = userSessions.get(userId);
  const doc = ctx.message.document;

  if (!session || session.step !== "WAITING_FOR_FILE_OR_URL") {
    return ctx.reply(
      `📥 **استقبلنا الملف:** \`${doc.file_name}\`.\n\nيرجى البدء أولاً بإرسال **التوكن** الخص ببوتك حتى نربط هذا الملف به!`,
      { parse_mode: "Markdown", reply_markup: getMainMenuKeyboard() }
    );
  }

  const statusMsg = await ctx.reply(`🔄 **جاري حفظ ملفك البرمجي (\`${doc.file_name}\`) وتوليد الويب هوك الدائم...**`, {
    parse_mode: "Markdown",
  });

  try {
    const targetBot = session.targetBotInfo;
    const targetToken = session.targetToken;

    // بناء رابط الويب هوك المباشر مع تضمين التوكن ومعرف الملف الدائم
    const dynamicWebhookUrl = `${VERCEL_DOMAIN}/api/dynamic-webhook?token=${encodeURIComponent(targetToken)}&file_id=${encodeURIComponent(doc.file_id)}&name=${encodeURIComponent(doc.file_name)}`;

    // تفعيل الويب هوك للبوت المستهدف بالرابط التلقائي الدائم
    const targetBotClient = new Bot(targetToken);
    const setOk = await targetBotClient.api.setWebhook(dynamicWebhookUrl, {
      drop_pending_updates: true,
    });

    userSessions.delete(userId);

    if (setOk) {
      const successReport = `
🎉 **تم حفظ ملفك بشكل دائم وتفعيل الويب هوك بنجاح!**

🤖 **البوت المستهدف:** ${targetBot.first_name} (@${targetBot.username})
🆔 **معرف البوت (ID):** \`${targetBot.id}\`
📁 **الملف المستضاف:** \`${doc.file_name}\` (${Math.round(doc.file_size / 1024)} KB)

🌐 **رابط الويب هوك المولد والدائم:**
\`${dynamicWebhookUrl}\`

✨ **البوت يعمل الآن 24/7 وبشكل دائم ومضمون بدون أن ينقطع أو يختفي ملفك!**
جرب الدخول للبوت الخص بك [**@${targetBot.username}**](https://t.me/${targetBot.username}) وأرسل \`/start\`!
`;
      await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, successReport, {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        reply_markup: getMainMenuKeyboard(),
      });
    } else {
      await ctx.api.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        "❌ تعذر تفعيل الويب هوك على تليجرام. يرجى التأكد من صلاحية التوكن.",
        { parse_mode: "Markdown", reply_markup: getMainMenuKeyboard() }
      );
    }
  } catch (err) {
    userSessions.delete(userId);
    console.error("File webhook error:", err);
    await ctx.api.editMessageText(
      ctx.chat.id,
      statusMsg.message_id,
      `❌ **حدث خطأ أثناء الربط:**\n\`${err.message}\``,
      { parse_mode: "Markdown", reply_markup: getMainMenuKeyboard() }
    );
  }
});

// -------------------------------------------------------------
// الدوال المساعدة للربط والفحص
// -------------------------------------------------------------

function isTelegramToken(str) {
  return /^\d{8,12}:[A-Za-z0-9_-]{35,}$/.test(str.trim());
}

async function startSetProcess(ctx, isEdit = false) {
  userSessions.set(ctx.from.id, { step: "WAITING_FOR_TOKEN" });
  const msg = `
🔑 **الخطوة 1 من 2: إرسال التوكن**

يرجى إرسال **التوكن (Bot Token)** الخص ببوتك من BotFather:

مثال:
\`5777908472:AAHoyjbO-SouHb8Mw3aYl51...\`
`;
  if (isEdit) {
    await ctx.editMessageText(msg, { parse_mode: "Markdown", reply_markup: getBackKeyboard() });
  } else {
    await ctx.reply(msg, { parse_mode: "Markdown", reply_markup: getBackKeyboard() });
  }
}

async function processTokenStep(ctx, tokenText) {
  const targetToken = tokenText.trim();

  if (!isTelegramToken(targetToken)) {
    return ctx.reply("❌ **صيغة التوكن غير صحيحة!** تأكد من نسخه كاملاً من BotFather وأعد المحاولة.", {
      parse_mode: "Markdown",
      reply_markup: getBackKeyboard(),
    });
  }

  const statusMsg = await ctx.reply("🔄 **جاري التحقق من التوكن واستخراج بيانات البوت...**", {
    parse_mode: "Markdown",
  });

  try {
    const targetBotClient = new Bot(targetToken);
    const targetInfo = await targetBotClient.api.getMe();

    userSessions.set(ctx.from.id, {
      step: "WAITING_FOR_FILE_OR_URL",
      targetToken: targetToken,
      targetBotInfo: targetInfo,
    });

    const msg = `
✅ **تم التحقق من التوكن بنجاح!**

🤖 **البوت الخص بك:** ${targetInfo.first_name} (@${targetInfo.username})
🆔 **ID:** \`${targetInfo.id}\`

---
📂 **الخطوة 2 من 2:**
الآن أرسل **ملف الكود الخص بك** (أرسله كـ Document مثل \`.js\`, \`.php\`, \`.json\`, \`.txt\`)
وسيقوم البوت باعه واستضافته وحفظه دائمًا وتفعيل الويب هوك له!
`;

    await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, msg, {
      parse_mode: "Markdown",
      reply_markup: getBackKeyboard(),
    });
  } catch (err) {
    await ctx.api.editMessageText(
      ctx.chat.id,
      statusMsg.message_id,
      `❌ **التوكن غير صحيح أو تم إلغاؤه من BotFather!**\n\`${err.message}\``,
      { parse_mode: "Markdown", reply_markup: getBackKeyboard() }
    );
  }
}

async function processDirectUrlWebhook(ctx, rawUrl, session) {
  let targetUrl = rawUrl.trim();
  if (!targetUrl.startsWith("http")) targetUrl = "https://" + targetUrl;

  const statusMsg = await ctx.reply("🔄 **جاري ربط الويب هوك بالرابط...**");
  try {
    const targetBotClient = new Bot(session.targetToken);
    const isOk = await targetBotClient.api.setWebhook(targetUrl, { drop_pending_updates: true });

    userSessions.delete(ctx.from.id);
    if (isOk) {
      await ctx.api.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        `✅ **تم ربط الويب هوك بنجاح!**\n\n🤖 **البوت:** @${session.targetBotInfo.username}\n🌐 **الرابط:** \`${targetUrl}\``,
        { parse_mode: "Markdown", reply_markup: getMainMenuKeyboard() }
      );
    } else {
      await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, "❌ فشل الربط بالرابط.");
    }
  } catch (err) {
    userSessions.delete(ctx.from.id);
    await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, `❌ خطأ: ${err.message}`);
  }
}

async function processTokenInfo(ctx, tokenText) {
  const token = tokenText.trim();
  userSessions.delete(ctx.from.id);
  if (!isTelegramToken(token)) return ctx.reply("❌ توكن غير صحيح.");

  try {
    const client = new Bot(token);
    const [botInfo, webhookInfo] = await Promise.all([client.api.getMe(), client.api.getWebhookInfo()]);

    const report = `
ℹ️ **حالة الويب هوك للبوت (@${botInfo.username}):**
▫️ **الحالة:** ${webhookInfo.url ? "مفعل ومربوط ✅" : "غير مفعّل ❌"}
🌐 **الرابط:** \`${webhookInfo.url || "لا يوجد"}\`
📩 **الرسائل المعلقة:** \`${webhookInfo.pending_update_count}\`
⚠️ **آخر خطأ:** \`${webhookInfo.last_error_message || "لا يوجد أخطاء"}\`
`;
    await ctx.reply(report, { parse_mode: "Markdown", reply_markup: getMainMenuKeyboard() });
  } catch (err) {
    await ctx.reply(`❌ تعذر الفحص: ${err.message}`, { reply_markup: getMainMenuKeyboard() });
  }
}

async function processTokenDelete(ctx, tokenText) {
  const token = tokenText.trim();
  userSessions.delete(ctx.from.id);
  if (!isTelegramToken(token)) return ctx.reply("❌ توكن غير صحيح.");

  try {
    const client = new Bot(token);
    const botInfo = await client.api.getMe();
    await client.api.deleteWebhook();
    await ctx.reply(`✅ تم إلغاء الويب هوك للبوت (@${botInfo.username}) بنجاح.`, {
      reply_markup: getMainMenuKeyboard(),
    });
  } catch (err) {
    await ctx.reply(`❌ خطأ أثناء الحذف: ${err.message}`, { reply_markup: getMainMenuKeyboard() });
  }
}

module.exports = { bot, BOT_TOKEN };
