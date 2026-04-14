function initTurmas() {
  const tbl = document.getElementById("tblTurmas");
  const pesquisa = document.getElementById("pesquisaTurma");
  const msg = document.getElementById("msgTurmas");

  const formTurma = document.getElementById("formTurma");
  const msgCriarTurma = document.getElementById("msgCriarTurma");
  const modalTurmaEl = document.getElementById("modalTurma");

  const formTipoAula = document.getElementById("formTipoAula");
  const modalTipoAulaEl = document.getElementById("modalTipoAula");
  const msgCriarTipoAula = document.getElementById("msgCriarTipoAula");

  const selectProfessor = document.getElementById("turmaProfessor");
  const selectTipoAula = document.getElementById("turmaTipoAula");

  const secaoDetalhe = document.getElementById("secaoTurmaDetalhe");
  const tituloTurmaSelecionada = document.getElementById("tituloTurmaSelecionada");
  const selectAlunoTurma = document.getElementById("selectAlunoTurma");
  const btnAdicionarAlunoTurma = document.getElementById("btnAdicionarAlunoTurma");
  const tblTurmaAlunos = document.getElementById("tblTurmaAlunos");
  const btnFecharDetalheTurma = document.getElementById("btnFecharDetalheTurma");

  if (
    !tbl || !pesquisa || !msg ||
    !formTurma || !msgCriarTurma || !modalTurmaEl ||
    !formTipoAula || !modalTipoAulaEl || !msgCriarTipoAula ||
    !selectProfessor || !selectTipoAula ||
    !secaoDetalhe || !tituloTurmaSelecionada ||
    !selectAlunoTurma || !btnAdicionarAlunoTurma || !tblTurmaAlunos || !btnFecharDetalheTurma
  ) {
    console.error("Elementos da página de turmas não encontrados.");
    return;
  }

  let turmas = [];
  let turmaSelecionadaId = null;
  let turmaSelecionadaNome = "";

  function showMsg(text, type = "info") {
    msg.className = `alert alert-${type}`;
    msg.textContent = text;
    msg.classList.remove("d-none");
    setTimeout(() => msg.classList.add("d-none"), 3000);
  }

  function showMsgCriar(text, type = "info") {
    msgCriarTurma.className = `alert alert-${type}`;
    msgCriarTurma.textContent = text;
    msgCriarTurma.classList.remove("d-none");
  }

  function hideMsgCriar() {
    msgCriarTurma.classList.add("d-none");
    msgCriarTurma.textContent = "";
  }

  function showMsgCriarTipo(text, type = "info") {
    msgCriarTipoAula.className = `alert alert-${type}`;
    msgCriarTipoAula.textContent = text;
    msgCriarTipoAula.classList.remove("d-none");
  }

  function hideMsgCriarTipo() {
    msgCriarTipoAula.classList.add("d-none");
    msgCriarTipoAula.textContent = "";
  }

  function escapeHtml(v) {
    return String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function filtrarTurmas() {
    const q = (pesquisa.value || "").trim().toLowerCase();

    return turmas.filter(t => {
      if (!q) return true;
      const bag = `${t.nome ?? ""} ${t.professorNome ?? ""} ${t.tipoAulaNome ?? ""}`.toLowerCase();
      return bag.includes(q);
    });
  }

  function renderTurmas() {
    const lista = filtrarTurmas();

    if (!lista.length) {
      tbl.innerHTML = `<tr><td colspan="6" class="text-center">Sem turmas.</td></tr>`;
      return;
    }

    tbl.innerHTML = lista.map(t => `
      <tr>
        <td>${t.id}</td>
        <td>${escapeHtml(t.nome)}</td>
        <td>${escapeHtml(t.professorNome || "-")}</td>
        <td>${escapeHtml(t.tipoAulaNome || "-")}</td>
        <td>${t.ativa ? "Sim" : "Não"}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary" onclick="abrirTurmaDetalhe(${t.id}, '${escapeHtml(t.nome)}')">
            Alunos
          </button>
        </td>
      </tr>
    `).join("");
  }

  async function carregarTurmas() {
    try {
      turmas = await apiGet("turmas");
      renderTurmas();
    } catch (err) {
      console.error(err);
      showMsg(err.message || "Erro ao carregar turmas.", "danger");
      tbl.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Erro ao carregar turmas.</td></tr>`;
    }
  }

  async function carregarProfessores() {
    try {
      const professores = await apiGet("utilizadores/professores");

      selectProfessor.innerHTML = `
        <option value="">Selecionar professor</option>
        ${professores.map(p => `
          <option value="${p.id}">${escapeHtml(p.nome)}</option>
        `).join("")}
      `;
    } catch (err) {
      console.error(err);
      showMsg(err.message || "Erro ao carregar professores.", "danger");
    }
  }

  async function carregarTiposAula() {
    try {
      const tipos = await apiGet("config/tipo-aula");

      selectTipoAula.innerHTML = `
        <option value="">Selecionar tipo de aula</option>
        ${tipos.map(t => `
          <option value="${t.id}">${escapeHtml(t.nome)}</option>
        `).join("")}
      `;
    } catch (err) {
      console.error(err);
      showMsg(err.message || "Erro ao carregar tipos de aula.", "danger");
    }
  }

  async function carregarTodosAlunos() {
    try {
      const alunos = await apiGet("alunos");

      selectAlunoTurma.innerHTML = `
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

  async function carregarAlunosDaTurma(turmaId) {
    try {
      const alunos = await apiGet(`turmas/${turmaId}/alunos`);

      if (!Array.isArray(alunos) || !alunos.length) {
        tblTurmaAlunos.innerHTML = `<tr><td colspan="3" class="text-center">Sem alunos nesta turma.</td></tr>`;
        return;
      }

      tblTurmaAlunos.innerHTML = alunos.map(a => `
        <tr>
          <td>${a.alunoId}</td>
          <td>${escapeHtml(a.nomeAluno || "-")}</td>
          <td>
            <button class="btn btn-sm btn-outline-danger" onclick="removerAlunoTurma(${a.alunoId})">
              Remover
            </button>
          </td>
        </tr>
      `).join("");
    } catch (err) {
      console.error(err);
      tblTurmaAlunos.innerHTML = `<tr><td colspan="3" class="text-center text-danger">Erro ao carregar alunos da turma.</td></tr>`;
      showMsg(err.message || "Erro ao carregar alunos da turma.", "danger");
    }
  }

  window.abrirTurmaDetalhe = async function(turmaId, nome) {
    turmaSelecionadaId = turmaId;
    turmaSelecionadaNome = nome;

    tituloTurmaSelecionada.textContent = `Alunos da Turma: ${nome}`;
    secaoDetalhe.classList.remove("d-none");

    await carregarAlunosDaTurma(turmaId);
  };

  window.removerAlunoTurma = async function(alunoId) {
    if (!turmaSelecionadaId) return;

    try {
      if (!confirm("Remover aluno da turma?")) return;

      if (typeof apiDelete === "function") {
        await apiDelete(`turmas/${turmaSelecionadaId}/alunos/${alunoId}`);
      } else {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/turmas/${turmaSelecionadaId}/alunos/${alunoId}`, {
          method: "DELETE",
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });

        const text = await res.text();
        if (!res.ok) throw new Error(text || "Erro ao remover aluno da turma.");
      }

      showMsg("Aluno removido da turma.", "success");
      await carregarAlunosDaTurma(turmaSelecionadaId);
    } catch (err) {
      console.error(err);
      showMsg(err.message || "Erro ao remover aluno da turma.", "danger");
    }
  };

  btnAdicionarAlunoTurma.addEventListener("click", async () => {
    if (!turmaSelecionadaId) {
      showMsg("Seleciona uma turma.", "warning");
      return;
    }

    const alunoId = selectAlunoTurma.value ? parseInt(selectAlunoTurma.value, 10) : null;
    if (!alunoId) {
      showMsg("Seleciona um aluno.", "warning");
      return;
    }

    try {
      await apiPost(`turmas/${turmaSelecionadaId}/alunos`, { alunoId });
      showMsg("Aluno adicionado à turma.", "success");
      await carregarAlunosDaTurma(turmaSelecionadaId);
    } catch (err) {
      console.error(err);
      showMsg(err.message || "Erro ao adicionar aluno à turma.", "danger");
    }
  });

  btnFecharDetalheTurma.addEventListener("click", () => {
    turmaSelecionadaId = null;
    turmaSelecionadaNome = "";
    secaoDetalhe.classList.add("d-none");
    tblTurmaAlunos.innerHTML = "";
  });

  pesquisa.addEventListener("input", renderTurmas);

  formTurma.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMsgCriar();

    try {
      const dto = {
        nome: document.getElementById("turmaNome").value.trim(),
        professorUtilizadorId: selectProfessor.value ? parseInt(selectProfessor.value, 10) : null,
        tipoAulaId: selectTipoAula.value ? parseInt(selectTipoAula.value, 10) : null
      };

      await apiPost("turmas", dto);

      showMsgCriar("Turma criada com sucesso.", "success");
      formTurma.reset();
      bootstrap.Modal.getInstance(modalTurmaEl)?.hide();

      await carregarTurmas();
    } catch (err) {
      console.error(err);
      showMsgCriar(err.message || "Erro ao criar turma.", "danger");
    }
  });

  formTipoAula.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMsgCriarTipo();

    try {
      const dto = {
         nome: document.getElementById("novoTipoNome").value.trim(),
  descricao: document.getElementById("novoTipoDesc").value.trim() || null,
  duracaoPadrao: document.getElementById("novoTipoDuracao").value
    ? parseInt(document.getElementById("novoTipoDuracao").value, 10)
    : null
      };

      await apiPost("config/tipo-aula", dto);

      showMsgCriarTipo("Tipo de aula criado com sucesso.", "success");
      formTipoAula.reset();
      bootstrap.Modal.getInstance(modalTipoAulaEl)?.hide();

      await carregarTiposAula();
    } catch (err) {
      console.error(err);
      showMsgCriarTipo(err.message || "Erro ao criar tipo de aula.", "danger");
    }
  });

  modalTurmaEl.addEventListener("show.bs.modal", () => {
    hideMsgCriar();
  });

  modalTipoAulaEl.addEventListener("show.bs.modal", () => {
    hideMsgCriarTipo();
  });

  carregarTurmas();
  carregarProfessores();
  carregarTiposAula();
  carregarTodosAlunos();
}