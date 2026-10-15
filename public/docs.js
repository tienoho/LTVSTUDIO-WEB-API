/**
 * LTVStudio Cloud Portal - Developer Docs Module (Admin Protected)
 * Handles admin session authentication, interactive copy, scrollspy and docs rendering.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Authentication Elements
  const docsAuthRequiredCard = document.getElementById('docsAuthRequiredCard');
  const docsProtectedContent = document.getElementById('docsProtectedContent');
  const docsLoginForm = document.getElementById('docsLoginForm');
  const adminDocsUsername = document.getElementById('adminDocsUsername');
  const adminDocsSecret = document.getElementById('adminDocsSecret');
  const btnSubmitDocsAuth = document.getElementById('btnSubmitDocsAuth');
  const docsAuthError = document.getElementById('docsAuthError');
  const docsAuthErrorText = document.getElementById('docsAuthErrorText');
  const btnToggleDocsSecret = document.getElementById('btnToggleDocsSecret');
  const docsEyeIcon = document.getElementById('docsEyeIcon');

  const docsSessionAdminName = document.getElementById('docsSessionAdminName');
  const btnDocsLogout = document.getElementById('btnDocsLogout');
  const navAdminProfilePill = document.getElementById('navAdminProfilePill');
  const navAdminName = document.getElementById('navAdminName');
  const btnNavLogout = document.getElementById('btnNavLogout');

  const toastContainer = document.getElementById('toastContainer');
  const navHealthPill = document.getElementById('navHealthPill');
  const healthCheckModal = document.getElementById('healthCheckModal');
  const btnCloseHealthCheck = document.getElementById('btnCloseHealthCheck');
  const healthLoading = document.getElementById('healthLoading');
  const healthContent = document.getElementById('healthContent');

  // ── TOAST NOTIFICATIONS ────────────────────────────────────
  function showToast(message, type = 'info', duration = 2800) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'fa-solid fa-circle-check';
    if (type === 'error') icon = 'fa-solid fa-triangle-exclamation';
    if (type === 'info') icon = 'fa-solid fa-circle-info';

    toast.innerHTML = `
      <div class="toast-icon"><i class="${icon}"></i></div>
      <div class="toast-content">${message}</div>
      <button class="toast-close">&times;</button>
    `;

    toastContainer.appendChild(toast);

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 250);
    });

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 250);
      }
    }, duration);
  }

  // ── ADMIN SESSION VERIFICATION ─────────────────────────────
  async function checkAdminDocsAccess() {
    const token = localStorage.getItem('ltv_admin_session_token');

    if (!token) {
      // Not logged in: show lock screen, hide protected content
      showLockScreen();
      return;
    }

    try {
      const res = await fetch('/api/admin/verify-session', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.valid) {
        // Authenticated: show protected content
        unlockDocs(data.username || 'admin');
      } else {
        localStorage.removeItem('ltv_admin_session_token');
        showLockScreen();
      }
    } catch (err) {
      // Offline fallback: if secret exists, still require connection
      showLockScreen();
    }
  }

  function showLockScreen() {
    if (docsAuthRequiredCard) docsAuthRequiredCard.style.display = 'flex';
    if (docsProtectedContent) docsProtectedContent.style.display = 'none';
    document.querySelectorAll('.footer-docs-link').forEach(el => el.style.display = 'none');
    if (navAdminProfilePill) navAdminProfilePill.style.display = 'none';
  }

  function unlockDocs(username) {
    if (docsAuthRequiredCard) docsAuthRequiredCard.style.display = 'none';
    if (docsProtectedContent) docsProtectedContent.style.display = 'block';
    document.querySelectorAll('.footer-docs-link').forEach(el => el.style.display = 'inline');
    if (docsSessionAdminName) docsSessionAdminName.textContent = username;
    if (navAdminProfilePill) {
      navAdminProfilePill.style.display = 'inline-flex';
      if (navAdminName) navAdminName.textContent = username;
    }
  }

  // ── INLINE ADMIN LOGIN SUBMISSION ──────────────────────────
  if (docsLoginForm) {
    docsLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = (adminDocsUsername ? adminDocsUsername.value : 'admin').trim();
      const secret = (adminDocsSecret ? adminDocsSecret.value : '').trim();

      if (!secret) {
        if (docsAuthError) {
          docsAuthError.style.display = 'flex';
          if (docsAuthErrorText) docsAuthErrorText.textContent = 'Vui lòng nhập mật khẩu hoặc Secret Key quản trị';
        }
        return;
      }

      if (btnSubmitDocsAuth) {
        btnSubmitDocsAuth.disabled = true;
        btnSubmitDocsAuth.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xác thực...';
      }
      if (docsAuthError) docsAuthError.style.display = 'none';

      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, secret })
        });
        const data = await res.json();

        if (res.ok && data.token) {
          localStorage.setItem('ltv_admin_session_token', data.token);
          localStorage.setItem('ltv_admin_secret', secret);
          showToast('✓ Đăng nhập quản trị thành công! Đã mở khóa tài liệu API.', 'success');
          unlockDocs(username);
        } else {
          if (docsAuthError) {
            docsAuthError.style.display = 'flex';
            if (docsAuthErrorText) docsAuthErrorText.textContent = data.message || 'Mật khẩu quản trị không chính xác';
          }
        }
      } catch (err) {
        if (docsAuthError) {
          docsAuthError.style.display = 'flex';
          if (docsAuthErrorText) docsAuthErrorText.textContent = 'Lỗi kết nối máy chủ: ' + err.message;
        }
      } finally {
        if (btnSubmitDocsAuth) {
          btnSubmitDocsAuth.disabled = false;
          btnSubmitDocsAuth.innerHTML = '<i class="fa-solid fa-unlock-keyhole"></i> Đăng Nhập &amp; Mở Khóa Tài Liệu';
        }
      }
    });
  }

  // ── LOGOUT ACTIONS ─────────────────────────────────────────
  async function handleDocsLogout() {
    const token = localStorage.getItem('ltv_admin_session_token');
    if (token) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
      } catch (e) {}
    }
    localStorage.removeItem('ltv_admin_session_token');
    localStorage.removeItem('ltv_admin_secret');
    showLockScreen();
    showToast('Đã đăng xuất tài khoản quản trị viên.', 'info');
  }

  if (btnDocsLogout) btnDocsLogout.addEventListener('click', handleDocsLogout);
  if (btnNavLogout) btnNavLogout.addEventListener('click', handleDocsLogout);

  // ── PASSWORD VISIBILITY TOGGLE ─────────────────────────────
  if (btnToggleDocsSecret && adminDocsSecret && docsEyeIcon) {
    btnToggleDocsSecret.addEventListener('click', () => {
      const isPassword = adminDocsSecret.type === 'password';
      adminDocsSecret.type = isPassword ? 'text' : 'password';
      docsEyeIcon.className = isPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
    });
  }

  // ── COPY CODE BUTTONS ──────────────────────────────────────
  document.querySelectorAll('.btn-copy-code').forEach(btn => {
    btn.addEventListener('click', () => {
      const codeText = btn.getAttribute('data-copy') || (btn.previousElementSibling ? btn.previousElementSibling.textContent : '');
      if (!codeText) return;

      navigator.clipboard.writeText(codeText.trim()).then(() => {
        const icon = btn.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-check text-emerald';
        showToast('✓ Đã sao chép lệnh vào clipboard!', 'success');

        setTimeout(() => {
          if (icon) icon.className = 'fa-regular fa-copy';
        }, 1800);
      }).catch(err => {
        showToast('Không thể sao chép: ' + err.message, 'error');
      });
    });
  });

  // ── SIDEBAR SCROLLSPY ──────────────────────────────────────
  const links = document.querySelectorAll('.docs-nav-link');
  const sections = document.querySelectorAll('.docs-section-card');

  window.addEventListener('scroll', () => {
    let currentId = '';
    const scrollPos = window.scrollY + 120;

    sections.forEach(section => {
      if (section.offsetTop <= scrollPos) {
        currentId = section.getAttribute('id');
      }
    });

    if (currentId) {
      links.forEach(link => {
        if (link.getAttribute('href') === `#${currentId}`) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }
  });

  // ── HEALTH CHECK ───────────────────────────────────────────
  if (navHealthPill) {
    navHealthPill.addEventListener('click', async () => {
      if (healthCheckModal) healthCheckModal.classList.add('active');
      if (healthLoading) healthLoading.style.display = 'block';
      if (healthContent) healthContent.style.display = 'none';

      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        if (healthLoading) healthLoading.style.display = 'none';
        if (healthContent) healthContent.style.display = 'block';
      } catch (err) {
        if (healthLoading) healthLoading.style.display = 'none';
      }
    });
  }

  if (btnCloseHealthCheck && healthCheckModal) {
    btnCloseHealthCheck.addEventListener('click', () => {
      healthCheckModal.classList.remove('active');
    });
  }

  // Initial access check
  checkAdminDocsAccess();
});
