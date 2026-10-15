import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, Monitor, Download, ExternalLink } from 'lucide-react';
import { LicenseService } from '../../services/license.service';
import type { VersionConfig, AdminRole } from '../../types';
import { useToast } from '../../contexts/ToastContext';

interface OtaConfigTabProps {
  userRole: AdminRole;
}

export const OtaConfigTab: React.FC<OtaConfigTabProps> = ({ userRole }) => {
  const { showToast } = useToast();
  const [config, setConfig] = useState<VersionConfig>({
    version: '1.0.0',
    changelog: '',
    download_url: '',
    force_update: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const canEdit = userRole === 'SuperAdmin';

  const fetchVersion = async () => {
    try {
      setIsLoading(true);
      const data = await LicenseService.getOtaVersion();
      setConfig({
        version: data.version || '1.0.0',
        changelog: data.changelog || data.releaseNotes || '',
        download_url: data.download_url || data.downloadUrl || '',
        force_update: !!data.force_update
      });
    } catch {
      showToast('Không thể tải cấu hình OTA từ máy chủ', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVersion();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      showToast('Tài khoản vai trò của bạn không có quyền cập nhật phiên bản OTA!', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const msg = await LicenseService.updateOtaVersion(config);
      showToast(msg || 'Đã phát hành cấu hình phiên bản OTA mới thành công!', 'success');
      fetchVersion();
    } catch (err: any) {
      showToast(err?.message || 'Lỗi khi cập nhật cấu hình OTA', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Role Notice */}
      {!canEdit && (
        <div id="versionRoleWarning" className="role-warning-banner p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Tài khoản vai trò [<strong>{userRole}</strong>] chỉ có quyền xem thông tin phát hành OTA. Yêu cầu quyền [<strong>SuperAdmin</strong>] để cấu hình phát hành!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OTA Form */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-800">
            <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cấu Hình Phát Hành Cập Nhật OTA</h3>
              <p className="text-xs text-slate-400">Quản lý kiểm tra phiên bản tự động cho phần mềm LTVStudio</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Số Hiệu Phiên Bản (SemVer)</label>
              <input
                type="text"
                disabled={!canEdit}
                value={config.version}
                onChange={e => setConfig(prev => ({ ...prev, version: e.target.value }))}
                placeholder="Ví dụ: 1.0.1, 1.2.0"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Đường Dẫn Tải Về Cài Đặt (Download URL)</label>
              <input
                type="url"
                disabled={!canEdit}
                value={config.download_url}
                onChange={e => setConfig(prev => ({ ...prev, download_url: e.target.value }))}
                placeholder="https://github.com/ltvstudio/releases/releases/download/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nhật Ký Bản Phát Hành (Release Notes / Changelog)</label>
              <textarea
                rows={5}
                disabled={!canEdit}
                value={config.changelog}
                onChange={e => setConfig(prev => ({ ...prev, changelog: e.target.value }))}
                placeholder="Mô tả các tính năng mới, bản vá bảo mật và cải tiến hiệu năng..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 resize-none disabled:opacity-50"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!canEdit}
                  checked={config.force_update}
                  onChange={e => setConfig(prev => ({ ...prev, force_update: e.target.checked }))}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 disabled:opacity-50"
                />
                <div>
                  <div className="text-xs font-bold text-slate-100">Bắt buộc cập nhật ngay (Force Update)</div>
                  <div className="text-[11px] text-slate-400">Yêu cầu người dùng bắt buộc tải phiên bản mới trước khi tiếp tục dùng phần mềm</div>
                </div>
              </label>
            </div>

            {canEdit && (
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-sm shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:opacity-50 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSaving ? 'Đang lưu cấu hình...' : 'Phát Hành Bản Cập Nhật'}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Live Preview on Desktop Client */}
        <div id="preview-desktop-box" className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-purple-400" />
                <h4 className="text-sm font-bold text-white">Xem Trước Giao Diện Desktop Client</h4>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">
                Live Preview
              </span>
            </div>

            {/* Simulated Desktop Window */}
            <div className="rounded-2xl border border-slate-700/80 bg-slate-950 p-5 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                  <span className="text-xs text-slate-400 font-semibold ml-2">LTVStudio Update Assistant</span>
                </div>
                <span className="text-[11px] text-cyan-400 font-mono font-bold">v{config.version}</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800/80 flex items-center justify-center shrink-0">
                    <Download className="w-5 h-5 text-cyan-400 animate-bounce" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">Đã có bản cập nhật mới!</h5>
                    <p className="text-xs text-slate-400">Phiên bản {config.version} đã sẵn sàng tải về.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
                  {config.changelog || '• Tối ưu hóa hiệu năng và sửa lỗi giao diện.'}
                </div>

                {config.force_update && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    Bản cập nhật quan trọng: Yêu cầu cập nhật để tiếp tục sử dụng.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>API Endpoint: <code>/api/transform/version</code></span>
            <a
              href="/api/transform/version"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline flex items-center gap-1"
            >
              Kiểm tra JSON thô <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
