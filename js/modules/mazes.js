// Mazes module (manual: Module 22). The walls are hidden. The player describes the circles, the dot and the exit,
// the expert finds the maze in the manual and calls out the moves.
const MAZES_DEBUG = false;   // set to true to print the maze number in the browser console while testing
const MAZE_SIZE = 6, MAZE_CELL = 20, MAZE_OFF = 14;
const MAZES = [{"cells": ["DR", "LR", "DLR", "L", "DR", "DL", "UR", "DL", "UD", "R", "UL", "UD", "DR", "UL", "UR", "DLR", "L", "UD", "UR", "LR", "DL", "UR", "DL", "UD", "DR", "DL", "UD", "DR", "UL", "UD", "U", "UR", "UL", "UR", "LR", "UL"], "red": [3, 1], "blue": [4, 4]}, {"cells": ["DR", "DL", "DR", "LR", "DLR", "DL", "U", "UD", "UR", "DL", "UD", "UD", "DR", "UL", "DR", "UL", "UD", "U", "UR", "LR", "ULR", "L", "UDR", "DL", "DR", "L", "DR", "DL", "U", "UD", "UR", "LR", "UL", "UR", "LR", "UL"], "red": [1, 2], "blue": [1, 3]}, {"cells": ["DR", "L", "DR", "DLR", "LR", "L", "UDR", "LR", "UL", "UD", "DR", "L", "UDR", "L", "DR", "UDL", "UD", "D", "UD", "DR", "UL", "U", "UR", "UDL", "UD", "UR", "LR", "LR", "LR", "UL", "UR", "LR", "LR", "LR", "LR", "L"], "red": [4, 2], "blue": [5, 5]}, {"cells": ["DR", "DLR", "LR", "DL", "DR", "DL", "UD", "UD", "R", "UDLR", "UL", "U", "UD", "UR", "DL", "U", "DR", "DL", "UD", "D", "UR", "LR", "UL", "UD", "UD", "UDR", "DLR", "L", "DR", "UDL", "UR", "UL", "U", "R", "UL", "U"], "red": [3, 1], "blue": [1, 3]}, {"cells": ["D", "R", "DL", "DR", "LR", "DL", "UDR", "LR", "UL", "UR", "DL", "UD", "UD", "R", "LR", "DLR", "UL", "U", "UD", "DR", "DL", "UD", "DR", "DL", "UD", "UD", "UD", "UR", "UL", "UD", "UR", "UL", "UR", "LR", "LR", "UL"], "red": [2, 1], "blue": [5, 5]}, {"cells": ["DR", "LR", "DLR", "LR", "LR", "L", "UR", "L", "UR", "DLR", "LR", "DL", "DR", "LR", "DL", "UR", "L", "UD", "UR", "DL", "UD", "DR", "LR", "UDL", "DR", "UL", "U", "UR", "DL", "UD", "UR", "LR", "LR", "LR", "UL", "U"], "red": [4, 2], "blue": [5, 0]}, {"cells": ["DR", "LR", "DL", "DR", "LR", "L", "UR", "DL", "UDR", "UL", "DR", "DL", "DR", "UL", "U", "DR", "UL", "UD", "UD", "DR", "LR", "ULR", "L", "UD", "UDR", "UL", "D", "DR", "LR", "UDL", "UR", "LR", "UL", "U", "R", "UL"], "red": [2, 1], "blue": [4, 4]}, {"cells": ["DR", "LR", "DL", "DR", "LR", "L", "UD", "R", "ULR", "UDL", "R", "DL", "UD", "DR", "DL", "U", "DR", "UL", "UD", "UD", "UR", "LR", "UL", "D", "UD", "UR", "LR", "LR", "DL", "UD", "UR", "LR", "LR", "LR", "ULR", "UL"], "red": [1, 2], "blue": [5, 0]}];      // the same 8 mazes that are drawn in the manual. cells = the open directions of each square, row by row

const MAZE_MOVES = { U: [-1, 0], D: [1, 0], L: [0, -1], R: [0, 1] };
const mazeOpen = (maze, r, c, dir) => maze.cells[r * MAZE_SIZE + c].includes(dir);

function mazeDistances(maze, from) {              // how many steps from `from` to every square (breadth-first search)
  const dist = Array(MAZE_SIZE * MAZE_SIZE).fill(-1);
  dist[from[0] * MAZE_SIZE + from[1]] = 0;
  const queue = [from];
  while (queue.length) {
    const [r, c] = queue.shift();
    for (const d of "UDLR") {
      if (!mazeOpen(maze, r, c, d)) continue;
      const nr = r + MAZE_MOVES[d][0], nc = c + MAZE_MOVES[d][1];
      if (dist[nr * MAZE_SIZE + nc] < 0) { dist[nr * MAZE_SIZE + nc] = dist[r * MAZE_SIZE + c] + 1; queue.push([nr, nc]); }
    }
  }
  return dist;
}

function makeMazeRound() {                        // a random maze, a start and an exit that are at least 7 steps apart, not on a circle
  const maze = pick(MAZES);
  const onCircle = (r, c) => [maze.red, maze.blue].some((m) => m[0] === r && m[1] === c);
  for (;;) {
    const start = [rand(MAZE_SIZE), rand(MAZE_SIZE)];
    if (onCircle(start[0], start[1])) continue;
    const exits = [];
    mazeDistances(maze, start).forEach((d, i) => {
      const r = Math.floor(i / MAZE_SIZE), c = i % MAZE_SIZE;
      if (d >= 7 && !onCircle(r, c)) exits.push([r, c]);
    });
    if (exits.length) return { maze, start, exit: pick(exits) };
  }
}

const mazeX = (c) => MAZE_OFF + c * MAZE_CELL + MAZE_CELL / 2, mazeY = (r) => MAZE_OFF + r * MAZE_CELL + MAZE_CELL / 2;

function mazeSVG(round) {                         // the grid WITHOUT walls, the two circles, the exit and the player
  const size = MAZE_SIZE * MAZE_CELL + MAZE_OFF + 4, span = MAZE_SIZE * MAZE_CELL;
  let lines = "", labels = "";
  for (let i = 0; i <= MAZE_SIZE; i++) lines += `M${MAZE_OFF + i * MAZE_CELL} ${MAZE_OFF}v${span}M${MAZE_OFF} ${MAZE_OFF + i * MAZE_CELL}h${span}`;
  for (let i = 0; i < MAZE_SIZE; i++) labels += `<text x="${mazeX(i)}" y="10">${"ABCDEF"[i]}</text><text x="6" y="${mazeY(i) + 3.5}">${i + 1}</text>`;
  const ring = (cell, cls, col) => `<circle class="${cls}" cx="${mazeX(cell[1])}" cy="${mazeY(cell[0])}" r="6" fill="none" stroke="${col}" stroke-width="2.6"/>`;
  return `<svg viewBox="0 0 ${size} ${size}" class="maze-svg"><g font-size="10.5" text-anchor="middle" fill="#aaa" font-family="Courier New, monospace">${labels}</g>
    <rect x="${MAZE_OFF}" y="${MAZE_OFF}" width="${span}" height="${span}" fill="#1b1d21"/><path d="${lines}" stroke="#555" stroke-width="1" fill="none"/>
    ${ring(round.maze.red, "maze-red", "#d62828")}${ring(round.maze.blue, "maze-blue", "#2563eb")}
    <rect class="maze-exit" x="${mazeX(round.exit[1]) - 5}" y="${mazeY(round.exit[0]) - 5}" width="10" height="10" fill="#ffd60a"/>
    <circle class="maze-dot" r="5" fill="#fff"/></svg>`;
}

function mountMazes(slotEl, slotIndex) {
  const round = makeMazeRound();
  let pos = [...round.start];
  if (MAZES_DEBUG) console.log("Maze", MAZES.indexOf(round.maze) + 1, "from", pos, "to", round.exit);

  const box = document.createElement("div");
  box.className = "mazes-module";
  box.innerHTML = mazeSVG(round) + `<div class="maze-pad">
      <button data-d="U">&#8593;</button><button data-d="L">&#8592;</button><button data-d="R">&#8594;</button><button data-d="D">&#8595;</button></div>`;
  slotEl.querySelector(".slot-body").replaceChildren(box);

  const dot = box.querySelector(".maze-dot");
  const place = () => { dot.setAttribute("cx", mazeX(pos[1])); dot.setAttribute("cy", mazeY(pos[0])); };
  place();

  box.querySelector(".maze-pad").addEventListener("click", (e) => {
    const d = e.target.closest("button") && e.target.closest("button").dataset.d;
    if (!d || !bomb.running || bomb.slots[slotIndex].solved) return;
    if (mazeOpen(round.maze, pos[0], pos[1], d)) {
      pos = [pos[0] + MAZE_MOVES[d][0], pos[1] + MAZE_MOVES[d][1]];
      place();
      if (pos[0] === round.exit[0] && pos[1] === round.exit[1]) solveModule(slotIndex);
    } else addStrike();                           // walked into a wall: strike, and the dot stays where it is
  });
}
