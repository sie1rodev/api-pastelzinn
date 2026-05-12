const { supabase } = require("../lib/supabase");
const allowCors = require("../lib/allowCors");

const handler = async (req, res) => {
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

module.exports = allowCors(handler);