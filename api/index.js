const API_URL = "https://api-pastelzinn.vercel.app";

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {

  if (document.getElementById("saboresLista")) {
    loadSabores();
    document.getElementById("confirmarPedido").onclick = sendPedido;
  }

  if (document.getElementById("listaPedidos")) {
    loadPedidos();
    document.getElementById("zerarComandas").onclick = clearPedidos;
  }

  if (document.getElementById("listaSabores")) {
    loadSaboresAdmin();
    document.getElementById("formSabor").onsubmit = addSabor;
  }

  if (document.getElementById("chartSabores")) {
    loadDashboard();
  }
});

// ================= SABORES CLIENTE =================
async function loadSabores() {
  const sabores = await fetch(`${API_URL}/sabores`).then(r => r.json());

  const lista = document.getElementById("saboresLista");
  lista.innerHTML = "";

  sabores.forEach(s => {
    const div = document.createElement("div");

    div.innerHTML = `
      <strong>${s.nome}</strong>
      <small>Estoque: ${s.quantidade}</small>

      <input type="number" id="qtd-${s.id}" value="0" min="0" />
    `;

    lista.appendChild(div);
  });
}

// ================= PEDIDO =================
async function sendPedido() {

  const nome = document.getElementById("nomeCliente").value;
  const paraViagem = document.getElementById("paraViagem").checked;

  const sabores = await fetch(`${API_URL}/sabores`).then(r => r.json());

  const pedido = sabores
    .map(s => ({
      saborId: s.id,
      quantidade: Number(document.getElementById(`qtd-${s.id}`).value)
    }))
    .filter(i => i.quantidade > 0);

  await fetch(`${API_URL}/pedidos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nomeCliente: nome, pedido, paraViagem })
  });

  alert("Pedido enviado!");
  loadSabores();
}

// ================= PEDIDOS =================
async function loadPedidos() {
  const pedidos = await fetch(`${API_URL}/pedidos-completos`).then(r => r.json());

  const lista = document.getElementById("listaPedidos");
  lista.innerHTML = "";

  pedidos
    .filter(p => p.status === "aberto")
    .forEach(p => {

      const li = document.createElement("li");

      li.innerHTML = `<strong>${p.nome_cliente}</strong> ${p.para_viagem ? "🚗" : ""}`;

      const ul = document.createElement("ul");

      p.itens.forEach(i => {
        const item = document.createElement("li");
        item.innerText = `${i.quantidade}x ${i.sabor?.nome || "?"}`;
        ul.appendChild(item);
      });

      li.appendChild(ul);

      const btn = document.createElement("button");
      btn.innerText = "Encerrar";

      btn.onclick = async () => {
        await fetch(`${API_URL}/pedidos/${p.id}`, { method: "DELETE" });
        loadPedidos();
      };

      li.appendChild(btn);
      lista.appendChild(li);
    });
}

// ================= LIMPAR =================
async function clearPedidos() {
  const pedidos = await fetch(`${API_URL}/pedidos`).then(r => r.json());

  await Promise.all(
    pedidos.map(p =>
      fetch(`${API_URL}/pedidos/${p.id}`, { method: "DELETE" })
    )
  );

  loadPedidos();
}