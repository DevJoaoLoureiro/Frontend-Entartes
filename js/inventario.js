function initInventario() {
  const user = getUser();
  const role = user?.perfil;

  // MOCK
  let itens = [
    { id: 1, nome: "Traje Ballet Rosa", categoria: "Trajes", tamanho: "S", qtdTotal: 3, qtdDisp: 2, preco: 12.5, ativo: true },
    { id: 2, nome: "Sapatos Flamenco", categoria: "Sapatos", tamanho: "36", qtdTotal: 2, qtdDisp: 1, preco: 8.0, ativo: true },
    { id: 3, nome: "Tiara brilhante", categoria: "Acessórios", tamanho: "", qtdTotal: 5, qtdDisp: 5, preco: 3.5, ativo: true },
  ];

  const box = document.getElementById("listaInventario");
  const pesquisa = document.getElementById("pesquisaItem");
  const filtroCat = document.getElementById("filtroCategoria");
  const msg = document.getElementById("msgInventario");

  const formItem = document.getElementById("formItem");
  const formAluguer = document.getElementById("formAluguer");

  function showMsg(text, type) {
    if (!msg) return;
    msg.className = `alert alert-${type}`;
    msg.textContent = text;
    msg.classList.remove("d-none");
    setTimeout(() => msg.classList.add("d-none"), 2500);
  }

  function podeAdmin() {
    return role === "ADMIN" || role === "SUPER_ADMIN";
  }

  function canRent() {
    return role === "ENCARREGADO" || podeAdmin();
  }

  function filterList() {
    const q = (pesquisa?.value || "").trim().toLowerCase();
    const cat = (filtroCat?.value || "").trim();

    return itens
      .filter(i => i.ativo !== false)
      .filter(i => !cat || i.categoria === cat)
      .filter(i => !q || (i.nome + " " + (i.categoria || "")).toLowerCase().includes(q));
  }

  function card(i) {
    const disponivel = i.qtdDisp > 0;
    const badge = disponivel
      ? `<span class="badge text-bg-success">Disponível</span>`
      : `<span class="badge text-bg-danger">Indisponível</span>`;

    const btnAdmin = podeAdmin()
      ? `<button class="btn btn-sm btn-outline-danger ms-2" onclick="removerItem(${i.id})">
           <i class="fa-solid fa-trash"></i>
         </button>`
      : ``;

    const btnRent = canRent()
      ? `<button class="btn btn-sm btn-outline-primary ${disponivel ? "" : "disabled"}" onclick="abrirAluguer(${i.id})">
           <i class="fa-solid fa-hand-holding-heart me-1"></i> Alugar
         </button>`
      : ``;

    return `
      <div class="col-md-6 col-lg-4">
        <div class="card card-soft p-3 h-100">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h6 class="mb-1">${i.nome}</h6>
              <div class="small-muted">${i.categoria}${i.tamanho ? " • " + i.tamanho : ""}</div>
            </div>
            <div class="d-flex align-items-center">
              ${badge}
              ${btnAdmin}
            </div>
          </div>

          <hr class="my-2">

          <div class="small"><b>Total:</b> ${i.qtdTotal}</div>
          <div class="small"><b>Disponível:</b> ${i.qtdDisp}</div>
          <div class="small"><b>Preço:</b> €${Number(i.preco).toFixed(2)}</div>

          <div class="mt-3">
            ${btnRent}
          </div>
        </div>
      </div>
    `;
  }

  function render(list) {
    if (!box) return;
    box.innerHTML = list.map(card).join("") || `<div class="small-muted">Sem itens.</div>`;
  }

  // Admin: remover (mock)
  window.removerItem = (id) => {
    if (!podeAdmin()) return;
    if (!confirm("Remover este item do inventário?")) return;
    itens = itens.filter(i => i.id !== id);
    render(filterList());
    showMsg("Item removido.", "success");
  };

  // Encarregado: abrir modal pedido
  window.abrirAluguer = (id) => {
    const i = itens.find(x => x.id === id);
    if (!i) return;

    document.getElementById("aluguerItemId").value = i.id;
    document.getElementById("aluguerItemNome").value = i.nome;
    document.getElementById("aluguerTamanho").value = i.tamanho || "-";

    // datas default
    const hoje = new Date();
    const d1 = hoje.toISOString().substring(0, 10);
    document.getElementById("aluguerInicio").value = d1;
    document.getElementById("aluguerFim").value = d1;

    const modal = new bootstrap.Modal(document.getElementById("modalAluguer"));
    modal.show();
  };

  if (pesquisa) pesquisa.addEventListener("input", () => render(filterList()));
  if (filtroCat) filtroCat.addEventListener("change", () => render(filterList()));

  // Admin: criar item (mock)
  if (formItem) {
    formItem.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!podeAdmin()) return;

      const novo = {
        id: itens.length ? Math.max(...itens.map(x => x.id)) + 1 : 1,
        nome: document.getElementById("invNome").value.trim(),
        categoria: document.getElementById("invCategoria").value,
        tamanho: document.getElementById("invTamanho").value.trim(),
        qtdTotal: Number(document.getElementById("invQtdTotal").value || 0),
        qtdDisp: Number(document.getElementById("invQtdDisp").value || 0),
        preco: Number(document.getElementById("invPreco").value || 0),
        ativo: true
      };

      itens.unshift(novo);

      bootstrap.Modal.getInstance(document.getElementById("modalItem"))?.hide();
      formItem.reset();
      render(filterList());
      showMsg("Item criado.", "success");
    });
  }

  // Encarregado: enviar pedido (mock)
  if (formAluguer) {
    formAluguer.addEventListener("submit", (e) => {
      e.preventDefault();

      const itemId = Number(document.getElementById("aluguerItemId").value);
      const inicio = document.getElementById("aluguerInicio").value;
      const fim = document.getElementById("aluguerFim").value;

      if (!inicio || !fim) {
        showMsg("Seleciona as datas.", "danger");
        return;
      }

      // aqui no futuro: POST /api/alugueres
      bootstrap.Modal.getInstance(document.getElementById("modalAluguer"))?.hide();
      formAluguer.reset();

      showMsg("Pedido de aluguer enviado (mock).", "success");
    });
  }

  render(filterList());
}
