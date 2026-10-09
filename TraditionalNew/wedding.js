/* ============================================================
   wedding.js — Aarav & Meera Wedding Invitation
   Traditional Rajasthani Theme | Vanilla JS
   ============================================================ */

/* ----------------------------------------------------------
   1. Viewport Height Fix
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
const introLayer = document.getElementById('intro-layer');
const introVideo = document.getElementById('intro-video');
const tapScreen  = document.getElementById('tap-screen');
const btnTap     = document.getElementById('btn-tap-begin');
const mfab       = document.getElementById('mfab');
const scrollInd  = document.getElementById('scroll-indicator');
const bgAudio    = document.getElementById('bg-music');

let musicPlaying = false;
const WHATSAPP_NUMBER = '918200482291'; // ← update to your number

/* ----------------------------------------------------------
   5. Intro Video Logic
   ---------------------------------------------------------- */
const videoSourceEl = introVideo ? introVideo.querySelector('source') : null;
const VIDEO_SRC = videoSourceEl ? (videoSourceEl.getAttribute('src') || videoSourceEl.src) : '';

if (introVideo) {
  // Prime the video element so buffered frames are ready for instant playback
  introVideo.load();
}

function safePlayVideo() {
  if (!introVideo) return;
  introVideo.muted = false;
  introVideo.volume = 1.0;
  if (bgAudio) { bgAudio.pause(); bgAudio.currentTime = 0; }
  const p = introVideo.play();
  if (p) p.catch(() => {
    introVideo.muted = true;
    introVideo.play().catch(() => revealApp());
  });
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
    setTimeout(() => tapScreen.classList.add('hidden'), 900);
  }, { once: true });
}

if (introVideo) {
  // Prevent accidental pause
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
  // On end → reveal main content
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
    if (mfab)      mfab.classList.add('visible');
    if (scrollInd) scrollInd.classList.add('visible');
    startPetalOverlay();
    startBgMusic();
    initScrollReveal();
  }, 800);
}

/* ----------------------------------------------------------
   6. Scroll Reveal (IntersectionObserver / AOS)
   ---------------------------------------------------------- */
function initScrollReveal() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = document.querySelectorAll('.reveal, [data-aos]');
  if (!items.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active', 'aos-animate');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  items.forEach(el => {
    if (reduceMotion) {
      el.classList.add('active', 'aos-animate');
    } else {
      observer.observe(el);
    }
  });
}

// Auto-run if already unlocked
if (document.body.classList.contains('unlocked')) {
  initScrollReveal();
}

/* ----------------------------------------------------------
   7. Scroll Indicator
   ---------------------------------------------------------- */
window.addEventListener('scroll', () => {
  if (!scrollInd) return;
  scrollInd.classList.toggle('hidden-scroll', window.scrollY > 60);
}, { passive: true });

scrollInd && scrollInd.addEventListener('click', () => {
  const next = document.getElementById('sec-invitation');
  if (next) next.scrollIntoView({ behavior: 'smooth' });
});
scrollInd && scrollInd.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    const next = document.getElementById('sec-invitation');
    if (next) next.scrollIntoView({ behavior: 'smooth' });
  }
});

/* ----------------------------------------------------------
   7. Music FAB
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
  if (mfab) {
    mfab.classList.toggle('playing', isOn);
    mfab.setAttribute('aria-pressed', isOn ? 'true' : 'false');
  }
  if (iconOn)  iconOn.style.display  = isOn ? 'block' : 'none';
  if (iconOff) iconOff.style.display = isOn ? 'none'  : 'block';
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

/* ----------------------------------------------------------
   8. Petal Canvas Engine
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
  ctx.bezierCurveTo(-9, -6, -11, -22, 0, -28);
  ctx.bezierCurveTo(11, -22, 9, -6, 0, 0);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

let petalStarted = false;

function startPetalOverlay() {
  if (petalStarted || reducedMotion) return;
  petalStarted = true;

  const canvas = document.getElementById('canvas-petals');
  if (!canvas) return;
  canvas.classList.add('active');

  const ctx = canvas.getContext('2d');
  let w = 0, h = 0;

  function resize() {
    w = canvas.width  = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(resize, 200), { passive: true });

  // Rajasthani wedding palette
  const colors = [
    'rgba(201,169,110,0.75)',  // gold
    'rgba(232,207,170,0.70)',  // champagne
    'rgba(240,168,185,0.72)',  // lotus blush
    'rgba(215,96,125,0.65)',   // rose
    'rgba(255,218,140,0.68)',  // golden glow
    'rgba(255,185,205,0.60)',  // soft pink
  ];

  const N = clamp(Math.round(window.innerWidth / 18), 14, 24);

  class Petal {
    constructor() { this.reset(true); }
    reset(init) {
      this.x = Math.random() * w;
      this.y = init ? Math.random() * h : -30;
      this.vy = 0.45 + Math.random() * 0.65;
      this.rot = Math.random() * Math.PI * 2;
      this.rs = (Math.random() - 0.5) * 0.04;
      this.scale = 0.16 + Math.random() * 0.20;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.sw = 0.006 + Math.random() * 0.01;
      this.sa = 0.5 + Math.random() * 1.2;
    }
    update() {
      this.y += this.vy;
      this.x += Math.sin(this.y * this.sw) * this.sa;
      this.rot += this.rs;
      if (this.y > h + 35) this.reset(false);
    }
    draw() {
      let alpha = 1;
      const fade = h * 0.85;
      if (this.y > fade) alpha = Math.max(0, 1 - (this.y - fade) / (h - fade));
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
   9. RSVP Form Logic
   ---------------------------------------------------------- */
let rsvpAttendance = 'yes';
let guestCount = 2;

/* Guest stepper */
window.changeGuests = function (delta) {
  guestCount = Math.max(1, Math.min(20, guestCount + delta));
  const el = document.getElementById('guest-count');
  if (el) el.textContent = guestCount;
};

/* Attendance toggle */
window.setAttending = function (val) {
  rsvpAttendance = val;
  const yBtn = document.getElementById('att-yes-btn');
  const nBtn = document.getElementById('att-no-btn');
  const evGrp = document.getElementById('events-group');

  if (val === 'yes') {
    yBtn && yBtn.classList.add('active');
    nBtn && nBtn.classList.remove('active');
    yBtn && yBtn.setAttribute('aria-checked', 'true');
    nBtn && nBtn.setAttribute('aria-checked', 'false');
    if (evGrp) evGrp.style.display = '';
  } else {
    nBtn && nBtn.classList.add('active');
    yBtn && yBtn.classList.remove('active');
    nBtn && nBtn.setAttribute('aria-checked', 'true');
    yBtn && yBtn.setAttribute('aria-checked', 'false');
    if (evGrp) evGrp.style.display = 'none';
  }
};

/* Alert helpers */
window.closeAlert = function () {
  const box = document.getElementById('rsvp-alert');
  if (box) box.classList.remove('show');
};

function showAlert(msg) {
  const box  = document.getElementById('rsvp-alert');
  const txt  = document.getElementById('rsvp-alert-text');
  if (!box || !txt) return;
  txt.textContent = msg;
  box.classList.add('show');
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* RSVP Submit → WhatsApp */
window.sendRSVP = function () {
  const nameEl  = document.getElementById('rsvp-name');
  const phoneEl = document.getElementById('rsvp-phone');
  const name    = nameEl  ? nameEl.value.trim()  : '';
  const phone   = phoneEl ? phoneEl.value.trim() : '';

  if (!name) {
    showAlert('Please enter your full name before confirming RSVP.');
    if (nameEl) nameEl.focus();
    return;
  }
  window.closeAlert();

  const attending = rsvpAttendance === 'yes';
  const guests    = guestCount;
  const checked   = attending
    ? Array.from(document.querySelectorAll('.ev-check:checked'))
        .map(c => c.value).join(', ') || 'None selected'
    : '—';

  const div = '━━━━━━━━━━━━━━━━━━━━━';
  let msg = '';
  msg += `🌸 *Aarav & Meera — RSVP* 🌸\n`;
  msg += `${div}\n\n`;
  msg += `👤 *Guest Name:* ${name}\n`;
  if (phone) msg += `📱 *Phone:* +91 ${phone}\n`;
  msg += `\n💌 *Attending:* ${attending ? '🎉 Joyfully Yes!' : '🥺 Regretfully Unable to Attend'}\n`;
  if (attending) {
    msg += `👥 *Number of Guests:* ${guests}\n`;
    msg += `📅 *Events:* ${checked}\n`;
  }
  msg += `\n${div}\n`;
  msg += `🪷 *Wedding Date:* 14 February 2027\n`;
  msg += `🏰 *Venue:* Udaipur, Rajasthan\n`;
  msg += `${div}\n`;
  msg += `_Sent via #AaravMeera wedding invitation_`;

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const base = isMobile ? 'https://api.whatsapp.com/send' : 'https://web.whatsapp.com/send';
  const url  = `${base}?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');

  // Reset form
  if (nameEl)  nameEl.value  = '';
  if (phoneEl) phoneEl.value = '';
  guestCount = 2;
  const gcEl = document.getElementById('guest-count');
  if (gcEl) gcEl.textContent = '2';
  document.querySelectorAll('.ev-check').forEach(c => { c.checked = false; });
  setAttending('yes');
};
