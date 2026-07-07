function sendHealth(req, res) {
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
