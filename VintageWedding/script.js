/**
 * Vintage Scrapbook Wedding Invitation
 * Interactive Scripts & GSAP Scroll Animations
 */

/* ----------------------------------------------------------
   1. Viewport Height Fix (MUST run first)
   ---------------------------------------------------------- */
function setActualVh() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
setActualVh();

/* ----------------------------------------------------------
   2. Scroll Restoration & Locking
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
   3. Reduced Motion Detection
   ---------------------------------------------------------- */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ----------------------------------------------------------
   4. DOM Elements
   ---------------------------------------------------------- */
const introLayer   = document.getElementById('intro-layer');
const introVideo   = document.getElementById('intro-video');
const tapScreen    = document.getElementById('tap-screen');
const mfab         = document.getElementById('mfab');
const iconOn       = document.getElementById('icon-music-on');
const iconOff      = document.getElementById('icon-music-off');
const scrollInd    = document.getElementById('scroll-indicator');
const bgAudio      = document.getElementById('bg-music');
const petalCanvas  = document.getElementById('petal-canvas');

let musicPlaying = false;
const WHATSAPP_PHONE = '918200482291'; // WhatsApp receiver

/* ----------------------------------------------------------
   5. Video Intro Logic
   ---------------------------------------------------------- */
const VIDEO_SRC = 'https://res.cloudinary.com/dticzwbrv/video/upload/v1792727143/Vintage_Wedding_Invitation_Anima_20261022175926_Gwr_Video_Mvp_qg82hj.mp4';
let videoReady = false;

if (introVideo) {
  introVideo.load();
}

function safePlayIntroVideo() {
  if (!introVideo) return;
  introVideo.muted = false;
  introVideo.volume = 1.0;
  if (bgAudio) {
    bgAudio.pause();
    bgAudio.currentTime = 0;
  }
  const p = introVideo.play();
  if (p) {
    p.catch(() => {
      // If autoplay with sound was blocked, fallback to muted then unmute
      introVideo.muted = true;
      introVideo.play().then(() => {
        introVideo.muted = false;
      }).catch(() => {});
    });
  }
}

if (tapScreen) {
  tapScreen.addEventListener('click', () => {
    // Prime audio context on user gesture
    if (bgAudio) {
      bgAudio.muted = true;
      bgAudio.play().then(() => bgAudio.pause()).catch(() => {});
      bgAudio.muted = false;
      bgAudio.currentTime = 0;
    }

    safePlayIntroVideo();

    // Fade tap screen only after video starts playing or immediately if already active
    const dismissTapScreen = () => {
      tapScreen.style.opacity = '0';
      tapScreen.style.pointerEvents = 'none';
      setTimeout(() => tapScreen.classList.add('hidden'), 500);
    };

    if (introVideo.readyState >= 2) {
      dismissTapScreen();
    } else {
      introVideo.addEventListener('playing', dismissTapScreen, { once: true });
      // Safety timeout in case playing event fires differently
      setTimeout(dismissTapScreen, 250);
    }
  }, { once: true });
}

// Ensure video is not paused before it finishes
if (introVideo) {
  introVideo.addEventListener('pause', () => {
    if (!introVideo.ended && introVideo.classList.contains('playing')) {
      introVideo.play().catch(() => {});
    }
  });

  // Soft fade near the end of video
  let fadingStarted = false;
  introVideo.addEventListener('timeupdate', () => {
    if (!introVideo.duration) return;
    const remaining = introVideo.duration - introVideo.currentTime;
    if (remaining <= 1.0 && !fadingStarted) {
      fadingStarted = true;
      revealApp();
    }
  });

  introVideo.addEventListener('ended', () => {
    if (!fadingStarted) {
      fadingStarted = true;
      revealApp();
    }
  });
}

function revealApp() {
  if (introLayer) {
    introLayer.classList.add('fade-out');
    setTimeout(() => {
      introLayer.classList.add('hidden');
    }, 1300);
  }

  // Unlock scrolling & reveal interactive controls
  document.body.classList.add('unlocked');
  if (mfab) mfab.classList.add('visible');
  if (scrollInd) scrollInd.classList.add('visible');

  startBgMusic();
  startPetalCanvas();
  initGSAPAnimations();
}

/* ----------------------------------------------------------
   6. Music FAB Logic
   ---------------------------------------------------------- */
function startBgMusic() {
  if (!bgAudio) return;
  bgAudio.volume = 0.5;
  bgAudio.play().then(() => {
    musicPlaying = true;
    updateFabState(true);
  }).catch(() => {
    musicPlaying = false;
    updateFabState(false);
  });
}

function updateFabState(isOn) {
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
    updateFabState(false);
  } else {
    bgAudio.play().then(() => {
      musicPlaying = true;
      updateFabState(true);
    }).catch(() => {
      musicPlaying = false;
      updateFabState(false);
    });
  }
};

if (mfab) {
  mfab.addEventListener('click', window.toggleMusic);
}

// Fade out scroll indicator once user begins scrolling
window.addEventListener('scroll', () => {
  if (!scrollInd) return;
  if (window.scrollY > 50) {
    scrollInd.classList.add('hidden-after-scroll');
  } else {
    scrollInd.classList.remove('hidden-after-scroll');
  }
}, { passive: true });

/* ----------------------------------------------------------
   7. Global Petal Canvas (Marigold & Rose Falling Petals)
   ---------------------------------------------------------- */
function drawPetal(ctx, x, y, rotation, scale, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-11, -8, -13, -26, 0, -32);
  ctx.bezierCurveTo(13, -26, 11, -8, 0, 0);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function startPetalCanvas() {
  if (!petalCanvas || prefersReducedMotion) return;

  const ctx = petalCanvas.getContext('2d');
  const appContainer = document.getElementById('app') || document.body;

  let w = appContainer.offsetWidth || 480;
  let h = window.visualViewport ? window.visualViewport.height : window.innerHeight;

  petalCanvas.width = w;
  petalCanvas.height = h;

  const PETAL_COUNT = 24; // Capped nicely between 10 and 30
  const PETAL_COLORS = [
    'rgba(245, 158, 11, 0.92)',  // Marigold bright amber
    'rgba(217, 119, 6, 0.90)',   // Marigold deep orange
    'rgba(180, 83, 9, 0.88)',    // Marigold burnt saffron
    'rgba(190, 24, 93, 0.88)',   // Rose magenta
    'rgba(159, 18, 57, 0.90)',   // Deep burgundy rose
    'rgba(225, 29, 72, 0.85)',   // Classic crimson rose
    'rgba(249, 115, 22, 0.90)'   // Golden flora
  ];

  class PetalParticle {
    constructor() {
      this.reset(true);
    }
    reset(init = false) {
      const margin = w * 0.05;
      this.x = margin + Math.random() * (w - margin * 2);
      this.y = init ? Math.random() * h : -40;
      this.vy = 0.7 + Math.random() * 1.1; // Gentle falling speed
      this.rot = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.035;
      this.scale = 0.2 + Math.random() * 0.22;
      this.color = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
      this.swaySpeed = 0.012 + Math.random() * 0.018;
      this.swayAmount = 0.8 + Math.random() * 1.6;
    }
    update() {
      this.y += this.vy;
      this.x += Math.sin(this.y * this.swaySpeed) * this.swayAmount;
      this.rot += this.rotSpeed;

      if (this.y > h + 40) {
        this.reset(false);
      }
    }
    draw() {
      // Soft fade near bottom of viewport
      let alpha = 1;
      const fadeStart = h * 0.82;
      if (this.y > fadeStart) {
        alpha = Math.max(0, 1 - (this.y - fadeStart) / (h - fadeStart));
      }
      ctx.globalAlpha = alpha;
      drawPetal(ctx, this.x, this.y, this.rot, this.scale, this.color);
      ctx.globalAlpha = 1;
    }
  }

  const petals = Array.from({ length: PETAL_COUNT }, () => new PetalParticle());

  function animatePetals() {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < petals.length; i++) {
      petals[i].update();
      petals[i].draw();
    }
    requestAnimationFrame(animatePetals);
  }
  requestAnimationFrame(animatePetals);

  // Resize listener
  const ro = new ResizeObserver(() => {
    w = appContainer.offsetWidth || 480;
    h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    petalCanvas.width = w;
    petalCanvas.height = h;
  });
  ro.observe(appContainer);
}

/* ----------------------------------------------------------
   8. GSAP Scroll Animations
   ---------------------------------------------------------- */
function initGSAPAnimations() {
  if (prefersReducedMotion) {
    document.querySelectorAll('.vintage-reveal').forEach(el => {
      el.style.opacity = '1';
      el.style.filter = 'none';
      el.style.transform = 'none';
    });
    return;
  }

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  // Refresh ScrollTrigger after DOM adjustments
  ScrollTrigger.refresh();

  // Reveal elements: fade-in + slight scale-up + blur to clear
  gsap.utils.toArray('.gsap-fade-blur').forEach(el => {
    gsap.fromTo(
      el,
      {
        opacity: 0,
        scale: 0.94,
        filter: 'blur(8px)',
        y: 16
      },
      {
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
        y: 0,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none'
        }
      }
    );
  });

  // Staggered reveal for event cards
  const eventCards = gsap.utils.toArray('.event-card');
  if (eventCards.length) {
    gsap.fromTo(
      eventCards,
      {
        opacity: 0,
        scale: 0.94,
        filter: 'blur(6px)',
        y: 18
      },
      {
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
        y: 0,
        duration: 0.85,
        stagger: 0.22,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.sec-3',
          start: 'top 75%',
          toggleActions: 'play none none none'
        }
      }
    );
  }

  // Reveal map polaroid box in Section 4
  const mapBox = document.querySelector('.venue-map-box');
  if (mapBox) {
    gsap.fromTo(
      mapBox,
      {
        opacity: 0,
        scale: 0.92,
        filter: 'blur(8px)',
        y: 20
      },
      {
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
        y: 0,
        duration: 1.0,
        ease: 'back.out(1.2)',
        scrollTrigger: {
          trigger: mapBox,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      }
    );
  }
}

/* ----------------------------------------------------------
   9. RSVP Form Validation & WhatsApp Routing
   ---------------------------------------------------------- */
window.sendRSVP = function (e) {
  if (e) e.preventDefault();

  const nameInput = document.getElementById('rsvp-name');
  const guestsSelect = document.getElementById('rsvp-guests');
  const msgInput = document.getElementById('rsvp-message');
  const alertBox = document.getElementById('rsvp-alert');

  const name = nameInput ? nameInput.value.trim() : '';
  const guests = guestsSelect ? guestsSelect.value : '2';
  const attendingRadio = document.querySelector('input[name="attending"]:checked');
  const attendingVal = attendingRadio ? attendingRadio.value : 'Yes';
  const specialMsg = msgInput ? msgInput.value.trim() : '';

  // Validation
  if (!name) {
    if (alertBox) {
      alertBox.textContent = 'Please enter your name before sending RSVP.';
      alertBox.classList.add('show');
    }
    if (nameInput) nameInput.focus();
    return;
  }

  if (alertBox) {
    alertBox.classList.remove('show');
  }

  // Format Luxury WhatsApp Message
  const divider = '━━━━━━━━━━━━━━━━━━━━━━';
  const isAttending = attendingVal === 'Yes';

  let msg = `✨ *Smit & Riya — Wedding RSVP* ✨\n`;
  msg += `${divider}\n\n`;
  msg += `👤 *Guest:* ${name}\n`;
  msg += `💌 *Response:* ${isAttending ? '🎉 Joyfully Attending' : '🥺 Regretfully Unable to Attend'}\n`;
  if (isAttending) {
    msg += `👥 *Number of Guests:* ${guests}\n`;
  }
  if (specialMsg) {
    msg += `💬 *Special Message:* "${specialMsg}"\n`;
  }
  msg += `\n${divider}\n`;
  msg += `_Sent via the Vintage Wedding Album of_\n`;
  msg += `_Smit & Riya • 24 Nov 2026 • Vadodara_\n`;
  msg += `${divider}`;

  // Route to Mobile or Desktop WhatsApp
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const waBase = isMobile ? 'https://api.whatsapp.com/send' : 'https://web.whatsapp.com/send';
  const waUrl = `${waBase}?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(msg)}`;

  window.open(waUrl, '_blank');

  // Reset form after submit
  const rsvpForm = document.getElementById('rsvp-form');
  if (rsvpForm) {
    rsvpForm.reset();
  }
};

// Scroll to RSVP helper for event buttons
window.scrollToRSVP = function (eventName) {
  const rsvpSec = document.getElementById('sec-5');
  if (rsvpSec) {
    rsvpSec.scrollIntoView({ behavior: 'smooth' });
  }
  const msgInput = document.getElementById('rsvp-message');
  if (msgInput && eventName) {
    if (!msgInput.value.includes(eventName)) {
      msgInput.value = `Can't wait to join for the ${eventName}!`;
    }
  }
};
