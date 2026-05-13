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

    const body = req.body || {};

    // ======================
    // GET - LISTAR SABORES
    // ======================
    if (req.method === "GET") {

      const { data, error } =
        await supabase
          .from("sabores")
          .select("*");

      if (error) {
        console.error("GET ERROR:", error);
        return res.status(500).json({
          error: error.message
        });
      }

      return res.status(200).json({ data });
    }

    // ======================
    // POST - CRIAR SABOR
    // ======================
    if (req.method === "POST") {

      const { nome, quantidade, preco } = body;

      const { data, error } =
        await supabase
          .from("sabores")
          .insert([{ nome, quantidade, preco }])
          .select();

      if (error) {
        console.error("POST ERROR:", error);
        return res.status(500).json({
          error: error.message
        });
      }

      return res.status(200).json({ data });
    }

    // ======================
    // PUT - EDITAR SABOR
    // ======================
    if (req.method === "PUT") {

      const { id, nome, quantidade, preco } = body;

      const { data, error } =
        await supabase
          .from("sabores")
          .update({ nome, quantidade, preco })
          .eq("id", id)
          .select();

      if (error) {
        console.error("PUT ERROR:", error);
        return res.status(500).json({
          error: error.message
        });
      }

      return res.status(200).json({ data });
    }

    // ======================
    // DELETE - EXCLUIR SABOR
    // ======================
    if (req.method === "DELETE") {

      const { id } = body;

      const { data, error } =
        await supabase
          .from("sabores")
          .delete()
          .eq("id", id)
          .select();

      if (error) {
        console.error("DELETE ERROR:", error);
        return res.status(500).json({
          error: error.message
        });
      }

      return res.status(200).json({ data });
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