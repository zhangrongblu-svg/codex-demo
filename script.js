const canvas = document.querySelector("#game-board");
const context = canvas.getContext("2d");
const scoreElement = document.querySelector("#score");
const bestScoreElement = document.querySelector("#best-score");
const speedLabel = document.querySelector("#speed-label");
const messagePanel = document.querySelector("#message-panel");
const messageTitle = document.querySelector("#message-title");
const messageText = document.querySelector("#message-text");
const startButton = document.querySelector("#start-button");
const pauseButton = document.querySelector("#pause-button");
const resetButton = document.querySelector("#reset-button");
const directionButtons = document.querySelectorAll(".direction-button");

const gridSize = 24;
const tileCount = canvas.width / gridSize;
const directions = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const keyMap = new Map([
  ["ArrowUp", "up"],
  ["w", "up"],
  ["W", "up"],
  ["ArrowDown", "down"],
  ["s", "down"],
  ["S", "down"],
  ["ArrowLeft", "left"],
  ["a", "left"],
  ["A", "left"],
  ["ArrowRight", "right"],
  ["d", "right"],
  ["D", "right"],
]);

let snake;
let apple;
let direction;
let nextDirection;
let score;
let bestScore = Number(localStorage.getItem("snakeBestScore") || 0);
let timerId;
let gameState;

function createInitialState() {
  snake = [
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 },
  ];
  direction = directions.right;
  nextDirection = directions.right;
  score = 0;
  apple = createApple();
  gameState = "ready";
  updateHud();
  draw();
  showMessage("准备开始", "点击“开始游戏”或按空格键开始。");
  startButton.textContent = "开始游戏";
  pauseButton.textContent = "暂停";
  pauseButton.disabled = true;
}

function createApple() {
  let candidate;
  do {
    candidate = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount),
    };
  } while (snake?.some((part) => part.x === candidate.x && part.y === candidate.y));

  return candidate;
}

function startGame() {
  if (gameState === "gameover") {
    createInitialState();
  }

  gameState = "running";
  hideMessage();
  startButton.textContent = "继续游戏";
  pauseButton.disabled = false;
  pauseButton.textContent = "暂停";
  scheduleNextTick();
}

function pauseGame() {
  if (gameState !== "running") {
    return;
  }

  clearTimeout(timerId);
  gameState = "paused";
  pauseButton.textContent = "继续";
  showMessage("已暂停", "按空格键或点击“继续”回到游戏。");
}

function resumeGame() {
  if (gameState !== "paused") {
    return;
  }

  startGame();
}

function resetGame() {
  clearTimeout(timerId);
  createInitialState();
}

function scheduleNextTick() {
  clearTimeout(timerId);
  timerId = setTimeout(gameLoop, getTickSpeed());
}

function getTickSpeed() {
  const speedUp = Math.min(Math.floor(score / 40) * 12, 90);
  return 145 - speedUp;
}

function getSpeedName() {
  if (score >= 160) return "极快";
  if (score >= 80) return "快速";
  if (score >= 40) return "加速";
  return "普通";
}

function gameLoop() {
  if (gameState !== "running") {
    return;
  }

  direction = nextDirection;
  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  if (isWallCollision(head) || isSelfCollision(head)) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (head.x === apple.x && head.y === apple.y) {
    score += 10;
    apple = createApple();
  } else {
    snake.pop();
  }

  updateHud();
  draw();
  scheduleNextTick();
}

function isWallCollision(position) {
  return position.x < 0 || position.x >= tileCount || position.y < 0 || position.y >= tileCount;
}

function isSelfCollision(position) {
  return snake.some((part) => part.x === position.x && part.y === position.y);
}

function endGame() {
  clearTimeout(timerId);
  gameState = "gameover";
  bestScore = Math.max(bestScore, score);
  localStorage.setItem("snakeBestScore", String(bestScore));
  updateHud();
  showMessage("游戏结束", `本局得分 ${score}，点击“重新开始”再来一局。`);
  startButton.textContent = "再玩一次";
  pauseButton.disabled = true;
}

function updateHud() {
  scoreElement.textContent = score;
  bestScoreElement.textContent = bestScore;
  speedLabel.textContent = getSpeedName();
}

function draw() {
  drawBoard();
  drawApple();
  drawSnake();
}

function drawBoard() {
  context.fillStyle = "#081421";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "rgba(148, 163, 184, 0.08)";
  context.lineWidth = 1;
  for (let position = 0; position <= canvas.width; position += gridSize) {
    context.beginPath();
    context.moveTo(position, 0);
    context.lineTo(position, canvas.height);
    context.stroke();

    context.beginPath();
    context.moveTo(0, position);
    context.lineTo(canvas.width, position);
    context.stroke();
  }
}

function drawApple() {
  const centerX = apple.x * gridSize + gridSize / 2;
  const centerY = apple.y * gridSize + gridSize / 2;
  const radius = gridSize * 0.36;

  context.fillStyle = "#fb7185";
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#fda4af";
  context.beginPath();
  context.arc(centerX - 4, centerY - 4, radius * 0.28, 0, Math.PI * 2);
  context.fill();
}

function drawSnake() {
  snake.forEach((part, index) => {
    const padding = index === 0 ? 2 : 3;
    const size = gridSize - padding * 2;
    const x = part.x * gridSize + padding;
    const y = part.y * gridSize + padding;

    context.fillStyle = index === 0 ? "#bef264" : "#4ade80";
    roundRect(context, x, y, size, size, 7);
    context.fill();

    if (index === 0) {
      drawEyes(part);
    }
  });
}

function drawEyes(head) {
  const eyeRadius = 2.6;
  const baseX = head.x * gridSize;
  const baseY = head.y * gridSize;
  const offsets = direction.x !== 0
    ? [{ x: 14, y: 7 }, { x: 14, y: 17 }]
    : [{ x: 7, y: 14 }, { x: 17, y: 14 }];
  const directionOffset = {
    x: direction.x * 4,
    y: direction.y * 4,
  };

  context.fillStyle = "#052e16";
  offsets.forEach((offset) => {
    context.beginPath();
    context.arc(baseX + offset.x + directionOffset.x, baseY + offset.y + directionOffset.y, eyeRadius, 0, Math.PI * 2);
    context.fill();
  });
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function changeDirection(directionName) {
  const requestedDirection = directions[directionName];
  if (!requestedDirection) return;

  const isOpposite = requestedDirection.x + direction.x === 0 && requestedDirection.y + direction.y === 0;
  if (!isOpposite) {
    nextDirection = requestedDirection;
  }
}

function showMessage(title, text) {
  messageTitle.textContent = title;
  messageText.textContent = text;
  messagePanel.classList.remove("hidden");
}

function hideMessage() {
  messagePanel.classList.add("hidden");
}

startButton.addEventListener("click", () => {
  if (gameState === "paused") {
    resumeGame();
  } else {
    startGame();
  }
});

pauseButton.addEventListener("click", () => {
  if (gameState === "paused") {
    resumeGame();
  } else {
    pauseGame();
  }
});

resetButton.addEventListener("click", resetGame);

directionButtons.forEach((button) => {
  button.addEventListener("click", () => changeDirection(button.dataset.direction));
});

document.addEventListener("keydown", (event) => {
  if (keyMap.has(event.key)) {
    event.preventDefault();
    changeDirection(keyMap.get(event.key));
    return;
  }

  if (event.code === "Space") {
    event.preventDefault();
    if (gameState === "running") {
      pauseGame();
    } else {
      startGame();
    }
  }
});

createInitialState();
