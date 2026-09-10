/* ==========================================================================
   dashboard.js — data viz + interactions for admin & public dashboards
   ========================================================================== */

if(window.gsap && window.ScrollTrigger){ gsap.registerPlugin(ScrollTrigger); }

function animateDashCards(){
  document.querySelectorAll('.dash-card, .dash-panel, .dash-welcome, .reco-card').forEach((card, i) => {
    gsap.to(card, {
      opacity: 1, y: 0, duration: .7, delay: i * .04, ease: 'power3.out',
      scrollTrigger: { trigger: card, start: 'top 92%' }
    });
  });
}

function buildBarChart(container, values, labels){
  if(!container) return;
  const max = Math.max(...values);
  container.innerHTML = '';
  values.forEach((v, i) => {
    const col = document.createElement('div');
    col.className = 'bar-col';
    const bar = document.createElement('div');
    bar.className = 'bar' + (i % 2 === 1 ? ' alt' : '');
    bar.dataset.h = Math.round((v / max) * 100);
    const lbl = document.createElement('span');
    lbl.className = 'bar-lbl';
    lbl.textContent = labels[i];
    col.append(bar, lbl);
    container.appendChild(col);
  });
  ScrollTrigger.create({
    trigger: container, start: 'top 88%', once: true,
    onEnter(){
      container.querySelectorAll('.bar').forEach((bar, i) => {
        gsap.to(bar, { height: bar.dataset.h + '%', duration: 1, delay: i*.06, ease: 'power3.out' });
      });
    }
  });
}

function buildSparkline(svgEl, values){
  if(!svgEl) return;
  const w = 100, h = 30;
  const max = Math.max(...values), min = Math.min(...values);
  const pts = values.map((v,i) => {
    const x = (i/(values.length-1)) * w;
    const y = h - ((v-min)/(max-min || 1)) * h;
    return `${x},${y}`;
  }).join(' ');
  svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svgEl.innerHTML = `<polyline points="${pts}" />`;
  const path = svgEl.querySelector('polyline');
  const len = path.getTotalLength ? path.getTotalLength() : 200;
  path.style.strokeDasharray = len;
  path.style.strokeDashoffset = len;
  ScrollTrigger.create({
    trigger: svgEl, start: 'top 95%', once: true,
    onEnter(){ gsap.to(path, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.out' }); }
  });
}

function buildDonut(svgEl, segments){
  /* segments: [{value, color}] */
  if(!svgEl) return;
  const total = segments.reduce((s,seg) => s+seg.value, 0);
  const r = 40, c = 2*Math.PI*r;
  let offset = 0;
  svgEl.innerHTML = `<circle cx="52" cy="52" r="${r}" fill="none" stroke="rgba(23,20,15,.08)" stroke-width="14"></circle>`;
  segments.forEach(seg => {
    const frac = seg.value/total;
    const dash = frac * c;
    const circle = document.createElementNS('http://www.w3.org/2000/svg','circle');
    circle.setAttribute('cx','52'); circle.setAttribute('cy','52'); circle.setAttribute('r', r);
    circle.setAttribute('fill','none'); circle.setAttribute('stroke', seg.color);
    circle.setAttribute('stroke-width','14');
    circle.setAttribute('stroke-linecap','round');
    circle.setAttribute('transform','rotate(-90 52 52)');
    circle.style.strokeDasharray = `${dash} ${c-dash}`;
    circle.style.strokeDashoffset = c;
    circle.dataset.finalOffset = c - offset;
    circle.dataset.dash = dash + ' ' + (c-dash);
    svgEl.appendChild(circle);
    offset += dash;
  });
  ScrollTrigger.create({
    trigger: svgEl, start: 'top 92%', once: true,
    onEnter(){
      svgEl.querySelectorAll('circle[data-final-offset]').forEach(c => {
        gsap.to(c, { strokeDashoffset: +c.dataset.finalOffset, duration: 1.4, ease: 'power2.out' });
      });
    }
  });
}

function animateOrderTracking(){
  document.querySelectorAll('.track-line-fill').forEach(fill => {
    const stepsWrap = fill.closest('.track-card').querySelector('.track-steps');
    const steps = stepsWrap.querySelectorAll('.track-step');
    const doneCount = stepsWrap.querySelectorAll('.track-step.is-done').length;
    const currentBonus = stepsWrap.querySelector('.track-step.is-current') ? .5 : 0;
    const pct = ((doneCount + currentBonus) / (steps.length-1)) * 100;
    gsap.to(fill, { width: Math.min(pct,100) + '%', duration: 1.4, ease: 'power2.out', delay: .3 });
  });
}

function animateCountersOnView(){
  document.querySelectorAll('[data-dash-count]').forEach(el => {
    ScrollTrigger.create({
      trigger: el, start: 'top 95%', once: true,
      onEnter(){
        const target = parseFloat(el.dataset.dashCount);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target, duration: 1.5, ease: 'power2.out',
          onUpdate(){ el.textContent = (el.dataset.prefix||'') + Math.round(obj.v).toLocaleString() + (el.dataset.suffix||''); }
        });
      }
    });
  });
}

function initPopularBars(){
  document.querySelectorAll('.pr-bar span').forEach((bar, i) => {
    ScrollTrigger.create({
      trigger: bar, start: 'top 95%', once: true,
      onEnter(){ gsap.to(bar, { width: bar.dataset.pct + '%', duration: 1, delay: i*.05, ease: 'power3.out' }); }
    });
  });
}

function initSidebarNav(){
  const items = document.querySelectorAll('.dash-nav-item[data-scroll]');
  const sections = document.querySelectorAll('.dash-main > section[id]');
  if(!items.length || !sections.length) return;

  function showSection(target){
    sections.forEach(section => {
      section.classList.toggle('is-dashboard-hidden', '#' + section.id !== target);
    });
    items.forEach(item => item.classList.toggle('is-active', item.dataset.scroll === target));
  }

  const initialTarget = window.location.hash && document.querySelector(window.location.hash)
    ? window.location.hash
    : '#dashboard';
  showSection(initialTarget);

  items.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const target = item.dataset.scroll;
      if(!document.querySelector(target)) return;
      showSection(target);
      history.replaceState(null, '', target);
      document.querySelector('.dash-main')?.scrollTo({ top: 0, behavior: 'instant' });
    }, true); // capture phase: runs before any other click listener (e.g. main.js smooth-scroll)
  });
}

function initDashRange(){
  document.querySelectorAll('.dash-range').forEach(group => {
    group.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        group.querySelectorAll('button').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
      });
    });
  });
}

function initDashSidebarMobile(){
  const sidebar = document.querySelector('.dash-sidebar');
  const hamburger = document.querySelector('.dash-hamburger');
  const overlay = document.querySelector('.dash-sidebar-overlay');
  const closeBtn = document.querySelector('.dash-sidebar-close');
  if(!sidebar || !hamburger) return;

  function open(){
    sidebar.classList.add('is-open');
    hamburger.classList.add('is-open');
    overlay?.classList.add('is-open');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }
  function close(){
    sidebar.classList.remove('is-open');
    hamburger.classList.remove('is-open');
    overlay?.classList.remove('is-open');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }
  hamburger.addEventListener('click', () => {
    sidebar.classList.contains('is-open') ? close() : open();
  });
  overlay?.addEventListener('click', close);
  closeBtn?.addEventListener('click', close);
  sidebar.querySelectorAll('.dash-nav-item').forEach(item => item.addEventListener('click', close));
  window.addEventListener('keydown', (e) => { if(e.key === 'Escape') close(); });
  window.addEventListener('resize', () => { if(window.innerWidth > 860) close(); });
}

function initLogoutButtons(){
  document.querySelectorAll('[data-logout]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if(window.Auth) Auth.logout('login.html');
      else window.location.href = 'login.html';
    });
  });
}

function personalizeDashboard(){
  const session = (window.Auth && Auth.getSession()) || null;
  if(!session) return;
  document.querySelectorAll('[data-user-name]').forEach(el => { el.textContent = session.name; });
  document.querySelectorAll('[data-user-email]').forEach(el => { el.textContent = session.email; });
  document.querySelectorAll('[data-user-role]').forEach(el => { el.textContent = session.role === 'admin' ? 'Administrator' : 'Customer'; });
  document.querySelectorAll('[data-user-first]').forEach(el => { el.textContent = (session.name || '').split(' ')[0] || session.name; });
}

document.addEventListener('DOMContentLoaded', () => {
  animateDashCards();
  animateOrderTracking();
  animateCountersOnView();
  initPopularBars();
  initSidebarNav();
  initDashRange();
  initDashSidebarMobile();
  initLogoutButtons();
  personalizeDashboard();

  const rev = document.getElementById('revenue-bar-chart');
  if(rev) buildBarChart(rev, [1200,1900,1500,2400,2100,2800,3200], ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']);

  document.querySelectorAll('.sparkline').forEach((svg, i) => {
    const sets = [[4,7,5,9,8,12,11],[2,3,3,5,4,6,8],[9,7,8,6,7,5,4],[3,5,4,7,9,8,10]];
    buildSparkline(svg, sets[i % sets.length]);
  });

  const donut = document.getElementById('orders-donut');
  if(donut) buildDonut(donut, [
    { value: 48, color: '#E85D2C' },
    { value: 27, color: '#2F5D50' },
    { value: 15, color: '#35618C' },
    { value: 10, color: '#D9D2C2' }
  ]);
});
