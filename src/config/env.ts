import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ quiet: true });

const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  MONGO_URI: z.string().min(1, 'MONGO_URI e obrigatoria. Configure a conexao MongoDB no .env.'),
  MONGO_DB_NAME: z.string().default('aqui_comanda'),
  CORS_ORIGIN: z.string().default('http://localhost:4200'),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  LOG_LEVEL: z.string().default('debug'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const message = parsedEnv.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  throw new Error(`Configuracao de ambiente invalida: ${message}`);
}

export const env = parsedEnv.data;
export const isProduction = env.NODE_ENV === 'production';
