const IMAGE_DIR = 'images/';
const PAIR_LABELS = 'ABCDEFGHIJKLMN'.split('');
const IMAGE_PAIRS = PAIR_LABELS.map((label) => ({
  label,
  back: `${IMAGE_DIR}${label}1.jpg`,
  front: `${IMAGE_DIR}${label}2.jpg`
}));

const STATE_KEY = 'terraLayerState';

let bgImg;
let fgImg;
let holes = [];

let velocityMultiplier = 1;
let currentBgPath;
let currentFgPath;
let currentPairLabel;

function readState() {
  try {
    const raw = sessionStorage.getItem(STATE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      const n = IMAGE_PAIRS.length;
      const idx = Number(s.pairIndex);
      return {
        pairIndex: n > 0 ? constrain(Number.isFinite(idx) ? idx : 0, 0, n - 1) : 0,
        swapped: !!s.swapped
      };
    }
  } catch (_) {}
  return { pairIndex: 0, swapped: false };
}

function writeState(s) {
  sessionStorage.setItem(STATE_KEY, JSON.stringify(s));
}

function preload() {
  const state = readState();
  const pair = IMAGE_PAIRS[state.pairIndex];
  let bgPath = pair.back;
  let fgPath = pair.front;
  if (state.swapped) {
    const t = bgPath;
    bgPath = fgPath;
    fgPath = t;
  }
  currentBgPath = bgPath;
  currentFgPath = fgPath;
  currentPairLabel = pair.label;
  bgImg = loadImage(currentBgPath);
  fgImg = loadImage(currentFgPath);
}

function setup() {
  const host = document.getElementById('sketch-host');
  const cnv = createCanvas(windowWidth, windowHeight);
  if (host) {
    cnv.parent(host);
  }

  const thumb = document.querySelector('.control-panel__thumb');
  if (thumb && currentBgPath) {
    thumb.src = currentBgPath;
  }

  const pairLabel = document.getElementById('pair-label');
  if (pairLabel) {
    const backFile = currentBgPath || '';
    const frontFile = currentFgPath || '';
    pairLabel.textContent = `Pair ${currentPairLabel} · back ${backFile} / front ${frontFile}`;
  }

  const velInput = document.getElementById('velocity');
  const velOut = document.getElementById('velocity-value');
  const syncVelocity = () => {
    if (!velInput) return;
    const v = parseFloat(velInput.value);
    velocityMultiplier = v / 100;
    if (velOut) {
      velOut.textContent = `${Math.round(v)}%`;
    }
  };
  syncVelocity();
  if (velInput) {
    velInput.addEventListener('input', syncVelocity);
  }

  const nextPairBtn = document.getElementById('next-pair-btn');
  if (nextPairBtn) {
    nextPairBtn.addEventListener('click', () => {
      const s = readState();
      s.pairIndex = (s.pairIndex + 1) % IMAGE_PAIRS.length;
      writeState(s);
      location.reload();
    });
  }

  const swapLayersBtn = document.getElementById('swap-layers-btn');
  if (swapLayersBtn) {
    swapLayersBtn.addEventListener('click', () => {
      const s = readState();
      s.swapped = !s.swapped;
      writeState(s);
      location.reload();
    });
  }

  initHoles();
}

function initHoles() {
  holes = [];
  for (let i = 0; i < 4; i++) {
    holes.push({
      x: random(width / 2),
      y: random(height / 2),
      w: random(50, width / 2),
      h: random(50, height / 2),
      speedX: random(-0.1, 0.1),
      speedY: random(-0.1, 0.1)
    });
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  for (let hole of holes) {
    hole.w = min(hole.w, width);
    hole.h = min(hole.h, height);
    hole.x = constrain(hole.x, 0, max(0, width - hole.w));
    hole.y = constrain(hole.y, 0, max(0, height - hole.h));
  }
}

function draw() {
  image(bgImg, 0, 0, width, height);
  image(fgImg, 0, 0, width, height);

  for (let hole of holes) {
    copy(bgImg, hole.x, hole.y, hole.w, hole.h, hole.x, hole.y, hole.w, hole.h);

    hole.x += hole.speedX * velocityMultiplier;
    hole.y += hole.speedY * velocityMultiplier;

    if (hole.x < 0 || hole.x + hole.w > width) {
      hole.speedX *= -1;
    }
    if (hole.y < 0 || hole.y + hole.h > height) {
      hole.speedY *= -1;
    }
  }
}
