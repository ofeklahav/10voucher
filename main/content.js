/* eslint-disable no-undef */

// ==============================
// 1. Initial Setup, State, and Utilities
// ==============================

// Helper for script injection
async function injectScript(filePath) {
  return new Promise(resolve => {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL(filePath);
    script.onload = () => {
      script.remove();
      resolve();
    };
    (document.head || document.documentElement).appendChild(script);
  });
}

// Global state variables
let vouchersCache = null;
let lastSelectedMonths = 12;
let currentSortBy = 'date';
let currentSortDirection = 'asc';
let currentFilterBy = 'all';

// ==============================
// 2. SVG Icons and HTML Templates
// ==============================

// Grouping all SVG icons in a single object for better organization.
const ICONS = {
  close: `<svg fill="currentColor" width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M13.414 12l4.95-4.95a1 1 0 0 0-1.414-1.414L12 10.586l-4.95-4.95A1 1 0 0 0 5.636 7.05l4.95 4.95-4.95 4.95a1 1 0 0 0 1.414 1.414l4.95-4.95 4.95 4.95a1 1 0 0 0 1.414-1.414z"/></svg>`,
  refresh: `<svg fill="currentColor" width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19.146 4.854l-1.489 1.489A8 8 0 1 0 12 20a8.094 8.094 0 0 0 7.371-4.886 1 1 0 1 0-1.842-.779A6.071 6.071 0 0 1 12 18a6 6 0 1 1 4.243-10.243l-1.39 1.39a.5.5 0 0 0 .354.854H19.5A.5.5 0 0 0 20 9.5V5.207a.5.5 0 0 0-.854-.353z"/></svg>`,
  info: `<svg fill="currentColor" viewBox="0 0 24 24" width="24px" height="24px" xmlns="http://www.w3.org/2000/svg"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1-8V8a1 1 0 0 1 2 0v4a1 1 0 0 1-2 0zm1 4a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>`,
  back: `<svg fill="#ffffff" width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9.343 18.657a1 1 0 0 1-.707-1.707l4.95-4.95-4.95-4.95a1 1 0 0 1 1.414-1.414l5.657 5.657a1 1 0 0 1 0 1.414l-5.657 5.657a1 1 0 0 1-.707.293z"/></svg>`,
  clock: `<svg fill="currentColor" viewBox="0 0 24 24" width="24px" height="24px" xmlns="http://www.w3.org/2000/svg"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zM11 7h2v5.111l3.228 3.228-1.414 1.414L11 12.828z"/></svg>`,
  hamburger: `<svg fill="currentColor" width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="17" width="18" height="2" rx="1" ry="1"/><rect x="3" y="11" width="18" height="2" rx="1" ry="1"/><rect x="3" y="5" width="18" height="2" rx="1" ry="1"/></svg>`,
  sortUp: `<svg fill="none" width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M13 12H21M13 8H21M13 16H21M6 7V17M6 7L3 10M6 7L9 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  sortDown: `<svg fill="none" width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M13 12H21M13 8H21M13 16H21M6 7V17M6 17L3 14M6 17L9 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  warning: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#E74C3C" width="24" height="24"><path d="M12 2L1 21h22L12 2zm0 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm-1-8a1 1 0 0 1 2 0v4a1 1 0 0 1-2 0V9z"/></svg>`,
  download: `<svg fill="#ffffff" width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 16l-5-5h4V4h2v7h4l-5 5zM4 19h16v-2H4v2z"/></svg>`,
  copy: `<svg fill="#ffffff" width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`,
};

// ==============================
// 3. HTML Templates (Centralized)
// ==============================

// All HTML templates are now in one place.
const TEMPLATES = {
  loading: `
    <div class="popup-header">
      <div class="header-buttons-right">
        <button id="close-popup" class="header-button">${ICONS.close}</button>
      </div>
      <h3>טוען שוברים...</h3>
      <div class="header-buttons-left"></div>
    </div>
    <div id="message-container"></div>
    <div class="popup-content">
      <div class="popup-loading-spinner">
        <div class="spinner"></div>
      </div>
    </div>`,
  vouchers: (vouchersToRender, uniqueLogos) => `
    <div class="popup-header">
      <div class="header-buttons-right">
        <button id="close-popup" class="header-button">${ICONS.close}</button>
      </div>
      <h3>השוברים שלי (${vouchersToRender.length})</h3>
      <div class="header-buttons-left">
        <button id="hamburger-menu" class="header-button">${ICONS.hamburger}</button>
      </div>
    </div>
    <div id="message-container"></div>
    <div id="popup-menu" class="popup-menu hidden">
      <button id="refresh-vouchers" class="menu-item">
        <div class="menu-item-icon">${ICONS.refresh}</div>
        <span class="menu-item-text">רענון שוברים</span>
      </button>
      <button id="change-timeframe" class="menu-item">
        <div class="menu-item-icon">${ICONS.clock}</div>
        <span class="menu-item-text">שינוי טווח זמן</span>
      </button>
      <button id="info-popup" class="menu-item">
        <div class="menu-item-icon">${ICONS.info}</div>
        <span class="menu-item-text">אודות התוסף</span>
      </button>
    </div>
    <div class="sort-filter-bar" dir="rtl">
      <div style="position: relative;">
        <button id="sort-by-date" class="sort-filter-button ${currentSortBy === 'date' ? 'active' : ''}">
          תאריך ${currentSortBy === 'date' ? (currentSortDirection === 'asc' ? ICONS.sortUp : ICONS.sortDown) : ''}
        </button>
      </div>
      <div style="position: relative;">
        <button id="sort-by-balance" class="sort-filter-button ${currentSortBy === 'balance' ? 'active' : ''}">
          שווי ${currentSortBy === 'balance' ? (currentSortDirection === 'asc' ? ICONS.sortUp : ICONS.sortDown) : ''}
        </button>
      </div>
      <div style="position: relative;">
        <button id="filter-by-business" class="sort-filter-button ${currentFilterBy !== 'all' ? 'active' : ''}">
          סינון עסק
        </button>
        <div id="filter-menu" class="sort-filter-menu">
          <button class="sort-filter-menu-item" data-filter="all">הכל</button>
          ${uniqueLogos.map(logo => `
            <button class="sort-filter-menu-item" data-filter="${logo}">
              <img src="${logo}" alt="Business Logo" style="width: 20px; height: 20px; vertical-align: middle; margin-left: 5px;">
            </button>
          `).join('')}
        </div>
      </div>
    </div>
    <div class="popup-content">
      ${vouchersToRender.length > 0 ? vouchersToRender.map((voucher, index) => `
        <div class="voucher-card">
          <div class="voucher-header">
            <img src="${voucher.logo}" alt="Logo" class="voucher-logo">
            <div class="voucher-order-id">#${voucher.orderId}</div>
          </div>
          <div class="voucher-body">
            <div class="voucher-code">${voucher.cardId}-${voucher.cardPin}</div>
            <div class="voucher-balance">${voucher.balance} ש"ח</div>
          </div>
          <div class="voucher-barcode">
            <svg id="barcode-${index}"></svg>
          </div>
        </div>
      `).join('') : '<p style="text-align: center; margin-top: 20px;">לא נמצאו שוברים בטווח הזמן הזה.</p>'}
    </div>
    <div class="popup-footer" dir="rtl">
      <button id="copy-vouchers">${ICONS.copy} העתקת שוברים</button>
      <button id="download-pdf">${ICONS.download} הורדת PDF</button>
    </div>`,
  info: (logoPath) => `
    <div class="popup-header" dir="rtl">
      <div class="header-buttons-right">
        <button id="close-popup" class="header-button">${ICONS.close}</button>
      </div>
      <h3>אודות התוסף</h3>
      <div class="header-buttons-left">
        <button id="back-to-vouchers" class="header-button">${ICONS.back}</button>
      </div>
    </div>
    <div id="message-container"></div>
    <div class="popup-content" dir="rtl">
      <div class="info-logo-container">
        <img src="${logoPath}" alt="Voucher Logo" class="info-logo">
      </div>
      <p>תוסף 'תן שובר' מאפשר לכם לצפות, להעתיק ולהוריד את השוברים שלכם מאתר תן ביס ישירות מהדפדפן.</p>
      <p>המערכת שואבת נתונים עד חמש שנים אחורה, כתוקף שוברי מולטיפאס.</p>
      </ul>
    </div>
    <div class="popup-footer info-footer" dir="rtl">
      <a href="https://github.com/ofeklahav/10voucher" target="_blank" class="github-link">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
      </a>
      <div class="footer-text-container">
          <span class="footer-text">פותח על ידי אופק להב</span>
          <span class="footer-text">גרסה: 1.0.0</span>
      </div>
    </div>`,
  selection: (warningIcon) => `
    <div class="popup-header">
        <div class="header-buttons-right">
          <button id="close-popup" class="header-button">${ICONS.close}</button>
        </div>
        <h3>בחירת טווח זמן</h3>
        <div class="header-buttons-left"></div>
    </div>
    <div id="message-container"></div>
    <div class="popup-content">
        <div class="welcome-section" dir="rtl">
            <h4>ברוך הבא לתוסף 'תן שובר'!</h4>
            <p>כדי להתחיל, אנא בחר טווח זמן מתוך האפשרויות על מנת שנוכל להציג לך את השוברים הרלוונטיים.</p>
        </div>
        <div id="warning-message" class="hidden">
          <div class="warning-icon-container">${warningIcon}</div>
          <div class="warning-text"> שוברי מולטיפס הם בעלי תוקף של חמש שנים ולכן החיפוש הוא על פני חמש שנים, והוא יכול להימשך מספר דקות. </div>
        </div>
        <div class="timeframe-selector">
            <div class="slider-container">
                <input type="range" id="timeframe-slider" min="0" max="3" value="0">
            </div>
            <div class="labels">
                <span data-value="1" class="label-1">חודש</span>
                <span data-value="3" class="label-3" dir="rtl">3 חודשים</span>
                <span data-value="12" class="label-12">שנה</span>
                <span data-value="60" class="label-all">הכל</span>
            </div>
            <button id="load-vouchers-button">טען שוברים</button>
        </div>
    </div>`
};

// ==============================
// 4. Main Rendering Logic
// ==============================

// Helper functions for showing/hiding the popup
function showPopup() {
  const popup = document.getElementById('voucher-popup');
  if (popup) {
    popup.style.display = 'flex';
    setTimeout(() => {
      popup.classList.add('active');
    }, 10);
  }
}

function hidePopup() {
  const popup = document.getElementById('voucher-popup');
  if (popup) {
    popup.classList.remove('active');
    setTimeout(() => {
      popup.style.display = 'none';
    }, 300); // Duration matches the CSS transition
  }
}

function setPopupContent(html) {
  const popup = document.getElementById('voucher-popup');
  if (popup) popup.innerHTML = html;
}

function showTemporaryMessage(message) {
  const messageContainer = document.getElementById('message-container');
  if (messageContainer) {
    messageContainer.innerHTML = `<div class="temporary-message">${message}</div>`;
    setTimeout(() => messageContainer.innerHTML = '', 3000);
  }
}

function renderVouchers(vouchers) {
  let vouchersToRender = [...vouchers];
  
  // Sorting logic
  const sortDirection = currentSortDirection === 'asc' ? 1 : -1;
  const sortMap = {
    'date': (a, b) => (a.orderId - b.orderId) * sortDirection,
    'balance': (a, b) => (a.balance - b.balance) * sortDirection,
    'business': (a, b) => a.logo.localeCompare(b.logo, 'he') * sortDirection
  };
  if (sortMap[currentSortBy]) {
    vouchersToRender.sort(sortMap[currentSortBy]);
  }

  // Filtering logic
  if (currentFilterBy !== 'all') {
    vouchersToRender = vouchersToRender.filter(v => v.logo === currentFilterBy);
  }

  const uniqueLogos = [...new Set(vouchers.map(v => v.logo))];
  setPopupContent(TEMPLATES.vouchers(vouchersToRender, uniqueLogos));
  window.postMessage({ type: "RENDER_BARCODES", vouchers: vouchersToRender }, "*");
}

function renderInfoScreen() {
  setPopupContent(TEMPLATES.info(chrome.runtime.getURL('images/logo-info.png')));
}

function renderSelectionScreen() {
  setPopupContent(TEMPLATES.selection(ICONS.warning));
  const slider = document.getElementById('timeframe-slider');
  const warningMessage = document.getElementById('warning-message');
  const showWarning = () => {
    warningMessage.classList.toggle('hidden', parseInt(slider.value) !== 3);
  };
  slider.addEventListener('input', showWarning);
  showWarning();
}

function showLoadingSpinner() {
  setPopupContent(TEMPLATES.loading);
}

// ==============================
// 5. Event Listeners
// ==============================

document.addEventListener('click', (event) => {
  const popup = document.getElementById('voucher-popup');
  if (!popup) return;

  // Handle menu closures
  const menu = document.getElementById('popup-menu');
  const filterMenu = document.getElementById('filter-menu');
  if (menu && menu.classList.contains('active') && !event.target.closest('#popup-menu') && !event.target.closest('#hamburger-menu')) {
    menu.classList.remove('active');
  }
  if (filterMenu && filterMenu.classList.contains('show') && !event.target.closest('#filter-by-business') && !event.target.closest('#filter-menu')) {
    filterMenu.classList.remove('show');
  }

  const target = event.target.closest('button, #voucher-fab, .sort-filter-menu-item');
  if (!target) return;

  // Refactored logic to be more modular
  const handlers = {
    'close-popup': hidePopup,
    'hamburger-menu': () => menu?.classList.toggle('hidden'),
    'refresh-vouchers': () => {
      menu?.classList.add('hidden');
      showLoadingSpinner();
      chrome.runtime.sendMessage({ action: 'refreshVouchers', months: lastSelectedMonths }, response => {
        if (response?.vouchers) {
          vouchersCache = response.vouchers;
          renderVouchers(vouchersCache);
        } else {
          // Handle error case
          setPopupContent(`...`);
        }
      });
    },
    'info-popup': () => {
      menu?.classList.add('hidden');
      renderInfoScreen();
    },
    'back-to-vouchers': () => {
      if (vouchersCache) {
        renderVouchers(vouchersCache);
      } else {
        renderSelectionScreen();
      }
    },
    'change-timeframe': () => {
      menu?.classList.add('hidden');
      renderSelectionScreen();
    },
    'copy-vouchers': () => {
      if (vouchersCache) {
        const voucherText = vouchersCache.map(v => `${v.cardId}-${v.cardPin}`).join('\n');
        navigator.clipboard.writeText(voucherText).then(() => {
          showTemporaryMessage('!השוברים הועתקו בהצלחה');
        });
      }
    },
    'download-pdf': () => {
      if (vouchersCache) {
        window.postMessage({ type: "DOWNLOAD_VOUCHERS_PDF", vouchers: vouchersCache }, "*");
        showTemporaryMessage('!ההורדה החלה');
      }
    },
    'load-vouchers-button': () => {
      const slider = document.getElementById('timeframe-slider');
      const months = [1, 3, 12, 60][parseInt(slider.value)];
      lastSelectedMonths = months;
      showLoadingSpinner();
      chrome.runtime.sendMessage({ action: 'fetchVouchersByMonths', months: months }, response => {
        if (response?.vouchers) {
          vouchersCache = response.vouchers;
          renderVouchers(vouchersCache);
        } else {
          // Handle error case
          setPopupContent(`...`);
        }
      });
    },
    'voucher-fab': () => {
      const popupEl = document.getElementById('voucher-popup');
      if (!popupEl.classList.contains('active')) {
          showPopup();
          if (vouchersCache) {
              renderVouchers(vouchersCache);
          } else {
              renderSelectionScreen();
          }
      } else {
          hidePopup();
      }
    },
    'sort-by-date': () => {
      currentSortDirection = currentSortBy === 'date' ? (currentSortDirection === 'asc' ? 'desc' : 'asc') : 'asc';
      currentSortBy = 'date';
      renderVouchers(vouchersCache);
    },
    'sort-by-balance': () => {
      currentSortDirection = currentSortBy === 'balance' ? (currentSortDirection === 'asc' ? 'desc' : 'asc') : 'asc';
      currentSortBy = 'balance';
      renderVouchers(vouchersCache);
    },
    'filter-by-business': () => {
      document.getElementById('filter-menu')?.classList.toggle('show');
    },
  };

  if (target.id in handlers) {
    handlers[target.id]();
  } else if (target.classList.contains('sort-filter-menu-item')) {
    currentFilterBy = target.dataset.filter;
    document.getElementById('filter-menu')?.classList.remove('show');
    renderVouchers(vouchersCache);
  }
});

// ==============================
// 6. Initial Script Injection
// ==============================

(async () => {
  await injectScript('libs/html2canvas.min.js');
  await injectScript('libs/jsbarcode.all.min.js');
  await injectScript('libs/jspdf.umd.min.js');
  await injectScript('modules/barcode-renderer.js');
  await injectScript('modules/pdf_logic.js');

  const fab = document.createElement('div');
  fab.id = 'voucher-fab';
  fab.innerHTML = `<img src="${chrome.runtime.getURL('images/icon48.png')}" alt="Vouchers">`;
  document.body.appendChild(fab);

  const popup = document.createElement('div');
  popup.id = 'voucher-popup';
  popup.style.display = 'none'; // Initially hidden
  document.body.appendChild(popup);
})();