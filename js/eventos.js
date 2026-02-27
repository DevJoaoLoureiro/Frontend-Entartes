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

  let todosEventos = [];

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

  // ─── Card ───────────────────────────────────────────────────
  function card(e) {
    const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
    return `
      <div class="col-md-6">
        <div class="card card-soft p-3 h-100">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h6 class="mb-1">${e.titulo}</h6>
              <div class="small-muted">${e.local || "-"}</div>
            </div>
            ${isAdmin ? `
              <div class="d-flex gap-1">
                <button class="btn btn-sm btn-outline-secondary" onclick="editarEvento(${e.id})">
                  <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="removerEvento(${e.id})">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>` : ""}
          </div>
          <hr class="my-2">
          <div class="small"><b>Início:</b> ${formatDt(e.dataInicio)}</div>
          <div class="small"><b>Fim:</b> ${formatDt(e.dataFim)}</div>
          <div class="mt-2">${e.descricao || ""}</div>
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

  // ─── Carregar ───────────────────────────────────────────────
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
    document.getElementById("evtPublico").checked = !!e.publico;

    form.dataset.editId = id;
    document.querySelector("#modalEvento .modal-title").textContent = "Editar evento";

    new bootstrap.Modal(document.getElementById("modalEvento")).show();
  };

  // Limpa o modal ao fechar
  document.getElementById("modalEvento")?.addEventListener("hidden.bs.modal", () => {
    form.reset();
    delete form.dataset.editId;
    document.getElementById("evtPublico").checked = true;
    document.querySelector("#modalEvento .modal-title").textContent = "Novo evento";
  });

  // ─── Submit form ────────────────────────────────────────────
  if (form) {
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();

      const payload = {
        titulo: document.getElementById("evtTitulo").value.trim(),
        local: document.getElementById("evtLocal").value.trim() || null,
        dataInicio: new Date(document.getElementById("evtInicio").value).toISOString(),
        dataFim: document.getElementById("evtFim").value
          ? new Date(document.getElementById("evtFim").value).toISOString()
          : null,
        descricao: document.getElementById("evtDesc").value.trim() || null,
        publico: document.getElementById("evtPublico").checked
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

  // ─── Pesquisa ───────────────────────────────────────────────
  if (pesquisa) pesquisa.addEventListener("input", renderFiltered);

  // ─── Init ───────────────────────────────────────────────────
  carregarEventos();
}