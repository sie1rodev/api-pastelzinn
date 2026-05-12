import { supabase } from "../lib/supabase.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { method, body } = req;

  const parsedBody = typeof body === "string" ? JSON.parse(body || "{}") : body;

  if (method === "GET") {
    const { data } = await supabase.from("sabores").select("*");
    return res.json(data);
  }

  if (method === "POST") {
    const { nome, quantidade, preco } = parsedBody;

    const { data } = await supabase
      .from("sabores")
      .insert([{ nome, quantidade, preco }]);

    return res.json(data);
  }

  if (method === "PUT") {
    const { id, ...rest } = parsedBody;

    const { data } = await supabase
      .from("sabores")
      .update(rest)
      .eq("id", id);

    return res.json(data);
  }

  res.status(405).json({ error: "Method not allowed" });
}