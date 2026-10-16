// Reactor Startup module (manual: Module 23). Four stages; later stages use the numbers of earlier ones.
const REACTOR_DEBUG = false;   // set to true to print the answers in the browser console while testing
const REACTOR_STAGES = ["Coolant", "Access Code", "Control Rods", "Ignition"];

function reactorTargets(bomb) {
  const serialDigits = (bomb.serial.match(/\d/g) || []).length;
  const coolant = bomb.batteries.length + bomb.ports.length;                                // stage 1
  const code = [coolant, Number(bomb.serial.slice(-1)), serialDigits];                      // stage 2: three digits
  const rods = [code[0] > 4, code[1] % 2 === 1, code[2] % 2 === 0, bomb.ports.includes("HDMI")];   // stage 3: switches 1-4
  return { coolant, code, rods, digit: code[2] };                                           // stage 4: the code's last digit
}

function mountReactor(slotEl, slotIndex) {
  const t = reactorTargets(bomb);
  if (REACTOR_DEBUG) console.log("Reactor:", JSON.stringify(t));
  const box = document.createElement("div");
  box.className = "reactor-module";
  box.innerHTML = `<div class="reactor-head"><span class="reactor-lamps"><i></i><i></i><i></i><i></i></span><b></b></div><div class="reactor-stage"></div>`;
  slotEl.querySelector(".slot-body").replaceChildren(box);

  const lamps = [...box.querySelectorAll(".reactor-lamps i")], title = box.querySelector(".reactor-head b"), area = box.querySelector(".reactor-stage");
  const live = () => bomb.running && !bomb.slots[slotIndex].solved;
  let stage = 0;

  function pass() {                                   // this stage is done: go on to the next one, or finish
    stage++;
    if (stage < 4) return show();
    lamps.forEach((l) => { l.className = "done"; });
    title.textContent = "Online";
    area.textContent = "Reactor online";
    solveModule(slotIndex);
  }
  function check(ok) { if (!live()) return; if (ok) pass(); else addStrike(); }   // a mistake is a strike, and you stay in the same stage

  function show() {
    lamps.forEach((l, i) => { l.className = i < stage ? "done" : i === stage ? "now" : ""; });
    title.textContent = REACTOR_STAGES[stage];
    if (stage === 0) {
      area.innerHTML = `<label class="reactor-slider"><input type="range" min="0" max="8" step="1" value="${rand(9)}"><output></output></label><button class="confirm-btn">Confirm</button>`;
      const s = area.querySelector("input"), o = area.querySelector("output");
      o.textContent = s.value; s.addEventListener("input", () => { o.textContent = s.value; });
      area.querySelector(".confirm-btn").addEventListener("click", () => check(Number(s.value) === t.coolant));
    } else if (stage === 1) {
      area.innerHTML = `<input maxlength="3" inputmode="numeric" placeholder="code" autocomplete="off"><button class="confirm-btn">Confirm</button>`;
      const i = area.querySelector("input");
      const go = () => { if (i.value.trim() === "") return; const ok = i.value.trim() === t.code.join(""); if (!ok) i.value = ""; check(ok); };
      area.querySelector(".confirm-btn").addEventListener("click", go);
      i.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
    } else if (stage === 2) {
      area.innerHTML = `<div class="rods">${[1, 2, 3, 4].map((n) => `<button class="sw">${n}</button>`).join("")}</div><button class="confirm-btn">Confirm</button>`;
      const sw = [...area.querySelectorAll(".sw")];
      sw.forEach((b) => b.addEventListener("click", () => { if (live()) b.classList.toggle("on"); }));
      area.querySelector(".confirm-btn").addEventListener("click", () => check(sw.every((b, i) => b.classList.contains("on") === t.rods[i])));
    } else {
      area.innerHTML = `<button class="ignite">Ignite</button>`;
      area.querySelector(".ignite").addEventListener("click", () => {
        const now = bomb.timeLeft, sinceTick = Date.now() - (bomb.tickedAt || 0);
        // the last digit of the timer's seconds is the last digit of timeLeft; a press up to 0.3 s after the display changed still counts
        check(now % 10 === t.digit || ((now + 1) % 10 === t.digit && sinceTick < 300));
      });
    }
  }
  show();
}
