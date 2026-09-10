/* ==========================================================================
   auth.js — frontend-only authentication for the Stackly demo project
   Users are stored in localStorage (persists across visits).
   The active session is stored in sessionStorage (clears when the tab closes).
   No backend / database is used, as required for this HTML/CSS/JS project.
   ========================================================================== */

const Auth = (function(){
  const USERS_KEY = 'stackly_users';
  const SESSION_KEY = 'stackly_session';

  function getUsers(){
    try{ return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    catch(e){ return []; }
  }
  function saveUsers(users){
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  /** Seed two demo accounts on first run so reviewers can log in immediately. */
  function seedDemoAccounts(){
    const users = getUsers();
    if(users.length) return;
    saveUsers([
      { name: 'Demo Admin', email: 'admin@stackly.com', phone: '', password: 'Admin@123', role: 'admin', createdAt: Date.now() },
      { name: 'Demo Customer', email: 'customer@stackly.com', phone: '', password: 'Customer@123', role: 'public', createdAt: Date.now() }
    ]);
  }

  /**
   * Register a new account.
   * @returns {{ok:boolean, error?:string}}
   */
  function register({ name, email, phone, password, role }){
    if(!['public', 'admin'].includes(role)) return { ok:false, error: 'Please choose an account type.' };
    const users = getUsers();
    const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);
    if(exists) return { ok:false, error: 'An account with this email already exists for this account type.' };
    users.push({ name, email, phone: phone || '', password, role, createdAt: Date.now() });
    saveUsers(users);
    return { ok:true };
  }

  /**
    * Attempt login for a given role. New emails are registered automatically
    * because this frontend-only demo has no backend account service.
    * @returns {{ok:boolean, error?:string, user?:object, isNewAccount?:boolean}}
   */
  function login({ email, password, role }){
    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());

    if(!user){
      const reg = register({ name: (email.split('@')[0] || 'Guest'), email, phone: '', password, role });
      if(!reg.ok) return reg;
      const newUser = getUsers().find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);
      setSession(newUser);
      return { ok:true, user: newUser, isNewAccount: true };
    }

    const loggedInUser = { ...user, role };
    setSession(loggedInUser);
    return { ok:true, user: loggedInUser };
  }

  function setSession(user){
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      name: user.name, email: user.email, role: user.role, loginAt: Date.now()
    }));
  }

  function getSession(){
    try{ return JSON.parse(sessionStorage.getItem(SESSION_KEY)); }
    catch(e){ return null; }
  }

  function isLoggedIn(){ return !!getSession(); }

  function logout(redirectTo){
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = redirectTo || 'login.html';
  }

  /**
   * Call at the very top of a protected page (in <head>, before body renders).
   * Redirects unauthenticated visitors to login, and redirects users with the
   * wrong role to their own dashboard instead of the one they tried to open.
   */
  function requireRole(role){
    const session = getSession();
    if(!session){
      window.location.replace('login.html');
      return null;
    }
    if(session.role !== role){
      window.location.replace(session.role === 'admin' ? 'admin-dashboard.html' : 'public-dashboard.html');
      return null;
    }
    return session;
  }

  seedDemoAccounts();

  return { register, login, logout, getSession, isLoggedIn, requireRole, seedDemoAccounts };
})();

window.Auth = Auth;
