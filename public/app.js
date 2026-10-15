/**
 * LTVStudio Cloud Portal & Admin App Controller
 * Advanced Macro & Micro UX Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global State & Session Auth
  let currentAdminToken = localStorage.getItem('ltv_admin_token') || sessionStorage.getItem('ltv_admin_token') || '';
  let currentAdminKey = localStorage.getItem('ltv_admin_key') || sessionStorage.getItem('ltv_admin_key') || '';
  let currentAdminUser = null;
  let isAdminLoggedIn = false;
  let cachedLicenses = [];
  let selectedKeySet = new Set();

  // Navigation & Views
  const navLinks = document.querySelectorAll('.nav-link');
  const viewSections = document.querySelectorAll('.view-section');
  const brandLogo = document.getElementById('brandLogo');
  const heroPill = document.getElementById('heroPill');

  // Public Hero Elements
  const heroVersionBadge = document.getElementById('heroVersionBadge');
  const heroChangelog = document.getElementById('heroChangelog');
  const releaseVer = document.getElementById('releaseVer');
  const btnHeroDownload = document.getElementById('btnHeroDownload');
  const btnHeroVerSub = document.getElementById('btnHeroVerSub');
  const navDownloadBtn = document.getElementById('navDownloadBtn');
  const btnGoToCheckKey = document.getElementById('btnGoToCheckKey');

  // Public Lookup Elements
  const publicLookupInput = document.getElementById('publicLookupInput');
  const btnClearLookupInput = document.getElementById('btnClearLookupInput');
  const btnPerformLookup = document.getElementById('btnPerformLookup');
  const lookupResultCard = document.getElementById('lookupResultCard');
  const resStatusBadge = document.getElementById('resStatusBadge');
  const resPlanTag = document.getElementById('resPlanTag');
  const resKeyText = document.getElementById('resKeyText');
  const resType = document.getElementById('resType');
  const resExpires = document.getElementById('resExpires');
  const resDaysLeft = document.getElementById('resDaysLeft');
  const resMachine = document.getElementById('resMachine');
  const btnCopyResultKey = document.getElementById('btnCopyResultKey');

  // Admin KPI Elements
  const admTotalKeys = document.getElementById('admTotalKeys');
  const admActiveKeys = document.getElementById('admActiveKeys');
  const admLifetimeKeys = document.getElementById('admLifetimeKeys');
  const admCurrentVer = document.getElementById('admCurrentVer');
  const analyticsRatioText = document.getElementById('analyticsRatioText');
  const progressActiveBar = document.getElementById('progressActiveBar');
  const progressUnboundBar = document.getElementById('progressUnboundBar');

  // Admin Table & Search Elements
  const adminTableBody = document.getElementById('adminTableBody');
  const adminSearchInput = document.getElementById('adminSearchInput');
  const btnClearSearch = document.getElementById('btnClearSearch');
  const adminStatusFilter = document.getElementById('adminStatusFilter');
  const btnReloadAdminLicenses = document.getElementById('btnReloadAdminLicenses');
  const checkSelectAll = document.getElementById('checkSelectAll');
  const bulkActionBar = document.getElementById('bulkActionBar');
  const bulkSelectedCount = document.getElementById('bulkSelectedCount');
  const btnBulkResetHwid = document.getElementById('btnBulkResetHwid');
  const btnBulkToggleRevoke = document.getElementById('btnBulkToggleRevoke');
  const btnBulkExtend = document.getElementById('btnBulkExtend');
  const btnBulkDelete = document.getElementById('btnBulkDelete');
  const btnBulkDeselect = document.getElementById('btnBulkDeselect');

  // Admin Subtabs
  const subtabBtns = document.querySelectorAll('.subtab-btn');
  const subtabPanes = document.querySelectorAll('.subtab-pane');

  // Admin OTA Version Elements & Live Preview
  const admCfgVersion = document.getElementById('admCfgVersion');
  const admCfgDownloadUrl = document.getElementById('admCfgDownloadUrl');
  const admCfgChangelog = document.getElementById('admCfgChangelog');
  const admCfgForceUpdate = document.getElementById('admCfgForceUpdate');
  const btnSaveVersionConfig = document.getElementById('btnSaveVersionConfig');
  const previewDialogTitle = document.getElementById('previewDialogTitle');
  const previewChangelogBox = document.getElementById('previewChangelogBox');

  // Modals & Backups
  const createKeyModal = document.getElementById('createKeyModal');
  const btnOpenCreateModal = document.getElementById('btnOpenCreateModal');
  const btnCloseCreateModal = document.getElementById('btnCloseCreateModal');
  const btnCancelCreateModal = document.getElementById('btnCancelCreateModal');
  const btnSubmitCreateModal = document.getElementById('btnSubmitCreateModal');
  const modalKeyPlan = document.getElementById('modalKeyPlan');
  const modalKeyCount = document.getElementById('modalKeyCount');
  const modalKeyCustomer = document.getElementById('modalKeyCustomer');
  const modalKeyNotes = document.getElementById('modalKeyNotes');

  // Batch Result Modal
  const batchResultModal = document.getElementById('batchResultModal');
  const btnCloseBatchResultModal = document.getElementById('btnCloseBatchResultModal');
  const batchResultTextarea = document.getElementById('batchResultTextarea');
  const btnCopyAllBatchKeys = document.getElementById('btnCopyAllBatchKeys');
  const btnDownloadBatchTxt = document.getElementById('btnDownloadBatchTxt');

  // Custom Confirm Modal
  const confirmModal = document.getElementById('confirmModal');
  const confirmModalTitle = document.getElementById('confirmModalTitle');
  const confirmModalMessage = document.getElementById('confirmModalMessage');
  const btnCancelConfirmModal = document.getElementById('btnCancelConfirmModal');
  const btnSubmitConfirmModal = document.getElementById('btnSubmitConfirmModal');
  let confirmResolver = null;

  // Custom Extend Modal
  const extendModal = document.getElementById('extendModal');
  const extendModalDesc = document.getElementById('extendModalDesc');
  const btnCloseExtendModal = document.getElementById('btnCloseExtendModal');
  const btnCancelExtendModal = document.getElementById('btnCancelExtendModal');
  const btnSubmitExtendModal = document.getElementById('btnSubmitExtendModal');
  const extendDaysInput = document.getElementById('extendDaysInput');
  const quickExtendChips = document.querySelectorAll('.btn-quick-chip');
  let extendResolver = null;
  let isExtendLifetime = false;

  // Admin Auth Modal
  const adminAuthModal = document.getElementById('adminAuthModal');
  const btnChangeAdminSecret = document.getElementById('btnChangeAdminSecret');
  const btnCloseAuthModal = document.getElementById('btnCloseAuthModal');
  const adminSecretInput = document.getElementById('adminSecretInput');
  const btnSubmitAdminAuth = document.getElementById('btnSubmitAdminAuth');

  // Backup Elements
  const btnExportBackup = document.getElementById('btnExportBackup');
  const importJsonInput = document.getElementById('importJsonInput');

  // ── XSS PREVENTION HELPER (CWE-79) ─────────────────────────
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ── TOAST NOTIFICATIONS 2.0 ────────────────────────────────
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast-item ${type}`;

    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `
      <i class="fa-solid ${icon}"></i>
      <span>${message}</span>
      <div class="toast-progress"></div>
    `;

    toast.addEventListener('click', () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      setTimeout(() => toast.remove(), 250);
    });

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, 3500);
  }

  // ── CUSTOM CONFIRM MODAL (Thay thế window.confirm) ──────────
  function customConfirm(title, message) {
    return new Promise((resolve) => {
      confirmModalTitle.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-amber"></i> ${title}`;
      confirmModalMessage.innerHTML = message;
      confirmModal.classList.add('active');
      confirmResolver = resolve;
    });
  }

  btnSubmitConfirmModal.addEventListener('click', () => {
    confirmModal.classList.remove('active');
    if (confirmResolver) confirmResolver(true);
  });
  btnCancelConfirmModal.addEventListener('click', () => {
    confirmModal.classList.remove('active');
    if (confirmResolver) confirmResolver(false);
  });
  document.getElementById('btnCloseConfirmModal').addEventListener('click', () => {
    confirmModal.classList.remove('active');
    if (confirmResolver) confirmResolver(false);
  });

  // ── CUSTOM EXTEND MODAL (Thay thế window.prompt) ───────────
  function customExtendDialog(key) {
    return new Promise((resolve) => {
      extendModalDesc.innerHTML = `Chọn thời hạn gia hạn cho mã:<br><strong class="code-mono" style="color:#00f2fe;">${key}</strong>`;
      extendModal.classList.add('active');
      isExtendLifetime = false;
      extendDaysInput.value = 30;
      quickExtendChips.forEach(c => c.classList.remove('active'));
      const defaultChip = document.querySelector('.btn-quick-chip[data-days="30"]');
      if (defaultChip) defaultChip.classList.add('active');
      extendResolver = resolve;
    });
  }

  quickExtendChips.forEach(chip => {
    chip.addEventListener('click', () => {
      quickExtendChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      if (chip.dataset.life) {
        isExtendLifetime = true;
        extendDaysInput.disabled = true;
      } else {
        isExtendLifetime = false;
        extendDaysInput.disabled = false;
        extendDaysInput.value = chip.dataset.days;
      }
    });
  });

  btnSubmitExtendModal.addEventListener('click', () => {
    extendModal.classList.remove('active');
    if (extendResolver) {
      extendResolver({
        days: parseInt(extendDaysInput.value, 10) || 30,
        makeLifetime: isExtendLifetime
      });
    }
  });
  btnCancelExtendModal.addEventListener('click', () => {
    extendModal.classList.remove('active');
    if (extendResolver) extendResolver(null);
  });
  btnCloseExtendModal.addEventListener('click', () => {
    extendModal.classList.remove('active');
    if (extendResolver) extendResolver(null);
  });

  // ── URL HASH ROUTING & DEEP LINKING ────────────────────────
  function switchView(viewId, updateHash = true) {
    viewSections.forEach(sec => {
      sec.classList.remove('active');
      if (sec.id === `view-${viewId}`) sec.classList.add('active');
    });

    navLinks.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewId);
    });

    if (updateHash) {
      window.location.hash = viewId === 'public-portal' ? 'portal' : (viewId === 'license-check' ? 'lookup' : 'admin');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (viewId === 'admin-center') {
      if (!isAdminLoggedIn) {
        openAdminLoginModal();
        return;
      }
      loadAdminDashboard();
    }
  }

  navLinks.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetView = btn.dataset.view;
      if (targetView === 'admin-center' && !isAdminLoggedIn) {
        openAdminLoginModal();
      } else {
        switchView(targetView);
      }
    });
  });

  brandLogo.addEventListener('click', () => switchView('public-portal'));
  heroPill.addEventListener('click', () => switchView('public-portal'));
  btnGoToCheckKey.addEventListener('click', () => switchView('license-check'));

  // ── SUBTABS CONTROLLER ─────────────────────────────────────
  subtabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      subtabBtns.forEach(b => b.classList.remove('active'));
      subtabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(btn.dataset.subtab);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // ── 1. LOAD PUBLIC VERSION & LIVE PREVIEW ──────────────────
  async function loadPublicVersion() {
    try {
      const res = await fetch('/api/transform/version');
      if (!res.ok) return;
      const data = await res.json();

      const verString = data.version ? `v${data.version}` : 'v1.0.0';
      heroVersionBadge.textContent = `Phiên Bản Mới Nhất: ${verString} Pro`;
      releaseVer.textContent = verString;
      heroChangelog.textContent = data.changelog || 'Chưa có ghi chú cập nhật.';

      const dlUrl = data.download_url || data.downloadUrl || '#';
      btnHeroDownload.href = dlUrl;
      navDownloadBtn.href = dlUrl;
      btnHeroVerSub.textContent = `Phiên bản ${data.version || '1.0.0'} Pro • 64-bit`;

      // Populate Admin Form fields
      admCfgVersion.value = data.version || '1.0.0';
      admCfgDownloadUrl.value = dlUrl;
      admCfgChangelog.value = data.changelog || '';
      admCfgForceUpdate.checked = !!data.force_update;
      admCurrentVer.textContent = data.version || '1.0.0';

      // Update Live Desktop Preview
      updateDesktopPreview(data.version || '1.0.0', data.changelog || '');
    } catch (e) {
      console.warn('Cannot load version info:', e);
    }
  }

  function updateDesktopPreview(ver, changelog) {
    if (previewDialogTitle) {
      previewDialogTitle.textContent = `Đã có bản cập nhật mới: v${ver}`;
    }
    if (previewChangelogBox) {
      previewChangelogBox.textContent = changelog || '• Cập nhật hiệu suất và độ ổn định hệ thống.';
    }
  }

  admCfgVersion.addEventListener('input', () => {
    updateDesktopPreview(admCfgVersion.value.trim() || '1.0.0', admCfgChangelog.value);
  });
  admCfgChangelog.addEventListener('input', () => {
    updateDesktopPreview(admCfgVersion.value.trim() || '1.0.0', admCfgChangelog.value);
  });

  // ── 2. PUBLIC LICENSE LOOKUP WIDGET ────────────────────────
  // Auto uppercase and clear button
  publicLookupInput.addEventListener('input', () => {
    publicLookupInput.value = publicLookupInput.value.toUpperCase().replace(/\s+/g, '');
    btnClearLookupInput.style.display = publicLookupInput.value ? 'block' : 'none';
  });

  btnClearLookupInput.addEventListener('click', () => {
    publicLookupInput.value = '';
    btnClearLookupInput.style.display = 'none';
    lookupResultCard.style.display = 'none';
    publicLookupInput.focus();
  });

  async function performLicenseLookup(autoKey = null) {
    const key = (autoKey || publicLookupInput.value).trim().toUpperCase();
    if (!key) {
      showToast('Vui lòng nhập mã License Key cần tra cứu!', 'error');
      publicLookupInput.focus();
      return;
    }

    btnPerformLookup.disabled = true;
    btnPerformLookup.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tra...';

    try {
      const res = await fetch(`/api/license/lookup?key=${encodeURIComponent(key)}`);
      const data = await res.json();

      if (!data.exists) {
        showToast(data.message || 'Mã bản quyền không tồn tại trong hệ thống!', 'error');
        lookupResultCard.style.display = 'none';
        return;
      }

      // Display results
      lookupResultCard.style.display = 'block';
      resKeyText.textContent = data.key;
      resType.textContent = data.type || 'LTVStudio Pro';
      resExpires.textContent = data.expiresAt || 'Vĩnh viễn';
      resDaysLeft.textContent = data.daysLeft || 'Không giới hạn';
      resPlanTag.textContent = data.plan || 'PRO';

      if (data.status === 'ACTIVE') {
        resStatusBadge.className = 'badge badge-active';
        resStatusBadge.innerHTML = '<span class="legend-dot green"></span> HOẠT ĐỘNG';
      } else {
        resStatusBadge.className = 'badge badge-revoked';
        resStatusBadge.innerHTML = '<span class="legend-dot red"></span> ĐÃ BỊ KHÓA';
      }

      if (data.isBound) {
        resMachine.innerHTML = `<span class="text-cyan"><i class="fa-solid fa-lock"></i> ${data.maskedMachineId} (Đã khóa máy)</span>`;
      } else {
        resMachine.innerHTML = `<span class="text-muted"><i class="fa-solid fa-lock-open"></i> Chưa gắn thiết bị (Khách có thể kích hoạt máy mới)</span>`;
      }

      showToast('✓ Đã tìm thấy thông tin bản quyền!', 'success');
      lookupResultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      showToast('Lỗi khi tra cứu mã bản quyền: ' + err.message, 'error');
    } finally {
      btnPerformLookup.disabled = false;
      btnPerformLookup.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Kiểm Tra';
    }
  }

  btnPerformLookup.addEventListener('click', () => performLicenseLookup());
  publicLookupInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performLicenseLookup();
  });

  // Interactive Copy with Tooltip
  btnCopyResultKey.addEventListener('click', () => {
    const text = resKeyText.textContent;
    navigator.clipboard.writeText(text).then(() => {
      btnCopyResultKey.classList.add('copied');
      btnCopyResultKey.querySelector('i').className = 'fa-solid fa-check';
      btnCopyResultKey.querySelector('.copy-tooltip').textContent = 'Đã chép!';
      showToast(`Đã sao chép: ${text}`, 'success');

      setTimeout(() => {
        btnCopyResultKey.classList.remove('copied');
        btnCopyResultKey.querySelector('i').className = 'fa-regular fa-copy';
        btnCopyResultKey.querySelector('.copy-tooltip').textContent = 'Sao chép';
      }, 1500);
    });
  });

  // ── 3. ADMIN CENTER CONTROLLER ─────────────────────────────
  function getAdminHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (currentAdminToken) {
      headers['Authorization'] = `Bearer ${currentAdminToken}`;
    }
    if (currentAdminKey) {
      headers['x-admin-key'] = currentAdminKey;
      if (!headers['Authorization']) {
        headers['Authorization'] = `Bearer ${currentAdminKey}`;
      }
    }
    return headers;
  }

  function updateAdminUiState(loggedIn, username = 'Admin') {
    const navPill = document.getElementById('navAdminProfilePill');
    const navName = document.getElementById('navAdminName');
    const btnLogout = document.getElementById('btnAdminLogout');

    if (navPill) {
      navPill.style.display = loggedIn ? 'flex' : 'none';
    }
    if (navName) {
      navName.textContent = username;
    }
    if (btnLogout) {
      btnLogout.style.display = loggedIn ? 'inline-flex' : 'none';
    }
  }

  function clearAdminSession() {
    currentAdminToken = '';
    currentAdminKey = '';
    currentAdminUser = null;
    isAdminLoggedIn = false;
    localStorage.removeItem('ltv_admin_token');
    localStorage.removeItem('ltv_admin_key');
    sessionStorage.removeItem('ltv_admin_token');
    sessionStorage.removeItem('ltv_admin_key');
  }

  async function verifyAdminSessionOnLoad() {
    if (!currentAdminToken && !currentAdminKey) {
      updateAdminUiState(false);
      return false;
    }

    try {
      const res = await fetch('/api/admin/verify-session', { headers: getAdminHeaders() });
      if (res.ok) {
        const data = await res.json();
        isAdminLoggedIn = true;
        currentAdminUser = data.user || { username: 'admin', role: 'SuperAdmin' };
        updateAdminUiState(true, currentAdminUser.username);
        return true;
      } else {
        clearAdminSession();
        updateAdminUiState(false);
        return false;
      }
    } catch (e) {
      console.warn('Session check failed:', e);
      return false;
    }
  }

  function handleSessionExpired() {
    showToast('Phiên đăng nhập Quản trị viên đã hết hạn. Vui lòng đăng nhập lại!', 'error');
    clearAdminSession();
    updateAdminUiState(false);
    switchView('public-portal');
    openAdminLoginModal();
  }

  async function loadAdminDashboard() {
    await Promise.all([loadAdminStats(), loadAdminLicenses()]);
  }

  async function loadAdminStats() {
    try {
      const res = await fetch(`/api/admin/stats`, { headers: getAdminHeaders() });
      if (res.status === 401 || res.status === 403) {
        handleSessionExpired();
        return;
      }
      const data = await res.json();
      admTotalKeys.textContent = data.total || 0;
      admActiveKeys.textContent = data.active || 0;
      admLifetimeKeys.textContent = data.lifetime || 0;
      admCurrentVer.textContent = data.currentVersion || '1.0.0';

      // Update Visual Analytics Bar
      const total = data.total || 1;
      const active = data.active || 0;
      const activePercent = Math.round((active / total) * 100);
      const unboundPercent = 100 - activePercent;

      if (progressActiveBar && progressUnboundBar) {
        progressActiveBar.style.width = `${activePercent}%`;
        progressUnboundBar.style.width = `${unboundPercent}%`;
      }
      if (analyticsRatioText) {
        analyticsRatioText.textContent = `${activePercent}% đã gắn máy (${active}/${data.total} key)`;
      }

      const dbProviderBadge = document.getElementById('dbProviderBadge');
      if (data.dbProvider && dbProviderBadge) {
        const isNeon = data.dbProvider.includes('Neon');
        dbProviderBadge.innerHTML = `<i class="fa-solid fa-database"></i> Database: ${data.dbProvider}`;
        if (isNeon) {
          dbProviderBadge.style.background = 'rgba(16, 185, 129, 0.2)';
          dbProviderBadge.style.color = 'var(--accent-emerald)';
          dbProviderBadge.style.borderColor = 'rgba(16, 185, 129, 0.45)';
        } else {
          dbProviderBadge.style.background = 'rgba(0, 242, 254, 0.12)';
          dbProviderBadge.style.color = 'var(--accent-cyan)';
          dbProviderBadge.style.borderColor = 'rgba(0, 242, 254, 0.3)';
        }
      }
    } catch (e) {
      console.warn('Cannot load admin stats:', e);
    }
  }

  async function loadAdminLicenses() {
    try {
      // Render Skeleton Rows while loading
      adminTableBody.innerHTML = Array(4).fill(0).map(() => `
        <tr>
          <td><div class="skeleton-line" style="width:20px;"></div></td>
          <td><div class="skeleton-line" style="width:140px;"></div></td>
          <td><div class="skeleton-line" style="width:100px;"></div></td>
          <td><div class="skeleton-line" style="width:60px;"></div></td>
          <td><div class="skeleton-line" style="width:70px;"></div></td>
          <td><div class="skeleton-line" style="width:120px;"></div></td>
          <td><div class="skeleton-line" style="width:80px;"></div></td>
          <td><div class="skeleton-line" style="width:90px;"></div></td>
        </tr>
      `).join('');

      const q = encodeURIComponent(adminSearchInput.value.trim());
      const status = encodeURIComponent(adminStatusFilter.value);
      const planEl = document.getElementById('adminPlanFilter');
      const plan = planEl ? encodeURIComponent(planEl.value) : 'ALL';
      const res = await fetch(`/api/admin/licenses?search=${q}&status=${status}&plan=${plan}`, {
        headers: getAdminHeaders()
      });

      if (!res.ok) {
        adminTableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-rose">Không thể tải dữ liệu (Mã xác thực không hợp lệ)</td></tr>`;
        return;
      }

      const data = await res.json();
      cachedLicenses = data.licenses || [];
      renderLicensesTable(cachedLicenses);
    } catch (e) {
      adminTableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-rose">Lỗi kết nối server: ${e.message}</td></tr>`;
    }
  }

  function renderLicensesTable(list) {
    if (!list || list.length === 0) {
      adminTableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">Không có mã bản quyền nào khớp với bộ lọc.</td></tr>`;
      checkSelectAll.checked = false;
      updateBulkActionBar();
      return;
    }

    adminTableBody.innerHTML = list.map(item => {
      const isRevoked = item.status === 'REVOKED';
      const isSelected = selectedKeySet.has(item.key);
      const safeKey = escapeHtml(item.key);
      const safeCustomer = escapeHtml(item.customer || 'Khách hàng');
      const safeNotes = escapeHtml(item.notes || '');
      const safePlan = escapeHtml(item.plan || 'PRO');

      const statusBadge = isRevoked
        ? `<span class="badge badge-revoked"><span class="legend-dot red"></span> KHÓA</span>`
        : `<span class="badge badge-active"><span class="legend-dot green"></span> HOẠT ĐỘNG</span>`;

      const hwidDisplay = item.machineId
        ? `<span class="code-mono" style="font-size:0.8rem; color:#00f2fe;" title="${escapeHtml(item.machineId)}"><i class="fa-solid fa-lock"></i> ${escapeHtml(item.machineId.substring(0, 14))}...</span>`
        : `<span class="text-muted" style="font-size:0.82rem;"><i class="fa-solid fa-lock-open"></i> Chưa gắn máy</span>`;

      let expDisplay = 'Vĩnh viễn';
      if (item.expiresAt && item.expiresAt !== 'LIFETIME' && item.expiresAt !== 'Vĩnh viễn') {
        const d = new Date(item.expiresAt);
        expDisplay = d.toLocaleDateString('vi-VN');
      }

      return `
        <tr class="${isSelected ? 'selected' : ''}">
          <td>
            <input type="checkbox" class="row-checkbox" data-key="${safeKey}" ${isSelected ? 'checked' : ''}>
          </td>
          <td>
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span class="code-mono" style="font-size:0.88rem; font-weight:700;">${safeKey}</span>
              <button class="btn-copy-interactive" style="width:28px; height:28px; font-size:0.75rem;" onclick="copyInteractive(this, '${safeKey}')" title="Sao chép key">
                <i class="fa-regular fa-copy"></i>
                <span class="copy-tooltip">Sao chép</span>
              </button>
            </div>
          </td>
          <td>
            <div style="font-weight:600; color:#f1f5f9;">${safeCustomer}</div>
            <div style="font-size:0.75rem; color:#64748b;">${safeNotes}</div>
          </td>
          <td><span class="plan-tag">${safePlan}</span></td>
          <td>${statusBadge}</td>
          <td>${hwidDisplay}</td>
          <td style="font-size:0.85rem; color:#cbd5e1;">${escapeHtml(expDisplay)}</td>
          <td class="text-right">
            <div class="action-btns">
              <button class="btn-action handover" onclick="openHandoverModal('${safeKey}')" title="Bàn giao khách hàng (Mẫu tin nhắn)"><i class="fa-solid fa-paper-plane"></i></button>
              <button class="btn-action logs" onclick="openLogsModal('${safeKey}')" title="Xem nhật ký kích hoạt của key"><i class="fa-solid fa-clock-rotate-left"></i></button>
              ${item.machineId ? `<button class="btn-action reset" onclick="resetMachineHwid('${safeKey}')" title="Mở khóa HWID máy (Cho phép đổi sang máy khác)"><i class="fa-solid fa-arrows-rotate"></i></button>` : ''}
              <button class="btn-action revoke" onclick="toggleStatus('${safeKey}')" title="${isRevoked ? 'Mở lại key' : 'Khóa key này'}"><i class="fa-solid ${isRevoked ? 'fa-unlock' : 'fa-ban'}"></i></button>
              <button class="btn-action extend" onclick="handleExtendKey('${safeKey}')" title="Gia hạn thời hạn"><i class="fa-solid fa-calendar-plus"></i></button>
              <button class="btn-action delete" onclick="deleteKey('${safeKey}')" title="Xóa vĩnh viễn"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach checkbox events
    document.querySelectorAll('.row-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const k = e.target.dataset.key;
        if (e.target.checked) selectedKeySet.add(k);
        else selectedKeySet.delete(k);
        e.target.closest('tr').classList.toggle('selected', e.target.checked);
        updateBulkActionBar();
      });
    });

    updateBulkActionBar();
  }

  // ── BULK ACTIONS CONTROLLER ────────────────────────────────
  function updateBulkActionBar() {
    const count = selectedKeySet.size;
    bulkSelectedCount.textContent = count;
    bulkActionBar.style.display = count > 0 ? 'flex' : 'none';
    if (checkSelectAll) {
      checkSelectAll.checked = count > 0 && count === cachedLicenses.length;
    }
  }

  checkSelectAll.addEventListener('change', (e) => {
    if (e.target.checked) {
      cachedLicenses.forEach(l => selectedKeySet.add(l.key));
    } else {
      selectedKeySet.clear();
    }
    renderLicensesTable(cachedLicenses);
  });

  btnBulkDeselect.addEventListener('click', () => {
    selectedKeySet.clear();
    renderLicensesTable(cachedLicenses);
  });

  // Bulk Reset HWID
  btnBulkResetHwid.addEventListener('click', async () => {
    const confirmed = await customConfirm(
      'Mở Khóa Thiết Bị Hàng Loạt',
      `Bạn có chắc muốn xóa khóa HWID cho <strong>${selectedKeySet.size}</strong> key đã chọn?<br>Khách hàng sẽ có thể kích hoạt trên máy mới!`
    );
    if (!confirmed) return;

    for (const key of selectedKeySet) {
      await fetch('/api/admin/licenses/reset-hwid', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ key })
      });
    }
    showToast(`✓ Đã mở khóa HWID cho ${selectedKeySet.size} key!`, 'success');
    selectedKeySet.clear();
    loadAdminDashboard();
  });

  // Bulk Toggle Revoke
  btnBulkToggleRevoke.addEventListener('click', async () => {
    for (const key of selectedKeySet) {
      await fetch('/api/admin/licenses/toggle-status', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ key })
      });
    }
    showToast(`✓ Đã đổi trạng thái cho ${selectedKeySet.size} key!`, 'success');
    loadAdminDashboard();
  });

  // Bulk Extend
  btnBulkExtend.addEventListener('click', async () => {
    const extendData = await customExtendDialog('HÀNG LOẠT (' + selectedKeySet.size + ' key)');
    if (!extendData) return;

    for (const key of selectedKeySet) {
      await fetch('/api/admin/licenses/extend', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ key, days: extendData.days, makeLifetime: extendData.makeLifetime })
      });
    }
    showToast(`✓ Đã gia hạn cho ${selectedKeySet.size} key!`, 'success');
    loadAdminDashboard();
  });

  // Bulk Delete
  btnBulkDelete.addEventListener('click', async () => {
    const confirmed = await customConfirm(
      'XÓA HÀNG LOẠT',
      `<span class="text-rose font-bold">CẢNH BÁO:</span> Bạn có chắc chắn muốn xóa vĩnh viễn <strong>${selectedKeySet.size}</strong> key đã chọn? Hành động này không thể hoàn tác!`
    );
    if (!confirmed) return;

    for (const key of selectedKeySet) {
      await fetch('/api/admin/licenses/delete', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ key })
      });
    }
    showToast(`Đã xóa ${selectedKeySet.size} key`, 'info');
    selectedKeySet.clear();
    loadAdminDashboard();
  });

  // Realtime search & filter
  let searchTimer;
  adminSearchInput.addEventListener('input', () => {
    btnClearSearch.style.display = adminSearchInput.value ? 'block' : 'none';
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadAdminLicenses, 300);
  });
  btnClearSearch.addEventListener('click', () => {
    adminSearchInput.value = '';
    btnClearSearch.style.display = 'none';
    loadAdminLicenses();
    adminSearchInput.focus();
  });
  adminStatusFilter.addEventListener('change', loadAdminLicenses);
  btnReloadAdminLicenses.addEventListener('click', loadAdminLicenses);

  // ── ROW ACTION HANDLERS ────────────────────────────────────
  window.copyInteractive = (btn, text) => {
    navigator.clipboard.writeText(text).then(() => {
      btn.classList.add('copied');
      btn.querySelector('i').className = 'fa-solid fa-check';
      const tooltip = btn.querySelector('.copy-tooltip');
      if (tooltip) tooltip.textContent = 'Đã chép!';
      showToast(`Đã sao chép: ${text}`, 'success');

      setTimeout(() => {
        btn.classList.remove('copied');
        btn.querySelector('i').className = 'fa-regular fa-copy';
        if (tooltip) tooltip.textContent = 'Sao chép';
      }, 1500);
    });
  };

  window.copyCode = (btn) => {
    const code = btn.previousElementSibling.innerText;
    navigator.clipboard.writeText(code).then(() => {
      btn.innerHTML = '<i class="fa-solid fa-check text-emerald"></i>';
      showToast('Đã sao chép câu lệnh cURL!', 'success');
      setTimeout(() => {
        btn.innerHTML = '<i class="fa-regular fa-copy"></i>';
      }, 1500);
    });
  };

  window.resetMachineHwid = async (key) => {
    const confirmed = await customConfirm(
      'Mở Khóa Thiết Bị (HWID)',
      `Bạn có chắc muốn mở khóa thiết bị cho key:<br><strong class="code-mono" style="color:#00f2fe;">${key}</strong>?<br>Khách hàng sẽ có thể kích hoạt trên máy mới!`
    );
    if (!confirmed) return;

    try {
      const res = await fetch('/api/admin/licenses/reset-hwid', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ key })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        loadAdminDashboard();
      } else {
        showToast(data.error || 'Thao tác thất bại', 'error');
      }
    } catch (e) {
      showToast('Lỗi: ' + e.message, 'error');
    }
  };

  window.toggleStatus = async (key) => {
    try {
      const res = await fetch('/api/admin/licenses/toggle-status', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ key })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Đã đổi trạng thái sang: ${data.status}`, 'success');
        loadAdminDashboard();
      } else {
        showToast(data.error || 'Thao tác thất bại', 'error');
      }
    } catch (e) {
      showToast('Lỗi: ' + e.message, 'error');
    }
  };

  window.handleExtendKey = async (key) => {
    const extendData = await customExtendDialog(key);
    if (!extendData) return;

    try {
      const res = await fetch('/api/admin/licenses/extend', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ key, days: extendData.days, makeLifetime: extendData.makeLifetime })
      });
      if (res.ok) {
        showToast(`✓ Đã gia hạn thành công cho key ${key}!`, 'success');
        loadAdminDashboard();
      } else {
        const err = await res.json();
        showToast(err.error || 'Lỗi gia hạn', 'error');
      }
    } catch (e) {
      showToast('Lỗi: ' + e.message, 'error');
    }
  };

  window.deleteKey = async (key) => {
    const confirmed = await customConfirm(
      'XÁC NHẬN XÓA KEY',
      `<span class="text-rose font-bold">CẢNH BÁO:</span> Bạn có chắc chắn muốn XÓA VĨNH VIỄN mã key:<br><strong class="code-mono" style="color:#f43f5e;">${key}</strong>?<br>Hành động này không thể hoàn tác!`
    );
    if (!confirmed) return;

    try {
      const res = await fetch('/api/admin/licenses/delete', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ key })
      });
      if (res.ok) {
        showToast(`Đã xóa key ${key}`, 'info');
        loadAdminDashboard();
      } else {
        const err = await res.json();
        showToast(err.error || 'Không thể xóa', 'error');
      }
    } catch (e) {
      showToast('Lỗi: ' + e.message, 'error');
    }
  };

  // ── MODAL CREATE KEY & BATCH RESULT ────────────────────────
  btnOpenCreateModal.addEventListener('click', () => {
    createKeyModal.classList.add('active');
  });
  btnCloseCreateModal.addEventListener('click', () => createKeyModal.classList.remove('active'));
  btnCancelCreateModal.addEventListener('click', () => createKeyModal.classList.remove('active'));

  btnSubmitCreateModal.addEventListener('click', async () => {
    const plan = modalKeyPlan.value;
    const count = parseInt(modalKeyCount.value, 10) || 1;
    const customer = modalKeyCustomer.value.trim() || 'Khách hàng';
    const notes = modalKeyNotes.value.trim();

    btnSubmitCreateModal.disabled = true;
    btnSubmitCreateModal.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tạo...';

    try {
      const res = await fetch('/api/admin/licenses/create', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ plan, count, customer, notes })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        createKeyModal.classList.remove('active');
        modalKeyCustomer.value = '';
        modalKeyNotes.value = '';
        modalKeyCount.value = 1;

        // Display Batch Result View
        const keyLines = data.keys.map(k => `${k.key} | ${k.type} | Hạn: ${k.expiresAt}`).join('\n');
        batchResultTextarea.value = keyLines;
        batchResultModal.classList.add('active');

        showToast(`✓ Đã phát hành thành công ${data.count} mã bản quyền mới!`, 'success');
        loadAdminDashboard();
      } else {
        showToast(data.error || 'Lỗi tạo key', 'error');
      }
    } catch (e) {
      showToast('Lỗi server: ' + e.message, 'error');
    } finally {
      btnSubmitCreateModal.disabled = false;
      btnSubmitCreateModal.innerHTML = '<i class="fa-solid fa-check"></i> Xác Nhận Tạo';
    }
  });

  btnCloseBatchResultModal.addEventListener('click', () => batchResultModal.classList.remove('active'));

  btnCopyAllBatchKeys.addEventListener('click', () => {
    navigator.clipboard.writeText(batchResultTextarea.value).then(() => {
      showToast('✓ Đã sao chép toàn bộ danh sách key!', 'success');
    });
  });

  btnDownloadBatchTxt.addEventListener('click', () => {
    const content = batchResultTextarea.value;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const dlLink = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    dlLink.href = URL.createObjectURL(blob);
    dlLink.download = `LTVStudio_Keys_${dateStr}.txt`;
    dlLink.click();
    URL.revokeObjectURL(dlLink.href);
    showToast('✓ Đã tải file LTVStudio_Keys.txt!', 'success');
  });

  // ── OTA VERSION UPDATE SUBMIT ──────────────────────────────
  btnSaveVersionConfig.addEventListener('click', async () => {
    const version = admCfgVersion.value.trim();
    const download_url = admCfgDownloadUrl.value.trim();
    const changelog = admCfgChangelog.value.trim();
    const force_update = admCfgForceUpdate.checked;

    if (!version) {
      showToast('Vui lòng nhập số phiên bản!', 'error');
      return;
    }

    btnSaveVersionConfig.disabled = true;
    btnSaveVersionConfig.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';

    try {
      const res = await fetch('/api/admin/version', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ version, download_url, changelog, force_update })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(`✓ Đã xuất bản phiên bản ${version} thành công!`, 'success');
        admCurrentVer.textContent = version;
        loadPublicVersion();
      } else {
        showToast(data.error || 'Không thể lưu phiên bản', 'error');
      }
    } catch (e) {
      showToast('Lỗi: ' + e.message, 'error');
    } finally {
      btnSaveVersionConfig.disabled = false;
      btnSaveVersionConfig.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Xuất Bản & Lưu Cập Nhật';
    }
  });

  // ── BACKUP & RESTORE JSON ──────────────────────────────────
  btnExportBackup.addEventListener('click', async () => {
    try {
      const res = await fetch(`/api/admin/backup`, { headers: getAdminHeaders() });
      if (!res.ok) return showToast('Không thể xuất dữ liệu backup', 'error');
      const data = await res.json();

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const dlLink = document.createElement('a');
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      dlLink.href = URL.createObjectURL(blob);
      dlLink.download = `ltvstudio_backup_${dateStr}.json`;
      dlLink.click();
      URL.revokeObjectURL(dlLink.href);

      showToast('✓ Đã tải file sao lưu CSDL JSON thành công!', 'success');
    } catch (e) {
      showToast('Lỗi sao lưu: ' + e.message, 'error');
    }
  });

  importJsonInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        const confirmed = await customConfirm(
          'Khôi Phục Dữ Liệu CSDL',
          'Khôi phục CSDL từ file này?<br>Toàn bộ danh sách bản quyền hiện tại sẽ được cập nhật lại theo file sao lưu!'
        );
        if (!confirmed) return;

        const res = await fetch('/api/admin/restore', {
          method: 'POST',
          headers: getAdminHeaders(),
          body: JSON.stringify(parsed)
        });
        const resData = await res.json();
        if (res.ok) {
          showToast(resData.message || 'Khôi phục thành công!', 'success');
          loadAdminDashboard();
        } else {
          showToast(resData.error || 'Lỗi khôi phục', 'error');
        }
      } catch (err) {
        showToast('File JSON không hợp lệ: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  // ── ADMIN AUTH & SESSION CONTROLLER (STANDARDIZED) ────────
  const adminAuthModal = document.getElementById('adminAuthModal');
  const adminUsernameInput = document.getElementById('adminUsernameInput');
  const adminSecretInput = document.getElementById('adminSecretInput');
  const btnTogglePasswordEye = document.getElementById('btnTogglePasswordEye');
  const eyeIcon = document.getElementById('eyeIcon');
  const checkRememberAdmin = document.getElementById('checkRememberAdmin');
  const adminLoginError = document.getElementById('adminLoginError');
  const adminLoginErrorText = document.getElementById('adminLoginErrorText');
  const btnSubmitAdminAuth = document.getElementById('btnSubmitAdminAuth');
  const btnCloseAuthModal = document.getElementById('btnCloseAuthModal');
  const btnCancelAdminAuth = document.getElementById('btnCancelAdminAuth');
  const btnAdminLogout = document.getElementById('btnAdminLogout');
  const btnNavLogout = document.getElementById('btnNavLogout');

  function openAdminLoginModal() {
    if (adminLoginError) adminLoginError.style.display = 'none';
    if (adminAuthModal) adminAuthModal.classList.add('active');
    setTimeout(() => {
      if (adminSecretInput) adminSecretInput.focus();
    }, 150);
  }

  function closeAdminLoginModal() {
    if (adminAuthModal) adminAuthModal.classList.remove('active');
    if (adminLoginError) adminLoginError.style.display = 'none';
  }

  if (btnCloseAuthModal) btnCloseAuthModal.addEventListener('click', closeAdminLoginModal);
  if (btnCancelAdminAuth) btnCancelAdminAuth.addEventListener('click', closeAdminLoginModal);

  // Toggle Password Eye visibility
  if (btnTogglePasswordEye && adminSecretInput && eyeIcon) {
    btnTogglePasswordEye.addEventListener('click', () => {
      const isPass = adminSecretInput.type === 'password';
      adminSecretInput.type = isPass ? 'text' : 'password';
      eyeIcon.className = isPass ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
    });
  }

  // Handle Login Submit
  if (btnSubmitAdminAuth) {
    btnSubmitAdminAuth.addEventListener('click', async () => {
      const username = (adminUsernameInput ? adminUsernameInput.value.trim() : 'admin') || 'admin';
      const secret = adminSecretInput ? adminSecretInput.value.trim() : '';
      const remember = checkRememberAdmin ? checkRememberAdmin.checked : true;

      if (!secret) {
        if (adminLoginError && adminLoginErrorText) {
          adminLoginErrorText.textContent = 'Vui lòng nhập mật khẩu Quản trị viên!';
          adminLoginError.style.display = 'flex';
        }
        showToast('Vui lòng nhập mật khẩu Quản trị viên!', 'error');
        if (adminSecretInput) adminSecretInput.focus();
        return;
      }

      btnSubmitAdminAuth.disabled = true;
      btnSubmitAdminAuth.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xác thực an toàn...';
      if (adminLoginError) adminLoginError.style.display = 'none';

      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, secret, password: secret })
        });
        const data = await res.json();

        if (!res.ok) {
          const errMsg = data.message || 'Mã Admin Secret hoặc mật khẩu không chính xác!';
          if (adminLoginError && adminLoginErrorText) {
            adminLoginErrorText.textContent = errMsg;
            adminLoginError.style.display = 'flex';
          }
          showToast(errMsg, 'error');
          return;
        }

        // Login Succeeded!
        currentAdminToken = data.token || '';
        currentAdminKey = secret;
        currentAdminUser = data.user || { username, role: 'SuperAdmin' };
        isAdminLoggedIn = true;

        const storage = remember ? localStorage : sessionStorage;
        if (data.token) storage.setItem('ltv_admin_token', data.token);
        storage.setItem('ltv_admin_key', secret);

        closeAdminLoginModal();
        updateAdminUiState(true, currentAdminUser.username);
        showToast('✓ ' + (data.message || 'Đăng nhập Quản trị viên thành công!'), 'success');

        switchView('admin-center');
      } catch (e) {
        showToast('Lỗi kết nối máy chủ: ' + e.message, 'error');
      } finally {
        btnSubmitAdminAuth.disabled = false;
        btnSubmitAdminAuth.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Đăng Nhập Hệ Thống';
      }
    });
  }

  if (adminSecretInput) {
    adminSecretInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') btnSubmitAdminAuth.click();
    });
  }

  // Handle Standard Logout
  async function performAdminLogout() {
    const confirmed = await customConfirm(
      'Xác Nhận Đăng Xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản Quản trị viên không?'
    );
    if (!confirmed) return;

    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: getAdminHeaders()
      });
    } catch (e) {}

    clearAdminSession();
    cachedLicenses = [];
    selectedKeySet.clear();
    updateAdminUiState(false);
    switchView('public-portal');
    showToast('✓ Đã đăng xuất khỏi tài khoản Quản trị viên an toàn!', 'success');
  }

  if (btnAdminLogout) btnAdminLogout.addEventListener('click', performAdminLogout);
  if (btnNavLogout) btnNavLogout.addEventListener('click', performAdminLogout);


  // ── UPGRADE 1: CUSTOMER HANDOVER GENERATOR ──────────────────
  const handoverModal = document.getElementById('handoverModal');
  const handoverMessageText = document.getElementById('handoverMessageText');
  const btnCloseHandoverModal = document.getElementById('btnCloseHandoverModal');
  const btnCancelHandoverModal = document.getElementById('btnCancelHandoverModal');
  const btnCopyHandoverMessage = document.getElementById('btnCopyHandoverMessage');

  window.openHandoverModal = function(key) {
    const item = cachedLicenses.find(l => l.key.toUpperCase() === key.toUpperCase());
    if (!item) {
      showToast('Không tìm thấy thông tin bản quyền!', 'error');
      return;
    }

    let planName = 'LTVStudio Pro Lifetime (Bản Quyền Vĩnh Viễn)';
    if (item.plan === '1_YEAR') planName = 'LTVStudio 1 Năm (365 Ngày)';
    else if (item.plan === 'TRIAL') planName = 'LTVStudio Dùng Thử (Trial 7 Ngày)';
    else if (item.plan === 'ENTERPRISE') planName = 'LTVStudio Doanh Nghiệp (Enterprise)';

    let expStr = 'Vĩnh viễn (Không thời hạn)';
    if (item.expiresAt && item.expiresAt !== 'LIFETIME' && item.expiresAt !== 'Vĩnh viễn') {
      expStr = new Date(item.expiresAt).toLocaleDateString('vi-VN');
    }

    const cust = item.customer || 'Quý khách';
    const domain = window.location.origin;

    const message = `🎉 CHÚC MỪNG ${cust.toUpperCase()} ĐÃ ĐĂNG KÝ BẢN QUYỀN LTVSTUDIO!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Khách hàng: ${cust}
🔑 Mã bản quyền: ${item.key}
📦 Gói sản phẩm: ${planName}
⏳ Hạn sử dụng: ${expStr}
💻 Số thiết bị: 01 máy tính (Cố định theo HWID phần cứng)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 TẢI BỘ CÀI ĐẶT MỚI NHẤT:
👉 Trang chủ & Link tải: ${domain}/
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 HƯỚNG DẪN KÍCH HOẠT:
1️⃣ Mở phần mềm LTVStudio trên máy tính.
2️⃣ Vào mục "Cài đặt" -> Chọn tab "Bản quyền & Hệ thống".
3️⃣ Dán mã bản quyền vào ô và bấm nút "Kích hoạt bản quyền".
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 Cảm ơn bạn đã đồng hành cùng LTVStudio! Hỗ trợ kỹ thuật 24/7 khi cần trợ giúp.`;

    if (handoverMessageText) handoverMessageText.value = message;
    if (handoverModal) handoverModal.classList.add('active');
  };

  if (btnCloseHandoverModal) btnCloseHandoverModal.onclick = () => handoverModal.classList.remove('active');
  if (btnCancelHandoverModal) btnCancelHandoverModal.onclick = () => handoverModal.classList.remove('active');

  if (btnCopyHandoverMessage) {
    btnCopyHandoverMessage.onclick = async () => {
      try {
        await navigator.clipboard.writeText(handoverMessageText.value);
        showToast('✓ Đã sao chép tin nhắn bàn giao khách hàng!', 'success');
        handoverModal.classList.remove('active');
      } catch (err) {
        handoverMessageText.select();
        document.execCommand('copy');
        showToast('✓ Đã sao chép tin nhắn bàn giao!', 'success');
        handoverModal.classList.remove('active');
      }
    };
  }

  // ── UPGRADE 2 & 3: EXPORT CSV & PLAN FILTER LISTENER ────────
  const adminPlanFilter = document.getElementById('adminPlanFilter');
  if (adminPlanFilter) {
    adminPlanFilter.addEventListener('change', () => loadAdminLicenses());
  }

  const btnExportCsv = document.getElementById('btnExportCsv');
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', () => {
      if (!cachedLicenses || cachedLicenses.length === 0) {
        showToast('Không có dữ liệu bản quyền để xuất!', 'warning');
        return;
      }

      const headers = ['STT', 'Mã Bản Quyền', 'Khách Hàng', 'Gói Bản Quyền', 'Hạn Sử Dụng', 'Trạng Thái', 'Mã Thiết Bị (HWID)', 'Ngày Tạo', 'Lần Kích Hoạt Cuối', 'Ghi Chú'];
      const rows = cachedLicenses.map((item, idx) => {
        let expStr = 'Vĩnh viễn';
        if (item.expiresAt && item.expiresAt !== 'LIFETIME' && item.expiresAt !== 'Vĩnh viễn') {
          expStr = new Date(item.expiresAt).toLocaleDateString('vi-VN');
        }
        return [
          idx + 1,
          `"${item.key || ''}"`,
          `"${(item.customer || '').replace(/"/g, '""')}"`,
          `"${item.plan || 'PRO'}"`,
          `"${expStr}"`,
          `"${item.status || 'ACTIVE'}"`,
          `"${item.machineId || 'Chưa gắn máy'}"`,
          `"${item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : ''}"`,
          `"${item.lastVerifiedAt ? new Date(item.lastVerifiedAt).toLocaleString('vi-VN') : 'Chưa có'}"`,
          `"${(item.notes || '').replace(/"/g, '""')}"`
        ].join(',');
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const nowStr = new Date().toISOString().slice(0, 10);
      link.setAttribute('href', url);
      link.setAttribute('download', `LTVStudio_Licenses_${nowStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`✓ Đã xuất thành công ${cachedLicenses.length} mã bản quyền ra file Excel (CSV)!`, 'success');
    });
  }

  // ── UPGRADE 4: ACTIVATION AUDIT LOGS MODAL ──────────────────
  const auditLogsModal = document.getElementById('auditLogsModal');
  const btnCloseAuditLogsModal = document.getElementById('btnCloseAuditLogsModal');
  const btnExitAuditLogsModal = document.getElementById('btnExitAuditLogsModal');
  const btnRefreshAuditLogs = document.getElementById('btnRefreshAuditLogs');
  const auditLogsTableBody = document.getElementById('auditLogsTableBody');
  const auditLogsSubtitle = document.getElementById('auditLogsSubtitle');
  const auditLogsStats = document.getElementById('auditLogsStats');
  const btnOpenAuditLogs = document.getElementById('btnOpenAuditLogs');

  let currentLogFilterKey = '';

  window.openLogsModal = function(key = '') {
    currentLogFilterKey = key;
    if (auditLogsModal) auditLogsModal.classList.add('active');
    loadAuditLogs(key);
  };

  if (btnOpenAuditLogs) {
    btnOpenAuditLogs.onclick = () => openLogsModal('');
  }

  async function loadAuditLogs(key = '') {
    if (auditLogsSubtitle) {
      auditLogsSubtitle.textContent = key ? `Nhật ký kích hoạt của Key: ${key}` : 'Toàn bộ nhật ký xác thực trên hệ thống';
    }
    if (auditLogsTableBody) {
      auditLogsTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu nhật ký...</td></tr>`;
    }

    try {
      const url = `/api/admin/licenses/logs?key=${encodeURIComponent(key)}&limit=100`;
      const res = await fetch(url, { headers: getAdminHeaders() });
      if (!res.ok) {
        if (auditLogsTableBody) auditLogsTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-rose">Không thể tải nhật ký (Chưa đăng nhập Admin)</td></tr>`;
        return;
      }
      const data = await res.json();
      const logs = data.logs || [];
      if (auditLogsStats) {
        auditLogsStats.textContent = `Tổng cộng: ${logs.length} bản ghi xác thực`;
      }

      if (logs.length === 0) {
        if (auditLogsTableBody) auditLogsTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">Chưa có lịch sử xác thực nào được ghi nhận.</td></tr>`;
        return;
      }

      if (auditLogsTableBody) {
        auditLogsTableBody.innerHTML = logs.map(l => {
          const timeStr = l.createdAt ? new Date(l.createdAt).toLocaleString('vi-VN') : '--';
          let badgeCls = 'success';
          let statusText = 'THÀNH CÔNG';
          if (l.status === 'WRONG_HWID') { badgeCls = 'wrong-hwid'; statusText = 'SAI THIẾT BỊ'; }
          else if (l.status === 'EXPIRED') { badgeCls = 'expired'; statusText = 'HẾT HẠN'; }
          else if (l.status === 'REVOKED') { badgeCls = 'revoked'; statusText = 'BỊ KHÓA'; }
          else if (l.status === 'NOT_FOUND') { badgeCls = 'not-found'; statusText = 'SAI KEY'; }

          return `
            <tr>
              <td style="color:#94a3b8; font-size:0.78rem;">${timeStr}</td>
              <td><span class="code-mono" style="font-weight:600; font-size:0.82rem;">${escapeHtml(l.licenseKey)}</span></td>
              <td style="font-family:monospace; font-size:0.8rem; color:#cbd5e1;">${escapeHtml(l.ipAddress || '127.0.0.1')}</td>
              <td><span class="log-badge ${badgeCls}">${statusText}</span></td>
              <td style="color:#cbd5e1; font-size:0.8rem;">${escapeHtml(l.message || '')}</td>
            </tr>
          `;
        }).join('');
      }
    } catch (err) {
      if (auditLogsTableBody) auditLogsTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-rose">Lỗi kết nối: ${escapeHtml(err.message)}</td></tr>`;
    }
  }

  if (btnRefreshAuditLogs) btnRefreshAuditLogs.onclick = () => loadAuditLogs(currentLogFilterKey);
  if (btnCloseAuditLogsModal) btnCloseAuditLogsModal.onclick = () => auditLogsModal.classList.remove('active');
  if (btnExitAuditLogsModal) btnExitAuditLogsModal.onclick = () => auditLogsModal.classList.remove('active');

  // ── UPGRADE 5: HEALTH CHECK MONITOR ─────────────────────────
  const navHealthPill = document.getElementById('navHealthPill');
  const healthPillText = document.getElementById('healthPillText');
  const healthCheckModal = document.getElementById('healthCheckModal');
  const btnCloseHealthModal = document.getElementById('btnCloseHealthModal');
  const btnExitHealthModal = document.getElementById('btnExitHealthModal');
  const healthStatusVal = document.getElementById('healthStatusVal');
  const healthLatencyVal = document.getElementById('healthLatencyVal');
  const healthDbVal = document.getElementById('healthDbVal');
  const healthUptimeVal = document.getElementById('healthUptimeVal');

  async function checkHealthStatus(silent = false) {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (healthPillText) {
        healthPillText.textContent = `API Online (${data.database?.latencyMs || 0}ms)`;
      }
      if (healthStatusVal) healthStatusVal.textContent = data.status === 'healthy' ? '✓ Hoạt Động Tốt' : '⚠ Degraded';
      if (healthLatencyVal) healthLatencyVal.textContent = `${data.database?.latencyMs || 0} ms`;
      if (healthDbVal) healthDbVal.textContent = data.database?.driver === 'neon_postgres' ? 'Neon Postgres (Cloud)' : 'Local File Fallback';
      if (healthUptimeVal) {
        const sec = data.uptimeSeconds || 0;
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        healthUptimeVal.textContent = `${h}h ${m}m ${s}s`;
      }
    } catch (e) {
      if (healthPillText) healthPillText.textContent = 'API Offline';
      if (navHealthPill) navHealthPill.classList.add('degraded');
      if (healthStatusVal) healthStatusVal.textContent = 'Mất kết nối';
    }
  }

  if (navHealthPill) {
    navHealthPill.onclick = () => {
      checkHealthStatus();
      if (healthCheckModal) healthCheckModal.classList.add('active');
    };
  }
  if (btnCloseHealthModal) btnCloseHealthModal.onclick = () => healthCheckModal.classList.remove('active');
  if (btnExitHealthModal) btnExitHealthModal.onclick = () => healthCheckModal.classList.remove('active');

  // Run initial health check
  checkHealthStatus(true);

  // ── INITIALIZATION & DEEP LINK HANDLING ─────────────────────
  loadPublicVersion();
  verifyAdminSessionOnLoad();

  // Check URL parameters (e.g. ?key=LTV-PRO-XXXX)
  const urlParams = new URLSearchParams(window.location.search);
  const paramKey = urlParams.get('key');

  // Check Hash
  const hash = window.location.hash.replace('#', '');
  if (paramKey) {
    switchView('license-check', false);
    publicLookupInput.value = paramKey.toUpperCase();
    btnClearLookupInput.style.display = 'block';
    performLicenseLookup(paramKey);
  } else if (hash === 'lookup') {
    switchView('license-check', false);
  } else if (hash === 'admin') {
    if (isAdminLoggedIn || currentAdminToken || currentAdminKey) {
      verifyAdminSessionOnLoad().then(ok => {
        if (ok) switchView('admin-center', false);
        else {
          switchView('public-portal', false);
          openAdminLoginModal();
        }
      });
    } else {
      switchView('public-portal', false);
      openAdminLoginModal();
    }
  } else {
    switchView('public-portal', false);
  }

  window.addEventListener('hashchange', () => {
    const currentHash = window.location.hash.replace('#', '');
    if (currentHash === 'lookup') switchView('license-check', false);
    else if (currentHash === 'admin') switchView('admin-center', false);
    else switchView('public-portal', false);
  });
});
