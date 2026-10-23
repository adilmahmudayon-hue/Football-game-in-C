// ---------- sound effects (made with the Web Audio API, no files needed) ----------
let audioCtx = null;
let masterGain = null;
let noiseBuf = null;
let crowdVoices = [];
let muted = false;
try { muted = localStorage.getItem("fs_muted") === "1"; } catch (e) {}

function ensureAudio() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = muted ? 0 : 0.8;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function noiseBuffer(ctx) {
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

// every crowd sound goes through its own volume node so it can be faded out
function crowdBus(ctx, vol) {
  const g = ctx.createGain();
  g.gain.value = vol;
  g.connect(masterGain);
  crowdVoices.push(g);
  return g;
}

function stopCrowd() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  for (const g of crowdVoices) {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(g.gain.value, t);
    g.gain.linearRampToValueAtTime(0, t + 0.15);
  }
  crowdVoices = [];
}

// ----- whistle: a short blast, then a long one -----
function whistle() {
  const ctx = ensureAudio();
  if (!ctx) return;

  function blast(start, dur) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(2900, start);
    osc.frequency.linearRampToValueAtTime(3000, start + dur);

    // fast vibrato gives the "pea" trill
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 38;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 70;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(0.35, start + 0.02);
    g.gain.setValueAtTime(0.35, start + dur - 0.05);
    g.gain.linearRampToValueAtTime(0, start + dur);

    // breath noise
    const n = ctx.createBufferSource();
    n.buffer = noiseBuffer(ctx);
    n.loop = true;
    const nf = ctx.createBiquadFilter();
    nf.type = "highpass";
    nf.frequency.value = 3500;
    const ng = ctx.createGain();
    ng.gain.value = 0.06;
    n.connect(nf);
    nf.connect(ng);
    ng.connect(g);

    osc.connect(g);
    g.connect(masterGain);
    osc.start(start); lfo.start(start); n.start(start);
    osc.stop(start + dur); lfo.stop(start + dur); n.stop(start + dur);
  }

  const t0 = ctx.currentTime;
  blast(t0, 0.18);
  blast(t0 + 0.28, 0.5);
}

// ----- applause: lots of tiny noise bursts -----
function clapBurst(ctx, bus, when, vol) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  const f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = 1200 + Math.random() * 1800;
  f.Q.value = 0.8;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(vol, when + 0.003);
  g.gain.exponentialRampToValueAtTime(0.001, when + 0.06);
  src.connect(f);
  f.connect(g);
  g.connect(bus);
  src.start(when, Math.random() * 1.5, 0.08);
}

function applause(dur, density, volume) {
  const ctx = ensureAudio();
  if (!ctx) return;
  const bus = crowdBus(ctx, volume);
  const t0 = ctx.currentTime;
  const count = Math.floor(dur * density);
  for (let i = 0; i < count; i++) {
    const pos = Math.random();
    const swell = Math.sin(Math.PI * pos); // quiet start, loud middle, fade out
    clapBurst(ctx, bus, t0 + pos * dur, 0.12 + 0.55 * swell * Math.random());
  }
}

// ----- cheer: a roar of noise plus rising voices -----
function cheer(dur, volume) {
  const ctx = ensureAudio();
  if (!ctx) return;
  const bus = crowdBus(ctx, volume);
  const t0 = ctx.currentTime;

  const n = ctx.createBufferSource();
  n.buffer = noiseBuffer(ctx);
  n.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.Q.value = 0.7;
  f.frequency.setValueAtTime(700, t0);
  f.frequency.linearRampToValueAtTime(1300, t0 + dur * 0.4);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(0.5, t0 + 0.3);
  g.gain.setValueAtTime(0.5, t0 + Math.max(0.4, dur - 0.6));
  g.gain.linearRampToValueAtTime(0, t0 + dur);
  n.connect(f);
  f.connect(g);
  g.connect(bus);
  n.start(t0);
  n.stop(t0 + dur);

  // "yeaaah" voices
  for (let i = 0; i < 6; i++) {
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    const base = 220 + Math.random() * 180;
    o.frequency.setValueAtTime(base, t0);
    o.frequency.linearRampToValueAtTime(base * 1.5, t0 + 0.5);
    o.frequency.linearRampToValueAtTime(base * 1.3, t0 + dur);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1100;
    const vg = ctx.createGain();
    vg.gain.setValueAtTime(0, t0);
    vg.gain.linearRampToValueAtTime(0.05, t0 + 0.3);
    vg.gain.linearRampToValueAtTime(0, t0 + dur);
    o.connect(lp);
    lp.connect(vg);
    vg.connect(bus);
    o.start(t0);
    o.stop(t0 + dur);
  }
}

// ----- groan: a falling "awww" with a few sobs -----
function groan() {
  const ctx = ensureAudio();
  if (!ctx) return;
  const bus = crowdBus(ctx, 0.9);
  const t0 = ctx.currentTime;
  const dur = 1.8;

  for (let i = 0; i < 7; i++) {
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    const base = 330 + Math.random() * 120;
    o.frequency.setValueAtTime(base, t0);
    o.frequency.exponentialRampToValueAtTime(base * 0.6, t0 + dur);

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 5 + Math.random() * 2;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 6;
    lfo.connect(lfoGain);
    lfoGain.connect(o.frequency);

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 700;
    const vg = ctx.createGain();
    vg.gain.setValueAtTime(0, t0);
    vg.gain.linearRampToValueAtTime(0.06, t0 + 0.25);
    vg.gain.linearRampToValueAtTime(0, t0 + dur);
    o.connect(lp);
    lp.connect(vg);
    vg.connect(bus);
    o.start(t0); lfo.start(t0);
    o.stop(t0 + dur); lfo.stop(t0 + dur);
  }

  // murmur
  const n = ctx.createBufferSource();
  n.buffer = noiseBuffer(ctx);
  n.loop = true;
  const nf = ctx.createBiquadFilter();
  nf.type = "bandpass";
  nf.frequency.value = 500;
  nf.Q.value = 0.6;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0, t0);
  ng.gain.linearRampToValueAtTime(0.18, t0 + 0.3);
  ng.gain.linearRampToValueAtTime(0, t0 + dur);
  n.connect(nf);
  nf.connect(ng);
  ng.connect(bus);
  n.start(t0);
  n.stop(t0 + dur);

  // sobs
  [1.0, 1.3, 1.6].forEach((delay) => {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(620, t0 + delay);
    o.frequency.exponentialRampToValueAtTime(380, t0 + delay + 0.18);
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0, t0 + delay);
    sg.gain.linearRampToValueAtTime(0.07, t0 + delay + 0.03);
    sg.gain.linearRampToValueAtTime(0, t0 + delay + 0.2);
    o.connect(sg);
    sg.connect(bus);
    o.start(t0 + delay);
    o.stop(t0 + delay + 0.22);
  });
}

// ----- the one function the game calls -----
function playSound(name) {
  if (muted) return;
  try {
    if (name === "whistle") whistle();
    else if (name === "goal") { applause(2.2, 55, 0.9); cheer(1.4, 0.4); }
    else if (name === "miss") groan();
    else if (name === "celebrate") { stopCrowd(); cheer(3.2, 1); applause(3.2, 70, 0.9); }
  } catch (e) {
    console.error(e);
  }
}

// ----- mute button -----
const muteBtn = document.createElement("button");
muteBtn.style.cssText =
  "position:fixed;top:10px;right:10px;z-index:150;width:44px;height:44px;" +
  "border:0;border-radius:50%;background:rgba(0,0,0,0.6);color:#fff;" +
  "font-size:22px;cursor:pointer;";
muteBtn.title = "Sound on/off";
muteBtn.textContent = muted ? "\uD83D\uDD07" : "\uD83D\uDD0A";
muteBtn.onclick = () => {
  muted = !muted;
  try { localStorage.setItem("fs_muted", muted ? "1" : "0"); } catch (e) {}
  muteBtn.textContent = muted ? "\uD83D\uDD07" : "\uD83D\uDD0A";
  const ctx = ensureAudio();
  if (ctx) {
    masterGain.gain.value = muted ? 0 : 0.8;
    if (muted) stopCrowd();
  }
};
document.body.appendChild(muteBtn);

// browsers only allow sound after the first click or key press
["pointerdown", "keydown"].forEach((ev) =>
  document.addEventListener(ev, () => { if (!muted) ensureAudio(); }, { passive: true })
);