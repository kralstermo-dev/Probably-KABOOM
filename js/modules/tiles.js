// Tiles module (manual: Module 20). Cross the grid from the bottom row to the top row using only allowed colors.
const TILES_DEBUG = false;   // set to true to print the allowed colors in the browser console while testing
const TILE_COLORS = { red: "#d62828", blue: "#2563eb", green: "#2a9d3f", yellow: "#fcd34d", white: "#ffffff" };
const TILE_ROWS = 4, TILE_COLS = 6;

function tilesAllowed(bomb) {                       // the manual's base list, then its adjustments from top to bottom
  const allowed = new Set(Number(bomb.serial.slice(-1)) % 2 === 1 ? ["red", "blue"] : ["green", "yellow"]);
  if (bomb.ports.includes("Ethernet")) allowed.add("white");
  if (bomb.batteries.length > 2) allowed.delete("red");
  return allowed;
}

function makeTilesGrid(allowed) {                   // grid[0] is the top row
  const list = [...allowed];
  const grid = Array.from({ length: TILE_ROWS }, () => Array.from({ length: TILE_COLS }, () => pick(Object.keys(TILE_COLORS))));
  let col = rand(TILE_COLS);                        // plant one safe path, so the grid can always be crossed
  for (let r = TILE_ROWS - 1; r >= 0; r--) {
    grid[r][col] = pick(list);
    col = Math.max(0, Math.min(TILE_COLS - 1, col + pick([-1, 0, 1])));
  }
  return grid;
}

function tilesPathExists(grid, allowed) {           // used by the tests: is there a way across?
  let reach = grid[TILE_ROWS - 1].map((c) => allowed.has(c));
  for (let r = TILE_ROWS - 2; r >= 0; r--) {
    reach = grid[r].map((c, i) => allowed.has(c) && [i - 1, i, i + 1].some((j) => reach[j]));
  }
  return reach.some(Boolean);
}

function mountTiles(slotEl, slotIndex) {
  const allowed = tilesAllowed(bomb);
  const grid = makeTilesGrid(allowed);
  if (TILES_DEBUG) console.log("Tiles: allowed", [...allowed].join(", "));

  const box = document.createElement("div");
  box.className = "tiles-grid";
  box.innerHTML = grid.map((row, r) => row.map((c, i) =>
    `<button class="tile" data-r="${r}" data-c="${i}" style="--c:${TILE_COLORS[c]}"></button>`).join("")).join("");
  slotEl.querySelector(".slot-body").replaceChildren(box);

  const tiles = [...box.querySelectorAll(".tile")];
  let nextRow = TILE_ROWS - 1, last = null;         // we climb from the bottom row up to row 0
  tiles.forEach((t) => t.addEventListener("click", () => {
    if (!bomb.running || bomb.slots[slotIndex].solved) return;
    const r = Number(t.dataset.r), c = Number(t.dataset.c);
    const ok = r === nextRow && allowed.has(grid[r][c]) && (last === null || Math.abs(c - last) <= 1);
    if (ok) {
      t.classList.add("step");
      last = c;
      if (--nextRow < 0) solveModule(slotIndex);
    } else {
      addStrike();                                  // not allowed, or not next to the last tile: start again from the bottom
      nextRow = TILE_ROWS - 1; last = null;
      tiles.forEach((x) => x.classList.remove("step"));
    }
  }));
}
