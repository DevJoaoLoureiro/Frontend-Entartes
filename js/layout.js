async function loadLayout({ pageTitle, activePage }) {
  const host = document.getElementById("layoutHost");
  if (!host) return;

  const html = await fetch("../partials/layout.html").then(r => r.text());
  host.innerHTML = html;

  // titulo no topbar
  const titleEl = document.getElementById("pageTitle");
  if (titleEl) titleEl.textContent = pageTitle || "Página";

  // duplicar sidebar (desktop + mobile) a partir do template
  const tpl = document.getElementById("sidebarTemplate");
  const desktop = document.getElementById("sidebarContentDesktop");
  const mobile = document.getElementById("sidebarContentMobile");

  if (tpl && desktop && mobile) {
    desktop.innerHTML = "";
    mobile.innerHTML = "";
    desktop.appendChild(tpl.content.cloneNode(true));
    mobile.appendChild(tpl.content.cloneNode(true));
  }

  // preencher utilizador na sidebar
  _fillSidebarUser();

  // ativa menu
  if (typeof setActiveMenu === "function" && activePage) {
    setActiveMenu(activePage);
  }

  // auth + role UI
  if (typeof requireAuth === "function") requireAuth();
  if (typeof setUserInfo === "function") setUserInfo();
  if (typeof applyRoleUI === "function") applyRoleUI();
}

function _fillSidebarUser() {
  const userStr = localStorage.getItem("user");
  if (!userStr) return;
  try {
    const user = JSON.parse(userStr);
    const nameEl = document.getElementById("sbUserName");
    const roleEl = document.getElementById("sbUserRole");
    const avatarEl = document.getElementById("sbUserAvatar");
    if (nameEl) nameEl.textContent = user.nome || "—";
    if (roleEl) roleEl.textContent = user.perfil || "—";
    if (avatarEl) {
      const name = user.nome || "";
      const parts = name.trim().split(" ");
      const initials = parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : (name[0] || "?").toUpperCase();
      avatarEl.textContent = initials;
    }
  } catch (_) {}
}
