function initEventos() {
  const user = getUser();
  const role = user?.perfil;

  const box = document.getElementById("listaEventos");
  const pesquisa = document.getElementById("pesquisaEvento");
  const form = document.getElementById("formEvento");

  if (!box) {
    console.error("listaEventos não existe (HTML ainda não foi injetado?)");
    return;
  }

  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const isProfessor = role === "PROFESSOR";
  const isEncarregado = role === "ENCARREGADO";
  const isAluno = role === "ALUNO";

  let todosEventos = [];
  let professores = [];
  let educandos = [];
  let eventoSelecionadoId = null;

  // Mostrar/esconder botão novo evento
  const btnNovo = document.querySelector("[data-bs-target='#modalEvento']");
  if (btnNovo && !isAdmin) btnNovo.classList.add("d-none");

  // ─── Helpers ───────────────────────────────────────────────
  function formatDt(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleString("pt-PT", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  }

  function toInputDt(iso) {
    if (!iso) return "";
    return iso.slice(0, 16);
  }

  function escapeHtml(v) {
    return String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ─── Card ───────────────────────────────────────────────────
  function card(e) {
    // Botões de ação por perfil
    let acoes = "";

    if (isAdmin || isProfessor) {
      acoes += `
        <button class="btn btn-sm btn-outline-primary" onclick="verInscritosEvento(${e.id})">
          <i class="fa-solid fa-users me-1"></i>Inscritos
        </button>`;
    }

    if (isAluno) {
      acoes += `
        <button class="btn btn-sm btn-primary" onclick="inscreverMeEvento(${e.id})">
          <i class="fa-solid fa-user-plus me-1"></i>Inscrever-me
        </button>`;
    }

    if (isEncarregado) {
      acoes += `
        <button class="btn btn-sm btn-primary" onclick="abrirModalEducandosEvento(${e.id})">
          <i class="fa-solid fa-children me-1"></i>Inscrever educandos
        </button>`;
    }

    if (isAdmin) {
      acoes += `
        <button class="btn btn-sm btn-outline-secondary" onclick="editarEvento(${e.id})">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="removerEvento(${e.id})">
          <i class="fa-solid fa-trash"></i>
        </button>`;
    }

    return `
      <div class="col-md-6">
        <div class="card card-soft p-3 h-100">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h6 class="mb-1">${escapeHtml(e.titulo)}</h6>
              <div class="small-muted">${escapeHtml(e.local || "-")}</div>
            </div>
            <div class="d-flex gap-1 flex-wrap justify-content-end">
              ${acoes}
            </div>
          </div>
          <hr class="my-2">
          <div class="small"><b>Início:</b> ${formatDt(e.dataInicio)}</div>
          <div class="small"><b>Fim:</b> ${formatDt(e.dataFim)}</div>
          <div class="mt-2">${escapeHtml(e.descricao || "")}</div>
          <div class="mt-3 small-muted">Visível para encarregados: <b>${e.publico ? "Sim" : "Não"}</b></div>
        </div>
      </div>
    `;
  }

  // ─── Render ─────────────────────────────────────────────────
  function filterList() {
    const q = (pesquisa?.value || "").trim().toLowerCase();
    if (!q) return todosEventos;
    return todosEventos.filter(e => (e.titulo || "").toLowerCase().includes(q));
  }

  function render(list) {
    box.innerHTML = list.length
      ? list.map(card).join("")
      : `<div class="small-muted p-2">Sem eventos.</div>`;
  }

  function renderFiltered() {
    render(filterList());
  }

  // ─── Professores ────────────────────────────────────────────
  function renderProfessores() {
    const lista = document.getElementById("listaProfessoresEvento");
    if (!lista) return;
    if (!professores.length) {
      lista.innerHTML = `<div class="text-muted small">Sem professores disponíveis.</div>`;
      return;
    }
    lista.innerHTML = professores.map(p => `
      <div class="form-check mb-1">
        <input class="form-check-input chk-prof-evento" type="checkbox" value="${p.id}" id="prof_${p.id}">
        <label class="form-check-label small" for="prof_${p.id}">${escapeHtml(p.nome)}</label>
      </div>
    `).join("");
  }

  async function carregarProfessores() {
    if (!isAdmin) return;
    try {
      professores = await apiGet("utilizadores/professores");
      renderProfessores();
    } catch (err) {
      console.error("Erro ao carregar professores:", err);
    }
  }

  // ─── Carregar eventos ────────────────────────────────────────
  async function carregarEventos() {
    try {
      todosEventos = await apiGet("eventos");
      renderFiltered();
    } catch (err) {
      box.innerHTML = `<div class="text-danger small">Erro ao carregar eventos: ${err.message}</div>`;
    }
  }

  // ─── Apagar ─────────────────────────────────────────────────
  window.removerEvento = async (id) => {
    if (!confirm("Remover evento?")) return;
    try {
      await apiDelete(`eventos/${id}`);
      todosEventos = todosEventos.filter(e => e.id !== id);
      renderFiltered();
    } catch (err) {
      alert("Erro ao remover evento: " + err.message);
    }
  };

  // ─── Editar ─────────────────────────────────────────────────
  window.editarEvento = (id) => {
    const e = todosEventos.find(x => x.id === id);
    if (!e) return;

    document.getElementById("evtTitulo").value = e.titulo || "";
    document.getElementById("evtLocal").value = e.local || "";
    document.getElementById("evtInicio").value = toInputDt(e.dataInicio);
    document.getElementById("evtFim").value = toInputDt(e.dataFim);
    document.getElementById("evtDesc").value = e.descricao || "";

    // Público: o modal bonito usa checkbox
    const pubChk = document.getElementById("evtPublico");
    if (pubChk) pubChk.checked = !!e.publico;

    // Marcar professores se existirem
    document.querySelectorAll(".chk-prof-evento").forEach(chk => {
      chk.checked = (e.professoresIds || []).includes(parseInt(chk.value));
    });

    form.dataset.editId = id;
    document.querySelector("#modalEvento .modal-title").textContent = "Editar evento";
    new bootstrap.Modal(document.getElementById("modalEvento")).show();
  };

  // Limpa o modal ao fechar
  document.getElementById("modalEvento")?.addEventListener("hidden.bs.modal", () => {
    form.reset();
    delete form.dataset.editId;
    const pubChk = document.getElementById("evtPublico");
    if (pubChk) pubChk.checked = true;
    document.querySelectorAll(".chk-prof-evento").forEach(c => c.checked = false);
    document.querySelector("#modalEvento .modal-title").textContent = "Novo evento";
  });

  // ─── Submit form (criar / editar) ────────────────────────────
  if (form) {
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();

      const professorIds = [...document.querySelectorAll(".chk-prof-evento:checked")]
        .map(x => parseInt(x.value, 10));

      const pubChk = document.getElementById("evtPublico");
      const publico = pubChk ? pubChk.checked : true;

      const payload = {
        titulo: document.getElementById("evtTitulo").value.trim(),
        local: document.getElementById("evtLocal").value.trim() || null,
        dataInicio: new Date(document.getElementById("evtInicio").value).toISOString(),
        dataFim: document.getElementById("evtFim").value
          ? new Date(document.getElementById("evtFim").value).toISOString()
          : null,
        descricao: document.getElementById("evtDesc").value.trim() || null,
        publico,
        professoresIds: professorIds
      };

      const editId = form.dataset.editId;

      try {
        if (editId) {
          const updated = await apiPut(`eventos/${editId}`, payload);
          const idx = todosEventos.findIndex(e => e.id === parseInt(editId));
          if (idx !== -1) todosEventos[idx] = updated;
        } else {
          const novo = await apiPost("eventos", payload);
          todosEventos.unshift(novo);
        }

        bootstrap.Modal.getInstance(document.getElementById("modalEvento"))?.hide();
        renderFiltered();
      } catch (err) {
        alert("Erro ao guardar evento: " + err.message);
      }
    });
  }

  // ─── Inscrever-me (Aluno) ─────────────────────────────────
  window.inscreverMeEvento = async function (eventoId) {
    try {
      await apiPost(`eventos/${eventoId}/inscrever-me`, {});
      alert("Inscrição efetuada com sucesso.");
    } catch (err) {
      alert(err.message || "Erro ao inscrever no evento.");
    }
  };

  // ─── Modal educandos (Encarregado) ────────────────────────
  window.abrirModalEducandosEvento = async function (eventoId) {
    eventoSelecionadoId = eventoId;
    const lista = document.getElementById("listaEducandosEvento");
    const msg = document.getElementById("msgModalEducandosEvento");
    if (msg) { msg.classList.add("d-none"); msg.textContent = ""; }

    try {
      educandos = await apiGet("alunos/meus-educandos");

      if (!lista) return;

      if (!educandos.length) {
        lista.innerHTML = `<div class="text-muted small">Não tens educandos associados.</div>`;
      } else {
        lista.innerHTML = educandos.map(e => `
          <div class="form-check mb-2">
            <input class="form-check-input chk-educando-evento" type="checkbox" value="${e.id}" id="edu_evento_${e.id}">
            <label class="form-check-label small" for="edu_evento_${e.id}">${escapeHtml(e.nome)}</label>
          </div>
        `).join("");
      }

      new bootstrap.Modal(document.getElementById("modalInscreverEducandosEvento")).show();
    } catch (err) {
      alert(err.message || "Erro ao abrir inscrição de educandos.");
    }
  };

  document.getElementById("formInscreverEducandosEvento")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("msgModalEducandosEvento");

    const alunoIds = [...document.querySelectorAll(".chk-educando-evento:checked")]
      .map(x => parseInt(x.value, 10));

    if (!alunoIds.length) {
      if (msg) { msg.className = "alert alert-warning"; msg.textContent = "Seleciona pelo menos um educando."; msg.classList.remove("d-none"); }
      return;
    }

    try {
      await apiPost(`eventos/${eventoSelecionadoId}/inscrever-educandos`, { alunoIds });
      bootstrap.Modal.getInstance(document.getElementById("modalInscreverEducandosEvento"))?.hide();
      alert("Educandos inscritos com sucesso.");
    } catch (err) {
      if (msg) { msg.className = "alert alert-danger"; msg.textContent = err.message || "Erro ao inscrever educandos."; msg.classList.remove("d-none"); }
    }
  });

  // ─── Modal inscritos (Admin / Professor) ──────────────────
  window.verInscritosEvento = async function (eventoId) {
    eventoSelecionadoId = eventoId;
    const tbl = document.getElementById("tblInscritosEvento");
    const msg = document.getElementById("msgModalInscritosEvento");
    if (msg) { msg.classList.add("d-none"); msg.textContent = ""; }

    try {
      const inscritos = await apiGet(`eventos/${eventoId}/inscritos`);

      if (!tbl) return;

      if (!inscritos.length) {
        tbl.innerHTML = `<tr><td colspan="6" class="text-center small-muted">Sem inscritos.</td></tr>`;
      } else {
        tbl.innerHTML = inscritos.map(i => `
          <tr>
            <td class="small">${i.id}</td>
            <td class="small">${escapeHtml(i.nomeAluno || "-")}</td>
            <td class="small">${formatDt(i.inscritoEm)}</td>
            <td class="small">${escapeHtml(i.inscritoPor || "-")}</td>
            <td>
              ${(isProfessor || isAdmin) ? `
                <select class="form-select form-select-sm" id="avaliacao_${i.id}">
                  <option value="">Sem avaliação</option>
                  ${[0,1,2,3,4,5].map(n => `<option value="${n}" ${i.avaliacao === n ? "selected" : ""}>${n}</option>`).join("")}
                </select>
              ` : `<span class="small">${escapeHtml(i.avaliacao ?? "-")}</span>`}
            </td>
            <td>
              ${(isProfessor || isAdmin) ? `
                <button class="btn btn-sm btn-success" onclick="guardarAvaliacaoEvento(${i.id})">
                  <i class="fa-solid fa-check me-1"></i>Guardar
                </button>
              ` : "-"}
            </td>
          </tr>
        `).join("");
      }

      new bootstrap.Modal(document.getElementById("modalInscritosEvento")).show();
    } catch (err) {
      alert(err.message || "Erro ao carregar inscritos.");
    }
  };

  window.guardarAvaliacaoEvento = async function (inscricaoId) {
    const msg = document.getElementById("msgModalInscritosEvento");
    try {
      const select = document.getElementById(`avaliacao_${inscricaoId}`);
      const avaliacao = select?.value === "" ? null : parseInt(select.value, 10);
      await apiPatch(`eventos/inscricoes/${inscricaoId}/avaliar`, { avaliacao });
      if (msg) { msg.className = "alert alert-success"; msg.textContent = "Avaliação guardada com sucesso."; msg.classList.remove("d-none"); }
      setTimeout(() => msg?.classList.add("d-none"), 3000);
    } catch (err) {
      if (msg) { msg.className = "alert alert-danger"; msg.textContent = err.message || "Erro ao guardar avaliação."; msg.classList.remove("d-none"); }
    }
  };

  // ─── Pesquisa ───────────────────────────────────────────────
  if (pesquisa) pesquisa.addEventListener("input", renderFiltered);

  // ─── Init ───────────────────────────────────────────────────
  carregarProfessores();
  carregarEventos();
}