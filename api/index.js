const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = 'pastelaria';
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) return { client: cachedClient, db: cachedDb };
  const client = await MongoClient.connect(uri);
  const db = client.db(dbName);
  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // Faz o parse manual do body para JSON se for POST ou PUT
  let body = undefined;
  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      let rawBody = '';
      await new Promise((resolve, reject) => {
        req.on('data', chunk => { rawBody += chunk; });
        req.on('end', resolve);
        req.on('error', reject);
      });
      body = rawBody ? JSON.parse(rawBody) : {};
    } catch (e) {
      res.status(400).json({ error: 'Body inválido: ' + e.message });
      return;
    }
  }

  const { db } = await connectToDatabase();
  // Sabores
  if (req.method === 'GET' && req.url === '/sabores') {
    const sabores = await db.collection('sabores').find({}).toArray();
    res.status(200).json(sabores.map(s => ({ ...s, id: s._id })));
    return;
  }
  if (req.method === 'POST' && req.url === '/sabores') {
    const sabor = body;
    const result = await db.collection('sabores').insertOne(sabor);
    res.status(200).json({ id: result.insertedId, ...sabor });
    return;
  }
  if (req.method === 'DELETE' && req.url.startsWith('/sabores/')) {
    const id = req.url.split('/').pop();
    await db.collection('sabores').deleteOne({ _id: new ObjectId(id) });
    res.status(204).end();
    return;
  }
  // Pedidos
  if (req.method === 'GET' && req.url === '/pedidos') {
    const pedidos = await db.collection('pedidos').find({}).toArray();
    res.status(200).json(pedidos.map(p => ({ ...p, id: p._id })));
    return;
  }
  if (req.method === 'POST' && req.url === '/pedidos') {
    const pedido = body;
    // Espera-se que pedido.sabores seja um array de objetos: [{ saborId, quantidade }]
    if (!Array.isArray(pedido.sabores) || pedido.sabores.length === 0) {
      res.status(400).json({ error: 'O pedido deve conter um array de sabores.' });
      return;
    }
    // Busca todos os sabores do pedido
    const saborIds = pedido.sabores.map(s => new ObjectId(s.saborId));
    const saboresDB = await db.collection('sabores').find({ _id: { $in: saborIds } }).toArray();
    // Verifica se todos os sabores existem e têm quantidade suficiente
    for (const item of pedido.sabores) {
      const sabor = saboresDB.find(s => s._id.toString() === item.saborId);
      if (!sabor) {
        res.status(404).json({ error: `Sabor não encontrado: ${item.saborId}` });
        return;
      }
      if (typeof sabor.quantidade !== 'number' || sabor.quantidade < item.quantidade) {
        res.status(400).json({ error: `Quantidade insuficiente para o sabor: ${sabor.nome}` });
        return;
      }
    }
    // Desconta o estoque de todos os sabores
    for (const item of pedido.sabores) {
      await db.collection('sabores').updateOne(
        { _id: new ObjectId(item.saborId) },
        { $inc: { quantidade: -item.quantidade } }
      );
    }
    // Cria o pedido
    const result = await db.collection('pedidos').insertOne(pedido);
    res.status(200).json({ id: result.insertedId, ...pedido });
    return;
  }
  if (req.method === 'DELETE' && req.url === '/pedidos') {
    await db.collection('pedidos').deleteMany({});
    res.status(204).end();
    return;
  }
  res.status(404).json({ error: 'Not found' });
};
