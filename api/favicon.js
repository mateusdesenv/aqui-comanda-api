function getAllowedOrigins() {
  return (process.env.CORS_ORIGIN || '*')
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

module.exports = function favicon(req, res) {
  applyCors(req, res);

  res.statusCode = 204;
  return res.end();
};
