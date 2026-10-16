// Binary module (manual: Module 12). Find the target number with the rules, then set the six switches to it.
const BINARY_DEBUG = false;   // set to true to print the answer in the browser console while testing
const BIT_VALUES = [32, 16, 8, 4, 2, 1];   // value of each switch, left to right

// The manual's rules, first match wins. "shown" is the number on the display.
function binaryTarget(shown, bomb) {
  if (bomb.ports.includes("USB-C")) return shown + 10;                     // rule 1
  if (bomb.batteries.length > bomb.ports.length) return shown - bomb.batteries.length;   // rule 2
  if (Number(bomb.serial.slice(-1)) % 2 === 0) return shown * 2;           // rule 3
  return shown;                                                            // rule 4
}

function mountBinary(slotEl, slotIndex) {
  const shown = 5 + rand(21);                    // the display shows 5 to 25, so the target always fits in six switches
  const target = binaryTarget(shown, bomb);
  if (BINARY_DEBUG) console.log("Binary: shown", shown, "-> target", target);

  const box = document.createElement("div");
  box.className = "binary-module";
  box.innerHTML = `<div class="binary-display">${shown}</div>
    <div class="bits">${BIT_VALUES.map(() => `<button class="bit">0</button>`).join("")}</div>
    <button class="confirm-btn">Confirm</button>`;
  slotEl.querySelector(".slot-body").replaceChildren(box);

  const on = BIT_VALUES.map(() => false);
  const bits = [...box.querySelectorAll(".bit")];
  const live = () => bomb.running && !bomb.slots[slotIndex].solved;
  bits.forEach((b, i) => b.addEventListener("click", () => {
    if (!live()) return;
    on[i] = !on[i];
    b.textContent = on[i] ? "1" : "0";
    b.classList.toggle("on", on[i]);
  }));
  box.querySelector(".confirm-btn").addEventListener("click", () => {
    if (!live()) return;
    const total = BIT_VALUES.reduce((sum, v, i) => sum + (on[i] ? v : 0), 0);
    if (total === target) solveModule(slotIndex);
    else addStrike();
  });
}
