import { audioService } from './audio.js';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

class NotificationService {
  constructor() {
    this.wakeLock = null;
    this.scheduledTimeouts = new Map();
    this.listeners = new Set();
    this.swRegistration = null;
    this.currentSubscription = null;
    
    let savedFired = [];
    try {
      savedFired = JSON.parse(localStorage.getItem('mowatib_fired_reminders') || '[]');
    } catch (e) {}
    this.firedReminders = new Set(savedFired);

    this.initServiceWorker();
    this.startBackgroundMonitor();
  }

  async initServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        this.swRegistration = reg;
        await navigator.serviceWorker.ready;

        if (Notification.permission === 'granted') {
          await this.subscribeToPush();
        }
      } catch (err) {
        console.warn('Service Worker registration failed:', err);
      }
    }
  }

  addListener(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      return { status: 'unsupported', granted: false };
    }

    if (Notification.permission === 'granted') {
      await this.subscribeToPush();
      return { status: 'granted', granted: true };
    }

    if (Notification.permission === 'denied') {
      return { status: 'denied', granted: false };
    }

    try {
      let perm = null;
      const promise = Notification.requestPermission((p) => {
        perm = p;
      });

      if (promise && typeof promise.then === 'function') {
        perm = await promise;
      }

      if (perm === 'granted' || Notification.permission === 'granted') {
        await this.subscribeToPush();
        return { status: 'granted', granted: true };
      }

      return { status: perm || Notification.permission, granted: false };
    } catch (e) {
      console.warn('Permission request error:', e);
      return { status: Notification.permission, granted: Notification.permission === 'granted' };
    }
  }

  getPermissionStatus() {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  }

  async subscribeToPush() {
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!('serviceWorker' in navigator)) return null;

    try {
      const reg = await navigator.serviceWorker.ready;
      this.swRegistration = reg;

      let sub = await reg.pushManager.getSubscription();

      if (!sub && vapidKey) {
        const convertedVapidKey = urlBase64ToUint8Array(vapidKey);
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      }

      this.currentSubscription = sub;

      if (sub) {
        fetch('/api/push-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub)
        }).catch(err => console.warn('Could not register push subscription with backend:', err));
      }

      return sub;
    } catch (err) {
      console.warn('Push subscription failed:', err);
      return null;
    }
  }

  async sendServerWebPush(title = 'Mowatib • مواظب', body = 'تنبيه جديد من تطبيق مواظب!') {
    try {
      const res = await fetch('/api/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          subscription: this.currentSubscription
        })
      });
      return await res.json();
    } catch (e) {
      console.warn('Server push request failed:', e);
      return { error: e.message };
    }
  }

  notify(title, options = {}) {
    const notificationItem = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      body: options.body || '',
      icon: options.icon || '/favicon.svg',
      timestamp: new Date().toISOString(),
      isRead: false
    };

    this.listeners.forEach(cb => {
      try {
        cb(notificationItem);
      } catch (e) {
        console.error(e);
      }
    });

    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, {
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          vibrate: [200, 100, 200, 100, 400],
          data: { url: window.location.origin },
          ...options
        }).catch(err => {
          console.warn('Service worker showNotification error:', err);
          this.fallbackNotification(title, options);
        });
      }).catch(() => {
        this.fallbackNotification(title, options);
      });
    } else {
      this.fallbackNotification(title, options);
    }

    if (this.currentSubscription) {
      this.sendServerWebPush(title, options.body || '');
    }

    this.vibrate();

    return notificationItem;
  }

  fallbackNotification(title, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          ...options
        });
      } catch (e) {
        console.warn('Standard Notification fallback failed:', e);
      }
    }
  }

  vibrate(pattern = [200, 100, 200, 100, 400]) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        console.warn('Vibration failed:', e);
      }
    }
  }

  updateTitle(timeStr, modeLabel, isRunning) {
    if (isRunning && timeStr) {
      document.title = `(${timeStr}) ${modeLabel} • Mowatib`;
    } else {
      document.title = 'Mowatib • مواظب | Focus & Pomodoro Timer';
    }
  }

  getOffsetMs(remType) {
    if (remType === '15_mins') return 15 * 60 * 1000;
    if (remType === '30_mins') return 30 * 60 * 1000;
    if (remType === '1_hour') return 60 * 60 * 1000;
    if (remType === '1_day') return 24 * 60 * 60 * 1000;
    return 0;
  }

  getDueTimestamp(task) {
    if (!task.due_date) return null;
    const dateParts = task.due_date.split('-').map(Number);
    const due = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    if (task.due_time) {
      const [h, m] = task.due_time.split(':').map(Number);
      due.setHours(h, m, 0, 0);
    } else {
      due.setHours(9, 0, 0, 0);
    }
    return due.getTime();
  }

  triggerTaskReminder(task, remType) {
    audioService.playAlarm('zen-bowl');
    
    let remLabel = 'حان الآن موعد إنجاز المهمة!';
    if (remType === '15_mins') remLabel = 'تنبيه: متبقي ١٥ دقيقة على موعد المهمة!';
    else if (remType === '30_mins') remLabel = 'تنبيه: متبقي ٣٠ دقيقة على موعد المهمة!';
    else if (remType === '1_hour') remLabel = 'تنبيه: متبقي ساعة واحدة على موعد المهمة!';
    else if (remType === '1_day') remLabel = 'تنبيه: متبقي يوم واحد على موعد المهمة!';

    const notif = this.notify(`تنبيه موعد مهمة: ${task.title} ⏰`, {
      body: task.description || remLabel,
      tag: `task_rem_${task.id}_${remType}`
    });

    if (window._storageService) {
      window._storageService.addNotification(notif);
    }
  }

  scheduleTaskReminders(tasks) {
    this.scheduledTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    this.scheduledTimeouts.clear();

    const now = Date.now();

    tasks.forEach(task => {
      if (!task.due_date || task.status === 'done' || task.deleted_at) return;

      const remList = (task.reminders && task.reminders.length > 0) ? task.reminders : ['at_time'];
      const dueMs = this.getDueTimestamp(task);
      if (!dueMs) return;

      remList.forEach((rem) => {
        const targetTime = dueMs - this.getOffsetMs(rem);
        const delay = targetTime - now;
        const remKey = `${task.id}_${task.due_date}_${task.due_time || '09:00'}_${rem}`;

        if (this.firedReminders.has(remKey)) {
          return;
        }

        if (delay > 0 && delay < 7 * 24 * 60 * 60 * 1000) {
          const timerId = setTimeout(() => {
            this.firedReminders.add(remKey);
            this.saveFiredReminders();
            this.triggerTaskReminder(task, rem);
          }, delay);

          this.scheduledTimeouts.set(remKey, timerId);
        }
      });
    });
  }

  startBackgroundMonitor() {
    setInterval(() => {
      if (!window._storageService) return;
      const tasks = window._storageService.getActiveTasks();
      const now = Date.now();

      tasks.forEach(task => {
        if (!task.due_date || task.status === 'done' || task.deleted_at) return;
        const remList = (task.reminders && task.reminders.length > 0) ? task.reminders : ['at_time'];
        const dueMs = this.getDueTimestamp(task);
        if (!dueMs) return;

        remList.forEach((rem) => {
          const targetTime = dueMs - this.getOffsetMs(rem);
          const remKey = `${task.id}_${task.due_date}_${task.due_time || '09:00'}_${rem}`;

          if (now >= targetTime && now <= targetTime + 3 * 60 * 1000) {
            if (!this.firedReminders.has(remKey)) {
              this.firedReminders.add(remKey);
              this.saveFiredReminders();
              this.triggerTaskReminder(task, rem);
            }
          }
        });
      });
    }, 10000);
  }

  saveFiredReminders() {
    try {
      const arr = Array.from(this.firedReminders).slice(-100);
      localStorage.setItem('mowatib_fired_reminders', JSON.stringify(arr));
    } catch (e) {}
  }

  async requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
        });
      } catch (e) {
        console.warn('Wake Lock error:', e);
      }
    }
  }

  releaseWakeLock() {
    if (this.wakeLock) {
      this.wakeLock.release();
      this.wakeLock = null;
    }
  }
}

export const notificationService = new NotificationService();
