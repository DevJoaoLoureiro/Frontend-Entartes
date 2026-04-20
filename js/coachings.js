function initCoachings() {
  const tbl = document.getElementById("tblCoachings");
  const msg = document.getElementById("msgCoachings");

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const perfil = user?.perfil || "";

  const modalEducandosEl = document.getElementById("modalEducandos");
  const listaEducandosModal = document.getElementById("listaEducandosModal");
  const formInscreverEducandos = document.getElementById("formInscreverEducandos");
  const msgModalEducandos = document.getElementById("msgModalEducandos");

  let lista = [];
  let sessaoSelecionadaId = null;
  let educandos = [];

  function showMsg(text, type = "info") {
    msg.className = `alert alert-${type}`;
    msg.textContent = text;
    msg.classList.remove("d-none");
    setTimeout(() => msg.classList.add("d-none"), 3000);
  }

  function showMsgModal(text, type = "info") {
    msgModalEducandos.className = `alert alert-${type}`;
    msgModalEducandos.textContent = text;
    msgModalEducandos.classList.remove("d-none");
  }

  function hideMsgModal() {
    msgModalEducandos.classList.add("d-none");
    msgModalEducandos.textContent = "";
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
      .replaceAll(">", "&gt;");
  }

  function render() {
    if (!lista.length) {
      tbl.innerHTML = `<tr><td colspan="6" class="text-center">Sem coachings disponíveis.</td></tr>`;
      return;
    }

    tbl.innerHTML = lista.map(s => `
      <tr>
        <td>${s.id}</td>
        <td>${formatDT(s.inicio)}</td>
        <td>${formatDT(s.fim)}</td>
        <td>${escapeHtml(s.estado)}</td>
        <td>${escapeHtml(s.sumario || "-")}</td>
        <td>
          ${perfil === "ALUNO" ? `
            <button class="btn btn-sm btn-primary" onclick="inscreverMe(${s.id})">
              Inscrever-me
            </button>
          ` : ""}

          ${perfil === "ENCARREGADO" ? `
            <button class="btn btn-sm btn-outline-primary" onclick="abrirModalEducandos(${s.id})">
              Inscrever educando
            </button>
          ` : ""}
        </td>
      </tr>
    `).join("");
  }

  async function carregar() {
    try {
      lista = await apiGet("sessoes/abertas");
      render();
    } catch (err) {
      console.error(err);
      showMsg(err.message || "Erro ao carregar coachings.", "danger");
    }
  }

  async function carregarEducandos() {
    educandos = await apiGet("alunos/meus-educandos");

    if (!educandos.length) {
      listaEducandosModal.innerHTML = `<div class="text-muted">Não tens educandos associados.</div>`;
      return;
    }

    listaEducandosModal.innerHTML = educandos.map(e => `
      <div class="form-check mb-2">
        <input class="form-check-input chk-educando" type="checkbox" value="${e.id}" id="edu_${e.id}">
        <label class="form-check-label" for="edu_${e.id}">
          ${escapeHtml(e.nome)}
        </label>
      </div>
    `).join("");
  }

  window.inscreverMe = async function(id) {
    try {
      await apiPost(`sessoes/${id}/inscrever-me`, {});
      showMsg("Inscrição efetuada com sucesso.", "success");
    } catch (err) {
      console.error(err);
      showMsg(err.message || "Erro ao inscrever.", "danger");
    }
  };

  window.abrirModalEducandos = async function(id) {
    sessaoSelecionadaId = id;
    hideMsgModal();

    try {
      await carregarEducandos();
      const modal = new bootstrap.Modal(modalEducandosEl);
      modal.show();
    } catch (err) {
      console.error(err);
      showMsg(err.message || "Erro ao carregar educandos.", "danger");
    }
  };

  formInscreverEducandos?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMsgModal();

    const selecionados = [...document.querySelectorAll(".chk-educando:checked")]
      .map(x => parseInt(x.value, 10));

    if (!selecionados.length) {
      showMsgModal("Seleciona pelo menos um educando.", "warning");
      return;
    }

    try {
      await apiPost(`sessoes/${sessaoSelecionadaId}/inscrever-educandos`, {
        alunoIds: selecionados
      });

      bootstrap.Modal.getInstance(modalEducandosEl)?.hide();
      showMsg("Educandos inscritos com sucesso.", "success");
    } catch (err) {
      console.error(err);
      showMsgModal(err.message || "Erro ao inscrever educandos.", "danger");
    }
  });

  carregar();
}