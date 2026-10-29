/**
 * Tejas & Mitali Wedding Invitation — Interactive Engine
 * Mobile-First GSAP & Container Query Architecture
 */

// ============================================================================
// 1. VIEWPORT & SCROLL RESTORATION SETUP (Must execute first)
// ============================================================================
function setActualVh() {
  const vh = (window.visualViewport?.height || window.innerHeight) * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
setActualVh();
window.addEventListener('resize', setActualVh);
window.addEventListener('orientationchange', setActualVh);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', setActualVh);
}

// Reset history restoration and scroll to top on fresh load
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// ============================================================================
// 2. CONFIGURATION & STATE
// ============================================================================
const WHATSAPP_PHONE = '918200482291'; // Target WhatsApp number for RSVP

let isAppUnlocked = false;
let isMusicPlaying = false;
let audioContext = null;
let synthInterval = null;

// DOM Elements
const introLayer = document.getElementById('intro-layer');
const introVideo = document.getElementById('intro-video');
const tapScreen = document.getElementById('tap-screen');
const skipIntroBtn = document.getElementById('skip-intro-btn');
const musicFab = document.getElementById('music-fab');
const scrollIndicator = document.getElementById('scroll-indicator');
const bgAudio = document.getElementById('bg-music');
const canvas = document.getElementById('global-petal-canvas');
const rsvpForm = document.getElementById('rsvp-form');
const toastNotification = document.getElementById('toast-notification');
const toastMessage = document.getElementById('toast-message');

// Carousel Elements
const carouselTrack = document.getElementById('events-carousel-track');
const eventCards = Array.from(document.querySelectorAll('.event-card'));
const carouselDots = Array.from(document.querySelectorAll('.carousel-dots .dot'));
const carouselPrevBtn = document.getElementById('carousel-prev-btn');
const carouselNextBtn = document.getElementById('carousel-next-btn');

let activeEventIndex = 0; // Default first card (Mehndi) active on load

// ============================================================================
// 3. INTRO VIDEO & APP UNLOCK SEQUENCE
// ============================================================================
function playIntroVideo() {
  if (!introVideo) {
    revealApp();
    return;
  }

  introVideo.classList.add('playing');
  introVideo.muted = false;
  introVideo.volume = 1.0;

  const playPromise = introVideo.play();
  if (playPromise !== undefined) {
    playPromise.catch((err) => {
      console.warn('Video playback notice:', err);
      revealApp();
    });
  }

  if (tapScreen) {
    tapScreen.classList.add('hidden');
    setTimeout(() => {
      tapScreen.style.display = 'none';
    }, 600);
  }
}

if (introLayer) {
  introLayer.addEventListener('click', (e) => {
    if (isAppUnlocked) return;
    if (e.target === skipIntroBtn || skipIntroBtn.contains(e.target)) return;
    playIntroVideo();
  }, { once: true });
}

if (skipIntroBtn) {
  skipIntroBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    revealApp();
  });
}

// Block pause attempts: video must play to end
if (introVideo) {
  introVideo.addEventListener('pause', () => {
    if (!introVideo.ended && introVideo.classList.contains('playing') && !isAppUnlocked) {
      introVideo.play().catch(() => {});
    }
  });

  introVideo.addEventListener('timeupdate', () => {
    if (!introVideo.duration) return;
    const remaining = introVideo.duration - introVideo.currentTime;
    // Start slow fade transition before the video completely ends
    if (remaining <= 2.0 && !isAppUnlocked) {
      revealApp();
    }
  });

  introVideo.addEventListener('ended', () => {
    revealApp();
  });

  introVideo.addEventListener('error', () => {
    console.warn('Intro video source not found, transitioning seamlessly.');
  });
}

function revealApp() {
  if (isAppUnlocked) return;
  isAppUnlocked = true;

  // 1. Fade out video layer
  if (introLayer) {
    introLayer.classList.add('fade-out');
  }

  // 2. Unlock body scrolling
  document.body.classList.add('unlocked');

  // 3. Reveal FAB and Scroll Indicator
  if (musicFab) {
    musicFab.classList.add('visible');
  }
  if (scrollIndicator) {
    scrollIndicator.classList.add('visible');
  }

  // 4. Auto-play background music
  startBackgroundMusic();

  // 5. Initialize GSAP ScrollTrigger reveals
  initScrollReveal();

  // 6. Ensure carousel active card is accurately centered upon reveal
  centerCard(activeEventIndex, false);

  // 7. Pause video after transition completes to save resources
  if (introVideo) {
    setTimeout(() => {
      try {
        introVideo.pause();
      } catch (e) {}
    }, 1800);
  }
}

// ============================================================================
// 4. MUSIC & AMBIENT AUDIO SYSTEM
// ============================================================================
function startBackgroundMusic() {
  if (!bgAudio) return;

  bgAudio.volume = 0.65;
  const playPromise = bgAudio.play();

  if (playPromise !== undefined) {
    playPromise.then(() => {
      isMusicPlaying = true;
      if (musicFab) musicFab.classList.remove('muted');
    }).catch(() => {
      initWebAudioMelodyFallback();
    });
  }
}

function toggleBackgroundMusic() {
  if (isMusicPlaying) {
    if (bgAudio && !bgAudio.paused) {
      bgAudio.pause();
    }
    stopWebAudioMelody();
    isMusicPlaying = false;
    if (musicFab) musicFab.classList.add('muted');
  } else {
    if (bgAudio) {
      bgAudio.play().then(() => {
        isMusicPlaying = true;
        if (musicFab) musicFab.classList.remove('muted');
      }).catch(() => {
        startWebAudioMelody();
        isMusicPlaying = true;
        if (musicFab) musicFab.classList.remove('muted');
      });
    } else {
      startWebAudioMelody();
      isMusicPlaying = true;
      if (musicFab) musicFab.classList.remove('muted');
    }
  }
}

if (musicFab) {
  musicFab.addEventListener('click', toggleBackgroundMusic);
}

function initWebAudioMelodyFallback() {
  const enableAudioOnGesture = () => {
    startWebAudioMelody();
    window.removeEventListener('click', enableAudioOnGesture);
    window.removeEventListener('touchstart', enableAudioOnGesture);
  };
  window.addEventListener('click', enableAudioOnGesture, { once: true });
  window.addEventListener('touchstart', enableAudioOnGesture, { once: true });
}

function startWebAudioMelody() {
  if (audioContext) {
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
  } else {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    audioContext = new AudioCtx();
  }

  const notes = [293.66, 329.63, 369.99, 440.00, 493.88, 587.33, 659.25];
  let noteIndex = 0;

  if (synthInterval) clearInterval(synthInterval);

  synthInterval = setInterval(() => {
    if (!isMusicPlaying || !audioContext) return;
    playChimeNote(notes[noteIndex % notes.length]);
    noteIndex += Math.floor(Math.random() * 3) + 1;
  }, 1400);

  isMusicPlaying = true;
  if (musicFab) musicFab.classList.remove('muted');
}

function stopWebAudioMelody() {
  if (synthInterval) {
    clearInterval(synthInterval);
    synthInterval = null;
  }
}

function playChimeNote(freq) {
  if (!audioContext || audioContext.state !== 'running') return;
  try {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioContext.currentTime);

    gain.gain.setValueAtTime(0.001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 1.8);

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start();
    osc.stop(audioContext.currentTime + 1.9);
  } catch (e) {}
}

window.addEventListener('scroll', () => {
  if (!scrollIndicator) return;
  if (window.scrollY > 80) {
    scrollIndicator.classList.add('hidden-on-scroll');
  } else if (isAppUnlocked) {
    scrollIndicator.classList.remove('hidden-on-scroll');
  }
}, { passive: true });

// ============================================================================
// 5. GLOBAL FALLING PETALS CANVAS (Single Global Layer)
// ============================================================================
(function initGlobalPetals() {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const mediaQueryMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mediaQueryMotion.matches) {
    return;
  }

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.visualViewport?.height || window.innerHeight);

  function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.visualViewport?.height || window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', resizeCanvas);
  }

  const PETAL_COUNT = 22;
  const petals = [];

  const PETAL_COLORS = [
    { fill: 'rgba(232, 155, 147, 0.75)', stroke: 'rgba(154, 59, 82, 0.35)', type: 'rose' },
    { fill: 'rgba(244, 184, 178, 0.65)', stroke: 'rgba(154, 59, 82, 0.25)', type: 'rose' },
    { fill: 'rgba(245, 180, 50, 0.80)', stroke: 'rgba(180, 100, 20, 0.40)', type: 'marigold' },
    { fill: 'rgba(255, 204, 77, 0.75)', stroke: 'rgba(200, 120, 30, 0.35)', type: 'marigold' },
  ];

  class Petal {
    constructor(isBurst = false, burstX = width / 2, burstY = height / 2) {
      this.reset(isBurst, burstX, burstY);
    }

    reset(isBurst = false, burstX = width / 2, burstY = height / 2) {
      this.isBurst = isBurst;
      if (isBurst) {
        this.x = burstX + (Math.random() - 0.5) * 40;
        this.y = burstY + (Math.random() - 0.5) * 40;
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed - 2;
      } else {
        this.x = Math.random() * width;
        this.y = -20 - Math.random() * 80;
        this.vx = (Math.random() - 0.5) * 1.2;
        this.vy = 1.0 + Math.random() * 1.8;
      }

      this.size = 9 + Math.random() * 10;
      this.angle = Math.random() * Math.PI * 2;
      this.angularSpeed = (Math.random() - 0.5) * 0.035;
      this.wobble = Math.random() * Math.PI * 2;
      this.wobbleSpeed = 0.025 + Math.random() * 0.035;
      this.color = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
      this.flip = Math.random();
      this.flipSpeed = 0.015 + Math.random() * 0.025;
      this.opacity = 0.6 + Math.random() * 0.4;
      this.life = isBurst ? 100 : Infinity;
    }

    update() {
      if (this.isBurst) {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.96;
        this.vy += 0.08;
        this.life--;
      } else {
        this.wobble += this.wobbleSpeed;
        this.flip += this.flipSpeed;
        this.x += Math.sin(this.wobble) * 1.1 + this.vx;
        this.y += this.vy;
        this.angle += this.angularSpeed;

        if (this.y > height + 30 || this.x < -30 || this.x > width + 30) {
          this.reset();
        }
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      const scaleX = Math.cos(this.flip);
      ctx.scale(scaleX, 1);

      ctx.fillStyle = this.color.fill;
      ctx.strokeStyle = this.color.stroke;
      ctx.lineWidth = 0.8;

      ctx.beginPath();
      if (this.color.type === 'marigold') {
        ctx.moveTo(0, -this.size * 0.8);
        ctx.quadraticCurveTo(this.size * 0.6, -this.size * 0.4, this.size * 0.4, this.size * 0.6);
        ctx.quadraticCurveTo(0, this.size * 0.8, -this.size * 0.4, this.size * 0.6);
        ctx.quadraticCurveTo(-this.size * 0.6, -this.size * 0.4, 0, -this.size * 0.8);
      } else {
        ctx.moveTo(0, -this.size);
        ctx.bezierCurveTo(this.size * 0.7, -this.size * 0.5, this.size * 0.6, this.size * 0.6, 0, this.size);
        ctx.bezierCurveTo(-this.size * 0.6, this.size * 0.6, -this.size * 0.7, -this.size * 0.5, 0, -this.size);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  }

  for (let i = 0; i < PETAL_COUNT; i++) {
    petals.push(new Petal());
  }

  function renderPetals() {
    ctx.clearRect(0, 0, width, height);

    for (let i = petals.length - 1; i >= 0; i--) {
      const p = petals[i];
      p.update();
      p.draw();
      if (p.isBurst && p.life <= 0) {
        petals.splice(i, 1);
      }
    }

    requestAnimationFrame(renderPetals);
  }
  requestAnimationFrame(renderPetals);

  window.triggerPetalBurst = function (originX, originY) {
    const burstCount = 28;
    for (let i = 0; i < burstCount; i++) {
      petals.push(new Petal(true, originX || width / 2, originY || height / 2));
    }
  };
})();

// ============================================================================
// 6. GSAP SCROLLTRIGGER REVEAL SYSTEM
// ============================================================================
function initScrollReveal() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const revealElements = document.querySelectorAll('.gsap-reveal');
  revealElements.forEach((el) => {
    gsap.fromTo(
      el,
      {
        opacity: 0,
        y: 28,
        scale: 0.94,
        filter: 'blur(5px)',
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        duration: 0.85,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      }
    );
  });
}

// ============================================================================
// 7. EVENTS CAROUSEL LOGIC & SYNC
// ============================================================================
function setActiveCardUI(index) {
  if (index < 0 || index >= eventCards.length) return;
  activeEventIndex = index;

  eventCards.forEach((card, i) => {
    card.classList.toggle('active', i === index);
  });

  carouselDots.forEach((dot, i) => {
    const isActive = i === index;
    dot.classList.toggle('active', isActive);
    dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}

function centerCard(index, smooth = true) {
  if (index < 0 || index >= eventCards.length) return;
  const targetCard = eventCards[index];
  if (!targetCard || !carouselTrack) return;

  const trackRect = carouselTrack.getBoundingClientRect();
  const cardRect = targetCard.getBoundingClientRect();

  if (trackRect.width === 0) {
    requestAnimationFrame(() => centerCard(index, smooth));
    return;
  }

  const trackCenter = trackRect.left + (trackRect.width / 2);
  const cardCenter = cardRect.left + (cardRect.width / 2);
  const diff = cardCenter - trackCenter;
  const targetScrollLeft = carouselTrack.scrollLeft + diff;

  carouselTrack.scrollTo({
    left: Math.max(0, targetScrollLeft),
    behavior: smooth ? 'smooth' : 'auto'
  });
}

function goToCard(index, smooth = true) {
  setActiveCardUI(index);
  centerCard(index, smooth);
}

if (carouselPrevBtn) {
  carouselPrevBtn.addEventListener('click', () => {
    const newIdx = (activeEventIndex - 1 + eventCards.length) % eventCards.length;
    goToCard(newIdx, true);
  });
}

if (carouselNextBtn) {
  carouselNextBtn.addEventListener('click', () => {
    const newIdx = (activeEventIndex + 1) % eventCards.length;
    goToCard(newIdx, true);
  });
}

carouselDots.forEach((dot) => {
  dot.addEventListener('click', () => {
    const idx = parseInt(dot.getAttribute('data-index') || '0', 10);
    goToCard(idx, true);
  });
});

eventCards.forEach((card, idx) => {
  card.addEventListener('click', () => {
    goToCard(idx, true);
  });
});

let scrollSnapTimeout = null;
if (carouselTrack) {
  carouselTrack.addEventListener('scroll', () => {
    clearTimeout(scrollSnapTimeout);
    scrollSnapTimeout = setTimeout(() => {
      const trackRect = carouselTrack.getBoundingClientRect();
      const trackCenter = trackRect.left + (trackRect.width / 2);
      let closestIdx = 0;
      let minDistance = Infinity;

      eventCards.forEach((card, i) => {
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.left + (cardRect.width / 2);
        const dist = Math.abs(trackCenter - cardCenter);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = i;
        }
      });

      if (closestIdx !== activeEventIndex) {
        setActiveCardUI(closestIdx);
      }
    }, 60);
  }, { passive: true });
}

// Initialize carousel on load: First card is active and centered
function initCarousel() {
  setActiveCardUI(0);
  centerCard(0, false);
  setTimeout(() => centerCard(0, false), 80);
  setTimeout(() => centerCard(0, false), 300);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCarousel);
} else {
  initCarousel();
}

window.addEventListener('resize', () => {
  centerCard(activeEventIndex, false);
});

// ============================================================================
// 8. RSVP FORM & STYLIZED WHATSAPP INTEGRATION
// ============================================================================
const attendingRadios = document.querySelectorAll('input[name="attending"]');
const guestsRow = document.getElementById('rsvp-guests-row');
const eventsRow = document.getElementById('rsvp-events-row');
const guestSelect = document.getElementById('guest-count');
const eventCheckboxes = document.querySelectorAll('input[name="events"]');

function updateAttendanceState(isDeclined) {
  if (guestsRow) {
    guestsRow.classList.toggle('is-disabled', isDeclined);
  }
  if (eventsRow) {
    eventsRow.classList.toggle('is-disabled', isDeclined);
  }
  if (guestSelect) {
    guestSelect.disabled = isDeclined;
  }
  eventCheckboxes.forEach((cb) => {
    cb.disabled = isDeclined;
  });
}

attendingRadios.forEach((radio) => {
  radio.addEventListener('change', () => {
    const isDeclined = radio.value === "Sorry, can't make it" && radio.checked;
    updateAttendanceState(isDeclined);
  });
});

function showToast(message, duration = 3500) {
  if (!toastNotification || !toastMessage) return;
  toastMessage.textContent = message;
  toastNotification.classList.add('show');
  setTimeout(() => {
    toastNotification.classList.remove('show');
  }, duration);
}

if (rsvpForm) {
  rsvpForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('guest-name');
    const phoneInput = document.getElementById('guest-phone');
    const attendingRadio = document.querySelector('input[name="attending"]:checked');
    const guestsSelect = document.getElementById('guest-count');
    const checkedEvents = Array.from(document.querySelectorAll('input[name="events"]:checked'))
      .map((cb) => cb.value);

    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const attending = attendingRadio ? attendingRadio.value : "Yes, I'll be there";
    const isDeclined = attending === "Sorry, can't make it";
    const guests = guestsSelect ? guestsSelect.value : '2 Guests';
    const eventsList = checkedEvents.length > 0 ? checkedEvents.join(', ') : 'All Celebrations';

    if (!name || !phone) {
      showToast('⚠️ Please enter both your Name and Phone Number to RSVP.');
      if (!name && nameInput) nameInput.focus();
      else if (!phone && phoneInput) phoneInput.focus();
      return;
    }

    let attendanceBody = '';
    if (isDeclined) {
      attendanceBody = `💌 *Response:* Sorry, can't make it\n_Sending warmest congratulations and blessings!_ 🌸`;
    } else {
      attendanceBody = `💌 *Response:* Yes, I'll be there!\n👥 *Number of Guests:* ${guests}\n🎉 *Events:* ${eventsList}`;
    }

    const whatsappText =
`✨ *Tejas & Mitali Wedding — RSVP* ✨
━━━━━━━━━━━━━━━━━━━━━━
👤 *Guest:* ${name}
📞 *Phone:* ${phone}
${attendanceBody}
━━━━━━━━━━━━━━━━━━━━━━
_Sent with love via online wedding invitation_`;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const baseUrl = isMobile ? 'https://api.whatsapp.com/send' : 'https://web.whatsapp.com/send';
    const targetUrl = `${baseUrl}?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(whatsappText)}`;

    window.open(targetUrl, '_blank');
    showToast('💌 Opening WhatsApp to send your warm RSVP...');
  });
}


