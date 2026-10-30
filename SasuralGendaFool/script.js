/* ==========================================================================
   Sasural Genda Fool — Animated Wedding Invitation JavaScript
   Vanilla JS + GSAP ScrollTrigger Integration
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. Viewport Height Fix (MUST run first)
   -------------------------------------------------------------------------- */
function setActualVh() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
setActualVh();

/* --------------------------------------------------------------------------
   2. Scroll Restoration & Reset on Load
   -------------------------------------------------------------------------- */
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

/* --------------------------------------------------------------------------
   3. DOM Elements & State Variables
   -------------------------------------------------------------------------- */
const introLayer   = document.getElementById('intro-layer');
const introVideo   = document.getElementById('intro-video');
const tapScreen    = document.getElementById('tap-screen');
const mfab         = document.getElementById('mfab');
const iconOn       = document.getElementById('icon-on');
const iconOff      = document.getElementById('icon-off');
const scrollInd    = document.getElementById('scroll-indicator');
const bgAudio      = document.getElementById('bg-music');
const canvasPetals = document.getElementById('global-petals');

let isAppUnlocked  = false;
let isMusicPlaying = false;
let isVideoStarted = false;
let currentAttendance = 'accept';

// WhatsApp RSVP Destination Number (format: country code + number)
const WHATSAPP_NUMBER = '919876543210';

/* --------------------------------------------------------------------------
   4. Video Intro & Unlock Logic
   -------------------------------------------------------------------------- */
// Preload video stream
if (introVideo) {
  introVideo.load();
}

function safePlayIntro() {
  if (!introVideo || isVideoStarted) return;
  isVideoStarted = true;

  introVideo.muted = false;
  introVideo.volume = 1.0;

  // Prime background audio context on user gesture
  if (bgAudio) {
    bgAudio.muted = true;
    bgAudio.play().then(() => bgAudio.pause()).catch(() => {});
    bgAudio.muted = false;
  }

  const playPromise = introVideo.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      // If unmuted autoplay blocked, fallback with muted and prompt
      introVideo.muted = true;
      introVideo.play().catch(() => {});
    });
  }

  if (tapScreen) {
    tapScreen.classList.add('hidden');
  }
}

// Single tap anywhere on tapScreen triggers playback
if (tapScreen) {
  tapScreen.addEventListener('click', safePlayIntro, { once: true });
  tapScreen.addEventListener('touchend', safePlayIntro, { once: true, passive: true });
}

// Block pause attempts: video cannot be paused and must run until completion
if (introVideo) {
  introVideo.addEventListener('pause', () => {
    if (!introVideo.ended && isVideoStarted && !isAppUnlocked) {
      introVideo.play().catch(() => {});
    }
  });

  // Trigger app reveal as video finishes
  introVideo.addEventListener('timeupdate', () => {
    if (!introVideo.duration) return;
    const remaining = introVideo.duration - introVideo.currentTime;
    // Cross-fade intro directly to the first section before video ends
    if (remaining < 1.0 && !isAppUnlocked) {
      revealApp();
    }
  });

  introVideo.addEventListener('ended', () => {
    revealApp();
  });
}

/**
 * Reveal Application after Intro Video completes
 */
function revealApp() {
  if (isAppUnlocked) return;
  isAppUnlocked = true;

  // 1. Fade out the video layer
  if (introLayer) {
    introLayer.classList.add('fade-out');
    setTimeout(() => {
      introLayer.classList.add('hidden');
    }, 1200);
  }

  // 2. Unlock scrolling on body
  setTimeout(() => {
    document.body.classList.add('unlocked');

    // 3. Reveal Music FAB & Scroll Indicator
    if (mfab) mfab.classList.add('visible');
    if (scrollInd) scrollInd.classList.add('visible');

    // 4. Start background music
    startBgMusic();

    // 5. Initialize Falling Petals Global Canvas
    initGlobalPetals();

    // 6. Initialize Scroll Reveal animations only AFTER .unlocked is active
    initScrollReveal();
  }, 400);
}

/* --------------------------------------------------------------------------
   5. Music Floating Action Button (FAB)
   -------------------------------------------------------------------------- */
function startBgMusic() {
  if (!bgAudio) return;
  bgAudio.volume = 0.55;
  bgAudio.play().then(() => {
    isMusicPlaying = true;
    updateFabState(true);
  }).catch(() => {
    isMusicPlaying = false;
    updateFabState(false);
  });
}

function updateFabState(isPlaying) {
  if (!mfab) return;
  if (isPlaying) {
    mfab.classList.add('playing');
    if (iconOn) iconOn.style.display = 'block';
    if (iconOff) iconOff.style.display = 'none';
  } else {
    mfab.classList.remove('playing');
    if (iconOn) iconOn.style.display = 'none';
    if (iconOff) iconOff.style.display = 'block';
  }
}

window.toggleMusic = function () {
  if (!bgAudio) return;
  if (isMusicPlaying) {
    bgAudio.pause();
    isMusicPlaying = false;
    updateFabState(false);
  } else {
    bgAudio.play().then(() => {
      isMusicPlaying = true;
      updateFabState(true);
    }).catch(() => {
      isMusicPlaying = false;
      updateFabState(false);
    });
  }
};

/* Hide scroll-down indicator after user scrolls */
window.addEventListener('scroll', () => {
  if (!scrollInd) return;
  if (window.scrollY > 60) {
    scrollInd.classList.add('hidden-after-scroll');
  } else {
    scrollInd.classList.remove('hidden-after-scroll');
  }
}, { passive: true });

/* --------------------------------------------------------------------------
   6. Global Petal Canvas Animation
   Single unified canvas with marigold and rose petals
   -------------------------------------------------------------------------- */
function initGlobalPetals() {
  if (!canvasPetals) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const ctx = canvasPetals.getContext('2d');
  let width = window.innerWidth;
  let height = window.visualViewport ? window.visualViewport.height : window.innerHeight;

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    canvasPetals.width = width;
    canvasPetals.height = height;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });

  // Mobile-optimized petal count (between 18 and 28)
  const isMobile = width < 768;
  const PETAL_COUNT = isMobile ? 20 : 28;

  // Palette: Marigold saffron/gold + romantic rose accents
  const petalColors = [
    'rgba(245, 120, 10, 0.88)',   // Saffron Orange
    'rgba(255, 165, 0, 0.88)',    // Marigold Orange
    'rgba(250, 195, 30, 0.85)',   // Golden Yellow
    'rgba(235, 100, 15, 0.88)',   // Deep Saffron
    'rgba(215, 45, 80, 0.82)',    // Rose Red
    'rgba(235, 75, 110, 0.82)'    // Pink Rose
  ];

  class Petal {
    constructor(init = false) {
      this.reset(init);
    }

    reset(init = false) {
      this.x = Math.random() * width;
      this.y = init ? Math.random() * height : -35 - Math.random() * 50;
      this.vy = 1.0 + Math.random() * 1.5;
      this.vx = (Math.random() - 0.5) * 0.8;
      this.scale = 0.22 + Math.random() * 0.22;
      this.scaleX = this.scale;
      this.rot = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.035;
      this.flipSpeed = 0.02 + Math.random() * 0.03;
      this.flipPhase = Math.random() * Math.PI * 2;
      this.color = petalColors[Math.floor(Math.random() * petalColors.length)];
      this.swaySpeed = 0.015 + Math.random() * 0.02;
      this.swayAmp = 1.2 + Math.random() * 1.8;
    }

    update() {
      this.y += this.vy;
      this.flipPhase += this.flipSpeed;
      this.scaleX = Math.cos(this.flipPhase) * this.scale;
      this.rot += this.rotSpeed;
      this.x += Math.sin(this.y * this.swaySpeed) * this.swayAmp + this.vx;

      if (this.y > height + 40) {
        this.reset(false);
      }
      if (this.x < -30) this.x = width + 20;
      if (this.x > width + 30) this.x = -20;
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      ctx.scale(this.scaleX, this.scale);

      // Curved teardrop marigold/rose petal path
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-12, -8, -14, -28, 0, -34);
      ctx.bezierCurveTo(14, -28, 12, -8, 0, 0);
      ctx.fillStyle = this.color;
      ctx.fill();

      // Subtle center vein
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(0, -26);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }
  }

  const petals = Array.from({ length: PETAL_COUNT }, () => new Petal(true));

  function animate() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < petals.length; i++) {
      petals[i].update();
      petals[i].draw();
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

/* --------------------------------------------------------------------------
   7. Countdown Timer (10 February 2028)
   -------------------------------------------------------------------------- */
(function initCountdown() {
  const targetDate = new Date('Feb 10, 2028 10:00:00').getTime();

  const dEl = document.getElementById('cd-days');
  const hEl = document.getElementById('cd-hours');
  const mEl = document.getElementById('cd-mins');
  const sEl = document.getElementById('cd-secs');

  if (!dEl || !hEl || !mEl || !sEl) return;

  function pad(num) {
    return String(num).padStart(2, '0');
  }

  function update() {
    const now = Date.now();
    const distance = targetDate - now;

    if (distance < 0) {
      dEl.textContent = '00';
      hEl.textContent = '00';
      mEl.textContent = '00';
      sEl.textContent = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    dEl.textContent = String(days);
    hEl.textContent = pad(hours);
    mEl.textContent = pad(minutes);
    sEl.textContent = pad(seconds);
  }

  update();
  setInterval(update, 1000);
})();

/* --------------------------------------------------------------------------
   8. Add to Calendar Integration
   -------------------------------------------------------------------------- */
window.addToCalendar = function (title, startIso, endIso, desc, loc) {
  const eventTitle = `${title} — Arjun & Kavya Wedding`;
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${startIso}/${endIso}&details=${encodeURIComponent(desc)}&location=${encodeURIComponent(loc)}`;
  window.open(url, '_blank');
};

/* --------------------------------------------------------------------------
   9. RSVP Form & WhatsApp Routing
   -------------------------------------------------------------------------- */
let rsvpAlertTimer = null;

window.toggleAttendance = function (val) {
  currentAttendance = val;
  const btnAccept = document.getElementById('btn-accept');
  const btnDecline = document.getElementById('btn-decline');
  const guestsSelection = document.getElementById('guests-selection');
  const eventsSelection = document.getElementById('events-selection');
  const guestsSelect = document.getElementById('rsvp-guests');
  const eventCheckboxes = document.querySelectorAll('input[name="rsvp-event"]');

  const isDecline = (val === 'decline');

  if (isDecline) {
    if (btnDecline) btnDecline.classList.add('active');
    if (btnAccept) btnAccept.classList.remove('active');

    // Disable Number of guests (retaining presence in DOM with disabled CSS)
    if (guestsSelection) guestsSelection.classList.add('is-disabled');
    if (guestsSelect) guestsSelect.disabled = true;

    // Disable Events selection (retaining presence in DOM with disabled CSS)
    if (eventsSelection) eventsSelection.classList.add('is-disabled');
    eventCheckboxes.forEach((cb) => { cb.disabled = true; });
  } else {
    if (btnAccept) btnAccept.classList.add('active');
    if (btnDecline) btnDecline.classList.remove('active');

    // Re-enable Number of guests
    if (guestsSelection) guestsSelection.classList.remove('is-disabled');
    if (guestsSelect) guestsSelect.disabled = false;

    // Re-enable Events selection
    if (eventsSelection) eventsSelection.classList.remove('is-disabled');
    eventCheckboxes.forEach((cb) => { cb.disabled = false; });
  }
};

function showRsvpAlert(message) {
  const alertBox = document.getElementById('rsvp-alert');
  const alertText = document.getElementById('rsvp-alert-text');
  if (!alertBox || !alertText) return;

  alertText.textContent = message;
  alertBox.classList.remove('show');
  // Trigger DOM reflow to restart tooltip animation smoothly
  void alertBox.offsetWidth;
  alertBox.classList.add('show');
  alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  if (rsvpAlertTimer) clearTimeout(rsvpAlertTimer);
  rsvpAlertTimer = setTimeout(() => {
    hideRsvpAlert();
  }, 4500);
}

function hideRsvpAlert() {
  const alertBox = document.getElementById('rsvp-alert');
  if (alertBox) alertBox.classList.remove('show');
  if (rsvpAlertTimer) {
    clearTimeout(rsvpAlertTimer);
    rsvpAlertTimer = null;
  }
}

function initRsvpListeners() {
  const alertBox = document.getElementById('rsvp-alert');
  if (alertBox) alertBox.addEventListener('click', hideRsvpAlert);

  const nameInput = document.getElementById('rsvp-name');
  const phoneInput = document.getElementById('rsvp-phone');
  ['input', 'focus'].forEach((evt) => {
    if (nameInput) {
      nameInput.addEventListener(evt, () => {
        nameInput.classList.remove('input-invalid');
        hideRsvpAlert();
      });
    }
    if (phoneInput) {
      phoneInput.addEventListener(evt, () => {
        phoneInput.classList.remove('input-invalid');
        hideRsvpAlert();
      });
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRsvpListeners);
} else {
  initRsvpListeners();
}

window.handleRsvpSubmit = function (event) {
  event.preventDefault();

  const nameInput = document.getElementById('rsvp-name');
  const phoneInput = document.getElementById('rsvp-phone');
  const guestsInput = document.getElementById('rsvp-guests');

  if (nameInput) nameInput.classList.remove('input-invalid');
  if (phoneInput) phoneInput.classList.remove('input-invalid');

  const name = nameInput ? nameInput.value.trim() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const guests = guestsInput ? guestsInput.value : '1';

  // 1. Validation
  if (!name || name.length < 2) {
    showRsvpAlert('Please enter your full name before sending RSVP.');
    if (nameInput) {
      nameInput.classList.add('input-invalid');
      nameInput.focus();
    }
    return;
  }

  // Basic international phone regex validation (digits, optional +, min 7 digits)
  const phoneClean = phone.replace(/[^0-9]/g, '');
  if (!phone || phoneClean.length < 7) {
    showRsvpAlert('Please enter a valid phone number before sending RSVP.');
    if (phoneInput) {
      phoneInput.classList.add('input-invalid');
      phoneInput.focus();
    }
    return;
  }

  hideRsvpAlert();

  // 2. Gather Selected Events
  const isAttending = currentAttendance === 'accept';
  let selectedEvents = [];
  if (isAttending) {
    const checkboxes = document.querySelectorAll('input[name="rsvp-event"]:checked');
    checkboxes.forEach((cb) => selectedEvents.push(cb.value));
  }
  const eventsText = selectedEvents.length > 0 ? selectedEvents.join(', ') : 'None selected';

  // 3. Format WhatsApp Luxury Message
  const divider = '━━━━━━━━━━━━━━━━━━━━━━';
  let message = '';
  message += `✨ *Arjun & Kavya — Wedding RSVP* ✨\n`;
  message += `${divider}\n\n`;
  message += `👤 *Guest:* ${name}\n`;
  message += `📱 *Phone:* ${phone}\n\n`;
  message += `💌 *Response:* ${isAttending ? '🎉 Joyfully Accept' : '🥺 Regretfully Decline'}\n`;

  if (isAttending) {
    message += `👥 *Number of Guests:* ${guests}\n`;
    message += `🗓️ *Events Attending:*\n   ${eventsText}\n`;
  }

  message += `\n${divider}\n`;
  message += `_Sent via the Wedding Invitation of_\n`;
  message += `_Arjun & Kavya • 10 February 2028_\n`;
  message += `${divider}`;

  // 4. Device Detection (api.whatsapp.com for Mobile, web.whatsapp.com for Desktop)
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const waBase = isMobile ? 'https://api.whatsapp.com/send' : 'https://web.whatsapp.com/send';
  const waUrl = `${waBase}?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`;

  window.open(waUrl, '_blank');

  // 5. Reset Form State
  const rsvpForm = document.getElementById('rsvp-form');
  if (rsvpForm) {
    rsvpForm.reset();
  }
  // Reset attendance state to default ('accept') and restore all fields
  if (typeof window.toggleAttendance === 'function') {
    const radioAccept = document.querySelector('input[name="attendance"][value="accept"]');
    if (radioAccept) radioAccept.checked = true;
    window.toggleAttendance('accept');
  }
  // Remove any remaining validation error styles
  if (nameInput) nameInput.classList.remove('input-invalid');
  if (phoneInput) phoneInput.classList.remove('input-invalid');
};

/* --------------------------------------------------------------------------
   10. Scroll Reveal (GSAP ScrollTrigger with IntersectionObserver fallback)
   Called strictly AFTER body.unlocked is added
   -------------------------------------------------------------------------- */
function initScrollReveal() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealElements = document.querySelectorAll('.reveal');

  if (prefersReduced) {
    revealElements.forEach((el) => el.classList.add('active'));
    return;
  }

  // Use GSAP ScrollTrigger if loaded
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    revealElements.forEach((elem) => {
      gsap.fromTo(elem, 
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: elem,
            start: 'top 88%',
            toggleActions: 'play none none none',
            once: true
          }
        }
      );
    });
  } else {
    // Robust IntersectionObserver Fallback
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          obs.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.12
    });

    revealElements.forEach((el) => observer.observe(el));
  }
}

