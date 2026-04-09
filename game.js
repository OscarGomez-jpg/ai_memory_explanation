const MODEL_NAME = "gemma4:2be (simulado)";
const START_BUDGET = 1000;

const INFRA_OPTIONS = [
  {
    id: "base",
    letter: "A",
    cssClass: "infra-a",
    name: "Base Model",
    memoryType: "Parametric",
    description: "Weights-only. Pure training knowledge.",
    cost: 0,
    contextSize: 2,
    rag: false,
    reliability: 0.45,
  },
  {
    id: "small",
    letter: "B",
    cssClass: "infra-b",
    name: "Chat History",
    memoryType: "Episodic",
    description: "Stores recent interactions.",
    cost: 40,
    contextSize: 3,
    rag: false,
    reliability: 0.65,
  },
  {
    id: "large",
    letter: "C",
    cssClass: "infra-c",
    name: "Context Window",
    memoryType: "Procedural",
    description: "System instructions & policies.",
    cost: 80,
    contextSize: 5,
    rag: false,
    reliability: 0.80,
  },
  {
    id: "rag",
    letter: "D",
    cssClass: "infra-d",
    name: "Vector RAG",
    memoryType: "External",
    description: "Retrieves from external documents.",
    cost: 150,
    contextSize: 4,
    rag: true,
    reliability: 0.92,
  },
  {
    id: "graph",
    letter: "E",
    cssClass: "infra-e",
    name: "Knowledge Graph",
    memoryType: "Semantic",
    description: "Structured relationships & entities.",
    cost: 250,
    contextSize: 6,
    rag: true,
    reliability: 0.98,
  },
];

const PROBLEMS = [
  {
    id: 1,
    title: "Vuelo de Marta",
    priority: "Episodic",
    details: "Requiere recordar datos de la conversación inmediata.",
    facts: [
      "El cliente se llama Marta.",
      "Su vuelo sale a las 19:30.",
      "El codigo de reserva es Q7A9.",
      "Su asiento es 12B.",
      "La puerta de embarque es C4.",
    ],
    question: "Cual es la puerta de embarque?",
    targetKey: "puerta",
    expectedOutput: "La puerta de embarque es C4.",
  },
  {
    id: 2,
    title: "Documentación Técnica",
    priority: "External",
    details: "Consulta de base de conocimientos masiva.",
    facts: [
      "El usuario reporta error de autenticacion.",
      "El ticket activo es INC-7781.",
      "El entorno afectado es produccion.",
      "La version desplegada es 2.4.1.",
      "El rollback recomendado es 2.3.8.",
    ],
    question: "Que version se recomienda para rollback?",
    targetKey: "rollback",
    expectedOutput: "El rollback recomendado es 2.3.8.",
  },
  {
    id: 3,
    title: "Reserva de Diego",
    priority: "Semantic",
    details: "Relaciones entre entidades y preferencias.",
    facts: [
      "La reserva es para Diego.",
      "Son 4 personas.",
      "La mesa asignada es Terraza-5.",
      "Hay alergia a nueces.",
      "La hora de llegada es 21:15.",
    ],
    question: "Que mesa fue asignada?",
    targetKey: "mesa",
    expectedOutput: "La mesa asignada es Terraza-5.",
  },
  {
    id: 4,
    title: "Políticas de Empresa",
    priority: "Procedural",
    details: "Instrucciones de actuación y protocolos.",
    facts: [
      "El proyecto se llama Atlas.",
      "El sprint termina el viernes.",
      "La API critica es billing-v2.",
      "El responsable del hotfix es Paula.",
      "El despliegue final es a las 23:00.",
    ],
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
  selectedInfraId: INFRA_OPTIONS[0].id,
  latestRun: null,
  gameOver: false,
  logs: [],
};

const canvas = document.getElementById("game-board");
const ctx = canvas.getContext("2d");

const modelNameEl = document.getElementById("model-name");
const totalBudgetValueEl = document.getElementById("total-budget-value");
const spendValueEl = document.getElementById("spend-value");
const budgetValueEl = document.getElementById("budget-value");
const roundValueEl = document.getElementById("round-value");
const scoreValueEl = document.getElementById("score-value");
const ticketProblemTitleEl = document.getElementById("ticket-problem-title");
const customerMessageEl = document.getElementById("customer-message");
const contextWindowValueEl = document.getElementById("context-window-value");
const scoreMemoryEl = document.getElementById("score-memory");
const scoreQualityEl = document.getElementById("score-quality");
const scoreBudgetEl = document.getElementById("score-budget");
const infraCardsEl = document.getElementById("infra-cards");
const turnLogEl = document.getElementById("turn-log");
const expectedOutputEl = document.getElementById("expected-output");
const actualOutputEl = document.getElementById("actual-output");
const roundStatusEl = document.getElementById("round-status");
const levelDescriptionEl = document.getElementById("level-description");

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
  gameState.selectedInfraId = INFRA_OPTIONS[1].id;
  gameState.latestRun = null;
  gameState.gameOver = false;
  gameState.logs = [];
  addLog("Nueva partida iniciada.");
  updateUI();
}

function addLog(text) {
  gameState.logs.push(text);
  if (gameState.logs.length > 40) {
    gameState.logs = gameState.logs.slice(-40);
  }
}

function goToNextProblem() {
  if (gameState.roundIndex < PROBLEMS.length - 1) {
    gameState.roundIndex += 1;
    gameState.latestRun = null;
    addLog(`Pasas al problema ${gameState.roundIndex + 1}.`);
  } else {
    addLog("Ya estas en el ultimo problema.");
  }
  updateUI();
}

function runCurrentRound() {
  if (gameState.gameOver) {
    addLog("Partida finalizada. Reinicia para seguir jugando.");
    updateUI();
    return;
  }

  const problem = PROBLEMS[gameState.roundIndex];
  const infra = getSelectedInfra();

  if (!problem || !infra) {
    return;
  }

  const baseCost = infra.cost;
  const tokenCost = Math.ceil(problem.facts.join(" ").length / 24);
  const totalCost = baseCost + tokenCost;

  gameState.budget -= totalCost;
  gameState.totalSpend += totalCost;
  addLog(
    `Ronda ${gameState.roundIndex + 1}: ${infra.name} cuesta ${totalCost} cr.`,
  );

  if (gameState.budget < 0) {
    gameState.gameOver = true;
    gameState.latestRun = {
      expected: problem.expectedOutput,
      actual: "Sin ejecucion: presupuesto agotado antes de inferir.",
      success: false,
      flow: [
        "IN  >> ticket ingest",
        `$$  >> coste total ${totalCost} cr`,
        "XX  >> presupuesto negativo, run abortado",
      ],
      contextCards: [],
      ltmCards: [],
      infra,
      problem,
    };
    addLog("Te quedaste sin presupuesto. Game over.");
    updateUI();
    return;
  }

  const simulation = simulateInference(problem, infra);
  gameState.latestRun = {
    expected: problem.expectedOutput,
    actual: simulation.output,
    success: simulation.output === problem.expectedOutput,
    flow: simulation.flow,
    contextCards: simulation.contextCards,
    ltmCards: simulation.ltmCards,
    metrics: simulation.metrics,
    totalCost,
    infra,
    problem,
  };

  if (gameState.latestRun.success) {
    gameState.solved += 1;
    addLog("Salida valida: match exacto con el objetivo.");
  } else {
    addLog("Salida no valida: no coincide con el output esperado.");
  }

  if (gameState.roundIndex === PROBLEMS.length - 1) {
    gameState.gameOver = true;
    addLog("Completaste todos los problemas.");
  }

  updateUI();
}

function simulateInference(problem, infra) {
  const context = [];
  const ltm = [];
  const flow = [];

  problem.facts.forEach((fact, idx) => {
    if (context.length >= infra.contextSize) {
      const evicted = context.shift();
      if (infra.rag) {
        ltm.push(evicted);
        flow.push(`-> step ${idx + 1}: ${compress(evicted)} => LTM`);
      } else {
        flow.push(`-> step ${idx + 1}: ${compress(evicted)} => DROP`);
      }
    }
    context.push(fact);
    flow.push(`<< step ${idx + 1}: ${compress(fact)} => CTX`);
  });

  flow.push(`?? pregunta: ${problem.question}`);

  const answerFromContext = context.find(
    (line) => keyFromFact(line) === problem.targetKey,
  );

  if (answerFromContext) {
    flow.push("!! respuesta encontrada en contexto");
    const metrics = buildMetrics(problem, infra, context, ltm, true);
    return {
      output: answerFromContext,
      flow,
      contextCards: context.slice(),
      ltmCards: ltm.slice(),
      metrics,
    };
  }

  if (infra.rag) {
    const fromLtm = ltm.find((line) => keyFromFact(line) === problem.targetKey);
    if (fromLtm) {
      flow.push("@@ RAG recupera dato desde LTM");
      const candidate = maybeCorruptOutput(fromLtm, infra.reliability);
      const metrics = buildMetrics(
        problem,
        infra,
        context,
        ltm,
        candidate === problem.expectedOutput,
      );
      return {
        output: candidate,
        flow,
        contextCards: context.slice(),
        ltmCards: ltm.slice(),
        metrics,
      };
    }
  }

  flow.push("xx sin dato relevante en contexto/LTM");
  const fallback = fallbackOutput(context);
  const metrics = buildMetrics(problem, infra, context, ltm, false);
  return {
    output: fallback,
    flow,
    contextCards: context.slice(),
    ltmCards: ltm.slice(),
    metrics,
  };
}

function buildMetrics(problem, infra, context, ltm, isCorrect) {
  const needed = problem.facts.length;
  const memoryCoverage = Math.min(1, (context.length + ltm.length) / needed);
  const quality = isCorrect
    ? infra.reliability
    : Math.max(0.18, infra.reliability - 0.45);
  const budgetHealth = Math.max(0, gameState.budget / START_BUDGET);

  return {
    memory: Math.round(memoryCoverage * 100),
    quality: Math.round(quality * 100),
    budget: Math.round(budgetHealth * 100),
  };
}

function maybeCorruptOutput(correct, reliability) {
  const checksum = seededChecksum(
    correct + gameState.roundIndex + gameState.budget,
  );
  const normalized = (checksum % 100) / 100;
  if (normalized <= reliability) {
    return correct;
  }
  return correct.replace(/\.$/, "") + " (estimado).";
}

function fallbackOutput(context) {
  if (context.length === 0) {
    return "No tengo contexto suficiente para responder.";
  }
  return `Respuesta tentativa: ${context[context.length - 1]}`;
}

function keyFromFact(fact) {
  const normalized = fact
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (normalized.includes("puerta")) return "puerta";
  if (normalized.includes("rollback")) return "rollback";
  if (normalized.includes("mesa")) return "mesa";
  if (normalized.includes("responsable")) return "responsable";
  return "otro";
}

function seededChecksum(text) {
  let acc = 0;
  for (let i = 0; i < text.length; i += 1) {
    acc = (acc + text.charCodeAt(i) * (i + 3)) % 997;
  }
  return acc;
}

function compress(text) {
  return text.length > 34 ? `${text.slice(0, 31)}...` : text;
}

function getSelectedInfra() {
  return INFRA_OPTIONS.find((item) => item.id === gameState.selectedInfraId);
}

function renderInfraButtons() {
  infraCardsEl.innerHTML = "";

  INFRA_OPTIONS.forEach((infra) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `${infra.cssClass} infra-btn${gameState.selectedInfraId === infra.id ? " selected" : ""}`;
    
    btn.innerHTML = `
      <div style="font-family: var(--font-accent); font-size: 1.1rem; color: var(--marker-blue);">${infra.memoryType} Memory</div>
      <div style="font-weight: bold; font-size: 1.3rem; margin: 4px 0;">${infra.name}</div>
      <div style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 8px;">${infra.description}</div>
      <div style="font-size: 0.9rem; border-top: 1px dashed #333; padding-top: 5px;">
        <span>Cost: <strong>${infra.cost} cr</strong></span> | 
        <span>Slots: <strong>${infra.contextSize}</strong></span>
      </div>
    `;

    btn.addEventListener("click", () => {
      gameState.selectedInfraId = infra.id;
      addLog(`Infra seleccionada: ${infra.name} (${infra.memoryType}).`);
      updateUI();
    });

    infraCardsEl.appendChild(btn);
  });
}

function drawBoard() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  ctx.clearRect(0, 0, w, h);

  // Background - subtle whiteboard texture
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  const problem = PROBLEMS[gameState.roundIndex];
  const infra = getSelectedInfra();
  const latest = gameState.latestRun;

  drawTopLabel(problem, infra, w);
  drawCentralArena(w, h, infra, latest);
}

function drawTopLabel(problem, infra, width) {
  ctx.save();
  ctx.fillStyle = "#1e293b";
  ctx.font = "24px 'Architects Daughter'";
  ctx.fillText("WHITEBOARD SESSION: Memory Flow", 40, 40);
  
  ctx.font = "16px 'Patrick Hand'";
  ctx.fillStyle = "#64748b";
  ctx.fillText(`Active Ticket: ${problem.title} | Infrastructure: ${infra.name}`, 40, 65);
  ctx.restore();
}

function roughLine(x1, y1, x2, y2, color = "#333", width = 2) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  
  const length = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
  const segments = Math.max(2, Math.floor(length / 10));
  
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  
  for(let i=1; i<=segments; i++) {
    const t = i / segments;
    const nextX = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 2;
    const nextY = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 2;
    ctx.lineTo(nextX, nextY);
  }
  
  ctx.stroke();
  ctx.restore();
}

function roughRect(x, y, w, h, color = "#333", width = 2) {
  roughLine(x, y, x + w, y, color, width);
  roughLine(x + w, y, x + w, y + h, color, width);
  roughLine(x + w, y + h, x, y + h, color, width);
  roughLine(x, y + h, x, y, color, width);
}

function roughCircle(cx, cy, r, fill = "transparent", stroke = "#333") {
  ctx.save();
  
  // Fill first
  if (fill !== "transparent") {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Stroke with "rough" effect
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  
  const segments = 24;
  for(let i=0; i<=segments; i++) {
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

function drawCentralArena(width, height, infra, latest) {
  const x = width * 0.05;
  const y = 80;
  const arenaW = width * 0.9;
  const arenaH = height - 120;

  roughRect(x, y, arenaW, arenaH, "#444", 2);

  // Definir posiciones clave
  const midY = y + arenaH / 2;
  const leftX = x + 100;
  const centerX = x + arenaW / 2;
  const rightX = x + arenaW - 100;

  if (infra.id === "base") {
    // Arquitectura Paramétrica: Directa
    drawNode(leftX, midY, 45, "USER INPUT", "#dbeafe");
    drawNode(centerX, midY, 70, "GEMMA\n(Weights)", "#dcfce7");
    drawNode(rightX, midY, 45, "OUTPUT", "#fee2e2");
    
    drawOrganicArrow(leftX + 45, midY, centerX - 70, midY);
    drawOrganicArrow(centerX + 70, midY, rightX - 45, midY);
    
    ctx.font = "italic 14px 'Patrick Hand'";
    ctx.fillText("Solo memoria paramétrica (entrenamiento)", centerX - 80, midY + 90);

  } else if (infra.id === "small") {
    // Arquitectura Episódica: Chat History con Feedback Loop
    const historyY = midY + 80;
    drawNode(leftX, midY - 40, 40, "INPUT", "#dbeafe");
    drawNode(centerX, midY - 40, 60, "GEMMA", "#dcfce7");
    drawNode(centerX, historyY, 50, "EPISODIC\n(History)", "#fef3c7");
    drawNode(rightX, midY - 40, 40, "OUTPUT", "#fee2e2");

    drawOrganicArrow(leftX + 40, midY - 40, centerX - 60, midY - 40);
    drawOrganicArrow(centerX + 60, midY - 40, rightX - 40, midY - 40);
    // Loop de feedback
    drawOrganicArrow(rightX, midY, centerX + 50, historyY); 
    drawOrganicArrow(centerX - 50, historyY, leftX, midY);

  } else if (infra.id === "large") {
    // Arquitectura Procedimental: System Prompts
    const systemY = midY - 100;
    drawNode(centerX, systemY, 45, "SYSTEM\n(Policy)", "#e0f2fe");
    drawNode(leftX, midY, 40, "USER", "#dbeafe");
    drawNode(centerX, midY, 55, "CONTEXT\nWINDOW", "#fef3c7");
    drawNode(rightX, midY, 40, "GEMMA", "#dcfce7");

    drawOrganicArrow(centerX, systemY + 45, centerX, midY - 55);
    drawOrganicArrow(leftX + 40, midY, centerX - 55, midY);
    drawOrganicArrow(centerX + 55, midY, rightX - 40, midY);

  } else if (infra.id === "rag") {
    // Arquitectura Externa: Vector RAG
    const dbX = leftX + 150;
    const dbY = midY + 90;
    drawNode(leftX, midY - 40, 40, "QUERY", "#dbeafe");
    drawNode(dbX, dbY, 50, "EXTERNAL\n(Docs)", "#f3e8ff");
    drawNode(centerX + 100, midY - 40, 60, "AUGMENTED\nCONTEXT", "#fef3c7");
    drawNode(rightX, midY - 40, 40, "GEMMA", "#dcfce7");

    drawOrganicArrow(leftX + 40, midY - 40, dbX - 30, dbY - 30); // Retrieval search
    drawOrganicArrow(dbX + 50, dbY, centerX + 40, midY); // Inject
    drawOrganicArrow(leftX + 40, midY - 40, centerX + 40, midY - 40); // Direct path
    drawOrganicArrow(centerX + 160, midY - 40, rightX - 40, midY - 40);

  } else if (infra.id === "graph") {
    // Arquitectura Semántica: Knowledge Graph
    const graphX = centerX;
    const graphY = midY + 85;
    drawNode(leftX, midY - 50, 40, "INPUT", "#dbeafe");
    drawNode(rightX, midY - 50, 50, "GEMMA", "#dcfce7");
    
    // Dibujar pequeño grafo simbólico
    roughCircle(graphX, graphY, 45, "#fff7ed", "#c2410c");
    ctx.font = "bold 12px 'Gochi Hand'";
    ctx.fillText("SEMANTIC\nGRAPH", graphX - 25, graphY);
    
    // Conexiones de grafo
    drawOrganicArrow(leftX + 40, midY - 50, graphX - 40, graphY - 20);
    drawOrganicArrow(graphX + 40, graphY - 20, rightX - 50, midY - 20);
    drawOrganicArrow(leftX + 40, midY - 50, rightX - 50, midY - 50);
  }

  if (latest) {
    const statusColor = latest.success ? "#16a34a" : "#dc2626";
    ctx.save();
    ctx.strokeStyle = statusColor;
    ctx.setLineDash([5, 5]);
    roughRect(x + 10, y + 10, arenaW - 20, arenaH - 20, statusColor, 1);
    ctx.restore();
    
    ctx.font = "bold 20px 'Patrick Hand'";
    ctx.fillStyle = statusColor;
    ctx.fillText(latest.success ? "✓ MATCH" : "✗ NO MATCH", rightX - 40, y + 40);
  }
}

function drawNode(x, y, r, label, color) {
  roughCircle(x, y, r, color, "#1e293b");
  ctx.save();
  ctx.fillStyle = "#1e293b";
  ctx.font = "bold 14px 'Gochi Hand'";
  ctx.textAlign = "center";
  const lines = label.split("\n");
  lines.forEach((line, i) => {
    ctx.fillText(line, x, y + (i * 15) - (lines.length > 1 ? 5 : -5));
  });
  ctx.restore();
}

function drawOrganicArrow(x1, y1, x2, y2) {
  roughLine(x1, y1, x2, y2, "#475569", 2);
  
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 12;
  
  ctx.save();
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLen * Math.cos(angle - Math.PI / 8),
    y2 - headLen * Math.sin(angle - Math.PI / 8)
  );
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLen * Math.cos(angle + Math.PI / 8),
    y2 - headLen * Math.sin(angle + Math.PI / 8)
  );
  ctx.stroke();
  ctx.restore();
}

function drawFlowDetails(x, y, flow) {
    ctx.save();
    ctx.font = "14px 'Patrick Hand'";
    ctx.fillStyle = "#475569";
    const summary = flow.slice(-3).join(" | ");
    ctx.fillText(`Recent: ${summary}`, x, y);
    ctx.restore();
}

function pulseHalo(cx, cy, radius, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// Remove old unused panel drawing functions if they exist in the replaced block


function drawHex(cx, cy, radius, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.shadowBlur = 12;
  ctx.shadowColor = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 3) * i;
    const px = cx + radius * Math.cos(angle);
    const py = cy + radius * Math.sin(angle);
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawAsciiPanel(x, y, width, height, title, lines, bgColor) {
  ctx.fillStyle = bgColor;
  ctx.strokeStyle = "#b6c5f0";
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, width, height, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#274172";
  ctx.font = "700 14px 'Courier New', monospace";
  ctx.fillText(`[ ${title} ]`, x + 12, y + 24);

  const maxLines = Math.floor((height - 40) / 18);
  const visible = lines.slice(0, maxLines);
  ctx.font = "12px 'Courier New', monospace";

  visible.forEach((line, index) => {
    const widthChars = Math.max(18, Math.floor((width - 20) / 7));
    ctx.fillText(fit(line, widthChars), x + 12, y + 48 + index * 18);
  });
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height,
  );
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function wrapLine(text, maxChars) {
  const words = text.split(" ");
  const out = [];
  let line = "";

  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maxChars) {
      line = next;
    } else {
      if (line) out.push(line);
      line = word;
    }
  });

  if (line) out.push(line);
  return out;
}

function fit(text, width) {
  if (text.length <= width) {
    return text.padEnd(width, " ");
  }
  return `${text.slice(0, width - 1)}~`;
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

function updateResultBox() {
  if (!gameState.latestRun) {
    expectedOutputEl.textContent = "-";
    actualOutputEl.textContent = "-";
    roundStatusEl.textContent = "Pendiente";
    roundStatusEl.classList.remove("ok", "fail");
    updateScoreBars(null);
    return;
  }

  expectedOutputEl.textContent = gameState.latestRun.expected;
  actualOutputEl.textContent = gameState.latestRun.actual;

  if (gameState.latestRun.success) {
    roundStatusEl.textContent = "MATCH EXACTO";
    roundStatusEl.classList.add("ok");
    roundStatusEl.classList.remove("fail");
  } else {
    roundStatusEl.textContent = "NO MATCH";
    roundStatusEl.classList.add("fail");
    roundStatusEl.classList.remove("ok");
  }

  updateScoreBars(gameState.latestRun.metrics);
}

function updateScoreBars(metrics) {
  if (!metrics) {
    scoreMemoryEl.style.width = "0%";
    scoreQualityEl.style.width = "0%";
    scoreBudgetEl.style.width = "0%";
    return;
  }
  scoreMemoryEl.style.width = `${metrics.memory}%`;
  scoreQualityEl.style.width = `${metrics.quality}%`;
  scoreBudgetEl.style.width = `${metrics.budget}%`;
}

function updateLogView() {
  turnLogEl.innerHTML = "";
  gameState.logs
    .slice()
    .reverse()
    .forEach((entry) => {
      const li = document.createElement("li");
      li.textContent = entry;
      turnLogEl.appendChild(li);
    });
}

function updateUI() {
  modelNameEl.textContent = MODEL_NAME;
  totalBudgetValueEl.textContent = String(START_BUDGET);
  spendValueEl.textContent = String(gameState.totalSpend);
  budgetValueEl.textContent = String(gameState.budget);
  roundValueEl.textContent = `${gameState.roundIndex + 1}/${PROBLEMS.length}`;
  scoreValueEl.textContent = String(gameState.solved);

  const problem = PROBLEMS[gameState.roundIndex];
  ticketProblemTitleEl.innerHTML = `
    <div style="color: var(--marker-red); font-family: var(--font-hand); font-size: 1.2rem;">Priority: ${problem.priority}</div>
    <div style="font-size: 1.4rem;">${problem.title}</div>
    <div style="font-size: 0.9rem; color: #666; margin-top: 4px;">${problem.details}</div>
  `;
  customerMessageEl.textContent = `${problem.question}`;
  contextWindowValueEl.textContent = `${getSelectedInfra().contextSize} slots`;
  levelDescriptionEl.textContent = `Analiza el ticket y elige la capa de memoria adecuada (${problem.priority}).`;

  renderInfraButtons();
  updateResultBox();
  updateLogView();
  drawBoard();

  runRoundBtn.disabled = gameState.gameOver;
  nextProblemBtn.disabled = gameState.gameOver;
}

window.addEventListener("DOMContentLoaded", () => {
  resetGame();
  syncCanvasResolution();
});
