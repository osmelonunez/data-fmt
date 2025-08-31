// Share endpoints (in-memory). Import and call with your Express app instance.
// Usage in server.js:
//   const shareRoutes = require('./share.endpoints');
//   shareRoutes(app);

const { randomBytes } = require('crypto');

module.exports = function initShareEndpoints(app){
  const shares = new Map(); // id -> { data, createdAt }
  const TTL_MS = 1000 * 60 * 60 * 24; // expire shares after 24h

  function genId(n = 10){
    return randomBytes(n).toString('base64').replace(/[+/=]/g, '').slice(0, n);
  }

  // Periodically clean up expired shares
  setInterval(() => {
    const now = Date.now();
    for (const [id, { createdAt }] of shares.entries()) {
      if (now - createdAt >= TTL_MS) shares.delete(id);
    }
  }, TTL_MS);

  app.post('/share', (req, res) => {
    const data = typeof req.body?.data === 'string' ? req.body.data : '';
    if (!data) return res.status(400).json({ error: 'data required' });
    const id = genId(10);
    shares.set(id, { data, createdAt: Date.now() });
    res.json({ id });
  });

  app.get('/share/:id', (req, res) => {
    const rec = shares.get(req.params.id);
    if (!rec) return res.status(404).json({ error: 'not found' });
    if (Date.now() - rec.createdAt >= TTL_MS) {
      shares.delete(req.params.id);
      return res.status(404).json({ error: 'not found' });
    }
    res.json({ data: rec.data });
  });
};
