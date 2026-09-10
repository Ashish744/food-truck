/* ==========================================================================
   main.js — loader, cursor, navbar, scroll progress, spotlight, transitions
   ========================================================================== */

window.ROAM = window.ROAM || {};
ROAM.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* --------------------------------------------------------------------- */
/* Graceful image fallback — replaces any failed photo with an on-brand   */
/* generated placeholder so nothing ever shows a broken-image icon.       */
/* --------------------------------------------------------------------- */
function handleImgError(img){
  if(img.dataset.fallbackApplied) return;
  img.dataset.fallbackApplied = '1';
  const w = img.clientWidth || img.width || 400;
  const h = img.clientHeight || img.height || 300;
  const palette = [['#E85D2C','#B84420'],['#2F5D50','#1C3B33'],['#35618C','#22415F'],['#8A8377','#5C574C']];
  const c = palette[Math.floor(Math.random()*palette.length)];
  const label = (img.alt || 'ROAM').slice(0, 24).replace(/[<>&]/g, '');
  const r = Math.max(18, Math.min(w,h) * 0.13);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stop-color='${c[0]}'/><stop offset='1' stop-color='${c[1]}'/>
    </linearGradient></defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
    <circle cx='${w/2}' cy='${h/2 - r*0.5}' r='${r}' fill='none' stroke='#FFF8EF' stroke-width='3' opacity='.85'/>
    <line x1='${w/2 - r*0.4}' y1='${h/2 - r*0.5 - r*0.5}' x2='${w/2 - r*0.4}' y2='${h/2 - r*0.5 + r*0.5}' stroke='#FFF8EF' stroke-width='2.5' opacity='.85'/>
    <line x1='${w/2 + r*0.4}' y1='${h/2 - r*0.5 - r*0.5}' x2='${w/2 + r*0.4}' y2='${h/2 - r*0.5 + r*0.5}' stroke='#FFF8EF' stroke-width='2.5' opacity='.85'/>
    <text x='50%' y='${h/2 + r + 28}' text-anchor='middle' font-family='sans-serif' font-size='${Math.max(11, Math.min(w,h) * 0.065)}' fill='#FFF8EF' opacity='.92'>${label}</text>
  </svg>`;
  try{ img.src = 'data:image/svg+xml;base64,' + btoa(svg); }
  catch(err){ img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg); }
}

/* --------------------------------------------------------------------- */
/* Loading screen                                                         */
/* --------------------------------------------------------------------- */
function initLoader(){
  const loader = document.querySelector('.loader');
  if(!loader){
    document.body.classList.add('is-ready');
    document.dispatchEvent(new CustomEvent('roam:loaded'));
    return;
  }

  const blocks = loader.querySelectorAll('.loader-block');
  const pctEl = loader.querySelector('.loader-pct');
  const state = { pct: 0 };

  if(ROAM.reducedMotion){
    loader.style.display = 'none';
    document.body.classList.add('is-ready');
    document.dispatchEvent(new CustomEvent('roam:loaded'));
    return;
  }

  const tl = gsap.timeline({
    onComplete(){
      document.body.classList.add('is-ready');
      document.dispatchEvent(new CustomEvent('roam:loaded'));
    }
  });

  tl.set(blocks, { opacity: 0, scale: .85, y: 16 });
  tl.to(blocks, { opacity: 1, scale: 1, y: 0, duration: .6, stagger: .08, ease: 'back.out(1.6)' });
  tl.to(state, {
    pct: 100, duration: 1.4, ease: 'power1.inOut',
    onUpdate(){ if(pctEl) pctEl.textContent = Math.round(state.pct) + '%'; }
  }, '-=.5');
  tl.to(loader, { autoAlpha: 0, duration: .7, ease: 'power2.inOut' }, '+=.15');
}

/* --------------------------------------------------------------------- */
/* Custom cursor                                                          */
/* --------------------------------------------------------------------- */
function initCursor(){
  if(window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  document.body.append(dot, ring);

  let mx = window.innerWidth/2, my = window.innerHeight/2;
  let rx = mx, ry = my;

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
  });

  function raf(){
    rx += (mx - rx) * .16;
    ry += (my - ry) * .16;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(raf);
  }
  raf();

  const hoverables = 'a, button, .spotlight, input, textarea, select, .menu-card, .bento-item, [data-cursor-hover]';
  document.addEventListener('mouseover', (e) => {
    if(e.target.closest(hoverables)) ring.classList.add('is-hover');
  });
  document.addEventListener('mouseout', (e) => {
    if(e.target.closest(hoverables)) ring.classList.remove('is-hover');
  });
}

/* --------------------------------------------------------------------- */
/* Navbar scroll state + scroll progress                                  */
/* --------------------------------------------------------------------- */
function initNavbarScroll(){
  const nav = document.querySelector('.navbar');
  const progress = document.querySelector('.scroll-progress');
  function onScroll(){
    const y = window.scrollY;
    if(nav) nav.classList.toggle('is-scrolled', y > 24);
    if(progress){
      const h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y/h)*100 : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* --------------------------------------------------------------------- */
/* Generic mouse-tracked spotlight (cards, rows, buttons)                 */
/* --------------------------------------------------------------------- */
function initSpotlight(selector = '.spotlight, .menu-card'){
  const els = document.querySelectorAll(selector);
  els.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--sx', ((e.clientX - r.left)/r.width*100) + '%');
      el.style.setProperty('--sy', ((e.clientY - r.top)/r.height*100) + '%');
      el.style.setProperty('--mx', ((e.clientX - r.left)/r.width*100) + '%');
      el.style.setProperty('--my', ((e.clientY - r.top)/r.height*100) + '%');
    });
  });
}

/* --------------------------------------------------------------------- */
/* Magnetic buttons                                                       */
/* --------------------------------------------------------------------- */
function initMagnetic(selector = '[data-magnetic]'){
  if(window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
  document.querySelectorAll(selector).forEach(el => {
    const strength = 22;
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width/2) / r.width;
      const y = (e.clientY - r.top - r.height/2) / r.height;
      gsap.to(el, { x: x*strength, y: y*strength, duration: .5, ease: 'power3.out' });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: .6, ease: 'elastic.out(1,.4)' });
    });
  });
}

/* --------------------------------------------------------------------- */
/* Same-site page transition overlay                                      */
/* --------------------------------------------------------------------- */
function initPageTransitions(){
  const overlay = document.querySelector('.page-transition');
  if(!overlay || ROAM.reducedMotion) return;

  document.querySelectorAll('a[href$=".html"], a[href="/"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if(link.target === '_blank' || e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      gsap.timeline({ onComplete(){ window.location.href = href; } })
        .set(overlay, { display: 'flex' })
        .to(overlay, { y: '0%', duration: .55, ease: 'power3.inOut' });
    });
  });

  gsap.to(overlay, { y: '101%', duration: .7, delay: .05, ease: 'power3.inOut', onComplete(){ overlay.style.display='none'; } });
}

function resetRestoredPageTransition(event){
  if(!event.persisted) return;
  const overlay = document.querySelector('.page-transition');
  if(!overlay) return;
  if(window.gsap) gsap.set(overlay, { display:'none', y:'101%' });
  else { overlay.style.display = 'none'; overlay.style.transform = 'translateY(101%)'; }
}

/* --------------------------------------------------------------------- */
/* Legal modal (Privacy / Terms)                                          */
/* --------------------------------------------------------------------- */
function initLegalModal(){
  const overlay = document.getElementById('legal-modal');
  if(!overlay) return;
  const panels = overlay.querySelectorAll('.modal-content');
  document.querySelectorAll('[data-modal]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const which = trigger.dataset.modal;
      panels.forEach(p => p.classList.toggle('hidden', p.id !== 'modal-content-' + which));
      overlay.classList.add('is-open');
      document.body.classList.add('menu-open');
    });
  });
  function close(){ overlay.classList.remove('is-open'); document.body.classList.remove('menu-open'); }
  overlay.querySelector('.modal-close')?.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if(e.target === overlay) close(); });
  window.addEventListener('keydown', (e) => { if(e.key === 'Escape') close(); });
}

/* --------------------------------------------------------------------- */
/* Footer newsletter                                                     */
/* --------------------------------------------------------------------- */
function initFooterNewsletters(){
  const emailPattern = /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;

  document.querySelectorAll('.footer-newsletter').forEach(form => {
    const input = form.querySelector('input[type="email"]');
    const button = form.querySelector('button[type="submit"]');
    if(!input || !button) return;

    const message = document.createElement('span');
    message.className = 'footer-newsletter-msg';
    message.setAttribute('aria-live', 'polite');
    form.appendChild(message);
    let warningTimer;

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      clearTimeout(warningTimer);
      const email = input.value.trim();
      const isValid = email.length <= 254 && emailPattern.test(email);
      input.setAttribute('aria-invalid', String(!isValid));
      message.textContent = isValid ? '' : 'Please enter a valid email address.';
      message.classList.toggle('is-visible', !isValid);
      input.classList.toggle('is-error', !isValid);
      if(!isValid){
        input.focus();
        warningTimer = setTimeout(() => {
          message.classList.remove('is-visible');
          input.classList.remove('is-error');
          input.setAttribute('aria-invalid', 'false');
        }, 2000);
        return;
      }
      form.reset();
      input.setAttribute('aria-invalid', 'false');
      window.location.href = '404.html';
    });
  });
}

/* --------------------------------------------------------------------- */
/* Boot                                                                    */
/* --------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initCursor();
  initNavbarScroll();
  initSpotlight();
  initMagnetic();
  initPageTransitions();
  initLegalModal();
  initFooterNewsletters();
});

window.addEventListener('pageshow', resetRestoredPageTransition);
