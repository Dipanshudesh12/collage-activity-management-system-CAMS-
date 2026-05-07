/* ================================================================
   AUTH.JS — Django Version
   ================================================================ */

const AUTH = (() => {

  function getSession() {
    const s = localStorage.getItem('cams_session');
    return s ? JSON.parse(s) : null;
  }

  function setSession(user) {
    localStorage.setItem(
      'cams_session',
      JSON.stringify(user)
    );
  }

  function clearSession() {
    localStorage.removeItem('cams_session');
  }

  function isLoggedIn() {
    return !!getSession();
  }

  function getCurrentUser() {
    return getSession();
  }

  function requireAuth(roles = []) {

    const user = getSession();

    if (!user) {
      window.location.href = '/login/';
      return false;
    }

    if (roles.length && !roles.includes(user.role)) {
      window.location.href = getDashboardUrl(user.role);
      return false;
    }

    return true;
  }

  function getDashboardUrl(role) {

    const map = {
      admin: '/coordinator-dashboard/',
      coordinator: '/coordinator-dashboard/',
      student: '/student-dashboard/'
    };

    return map[role] || '/login/';
  }

  function redirectIfLoggedIn() {
    
    return;

    const user = getSession();

    if (user) {
      window.location.href = getDashboardUrl(user.role);
    }
  }

  async function login(email, password) {

    try {

      const res = await fetch('/login/', {

        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await res.json();

      if (data.ok) {
        setSession(data.user);
      }

      return data;

    } catch(err) {

      return {
        ok:false,
        errors:[
          {
            field:'general',
            msg:'Server error'
          }
        ]
      };
    }
  }

  async function register(data) {

    try {

      const res = await fetch('/register/', {

        method:'POST',

        headers:{
          'Content-Type':'application/json'
        },

        body:JSON.stringify(data)
      });

      return await res.json();

    } catch(err) {

      return {
        ok:false,
        errors:[
          {
            field:'general',
            msg:'Server error'
          }
        ]
      };
    }
  }

  function logout() {

    clearSession();

    window.location.href = '/logout/';
  }

  function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidPhone(phone) {

    return /^[6-9]\d{9}$/.test(phone);
  }

  function validatePassword(p) {

    if (!p || p.length < 8) {
      return 'Password must be at least 8 characters.';
    }

    if (!/[A-Z]/.test(p)) {
      return 'Password must contain uppercase letter.';
    }

    if (!/[0-9]/.test(p)) {
      return 'Password must contain number.';
    }

    if (!/[!@#$%^&*]/.test(p)) {
      return 'Password must contain special character.';
    }

    return null;
  }

  function getPasswordStrength(p) {

    let score = 0;

    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;

    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

    return {
      level: score,
      label: labels[score]
    };
  }

  return {

    login,
    register,
    logout,

    getSession,
    getCurrentUser,
    isLoggedIn,

    requireAuth,
    redirectIfLoggedIn,
    getDashboardUrl,

    isValidEmail,
    isValidPhone,
    validatePassword,
    getPasswordStrength
  };

})();