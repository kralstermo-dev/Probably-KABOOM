// Simon Says module (manual: Module 19). Flashes colors; the player presses the translated colors in the same order.
const SIMON_DEBUG = false;   // set to true to print the flashes in the browser console while testing
const SIMON_COLORS = { red: "#d62828", blue: "#2563eb", green: "#2a9d3f", yellow: "#fcd34d" };
const SIMON_TABLES = {       // flashed color -> color to press, for 0, 1 and 2 strikes (copied from the manual)
  A: { red: ["blue", "yellow", "green"], blue: ["red", "green", "yellow"], green: ["yellow", "red", "blue"], yellow: ["green", "blue", "red"] },
  B: { red: ["green", "blue", "yellow"], blue: ["yellow", "green", "red"], green: ["red", "yellow", "blue"], yellow: ["blue", "red", "green"] }
};

function simonPress(flash, bomb, strikes) {    // which color must be pressed for this flash, right now
  const table = Number(bomb.serial.slice(-1)) % 2 === 1 ? "A" : "B";
  return SIMON_TABLES[table][flash][Math.min(strikes, 2)];
}

function mountSimon(slotEl, slotIndex) {
  const names = Object.keys(SIMON_COLORS);
  const flashes = Array.from({ length: 4 }, () => pick(names));
  if (SIMON_DEBUG) console.log("Simon:", flashes.join(" "));

  const box = document.createElement("div");
  box.className = "simon-module";
  box.innerHTML = `<div class="simon-dots"><i></i><i></i><i></i><i></i></div>
    <div class="simon-row">${names.map((n) => `<button class="simon-btn" data-c="${n}" style="--c:${SIMON_COLORS[n]}"></button>`).join("")}</div>`;
  slotEl.querySelector(".slot-body").replaceChildren(box);

  const btns = [...box.querySelectorAll(".simon-btn")];
  const dots = [...box.querySelectorAll(".simon-dots i")];      // one dot per finished stage
  const light = (c) => btns.forEach((b) => b.classList.toggle("lit", b.dataset.c === c));
  const live = () => bomb.running && !bomb.slots[slotIndex].solved;
  let stage = 1, entered = 0, timer = null;       // stage = how many flashes are in the sequence right now

  function play() {                                // flash the first `stage` colors, pause, then repeat
    clearTimeout(timer);
    let i = 0;
    (function step() {
      if (!live()) return;
      if (i >= stage) { light(null); timer = setTimeout(play, 3000); return; }
      light(flashes[i]);
      timer = setTimeout(() => { light(null); i++; timer = setTimeout(step, 250); }, 600);
    })();
  }
  (function waitForStart() { if (bomb.running) play(); else setTimeout(waitForStart, 100); })();

  btns.forEach((b) => b.addEventListener("click", () => {
    if (!live()) return;
    clearTimeout(timer);
    light(b.dataset.c);                            // the pressed button lights up for a moment, so you can see your press
    setTimeout(() => light(null), 180);
    if (b.dataset.c === simonPress(flashes[entered], bomb, bomb.strikes)) {
      entered++;
      if (entered === stage) {                     // sequence repeated correctly: add one more flash
        dots[stage - 1].classList.add("done");
        entered = 0;
        if (++stage > flashes.length) { solveModule(slotIndex); return; }
        timer = setTimeout(play, 1000);
      } else timer = setTimeout(play, 3000);       // still entering: replay only if the player goes quiet
    } else {
      addStrike();                                 // wrong color: strike, and the same sequence plays again
      entered = 0;
      timer = setTimeout(play, 1200);
    }
  }));
}
