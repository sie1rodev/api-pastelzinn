const { supabase } = require("../lib/supabase");
const allowCors = require("../lib/allowCors");

const handler = async (req, res) => {
  const seteDias = new Date(Date.now() - 7 * 86400000).toISOString();

  const { data } = await supabase
    .from("pedidos")
    .select("*")
    .gte("criado_em", seteDias)
    .eq("status", "encerrado");

  return res.status(200).json({
    vendas_semana: data?.length || 0
  });
};

module.exports = allowCors(handler);