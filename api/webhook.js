const { Telegraf } = require('telegraf');

// --- بياناتك المحفوظة ---
const BOT_TOKEN = '8402726492:AAGLLp8_8wjBBUSA175XB2pM83xty2DmgCU';
const OWNER_ID = '682572594';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyZ6Cdjn2WPM82EOrEZGUPrLXtE9Mt6UrfxrZPQngCiRB-4I6ewgsW7cRBxOONeugcv/exec';

const bot = new Telegraf(BOT_TOKEN);

// قائمة المحظورين (مؤقتة في الذاكرة)
let bannedUsers = new Set();

// --- لوحات المفاتيح (Reply Keyboard) ---

const adminKeyboard = {
  reply_markup: {
    keyboard: [
      [{ text: '👤 تعديل الاسم' }, { text: '📝 تعديل الوصف' }],
      [{ text: '🌐 روابط السوشيال ميديا' }],
      [{ text: '📢 إدارة المستخدمين' }]
    ],
    resize_keyboard: true
  }
};

const usersManagementKeyboard = {
  reply_markup: {
    keyboard: [
      [{ text: '👥 قائمة المستخدمين' }, { text: '📢 إرسال جماعي' }],
      [{ text: '⬅️ الرجوع للقائمة الرئيسية' }]
    ],
    resize_keyboard: true
  }
};

const linksKeyboard = {
  reply_markup: {
    keyboard: [
      [{ text: '🔵 فيسبوك' }, { text: '🟢 واتساب' }],
      [{ text: '🟣 إنستجرام' }, { text: '🔵 تليجرام' }],
      [{ text: '⬅️ الرجوع للقائمة الرئيسية' }]
    ],
    resize_keyboard: true
  }
};

// لوحة التحكم لمستخدم معين بالاسم فقط
function getUserControlKeyboard(name) {
  return {
    reply_markup: {
      keyboard: [
        [{ text: `💬 مراسلة (${name})` }],
        [{ text: `🚫 حظر (${name})` }, { text: `✅ فك الحظر (${name})` }],
        [{ text: `🆔 عرض الـ ID (${name})` }],
        [{ text: '👥 قائمة المستخدمين' }, { text: '⬅️ الرجوع للقائمة الرئيسية' }]
      ],
      resize_keyboard: true
    }
  };
}

// --- الحماية ---
bot.use(async (ctx, next) => {
  if (ctx.from && bannedUsers.has(ctx.from.id.toString())) {
    return ctx.reply('🚫 عذراً، لقد تم حظرك من استخدام هذا البوت.');
  }
  return next();
});

// --- الأوامر الأساسية ---

bot.start(async (ctx) => {
  const userId = ctx.from.id.toString();
  const firstName = ctx.from.first_name;
  const username = ctx.from.username || 'لا يوجد';
  
  let isNew = false;
  try {
    const saveUrl = `${SCRIPT_URL}?action=registerUser&id=${userId}&name=${encodeURIComponent(firstName)}&username=${encodeURIComponent(username)}`;
    const response = await fetch(saveUrl);
    const result = await response.text();
    if (result === "New") isNew = true;
  } catch (e) { }

  if (userId === OWNER_ID) {
    return ctx.reply('أهلاً بك يا حمدي! يمكنك التحكم في كل شيء من هنا:', adminKeyboard);
  } else {
    if (isNew) {
      await bot.telegram.sendMessage(OWNER_ID, `🔔 مستخدم جديد دخل البوت:\nالاسم: ${firstName}\nID: \`${userId}\``);
    }
    return ctx.reply(`أهلاً بك يا ${firstName}! يمكنك مراسلتي هنا وسأقوم بالرد عليك قريباً.`);
  }
});

// --- إدارة المستخدمين ---

bot.hears('📢 إدارة المستخدمين', (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return;
  ctx.reply('إدارة المستخدمين والتواصل:', usersManagementKeyboard);
});

bot.hears('👥 قائمة المستخدمين', async (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return;
  try {
    ctx.reply('⏳ جاري جلب القائمة...');
    const response = await fetch(`${SCRIPT_URL}?action=getUsers`);
    let users = await response.json();
    
    users = users.filter(u => u.id.toString() !== OWNER_ID);
    if (!users || users.length === 0) return ctx.reply('📭 لا يوجد مستخدمين مسجلين.');

    const keyboard = [];
    for (let i = 0; i < users.length; i += 3) {
      // الاسم فقط في الزر
      const row = users.slice(i, i + 3).map(u => ({ text: `👤 ${u.name}` }));
      keyboard.push(row);
    }
    keyboard.push([{ text: '⬅️ الرجوع للقائمة الرئيسية' }]);

    ctx.reply('👥 قائمة المستخدمين:', {
      reply_markup: { keyboard: keyboard, resize_keyboard: true }
    });
  } catch (e) { ctx.reply('❌ فشل جلب القائمة.'); }
});

// دالة مساعدة للبحث عن ID المستخدم بالاسم
async function getUserIdByName(name) {
  try {
    const response = await fetch(`${SCRIPT_URL}?action=getUsers`);
    const users = await response.json();
    const matches = users.filter(u => u.name === name);
    if (matches.length === 0) return null;
    return matches[0].id; // نأخذ الأول، في حال تكرار الأسماء يفضل تعديلها يدوياً
  } catch (e) { return null; }
}

// رصد اختيار مستخدم بالاسم فقط
bot.hears(/^👤 (.+)$/, async (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return;
  const name = ctx.match[1].trim();
  if (name === 'الرجوع للقائمة الرئيسية') return;
  
  const id = await getUserIdByName(name);
  if (!id) return ctx.reply(`❌ لم يتم العثور على ID للمستخدم: ${name}`);
  
  const isBanned = bannedUsers.has(id.toString());
  ctx.reply(`🛠️ إدارة المستخدم: ${name}\nID: ${id}\nالحالة: ${isBanned ? '🔴 محظور' : '🟢 نشط'}`, getUserControlKeyboard(name));
});

bot.hears(/^🚫 حظر \((.+)\)$/, async (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return;
  const name = ctx.match[1];
  const id = await getUserIdByName(name);
  if (!id) return ctx.reply('❌ تعذر العثور على المستخدم للحظر.');
  bannedUsers.add(id.toString());
  ctx.reply(`✅ تم حظر المستخدم: ${name}`, getUserControlKeyboard(name));
});

bot.hears(/^✅ فك الحظر \((.+)\)$/, async (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return;
  const name = ctx.match[1];
  const id = await getUserIdByName(name);
  if (!id) return ctx.reply('❌ تعذر العثور على المستخدم لفك الحظر.');
  bannedUsers.delete(id.toString());
  ctx.reply(`✅ تم فك الحظر عن: ${name}`, getUserControlKeyboard(name));
});

bot.hears(/^💬 مراسلة \((.+)\)$/, async (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return;
  const name = ctx.match[1];
  const id = await getUserIdByName(name);
  if (!id) return ctx.reply('❌ تعذر تحديد المستخدم للمراسلة.');
  ctx.reply(`📝 اكتب رسالتك للمستخدم: ${name} (ID: ${id}):`, { reply_markup: { force_reply: true } });
});

bot.hears(/^🆔 عرض الـ ID \((.+)\)$/, async (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return;
  const name = ctx.match[1];
  const id = await getUserIdByName(name);
  if (!id) return ctx.reply('❌ تعذر العثور على الرقم التعريفي لهذا المستخدم.');
  ctx.reply(`🆔 الرقم التعريفي (ID) لـ ${name} هو:\n\n\`${id}\`\n\n*(اضغط عليه لنسخه)*`, { 
    parse_mode: 'Markdown',
    reply_markup: getUserControlKeyboard(name)
  });
});

// --- تعديل بيانات الموقع ---

const PROMPT_NAME = 'أرسل الاسم الجديد الآن:';
const PROMPT_BIO = 'أرسل الوصف الجديد الآن:';
const PROMPT_FB = 'أرسل رابط فيسبوك الجديد:';
const PROMPT_WA = 'أرسل رابط واتساب الجديد:';
const PROMPT_IG = 'أرسل رابط إنستجرام الجديد:';
const PROMPT_TG = 'أرسل رابط تليجرام الجديد:';
const PROMPT_BROADCAST = 'أرسل رسالة البرودكاست للكل:';

bot.hears('👤 تعديل الاسم', (ctx) => ctx.reply(`${PROMPT_NAME}\n\n(للتنفيذ قم بعمل رد Reply على هذه الرسالة.. للإلغاء اضغط على أي زر آخر بالأسفل)`, adminKeyboard));
bot.hears('📝 تعديل الوصف', (ctx) => ctx.reply(`${PROMPT_BIO}\n\n(للتنفيذ قم بعمل رد Reply على هذه الرسالة.. للإلغاء اضغط على أي زر آخر بالأسفل)`, adminKeyboard));
bot.hears('🌐 روابط السوشيال ميديا', (ctx) => ctx.reply('اختر الرابط لتعديله:', linksKeyboard));
bot.hears('🔵 فيسبوك', (ctx) => ctx.reply(`${PROMPT_FB}\n\n(للتنفيذ قم بعمل رد Reply على هذه الرسالة.. للإلغاء اضغط على زر الرجوع)`, linksKeyboard));
bot.hears('🟢 واتساب', (ctx) => ctx.reply(`${PROMPT_WA}\n\n(للتنفيذ قم بعمل رد Reply على هذه الرسالة.. للإلغاء اضغط على زر الرجوع)`, linksKeyboard));
bot.hears('🟣 إنستجرام', (ctx) => ctx.reply(`${PROMPT_IG}\n\n(للتنفيذ قم بعمل رد Reply على هذه الرسالة.. للإلغاء اضغط على زر الرجوع)`, linksKeyboard));
bot.hears('🔵 تليجرام', (ctx) => ctx.reply(`${PROMPT_TG}\n\n(للتنفيذ قم بعمل رد Reply على هذه الرسالة.. للإلغاء اضغط على زر الرجوع)`, linksKeyboard));
bot.hears('📢 إرسال جماعي', (ctx) => ctx.reply(`${PROMPT_BROADCAST}\n\n(للتنفيذ قم بعمل رد Reply على هذه الرسالة.. للإلغاء اضغط على زر الرجوع)`, usersManagementKeyboard));
bot.hears('⬅️ الرجوع للقائمة الرئيسية', (ctx) => ctx.reply('الرئيسية', adminKeyboard));

// --- معالجة الرسائل الواردة ---

bot.on('message', async (ctx) => {
  const userId = ctx.from.id.toString();
  const messageText = ctx.message.text;

  if (userId === OWNER_ID) {
    if (ctx.message.reply_to_message) {
      const replyToText = ctx.message.reply_to_message.text || ctx.message.reply_to_message.caption || '';
      
      // إذا كان النص المرسل هو اسم أحد الأزرار، نلغي العملية فوراً
      if (messageText && (
        messageText.includes('الرجوع') || 
        messageText.includes('تعديل') || 
        messageText.includes('روابط') || 
        messageText.includes('إدارة') || 
        messageText.includes('قائمة')
      )) return;

      // رادار الـ ID (يبحث عن الرقم بعد كلمة ID في أي مكان)
      const idMatch = replyToText.match(/ID: (\d+)/);
      // الكلمات المفتاحية التي تدل على أن هذه الرسالة قابلة للرد (إشعار جديد أو لوحة تحكم)
      const isManageMessage = replyToText.includes('من:') || 
                              replyToText.includes('رسالة من:') || 
                              replyToText.includes('إدارة المستخدم:') ||
                              replyToText.includes('اكتب رسالتك');

      if (idMatch && isManageMessage) {
        const targetId = idMatch[1];
        
        try {
          // جلب البيانات من الشيت للتأكد من الاسم بدقة ومحاربة كلمة "المستخدِم"
          const response = await fetch(`${SCRIPT_URL}?action=getUsers`);
          const users = await response.json();
          const targetUser = users.find(u => u.id.toString() === targetId.toString());
          const targetName = targetUser ? targetUser.name : targetId;

          // إرسال رد المالك (نسخ الرسالة كما هي: نص، صورة، فيديو، الخ)
          await ctx.copyMessage(targetId);
          
          return ctx.reply(`✅ تم إرسال ردك للمستخدم: ${targetName}`, getUserControlKeyboard(targetName));
        } catch (e) { 
          return ctx.reply(`❌ فشل الإرسال (تأكد من الـ ID: ${targetId}).`); 
        }
      }

      if (replyToText === PROMPT_BROADCAST) {
        try {
          const response = await fetch(`${SCRIPT_URL}?action=getUsers`);
          const users = await response.json();
          let count = 0;
          for (const u of users) {
             try { await bot.telegram.sendMessage(u.id, `📢 إعلان:\n\n${messageText}`); count++; } catch (err) { }
          }
          return ctx.reply(`✅ تم الإرسال لـ ${count} مستخدم.`);
        } catch (e) { return ctx.reply('❌ فشل البرودكاست.'); }
      }

      let range = '';
      if (replyToText === PROMPT_NAME) range = 'B2';
      else if (replyToText === PROMPT_BIO) range = 'B3';
      else if (replyToText === PROMPT_FB) range = 'B4';
      else if (replyToText === PROMPT_WA) range = 'B5';
      else if (replyToText === PROMPT_IG) range = 'B6';
      else if (replyToText === PROMPT_TG) range = 'B7';

      if (range) {
        try {
          const updateUrl = `${SCRIPT_URL}?range=${encodeURIComponent(range)}&value=${encodeURIComponent(messageText)}`;
          const res = await (await fetch(updateUrl)).text();
          return ctx.reply(res.includes("Success") ? '✅ تم تحديث الموقع!' : '❌ فشل التحديث', adminKeyboard);
        } catch (e) { return ctx.reply('❌ خطأ اتصال بالجدول.'); }
      }
    }
  } else {
    // تجهيز الهيدر الذي سيتم دمجه مع الرسالة
    const header = `📨 من: ${ctx.from.first_name} (ID: ${userId})\n`;

    // إذا كانت الرسالة نصية
    if (ctx.message.text) {
      await bot.telegram.sendMessage(OWNER_ID, header + "\n" + ctx.message.text);
    } 
    // إذا كانت أي نوع آخر (صورة، فيديو، الخ)
    else {
      const originalCaption = ctx.message.caption || '';
      await ctx.copyMessage(OWNER_ID, {
        caption: header + originalCaption
      });
    }
    
    return ctx.reply('🚀 تم إرسال رسالتك، سأرد عليك في القريب العاجل.');
  }
});

module.exports = async (req, res) => {
  try {
    if (req.body) await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } catch (err) { res.status(500).send('Error'); }
};

if (require.main === module) {
  console.log('🤖 جاري التحضير لتشغيل بوت تليجرام...');

  bot.catch((err, ctx) => {
    console.error(`❌ خطأ تليجرام في ${ctx.updateType}:`, err);
  });

  async function startPolling() {
    while (true) {
      try {
        await bot.telegram.deleteWebhook({ drop_pending_updates: true });
        console.log('🚀 تم تشغيل بوت تليجرام بنجاح! البوت يعمل الآن ويستقبل الرسائل...');
        await bot.launch({
          allowedUpdates: ['message', 'callback_query']
        });
        console.log('🛑 تم إيقاف البوت.');
        break;
      } catch (err) {
        const isConflict = err.code === 409 || 
                           (err.response && err.response.error_code === 409) ||
                           (err.message && String(err.message).includes('409'));
        if (isConflict) {
          console.log('⚠️ هناك اتصال آخر بالبوت حالياً، جاري إعادة المحاولة خلال 5 ثوانٍ...');
          await new Promise(r => setTimeout(r, 5000));
        } else {
          console.error('❌ خطأ غير متوقع:', err.message || err);
          await new Promise(r => setTimeout(r, 5000));
        }
      }
    }
  }

  startPolling();

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}


