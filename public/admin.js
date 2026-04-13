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

function setGameControlStatus(text, kind) {
  const el = document.getElementById("game-control-status");
  el.textContent = text;
  el.className = `status-pill${kind ? ` ${kind}` : ""}`;
}

function getPartLabel(part) {
  if (part === 1) return "Parte 1 (arquitectura)";
  if (part === 2) return "Parte 2 (validación)";
  if (part === 3) return "Parte 3 (escenarios)";
  return `Parte ${part}`;
}

let lastGameControl = { paused: false, unlockedPart: 3 };
let leaderboardAutoRefreshId = null;

async function refreshGameControl() {
  setGameControlStatus("Cargando...", "");
  try {
    const resp = await fetch("/api/game-control", { method: "GET" });
    const data = await resp.json();
    if (!resp.ok || !data || typeof data !== "object") {
      setGameControlStatus("No se pudo cargar.", "fail");
      return;
    }

    const paused = Boolean(data.paused);
    const unlockedPart = Number(data.unlockedPart) || 3;
    lastGameControl = { paused, unlockedPart };

    const toggleBtn = document.getElementById("toggle-pause");
    toggleBtn.textContent = paused ? "Reanudar" : "Pausar";

    setGameControlStatus(
      `${paused ? "Pausado" : "En curso"}. Desbloqueado: ${getPartLabel(unlockedPart)}.`,
      paused ? "warn" : "ok",
    );
  } catch (_err) {
    setGameControlStatus("Servidor no disponible.", "fail");
  }
}

async function updateGameControl(patch) {
  setGameControlStatus("Guardando...", "");
  try {
    const resp = await fetch("/api/game-control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await resp.json();
    if (!resp.ok || !data || data.ok !== true) {
      setGameControlStatus("No se pudo guardar.", "fail");
      return;
    }
    await refreshGameControl();
  } catch (_err) {
    setGameControlStatus("Servidor no disponible.", "fail");
  }
}

function getStageBadgeClass(part) {
  if (part === 1) return "part1";
  if (part === 2) return "part2";
  if (part === 3) return "part3";
  return "";
}

function getStageLabel(item) {
  const part = Number(item.stagePart);
  if (item.isFinished) return "Finalizó";
  if (part === 1) return "Parte 1";
  if (part === 2) return "Parte 2";
  if (part === 3) return "Parte 3";
  return "Parte";
}

function getTicketLabel(item) {
  const idx = Number(item.stageIndex);
  const total = Number(item.roundsTotal);
  if (!Number.isFinite(idx) || idx < 0 || !Number.isFinite(total) || total <= 0)
    return "";
  return `Ticket ${idx + 1}/${total}`;
}

async function refreshAdminLeaderboard({ silent } = { silent: false }) {
  if (!silent) setAdminStatus("Cargando...", "");

  try {
    const resp = await fetch(`/api/leaderboard?limit=50`, {
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
      li.className = "leaderboard-item";
      li.dataset.username = item.username;
      li.style.cursor = "pointer";

      const part = Number(item.stagePart) || 1;
      const waiting =
        lastGameControl.paused || part > lastGameControl.unlockedPart;
      const stageLabel = getStageLabel(item);
      const ticketLabel = getTicketLabel(item);

      const badges = [];
      if (item.isFinished) {
        badges.push('<span class="lb-badge done">Finalizó</span>');
      } else {
        badges.push(
          `<span class="lb-badge ${getStageBadgeClass(part)}">${stageLabel}</span>`,
        );
      }
      if (ticketLabel) {
        badges.push(`<span class="lb-badge">${ticketLabel}</span>`);
      }
      if (lastGameControl.paused) {
        badges.push('<span class="lb-badge paused">Pausado</span>');
      } else if (waiting && !item.isFinished) {
        badges.push('<span class="lb-badge waiting">Esperando</span>');
      }

      li.innerHTML = `
        <div class="lb-rank">${index + 1}</div>
        <div class="lb-body">
          <div class="lb-top">
            <div class="lb-name">${item.username}</div>
            <div class="lb-badges">${badges.join(" ")}</div>
          </div>
          <div class="lb-meta">
            <span><strong>${item.solved}</strong>/${item.roundsTotal} tickets</span>
            <span>· spend <strong>${item.totalSpend}</strong> cr</span>
          </div>
        </div>
      `;
      li.addEventListener("click", () => {
        const input = document.getElementById("admin-user");
        input.value = item.username;
        void fetchUserAttempts();
      });
      list.appendChild(li);
    });

    if (!silent) setAdminStatus("Actualizado.", "ok");
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
    const u = encodeURIComponent(username);
    const resp = await fetch(`/api/user-attempts?username=${u}&limit=20`, {
      method: "GET",
    });
    const data = await resp.json();

    if (!resp.ok || !data || !Array.isArray(data.items)) {
      setUserStatus("No se pudo cargar.", "fail");
      return;
    }

    const list = document.getElementById("admin-user-attempts");
    list.innerHTML = "";

    if (data.items.length === 0) {
      const li = document.createElement("li");
      li.textContent = "Sin partidas registradas.";
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
    .getElementById("game-control-refresh")
    .addEventListener("click", () => void refreshGameControl());

  document
    .getElementById("unlock-part-1")
    .addEventListener(
      "click",
      () => void updateGameControl({ unlockedPart: 1 }),
    );
  document
    .getElementById("unlock-part-2")
    .addEventListener(
      "click",
      () => void updateGameControl({ unlockedPart: 2 }),
    );
  document
    .getElementById("unlock-part-3")
    .addEventListener(
      "click",
      () => void updateGameControl({ unlockedPart: 3 }),
    );

  document.getElementById("toggle-pause").addEventListener("click", () => {
    void updateGameControl({ paused: !lastGameControl.paused });
  });

  document
    .getElementById("admin-refresh")
    .addEventListener("click", () => void refreshAdminLeaderboard());

  document
    .getElementById("admin-user-fetch")
    .addEventListener("click", () => void fetchUserAttempts());

  document.getElementById("admin-user").addEventListener("keydown", (e) => {
    if (e.key === "Enter") void fetchUserAttempts();
  });

  refreshAdminLeaderboard();
  refreshGameControl();

  if (leaderboardAutoRefreshId) {
    window.clearInterval(leaderboardAutoRefreshId);
  }
  leaderboardAutoRefreshId = window.setInterval(
    () => void refreshAdminLeaderboard({ silent: true }),
    2000,
  );
});
