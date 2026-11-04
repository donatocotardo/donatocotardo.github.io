const cvLink = document.querySelector(".cv-link");
const trashFile = document.querySelector(".trash-file");
const sections = document.querySelectorAll("main > section[id]");
const sectionLinks = document.querySelectorAll(".top nav a[href^='#']");

sections.forEach((section) => {
  const minimizeButton = section.querySelector(".minimize-button");
  const restoreButton = section.querySelector(".restore-button");
  const closeButton = section.querySelector(".close-button");

  minimizeButton.addEventListener("click", () => {
    section.classList.add("is-minimized");
  });

  restoreButton.addEventListener("click", () => {
    section.classList.remove("is-minimized");
  });

  closeButton.addEventListener("click", () => {
    section.classList.add("is-closed");
    section.classList.remove("is-minimized");
  });
});

sectionLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const section = document.querySelector(link.getAttribute("href"));
    if (!section) return;
    section.classList.remove("is-closed", "is-minimized");
  });
});

if (cvLink && trashFile) {
  let isDragging = false;

  cvLink.addEventListener("dragstart", (event) => {
    isDragging = true;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", "CV.pdf");
    cvLink.classList.add("is-dragging");
  });

  cvLink.addEventListener("dragend", () => {
    isDragging = false;
    cvLink.classList.remove("is-dragging");
    trashFile.classList.remove("is-target");
  });

  trashFile.addEventListener("dragover", (event) => {
    if (!isDragging) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    trashFile.classList.add("is-target");
  });

  trashFile.addEventListener("dragleave", (event) => {
    if (!trashFile.contains(event.relatedTarget)) {
      trashFile.classList.remove("is-target");
    }
  });

  trashFile.addEventListener("drop", (event) => {
    event.preventDefault();
    if (!isDragging) return;
    cvLink.setAttribute("aria-hidden", "true");
    cvLink.removeAttribute("href");
    trashFile.classList.remove("is-target");
  });
}

const minesweeperWindow = document.querySelector("#minesweeper-window");
const minesweeperLauncher = document.querySelector(".minesweeper-launcher");
const minesweeperClose = document.querySelector(".game-close");
const minesweeperReset = document.querySelector(".game-reset");
const mineBoard = document.querySelector(".mine-board");
const mineCounter = document.querySelector(".mine-counter");
const gameTimer = document.querySelector(".game-timer");
const gameStatus = document.querySelector(".game-status");
let mineCells = [];
let mineTimerId;
let mineSeconds = 0;
let mineGameOver = false;
let firstMineMove = true;

function updateMineCounter(value) {
  mineCounter.textContent = String(Math.max(0, value)).padStart(3, "0");
}

function updateMineTimer() {
  gameTimer.textContent = String(mineSeconds).padStart(3, "0");
}

function checkMineWin() {
  const safeCells = mineCells.filter((cell) => !cell.mine);
  if (safeCells.every((cell) => cell.revealed)) {
    mineGameOver = true;
    clearInterval(mineTimerId);
    gameStatus.textContent = "¡Has ganado!";
  }
}

function neighbours(index) {
  const row = Math.floor(index / 9);
  const column = index % 9;
  return mineCells
    .map((_, cellIndex) => cellIndex)
    .filter((cellIndex) => {
      const cellRow = Math.floor(cellIndex / 9);
      const cellColumn = cellIndex % 9;
      return Math.abs(row - cellRow) <= 1
        && Math.abs(column - cellColumn) <= 1
        && cellIndex !== index;
    });
}

function revealCell(index) {
  const cell = mineCells[index];
  if (mineGameOver || cell.revealed || cell.flagged) return;
  if (firstMineMove) {
    placeMines(index);
    firstMineMove = false;
  }
  cell.revealed = true;
  cell.element.classList.add("is-revealed");
  if (cell.mine) {
    cell.element.innerHTML = '<img class="mine-image" src="images/minas.png" alt="Mina">';
    mineGameOver = true;
    clearInterval(mineTimerId);
    mineCells.forEach((mineCell) => {
      if (mineCell.mine) {
        mineCell.element.innerHTML = '<img class="mine-image" src="images/minas.png" alt="Mina">';
        mineCell.element.classList.add("is-revealed");
      }
    });
    return;
  }
  if (cell.number > 0) {
    cell.element.textContent = String(cell.number);
    cell.element.dataset.number = String(cell.number);
    checkMineWin();
    return;
  }
  neighbours(index).forEach(revealCell);
  checkMineWin();
}

function placeMines(firstIndex) {
  const safeIndexes = new Set([firstIndex, ...neighbours(firstIndex)]);
  const mineIndexes = [];
  while (mineIndexes.length < 10) {
    const index = Math.floor(Math.random() * 81);
    if (!safeIndexes.has(index) && !mineIndexes.includes(index)) {
      mineIndexes.push(index);
    }
  }
  mineIndexes.forEach((index) => { mineCells[index].mine = true; });
  mineCells.forEach((cell, index) => {
    cell.number = neighbours(index).filter((neighbour) => mineCells[neighbour].mine).length;
  });
}

function startMinesweeper() {
  clearInterval(mineTimerId);
  mineSeconds = 0;
  mineGameOver = false;
  gameStatus.textContent = "";
  updateMineCounter(10);
  updateMineTimer();
  mineBoard.replaceChildren();
  mineCells = Array.from({ length: 81 }, () => ({
    mine: false, flagged: false, revealed: false, number: 0, element: null
  }));
  firstMineMove = true;
  mineCells.forEach((cell, index) => {
    const button = document.createElement("button");
    button.className = "mine-cell";
    button.type = "button";
    button.setAttribute("role", "gridcell");
    button.addEventListener("click", () => revealCell(index));
    button.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      if (mineGameOver || cell.revealed) return;
      cell.flagged = !cell.flagged;
      button.innerHTML = cell.flagged
        ? '<img class="flag-image" src="images/band.png" alt="Bandera">'
        : "";
      updateMineCounter(10 - mineCells.filter((mineCell) => mineCell.flagged).length);
    });
    cell.element = button;
    mineBoard.append(button);
  });
  mineTimerId = setInterval(() => {
    if (!mineGameOver) {
      mineSeconds += 1;
      updateMineTimer();
    }
  }, 1000);
}

if (minesweeperLauncher && minesweeperWindow) {
  minesweeperLauncher.addEventListener("click", () => {
    minesweeperWindow.hidden = false;
    startMinesweeper();
  });
  minesweeperClose.addEventListener("click", () => {
    minesweeperWindow.hidden = true;
    clearInterval(mineTimerId);
  });
  minesweeperReset.addEventListener("click", startMinesweeper);
}
