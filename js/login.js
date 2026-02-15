const API_BASE_URL = "https://localhost:7086/api";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const msg = document.getElementById("loginMsg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) throw new Error("Login inválido");

      const data = await res.json();

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // redirect
      if (data.user.perfil === "ENCARREGADO") {
        window.location.href = "main/calendario.html";
      } else {
        window.location.href = "main/dashboard.html";
      }

    } catch (err) {
      msg.className = "alert alert-danger py-2";
      msg.textContent = err.message;
      msg.classList.remove("d-none");
    }
  });
});
