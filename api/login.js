const { getPlayer, toUser, makeToken, validWord, send, route,
        verifyPassword } = require("../lib/common");

module.exports = route("POST", async (req, res, body) => {
  const p = validWord(body.name) ? await getPlayer(body.name) : null;
  if (!p || typeof body.password !== "string" ||
      !verifyPassword(body.password, p.password_hash))
    return send(res, 401, { error: "Wrong username or password." });
  send(res, 200, { token: makeToken(p.name), user: toUser(p) });
});