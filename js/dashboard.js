async function initDashboard() {
  const user = getUser();
  const role = user?.perfil || "";

  const el = (id) => document.getElementById(id);

  function isAdmin() {
    return role === "ADMIN" || role === "SUPER_ADMIN";
  }

  function isProfessor() {
    return role === "PROFESSOR";
  }

  function isEEorAluno() {
    return role === "ENCARREGADO" || role === "ALUNO";
  }

  function setText(id, value) {
    const node = el(id);
    if (node) node.textContent = value ?? "—";
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
    if (!dt) return "-";
    return new Date(dt).toLocaleString("pt-PT", {
      dateStyle: "short",
      timeStyle: "short"
    });
  }

  function badgeEstado(estado) {
    const e = String(estado || "").toUpperCase();

    if (e === "PAGO") return `<span class="badge text-bg-success">Pago</span>`;
    if (e === "PENDENTE") return `<span class="badge text-bg-warning">Pendente</span>`;
    if (e === "AGENDADA") return `<span class="badge text-bg-primary">Agendada</span>`;
    if (e === "TERMINADA") return `<span class="badge text-bg-success">Terminada</span>`;
    if (e === "CANCELADA" || e === "CANCELADO") return `<span class="badge text-bg-danger">Cancelado</span>`;

    return `<span class="badge text-bg-secondary">${escapeHtml(estado || "-")}</span>`;
  }

  async function safeGet(path, fallback = []) {
    try {
      return await apiGet(path);
    } catch (err) {
      console.warn(`Falhou GET ${path}:`, err);
      return fallback;
    }
  }

  // =========================
  // CARREGAR DADOS REAIS
  // =========================

  const [
    alunosCountRes,
    turmasRes,
    sessoesRes,
    coachingsRes,
    eventosRes,
    pagamentosRes,
    inventarioRes
  ] = await Promise.allSettled([
    safeGet("alunos/count", { total: 0 }),
    safeGet("turmas", []),
    safeGet("sessoes", []),
    safeGet("sessoes/abertas", []),
    safeGet("eventos", []),
    isAdmin() || isEEorAluno() ? safeGet(isAdmin() ? "pagamentos" : "pagamentos/meus", []) : Promise.resolve([]),
    safeGet("inventario", [])
  ]);

  const alunosCount = alunosCountRes.value?.total ?? 0;
  const turmas = turmasRes.value || [];
  const sessoes = sessoesRes.value || [];
  const coachings = coachingsRes.value || [];
  const eventos = eventosRes.value || [];
  const pagamentos = pagamentosRes.value || [];
  const inventario = inventarioRes.value || [];

  // =========================
  // KPIS
  // =========================

  setText("kpiAlunos", alunosCount);
  setText("kpiTurmas", turmas.filter(t => t.ativa !== false).length);
  setText("kpiSessoes", sessoes.filter(s => !s.foiDada && !s.inscricaoAberta).length);
  setText("kpiCoachings", coachings.length);

  const pendentes = pagamentos.filter(p => String(p.estado || "").toUpperCase() === "PENDENTE");
  const totalPendente = pendentes.reduce((acc, p) => acc + Number(p.valor || 0), 0);

  setText("kpiPagPendentes", pendentes.length);
  setText("kpiValorPendente", `€${totalPendente.toFixed(2)}`);

  const stockBaixo = inventario.filter(i => Number(i.quantidadeDisponivel || 0) <= 1).length;
  setText("kpiStockBaixo", stockBaixo);

  const unread = user && typeof countUnreadForRole === "function"
    ? countUnreadForRole(user.perfil)
    : 0;

  setText("kpiNotif", unread);

  // =========================
  // PRÓXIMAS SESSÕES
  // =========================

  const tblProximas = el("tblProximas");

  const proximas = sessoes
    .filter(s => !s.foiDada)
    .sort((a, b) => new Date(a.inicio) - new Date(b.inicio))
    .slice(0, 6);

  if (tblProximas) {
    tblProximas.innerHTML = proximas.length
      ? proximas.map(s => `
        <tr>
          <td>${escapeHtml(s.turmaNome || (s.inscricaoAberta ? "Coaching" : "-"))}</td>
          <td>${formatDT(s.inicio)}</td>
          <td>${escapeHtml(s.professorNome || "-")}</td>
          <td>${badgeEstado(s.estado)}</td>
        </tr>
      `).join("")
      : `<tr><td colspan="4" class="text-center small-muted">Sem próximas sessões.</td></tr>`;
  }

  // =========================
  // COACHINGS ABERTOS
  // =========================

  const tblCoachings = el("tblCoachingsDash");

  if (tblCoachings) {
    tblCoachings.innerHTML = coachings.length
      ? coachings.slice(0, 5).map(c => `
        <tr>
          <td>${formatDT(c.inicio)}</td>
          <td>${escapeHtml(c.sumario || "-")}</td>
          <td>€${Number(c.precoCoaching || 0).toFixed(2)}</td>
          <td>${badgeEstado(c.estado)}</td>
        </tr>
      `).join("")
      : `<tr><td colspan="4" class="text-center small-muted">Sem coachings abertos.</td></tr>`;
  }

  // =========================
  // PAGAMENTOS PENDENTES
  // =========================

  const tblPagamentos = el("tblPagamentosDash");

  if (tblPagamentos) {
    tblPagamentos.innerHTML = pendentes.length
      ? pendentes.slice(0, 6).map(p => `
        <tr>
          <td>${escapeHtml(p.nomeAluno || "-")}</td>
          <td>${escapeHtml(p.tipo || "-")}</td>
          <td>${escapeHtml(p.descricao || p.referencia || "-")}</td>
          <td>€${Number(p.valor || 0).toFixed(2)}</td>
        </tr>
      `).join("")
      : `<tr><td colspan="4" class="text-center small-muted">Sem pagamentos pendentes.</td></tr>`;
  }

  // =========================
  // EVENTOS
  // =========================

  const tblEventos = el("tblEventosDash");

  const proximosEventos = eventos
    .filter(e => new Date(e.dataInicio) >= new Date())
    .sort((a, b) => new Date(a.dataInicio) - new Date(b.dataInicio))
    .slice(0, 5);

  if (tblEventos) {
    tblEventos.innerHTML = proximosEventos.length
      ? proximosEventos.map(e => `
        <tr>
          <td>${escapeHtml(e.titulo)}</td>
          <td>${formatDT(e.dataInicio)}</td>
          <td>${escapeHtml(e.local || "-")}</td>
        </tr>
      `).join("")
      : `<tr><td colspan="3" class="text-center small-muted">Sem próximos eventos.</td></tr>`;
  }

  // =========================
  // UI POR ROLE
  // =========================

  document.querySelectorAll("[data-admin-only]").forEach(x => {
    if (!isAdmin()) x.classList.add("d-none");
  });

  document.querySelectorAll("[data-prof-admin]").forEach(x => {
    if (!isAdmin() && !isProfessor()) x.classList.add("d-none");
  });
}