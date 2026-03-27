"use strict";

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CONFIG â€” edit these to personalize
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const CONFIG = {
  password:      "baba",
  recipientName: "Kanchi",
  musicVolume:   0.38,

  // localStorage key â€” change year if you want her to re-open next birthday
  storageKey: "bdayGift_2025",

  finalGift: {
    name:  "Your Gift",
    title: "A White Rose",
    desc:  "A white rose for the girl I love, carrying one honest promise from my heart: I will keep choosing you, admiring you, and loving you in all the quiet, romantic ways that make you feel safe, seen, and adored."
  }
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   STATE
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const state = {
  scene:        "lock",
  gift:         null,
  previewGift:  null,
  giftOpened:   false,
  isShuffling:  false,
  musicPlaying: false,
  particles:    [],
  revealTimers: [],
  shuffleRun:   0,
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   DOM REFS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const el = {
  passwordInput:  $("#password-input"),
  enterBtn:       $("#enter-btn"),
  entryError:     $("#entry-error"),
  inputPill:      $("#input-pill"),

  soundBtn:       $("#sound-btn"),
  soundPulse:     $("#sound-pulse"),
  soundLabel:     $("#sound-label"),
  musicDot:       $("#music-dot"),
  musicStatus:    $("#music-status"),

  viewGiftsBtn:   $("#view-gifts-btn"),
  giftBoxes:      $$(".gift-box"),
  selectionLabel: $("#selection-label"),

  finaleGiftName: $("#finale-gift-name"),
  finaleGiftDesc: $("#finale-gift-desc"),
  finaleRose:     $("#finale-rose"),

  openedGiftName: $("#opened-gift-name"),
  openedGiftDesc: $("#opened-gift-desc"),

  replayBtn:      $("#replay-btn"),
  openedReplayBtn: $("#opened-replay-btn"),
  loveLetters:    $$(".love-letter"),
  giftPreviewModal: $("#gift-preview-modal"),
  giftPreviewClose: $("#gift-preview-close"),
  giftPreviewCancel: $("#gift-preview-cancel"),
  giftPreviewConfirm: $("#gift-preview-confirm"),
  giftPreviewKicker: $("#gift-preview-kicker"),
  giftPreviewTitle: $("#gift-preview-title"),
  giftPreviewDesc: $("#gift-preview-desc"),
  confettiLayer:  $("#confetti-layer"),
  petalsLayer:    $("#petals"),
  canvas:         $("#particle-canvas"),
  bgVideo:        $("#bg-video"),
  bgMusic:        $("#bg-music"),
  msgLines:       $$(".msg"),
};

const scenes = {};
["lock","reveal","gifts","finale","opened"].forEach(
  (id) => (scenes[id] = $(`#scene-${id}`))
);

const ctx = el.canvas ? el.canvas.getContext("2d") : null;

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PARTICLE SYSTEM
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
class Particle {
  constructor(w, h) { this.reset(w, h, true); }

  reset(w, h, init = false) {
    this.x  = Math.random() * w;
    this.y  = init ? Math.random() * h : h + 20;
    this.r  = Math.random() * 1.6 + 0.3;
    this.vx = (Math.random() - 0.5) * 0.14;
    this.vy = -(Math.random() * 0.38 + 0.1);
    this.a  = Math.random() * 0.3 + 0.04;
  }

  update(w, h) {
    this.x += this.vx;
    this.y += this.vy;
    if (this.y < -20 || this.x < -20 || this.x > w + 20) this.reset(w, h);
  }

  draw(c) {
    c.beginPath();
    c.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    c.fillStyle = `rgba(255,244,240,${this.a})`;
    c.fill();
  }
}

function initCanvas() {
  if (!el.canvas || !ctx) return;
  el.canvas.width  = window.innerWidth;
  el.canvas.height = window.innerHeight;
  const n = window.innerWidth < 720 ? 50 : 90;
  state.particles = Array.from(
    { length: n },
    () => new Particle(el.canvas.width, el.canvas.height)
  );
}

function animateParticles() {
  if (!ctx) return;
  ctx.clearRect(0, 0, el.canvas.width, el.canvas.height);
  state.particles.forEach((p) => {
    p.update(el.canvas.width, el.canvas.height);
    p.draw(ctx);
  });
  requestAnimationFrame(animateParticles);
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ROSE PETAL RAIN
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function spawnPetal() {
  if (!el.petalsLayer) return;

  const petal = document.createElement("div");
  petal.className = "petal";

  const size = 8 + Math.random() * 7;
  const dur  = 5.5 + Math.random() * 5.5;

  petal.style.left            = `${-5 + Math.random() * 110}%`;
  petal.style.width            = `${size}px`;
  petal.style.height           = `${size * 1.5}px`;
  petal.style.animationDuration= `${dur}s`;
  petal.style.animationDelay  = `${Math.random() * 1.5}s`;
  petal.style.setProperty("--drift", `${-90 + Math.random() * 180}px`);
  petal.style.setProperty("--spin",  `${180 + Math.random() * 360}deg`);
  petal.style.transform        = `rotate(${Math.random() * 360}deg)`;

  // Random petal colour: white â†’ blush â†’ rose
  const hue  = 340 + Math.random() * 20;
  const sat  = 30 + Math.random() * 50;
  const lig  = 60 + Math.random() * 35;
  petal.style.background = `radial-gradient(ellipse at 32% 30%, hsl(0,0%,97%), hsl(${hue},${sat}%,${lig}%))`;

  el.petalsLayer.appendChild(petal);
  setTimeout(() => petal.remove(), (dur + 2) * 1000);
}

let petalInterval = null;

function startPetalRain() {
  // Burst on start
  for (let i = 0; i < 14; i++) setTimeout(() => spawnPetal(), i * 110);
  // Steady drizzle
  if (petalInterval) clearInterval(petalInterval);
  petalInterval = setInterval(() => spawnPetal(), 750);
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   VIDEO
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
async function startVideo() {
  if (!el.bgVideo) return;
  el.bgVideo.defaultMuted = true;
  el.bgVideo.muted     = true;
  el.bgVideo.autoplay  = true;
  el.bgVideo.loop      = true;
  el.bgVideo.playsInline = true;
  el.bgVideo.setAttribute("muted", "");
  el.bgVideo.setAttribute("autoplay", "");
  el.bgVideo.setAttribute("playsinline", "");
  el.bgVideo.setAttribute("webkit-playsinline", "");

  if (el.bgVideo.readyState === 0) el.bgVideo.load();

  try {
    await el.bgVideo.play();
  } catch (_) {}
}

async function restartVideoLoop() {
  if (!el.bgVideo) return;

  try {
    el.bgVideo.currentTime = 0;
  } catch (_) {}

  await startVideo();
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SCENE TRANSITIONS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function showScene(next) {
  if (state.scene === next) return;

  if (scenes[state.scene]) scenes[state.scene].classList.remove("active");
  if (scenes[next]) {
    scenes[next].classList.add("active");
    scenes[next].scrollTop = 0;
  }

  state.scene = next;

  if (next === "reveal")  revealMessages();
  if (next === "gifts")   onGiftsEnter();
  if (next === "finale")  onFinaleEnter();
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   REVEAL MESSAGES (staggered)
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function revealMessages() {
  state.revealTimers.forEach(clearTimeout);
  state.revealTimers = [];

  el.msgLines.forEach((line) => line.classList.remove("is-visible"));
  el.msgLines.forEach((line, i) => {
    const t = setTimeout(() => line.classList.add("is-visible"), 350 + i * 300);
    state.revealTimers.push(t);
  });
}

function isGiftPreviewOpen() {
  return Boolean(el.giftPreviewModal?.classList.contains("is-open"));
}

function updatePreviewConfirmLabel(giftId) {
  if (!el.giftPreviewConfirm) return;
  el.giftPreviewConfirm.textContent = "Open this box";
}

function openGiftPreview(giftId, triggerEl = null) {
  if (state.isShuffling || state.giftOpened || !el.giftPreviewModal) return;

  state.previewGift = giftId;

  if (triggerEl) {
    el.giftPreviewModal.dataset.returnFocusGift = triggerEl.dataset.gift || "";
  }

  if (el.giftPreviewKicker) el.giftPreviewKicker.textContent = "One Choice Only";
  if (el.giftPreviewTitle)  el.giftPreviewTitle.textContent = "Open this box?";
  if (el.giftPreviewDesc) {
    el.giftPreviewDesc.textContent =
      "Once you open one box, the other two stay sealed. Make sure this is the one you want.";
  }
  updatePreviewConfirmLabel(giftId);

  el.giftPreviewModal.classList.add("is-open");
  el.giftPreviewModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  requestAnimationFrame(() => {
    el.giftPreviewConfirm?.focus();
  });
}

function closeGiftPreview({ restoreFocus = true } = {}) {
  if (!el.giftPreviewModal || !isGiftPreviewOpen()) return;

  const returnGiftId = el.giftPreviewModal.dataset.returnFocusGift || "";

  el.giftPreviewModal.classList.remove("is-open");
  el.giftPreviewModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  delete el.giftPreviewModal.dataset.returnFocusGift;

  state.previewGift = null;

  if (!restoreFocus || !returnGiftId) return;

  const giftBox = el.giftBoxes.find((box) => box.dataset.gift === returnGiftId);
  giftBox?.focus();
}

function trapGiftPreviewFocus(e) {
  if (e.key !== "Tab" || !isGiftPreviewOpen() || !el.giftPreviewModal) return;

  const focusable = [...el.giftPreviewModal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )].filter((node) => !node.hasAttribute("disabled"));

  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getGiftSelectionText() {
  if (state.giftOpened) return "Your gift is already opened.";
  if (!state.gift) return "Only one box opens. Choose with your heart.";
  return "Your choice is locked in.";
}

function setGiftBoxOrder(orderIds) {
  el.giftBoxes.forEach((box) => {
    const nextIndex = orderIds.indexOf(box.dataset.gift);
    box.style.order = String(nextIndex === -1 ? 0 : nextIndex);
  });
}

function resetGiftBoxOrder() {
  el.giftBoxes.forEach((box, index) => {
    box.style.order = String(index);
  });
}

function setGiftBoxesLocked(locked) {
  el.giftBoxes.forEach((box) => {
    box.classList.toggle("is-locked", locked);
    if (locked) {
      box.setAttribute("aria-disabled", "true");
    } else {
      box.removeAttribute("aria-disabled");
    }
  });
}

function getNextShuffleOrder() {
  const current = el.giftBoxes
    .slice()
    .sort((a, b) => Number(a.style.order || 0) - Number(b.style.order || 0))
    .map((box) => box.dataset.gift);

  let next = current.slice();

  while (next.join("|") === current.join("|")) {
    next = current
      .slice()
      .sort(() => Math.random() - 0.5);
  }

  return next;
}

async function animateGiftShuffle(orderIds, round) {
  const firstRects = new Map(
    el.giftBoxes.map((box) => [box, box.getBoundingClientRect()])
  );

  setGiftBoxOrder(orderIds);

  const animations = el.giftBoxes.map((box, index) => {
    const first = firstRects.get(box);
    const last = box.getBoundingClientRect();
    const dx = first.left - last.left;
    const dy = first.top - last.top;
    const tilt = ((round + index) % 2 === 0 ? 1 : -1) * (6 + index * 2);

    return box.animate(
      [
        {
          transform: `translate(${dx}px, ${dy}px) rotate(${tilt * -1}deg) scale(1)`,
          offset: 0,
        },
        {
          transform: `translate(${dx * 0.18}px, ${dy * 0.18}px) rotate(${tilt}deg) scale(1.035)`,
          offset: 0.55,
        },
        {
          transform: "translate(0, 0) rotate(0deg) scale(1)",
          offset: 1,
        },
      ],
      {
        duration: 520,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "both",
      }
    ).finished.catch(() => undefined);
  });

  await Promise.all(animations);
}

async function shuffleGiftBoxes() {
  if (!el.giftBoxes.length || state.isShuffling) return;

  if (state.giftOpened) {
    setGiftBoxesLocked(true);
    if (el.selectionLabel) {
      el.selectionLabel.textContent = getGiftSelectionText();
    }
    return;
  }

  const runId = ++state.shuffleRun;
  state.isShuffling = true;

  if (el.selectionLabel) {
    el.selectionLabel.textContent = "Shuffling the boxes...";
  }

  el.giftBoxes.forEach((box) => {
    box.classList.add("is-shuffling");
    box.setAttribute("aria-disabled", "true");
  });

  for (let round = 0; round < 3; round += 1) {
    if (runId !== state.shuffleRun) return;
    await animateGiftShuffle(getNextShuffleOrder(), round);
    if (round < 2) await wait(120);
  }

  if (runId !== state.shuffleRun) return;

  state.isShuffling = false;
  el.giftBoxes.forEach((box) => {
    box.classList.remove("is-shuffling");
  });
  setGiftBoxesLocked(false);

  if (el.selectionLabel) {
    el.selectionLabel.textContent = getGiftSelectionText();
  }
}

function onGiftsEnter() {
  closeGiftPreview({ restoreFocus: false });
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      shuffleGiftBoxes();
    });
  });
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   FINALE
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function onFinaleEnter() {
  launchConfetti();
  resetLoveLetters();

  // Re-trigger rose float animation
  if (el.finaleRose) {
    el.finaleRose.style.animation = "none";
    void el.finaleRose.offsetWidth;
    el.finaleRose.style.animation = "";
  }
}

function setLoveLetterOpen(letter, open) {
  if (!letter) return;
  letter.classList.toggle("is-open", open);
  letter.setAttribute("aria-expanded", String(open));
}

function resetLoveLetters() {
  el.loveLetters.forEach((letter) => setLoveLetterOpen(letter, false));
}

function toggleLoveLetter(letter) {
  if (!letter) return;

  const shouldOpen = !letter.classList.contains("is-open");
  el.loveLetters.forEach((item) => {
    setLoveLetterOpen(item, item === letter ? shouldOpen : false);
  });
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CONFETTI
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function launchConfetti() {
  if (!el.confettiLayer) return;
  el.confettiLayer.innerHTML = "";

  const colors = [
    "#f0a0b8","#d4607a","#e8c070","#fdf4ee",
    "#c084b8","#ffffff","#ffccd8","#fde68a"
  ];

  for (let i = 0; i < 88; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left              = `${Math.random() * 100}%`;
    piece.style.background        = colors[i % colors.length];
    piece.style.animationDuration = `${4 + Math.random() * 2.6}s`;
    piece.style.animationDelay    = `${Math.random() * 0.7}s`;
    piece.style.setProperty("--drift", `${-130 + Math.random() * 260}px`);
    piece.style.setProperty("--spin",  `${220 + Math.random() * 640}deg`);
    // Randomise shape slightly
    const w = 6 + Math.random() * 6;
    piece.style.width  = `${w}px`;
    piece.style.height = `${w * (1.2 + Math.random())}px`;
    piece.style.borderRadius = Math.random() > 0.4 ? "50%" : "2px";
    el.confettiLayer.appendChild(piece);
  }

  setTimeout(() => {
    if (el.confettiLayer) el.confettiLayer.innerHTML = "";
  }, 9000);
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MUSIC
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function setMusicUI(playing, msg) {
  state.musicPlaying = playing;
  el.soundBtn.classList.toggle("is-playing", playing);
  el.soundBtn.setAttribute("aria-pressed", String(playing));
  if (el.soundLabel) el.soundLabel.textContent = playing ? "Pause" : "Play Song";
  if (el.musicDot)   el.musicDot.classList.toggle("playing", playing);
  if (el.musicStatus && msg) el.musicStatus.textContent = msg;
}

async function startMusic() {
  if (!el.bgMusic) return;
  el.bgMusic.volume = CONFIG.musicVolume;
  try {
    await el.bgMusic.play();
    setMusicUI(true, "Song is playing");
  } catch (_) {
    setMusicUI(false, "Tap 'Play Song' to hear our song.");
  }
}

function toggleMusic() {
  if (!el.bgMusic) return;
  if (state.musicPlaying) {
    el.bgMusic.pause();
    setMusicUI(false, "Paused.");
  } else {
    el.bgMusic.volume = CONFIG.musicVolume;
    el.bgMusic
      .play()
      .then(() => setMusicUI(true, "Song is playing ðŸŽ¶"))
      .catch(() => setMusicUI(false, "Tap again to play."));
  }
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PASSWORD
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function tryOpen() {
  const val = (el.passwordInput.value || "").trim().toLowerCase();

  if (!val) { showError("Type our word first."); return; }

  if (val !== CONFIG.password.toLowerCase()) {
    showError("That's not it, love. Try again ðŸŒ¹");
    shakeInputPill();
    el.passwordInput.select();
    return;
  }

  el.entryError.textContent = "";
  document.body.classList.add("wish-open");
  startMusic();
  setTimeout(() => showScene("reveal"), 240);
}

function showError(msg) {
  el.entryError.textContent = msg;
}

function shakeInputPill() {
  if (!el.inputPill) return;
  el.inputPill.classList.remove("shake");
  void el.inputPill.offsetWidth; // force reflow
  el.inputPill.classList.add("shake");
  setTimeout(() => el.inputPill.classList.remove("shake"), 500);
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   GIFT SELECTION
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function selectGift(giftId) {
  if (state.isShuffling || state.giftOpened) return;

  state.gift = giftId;

  el.giftBoxes.forEach((box) => {
    const selected = box.dataset.gift === giftId;
    box.classList.toggle("is-selected", selected);
    box.setAttribute("aria-pressed", String(selected));
  });

  if (el.selectionLabel) {
    el.selectionLabel.textContent = getGiftSelectionText();
  }
  updatePreviewConfirmLabel(giftId);
}

function confirmGift(giftId = state.gift) {
  if (state.giftOpened) return;
  if (!giftId) return;

  selectGift(giftId);

  const gift = CONFIG.finalGift;
  if (!gift) return;

  state.giftOpened = true;
  closeGiftPreview({ restoreFocus: false });
  setGiftBoxesLocked(true);

  // Save to localStorage (open-once tracking)
  try {
    localStorage.setItem(
      CONFIG.storageKey,
      JSON.stringify({
        giftId:    giftId,
        giftTitle: gift.title,
        giftDesc:  gift.desc,
        giftName:  gift.name,
        openedAt:  new Date().toISOString(),
      })
    );
  } catch (_) { /* storage unavailable */ }

  // Populate finale
  if (el.finaleGiftName) el.finaleGiftName.textContent = gift.title;
  if (el.finaleGiftDesc) el.finaleGiftDesc.textContent = gift.desc;

  showScene("finale");
}

function confirmPreviewGift() {
  if (!state.previewGift) return;
  confirmGift(state.previewGift);
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ALREADY-OPENED CHECK
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function checkAlreadyOpened() {
  const params = new URLSearchParams(window.location.search);

  // Allow test/dev bypasses without manually clearing browser storage.
  if (params.has("reset")) {
    try { localStorage.removeItem(CONFIG.storageKey); } catch (_) {}
    return false;
  }
  if (params.has("preview")) return false;

  try {
    const raw = localStorage.getItem(CONFIG.storageKey);
    if (!raw) return false;

    const data = JSON.parse(raw);
    state.gift = data.giftId || null;
    state.giftOpened = true;

    if (el.openedGiftName) el.openedGiftName.textContent = data.giftTitle || "Your surprise";
    if (el.openedGiftDesc) el.openedGiftDesc.textContent = data.giftDesc  || "";

    return true;
  } catch (_) {
    return false;
  }
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   RESET / REPLAY
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function resetAll() {
  // Clear timers
  state.revealTimers.forEach(clearTimeout);
  state.revealTimers = [];

  // Clear localStorage so she can re-pick (replay is intentional)
  try { localStorage.removeItem(CONFIG.storageKey); } catch(_) {}

  // Reset state
  state.gift        = null;
  state.previewGift = null;
  state.giftOpened  = false;
  state.isShuffling = false;
  state.musicPlaying = false;
  state.shuffleRun += 1;

  // Stop music
  if (el.bgMusic) {
    el.bgMusic.pause();
    el.bgMusic.currentTime = 0;
  }
  setMusicUI(false, "");

  // Reset UI
  if (el.passwordInput)  el.passwordInput.value = "";
  if (el.entryError)     el.entryError.textContent = "";
  if (el.selectionLabel) el.selectionLabel.textContent = "Only one box opens. Choose with your heart.";

  el.giftBoxes.forEach((b) => {
    b.classList.remove("is-selected");
    b.classList.remove("is-shuffling");
    b.setAttribute("aria-pressed", "false");
  });
  setGiftBoxesLocked(false);
  el.msgLines.forEach((l) => l.classList.remove("is-visible"));
  resetGiftBoxOrder();
  resetLoveLetters();
  closeGiftPreview({ restoreFocus: false });

  if (el.confettiLayer) el.confettiLayer.innerHTML = "";
  document.body.classList.remove("wish-open");
  document.body.classList.remove("modal-open");

  // Back to lock
  Object.values(scenes).forEach((s) => s && s.classList.remove("active"));
  if (scenes.lock) scenes.lock.classList.add("active");
  state.scene = "lock";

  setTimeout(() => el.passwordInput && el.passwordInput.focus(), 300);
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   EVENTS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function bindEvents() {
  // Lock
  el.enterBtn?.addEventListener("click", tryOpen);
  el.passwordInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") tryOpen();
  });

  // Sound
  el.soundBtn?.addEventListener("click", toggleMusic);

  // Reveal â†’ Gifts
  el.viewGiftsBtn?.addEventListener("click", () => showScene("gifts"));

  // Gift selection
  el.giftBoxes.forEach((box) => {
    box.addEventListener("click", () => openGiftPreview(box.dataset.gift, box));
    box.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openGiftPreview(box.dataset.gift, box);
      }
    });
  });

  el.loveLetters.forEach((letter) => {
    letter.addEventListener("click", () => toggleLoveLetter(letter));
  });

  // Preview modal
  el.giftPreviewClose?.addEventListener("click", () => closeGiftPreview());
  el.giftPreviewCancel?.addEventListener("click", () => closeGiftPreview());
  el.giftPreviewConfirm?.addEventListener("click", confirmPreviewGift);
  el.giftPreviewModal?.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.closePreview === "true") closeGiftPreview();
  });

  // Replay
  el.replayBtn?.addEventListener("click", resetAll);
  el.openedReplayBtn?.addEventListener("click", resetAll);

  // Resize
  window.addEventListener("resize", () => {
    initCanvas();
  });

  // Visibility change â€” restart video
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) startVideo();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isGiftPreviewOpen()) {
      closeGiftPreview();
      return;
    }

    trapGiftPreviewFocus(e);
  });

  window.addEventListener("pageshow", startVideo);

  // Retry video on any user interaction
  const retryVideo = () => {
    if (el.bgVideo?.paused) startVideo();
  };
  document.addEventListener("click",      retryVideo, { passive: true });
  document.addEventListener("pointerdown", retryVideo, { passive: true });
  document.addEventListener("touchstart", retryVideo, { passive: true });

  // Video events
  if (el.bgVideo) {
    el.bgVideo.addEventListener("ended",      restartVideoLoop);
    el.bgVideo.addEventListener("loadeddata", startVideo);
    el.bgVideo.addEventListener("loadedmetadata", startVideo);
    el.bgVideo.addEventListener("canplay",    startVideo);
    el.bgVideo.addEventListener("pause",      () => {
      if (!document.hidden) startVideo();
    });
    el.bgVideo.addEventListener("stalled",    () => { el.bgVideo.load(); startVideo(); });
    el.bgVideo.addEventListener("error",      () => { el.bgVideo.load(); startVideo(); });
  }
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   INIT
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function init() {
  resetGiftBoxOrder();
  initCanvas();
  animateParticles();
  startVideo();
  startPetalRain();
  bindEvents();

  // Already-opened gate
  if (checkAlreadyOpened()) {
    // Bypass lock, show the "opened" scene
    Object.values(scenes).forEach((s) => s && s.classList.remove("active"));
    if (scenes.opened) scenes.opened.classList.add("active");
    state.scene = "opened";
    document.body.classList.add("wish-open");
    startMusic();
  } else {
    // Normal flow â€” focus password
    setTimeout(() => el.passwordInput?.focus(), 450);
  }
}

init();
