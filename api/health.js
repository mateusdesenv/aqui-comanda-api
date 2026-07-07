function getAllowedOrigins() {
  return (process.env.CORS_ORIGIN || 'http://localhost:4200')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function applyCors(req, res) {
  const requestOrigin = req.headers && req.headers.origin;
  const allowedOrigins = getAllowedOrigins();

  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
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

function sendHealth(req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const payload = {
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
  };

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'HEAD') {
    res.statusCode = 200;
    return res.end();
  }

  res.statusCode = 200;
  return res.end(JSON.stringify(payload));
}

module.exports = sendHealth;
