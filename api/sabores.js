const { supabase } = require("./lib/supabase");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
<<<<<<< HEAD
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
=======
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
>>>>>>> parent of f47a228 (refactor: standardize CORS headers and response handling across API endpoints)
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

<<<<<<< HEAD
  const body =
    typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body || {};

  if (req.method === "GET") {
    const { data } = await supabase.from("sabores").select("*");
    return res.status(200).json({ data });
  }

  if (req.method === "POST") {
    const { nome, quantidade, preco } = body;

    const { data } = await supabase
      .from("sabores")
      .insert([{ nome, quantidade, preco }]);

    return res.status(200).json({ data });
  }

  if (req.method === "PUT") {
    const { id, nome, quantidade, preco } = body;

    const { data } = await supabase
=======
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
>>>>>>> parent of f47a228 (refactor: standardize CORS headers and response handling across API endpoints)
      .from("sabores")
      .update({ nome, quantidade, preco })
      .eq("id", id);

<<<<<<< HEAD
    return res.status(200).json({ data });
  }

  if (req.method === "DELETE") {
    const { id } = body;

    const { data } = await supabase
      .from("sabores")
      .delete()
      .eq("id", id);

    return res.status(200).json({ data });
  }

=======
    return res.status(200).json({ data, error });
  }

>>>>>>> parent of f47a228 (refactor: standardize CORS headers and response handling across API endpoints)
  return res.status(405).json({ error: "Method not allowed" });
};