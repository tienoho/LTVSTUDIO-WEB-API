import React from 'react';
import { Key, Laptop, Clock, Ban, Award, HardDrive, ArrowUpRight } from 'lucide-react';
import type { AdminStats } from '../../types';

interface StatsOverviewProps {
  stats: AdminStats | null;
  isLoading: boolean;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats, isLoading }) => {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-28 rounded-2xl bg-slate-900/60 border border-slate-800/80 skeleton-shimmer" />
        ))}
      </div>
    );
  }

  const activationRate = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;

  const statCards = [
    {
      title: 'Tổng Mã Bản Quyền',
      value: stats.total,
      subtext: 'Đã phát hành trên hệ thống',
      icon: Key,
      color: 'text-cyan-400',
      border: 'border-cyan-500/20',
      bg: 'bg-cyan-500/5',
      glow: 'shadow-cyan-500/10'
    },
    {
      title: 'Đang Hoạt Động (HWID)',
      value: stats.active,
      subtext: `Tỷ lệ kích hoạt: ${activationRate}%`,
      icon: Laptop,
      color: 'text-emerald-400',
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/5',
      glow: 'shadow-emerald-500/10'
    },
    {
      title: 'Chưa Gắn Thiết Bị',
      value: stats.unactivated,
      subtext: 'Sẵn sàng cấp cho khách',
      icon: Clock,
      color: 'text-amber-400',
      border: 'border-amber-500/20',
      bg: 'bg-amber-500/5',
      glow: 'shadow-amber-500/10'
    },
    {
      title: 'Bản Quyền Bị Khóa',
      value: stats.revoked,
      subtext: 'Vi phạm hoặc thu hồi',
      icon: Ban,
      color: 'text-rose-400',
      border: 'border-rose-500/20',
      bg: 'bg-rose-500/5',
      glow: 'shadow-rose-500/10'
    },
    {
      title: 'Gói Vĩnh Viễn (Lifetime)',
      value: stats.lifetime,
      subtext: `Phiên bản OTA: v${stats.currentVersion || '1.0.0'}`,
      icon: Award,
      color: 'text-purple-400',
      border: 'border-purple-500/20',
      bg: 'bg-purple-500/5',
      glow: 'shadow-purple-500/10'
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border ${c.border} ${c.bg} shadow-lg ${c.glow} backdrop-blur-xl relative overflow-hidden transition-all duration-300 hover:scale-[1.02]`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 truncate">{c.title}</span>
                <div className={`p-2 rounded-xl bg-slate-950/60 ${c.color} border border-slate-800`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {c.value.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-slate-400 truncate">
                {c.subtext}
              </div>
            </div>
          );
        })}
      </div>

      {/* Database Provider Banner */}
      {stats.dbProvider && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <span>Nguồn CSDL: <strong className="text-slate-200">{stats.dbProvider}</strong></span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Đồng bộ thời gian thực
          </div>
        </div>
      )}
    </div>
  );
};
