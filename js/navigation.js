/* ==========================================================================
   navigation.js — mobile menu + active link
   ========================================================================== */

function setActiveNavLink(){
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu-links a').forEach(a => {
    const href = (a.getAttribute('href') || '').split('#')[0];
    const normalizedHref = href === '' || href === '/' ? 'index.html' : href;
    if(normalizedHref === path){
      a.classList.add('is-active');
      a.setAttribute('aria-current', 'page');
    }
  });
}

function initMobileMenu(){
  const hamburger = document.querySelector('.hamburger');
  const menu = document.querySelector('.mobile-menu');
  const closeBtn = document.querySelector('.mobile-menu .close-btn');
  if(!hamburger || !menu) return;

  const links = menu.querySelectorAll('.mobile-menu-links a, .mobile-menu-actions a');
  gsap.set(links, { y: 40, opacity: 0 });

  function openMenu(){
    document.body.classList.add('menu-open');
    hamburger.classList.add('is-open');
    menu.classList.add('is-open');
    gsap.timeline()
      .to(menu, { y: '0%', duration: .6, ease: 'power4.inOut' })
      .to(links, { y: 0, opacity: 1, duration: .55, stagger: .06, ease: 'power3.out' }, '-=.25');
  }
  function closeMenu(){
    gsap.timeline({
      onComplete(){
        document.body.classList.remove('menu-open');
        hamburger.classList.remove('is-open');
        menu.classList.remove('is-open');
        gsap.set(links, { y: 40, opacity: 0 });
      }
    }).to(menu, { y: '-100%', duration: .5, ease: 'power3.inOut' });
  }

  hamburger.addEventListener('click', () => {
    menu.classList.contains('is-open') ? closeMenu() : openMenu();
  });
  closeBtn?.addEventListener('click', closeMenu);
  links.forEach(l => l.addEventListener('click', closeMenu));
  window.addEventListener('keydown', (e) => { if(e.key === 'Escape' && menu.classList.contains('is-open')) closeMenu(); });
}

document.addEventListener('DOMContentLoaded', () => {
  setActiveNavLink();
  initMobileMenu();
});
