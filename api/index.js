const { MongoClient, ObjectId } = require("mongodb");

const uri = process.env.MONGODB_URI; // coloque sua URI MongoDB
const dbName = "pastelaria";
let cachedClient = null;
let cachedDb = null;

// Conexão com cache
async function connectToDatabase() {
  if (cachedDb) return { client: cachedClient, db: cachedDb };
  const client = await MongoClient.connect(uri);
  const db = client.db(dbName);
  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  let body = {};
  if (req.method === "POST") {
    try {
      body = await new Promise((resolve, reject) => {
        let raw = "";
        req.on("data", chunk => raw += chunk);
        req.on("end", () => resolve(JSON.parse(raw || "{}")));
        req.on("error", reject);
      });
    } catch (err) {
      return res.status(400).json({ error: "Body inválido" });
    }
  }

  const { db } = await connectToDatabase();
  const path = req.url.split("?")[0];

  try {
    // ================ SABORES ================
    if (path === "/sabores") {
      if (req.method === "GET") {
        const sabores = await db.collection("sabores").find({}).toArray();
        return res.status(200).json(sabores);
      }

      if (req.method === "POST") {
        const { nome, quantidade, preco } = body;
        if (!nome || quantidade == null || preco == null) {
          return res.status(400).json({ error: "Nome, quantidade e preço obrigatórios." });
        }
        const result = await db.collection("sabores").insertOne({ nome, quantidade, preco });
        return res.status(201).json({ id: result.insertedId, nome, quantidade, preco });
      }

      if (req.method === "DELETE") {
        await db.collection("sabores").deleteMany({});
        return res.status(200).json({ message: "Todos os sabores foram removidos!" });
      }
    }

    // DELETE sabor individual
    if (req.method === "DELETE" && path.startsWith("/sabores/")) {
      const id = path.split("/").pop();
      await db.collection("sabores").deleteOne({ _id: new ObjectId(id) });
      return res.status(200).json({ message: "Sabor removido!" });
    }

    // ================ PEDIDOS ================
    if (path === "/pedidos") {
      if (req.method === "GET") {
        const pedidos = await db.collection("pedidos").find({}).toArray();
        return res.status(200).json(pedidos);
      }

      if (req.method === "POST") {
        const { nomeCliente, pedido } = body;
        if (!nomeCliente || !Array.isArray(pedido) || pedido.length === 0) {
          return res.status(400).json({ error: "O pedido deve conter nomeCliente e sabores." });
        }

        // Checar estoque
        for (const item of pedido) {
          const sabor = await db.collection("sabores").findOne({ _id: new ObjectId(item.saborId) });
          if (!sabor) return res.status(404).json({ error: `Sabor não encontrado: ${item.saborId}` });
          if (sabor.quantidade < item.quantidade) {
            return res.status(400).json({ error: `Estoque insuficiente para: ${sabor.nome}` });
          }
        }

        // Descontar estoque
        for (const item of pedido) {
          await db.collection("sabores").updateOne(
            { _id: new ObjectId(item.saborId) },
            { $inc: { quantidade: -item.quantidade } }
          );
        }

        const result = await db.collection("pedidos").insertOne({
          nomeCliente,
          pedido,
          criadoEm: new Date()
        });
        return res.status(201).json({ id: result.insertedId, nomeCliente, pedido });
      }

      if (req.method === "DELETE") {
        await db.collection("pedidos").deleteMany({});
        return res.status(200).json({ message: "Todas as comandas foram zeradas!" });
      }
    }

    // DELETE pedido individual
    if (req.method === "DELETE" && path.startsWith("/pedidos/")) {
      const id = path.split("/").pop();
      await db.collection("pedidos").deleteOne({ _id: new ObjectId(id) });
      return res.status(200).json({ message: "Comanda concluída!" });
    }

    return res.status(404).json({ error: "Rota não encontrada." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
};
