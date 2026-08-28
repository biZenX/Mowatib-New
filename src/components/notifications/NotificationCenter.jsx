import React, { useState, useEffect } from 'react';
import { i18n } from '../../services/i18n.js';
import { storageService } from '../../services/storage.js';
import { notificationService } from '../../services/notifications.js';
import { audioService } from '../../services/audio.js';

export function NotificationCenter({ onClose, onNotificationCountChange }) {
  const [notifications, setNotifications] = useState(() => storageService.getNotifications());
  const [permStatus, setPermStatus] = useState(() => notificationService.getPermissionStatus());
  const [feedbackMsg, setFeedbackMsg] = useState('');

  useEffect(() => {
    storageService.markAllNotificationsRead();
    if (onNotificationCountChange) onNotificationCountChange(0);
  }, []);

  const handleRequestPermission = async () => {
    setFeedbackMsg('');
    const res = await notificationService.requestPermission();
    const status = notificationService.getPermissionStatus();
    setPermStatus(status);

    if (res.granted || status === 'granted') {
      setFeedbackMsg('تم تفعيل الإشعارات بنجاح! 🎉');
      handleSendTestNotification('تم تفعيل إشعارات المتصفح بنجاح! 🔔', 'ستتلقى الآن تنبيهات المهام وجلسات التركيز من مواظب.');
    } else if (status === 'denied') {
      setFeedbackMsg('⚠️ المتصفح قام بحظر الإشعارات لهذا الموقع سابقاً. يرجى الضغط على أيقونة القفل أو الإعدادات 🔒 بجانب رابط الموقع بالأعلى واختيار "السماح بالإشعارات (Allow)".');
    }
  };

  const handleSendTestNotification = async (customTitle = null, customBody = null) => {
    audioService.playAlarm(storageService.settings.alarmSound || 'zen-bowl');
    
    const title = customTitle || 'تنبيه تجريبي من مواظب! 🎯';
    const body = customBody || 'حان موعد التركيز ومراجعة جدول المذاكرة اليومي.';

    const notif = notificationService.notify(title, { body });
    storageService.addNotification(notif);
    setNotifications([...storageService.getNotifications()]);

    if (notificationService.currentSubscription) {
      await notificationService.sendServerWebPush(title, body);
    }
  };

  const handleClearAll = () => {
    storageService.clearNotifications();
    setNotifications([]);
    if (onNotificationCountChange) onNotificationCountChange(0);
  };

  const formatTimeAgo = (isoString) => {
    try {
      const ms = Date.now() - new Date(isoString).getTime();
      const mins = Math.floor(ms / 60000);
      if (mins < 1) return 'الآن';
      if (mins < 60) return `منذ ${mins} دقيقة`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `منذ ${hours} ساعة`;
      const days = Math.floor(hours / 24);
      return `منذ ${days} يوم`;
    } catch (e) {
      return '';
    }
  };

  return (
    <div class="m3-modal-backdrop" onClick={onClose}>
      <div class="m3-modal-card" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <div class="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span class="material-symbols-rounded" style={{ fontSize: '26px', color: 'var(--m3-primary)' }}>notifications</span>
            <h2 class="modal-title">الإشعارات والتنبيهات (Push Notifications)</h2>
          </div>
          <button class="m3-action-btn" onClick={onClose}>
            <span class="material-symbols-rounded">close</span>
          </button>
        </div>

        <div class="modal-body">
          <div style={{ background: 'var(--m3-surface-container)', padding: '0.85rem 1rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: '800' }}>
                حالة إشعارات المتصفح
              </div>
              <div style={{ fontSize: '0.8rem', color: permStatus === 'granted' ? 'var(--m3-primary)' : permStatus === 'denied' ? 'var(--m3-error)' : 'var(--m3-text-muted)', marginTop: '0.1rem', fontWeight: '700' }}>
                {permStatus === 'granted' ? 'مفعلة بنجاح (Allowed) ✅' : permStatus === 'denied' ? 'محظورة في إعدادات المتصفح (Blocked) ❌' : 'تحتاج للموافقة (Click to allow) ⚠️'}
              </div>
            </div>

            {permStatus !== 'granted' ? (
              <button class="m3-btn-primary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.84rem' }} onClick={handleRequestPermission}>
                تفعيل الإشعارات
              </button>
            ) : (
              <span class="material-symbols-rounded" style={{ color: 'var(--m3-primary)', fontSize: '28px' }}>check_circle</span>
            )}
          </div>

          {(permStatus === 'denied' || feedbackMsg) && (
            <div style={{ background: permStatus === 'denied' ? 'var(--m3-error-container)' : 'var(--m3-primary-container)', color: permStatus === 'denied' ? 'var(--m3-error)' : 'var(--m3-on-primary-container)', padding: '0.75rem 1rem', borderRadius: '14px', fontSize: '0.85rem', lineHeight: '1.5', fontWeight: '600' }}>
              {feedbackMsg || '⚠️ المتصفح منع طلب الإذن تلقائياً لأن الإشعارات محظورة. لإتاحتها: اضغط على أيقونة الإعدادات/القفل 🔒 بجانب رابط الصفحة في شريط المتصفح، ثم اختر السماح بالإشعارات (Allow)، ثم أعد تحميل الصفحة.'}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between' }}>
            <button
              type="button"
              class="m3-btn-secondary"
              style={{ flex: 1, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
              onClick={() => handleSendTestNotification()}
            >
              <span class="material-symbols-rounded" style={{ fontSize: '18px' }}>send_to_mobile</span>
              <span>إرسال إشعار تجريبي (Test Push)</span>
            </button>

            {notifications.length > 0 && (
              <button
                type="button"
                class="m3-btn-secondary"
                style={{ fontSize: '0.85rem', color: 'var(--m3-error)' }}
                onClick={handleClearAll}
              >
                مسح السجل
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '260px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--m3-text-muted)' }}>
                <span class="material-symbols-rounded" style={{ fontSize: '36px', opacity: 0.5 }}>notifications_off</span>
                <p style={{ marginTop: '0.4rem', fontWeight: '700', fontSize: '0.9rem' }}>لا توجد إشعارات حالياً</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  style={{
                    background: 'var(--m3-surface-low)',
                    border: '1px solid var(--m3-outline)',
                    borderRadius: '14px',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: '800', color: 'var(--m3-text-main)' }}>
                      {n.title}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--m3-text-muted)', fontWeight: '600' }}>
                      {formatTimeAgo(n.timestamp)}
                    </span>
                  </div>
                  {n.body && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--m3-text-secondary)', lineHeight: '1.4' }}>
                      {n.body}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div class="modal-actions-row">
          <button class="m3-btn-secondary" onClick={onClose}>
            {i18n.t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function LiveNotificationToast({ notification, onDismiss }) {
  if (!notification) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        background: 'var(--m3-surface-highest)',
        color: 'var(--m3-text-main)',
        border: '1px solid var(--m3-primary)',
        borderRadius: '20px',
        padding: '0.85rem 1.25rem',
        boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem',
        maxWidth: '90vw',
        width: '420px',
        animation: 'slideNotificationDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--m3-primary)', color: 'var(--m3-on-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span class="material-symbols-rounded" style={{ fontSize: '22px' }}>notifications_active</span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--m3-text-main)' }}>
          {notification.title}
        </div>
        {notification.body && (
          <div style={{ fontSize: '0.82rem', color: 'var(--m3-text-secondary)', marginTop: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {notification.body}
          </div>
        )}
      </div>

      <button
        onClick={onDismiss}
        style={{ background: 'none', border: 'none', color: 'var(--m3-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
      >
        <span class="material-symbols-rounded" style={{ fontSize: '20px' }}>close</span>
      </button>
    </div>
  );
}
