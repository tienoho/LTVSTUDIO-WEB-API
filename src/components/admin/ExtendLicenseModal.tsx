import React, { useState } from 'react';
import { Calendar, X, CheckCircle2 } from 'lucide-react';

interface ExtendLicenseModalProps {
  isOpen: boolean;
  licenseKey: string;
  onClose: () => void;
  onSubmit: (data: { key: string; days?: number; lifetime?: boolean }) => Promise<void>;
}

export const ExtendLicenseModal: React.FC<ExtendLicenseModalProps> = ({
  isOpen,
  licenseKey,
  onClose,
  onSubmit
}) => {
  const [days, setDays] = useState(30);
  const [lifetime, setLifetime] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await onSubmit({ key: licenseKey, days: Number(days), lifetime });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" />

      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-800/60 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Gia Hạn Bản Quyền</h3>
              <p className="text-xs text-slate-400 font-mono">Key: <span className="text-cyan-400">{licenseKey}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={lifetime}
                onChange={e => setLifetime(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-purple-500 focus:ring-0"
              />
              <div>
                <div className="text-xs font-bold text-slate-100">Nâng cấp lên Vĩnh Viễn (Lifetime)</div>
                <div className="text-[11px] text-slate-400">Không còn giới hạn ngày sử dụng</div>
              </div>
            </label>
          </div>

          {!lifetime && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Số Ngày Gia Hạn Thêm</label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[30, 60, 90, 365].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(d)}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                      days === d
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    +{d} ngày
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                max="3650"
                value={days}
                onChange={e => setDays(parseInt(e.target.value) || 30)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                placeholder="Nhập số ngày tùy chỉnh"
                required
              />
            </div>
          )}

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-sm shadow-md shadow-purple-500/20 hover:shadow-purple-500/40 disabled:opacity-50 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isLoading ? 'Đang lưu...' : 'Xác Nhận Gia Hạn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
