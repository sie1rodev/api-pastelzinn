const { supabase } = require("./lib/supabase");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const seteDias = new Date(Date.now() - 7 * 86400000).toISOString();

<<<<<<< HEAD
  const { data } = await supabase
    .from("pedidos")
    .select("*")
    .gte("criado_em", seteDias)
    .eq("status", "encerrado");
=======
  const { data, error } = await supabase
    .from("pedidos")
    .select("*")
    .gte("criado_em", seteDias);
>>>>>>> parent of f47a228 (refactor: standardize CORS headers and response handling across API endpoints)

  return res.status(200).json({
    vendas_semana: data?.length || 0
  });
};