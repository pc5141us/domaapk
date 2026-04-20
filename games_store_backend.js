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
  
  // التعامل مع الطلبات المباشرة من Vercel
  if (update.action === "add_from_vercel") {
    var smart = getSmartData(update.name);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var id = "APK" + Math.floor(Math.random() * 10000);
    sheet.appendRow([id, update.name, smart.desc, smart.category, smart.tag, "أندرويد متوافق", smart.icon, smart.banner, update.link]);
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  } else if (update.action === "delete_item") {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
        if (data[i][0] == update.id) {
            sheet.deleteRow(i + 1);
            return ContentService.createTextOutput("Deleted").setMimeType(ContentService.MimeType.TEXT);
        }
    }
  }

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

// محرك البحث والربط مع متجر Google Play المحسن
function getSmartData(name) {
  var res = { 
    category: "apps", 
    tag: "utility", 
    icon: "https://cdn-icons-png.flaticon.com/512/1152/1152912.png", 
    banner: "https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb",
    desc: "تحميل " + name + " APK للأندرويد بأحدث إصدار." 
  };
  
  var options = {
    "muteHttpExceptions": true,
    "headers": {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
  };

  try {
    var searchUrl = "https://play.google.com/store/search?q=" + encodeURIComponent(name) + "&c=apps&hl=ar";
    var response = UrlFetchApp.fetch(searchUrl, options);
    var html = response.getContentText();
    var idMatch = html.match(/\/store\/apps\/details\?id=([a-zA-Z0-9._]+)/);
    
    if (idMatch && idMatch[1]) {
      var appId = idMatch[1];
      var appUrl = "https://play.google.com/store/apps/details?id=" + appId + "&hl=ar";
      var appResponse = UrlFetchApp.fetch(appUrl, options);
      var appHtml = appResponse.getContentText();
      
      var iconMatch = appHtml.match(/meta property="og:image" content="([^"]+)"/);
      if (iconMatch) res.icon = iconMatch[1].replace(/=s[0-9]+.*/, "=s512");

      var featureMatch = appHtml.match(/https:\/\/play-lh.googleusercontent.com\/([^"= ]+)=w[0-9]+-h[0-9]+/);
      if (featureMatch) res.banner = featureMatch[0].replace(/=w[0-9]+-h[0-9]+.*/, "=w1200");
      else if (iconMatch) res.banner = iconMatch[1].replace(/=s[0-9]+.*/, "=w1200-h630-p");

      var descMatch = appHtml.match(/meta name="description" content="([^"]+)"/);
      if (descMatch) res.desc = descMatch[1].substring(0, 150) + "...";
      
      if (appHtml.toLowerCase().includes("game") || appHtml.includes("لعبة")) {
        res.category = "games";
      }
    }
  } catch(e) { }

  return res;
}

function processSmartAdd(chatId, text) {
  var parts = text.split(" ");
  if (parts.length < 3) return;
  var name = parts.slice(1, parts.length - 1).join(" ");
  var link = parts[parts.length - 1];
  
  sendMessage(chatId, "🚀 جاري الاتصال بمتجر Play لجلب البيانات الأصلية لـ *" + name + "*...");
  var smart = getSmartData(name);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var id = "APK" + Math.floor(Math.random() * 10000);
  sheet.appendRow([id, name, smart.desc, smart.category, "أكشن", "أندرويد متوافق", smart.icon, smart.banner, link]);
  sendMessage(chatId, "✅ **تم جلب البيانات الأصلية!**\n\n🖼 يمكنك الآن التحقق من الموقع لرؤية الأيقونة والبناير.");
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

function listContentForControl(chatId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    sendMessage(chatId, "📭 لا يوجد محتوى حالياً.");
    return;
  }
  for (var i = 1; i < data.length; i++) {
    var id = data[i][0];
    var title = data[i][1];
    var keyboard = {
      inline_keyboard: [[{ text: "🗑 حذف نهائي", callback_data: "del_" + id }]]
    };
    sendKeyboard(chatId, "📦 **" + title + "**\n🆔 ID: " + id, keyboard);
  }
}

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
}

function sendKeyboard(chatId, text, keyboard) {
  UrlFetchApp.fetch(telegramUrl + "/sendMessage", {
    method: "post", contentType: "application/json",
    payload: JSON.stringify({ chat_id: chatId, text: text, parse_mode: "Markdown", reply_markup: JSON.stringify(keyboard) })
  });
}

function sendMessage(chatId, text) {
  UrlFetchApp.fetch(telegramUrl + "/sendMessage?chat_id=" + chatId + "&text=" + encodeURIComponent(text) + "&parse_mode=Markdown");
}
