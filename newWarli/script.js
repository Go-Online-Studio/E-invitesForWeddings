// Set actual VH for mobile
function setActualVh() {
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
setActualVh();
window.addEventListener('resize', setActualVh);

// Scroll restoration
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

document.addEventListener("DOMContentLoaded", () => {
  const introLayer = document.getElementById("intro-layer");
  const introVideo = document.getElementById("intro-video");
  const tapScreen = document.querySelector(".intro-tap-screen");
  const body = document.body;
  const musicFab = document.getElementById("music-fab");
  const scrollIndicator = document.getElementById("scroll-indicator");
  const bgMusic = document.getElementById("bg-music");
  const fabIconPath = document.getElementById("fab-icon-path");

  // Preload video buffer immediately
  if (introVideo) {
    introVideo.load();
  }

  // Music state and FAB control
  let isPlaying = false;

  function updateFabIcon(isOn) {
    if (!fabIconPath) return;
    if (isOn) {
      fabIconPath.setAttribute("d", "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z");
    } else {
      fabIconPath.setAttribute("d", "M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z");
    }
  }

  function startBgMusic() {
    if (!bgMusic) return;
    bgMusic.volume = 0.5;
    bgMusic.play().then(() => {
      isPlaying = true;
      updateFabIcon(true);
    }).catch(err => {
      console.warn("Background music play error:", err);
      isPlaying = false;
      updateFabIcon(false);
    });
  }

  // Music FAB Click Listener
  if (musicFab) {
    musicFab.addEventListener("click", () => {
      if (!bgMusic) return;
      if (isPlaying) {
        bgMusic.pause();
        isPlaying = false;
        updateFabIcon(false);
      } else {
        bgMusic.play().then(() => {
          isPlaying = true;
          updateFabIcon(true);
        }).catch(err => {
          console.warn("Music play error:", err);
          isPlaying = false;
          updateFabIcon(false);
        });
      }
    });
  }

  // Tap to begin
  let introFinished = false;

  function finishIntro() {
    if (introFinished) return;
    introFinished = true;

    if (introLayer) {
      introLayer.classList.add("fade-out");
      setTimeout(() => {
        introLayer.remove();
        body.classList.add("unlocked");
        if (musicFab) musicFab.classList.add("visible");
        if (scrollIndicator) scrollIndicator.classList.add("visible");
        initScrollReveal();
        // Start background music AFTER video finishes
        startBgMusic();
      }, 1500);
    } else {
      body.classList.add("unlocked");
      if (musicFab) musicFab.classList.add("visible");
      if (scrollIndicator) scrollIndicator.classList.add("visible");
      initScrollReveal();
      startBgMusic();
    }
  }

  if (tapScreen) {
    tapScreen.addEventListener("click", () => {
      tapScreen.style.opacity = '0';
      setTimeout(() => tapScreen.remove(), 1000);

      // Unlock/prime audio context on this user gesture for subsequent bgMusic playback
      if (bgMusic) {
        bgMusic.muted = true;
        bgMusic.play().then(() => {
          bgMusic.pause();
          bgMusic.currentTime = 0;
          bgMusic.muted = false;
        }).catch(() => {
          bgMusic.muted = false;
        });
      }

      // Safety timeout: if video takes too long (e.g. slow connection), unlock after 12s
      const safetyTimeout = setTimeout(finishIntro, 12000);
      
      if (introVideo) {
        // Video is unmuted with full audio
        introVideo.muted = false;
        introVideo.volume = 1.0;

        introVideo.addEventListener("ended", () => {
          clearTimeout(safetyTimeout);
          finishIntro();
        }, { once: true });

        introVideo.addEventListener("error", () => {
          clearTimeout(safetyTimeout);
          finishIntro();
        }, { once: true });

        // Prevent pause during play
        introVideo.addEventListener("pause", () => {
          if (!introVideo.ended && !introFinished) {
            introVideo.play().catch(() => {});
          }
        });

        introVideo.play().catch(e => {
          console.warn("Video unmuted play restricted, falling back to muted or finishing:", e);
          // Fallback if browser blocks unmuted play on mobile
          introVideo.muted = true;
          introVideo.play().catch(() => {
            clearTimeout(safetyTimeout);
            finishIntro();
          });
        });
      } else {
        clearTimeout(safetyTimeout);
        setTimeout(finishIntro, 1000);
      }
    }, { once: true });
  }

  // Scroll reveal with unobserve & reduced motion support
  function initScrollReveal() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const reveals = document.querySelectorAll(".reveal");
    if (!reveals.length) return;

    if (reduceMotion) {
      reveals.forEach(el => el.classList.add("active"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1
    });

    reveals.forEach(el => observer.observe(el));
  }

  // WhatsApp RSVP Form
  const rsvpForm = document.getElementById("rsvp-form");
  if (rsvpForm) {
    rsvpForm.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const name = document.getElementById("rsvp-name").value.trim();
      const phone = document.getElementById("rsvp-phone").value.trim();
      const attending = document.querySelector('input[name="attending"]:checked');
      const guests = document.getElementById("rsvp-guests").innerText;
      
      if (!name || !phone) {
        alert("Please enter your full name and phone number.");
        return;
      }
      
      const events = [];
      document.querySelectorAll('input[name="events"]:checked').forEach(cb => {
        events.push(cb.value);
      });

      const isAttending = attending && attending.value === 'yes';

      let msg = `*Wedding RSVP* 💍\n━━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `*Name:* ${name}\n`;
      msg += `*Phone:* ${phone}\n`;
      msg += `*Attending:* ${isAttending ? 'Yes ✅' : 'No ❌'}\n`;
      
      if (isAttending) {
        msg += `*Guests:* ${guests}\n`;
        if (events.length > 0) {
          msg += `*Events:* ${events.join(", ")}\n`;
        }
      }
      msg += `━━━━━━━━━━━━━━━━━━━━━━\nLooking forward to it! ✨`;
      
      const encodedMsg = encodeURIComponent(msg);
      // Determine if mobile or desktop
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const whatsappUrl = isMobile ? `https://api.whatsapp.com/send?phone=919876543210&text=${encodedMsg}` : `https://web.whatsapp.com/send?phone=919876543210&text=${encodedMsg}`;
      
      window.open(whatsappUrl, '_blank');
    });
  }

  // RSVP Attending Buttons UI Toggle
  const attendingBtns = document.querySelectorAll('.attending-btn');
  attendingBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      attendingBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Guest counter logic
  const btnMinus = document.getElementById("guest-minus");
  const btnPlus = document.getElementById("guest-plus");
  const guestCount = document.getElementById("rsvp-guests");
  if (btnMinus && btnPlus && guestCount) {
    let count = 1;
    btnMinus.addEventListener("click", () => {
      if (count > 1) {
        count--;
        guestCount.innerText = count;
      }
    });
    btnPlus.addEventListener("click", () => {
      count++;
      guestCount.innerText = count;
    });
  }
});
