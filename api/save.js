const { MAX_LEVEL, getDb, getPlayer, toUser, readToken, send,
        route } = require("../lib/common");

module.exports = route("POST", async (req, res, body) => {
  const name = readToken(body.token);
  if (!name) return send(res, 401, { error: "Session expired. Please log in again." });

  const level = parseInt(body.level, 10);
  const score = parseInt(body.score, 10);
  if (!(level >= 1 && level <= MAX_LEVEL) || !(score >= 0 && score <= 60))
    return send(res, 400, { error: "Bad data." });

  const p = await getPlayer(name);
  if (!p) return send(res, 404, { error: "Player not found." });
  if (level > p.level) return send(res, 400, { error: "That level is locked." });

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
  const { data, error } = await getDb().from("players").update(update)
    .eq("name", name).select().single();
  if (error) throw error;
  send(res, 200, { user: toUser(data), newBest, unlocked });
});