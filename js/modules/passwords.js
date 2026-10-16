// Passwords module (manual: Module 18). The display shows a coded password: every letter was moved forward
// by the same shift. The player moves each letter back by that shift and types the real password.
const PASSWORDS_DEBUG = false;   // set to true to print the answer in the browser console while testing
const PASSWORD_WORDS = ["amber", "bacon", "blaze", "brick", "cabin", "camel", "candy", "cargo", "chair", "cloud", "coral", "crane", "daisy", "delta", "dozen", "eagle", "ember", "fable", "fairy", "ferry", "flame", "flint", "frost", "ghost", "giant", "glove", "grape", "grass", "hazel", "heart", "honey", "igloo", "jelly", "joker", "knife", "koala", "laser", "lemon", "llama", "lunar", "magic", "mango", "maple", "medal", "mouse", "nacho", "noble", "ocean", "onion", "orbit", "otter", "panda", "peach", "pearl", "piano", "pilot", "pizza", "quilt", "radar", "raven", "river", "robot", "salad", "scarf", "shark", "sheep", "shell", "spoon", "storm", "sugar", "swing", "table", "tiger", "toast", "train", "tulip", "whale", "wheat", "yacht", "zebra"];   // real words, so a wrong decoding looks wrong. They are not in the manual.

// The manual's rules for the shift, first match wins. Always 1 or more.
function passwordShift(bomb) {
  const last = Number(bomb.serial.slice(-1)), digits = (bomb.serial.match(/\d/g) || []).length;
  if (bomb.batteries.length > bomb.ports.length) return bomb.batteries.length;   // rule 1
  if (bomb.ports.includes("XLR")) return 7;                                       // rule 2
  if (last % 2 === 1) return last;                                                // rule 3
  return digits;                                                                  // rule 4
}
const shiftLetter = (ch, n) => String.fromCharCode((((ch.charCodeAt(0) - 97 + n) % 26) + 26) % 26 + 97);

function mountPasswords(slotEl, slotIndex) {
  const word = pick(PASSWORD_WORDS), shift = passwordShift(bomb);
  const coded = [...word].map((c) => shiftLetter(c, shift)).join("").toUpperCase();
  if (PASSWORDS_DEBUG) console.log("Passwords:", coded, "shift", shift, "->", word);

  const box = document.createElement("div");
  box.className = "passwords-module";
  box.innerHTML = `<div class="password-screen">${coded}</div>
    <input maxlength="5" placeholder="password" autocomplete="off">
    <button class="confirm-btn">Confirm</button>`;
  slotEl.querySelector(".slot-body").replaceChildren(box);

  const input = box.querySelector("input");
  const live = () => bomb.running && !bomb.slots[slotIndex].solved;
  function submit() {
    if (!live() || input.value.trim() === "") return;
    if (input.value.trim().toLowerCase() === word) { solveModule(slotIndex); input.disabled = true; }
    else { addStrike(); input.value = ""; }
  }
  box.querySelector(".confirm-btn").addEventListener("click", submit);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
}
