function initSessoes() {

  let sessoes = JSON.parse(localStorage.getItem("sessoes") || "[]");

  if (!sessoes.length) {
    sessoes = [
      { id: 1, turma: "Ballet Iniciados", data: "2026-02-20", hora: "18:00", estado: "AGENDADA" },
      { id: 2, turma: "Hip Hop Teens", data: "2026-02-21", hora: "19:30", estado: "AGENDADA" }
    ];
    localStorage.setItem("sessoes", JSON.stringify(sessoes));
  }

  const tbl = document.getElementById("tblSessoes");
  const form = document.getElementById("formSessao");

  function render() {
    tbl.innerHTML = sessoes.map(s => `
      <tr>
        <td>${s.id}</td>
        <td>${s.turma}</td>
        <td>${s.data}</td>
        <td>${s.hora}</td>
        <td>${s.estado}</td>
        <td>
          <button class="btn btn-sm btn-outline-danger" onclick="cancelarSessao(${s.id})">
            Cancelar
          </button>
        </td>
      </tr>
    `).join("");
  }

  window.cancelarSessao = (id) => {
    sessoes = sessoes.map(s => s.id === id ? { ...s, estado: "CANCELADA" } : s);
    localStorage.setItem("sessoes", JSON.stringify(sessoes));
    render();
  };

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const nova = {
      id: sessoes.length ? Math.max(...sessoes.map(x => x.id)) + 1 : 1,
      turma: document.getElementById("sessTurma").value,
      data: document.getElementById("sessData").value,
      hora: document.getElementById("sessHora").value,
      estado: "AGENDADA"
    };
    sessoes.push(nova);
    localStorage.setItem("sessoes", JSON.stringify(sessoes));
    bootstrap.Modal.getInstance(document.getElementById("modalSessao")).hide();
    form.reset();
    render();
  });

  render();
}
