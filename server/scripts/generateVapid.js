import webpush from 'web-push';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔐 Generating VAPID keys for HealthOS...\n');

const vapidKeys = webpush.generateVAPIDKeys();

const keys = {
  publicKey: vapidKeys.publicKey,
  privateKey: vapidKeys.privateKey
};

// Save to file
const filePath = join(__dirname, 'vapid-keys.json');
writeFileSync(filePath, JSON.stringify(keys, null, 2));

console.log('✅ VAPID keys generated and saved to vapid-keys.json\n');
console.log('📝 Add these to your server and frontend config:\n');
console.log('Public Key (for frontend):');
console.log(vapidKeys.publicKey);
console.log('\nPrivate Key (for server):');
console.log(vapidKeys.privateKey);
console.log('\n⚠️  Keep your private key secret! Do not commit to version control.');