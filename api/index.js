const fs = require('fs');

const DB_FILE = '../db.json';

function readDB() {
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ sabores: [], pedidos: [] }, null, 2));
  return JSON.parse(fs.readFileSync(DB_FILE));
}
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

module.exports = (req, res) => {
  // Sabores
  if (req.method === 'GET' && req.url === '/sabores') {
    const db = readDB();
    res.status(200).json(db.sabores);
    return;
  }
  if (req.method === 'POST' && req.url === '/sabores') {
    const db = readDB();
    const sabor = { ...req.body, id: Date.now() };
    db.sabores.push(sabor);
    writeDB(db);
    res.status(200).json(sabor);
    return;
  }
  if (req.method === 'DELETE' && req.url.startsWith('/sabores/')) {
    const id = req.url.split('/').pop();
    const db = readDB();
    db.sabores = db.sabores.filter(s => s.id != id);
    writeDB(db);
    res.status(204).end();
    return;
  }
  // Pedidos
  if (req.method === 'GET' && req.url === '/pedidos') {
    const db = readDB();
    res.status(200).json(db.pedidos);
    return;
  }
  if (req.method === 'POST' && req.url === '/pedidos') {
    const db = readDB();
    const pedido = { ...req.body, id: Date.now() };
    db.pedidos.push(pedido);
    writeDB(db);
    res.status(200).json(pedido);
    return;
  }
  if (req.method === 'DELETE' && req.url === '/pedidos') {
    const db = readDB();
    db.pedidos = [];
    writeDB(db);
    res.status(204).end();
    return;
  }
  res.status(404).json({ error: 'Not found' });
};
