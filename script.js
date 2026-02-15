document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Snowfall Effect
    function createSnowflakes() {
        const snowflakeCount = 20; // Number of snowflakes

        for (let i = 0; i < snowflakeCount; i++) {
            const snowflake = document.createElement('div');
            snowflake.classList.add('snowflake');
            snowflake.textContent = '❄';
            snowflake.style.left = Math.random() * 100 + 'vw';
            snowflake.style.animationDuration = Math.random() * 3 + 10 + 's'; // Fall speed between 10-13s
            snowflake.style.opacity = Math.random();
            snowflake.style.fontSize = Math.random() * 20 + 10 + 'px';

            document.body.appendChild(snowflake);
        }
    }

    // Check if it's winter season (optional logic, but we'll force it for now based on user request)
    createSnowflakes();
    addholidayDecorations();

    // Holiday Decorations Injection
    function addholidayDecorations() {
        // Lights Strand
        const lightsStrand = document.createElement('div');
        lightsStrand.className = 'lights-strand';
        // Create 30 lights
        for (let i = 0; i < 30; i++) {
            const bulb = document.createElement('div');
            bulb.className = 'light-bulb';
            lightsStrand.appendChild(bulb);
        }
        document.body.prepend(lightsStrand);

        // Corner Decors
        const tl = document.createElement('div');
        tl.className = 'corner-decor corner-top-left';
        tl.innerHTML = '<div style="position:absolute; top:40px; left:40px; font-size:30px;">🎀</div>';
        document.body.appendChild(tl);

        const tr = document.createElement('div');
        tr.className = 'corner-decor corner-top-right';
        tr.innerHTML = '<div style="position:absolute; top:40px; right:40px; font-size:30px;">🔔</div>';
        document.body.appendChild(tr);
    }

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

                // 1. Grouping by Month Year (e.g., "2026-yil Fevral")
                const groupKey = formatMonthYear(dateObj);
                if (groupKey !== lastGroup) {
                    const groupHeader = document.createElement('div');
                    groupHeader.className = 'news-group-header';
                    groupHeader.innerHTML = `<h3><i class="far fa-calendar-check"></i> ${groupKey}</h3>`;
                    container.appendChild(groupHeader);
                    lastGroup = groupKey;
                }

                const card = document.createElement('div');
                card.className = 'card news-card-interactive';
                // Remove toggleNewsExpand to use Modal instead, or keep it but clicking read-more opens modal
                // card.onclick = () => toggleNewsExpand(card); 

                // 2. Format Date (e.g., "15-fevral, 2026")
                const dateStr = formatUzbekDate(dateObj);

                let imageHtml = '';
                if (item.image) {
                    imageHtml = `
                        <div class="news-image-container">
                             <img src="${item.image}" alt="Yangilik rasmi" loading="lazy">
                        </div>
                    `;
                }

                const fullText = item.text || '';
                const shortText = fullText.length > 120 ? fullText.substring(0, 120) + '...' : fullText;

                card.innerHTML = `
                    ${imageHtml}
                    <div class="card-content">
                        <span class="card-date"><i class="far fa-clock"></i> ${dateStr}</span>
                        <p class="news-text">${shortText}</p>
                        <button class="read-more-btn" onclick="openNewsModal('${item.id.replace(/'/g, "\\'")}')">
                            Batafsil o'qish <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                `;

                container.appendChild(card);
            });

        } catch (error) {
            console.error('Error loading news:', error);
            container.innerHTML = '<p class="error-msg" style="text-align: center; grid-column: 1/-1;">Yangiliklarni yuklashda xatolik yuz berdi.</p>';
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
            <a href="https://t.me/${news.id.split('/')[0]}/${news.id.split('/')[1]}" target="_blank" class="telegram-link-btn">
                <i class="fab fa-telegram"></i> Telegramda ko'rish
            </a>
        </div>
    `;

    modal.style.display = 'flex';
}

function closeNewsModal() {
    const modal = document.getElementById('news-detail-modal');
    if (modal) modal.style.display = 'none';
}
});

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

