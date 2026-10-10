/**
 * THE WEDDING MIXTAPE — AARAV & MEERA
 * Complete Interactive Audio Player & Website Controller
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. PLAYLIST DATA DEFINITION
  // ---------------------------------------------------------------------------
  const PLAYLIST = [
    {
      id: 0,
      title: 'Haldi',
      subtitle: 'Auspicious Rhythms',
      time: '14 Feb • 09:00 AM',
      audioSrc: 'assets/audio/track-1.mp3',
      coverSrc: 'assets/images/haldi-event.png'
    },
    {
      id: 1,
      title: 'Mehendi',
      subtitle: 'Henna Melodies',
      time: '14 Feb • 12:00 PM',
      audioSrc: 'assets/audio/track-2.mp3',
      coverSrc: 'assets/images/mehendi-event.png'
    },
    {
      id: 2,
      title: 'Sangeet',
      subtitle: 'Celebration Beats',
      time: '14 Feb • 07:00 PM',
      audioSrc: 'assets/audio/track-3.mp3',
      coverSrc: 'assets/images/sangeet-event.png'
    },
    {
      id: 3,
      title: 'Wedding',
      subtitle: 'Mangalyam Symphony',
      time: '15 Feb • 10:00 AM',
      audioSrc: 'assets/audio/track-1.mp3',
      coverSrc: 'assets/images/wedding-event.png'
    },
    {
      id: 4,
      title: 'Reception',
      subtitle: 'Royal Nocturne',
      time: '15 Feb • 07:00 PM',
      audioSrc: 'assets/audio/track-2.mp3',
      coverSrc: 'assets/images/reception-event.png'
    }
  ];

  // ---------------------------------------------------------------------------
  // 2. STATE MANAGEMENT
  // ---------------------------------------------------------------------------
  const state = {
    currentTrackIndex: 0,
    isPlaying: false,
    isShuffle: false,
    isRepeat: false,
    duration: 225, // default 03:45 fallback seconds
    currentTime: 0,
    isSeeking: false,
    webAudioActive: false
  };

  // ---------------------------------------------------------------------------
  // 3. DOM ELEMENTS
  // ---------------------------------------------------------------------------
  const audioEl = document.getElementById('global-wedding-audio');

  // Cover Elements (Section 1)
  const coverVinylImg = document.getElementById('cover-vinyl-img');
  const coverVinylWrap = document.getElementById('cover-vinyl-wrap');
  const coverTonearm = document.getElementById('cover-tonearm');
  const coverBtnPlay = document.getElementById('cover-btn-play');
  const coverPlayIcon = document.getElementById('cover-play-icon');
  const coverBtnPrev = document.getElementById('cover-btn-prev');
  const coverBtnNext = document.getElementById('cover-btn-next');
  const coverTapPrompt = document.getElementById('cover-tap-prompt');
  const coverWaveform = document.getElementById('cover-waveform');

  // Now Playing Elements (Section 2)
  const albumSleeveContainer = document.getElementById('album-sleeve-container');
  const albumVinylImg = document.getElementById('album-vinyl-img');
  const mainProgressTrack = document.getElementById('main-progress-track');
  const mainProgressFill = document.getElementById('main-progress-fill');
  const currentTimeEl = document.getElementById('current-time');
  const totalTimeEl = document.getElementById('total-time');
  const btnPlayToggle = document.getElementById('btn-play-toggle');
  const mainPlayIcon = document.getElementById('main-play-icon');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const btnShuffle = document.getElementById('btn-shuffle');
  const btnRepeat = document.getElementById('btn-repeat');
  const nowPlayingWaveform = document.getElementById('now-playing-waveform');

  // Story Elements (Section 3)
  const storyProgressFill = document.getElementById('story-progress-fill');
  const storyCurrentTime = document.getElementById('story-current-time');
  const storyTotalTime = document.getElementById('story-total-time');
  const storyBtnHeart = document.getElementById('story-btn-heart');

  // Events / Playlist Elements (Section 4)
  const trackCards = document.querySelectorAll('.track-card');

  // Floating Bottom Player
  const floatingPlayer = document.getElementById('floating-player');
  const fbpThumbImg = document.getElementById('fbp-thumb-img');
  const fbpTrackTitle = document.getElementById('fbp-track-title');
  const fbpTrackSub = document.getElementById('fbp-track-sub');
  const fbpBtnPlay = document.getElementById('fbp-btn-play');
  const fbpPlayIcon = document.getElementById('fbp-play-icon');
  const fbpBtnPrev = document.getElementById('fbp-btn-prev');
  const fbpBtnNext = document.getElementById('fbp-btn-next');
  const fbpProgressBar = document.getElementById('fbp-progress-bar');
  const fbpProgressFill = document.getElementById('fbp-progress-fill');

  // RSVP Form & Toast
  const rsvpForm = document.getElementById('wedding-rsvp-form');
  const rsvpToast = document.getElementById('rsvp-success-toast');
  const rsvpToastMessage = document.getElementById('rsvp-toast-message');

  // Navigation Links
  const navLinks = document.querySelectorAll('.nav-strip-link');
  const sections = document.querySelectorAll('.invite-section');

  // SVG Icons constants
  const ICON_PLAY = '<path d="M8 5v14l11-7z"/>';
  const ICON_PAUSE = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';

  // ---------------------------------------------------------------------------
  // 4. GENERATE EQUALIZER WAVEFORM BARS
  // ---------------------------------------------------------------------------
  function buildWaveformBars(container, barCount = 42) {
    if (!container) return;
    container.innerHTML = '';
    const heights = [
      4, 6, 8, 12, 16, 10, 18, 22, 14, 20, 24, 18, 26, 16, 22, 12, 18, 24, 28, 
      20, 14, 22, 18, 12, 16, 24, 20, 15, 10, 18, 14, 22, 16, 12, 8, 14, 10, 6, 4
    ];

    for (let i = 0; i < barCount; i++) {
      const bar = document.createElement('span');
      bar.className = 'waveform-bar';
      const baseH = heights[i % heights.length];
      bar.style.height = `${baseH}px`;
      bar.style.animationDelay = `${(i * 0.04).toFixed(2)}s`;
      container.appendChild(bar);
    }
  }

  buildWaveformBars(coverWaveform, 38);
  buildWaveformBars(nowPlayingWaveform, 44);

  // ---------------------------------------------------------------------------
  // 5. AUDIO ENGINE & PLAYBACK CONTROLLER
  // ---------------------------------------------------------------------------
  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  function loadTrack(index) {
    if (index < 0) index = PLAYLIST.length - 1;
    if (index >= PLAYLIST.length) index = 0;
    state.currentTrackIndex = index;
    const track = PLAYLIST[index];

    if (audioEl) {
      audioEl.src = track.audioSrc;
      audioEl.load();
    }

    // Update Floating & Page Titles
    if (fbpTrackTitle) {
      fbpTrackTitle.innerHTML = `${track.title} <span>&amp;</span> Melody`;
    }
    if (fbpTrackSub) {
      fbpTrackSub.textContent = track.subtitle;
    }
    if (fbpThumbImg) {
      fbpThumbImg.src = track.coverSrc;
    }

    // Highlight active card in playlist
    trackCards.forEach((card, idx) => {
      const btn = card.querySelector('.btn-track-play');
      if (idx === index) {
        card.classList.add('active-track');
        if (btn) btn.classList.add('playing');
      } else {
        card.classList.remove('active-track');
        if (btn) btn.classList.remove('playing');
      }
    });
  }

  function togglePlay() {
    if (state.isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  }

  function playAudio() {
    if (!audioEl) return;
    const playPromise = audioEl.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          state.isPlaying = true;
          updatePlaybackUI(true);
        })
        .catch((error) => {
          console.warn('Audio play prevented by browser policy or missing file. Engaging fallback WebAudio generator.', error);
          startWebAudioFallback();
          state.isPlaying = true;
          updatePlaybackUI(true);
        });
    } else {
      state.isPlaying = true;
      updatePlaybackUI(true);
    }
  }

  function pauseAudio() {
    if (audioEl) {
      audioEl.pause();
    }
    stopWebAudioFallback();
    state.isPlaying = false;
    updatePlaybackUI(false);
  }

  function prevTrack() {
    let nextIdx = state.currentTrackIndex - 1;
    if (nextIdx < 0) nextIdx = PLAYLIST.length - 1;
    loadTrack(nextIdx);
    if (state.isPlaying) playAudio();
  }

  function nextTrack() {
    let nextIdx;
    if (state.isShuffle) {
      do {
        nextIdx = Math.floor(Math.random() * PLAYLIST.length);
      } while (nextIdx === state.currentTrackIndex && PLAYLIST.length > 1);
    } else {
      nextIdx = (state.currentTrackIndex + 1) % PLAYLIST.length;
    }
    loadTrack(nextIdx);
    if (state.isPlaying) playAudio();
  }

  // ---------------------------------------------------------------------------
  // 6. SYNCHRONIZE PLAYBACK VISUALS & ANIMATIONS
  // ---------------------------------------------------------------------------
  function updatePlaybackUI(isPlaying) {
    // 1. Cover Vinyl & Tonearm
    if (coverVinylImg) {
      if (isPlaying) {
        coverVinylImg.classList.add('vinyl-spinning');
        coverVinylImg.classList.remove('vinyl-paused');
      } else {
        coverVinylImg.classList.add('vinyl-paused');
      }
    }
    if (coverTonearm) {
      coverTonearm.classList.toggle('tonearm-active', isPlaying);
    }
    if (coverBtnPlay) {
      coverBtnPlay.classList.toggle('playing', isPlaying);
    }
    if (coverPlayIcon) {
      coverPlayIcon.innerHTML = isPlaying ? ICON_PAUSE : ICON_PLAY;
    }
    if (coverTapPrompt) {
      coverTapPrompt.textContent = isPlaying ? 'Playing Mixtape' : 'Tap to Play';
    }

    // 2. Now Playing Vinyl & Icons
    if (albumVinylImg) {
      if (isPlaying) {
        albumVinylImg.classList.add('vinyl-spinning');
        albumVinylImg.classList.remove('vinyl-paused');
      } else {
        albumVinylImg.classList.add('vinyl-paused');
      }
    }
    if (albumSleeveContainer) {
      albumSleeveContainer.classList.toggle('player-active', isPlaying);
    }
    if (mainPlayIcon) {
      mainPlayIcon.innerHTML = isPlaying ? ICON_PAUSE : ICON_PLAY;
    }

    // 3. Floating Player Icon
    if (fbpPlayIcon) {
      fbpPlayIcon.innerHTML = isPlaying ? ICON_PAUSE : ICON_PLAY;
    }

    // 4. Waveforms
    if (coverWaveform) {
      coverWaveform.classList.toggle('waveform-animating', isPlaying);
    }
    if (nowPlayingWaveform) {
      nowPlayingWaveform.classList.toggle('waveform-animating', isPlaying);
    }

    // 5. Active playlist button icon
    const activeCard = trackCards[state.currentTrackIndex];
    if (activeCard) {
      const btn = activeCard.querySelector('.btn-track-play');
      if (btn) {
        const svg = btn.querySelector('svg');
        if (svg) svg.innerHTML = isPlaying ? ICON_PAUSE : ICON_PLAY;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 7. TIME UPDATES & PROGRESS BAR SCRUBBING
  // ---------------------------------------------------------------------------
  function updateProgress() {
    if (state.isSeeking || !audioEl) return;

    const cur = audioEl.currentTime || state.currentTime;
    const dur = audioEl.duration || state.duration;

    const pct = dur > 0 ? (cur / dur) * 100 : 0;

    if (mainProgressFill) mainProgressFill.style.width = `${pct}%`;
    if (storyProgressFill) storyProgressFill.style.width = `${pct}%`;
    if (fbpProgressFill) fbpProgressFill.style.width = `${pct}%`;

    const curFormatted = formatTime(cur);
    const durFormatted = formatTime(dur);

    if (currentTimeEl) currentTimeEl.textContent = curFormatted;
    if (totalTimeEl) totalTimeEl.textContent = durFormatted;
    if (storyCurrentTime) storyCurrentTime.textContent = curFormatted;
    if (storyTotalTime) storyTotalTime.textContent = durFormatted;
  }

  function handleScrub(e, trackEl) {
    if (!trackEl) return;
    const rect = trackEl.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const fraction = clickX / rect.width;
    const targetTime = fraction * (audioEl.duration || state.duration);

    if (audioEl && !isNaN(targetTime)) {
      audioEl.currentTime = targetTime;
    }
    state.currentTime = targetTime;
    updateProgress();
  }

  // Audio Event Listeners
  if (audioEl) {
    audioEl.addEventListener('timeupdate', updateProgress);

    audioEl.addEventListener('loadedmetadata', () => {
      if (audioEl.duration) {
        state.duration = audioEl.duration;
        if (totalTimeEl) totalTimeEl.textContent = formatTime(audioEl.duration);
        if (storyTotalTime) storyTotalTime.textContent = formatTime(audioEl.duration);
      }
    });

    audioEl.addEventListener('ended', () => {
      if (state.isRepeat) {
        audioEl.currentTime = 0;
        playAudio();
      } else {
        nextTrack();
      }
    });
  }

  // Scrub Events for Main Player Track
  if (mainProgressTrack) {
    mainProgressTrack.addEventListener('click', (e) => handleScrub(e, mainProgressTrack));
  }

  // Scrub Events for Floating Player Track
  if (fbpProgressBar) {
    fbpProgressBar.addEventListener('click', (e) => handleScrub(e, fbpProgressBar));
  }

  // ---------------------------------------------------------------------------
  // 8. EVENT LISTENERS BINDINGS
  // ---------------------------------------------------------------------------
  // Cover Section Controls
  if (coverBtnPlay) coverBtnPlay.addEventListener('click', togglePlay);
  if (coverVinylWrap) coverVinylWrap.addEventListener('click', togglePlay);
  if (coverBtnPrev) coverBtnPrev.addEventListener('click', prevTrack);
  if (coverBtnNext) coverBtnNext.addEventListener('click', nextTrack);

  // Now Playing Controls
  if (btnPlayToggle) btnPlayToggle.addEventListener('click', togglePlay);
  if (btnPrev) btnPrev.addEventListener('click', prevTrack);
  if (btnNext) btnNext.addEventListener('click', nextTrack);

  if (btnShuffle) {
    btnShuffle.addEventListener('click', () => {
      state.isShuffle = !state.isShuffle;
      btnShuffle.classList.toggle('active', state.isShuffle);
    });
  }

  if (btnRepeat) {
    btnRepeat.addEventListener('click', () => {
      state.isRepeat = !state.isRepeat;
      btnRepeat.classList.toggle('active', state.isRepeat);
    });
  }

  // Floating Player Controls
  if (fbpBtnPlay) fbpBtnPlay.addEventListener('click', togglePlay);
  if (fbpBtnPrev) fbpBtnPrev.addEventListener('click', prevTrack);
  if (fbpBtnNext) fbpBtnNext.addEventListener('click', nextTrack);

  // Heart Favorite Button
  if (storyBtnHeart) {
    storyBtnHeart.addEventListener('click', () => {
      const isFav = storyBtnHeart.getAttribute('data-fav') === 'true';
      storyBtnHeart.setAttribute('data-fav', !isFav);
      storyBtnHeart.style.transform = 'scale(1.3)';
      setTimeout(() => {
        storyBtnHeart.style.transform = 'scale(1)';
      }, 200);
    });
  }

  // Track Cards Click Handling in Section 4 (Wedding Playlist)
  trackCards.forEach((card, index) => {
    card.addEventListener('click', (e) => {
      if (state.currentTrackIndex === index && state.isPlaying) {
        pauseAudio();
      } else {
        loadTrack(index);
        playAudio();
      }
    });

    // Keyboard accessibility (Enter/Space)
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 9. SECTION INTERSECTION OBSERVER FOR NAVIGATION
  // ---------------------------------------------------------------------------
  const observerOptions = {
    root: null,
    rootMargin: '-30% 0px -40% 0px',
    threshold: 0
  };

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach((link) => {
          const href = link.getAttribute('href');
          if (href === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach((sec) => sectionObserver.observe(sec));

  // ---------------------------------------------------------------------------
  // 10. RSVP FORM HANDLING WITH VALIDATION & FEEDBACK
  // ---------------------------------------------------------------------------
  if (rsvpForm) {
    rsvpForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('rsvp-guest-name');
      const eventSelect = document.getElementById('rsvp-event-selection');
      const selectedStatus = document.querySelector('input[name="rsvp_status"]:checked');

      if (!nameInput || !nameInput.value.trim()) {
        nameInput.focus();
        return;
      }

      const guestData = {
        name: nameInput.value.trim(),
        event: eventSelect ? eventSelect.value : 'all',
        status: selectedStatus ? selectedStatus.value : 'accept',
        timestamp: new Date().toISOString()
      };

      // Persist to localStorage for user review
      try {
        const existingList = JSON.parse(localStorage.getItem('wedding_rsvps') || '[]');
        existingList.push(guestData);
        localStorage.setItem('wedding_rsvps', JSON.stringify(existingList));
      } catch (err) {
        console.warn('Storage unavailable', err);
      }

      // Show toast notification
      if (rsvpToast && rsvpToastMessage) {
        if (guestData.status === 'accept') {
          rsvpToastMessage.textContent = `Thank you, ${guestData.name}! Can't wait to jam with you!`;
        } else {
          rsvpToastMessage.textContent = `Thank you, ${guestData.name}. We'll feel your love from afar!`;
        }
        rsvpToast.classList.add('show-toast');
        setTimeout(() => {
          rsvpToast.classList.remove('show-toast');
        }, 5000);
      }

      // Play soft celebratory vibration or note
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      // Reset form input
      nameInput.value = '';
    });
  }

  // ---------------------------------------------------------------------------
  // 11. WEB AUDIO SYNTHESIZER FALLBACK
  // ---------------------------------------------------------------------------
  let audioCtx = null;
  let synthTimer = null;

  function startWebAudioFallback() {
    if (state.webAudioActive) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      audioCtx = new AudioContext();
      state.webAudioActive = true;

      // Soft romantic pentatonic arpeggio chords (C, D, E, G, A)
      const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
      let noteIndex = 0;

      synthTimer = setInterval(() => {
        if (!state.isPlaying || !audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(scale[noteIndex % scale.length], audioCtx.currentTime);

        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.2);

        noteIndex++;
        state.currentTime += 0.8;
        if (state.currentTime > state.duration) state.currentTime = 0;
        updateProgress();
      }, 800);
    } catch (e) {
      console.warn('Web Audio not supported', e);
    }
  }

  function stopWebAudioFallback() {
    state.webAudioActive = false;
    if (synthTimer) {
      clearInterval(synthTimer);
      synthTimer = null;
    }
  }

  // Initialize First Track
  loadTrack(0);

})();
