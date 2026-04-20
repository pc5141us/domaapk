// --- لوحة تحكم متجر دوما APK - نسخة Uptodown الحصرية V5 ---
const botToken = "8791910472:AAFV5-CMq0QuOnPGa8QR-UmxTGOWOjySrds";
const adminId = 682572594; 
const telegramUrl = "https://api.telegram.org/bot" + botToken;

// 1. جلب البيانات للموقع
function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var data = sheet.getDataRange().getValues();
  var result = [];
  if (data.length > 1) {
    for (var i = 1; i < data.length; i++) {
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

function doPost(e) {
  var update;
  try { update = JSON.parse(e.postData.contents); } catch(err) { return ContentService.createTextOutput("OK"); }
  
  if (update.action === "add_from_vercel") {
    processSmartAddManual(update.name, update.link);
    return ContentService.createTextOutput("Success");
  } 
  
  if (update.action === "delete_item") {
    var success = deleteItemById(update.id);
    return ContentService.createTextOutput(success ? "Deleted" : "Not Found");
  }

  var chatId = (update.message) ? update.message.chat.id : (update.callback_query) ? update.callback_query.message.chat.id : null;
  if (!chatId || chatId != adminId) return ContentService.createTextOutput("OK");

  if (update.callback_query) {
    var data = update.callback_query.data;
    if (data.startsWith("del_")) {
      var id = data.replace("del_", "");
      if (deleteItemById(id)) sendMessage(chatId, "✅ تم الحذف بنجاح.");
    }
    UrlFetchApp.fetch(telegramUrl + "/answerCallbackQuery?callback_query_id=" + update.callback_query.id);
  } else if (update.message) {
    var text = update.message.text || "";
    if (text == "/start" || text == "🏠 القائمة الرئيسية") sendMainKeyboard(chatId);
    else if (text == "📋 عرض وحذف المحتوى") listContentForControl(chatId);
    else if (text == "➕ إضافة APK جديد") sendMessage(chatId, "أرسل الاسم والرابط: `/add الاسم الرابط` ");
    else if (text.startsWith("/add")) processSmartAdd(chatId, text);
    else sendMainKeyboard(chatId);
  }
  return ContentService.createTextOutput("OK");
}

function deleteItemById(id) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim() == id.toString().trim()) {
      sheet.deleteRow(i + 1);
      SpreadsheetApp.flush();
      return true;
    }
  }
  return false;
}

// --- محرك Uptodown الحصري ---
function getSmartData(input) {
  var res = { 
    category: "apps", tag: "utility", 
    icon: "https://cdn-icons-png.flaticon.com/512/1152/1152912.png", 
    banner: "https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb",
    desc: "تحميل " + input + " APK للأندرويد برابط مباشر من Uptodown." 
  };
  
  var options = {
    "muteHttpExceptions": true,
    "followRedirects": true,
    "headers": { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
  };

  try {
    // 1. البحث في Uptodown
    var searchUrl = "https://ar.uptodown.com/android/search?q=" + encodeURIComponent(input);
    var searchHtml = UrlFetchApp.fetch(searchUrl, options).getContentText();
    
    // إيجاد رابط أول نتيجة بحث
    var appLinkMatch = searchHtml.match(/href="([^"]+\.ar\.uptodown\.com\/android\/[^"]+)"/) || 
                       searchHtml.match(/href="([^"]+\.uptodown\.com\/android\/[^"]+)"/);
    
    if (appLinkMatch) {
      var appUrl = appLinkMatch[1];
      var appHtml = UrlFetchApp.fetch(appUrl, options).getContentText();
      
      // سحب الأيقونة
      var iconMatch = appHtml.match(/meta property="og:image" content="([^"]+)"/) || 
                      appHtml.match(/<img[^>]+id="detail-app-icon"[^>]+src="([^"]+)"/);
      if (iconMatch) {
        res.icon = iconMatch[1];
        res.banner = iconMatch[1];
      }

      // سحب الوصف من meta description
      var descMatch = appHtml.match(/meta name="description" content="([^"]+)"/);
      if (descMatch) res.desc = descMatch[1].substring(0, 150) + "...";

      // تحديد التصنيف
      if (appHtml.includes("/android/games") || appHtml.toLowerCase().includes("لعبة")) {
        res.category = "games";
      }
    }
  } catch(e) {
    Logger.log("Uptodown Error: " + e);
  }

  return res;
}

function processSmartAdd(chatId, text) {
  var parts = text.split(" ");
  if (parts.length < 3) return sendMessage(chatId, "⚠️ الصيغة: `/add الاسم الرابط` ");
  var name = parts.slice(1, parts.length - 1).join(" ");
  var link = parts[parts.length - 1];
  sendMessage(chatId, "🔍 جاري البحث في Uptodown...");
  var smart = getSmartData(name);
  saveToSheet(name, smart, link);
  sendMessage(chatId, "✅ تم جلب البيانات من Uptodown بنجاح.");
}

function processSmartAddManual(name, link) {
  var smart = getSmartData(name);
  saveToSheet(name, smart, link);
}

function saveToSheet(name, smart, link) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var id = "APK" + Math.floor(Math.random() * 9000 + 1000);
  sheet.appendRow([id, name, smart.desc, smart.category, smart.tag, "متوافق", smart.icon, smart.banner, link]);
}

function sendMainKeyboard(chatId) {
  var keyboard = {
    keyboard: [[{ text: "➕ إضافة APK جديد" }], [{ text: "📋 عرض وحذف المحتوى" }, { text: "🌐 زيارة الموقع" }]],
    resize_keyboard: true
  };
  sendKeyboard(chatId, "🤖 **لوحة تحكم Uptodown الذكية**", keyboard);
}

function listContentForControl(chatId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return sendMessage(chatId, "📭 فارغ.");
  for (var i = 1; i < data.length; i++) {
    var keyboard = { inline_keyboard: [[{ text: "🗑 حذف نهائي", callback_data: "del_" + data[i][0] }]] };
    sendKeyboard(chatId, "📦 " + data[i][1], keyboard);
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
