// Fuses module (manual: Module 21). Remove every fuse rated higher than the limit, then click Confirm.
const FUSES_DEBUG = false;   // set to true to print the limit in the browser console while testing
const FUSE_TYPES = [         // the manual's color table
  { color: "grey", amps: 2, hex: "#9aa5b1" }, { color: "tan", amps: 5, hex: "#d2b48c" }, { color: "red", amps: 10, hex: "#d62828" },
  { color: "blue", amps: 15, hex: "#2563eb" }, { color: "yellow", amps: 20, hex: "#fcd34d" }, { color: "green", amps: 30, hex: "#2a9d3f" }
];

function fuseLimit(bomb) {   // first rule that applies
  if (bomb.ports.includes("XLR")) return 10;
  if (bomb.batteries.length > 2) return 15;
  if (Number(bomb.serial.slice(-1)) % 2 === 0) return 5;
  return 20;
}

function mountFuses(slotEl, slotIndex) {
  const limit = fuseLimit(bomb);
  let fuses;
  do { fuses = Array.from({ length: 3 + bomb.level }, () => pick(FUSE_TYPES)); }                 // at least one fuse to remove, and one to keep
  while (!fuses.some((f) => f.amps > limit) || !fuses.some((f) => f.amps <= limit));
  if (FUSES_DEBUG) console.log("Fuses: limit", limit, "-> remove", fuses.map((f, i) => (f.amps > limit ? i : "")).join(" "));

  const box = document.createElement("div");
  box.className = "fuses-module";
  box.innerHTML = `<div class="fuses-row">${fuses.map((f) => `<button class="fuse" style="--c:${f.hex}"></button>`).join("")}</div>
    <button class="confirm-btn">Confirm</button>`;
  slotEl.querySelector(".slot-body").replaceChildren(box);

  const els = [...box.querySelectorAll(".fuse")];
  const live = () => bomb.running && !bomb.slots[slotIndex].solved;
  els.forEach((e) => e.addEventListener("click", () => { if (live()) e.classList.toggle("out"); }));   // click again to put it back
  box.querySelector(".confirm-btn").addEventListener("click", () => {
    if (!live()) return;
    if (fuses.every((f, i) => els[i].classList.contains("out") === f.amps > limit)) solveModule(slotIndex);
    else addStrike();
  });
}
