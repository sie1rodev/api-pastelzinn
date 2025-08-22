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
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const { db } = await connectToDatabase();
  // Sabores
  if (req.method === 'GET' && req.url === '/sabores') {
    const sabores = await db.collection('sabores').find({}).toArray();
    res.status(200).json(sabores.map(s => ({ ...s, id: s._id })));
    return;
  }
  if (req.method === 'POST' && req.url === '/sabores') {
    const sabor = req.body;
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
    const pedido = req.body;
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
