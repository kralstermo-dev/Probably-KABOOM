// ---------- Settings ----------
const MAX_STRIKES = 3;
const MAX_SAME_MODULE = 2;     // at most this many of the same module type on one bomb
const SPEED_PER_STRIKE = 0.25;  // each strike makes the timer 25% faster
const ALL_PORTS = ["DVI", "HDMI", "USB-C", "Parallel", "Audio Jack", "Display Port", "Ethernet", "XLR"];
const BATTERY_TYPES = ["AA", "D"];

// ---------- Difficulty ----------
// The level (0, 1 or 2) is also stored as bomb.level, so single modules can get harder too.
const DIFFICULTIES = {
  easy:   { name: "Easy",   level: 0, modules: 2, seconds: 180 },   // 3:00
  normal: { name: "Normal", level: 1, modules: 4, seconds: 270 },   // 4:30
  hard:   { name: "Hard",   level: 2, modules: 6, seconds: 360 }    // 6:00
};
const MIN_OWN_TIER = [0, 1, 2];   // a bomb always has at least this many modules from its own difficulty
// Every module belongs to the easiest difficulty it can appear on (0 easy, 1 normal, 2 hard).
// A bomb can use modules of its own tier and of any easier tier, never harder ones.
const MODULE_TIERS = {
  mountWires: 0, mountButton: 0, mountTimerModule: 0, mountColors: 0, mountCompass: 0, mountClock: 0, mountFuses: 0,
  mountMorse: 1, mountMath: 1, mountHex: 1, mountResistor: 1, mountKeypad: 1, mountBinary: 1, mountAlchemy: 1, mountMultibuttons: 1,
  mountLights: 2, mountSliders: 2, mountLogic: 2, mountPasswords: 2, mountSimon: 2, mountTiles: 2, mountMazes: 2, mountReactor: 2
};

// ---------- Helpers ----------
const rand = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rand(arr.length)];
const $ = (id) => document.getElementById(id);

function makeSerial() {
  const letters = "BCDFGHJKLMNPQRSTVWXZ"; // no vowels, so no accidental words
  const digits = "0123456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += Math.random() < 0.5 ? pick(letters) : pick(digits);
  s += pick(digits);   // last character is always a digit
  if ((s.match(/\d/g) || []).length < 2) s = s[0] + pick(digits) + s.slice(2);   // always at least two digits
  return s;
}

function makePorts() {                       // 0 to 4 different ports
  const shuffled = [...ALL_PORTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, rand(5));
}

function makeBatteries() {                   // 0 to 4 batteries, each AA or D
  const count = rand(5);
  const list = [];
  for (let i = 0; i < count; i++) list.push(pick(BATTERY_TYPES));
  return list;
}

// ---------- Bomb state ----------
// The bomb is made when the player presses Start, so it fits the chosen difficulty.
// Manual rules read from here, e.g. bomb.batteries.includes("AA") or bomb.batteries.length >= 2
let bomb = null;
function newBomb(d) {
  return {
    serial: makeSerial(),
    batteries: makeBatteries(),   // e.g. ["AA", "D", "AA"]
    ports: makePorts(),           // e.g. ["DVI", "XLR"]
    timeLeft: d.seconds,
    strikes: 0,
    running: false,
    slots: [],
    level: d.level                // 0 easy, 1 normal, 2 hard
  };
}
let tickHandle = null;

// ---------- Display ----------
function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// Drawings of every port (the same ones shown on manual page 42). w and h are the upright size in pixels.
const PORT_ART = {
  "DVI":          { w: 36,  h: 153, html: `<div class="conn dvi"><span class="hole"></span><div class="shell"><div class="pins"></div><div class="divider"></div><div class="blade"></div></div><span class="hole"></span></div>` },
  "HDMI":         { w: 52,  h: 150, html: `<div class="conn shape hdmi"><div class="tongue"><div class="dots d10"></div><div class="dots d9"></div></div></div>` },
  "USB-C":        { w: 40,  h: 120, html: `<div class="conn usbc"><div class="usbc-tongue"></div></div>` },
  "Parallel":     { w: 48,  h: 204, html: `<div class="conn dsub"><i class="ring l"></i><div class="shape db"><div class="db-face"><div class="dots d13"></div><div class="dots d12"></div></div></div><i class="ring r"></i></div>` },
  "Audio Jack":   { w: 84,  h: 84,  html: `<div class="shape hex"><div class="bore"></div></div>` },
  "Display Port": { w: 52,  h: 150, html: `<div class="conn shape displayport"><div class="tongue"><div class="dots d10"></div><div class="dots d10"></div></div></div>` },
  "Ethernet":     { w: 100, h: 84,  html: `<div class="shape rj45"><div class="dots d8"></div></div>` },
  "XLR":          { w: 112, h: 112, html: `<div class="flange"><i class="ring tl"></i><i class="ring br"></i><div class="xlr"><i class="sock s1"></i><i class="sock s2"></i><i class="sock s3"></i></div></div>` }
};

const PORT_SCALE = 0.42;   // every port is drawn at this size, however many ports the bomb has (raise it for bigger ports)

function portsHTML(list) {
  return list.map((name) => {
    const p = PORT_ART[name];
    return `<div class="port" style="--s:${PORT_SCALE};height:${Math.round(p.h * PORT_SCALE)}px">${p.html}</div>`;
  }).join("");
}

function renderInfo() {
  $("serial").textContent = bomb.serial;
  $("batteries").innerHTML = bomb.batteries
    .map((t) => `<div class="battery ${t.toLowerCase()}"><span>${t}</span></div>`)
    .join("");
  $("ports").innerHTML = portsHTML(bomb.ports);
}
function renderTimer() { $("timer").textContent = formatTime(bomb.timeLeft); }
function renderStrikes() {
  let html = "";
  for (let i = 0; i < MAX_STRIKES; i++) {
    html += `<span class="${i < bomb.strikes ? "on" : ""}">X</span> `;
  }
  $("strikes").innerHTML = html;
}
function say(text) { $("message").textContent = text; }

// ---------- 3D rotation ----------
let rotX = -10, rotY = 15;
const cube = $("cube");
const scene = $("scene");

function applyRotation() {
  cube.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
}
function fitToScreen() {
  const scale = Math.min(1, (window.innerWidth - 20) / 600, (window.innerHeight - 140) / 460);
  scene.style.transform = `scale(${scale})`;
}

let dragging = false, lastX = 0, lastY = 0;

// Stop the browser from dragging selected text or "image ghosts" instead of turning the bomb.
scene.addEventListener("dragstart", (e) => e.preventDefault());
scene.addEventListener("mousedown", (e) => { if (!e.target.closest("button, input, .wire, .seg")) e.preventDefault(); });
scene.addEventListener("pointerdown", (e) => {
  if (e.target.closest("button, .wire, input, .seg")) return;   // clicks on controls should not spin the bomb
  dragging = true;
  if (window.getSelection) window.getSelection().removeAllRanges();   // drop any selected page text
  lastX = e.clientX;
  lastY = e.clientY;
  cube.classList.remove("snap");
  scene.classList.add("dragging");
  scene.setPointerCapture(e.pointerId);
});
scene.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  rotY += (e.clientX - lastX) * 0.5;
  rotX -= (e.clientY - lastY) * 0.5;
  rotX = Math.max(-80, Math.min(80, rotX));
  lastX = e.clientX;
  lastY = e.clientY;
  applyRotation();
});
function stopDrag() { dragging = false; scene.classList.remove("dragging"); }
scene.addEventListener("pointerup", stopDrag);
scene.addEventListener("pointercancel", stopDrag);

function snapTo(x, y) {
  cube.classList.add("snap");
  rotX = x;
  rotY = y;
  applyRotation();
}

// ---------- Slots ----------
// Picks which modules go on this bomb: its own tier and easier ones, at most MAX_SAME_MODULE of any type,
// and always at least MIN_OWN_TIER modules from the bomb's own difficulty.
function chooseModules(level, count) {
  const pool = Object.keys(MODULE_TIERS).filter((n) => window[n] && MODULE_TIERS[n] <= level);
  const own = pool.filter((n) => MODULE_TIERS[n] === level);
  const picked = [], used = new Map();
  const add = (list) => {
    const options = list.filter((n) => (used.get(n) || 0) < MAX_SAME_MODULE);
    if (!options.length) return false;
    const name = pick(options);
    used.set(name, (used.get(name) || 0) + 1);
    picked.push(name);
    return true;
  };
  for (let i = 0; i < MIN_OWN_TIER[level]; i++) add(own);
  while (picked.length < count && add(pool)) { /* keep adding */ }
  return picked.sort(() => Math.random() - 0.5);       // so the harder ones are not always in the same slots
}

// Each slot has an LED (top right) that turns green when the module is solved.
function buildSlots(d) {
  chooseModules(d.level, d.modules).forEach((name, i) => {
    bomb.slots.push({ solved: false });
    const div = document.createElement("div");
    div.className = "slot";
    div.id = `slot-${i}`;
    div.innerHTML = `<span class="led"></span><div class="slot-body"></div>`;
    $(i < 2 ? "slots-front" : "slots-back").appendChild(div);
    window[name](div, i);
  });
}

// ---------- Game actions (modules will call these) ----------
function solveModule(i) {
  if (bomb.slots[i].solved) return;
  bomb.slots[i].solved = true;
  const el = $(`slot-${i}`);
  el.classList.add("solved");                       // this also lights the LED
  if (!el.querySelector(".wires, .button-module, .gauge-module, .math-module, .morse-module, .hex-module, .resistor-module, .keypad-module, .compass-module, .colors-module, .lights-module, .binary-module, .clock-module, .sliders-module, .multi-grid, .logic-module, .alchemy-module, .passwords-module, .simon-module, .tiles-grid, .fuses-module, .mazes-module, .reactor-module")) el.querySelector(".slot-body").innerHTML = "<span>Module solved</span>";
  if (bomb.slots.every((s) => s.solved)) win();
}

function addStrike() {
  bomb.strikes++;
  renderStrikes();
  document.querySelectorAll(".face").forEach((f) => {
    f.classList.remove("flash");
    void f.offsetWidth;
    f.classList.add("flash");
  });
  if (bomb.strikes >= MAX_STRIKES) lose("Three strikes. Probably not that one.");
  else say("Strike! Probably not that one. The timer just got faster.");
}

// The timer reschedules itself every second, and the delay shrinks with each strike.
function scheduleTick() {
  const delay = 1000 / (1 + SPEED_PER_STRIKE * bomb.strikes);
  tickHandle = setTimeout(() => {
    tick();
    if (bomb.running) scheduleTick();
  }, delay);
}

function tick() {
  bomb.timeLeft--;
  bomb.tickedAt = Date.now();        // the Reactor's Ignition stage uses this
  renderTimer();
  if (bomb.timeLeft <= 0) lose("Time's up.");
}

// ---------- Start, win and lose ----------
let chosen = null;                                  // the difficulty the player picked

function choose(key) {
  chosen = DIFFICULTIES[key];
  document.querySelectorAll(".diff").forEach((b) => b.classList.toggle("picked", b.dataset.d === key));
  $("startBtn").disabled = false;
  try { localStorage.setItem("pb-difficulty", key); } catch (e) { /* storage can be blocked: ignore it */ }
}

function start() {
  if (!chosen) return;
  bomb = newBomb(chosen);                           // a fresh bomb for this difficulty
  renderInfo();
  renderTimer();
  renderStrikes();
  buildSlots(chosen);
  document.body.classList.remove("pre-start");      // reveal the bomb
  applyRotation();
  fitToScreen();
  bomb.running = true;
  say("Defuse it!");
  scheduleTick();
}

function endGame(won, title, reason) {              // shows the BOOM (or "defused") screen
  bomb.running = false;
  clearTimeout(tickHandle);
  $("endScreen").className = "end " + (won ? "win" : "boom");
  $("endTitle").textContent = title;
  $("endReason").textContent = reason;
  $("endScreen").hidden = false;
}
function win() { endGame(true, "Probably defused!", "Time left: " + formatTime(bomb.timeLeft)); }
function lose(reason) { endGame(false, "BOOM", reason); }

// ---------- Setup ----------
window.addEventListener("resize", fitToScreen);
document.querySelectorAll(".diff").forEach((b) => {
  const d = DIFFICULTIES[b.dataset.d];
  b.querySelector("span").innerHTML = `${d.modules} modules<br>${formatTime(d.seconds).replace(/^0/, "")}`;   // the menu text comes from DIFFICULTIES
  b.addEventListener("click", () => choose(b.dataset.d));
});
const missingMods = Object.keys(MODULE_TIERS).filter((n) => typeof window[n] !== "function");
if (missingMods.length) {                            // a module file that did not load: say so, instead of quietly leaving it out
  $("menuWarn").hidden = false;
  $("menuWarn").textContent = "Missing module files: " + missingMods.map((n) => n.replace(/^mount/, "")).join(", ") + ". Check your js/modules folder.";
}
if (typeof BUILD !== "undefined") $("build").textContent = BUILD;
$("startBtn").onclick = start;
$("frontBtn").onclick = () => snapTo(0, 0);
$("backBtn").onclick = () => snapTo(0, 180);
$("againBtn").onclick = () => location.reload();    // back to the difficulty menu
try { const last = localStorage.getItem("pb-difficulty"); if (DIFFICULTIES[last]) choose(last); } catch (e) { /* ignore */ }
