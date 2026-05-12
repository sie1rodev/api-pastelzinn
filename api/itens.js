const { supabase } = require("./lib/supabase");

module.exports = async (req, res) => {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const body =
    typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body || {};

  if (req.method === "POST") {
    const { pedido_id, sabor_id, quantidade } = body;

    const { data } = await supabase
      .from("pedido_itens")
      .insert([{ pedido_id, sabor_id, quantidade }]);

    return res.status(200).json({ data });
  }

  if (req.method === "PUT") {
    const { id, sabor_id, quantidade } = body;

    const { data } = await supabase
      .from("pedido_itens")
      .update({ sabor_id, quantidade })
      .eq("id", id);

    return res.status(200).json({ data });
  }

  if (req.method === "DELETE") {
    const { id } = body;

    const { data } = await supabase
      .from("pedido_itens")
      .delete()
      .eq("id", id);

    return res.status(200).json({ data });
  }

  return res.status(405).json({ error: "Method not allowed" });
};