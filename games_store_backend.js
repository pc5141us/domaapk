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
        // التحقق من صحة الصورة، إذا كانت فارغة نضع صورة افتراضية
        var icon = data[i][6] || "https://cdn-icons-png.flaticon.com/512/1152/1152912.png";
        var banner = data[i][7] || "https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb";
        
        result.push({
          id: data[i][0], title: data[i][1], description: data[i][2],
          category: data[i][3], tag: data[i][4], size: data[i][5],
          icon: icon, banner: banner, previewUrl: data[i][8]
        });
    }
  }
  return ContentService.createTextOutput(JSON.stringify(result.reverse())).setMimeType(ContentService.MimeType.JSON);
}

// 2. استقبال رسائل التليجرام والعمليات
function doPost(e) {
  var update;
  try {
    update = JSON.parse(e.postData.contents);
  } catch(err) {
    return ContentService.createTextOutput("Invalid JSON").setMimeType(ContentService.MimeType.TEXT);
  }
  
  // التعامل مع الطلبات المباشرة من Vercel
  if (update.action === "add_from_vercel") {
    var smart = getSmartData(update.name);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var id = "APK" + Math.floor(Math.random() * 9000 + 1000);
    sheet.appendRow([id, update.name, smart.desc, smart.category, smart.tag, "أندرويد متوافق", smart.icon, smart.banner, update.link]);
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  } 
  
  else if (update.action === "delete_item") {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
        if (data[i][0] == update.id) {
            sheet.deleteRow(i + 1);
            return ContentService.createTextOutput("Deleted").setMimeType(ContentService.MimeType.TEXT);
        }
    }
    return ContentService.createTextOutput("Not Found").setMimeType(ContentService.MimeType.TEXT);
  } 
  
  else if (update.action === "update_link") {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
        if (data[i][0] == update.id) {
            sheet.getRange(i + 1, 9).setValue(update.link);
            return ContentService.createTextOutput("Updated").setMimeType(ContentService.MimeType.TEXT);
        }
    }
  }

  var chatId = (update.message) ? update.message.chat.id : (update.callback_query) ? update.callback_query.message.chat.id : null;
  if (!chatId) return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);

  if (chatId != adminId) {
    sendMessage(chatId, "⚠️ عذراً، هذا البوت خاص بالأدمن فقط.");
    return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
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
  return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
}

// محرك سحب البيانات الذكي من Google Play
function getSmartData(name) {
  var res = { 
    category: "apps", 
    tag: "utility", 
    icon: "https://cdn-icons-png.flaticon.com/512/1152/1152912.png", 
    banner: "https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb",
    desc: "تحميل " + name + " APK للأندرويد بأحدث إصدار ومميزات مفتوحة." 
  };
  
  var options = {
    "muteHttpExceptions": true,
    "followRedirects": true,
    "headers": {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    }
  };

  try {
    var searchUrl = "https://play.google.com/store/search?q=" + encodeURIComponent(name) + "&c=apps&hl=ar";
    var response = UrlFetchApp.fetch(searchUrl, options);
    var html = response.getContentText();
    
    // محاولتين لإيجاد المعرف
    var idMatch = html.match(/\[\["\/store\/apps\/details\?id=([a-zA-Z0-9._]+)"/) || html.match(/\/store\/apps\/details\?id=([a-zA-Z0-9._]+)/);
    
    if (idMatch && idMatch[1]) {
      var appId = idMatch[1];
      var appUrl = "https://play.google.com/store/apps/details?id=" + appId + "&hl=ar";
      var appResponse = UrlFetchApp.fetch(appUrl, options);
      var appHtml = appResponse.getContentText();
      
      // أيقونة التطبيق
      var iconMatch = appHtml.match(/meta property="og:image" content="([^"]+)"/) || appHtml.match(/<img src="([^"]+)"[^>]+alt="Logo"/);
      if (iconMatch) {
         res.icon = iconMatch[1].split("=")[0] + "=s512";
      }

      // البانر
      var featureMatch = appHtml.match(/https:\/\/play-lh.googleusercontent.com\/([^"= ]+)=w[0-9]+-h[0-9]+/) || appHtml.match(/<img[^>]+src="([^"]+)"[^>]+alt="Cover image"/);
      if (featureMatch) {
        res.banner = featureMatch[0].split("=")[0] + "=w1200-h630-p";
      } else if (iconMatch) {
        res.banner = res.icon.split("=")[0] + "=w1200-h630-p";
      }

      // الوصف
      var descMatch = appHtml.match(/meta name="description" content="([^"]+)"/);
      if (descMatch) res.desc = descMatch[1].substring(0, 150) + "...";
      
      if (appHtml.toLowerCase().includes("game") || appHtml.includes("لعبة")) {
        res.category = "games";
        res.tag = "action";
      }
    }
  } catch(e) {
    Logger.log("Error logic: " + e);
  }

  return res;
}

function processSmartAdd(chatId, text) {
  var parts = text.split(" ");
  if (parts.length < 3) {
    sendMessage(chatId, "⚠️ الصيغة خاطئة، استخدم:\n`/add الاسم رابط_التحميل` ");
    return;
  }
  var name = parts.slice(1, parts.length - 1).join(" ");
  var link = parts[parts.length - 1];
  
  sendMessage(chatId, "🚀 جاري فحص متجر Play لجلب أيقونة وبنير *" + name + "*...");
  var smart = getSmartData(name);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var id = "APK" + Math.floor(Math.random() * 9000 + 1000);
  
  sheet.appendRow([id, name, smart.desc, smart.category, smart.tag, "أندرويد متوافق", smart.icon, smart.banner, link]);
  sendMessage(chatId, "✅ **تم بنجاح!**\nتم جلب الأيقونة والمعلومات الأصلية.\n\n🖼 الموقع سيقوم بالتحديث تلقائياً خلال ثوانٍ.");
}

function sendMainKeyboard(chatId) {
  var keyboard = {
    keyboard: [
      [{ text: "➕ إضافة APK جديد" }],
      [{ text: "📋 عرض وحذف المحتوى" }, { text: "🌐 زيارة الموقع" }],
      [{ text: "🏠 القائمة الرئيسية" }]
    ],
    resize_keyboard: true
  };
  sendKeyboard(chatId, "🤖 **لوحة تحكم متجر دوما APK**\nأهلاً بك! استخدم الأزرار للتحكم بالموقع:", keyboard);
}

function listContentForControl(chatId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    sendMessage(chatId, "📭 لا يوجد محتوى حالياً.");
    return;
  }
  sendMessage(chatId, "📋 قائمة التطبيقات الموجودة حالياً:");
  for (var i = 1; i < data.length; i++) {
    var id = data[i][0];
    var title = data[i][1];
    var keyboard = {
      inline_keyboard: [[{ text: "🗑 حذف نهائي", callback_data: "del_" + id }]]
    };
    sendKeyboard(chatId, "📦 **" + title + "**\n🆔: " + id, keyboard);
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
      sendMessage(chatId, "✅ تم حذف العنصر من الموقع.");
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
