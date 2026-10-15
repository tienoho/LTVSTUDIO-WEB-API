import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Users, 
  UploadCloud, 
  History, 
  Database, 
  ShieldCheck, 
  Lock, 
  User as UserIcon,
  Eye, 
  EyeOff, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { LicenseService } from '../services/license.service';
import type { License, AdminStats, AdminRole } from '../types';

import { StatsOverview } from '../components/admin/StatsOverview';
import { LicenseTable } from '../components/admin/LicenseTable';
import { UserManagement } from '../components/admin/UserManagement';
import { OtaConfigTab } from '../components/admin/OtaConfigTab';
import { AuditLogsTab } from '../components/admin/AuditLogsTab';
import { CreateLicenseModal } from '../components/admin/CreateLicenseModal';
import { ExtendLicenseModal } from '../components/admin/ExtendLicenseModal';
import { ChangePasswordModal } from '../components/modals/ChangePasswordModal';

export const AdminPage: React.FC = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'licenses' | 'users' | 'version' | 'logs' | 'backup'>('licenses');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingLicenses, setIsLoadingLicenses] = useState(true);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [extendKey, setExtendKey] = useState<string | null>(null);
  const [changePasswordTarget, setChangePasswordTarget] = useState<string | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Login Form state (when not authenticated)
  const [username, setUsername] = useState('admin');
  const [secret, setSecret] = useState('');
  const [selectedRole, setSelectedRole] = useState<AdminRole>('SuperAdmin');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const isSuperAdmin = user?.role === 'SuperAdmin';
  const isSupport = user?.role === 'Support';
  const isAuditor = user?.role === 'Auditor';

  const loadData = async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoadingStats(true);
      const statsData = await LicenseService.getStats();
      setStats(statsData);
    } catch {
      // Ignore stats error
    } finally {
      setIsLoadingStats(false);
    }

    try {
      setIsLoadingLicenses(true);
      const licensesData = await LicenseService.getLicenses();
      setLicenses(licensesData);
    } catch (err: any) {
      showToast(err?.message || 'Không thể tải danh sách bản quyền', 'error');
    } finally {
      setIsLoadingLicenses(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!secret.trim()) {
      setLoginError('Vui lòng nhập mật khẩu hoặc khóa quản trị.');
      return;
    }

    try {
      setIsLoggingIn(true);
      await login({ username, secret, role: selectedRole });
      showToast(`Đăng nhập thành công với vai trò ${selectedRole}!`, 'success');
      setSecret('');
    } catch (err: any) {
      setLoginError(err?.message || 'Mã Quản trị viên, tài khoản hoặc mật khẩu không chính xác!');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleResetHwid = async (key: string) => {
    if (!confirm(`Bạn có chắc chắn muốn mở khóa thiết bị (Reset HWID) cho mã ${key}?`)) return;
    try {
      const msg = await LicenseService.resetHwid(key);
      showToast(msg || 'Đã mở khóa thiết bị thành công!', 'success');
      loadData();
    } catch (err: any) {
      showToast(err?.message || 'Không thể mở khóa thiết bị', 'error');
    }
  };

  const handleToggleStatus = async (key: string) => {
    try {
      const res = await LicenseService.toggleStatus(key);
      showToast(res.message || 'Cập nhật trạng thái key thành công!', 'success');
      loadData();
    } catch (err: any) {
      showToast(err?.message || 'Không thể đổi trạng thái', 'error');
    }
  };

  const handleDeleteLicense = async (key: string) => {
    if (!confirm(`CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN mã bản quyền ${key}?`)) return;
    try {
      const msg = await LicenseService.deleteLicense(key);
      showToast(msg || 'Đã xóa bản quyền thành công!', 'success');
      loadData();
    } catch (err: any) {
      showToast(err?.message || 'Không thể xóa bản quyền', 'error');
    }
  };

  const handleCreateSubmit = async (data: { plan: string; count: number; customer?: string; notes?: string }) => {
    try {
      const keys = await LicenseService.createLicenses(data);
      showToast(`Đã tạo thành công ${keys.length} mã bản quyền mới!`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err?.message || 'Lỗi khi tạo mã bản quyền', 'error');
    }
  };

  const handleExtendSubmit = async (data: { key: string; days?: number; lifetime?: boolean }) => {
    try {
      const msg = await LicenseService.extendLicense(data);
      showToast(msg || 'Gia hạn bản quyền thành công!', 'success');
      loadData();
    } catch (err: any) {
      showToast(err?.message || 'Lỗi khi gia hạn bản quyền', 'error');
    }
  };

  const handleBackupDownload = async () => {
    try {
      const backupData = await LicenseService.backupDatabase();
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ltvstudio_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      showToast('Đã tải xuống bản sao lưu CSDL JSON thành công!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Không thể tải bản sao lưu', 'error');
    }
  };

  // If Not Authenticated -> Show Login Screen
  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 bg-slate-950/80 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 p-0.5 mx-auto shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <h2 className="text-xl font-extrabold text-white">Đăng Nhập Quản Trị Viên</h2>
            <p className="text-xs text-slate-400">Hệ thống phân quyền truy cập đa vai trò (RBAC Security)</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Chọn vai trò đăng nhập:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { role: 'SuperAdmin', label: 'SuperAdmin' },
                  { role: 'Support', label: 'Support' },
                  { role: 'Auditor', label: 'Auditor' },
                ].map(r => (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => {
                      setSelectedRole(r.role as any);
                      if (r.role === 'SuperAdmin') setUsername('admin');
                      if (r.role === 'Support') setUsername('support');
                      if (r.role === 'Auditor') setUsername('auditor');
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                      selectedRole === r.role
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-500/20'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tên Tài Khoản</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="admin, support..."
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mật Khẩu</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={secret}
                  onChange={e => setSecret(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-sm shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <Key className="w-4 h-4" />
              {isLoggingIn ? 'Đang xác thực...' : 'Đăng Nhập'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Trung Tâm Quản Trị Bản Quyền (Admin Center)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Chào mừng trở lại, <strong className="text-slate-200">{user.fullName || user.username}</strong> ({user.role})
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setChangePasswordTarget(user.username);
              setIsChangePasswordOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 text-xs font-semibold hover:bg-slate-850 transition-colors"
          >
            <Key className="w-4 h-4" />
            Đổi Mật Khẩu
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <StatsOverview stats={stats} isLoading={isLoadingStats} />

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('licenses')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'licenses'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Key className="w-4 h-4" />
          Danh Sách Bản Quyền
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'users'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            Quản Lý Tài Khoản (Users)
          </button>
        )}

        <button
          onClick={() => setActiveTab('version')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'version'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          Cấu Hình Phát Hành OTA
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'logs'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          Nhật Ký Kích Hoạt (Audit Logs)
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'backup'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            Sao Lưu CSDL JSON
          </button>
        )}
      </div>

      {/* Tab Contents */}
      {activeTab === 'licenses' && (
        <LicenseTable
          licenses={licenses}
          isLoading={isLoadingLicenses}
          userRole={user.role}
          onRefresh={loadData}
          onCreateNew={() => setIsCreateModalOpen(true)}
          onResetHwid={handleResetHwid}
          onToggleStatus={handleToggleStatus}
          onExtend={(key) => setExtendKey(key)}
          onDelete={handleDeleteLicense}
        />
      )}

      {activeTab === 'users' && isSuperAdmin && (
        <UserManagement
          onOpenChangePasswordForUser={(username) => {
            setChangePasswordTarget(username);
            setIsChangePasswordOpen(true);
          }}
        />
      )}

      {activeTab === 'version' && (
        <div id="subtab-version">
          <OtaConfigTab userRole={user.role} />
        </div>
      )}

      {activeTab === 'logs' && (
        <AuditLogsTab />
      )}

      {activeTab === 'backup' && isSuperAdmin && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl max-w-xl space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Sao Lưu & Phục Hồi CSDL JSON</h3>
              <p className="text-xs text-slate-400">Dành riêng cho SuperAdmin để lưu trữ an toàn định kỳ</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Hệ thống hỗ trợ xuất trọn vẹn toàn bộ danh sách mã bản quyền và cấu hình phiên bản thành file JSON chuẩn. Bạn có thể lưu trữ file này để phòng ngừa rủi ro mất mát dữ liệu.
          </p>

          <button
            onClick={handleBackupDownload}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all"
          >
            <Download className="w-4 h-4" />
            Tải Xuống Bản Sao Lưu JSON (Backup)
          </button>
        </div>
      )}

      {/* Modals */}
      <CreateLicenseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      {extendKey && (
        <ExtendLicenseModal
          isOpen={!!extendKey}
          licenseKey={extendKey}
          onClose={() => setExtendKey(null)}
          onSubmit={handleExtendSubmit}
        />
      )}

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        targetUsername={changePasswordTarget || undefined}
      />
    </div>
  );
};
