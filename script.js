/* =====================================================
   BIRTHDAY EXPERIENCE — script.js
   Event-driven scene system, particles, typewriter,
   fireworks, and all interactive magic.
   ===================================================== */

'use strict';

/* ──────────────────────────────────────────────────
   CONFIGURATION — Edit these to personalise the experience
   ────────────────────────────────────────────────── */
const CONFIG = {
  password: 'mylove',           // ← Change this to your magic word
  name: 'My Love',              // ← Her name (used in greeting)
  typewriterLines: [
    'The world began the day you were born.',
    'And every day since has been a gift I never deserved.',
    'So today, of all days — I wanted the universe itself to celebrate you.',
  ],
  typewriterSpeed: 52,          // ms per character
  typewriterPause: 1800,        // ms pause between lines
};

/* ──────────────────────────────────────────────────
   STATE
   ────────────────────────────────────────────────── */
const state = {
  currentScene: 'entry',
  giftsOpened: new Set(),
  musicPlaying: false,
  particles: [],
  fireworks: [],
  animFrame: null,
};

/* ──────────────────────────────────────────────────
   DOM REFERENCES
   ────────────────────────────────────────────────── */
const $ = id => document.getElementById(id);

const scenes = {
  entry:  $('scene-entry'),
  reveal: $('scene-reveal'),
  gifts:  $('scene-gifts'),
  finale: $('scene-finale'),
};

const passwordInput = $('password-input');
const enterBtn      = $('enter-btn');
const entryError    = $('entry-error');
const inputWrapper  = $('input-wrapper');
const lockIcon      = $('lock-icon');
const soundBtn      = $('sound-btn');
const bgMusic       = $('bg-music');
const typewriterEl  = $('typewriter-text');
const gotoGiftsBtn  = $('goto-gifts-btn');
const giftCards     = document.querySelectorAll('.gift-card');
const giftProgress  = $('gift-progress');
const replayBtn     = $('replay-btn');
const easterTrigger = $('easter-trigger');
const easterModal   = $('easter-modal');
const easterClose   = $('easter-close');
const floatingHearts = $('floating-hearts');
const finaleStars   = $('finale-stars');

/* ──────────────────────────────────────────────────
   PARTICLE BACKGROUND (shared canvas)
   Lightweight star-field + drift particles
   ────────────────────────────────────────────────── */
const pCanvas = $('particle-canvas');
const pCtx    = pCanvas.getContext('2d');

function resizeParticleCanvas() {
  pCanvas.width  = window.innerWidth;
  pCanvas.height = window.innerHeight;
}

class Particle {
  constructor() { this.reset(true); }

  reset(initial = false) {
    this.x    = Math.random() * pCanvas.width;
    this.y    = initial ? Math.random() * pCanvas.height : pCanvas.height + 10;
    this.r    = Math.random() * 1.6 + 0.3;
    this.vy   = -(Math.random() * 0.4 + 0.1);
    this.vx   = (Math.random() - 0.5) * 0.15;
    this.life = 0;
    this.maxLife = Math.random() * 200 + 150;
    const hue = Math.random() > 0.5 ? 320 : 270;
    this.color = `hsl(${hue}, 60%, 75%)`;
  }

  update() {
    this.x    += this.vx;
    this.y    += this.vy;
    this.life++;
    if (this.life > this.maxLife || this.y < -10) this.reset();
  }

  draw() {
    const alpha = Math.sin((this.life / this.maxLife) * Math.PI) * 0.55;
    pCtx.beginPath();
    pCtx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    pCtx.fillStyle = this.color;
    pCtx.globalAlpha = alpha;
    pCtx.fill();
    pCtx.globalAlpha = 1;
  }
}

function initParticles() {
  resizeParticleCanvas();
  state.particles = Array.from({ length: 120 }, () => new Particle());
}

function animateParticles() {
  pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
  state.particles.forEach(p => { p.update(); p.draw(); });
  requestAnimationFrame(animateParticles);
}

/* ──────────────────────────────────────────────────
   SCENE TRANSITIONS
   ────────────────────────────────────────────────── */
function switchScene(from, to, delay = 0) {
  const overlay = document.createElement('div');
  overlay.className = 'transition-overlay';
  document.body.appendChild(overlay);

  setTimeout(() => {
    // Burst flash
    overlay.classList.add('burst');

    setTimeout(() => {
      // Swap scenes
      scenes[from].classList.remove('active');
      scenes[from].classList.add('exit');
      scenes[to].classList.add('active');
      state.currentScene = to;

      // Fade out overlay
      overlay.classList.remove('burst');
      overlay.classList.add('fade-out');
      setTimeout(() => overlay.remove(), 600);

      // Scene-specific init
      if (to === 'reveal') initRevealScene();
      if (to === 'finale') initFinaleScene();
    }, 400);
  }, delay);
}

/* ──────────────────────────────────────────────────
   SCENE 1 — ENTRY / PASSWORD
   ────────────────────────────────────────────────── */
function checkPassword() {
  const val = passwordInput.value.trim().toLowerCase();

  if (val === CONFIG.password.toLowerCase()) {
    // Correct! Unlock animation
    lockIcon.classList.add('unlocked');
    lockIcon.style.filter = 'drop-shadow(0 0 20px rgba(232,200,130,1)) drop-shadow(0 0 40px rgba(232,200,130,0.6))';

    entryError.classList.remove('visible');
    inputWrapper.style.opacity = '0.4';
    passwordInput.disabled = true;
    enterBtn.disabled = true;

    // Transition after short pause
    setTimeout(() => switchScene('entry', 'reveal'), 1000);
  } else {
    // Wrong — shake + error
    inputWrapper.classList.remove('shake', 'wrong');
    void inputWrapper.offsetWidth; // reflow to restart animation
    inputWrapper.classList.add('shake', 'wrong');
    entryError.classList.add('visible');
    passwordInput.value = '';
    passwordInput.focus();

    // Glitch the lock briefly
    lockIcon.style.color = 'var(--c-rose)';
    lockIcon.style.filter = 'drop-shadow(0 0 10px rgba(224,123,138,0.7))';
    setTimeout(() => {
      lockIcon.style.color = '';
      lockIcon.style.filter = '';
    }, 600);

    setTimeout(() => entryError.classList.remove('visible'), 2500);
  }
}

enterBtn.addEventListener('click', checkPassword);
passwordInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') checkPassword();
});

/* Easter egg */
easterTrigger.addEventListener('click', () => {
  easterModal.classList.add('visible');
});
easterClose.addEventListener('click', () => {
  easterModal.classList.remove('visible');
});
easterModal.addEventListener('click', e => {
  if (e.target === easterModal) easterModal.classList.remove('visible');
});

// Secret: clicking the lock icon 3 times reveals the password hint
let lockClicks = 0;
lockIcon.addEventListener('click', () => {
  lockClicks++;
  if (lockClicks === 3) {
    easterModal.classList.add('visible');
    lockClicks = 0;
  }
});

/* ──────────────────────────────────────────────────
   SCENE 2 — REVEAL
   ────────────────────────────────────────────────── */
function initRevealScene() {
  spawnFloatingHearts();
  runTypewriter();
}

/* Floating hearts */
function spawnFloatingHearts() {
  floatingHearts.innerHTML = '';
  const symbols = ['❤', '♥', '❥', '💕', '🌸', '✦', '°'];

  for (let i = 0; i < 22; i++) {
    const el = document.createElement('span');
    el.className = 'heart-float';
    el.textContent = symbols[Math.floor(Math.random() * symbols.length)];

    const left  = Math.random() * 100;
    const dur   = 8 + Math.random() * 10;
    const delay = Math.random() * 12;
    const drift = (Math.random() - 0.5) * 120;
    const rot   = (Math.random() - 0.5) * 80;

    el.style.cssText = `
      left: ${left}%;
      --dur: ${dur}s;
      --delay: ${delay}s;
      --drift: ${drift}px;
      --rot: ${rot}deg;
      font-size: ${0.8 + Math.random() * 1.4}rem;
    `;

    floatingHearts.appendChild(el);
  }
}

/* Typewriter effect — cycles through lines */
function runTypewriter() {
  let lineIdx   = 0;
  let charIdx   = 0;
  let deleting  = false;
  let timeoutId = null;

  function tick() {
    const line = CONFIG.typewriterLines[lineIdx];

    if (!deleting) {
      // Typing
      typewriterEl.textContent = line.slice(0, charIdx + 1);
      charIdx++;

      if (charIdx === line.length) {
        // Finished typing this line — pause, then delete
        deleting = true;
        timeoutId = setTimeout(tick, CONFIG.typewriterPause);
        return;
      }
    } else {
      // Deleting
      typewriterEl.textContent = line.slice(0, charIdx - 1);
      charIdx--;

      if (charIdx === 0) {
        deleting = false;
        lineIdx  = (lineIdx + 1) % CONFIG.typewriterLines.length;
        timeoutId = setTimeout(tick, 400);
        return;
      }
    }

    timeoutId = setTimeout(tick, deleting ? CONFIG.typewriterSpeed * 0.4 : CONFIG.typewriterSpeed);
  }

  tick();
}

/* Music toggle */
soundBtn.addEventListener('click', () => {
  state.musicPlaying = !state.musicPlaying;
  const iconOn  = soundBtn.querySelector('.on');
  const iconOff = soundBtn.querySelector('.off');

  if (state.musicPlaying) {
    bgMusic.volume = 0.25;
    bgMusic.play().catch(() => {}); // catch autoplay policy errors
    iconOn.style.display  = '';
    iconOff.style.display = 'none';
    soundBtn.style.background = 'rgba(232,200,130,0.15)';
  } else {
    bgMusic.pause();
    iconOn.style.display  = 'none';
    iconOff.style.display = '';
    soundBtn.style.background = '';
  }
});

/* Go to gifts */
gotoGiftsBtn.addEventListener('click', () => {
  switchScene('reveal', 'gifts');
});

/* ──────────────────────────────────────────────────
   SCENE 3 — GIFTS
   ────────────────────────────────────────────────── */
giftCards.forEach(card => {
  card.addEventListener('click', () => {
    const id = card.dataset.gift;

    if (card.classList.contains('opened')) return; // already open

    // Flip open
    card.classList.add('opened');
    state.giftsOpened.add(id);

    // Update progress dot
    $(`dot-${id}`).classList.add('filled');

    // Sparkle burst at card position
    spawnCardSparkles(card);

    // Check if all 3 opened
    if (state.giftsOpened.size === 3) {
      setTimeout(() => switchScene('gifts', 'finale'), 1600);
    }
  });

  // Keyboard accessibility
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      card.click();
    }
  });
});

/* Tiny sparkle burst when a gift opens */
function spawnCardSparkles(card) {
  const rect   = card.getBoundingClientRect();
  const cx     = rect.left + rect.width  / 2;
  const cy     = rect.top  + rect.height / 2;
  const colors = ['#e8c882','#e07b8a','#c084ac','#fff'];

  for (let i = 0; i < 18; i++) {
    const dot = document.createElement('div');
    const angle = Math.random() * 360;
    const dist  = 40 + Math.random() * 80;
    const size  = 4 + Math.random() * 5;
    const color = colors[Math.floor(Math.random() * colors.length)];

    Object.assign(dot.style, {
      position:  'fixed',
      left:      `${cx}px`,
      top:       `${cy}px`,
      width:     `${size}px`,
      height:    `${size}px`,
      borderRadius: '50%',
      background: color,
      pointerEvents: 'none',
      zIndex:    '500',
      transition: `transform 0.7s cubic-bezier(0.22,1,0.36,1), opacity 0.7s ease`,
      transform:  'translate(-50%,-50%)',
      opacity:    '1',
    });

    document.body.appendChild(dot);

    requestAnimationFrame(() => {
      const rad = angle * Math.PI / 180;
      dot.style.transform = `translate(calc(-50% + ${Math.cos(rad)*dist}px), calc(-50% + ${Math.sin(rad)*dist}px)) scale(0.3)`;
      dot.style.opacity   = '0';
    });

    setTimeout(() => dot.remove(), 750);
  }
}

/* ──────────────────────────────────────────────────
   SCENE 4 — FINALE / FIREWORKS
   ────────────────────────────────────────────────── */
const fCanvas = $('fireworks-canvas');
const fCtx    = fCanvas.getContext('2d');

function resizeFireworksCanvas() {
  fCanvas.width  = window.innerWidth;
  fCanvas.height = window.innerHeight;
}

/* Firework particle */
class FireworkParticle {
  constructor(x, y, color) {
    this.x     = x;
    this.y     = y;
    this.color = color;
    this.vx    = (Math.random() - 0.5) * 8;
    this.vy    = (Math.random() - 0.5) * 8 - 2;
    this.alpha = 1;
    this.decay = 0.012 + Math.random() * 0.015;
    this.r     = 2 + Math.random() * 2.5;
    this.gravity = 0.09;
    this.trail = [];
  }

  update() {
    this.trail.push({ x: this.x, y: this.y, alpha: this.alpha });
    if (this.trail.length > 5) this.trail.shift();

    this.vx   *= 0.97;
    this.vy   += this.gravity;
    this.x    += this.vx;
    this.y    += this.vy;
    this.alpha -= this.decay;
  }

  draw() {
    // Trail
    this.trail.forEach((t, i) => {
      const trailAlpha = (i / this.trail.length) * this.alpha * 0.4;
      fCtx.beginPath();
      fCtx.arc(t.x, t.y, this.r * 0.6, 0, Math.PI * 2);
      fCtx.fillStyle = this.color;
      fCtx.globalAlpha = trailAlpha;
      fCtx.fill();
    });

    // Head
    fCtx.beginPath();
    fCtx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    fCtx.fillStyle = this.color;
    fCtx.globalAlpha = this.alpha;
    fCtx.fill();
    fCtx.globalAlpha = 1;
  }

  isDead() { return this.alpha <= 0; }
}

function launchFirework() {
  const x = 0.15 * fCanvas.width + Math.random() * 0.7 * fCanvas.width;
  const y = 0.1  * fCanvas.height + Math.random() * 0.5 * fCanvas.height;
  const hue = Math.floor(Math.random() * 360);
  const colors = [
    `hsl(${hue},90%,75%)`,
    `hsl(${(hue+30)%360},80%,80%)`,
    `hsl(${(hue+60)%360},70%,90%)`,
    '#f8f4f0',
  ];

  const count = 70 + Math.floor(Math.random() * 50);
  for (let i = 0; i < count; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    state.fireworks.push(new FireworkParticle(x, y, color));
  }
}

function animateFireworks() {
  fCtx.fillStyle = 'rgba(13,11,20,0.22)';
  fCtx.fillRect(0, 0, fCanvas.width, fCanvas.height);

  state.fireworks = state.fireworks.filter(p => {
    p.update();
    p.draw();
    return !p.isDead();
  });

  state.animFrame = requestAnimationFrame(animateFireworks);
}

let fireworkInterval = null;

function initFinaleScene() {
  resizeFireworksCanvas();
  buildFinaleStars();

  // Start fireworks loop
  animateFireworks();

  // Launch fireworks on a schedule
  launchFirework();
  launchFirework();

  fireworkInterval = setInterval(() => {
    launchFirework();
    if (Math.random() > 0.5) setTimeout(launchFirework, 250);
  }, 900);

  // Stop after 12 seconds (keep just a few)
  setTimeout(() => {
    clearInterval(fireworkInterval);
    fireworkInterval = null;
  }, 12000);
}

/* Twinkling stars behind the finale card */
function buildFinaleStars() {
  finaleStars.innerHTML = '';
  for (let i = 0; i < 30; i++) {
    const s = document.createElement('div');
    s.className = 'finale-star';
    s.style.cssText = `
      left:  ${Math.random() * 100}%;
      top:   ${Math.random() * 100}%;
      --d:   ${1.5 + Math.random() * 3}s;
      --delay: ${Math.random() * 4}s;
    `;
    finaleStars.appendChild(s);
  }
}

/* ──────────────────────────────────────────────────
   REPLAY
   ────────────────────────────────────────────────── */
replayBtn.addEventListener('click', () => {
  // Reset state
  state.giftsOpened.clear();
  state.fireworks   = [];
  state.musicPlaying = false;

  if (fireworkInterval) { clearInterval(fireworkInterval); fireworkInterval = null; }
  if (state.animFrame)  { cancelAnimationFrame(state.animFrame); state.animFrame = null; }

  bgMusic.pause();
  bgMusic.currentTime = 0;

  // Reset gift cards
  giftCards.forEach(c => c.classList.remove('opened'));

  // Reset dots
  document.querySelectorAll('.progress-dot').forEach(d => d.classList.remove('filled'));

  // Reset typewriter
  typewriterEl.textContent = '';

  // Reset lock
  lockIcon.classList.remove('unlocked');
  lockIcon.style.filter = '';
  lockIcon.style.color  = '';
  passwordInput.value   = '';
  passwordInput.disabled = false;
  enterBtn.disabled     = false;
  inputWrapper.style.opacity = '';

  // Reset sound button
  const iconOn  = soundBtn.querySelector('.on');
  const iconOff = soundBtn.querySelector('.off');
  iconOn.style.display  = '';
  iconOff.style.display = 'none';
  soundBtn.style.background = '';

  // Clear fireworks canvas
  fCtx.clearRect(0, 0, fCanvas.width, fCanvas.height);

  // Transition back to entry
  scenes.finale.classList.remove('active');
  scenes.finale.classList.add('exit');

  setTimeout(() => {
    ['reveal','gifts','finale'].forEach(k => {
      scenes[k].classList.remove('active','exit');
    });
    scenes.entry.classList.add('active');
    state.currentScene = 'entry';
    scenes.finale.classList.remove('exit');
    passwordInput.focus();
  }, 700);
});

/* ──────────────────────────────────────────────────
   WINDOW RESIZE
   ────────────────────────────────────────────────── */
window.addEventListener('resize', () => {
  resizeParticleCanvas();
  if (state.currentScene === 'finale') resizeFireworksCanvas();
});

/* ──────────────────────────────────────────────────
   INIT
   ────────────────────────────────────────────────── */
function init() {
  initParticles();
  animateParticles();

  // Auto-focus password on load
  setTimeout(() => passwordInput.focus(), 800);

  // Subtle input "sparkle" on focus
  passwordInput.addEventListener('focus', () => {
    inputWrapper.style.transition = 'transform 0.3s';
    inputWrapper.style.transform  = 'scale(1.01)';
  });
  passwordInput.addEventListener('blur', () => {
    inputWrapper.style.transform = 'scale(1)';
  });

  console.log(
    '%c🌹 Happy Birthday! A little secret: the answer is in the heart.',
    'color:#e07b8a; font-family:serif; font-size:14px; padding:6px;'
  );
}

init();
