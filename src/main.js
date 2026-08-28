// Mowatib (مواظب) - Main Application Controller

import { i18n } from './services/i18n.js';
import { storageService } from './services/storage.js';
import { audioService } from './services/audio.js';
import { NavbarComponent } from './components/navbar.js';
import { TimerComponent } from './components/timer.js';
import { StatsComponent } from './components/stats.js';
import { SettingsComponent } from './components/settings.js';

class App {
  constructor() {
    this.currentView = 'timer';

    const s = storageService.settings;
    i18n.setLanguage(s.language || 'en');
    document.body.setAttribute('data-theme', s.theme || 'light');

    this.timer = new TimerComponent('timer-view', (state) => {});
    this.stats = new StatsComponent('stats-view');
    this.settings = new SettingsComponent('settings-view', () => {
      this.timer.updateDurationsFromSettings();
      this.timer.render();
      this.stats.render();
    });

    this.navbar = new NavbarComponent('bottom-nav', 'desktop-nav-tabs', (view) => this.switchView(view));

    this.init();
  }

  init() {
    this.navbar.render();
    this.timer.render();
    this.stats.render();
    this.settings.render();

    this.bindGlobalEvents();
    this.bindKeyboardShortcuts();
  }

  switchView(viewName) {
    this.currentView = viewName;

    const views = document.querySelectorAll('.view-panel');
    views.forEach(v => v.classList.remove('active'));

    const target = document.getElementById(`${viewName}-view`);
    if (target) target.classList.add('active');

    if (viewName === 'stats') {
      this.stats.render();
    } else if (viewName === 'settings') {
      this.settings.render();
    } else if (viewName === 'timer') {
      this.timer.render();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  bindGlobalEvents() {
    window.addEventListener('mowatib:languageChange', () => {
      this.navbar.render();
      this.timer.render();
      this.stats.render();
      this.settings.render();
    });

    window.addEventListener('mowatib:themeChange', () => {
      this.navbar.render();
      this.timer.render();
    });

    window.addEventListener('mowatib:statsUpdated', () => {
      this.stats.render();
    });
  }

  bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        this.timer.toggleTimer();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        this.timer.resetTimer();
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        this.timer.skipNext();
      } else if (e.key === '1') {
        this.navbar.setActiveView('timer');
      } else if (e.key === '2') {
        this.navbar.setActiveView('stats');
      } else if (e.key === '3') {
        this.navbar.setActiveView('settings');
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.mowatibApp = new App();
});
