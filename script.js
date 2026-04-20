const GAMES_API_URL = "https://script.google.com/macros/s/AKfycbwKw2kHthblC0gsMC0BQnEzITu1u1MkjR7B7smjq4pGNzuj4IRGUDGK1EiktSILdnjl/exec";

let appsData = [];

async function fetchApps() {
    const appGrid = document.getElementById('appGrid');
    try {
        const response = await fetch(GAMES_API_URL);
        const data = await response.json();

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

        window.dispatchEvent(new Event('dataLoaded'));
    } catch (error) {
        console.error("Error fetching apps:", error);
        appGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem;">⚠️ لا يوجد اتصال مع قاعدة البيانات، يرجى الرفع عبر البوت أولاً.</div>';
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
