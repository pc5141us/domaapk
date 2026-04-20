// --- لوحة تحكم متجر دوما APK - الإصدار اليدوي الكامل V10 ---
const botToken = "8791910472:AAFV5-CMq0QuOnPGa8QR-UmxTGOWOjySrds";
const adminId = 682572594; 
const telegramUrl = "https://api.telegram.org/bot" + botToken;

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
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

function doPost(e) {
  var update;
  try { update = JSON.parse(e.postData.contents); } catch(err) { return ContentService.createTextOutput("OK"); }
  
  // الحفظ اليدوي الكامل للبيانات
  if (update.action === "add_manual") {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var id = "APK" + Math.floor(Math.random() * 9000 + 1000);
    
    // استخدام رابط الصورة للأيقونة والغلاف تلقائياً
    var iconUrl = update.icon || "https://cdn-icons-png.flaticon.com/512/1152/1152912.png";
    
    sheet.appendRow([
      id, 
      update.name || "تطبيق جديد", 
      update.desc || "تحميل APK مجاني.", 
      "apps", 
      "بريميوم", 
      "متوافق", 
      iconUrl, 
      iconUrl, // الغلاف هو نفسه الأيقونة تلقائياً
      update.link || "#"
    ]);
    return ContentService.createTextOutput("Success");
  } 
  
  if (update.action === "delete_item") {
    deleteItemById(update.id);
    return ContentService.createTextOutput("Deleted");
  }

  var chatId = (update.message) ? update.message.chat.id : (update.callback_query) ? update.callback_query.message.chat.id : null;
  if (!chatId || chatId != adminId) return ContentService.createTextOutput("OK");

  if (update.callback_query) {
    var data = update.callback_query.data;
    if (data.startsWith("del_") && deleteItemById(data.replace("del_", ""))) sendMessage(chatId, "✅ تم الحذف.");
    UrlFetchApp.fetch(telegramUrl + "/answerCallbackQuery?callback_query_id=" + update.callback_query.id);
  } else if (update.message) {
    var text = update.message.text || "";
    if (text == "/start" || text == "🏠 القائمة الرئيسية") sendMainKeyboard(chatId);
    else if (text == "➕ إضافة APK جديد") sendMessage(chatId, "أرسل اسم التطبيق للبدء...");
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

function sendMainKeyboard(chatId) {
  var keyboard = {
    keyboard: [[{ text: "➕ إضافة APK جديد" }], [{ text: "📋 عرض وحذف المحتوى" }, { text: "🌐 زيارة الموقع" }]],
    resize_keyboard: true
  };
  sendKeyboard(chatId, "🤖 **لوحة تحكم دوما APK V10**", keyboard);
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
