const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ---------- data (same as the C game) ----------
const ROWS = 4;
const COLS = 9;
const points = [
  [5, 4, 3, 2, 3, 2, 3, 4, 5],
  [4, 3, 2, 1, 2, 1, 2, 3, 4],
  [4, 3, 2, 2, 1, 2, 2, 3, 4],
  [3, 2, 2, 1, 2, 1, 2, 2, 3],
];

// Level 1 settings (more levels in the next step)
let level = LEVELS[0];
let running = false;
let currentLevelNum = 1;
let onLevelEnd = null;
const ROW_STEP = 15; // every 15% outside the green zone = one more row

// ---------- layout ----------
const CELL_W = 80;
const CELL_H = 70;
const GOAL_X = (canvas.width - COLS * CELL_W) / 2;
const GOAL_Y = 60;
const GOAL_W = COLS * CELL_W;
const GOAL_H = ROWS * CELL_H;
const GROUND_Y = GOAL_Y + GOAL_H;
const BALL_X = canvas.width / 2;
const BALL_Y = 455;
const BALL_R = 22;

const cellX = (c) => GOAL_X + c * CELL_W + CELL_W / 2;
const cellY = (r) => GOAL_Y + r * CELL_H + CELL_H / 2;

// ---------- state ----------
let state = "aim"; // aim -> power -> flying -> result -> (aim | done)
let cursorRow = 1;
let cursorCol = Math.floor(COLS / 2);
let shot = 1;
let score = 0;
let power = 0;
let powerDir = 1;
let message = "";
let resultTimer = 0;

// flight
let flight = null; // { from, to, arc, t, duration, endRadius }
let pendingPoints = 0;
let pendingText = "";

// ---------- game rules ----------
function judgeShot(p, targetRow) {
  let offset = 0; // positive = higher, negative = lower
  if (p < level.sweetMin) {
    offset = -(1 + Math.floor((level.sweetMin - p - 1) / ROW_STEP));
  } else if (p > level.sweetMax) {
    offset = 1 + Math.floor((p - level.sweetMax - 1) / ROW_STEP);
  }
  const landRow = targetRow - offset; // row 0 is the top
  if (landRow < 0) return { type: "over", landRow };
  if (landRow >= ROWS) return { type: "under", landRow };
  return { type: "hit", landRow };
}

function launchShot() {
  const p = Math.round(power);
  const res = judgeShot(p, cursorRow);
  const x = cellX(cursorCol);

  if (res.type === "hit") {
    flight = { toX: x, toY: cellY(res.landRow), arc: 90, endRadius: 14 };
    pendingPoints = points[res.landRow][cursorCol];
    if (res.landRow === cursorRow) {
      pendingText = "PERFECT! +" + pendingPoints + " points";
    } else if (res.landRow < cursorRow) {
      pendingText = "Too much power! " + (cursorRow - res.landRow) +
        " row(s) higher: +" + pendingPoints;
    } else {
      pendingText = "Not enough power! " + (res.landRow - cursorRow) +
        " row(s) lower: +" + pendingPoints;
    }
  } else if (res.type === "over") {
    flight = { toX: x, toY: -80, arc: 0, endRadius: 8 };
    pendingPoints = 0;
    pendingText = "Way too strong! The ball sailed over the bar.";
  } else {
    flight = { toX: x, toY: GROUND_Y + 40, arc: 60, endRadius: 14 };
    pendingPoints = 0;
    pendingText = "Way too weak! The ball hit the ground before the goal.";
  }
  flight.fromX = BALL_X;
  flight.fromY = BALL_Y;
  flight.t = 0;
  flight.duration = 0.9;
  state = "flying";
}

function startNextShotOrFinish() {
  if (shot >= level.shots) {
        state = "done";
    finishLevel();
  } else {
    shot++;
    power = 0;
    powerDir = 1;
    message = "";
    state = "aim";
  }
}

function restart() {
  shot = 1;
  score = 0;
  power = 0;
  powerDir = 1;
  message = "";
  cursorRow = 1;
  cursorCol = Math.floor(COLS / 2);
  state = "aim";
}

function startLevel(num) {
  currentLevelNum = num;
  level = LEVELS[num - 1];
  restart();
  running = true;
}

function finishLevel() {
  running = false;
  if (onLevelEnd) onLevelEnd(score >= level.target, score);
}

// ---------- input ----------
document.addEventListener("keydown", (e) => {
  const k = e.key;
    if (!running) return;
  if (k === "Escape") { quitToMenu(); e.preventDefault(); return; }
  const isAction = k === "Enter" || k === " ";

  if (state === "aim") {
    if (k === "ArrowUp" && cursorRow > 0) cursorRow--;
    else if (k === "ArrowDown" && cursorRow < ROWS - 1) cursorRow++;
    else if (k === "ArrowLeft" && cursorCol > 0) cursorCol--;
    else if (k === "ArrowRight" && cursorCol < COLS - 1) cursorCol++;
    else if (isAction) {
      power = 0;
      powerDir = 1;
      state = "power";
    } else return;
  } else if (state === "power") {
    if (!isAction) return;
    launchShot();
    } else if (state === "done") {
    return;
  } else {
    return;
  }
  e.preventDefault();
});

// ---------- update ----------
function update(dt) {
  if (state === "power") {
    power += powerDir * level.speed * 50 * dt; // speed 2 = 100% per second
    if (power >= 100) { power = 100; powerDir = -1; }
    else if (power <= 0) { power = 0; powerDir = 1; }
  } else if (state === "flying") {
    flight.t += dt / flight.duration;
    if (flight.t >= 1) {
      flight.t = 1;
      score += pendingPoints;
      message = pendingText;
      state = "result";
      resultTimer = 1.6;
    }
  } else if (state === "result") {
    resultTimer -= dt;
    if (resultTimer <= 0) startNextShotOrFinish();
  }
}

// ---------- drawing ----------
function pointColor(p) {
  if (p >= 5) return "#ff5a4f";
  if (p >= 3) return "#ffd23f";
  if (p >= 2) return "#f4a63a";
  return "#9aa5b1";
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, "#1b3a5c");
  sky.addColorStop(1, "#5d8fb8");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, GROUND_Y);

  for (let i = 0; i < 8; i++) {
    const y = GROUND_Y + (i * (canvas.height - GROUND_Y)) / 8;
    ctx.fillStyle = i % 2 === 0 ? "#2f8f3a" : "#37a043";
    ctx.fillRect(0, y, canvas.width, (canvas.height - GROUND_Y) / 8 + 1);
  }
}

function drawNet() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.fillRect(GOAL_X, GOAL_Y, GOAL_W, GOAL_H);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth = 1;
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(GOAL_X + c * CELL_W, GOAL_Y);
    ctx.lineTo(GOAL_X + c * CELL_W, GROUND_Y);
    ctx.stroke();
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(GOAL_X, GOAL_Y + r * CELL_H);
    ctx.lineTo(GOAL_X + GOAL_W, GOAL_Y + r * CELL_H);
    ctx.stroke();
  }
}

function drawPoints() {
  ctx.font = "bold 26px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      ctx.fillStyle = pointColor(points[r][c]);
      ctx.fillText(points[r][c], cellX(c), cellY(r));
    }
  }
}

function drawCursor() {
  const x = GOAL_X + cursorCol * CELL_W;
  const y = GOAL_Y + cursorRow * CELL_H;
  const locked = state !== "aim";
  ctx.fillStyle = locked ? "rgba(80, 220, 120, 0.3)" : "rgba(255, 210, 63, 0.3)";
  ctx.fillRect(x, y, CELL_W, CELL_H);
  ctx.strokeStyle = locked ? "#50dc78" : "#ffd23f";
  ctx.lineWidth = 4;
  ctx.strokeRect(x + 2, y + 2, CELL_W - 4, CELL_H - 4);
}

function drawPosts() {
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(GOAL_X, GROUND_Y);
  ctx.lineTo(GOAL_X, GOAL_Y);
  ctx.lineTo(GOAL_X + GOAL_W, GOAL_Y);
  ctx.lineTo(GOAL_X + GOAL_W, GROUND_Y);
  ctx.stroke();
}

function drawBall(x, y, radius) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.beginPath();
  ctx.ellipse(x, y + radius, radius, radius * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#222";
  const patches = [[0, 0, 0.35], [-0.65, -0.3, 0.2], [0.65, -0.3, 0.2],
                   [-0.4, 0.65, 0.2], [0.4, 0.65, 0.2]];
  for (const [px, py, size] of patches) {
    ctx.beginPath();
    ctx.arc(x + px * radius, y + py * radius, size * radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFlyingBall() {
  const t = flight.t;
  const x = flight.fromX + (flight.toX - flight.fromX) * t;
  const y = flight.fromY + (flight.toY - flight.fromY) * t
            - 4 * flight.arc * t * (1 - t);
  const r = BALL_R + (flight.endRadius - BALL_R) * t; // shrinks = further away
  drawBall(x, y, Math.max(r, 4));
}

function drawPowerBar() {
  const x = 250, y = 498, w = 400, h = 22;
  const zone = (a, b, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x + (a / 100) * w, y, ((b - a) / 100) * w, h);
  };
  zone(0, level.sweetMin, "#a9791c");               // lower
  zone(level.sweetMin, level.sweetMax, "#2fbf5b");  // exact
  zone(level.sweetMax, 100, "#b3362f");             // higher

  // marker
  const mx = x + (power / 100) * w;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(mx - 3, y - 6, 6, h + 12);

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  ctx.font = "14px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("lower", x + (level.sweetMin / 200) * w, y - 12);
  ctx.fillText("exact", x + ((level.sweetMin + level.sweetMax) / 200) * w, y - 12);
  ctx.fillText("higher", x + ((level.sweetMax + 100) / 200) * w, y - 12);
}

function drawHud() {
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px Arial";
  ctx.textAlign = "left";
    ctx.fillText("LEVEL " + currentLevelNum + "  |  Shot " + shot + "/" + level.shots, 20, 30);
  ctx.textAlign = "right";
  ctx.fillText("Score " + score + " / " + level.target, canvas.width - 20, 30);

  ctx.font = "18px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";

  if (state === "aim") {
    ctx.fillText(
      "Target: row " + (cursorRow + 1) + ", column " + (cursorCol + 1) +
        " = " + points[cursorRow][cursorCol] + " points",
      canvas.width / 2, 545);
    ctx.fillStyle = "#d8e6d8";
    ctx.fillText("Arrow keys: move    Enter: lock target", canvas.width / 2, 525);
  } else if (state === "power") {
    ctx.fillText("Press Space or Enter to shoot!", canvas.width / 2, 545);
  } else if (state === "result") {
    ctx.fillText(message, canvas.width / 2, 545);
  }
}

function drawDone() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const passed = score >= level.target;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = passed ? "#50dc78" : "#ff6b5f";
  ctx.font = "bold 44px Arial";
  ctx.fillText(passed ? "LEVEL COMPLETE!" : "LEVEL FAILED", canvas.width / 2, 220);

  ctx.fillStyle = "#ffffff";
  ctx.font = "26px Arial";
  ctx.fillText("Your score: " + score + "   Target: " + level.target,
               canvas.width / 2, 290);
  ctx.font = "20px Arial";
  ctx.fillText("Press Enter to play again", canvas.width / 2, 350);
}

function draw() {
  drawBackground();
  drawNet();
  drawPoints();
  drawCursor();
  drawPosts();

  if (state === "flying" || state === "result") {
    if (flight) {
      // after landing the ball stays where it ended
      drawFlyingBall();
    }
  } else {
    drawBall(BALL_X, BALL_Y, BALL_R);
  }

  if (state === "power") drawPowerBar();
  drawHud();
  
}

// ---------- main loop ----------
let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);