/**
 * LTVStudio Cloud Portal - Admin Management Controller
 * Handles secure session authentication, license management, OTA versioning, and system audits.
 */

document.addEventListener('DOMContentLoaded', () => {
  // ── STATE ──────────────────────────────────────────────────
  let adminSessionToken = localStorage.getItem('ltv_admin_session_token') || '';
  let adminSessionExpires = parseInt(localStorage.getItem('ltv_admin_session_expires') || '0', 10);
  let currentAdminRole = localStorage.getItem('ltv_admin_role') || 'SuperAdmin';
  let currentAdminPermissions = [];
  try {
    currentAdminPermissions = JSON.parse(localStorage.getItem('ltv_admin_permissions') || '[]');
  } catch (e) {
    currentAdminPermissions = [];
  }
  let adminLicenses = [];
  let adminUsers = [];
  let currentAdminUsername = localStorage.getItem('ltv_admin_username') || 'admin';
  const selectedKeySet = new Set();
  const currentAdminFilter = { search: '', status: 'ALL', plan: 'ALL' };
  let selectedLoginRole = 'SuperAdmin';

  // ── DOM ELEMENTS ───────────────────────────────────────────
  const adminLoginSection = document.getElementById('adminLoginSection');
  const adminDashboardSection = document.getElementById('adminDashboardSection');
  const navAdminProfilePill = document.getElementById('navAdminProfilePill');
  const navAdminName = document.getElementById('navAdminName');
  const navAdminRoleBadge = document.getElementById('navAdminRoleBadge');
  const btnNavLogout = document.getElementById('btnNavLogout');
  const btnAdminLogout = document.getElementById('btnAdminLogout');
  const btnThemeToggle = document.getElementById('btnThemeToggle');
  const themeToggleIcon = document.getElementById('themeToggleIcon');
  const btnMobileNav = document.getElementById('btnMobileNav');
  const mobileDrawerOverlay = document.getElementById('mobileDrawerOverlay');
  const mobileDrawerPane = document.getElementById('mobileDrawerPane');
  const btnCloseMobileDrawer = document.getElementById('btnCloseMobileDrawer');

  // Login Form
  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminUsernameInput = document.getElementById('adminUsernameInput');
  const adminSecretInput = document.getElementById('adminSecretInput');
  const btnSubmitAdminAuth = document.getElementById('btnSubmitAdminAuth');
  const adminLoginError = document.getElementById('adminLoginError');
  const adminLoginErrorText = document.getElementById('adminLoginErrorText');
  const btnTogglePassword = document.getElementById('btnTogglePassword');
  const togglePasswordIcon = document.getElementById('togglePasswordIcon');
  const rolePillBtns = document.querySelectorAll('.role-pill-btn');

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

  // ── THEME CONTROLLER ───────────────────────────────────────
  function initTheme() {
    const savedTheme = localStorage.getItem('ltv_theme') || 'dark';
    applyTheme(savedTheme);
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

  // ── ROLE PILLS SELECTOR (LOGIN) ────────────────────────────
  if (rolePillBtns.length > 0) {
    rolePillBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        rolePillBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedLoginRole = btn.getAttribute('data-role') || 'SuperAdmin';
        const user = btn.getAttribute('data-user') || 'admin';
        if (adminUsernameInput) adminUsernameInput.value = user;
        if (adminSecretInput) adminSecretInput.focus();
      });
    });
  }

  // ── ROLE-BASED ACCESS CONTROL (RBAC) ───────────────────────
  function applyRolePermissions(role = 'SuperAdmin', permissions = []) {
    currentAdminRole = role;
    currentAdminPermissions = permissions;
    localStorage.setItem('ltv_admin_role', currentAdminRole);
    localStorage.setItem('ltv_admin_permissions', JSON.stringify(currentAdminPermissions));

    if (navAdminRoleBadge) {
      navAdminRoleBadge.textContent = currentAdminRole;
      navAdminRoleBadge.className = 'role-badge ' + (
        currentAdminRole === 'SuperAdmin' ? 'role-badge-superadmin' :
        currentAdminRole === 'Support' ? 'role-badge-support' : 'role-badge-auditor'
      );
    }

    const roleNoticeBanner = document.getElementById('roleNoticeBanner');
    const roleNoticeText = document.getElementById('roleNoticeText');
    if (roleNoticeBanner && roleNoticeText) {
      if (currentAdminRole === 'SuperAdmin') {
        roleNoticeBanner.style.display = 'none';
      } else if (currentAdminRole === 'Support') {
        roleNoticeBanner.style.display = 'flex';
        roleNoticeBanner.className = 'role-notice-banner';
        roleNoticeText.innerHTML = '<strong>Tài khoản Support:</strong> Được phép tạo mã key, mở khóa thiết bị (HWID), gia hạn. <em>Không có quyền xóa vĩnh viễn key và cấu hình phát hành OTA.</em>';
      } else if (currentAdminRole === 'Auditor') {
        roleNoticeBanner.style.display = 'flex';
        roleNoticeBanner.className = 'role-notice-banner role-warning-banner';
        roleNoticeText.innerHTML = '<strong>Tài khoản Auditor:</strong> Quyền chỉ xem (Read-only). Được xem dữ liệu thống kê, danh sách bản quyền và xuất file Excel. <em>Mọi thao tác chỉnh sửa đều bị khóa.</em>';
      }
    }

    // Buttons visibility
    if (btnExportBackup) btnExportBackup.style.display = currentAdminRole === 'SuperAdmin' ? 'inline-flex' : 'none';
    const lblImport = document.getElementById('lblImportBackup');
    if (lblImport) lblImport.style.display = currentAdminRole === 'SuperAdmin' ? 'inline-flex' : 'none';

    if (btnOpenCreateModal) {
      btnOpenCreateModal.style.display = (currentAdminRole === 'SuperAdmin' || currentAdminRole === 'Support') ? 'inline-flex' : 'none';
    }

    const tabUsersBtn = document.getElementById('tabUsersBtn');
    if (tabUsersBtn) {
      tabUsersBtn.style.display = currentAdminRole === 'SuperAdmin' ? 'inline-flex' : 'none';
    }

    const btnSaveVer = document.getElementById('btnSaveVersionConfig');
    const versionWarning = document.getElementById('versionRoleWarning');
    if (btnSaveVer) {
      if (currentAdminRole === 'SuperAdmin') {
        btnSaveVer.disabled = false;
        btnSaveVer.style.display = 'inline-flex';
        if (versionWarning) versionWarning.style.display = 'none';
      } else {
        btnSaveVer.disabled = true;
        btnSaveVer.style.display = 'none';
        if (versionWarning) versionWarning.style.display = 'flex';
      }
    }

    if (btnBulkDelete) {
      btnBulkDelete.style.display = currentAdminRole === 'SuperAdmin' ? 'inline-flex' : 'none';
    }
    const isMutationAllowed = (currentAdminRole === 'SuperAdmin' || currentAdminRole === 'Support');
    if (btnBulkResetHwid) btnBulkResetHwid.style.display = isMutationAllowed ? 'inline-flex' : 'none';
    if (btnBulkToggleRevoke) btnBulkToggleRevoke.style.display = isMutationAllowed ? 'inline-flex' : 'none';
    if (btnBulkExtend) btnBulkExtend.style.display = isMutationAllowed ? 'inline-flex' : 'none';
  }

  // ── AUTH & SESSION CONTROLLER ──────────────────────────────
  function setAuthenticatedState(isAuthenticated, username = 'Admin', role = 'SuperAdmin', permissions = []) {
    const mobileDrawerProfile = document.getElementById('mobileDrawerProfile');
    const mobileDrawerAdminName = document.getElementById('mobileDrawerAdminName');
    const mobileDrawerRoleBadge = document.getElementById('mobileDrawerRoleBadge');
    const btnMobileDrawerLogout = document.getElementById('btnMobileDrawerLogout');

    if (isAuthenticated) {
      if (adminLoginSection) adminLoginSection.style.display = 'none';
      if (adminDashboardSection) adminDashboardSection.style.display = 'block';
      if (navAdminProfilePill) navAdminProfilePill.style.display = 'flex';
      if (navAdminName) navAdminName.textContent = username;
      currentAdminUsername = username;
      localStorage.setItem('ltv_admin_username', username);
      applyRolePermissions(role, permissions);

      if (mobileDrawerProfile) {
        mobileDrawerProfile.style.display = 'flex';
        if (mobileDrawerAdminName) mobileDrawerAdminName.textContent = username;
        if (mobileDrawerRoleBadge) {
          mobileDrawerRoleBadge.textContent = role;
          mobileDrawerRoleBadge.className = 'role-badge ' + (
            role === 'SuperAdmin' ? 'role-badge-superadmin' :
            role === 'Support' ? 'role-badge-support' : 'role-badge-auditor'
          );
        }
      }
      if (btnMobileDrawerLogout) btnMobileDrawerLogout.onclick = () => handleLogout();
    } else {
      if (adminLoginSection) adminLoginSection.style.display = 'flex';
      if (adminDashboardSection) adminDashboardSection.style.display = 'none';
      if (navAdminProfilePill) navAdminProfilePill.style.display = 'none';
      if (mobileDrawerProfile) mobileDrawerProfile.style.display = 'none';
      if (adminSecretInput) adminSecretInput.value = '';
    }
  }

  async function checkAdminSession() {
    initTheme();
    if (!adminSessionToken || Date.now() > adminSessionExpires) {
      localStorage.removeItem('ltv_admin_session_token');
      localStorage.removeItem('ltv_admin_session_expires');
      localStorage.removeItem('ltv_admin_role');
      localStorage.removeItem('ltv_admin_permissions');
      adminSessionToken = '';
      setAuthenticatedState(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/verify-session', {
        headers: { 'Authorization': `Bearer ${adminSessionToken}` }
      });
      const data = await res.json();
      if (data.valid || data.authenticated) {
        const u = data.user || {};
        setAuthenticatedState(true, u.username || data.username || 'Admin', u.role || currentAdminRole, u.permissions || []);
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
          body: JSON.stringify({ 
            username, 
            secret, 
            password: secret, 
            adminKey: secret,
            role: selectedLoginRole 
          })
        });
        const data = await res.json();

        if (res.status === 200 && data.token) {
          adminSessionToken = data.token;
          adminSessionExpires = data.expiresAt || (Date.now() + 24 * 3600 * 1000);
          localStorage.setItem('ltv_admin_session_token', adminSessionToken);
          localStorage.setItem('ltv_admin_session_expires', adminSessionExpires.toString());

          const u = data.user || {};
          setAuthenticatedState(true, u.username || username || 'Admin', u.role || selectedLoginRole, u.permissions || []);
          showToast(`✓ Đăng nhập thành công với vai trò ${u.role || selectedLoginRole}!`, 'success');
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
    localStorage.removeItem('ltv_admin_role');
    localStorage.removeItem('ltv_admin_permissions');
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
      } else if (subtabId === 'subtab-users') {
        loadAdminUsers();
      }
    });
  });

  // ── SKELETON LOADER ────────────────────────────────────────
  function renderTableSkeleton() {
    if (!adminTableBody) return;
    adminTableBody.innerHTML = Array.from({ length: 5 }).map(() => `
      <tr>
        <td><div class="skeleton-box" style="width: 18px; height: 18px; border-radius: 4px;"></div></td>
        <td><div class="skeleton-box" style="width: 150px; height: 20px;"></div></td>
        <td><div class="skeleton-box" style="width: 130px; height: 20px;"></div></td>
        <td><div class="skeleton-box" style="width: 70px; height: 20px;"></div></td>
        <td><div class="skeleton-box" style="width: 100px; height: 20px;"></div></td>
        <td><div class="skeleton-box" style="width: 110px; height: 20px;"></div></td>
        <td><div class="skeleton-box" style="width: 90px; height: 20px;"></div></td>
        <td class="text-right"><div class="skeleton-box" style="width: 130px; height: 28px; margin-left: auto;"></div></td>
      </tr>
    `).join('');
  }

  // ── DATA CONTROLLER ────────────────────────────────────────
  async function loadAdminData() {
    renderTableSkeleton();
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
          <td colspan="8">
            <div class="empty-state-card">
              <div class="empty-state-icon">
                <i class="fa-solid fa-folder-open"></i>
              </div>
              <h4 class="empty-state-title">Không tìm thấy mã bản quyền nào</h4>
              <p class="empty-state-desc">Không có kết quả phù hợp với từ khóa tìm kiếm hoặc bộ lọc hiện tại. Thử đổi bộ lọc hoặc thêm mã mới.</p>
              ${(currentAdminFilter.search || currentAdminFilter.status !== 'ALL' || currentAdminFilter.plan !== 'ALL') ? `
                <button class="btn btn-sm btn-outline" id="btnResetFiltersEmptyState" style="margin-top: 0.5rem;">
                  <i class="fa-solid fa-rotate-left"></i> Đặt Lại Bộ Lọc
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
      const btnReset = document.getElementById('btnResetFiltersEmptyState');
      if (btnReset) {
        btnReset.addEventListener('click', () => {
          if (adminSearchInput) adminSearchInput.value = '';
          if (adminStatusFilter) adminStatusFilter.value = 'ALL';
          if (adminPlanFilter) adminPlanFilter.value = 'ALL';
          currentAdminFilter.search = '';
          currentAdminFilter.status = 'ALL';
          currentAdminFilter.plan = 'ALL';
          if (btnClearSearch) btnClearSearch.style.display = 'none';
          renderAdminTable();
        });
      }
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

      // Role-based actions
      let actionsHtml = '';
      if (currentAdminRole === 'Auditor') {
        actionsHtml = `<span class="badge" style="background: rgba(148, 163, 184, 0.12); color: #94a3b8; font-size: 0.75rem; border: 1px solid rgba(148, 163, 184, 0.25);"><i class="fa-solid fa-eye"></i> Chỉ xem</span>`;
      } else {
        const canDelete = currentAdminRole === 'SuperAdmin';
        actionsHtml = `
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
            ${canDelete ? `
              <button class="btn-action-icon text-rose" onclick="deleteLicense('${lic.key}')" title="Xóa key">
                <i class="fa-solid fa-trash"></i>
              </button>
            ` : ''}
          </div>
        `;
      }

      const isAuditor = currentAdminRole === 'Auditor';

      return `
        <tr data-key="${lic.key}">
          <td>
            <input type="checkbox" class="row-checkbox" data-key="${lic.key}" ${isChecked} ${isAuditor ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''}>
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
            ${actionsHtml}
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

  // Bulk Reset HWID
  if (btnBulkResetHwid) {
    btnBulkResetHwid.addEventListener('click', () => {
      if (currentAdminRole === 'Auditor') {
        showToast('Tài khoản Auditor chỉ có quyền xem dữ liệu!', 'error');
        return;
      }
      if (selectedKeySet.size === 0) return;
      showCustomConfirm(
        '<i class="fa-solid fa-arrows-rotate text-cyan"></i> Mở Khóa HWID Hàng Loạt',
        `Bạn có chắc muốn mở khóa thiết bị (HWID) cho ${selectedKeySet.size} key đã chọn? Khách hàng sẽ có thể kích hoạt trên máy mới.`,
        async () => {
          let count = 0;
          for (const key of selectedKeySet) {
            try {
              const res = await fetch('/api/admin/licenses/reset-hwid', {
                method: 'POST',
                headers: getAdminHeaders(),
                body: JSON.stringify({ key })
              });
              if (res.ok) count++;
            } catch (e) {}
          }
          showToast(`✓ Đã mở khóa HWID thành công cho ${count} key!`, 'success');
          selectedKeySet.clear();
          loadAdminData();
          updateBulkBar();
        }
      );
    });
  }

  // Bulk Toggle Revoke
  if (btnBulkToggleRevoke) {
    btnBulkToggleRevoke.addEventListener('click', () => {
      if (currentAdminRole === 'Auditor') {
        showToast('Tài khoản Auditor chỉ có quyền xem dữ liệu!', 'error');
        return;
      }
      if (selectedKeySet.size === 0) return;
      showCustomConfirm(
        '<i class="fa-solid fa-ban text-amber"></i> Đổi Trạng Thái Hàng Loạt',
        `Bạn có chắc muốn chuyển đổi trạng thái Khóa / Mở cho ${selectedKeySet.size} key đã chọn?`,
        async () => {
          let count = 0;
          for (const key of selectedKeySet) {
            try {
              const res = await fetch('/api/admin/licenses/toggle-status', {
                method: 'POST',
                headers: getAdminHeaders(),
                body: JSON.stringify({ key })
              });
              if (res.ok) count++;
            } catch (e) {}
          }
          showToast(`✓ Đã cập nhật trạng thái cho ${count} key!`, 'success');
          selectedKeySet.clear();
          loadAdminData();
          updateBulkBar();
        }
      );
    });
  }

  // Bulk Extend
  if (btnBulkExtend) {
    btnBulkExtend.addEventListener('click', () => {
      if (currentAdminRole === 'Auditor') {
        showToast('Tài khoản Auditor chỉ có quyền xem dữ liệu!', 'error');
        return;
      }
      if (selectedKeySet.size === 0) return;
      const daysStr = prompt(`Nhập số ngày muốn gia hạn cho ${selectedKeySet.size} key đã chọn:`, '30');
      if (!daysStr) return;
      const days = parseInt(daysStr, 10);
      if (isNaN(days) || days <= 0) {
        showToast('Số ngày gia hạn không hợp lệ!', 'error');
        return;
      }
      showCustomConfirm(
        '<i class="fa-solid fa-calendar-plus text-cyan"></i> Gia Hạn Hàng Loạt',
        `Gia hạn thêm ${days} ngày cho ${selectedKeySet.size} key đã chọn?`,
        async () => {
          let count = 0;
          for (const key of selectedKeySet) {
            try {
              const res = await fetch('/api/admin/licenses/extend', {
                method: 'POST',
                headers: getAdminHeaders(),
                body: JSON.stringify({ key, days })
              });
              if (res.ok) count++;
            } catch (e) {}
          }
          showToast(`✓ Đã gia hạn ${days} ngày cho ${count} key!`, 'success');
          selectedKeySet.clear();
          loadAdminData();
          updateBulkBar();
        }
      );
    });
  }

  // Bulk Delete
  if (btnBulkDelete) {
    btnBulkDelete.addEventListener('click', () => {
      if (currentAdminRole !== 'SuperAdmin') {
        showToast('Chỉ SuperAdmin mới có quyền xóa vĩnh viễn key!', 'error');
        return;
      }
      if (selectedKeySet.size === 0) return;
      showCustomConfirm(
        '<i class="fa-solid fa-trash text-rose"></i> CẢNH BÁO: XÓA HÀNG LOẠT',
        `Bạn có chắc chắn muốn XÓA VĨNH VIỄN ${selectedKeySet.size} key đã chọn? Hành động này KHÔNG THỂ HOÀN TÁC!`,
        async () => {
          let count = 0;
          for (const key of selectedKeySet) {
            try {
              const res = await fetch('/api/admin/licenses/delete', {
                method: 'POST',
                headers: getAdminHeaders(),
                body: JSON.stringify({ key })
              });
              if (res.ok) count++;
            } catch (e) {}
          }
          showToast(`✓ Đã xóa vĩnh viễn ${count} key!`, 'info');
          selectedKeySet.clear();
          loadAdminData();
          updateBulkBar();
        }
      );
    });
  }

  // ── ROW ACTIONS (GLOBAL EXPOSURE) ──────────────────────────
  window.copyText = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`Đã sao chép: ${text}`, 'success');
    });
  };

  window.resetHwid = (key) => {
    if (currentAdminRole === 'Auditor') {
      showToast('Tài khoản Auditor chỉ có quyền xem dữ liệu!', 'error');
      return;
    }
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
    if (currentAdminRole === 'Auditor') {
      showToast('Tài khoản Auditor chỉ có quyền xem dữ liệu!', 'error');
      return;
    }
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
    if (currentAdminRole !== 'SuperAdmin') {
      showToast('Chỉ SuperAdmin mới có quyền xóa mã bản quyền!', 'error');
      return;
    }
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
    if (currentAdminRole === 'Auditor') {
      showToast('Tài khoản Auditor chỉ có quyền xem dữ liệu!', 'error');
      return;
    }
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
🎉 BÀN GIAO BẢN QUYỀN LTVSTUDIO PRO
================================================
Kính gửi: ${lic.customer || 'Quý Khách Hàng'}
Dịch vụ: Hệ Sinh Thái AI Dubbing & Tách Nhạc LTVStudio

🔑 MÃ BẢN QUYỀN (LICENSE KEY):
👉 ${lic.key}

📦 Gói dịch vụ: ${lic.plan || 'PRO LIFETIME'}
⏳ Hạn sử dụng: ${expiresText}
🛡️ Trạng thái: Sẵn sàng kích hoạt thiết bị (HWID)

📥 TẢI PHẦN MỀM CHÍNH HÃNG:
👉 https://ltv-tools.vercel.app/

📖 HƯỚNG DẪN KÍCH HOẠT:
1. Tải và cài đặt LTVStudio trên máy tính của bạn.
2. Khởi động phần mềm -> Chọn biểu tượng Cài Đặt (Hình bánh răng).
3. Dán chính xác Mã Bản Quyền ở trên và nhấn "Xác Thực Bản Quyền".
4. Phần mềm sẽ tự động kết nối và mở khóa toàn bộ tính năng cao cấp!

⚠️ LƯU Ý BẢO MẬT:
• Mỗi mã bản quyền được bảo vệ bằng công nghệ Hardware ID (HWID Lock).
• Vui lòng không chia sẻ mã này cho người khác.
• Nếu cần chuyển máy tính hoặc cài lại Windows, liên hệ Admin để được hỗ trợ reset HWID miễn phí.

Chúc bạn có những trải nghiệm tuyệt vời cùng LTVStudio!
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

  // ── CHANGE PASSWORD CONTROLLER ─────────────────────────────
  const changePasswordModal = document.getElementById('changePasswordModal');
  const btnOpenChangePasswordModal = document.getElementById('btnOpenChangePasswordModal');
  const btnCloseChangePasswordModal = document.getElementById('btnCloseChangePasswordModal');
  const btnCancelChangePassword = document.getElementById('btnCancelChangePassword');
  const changePasswordForm = document.getElementById('changePasswordForm');
  const btnSubmitChangePassword = document.getElementById('btnSubmitChangePassword');
  const changePasswordTargetUser = document.getElementById('changePasswordTargetUser');
  const changePasswordUsernameDisplay = document.getElementById('changePasswordUsernameDisplay');
  const changePasswordRoleDisplay = document.getElementById('changePasswordRoleDisplay');
  const currentPasswordGroup = document.getElementById('currentPasswordGroup');
  const currentPasswordInput = document.getElementById('currentPasswordInput');
  const newPasswordInput = document.getElementById('newPasswordInput');
  const confirmPasswordInput = document.getElementById('confirmPasswordInput');

  // Toggle Eye Buttons for Password Inputs
  function bindToggleEye(btnId, inputId) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (btn && input) {
      btn.addEventListener('click', () => {
        const isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';
        const icon = btn.querySelector('i');
        if (icon) icon.className = isPass ? 'fa-regular fa-eye-slash text-cyan' : 'fa-regular fa-eye';
      });
    }
  }

  bindToggleEye('btnToggleCurrentPassword', 'currentPasswordInput');
  bindToggleEye('btnToggleNewPassword', 'newPasswordInput');
  bindToggleEye('btnToggleConfirmPassword', 'confirmPasswordInput');
  bindToggleEye('btnToggleNewUserPassword', 'newUserPasswordInput');

  window.openChangePasswordDialog = function(targetUser = null) {
    if (!changePasswordModal) return;
    const isSelf = !targetUser || targetUser.username === currentAdminUsername;

    if (changePasswordTargetUser) {
      changePasswordTargetUser.value = isSelf ? currentAdminUsername : targetUser.username;
    }
    if (changePasswordUsernameDisplay) {
      changePasswordUsernameDisplay.textContent = isSelf ? currentAdminUsername : targetUser.username;
    }
    if (changePasswordRoleDisplay) {
      const role = isSelf ? currentAdminRole : (targetUser.role || 'Support');
      changePasswordRoleDisplay.textContent = role;
      changePasswordRoleDisplay.className = 'role-badge ' + (
        role === 'SuperAdmin' ? 'role-badge-superadmin' :
        role === 'Support' ? 'role-badge-support' : 'role-badge-auditor'
      );
    }

    if (currentPasswordGroup) {
      currentPasswordGroup.style.display = isSelf ? 'block' : 'none';
    }

    if (currentPasswordInput) currentPasswordInput.value = '';
    if (newPasswordInput) newPasswordInput.value = '';
    if (confirmPasswordInput) confirmPasswordInput.value = '';

    changePasswordModal.classList.add('active');
  };

  if (btnOpenChangePasswordModal) {
    btnOpenChangePasswordModal.addEventListener('click', () => {
      window.openChangePasswordDialog(null);
    });
  }

  if (btnCloseChangePasswordModal) {
    btnCloseChangePasswordModal.addEventListener('click', () => {
      changePasswordModal.classList.remove('active');
    });
  }

  if (btnCancelChangePassword) {
    btnCancelChangePassword.addEventListener('click', () => {
      changePasswordModal.classList.remove('active');
    });
  }

  if (btnSubmitChangePassword) {
    btnSubmitChangePassword.addEventListener('click', async () => {
      const targetUsername = changePasswordTargetUser ? changePasswordTargetUser.value : currentAdminUsername;
      const isSelf = targetUsername === currentAdminUsername;
      const currentPassword = currentPasswordInput ? currentPasswordInput.value.trim() : '';
      const newPassword = newPasswordInput ? newPasswordInput.value.trim() : '';
      const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value.trim() : '';

      if (isSelf && !currentPassword) {
        showToast('Vui lòng nhập mật khẩu hiện tại!', 'error');
        if (currentPasswordInput) currentPasswordInput.focus();
        return;
      }

      if (!newPassword || newPassword.length < 6) {
        showToast('Mật khẩu mới phải có tối thiểu 6 ký tự!', 'error');
        if (newPasswordInput) newPasswordInput.focus();
        return;
      }

      if (newPassword !== confirmPassword) {
        showToast('Xác nhận mật khẩu mới không trùng khớp!', 'error');
        if (confirmPasswordInput) confirmPasswordInput.focus();
        return;
      }

      btnSubmitChangePassword.disabled = true;
      btnSubmitChangePassword.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';

      try {
        const res = await fetch('/api/admin/change-password', {
          method: 'POST',
          headers: getAdminHeaders(),
          body: JSON.stringify({
            targetUsername,
            currentPassword,
            newPassword
          })
        });
        const data = await res.json();

        if (res.status === 200 && data.success) {
          showToast(data.message || '✓ Đổi mật khẩu thành công!', 'success');
          changePasswordModal.classList.remove('active');
        } else {
          showToast(data.message || 'Lỗi khi đổi mật khẩu!', 'error');
        }
      } catch (err) {
        showToast('Lỗi: ' + err.message, 'error');
      } finally {
        btnSubmitChangePassword.disabled = false;
        btnSubmitChangePassword.innerHTML = '<i class="fa-solid fa-shield-check"></i> Cập Nhật Mật Khẩu';
      }
    });
  }

  // ── USER MANAGEMENT CONTROLLER ─────────────────────────────
  const usersTableBody = document.getElementById('usersTableBody');
  const usersTotalBadge = document.getElementById('usersTotalBadge');
  const btnReloadUsers = document.getElementById('btnReloadUsers');
  const createUserModal = document.getElementById('createUserModal');
  const btnOpenCreateUserModal = document.getElementById('btnOpenCreateUserModal');
  const btnCloseCreateUserModal = document.getElementById('btnCloseCreateUserModal');
  const btnCancelCreateUser = document.getElementById('btnCancelCreateUser');
  const btnSubmitCreateUser = document.getElementById('btnSubmitCreateUser');
  const newUsernameInput = document.getElementById('newUsernameInput');
  const newFullNameInput = document.getElementById('newFullNameInput');
  const newEmailInput = document.getElementById('newEmailInput');
  const newUserPasswordInput = document.getElementById('newUserPasswordInput');
  const newUserRoleSelect = document.getElementById('newUserRoleSelect');

  async function loadAdminUsers() {
    if (!usersTableBody) return;
    usersTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-muted">
          <i class="fa-solid fa-spinner fa-spin"></i> Đang tải danh sách người dùng...
        </td>
      </tr>
    `;

    try {
      const res = await fetch('/api/admin/users', { headers: getAdminHeaders() });
      const data = await res.json();

      if (res.status === 200 && Array.isArray(data.users)) {
        adminUsers = data.users;
        if (usersTotalBadge) usersTotalBadge.textContent = `${adminUsers.length} Tài Khoản`;
        renderUsersTable(adminUsers);
      } else {
        usersTableBody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center py-4 text-rose">
              ${data.message || 'Không có quyền truy cập danh sách người dùng.'}
            </td>
          </tr>
        `;
      }
    } catch (e) {
      usersTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4 text-rose">
            Lỗi kết nối máy chủ khi tải người dùng.
          </td>
        </tr>
      `;
    }
  }

  function renderUsersTable(users) {
    if (!usersTableBody) return;
    if (users.length === 0) {
      usersTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4 text-muted">
            Chưa có tài khoản người dùng nào.
          </td>
        </tr>
      `;
      return;
    }

    usersTableBody.innerHTML = users.map(u => {
      const isRoot = u.username === 'admin';
      const isSelf = u.username.toLowerCase() === currentAdminUsername.toLowerCase();
      const roleBadgeClass = u.role === 'SuperAdmin' ? 'role-badge-superadmin' :
                             u.role === 'Support' ? 'role-badge-support' : 'role-badge-auditor';

      const isSuspended = u.status === 'SUSPENDED' || u.status === 'LOCKED';
      const statusBadge = isSuspended
        ? '<span class="badge badge-revoked"><span class="legend-dot red"></span> BỊ TẠM KHÓA</span>'
        : '<span class="badge badge-active"><span class="legend-dot green"></span> HOẠT ĐỘNG</span>';

      const lastLogin = u.lastLoginAt
        ? new Date(u.lastLoginAt).toLocaleString('vi-VN')
        : '<span class="text-muted">Chưa đăng nhập</span>';

      const toggleBtnTitle = isSuspended ? 'Mở khóa tài khoản' : 'Tạm khóa tài khoản';
      const toggleIcon = isSuspended ? 'fa-lock-open text-emerald' : 'fa-lock text-amber';

      let actionsHtml = `
        <div style="display: flex; align-items: center; justify-content: flex-end; gap: 0.4rem;">
          <button class="btn btn-sm btn-outline" onclick="window.openChangePasswordDialog({username: '${escapeHtml(u.username)}', role: '${escapeHtml(u.role)}'})" title="Đổi mật khẩu cho user này">
            <i class="fa-solid fa-key"></i> Đổi Pass
          </button>
      `;

      if (!isRoot && !isSelf) {
        actionsHtml += `
          <button class="btn btn-sm btn-outline" onclick="window.toggleUserLock('${escapeHtml(u.username)}', '${isSuspended ? 'ACTIVE' : 'SUSPENDED'}')" title="${toggleBtnTitle}">
            <i class="fa-solid ${toggleIcon}"></i>
          </button>
          <button class="btn btn-sm btn-outline text-rose" onclick="window.deleteUserConfirm('${escapeHtml(u.username)}')" title="Xóa tài khoản vĩnh viễn">
            <i class="fa-solid fa-trash"></i>
          </button>
        `;
      } else {
        actionsHtml += `
          <span style="font-size: 0.75rem; color: var(--text-muted); font-style: italic; padding: 0 0.4rem;">
            ${isRoot ? '(Root)' : '(Đang dùng)'}
          </span>
        `;
      }

      actionsHtml += '</div>';

      return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <i class="fa-solid fa-user-circle" style="color: var(--accent-cyan); font-size: 1.1rem;"></i>
              <strong style="color: #f8fafc;">${escapeHtml(u.username)}</strong>
            </div>
          </td>
          <td>${escapeHtml(u.fullName || '--')}</td>
          <td><span style="color: var(--text-muted); font-size: 0.85rem;">${escapeHtml(u.email || '--')}</span></td>
          <td><span class="role-badge ${roleBadgeClass}">${escapeHtml(u.role)}</span></td>
          <td>${statusBadge}</td>
          <td style="font-size: 0.82rem; color: var(--text-muted);">${lastLogin}</td>
          <td style="text-align: right;">${actionsHtml}</td>
        </tr>
      `;
    }).join('');
  }

  window.toggleUserLock = function(username, targetStatus) {
    const isLocking = targetStatus === 'SUSPENDED';
    showCustomConfirm(
      isLocking ? '<i class="fa-solid fa-lock text-amber"></i> Khóa Tài Khoản' : '<i class="fa-solid fa-lock-open text-emerald"></i> Mở Khóa Tài Khoản',
      `Bạn có chắc chắn muốn ${isLocking ? 'tạm khóa' : 'mở khóa hoạt động'} cho tài khoản [${username}]?`,
      async () => {
        try {
          const res = await fetch('/api/admin/users/toggle-status', {
            method: 'POST',
            headers: getAdminHeaders(),
            body: JSON.stringify({ username })
          });
          const data = await res.json();
          if (res.status === 200) {
            showToast(data.message || '✓ Cập nhật trạng thái thành công!', 'success');
            loadAdminUsers();
          } else {
            showToast(data.message || 'Lỗi cập nhật trạng thái', 'error');
          }
        } catch (e) {
          showToast('Lỗi: ' + e.message, 'error');
        }
      }
    );
  };

  window.deleteUserConfirm = function(username) {
    showCustomConfirm(
      '<i class="fa-solid fa-trash text-rose"></i> Xóa Tài Khoản',
      `Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản [${username}]? Thao tác này không thể hoàn tác!`,
      async () => {
        try {
          const res = await fetch('/api/admin/users/delete', {
            method: 'POST',
            headers: getAdminHeaders(),
            body: JSON.stringify({ username })
          });
          const data = await res.json();
          if (res.status === 200) {
            showToast(data.message || '✓ Đã xóa tài khoản thành công!', 'success');
            loadAdminUsers();
          } else {
            showToast(data.message || 'Lỗi xóa tài khoản', 'error');
          }
        } catch (e) {
          showToast('Lỗi: ' + e.message, 'error');
        }
      }
    );
  };

  if (btnReloadUsers) btnReloadUsers.addEventListener('click', loadAdminUsers);

  if (btnOpenCreateUserModal) {
    btnOpenCreateUserModal.addEventListener('click', () => {
      if (createUserModal) {
        if (newUsernameInput) newUsernameInput.value = '';
        if (newFullNameInput) newFullNameInput.value = '';
        if (newEmailInput) newEmailInput.value = '';
        if (newUserPasswordInput) newUserPasswordInput.value = '';
        if (newUserRoleSelect) newUserRoleSelect.value = 'Support';
        createUserModal.classList.add('active');
        if (newUsernameInput) newUsernameInput.focus();
      }
    });
  }

  if (btnCloseCreateUserModal) btnCloseCreateUserModal.addEventListener('click', () => createUserModal.classList.remove('active'));
  if (btnCancelCreateUser) btnCancelCreateUser.addEventListener('click', () => createUserModal.classList.remove('active'));

  if (btnSubmitCreateUser) {
    btnSubmitCreateUser.addEventListener('click', async () => {
      const username = newUsernameInput ? newUsernameInput.value.trim().toLowerCase() : '';
      const fullName = newFullNameInput ? newFullNameInput.value.trim() : '';
      const email = newEmailInput ? newEmailInput.value.trim() : '';
      const password = newUserPasswordInput ? newUserPasswordInput.value.trim() : '';
      const role = newUserRoleSelect ? newUserRoleSelect.value : 'Support';

      if (!username || username.length < 3) {
        showToast('Tên đăng nhập phải có ít nhất 3 ký tự!', 'error');
        if (newUsernameInput) newUsernameInput.focus();
        return;
      }

      if (!/^[a-zA-Z0-9_\-\.]+$/.test(username)) {
        showToast('Tên đăng nhập chỉ chứa chữ cái, số, gạch dưới (_) hoặc gạch nối (-)!', 'error');
        if (newUsernameInput) newUsernameInput.focus();
        return;
      }

      if (!password || password.length < 6) {
        showToast('Mật khẩu phải có tối thiểu từ 6 ký tự trở lên!', 'error');
        if (newUserPasswordInput) newUserPasswordInput.focus();
        return;
      }

      btnSubmitCreateUser.disabled = true;
      btnSubmitCreateUser.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tạo...';

      try {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: getAdminHeaders(),
          body: JSON.stringify({
            username,
            fullName,
            email,
            password,
            role,
            status: 'ACTIVE'
          })
        });
        const data = await res.json();

        if (res.status === 201 && data.success) {
          showToast(data.message || '✓ Đã tạo tài khoản mới thành công!', 'success');
          createUserModal.classList.remove('active');
          loadAdminUsers();
        } else {
          showToast(data.message || 'Lỗi khi tạo tài khoản!', 'error');
        }
      } catch (e) {
        showToast('Lỗi: ' + e.message, 'error');
      } finally {
        btnSubmitCreateUser.disabled = false;
        btnSubmitCreateUser.innerHTML = '<i class="fa-solid fa-plus"></i> Tạo Tài Khoản';
      }
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
