function initPagamentos() {
  const user = getUser();
  const role = user?.perfil;

  const tbl = document.getElementById("tblPagamentos");
  const filtro = document.getElementById("filtroEstado");
  const pesquisa = document.getElementById("pesquisaPagamento");
  const form = document.getElementById("formPagamento");
  const msg = document.getElementById("msgPag");

  function showMsg(text, type) {
    msg.className = `alert alert-${type}`;
    msg.textContent = text;
    msg.classList.remove("d-none");
    setTimeout(() => msg.classList.add("d-none"), 2200);
  }

  function loadPays() {
    try { return JSON.parse(localStorage.getItem("pagamentos") || "[]"); } catch { return []; }
  }
  function savePays(arr) {
    localStorage.setItem("pagamentos", JSON.stringify(arr));
  }

  let pagamentos = loadPays();

  // seed (1x)
  if (!pagamentos.length) {
    pagamentos = [
      { id: 1, aluno: "Maria Silva", desc: "Mensalidade Fevereiro", valor: 25.00, venc: "2026-02-10", estado: "PENDENTE" },
      { id: 2, aluno: "João Costa", desc: "Aluguer Traje", valor: 12.50, venc: "2026-02-05", estado: "PAGO" },
      { id: 3, aluno: "Inês Rocha", desc: "Mensalidade Março", valor: 25.00, venc: "2026-03-10", estado: "PENDENTE" },
    ];
    savePays(pagamentos);
  }

  function isAdmin() {
    return role === "ADMIN" || role === "SUPER_ADMIN";
  }

  // Encarregado: para já vê tudo (mock). Depois no backend filtras pelos filhos.
  function visible(p) {
    if (isAdmin()) return true;
    if (role === "ENCARREGADO") return true;
    return false; // professor não vê pagamentos
  }

  function filterList() {
    const f = (filtro?.value || "").trim();
    const q = (pesquisa?.value || "").trim().toLowerCase();

    return pagamentos
      .filter(visible)
      .filter(p => !f || p.estado === f)
      .filter(p => !q || ((p.aluno || "") + " " + (p.desc || "")).toLowerCase().includes(q))
      .sort((a,b) => a.id - b.id);
  }

  function badge(estado) {
    return estado === "PAGO"
      ? `<span class="badge text-bg-success">Pago</span>`
      : `<span class="badge text-bg-warning">Pendente</span>`;
  }

  function render() {
    const list = filterList();

    tbl.innerHTML = list.map(p => {
      const btnAdmin = isAdmin()
        ? `
          <button class="btn btn-sm btn-outline-success me-2" onclick="marcarPago(${p.id})">
            <i class="fa-solid fa-check"></i> Marcar pago
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="removerPagamento(${p.id})">
            <i class="fa-solid fa-trash"></i>
          </button>
        `
        : ``;

      const btnEnc = (role === "ENCARREGADO" && p.estado === "PENDENTE")
        ? `
          <button class="btn btn-sm btn-outline-primary" onclick="pagar(${p.id})">
            <i class="fa-solid fa-credit-card"></i> Pagar
          </button>
        `
        : ``;

      return `
        <tr>
          <td>${p.id}</td>
          <td>${p.aluno}</td>
          <td>${p.desc}</td>
          <td>€${Number(p.valor).toFixed(2)}</td>
          <td>${p.venc}</td>
          <td>${badge(p.estado)}</td>
          <td class="text-nowrap">
            ${btnEnc}
            ${btnAdmin}
          </td>
        </tr>
      `;
    }).join("") || `<tr><td colspan="7" class="text-center small-muted">Sem registos.</td></tr>`;
  }

  window.pagar = (id) => {
    // mock: só marca como pago
    pagamentos = pagamentos.map(p => p.id === id ? { ...p, estado: "PAGO" } : p);
    savePays(pagamentos);
    render();
    showMsg("Pagamento efetuado (mock).", "success");

    // opcional: cria notificação para admin
    if (typeof loadNotifications === "function" && typeof saveNotifications === "function") {
      const notifs = loadNotifications();
      notifs.unshift({
        id: Date.now(),
        toRole: "ADMIN",
        titulo: "Pagamento recebido",
        mensagem: `Pagamento #${id} marcado como pago (mock).`,
        lida: false,
        createdAt: new Date().toISOString()
      });
      saveNotifications(notifs);
      if (typeof renderNotifyBell === "function") renderNotifyBell();
    }
  };

  window.marcarPago = (id) => {
    if (!isAdmin()) return;
    pagamentos = pagamentos.map(p => p.id === id ? { ...p, estado: "PAGO" } : p);
    savePays(pagamentos);
    render();
    showMsg("Marcado como pago.", "success");
  };

  window.removerPagamento = (id) => {
    if (!isAdmin()) return;
    if (!confirm("Remover pagamento?")) return;
    pagamentos = pagamentos.filter(p => p.id !== id);
    savePays(pagamentos);
    render();
    showMsg("Pagamento removido.", "success");
  };

  filtro?.addEventListener("change", render);
  pesquisa?.addEventListener("input", render);

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!isAdmin()) return;

      const novo = {
        id: pagamentos.length ? Math.max(...pagamentos.map(x => x.id)) + 1 : 1,
        aluno: document.getElementById("pagAluno").value.trim(),
        desc: document.getElementById("pagDesc").value.trim(),
        valor: Number(document.getElementById("pagValor").value || 0),
        venc: document.getElementById("pagVenc").value,
        estado: document.getElementById("pagEstado").value
      };

      pagamentos.unshift(novo);
      savePays(pagamentos);

      bootstrap.Modal.getInstance(document.getElementById("modalPagamento"))?.hide();
      form.reset();

      render();
      showMsg("Pagamento criado.", "success");
    });
  }

  render();
}
