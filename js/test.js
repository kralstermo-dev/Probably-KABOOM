// Test page: shows every module at once, with a fake bomb, so you can see how each one looks and fits.
// It is for you (and for screenshots). The real game does not use this file.
const rand = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rand(arr.length)];
const ALL_PORTS = ["DVI", "HDMI", "USB-C", "Parallel", "Audio Jack", "Display Port", "Ethernet", "XLR"];

function makeSerial() {                       // same recipe as the real bomb
  const letters = "BCDFGHJKLMNPQRSTVWXZ", digits = "0123456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += Math.random() < 0.5 ? pick(letters) : pick(digits);
  s += pick(digits);
  if ((s.match(/\d/g) || []).length < 2) s = s[0] + pick(digits) + s.slice(2);
  return s;
}

let bomb = null;
function newFakeBomb(level) {
  return {
    serial: makeSerial(),
    batteries: Array.from({ length: rand(5) }, () => pick(["AA", "D"])),
    ports: [...ALL_PORTS].sort(() => Math.random() - 0.5).slice(0, rand(5)),
    timeLeft: 300, tickedAt: Date.now(), strikes: 0, running: true, slots: [], level
  };
}
// The modules call these two, just like in the real game:
function solveModule(i) { bomb.slots[i].solved = true; document.getElementById("slot-" + i).classList.add("solved"); }
function addStrike() { bomb.strikes++; document.getElementById("strikes").textContent = bomb.strikes; }

const NAMES = Object.keys(window).filter((k) => /^mount[A-Z]/.test(k) && typeof window[k] === "function").sort();
const pretty = (n) => n.replace(/^mount/, "").replace(/([a-z])([A-Z])/g, "$1 $2");
const $ = (id) => document.getElementById(id);

function remountSlot(i) {
  const slot = $("slot-" + i);
  slot.className = "slot";
  slot.innerHTML = `<span class="led"></span><div class="slot-body"></div>`;
  bomb.slots[i] = { solved: false };
  try { window[NAMES[i]](slot, i); }
  catch (e) { slot.classList.add("broken"); slot.querySelector(".slot-body").textContent = "Error: " + e.message; console.error(NAMES[i], e); }
}

function build() {
  bomb = newFakeBomb(Number($("level").value));
  $("strikes").textContent = "0";
  $("info").textContent = `Serial ${bomb.serial}  |  Batteries: ${bomb.batteries.join(", ") || "none"}  |  Ports: ${bomb.ports.join(", ") || "none"}`;
  $("gallery").innerHTML = NAMES.map((n, i) =>
    `<div class="test-cell"><div class="slot" id="slot-${i}"></div><div class="cap"><span>${pretty(n)}</span><button data-i="${i}" title="Re-roll this module">&#8635;</button></div></div>`).join("");
  NAMES.forEach((_, i) => remountSlot(i));
}

$("level").onchange = $("newBomb").onclick = build;
$("size").onchange = () => { $("gallery").className = "gallery " + $("size").value; };
$("zoom").onchange = () => { $("gallery").style.zoom = $("zoom").value; };
$("gallery").addEventListener("click", (e) => { if (e.target.dataset.i !== undefined && e.target.closest(".cap")) remountSlot(Number(e.target.dataset.i)); });
setInterval(() => {                         // a fake bomb timer that counts down, so the Timer and Reactor modules can be tried
  if (!bomb) return;
  bomb.timeLeft = Math.max(1, bomb.timeLeft - 1);
  bomb.tickedAt = Date.now();
  $("fakeTimer").textContent = Math.floor(bomb.timeLeft / 60) + ":" + String(bomb.timeLeft % 60).padStart(2, "0");
}, 1000);
build();

// ---- Are all module files there? ----
const EXPECTED = { mountWires: "wires.js", mountButton: "button.js", mountTimerModule: "timer.js", mountMorse: "morse.js", mountMath: "math.js",
  mountHex: "hex.js", mountResistor: "resistor.js", mountKeypad: "keypad.js", mountCompass: "compass.js", mountColors: "colors.js",
  mountLights: "lights.js", mountBinary: "binary.js", mountClock: "clock.js", mountAlchemy: "alchemy.js", mountSliders: "sliders.js",
  mountMultibuttons: "multibuttons.js", mountLogic: "logic.js", mountPasswords: "passwords.js", mountSimon: "simon.js", mountTiles: "tiles.js",
  mountFuses: "fuses.js", mountMazes: "mazes.js", mountReactor: "reactor.js" };
const missingFiles = Object.keys(EXPECTED).filter((k) => typeof window[k] !== "function").map((k) => EXPECTED[k]);
if (missingFiles.length) $("warn").textContent = "Missing module files: " + missingFiles.join(", ") + ". Copy them into js/modules/.";
if (typeof BUILD !== "undefined") $("build").textContent = BUILD + " | " + NAMES.length + " of " + Object.keys(EXPECTED).length + " modules loaded";

// ---- Do the modules still say the same as the manual? (needs Live Server or GitHub Pages, not a file opened straight from the folder) ----
async function checkManual() {
  let md;
  try { md = await (await fetch("manual.md")).text(); } catch (e) { $("checkOut").textContent = "Could not read manual.md. Open this page with Live Server or on GitHub Pages."; return; }
  const out = [], sec = (a, b) => md.slice(md.indexOf(a), md.indexOf(b));
  const run = (name, fn) => { try { out.push((fn() ? "OK    " : "DIFF  ") + name + (fn() ? "" : "   <- the module and the manual say different things")); } catch (e) { out.push("??    " + name + "   (could not check: " + e.message + ")"); } };
  run("Keypad", () => { const rows = [...sec("# Module 8: Keypad", "# Module 9").matchAll(/^\| (\S+) \| (\S+) \| (\S+) \| (\S+) \|$/gm)].map((m) => m.slice(1, 5));
    return JSON.stringify([0, 1, 2, 3].map((c) => rows.map((r) => r[c]))) === JSON.stringify(KEYPAD_COLUMNS); });
  run("Simon Says", () => { const s = sec("# Module 19", "# Module 20"); let n = 0, ok = true;
    for (const t of ["A", "B"]) { const part = s.slice(s.indexOf(`### **Table ${t}:**`)).split("**Example:**")[0].split("### **Table B:**")[t === "A" ? 0 : 1];
      for (const m of part.matchAll(/\| <span class="band (\w+)">\w+<\/span> \| <span class="band (\w+)">\w+<\/span> \| <span class="band (\w+)">\w+<\/span> \| <span class="band (\w+)">\w+<\/span> \|/g)) { n++; if (SIMON_TABLES[t][m[1]].join() !== [m[2], m[3], m[4]].join()) ok = false; } }
    return ok && n === 8; });
  run("Fuses", () => [...sec("# Module 21", "# Module 22").matchAll(/band (\w+)">\w+<\/span> \| (\d+) A/g)].map((m) => m[1] + m[2]).join() === FUSE_TYPES.map((f) => f.color + f.amps).join());
  run("Colors", () => [...sec("# Module 10", "# Module 11").matchAll(/band (\w+)">\w+<\/span> \| (\d)/g)].every((m) => COLOR_TABLE[m[1]].n === Number(m[2])));
  run("Clock Reading", () => [...sec("# Module 13", "# Module 14").matchAll(/\| (\d+) \| (\w+) \| (\d+) \| (\w+) \|/g)].every((m) => CLOCK_WORDS[m[1] - 1] === m[2] && CLOCK_WORDS[m[3] - 1] === m[4]));
  run("Morse Code", () => [...sec("# Module 4", "# Module 5").matchAll(/\| ([A-Z]) \| ([•– ]+) \|/g)].every((m) => MORSE[m[1]] === m[2].trim().split(" ").map((x) => (x === "•" ? "." : "-")).join("")));
  run("Hexadecimal", () => [...sec("# Module 6", "# Module 7").matchAll(/\| ([0-9a-f]{2}) \| (\w) \|/g)].every((m) => hexOf(m[2]) === m[1]));
  run("Bad Alchemy", () => [...sec("# Module 14", "# Module 15").matchAll(/\| (\w\w) \| \w+ \| <span class="band (\w+)"/g)].every((m) => ELEMENT_PIGMENT[m[1]] === m[2]));
  run("Resistor", () => { const rows = [...sec("# Module 7", "# Module 8").matchAll(/^\| <span class="band (\w+)">(\d) \(/gm)]; return rows.length === 10 && rows.every((m) => BAND_COLORS[Number(m[2])][0] === m[1]); });
  run("Mazes", () => { const svgs = md.match(/<svg.*?<\/svg>/gs).filter((s) => /stroke="#d62828"/.test(s));
    return svgs.length === MAZES.length && svgs.every((s, i) => { const p = /<path d="([^"]*)"/.exec(s)[1], v = new Set(), h = new Set();
      for (const m of p.matchAll(/M(\d+) (\d+)v20/g)) v.add((m[2] - 14) / 20 + "," + ((m[1] - 14) / 20 - 1));
      for (const m of p.matchAll(/M(\d+) (\d+)h20/g)) h.add((m[2] - 14) / 20 - 1 + "," + (m[1] - 14) / 20);
      const cells = []; for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) cells.push((r > 0 && !h.has(r - 1 + "," + c) ? "U" : "") + (r < 5 && !h.has(r + "," + c) ? "D" : "") + (c > 0 && !v.has(r + "," + (c - 1)) ? "L" : "") + (c < 5 && !v.has(r + "," + c) ? "R" : ""));
      return cells.join() === MAZES[i].cells.join(); }); });
  $("checkOut").textContent = out.join("\n");
}
$("checkBtn").onclick = checkManual;
