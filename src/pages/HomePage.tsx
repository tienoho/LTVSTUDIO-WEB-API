import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Download, 
  Sparkles, 
  ShieldCheck, 
  Key, 
  Zap, 
  Laptop, 
  CheckCircle2, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Lock, 
  User as UserIcon,
  HelpCircle,
  ExternalLink,
  Cpu
} from 'lucide-react';
import { LicenseService } from '../services/license.service';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import type { VersionConfig } from '../types';

export const HomePage: React.FC = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  const { showToast } = useToast();

  const [otaVersion, setOtaVersion] = useState<VersionConfig | null>(null);
  const [username, setUsername] = useState('admin');
  const [secret, setSecret] = useState('');
  const [selectedRole, setSelectedRole] = useState<'SuperAdmin' | 'Support' | 'Auditor'>('SuperAdmin');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    LicenseService.getOtaVersion()
      .then(setOtaVersion)
      .catch(() => {});
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!secret.trim()) {
      setLoginError('Vui lòng nhập mật khẩu hoặc khóa quản trị viên.');
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

  return (
    <div className="space-y-16 pb-20">
      {/* ── 1. HERO SECTION ─────────────────────────────────── */}
      <section className="relative pt-12 sm:pt-20 pb-8 text-center overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-purple-500/20 blur-[120px] pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-6 shadow-sm shadow-cyan-500/20 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Hệ Thống Cấp Phép & Xác Thực Bản Quyền LTVStudio Cloud</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
          Bảo Vệ Bản Quyền &{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Khóa Phần Cứng HWID
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Nền tảng kiểm soát kích hoạt thông minh, chống giả mạo mã máy tính HMAC-SHA256, tự động cập nhật OTA và quản trị phân quyền đa tầng RBAC.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href={otaVersion?.download_url || otaVersion?.downloadUrl || 'https://github.com/ltvstudio/releases/releases'}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Download className="w-4 h-4" />
            Tải LTVStudio v{otaVersion?.version || '1.0.0'}
          </a>

          <Link
            to="/lookup"
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-850 text-slate-200 border border-slate-700/80 font-semibold text-sm hover:border-cyan-500/40 transition-all"
          >
            <Key className="w-4 h-4 text-cyan-400" />
            Tra Cứu Bản Quyền
          </Link>
        </div>
      </section>

      {/* ── 2. FEATURE HIGHLIGHTS ────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
        <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
          <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center mb-4 text-cyan-400 shadow-md shadow-cyan-500/10">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">Khóa Thiết Bị Phần Cứng (HWID)</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Thuật toán phân tích chữ ký phần cứng chống chia sẻ lậu bản quyền, bảo vệ tài sản số tuyệt đối.
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
          <div className="w-12 h-12 rounded-xl bg-blue-950 border border-blue-800 flex items-center justify-center mb-4 text-blue-400 shadow-md shadow-blue-500/10">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">Chữ Ký Số HMAC-SHA256</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Mỗi phiên xác thực cấp mã Token kèm Nonce chống replay attack, bảo mật theo tiêu chuẩn OWASP.
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
          <div className="w-12 h-12 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center mb-4 text-purple-400 shadow-md shadow-purple-500/10">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">Cập Nhật Phần Mềm OTA Tự Động</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Máy trạm tự động đồng bộ bản cập nhật mới nhất, hỗ trợ chính sách bắt buộc cập nhật (Force Update).
          </p>
        </div>
      </section>

      {/* ── 3. ADMIN ACCESS / LOGIN PORTAL ────────────────────── */}
      <section className="max-w-xl mx-auto px-4">
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-950/80 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-3 pb-5 mb-5 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 p-0.5">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Cổng Đăng Nhập Quản Trị Viên</h2>
              <p className="text-xs text-slate-400">Xác thực quyền quản lý hệ thống phân quyền 3 cấp độ (RBAC)</p>
            </div>
          </div>

          {isAuthenticated && user ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="text-sm font-bold text-white">Bạn đang đăng nhập với tư cách: {user.fullName || user.username}</div>
                      <div className="text-xs text-emerald-400">Vai trò quản trị: <strong>{user.role}</strong></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to="/admin"
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-sm shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all"
                >
                  <Key className="w-4 h-4" />
                  Mở Bảng Điều Khiển Quản Trị
                </Link>

                <button
                  id="btnAdminLogout"
                  onClick={logout}
                  className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-rose-400 hover:bg-slate-850 text-sm font-semibold transition-colors"
                >
                  Đăng Xuất
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              {/* Role Fast-Selector Chips */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Chọn nhanh vai trò:</label>
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
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
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

              {/* Username Input with test-compatible ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tên Tài Khoản (Username)</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="adminUsernameInput"
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Nhập username quản trị"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              {/* Password Input with test-compatible ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mật Khẩu / Khóa Quản Trị</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="adminSecretInput"
                    type={showPassword ? 'text' : 'password'}
                    value={secret}
                    onChange={e => setSecret(e.target.value)}
                    placeholder="Nhập mật khẩu tài khoản"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                    required
                  />
                  <button
                    id="btnTogglePasswordEye"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox with test-compatible ID */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    id="checkRememberAdmin"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                  />
                  <span className="text-xs text-slate-400">Ghi nhớ phiên đăng nhập (24 giờ)</span>
                </label>
              </div>

              {/* Error Box with test-compatible ID */}
              {loginError && (
                <div
                  id="adminLoginError"
                  className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium"
                >
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-sm shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" />
                {isLoggingIn ? 'Đang xác thực...' : 'Đăng Nhập Quản Trị Viên'}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};
