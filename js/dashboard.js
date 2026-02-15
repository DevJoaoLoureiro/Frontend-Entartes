async function initDashboard() {
  try {
    const alunosCount = await apiGet("alunos/count");
    document.getElementById("kpiAlunos").textContent = alunosCount.total;
  } catch (e) {
    console.error("Erro a carregar KPI alunos:", e);
    const el = document.getElementById("kpiAlunos");
    if (el) el.textContent = "-";
  }

  // Notificações
  const user = getUser();
  const unread = user ? countUnreadForRole(user.perfil) : 0;
  const kpiNotif = document.getElementById("kpiNotif");
  if (kpiNotif) kpiNotif.textContent = unread;

  // Próximas sessões (mock por agora)
  const rows = [
    { turma: "Ballet Iniciados", data: "2026-02-13", hora: "18:00", estado: "Agendada" },
    { turma: "Hip Hop Teens", data: "2026-02-13", hora: "19:30", estado: "Agendada" },
    { turma: "Contemporâneo Adultos", data: "2026-02-14", hora: "18:00", estado: "Cancelada" },
  ];

  const tbl = document.getElementById("tblProximas");
  if (tbl) {
    tbl.innerHTML = rows
      .map(r => `<tr><td>${r.turma}</td><td>${r.data}</td><td>${r.hora}</td><td>${r.estado}</td></tr>`)
      .join("");
  }
}
