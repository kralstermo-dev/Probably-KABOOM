// Logic module (manual: Module 17). Set switches A, B and C so the (hidden) lamp ends up in the required state.
const LOGIC_DEBUG = false;   // set to true to print the gates in the browser console while testing
const GATES = {              // the manual's symbols, and what each gate does
  "◐": (a, b) => a && b,       // AND
  "◑": (a, b) => a || b,       // OR
  "◒": (a, b) => a !== b,      // XOR
  "◓": (a, b) => !(a && b),    // NAND
  "◔": (a, b) => !(a || b),    // NOR
  "◕": (a, b) => a === b       // XNOR
};
const logicLamp = (g1, g2, a, b, c) => GATES[g2](GATES[g1](a, b), c);   // A and B go into gate 1, then gate 1's result and C into gate 2

function mountLogic(slotEl, slotIndex) {
  const g1 = pick(Object.keys(GATES)), g2 = pick(Object.keys(GATES));
  const wantOn = bomb.batteries.length < 3;      // 3 or more batteries: the lamp must be off instead
  if (LOGIC_DEBUG) console.log("Logic:", g1, g2, "lamp must be", wantOn ? "on" : "off");

  const box = document.createElement("div");
  box.className = "logic-module";
  // The wires: A and B go into the first gate; its result and C go into the second gate; the second gate's result goes to the lamp.
  box.innerHTML = `<div class="logic-diagram">
      <svg viewBox="0 0 200 92"><path d="M28 13H52V25H78"/><path d="M28 46H52V37H78"/><path d="M106 30H122V42H140"/><path d="M28 79H122V54H140"/><path d="M168 48H190M184 44L192 48L184 52"/></svg>
      <button class="sw ld-a">A</button><button class="sw ld-b">B</button><button class="sw ld-c">C</button>
      <span class="gate ld-g1">${g1}</span><span class="gate ld-g2">${g2}</span></div>
    <button class="confirm-btn">Confirm</button>`;
  slotEl.querySelector(".slot-body").replaceChildren(box);

  const on = [false, false, false];
  const sws = [...box.querySelectorAll(".sw")];
  const live = () => bomb.running && !bomb.slots[slotIndex].solved;
  sws.forEach((s, i) => s.addEventListener("click", () => {
    if (!live()) return;
    on[i] = !on[i];
    s.classList.toggle("on", on[i]);
  }));
  box.querySelector(".confirm-btn").addEventListener("click", () => {
    if (!live()) return;
    if (logicLamp(g1, g2, on[0], on[1], on[2]) === wantOn) solveModule(slotIndex);
    else addStrike();
  });
}
