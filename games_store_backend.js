// --- لوحة تحكم متجر دوما APK عبر تليجرام ---
const botToken = "8791910472:AAFV5-CMq0QuOnPGa8QR-UmxTGOWOjySrds";
const adminId = 682572594; 
const telegramUrl = "https://api.telegram.org/bot" + botToken;

// 1. استقبال طلبات الموقع (جلب البيانات)
function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var result = [];
  if (data.length > 1) {
    for (var i = 1; i < data.length; i++) {
        result.push({
          id: data[i][0], title: data[i][1], description: data[i][2],
          category: data[i][3], tag: data[i][4], size: data[i][5],
          icon: data[i][6], banner: data[i][7], previewUrl: data[i][8]
        });
    }
  }
  return ContentService.createTextOutput(JSON.stringify(result.reverse())).setMimeType(ContentService.MimeType.JSON);
}

// 2. استقبال رسائل التليجرام
function doPost(e) {
  var update = JSON.parse(e.postData.contents);
  var chatId = (update.message) ? update.message.chat.id : (update.callback_query) ? update.callback_query.message.chat.id : null;
  
  if (!chatId) return;

  if (chatId != adminId) {
    sendMessage(chatId, "⚠️ عذراً، هذا البوت خاص بالأدمن فقط.");
    return;
  }
  
  if (update.callback_query) {
    handleCallback(update.callback_query);
  } else if (update.message) {
    var text = update.message.text || "";
    
    if (text == "/start" || text == "🏠 القائمة الرئيسية") {
      sendMainKeyboard(chatId);
    } else if (text == "➕ إضافة APK جديد") {
      sendMessage(chatId, "أرسل البيانات كالتالي لرفع التطبيق ذكياً:\n\n`/add الاسم رابط_التحميل`\n\n*(سيتم جلب الأيقونة والتصنيف والوصف تلقائياً)*");
    } else if (text == "📋 عرض وحذف المحتوى") {
      listContentForControl(chatId);
    } else if (text == "🌐 زيارة الموقع") {
      sendMessage(chatId, "🔗 يمكنك زيارة متجرك من هنا:\nhttps://domaapk.vercel.app/");
    } else if (text.startsWith("/add")) {
      processSmartAdd(chatId, text);
    } else {
      sendMainKeyboard(chatId);
    }
  }
}

// القائمة الرئيسية (أزرار الكيبورد)
function sendMainKeyboard(chatId) {
  var keyboard = {
    keyboard: [
      [{ text: "➕ إضافة APK جديد" }],
      [{ text: "📋 عرض وحذف المحتوى" }, { text: "🌐 زيارة الموقع" }],
      [{ text: "🏠 القائمة الرئيسية" }]
    ],
    resize_keyboard: true
  };
  sendKeyboard(chatId, "🤖 **لوحة تحكم متجر دوما APK**\nأهلاً بك! اختر ما تريد القيام به من القائمة أدناه:", keyboard);
}

// عرض المحتوى مع أزرار الحذف
function listContentForControl(chatId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    sendMessage(chatId, "📭 لا يوجد محتوى حالياً.");
    return;
  }
  sendMessage(chatId, "🔎 إليك القائمة الحالية، يمكنك الحذف بضغطة زر:");
  for (var i = 1; i < data.length; i++) {
    var id = data[i][0];
    var title = data[i][1];
    var keyboard = {
      inline_keyboard: [[{ text: "🗑 حذف نهائي", callback_data: "del_" + id }]]
    };
    sendKeyboard(chatId, "📦 **" + title + "**\n🆔 ID: " + id, keyboard);
  }
}

// معالجة الحذف
function handleCallback(query) {
  var chatId = query.message.chat.id;
  var data = query.data;
  if (data.startsWith("del_")) {
    var id = data.replace("del_", "");
    deleteItem(chatId, id);
  }
  UrlFetchApp.fetch(telegramUrl + "/answerCallbackQuery?callback_query_id=" + query.id);
}

function deleteItem(chatId, id) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.deleteRow(i + 1);
      sendMessage(chatId, "✅ تم حذف العنصر بنجاح من الموقع.");
      return;
    }
  }
  sendMessage(chatId, "❌ لم يتم العثور على العنصر.");
}

// محرك التصنيف الذكي
function getSmartData(name) {
  var n = name.toLowerCase();
  var res = { category: "apps", tag: "utility", icon: "https://cdn-icons-png.flaticon.com/512/1152/1152912.png", desc: "" };
  var map = {
    "games": {
      "action": ["pubg", "gta", "cod", "war", "battle", "free fire", "counter"],
      "sports": ["fifa", "pes", "football", "racing", "asphalt"],
      "rpg": ["elden", "witcher", "assassin"]
    },
    "apps": {
      "social": ["facebook", "whatsapp", "telegram", "instagram", "tiktok"],
      "design": ["photoshop", "canva", "picsart", "capcut"],
      "utility": ["cleaner", "vpn", "browser", "chrome"]
    }
  };
  var found = false;
  for (var cat in map) {
    for (var tag in map[cat]) {
      if (map[cat][tag].some(k => n.includes(k))) {
        res.category = cat; res.tag = tag; found = true; break;
      }
    }
    if (found) break;
  }
  res.desc = "تحميل " + name + " APK للأندرويد بأحدث إصدار.";
  return res;
}

function processSmartAdd(chatId, text) {
  var parts = text.split(" ");
  if (parts.length < 3) return;
  var name = parts.slice(1, parts.length - 1).join(" ");
  var link = parts[parts.length - 1];
  var smart = getSmartData(name);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var id = "APK" + Math.floor(Math.random() * 10000);
  sheet.appendRow([id, name, smart.desc, smart.category, smart.tag, "أندرويد", smart.icon, "https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb", link]);
  sendMessage(chatId, "✅ **تم الرفع بنجاح!**\n\n🔹 تم تصنيف " + name + " كـ " + smart.tag + " تلقائياً.");
}

// وظائف مساعدة
function sendKeyboard(chatId, text, keyboard) {
  UrlFetchApp.fetch(telegramUrl + "/sendMessage", {
    method: "post", contentType: "application/json",
    payload: JSON.stringify({ chat_id: chatId, text: text, parse_mode: "Markdown", reply_markup: JSON.stringify(keyboard) })
  });
}

function sendMessage(chatId, text) {
  UrlFetchApp.fetch(telegramUrl + "/sendMessage?chat_id=" + chatId + "&text=" + encodeURIComponent(text) + "&parse_mode=Markdown");
}

function setWebhook() {
  var url = "رابط_الـ_Web_App_من_جوجل_هنا";
  UrlFetchApp.fetch(telegramUrl + "/setWebhook?url=" + url);
}
