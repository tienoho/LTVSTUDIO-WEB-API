/**
 * LTVStudio Cloud Portal - Admin Management Controller
 * Handles secure session authentication, license management, OTA versioning, and system audits.
 */

document.addEventListener('DOMContentLoaded', () => {
  // ── STATE ──────────────────────────────────────────────────
  let adminSessionToken = localStorage.getItem('ltv_admin_session_token') || '';
  let adminSessionExpires = parseInt(localStorage.getItem('ltv_admin_session_expires') || '0', 10);
  let adminLicenses = [];
  const selectedKeySet = new Set();
  const currentAdminFilter = { search: '', status: 'ALL', plan: 'ALL' };

  // ── DOM ELEMENTS ───────────────────────────────────────────
  const adminLoginSection = document.getElementById('adminLoginSection');
  const adminDashboardSection = document.getElementById('adminDashboardSection');
  const navAdminProfilePill = document.getElementById('navAdminProfilePill');
  const navAdminName = document.getElementById('navAdminName');
  const btnNavLogout = document.getElementById('btnNavLogout');
  const btnAdminLogout = document.getElementById('btnAdminLogout');

  // Login Form
  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminUsernameInput = document.getElementById('adminUsernameInput');
  const adminSecretInput = document.getElementById('adminSecretInput');
  const btnSubmitAdminAuth = document.getElementById('btnSubmitAdminAuth');
  const adminLoginError = document.getElementById('adminLoginError');
  const adminLoginErrorText = document.getElementById('adminLoginErrorText');
  const btnTogglePassword = document.getElementById('btnTogglePassword');
  const togglePasswordIcon = document.getElementById('togglePasswordIcon');

  // KPI Metrics
  const admTotalKeys = document.getElementById('admTotalKeys');
  const admActiveKeys = document.getElementById('admActiveKeys');
  const admLifetimeKeys = document.getElementById('admLifetimeKeys');
  const admCurrentVer = document.getElementById('admCurrentVer');
  const progressActiveBar = document.getElementById('progressActiveBar');
  const progressUnboundBar = document.getElementById('progressUnboundBar');
  const analyticsRatioText = document.getElementById('analyticsRatioText');
  const dbProviderBadge = document.getElementById('dbProviderBadge');

  // Table & Filters
  const adminTableBody = document.getElementById('adminTableBody');
  const adminSearchInput = document.getElementById('adminSearchInput');
  const btnClearSearch = document.getElementById('btnClearSearch');
  const adminStatusFilter = document.getElementById('adminStatusFilter');
  const adminPlanFilter = document.getElementById('adminPlanFilter');
  const btnReloadAdminLicenses = document.getElementById('btnReloadAdminLicenses');
  const btnExportCsv = document.getElementById('btnExportCsv');
  const btnOpenAuditLogs = document.getElementById('btnOpenAuditLogs');
  const checkSelectAll = document.getElementById('checkSelectAll');
  const bulkActionBar = document.getElementById('bulkActionBar');
  const bulkSelectedCount = document.getElementById('bulkSelectedCount');
  const btnBulkResetHwid = document.getElementById('btnBulkResetHwid');
  const btnBulkToggleRevoke = document.getElementById('btnBulkToggleRevoke');
  const btnBulkExtend = document.getElementById('btnBulkExtend');
  const btnBulkDelete = document.getElementById('btnBulkDelete');
  const btnBulkDeselect = document.getElementById('btnBulkDeselect');

  // Version Config Elements
  const admCfgVersion = document.getElementById('admCfgVersion');
  const admCfgDownloadUrl = document.getElementById('admCfgDownloadUrl');
  const admCfgChangelog = document.getElementById('admCfgChangelog');
  const admCfgForceUpdate = document.getElementById('admCfgForceUpdate');
  const btnSaveVersionConfig = document.getElementById('btnSaveVersionConfig');
  const previewDialogTitle = document.getElementById('previewDialogTitle');
  const previewChangelogBox = document.getElementById('previewChangelogBox');

  // Modals
  const createKeyModal = document.getElementById('createKeyModal');
  const btnOpenCreateModal = document.getElementById('btnOpenCreateModal');
  const btnCloseCreateModal = document.getElementById('btnCloseCreateModal');
  const btnCancelCreateKey = document.getElementById('btnCancelCreateKey');
  const btnSubmitCreateKey = document.getElementById('btnSubmitCreateKey');
  const modalKeyPlan = document.getElementById('modalKeyPlan');
  const modalCustomDaysGroup = document.getElementById('modalCustomDaysGroup');
  const modalCustomDays = document.getElementById('modalCustomDays');
  const modalCustomerName = document.getElementById('modalCustomerName');
  const modalKeyCount = document.getElementById('modalKeyCount');
  const modalKeyNotes = document.getElementById('modalKeyNotes');

  const batchResultModal = document.getElementById('batchResultModal');
  const btnCloseBatchModal = document.getElementById('btnCloseBatchModal');
  const btnFinishBatchModal = document.getElementById('btnFinishBatchModal');
  const btnCopyAllBatchKeys = document.getElementById('btnCopyAllBatchKeys');
  const batchKeysTextArea = document.getElementById('batchKeysTextArea');
  const batchCreatedCount = document.getElementById('batchCreatedCount');

  const extendModal = document.getElementById('extendModal');
  const btnCloseExtendModal = document.getElementById('btnCloseExtendModal');
  const btnCancelExtendModal = document.getElementById('btnCancelExtendModal');
  const btnSubmitExtendModal = document.getElementById('btnSubmitExtendModal');
  const extendTargetKey = document.getElementById('extendTargetKey');
  const extendTargetCustomer = document.getElementById('extendTargetCustomer');
  const extendActionType = document.getElementById('extendActionType');
  const extendDaysGroup = document.getElementById('extendDaysGroup');
  const extendDaysInput = document.getElementById('extendDaysInput');
  const extendNewPlanGroup = document.getElementById('extendNewPlanGroup');
  const extendNewPlanSelect = document.getElementById('extendNewPlanSelect');

  const confirmModal = document.getElementById('confirmModal');
  const btnCloseConfirmModal = document.getElementById('btnCloseConfirmModal');
  const btnCancelConfirmModal = document.getElementById('btnCancelConfirmModal');
  const btnExecuteConfirmModal = document.getElementById('btnExecuteConfirmModal');
  const confirmModalTitle = document.getElementById('confirmModalTitle');
  const confirmModalMessage = document.getElementById('confirmModalMessage');

  const handoverModal = document.getElementById('handoverModal');
  const btnCloseHandoverModal = document.getElementById('btnCloseHandoverModal');
  const btnFinishHandoverModal = document.getElementById('btnFinishHandoverModal');
  const btnCopyHandoverSlip = document.getElementById('btnCopyHandoverSlip');
  const handoverTextarea = document.getElementById('handoverTextarea');

  const auditLogsModal = document.getElementById('auditLogsModal');
  const btnCloseAuditLogsModal = document.getElementById('btnCloseAuditLogsModal');
  const btnRefreshAuditLogs = document.getElementById('btnRefreshAuditLogs');
  const auditLogsTableBody = document.getElementById('auditLogsTableBody');
  const auditLogsTotalCount = document.getElementById('auditLogsTotalCount');

  const btnExportBackup = document.getElementById('btnExportBackup');
  const importJsonInput = document.getElementById('importJsonInput');
  const toastContainer = document.getElementById('toastContainer');

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

  // ── CUSTOM CONFIRM MODAL ───────────────────────────────────
  let confirmCallback = null;
  function showCustomConfirm(title, message, callback) {
    if (confirmModalTitle) confirmModalTitle.innerHTML = title;
    if (confirmModalMessage) confirmModalMessage.textContent = message;
    confirmCallback = callback;
    if (confirmModal) confirmModal.classList.add('active');
  }

  if (btnCloseConfirmModal) btnCloseConfirmModal.addEventListener('click', () => confirmModal.classList.remove('active'));
  if (btnCancelConfirmModal) btnCancelConfirmModal.addEventListener('click', () => confirmModal.classList.remove('active'));
  if (btnExecuteConfirmModal) {
    btnExecuteConfirmModal.addEventListener('click', () => {
      if (confirmModal) confirmModal.classList.remove('active');
      if (typeof confirmCallback === 'function') confirmCallback();
    });
  }

  // ── HEADERS HELPER ─────────────────────────────────────────
  function getAdminHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (adminSessionToken) {
      headers['Authorization'] = `Bearer ${adminSessionToken}`;
    }
    return headers;
  }

  // ── AUTH & SESSION CONTROLLER ──────────────────────────────
  function setAuthenticatedState(isAuthenticated, username = 'Admin') {
    if (isAuthenticated) {
      if (adminLoginSection) adminLoginSection.style.display = 'none';
      if (adminDashboardSection) adminDashboardSection.style.display = 'block';
      if (navAdminProfilePill) navAdminProfilePill.style.display = 'flex';
      if (navAdminName) navAdminName.textContent = username;
    } else {
      if (adminLoginSection) adminLoginSection.style.display = 'flex';
      if (adminDashboardSection) adminDashboardSection.style.display = 'none';
      if (navAdminProfilePill) navAdminProfilePill.style.display = 'none';
      if (adminSecretInput) adminSecretInput.value = '';
    }
  }

  async function checkAdminSession() {
    if (!adminSessionToken || Date.now() > adminSessionExpires) {
      localStorage.removeItem('ltv_admin_session_token');
      localStorage.removeItem('ltv_admin_session_expires');
      adminSessionToken = '';
      setAuthenticatedState(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/verify-session', {
        headers: { 'Authorization': `Bearer ${adminSessionToken}` }
      });
      const data = await res.json();
      if (data.valid) {
        setAuthenticatedState(true, data.username || 'Admin');
        loadAdminData();
      } else {
        localStorage.removeItem('ltv_admin_session_token');
        localStorage.removeItem('ltv_admin_session_expires');
        adminSessionToken = '';
        setAuthenticatedState(false);
      }
    } catch (e) {
      setAuthenticatedState(false);
    }
  }

  // Submit Login
  if (btnSubmitAdminAuth) {
    btnSubmitAdminAuth.addEventListener('click', async () => {
      const username = (adminUsernameInput ? adminUsernameInput.value : '').trim();
      const secret = (adminSecretInput ? adminSecretInput.value : '').trim();

      if (!secret) {
        if (adminLoginError) {
          adminLoginError.style.display = 'block';
          adminLoginErrorText.textContent = 'Vui lòng nhập mật khẩu quản trị!';
        }
        return;
      }

      btnSubmitAdminAuth.disabled = true;
      btnSubmitAdminAuth.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xác thực...';
      if (adminLoginError) adminLoginError.style.display = 'none';

      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-admin-key': secret 
          },
          body: JSON.stringify({ username, secret, password: secret, adminKey: secret })
        });
        const data = await res.json();

        if (res.status === 200 && data.token) {
          adminSessionToken = data.token;
          adminSessionExpires = data.expiresAt || (Date.now() + 24 * 3600 * 1000);
          localStorage.setItem('ltv_admin_session_token', adminSessionToken);
          localStorage.setItem('ltv_admin_session_expires', adminSessionExpires.toString());

          setAuthenticatedState(true, data.username || 'Admin');
          showToast('✓ Đăng nhập quản trị thành công!', 'success');
          loadAdminData();
        } else {
          if (adminLoginError) {
            adminLoginError.style.display = 'block';
            adminLoginErrorText.textContent = data.message || 'Mật khẩu quản trị không chính xác!';
          }
          showToast(data.message || 'Đăng nhập thất bại!', 'error');
        }
      } catch (err) {
        if (adminLoginError) {
          adminLoginError.style.display = 'block';
          adminLoginErrorText.textContent = 'Lỗi kết nối máy chủ: ' + err.message;
        }
      } finally {
        btnSubmitAdminAuth.disabled = false;
        btnSubmitAdminAuth.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Đăng Nhập Quản Trị';
      }
    });
  }

  // Toggle Password
  if (btnTogglePassword && adminSecretInput) {
    btnTogglePassword.addEventListener('click', () => {
      const isPwd = adminSecretInput.type === 'password';
      adminSecretInput.type = isPwd ? 'text' : 'password';
      if (togglePasswordIcon) {
        togglePasswordIcon.className = isPwd ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
      }
    });
  }

  // Logout Handlers
  const handleLogout = async () => {
    try {
      if (adminSessionToken) {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: getAdminHeaders()
        });
      }
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('ltv_admin_session_token');
    localStorage.removeItem('ltv_admin_session_expires');
    adminSessionToken = '';
    setAuthenticatedState(false);
    showToast('Đã đăng xuất tài khoản quản trị.', 'info');
  };

  if (btnNavLogout) btnNavLogout.addEventListener('click', handleLogout);
  if (btnAdminLogout) btnAdminLogout.addEventListener('click', handleLogout);

  // ── SUBTABS CONTROLLER ─────────────────────────────────────
  document.querySelectorAll('.subtab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const subtabId = btn.getAttribute('data-subtab');
      if (!subtabId) return;

      document.querySelectorAll('.subtab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.subtab-pane').forEach(pane => {
        pane.style.display = pane.id === subtabId ? 'block' : 'none';
      });

      if (subtabId === 'subtab-version') {
        loadVersionConfig();
      }
    });
  });

  // ── DATA CONTROLLER ────────────────────────────────────────
  async function loadAdminData() {
    try {
      // 1. Stats
      const statsRes = await fetch('/api/admin/stats', { headers: getAdminHeaders() });
      if (statsRes.status === 401 || statsRes.status === 403) {
        handleLogout();
        return;
      }
      const stats = await statsRes.json();
      if (admTotalKeys) admTotalKeys.textContent = stats.total || '0';
      if (admActiveKeys) admActiveKeys.textContent = stats.active || '0';
      if (admLifetimeKeys) admLifetimeKeys.textContent = stats.lifetime || '0';

      // Ratio
      const total = stats.total || 0;
      const active = stats.active || 0;
      const ratio = total > 0 ? Math.round((active / total) * 100) : 0;
      if (progressActiveBar) progressActiveBar.style.width = `${ratio}%`;
      if (progressUnboundBar) progressUnboundBar.style.width = `${100 - ratio}%`;
      if (analyticsRatioText) analyticsRatioText.textContent = `${ratio}% đã kích hoạt máy`;
      if (dbProviderBadge) {
        dbProviderBadge.innerHTML = `<i class="fa-solid fa-database"></i> Database: ${stats.dbProvider || 'Local / Memory JSON'}`;
      }

      // 2. Licenses Table
      const licRes = await fetch('/api/admin/licenses', { headers: getAdminHeaders() });
      const licData = await licRes.json();
      adminLicenses = licData.licenses || [];
      renderAdminTable();
    } catch (err) {
      showToast('Lỗi khi tải dữ liệu quản trị: ' + err.message, 'error');
    }
  }

  if (btnReloadAdminLicenses) {
    btnReloadAdminLicenses.addEventListener('click', () => {
      showToast('Đang làm mới danh sách...', 'info', 1000);
      loadAdminData();
    });
  }

  // ── RENDER TABLE ───────────────────────────────────────────
  function renderAdminTable() {
    if (!adminTableBody) return;
    const filtered = adminLicenses.filter(lic => {
      // Search
      const q = currentAdminFilter.search.toLowerCase();
      const matchSearch = !q ||
        lic.key.toLowerCase().includes(q) ||
        (lic.customer && lic.customer.toLowerCase().includes(q)) ||
        (lic.machineId && lic.machineId.toLowerCase().includes(q));

      // Status
      let matchStatus = true;
      if (currentAdminFilter.status === 'ACTIVE') matchStatus = lic.status === 'ACTIVE' && !!lic.machineId;
      else if (currentAdminFilter.status === 'UNBOUND') matchStatus = lic.status === 'ACTIVE' && !lic.machineId;
      else if (currentAdminFilter.status === 'REVOKED') matchStatus = lic.status === 'REVOKED';
      else if (currentAdminFilter.status === 'EXPIRED') matchStatus = lic.status === 'EXPIRED';

      // Plan
      let matchPlan = true;
      if (currentAdminFilter.plan !== 'ALL') {
        matchPlan = lic.plan === currentAdminFilter.plan;
      }

      return matchSearch && matchStatus && matchPlan;
    });

    if (filtered.length === 0) {
      adminTableBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-4 text-muted">
            <i class="fa-solid fa-inbox fa-2x" style="opacity: 0.4; margin-bottom: 0.5rem; display: block;"></i>
            Không tìm thấy mã bản quyền nào phù hợp với bộ lọc.
          </td>
        </tr>
      `;
      return;
    }

    adminTableBody.innerHTML = filtered.map(lic => {
      const isChecked = selectedKeySet.has(lic.key) ? 'checked' : '';
      let statusBadge = '<span class="badge badge-active"><span class="legend-dot green"></span> HOẠT ĐỘNG</span>';
      if (lic.status === 'REVOKED') {
        statusBadge = '<span class="badge badge-revoked"><span class="legend-dot red"></span> ĐÃ KHÓA</span>';
      } else if (lic.status === 'EXPIRED') {
        statusBadge = '<span class="badge badge-expired"><span class="legend-dot amber"></span> HẾT HẠN</span>';
      }

      let hwidBadge = '<span class="text-muted"><i class="fa-solid fa-lock-open"></i> Chưa gán</span>';
      if (lic.machineId) {
        hwidBadge = `<span class="text-cyan" title="${escapeHtml(lic.machineId)}"><i class="fa-solid fa-lock"></i> ${escapeHtml(lic.machineId.length > 16 ? lic.machineId.substring(0, 14) + '...' : lic.machineId)}</span>`;
      }

      const expiresStr = lic.expiresAt ? lic.expiresAt.substring(0, 10) : '<span class="text-cyan">Vĩnh viễn</span>';
      const planTag = `<span class="plan-tag">${escapeHtml(lic.plan || 'PRO')}</span>`;

      return `
        <tr data-key="${lic.key}">
          <td>
            <input type="checkbox" class="row-checkbox" data-key="${lic.key}" ${isChecked}>
          </td>
          <td>
            <div class="table-key-cell">
              <span class="code-mono">${escapeHtml(lic.key)}</span>
              <button class="btn-copy-small" onclick="copyText('${escapeHtml(lic.key)}')" title="Sao chép mã">
                <i class="fa-regular fa-copy"></i>
              </button>
            </div>
          </td>
          <td>
            <strong>${escapeHtml(lic.customer || 'Chưa cập nhật')}</strong>
            ${lic.notes ? `<div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(lic.notes)}</div>` : ''}
          </td>
          <td>${planTag}</td>
          <td>${statusBadge}</td>
          <td>${hwidBadge}</td>
          <td>${expiresStr}</td>
          <td class="text-right">
            <div class="action-btn-group">
              <button class="btn-action-icon" onclick="openExtendModal('${lic.key}')" title="Gia hạn hoặc đổi gói">
                <i class="fa-solid fa-calendar-plus text-cyan"></i>
              </button>
              <button class="btn-action-icon" onclick="resetHwid('${lic.key}')" title="Reset HWID (Cho phép gán máy mới)">
                <i class="fa-solid fa-arrows-rotate text-emerald"></i>
              </button>
              <button class="btn-action-icon" onclick="toggleRevoke('${lic.key}', '${lic.status}')" title="${lic.status === 'REVOKED' ? 'Mở khóa key' : 'Khóa key này'}">
                <i class="fa-solid fa-ban ${lic.status === 'REVOKED' ? 'text-emerald' : 'text-amber'}"></i>
              </button>
              <button class="btn-action-icon" onclick="openHandoverModal('${lic.key}')" title="Tạo phiếu bàn giao khách">
                <i class="fa-solid fa-paper-plane text-cyan"></i>
              </button>
              <button class="btn-action-icon text-rose" onclick="deleteLicense('${lic.key}')" title="Xóa key">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row checkbox listeners
    document.querySelectorAll('.row-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const k = e.target.getAttribute('data-key');
        if (e.target.checked) selectedKeySet.add(k);
        else selectedKeySet.delete(k);
        updateBulkBar();
      });
    });
  }

  function updateBulkBar() {
    const count = selectedKeySet.size;
    if (bulkSelectedCount) bulkSelectedCount.textContent = count;
    if (bulkActionBar) bulkActionBar.style.display = count > 0 ? 'flex' : 'none';
    if (checkSelectAll) checkSelectAll.checked = count > 0 && count === adminLicenses.length;
  }

  // Filter Listeners
  if (adminSearchInput) {
    adminSearchInput.addEventListener('input', () => {
      currentAdminFilter.search = adminSearchInput.value.trim();
      if (btnClearSearch) btnClearSearch.style.display = currentAdminFilter.search ? 'block' : 'none';
      renderAdminTable();
    });
  }

  if (btnClearSearch) {
    btnClearSearch.addEventListener('click', () => {
      adminSearchInput.value = '';
      currentAdminFilter.search = '';
      btnClearSearch.style.display = 'none';
      renderAdminTable();
    });
  }

  if (adminStatusFilter) {
    adminStatusFilter.addEventListener('change', () => {
      currentAdminFilter.status = adminStatusFilter.value;
      renderAdminTable();
    });
  }

  if (adminPlanFilter) {
    adminPlanFilter.addEventListener('change', () => {
      currentAdminFilter.plan = adminPlanFilter.value;
      renderAdminTable();
    });
  }

  if (checkSelectAll) {
    checkSelectAll.addEventListener('change', () => {
      if (checkSelectAll.checked) {
        adminLicenses.forEach(l => selectedKeySet.add(l.key));
      } else {
        selectedKeySet.clear();
      }
      renderAdminTable();
      updateBulkBar();
    });
  }

  if (btnBulkDeselect) {
    btnBulkDeselect.addEventListener('click', () => {
      selectedKeySet.clear();
      renderAdminTable();
      updateBulkBar();
    });
  }

  // ── ROW ACTIONS (GLOBAL EXPOSURE) ──────────────────────────
  window.copyText = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`Đã sao chép: ${text}`, 'success');
    });
  };

  window.resetHwid = (key) => {
    showCustomConfirm(
      '<i class="fa-solid fa-arrows-rotate text-cyan"></i> Reset Thiết Bị (HWID)',
      `Bạn có chắc chắn muốn xóa mã thiết bị đã khóa của key [${key}]? Khách hàng sẽ có thể kích hoạt key này trên máy tính mới.`,
      async () => {
        try {
          const res = await fetch(`/api/admin/licenses/${encodeURIComponent(key)}`, {
            method: 'PUT',
            headers: getAdminHeaders(),
            body: JSON.stringify({ resetHwid: true })
          });
          const data = await res.json();
          if (data.success) {
            showToast('✓ Đã reset HWID thành công!', 'success');
            loadAdminData();
          } else {
            showToast(data.message || 'Lỗi khi reset HWID', 'error');
          }
        } catch (err) {
          showToast('Lỗi: ' + err.message, 'error');
        }
      }
    );
  };

  window.toggleRevoke = (key, currentStatus) => {
    const isRevoked = currentStatus === 'REVOKED';
    const newStatus = isRevoked ? 'ACTIVE' : 'REVOKED';
    const actionText = isRevoked ? 'Mở Khóa' : 'Khóa Bản Quyền';

    showCustomConfirm(
      `<i class="fa-solid fa-ban text-amber"></i> ${actionText}`,
      `Bạn có chắc chắn muốn ${isRevoked ? 'mở khóa lại' : 'tạm ngưng/thu hồi'} mã bản quyền [${key}]?`,
      async () => {
        try {
          const res = await fetch(`/api/admin/licenses/${encodeURIComponent(key)}`, {
            method: 'PUT',
            headers: getAdminHeaders(),
            body: JSON.stringify({ status: newStatus })
          });
          const data = await res.json();
          if (data.success) {
            showToast(`✓ Đã ${actionText.toLowerCase()} thành công!`, 'success');
            loadAdminData();
          }
        } catch (err) {
          showToast('Lỗi: ' + err.message, 'error');
        }
      }
    );
  };

  window.deleteLicense = (key) => {
    showCustomConfirm(
      '<i class="fa-solid fa-trash text-rose"></i> Xóa Vĩnh Viễn Key',
      `CẢNH BÁO: Bạn có chắc chắn muốn xóa vĩnh viễn mã bản quyền [${key}] khỏi cơ sở dữ liệu? Thao tác này không thể hoàn tác!`,
      async () => {
        try {
          const res = await fetch(`/api/admin/licenses/${encodeURIComponent(key)}`, {
            method: 'DELETE',
            headers: getAdminHeaders()
          });
          const data = await res.json();
          if (data.success) {
            showToast('✓ Đã xóa mã bản quyền!', 'success');
            selectedKeySet.delete(key);
            loadAdminData();
          }
        } catch (err) {
          showToast('Lỗi: ' + err.message, 'error');
        }
      }
    );
  };

  // ── EXTEND MODAL ───────────────────────────────────────────
  let currentExtendKey = '';
  window.openExtendModal = (key) => {
    currentExtendKey = key;
    const lic = adminLicenses.find(l => l.key === key);
    if (!lic) return;

    if (extendTargetKey) extendTargetKey.textContent = lic.key;
    if (extendTargetCustomer) extendTargetCustomer.textContent = lic.customer || 'Khách hàng';
    if (extendModal) extendModal.classList.add('active');
  };

  if (extendActionType) {
    extendActionType.addEventListener('change', () => {
      const val = extendActionType.value;
      if (extendDaysGroup) extendDaysGroup.style.display = val === 'ADD_DAYS' ? 'block' : 'none';
      if (extendNewPlanGroup) extendNewPlanGroup.style.display = val === 'CHANGE_PLAN' ? 'block' : 'none';
    });
  }

  if (btnCloseExtendModal) btnCloseExtendModal.addEventListener('click', () => extendModal.classList.remove('active'));
  if (btnCancelExtendModal) btnCancelExtendModal.addEventListener('click', () => extendModal.classList.remove('active'));

  if (btnSubmitExtendModal) {
    btnSubmitExtendModal.addEventListener('click', async () => {
      if (!currentExtendKey) return;
      const action = extendActionType.value;
      const payload = {};

      if (action === 'ADD_DAYS') {
        const days = parseInt(extendDaysInput.value, 10);
        if (isNaN(days) || days <= 0) {
          showToast('Vui lòng nhập số ngày hợp lệ!', 'error');
          return;
        }
        payload.addDays = days;
      } else if (action === 'SET_LIFETIME') {
        payload.plan = 'LIFETIME';
        payload.expiresAt = null;
      } else if (action === 'CHANGE_PLAN') {
        payload.plan = extendNewPlanSelect.value;
      }

      btnSubmitExtendModal.disabled = true;
      try {
        const res = await fetch(`/api/admin/licenses/${encodeURIComponent(currentExtendKey)}`, {
          method: 'PUT',
          headers: getAdminHeaders(),
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          showToast('✓ Cập nhật gia hạn bản quyền thành công!', 'success');
          extendModal.classList.remove('active');
          loadAdminData();
        } else {
          showToast(data.message || 'Lỗi cập nhật', 'error');
        }
      } catch (err) {
        showToast('Lỗi: ' + err.message, 'error');
      } finally {
        btnSubmitExtendModal.disabled = false;
      }
    });
  }

  // ── HANDOVER SLIP GENERATOR ────────────────────────────────
  window.openHandoverModal = (key) => {
    const lic = adminLicenses.find(l => l.key === key);
    if (!lic) return;

    const expiresText = lic.expiresAt ? lic.expiresAt.substring(0, 10) : 'Vĩnh viễn (Trọn đời không hết hạn)';
    const text = `================================================
🎉 BÀN GIAO BẢN QUYỀN PODSTUDIO TRANSFORM PRO
================================================
Kính gửi: ${lic.customer || 'Quý Khách Hàng'}
Dịch vụ: Hệ Sinh Thái AI Dubbing & Tách Nhạc LTVStudio

🔑 MÃ BẢN QUYỀN (LICENSE KEY):
👉 ${lic.key}

📦 Gói dịch vụ: ${lic.plan || 'PRO LIFETIME'}
⏳ Hạn sử dụng: ${expiresText}
🛡️ Trạng thái: Sẵn sàng kích hoạt thiết bị (HWID)

📥 TẢI PHẦN MỀM CHÍNH HÃNG:
👉 https://ltvstudio-web-api.vercel.app/

📖 HƯỚNG DẪN KÍCH HOẠT:
1. Tải và cài đặt PodStudio Transform trên máy tính của bạn.
2. Khởi động phần mềm -> Chọn biểu tượng Cài Đặt (Hình bánh răng).
3. Dán chính xác Mã Bản Quyền ở trên và nhấn "Xác Thực Bản Quyền".
4. Phần mềm sẽ tự động kết nối và mở khóa toàn bộ tính năng cao cấp!

⚠️ LƯU Ý BẢO MẬT:
• Mỗi mã bản quyền được bảo vệ bằng công nghệ Hardware ID (HWID Lock).
• Vui lòng không chia sẻ mã này cho người khác.
• Nếu cần chuyển máy tính hoặc cài lại Windows, liên hệ Admin để được hỗ trợ reset HWID miễn phí.

Chúc bạn có những trải nghiệm tuyệt vời cùng PodStudio Transform!
================================================`;

    if (handoverTextarea) handoverTextarea.value = text;
    if (handoverModal) handoverModal.classList.add('active');
  };

  if (btnCloseHandoverModal) btnCloseHandoverModal.addEventListener('click', () => handoverModal.classList.remove('active'));
  if (btnFinishHandoverModal) btnFinishHandoverModal.addEventListener('click', () => handoverModal.classList.remove('active'));
  if (btnCopyHandoverSlip) {
    btnCopyHandoverSlip.addEventListener('click', () => {
      if (!handoverTextarea) return;
      navigator.clipboard.writeText(handoverTextarea.value).then(() => {
        showToast('✓ Đã sao chép toàn bộ phiếu bàn giao!', 'success');
      });
    });
  }

  // ── CREATE KEY MODAL ───────────────────────────────────────
  if (btnOpenCreateModal) btnOpenCreateModal.addEventListener('click', () => createKeyModal.classList.add('active'));
  if (btnCloseCreateModal) btnCloseCreateModal.addEventListener('click', () => createKeyModal.classList.remove('active'));
  if (btnCancelCreateKey) btnCancelCreateKey.addEventListener('click', () => createKeyModal.classList.remove('active'));

  if (modalKeyPlan) {
    modalKeyPlan.addEventListener('change', () => {
      if (modalCustomDaysGroup) {
        modalCustomDaysGroup.style.display = modalKeyPlan.value === 'CUSTOM' ? 'block' : 'none';
      }
    });
  }

  if (btnSubmitCreateKey) {
    btnSubmitCreateKey.addEventListener('click', async () => {
      const plan = modalKeyPlan.value;
      const count = parseInt(modalKeyCount.value, 10) || 1;
      const customer = modalCustomerName.value.trim();
      const notes = modalKeyNotes.value.trim();
      let customDays = null;

      if (plan === 'CUSTOM') {
        customDays = parseInt(modalCustomDays.value, 10);
        if (isNaN(customDays) || customDays <= 0) {
          showToast('Vui lòng nhập số ngày tùy chỉnh hợp lệ!', 'error');
          return;
        }
      }

      btnSubmitCreateKey.disabled = true;
      btnSubmitCreateKey.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tạo...';

      try {
        const res = await fetch('/api/admin/licenses/create', {
          method: 'POST',
          headers: getAdminHeaders(),
          body: JSON.stringify({ plan, count, customer, notes, customDays })
        });
        const data = await res.json();

        if (data.success && data.keys) {
          createKeyModal.classList.remove('active');
          showToast(`✓ Đã phát hành thành công ${data.count} mã bản quyền!`, 'success');
          loadAdminData();

          if (count > 1 || true) {
            // Show batch modal
            if (batchCreatedCount) batchCreatedCount.textContent = data.count;
            if (batchKeysTextArea) {
              batchKeysTextArea.value = data.keys.map(k => k.key).join('\n');
            }
            if (batchResultModal) batchResultModal.classList.add('active');
          }
        } else {
          showToast(data.message || 'Lỗi khi tạo mã bản quyền', 'error');
        }
      } catch (err) {
        showToast('Lỗi: ' + err.message, 'error');
      } finally {
        btnSubmitCreateKey.disabled = false;
        btnSubmitCreateKey.innerHTML = '<i class="fa-solid fa-bolt"></i> Tạo Mã Bản Quyền';
      }
    });
  }

  if (btnCloseBatchModal) btnCloseBatchModal.addEventListener('click', () => batchResultModal.classList.remove('active'));
  if (btnFinishBatchModal) btnFinishBatchModal.addEventListener('click', () => batchResultModal.classList.remove('active'));
  if (btnCopyAllBatchKeys) {
    btnCopyAllBatchKeys.addEventListener('click', () => {
      if (!batchKeysTextArea) return;
      navigator.clipboard.writeText(batchKeysTextArea.value).then(() => {
        showToast('✓ Đã sao chép tất cả mã bản quyền!', 'success');
      });
    });
  }

  // ── OTA VERSION UPDATE ─────────────────────────────────────
  async function loadVersionConfig() {
    try {
      const res = await fetch('/api/transform/version');
      const data = await res.json();
      if (admCfgVersion) admCfgVersion.value = data.version || '1.0.0';
      if (admCfgDownloadUrl) admCfgDownloadUrl.value = data.downloadUrl || '';
      if (admCfgChangelog) admCfgChangelog.value = data.changelog || '';
      if (admCfgForceUpdate) admCfgForceUpdate.checked = !!data.forceUpdate;
      updateVersionPreview();
    } catch (e) {}
  }

  function updateVersionPreview() {
    if (previewDialogTitle && admCfgVersion) {
      previewDialogTitle.textContent = `Đã có bản cập nhật mới: v${admCfgVersion.value}`;
    }
    if (previewChangelogBox && admCfgChangelog) {
      previewChangelogBox.textContent = admCfgChangelog.value || '• Chưa có nội dung cập nhật';
    }
  }

  if (admCfgVersion) admCfgVersion.addEventListener('input', updateVersionPreview);
  if (admCfgChangelog) admCfgChangelog.addEventListener('input', updateVersionPreview);

  if (btnSaveVersionConfig) {
    btnSaveVersionConfig.addEventListener('click', async () => {
      const version = admCfgVersion.value.trim();
      const downloadUrl = admCfgDownloadUrl.value.trim();
      const changelog = admCfgChangelog.value.trim();
      const forceUpdate = admCfgForceUpdate.checked;

      btnSaveVersionConfig.disabled = true;
      btnSaveVersionConfig.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';

      try {
        const res = await fetch('/api/admin/version', {
          method: 'POST',
          headers: getAdminHeaders(),
          body: JSON.stringify({ version, downloadUrl, changelog, forceUpdate })
        });
        const data = await res.json();
        if (data.success) {
          showToast('✓ Đã xuất bản cấu hình phiên bản mới thành công!', 'success');
          if (admCurrentVer) admCurrentVer.textContent = version;
        } else {
          showToast(data.message || 'Lỗi khi lưu cấu hình phiên bản', 'error');
        }
      } catch (err) {
        showToast('Lỗi: ' + err.message, 'error');
      } finally {
        btnSaveVersionConfig.disabled = false;
        btnSaveVersionConfig.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Xuất Bản & Lưu Cập Nhật';
      }
    });
  }

  // ── AUDIT LOGS MODAL ───────────────────────────────────────
  if (btnOpenAuditLogs) {
    btnOpenAuditLogs.addEventListener('click', () => {
      if (auditLogsModal) auditLogsModal.classList.add('active');
      loadAuditLogs();
    });
  }
  if (btnCloseAuditLogsModal) btnCloseAuditLogsModal.addEventListener('click', () => auditLogsModal.classList.remove('active'));
  if (btnRefreshAuditLogs) btnRefreshAuditLogs.addEventListener('click', () => loadAuditLogs());

  async function loadAuditLogs() {
    if (!auditLogsTableBody) return;
    auditLogsTableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải...</td></tr>';
    try {
      const res = await fetch('/api/admin/logs', { headers: getAdminHeaders() });
      const data = await res.json();
      const logs = data.logs || [];
      if (auditLogsTotalCount) auditLogsTotalCount.textContent = `Tổng cộng: ${logs.length} sự kiện`;

      if (logs.length === 0) {
        auditLogsTableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">Chưa có sự kiện kích hoạt nào được ghi nhận.</td></tr>';
        return;
      }

      auditLogsTableBody.innerHTML = logs.slice(0, 50).map(l => {
        const badge = l.success
          ? '<span class="badge badge-active"><span class="legend-dot green"></span> THÀNH CÔNG</span>'
          : '<span class="badge badge-revoked"><span class="legend-dot red"></span> THẤT BẠI</span>';

        return `
          <tr>
            <td style="font-size: 0.82rem; color: var(--text-muted);">${escapeHtml(l.timestamp || '--')}</td>
            <td><span class="code-mono" style="font-size: 0.8rem;">${escapeHtml(l.key || '--')}</span></td>
            <td>${badge}</td>
            <td><span class="text-cyan" style="font-size: 0.82rem;">${escapeHtml(l.machineId || '--')}</span></td>
            <td style="font-size: 0.82rem;">${escapeHtml(l.ip || '--')}</td>
            <td style="font-size: 0.82rem; color: #cbd5e1;">${escapeHtml(l.reason || l.message || '--')}</td>
          </tr>
        `;
      }).join('');
    } catch (e) {
      auditLogsTableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-rose">Lỗi khi tải nhật ký.</td></tr>';
    }
  }

  // ── EXPORT CSV (UTF-8 BOM) ─────────────────────────────────
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', () => {
      if (adminLicenses.length === 0) {
        showToast('Không có dữ liệu bản quyền để xuất!', 'error');
        return;
      }

      let csv = '\uFEFFMã Bản Quyền,Khách Hàng,Gói Cước,Trạng Thái,Thiết Bị HWID,Ngày Hết Hạn,Ghi Chú\n';
      adminLicenses.forEach(lic => {
        csv += `"${lic.key}","${(lic.customer || '').replace(/"/g, '""')}","${lic.plan || ''}","${lic.status || ''}","${lic.machineId || ''}","${lic.expiresAt || 'Vĩnh viễn'}","${(lic.notes || '').replace(/"/g, '""')}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `LTVStudio_Licenses_${new Date().toISOString().substring(0, 10)}.csv`;
      link.click();
      showToast('✓ Đã xuất file Excel / CSV thành công!', 'success');
    });
  }

  // ── BACKUP & RESTORE JSON ──────────────────────────────────
  if (btnExportBackup) {
    btnExportBackup.addEventListener('click', async () => {
      try {
        const res = await fetch('/api/admin/backup', { headers: getAdminHeaders() });
        const data = await res.json();
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `ltvstudio_backup_${new Date().toISOString().substring(0, 10)}.json`;
        link.click();
        showToast('✓ Đã tải xuống file sao lưu CSDL JSON!', 'success');
      } catch (err) {
        showToast('Lỗi tải backup: ' + err.message, 'error');
      }
    });
  }

  if (importJsonInput) {
    importJsonInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          showCustomConfirm(
            '<i class="fa-solid fa-upload text-amber"></i> Khôi Phục CSDL Từ File',
            `Bạn có chắc chắn muốn nạp đè dữ liệu từ file [${file.name}]? Thao tác này sẽ cập nhật toàn bộ danh sách mã bản quyền hiện tại.`,
            async () => {
              const res = await fetch('/api/admin/restore', {
                method: 'POST',
                headers: getAdminHeaders(),
                body: JSON.stringify(parsed)
              });
              const data = await res.json();
              if (data.success) {
                showToast('✓ Khôi phục cơ sở dữ liệu thành công!', 'success');
                loadAdminData();
              } else {
                showToast(data.message || 'Lỗi khôi phục CSDL', 'error');
              }
            }
          );
        } catch (err) {
          showToast('File JSON không hợp lệ: ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
      importJsonInput.value = '';
    });
  }

  // Initial Session Check
  checkAdminSession();

  // ── COPY CODE BUTTONS FOR INTEGRATED DOCS ──────────────────
  document.querySelectorAll('.btn-copy-code').forEach(btn => {
    btn.addEventListener('click', () => {
      const codeText = btn.getAttribute('data-copy') || (btn.previousElementSibling ? btn.previousElementSibling.textContent : '');
      if (!codeText) return;

      navigator.clipboard.writeText(codeText.trim()).then(() => {
        const icon = btn.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-check text-emerald';
        showToast('✓ Đã sao chép vào clipboard!', 'success');
        setTimeout(() => {
          if (icon) icon.className = 'fa-regular fa-copy';
        }, 1800);
      }).catch(err => {
        showToast('Không thể sao chép: ' + err.message, 'error');
      });
    });
  });

});
