const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");
const { hashPassword } = require("./auth");

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } });

const rows = [];
for (const line of fs.readFileSync("data/players.txt", "utf8").split(/\r?\n/)) {
  const p = line.trim().split(/\s+/);
  if (p.length < 5) continue;
  let level = p.length >= 6 ? parseInt(p[5], 10) : 1;
  if (!(level >= 1 && level <= 15)) level = 1;
  rows.push({
    name: p[0],
    password_hash: hashPassword(p[1]),
    high_score: parseInt(p[2], 10) || 0,
    games_played: parseInt(p[3], 10) || 0,
    total_score: parseInt(p[4], 10) || 0,
    level,
  });
}

db.from("players").upsert(rows).then(({ error }) => {
  console.log(error ? "Failed: " + error.message : "Imported " + rows.length + " players.");
});