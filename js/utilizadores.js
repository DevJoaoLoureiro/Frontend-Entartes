function initUtilizadores() {
  const tbl = document.getElementById("tblUtilizadores");

  const pesquisa = document.getElementById("pesquisaUser");
  const filtroPerfil = document.getElementById("filtroPerfil");
  const filtroAtivo = document.getElementById("filtroAtivo");

  const msg = document.getElementById("msgUtilizadores");

  const form = document.getElementById("formConviteUtilizador");
  const msgCriar = document.getElementById("msgCriarUser");
  const modalEl = document.getElementById("modalCriarUser");

  if (!tbl || !pesquisa || !filtroPerfil || !filtroAtivo || !msg || !form || !msgCriar || !modalEl) {
    console.error("Elementos da página Utilizadores não encontrados (template não injetado?)");
    return;
  }

  let utilizadores = [];

  function showMsg(text, type = "info") {
    msg.className = `alert alert-${type}`;
    msg.textContent = text;
    msg.classList.remove("d-none");
    setTimeout(() => msg.classList.add("d-none"), 2500);
  }

  function showMsgCriar(text, type = "info") {
    msgCriar.className = `alert alert-${type}`;
    msgCriar.textContent = text;
    msgCriar.classList.remove("d-none");
  }

  function hideMsgCriar() {
    msgCriar.classList.add("d-none");
    msgCriar.textContent = "";
  }

  function normalizarBool(v) {
    if (typeof v === "boolean") return v;
    if (v === 1 || v === "1") return true;
    if (v === 0 || v === "0") return false;
    if (typeof v === "string") return v.toLowerCase() === "true";
    return !!v;
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function filtrarLista() {
    const q = (pesquisa.value || "").trim().toLowerCase();
    const perfil = (filtroPerfil.value || "").trim();
    const ativoStr = (filtroAtivo.value || "").trim();

    return utilizadores
      .filter(u => {
        if (!q) return true;
        const bag = `${u.nome ?? ""} ${u.username ?? ""} ${u.email ?? ""}`.toLowerCase();
        return bag.includes(q);
      })
      .filter(u => !perfil || (u.perfil || u.role || "").toUpperCase() === perfil)
      .filter(u => {
        if (!ativoStr) return true;
        const a = normalizarBool(u.ativo);
        return ativoStr === "true" ? a : !a;
      });
  }

  function badgeAtivo(v) {
    const ativo = normalizarBool(v);
    return ativo
      ? `<span class="badge text-bg-success">Ativo</span>`
      : `<span class="badge text-bg-secondary">Inativo</span>`;
  }

  function render() {
    const list = filtrarLista();

    tbl.innerHTML = list.map(u => {
      const id = u.id ?? u.utilizadorId ?? u.utilizador_id;
      const nome = escapeHtml(u.nome);
      const username = escapeHtml(u.username);
      const email = escapeHtml(u.email || "-");
      const perfil = escapeHtml((u.perfil || u.role || "").toUpperCase() || "-");
      const ativo = badgeAtivo(u.ativo);

      return `
        <tr>
          <td>${id}</td>
          <td>${nome}</td>
          <td>${username}</td>
          <td>${email}</td>
          <td>${perfil}</td>
          <td>${ativo}</td>
          <td class="text-nowrap">
            <button class="btn btn-sm btn-outline-secondary me-2" onclick="toggleAtivo(${id})">
              <i class="fa-solid fa-power-off me-1"></i> Ativar/Desativar
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="removerUser(${id})">
              <i class="fa-solid fa-trash me-1"></i> Remover
            </button>
          </td>
        </tr>
      `;
    }).join("");

    if (!list.length) {
      tbl.innerHTML = `<tr><td colspan="7" class="text-center small-muted">Sem utilizadores.</td></tr>`;
    }
  }

  async function carregar() {
    try {
      utilizadores = await apiGet("utilizadores");
      render();
    } catch (e) {
      console.error(e);
      showMsg("Erro a carregar utilizadores. Confirma se o endpoint GET /api/utilizadores existe e se estás autenticado.", "danger");
      utilizadores = [];
      render();
    }
  }

  window.removerUser = async (id) => {
    if (!confirm("Remover utilizador?")) return;

    try {
      if (typeof apiDelete === "function") {
        await apiDelete(`utilizadores/${id}`);
      } else {
        const token = (typeof getToken === "function") ? getToken() : localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/utilizadores/${id}`, {
          method: "DELETE",
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error("DELETE falhou");
      }

      showMsg("Utilizador removido.", "success");
      await carregar();
    } catch (e) {
      console.error(e);
      showMsg("Não consegui remover. Confirma se tens DELETE /api/utilizadores/{id}.", "danger");
    }
  };

  window.toggleAtivo = async (id) => {
    try {
      const token = (typeof getToken === "function") ? getToken() : localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/utilizadores/${id}/toggle`, {
        method: "PATCH",
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error("PATCH falhou");

      showMsg("Estado atualizado.", "success");
      await carregar();
    } catch (e) {
      console.error(e);
      showMsg("Não consegui ativar/desativar. Se não tens o endpoint, cria: PATCH /api/utilizadores/{id}/toggle.", "warning");
    }
  };

  pesquisa.addEventListener("input", render);
  filtroPerfil.addEventListener("change", render);
  filtroAtivo.addEventListener("change", render);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMsgCriar();

    const payload = {
      email: document.getElementById("conviteEmail").value.trim(),
      perfil: document.getElementById("convitePerfil").value
    };

    try {
      await apiPost("utilizadores/convite", payload);
      showMsgCriar("Convite enviado com sucesso!", "success");

      form.reset();
      bootstrap.Modal.getInstance(modalEl)?.hide();

      await carregar();
    } catch (err) {
      console.error(err);
      showMsgCriar(err.message || "Erro ao enviar convite", "danger");
    }
  });

  modalEl.addEventListener("show.bs.modal", () => {
    hideMsgCriar();
  });

  carregar();
}