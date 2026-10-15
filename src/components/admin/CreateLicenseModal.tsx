import React, { useState } from 'react';
import { Plus, X, CheckCircle2, Shield, Calendar, User, FileText } from 'lucide-react';

interface CreateLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { plan: string; count: number; customer?: string; notes?: string }) => Promise<void>;
}

export const CreateLicenseModal: React.FC<CreateLicenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [plan, setPlan] = useState('LIFETIME');
  const [count, setCount] = useState(1);
  const [customer, setCustomer] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await onSubmit({ plan, count: Number(count) || 1, customer, notes });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" />

      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800/60 flex items-center justify-center">
              <Plus className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Tạo Mã Bản Quyền Mới</h3>
              <p className="text-xs text-slate-400">Hỗ trợ phát hành đơn lẻ hoặc tạo hàng loạt mã cùng lúc</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Gói Bản Quyền Cấp Phép</label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'LIFETIME', label: 'Vĩnh Viễn (Lifetime)', desc: 'Không giới hạn thời gian' },
                { id: '1_YEAR', label: 'Bản Quyền 1 Năm', desc: 'Sử dụng trong 365 ngày' },
                { id: 'TRIAL', label: 'Dùng Thử 7 Ngày', desc: 'Thử nghiệm tính năng' },
                { id: 'ENTERPRISE', label: 'Doanh Nghiệp', desc: 'Cấp cao cho doanh nghiệp' },
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlan(p.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    plan === p.id
                      ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{p.label}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Số Lượng Key Cần Tạo (1 - 100)</label>
            <input
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={e => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Khách Hàng / Đơn Vị Sử Dụng</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customer}
                onChange={e => setCustomer(e.target.value)}
                placeholder="Ví dụ: Anh Nguyễn Văn A (Zalo: 0988...)"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ghi Chú Đơn Hàng / Thông Tin Bổ Sung</label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Ví dụ: Đơn hàng chuyển khoản VCB, hỗ trợ kích hoạt máy bàn..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>
          </div>

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
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-sm shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:opacity-50 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isLoading ? 'Đang tạo...' : `Xác Nhận Tạo (${count} Key)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
