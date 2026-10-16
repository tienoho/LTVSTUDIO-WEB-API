'use client';

import React, { useState, useEffect } from 'react';
import { History, Search, RotateCcw, ShieldCheck, ShieldAlert, Laptop, Globe, Clock } from 'lucide-react';
import { LicenseService } from '@/services/license.service';
import type { ActivationLog } from '@/types';
import { useToast } from '@/contexts/ToastContext';

export const AuditLogsTab: React.FC = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<ActivationLog[]>([]);
  const [searchKey, setSearchKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async (key: string = '') => {
    try {
      setIsLoading(true);
      const data = await LicenseService.getLogs({ key, limit: 100 });
      setLogs(data);
    } catch {
      showToast('Không thể tải nhật ký kích hoạt', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(searchKey.trim());
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Thành công</span>;
      case 'WRONG_HWID':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">Sai HWID</span>;
      case 'REVOKED':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">Key bị khóa</span>;
      case 'EXPIRED':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-300 border border-slate-500/30">Hết hạn</span>;
      case 'BLOCKED_BRUTE_FORCE':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">Chặn dò mật khẩu</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Nhật Ký Xác Thực & Kiểm Toán Bảo Mật</h3>
            <p className="text-xs text-slate-400">Theo dõi thời gian thực mọi yêu cầu xác thực thiết bị và phòng chống gian lận</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKey}
              onChange={e => setSearchKey(e.target.value)}
              placeholder="Lọc theo mã bản quyền..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
          >
            Tìm
          </button>
          {searchKey && (
            <button
              type="button"
              onClick={() => { setSearchKey(''); fetchLogs(''); }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              title="Xem tất cả nhật ký"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden shadow-xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Thời Gian</th>
                <th className="py-3.5 px-4 font-semibold">Mã Bản Quyền</th>
                <th className="py-3.5 px-4 font-semibold">Mã Máy Tính (HWID)</th>
                <th className="py-3.5 px-4 font-semibold">Địa Chỉ IP</th>
                <th className="py-3.5 px-4 font-semibold">Kết Quả Xác Thực</th>
                <th className="py-3.5 px-4 font-semibold">Thông Điệp Hệ Thống</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i}>
                    <td colSpan={6} className="p-4">
                      <div className="skeleton-box skeleton-shimmer h-6 rounded-lg w-full" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">
                    Chưa có bản ghi nhật ký nào.
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr key={log.id || idx} className="hover:bg-slate-900/40 transition-colors text-xs">
                    <td className="py-3.5 px-4 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {log.createdAt && !isNaN(new Date(log.createdAt).getTime()) ? new Date(log.createdAt).toLocaleString('vi-VN') : (log.createdAt || '--')}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                      {log.licenseKey}
                    </td>

                    <td className="py-3.5 px-4">
                      {log.machineId ? (
                        <div className="flex items-center gap-1 font-mono text-slate-300">
                          <Laptop className="w-3.5 h-3.5 text-slate-500" />
                          <span>{log.machineId.length > 20 ? `${log.machineId.substring(0, 16)}...` : log.machineId}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">None</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="flex items-center gap-1 font-mono">
                        <Globe className="w-3.5 h-3.5 text-slate-500" />
                        {log.ipAddress}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(log.status)}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate" title={log.message}>
                      {log.message}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
