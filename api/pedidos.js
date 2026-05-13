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
    // GET
    // ======================
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("pedidos")
        .select("*, pedido_itens(*, sabores(*))");

      if (error) {
        console.error("GET ERROR:", error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ data });
    }

    // ======================
    // POST
    // ======================
    if (req.method === "POST") {
      const { nome_cliente, para_viagem } = body;

      const { data, error } = await supabase
        .from("pedidos")
        .insert([{ nome_cliente, para_viagem }])
        .select();

      if (error) {
        console.error("POST ERROR:", error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ data });
    }

    // ======================
    // PUT (ENCERRAR PEDIDO)
    // ======================
    if (req.method === "PUT") {
      const { id, status } = body;

      const { data, error } = await supabase
        .from("pedidos")
        .update({ status })
        .eq("id", id)
        .select();

      if (error) {
        console.error("PUT ERROR:", error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ data });
    }

    // ======================
    // DELETE (opcional)
    // ======================
    if (req.method === "DELETE") {
      const { id } = body;

      const { data, error } = await supabase
        .from("pedidos")
        .delete()
        .eq("id", id)
        .select();

      if (error) {
        console.error("DELETE ERROR:", error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ data });
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error("API CRASH:", err);

    return res.status(500).json({
      error: "Internal Server Error",
      details: err.message
    });
  }
};