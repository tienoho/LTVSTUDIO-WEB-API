'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  Plus, 
  Copy, 
  Check, 
  Unlock, 
  Ban, 
  Calendar, 
  Trash2, 
  FileText, 
  FileSpreadsheet, 
  AlertCircle,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import type { License, AdminRole } from '@/types';
import { useToast } from '@/contexts/ToastContext';

interface LicenseTableProps {
  licenses: License[];
  isLoading: boolean;
  userRole: AdminRole;
  onRefresh: () => void;
  onCreateNew: () => void;
  onResetHwid: (key: string) => Promise<void>;
  onToggleStatus: (key: string) => Promise<void>;
  onExtend: (key: string) => void;
  onDelete: (key: string) => Promise<void>;
  onBulkAction?: (action: string, keys: string[]) => Promise<void>;
}

export const LicenseTable: React.FC<LicenseTableProps> = ({
  licenses,
  isLoading,
  userRole,
  onRefresh,
  onCreateNew,
  onResetHwid,
  onToggleStatus,
  onExtend,
  onDelete,
  onBulkAction,
}) => {
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const isSuperAdmin = userRole === 'SuperAdmin';
  const isSupport = userRole === 'Support';
  const isAuditor = userRole === 'Auditor';

  // Client-side filtering & search
  const filteredLicenses = useMemo(() => {
    return licenses.filter(item => {
      const matchSearch = !search || (
        item.key.toLowerCase().includes(search.toLowerCase()) ||
        (item.customer && item.customer.toLowerCase().includes(search.toLowerCase())) ||
        (item.notes && item.notes.toLowerCase().includes(search.toLowerCase())) ||
        (item.machineId && item.machineId.toLowerCase().includes(search.toLowerCase()))
      );

      let matchStatus = true;
      if (statusFilter === 'UNBOUND') {
        matchStatus = item.status === 'ACTIVE' && !item.machineId;
      } else if (statusFilter !== 'ALL') {
        matchStatus = item.status === statusFilter;
      }

      let matchPlan = true;
      if (planFilter !== 'ALL') {
        matchPlan = (item.plan || '').toUpperCase() === planFilter;
      }

      return matchSearch && matchStatus && matchPlan;
    });
  }, [licenses, search, statusFilter, planFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredLicenses.length / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLicenses.slice(start, start + pageSize);
  }, [filteredLicenses, currentPage]);

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    showToast(`Đã sao chép mã: ${key}`, 'info');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedKeys(paginatedItems.map(l => l.key));
    } else {
      setSelectedKeys([]);
    }
  };

  const handleSelectOne = (key: string) => {
    if (selectedKeys.includes(key)) {
      setSelectedKeys(prev => prev.filter(k => k !== key));
    } else {
      setSelectedKeys(prev => [...prev, key]);
    }
  };

  const exportToCsv = () => {
    if (filteredLicenses.length === 0) {
      showToast('Không có dữ liệu để xuất file!', 'error');
      return;
    }
    const headers = ['Mã Bản Quyền', 'Gói Cước', 'Loại Gói', 'Khách Hàng', 'Thiết Bị (HWID)', 'Trạng Thái', 'Thời Hạn', 'Ngày Tạo'];
    const rows = filteredLicenses.map(l => [
      l.key,
      l.plan,
      l.type,
      `"${(l.customer || '').replace(/"/g, '""')}"`,
      l.machineId || 'Chưa kích hoạt',
      l.status,
      l.expiresAt,
      l.createdAt
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LTVStudio_Licenses_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast('Đã xuất danh sách bản quyền sang file CSV (UTF-8 BOM)!', 'success');
  };

  const handleGenerateHandoverNote = (item: License) => {
    const note = `----------------------------------------
✨ THÔNG TIN BÀN GIAO BẢN QUYỀN LTVSTUDIO
----------------------------------------
• Mã Bản Quyền: ${item.key}
• Gói Cước: ${item.type} (${item.plan})
• Hạn Dùng: ${item.expiresAt === 'LIFETIME' ? 'Vĩnh Viễn (Lifetime)' : item.expiresAt}
• Khách Hàng: ${item.customer || 'Quý khách hàng'}
• Trạng Thái: ${item.machineId ? `Đã kích hoạt (${item.machineId.substring(0, 8)}...)` : 'Sẵn sàng kích hoạt'}
• Hướng dẫn: Mở LTVStudio -> Cài đặt -> Nhập License Key và bấm Kích Hoạt.
• Hỗ trợ kỹ thuật: https://ltvstudio.vn/support
----------------------------------------`;
    navigator.clipboard.writeText(note);
    showToast('Đã sao chép mẫu phiếu bàn giao bản quyền cho khách hàng!', 'success');
  };

  const handleBulkResetHwid = async () => {
    if (selectedKeys.length === 0) return;
    if (onBulkAction) {
      await onBulkAction('reset_hwid', selectedKeys);
      setSelectedKeys([]);
      return;
    }
    if (!confirm(`Bạn có chắc chắn muốn mở khóa thiết bị (Reset HWID) cho ${selectedKeys.length} bản quyền đã chọn?`)) return;
    let count = 0;
    for (const key of selectedKeys) {
      try {
        await onResetHwid(key);
        count++;
      } catch {}
    }
    showToast(`Đã reset HWID cho ${count} mã bản quyền!`, 'success');
    setSelectedKeys([]);
    onRefresh();
  };

  const handleBulkToggleStatus = async () => {
    if (selectedKeys.length === 0) return;
    if (onBulkAction) {
      await onBulkAction('toggle_status', selectedKeys);
      setSelectedKeys([]);
      return;
    }
    let count = 0;
    for (const key of selectedKeys) {
      try {
        await onToggleStatus(key);
        count++;
      } catch {}
    }
    showToast(`Đã đổi trạng thái cho ${count} mã bản quyền!`, 'success');
    setSelectedKeys([]);
    onRefresh();
  };

  const handleBulkDelete = async () => {
    if (selectedKeys.length === 0) return;
    if (onBulkAction) {
      await onBulkAction('delete', selectedKeys);
      setSelectedKeys([]);
      return;
    }
    if (!confirm(`CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN ${selectedKeys.length} mã bản quyền?`)) return;
    let count = 0;
    for (const key of selectedKeys) {
      try {
        await onDelete(key);
        count++;
      } catch {}
    }
    showToast(`Đã xóa vĩnh viễn ${count} mã bản quyền!`, 'success');
    setSelectedKeys([]);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Role Banner Notification */}
      {isAuditor && (
        <div className="role-notice-banner flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <span>Tài khoản vai trò <strong>[Auditor - Kiểm Toán]</strong>: Bạn có quyền xem, tra cứu và xuất báo cáo (Chế độ Chỉ Đọc).</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold border border-slate-700">Chỉ xem</span>
        </div>
      )}

      {isSupport && (
        <div className="role-notice-banner flex items-center justify-between p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span>Tài khoản vai trò <strong>[Support - Hỗ Trợ Khách Hàng]</strong>: Bạn có quyền tạo key, mở khóa HWID, gia hạn bản quyền và cấp phiếu bàn giao.</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-semibold border border-emerald-800">Cấp phép & Hỗ trợ</span>
        </div>
      )}

      {/* Filter & Action Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Bar */}
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Tìm theo mã key, khách hàng, HWID, ghi chú..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">Tất Cả Trạng Thái</option>
            <option value="ACTIVE">Đang Kích Hoạt (Active)</option>
            <option value="UNBOUND">Chưa Gán Máy (Unbound)</option>
            <option value="REVOKED">Bị Khóa (Revoked)</option>
            <option value="EXPIRED">Đã Hết Hạn (Expired)</option>
          </select>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={e => { setPlanFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">Tất Cả Gói Cước</option>
            <option value="LIFETIME">Gói Vĩnh Viễn (Lifetime)</option>
            <option value="1_YEAR">Gói 1 Năm (Annual)</option>
            <option value="TRIAL">Dùng Thử 7 Ngày</option>
            <option value="ENTERPRISE">Doanh Nghiệp (Enterprise)</option>
          </select>

          {(search || statusFilter !== 'ALL' || planFilter !== 'ALL') && (
            <button
              onClick={() => { setSearch(''); setStatusFilter('ALL'); setPlanFilter('ALL'); }}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 text-xs"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCsv}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
            title="Xuất dữ liệu ra file Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Xuất CSV
          </button>

          {!isAuditor && (
            <button
              onClick={onCreateNew}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" />
              Tạo Bản Quyền Mới
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Bar when items selected */}
      {selectedKeys.length > 0 && !isAuditor && (
        <div id="bulkActionBar" className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 shadow-lg backdrop-blur-xl animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
            <Check className="w-4 h-4 text-cyan-400" />
            <span id="bulkSelectedCount">Đã chọn <strong>{selectedKeys.length}</strong> mã bản quyền</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btnBulkResetHwid"
              onClick={handleBulkResetHwid}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-amber-300 hover:bg-slate-800 text-xs font-semibold transition-colors"
            >
              <Unlock className="w-3.5 h-3.5 text-amber-400" />
              Reset HWID Hàng Loạt
            </button>

            <button
              id="btnBulkToggleRevoke"
              onClick={handleBulkToggleStatus}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors"
            >
              <Ban className="w-3.5 h-3.5" />
              Khóa / Mở Khóa
            </button>

            {isSuperAdmin && (
              <button
                id="btnBulkDelete"
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                Xóa Hàng Loạt
              </button>
            )}

            <button
              id="btnBulkDeselect"
              onClick={() => setSelectedKeys([])}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Bỏ chọn tất cả"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main License Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden shadow-xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    disabled={isAuditor}
                    checked={paginatedItems.length > 0 && selectedKeys.length === paginatedItems.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                  />
                </th>
                <th className="py-3.5 px-4 font-semibold">Mã Bản Quyền (License Key)</th>
                <th className="py-3.5 px-4 font-semibold">Gói Cước & Thời Hạn</th>
                <th className="py-3.5 px-4 font-semibold">Khách Hàng & Ghi Chú</th>
                <th className="py-3.5 px-4 font-semibold">Thiết Bị Gắn (HWID)</th>
                <th className="py-3.5 px-4 font-semibold">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right font-semibold">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                // Shimmer Skeleton Loader
                [1, 2, 3, 4, 5, 6].map(i => (
                  <tr key={i}>
                    <td colSpan={7} className="p-4">
                      <div className="skeleton-box skeleton-shimmer h-6 rounded-lg w-full" />
                    </td>
                  </tr>
                ))
              ) : paginatedItems.length === 0 ? (
                // Empty State Card
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="empty-state-card flex flex-col items-center justify-center max-w-sm mx-auto p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-slate-500">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">Không tìm thấy mã bản quyền</h4>
                      <p className="text-xs text-slate-400 mb-4">Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh lại bộ lọc trạng thái.</p>
                      <button
                        onClick={() => { setSearch(''); setStatusFilter('ALL'); setPlanFilter('ALL'); }}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
                      >
                        Đặt Lại Bộ Lọc
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map(item => {
                  const isSelected = selectedKeys.includes(item.key);
                  const isRevoked = item.status === 'REVOKED';

                  return (
                    <tr
                      key={item.key}
                      className={`hover:bg-slate-900/40 transition-colors ${
                        isSelected ? 'bg-cyan-950/20' : ''
                      } ${isRevoked ? 'opacity-70 bg-rose-950/5' : ''}`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          disabled={isAuditor}
                          checked={isSelected}
                          onChange={() => handleSelectOne(item.key)}
                          className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                        />
                      </td>

                      {/* License Key */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-cyan-400 tracking-wider text-xs sm:text-sm">{item.key}</span>
                          <button
                            onClick={() => handleCopyKey(item.key)}
                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                            title="Sao chép mã"
                          >
                            {copiedKey === item.key ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Plan & Expiry */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-xs text-slate-200">{item.type}</div>
                        <div className="text-xs text-slate-400">
                          {item.expiresAt === 'LIFETIME' ? (
                            <span className="text-purple-400 font-medium">Vĩnh viễn (Lifetime)</span>
                          ) : (
                            <span>Hạn: {item.expiresAt.slice(0, 10)}</span>
                          )}
                        </div>
                      </td>

                      {/* Customer & Notes */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-semibold text-slate-200">
                          {item.customer || <span className="text-slate-500 italic">Chưa gán</span>}
                        </div>
                        {item.notes && <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{item.notes}</div>}
                      </td>

                      {/* Machine ID (HWID) */}
                      <td className="py-3.5 px-4">
                        {item.machineId ? (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-md w-fit">
                            <span>{item.machineId.substring(0, 8)}...{item.machineId.substring(item.machineId.length - 4)}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-400/90 font-medium bg-amber-950/30 border border-amber-800/30 px-2 py-0.5 rounded-md">
                            Chưa gắn máy
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {item.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Bị khóa
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {isAuditor ? (
                          <span className="text-xs text-slate-500 italic">Chỉ xem</span>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Reset HWID Button */}
                            {item.machineId && (
                              <button
                                onClick={() => onResetHwid(item.key)}
                                className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                                title="Mở khóa thiết bị (Reset HWID khi khách đổi máy)"
                              >
                                <Unlock className="w-4 h-4" />
                              </button>
                            )}

                            {/* Toggle Lock / Active Button */}
                            <button
                              onClick={() => onToggleStatus(item.key)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isRevoked
                                  ? 'text-emerald-400 hover:bg-emerald-500/10'
                                  : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                              }`}
                              title={isRevoked ? 'Mở khóa key' : 'Khóa key tạm thời'}
                            >
                              <Ban className="w-4 h-4" />
                            </button>

                            {/* Extend Button */}
                            <button
                              onClick={() => onExtend(item.key)}
                              className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Gia hạn thời gian bản quyền"
                            >
                              <Calendar className="w-4 h-4" />
                            </button>

                            {/* Handover Note */}
                            <button
                              onClick={() => handleGenerateHandoverNote(item)}
                              className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Tạo phiếu bàn giao gửi khách (Zalo/Telegram)"
                            >
                              <FileText className="w-4 h-4" />
                            </button>

                            {/* SuperAdmin Only: Delete Button */}
                            {isSuperAdmin && (
                              <button
                                onClick={() => onDelete(item.key)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                title="Xóa vĩnh viễn khỏi CSDL (SuperAdmin only)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Hiển thị {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredLicenses.length)} trên tổng số {filteredLicenses.length} bản quyền
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-800 disabled:opacity-40 hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-200">Trang {currentPage} / {totalPages}</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-800 disabled:opacity-40 hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
