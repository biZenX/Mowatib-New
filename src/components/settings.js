// Mowatib - Settings Component

import { i18n } from '../services/i18n.js';
import { storageService } from '../services/storage.js';
import { audioService } from '../services/audio.js';
import { notificationService } from '../services/notifications.js';

export class SettingsComponent {
  constructor(containerId, onSettingsChange) {
    this.container = document.getElementById(containerId);
    this.onSettingsChange = onSettingsChange;
  }

  render() {
    const s = storageService.settings;
    const isAr = i18n.currentLang === 'ar';

    this.container.innerHTML = `
      <div class="settings-view-wrapper">
        <h2 class="stats-title">${i18n.t('settings')}</h2>

        <!-- Durations Group -->
        <div class="settings-group-card">
          <div class="settings-card-header">
            <span class="material-symbols-rounded">timer</span>
            <span>${i18n.t('durations')}</span>
          </div>

          <!-- Focus Time -->
          <div class="settings-row">
            <div class="settings-row-text">
              <span class="settings-row-title">${i18n.t('focus_duration')}</span>
              <span class="settings-row-desc">${s.focusTime} ${i18n.t('mins')}</span>
            </div>
            <div class="m3-stepper">
              <button class="m3-stepper-btn" data-step-key="focusTime" data-step-dir="-1">-</button>
              <span class="m3-stepper-val">${s.focusTime}m</span>
              <button class="m3-stepper-btn" data-step-key="focusTime" data-step-dir="1">+</button>
            </div>
          </div>

          <!-- Short Break Time -->
          <div class="settings-row">
            <div class="settings-row-text">
              <span class="settings-row-title">${i18n.t('short_break_duration')}</span>
              <span class="settings-row-desc">${s.shortBreakTime} ${i18n.t('mins')}</span>
            </div>
            <div class="m3-stepper">
              <button class="m3-stepper-btn" data-step-key="shortBreakTime" data-step-dir="-1">-</button>
              <span class="m3-stepper-val">${s.shortBreakTime}m</span>
              <button class="m3-stepper-btn" data-step-key="shortBreakTime" data-step-dir="1">+</button>
            </div>
          </div>

          <!-- Long Break Time -->
          <div class="settings-row">
            <div class="settings-row-text">
              <span class="settings-row-title">${i18n.t('long_break_duration')}</span>
              <span class="settings-row-desc">${s.longBreakTime} ${i18n.t('mins')}</span>
            </div>
            <div class="m3-stepper">
              <button class="m3-stepper-btn" data-step-key="longBreakTime" data-step-dir="-1">-</button>
              <span class="m3-stepper-val">${s.longBreakTime}m</span>
              <button class="m3-stepper-btn" data-step-key="longBreakTime" data-step-dir="1">+</button>
            </div>
          </div>

          <!-- Session Length -->
          <div class="settings-row">
            <div class="settings-row-text">
              <span class="settings-row-title">${i18n.t('session_length')}</span>
              <span class="settings-row-desc">${s.sessionLength} ${i18n.t('focus').toLowerCase()} cycles</span>
            </div>
            <div class="m3-stepper">
              <button class="m3-stepper-btn" data-step-key="sessionLength" data-step-dir="-1">-</button>
              <span class="m3-stepper-val">${s.sessionLength}</span>
              <button class="m3-stepper-btn" data-step-key="sessionLength" data-step-dir="1">+</button>
            </div>
          </div>
        </div>

        <!-- Sound & Alerts Group -->
        <div class="settings-group-card">
          <div class="settings-card-header">
            <span class="material-symbols-rounded">notifications_active</span>
            <span>${i18n.t('sounds_alerts')}</span>
          </div>

          <div class="settings-row">
            <div class="settings-row-text">
              <span class="settings-row-title">${i18n.t('alarm_sound')}</span>
              <span class="settings-row-desc">Synthesized Web Audio</span>
            </div>
            <div style="display:flex; gap:0.4rem; align-items:center;">
              <select id="settings-alarm-select" style="background:var(--m3-surface-container); color:var(--m3-text-main); border:none; padding:0.4rem 0.6rem; border-radius:var(--m3-radius-sm); font-family:inherit; font-weight:700;">
                <option value="zen-bowl" ${s.alarmSound === 'zen-bowl' ? 'selected' : ''}>Zen Bowl</option>
                <option value="bell" ${s.alarmSound === 'bell' ? 'selected' : ''}>Crystal Bell</option>
                <option value="marimba" ${s.alarmSound === 'marimba' ? 'selected' : ''}>Marimba</option>
                <option value="gong" ${s.alarmSound === 'gong' ? 'selected' : ''}>Gong</option>
                <option value="digital" ${s.alarmSound === 'digital' ? 'selected' : ''}>Digital</option>
              </select>
              <button class="header-icon-btn" id="btn-sound-preview" title="Preview">
                <span class="material-symbols-rounded" style="font-size:18px;">volume_up</span>
              </button>
            </div>
          </div>

          <div class="settings-row">
            <div class="settings-row-text">
              <span class="settings-row-title">${i18n.t('vibration')}</span>
              <span class="settings-row-desc">Haptic feedback</span>
            </div>
            <input type="checkbox" id="setting-vibrate-toggle" ${s.vibrateEnabled ? 'checked' : ''} style="width:20px; height:20px; accent-color:var(--m3-primary);" />
          </div>
        </div>

        <!-- Appearance Group -->
        <div class="settings-group-card">
          <div class="settings-card-header">
            <span class="material-symbols-rounded">palette</span>
            <span>${i18n.t('appearance')}</span>
          </div>

          <div class="settings-row">
            <div class="settings-row-text">
              <span class="settings-row-title">${i18n.t('theme')}</span>
              <span class="settings-row-desc">Light / Dark / AMOLED</span>
            </div>
            <select id="settings-theme-select" style="background:var(--m3-surface-container); color:var(--m3-text-main); border:none; padding:0.4rem 0.6rem; border-radius:var(--m3-radius-sm); font-family:inherit; font-weight:700;">
              <option value="light" ${s.theme === 'light' ? 'selected' : ''}>${i18n.t('theme_light')}</option>
              <option value="dark" ${s.theme === 'dark' ? 'selected' : ''}>${i18n.t('theme_dark')}</option>
              <option value="amoled" ${s.theme === 'amoled' ? 'selected' : ''}>${i18n.t('theme_amoled')}</option>
            </select>
          </div>
        </div>

        <!-- Backup & Data -->
        <div class="settings-group-card">
          <div class="settings-card-header">
            <span class="material-symbols-rounded">cloud_sync</span>
            <span>${i18n.t('backup_restore')}</span>
          </div>

          <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">
            <button class="header-icon-btn" id="btn-export-data">
              <span class="material-symbols-rounded" style="font-size:16px; margin-right:4px;">download</span>
              ${i18n.t('export_json')}
            </button>
            <label class="header-icon-btn" style="cursor:pointer;">
              <span class="material-symbols-rounded" style="font-size:16px; margin-right:4px;">upload</span>
              ${i18n.t('import_json')}
              <input type="file" id="input-import-file" accept=".json" style="display:none;" />
            </label>
            <button class="header-icon-btn" id="btn-reset-data" style="color:#ef4444;">
              <span class="material-symbols-rounded" style="font-size:16px; margin-right:4px;">delete</span>
              ${i18n.t('reset_data')}
            </button>
          </div>
        </div>

      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    this.container.querySelectorAll('.m3-stepper-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        audioService.playClick();
        const key = btn.dataset.stepKey;
        const dir = parseInt(btn.dataset.stepDir, 10);
        let val = (storageService.settings[key] || 0) + dir;

        if (key === 'focusTime') val = Math.max(1, Math.min(180, val));
        if (key === 'shortBreakTime') val = Math.max(1, Math.min(60, val));
        if (key === 'longBreakTime') val = Math.max(1, Math.min(90, val));
        if (key === 'sessionLength') val = Math.max(1, Math.min(12, val));

        storageService.saveSettings({ [key]: val });
        this.render();
        if (this.onSettingsChange) this.onSettingsChange();
      });
    });

    document.getElementById('settings-alarm-select')?.addEventListener('change', (e) => {
      storageService.saveSettings({ alarmSound: e.target.value });
      audioService.playAlarm(e.target.value, storageService.settings.alarmVolume);
    });

    document.getElementById('btn-sound-preview')?.addEventListener('click', () => {
      audioService.playAlarm(storageService.settings.alarmSound, storageService.settings.alarmVolume);
    });

    document.getElementById('setting-vibrate-toggle')?.addEventListener('change', (e) => {
      storageService.saveSettings({ vibrateEnabled: e.target.checked });
      if (e.target.checked) notificationService.vibrate([150, 50, 150]);
    });

    document.getElementById('settings-theme-select')?.addEventListener('change', (e) => {
      const theme = e.target.value;
      storageService.saveSettings({ theme });
      document.body.setAttribute('data-theme', theme);
      window.dispatchEvent(new CustomEvent('mowatib:themeChange', { detail: theme }));
    });

    document.getElementById('btn-export-data')?.addEventListener('click', () => {
      audioService.playClick();
      const json = storageService.exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mowatib_backup_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById('input-import-file')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const success = storageService.importData(event.target.result);
        if (success) {
          alert('Data imported successfully!');
          window.location.reload();
        } else {
          alert('Failed to import invalid JSON file.');
        }
      };
      reader.readAsText(file);
    });

    document.getElementById('btn-reset-data')?.addEventListener('click', () => {
      if (confirm(i18n.t('reset_confirm'))) {
        audioService.playClick();
        storageService.resetAllData();
        window.location.reload();
      }
    });
  }
}
