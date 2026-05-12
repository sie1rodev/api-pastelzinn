const supabase = require("./supabase");

// ================= BODY PARSER =================
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => raw += chunk);
    req.on("end", () => {
      try {
        resolve(JSON.parse(raw || "{}"));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

// ================= HELPERS =================
async function getSabores() {
  const { data, error } = await supabase.from("sabores").select("*");
  if (error) throw error;
  return data;
}

async function getPedidos() {
  const { data, error } = await supabase.from("pedidos").select("*");
  if (error) throw error;
  return data;
}

async function getItens() {
  const { data, error } = await supabase.from("pedido_itens").select("*");
  if (error) throw error;
  return data;
}

// ================= DASHBOARD (SEMANA) =================
async function getDashboard() {
  const pedidos = await getPedidos();
  const itens = await getItens();
  const sabores = await getSabores();

  const now = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(now.getDate() - 7);

  const pedidosSemana = pedidos.filter(p =>
    p.status === "encerrado" &&
    p.encerrado_em &&
    new Date(p.encerrado_em) >= weekAgo
  );

  const pedidosIds = pedidosSemana.map(p => p.id);

  const itensSemana = itens.filter(i =>
    pedidosIds.includes(i.pedido_id)
  );

  // 📦 total pedidos
  const totalPedidos = pedidosSemana.length;

  // 💰 total vendas
  const totalVendas = itensSemana.reduce((sum, item) => {
    const sabor = sabores.find(s => s.id === item.sabor_id);
    const preco = sabor?.preco ?? 14;
    return sum + item.quantidade * preco;
  }, 0);

  // 🥇 ranking sabores
  const ranking = {};

  itensSemana.forEach(i => {
    ranking[i.sabor_id] = (ranking[i.sabor_id] || 0) + i.quantidade;
  });

  const saboresMaisVendidos = Object.entries(ranking)
    .map(([id, qtd]) => {
      const sabor = sabores.find(s => s.id === id);
      return {
        id,
        nome: sabor?.nome || "Desconhecido",
        quantidade: qtd
      };
    })
    .sort((a, b) => b.quantidade - a.quantidade);

  return {
    periodo: "7 dias",
    totalPedidos,
    totalVendas,
    saboresMaisVendidos
  };
}

// ================= HANDLER =================
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  let body = {};
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    try {
      body = await parseRequestBody(req);
    } catch {
      return res.status(400).json({ error: "Body inválido" });
    }
  }

  const path = req.url.split("?")[0];

  try {

    // ================= SABORES =================
    if (path === "/sabores") {

      if (req.method === "GET") {
        const data = await getSabores();
        return res.json(data);
      }

      if (req.method === "POST") {
        const { nome, quantidade, preco = 14 } = body;

        const { data, error } = await supabase
          .from("sabores")
          .insert([{ nome, quantidade, preco }])
          .select()
          .single();

        if (error) throw error;
        return res.status(201).json(data);
      }
    }

    // ================= PEDIDOS =================
    if (path === "/pedidos") {

      // LISTAR
      if (req.method === "GET") {
        const { data, error } = await supabase
          .from("pedidos")
          .select("*")
          .order("criado_em", { ascending: false });

        if (error) throw error;
        return res.json(data);
      }

      // CRIAR PEDIDO
      if (req.method === "POST") {
        const { nomeCliente, pedido, paraViagem } = body;

        const { data: pedidoCriado, error } = await supabase
          .from("pedidos")
          .insert([{
            nome_cliente: nomeCliente,
            para_viagem: !!paraViagem,
            criado_em: new Date().toISOString(),
            status: "aberto"
          }])
          .select()
          .single();

        if (error) throw error;

        const itens = pedido.map(i => ({
          pedido_id: pedidoCriado.id,
          sabor_id: i.saborId,
          quantidade: i.quantidade
        }));

        await supabase.from("pedido_itens").insert(itens);

        return res.status(201).json(pedidoCriado);
      }

      // ENCERRAR COMANDA (NÃO DELETA MAIS)
      if (req.method === "DELETE" && req.url.startsWith("/pedidos/")) {
        const id = req.url.split("/").pop();

        const { error } = await supabase
          .from("pedidos")
          .update({
            status: "encerrado",
            encerrado_em: new Date().toISOString()
          })
          .eq("id", id);

        if (error) throw error;

        return res.json({ message: "Comanda encerrada!" });
      }
    }

    // ================= DASHBOARD =================
    if (path === "/dashboard") {
      const data = await getDashboard();
      return res.json(data);
    }

    return res.status(404).json({ error: "Rota não encontrada" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};