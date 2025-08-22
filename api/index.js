const { MongoClient, ObjectId } = require("mongodb");

const uri = process.env.MONGODB_URI; // defina no painel da Vercel
const dbName = "pastelaria";
let cachedClient = null;
let cachedDb = null;

// Conexão única com cache
async function connectToDatabase() {
  if (cachedDb) return { client: cachedClient, db: cachedDb };

  const client = await MongoClient.connect(uri);
  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

module.exports = async (req, res) => {
  // 🔓 CORS liberado
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { db } = await connectToDatabase();
  const path = req.url.split("?")[0]; // rota sem query string

  try {
    // ================= SABORES =================
    if (path === "/sabores") {
      if (req.method === "GET") {
        const sabores = await db.collection("sabores").find({}).toArray();
        return res.status(200).json(sabores);
      }

      if (req.method === "POST") {
        const { nome, preco } = req.body;
        if (!nome || !preco) {
          return res.status(400).json({ error: "Nome e preço são obrigatórios." });
        }
        const result = await db.collection("sabores").insertOne({ nome, preco });
        return res.status(201).json({ id: result.insertedId, nome, preco });
      }

      if (req.method === "DELETE") {
        await db.collection("sabores").deleteMany({});
        return res.status(200).json({ message: "Todos os sabores foram removidos!" });
      }
    }

    // ================= PEDIDOS =================
    if (path === "/pedidos") {
      if (req.method === "GET") {
        const pedidos = await db.collection("pedidos").find({}).toArray();
        return res.status(200).json(pedidos);
      }

      if (req.method === "POST") {
        const { nomeCliente, pedido } = req.body;
        if (!nomeCliente || !Array.isArray(pedido)) {
          return res
            .status(400)
            .json({ error: "O pedido deve conter nomeCliente e um array de sabores." });
        }
        const result = await db
          .collection("pedidos")
          .insertOne({ nomeCliente, pedido, criadoEm: new Date() });
        return res.status(201).json({
          id: result.insertedId,
          nomeCliente,
          pedido,
          criadoEm: new Date(),
        });
      }

      if (req.method === "DELETE") {
        await db.collection("pedidos").deleteMany({});
        return res.status(200).json({ message: "Todas as comandas foram zeradas!" });
      }
    }

    // ================= ROTA INVÁLIDA =================
    return res.status(404).json({ error: "Rota não encontrada." });
  } catch (err) {
    console.error("Erro no backend:", err);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
};
