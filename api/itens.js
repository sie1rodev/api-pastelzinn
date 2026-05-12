import { supabase } from "../lib/supabase.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { method, body } = req;

  const dataBody = typeof body === "string"
    ? JSON.parse(body || "{}")
    : body;

  if (method === "POST") {
    const { pedido_id, sabor_id, quantidade } = dataBody;

    const { data, error } = await supabase
      .from("pedido_itens")
      .insert([{ pedido_id, sabor_id, quantidade }]);

    return res.json({ data, error });
  }

  if (method === "PUT") {
    const { id, quantidade } = dataBody;

    const { data, error } = await supabase
      .from("pedido_itens")
      .update({ quantidade })
      .eq("id", id);

    return res.json({ data, error });
  }

  if (method === "DELETE") {
    const { id } = dataBody;

    const { data, error } = await supabase
      .from("pedido_itens")
      .delete()
      .eq("id", id);

    return res.json({ data, error });
  }

  res.status(405).json({ error: "Method not allowed" });
}