// ==================== ADMIN CONFIG ====================
// Sayt ko'chirilganda faqat shu yerdagi nomni o'zgartiring:
const MANAGEMENT_CONFIG = {
    googleAccount: "[mshmaktab1]";
    admin_telegram: "[@komiljon_99]"
};

async function loadFooter() {
    const footer = document.querySelector('footer');
    if (!footer) return;

    try {
        const response = await fetch('footer.html');
        if (!response.ok) throw new Error('Footer not found');
        const html = await response.json(); // Wait, footer.html is text
    } catch (e) { }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Load Shared Footer
    const footerContainer = document.querySelector('footer');
    if (footerContainer) {
        try {
            const resp = await fetch('footer.html');
            const html = await resp.text();
            footerContainer.innerHTML = html;

            // Re-apply management ID and visitor counter after footer loads
            const mgmtEl = document.getElementById('mgmtId');
            if (mgmtEl) mgmtEl.textContent = MANAGEMENT_CONFIG.googleAccount;
            updateVisitorCounter();
        } catch (e) {
            console.error("Shared footer error:", e);
        }
    }

    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Winter/Holiday code removed as per user request

    window.toggleArchive = function () {
        const sidebar = document.getElementById('archiveSidebar');
        const btn = document.querySelector('.btn-archive-toggle');
        const icon = document.getElementById('archiveToggleIcon');

        if (sidebar.style.display === 'none') {
            sidebar.style.display = 'block';
            btn.classList.add('active');
            sidebar.classList.add('animate-slide-down');
        } else {
            sidebar.style.display = 'none';
            btn.classList.remove('active');
        }
    };


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

    // Visitor Counter
    updateVisitorCounter();

    // Premium Calendar Widget
    initPremiumCalendarWidget();

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

            // Generate Dynamic Navigation
            const navContainer = document.getElementById('dynamicDateNav');
            if (navContainer) navContainer.style.display = 'flex'; // Restore visibility

            generateArchiveNavigation(news);

            let lastGroup = '';
            let currentSwiperWrapperDiv = null;

            news.forEach(item => {
                const dateObj = new Date(item.date);
                const dateStr = formatUzbekDate(dateObj);
                const groupKey = formatMonthYear(dateObj);

                // Initialize a new group if month/year changes
                if (groupKey !== lastGroup) {
                    const safeGroupId = 'news-group-' + groupKey.replace(/\s+/g, '-').toLowerCase();

                    // Create group header
                    const groupHeader = document.createElement('div');
                    groupHeader.className = 'col-12 mt-4 mb-2 d-flex justify-content-between align-items-end flex-wrap gap-2';
                    groupHeader.innerHTML = `
                        <h3 class="border-bottom border-primary pb-2 text-primary fs-5 text-uppercase mb-0"><i class="far fa-calendar-check"></i> <span class="group-title">${groupKey}</span></h3>
                        <button class="btn btn-sm btn-outline-primary rounded-pill view-all-btn fw-bold" data-target="${safeGroupId}">Barchasi <i class="fas fa-th-large ms-1"></i></button>
                    `;
                    container.appendChild(groupHeader);
                    lastGroup = groupKey;

                    // Create Swiper container for THIS month
                    const swiperContainerHTML = document.createElement('div');
                    swiperContainerHTML.className = 'swiper newsSwiper col-12 position-relative';
                    swiperContainerHTML.id = safeGroupId;
                    swiperContainerHTML.style.padding = '10px 40px 30px';

                    const swiperWrapperHTML = document.createElement('div');
                    swiperWrapperHTML.className = 'swiper-wrapper';

                    const swiperPaginationHTML = document.createElement('div');
                    swiperPaginationHTML.className = 'swiper-pagination mt-3 position-relative';
                    swiperPaginationHTML.style.bottom = '0';

                    const swiperBtnPrev = document.createElement('div');
                    swiperBtnPrev.className = 'swiper-button-prev custom-swiper-btn';

                    const swiperBtnNext = document.createElement('div');
                    swiperBtnNext.className = 'swiper-button-next custom-swiper-btn';

                    swiperContainerHTML.appendChild(swiperWrapperHTML);
                    swiperContainerHTML.appendChild(swiperPaginationHTML);
                    swiperContainerHTML.appendChild(swiperBtnPrev);
                    swiperContainerHTML.appendChild(swiperBtnNext);
                    container.appendChild(swiperContainerHTML);

                    currentSwiperWrapperDiv = swiperWrapperHTML;
                }

                const slide = document.createElement('div');
                slide.className = 'swiper-slide h-auto'; // Ensure equal card heights

                const card = document.createElement('div');
                card.className = 'card h-100 shadow-sm border-0 news-card-interactive';

                let mediaHtml = '';
                if (item.video) {
                    mediaHtml = `
                        <div class="position-relative" style="height: 200px; background: #000;">
                            <video src="${item.video}" class="card-img-top w-100 h-100 news-video-preview" style="object-fit: cover;" muted loop playsinline></video>
                            <div class="position-absolute top-50 start-50 translate-middle">
                                <i class="fas fa-play-circle fa-3x text-white opacity-75"></i>
                            </div>
                        </div>
                    `;
                }
                else if (item.image) {
                    mediaHtml = `
                         <img src="${item.image}" class="card-img-top" alt="Yangilik rasmi" loading="lazy" style="height: 200px; object-fit: cover;">
                    `;
                }
                else {
                    mediaHtml = `
                         <div class="card-img-top news-placeholder d-flex align-items-center justify-content-center" style="height: 200px; background: var(--primary-gradient); opacity: 0.8;">
                            <i class="fas fa-school fa-4x text-white opacity-25"></i>
                         </div>
                    `;
                }

                const fullText = item.text || '';
                const shortText = fullText.length > 120 ? fullText.substring(0, 120) + '...' : fullText;

                const highlightedShortText = shortText.split(/(<[^>]+>)/g).map(part => {
                    if (part && part.startsWith('<')) return part;
                    return part.replace(/(#[^\s#.,!?;:()\[\]{}'"]+)/g, '<span class="inline-hashtag">$1</span>');
                }).join('');

                card.innerHTML = `
                    ${mediaHtml}
                    <div class="card-body d-flex flex-column" style="padding: 1.5rem;">
                        <span class="text-muted small mb-2"><i class="far fa-clock"></i> ${dateStr}</span>
                        <p class="card-text flex-grow-1" style="line-height: 1.6; margin-bottom: 0.75rem;">${highlightedShortText}</p>
                        
                        <button class="btn btn-outline-primary btn-sm mt-3 align-self-start" style="border-radius: 20px; padding: 5px 15px;" onclick="openModal('${item.id.replace(/'/g, "\\'")}')">
                            Batafsil o'qish <i class="fas fa-arrow-right ms-1"></i>
                        </button>
                    </div>
                `;

                slide.appendChild(card);
                if (currentSwiperWrapperDiv) {
                    currentSwiperWrapperDiv.appendChild(slide);
                }
            });

            // Initialize Multiple Swipers (one for each group)
            if (window.Swiper) {
                const swiperContainers = document.querySelectorAll(".newsSwiper");
                swiperContainers.forEach(container => {
                    // Start Swiper
                    new Swiper(container, {
                        slidesPerView: 1,
                        spaceBetween: 25,
                        loop: false,
                        grabCursor: true,
                        autoplay: {
                            delay: 4000,
                            disableOnInteraction: false,
                            pauseOnMouseEnter: true,
                        },
                        pagination: {
                            el: container.querySelector('.swiper-pagination'),
                            clickable: true,
                            dynamicBullets: true,
                        },
                        navigation: {
                            nextEl: container.querySelector('.swiper-button-next'),
                            prevEl: container.querySelector('.swiper-button-prev'),
                        },
                        breakpoints: {
                            768: { slidesPerView: 2 },
                            1024: { slidesPerView: 3 }
                        }
                    });
                });

                // Attach View All handlers
                document.querySelectorAll('.view-all-btn').forEach(btn => {
                    btn.addEventListener('click', function () {
                        const targetId = this.getAttribute('data-target');
                        const swiperContainer = document.getElementById(targetId);

                        if (swiperContainer.classList.contains('grid-view')) {
                            // Revert to swiper
                            swiperContainer.classList.remove('grid-view');
                            this.innerHTML = `Barchasi <i class="fas fa-th-large ms-1"></i>`;

                            // Re-enable swiper
                            if (swiperContainer.swiper) {
                                swiperContainer.swiper.autoplay.start();
                                swiperContainer.swiper.update();
                            }
                        } else {
                            // Switch to grid view
                            swiperContainer.classList.add('grid-view');
                            this.innerHTML = `Yig'ish <i class="fas fa-compress-arrows-alt ms-1"></i>`;

                            // Stop swiper animation temporarily
                            if (swiperContainer.swiper) {
                                swiperContainer.swiper.autoplay.stop();
                                swiperContainer.swiper.setTranslate(0);
                            }
                        }
                    });
                });
            }

        } catch (error) {
            console.error('Error loading news:', error);
            let errorMessage = `Xatolik yuz berdi: ${error.message}`;

            // Helpful message for local file users
            if (window.location.protocol === 'file:') {
                errorMessage = `
                    <div class="alert alert-warning">
                        <strong>Diqqat!</strong> Brauzer xavfsizlik qoidalari tufayli bu faylni to'g'ridan-to'g'ri ochib bo'lmaydi.<br>
                        Iltimos, saytni ko'rish uchun <code>http://localhost:3000</code> manzilidan foydalaning.
                    </div>`;
            }

            container.innerHTML = `<div class="col-12">${errorMessage}</div>`;
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
    window.currentNewsId = newsId;
    const news = window.globalNewsData.find(n => n.id === newsId);
    if (!news) return;

    // Increment view count in API
    incrementCounter('news_view_' + newsId).then(val => {
        const safeId = newsId.replace(/[^a-zA-Z0-9]/g, '_');
        const viewEl = document.getElementById(`views-${safeId}`);
        if (viewEl) viewEl.textContent = val;
    });


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

    // Better title extraction for Telegram HTML
    const firstBold = tempDiv.querySelector('b, strong, h1, h2, h3');
    if (firstBold) {
        newsTitle = firstBold.innerText.substring(0, 100);
    } else if (cleanText) {
        const lines = cleanText.split('\n').filter(l => l.trim().length > 0);
        if (lines.length > 0) newsTitle = lines[0].substring(0, 100);
    }

    // Clean up content: preserve structure but highlight hashtags
    let contentHtml = news.html || news.text.replace(/\n/g, '<br>');

    // Safe Hashtag Highlighting: Split by HTML tags, only replace in text content
    contentHtml = contentHtml.split(/(<[^>]+>)/g).map(part => {
        if (part && part.startsWith('<')) return part;
        // Robust Hashtag Highlighting (supporting Uzbek characters and stopping at punctuation)
        return part.replace(/(#[^\s#.,!?;:()\[\]{}'"]+)/g, '<span class="inline-hashtag">$1</span>');
    }).join('');



    // Aggressive whitespace and redundant tag trimming at the beginning
    contentHtml = contentHtml.replace(/^(\s|<br>|&nbsp;|(<br\s*\/?>))+/gi, '').trim();


    // Media Handling (Image or Video)
    let videoEl = document.getElementById('modalVideo');

    // Check if modalVideo exists, if not create it
    if (!videoEl && modalImage) {
        videoEl = document.createElement('video');
        videoEl.id = 'modalVideo';
        videoEl.className = 'img-fluid rounded';
        videoEl.controls = true;
        videoEl.style.width = '100%';
        modalImage.parentNode.insertBefore(videoEl, modalImage);

        // Add play overlay
        const playOverlay = document.createElement('div');
        playOverlay.className = 'modal-play-overlay';
        playOverlay.innerHTML = '<i class="fas fa-play-circle"></i>';
        modalImage.parentNode.appendChild(playOverlay);

        videoEl.addEventListener('play', () => modalImage.parentNode.classList.add('video-playing'));
        videoEl.addEventListener('pause', () => modalImage.parentNode.classList.remove('video-playing'));
        videoEl.addEventListener('ended', () => modalImage.parentNode.classList.remove('video-playing'));

        // Toggle play on click container
        modalImage.parentNode.onclick = () => {
            if (videoEl.paused) videoEl.play();
            else videoEl.pause();
        };
    }


    const fallbackMsg = document.getElementById('videoFallbackMsg');
    if (fallbackMsg) fallbackMsg.style.display = 'none';

    if (news.video) {
        if (modalImage) modalImage.style.display = 'none';
        if (videoEl) {
            videoEl.src = news.video;
            videoEl.muted = true; // Ovoz butunlay olib tashlandi
            videoEl.style.display = 'block';
            videoEl.play().catch(e => console.log("Auto-play blocked"));
        }
    } else if (news.isVideoPlaceholder) {
        if (modalImage) modalImage.style.display = 'none';
        if (videoEl) {
            videoEl.pause();
            videoEl.style.display = 'none';
        }

        const mediaSide = document.querySelector('.modal-image-side');
        let fbMsg = document.getElementById('videoFallbackMsg');
        if (!fbMsg) {
            fbMsg = document.createElement('div');
            fbMsg.id = 'videoFallbackMsg';
            fbMsg.style.textAlign = 'center';
            fbMsg.style.color = 'white';
            fbMsg.style.padding = '20px';
            mediaSide.appendChild(fbMsg);
        }
        fbMsg.innerHTML = `
            <div style="font-size: 50px; margin-bottom: 20px; opacity: 0.5;">📽️</div>
            <h4 style="margin-bottom: 15px;">Video hajmi juda katta</h4>
            <p style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 20px;">Ushbu videoni to'g'ridan-to'g'ri bu yerda ko'rsatib bo'lmaydi.</p>
            <a href="https://t.me/${news.id}" target="_blank" style="display: inline-block; background: #0088cc; color: white; padding: 10px 20px; border-radius: 20px; text-decoration: none; font-weight: bold;">
                Telegramda ko'rish
            </a>
        `;
        fbMsg.style.display = 'block';
    } else if (news.image) {

        if (videoEl) {
            videoEl.pause();
            videoEl.style.display = 'none';
        }
        if (modalImage) {
            modalImage.src = news.image;
            modalImage.style.display = 'block';
        }
    }
    else {
        // Fallback or hide both if no media - use CSS placeholder
        if (videoEl) {
            videoEl.pause();
            videoEl.style.display = 'none';
        }
        if (modalImage) {
            modalImage.style.display = 'none';
        }

        let fbMsg = document.getElementById('videoFallbackMsg');
        if (!fbMsg) {
            fbMsg = document.createElement('div');
            fbMsg.id = 'videoFallbackMsg';
            fbMsg.style.textAlign = 'center';
            fbMsg.style.color = 'white';
            fbMsg.style.padding = '40px 20px';
            const mediaSide = document.querySelector('.modal-image-side');
            mediaSide.appendChild(fbMsg);
        }
        fbMsg.innerHTML = `
            <div style="font-size: 60px; margin-bottom: 20px; opacity: 0.3;"><i class="fas fa-school"></i></div>
            <h4 style="margin-bottom: 15px; opacity: 0.7;">Rasm mavjud emas</h4>
            <p style="font-size: 0.9rem; opacity: 0.5;">Ushbu yangilik uchun rasm biriktirilmagan.</p>
        `;
        fbMsg.style.display = 'block';
    }



    // Kontentni o'rnatish
    modalTitle.textContent = 'Yangilik Tafsilotlari';
    modalHeading.textContent = newsTitle;
    if (modalImage) modalImage.alt = newsTitle;
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

// Theme Management
(function () {
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;

    function applyTheme(theme) {
        body.classList.remove('theme-modern', 'theme-green');
        if (theme === 'modern') {
            body.classList.add('theme-modern');
            if (themeToggle) {
                themeToggle.innerHTML = '<i class="fas fa-magic me-1"></i> Yashil';
                themeToggle.className = 'btn btn-light btn-sm rounded-pill px-3';
            }
        } else {
            body.classList.add('theme-green');
            if (themeToggle) {
                themeToggle.innerHTML = '<i class="fas fa-magic me-1"></i> Modern';
                themeToggle.className = 'btn btn-outline-light btn-sm rounded-pill px-3';
            }
        }
        localStorage.setItem('theme', theme);
    }

    // Initial load
    const savedTheme = localStorage.getItem('theme') || 'modern';
    applyTheme(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = body.classList.contains('theme-modern') ? 'modern' : 'green';
            const newTheme = currentTheme === 'modern' ? 'green' : 'modern';
            applyTheme(newTheme);
        });
    }

    // Back to Top & Jump to Footer Logic
    const backToTop = document.getElementById('backToTop');
    const jumpToFooter = document.getElementById('jumpToFooter');
    const dateNav = document.getElementById('dynamicDateNav');

    window.scrollToFooter = function () {
        const footer = document.querySelector('footer');
        if (footer) {
            footer.scrollIntoView({ behavior: 'smooth' });
        }
    };

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const pageHeight = document.documentElement.scrollHeight;
        const windowHeight = window.innerHeight;

        // Back to Top visibility
        if (backToTop) {
            if (scrollY > 300) {
                if (!dateNav || dateNav.getBoundingClientRect().bottom < 0) {
                    backToTop.classList.add('show');
                } else {
                    backToTop.classList.remove('show');
                }
            } else {
                backToTop.classList.remove('show');
            }
        }

        // Jump to Footer visibility (hide when already near footer)
        if (jumpToFooter) {
            if (scrollY + windowHeight < pageHeight - 300) {
                jumpToFooter.style.display = 'flex';
            } else {
                jumpToFooter.style.display = 'none';
            }
        }
    });
})();


// Modal Navigation
function navModal(direction) {
    if (!window.globalNewsData || !window.currentNewsId) return;

    const currentIndex = window.globalNewsData.findIndex(n => n.id === window.currentNewsId);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex - direction; // Telegram dates are descending, so direction -1 (prev) means index + 1? 
    // Wait, let's keep it simple: direction 1 means "next in array", which is "older" news usually.
    // Actually, let's make it intuitive: direction 1 means next item in list.

    nextIndex = currentIndex + direction;

    // Loop around
    if (nextIndex < 0) nextIndex = window.globalNewsData.length - 1;
    if (nextIndex >= window.globalNewsData.length) nextIndex = 0;

    const nextNews = window.globalNewsData[nextIndex];
    openModal(nextNews.id);
}

document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('customModal');
    if (modal && modal.classList.contains('active')) {
        if (e.key === 'ArrowLeft') navModal(-1);
        if (e.key === 'ArrowRight') navModal(1);
        if (e.key === 'Escape') closeModal();
    }
});
function generateArchiveNavigation(news) {
    const navContainer = document.getElementById('dynamicDateNav');
    if (!navContainer) return;

    navContainer.innerHTML = '';

    // Group news by Year and Month
    const archiveMap = {};
    news.forEach(item => {
        const date = new Date(item.date);
        const year = date.getFullYear();
        const month = date.getMonth(); // 0-11
        const monthName = formatMonthName(month);

        if (!archiveMap[year]) archiveMap[year] = new Set();
        archiveMap[year].add(monthName);
    });

    // Create Buttons
    const years = Object.keys(archiveMap).sort((a, b) => b - a);
    years.forEach(year => {
        // Year Button (optional or as a group label)
        const yearGroup = document.createElement('div');
        yearGroup.className = 'd-flex align-items-center me-3 mb-2';
        yearGroup.innerHTML = `<span class="badge bg-secondary me-2">${year}</span>`;

        const months = Array.from(archiveMap[year]);
        months.forEach(month => {
            const btn = document.createElement('button');
            btn.className = 'btn nav-btn btn-sm';
            btn.innerHTML = month;
            btn.onclick = () => scrollToDateSection(month, year);
            yearGroup.appendChild(btn);
        });

        navContainer.appendChild(yearGroup);
    });
}

function formatMonthName(monthIdx) {
    const months = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
    return months[monthIdx];
}

function scrollToDateSection(month, year) {
    const sections = document.querySelectorAll('#news-container h3 .group-title');
    for (let section of sections) {
        if (section.textContent.includes(month) && section.textContent.includes(year)) {
            // Because section is the span inside h3, scroll the h3 itself into view.
            section.parentElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Highlight active button
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            event.target.classList.add('active');
            break;
        }
    }
}

// ==================== STATISTICS & COUNTER LOGIC (CounterAPI.dev) ====================
const COUNTER_NAMESPACE = 'mshmaktab1_school';

// Increments a generic key and returns the value
async function incrementCounter(key) {
    try {
        const res = await fetch(`https://api.counterapi.dev/v1/${COUNTER_NAMESPACE}/${key}/up`);
        const data = await res.json();
        return data.count || 0;
    } catch (e) {
        return '...';
    }
}

// ==================== PREMIUM CALENDAR & CLOCK WIDGET ====================
function initPremiumCalendarWidget() {
    const widgetHtml = `
        <div class="premium-datetime-widget glass-effect">
            <div class="datetime-display" id="datetimeDisplay">
                <div class="time-block">
                    <span id="time-hm">00:00</span><span id="time-s">00</span>
                </div>
                <div class="date-block">
                    <div id="date-weekday">Dushanba</div>
                    <div id="date-full">1 Yanvar, 2026</div>
                </div>
                <div class="cal-icon-wrap">
                    <i class="fas fa-calendar-alt"></i>
                </div>
            </div>
            <div class="theme-swatch-bar">
                <div class="theme-swatch theme-modern" data-theme="modern" title="Modern Sapphire"></div>
                <div class="theme-swatch theme-green" data-theme="green" title="Emerald Forest"></div>
                <div class="theme-swatch theme-midnight" data-theme="midnight" title="Midnight Purple"></div>
                <div class="theme-swatch theme-sunset" data-theme="sunset" title="Golden Sunset"></div>
                <div class="theme-swatch theme-ocean" data-theme="ocean" title="Ocean Cyan"></div>
            </div>
            <div class="premium-calendar-dropdown" id="premiumCalendar">
                <div class="calendar-header">
                    <button id="cal-btn-prev"><i class="fas fa-chevron-left"></i></button>
                    <div class="calendar-selectors">
                        <select id="cal-select-month">
                            <option value="0">Yanvar</option>
                            <option value="1">Fevral</option>
                            <option value="2">Mart</option>
                            <option value="3">Aprel</option>
                            <option value="4">May</option>
                            <option value="5">Iyun</option>
                            <option value="6">Iyul</option>
                            <option value="7">Avgust</option>
                            <option value="8">Sentyabr</option>
                            <option value="9">Oktyabr</option>
                            <option value="10">Noyabr</option>
                            <option value="11">Dekabr</option>
                        </select>
                        <select id="cal-select-year"></select>
                    </div>
                    <button id="cal-btn-next"><i class="fas fa-chevron-right"></i></button>
                </div>
                <div class="calendar-weekdays">
                    <div>Du</div><div>Se</div><div>Ch</div><div>Pa</div><div>Ju</div><div>Sh</div><div>Ya</div>
                </div>
                <div class="calendar-days" id="calendarDays"></div>
            </div>
        </div>
    `;

    const widgetContainer = document.createElement('div');
    widgetContainer.id = "global-calendar-widget";
    widgetContainer.innerHTML = widgetHtml;

    // Injection
    const header = document.querySelector('header');
    if (header) {
        header.style.position = 'relative';
        header.appendChild(widgetContainer);
    } else {
        document.body.appendChild(widgetContainer);
    }

    // Theme Switcher Logic
    const swatches = widgetContainer.querySelectorAll('.theme-swatch');
    swatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            const theme = swatch.getAttribute('data-theme');
            document.body.classList.remove('theme-modern', 'theme-green', 'theme-midnight', 'theme-sunset', 'theme-ocean');
            document.body.classList.add('theme-' + theme);
            localStorage.setItem('theme', theme);
        });
    });

    // Logic
    const timeHm = document.getElementById('time-hm');
    const timeS = document.getElementById('time-s');
    const dateWeekday = document.getElementById('date-weekday');
    const dateFull = document.getElementById('date-full');
    const datetimeDisplay = document.getElementById('datetimeDisplay');
    const premiumCalendar = document.getElementById('premiumCalendar');

    const calDays = document.getElementById('calendarDays');
    const calMonth = document.getElementById('cal-select-month');
    const calYear = document.getElementById('cal-select-year');
    const btnPrev = document.getElementById('cal-btn-prev');
    const btnNext = document.getElementById('cal-btn-next');

    // Populate Year Dropdown
    const currentRealDate = new Date();
    for (let y = 1990; y <= 2050; y++) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        calYear.appendChild(opt);
    }

    let displayedMonth = currentRealDate.getMonth();
    let displayedYear = currentRealDate.getFullYear();

    // Selected Date Tracker
    let selectedDate = new Date(currentRealDate);

    function updateLiveClock() {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');

        timeHm.textContent = hh + ':' + mm;
        timeS.textContent = ':' + ss;

        const weekdays = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
        const months = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];

        // Show the currently selected date in the display, updating day and full date
        // Actually, user wants "live time" and "selected date"? No, usually a clock shows current day.
        // But if they select a date, maybe we update the display. Let's make the text show the SELECTED date, but live time always shows CURRENT time.
        const d = selectedDate;
        dateWeekday.textContent = weekdays[d.getDay()];
        dateFull.textContent = d.getDate() + ' ' + months[d.getMonth()] + ', ' + d.getFullYear();
    }

    setInterval(updateLiveClock, 1000);
    updateLiveClock();

    // Toggle calendar
    datetimeDisplay.addEventListener('click', (e) => {
        e.stopPropagation();
        premiumCalendar.classList.toggle('active');
        renderCalendar();
    });

    document.addEventListener('click', (e) => {
        if (!widgetContainer.contains(e.target)) {
            premiumCalendar.classList.remove('active');
        }
    });

    function renderCalendar() {
        calDays.innerHTML = '';
        calMonth.value = displayedMonth;
        calYear.value = displayedYear;

        const firstDay = new Date(displayedYear, displayedMonth, 1).getDay();
        const daysInMonth = new Date(displayedYear, displayedMonth + 1, 0).getDate();

        // Adjust for Monday start (0 is Sunday)
        let emptyCells = firstDay === 0 ? 6 : firstDay - 1;

        for (let i = 0; i < emptyCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'cal-day empty';
            calDays.appendChild(cell);
        }

        const today = new Date();

        for (let i = 1; i <= daysInMonth; i++) {
            const cell = document.createElement('div');
            cell.className = 'cal-day';
            cell.textContent = i;

            if (displayedYear === today.getFullYear() && displayedMonth === today.getMonth() && i === today.getDate()) {
                cell.classList.add('today');
            }
            if (displayedYear === selectedDate.getFullYear() && displayedMonth === selectedDate.getMonth() && i === selectedDate.getDate()) {
                cell.classList.add('selected');
            }

            cell.addEventListener('click', () => {
                selectedDate = new Date(displayedYear, displayedMonth, i);
                updateLiveClock();
                renderCalendar();
                // Close after select (optional, but requested for professional feel, maybe leave open or flash?)
                setTimeout(() => premiumCalendar.classList.remove('active'), 250);
            });

            calDays.appendChild(cell);
        }
    }

    btnPrev.addEventListener('click', () => {
        displayedMonth--;
        if (displayedMonth < 0) {
            displayedMonth = 11;
            displayedYear--;
        }
        renderCalendar();
    });

    btnNext.addEventListener('click', () => {
        displayedMonth++;
        if (displayedMonth > 11) {
            displayedMonth = 0;
            displayedYear++;
        }
        renderCalendar();
    });

    calMonth.addEventListener('change', (e) => {
        displayedMonth = parseInt(e.target.value);
        renderCalendar();
    });

    calYear.addEventListener('change', (e) => {
        displayedYear = parseInt(e.target.value);
        renderCalendar();
    });
}

// Just fetches the current value
async function getCounter(key) {
    try {
        const res = await fetch(`https://api.counterapi.dev/v1/${COUNTER_NAMESPACE}/${key}`);
        const data = await res.json();
        return data.count || 0;
    } catch (e) {
        // If key doesn't exist yet, it might 404, which is fine
        return 0;
    }
}

// Site Visitor Counter
async function updateVisitorCounter() {
    const visitorEl = document.getElementById('visitorCount');
    if (!visitorEl) return;

    // Use localStorage to avoid counting refresh/tab open as new "visit" during the SAME session
    if (sessionStorage.getItem('visited')) {
        const count = await getCounter('site_visitors');
        visitorEl.textContent = count.toLocaleString();
        return;
    }

    // Increment site_visitors
    const count = await incrementCounter('site_visitors');
    visitorEl.textContent = count.toLocaleString();
    sessionStorage.setItem('visited', 'true');
}

// Fetch stats for news card
async function fetchNewsStats(newsId) {
    const safeId = newsId.replace(/[^a-zA-Z0-9]/g, '_');
    const views = await getCounter('news_view_' + newsId);
    const likes = await getCounter('news_like_' + newsId);

    const viewEl = document.getElementById(`views-${safeId}`);
    const likeEl = document.getElementById(`likes-${safeId}`);
    const likeBtn = document.getElementById(`like-btn-${safeId}`);

    if (viewEl) viewEl.textContent = views;
    if (likeEl) likeEl.textContent = likes;

    // Check if user already liked this
    if (localStorage.getItem('liked_' + newsId)) {
        if (likeBtn) likeBtn.classList.add('active');
    }
}

// Handle Like Button Click
async function handleLike(newsId, btn) {
    if (localStorage.getItem('liked_' + newsId)) {
        alert("Siz ushbu yangilikka allaqachon layk bosgansiz!");
        return;
    }

    const safeId = newsId.replace(/[^a-zA-Z0-9]/g, '_');
    const likeEl = document.getElementById(`likes-${safeId}`);

    // Add visual feedback immediately
    btn.classList.add('active');
    btn.style.pointerEvents = 'none'; // Prevent double click

    // Update API
    const newVal = await incrementCounter('news_like_' + newsId);
    if (likeEl) likeEl.textContent = newVal;

    // Persist in local storage
    localStorage.setItem('liked_' + newsId, 'true');
}

// ==================== FLOATING PARTICLES ====================
function initParticles() {
    const container = document.getElementById('particles-container');
    if (!container) return;

    // A mix of vibrant colors
    const colors = ['#f43f5e', '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#00e5ff', '#ffffff'];
    const shapes = ['particle', 'particle', 'particle', 'particle-square', 'particle-triangle'];
    const particleCount = window.innerWidth > 768 ? 24 : 12; // Reduced count

    for (let i = 0; i < particleCount; i++) {
        createParticle(container, colors, shapes);
    }
}

function createParticle(container, colors, shapes) {
    const particle = document.createElement('div');

    // Randomize properties for glowing shapes
    const size = Math.random() * 8 + 4; // 4px to 12px
    const shapeClass = shapes[Math.floor(Math.random() * shapes.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];

    // Distribute mostly on the left (0-15vw) or right (85-100vw) sides
    const isLeftEdge = Math.random() > 0.5;
    const left = (isLeftEdge ? (Math.random() * 15) : (85 + Math.random() * 15)) + 'vw';

    const top = Math.random() * 100 + 'vh';
    const animDelay = Math.random() * 20 + 's';
    const animDuration = Math.random() * 20 + 20 + 's'; // Slower movement (20s to 40s)

    // Apply styles
    particle.className = shapeClass;

    // Size adjustment
    if (shapeClass === 'particle-triangle') {
        particle.style.borderLeft = (size / 2) + 'px solid transparent';
        particle.style.borderRight = (size / 2) + 'px solid transparent';
        particle.style.borderBottom = size + 'px solid ' + color;
        // Neon glow via filter dropshadow for borders (triangle)
        particle.style.filter = `drop-shadow(0 0 ${size}px ${color})`;
        particle.style.backgroundColor = 'transparent';
    } else {
        particle.style.backgroundColor = color;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        // Neon glow via box shadow (circles and squares)
        particle.style.boxShadow = `0 0 ${size * 1.5}px ${color}`;
    }

    particle.style.left = left;
    particle.style.top = top;
    particle.style.animationDelay = animDelay;
    particle.style.animationDuration = animDuration;

    container.appendChild(particle);
}

// Call on load
document.addEventListener('DOMContentLoaded', initParticles);

// ==================== MODERN SOFT CLICK SOUND ====================
let audioCtx;

function playSoftClick() {
    // Initialize lazily to respect browser autoplay policies
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    // Very soft "pop/tick" sound frequency
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, audioCtx.currentTime); // Start slightly high
    oscillator.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.05); // Drop frequency extremely fast

    // Volume envelope
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.01); // Soft 10% volume
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05); // Fade out

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.05);
}

// Attach click sound listener to interactive elements
document.addEventListener('click', (e) => {
    // Check if the click is on an interactive element
    const isInteractive =
        e.target.closest('button') ||
        e.target.closest('a') ||
        e.target.closest('.card') ||
        e.target.closest('.nav-item') ||
        e.target.closest('input') ||
        e.target.classList.contains('swiper-pagination-bullet');

    if (isInteractive) {
        playSoftClick();
    }
});
