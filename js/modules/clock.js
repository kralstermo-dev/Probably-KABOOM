// Clock Reading module (manual: Module 13). The answer is the hour's word followed by the minutes' number.
const CLOCK_DEBUG = false;   // set to true to print the answer in the browser console while testing
const CLOCK_WORDS = ["cat", "dog", "fox", "owl", "bat", "hen", "cow", "pig", "ram", "ant", "bee", "elk"];   // hours 1 to 12

const clockAnswer = (hour, minute) => CLOCK_WORDS[hour - 1] + (minute / 15 + 1);   // 3:30 -> "fox3"

function clockSVG(hour, minute) {
  const hourAngle = ((hour % 12) + minute / 60) * 30, minuteAngle = minute * 6;
  let marks = "";
  for (let i = 0; i < 12; i++) {
    marks += `<line x1="50" y1="8" x2="50" y2="${i % 3 === 0 ? 15 : 12}" stroke="#222" stroke-width="2" transform="rotate(${i * 30} 50 50)"/>`;
  }
  return `<svg viewBox="0 0 100 100" class="clock">
    <circle cx="50" cy="50" r="46" fill="#f4f1e8" stroke="#000" stroke-width="3"/>${marks}
    <g font-size="11" text-anchor="middle" font-family="Courier New, monospace" fill="#222">
      <text x="50" y="29">12</text><text x="79" y="54">3</text><text x="50" y="84">6</text><text x="21" y="54">9</text></g>
    <line x1="50" y1="50" x2="50" y2="30" stroke="#111" stroke-width="5" stroke-linecap="round" transform="rotate(${hourAngle} 50 50)"/>
    <line x1="50" y1="50" x2="50" y2="14" stroke="#c00" stroke-width="3" stroke-linecap="round" transform="rotate(${minuteAngle} 50 50)"/>
    <circle cx="50" cy="50" r="3" fill="#111"/></svg>`;
}

function mountClock(slotEl, slotIndex) {
  const hour = 1 + rand(12), minute = pick(bomb.level === 0 ? [0, 30] : [0, 15, 30, 45]);   // the minute hand always sits on 12, 3, 6 or 9
  const answer = clockAnswer(hour, minute);
  if (CLOCK_DEBUG) console.log("Clock:", hour + ":" + String(minute).padStart(2, "0"), "->", answer);

  const box = document.createElement("div");
  box.className = "clock-module";
  box.innerHTML = clockSVG(hour, minute) + `<div class="clock-side">
      <input maxlength="5" placeholder="code" autocomplete="off">
      <button class="confirm-btn">Confirm</button></div>`;
  slotEl.querySelector(".slot-body").replaceChildren(box);

  const input = box.querySelector("input");
  const live = () => bomb.running && !bomb.slots[slotIndex].solved;
  function submit() {
    if (!live() || input.value.trim() === "") return;
    if (input.value.trim().toLowerCase() === answer) { solveModule(slotIndex); input.disabled = true; }
    else { addStrike(); input.value = ""; }
  }
  box.querySelector(".confirm-btn").addEventListener("click", submit);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
}
