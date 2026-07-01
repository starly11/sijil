import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
console.log('Current directory:', __dirname);
console.log('Loading .env from:', path.resolve(__dirname, '.env'));
dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅' : '❌');
console.log('REDIS_URL:', process.env.REDIS_URL ? '✅' : '❌');
