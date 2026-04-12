function setAdminStatus(text, kind) {
  const el = document.getElementById("admin-status");
  el.textContent = text;
  el.className = `status-pill${kind ? ` ${kind}` : ""}`;
}

function setUserStatus(text, kind) {
  const el = document.getElementById("admin-user-status");
  el.textContent = text;
  el.className = `status-pill${kind ? ` ${kind}` : ""}`;
}

function getSelectedModeId() {
  const sel = document.getElementById("admin-mode");
  return String(sel.value || "memory-architect").trim() || "memory-architect";
}

async function refreshAdminLeaderboard() {
  setAdminStatus("Cargando...", "");

  try {
    const modeId = encodeURIComponent(getSelectedModeId());
    const resp = await fetch(`/api/leaderboard?limit=50&modeId=${modeId}`, {
      method: "GET",
    });
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
      li.dataset.username = item.username;
      li.style.cursor = "pointer";
      li.textContent = `${index + 1}. ${item.username} — ${item.solved}/${item.roundsTotal} tickets, spend ${item.totalSpend} cr`;
      li.addEventListener("click", () => {
        const input = document.getElementById("admin-user");
        input.value = item.username;
        void fetchUserAttempts();
      });
      list.appendChild(li);
    });

    setAdminStatus("Actualizado.", "ok");
  } catch (_err) {
    setAdminStatus("Servidor no disponible.", "fail");
  }
}

function sanitizeUsername(value) {
  const trimmed = String(value || "").trim();
  return trimmed.replace(/[^\p{L}0-9 _.-]/gu, "").slice(0, 24);
}

async function fetchUserAttempts() {
  const input = document.getElementById("admin-user");
  const username = sanitizeUsername(input.value);
  input.value = username;

  if (!username) {
    setUserStatus("Escribe un nombre.", "warn");
    document.getElementById("admin-user-attempts").innerHTML = "";
    return;
  }

  setUserStatus("Cargando historial...", "");

  try {
    const modeId = encodeURIComponent(getSelectedModeId());
    const u = encodeURIComponent(username);
    const resp = await fetch(
      `/api/user-attempts?username=${u}&modeId=${modeId}&limit=20`,
      { method: "GET" },
    );
    const data = await resp.json();

    if (!resp.ok || !data || !Array.isArray(data.items)) {
      setUserStatus("No se pudo cargar.", "fail");
      return;
    }

    const list = document.getElementById("admin-user-attempts");
    list.innerHTML = "";

    if (data.items.length === 0) {
      const li = document.createElement("li");
      li.textContent = "Sin partidas registradas en este modo.";
      list.appendChild(li);
      setUserStatus("Sin resultados.", "warn");
      return;
    }

    data.items.forEach((a) => {
      const li = document.createElement("li");
      li.textContent = `${a.createdAt} — ${a.solved}/${a.roundsTotal} tickets, spend ${a.totalSpend} cr, remaining ${a.budgetRemaining} cr`;
      list.appendChild(li);
    });

    setUserStatus("Historial cargado.", "ok");
  } catch (_err) {
    setUserStatus("Servidor no disponible.", "fail");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  setUserStatus("", "");

  document
    .getElementById("admin-refresh")
    .addEventListener("click", () => void refreshAdminLeaderboard());

  document
    .getElementById("admin-mode")
    .addEventListener("change", () => void refreshAdminLeaderboard());

  document
    .getElementById("admin-user-fetch")
    .addEventListener("click", () => void fetchUserAttempts());

  document.getElementById("admin-user").addEventListener("keydown", (e) => {
    if (e.key === "Enter") void fetchUserAttempts();
  });

  refreshAdminLeaderboard();
});
