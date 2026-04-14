function initPresencas() {
  const selectSessao = document.getElementById("selectSessao");
  const selectAlunoAdicionar = document.getElementById("selectAlunoAdicionar");
  const btnAdicionarAluno = document.getElementById("btnAdicionarAluno");
  const btnGuardar = document.getElementById("btnGuardarPresencas");
  const tbl = document.getElementById("tblPresencas");
  const msg = document.getElementById("msgPresencas");

  if (!selectSessao || !selectAlunoAdicionar || !btnAdicionarAluno || !btnGuardar || !tbl || !msg) {
    console.error("Elementos de presenças não encontrados.");
    return;
  }

  let sessoes = [];
  let linhas = [];

  function showMsg(text, type = "info") {
    msg.className = `alert alert-${type}`;
    msg.textContent = text;
    msg.classList.remove("d-none");
    setTimeout(() => msg.classList.add("d-none"), 3000);
  }

  function escapeHtml(v) {
    return String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDT(dt) {
    if (!dt) return "";
    return new Date(dt).toLocaleString("pt-PT", {
      dateStyle: "short",
      timeStyle: "short"
    });
  }

  function getSessaoIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("sessaoId");
  }

  function render() {
    if (!linhas.length) {
      tbl.innerHTML = `
        <tr>
          <td colspan="4" class="text-center">
            Sem alunos nesta sessão.
          </td>
        </tr>
      `;
      return;
    }

    tbl.innerHTML = linhas.map((l, index) => `
      <tr>
        <td>${l.alunoId}</td>
        <td>${escapeHtml(l.nomeAluno)}</td>
        <td class="text-center">
          <input type="checkbox"
                 class="form-check-input"
                 ${l.presente ? "checked" : ""}
                 onchange="togglePresencaLinha(${index}, this.checked)">
        </td>
        <td>
          <button class="btn btn-sm btn-outline-danger" onclick="removerAlunoDaSessao(${l.alunoId})">
            <i class="fa-solid fa-trash me-1"></i>Remover
          </button>
        </td>
      </tr>
    `).join("");
  }

  window.togglePresencaLinha = function(index, checked) {
    linhas[index].presente = checked;
  };

  async function carregarSessoes() {
    try {
      sessoes = await apiGet("sessoes");

      selectSessao.innerHTML = sessoes.map(s => `
        <option value="${s.id}">
          #${s.id} - ${formatDT(s.inicio)} - ${s.estado ?? ""}
        </option>
      `).join("");

      const sessaoIdUrl = getSessaoIdFromUrl();
      if (sessaoIdUrl) {
        selectSessao.value = sessaoIdUrl;
      }

      if (selectSessao.value) {
        await carregarAlunosSessao(selectSessao.value);
      }
    } catch (err) {
      console.error(err);
      showMsg(err.message || "Erro ao carregar sessões.", "danger");
    }
  }

  async function carregarTodosAlunos() {
    try {
      const alunos = await apiGet("alunos");

      selectAlunoAdicionar.innerHTML = `
        <option value="">Selecionar aluno</option>
        ${alunos.map(a => `
          <option value="${a.id}">${escapeHtml(a.nome)}</option>
        `).join("")}
      `;
    } catch (err) {
      console.error(err);
      showMsg(err.message || "Erro ao carregar alunos.", "danger");
    }
  }

  async function carregarAlunosSessao(sessaoId) {
    try {
      const alunosSessao = await apiGet(`sessoes/${sessaoId}/alunos`);
      let presencas = [];

      try {
        presencas = await apiGet(`sessoes/${sessaoId}/presencas`);
      } catch {
        presencas = [];
      }

      linhas = alunosSessao.map(a => {
        const p = presencas.find(x => x.alunoId === a.alunoId);
        return {
          alunoId: a.alunoId,
          nomeAluno: a.nomeAluno,
          presente: p ? !!p.presente : false
        };
      });

      render();
    } catch (err) {
      console.error(err);
      linhas = [];
      render();
      showMsg(err.message || "Erro ao carregar alunos da sessão.", "danger");
    }
  }

  btnAdicionarAluno.addEventListener("click", async () => {
    try {
      const sessaoId = selectSessao.value;
      const alunoId = selectAlunoAdicionar.value ? parseInt(selectAlunoAdicionar.value, 10) : null;

      if (!sessaoId) {
        showMsg("Seleciona uma sessão.", "warning");
        return;
      }

      if (!alunoId) {
        showMsg("Seleciona um aluno.", "warning");
        return;
      }

      await apiPost(`sessoes/${sessaoId}/alunos`, { alunoId });

      showMsg("Aluno adicionado à sessão.", "success");
      await carregarAlunosSessao(sessaoId);
    } catch (err) {
      console.error(err);
      showMsg(err.message || "Erro ao adicionar aluno à sessão.", "danger");
    }
  });

  window.removerAlunoDaSessao = async function(alunoId) {
    try {
      const sessaoId = selectSessao.value;
      if (!sessaoId) return;

      if (!confirm("Remover aluno desta sessão?")) return;

      if (typeof apiDelete === "function") {
        await apiDelete(`sessoes/${sessaoId}/alunos/${alunoId}`);
      } else {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/sessoes/${sessaoId}/alunos/${alunoId}`, {
          method: "DELETE",
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });

        const text = await res.text();
        if (!res.ok) throw new Error(text || "Erro ao remover aluno.");
      }

      showMsg("Aluno removido da sessão.", "success");
      await carregarAlunosSessao(sessaoId);
    } catch (err) {
      console.error(err);
      showMsg(err.message || "Erro ao remover aluno da sessão.", "danger");
    }
  };

  btnGuardar.addEventListener("click", async () => {
    const sessaoId = selectSessao.value;

    if (!sessaoId) {
      showMsg("Seleciona uma sessão.", "warning");
      return;
    }

    const payload = linhas.map(l => ({
      alunoId: l.alunoId,
      presente: !!l.presente
    }));

    if (!payload.length) {
      showMsg("Não há alunos nesta sessão.", "warning");
      return;
    }

    try {
      await apiPost(`sessoes/${sessaoId}/presencas`, payload);
      showMsg("Presenças guardadas com sucesso.", "success");
      await carregarAlunosSessao(sessaoId);
    } catch (err) {
      console.error(err);
      showMsg(err.message || "Erro ao guardar presenças.", "danger");
    }
  });

  selectSessao.addEventListener("change", async () => {
    await carregarAlunosSessao(selectSessao.value);
  });

  carregarSessoes();
  carregarTodosAlunos();
}