const { app } = require('../dist/app');
const { connectDatabase } = require('../dist/database/connection');

let connectionPromise = null;

async function ensureDatabaseConnection() {
  if (!connectionPromise) {
    connectionPromise = connectDatabase().catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }

  await connectionPromise;
}

module.exports = async function handler(req, res) {
  try {
    await ensureDatabaseConnection();
    return app(req, res);
  } catch (error) {
    console.error('[vercel] Falha ao processar requisicao:', error && error.message ? error.message : error);
    return res.status(500).json({
      success: false,
      message: 'Falha ao iniciar a API',
      code: 'API_BOOTSTRAP_FAILED',
    });
  }
};
