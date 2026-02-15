async function loadLayout({ pageTitle, activePage }) {
  const host = document.getElementById("layoutHost");
  if (!host) return;

  const html = await fetch("../partials/layout.html").then(r => r.text());
  host.innerHTML = html;

  // titulo
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

  // ativa menu
  if (typeof setActiveMenu === "function" && activePage) {
    setActiveMenu(activePage);
  }

  // auth + role UI
  if (typeof requireAuth === "function") requireAuth();
  if (typeof setUserInfo === "function") setUserInfo();
  if (typeof applyRoleUI === "function") applyRoleUI();
}
