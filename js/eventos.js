function initEventos() {
  const user = getUser();
  const role = user?.perfil;

  let eventos = [
    { id: 1, titulo: "Torneio de Dança", local: "Pavilhão Municipal", inicio: "2026-03-02 10:00", fim: "2026-03-02 18:00", publico: true, desc: "Inscrições abertas até 20/02." },
    { id: 2, titulo: "Audições - Grupo Avançado", local: "Sala 1", inicio: "2026-02-20 19:00", fim: "", publico: true, desc: "Trazer roupa confortável." },
  ];

  const box = document.getElementById("listaEventos");
  const pesquisa = document.getElementById("pesquisaEvento");
  const form = document.getElementById("formEvento");

  if (!box) {
    console.error("listaEventos não existe (HTML ainda não foi injetado?)");
    return;
  }

  function visible(e) {
    if (role === "ENCARREGADO") return !!e.publico;
    return true;
  }

  function card(e) {
    return `
      <div class="col-md-6">
        <div class="card card-soft p-3 h-100">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h6 class="mb-1">${e.titulo}</h6>
              <div class="small-muted">${e.local || "-"}</div>
            </div>
            ${ (role === "ADMIN" || role === "SUPER_ADMIN")
                ? `<button class="btn btn-sm btn-outline-danger" onclick="removerEvento(${e.id})"><i class="fa-solid fa-trash"></i></button>`
                : ``}
          </div>
          <hr class="my-2">
          <div class="small"><b>Início:</b> ${e.inicio}</div>
          <div class="small"><b>Fim:</b> ${e.fim || "-"}</div>
          <div class="mt-2">${e.desc || ""}</div>
          <div class="mt-3 small-muted">Visível para encarregados: <b>${e.publico ? "Sim" : "Não"}</b></div>
        </div>
      </div>
    `;
  }

  function filterList() {
    const q = (pesquisa?.value || "").trim().toLowerCase();
    if (!q) return eventos;
    return eventos.filter(e => (e.titulo || "").toLowerCase().includes(q));
  }

  function render(list) {
    const visiveis = list.filter(visible);
    box.innerHTML = visiveis.map(card).join("") || `<div class="small-muted">Sem eventos.</div>`;
  }

  window.removerEvento = (id) => {
    if (!confirm("Remover evento?")) return;
    eventos = eventos.filter(e => e.id !== id);
    render(filterList());
  };

  if (pesquisa) pesquisa.addEventListener("input", () => render(filterList()));

  if (form) {
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();

      const novo = {
        id: eventos.length ? Math.max(...eventos.map(x => x.id)) + 1 : 1,
        titulo: document.getElementById("evtTitulo").value.trim(),
        local: document.getElementById("evtLocal").value.trim(),
        inicio: document.getElementById("evtInicio").value.replace("T"," "),
        fim: document.getElementById("evtFim").value ? document.getElementById("evtFim").value.replace("T"," ") : "",
        desc: document.getElementById("evtDesc").value.trim(),
        publico: document.getElementById("evtPublico").checked
      };

      eventos.unshift(novo);

      bootstrap.Modal.getInstance(document.getElementById("modalEvento"))?.hide();
      form.reset();
      document.getElementById("evtPublico").checked = true;

      render(filterList());
    });
  }

  render(eventos);
}
