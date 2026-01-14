'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { getWorkerUrl } from '@/lib/config';
import AdminLayout from '@/components/AdminLayout';
import { ClipboardList, Filter, Loader2, User, Globe, Clock, ChevronLeft, ChevronRight, Activity } from 'lucide-react';

interface Log {
  id: number;
  user_id: number | null;
  username: string | null;
  action: string;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function LogsPage() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<Log[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
    fetchLogs();
  }, [isAuthenticated, isLoading, page, actionFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url = new URL(`${getWorkerUrl()}/api/logs`);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('limit', '20');
      if (actionFilter) {
        url.searchParams.append('action', actionFilter);
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.status === 401) {
        logout();
        router.push('/admin/login');
        return;
      }

      const data = await response.json();
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionStyle = (action: string) => {
    switch (action) {
      case 'login':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'update_password':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'delete':
        return 'bg-red-50 text-red-600 border-red-100';
      case 'upload':
        return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const formatActionName = (action: string) => {
    const map: Record<string, string> = {
      'login': '登录系统',
      'update_password': '修改密码',
      'upload': '上传照片',
      'delete': '删除数据',
      'update': '更新资料'
    };
    return map[action] || action;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading || !isAuthenticated) return null;

  return (
    <AdminLayout 
      title="系统操作日志" 
      loading={loading && logs.length === 0}
      rightElement={
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="pl-9 pr-8 py-2 text-base bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none appearance-none cursor-pointer font-bold text-gray-600"
          >
            <option value="">所有操作</option>
            <option value="login">登录系统</option>
            <option value="upload">上传照片</option>
            <option value="update_password">修改密码</option>
            <option value="delete">删除操作</option>
          </select>
        </div>
      }
    >
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mb-2">系统活动轨迹</h2>
        <p className="text-sm sm:text-base text-gray-500 font-medium">记录所有管理员的关键操作，确保系统安全可追溯。</p>
      </div>

      <div className="space-y-4">
        {/* Mobile View */}
        <div className="grid grid-cols-1 gap-4 sm:hidden">
          {logs.length === 0 && !loading ? (
            <div className="bg-white border border-gray-100 rounded-[2rem] p-12 text-center">
              <Activity className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">暂无相关操作记录</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="bg-white rounded-[1.5rem] border border-gray-100 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ${getActionStyle(log.action)}`}>
                    {formatActionName(log.action)}
                  </span>
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Clock size={12} />
                    <span className="text-[10px] font-bold tabular-nums">{formatDate(log.created_at)}</span>
                  </div>
                </div>
                
                <p className="text-sm font-bold text-gray-700 leading-relaxed">
                  {log.details}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-gray-50 mt-2 pt-4">
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                      <User size={12} className="opacity-60" />
                    </div>
                    <span className="text-xs font-bold">{log.username || '系统'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Globe size={12} />
                    <span className="text-[10px] font-bold tabular-nums font-mono">{log.ip_address || 'Unknown'}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden sm:block bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">操作详情</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">执行人</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">IP 地址</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-24 text-center">
                    <Activity className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">暂无相关操作记录</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <span className={`px-2.5 py-1 rounded-lg border text-xs font-black uppercase tracking-wider ${getActionStyle(log.action)}`}>
                          {formatActionName(log.action)}
                        </span>
                        <span className="text-sm font-bold text-gray-700">{log.details}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-gray-500">
                        <User size={14} className="opacity-60" />
                        <span className="text-sm font-bold">{log.username || '系统'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Globe size={14} className="opacity-60" />
                        <span className="text-sm font-medium font-mono">{log.ip_address || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 text-gray-400">
                        <Clock size={14} />
                        <span className="text-sm font-bold">{formatDate(log.created_at)}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="bg-white sm:bg-transparent p-4 sm:p-0 rounded-[1.5rem] sm:rounded-none border border-gray-100 sm:border-none shadow-sm sm:shadow-none flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <p className="text-xs sm:text-sm text-gray-500 font-medium order-2 sm:order-1">
              共 <span className="text-gray-900 font-bold">{pagination.total}</span> 条记录
            </p>
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all disabled:opacity-30"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex items-center gap-1">
                {/* Mobile: Show only current page info */}
                <div className="sm:hidden px-4 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold">
                  第 {page} / {pagination.totalPages} 页
                </div>
                
                {/* Desktop: Show page numbers */}
                <div className="hidden sm:flex items-center gap-1">
                  {[...Array(pagination.totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                        page === i + 1 
                          ? 'bg-amber-600 text-white' 
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all disabled:opacity-30"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
