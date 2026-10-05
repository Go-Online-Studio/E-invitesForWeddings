/* ============================================================
   wedding.js — Rohan & Priya Wedding Invitation
   All vanilla JS, no build tools or frameworks.
   ============================================================ */

/* ----------------------------------------------------------
   1. Viewport Height Fix (must run first)
   ---------------------------------------------------------- */
function setActualVh() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
setActualVh();

/* ----------------------------------------------------------
   2. Scroll Restoration
   ---------------------------------------------------------- */
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

window.addEventListener('beforeunload', () => window.scrollTo(0, 0));
window.addEventListener('resize', () => {
  setActualVh();
  if (!document.body.classList.contains('unlocked')) {
    window.scrollTo(0, 0);
  }
});
window.addEventListener('orientationchange', () => {
  setTimeout(setActualVh, 200);
  if (!document.body.classList.contains('unlocked')) {
    window.scrollTo(0, 0);
  }
});

/* ----------------------------------------------------------
   3. Global Loader
   ---------------------------------------------------------- */
(function () {
  const loader = document.getElementById('global-loader');
  if (!loader) return;
  let done = false;

  function hideLoader() {
    if (done) return;
    done = true;
    loader.classList.add('hidden');
  }

  Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise(resolve => {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', resolve, { once: true });
    })
  ]).then(hideLoader).catch(hideLoader);

  setTimeout(hideLoader, 2500);
})();

/* ----------------------------------------------------------
   4. Intro Video Logic
   ---------------------------------------------------------- */
const introLayer = document.getElementById('intro-layer');
const introVideo = document.getElementById('intro-video');
const tapScreen  = document.getElementById('tap-screen');
const btnTapBegin = document.getElementById('btn-tap-begin');
const mfab       = document.getElementById('mfab');
const scrollInd  = document.getElementById('scroll-indicator');
const bgAudio    = document.getElementById('bg-music');

let musicPlaying = false;
const WHATSAPP_NUMBER = '918200482291'; // ← change to real number

// Preload video via Blob for Safari
const VIDEO_SRC = 'images/Dummy.mp4';
let videoBlobReady = false;

if (introVideo) {
  introVideo.load();

  fetch(VIDEO_SRC)
    .then(r => r.ok ? r.blob() : Promise.reject())
    .then(blob => {
      if (!videoBlobReady && introVideo.paused && introVideo.currentTime === 0) {
        videoBlobReady = true;
        introVideo.src = URL.createObjectURL(blob);
        introVideo.load();
      }
    })
    .catch(() => {}); // Fallback to direct stream
}

function safePlayVideo() {
  if (!introVideo) return;
  introVideo.muted = false;
  introVideo.volume = 1.0;
  if (bgAudio) { bgAudio.pause(); bgAudio.currentTime = 0; }
  const p = introVideo.play();
  if (p) p.catch(() => introVideo.play().catch(() => {}));
}

if (tapScreen) {
  tapScreen.addEventListener('click', () => {
    // Unlock audio context on this user gesture
    if (bgAudio) {
      bgAudio.muted = true;
      bgAudio.play().then(() => bgAudio.pause()).catch(() => {});
      bgAudio.muted = false;
      bgAudio.currentTime = 0;
    }

    introVideo.classList.add('playing');
    safePlayVideo();

    if (tapScreen) {
      tapScreen.style.opacity = '0';
      tapScreen.style.pointerEvents = 'none';
      setTimeout(() => tapScreen.classList.add('hidden'), 1000);
    }
  }, { once: true });
}

// Block pause attempts — video must play to end
if (introVideo) {
  introVideo.addEventListener('pause', () => {
    if (!introVideo.ended && introVideo.classList.contains('playing')) {
      introVideo.play().catch(() => {});
    }
  });

  // Fade out near end
  introVideo.addEventListener('timeupdate', () => {
    if (!introVideo.duration) return;
    const remaining = introVideo.duration - introVideo.currentTime;
    if (remaining < 1.2 && introVideo.style.opacity !== '0') {
      introVideo.style.transition = 'opacity 1s ease';
      introVideo.style.opacity = '0';
    }
  });

  introVideo.addEventListener('ended', () => {
    revealApp();
  });
}

function revealApp() {
  // Fade out intro layer
  if (introLayer) {
    introLayer.classList.add('fade-out');
    setTimeout(() => introLayer.classList.add('hidden'), 1600);
  }

  // Unlock scroll
  setTimeout(() => {
    document.body.classList.add('unlocked');
    if (mfab) mfab.classList.add('visible');
    if (scrollInd) scrollInd.classList.add('visible');
    initScrollReveal();
    startRiverMarquee();
    startMehndiPetals();
    startHaldiPetals();
    startSangeetPetals();
    startWeddingPetals();
    startBgMusic();
  }, 800);
}

/* ----------------------------------------------------------
   5. Music FAB
   ---------------------------------------------------------- */
function startBgMusic() {
  if (!bgAudio) return;
  bgAudio.volume = 0.45;
  bgAudio.play().then(() => {
    musicPlaying = true;
    updateFabIcon(true);
  }).catch(() => {
    musicPlaying = false;
    updateFabIcon(false);
  });
}

function updateFabIcon(isOn) {
  const iconOn  = document.getElementById('icon-on');
  const iconOff = document.getElementById('icon-off');
  if (isOn) {
    if (mfab) mfab.classList.add('playing');
    if (iconOn) iconOn.style.display = 'block';
    if (iconOff) iconOff.style.display = 'none';
  } else {
    if (mfab) mfab.classList.remove('playing');
    if (iconOn) iconOn.style.display = 'none';
    if (iconOff) iconOff.style.display = 'block';
  }
}

window.toggleMusic = function () {
  if (!bgAudio) return;
  if (musicPlaying) {
    bgAudio.pause();
    musicPlaying = false;
    updateFabIcon(false);
  } else {
    bgAudio.play().then(() => {
      musicPlaying = true;
      updateFabIcon(true);
    }).catch(() => { musicPlaying = false; updateFabIcon(false); });
  }
};

/* Scroll-down indicator hide after scroll */
window.addEventListener('scroll', () => {
  if (!scrollInd) return;
  if (window.scrollY > 60) {
    scrollInd.classList.add('hidden-after-scroll');
  } else {
    scrollInd.classList.remove('hidden-after-scroll');
  }
}, { passive: true });

/* ----------------------------------------------------------
   6. Scroll Reveal (IntersectionObserver)
   ---------------------------------------------------------- */
function initScrollReveal() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  items.forEach(el => {
    if (reduceMotion) {
      el.classList.add('active');
    } else {
      observer.observe(el);
    }
  });
}

/* ----------------------------------------------------------
   7. Canvas: Marigold / Petal Helpers
   ---------------------------------------------------------- */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/** Draw a teardrop petal shape */
function drawPetalShape(ctx, x, y, rotation, scale, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-12, -8, -14, -28, 0, -34);
  ctx.bezierCurveTo(14, -28, 12, -8, 0, 0);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

/** Generic falling petal animation on a canvas element */
function startPetalCanvas({ canvasEl, colors, count, speedMin = 0.5, speedMax = 1.2, sizeMin = 0.15, sizeMax = 0.35 }) {
  if (!canvasEl || reducedMotion) return;

  const ctx = canvasEl.getContext('2d');
  let vvh = (window.visualViewport ? window.visualViewport.height : window.innerHeight);
  let w = canvasEl.offsetWidth;
  let h = vvh;
  canvasEl.width  = w;
  canvasEl.height = h;

  const petalCount = clamp(count || 18, 10, 40);

  class Petal {
    constructor() { this.reset(true); }
    reset(init) {
      // Spawn across 80% to 100% of width
      const margin = w * 0.1;
      this.x = margin + Math.random() * (w - margin * 2);
      this.y = init ? Math.random() * h - h : -30;
      this.targetOffset = (Math.random() - 0.5) * (w * 0.4); // how far from center it ends up
      this.vy = speedMin + Math.random() * (speedMax - speedMin);
      this.rot = Math.random() * Math.PI * 2;
      this.rs = (Math.random() - 0.5) * 0.04;
      this.scale = sizeMin + Math.random() * (sizeMax - sizeMin);
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.swaySpeed = 0.01 + Math.random() * 0.02;
      this.swayAmount = 0.5 + Math.random() * 1.5;
    }
    update() {
      this.y += this.vy;
      
      // Funnel inward
      const centerX = w / 2;
      const targetX = centerX + this.targetOffset;
      // Linear interpolation (lerp) towards targetX
      this.x += (targetX - this.x) * 0.01;
      
      // Sway & Gravity
      this.x += Math.sin(this.y * this.swaySpeed) * this.swayAmount;
      this.rot += this.rs;
      
      if (this.y > h + 40) this.reset(false);
    }
    draw() {
      // Bottom Fade
      let alpha = 1;
      const fadeStart = h * 0.8;
      if (this.y > fadeStart) {
        alpha = Math.max(0, 1 - (this.y - fadeStart) / (h - fadeStart));
      }
      ctx.globalAlpha = alpha;
      drawPetalShape(ctx, this.x, this.y, this.rot, this.scale, this.color);
      ctx.globalAlpha = 1;
    }
  }

  const petals = Array.from({ length: petalCount }, () => new Petal());

  let animId;
  function loop() {
    ctx.clearRect(0, 0, w, h);
    petals.forEach(p => { p.update(); p.draw(); });
    animId = requestAnimationFrame(loop);
  }
  loop();

  // Resize
  const ro = new ResizeObserver(() => {
    w = canvasEl.offsetWidth;
    vvh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    h = vvh;
    canvasEl.width  = w;
    canvasEl.height = h;
  });
  ro.observe(canvasEl.parentElement || canvasEl);
}

/* ----------------------------------------------------------
   8. Mehndi Section — Marigold Petals
   ---------------------------------------------------------- */
function startMehndiPetals() {
  startPetalCanvas({
    canvasEl: document.getElementById('canvas-mehndi'),
    colors: [
      'rgba(255, 160, 20, 1)',
      'rgba(255, 130, 0,  1)',
      'rgba(255, 200, 40, 1)',
      'rgba(220, 110, 0,  1)',
      'rgba(255, 180, 50, 1)'
    ],
    count: 22
  });
}

/* ----------------------------------------------------------
   9. Haldi Section — Marigold Petals
   ---------------------------------------------------------- */
function startHaldiPetals() {
  startPetalCanvas({
    canvasEl: document.getElementById('canvas-haldi'),
    colors: [
      'rgba(255, 200, 10, 1)',
      'rgba(255, 160, 0,  1)',
      'rgba(240, 180, 20, 1)',
      'rgba(255, 220, 50, 1)',
      'rgba(200, 140, 0,  1)'
    ],
    count: 20
  });
}

/* ----------------------------------------------------------
   9.5 Sangeet Section — Rose Petals
   ---------------------------------------------------------- */
function startSangeetPetals() {
  startPetalCanvas({
    canvasEl: document.getElementById('canvas-sangeet'),
    colors: [
      'rgba(220,  60, 100, 1)',
      'rgba(200,  40,  80, 1)',
      'rgba(255, 100, 140, 1)',
      'rgba(180,  30,  70, 1)',
      'rgba(255, 150, 180, 1)'
    ],
    count: 25,
    speedMin: 0.6,
    speedMax: 1.4,
    sizeMin: 0.15,
    sizeMax: 0.35
  });
}

/* ----------------------------------------------------------
   10. Wedding Date Reveal — Rose Petals
   ---------------------------------------------------------- */
function startWeddingPetals() {
  startPetalCanvas({
    canvasEl: document.getElementById('canvas-wedding'),
    colors: [
      'rgba(220,  60, 100, 1)',
      'rgba(200,  40,  80, 1)',
      'rgba(255, 100, 140, 1)',
      'rgba(180,  30,  70, 1)',
      'rgba(255, 150, 180, 1)'
    ],
    count: 28,
    speedMin: 0.6,
    speedMax: 1.4,
    sizeMin: 0.15,
    sizeMax: 0.25
  });
}

/* ----------------------------------------------------------
   11. Sangeet — River Marquee (Swan + Lotus)
   ---------------------------------------------------------- */
function startRiverMarquee() {
  const canvas = document.getElementById('canvas-river');
  if (!canvas || reducedMotion) return;

  const ctx = canvas.getContext('2d');
  let w = canvas.offsetWidth;
  const RIVER_H = clamp(Math.round(w * 0.28), 80, 140);
  canvas.width  = w;
  canvas.height = RIVER_H;

  // Load images
  const swanImg  = new Image(); swanImg.src  = 'images/Swan.webp';
  const lotusImg = new Image(); lotusImg.src = 'images/LotusFloting.webp';

  // River objects: lotuses drawn first, then swans on top
  const riverObjects = [
    // Lotus (drawn first, bottom layer)
    { img: lotusImg, x: w * 0.1, y: RIVER_H * 0.55, speed: 0.35, w: 55,  h: 40,  wrap: w + 80 },
    { img: lotusImg, x: w * 0.5, y: RIVER_H * 0.70, speed: 0.50, w: 45,  h: 32,  wrap: w + 80 },
    { img: lotusImg, x: w * 0.85, y: RIVER_H * 0.50, speed: 0.40, w: 50,  h: 36,  wrap: w + 80 },
    // Swans (drawn last, top layer)
    { img: swanImg,  x: -80,  y: RIVER_H * 0.38, speed: 0.45, w: 80,  h: 55,  wrap: w + 100 },
    { img: swanImg,  x: w * 0.3, y: RIVER_H * 0.45, speed: 0.48, w: 60,  h: 42,  wrap: w + 100 },
    { img: swanImg,  x: w * 0.7, y: RIVER_H * 0.55, speed: 0.57, w: 70,  h: 50,  wrap: w + 100 }
  ];

  let imagesLoaded = 0;
  [swanImg, lotusImg].forEach(img => {
    img.onload = () => { imagesLoaded++; if (imagesLoaded === 2) startLoop(); };
    img.onerror = () => { imagesLoaded++; if (imagesLoaded === 2) startLoop(); };
  });

  function startLoop() {
    function loop() {
      ctx.clearRect(0, 0, w, RIVER_H);
      riverObjects.forEach(obj => {
        obj.x += obj.speed;
        if (obj.x > obj.wrap) obj.x = -obj.w;
        if (obj.img.complete && obj.img.naturalWidth) {
          ctx.drawImage(obj.img, obj.x, obj.y, obj.w, obj.h);
        }
      });
      requestAnimationFrame(loop);
    }
    loop();
  }

  // Resize
  new ResizeObserver(() => {
    w = canvas.offsetWidth;
    canvas.width  = w;
    canvas.height = RIVER_H;
    riverObjects.forEach(obj => { obj.wrap = w + 100; });
  }).observe(canvas.parentElement || canvas);
}

/* ----------------------------------------------------------
   12. Countdown Timer
   ---------------------------------------------------------- */
(function initCountdown() {
  const target = new Date('Dec 11, 2026 19:00:00').getTime();

  const dEl = document.getElementById('cd-days');
  const hEl = document.getElementById('cd-hours');
  const mEl = document.getElementById('cd-mins');
  const sEl = document.getElementById('cd-secs');
  if (!dEl) return;

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    const dist = target - Date.now();
    if (dist < 0) { clearInterval(tid); return; }
    dEl.textContent = pad(Math.floor(dist / 86400000));
    hEl.textContent = pad(Math.floor((dist % 86400000) / 3600000));
    mEl.textContent = pad(Math.floor((dist % 3600000) / 60000));
    sEl.textContent = pad(Math.floor((dist % 60000) / 1000));
  }

  tick();
  const tid = setInterval(tick, 1000);
})();

/* ----------------------------------------------------------
   13. RSVP — Toggle Attendance
   ---------------------------------------------------------- */
let rsvpAttendance = 'yes';
let rsvpSide       = 'Bride';

window.toggleAttendance = function (val) {
  rsvpAttendance = val;
  const yesBtn     = document.querySelector('.att-btn.yes');
  const noBtn      = document.querySelector('.att-btn.no');
  const eventsGrp  = document.getElementById('events-group');
  const guestsGrp  = document.getElementById('guests-group');

  if (val === 'yes') {
    yesBtn  && yesBtn.classList.add('active');
    noBtn   && noBtn.classList.remove('active');
    if (eventsGrp) eventsGrp.style.display = 'block';
    if (guestsGrp) guestsGrp.style.display = 'block';
  } else {
    noBtn   && noBtn.classList.add('active');
    yesBtn  && yesBtn.classList.remove('active');
    if (eventsGrp) eventsGrp.style.display = 'none';
    if (guestsGrp) guestsGrp.style.display = 'none';
  }
};

/* ----------------------------------------------------------
   14. RSVP — Alert helpers
   ---------------------------------------------------------- */
window.showRsvpAlert = function (msg) {
  const box  = document.getElementById('rsvp-alert');
  const text = document.getElementById('rsvp-alert-text');
  if (!box || !text) return;
  text.textContent = msg;
  box.classList.add('show');
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

window.closeRsvpAlert = function () {
  const box = document.getElementById('rsvp-alert');
  if (box) box.classList.remove('show');
};

/* ----------------------------------------------------------
   15. RSVP — Send WhatsApp Message
   ---------------------------------------------------------- */
window.sendRSVP = function () {
  const nameInput  = document.getElementById('rsvp-name');
  const phoneInput = document.getElementById('rsvp-phone');
  const name  = nameInput  ? nameInput.value.trim()  : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';

  if (!name) {
    window.showRsvpAlert('Please enter your full name before sending RSVP.');
    if (nameInput) nameInput.focus();
    return;
  }
  if (!phone || phone.length < 7) {
    window.showRsvpAlert('Please enter a valid phone number before sending RSVP.');
    if (phoneInput) phoneInput.focus();
    return;
  }
  window.closeRsvpAlert();

  const divider  = '━━━━━━━━━━━━━━━━━━━━━━';
  const attending = rsvpAttendance === 'yes';
  const events   = attending
    ? Array.from(document.querySelectorAll('.event-chip.active')).map(c => c.textContent).join(', ') || 'None selected'
    : '—';
  const guests = attending
    ? (document.getElementById('rsvp-guests') ? document.getElementById('rsvp-guests').value : '1')
    : '—';

  let msg = '';
  msg += `✨ *Rohan & Priya — RSVP* ✨\n`;
  msg += `${divider}\n\n`;
  msg += `👤 *Guest:* ${name}\n`;
  msg += `📱 *Phone:* ${phone}\n\n`;
  msg += `💌 *Response:* ${attending ? '🎉 Joyfully Attending' : '🥺 Regretfully Unable to Attend'}\n`;
  if (attending) {
    msg += `👥 *Number of Guests:* ${guests}\n`;
    msg += `🗓️ *Events Attending:*\n   ${events}\n`;
  }
  msg += `\n${divider}\n`;
  msg += `_Sent via the Wedding Invitation of_\n`;
  msg += `_Rohan & Priya • 11 Dec 2026_\n`;
  msg += `${divider}`;

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const waBase   = isMobile ? 'https://api.whatsapp.com/send' : 'https://web.whatsapp.com/send';
  const waUrl    = `${waBase}?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(msg)}`;

  window.open(waUrl, '_blank');

  // Reset form
  if (nameInput)  nameInput.value  = '';
  if (phoneInput) phoneInput.value = '';
  const guestsIn = document.getElementById('rsvp-guests');
  if (guestsIn) guestsIn.value = '1';
};
