const supabase = require("./supabase");

// ================= BODY =================
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

// ================= DASHBOARD =================
async function getDashboard() {
  const { data: pedidos } = await supabase.from("pedidos").select("*");
  const { data: itens } = await supabase.from("pedido_itens").select("*");
  const { data: sabores } = await supabase.from("sabores").select("*");

  const now = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(now.getDate() - 7);

  const pedidosSemana = pedidos.filter(p =>
    p.status === "encerrado" &&
    p.encerrado_em &&
    new Date(p.encerrado_em) >= weekAgo
  );

  const ids = pedidosSemana.map(p => p.id);

  const itensSemana = itens.filter(i => ids.includes(i.pedido_id));

  const totalPedidos = pedidosSemana.length;

  const totalVendas = itensSemana.reduce((sum, item) => {
    const sabor = sabores.find(s => s.id === item.sabor_id);
    const preco = sabor?.preco ?? 14;
    return sum + item.quantidade * preco;
  }, 0);

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
    body = await parseRequestBody(req);
  }

  const path = req.url.split("?")[0];

  try {

    // ================= SABORES =================
    if (path === "/sabores") {

      if (req.method === "GET") {
        return res.json(await getSabores());
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

      if (req.method === "DELETE") {
        await supabase.from("sabores").delete().neq("id", 0);
        return res.json({ ok: true });
      }
    }

    // ================= PEDIDOS =================
    if (path === "/pedidos") {

      if (req.method === "GET") {
        const { data } = await supabase
          .from("pedidos")
          .select("*")
          .order("criado_em", { ascending: false });

        return res.json(data);
      }

      if (req.method === "POST") {
        const { nomeCliente, pedido, paraViagem } = body;

        const { data: pedidoCriado } = await supabase
          .from("pedidos")
          .insert([{
            nome_cliente: nomeCliente,
            para_viagem: paraViagem,
            criado_em: new Date().toISOString(),
            status: "aberto"
          }])
          .select()
          .single();

        const itens = pedido.map(i => ({
          pedido_id: pedidoCriado.id,
          sabor_id: i.saborId,
          quantidade: i.quantidade
        }));

        await supabase.from("pedido_itens").insert(itens);

        // 🔥 BAIXAR ESTOQUE AQUI (CORRIGIDO)
        for (const i of pedido) {
          const { data: sabor } = await supabase
            .from("sabores")
            .select("quantidade")
            .eq("id", i.saborId)
            .single();

          await supabase
            .from("sabores")
            .update({
              quantidade: sabor.quantidade - i.quantidade
            })
            .eq("id", i.saborId);
        }

        return res.status(201).json(pedidoCriado);
      }

      if (req.method === "DELETE" && req.url.startsWith("/pedidos/")) {
        const id = req.url.split("/").pop();

        await supabase
          .from("pedidos")
          .update({
            status: "encerrado",
            encerrado_em: new Date().toISOString()
          })
          .eq("id", id);

        return res.json({ ok: true });
      }
    }

    // ================= DASHBOARD =================
    if (path === "/dashboard") {
      return res.json(await getDashboard());
    }

    return res.status(404).json({ error: "Rota não encontrada" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};