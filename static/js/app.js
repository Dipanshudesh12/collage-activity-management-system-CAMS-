/* ================================================================
   APP.JS — Django Backend Version
   ================================================================ */

const APP = (() => {

  async function getActivities() {

    try {

      const res = await fetch('/api/activities/');

      return await res.json();

    } catch(err) {

      return [];
    }
  }

  async function getActivityById(id) {

    const acts = await getActivities();

    return acts.find(a => a.id == id);
  }

  async function getEnrollments() {

    try {

      const res = await fetch('/api/enrollments/');

      return await res.json();

    } catch(err) {

      return [];
    }
  }

  async function enrollStudent(activityId, data) {

    try {

      const res = await fetch(`/enroll/${activityId}/`, {

        method:'POST',

        headers:{
          'Content-Type':'application/json'
        },

        body:JSON.stringify(data)
      });

      return await res.json();

    } catch(err) {

      return {
        ok:false
      };
    }
  }

  async function unenrollStudent(activityId, studentId, enrollmentId) {

    return {
      ok:true
    };
  }

  function paginate(items, page, perPage = 5) {

    const total = items.length;

    const totalPages = Math.ceil(total / perPage);

    const start = (page - 1) * perPage;

    return {
      data: items.slice(start, start + perPage),
      totalPages
    };
  }

  function validateActivityForm(data) {

    const errors = [];

    if (!data.title || data.title.length < 3) {
      errors.push({
        field:'act-title',
        msg:'Title too short'
      });
    }

    if (!data.category) {
      errors.push({
        field:'act-category',
        msg:'Select category'
      });
    }

    if (!data.desc || data.desc.length < 20) {
      errors.push({
        field:'act-desc',
        msg:'Description too short'
      });
    }

    return errors;
  }

  return {

    getActivities,
    getActivityById,

    getEnrollments,
    enrollStudent,
    unenrollStudent,

    paginate,
    validateActivityForm
  };

})();


/* ================================================================
   UI HELPERS
   ================================================================ */

const UI = {

  setFieldError(id, msg) {

    const field = document.getElementById(id);

    const err = document.getElementById(id + '-error');

    if (field) {
      field.classList.add('is-invalid');
    }

    if (err) {
      err.textContent = msg;
      err.classList.add('show');
    }
  },

  clearFieldError(id) {

    const field = document.getElementById(id);

    const err = document.getElementById(id + '-error');

    if (field) {
      field.classList.remove('is-invalid');
    }

    if (err) {
      err.textContent = '';
      err.classList.remove('show');
    }
  },

  setFieldValid(id) {

    const field = document.getElementById(id);

    if (field) {
      field.classList.remove('is-invalid');
      field.classList.add('is-valid');
    }
  },

  clearAllErrors() {

    document.querySelectorAll('.form-error').forEach(el => {

      el.textContent = '';

      el.classList.remove('show');
    });

    document.querySelectorAll('.form-control').forEach(el => {

      el.classList.remove('is-invalid');
    });
  },

  toast(msg) {

    alert(msg);
  },

  formatDate(d) {

    return new Date(d).toLocaleDateString();
  },

  initNavbar() {},

  initMobileDrawer() {}
};