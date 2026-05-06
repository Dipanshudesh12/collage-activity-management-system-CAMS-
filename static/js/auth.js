/* ================================================================
   AUTH.JS — Authentication, Session Management, Validation (API)
   ================================================================ */

const AUTH = (() => {

  const API_BASE = 'http://127.0.0.1:5005/api';

  /* ── Init ───────────────────────────────────────────────────── */
  function init() {
     // No more local storage defaults!
  }

  /* ── Session ────────────────────────────────────────────────── */
  function getSession() {
    const s = localStorage.getItem('cams_session');
    return s ? JSON.parse(s) : null;
  }
  function setSession(token, user) {
    const sess = { token, ...user };
    localStorage.setItem('cams_session', JSON.stringify(sess));
  }
  function clearSession() { localStorage.removeItem('cams_session'); }
  function isLoggedIn() { return !!getSession(); }
  
  // Note: we fetch user profile async on page load usually, but for UI rendering we can use the cached session
  function getCurrentUser() {
    return getSession();
  }

  function getAuthHeaders() {
    const s = getSession();
    return s ? { 'Authorization': 'Bearer ' + s.token, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  }

  /* ── Auth Guards ────────────────────────────────────────────── */
  function requireAuth(allowedRoles) {
    const sess = getSession();
    if (!sess) { window.location.href = 'login.html'; return false; }
    if (allowedRoles && !allowedRoles.includes(sess.role)) {
      window.location.href = getDashboardUrl(sess.role);
      return false;
    }
    return true;
  }
  function getDashboardUrl(role) {
    const map = { admin: 'dashboard-admin.html', coordinator: 'dashboard-coordinator.html', student: 'dashboard-student.html' };
    return map[role] || 'login.html';
  }
  function redirectIfLoggedIn() {
    const sess = getSession();
    if (sess) window.location.href = getDashboardUrl(sess.role);
  }

  /* ── Login ──────────────────────────────────────────────────── */
  async function login(email, password) {
    const errors = [];
    if (!email.trim()) errors.push({ field:'email', msg:'Email is required.' });
    else if (!isValidEmail(email)) errors.push({ field:'email', msg:'Enter a valid email address.' });
    if (!password) errors.push({ field:'password', msg:'Password is required.' });
    if (errors.length) return { ok: false, errors };

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.ok) {
            setSession(data.token, data.user);
        }
        return data; // {ok, token, user, errors}
    } catch(err) {
        return { ok: false, errors: [{ field:'general', msg:'Server error. Could not login.' }] };
    }
  }

  /* ── Register ───────────────────────────────────────────────── */
  async function register(data) {
    const errors = [];
    if (!data.name || data.name.trim().length < 2) errors.push({ field:'name', msg:'Full name must be at least 2 characters.' });
    if (!data.email || !isValidEmail(data.email)) errors.push({ field:'email', msg:'Enter a valid email address.' });
    const pwErr = validatePassword(data.password);
    if (pwErr) errors.push({ field:'password', msg: pwErr });
    if (data.password !== data.confirmPassword) errors.push({ field:'confirmPassword', msg:'Passwords do not match.' });
    if (!data.role || !['coordinator','student'].includes(data.role)) errors.push({ field:'role', msg:'Select a valid role.' });
    if (!data.dept) errors.push({ field:'dept', msg:'Department is required.' });
    if (data.phone && !isValidPhone(data.phone)) errors.push({ field:'phone', msg:'Enter a valid 10-digit phone number.' });
    if (!data.terms) errors.push({ field:'terms', msg:'You must accept the terms and conditions.' });
    if (errors.length) return { ok: false, errors };

    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    } catch(err) {
        return { ok: false, errors: [{ field:'general', msg:'Server error.' }] };
    }
  }

  /* ── Users API ────────────────────────────────────────────── */
  async function getUsers() {
      const res = await fetch(`${API_BASE}/users`, { headers: getAuthHeaders() });
      return await res.json();
  }

  async function deleteUser(id) {
      if (id === 'u1') return { ok: false, msg: 'Cannot delete the default admin.' };
      const res = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      return await res.json();
  }

  async function updateUserStatus(id, status) {
      const res = await fetch(`${API_BASE}/users/${id}/status`, { 
          method: 'PUT', 
          headers: getAuthHeaders(),
          body: JSON.stringify({ status })
      });
      return await res.json();
  }

  function approveUser(id) { return updateUserStatus(id, 'approved'); }
  function rejectUser(id) { return updateUserStatus(id, 'rejected'); }

  /* ── Validation Helpers ─────────────────────────────────────── */
  function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()); }
  function isValidPhone(p) { return /^[6-9]\d{9}$/.test(p.replace(/\s/g,'')); }
  function validatePassword(p) {
    if (!p || p.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(p)) return 'Password must contain at least one uppercase letter.';
    if (!/[0-9]/.test(p)) return 'Password must contain at least one number.';
    if (!/[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]/.test(p)) return 'Password must contain at least one special character.';
    return null;
  }
  function getPasswordStrength(p) {
    if (!p) return { level: 0, label: '' };
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const map = ['', 'weak', 'fair', 'good', 'strong'];
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    return { level: score, class: map[score], label: labels[score] };
  }

  /* ── Logout ─────────────────────────────────────────────────── */
  function logout() { clearSession(); window.location.href = 'login.html'; }

  /* ── Public API ─────────────────────────────────────────────── */
  return {
    init, login, register, logout,
    getSession, isLoggedIn, getCurrentUser, getAuthHeaders,
    requireAuth, redirectIfLoggedIn, getDashboardUrl,
    getUsers, deleteUser, approveUser, rejectUser,
    isValidEmail, isValidPhone, validatePassword, getPasswordStrength
  };
})();


/* ── UI Helpers (used across pages) ──────────────────────────── */
const UI = {
  toast(msg, type = 'success', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span>${icons[type]||''}</span> ${msg}`;
    container.appendChild(t);
    setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(40px)'; t.style.transition='all .3s'; setTimeout(()=>t.remove(), 300); }, duration);
  },

  setFieldError(inputId, msg) {
    const el = document.getElementById(inputId);
    const errEl = document.getElementById(inputId + '-error');
    if (el) el.classList.add('is-invalid');
    if (errEl) { errEl.textContent = msg; errEl.classList.add('show'); }
  },
  clearFieldError(inputId) {
    const el = document.getElementById(inputId);
    const errEl = document.getElementById(inputId + '-error');
    if (el) { el.classList.remove('is-invalid'); el.classList.remove('is-valid'); }
    if (errEl) errEl.classList.remove('show');
  },
  setFieldValid(inputId) {
    const el = document.getElementById(inputId);
    if (el) { el.classList.remove('is-invalid'); el.classList.add('is-valid'); }
    const errEl = document.getElementById(inputId + '-error');
    if (errEl) errEl.classList.remove('show');
  },
  clearAllErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.querySelectorAll('.is-invalid,.is-valid').forEach(el => { el.classList.remove('is-invalid','is-valid'); });
    form.querySelectorAll('.form-error.show').forEach(el => el.classList.remove('show'));
  },
  applyErrors(errors) {
    errors.forEach(e => { if (e.field && e.field !== 'general') UI.setFieldError(e.field, e.msg); });
    const gen = errors.find(e => e.field === 'general');
    if (gen) {
      const el = document.getElementById('general-error');
      if (el) { el.textContent = gen.msg; el.classList.add('show'); }
    }
  },

  async initNavbar() {
    const sess = AUTH.getSession();
    const userArea = document.getElementById('navbar-user-area');
    const loginBtn = document.getElementById('navbar-login-btn');
    if (!userArea) return;

    if (sess) {
      const roleClass = sess.role + '-avatar';
      const avatarHTML = sess.profilePhoto 
        ? `<div class="avatar ${roleClass}" style="background:transparent; padding:0; overflow:hidden; border:2px solid white"><img src="${sess.profilePhoto}" style="width:100%;height:100%;object-fit:cover"/></div>`
        : `<div class="avatar ${roleClass}">${sess.name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase()}</div>`;
        
      let notifPulse = '';
      let notifDropdownHTML = '';
      
      // Async fetch notifications from backend
      let notifs = [];
      if (typeof APP !== 'undefined' && APP.getUserNotifications) {
          try { notifs = await APP.getUserNotifications(); } catch(e){}
      }
      
      const unreadCount = notifs.filter(n => !n.read).length;
      if (unreadCount > 0) notifPulse = `<span class="notif-pulse" style="display:flex;align-items:center;justify-content:center;background:var(--error);color:#fff;font-size:10px;font-weight:700;width:16px;height:16px;border-radius:50%;position:absolute;top:-2px;right:-2px;animation:none">${unreadCount > 9 ? '9+' : unreadCount}</span>`;

      let itemsHTML = '';
      if (notifs.length === 0) {
        itemsHTML = `<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:0.85rem">No notifications yet</div>`;
      } else {
        const tIcons = { success: '✅', warning: '⚠️', error: '❌', info: 'ℹ️' };
        itemsHTML = notifs.map(n => `
          <div class="notif-item" style="${!n.read ? 'background:rgba(59,130,246,0.05); border-left:3px solid var(--primary)' : ''}">
            <strong style="display:flex;align-items:center;gap:6px">${tIcons[n.type]||'🔔'} ${n.title}</strong>
            <div style="font-size:0.85rem;margin-top:4px">${n.message}</div>
            <div style="font-size:0.7rem;color:var(--text-muted);margin-top:6px">${UI.timeAgo(n.date)}</div>
          </div>
        `).join('');
      }
      notifDropdownHTML = `
        <div class="dropdown-menu" id="notif-dropdown" style="width:320px;max-height:400px;overflow-y:auto">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px; border-bottom:1px solid var(--neu-drk); padding-bottom:12px">
            <h4 style="margin:0; font-size:1rem;">Notifications</h4>
            ${unreadCount > 0 ? `<button class="btn btn-ghost btn-sm" style="padding:4px 8px;font-size:0.75rem" onclick="APP.markNotificationsRead(); setTimeout(()=>UI.initNavbar(), 500); setTimeout(()=>document.getElementById('notif-dropdown').classList.add('show'), 10)">Mark all read</button>` : ''}
          </div>
          ${itemsHTML}
        </div>
      `;

      const bellSVG = `<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" style="color:var(--text-primary)"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`;
      userArea.innerHTML = `
        <div style="position:relative; margin-right:16px; display:inline-block">
          <button class="btn btn-neumorphic" style="padding:8px; border-radius:50%; box-shadow: 4px 4px 8px var(--neu-drk), -4px -4px 8px var(--neu-lgt); position:relative; display:flex; align-items:center; justify-content:center; width:40px; height:40px" onclick="document.getElementById('notif-dropdown').classList.toggle('show')">
            ${bellSVG}${notifPulse}
          </button>
          ${notifDropdownHTML}
        </div>
        <div class="navbar-user">
          ${avatarHTML}
          <span class="user-name">${sess.name}</span>
          <span class="badge badge-ghost">${sess.role}</span>
        </div>
        <a href="${AUTH.getDashboardUrl(sess.role)}" class="btn btn-primary btn-sm" style="margin-left:12px">Dashboard</a>
        <button onclick="AUTH.logout()" class="btn btn-ghost btn-sm" style="margin-left:8px; border-radius:100px; padding:6px 12px; display:inline-flex; align-items:center; gap:6px;">🚪 Logout</button>
      `;
      if (loginBtn) loginBtn.style.display = 'none';
      
      // Close dropdown if clicked outside
      document.addEventListener('click', (e) => {
        const notifMenu = document.getElementById('notif-dropdown');
        if (notifMenu && notifMenu.classList.contains('show') && !e.target.closest('#notif-dropdown') && !e.target.closest('button')) {
          notifMenu.classList.remove('show');
        }
      });
    } else {
      // userArea.insertAdjacentHTML('afterbegin', '');
    }
  },

  initMobileDrawer() {
    const btn = document.getElementById('hamburger-btn');
    const drawer = document.getElementById('mobile-drawer');
    const overlay = document.getElementById('mobile-drawer-overlay');
    if (!btn || !drawer || !overlay) return;
    btn.addEventListener('click', () => { drawer.classList.toggle('open'); overlay.classList.toggle('open'); });
    overlay.addEventListener('click', () => { drawer.classList.remove('open'); overlay.classList.remove('open'); });
  },

  formatDate(d) {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
  },
  timeAgo(d) {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff/60000), h = Math.floor(diff/3600000), days = Math.floor(diff/86400000);
    if (days > 0) return `${days}d ago`;
    if (h > 0) return `${h}h ago`;
    if (m > 0) return `${m}m ago`;
    return 'just now';
  }
};

/* ── Live Validation Helper ───────────────────────────────────── */
function initLiveValidation(rules) {
  rules.forEach(({ id, validate }) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('blur', () => {
      const err = validate(el.value, el);
      if (err) UI.setFieldError(id, err);
      else UI.setFieldValid(id);
    });
    el.addEventListener('input', () => { if (el.classList.contains('is-invalid')) UI.clearFieldError(id); });
  });
}

// Auto-init
document.addEventListener('DOMContentLoaded', () => { 
  AUTH.init(); 
  UI.initNavbar(); 
  UI.initMobileDrawer(); 
});
