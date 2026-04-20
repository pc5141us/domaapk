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
  
  // التعامل مع الطلبات المباشرة من Vercel (ليس من تليجرام)
  if (update.action === "add_from_vercel") {
    var smart = getSmartData(update.name);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var id = "APK" + Math.floor(Math.random() * 10000);
    sheet.appendRow([id, update.name, smart.desc, smart.category, smart.tag, "أندرويد", smart.icon, "https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb", update.link]);
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
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

// محرك البحث والربط مع متجر Google Play
function getSmartData(name) {
  var res = { 
    category: "apps", 
    tag: "utility", 
    icon: "https://cdn-icons-png.flaticon.com/512/1152/1152912.png", 
    banner: "https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb",
    desc: "تحميل " + name + " APK للأندرويد بأحدث إصدار." 
  };
  
  try {
    // 1. البحث عن التطبيق في جوجل بلاي
    var searchUrl = "https://play.google.com/store/search?q=" + encodeURIComponent(name) + "&c=apps";
    var response = UrlFetchApp.fetch(searchUrl, {muteHttpExceptions: true});
    var html = response.getContentText();
    
    // 2. استخراج معرف التطبيق (Package ID) لأول نتيجة
    var idMatch = html.match(/\/store\/apps\/details\?id=([a-zA-Z0-9._]+)/);
    if (idMatch && idMatch[1]) {
      var appId = idMatch[1];
      var appUrl = "https://play.google.com/store/apps/details?id=" + appId + "&hl=ar";
      var appResponse = UrlFetchApp.fetch(appUrl);
      var appHtml = appResponse.getContentText();
      
      // 3. استخراج الأيقونة
      var iconMatch = appHtml.match(/<img[^>]+src="([^"]+)"[^>]+alt="Logo image"/i) || 
                      appHtml.match(/<img[^>]+alt="Logo image"[^>]+src="([^"]+)"/i) ||
                      appHtml.match(/src="([^"]+)"[^>]+class="T7X9Cc"/);
      if (iconMatch) res.icon = iconMatch[1].replace(/=s[0-9]+.*/, "=s512"); // جودة عالية

      // 4. استخراج صورة الغلاف (Banner)
      var bannerMatch = appHtml.match(/<img[^>]+src="([^"]+)"[^>]+alt="Feature graphic"/i) ||
                        appHtml.match(/<img[^>]+src="([^"]+)"[^>]+alt="Screenshot image"/i);
      if (bannerMatch) res.banner = bannerMatch[1].replace(/=[whs][0-9]+.*/, "=w1200");

      // 5. استخراج الوصف المختصر
      var descMatch = appHtml.match(/meta name="description" content="([^"]+)"/);
      if (descMatch) res.desc = descMatch[1].substring(0, 150) + "...";
      
      // 6. تحديد التصنيف ذكياً (إذا وجدنا كلمة Game في المحتوى)
      if (appHtml.toLowerCase().includes("game") || appHtml.includes("لعبة")) {
        res.category = "games";
      }
    }

    // تصنيف إضافي بناءً على الاسم لزيادة الدقة
    var n = name.toLowerCase();
    var tags = { "action": ["pubg", "war", "battle"], "social": ["facebook", "whatsapp", "social"], "sports": ["fifa", "pes", "football"] };
    for (var tag in tags) {
      if (tags[tag].some(k => n.includes(k))) { res.tag = tag; break; }
    }

  } catch(e) {
    // في حال الخطأ نستخدم البيانات التبؤية البسيطة
  }

  return res;
}

function processSmartAdd(chatId, text) {
  var parts = text.split(" ");
  if (parts.length < 3) return;
  var name = parts.slice(1, parts.length - 1).join(" ");
  var link = parts[parts.length - 1];
  
  sendMessage(chatId, "🔎 جاري فحص متجر Play وتجهيز الأيقونات لـ *" + name + "*...");
  
  var smart = getSmartData(name);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var id = "APK" + Math.floor(Math.random() * 10000);
  
  // حفظ البيانات الحقيقية
  sheet.appendRow([id, name, smart.desc, smart.category, smart.tag, "أندرويد", smart.icon, smart.banner, link]);
  
  sendMessage(chatId, "✅ **تم الرفع بنجاح من المتجر!**\n\n🖼 تم جلب الأيقونة والغلاف الأصلي بنجاح.");
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
