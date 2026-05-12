const { supabase } = require("../lib/supabase");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const seteDias = new Date(Date.now() - 7 * 86400000).toISOString();

  const { data, error } = await supabase
    .from("pedidos")
    .select("*")
    .gte("criado_em", seteDias);

  return res.status(200).json({
    vendas_semana: data?.length || 0,
    error
  });
};