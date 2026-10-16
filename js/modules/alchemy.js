// Bad Alchemy module (manual: Module 14). Pick two flasks whose pigments mix into the target color.
const ALCHEMY_DEBUG = false;   // set to true to print the target in the browser console while testing
const ELEMENT_PIGMENT = { Tv: "blue", Cd: "yellow", Ad: "red", Uu: "blue", Um: "red", Er: "red", Ea: "yellow", Or: "yellow", As: "blue" };
const MIX_TABLE = { "blue+red": "purple", "blue+yellow": "green", "red+yellow": "orange" };   // pigment names in alphabetical order
const TARGET_HEX = { orange: "#f77f00", green: "#2a9d3f", purple: "#7b2cbf" };
const alchemyMix = (p1, p2) => MIX_TABLE[[p1, p2].sort().join("+")] || null;   // two of the same pigment: no new color

function mountAlchemy(slotEl, slotIndex) {
  const flasks = Object.keys(ELEMENT_PIGMENT).sort(() => Math.random() - 0.5).slice(0, 4);
  const possible = [];                           // every color this set of four flasks can make
  flasks.forEach((a, i) => flasks.slice(i + 1).forEach((b) => {
    const m = alchemyMix(ELEMENT_PIGMENT[a], ELEMENT_PIGMENT[b]);
    if (m) possible.push(m);
  }));
  const target = pick(possible);                 // never empty: 4 elements always include 2 different pigments
  if (ALCHEMY_DEBUG) console.log("Alchemy:", flasks.join(" "), "-> make", target);

  const box = document.createElement("div");
  box.className = "alchemy-module";
  box.innerHTML = `<div class="alchemy-row"><div class="mix-target" style="--c:${TARGET_HEX[target]}"></div>
      ${flasks.map((f) => `<button class="flask">${f}</button>`).join("")}</div>
    <button class="confirm-btn">Confirm</button>`;
  slotEl.querySelector(".slot-body").replaceChildren(box);

  const els = [...box.querySelectorAll(".flask")];
  let chosen = [];                               // indexes of the selected flasks (at most 2)
  const paint = () => els.forEach((e, i) => e.classList.toggle("sel", chosen.includes(i)));
  const live = () => bomb.running && !bomb.slots[slotIndex].solved;
  els.forEach((e, i) => e.addEventListener("click", () => {
    if (!live()) return;
    if (chosen.includes(i)) chosen = chosen.filter((x) => x !== i);
    else if (chosen.length < 2) chosen.push(i);
    paint();
  }));
  box.querySelector(".confirm-btn").addEventListener("click", () => {
    if (!live() || chosen.length !== 2) return;
    const made = alchemyMix(ELEMENT_PIGMENT[flasks[chosen[0]]], ELEMENT_PIGMENT[flasks[chosen[1]]]);
    if (made === target) solveModule(slotIndex);
    else { addStrike(); chosen = []; paint(); }
  });
}
