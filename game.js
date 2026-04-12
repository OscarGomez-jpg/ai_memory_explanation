const MODEL_NAME = "Gemma 4:2be Custom";

// BLOQUES DE MEMORIA DISPONIBLES
const MEMORY_BLOCKS = [
  {
    id: "base",
    name: "Parametric",
    description: "Model weights. Pure training data.",
    cost: 0,
    reliability: 0.40,
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
    reliability: 0.20,
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
    reliability: 0.30,
    color: "#fff7ed",
    problemMatch: "Semantic",
  },
];

const PROBLEMS = [
  {
    id: 1,
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
    title: "Políticas de Empresa",
    priority: "Procedural",
    details: "Instrucciones de actuación y protocolos.",
    facts: ["Atlas", "Paula", "23:00"],
    question: "Quien es responsable del hotfix?",
    targetKey: "responsable",
    expectedOutput: "El responsable del hotfix es Paula.",
  },
];

const gameState = {
  totalSpend: 0,
  solved: 0,
  roundIndex: 0,
  activeBlockIds: ["base"],
  latestRun: null,
  currentProblemSolved: false,
  disabledBlockIds: [], // Bloques deshabilitados para el problema actual
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
const resetGameBtn = document.getElementById("reset-game");

const modalOverlay = document.getElementById("result-modal");
const modalTitle = document.getElementById("modal-title");
const modalMessage = document.getElementById("modal-message");
const modalDetails = document.getElementById("modal-details");
const modalCloseBtn = document.getElementById("modal-close-btn");

runRoundBtn.addEventListener("click", runCurrentRound);
resetGameBtn.addEventListener("click", resetGame);
modalCloseBtn.addEventListener("click", closeModal);
window.addEventListener("resize", syncCanvasResolution);

function resetGame() {
  gameState.totalSpend = 0;
  gameState.solved = 0;
  gameState.roundIndex = 0;
  gameState.activeBlockIds = ["base"];
  gameState.latestRun = null;
  gameState.currentProblemSolved = false;
  gameState.disabledBlockIds = [];
  updateUI();
}

function goToNextProblem() {
  if (gameState.roundIndex < PROBLEMS.length - 1) {
    gameState.roundIndex += 1;
    gameState.latestRun = null;
    gameState.activeBlockIds = ["base"];
    gameState.currentProblemSolved = false;
    gameState.disabledBlockIds = []; // Reset bloques deshabilitados para el nuevo problema
  }
  updateUI();
}

function showModal(success, problem, actualOutput, cost) {
  const modalContent = document.querySelector(".modal-content");

  if (success) {
    modalContent.className = "modal-content modal-success";
    modalTitle.textContent = "¡Éxito!";
    modalMessage.textContent = `Has construido la arquitectura correcta para resolver el ticket de ${problem.priority}.`;
    modalDetails.innerHTML = `
      <p><strong>Esperado:</strong> ${problem.expectedOutput}</p>
      <p><strong>Generado:</strong> ${actualOutput}</p>
      <p><strong>Costo de esta ejecución:</strong> ${cost} cr</p>
    `;
    modalCloseBtn.textContent = gameState.roundIndex < PROBLEMS.length - 1 ? "Siguiente Ticket" : "Finalizar";
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
  modalContent.className = "modal-content modal-failure";
  modalTitle.textContent = "Atención";
  modalMessage.textContent = "Debes seleccionar al menos un bloque de memoria adicional del Memory Toolbox antes de ejecutar.";
  modalDetails.innerHTML = `
    <p>El modelo base (Parametric) solo no es suficiente para resolver los tickets.</p>
    <p>Haz clic en los bloques de memoria disponibles en el panel izquierdo.</p>
  `;
  modalCloseBtn.textContent = "Entendido";
  modalOverlay.style.display = "flex";
}

function closeModal() {
  modalOverlay.style.display = "none";

  if (gameState.currentProblemSolved) {
    if (gameState.roundIndex < PROBLEMS.length - 1) {
      goToNextProblem();
    } else {
      // Juego terminado
      alert(`¡Juego completado!\n\nTotal gastado: ${gameState.totalSpend} cr\nTickets resueltos: ${gameState.solved}/${PROBLEMS.length}`);
    }
  }
}

function runCurrentRound() {
  const problem = PROBLEMS[gameState.roundIndex];

  // Verificar que haya seleccionado al menos un bloque adicional (no solo base)
  if (gameState.activeBlockIds.length === 1 && gameState.activeBlockIds[0] === "base") {
    showWarningModal();
    return;
  }

  // Calcular coste del build actual
  let currentBuildCost = 0;
  gameState.activeBlockIds.forEach(id => {
    const block = MEMORY_BLOCKS.find(b => b.id === id);
    currentBuildCost += block.cost;
  });

  // Coste de inferencia (basado en la complejidad del problema)
  const inferenceCost = 20;
  const totalCost = currentBuildCost + inferenceCost;

  // Siempre gastar tokens
  gameState.totalSpend += totalCost;

  // Lógica de éxito: DEBE tener el bloque necesario para la prioridad del problema
  const hasRequiredMemory = gameState.activeBlockIds.some(id => {
    const b = MEMORY_BLOCKS.find(block => block.id === id);
    return b.problemMatch === problem.priority;
  });

  // Éxito determinístico: solo si tiene el bloque correcto
  const success = hasRequiredMemory;

  // Calcular métricas para visualización
  let successProb = 0.4; // Base Model
  gameState.activeBlockIds.forEach(id => {
    const b = MEMORY_BLOCKS.find(block => block.id === id);
    if (!b.mandatory) successProb += 0.1;
    if (b.problemMatch === problem.priority) successProb += 0.4;
  });

  const actualOutput = success ? problem.expectedOutput : "Lo siento, no tengo esa información.";

  gameState.latestRun = {
    expected: problem.expectedOutput,
    actual: actualOutput,
    success,
    metrics: {
        quality: Math.min(100, Math.round(successProb * 100)),
        memory: Math.round((gameState.activeBlockIds.length / MEMORY_BLOCKS.length) * 100)
    }
  };

  if (success) {
    gameState.solved += 1;
    gameState.currentProblemSolved = true;
  } else {
    gameState.currentProblemSolved = false;

    // Deshabilitar el bloque incorrecto que se intentó usar
    const incorrectBlock = gameState.activeBlockIds.find(id => id !== "base");
    if (incorrectBlock && !gameState.disabledBlockIds.includes(incorrectBlock)) {
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
      ${isDisabled ? '<div style="color: var(--marker-red); margin-top: 5px; font-size: 0.8rem;">✗ Incorrecto</div>' : ''}
    `;

    btn.disabled = block.mandatory || isDisabled;

    btn.addEventListener("click", () => {
      if (isActive) {
        // Deseleccionar el bloque actual
        gameState.activeBlockIds = gameState.activeBlockIds.filter(id => id !== block.id);
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
  for(let i=1; i<=segments; i++) {
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
  for(let i=0; i<=segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const jitter = (Math.random() - 0.5) * 3;
    const px = cx + (r + jitter) * Math.cos(angle);
    const py = cy + (r + jitter) * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
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

function updateUI() {
  spendValueEl.textContent = String(gameState.totalSpend);

  const problem = PROBLEMS[gameState.roundIndex];
  ticketProblemTitleEl.innerHTML = `
    <div style="color: var(--marker-red); font-family: var(--font-hand); font-size: 1.1rem;">Ticket #${problem.id} [${problem.priority}]</div>
    <div style="font-size: 1.3rem; font-family: var(--font-accent);">${problem.title}</div>
  `;
  customerMessageEl.textContent = problem.details + " -> " + problem.question;

  if (gameState.latestRun) {
    expectedOutputEl.textContent = gameState.latestRun.expected;
    actualOutputEl.textContent = gameState.latestRun.actual;
    roundStatusEl.textContent = gameState.latestRun.success ? "MATCH" : "FAIL";
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

window.addEventListener("DOMContentLoaded", () => {
  resetGame();
  syncCanvasResolution();
});
