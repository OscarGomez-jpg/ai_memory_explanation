const path = require("node:path");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const crypto = require("node:crypto");

const express = require("express");
const helmet = require("helmet");
const { z } = require("zod");

const PORT = Number(process.env.PORT || 3000);
const DATA_PATH = process.env.DATA_PATH || path.join(__dirname, "data.json");
const PUBLIC_DIR = path.join(__dirname, "public");

if (!fs.existsSync(PUBLIC_DIR)) {
  console.error("Missing ./public directory.");
  process.exit(1);
}

async function readJsonFile(filePath) {
  try {
    const raw = await fsp.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    if (err && err.code === "ENOENT") return null;
    throw err;
  }
}

async function writeJsonFileAtomic(filePath, value) {
  const dir = path.dirname(filePath);
  await fsp.mkdir(dir, { recursive: true });

  const tmpPath = `${filePath}.${crypto.randomUUID()}.tmp`;
  await fsp.writeFile(tmpPath, JSON.stringify(value, null, 2) + "\n", "utf8");
  await fsp.rename(tmpPath, filePath);
}

const store = {
  attempts: [],
  loaded: false,
  writeInFlight: Promise.resolve(),
};

async function ensureStoreLoaded() {
  if (store.loaded) return;
  const data = await readJsonFile(DATA_PATH);
  if (data && Array.isArray(data.attempts)) {
    store.attempts = data.attempts
      .filter((a) => a && typeof a === "object")
      .map((a) => {
        const username = typeof a.username === "string" ? a.username : "";
        const usernameKey =
          typeof a.usernameKey === "string" && a.usernameKey
            ? a.usernameKey
            : username.toLocaleLowerCase("es-ES");

        return {
          ...a,
          username,
          usernameKey,
          modeId:
            typeof a.modeId === "string" && a.modeId
              ? a.modeId
              : "memory-architect",
        };
      });
  }
  store.loaded = true;
}

function queuePersist() {
  store.writeInFlight = store.writeInFlight
    .then(() => writeJsonFileAtomic(DATA_PATH, { attempts: store.attempts }))
    .catch((err) => {
      console.error("Failed to persist data:", err);
    });
  return store.writeInFlight;
}

const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "20kb" }));

// Basic in-memory rate limiter to reduce drive-by spam.
const rateState = new Map();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 30;

function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"]; // may be string or array
  if (typeof xff === "string" && xff.length > 0)
    return xff.split(",")[0].trim();
  return req.socket.remoteAddress || "unknown";
}

function rateLimit(req, res, next) {
  const ip = getClientIp(req);
  const now = Date.now();
  const entry = rateState.get(ip);
  if (!entry || now > entry.resetAt) {
    rateState.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return next();
  }

  entry.count += 1;
  if (entry.count > RATE_MAX) {
    res.status(429).json({ error: "Too many requests" });
    return;
  }

  next();
}

const attemptSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(2)
      .max(24)
      .regex(/^[\p{L}0-9 _.-]+$/u, "Nombre inválido"),
    modeId: z
      .string()
      .trim()
      .min(1)
      .max(32)
      .regex(/^[a-z0-9-]+$/u, "Modo inválido")
      .optional(),
    solved: z.number().int().min(0).max(999),
    roundsTotal: z.number().int().min(1).max(999),
    totalSpend: z.number().int().min(0).max(1_000_000),
    budgetRemaining: z.number().int().min(-1_000_000).max(1_000_000),
    clientTs: z.string().trim().min(1).max(64),
  })
  .strict();

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/attempts", rateLimit, async (req, res) => {
  await ensureStoreLoaded();

  const parsed = attemptSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Invalid payload", details: parsed.error.flatten() });
    return;
  }

  const {
    username,
    modeId: modeIdRaw,
    solved,
    roundsTotal,
    totalSpend,
    budgetRemaining,
    clientTs,
  } = parsed.data;
  const id = crypto.randomUUID();
  const usernameKey = username.toLocaleLowerCase("es-ES");
  const modeId = modeIdRaw || "memory-architect";

  store.attempts.push({
    id,
    username,
    usernameKey,
    modeId,
    solved,
    roundsTotal,
    totalSpend,
    budgetRemaining,
    clientTs,
    createdAt: new Date().toISOString(),
  });

  // Keep file bounded to avoid unbounded growth on public deploys.
  if (store.attempts.length > 10_000) {
    store.attempts = store.attempts.slice(store.attempts.length - 10_000);
  }

  await queuePersist();

  res.status(201).json({ ok: true, id });
});

app.get("/api/leaderboard", async (req, res) => {
  await ensureStoreLoaded();

  const limitRaw = typeof req.query.limit === "string" ? req.query.limit : "10";
  const limit = Math.max(1, Math.min(50, Number(limitRaw || 10)));
  const modeIdRaw =
    typeof req.query.modeId === "string" ? req.query.modeId : "";
  const modeId =
    String(modeIdRaw || "memory-architect").trim() || "memory-architect";

  const latestByUser = new Map();

  for (const a of store.attempts) {
    if (!a || !a.usernameKey) continue;
    if (String(a.modeId || "memory-architect") !== modeId) continue;

    const prev = latestByUser.get(a.usernameKey);
    if (!prev) {
      latestByUser.set(a.usernameKey, a);
      continue;
    }

    // Use server timestamp as source of truth for "current".
    if (String(a.createdAt) > String(prev.createdAt)) {
      latestByUser.set(a.usernameKey, a);
    }
  }

  const items = Array.from(latestByUser.values())
    .sort((a, b) => {
      if (b.solved !== a.solved) return b.solved - a.solved;
      if (a.totalSpend !== b.totalSpend) return a.totalSpend - b.totalSpend;
      return String(a.createdAt).localeCompare(String(b.createdAt));
    })
    .slice(0, limit)
    .map((a) => ({
      username: a.username,
      solved: a.solved,
      roundsTotal: a.roundsTotal,
      totalSpend: a.totalSpend,
      budgetRemaining: a.budgetRemaining,
      createdAt: a.createdAt,
    }));

  res.json({ items });
});

app.get("/api/user-attempts", async (req, res) => {
  await ensureStoreLoaded();

  const usernameRaw =
    typeof req.query.username === "string" ? req.query.username : "";
  const modeIdRaw =
    typeof req.query.modeId === "string" ? req.query.modeId : "";
  const limitRaw = typeof req.query.limit === "string" ? req.query.limit : "20";

  const usernameParsed = z
    .string()
    .trim()
    .min(2)
    .max(24)
    .regex(/^[\p{L}0-9 _.-]+$/u)
    .safeParse(usernameRaw);
  if (!usernameParsed.success) {
    res.status(400).json({ error: "Invalid username" });
    return;
  }

  const modeIdParsed = z
    .string()
    .trim()
    .min(1)
    .max(32)
    .regex(/^[a-z0-9-]+$/u)
    .safeParse(modeIdRaw || "memory-architect");
  if (!modeIdParsed.success) {
    res.status(400).json({ error: "Invalid modeId" });
    return;
  }

  const limit = Math.max(1, Math.min(100, Number(limitRaw || 20)));
  const usernameKey = usernameParsed.data.toLocaleLowerCase("es-ES");
  const modeId = modeIdParsed.data;

  const items = store.attempts
    .filter(
      (a) =>
        a &&
        a.usernameKey === usernameKey &&
        String(a.modeId || "memory-architect") === modeId,
    )
    .slice()
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, limit)
    .map((a) => ({
      id: a.id,
      username: a.username,
      modeId: a.modeId || "memory-architect",
      solved: a.solved,
      roundsTotal: a.roundsTotal,
      totalSpend: a.totalSpend,
      budgetRemaining: a.budgetRemaining,
      createdAt: a.createdAt,
    }));

  res.json({ items });
});

app.get("/admin", (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "admin.html"));
});

app.use(express.static(PUBLIC_DIR));

app.get("*", (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`DATA: ${DATA_PATH}`);
});
