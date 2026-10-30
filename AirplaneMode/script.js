    /* 1. Viewport Height Safe Cascade (iOS-aware) */
    function setActualVh() {
      var vh = (window.visualViewport ? window.visualViewport.height : window.innerHeight) * 0.01;
      document.documentElement.style.setProperty('--vh', vh + 'px');
      /* Force-set intro-layer height for older iOS that ignores dvh */
      var intro = document.getElementById('intro-layer');
      if (intro) intro.style.height = (vh * 100) + 'px';
    }
    setActualVh();
    window.addEventListener('resize', setActualVh);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', setActualVh);
    window.addEventListener('orientationchange', function() { setTimeout(setActualVh, 150); });

    /* 2. Manual Scroll Restoration on Load */
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    /* ==========================================================================
       Pre-Flight Boarding Loader (3-Second Maximum Timeout / Asset Tracking)
       ========================================================================== */
    (function initPreflightLoader() {
      const loader = document.getElementById('preflight-loader');
      const progressBar = document.getElementById('pfl-progress-bar');
      const statusText = document.getElementById('pfl-status-text');

      if (!loader) return;

      const criticalAssets = [
        'images/Overlay.webp',
        'images/Shutter.webp',
        'images/Scenary.webp',
        'images/Sec1.webp'
      ];

      let loadedCount = 0;
      let isDismissed = false;
      const total = criticalAssets.length;

      function updateProgress(percent) {
        if (progressBar) {
          progressBar.style.width = `${percent}%`;
        }
      }

      function completeLoader() {
        if (isDismissed) return;
        isDismissed = true;
        clearTimeout(maxTimeout);

        updateProgress(100);
        if (statusText) {
          statusText.textContent = 'Cleared for Departure';
        }

        setTimeout(() => {
          loader.classList.add('loader-hidden');
          setTimeout(() => {
            if (loader.parentNode) {
              loader.parentNode.removeChild(loader);
            }
          }, 450);
        }, 180);
      }

      // Safety Maximum: Automatically dismiss after at most 3 seconds
      const maxTimeout = setTimeout(() => {
        completeLoader();
      }, 3000);

      // Track all critical intro & Section 1 assets
      criticalAssets.forEach((src) => {
        const img = new Image();
        img.onload = img.onerror = () => {
          loadedCount++;
          const pct = Math.min(95, Math.round((loadedCount / total) * 100));
          updateProgress(Math.max(pct, 20));

          if (loadedCount >= total) {
            completeLoader();
          }
        };
        img.src = src;

        if (img.complete && img.naturalWidth !== 0) {
          img.onload();
        }
      });
    })();

    /* ==========================================================================
       Lazy Loading for Bottom Section Backgrounds & Assets
       ========================================================================== */
    function initLazySections() {
      const lazySections = document.querySelectorAll('.lazy-bg');

      function loadSection(section) {
        if (!section.classList.contains('bg-loaded')) {
          section.classList.add('bg-loaded');
        }
        const lazyImgs = section.querySelectorAll('img.lazy-img');
        lazyImgs.forEach((img) => {
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
        });
      }

      if ('IntersectionObserver' in window) {
        const bgObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadSection(entry.target);
              observer.unobserve(entry.target);
            }
          });
        }, {
          rootMargin: '600px 0px 600px 0px', // Pre-fetch 600px before section enters viewport
          threshold: 0.01
        });

        lazySections.forEach((section) => bgObserver.observe(section));
      } else {
        // Fallback for older browsers
        lazySections.forEach(loadSection);
      }
    }

    initLazySections();

    /* 3. Global State */
    let attendanceValue = 'Yes';
    let isMusicPlaying = false;
    let introCompleted = false;

    const shutterSound = document.getElementById('shutter-sound');
    const bgMusic = document.getElementById('bg-music');
    const musicFab = document.getElementById('music-fab');
    const iconPlaying = document.getElementById('music-icon-playing');
    const iconPaused = document.getElementById('music-icon-paused');
    const introLayer = document.getElementById('intro-layer');
    const scrollPrompt = document.getElementById('scroll-prompt');


    /* 5. The "Airplane Window" Intro Animation Sequence */
    function handleIntroTap() {
      if (introCompleted) return;
      introCompleted = true;

      const prompt = document.getElementById('intro-prompt');
      const shutter = document.querySelector('.intro-shutter');
      const scenery = document.querySelector('.intro-scenery');
      const flare = document.querySelector('.intro-light-flare');
      const overlayImg = document.querySelector('.intro-overlay-img');
      const cabinLight = document.querySelector('.intro-cabin-light');

      // 1. Hide the prompt immediately
      if (prompt) {
        prompt.style.opacity = '0';
        prompt.style.pointerEvents = 'none';
      }

      // 2. Play Shutter Sound during the overlay shutter animation
      if (shutterSound) {
        shutterSound.currentTime = 0;
        shutterSound.play().catch(err => console.warn('Shutter audio play error:', err));
      }

      // 3. GSAP Timeline or fallback smooth sequence
      if (window.gsap) {
        const tl = gsap.timeline();

        // Shutter sliding upwards smoothly across the audio duration
        tl.to(shutter, {
          yPercent: -105,
          duration: 3.2,
          ease: 'power2.inOut'
        }, 0);

        // Scenery continuous constant-speed pan right to left (linear across full 4.2s)
        tl.to(scenery, {
          xPercent: -42,
          duration: 4.2,
          ease: 'none'
        }, 0);

        // Natural sunlight flare inside the window (soft bloom as shutter rises)
        tl.to(flare, {
          opacity: 0.82,
          duration: 2.2,
          ease: 'power2.out'
        }, 0.5);

        // Sunlight flooding into the cabin from the opening window
        if (cabinLight) {
          tl.to(cabinLight, {
            opacity: 0.7,
            duration: 2.4,
            ease: 'power1.inOut'
          }, 0.4);
        }

        // Top layer (cabin interior) brightness slightly increasing naturally as light floods inside
        tl.to(overlayImg, {
          filter: 'brightness(1.24) contrast(1.04) saturate(1.08)',
          duration: 2.8,
          ease: 'power2.out'
        }, 0.3);

        // Fade out intro layer smoothly as the shutter sound reaches its resolution (~3.3s)
        tl.to(introLayer, {
          opacity: 0,
          duration: 0.75,
          ease: 'power2.inOut',
          onComplete: finalizeIntroUnlock
        }, 3.3);
      } else {
        // Pure CSS/JS Fallback if GSAP is unavailable
        shutter.style.transition = 'transform 3.2s cubic-bezier(0.4, 0, 0.2, 1)';
        shutter.style.transform = 'translateY(-105%)';

        scenery.style.transition = 'transform 4.2s linear';
        scenery.style.transform = 'translateX(-42%)';

        if (flare) {
          flare.style.transition = 'opacity 2.2s ease';
          flare.style.opacity = '0.82';
        }

        if (cabinLight) {
          cabinLight.style.transition = 'opacity 2.4s ease';
          cabinLight.style.opacity = '0.7';
        }

        if (overlayImg) {
          overlayImg.style.transition = 'filter 2.8s ease';
          overlayImg.style.filter = 'brightness(1.24) contrast(1.04) saturate(1.08)';
        }

        setTimeout(() => {
          introLayer.style.opacity = '0';
          setTimeout(finalizeIntroUnlock, 750);
        }, 3300);
      }
    }

    if (introLayer) {
      introLayer.addEventListener('click', handleIntroTap, { once: true });
      introLayer.addEventListener('touchmove', (e) => {
        if (!introCompleted) {
          e.preventDefault();
        }
      }, { passive: false });
    }

    /* 6. Post-Intro Unlock & Triggers */
    function finalizeIntroUnlock() {
      if (introLayer) {
        introLayer.style.display = 'none';
      }

      // Unlock document scroll
      document.body.classList.add('unlocked');

      // Start Background Music after intro animation ends
      playAudio();

      // Reveal Music FAB
      if (musicFab) {
        musicFab.classList.add('visible');
      }

      // Reveal Scroll indicator
      if (scrollPrompt) {
        scrollPrompt.classList.add('visible');
      }

      // Pre-warm Section 2 immediately after intro sequence ends
      const sec2 = document.getElementById('sec2');
      if (sec2) {
        sec2.classList.add('bg-loaded');
      }

      // Animate Section 1 elements smoothly on unlock
      if (window.gsap) {
        gsap.to('#sec1 .reveal-item', {
          opacity: 1,
          y: 0,
          duration: 1.0,
          stagger: 0.12,
          ease: 'power2.out'
        });
      }

      // Initialize Scroll Reveal Animations AFTER unlocked
      initScrollReveal();

      if (window.ScrollTrigger) {
        setTimeout(() => ScrollTrigger.refresh(), 100);
      }
    }

    /* 7. Audio Playback Control */
    function playAudio() {
      if (!bgMusic) return;
      bgMusic.play().then(() => {
        isMusicPlaying = true;
        updateFabIcon();
      }).catch(err => {
        console.warn('Autoplay prevented:', err);
      });
    }

    function toggleAudio() {
      if (!bgMusic) return;
      if (isMusicPlaying) {
        bgMusic.pause();
        isMusicPlaying = false;
      } else {
        bgMusic.play();
        isMusicPlaying = true;
      }
      updateFabIcon();
    }

    function updateFabIcon() {
      if (!musicFab || !iconPlaying || !iconPaused) return;
      if (isMusicPlaying) {
        musicFab.classList.add('playing');
        iconPlaying.style.display = 'block';
        iconPaused.style.display = 'none';
      } else {
        musicFab.classList.remove('playing');
        iconPlaying.style.display = 'none';
        iconPaused.style.display = 'block';
      }
    }

    if (musicFab) {
      musicFab.addEventListener('click', toggleAudio);
    }

    /* 8. IntersectionObserver Scroll Reveal Animations */
    function initScrollReveal() {
      const items = document.querySelectorAll('.invitation-section:not(#sec1) .reveal-item');

      if (window.gsap && window.ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);

        items.forEach((item) => {
          gsap.fromTo(item, 
            { opacity: 0, y: 26 },
            {
              opacity: 1,
              y: 0,
              duration: 0.9,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: item,
                start: 'top 88%',
                toggleActions: 'play none none none'
              }
            }
          );
        });
      } else {
        // IntersectionObserver Fallback
        const observer = new IntersectionObserver((entries, obs) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.style.transition = 'opacity 0.8s ease, transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
              entry.target.style.opacity = '1';
              entry.target.style.transform = 'translateY(0)';
              obs.unobserve(entry.target);
            }
          });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        items.forEach(el => observer.observe(el));
      }
    }

    /* 9. Attendance Toggle (Yes / No) */
    function setAttendance(val) {
      attendanceValue = val;
      const yesBtn = document.getElementById('toggle-yes');
      const noBtn = document.getElementById('toggle-no');
      if (val === 'Yes') {
        yesBtn.classList.add('active');
        noBtn.classList.remove('active');
      } else {
        noBtn.classList.add('active');
        yesBtn.classList.remove('active');
      }
    }

    /* 10. RSVP Form Validation & Stylized WhatsApp Routing */
    function handleRsvpSubmit(event) {
      event.preventDefault();

      const nameInput = document.getElementById('rsvp-name');
      const emailInput = document.getElementById('rsvp-email');
      const guestsSelect = document.getElementById('rsvp-guests');

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const guests = guestsSelect ? guestsSelect.value : '2 Guests';

      // Validation
      if (!name) {
        showToast('Please enter your full name to RSVP.');
        nameInput.focus();
        return;
      }

      if (!email) {
        showToast('Please enter your email or phone number.');
        emailInput.focus();
        return;
      }

      // Construct Stylized Luxury Aviation WhatsApp Message
      const attendanceEmoji = attendanceValue === 'Yes' ? '✅ *Joyfully Accepted*' : '❌ *Regretfully Declined*';
      
      const message = 
`✈️ *SHAADI AIR — RSVP CONFIRMATION* ✈️
━━━━━━━━━━━━━━━━━━━━━━
👤 *Guest Name:* ${name}
📧 *Contact:* ${email}
👥 *Party Size:* ${guests}
💌 *Attendance:* ${attendanceEmoji}
━━━━━━━━━━━━━━━━━━━━━━
🛫 *Flight:* 1402 (Aarav & Meera)
📍 *Destination:* Manali, India
📅 *Date:* 14 February 2027
━━━━━━━━━━━━━━━━━━━━━━
Thank you for being part of our journey! ✨`;

      const encodedMessage = encodeURIComponent(message);
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const baseUrl = isMobile ? 'https://api.whatsapp.com/send' : 'https://web.whatsapp.com/send';
      // Replace with bride/groom WhatsApp number (default demo number or prompt user)
      const phone = '919876543210'; 
      const finalUrl = `${baseUrl}?phone=${phone}&text=${encodedMessage}`;

      // Reset form fields and reset attendance toggle to default ("Yes")
      const rsvpForm = document.getElementById('rsvp-form');
      if (rsvpForm) {
        rsvpForm.reset();
      }
      setAttendance('Yes');

      showToast('Opening WhatsApp to send your RSVP...');
      setTimeout(() => {
        window.open(finalUrl, '_blank');
      }, 700);
    }

    /* 11. Toast Message Helper */
    function showToast(msg) {
      const toast = document.getElementById('toast-msg');
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3500);
    }

    /* 12. Smooth Scroll to Top Anchor */
    function scrollToTop(e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /* ==========================================================================
       13. Wedding Events & Calendar Integration (Google & Apple)
       ========================================================================== */
    const WEDDING_EVENTS = {
      haldi: {
        id: 'haldi',
        badge: '01 / CEREMONY',
        title: 'Haldi Ceremony — Aarav & Meera Wedding',
        shortTitle: 'Haldi Ceremony',
        displayDate: '14 February 2027',
        displayTime: '10:00 AM',
        location: 'The Riverside Retreat, Manali, Himachal Pradesh, India',
        description: 'Join us to celebrate the joyous Haldi Ceremony of Aarav & Meera aboard Shaadi Air Flight 1402! Location: The Riverside Retreat, Manali.',
        // 2027-02-14 10:00 AM to 01:00 PM IST (UTC+05:30 -> 04:30 to 07:30 UTC)
        startUtc: '20270214T043000Z',
        endUtc: '20270214T073000Z',
        startLocal: '20270214T100000',
        endLocal: '20270214T130000'
      },
      mehendi: {
        id: 'mehendi',
        badge: '02 / CELEBRATION',
        title: 'Mehendi Celebration — Aarav & Meera Wedding',
        shortTitle: 'Mehendi Celebration',
        displayDate: '14 February 2027',
        displayTime: '02:00 PM',
        location: 'Lakeside Lawn, Udaipur, Rajasthan, India',
        description: 'Celebrate the colorful Mehendi patterns and music of Aarav & Meera! Flight 1402 Destination Udaipur.',
        // 2027-02-14 02:00 PM to 05:30 PM IST (UTC+05:30 -> 08:30 to 12:00 UTC)
        startUtc: '20270214T083000Z',
        endUtc: '20270214T120000Z',
        startLocal: '20270214T140000',
        endLocal: '20270214T173000'
      },
      sangeet: {
        id: 'sangeet',
        badge: '03 / NIGHT',
        title: 'Sangeet Night — Aarav & Meera Wedding',
        shortTitle: 'Sangeet Night',
        displayDate: '14 February 2027',
        displayTime: '07:00 PM',
        location: 'The Grand Ballroom, Udaipur, Rajasthan, India',
        description: 'An evening of rhythm, performances, dance and celebration for Aarav & Meera Wedding!',
        // 2027-02-14 07:00 PM to 11:30 PM IST (UTC+05:30 -> 13:30 to 18:00 UTC)
        startUtc: '20270214T133000Z',
        endUtc: '20270214T180000Z',
        startLocal: '20270214T190000',
        endLocal: '20270214T233000'
      },
      wedding: {
        id: 'wedding',
        badge: '04 / MAIN CEREMONY',
        title: 'Wedding Ceremony (Pheras) — Aarav & Meera',
        shortTitle: 'Wedding Ceremony',
        displayDate: '14 February 2027',
        displayTime: '06:00 PM',
        location: 'The Riverside Terrace, Manali, Himachal Pradesh, India',
        description: 'The sacred wedding ceremony and pheras of Aarav & Meera against the majestic snowy Himalayan peaks.',
        // 2027-02-14 06:00 PM to 10:00 PM IST (UTC+05:30 -> 12:30 to 16:30 UTC)
        startUtc: '20270214T123000Z',
        endUtc: '20270214T163000Z',
        startLocal: '20270214T180000',
        endLocal: '20270214T220000'
      },
      reception: {
        id: 'reception',
        badge: '05 / EVENING',
        title: 'Wedding Reception — Aarav & Meera',
        shortTitle: 'Reception Evening',
        displayDate: '14 February 2027',
        displayTime: '08:00 PM',
        location: 'The Mountain View Resort, Manali, Himachal Pradesh, India',
        description: 'Dinner, toasts, and unforgettable celebrations with the newlyweds Aarav & Meera!',
        // 2027-02-14 08:00 PM to 11:59 PM IST (UTC+05:30 -> 14:30 to 18:29 UTC)
        startUtc: '20270214T143000Z',
        endUtc: '20270214T182900Z',
        startLocal: '20270214T200000',
        endLocal: '20270214T235900'
      }
    };

    let activeCalendarEvent = WEDDING_EVENTS.haldi;

    function openCalendarModal(eventId) {
      const eventData = WEDDING_EVENTS[eventId];
      if (!eventData) return;
      activeCalendarEvent = eventData;

      // Populate preview data inside the modal
      const badgeEl = document.getElementById('cal-summary-badge');
      const titleEl = document.getElementById('cal-summary-title');
      const dateEl = document.getElementById('cal-summary-date');
      const timeEl = document.getElementById('cal-summary-time');
      const venueEl = document.getElementById('cal-summary-venue');

      if (badgeEl) badgeEl.textContent = eventData.badge;
      if (titleEl) titleEl.textContent = eventData.shortTitle;
      if (dateEl) dateEl.textContent = eventData.displayDate;
      if (timeEl) timeEl.textContent = eventData.displayTime;
      if (venueEl) venueEl.textContent = eventData.location;

      const modal = document.getElementById('calendar-modal');
      if (modal) {
        modal.style.display = 'flex';
        // Force reflow for CSS transition
        void modal.offsetWidth;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    }

    function closeCalendarModal() {
      const modal = document.getElementById('calendar-modal');
      if (!modal) return;
      modal.classList.remove('active');
      document.body.style.overflow = '';
      setTimeout(() => {
        if (!modal.classList.contains('active')) {
          modal.style.display = 'none';
        }
      }, 300);
    }

    // Close on backdrop tap or Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeCalendarModal();
      }
    });

    const calModalBackdrop = document.getElementById('calendar-modal');
    if (calModalBackdrop) {
      calModalBackdrop.addEventListener('click', (e) => {
        if (e.target === calModalBackdrop) {
          closeCalendarModal();
        }
      });
    }

    // Save to Google Calendar
    function saveEventToGoogle() {
      if (!activeCalendarEvent) return;
      const ev = activeCalendarEvent;
      const googleUrl = new URL('https://calendar.google.com/calendar/render');
      googleUrl.searchParams.set('action', 'TEMPLATE');
      googleUrl.searchParams.set('text', ev.title);
      googleUrl.searchParams.set('dates', `${ev.startUtc}/${ev.endUtc}`);
      googleUrl.searchParams.set('details', ev.description);
      googleUrl.searchParams.set('location', ev.location);

      window.open(googleUrl.toString(), '_blank');
      showToast(`${ev.shortTitle} opened in Google Calendar!`);
      closeCalendarModal();
    }

    // Save to Apple Calendar (.ics file generation with data URI / blob download)
    function saveEventToApple() {
      if (!activeCalendarEvent) return;
      const ev = activeCalendarEvent;

      const icsLines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Shaadi Air//Wedding Invitation//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:shaadiair-${ev.id}-20270214@invitebox.in`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART:${ev.startUtc}`,
        `DTEND:${ev.endUtc}`,
        `SUMMARY:${ev.title}`,
        `DESCRIPTION:${ev.description.replace(/\n/g, '\\n')}`,
        `LOCATION:${ev.location}`,
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'TRIGGER:-PT60M',
        'ACTION:DISPLAY',
        `DESCRIPTION:Reminder: ${ev.shortTitle} begins in 1 hour`,
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
      ];

      const icsContent = icsLines.join('\r\n');
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const downloadUrl = URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = downloadUrl;
      tempLink.setAttribute('download', `${ev.id}-ceremony-shaadiair.ics`);
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 4000);

      showToast(`Apple Calendar invitation downloaded for ${ev.shortTitle}!`);
      closeCalendarModal();
    }
