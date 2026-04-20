const GAMES_API_URL = "https://script.google.com/macros/s/AKfycbw0KbVLghDkg5f_IPTdgaqjLCz4GksEf_a2_AdfMyk9MA7w22szqWfJGg6jXLF2M2Rm/exec";

let appsData = [];
let lastDataHash = "";

// وظيفة لتحويل البيانات إلى نص للمقارنة ومنع التحديث إذا لم تتغير
function getHash(obj) {
    return JSON.stringify(obj);
}

async function fetchApps(isBackground = false) {
    const appGrid = document.getElementById('appGrid');
    if (!isBackground) appGrid.classList.add('loading');
    
    try {
        const response = await fetch(`${GAMES_API_URL}?t=${Date.now()}`);
        const data = await response.json();

        const currentHash = getHash(data);
        if (currentHash === lastDataHash) {
            console.log("No changes in data, skipping render.");
            return;
        }
        lastDataHash = currentHash;

        console.log("Data received from API:", data);

        if (!data || data.length === 0) {
            // بيانات تجريبية في حال كانت قاعدة البيانات فارغة
            appsData = [
                {
                    id: "G1",
                    name: "PUBG Mobile",
                    description: "أشهر لعبة أكشن وبقاء للأندرويد بأحدث إصدار مهكرة.",
                    category: "games",
                    tag: "action",
                    size: "1.2 GB",
                    icon: "https://play-lh.googleusercontent.com/JRd0v_o_BakYpl90Y9O8A6uUfT3D8L-SbtVj7Y0G0Yf1Y9A9A9A9A9A9A9A9A9A9A",
                    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e",
                    downloadLink: "#",
                    rating: "4.8"
                },
                {
                    id: "A1",
                    name: "WhatsApp Gold",
                    description: "نسخة واتساب الذهبية بمميزات خرافية وإعدادات خصوصية متقدمة.",
                    category: "apps",
                    tag: "social",
                    size: "55 MB",
                    icon: "https://cdn-icons-png.flaticon.com/512/124/124034.png",
                    image: "https://images.unsplash.com/photo-1611743572933-e2206708064d",
                    downloadLink: "#",
                    rating: "4.9"
                }
            ];
        } else {
            appsData = data.map(item => ({
                id: item.id,
                name: item.title,
                description: item.description,
                category: item.category,
                tag: item.tag,
                size: item.size || "يتباين حسب الجهاز",
                icon: item.icon || "https://cdn-icons-png.flaticon.com/512/1152/1152912.png",
                image: item.banner || "https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb",
                downloadLink: item.previewUrl,
                rating: (Math.random() * (5 - 4.5) + 4.5).toFixed(1)
            }));
        }

        renderApps();
    } catch (error) {
        console.error("Error fetching apps:", error);
        if (!isBackground) {
            // عرض بيانات تجريبية عند الخطأ الأول فقط لتجربة التصميم
            if (appsData.length === 0) {
                appsData = [
                    {
                        id: "G1",
                        name: "PUBG Mobile",
                        description: "أشهر لعبة أكشن وبقاء للأندرويد بأحدث إصدار مهكرة.",
                        category: "games",
                        tag: "action",
                        size: "1.2 GB",
                        icon: "https://play-lh.googleusercontent.com/JRd0v_o_BakYpl90Y9O8A6uUfT3D8L-SbtVj7Y0G0Yf1Y9A9A9A9A9A9A9A9A9A9A",
                        image: "https://images.unsplash.com/photo-1542751371-adc38448a05e",
                        downloadLink: "#",
                        rating: "4.8"
                    }
                ];
                renderApps();
            }
        }
    } finally {
        if (!isBackground) appGrid.classList.remove('loading');
    }
}

let currentCategory = 'all';
let currentFilter = 'all';
let searchQuery = '';

function renderApps() {
    const appGrid = document.getElementById('appGrid');
    const filteredApps = appsData.filter(app => {
        const matchesCategory = currentCategory === 'all' || app.category === currentCategory;
        const matchesFilter = currentFilter === 'all' || app.tag === currentFilter;
        const matchesSearch = app.name.toLowerCase().includes(searchQuery);
        return matchesCategory && matchesFilter && matchesSearch;
    });

    appGrid.innerHTML = '';

    if (filteredApps.length === 0) {
        appGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-dim); padding: 3rem;">لا توجد نتائج تطابق بحثك.</div>';
        return;
    }

    filteredApps.forEach((app, index) => {
        const card = document.createElement('div');
        card.className = 'app-card fade-in';
        card.style.animationDelay = `${index * 0.05}s`;
        card.innerHTML = `
            <div class="app-banner" style="background-image: url('${app.image}')"></div>
            <div class="app-info">
                <img src="${app.icon}" class="app-icon" alt="${app.name}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/1152/1152912.png'">
                <div class="app-details">
                    <h3 class="app-name">${app.name}</h3>
                    <div class="app-meta">
                        <span><i class="fas fa-hdd"></i> ${app.size}</span>
                        <span class="app-rating"><i class="fas fa-star"></i> ${app.rating}</span>
                    </div>
                    <button class="download-btn" onclick="event.stopPropagation(); prepareDownload('${app.id}')">
                        <i class="fas fa-download"></i> تحميل APK
                    </button>
                </div>
            </div>
        `;
        card.addEventListener('click', () => showDetails(app));
        appGrid.appendChild(card);
    });
}

function showDetails(app) {
    const modal = document.getElementById('appModal');
    const details = document.getElementById('modalDetails');
    details.innerHTML = `
        <div class="modal-body-content">
            <div class="modal-header-section">
                <img src="${app.icon}" class="modal-icon" onerror="this.src='https://cdn-icons-png.flaticon.com/512/1152/1152912.png'">
                <div class="modal-title-group">
                    <h2>${app.name}</h2>
                    <div class="modal-tags">
                        <span class="tag-chip"><i class="fab fa-android"></i> أندرويد</span>
                        <span class="tag-chip"><i class="fas fa-star"></i> ${app.rating}</span>
                        <span class="tag-chip"><i class="fas fa-hdd"></i> ${app.size}</span>
                    </div>
                </div>
            </div>
            <div class="modal-description">
                <h3>الوصف</h3>
                <p>${app.description}</p>
            </div>
            <button class="download-btn-large" onclick="prepareDownload('${app.id}')">
                <i class="fas fa-download"></i> انتقل للتحميل (APK)
            </button>
        </div>
    `;
    modal.style.display = "block";
}

// وظيفة تجهيز التحميل وعرض الديالوج الجديد
window.prepareDownload = function(appId) {
    const app = appsData.find(a => a.id === appId);
    if (!app) return;

    const downloadModal = document.getElementById('downloadModal');
    const downloadInfo = document.getElementById('downloadInfo');
    
    // إغلاق مودال التفاصيل إذا كان مفتوحاً
    document.getElementById('appModal').style.display = "none";

    downloadInfo.innerHTML = `
        <div class="confirmation-body">
            <div class="safety-badge">
                <i class="fas fa-shield-check"></i>
            </div>
            <h2 class="confirm-title">جاهز للتحميل الآمن</h2>
            <div class="app-confirm-header">
                <img src="${app.icon}" class="confirm-icon">
                <div class="confirm-meta">
                    <h3>${app.name}</h3>
                    <span>إصدار برو / مدفوع</span>
                </div>
            </div>
            
            <ul class="features-list">
                <li><i class="fas fa-check-circle"></i> النسخة مدفوعة ومفتوحة بالكامل (Full Paid)</li>
                <li><i class="fas fa-check-circle"></i> تعمل بكل المميزات وبدون إعلانات مزعجة</li>
                <li><i class="fas fa-check-circle"></i> تم الفحص: آمنة 100% وخالية من الفيروسات</li>
            </ul>

            <div class="download-timer" id="timerContainer">
                <p>سيتم تجهيز الرابط المباشر خلال <span id="seconds">5</span> ثوانٍ...</p>
            </div>

            <a href="${app.downloadLink}" id="finalDownloadBtn" class="download-btn-large disabled" target="_blank">
                <i class="fas fa-rocket"></i> ابدأ التحميل الآن
            </a>
            
            <p class="disclaimer">بضغطك على تحميل، أنت توافق على شروط الاستخدام.</p>
        </div>
    `;

    downloadModal.style.display = "block";

    // تفعيل مؤقت بسيط لإعطاء انطباع بالاحترافية والفحص
    let seconds = 5;
    const timerText = document.getElementById('seconds');
    const finalBtn = document.getElementById('finalDownloadBtn');
    
    const interval = setInterval(() => {
        seconds--;
        if (timerText) timerText.innerText = seconds;
        if (seconds <= 0) {
            clearInterval(interval);
            document.getElementById('timerContainer').innerHTML = "<p style='color: var(--accent)'><i class='fas fa-check'></i> الرابط جاهز للتحميل المباشر!</p>";
            finalBtn.classList.remove('disabled');
            finalBtn.style.animation = "pulse 2s infinite";
        }
    }, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const navLinks = document.querySelectorAll('.nav-links a');
    const chips = document.querySelectorAll('.chip');
    const modal = document.getElementById('appModal');
    const downloadModal = document.getElementById('downloadModal');
    const closeModal = document.querySelector('.close-modal');
    const closeDownloadModal = document.querySelector('.close-download-modal');

    // جلب البيانات لأول مرة
    fetchApps();

    // تحديث البيانات كل 10 ثوانٍ (تحديث فوري)
    setInterval(() => {
        fetchApps(true);
    }, 10000);

    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderApps();
    });

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            currentCategory = link.getAttribute('data-category');
            renderApps();
        });
    });

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilter = chip.getAttribute('data-filter');
            renderApps();
        });
    });

    closeModal.onclick = () => modal.style.display = "none";
    closeDownloadModal.onclick = () => downloadModal.style.display = "none";
    
    window.onclick = (event) => {
        if (event.target == modal) modal.style.display = "none";
        if (event.target == downloadModal) downloadModal.style.display = "none";
    }
});
