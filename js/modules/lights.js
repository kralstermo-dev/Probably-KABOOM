// Lights module (manual: Module 11). Five lamps; the player switches them to match the rules, then clicks Confirm.
const LIGHTS_DEBUG = false;   // set to true to print the answer in the browser console while testing
const LIGHT_COLORS = { red: "#e0322b", green: "#2fb34a", blue: "#2f6fe4", yellow: "#f2c41c", white: "#f2f2f2" };

// Returns true/false for each lamp: must it be lit? Lamps are worked out from left to right.
function lightsRequired(colors, bomb) {
  const digits = (bomb.serial.match(/\d/g) || []).length;
  const must = [];
  colors.forEach((c, i) => {
    if (i === 0) must.push(Number(bomb.serial.slice(-1)) % 2 === 1);   // rule 1: first lamp
    else if (c === "red") must.push(bomb.batteries.includes("D"));     // rule 2
    else if (c === "green") must.push(!must[i - 1]);                   // rule 3: opposite of the left lamp's REQUIRED state
    else if (c === "blue") must.push(bomb.ports.length >= 2);          // rule 4
    else if (c === "yellow") must.push(digits >= 4);                   // rule 5
    else must.push(!bomb.ports.includes("Ethernet"));                  // rule 6: white
  });
  return must;
}

function mountLights(slotEl, slotIndex) {
  const colors = Array.from({ length: 5 }, () => pick(Object.keys(LIGHT_COLORS)));
  const must = lightsRequired(colors, bomb);
  const state = colors.map(() => Math.random() < 0.5);       // each lamp starts lit or dark at random
  if (LIGHTS_DEBUG) console.log("Lights:", colors.join(" "), "-> lit:", must.map((m) => (m ? 1 : 0)).join(""));

  const box = document.createElement("div");
  box.className = "lights-module";
  box.innerHTML = `<div class="lights-row">${colors.map((c) => `<button class="light" style="--c:${LIGHT_COLORS[c]}"></button>`).join("")}</div>
    <button class="confirm-btn">Confirm</button>`;
  slotEl.querySelector(".slot-body").replaceChildren(box);

  const lamps = [...box.querySelectorAll(".light")];
  const paint = () => lamps.forEach((l, i) => l.classList.toggle("lit", state[i]));
  paint();

  const live = () => bomb.running && !bomb.slots[slotIndex].solved;
  lamps.forEach((l, i) => l.addEventListener("click", () => {
    if (!live()) return;
    state[i] = !state[i];
    paint();
  }));
  box.querySelector(".confirm-btn").addEventListener("click", () => {
    if (!live()) return;
    if (state.every((s, i) => s === must[i])) solveModule(slotIndex);
    else addStrike();
  });
}
