const pageLoadedAt = Date.now();

const yesButton = document.getElementById('btnYes');
const noButton = document.getElementById('btnNo');
const buttonsWrap = document.getElementById('buttons');
const successOverlay = document.getElementById('success');
const confettiCanvas = document.getElementById('confetti-canvas');

let yesScale = 1;
let attemptsToSayNo = 0;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getBounds() {
  const wrapRect = buttonsWrap.getBoundingClientRect();
  const yesRect = yesButton.getBoundingClientRect();
  const noRect = noButton.getBoundingClientRect();
  return { wrapRect, yesRect, noRect };
}

function positionNoRandomly(avoidOverlap = true) {
  const { wrapRect, yesRect } = getBounds();

  const maxLeft = wrapRect.width - noButton.offsetWidth;
  const maxTop = wrapRect.height - noButton.offsetHeight;

  let x = 0, y = 0, tries = 0;
  const maxTries = 50;

  do {
    x = Math.random() * maxLeft;
    y = Math.random() * maxTop;
    tries++;

    if (!avoidOverlap) break;

    const noFuture = {
      left: wrapRect.left + x,
      top: wrapRect.top + y,
      right: wrapRect.left + x + noButton.offsetWidth,
      bottom: wrapRect.top + y + noButton.offsetHeight
    };

    const yesCenter = {
      x: yesRect.left + yesRect.width / 2,
      y: yesRect.top + yesRect.height / 2
    };

    const noCenter = {
      x: noFuture.left + noButton.offsetWidth / 2,
      y: noFuture.top + noButton.offsetHeight / 2
    };

    const dx = yesCenter.x - noCenter.x;
    const dy = yesCenter.y - noCenter.y;
    const distance = Math.hypot(dx, dy);

    if (distance > 140) break;
  } while (tries < maxTries);

  noButton.style.left = `${x}px`;
  noButton.style.top = `${y}px`;
}

function gentlyGrowYes() {
  yesScale = clamp(yesScale + 0.06, 1, 1.6);
  yesButton.style.transform = `translate(-50%, -50%) scale(${yesScale})`;
}

function initPositions() {
  // Place No away from Yes initially
  positionNoRandomly(true);
}

// Evasive No button interactions
function onTryNo(e) {
  e.preventDefault();
  attemptsToSayNo++;
  positionNoRandomly(true);
  gentlyGrowYes();
}

noButton.addEventListener('mouseenter', onTryNo);
noButton.addEventListener('click', onTryNo);
noButton.addEventListener('touchstart', onTryNo, { passive: false });

// Say Yes: show success and celebrate
yesButton.addEventListener('click', () => {
  celebrate();
  successOverlay.classList.remove('hidden');
});

// Confetti implementation (lightweight)
const ctx = confettiCanvas.getContext('2d');
let dpr = 1;
let confettiParticles = [];
let confettiAnimationId = null;

function resizeCanvas() {
  dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  confettiCanvas.width = Math.floor(window.innerWidth * dpr);
  confettiCanvas.height = Math.floor(window.innerHeight * dpr);
}

function randomColor() {
  const palette = ['#ff4db8', '#ff9a76', '#ffd166', '#7bdff2', '#b28dff', '#6ee7b7'];
  return palette[Math.floor(Math.random() * palette.length)];
}

function spawnConfetti(count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI - Math.PI / 2;
    const speed = 4 + Math.random() * 5;
    confettiParticles.push({
      x: Math.random() * confettiCanvas.width,
      y: -20 * dpr,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed + 6,
      size: (6 + Math.random() * 10) * dpr,
      color: randomColor(),
      rotation: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.2,
      life: 0,
      maxLife: 120 + Math.random() * 60
    });
  }
}

function stepConfetti() {
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  for (let i = confettiParticles.length - 1; i >= 0; i--) {
    const p = confettiParticles[i];
    p.vy += 0.15; // gravity
    p.x += p.vx;
    p.y += p.vy;
    p.rotation += p.vr;
    p.life++;

    // draw
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
    ctx.restore();

    // recycle
    if (p.life > p.maxLife || p.y > confettiCanvas.height + 40) {
      confettiParticles.splice(i, 1);
    }
  }

  confettiAnimationId = requestAnimationFrame(stepConfetti);
}

function celebrate() {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  if (!confettiAnimationId) {
    stepConfetti();
  }
  // burst waves
  let bursts = 0;
  const burstTimer = setInterval(() => {
    spawnConfetti(80);
    bursts++;
    if (bursts >= 6) {
      clearInterval(burstTimer);
      // stop after a while
      setTimeout(() => {
        cancelAnimationFrame(confettiAnimationId);
        confettiAnimationId = null;
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        window.removeEventListener('resize', resizeCanvas);
      }, 2200);
    }
  }, 220);
}

// Layout init after fonts
window.addEventListener('load', () => {
  initPositions();
  // On resize, keep No within bounds
  window.addEventListener('resize', () => positionNoRandomly(true));
});

