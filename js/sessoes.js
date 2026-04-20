function initSessoes() {
  const tbl = document.getElementById("tblSessoes");
  const msg = document.getElementById("msgSessoes");

  const formSessao = document.getElementById("formSessao");
  const modalSessaoEl = document.getElementById("modalSessao");

  const selectTurma = document.getElementById("turma");
  const selectEstudio = document.getElementById("estudio");
  const inputTipoAulaInfo = document.getElementById("tipoAulaInfo");
  const chkInscricaoAberta = document.getElementById("inscricaoAberta");

  const tabPorDar = document.getElementById("tabPorDar");
  const tabTerminadas = document.getElementById("tabTerminadas");

  const msgCriarSessao = document.getElementById("msgCriarSessao");

  if (
    !tbl || !msg || !formSessao || !modalSessaoEl ||
    !selectTurma || !selectEstudio || !inputTipoAulaInfo ||
    !chkInscricaoAberta || !tabPorDar || !tabTerminadas || !msgCriarSessao
  ) {
    console.error("Elementos da página de sessões não encontrados.");
    return;
  }

  let sessoes = [];
  let turmas = [];
  let estudios = [];
  let abaAtual = "POR_DAR";

  function showMsg(text, type = "info") {
    msg.className = `alert alert-${type}`;
    msg.textContent = text;
    msg.classList.remove("d-none");
    setTimeout(() => msg.classList.add("d-none"), 3000);
  }

  function showMsgCriar(text, type = "info") {
    msgCriarSessao.className = `alert alert-${type}`;
    msgCriarSessao.textContent = text;
    msgCriarSessao.classList.remove("d-none");
  }

  function hideMsgCriar() {
    msgCriarSessao.classList.add("d-none");
    msgCriarSessao.textContent = "";
  }

  function formatDT(dt) {
    if (!dt) return "-";
    return new Date(dt).toLocaleString("pt-PT", {
      dateStyle: "short",
      timeStyle: "short"
    });
  }

  function escapeHtml(v) {
    return String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function badgeEstado(estado) {
    if (estado === "AGENDADA") return `<span class="badge text-bg-primary">Agendada</span>`;
    if (estado === "TERMINADA") return `<span class="badge text-bg-success">Terminada</span>`;
    if (estado === "CANCELADA") return `<span class="badge text-bg-danger">Cancelada</span>`;
    return `<span class="badge text-bg-secondary">${escapeHtml(estado || "-")}</span>`;
  }

  async function carregarDropdowns() {
    try {
      turmas = await apiGet("turmas");
      estudios = await apiGet("config/estudio");

      selectTurma.innerHTML = `
        <option value="">Selecionar turma</option>
        ${turmas.map(t => `
          <option value="${t.id}">${escapeHtml(t.nome)}</option>
        `).join("")}
      `;

      selectEstudio.innerHTML = `
        <option value="">Selecionar estúdio</option>
        ${estudios.map(e => `
          <option value="${e.id}">${escapeHtml(e.nome)}</option>
        `).join("")}
      `;
    } catch (err) {
      console.error(err);
      showMsg(err.message || "Erro ao carregar turmas e estúdios.", "danger");
    }
  }

  function atualizarInfoTurma() {
    const turmaId = selectTurma.value ? parseInt(selectTurma.value, 10) : null;
    const turma = turmas.find(t => t.id === turmaId);

    if (!turma) {
      inputTipoAulaInfo.value = "";
      return;
    }

    inputTipoAulaInfo.value = turma.tipoAulaNome || "";
  }

  function atualizarModoSessao() {
    const isCoaching = chkInscricaoAberta.checked;

    if (isCoaching) {
      selectTurma.value = "";
      selectTurma.disabled = true;
      inputTipoAulaInfo.value = "Coaching / Sessão aberta";
    } else {
      selectTurma.disabled = false;
      atualizarInfoTurma();
    }
  }

  function render() {
    // esta página mostra só sessões normais
    const lista = sessoes
      .filter(s => !s.inscricaoAberta)
      .filter(s => {
        if (abaAtual === "POR_DAR") return !s.foiDada;
        return s.foiDada;
      });

    if (!lista.length) {
      tbl.innerHTML = `<tr><td colspan="8" class="text-center">Sem sessões.</td></tr>`;
      return;
    }

    tbl.innerHTML = lista.map(s => `
      <tr>
        <td>${s.id}</td>
        <td>${formatDT(s.inicio)}</td>
        <td>${formatDT(s.fim)}</td>
        <td>${escapeHtml(s.turmaNome || "-")}</td>
        <td>${escapeHtml(s.tipoAulaNome || "-")}</td>
        <td>${badgeEstado(s.estado)}</td>
        <td>${escapeHtml(s.sumario || "-")}</td>
        <td class="text-nowrap">
          <a href="presencas.html?sessaoId=${s.id}" class="btn btn-sm btn-primary me-2">
            Presenças
          </a>
          ${!s.foiDada ? `
            <button class="btn btn-sm btn-success" onclick="terminarSessao(${s.id})">
              Aula terminada
            </button>
          ` : ""}
        </td>
      </tr>
    `).join("");
  }

  async function carregarSessoes() {
    try {
      sessoes = await apiGet("sessoes");
      render();
    } catch (err) {
      console.error(err);
      tbl.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Erro ao carregar sessões.</td></tr>`;
      showMsg(err.message || "Erro ao carregar sessões.", "danger");
    }
  }

  window.terminarSessao = async function(id) {
    try {
      await apiPatch(`sessoes/${id}/terminar`, {});
      showMsg("Aula marcada como terminada.", "success");
      await carregarSessoes();
    } catch (err) {
      console.error(err);
      showMsg(err.message || "Erro ao terminar aula.", "danger");
    }
  };

  tabPorDar.addEventListener("click", () => {
    abaAtual = "POR_DAR";
    tabPorDar.classList.add("active");
    tabTerminadas.classList.remove("active");
    render();
  });

  tabTerminadas.addEventListener("click", () => {
    abaAtual = "TERMINADAS";
    tabTerminadas.classList.add("active");
    tabPorDar.classList.remove("active");
    render();
  });

  selectTurma.addEventListener("change", atualizarInfoTurma);
  chkInscricaoAberta.addEventListener("change", atualizarModoSessao);

  formSessao.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMsgCriar();

    try {
      const inicioVal = document.getElementById("inicio").value;
      const fimVal = document.getElementById("fim").value;
      const isCoaching = chkInscricaoAberta.checked;

      if (!inicioVal || !fimVal) {
        showMsgCriar("Início e fim são obrigatórios.", "warning");
        return;
      }

      if (!isCoaching && !selectTurma.value) {
        showMsgCriar("Seleciona uma turma para sessão normal.", "warning");
        return;
      }

      const dto = {
        dataInicio: new Date(inicioVal).toISOString(),
        dataFim: new Date(fimVal).toISOString(),
        turmaId: isCoaching ? null : (selectTurma.value ? parseInt(selectTurma.value, 10) : null),
        estudioId: selectEstudio.value ? parseInt(selectEstudio.value, 10) : null,
        maxAlunos: document.getElementById("maxAlunos").value
          ? parseInt(document.getElementById("maxAlunos").value, 10)
          : null,
        sumario: document.getElementById("sumario").value.trim() || null,
        inscricaoAberta: isCoaching
      };

      await apiPost("sessoes", dto);

      bootstrap.Modal.getInstance(modalSessaoEl)?.hide();
      formSessao.reset();
      selectTurma.disabled = false;
      inputTipoAulaInfo.value = "";

      await carregarSessoes();

      if (isCoaching) {
        showMsg("Coaching criado com sucesso. Vai aparecer em Coachings.", "success");
      } else {
        showMsg("Sessão criada com sucesso.", "success");
      }
    } catch (err) {
      console.error(err);
      showMsgCriar(err.message || "Erro ao criar sessão.", "danger");
    }
  });

  modalSessaoEl.addEventListener("show.bs.modal", () => {
    hideMsgCriar();
  });

  carregarDropdowns().then(() => {
    atualizarInfoTurma();
    atualizarModoSessao();
  });

  carregarSessoes();
}