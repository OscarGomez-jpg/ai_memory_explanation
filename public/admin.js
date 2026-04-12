function setAdminStatus(text, kind) {
  const el = document.getElementById("admin-status");
  el.textContent = text;
  el.className = `status-pill${kind ? ` ${kind}` : ""}`;
}

async function refreshAdminLeaderboard() {
  setAdminStatus("Cargando...", "");

  try {
    const resp = await fetch("/api/leaderboard?limit=50", { method: "GET" });
    const data = await resp.json();

    if (!resp.ok || !data || !Array.isArray(data.items)) {
      setAdminStatus("No se pudo cargar.", "fail");
      return;
    }

    const list = document.getElementById("leaderboard-list");
    list.innerHTML = "";

    if (data.items.length === 0) {
      const li = document.createElement("li");
      li.textContent = "Aún no hay resultados.";
      list.appendChild(li);
      setAdminStatus("Vacío.", "warn");
      return;
    }

    data.items.forEach((item, index) => {
      const li = document.createElement("li");
      li.textContent = `${index + 1}. ${item.username} — ${item.solved}/${item.roundsTotal} tickets, spend ${item.totalSpend} cr`;
      list.appendChild(li);
    });

    setAdminStatus("Actualizado.", "ok");
  } catch (_err) {
    setAdminStatus("Servidor no disponible.", "fail");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("admin-refresh")
    .addEventListener("click", () => void refreshAdminLeaderboard());

  refreshAdminLeaderboard();
});
