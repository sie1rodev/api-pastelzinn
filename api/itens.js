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

    // POST - adicionar item
    if (req.method === "POST") {
      const { pedido_id, sabor_id, quantidade } = body;

      const { data, error } = await supabase
        .from("pedido_itens")
        .insert([{ pedido_id, sabor_id, quantidade }]);

      if (error) {
        console.error("POST ERROR:", error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ data });
    }

    // PUT - editar item (AGORA PODE TROCAR SABOR)
    if (req.method === "PUT") {
      const { id, sabor_id, quantidade } = body;

      const { data, error } = await supabase
        .from("pedido_itens")
        .update({ sabor_id, quantidade })
        .eq("id", id);

      if (error) {
        console.error("PUT ERROR:", error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ data });
    }

    // DELETE - remover item da comanda
    if (req.method === "DELETE") {
      const { id } = body;

      const { data, error } = await supabase
        .from("pedido_itens")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("DELETE ERROR:", error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ data });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("API CRASH:", err);
    return res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
};