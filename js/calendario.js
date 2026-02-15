function initCalendario() {
  const user = getUser();

  // Demo: o encarregado "vê" alunos associados
  const aulas = [
    { id: 101, aluno: "Ana Silva", turma: "Ballet Iniciados", tipo: "Ballet", data: "2026-02-13 18:00", estado: "Agendada" },
    { id: 102, aluno: "Ana Silva", turma: "Ballet Iniciados", tipo: "Ballet", data: "2026-02-15 18:00", estado: "Agendada" },
    { id: 201, aluno: "Carla Rocha", turma: "Hip Hop Kids", tipo: "Hip Hop", data: "2026-02-14 17:30", estado: "Agendada" },
  ];

  const tbl = document.getElementById("tblCalendario");
  const selAluno = document.getElementById("selAluno");
  const txtFiltro = document.getElementById("txtFiltro");

  const boxSelected = document.getElementById("boxSelected");
  const txtMotivo = document.getElementById("txtMotivo");
  const btnDesmarcar = document.getElementById("btnDesmarcar");

  let selected = null;

  function render(list) {
    tbl.innerHTML = "";
    list.forEach(a => {
      const tr = document.createElement("tr");
      tr.classList.add("pointer");
      tr.innerHTML = `
        <td>${a.id}</td>
        <td>${a.aluno}</td>
        <td>${a.turma}</td>
        <td>${a.tipo}</td>
        <td>${a.data}</td>
        <td>${a.estado}</td>
      `;
      tr.addEventListener("click", () => {
        selected = a;
        boxSelected.innerHTML = `<b>Selecionada:</b> #${a.id} — ${a.aluno} — ${a.turma} — ${a.data}`;
        btnDesmarcar.disabled = false;
      });
      tbl.appendChild(tr);
    });
  }

  function filterList() {
    const a = selAluno.value;
    const q = txtFiltro.value.trim().toLowerCase();
    return aulas.filter(x => {
      const okAluno = (a === "todos") || (x.aluno === a);
      const okText = !q || (x.turma.toLowerCase().includes(q) || x.tipo.toLowerCase().includes(q));
      return okAluno && okText;
    });
  }

  selAluno.addEventListener("change", () => render(filterList()));
  txtFiltro.addEventListener("input", () => render(filterList()));

  btnDesmarcar.addEventListener("click", () => {
    if (!selected) return;
    const motivo = txtMotivo.value.trim();
    if (!motivo) {
      alert("Escreve um motivo para desmarcar.");
      return;
    }

    // Guardar pedido (demo)
    const requests = JSON.parse(localStorage.getItem("desmarcacoes") || "[]");
    requests.unshift({
      id: Date.now(),
      aluno: selected.aluno,
      sessaoId: selected.id,
      data: selected.data,
      turma: selected.turma,
      motivo,
      criadoEm: new Date().toISOString(),
      criadoPor: user?.nome || "encarregado",
      estado: "PENDENTE"
    });
    localStorage.setItem("desmarcacoes", JSON.stringify(requests));

    // Notificar professor (demo)
    const notifs = loadNotifications();
    notifs.unshift({
      id: Date.now() + 1,
      toRole: "PROFESSOR",
      titulo: "Desmarcação de aula",
      mensagem: `${selected.aluno} desmarcou a aula (${selected.turma} - ${selected.data}). Motivo: ${motivo}`,
      lida: false,
      createdAt: new Date().toISOString()
    });
    saveNotifications(notifs);
    renderNotifyBell();

    alert("Desmarcação enviada ao professor!");
    txtMotivo.value = "";
    btnDesmarcar.disabled = true;
    selected = null;
    boxSelected.textContent = "Nenhuma sessão selecionada.";
  });

  render(aulas);
};
