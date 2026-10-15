import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Key, 
  Search, 
  ShieldCheck, 
  BookOpen, 
  Sun, 
  Moon, 
  Menu, 
  LogOut, 
  User as UserIcon,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface NavbarProps {
  onOpenMobileNav: () => void;
  onOpenChangePassword?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileNav, onOpenChangePassword }) => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navLinks = [
    { path: '/', label: 'Trang Chủ', icon: Sparkles },
    { path: '/lookup', label: 'Tra Cứu Key', icon: Search },
    { path: '/admin', label: 'Quản Trị', icon: ShieldCheck },
    { path: '/docs', label: 'Tài Liệu API', icon: BookOpen },
  ];

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'SuperAdmin':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'Support':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Auditor':
        return 'bg-slate-500/10 text-slate-300 border-slate-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Key className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
          <div>
            <span className="text-lg font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              LTVStudio<span className="text-cyan-400 font-extrabold">™</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/50">
              License Hub
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Theme Toggle, Profile Pill / Login, Hamburger */}
        <div className="flex items-center gap-2.5">
          {/* Theme Toggle Button */}
          <button
            id="btnThemeToggle"
            onClick={toggleTheme}
            className="btn-theme-toggle p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-slate-800 transition-all"
            title="Chuyển đổi giao diện Sáng / Tối"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun id="themeToggleIcon" className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon id="themeToggleIcon" className="w-5 h-5 text-indigo-400" />
            )}
          </button>

          {/* Authenticated Profile Pill */}
          {isAuthenticated && user ? (
            <div id="navAdminProfilePill" className="flex items-center gap-2 p-1 pl-3 pr-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-sm">
              <UserIcon className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-slate-200 hidden sm:inline max-w-[120px] truncate">
                {user.fullName || user.username}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-md border font-semibold ${getRoleBadgeClass(user.role)}`}>
                {user.role}
              </span>
              {onOpenChangePassword && (
                <button
                  onClick={onOpenChangePassword}
                  className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Đổi mật khẩu tài khoản"
                >
                  <Key className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                id="btnNavLogout"
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="Đăng xuất khỏi hệ thống"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/admin"
              className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-semibold text-sm shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Key className="w-4 h-4" />
              Đăng Nhập
            </Link>
          )}

          {/* Mobile Hamburger Button */}
          <button
            id="btnMobileNav"
            onClick={onOpenMobileNav}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-slate-800"
            aria-label="Mở Menu Di Động"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
