const API_BASE_URL = "https://localhost:7086/api";

const msg = document.getElementById("msg");
const form = document.getElementById("formRegisto");

function showMsg(text, type = "danger") {
  msg.className = `alert alert-${type}`;
  msg.textContent = text;
  msg.classList.remove("d-none");
}

function getTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
}

// Quando a página abre
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

    if (!res.ok) {
      throw new Error(text || "Convite inválido.");
    }

    const data = JSON.parse(text);

    // preencher dados do convite
    document.getElementById("email").value = data.email;
    document.getElementById("perfil").value = data.perfil;

  } catch (err) {
    showMsg(err.message);
    form.style.display = "none";
  }
});

// Submeter registo
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = getTokenFromUrl();
  const nome = document.getElementById("nome").value.trim();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const res = await fetch(`${API_BASE_URL}/utilizadores/registo-por-convite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ token, nome, username, password })
    });

    const text = await res.text();

    if (!res.ok) {
      throw new Error(text || "Erro ao criar conta.");
    }

    showMsg("Conta criada com sucesso! Vai ser redirecionado...", "success");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);

  } catch (err) {
    showMsg(err.message, "danger");
  }
});