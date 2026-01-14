'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, ClipboardList, Settings, Image as ImageIcon, School, Calendar, Database, MessageSquare } from 'lucide-react';
import { getWorkerUrl } from '@/lib/config';
import AdminLayout from '@/components/AdminLayout';

export default function AdminPanel() {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${getWorkerUrl()}/api/stats`);
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    if (isAuthenticated) fetchStats();
  }, [isAuthenticated]);

  const statCards = [
    { label: '总艺人数', value: stats?.totalStars || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '照片总数', value: stats?.totalPhotos || 0, icon: ImageIcon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: '覆盖学校', value: stats?.totalSchools || 0, icon: School, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: '平均年龄', value: `${stats?.averageAge || 0} 岁`, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <AdminLayout title="管理控制台" backHref="/">
      <div className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">欢迎回来</h1>
        <p className="text-gray-500 font-medium text-sm sm:text-base">管理员，请选择需要执行的操作。</p>
      </div>

      {/* 数据概览卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white border border-gray-100 p-4 sm:p-5 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className={`p-1.5 sm:p-2 rounded-xl ${card.bg} ${card.color}`}>
                <card.icon size={18} />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">{card.label}</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-gray-900">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Link href="/admin/stars" className="group p-6 sm:p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
            <Users size={24} />
          </div>
          <h2 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">艺人管理</h2>
          <p className="text-gray-500 text-xs sm:text-sm leading-relaxed font-medium">
            管理艺人资料、教育背景及作品信息。支持新增、修改和删除。
          </p>
        </Link>

        <Link href="/admin/schools" className="group p-6 sm:p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
            <School size={24} />
          </div>
          <h2 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">学校管理</h2>
          <p className="text-gray-500 text-xs sm:text-sm leading-relaxed font-medium">
            维护学校名称列表，支持一键重命名并同步更新所有相关艺人的信息。
          </p>
        </Link>

        <Link href="/admin/logs" className="group p-6 sm:p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
            <ClipboardList size={24} />
          </div>
          <h2 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">系统日志</h2>
          <p className="text-gray-500 text-xs sm:text-sm leading-relaxed font-medium">
            查看系统运行状态及管理员操作历史，确保系统安全可追溯。
          </p>
        </Link>

        <Link href="/admin/comments" className="group p-6 sm:p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
            <MessageSquare size={24} />
          </div>
          <h2 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">评价管理</h2>
          <p className="text-gray-500 text-xs sm:text-sm leading-relaxed font-medium">
            查看和管理用户对艺人的评价。支持编辑内容及删除违规评价。
          </p>
        </Link>

        <Link href="/admin/settings" className="group p-6 sm:p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-gray-500/5 hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-50 text-gray-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 group-hover:bg-gray-600 group-hover:text-white transition-all duration-300">
            <Settings size={24} />
          </div>
          <h2 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">系统设置</h2>
          <p className="text-gray-500 text-xs sm:text-sm leading-relaxed font-medium">
            修改管理员密码、配置站点基本信息及全局功能开关。
          </p>
        </Link>

        <Link href="/admin/export" className="group p-6 sm:p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
            <Database size={24} />
          </div>
          <h2 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">数据备份</h2>
          <p className="text-gray-500 text-xs sm:text-sm leading-relaxed font-medium">
            导出完整的 JSON 备份文件，确保在任何情况下数据都能安全恢复。
          </p>
        </Link>
      </div>
    </AdminLayout>
  );
}
