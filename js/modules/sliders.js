// Sliders module (manual: Module 15). Four sliders, 0 to 9, each with a target worked out from the bomb.
const SLIDERS_DEBUG = false;   // set to true to print the targets in the browser console while testing
const SLIDER_COLORS = { red: "#e0322b", green: "#2fb34a", blue: "#2f6fe4", yellow: "#f2c41c" };
const clamp9 = (v) => Math.max(0, Math.min(9, v));

function slidersTargets(b) {
  const digits = (b.serial.match(/\d/g) || []).length, last = Number(b.serial.slice(-1));
  const t = { red: b.batteries.length, green: b.ports.length, blue: last, yellow: digits };
  if (b.ports.includes("HDMI")) t.blue = clamp9(t.blue + 1);                                    // adjustment 1
  if (b.batteries.filter((x) => x === "AA").length >= 2) [t.red, t.green] = [t.green, t.red];   // adjustment 2: swap
  if (last % 2 === 0) t.yellow = clamp9(t.yellow - 1);                                          // adjustment 3
  return t;
}

function mountSliders(slotEl, slotIndex) {
  const target = slidersTargets(bomb);
  const names = Object.keys(SLIDER_COLORS).sort(() => Math.random() - 0.5);   // the sliders sit in a random order
  if (SLIDERS_DEBUG) console.log("Sliders:", JSON.stringify(target));

  const box = document.createElement("div");
  box.className = "sliders-module";
  box.innerHTML = `<div class="sliders-grid">${names.map((n) =>
    `<label class="slider-row" style="--c:${SLIDER_COLORS[n]}"><input type="range" min="0" max="9" step="1" value="${rand(10)}" data-color="${n}"><output></output></label>`).join("")}</div>
    <button class="confirm-btn">Confirm</button>`;
  slotEl.querySelector(".slot-body").replaceChildren(box);

  const rows = [...box.querySelectorAll(".slider-row")];
  rows.forEach((r) => {
    const input = r.querySelector("input"), out = r.querySelector("output");
    out.textContent = input.value;
    input.addEventListener("input", () => { out.textContent = input.value; });
  });
  box.querySelector(".confirm-btn").addEventListener("click", () => {
    if (!bomb.running || bomb.slots[slotIndex].solved) return;
    const right = rows.every((r) => { const i = r.querySelector("input"); return Number(i.value) === target[i.dataset.color]; });
    if (right) { solveModule(slotIndex); rows.forEach((r) => (r.querySelector("input").disabled = true)); }
    else addStrike();
  });
}
