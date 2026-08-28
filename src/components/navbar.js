// Mowatib - Responsive Navbar Component (Desktop Top Tabs & Mobile Bottom Bar)

import { i18n } from '../services/i18n.js';
import { storageService } from '../services/storage.js';
import { audioService } from '../services/audio.js';

export class NavbarComponent {
  constructor(bottomContainerId, desktopContainerId, onNavigate) {
    this.bottomContainer = document.getElementById(bottomContainerId);
    this.desktopContainer = document.getElementById(desktopContainerId);
    this.onNavigate = onNavigate;
    this.currentView = 'timer';
  }

  render() {
    const isAr = i18n.currentLang === 'ar';

    // Render Desktop Tabs
    if (this.desktopContainer) {
      this.desktopContainer.innerHTML = `
        <button class="desktop-nav-btn ${this.currentView === 'timer' ? 'active' : ''}" data-view="timer">
          <span class="material-symbols-rounded">timer</span>
          <span class="nav-label-text">${i18n.t('timer')}</span>
        </button>
        <button class="desktop-nav-btn ${this.currentView === 'stats' ? 'active' : ''}" data-view="stats">
          <span class="material-symbols-rounded">query_stats</span>
          <span class="nav-label-text">${i18n.t('stats')}</span>
        </button>
        <button class="desktop-nav-btn ${this.currentView === 'settings' ? 'active' : ''}" data-view="settings">
          <span class="material-symbols-rounded">settings</span>
          <span class="nav-label-text">${i18n.t('settings')}</span>
        </button>
      `;
    }

    // Render Mobile Bottom Bar
    if (this.bottomContainer) {
      this.bottomContainer.innerHTML = `
        <button class="bottom-tab-item ${this.currentView === 'timer' ? 'active' : ''}" data-view="timer">
          <div class="tab-icon-pill">
            <span class="material-symbols-rounded">timer</span>
          </div>
          <span>${i18n.t('timer')}</span>
        </button>

        <button class="bottom-tab-item ${this.currentView === 'stats' ? 'active' : ''}" data-view="stats">
          <div class="tab-icon-pill">
            <span class="material-symbols-rounded">query_stats</span>
          </div>
          <span>${i18n.t('stats')}</span>
        </button>

        <button class="bottom-tab-item ${this.currentView === 'settings' ? 'active' : ''}" data-view="settings">
          <div class="tab-icon-pill">
            <span class="material-symbols-rounded">settings</span>
          </div>
          <span>${i18n.t('settings')}</span>
        </button>
      `;
    }

    // Update Header quick buttons
    const langBtn = document.getElementById('header-lang-btn');
    if (langBtn) langBtn.textContent = isAr ? 'EN' : 'عربي';

    this.bindEvents();
  }

  bindEvents() {
    // All navigation buttons (both desktop and mobile)
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        audioService.playClick();
        const view = btn.dataset.view;
        this.setActiveView(view);
      });
    });

    // Brand click navigates to timer
    document.getElementById('header-brand-wrap')?.addEventListener('click', () => {
      audioService.playClick();
      this.setActiveView('timer');
    });

    // Quick Language Switch
    document.getElementById('header-lang-btn')?.addEventListener('click', () => {
      audioService.playClick();
      const newLang = i18n.currentLang === 'en' ? 'ar' : 'en';
      i18n.setLanguage(newLang);
      storageService.saveSettings({ language: newLang });
      window.dispatchEvent(new CustomEvent('mowatib:languageChange', { detail: newLang }));
    });

    // Quick Theme Switch
    document.getElementById('header-theme-btn')?.addEventListener('click', () => {
      audioService.playClick();
      const currentTheme = storageService.settings.theme || 'light';
      const nextTheme = currentTheme === 'light' ? 'dark' : currentTheme === 'dark' ? 'amoled' : 'light';
      storageService.saveSettings({ theme: nextTheme });
      document.body.setAttribute('data-theme', nextTheme);
      window.dispatchEvent(new CustomEvent('mowatib:themeChange', { detail: nextTheme }));
    });
  }

  setActiveView(viewName) {
    this.currentView = viewName;
    this.onNavigate(viewName);
    this.render();
  }
}
