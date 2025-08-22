const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

const DB_FILE = './db.json';

// Função para ler e salvar o JSON
function readDB() {
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ sabores: [], pedidos: [] }, null, 2));
  return JSON.parse(fs.readFileSync(DB_FILE));
}
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Rotas Sabores
app.get('/sabores', (req, res) => {
  const db = readDB();
  res.json(db.sabores);
});
app.post('/sabores', (req, res) => {
  const db = readDB();
  const sabor = { ...req.body, id: Date.now() };
  db.sabores.push(sabor);
  writeDB(db);
  res.json(sabor);
});
app.delete('/sabores/:id', (req, res) => {
  const db = readDB();
  db.sabores = db.sabores.filter(s => s.id != req.params.id);
  writeDB(db);
  res.sendStatus(204);
});

// Rotas Pedidos
app.get('/pedidos', (req, res) => {
  const db = readDB();
  res.json(db.pedidos);
});
app.post('/pedidos', (req, res) => {
  const db = readDB();
  const pedido = { ...req.body, id: Date.now() };
  db.pedidos.push(pedido);
  writeDB(db);
  res.json(pedido);
});
app.delete('/pedidos', (req, res) => {
  const db = readDB();
  db.pedidos = [];
  writeDB(db);
  res.sendStatus(204);
});

app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));