/**
 * ملف إعدادات إعلانات جوجل أدسنس - متجر دوما APK
 * يمكنك وضع أكواد الإعلانات الخاصة بك هنا في الأماكن المخصصة
 */

const ADS_CONFIG = {
    // 1. إعلان أعلى الصفحة (هيدر) - يفضل أن يكون بانر أفقي
    headerAd: `
        <!-- ضع كود إعلان الهيدر هنا -->
        <div style="width: 100%; height: 90px; background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; border-radius: 8px; color: #666; font-size: 12px; border: 1px dashed #333;">
            إعلان هيدر (728x90)
        </div>
    `,

    // 2. إعلان وسط المحتوى (بين الفلتر وقائمة التطبيقات)
    midContentAd: `
        <!-- ضع كود إعلان وسط المحتوى هنا -->
        <div style="width: 100%; height: 250px; background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; border-radius: 12px; color: #666; font-size: 12px; border: 1px dashed #333; margin: 20px 0;">
            إعلان وسط المحتوى (Native Ad)
        </div>
    `,

    // 3. إعلان أسفل الصفحة (فوتر)
    footerAd: `
        <!-- ضع كود إعلان الفوتر هنا -->
        <div style="width: 100%; height: 90px; background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; border-radius: 8px; color: #666; font-size: 12px; border: 1px dashed #333;">
            إعلان فوتر (Banner)
        </div>
    `,

    // 4. إعلان داخل نافذة التحميل (يظهر بجانب العداد)
    modalAd: `
        <!-- ضع كود إعلان المودال هنا -->
        <div style="width: 100%; height: 200px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; border-radius: 12px; color: #888; font-size: 11px; border: 1px dashed #444; margin-top: 15px;">
            إعلان مساحة التحميل (Square/Native)
        </div>
    `
};

// وظيفة حقن الإعلانات في الموقع تلقائياً
function injectAds() {
    try {
        if (document.getElementById('ad-header')) {
            document.getElementById('ad-header').innerHTML = ADS_CONFIG.headerAd;
        }
        if (document.getElementById('ad-mid')) {
            document.getElementById('ad-mid').innerHTML = ADS_CONFIG.midContentAd;
        }
        if (document.getElementById('ad-footer')) {
            document.getElementById('ad-footer').innerHTML = ADS_CONFIG.footerAd;
        }
        // إعلانات المودال يتم حقنها عند فتح المودال في script.js
    } catch (e) {
        console.error("Ads injection failed", e);
    }
}

// تنفيذ الحقن عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', injectAds);
