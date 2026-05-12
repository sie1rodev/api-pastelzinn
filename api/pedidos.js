const { supabase } = require("./lib/supabase");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
<<<<<<< HEAD
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
=======
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
>>>>>>> parent of f47a228 (refactor: standardize CORS headers and response handling across API endpoints)
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

<<<<<<< HEAD
  const body =
    typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body || {};

  if (req.method === "GET") {
    const { data } = await supabase
      .from("pedidos")
      .select("*, pedido_itens(*, sabores(*))");

    return res.status(200).json({ data });
  }

  if (req.method === "POST") {
    const { nome_cliente, para_viagem } = body;

    const { data } = await supabase
=======
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
>>>>>>> parent of f47a228 (refactor: standardize CORS headers and response handling across API endpoints)
      .from("pedidos")
      .insert([{ nome_cliente, para_viagem }])
      .select();

<<<<<<< HEAD
    return res.status(200).json({ data });
  }

  if (req.method === "PUT") {
    const { id, status, encerrar_todas } = body;

    if (encerrar_todas) {
      const { data } = await supabase
        .from("pedidos")
        .update({ status: "encerrado" })
        .neq("status", "encerrado");

      return res.status(200).json({ data });
    }

    const { data } = await supabase
      .from("pedidos")
      .update({ status })
      .eq("id", id);

    return res.status(200).json({ data });
  }

=======
    return res.status(200).json({ data, error });
  }

>>>>>>> parent of f47a228 (refactor: standardize CORS headers and response handling across API endpoints)
  return res.status(405).json({ error: "Method not allowed" });
};