const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ---------- data (same as the C game) ----------
const ROWS = 4;
const COLS = 9;
const KEEPER_W = 3;
const points = [
  [5, 4, 3, 2, 3, 2, 3, 4, 5],
  [4, 3, 2, 1, 2, 1, 2, 3, 4],
  [4, 3, 2, 2, 1, 2, 2, 3, 4],
  [3, 2, 2, 1, 2, 1, 2, 2, 3],
];

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

let flight = null;
let pendingPoints = 0;
let pendingText = "";

// goalkeeper
let keeperX = (COLS - KEEPER_W) / 2; // left edge, in columns (can be fractional)
let keeperDir = 1;

// ---------- goalkeeper ----------
function resetKeeper() {
  keeperX = (COLS - KEEPER_W) / 2;
  keeperDir = 1;
}

function moveKeeper(dt) {
  if (!level.keeperRows) return;
  keeperX += (keeperDir * dt) / level.keeperStep;
  const max = COLS - KEEPER_W;
  if (keeperX >= max) { keeperX = max; keeperDir = -1; }
  else if (keeperX <= 0) { keeperX = 0; keeperDir = 1; }
}

const keeperLeft = () => Math.round(keeperX);

function keeperCovers(row, col) {
  if (!level.keeperRows) return false;
  if (row < ROWS - level.keeperRows) return false;
  const k = keeperLeft();
  return col >= k && col < k + KEEPER_W;
}

// middle column = clean catch
const keeperCaught = (col) => col === keeperLeft() + 1;

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

function makeFlight(toX, toY, arc, endRadius, duration) {
  return { fromX: BALL_X, fromY: BALL_Y, toX, toY, arc,
           startRadius: BALL_R, endRadius, t: 0, duration, next: null };
}

function launchShot() {
  const p = Math.round(power);
  const res = judgeShot(p, cursorRow);
  const x = cellX(cursorCol);

  if (res.type === "hit" && keeperCovers(res.landRow, cursorCol)) {
    // the goalkeeper gets there first
    const y = cellY(res.landRow);
    flight = makeFlight(x, y, 90, 14, 0.8);
    const caught = keeperCaught(cursorCol);
    const next = { fromX: x, fromY: y, startRadius: 14, endRadius: 14,
                   t: 0, next: null };
    if (caught) {
      next.toX = x;
      next.toY = GROUND_Y - 12;
      next.arc = 20;
      next.duration = 0.35;
      pendingText = "SAVED! The goalkeeper caught the ball. No points.";
    } else {
      const side = cursorCol < keeperLeft() + 1 ? -1 : 1;
      next.toX = x + side * 170;
      next.toY = GROUND_Y + 25;
      next.arc = 60;
      next.duration = 0.55;
      pendingText = "SAVED! The goalkeeper pushed the ball away. No points.";
    }
    flight.next = next;
    pendingPoints = 0;
  } else if (res.type === "hit") {
    flight = makeFlight(x, cellY(res.landRow), 90, 14, 0.9);
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
    flight = makeFlight(x, -80, 0, 8, 0.9);
    pendingPoints = 0;
    pendingText = "Way too strong! The ball sailed over the bar.";
  } else {
    flight = makeFlight(x, GROUND_Y + 40, 60, 14, 0.9);
    pendingPoints = 0;
    pendingText = "Way too weak! The ball hit the ground before the goal.";
  }
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
  resetKeeper();
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
  } else {
    return;
  }
  e.preventDefault();
});

// ---------- update ----------
function update(dt) {
  if (!running) return;

  if (state === "aim") {
    moveKeeper(dt);
  } else if (state === "power") {
    moveKeeper(dt);
    power += powerDir * level.speed * 50 * dt; // speed 2 = 100% per second
    if (power >= 100) { power = 100; powerDir = -1; }
    else if (power <= 0) { power = 0; powerDir = 1; }
  } else if (state === "flying") {
    flight.t += dt / flight.duration;
    if (flight.t >= 1) {
      if (flight.next) {
        flight = flight.next;
      } else {
        flight.t = 1;
        score += pendingPoints;
        message = pendingText;
        state = "result";
        resultTimer = 1.6;
      }
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

function drawKeeper() {
  if (!level.keeperRows) return;

  const w = KEEPER_W * CELL_W;
  const h = level.keeperRows * CELL_H;
  const x = GOAL_X + keeperX * CELL_W;
  const y = GROUND_Y - h;
  const cx = x + w / 2;

  // soft shadow on the ground
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.ellipse(cx, GROUND_Y - 2, 60, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // legs
  ctx.strokeStyle = "#1c6f86";
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(cx - 12, y + h * 0.62);
  ctx.lineTo(cx - 22, GROUND_Y - 6);
  ctx.moveTo(cx + 12, y + h * 0.62);
  ctx.lineTo(cx + 22, GROUND_Y - 6);
  ctx.stroke();

  // arms, stretched out wide
  ctx.strokeStyle = "#35c4e8";
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(cx - 24, y + h * 0.3);
  ctx.lineTo(cx - 100, y + h * 0.14);
  ctx.moveTo(cx + 24, y + h * 0.3);
  ctx.lineTo(cx + 100, y + h * 0.14);
  ctx.stroke();

  // gloves
  ctx.fillStyle = "#ffd23f";
  ctx.beginPath();
  ctx.arc(cx - 104, y + h * 0.13, 14, 0, Math.PI * 2);
  ctx.arc(cx + 104, y + h * 0.13, 14, 0, Math.PI * 2);
  ctx.fill();

  // torso
  ctx.fillStyle = "#35c4e8";
  ctx.strokeStyle = "#e9fbff";
  ctx.lineWidth = 3;
  const tw = 56, th = h * 0.42, ty = y + h * 0.22;
  ctx.beginPath();
  ctx.rect(cx - tw / 2, ty, tw, th);
  ctx.fill();
  ctx.stroke();

  // head
  ctx.fillStyle = "#f2c9a0";
  ctx.beginPath();
  ctx.arc(cx, y + h * 0.13, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(cx - 6, y + h * 0.12, 2.5, 0, Math.PI * 2);
  ctx.arc(cx + 6, y + h * 0.12, 2.5, 0, Math.PI * 2);
  ctx.fill();
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

  // show the target's points on top of the keeper too
  if (keeperCovers(cursorRow, cursorCol)) {
    ctx.font = "bold 26px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(points[cursorRow][cursorCol], cellX(cursorCol), cellY(cursorRow));
  }
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
  const r = flight.startRadius + (flight.endRadius - flight.startRadius) * t;
  drawBall(x, y, Math.max(r, 4));
}

function drawPowerBar() {
  const x = 250, y = 498, w = 400, h = 22;
  const zone = (a, b, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x + (a / 100) * w, y, ((b - a) / 100) * w, h);
  };
  zone(0, level.sweetMin, "#a9791c");
  zone(level.sweetMin, level.sweetMax, "#2fbf5b");
  zone(level.sweetMax, 100, "#b3362f");

  const mx = x + (power / 100) * w;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(mx - 3, y - 6, 6, h + 12);

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  ctx.font = "14px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
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

function draw() {
  drawBackground();
  drawNet();
  drawPoints();
  drawKeeper();
  drawCursor();
  drawPosts();

  if ((state === "flying" || state === "result") && flight) {
    drawFlyingBall();
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