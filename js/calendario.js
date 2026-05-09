function initCalendario() {
  const user = getUser();
  const role = user?.perfil || "";

  const tbl = document.getElementById("tblCalendario");
  const selAluno = document.getElementById("selAluno");
  const txtFiltro = document.getElementById("txtFiltro");
  const boxSelected = document.getElementById("boxSelected");
  const txtMotivo = document.getElementById("txtMotivo");
  const btnDesmarcar = document.getElementById("btnDesmarcar");

  let sessoes = [];
  let selecionada = null;

  function escapeHtml(v) {
    return String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDT(dt) {
    if (!dt) return "-";
    return new Date(dt).toLocaleString("pt-PT", {
      dateStyle: "short",
      timeStyle: "short"
    });
  }

  function badgeEstado(s) {
    if (s.vai === true) return `<span class="badge text-bg-success">Confirmada</span>`;
    if (s.vai === false) return `<span class="badge text-bg-danger">Desmarcada</span>`;
    return `<span class="badge text-bg-warning">Pendente</span>`;
  }

  function preencherFiltroAlunos() {
    const nomes = [...new Set(sessoes.map(x => x.alunoNome).filter(Boolean))];

    selAluno.innerHTML = `
      <option value="todos">Todos</option>
      ${nomes.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("")}
    `;
  }

  function filtrar() {
    const aluno = selAluno.value;
    const q = (txtFiltro.value || "").trim().toLowerCase();

    return sessoes.filter(s => {
      if (aluno !== "todos" && s.alunoNome !== aluno) return false;

      const bag = `
        ${s.alunoNome || ""}
        ${s.turmaNome || ""}
        ${s.professorNome || ""}
        ${s.tipoAulaNome || ""}
      `.toLowerCase();

      return !q || bag.includes(q);
    });
  }

  function render() {
    const lista = filtrar();

    if (!lista.length) {
      tbl.innerHTML = `<tr><td colspan="6" class="text-center small-muted">Sem aulas para mostrar.</td></tr>`;
      return;
    }

    tbl.innerHTML = lista.map(s => `
      <tr style="cursor:pointer;" onclick="selecionarSessao(${s.sessaoId}, ${s.alunoId})">
        <td>${s.sessaoId}</td>
        <td>${escapeHtml(s.alunoNome || "-")}</td>
        <td>${escapeHtml(s.turmaNome || "-")}</td>
        <td>${escapeHtml(s.tipoAulaNome || "-")}</td>
        <td>${formatDT(s.dataInicio)}</td>
        <td>${badgeEstado(s)}</td>
      </tr>
    `).join("");
  }

  async function carregar() {
    try {
      // Usa o endpoint que já tens para EE/ALUNO
      sessoes = await apiGet("sessoes/pendentes-confirmacao");

      // Como o teu endpoint só devolve pendentes, forçamos estado visual pendente
      sessoes = sessoes.map(s => ({
        ...s,
        vai: null,
        tipoAulaNome: s.tipoAulaNome || "Aula"
      }));

      preencherFiltroAlunos();
      render();
    } catch (err) {
      console.error(err);
      tbl.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Erro ao carregar calendário.</td></tr>`;
    }
  }

  window.selecionarSessao = function(sessaoId, alunoId) {
    selecionada = sessoes.find(s => s.sessaoId === sessaoId && s.alunoId === alunoId);

    if (!selecionada) return;

    boxSelected.textContent = `${selecionada.alunoNome} — ${formatDT(selecionada.dataInicio)}`;
    btnDesmarcar.disabled = false;
  };

  btnDesmarcar.addEventListener("click", async () => {
    if (!selecionada) return;

    const motivo = (txtMotivo.value || "").trim();

    if (!motivo) {
      alert("Indica o motivo da desmarcação.");
      return;
    }

    try {
      await apiPost(`sessoes/${selecionada.sessaoId}/confirmar`, {
        alunoId: selecionada.alunoId,
        vai: false,
        motivo
      });

      selecionada.vai = false;

      boxSelected.textContent = "Nenhuma sessão selecionada.";
      txtMotivo.value = "";
      btnDesmarcar.disabled = true;
      selecionada = null;

      await carregar();
    } catch (err) {
      console.error(err);
      alert(err.message || "Erro ao desmarcar aula.");
    }
  });

  selAluno.addEventListener("change", render);
  txtFiltro.addEventListener("input", render);

  carregar();
}