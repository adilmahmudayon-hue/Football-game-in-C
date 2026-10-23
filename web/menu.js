const ui = document.getElementById("ui");
const quitBtn = document.getElementById("quitBtn");

const touch = document.getElementById("touch");

// each touch button sends the same key press the keyboard would
touch.querySelectorAll("button").forEach((b) => {
  b.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: b.dataset.key }));
  });
});

let user = null;
let token = null;

quitBtn.onclick = () => quitToMenu();

// ---------- helper bot ----------
const bot = document.getElementById("bot");
const botImg = document.getElementById("botImg");
const botBubble = document.getElementById("botBubble");
let botTip = "";

function say(text) {
  if (text === botTip) return;
  botTip = text;
  botBubble.textContent = text;
}

// the first match wins, so the order matters
const SCREEN_TIPS = [
    ["FOOTBALL SHOOTOUT", "Hi! Choose Login if you have an account, or Register to make one."],
  ["LOGIN", "Type your username and password, then press Login."],
  ["REGISTER", "Pick a username, add your email and a password, then press Create account."],
  ["LEVEL COMPLETE", "Great shooting! Press Next level to keep going, or go back to the menu."],
  ["LEVEL FAILED", "So close! Repeat the level and stop the bar in the green zone."],
  ["FOOTBALL SHOOTOUT", "Hi! Type a username and password, then press Login. New here? Press Register."],
  ["SELECT LEVEL", "Pick an unlocked level. A locked level opens when you beat the one before it."],
  ["LEVEL ", "Check the target score, then press Play. Ready?"],
  ["MY STATS", "These are your numbers. Beat your high score!"],
  ["LEADERBOARD", "Players are ranked by level first, then total score. Climb higher!"],
  ["MENU", "Press Play to continue, or Select level to replay an old one."],
  ["Thanks", "See you next time!"],
  ["Could not save", "Something went wrong. Go back to the menu and log in again."],
];

function updateTip() {
  const h = ui.querySelector("h1, h2");
  const title = h ? h.textContent.trim() : "";
  const hit = SCREEN_TIPS.find(([key]) => title.startsWith(key));
  say(hit ? hit[1] : "Follow the buttons on the screen. I'm here if you need help!");
}

// tips while a level is being played (state, level and running come from game.js)
function gameTip() {
  if (state === "aim") {
    let t = "Move the yellow box with the arrows, then press LOCK / Enter.";
    if (level.vanish) t += " Targets you score on vanish!";
    if (level.keeperRows) t += " Aim away from the goalkeeper.";
    return t;
  }
  if (state === "power") {
    return level.sway
      ? "The goal is moving! Stop the bar in the green zone."
      : "Press Space or SHOOT when the marker is in the green zone!";
  }
  if (state === "flying") return "Here it goes...";
  if (state === "result") return "Read the result below the goal. Next shot coming up!";
  return "";
}
setInterval(() => { if (running) say(gameTip()); }, 250);

// click the sticker to hide or show the bubble, drag it to move it
let drag = null;
botImg.addEventListener("pointerdown", (e) => {
  const r = bot.getBoundingClientRect();
  drag = { dx: e.clientX - r.left, dy: e.clientY - r.top,
           x: e.clientX, y: e.clientY, moved: false };
  botImg.setPointerCapture(e.pointerId);
});
botImg.addEventListener("pointermove", (e) => {
  if (!drag) return;
  if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 6) drag.moved = true;
  if (!drag.moved) return;
  bot.style.left = Math.max(0, Math.min(innerWidth - bot.offsetWidth, e.clientX - drag.dx)) + "px";
  bot.style.top = Math.max(0, Math.min(innerHeight - bot.offsetHeight, e.clientY - drag.dy)) + "px";
  bot.style.bottom = "auto";
});
botImg.addEventListener("pointerup", () => {
  if (drag && !drag.moved) bot.classList.toggle("quiet");
  drag = null;
});

// ---------- server calls ----------
async function api(route, body) {
  try {
    const res = await fetch("/api/" + route, {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return await res.json();
  } catch (e) {
    return { error: "Cannot reach the server. Run 'node server.js' and open http://localhost:3000" };
  }
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ---------- helpers ----------
function show(html, solid) {
    touch.style.display = "none";
  quitBtn.style.display = "none";
  ui.className = solid === false ? "clear" : "solid";
  ui.innerHTML = html;
  ui.style.display = "flex";
    updateTip();
}
function hide() { ui.style.display = "none"; }
function on(id, fn) { document.getElementById(id).onclick = fn; }

// ---------- login ----------
function showLogin(msg) {
  show(`<div class="panel">
    <h1>FOOTBALL SHOOTOUT</h1>
    <p>Welcome! Choose an option</p>
    <p class="msg">${esc(msg || "")}</p>
    <button id="login">Login</button>
    <button id="reg" class="secondary">Register</button>
    <button id="lb" class="secondary">Leaderboard</button>
    <button id="quit" class="secondary">Quit</button>
  </div>`);
  on("login", () => showLoginForm());
  on("reg", () => showRegisterForm());
  on("lb", () => showLeaderboard(() => showLogin()));
  on("quit", showGoodbye);
}

function showLoginForm(msg) {
  show(`<div class="panel">
    <h2>LOGIN</h2>
    <input id="u" placeholder="Username" maxlength="19" autocomplete="username">
    <input id="p" type="password" placeholder="Password" maxlength="19"
           autocomplete="current-password">
    <p class="msg">${esc(msg || "")}</p>
    <button id="go">Login</button>
    <button id="back" class="secondary">Back</button>
  </div>`);
  on("go", doLogin);
  on("back", () => showLogin());
  document.getElementById("p").onkeydown = (e) => {
    if (e.key === "Enter") doLogin();
  };
  document.getElementById("u").focus();
}

function showRegisterForm(msg, v) {
  v = v || {};
  show(`<div class="panel">
    <h2>REGISTER</h2>
    <input id="u" placeholder="Username" maxlength="19" value="${esc(v.name || "")}"
           autocomplete="username">
    <input id="e" type="email" placeholder="Email" maxlength="100"
           value="${esc(v.email || "")}" autocomplete="email">
    <input id="p" type="password" placeholder="Password" maxlength="19"
           autocomplete="new-password">
    <p class="msg">${esc(msg || "")}</p>
    <button id="go">Create account</button>
    <button id="back" class="secondary">Back</button>
  </div>`);
  on("go", doRegister);
  on("back", () => showLogin());
  document.getElementById("p").onkeydown = (e) => {
    if (e.key === "Enter") doRegister();
  };
  document.getElementById("u").focus();
}

function showGoodbye() {
  show(`<div class="panel">
    <h1>Thanks for playing!</h1>
    <p>You can close this tab now.</p>
    <button id="again">Back to home</button>
  </div>`);
  on("again", () => showLogin());
}

async function doLogin() {
  const name = document.getElementById("u").value.trim();
  const password = document.getElementById("p").value;
  if (!name || !password)
    return showLoginForm("Enter a username and a password.");
  const r = await api("login", { name, password });
  if (r.error) return showLoginForm(r.error);
  user = r.user;
  token = r.token;
  showMenu();
}

async function doRegister() {
  const name = document.getElementById("u").value.trim();
  const email = document.getElementById("e").value.trim();
  const password = document.getElementById("p").value;
  const keep = { name, email };

  if (!name || !email || !password)
    return showRegisterForm("Fill in the username, email and password.", keep);
  if (/\s/.test(name) || /\s/.test(password))
    return showRegisterForm("No spaces allowed in the username or password.", keep);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return showRegisterForm("Enter a valid email address.", keep);

  const r = await api("register", { name, email, password });
  if (r.error) return showRegisterForm(r.error, keep);
  user = r.user;
  token = r.token;
  showMenu();
}

async function logout() {
  if (token) await api("logout", { token });
  user = null;
  token = null;
  showLogin();
}

// ---------- menus ----------
function showMenu() {
  show(`<div class="panel">
    <h2>MENU</h2>
    <p>Player: <b>${esc(user.name)}</b></p>
    <p>Level: <b>${user.level}</b> &nbsp; Rank: <b>${tierName(user.level)}</b></p>
    <button id="play">Play (continue level ${user.level})</button>
    <button id="sel" class="secondary">Select level</button>
    <button id="stats" class="secondary">My stats</button>
    <button id="lb" class="secondary">Leaderboard</button>
    <button id="out" class="secondary">Log out</button>
    <button id="quit" class="secondary">Quit game</button>
  </div>`);
  on("play", () => startPlay(user.level));
  on("sel", () => showLevels());
  on("stats", showStats);
  on("lb", () => showLeaderboard(showMenu));
  on("out", logout);
  on("quit", async () => { await logout(); showGoodbye(); });
}

function showLevels(msg) {
  let rows = "";
  for (let n = 1; n <= MAX_LEVEL; n++) {
    const lv = LEVELS[n - 1];
    let status = "COMPLETED";
    if (n > user.level) status = "LOCKED";
    else if (n === user.level) status = "CURRENT";
    rows += `<button id="lv${n}" class="${n > user.level ? "locked" : "secondary"}">
      Level ${n} - ${tierName(n)} &nbsp; target ${lv.target} &nbsp; [${status}]</button>`;
  }
  show(`<div class="panel">
    <h2>SELECT LEVEL</h2>
    <p class="msg">${esc(msg || "")}</p>
    <div class="levels">${rows}</div>
    <button id="back">Back</button>
  </div>`);
  for (let n = 1; n <= MAX_LEVEL; n++) {
    on("lv" + n, () => {
      if (n > user.level)
        showLevels("Level " + n + " is locked. Complete level " + (n - 1) + " first.");
      else showPreview(n);
    });
  }
  on("back", showMenu);
}

function showPreview(n) {
  const lv = LEVELS[n - 1];
  show(`<div class="panel">
    <h2>LEVEL ${n} - ${tierName(n)}</h2>
    <div class="info">
      <p>Shots: <b>${lv.shots}</b></p>
      <p>Target score: <b>${lv.target}</b></p>
      <p>Exact zone: <b>${lv.sweetMin}% - ${lv.sweetMax}%</b></p>
           
      ${lv.vanish ? "<p>Targets you score on <b>vanish</b>!</p>" : ""}
      ${lv.sway ? "<p>The goal <b>moves</b> left and right!</p>" : ""}

    </div>
    <div class="row">
      <button id="go">Play</button>
      <button id="back" class="secondary">Back</button>
    </div>
  </div>`);
  on("go", () => startPlay(n));
  on("back", () => showLevels());
}

function showStats() {
  const avg = user.gamesPlayed ? (user.totalScore / user.gamesPlayed).toFixed(1) : "-";
  show(`<div class="panel">
    <h2>MY STATS</h2>
    <table>
      <tr><td>Player</td><td>${esc(user.name)}</td></tr>
      <tr><td>Level</td><td>${user.level} / ${MAX_LEVEL} (${tierName(user.level)})</td></tr>
      <tr><td>High score</td><td>${user.highScore}</td></tr>
      <tr><td>Games played</td><td>${user.gamesPlayed}</td></tr>
      <tr><td>Total score</td><td>${user.totalScore}</td></tr>
      <tr><td>Average</td><td>${avg}</td></tr>
    </table>
    <button id="back">Back</button>
  </div>`);
  on("back", showMenu);
}

async function showLeaderboard(backFn) {
  const r = await api("leaderboard" + (token ? "?token=" + encodeURIComponent(token) : ""));
  let body;
  if (r.error) {
    body = `<p class="msg">${esc(r.error)}</p>`;
  } else {
    let rows = r.top.map((u, i) =>
      `<tr class="${r.me && u.name === r.me.name ? "me" : ""}">
         <td>${i + 1}</td><td>${esc(u.name)}</td><td>L${u.level}</td>
         <td>${u.totalScore}</td></tr>`).join("");
    if (!rows) rows = `<tr><td colspan="4">No players yet.</td></tr>`;

    const mine = r.me
      ? `<div class="mybox">Your position: <b>${r.me.rank}</b> of
           <b>${r.total}</b> players<br>
           ${esc(r.me.name)} &middot; Level ${r.me.level} &middot;
           Total ${r.me.totalScore}</div>`
      : `<p>${r.total} players have played.</p>`;

    body = `<div class="levels"><table>
        <tr><th>#</th><th>Name</th><th>Level</th><th>Total</th></tr>${rows}
      </table></div>${mine}`;
  }
  show(`<div class="panel">
    <h2>LEADERBOARD</h2>
    ${body}
    <button id="back">Back</button>
  </div>`);
  on("back", backFn);
}

// ---------- playing ----------
function startPlay(n) {
  hide();
  quitBtn.style.display = "block";
    touch.style.display = "flex";
  startLevel(n);
}

function quitToMenu() {
  running = false;
  showMenu();
}

onLevelEnd = async function (passed, score) {
  const n = currentLevelNum;
  quitBtn.style.display = "none";

  const r = await api("save", { token, level: n, score, passed });
  if (r.error) {
    show(`<div class="panel">
      <h2>Could not save</h2>
      <p class="msg">${esc(r.error)}</p>
      <button id="menu">Back to menu</button>
    </div>`, false);
    on("menu", showMenu);
    return;
  }
  user = r.user;

  const target = LEVELS[n - 1].target;
  let buttons;
  if (passed && n < MAX_LEVEL) {
    buttons = `<button id="next">Next level</button>
               <button id="menu" class="secondary">Back to menu</button>`;
  } else if (passed) {
    buttons = `<p>You completed all ${MAX_LEVEL} levels!</p>
               <button id="menu">Back to menu</button>`;
  } else {
    buttons = `<button id="again">Repeat this level</button>
               <button id="menu" class="secondary">Quit to menu</button>`;
  }

  show(`<div class="panel">
    <h2 style="color:${passed ? "#50dc78" : "#ff6b5f"}">
      ${passed ? "LEVEL COMPLETE!" : "LEVEL FAILED"}</h2>
    <p>Your score: <b>${score}</b> &nbsp; Target: <b>${target}</b></p>
    ${r.newBest ? "<p class='msg'>NEW HIGH SCORE!</p>" : ""}
    ${r.unlocked ? "<p class='msg'>Level " + user.level + " unlocked.</p>" : ""}
    ${!passed ? "<p>You needed " + (target - score) + " more points.</p>" : ""}
    ${buttons}
  </div>`, false);

  const next = document.getElementById("next");
  if (next) next.onclick = () => startPlay(n + 1);
  const again = document.getElementById("again");
  if (again) again.onclick = () => startPlay(n);
  const menu = document.getElementById("menu");
  if (menu) menu.onclick = showMenu;
};

showLogin();