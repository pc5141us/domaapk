const { bot } = require("../src/bot");

module.exports = async (req, res) => {
  try {
    const [botInfo, webhookInfo] = await Promise.all([
      bot.api.getMe(),
      bot.api.getWebhookInfo(),
    ]);

    const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>صانع ومقترن الويب هوك | ${botInfo.first_name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Cairo', sans-serif;
        }
        body {
            background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
            color: #f8fafc;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: rgba(30, 41, 59, 0.7);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            width: 100%;
            max-width: 680px;
            padding: 36px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .header {
            text-align: center;
            margin-bottom: 28px;
        }
        .badge {
            display: inline-block;
            background: rgba(99, 102, 241, 0.2);
            color: #818cf8;
            padding: 6px 16px;
            border-radius: 9999px;
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 12px;
            border: 1px solid rgba(129, 140, 248, 0.3);
        }
        h1 {
            font-size: 26px;
            font-weight: 800;
            color: #ffffff;
            margin-bottom: 8px;
        }
        p.subtitle {
            color: #94a3b8;
            font-size: 15px;
        }
        .card {
            background: rgba(15, 23, 42, 0.6);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 20px;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .card-title {
            font-size: 16px;
            font-weight: 700;
            color: #cbd5e1;
            margin-bottom: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            font-size: 14px;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .label {
            color: #94a3b8;
        }
        .value {
            font-weight: 600;
            color: #f1f5f9;
            word-break: break-all;
            direction: ltr;
            text-align: left;
        }
        .status-active {
            color: #4ade80;
            font-weight: 700;
        }
        .btn-group {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 24px;
        }
        .btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 14px;
            border-radius: 14px;
            font-size: 15px;
            font-weight: 700;
            text-decoration: none;
            transition: all 0.2s ease;
        }
        .btn-primary {
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            color: white;
            box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);
        }
        .btn-secondary {
            background: rgba(51, 65, 85, 0.8);
            color: #e2e8f0;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <span class="badge">🤖 Telegram Multi-Bot Webhook Factory</span>
            <h1>${botInfo.first_name} (@${botInfo.username})</h1>
            <p class="subtitle">صانع ومقترن الويب هوك الشامل لبوتات تليجرام الأخرى</p>
        </div>

        <div class="card">
            <div class="card-title">✨ وظيفة البوت الرئيسية</div>
            <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                يتيح لك هذا البوت ربط وتأكيد وتحديد رابط الويب هوك لأي بوت تليجرام آخر عن طريق تزويد التوكن الخاص به ورابط السيرفر أو رفع الملف البرمجي الخاص به مباشرة داخل المحادثة.
            </p>
        </div>

        <div class="card">
            <div class="card-title">🤖 حالة البوت الحالي الخادم</div>
            <div class="info-row">
                <span class="label">معرف البوت (ID):</span>
                <span class="value">${botInfo.id}</span>
            </div>
            <div class="info-row">
                <span class="label">رابط الويب هوك الخادم:</span>
                <span class="value">${webhookInfo.url || "غير مفعّل"}</span>
            </div>
            <div class="info-row">
                <span class="label">حالة المحرك:</span>
                <span class="value status-active">جاهز للاستخدام 100% ✅</span>
            </div>
        </div>

        <div class="btn-group">
            <a href="https://t.me/${botInfo.username}" target="_blank" class="btn btn-primary">💬 ربط بوت جديد في تليجرام</a>
            <a href="/api/set-webhook" class="btn btn-secondary">⚡ تحديث ويب هوك البوت الرئيسي</a>
        </div>
    </div>
</body>
</html>
    `;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch (error) {
    return res.status(500).send(`<h1>حدث خطأ: ${error.message}</h1>`);
  }
};
