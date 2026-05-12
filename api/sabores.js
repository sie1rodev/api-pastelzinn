const { supabase } = require("../lib/supabase");
const allowCors = require("../lib/allowCors");

const handler = async (req, res) => {
  // Body parse seguro
  const body =
    typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body || {};

  // ======================
  // GET - LISTAR SABORES
  // ======================
  if (req.method === "GET") {

    const { data, error } =
      await supabase
        .from("sabores")
        .select("*");

    return res.status(200).json({
      data,
      error
    });
  }

  // ======================
  // POST - CRIAR SABOR
  // ======================
  if (req.method === "POST") {
    const { nome, quantidade, preco } = body;

    const { data, error } =
      await supabase
        .from("sabores")
        .insert([
          {
            nome,
            quantidade,
            preco
          }
        ])
        .select();

    return res.status(200).json({
      data,
      error
    });
  }

  // ======================
  // PUT - EDITAR SABOR
  // ======================
  if (req.method === "PUT") {

    const { id, nome, quantidade, preco } = body;

    const { data, error } =
      await supabase
        .from("sabores")
        .update({
          nome,
          quantidade,
          preco
        })
        .eq("id", id)
        .select();

    return res.status(200).json({
      data,
      error
    });
  }

  // ======================
  // DELETE - EXCLUIR SABOR
  // ======================
  if (req.method === "DELETE") {
    const { id } = body;

    const { data, error } =
      await supabase
        .from("sabores")
        .delete()
        .eq("id", id)
        .select();

    return res.status(200).json({
      data,
      error
    });
  }

  // ======================
  // METHOD NOT ALLOWED
  // ======================
  return res.status(405).json({
    error: "Method not allowed"
  });
};

module.exports = allowCors(handler);

    const { nome, quantidade, preco } = body;

    const { data, error } =
      await supabase
        .from("sabores")
        .insert([
          {
            nome,
            quantidade,
            preco
          }
        ])
        .select();

    return res.status(200).json({
      data,
      error
    });
  }

  // ======================
  // PUT - EDITAR SABOR
  // ======================
  if (req.method === "PUT") {

    const { id, nome, quantidade, preco } = body;

    const { data, error } =
      await supabase
        .from("sabores")
        .update({
          nome,
          quantidade,
          preco
        })
        .eq("id", id)
        .select();

    return res.status(200).json({
      data,
      error
    });
  }

  // ======================
  // DELETE - EXCLUIR SABOR
  // ======================
  if (req.method === "DELETE") {

    const { id } = body;

    const { data, error } =
      await supabase
        .from("sabores")
        .delete()
        .eq("id", id)
        .select();

    return res.status(200).json({
      data,
      error
    });
  }

  // ======================
  // METHOD NOT ALLOWED
  // ======================
  return res.status(405).json({
    error: "Method not allowed"
  });
};