import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform(val => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URLS: z.string().default('http://localhost:5173,http://localhost:3000'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/aidms'),
  JWT_ACCESS_SECRET: z.string().min(16).default('aidms_super_secure_jwt_access_secret_key_2026_production'),
  JWT_REFRESH_SECRET: z.string().min(16).default('aidms_super_secure_jwt_refresh_secret_key_2026_production'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  AI_PROVIDER: z.enum(['gemini', 'openai', 'local']).default('local'),
  AI_API_KEY: z.string().optional().default(''),
  AI_MODEL: z.string().default('gemini-1.5-flash'),
  EMBEDDING_MODEL: z.string().default('text-embedding-004'),
  SIMILARITY_THRESHOLD: z.string().default('0.78').transform(val => parseFloat(val)),
  AUTO_GROUP_THRESHOLD: z.string().default('0.85').transform(val => parseFloat(val)),
  MAX_FILE_SIZE_MB: z.string().default('15').transform(val => parseInt(val, 10)),
  UPLOAD_DIR: z.string().default('uploads'),
  STORAGE_PROVIDER: z.enum(['local', 'cloudinary', 's3']).default('local'),
  DEFAULT_COLLEGE_NAME: z.string().default('Apex Institute of Technology'),
  ALLOWED_EMAIL_DOMAINS: z.string().default('apex.edu,student.apex.edu,faculty.apex.edu')
});

let parsedEnv;
try {
  parsedEnv = envSchema.parse(process.env);
} catch (error) {
  console.error('Invalid environment variables:', error.errors);
  process.exit(1);
}

export const env = parsedEnv;
export const clientOrigins = env.CLIENT_URLS.split(',').map(url => url.trim());
export const allowedEmailDomains = env.ALLOWED_EMAIL_DOMAINS.split(',').map(d => d.trim().toLowerCase());
