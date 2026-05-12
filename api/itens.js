const { supabase } = require("./lib/supabase");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const body = req.body ? JSON.parse(req.body) : {};

  // POST - adicionar item
  if (req.method === "POST") {
    const { pedido_id, sabor_id, quantidade } = body;

    const { data, error } = await supabase
      .from("pedido_itens")
      .insert([{ pedido_id, sabor_id, quantidade }]);

    return res.status(200).json({ data, error });
  }

  // PUT - editar item (AGORA PODE TROCAR SABOR)
  if (req.method === "PUT") {
    const { id, sabor_id, quantidade } = body;

    const { data, error } = await supabase
      .from("pedido_itens")
      .update({ sabor_id, quantidade })
      .eq("id", id);

    return res.status(200).json({ data, error });
  }

  // DELETE - remover item da comanda
  if (req.method === "DELETE") {
    const { id } = body;

    const { data, error } = await supabase
      .from("pedido_itens")
      .delete()
      .eq("id", id);

    return res.status(200).json({ data, error });
  }

  return res.status(405).json({ error: "Method not allowed" });
};