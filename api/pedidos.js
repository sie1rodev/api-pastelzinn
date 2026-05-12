const { supabase } = require("./lib/supabase");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const body = req.body ? JSON.parse(req.body) : {};

  // GET
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("pedidos")
      .select("*, pedido_itens(*, sabores(*))");

    return res.status(200).json({ data, error });
  }

  // POST
  if (req.method === "POST") {
    const { nome_cliente, para_viagem } = body;

    const { data, error } = await supabase
      .from("pedidos")
      .insert([{ nome_cliente, para_viagem }])
      .select();

    return res.status(200).json({ data, error });
  }

  return res.status(405).json({ error: "Method not allowed" });
};