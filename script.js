const GAMES_API_URL = "https://script.google.com/macros/s/AKfycbw0KbVLghDkg5f_IPTdgaqjLCz4GksEf_a2_AdfMyk9MA7w22szqWfJGg6jXLF2M2Rm/exec";

let appsData = [];

async function fetchApps() {
    const appGrid = document.getElementById('appGrid');
    try {
        // إضافة معلمة لمنع المتصفح من تخزين النتيجة (Cache Busting)
        const response = await fetch(`${GAMES_API_URL}?t=${Date.now()}`);
        const data = await response.json();

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

        window.dispatchEvent(new Event('dataLoaded'));
    } catch (error) {
        console.error("Error fetching apps:", error);
        // عرض بيانات تجريبية حتى عند الخطأ لتجربة التصميم
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
        window.dispatchEvent(new Event('dataLoaded'));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const appGrid = document.getElementById('appGrid');
    const searchInput = document.getElementById('searchInput');
    const navLinks = document.querySelectorAll('.nav-links a');
    const chips = document.querySelectorAll('.chip');
    const modal = document.getElementById('appModal');
    const closeModal = document.querySelector('.close-modal');

    let currentCategory = 'all';
    let currentFilter = 'all';
    let searchQuery = '';

    fetchApps();

    window.addEventListener('dataLoaded', () => {
        renderApps();
    });

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
    window.onclick = (event) => {
        if (event.target == modal) modal.style.display = "none";
    }

    function renderApps() {
        const filteredApps = appsData.filter(app => {
            const matchesCategory = currentCategory === 'all' || app.category === currentCategory;
            const matchesFilter = currentFilter === 'all' || app.tag === currentFilter;
            const matchesSearch = app.name.toLowerCase().includes(searchQuery);
            return matchesCategory && matchesFilter && matchesSearch;
        });

        appGrid.innerHTML = '';

        if (filteredApps.length === 0) {
            appGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-dim);">لا توجد نتائج.</div>';
            return;
        }

        filteredApps.forEach((app, index) => {
            const card = document.createElement('div');
            card.className = 'app-card';
            card.innerHTML = `
                <div class="app-banner" style="background-image: url('${app.image}')"></div>
                <div class="app-info">
                    <img src="${app.icon}" class="app-icon" alt="${app.name}">
                    <div class="app-details">
                        <h3 class="app-name">${app.name}</h3>
                        <div class="app-meta">
                            <span><i class="fas fa-hdd"></i> ${app.size}</span>
                            <span class="app-rating"><i class="fas fa-star"></i> ${app.rating}</span>
                        </div>
                        <a href="${app.downloadLink}" class="download-btn" target="_blank" onclick="event.stopPropagation()">
                            <i class="fas fa-download"></i> تحميل APK
                        </a>
                    </div>
                </div>
            `;
            card.addEventListener('click', () => showDetails(app));
            appGrid.appendChild(card);
        });
    }

    function showDetails(app) {
        const details = document.getElementById('modalDetails');
        details.innerHTML = `
            <div style="display: flex; gap: 2rem; align-items: start; margin-top: 2rem;">
                <img src="${app.icon}" style="width: 120px; border-radius: 20px;">
                <div>
                    <h2 style="font-size: 2rem; margin-bottom: 0.5rem;">${app.name}</h2>
                    <p style="color: var(--text-dim); margin-bottom: 1rem;">${app.description}</p>
                    <div style="display: flex; gap: 2rem; margin-bottom: 2rem;">
                        <span><i class="fab fa-android"></i> أندرويد</span>
                        <span><i class="fas fa-star" style="color: #fbbf24"></i> ${app.rating}</span>
                    </div>
                    <a href="${app.downloadLink}" class="download-btn" style="padding: 1rem 3rem" target="_blank">
                        تحميل ملف APK مباشر
                    </a>
                </div>
            </div>
        `;
        modal.style.display = "block";
    }
});
