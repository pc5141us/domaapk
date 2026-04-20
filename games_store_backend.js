// --- لوحة تحكم متجر دوما APK - نسخة Uptodown القناص V6 ---
const botToken = "8791910472:AAFV5-CMq0QuOnPGa8QR-UmxTGOWOjySrds";
const adminId = 682572594; 
const telegramUrl = "https://api.telegram.org/bot" + botToken;

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
      if (deleteItemById(id)) sendMessage(chatId, "✅ تم الحذف.");
    }
    UrlFetchApp.fetch(telegramUrl + "/answerCallbackQuery?callback_query_id=" + update.callback_query.id);
  } else if (update.message) {
    var text = update.message.text || "";
    if (text == "/start" || text == "🏠 القائمة الرئيسية") sendMainKeyboard(chatId);
    else if (text == "➕ إضافة APK جديد") sendMessage(chatId, "أرسل الاسم والرابط: `/add الاسم الرابط` ");
    else if (text.startsWith("/add")) processSmartAdd(chatId, text);
    else if (text == "📋 عرض وحذف المحتوى") listContentForControl(chatId);
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

// --- محرك Uptodown القوي V6 ---
function getSmartData(input) {
  var res = { 
    category: "apps", tag: "utility", 
    icon: "https://cdn-icons-png.flaticon.com/512/1152/1152912.png", 
    banner: "https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb",
    desc: "تحميل " + input + " APK للأندرويد برابط مباشر." 
  };
  
  var options = {
    "muteHttpExceptions": true,
    "followRedirects": true,
    "headers": { 
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      "Accept-Language": "ar,ar-SA;q=0.9,en-US;q=0.8,en;q=0.7"
    }
  };

  try {
    // 1. البحث في Uptodown
    var searchUrl = "https://ar.uptodown.com/android/search?q=" + encodeURIComponent(input);
    var searchHtml = UrlFetchApp.fetch(searchUrl, options).getContentText();
    
    // محاولات متعددة لإيجاد رابط التطبيق (أكثر قوة)
    var appLink = null;
    var links = searchHtml.match(/href="([^"]+uptodown\.com\/android[^"]+)"/g);
    
    if (links) {
      for (var i = 0; i < links.length; i++) {
        var cleanLink = links[i].replace('href="', '').replace('"', '');
        // استبعاد روابط الأقسام والبحث
        if (!cleanLink.includes("/search") && !cleanLink.endsWith("/android") && cleanLink.includes(".uptodown.com/android/")) {
          appLink = cleanLink;
          break;
        }
      }
    }

    if (appLink) {
      var appHtml = UrlFetchApp.fetch(appLink, options).getContentText();
      
      // سحب الأيقونة من og:image (الأكثر دقة)
      var ogIcon = appHtml.match(/meta property="og:image" content="([^"]+)"/);
      if (ogIcon) {
        res.icon = ogIcon[1];
        res.banner = ogIcon[1];
        res.source = "Uptodown";
      } else {
        // محاولة بديلة من السورس
        var fallbackIcon = appHtml.match(/<img[^>]+id="detail-app-icon"[^>]+src="([^"]+)"/);
        if (fallbackIcon) res.icon = fallbackIcon[1];
      }

      var descMatch = appHtml.match(/meta name="description" content="([^"]+)"/);
      if (descMatch) res.desc = descMatch[1].substring(0, 150) + "...";

      if (appHtml.includes("/android/games") || appHtml.toLowerCase().includes("لعبة")) {
        res.category = "games";
      }
    }
  } catch(e) {
    Logger.log("V6 Error: " + e);
  }

  return res;
}

function processSmartAdd(chatId, text) {
  var parts = text.split(" ");
  if (parts.length < 3) return sendMessage(chatId, "⚠️ استخدم: `/add الاسم الرابط` ");
  var name = parts.slice(1, parts.length - 1).join(" ");
  var link = parts[parts.length - 1];
  sendMessage(chatId, "🎯 جاري قنص الأيقونات من Uptodown...");
  var smart = getSmartData(name);
  saveToSheet(name, smart, link);
  sendMessage(chatId, "✅ تم جلب البيانات بنجاح " + (smart.source ? "من Uptodown" : "(رابط افتراضي)"));
}

function processSmartAddManual(name, link) {
  var smart = getSmartData(name);
  saveToSheet(name, smart, link);
}

function saveToSheet(name, smart, link) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var id = "APK" + Math.floor(Math.random() * 9000 + 1000);
  sheet.appendRow([id, name, smart.desc, smart.category, "مطور", "متوافق", smart.icon, smart.banner, link]);
}

function sendMainKeyboard(chatId) {
  var keyboard = {
    keyboard: [[{ text: "➕ إضافة APK جديد" }], [{ text: "📋 عرض وحذف المحتوى" }, { text: "🌐 زيارة الموقع" }]],
    resize_keyboard: true
  };
  sendKeyboard(chatId, "🎮 **تحكم Uptodown V6**", keyboard);
}

function listContentForControl(chatId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return sendMessage(chatId, "📭 فارغ.");
  for (var i = 1; i < data.length; i++) {
    var keyboard = { inline_keyboard: [[{ text: "🗑 حذف", callback_data: "del_" + data[i][0] }]] };
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
