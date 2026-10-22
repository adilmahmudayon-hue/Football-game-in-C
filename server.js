const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
const { hashPassword, verifyPassword } = require("./auth");

const PORT = process.env.PORT || 3000;
const WEB_DIR = path.join(__dirname, "web");
const MAX_LEVEL = 15;

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variable.");
  process.exit(1);
}
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

const sessions = new Map(); // token -> player name

// ---------- helpers ----------
function toUser(r) {
  return { name: r.name, highScore: r.high_score, gamesPlayed: r.games_played,
           totalScore: r.total_score, level: r.level };
}

function sendJson(res, status, obj) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
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

async function getPlayer(name) {
  const { data, error } = await db.from("players").select("*")
    .eq("name", name).maybeSingle();
  if (error) throw error;
  return data;
}

// ---------- API ----------
async function handleApi(req, res, route) {
    if (req.method === "GET" && route === "leaderboard") {
    const { data, error } = await db.from("players").select("*")
      .order("level", { ascending: false })
      .order("total_score", { ascending: false })
      .limit(15);
    if (error) throw error;

    const all = await db.from("players").select("*", { count: "exact", head: true });
    if (all.error) throw all.error;
    const result = { top: data.map(toUser), total: all.count, me: null };

    // if a logged-in player asked, work out their position
    const url = new URL(req.url, "http://localhost");
    const name = sessions.get(url.searchParams.get("token"));
    const p = name ? await getPlayer(name) : null;
    if (p) {
      const higher = await db.from("players").select("*", { count: "exact", head: true })
        .gt("level", p.level);
      const same = await db.from("players").select("*", { count: "exact", head: true })
        .eq("level", p.level).gt("total_score", p.total_score);
      if (higher.error) throw higher.error;
      if (same.error) throw same.error;
      result.me = { name: p.name, level: p.level, totalScore: p.total_score,
                    rank: higher.count + same.count + 1 };
    }
    return sendJson(res, 200, result);
  }   

  if (req.method !== "POST") return sendJson(res, 405, { error: "Not allowed" });
  const body = await readBody(req);

  if (route === "register") {
    if (!validWord(body.name) || !validWord(body.password))
      return sendJson(res, 400, { error: "Username and password: 1-19 characters, no spaces." });
    if (await getPlayer(body.name))
      return sendJson(res, 400, { error: "That username is already taken." });

    const { data, error } = await db.from("players").insert({
      name: body.name,
      password_hash: hashPassword(body.password),
    }).select().single();
    if (error) {
      if (error.code === "23505")
        return sendJson(res, 400, { error: "That username is already taken." });
      throw error;
    }
    const token = crypto.randomUUID();
    sessions.set(token, data.name);
    return sendJson(res, 200, { token, user: toUser(data) });
  }

  if (route === "login") {
    const p = validWord(body.name) ? await getPlayer(body.name) : null;
    if (!p || typeof body.password !== "string" ||
        !verifyPassword(body.password, p.password_hash))
      return sendJson(res, 401, { error: "Wrong username or password." });
    const token = crypto.randomUUID();
    sessions.set(token, p.name);
    return sendJson(res, 200, { token, user: toUser(p) });
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

    const p = await getPlayer(name);
    if (!p) return sendJson(res, 404, { error: "Player not found." });
    if (level > p.level)
      return sendJson(res, 400, { error: "That level is locked." });

    const update = {
      games_played: p.games_played + 1,
      total_score: p.total_score + score,
    };
    let newBest = false;
    if (score > p.high_score) { update.high_score = score; newBest = true; }
    let unlocked = false;
    if (body.passed === true && level < MAX_LEVEL && level + 1 > p.level) {
      update.level = level + 1;
      unlocked = true;
    }
    const { data, error } = await db.from("players").update(update)
      .eq("name", name).select().single();
    if (error) throw error;
    return sendJson(res, 200, { user: toUser(data), newBest, unlocked });
  }

  sendJson(res, 404, { error: "Unknown request." });
}

// ---------- static files ----------
const TYPES = {
  ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
  ".png": "image/png", ".ico": "image/x-icon", ".svg": "image/svg+xml",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
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
    console.error(e);
    sendJson(res, 500, { error: "Server error." });
  }
}).listen(PORT, "0.0.0.0", () => {
  console.log("Football Shootout running on port " + PORT);
});