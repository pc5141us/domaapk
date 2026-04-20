// --- لوحة تحكم متجر دوما APK - الإصدار النهائي الشامل V15 ---
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
  try {
    update = JSON.parse(e.postData.contents);
  } catch(err) {
    return ContentService.createTextOutput("Error Parsing JSON");
  }
  
  // 1. معالجة الإضافة اليدوية من البوت
  if (update.action === "add_manual" || update.action === "add_from_vercel") {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var id = "APK" + Math.floor(Math.random() * 9000 + 1000);
    
    var name = update.name || "تطبيق جديد";
    var icon = update.icon || update.image || "https://cdn-icons-png.flaticon.com/512/1152/1152912.png";
    var desc = update.desc || update.description || "تحميل APK مجاني برابط مباشر.";
    var link = update.link || update.previewUrl || "#";
    
    sheet.appendRow([
      id,       // العمود A: ID
      name,     // العمود B: Title
      desc,     // العمود C: Description
      "apps",   // العمود D: Category
      "New",    // العمود E: Tag
      "Safe",   // العمود F: Size/Status
      icon,     // العمود G: Icon
      icon,     // العمود H: Banner (نفس الأيقونة كما طلبت)
      link      // العمود I: Link
    ]);
    SpreadsheetApp.flush();
    return ContentService.createTextOutput("Success");
  } 
  
  // 2. معالجة الحذف
  if (update.action === "delete_item") {
    var idToDel = update.id;
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString().trim() == idToDel.toString().trim()) {
        sheet.deleteRow(i + 1);
        SpreadsheetApp.flush();
        return ContentService.createTextOutput("Deleted");
      }
    }
    return ContentService.createTextOutput("Not Found");
  }

  return ContentService.createTextOutput("OK");
}

function sendMainKeyboard(chatId) {
  var keyboard = {
    keyboard: [[{ text: "➕ إضافة APK جديد" }], [{ text: "📋 إدارة المحتوى" }]],
    resize_keyboard: true
  };
  UrlFetchApp.fetch(telegramUrl + "/sendMessage", {
    method: "post", contentType: "application/json",
    payload: JSON.stringify({ chat_id: chatId, text: "🏠 لوحة التحكم:", reply_markup: JSON.stringify(keyboard) })
  });
}

function sendMessage(chatId, text) {
  UrlFetchApp.fetch(telegramUrl + "/sendMessage?chat_id=" + chatId + "&text=" + encodeURIComponent(text));
}
