function requireAuth() {
  const token = localStorage.getItem("token");
  if (!token) window.location.href = "../index.html";
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "../index.html";
}

function getUser() {
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
}

function setUserInfo() {
  const user = getUser();
  const el = document.getElementById("topUserInfo");
  if (el) el.textContent = user ? `${user.nome} (${user.perfil})` : "-";
}

function setActiveMenu(currentPage) {
  const links = document.querySelectorAll("[data-page]");
  links.forEach(a => {
    if (a.getAttribute("data-page") === currentPage) a.classList.add("active");
  });
}

/**
 * Mostra/esconde itens do menu com base no perfil do user.
 * Usa data-roles="ADMIN,PROFESSOR" (se vazio/ausente => todos)
 */
function applyRoleUI() {
  const user = getUser();
  const role = user?.perfil || "GUEST";

  document.querySelectorAll("[data-roles]").forEach(el => {
    const roles = el.getAttribute("data-roles");
    if (!roles) return;
    const allowed = roles.split(",").map(x => x.trim());
    el.style.display = allowed.includes(role) ? "" : "none";
  });

  // Título "Portal" vs "Backoffice"
  const brand = document.getElementById("brandTitle");
  if (brand) brand.textContent = (role === "ENCARREGADO" ? "Portal do Encarregado" : "Backoffice");

  // Notificações (mock)
  renderNotifyBell();
}

function loadNotifications() {
  const s = localStorage.getItem("notifications");
  if (s) return JSON.parse(s);

  // Seed inicial (mock)
  const seed = [
    { id: 1, toRole: "PROFESSOR", titulo: "Desmarcação de aula", mensagem: "O aluno Ana Silva desmarcou a aula. Motivo: febre.", lida: false, createdAt: new Date().toISOString() },
    { id: 2, toRole: "ENCARREGADO", titulo: "Evento novo", mensagem: "Torneio de Dança - inscrições abertas.", lida: false, createdAt: new Date().toISOString() },
  ];
  localStorage.setItem("notifications", JSON.stringify(seed));
  return seed;
}

function saveNotifications(list) {
  localStorage.setItem("notifications", JSON.stringify(list));
}

function countUnreadForRole(role) {
  const list = loadNotifications();
  return list.filter(n => !n.lida && (n.toRole === role || n.toRole === "ALL")).length;
}

function renderNotifyBell() {
  const user = getUser();
  const role = user?.perfil;
  const count = role ? countUnreadForRole(role) : 0;

  const elCount = document.getElementById("notifyCount");
  const dot = document.getElementById("notifyDot");
  if (elCount) elCount.textContent = count;
  if (dot) dot.style.display = count > 0 ? "" : "none";
}
