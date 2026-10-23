const { getDb, getPlayer, toUser, makeToken, validWord, validEmail, send,
        route, hashPassword } = require("../lib/common");

module.exports = route("POST", async (req, res, body) => {
  if (!validWord(body.name) || !validWord(body.password))
    return send(res, 400, { error: "Username and password: 1-19 characters, no spaces." });

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!validEmail(email))
    return send(res, 400, { error: "Enter a valid email address." });

  if (await getPlayer(body.name))
    return send(res, 400, { error: "That username is already taken." });

  const dup = await getDb().from("players").select("name")
    .eq("email", email).maybeSingle();
  if (dup.error) throw dup.error;
  if (dup.data)
    return send(res, 400, { error: "That email is already registered." });

  const { data, error } = await getDb().from("players").insert({
    name: body.name,
    email,
    password_hash: hashPassword(body.password),
  }).select().single();
  if (error) {
    if (error.code === "23505")
      return send(res, 400, { error: "That username or email is already taken." });
    throw error;
  }
  send(res, 200, { token: makeToken(data.name), user: toUser(data) });
});