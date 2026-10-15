/**
 * LTVStudio Cloud Portal - License Lookup Module
 * Handles public license lookup, verification status, and masked HWID display.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const publicLookupInput = document.getElementById('publicLookupInput');
  const btnClearLookupInput = document.getElementById('btnClearLookupInput');
  const btnPerformLookup = document.getElementById('btnPerformLookup');
  const lookupResultCard = document.getElementById('lookupResultCard');

  const resStatusBadge = document.getElementById('resStatusBadge');
  const resPlanTag = document.getElementById('resPlanTag');
  const resKeyText = document.getElementById('resKeyText');
  const btnCopyResultKey = document.getElementById('btnCopyResultKey');
  const resCustomer = document.getElementById('resCustomer');
  const resType = document.getElementById('resType');
  const resExpires = document.getElementById('resExpires');
  const resDaysLeft = document.getElementById('resDaysLeft');
  const resMachine = document.getElementById('resMachine');
  const resLastActivated = document.getElementById('resLastActivated');

  const toastContainer = document.getElementById('toastContainer');
  const navHealthPill = document.getElementById('navHealthPill');
  const healthPillText = document.getElementById('healthPillText');
  const healthCheckModal = document.getElementById('healthCheckModal');
  const btnCloseHealthCheck = document.getElementById('btnCloseHealthCheck');
  const healthLoading = document.getElementById('healthLoading');
  const healthContent = document.getElementById('healthContent');
  const healthStatusBanner = document.getElementById('healthStatusBanner');
  const healthStatusText = document.getElementById('healthStatusText');
  const healthApiVersion = document.getElementById('healthApiVersion');
  const healthDbProvider = document.getElementById('healthDbProvider');
  const healthMemoryRss = document.getElementById('healthMemoryRss');
  const healthUptime = document.getElementById('healthUptime');

  // ── XSS PREVENTION HELPER (CWE-79) ─────────────────────────
  function escapeHtml(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ── TOAST NOTIFICATIONS ────────────────────────────────────
  function showToast(message, type = 'info', duration = 3500) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'fa-solid fa-circle-info';
    if (type === 'success') icon = 'fa-solid fa-circle-check';
    if (type === 'error') icon = 'fa-solid fa-triangle-exclamation';

    toast.innerHTML = `
      <div class="toast-icon"><i class="${icon}"></i></div>
      <div class="toast-content">${escapeHtml(message)}</div>
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

  // ── INPUT CONTROLLER ───────────────────────────────────────
  if (publicLookupInput) {
    publicLookupInput.addEventListener('input', () => {
      publicLookupInput.value = publicLookupInput.value.toUpperCase().replace(/\s+/g, '');
      if (btnClearLookupInput) {
        btnClearLookupInput.style.display = publicLookupInput.value ? 'block' : 'none';
      }
    });

    publicLookupInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') performLicenseLookup();
    });
  }

  if (btnClearLookupInput) {
    btnClearLookupInput.addEventListener('click', () => {
      publicLookupInput.value = '';
      btnClearLookupInput.style.display = 'none';
      lookupResultCard.style.display = 'none';
      publicLookupInput.focus();
    });
  }

  // Sample Chips Click
  document.querySelectorAll('.lookup-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const sampleKey = chip.getAttribute('data-key');
      if (sampleKey && publicLookupInput) {
        publicLookupInput.value = sampleKey;
        if (btnClearLookupInput) btnClearLookupInput.style.display = 'block';
        performLicenseLookup(sampleKey);
      }
    });
  });

  // ── PERFORM LICENSE LOOKUP ─────────────────────────────────
  async function performLicenseLookup(autoKey = null) {
    const key = (autoKey || (publicLookupInput ? publicLookupInput.value : '')).trim().toUpperCase();
    if (!key) {
      showToast('Vui lòng nhập mã License Key cần tra cứu!', 'error');
      if (publicLookupInput) publicLookupInput.focus();
      return;
    }

    if (btnPerformLookup) {
      btnPerformLookup.disabled = true;
      btnPerformLookup.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tra...';
    }

    try {
      const res = await fetch(`/api/license/lookup?key=${encodeURIComponent(key)}`);
      const data = await res.json();

      if (!data.exists) {
        showToast(data.message || 'Mã bản quyền không tồn tại trong hệ thống!', 'error');
        if (lookupResultCard) lookupResultCard.style.display = 'none';
        return;
      }

      // Display results
      if (lookupResultCard) {
        lookupResultCard.style.display = 'block';
        if (resKeyText) resKeyText.textContent = data.key;
        if (resCustomer) resCustomer.textContent = data.customer || 'Khách hàng cá nhân';
        if (resType) resType.textContent = data.type || (data.plan === 'LIFETIME' ? 'LTVStudio Pro Lifetime' : `LTVStudio ${data.plan}`);
        if (resExpires) resExpires.textContent = data.expiresAt || 'Không giới hạn (Lifetime)';
        if (resDaysLeft) resDaysLeft.textContent = data.daysLeft || 'Vĩnh viễn';
        if (resPlanTag) resPlanTag.textContent = data.plan || 'PRO';
        if (resLastActivated) resLastActivated.textContent = data.lastActivatedAt || 'Chưa kích hoạt';

        if (resStatusBadge) {
          if (data.status === 'ACTIVE') {
            resStatusBadge.className = 'badge badge-active';
            resStatusBadge.innerHTML = '<span class="legend-dot green"></span> HOẠT ĐỘNG';
          } else if (data.status === 'EXPIRED') {
            resStatusBadge.className = 'badge badge-expired';
            resStatusBadge.innerHTML = '<span class="legend-dot amber"></span> HẾT HẠN';
          } else {
            resStatusBadge.className = 'badge badge-revoked';
            resStatusBadge.innerHTML = '<span class="legend-dot red"></span> ĐÃ BỊ KHÓA';
          }
        }

        if (resMachine) {
          if (data.isBound) {
            resMachine.innerHTML = `<span class="text-cyan"><i class="fa-solid fa-lock"></i> ${escapeHtml(data.maskedMachineId)} (Đã khóa máy)</span>`;
          } else {
            resMachine.innerHTML = `<span class="text-muted"><i class="fa-solid fa-lock-open"></i> Chưa gắn thiết bị (Khách có thể kích hoạt máy mới)</span>`;
          }
        }

        showToast('✓ Đã tìm thấy thông tin bản quyền!', 'success');
        lookupResultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } catch (err) {
      showToast('Lỗi khi tra cứu mã bản quyền: ' + err.message, 'error');
    } finally {
      if (btnPerformLookup) {
        btnPerformLookup.disabled = false;
        btnPerformLookup.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Tra Cứu Ngay';
      }
    }
  }

  if (btnPerformLookup) {
    btnPerformLookup.addEventListener('click', () => performLicenseLookup());
  }

  // Interactive Copy with Tooltip
  if (btnCopyResultKey) {
    btnCopyResultKey.addEventListener('click', () => {
      const text = resKeyText ? resKeyText.textContent : '';
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
        btnCopyResultKey.classList.add('copied');
        const icon = btnCopyResultKey.querySelector('i');
        const tooltip = btnCopyResultKey.querySelector('.copy-tooltip');
        if (icon) icon.className = 'fa-solid fa-check';
        if (tooltip) tooltip.textContent = 'Đã chép!';
        showToast(`Đã sao chép: ${text}`, 'success');

        setTimeout(() => {
          btnCopyResultKey.classList.remove('copied');
          if (icon) icon.className = 'fa-regular fa-copy';
          if (tooltip) tooltip.textContent = 'Sao chép';
        }, 1500);
      });
    });
  }

  // ── HEALTH CHECK MONITOR ───────────────────────────────────
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

        if (data.status === 'ok') {
          if (healthStatusBanner) {
            healthStatusBanner.style.background = 'rgba(16, 185, 129, 0.15)';
            healthStatusBanner.style.color = '#10b981';
            healthStatusBanner.style.border = '1px solid rgba(16, 185, 129, 0.3)';
            healthStatusBanner.innerHTML = '<i class="fa-solid fa-circle-check"></i> HỆ THỐNG HOẠT ĐỘNG HOÀN TOÀN BÌNH THƯỜNG';
          }
          if (healthStatusText) healthStatusText.textContent = '200 OK (Sẵn sàng)';
        } else {
          if (healthStatusBanner) {
            healthStatusBanner.style.background = 'rgba(239, 68, 68, 0.15)';
            healthStatusBanner.style.color = '#f87171';
            healthStatusBanner.style.border = '1px solid rgba(239, 68, 68, 0.3)';
            healthStatusBanner.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> PHÁT HIỆN SỰ CỐ DỊCH VỤ';
          }
          if (healthStatusText) healthStatusText.textContent = 'Degraded';
        }

        if (healthApiVersion) healthApiVersion.textContent = data.version || 'v1.0.0';
        if (healthDbProvider) healthDbProvider.textContent = data.dbProvider || 'Local / Memory JSON';
        if (healthMemoryRss) healthMemoryRss.textContent = data.memoryUsage ? `${data.memoryUsage.rss} MB` : 'N/A';
        if (healthUptime) healthUptime.textContent = data.uptime ? `${Math.floor(data.uptime)} giây` : 'N/A';
      } catch (err) {
        if (healthLoading) healthLoading.style.display = 'none';
        if (healthContent) healthContent.style.display = 'block';
        if (healthStatusBanner) {
          healthStatusBanner.style.background = 'rgba(239, 68, 68, 0.15)';
          healthStatusBanner.style.color = '#f87171';
          healthStatusBanner.innerHTML = 'Không thể kết nối đến máy chủ!';
        }
      }
    });
  }

  if (btnCloseHealthCheck && healthCheckModal) {
    btnCloseHealthCheck.addEventListener('click', () => {
      healthCheckModal.classList.remove('active');
    });
  }

  // ── AUTO DEEP LINK LOOKUP (?key=...) ──────────────────────
  const urlParams = new URLSearchParams(window.location.search);
  const keyParam = urlParams.get('key');
  if (keyParam) {
    if (publicLookupInput) {
      publicLookupInput.value = keyParam.trim().toUpperCase();
      if (btnClearLookupInput) btnClearLookupInput.style.display = 'block';
    }
    performLicenseLookup(keyParam);
  }
});
