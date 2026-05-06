/* ================================================================
   APP.JS — Activity Management, Enrollments, Data Layer (API Version)
   ================================================================ */

const APP = (() => {
  const API_BASE = 'http://127.0.0.1:5005/api';

  function getAuthHeaders() {
      return typeof AUTH !== 'undefined' ? AUTH.getAuthHeaders() : { 'Content-Type': 'application/json' };
  }

  /* ── Init ───────────────────────────────────────────────────── */
  function init() {
     // No local storage initialization needed anymore
  }

  /* ── Activities ─────────────────────────────────────────────── */
  async function getActivities() {
      try {
          const res = await fetch(`${API_BASE}/activities`, { headers: getAuthHeaders() });
          return await res.json();
      } catch(e) { return []; }
  }

  async function getActivityById(id) { 
      const acts = await getActivities();
      return acts.find(a => a.id === id); 
  }

  async function addActivity(data) {
      try {
          const res = await fetch(`${API_BASE}/activities`, {
             method: 'POST',
             headers: getAuthHeaders(),
             body: JSON.stringify(data)
          });
          return await res.json();
      } catch(e) { return {ok:false, msg:'Server error'}; }
  }

  async function updateActivity(id, updates) {
      try {
          const res = await fetch(`${API_BASE}/activities/${id}`, {
             method: 'PUT',
             headers: getAuthHeaders(),
             body: JSON.stringify(updates)
          });
          return await res.json(); // we can fetch updated list later
      } catch(e) { return {ok:false}; }
  }

  async function deleteActivity(id) {
       try {
           const res = await fetch(`${API_BASE}/activities/${id}`, {
              method: 'DELETE',
              headers: getAuthHeaders()
           });
           return await res.json();
       } catch(e) { return {ok:false}; }
  }

  function approveActivity(id) { return updateActivity(id, { status: 'approved' }); }
  function rejectActivity(id) { return updateActivity(id, { status: 'rejected' }); }

  /* ── Enrollments ────────────────────────────────────────────── */
  async function getEnrollments() {
       try {
           const res = await fetch(`${API_BASE}/enrollments`, { headers: getAuthHeaders() });
           return await res.json();
       } catch(e) { return []; }
  }

  async function updateEnrollment(id, updates) {
      try {
          const res = await fetch(`${API_BASE}/enrollments/${id}`, {
             method: 'PUT',
             headers: getAuthHeaders(),
             body: JSON.stringify(updates)
          });
          return await res.json();
      } catch(e) { return {ok:false}; }
  }

  function approveEnrollment(id) { return updateEnrollment(id, { status: 'confirmed' }); }
  function rejectEnrollment(id) { return updateEnrollment(id, { status: 'rejected' }); }

  async function enrollStudent(activityId, studentData) {
      try {
          const res = await fetch(`${API_BASE}/enrollments`, {
              method: 'POST',
              headers: getAuthHeaders(),
              body: JSON.stringify({ activityId, ...studentData })
          });
          return await res.json();
      } catch(e) { return {ok:false, msg:'Server error'}; }
  }

  async function unenrollStudent(activityId, studentId, enrollmentId) {
      try {
          // the api takes eid, so we need eid.
          const res = await fetch(`${API_BASE}/enrollments/${enrollmentId}`, {
              method: 'DELETE',
              headers: getAuthHeaders()
          });
          return await res.json();
      } catch(e) { return {ok:false, msg:'Server error'}; }
  }

  async function getEnrollmentsByStudent(studentId) { 
      return await getEnrollments(); // API filters by student already if role is student
  }
  
  async function getEnrollmentsByActivity(activityId) { 
      const enrolls = await getEnrollments();
      return enrolls.filter(e => e.activityId === activityId); 
  }
  
  async function isEnrolled(activityId, studentId) { 
      const enrolls = await getEnrollments();
      return enrolls.some(e => e.activityId === activityId && e.studentId === studentId); 
  }

  /* ── Validate Activity Form ─────────────────────────────────── */
  function validateActivityForm(data) {
    const errors = [];
    if (!data.title || data.title.trim().length < 3) errors.push({ field:'act-title', msg:'Activity title must be at least 3 characters.' });
    if (!data.category) errors.push({ field:'act-category', msg:'Please select a category.' });
    if (!data.desc || data.desc.trim().length < 20) errors.push({ field:'act-desc', msg:'Description must be at least 20 characters.' });
    if (!data.date) errors.push({ field:'act-date', msg:'Event date is required.' });
    else if (new Date(data.date) < new Date()) errors.push({ field:'act-date', msg:'Event date must be in the future.' });
    if (!data.time) errors.push({ field:'act-time', msg:'Event time is required.' });
    if (!data.venue || data.venue.trim().length < 2) errors.push({ field:'act-venue', msg:'Venue is required.' });
    if (!data.maxParticipants || data.maxParticipants < 1) errors.push({ field:'act-max', msg:'Max participants must be at least 1.' });
    if (!data.deadline) errors.push({ field:'act-deadline', msg:'Registration deadline is required.' });
    else if (data.date && new Date(data.deadline) >= new Date(data.date)) errors.push({ field:'act-deadline', msg:'Deadline must be before the event date.' });
    if (!data.mode) errors.push({ field:'act-mode', msg:'Please select event mode.' });
    if (!data.contact || typeof AUTH !== 'undefined' && !AUTH.isValidEmail(data.contact)) errors.push({ field:'act-contact', msg:'Enter a valid contact email.' });
    return errors;
  }

  /* ── Validate Enrollment Form ───────────────────────────────── */
  function validateEnrollForm(data) {
    const errors = [];
    if (!data.studentName || data.studentName.trim().length < 2) errors.push({ field:'enroll-name', msg:'Full name is required.' });
    if (!data.studentEmail || (typeof AUTH !== 'undefined' && !AUTH.isValidEmail(data.studentEmail))) errors.push({ field:'enroll-email', msg:'Enter a valid email address.' });
    if (!data.dept) errors.push({ field:'enroll-dept', msg:'Department is required.' });
    if (!data.year) errors.push({ field:'enroll-year', msg:'Please select your year.' });
    if (!data.phone || (typeof AUTH !== 'undefined' && !AUTH.isValidPhone(data.phone))) errors.push({ field:'enroll-phone', msg:'Enter a valid 10-digit phone number.' });
    if (!data.emergencyContact || (typeof AUTH !== 'undefined' && !AUTH.isValidPhone(data.emergencyContact))) errors.push({ field:'enroll-emergency', msg:'Enter a valid emergency contact number.' });
    if (!data.consent) errors.push({ field:'enroll-consent', msg:'You must give consent to participate.' });
    return errors;
  }

  /* ── Search & Filter ────────────────────────────────────────── */
  async function searchActivities(query, category, status) {
    let acts = await getActivities();
    if (query) {
      const q = query.toLowerCase();
      acts = acts.filter(a => a.title.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q) || a.venue.toLowerCase().includes(q));
    }
    if (category && category !== 'all') acts = acts.filter(a => a.category === category);
    if (status && status !== 'all') acts = acts.filter(a => a.status === status);
    return acts;
  }

  /* ── Stats ──────────────────────────────────────────────────── */
  async function getStats() {
    let users = [];
    if (typeof AUTH !== 'undefined' && AUTH.getCurrentUser()?.role === 'admin') {
        users = await AUTH.getUsers();
    }
    const activities = await getActivities();
    const enrollments = await getEnrollments();
    return {
      totalUsers: users.length,
      totalStudents: users.filter(u => u.role === 'student').length,
      totalCoordinators: users.filter(u => u.role === 'coordinator').length,
      totalActivities: activities.length,
      approvedActivities: activities.filter(a => a.status === 'approved').length,
      pendingActivities: activities.filter(a => a.status === 'pending').length,
      totalEnrollments: enrollments.length,
    };
  }

  /* ── Pagination Helper ──────────────────────────────────────── */
  function paginate(items, page, perPage = 5) {
    const total = items.length;
    const totalPages = Math.ceil(total / perPage);
    const start = (page - 1) * perPage;
    const data = items.slice(start, start + perPage);
    return { data, page, totalPages, total, perPage };
  }

  /* ── Notifications ─────────────────────────────────────────── */
  async function getUserNotifications() {
       try {
           const res = await fetch(`${API_BASE}/notifications`, { headers: getAuthHeaders() });
           return await res.json();
       } catch(e) { return []; }
  }

  async function markNotificationsRead() {
       try {
           const res = await fetch(`${API_BASE}/notifications/read`, { method: 'POST', headers: getAuthHeaders() });
           return await res.json();
       } catch(e) { return {ok:false}; }
  }


  return {
    init, 
    getActivities, getActivityById, addActivity, updateActivity, deleteActivity, approveActivity, rejectActivity,
    getEnrollments, enrollStudent, unenrollStudent, getEnrollmentsByStudent, getEnrollmentsByActivity, isEnrolled, updateEnrollment, approveEnrollment, rejectEnrollment,
    validateActivityForm, validateEnrollForm,
    searchActivities, getStats, paginate,
    getUserNotifications, markNotificationsRead
  };
})();

document.addEventListener('DOMContentLoaded', () => { APP.init(); });
