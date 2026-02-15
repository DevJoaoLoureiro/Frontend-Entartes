function initAlunos() {
  const tabela = document.getElementById("tabelaAlunos");
  const pesquisa = document.getElementById("pesquisaAluno");
  const form = document.getElementById("formAluno");

  let alunos = [];

  function isAdult(dateStr) {
    const birth = new Date(dateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 18;
  }

  function normalizarData(dataNascimento) {
    // backend pode enviar "2026-02-14T00:00:00" ou "2026-02-14"
    if (!dataNascimento) return "";
    return String(dataNascimento).substring(0, 10);
  }

  function filterList() {
    const q = (pesquisa?.value || "").trim().toLowerCase();
    if (!q) return alunos;
    return alunos.filter(a => (a.nome || "").toLowerCase().includes(q));
  }

  function render(list) {
    tabela.innerHTML = "";

    list.forEach(a => {
      const nasc = normalizarData(a.dataNascimento ?? a.nascimento);
      const adulto = nasc ? isAdult(nasc) : false;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${a.id}</td>
        <td>${a.nome ?? ""}</td>
        <td>${nasc || "-"}</td>
        <td>${nasc ? (adulto ? "Sim" : "Não") : "-"}</td>
        <td class="text-nowrap">
          <button class="btn btn-sm btn-outline-primary" onclick="editarAluno(${a.id})">
            <i class="fa-solid fa-pen"></i> Editar
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="removerAluno(${a.id})">
            <i class="fa-solid fa-trash"></i> Remover
          </button>
        </td>
      `;
      tabela.appendChild(tr);
    });
  }

  async function carregar() {
    try {
      alunos = await apiGet("alunos");
      render(filterList());
    } catch (e) {
      console.error(e);
      alert("Erro a carregar alunos. Confirma se estás logado e se a API está a correr.");
    }
  }

  // Remover no backend
  window.removerAluno = async (id) => {
    if (!confirm("Tens a certeza que queres remover este aluno?")) return;

    try {
      // apiDelete: se não tiveres, faz fetch aqui
      await fetch(`${API_BASE_URL}/alunos/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${getToken()}` }
      });

      // Recarrega lista
      await carregar();
    } catch (e) {
      console.error(e);
      alert("Erro ao remover aluno.");
    }
  };

  // Editar (fica placeholder para fazermos depois)
  window.editarAluno = (id) => {
    alert("Editar ainda não implementado (vamos fazer a seguir). ID=" + id);
  };

  if (pesquisa) {
    pesquisa.addEventListener("input", () => render(filterList()));
  }

  // Criar no backend
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const payload = {
        nome: document.getElementById("alunoNome").value.trim(),
        dataNascimento: document.getElementById("alunoNascimento").value, // "YYYY-MM-DD"
        telefone: document.getElementById("alunoTelefone").value.trim() || null,
        email: document.getElementById("alunoEmail").value.trim() || null,
        ativo: true
      };

      try {
        await apiPost("alunos", payload);

        const modalEl = document.getElementById("modalAluno");
        if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();

        form.reset();
        await carregar();
      } catch (e) {
        console.error(e);
        alert("Erro ao criar aluno. Confirma permissões (ADMIN) e validações.");
      }
    });
  }

  carregar();
};
