const { send, route } = require("../lib/common");

// tokens are stateless, so logging out just means the browser forgets it
module.exports = route("POST", async (req, res) => {
  send(res, 200, { ok: true });
});