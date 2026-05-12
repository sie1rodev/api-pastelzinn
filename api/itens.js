import { supabase } from "../lib/supabase.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { method, body } = req;

  const parsedBody = typeof body === "string" ? JSON.parse(body || "{}") : body;

  if (method === "POST") {
    const { pedido_id, sabor_id, quantidade } = parsedBody;

    const { data } = await supabase
      .from("pedido_itens")
      .insert([{ pedido_id, sabor_id, quantidade }]);

    return res.json(data);
  }

  if (method === "PUT") {
    const { id, quantidade } = parsedBody;

    const { data } = await supabase
      .from("pedido_itens")
      .update({ quantidade })
      .eq("id", id);

    return res.json(data);
  }

  if (method === "DELETE") {
    const { id } = parsedBody;

    const { data } = await supabase
      .from("pedido_itens")
      .delete()
      .eq("id", id);

    return res.json(data);
  }

  res.status(405).json({ error: "Method not allowed" });
}