const { getDb, getPlayer, toUser, readToken, send, route } = require("../lib/common");

module.exports = route("GET", async (req, res) => {
  const db = getDb();
  const top = await db.from("players").select("*")
    .order("level", { ascending: false })
    .order("total_score", { ascending: false })
    .limit(15);
  if (top.error) throw top.error;

  const all = await db.from("players").select("*", { count: "exact", head: true });
  if (all.error) throw all.error;
  const result = { top: top.data.map(toUser), total: all.count, me: null };

  const name = readToken(req.query.token);
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
  send(res, 200, result);
});