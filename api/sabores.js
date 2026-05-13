const { supabase } = require("../lib/supabase");

module.exports = async (req, res) => {
  try {
    // ======================
    // CORS
    // ======================
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type"
    );

    // Preflight
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    // ======================
    // BODY SAFE PARSE (Vercel fix)
    // ======================
    let body = {};

    try {
      body =
        typeof req.body === "string"
          ? JSON.parse(req.body)
          : req.body || {};
    } catch (e) {
      body = {};
    }

    // ======================
    // GET - LISTAR SABORES
    // ======================
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("sabores")
        .select("*");

      if (error) {
        console.error("GET ERROR:", error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ data });
    }

    // ======================
    // POST - CRIAR SABOR
    // ======================
    if (req.method === "POST") {
      const { nome, quantidade, preco } = body;

      if (!nome) {
        return res.status(400).json({ error: "Nome obrigatório" });
      }

      const { data, error } = await supabase
        .from("sabores")
        .insert([
          {
            nome,
            quantidade: Number(quantidade || 0),
            preco: Number(preco || 0)
          }
        ])
        .select();

      if (error) {
        console.error("POST ERROR:", error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ data });
    }

    // ======================
    // PUT - EDITAR SABOR
    // ======================
    if (req.method === "PUT") {
      const { id, nome, quantidade, preco } = body;

      if (!id) {
        return res.status(400).json({ error: "ID obrigatório" });
      }

      const { data, error } = await supabase
        .from("sabores")
        .update({
          nome,
          quantidade: Number(quantidade),
          preco: Number(preco)
        })
        .eq("id", id)
        .select();

      if (error) {
        console.error("PUT ERROR:", error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ data });
    }

    // ======================
    // DELETE - EXCLUIR SABOR (BLINDADO)
    // ======================
if (req.method === "DELETE") {
  const id = req.query?.id || body?.id;

  const before = await supabase
    .from("sabores")
    .select("*")
    .eq("id", id);

  console.log("ANTES:", before);

  const result = await supabase
    .from("sabores")
    .delete()
    .eq("id", id)
    .select();

  console.log("DELETE RESULT:", result);

  const after = await supabase
    .from("sabores")
    .select("*")
    .eq("id", id);

  console.log("DEPOIS:", after);

  return res.status(200).json({
    before,
    result,
    after
  });
}

    // ======================
    // METHOD NOT ALLOWED
    // ======================
    return res.status(405).json({
      error: "Method not allowed"
    });

  } catch (err) {
    console.error("API CRASH:", err);

    return res.status(500).json({
      error: "Internal Server Error",
      details: err.message
    });
  }
};