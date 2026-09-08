/* Handles login.html and signup.html forms */

(function () {
  renderNavbar();

  const params = new URLSearchParams(window.location.search);
  if (params.get('error') === 'google') {
    showToast('Google sign-in failed. Please try again or use email/password.', 'error');
  }

  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorEl = document.getElementById('form-error');
      const btn = document.getElementById('submit-btn');
      errorEl.style.display = 'none';

      const formData = new FormData(signupForm);
      const payload = Object.fromEntries(formData.entries());

      if (!/^\S+@\S+\.\S+$/.test(payload.email)) {
        errorEl.textContent = 'Please enter a valid email address.';
        errorEl.style.display = 'block';
        return;
      }
      if (payload.password.length < 8) {
        errorEl.textContent = 'Password must be at least 8 characters long.';
        errorEl.style.display = 'block';
        return;
      }
      if (payload.password !== payload.confirmPassword) {
        errorEl.textContent = 'Passwords do not match.';
        errorEl.style.display = 'block';
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Creating account...';
      try {
        await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
        showToast('Account created successfully.', 'success');
        window.location.href = 'dashboard.html';
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Create Account';
      }
    });
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorEl = document.getElementById('form-error');
      const btn = document.getElementById('submit-btn');
      errorEl.style.display = 'none';

      const formData = new FormData(loginForm);
      const payload = Object.fromEntries(formData.entries());

      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Logging in...';
      try {
        await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
        showToast('Logged in successfully.', 'success');
        window.location.href = 'dashboard.html';
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Login';
      }
    });
  }

  const forgotLink = document.getElementById('forgot-link');
  if (forgotLink) {
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Please contact Mama Vero Shop directly to reset your password.', 'info');
    });
  }
})();
