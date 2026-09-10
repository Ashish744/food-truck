/* ==========================================================================
   validation.js — shared validation logic for every form on the site
   ========================================================================== */

const ROAMValidate = {
  namePattern: /^[A-Za-z\u00C0-\u017F][A-Za-z\u00C0-\u017F' -]{0,48}$/,
  emailPattern: /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/,
  phonePattern: /^[+]?[0-9\s()-]{7,16}$/,

  isValidName(value){
    const v = (value || '').trim();
    if(!v) return false;
    if(/\s{2,}/.test(v)) return false;
    return this.namePattern.test(v);
  },
  isValidEmail(value){
    const v = (value || '').trim();
    if(!v || v.length > 254) return false;
    if(v.indexOf(' ') !== -1) return false;
    if(v.indexOf('..') !== -1) return false;
    const parts = v.split('@');
    if(parts.length !== 2) return false;
    const domain = parts[1];
    if(!domain.includes('.')) return false;
    if(domain.startsWith('.') || domain.endsWith('.')) return false;
    return this.emailPattern.test(v);
  },
  isValidPhone(value){
    const v = (value || '').trim();
    if(!v) return false;
    return this.phonePattern.test(v);
  },
  isValidPassword(value){
    return (value || '').length >= 8;
  },
  passwordScore(value){
    const v = value || '';
    let score = 0;
    if(v.length >= 8) score++;
    if(v.length >= 12) score++;
    if(/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
    if(/[0-9]/.test(v)) score++;
    if(/[^A-Za-z0-9]/.test(v)) score++;
    if(score <= 1) return { level: 'weak', pct: 33 };
    if(score <= 3) return { level: 'medium', pct: 66 };
    return { level: 'strong', pct: 100 };
  }
};

/* ---- Field UI helpers ------------------------------------------------- */
function setFieldState(fieldEl, isValid, message){
  const msgEl = fieldEl.querySelector('.field-msg');
  fieldEl.classList.toggle('is-error', !isValid);
  fieldEl.classList.toggle('is-success', isValid);
  if(msgEl) msgEl.textContent = isValid ? '' : (message || '');
}
function clearFieldState(fieldEl){
  fieldEl.classList.remove('is-error', 'is-success');
  const msgEl = fieldEl.querySelector('.field-msg');
  if(msgEl) msgEl.textContent = '';
}

/* ---- Password show/hide ------------------------------------------------ */
function initPasswordToggles(){
  document.querySelectorAll('.pw-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      if(!input) return;
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      btn.classList.toggle('is-shown', !showing);
      if(window.gsap){
        gsap.fromTo(btn, { scale: .7, rotate: showing ? 0 : -10 }, { scale: 1, rotate: 0, duration: .35, ease: 'back.out(2)' });
      }
    });
  });
}

/* ---- Password strength meter ------------------------------------------- */
function initPasswordStrength(inputId, meterSelector, labelSelector){
  const input = document.getElementById(inputId);
  const bars = document.querySelectorAll(meterSelector + ' i');
  const label = document.querySelector(labelSelector);
  if(!input || !bars.length) return;
  input.addEventListener('input', () => {
    const { level, pct } = ROAMValidate.passwordScore(input.value);
    const colors = { weak: '#E14848', medium: '#E8A22C', strong: '#4F8A76' };
    const filled = input.value.length === 0 ? 0 : (level === 'weak' ? 1 : level === 'medium' ? 2 : 3);
    bars.forEach((bar, i) => { bar.style.background = i < filled ? colors[level] : ''; });
    if(label) label.textContent = input.value.length === 0 ? '' : `Password strength: ${level}`;
  });
}

/* ---- Field-level live validation wiring --------------------------------- */
function wireField(inputId, fieldSelectorPrefix, validatorFn, message){
  const input = document.getElementById(inputId);
  if(!input) return null;
  const field = input.closest('.field');
  const check = () => {
    if(input.value.trim() === '' ){ clearFieldState(field); return null; }
    const valid = validatorFn(input.value);
    setFieldState(field, valid, message);
    return valid;
  };
  input.addEventListener('blur', check);
  input.addEventListener('input', () => { if(field.classList.contains('is-error')) check(); });
  return check;
}

/* ---- CONTACT FORM -------------------------------------------------------- */
function setupContactForm(){
  const form = document.getElementById('contact-form');
  if(!form) return;
  const checkFirst = wireField('c-first', null, ROAMValidate.isValidName.bind(ROAMValidate), 'Letters only, no numbers or symbols.');
  const checkLast = wireField('c-last', null, ROAMValidate.isValidName.bind(ROAMValidate), 'Letters only, no numbers or symbols.');
  const checkEmail = wireField('c-email', null, ROAMValidate.isValidEmail.bind(ROAMValidate), 'Please enter a valid email address.');
  const checkPhone = wireField('c-phone', null, ROAMValidate.isValidPhone.bind(ROAMValidate), 'Please enter a valid phone number.');
  const checkSubject = wireField('c-subject', null, v => v.trim().length > 2, 'Give your message a subject.');
  const checkMessage = wireField('c-message', null, v => v.trim().length > 9, 'Message should be at least 10 characters.');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const results = [checkFirst?.(), checkLast?.(), checkEmail?.(), checkSubject?.(), checkMessage?.()];
    if(document.getElementById('c-phone').value.trim() !== '') results.push(checkPhone?.());
    if(results.some(r => r === false || r === null)) return;
    const emailField = document.getElementById('c-email');
    if(!ROAMValidate.isValidEmail(emailField.value.trim())){
      setFieldState(emailField.closest('.field'), false, 'Please enter a valid email address.');
      return;
    }
    form.reset();
    form.querySelectorAll('.field').forEach(clearFieldState);
    showFormSuccess(form, 'Message sent — we\u2019ll get back to you within a day.', () => {
      window.location.href = '404.html';
    });
  });
}

/* ---- Account type tabs (login & create-account) ---------------------- */
function initRoleTabs(containerId, hiddenInputId, onChange){
  const container = document.getElementById(containerId);
  if(!container) return;
  const hidden = document.getElementById(hiddenInputId);
  const tabs = container.querySelectorAll('.role-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      const role = tab.dataset.role;
      container.dataset.active = role;
      if(hidden) hidden.value = role;
      if(onChange) onChange(role);
    });
  });
}

function showAuthAlert(elId, message, isSuccess){
  const el = document.getElementById(elId);
  if(!el) return;
  el.textContent = message;
  el.classList.toggle('is-success', !!isSuccess);
  el.classList.add('is-visible');
}
function hideAuthAlert(elId){
  document.getElementById(elId)?.classList.remove('is-visible');
}

function showAuthSpinner(text){
  const overlay = document.getElementById('auth-spinner');
  if(!overlay) return;
  const label = document.getElementById('auth-spinner-text');
  if(label && text) label.textContent = text;
  overlay.classList.add('is-active');
}

/* ---- LOGIN FORM ------------------------------------------------------------ */
function setupLoginForm(){
  const form = document.getElementById('login-form');
  if(!form) return;

  initRoleTabs('login-role-tabs', 'l-role', (role) => {
    const label = document.getElementById('login-role-label');
    if(label) label.textContent = role === 'admin' ? 'Admin' : 'Public';
    hideAuthAlert('login-alert');
  });

  const checkEmail = wireField('l-email', null, ROAMValidate.isValidEmail.bind(ROAMValidate), 'Please enter a valid email address.');
  const checkPassword = wireField('l-password', null, ROAMValidate.isValidPassword.bind(ROAMValidate), 'Password must be at least 8 characters.');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    hideAuthAlert('login-alert');
    const email = document.getElementById('l-email').value.trim();
    const password = document.getElementById('l-password').value;
    const role = document.getElementById('l-role').value;

    if(email === '' || password === ''){
      if(email === '') setFieldState(document.getElementById('l-email').closest('.field'), false, 'Email is required.');
      if(password === '') setFieldState(document.getElementById('l-password').closest('.field'), false, 'Password is required.');
      showAuthAlert('login-alert', 'Please fill in both fields.');
      return;
    }
    const r1 = checkEmail(); const r2 = checkPassword();
    if(r1 === false || r2 === false) return;
    if(!ROAMValidate.isValidEmail(email)){
      setFieldState(document.getElementById('l-email').closest('.field'), false, 'Please enter a valid email address.');
      showAuthAlert('login-alert', 'Please enter a valid email address.');
      return;
    }

    if(!window.Auth){ showAuthAlert('login-alert', 'Authentication is unavailable right now.'); return; }
    const result = Auth.login({ email, password, role });
    if(!result.ok){
      showAuthAlert('login-alert', result.error || 'Incorrect account type or credentials.');
      return;
    }

    showAuthAlert('login-alert', result.isNewAccount ? 'New account created — logging you in\u2026' : 'Login successful — redirecting\u2026', true);
    showAuthSpinner(role === 'admin' ? 'Opening admin dashboard\u2026' : 'Opening your dashboard\u2026');
    setTimeout(() => {
      window.location.href = role === 'admin' ? 'admin-dashboard.html' : 'public-dashboard.html';
    }, 900);
  });
}

/* ---- CREATE ACCOUNT FORM ---------------------------------------------------- */
function setupCreateAccountForm(){
  const form = document.getElementById('create-account-form');
  if(!form) return;

  initRoleTabs('signup-role-tabs', 'a-role', () => hideAuthAlert('signup-alert'));

  const checkName = wireField('a-name', null, ROAMValidate.isValidName.bind(ROAMValidate), 'Letters only, no numbers or symbols.');
  const checkEmail = wireField('a-email', null, ROAMValidate.isValidEmail.bind(ROAMValidate), 'Please enter a valid email address.');
  const checkPhone = wireField('a-phone', null, ROAMValidate.isValidPhone.bind(ROAMValidate), 'Please enter a valid phone number.');
  const checkPassword = wireField('a-password', null, ROAMValidate.isValidPassword.bind(ROAMValidate), 'Use at least 8 characters.');

  const confirmInput = document.getElementById('a-confirm');
  const confirmField = confirmInput?.closest('.field');
  function checkConfirm(){
    if(confirmInput.value.trim() === ''){ clearFieldState(confirmField); return null; }
    const valid = confirmInput.value === document.getElementById('a-password').value && confirmInput.value.length >= 8;
    setFieldState(confirmField, valid, 'Passwords don\u2019t match.');
    return valid;
  }
  confirmInput?.addEventListener('blur', checkConfirm);
  confirmInput?.addEventListener('input', () => { if(confirmField.classList.contains('is-error')) checkConfirm(); });
  document.getElementById('a-password')?.addEventListener('input', () => { if(confirmInput.value) checkConfirm(); });

  initPasswordStrength('a-password', '.pw-strength', '.pw-strength-label');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    hideAuthAlert('signup-alert');
    const results = [checkName?.(), checkEmail?.(), checkPassword?.(), checkConfirm()];
    if(document.getElementById('a-phone').value.trim() !== '') results.push(checkPhone?.());
    const terms = document.getElementById('a-terms');
    if(terms && !terms.checked){
      terms.closest('.checkbox-row').style.color = '#E14848';
      showAuthAlert('signup-alert', 'Please agree to the Terms & Privacy Policy to continue.');
      return;
    }
    if(results.some(r => r === false || r === null)){
      showAuthAlert('signup-alert', 'Please fix the highlighted fields.');
      return;
    }

    const role = document.getElementById('a-role').value;
    const payload = {
      name: document.getElementById('a-name').value.trim(),
      email: document.getElementById('a-email').value.trim(),
      phone: document.getElementById('a-phone').value.trim(),
      password: document.getElementById('a-password').value,
      role
    };
    if(!window.Auth){ showAuthAlert('signup-alert', 'Authentication is unavailable right now.'); return; }
    const result = Auth.register(payload);
    if(!result.ok){
      showAuthAlert('signup-alert', result.error || 'Could not create your account.');
      return;
    }

    showAuthAlert('signup-alert', 'Account created successfully! Redirecting to log in\u2026', true);
    showAuthSpinner('Setting up your account\u2026');
    setTimeout(() => {
      window.location.href = 'login.html?role=' + role + '&registered=1';
    }, 1100);
  });
}

/* ---- Shared success state --------------------------------------------- */
function showFormSuccess(form, message, after){
  const btn = form.querySelector('button[type="submit"]');
  const original = btn ? btn.innerHTML : '';
  if(btn){ btn.innerHTML = message; btn.disabled = true; }
  if(window.gsap) gsap.fromTo(form, { opacity: .6 }, { opacity: 1, duration: .4 });
  setTimeout(() => {
    if(after){ after(); }
    else if(btn){ btn.innerHTML = original; btn.disabled = false; form.reset(); form.querySelectorAll('.field').forEach(clearFieldState); }
  }, 1400);
}

document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggles();
  setupContactForm();
  setupLoginForm();
  setupCreateAccountForm();
});
