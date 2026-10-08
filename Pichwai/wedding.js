/* ============================================================
   wedding.js — Aarav & Meera Wedding Invitation
   Pichwai Theme | Vanilla JS + Swiper + AOS
   ============================================================ */

/* ----------------------------------------------------------
   1. Viewport Height Fix (run first)
   ---------------------------------------------------------- */
function setVh() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
setVh();

/* ----------------------------------------------------------
   2. Scroll Restoration
   ---------------------------------------------------------- */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
window.addEventListener('beforeunload', () => window.scrollTo(0, 0));
window.addEventListener('resize', () => {
  setVh();
  if (!document.body.classList.contains('unlocked')) window.scrollTo(0, 0);
});
window.addEventListener('orientationchange', () => {
  setTimeout(setVh, 200);
  if (!document.body.classList.contains('unlocked')) window.scrollTo(0, 0);
});

/* ----------------------------------------------------------
   3. Global Loader
   ---------------------------------------------------------- */
(function() {
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
    new Promise(res => {
      if (document.readyState === 'complete') res();
      else window.addEventListener('load', res, { once: true });
    })
  ]).then(hideLoader).catch(hideLoader);
  setTimeout(hideLoader, 2500);
})();

/* ----------------------------------------------------------
   4. Core Element References
   ---------------------------------------------------------- */
const introLayer  = document.getElementById('intro-layer');
const introVideo  = document.getElementById('intro-video');
const tapScreen   = document.getElementById('tap-screen');
const btnTap      = document.getElementById('btn-tap-begin');
const mfab        = document.getElementById('mfab');
const scrollInd   = document.getElementById('scroll-indicator');
const bgAudio     = document.getElementById('bg-music');

let musicPlaying = false;
const WHATSAPP_NUMBER = '918200482291'; // ← update to real number

/* ----------------------------------------------------------
   5. Intro Video Logic
   ---------------------------------------------------------- */
const VIDEO_SRC = 'VideoTypeAnimatedTheme/images/Dummy.mp4';
let blobReady = false;

if (introVideo) {
  introVideo.load();
  fetch(VIDEO_SRC)
    .then(r => r.ok ? r.blob() : Promise.reject())
    .then(blob => {
      if (!blobReady && introVideo.paused && introVideo.currentTime === 0) {
        blobReady = true;
        introVideo.src = URL.createObjectURL(blob);
        introVideo.load();
      }
    })
    .catch(() => {});
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
    // Unlock audio context on user gesture
    if (bgAudio) {
      bgAudio.muted = true;
      bgAudio.play().then(() => bgAudio.pause()).catch(() => {});
      bgAudio.muted = false;
      bgAudio.currentTime = 0;
    }
    introVideo.classList.add('playing');
    safePlayVideo();
    tapScreen.style.opacity = '0';
    tapScreen.style.pointerEvents = 'none';
    setTimeout(() => tapScreen.classList.add('hidden'), 1000);
  }, { once: true });
}

if (introVideo) {
  // Block pause
  introVideo.addEventListener('pause', () => {
    if (!introVideo.ended && introVideo.classList.contains('playing')) {
      introVideo.play().catch(() => {});
    }
  });
  // Fade near end
  introVideo.addEventListener('timeupdate', () => {
    if (!introVideo.duration) return;
    const rem = introVideo.duration - introVideo.currentTime;
    if (rem < 1.2 && introVideo.style.opacity !== '0') {
      introVideo.style.transition = 'opacity 1s ease';
      introVideo.style.opacity = '0';
    }
  });
  // End → reveal
  introVideo.addEventListener('ended', revealApp);
  introVideo.addEventListener('error', revealApp);
}

let appRevealed = false;
function revealApp() {
  if (appRevealed) return;
  appRevealed = true;
  if (introLayer) {
    introLayer.classList.add('fade-out');
    setTimeout(() => introLayer.classList.add('hidden'), 1600);
  }
  setTimeout(() => {
    document.body.classList.add('unlocked');
    if (mfab) mfab.classList.add('visible');
    if (scrollInd) scrollInd.classList.add('visible');
    initScrollReveal();
    initAOS();
    initSwiper();
    startPetalOverlay();
    startBgMusic();
  }, 800);
}

/* ----------------------------------------------------------
   6. AOS Initialization
   ---------------------------------------------------------- */
function initAOS() {
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      once: true,
      easing: 'ease-out-quad',
      offset: 40,
      delay: 0
    });
  }
}

/* ----------------------------------------------------------
   7. Scroll Reveal (IntersectionObserver fallback)
   ---------------------------------------------------------- */
function initScrollReveal() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('active'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  items.forEach(el => {
    if (reduceMotion) el.classList.add('active');
    else obs.observe(el);
  });
}

/* ----------------------------------------------------------
   8. Scroll Indicator
   ---------------------------------------------------------- */
window.addEventListener('scroll', () => {
  if (!scrollInd) return;
  scrollInd.classList.toggle('hidden-scroll', window.scrollY > 60);
}, { passive: true });

scrollInd && scrollInd.addEventListener('click', () => {
  const next = document.getElementById('sec-intro');
  if (next) next.scrollIntoView({ behavior: 'smooth' });
});
scrollInd && scrollInd.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    const next = document.getElementById('sec-intro');
    if (next) next.scrollIntoView({ behavior: 'smooth' });
  }
});

/* ----------------------------------------------------------
   9. Swiper Carousel
   ---------------------------------------------------------- */
function initSwiper() {
  const container = document.querySelector('.events-swiper');
  if (!container || typeof Swiper === 'undefined') return;
  new Swiper('.events-swiper', {
    slidesPerView: 2.1,
    spaceBetween: 10,
    centeredSlides: false,
    loop: false,
    grabCursor: true,
    pagination: {
      el: '.events-pagination',
      clickable: true
    },
    navigation: {
      prevEl: '.events-prev',
      nextEl: '.events-next'
    },
    breakpoints: {
      340: { slidesPerView: 2.2, spaceBetween: 10 },
      400: { slidesPerView: 2.5, spaceBetween: 12 }
    }
  });
}

/* ----------------------------------------------------------
   10. Music FAB
   ---------------------------------------------------------- */
function startBgMusic() {
  if (!bgAudio) return;
  bgAudio.volume = 0.4;
  bgAudio.play().then(() => {
    musicPlaying = true;
    updateFabIcon(true);
  }).catch(() => {
    musicPlaying = false;
    updateFabIcon(false);
  });
}

function updateFabIcon(isOn) {
  const iconOn  = document.getElementById('icon-playing');
  const iconOff = document.getElementById('icon-muted');
  if (mfab) mfab.classList.toggle('playing', isOn);
  if (iconOn) iconOn.style.display = isOn ? 'block' : 'none';
  if (iconOff) iconOff.style.display = isOn ? 'none' : 'block';
}

window.toggleMusic = function() {
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

/* ----------------------------------------------------------
   11. Petal Canvas Engine
   ---------------------------------------------------------- */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }

function drawPetal(ctx, x, y, rot, scale, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-10, -7, -12, -24, 0, -30);
  ctx.bezierCurveTo(12, -24, 10, -7, 0, 0);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

let petalAnimStarted = false;

function startPetalOverlay() {
  if (petalAnimStarted) return;
  petalAnimStarted = true;

  const canvasEl = document.getElementById('canvas-petals');
  if (!canvasEl || reducedMotion) return;

  canvasEl.classList.add('active');
  const ctx = canvasEl.getContext('2d');

  let w = 0;
  let h = 0;

  function resize() {
    w = canvasEl.width = window.innerWidth;
    h = canvasEl.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(resize, 200), { passive: true });

  // Pichwai royal palette: gold, champagne, lotus blush, and rose petals
  const colors = [
    'rgba(201, 169, 110, 0.75)', // Royal Pichwai Gold
    'rgba(232, 207, 170, 0.7)',  // Champagne Gold
    'rgba(240, 168, 185, 0.75)', // Soft Lotus Pink
    'rgba(215, 96, 125, 0.65)',  // Rose Blossom
    'rgba(255, 218, 140, 0.7)',  // Golden Glow
    'rgba(255, 185, 205, 0.6)'   // Delicate Blush
  ];

  const N = clamp(Math.round(window.innerWidth / 18), 16, 26);
  const speedMin = 0.45;
  const speedMax = 1.1;
  const sizeMin = 0.16;
  const sizeMax = 0.35;

  class Petal {
    constructor() { this.reset(true); }
    reset(init) {
      this.x = Math.random() * w;
      this.y = init ? Math.random() * h : -30;
      this.targetOff = (Math.random() - 0.5) * (w * 0.4);
      this.vy = speedMin + Math.random() * (speedMax - speedMin);
      this.rot = Math.random() * Math.PI * 2;
      this.rs = (Math.random() - 0.5) * 0.04;
      this.scale = sizeMin + Math.random() * (sizeMax - sizeMin);
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.sw = 0.006 + Math.random() * 0.012;
      this.sa = 0.6 + Math.random() * 1.4;
    }
    update() {
      this.y += this.vy;
      const cx = w / 2, tx = cx + this.targetOff;
      this.x += (tx - this.x) * 0.007;
      this.x += Math.sin(this.y * this.sw) * this.sa;
      this.rot += this.rs;
      if (this.y > h + 35) this.reset(false);
    }
    draw() {
      let alpha = 1;
      const fadeStart = h * 0.85;
      if (this.y > fadeStart) {
        alpha = Math.max(0, 1 - (this.y - fadeStart) / (h - fadeStart));
      }
      ctx.globalAlpha = alpha;
      drawPetal(ctx, this.x, this.y, this.rot, this.scale, this.color);
      ctx.globalAlpha = 1;
    }
  }

  const petals = Array.from({ length: N }, () => new Petal());

  function loop() {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < petals.length; i++) {
      petals[i].update();
      petals[i].draw();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

/* ----------------------------------------------------------
   12. RSVP Form Logic
   ---------------------------------------------------------- */
let rsvpAttendance = 'yes';

window.toggleAttendance = function(val) {
  rsvpAttendance = val;
  const yBtn = document.getElementById('att-yes-btn');
  const nBtn = document.getElementById('att-no-btn');
  const evGrp = document.getElementById('events-group');

  if (val === 'yes') {
    yBtn && yBtn.classList.add('active');
    nBtn && nBtn.classList.remove('active');
    yBtn && yBtn.setAttribute('aria-pressed', 'true');
    nBtn && nBtn.setAttribute('aria-pressed', 'false');
    if (evGrp) evGrp.style.display = '';
  } else {
    nBtn && nBtn.classList.add('active');
    yBtn && yBtn.classList.remove('active');
    nBtn && nBtn.setAttribute('aria-pressed', 'true');
    yBtn && yBtn.setAttribute('aria-pressed', 'false');
    if (evGrp) evGrp.style.display = 'none';
  }

  // Update radio dots
  document.querySelectorAll('.att-radio-dot.filled').forEach(d => d.classList.remove('filled'));
  if (val === 'yes') {
    const dot = yBtn && yBtn.querySelector('.att-radio-dot');
    if (dot) dot.classList.add('filled');
  } else {
    const dot = nBtn && nBtn.querySelector('.att-radio-dot');
    if (dot) dot.classList.add('filled');
  }
};

window.showRsvpAlert = function(msg) {
  const box = document.getElementById('rsvp-alert');
  const txt = document.getElementById('rsvp-alert-text');
  if (!box || !txt) return;
  txt.textContent = msg;
  box.classList.add('show');
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

window.closeRsvpAlert = function() {
  const box = document.getElementById('rsvp-alert');
  if (box) box.classList.remove('show');
};

window.sendRSVP = function() {
  const nameEl  = document.getElementById('rsvp-name');
  const phoneEl = document.getElementById('rsvp-phone');
  const name    = nameEl  ? nameEl.value.trim()  : '';
  const phone   = phoneEl ? phoneEl.value.trim() : '';

  if (!name) {
    window.showRsvpAlert('Please enter your full name before submitting RSVP.');
    if (nameEl) nameEl.focus();
    return;
  }
  window.closeRsvpAlert();

  const attending = rsvpAttendance === 'yes';
  const guests    = document.getElementById('rsvp-guests')?.value || '1';
  const checked   = attending
    ? Array.from(document.querySelectorAll('.ev-check:checked')).map(c => c.value).join(', ') || 'None selected'
    : '—';

  const div = '━━━━━━━━━━━━━━━━━━━━';
  let msg = '';
  msg += `🌸 *Aarav & Meera — RSVP* 🌸\n`;
  msg += `${div}\n\n`;
  msg += `👤 *Guest:* ${name}\n`;
  if (phone) msg += `📱 *Phone:* ${phone}\n`;
  msg += `\n💌 *Attending:* ${attending ? '🎉 Joyfully Yes!' : '🥺 Regretfully Unable'}\n`;
  if (attending) {
    msg += `👥 *Guests:* ${guests}\n`;
    msg += `📅 *Events:* ${checked}\n`;
  }
  msg += `\n${div}\n`;
  msg += `🪷 *14 February 2027*\n`;
  msg += `🏰 *The Leela Palace, Udaipur*\n`;
  msg += `${div}\n`;
  msg += `_Sent via #AaravWedsMeera invitation_`;

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const base = isMobile ? 'https://api.whatsapp.com/send' : 'https://web.whatsapp.com/send';
  const url  = `${base}?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');

  // Reset
  if (nameEl)  nameEl.value = '';
  if (phoneEl) phoneEl.value = '';
  const gEl = document.getElementById('rsvp-guests');
  if (gEl) gEl.value = '1';
  document.querySelectorAll('.ev-check').forEach(c => { c.checked = false; });
};

/* ----------------------------------------------------------
   13. Active nav link on scroll
   ---------------------------------------------------------- */
(function() {
  const sections = ['sec-cover', 'sec-invitation', 'sec-events', 'sec-venue', 'sec-rsvp', 'sec-intro'];
  const navLinks = document.querySelectorAll('.nav-link');
  const sectionEls = sections.map(id => document.getElementById(id)).filter(Boolean);
  const sectionNavMap = {
    'sec-cover':      0,
    'sec-invitation': 1,
    'sec-events':     2,
    'sec-venue':      3,
    'sec-rsvp':       4,
    'sec-intro':      4
  };

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const idx = sectionNavMap[e.target.id];
        if (idx !== undefined) {
          navLinks.forEach((l, i) => l.classList.toggle('active', i === idx));
        }
      }
    });
  }, { threshold: 0.4 });

  sectionEls.forEach(s => obs.observe(s));
})();
