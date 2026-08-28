import webpush from 'web-push';
import fs from 'fs';
import path from 'path';

// Read .env file
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  const env = {};
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [k, ...v] = trimmed.split('=');
        env[k.trim()] = v.join('=').trim();
      }
    }
  }
  return env;
}

const env = loadEnv();
const publicKey = env.VITE_VAPID_PUBLIC_KEY;
const privateKey = env.VAPID_PRIVATE_KEY;
const subject = env.VAPID_SUBJECT || 'mailto:admin@mowatib.app';

if (!publicKey || !privateKey) {
  console.error('❌ Error: VAPID keys not found in .env');
  process.exit(1);
}

webpush.setVapidDetails(subject, publicKey, privateKey);

console.log('✅ WebPush VAPID configured successfully.');
console.log(`Public Key: ${publicKey.substring(0, 16)}...`);

const title = process.argv[2] || 'تنبيه تركيز من مواظب! 🎯';
const body = process.argv[3] || 'حان وقت بدء جلسة بومودورو جديدة لإنجاز مهامك الدراسية.';

console.log(`\n📢 Push Payload:`);
console.log(`Title: ${title}`);
console.log(`Body: ${body}`);
console.log('\n💡 Push notifications are sent to all active browser subscriptions when the app is open.');
