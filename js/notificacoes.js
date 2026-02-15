function initNotificacoes() {
  const user = getUser();
  const role = user?.perfil;

  const lista = document.getElementById("listaNotif");
  const filtro = document.getElementById("filtroLidas");
  const pesquisa = document.getElementById("pesquisaNotif");
  const btnAll = document.getElementById("btnMarcarTodas");
  const msg = document.getElementById("msgNotif");

  function showMsg(text, type) {
    msg.className = `alert alert-${type}`;
    msg.textContent = text;
    msg.classList.remove("d-none");
    setTimeout(() => msg.classList.add("d-none"), 2000);
  }

  // Usa helpers do auth.js se existirem; senão fallback local
  function loadNotifs() {
    if (typeof loadNotifications === "function") return loadNotifications();
    try { return JSON.parse(localStorage.getItem("notifications") || "[]"); } catch { return []; }
  }
  function saveNotifs(arr) {
    if (typeof saveNotifications === "function") return saveNotifications(arr);
    localStorage.setItem("notifications", JSON.stringify(arr));
  }

  let notifs = loadNotifs();

  // Se estiver vazio, cria algumas de exemplo (1x)
  if (!notifs.length) {
    notifs = [
      { id: Date.now()-1, toRole: "ENCARREGADO", titulo: "Novo evento", mensagem: "Torneio de Dança — 2026-03-02 10:00", lida: false, createdAt: new Date().toISOString() },
      { id: Date.now()-2, toRole: "PROFESSOR", titulo: "Aula desmarcada", mensagem: "Aluno X desmarcou a aula (motivo: doente).", lida: false, createdAt: new Date().toISOString() },
      { id: Date.now()-3, toRole: "ADMIN", titulo: "Pagamento pendente", mensagem: "Mensalidade de Fevereiro em atraso.", lida: true, createdAt: new Date().toISOString() },
    ];
    saveNotifs(notifs);
  }

  function visible(n) {
    // mostra apenas notificações da role atual
    return !n.toRole || n.toRole === role;
  }

  function filterList() {
    const q = (pesquisa?.value || "").trim().toLowerCase();
    const f = filtro?.value || "todas";

    return notifs
      .filter(visible)
      .filter(n => {
        if (f === "nao_lidas") return !n.lida;
        if (f === "lidas") return !!n.lida;
        return true;
      })
      .filter(n => !q || ((n.titulo || "") + " " + (n.mensagem || "")).toLowerCase().includes(q))
      .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function itemHtml(n) {
    const badge = n.lida
      ? `<span class="badge text-bg-secondary">Lida</span>`
      : `<span class="badge text-bg-primary">Nova</span>`;

    return `
      <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-start ${n.lida ? "" : "fw-semibold"}">
        <div class="me-3">
          <div class="d-flex align-items-center gap-2">
            <div>${badge}</div>
            <div>${n.titulo || "Notificação"}</div>
          </div>
          <div class="small-muted mt-1">${n.mensagem || ""}</div>
          <div class="small-muted mt-1">${(n.createdAt || "").replace("T"," ").substring(0,19)}</div>
        </div>

        <div class="d-flex gap-2">
          ${n.lida ? "" : `<button class="btn btn-sm btn-outline-success" onclick="marcarLida(${n.id})"><i class="fa-solid fa-check"></i></button>`}
          <button class="btn btn-sm btn-outline-danger" onclick="apagarNotif(${n.id})"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `;
  }

  function render() {
    const list = filterList();
    lista.innerHTML = list.map(itemHtml).join("") || `<div class="small-muted">Sem notificações.</div>`;

    // atualiza bolinha do sino (se existir helper)
    if (typeof renderNotifyBell === "function") renderNotifyBell();
  }

  window.marcarLida = (id) => {
    notifs = notifs.map(n => n.id === id ? { ...n, lida: true } : n);
    saveNotifs(notifs);
    render();
  };

  window.apagarNotif = (id) => {
    if (!confirm("Apagar notificação?")) return;
    notifs = notifs.filter(n => n.id !== id);
    saveNotifs(notifs);
    render();
    showMsg("Notificação apagada.", "success");
  };

  btnAll?.addEventListener("click", () => {
    notifs = notifs.map(n => visible(n) ? { ...n, lida: true } : n);
    saveNotifs(notifs);
    render();
    showMsg("Tudo marcado como lido.", "success");
  });

  filtro?.addEventListener("change", render);
  pesquisa?.addEventListener("input", render);

  render();
}
