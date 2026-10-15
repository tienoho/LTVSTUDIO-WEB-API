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

  // Load initial version data
  loadPublicVersion();

  // ── ADMIN NAVBAR REVEAL (DOCS ACCESS CONTROL) ──────────────
  async function checkAdminSessionPortal() {
    const token = localStorage.getItem('ltv_admin_session_token');
    const navDocsLink = document.getElementById('navDocsLink');
    const navAdminProfilePill = document.getElementById('navAdminProfilePill');
    const navAdminName = document.getElementById('navAdminName');
    const btnNavLogout = document.getElementById('btnNavLogout');

    if (!token) {
      if (navDocsLink) navDocsLink.style.display = 'none';
      if (navAdminProfilePill) navAdminProfilePill.style.display = 'none';
      return;
    }

    try {
      const res = await fetch('/api/admin/verify-session', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.valid) {
        if (navDocsLink) navDocsLink.style.display = 'inline-flex';
        document.querySelectorAll('.footer-docs-link').forEach(el => el.style.display = 'inline');
        if (navAdminProfilePill) {
          navAdminProfilePill.style.display = 'inline-flex';
          if (navAdminName) navAdminName.textContent = data.username || 'Admin';
        }
      } else {
        localStorage.removeItem('ltv_admin_session_token');
        if (navDocsLink) navDocsLink.style.display = 'none';
        if (navAdminProfilePill) navAdminProfilePill.style.display = 'none';
      }
    } catch (e) {
      // Offline fallback: keep quiet
    }

    if (btnNavLogout) {
      btnNavLogout.onclick = async () => {
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
        localStorage.removeItem('ltv_admin_secret');
        window.location.reload();
      };
    }
  }

  checkAdminSessionPortal();

});
