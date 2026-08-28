import React, { useState } from 'react';
import { i18n } from '../../services/i18n.js';
import { storageService } from '../../services/storage.js';
import { audioService } from '../../services/audio.js';
import { notificationService } from '../../services/notifications.js';

export function SettingsView({ onLanguageChange, onThemeChange, onOpenPaywall, onAccountDeleted }) {
  const [settings, setSettings] = useState(() => storageService.settings);
  const [exportUrl, setExportUrl] = useState(null);
  const [exportFilename, setExportFilename] = useState('');

  const updateSetting = (key, value) => {
    const updated = storageService.saveSettings({ [key]: value });
    setSettings({ ...updated });
    if (key === 'language' && onLanguageChange) {
      onLanguageChange(value);
    }
    if (key === 'theme' && onThemeChange) {
      onThemeChange(value);
    }
  };

  const handleTestSound = (soundName) => {
    audioService.playAlarm(soundName);
  };

  const handleExportData = (format) => {
    try {
      const url = storageService.exportData(format);
      setExportUrl(url);
      setExportFilename(`mowatib_backup_${Date.now()}.${format}`);
    } catch (err) {
      if (err.message && err.message.includes('premium')) {
        onOpenPaywall();
      }
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm(i18n.t('delete_account_confirm'))) {
      storageService.deleteAccountAndData();
      if (onAccountDeleted) onAccountDeleted();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', maxWidth: '780px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>{i18n.t('settings_title')}</h2>

      <div class="stats-chart-card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span class="material-symbols-rounded">palette</span>
          <span>{i18n.t('appearance')}</span>
        </h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: '700' }}>{i18n.t('language')}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--m3-text-muted)' }}>اللغة الأساسية للتطبيق</div>
          </div>
          <div class="view-mode-toggle">
            <button
              class={`toggle-btn ${settings.language === 'ar' ? 'active' : ''}`}
              onClick={() => updateSetting('language', 'ar')}
            >
              العربية
            </button>
            <button
              class={`toggle-btn ${settings.language === 'en' ? 'active' : ''}`}
              onClick={() => updateSetting('language', 'en')}
            >
              English
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: '700' }}>{i18n.t('appearance')}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--m3-text-muted)' }}>الألوان والمظهر</div>
          </div>
          <div class="view-mode-toggle">
            <button
              class={`toggle-btn ${settings.theme === 'light' ? 'active' : ''}`}
              onClick={() => updateSetting('theme', 'light')}
            >
              {i18n.t('theme_light')}
            </button>
            <button
              class={`toggle-btn ${settings.theme === 'dark' ? 'active' : ''}`}
              onClick={() => updateSetting('theme', 'dark')}
            >
              {i18n.t('theme_dark')}
            </button>
            <button
              class={`toggle-btn ${settings.theme === 'amoled' ? 'active' : ''}`}
              onClick={() => updateSetting('theme', 'amoled')}
            >
              AMOLED
            </button>
          </div>
        </div>
      </div>

      <div class="stats-chart-card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span class="material-symbols-rounded">notifications_active</span>
          <span>{i18n.t('sounds_alerts')}</span>
        </h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: '700' }}>{i18n.t('alarm_sound')}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--m3-text-muted)' }}>نغمات هادئة للمذاكرة</div>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <select
              class="m3-input"
              style={{ width: 'auto', padding: '0.4rem 0.8rem' }}
              value={settings.alarmSound || 'zen-bowl'}
              onChange={(e) => {
                updateSetting('alarmSound', e.target.value);
                handleTestSound(e.target.value);
              }}
            >
              <option value="zen-bowl">Zen Bowl (وعاء التبت)</option>
              <option value="bell">Crystal Bell (جرس نقي)</option>
              <option value="marimba">Soft Marimba (ماريمبا)</option>
              <option value="gong">Meditative Gong (جونغ)</option>
              <option value="digital">Digital Beep (رقمي)</option>
            </select>
            <button
              class="m3-action-btn"
              title="تجربة الصوت"
              onClick={() => handleTestSound(settings.alarmSound || 'zen-bowl')}
            >
              <span class="material-symbols-rounded" style={{ fontSize: '18px' }}>volume_up</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: '700' }}>{i18n.t('browser_notifications')}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--m3-text-muted)' }}>إشعارات التنبيهات أثناء فتح الموقع</div>
          </div>
          <button
            class="m3-btn-secondary"
            onClick={async () => {
              const granted = await notificationService.requestPermission();
              alert(granted ? 'تم تفعيل الإشعارات بنجاح!' : 'يرجى السماح بالإشعارات في إعدادات المتصفح.');
            }}
          >
            طلب الإذن (Permission)
          </button>
        </div>
      </div>

      <div class="stats-chart-card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span class="material-symbols-rounded">timer</span>
          <span>فترات مؤقت التركيز (Timer Durations)</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: '700' }}>{i18n.t('focus')} (د)</label>
            <input
              type="number"
              min="1"
              max="120"
              class="m3-input"
              value={settings.focusTime}
              onChange={(e) => updateSetting('focusTime', Number(e.target.value))}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: '700' }}>{i18n.t('short_break')} (د)</label>
            <input
              type="number"
              min="1"
              max="60"
              class="m3-input"
              value={settings.shortBreakTime}
              onChange={(e) => updateSetting('shortBreakTime', Number(e.target.value))}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: '700' }}>{i18n.t('long_break')} (د)</label>
            <input
              type="number"
              min="1"
              max="60"
              class="m3-input"
              value={settings.longBreakTime}
              onChange={(e) => updateSetting('longBreakTime', Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div class="stats-chart-card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span class="material-symbols-rounded">cloud_download</span>
          <span>{i18n.t('backup_data')}</span>
        </h3>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button class="m3-btn-secondary" onClick={() => handleExportData('json')}>
            <span class="material-symbols-rounded" style={{ fontSize: '18px', verticalAlign: 'middle' }}>download</span>
            <span>{i18n.t('export_json')}</span>
          </button>
          <button class="m3-btn-secondary" onClick={() => handleExportData('csv')}>
            <span class="material-symbols-rounded" style={{ fontSize: '18px', verticalAlign: 'middle' }}>table_view</span>
            <span>{i18n.t('export_csv')}</span>
          </button>

          {exportUrl && (
            <a
              href={exportUrl}
              download={exportFilename}
              class="m3-btn-primary"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <span class="material-symbols-rounded" style={{ fontSize: '18px' }}>save_alt</span>
              <span>تحميل الملف الجاهز</span>
            </a>
          )}
        </div>
      </div>

      <div class="stats-chart-card" style={{ borderColor: 'var(--m3-error)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--m3-error)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span class="material-symbols-rounded">warning</span>
          <span>{i18n.t('account')}</span>
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--m3-text-secondary)' }}>
          سيتم مسح كافة البيانات المخزنة من مهام وملاحظات وعادات وإحصائيات نهائياً.
        </p>
        <div>
          <button class="m3-btn-danger" onClick={handleDeleteAccount}>
            <span class="material-symbols-rounded" style={{ fontSize: '18px', verticalAlign: 'middle' }}>delete_forever</span>
            <span>{i18n.t('delete_account')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
