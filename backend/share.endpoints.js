// Share endpoints (in-memory). Import and call with your Express app instance.
// Usage in server.js:
//   const shareRoutes = require('./share.endpoints');
//   shareRoutes(app);

const { randomBytes } = require('crypto');

module.exports = function initShareEndpoints(app){
  const shares = new Map(); // id -> { data, createdAt }

  function genId(n = 10){
    return randomBytes(n).toString('base64').replace(/[+/=]/g, '').slice(0, n);
  }

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
    res.json({ data: rec.data });
  });
};
