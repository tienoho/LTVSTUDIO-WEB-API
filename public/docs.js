/**
 * LTVStudio Cloud Portal - Developer Docs Module
 * Handles code copying, interactive language switching, and documentation navigation.
 */

document.addEventListener('DOMContentLoaded', () => {
  const toastContainer = document.getElementById('toastContainer');
  const navHealthPill = document.getElementById('navHealthPill');
  const healthCheckModal = document.getElementById('healthCheckModal');
  const btnCloseHealthCheck = document.getElementById('btnCloseHealthCheck');
  const healthLoading = document.getElementById('healthLoading');
  const healthContent = document.getElementById('healthContent');

  // ── TOAST NOTIFICATIONS ────────────────────────────────────
  function showToast(message, type = 'info', duration = 2500) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'fa-solid fa-circle-check';
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
});
