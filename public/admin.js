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

function setDatasetResetStatus(text, kind) {
  const el = document.getElementById("dataset-reset-status");
  if (!el) return;
  el.textContent = text;
  el.className = `status-pill${kind ? ` ${kind}` : ""}`;
}

function formatElapsed(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getStageElapsedText() {
  const iso = lastGameControl && lastGameControl.stageStartedAt;
  if (!iso) return "";
  const startedAt = Date.parse(iso);
  if (!Number.isFinite(startedAt)) return "";
  return ` Etapa: ${formatElapsed(Date.now() - startedAt)}.`;
}

function getPartLabel(part) {
  if (part === 1) return "Parte 1 (arquitectura)";
  if (part === 2) return "Parte 2 (validación)";
  if (part === 3) return "Parte 3 (escenarios)";
  return `Parte ${part}`;
}

let lastGameControl = { paused: false, unlockedPart: 3, stageStartedAt: null };
let leaderboardAutoRefreshId = null;
let gameControlClockId = null;
let gameControlLoaded = false;

async function refreshGameControl() {
  setGameControlStatus("Cargando...", "");
  try {
    const resp = await fetch("/api/game-control", { method: "GET" });
    const data = await resp.json();
    if (!resp.ok || !data || typeof data !== "object") {
      gameControlLoaded = false;
      setGameControlStatus("No se pudo cargar.", "fail");
      return;
    }

    const paused = Boolean(data.paused);
    const unlockedPart = Number(data.unlockedPart) || 3;
    const stageStartedAt =
      typeof data.stageStartedAt === "string" && data.stageStartedAt.length > 0
        ? data.stageStartedAt
        : null;
    const status =
      data.status === "idle" ||
      data.status === "lobby" ||
      data.status === "running"
        ? data.status
        : null;
    const joinOpen = typeof data.joinOpen === "boolean" ? data.joinOpen : null;

    lastGameControl = {
      paused,
      unlockedPart,
      stageStartedAt,
      status,
      joinOpen,
    };
    gameControlLoaded = true;

    const toggleBtn = document.getElementById("toggle-pause");
    toggleBtn.textContent = paused ? "Reanudar" : "Pausar";

    const statusText =
      status === "idle"
        ? "Idle"
        : status === "lobby"
          ? `Lobby${joinOpen ? " (join abierto)" : ""}`
          : status === "running"
            ? "En juego"
            : "";

    setGameControlStatus(
      `${statusText ? `${statusText}. ` : ""}${paused ? "Pausado" : "En curso"}. Desbloqueado: ${getPartLabel(unlockedPart)}.${getStageElapsedText()}`,
      paused ? "warn" : "ok",
    );
  } catch (_err) {
    gameControlLoaded = false;
    setGameControlStatus("Servidor no disponible.", "fail");
  }
}

async function createGame() {
  setGameControlStatus("Creando juego...", "");
  try {
    const resp = await fetch("/api/admin/create-game", { method: "POST" });
    const data = await resp.json();
    if (!resp.ok || !data || data.ok !== true) {
      setGameControlStatus("No se pudo crear.", "fail");
      return;
    }
    await refreshGameControl();
  } catch (_err) {
    setGameControlStatus("Servidor no disponible.", "fail");
  }
}

async function startGameAdmin() {
  setGameControlStatus("Iniciando juego...", "");
  try {
    const resp = await fetch("/api/admin/start-game", { method: "POST" });
    const data = await resp.json();
    if (!resp.ok || !data || data.ok !== true) {
      setGameControlStatus("No se pudo iniciar.", "fail");
      return;
    }
    await refreshGameControl();
  } catch (_err) {
    setGameControlStatus("Servidor no disponible.", "fail");
  }
}

async function resetDataset() {
  setDatasetResetStatus("", "");

  const ok = window.confirm(
    "Esto borrará TODOS los resultados (leaderboard e historial) y reiniciará el control del juego. ¿Continuar?",
  );
  if (!ok) return;

  setDatasetResetStatus("Reiniciando...", "");

  try {
    const resp = await fetch("/api/admin/reset", { method: "POST" });
    const data = await resp.json().catch(() => null);
    if (!resp.ok || !data || data.ok !== true) {
      setDatasetResetStatus("No se pudo reiniciar.", "fail");
      return;
    }

    setDatasetResetStatus("Dataset reiniciado.", "ok");
    await refreshGameControl();
    await refreshAdminLeaderboard();
    document.getElementById("admin-user-attempts").innerHTML = "";
    setUserStatus("", "");
  } catch (_err) {
    setDatasetResetStatus("Servidor no disponible.", "fail");
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
  setDatasetResetStatus("", "");

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
    .getElementById("create-game")
    .addEventListener("click", () => void createGame());

  document
    .getElementById("start-game-admin")
    .addEventListener("click", () => void startGameAdmin());

  document
    .getElementById("dataset-reset")
    .addEventListener("click", () => void resetDataset());

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

  if (gameControlClockId) {
    window.clearInterval(gameControlClockId);
  }
  gameControlClockId = window.setInterval(() => {
    if (!gameControlLoaded) return;
    const paused = Boolean(lastGameControl.paused);
    const unlockedPart = Number(lastGameControl.unlockedPart) || 3;
    const base = `${paused ? "Pausado" : "En curso"}. Desbloqueado: ${getPartLabel(unlockedPart)}.`;
    const extra = getStageElapsedText();
    setGameControlStatus(`${base}${extra}`, paused ? "warn" : "ok");
  }, 1000);

  if (leaderboardAutoRefreshId) {
    window.clearInterval(leaderboardAutoRefreshId);
  }
  leaderboardAutoRefreshId = window.setInterval(
    () => void refreshAdminLeaderboard({ silent: true }),
    2000,
  );
});
