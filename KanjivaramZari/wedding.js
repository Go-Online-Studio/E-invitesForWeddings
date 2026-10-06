/* ============================================================
   wedding.js - Aarav & Meera Wedding Invitation
   Vanilla JS, no build tools.
   ============================================================ */

/* ----------------------------------------------------------
   1. Viewport Height Fix (MUST RUN FIRST)
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
  if (!document.body.classList.contains('unlocked')) window.scrollTo(0, 0);
});
window.addEventListener('orientationchange', () => {
  setTimeout(setActualVh, 200);
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
const introLayer  = document.getElementById('intro-layer');
const introVideo  = document.getElementById('intro-video');
const tapScreen   = document.getElementById('tap-screen');
const btnTapBegin = document.getElementById('btn-tap-begin');
const mfab        = document.getElementById('mfab');
const scrollInd   = document.getElementById('scroll-indicator');
const bgAudio     = document.getElementById('bg-music');

let musicPlaying = false;
const WHATSAPP_NUMBER = '918200482291'; // ← change to real number

/* Preload video via Blob for Safari */
const VIDEO_SRC = 'https://res.cloudinary.com/dticzwbrv/video/upload/v1791273282/KanjivaramZariIntro_vcuf1n.mp4';
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
  introVideo.addEventListener('pause', () => {
    if (!introVideo.ended && introVideo.classList.contains('playing')) {
      introVideo.play().catch(() => {});
    }
  });
  introVideo.addEventListener('timeupdate', () => {
    if (!introVideo.duration) return;
    const remaining = introVideo.duration - introVideo.currentTime;
    if (remaining < 1.2 && introVideo.style.opacity !== '0') {
      introVideo.style.transition = 'opacity 1s ease';
      introVideo.style.opacity = '0';
    }
  });
  introVideo.addEventListener('ended', () => revealApp());
}

function revealApp() {
  if (introLayer) {
    introLayer.classList.add('fade-out');
    setTimeout(() => introLayer.classList.add('hidden'), 1600);
  }
  setTimeout(() => {
    document.body.classList.add('unlocked');
    if (mfab) mfab.classList.add('visible');
    if (scrollInd) scrollInd.classList.add('visible');
    initScrollReveal();
    initSwiperCarousel();
    startBgMusic();
  }, 800);
}

/* ----------------------------------------------------------
   5. Music FAB
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

window.addEventListener('scroll', () => {
  if (!scrollInd) return;
  if (window.scrollY > 60) scrollInd.classList.add('hidden-after-scroll');
  else scrollInd.classList.remove('hidden-after-scroll');
}, { passive: true });

/* ----------------------------------------------------------
   6. Scroll Reveal
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
  }, { threshold: 0.1 });
  items.forEach(el => {
    if (reduceMotion) el.classList.add('active');
    else observer.observe(el);
  });
}

/* ----------------------------------------------------------
   8. Swiper Carousel
   ---------------------------------------------------------- */
function initSwiperCarousel() {
  if (typeof Swiper === 'undefined') {
    setTimeout(initSwiperCarousel, 100);
    return;
  }
  
  const swiper = new Swiper('#event-carousel', {
    slidesPerView: 'auto',
    spaceBetween: 14,
    loop: true,
    autoplay: {
      delay: 3000,
      disableOnInteraction: true,
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    navigation: {
      nextEl: '.swiper-btn-next',
      prevEl: '.swiper-btn-prev',
    },
    keyboard: {
      enabled: true,
    },
  });

  // Resume autoplay after 5 seconds of inactivity
  let autoplayResumeTimeout;
  const resetAutoplay = () => {
    clearTimeout(autoplayResumeTimeout);
    autoplayResumeTimeout = setTimeout(() => {
      if (swiper && !swiper.autoplay.running) {
        swiper.autoplay.start();
      }
    }, 5000);
  };

  swiper.on('touchEnd', resetAutoplay);
  swiper.on('transitionEnd', resetAutoplay);

  const section = document.getElementById('sec-celebrations');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (section && !prefersReducedMotion) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          swiper.autoplay.start();
        } else {
          swiper.autoplay.stop();
        }
      });
    }, { threshold: 0.3 });
    io.observe(section);
  } else if (prefersReducedMotion) {
    swiper.autoplay.stop();
  }
}

/* ----------------------------------------------------------
   9. RSVP — Attendance Toggle
   ---------------------------------------------------------- */
let rsvpAttendance = 'yes';

window.toggleAttendance = function(val) {
  rsvpAttendance = val;
  const yesBtn    = document.getElementById('att-yes');
  const noBtn     = document.getElementById('att-no');
  const eventsGrp = document.getElementById('events-group');
  const guestsGrp = document.getElementById('guests-group');
  if (val === 'yes') {
    yesBtn && yesBtn.classList.add('active');
    noBtn  && noBtn.classList.remove('active');
    if (eventsGrp) {
      eventsGrp.classList.remove('disabled-group');
      eventsGrp.querySelectorAll('input').forEach(el => el.disabled = false);
    }
    if (guestsGrp) {
      guestsGrp.classList.remove('disabled-group');
      guestsGrp.querySelectorAll('input').forEach(el => el.disabled = false);
    }
  } else {
    noBtn  && noBtn.classList.add('active');
    yesBtn && yesBtn.classList.remove('active');
    if (eventsGrp) {
      eventsGrp.classList.add('disabled-group');
      eventsGrp.querySelectorAll('input').forEach(el => el.disabled = true);
    }
    if (guestsGrp) {
      guestsGrp.classList.add('disabled-group');
      guestsGrp.querySelectorAll('input').forEach(el => el.disabled = true);
    }
  }
};

/* ----------------------------------------------------------
   10. RSVP Error Tooltip Helpers
   ---------------------------------------------------------- */
window.showInputError = function(el, msg) {
  if (!el) return;
  // Clear any existing tooltips and errors
  document.querySelectorAll('.input-error-tooltip').forEach(tt => tt.remove());
  document.querySelectorAll('.form-control.error').forEach(input => input.classList.remove('error'));
  
  el.classList.add('error');
  
  const tooltip = document.createElement('div');
  tooltip.className = 'input-error-tooltip';
  tooltip.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg> ${msg}`;
  
  const parent = el.closest('.form-group');
  if (parent) {
    parent.appendChild(tooltip);
  }
  
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.focus();
  
  // Remove on input
  el.addEventListener('input', function onInput() {
    el.classList.remove('error');
    if (tooltip && tooltip.parentNode) tooltip.parentNode.removeChild(tooltip);
    el.removeEventListener('input', onInput);
  });
};

/* ----------------------------------------------------------
   11. RSVP — Send WhatsApp Message
   ---------------------------------------------------------- */
window.sendRSVP = function() {
  const nameInput  = document.getElementById('rsvp-name');
  const phoneInput = document.getElementById('rsvp-phone');
  const name  = nameInput  ? nameInput.value.trim()  : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';

  // Clear previous errors first
  document.querySelectorAll('.input-error-tooltip').forEach(tt => tt.remove());
  document.querySelectorAll('.form-control.error').forEach(input => input.classList.remove('error'));

  if (!name) {
    window.showInputError(nameInput, 'Please enter your name.');
    return;
  }
  if (!phone || phone.length < 7) {
    window.showInputError(phoneInput, 'Please enter a valid phone number.');
    return;
  }

  const attending = rsvpAttendance === 'yes';
  const divider   = '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501';

  let selectedEvents = '\u2014';
  if (attending) {
    const checked = Array.from(document.querySelectorAll('input[name="events"]:checked'));
    selectedEvents = checked.length > 0
      ? checked.map(cb => cb.value).join(', ')
      : 'None selected';
  }
  const guests = attending
    ? (document.getElementById('rsvp-guests') ? document.getElementById('rsvp-guests').value : '1')
    : '\u2014';

  let msg = '';
  msg += `\u2728 *Aarav & Meera \u2014 RSVP* \u2728\n`;
  msg += `${divider}\n\n`;
  msg += `\uD83D\uDC64 *Guest:* ${name}\n`;
  msg += `\uD83D\uDCF1 *Phone:* ${phone}\n\n`;
  msg += `\uD83D\uDC8C *Response:* ${attending ? '\uD83C\uDF89 Joyfully Attending' : '\uD83E\uDD7A Regretfully Unable to Attend'}\n`;
  if (attending) {
    msg += `\uD83D\uDC65 *Number of Guests:* ${guests}\n`;
    msg += `\uD83D\uDDD3\uFE0F *Events Attending:*\n   ${selectedEvents}\n`;
  }
  msg += `\n${divider}\n`;
  msg += `_Sent via the Wedding Invitation of_\n`;
  msg += `_Aarav & Meera \u2022 14 Feb 2027_\n`;
  msg += divider;

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const waBase   = isMobile ? 'https://api.whatsapp.com/send' : 'https://web.whatsapp.com/send';
  const waUrl    = `${waBase}?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank');

  /* Reset form */
  if (nameInput)  nameInput.value  = '';
  if (phoneInput) phoneInput.value = '';
  const guestsIn = document.getElementById('rsvp-guests');
  if (guestsIn) guestsIn.value = '1';
  document.querySelectorAll('input[name="events"]').forEach(cb => cb.checked = false);
};
