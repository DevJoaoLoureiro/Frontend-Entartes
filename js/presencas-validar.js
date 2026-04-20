function initPresencasValidar() {
  const tbl = document.getElementById("tblValidarPresencas");
  const msg = document.getElementById("msgValidarPresencas");

  let pendentes = [];

  function showMsg(text, type = "info") {
    msg.className = `alert alert-${type}`;
    msg.textContent = text;
    msg.classList.remove("d-none");
    setTimeout(() => msg.classList.add("d-none"), 2500);
  }

  function formatDate(dt) {
    if (!dt) return "-";
    const d = new Date(dt);
    if (isNaN(d.getTime())) return String(dt).replace("T", " ").substring(0, 16);
    return d.toLocaleString("pt-PT");
  }

  async function carregarPendentes() {
    try {
      pendentes = await apiGet("sessoes/pendentes-confirmacao");
      render();
    } catch (e) {
      console.error(e);
      showMsg("Erro a carregar confirmações pendentes.", "danger");
      pendentes = [];
      render();
    }
  }

  function render() {
    if (!pendentes.length) {
      tbl.innerHTML = `
        <tr>
          <td colspan="6" class="text-center small-muted">Sem sessões pendentes de confirmação.</td>
        </tr>
      `;
      return;
    }

    tbl.innerHTML = pendentes.map(p => `
      <tr>
        <td>${p.alunoNome}</td>
        <td>${p.turmaNome || "-"}</td>
        <td>${p.professorNome || "-"}</td>
        <td>${formatDate(p.dataInicio)}</td>
        <td>${formatDate(p.dataFim)}</td>
        <td class="text-nowrap">
          <button class="btn btn-sm btn-outline-success me-2" onclick="confirmarSessao(${p.sessaoId}, ${p.alunoId}, true)">
            <i class="fa-solid fa-check me-1"></i> Sim
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="confirmarSessao(${p.sessaoId}, ${p.alunoId}, false)">
            <i class="fa-solid fa-xmark me-1"></i> Não
          </button>
        </td>
      </tr>
    `).join("");
  }

  window.confirmarSessao = async function (sessaoId, alunoId, vai) {
    try {
      await apiPost(`sessoes/${sessaoId}/confirmar`, {
        alunoId: alunoId,
        vai: vai
      });

      showMsg("Confirmação registada com sucesso.", "success");
      await carregarPendentes();
    } catch (e) {
      console.error(e);
      showMsg("Erro ao registar confirmação.", "danger");
    }
  };

  carregarPendentes();
}