const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const PREVIEW_BLOCK = 24;
const BEST_SCORE_KEY = "neon-tetris-best-score";

const SHAPES = {
  I: [[1, 1, 1, 1]],
  J: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
};

const COLORS = {
  I: "#27e8ff",
  J: "#5587ff",
  L: "#ff9f43",
  O: "#ffd166",
  S: "#6dff9f",
  T: "#b86bff",
  Z: "#ff4f75",
};

const SCORE_BY_LINES = [0, 100, 300, 500, 800];
const boardCanvas = document.querySelector("#tetris-board");
const boardContext = boardCanvas.getContext("2d");
const nextCanvas = document.querySelector("#next-piece");
const nextContext = nextCanvas.getContext("2d");
const startButton = document.querySelector("#start-button");
const statusLabel = document.querySelector("#game-status");
const overlay = document.querySelector("#board-overlay");
const scoreLabel = document.querySelector("#score");
const levelLabel = document.querySelector("#level");
const linesLabel = document.querySelector("#lines");
const bestScoreLabel = document.querySelector("#best-score");
const touchControls = document.querySelectorAll("[data-action]");

let board = createBoard();
let currentPiece = null;
let nextPiece = createPiece();
let score = 0;
let level = 1;
let lines = 0;
let bestScore = Number(localStorage.getItem(BEST_SCORE_KEY)) || 0;
let dropCounter = 0;
let dropInterval = 900;
let lastTime = 0;
let isRunning = false;
let isPaused = false;
let animationFrameId = null;

bestScoreLabel.textContent = bestScore;
setupCanvas(boardCanvas, boardContext, BLOCK_SIZE);
setupCanvas(nextCanvas, nextContext, PREVIEW_BLOCK);
draw();
drawNextPiece();

function setupCanvas(canvas, context, scale) {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Number(canvas.getAttribute("width")) * ratio;
  canvas.height = Number(canvas.getAttribute("height")) * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.imageSmoothingEnabled = false;
  context.scale(scale, scale);
}

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function createPiece(type = randomType()) {
  return {
    type,
    matrix: SHAPES[type].map((row) => [...row]),
    x: Math.floor(COLS / 2) - Math.ceil(SHAPES[type][0].length / 2),
    y: 0,
  };
}

function randomType() {
  const types = Object.keys(SHAPES);
  return types[Math.floor(Math.random() * types.length)];
}

function startGame() {
  board = createBoard();
  currentPiece = nextPiece;
  nextPiece = createPiece();
  score = 0;
  level = 1;
  lines = 0;
  dropInterval = 900;
  dropCounter = 0;
  lastTime = 0;
  isRunning = true;
  isPaused = false;
  updateHud();
  updateStatus("游戏进行中");
  overlay.classList.add("is-hidden");
  startButton.textContent = "重新开始";
  cancelAnimationFrame(animationFrameId);
  animationFrameId = requestAnimationFrame(update);
}

function update(time = 0) {
  if (!isRunning || isPaused) {
    return;
  }

  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;

  if (dropCounter > dropInterval) {
    softDrop();
  }

  draw();
  animationFrameId = requestAnimationFrame(update);
}

function draw() {
  boardContext.fillStyle = "#050710";
  boardContext.fillRect(0, 0, COLS, ROWS);
  drawGrid(boardContext, COLS, ROWS);
  drawMatrix(board, { x: 0, y: 0 }, boardContext);

  if (currentPiece) {
    drawGhostPiece();
    drawMatrix(currentPiece.matrix, currentPiece, boardContext, currentPiece.type);
  }
}

function drawGrid(context, cols, rows) {
  context.lineWidth = 1 / BLOCK_SIZE;
  context.strokeStyle = "rgba(255, 255, 255, 0.06)";

  for (let x = 0; x <= cols; x += 1) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, rows);
    context.stroke();
  }

  for (let y = 0; y <= rows; y += 1) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(cols, y);
    context.stroke();
  }
}

function drawMatrix(matrix, offset, context, fallbackType = null, ghost = false) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (!value) {
        return;
      }

      const type = fallbackType || value;
      const color = COLORS[type];
      const drawX = x + offset.x;
      const drawY = y + offset.y;

      context.fillStyle = ghost ? "rgba(255, 255, 255, 0.13)" : color;
      context.fillRect(drawX + 0.06, drawY + 0.06, 0.88, 0.88);
      context.strokeStyle = ghost ? "rgba(255, 255, 255, 0.22)" : "rgba(255, 255, 255, 0.36)";
      context.lineWidth = 0.045;
      context.strokeRect(drawX + 0.08, drawY + 0.08, 0.84, 0.84);

      if (!ghost) {
        const gradient = context.createLinearGradient(drawX, drawY, drawX + 1, drawY + 1);
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.34)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        context.fillStyle = gradient;
        context.fillRect(drawX + 0.13, drawY + 0.13, 0.34, 0.2);
      }
    });
  });
}

function drawGhostPiece() {
  const ghost = {
    ...currentPiece,
    y: currentPiece.y,
  };

  while (!hasCollision(board, ghost)) {
    ghost.y += 1;
  }

  ghost.y -= 1;
  drawMatrix(ghost.matrix, ghost, boardContext, ghost.type, true);
}

function drawNextPiece() {
  nextContext.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
  nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  nextContext.scale(PREVIEW_BLOCK, PREVIEW_BLOCK);
  nextContext.fillStyle = "rgba(255, 255, 255, 0.04)";
  nextContext.fillRect(0, 0, 5, 5);

  const matrix = nextPiece.matrix;
  const offset = {
    x: (5 - matrix[0].length) / 2,
    y: (5 - matrix.length) / 2,
  };

  drawMatrix(matrix, offset, nextContext, nextPiece.type);
}

function movePiece(direction) {
  if (!canPlay()) {
    return;
  }

  currentPiece.x += direction;

  if (hasCollision(board, currentPiece)) {
    currentPiece.x -= direction;
  }

  draw();
}

function softDrop() {
  if (!canPlay()) {
    return;
  }

  currentPiece.y += 1;

  if (hasCollision(board, currentPiece)) {
    currentPiece.y -= 1;
    mergePiece();
    clearLines();
    spawnPiece();
  }

  dropCounter = 0;
  draw();
}

function hardDrop() {
  if (!canPlay()) {
    return;
  }

  let distance = 0;

  while (!hasCollision(board, currentPiece)) {
    currentPiece.y += 1;
    distance += 1;
  }

  currentPiece.y -= 1;
  score += Math.max(0, distance - 1) * 2;
  mergePiece();
  clearLines();
  spawnPiece();
  dropCounter = 0;
  updateHud();
  draw();
}

function rotatePiece() {
  if (!canPlay()) {
    return;
  }

  const originalMatrix = currentPiece.matrix;
  const originalX = currentPiece.x;
  currentPiece.matrix = rotateMatrix(currentPiece.matrix);

  const offsets = [0, -1, 1, -2, 2];
  const validOffset = offsets.find((offset) => {
    currentPiece.x = originalX + offset;
    return !hasCollision(board, currentPiece);
  });

  if (validOffset === undefined) {
    currentPiece.matrix = originalMatrix;
    currentPiece.x = originalX;
  }

  draw();
}

function rotateMatrix(matrix) {
  return matrix[0].map((_, index) => matrix.map((row) => row[index]).reverse());
}

function hasCollision(arena, piece) {
  return piece.matrix.some((row, y) =>
    row.some((value, x) => {
      if (!value) {
        return false;
      }

      const boardX = x + piece.x;
      const boardY = y + piece.y;
      return boardX < 0 || boardX >= COLS || boardY >= ROWS || arena[boardY]?.[boardX];
    })
  );
}

function mergePiece() {
  currentPiece.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        board[y + currentPiece.y][x + currentPiece.x] = currentPiece.type;
      }
    });
  });
}

function clearLines() {
  let cleared = 0;

  board = board.reduce((remainingRows, row) => {
    if (row.every(Boolean)) {
      cleared += 1;
      remainingRows.unshift(Array(COLS).fill(null));
    } else {
      remainingRows.push(row);
    }

    return remainingRows;
  }, []);

  if (cleared > 0) {
    lines += cleared;
    level = Math.floor(lines / 10) + 1;
    score += SCORE_BY_LINES[cleared] * level;
    dropInterval = Math.max(120, 900 - (level - 1) * 70);
    updateHud();
  }
}

function spawnPiece() {
  currentPiece = nextPiece;
  nextPiece = createPiece();
  drawNextPiece();

  if (hasCollision(board, currentPiece)) {
    endGame();
  }
}

function togglePause() {
  if (!isRunning) {
    return;
  }

  isPaused = !isPaused;

  if (isPaused) {
    updateStatus("已暂停");
    overlay.querySelector("strong").textContent = "已暂停";
    overlay.querySelector("span").textContent = "按 P 或暂停按钮继续";
    overlay.classList.remove("is-hidden");
    cancelAnimationFrame(animationFrameId);
  } else {
    updateStatus("游戏进行中");
    overlay.classList.add("is-hidden");
    lastTime = 0;
    animationFrameId = requestAnimationFrame(update);
  }
}

function endGame() {
  isRunning = false;
  isPaused = false;
  cancelAnimationFrame(animationFrameId);
  bestScore = Math.max(bestScore, score);
  localStorage.setItem(BEST_SCORE_KEY, bestScore);
  updateHud();
  updateStatus("游戏结束");
  overlay.querySelector("strong").textContent = "游戏结束";
  overlay.querySelector("span").textContent = "点击重新开始，再来一局";
  overlay.classList.remove("is-hidden");
  startButton.textContent = "重新开始";
}

function updateHud() {
  scoreLabel.textContent = score;
  levelLabel.textContent = level;
  linesLabel.textContent = lines;
  bestScoreLabel.textContent = bestScore;
}

function updateStatus(text) {
  statusLabel.textContent = text;
}

function canPlay() {
  return isRunning && !isPaused && currentPiece;
}

function handleAction(action) {
  const actions = {
    left: () => movePiece(-1),
    right: () => movePiece(1),
    down: softDrop,
    rotate: rotatePiece,
    drop: hardDrop,
    pause: togglePause,
  };

  actions[action]?.();
}

startButton.addEventListener("click", startGame);
overlay.addEventListener("click", () => {
  if (!isRunning) {
    startGame();
  }
});

document.addEventListener("keydown", (event) => {
  const keys = ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " ", "Spacebar", "x", "X", "p", "P"];

  if (!keys.includes(event.key)) {
    return;
  }

  event.preventDefault();

  if (event.key === "ArrowLeft") {
    handleAction("left");
  } else if (event.key === "ArrowRight") {
    handleAction("right");
  } else if (event.key === "ArrowDown") {
    handleAction("down");
  } else if (event.key === "ArrowUp" || event.key === "x" || event.key === "X") {
    handleAction("rotate");
  } else if (event.key === " " || event.key === "Spacebar") {
    handleAction("drop");
  } else if (event.key === "p" || event.key === "P") {
    handleAction("pause");
  }
});

touchControls.forEach((button) => {
  button.addEventListener("click", () => handleAction(button.dataset.action));
});
