// --- لوحة تحكم متجر دوما APK المتقدمة (Google Play + Uptodown) ---
const botToken = "8791910472:AAFV5-CMq0QuOnPGa8QR-UmxTGOWOjySrds";
const adminId = 682572594; 
const telegramUrl = "https://api.telegram.org/bot" + botToken;

// 1. جلب البيانات للموقع
function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
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

// 2. استقبال الطلبات
function doPost(e) {
  var update;
  try {
    update = JSON.parse(e.postData.contents);
  } catch(err) {
    return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
  }
  
  if (update.action === "add_from_vercel") {
    processSmartAddManual(update.name, update.link);
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  } 
  
  // معالجة التليجرام
  var chatId = (update.message) ? update.message.chat.id : (update.callback_query) ? update.callback_query.message.chat.id : null;
  if (!chatId || chatId != adminId) return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);

  if (update.callback_query) {
    handleCallback(update.callback_query);
  } else if (update.message) {
    var text = update.message.text || "";
    if (text == "/start" || text == "🏠 القائمة الرئيسية") sendMainKeyboard(chatId);
    else if (text == "➕ إضافة APK جديد") sendMessage(chatId, "أرسل: `/add الاسم الرابط` لجلب البيانات تلقائياً.");
    else if (text == "📋 عرض وحذف المحتوى") listContentForControl(chatId);
    else if (text.startsWith("/add")) processSmartAdd(chatId, text);
    else sendMainKeyboard(chatId);
  }
  return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
}

// --- محرك البحث الذكي المزدوج (Google Play + Uptodown) ---
function getSmartData(input) {
  var res = { 
    category: "apps", tag: "utility", 
    icon: "https://cdn-icons-png.flaticon.com/512/1152/1152912.png", 
    banner: "https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb",
    desc: "تحميل " + input + " APK للأندرويد بأحدث إصدار." 
  };
  
  var options = {
    "muteHttpExceptions": true,
    "followRedirects": true,
    "headers": { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
  };

  // محاولة 1: Google Play
  try {
    var searchUrl = "https://play.google.com/store/search?q=" + encodeURIComponent(input) + "&c=apps&hl=ar";
    var html = UrlFetchApp.fetch(searchUrl, options).getContentText();
    var idMatch = html.match(/\/store\/apps\/details\?id=([a-zA-Z0-9._]+)/);
    
    if (idMatch) {
      var appHtml = UrlFetchApp.fetch("https://play.google.com/store/apps/details?id=" + idMatch[1] + "&hl=ar", options).getContentText();
      var icon = appHtml.match(/meta property="og:image" content="([^"]+)"/);
      if (icon) {
        res.icon = icon[1].split("=")[0] + "=s512";
        res.banner = res.icon.split("=")[0] + "=w1200-h630-p";
        res.source = "Google Play";
      }
      var desc = appHtml.match(/meta name="description" content="([^"]+)"/);
      if (desc) res.desc = desc[1].substring(0, 150) + "...";
      if (appHtml.includes("game") || appHtml.includes("لعبة")) res.category = "games";
      return res;
    }
  } catch(e) {}

  // محاولة 2: Uptodown (Fallback)
  try {
    var uptodownSearch = "https://ar.uptodown.com/android/search?q=" + encodeURIComponent(input);
    var uHtml = UrlFetchApp.fetch(uptodownSearch, options).getContentText();
    var uMatch = uHtml.match(/href="([^"]+\.ar\.uptodown\.com\/android)"/);
    
    if (uMatch) {
      var detailHtml = UrlFetchApp.fetch(uMatch[1], options).getContentText();
      var uIcon = detailHtml.match(/<img[^>]+id="detail-app-icon"[^>]+src="([^"]+)"/) || detailHtml.match(/meta property="og:image" content="([^"]+)"/);
      if (uIcon) {
        res.icon = uIcon[1];
        res.banner = uIcon[1];
        res.source = "Uptodown";
      }
      var uDesc = detailHtml.match(/<div class="description"[^>]*>([\s\S]*?)<\/div>/);
      if (uDesc) res.desc = uDesc[1].replace(/<[^>]*>/g, "").substring(0, 150) + "...";
    }
  } catch(e) {}

  return res;
}

function processSmartAdd(chatId, text) {
  var parts = text.split(" ");
  if (parts.length < 3) return sendMessage(chatId, "⚠️ الصيغة: `/add الاسم الرابط` ");
  
  var name = parts.slice(1, parts.length - 1).join(" ");
  var link = parts[parts.length - 1];
  
  sendMessage(chatId, "🔍 جاري البحث في Google Play و Uptodown...");
  var smart = getSmartData(name);
  saveToSheet(name, smart, link);
  sendMessage(chatId, "✅ **تمت الإضافة!**\nالمصدر: " + (smart.source || "افتراضي") + "\nتم جلب الأيقونة والوصف تلقائياً.");
}

function processSmartAddManual(name, link) {
  var smart = getSmartData(name);
  saveToSheet(name, smart, link);
}

function saveToSheet(name, smart, link) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var id = "APK" + Math.floor(Math.random() * 9000 + 1000);
  sheet.appendRow([id, name, smart.desc, smart.category, smart.tag, "متوافق", smart.icon, smart.banner, link]);
}

// --- وظائف التليجرام الأخرى ---
function sendMainKeyboard(chatId) {
  var keyboard = {
    keyboard: [[{ text: "➕ إضافة APK جديد" }], [{ text: "📋 عرض وحذف المحتوى" }, { text: "🌐 زيارة الموقع" }]],
    resize_keyboard: true
  };
  sendKeyboard(chatId, "🤖 **لوحة تحكم ذكية**\nاختر من القائمة:", keyboard);
}

function listContentForControl(chatId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return sendMessage(chatId, "📭 لا يوجد محتوى.");
  for (var i = 1; i < data.length; i++) {
    var keyboard = { inline_keyboard: [[{ text: "🗑 حذف", callback_data: "del_" + data[i][0] }]] };
    sendKeyboard(chatId, "📦 " + data[i][1], keyboard);
  }
}

function handleCallback(query) {
  var id = query.data.replace("del_", "");
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == id) { sheet.deleteRow(i + 1); break; }
  }
  UrlFetchApp.fetch(telegramUrl + "/answerCallbackQuery?callback_query_id=" + query.id);
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
