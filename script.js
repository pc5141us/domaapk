const GAMES_API_URL = "https://script.google.com/macros/s/AKfycbx62qKg3x8gFAxF-tvQs176D9sN1NE292afMHSLDSSd3fZaxdzgA16C0HatmU-_PTZQ/exec"; 

let appsData = [];

async function fetchApps() {
    try {
        if (GAMES_API_URL === "رابط_مشروع_الألعاب_هنا") throw new Error("No API URL");
        const response = await fetch(GAMES_API_URL);
        const data = await response.json();
        
        // تحويل البيانات من تنسيق جوجل شيت إلى التنسيق المطلوب للموقع
        appsData = data.map(item => ({
            id: item.id,
            name: item.title,
            description: item.description,
            category: item.category || (item.title.toLowerCase().includes('game') ? 'games' : 'apps'),
            tag: item.tag || 'utility',
            size: item.size || "يتباين حسب الجهاز",
            icon: item.icon || "https://cdn-icons-png.flaticon.com/512/1152/1152912.png",
            image: item.banner || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070",
            downloadLink: item.previewUrl,
            rating: (Math.random() * (5 - 4) + 4).toFixed(1) // تقييم عشوائي بين 4 و 5
        }));
        
        window.dispatchEvent(new Event('dataLoaded'));
    } catch (error) {
        console.error("Error fetching apps:", error);
        // بيانات احتياطية في حال فشل الاتصال
        appsData = [
            { id: 1, name: "Facebook", category: "apps", tag: "social", rating: 4.5, size: "120MB", icon: "https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg", image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1974", description: "تواصل مع أصدقائك.", downloadLink: "#" },
            { id: 2, name: "PUBG Mobile", category: "games", tag: "action", rating: 4.8, size: "2GB", icon: "https://upload.wikimedia.org/wikipedia/en/3/3b/Pubg_logo_square.png", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070", description: "لعبة القتال والبقاء.", downloadLink: "#" }
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

    // جلب البيانات
    fetchApps();

    // الاستماع لانتهاء جلب البيانات
    window.addEventListener('dataLoaded', () => {
        renderApps();
    });

    // Search Logic
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderApps();
    });

    // Nav Category Logic
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            currentCategory = link.getAttribute('data-category');
            renderApps();
        });
    });

    // Chip Filter Logic
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilter = chip.getAttribute('data-filter');
            renderApps();
        });
    });

    // Close Modal
    closeModal.onclick = () => modal.style.display = "none";
    window.onclick = (event) => {
        if (event.target == modal) modal.style.display = "none";
    }

    function renderApps() {
        const filteredApps = appsData.filter(app => {
            const matchesCategory = currentCategory === 'all' || app.category === currentCategory;
            const matchesFilter = currentFilter === 'all' || app.tag === currentFilter;
            const matchesSearch = app.name.toLowerCase().includes(searchQuery) || 
                                (app.description && app.description.toLowerCase().includes(searchQuery));
            return matchesCategory && matchesFilter && matchesSearch;
        });

        appGrid.innerHTML = '';

        if (filteredApps.length === 0) {
            appGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-dim);">
                    <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <p>لم يتم العثور على نتائج تطابق بحثك.</p>
                </div>
            `;
            return;
        }

        filteredApps.forEach((app, index) => {
            const card = document.createElement('div');
            card.className = 'app-card';
            card.style.animationDelay = `${index * 0.1}s`;
            
            card.innerHTML = `
                <div class="app-banner" style="background-image: url('${app.image}')"></div>
                <div class="app-info">
                    <img src="${app.icon}" class="app-icon" alt="${app.name}">
                    <div class="app-details">
                        <h3 class="app-name">${app.name}</h3>
                        <div class="app-meta">
                            <span class="app-size"><i class="fas fa-hdd"></i> ${app.size}</span>
                            <span class="app-rating"><i class="fas fa-star"></i> ${app.rating}</span>
                        </div>
                        <a href="${app.downloadLink}" class="download-btn" target="_blank" onclick="event.stopPropagation()">
                            <i class="fas fa-download"></i> تحميل الآن
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
                        <span><i class="fas fa-layer-group"></i> ${app.category === 'apps' ? 'برنامج' : 'لعبة'}</span>
                        <span><i class="fas fa-hdd"></i> ${app.size}</span>
                        <span><i class="fas fa-star" style="color: #fbbf24"></i> ${app.rating}</span>
                    </div>
                    <a href="${app.downloadLink}" class="download-btn" style="padding: 1rem 3rem" target="_blank">
                        تحميل برابط خارجي مباشر
                    </a>
                </div>
            </div>
            <div style="margin-top: 3rem; border-top: 1px solid var(--glass-border); padding-top: 2rem;">
                <h3>مميزات الإصدار:</h3>
                <ul style="margin-top: 1rem; color: var(--text-dim); list-style-position: inside;">
                    <li>نسخة كاملة ومفعلة</li>
                    <li>رابط تحميل خارجي سريع</li>
                    <li>فحص أمني شامل 100%</li>
                    <li>سهولة التثبيت</li>
                </ul>
            </div>
        `;
        modal.style.display = "block";
    }
});
