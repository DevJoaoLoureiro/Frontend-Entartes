function initPresencas() {

  const sessoes = JSON.parse(localStorage.getItem("sessoes") || "[]");
  let presencas = JSON.parse(localStorage.getItem("presencas") || "{}");

  const select = document.getElementById("selectSessao");
  const tbl = document.getElementById("tblPresencas");

  // Mock alunos
  const alunos = ["Maria Silva", "João Costa", "Inês Rocha"];

  select.innerHTML = sessoes.map(s =>
    `<option value="${s.id}">${s.turma} - ${s.data} ${s.hora}</option>`
  ).join("");

  function render() {
    const sessaoId = select.value;
    if (!presencas[sessaoId]) presencas[sessaoId] = {};

    tbl.innerHTML = alunos.map(nome => `
      <tr>
        <td>${nome}</td>
        <td>
          <input type="checkbox"
            ${presencas[sessaoId][nome] ? "checked" : ""}
            onchange="togglePresenca('${sessaoId}', '${nome}', this.checked)">
        </td>
      </tr>
    `).join("");
  }

  window.togglePresenca = (sessaoId, nome, checked) => {
    if (!presencas[sessaoId]) presencas[sessaoId] = {};
    presencas[sessaoId][nome] = checked;
    localStorage.setItem("presencas", JSON.stringify(presencas));
  };

  select.addEventListener("change", render);

  render();
}
