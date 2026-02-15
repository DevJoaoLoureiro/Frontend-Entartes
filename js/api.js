const API_BASE_URL = "https://localhost:7086/api";

function getToken() {
  return localStorage.getItem("token");
}

async function apiGet(endpoint) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
    headers: token ? { "Authorization": `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error(`GET ${endpoint} falhou`);
  return await res.json();
}
async function apiPost(endpoint, data) {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `POST ${endpoint} falhou`);
  }

  return await res.json();
}
