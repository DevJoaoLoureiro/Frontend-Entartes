function initTurmas() {

  let turmas = JSON.parse(localStorage.getItem("turmas") || "[]");

  if (!turmas.length) {
    turmas = [
      { id: 1, nome: "Ballet Iniciados", professor: "Ana Costa", capacidade: 15 },
      { id: 2, nome: "Hip Hop Teens", professor: "Rui Mendes", capacidade: 20 }
    ];
    localStorage.setItem("turmas", JSON.stringify(turmas));
  }

  const tbl = document.getElementById("tblTurmas");
  const form = document.getElementById("formTurma");
  const pesquisa = document.getElementById("pesquisaTurma");

  function render() {
    const q = pesquisa?.value?.toLowerCase() || "";

    const filtradas = turmas.filter(t =>
      t.nome.toLowerCase().includes(q)
    );

    tbl.innerHTML = filtradas.map(t => `
      <tr>
        <td>${t.id}</td>
        <td>${t.nome}</td>
        <td>${t.professor || "-"}</td>
        <td>${t.capacidade || "-"}</td>
        <td>
          <button class="btn btn-sm btn-outline-danger" onclick="removerTurma(${t.id})">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join("");
  }

  window.removerTurma = (id) => {
    if (!confirm("Remover turma?")) return;
    turmas = turmas.filter(t => t.id !== id);
    localStorage.setItem("turmas", JSON.stringify(turmas));
    render();
  };

  form?.addEventListener("submit", (e) => {
    e.preventDefault();

    const nova = {
      id: turmas.length ? Math.max(...turmas.map(x => x.id)) + 1 : 1,
      nome: document.getElementById("turmaNome").value,
      professor: document.getElementById("turmaProfessor").value,
      capacidade: Number(document.getElementById("turmaCapacidade").value)
    };

    turmas.push(nova);
    localStorage.setItem("turmas", JSON.stringify(turmas));

    bootstrap.Modal.getInstance(document.getElementById("modalTurma")).hide();
    form.reset();
    render();
  });

  pesquisa?.addEventListener("input", render);

  render();
}
