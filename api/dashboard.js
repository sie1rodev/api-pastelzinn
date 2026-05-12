const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const seteDias = new Date(Date.now() - 7 * 86400000).toISOString();

  const { data } = await supabase
    .from("pedidos")
    .select("*")
    .gte("criado_em", seteDias);

  return res.status(200).json({
    vendas_semana: data?.length || 0
  });
};