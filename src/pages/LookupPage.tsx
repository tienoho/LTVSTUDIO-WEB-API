import React, { useState } from 'react';
import { Search, Key, ShieldCheck, Laptop, Clock, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { LicenseService } from '../services/license.service';

export const LookupPage: React.FC = () => {
  const [searchKey, setSearchKey] = useState('');
  const [result, setResult] = useState<any | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchKey.trim()) return;

    setError(null);
    setIsLoading(true);
    setHasSearched(true);

    try {
      const data = await LicenseService.lookup(searchKey.trim().toUpperCase());
      setResult(data);
    } catch (err: any) {
      const msg = typeof err?.message === 'string' && err.message !== '[object Object]' && err.message.trim()
        ? err.message.trim()
        : 'Không thể tra cứu thông tin bản quyền.';
      setError(msg);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSearchKey('');
    setResult(null);
    setHasSearched(false);
    setError(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
          <Search className="w-3.5 h-3.5" />
          <span>Cổng Tra Cứu Công Khai</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Kiểm Tra Thông Tin Bản Quyền
        </h1>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Tra cứu tình trạng kích hoạt, gói cước và thiết bị được gán của mã bản quyền LTVStudio
        </p>
      </div>

      {/* Lookup Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-950/80 shadow-2xl">
        <form onSubmit={handleLookup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Nhập Mã Bản Quyền Cần Tra Cứu</label>
            <div className="relative">
              <Key className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchKey}
                onChange={e => setSearchKey(e.target.value.toUpperCase())}
                placeholder="Ví dụ: LTV-PRO-XXXXXX-XXXXXX-XXXXXX"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-base font-mono font-bold text-cyan-400 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors uppercase tracking-wider"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-sm shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              {isLoading ? 'Đang tra cứu...' : 'Tra Cứu Bản Quyền'}
            </button>

            {hasSearched && (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850 text-sm font-semibold transition-colors"
                title="Xóa và tra cứu mã khác"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        {error && (
          <div className="mt-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Results Container */}
        {result && (
          <div className="mt-8 pt-6 border-t border-slate-800/80 animate-in fade-in duration-300">
            {result.exists ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div>
                    <span className="text-xs text-slate-400">Mã Bản Quyền:</span>
                    <div className="text-base font-mono font-extrabold text-cyan-400">{result.key}</div>
                  </div>
                  <div>
                    {result.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-4 h-4" /> Đang Hoạt Động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        <AlertCircle className="w-4 h-4" /> Đã Bị Khóa
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400">Gói Cước Đăng Ký:</span>
                    <div className="text-sm font-bold text-white">{result.type} ({result.plan})</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400">Thời Hạn Sử Dụng:</span>
                    <div className="text-sm font-bold text-purple-400">{result.expiresAt}</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400">Thiết Bị Đang Kích Hoạt (HWID):</span>
                    <div className="text-sm font-mono font-semibold text-emerald-400">
                      {result.maskedMachineId ? (
                        <div className="flex items-center gap-1.5">
                          <Laptop className="w-4 h-4 text-emerald-400" />
                          <span>{result.maskedMachineId}</span>
                        </div>
                      ) : (
                        <span className="text-amber-400 font-sans">Chưa kích hoạt trên máy nào</span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400">Ngày Cấp Mã:</span>
                    <div className="text-sm text-slate-300 font-medium">
                      {result.createdAt ? new Date(result.createdAt).toLocaleDateString('vi-VN') : 'Hệ thống'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center space-y-2 rounded-2xl bg-slate-900/40 border border-slate-800">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Mã bản quyền không tồn tại</h4>
                <p className="text-xs text-slate-400">
                  {result.message || 'Vui lòng kiểm tra lại từng ký tự của mã hoặc liên hệ bộ phận hỗ trợ khách hàng.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
