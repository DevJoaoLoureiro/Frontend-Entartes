function initMarketplace() {
  const user = getUser();
  const role = user?.perfil;

  // MOCK
  let anuncios = [
    { id: 1, titulo: "Traje Contemporâneo Preto", tipo: "VENDA", preco: 35.0, tamanho: "M", estado: "USADO", desc: "Pouco usado, em bom estado.", autor: "ENCARREGADO", ativo: true },
    { id: 2, titulo: "Traje Ballet Branco", tipo: "ALUGUER", preco: 10.0, tamanho: "S", estado: "USADO", desc: "Aluguer por semana.", autor: "ENCARREGADO", ativo: true },
    { id: 3, titulo: "Sapatos Jazz 38", tipo: "VENDA", preco: 18.0, tamanho: "38", estado: "NOVO", desc: "Nunca usados.", autor: "ENCARREGADO", ativo: true },
  ];

  const box = document.getElementById("listaMarketplace");
  const pesquisa = document.getElementById("pesquisaAnuncio");
  const filtro = document.getElementById("filtroTipo");
  const msg = document.getElementById("msgMarketplace");

  const formAnuncio = document.getElementById("formAnuncio");
  const formContacto = document.getElementById("formContacto");

  function showMsg(text, type) {
    if (!msg) return;
    msg.className = `alert alert-${type}`;
    msg.textContent = text;
    msg.classList.remove("d-none");
    setTimeout(() => msg.classList.add("d-none"), 2500);
  }

  function isAdmin() {
    return role === "ADMIN" || role === "SUPER_ADMIN";
  }

  function filterList() {
    const q = (pesquisa?.value || "").trim().toLowerCase();
    const t = (filtro?.value || "").trim();

    return anuncios
      .filter(a => a.ativo !== false)
      .filter(a => !t || a.tipo === t)
      .filter(a => !q || (a.titulo || "").toLowerCase().includes(q));
  }

  function badgeTipo(tipo) {
    if (tipo === "VENDA") return `<span class="badge text-bg-primary">Venda</span>`;
    return `<span class="badge text-bg-warning">Aluguer</span>`;
  }

  function card(a) {
    const btnRemover = isAdmin()
      ? `<button class="btn btn-sm btn-outline-danger ms-2" onclick="removerAnuncio(${a.id})">
           <i class="fa-solid fa-trash"></i>
         </button>`
      : ``;

    const btnContactar = `
      <button class="btn btn-sm btn-outline-success" onclick="abrirContacto(${a.id})">
        <i class="fa-solid fa-comment-dots me-1"></i> Contactar
      </button>
    `;

    return `
      <div class="col-md-6 col-lg-4">
        <div class="card card-soft p-3 h-100">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h6 class="mb-1">${a.titulo}</h6>
              <div class="small-muted">${a.tamanho ? "Tamanho: " + a.tamanho : "Sem tamanho"} • Estado: ${a.estado}</div>
            </div>
            <div class="d-flex align-items-center">
              ${badgeTipo(a.tipo)}
              ${btnRemover}
            </div>
          </div>

          <hr class="my-2">

          <div class="small"><b>Preço:</b> €${Number(a.preco).toFixed(2)}</div>
          <div class="mt-2">${a.desc || ""}</div>

          <div class="mt-3 d-flex gap-2">
            ${btnContactar}
          </div>
        </div>
      </div>
    `;
  }

  function render(list) {
    if (!box) return;
    box.innerHTML = list.map(card).join("") || `<div class="small-muted">Sem anúncios.</div>`;
  }

  // Admin: remover (mock)
  window.removerAnuncio = (id) => {
    if (!isAdmin()) return;
    if (!confirm("Remover anúncio?")) return;
    anuncios = anuncios.filter(a => a.id !== id);
    render(filterList());
    showMsg("Anúncio removido.", "success");
  };

  // Abrir modal contacto
  window.abrirContacto = (id) => {
    const a = anuncios.find(x => x.id === id);
    if (!a) return;

    document.getElementById("contactoId").value = a.id;
    document.getElementById("contactoTitulo").value = a.titulo;
    document.getElementById("contactoPreco").value = `€${Number(a.preco).toFixed(2)}`;
    document.getElementById("contactoMsg").value = "";

    new bootstrap.Modal(document.getElementById("modalContacto")).show();
  };

  if (pesquisa) pesquisa.addEventListener("input", () => render(filterList()));
  if (filtro) filtro.addEventListener("change", () => render(filterList()));

  // Criar anúncio (mock)
  if (formAnuncio) {
    formAnuncio.addEventListener("submit", (e) => {
      e.preventDefault();

      const novo = {
        id: anuncios.length ? Math.max(...anuncios.map(x => x.id)) + 1 : 1,
        titulo: document.getElementById("mpTitulo").value.trim(),
        tipo: document.getElementById("mpTipo").value,
        preco: Number(document.getElementById("mpPreco").value || 0),
        tamanho: document.getElementById("mpTamanho").value.trim(),
        estado: document.getElementById("mpEstado").value,
        desc: document.getElementById("mpDesc").value.trim(),
        autor: role || "ENCARREGADO",
        ativo: true
      };

      anuncios.unshift(novo);

      bootstrap.Modal.getInstance(document.getElementById("modalAnuncio"))?.hide();
      formAnuncio.reset();

      render(filterList());
      showMsg("Anúncio publicado (mock).", "success");
    });
  }

  // Enviar mensagem contacto (mock)
  if (formContacto) {
    formContacto.addEventListener("submit", (e) => {
      e.preventDefault();

      const id = Number(document.getElementById("contactoId").value);
      const texto = document.getElementById("contactoMsg").value.trim();
      if (!texto) {
        showMsg("Escreve uma mensagem.", "danger");
        return;
      }

      bootstrap.Modal.getInstance(document.getElementById("modalContacto"))?.hide();
      formContacto.reset();

      showMsg("Mensagem enviada (mock).", "success");
    });
  }

  render(filterList());
}
