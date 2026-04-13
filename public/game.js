const MODEL_NAME = "Gemma 4:2be Custom";

// BLOQUES DE MEMORIA DISPONIBLES
const MEMORY_BLOCKS = [
  {
    id: "base",
    name: "Parametric",
    description: "Model weights. Pure training data.",
    cost: 0,
    reliability: 0.4,
    color: "#dcfce7",
    mandatory: true,
  },
  {
    id: "episodic",
    name: "Episodic",
    description: "Chat history & interaction logging.",
    cost: 100,
    reliability: 0.15,
    color: "#fef3c7",
    problemMatch: "Episodic",
  },
  {
    id: "procedural",
    name: "Procedural",
    description: "System prompts & operating rules.",
    cost: 150,
    reliability: 0.2,
    color: "#e0f2fe",
    problemMatch: "Procedural",
  },
  {
    id: "external",
    name: "External",
    description: "Vector RAG (retrieval augmented).",
    cost: 250,
    reliability: 0.25,
    color: "#f3e8ff",
    problemMatch: "External",
  },
  {
    id: "semantic",
    name: "Semantic",
    description: "Knowledge Graphs & entity relationships.",
    cost: 350,
    reliability: 0.3,
    color: "#fff7ed",
    problemMatch: "Semantic",
  },
];

const PROBLEMS = [
  {
    id: 1,
    type: "architecture",
    title: "Vuelo de Marta",
    priority: "Episodic",
    details: "Requiere recordar datos de la conversación inmediata.",
    facts: ["Marta", "19:30", "Q7A9", "12B", "C4"],
    question: "Cual es la puerta de embarque?",
    targetKey: "puerta",
    expectedOutput: "La puerta de embarque es C4.",
  },
  {
    id: 2,
    type: "architecture",
    title: "Documentación Técnica",
    priority: "External",
    details: "Consulta de base de conocimientos masiva.",
    facts: ["INC-7781", "2.4.1", "2.3.8"],
    question: "Que version se recomienda para rollback?",
    targetKey: "rollback",
    expectedOutput: "El rollback recomendado es 2.3.8.",
  },
  {
    id: 3,
    type: "architecture",
    title: "Reserva de Diego",
    priority: "Semantic",
    details: "Relaciones entre entidades y preferencias.",
    facts: ["Diego", "4 personas", "Terraza-5", "21:15"],
    question: "Que mesa fue asignada?",
    targetKey: "mesa",
    expectedOutput: "La mesa asignada es Terraza-5.",
  },
  {
    id: 4,
    type: "architecture",
    title: "Políticas de Empresa",
    priority: "Procedural",
    details: "Instrucciones de actuación y protocolos.",
    facts: ["Atlas", "Paula", "23:00"],
    question: "Quien es responsable del hotfix?",
    targetKey: "responsable",
    expectedOutput: "El responsable del hotfix es Paula.",
  },
  {
    id: 5,
    type: "validation",
    title: "Consulta sobre Python",
    scenario:
      "Un usuario pregunta: '¿Cuál es la sintaxis para crear una lista en Python?'",
    chosenMemory: "Episodic Memory",
    correctAnswer: false, // NO es correcto
    explanation:
      "Esta pregunta requiere conocimiento general de programación, no de conversaciones previas. Debería usar Parametric Memory (conocimiento base del modelo).",
  },
  {
    id: 6,
    type: "validation",
    title: "Recordar preferencias del usuario",
    scenario:
      "El usuario dice: 'Recuerda que prefiero respuestas cortas'. Más tarde pregunta algo y el modelo debe responder brevemente.",
    chosenMemory: "Episodic Memory",
    correctAnswer: true, // SÍ es correcto
    explanation:
      "Episodic Memory es ideal para recordar preferencias mencionadas en la conversación actual.",
  },
  {
    id: 7,
    type: "validation",
    title: "Políticas de devolución",
    scenario:
      "Un cliente pregunta sobre el proceso de devolución de productos. El sistema necesita seguir las políticas establecidas por la empresa.",
    chosenMemory: "Procedural Memory",
    correctAnswer: true, // SÍ es correcto
    explanation:
      "Procedural Memory contiene las reglas y procedimientos operativos de la empresa.",
  },
  {
    id: 8,
    type: "validation",
    title: "Búsqueda en documentación técnica",
    scenario:
      "Un desarrollador pregunta sobre cómo configurar un servicio específico que está documentado en Confluence.",
    chosenMemory: "External Memory (RAG)",
    correctAnswer: true, // SÍ es correcto
    explanation:
      "External Memory permite buscar en bases de conocimiento externas como Confluence.",
  },
  {
    id: 9,
    type: "scenario-selection",
    title: "Episodic Memory",
    memoryType: "Episodic",
    options: [
      {
        text: "¿Qué te dije sobre mis preferencias de formato?",
        isCorrect: true,
      },
      { text: "¿Cuál es la capital de Francia?", isCorrect: false },
      {
        text: "¿Cómo funciona el algoritmo de ordenamiento quicksort?",
        isCorrect: false,
      },
      {
        text: "¿Cuál es la política de reembolsos de la empresa?",
        isCorrect: false,
      },
    ],
    explanation:
      "Episodic Memory es ideal para recordar información de la conversación actual, como preferencias mencionadas anteriormente.",
  },
  {
    id: 10,
    type: "scenario-selection",
    title: "Procedural Memory",
    memoryType: "Procedural",
    options: [
      { text: "¿Cuál fue el último mensaje que te envié?", isCorrect: false },
      { text: "¿Qué significa machine learning?", isCorrect: false },
      {
        text: "¿Qué documentación existe sobre microservicios en el wiki?",
        isCorrect: false,
      },
      {
        text: "¿Cuáles son los pasos para escalar un incidente crítico?",
        isCorrect: true,
      },
    ],
    explanation:
      "Procedural Memory contiene reglas, protocolos y procedimientos operativos establecidos.",
  },
  {
    id: 11,
    type: "scenario-selection",
    title: "External Memory (RAG)",
    memoryType: "External",
    options: [
      { text: "¿Cuál es el protocolo de emergencia?", isCorrect: false },
      {
        text: "Busca información sobre la API de pagos en la documentación interna.",
        isCorrect: true,
      },
      { text: "Resume lo que hablamos hace 5 minutos.", isCorrect: false },
      { text: "¿Cómo se llama el CEO de la empresa?", isCorrect: false },
    ],
    explanation:
      "External Memory (RAG) permite buscar en bases de conocimiento externas y documentación almacenada.",
  },
  {
    id: 12,
    type: "scenario-selection",
    title: "Semantic Memory",
    memoryType: "Semantic",
    options: [
      {
        text: "¿Qué dijo el cliente sobre sus preferencias?",
        isCorrect: false,
      },
      { text: "Busca el último changelog en Confluence.", isCorrect: false },
      {
        text: "¿Qué relaciones existen entre los servicios de autenticación y los microservicios de usuario?",
        isCorrect: true,
      },
      { text: "¿Cuál es el proceso para aprobar un PR?", isCorrect: false },
    ],
    explanation:
      "Semantic Memory usa grafos de conocimiento para entender relaciones complejas entre entidades.",
  },
];

const gameState = {
  totalSpend: 0,
  solved: 0,
  solvedFirstTry: 0, // Tickets resueltos a la primera sin fallar
  roundIndex: 0,
  activeBlockIds: ["base"],
  latestRun: null,
  currentProblemSolved: false,
  hasFailedCurrentProblem: false, // Si ya falló en el ticket actual
  disabledBlockIds: [], // Bloques deshabilitados para el problema actual
  selectedScenarioIndex: null, // Índice de la opción seleccionada en scenario-selection
  disabledScenarioIndices: [], // Opciones deshabilitadas en scenario-selection
};

const canvas = document.getElementById("game-board");
const ctx = canvas.getContext("2d");

const spendValueEl = document.getElementById("spend-value");
const ticketProblemTitleEl = document.getElementById("ticket-problem-title");
const customerMessageEl = document.getElementById("customer-message");
const scoreQualityEl = document.getElementById("score-quality");
const scoreMemoryEl = document.getElementById("score-memory");
const infraCardsEl = document.getElementById("infra-cards");
const expectedOutputEl = document.getElementById("expected-output");
const actualOutputEl = document.getElementById("actual-output");
const roundStatusEl = document.getElementById("round-status");

const runRoundBtn = document.getElementById("run-round");

const modalOverlay = document.getElementById("result-modal");
const modalTitle = document.getElementById("modal-title");
const modalMessage = document.getElementById("modal-message");
const modalDetails = document.getElementById("modal-details");
const modalCloseBtn = document.getElementById("modal-close-btn");

const stageEl = document.getElementById("stage");
const stageTimerEl = document.getElementById("stage-timer");
const validationLeftPanel = document.getElementById("validation-left-panel");
const validationRightPanel = document.getElementById("validation-right-panel");
const chosenMemoryElValidation = document.getElementById(
  "chosen-memory-validation",
);
const answerYesBtnValidation = document.getElementById("answer-yes-validation");
const answerNoBtnValidation = document.getElementById("answer-no-validation");
const ticketProblemTitleValidation = document.getElementById(
  "ticket-problem-title-validation",
);
const customerMessageValidation = document.getElementById(
  "customer-message-validation",
);
const spendValueValidation = document.getElementById("spend-value-validation");

const validationCanvas = document.getElementById("validation-board");
const validationCtx = validationCanvas.getContext("2d");

const scenarioSelectionPanel = document.getElementById(
  "scenario-selection-panel",
);
const scenarioCanvas = document.getElementById("scenario-board");
const scenarioCtx = scenarioCanvas.getContext("2d");
const scenarioOptionsDiv = document.getElementById("scenario-options");
const ticketProblemTitleScenario = document.getElementById(
  "ticket-problem-title-scenario",
);
const spendValueScenario = document.getElementById("spend-value-scenario");
const runScenarioBtn = document.getElementById("run-scenario");

// ====== SERVER GAME CONTROL (admin) ======
const gameControlState = {
  paused: false,
  unlockedPart: 3,
  stageStartedAt: null,
  status: "idle",
  joinOpen: false,
  loaded: false,
};

const STAGE_DURATION_MS = 2 * 60 * 1000;
let stageTimerIntervalId = null;
let handledStageStartedAt = null;
let pendingLockedPart = null;
let gameEnded = false;

const PART_START_INDEX = (() => {
  const idx1 = 0;
  const idx2 = PROBLEMS.findIndex((p) => p && p.type === "validation");
  const idx3 = PROBLEMS.findIndex((p) => p && p.type === "scenario-selection");
  return {
    1: idx1,
    2: idx2 >= 0 ? idx2 : idx1,
    3: idx3 >= 0 ? idx3 : idx2 >= 0 ? idx2 : idx1,
  };
})();

function formatCountdown(msRemaining) {
  const totalSeconds = Math.max(0, Math.ceil(msRemaining / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function setStageTimerText(text, kind) {
  if (!stageTimerEl) return;
  stageTimerEl.textContent = text;
  stageTimerEl.className = `status-pill${kind ? ` ${kind}` : ""}`;
}

function hideStageTimer() {
  if (!stageTimerEl) return;
  stageTimerEl.style.display = "none";
}

function showStageTimer() {
  if (!stageTimerEl) return;
  stageTimerEl.style.display = "block";
}

function hardCloseModalOverlay() {
  modalOverlay.style.display = "none";
  if (modalOverlay.dataset && modalOverlay.dataset.kind) {
    delete modalOverlay.dataset.kind;
  }
}

function resetPerProblemState() {
  gameState.latestRun = null;
  gameState.activeBlockIds = ["base"];
  gameState.currentProblemSolved = false;
  gameState.hasFailedCurrentProblem = false;
  gameState.disabledBlockIds = [];
  gameState.selectedScenarioIndex = null;
  gameState.disabledScenarioIndices = [];
}

function moveToPartStart(part) {
  const startIndex = PART_START_INDEX[part];
  if (!Number.isInteger(startIndex) || startIndex < 0) return false;

  const currentProblem = PROBLEMS[gameState.roundIndex];
  const currentPart = getPartForProblem(currentProblem);
  if (currentPart >= part) return false;

  gameState.roundIndex = startIndex;
  resetPerProblemState();
  updateUI();
  void submitAttempt();
  return true;
}

function forceMoveToPart(part) {
  const startIndex = PART_START_INDEX[part];
  if (!Number.isInteger(startIndex) || startIndex < 0) return;

  const currentProblem = PROBLEMS[gameState.roundIndex];
  const currentPart = getPartForProblem(currentProblem);
  if (currentPart >= part) return;

  gameState.roundIndex = startIndex;
  resetPerProblemState();
  hardCloseModalOverlay();

  pendingLockedPart =
    typeof gameControlState.unlockedPart === "number" &&
    part > gameControlState.unlockedPart
      ? part
      : null;

  updateUI();
  void submitAttempt();
  void refreshGameControl();
}

function handleStageTimeout(stageStartedAtIso) {
  if (!stageStartedAtIso) return;
  if (handledStageStartedAt === stageStartedAtIso) return;
  handledStageStartedAt = stageStartedAtIso;

  if (gameControlState.paused) return;

  // If we're already waiting for the next stage, don't advance again.
  if (
    typeof pendingLockedPart === "number" &&
    pendingLockedPart > gameControlState.unlockedPart
  ) {
    return;
  }

  const currentProblem = PROBLEMS[gameState.roundIndex];
  const currentPart = getPartForProblem(currentProblem);
  const nextPart = currentPart + 1;

  if (nextPart > 3) {
    void showFinalScreen();
    return;
  }

  moveToPartStart(nextPart);

  const shouldWait = nextPart > gameControlState.unlockedPart;
  pendingLockedPart = shouldWait ? nextPart : null;

  if (shouldWait) {
    showAdminBlockModal(
      "Tiempo terminado",
      `Espera a que el admin habilite ${getPartLabel(nextPart)}.`,
    );
  } else {
    hideAdminBlockModalIfOpen();
  }
}

function updateStageTimerUI() {
  if (gameEnded) {
    hideStageTimer();
    return;
  }
  if (!currentPlayer) {
    hideStageTimer();
    return;
  }
  showStageTimer();

  if (
    typeof pendingLockedPart === "number" &&
    pendingLockedPart > gameControlState.unlockedPart
  ) {
    setStageTimerText(
      `Listo — Esperando ${getPartLabel(pendingLockedPart)}...`,
      "warn",
    );
    return;
  }

  const stagePart = gameControlState.loaded
    ? Number(gameControlState.unlockedPart) || 1
    : null;

  if (!gameControlState.loaded) {
    setStageTimerText("Tiempo: --:--", "warn");
    return;
  }

  if (gameControlState.paused) {
    setStageTimerText(`Etapa ${stagePart} — Pausado`, "warn");
    return;
  }

  const iso = gameControlState.stageStartedAt;
  if (!iso) {
    setStageTimerText(`Etapa ${stagePart} — Tiempo: --:--`, "warn");
    return;
  }

  const startedAt = Date.parse(iso);
  if (!Number.isFinite(startedAt)) {
    setStageTimerText(`Etapa ${stagePart} — Tiempo: --:--`, "warn");
    return;
  }

  const elapsed = Date.now() - startedAt;
  const remaining = STAGE_DURATION_MS - elapsed;
  const label = `Etapa ${stagePart} — Tiempo: ${formatCountdown(remaining)}`;
  setStageTimerText(label, remaining <= 10_000 ? "warn" : "ok");

  if (remaining <= 0) {
    handleStageTimeout(iso);
  }
}

function ensureStageTimerRunning() {
  if (!stageTimerEl) return;
  if (stageTimerIntervalId) return;
  stageTimerIntervalId = window.setInterval(() => updateStageTimerUI(), 250);
}

function getPartForProblem(problem) {
  if (!problem || !problem.type) return 1;
  if (problem.type === "architecture") return 1;
  if (problem.type === "validation") return 2;
  if (problem.type === "scenario-selection") return 3;
  return 1;
}

function getPartLabel(part) {
  if (part === 1) return "Parte 1";
  if (part === 2) return "Parte 2";
  if (part === 3) return "Parte 3";
  return `Parte ${part}`;
}

function applyPauseToStage() {
  stageEl.style.pointerEvents = gameControlState.paused ? "none" : "";
}

function getEffectiveProblemForGate() {
  const currentProblem = PROBLEMS[gameState.roundIndex];
  if (
    gameState.currentProblemSolved &&
    gameState.roundIndex < PROBLEMS.length - 1
  ) {
    return PROBLEMS[gameState.roundIndex + 1];
  }
  return currentProblem;
}

function getEffectiveRoundIndexForGate() {
  if (
    gameState.currentProblemSolved &&
    gameState.roundIndex < PROBLEMS.length - 1
  ) {
    return gameState.roundIndex + 1;
  }
  return gameState.roundIndex;
}

function showAdminBlockModal(title, message) {
  const modalContent = document.querySelector(".modal-content");
  modalContent.className = "modal-content";
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  modalDetails.innerHTML = "";
  modalCloseBtn.textContent = "Esperando...";
  modalCloseBtn.disabled = true;
  modalOverlay.dataset.kind = "admin-block";
  modalOverlay.style.display = "flex";
}

function hideAdminBlockModalIfOpen() {
  if (modalOverlay.dataset.kind === "admin-block") {
    modalOverlay.style.display = "none";
    delete modalOverlay.dataset.kind;
  }
}

async function refreshGameControl() {
  try {
    const resp = await fetch("/api/game-control", { method: "GET" });
    const data = await resp.json();
    if (!resp.ok || !data || typeof data !== "object") return;

    gameControlState.paused = Boolean(data.paused);
    gameControlState.unlockedPart = Number(data.unlockedPart) || 3;
    gameControlState.stageStartedAt =
      typeof data.stageStartedAt === "string" && data.stageStartedAt.length > 0
        ? data.stageStartedAt
        : null;
    gameControlState.status =
      data.status === "idle" ||
      data.status === "lobby" ||
      data.status === "running"
        ? data.status
        : "idle";
    gameControlState.joinOpen = Boolean(data.joinOpen);
    gameControlState.loaded = true;

    // Lobby/idle UX: do not run countdown or show gameplay.
    if (gameControlState.status !== "running") {
      gameplayStarted = false;
      document.getElementById("stage").style.display = "none";
      hideStageTimer();
      hardCloseModalOverlay();
      pendingLockedPart = null;

      showWelcomeOverlay();

      if (playerJoined) {
        setWelcomeView({
          title: "Esperando al admin",
          hint: "El juego iniciará cuando el admin presione Iniciar juego.",
          showJoinForm: true,
          joinEnabled: false,
          buttonText: "Esperando...",
          statusText: "Registrado. Espera el inicio.",
          statusKind: "info",
        });
      } else if (
        gameControlState.status === "lobby" &&
        gameControlState.joinOpen
      ) {
        setWelcomeView({
          title: "Esperando a jugadores",
          hint: "Ingresa tu nombre para unirte.",
          showJoinForm: true,
          joinEnabled: true,
          buttonText: "Entrar",
          statusText: "",
          statusKind: "",
        });
      } else {
        setWelcomeView({
          title: "Esperando a jugadores",
          hint: "El admin debe crear el juego para habilitar el registro.",
          showJoinForm: false,
          joinEnabled: false,
          buttonText: "Entrar",
          statusText: "",
          statusKind: "",
        });
      }

      return;
    }

    // Game is running: join is closed.
    if (!playerJoined) {
      document.getElementById("stage").style.display = "none";
      hideStageTimer();
      showWelcomeOverlay();
      setWelcomeView({
        title: "Juego en curso",
        hint: "Ya no se permiten jugadores nuevos.",
        showJoinForm: false,
        joinEnabled: false,
        buttonText: "Entrar",
        statusText: "",
        statusKind: "",
      });
      return;
    }

    startGameplayOnce();
    applyPauseToStage();

    if (!gameEnded) {
      ensureStageTimerRunning();
      updateStageTimerUI();
    }

    const effectiveProblem = getEffectiveProblemForGate();
    let effectivePart = getPartForProblem(effectiveProblem);
    if (typeof pendingLockedPart === "number") {
      effectivePart = Math.max(effectivePart, pendingLockedPart);
    }

    if (gameControlState.paused) {
      showAdminBlockModal(
        "Juego pausado",
        "El admin pausó el juego. Espera a que lo reanuden.",
      );
      return;
    }

    if (effectivePart > gameControlState.unlockedPart) {
      showAdminBlockModal(
        "Esperando al admin",
        `Para continuar, el admin debe habilitar ${getPartLabel(effectivePart)}.`,
      );
      return;
    }
    pendingLockedPart = null;
    hideAdminBlockModalIfOpen();
  } catch (_err) {
    // If server is unreachable, don't hard-block the local UI.
  }
}

runRoundBtn.addEventListener("click", runCurrentRound);
runScenarioBtn.addEventListener("click", runScenarioRound);
modalCloseBtn.addEventListener("click", closeModal);
answerYesBtnValidation.addEventListener("click", () =>
  handleValidationAnswer(true),
);
answerNoBtnValidation.addEventListener("click", () =>
  handleValidationAnswer(false),
);
window.addEventListener("resize", syncCanvasResolution);

function resetGame() {
  gameState.totalSpend = 0;
  gameState.solved = 0;
  gameState.solvedFirstTry = 0;
  gameState.roundIndex = 0;
  gameState.activeBlockIds = ["base"];
  gameState.latestRun = null;
  gameState.currentProblemSolved = false;
  gameState.hasFailedCurrentProblem = false;
  gameState.disabledBlockIds = [];
  gameState.selectedScenarioIndex = null;
  gameState.disabledScenarioIndices = [];
  updateUI();
}

function goToNextProblem() {
  if (gameState.roundIndex < PROBLEMS.length - 1) {
    gameState.roundIndex += 1;
    resetPerProblemState();
  }
  updateUI();

  // Snapshot after advancing so the admin sees progress in real time.
  void submitAttempt();
}

function showModal(success, problem, actualOutput, cost) {
  const modalContent = document.querySelector(".modal-content");
  modalCloseBtn.disabled = false;
  if (modalOverlay.dataset && modalOverlay.dataset.kind) {
    delete modalOverlay.dataset.kind;
  }

  if (success) {
    modalContent.className = "modal-content modal-success";
    modalTitle.textContent = "¡Éxito!";
    modalMessage.textContent = `Has construido la arquitectura correcta para resolver el ticket de ${problem.priority}.`;
    modalDetails.innerHTML = `
      <p><strong>Esperado:</strong> ${problem.expectedOutput}</p>
      <p><strong>Generado:</strong> ${actualOutput}</p>
      <p><strong>Costo de esta ejecución:</strong> ${cost} cr</p>
    `;
    modalCloseBtn.textContent =
      gameState.roundIndex < PROBLEMS.length - 1
        ? "Siguiente Ticket"
        : "Finalizar";
  } else {
    modalContent.className = "modal-content modal-failure";
    modalTitle.textContent = "Fallo";
    modalMessage.textContent = `La arquitectura no pudo recuperar la información correcta. Intenta agregar o quitar bloques de memoria.`;
    modalDetails.innerHTML = `
      <p><strong>Esperado:</strong> ${problem.expectedOutput}</p>
      <p><strong>Generado:</strong> ${actualOutput}</p>
      <p><strong>Costo de esta ejecución:</strong> ${cost} cr</p>
    `;
    modalCloseBtn.textContent = "Reintentar";
  }

  modalOverlay.style.display = "flex";
}

function showWarningModal() {
  const modalContent = document.querySelector(".modal-content");
  modalCloseBtn.disabled = false;
  if (modalOverlay.dataset && modalOverlay.dataset.kind) {
    delete modalOverlay.dataset.kind;
  }
  modalContent.className = "modal-content modal-failure";
  modalTitle.textContent = "Atención";
  modalMessage.textContent =
    "Debes seleccionar al menos un bloque de memoria adicional del Memory Toolbox antes de ejecutar.";
  modalDetails.innerHTML = `
    <p>El modelo base (Parametric) solo no es suficiente para resolver los tickets.</p>
    <p>Haz clic en los bloques de memoria disponibles en el panel izquierdo.</p>
  `;
  modalCloseBtn.textContent = "Entendido";
  modalOverlay.style.display = "flex";
}

function closeModal() {
  if (modalOverlay.dataset.kind === "admin-block") {
    void refreshGameControl();
    return;
  }

  if (gameControlState.paused) {
    showAdminBlockModal(
      "Juego pausado",
      "El admin pausó el juego. Espera a que lo reanuden.",
    );
    return;
  }

  // Block advancing to locked parts.
  if (
    gameState.currentProblemSolved &&
    gameState.roundIndex < PROBLEMS.length - 1
  ) {
    const nextProblem = PROBLEMS[gameState.roundIndex + 1];
    const nextPart = getPartForProblem(nextProblem);
    if (nextPart > gameControlState.unlockedPart) {
      pendingLockedPart = nextPart;

      // Move immediately to the next stage start so when the admin unlocks it,
      // the player can continue without another click.
      moveToPartStart(nextPart);

      showAdminBlockModal(
        "Esperando al admin",
        `Para continuar, el admin debe habilitar ${getPartLabel(nextPart)}.`,
      );
      return;
    }
  }

  modalOverlay.style.display = "none";

  if (gameState.currentProblemSolved) {
    if (gameState.roundIndex < PROBLEMS.length - 1) {
      goToNextProblem();
    } else {
      // Juego terminado - mostrar pantalla final
      showFinalScreen();
    }
  }
}

async function showFinalScreen() {
  // Enviar datos al servidor
  await submitAttempt();

  gameEnded = true;

  if (stageTimerIntervalId) {
    window.clearInterval(stageTimerIntervalId);
    stageTimerIntervalId = null;
  }
  hideStageTimer();

  if (progressHeartbeatId) {
    window.clearInterval(progressHeartbeatId);
    progressHeartbeatId = null;
  }

  // Ocultar todo el stage
  stageEl.style.display = "none";

  // Crear y mostrar la pantalla final
  const finalScreen = document.createElement("div");
  finalScreen.id = "final-screen";
  finalScreen.innerHTML = `
    <div style="text-align: center; padding: 40px;">
      <h1 style="font-family: var(--font-accent); font-size: 4rem; color: var(--marker-green); margin-bottom: 20px;">
        ¡Gracias por participar${currentPlayer ? ", " + currentPlayer.username : ""}!
      </h1>

      <p style="font-family: var(--font-hand); font-size: 1.5rem; color: var(--marker-blue); margin-bottom: 40px;">
        Has completado el Memory Architect Challenge
      </p>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; max-width: 700px; margin: 0 auto 40px;">
        <div class="final-stat-card" style="background: var(--sticky-yellow); padding: 30px; border: 3px solid #333; border-radius: 15px 5px 15px 5px / 5px 15px 5px 15px; box-shadow: 8px 8px 0 rgba(0,0,0,0.2); transform: rotate(-2deg);">
          <div style="font-family: var(--font-hand); font-size: 1.2rem; color: var(--ink); margin-bottom: 10px;">Total de Tokens</div>
          <div style="font-family: var(--font-accent); font-size: 3.5rem; color: var(--marker-red); font-weight: bold;">${gameState.totalSpend}</div>
          <div style="font-family: var(--font-main); font-size: 1.1rem; color: var(--ink);">créditos</div>
        </div>

        <div class="final-stat-card" style="background: var(--sticky-blue); padding: 30px; border: 3px solid #333; border-radius: 5px 15px 5px 15px / 15px 5px 15px 5px; box-shadow: 8px 8px 0 rgba(0,0,0,0.2); transform: rotate(2deg);">
          <div style="font-family: var(--font-hand); font-size: 1.2rem; color: var(--ink); margin-bottom: 10px;">A la Primera</div>
          <div style="font-family: var(--font-accent); font-size: 3.5rem; color: var(--marker-green); font-weight: bold;">${gameState.solvedFirstTry}/${PROBLEMS.length}</div>
          <div style="font-family: var(--font-main); font-size: 1.1rem; color: var(--ink);">sin fallar</div>
        </div>
      </div>

      <div style="background: var(--sticky-pink); padding: 25px; border: 3px solid #333; border-radius: 10px; max-width: 600px; margin: 0 auto; box-shadow: 6px 6px 0 rgba(0,0,0,0.15);">
        <p style="font-family: var(--font-main); font-size: 1.2rem; line-height: 1.6; margin: 0;">
          Has explorado diferentes tipos de memoria en sistemas de IA:
          <strong style="color: var(--marker-blue);">Episodic, Procedural, External y Semantic</strong>.
          Cada una tiene su propósito específico en la arquitectura de modelos inteligentes.
        </p>
      </div>
    </div>
  `;

  document.getElementById("game-container").appendChild(finalScreen);
}

function selectScenarioOption(selectedIndex) {
  // Solo permitir seleccionar si no está deshabilitada
  if (gameState.disabledScenarioIndices.includes(selectedIndex)) {
    return;
  }

  // Si ya estaba seleccionada, deseleccionar
  if (gameState.selectedScenarioIndex === selectedIndex) {
    gameState.selectedScenarioIndex = null;
  } else {
    gameState.selectedScenarioIndex = selectedIndex;
  }

  updateUI();
}

function runScenarioRound() {
  const problem = PROBLEMS[gameState.roundIndex];

  // Verificar que haya seleccionado una opción
  if (gameState.selectedScenarioIndex === null) {
    showWarningModal();
    return;
  }

  const selectedOption = problem.options[gameState.selectedScenarioIndex];

  // Calcular costo (similar a la primera modalidad)
  const inferenceCost = 20;
  gameState.totalSpend += inferenceCost;

  if (selectedOption.isCorrect) {
    // Acierta: avanza al siguiente
    gameState.solved += 1;
    gameState.currentProblemSolved = true;

    // Si no había fallado antes, cuenta como resuelto a la primera
    if (!gameState.hasFailedCurrentProblem) {
      gameState.solvedFirstTry += 1;
    }

    showScenarioResultModal(true, problem, selectedOption.text, inferenceCost);
  } else {
    // Falla: deshabilita la opción y debe reintentar
    gameState.currentProblemSolved = false;
    gameState.hasFailedCurrentProblem = true;

    // Deshabilitar la opción incorrecta
    if (
      !gameState.disabledScenarioIndices.includes(
        gameState.selectedScenarioIndex,
      )
    ) {
      gameState.disabledScenarioIndices.push(gameState.selectedScenarioIndex);
    }

    // Deseleccionar
    gameState.selectedScenarioIndex = null;

    showScenarioResultModal(false, problem, selectedOption.text, inferenceCost);
  }

  updateUI();
}

function showScenarioResultModal(success, problem, selectedText, cost) {
  const modalContent = document.querySelector(".modal-content");
  modalCloseBtn.disabled = false;
  if (modalOverlay.dataset && modalOverlay.dataset.kind) {
    delete modalOverlay.dataset.kind;
  }

  if (success) {
    modalContent.className = "modal-content modal-success";
    modalTitle.textContent = "¡Correcto!";
    modalMessage.textContent =
      "Has identificado correctamente el escenario que puede resolverse con esta arquitectura.";
    modalDetails.innerHTML = `
      <p><strong>Tu selección:</strong> ${selectedText}</p>
      <p><strong>Explicación:</strong> ${problem.explanation}</p>
      <p><strong>Tokens gastados:</strong> ${cost} cr</p>
    `;
    modalCloseBtn.textContent =
      gameState.roundIndex < PROBLEMS.length - 1
        ? "Siguiente Ticket"
        : "Finalizar";
  } else {
    modalContent.className = "modal-content modal-failure";
    modalTitle.textContent = "Incorrecto";
    modalMessage.textContent =
      "Esta arquitectura no es la más adecuada para el escenario seleccionado. Intenta con otra opción.";
    modalDetails.innerHTML = `
      <p><strong>Tu selección:</strong> ${selectedText}</p>
      <p><strong>Tokens gastados:</strong> ${cost} cr</p>
    `;
    modalCloseBtn.textContent = "Reintentar";
  }

  modalOverlay.style.display = "flex";
}

function handleValidationAnswer(userAnsweredYes) {
  const problem = PROBLEMS[gameState.roundIndex];

  // Verificar si la respuesta es correcta
  const isCorrect = userAnsweredYes === problem.correctAnswer;

  if (isCorrect) {
    // Acierta: no gasta tokens
    gameState.solved += 1;
    gameState.currentProblemSolved = true;

    // Si no había fallado antes, cuenta como resuelto a la primera
    if (!gameState.hasFailedCurrentProblem) {
      gameState.solvedFirstTry += 1;
    }

    showValidationResultModal(true, problem, 0);
  } else {
    // Falla: gasta 100 tokens y avanza automáticamente
    gameState.totalSpend += 100;
    gameState.currentProblemSolved = true; // Aún así avanza
    gameState.hasFailedCurrentProblem = true;
    showValidationResultModal(false, problem, 100);
  }

  updateUI();
}

function showValidationResultModal(success, problem, cost) {
  const modalContent = document.querySelector(".modal-content");
  modalCloseBtn.disabled = false;
  if (modalOverlay.dataset && modalOverlay.dataset.kind) {
    delete modalOverlay.dataset.kind;
  }

  if (success) {
    modalContent.className = "modal-content modal-success";
    modalTitle.textContent = "¡Correcto!";
    modalMessage.textContent =
      "Has evaluado correctamente la selección de memoria.";
    modalDetails.innerHTML = `
      <p><strong>Explicación:</strong> ${problem.explanation}</p>
      <p><strong>Tokens gastados:</strong> ${cost} cr</p>
    `;
  } else {
    modalContent.className = "modal-content modal-failure";
    modalTitle.textContent = "Incorrecto";
    modalMessage.textContent = "La evaluación no fue correcta.";
    modalDetails.innerHTML = `
      <p><strong>Explicación:</strong> ${problem.explanation}</p>
      <p><strong>Tokens gastados:</strong> ${cost} cr</p>
    `;
  }

  modalCloseBtn.textContent =
    gameState.roundIndex < PROBLEMS.length - 1
      ? "Siguiente Ticket"
      : "Finalizar";
  modalOverlay.style.display = "flex";
}

function runCurrentRound() {
  const problem = PROBLEMS[gameState.roundIndex];

  // Verificar que haya seleccionado al menos un bloque adicional (no solo base)
  if (
    gameState.activeBlockIds.length === 1 &&
    gameState.activeBlockIds[0] === "base"
  ) {
    showWarningModal();
    return;
  }

  // Calcular coste del build actual
  let currentBuildCost = 0;
  gameState.activeBlockIds.forEach((id) => {
    const block = MEMORY_BLOCKS.find((b) => b.id === id);
    currentBuildCost += block.cost;
  });

  // Coste de inferencia (basado en la complejidad del problema)
  const inferenceCost = 20;
  const totalCost = currentBuildCost + inferenceCost;

  // Siempre gastar tokens
  gameState.totalSpend += totalCost;

  // Lógica de éxito: DEBE tener el bloque necesario para la prioridad del problema
  const hasRequiredMemory = gameState.activeBlockIds.some((id) => {
    const b = MEMORY_BLOCKS.find((block) => block.id === id);
    return b.problemMatch === problem.priority;
  });

  // Éxito determinístico: solo si tiene el bloque correcto
  const success = hasRequiredMemory;

  // Calcular métricas para visualización
  let successProb = 0.4; // Base Model
  gameState.activeBlockIds.forEach((id) => {
    const b = MEMORY_BLOCKS.find((block) => block.id === id);
    if (!b.mandatory) successProb += 0.1;
    if (b.problemMatch === problem.priority) successProb += 0.4;
  });

  const actualOutput = success
    ? problem.expectedOutput
    : "Lo siento, no tengo esa información.";

  gameState.latestRun = {
    expected: problem.expectedOutput,
    actual: actualOutput,
    success,
    metrics: {
      quality: Math.min(100, Math.round(successProb * 100)),
      memory: Math.round(
        (gameState.activeBlockIds.length / MEMORY_BLOCKS.length) * 100,
      ),
    },
  };

  if (success) {
    gameState.solved += 1;
    gameState.currentProblemSolved = true;

    // Si no había fallado antes, cuenta como resuelto a la primera
    if (!gameState.hasFailedCurrentProblem) {
      gameState.solvedFirstTry += 1;
    }
  } else {
    gameState.currentProblemSolved = false;
    gameState.hasFailedCurrentProblem = true;

    // Deshabilitar el bloque incorrecto que se intentó usar
    const incorrectBlock = gameState.activeBlockIds.find((id) => id !== "base");
    if (
      incorrectBlock &&
      !gameState.disabledBlockIds.includes(incorrectBlock)
    ) {
      gameState.disabledBlockIds.push(incorrectBlock);
    }

    // Deseleccionar el bloque incorrecto
    gameState.activeBlockIds = ["base"];
  }

  updateUI();
  showModal(success, problem, actualOutput, totalCost);
}

function renderToolbox() {
  infraCardsEl.innerHTML = "";

  MEMORY_BLOCKS.forEach((block) => {
    const isActive = gameState.activeBlockIds.includes(block.id);
    const isDisabled = gameState.disabledBlockIds.includes(block.id);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `infra-btn ${isActive ? "selected" : ""}`;
    btn.style.borderLeft = `8px solid ${block.color}`;

    // Si está deshabilitado, aplicar estilo visual
    if (isDisabled) {
      btn.style.opacity = "0.4";
      btn.style.cursor = "not-allowed";
    }

    btn.innerHTML = `
      <div style="font-weight: bold;">${block.name}</div>
      <div style="font-size: 0.8rem; opacity: 0.7;">${block.description}</div>
      <div style="margin-top: 5px; font-weight: bold;">Cost: ${block.cost} cr</div>
      ${isDisabled ? '<div style="color: var(--marker-red); margin-top: 5px; font-size: 0.8rem;">✗ Incorrecto</div>' : ""}
    `;

    btn.disabled = block.mandatory || isDisabled;

    btn.addEventListener("click", () => {
      if (isActive) {
        // Deseleccionar el bloque actual
        gameState.activeBlockIds = gameState.activeBlockIds.filter(
          (id) => id !== block.id,
        );
      } else {
        // Deseleccionar todos los bloques excepto 'base', luego agregar el nuevo
        gameState.activeBlockIds = ["base", block.id];
      }
      updateUI();
    });

    infraCardsEl.appendChild(btn);
  });
}

// --- CANVAS DRAWING ---

function roughLine(x1, y1, x2, y2, color = "#333", width = 2) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  const segments = 10;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const nx = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 2;
    const ny = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 2;
    ctx.lineTo(nx, ny);
  }
  ctx.stroke();
  ctx.restore();
}

function roughCircle(cx, cy, r, fill = "transparent", stroke = "#333") {
  ctx.save();
  if (fill !== "transparent") {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  const segments = 20;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const jitter = (Math.random() - 0.5) * 3;
    const px = cx + (r + jitter) * Math.cos(angle);
    const py = cy + (r + jitter) * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

function drawNode(x, y, r, label, color) {
  roughCircle(x, y, r, color, "#1e293b");
  ctx.save();
  ctx.fillStyle = "#1e293b";
  ctx.font = "bold 13px 'Gochi Hand'";
  ctx.textAlign = "center";
  ctx.fillText(label, x, y + 5);
  ctx.restore();
}

function drawBoard() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  ctx.clearRect(0, 0, w, h);

  const midY = h / 2;
  const leftX = 100;
  const rightX = w - 100;
  const centerX = w / 2;

  // Nodo Central - GEMMA
  drawNode(centerX, midY, 65, "GEMMA", "#dcfce7");

  // Nodo Input y Output siempre presentes
  drawNode(leftX, midY, 40, "USER", "#dbeafe");
  drawNode(rightX, midY, 40, "OUTPUT", "#fee2e2");

  // Conexión básica
  roughLine(leftX + 40, midY, centerX - 65, midY);
  roughLine(centerX + 65, midY, rightX - 40, midY);

  // BLOQUES ADICIONALES
  if (gameState.activeBlockIds.includes("episodic")) {
    const ey = midY + 120;
    drawNode(centerX, ey, 50, "HISTORY", "#fef3c7");
    roughLine(rightX, midY + 40, centerX + 40, ey);
    roughLine(centerX - 40, ey, leftX, midY + 40);
  }

  if (gameState.activeBlockIds.includes("procedural")) {
    const py = midY - 120;
    drawNode(centerX, py, 50, "POLICIES", "#e0f2fe");
    roughLine(centerX, py + 50, centerX, midY - 65);
  }

  if (gameState.activeBlockIds.includes("external")) {
    const ex = centerX - 180;
    const ey = midY - 100;
    drawNode(ex, ey, 50, "VECTOR DB", "#f3e8ff");
    roughLine(leftX + 20, midY - 40, ex, ey + 40);
    roughLine(ex + 40, ey, centerX - 40, midY - 50);
  }

  if (gameState.activeBlockIds.includes("semantic")) {
    const ex = centerX + 180;
    const ey = midY - 100;
    drawNode(ex, ey, 50, "K-GRAPH", "#fff7ed");
    roughLine(centerX + 40, midY - 50, ex - 40, ey);
    roughLine(ex, ey + 50, rightX - 20, midY - 40);
  }
}

function syncCanvasResolution() {
  const ratio = window.devicePixelRatio || 1;
  const targetWidth = canvas.clientWidth;
  const targetHeight = 500;
  canvas.width = Math.round(targetWidth * ratio);
  canvas.height = Math.round(targetHeight * ratio);
  canvas.style.height = `${targetHeight}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  drawBoard();
}

function drawScenarioBoard(problem) {
  const w = 900;
  const h = 280;
  scenarioCtx.clearRect(0, 0, w, h);

  const midY = h / 2;
  const leftX = 100;
  const rightX = w - 100;
  const centerX = w / 2;

  // Nodo Central - GEMMA
  drawNodeOnCanvas(scenarioCtx, centerX, midY, 55, "GEMMA", "#dcfce7");

  // Nodo Input y Output
  drawNodeOnCanvas(scenarioCtx, leftX, midY, 30, "USER", "#dbeafe");
  drawNodeOnCanvas(scenarioCtx, rightX, midY, 30, "OUTPUT", "#fee2e2");

  // Conexión básica
  roughLineOnCanvas(scenarioCtx, leftX + 30, midY, centerX - 55, midY);
  roughLineOnCanvas(scenarioCtx, centerX + 55, midY, rightX - 30, midY);

  // Dibujar el bloque de memoria según el tipo
  const memoryType = problem.memoryType;

  if (memoryType === "Episodic") {
    const ey = midY + 90;
    drawNodeOnCanvas(scenarioCtx, centerX, ey, 40, "HISTORY", "#fef3c7");
    roughLineOnCanvas(
      scenarioCtx,
      rightX - 10,
      midY + 30,
      centerX + 30,
      ey - 10,
    );
    roughLineOnCanvas(
      scenarioCtx,
      centerX - 30,
      ey - 10,
      leftX + 10,
      midY + 30,
    );
  } else if (memoryType === "Procedural") {
    const py = midY - 90;
    drawNodeOnCanvas(scenarioCtx, centerX, py, 40, "POLICIES", "#e0f2fe");
    roughLineOnCanvas(scenarioCtx, centerX, py + 40, centerX, midY - 55);
  } else if (memoryType === "External") {
    const ex = centerX - 160;
    const ey = midY - 70;
    drawNodeOnCanvas(scenarioCtx, ex, ey, 40, "VECTOR DB", "#f3e8ff");
    roughLineOnCanvas(scenarioCtx, leftX + 20, midY - 25, ex + 10, ey + 30);
    roughLineOnCanvas(scenarioCtx, ex + 35, ey + 10, centerX - 40, midY - 35);
  } else if (memoryType === "Semantic") {
    const ex = centerX + 160;
    const ey = midY - 70;
    drawNodeOnCanvas(scenarioCtx, ex, ey, 40, "K-GRAPH", "#fff7ed");
    roughLineOnCanvas(scenarioCtx, centerX + 40, midY - 35, ex - 35, ey + 10);
    roughLineOnCanvas(scenarioCtx, ex - 10, ey + 30, rightX - 20, midY - 25);
  }
}

function renderScenarioOptions(problem) {
  scenarioOptionsDiv.innerHTML = "";

  problem.options.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    const isSelected = gameState.selectedScenarioIndex === index;
    const isDisabled = gameState.disabledScenarioIndices.includes(index);

    btn.className = `scenario-option-btn ${isSelected ? "selected" : ""} ${isDisabled ? "disabled-incorrect" : ""}`;
    btn.textContent = option.text;
    btn.disabled = isDisabled;

    btn.addEventListener("click", () => selectScenarioOption(index));
    scenarioOptionsDiv.appendChild(btn);
  });
}

function drawValidationBoard(problem) {
  const w = validationCanvas.clientWidth;
  const h = 600;
  validationCtx.clearRect(0, 0, w, h);

  const midY = h / 2;
  const leftX = 80;
  const rightX = w - 80;
  const centerX = w / 2;

  // Nodo Central - GEMMA
  drawNodeOnCanvas(validationCtx, centerX, midY, 65, "GEMMA", "#dcfce7");

  // Nodo Input y Output
  drawNodeOnCanvas(validationCtx, leftX, midY, 40, "USER", "#dbeafe");
  drawNodeOnCanvas(validationCtx, rightX, midY, 40, "OUTPUT", "#fee2e2");

  // Conexión básica
  roughLineOnCanvas(validationCtx, leftX + 40, midY, centerX - 65, midY);
  roughLineOnCanvas(validationCtx, centerX + 65, midY, rightX - 40, midY);

  // Dibujar el bloque de memoria escogido
  const chosenMemory = problem.chosenMemory;

  if (chosenMemory.includes("Episodic")) {
    const ey = midY + 120;
    drawNodeOnCanvas(validationCtx, centerX, ey, 50, "HISTORY", "#fef3c7");
    roughLineOnCanvas(validationCtx, rightX, midY + 40, centerX + 40, ey);
    roughLineOnCanvas(validationCtx, centerX - 40, ey, leftX, midY + 40);
  } else if (chosenMemory.includes("Procedural")) {
    const py = midY - 120;
    drawNodeOnCanvas(validationCtx, centerX, py, 50, "POLICIES", "#e0f2fe");
    roughLineOnCanvas(validationCtx, centerX, py + 50, centerX, midY - 65);
  } else if (
    chosenMemory.includes("External") ||
    chosenMemory.includes("RAG")
  ) {
    const ex = centerX - 180;
    const ey = midY - 100;
    drawNodeOnCanvas(validationCtx, ex, ey, 50, "VECTOR DB", "#f3e8ff");
    roughLineOnCanvas(validationCtx, leftX + 20, midY - 40, ex, ey + 40);
    roughLineOnCanvas(validationCtx, ex + 40, ey, centerX - 40, midY - 50);
  } else if (chosenMemory.includes("Semantic")) {
    const ex = centerX + 180;
    const ey = midY - 100;
    drawNodeOnCanvas(validationCtx, ex, ey, 50, "K-GRAPH", "#fff7ed");
    roughLineOnCanvas(validationCtx, centerX + 40, midY - 50, ex - 40, ey);
    roughLineOnCanvas(validationCtx, ex, ey + 50, rightX - 20, midY - 40);
  }
}

function roughLineOnCanvas(context, x1, y1, x2, y2, color = "#333", width = 2) {
  context.save();
  context.strokeStyle = color;
  context.lineWidth = width;
  context.lineCap = "round";
  const segments = 10;
  context.beginPath();
  context.moveTo(x1, y1);
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const nx = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 2;
    const ny = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 2;
    context.lineTo(nx, ny);
  }
  context.stroke();
  context.restore();
}

function drawNodeOnCanvas(context, x, y, r, label, color) {
  context.save();
  if (color !== "transparent") {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, r, 0, Math.PI * 2);
    context.fill();
  }
  context.strokeStyle = "#1e293b";
  context.lineWidth = 2.5;
  context.beginPath();
  const segments = 20;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const jitter = (Math.random() - 0.5) * 3;
    const px = x + (r + jitter) * Math.cos(angle);
    const py = y + (r + jitter) * Math.sin(angle);
    if (i === 0) context.moveTo(px, py);
    else context.lineTo(px, py);
  }
  context.stroke();

  context.fillStyle = "#1e293b";
  context.font = "bold 13px 'Gochi Hand'";
  context.textAlign = "center";
  context.fillText(label, x, y + 5);
  context.restore();
}

function updateUI() {
  spendValueEl.textContent = String(gameState.totalSpend);
  spendValueValidation.textContent = String(gameState.totalSpend);
  spendValueScenario.textContent = String(gameState.totalSpend);

  const problem = PROBLEMS[gameState.roundIndex];

  // Ocultar todos los paneles primero
  const architectureElements = document.querySelectorAll(".architecture-only");
  const validationElements = document.querySelectorAll(".validation-only");
  const scenarioElements = document.querySelectorAll(".scenario-only");

  architectureElements.forEach((el) => (el.style.display = "none"));
  validationElements.forEach((el) => (el.style.display = "none"));
  scenarioElements.forEach((el) => (el.style.display = "none"));

  // Mostrar UI según el tipo de ticket
  if (problem.type === "scenario-selection") {
    // Cambiar layout a modo scenario
    stageEl.className = "scenario-mode";
    scenarioSelectionPanel.style.display = "block";

    ticketProblemTitleScenario.innerHTML = `
      <div style="color: var(--marker-red); font-family: var(--font-hand); font-size: 0.95rem;">Ticket #${problem.id}</div>
      <div style="font-size: 1.5rem; font-family: var(--font-accent); color: var(--marker-blue); margin-top: 5px;">${problem.title}</div>
    `;

    // Dibujar el grafo y renderizar opciones
    drawScenarioBoard(problem);
    renderScenarioOptions(problem);
  } else if (problem.type === "validation") {
    // Cambiar layout a modo validation
    stageEl.className = "validation-mode";
    validationLeftPanel.style.display = "block";
    validationRightPanel.style.display = "block";

    ticketProblemTitleValidation.innerHTML = `
      <div style="color: var(--marker-red); font-family: var(--font-hand); font-size: 1.1rem;">Ticket #${problem.id} [Validation]</div>
      <div style="font-size: 1.3rem; font-family: var(--font-accent);">${problem.title}</div>
    `;
    customerMessageValidation.textContent = problem.scenario;
    chosenMemoryElValidation.textContent = problem.chosenMemory;

    // Dibujar el grafo de validación
    drawValidationBoard(problem);
  } else {
    // Modo architecture (original)
    stageEl.className = "";
    architectureElements.forEach((el) => (el.style.display = "block"));

    ticketProblemTitleEl.innerHTML = `
      <div style="color: var(--marker-red); font-family: var(--font-hand); font-size: 1.1rem;">Ticket #${problem.id}</div>
      <div style="font-size: 1.3rem; font-family: var(--font-accent);">${problem.title}</div>
    `;
    customerMessageEl.textContent = problem.details + " -> " + problem.question;
  }

  // Solo actualizar stats si es tipo architecture
  if (problem.type === "architecture") {
    if (gameState.latestRun) {
      expectedOutputEl.textContent = gameState.latestRun.expected;
      actualOutputEl.textContent = gameState.latestRun.actual;
      roundStatusEl.textContent = gameState.latestRun.success
        ? "MATCH"
        : "FAIL";
      roundStatusEl.className = gameState.latestRun.success ? "ok" : "fail";
      scoreQualityEl.style.width = `${gameState.latestRun.metrics.quality}%`;
      scoreMemoryEl.style.width = `${gameState.latestRun.metrics.memory}%`;
    } else {
      expectedOutputEl.textContent = "-";
      actualOutputEl.textContent = "-";
      roundStatusEl.textContent = "Waiting...";
      scoreQualityEl.style.width = "0%";
      scoreMemoryEl.style.width = "0%";
    }

    renderToolbox();
    drawBoard();
  }
}

// ========== REGISTRATION ==========
const welcomeOverlay = document.getElementById("welcome-overlay");
const welcomeTitleEl = document.getElementById("welcome-title");
const welcomeHintEl = document.getElementById("welcome-hint");
const welcomeFormEl = document.getElementById("welcome-form");
const welcomeActionsEl = document.getElementById("welcome-actions");
const registerNameInput = document.getElementById("register-name");
const startGameBtn = document.getElementById("start-game");
const welcomeStatus = document.getElementById("welcome-status");

let currentPlayer = null;
let progressHeartbeatId = null;
let submitInFlight = false;
let playerJoined = false;
let gameplayStarted = false;

startGameBtn.addEventListener("click", handleStartGame);

function setWelcomeView({
  title,
  hint,
  showJoinForm,
  joinEnabled,
  buttonText,
  statusText,
  statusKind,
}) {
  if (welcomeTitleEl) welcomeTitleEl.textContent = title;
  if (welcomeHintEl) welcomeHintEl.textContent = hint;

  if (welcomeFormEl) welcomeFormEl.style.display = showJoinForm ? "" : "none";
  if (welcomeActionsEl)
    welcomeActionsEl.style.display = showJoinForm ? "" : "none";

  registerNameInput.disabled = !joinEnabled;
  startGameBtn.disabled = !joinEnabled;
  startGameBtn.textContent = buttonText;

  if (statusText) {
    welcomeStatus.textContent = statusText;
    welcomeStatus.className = `status-pill ${statusKind || ""}`.trim();
    welcomeStatus.style.display = "block";
  } else {
    welcomeStatus.textContent = "";
    welcomeStatus.className = "status-pill";
    welcomeStatus.style.display = "none";
  }
}

function showWelcomeOverlay() {
  welcomeOverlay.style.display = "flex";
}

function hideWelcomeOverlay() {
  welcomeOverlay.style.display = "none";
}

function startGameplayOnce() {
  if (!currentPlayer) return;
  if (gameplayStarted) return;

  gameplayStarted = true;
  gameEnded = false;

  hideWelcomeOverlay();
  document.getElementById("stage").style.display = "grid";

  resetGame();
  syncCanvasResolution();

  ensureStageTimerRunning();
  updateStageTimerUI();

  void submitAttempt();
  if (progressHeartbeatId) {
    window.clearInterval(progressHeartbeatId);
  }
  progressHeartbeatId = window.setInterval(() => void submitAttempt(), 3000);
}

function handleStartGame() {
  const username = registerNameInput.value.trim();

  if (!username || username.length < 2) {
    showWelcomeStatus("Por favor ingresa un nombre válido", "error");
    return;
  }

  currentPlayer = { username };
  playerJoined = true;

  // After joining, wait for the admin to start the game.
  showWelcomeOverlay();
  document.getElementById("stage").style.display = "none";
  hideStageTimer();

  setWelcomeView({
    title: "Esperando al admin",
    hint: "El juego iniciará cuando el admin presione Iniciar juego.",
    showJoinForm: true,
    joinEnabled: false,
    buttonText: "Esperando...",
    statusText: "Registrado. Espera el inicio.",
    statusKind: "info",
  });

  void refreshGameControl();
}

function showWelcomeStatus(message, type = "info") {
  welcomeStatus.textContent = message;
  welcomeStatus.className = `status-pill ${type}`;
  welcomeStatus.style.display = "block";

  setTimeout(() => {
    welcomeStatus.style.display = "none";
  }, 3000);
}

async function submitAttempt() {
  if (!currentPlayer) return;
  if (gameControlState.paused) return;
  if (submitInFlight) return;

  const effectiveProblem = getEffectiveProblemForGate();
  const effectiveRoundIndex = getEffectiveRoundIndexForGate();
  const stageType =
    effectiveProblem && effectiveProblem.type
      ? effectiveProblem.type
      : "architecture";
  const stagePart = getPartForProblem(effectiveProblem);
  const isFinished =
    gameState.roundIndex >= PROBLEMS.length - 1 &&
    gameState.currentProblemSolved;

  const attemptData = {
    username: currentPlayer.username,
    solved: gameState.solved,
    solvedFirstTry: gameState.solvedFirstTry,
    roundsTotal: PROBLEMS.length,
    stagePart,
    stageType,
    stageIndex: effectiveRoundIndex,
    isFinished,
    totalSpend: gameState.totalSpend,
    budgetRemaining: 0,
    clientTs: new Date().toISOString(),
  };

  try {
    submitInFlight = true;
    const response = await fetch("/api/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(attemptData),
    });

    if (!response.ok) {
      console.error("Failed to submit attempt");
    }
  } catch (error) {
    console.error("Error submitting attempt:", error);
  } finally {
    submitInFlight = false;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  // Iniciar con el overlay visible
  showWelcomeOverlay();
  document.getElementById("stage").style.display = "none";
  hideStageTimer();

  setWelcomeView({
    title: "Esperando a jugadores",
    hint: "El admin debe crear el juego para habilitar el registro.",
    showJoinForm: false,
    joinEnabled: false,
    buttonText: "Entrar",
    statusText: "",
    statusKind: "",
  });

  void refreshGameControl();
  window.setInterval(() => void refreshGameControl(), 2000);
});
