import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import webpush from 'web-push';

function webPushPlugin() {
  let subscriptions = [];

  return {
    name: 'web-push-endpoint',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/push-subscribe' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const sub = JSON.parse(body);
              if (sub && sub.endpoint) {
                subscriptions = subscriptions.filter(s => s.endpoint !== sub.endpoint);
                subscriptions.push(sub);
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, count: subscriptions.length }));
            } catch (e) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }

        if (req.url === '/api/send-push' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const env = loadEnv('development', process.cwd(), '');
              const pubKey = env.VITE_VAPID_PUBLIC_KEY;
              const privKey = env.VAPID_PRIVATE_KEY;
              const subject = env.VAPID_SUBJECT || 'mailto:admin@mowatib.app';

              if (!pubKey || !privKey) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'VAPID keys not found in .env' }));
                return;
              }

              webpush.setVapidDetails(subject, pubKey, privKey);

              const pushPayload = JSON.stringify({
                title: payload.title || 'Mowatib • مواظب',
                body: payload.body || 'تنبيه جديد من تطبيق مواظب للإنتاجية والتركيز!',
                url: payload.url || '/',
                tag: payload.tag || 'mowatib_push',
                icon: '/favicon.svg',
                badge: '/favicon.svg'
              });

              const targetSub = payload.subscription;
              const targets = targetSub ? [targetSub] : subscriptions;

              if (targets.length === 0) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, message: 'No active push subscriptions found. Please enable notifications in the app first.' }));
                return;
              }

              const results = await Promise.allSettled(
                targets.map(sub => webpush.sendNotification(sub, pushPayload))
              );

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, sent: results.length, results }));
            } catch (e) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), basicSsl(), webPushPlugin()],
  server: {
    port: 3000,
    open: false,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
