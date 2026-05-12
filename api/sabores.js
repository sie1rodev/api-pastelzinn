const { supabase } = require("../lib/supabase");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const body = req.body ? JSON.parse(req.body) : {};

  // GET
  if (req.method === "GET") {
    const { data, error } = await supabase.from("sabores").select("*");
    return res.status(200).json({ data, error });
  }

  // POST
  if (req.method === "POST") {
    const { nome, quantidade, preco } = body;

    const { data, error } = await supabase
      .from("sabores")
      .insert([{ nome, quantidade, preco }]);

    return res.status(200).json({ data, error });
  }

  // PUT (editar tudo)
  if (req.method === "PUT") {
    const { id, nome, quantidade, preco } = body;

    const { data, error } = await supabase
      .from("sabores")
      .update({ nome, quantidade, preco })
      .eq("id", id);

    return res.status(200).json({ data, error });
  }

  return res.status(405).json({ error: "Method not allowed" });
};