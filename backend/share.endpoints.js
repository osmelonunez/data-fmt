// Share endpoints with simple file persistence. Import and call with your Express app instance.
// Usage in server.js:
//   const shareRoutes = require('./share.endpoints');
//   shareRoutes(app);

const { randomBytes } = require('crypto');
const fs = require('fs');
const path = require('path');

module.exports = function initShareEndpoints(app){
  const DATA_FILE = path.join(__dirname, 'shares.json');
  let shares = new Map(); // id -> { data, createdAt }

  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const obj = JSON.parse(raw);
    shares = new Map(Object.entries(obj));
  } catch {
    shares = new Map();
  }

  const TTL_MS = Number(process.env.SHARE_TTL_MS) || 1000 * 60 * 60 * 24; // default 24h
  const MAX_LEN = Number(process.env.SHARE_MAX_LEN) || 300 * 1024; // default 300 KB

  function persist(){
    fs.writeFileSync(DATA_FILE, JSON.stringify(Object.fromEntries(shares)), 'utf8');
  }

  function genId(n = 10){
    return randomBytes(n).toString('base64').replace(/[+/=]/g, '').slice(0, n);
  }

  // Periodically clean up expired shares
  setInterval(() => {
    const now = Date.now();
    let changed = false;
    for (const [id, { createdAt }] of shares.entries()) {
      if (now - createdAt >= TTL_MS) {
        shares.delete(id);
        changed = true;
      }
    }
    if (changed) persist();
  }, TTL_MS);

  app.post('/share', (req, res) => {
    const data = typeof req.body?.data === 'string' ? req.body.data : '';
    if (!data) return res.status(400).json({ error: 'data required' });
    if (data.length > MAX_LEN) {
      return res.status(400).json({ error: `data too large (max ${Math.floor(MAX_LEN/1024)}KB)` });
    }
    const id = genId(10);
    shares.set(id, { data, createdAt: Date.now() });
    persist();
    res.json({ id });
  });

  app.get('/share/:id', (req, res) => {
    const rec = shares.get(req.params.id);
    if (!rec) return res.status(404).json({ error: 'not found' });
    if (Date.now() - rec.createdAt >= TTL_MS) {
      shares.delete(req.params.id);
      persist();
      return res.status(404).json({ error: 'not found' });
    }
    res.json({ data: rec.data });
  });

  // Ensure expired entries from previous runs are cleared on startup
  setImmediate(() => {
    const now = Date.now();
    let changed = false;
    for (const [id, { createdAt }] of shares.entries()) {
      if (now - createdAt >= TTL_MS) {
        shares.delete(id);
        changed = true;
      }
    }
    if (changed) persist();
  });
};
