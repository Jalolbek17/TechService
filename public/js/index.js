let menuToggleBtn;
let navLinks;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM to\'liq yuklandi va tahlil qilindi.');

    menuToggleBtn = document.getElementById('menu-toggle-btn');
    navLinks = document.querySelector('#navbar .nav-links');

    const navElements = document.querySelectorAll('#navbar .nav-link[data-page], #navbar .logo-link[data-page]');
    console.log('Navigatsiya elementlari topildi:', navElements.length, navElements);

    navElements.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const pageId = this.getAttribute('data-page');
            console.log('Navigatsiya linki bosildi, pageId:', pageId, 'Element:', this);
            showPage(pageId);

            if (navLinks && navLinks.classList.contains('active') && menuToggleBtn) {
                navLinks.classList.remove('active');
                const icon = menuToggleBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
                menuToggleBtn.setAttribute('aria-expanded', 'false');
                console.log('Mobil menyu yopildi (link bosilganda).');
            }
        });
    });

    if (menuToggleBtn && navLinks) {
        console.log('Mobil menyu tugmasi va linklari topildi.');
        menuToggleBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = menuToggleBtn.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
                menuToggleBtn.setAttribute('aria-expanded', 'true');
                console.log('Mobil menyu ochildi.');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
                menuToggleBtn.setAttribute('aria-expanded', 'false');
                console.log('Mobil menyu yopildi (toggle orqali).');
            }
        });
    } else {
        console.warn('Mobil menyu tugmasi yoki linklari topilmadi.');
    }

    console.log('Boshlang\'ich sozlamalar boshlanmoqda...');
    showPage('home');
    loadWorkingHoursUser();
    setInterval(loadChatMessagesUser, 7000);

    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }
});

let currentVisiblePage = 'home';
let selectedFileUser = null;

function showPage(pageId) {
    console.log('[showPage] Funksiya chaqirildi, pageId:', pageId);

    if (!pageId) {
        console.warn('[showPage] pageId bo\'sh. "home" ga o\'rnatilmoqda.');
        pageId = 'home';
    }

    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    console.log('[showPage] Barcha .page elementlari yashirildi.');

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        currentVisiblePage = pageId;
        console.log(`[showPage] Sahifa #${pageId} aktivlashtirildi.`);
    } else {
        console.error(`[showPage] ID si "${pageId}" bo'lgan .page elementi topilmadi! Bosh sahifa ko'rsatilmoqda.`);
        const homePage = document.getElementById('home');
        if (homePage) {
            homePage.classList.add('active');
            currentVisiblePage = 'home';
        } else {
            console.error("[showPage] Hatto 'home' sahifasi ham topilmadi! HTML strukturasini tekshiring.");
        }
    }

    document.querySelectorAll('#navbar .nav-links .nav-link[data-page]').forEach(link => {
        link.classList.remove('active-link');
        if (link.getAttribute('data-page') === currentVisiblePage) {
            link.classList.add('active-link');
        }
    });
    const logoLink = document.querySelector('#navbar .logo-link[data-page]');
    if (logoLink) {
        logoLink.classList.remove('active-link');
    }
    console.log('[showPage] Navigatsiya linklaridagi "active-link" yangilandi.');

    if (currentVisiblePage === 'services') {
        console.log('[showPage] Xizmatlar uchun ma\'lumotlar yuklanmoqda...');
        loadServicesForUser();
    } else if (currentVisiblePage === 'chat') {
        console.log('[showPage] Chat xabarlari yuklanmoqda...');
        loadChatMessagesUser();
        setTimeout(() => {
            const chatContainer = document.getElementById('chatMessagesUser');
            if(chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 200);
    }
}

async function loadServicesForUser() {
    console.log('[loadServicesForUser] chaqirildi');
    try {
        const response = await fetch('/api/services');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const services = await response.json();
        console.log('[loadServicesForUser] Xizmatlar olindi:', services);

        const grid = document.getElementById('servicesGrid');
        if (!grid) {
            console.error('[loadServicesForUser] servicesGrid elementi topilmadi.');
            return;
        }
        grid.innerHTML = '';

        if (!services || services.length === 0) {
            grid.innerHTML = '<p>Hozircha xizmatlar mavjud emas.</p>';
            return;
        }

        services.forEach(service => {
            const card = document.createElement('div');
            card.className = 'service-card';
            const escapedServiceName = service.name.replace(/'/g, "\\'").replace(/"/g, '\\"');
            card.innerHTML = `
                <h3>${service.name}</h3>
                <p>${service.description}</p>
                <div class="price">${service.price.toLocaleString()}</div> 
                <button class="btn btn-primary" onclick="purchaseService(${service.id}, '${escapedServiceName}', ${service.price})">Sotib Olish</button>
            `;
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('[loadServicesForUser] Xizmatlarni yuklashda xatolik:', error);
        const grid = document.getElementById('servicesGrid');
        if (grid) grid.innerHTML = '<p>Xizmatlarni yuklashda xatolik yuz berdi.</p>';
    }
}

async function purchaseService(serviceId, serviceName, servicePrice) {
    console.log(`[purchaseService] chaqirildi: ID ${serviceId}, Nomi ${serviceName}`);
    const confirmation = confirm(`"${serviceName}" xizmatini (${servicePrice.toLocaleString()} so'm) sotib olishni tasdiqlaysizmi?`);
    if (!confirmation) {
        console.log('[purchaseService] Sotib olish bekor qilindi.');
        return;
    }

    alert(`"${serviceName}" xizmati uchun buyurtma qabul qilindi! Tez orada siz bilan bog'lanamiz.`);

    const messageText = `Men "${serviceName}" xizmatini (${servicePrice.toLocaleString()} so'm) sotib olmoqchiman. Xizmat ID: ${serviceId}`;
    const formData = new FormData();
    formData.append('user', 'user');
    formData.append('text', messageText);

    try {
        const response = await fetch('/api/chat/messages', { method: 'POST', body: formData });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({message: "Server bilan bog'lanishda noma'lum xatolik"}));
            // noinspection ExceptionCaughtLocallyJS
            throw new Error(`Server xatoligi: ${response.status} - ${errData.message}`);
        }
        console.log('[purchaseService] Buyurtma xabari chatga yuborildi.');
        showPage('chat');
    } catch (error) {
        console.error('[purchaseService] Buyurtma xabarini chatga yuborishda xatolik:', error);
        alert(`Buyurtma xabarini chatga yuborishda xatolik: ${error.message}`);
    }
}

function previewImage(userTypeSuffix) {
    console.log(`[previewImage] chaqirildi: ${userTypeSuffix} uchun`);
    const fileInput = document.getElementById(`imageInput${userTypeSuffix}`);
    const previewContainer = document.getElementById(`imagePreviewContainer${userTypeSuffix}`);

    if (!fileInput || !previewContainer) {
        console.error(`[previewImage] Elementlar topilmadi: imageInput${userTypeSuffix} yoki imagePreviewContainer${userTypeSuffix}`);
        return;
    }

    if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        console.log(`[previewImage] Fayl tanlandi: ${file.name}, ${file.size} bayt`);

        if (!file.type.startsWith('image/')) {
            alert('Faqat rasm fayllarini yuklashingiz mumkin (masalan, PNG, JPG, GIF).');
            fileInput.value = '';
            clearImagePreview(userTypeSuffix);
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Rasm hajmi 5MB dan katta boʻlmasligi kerak.');
            fileInput.value = '';
            clearImagePreview(userTypeSuffix);
            return;
        }

        if (userTypeSuffix === 'User') selectedFileUser = file;
        else if (typeof selectedFileAdmin !== 'undefined' && userTypeSuffix === 'Admin') selectedFileAdmin = file;

        const reader = new FileReader();
        reader.onload = function(e) {
            previewContainer.innerHTML = `
                <img src="${e.target.result}" alt="Tanlangan rasm">
                <span>${file.name.length > 20 ? file.name.substring(0,17)+'...' : file.name} (${(file.size / 1024).toFixed(1)} KB)</span>
                <button class="remove-preview-btn" onclick="clearImagePreview('${userTypeSuffix}')" title="Rasmni olib tashlash">X</button>
            `;
            previewContainer.classList.remove('hidden');
        }
        reader.readAsDataURL(file);
    } else {
        console.log(`[previewImage] Fayl tanlanmadi yoki bekor qilindi: ${userTypeSuffix} uchun`);
        clearImagePreview(userTypeSuffix);
    }
}

function clearImagePreview(userTypeSuffix) {
    console.log(`[clearImagePreview] chaqirildi: ${userTypeSuffix} uchun`);
    const fileInput = document.getElementById(`imageInput${userTypeSuffix}`);
    const previewContainer = document.getElementById(`imagePreviewContainer${userTypeSuffix}`);

    if(fileInput) fileInput.value = '';

    if (userTypeSuffix === 'User') selectedFileUser = null;
    else if (typeof selectedFileAdmin !== 'undefined' && userTypeSuffix === 'Admin') selectedFileAdmin = null;

    if(previewContainer) {
        previewContainer.classList.add('hidden');
        previewContainer.innerHTML = '';
    }
}

async function sendMessageUser() {
    console.log('[sendMessageUser] chaqirildi');
    const textInput = document.getElementById('messageInputUser');
    const text = textInput.value.trim();

    if (!text && !selectedFileUser) {
        console.log('[sendMessageUser] Yuborish uchun matn yoki rasm yo\'q.');
        return;
    }

    const formData = new FormData();
    formData.append('user', 'user');
    if (text) formData.append('text', text);
    if (selectedFileUser) formData.append('chatImage', selectedFileUser);
    console.log('[sendMessageUser] FormData tayyorlandi:', {text_sent: !!text, image_sent: !!selectedFileUser});

    try {
        textInput.disabled = true;
        const sendButton = document.querySelector('.chat-input-area .btn-send');
        if(sendButton) sendButton.disabled = true;

        const response = await fetch('/api/chat/messages', { method: 'POST', body: formData });

        textInput.disabled = false;
        if(sendButton) sendButton.disabled = false;

        if (response.ok) {
            textInput.value = '';
            clearImagePreview('User');
            await loadChatMessagesUser();
            const chatContainer = document.getElementById('chatMessagesUser');
            if(chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
        } else {
            const errorResult = await response.json().catch(() => ({ message: "Serverdan noma'lum xatolik" }));
            console.error(`[sendMessageUser] Xabarni yuborishda xatolik: ${response.status}`, errorResult);
            alert(`Xabarni yuborishda xatolik: ${errorResult.message}`);
        }
    } catch (error) {
        console.error('[sendMessageUser] Xabarni yuborishda server bilan bog\'lanishda xatolik:', error);
        alert('Xabarni yuborishda server bilan bog\'lanishda xatolik.');
        textInput.disabled = false;
        const sendButton = document.querySelector('.chat-input-area .btn-send');
        if(sendButton) sendButton.disabled = false;
    }
}

async function loadChatMessagesUser() {
    try {
        const response = await fetch('/api/chat/messages');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const messages = await response.json();

        const container = document.getElementById('chatMessagesUser');
        if (!container) {
            return;
        }

        const isScrolledToBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 10; // 10px chegarasi


        container.innerHTML = '';

        if (!messages || messages.length === 0) {
            const welcomeMsgDiv = document.createElement('div');
            welcomeMsgDiv.className = 'message admin';
            welcomeMsgDiv.innerHTML = `<span class="sender">Admin</span> Salom! Sizga qanday yordam bera olaman?`;
            container.appendChild(welcomeMsgDiv);
        } else {
            messages.forEach(msg => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${msg.user}`;

                let messageContent = `<span class="sender">${msg.user === 'user' ? 'Siz' : 'Admin'}</span>`;
                if (msg.text) {
                    const linkedText = msg.text.replace(/(https?:\/\/[^\s!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
                    messageContent += `<div class="message-text" style="margin-bottom: ${msg.imageUrl ? '5px' : '0'}; white-space: pre-wrap;">${linkedText}</div>`;
                }
                if (msg.imageUrl) {
                    messageContent += `<img src="${msg.imageUrl}" alt="Chatdagi rasm" class="chat-image" onclick="openImageModal('${msg.imageUrl}')">`;
                }
                const displayTimestamp = msg.timestamp || new Date(msg.id).toLocaleTimeString('uz-UZ', {hour: '2-digit', minute: '2-digit'});
                messageContent += `<span class="timestamp">${displayTimestamp}</span>`;

                messageDiv.innerHTML = messageContent;
                container.appendChild(messageDiv);
            });
        }

        if (currentVisiblePage === 'chat') {
            if (isScrolledToBottom || messages.length < 5 ) {
                container.scrollTop = container.scrollHeight;
            }
        }

    } catch (error) {
    }
}

async function loadWorkingHoursUser() {
    console.log('[loadWorkingHoursUser] chaqirildi');
    try {
        const response = await fetch('/api/settings/working-hours');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const wh = await response.json();
        console.log('[loadWorkingHoursUser] Ish vaqti olindi:', wh);

        const display = document.getElementById('currentWorkingHoursUser');
        if (!display) {
            console.error('[loadWorkingHoursUser] currentWorkingHoursUser elementi topilmadi.');
            return;
        }

        const daysText = {
            'dush-juma': 'Dushanba - Juma',
            'dush-shan': 'Dushanba - Shanba',
            'har-kun': 'Har kuni'
        };
        display.textContent = `${daysText[wh.days] || wh.days || 'Noma\'lum'}: ${wh.startTime || '--:--'} - ${wh.endTime || '--:--'}`;
    } catch (error) {
        console.error('[loadWorkingHoursUser] Ish vaqtini yuklashda xatolik:', error);
        const display = document.getElementById('currentWorkingHoursUser');
        if (display) display.textContent = 'Ish vaqtini yuklashda xatolik.';
    }
}

function openImageModal(imageUrl) {
    console.log('[openImageModal] chaqirildi, URL:', imageUrl);
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.left = '0';
    modal.style.top = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.85)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '2000';
    modal.onclick = () => {
        document.body.removeChild(modal);
        console.log('[openImageModal] Modal yopildi.');
    };

    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.maxWidth = '90%';
    img.style.maxHeight = '90%';
    img.style.border = '3px solid white';
    img.style.borderRadius = '5px';
    img.style.boxShadow = '0 0 25px rgba(0,0,0,0.5)';

    modal.appendChild(img);
    document.body.appendChild(modal);
    console.log('[openImageModal] Modal ko\'rsatildi.');
}