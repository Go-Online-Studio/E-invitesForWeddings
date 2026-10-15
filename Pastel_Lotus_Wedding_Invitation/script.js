/* ============================================================
   script.js - Aarav & Meera Wedding Invitation
   Vanilla JS, no frameworks
   ============================================================ */

/* ----------------------------------------------------------
   1. Viewport Height Fix (MUST run first)
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
  if (!document.body.classList.contains('unlocked')) {
    window.scrollTo(0, 0);
  }
});
window.addEventListener('orientationchange', function() {
  setTimeout(setActualVh, 200);
  if (!document.body.classList.contains('unlocked')) {
    window.scrollTo(0, 0);
  }
});

/* ----------------------------------------------------------
   2b. Lazy Load Backgrounds for Bottom Sections
   ---------------------------------------------------------- */
function initLazyBackgrounds() {
  var lazyBgs = document.querySelectorAll('.lazy-bg');
  if (!lazyBgs.length) return;

  if ('IntersectionObserver' in window) {
    var bgObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var bg = el.getAttribute('data-bg');
          if (bg) {
            el.style.backgroundImage = 'url("' + bg + '")';
          }
          el.classList.add('lazy-loaded');
          bgObserver.unobserve(el);
        }
      });
    }, { rootMargin: '350px 0px' });

    lazyBgs.forEach(function(el) { bgObserver.observe(el); });
  } else {
    lazyBgs.forEach(function(el) {
      var bg = el.getAttribute('data-bg');
      if (bg) el.style.backgroundImage = 'url("' + bg + '")';
      el.classList.add('lazy-loaded');
    });
  }
}
initLazyBackgrounds();

/* ----------------------------------------------------------
   3. Global Loader
   ---------------------------------------------------------- */
(function() {
  var loader = document.getElementById('global-loader');
  if (!loader) return;
  var done = false;
  function hideLoader() {
    if (done) return;
    done = true;
    loader.classList.add('hidden');
  }
  Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise(function(resolve) {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', resolve, { once: true });
    })
  ]).then(hideLoader).catch(hideLoader);
  setTimeout(hideLoader, 2500);
})();

/* ----------------------------------------------------------
   4. Intro Video Logic
   ---------------------------------------------------------- */
var introLayer = document.getElementById('intro-layer');
var introVideo = document.getElementById('intro-video');
var tapScreen = document.getElementById('tap-screen');
var btnTapBegin = document.getElementById('btn-tap-begin');
var mfab = document.getElementById('mfab');
var scrollInd = document.getElementById('scroll-indicator');
var bgAudio = document.getElementById('bg-music');

var musicPlaying = false;
var WHATSAPP_NUMBER = '919876543210'; // Change to real number
var guestCount = 1;
var rsvpAttendance = 'yes';

if (introVideo) {
  introVideo.load();
}

function safePlayVideo() {
  if (!introVideo) return;
  introVideo.muted = false;
  introVideo.volume = 1.0;
  if (bgAudio) { bgAudio.pause(); bgAudio.currentTime = 0; }
  var p = introVideo.play();
  if (p) p.catch(function() { introVideo.play().catch(function() {}); });
}

if (tapScreen) {
  tapScreen.addEventListener('click', function() {
    if (bgAudio) {
      bgAudio.muted = true;
      bgAudio.play().then(function() { bgAudio.pause(); }).catch(function() {});
      bgAudio.muted = false;
      bgAudio.currentTime = 0;
    }
    introVideo.classList.add('playing');
    safePlayVideo();
    tapScreen.style.opacity = '0';
    tapScreen.style.pointerEvents = 'none';
    setTimeout(function() { tapScreen.classList.add('hidden'); }, 1000);
  }, { once: true });
}

if (introVideo) {
  introVideo.addEventListener('pause', function() {
    if (!introVideo.ended && introVideo.classList.contains('playing')) {
      introVideo.play().catch(function() {});
    }
  });
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
  if (introLayer) {
    introLayer.classList.add('fade-out');
    setTimeout(function() { introLayer.classList.add('hidden'); }, 1600);
  }
  setTimeout(function() {
    document.body.classList.add('unlocked');
    if (mfab) mfab.classList.add('visible');
    if (scrollInd) scrollInd.classList.add('visible');
    initScrollReveal();
    startAllPetals();
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
  var iconOn = document.getElementById('icon-on');
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

window.toggleMusic = function() {
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

/* Scroll indicator hide */
window.addEventListener('scroll', function() {
  if (!scrollInd) return;
  if (window.scrollY > 60) {
    scrollInd.classList.add('hidden-after-scroll');
  } else {
    scrollInd.classList.remove('hidden-after-scroll');
  }
}, { passive: true });

/* ----------------------------------------------------------
   6. Scroll Reveal
   ---------------------------------------------------------- */
function initScrollReveal() {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items = document.querySelectorAll('.reveal');
  if (!items.length) return;
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  items.forEach(function(el) {
    if (reduceMotion) {
      el.classList.add('active');
    } else {
      observer.observe(el);
    }
  });
}

/* ----------------------------------------------------------
   7. Petal Canvas Animation (Single Canvas All Over Theme)
   ---------------------------------------------------------- */
var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

var themePetalsStarted = false;
function startAllPetals() {
  if (themePetalsStarted || reducedMotion) return;
  var canvasEl = document.getElementById('canvas-petals');
  if (!canvasEl) return;
  themePetalsStarted = true;

  var ctx = canvasEl.getContext('2d');
  var w = canvasEl.offsetWidth || 480;
  var h = window.visualViewport ? window.visualViewport.height : window.innerHeight;

  function updateCanvasDimensions() {
    w = canvasEl.offsetWidth || 480;
    h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    canvasEl.width = w;
    canvasEl.height = h;
  }
  updateCanvasDimensions();

  window.addEventListener('resize', updateCanvasDimensions);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateCanvasDimensions);
  }

  // Harmonic blend of wedding lotus pinks, warm marigold & rose tones
  var colors = [
    'rgba(255, 150, 165, 0.70)',
    'rgba(225, 80, 110, 0.65)',
    'rgba(255, 185, 195, 0.60)',
    'rgba(250, 180, 50, 0.70)',
    'rgba(230, 140, 30, 0.65)',
    'rgba(215, 60, 95, 0.60)'
  ];

  var petalCount = clamp(Math.round(w / 20), 16, 26);

  function Petal() {
    this.reset(true);
  }
  Petal.prototype.reset = function(init) {
    var margin = w * 0.05;
    this.x = margin + Math.random() * (w - margin * 2);
    this.y = init ? Math.random() * h : -35;
    this.targetOffset = (Math.random() - 0.5) * (w * 0.45);
    this.vy = 0.35 + Math.random() * 0.65;
    this.rot = Math.random() * Math.PI * 2;
    this.rs = (Math.random() - 0.5) * 0.035;
    this.scale = 0.14 + Math.random() * 0.18;
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.swaySpeed = 0.012 + Math.random() * 0.018;
    this.swayAmount = 0.6 + Math.random() * 1.4;
  };
  Petal.prototype.update = function() {
    this.y += this.vy;
    var centerX = w / 2;
    var targetX = centerX + this.targetOffset;
    this.x += (targetX - this.x) * 0.008;
    this.x += Math.sin(this.y * this.swaySpeed) * this.swayAmount;
    this.rot += this.rs;
    if (this.y > h + 45) this.reset(false);
  };
  Petal.prototype.draw = function() {
    var alpha = 1;
    var fadeStart = h * 0.82;
    if (this.y > fadeStart) {
      alpha = Math.max(0, 1 - (this.y - fadeStart) / (h - fadeStart));
    }
    ctx.globalAlpha = alpha;
    drawPetalShape(ctx, this.x, this.y, this.rot, this.scale, this.color);
    ctx.globalAlpha = 1;
  };

  var petals = [];
  for (var i = 0; i < petalCount; i++) {
    petals.push(new Petal());
  }

  function loop() {
    ctx.clearRect(0, 0, w, h);
    for (var i = 0; i < petals.length; i++) {
      petals[i].update();
      petals[i].draw();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

/* ----------------------------------------------------------
   8. RSVP — Guest Counter
   ---------------------------------------------------------- */
window.changeGuests = function(delta) {
  guestCount = Math.max(1, Math.min(20, guestCount + delta));
  var el = document.getElementById('guest-count');
  if (el) el.textContent = guestCount;
};

/* ----------------------------------------------------------
   9. RSVP — Attendance Toggle
   ---------------------------------------------------------- */
window.toggleAttendance = function(val) {
  rsvpAttendance = val;
  var yesBtn = document.getElementById('att-yes');
  var noBtn = document.getElementById('att-no');
  var maybeBtn = document.getElementById('att-maybe');
  var eventsGrp = document.getElementById('events-group');
  var guestsGrp = document.getElementById('guests-group');
  [yesBtn, noBtn, maybeBtn].forEach(function(b) { if (b) b.classList.remove('active'); });
  var activeBtn = document.getElementById('att-' + val);
  if (activeBtn) activeBtn.classList.add('active');
  var showGroups = val === 'yes' || val === 'maybe';
  if (eventsGrp) eventsGrp.style.display = showGroups ? 'block' : 'none';
  if (guestsGrp) guestsGrp.style.display = showGroups ? 'block' : 'none';
};

/* ----------------------------------------------------------
   10. Pill toggles
   ---------------------------------------------------------- */
window.togglePill = function(el) {
  el.classList.toggle('active');
};

window.toggleSinglePill = function(el, groupId) {
  var group = document.getElementById(groupId);
  if (!group) return;
  var chips = group.querySelectorAll('.pill-chip');
  chips.forEach(function(c) { c.classList.remove('active'); });
  el.classList.add('active');
};

/* ----------------------------------------------------------
   11. Tooltip & Input Error Helpers (Zero extra form space)
   ---------------------------------------------------------- */
window.clearAllFieldErrors = function() {
  var wraps = document.querySelectorAll('.input-wrap.is-invalid, .textarea-wrap.is-invalid');
  wraps.forEach(function(wrap) {
    window.clearFieldError(wrap);
  });
};

window.clearFieldError = function(target) {
  var wrap = null;
  if (typeof target === 'string') {
    var el = document.getElementById(target);
    wrap = el ? el.closest('.input-wrap, .textarea-wrap') : null;
  } else if (target && target.nodeType) {
    wrap = target.classList.contains('input-wrap') || target.classList.contains('textarea-wrap')
      ? target
      : target.closest('.input-wrap, .textarea-wrap');
  }
  if (!wrap) return;

  if (wrap._errorTimer) {
    clearTimeout(wrap._errorTimer);
    wrap._errorTimer = null;
  }
  wrap.classList.remove('is-invalid');
  var input = wrap.querySelector('.form-control, .form-textarea');
  if (input) input.classList.remove('is-invalid');

  var tooltip = wrap.querySelector('.field-error-tooltip');
  if (tooltip) {
    tooltip.classList.remove('show');
    setTimeout(function() {
      if (tooltip.parentNode) tooltip.parentNode.removeChild(tooltip);
    }, 280);
  }
};

window.showFieldError = function(inputId, message) {
  var inputEl = document.getElementById(inputId);
  if (!inputEl) return;
  var wrap = inputEl.closest('.input-wrap, .textarea-wrap');
  if (!wrap) return;

  window.clearAllFieldErrors();

  wrap.classList.add('is-invalid');
  inputEl.classList.add('is-invalid');

  // Trigger shake animation reflow
  wrap.style.animation = 'none';
  // eslint-disable-next-line no-unused-expressions
  wrap.offsetHeight;
  wrap.style.animation = '';

  var tooltip = wrap.querySelector('.field-error-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'field-error-tooltip';
    tooltip.setAttribute('role', 'alert');
    wrap.appendChild(tooltip);
  }

  tooltip.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg><span>' + message + '</span>';

  requestAnimationFrame(function() {
    tooltip.classList.add('show');
  });

  inputEl.focus();

  // Scroll into view if needed
  wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Auto fade after 3.5 seconds
  if (wrap._errorTimer) clearTimeout(wrap._errorTimer);
  wrap._errorTimer = setTimeout(function() {
    window.clearFieldError(wrap);
  }, 3500);

  // Clear when user starts typing
  var onUserInput = function() {
    window.clearFieldError(wrap);
    inputEl.removeEventListener('input', onUserInput);
  };
  inputEl.addEventListener('input', onUserInput);
};

// Backward-compatible aliases
window.showRsvpAlert = function(msg) {
  var lower = (msg || '').toLowerCase();
  if (lower.indexOf('phone') !== -1) {
    window.showFieldError('rsvp-phone', 'Please enter a valid phone number');
  } else {
    window.showFieldError('rsvp-name', 'Please enter your full name');
  }
};

window.closeRsvpAlert = function() {
  window.clearAllFieldErrors();
};

/* ----------------------------------------------------------
   12. RSVP — WhatsApp
   ---------------------------------------------------------- */
window.sendRSVP = function() {
  var nameInput = document.getElementById('rsvp-name');
  var phoneInput = document.getElementById('rsvp-phone');
  var name = nameInput ? nameInput.value.trim() : '';
  var phone = phoneInput ? phoneInput.value.trim() : '';

  if (!name) {
    window.showFieldError('rsvp-name', 'Please enter your full name');
    return;
  }
  if (!phone || phone.length < 7) {
    window.showFieldError('rsvp-phone', 'Please enter a valid phone number');
    return;
  }
  window.clearAllFieldErrors();

  var attending = rsvpAttendance === 'yes' || rsvpAttendance === 'maybe';
  var divider = '━━━━━━━━━━━━━━━━━━━━━━';

  var events = '';
  if (attending) {
    var eventChips = document.querySelectorAll('#events-group .pill-chip.active');
    var eventList = [];
    eventChips.forEach(function(c) { eventList.push(c.getAttribute('data-event') || c.textContent.trim()); });
    events = eventList.join(', ') || 'None selected';
  }

  var emotional = '';
  var emotionalChip = document.querySelector('#emotional-group .pill-chip.active');
  if (emotionalChip) emotional = emotionalChip.getAttribute('data-emotional') || emotionalChip.textContent.trim();

  var comingFor = [];
  var comingChips = document.querySelectorAll('#coming-for-group .pill-chip.active');
  comingChips.forEach(function(c) { comingFor.push(c.getAttribute('data-comingfor') || c.textContent.trim()); });

  var blessing = '';
  var blessingEl = document.getElementById('rsvp-blessing');
  if (blessingEl) blessing = blessingEl.value.trim();

  var attendanceLabel = rsvpAttendance === 'yes' ? 'Yes, joyfully attending! 🎉' :
                        rsvpAttendance === 'maybe' ? 'Maybe, will confirm soon 🤞' :
                        'Regretfully unable to attend 🥺';

  var msg = '';
  msg += '🌸 *Aarav & Meera — Wedding RSVP* 🌸\n';
  msg += divider + '\n\n';
  msg += '👤 *Guest Name:* ' + name + '\n';
  msg += '📱 *Phone:* ' + phone + '\n\n';
  msg += '💌 *Attending:* ' + attendanceLabel + '\n';
  if (attending) {
    msg += '👥 *Number of Guests:* ' + guestCount + '\n';
    msg += '🗓️ *Events Attending:* ' + events + '\n';
    if (emotional) msg += '😢 *Gets Emotional First:* ' + emotional + '\n';
    if (comingFor.length) msg += '✨ *Coming For:* ' + comingFor.join(', ') + '\n';
  }
  if (blessing) {
    msg += '\n💝 *Blessing:*\n' + blessing + '\n';
  }
  msg += '\n' + divider + '\n';
  msg += '_Sent via Wedding Invitation of_\n';
  msg += '_Aarav & Meera • 14 Feb 2027 • Udaipur_\n';
  msg += divider;

  var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  var waBase = isMobile ? 'https://api.whatsapp.com/send' : 'https://web.whatsapp.com/send';
  var waUrl = waBase + '?phone=' + WHATSAPP_NUMBER + '&text=' + encodeURIComponent(msg);

  window.open(waUrl, '_blank');

  // Reset form
  if (nameInput) nameInput.value = '';
  if (phoneInput) phoneInput.value = '';
  guestCount = 1;
  var gc = document.getElementById('guest-count');
  if (gc) gc.textContent = '1';
  if (blessingEl) blessingEl.value = '';
};

/* ----------------------------------------------------------
   13. Add to Calendar
   ---------------------------------------------------------- */
window.addToCalendar = function() {
  var icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    'DTSTART:20270214T060000Z',
    'DTEND:20270214T180000Z',
    'SUMMARY:Aarav & Meera Wedding',
    'DESCRIPTION:The wedding of Aarav Gupta & Meera Sharma',
    'LOCATION:The Leela Palace Udaipur, Lake Pichola, Udaipur, Rajasthan 313001',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\n');
  var blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'AaravMeera_Wedding_2027.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
