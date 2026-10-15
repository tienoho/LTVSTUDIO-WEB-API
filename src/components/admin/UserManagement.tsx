import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Key, 
  Lock, 
  Unlock, 
  Trash2, 
  ShieldCheck, 
  Mail, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { UserService } from '../../services/user.service';
import type { User, AdminRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface UserManagementProps {
  onOpenChangePasswordForUser: (username: string) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ onOpenChangePasswordForUser }) => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New User Form State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('Support');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await UserService.getUsers();
      setUsers(data);
    } catch (err: any) {
      showToast(err?.message || 'Không thể tải danh sách tài khoản', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (newUsername.length < 3) {
      setCreateError('Tên tài khoản tối thiểu từ 3 ký tự trở lên.');
      return;
    }
    if (newPassword.length < 6) {
      setCreateError('Mật khẩu tối thiểu từ 6 ký tự trở lên.');
      return;
    }

    try {
      setIsSubmitting(true);
      const msg = await UserService.createUser({
        username: newUsername,
        password: newPassword,
        fullName: newFullName,
        email: newEmail,
        role: newRole,
      });
      showToast(msg || 'Tạo tài khoản thành công!', 'success');
      setIsCreateModalOpen(false);
      setNewUsername('');
      setNewPassword('');
      setNewFullName('');
      setNewEmail('');
      setNewRole('Support');
      fetchUsers();
    } catch (err: any) {
      setCreateError(err?.message || 'Lỗi khi tạo tài khoản.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (targetUsername: string) => {
    if (targetUsername.toLowerCase() === 'admin' || targetUsername.toLowerCase() === (currentUser?.username || '').toLowerCase()) {
      showToast('Không thể khóa tài khoản của chính mình hoặc tài khoản admin gốc!', 'error');
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn thay đổi trạng thái tài khoản '${targetUsername}'?`)) return;

    try {
      const msg = await UserService.toggleStatus(targetUsername);
      showToast(msg || 'Cập nhật trạng thái thành công!', 'success');
      fetchUsers();
    } catch (err: any) {
      showToast(err?.message || 'Không thể đổi trạng thái', 'error');
    }
  };

  const handleDeleteUser = async (targetUsername: string) => {
    if (targetUsername.toLowerCase() === 'admin' || targetUsername.toLowerCase() === (currentUser?.username || '').toLowerCase()) {
      showToast('Không được phép xóa tài khoản quản trị gốc (admin)!', 'error');
      return;
    }

    if (!confirm(`CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản '${targetUsername}' khỏi hệ thống?`)) return;

    try {
      const msg = await UserService.deleteUser(targetUsername);
      showToast(msg || 'Đã xóa tài khoản thành công!', 'success');
      fetchUsers();
    } catch (err: any) {
      showToast(err?.message || 'Không thể xóa tài khoản', 'error');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SuperAdmin':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">SuperAdmin (Toàn quyền)</span>;
      case 'Support':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Support (Hỗ trợ)</span>;
      case 'Auditor':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-500/10 text-slate-300 border border-slate-500/30">Auditor (Kiểm toán)</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-500/10 text-slate-400 border border-slate-500/30">{role}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Quản Lý Danh Sách Quản Trị Viên (RBAC Multi-User)</h3>
            <p className="text-xs text-slate-400">Phân bổ vai trò SuperAdmin, Support và Auditor với mật khẩu băm SHA-256 + Salt</p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Thêm Tài Khoản Mới
        </button>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden shadow-xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Tên Tài Khoản (Username)</th>
                <th className="py-3.5 px-4 font-semibold">Họ & Tên / Email</th>
                <th className="py-3.5 px-4 font-semibold">Vai Trò Quản Trị</th>
                <th className="py-3.5 px-4 font-semibold">Trạng Thái</th>
                <th className="py-3.5 px-4 font-semibold">Lần Đăng Nhập Cuối</th>
                <th className="py-3.5 px-4 text-right font-semibold">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <tr key={i}>
                    <td colSpan={6} className="p-4">
                      <div className="skeleton-box skeleton-shimmer h-6 rounded-lg w-full" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">
                    Chưa có tài khoản nào trong hệ thống.
                  </td>
                </tr>
              ) : (
                users.map(u => {
                  const isRootAdmin = u.username.toLowerCase() === 'admin';
                  const isCurrent = u.username.toLowerCase() === (currentUser?.username || '').toLowerCase();
                  const isLocked = u.status === 'SUSPENDED' || u.status === 'LOCKED';

                  return (
                    <tr key={u.username} className={`hover:bg-slate-900/40 transition-colors ${isLocked ? 'opacity-60 bg-rose-950/5' : ''}`}>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-cyan-400">{u.username}</span>
                          {isRootAdmin && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800">Root</span>
                          )}
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">Bạn</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-xs text-slate-200">{u.fullName || u.username}</div>
                        {u.email && <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" />{u.email}</div>}
                      </td>

                      <td className="py-3.5 px-4">
                        {getRoleBadge(u.role)}
                      </td>

                      <td className="py-3.5 px-4">
                        {u.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Đang hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Bị tạm khóa
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {u.lastLoginAt ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            {new Date(u.lastLoginAt).toLocaleString('vi-VN')}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Chưa đăng nhập</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Đổi mật khẩu cho user này */}
                          <button
                            onClick={() => onOpenChangePasswordForUser(u.username)}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Đặt lại mật khẩu cho tài khoản này"
                          >
                            <Key className="w-4 h-4" />
                          </button>

                          {/* Khóa / Mở khóa tài khoản */}
                          {!isRootAdmin && !isCurrent && (
                            <button
                              onClick={() => handleToggleStatus(u.username)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isLocked
                                  ? 'text-emerald-400 hover:bg-emerald-500/10'
                                  : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                              }`}
                              title={isLocked ? 'Mở khóa tài khoản' : 'Tạm khóa tài khoản'}
                            >
                              {isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            </button>
                          )}

                          {/* Xóa tài khoản */}
                          {!isRootAdmin && !isCurrent && (
                            <button
                              onClick={() => handleDeleteUser(u.username)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Xóa tài khoản vĩnh viễn"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tạo Người Dùng Mới */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsCreateModalOpen(false)} className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" />

          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800/60 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Thêm Quản Trị Viên Mới</h3>
                  <p className="text-xs text-slate-400">Mật khẩu sẽ được băm mã hóa SHA-256 + Salt an toàn</p>
                </div>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tên tài khoản (Username) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value.toLowerCase())}
                  placeholder="Ví dụ: support02, auditor_vn"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mật khẩu khởi tạo (tối thiểu 6 ký tự) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu an toàn"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Họ và tên người dùng</label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={e => setNewFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn Tuấn"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email liên hệ</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="tuan.nguyen@ltvstudio.vn"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Vai trò quản trị (RBAC Role)</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as AdminRole)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Support">Support (Cấp phép, Reset HWID, Gia hạn bản quyền)</option>
                  <option value="Auditor">Auditor (Kiểm toán, Tra cứu, Chỉ xem số liệu)</option>
                  <option value="SuperAdmin">SuperAdmin (Toàn quyền hệ thống & Quản lý user)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-sm shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:opacity-50 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmitting ? 'Đang tạo...' : 'Tạo Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
