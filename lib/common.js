const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
const { hashPassword, verifyPassword } = require("../auth");

const MAX_LEVEL = 15;
const SECRET = process.env.SESSION_SECRET;
const TOKEN_DAYS = 7;

let db = null;
function getDb() {
  if (!db) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY.");
    db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY,
      { auth: { persistSession: false } });
  }
  return db;
}

function toUser(r) {
  return { name: r.name, highScore: r.high_score, gamesPlayed: r.games_played,
           totalScore: r.total_score, level: r.level };
}

// ---------- signed tokens (no server memory needed) ----------
function sign(payload) {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
}

function makeToken(name) {
  if (!SECRET) throw new Error("Missing SESSION_SECRET.");
  const payload = Buffer.from(JSON.stringify({
    n: name, e: Date.now() + TOKEN_DAYS * 24 * 3600 * 1000,
  })).toString("base64url");
  return payload + "." + sign(payload);
}

function readToken(token) {
  if (!SECRET || typeof token !== "string") return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(payload));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const d = JSON.parse(Buffer.from(payload, "base64url").toString());
    return d.e > Date.now() ? d.n : null;
  } catch (e) {
    return null;
  }
}

// ---------- helpers ----------
async function getPlayer(name) {
  const { data, error } = await getDb().from("players").select("*")
    .eq("name", name).maybeSingle();
  if (error) throw error;
  return data;
}

const validWord = (s) => typeof s === "string" && /^\S{1,19}$/.test(s);

const validEmail = (s) =>
  typeof s === "string" && s.length <= 100 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

function send(res, status, obj) {
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json(obj);
}

// wraps a route: checks the HTTP method, parses the body, catches errors
function route(method, fn) {
  return async (req, res) => {
    try {
      if (req.method !== method) return send(res, 405, { error: "Not allowed" });
      const body = req.body && typeof req.body === "object" ? req.body : {};
      await fn(req, res, body);
    } catch (e) {
      console.error(e);
      send(res, 500, { error: "Server error." });
    }
  };
}

module.exports = { MAX_LEVEL, getDb, toUser, makeToken, readToken, getPlayer,
                   validWord, validEmail, send, route, hashPassword, verifyPassword };