import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorMiddleware } from './middlewares/error.middleware';
import { routes } from './routes';

export const app = express();

const corsOrigins = env.CORS_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowAnyCorsOrigin = corsOrigins.includes('*');

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowAnyCorsOrigin || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

function getStatusPayload() {
  return {
    success: true,
    data: {
      status: 'online',
      service: 'Aqui Comanda API',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    },
    message: 'API online',
  };
}

app.get('/', (_req, res) => {
  res.json(getStatusPayload());
});

app.get('/health', (_req, res) => {
  res.json(getStatusPayload());
});

app.get('/api/health', (_req, res) => {
  res.json(getStatusPayload());
});

app.get('/favicon.ico', (_req, res) => {
  res.status(204).end();
});

app.use('/api', routes);
app.use(errorMiddleware);

export default app;
