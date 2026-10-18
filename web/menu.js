const USERS_KEY = "fs_users";
const ui = document.getElementById("ui");
let user = null;

// ---------- storage ----------
function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
  catch (e) { return []; }
}
function saveUsers(list) {
  localStorage.setItem(USERS_KEY, JSON.stringify(list));
}
function saveUser() {
  const list = loadUsers();
  const i = list.findIndex((u) => u.name === user.name);
  if (i >= 0) list[i] = user; else list.push(user);
  saveUsers(list);
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ---------- helpers ----------
function show(html, solid) {
  ui.className = solid === false ? "clear" : "solid";
  ui.innerHTML = html;
  ui.style.display = "flex";
}
function hide() { ui.style.display = "none"; }
function on(id, fn) { document.getElementById(id).onclick = fn; }

// ---------- login ----------
function showLogin(msg) {
  show(`<div class="panel">
    <h1>FOOTBALL SHOOTOUT</h1>
    <p>Log in or create an account</p>
    <input id="u" placeholder="Username" maxlength="20" autocomplete="username">
    <input id="p" type="password" placeholder="Password" maxlength="20">
    <p class="msg">${esc(msg || "")}</p>
    <button id="login">Login</button>
    <button id="reg" class="secondary">Register</button>
    <button id="lb" class="secondary">Leaderboard</button>
  </div>`);
  on("login", doLogin);
  on("reg", doRegister);
  on("lb", () => showLeaderboard(() => showLogin()));
  document.getElementById("p").onkeydown = (e) => {
    if (e.key === "Enter") doLogin();
  };
}

function readCredentials() {
  const name = document.getElementById("u").value.trim();
  const pass = document.getElementById("p").value;
  return { name, pass };
}

function doLogin() {
  const { name, pass } = readCredentials();
  const found = loadUsers().find((u) => u.name === name && u.password === pass);
  if (!found) return showLogin("Wrong username or password.");
  user = found;
  showMenu();
}

function doRegister() {
  const { name, pass } = readCredentials();
  if (!name || !pass) return showLogin("Enter a username and a password.");
  if (/\s/.test(name)) return showLogin("Username can't contain spaces.");
  if (loadUsers().some((u) => u.name === name))
    return showLogin("That username is already taken.");
  user = { name, password: pass, highScore: 0, gamesPlayed: 0,
           totalScore: 0, level: 1 };
  saveUser();
  showMenu();
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
  </div>`);
  on("play", () => startPlay(user.level));
  on("sel", () => showLevels());
  on("stats", showStats);
  on("lb", () => showLeaderboard(showMenu));
  on("out", () => { user = null; showLogin(); });
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

function showLeaderboard(backFn) {
  const top = loadUsers().slice()
    .sort((a, b) => b.highScore - a.highScore).slice(0, 5);
  let rows = top.map((u, i) =>
    `<tr><td>${i + 1}</td><td>${esc(u.name)}</td><td>${u.highScore}</td>
     <td>L${u.level}</td></tr>`).join("");
  if (!rows) rows = `<tr><td colspan="4">No players yet.</td></tr>`;
  show(`<div class="panel">
    <h2>TOP PLAYERS</h2>
    <table><tr><th>#</th><th>Name</th><th>Best</th><th>Level</th></tr>${rows}</table>
    <button id="back">Back</button>
  </div>`);
  on("back", backFn);
}

// ---------- playing ----------
function startPlay(n) {
  hide();
  startLevel(n);
}

function quitToMenu() {
  running = false;
  showMenu();
}

onLevelEnd = function (passed, score) {
  const n = currentLevelNum;

  user.gamesPlayed++;
  user.totalScore += score;
  let newBest = false;
  if (score > user.highScore) { user.highScore = score; newBest = true; }
  let unlocked = false;
  if (passed && n < MAX_LEVEL && n + 1 > user.level) {
    user.level = n + 1;
    unlocked = true;
  }
  saveUser();

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
    ${newBest ? "<p class='msg'>NEW HIGH SCORE!</p>" : ""}
    ${unlocked ? "<p class='msg'>Level " + user.level + " unlocked.</p>" : ""}
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