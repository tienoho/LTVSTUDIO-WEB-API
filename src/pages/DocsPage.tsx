import React, { useState } from 'react';
import { BookOpen, Key, ShieldCheck, Terminal, Copy, Check, ExternalLink, Code2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export const DocsPage: React.FC = () => {
  const { showToast } = useToast();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    showToast('Đã sao chép mã nguồn mẫu!', 'info');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const rbacMatrix = [
    { action: 'Xem Thống Kê & KPI', endpoint: 'GET /api/admin/stats', superAdmin: true, support: true, auditor: true },
    { action: 'Xem & Lọc Danh Sách Key', endpoint: 'GET /api/admin/licenses', superAdmin: true, support: true, auditor: true },
    { action: 'Tra Cứu Nhật Ký Audit Logs', endpoint: 'GET /api/admin/logs', superAdmin: true, support: true, auditor: true },
    { action: 'Xuất Báo Cáo Excel / CSV', endpoint: 'Client-side Export', superAdmin: true, support: true, auditor: true },
    { action: 'Tạo Mã Bản Quyền Mới', endpoint: 'POST /api/admin/licenses/create', superAdmin: true, support: true, auditor: false },
    { action: 'Mở Khóa Thiết Bị (Reset HWID)', endpoint: 'POST /api/admin/licenses/reset-hwid', superAdmin: true, support: true, auditor: false },
    { action: 'Khóa / Mở Khóa Bản Quyền', endpoint: 'POST /api/admin/licenses/toggle-status', superAdmin: true, support: true, auditor: false },
    { action: 'Gia Hạn Thời Gian Bản Quyền', endpoint: 'POST /api/admin/licenses/extend', superAdmin: true, support: true, auditor: false },
    { action: 'Tạo Phiếu Bàn Giao Khách', endpoint: 'Client Handover Generator', superAdmin: true, support: true, auditor: false },
    { action: 'Xóa Vĩnh Viễn Bản Quyền', endpoint: 'DELETE /api/admin/licenses/:key', superAdmin: true, support: false, auditor: false },
    { action: 'Cấu Hình Bản Phát Hành OTA', endpoint: 'POST /api/admin/version', superAdmin: true, support: false, auditor: false },
    { action: 'Quản Lý Tài Khoản (Users CRUD)', endpoint: '/api/admin/users', superAdmin: true, support: false, auditor: false },
    { action: 'Sao Lưu & Khôi Phục CSDL', endpoint: '/api/admin/backup & restore', superAdmin: true, support: false, auditor: false },
  ];

  return (
    <div id="subtab-docs" className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Tài Liệu Kỹ Thuật Dành Cho Lập Trình Viên</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          LTVStudio Web API & Security Documentation
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          Đặc tả giao thức HTTP RESTful API, thuật toán ký số HMAC-SHA256, kiểm soát khóa máy trạm HWID và ma trận phân quyền RBAC.
        </p>
      </div>

      {/* ── 1. RBAC MATRIX TABLE ───────────────────────────── */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-950/80 shadow-2xl space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Ma Trận Phân Quyền Quản Trị (RBAC Matrix)</h2>
            <p className="text-xs text-slate-400">Quyền hạn thực thi của 3 vai trò: SuperAdmin, Support và Auditor</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Hành Động / Nghiệp Vụ</th>
                <th className="py-3 px-4 font-mono">Endpoint API</th>
                <th className="py-3 px-4 text-center text-cyan-400">SuperAdmin</th>
                <th className="py-3 px-4 text-center text-emerald-400">Support</th>
                <th className="py-3 px-4 text-center text-slate-300">Auditor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {rbacMatrix.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-900/30">
                  <td className="py-3 px-4 font-semibold text-slate-200">{item.action}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{item.endpoint}</td>
                  <td className="py-3 px-4 text-center">
                    {item.superAdmin ? (
                      <span className="text-emerald-400 font-bold">✓ Cho phép</span>
                    ) : (
                      <span className="text-rose-400 font-bold">✗ Chặn (403)</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.support ? (
                      <span className="text-emerald-400 font-bold">✓ Cho phép</span>
                    ) : (
                      <span className="text-rose-400 font-bold">✗ Chặn (403)</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.auditor ? (
                      <span className="text-emerald-400 font-bold">✓ Cho phép</span>
                    ) : (
                      <span className="text-rose-400 font-bold">✗ Chặn (403)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 2. CORE APIS ─────────────────────────────────────── */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          Các Endpoint Cốt Lõi (Core API Endpoints)
        </h2>

        {/* API 1: Verify HWID */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold font-mono text-xs">
                POST
              </span>
              <span className="font-mono text-sm font-bold text-white">/api/auth/verify</span>
            </div>
            <span className="text-xs text-slate-400">Client HWID Verification</span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Dành cho ứng dụng LTVStudio trên máy trạm gửi mã bản quyền và mã phần cứng (HWID) để kiểm tra tính hợp lệ và nhận Token chữ ký số HMAC-SHA256.
          </p>

          <div className="relative">
            <button
              onClick={() => handleCopy(`curl -X POST http://localhost:8080/api/auth/verify \\
  -H "Content-Type: application/json" \\
  -d '{"licenseKey": "LTV-PRO-XXXXXX-XXXXXX", "machineId": "BFEBFBFF000906EA-DISK-SERIAL"}'`, 'c1')}
              className="absolute right-3 top-3 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              title="Sao chép"
            >
              {copiedCode === 'c1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono text-slate-300 overflow-x-auto">
{`curl -X POST http://localhost:8080/api/auth/verify \\
  -H "Content-Type: application/json" \\
  -d '{"licenseKey": "LTV-PRO-XXXXXX-XXXXXX", "machineId": "BFEBFBFF000906EA-DISK-SERIAL"}'`}
            </pre>
          </div>
        </div>

        {/* API 2: Version OTA */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold font-mono text-xs">
                GET
              </span>
              <span className="font-mono text-sm font-bold text-white">/api/transform/version</span>
            </div>
            <span className="text-xs text-slate-400">OTA Auto-Update Checker</span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Trả về số hiệu phiên bản mới nhất, nhật ký bản phát hành, đường dẫn tải về và cờ bắt buộc cập nhật (Force Update).
          </p>

          <div className="relative">
            <button
              onClick={() => handleCopy(`curl http://localhost:8080/api/transform/version`, 'c2')}
              className="absolute right-3 top-3 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              title="Sao chép"
            >
              {copiedCode === 'c2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono text-slate-300 overflow-x-auto">
{`curl http://localhost:8080/api/transform/version`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
