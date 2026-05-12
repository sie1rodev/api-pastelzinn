const supabase = require("./supabase");

/**
 * Parse body da request (serverless safe)
 */
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => (raw += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(raw || "{}"));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

/**
 * Busca todos sabores e transforma em MAP (otimização)
 */
async function getSaboresMap() {
  const { data, error } = await supabase
    .from("sabores")
    .select("id,nome,quantidade,preco");

  if (error) throw error;

  const map = {};
  data.forEach(s => {
    map[s.id] = s;
  });

  return map;
}

/**
 * Busca pedidos com itens (sem N+1 query)
 */
async function getAllPedidos() {
  const { data: pedidos, error: pedidosError } = await supabase
    .from("pedidos")
    .select("*");

  if (pedidosError) throw pedidosError;

  const { data: itens, error: itensError } = await supabase
    .from("pedido_itens")
    .select("*");

  if (itensError) throw itensError;

  return pedidos.map(pedido => ({
    id: pedido.id,
    nomeCliente: pedido.nome_cliente,
    paraViagem: pedido.para_viagem,
    criadoEm: pedido.criado_em,
    pedido: itens
      .filter(i => i.pedido_id === pedido.id)
      .map(i => ({
        saborId: i.sabor_id,
        quantidade: i.quantidade
      }))
  }));
}

/**
 * Pedido por ID
 */
async function getPedidoById(id) {
  const { data, error } = await supabase
    .from("pedidos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Itens do pedido
 */
async function getPedidoItems(pedidoId) {
  const { data, error } = await supabase
    .from("pedido_itens")
    .select("*")
    .eq("pedido_id", pedidoId);

  if (error) throw error;
  return data;
}

module.exports = async (req, res) => {
  // CORS
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
        const { data, error } = await supabase.from("sabores").select("*");
        if (error) throw error;
        return res.status(200).json(data);
      }

      if (req.method === "POST") {
        const { nome, quantidade, preco } = body;

        if (!nome || quantidade == null || preco == null) {
          return res.status(400).json({ error: "Nome, quantidade e preço obrigatórios." });
        }

        const { data, error } = await supabase
          .from("sabores")
          .insert([{ nome, quantidade, preco }])
          .select()
          .single();

        if (error) throw error;
        return res.status(201).json(data);
      }

      if (req.method === "DELETE") {
        const { error } = await supabase.from("sabores").delete().not("id", "is", null);
        if (error) throw error;

        return res.status(200).json({ message: "Todos os sabores foram removidos!" });
      }
    }

    // DELETE sabor individual
    if (req.method === "DELETE" && path.startsWith("/sabores/")) {
      const id = path.split("/").pop();

      const { data, error } = await supabase
        .from("sabores")
        .delete()
        .eq("id", id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        return res.status(404).json({ error: "Sabor não encontrado." });
      }

      return res.status(200).json({ message: "Sabor removido!" });
    }

    // ================= PEDIDOS =================
    if (path === "/pedidos") {
      if (req.method === "GET") {
        const pedidos = await getAllPedidos();
        return res.status(200).json(pedidos);
      }

      if (req.method === "POST") {
        const { nomeCliente, pedido, paraViagem } = body;

        if (!nomeCliente || !Array.isArray(pedido) || pedido.length === 0) {
          return res.status(400).json({ error: "Pedido inválido." });
        }

        // 🔥 pega todos sabores de uma vez (otimizado)
        const saboresMap = await getSaboresMap();

        // valida estoque
        for (const item of pedido) {
          const sabor = saboresMap[item.saborId];

          if (!sabor) {
            return res.status(404).json({ error: `Sabor não encontrado: ${item.saborId}` });
          }

          if (sabor.quantidade < item.quantidade) {
            return res.status(400).json({ error: `Estoque insuficiente para: ${sabor.nome}` });
          }
        }

        // baixa estoque
        for (const item of pedido) {
          const sabor = saboresMap[item.saborId];

          await supabase
            .from("sabores")
            .update({ quantidade: sabor.quantidade - item.quantidade })
            .eq("id", item.saborId);
        }

        // cria pedido
        const { data: pedidoCriado, error: pedidoError } = await supabase
          .from("pedidos")
          .insert([
            {
              nome_cliente: nomeCliente,
              para_viagem: !!paraViagem,
              criado_em: new Date().toISOString()
            }
          ])
          .select()
          .single();

        if (pedidoError) throw pedidoError;

        // itens
        const itens = pedido.map(item => ({
          pedido_id: pedidoCriado.id,
          sabor_id: item.saborId,
          quantidade: item.quantidade
        }));

        const { error: itensError } = await supabase
          .from("pedido_itens")
          .insert(itens);

        if (itensError) throw itensError;

        return res.status(201).json({
          id: pedidoCriado.id,
          nomeCliente,
          pedido,
          paraViagem
        });
      }

      if (req.method === "DELETE") {
        await supabase.from("pedido_itens").delete().not("id", "is", null);
        await supabase.from("pedidos").delete().not("id", "is", null);

        return res.status(200).json({ message: "Todas as comandas foram zeradas!" });
      }
    }

    // ================= EDIT PEDIDO =================
    if ((req.method === "PUT" || req.method === "PATCH") && path.startsWith("/pedidos/")) {
      const id = path.split("/").pop();
      const { nomeCliente, pedido, paraViagem } = body;

      const pedidoAntigo = await getPedidoById(id);
      if (!pedidoAntigo) {
        return res.status(404).json({ error: "Pedido não encontrado." });
      }

      const saboresMap = await getSaboresMap();

      // se mudou pedido
      if (pedido) {
        const itensAntigos = await getPedidoItems(id);

        // devolve estoque antigo
        for (const item of itensAntigos) {
          const sabor = saboresMap[item.sabor_id];
          if (sabor) {
            await supabase
              .from("sabores")
              .update({ quantidade: sabor.quantidade + item.quantidade })
              .eq("id", item.sabor_id);
          }
        }

        // valida novo pedido
        for (const item of pedido) {
          const sabor = saboresMap[item.saborId];

          if (!sabor) {
            return res.status(404).json({ error: `Sabor não encontrado: ${item.saborId}` });
          }

          if (sabor.quantidade < item.quantidade) {
            return res.status(400).json({ error: `Estoque insuficiente para: ${sabor.nome}` });
          }
        }

        // baixa novo estoque
        for (const item of pedido) {
          const sabor = saboresMap[item.saborId];

          await supabase
            .from("sabores")
            .update({ quantidade: sabor.quantidade - item.quantidade })
            .eq("id", item.saborId);
        }

        await supabase.from("pedido_itens").delete().eq("pedido_id", id);

        const novosItens = pedido.map(item => ({
          pedido_id: id,
          sabor_id: item.saborId,
          quantidade: item.quantidade
        }));

        await supabase.from("pedido_itens").insert(novosItens);
      }

      const updatePayload = {};
      if (nomeCliente) updatePayload.nome_cliente = nomeCliente;
      if (paraViagem !== undefined) updatePayload.para_viagem = !!paraViagem;

      if (Object.keys(updatePayload).length > 0) {
        await supabase.from("pedidos").update(updatePayload).eq("id", id);
      }

      return res.status(200).json({ message: "Pedido atualizado com sucesso!" });
    }

    // ================= DELETE PEDIDO =================
    if (req.method === "DELETE" && path.startsWith("/pedidos/")) {
      const id = path.split("/").pop();

      await supabase.from("pedido_itens").delete().eq("pedido_id", id);
      await supabase.from("pedidos").delete().eq("id", id);

      return res.status(200).json({ message: "Comanda concluída!" });
    }

    return res.status(404).json({ error: "Rota não encontrada." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
};