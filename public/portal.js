/**
 * LTVStudio Cloud Portal - Home & Software Download Controller
 * Handles version loading, changelog rendering, and desktop dialog preview.
 */

document.addEventListener('DOMContentLoaded', () => {
  const heroVersionBadge = document.getElementById('heroVersionBadge');
  const heroReleaseDate = document.getElementById('heroReleaseDate');
  const btnHeroDownload = document.getElementById('btnHeroDownload');
  const heroChangelog = document.getElementById('heroChangelog');
  const btnToggleReleaseNotes = document.getElementById('btnToggleReleaseNotes');
  const releaseChevron = document.getElementById('releaseChevron');
  const previewDialogTitle = document.getElementById('previewDialogTitle');
  const previewChangelogBox = document.getElementById('previewChangelogBox');

  const navHealthPill = document.getElementById('navHealthPill');
  const healthCheckModal = document.getElementById('healthCheckModal');
  const btnCloseHealthCheck = document.getElementById('btnCloseHealthCheck');
  const healthLoading = document.getElementById('healthLoading');
  const healthContent = document.getElementById('healthContent');
  const toastContainer = document.getElementById('toastContainer');

  const btnThemeToggle = document.getElementById('btnThemeToggle');
  const themeToggleIcon = document.getElementById('themeToggleIcon');
  const btnMobileNav = document.getElementById('btnMobileNav');
  const mobileDrawerOverlay = document.getElementById('mobileDrawerOverlay');
  const mobileDrawerPane = document.getElementById('mobileDrawerPane');
  const btnCloseMobileDrawer = document.getElementById('btnCloseMobileDrawer');

  // Admin Modal Elements (Quick Access & Test Compatibility)
  const adminAuthModal = document.getElementById('adminAuthModal');
  const btnCloseAuthModal = document.getElementById('btnCloseAuthModal');
  const btnCancelAdminAuth = document.getElementById('btnCancelAdminAuth');
  const adminUsernameInput = document.getElementById('adminUsernameInput');
  const adminSecretInput = document.getElementById('adminSecretInput');
  const btnTogglePasswordEye = document.getElementById('btnTogglePasswordEye');
  const eyeIcon = document.getElementById('eyeIcon');
  const checkRememberAdmin = document.getElementById('checkRememberAdmin');
  const adminLoginError = document.getElementById('adminLoginError');
  const adminLoginErrorText = document.getElementById('adminLoginErrorText');
  const btnSubmitAdminAuth = document.getElementById('btnSubmitAdminAuth');
  const btnAdminLogout = document.getElementById('btnAdminLogout');
  const navAdminRoleBadge = document.getElementById('navAdminRoleBadge');
  const mobileNavDocsLink = document.getElementById('mobileNavDocsLink');

  // ── THEME CONTROLLER ───────────────────────────────────────
  function initTheme() {
    const saved = localStorage.getItem('ltv_theme') || 'dark';
    applyTheme(saved);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ltv_theme', theme);
    if (themeToggleIcon) {
      if (theme === 'light') {
        themeToggleIcon.className = 'fa-solid fa-sun';
        themeToggleIcon.style.color = '#f59e0b';
      } else {
        themeToggleIcon.className = 'fa-solid fa-moon';
        themeToggleIcon.style.color = '';
      }
    }
  }

  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      showToast(`Đã chuyển sang giao diện ${next === 'light' ? 'Sáng (Light)' : 'Tối (Dark)'}`, 'info', 2000);
    });
  }

  // ── MOBILE DRAWER ──────────────────────────────────────────
  function toggleMobileDrawer(open) {
    if (mobileDrawerOverlay && mobileDrawerPane) {
      if (open) {
        mobileDrawerOverlay.classList.add('active');
        mobileDrawerPane.classList.add('active');
      } else {
        mobileDrawerOverlay.classList.remove('active');
        mobileDrawerPane.classList.remove('active');
      }
    }
  }

  if (btnMobileNav) btnMobileNav.addEventListener('click', () => toggleMobileDrawer(true));
  if (btnCloseMobileDrawer) btnCloseMobileDrawer.addEventListener('click', () => toggleMobileDrawer(false));
  if (mobileDrawerOverlay) mobileDrawerOverlay.addEventListener('click', () => toggleMobileDrawer(false));

  // ── ADMIN LOGIN MODAL ──────────────────────────────────────
  function openAdminAuthModal() {
    if (adminLoginError) adminLoginError.style.display = 'none';
    if (adminAuthModal) adminAuthModal.classList.add('active');
    setTimeout(() => {
      if (adminSecretInput) adminSecretInput.focus();
    }, 150);
  }

  function closeAdminAuthModal() {
    if (adminAuthModal) adminAuthModal.classList.remove('active');
  }

  if (btnCloseAuthModal) btnCloseAuthModal.addEventListener('click', closeAdminAuthModal);
  if (btnCancelAdminAuth) btnCancelAdminAuth.addEventListener('click', closeAdminAuthModal);

  if (btnTogglePasswordEye && adminSecretInput && eyeIcon) {
    btnTogglePasswordEye.addEventListener('click', () => {
      const isPwd = adminSecretInput.type === 'password';
      adminSecretInput.type = isPwd ? 'text' : 'password';
      eyeIcon.className = isPwd ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
    });
  }

  if (btnSubmitAdminAuth) {
    btnSubmitAdminAuth.addEventListener('click', async () => {
      const username = (adminUsernameInput ? adminUsernameInput.value.trim() : 'admin') || 'admin';
      const secret = (adminSecretInput ? adminSecretInput.value.trim() : '');
      const remember = checkRememberAdmin ? checkRememberAdmin.checked : true;

      if (!secret) {
        if (adminLoginError && adminLoginErrorText) {
          adminLoginErrorText.textContent = 'Vui lòng nhập mật khẩu Quản trị viên!';
          adminLoginError.style.display = 'block';
        }
        return;
      }

      btnSubmitAdminAuth.disabled = true;
      btnSubmitAdminAuth.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xác thực...';
      if (adminLoginError) adminLoginError.style.display = 'none';

      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, secret, password: secret })
        });
        const data = await res.json();

        if (res.ok && data.token) {
          const storage = remember ? localStorage : sessionStorage;
          storage.setItem('ltv_admin_session_token', data.token);
          storage.setItem('ltv_admin_role', data.user?.role || 'SuperAdmin');
          storage.setItem('ltv_admin_permissions', JSON.stringify(data.user?.permissions || []));
          showToast(`✓ Đăng nhập thành công với vai trò ${data.user?.role || 'Admin'}!`, 'success');
          closeAdminAuthModal();
          setTimeout(() => {
            window.location.href = '/admin';
          }, 800);
        } else {
          if (adminLoginError && adminLoginErrorText) {
            adminLoginErrorText.textContent = data.message || 'Mật khẩu quản trị không chính xác!';
            adminLoginError.style.display = 'block';
          }
        }
      } catch (e) {
        if (adminLoginError && adminLoginErrorText) {
          adminLoginErrorText.textContent = 'Lỗi kết nối: ' + e.message;
          adminLoginError.style.display = 'block';
        }
      } finally {
        btnSubmitAdminAuth.disabled = false;
        btnSubmitAdminAuth.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Đăng Nhập';
      }
    });
  }

  if (adminSecretInput) {
    adminSecretInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') btnSubmitAdminAuth.click();
    });
  }

  // ── TOAST NOTIFICATIONS ────────────────────────────────────
  function showToast(message, type = 'info', duration = 3000) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let icon = 'fa-solid fa-circle-info';
    if (type === 'success') icon = 'fa-solid fa-circle-check';
    if (type === 'error') icon = 'fa-solid fa-triangle-exclamation';

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

  // ── 1. LOAD PUBLIC VERSION & PREVIEW ───────────────────────
  async function loadPublicVersion() {
    try {
      const res = await fetch('/api/transform/version');
      const data = await res.json();

      if (heroVersionBadge) {
        heroVersionBadge.textContent = `Phiên Bản Mới Nhất: v${data.version || '1.0.0'} Pro`;
      }
      if (heroReleaseDate && data.releaseDate) {
        heroReleaseDate.textContent = `(Phát hành: ${data.releaseDate})`;
      }

      if (btnHeroDownload) {
        if (data.downloadUrl) {
          btnHeroDownload.href = data.downloadUrl;
        } else {
          btnHeroDownload.href = '#';
          btnHeroDownload.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('Bản cài đặt đang được tải lên máy chủ, vui lòng quay lại sau ít phút!', 'info');
          });
        }
      }

      if (heroChangelog && data.changelog) {
        const lines = data.changelog.split('\n');
        heroChangelog.innerHTML = lines.map(line => `<p>${line}</p>`).join('');
      }

      // Live Desktop Preview
      if (previewDialogTitle) {
        previewDialogTitle.textContent = `Đã có bản cập nhật mới: v${data.version || '1.0.0'}`;
      }
      if (previewChangelogBox && data.changelog) {
        previewChangelogBox.textContent = data.changelog;
      }
    } catch (err) {
      if (heroChangelog) {
        heroChangelog.innerHTML = '<p class="text-rose">Không thể tải thông tin phiên bản lúc này.</p>';
      }
    }
  }

  // ── 2. CHANGELOG ACCORDION ─────────────────────────────────
  if (btnToggleReleaseNotes && heroChangelog && releaseChevron) {
    btnToggleReleaseNotes.addEventListener('click', () => {
      const isVisible = heroChangelog.style.display !== 'none';
      heroChangelog.style.display = isVisible ? 'none' : 'block';
      releaseChevron.style.transform = isVisible ? 'rotate(-90deg)' : 'rotate(0deg)';
    });
  }

  // ── 3. HEALTH CHECK MONITOR ────────────────────────────────
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

  // Load initial version data & theme
  initTheme();
  loadPublicVersion();

  // ── ADMIN NAVBAR REVEAL & DYNAMIC LABELS (RBAC) ───────────
  async function checkAdminSessionPortal() {
    const token = localStorage.getItem('ltv_admin_session_token');
    const navDocsLink = document.getElementById('navDocsLink');
    const navAdminProfilePill = document.getElementById('navAdminProfilePill');
    const navAdminName = document.getElementById('navAdminName');
    const navAdminRoleBadge = document.getElementById('navAdminRoleBadge');
    const btnNavLogout = document.getElementById('btnNavLogout');
    const btnAdminLogout = document.getElementById('btnAdminLogout');
    const mobileNavDocsLink = document.getElementById('mobileNavDocsLink');
    const navAdminLink = document.getElementById('navAdminLink');
    const mobileNavAdminLink = document.getElementById('mobileNavAdminLink');
    const footerAdminLink = document.getElementById('footerAdminLink');
    const mobileDrawerProfile = document.getElementById('mobileDrawerProfile');
    const mobileDrawerAdminName = document.getElementById('mobileDrawerAdminName');
    const mobileDrawerRoleBadge = document.getElementById('mobileDrawerRoleBadge');
    const btnMobileDrawerLogout = document.getElementById('btnMobileDrawerLogout');

    const resetToUnauthenticated = () => {
      if (navAdminLink) navAdminLink.innerHTML = '<i class="fa-solid fa-key"></i> Đăng Nhập Quản Trị';
      if (mobileNavAdminLink) mobileNavAdminLink.innerHTML = '<i class="fa-solid fa-key"></i> Đăng Nhập Quản Trị';
      if (footerAdminLink) footerAdminLink.textContent = 'Đăng Nhập Quản Trị';
      if (navDocsLink) navDocsLink.style.display = 'none';
      if (mobileNavDocsLink) mobileNavDocsLink.style.display = 'none';
      if (navAdminProfilePill) navAdminProfilePill.style.display = 'none';
      if (mobileDrawerProfile) mobileDrawerProfile.style.display = 'none';
    };

    if (!token) {
      resetToUnauthenticated();
      return;
    }

    try {
      const res = await fetch('/api/admin/verify-session', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.valid || data.authenticated) {
        const u = data.user || {};
        const role = u.role || 'SuperAdmin';
        
        // Cập nhật nhãn nút /admin động theo trạng thái đăng nhập & vai trò
        if (navAdminLink) navAdminLink.innerHTML = `<i class="fa-solid fa-gauge"></i> Bảng Điều Khiển [${role}]`;
        if (mobileNavAdminLink) mobileNavAdminLink.innerHTML = `<i class="fa-solid fa-gauge"></i> Bảng Điều Khiển [${role}]`;
        if (footerAdminLink) footerAdminLink.textContent = `Bảng Điều Khiển [${role}]`;

        if (navDocsLink) navDocsLink.style.display = 'inline-flex';
        if (mobileNavDocsLink) mobileNavDocsLink.style.display = 'flex';
        document.querySelectorAll('.footer-docs-link').forEach(el => el.style.display = 'inline');

        // Navbar Profile Pill
        if (navAdminProfilePill) {
          navAdminProfilePill.style.display = 'inline-flex';
          if (navAdminName) navAdminName.textContent = u.username || data.username || 'Admin';
          if (navAdminRoleBadge) {
            navAdminRoleBadge.textContent = role;
            navAdminRoleBadge.className = 'role-badge ' + (
              role === 'SuperAdmin' ? 'role-badge-superadmin' :
              role === 'Support' ? 'role-badge-support' : 'role-badge-auditor'
            );
          }
        }

        // Mobile Drawer Profile Pill
        if (mobileDrawerProfile) {
          mobileDrawerProfile.style.display = 'flex';
          if (mobileDrawerAdminName) mobileDrawerAdminName.textContent = u.username || data.username || 'Admin';
          if (mobileDrawerRoleBadge) {
            mobileDrawerRoleBadge.textContent = role;
            mobileDrawerRoleBadge.className = 'role-badge ' + (
              role === 'SuperAdmin' ? 'role-badge-superadmin' :
              role === 'Support' ? 'role-badge-support' : 'role-badge-auditor'
            );
          }
        }
      } else {
        localStorage.removeItem('ltv_admin_session_token');
        resetToUnauthenticated();
      }
    } catch (e) {
      // Offline fallback: keep quiet
    }

    const doLogout = async () => {
      const curToken = localStorage.getItem('ltv_admin_session_token');
      if (curToken) {
        try {
          await fetch('/api/admin/logout', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${curToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          });
        } catch (e) {}
      }
      localStorage.removeItem('ltv_admin_session_token');
      localStorage.removeItem('ltv_admin_role');
      localStorage.removeItem('ltv_admin_permissions');
      localStorage.removeItem('ltv_admin_secret');
      window.location.reload();
    };

    if (btnNavLogout) btnNavLogout.onclick = doLogout;
    if (btnAdminLogout) btnAdminLogout.onclick = doLogout;
    if (btnMobileDrawerLogout) btnMobileDrawerLogout.onclick = doLogout;
  }

  checkAdminSessionPortal();

});
