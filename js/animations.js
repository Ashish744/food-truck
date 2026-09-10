/* ==========================================================================
   animations.js — scroll-driven & interaction-driven motion
   ========================================================================== */

if(window.gsap && window.ScrollTrigger){ gsap.registerPlugin(ScrollTrigger); }
const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* --------------------------------------------------------------------- */
/* Text helpers — split into words / letters (no paid SplitText needed)   */
/* --------------------------------------------------------------------- */
function splitIntoWords(el){
  const text = el.textContent.trim();
  el.innerHTML = '';
  text.split(' ').forEach((word, i, arr) => {
    const outer = document.createElement('span');
    outer.className = 'w-outer';
    outer.style.display = 'inline-block';
    outer.style.overflow = 'hidden';
    const inner = document.createElement('span');
    inner.className = 'w-inner';
    inner.style.display = 'inline-block';
    inner.textContent = word + (i < arr.length-1 ? '\u00A0' : '');
    outer.appendChild(inner);
    el.appendChild(outer);
  });
  return el.querySelectorAll('.w-inner');
}

function splitLineWords(lineEl){
  const words = lineEl.textContent.trim().split(' ');
  lineEl.innerHTML = '';
  words.forEach((w, i) => {
    const span = document.createElement('span');
    span.textContent = w + (i < words.length-1 ? '\u00A0' : '');
    lineEl.appendChild(span);
  });
  return lineEl.querySelectorAll('span');
}

function scrambleText(el, finalText, duration = 1.1){
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  if(RM){ el.textContent = finalText; return; }
  const obj = { progress: 0 };
  gsap.to(obj, {
    progress: 1, duration, ease: 'power1.inOut',
    onUpdate(){
      let out = '';
      const revealCount = Math.floor(obj.progress * finalText.length);
      for(let i=0; i<finalText.length; i++){
        if(i < revealCount || finalText[i] === ' ') out += finalText[i];
        else out += chars[Math.floor(Math.random()*chars.length)];
      }
      el.textContent = out;
    },
    onComplete(){ el.textContent = finalText; }
  });
}

function morphWords(el, words, interval = 2200){
  if(!el || RM){ if(el && words[0]) el.textContent = words[0]; return; }
  let i = 0;
  el.textContent = words[0];
  setInterval(() => {
    i = (i+1) % words.length;
    gsap.timeline()
      .to(el, { yPercent: -110, opacity: 0, duration: .35, ease: 'power2.in' })
      .call(() => { el.textContent = words[i]; })
      .fromTo(el, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .45, ease: 'power2.out' });
  }, interval);
}

function countUp(el, target, opts = {}){
  const obj = { val: 0 };
  const decimals = opts.decimals || 0;
  gsap.to(obj, {
    val: target, duration: opts.duration || 1.8, ease: 'power2.out',
    scrollTrigger: opts.scrollTrigger,
    onUpdate(){ el.textContent = obj.val.toFixed(decimals) + (opts.suffix || ''); }
  });
}

/* --------------------------------------------------------------------- */
/* Hero                                                                    */
/* --------------------------------------------------------------------- */
function initHero(){
  const hero = document.querySelector('.hero');
  if(!hero) return;

  hero.querySelectorAll('.hero-title .line').forEach(splitLineWords);
  const words = hero.querySelectorAll('.hero-title .line span');

  const tl = gsap.timeline({ delay: .1, defaults: { ease: 'power4.out' } });
  tl.from(hero.querySelectorAll('.hero-status'), { opacity: 0, y: 14, duration: .6 })
    .from(words, { yPercent: 120, opacity: 0, duration: 1, stagger: .045 }, '-=.3')
    .from(hero.querySelector('.hero-desc'), { opacity: 0, y: 16, duration: .7 }, '-=.5')
    .from(hero.querySelectorAll('.hero-ctas .btn'), { opacity: 0, y: 16, duration: .6, stagger: .1 }, '-=.5')
    .from(hero.querySelector('.hero-visual-frame'), { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.1, ease: 'power3.inOut' }, '-=.9')
    .from(hero.querySelectorAll('.float-card, .float-ingredient'), { opacity: 0, y: 30, scale: .85, duration: .8, stagger: .1 }, '-=.6')
    .from(hero.querySelectorAll('.hero-stat'), { opacity: 0, y: 14, duration: .6, stagger: .12 }, '-=.5');

  hero.querySelectorAll('.hero-stat .num[data-count]').forEach(el => {
    countUp(el, parseFloat(el.dataset.count), { suffix: el.dataset.suffix || '', decimals: el.dataset.decimals ? +el.dataset.decimals : 0, duration: 1.6 });
  });

  /* mouse-follow parallax on hero visual */
  if(!RM && window.matchMedia('(hover:hover)').matches){
    const layer = hero.querySelector('.hero-visual');
    if(layer){
      hero.addEventListener('mousemove', (e) => {
        const r = hero.getBoundingClientRect();
        const x = (e.clientX - r.left)/r.width - .5;
        const y = (e.clientY - r.top)/r.height - .5;
        gsap.to(layer, { rotateY: x*6, rotateX: -y*6, duration: .6, ease: 'power2.out', transformPerspective: 900 });
        gsap.to(hero.querySelectorAll('.float-ingredient'), { x: x*20, y: y*20, duration: .8, ease: 'power2.out' });
      });
    }
  }
}

/* --------------------------------------------------------------------- */
/* Section heading blur-to-sharp reveal (used broadly, subtle)            */
/* --------------------------------------------------------------------- */
function initHeadingReveal(){
  document.querySelectorAll('.section-head').forEach(head => {
    gsap.from(head.children, {
      opacity: 0, y: 24, filter: 'blur(6px)', duration: .9, ease: 'power3.out', stagger: .1,
      scrollTrigger: { trigger: head, start: 'top 85%' }
    });
  });
}

/* --------------------------------------------------------------------- */
/* Story — sticky scroll storytelling                                     */
/* --------------------------------------------------------------------- */
function initStory(){
  const story = document.querySelector('.story');
  if(!story) return;
  const media = story.querySelector('.story-media img');
  const panels = story.querySelectorAll('.story-panel');

  gsap.fromTo(story.querySelector('.story-media'), { clipPath: 'inset(0% 0% 100% 0%)' }, {
    clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power3.out',
    scrollTrigger: { trigger: story, start: 'top 70%' }
  });

  panels.forEach((panel, i) => {
    gsap.from(panel.children, {
      opacity: 0, y: 40, duration: .9, ease: 'power3.out', stagger: .08,
      scrollTrigger: { trigger: panel, start: 'top 78%' }
    });
    if(media){
      ScrollTrigger.create({
        trigger: panel, start: 'top 55%', end: 'bottom 55%',
        onEnter: () => gsap.to(media, { opacity: 1, scale: 1, duration: .6 }),
        onEnterBack: () => panels.forEach((p,pi) => { if(pi===i) gsap.to(media,{opacity:1,duration:.4}); })
      });
    }
  });
}

/* --------------------------------------------------------------------- */
/* Menu cards — entrance + 3D tilt                                        */
/* --------------------------------------------------------------------- */
function initMenu(){
  const cards = document.querySelectorAll('.menu-card');
  if(!cards.length) return;
  cards.forEach(card => {
    card.querySelector('.icon-btn')?.addEventListener('click', (event) => {
      event.preventDefault();
      window.location.href = '404.html';
    });
  });
  gsap.from(cards, {
    opacity: 0, y: 50, duration: .8, ease: 'power3.out', stagger: .08,
    scrollTrigger: { trigger: '.menu-grid', start: 'top 82%' }
  });
  if(RM || window.matchMedia('(hover:none)').matches) return;
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left)/r.width - .5;
      const y = (e.clientY - r.top)/r.height - .5;
      gsap.to(card, { rotateY: x*8, rotateX: -y*8, duration: .4, ease: 'power2.out', transformPerspective: 700 });
    });
    card.addEventListener('mouseleave', () => gsap.to(card, { rotateY: 0, rotateX: 0, duration: .6, ease: 'power3.out' }));
  });

  const tabs = document.querySelectorAll('.menu-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      const cat = tab.dataset.cat;
      cards.forEach(card => {
        const show = cat === 'all' || card.dataset.cat === cat;
        gsap.to(card, { opacity: show ? 1 : 0, scale: show ? 1 : .92, height: show ? 'auto' : 0, duration: .35, onStart(){ if(show) card.style.display='block'; }, onComplete(){ if(!show) card.style.display='none'; } });
      });
    });
  });
}

/* --------------------------------------------------------------------- */
/* Horizontal scroll experience                                           */
/* --------------------------------------------------------------------- */
function initHorizontalScroll(){
  const pin = document.querySelector('.h-pin');
  const track = document.querySelector('.h-track');
  if(!pin || !track) return;

  function build(){
    ScrollTrigger.getById('h-scroll')?.kill();
    gsap.set(track, { x: 0 });
    const distance = track.scrollWidth - window.innerWidth + 80;
    if(distance <= 0) return;
    gsap.to(track, {
      x: -distance, ease: 'none',
      scrollTrigger: {
        id: 'h-scroll', trigger: pin, start: 'top top', end: () => '+=' + (distance + window.innerHeight),
        scrub: .6, pin: true, anticipatePin: 1, invalidateOnRefresh: true
      }
    });
  }
  build();
  window.addEventListener('resize', () => { clearTimeout(window._hrz); window._hrz = setTimeout(build, 250); });
}

/* --------------------------------------------------------------------- */
/* Timeline — how it works                                                */
/* --------------------------------------------------------------------- */
function initTimeline(){
  const line = document.querySelector('.timeline-line-fill');
  const steps = document.querySelectorAll('.timeline-step');
  if(!steps.length) return;

  steps.forEach(step => {
    gsap.from(step, {
      opacity: 0, x: -30, duration: .8, ease: 'power3.out',
      scrollTrigger: { trigger: step, start: 'top 80%' }
    });
    ScrollTrigger.create({
      trigger: step, start: 'top 60%', end: 'bottom 60%',
      onEnter: () => step.classList.add('is-active'),
      onEnterBack: () => step.classList.add('is-active')
    });
  });
  if(line){
    gsap.to(line, {
      height: '100%', ease: 'none',
      scrollTrigger: { trigger: '.timeline', start: 'top 60%', end: 'bottom 70%', scrub: .5 }
    });
  }
}

/* --------------------------------------------------------------------- */
/* Offers — flip cards entrance                                           */
/* --------------------------------------------------------------------- */
function initOffers(){
  const cards = document.querySelectorAll('.offer-card');
  if(!cards.length) return;
  gsap.from(cards, {
    opacity: 0, y: 40, scale: .94, duration: .7, stagger: .08, ease: 'power3.out',
    scrollTrigger: { trigger: '.offers-grid', start: 'top 85%' }
  });
}

/* --------------------------------------------------------------------- */
/* Locations                                                              */
/* --------------------------------------------------------------------- */
function initLocations(){
  const rows = document.querySelectorAll('.location-row');
  if(!rows.length) return;
  gsap.from(rows, {
    opacity: 0, y: 24, duration: .6, stagger: .07, ease: 'power3.out',
    scrollTrigger: { trigger: '.locations-list', start: 'top 85%' }
  });
  rows.forEach(row => {
    const bg = row.querySelector('.location-bg');
    if(!bg || !row.dataset.bg) return;
    bg.style.backgroundImage = `url(${row.dataset.bg})`;
  });
}

/* --------------------------------------------------------------------- */
/* Testimonials marquee                                                   */
/* --------------------------------------------------------------------- */
function initTestimonials(){
  const track = document.querySelector('.testimonial-track');
  if(!track) return;
  track.innerHTML += track.innerHTML;
  track.style.animation = `marquee-scroll ${RM ? 0 : 34}s linear infinite`;
}

/* --------------------------------------------------------------------- */
/* Gallery bento                                                          */
/* --------------------------------------------------------------------- */
function initGallery(){
  const items = document.querySelectorAll('.bento-item');
  if(!items.length) return;
  gsap.from(items, {
    opacity: 0, scale: .9, clipPath: 'inset(20% 20% 20% 20%)', duration: .8, stagger: .06, ease: 'power3.out',
    scrollTrigger: { trigger: '.bento', start: 'top 85%' }
  });
}

/* --------------------------------------------------------------------- */
/* Final CTA — kinetic / particle-style headline                          */
/* --------------------------------------------------------------------- */
function initFinalCTA(){
  const cta = document.querySelector('.final-cta');
  if(!cta) return;
  const heading = cta.querySelector('h2');
  if(heading){
    const letters = splitIntoWords(heading);
    gsap.from(letters, {
      opacity: 0,
      x: () => gsap.utils.random(-120, 120),
      y: () => gsap.utils.random(-80, 80),
      rotate: () => gsap.utils.random(-40, 40),
      duration: 1.1, stagger: .05, ease: 'power3.out',
      scrollTrigger: { trigger: cta, start: 'top 75%' }
    });
  }
  gsap.from(cta.querySelectorAll('.cta-actions .btn, .final-cta > .container > p'), {
    opacity: 0, y: 20, duration: .7, stagger: .08,
    scrollTrigger: { trigger: cta, start: 'top 60%' }
  });
  gsap.to(cta.querySelectorAll('.cta-float'), {
    y: () => gsap.utils.random(-16, 16), x: () => gsap.utils.random(-12,12),
    duration: () => gsap.utils.random(3,5), repeat: -1, yoyo: true, ease: 'sine.inOut'
  });

  const morphEl = cta.querySelector('[data-morph]');
  if(morphEl) morphWords(morphEl, ['EAT', 'EXPLORE', 'ENJOY']);
}

/* --------------------------------------------------------------------- */
/* Decorative particles                                                   */
/* --------------------------------------------------------------------- */
function initParticles(container, count = 16){
  if(!container || RM) return;
  for(let i=0; i<count; i++){
    const p = document.createElement('span');
    p.className = 'particle';
    p.style.cssText = `position:absolute; width:${3+Math.random()*3}px; height:${3+Math.random()*3}px; border-radius:50%; background:rgba(255,248,239,.5); left:${Math.random()*100}%; top:${Math.random()*100}%; --pdx:${(Math.random()*80-40)}px; --pdy:${-(80+Math.random()*100)}px; animation: particleDrift ${5+Math.random()*4}s ease-in ${Math.random()*4}s infinite;`;
    container.appendChild(p);
  }
}

/* --------------------------------------------------------------------- */
/* Reveal-on-scroll generic (blog cards, service cards, gallery, etc.)    */
/* --------------------------------------------------------------------- */
function initGenericReveal(){
  document.querySelectorAll('[data-reveal]').forEach(el => {
    gsap.from(el, {
      opacity: 0, y: 32, duration: .8, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });
  const groups = document.querySelectorAll('[data-reveal-group]');
  groups.forEach(group => {
    gsap.from(group.children, {
      opacity: 0, y: 32, duration: .7, stagger: .08, ease: 'power3.out',
      scrollTrigger: { trigger: group, start: 'top 85%' }
    });
  });
}

/* --------------------------------------------------------------------- */
/* Services — expandable cards                                            */
/* --------------------------------------------------------------------- */
function initServiceCards(){
  document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if(e.target.closest('a')) return;
      card.classList.toggle('is-open');
    });
  });
}

/* --------------------------------------------------------------------- */
/* Blog category tabs                                                     */
/* --------------------------------------------------------------------- */
function initBlogTabs(){
  const tabs = document.querySelectorAll('.blog-tabs .menu-tab');
  const cards = document.querySelectorAll('.blog-card');
  if(!tabs.length) return;
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      const cat = tab.dataset.cat;
      cards.forEach(card => {
        const show = cat === 'all' || card.dataset.cat === cat;
        card.style.display = show ? '' : 'none';
      });
    });
  });
}

/* --------------------------------------------------------------------- */
/* Boot — wait for loader so entrance timings feel intentional            */
/* --------------------------------------------------------------------- */
function bootAnimations(){
  initHero();
  initHeadingReveal();
  initStory();
  initMenu();
  initHorizontalScroll();
  initTimeline();
  initOffers();
  initLocations();
  initTestimonials();
  initGallery();
  initFinalCTA();
  initGenericReveal();
  initServiceCards();
  initBlogTabs();
  document.querySelectorAll('[data-particles]').forEach(el => initParticles(el, +el.dataset.particles || 16));
  ScrollTrigger.refresh();
}

if(document.body.classList.contains('is-ready')){
  bootAnimations();
} else {
  document.addEventListener('roam:loaded', bootAnimations, { once: true });
}
