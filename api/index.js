let appInstance = null;
let connectDatabaseFn = null;
let connectionPromise = null;

function getRequestPath(req) {
  try {
    return new URL(req.url || '/', 'http://localhost').pathname;
  } catch (_error) {
    return req.url || '/';
  }
}

function isStatusRoute(req) {
  const path = getRequestPath(req);
  return path === '/' || path === '/health' || path === '/api/health' || path === '/api/index' || path === '/api/index/';
}

function isFaviconRoute(req) {
  const path = getRequestPath(req);
  return path === '/favicon.ico' || path === '/api/favicon.ico';
}

function sendNoContent(res) {
  res.statusCode = 204;
  return res.end();
}

function sendStatus(req, res) {
  if (req.method === 'HEAD') {
    res.statusCode = 200;
    return res.end();
  }

  return res.status(200).json({
    success: true,
    data: {
      status: 'online',
      service: 'Aqui Comanda API',
      runtime: 'vercel',
      environment: process.env.NODE_ENV || 'production',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    },
    message: 'API online',
  });
}

function loadApp() {
  if (!appInstance || !connectDatabaseFn) {
    const appModule = require('../dist/app');
    const connectionModule = require('../dist/database/connection');

    appInstance = appModule.app;
    connectDatabaseFn = connectionModule.connectDatabase;
  }
}

async function ensureDatabaseConnection() {
  loadApp();

  if (!connectionPromise) {
    connectionPromise = connectDatabaseFn().catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }

  await connectionPromise;
}

module.exports = async function handler(req, res) {
  if (isFaviconRoute(req)) {
    return sendNoContent(res);
  }

  if (isStatusRoute(req)) {
    return sendStatus(req, res);
  }

  try {
    await ensureDatabaseConnection();
    return appInstance(req, res);
  } catch (error) {
    console.error('[vercel] Falha ao processar requisicao:', error && error.message ? error.message : error);
    return res.status(500).json({
      success: false,
      message: 'Falha ao iniciar a API',
      code: 'API_BOOTSTRAP_FAILED',
    });
  }
};
