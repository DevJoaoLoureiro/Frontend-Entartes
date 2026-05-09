function initPagamentos() {
  const user = getUser();
  const role = user?.perfil;

  const tbl = document.getElementById("tblPagamentos");
  const filtro = document.getElementById("filtroEstado");
  const pesquisa = document.getElementById("pesquisaPagamento");
  const msg = document.getElementById("msgPag");

  let pagamentos = [];

  function showMsg(text, type = "info") {
    if (!msg) return;
    msg.className = `alert alert-${type}`;
    msg.textContent = text;
    msg.classList.remove("d-none");
    setTimeout(() => msg.classList.add("d-none"), 3000);
  }

  function isAdmin() {
    return role === "ADMIN" || role === "SUPER_ADMIN";
  }

  function escapeHtml(v) {
    return String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDate(dt) {
    if (!dt) return "-";
    return new Date(dt).toLocaleDateString("pt-PT");
  }

  function badge(estado) {
    const e = String(estado || "").toUpperCase();

    if (e === "PAGO") return `<span class="badge text-bg-success">Pago</span>`;
    if (e === "CANCELADO") return `<span class="badge text-bg-danger">Cancelado</span>`;

    return `<span class="badge text-bg-warning">Pendente</span>`;
  }

  async function carregarPagamentos() {
    try {
      if (isAdmin()) {
        pagamentos = await apiGet("pagamentos");
      } else if (role === "ENCARREGADO" || role === "ALUNO") {
        pagamentos = await apiGet("pagamentos/meus");
      } else {
        pagamentos = [];
      }

      render();
    } catch (err) {
      console.error(err);
      showMsg(err.message || "Erro ao carregar pagamentos.", "danger");
      tbl.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Erro ao carregar pagamentos.</td></tr>`;
    }
  }

  function filterList() {
    const f = (filtro?.value || "").trim().toUpperCase();
    const q = (pesquisa?.value || "").trim().toLowerCase();

    return pagamentos
      .filter(p => !f || String(p.estado || "").toUpperCase() === f)
      .filter(p => {
        if (!q) return true;

        const bag = `
          ${p.nomeAluno || ""}
          ${p.descricao || ""}
          ${p.referencia || ""}
          ${p.tipo || ""}
          ${p.estado || ""}
        `.toLowerCase();

        return bag.includes(q);
      })
      .sort((a, b) => new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0));
  }

  function render() {
    const list = filterList();

    if (!tbl) return;

    if (!list.length) {
      tbl.innerHTML = `<tr><td colspan="7" class="text-center small-muted">Sem pagamentos.</td></tr>`;
      return;
    }

    tbl.innerHTML = list.map(p => `
      <tr>
        <td>${p.id}</td>
        <td>${escapeHtml(p.nomeAluno || "-")}</td>
        <td>
          <div><b>${escapeHtml(p.tipo || "-")}</b></div>
          <div class="small-muted">${escapeHtml(p.descricao || "-")}</div>
          <div class="small text-muted">${escapeHtml(p.referencia || "")}</div>
        </td>
        <td>€${Number(p.valor || 0).toFixed(2)}</td>
        <td>${formatDate(p.criadoEm)}</td>
        <td>${badge(p.estado)}</td>
        <td class="text-nowrap">
          ${isAdmin() && String(p.estado || "").toUpperCase() === "PENDENTE" ? `
            <button class="btn btn-sm btn-outline-success me-2" onclick="marcarPago(${p.id})">
              <i class="fa-solid fa-check"></i> Marcar pago
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="cancelarPagamento(${p.id})">
              <i class="fa-solid fa-ban"></i> Cancelar
            </button>
          ` : "-"}
        </td>
      </tr>
    `).join("");
  }

  window.marcarPago = async function(id) {
    if (!isAdmin()) return;

    try {
      await apiPatch(`pagamentos/${id}/pagar`, {});
      showMsg("Pagamento marcado como pago.", "success");
      await carregarPagamentos();
    } catch (err) {
      console.error(err);
      showMsg(err.message || "Erro ao marcar pagamento.", "danger");
    }
  };

  window.cancelarPagamento = async function(id) {
    if (!isAdmin()) return;
    if (!confirm("Cancelar este pagamento?")) return;

    try {
      await apiPatch(`pagamentos/${id}/cancelar`, {});
      showMsg("Pagamento cancelado.", "success");
      await carregarPagamentos();
    } catch (err) {
      console.error(err);
      showMsg(err.message || "Erro ao cancelar pagamento.", "danger");
    }
  };

  filtro?.addEventListener("change", render);
  pesquisa?.addEventListener("input", render);

  carregarPagamentos();
}