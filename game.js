const MODEL_NAME = "Gemma 4:2be Custom";
const START_BUDGET = 1000;

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
  budget: START_BUDGET,
  totalSpend: 0,
  solved: 0,
  roundIndex: 0,
  activeBlockIds: ["base"],
  latestRun: null,
  gameOver: false,
  logs: [],
};

const canvas = document.getElementById("game-board");
const ctx = canvas.getContext("2d");

const budgetValueEl = document.getElementById("budget-value");
const spendValueEl = document.getElementById("spend-value");
const ticketProblemTitleEl = document.getElementById("ticket-problem-title");
const customerMessageEl = document.getElementById("customer-message");
const scoreQualityEl = document.getElementById("score-quality");
const scoreMemoryEl = document.getElementById("score-memory");
const infraCardsEl = document.getElementById("infra-cards");
const turnLogEl = document.getElementById("turn-log");
const expectedOutputEl = document.getElementById("expected-output");
const actualOutputEl = document.getElementById("actual-output");
const roundStatusEl = document.getElementById("round-status");

const runRoundBtn = document.getElementById("run-round");
const nextProblemBtn = document.getElementById("next-problem");
const resetGameBtn = document.getElementById("reset-game");

runRoundBtn.addEventListener("click", runCurrentRound);
nextProblemBtn.addEventListener("click", goToNextProblem);
resetGameBtn.addEventListener("click", resetGame);
window.addEventListener("resize", syncCanvasResolution);

function resetGame() {
  gameState.budget = START_BUDGET;
  gameState.totalSpend = 0;
  gameState.solved = 0;
  gameState.roundIndex = 0;
  gameState.activeBlockIds = ["base"];
  gameState.latestRun = null;
  gameState.gameOver = false;
  gameState.logs = [];
  addLog("Lab de Memoria reiniciado.");
  updateUI();
}

function addLog(text) {
  gameState.logs.push(text);
  if (gameState.logs.length > 20) gameState.logs.shift();
}

function goToNextProblem() {
  if (gameState.roundIndex < PROBLEMS.length - 1) {
    gameState.roundIndex += 1;
    gameState.latestRun = null;
    gameState.activeBlockIds = ["base"]; // Limpiar para el siguiente
    addLog(`Nuevo ticket: #${gameState.roundIndex + 1}.`);
  } else {
    addLog("Has terminado todos los tickets.");
  }
  updateUI();
}

function runCurrentRound() {
  if (gameState.gameOver) return;

  const problem = PROBLEMS[gameState.roundIndex];
  
  // Calcular coste del build actual
  let currentBuildCost = 0;
  gameState.activeBlockIds.forEach(id => {
    const block = MEMORY_BLOCKS.find(b => b.id === id);
    currentBuildCost += block.cost;
  });

  const totalCost = currentBuildCost + 20; // 20 cr de coste fijo de inferencia

  if (gameState.budget < totalCost) {
    addLog("⚠️ Presupuesto insuficiente para este build.");
    return;
  }

  gameState.budget -= totalCost;
  gameState.totalSpend += totalCost;

  // Lógica de éxito
  let successProb = 0.35; // Probabilidad base (Parametric solo)
  gameState.activeBlockIds.forEach(id => {
    const b = MEMORY_BLOCKS.find(block => block.id === id);
    if (!b.mandatory) successProb += 0.1; // Pequeño bonus por tener cualquier bloque extra
    if (b.problemMatch === problem.priority) successProb += 0.5; // Gran bonus por match de prioridad
  });

  const roll = Math.random();
  const success = roll <= successProb;

  // Determinar si es ÓPTIMO: Tiene el bloque correcto y NO tiene bloques extra innecesarios
  const requiredBlock = MEMORY_BLOCKS.find(b => b.problemMatch === problem.priority);
  const isOptimal = gameState.activeBlockIds.length === 2 && 
                    gameState.activeBlockIds.includes("base") && 
                    gameState.activeBlockIds.includes(requiredBlock.id);

  if (success) {
    gameState.solved += 1;
    
    // SISTEMA DE RECOMPENSAS
    let reward = 100; // Recompensa base
    let message = `✅ Ticket resuelto. +${reward} cr.`;
    
    if (isOptimal) {
      const bonus = 200; // Bono por arquitectura óptima
      reward += bonus;
      message = `🌟 ¡ARQUITECTURA ÓPTIMA! Bono de eficiencia: +${reward} cr.`;
    } else if (gameState.activeBlockIds.length > 2) {
      reward = 50; // Recompensa reducida por over-engineering
      message = `⚠️ Resuelto, pero con sobrecoste (Over-engineering). +${reward} cr.`;
    }
    
    gameState.budget += reward;
    addLog(message);
  } else {
    addLog(`❌ Fallo: El modelo alucinó o no recuperó el dato (${problem.priority}).`);
  }

  gameState.latestRun = {
    expected: problem.expectedOutput,
    actual: success ? problem.expectedOutput : (roll > 0.9 ? "Error de alucinación (Temperature High)." : "No tengo acceso a esa información de memoria."),
    success,
    metrics: {
        quality: Math.min(100, Math.round(successProb * 100)),
        memory: Math.round((gameState.activeBlockIds.length / MEMORY_BLOCKS.length) * 100)
    }
  };

  updateUI();
}

function renderToolbox() {
  infraCardsEl.innerHTML = "";

  MEMORY_BLOCKS.forEach((block) => {
    const isActive = gameState.activeBlockIds.includes(block.id);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `infra-btn ${isActive ? "selected" : ""}`;
    btn.style.borderLeft = `8px solid ${block.color}`;
    
    btn.innerHTML = `
      <div style="font-weight: bold;">${block.name}</div>
      <div style="font-size: 0.8rem; opacity: 0.7;">${block.description}</div>
      <div style="margin-top: 5px; font-weight: bold;">Cost: ${block.cost} cr</div>
    `;

    btn.disabled = block.mandatory;

    btn.addEventListener("click", () => {
      if (isActive) {
        gameState.activeBlockIds = gameState.activeBlockIds.filter(id => id !== block.id);
      } else {
        gameState.activeBlockIds.push(block.id);
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
  budgetValueEl.textContent = String(gameState.budget);
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
  updateLogView();
  drawBoard();
}

function updateLogView() {
  turnLogEl.innerHTML = "";
  gameState.logs.slice().reverse().forEach(entry => {
    const li = document.createElement("li");
    li.textContent = entry;
    turnLogEl.appendChild(li);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  resetGame();
  syncCanvasResolution();
});
