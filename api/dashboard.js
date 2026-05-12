import { supabase } from "../lib/supabase.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const seteDias = new Date(Date.now() - 7 * 86400000).toISOString();

  const { data, error } = await supabase
    .from("pedidos")
    .select("*")
    .gte("criado_em", seteDias);

  return res.json({
    vendas_semana: data?.length || 0,
    error
  });
}