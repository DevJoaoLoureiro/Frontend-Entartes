function initSessoes() {
  const tbl = document.getElementById("tblSessoes");
  if (!tbl) return;

  function formatDT(dt) {
    if (!dt) return "";
    return new Date(dt).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" });
  }

  // tenta obter o alunoId para confirmar
  // (ajusta conforme guardas isto no teu login/UX)
  function getAlunoIdParaConfirmar() {
    // 1) se tens aluno selecionado (responsável)
    const sel = localStorage.getItem("alunoSelecionadoId");
    if (sel) return parseInt(sel, 10);

    // 2) se guardas user no localStorage com alunoId
    const u = JSON.parse(localStorage.getItem("user") || "null");
    if (u?.alunoId) return parseInt(u.alunoId, 10);

    return null;
  }


  // Dentro do initSessoes(), depois de injectares o template:

const form = document.getElementById("formSessao");
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const titulo = document.getElementById("sessTitulo").value.trim();
      const tipoAula = document.getElementById("sessTipo").value;
      const inicioRaw = document.getElementById("sessInicio").value;
      const fimRaw = document.getElementById("sessFim").value;
      const descricao = document.getElementById("sessDescricao").value.trim();

      if (!titulo) return alert("Título é obrigatório.");
      if (!inicioRaw || !fimRaw) return alert("Início e Fim são obrigatórios.");

      // datetime-local -> ISO string
      const inicio = new Date(inicioRaw).toISOString();
      const fim = new Date(fimRaw).toISOString();

      if (new Date(fim) <= new Date(inicio)) {
        return alert("Fim tem de ser depois do Início.");
      }

      // DTO para o backend
      // ATENÇÃO: usa os nomes que o teu CreateSessaoDto espera.
      // Se o teu DTO for CreateSessaoDto { Titulo, Descricao, DataInicio, DataFim }
      // então troca Inicio/Fim por DataInicio/DataFim.
      const dto = {
        titulo,
        descricao: descricao || null,
        tipoAula,
        inicio,
        fim
      };

      await apiPost("sessoes", dto);

      // fechar modal
      const modalEl = document.getElementById("modalSessao");
      const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
      modal.hide();

      // limpar form
      form.reset();

      // recarregar lista
      await carregarSessoes(); // garante que a função existe no teu ficheiro

      alert("Sessão criada com sucesso!");
    } catch (err) {
      alert(`Erro ao guardar: ${err.message}`);
    }
  });
}

  async function carregar() {
    tbl.innerHTML = `<tr><td colspan="10">A carregar...</td></tr>`;

    try {
      const sessoes = await apiGet("sessoes"); // GET /api/sessoes

      if (!Array.isArray(sessoes) || sessoes.length === 0) {
        tbl.innerHTML = `<tr><td colspan="10">Sem sessões.</td></tr>`;
        return;
      }

      tbl.innerHTML = sessoes.map(s => {
        const titulo = s.titulo ?? "(Sem título)";
        const tipo = s.tipoAula ?? "";
        const inicio = s.inicio ?? s.dataInicio; // caso backend devolva nomes diferentes
        const fim = s.fim ?? s.dataFim;
        const estado = s.estado ?? "";

        return `
          <tr>
            <td>${s.id}</td>
            <td>${titulo}</td>
            <td>${tipo}</td>
            <td>${formatDT(inicio)}</td>
            <td>${formatDT(fim)}</td>
            <td>${estado}</td>
            <td>
              <button class="btn btn-sm btn-outline-success" onclick="confirmarPresenca(${s.id}, true)">Vou</button>
              <button class="btn btn-sm btn-outline-danger" onclick="confirmarPresenca(${s.id}, false)">Não vou</button>
              <a class="btn btn-sm btn-outline-primary" href="presencas.html?sessaoId=${s.id}">Presenças</a>
            </td>
          </tr>
        `;
      }).join("");
    } catch (e) {
      tbl.innerHTML = `<tr><td colspan="10">Erro: ${e.message}</td></tr>`;
    }
  }

  window.confirmarPresenca = async function (sessaoId, vai) {
    try {
      const alunoId = getAlunoIdParaConfirmar();
      if (!alunoId) {
        alert("Não foi possível identificar o aluno (alunoSelecionadoId/user.alunoId).");
        return;
      }

      // POST /api/sessoes/{id}/confirmar
      await apiPost(`sessoes/${sessaoId}/confirmar`, { alunoId, vai });

      alert("Confirmação registada!");
    } catch (e) {
      alert(`Erro ao confirmar: ${e.message}`);
    }
  };

  carregar();
}