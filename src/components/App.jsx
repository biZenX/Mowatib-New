import React, { useState, useEffect } from 'react';
import { i18n } from '../services/i18n.js';
import { storageService } from '../services/storage.js';
import { audioService } from '../services/audio.js';
import { notificationService } from '../services/notifications.js';
import { TasksView } from './tasks/TasksView.jsx';
import { NotesView } from './notes/NotesView.jsx';
import { HabitsView } from './habits/HabitsView.jsx';
import { TimerView } from './timer/TimerView.jsx';
import { StatsView } from './stats/StatsView.jsx';
import { TrashView } from './trash/TrashView.jsx';
import { SettingsView } from './settings/SettingsView.jsx';
import { PaywallModal } from './paywall/PaywallModal.jsx';
import { AuthModal } from './auth/AuthModal.jsx';
import { NotificationCenter, LiveNotificationToast } from './notifications/NotificationCenter.jsx';

export function App() {
  const [currentView, setCurrentView] = useState('timer');
  const [showPaywall, setShowPaywall] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeLiveNotif, setActiveLiveNotif] = useState(null);
  const [unreadCount, setUnreadCount] = useState(() => {
    const notifs = storageService.getNotifications();
    return notifs.filter(n => !n.isRead).length;
  });
  const [tick, setTick] = useState(0);

  const isPremium = storageService.settings.isPremium;
  const isAr = i18n.isRTL();

  useEffect(() => {
    const s = storageService.settings;
    i18n.setLanguage(s.language || 'ar');
    document.body.setAttribute('data-theme', s.theme || 'light');
    document.documentElement.dir = (s.language || 'ar') === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = s.language || 'ar';

    const unsubscribe = notificationService.addListener((notif) => {
      setActiveLiveNotif(notif);
      setUnreadCount(prev => prev + 1);
      setTimeout(() => {
        setActiveLiveNotif(null);
      }, 6000);
    });

    return () => unsubscribe();
  }, []);

  const handleSwitchView = (viewName) => {
    audioService.playClick();
    setCurrentView(viewName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLanguageToggle = () => {
    audioService.playClick();
    const nextLang = i18n.currentLang === 'ar' ? 'en' : 'ar';
    i18n.setLanguage(nextLang);
    storageService.saveSettings({ language: nextLang });
    setTick(t => t + 1);
  };

  const handleThemeToggle = () => {
    audioService.playClick();
    const currentTheme = storageService.settings.theme || 'light';
    const nextTheme = currentTheme === 'light' ? 'dark' : currentTheme === 'dark' ? 'amoled' : 'light';
    storageService.saveSettings({ theme: nextTheme });
    document.body.setAttribute('data-theme', nextTheme);
    setTick(t => t + 1);
  };

  return (
    <div class="app-root">
      <div class="app-shell">
        <header class="app-header">
          <div class="brand-wrapper" onClick={() => handleSwitchView('timer')}>
            <h1 class="brand-title">{i18n.t('app_name')}</h1>
          </div>

          <nav class="desktop-nav-tabs">
            {[
              { id: 'tasks', icon: 'task_alt', label: i18n.t('nav_tasks') },
              { id: 'notes', icon: 'sticky_note_2', label: i18n.t('nav_notes') },
              { id: 'habits', icon: 'local_fire_department', label: i18n.t('nav_habits') },
              { id: 'timer', icon: 'timer', label: i18n.t('nav_timer') },
              { id: 'stats', icon: 'query_stats', label: i18n.t('nav_stats') },
              { id: 'trash', icon: 'delete', label: i18n.t('nav_trash') },
              { id: 'settings', icon: 'settings', label: i18n.t('nav_settings') }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                class={`desktop-nav-btn ${currentView === tab.id ? 'active' : ''}`}
                onClick={() => handleSwitchView(tab.id)}
              >
                <span class="material-symbols-rounded" style={{ fontSize: '19px' }}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <div class="header-actions">
            <button
              class="m3-action-btn"
              onClick={() => setShowNotifications(true)}
              title="Notifications"
              style={{ position: 'relative' }}
            >
              <span class="material-symbols-rounded" style={{ fontSize: '19px' }}>notifications</span>
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: 'var(--m3-error)',
                    color: '#ffffff',
                    fontSize: '0.68rem',
                    fontWeight: '800',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid var(--m3-surface)'
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              class={`m3-action-btn ${isPremium ? 'pro-badge' : ''}`}
              onClick={() => setShowPaywall(true)}
              title="Mowatib Premium"
            >
              <span class="material-symbols-rounded" style={{ fontSize: '18px', color: isPremium ? '#000000' : '#FFA000' }}>
                workspace_premium
              </span>
              <span>{isPremium ? 'PRO' : 'FREE'}</span>
            </button>

            <button class="m3-action-btn" onClick={handleLanguageToggle}>
              {isAr ? 'EN' : 'عربي'}
            </button>

            <button class="m3-action-btn" onClick={handleThemeToggle}>
              <span class="material-symbols-rounded" style={{ fontSize: '18px' }}>
                {storageService.settings.theme === 'light' ? 'dark_mode' : 'light_mode'}
              </span>
            </button>

            <button class="m3-action-btn" onClick={() => setShowAuth(true)}>
              <span class="material-symbols-rounded" style={{ fontSize: '18px' }}>account_circle</span>
            </button>
          </div>
        </header>

        <main class="viewport-panel-container">
          {currentView === 'tasks' && <TasksView onOpenPaywall={() => setShowPaywall(true)} />}
          {currentView === 'notes' && <NotesView />}
          {currentView === 'habits' && <HabitsView onOpenPaywall={() => setShowPaywall(true)} />}
          {currentView === 'timer' && <TimerView />}
          {currentView === 'stats' && <StatsView onOpenPaywall={() => setShowPaywall(true)} />}
          {currentView === 'trash' && <TrashView onRefresh={() => setTick(t => t + 1)} />}
          {currentView === 'settings' && (
            <SettingsView
              onLanguageChange={() => setTick(t => t + 1)}
              onThemeChange={() => setTick(t => t + 1)}
              onOpenPaywall={() => setShowPaywall(true)}
              onAccountDeleted={() => { setTick(t => t + 1); setCurrentView('timer'); }}
            />
          )}
        </main>

        <nav class="bottom-docked-nav">
          {[
            { id: 'tasks', icon: 'task_alt', label: i18n.t('nav_tasks') },
            { id: 'notes', icon: 'sticky_note_2', label: i18n.t('nav_notes') },
            { id: 'timer', icon: 'timer', label: i18n.t('nav_timer') },
            { id: 'habits', icon: 'local_fire_department', label: i18n.t('nav_habits') },
            { id: 'stats', icon: 'query_stats', label: i18n.t('nav_stats') },
            { id: 'settings', icon: 'settings', label: i18n.t('nav_settings') }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              class={`bottom-tab-item ${currentView === tab.id ? 'active' : ''}`}
              onClick={() => handleSwitchView(tab.id)}
            >
              <div class="tab-icon-pill">
                <span class="material-symbols-rounded">{tab.icon}</span>
              </div>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <LiveNotificationToast
          notification={activeLiveNotif}
          onDismiss={() => setActiveLiveNotif(null)}
        />

        {showNotifications && (
          <NotificationCenter
            onClose={() => setShowNotifications(false)}
            onNotificationCountChange={(cnt) => setUnreadCount(cnt)}
          />
        )}

        {showPaywall && (
          <PaywallModal
            onClose={() => setShowPaywall(false)}
            onTierChanged={() => setTick(t => t + 1)}
          />
        )}

        {showAuth && (
          <AuthModal
            onClose={() => setShowAuth(false)}
          />
        )}
      </div>
    </div>
  );
}
