import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ======================
// CORS (OBRIGATÓRIO)
// ======================
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ======================
// HANDLER PRINCIPAL
// ======================
export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { method, url } = req;

  let body = req.body;

  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  try {

    // ======================
    // 🍔 SABORES
    // ======================
    if (url.includes("/sabores")) {

      if (method === "GET") {
        const { data } = await supabase.from("sabores").select("*");
        return res.json(data);
      }

      if (method === "POST") {
        const { nome, quantidade, preco } = body;

        const { data, error } = await supabase
          .from("sabores")
          .insert([{ nome, quantidade, preco }]);

        return res.json({ data, error });
      }

      if (method === "PUT") {
        const { id, ...rest } = body;

        const { data, error } = await supabase
          .from("sabores")
          .update(rest)
          .eq("id", id);

        return res.json({ data, error });
      }
    }

    // ======================
    // 🧾 PEDIDOS
    // ======================
    if (url.includes("/pedidos")) {

      if (method === "GET") {
        const { data } = await supabase
          .from("pedidos")
          .select("*, pedido_itens(*, sabores(*))");

        return res.json(data);
      }

      if (method === "POST") {
        const { nome_cliente, para_viagem } = body;

        const { data, error } = await supabase
          .from("pedidos")
          .insert([{ nome_cliente, para_viagem }])
          .select();

        return res.json({ data, error });
      }
    }

    // ======================
    // 🍽 ITENS
    // ======================
    if (url.includes("/itens")) {

      if (method === "POST") {
        const { pedido_id, sabor_id, quantidade } = body;

        const { data, error } = await supabase
          .from("pedido_itens")
          .insert([{ pedido_id, sabor_id, quantidade }]);

        return res.json({ data, error });
      }

      if (method === "PUT") {
        const { id, quantidade } = body;

        const { data, error } = await supabase
          .from("pedido_itens")
          .update({ quantidade })
          .eq("id", id);

        return res.json({ data, error });
      }

      if (method === "DELETE") {
        const { id } = body;

        const { data, error } = await supabase
          .from("pedido_itens")
          .delete()
          .eq("id", id);

        return res.json({ data, error });
      }
    }

    // ======================
    // 📊 DASHBOARD
    // ======================
    if (url.includes("/dashboard")) {
      const seteDias = new Date(Date.now() - 7 * 86400000).toISOString();

      const { data } = await supabase
        .from("pedidos")
        .select("*")
        .gte("criado_em", seteDias);

      return res.json({
        vendas_semana: data?.length || 0
      });
    }

    return res.status(404).json({ error: "Rota não encontrada" });

  } catch (err) {
    return res.status(500).json({
      error: "Erro interno",
      details: err.message
    });
  }
}