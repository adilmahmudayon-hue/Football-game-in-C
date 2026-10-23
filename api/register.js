const { getDb, getPlayer, toUser, makeToken, validWord, send, route,
        hashPassword } = require("../lib/common");

module.exports = route("POST", async (req, res, body) => {
  if (!validWord(body.name) || !validWord(body.password))
    return send(res, 400, { error: "Username and password: 1-19 characters, no spaces." });
  if (await getPlayer(body.name))
    return send(res, 400, { error: "That username is already taken." });

  const { data, error } = await getDb().from("players").insert({
    name: body.name,
    password_hash: hashPassword(body.password),
  }).select().single();
  if (error) {
    if (error.code === "23505")
      return send(res, 400, { error: "That username is already taken." });
    throw error;
  }
  send(res, 200, { token: makeToken(data.name), user: toUser(data) });
});