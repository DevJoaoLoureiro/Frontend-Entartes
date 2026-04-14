const API_BASE_URL = "https://localhost:7086/api";

const msg = document.getElementById("msg");
const form = document.getElementById("formRegisto");
const secEducandos = document.getElementById("secEducandos");
const listaEducandos = document.getElementById("listaEducandos");
const btnAddEducando = document.getElementById("btnAddEducando");

let perfilConvite = null;
let contadorEducandos = 0;

function showMsg(text, type = "danger") {
  msg.className = `alert alert-${type}`;
  msg.textContent = text;
  msg.classList.remove("d-none");
}

function hideMsg() {
  msg.classList.add("d-none");
  msg.textContent = "";
}

function getTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
}

function addEducandoRow(nome = "", dataNascimento = "") {
  contadorEducandos++;

  const row = document.createElement("div");
  row.className = "border rounded p-3 mb-3 educando-item";
  row.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-2">
      <strong>Educando ${contadorEducandos}</strong>
      <button type="button" class="btn btn-sm btn-outline-danger btn-remove-educando">Remover</button>
    </div>

    <div class="mb-3">
      <label class="form-label">Nome do educando</label>
      <input type="text" class="form-control edu-nome" value="${nome}">
    </div>

    <div class="mb-0">
      <label class="form-label">Data de nascimento</label>
      <input type="date" class="form-control edu-data" value="${dataNascimento}">
    </div>
  `;

  row.querySelector(".btn-remove-educando").addEventListener("click", () => {
    row.remove();
  });

  listaEducandos.appendChild(row);
}

document.addEventListener("DOMContentLoaded", async () => {
  const token = getTokenFromUrl();

  if (!token) {
    showMsg("Token inválido.");
    form.style.display = "none";
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/utilizadores/convite/${token}`);
    const text = await res.text();

    if (!res.ok) throw new Error(text || "Convite inválido.");

    const data = JSON.parse(text);

    perfilConvite = data.perfil;

    document.getElementById("email").value = data.email;
    document.getElementById("perfil").value = data.perfil;

    if (perfilConvite === "ENCARREGADO") {
      secEducandos.classList.remove("d-none");
      addEducandoRow();
    } else {
      secEducandos.classList.add("d-none");
    }
  } catch (err) {
    showMsg(err.message || "Erro ao validar convite.");
    form.style.display = "none";
  }
});

btnAddEducando?.addEventListener("click", () => {
  addEducandoRow();
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideMsg();

  const token = getTokenFromUrl();
  const nome = document.getElementById("nome").value.trim();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!nome || !username || !password) {
    showMsg("Preenche nome, username e password.");
    return;
  }

  let educandos = null;

  if (perfilConvite === "ENCARREGADO") {
    educandos = [...document.querySelectorAll(".educando-item")]
      .map(item => ({
        nome: item.querySelector(".edu-nome").value.trim(),
        dataNascimento: item.querySelector(".edu-data").value || null
      }))
      .filter(e => e.nome);

    if (!educandos.length) {
      showMsg("Tens de indicar pelo menos um educando.");
      return;
    }
  }

  const payload = {
    token,
    nome,
    username,
    password,
    educandos
  };

  try {
    const res = await fetch(`${API_BASE_URL}/utilizadores/registo-por-convite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const text = await res.text();

    if (!res.ok) throw new Error(text || "Erro ao criar conta.");

    showMsg("Conta criada com sucesso! Vai ser redirecionado...", "success");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);
  } catch (err) {
    showMsg(err.message || "Erro ao criar conta.");
  }
});