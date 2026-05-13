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

    const seteDias = new Date(Date.now() - 7 * 86400000).toISOString();

    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .gte("criado_em", seteDias)
      .eq("status", "encerrado");

    if (error) {
      console.error("GET ERROR:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      vendas_semana: data?.length || 0
    });
  } catch (err) {
    console.error("API CRASH:", err);
    return res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
};