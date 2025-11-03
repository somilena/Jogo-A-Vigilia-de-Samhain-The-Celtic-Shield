// Espera o HTML carregar antes de executar o script
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // --- 1. SELEÇÃO DE ELEMENTOS (DOM) ---
  const gameMainContent = document.getElementById("game-main-content");
  const gameContainer = document.getElementById("game-container");
  const hearth = document.getElementById("hearth");
  const shield = document.getElementById("shield");

  const scoreDisplay = document.getElementById("score");
  const healthBarWrapper = document.getElementById("health-bar-wrapper");
  const healthBar = document.getElementById("health-bar");

  const timerDisplay = document.getElementById("timer-display");

  // Telas
  const howToPlayScreen = document.getElementById("how-to-play-screen");
  const gameOverScreen = document.getElementById("game-over-screen");
  const gameWinScreen = document.getElementById("game-win-screen");
  // (NOVA SELEÇÃO): Tela de Super Desafio
  const superChallengeOverlay = document.getElementById(
    "super-challenge-overlay"
  );

  // Elementos de Pontuação Final nas Telas
  const finalScoreDisplay = document.getElementById("final-score");
  const finalScoreWinDisplay = document.getElementById("final-score-win");
  const finalTimeLose = document.getElementById("final-time-lose");
  const finalTimeWin = document.getElementById("final-time-win");

  // Botões
  const startGameButton = document.getElementById("start-game-button");
  const restartButton = document.getElementById("restart-button");
  const restartButtonWin = document.getElementById("restart-button-win");

  // --- ADIÇÃO DO SUPER DESAFIO ---
  // (NOVA SELEÇÃO): Botões da tela de Super Desafio
  const acceptChallengeButton = superChallengeOverlay.querySelector(".accept");
  const rejectChallengeButton = superChallengeOverlay.querySelector(".reject");

  const superChallengeDisplay = document.getElementById(
    "super-challenge-display"
  );
  const superChallengeScore = document.getElementById("super-challenge-score");
  const explanationArea = document.querySelector(".explanation-area"); // (Pega o painel da direita)
  // --- FIM DA ADIÇÃO ---

  // --- ADIÇÃO DO RANKING ---
  const showRankingButton = document.getElementById("show-ranking-button");
  const rankingOverlayScreen = document.getElementById(
    "ranking-overlay-screen"
  );
  const closeRankingButton = document.getElementById("close-ranking-button");
  const clearRankingButton = document.getElementById("clear-ranking-button");
  const rankingTableBody = document.getElementById("ranking-table-body");

  // --- ADIÇÃO DO NOVO BOTÃO ---
  const showRankingButtonInGame = document.getElementById(
    "show-ranking-button-ingame"
  );
  // --- FIM DA ADIÇÃO ---

  // --- INÍCIO DA IMPLEMENTAÇÃO DE ÁUDIO ---
  const playHistoryButton = document.getElementById("play-history-button");
  const speedHistoryButton = document.getElementById("speed-history-button");
  const themeSound = document.getElementById("snd-theme");
  const fireSound = document.getElementById("snd-fire-loop");
  const historySound = document.getElementById("snd-history");
  // --- FIM DA IMPLEMENTAÇÃO DE ÁUDIO ---

  // Painel de Desafios
  const challengeElements = {
    1: document.getElementById("challenge-1"),
    2: document.getElementById("challenge-2"),
    3: document.getElementById("challenge-3"),
    4: document.getElementById("challenge-4"),
    5: document.getElementById("challenge-5"),
  };
  const counterElements = {
    1: document.getElementById("counter-1"),
    2: document.getElementById("counter-2"),
    3: document.getElementById("counter-3"),
    4: document.getElementById("counter-4"),
    5: document.getElementById("counter-5"),
  };

  // --- 2. CONFIGURAÇÕES E ESTADO DO JOGO ---
  let score,
    health,
    gameActive,
    elapsedTime,
    currentUserName,
    isSuperChallenge = false,
    spirits = [],
    gameIntervals = [];

  // CONSTANTES DE EQUILÍBRIO
  const HEALTH_DRAIN_PER_SECOND = 0.5;
  const SPIRIT_SPEED = 1.5;
  let currentSpawnRate;
  const INITIAL_SPAWN_RATE = 2000;
  const MIN_SPAWN_RATE = 400;
  const SPAWN_RATE_DECREASE = 100;
  const SHIELD_ORBIT_RADIUS = 100;
  let shieldAngle = 0;

  // Recompensas e Punições
  const REWARD_BLOCK_BAD = 175;
  const PENALTY_BLOCK_GOOD = -25; // Score: Bloquear Espírito Bom (Perca 25 pontos)
  const PENALTY_BLOCK_GOOD_HEALTH = 0; // Saúde: Bloquear Espírito Bom (NÃO PERDE NADA)

  const REWARD_FIRE_GOOD = 75;
  const REWARD_FIRE_GOOD_HEALTH = 25; // Saúde: Espírito Bom toca Fogo (Ganha 25 de cura)

  const PENALTY_FIRE_BAD_SCORE = -50; // Score: Espírito Mau toca Fogo (Perca 50 pontos)
  const PENALTY_FIRE_BAD_HEALTH = -25; // Saúde: Espírito Mau toca Fogo (Perca 25 de vida)

  // Estado dos Desafios
  let challengeState;

  // Áudio
  let isNarrating = false;
  let playbackRateState = 1.0;
  const THEME_VOLUME_NORMAL = 0.2;
  const FIRE_VOLUME_NORMAL = 0.3;
  const THEME_VOLUME_DUCKED = 0.05;
  const FIRE_VOLUME_DUCKED = 0.05;
  const NARRATION_VOLUME = 1.0;
  const SFX_VOLUME = 0.25;

  // --- 3. EVENT LISTENERS (Mouse e Botões) ---
  startGameButton.addEventListener("click", promptForNameAndStart);
  restartButton.addEventListener("click", returnToMenu);
  restartButtonWin.addEventListener("click", returnToMenu);

  showRankingButton.addEventListener("click", showRanking);
  closeRankingButton.addEventListener("click", hideRanking);
  clearRankingButton.addEventListener("click", clearRanking);
  showRankingButtonInGame.addEventListener("click", showRanking);

  // Super Desafio (Agora nos botões da nova tela)
  acceptChallengeButton.addEventListener("click", startSuperChallenge);
  rejectChallengeButton.addEventListener("click", returnToMenu);

  // Áudio
  if (playHistoryButton) {
    playHistoryButton.addEventListener("click", toggleNarration);
  }
  if (speedHistoryButton) {
    speedHistoryButton.addEventListener("click", togglePlaybackSpeed);
  }
  if (historySound) {
    historySound.addEventListener("ended", stopNarration);
  }

  // Mouse
  gameContainer.addEventListener("mousemove", (e) => {
    if (!gameActive) return;
    const rect = gameContainer.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const centerX = gameContainer.offsetWidth / 2;
    const centerY = gameContainer.offsetHeight / 2;
    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;
    shieldAngle = Math.atan2(deltaY, deltaX);
  });

  // --- 4. FUNÇÕES PRINCIPAIS DO JOGO ---

  function startGame() {
    gameActive = true;
    isSuperChallenge = false;
    document.getElementById("challenge-panel").classList.remove("hide-panel"); // (Linha Nova)
    superChallengeDisplay.style.display = "none";

    score = 0;
    health = 100;
    elapsedTime = 0;
    spirits = [];
    shieldAngle = 0;
    challengeState = {
      banishedBad: 0,
      guidedGood: 0,
      score: 0,
      challengesCompleted: [false, false, false, false, false],
    };

    stopAllSounds();
    playLoop(themeSound, THEME_VOLUME_NORMAL);
    playLoop(fireSound, FIRE_VOLUME_NORMAL);

    if (playbackRateState !== 1.0) {
      togglePlaybackSpeed();
    }

    gameIntervals.forEach((id) => {
      clearInterval(id);
      clearTimeout(id);
    });
    gameIntervals = [];
    document.querySelectorAll(".spirit").forEach((s) => s.remove());

    howToPlayScreen.style.display = "none";
    gameOverScreen.style.display = "none";
    gameWinScreen.style.display = "none";
    // (NOVA LINHA): Esconde a tela do super desafio
    superChallengeOverlay.style.display = "none";

    gameMainContent.style.display = "flex";

    updateScore(0);
    updateHealth(100);
    updateTimerDisplay();
    resetChallengePanel();

    currentSpawnRate = INITIAL_SPAWN_RATE;
    gameIntervals.push(setInterval(gameLoop, 1000 / 60));
    gameIntervals.push(setInterval(secondlyUpdate, 1000));
    scheduleNextSpawn();
  }

  function scheduleNextSpawn() {
    if (!gameActive) return;
    spawnSpirit();
    if (currentSpawnRate > MIN_SPAWN_RATE) {
      currentSpawnRate -= SPAWN_RATE_DECREASE;
    }
    const nextSpawnId = setTimeout(scheduleNextSpawn, currentSpawnRate);
    gameIntervals.push(nextSpawnId);
  }

  function gameLoop() {
    if (!gameActive) return;
    updateShieldPosition();
    moveSpirits();
    checkShieldCollisions();
    checkFireCollisions();
  }

  function secondlyUpdate() {
    if (!gameActive) return;
    updateHealth(health - HEALTH_DRAIN_PER_SECOND);
    elapsedTime++;
    updateTimerDisplay();
  }

  function loseGame() {
    if (!gameActive) return;
    gameActive = false;
    gameIntervals.forEach((id) => {
      clearInterval(id);
      clearTimeout(id);
    });

    const status = "Derrota";
    saveCurrentGameScore(status);

    // --- LÓGICA DE FIM DO JOGO ---
    if (isSuperChallenge) {
      // BUG FIX: Se estava no Super Desafio, sempre vai para a tela final de MORTE.
      finalTimeLose.textContent = formatTime(elapsedTime);
      finalScoreDisplay.textContent = score;
      gameOverScreen.style.display = "flex";
    } else {
      // Se era o jogo normal, APENAS mostra o pop-up de proposta.
      showSuperChallengePrompt(status);
    }
  }

  function winGame() {
    if (!gameActive) return;
    gameActive = false;
    gameIntervals.forEach((id) => {
      clearInterval(id);
      clearTimeout(id);
    });

    const status = isSuperChallenge ? "Super Vitória!" : "Vitória";
    saveCurrentGameScore(status);

    if (isSuperChallenge) {
      finalTimeWin.textContent = formatTime(elapsedTime);
      finalScoreWinDisplay.textContent = score;
      gameWinScreen.style.display = "flex";
    } else {
      showSuperChallengePrompt(status);
    }
  }

  /**
   * Mostra o pop-up que pergunta se o jogador quer continuar (Tábua de Salvação).
   */
  function showSuperChallengePrompt(status) {
    // Esconde todas as telas finais/pop-ups antes de mostrar a proposta
    gameOverScreen.style.display = "none";
    gameWinScreen.style.display = "none";
    superChallengeOverlay.style.display = "none";

    // Simplesmente mostra o pop-up de proposta para o Super Desafio
    superChallengeOverlay.style.display = "flex";

    // Se desejar, você pode usar o "status" para mudar o texto dentro
    // da tela de Desafio Extra (ex: "Você Perdeu, mas...")
  }

  /**
   * Inicia o jogo no modo Super Desafio (CONTINUANDO o score).
   */
  /**
   * Inicia o jogo no modo Super Desafio (CONTINUANDO o score).
   */
  function startSuperChallenge() {
    // 1. Limpa loops antigos, mas mantém o estado do áudio
    gameIntervals.forEach((id) => {
      clearInterval(id);
      clearTimeout(id);
    });
    gameIntervals = [];

    // 2. Reseta o básico (MANTENDO O isSuperChallenge = true)
    gameActive = true;
    isSuperChallenge = true; // <--- A LINHA QUE FALTAVA (CORRIGIDA)
    health = 100;
    elapsedTime = 0;
    spirits = [];
    shieldAngle = 0;

    // (NÃO RESETA O SCORE, ele se mantém acumulado!)

    // 3. Limpa elementos visuais
    document.querySelectorAll(".spirit").forEach((s) => s.remove());
    superChallengeOverlay.style.display = "none";

    gameOverScreen.style.display = "none";
    gameWinScreen.style.display = "none";

    // 4. Mostra o Jogo e o Painel
    gameMainContent.style.display = "flex";
    explanationArea.classList.add("hide-panel"); // Esconde desafios normais
    superChallengeDisplay.style.display = "block"; // Mostra o Super Desafio

    // 5. ATUALIZA A UI (Mantém o score!)
    updateScore(score); // Mantém o score anterior!
    updateHealth(100);
    updateTimerDisplay();
    updateChallengePanel(); // Para mostrar o novo contador

    // 6. Reinicia os loops do jogo (Áudio JÁ está tocando!)
    currentSpawnRate = INITIAL_SPAWN_RATE; // (Reseta a dificuldade)
    gameIntervals.push(setInterval(gameLoop, 1000 / 60));
    gameIntervals.push(setInterval(secondlyUpdate, 1000));
    scheduleNextSpawn();
  }

  function returnToMenu() {
    gameMainContent.style.display = "none";
    gameOverScreen.style.display = "none";
    gameWinScreen.style.display = "none";
    // (NOVA LINHA): Esconde a tela do super desafio
    superChallengeOverlay.style.display = "none";
    howToPlayScreen.style.display = "flex";
  }

  // --- 5. LÓGICA DO JOGO (Movimento e Colisão) ---

  function updateShieldPosition() {
    const centerX = gameContainer.offsetWidth / 2;
    const centerY = gameContainer.offsetHeight / 2;
    const shieldX = centerX + Math.cos(shieldAngle) * SHIELD_ORBIT_RADIUS;
    const shieldY = centerY + Math.sin(shieldAngle) * SHIELD_ORBIT_RADIUS;
    shield.style.left = shieldX - shield.offsetWidth / 2 + "px";
    shield.style.top = shieldY - shield.offsetHeight / 2 + "px";
    shield.style.transform = `rotate(${shieldAngle + 1.57}rad)`;
  }

  function spawnSpirit() {
    if (!gameActive) return;
    const spirit = document.createElement("div");
    spirit.classList.add("spirit");
    const isAncestor = Math.random() < 0.4;
    const type = isAncestor ? "ancestor" : "mischievous";
    spirit.classList.add(type);
    let x, y;
    if (isAncestor) {
      if (Math.random() < 0.5) {
        x = Math.random() * gameContainer.offsetWidth;
        y = 0 - 40;
      } else {
        x = 0 - 40;
        y = Math.random() * gameContainer.offsetHeight;
      }
    } else {
      if (Math.random() < 0.5) {
        x = Math.random() * gameContainer.offsetWidth;
        y = gameContainer.offsetHeight + 40;
      } else {
        x = gameContainer.offsetWidth + 40;
        y = Math.random() * gameContainer.offsetHeight;
      }
    }
    spirit.style.left = x + "px";
    spirit.style.top = y + "px";
    const centerX = gameContainer.offsetWidth / 2;
    const centerY = gameContainer.offsetHeight / 2;
    const targetRadius = 40;
    const randomAngle = Math.random() * 2 * Math.PI;
    const randomRadius = Math.random() * targetRadius;
    const targetX = centerX + Math.cos(randomAngle) * randomRadius;
    const targetY = centerY + Math.sin(randomAngle) * randomRadius;
    const dx = targetX - x;
    const dy = targetY - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const vecX = dx / distance;
    const vecY = dy / distance;
    gameContainer.appendChild(spirit);
    spirits.push({
      element: spirit,
      type: type,
      x: x,
      y: y,
      vecX: vecX,
      vecY: vecY,
    });
  }

  function moveSpirits() {
    spirits.forEach((spirit) => {
      const newX = spirit.x + spirit.vecX * SPIRIT_SPEED;
      const newY = spirit.y + spirit.vecY * SPIRIT_SPEED;
      spirit.x = newX;
      spirit.y = newY;
      spirit.element.style.left = spirit.x + "px";
      spirit.element.style.top = spirit.y + "px";
    });
  }

  /**
   * Gera um número inteiro aleatório entre um valor mínimo e máximo (inclusivo).
   */
  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // ESCUDO COLISÃO

  function checkShieldCollisions() {
    if (!gameActive) return;
    const shieldRect = shield.getBoundingClientRect();
    for (let i = spirits.length - 1; i >= 0; i--) {
      const spirit = spirits[i];
      const spiritRect = spirit.element.getBoundingClientRect();
      const isColliding = !(
        shieldRect.right < spiritRect.left ||
        shieldRect.left > spiritRect.right ||
        shieldRect.bottom < spiritRect.top ||
        shieldRect.top > spiritRect.bottom
      );
      if (isColliding) {
        if (spirit.type === "ancestor") {
          // --- ESCUDO TOCA ESPÍRITO BOM (DOGUINHO) ---
          // Só perde 25 pontos e não perde/ganha vida (0)
          updateScore(score + PENALTY_BLOCK_GOOD);
          updateHealth(health + PENALTY_BLOCK_GOOD_HEALTH); // ONDE A SAÚDE É 0!
          playSound("snd-block-good");
          createEffect("fail", spirit);
        } else {
          // --- ESCUDO TOCA ESPÍRITO RUIM (COELHO) ---
          // O NOVO CÁLCULO DE PONTUAÇÃO ALEATÓRIA:
          const randomReward = getRandomInt(28, 175);
          updateScore(score + randomReward);
          // Ganha 175 pontos e NADA ACONTECE com a vida.
          // updateScore(score + REWARD_BLOCK_BAD); // Ganha 175 pontos
          // ** LINHA updateHealth DEVE SER EXCLUÍDA AQUI **
          challengeState.banishedBad++;
          playSound("snd-block-bad");
          createEffect("banish", spirit);
        }

        spirit.element.remove();
        spirits.splice(i, 1);
        i--;
      }
    }
  }

  function checkFireCollisions() {
    if (!gameActive) return;
    const hearthRect = hearth.getBoundingClientRect();
    for (let i = spirits.length - 1; i >= 0; i--) {
      const spirit = spirits[i];
      const spiritRect = spirit.element.getBoundingClientRect();
      const isColliding = !(
        hearthRect.right < spiritRect.left ||
        hearthRect.left > spiritRect.right ||
        hearthRect.bottom < spiritRect.top ||
        hearthRect.top > spiritRect.bottom
      );
      if (isColliding) {
        if (spirit.type === "ancestor") {
          // --- DOGUINHO BOM TOCA FOGO ---
          // O NOVO CÁLCULO DE PONTUAÇÃO ALEATÓRIA:
          const randomReward = getRandomInt(25, 150);
          updateScore(score + randomReward);
          // Ganha 75 pontos e 25 cura (com as novas constantes)
          updateHealth(health + REWARD_FIRE_GOOD_HEALTH);
          updateScore(score + REWARD_FIRE_GOOD);
          challengeState.guidedGood++;
          playSound("snd-fire-good");
          createEffect("banish", spirit);
        } else {
          // --- COELHO MAU TOCA FOGO ---
          // Perde 25 vida e 50 pontos (com as novas constantes)
          updateHealth(health + PENALTY_FIRE_BAD_HEALTH); // Perca 25 de Vida
          updateScore(score + PENALTY_FIRE_BAD_SCORE); // Perca 50 de Pontos

          playSound("snd-fire-bad");
          createEffect("fail", spirit);
        }

        spirit.element.remove();
        spirits.splice(i, 1);
        updateChallengePanel();
      }
    }
  }

  // --- 6. FUNÇÕES DE ÁUDIO (AGORA AGRUPADAS) ---

  function playLoop(soundElement, volume) {
    if (soundElement) {
      soundElement.volume = volume;
      if (soundElement.paused) {
        soundElement.play();
      }
    }
  }

  function stopLoop(soundElement) {
    if (soundElement) {
      soundElement.pause();
      soundElement.currentTime = 0;
    }
  }

  function playSound(soundId) {
    const soundElement = document.getElementById(soundId);
    if (soundElement) {
      soundElement.volume = SFX_VOLUME;
      soundElement.currentTime = 0;
      soundElement.play();
    }
  }

  function stopAllSounds() {
    stopLoop(themeSound);
    stopLoop(fireSound);
    stopNarration();
  }

  function toggleNarration() {
    if (isNarrating) {
      stopNarration();
    } else {
      playNarration();
    }
  }

  function playNarration() {
    isNarrating = true;
    if (playHistoryButton) {
      playHistoryButton.textContent = "■";
      playHistoryButton.classList.add("playing");
    }
    if (gameActive) {
      playLoop(fireSound, FIRE_VOLUME_DUCKED);
      playLoop(themeSound, THEME_VOLUME_DUCKED);
    }
    if (historySound) {
      historySound.volume = NARRATION_VOLUME;
      historySound.playbackRate = playbackRateState;
      historySound.currentTime = 0;
      historySound.play();
    }
  }

  function stopNarration() {
    isNarrating = false;
    if (playHistoryButton) {
      playHistoryButton.textContent = "►";
      playHistoryButton.classList.remove("playing");
    }
    if (historySound) {
      historySound.pause();
      historySound.currentTime = 0;
    }
    if (gameActive) {
      playLoop(fireSound, FIRE_VOLUME_NORMAL);
      playLoop(themeSound, THEME_VOLUME_NORMAL);
    }
  }

  function togglePlaybackSpeed() {
    if (playbackRateState === 1.0) {
      playbackRateState = 1.5;
      speedHistoryButton.textContent = "1.5x";
      speedHistoryButton.classList.add("fast");
    } else {
      playbackRateState = 1.0;
      speedHistoryButton.textContent = "1x";
      speedHistoryButton.classList.remove("fast");
    }
    if (historySound) {
      historySound.playbackRate = playbackRateState;
    }
  }

  // --- 7. FUNÇÕES DE UI E DESAFIOS (Seção Movida) ---

  function createEffect(type, spirit) {
    const spiritCenterX = spirit.x + 20;
    const spiritCenterY = spirit.y + 20;
    if (type === "banish") {
      for (let i = 0; i < 5; i++) {
        const particle = document.createElement("div");
        particle.classList.add("effect-particle");
        particle.style.left = spiritCenterX + "px";
        particle.style.top = spiritCenterY + "px";
        const dx = (Math.random() - 0.5) * 150;
        const dy = (Math.random() - 0.5) * 150;
        particle.style.setProperty("--dx", `${dx}px`);
        particle.style.setProperty("--dy", `${dy}px`);
        gameContainer.appendChild(particle);
        setTimeout(() => particle.remove(), 500);
      }
    } else if (type === "fail") {
      const shockwave = document.createElement("div");
      shockwave.classList.add("effect-shockwave");
      shockwave.style.left = spiritCenterX + "px";
      shockwave.style.top = spiritCenterY + "px";
      gameContainer.appendChild(shockwave);
      setTimeout(() => shockwave.remove(), 400);
    }
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const formattedSeconds =
      remainingSeconds < 10 ? "0" + remainingSeconds : remainingSeconds;
    const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
    return `${formattedMinutes}:${formattedSeconds}`;
  }

  function updateTimerDisplay() {
    if (timerDisplay) {
      timerDisplay.textContent = formatTime(elapsedTime);
    }
  }

  function updateHealth(newValue) {
    if (!gameActive && health <= 0) return;
    health = Math.max(0, Math.min(100, newValue));
    healthBar.style.width = health + "%";

    if (health > 60) {
      healthBar.style.background =
        "linear-gradient(to right, #00ff00, #ffff00)";
      if (healthBarWrapper)
        healthBarWrapper.style.animation =
          "health-pulse-high 2s infinite alternate ease-in-out";
    } else if (health > 30) {
      healthBar.style.background =
        "linear-gradient(to right, #ffa500, #ffff00)";
      if (healthBarWrapper)
        healthBarWrapper.style.animation =
          "health-pulse-medium 1.5s infinite alternate ease-in-out";
    } else {
      healthBar.style.background =
        "linear-gradient(to right, #ff0000, #ffa500)";
      if (healthBarWrapper)
        healthBarWrapper.style.animation =
          "health-pulse-low 1s infinite alternate ease-in-out";
    }

    const minScale = 0.6;
    const maxScale = 1.3;
    const scaleFactor = minScale + (maxScale - minScale) * (health / 100);
    hearth.style.transform = `translate(-50%, -50%) scale(${scaleFactor})`;

    if (health <= 0) {
      loseGame();
    }
  }

  function updateScore(newValue) {
    if (!gameActive) return;
    score = Math.max(0, newValue);
    scoreDisplay.textContent = score;
    challengeState.score = score;

    updateChallengePanel();
  }

  function resetChallengePanel() {
    for (let i = 1; i <= 5; i++) {
      challengeElements[i].classList.remove("completed");
    }
    counterElements[1].textContent = `(0/5)`;
    counterElements[2].textContent = `(0/5)`;
    counterElements[3].textContent = `(0/2500)`;
    counterElements[4].textContent = `(0/20)`;
    counterElements[5].textContent = `(0/5000)`;
  }

  function updateChallengePanel() {
    if (!gameActive) return;

    if (isSuperChallenge) {
      let countSuper = Math.min(challengeState.score, 15000);
      superChallengeScore.textContent = `(${countSuper}/15000)`;

      if (challengeState.score >= 15000) {
        winGame();
      }
      return;
    }

    let allChallengesDone = true;

    // Desafio 1
    let count1 = Math.min(challengeState.banishedBad, 5);
    counterElements[1].textContent = `(${count1}/5)`;
    if (
      challengeState.banishedBad >= 5 &&
      !challengeState.challengesCompleted[0]
    ) {
      challengeState.challengesCompleted[0] = true;
      challengeElements[1].classList.add("completed");
    }
    if (!challengeState.challengesCompleted[0]) allChallengesDone = false;

    // Desafio 2
    let count2 = Math.min(challengeState.guidedGood, 5);
    counterElements[2].textContent = `(${count2}/5)`;
    if (
      challengeState.guidedGood >= 5 &&
      !challengeState.challengesCompleted[1]
    ) {
      challengeState.challengesCompleted[1] = true;
      challengeElements[2].classList.add("completed");
    }
    if (!challengeState.challengesCompleted[1]) allChallengesDone = false;

    // Desafio 3
    let count3 = Math.min(challengeState.score, 2500);
    counterElements[3].textContent = `(${count3}/2500)`;
    if (
      challengeState.score >= 2500 &&
      !challengeState.challengesCompleted[2]
    ) {
      challengeState.challengesCompleted[2] = true;
      challengeElements[3].classList.add("completed");
    }
    if (!challengeState.challengesCompleted[2]) allChallengesDone = false;

    // Desafio 4
    let count4 = Math.min(challengeState.banishedBad, 20);
    counterElements[4].textContent = `(${count4}/20)`;
    if (
      challengeState.banishedBad >= 20 &&
      !challengeState.challengesCompleted[3]
    ) {
      challengeState.challengesCompleted[3] = true;
      challengeElements[4].classList.add("completed");
    }
    if (!challengeState.challengesCompleted[3]) allChallengesDone = false;

    // Desafio 5
    let count5 = Math.min(challengeState.score, 5000);
    counterElements[5].textContent = `(${count5}/5000)`;
    if (
      challengeState.score >= 5000 &&
      !challengeState.challengesCompleted[4]
    ) {
      challengeState.challengesCompleted[4] = true;
      challengeElements[5].classList.add("completed");
    }
    if (!challengeState.challengesCompleted[4]) allChallengesDone = false;

    if (allChallengesDone) {
      winGame();
    }
  }

  // --- 8. LÓGICA DE RANKING (NOVAS FUNÇÕES) ---

  function promptForNameAndStart() {
    let name = prompt("Digite seu nome de usuário (3-10 caracteres, único):");
    if (!name) return;
    name = name.trim().substring(0, 10);
    if (name.length < 3) {
      alert("Nome muito curto! (Mínimo 3 caracteres)");
      return;
    }
    const scores = getScores();
    const nameExists = scores.some(
      (entry) => entry.name.toLowerCase() === name.toLowerCase()
    );
    if (nameExists) {
      alert("Este nome já existe no ranking! Por favor, escolha outro.");
      return;
    }
    currentUserName = name;
    startGame();
  }

  function getScores() {
    const scores = localStorage.getItem("samhainRanking");
    return scores ? JSON.parse(scores) : [];
  }

  function saveCurrentGameScore(status) {
    if (!currentUserName) return;

    const scores = getScores();
    let userEntry = scores.find(
      (entry) => entry.name.toLowerCase() === currentUserName.toLowerCase()
    );

    if (userEntry) {
      if (score > userEntry.score) {
        userEntry.score = score;
        userEntry.status = status;
      }
    } else {
      scores.push({
        name: currentUserName,
        score: score,
        status: status,
      });
    }
    localStorage.setItem("samhainRanking", JSON.stringify(scores));
  }

  function loadRankingTable() {
    const scores = getScores();
    scores.sort((a, b) => b.score - a.score);
    rankingTableBody.innerHTML = "";
    const top10 = scores.slice(0, 10);
    top10.forEach((entry, index) => {
      const row = document.createElement("tr");
      let statusClass =
        entry.status === "Vitória" || entry.status === "Super Vitória!"
          ? "status-win"
          : "status-lose";
      row.innerHTML = `
        <td>#${index + 1}</td>
        <td>${entry.name}</td>
        <td>${entry.score}</td>
        <td class="${statusClass}">${entry.status}</td>
      `;
      rankingTableBody.appendChild(row);
    });
    if (scores.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="4">Nenhum recorde ainda. Jogue!</td>`;
      rankingTableBody.appendChild(row);
    }
  }

  function showRanking() {
    loadRankingTable();
    rankingOverlayScreen.style.display = "flex";
  }

  function hideRanking() {
    rankingOverlayScreen.style.display = "none";
  }

  function clearRanking() {
    if (
      confirm("Tem certeza que quer apagar TODOS os recordes permanentemente?")
    ) {
      localStorage.removeItem("samhainRanking");
      loadRankingTable();
    }
  }

  // --- EFEITO DE FOLHAS CADENTES ---
  const leafFallContainer = document.getElementById("leaf-fall-container");
  const numLeaves = 30; // Número de folhas ativas simultaneamente
  // ATUALIZE AQUI com os nomes das suas classes de imagem
  const leafTypes = ["type-1", "type-2", "type-3"]; // Classes CSS para os tipos de folha/imagem

  function createFallingLeaf() {
    if (!leafFallContainer) return;

    const leaf = document.createElement("div");
    leaf.classList.add("falling-leaf");
    // ATUALIZADO: Escolhe uma classe de tipo de folha aleatoriamente
    leaf.classList.add(leafTypes[Math.floor(Math.random() * leafTypes.length)]);

    // Posição inicial aleatória (largura da tela)
    leaf.style.left = Math.random() * 100 + "vw";

    // Duração e delay da animação aleatórios para um efeito mais natural
    const duration = Math.random() * 8 + 7; // Entre 7 e 15 segundos
    const delay = Math.random() * 5; // Até 5 segundos de delay inicial

    leaf.style.animationDuration = duration + "s";
    leaf.style.animationDelay = delay + "s";

    // Adiciona uma rotação inicial aleatória para mais variedade
    leaf.style.transform = `translateY(-100px) rotate(${
      Math.random() * 360
    }deg)`;

    leafFallContainer.appendChild(leaf);

    // Remove a folha após a animação para evitar acúmulo no DOM
    leaf.addEventListener("animationend", () => {
      leaf.remove();
      // Cria uma nova folha para manter o fluxo
      createFallingLeaf();
    });
  }

  // Inicializa o número de folhas
  for (let i = 0; i < numLeaves; i++) {
    createFallingLeaf();
  }
});
