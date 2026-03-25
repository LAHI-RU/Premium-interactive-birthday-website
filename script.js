"use strict";

const CONFIG = {
  password: "mylove",
  recipientName: "Kanchi",
  musicVolume: 0.4,
  gifts: {
    letter: {
      title: "A Letter Kept For You",
      description: "A private birthday letter chosen because some feelings deserve to be said carefully, warmly, and without rushing."
    },
    portrait: {
      title: "Our Portrait Keepsake",
      description: "A keepsake built around our illustration and photos so this birthday still feels close even after the day passes."
    },
    date: {
      title: "A Date Designed Around You",
      description: "A date shaped around your comfort, your cravings, your pace, and the details that make you feel fully celebrated."
    }
  }
};

const state = {
  currentScene: "entry",
  selectedGift: null,
  musicPlaying: false,
  revealTimers: [],
  particles: [],
  videoWatchdog: null,
  lastVideoTime: 0,
  lastVideoTick: 0
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const sceneIds = ["entry", "reveal", "gifts", "finale"];
const scenes = Object.fromEntries(sceneIds.map((id) => [id, document.getElementById(`scene-${id}`)]));

const passwordInput = $("#password-input");
const enterBtn = $("#enter-btn");
const entryError = $("#entry-error");
const recipientName = $("#recipient-name");
const viewGiftsBtn = $("#view-gifts-btn");
const soundBtn = $("#sound-btn");
const soundIcon = $("#sound-icon");
const musicStatus = $("#music-status");
const bgMusic = $("#bg-music");
const bgVideo = $("#bg-video");
const videoBackdrop = $(".video-backdrop");
const messageLines = $$(".message-line");
const giftCards = $$(".gift-card");
const selectionText = $("#selection-text");
const confirmGiftBtn = $("#confirm-gift-btn");
const finalGiftTitle = $("#final-gift-title");
const finalGiftCopy = $("#final-gift-copy");
const replayBtn = $("#replay-btn");
const confettiLayer = $("#confetti-layer");

const particleCanvas = $("#particle-canvas");
const particleContext = particleCanvas.getContext("2d");

class Particle {
  constructor(width, height) {
    this.reset(width, height, true);
  }

  reset(width, height, initial = false) {
    this.x = Math.random() * width;
    this.y = initial ? Math.random() * height : height + Math.random() * 80;
    this.radius = Math.random() * 1.7 + 0.4;
    this.vx = (Math.random() - 0.5) * 0.18;
    this.vy = -(Math.random() * 0.42 + 0.12);
    this.alpha = Math.random() * 0.5 + 0.08;
  }

  update(width, height) {
    this.x += this.vx;
    this.y += this.vy;

    if (this.y < -24 || this.x < -24 || this.x > width + 24) {
      this.reset(width, height);
    }
  }

  draw(context) {
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fillStyle = `rgba(255, 244, 235, ${this.alpha})`;
    context.fill();
  }
}

function resizeParticleCanvas() {
  particleCanvas.width = window.innerWidth;
  particleCanvas.height = window.innerHeight;
}

function initParticles() {
  resizeParticleCanvas();
  state.particles = Array.from(
    { length: window.innerWidth < 720 ? 55 : 100 },
    () => new Particle(particleCanvas.width, particleCanvas.height)
  );
}

function animateParticles() {
  particleContext.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

  state.particles.forEach((particle) => {
    particle.update(particleCanvas.width, particleCanvas.height);
    particle.draw(particleContext);
  });

  window.requestAnimationFrame(animateParticles);
}

function clearRevealTimers() {
  state.revealTimers.forEach((timerId) => window.clearTimeout(timerId));
  state.revealTimers = [];
}

async function startBackgroundVideo() {
  if (!bgVideo) {
    return;
  }

  bgVideo.muted = true;
  bgVideo.defaultMuted = true;
  bgVideo.loop = true;
  bgVideo.playsInline = true;
  bgVideo.setAttribute("playsinline", "");
  bgVideo.setAttribute("webkit-playsinline", "");

  try {
    await bgVideo.play();
  } catch (error) {
    // Ignore autoplay failures here; retry on the next user gesture.
  }
}

function applyVideoOrientation() {
  if (!bgVideo || !videoBackdrop || !bgVideo.videoWidth || !bgVideo.videoHeight) {
    return;
  }

  const isPortrait = bgVideo.videoHeight > bgVideo.videoWidth;
  videoBackdrop.classList.toggle("is-portrait", isPortrait);
  videoBackdrop.classList.toggle("is-landscape", !isPortrait);
}

function startVideoWatchdog() {
  if (!bgVideo || state.videoWatchdog) {
    return;
  }

  state.lastVideoTime = bgVideo.currentTime || 0;
  state.lastVideoTick = performance.now();

  state.videoWatchdog = window.setInterval(() => {
    if (!bgVideo || document.hidden || bgVideo.paused || bgVideo.readyState < 2) {
      return;
    }

    const now = performance.now();
    const advanced = Math.abs(bgVideo.currentTime - state.lastVideoTime) > 0.04;

    if (advanced) {
      state.lastVideoTime = bgVideo.currentTime;
      state.lastVideoTick = now;
      return;
    }

    if (now - state.lastVideoTick > 2200) {
      bgVideo.currentTime = 0;
      startBackgroundVideo();
      state.lastVideoTick = now;
    }
  }, 1000);
}

function revealMessageLines() {
  clearRevealTimers();
  messageLines.forEach((line) => line.classList.remove("is-visible"));

  messageLines.forEach((line, index) => {
    const timerId = window.setTimeout(() => {
      line.classList.add("is-visible");
    }, 220 + index * 240);

    state.revealTimers.push(timerId);
  });
}

function showScene(nextScene) {
  if (state.currentScene === nextScene) {
    return;
  }

  scenes[state.currentScene].classList.remove("active");
  scenes[nextScene].classList.add("active");
  scenes[nextScene].scrollTop = 0;
  state.currentScene = nextScene;

  if (nextScene === "reveal") {
    revealMessageLines();
  }

  if (nextScene === "finale") {
    launchConfetti();
  }
}

function setMusicUi(isPlaying, message) {
  state.musicPlaying = isPlaying;
  soundBtn.classList.toggle("is-playing", isPlaying);
  soundBtn.setAttribute("aria-pressed", String(isPlaying));
  soundIcon.textContent = isPlaying ? "Sound Off" : "Sound On";
  musicStatus.textContent = message;
}

async function startMusic() {
  bgMusic.volume = CONFIG.musicVolume;

  try {
    await bgMusic.play();
    setMusicUi(true, "Birthday song is playing.");
  } catch (error) {
    setMusicUi(false, "Tap the sound button if your browser blocks autoplay.");
  }
}

function stopMusic() {
  bgMusic.pause();
  bgMusic.currentTime = 0;
  setMusicUi(false, "Birthday song is paused.");
}

function toggleMusic() {
  if (state.musicPlaying) {
    bgMusic.pause();
    setMusicUi(false, "Birthday song is paused.");
    return;
  }

  bgMusic.volume = CONFIG.musicVolume;
  bgMusic.play()
    .then(() => {
      setMusicUi(true, "Birthday song is playing.");
    })
    .catch(() => {
      setMusicUi(false, "Your browser still requires a direct tap to start audio.");
    });
}

function validatePassword() {
  const value = passwordInput.value.trim().toLowerCase();

  if (!value) {
    entryError.textContent = "Enter the private word first.";
    return;
  }

  if (value !== CONFIG.password.toLowerCase()) {
    entryError.textContent = "That word is not correct yet.";
    passwordInput.select();
    return;
  }

  entryError.textContent = "";
  document.body.classList.add("wish-open");
  startMusic();
  window.setTimeout(() => showScene("reveal"), 220);
}

function updateSelectionUi() {
  giftCards.forEach((card) => {
    const isSelected = card.dataset.gift === state.selectedGift;
    card.classList.toggle("is-selected", isSelected);
    card.setAttribute("aria-pressed", String(isSelected));
  });

  if (!state.selectedGift) {
    selectionText.textContent = "No gift selected yet.";
    confirmGiftBtn.disabled = true;
    return;
  }

  selectionText.textContent = CONFIG.gifts[state.selectedGift].title;
  confirmGiftBtn.disabled = false;
}

function selectGift(giftId) {
  state.selectedGift = giftId;
  updateSelectionUi();
}

function confirmGift() {
  if (!state.selectedGift) {
    return;
  }

  const gift = CONFIG.gifts[state.selectedGift];
  finalGiftTitle.textContent = gift.title;
  finalGiftCopy.textContent = gift.description;
  showScene("finale");
}

function launchConfetti() {
  confettiLayer.innerHTML = "";
  const colors = ["#efb57d", "#f8f2ea", "#d99aa1", "#8caecc"];

  for (let index = 0; index < 72; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[index % colors.length];
    piece.style.animationDuration = `${4 + Math.random() * 2.4}s`;
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    piece.style.setProperty("--drift", `${-110 + Math.random() * 220}px`);
    piece.style.setProperty("--spin", `${220 + Math.random() * 560}deg`);
    confettiLayer.appendChild(piece);
  }

  window.setTimeout(() => {
    confettiLayer.innerHTML = "";
  }, 7000);
}

function resetExperience() {
  clearRevealTimers();
  stopMusic();
  state.selectedGift = null;
  updateSelectionUi();
  finalGiftTitle.textContent = "Waiting for your choice.";
  finalGiftCopy.textContent = "";
  passwordInput.value = "";
  entryError.textContent = "";
  document.body.classList.remove("wish-open");
  messageLines.forEach((line) => line.classList.remove("is-visible"));

  sceneIds.forEach((id) => {
    scenes[id].classList.remove("active");
    scenes[id].scrollTop = 0;
  });

  scenes.entry.classList.add("active");
  state.currentScene = "entry";
  confettiLayer.innerHTML = "";
  window.setTimeout(() => passwordInput.focus(), 120);
}

function bindEvents() {
  enterBtn.addEventListener("click", validatePassword);

  passwordInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      validatePassword();
    }
  });

  soundBtn.addEventListener("click", toggleMusic);
  viewGiftsBtn.addEventListener("click", () => showScene("gifts"));
  confirmGiftBtn.addEventListener("click", confirmGift);
  replayBtn.addEventListener("click", resetExperience);

  giftCards.forEach((card) => {
    card.setAttribute("aria-pressed", "false");

    card.addEventListener("click", () => {
      selectGift(card.dataset.gift);
    });

    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectGift(card.dataset.gift);
      }
    });
  });

  window.addEventListener("resize", () => {
    resizeParticleCanvas();
    initParticles();
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      startBackgroundVideo();
    }
  });

  const retryVideoPlayback = () => {
    if (bgVideo && bgVideo.paused) {
      startBackgroundVideo();
    }
  };

  document.addEventListener("click", retryVideoPlayback, { passive: true });
  document.addEventListener("touchstart", retryVideoPlayback, { passive: true });
  document.addEventListener("keydown", retryVideoPlayback);

  if (bgVideo) {
    bgVideo.addEventListener("loadedmetadata", applyVideoOrientation);
    bgVideo.addEventListener("loadeddata", startBackgroundVideo);
    bgVideo.addEventListener("canplay", startBackgroundVideo);
    bgVideo.addEventListener("playing", () => {
      state.lastVideoTime = bgVideo.currentTime || 0;
      state.lastVideoTick = performance.now();
    });
    bgVideo.addEventListener("ended", () => {
      bgVideo.currentTime = 0;
      startBackgroundVideo();
    });
    bgVideo.addEventListener("stalled", () => {
      bgVideo.load();
      startBackgroundVideo();
    });
    bgVideo.addEventListener("error", () => {
      bgVideo.load();
      startBackgroundVideo();
    });
  }
}

function init() {
  recipientName.textContent = CONFIG.recipientName;
  initParticles();
  animateParticles();
  startVideoWatchdog();
  startBackgroundVideo();
  applyVideoOrientation();
  updateSelectionUi();
  bindEvents();
  window.setTimeout(() => passwordInput.focus(), 400);
}

init();
