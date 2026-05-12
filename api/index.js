const supabase = require("./supabase");

// ================= BODY =================
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => raw += chunk);
    req.on("end", () => resolve(JSON.parse(raw || "{}")));
    req.on("error", reject);
  });
}

// ================= DASHBOARD =================
async function getDashboard() {
  const { data: pedidos } = await supabase.from("pedidos").select("*");
  const { data: itens } = await supabase.from("pedido_itens").select("*");
  const { data: sabores } = await supabase.from("sabores").select("*");

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const pedidosSemana = pedidos.filter(p =>
    p.status === "encerrado" &&
    p.encerrado_em &&
    new Date(p.encerrado_em) >= weekAgo
  );

  const ids = pedidosSemana.map(p => p.id);
  const itensSemana = itens.filter(i => ids.includes(i.pedido_id));

  const totalPedidos = pedidosSemana.length;

  const totalVendas = itensSemana.reduce((sum, i) => {
    const s = sabores.find(x => x.id === i.sabor_id);
    return sum + i.quantidade * (s?.preco ?? 14);
  }, 0);

  const ranking = {};
  itensSemana.forEach(i => {
    ranking[i.sabor_id] = (ranking[i.sabor_id] || 0) + i.quantidade;
  });

  const saboresMaisVendidos = Object.entries(ranking).map(([id, qtd]) => {
    const s = sabores.find(x => x.id === id);
    return { nome: s?.nome || "?", quantidade: qtd };
  }).sort((a,b) => b.quantidade - a.quantidade);

  return { totalPedidos, totalVendas, saboresMaisVendidos };
}

// ================= HANDLER =================
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") return res.status(200).end();

  const path = req.url.split("?")[0];
  let body = {};

  if (["POST","PUT","PATCH"].includes(req.method)) {
    body = await parseRequestBody(req);
  }

  try {

    // ===== SABORES =====
    if (path === "/sabores") {

      if (req.method === "GET") {
        const { data } = await supabase.from("sabores").select("*");
        return res.json(data);
      }

      if (req.method === "POST") {
        const { nome, quantidade, preco = 14 } = body;

        const { data } = await supabase
          .from("sabores")
          .insert([{ nome, quantidade, preco }])
          .select()
          .single();

        return res.status(201).json(data);
      }
    }

    // ===== PEDIDOS =====
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

        const { data: p } = await supabase
          .from("pedidos")
          .insert([{
            nome_cliente: nomeCliente,
            para_viagem: paraViagem,
            status: "aberto",
            criado_em: new Date().toISOString()
          }])
          .select()
          .single();

        const itens = pedido.map(i => ({
          pedido_id: p.id,
          sabor_id: i.saborId,
          quantidade: i.quantidade
        }));

        await supabase.from("pedido_itens").insert(itens);

        // 🔥 baixa estoque
        for (const i of pedido) {
          const { data: s } = await supabase
            .from("sabores")
            .select("quantidade")
            .eq("id", i.saborId)
            .single();

          await supabase
            .from("sabores")
            .update({ quantidade: s.quantidade - i.quantidade })
            .eq("id", i.saborId);
        }

        return res.status(201).json(p);
      }

      if (req.method === "DELETE" && req.url.includes("/pedidos/")) {
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

    // ===== DASHBOARD =====
    if (path === "/dashboard") {
      return res.json(await getDashboard());
    }

    return res.status(404).json({ error: "Not found" });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};