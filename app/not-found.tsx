import React from 'react';
import Link from 'next/link';
import { AlertCircle, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 shadow-2xl shadow-rose-500/20 animate-bounce">
          <AlertCircle className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-extrabold text-white tracking-tight">404</h1>
          <h2 className="text-xl font-bold text-slate-200">Không Tìm Thấy Trang</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Đường dẫn bạn yêu cầu không tồn tại hoặc đã được thay đổi cấu trúc trong hệ thống.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-sm shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all"
          >
            <Home className="w-4 h-4" />
            Về Trang Chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
