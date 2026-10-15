import React from 'react';
import { Key, ShieldCheck, Heart, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-md mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 p-0.5">
                <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
                  <Key className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <span className="font-bold text-white text-base">LTVStudio™ Web API</span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Giải pháp cấp phép bản quyền phần mềm đám mây thế hệ mới, hỗ trợ khóa thiết bị phần cứng (HWID) an toàn, cập nhật OTA tức thời và phân quyền quản trị đa tầng RBAC.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Máy chủ API đang hoạt động ổn định (Serverless Neon Cloud)
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Điều Hướng Nhanh</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/" className="hover:text-cyan-400 transition-colors">Cổng Tải & Trang Chủ</Link></li>
              <li><Link to="/lookup" className="hover:text-cyan-400 transition-colors">Tra Cứu Mã Bản Quyền</Link></li>
              <li><Link to="/admin" className="hover:text-cyan-400 transition-colors">Bảng Điều Khiển Quản Trị</Link></li>
              <li><Link to="/docs" className="hover:text-cyan-400 transition-colors">Tài Liệu Kỹ Thuật API</Link></li>
            </ul>
          </div>

          {/* Security & System */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Bảo Mật & Tiêu Chuẩn</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-cyan-400" /> HMAC-SHA256 Signed</li>
              <li className="flex items-center gap-2"><Terminal className="w-4 h-4 text-emerald-400" /> OWASP CWE Defense</li>
              <li className="flex items-center gap-2"><Key className="w-4 h-4 text-indigo-400" /> Salted SHA-256 Hashing</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} LTVStudio Ecosystem. Bản quyền thuộc về LTVStudio Team.
          </div>
          <div className="flex items-center gap-1">
            Thiết kế & phát triển với <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> bởi DeepMind Antigravity Pair-Programming.
          </div>
        </div>
      </div>
    </footer>
  );
};
