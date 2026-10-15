import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Key, 
  Search, 
  ShieldCheck, 
  BookOpen, 
  X, 
  LogOut, 
  User as UserIcon,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChangePassword?: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose, onOpenChangePassword }) => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (!isOpen) return null;

  const navLinks = [
    { path: '/', label: 'Trang Chủ', icon: Sparkles },
    { path: '/lookup', label: 'Tra Cứu Key', icon: Search },
    { path: '/admin', label: 'Bảng Quản Trị', icon: ShieldCheck },
    { path: '/docs', label: 'Tài Liệu API', icon: BookOpen },
  ];

  const handleLinkClick = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Overlay Backdrop */}
      <div
        id="mobileDrawerOverlay"
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Drawer Pane */}
      <div
        id="mobileDrawerPane"
        className="mobile-drawer-pane fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-slate-950 border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl transition-transform duration-300"
      >
        <div>
          {/* Header with Brand & Close Button */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 p-0.5">
                <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
                  <Key className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <span className="font-bold text-white text-base">LTVStudio™</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900"
              aria-label="Đóng Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Profile Pill inside Mobile Drawer */}
          <div id="mobileDrawerProfile" className="mt-6 mb-6">
            {isAuthenticated && user ? (
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-800/60 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-100">{user.fullName || user.username}</div>
                    <div className="text-xs text-cyan-400 font-medium">Vai trò: {user.role}</div>
                  </div>
                </div>
                {onOpenChangePassword && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenChangePassword();
                    }}
                    className="p-2 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-800"
                    title="Đổi mật khẩu"
                  >
                    <Key className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <Link
                to="/admin"
                onClick={handleLinkClick}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-sm shadow-md shadow-cyan-500/20"
              >
                <Key className="w-4 h-4" />
                Đăng Nhập Quản Trị
              </Link>
            )}
          </div>

          {/* Mobile Navigation List */}
          <nav className="flex flex-col gap-1.5">
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={handleLinkClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Drawer Actions */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col gap-3">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-850"
          >
            <span className="flex items-center gap-2.5">
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
              Giao diện {theme === 'dark' ? 'Sáng' : 'Tối'}
            </span>
            <span className="text-xs text-slate-500 uppercase">{theme}</span>
          </button>

          {isAuthenticated && (
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-semibold hover:bg-rose-500/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Đăng Xuất Khỏi Thiết Bị
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
