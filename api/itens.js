const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method === "POST") {
    const body = JSON.parse(req.body || "{}");

    const { data, error } = await supabase
      .from("pedido_itens")
      .insert([body]);

    return res.status(200).json({ data, error });
  }

  return res.status(405).json({ error: "Method not allowed" });
};