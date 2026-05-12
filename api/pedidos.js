import { supabase } from "../lib/supabase.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { method, body } = req;

  const dataBody = typeof body === "string"
    ? JSON.parse(body || "{}")
    : body;

  if (method === "GET") {
    const { data } = await supabase
      .from("pedidos")
      .select("*, pedido_itens(*, sabores(*))");

    return res.json(data);
  }

  if (method === "POST") {
    const { nome_cliente, para_viagem } = dataBody;

    const { data, error } = await supabase
      .from("pedidos")
      .insert([{ nome_cliente, para_viagem }])
      .select();

    return res.json({ data, error });
  }

  res.status(405).json({ error: "Method not allowed" });
}