// Математичний всесвіт — бекенд (Node 18+, без залежностей). Запуск: node server.js
const http = require('http'), fs = require('fs'), path = require('path');
const DIR = process.env.DATA_DIR || __dirname; fs.mkdirSync(path.join(DIR, 'backups'), { recursive: true });
const DB = path.join(DIR, 'data.json');
let db = {};
try { db = JSON.parse(fs.readFileSync(DB, 'utf8')); } catch {}
const save = () => { fs.writeFileSync(DB + '.tmp', JSON.stringify(db, null, 1)); fs.renameSync(DB + '.tmp', DB); fs.copyFileSync(DB, path.join(DIR, 'backups', 'data-' + new Date().toISOString().slice(0, 10) + '.json')); };

http.createServer((req, res) => {
  const send = (o, s = 200) => { res.writeHead(s, { 'Content-Type': 'application/json;charset=utf-8' }); res.end(JSON.stringify(o)); };
  if (req.method === 'GET' && req.url === '/') {
    return fs.readFile(path.join(__dirname, 'index.html'), (e, d) => {
      res.writeHead(e ? 500 : 200, { 'Content-Type': 'text/html;charset=utf-8' }); res.end(d);
    });
  }
  const jm = req.url.split('?')[0].match(/^\/([\w-]+\.js)$/);
  if (req.method === 'GET' && jm && jm[1] !== 'server.js') {
    return fs.readFile(path.join(__dirname, jm[1]), (e, d) => {
      res.writeHead(e ? 404 : 200, { 'Content-Type': 'text/javascript;charset=utf-8' }); res.end(d);
    });
  }
  if (req.method === 'GET' && req.url === '/api/students') return send(Object.values(db).map(s => s.name));
  if (req.method === 'POST' && req.url.startsWith('/api/')) {
    let b = '';
    req.on('data', c => { b += c; if (b.length > 5e6) req.destroy(); });
    req.on('end', () => {
      try {
        const j = JSON.parse(b), name = String(j.name || '').trim().slice(0, 40);
        if (!name) return send({ error: 'name' }, 400);
        const id = name.toLowerCase();
        if (req.url === '/api/login') { db[id] = db[id] || { name, data: null }; save(); return send(db[id]); }
        if (req.url === '/api/delete') { delete db[id]; save(); return send({ ok: true }); }
        if (req.url === '/api/save') { const s = db[id]; if (!s) return send({ error: 'no student' }, 404); s.data = j.data; save(); return send({ ok: true }); }
        send({ error: 'not found' }, 404);
      } catch { send({ error: 'bad request' }, 400); }
    });
    return;
  }
  res.writeHead(404); res.end();
}).listen(process.env.PORT || 3000, () => console.log('Відкрийте http://localhost:' + (process.env.PORT || 3000)));
