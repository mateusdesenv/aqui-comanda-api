let appInstance = null;
let connectDatabaseFn = null;
let connectionPromise = null;

function getAllowedOrigins() {
  return (process.env.CORS_ORIGIN || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function applyCors(req, res) {
  const requestOrigin = req.headers && req.headers.origin;
  const allowedOrigins = getAllowedOrigins();

  if (requestOrigin && (allowedOrigins.includes('*') || allowedOrigins.includes(requestOrigin))) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    req.headers && req.headers['access-control-request-headers']
      ? req.headers['access-control-request-headers']
      : 'Authorization,Content-Type',
  );
  res.setHeader('Access-Control-Max-Age', '86400');
}

function getRequestPath(req) {
  try {
    return new URL(req.url || '/', 'http://localhost').pathname;
  } catch (_error) {
    return req.url || '/';
  }
}

function isStatusRoute(req) {
  const path = getRequestPath(req);
  return (
    path === '/' ||
    path === '/health' ||
    path === '/api' ||
    path === '/api/' ||
    path === '/api/health' ||
    path === '/api/index' ||
    path === '/api/index/'
  );
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

function scrubErrorMessage(message) {
  return String(message || '')
    .replace(/mongodb(\+srv)?:\/\/[^@]+@/gi, 'mongodb$1://<credentials>@')
    .replace(/-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/g, '<private-key>');
}

function getBootstrapFailureReason(error) {
  const name = error && error.name ? error.name : '';
  const message = error && error.message ? error.message : '';

  if (message.includes('Configuracao de ambiente invalida')) {
    return 'ENVIRONMENT_INVALID';
  }

  if (name.includes('Mongo') || message.toLowerCase().includes('mongodb') || message.toLowerCase().includes('mongo')) {
    return 'DATABASE_CONNECTION_FAILED';
  }

  if (message.includes('Cannot find module')) {
    return 'BUILD_ARTIFACT_MISSING';
  }

  return 'BOOTSTRAP_FAILED';
}

function getSafeBootstrapDetails(error, reason) {
  if (!error || !error.message) {
    return undefined;
  }

  const message = scrubErrorMessage(error.message);

  if (reason === 'ENVIRONMENT_INVALID') {
    return message.replace(/^Configuracao de ambiente invalida:\s*/i, '');
  }

  return message;
}

function getSafeErrorName(error) {
  return error && error.name ? String(error.name) : undefined;
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
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    return sendNoContent(res);
  }

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
    const reason = getBootstrapFailureReason(error);
    console.error('[vercel] Falha ao processar requisicao:', {
      reason,
      name: error && error.name ? error.name : undefined,
      code: error && error.code ? error.code : undefined,
      message: error && error.message ? scrubErrorMessage(error.message) : error,
    });

    return res.status(500).json({
      success: false,
      message: 'Falha ao iniciar a API',
      code: 'API_BOOTSTRAP_FAILED',
      reason,
      errorName: getSafeErrorName(error),
      details: getSafeBootstrapDetails(error, reason),
    });
  }
};
