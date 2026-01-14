'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { getWorkerUrl } from '@/lib/config';
import AdminLayout from '@/components/AdminLayout';
import { School, Edit2, Trash2, Check, X, Loader2, Users } from 'lucide-react';

interface SchoolData {
  name: string;
  star_count: number;
}

export default function SchoolsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
    fetchSchools();
  }, [isAuthenticated, isLoading, router]);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${getWorkerUrl()}/api/schools`);
      const data = await response.json();
      setSchools(data);
    } catch (error) {
      console.error('Failed to fetch schools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async (oldName: string) => {
    if (!newName.trim() || newName === oldName) {
      setEditingName(null);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${getWorkerUrl()}/api/schools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ oldName, newName })
      });

      if (response.ok) {
        await fetchSchools();
        setEditingName(null);
        setNewName('');
      } else {
        const error = await response.json();
        alert('修改失败: ' + (error.error || '未知错误'));
      }
    } catch (error) {
      alert('修改失败: 网络错误');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !isAuthenticated) return null;

  return (
    <AdminLayout 
      title="学校/机构管理" 
      loading={loading && schools.length === 0}
    >
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mb-2">学校列表</h2>
        <p className="text-sm sm:text-base text-gray-500 font-medium">管理系统中录入的所有学校及机构名称，支持批量重命名同步。</p>
      </div>

      <div className="space-y-4">
        {/* Mobile View */}
        <div className="grid grid-cols-1 gap-4 sm:hidden">
          {schools.length === 0 && !loading ? (
            <div className="bg-white border border-gray-100 rounded-[2rem] p-12 text-center text-gray-400 font-medium">
              暂无学校数据
            </div>
          ) : (
            schools.map((school) => (
              <div key={school.name} className="bg-white rounded-[1.5rem] border border-gray-100 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {editingName === school.name ? (
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full px-3 py-1.5 text-base bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                          <School size={16} />
                        </div>
                        <span className="font-bold text-gray-900 truncate">{school.name}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 shrink-0">
                    {editingName === school.name ? (
                      <>
                        <button
                          onClick={() => handleRename(school.name)}
                          disabled={submitting}
                          className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                        >
                          {submitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                        </button>
                        <button
                          onClick={() => { setEditingName(null); setNewName(''); }}
                          className="p-2 bg-gray-100 text-gray-500 rounded-xl"
                        >
                          <X size={18} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => { setEditingName(school.name); setNewName(school.name); }}
                        className="p-2 bg-white border border-gray-100 text-indigo-600 rounded-xl shadow-sm"
                      >
                        <Edit2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-1 border-t border-gray-50 mt-2 pt-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">关联艺人</span>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-bold">
                    <Users size={14} />
                    {school.star_count}
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
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">学校名称</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">关联艺人</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {schools.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-8 py-12 text-center text-gray-400 font-medium">
                    暂无学校数据
                  </td>
                </tr>
              ) : (
                schools.map((school) => (
                  <tr key={school.name} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-5">
                      {editingName === school.name ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="flex-1 px-3 py-1.5 text-base bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                            <School size={16} />
                          </div>
                          <span className="font-bold text-gray-900">{school.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-bold">
                        <Users size={14} />
                        {school.star_count}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      {editingName === school.name ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRename(school.name)}
                            disabled={submitting}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors disabled:opacity-50"
                          >
                            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                          </button>
                          <button
                            onClick={() => { setEditingName(null); setNewName(''); }}
                            className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingName(school.name); setNewName(school.name); }}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
