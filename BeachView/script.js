/* 1. Viewport Height Fix */
function setActualVh(){const v=window.innerHeight*.01;document.documentElement.style.setProperty('--vh',`${v}px`);}
setActualVh();
if('scrollRestoration'in history)history.scrollRestoration='manual';
window.scrollTo(0,0);
window.addEventListener('beforeunload',()=>window.scrollTo(0,0));
window.addEventListener('resize',()=>{setActualVh();if(!document.body.classList.contains('unlocked'))window.scrollTo(0,0);});
window.addEventListener('orientationchange',()=>{setTimeout(setActualVh,200);if(!document.body.classList.contains('unlocked'))window.scrollTo(0,0);});

/* 2. Global Loader */
(function(){
  const loader=document.getElementById('global-loader');
  if(!loader)return;
  let done=false;
  function hide(){if(done)return;done=true;loader.classList.add('hidden');}

  // 1. Fonts readiness
  const fontsPromise=document.fonts?document.fonts.ready:Promise.resolve();

  // 2. First section assets readiness (Section 1 and Section 2 images)
  function checkImg(src){
    return new Promise(resolve=>{
      const img=new Image();
      img.onload=img.onerror=resolve;
      img.src=src;
      if(img.complete)resolve();
    });
  }
  const firstSectionAssetsPromise=Promise.all([
    checkImg('images/Section 1.webp'),
    checkImg('images/Section 2.webp')
  ]);

  // 3. Intro video readyState (at least HAVE_CURRENT_DATA / HAVE_FUTURE_DATA or canplay)
  const videoPromise=new Promise(resolve=>{
    const v=document.getElementById('intro-video');
    if(!v||v.readyState>=2)return resolve();
    v.addEventListener('loadeddata',resolve,{once:true});
    v.addEventListener('canplay',resolve,{once:true});
    v.addEventListener('error',resolve,{once:true});
    // Fallback for video ready within 2.5s
    setTimeout(resolve,2500);
  });

  // When fonts, video and first section assets are ready, dismiss loader
  Promise.all([fontsPromise, firstSectionAssetsPromise, videoPromise])
    .then(hide)
    .catch(hide);

  // Hard safety cap: max 3 seconds loader time
  setTimeout(hide,3000);
})();

/* 3. Intro Video */
const introLayer=document.getElementById('intro-layer');
const introVideo=document.getElementById('intro-video');
const tapScreen=document.getElementById('tap-screen');
const mfabEl=document.getElementById('mfab');
const bgAudio=document.getElementById('bg-music');
let musicPlaying=false;
const WHATSAPP_NUMBER='919876543210'; // Change to real number

const VIDEO_SRC='https://res.cloudinary.com/dticzwbrv/video/upload/v1791882463/Beach_Wedding_Invitation_Animati_20261013143208_Gwr_Video_Mvp_gscyre.mp4';
let videoBlobReady=false;
if(introVideo){
  introVideo.load();
  fetch(VIDEO_SRC).then(r=>r.ok?r.blob():Promise.reject()).then(blob=>{
    if(!videoBlobReady&&introVideo.paused&&introVideo.currentTime===0){videoBlobReady=true;introVideo.src=URL.createObjectURL(blob);introVideo.load();}
  }).catch(()=>{});
}

function safePlayVideo(){
  if(!introVideo)return;
  introVideo.muted=false;introVideo.volume=1.0;
  if(bgAudio){bgAudio.pause();bgAudio.currentTime=0;}
  const p=introVideo.play();
  if(p)p.catch(()=>introVideo.play().catch(()=>{}));
}

if(tapScreen){
  tapScreen.addEventListener('click',()=>{
    if(bgAudio){bgAudio.muted=true;bgAudio.play().then(()=>bgAudio.pause()).catch(()=>{});bgAudio.muted=false;bgAudio.currentTime=0;}
    introVideo.classList.add('playing');
    safePlayVideo();
    tapScreen.style.opacity='0';tapScreen.style.pointerEvents='none';
    setTimeout(()=>tapScreen.classList.add('hidden'),1000);
  },{once:true});
}

let hasFaded=false;
if(introVideo){
  introVideo.addEventListener('pause',()=>{if(!introVideo.ended&&introVideo.classList.contains('playing'))introVideo.play().catch(()=>{});});
  introVideo.addEventListener('timeupdate',()=>{
    if(!introVideo.duration)return;
    const rem=introVideo.duration-introVideo.currentTime;
    // Trigger smooth 500ms fade exactly before video ends
    if(rem<=0.55&&!hasFaded){
      hasFaded=true;
      revealApp();
    }
  });
  introVideo.addEventListener('ended',()=>{
    if(!hasFaded){
      hasFaded=true;
      revealApp();
    }
  });
}

let appRevealed=false;
function revealApp(){
  if(appRevealed)return;
  appRevealed=true;
  if(introVideo){
    introVideo.style.transition='opacity 0.5s ease-out';
    introVideo.style.opacity='0';
  }
  if(introLayer){
    introLayer.style.transition='opacity 0.5s ease-out';
    introLayer.classList.add('fade-out');
    setTimeout(()=>introLayer.classList.add('hidden'),500);
  }
  document.body.classList.add('unlocked');
  if(mfabEl)mfabEl.classList.add('visible');
  initScrollReveal();
  startBgMusic();
}

/* 4. Music FAB */
function startBgMusic(){
  if(!bgAudio)return;
  bgAudio.volume=0.45;
  bgAudio.play().then(()=>{musicPlaying=true;updateFabIcon(true);}).catch(()=>{musicPlaying=false;updateFabIcon(false);});
}
function updateFabIcon(on){
  const im=document.getElementById('icon-muted'),ip=document.getElementById('icon-playing');
  if(on){if(mfabEl)mfabEl.classList.add('playing');if(ip)ip.style.display='block';if(im)im.style.display='none';}
  else{if(mfabEl)mfabEl.classList.remove('playing');if(ip)ip.style.display='none';if(im)im.style.display='block';}
}
window.toggleMusic=function(){
  if(!bgAudio)return;
  if(musicPlaying){bgAudio.pause();musicPlaying=false;updateFabIcon(false);}
  else{bgAudio.play().then(()=>{musicPlaying=true;updateFabIcon(true);}).catch(()=>{musicPlaying=false;updateFabIcon(false);});}
};

/* 5. Scroll Reveal */
function initScrollReveal(){
  const rm=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  const items=document.querySelectorAll('.reveal');
  if(!items.length)return;
  const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('active');obs.unobserve(e.target);}});},{threshold:.10});
  items.forEach(el=>{if(rm)el.classList.add('active');else obs.observe(el);});
}

/* 6. RSVP */
window.sendRSVP=function(){
  const ni=document.getElementById('rsvp-name');
  const name=ni?ni.value.trim():'';
  if(!name){if(ni){ni.focus();ni.style.borderColor='#e05a3a';setTimeout(()=>ni.style.borderColor='',2000);}return;}
  const guests=document.getElementById('rsvp-guests')?.value||'2';
  const response=document.getElementById('rsvp-att')?.value||"Yes, we'll be there!";
  const div='━━━━━━━━━━━━━━━━━━━━━━';
  let msg=`🌊 *Aarav & Meera — RSVP* 🌊\n${div}\n\n👤 *Guest:* ${name}\n💌 *Response:* ${response}\n👥 *Number of Guests:* ${guests}\n\n${div}\n_Sent via the Wedding Invitation_\n_Aarav & Meera • 14 February 2027_\n${div}`;
  const isMobile=/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const waBase=isMobile?'https://api.whatsapp.com/send':'https://web.whatsapp.com/send';
  window.open(`${waBase}?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(msg)}`,'_blank');
  const form=document.getElementById('rsvp-form'),succ=document.getElementById('rsvp-success'),smsg=document.getElementById('rsvp-success-msg');
  if(form)form.style.display='none';
  if(succ)succ.style.display='block';
  if(smsg)smsg.innerHTML=`🎉 Thank you, <strong>${name}</strong>!<br/>Your RSVP has been sent.<br/><small>We can't wait to celebrate with you.</small>`;
};
window.resetRsvp=function(){
  const form=document.getElementById('rsvp-form'),succ=document.getElementById('rsvp-success');
  if(form)form.style.display='block';
  if(succ)succ.style.display='none';
  const ni=document.getElementById('rsvp-name');if(ni)ni.value='';
};

/* 7. Share */
window.shareInvitation=function(){
  if(navigator.share){navigator.share({title:'Aarav & Meera — Wedding Invitation',text:'You are invited to the wedding of Aarav & Meera on 14 February 2027 in Udaipur, Rajasthan.',url:window.location.href}).catch(()=>{});}
  else if(navigator.clipboard){navigator.clipboard.writeText(window.location.href).then(()=>alert('Invitation link copied!')).catch(()=>alert('Share: '+window.location.href));}
  else alert('Share: '+window.location.href);
};
