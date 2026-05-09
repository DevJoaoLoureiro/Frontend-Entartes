function initInventario() {
  const user = getUser();
  const role = user?.perfil;

  const box = document.getElementById("listaInventario");
  const pesquisa = document.getElementById("pesquisaItem");
  const filtroCat = document.getElementById("filtroCategoria");
  const msg = document.getElementById("msgInventario");

  const formItem = document.getElementById("formItem");
  const formAluguer = document.getElementById("formAluguer");

  let itens = [];
  let educandos = [];

  function showMsg(text, type = "info") {
    if (!msg) return;
    msg.className = `alert alert-${type}`;
    msg.textContent = text;
    msg.classList.remove("d-none");
    setTimeout(() => msg.classList.add("d-none"), 3000);
  }

  function podeAdmin() {
    return role === "ADMIN" || role === "SUPER_ADMIN";
  }

  function canRent() {
    return role === "ENCARREGADO" || role === "ALUNO";
  }

  function escapeHtml(v) {
    return String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getImageUrl(item) {
    if (!item.imagemUrl) return null;

    if (item.imagemUrl.startsWith("http")) {
      return item.imagemUrl;
    }

    return `${API_BASE_URL.replace("/api", "")}${item.imagemUrl}`;
  }

  function filterList() {
    const q = (pesquisa?.value || "").trim().toLowerCase();
    const cat = (filtroCat?.value || "").trim();

    return itens
      .filter(i => i.ativo !== false)
      .filter(i => !cat || i.categoria === cat)
      .filter(i => !q || `${i.nome} ${i.categoria || ""}`.toLowerCase().includes(q));
  }

  function card(i) {
    const disponivel = i.quantidadeDisponivel > 0;
    const imgUrl = getImageUrl(i);

    const img = imgUrl
      ? `<img src="${escapeHtml(imgUrl)}" class="img-fluid rounded mb-3" style="height:180px;width:100%;object-fit:cover;">`
      : `<div class="bg-light rounded mb-3 d-flex align-items-center justify-content-center" style="height:180px;">
           <i class="fa-solid fa-image text-muted fa-2x"></i>
         </div>`;

    const badge = disponivel
      ? `<span class="badge text-bg-success">Disponível</span>`
      : `<span class="badge text-bg-danger">Indisponível</span>`;

    const btnRent = canRent()
      ? `<button class="btn btn-sm btn-outline-primary ${disponivel ? "" : "disabled"}" onclick="abrirAluguer(${i.id})">
           <i class="fa-solid fa-hand-holding-heart me-1"></i> Alugar
         </button>`
      : ``;

    return `
      <div class="col-md-6 col-lg-4">
        <div class="card card-soft p-3 h-100">
          ${img}

          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h6 class="mb-1">${escapeHtml(i.nome)}</h6>
              <div class="small-muted">
                ${escapeHtml(i.categoria || "-")}${i.tamanho ? " • " + escapeHtml(i.tamanho) : ""}
              </div>
            </div>
            ${badge}
          </div>

          <hr class="my-2">

          <div class="small"><b>Total:</b> ${i.quantidadeTotal}</div>
          <div class="small"><b>Disponível:</b> ${i.quantidadeDisponivel}</div>
          <div class="small"><b>Preço aluguer:</b> €${Number(i.precoAluguer || 0).toFixed(2)}</div>
          <div class="small"><b>Localização:</b> ${escapeHtml(i.localizacao || "-")}</div>

          <div class="mt-3">
            ${btnRent}
          </div>
        </div>
      </div>
    `;
  }

  function render() {
    if (!box) return;
    const lista = filterList();
    box.innerHTML = lista.map(card).join("") || `<div class="small-muted">Sem itens.</div>`;
  }

  async function carregarItens() {
    try {
      itens = await apiGet("inventario");
      render();
    } catch (err) {
      console.error(err);
      showMsg(err.message || "Erro ao carregar inventário.", "danger");
    }
  }

  async function carregarEducandos() {
    if (role !== "ENCARREGADO") return;

    try {
      educandos = await apiGet("alunos/meus-educandos");

      const select = document.getElementById("aluguerAlunoId");
      if (!select) return;

      select.innerHTML = `
        <option value="">Selecionar educando</option>
        ${educandos.map(e => `
          <option value="${e.id}">${escapeHtml(e.nome)}</option>
        `).join("")}
      `;
    } catch (err) {
      console.error(err);
      showMsg(err.message || "Erro ao carregar educandos.", "danger");
    }
  }

  window.abrirAluguer = async function(id) {
    const i = itens.find(x => x.id === id);
    if (!i) return;

    document.getElementById("aluguerItemId").value = i.id;
    document.getElementById("aluguerItemNome").value = i.nome;
    document.getElementById("aluguerTamanho").value = i.tamanho || "-";

    const hoje = new Date().toISOString().substring(0, 10);
    document.getElementById("aluguerInicio").value = hoje;
    document.getElementById("aluguerFim").value = hoje;

    await carregarEducandos();

    const modal = new bootstrap.Modal(document.getElementById("modalAluguer"));
    modal.show();
  };

  if (pesquisa) pesquisa.addEventListener("input", render);
  if (filtroCat) filtroCat.addEventListener("change", render);

  if (formItem) {
    formItem.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!podeAdmin()) return;

      try {
        const qtdTotal = Number(document.getElementById("invQtdTotal").value || 0);
        const qtdDisp = Number(document.getElementById("invQtdDisp").value || 0);

        if (qtdDisp > qtdTotal) {
          showMsg("Quantidade disponível não pode ser maior que a total.", "warning");
          return;
        }

        const fd = new FormData();

        fd.append("nome", document.getElementById("invNome").value.trim());
        fd.append("categoria", document.getElementById("invCategoria").value);
        fd.append("tamanho", document.getElementById("invTamanho").value.trim() || "");
        fd.append("quantidadeTotal", qtdTotal);
        fd.append("quantidadeDisponivel", qtdDisp);
        fd.append("precoAluguer", Number(document.getElementById("invPreco").value || 0));
        fd.append("localizacao", document.getElementById("invLocalizacao").value.trim() || "");

        const img = document.getElementById("invImagem")?.files?.[0];
        if (img) fd.append("imagem", img);

        const token = localStorage.getItem("token");

        const res = await fetch(`${API_BASE_URL}/inventario`, {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: fd
        });

        const text = await res.text();

        if (!res.ok) {
          throw new Error(text || "Erro ao criar item.");
        }

        bootstrap.Modal.getInstance(document.getElementById("modalItem"))?.hide();
        formItem.reset();

        showMsg("Item criado com sucesso.", "success");
        await carregarItens();
      } catch (err) {
        console.error(err);
        showMsg(err.message || "Erro ao criar item.", "danger");
      }
    });
  }

  if (formAluguer) {
    formAluguer.addEventListener("submit", async (e) => {
      e.preventDefault();

      try {
        const itemId = Number(document.getElementById("aluguerItemId").value);

        let alunoId = null;

       if (role === "ENCARREGADO") {
          alunoId = Number(document.getElementById("aluguerAlunoId").value);

          if (!alunoId) {
            showMsg("Seleciona um educando.", "warning");
            return;
          }
        }

        if (role === "ALUNO") {
          const aluno = await apiGet("alunos/me"); // tens de ter este endpoint

          if (!aluno || !aluno.id) {
            showMsg("Aluno não encontrado.", "danger");
            return;
          }

          alunoId = aluno.id;
        }

        await apiPost(`inventario/${itemId}/alugar`, alunoId);

        bootstrap.Modal.getInstance(document.getElementById("modalAluguer"))?.hide();
        formAluguer.reset();

        showMsg("Aluguer registado com sucesso.", "success");
        await carregarItens();
      } catch (err) {
        console.error(err);
        showMsg(err.message || "Erro ao alugar item.", "danger");
      }
    });
  }

  carregarItens();
}