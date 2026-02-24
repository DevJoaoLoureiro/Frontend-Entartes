function initTurmas() {
  const tbl = document.getElementById("tblTurmas");
  const pesquisa = document.getElementById("pesquisaTurma");
  const filtroAtiva = document.getElementById("filtroAtiva");
  const msg = document.getElementById("msgTurmas");

  const form = document.getElementById("formTurma");
  const msgCriar = document.getElementById("msgCriarTurma");
  const modalEl = document.getElementById("modalTurma");
  const selProfessor = document.getElementById("turmaProfessor");

  if (!tbl || !pesquisa || !filtroAtiva || !msg || !form || !msgCriar || !modalEl || !selProfessor) {
    console.error("Elementos de Turmas não encontrados (template não injetado?)");
    return;
  }

  let turmas = [];
  let professores = [];

  function showMsg(text, type = "info") {
    msg.className = `alert alert-${type}`;
    msg.textContent = text;
    msg.classList.remove("d-none");
    setTimeout(() => msg.classList.add("d-none"), 2500);
  }

  function showMsgCriar(text, type = "info") {
    msgCriar.className = `alert alert-${type}`;
    msgCriar.textContent = text;
    msgCriar.classList.remove("d-none");
  }
  function hideMsgCriar() {
    msgCriar.classList.add("d-none");
    msgCriar.textContent = "";
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function boolVal(v) {
    if (typeof v === "boolean") return v;
    if (v === 1 || v === "1") return true;
    if (v === 0 || v === "0") return false;
    if (typeof v === "string") return v.toLowerCase() === "true";
    return !!v;
  }

  function badgeAtiva(v) {
    return boolVal(v)
      ? `<span class="badge text-bg-success">Ativa</span>`
      : `<span class="badge text-bg-secondary">Inativa</span>`;
  }

  function filtrar() {
    const q = (pesquisa.value || "").trim().toLowerCase();
    const ativaStr = (filtroAtiva.value || "").trim(); // "", "true", "false"

    return turmas
      .filter(t => {
        if (!q) return true;
        const bag = `${t.nome ?? ""} ${t.professorNome ?? ""}`.toLowerCase();
        return bag.includes(q);
      })
      .filter(t => {
        if (!ativaStr) return true;
        const a = boolVal(t.ativa);
        return ativaStr === "true" ? a : !a;
      });
  }

  function render() {
    const list = filtrar();

    tbl.innerHTML = list.map(t => `
      <tr>
        <td>${t.id}</td>
        <td>${escapeHtml(t.nome)}</td>
        <td>${t.capacidade ?? 0}</td>
        <td>${escapeHtml(t.professorNome || "-")}</td>
        <td>${badgeAtiva(t.ativa)}</td>
      </tr>
    `).join("");

    if (!list.length) {
      tbl.innerHTML = `<tr><td colspan="5" class="text-center small-muted">Sem turmas.</td></tr>`;
    }
  }

  async function carregarTurmas() {
    try {
      turmas = await apiGet("turmas"); // GET /api/turmas
      render();
    } catch (e) {
      console.error(e);
      showMsg("Erro a carregar turmas. Confirma GET /api/turmas.", "danger");
      turmas = [];
      render();
    }
  }

  async function carregarProfessores() {
    try {
      professores = await apiGet("utilizadores/professores"); // GET /api/utilizadores/professores
      selProfessor.innerHTML = `<option value="">— Sem professor —</option>` +
        professores.map(p => `<option value="${p.id}">${escapeHtml(p.nome)}</option>`).join("");
    } catch (e) {
      console.error(e);
      selProfessor.innerHTML = `<option value="">(erro ao carregar professores)</option>`;
    }
  }

  // filtros
  pesquisa.addEventListener("input", render);
  filtroAtiva.addEventListener("change", render);

  // criar turma (POST /api/turmas)
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMsgCriar();

    const payload = {
      nome: document.getElementById("turmaNome").value.trim(),
      capacidade: Number(document.getElementById("turmaCapacidade").value || 0),
      professorId: selProfessor.value ? Number(selProfessor.value) : null
      // nivel: opcional — só se o teu dto suportar
    };

    // se tiveres Nivel no DTO, descomenta:
    const nivel = document.getElementById("turmaNivel").value.trim();
    if (nivel) payload.nivel = nivel;

    try {
      await apiPost("turmas", payload);
      showMsgCriar("Turma criada com sucesso!", "success");

      form.reset();
      selProfessor.value = "";
      bootstrap.Modal.getInstance(modalEl)?.hide();

      await carregarTurmas();
      showMsg("Turma criada.", "success");
    } catch (err) {
      console.error(err);
      showMsgCriar(err.message || "Erro ao criar turma", "danger");
    }
  });

  // ao abrir modal, recarrega professores e limpa msg
  modalEl.addEventListener("show.bs.modal", async () => {
    hideMsgCriar();
    await carregarProfessores();
  });

  // init
  carregarTurmas();
}
