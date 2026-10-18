const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = 3000;
const WEB_DIR = path.join(__dirname, "web");
const DATA_DIR = path.join(__dirname, "data");
const PLAYER_FILE = path.join(DATA_DIR, "players.txt");
const MAX_LEVEL = 15;

const sessions = new Map(); // token -> player name

// ---------- players.txt ----------
function loadPlayers() {
  if (!fs.existsSync(PLAYER_FILE)) return [];
  const list = [];
  for (const line of fs.readFileSync(PLAYER_FILE, "utf8").split(/\r?\n/)) {
    const p = line.trim().split(/\s+/);
    if (p.length < 5) continue;
    let level = p.length >= 6 ? parseInt(p[5], 10) : 1;
    if (!(level >= 1 && level <= MAX_LEVEL)) level = 1;
    list.push({
      name: p[0],
      password: p[1],
      highScore: parseInt(p[2], 10) || 0,
      gamesPlayed: parseInt(p[3], 10) || 0,
      totalScore: parseInt(p[4], 10) || 0,
      level,
    });
  }
  return list;
}

function savePlayers(list) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const text = list
    .map((u) => [u.name, u.password, u.highScore, u.gamesPlayed,
                 u.totalScore, u.level].join(" "))
    .join("\n");
  fs.writeFileSync(PLAYER_FILE, text + (list.length ? "\n" : ""));
}

function publicUser(u) {
  return { name: u.name, highScore: u.highScore, gamesPlayed: u.gamesPlayed,
           totalScore: u.totalScore, level: u.level };
}

// ---------- helpers ----------
function sendJson(res, status, obj) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 10000) { req.destroy(); reject(new Error("too big")); }
    });
    req.on("end", () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

const validWord = (s) => typeof s === "string" && /^\S{1,19}$/.test(s);

// ---------- API ----------
async function handleApi(req, res, route) {
  if (req.method === "GET" && route === "leaderboard") {
    const top = loadPlayers()
      .sort((a, b) => b.highScore - a.highScore)
      .slice(0, 5)
      .map(publicUser);
    return sendJson(res, 200, { top });
  }

  if (req.method !== "POST") return sendJson(res, 405, { error: "Not allowed" });
  const body = await readBody(req);

  if (route === "register") {
    if (!validWord(body.name) || !validWord(body.password))
      return sendJson(res, 400, { error: "Username and password: 1-19 characters, no spaces." });
    const list = loadPlayers();
    if (list.some((u) => u.name === body.name))
      return sendJson(res, 400, { error: "That username is already taken." });
    const u = { name: body.name, password: body.password, highScore: 0,
                gamesPlayed: 0, totalScore: 0, level: 1 };
    list.push(u);
    savePlayers(list);
    const token = crypto.randomUUID();
    sessions.set(token, u.name);
    return sendJson(res, 200, { token, user: publicUser(u) });
  }

  if (route === "login") {
    const u = loadPlayers().find(
      (p) => p.name === body.name && p.password === body.password);
    if (!u) return sendJson(res, 401, { error: "Wrong username or password." });
    const token = crypto.randomUUID();
    sessions.set(token, u.name);
    return sendJson(res, 200, { token, user: publicUser(u) });
  }

  if (route === "logout") {
    sessions.delete(body.token);
    return sendJson(res, 200, { ok: true });
  }

  if (route === "save") {
    const name = sessions.get(body.token);
    if (!name) return sendJson(res, 401, { error: "Session expired. Please log in again." });

    const level = parseInt(body.level, 10);
    const score = parseInt(body.score, 10);
    if (!(level >= 1 && level <= MAX_LEVEL) || !(score >= 0 && score <= 60))
      return sendJson(res, 400, { error: "Bad data." });

    const list = loadPlayers();
    const u = list.find((p) => p.name === name);
    if (!u) return sendJson(res, 404, { error: "Player not found." });
    if (level > u.level)
      return sendJson(res, 400, { error: "That level is locked." });

    u.gamesPlayed++;
    u.totalScore += score;
    let newBest = false;
    if (score > u.highScore) { u.highScore = score; newBest = true; }
    let unlocked = false;
    if (body.passed === true && level < MAX_LEVEL && level + 1 > u.level) {
      u.level = level + 1;
      unlocked = true;
    }
    savePlayers(list);
    return sendJson(res, 200, { user: publicUser(u), newBest, unlocked });
  }

  sendJson(res, 404, { error: "Unknown request." });
}

// ---------- static files ----------
const TYPES = {
  ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
  ".png": "image/png", ".ico": "image/x-icon", ".svg": "image/svg+xml",
};

function serveStatic(res, pathname) {
  if (pathname === "/") pathname = "/index.html";
  const file = path.normalize(path.join(WEB_DIR, pathname));
  if (!file.startsWith(WEB_DIR)) {
    res.writeHead(403); return res.end("Forbidden");
  }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "text/plain" });
    res.end(data);
  });
}

// ---------- start ----------
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname.startsWith("/api/"))
      return await handleApi(req, res, url.pathname.slice(5));
    serveStatic(res, url.pathname);
  } catch (e) {
    sendJson(res, 500, { error: "Server error." });
  }
}).listen(PORT, "127.0.0.1", () => {
  console.log("Football Shootout running at http://localhost:" + PORT);
  console.log("Players file: " + PLAYER_FILE);
});