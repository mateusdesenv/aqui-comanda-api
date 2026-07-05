import { env } from './config/env';
import { connectDatabase } from './database/connection';
import { app } from './app';

async function bootstrap(): Promise<void> {
  await connectDatabase();

  app.listen(env.PORT, () => {
    console.log(`[server] Aqui Comanda API rodando na porta ${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('[server] Falha ao iniciar API:', error.message);
  process.exit(1);
});
