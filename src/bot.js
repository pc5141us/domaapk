const { Bot, InputFile } = require("grammy");
const fetch = require("node-fetch"); // fallback or native fetch in Node 18+
require("dotenv").config();

const {
  getMainMenuKeyboard,
  getBackKeyboard,
  getTemplatesKeyboard,
} = require("./keyboards");

// توكن البوت المستضيف
const BOT_TOKEN =
  process.env.BOT_TOKEN ||
  "5777908472:AAHoyjbO-SouHb8Mw3aYl51zdTKpj3DQuog";

const bot = new Bot(BOT_TOKEN);

// جلسات المستخدمين لتتبع الخطوات (State Management)
// key: userId -> value: { step: string, targetToken?: string, targetBotInfo?: object }
const userSessions = new Map();

/**
 * رسالة الترحيب الرئيسية
 */
const WELCOME_MESSAGE = `
👋 **أهلاً بك في صانع ومقترن الويب هوك الشامل لبوتات تليجرام**

هذا البوت عربي بالكامل، يتيح لك **ربط وتفعيل وفحص الويب هوك (Webhook) لأي بوت تليجرام آخر** من خلال إرسال التوكن ورابط الويب هوك أو ملف الكود!

✨ **الخدمات المتاحة للبوتات الأخرى:**
▫️ ➕ **ربط ويب هوك لبوت جديد:** إرسال التوكن ثم الرابط لربط أي بوت فوراً.
▫️ ℹ️ **فحص ويب هوك أي بوت:** استعلام عن حالة الويب هوك المعلق والأخطاء لأي توكن.
▫️ 🗑️ **حذف ويب هوك أي بوت:** إلغاء الويب هوك لأي بوت بالتوكن.
▫️ 📂 **قوالب كود جاهزة:** تحميل ملفات سورس كود جاهزة للرفع على Vercel و PHP.

اختر من القائمة التفاعلية أدناه للبدء:
`;

// -------------------------------------------------------------
// الأوامر الرئيسية (Commands)
// -------------------------------------------------------------

bot.command("start", async (ctx) => {
  userSessions.delete(ctx.from.id);
  await ctx.reply(WELCOME_MESSAGE, {
    parse_mode: "Markdown",
    reply_markup: getMainMenuKeyboard(),
  });
});

bot.command("help", async (ctx) => {
  const helpText = `
📚 **دليل استخدام صانع ومقترن الويب هوك:**

1️⃣ **لربط ويب هوك لبوت آخر:**
أرسل /set ثم اتبع التعليمات لإرسال توكن البوت الآخر والرابط.

2️⃣ **لفحص حالة ويب هوك بوت آخر:**
أرسل /info ثم أرسل توكن البوت المراد فحصه.

3️⃣ **لحذف ويب هوك بوت آخر:**
أرسل /delete ثم أرسل توكن البوت.

💡 **أمثلة للأوامر المباشرة:**
▫️ \`/set\` - بدء معالج ربط بوت جديد
▫️ \`/info\` - فحص ويب هوك لبوت
▫️ \`/delete\` - حذف ويب هوك للبوت
`;
  await ctx.reply(helpText, {
    parse_mode: "Markdown",
    reply_markup: getBackKeyboard(),
  });
});

bot.command("set", async (ctx) => {
  userSessions.set(ctx.from.id, { step: "WAITING_FOR_TOKEN_SET" });
  await ctx.reply(
    "🔑 **الخطوة 1 من 2:**\n\nيرجى إرسال **التوكن (Bot Token)** الخاص بالبوت الذي تريد ربط الويب هوك له:\n\nمثال:\n`123456789:AAgX...`",
    { parse_mode: "Markdown", reply_markup: getBackKeyboard() }
  );
});

bot.command("info", async (ctx) => {
  userSessions.set(ctx.from.id, { step: "WAITING_FOR_TOKEN_INFO" });
  await ctx.reply(
    "🔍 **يرجى إرسال التوكن (Bot Token) للبوت الذي تريد فحص الويب هوك الخاص به:**",
    { parse_mode: "Markdown", reply_markup: getBackKeyboard() }
  );
});

bot.command("delete", async (ctx) => {
  userSessions.set(ctx.from.id, { step: "WAITING_FOR_TOKEN_DELETE" });
  await ctx.reply(
    "🗑️ **يرجى إرسال التوكن (Bot Token) للبوت الذي تريد حذف الويب هوك منه:**",
    { parse_mode: "Markdown", reply_markup: getBackKeyboard() }
  );
});

// -------------------------------------------------------------
// الأزرار التفاعلية (Callback Queries)
// -------------------------------------------------------------

bot.callbackQuery("main_menu", async (ctx) => {
  await ctx.answerCallbackQuery();
  userSessions.delete(ctx.from.id);
  try {
    await ctx.editMessageText(WELCOME_MESSAGE, {
      parse_mode: "Markdown",
      reply_markup: getMainMenuKeyboard(),
    });
  } catch (e) {
    await ctx.reply(WELCOME_MESSAGE, {
      parse_mode: "Markdown",
      reply_markup: getMainMenuKeyboard(),
    });
  }
});

bot.callbackQuery("cancel_action", async (ctx) => {
  await ctx.answerCallbackQuery("تم إلغاء العملية");
  userSessions.delete(ctx.from.id);
  await ctx.editMessageText("❌ **تم إلغاء العملية الحالية.**", {
    parse_mode: "Markdown",
    reply_markup: getMainMenuKeyboard(),
  });
});

bot.callbackQuery("start_set_other", async (ctx) => {
  await ctx.answerCallbackQuery();
  userSessions.set(ctx.from.id, { step: "WAITING_FOR_TOKEN_SET" });
  await ctx.editMessageText(
    "🔑 **الخطوة 1 من 2: إرسال التوكن**\n\nيرجى إرسال **التوكن (Bot Token)** الخاص بالبوت الذي تريد ربطه الآن من BotFather:\n\nمثال:\n`5777908472:AAHoyjbO-SouHb8Mw3aYl51...`",
    { parse_mode: "Markdown", reply_markup: getBackKeyboard() }
  );
});

bot.callbackQuery("start_info_other", async (ctx) => {
  await ctx.answerCallbackQuery();
  userSessions.set(ctx.from.id, { step: "WAITING_FOR_TOKEN_INFO" });
  await ctx.editMessageText(
    "🔍 **فحص حالة الويب هوك:**\n\nأرسل توكن البوت المراد فحصه للاستعلام عن الرابط الحالي والأخطاء.",
    { parse_mode: "Markdown", reply_markup: getBackKeyboard() }
  );
});

bot.callbackQuery("start_delete_other", async (ctx) => {
  await ctx.answerCallbackQuery();
  userSessions.set(ctx.from.id, { step: "WAITING_FOR_TOKEN_DELETE" });
  await ctx.editMessageText(
    "🗑️ **حذف وإلغاء الويب هوك:**\n\nأرسل توكن البوت الذي ترغب في إلغاء الويب هوك منه للعودة لنظام Polling.",
    { parse_mode: "Markdown", reply_markup: getBackKeyboard() }
  );
});

bot.callbackQuery("this_bot_info", async (ctx) => {
  await ctx.answerCallbackQuery();
  const me = await ctx.api.getMe();
  const infoText = `
🤖 **معلومات صانع الويب هوك الحالي:**

▫️ **الاسم:** ${me.first_name}
▫️ **اليوزر:** @${me.username}
▫️ **معرف البوت:** \`${me.id}\`
▫️ **الوظيفة:** ربط وفحص وإدارة الويب هوك لأي بوت آخر بسهولة.
`;
  await ctx.editMessageText(infoText, {
    parse_mode: "Markdown",
    reply_markup: getMainMenuKeyboard(),
  });
});

bot.callbackQuery("download_templates", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    "📂 **قوالب وسورس كود الويب هوك الجاهزة:**\n\nاختر لغة البرمجة أو الإطار لعرض القالب الجاهز للنشر على Vercel أو الخوادم الشخصية:",
    { parse_mode: "Markdown", reply_markup: getTemplatesKeyboard() }
  );
});

bot.callbackQuery("tpl_nodejs", async (ctx) => {
  await ctx.answerCallbackQuery();
  const codeNode = `
📜 **قالب Node.js (grammY + Express) لـ Vercel:**

\`\`\`javascript
const { Bot, webhookCallback } = require("grammy");
const express = require("express");

const bot = new Bot(process.env.BOT_TOKEN);

bot.command("start", (ctx) => ctx.reply("أهلاً بك في البوت المربوط بالويب هوك!"));

const app = express();
app.use(express.json());

// إضافة التوافقية مع Vercel Serverless
app.use((req, res, next) => {
  if (typeof req.header !== "function") {
    req.header = (name) => req.headers[name ? name.toLowerCase() : ""];
  }
  next();
});

app.post("/api/webhook", webhookCallback(bot, "express"));

module.exports = app;
\`\`\`
`;
  await ctx.editMessageText(codeNode, {
    parse_mode: "Markdown",
    reply_markup: getTemplatesKeyboard(),
  });
});

bot.callbackQuery("tpl_php", async (ctx) => {
  await ctx.answerCallbackQuery();
  const codePhp = `
📜 **قالب PHP Webhook بسيط:**

\`\`\`php
<?php
$token = "ضع_التوكن_هنا";
$apiUrl = "https://api.telegram.org/bot" . $token;

$content = file_get_contents("php://input");
$update = json_decode($content, true);

if (isset($update["message"])) {
    $chat_id = $update["message"]["chat"]["id"];
    $text = $update["message"]["text"];

    if ($text == "/start") {
        file_get_contents($apiUrl . "/sendMessage?chat_id=" . $chat_id . "&text=" . urlencode("أهلاً بك في بوت PHP!"));
    }
}
?>
\`\`\`
`;
  await ctx.editMessageText(codePhp, {
    parse_mode: "Markdown",
    reply_markup: getTemplatesKeyboard(),
  });
});

bot.callbackQuery("tpl_python", async (ctx) => {
  await ctx.answerCallbackQuery();
  const codePy = `
📜 **قالب Python (pyTelegramBotAPI + Flask):**

\`\`\`python
import os
import telebot
from flask import Flask, request

bot = telebot.TeleBot(os.environ.get('BOT_TOKEN'))
app = Flask(__name__)

@bot.message_handler(commands=['start'])
def start(message):
    bot.reply_to(message, "مرحباً بك في بوت بايثون!")

@app.route('/api/webhook', methods=['POST'])
def webhook():
    json_str = request.get_data().decode('UTF-8')
    update = telebot.types.Update.de_json(json_str)
    bot.process_new_updates([update])
    return 'OK', 200

if __name__ == '__main__':
    app.run(port=5000)
\`\`\`
`;
  await ctx.editMessageText(codePy, {
    parse_mode: "Markdown",
    reply_markup: getTemplatesKeyboard(),
  });
});

bot.callbackQuery("vercel_guide", async (ctx) => {
  await ctx.answerCallbackQuery();
  const vercelText = `
🚀 **دليل نشر كود أي بوت على Vercel وربط الويب هوك:**

1️⃣ **الخطوة 1:** ارفع كود البوت الخص بك على **GitHub**.
2️⃣ **الخطوة 2:** افتح [Vercel.com](https://vercel.com) وقم بعمل Import للمشروع.
3️⃣ **الخطوة 3:** أضف توكن البوت الخص بك في قسم **Environment Variables** كـ \`BOT_TOKEN\`.
4️⃣ **الخطوة 4:** بعد صدور رابط Vercel الخاص بمشروعك (مثال: \`https://mybot.vercel.app\`)، انسخ الرابط وافتح هذا البوت واضغط **➕ ربط ويب هوك لبوت آخر**!
`;
  await ctx.editMessageText(vercelText, {
    parse_mode: "Markdown",
    reply_markup: getMainMenuKeyboard(),
  });
});

// -------------------------------------------------------------
// معالج استقبال الملفات والرسائل النصية والتوكنات
// -------------------------------------------------------------

// معالجة الرسائل النصية
bot.on("message:text", async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text.trim();
  const session = userSessions.get(userId);

  // إذا لم يكن هناك جلسة نشطة
  if (!session) {
    // التاكد مما إذا كان المرسل قد أرسل توكن بشكل مباشر (النمط القياسي للتوكن)
    if (isTelegramToken(text)) {
      await processTokenSetStep(ctx, text);
      return;
    }
    return ctx.reply(
      "💡 **أهلاً بك!** يرجى استخدام القائمة التفاعلية أدناه أو إرسال توكن البوت الذي تريد ربطه مباشرة:",
      { parse_mode: "Markdown", reply_markup: getMainMenuKeyboard() }
    );
  }

  // 1. انتظار إرسال التوكن للربط
  if (session.step === "WAITING_FOR_TOKEN_SET") {
    await processTokenSetStep(ctx, text);
    return;
  }

  // 2. انتظار إرسال الرابط للربط بعد التأكد من التوكن
  if (session.step === "WAITING_FOR_URL_OR_FILE") {
    await processWebhookUrlStep(ctx, text, session);
    return;
  }

  // 3. انتظار التوكن للفحص
  if (session.step === "WAITING_FOR_TOKEN_INFO") {
    await processTokenInfoStep(ctx, text);
    return;
  }

  // 4. انتظار التوكن للحذف
  if (session.step === "WAITING_FOR_TOKEN_DELETE") {
    await processTokenDeleteStep(ctx, text);
    return;
  }
});

// معالجة استقبال الملفات (Document / File upload)
bot.on("message:document", async (ctx) => {
  const userId = ctx.from.id;
  const session = userSessions.get(userId);
  const doc = ctx.message.document;

  if (session && session.step === "WAITING_FOR_URL_OR_FILE") {
    await ctx.reply(
      `📥 **تم استقبال الملف:** \`${doc.file_name}\` (${Math.round(doc.file_size / 1024)} KB)\n\n⚡ لربط هذا الملف بالويب هوك الخاص بـ **${session.targetBotInfo.first_name}** (@${session.targetBotInfo.username}):\n\n1️⃣ قم برفع هذا الملف إلى خادمك أو حسابك في **Vercel**.\n2️⃣ أرسل الآن رابط الويب هوك الخاص بالسيرفر (مثال: \`https://my-domain.com/api/webhook\` أو رابط Vercel المولد).`,
      { parse_mode: "Markdown", reply_markup: getBackKeyboard() }
    );
    return;
  }

  await ctx.reply(
    `📥 **استقبلنا الملف:** \`${doc.file_name}\`.\n\nيرجى البدء بالضغط على **➕ ربط ويب هوك لبوت آخر** وإرسال التوكن أولاً لربط الملف بالبوت المطلوب.`,
    { parse_mode: "Markdown", reply_markup: getMainMenuKeyboard() }
  );
});

// -------------------------------------------------------------
// الدوال المساعدة للتحقق والربط
// -------------------------------------------------------------

/**
 * التحقق مما إذا كان النص يشبه نمط توكن تليجرام (مثل: 123456789:ABC...)
 */
function isTelegramToken(str) {
  return /^\d{8,12}:[A-Za-z0-9_-]{35,}$/.test(str.trim());
}

/**
 * خطوة التأكد من التوكن وجلب معلومات البوت
 */
async function processTokenSetStep(ctx, tokenText) {
  const targetToken = tokenText.trim();

  if (!isTelegramToken(targetToken)) {
    return ctx.reply(
      "❌ **صيغة التوكن غير صحيحة!**\n\nتأكد من نسخ التوكن كاملاً من BotFather (مثال: `5777908472:AAHoyjbO-SouHb...`) وأعد المحاولة.",
      { parse_mode: "Markdown", reply_markup: getBackKeyboard() }
    );
  }

  const checkMsg = await ctx.reply("🔄 **جاري التحقق من التوكن عبر Telegram API...**", {
    parse_mode: "Markdown",
  });

  try {
    // إنشاء كائن بوت مؤقت للبوت المستهدف للاستعلام عنه
    const targetBot = new Bot(targetToken);
    const targetInfo = await targetBot.api.getMe();

    // حفظ الجلسة للانتقال للخطوة التالية
    userSessions.set(ctx.from.id, {
      step: "WAITING_FOR_URL_OR_FILE",
      targetToken: targetToken,
      targetBotInfo: targetInfo,
    });

    const successText = `
✅ **تم التحقق من التوكن بنجاح!**

🤖 **بيانات البوت المستهدف:**
▫️ **الاسم:** ${targetInfo.first_name}
▫️ **اليوزر:** @${targetInfo.username}
▫️ **ID:** \`${targetInfo.id}\`

---
🌐 **الخطوة 2 من 2:**
أرسل الآن **رابط الويب هوك (URL)** الخاص بسيرفرك أو تطبيقك على Vercel (مثال: \`https://your-app.vercel.app/api/webhook\`) أو قم برفع ملف الكود الخاص بك هنا.
`;

    await ctx.api.editMessageText(ctx.chat.id, checkMsg.message_id, successText, {
      parse_mode: "Markdown",
      reply_markup: getBackKeyboard(),
    });
  } catch (err) {
    await ctx.api.editMessageText(
      ctx.chat.id,
      checkMsg.message_id,
      `❌ **التوكن غير صحيح أو تم إلغاؤه من BotFather!**\n\nتفاصيل الخطأ:\n\`${err.message}\``,
      { parse_mode: "Markdown", reply_markup: getBackKeyboard() }
    );
  }
}

/**
 * خطوة تنفيذ ربط الويب هوك بالرابط للبوت المستهدف
 */
async function processWebhookUrlStep(ctx, urlText, session) {
  let targetUrl = urlText.trim();

  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = "https://" + targetUrl;
  }

  if (!targetUrl.startsWith("https://")) {
    return ctx.reply(
      "❌ **خطأ:** يتطلب تليجرام أن يكون الرابط مشفراً وآمناً بـ `https://`.\nيرجى إعادة المحاولة برابط صحيح.",
      { parse_mode: "Markdown", reply_markup: getBackKeyboard() }
    );
  }

  const statusMsg = await ctx.reply(
    `🔄 **جاري ربط الويب هوك للبوت (@${session.targetBotInfo.username})...**`,
    { parse_mode: "Markdown" }
  );

  try {
    const targetBot = new Bot(session.targetToken);
    const isOk = await targetBot.api.setWebhook(targetUrl, {
      drop_pending_updates: true,
    });

    userSessions.delete(ctx.from.id);

    if (isOk) {
      const resultText = `
🎉 **تم ربط الويب هوك بنجاح للبوت الآخر!**

🤖 **البوت المرتبط:** ${session.targetBotInfo.first_name} (@${session.targetBotInfo.username})
🌐 **رابط الويب هوك (URL):**
\`${targetUrl}\`

✨ **الحالة:** تليجرام يقوم الآن بتوجيه جميع الرسائل والتحديثات فورياً لهذا الرابط!
`;
      await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, resultText, {
        parse_mode: "Markdown",
        reply_markup: getMainMenuKeyboard(),
      });
    } else {
      await ctx.api.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        "❌ فشل ربط الويب هوك للبوت المستهدف. تأكد من أن السيرفر يعمل ويستجيب بشكل صحيح.",
        { parse_mode: "Markdown", reply_markup: getMainMenuKeyboard() }
      );
    }
  } catch (err) {
    userSessions.delete(ctx.from.id);
    await ctx.api.editMessageText(
      ctx.chat.id,
      statusMsg.message_id,
      `❌ **فشل ربط الويب هوك بسبب خطأ من Telegram API:**\n\`${err.message}\``,
      { parse_mode: "Markdown", reply_markup: getMainMenuKeyboard() }
    );
  }
}

/**
 * خطوة فحص حالة الويب هوك لبوت بالتوكن
 */
async function processTokenInfoStep(ctx, tokenText) {
  const targetToken = tokenText.trim();
  userSessions.delete(ctx.from.id);

  if (!isTelegramToken(targetToken)) {
    return ctx.reply("❌ صيغة التوكن غير صحيحة!", { reply_markup: getMainMenuKeyboard() });
  }

  const statusMsg = await ctx.reply("🔄 **جاري فحص حالة الويب هوك...**", { parse_mode: "Markdown" });

  try {
    const targetBot = new Bot(targetToken);
    const [botInfo, webhookInfo] = await Promise.all([
      targetBot.api.getMe(),
      targetBot.api.getWebhookInfo(),
    ]);

    let errorDetails = "لا يوجد أخطاء سابقة ✨";
    if (webhookInfo.last_error_date) {
      const errDate = new Date(webhookInfo.last_error_date * 1000).toLocaleString("ar-EG");
      errorDetails = `⚠️ **آخر خطأ:** \`${webhookInfo.last_error_message || "غير معروف"}\`\n🗓️ **التاريخ:** \`${errDate}\``;
    }

    const reportText = `
ℹ️ **تقرير الويب هوك للبوت (${botInfo.first_name} - @${botInfo.username}):**

▫️ **معرف البوت (ID):** \`${botInfo.id}\`
▫️ **حالة الويب هوك:** ${webhookInfo.url ? "مفعل ومربوط ✅" : "غير مرتبط حالياً ❌"}
🌐 **الرابط المرتبط:**
${webhookInfo.url ? `\`${webhookInfo.url}\`` : "لا يوجد"}

📊 **بيانات الاتصال:**
▫️ **الرسائل المعلقة (Pending):** \`${webhookInfo.pending_update_count}\`
▫️ **الحد الأقصى للاتصالات:** \`${webhookInfo.max_connections || 40}\`

${errorDetails}
`;

    await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, reportText, {
      parse_mode: "Markdown",
      reply_markup: getMainMenuKeyboard(),
    });
  } catch (err) {
    await ctx.api.editMessageText(
      ctx.chat.id,
      statusMsg.message_id,
      `❌ **تعذر فحص الويب هوك:**\n\`${err.message}\``,
      { parse_mode: "Markdown", reply_markup: getMainMenuKeyboard() }
    );
  }
}

/**
 * خطوة حذف الويب هوك لبوت بالتوكن
 */
async function processTokenDeleteStep(ctx, tokenText) {
  const targetToken = tokenText.trim();
  userSessions.delete(ctx.from.id);

  if (!isTelegramToken(targetToken)) {
    return ctx.reply("❌ صيغة التوكن غير صحيحة!", { reply_markup: getMainMenuKeyboard() });
  }

  const statusMsg = await ctx.reply("🔄 **جاري حذف الويب هوك...**", { parse_mode: "Markdown" });

  try {
    const targetBot = new Bot(targetToken);
    const botInfo = await targetBot.api.getMe();
    const isOk = await targetBot.api.deleteWebhook({ drop_pending_updates: false });

    if (isOk) {
      await ctx.api.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        `✅ **تم حذف وإلغاء الويب هوك بنجاح للبوت (${botInfo.first_name} - @${botInfo.username})!**\n\nالبوت الآن جاهز للعمل بنظام Polling أو إعادة الربط.`,
        { parse_mode: "Markdown", reply_markup: getMainMenuKeyboard() }
      );
    } else {
      await ctx.api.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        "❌ لم يكتمل حذف الويب هوك، يرجى إعادة المحاولة.",
        { parse_mode: "Markdown", reply_markup: getMainMenuKeyboard() }
      );
    }
  } catch (err) {
    await ctx.api.editMessageText(
      ctx.chat.id,
      statusMsg.message_id,
      `❌ **حدث خطأ أثناء الحذف:**\n\`${err.message}\``,
      { parse_mode: "Markdown", reply_markup: getMainMenuKeyboard() }
    );
  }
}

module.exports = { bot, BOT_TOKEN };
