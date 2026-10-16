// Multibuttons module (manual: Module 16). Six numbered, colored buttons that must be pressed in the manual's order.
const MULTI_DEBUG = false;   // set to true to print the right order in the browser console while testing
const MULTI_COLORS = { red: "#d62828", blue: "#2563eb", green: "#2a9d3f", yellow: "#fcd34d" };

function multiOrder(buttons, bomb) {            // buttons = [{ color, n }]; returns them in the order to press
  const odd = Number(bomb.serial.slice(-1)) % 2 === 1;
  const colors = odd ? ["red", "blue", "green", "yellow"] : ["yellow", "green", "blue", "red"];
  const descending = bomb.ports.includes("USB-C");
  return colors.flatMap((c) => buttons.filter((b) => b.color === c).sort((x, y) => (descending ? y.n - x.n : x.n - y.n)));
}

function mountMultibuttons(slotEl, slotIndex) {
  const buttons = [];
  while (buttons.length < 6) {                  // buttons of the same color never share a number
    const color = pick(Object.keys(MULTI_COLORS)), n = 1 + rand(9);
    if (!buttons.some((b) => b.color === color && b.n === n)) buttons.push({ color, n });
  }
  const order = multiOrder(buttons, bomb);
  if (MULTI_DEBUG) console.log("Multibuttons:", order.map((b) => b.color + " " + b.n).join(", "));

  const box = document.createElement("div");
  box.className = "multi-grid";
  box.innerHTML = buttons.map((b) => `<button class="mbtn ${b.color}" style="--c:${MULTI_COLORS[b.color]}">${b.n}</button>`).join("");
  slotEl.querySelector(".slot-body").replaceChildren(box);

  const els = [...box.querySelectorAll(".mbtn")];
  let next = 0;
  els.forEach((el, i) => el.addEventListener("click", () => {
    if (!bomb.running || bomb.slots[slotIndex].solved || el.classList.contains("done")) return;
    if (buttons[i] === order[next]) {
      el.classList.add("done");
      if (++next === order.length) solveModule(slotIndex);
    } else {
      addStrike();                              // wrong button: strike, start the order again
      next = 0;
      els.forEach((e) => e.classList.remove("done"));
    }
  }));
}
