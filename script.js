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
                        <button class="btn btn-outline-primary btn-sm mt-auto align-self-start" onclick="openModal('${item.id.replace(/'/g, "\\'")}')">
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

// ==================== CUSTOM MODAL LOGIC (VARIANT 2) ====================

function openModal(newsId) {
    const news = window.globalNewsData.find(n => n.id === newsId);
    if (!news) return;

    // Elementlarni olish
    const modal = document.getElementById('customModal');
    const overlay = document.getElementById('modalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const modalHeading = document.getElementById('modalHeading');
    const modalImage = document.getElementById('modalImage');
    const modalContent = document.getElementById('modalContent');
    const modalHashtags = document.getElementById('modalHashtags');

    // Extract hashtags and clean text
    const hashtags = news.text.match(/#[a-zA-Z0-9_]+/g) || [];
    const cleanText = news.text.replace(/#[a-zA-Z0-9_]+/g, '').trim();

    // Extract title
    let newsTitle = 'Yangilik Tafsilotlari';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = news.html || news.text;
    const firstBold = tempDiv.querySelector('b');
    if (firstBold) {
        newsTitle = firstBold.innerText;
    } else if (cleanText) {
        const lines = cleanText.split('\n').filter(l => l.trim().length > 0);
        if (lines.length > 0) newsTitle = lines[0].substring(0, 100);
    }

    let contentHtml = (news.html || news.text.replace(/\n/g, '<br>')).replace(/#[a-zA-Z0-9_]+/g, '');

    // Kontentni o'rnatish
    modalTitle.textContent = 'Yangilik Tafsilotlari';
    modalHeading.textContent = newsTitle;
    modalImage.src = news.image || '';
    modalImage.alt = newsTitle;
    modalContent.innerHTML = contentHtml;

    // Hashteglarni qo'shish
    if (hashtags.length > 0) {
        modalHashtags.innerHTML = hashtags.map(tag =>
            `<a href="#" class="modal-hashtag" onclick="event.preventDefault();">${tag}</a>`
        ).join('');
        modalHashtags.style.display = 'flex';
    } else {
        modalHashtags.style.display = 'none';
    }

    // Modalni ko'rsatish
    overlay.classList.add('active');
    modal.classList.add('active');

    // Body scroll ni to'xtatish
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('customModal');
    const overlay = document.getElementById('modalOverlay');

    if (modal) modal.classList.remove('active');
    if (overlay) overlay.classList.remove('active');

    // Body scroll ni qaytarish
    document.body.style.overflow = '';
}

// ESC tugmasi bilan yopish
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});

// Global functions for News Interaction
function toggleNewsExpand(card) {
    document.querySelectorAll('.news-card-interactive').forEach(c => {
        if (c !== card) c.classList.remove('expanded');
    });
    card.classList.toggle('expanded');
}

function openImageModal(imgSrc) {
    let modal = document.getElementById('global-image-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'global-image-modal';
        modal.className = 'image-modal';
        modal.innerHTML = `
            <span class="close-btn" style="position:absolute; top:20px; right:30px; color:white; font-size:40px; cursor:pointer;" onclick="closeImageModal()">&times;</span>
            <img id="modal-image-content" src="" style="max-width:90%; max-height:90%;">
        `;
        document.body.appendChild(modal);
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

