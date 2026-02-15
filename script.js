document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Winter/Holiday code removed as per user request


    // Contact Form AJAX Handler & Modal Logic
    const contactForm = document.querySelector('form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // 1. Generate Reference Number
            const msgId = Math.floor(Math.random() * 10000) + 1000;
            const hiddenInput = document.getElementById('hiddenRefNum');
            if (hiddenInput) {
                hiddenInput.value = msgId;
            }

            // 2. Prepare Data (now includes the hidden ID)
            const data = new FormData(form);
            const submitBtn = form.querySelector('button');
            const originalBtnText = submitBtn.innerHTML;

            submitBtn.innerHTML = 'Yuborilmoqda... <i class="fas fa-spinner fa-spin"></i>';
            submitBtn.disabled = true;

            try {
                const response = await fetch(form.action, {
                    method: form.method,
                    body: data,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    form.reset();
                    showSuccessModal(msgId); // Pass the SAME ID to the modal
                } else {
                    alert("Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
                }
            } catch (error) {
                alert("Internet bilan bog'liq muammo bo'lishi mumkin.");
            } finally {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

    function showSuccessModal(msgId) {
        const modal = document.getElementById('success-modal');
        const msgElement = document.getElementById('modal-message');
        const progressBar = document.getElementById('modal-progress');
        const closeBtn = document.querySelector('.close-btn');

        // Date generation
        const date = new Date();
        const dateString = date.toLocaleDateString('uz-UZ');
        const timeString = date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });

        msgElement.innerHTML = `Sizning <b>#${msgId}</b>-raqamli murojaat xabaringiz <b>${dateString} ${timeString}</b> da maktab ma'muriyatiga muvaffaqiyatli yuborildi.`;

        modal.style.display = 'flex';

        // 60 seconds timer animation
        progressBar.style.width = '100%';
        progressBar.style.transition = 'none'; // reset
        void progressBar.offsetWidth; // force reflow

        progressBar.style.transition = 'width 60s linear';
        progressBar.style.width = '0%';

        const timer = setTimeout(() => {
            closeModal();
        }, 60000);

        const closeModal = () => {
            clearTimeout(timer);
            modal.style.display = 'none';
        };

        closeBtn.onclick = closeModal;

        window.onclick = (event) => {
            if (event.target == modal) {
                closeModal();
            }
        };
    }


    // Load News
    loadNews();

    async function loadNews() {
        const container = document.getElementById('news-container');
        try {
            // Add cache-busting timestamp to prevent caching old news
            const response = await fetch('news.json?t=' + new Date().getTime());
            if (!response.ok) throw new Error('News file not found');

            const news = await response.json();

            // Store globally for modal access
            window.globalNewsData = news;

            if (news.length === 0) {
                container.innerHTML = '<p class="no-news" style="text-align: center; grid-column: 1/-1;">Hozircha yangiliklar yo\'q.</p>';
                return;
            }

            container.innerHTML = ''; // Clear loading spinner

            let lastGroup = '';

            news.forEach(item => {
                const dateObj = new Date(item.date);

                // 1. Grouping by Month Year
                const groupKey = formatMonthYear(dateObj);
                if (groupKey !== lastGroup) {
                    const groupHeader = document.createElement('div');
                    groupHeader.className = 'col-12 mt-4 mb-2';
                    groupHeader.innerHTML = `<h3 class="border-bottom border-primary pb-2 text-primary fs-5 text-uppercase"><i class="far fa-calendar-check"></i> ${groupKey}</h3>`;
                    container.appendChild(groupHeader);
                    lastGroup = groupKey;
                }

                const col = document.createElement('div');
                col.className = 'col-md-6 col-lg-4';

                const card = document.createElement('div');
                card.className = 'card h-100 shadow-sm border-0 news-card-interactive';

                // 2. Format Date
                const dateStr = formatUzbekDate(dateObj);

                let imageHtml = '';
                if (item.image) {
                    imageHtml = `
                         <img src="${item.image}" class="card-img-top" alt="Yangilik rasmi" loading="lazy" style="height: 200px; object-fit: cover;">
                    `;
                }

                const fullText = item.text || '';
                const shortText = fullText.length > 120 ? fullText.substring(0, 120) + '...' : fullText;

                card.innerHTML = `
                    ${imageHtml}
                    <div class="card-body d-flex flex-column">
                        <span class="text-muted small mb-2"><i class="far fa-clock"></i> ${dateStr}</span>
                        <p class="card-text flex-grow-1">${shortText}</p>
                        <button class="btn btn-outline-primary btn-sm mt-auto align-self-start" onclick="openNewsModal('${item.id.replace(/'/g, "\\'")}')">
                            Batafsil o'qish <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                `;

                col.appendChild(card);
                container.appendChild(col);
            });

        } catch (error) {
            console.error('Error loading news:', error);
            container.innerHTML = `<div class="col-12"><div class="alert alert-danger">Xatolik yuz berdi: ${error.message}</div></div>`;
            // alert removed to be less intrusive
        }
    }
});

// Helper: Custom Uzbek Date Formatter
function formatUzbekDate(date) {
    const months = [
        "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
        "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day}-${month.toLowerCase()}, ${year}`;
}

function formatMonthYear(date) {
    const months = [
        "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
        "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"
    ];
    return `${date.getFullYear()}-yil ${months[date.getMonth()]}`;
}

// News Modal Logic
function openNewsModal(newsId) {
    const news = window.globalNewsData.find(n => n.id === newsId);
    if (!news) return;

    // Check if modal exists
    let modal = document.getElementById('news-detail-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'news-detail-modal';
        modal.className = 'modal news-detail-modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-content news-modal-content">
                <span class="close-btn" onclick="closeNewsModal()">&times;</span>
                <div id="news-modal-body"></div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.onclick = (e) => {
            if (e.target === modal) closeNewsModal();
        }
    }

    const modalBody = document.getElementById('news-modal-body');
    const dateStr = formatUzbekDate(new Date(news.date));

    // Prefer HTML content if available (from scraper), else plain text
    let content = news.html || news.text.replace(/\n/g, '<br>');

    let imageHtml = '';
    if (news.image) {
        imageHtml = `<img src="${news.image}" class="news-modal-img" alt="Yangilik rasmi">`;
    }

    modalBody.innerHTML = `
        ${imageHtml}
        <div class="news-modal-meta">
            <span class="news-modal-date"><i class="far fa-calendar-alt"></i> ${dateStr}</span>
        </div>
        <div class="news-modal-text">
            ${content}
        </div>
        <div class="news-modal-footer">
            <a href="https://t.me/${news.id.split('/')[0] || 'channel'}/${news.id.split('/')[1] || ''}" target="_blank" class="telegram-link-btn">
                <i class="fab fa-telegram"></i> Telegramda ko'rish
            </a>
        </div>
    `;

    modal.style.display = 'flex';
    console.log('Modal opened for:', newsId);
}

function closeNewsModal() {
    const modal = document.getElementById('news-detail-modal');
    if (modal) modal.style.display = 'none';
}

// Global functions for News Interaction (outside DOMContentLoaded to be accessible by inline onclick)
function toggleNewsExpand(card) {
    // Collapse others
    document.querySelectorAll('.news-card-interactive').forEach(c => {
        if (c !== card) c.classList.remove('expanded');
    });
    // Toggle current
    card.classList.toggle('expanded');
}

function openImageModal(imgSrc) {
    // Check if modal exists
    let modal = document.getElementById('global-image-modal');
    if (!modal) {
        // Create modal dynamically if not exists
        modal = document.createElement('div');
        modal.id = 'global-image-modal';
        modal.className = 'image-modal';
        modal.innerHTML = `
            <span class="close-btn" style="position:absolute; top:20px; right:30px; color:white; font-size:40px; cursor:pointer;" onclick="closeImageModal()">&times;</span>
            <img id="modal-image-content" src="">
        `;
        document.body.appendChild(modal);
        // Close on background click
        modal.onclick = (e) => {
            if (e.target === modal) closeImageModal();
        }
    }

    document.getElementById('modal-image-content').src = imgSrc;
    modal.style.display = 'flex';
}

function closeImageModal() {
    const modal = document.getElementById('global-image-modal');
    if (modal) modal.style.display = 'none';
}

// Theme Manager Logic
const ThemeManager = {
    // CDN Map for Themes
    themes: {
        'default': 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
        'cerulean': 'https://cdn.jsdelivr.net/npm/bootswatch@5.3.2/dist/cerulean/bootstrap.min.css',
        'cosmo': 'https://cdn.jsdelivr.net/npm/bootswatch@5.3.2/dist/cosmo/bootstrap.min.css',
        'darkly': 'https://cdn.jsdelivr.net/npm/bootswatch@5.3.2/dist/darkly/bootstrap.min.css',
        'united': 'https://cdn.jsdelivr.net/npm/bootswatch@5.3.2/dist/united/bootstrap.min.css',
        'spring': 'https://cdn.jsdelivr.net/npm/bootswatch@5.3.2/dist/minty/bootstrap.min.css' // Minty is a good base for Spring
    },

    animationInterval: null,

    init() {
        const savedTheme = localStorage.getItem('selectedTheme') || 'default';
        this.setTheme(savedTheme, false); // false = don't save again on init
        this.setupSpringInteractions();
    },

    setTheme(themeName, save = true) {
        const themeUrl = this.themes[themeName];
        if (!themeUrl) return;

        // Swap CSS
        const themeLink = document.getElementById('theme-css');
        if (themeLink) {
            themeLink.href = themeUrl;
        }

        // Set Data Attribute for Custom Styles (like Spring)
        document.documentElement.setAttribute('data-theme', themeName);

        // Handle Animations
        if (themeName === 'spring') {
            this.startSpringAnimations();
        } else {
            this.stopSpringAnimations();
        }

        if (save) {
            localStorage.setItem('selectedTheme', themeName);
        }
    },

    startSpringAnimations() {
        if (this.animationInterval) return;

        // Natural White Blossoms and Vibrant Green Leaves (from Image)
        const plantElements = [
            // White Blossom with Yellow Center
            '<svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="10" fill="white" opacity="0.9"/><circle cx="12" cy="12" r="3" fill="#ffd700"/><path d="M12,2 Q15,5 12,8 Q9,5 12,2" fill="white" opacity="0.5" transform="rotate(0 12 12)"/><path d="M12,2 Q15,5 12,8 Q9,5 12,2" fill="white" opacity="0.5" transform="rotate(72 12 12)"/><path d="M12,2 Q15,5 12,8 Q9,5 12,2" fill="white" opacity="0.5" transform="rotate(144 12 12)"/><path d="M12,2 Q15,5 12,8 Q9,5 12,2" fill="white" opacity="0.5" transform="rotate(216 12 12)"/><path d="M12,2 Q15,5 12,8 Q9,5 12,2" fill="white" opacity="0.5" transform="rotate(288 12 12)"/></svg>',
            // Vibrant Spring Leaf
            '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8.17,20C12.14,20 17,14.9 17,8V8M16,2C16,2 14,2.1 12,3C12,3 9,4 9,8C9,8 9.1,9.7 10,11C10,11 12,14 16,14C16,14 20,14 22,10C22,10 22,2 16,2Z" fill="#a6ce39"/></svg>',
            // Soft Light Blossom
            '<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="8" fill="white" opacity="0.8"/><circle cx="12" cy="12" r="2" fill="#ffd700"/></svg>'
        ];

        this.animationInterval = setInterval(() => {
            if (document.documentElement.getAttribute('data-theme') !== 'spring') return;

            const el = document.createElement('div');
            el.className = 'spring-flower';
            el.innerHTML = plantElements[Math.floor(Math.random() * plantElements.length)];
            el.style.left = Math.random() * 100 + 'vw';
            el.style.animationDuration = Math.random() * 4 + 6 + 's'; // 6-10s fall (slower, more graceful)
            document.body.appendChild(el);

            setTimeout(() => el.remove(), 10000);
        }, 1200); // Slower spawn rate
    },

    stopSpringAnimations() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
        document.querySelectorAll('.spring-flower').forEach(el => el.remove());
    },

    setupSpringInteractions() {
        document.addEventListener('mousemove', (e) => {
            if (document.documentElement.getAttribute('data-theme') !== 'spring') return;

            // Significantly reduced frequency (3% chance per move)
            if (Math.random() > 0.03) return;

            const trail = document.createElement('div');
            trail.className = 'mouse-trail';
            // White Blossom SVG for mouse trail
            trail.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12"><circle cx="12" cy="12" r="10" fill="white" opacity="0.7"/><circle cx="12" cy="12" r="3" fill="#ffd700" opacity="0.8"/></svg>';
            trail.style.left = (e.clientX - 7) + 'px';
            trail.style.top = (e.clientY - 7) + 'px';
            document.body.appendChild(trail);

            setTimeout(() => trail.remove(), 1500);
        });
    }
};

// Start ThemeManager
ThemeManager.init();

