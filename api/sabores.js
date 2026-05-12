import { supabase } from "../lib/supabase.js";

export default async function handler(req, res) {
  res.json({ ok: true });
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { method, body } = req;

  const dataBody = typeof body === "string"
    ? JSON.parse(body || "{}")
    : body;

  if (method === "GET") {
    const { data } = await supabase.from("sabores").select("*");
    return res.json(data);
  }

  if (method === "POST") {
    const { nome, quantidade, preco } = dataBody;

    const { data, error } = await supabase
      .from("sabores")
      .insert([{ nome, quantidade, preco }]);

    return res.json({ data, error });
  }

  if (method === "PUT") {
    const { id, ...rest } = dataBody;

    const { data, error } = await supabase
      .from("sabores")
      .update(rest)
      .eq("id", id);

    return res.json({ data, error });
  }

  res.status(405).json({ error: "Method not allowed" });
}