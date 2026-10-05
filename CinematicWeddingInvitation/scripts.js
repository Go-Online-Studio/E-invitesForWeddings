/* ============================================================
   Cinematic Wedding Invitation — JS Engine
   Pure Vanilla JS + GSAP / ScrollTrigger
   ============================================================ */

/* ----------------------------------------------------------
   1. Dynamic Viewport Height Fix
   ---------------------------------------------------------- */
function setActualVh() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', vh + 'px');
}
setActualVh();

/* ----------------------------------------------------------
   2. Scroll Restoration
   ---------------------------------------------------------- */
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

window.addEventListener('beforeunload', function() { window.scrollTo(0, 0); });
window.addEventListener('resize', function() {
  setActualVh();
  if (!document.body.classList.contains('unlocked')) window.scrollTo(0, 0);
});
window.addEventListener('orientationchange', function() {
  setTimeout(setActualVh, 200);
  if (!document.body.classList.contains('unlocked')) window.scrollTo(0, 0);
});

/* ----------------------------------------------------------
   3. Minimal Fast Loader (Intro Video & Section 1 assets only, max 3s)
   ---------------------------------------------------------- */
(function () {
  var loader = document.getElementById('global-loader');
  if (!loader) return;
  var done = false;

  function hideLoader() {
    if (done) return;
    done = true;
    loader.classList.add('hidden');
    setTimeout(function() {
      if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
    }, 500);
  }

  function whenImageLoaded(img) {
    if (!img) return Promise.resolve();
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise(function(resolve) {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    });
  }

  function whenVideoReady(vid) {
    if (!vid) return Promise.resolve();
    if (vid.readyState >= 2) return Promise.resolve();
    return new Promise(function(resolve) {
      var resolved = false;
      function onReady() {
        if (resolved) return;
        resolved = true;
        resolve();
      }
      vid.addEventListener('loadeddata', onReady, { once: true });
      vid.addEventListener('canplay', onReady, { once: true });
      vid.addEventListener('error', onReady, { once: true });
      // Video safety fallback
      setTimeout(onReady, 2500);
    });
  }

  // ONLY wait for Section 1 assets, Intro Video, and critical fonts
  var secIntroImages = Array.from(document.querySelectorAll('#sec-intro img'));
  var introVid = document.getElementById('intro-video');

  var criticalTasks = secIntroImages.map(whenImageLoaded);
  if (introVid) criticalTasks.push(whenVideoReady(introVid));
  if (document.fonts) criticalTasks.push(document.fonts.ready);

  Promise.all(criticalTasks).then(hideLoader).catch(hideLoader);

  // Maximum loader time strictly capped at 3 seconds
  setTimeout(hideLoader, 3000);
})();

/* ----------------------------------------------------------
   4. Intro Video Logic
   ---------------------------------------------------------- */
var introLayer = document.getElementById('intro-layer');
var introVideo = document.getElementById('intro-video');
var tapScreen  = document.getElementById('tap-screen');
var btnTapBegin = document.getElementById('btn-tap-begin');
var mfab       = document.getElementById('mfab');
var scrollInd  = document.getElementById('scroll-indicator');
var bgAudio    = document.getElementById('bg-music');

var musicPlaying = false;
var WHATSAPP_NUMBER = '918200482291'; // ← change to real number

if (introVideo) introVideo.load();

function safePlayVideo() {
  if (!introVideo) return;
  introVideo.muted = false;
  introVideo.volume = 1.0;
  if (bgAudio) { bgAudio.pause(); bgAudio.currentTime = 0; }
  var p = introVideo.play();
  if (p) p.catch(function() { introVideo.play().catch(function(){}); });
}

if (tapScreen) {
  tapScreen.addEventListener('click', function() {
    // Unlock audio context on user gesture
    if (bgAudio) {
      bgAudio.muted = true;
      bgAudio.play().then(function(){ bgAudio.pause(); }).catch(function(){});
      bgAudio.muted = false;
      bgAudio.currentTime = 0;
    }

    introVideo.classList.add('playing');
    safePlayVideo();

    if (tapScreen) {
      tapScreen.style.opacity = '0';
      tapScreen.style.pointerEvents = 'none';
      setTimeout(function() { tapScreen.classList.add('hidden'); }, 1000);
    }
  }, { once: true });
}

// Block pause attempts — video must play to end
if (introVideo) {
  introVideo.addEventListener('pause', function() {
    if (!introVideo.ended && introVideo.classList.contains('playing')) {
      introVideo.play().catch(function(){});
    }
  });

  // Fade out near end
  introVideo.addEventListener('timeupdate', function() {
    if (!introVideo.duration) return;
    var remaining = introVideo.duration - introVideo.currentTime;
    if (remaining < 1.2 && introVideo.style.opacity !== '0') {
      introVideo.style.transition = 'opacity 1s ease';
      introVideo.style.opacity = '0';
    }
  });

  introVideo.addEventListener('ended', function() {
    revealApp();
  });
}

function revealApp() {
  // Fade out intro layer
  if (introLayer) {
    introLayer.classList.add('fade-out');
    setTimeout(function() { introLayer.classList.add('hidden'); }, 1600);
  }

  // Unlock scroll and init animations
  setTimeout(function() {
    document.body.classList.add('unlocked');
    if (mfab) mfab.classList.add('visible');
    if (scrollInd) scrollInd.classList.add('visible');
    initGSAPAnimations();
    startBgMusic();
  }, 800);
}

/* ----------------------------------------------------------
   5. Music FAB
   ---------------------------------------------------------- */
function startBgMusic() {
  if (!bgAudio) return;
  bgAudio.volume = 0.45;
  bgAudio.play().then(function() {
    musicPlaying = true;
    updateFabIcon(true);
  }).catch(function() {
    musicPlaying = false;
    updateFabIcon(false);
  });
}

function updateFabIcon(isOn) {
  var iconOn  = document.getElementById('icon-on');
  var iconOff = document.getElementById('icon-off');
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
    bgAudio.play().then(function() {
      musicPlaying = true;
      updateFabIcon(true);
    }).catch(function() { musicPlaying = false; updateFabIcon(false); });
  }
};

/* Scroll-down indicator hide after scroll */
window.addEventListener('scroll', function() {
  if (!scrollInd) return;
  if (window.scrollY > 60) {
    scrollInd.classList.add('hidden-after-scroll');
  } else {
    scrollInd.classList.remove('hidden-after-scroll');
  }
}, { passive: true });

/* ----------------------------------------------------------
   6. GSAP Animations Master Init
   ---------------------------------------------------------- */
function initGSAPAnimations() {
  gsap.registerPlugin(ScrollTrigger);

  // ---- TEXT REVEAL ANIMATIONS (all .reveal elements) ----
  document.querySelectorAll('.reveal').forEach(function(el) {
    gsap.fromTo(el,
      { opacity: 0, y: 35, scale: 0.92, filter: 'blur(6px)' },
      {
        opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none',
          once: true
        }
      }
    );
  });

  // ---- SECTION 1: HAND MERGE ANIMATION ----
  var girlHand = document.getElementById('girl-hand');
  var groomHand = document.getElementById('groom-hand');

  if (girlHand && groomHand) {
    var handTL = gsap.timeline({
      scrollTrigger: {
        trigger: '#sec-intro',
        start: 'top 50%',
        once: true
      }
    });

    handTL
      .to(girlHand, {
        left: '0%',
        opacity: 1,
        duration: 2,
        ease: 'power2.out'
      }, 0)
      .to(groomHand, {
        right: '0%',
        opacity: 1,
        duration: 2,
        ease: 'power2.out'
      }, 0);
  }

  // ---- SECTION 2: HALDI HEAD SWAY ANIMATION (both heads synchronised) ----
  var haldiBackHead  = document.getElementById('haldi-back-head');
  var haldiFrontHead = document.getElementById('haldi-front-head');

  if (haldiBackHead && haldiFrontHead) {
    // Single shared tween drives both wrappers in perfect lock-step
    var haldiHeadTween = gsap.to([haldiBackHead, haldiFrontHead], {
      rotation: 5,
      duration: 1.8,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      transformOrigin: 'bottom center'
    });
  }

  // ---- SECTION 3: MEHNDI 3D SWING ANIMATION ----
  var swingCouple = document.getElementById('swing-couple');
  if (swingCouple) {
    gsap.set(swingCouple.parentElement, { perspective: 800 });
    gsap.to(swingCouple, {
      rotationX: 15,
      rotationZ: 0,
      rotationY: 0,
      duration: 2.5,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      transformOrigin: 'top center'
    });
  }

  // ---- SECTION 4: SANGEET ANIMATIONS ----

  // Mala Girl Hand - collecting flowers motion
  var malaHand = document.getElementById('mala-hand');
  if (malaHand) {

    var malaTL = gsap.timeline({ repeat: -1 });
    malaTL
      // 1. Reach down toward the flowers
      .to(malaHand, {
        rotation: -90,
        duration: 1.1,
        ease: 'sine.inOut'
      })
      // 2. Brief pause while picking a flower
      .to(malaHand, {
        rotation: -11,
        duration: 1,
        ease: 'sine.inOut'
      })
      // 3. Bring hand up to string the flower into the mala
      .to(malaHand, {
        rotation: 8,
        duration: 1.2,
        ease: 'power1.inOut'
      })
      // 4. Subtle threading motion at the top
      .to(malaHand, {
        rotation: 4,
        duration: 0.35,
        ease: 'sine.inOut'
      })
      .to(malaHand, {
        rotation: 8,
        duration: 0.35,
        ease: 'sine.inOut'
      })
      .to(malaHand, {
        rotation: 0,
        duration: 1,
        ease: 'sine.inOut'
      });
  }

  // Rangoli Girl Hand - rangoli making motion
  var rangoliHand = document.getElementById('rangoli-hand');
  if (rangoliHand) {
    gsap.to(rangoliHand, {
      rotation: -5,
      duration: 2,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      transformOrigin: 'top left'
    });
  }

  // ---- SECTION 5: WEDDING DAY SCROLL ANIMATION ----
  var weddingCouple = document.getElementById('wedding-couple');
  if (weddingCouple) {
    gsap.to(weddingCouple, {
      y: '-22vh',         // Move up 25% of viewport height
      scale: 0.4,         // Scale down less drastically
      ease: 'none',
      scrollTrigger: {
        trigger: '#sec-wedding',
        start: 'top 50%',
        end: 'bottom 40%',
        toggleActions: "play none none reset", 
        scrub: true
      }
    });
  }
}

/* ----------------------------------------------------------
   7. Countdown Timer
   ---------------------------------------------------------- */
(function initCountdown() {
  var target = new Date('Dec 12, 2026 20:00:00').getTime();

  var dEl = document.getElementById('cd-days');
  var hEl = document.getElementById('cd-hours');
  var mEl = document.getElementById('cd-mins');
  var sEl = document.getElementById('cd-secs');
  if (!dEl) return;

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    var dist = target - Date.now();
    if (dist < 0) { clearInterval(tid); return; }
    dEl.textContent = pad(Math.floor(dist / 86400000));
    hEl.textContent = pad(Math.floor((dist % 86400000) / 3600000));
    mEl.textContent = pad(Math.floor((dist % 3600000) / 60000));
    sEl.textContent = pad(Math.floor((dist % 60000) / 1000));
  }

  tick();
  var tid = setInterval(tick, 1000);
})();

/* ----------------------------------------------------------
   8. RSVP — Toggle Attendance
   ---------------------------------------------------------- */
var rsvpAttendance = 'yes';

window.toggleAttendance = function (val) {
  rsvpAttendance = val;
  var yesBtn    = document.querySelector('.att-btn.yes');
  var noBtn     = document.querySelector('.att-btn.no');
  var eventsGrp = document.getElementById('events-group');

  if (val === 'yes') {
    yesBtn && yesBtn.classList.add('active');
    noBtn  && noBtn.classList.remove('active');
    if (eventsGrp) eventsGrp.style.display = 'block';
  } else {
    noBtn  && noBtn.classList.add('active');
    yesBtn && yesBtn.classList.remove('active');
    if (eventsGrp) eventsGrp.style.display = 'none';
  }
};

/* ----------------------------------------------------------
   9. RSVP — Alert helpers
   ---------------------------------------------------------- */
window.showRsvpAlert = function (msg) {
  var box  = document.getElementById('rsvp-alert');
  var text = document.getElementById('rsvp-alert-text');
  if (!box || !text) return;
  text.textContent = msg;
  box.classList.add('show');
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

window.closeRsvpAlert = function () {
  var box = document.getElementById('rsvp-alert');
  if (box) box.classList.remove('show');
};

/* ----------------------------------------------------------
   10. RSVP — Send WhatsApp Message
   ---------------------------------------------------------- */
window.sendRSVP = function () {
  var nameInput  = document.getElementById('rsvp-name');
  var phoneInput = document.getElementById('rsvp-phone');
  var name  = nameInput  ? nameInput.value.trim()  : '';
  var phone = phoneInput ? phoneInput.value.trim() : '';

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

  var divider  = '━━━━━━━━━━━━━━━━━━━━━━';
  var attending = rsvpAttendance === 'yes';
  var events   = attending
    ? Array.from(document.querySelectorAll('.event-chip.active')).map(function(c) { return c.textContent; }).join(', ') || 'None selected'
    : '—';

  var msg = '';
  msg += '✨ *Rohan & Priya — RSVP* ✨\n';
  msg += divider + '\n\n';
  msg += '👤 *Guest:* ' + name + '\n';
  msg += '📱 *Phone:* ' + phone + '\n\n';
  msg += '💌 *Response:* ' + (attending ? '🎉 Joyfully Attending' : '🥺 Regretfully Unable to Attend') + '\n';
  if (attending) {
    msg += '🗓️ *Events Attending:*\n   ' + events + '\n';
  }
  msg += '\n' + divider + '\n';
  msg += '_Sent via the Wedding Invitation of_\n';
  msg += '_Rohan & Priya • 12 Dec 2026_\n';
  msg += divider;

  var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  var waBase   = isMobile ? 'https://api.whatsapp.com/send' : 'https://web.whatsapp.com/send';
  var waUrl    = waBase + '?phone=' + WHATSAPP_NUMBER + '&text=' + encodeURIComponent(msg);

  window.open(waUrl, '_blank');

  // Reset form
  if (nameInput)  nameInput.value  = '';
  if (phoneInput) phoneInput.value = '';
};
/* ----------------------------------------------------------
   11. Petal Animations (Canvas)
   ---------------------------------------------------------- */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

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

function startPetalCanvas({ canvasId, colors, count, speedMin = 0.15, speedMax = 0.6, sizeMin = 0.15, sizeMax = 0.35 }) {
  const canvasEl = document.getElementById(canvasId);
  if (!canvasEl || reducedMotion) return;

  const ctx = canvasEl.getContext('2d');
  let vvh = (window.visualViewport ? window.visualViewport.height : window.innerHeight);
  let w = canvasEl.offsetWidth || window.innerWidth;
  let h = vvh;
  canvasEl.width  = w;
  canvasEl.height = h;

  const petalCount = clamp(count || 18, 10, 40);

  class Petal {
    constructor() { this.reset(true); }
    reset(init) {
      const margin = w * 0.1;
      this.x = margin + Math.random() * (w - margin * 2);
      this.y = init ? Math.random() * h - h : -30;
      this.targetOffset = (Math.random() - 0.5) * (w * 0.4); 
      this.vy = speedMin + Math.random() * (speedMax - speedMin);
      this.rot = Math.random() * Math.PI * 2;
      this.rs = (Math.random() - 0.5) * 0.02; // Slower rotation
      this.scale = sizeMin + Math.random() * (sizeMax - sizeMin);
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.swaySpeed = 0.005 + Math.random() * 0.015; // Slower sway
      this.swayAmount = 0.5 + Math.random() * 1.5;
    }
    update() {
      this.y += this.vy;
      
      const centerX = w / 2;
      const targetX = centerX + this.targetOffset;
      this.x += (targetX - this.x) * 0.01;
      
      this.x += Math.sin(this.y * this.swaySpeed) * this.swayAmount;
      this.rot += this.rs;
      
      if (this.y > h + 40) this.reset(false);
    }
    draw() {
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

  function loop() {
    ctx.clearRect(0, 0, w, h);
    petals.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }
  loop();

  window.addEventListener('resize', () => {
    w = canvasEl.offsetWidth || window.innerWidth;
    vvh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    h = vvh;
    canvasEl.width  = w;
    canvasEl.height = h;
  });
}

// Initialize petals for sections
startPetalCanvas({ canvasId: 'canvas-haldi', colors: ['rgba(255, 204, 0, 0.9)', 'rgba(255, 153, 0, 0.9)', 'rgba(255, 230, 0, 0.9)'], count: 25 }); // Yellow/Orange
startPetalCanvas({ canvasId: 'canvas-mehndi', colors: ['rgba(34, 139, 34, 0.9)', 'rgba(50, 205, 50, 0.9)', 'rgba(0, 128, 0, 0.9)'], count: 25 }); // Green shades
startPetalCanvas({ canvasId: 'canvas-sangeet', colors: ['rgba(128, 0, 128, 0.9)', 'rgba(218, 112, 214, 0.9)', 'rgba(148, 0, 211, 0.9)'], count: 25 }); // Purple/Pink
startPetalCanvas({ canvasId: 'canvas-wedding', colors: ['rgba(255, 0, 0, 0.9)', 'rgba(220, 20, 60, 0.9)', 'rgba(178, 34, 34, 0.9)', 'rgba(255, 105, 180, 0.9)', 'rgba(255, 182, 193, 0.9)'], count: 25 }); // Red & Pink shades