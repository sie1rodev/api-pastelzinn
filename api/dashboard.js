const { supabase } = require("../lib/supabase");

module.exports = async (req, res) => {
  try {
    // ======================
    // CORS
    // ======================
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    const now = new Date();
    const seteDias = new Date(Date.now() - 7 * 86400000).toISOString();
    const trintaDias = new Date(now.setDate(now.getDate() - 30)).toISOString();

    // ======================
    // PEDIDOS
    // ======================
    const { data: pedidos, error } = await supabase
      .from("pedidos")
      .select("*");

    if (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }

    // ======================
    // FILTROS
    // ======================
    const semana = pedidos.filter(p =>
      new Date(p.criado_em) >= new Date(seteDias) && p.status === "encerrado"
    );

    const mes = pedidos.filter(p =>
      new Date(p.criado_em) >= new Date(trintaDias) && p.status === "encerrado"
    );

    const todosEncerrados = pedidos.filter(p => p.status === "encerrado");

    // ======================
    // TOP SABORES
    // ======================
    function agruparSabores(lista) {
      const map = {};

      lista.forEach(p => {
        const sabor = p.sabor || "Desconhecido";
        const qtd = p.quantidade || 1;

        map[sabor] = (map[sabor] || 0) + qtd;
      });

      return Object.entries(map)
        .map(([sabor, total]) => ({ sabor, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
    }

    return res.status(200).json({
      vendas_semana: semana.length,
      vendas_mes: mes.length,
      total_pedidos: todosEncerrados.length,
      top_sabores_semana: agruparSabores(semana),
      top_sabores_mes: agruparSabores(mes)
    });

  } catch (err) {
    console.error("API CRASH:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      details: err.message
    });
  }
};