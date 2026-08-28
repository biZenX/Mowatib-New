const CACHE_NAME = 'mowatib-v2.0.0';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Mowatib • مواظب', body: event.data ? event.data.text() : 'تنبيه جديد' };
  }

  const title = data.title || 'Mowatib • مواظب';
  const options = {
    body: data.body || 'تنبيه جديد من تطبيق مواظب للإنتاجية والتركيز.',
    icon: data.icon || '/favicon.svg',
    badge: data.badge || '/favicon.svg',
    vibrate: [200, 100, 200, 100, 400],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now()
    },
    actions: [
      { action: 'open_app', title: 'فتح التطبيق (Open)' },
      { action: 'dismiss', title: 'إغلاق (Dismiss)' }
    ],
    tag: data.tag || 'mowatib_push',
    renotify: true,
    requireInteraction: data.requireInteraction || false
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_PUSH_NOTIFICATION') {
    const { title, options } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, {
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        vibrate: [200, 100, 200, 100, 400],
        ...options
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
