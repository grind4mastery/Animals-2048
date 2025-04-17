document.addEventListener("DOMContentLoaded", () => {
  function initializePokiSDK() {
    if (window.PokiSDK) {
      PokiSDK.init()
        .then(() => {
          console.log("Poki SDK successfully initialized");
          startGameLogic();
        })
        .catch(() => {
          console.log("Poki SDK failed to initialize, loading game anyway.");
          startGameLogic();
        });
    } else {
      console.log("Poki SDK not found, loading game directly.");
      startGameLogic();
    }
  }

  function startGameLogic() {
    const GRID_SIZE = 4;
    const CELL_COUNT = GRID_SIZE * GRID_SIZE;

    let adIsPlaying = false;
    let grid = [];
    let gameOver = false;
    let won = false;
    let continueAfterWin = false;
    let swapMode = false;
    let firstSelectedTile = null;
    let swapCooldown = 0;
    let swapCooldownInterval = null;
    let moveHistory = [];
    let goBackCooldown = 0;
    let goBackCooldownInterval = null;
    let gameContainerWidth = 0;
    let gameContainerHeight = 0;
    let isInIframe = false;
    let audioContext = null;
    let audioBuffers = {};
    let soundMuted = false;
    let audioInitialized = false;
    let touchMoveThreshold = 20;
    let lastSwipeDirection = null;
    let touchMoveProcessed = false;

    let score = 0;
    let currency = 0;
    let showCurrencyAnimations = true;
    const currencyRewards = {
      4: 4,
      8: 8,
      16: 16,
      32: 32,
      64: 64,
      128: 128,
      256: 256,
      512: 512,
      1024: 1024,
      2048: 2048,
    };
    let gameStats = {
      bestScore: 0,
      gamesPlayed: 0,
      totalScore: 0,
      highestTile: 0,
      totalMerges: 0,
      totalTimePlayed: 0,
      startTime: Date.now(),
    };

    let lastMoveTime = 0;
    let moveDelay = 250;
    let moveQueue = [];
    let maxQueueSize = 3;
    let useInputQueue = true;
    let processingQueue = false;
    let initialGameplayStarted = false;
    let swapTileCharges = 3;
    let goBackCharges = 3;
    let swapAdButtonVisible = false;
    let goBackAdButtonVisible = false;

    const themeSets = {
      default: {
        id: "default",
        name: "Animal Kingdom",
        price: 0,
        animals: {
          2: { emoji: "🐭", name: "Mouse" },
          4: { emoji: "🐱", name: "Cat" },
          8: { emoji: "🐶", name: "Dog" },
          16: { emoji: "🦊", name: "Fox" },
          32: { emoji: "🐺", name: "Wolf" },
          64: { emoji: "🦁", name: "Lion" },
          128: { emoji: "🐘", name: "Elephant" },
          256: { emoji: "🦏", name: "Rhino" },
          512: { emoji: "🦛", name: "Hippo" },
          1024: { emoji: "🦖", name: "Dinosaur" },
          2048: { emoji: "🐉", name: "Dragon" },
        },
      },
      ocean: {
        id: "ocean",
        name: "Ocean Creatures",
        price: 4000,
        animals: {
          2: { emoji: "🦐", name: "Shrimp" },
          4: { emoji: "🐟", name: "Fish" },
          8: { emoji: "🐠", name: "Fish 2" },
          16: { emoji: "🦑", name: "Squid" },
          32: { emoji: "🐬", name: "Dolphin" },
          64: { emoji: "🦈", name: "Shark" },
          128: { emoji: "🐋", name: "Whale" },
          256: { emoji: "🐙", name: "Octopus" },
          512: { emoji: "🐊", name: "Crocodile" },
          1024: { emoji: "🧜‍♀️", name: "Mermaid" },
          2048: { emoji: "🔱", name: "Poseidon" },
        },
      },
      farm: {
        id: "farm",
        name: "Farm Animals",
        price: 9000,
        animals: {
          2: { emoji: "🐤", name: "Chick" },
          4: { emoji: "🐔", name: "Chicken" },
          8: { emoji: "🐇", name: "Rabbit" },
          16: { emoji: "🐖", name: "Pig" },
          32: { emoji: "🐑", name: "Sheep" },
          64: { emoji: "🐄", name: "Cow" },
          128: { emoji: "🐎", name: "Horse" },
          256: { emoji: "🦙", name: "Llama" },
          512: { emoji: "🐐", name: "Goat" },
          1024: { emoji: "🐃", name: "Ox" },
          2048: { emoji: "🚜", name: "Tractor" },
        },
      },
      insects: {
        id: "insects",
        name: "Insect World",
        price: 35000,
        animals: {
          2: { emoji: "🍃", name: "Leaf" },
          4: { emoji: "🐜", name: "Ant" },
          8: { emoji: "🐛", name: "Caterpillar" },
          16: { emoji: "🐞", name: "Ladybug" },
          32: { emoji: "🦟", name: "Mosquito" },
          64: { emoji: "🦗", name: "Cricket" },
          128: { emoji: "🦋", name: "Butterfly" },
          256: { emoji: "🕷️", name: "Spider" },
          512: { emoji: "🕸️", name: "Spiderweb" },
          1024: { emoji: "🐝", name: "Bee" },
          2048: { emoji: "🦂", name: "Scorpion" },
        },
      },
    };

    const colorThemes = {
      light: {
        id: "light",
        name: "i'm blue",
        price: 0,
        colors: {
          "--primary-color": "#4A90E2",
          "--secondary-color": "#8AB9E6",
          "--accent-color": "#5B9BD5",
          "--background-color": "#D6E8F5",
          "--dark-text": "#000000",
          "--light-text": "#000000",
          "--text-color": "#000000",
          "--primary-text-color": "#000000",
          "--secondary-text-color": "#000000",
          "--accent-text-color": "#000000",
          "--background-text-color": "#000000",
        },
      },
      batman: {
        id: "batman",
        name: "Batman Mode",
        price: 0,
        colors: {
          "--primary-color": "#2d3748",
          "--secondary-color": "#4a5568",
          "--accent-color": "#718096",
          "--background-color": "#1a202c",
          "--dark-text": "#e2e8f0",
          "--light-text": "#ffffff",
          "--text-color": "#e2e8f0",
          "--primary-text-color": "#e2e8f0",
          "--secondary-text-color": "#ffffff",
          "--accent-text-color": "#ffffff",
          "--background-text-color": "#ffffff",
        },
      },
      summer: {
        id: "summer",
        name: "It's Summer",
        price: 2000,
        colors: {
          "--primary-color": "#fa6900",
          "--secondary-color": "#f38630",
          "--accent-color": "#69d2e7",
          "--background-color": "#e0e4cc",
          "--dark-text": "#000000",
          "--light-text": "#000000",
          "--text-color": "#000000",
          "--primary-text-color": "#ffffff",
          "--secondary-text-color": "#ffffff",
          "--accent-text-color": "#000000",
          "--background-text-color": "#000000",
        },
      },
      cozy: {
        id: "cozy",
        name: "Bubblegum",
        price: 5000,
        colors: {
          "--primary-color": "#8F87F1",
          "--secondary-color": "#C68EFD",
          "--accent-color": "#E9A5F1",
          "--background-color": "#FED2E2",
          "--dark-text": "#292522",
          "--light-text": "#292522",
          "--text-color": "#292522",
          "--primary-text-color": "#000000",
          "--secondary-text-color": "#ffffff",
          "--accent-text-color": "#292522",
          "--background-text-color": "#292522",
        },
      },
      ice: {
        id: "ice",
        name: "Cold as Ice",
        price: 20000,
        colors: {
          "--primary-color": "#001449",
          "--secondary-color": "#012677",
          "--accent-color": "#005bc5",
          "--background-color": "#00b4fc",
          "--dark-text": "#ffffff",
          "--light-text": "#17f9ff",
          "--text-color": "#ffffff",
          "--primary-text-color": "#ffffff",
          "--secondary-text-color": "#ffffff",
          "--accent-text-color": "#ffffff",
          "--background-text-color": "#ffffff",
        },
      },
      zen: {
        id: "zen",
        name: "Zen Garden",
        price: 50000,
        colors: {
          "--primary-color": "#B3C8CF",
          "--secondary-color": "#BED7DC",
          "--accent-color": "#F1EEDC",
          "--background-color": "#E5DDC5",
          "--dark-text": "#355c7d",
          "--light-text": "#355c7d",
          "--text-color": "#355c7d",
          "--primary-text-color": "#000000",
          "--secondary-text-color": "#000000",
          "--accent-text-color": "#000000",
          "--background-text-color": "#000000",
        },
      },
    };

    let selectedTheme = "default";
    let selectedColorTheme = "light";

    let purchasedThemes = ["default"];
    let purchasedColorThemes = ["light"];

    const gameWrapper = document.querySelector(".game-wrapper");
    const gameBoard = document.querySelector(".game-board");
    const gameBoardContainer = document.querySelector(".game-board-container");
    const newGameButton = document.getElementById("new-game-button");
    const settingsButton = document.getElementById("setting-button");
    const restartButton = document.getElementById("restart-button");
    const restartWinButton = document.getElementById("restart-win-button");
    const continueButton = document.getElementById("continue-button");
    const gameOverModal = document.getElementById("game-over-modal");
    const winModal = document.getElementById("win-modal");
    const settingsModal = document.getElementById("settings-modal");
    const storeModal = document.getElementById("store-modal");
    const statsModal = document.getElementById("stats-modal");
    const tutorialModal = document.getElementById("tutorial-modal");
    const resetConfirmModal = document.getElementById("reset-confirm-modal");

    function tryStartInitialGameplay() {
      if (!initialGameplayStarted && window.PokiSDK && !gameOver && !won) {
        PokiSDK.gameplayStart();
        console.log("Initial gameplayStart triggered by user interaction.");
        initialGameplayStarted = true;
      }
    }

    function resumeGameplayIfAppropriate() {
      if (initialGameplayStarted && window.PokiSDK && !gameOver && !won) {
        PokiSDK.gameplayStart();
      }
    }

    function pauseGameAudio() {
      if (audioContext && audioContext.state === "running" && !soundMuted) {
        audioContext.suspend().catch(console.error);
      }
    }

    function resumeGameAudio() {
      if (audioContext && audioContext.state === "suspended" && !soundMuted) {
        audioContext.resume().catch(console.error);
      }
    }

    function init() {
      detectEnvironment();
      setupResponsiveLayout();

      audioContext = null;
      audioBuffers = {};

      const gameLoaded = loadPersistentData();

      createGrid();

      setupCurrencyDisplay();
      setupScoreDisplay();
      setupSwapTilesFeature();
      setupGoBackFeature();
      setupEventListeners();
      setupStatsFeature();
      setupStore();

      if (gameLoaded) {
        renderBoard();
        updateScoreDisplay();
        updateGoBackButtonState();

        if (gameOver && !continueAfterWin) {
          const gameOverMessages = [];
          const randomMessage =
            gameOverMessages[
              Math.floor(Math.random() * gameOverMessages.length)
            ] || "Game Over!";
          document.querySelector("#game-over-modal h2").textContent =
            randomMessage;
          gameOverModal.classList.remove("hidden");
          if (window.PokiSDK) PokiSDK.gameplayStop();
        } else if (won && !continueAfterWin) {
          winModal.classList.remove("hidden");
          if (window.PokiSDK) PokiSDK.gameplayStop();
        }
      } else {
        setupNewGame();
        checkFirstTimePlayer();
      }

      if (swapCooldown > 0) {
        updateSwapButtonText();
        startSwapCooldownTimer();
      }
      if (goBackCooldown > 0) {
        updateGoBackButtonText();
        startGoBackCooldownTimer();
      }

      handleResize();
      adjustIconColors();
      updateAllTileEmojis();

      if (window.PokiSDK) {
        PokiSDK.gameLoadingFinished();
      }
    }

    function detectEnvironment() {
      try {
        isInIframe = window.self !== window.top;
      } catch (e) {
        isInIframe = true;
      }

      if (isInIframe) {
        document.body.classList.add("in-iframe");
        touchMoveThreshold = 20;
      } else {
        touchMoveThreshold = 30;
      }
    }

    function setupCurrencyDisplay() {
      const topHeader = document.querySelector(".top-header");
      const currencyContainer = document.createElement("div");
      currencyContainer.id = "currency-container";
      currencyContainer.classList.add("currency-container");

      const currencyIcon = document.createElement("span");
      currencyIcon.classList.add("currency-icon");
      currencyIcon.textContent = "💵";

      const currencyAmount = document.createElement("span");
      currencyAmount.id = "currency-amount";
      currencyAmount.classList.add("currency-amount");
      currencyAmount.textContent = currency;

      currencyContainer.appendChild(currencyIcon);
      currencyContainer.appendChild(currencyAmount);

      const storeButton = document.getElementById("store-button");
      topHeader.insertBefore(currencyContainer, storeButton);

      updateCurrencyDisplay();
    }

    function setupScoreDisplay() {
      const scoreContainer = document.createElement("div");
      scoreContainer.id = "score-container";
      scoreContainer.classList.add("score-container");

      const starIcon = document.createElement("img");
      starIcon.src = "icons/staricon.svg";
      starIcon.alt = "Stats";
      starIcon.classList.add("button-icon", "score-icon");

      const scoreLabel = document.createElement("span");
      scoreLabel.classList.add("score-label");
      scoreLabel.textContent = "Score: ";

      const scoreValue = document.createElement("span");
      scoreValue.id = "score-value";
      scoreValue.classList.add("score-value");
      scoreValue.textContent = score;

      scoreContainer.appendChild(starIcon);
      scoreContainer.appendChild(scoreLabel);
      scoreContainer.appendChild(scoreValue);

      const gameBoardContainer = document.querySelector(
        ".game-board-container"
      );
      gameBoardContainer.parentNode.insertBefore(
        scoreContainer,
        gameBoardContainer
      );

      updateScoreDisplay();
    }

    function updateScoreDisplay() {
      const scoreValue = document.getElementById("score-value");
      if (scoreValue) {
        scoreValue.textContent = score;
      }
    }

    function updateGameStats() {
      if (score > gameStats.bestScore) {
        gameStats.bestScore = score;
      }

      let currentHighestTile = 0;
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (grid[row][col] > currentHighestTile) {
            currentHighestTile = grid[row][col];
          }
        }
      }

      if (currentHighestTile > gameStats.highestTile) {
        gameStats.highestTile = currentHighestTile;
      }

      const currentSession = Math.floor(
        (Date.now() - gameStats.startTime) / 1000
      );
      gameStats.totalTimePlayed += currentSession;
      gameStats.startTime = Date.now();

      saveGameStats();
    }

    function incrementMergeCount() {
      gameStats.totalMerges++;
      saveGameStats();
    }

    function formatTime(seconds) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;

      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }

    function loadGameStats() {
      const savedStats = JSON.parse(localStorage.getItem("animal2048_stats"));
      if (savedStats) {
        gameStats = savedStats;
        gameStats.startTime = Date.now();
      }
    }

    function saveGameStats() {
      localStorage.setItem("animal2048_stats", JSON.stringify(gameStats));
    }

    function showStatsModal() {
      updateGameStats();

      const averageScore =
        gameStats.gamesPlayed > 0
          ? Math.round(gameStats.totalScore / gameStats.gamesPlayed)
          : 0;

      document.getElementById("best-score-value").textContent =
        gameStats.bestScore.toLocaleString();
      document.getElementById("games-played-value").textContent =
        gameStats.gamesPlayed.toLocaleString();
      document.getElementById("highest-tile-value").textContent =
        gameStats.highestTile.toLocaleString();
      document.getElementById("average-score-value").textContent =
        averageScore.toLocaleString();
      document.getElementById("total-merges-value").textContent =
        gameStats.totalMerges.toLocaleString();
      document.getElementById("total-time-value").textContent = formatTime(
        gameStats.totalTimePlayed
      );

      statsModal.classList.remove("hidden");
      if (window.PokiSDK) PokiSDK.gameplayStop();
    }

    function resetGameStats() {
      gameStats = {
        bestScore: 0,
        gamesPlayed: 0,
        totalScore: 0,
        highestTile: 0,
        totalMerges: 0,
        totalTimePlayed: 0,
        startTime: Date.now(),
      };

      localStorage.removeItem("animal2048_stats");
      saveGameStats();
    }

    function setupStatsFeature() {
      loadGameStats();

      const scoreContainer = document.getElementById("score-container");
      if (scoreContainer) {
        scoreContainer.addEventListener("click", showStatsModal);
      }

      const closeStatsButton = document.getElementById("close-stats");
      if (closeStatsButton) {
        closeStatsButton.addEventListener("click", () => {
          statsModal.classList.add("hidden");
          resumeGameplayIfAppropriate();
        });
      }
    }

    function purchaseTheme(themeId) {
      if (!themeSets[themeId]) return;
      const theme = themeSets[themeId];

      if (currency < theme.price) {
        showInsufficientFunds();
        return;
      }

      currency -= theme.price;
      updateCurrencyDisplay();

      if (!purchasedThemes.includes(themeId)) {
        purchasedThemes.push(themeId);
      }

      selectTheme(themeId);
      updateStoreContent();
      savePersistentData();
    }

    function purchaseColorTheme(themeId) {
      if (!colorThemes[themeId]) return;
      const theme = colorThemes[themeId];

      if (currency < theme.price) {
        showInsufficientFunds();
        return;
      }

      currency -= theme.price;
      updateCurrencyDisplay();

      if (!purchasedColorThemes.includes(themeId)) {
        purchasedColorThemes.push(themeId);
      }

      selectColorTheme(themeId);
      updateColorThemeContent();
      savePersistentData();
    }

    function showInsufficientFunds() {
      const currencyDisplay = document.getElementById("currency-amount");
      currencyDisplay.classList.add("insufficient-funds");
      setTimeout(() => {
        currencyDisplay.classList.remove("insufficient-funds");
      }, 1000);
    }

    function updateCurrencyDisplay() {
      const currencyAmount = document.getElementById("currency-amount");
      if (currencyAmount) {
        currencyAmount.textContent = currency;
      }
    }

    function setupResponsiveLayout() {
      window.addEventListener("resize", handleResize);
      const resizeObserver = new ResizeObserver((entries) => {
        handleResize();
      });
      resizeObserver.observe(gameWrapper);
    }

    function handleResize() {
      const wrapperRect = gameWrapper.getBoundingClientRect();
      gameContainerWidth = wrapperRect.width;
      gameContainerHeight = wrapperRect.height;

      const maxBoardSize = Math.min(
        gameContainerWidth * 0.95,
        gameContainerHeight * 0.75
      );

      gameBoard.style.width = `${maxBoardSize}px`;
      gameBoard.style.height = `${maxBoardSize}px`;

      updateAllTilePositions();
    }

    function updateAllTilePositions() {
      const tiles = document.querySelectorAll(".tile");
      tiles.forEach((tile) => {
        const row = parseInt(tile.getAttribute("data-row"));
        const col = parseInt(tile.getAttribute("data-col"));
        positionTile(tile, row, col);
      });
    }

    function createGrid() {
      gameBoard.innerHTML = "";
      for (let i = 0; i < CELL_COUNT; i++) {
        const gridCell = document.createElement("div");
        gridCell.classList.add("grid-cell");
        gameBoard.appendChild(gridCell);
      }
    }

    function setupNewGame() {
      grid = Array(GRID_SIZE)
        .fill()
        .map(() => Array(GRID_SIZE).fill(0));
      gameOver = false;
      won = false;
      continueAfterWin = false;
      score = 0;
      updateScoreDisplay();

      moveHistory = [];
      updateGoBackButtonState();

      addRandomTile();
      addRandomTile();
      savePersistentData();

      initialGameplayStarted = false;
    }

    function renderBoard() {
      const existingTiles = document.querySelectorAll(".tile");
      existingTiles.forEach((tile) => {
        if (tile.classList.contains("merged")) {
          tile.classList.remove("merged");
        }
      });

      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (grid[row][col] !== 0) {
            const value = grid[row][col];
            let tile = document.querySelector(
              `.tile[data-row="${row}"][data-col="${col}"]`
            );

            if (!tile) {
              tile = document.createElement("div");
              tile.classList.add("tile", `tile-${value}`);
              tile.setAttribute("data-row", row);
              tile.setAttribute("data-col", col);
              tile.setAttribute("data-value", value);
              const animal = getAnimalForTier(value);
              tile.textContent = animal.emoji;
              positionTile(tile, row, col);
              gameBoard.appendChild(tile);
            } else {
              if (!tile.classList.contains(`tile-${value}`)) {
                tile.className = "tile";
                tile.classList.add(`tile-${value}`, "merged");
                tile.setAttribute("data-value", value);
                const animal = getAnimalForTier(value);
                tile.textContent = animal.emoji;
              }
              positionTile(tile, row, col);
            }
          }
        }
      }

      existingTiles.forEach((tile) => {
        const row = parseInt(tile.getAttribute("data-row"));
        const col = parseInt(tile.getAttribute("data-col"));
        if (
          grid[row][col] === 0 ||
          grid[row][col] !== parseInt(tile.getAttribute("data-value"))
        ) {
          setTimeout(() => {
            if (tile.parentNode) {
              tile.remove();
            }
          }, 150);
        }
      });
    }

    function getAnimalForTier(tier) {
      const currentTheme = themeSets[selectedTheme];
      return currentTheme.animals[tier] || { emoji: "", name: "Unknown" };
    }

    function updateAllTileEmojis() {
      const tiles = document.querySelectorAll(".tile");
      tiles.forEach((tile) => {
        const value = parseInt(tile.getAttribute("data-value"));
        const animal = getAnimalForTier(value);
        tile.textContent = animal.emoji;
      });
    }

    function positionTile(tile, row, col) {
      const gridCells = document.querySelectorAll(".grid-cell");
      const cellIndex = row * GRID_SIZE + col;
      if (!gridCells[cellIndex]) return;
      const cellRect = gridCells[cellIndex].getBoundingClientRect();
      const boardRect = gameBoard.getBoundingClientRect();

      const top = cellRect.top - boardRect.top;
      const left = cellRect.left - boardRect.left;

      tile.setAttribute("data-row", row);
      tile.setAttribute("data-col", col);

      tile.style.top = `${top}px`;
      tile.style.left = `${left}px`;
      tile.style.width = `${cellRect.width}px`;
      tile.style.height = `${cellRect.height}px`;

      const cellSize = cellRect.width;
      const defaultSize = 2.2;
      let fontSize = defaultSize;
      const value = parseInt(tile.getAttribute("data-value"));
      if (value >= 128) fontSize *= 0.9;
      if (value >= 1024) fontSize *= 0.85;
      tile.style.fontSize = `${fontSize}em`;
    }

    function addRandomTile() {
      const emptyCells = [];
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (grid[row][col] === 0) {
            emptyCells.push({ row, col });
          }
        }
      }

      if (emptyCells.length > 0) {
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        const cell = emptyCells[randomIndex];
        grid[cell.row][cell.col] = Math.random() < 0.9 ? 2 : 4;

        setTimeout(() => {
          const value = grid[cell.row][cell.col];
          const tile = document.createElement("div");
          tile.classList.add("tile", `tile-${value}`);
          tile.setAttribute("data-row", cell.row);
          tile.setAttribute("data-col", cell.col);
          tile.setAttribute("data-value", value);
          const animal = getAnimalForTier(value);
          tile.textContent = animal.emoji;
          positionTile(tile, cell.row, cell.col);
          tile.classList.add("pop");
          gameBoard.appendChild(tile);
          setTimeout(() => {
            tile.classList.remove("pop");
          }, 300);
        }, 150);
      }
    }

    function moveTilesDirectly(direction) {
      if (adIsPlaying) return false;
      if (gameOver && !continueAfterWin) return false;

      const currentTime = Date.now();
      if (currentTime - lastMoveTime < moveDelay) {
        return false;
      }
      lastMoveTime = currentTime;

      let moved = false;
      const newGrid = Array(GRID_SIZE)
        .fill()
        .map(() => Array(GRID_SIZE).fill(0));
      const tileMovements = [];
      const mergePositions = [];
      const originalGrid = grid.map((row) => [...row]);

      switch (direction) {
        case "up":
          for (let col = 0; col < GRID_SIZE; col++) {
            let colValues = [];
            let srcPositions = [];
            for (let row = 0; row < GRID_SIZE; row++) {
              if (grid[row][col] !== 0) {
                colValues.push(grid[row][col]);
                srcPositions.push({ row, col });
              }
            }
            const originalValues = [...colValues];
            const mergedResult = mergeTilesWithoutUpdatingScore(colValues);
            const mergedColValues = mergedResult.mergedTiles;
            let destRow = 0;
            let srcIndex = 0;
            for (let i = 0; i < mergedColValues.length; i++) {
              const mergedValue = mergedColValues[i];
              const isMergeResult =
                srcIndex < originalValues.length - 1 &&
                mergedValue === originalValues[srcIndex] * 2 &&
                originalValues[srcIndex] === originalValues[srcIndex + 1];
              if (isMergeResult) {
                const firstSrcPos = srcPositions[srcIndex];
                const secondSrcPos = srcPositions[srcIndex + 1];
                tileMovements.push({
                  srcRow: firstSrcPos.row,
                  srcCol: firstSrcPos.col,
                  destRow: destRow,
                  destCol: col,
                  value: grid[firstSrcPos.row][firstSrcPos.col],
                  willMerge: true,
                  mergeValue: mergedValue,
                });
                tileMovements.push({
                  srcRow: secondSrcPos.row,
                  srcCol: secondSrcPos.col,
                  destRow: destRow,
                  destCol: col,
                  value: grid[secondSrcPos.row][secondSrcPos.col],
                  willMerge: true,
                  mergeValue: mergedValue,
                });
                mergePositions.push({
                  row: destRow,
                  col: col,
                  value: mergedValue,
                });
                srcIndex += 2;
              } else {
                const srcPos = srcPositions[srcIndex];
                tileMovements.push({
                  srcRow: srcPos.row,
                  srcCol: srcPos.col,
                  destRow: destRow,
                  destCol: col,
                  value: grid[srcPos.row][srcPos.col],
                  willMerge: false,
                });
                srcIndex++;
              }
              destRow++;
            }
            for (let row = 0; row < GRID_SIZE; row++) {
              newGrid[row][col] =
                row < mergedColValues.length ? mergedColValues[row] : 0;
            }
          }
          break;
        case "right":
          for (let row = 0; row < GRID_SIZE; row++) {
            let rowValues = [];
            let srcPositions = [];
            for (let col = GRID_SIZE - 1; col >= 0; col--) {
              if (grid[row][col] !== 0) {
                rowValues.push(grid[row][col]);
                srcPositions.push({ row, col });
              }
            }
            const originalValues = [...rowValues];
            const mergedResult = mergeTilesWithoutUpdatingScore(rowValues);
            const mergedRowValues = mergedResult.mergedTiles;
            let destCol = GRID_SIZE - 1;
            let srcIndex = 0;
            for (let i = 0; i < mergedRowValues.length; i++) {
              const mergedValue = mergedRowValues[i];
              const isMergeResult =
                srcIndex < originalValues.length - 1 &&
                mergedValue === originalValues[srcIndex] * 2 &&
                originalValues[srcIndex] === originalValues[srcIndex + 1];
              if (isMergeResult) {
                const firstSrcPos = srcPositions[srcIndex];
                const secondSrcPos = srcPositions[srcIndex + 1];
                tileMovements.push({
                  srcRow: firstSrcPos.row,
                  srcCol: firstSrcPos.col,
                  destRow: row,
                  destCol: destCol,
                  value: grid[firstSrcPos.row][firstSrcPos.col],
                  willMerge: true,
                  mergeValue: mergedValue,
                });
                tileMovements.push({
                  srcRow: secondSrcPos.row,
                  srcCol: secondSrcPos.col,
                  destRow: row,
                  destCol: destCol,
                  value: grid[secondSrcPos.row][secondSrcPos.col],
                  willMerge: true,
                  mergeValue: mergedValue,
                });
                mergePositions.push({
                  row: row,
                  col: destCol,
                  value: mergedValue,
                });
                srcIndex += 2;
              } else {
                const srcPos = srcPositions[srcIndex];
                tileMovements.push({
                  srcRow: srcPos.row,
                  srcCol: srcPos.col,
                  destRow: row,
                  destCol: destCol,
                  value: grid[srcPos.row][srcPos.col],
                  willMerge: false,
                });
                srcIndex++;
              }
              destCol--;
            }
            for (let col = GRID_SIZE - 1; col >= 0; col--) {
              newGrid[row][col] =
                GRID_SIZE - 1 - col < mergedRowValues.length
                  ? mergedRowValues[GRID_SIZE - 1 - col]
                  : 0;
            }
          }
          break;
        case "down":
          for (let col = 0; col < GRID_SIZE; col++) {
            let colValues = [];
            let srcPositions = [];
            for (let row = GRID_SIZE - 1; row >= 0; row--) {
              if (grid[row][col] !== 0) {
                colValues.push(grid[row][col]);
                srcPositions.push({ row, col });
              }
            }
            const originalValues = [...colValues];
            const mergedResult = mergeTilesWithoutUpdatingScore(colValues);
            const mergedColValues = mergedResult.mergedTiles;
            let destRow = GRID_SIZE - 1;
            let srcIndex = 0;
            for (let i = 0; i < mergedColValues.length; i++) {
              const mergedValue = mergedColValues[i];
              const isMergeResult =
                srcIndex < originalValues.length - 1 &&
                mergedValue === originalValues[srcIndex] * 2 &&
                originalValues[srcIndex] === originalValues[srcIndex + 1];
              if (isMergeResult) {
                const firstSrcPos = srcPositions[srcIndex];
                const secondSrcPos = srcPositions[srcIndex + 1];
                tileMovements.push({
                  srcRow: firstSrcPos.row,
                  srcCol: firstSrcPos.col,
                  destRow: destRow,
                  destCol: col,
                  value: grid[firstSrcPos.row][firstSrcPos.col],
                  willMerge: true,
                  mergeValue: mergedValue,
                });
                tileMovements.push({
                  srcRow: secondSrcPos.row,
                  srcCol: secondSrcPos.col,
                  destRow: destRow,
                  destCol: col,
                  value: grid[secondSrcPos.row][secondSrcPos.col],
                  willMerge: true,
                  mergeValue: mergedValue,
                });
                mergePositions.push({
                  row: destRow,
                  col: col,
                  value: mergedValue,
                });
                srcIndex += 2;
              } else {
                const srcPos = srcPositions[srcIndex];
                tileMovements.push({
                  srcRow: srcPos.row,
                  srcCol: srcPos.col,
                  destRow: destRow,
                  destCol: col,
                  value: grid[srcPos.row][srcPos.col],
                  willMerge: false,
                });
                srcIndex++;
              }
              destRow--;
            }
            for (let row = GRID_SIZE - 1; row >= 0; row--) {
              newGrid[row][col] =
                GRID_SIZE - 1 - row < mergedColValues.length
                  ? mergedColValues[GRID_SIZE - 1 - row]
                  : 0;
            }
          }
          break;
        case "left":
          for (let row = 0; row < GRID_SIZE; row++) {
            let rowValues = [];
            let srcPositions = [];
            for (let col = 0; col < GRID_SIZE; col++) {
              if (grid[row][col] !== 0) {
                rowValues.push(grid[row][col]);
                srcPositions.push({ row, col });
              }
            }
            const originalValues = [...rowValues];
            const mergedResult = mergeTilesWithoutUpdatingScore(rowValues);
            const mergedRowValues = mergedResult.mergedTiles;
            let destCol = 0;
            let srcIndex = 0;
            for (let i = 0; i < mergedRowValues.length; i++) {
              const mergedValue = mergedRowValues[i];
              const isMergeResult =
                srcIndex < originalValues.length - 1 &&
                mergedValue === originalValues[srcIndex] * 2 &&
                originalValues[srcIndex] === originalValues[srcIndex + 1];
              if (isMergeResult) {
                const firstSrcPos = srcPositions[srcIndex];
                const secondSrcPos = srcPositions[srcIndex + 1];
                tileMovements.push({
                  srcRow: firstSrcPos.row,
                  srcCol: firstSrcPos.col,
                  destRow: row,
                  destCol: destCol,
                  value: grid[firstSrcPos.row][firstSrcPos.col],
                  willMerge: true,
                  mergeValue: mergedValue,
                });
                tileMovements.push({
                  srcRow: secondSrcPos.row,
                  srcCol: secondSrcPos.col,
                  destRow: row,
                  destCol: destCol,
                  value: grid[secondSrcPos.row][secondSrcPos.col],
                  willMerge: true,
                  mergeValue: mergedValue,
                });
                mergePositions.push({
                  row: row,
                  col: destCol,
                  value: mergedValue,
                });
                srcIndex += 2;
              } else {
                const srcPos = srcPositions[srcIndex];
                tileMovements.push({
                  srcRow: srcPos.row,
                  srcCol: srcPos.col,
                  destRow: row,
                  destCol: destCol,
                  value: grid[srcPos.row][srcPos.col],
                  willMerge: false,
                });
                srcIndex++;
              }
              destCol++;
            }
            for (let col = 0; col < GRID_SIZE; col++) {
              newGrid[row][col] =
                col < mergedRowValues.length ? mergedRowValues[col] : 0;
            }
          }
          break;
      }

      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (originalGrid[row][col] !== newGrid[row][col]) {
            moved = true;
            break;
          }
        }
        if (moved) break;
      }

      if (moved) {
        savePreviousStateForUndo();

        const existingTiles = document.querySelectorAll(".tile");
        const animationTiles = [];
        const mergeGroups = {};

        existingTiles.forEach((tile) => {
          const row = parseInt(tile.getAttribute("data-row"));
          const col = parseInt(tile.getAttribute("data-col"));
          const value = parseInt(tile.getAttribute("data-value"));

          playSwipeSound();

          const movement = tileMovements.find(
            (move) => move.srcRow === row && move.srcCol === col
          );

          if (movement) {
            const cloneTile = tile.cloneNode(true);
            cloneTile.classList.add("moving-tile");
            gameBoard.appendChild(cloneTile);
            positionTile(cloneTile, row, col);

            const animData = {
              tile: cloneTile,
              srcRow: row,
              srcCol: col,
              destRow: movement.destRow,
              destCol: movement.destCol,
              value: value,
              willMerge: movement.willMerge,
              mergeValue: movement.mergeValue,
            };
            animationTiles.push(animData);

            if (movement.willMerge) {
              const destKey = `${movement.destRow},${movement.destCol}`;
              if (!mergeGroups[destKey]) {
                mergeGroups[destKey] = [];
              }
              mergeGroups[destKey].push(animData);
            }
          }
        });

        setTimeout(() => {
          animationTiles.forEach((anim) => {
            positionTile(anim.tile, anim.destRow, anim.destCol);
          });

          for (const destKey in mergeGroups) {
            const group = mergeGroups[destKey];
            if (group.length === 2) {
              const mainTile = group[0].tile;
              setTimeout(() => {
                const animal = getAnimalForTier(group[0].mergeValue);
                mainTile.textContent = animal.emoji;
                mainTile.classList.add("merged");
                playRandomMergeSound();
                group[1].tile.style.opacity = "0";
              }, 10);
            }
          }

          grid = newGrid;
          existingTiles.forEach((tile) => tile.remove());
          addRandomTile();

          setTimeout(() => {
            document
              .querySelectorAll(".moving-tile")
              .forEach((tile) => tile.remove());
            mergePositions.forEach((merge) => {
              addCurrencyForMerge(merge.value, merge.row, merge.col);
              incrementMergeCount();
            });
            renderBoard();
            checkGameStatus();
            savePersistentData();
          }, 200);
        }, 50);
      }

      return moved;
    }

    function savePreviousStateForUndo() {
      const gameState = {
        grid: JSON.parse(JSON.stringify(grid)),
      };
      moveHistory.push(gameState);
      if (moveHistory.length > 100) {
        moveHistory.shift();
      }
      updateGoBackButtonState();
    }

    function moveTiles(direction) {
      if (adIsPlaying) return;
      if (useInputQueue) {
        if (moveQueue.length < maxQueueSize) {
          moveQueue.push(direction);
          if (!processingQueue) {
            processMoveQueue();
          }
        }
      } else {
        moveTilesDirectly(direction);
      }
    }

    function loadPersistentData() {
      const savedData = JSON.parse(localStorage.getItem("animal2048")) || {};
      let gameLoadedFromSave = false;

      soundMuted = savedData.soundMuted || false;
      useInputQueue = savedData.hasOwnProperty("useInputQueue")
        ? savedData.useInputQueue
        : true;
      currency = savedData.currency || 0;
      swapTileCharges =
        savedData.swapTileCharges !== undefined ? savedData.swapTileCharges : 3;
      goBackCharges =
        savedData.goBackCharges !== undefined ? savedData.goBackCharges : 3;
      showCurrencyAnimations = savedData.hasOwnProperty(
        "showCurrencyAnimations"
      )
        ? savedData.showCurrencyAnimations
        : true;

      purchasedThemes = savedData.purchasedThemes || ["default"];
      if (!purchasedThemes.includes("default")) purchasedThemes.push("default");
      selectedTheme = "default";
      if (
        savedData.selectedTheme &&
        themeSets[savedData.selectedTheme] &&
        purchasedThemes.includes(savedData.selectedTheme)
      ) {
        selectedTheme = savedData.selectedTheme;
      }

      purchasedColorThemes = savedData.purchasedColorThemes || [
        "light",
        "batman",
      ];
      if (!purchasedColorThemes.includes("light"))
        purchasedColorThemes.push("light");
      if (!purchasedColorThemes.includes("batman"))
        purchasedColorThemes.push("batman");
      selectedColorTheme = "light";
      if (
        savedData.selectedColorTheme &&
        colorThemes[savedData.selectedColorTheme] &&
        purchasedColorThemes.includes(savedData.selectedColorTheme)
      ) {
        selectedColorTheme = savedData.selectedColorTheme;
      }
      applyColorTheme(selectedColorTheme);

      if (savedData.grid && Array.isArray(savedData.grid)) {
        if (
          savedData.grid.length === GRID_SIZE &&
          savedData.grid[0].length === GRID_SIZE
        ) {
          grid = savedData.grid;
          score = savedData.score || 0;
          moveHistory = savedData.moveHistory || [];
          gameOver = savedData.gameOver || false;
          won = savedData.won || false;
          continueAfterWin = savedData.continueAfterWin || false;
          gameLoadedFromSave = true;
        } else {
          console.warn("Saved grid dimensions mismatch. Starting new game.");
        }
      } else {
        console.log("No saved game state found or invalid format.");
      }

      if (savedData.swapCooldownEnd) {
        const remainingTime = savedData.swapCooldownEnd - Date.now();
        if (remainingTime > 0) swapCooldown = Math.ceil(remainingTime / 1000);
      }
      if (savedData.goBackCooldownEnd) {
        const remainingTime = savedData.goBackCooldownEnd - Date.now();
        if (remainingTime > 0) goBackCooldown = Math.ceil(remainingTime / 1000);
      }

      return gameLoadedFromSave;
    }

    function savePersistentData() {
      const gridToSave = JSON.parse(JSON.stringify(grid));
      const historyToSave = JSON.parse(JSON.stringify(moveHistory));
      const dataToSave = {
        soundMuted: soundMuted,
        useInputQueue: useInputQueue,
        currency: currency,
        showCurrencyAnimations: showCurrencyAnimations,
        purchasedThemes: purchasedThemes,
        selectedTheme: selectedTheme,
        purchasedColorThemes: purchasedColorThemes,
        selectedColorTheme: selectedColorTheme,
        swapTileCharges: swapTileCharges,
        goBackCharges: goBackCharges,
        swapCooldownEnd:
          swapCooldown > 0 ? Date.now() + swapCooldown * 1000 : null,
        goBackCooldownEnd:
          goBackCooldown > 0 ? Date.now() + goBackCooldown * 1000 : null,
        grid: gridToSave,
        score: score,
        moveHistory: historyToSave,
        gameOver: gameOver,
        won: won,
        continueAfterWin: continueAfterWin,
      };
      try {
        localStorage.setItem("animal2048", JSON.stringify(dataToSave));
      } catch (error) {
        console.error("Error saving game state to localStorage:", error);
      }
    }

    function isColorLight(hexColor) {
      if (!hexColor || hexColor === "transparent") return true;
      if (hexColor.startsWith("rgb")) {
        try {
          const rgb = hexColor.match(/\d+/g).map(Number);
          const luminance =
            (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
          return luminance > 0.5;
        } catch (e) {
          return true;
        }
      }
      hexColor = hexColor.replace("#", "");
      if (hexColor.length === 3)
        hexColor = hexColor
          .split("")
          .map((c) => c + c)
          .join("");
      if (hexColor.length !== 6) return true;
      const r = parseInt(hexColor.substring(0, 2), 16);
      const g = parseInt(hexColor.substring(2, 4), 16);
      const b = parseInt(hexColor.substring(4, 6), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.5;
    }

    function adjustIconColors() {
      const bgColor = getComputedStyle(document.documentElement)
        .getPropertyValue("--background-color")
        .trim();
      const isDarkMode = !isColorLight(bgColor);
      const buttonIcons = document.querySelectorAll(".button-icon");
      buttonIcons.forEach((icon) => {
        icon.style.filter = isDarkMode ? "invert(100%)" : "invert(0%)";
      });
    }

    function mergeTilesWithoutUpdatingScore(tiles) {
      const mergedTiles = [];
      let skipNext = false;
      let merged = false;
      for (let i = 0; i < tiles.length; i++) {
        if (skipNext) {
          skipNext = false;
          continue;
        }
        if (i < tiles.length - 1 && tiles[i] === tiles[i + 1]) {
          const mergedValue = tiles[i] * 2;
          mergedTiles.push(mergedValue);
          skipNext = true;
          merged = true;
        } else {
          mergedTiles.push(tiles[i]);
        }
      }
      return { mergedTiles, merged };
    }

    function addCurrencyForMerge(mergeValue, row, col) {
      if (currencyRewards[mergeValue]) {
        const reward = currencyRewards[mergeValue];
        currency += reward;
        score += reward;
        updateScoreDisplay();
        showCurrencyEarned(reward, row, col);
        savePersistentData();
        updateCurrencyDisplay();
      }
    }

    function showCurrencyEarned(amount, row, col) {
      if (!showCurrencyAnimations) return;
      const earnedText = document.createElement("div");
      earnedText.classList.add("currency-earned");
      earnedText.textContent = `+${amount}`;
      gameBoard.appendChild(earnedText);

      const gridCells = document.querySelectorAll(".grid-cell");
      const cellIndex = row * GRID_SIZE + col;
      if (!gridCells[cellIndex]) {
        earnedText.remove();
        return;
      }
      const cellRect = gridCells[cellIndex].getBoundingClientRect();
      const boardRect = gameBoard.getBoundingClientRect();
      let top = cellRect.top - boardRect.top + cellRect.height / 2;
      let left = cellRect.left - boardRect.left + cellRect.width / 2;
      if (col === GRID_SIZE - 1) left -= cellRect.width * 0.25;
      else if (col === 0) left += cellRect.width * 0.25;
      earnedText.style.left = `${left}px`;
      earnedText.style.top = `${top}px`;
      setTimeout(() => {
        earnedText.remove();
      }, 800);
    }

    function checkGameStatus() {
      if (!won) {
        for (let row = 0; row < GRID_SIZE; row++) {
          for (let col = 0; col < GRID_SIZE; col++) {
            if (grid[row][col] === 2048) {
              won = true;
              winModal.classList.remove("hidden");
              if (window.PokiSDK) PokiSDK.gameplayStop();
              break;
            }
          }
          if (won) break;
        }
      }

      if (!isMovePossible()) {
        gameOver = true;
        const gameOverMessages = [
          "The challenge is tough, but so are you!",
          "You're doing amazing, keep going!",
          "You're not losing, you're leveling up!",
          "The adventure continues.",
          "You're doing great!, You've got this!",
          "One more try! You're closer than you think!",
        ];
        const randomMessage =
          gameOverMessages[Math.floor(Math.random() * gameOverMessages.length)];
        document.querySelector("#game-over-modal h2").textContent =
          randomMessage;
        gameOverModal.classList.remove("hidden");
        if (window.PokiSDK) PokiSDK.gameplayStop();
      }
    }

    function isMovePossible() {
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (grid[row][col] === 0) return true;
        }
      }
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          const value = grid[row][col];
          if (col < GRID_SIZE - 1 && grid[row][col + 1] === value) return true;
          if (row < GRID_SIZE - 1 && grid[row + 1][col] === value) return true;
        }
      }
      return false;
    }

    function handleKeyPress(e) {
      if (adIsPlaying) {
        e.preventDefault();
        return;
      }
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
      }
      switch (e.key) {
        case "ArrowUp":
          moveTiles("up");
          break;
        case "ArrowRight":
          moveTiles("right");
          break;
        case "ArrowDown":
          moveTiles("down");
          break;
        case "ArrowLeft":
          moveTiles("left");
          break;
      }
    }

    let touchStartX = 0;
    let touchStartY = 0;
    function handleTouchMove(e) {
      if (adIsPlaying || !touchStartX || !touchStartY || touchMoveProcessed)
        return;
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      const deltaX = touchX - touchStartX;
      const deltaY = touchY - touchStartY;

      if (
        Math.abs(deltaX) > touchMoveThreshold ||
        Math.abs(deltaY) > touchMoveThreshold
      ) {
        let direction = null;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? "right" : "left";
        } else {
          direction = deltaY > 0 ? "down" : "up";
        }
        if (direction !== lastSwipeDirection) {
          lastSwipeDirection = direction;
          moveTiles(direction);
          touchMoveProcessed = true;
          setTimeout(() => {
            touchMoveProcessed = false;
          }, moveDelay);
        }
      }
      if (isInIframe) e.preventDefault();
    }

    function handleTouchStart(e) {
      if (adIsPlaying) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      if (isInIframe) e.preventDefault();
    }

    function handleTouchEnd(e) {
      touchStartX = 0;
      touchStartY = 0;
      lastSwipeDirection = null;
      touchMoveProcessed = false;
      if (isInIframe) e.preventDefault();
    }

    function setupSwapTilesFeature() {
      const gameControls = document.querySelector(".game-controls");
      const swapButton = document.createElement("button");
      swapButton.id = "swap-button";
      swapButton.classList.add("control-button");

      const swapIcon = document.createElement("img");
      swapIcon.src = "icons/swapicon.svg";
      swapIcon.alt = "Swap Tiles";
      swapIcon.classList.add("button-icon");
      swapButton.appendChild(swapIcon);

      const chargeSpan = document.createElement("span");
      chargeSpan.classList.add("charge-count");
      chargeSpan.id = "swap-charge-count";
      swapButton.appendChild(chargeSpan);

      const cooldownSpan = document.createElement("span");
      cooldownSpan.classList.add("cooldown-timer");
      cooldownSpan.id = "swap-cooldown";
      swapButton.appendChild(cooldownSpan);
      gameControls.appendChild(swapButton);

      const swapAdButton = document.createElement("button");
      swapAdButton.id = "swap-ad-button";
      swapAdButton.classList.add("ad-button", "hidden");
      const adIcon = document.createElement("img");
      adIcon.src = "icons/rewardadicon.svg";
      adIcon.alt = "Watch Ad";
      adIcon.classList.add("button-icon");
      swapAdButton.appendChild(adIcon);
      gameControls.appendChild(swapAdButton);

      swapButton.addEventListener("click", toggleSwapMode);
      swapAdButton.addEventListener("click", () => {
        showRewardedAd("swap");
      });

      updateSwapChargeDisplay();
      updateSwapButtonText();
    }

    function updateSwapChargeDisplay() {
      const chargeSpan = document.getElementById("swap-charge-count");
      if (chargeSpan) chargeSpan.textContent = `(${swapTileCharges})`;
    }

    function toggleSwapAdButton(show) {
      const adButton = document.getElementById("swap-ad-button");
      if (adButton) {
        if (show) {
          adButton.classList.remove("hidden");
        } else {
          adButton.classList.add("hidden");
        }
      }
    }

    function processMoveQueue() {
      if (processingQueue || moveQueue.length === 0) return;
      processingQueue = true;
      const direction = moveQueue.shift();
      moveTilesDirectly(direction);
      setTimeout(() => {
        processingQueue = false;
        if (moveQueue.length > 0) processMoveQueue();
      }, moveDelay + 50);
    }

    function toggleSwapMode() {
      if (swapCooldown > 0 || swapTileCharges <= 0) return;
      swapMode = !swapMode;
      const swapButton = document.getElementById("swap-button");
      const tiles = document.querySelectorAll(".tile");
      if (swapMode) {
        swapButton.classList.add("swap-active");
        firstSelectedTile = null;
        tiles.forEach((tile) => {
          tile.style.opacity = "0.5";
          tile.addEventListener("click", selectTileForSwap);
          tile.addEventListener("touchend", handleTouchSelectTile);
        });
      } else {
        swapButton.classList.remove("swap-active");
        firstSelectedTile = null;
        tiles.forEach((tile) => {
          tile.style.opacity = "1";
          tile.removeEventListener("click", selectTileForSwap);
          tile.removeEventListener("touchend", handleTouchSelectTile);
        });
      }
    }

    function selectTileForSwap(event) {
      if (!swapMode) return;
      const tile = event.currentTarget;
      if (!firstSelectedTile) {
        firstSelectedTile = tile;
        firstSelectedTile.style.opacity = "1";
      } else {
        performSwap(firstSelectedTile, tile);
      }
    }

    function handleTouchSelectTile(event) {
      event.preventDefault();
      if (
        Math.abs(event.changedTouches[0].clientX - touchStartX) > 10 ||
        Math.abs(event.changedTouches[0].clientY - touchStartY) > 10
      )
        return;
      const tile = event.currentTarget;
      if (!firstSelectedTile) {
        firstSelectedTile = tile;
        firstSelectedTile.style.opacity = "1";
      } else {
        performSwap(firstSelectedTile, tile);
      }
    }

    function performSwap(tile1, tile2) {
      const row1 = parseInt(tile1.getAttribute("data-row"));
      const col1 = parseInt(tile1.getAttribute("data-col"));
      const row2 = parseInt(tile2.getAttribute("data-row"));
      const col2 = parseInt(tile2.getAttribute("data-col"));

      const temp = grid[row1][col1];
      grid[row1][col1] = grid[row2][col2];
      grid[row2][col2] = temp;

      renderBoard();
      swapMode = false;
      firstSelectedTile = null;

      const swapButton = document.getElementById("swap-button");
      swapButton.classList.remove("swap-active");

      swapTileCharges--;
      updateSwapChargeDisplay();

      if (swapTileCharges <= 0) {
        swapCooldown = 300;
        updateSwapButtonText();
        startSwapCooldownTimer();
        toggleSwapAdButton(true);
        const cooldownEndTime = Date.now() + swapCooldown * 1000;
        const savedData = JSON.parse(localStorage.getItem("animal2048")) || {};
        savedData.swapCooldownEnd = cooldownEndTime;
        localStorage.setItem("animal2048", JSON.stringify(savedData));
      }

      savePersistentData();

      const tiles = document.querySelectorAll(".tile");
      tiles.forEach((t) => {
        t.style.opacity = "1";
        t.removeEventListener("click", selectTileForSwap);
        t.removeEventListener("touchend", handleTouchSelectTile);
      });
    }

    function startSwapCooldownTimer() {
      if (swapCooldownInterval) clearInterval(swapCooldownInterval);
      swapCooldownInterval = setInterval(() => {
        swapCooldown--;
        updateSwapButtonText();
        if (swapCooldown <= 0) {
          clearInterval(swapCooldownInterval);
          swapCooldownInterval = null;
          updateSwapButtonText();
          swapTileCharges = 3;
          updateSwapChargeDisplay();
          savePersistentData();
          toggleSwapAdButton(false);
        }
      }, 1000);
    }

    function updateSwapButtonText() {
      const cooldownSpan = document.getElementById("swap-cooldown");
      const swapButton = document.getElementById("swap-button");
      if (!cooldownSpan || !swapButton) return;

      if (swapCooldown <= 0) {
        cooldownSpan.textContent = "";
        swapButton.classList.remove("cooldown");
        swapButton.disabled = swapTileCharges <= 0;
      } else {
        const minutes = Math.floor(swapCooldown / 60);
        const seconds = swapCooldown % 60;
        cooldownSpan.textContent = `${minutes}:${seconds
          .toString()
          .padStart(2, "0")}`;
        swapButton.classList.add("cooldown");
        swapButton.disabled = true;
      }
      toggleSwapAdButton(swapTileCharges <= 0);
    }

    function setupGoBackFeature() {
      const gameControls = document.querySelector(".game-controls");
      const goBackButton = document.createElement("button");
      goBackButton.id = "go-back-button";
      goBackButton.classList.add("control-button");

      const goBackIcon = document.createElement("img");
      goBackIcon.src = "icons/gobackicon.svg";
      goBackIcon.alt = "Go Back";
      goBackIcon.classList.add("button-icon");
      goBackButton.appendChild(goBackIcon);

      const chargeSpan = document.createElement("span");
      chargeSpan.classList.add("charge-count");
      chargeSpan.id = "goback-charge-count";
      goBackButton.appendChild(chargeSpan);

      const cooldownSpan = document.createElement("span");
      cooldownSpan.classList.add("cooldown-timer");
      cooldownSpan.id = "goback-cooldown";
      goBackButton.appendChild(cooldownSpan);
      gameControls.appendChild(goBackButton);

      const goBackAdButton = document.createElement("button");
      goBackAdButton.id = "goback-ad-button";
      goBackAdButton.classList.add("ad-button", "hidden");
      const adIcon = document.createElement("img");
      adIcon.src = "icons/rewardadicon.svg";
      adIcon.alt = "Watch Ad";
      adIcon.classList.add("button-icon");
      goBackAdButton.appendChild(adIcon);
      gameControls.appendChild(goBackAdButton);

      goBackButton.addEventListener("click", handleGoBack);
      goBackAdButton.addEventListener("click", () => {
        showRewardedAd("goback");
      });

      updateGoBackChargeDisplay();
      updateGoBackButtonText();
      updateGoBackButtonState();
    }

    function updateGoBackChargeDisplay() {
      const chargeSpan = document.getElementById("goback-charge-count");
      if (chargeSpan) chargeSpan.textContent = `(${goBackCharges})`;
    }

    function toggleGoBackAdButton(show) {
      const adButton = document.getElementById("goback-ad-button");
      if (adButton) {
        if (show) {
          adButton.classList.remove("hidden");
        } else {
          adButton.classList.add("hidden");
        }
      }
    }

    function setupStore() {
      const themeContainer = document.getElementById("theme-container");
      const colorThemeContainer = document.getElementById(
        "color-theme-container"
      );
      const closeStoreButton = document.getElementById("close-store");
      const storeButton = document.getElementById("store-button");
      const tabs = document.querySelectorAll(".store-tab");

      tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          tabs.forEach((t) => t.classList.remove("active"));
          document.getElementById("theme-container").classList.remove("active");
          document
            .getElementById("color-theme-container")
            .classList.remove("active");
          tab.classList.add("active");
          const tabName = tab.getAttribute("data-tab");
          const content = document.querySelector(
            `[data-tab-content="${tabName}"]`
          );
          if (content) {
            content.classList.add("active");
            if (tabName === "animals") updateStoreContent();
            else if (tabName === "themes") updateColorThemeContent();
          }
        });
      });

      closeStoreButton.addEventListener("click", () => {
        storeModal.classList.add("hidden");
        if (window.PokiSDK && !gameOver && !won) PokiSDK.gameplayStart();
      });

      storeButton.addEventListener("click", () => {
        const activeTab = document.querySelector(".store-tab.active");
        if (activeTab) {
          const tabName = activeTab.getAttribute("data-tab");
          if (tabName === "animals") updateStoreContent();
          else if (tabName === "themes") updateColorThemeContent();
        } else {
          updateStoreContent();
          updateColorThemeContent();
        }
        storeModal.classList.remove("hidden");
        if (window.PokiSDK) PokiSDK.gameplayStop();
      });
    }

    function updateStoreContent() {
      const themeContainer = document.getElementById("theme-container");
      themeContainer.innerHTML = "";
      const themeOrder = ["default", "ocean", "farm", "insects"];
      themeOrder.forEach((themeId) => {
        if (themeSets[themeId])
          addThemeToStore(themeSets[themeId], themeContainer);
      });
    }

    function addThemeToStore(theme, container) {
      const isPurchased = purchasedThemes.includes(theme.id);
      const isSelected = selectedTheme === theme.id;
      const themeItem = document.createElement("div");
      themeItem.classList.add("theme-item");

      const themeHeader = document.createElement("div");
      themeHeader.classList.add("theme-header");
      const themeTitle = document.createElement("div");
      themeTitle.classList.add("theme-title");
      themeTitle.textContent = theme.name;
      const themeStatus = document.createElement("div");
      themeStatus.classList.add("theme-status");
      themeStatus.textContent = isSelected
        ? "Selected"
        : isPurchased
        ? "Purchased"
        : `Cost: ${theme.price.toLocaleString()}`;
      themeHeader.appendChild(themeTitle);
      themeHeader.appendChild(themeStatus);
      themeItem.appendChild(themeHeader);

      const themePreview = document.createElement("div");
      themePreview.classList.add("theme-preview");
      const allValues = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
      allValues.forEach((value) => {
        const previewTile = document.createElement("div");
        previewTile.classList.add("preview-tile");
        const previewEmoji = document.createElement("div");
        previewEmoji.classList.add("preview-emoji");
        previewEmoji.textContent = theme.animals[value]?.emoji || "?";
        const previewValue = document.createElement("div");
        previewValue.classList.add("preview-value");
        previewValue.textContent = value;
        previewTile.appendChild(previewEmoji);
        previewTile.appendChild(previewValue);
        themePreview.appendChild(previewTile);
      });
      themeItem.appendChild(themePreview);

      const actionButton = document.createElement("button");
      actionButton.classList.add("theme-button");
      if (isSelected) {
        actionButton.textContent = "Selected";
        actionButton.classList.add("theme-selected");
        actionButton.disabled = true;
      } else if (isPurchased) {
        actionButton.textContent = "Select";
        actionButton.classList.add("theme-purchased");
        actionButton.addEventListener("click", () => {
          selectTheme(theme.id);
        });
      } else {
        actionButton.textContent = "Purchase";
        actionButton.classList.add("theme-locked");
        actionButton.addEventListener("click", () => {
          purchaseTheme(theme.id);
        });
      }
      themeItem.appendChild(actionButton);
      container.appendChild(themeItem);
    }

    function selectTheme(themeId) {
      if (!themeSets[themeId] || !purchasedThemes.includes(themeId)) return;
      selectedTheme = themeId;
      updateStoreContent();
      updateAllTileEmojis();
      renderBoard();
      savePersistentData();
    }

    function updateColorThemeContent() {
      const colorThemeContainer = document.getElementById(
        "color-theme-container"
      );
      colorThemeContainer.innerHTML = "";
      const themeOrder = ["light", "batman", "summer", "cozy", "ice", "zen"];
      themeOrder.forEach((themeId) => {
        if (colorThemes[themeId])
          addColorThemeToStore(colorThemes[themeId], colorThemeContainer);
      });
    }

    function addColorThemeToStore(theme, container) {
      const isPurchased = purchasedColorThemes.includes(theme.id);
      const isSelected = selectedColorTheme === theme.id;
      const themeItem = document.createElement("div");
      themeItem.classList.add("theme-item");

      const themeHeader = document.createElement("div");
      themeHeader.classList.add("theme-header");
      const themeTitle = document.createElement("div");
      themeTitle.classList.add("theme-title");
      themeTitle.textContent = theme.name;
      const themeStatus = document.createElement("div");
      themeStatus.classList.add("theme-status");
      themeStatus.textContent = isSelected
        ? "Selected"
        : isPurchased
        ? "Purchased"
        : `Cost: ${theme.price.toLocaleString()}`;
      themeHeader.appendChild(themeTitle);
      themeHeader.appendChild(themeStatus);
      themeItem.appendChild(themeHeader);

      const themePreview = document.createElement("div");
      themePreview.classList.add("color-theme-preview");
      const mainColors = [
        { name: "Primary", var: "--primary-color" },
        { name: "Secondary", var: "--secondary-color" },
        { name: "Accent", var: "--accent-color" },
        { name: "Background", var: "--background-color" },
        { name: "Text", var: "--dark-text" },
      ];
      mainColors.forEach((color) => {
        const swatch = document.createElement("div");
        swatch.classList.add("color-swatch");
        const colorBox = document.createElement("div");
        colorBox.classList.add("color-box");
        colorBox.style.backgroundColor = theme.colors[color.var];
        const colorName = document.createElement("div");
        colorName.classList.add("color-name");
        colorName.textContent = color.name;
        swatch.appendChild(colorBox);
        swatch.appendChild(colorName);
        themePreview.appendChild(swatch);
      });
      themeItem.appendChild(themePreview);

      const actionButton = document.createElement("button");
      actionButton.classList.add("theme-button");
      if (isSelected) {
        actionButton.textContent = "Selected";
        actionButton.classList.add("theme-selected");
        actionButton.disabled = true;
      } else if (isPurchased) {
        actionButton.textContent = "Select";
        actionButton.classList.add("theme-purchased");
        actionButton.addEventListener("click", () => {
          selectColorTheme(theme.id);
        });
      } else {
        actionButton.textContent = "Purchase";
        actionButton.classList.add("theme-locked");
        actionButton.addEventListener("click", () => {
          purchaseColorTheme(theme.id);
        });
      }
      themeItem.appendChild(actionButton);
      container.appendChild(themeItem);
    }

    function selectColorTheme(themeId) {
      if (!colorThemes[themeId] || !purchasedColorThemes.includes(themeId))
        return;
      selectedColorTheme = themeId;
      applyColorTheme(themeId);
      updateColorThemeContent();
      savePersistentData();
    }

    function applyColorTheme(themeId) {
      const theme = colorThemes[themeId];
      if (!theme) return;
      Object.entries(theme.colors).forEach(([variable, value]) => {
        document.documentElement.style.setProperty(variable, value);
      });
      adjustIconColors();
    }

    function handleGoBack() {
      if (goBackCooldown > 0 || moveHistory.length === 0 || goBackCharges <= 0)
        return;

      const previousState = moveHistory.pop();
      grid = previousState.grid;
      renderBoard();

      goBackCharges--;
      updateGoBackChargeDisplay();

      if (goBackCharges <= 0) {
        goBackCooldown = 300;
        updateGoBackButtonText();
        startGoBackCooldownTimer();
        toggleGoBackAdButton(true);
        const cooldownEndTime = Date.now() + goBackCooldown * 1000;
        const savedData = JSON.parse(localStorage.getItem("animal2048")) || {};
        savedData.goBackCooldownEnd = cooldownEndTime;
        localStorage.setItem("animal2048", JSON.stringify(savedData));
      }

      updateGoBackButtonState();
      savePersistentData();
    }

    function startGoBackCooldownTimer() {
      if (goBackCooldownInterval) clearInterval(goBackCooldownInterval);
      goBackCooldownInterval = setInterval(() => {
        goBackCooldown--;
        updateGoBackButtonText();
        if (goBackCooldown <= 0) {
          clearInterval(goBackCooldownInterval);
          goBackCooldownInterval = null;
          updateGoBackButtonText();
          updateGoBackButtonState();
          goBackCharges = 3;
          updateGoBackChargeDisplay();
          savePersistentData();
          toggleGoBackAdButton(false);
        }
      }, 1000);
    }

    function showRewardedAd(feature) {
      if (window.PokiSDK) {
        adIsPlaying = true;
        if (window.PokiSDK) PokiSDK.gameplayStop();
        PokiSDK.rewardedBreak(() => {
          pauseGameAudio();
        }).then((success) => {
          adIsPlaying = false;
          resumeGameAudio();
          if (success) {
            if (feature === "swap") {
              swapTileCharges = 3;
              updateSwapChargeDisplay();
              swapCooldown = 0;
              updateSwapButtonText();
              if (swapCooldownInterval) clearInterval(swapCooldownInterval);
              swapCooldownInterval = null;
              toggleSwapAdButton(false);
            } else if (feature === "goback") {
              goBackCharges = 3;
              updateGoBackChargeDisplay();
              goBackCooldown = 0;
              updateGoBackButtonText();
              updateGoBackButtonState();
              if (goBackCooldownInterval) clearInterval(goBackCooldownInterval);
              goBackCooldownInterval = null;
              toggleGoBackAdButton(false);
            }
            savePersistentData();
          }
          resumeGameplayIfAppropriate();
        });
      } else {
        console.warn("Poki SDK not available, granting reward directly");
        if (feature === "swap") {
          swapTileCharges = 3;
          updateSwapChargeDisplay();
          swapCooldown = 0;
          updateSwapButtonText();
          if (swapCooldownInterval) clearInterval(swapCooldownInterval);
          swapCooldownInterval = null;
          toggleSwapAdButton(false);
        } else if (feature === "goback") {
          goBackCharges = 3;
          updateGoBackChargeDisplay();
          goBackCooldown = 0;
          updateGoBackButtonText();
          updateGoBackButtonState();
          if (goBackCooldownInterval) clearInterval(goBackCooldownInterval);
          goBackCooldownInterval = null;
          toggleGoBackAdButton(false);
        }
        savePersistentData();
      }
    }

    function updateGoBackButtonText() {
      const cooldownSpan = document.getElementById("goback-cooldown");
      const goBackButton = document.getElementById("go-back-button");
      if (!cooldownSpan || !goBackButton) return;

      if (goBackCooldown <= 0) {
        cooldownSpan.textContent = "";
        goBackButton.classList.remove("cooldown");
      } else {
        const minutes = Math.floor(goBackCooldown / 60);
        const seconds = goBackCooldown % 60;
        cooldownSpan.textContent = `${minutes}:${seconds
          .toString()
          .padStart(2, "0")}`;
        goBackButton.classList.add("cooldown");
      }
      toggleGoBackAdButton(goBackCharges <= 0);
      updateGoBackButtonState();
    }

    function updateGoBackButtonState() {
      const goBackButton = document.getElementById("go-back-button");
      if (!goBackButton) return;
      goBackButton.disabled =
        moveHistory.length === 0 || goBackCooldown > 0 || goBackCharges <= 0;
      if (goBackButton.disabled) {
        goBackButton.classList.add("disabled");
      } else {
        goBackButton.classList.remove("disabled");
      }
    }

    function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function showCommercialBreak(onComplete) {
      if (window.PokiSDK) {
        adIsPlaying = true;
        if (window.PokiSDK) PokiSDK.gameplayStop();
        PokiSDK.commercialBreak(() => {
          pauseGameAudio();
        }).then(() => {
          adIsPlaying = false;
          resumeGameAudio();
          if (typeof onComplete === "function") onComplete();
          resumeGameplayIfAppropriate();
        });
      } else {
        console.warn("Poki SDK not available, skipping commercial break");
        if (typeof onComplete === "function") onComplete();
      }
    }

    function setupEventListeners() {
      const closeTutorialButton = document.getElementById("close-tutorial");
      if (closeTutorialButton) {
        closeTutorialButton.addEventListener("click", () => {
          tutorialModal.classList.add("hidden");
          resumeGameplayIfAppropriate();
        });
      }
      const helpButton = document.getElementById("help-button");
      if (helpButton) {
        helpButton.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          settingsModal.classList.add("hidden");
          showTutorial();
        });
      }

      document.addEventListener(
        "contextmenu",
        (e) => e.preventDefault(),
        false
      );
      document.addEventListener(
        "keydown",
        (e) => {
          if (
            (e.ctrlKey || e.metaKey) &&
            (e.key === "c" || e.key === "v" || e.key === "x" || e.key === "a")
          ) {
            e.preventDefault();
          }
        },
        false
      );

      document.addEventListener("keydown", handleKeyPress);
      gameBoard.addEventListener("touchstart", handleTouchStart, {
        passive: !isInIframe,
      });
      gameBoard.addEventListener("touchmove", handleTouchMove, {
        passive: !isInIframe,
      });
      gameBoard.addEventListener("touchend", handleTouchEnd, {
        passive: !isInIframe,
      });

      const resetGameButton = document.getElementById("reset-game-button");
      const resetConfirmYes = document.getElementById("reset-confirm-yes");
      const resetConfirmNo = document.getElementById("reset-confirm-no");

      if (resetGameButton) {
        resetGameButton.addEventListener("click", () => {
          resetConfirmModal.classList.remove("hidden");
          settingsModal.classList.add("hidden");
          if (window.PokiSDK) PokiSDK.gameplayStop();
        });
      }
      if (resetConfirmYes) {
        resetConfirmYes.addEventListener("click", () => {
          resetGameCompletely();
          resetConfirmModal.classList.add("hidden");
        });
      }
      if (resetConfirmNo) {
        resetConfirmNo.addEventListener("click", () => {
          resetConfirmModal.classList.add("hidden");
          settingsModal.classList.remove("hidden");
        });
      }

      newGameButton.addEventListener("click", () => {
        showCommercialBreak(() => {
          setupNewGame();
          renderBoard();
        });
      });
      restartButton.addEventListener("click", () => {
        gameOverModal.classList.add("hidden");
        showCommercialBreak(() => {
          setupNewGame();
          renderBoard();
        });
      });
      restartWinButton.addEventListener("click", () => {
        winModal.classList.add("hidden");
        showCommercialBreak(() => {
          setupNewGame();
          renderBoard();
        });
      });
      continueButton.addEventListener("click", () => {
        winModal.classList.add("hidden");
        continueAfterWin = true;
        resumeGameplayIfAppropriate();
      });

      const queueToggle = document.getElementById("queue-toggle");
      if (queueToggle) {
        queueToggle.textContent = useInputQueue
          ? "Disable Input Queue"
          : "Enable Input Queue";
        queueToggle.addEventListener("click", () => {
          useInputQueue = !useInputQueue;
          queueToggle.textContent = useInputQueue
            ? "Disable Input Queue"
            : "Enable Input Queue";
          if (!useInputQueue) moveQueue = [];
          savePersistentData();
        });
      }

      settingsButton.addEventListener("click", () => {
        const soundToggle = document.getElementById("sound-toggle");
        if (soundToggle)
          soundToggle.textContent = soundMuted
            ? "Unmute Sounds"
            : "Mute Sounds";
        const currencyAnimationToggle = document.getElementById(
          "currency-animation-toggle"
        );
        if (currencyAnimationToggle)
          currencyAnimationToggle.textContent = showCurrencyAnimations
            ? "Disable Animations"
            : "Enable Animations";
        settingsModal.classList.remove("hidden");
        if (window.PokiSDK) PokiSDK.gameplayStop();
      });

      const closeSettingsButton = document.getElementById("close-settings");
      if (closeSettingsButton) {
        closeSettingsButton.addEventListener("click", () => {
          settingsModal.classList.add("hidden");
          resumeGameplayIfAppropriate();
        });
      }

      const soundToggle = document.getElementById("sound-toggle");
      if (soundToggle) {
        soundToggle.addEventListener("click", () => {
          soundMuted = !soundMuted;
          soundToggle.textContent = soundMuted
            ? "Unmute Sounds"
            : "Mute Sounds";
          savePersistentData();
          if (
            !soundMuted &&
            audioContext &&
            audioContext.state === "suspended"
          ) {
            audioContext.resume().catch(console.error);
          }
        });
      }

      const currencyAnimationToggle = document.getElementById(
        "currency-animation-toggle"
      );
      if (currencyAnimationToggle) {
        currencyAnimationToggle.textContent = showCurrencyAnimations
          ? "Disable Animations"
          : "Enable Animations";
        currencyAnimationToggle.addEventListener("click", () => {
          showCurrencyAnimations = !showCurrencyAnimations;
          currencyAnimationToggle.textContent = showCurrencyAnimations
            ? "Disable Animations"
            : "Enable Animations";
          savePersistentData();
        });
      }

      const initAudioOnInteraction = () => {
        if (!audioInitialized) {
          initializeAudio().then(() => {
            console.log("Audio initialized on user interaction");
          });
          document.removeEventListener("click", initAudioOnInteraction);
          document.removeEventListener("keydown", initAudioOnInteraction);
          document.removeEventListener("touchstart", initAudioOnInteraction);
        }
        tryStartInitialGameplay();
      };
      document.addEventListener("click", initAudioOnInteraction);
      document.addEventListener("keydown", initAudioOnInteraction);
      document.addEventListener("touchstart", initAudioOnInteraction);
    }

    function checkFirstTimePlayer() {
      const firstTimePlayer =
        localStorage.getItem("animal2048_first_time") === null;
      if (firstTimePlayer) {
        showTutorial();
        localStorage.setItem("animal2048_first_time", "false");
      }
    }

    function showTutorial() {
      if (tutorialModal) {
        tutorialModal.classList.remove("hidden");
        if (window.PokiSDK) PokiSDK.gameplayStop();
      }
    }

    function resetGameCompletely() {
      resetGameStats();
      swapTileCharges = 3;
      goBackCharges = 3;
      updateSwapChargeDisplay();
      updateGoBackChargeDisplay();
      swapCooldown = 0;
      goBackCooldown = 0;
      updateSwapButtonText();
      updateGoBackButtonText();
      toggleSwapAdButton(false);
      toggleGoBackAdButton(false);
      currency = 0;
      updateCurrencyDisplay();
      purchasedThemes = ["default"];
      purchasedColorThemes = ["light", "batman"];
      selectedTheme = "default";
      selectedColorTheme = "light";
      applyColorTheme("light");
      updateAllTileEmojis();
      setupNewGame();
      renderBoard();
      soundMuted = false;
      showCurrencyAnimations = true;
      const soundToggle = document.getElementById("sound-toggle");
      if (soundToggle) soundToggle.textContent = "Mute Sounds";
      const currencyAnimationToggle = document.getElementById(
        "currency-animation-toggle"
      );
      if (currencyAnimationToggle)
        currencyAnimationToggle.textContent = "Disable Animations";
      updateStoreContent();
      updateColorThemeContent();
      savePersistentData();
      localStorage.removeItem("animal2048");
      savePersistentData();
      initialGameplayStarted = false;
    }

    function initializeAudio() {
      if (audioInitialized) return Promise.resolve();
      return new Promise((resolve, reject) => {
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (!AudioContext) {
            console.warn("Web Audio API is not supported");
            return reject(new Error("Web Audio API not supported"));
          }
          audioContext = new AudioContext();
          console.log("Audio Context Created", {
            state: audioContext.state,
            sampleRate: audioContext.sampleRate,
          });

          const soundsToLoad = [
            { url: "mergeSound1.mp3", id: "merge1" },
            { url: "mergeSound2.mp3", id: "merge2" },
            { url: "mergeSound3.mp3", id: "merge3" },
            { url: "swipeSound.mp3", id: "swipe" },
          ];
          const loadPromises = soundsToLoad.map((sound) =>
            loadSoundWithRetry(sound.url, sound.id)
          );

          Promise.all(loadPromises)
            .then(() => {
              audioInitialized = true;
              console.log("All sounds loaded successfully");
              resolve();
            })
            .catch((error) => {
              console.error("Sound loading failed:", error);
              reject(error);
            });
        } catch (error) {
          console.error("Audio initialization error:", error);
          reject(error);
        }
      });
    }

    function loadSoundWithRetry(url, id, maxRetries = 3) {
      return new Promise((resolve, reject) => {
        function attemptLoad(retriesLeft) {
          fetch(url)
            .then((response) => {
              if (!response.ok)
                throw new Error(`HTTP error! Status: ${response.status}`);
              return response.arrayBuffer();
            })
            .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
            .then((audioBuffer) => {
              audioBuffers[id] = audioBuffer;
              resolve(audioBuffer);
            })
            .catch((error) => {
              console.warn(
                `Error loading sound ${url}, ${retriesLeft} retries left`,
                error
              );
              if (retriesLeft > 0) {
                const delay = (maxRetries - retriesLeft) * 1000;
                setTimeout(() => attemptLoad(retriesLeft - 1), delay);
              } else {
                console.error(
                  `Failed to load sound ${url} after multiple attempts`
                );
                reject(error);
              }
            });
        }
        attemptLoad(maxRetries);
      });
    }

    function toggleSound() {
      soundMuted = !soundMuted;
      if (!soundMuted && audioContext && audioContext.state === "suspended") {
        audioContext.resume().catch(console.error);
      }
      const soundButton = document.getElementById("sound-toggle");
      if (soundButton)
        soundButton.textContent = soundMuted ? "Unmute Sounds" : "Mute Sounds";
      savePersistentData();
    }

    function playRandomMergeSound() {
      if (soundMuted || !audioInitialized) return;
      if (audioContext.state === "suspended")
        audioContext.resume().catch(console.error);
      const soundIndex = Math.floor(Math.random() * 3) + 1;
      const bufferId = `merge${soundIndex}`;
      playSound(bufferId, 1.0);
    }

    function playSwipeSound() {
      if (soundMuted || !audioInitialized) return;
      if (audioContext.state === "suspended")
        audioContext.resume().catch(console.error);
      playSound("swipe", 0.3);
    }

    function playSound(id, volume = 1.0) {
      if (soundMuted || !audioInitialized || !audioContext) return;
      try {
        if (audioContext.state === "suspended")
          audioContext.resume().catch(console.error);
        const buffer = audioBuffers[id];
        if (!buffer) {
          console.warn(`Sound buffer for ${id} not found`);
          return;
        }
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        const gainNode = audioContext.createGain();
        gainNode.gain.value = volume;
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        source.start(0);
        source.onended = () => {
          source.disconnect();
          gainNode.disconnect();
        };
      } catch (error) {
        console.error(`Error playing sound ${id}:`, error);
      }
    }

    if (!Element.prototype.matches) {
      Element.prototype.matches =
        Element.prototype.msMatchesSelector ||
        Element.prototype.webkitMatchesSelector;
    }
    if (!Element.prototype.closest) {
      Element.prototype.closest = function (s) {
        var el = this;
        do {
          if (el.matches(s)) return el;
          el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
      };
    }

    init();
  }

  initializePokiSDK();
});
